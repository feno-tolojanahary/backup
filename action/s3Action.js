const jobService = require("../lib/db/jobService");
const userService = require("../lib/db/userService");
const { getS3Config, findHostConfig, searchConfig } = require("../lib/helper/mapConfig");
const S3Manager = require("../lib/storages/s3/s3");
const { parseScheduleToSeconds } = require("../lib/utils");
const RemoteHost = require("../lib/storages/remote/remoteHost");
const S3Provider = require("../lib/storages/s3/s3Provider");

// Object replication between two bucket
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
        const destConfNames = destination;
        if (!sourceConf) {
            throw new Error(`The configuration ${source} does not exists.`);
        }
        for (const confName of destConfNames) {
            const config = searchConfig(confName);
            if (!config) {
                throw new Error(`The configuration ${confName} does not exists.`);
            }
        }
        const handleProgress = ({ skippedCount, processCount, uploadedCount, percent, total }) => {
            console.log(`Progress: ${percent}% - ${processCount}/${total} - - uploaded: ${uploadedCount} - Skipped: ${skippedCount} `);
        }  
        await syncObjectToDestinations(source, destConfNames, handleProgress);
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

async function syncObjectToDestinations(sourceConfName, destinations, onProgress) {
    const sourceConf = getS3Config(sourceConfName);
    if (!sourceConf) {
        throw new Error(`The source configuration ${sourceConfName} does not exists.`);
    }
    const validConfigs = destinations.map((confName) => {
        const s3Conf = getS3Config(confName)
        if (s3Conf) 
            return {...s3Conf, type: "s3"}
        const hostConf = findHostConfig(confName)
        if (hostConf)
            return {...hostConf, type: "ssh"};
        return;
    }).filter(Boolean)

    if (validConfigs.length === 0) {
        throw new Error("No valid config name found.")
    }

    const sourceClient = new S3Provider(sourceConf);

    const destS3Clients = validConfigs.filter(({ type }) => type === "s3").map((config) => {
       const s3Provider = new S3Provider(config);
       return s3Provider.getClient();
    });
    const hostClients = [];
    const hostConfigs = validConfigs.filter(({ type }) => type === "ssh");
    
    for (const confHost of hostConfigs) {
        try {
            const host = new RemoteHost(confHost);
            await host.connect();
            const client = host.getSftpClient();
            hostClients.push(client);
        } catch {}
    }
    

    const objects = await sourceClient.getListObjects();

    const emitProgress = () => {
        if (!typeof onProgress !== "function") return;
        const percent = objects.length === 0 ? 100 : Math.min(100, (processCount / objects.length) * 100);
        onProgress({
            skippedCount,
            processCount,
            uploadedCount,
            percent,
            total: objects.length
        })
    }


    for (const object of objects) {
        try {
            let hasUpload = false;
            let objectStream;
            // check if object 
            for (const s3DestClient of destS3Clients) {
                try {
                 if (!(await s3DestClient.objectExists(object.Key))) {
                    if (!objectStream) {
                        objectStream = await sourceClient.getObjectStream(object.Key);
                    }            
                    await s3DestClient.uploadStream(objectStream, object.Key);
                    hasUpload = true;
                 }
                } catch (err) {
                    console.log("Error for client: ", s3DestClient.getConf().name)
                }
            }

            for (const sshClient of hostClients) {
                try {
                    if (!(await sshClient.checkFileExists(object.Key))) {
                        if (!objectStream) {
                            objectStream = await sourceClient.getObjectStream(object.Key);
                        }
                        await sshClient.uploadStream(objectStream, object.Key);
                        hasUpload = true;
                    }
                } catch (error) {
                    console.log("Error upload object % for client %", object.Key, sshClient.getConfig().name);
                }
            }
            if (!hasUpload) 
                skippedCount += 1
            else
                uploadedCount += 1;
            emitProgress();

        } catch (err) {
            skippedCount += 1;
            console.log("Error when checking object existance: ", err.message)
        } finally {
            proccessCount += 1;
            emitProgress();
        }
    }
    
    // disconnect all ssh clients
    for (const client of hostClients) {
        try {
            await client.disconnect()
        } catch {}
    }   
}

module.exports = {
    createObjectReplication,
    syncObjectStorage,
    testConfig,
    syncObjectToLocal   
}