module.exports.config = {
    workingDirectory: `${__dirname}/../output`,
    dbName: "arh_dashboard_dev",
    wasabi: {
        accessKey: "",
        secretKey: "",
        bucketName: ""
    },
    backupLog: `${__dirname}/../log/`
}