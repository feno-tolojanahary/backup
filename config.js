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
    workingDirectory: `${__dirname}/output`,
    dataDirectory: `${__dirname}/data`,
    dbName: "local",
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
            host: "192.168.2.181",
            port: "22",
            username: "ubuntu",
            password: "",
            privateKey: "local-ubuntu-server.pem",
            passphrase: "",
            destinationFolder: "/home/ubuntu",
            parentFolder: "backupDB",
            activeSync: true,
            maxDiskUsage: 2048
        }
    ],
    directory: "/media/feno/DATA2/PROJECT/THEBACKUP/sample",
    backupLog: `${__dirname}/log/`,
    daemonOut: `${__dirname}/log/daemon.log`,
    daemonErr: `${__dirname}/log/daemon.log`,
    retentionTime: 24 * 3600,
    granularSetup: {
        day: 6,
        week: 2,
        month: 1
    }
}