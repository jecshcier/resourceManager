const multer = require('multer');
const config = require(process.cwd() + '/config')
const path = require('path');
const fs = require('fs-extra');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir = config.fileConfig.uploadDir ?
            config.fileConfig.uploadDir :
            process.cwd() + '/tmpDir';
        uploadDir = path.resolve(__dirname, uploadDir)
        console.log(uploadDir)
        fs.ensureDir(uploadDir, (err) => {
            cb(null, uploadDir)
        });
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    }
})
const upload = multer({
    storage: storage,
    limits: config.fileConfig.fileOptions,
    fileFilter: function (req, file, cb) {
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

module.exports = upload