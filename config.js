module.exports = {
  fileConfig: {
    uploadDir: null,
    previewDir:null,
    fileOptions: {
      maxFileSize: 1024 * 1024 * 1024 * 2,
      maxFileNum: 20
    },
    pressImageW:300
  },
  db_config: {
    databaseName: "rms",
    username: "root",
    password: "Admin12345*",
    options: {
      define: {
        timestamps: false // true by default
      },
      timezone: "+08:00",
      // host: "192.168.109.236",
      host: "127.0.0.1",
      dialect: "mysql",
      dialectOptions: {
        charset: "utf8mb4"
      }
    }
  },
  redisConfig: {
    option: {
      host: "127.0.0.1",
      port: 6379,
      keyPrefix: "rm-"
    }
  },
  publicKey: "10A1F6",
  systemCode: ["tesla", "fe_plugins"],
  projectName: "/rm",
  staticUrl: "/static",
  fileDownloadUrl: "/download",
  serverUrl: "http://127.0.0.1:3033"
}
