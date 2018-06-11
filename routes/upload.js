const path = require('path');
const config = require(path.join(__dirname, '../config'))
const fs = require('fs-extra');
const Busboy = require('busboy');
const crypto = require('crypto');
const sourcePath = config.fileConfig.uploadDir || path.join(__dirname, '../tmpDir')
const previewPath = config.fileConfig.previewDir || path.join(__dirname, '../previewDir')
const sql = require('./assets/sql/sql')
const child = require('child_process')
const imgPresser = path.join(__dirname, './assets/lib/img_presser.js')
const imgArr = ['jpeg', 'png']

//创建文件缓存目录
fs.ensureDir(sourcePath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + sourcePath + '文件夹')
    }, 5000)
  }
})

fs.ensureDir(previewPath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + previewPath + '文件夹')
    }, 5000)
  }
})

const upload = function(req, res) {
  let info = {
    flag: false,
    message: '',
    data: null
  }
  return new Promise((resolve, reject) => {
    // console.log(req.headers)
    // console.log(req)
    let fileSize = req.headers['content-length']
    if (req.headers) {
      if (fileSize > 1000000000) {
        info.message = '超过最大上传文件大小限制(1G)！'
        reject(message)
        return false;
      }

    } else {
      info.message = 'headers不正确'
      reject(message)
      return false;
    }
    let busboy = new Busboy({
      headers: req.headers
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      console.log('Field [' + fieldname + ']: value: ');
      // console.log(busboy)
    });
    let uploadFilesArr = {}
    let currentFileSize = 0
    let fileCount = 0
    let completeFileNum = 0

    //busboy监听文件流进入
    //每进入一个文件流，就出发一次file事件
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

      fileCount++;
      console.log(fileCount)
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
        uploadFilesArr[fieldname] = {
          name: filename,
          md5: crypto.createHash('md5'),
          fileSize: 0,
          tempPath: filePath,
          suffixName: suffixName
        }
      }

      //有文件片段进入
      file.on('data', function(data) {
        uploadFilesArr[fieldname].fileSize += data.length
        uploadFilesArr[fieldname].md5.update(data)

        currentFileSize += data.length

        //此处是总的文件传输进度
        console.log(currentFileSize / fileSize)
      });

      //当单个文件流结束时，完成当前文件的md5计算
      file.on('end', function() {
        uploadFilesArr[fieldname].md5 = uploadFilesArr[fieldname].md5.digest('hex')
        console.log('File [' + fieldname + '] Finished');
        console.log(uploadFilesArr)
      });

      //当文件流结束时触发
      file.on('close', function() {
        console.log('File [' + fieldname + '] closed');
      });

      //监听文件写入事件，当写入错误时，则终止请求
      writerStream.on('error', (err) => {
          info.message = err
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
    busboy.on('finish', async function() {
      console.log('Done parsing form!')
      let eventNum = 0
        //检测文件是否写入完毕
        //若文件已经写入完毕，则立即执行转存储函数transfer
      if (fileCount === completeFileNum) {
        let result = await transfer(uploadFilesArr)
        console.log("ok----------->")
        console.log(result)
        if (result.flag) {
          resolve(result)
        } else {
          reject(JSON.stringify(result))
        }
      } else {
        //若未写入完毕，则开始轮询
        let timer = setInterval(async() => {
          console.log("第" + eventNum + "次轮询-------")
            //写入过慢时放弃轮询，直接放弃
          if (eventNum > 3) {
            clearInterval(timer)
            reject({
              flag: false,
              message: "文件系统出错!"
            })
          }
          //检测文件是否写入完毕
          if (fileCount === completeFileNum) {
            clearInterval(timer)
              //开始文件迁移操作
            let result = await transfer(uploadFilesArr)
            console.log("ok----------->")
            console.log(result)
            if (result.flag) {
              resolve(result)
            } else {
              reject(JSON.stringify(result))
            }
          }
          eventNum++;
        }, 1500)
      }

    });
    req.pipe(busboy);
  })

}

async function transfer(uploadFilesArr) {
  let info = {
    flag: false,
    message: '',
    data: null
  }
  info.flag = true
  info.message = "上传成功"
  info.data = {}
  info.data['fileList'] = []
  for (let i in uploadFilesArr) {
    let fileMD5 = uploadFilesArr[i].md5
    let filePath = uploadFilesArr[i].tempPath
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
    let newFilePath = path.normalize(md5Path + '/' + uploadFilesArr[i].name)
    let baseUrl = new Buffer(fileMD5).toString('base64')
    console.log("开始" + i)
    try {
      //同步检测
      let existFlag = await fs.pathExists(newFilePath)

      let sqlData = {
        fileName: uploadFilesArr[i].name,
        suffixName: uploadFilesArr[i].suffixName,
        fileSize: uploadFilesArr[i].fileSize,
        downloadUrl: '/file/' + baseUrl + '/' + uploadFilesArr[i].name,
        previewUrl: '',
        md5: fileMD5
      }

      if (imgArr.indexOf(uploadFilesArr[i].suffixName) !== -1) {
        sqlData.previewUrl = '/file_preview/' + baseUrl + '/' + uploadFilesArr[i].name
        sqlData.fileType = 'img'
      }
      await fs.ensureDir(md5Path)
      await fs.rename(filePath, newFilePath)
      let data = await sql.addFiles(sqlData)
      if (data.flag) {
        let pointer = info.data['fileList']
        pointer.push({
          name: uploadFilesArr[i].name,
          fileUrl: config.serverUrl + config.projectName + sqlData.downloadUrl
        })

        // flag = 1 是文件已经存在的情况
        if (data.flag !== 1) {
          if (sqlData.fileType === 'img') {
            // 是图片的话，增加一个预览地址
            pointer[pointer.length - 1].filePreviewUrl = config.serverUrl + config.projectName + sqlData.previewUrl
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
              fileName: uploadFilesArr[i].name
            })
          }
        }

      } else {
        info.flag = false
        info.message = "上传文件出错!" + data.message
        info.data['fileList'].push({
          name: uploadFilesArr[i].name,
          error: data.message
        })
        break;
      }
    } catch (e) {
      console.error(e)
      info.flag = false
      info.message = "上传文件出错!"
      info.data['fileList'].push({
        name: uploadFilesArr[i].name,
        error: e
      })
      break;
    }
  }
  return info
}

module.exports = upload