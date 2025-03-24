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
    dbName: "arh_dashboard_dev",
    wasabi: {
        accessKey: "",
        secretKey: "",
        bucketName: ""
    },
    backupLog: `${__dirname}/../log/`,
    retentionTime: 24 * 3600
}