const fs = require('fs-extra')
const gm = require('gm')
const path = require('path')

process.on('message', (m) => {
	console.log(path.normalize(m.outputPath + '/' + m.fileName))
	let res = {
		flag: true
	}
	fs.ensureDir(m.outputPath).then(() => {
		console.log("缩略图文件夹建立完成")
		gm(m.filePath)
			.resize(m.imgWidth, null, '!')
			.quality(70)
			.write(path.normalize(m.outputPath + '/' + m.fileName), function(err) {
				if (!err) {
					process.send(res)
					process.exit(0)
				} 
			})
	}).catch((e) => {
		console.log(e)
		res.flag = false
		res.message = e
		process.send(res)
		process.exit(0)
	})
})