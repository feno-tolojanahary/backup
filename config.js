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


module.exports.config = {
    workingDirectory: `${__dirname}/../output`,
    dbName: "arh_dev_16_avril",
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
    backupLog: `${__dirname}/../log/`,
    retentionTime: 24 * 3600
}