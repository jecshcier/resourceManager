/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('files', {
    id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      primaryKey: true
    },
    file_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    md5: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    download_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'files'
  });
};
