const config = require('../../../config');
const moment = require('moment');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(config['db_config'].databaseName, config['db_config'].username, config['db_config'].password, config['db_config'].options);
const FILES = require('./models/files')(sequelize, Sequelize);
const uuid = require('uuid');
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
  getWholeFiles: async () => {
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
  addFiles: async (data) => {
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
          'id': uuid.v4(),
          'file_name': data.fileName,
          'suffix_name':data.suffixName,
          'file_size':data.fileSize,
          'md5': data.md5,
          'download_url': data.downloadUrl,
          'preview_url':data.previewUrl,
          'create_time':moment().format("YYYY-MM-DD HH:mm:ss")
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
  }
}