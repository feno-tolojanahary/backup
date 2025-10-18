/**
 INCOMING FUNCTIONNALITY
    comming soon:
    - delete outdated backup
    - support command as an argument
    - list all backup on wasabi
    
    - restore database from a backup
    - manually launch a backup with name

    
    improvement:
        - list all backup in a specified disk
        - launch backup as a independant service => spawn a child process

    SOLUTION SEARCH
    - incrementally save backup data
    
*/ 

exports.config = {
    workingDirectory: `${__dirname}/../output`,
    dataDirectory: `${__dirname}/../data`,
    dbName: "arh_dev_31_juillet",
    mysql: {
        user: "root",
        password: "Hello123!",
        database: "sys"
    },
    wasabi: {
        accessKey: process.env.WS3_ACCESS_KEY,
        secretKey: process.env.WS3_SECRET_KEY,
        bucketName: process.env.WS3_BUCKET_NAME
    },
    useRemoteServer: true,
    hosts: [
        {
            host: "",
            port: "",
            username: "",
            password: "",
            privateKey: "",
            passphrase: "",
            destinationFolder: "",
            parentFolder: "backupDB",
            activeSync: true,
            maxDiskUsage: 10
        }
    ],
    directory: "/media/feno/DATA2/PROJECT/THEBACKUP/sample",
    backupLog: `${__dirname}/../log/`,
    retentionTime: 24 * 3600
}