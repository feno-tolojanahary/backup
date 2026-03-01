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
    targets: [
        {
            name: "app1",
            type: "app",
            dbSource: "data_1",
            files: [ "C:\\Users\\PC\\Documents\\PROJECT_DEV\\log", "C:\\Users\\PC\\Documents\\NOTE\\REACT" ],
            destinations: [ "s3-default", "host1", "local-storage-1" ]
        },
        {
            name: "mongodb",
            type: "database",
            source: "data_1",
            destinations: [ "s3-default", "host1", "local-storage-1" ]
        },
        {
            name: "s3-wasabi",
            type: "object-replication",
            source: "wasa-buck-rep",
            destinations: [ "s3-default", "host1", "local-storage-1" ]
        }
    ],
    infrastructure: {
        sources: {
            mongodb: [
                {
                    name: "data_1",
                    database: "local",
                    uri: "mongodb://localhost:27017"
                }
            ],
            s3: [
                {
                    name: "wasa-buck-rep",
                    bucketName: "live-bucket",
                    secretKey: "",
                    accessKey: "",
                    prefix: ""
                }
            ]
        },
        destinations: {
            s3: [
                {
                    name: "s3-default",
                    accessKey: process.env.WS3_ACCESS_KEY,
                    secretKey: process.env.WS3_SECRET_KEY,
                    bucketName: process.env.WS3_BUCKET_NAME,
                    backupPrefix: "backup-data/"
                }
            ],
            hosts: [
                {
                    name: "host1",
                    host: "192.168.2.181",
                    port: "22",
                    username: "ubuntu",
                    password: "",
                    privateKey: "local-ubuntu-server.pem",
                    passphrase: "",
                    destinationFolder: "/home/ubuntu/backup-data",
                    activeSync: true,
                    maxDiskUsage: "10MB"
                }
            ],
            localStorages: [
                {
                    name: "local-storage-1",
                    destinationFolder: "C:\Users\PC\Documents\PROJECT_DEV\backup-data-test",
                    maxDiskUsage: "10MB"
                }
            ],
        },
    },
    SMTP: {
        host: "",
        port: "",
        secure: "",
        auth: "",
        from: "",
        to: []
    },
    SES: {
        from: "",
        port: "",
        region: "",
        accessKeyId: "",
        secretAccessKey: "",
        to: []
    },
    notification: {
        mail: true
    },
    directory: "/media/feno/DATA2/PROJECT/THEBACKUP/sample",
    backupLog: `${__dirname}/log/`,
    daemonOut: `${__dirname}/log/daemon.log`,
    daemonErr: `${__dirname}/log/daemon.log`,
    // retentionTime: 24 * 60 * 60 * 1000,         // milliseconds 1 days before
    retentionTime: 5 * 60 * 1000,
    cronJob: "* * * * *",       // Every minutes
    useEncryption: true,
    useRemoteServer: true,
    granularSetup: {
        day: 6,
        week: 2,
        month: 1
    }
}   
