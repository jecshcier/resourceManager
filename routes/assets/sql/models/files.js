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
    suffix_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    file_size: {
      type: DataTypes.INTEGER(100),
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
    preview_url: {
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
