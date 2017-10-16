var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs-extra');
var multer = require('multer');
var config = require(process.cwd() + '/config')
var Busboy = require('busboy');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        var uploadDir = config.fileConfig.uploadDir ?
            config.fileConfig.uploadDir :
            process.cwd() + '/tmpDir';
        uploadDir = path.resolve(__dirname, uploadDir)
        console.log(uploadDir)
        fs.ensureDir(uploadDir, function(err) {
            cb(null, uploadDir)
        });
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
var upload = multer({
        storage: storage,
        limits: config.fileConfig.fileOptions,
        fileFilter: function(req, file, cb) {
            console.log(file)
                // console.log(file.originalname)
                // 这个函数应该调用 `cb` 用boolean值来
                // 指示是否应接受该文件
                // 拒绝这个文件，使用`false`, 像这样:
                // cb(null, false)
                // 接受这个文件，使用`true`, 像这样:
            cb(null, true)
                // 如果有问题，你可以总是这样发送一个错误:
                // cb(new Error('I don\'t have a clue!'))
        }
    }).any()
    /* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: '前端插件管理系统',
        staticUrl: '/static',
        webUrl: '/feplugins'
    });
});
router.post('/addPlugin', function(req, res, next) {
    // console.log(req.body);
    // res.send(true);
});
router.post('/uploadPlugins', function(req, res, next) {
    var busboy = new Busboy({
        headers: req.headers
    });
    console.log(req.body)
    upload(req, res, function(err) {
        console.log(req.body)
        if (err) {
            // 发生错误
            // console.log(err)
            var message = "";
            var opFilesize = outputFileSize(config.fileConfig.fileOptions.fileSize);
            if (err.code === "LIMIT_FILE_SIZE") {
                message = "超过文件大小限制-->" + opFilesize
            } else if (err.code === "LIMIT_FILE_COUNT") {
                message = "超过文件大小限制-->最多" + config.fileConfig.fileOptions.files + "个"
            }
            var result = {
                flag: false,
                message: message
            }
            res.send(result)
        } else {
            var result = {
                flag: true,
                message: "上传成功"
            }
            res.send(result);
        }
    })

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        console.log(filename)
        console.log(encoding)
        console.log(mimetype)
        let fileSize = 0;
        file.on('data', function(data) {
            console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
            fileSize += data.length
        });
        file.on('end', function() {
            console.log('File [' + fieldname + '] Finished' + 'size = ' + fileSize);
        });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        console.log('Field [' + fieldname + ']: value: ');
        console.log(val)
    });
    busboy.on('finish', function() {
        console.log('Done parsing form!');
        // res.writeHead(303, { Connection: 'close', Location: '/' });
        // res.end();
    });
    req.pipe(busboy);


});

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