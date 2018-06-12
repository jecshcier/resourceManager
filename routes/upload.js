const path = require('path');
const CONFIG = require(path.join(__dirname, '../config'))
const fs = require('fs-extra');
const Busboy = require('busboy');
const crypto = require('crypto');
const sourcePath = CONFIG.fileConfig.uploadDir || path.join(__dirname, '../tmpDir')
const previewPath = CONFIG.fileConfig.previewDir || path.join(__dirname, '../previewDir')
const sql = require('./assets/sql/sql')
const child = require('child_process')
const imgPresser = path.join(__dirname, './assets/lib/img_presser.js')
const imgArr = ['jpeg', 'png']

//创建文件缓存目录
fs.ensureDir(sourcePath, (err) => {
  if (err) {
    console.err(err)
    setInterval(() => {
      console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + sourcePath + '文件夹')
    }, 5000)
  }
})

fs.ensureDir(previewPath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.err('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + previewPath + '文件夹')
    }, 5000)
  }
})

const upload = function(req, res) {
  return new Promise((resolve, reject) => {
    // console.log(req.headers)
    let fileSize = req.headers['content-length']
    if (req.headers) {
      console.log(fileSize)
      console.log(CONFIG.fileConfig.fileOptions.maxFileSize)
      if (fileSize > CONFIG.fileConfig.fileOptions.maxFileSize) {
        reject({
          error: '超过最大上传文件大小限制(2G)！'
        })
        return false;
      }

    } else {
      reject({
        error: 'headers不正确'
      })
      return false;
    }
    let busboy = new Busboy({
      headers: req.headers
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fieldCount++;
      console.log("----------------------<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>")
      console.log(fieldname)

      console.log('Field [' + fieldname + ']: value: ');
      // console.log(busboy)
    });
    let uploadFilesArr = {}
    let currentFileSize = 0
    let fileCount = 0
    let fieldCount = 0
    let completeFileNum = 0

    //busboy监听文件流进入
    //每进入一个文件流，就出发一次file事件
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      fieldCount++;
      fileCount++;
      console.log(fileCount)

      if (fieldname === '' || !fieldname) {
        reject({
          error: '未设置参数名称！'
        })
        return false
      }

      if (fileCount > CONFIG.fileConfig.fileOptions.maxFileNum) {
        reject({
          error: "超过最大文件数!"
        })
        return false
      }
        //准备临时文件名
      let fileNamePrefix = '/' + Date.now() + '-'
      let storeFileName = fileNamePrefix + filename
        //临时储存地址
      let filePath = path.normalize(sourcePath + storeFileName)
        //创建一个文件写入流
      let writerStream = fs.createWriteStream(filePath)

      //若文件不在文件列表中，则说明是一个新的文件流，初始化文件属性
      //若文件在文件列表中，则继续计算文件md5值和文件大小
      if (!uploadFilesArr.hasOwnProperty(fieldname)) {
        let pointer = filename.split('.')
        let suffixName = pointer[pointer.length - 1].toLowerCase()
        uploadFilesArr[fieldname] = []
        uploadFilesArr[fieldname].push({
          name: filename,
          md5: crypto.createHash('md5'),
          fileSize: 0,
          tempPath: filePath,
          suffixName: suffixName
        })
      } else {
        let pointer = filename.split('.')
        let suffixName = pointer[pointer.length - 1].toLowerCase()
        uploadFilesArr[fieldname].push({
          name: filename,
          md5: crypto.createHash('md5'),
          fileSize: 0,
          tempPath: filePath,
          suffixName: suffixName
        })
      }
      let sp = uploadFilesArr[fieldname]
      let currentFile = sp[sp.length - 1]
        //有文件片段进入
      file.on('data', function(data) {
        let pointer = uploadFilesArr[fieldname]
        currentFile.fileSize += data.length
        currentFile.md5.update(data)
        currentFileSize += data.length

        //此处是总的文件传输进度
        console.log(currentFileSize / fileSize)
      });

      //当单个文件流结束时，完成当前文件的md5计算
      file.on('end', function() {
        currentFile.md5 = currentFile.md5.digest('hex')
        console.log('File [' + fieldname + '] Finished');
      });

      //当文件流结束时触发
      file.on('close', function() {
        console.log('File [' + fieldname + '] closed');
      });

      //监听文件写入事件，当写入错误时，则终止请求
      writerStream.on('error', (err) => {
          writerStream.end(err);
          console.error(err)
          req.socket.destroy();
        })
        //监听文件写入完成事件，写入某个文件时，则增加一个计数
        //只有当写入完成的文件计数等于上传的文件总数时，才开始执行文件储存操作
      writerStream.on('finish', () => {
        console.log("文件" + fieldname + "上传完成")
        completeFileNum++
      });

      //将文件流pipe到文件写入流中
      file.pipe(writerStream)
    });

    //当所有请求的文件流数据都接受完毕时，执行此监听事件
    //执行此事件主要是为了做文件的转存，从临时目录存到文件存储的目录。
    //此操作需要等待文件流写入完毕，所以需要轮询，等到文件总数==文件流写入完成数量时，开始遍历文件进行迁移。
    busboy.on('finish', function() {
      console.log(uploadFilesArr)
      console.log('Done parsing form!')
      let eventNum = 0
        //检测文件是否写入完毕
        //若文件已经写入完毕，则立即执行转存储函数transfer
      if (fileCount === completeFileNum) {
        transfer(uploadFilesArr, (dataList) => {
          resolve(dataList)
        })
      } else {
        //若未写入完毕，则开始轮询
        let timer = setInterval(() => {
          console.log("第" + eventNum + "次轮询-------")
            //写入过慢时放弃轮询，直接放弃
          if (eventNum > 3) {
            clearInterval(timer)
            reject({
              error: "文件系统出错!"
            })
          }
          //检测文件是否写入完毕
          if (fileCount === completeFileNum) {
            clearInterval(timer)
              //开始文件迁移操作
            transfer(uploadFilesArr, (dataList) => {
              resolve(dataList)
            })
          }
          eventNum++;
        }, 1500)
      }
    });
    req.pipe(busboy);
  })

}

function transfer(uploadFilesArr, callback) {
  let dataList = {}
  let comCount = 0
  let fileNum = 0
    // 遍历出文件总数
  for (let index in uploadFilesArr) {
    for (var i = 0; i < uploadFilesArr[index].length; i++) {
      fileNum++;
    }
  }
  for (let index in uploadFilesArr) {
    dataList[index] = []
    for (var i = 0; i < uploadFilesArr[index].length; i++) {
      // 异步非阻塞提高性能
      let uploadArr = uploadFilesArr[index]
      console.log(uploadArr[i])
      fileOper(uploadArr[i], (data) => {
        console.log(data)
        dataList[index].push(data)
        comCount++;
        if (comCount === fileNum) {
          callback(dataList)
        }
      })
    }
  }
}

async function fileOper(uploadFile, callback) {
  let fileMD5 = uploadFile.md5
  let filePath = uploadFile.tempPath
  console.log('fileMD5 --->', fileMD5)
  let md5Path = ''
  for (let i = 0; i < fileMD5.length; i++) {
    md5Path += fileMD5[i]
    if (!(i % 5) && i) {
      md5Path += '/'
    }
  }
  console.log('md5Path--->', md5Path)
  let preMD5Path = path.normalize(previewPath + '/' + md5Path)
  md5Path = path.normalize(sourcePath + '/' + md5Path)
  let newFilePath = path.normalize(md5Path + '/' + uploadFile.name)
  let baseUrl = new Buffer(fileMD5).toString('base64')
  console.log("开始 -------------------------->")
  try {
    //同步检测
    let existFlag = await fs.pathExists(newFilePath)

    let sqlData = {
      fileName: uploadFile.name,
      suffixName: uploadFile.suffixName,
      fileSize: uploadFile.fileSize,
      downloadUrl: '/file/' + baseUrl + '/' + uploadFile.name,
      previewUrl: '',
      md5: fileMD5
    }

    if (imgArr.indexOf(uploadFile.suffixName) !== -1) {
      sqlData.previewUrl = '/file_preview/' + baseUrl + '/' + uploadFile.name
      sqlData.fileType = 'img'
    }
    // 判断文件夹路径存在
    await fs.ensureDir(md5Path)
      // 将文件从临时路径移动到真实路径
    await fs.rename(filePath, newFilePath)
      // 写入数据库
    let data = await sql.addFiles(sqlData)

    if (data.flag) {
      // 初始化返回对象
      let pointer = {
          name: uploadFile.name,
          fileUrl: CONFIG.serverUrl + CONFIG.projectName + sqlData.downloadUrl
        }
        // 是图片的话，增加一个预览地址
      if (sqlData.fileType === 'img') {
        pointer.filePreviewUrl = CONFIG.serverUrl + CONFIG.projectName + sqlData.previewUrl
          // flag = 1 是文件已经存在的情况
        if (data.flag !== 1) {
          // 异步创建缩略图
          let p = child.fork(imgPresser, [], {})
          p.on('message', (m) => {
            if (!m.flag) {
              console.log(m.message)
              return;
            }
            console.log("缩略图创建完成！")
          })
          p.send({
            filePath: newFilePath,
            outputPath: preMD5Path,
            fileName: uploadFile.name,
            imgWidth: CONFIG.fileConfig.pressImageW
          })
        }
      }
      // 一切没有问题就callback回去
      callback(pointer)
    } else {
      // 如果数据库插入失败了，这个文件也将标志为插入失败
      callback({
        name: uploadFile.name,
        error: data.message
      })
    }
  } catch (e) {
    // 在创建文件夹、移动文件等操作时抛出异常就返回
    callback({
      name: uploadFile.name,
      error: e
    })
  }
}

module.exports = upload