const path = require('path')
const CONFIG = require(path.join(__dirname, '../../../config'))
const sql = require('../sql/sql')
const imgPresser = path.join(__dirname, './img_presser.js')
const sourcePath = CONFIG.fileConfig.uploadDir || path.join(__dirname, '../../../tmpDir')
const previewPath = CONFIG.fileConfig.previewDir || path.join(__dirname, '../../../previewDir')
const child = require('child_process')


const transferErrorFiles = async() => {

	let result = await sql.getTransferErrorFile()
	let fileArr = result.data
	for (let i = 0; i < fileArr.length; i++) {
		// 异步创建缩略图
		let p = child.fork(imgPresser, [], {})
		p.on('message', (m) => {
			if (!m.flag) {
				console.log(m.message)
				return;
			}
			console.log("缩略图创建完成！")
				// 缩略图创建完成后，更新数据库标志位
			sql.updateFiles(m.fileID)
		})
		let fn = '/' + fileArr[i].file_name
		p.send({
			fileID: fileArr[i].id,
			filePath: path.join(sourcePath, '/' + fileArr[i].sys_path),
			outputPath: path.join(previewPath, '/' + fileArr[i].sys_path).replace(fn,''),
			fileName: fileArr[i].file_name,
			imgWidth: CONFIG.fileConfig.pressImageW
		})
	}

}

module.exports = transferErrorFiles