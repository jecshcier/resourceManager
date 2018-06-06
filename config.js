module.exports = {
    fileConfig: {
        uploadDir: null,
        fileOptions: {
            fields: 5,
            fileSize: 1024 * 1024 * 1024 * 2,
            files: 5,
            parts: 1024 * 1024 * 1024 * 2
        }
    },
    redisConfig: {
        option:{
            host: "127.0.0.1",
            port:6379,
            keyPrefix:"rm-"
        }
    },
    publicKey:"10A1F6",
    systemCode:["tesla","fe_plugins"],
    projectName:"/rm",
    staticUrl:"/static",
    fileDownloadUrl:"/download",
    serverUrl:"http://127.0.0.1:3033"
}
