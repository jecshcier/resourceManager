const express = require('express');
const router = express.Router();
const path = require('path')
const config = require('../config')
const moment = require('moment')
const crypto = require('crypto')
const upload = require('./upload')
const redis = require('./redis')
const uploadDir = config.fileConfig.uploadDir || path.normalize(__dirname + '/../tmpDir')


router.use((req, res, next) => {
  // 中间件 - 指定的路由都将经过这里
  // 做访问拦截 - token验证等
  if ((req.url.indexOf('/login') !== -1) || req.session.user || req.body.token) {
    next()
    return
  }
  res.render('index', {
    webUrl: config.projectName,
    staticUrl: config.staticUrl,
    title: '资源管理系统',
    key: getSha1Key(config.publicKey)
  })
})

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    webUrl: config.projectName,
    staticUrl: config.staticUrl,
    title: '资源管理系统',
    key: getSha1Key(config.publicKey)
  })
});

router.post('/uploadPlugins/:systemCode/:publicKey', function (req, res, next) {
  let info = {
    flag: false,
    message: "",
    data: null
  }
  console.log(req.params.systemCode)
  let systemCode = req.params.systemCode
  if (!config.allow[systemCode]) {
    info.message = "该系统不允许调用资源管理系统"
    res.send(info)
    return false
  }
  let key = getSha1Key(config.publicKey)
  console.log(key)
  console.log(req.params.publicKey)
  if (req.params.publicKey === key) {
    upload(req, res).then((result) => {
      res.send(result)
    }, (result) => {
      res.send(result)
    })
  } else {
    info.message = "staticKey不正确"
    res.send(info)
  }
})

router.get('/file/:fileid/:filename', function (req, res, next) {
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

function getSha1Key(key) {
  return crypto.createHash('sha1').update(key).digest('hex')
}

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