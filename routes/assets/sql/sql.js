const config = require('../../../config');
const moment = require('moment');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config['db_config'].databaseName, config['db_config'].username, config['db_config'].password, config['db_config'].options);
const FILES = require('./models/files')(sequelize, Sequelize);
FILES.sync().then((res)=>{
  console.log('表结构同步完成........')
})
moment.locale('zh-cn');

const callbackModel = () => {
  return {
    flag: false,
    message: '',
    data: null
  }
}

module.exports = {
  // 获取所有文件
  getWholeFiles: async() => {
    let info = callbackModel()
    try {
      let result = FILES.findAll({
        attributes: ['id', 'file_name', 'md5', 'download_url']
      })
      if (result) {
        info.flag = true
        info.data = JSON.parse(JSON.stringify(result))
        info.message = '文件获取成功'
        return info
      } else {
        info.flag = true
        info.data = null
        info.message = "暂无数据"
        return info
      }
    } catch (e) {
      info.flag = false
      info.data = null
      info.message = "数据库查找失败"
      return info
    }
  },
  addFiles: async(data) => {
    let info = callbackModel()
    let result
    try {
      result = await FILES.findOne({
        attributes: ['id', 'md5', 'file_name', 'download_url'],
        where: {
          'md5': data.md5
        }
      })
      if (result) {
        info.flag = 1
        info.data = JSON.parse(JSON.stringify(result))
        info.message = "该文件已存在"
        return info
      } else {
        let result2 = await FILES.create({
          'id': data.fileID,
          'file_name': data.fileName,
          'suffix_name': data.suffixName,
          'file_size': data.fileSize,
          'md5': data.md5,
          'sys_path': data.fileSysPath,
          'download_url': data.downloadUrl,
          'transfer': data.transfer ? data.transfer : 0,
          'preview_url': data.previewUrl,
          'create_time': moment().format("YYYY-MM-DD HH:mm:ss")
        })
        info.flag = true
        info.data = JSON.parse(JSON.stringify(result2))
        info.message = "文件新增成功！"
        return info
      }
    } catch (e) {
      info.message = e
      return info
    }
  },
  updateFiles: async(fileID) => {
    console.log(fileID)
    let info = callbackModel()
    try {
      let result = await FILES.update({
        'transfer': 1
      }, {
        where: {
          'id': fileID
        }
      })
      console.log(result)
      info.flag = true
      info.data = JSON.parse(JSON.stringify(result))
      info.message = '更新状态成功'
      return info
    } catch (e) {
      console.log(e)
      info.flag = false
      info.data = null
      info.message = "数据库查找失败"
      return info
    }
  },
  getFileDownloadUrl: async(fileID) => {
    let info = callbackModel()
    try {
      let result = await FILES.findOne({
        attributes: ['id', 'md5', 'file_name', 'sys_path'],
        where: {
          'id': fileID
        }
      })
      if (result) {
        info.flag = true
        info.data = JSON.parse(JSON.stringify(result))
        info.message = '文件获取成功'
        return info
      } else {
        info.flag = true
        info.data = null
        info.message = "暂无数据"
        return info
      }
    } catch (e) {
      info.flag = false
      info.data = null
      info.message = "数据库查找失败"
      return info
    }
  },
  getTransferErrorFile: async() => {
    let info = callbackModel()
    try {
      let result = await FILES.findAll({
        attributes: ['id', 'sys_path', 'file_name'],
        where: {
          'transfer': 2
        },
        limit: 20
      })
      if (result) {
        info.flag = true
        info.data = JSON.parse(JSON.stringify(result))
        info.message = '文件获取成功'
        return info
      } else {
        info.flag = true
        info.data = null
        info.message = "暂无数据"
        return info
      }
    } catch (e) {
      info.flag = false
      info.data = null
      info.message = "数据库查找失败"
      return info
    }
  }
}