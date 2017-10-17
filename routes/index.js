const express = require('express');
const router = express.Router();
const config = require(process.cwd() + '/config')
const moment = require('moment')
const crypto = require('crypto')
const upload = require('./upload')
const redis = require('./redis')

/* GET home page. */
router.get('/', function (req, res, next) {
    // console.log(req.body);
    res.send("hello World");
});
router.post('/addPlugin', function (req, res, next) {
    // console.log(req.body);
    // res.send(true);
});
router.post('/uploadPlugins/:systemCode/:key', function (req, res, next) {
    let info = {
        flag: false,
        message: "",
        data: null
    }
    let key = req.params.key
    let systemCode = req.params.systemCode
    console.log(key)
    console.log(systemCode)
    if (!config.allow[systemCode]) {
        info.message = "该系统不允许调用资源管理系统"
        res.send(info)
        return false
    }
    redis.get(systemCode).then((result) => {
        console.log(key)
        if (result === key) {
            upload(req, res, function (err) {
                console.log(req.body)
                if (err) {
                    // 发生错误
                    console.log(err)
                    var message = "";
                    var opFilesize = outputFileSize(config.fileConfig.fileOptions.fileSize);
                    if (err.code === "LIMIT_FILE_SIZE") {
                        message = "超过文件大小限制-->" + opFilesize
                    } else if (err.code === "LIMIT_FILE_COUNT") {
                        message = "超过文件大小限制-->最多" + config.fileConfig.fileOptions.files + "个"
                    }
                    info.message = message
                    res.send(info)
                } else {
                    info.flag = true
                    info.message = "上传成功"
                    res.send(info);
                }
            })
        }
        else {
            info.message = "key不正确"
            res.send(info)
        }
    }, (err) => {
        console.log(err)
        info.message = "redis服务器错误"
        res.send(info)
    })
});

router.get('/getPubKey/:systemCode/:publicKey', function (req, res, next) {
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
    let key = getSha1Key(config.publicKey + moment().format('YYYY-MM-DD'))
    console.log(key)
    if (req.params.publicKey === key) {
        let privateKey = ''
        for (let i = 0; i < 6; i++) {
            privateKey += parseInt(Math.random() * 10);
        }
        console.log(key)
        redis.set(systemCode, privateKey, 180)
        info.flag = true
        info.message = "获取key成功"
        info.data = privateKey
        res.send(info)
    } else {
        info.message = "staticKey不正确"
        res.send(info)
    }
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