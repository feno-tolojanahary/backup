const jobService = require("../db/jobService");
const userService = require("../db/userService");
const { getS3Config, findHostConfig, searchConfig, getConfigurationsByTargetName } = require("../helper/mapConfig");
const S3Manager = require("../storages/s3/s3");
const { parseScheduleToSeconds } = require("../lib/utils");
const RemoteHost = require("../storages/remote/remoteHost");
const S3Provider = require("../storages/s3/s3Provider");

// Object replication between two bucket
async function createObjectReplication(opts) {
    try {
        const {
            source,
            destination
        } = opts;
        
        const targetName = opts.target;
        getConfigurationsByTargetName(targetName);
        
        if (!sourceConf) {
            throw new Error(`The configuration ${source} does not exists.`);
        }
        if (!destConf) {
            throw new Error(`The configuration ${destination} does not exists.`);
        }
        const userAdmin = await userService.adminUser();
        const scheduleValue = parseScheduleToSeconds(opts.schedule)
        const jobData = {
            name: opts.name,
            status: "running",
            scheduleType: "interval",
            scheduleValue,
            target: targetName,
            createdBy: userAdmin.id
        }
        const res = await jobService.insert(jobData);
        if (!res.success) 
            throw new Error("Error happen when saving job")
        console.log("Job object replication created with success");
    } catch (error) {
        console.log(error.message);
        process.exit(1);
    }

}

async function testConfig(opts) {
    let config = getS3Config(opts.name);
    if (!config) {
        console.log("A configuration with the specified name doesnt exists")
        process.exit(1)
    }
    try {
        const s3Mng = new S3Manager(config);
        const bucketList = await s3Mng.listBuckets();
        const s3 = s3Mng.getClient();
        await s3.headObject({ Bucket: config.bucketName });
        console.log(`The configuration ${opts.name} is set up correctly and connected.`)
    } catch (error) {
        console.log(`The configuration ${opts.name} is not setting correctly.`)
    }
}

module.exports = {
    createObjectReplication,
    syncObjectStorage,
    testConfig,
    syncObjectToLocal   
}