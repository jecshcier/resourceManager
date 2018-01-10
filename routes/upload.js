const path = require('path');
const config = require(path.normalize(__dirname + '/../config'))
const fs = require('fs-extra');
const Busboy = require('busboy');
const crypto = require('crypto');
const sourcePath = config.fileConfig.uploadDir || path.normalize(__dirname + '/../tmpDir')

//创建文件缓存目录
fs.ensureDir(sourcePath, (err) => {
    if (err) {
        console.log(err)
        setInterval(() => {
            console.log('缓存目录创建失败，请确认文件创建权限，或在项目根目录手动创建' + sourcePath + '文件夹')
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
        if (req.headers) {
            let fileSize = req.headers['content-length']
            if (fileSize > 1000000000) {
                info.message = '超过最大上传文件大小限制(1G)！'
                reject(info)
                return false;
            }

        } else {
            info.message = 'headers不正确'
            reject(info)
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
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            // let hash = crypto.createHash('md5');
            file.on('data', function(data) {
                if (!uploadFilesArr.hasOwnProperty(fieldname)) {
                    uploadFilesArr[fieldname] = {
                        name:filename,
                        md5:crypto.createHash('md5'),
                        size:data.length,
                        mimetype:mimetype
                    }
                }
                else
                {
                    uploadFilesArr[fieldname].size += data.length
                    uploadFilesArr[fieldname].md5.update(data)
                }
                console.log(uploadFilesArr)
                console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
                // fileSize += data.length
                // hash.update(data)                
            });
            file.on('end', function() {
                uploadFilesArr[fieldname].md5 = uploadFilesArr[fieldname].md5.digest('hex')
                console.log('File [' + fieldname + '] Finished');
                console.log(uploadFilesArr)
            });

            file.on('close', function() {
                console.log('File [' + fieldname + '] closed');
            });
            console.info(filename)
            console.info(mimetype)
            // let fileNamePrefix = '/' + Date.now() + '-'
            // let storeFileName = fileNamePrefix + filename
            // let filepath = path.normalize(sourcePath + storeFileName)
            // let writerStream = fs.createWriteStream(filepath)

            // writerStream.on('error', (err) => {
            //     info.message = err
            //     writerStream.end(err);
            //     reject(info)
            // })

            // writerStream.on('finish', () => {
            //     console.log("okokokokok")
            //     return false;
            //     let fileMD5 = hash.digest('hex')
            //     console.log('fileMD5 --->', fileMD5)
            //     let md5Path = ''
            //     for (let i = 0; i < fileMD5.length; i++) {
            //         md5Path += fileMD5[i]
            //         if (!(i % 5) && i) {
            //             md5Path += '/'
            //         }
            //     }
            //     console.log('md5Path--->', md5Path)
            //     md5Path = path.normalize(sourcePath + '/' + md5Path)
            //     let newFilePath = path.normalize(md5Path + '/' + filename)
            //     fs.pathExists(newFilePath).then((exists) => {
            //         if (exists) {
            //             fs.remove(filepath).then(() => {
            //                 let baseUrl = new Buffer(fileMD5).toString('base64')
            //                 info.flag = true
            //                 info.message = "匹配到md5相同文件，上传成功"
            //                 info.data = {
            //                     fileUrl: config.serverUrl + config.projectName + '/file/' + baseUrl + '/' + filename
            //                 }
            //                 resolve(info)
            //             }, (err) => {
            //                 console.warn('缓存文件删除失败')
            //                 console.warn(err)
            //             })
            //         } else {
            //             return fs.ensureDir(md5Path)
            //         }
            //     }, (err) => {
            //         console.warn(err)
            //         info.message = err
            //         reject(info)
            //         return false
            //     }).then(() => {
            //         return fs.rename(filepath, newFilePath)
            //     }, (err) => {
            //         console.warn(err)
            //         info.message = err
            //         reject(info)
            //         return false
            //     }).then(() => {
            //         let baseUrl = new Buffer(fileMD5).toString('base64')
            //         info.flag = true
            //         info.message = "上传成功"
            //         info.data = {
            //             fileUrl: config.serverUrl + config.projectName + '/file/' + baseUrl + '/' + filename
            //         }
            //         resolve(info)
            //     }, (err) => {
            //         console.warn(err)
            //         info.message = err
            //         reject(info)
            //     })
            // });

            // file.pipe(writerStream)

        });

        busboy.on('finish', function() {
            console.log('Done parsing form!');
        });
        req.pipe(busboy);
    })

}


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         let uploadDir = config.fileConfig.uploadDir ?
//             config.fileConfig.uploadDir :
//             process.cwd() + '/tmpDir';
//         uploadDir = path.resolve(__dirname, uploadDir)
//         console.log(uploadDir)
//         fs.ensureDir(uploadDir, (err) => {
//             cb(null, uploadDir)
//         });
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + '-' + file.originalname)
//     }
// })
// const upload = multer({
//     storage: storage,
//     limits: config.fileConfig.fileOptions,
//     fileFilter: function (req, file, cb) {
//         console.log(file)
//         // console.log(file.originalname)
//         // 这个函数应该调用 `cb` 用boolean值来
//         // 指示是否应接受该文件
//         // 拒绝这个文件，使用`false`, 像这样:
//         // cb(null, false)
//         // 接受这个文件，使用`true`, 像这样:
//         cb(null, true)
//         // 如果有问题，你可以总是这样发送一个错误:
//         // cb(new Error('I don\'t have a clue!'))
//     }
// }).any()

module.exports = upload