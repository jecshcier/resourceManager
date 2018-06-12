const express = require('express');
const router = express.Router();
const path = require('path')
const CONFIG = require('../config')
const moment = require('moment')
const crypto = require('crypto')
const upload = require('./upload')
const redis = require('./assets/lib/redis')
const uploadDir = CONFIG.fileConfig.uploadDir || path.join(__dirname, '../tmpDir')
const previewPath = CONFIG.fileConfig.previewDir || path.join(__dirname, '../previewDir')
const interception = ['/uploadFile', '/file']

// 生成sha1Key
for (var i = 0; i < CONFIG.systemCode.length; i++) {
  console.log(CONFIG.systemCode[i])
  let seed = Math.random() * 99999 + CONFIG.systemCode[i]
  let key = crypto.createHash('sha1').update(seed).digest('hex')
  console.log(key)
  redis.setData(CONFIG.systemCode[i], key)
}


router.use((req, res, next) => {
  // 中间件 - 指定的路由都将经过这里
  // 做访问拦截 - token验证等
  let systemCode = req.body.systemCode
  for (let i = 0; i < interception.length; i++) {
    if (req.url.indexOf(interception[i]) !== -1) {
      next()
      return
    }
  }
  if (CONFIG.systemCode.indexOf(systemCode) !== -1) {
    next()
  } else {
    res.send({
      flag: false,
      message: "系统标识不正确！"
    })
  }
})

// 获取sha1key
router.post('/getSha1Key', async function(req, res, next) {
  let systemCode = req.body.systemCode
  try {
    let sha1Key = await redis.getData(systemCode)
    res.send({
      key: sha1Key
    })
  } catch (e) {
    res.send({
      err: e
    })
  }
});

// 上传文件
router.post('/uploadFile/:systemCode/:sha1Key', async function(req, res, next) {
  let systemCode = req.params.systemCode
  let sha1Key = req.params.sha1Key
  let key
  try {
    key = await redis.getData(systemCode)
  } catch (e) {
    info.message = "文件系统出问题了哦～"
    res.send(info)
    return false
  }
  if (sha1Key === key) {
    try {
      let result = await upload(req, res)
      res.send(result)
    } catch (info) {
      res.send(info)
      console.log(info)
    }
  } else {
    res.send({
      error: "staticKey不正确！"
    })
  }
})

router.get('/file/:fileid/:filename', function(req, res, next) {
  let fileid = req.params.fileid
  let fileName = req.params.filename
  fileid = new Buffer(fileid, 'base64').toString()
  let filePath = '/'
  for (let i = 0; i < fileid.length; i++) {
    filePath += fileid[i]
    console.log(i % 5)
    if (!(i % 5) && i) {
      filePath += '/'
    }
  }
  console.log(uploadDir + filePath + '/' + fileName)
  res.setHeader('content-type', 'application/octet-stream')
  res.sendFile(uploadDir + filePath + '/' + fileName)
})

router.get('/file_preview/:fileid/:filename', function(req, res, next) {
  let fileid = req.params.fileid
  let fileName = req.params.filename
  fileid = new Buffer(fileid, 'base64').toString()
  let filePath = '/'
  for (let i = 0; i < fileid.length; i++) {
    filePath += fileid[i]
    console.log(i % 5)
    if (!(i % 5) && i) {
      filePath += '/'
    }
  }
  console.log(previewPath + filePath + '/' + fileName)
  res.sendFile(previewPath + filePath + '/' + fileName)
})

function outputFileSize(size) {
  if (size > 1024) {
    size = size / 1024;
    if (size > 1024) {
      size = size / 1024;
      if (size > 1024) {
        size = size / 1024;
        return size + "GB"
      } else {
        return size + "MB"
      }
    } else {
      return size + "KB"
    }
  } else {
    return size + "B"
  }
}

module.exports = router;