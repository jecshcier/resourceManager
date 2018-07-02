const path = require('path');
const CONFIG = require(path.join(__dirname, '../config'))
const fs = require('fs-extra');
const Busboy = require('busboy');
const crypto = require('crypto');
const sourcePath = CONFIG.fileConfig.uploadDir || path.join(__dirname, '../tmpDir')
const previewPath = CONFIG.fileConfig.previewDir || path.join(__dirname, '../previewDir')
const base64FilePath = CONFIG.fileConfig.base64Dir || path.join(__dirname, '../base64Dir')

const sql = require('./assets/sql/sql')
const child = require('child_process')
const uuid = require('uuid');
const imgPresser = path.join(__dirname, './assets/lib/img_presser.js')
const imgArr = ['jpeg', 'png', 'jpg']

//创建文件缓存目录
fs.ensureDir(sourcePath, (err) => {
  if (err) {
    console.err(err)
    setInterval(() => {
      console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + sourcePath + '文件夹')
    }, 5000)
  }
})

//创建文件预览目录
fs.ensureDir(previewPath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.err('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + previewPath + '文件夹')
    }, 5000)
  }
})

//创建base64文件目录
fs.ensureDir(base64FilePath, (err) => {
  if (err) {
    console.log(err)
    setInterval(() => {
      console.err('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + previewPath + '文件夹')
    }, 5000)
  }
})

const uploadFiles = {
  upload: function(req, res) {
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
        console.log('Field [' + fieldname + ']: value: ');
        // console.log(busboy)
      });
      let uploadFilesArr = {}
      let currentFileSize = 0
      let fileCount = 0
      let fieldCount = 0
      let completeFileNum = 0
      let dataList = {}

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
        let writerStream = fs.createWriteStream(filePath, {
          autoClose: true
        })

        let pointer = filename.split('.')
        let suffixName = pointer[pointer.length - 1].toLowerCase()
          // 将文件属性挂到文件写入流对象中
        writerStream.fileData = {
          name: filename,
          md5: crypto.createHash('md5'),
          fileSize: 0,
          tempPath: filePath,
          suffixName: suffixName
        }

        //若文件不在文件列表中，则说明是一个新的文件流，初始化文件属性
        //若文件在文件列表中，则继续计算文件md5值和文件大小
        if (!uploadFilesArr.hasOwnProperty(fieldname)) {
          let pointer = filename.split('.')
          let suffixName = pointer[pointer.length - 1].toLowerCase()
          uploadFilesArr[fieldname] = []
          dataList[fieldname] = []
        }

        //有文件片段进入
        file.on('data', function(data) {
          currentFileSize += data.length
          writerStream.fileData.md5.update(data)
          writerStream.fileData.fileSize += data.length

          //此处是总的文件传输进度
          console.log(currentFileSize / fileSize)
        });

        //当单个文件流结束时，完成当前文件的md5计算
        file.on('end', function() {
          console.log(writerStream.fileData)
          writerStream.fileData.md5 = writerStream.fileData.md5.digest('hex')
          uploadFilesArr[fieldname].push(writerStream.fileData)
          console.log('文件流' + writerStream.fileData.name + '传输完毕------------------->');
        });

        //当文件流结束时触发
        file.on('close', function() {
          console.log('文件流' + writerStream.fileData.name + "关闭---->");
        });

        //监听文件写入事件，当写入错误时，则终止请求
        writerStream.on('error', (err) => {
          writerStream.end(err);
          console.error(err)
          dataList[fieldname].push({
            name: fileName,
            error: "文件写入失败！"
          })
          completeFileNum++
        })

        //监听文件写入完成事件，写入某个文件时，则增加一个计数
        writerStream.on('finish', () => {
          console.log("文件" + writerStream.fileData.name + "写入完成---------------------------->")
          fileOper(writerStream.fileData, (data) => {
            console.log("===========================>")
            console.log(data)
            completeFileNum++
            dataList[fieldname].push(data)
          })
        });
        //将文件流pipe到文件写入流中
        file.pipe(writerStream)
      });

      //当所有请求的文件流数据都接受完毕时，执行此监听事件
      busboy.on('finish', function() {
        console.log(uploadFilesArr)
          // 遍历所有文件，计算出文件总数
        let fileNum = 0
        for (let index in uploadFilesArr) {
          for (var i = 0; i < uploadFilesArr[index].length; i++) {
            fileNum++;
          }
        }
        // 如果文件总数等于当前已经转存好的文件数，则返回
        if (fileNum === completeFileNum) {
          resolve(dataList)
          console.log("ok")
          return false
        }
        // 开启一个轮询，检测文件是否写入完毕
        let timer = setInterval(() => {
          console.log(fileNum)
          console.log(completeFileNum)
          if (fileNum === completeFileNum) {
            clearInterval(timer)
            resolve(dataList)
          }
        }, 50)
      });
      req.pipe(busboy);
    })

  },
  upload_base64: function(req, res) {
    return new Promise(async(resolve, reject) => {
      let pos = req.body.extName
      let base64data = req.body.data
      let content = new Buffer(base64data, 'base64')
      let fileID = uuid.v1().replace(/-/g, '')
      let fileName = fileID + '.' + pos
      let sqlData = {
        fileID: fileID,
        fileName: fileID + '.' + pos,
        suffixName: pos,
        fileSize: null,
        downloadUrl: '/file/' + fileName,
        previewUrl: '',
        fileSysPath: '/' + fileName,
        md5: fileID
      }
      let data = await sql.addFiles(sqlData)

      if (data.flag) {
        try {
          await fs.outputFile(base64FilePath + '/' + fileName, content)
        } catch (e) {
          reject({
            error: e
          })
          return false
        }
        resolve({
          fileUrl: CONFIG.serverUrl + CONFIG.projectName + '/file_preview_base64/' + fileID + '/' + fileName
        })
      } else {
        reject({
          error: data.message
        })
      }

    })

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
  let fileSysPath = md5Path
  let preMD5Path = path.normalize(previewPath + '/' + md5Path)
  md5Path = path.normalize(sourcePath + '/' + md5Path)
  let newFilePath = path.normalize(md5Path + '/' + uploadFile.name)
  console.log("开始 -------------------------->")
  try {
    //同步检测
    let existFlag = await fs.pathExists(newFilePath)
    let fileID = uuid.v1().replace(/-/g, '')
    let sqlData = {
      fileID: fileID,
      fileName: uploadFile.name,
      suffixName: uploadFile.suffixName,
      fileSize: uploadFile.fileSize,
      downloadUrl: '/file/' + fileID + '/' + uploadFile.name,
      previewUrl: '',
      fileSysPath: fileSysPath + '/' + uploadFile.name,
      md5: fileMD5
    }

    if (imgArr.indexOf(uploadFile.suffixName) !== -1) {
      sqlData.previewUrl = '/file_preview/' + fileID + '/' + uploadFile.name
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

module.exports = uploadFiles