const jobService = require("../lib/db/jobService");
const userService = require("../lib/db/userService");
const { getS3Config } = require("../lib/helper/mapConfig");
const { syncObjectSourceDestination } = require("../lib/s3/remoteS3");
const S3Manager = require("../lib/s3/s3");
const { parseScheduleToSeconds } = require("../lib/utils");

async function createObjectReplication(opts) {
    try {
        const {
            source,
            destination
        } = opts;
        const sourceConf = getS3Config(source);
        const destConf = getS3Config(destination);
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
            storages: "object-replication",
            status: "running",
            scheduleType: "interval",
            scheduleValue,
            sourceConfigName: sourceConf,
            destConfigName: destConf,
            createdBy: userAdmin.id
        }
        const res = await jobService.insert(jobData);
        if (!res.success) 
            throw new Error("Error happen when saving job")
        console.log("Job object replication created with success");
    } catch (error) {
        console.log(error.message);
    }

}

async function syncObjectStorage(opts) {
    try {
        const {
            source,
            destination
        } = opts;
        const sourceConf = getS3Config(source);
        const destConf = getS3Config(destination);
        if (!sourceConf) {
            throw new Error(`The configuration ${source} does not exists.`);
        }
        if (!destConf) {
            throw new Error(`The configuration ${destination} does not exists.`);
        }
        const handleProgress = ({ skippedCount, processCount, uploadedCount, percent, total }) => {
            console.log(`Progress: ${percent}% - ${processCount}/${total} - - uploaded: ${uploadedCount} - Skipped: ${skippedCount} `);
        }  
        await syncObjectSourceDestination(source, destination, handleProgress);
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
        const s3Mng = new S3Manager(opts.name);
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
    testConfig
}