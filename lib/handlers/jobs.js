const fs = require("fs");
const { stat } = require("fs/promises");
const jobService = require("../db/job/jobService");
const MongodbManager = require('../sources/mongodb/mongodbManager')
const { searchConfig, getConfigurationsByTargetName } = require("../helper/mapConfig");
const { getFormattedName } = require("../helper/utils");
const S3Provider = require("../storages/s3/s3Provider");
const RemoteHost = require("../storages/remote/remoteHost");
const { backupEvent } = require("../helper/event");
const LocalStorage = require("../storages/localStorage/localStorages");
const AppDataManager = require("../sources/app/AppDataManager");
const targetService = require("../db/job/targetService");
const { config } = require("../../config");

async function getActiveDestConfigs(destinations) {
    return destinations.map(async (confName) => {
            try {
                const conf = searchConfig(confName);
                if (conf.type === "s3") {
                    const s3Provider = new S3Provider(conf);
                    await s3Provider.testConnection();
                    return conf;
                }
                if (conf.type === "ssh") {
                    const remoteManager = new RemoteHost();
                    const isConnected = await remoteManager.testConnection();
                    if (isConnected)
                        return conf;
                }
                return;
            } catch (err) {
                console.log("Error s3 connection for conf %s ", confName);
                return;
            }
        }).filter(Boolean)
}

async function runJob(jobId) {
    const job = await jobService.findJob({ id: jobId });
    if (!job) {
        throw new Error(`No job found with id ${jobId}`)
    }
    let configs = {};
    let target = {};
    if (job.target_id) {
        target = await targetService.getTargetDetailConf(job.target_id);
    } else {
        configs = getConfigurationsByTargetName(job.target);
        target = configs.target;
    }
    
    if (target.type === "database") {
        await execMongoJob(job)
    } else if (target.type === "object-replication") {
        const handleProgress = ({ skippedCount, processCount, uploadedCount, percent, total }) => {
            console.log(`Progress: ${percent}% - ${processCount}/${total} - - uploaded: ${uploadedCount} - Skipped: ${skippedCount} `);
        }  
        await syncObjectToDestinations(target.source, target.destinations, handleProgress);

    } else if (target.type === "app") {
        await syncAppData(job);
    } else {
        throw new Error("Target type not found.")
    }
}

async function uploadToStorage ({conf, dumpMetaData, job, isEncrypted}) {
    const useEncryption = config.useEncryption || isEncrypted;
    const otherMeta = { jobId: job.id, storageConf: conf.name, encrypted: useEncryption };
    console.log("conf type: ", conf.type)
    if (conf.type === "ssh") {
        try {
            const remoteMng = new RemoteHost();
            await remoteMng.connect();
            let backupInfo = {};
            console.log("use encryption: ", useEncryption)
            if (useEncryption) {
                backupInfo = await remoteMng.uploadDir(dumpMetaData.encryptedDirPath);
            } else {
                backupInfo = await remoteMng.uploadFile(dumpMetaData.filePath)
            }
            await remoteMng.disconnect();
            backupEvent.emit("backup_success", { ...backupInfo, ...otherMeta, storage: "remote" })
        } catch (error) {
            console.log("Error ssh upload: ", error)
            backupEvent.emit("backup_failed", { ...dumpMetaData, ...otherMeta, storage: "remote" });
        }
    }
    if (conf.type === "s3") {
        try {
            const s3Mng = new S3Provider(conf);
            let uploadRes = [];
            if (useEncryption) {
                uploadRes = await s3Mng.uploadDir(dumpMetaData.encryptedDirPath);
            } else {
                const streamFile = fs.createReadStream(dumpMetaData.filePath)
                uploadRes = await s3Mng.uploadStream(streamFile);
            }
            const uploadedData = await Promise.all(uploadRes.map(async (upFile) => {
                const stats = await stat(upFile.filePath);
                return {
                    prefix: upFile.prefix,
                    storagePath: upFile.Key,
                    size: stats.size,
                    type: "file"
                }
            }))
            backupEvent.emit("backup_success", { ...dumpMetaData, uploadedData, ...otherMeta, storage: "s3" })
        } catch (error) {
            backupEvent.emit("backup_failed", { ...dumpMetaData, ...otherMeta, storage: "s3" })
        }
    }
    if (conf.type === "local-storage") {
        try {
            const localStorage = new LocalStorage(conf);
            let uploadedData = [];
            if (useEncryption) {
                const res = await localStorage.copyFolder(dumpMetaData.encryptedDirPath);
                uploadedData = res.metaFiles;
            } else {
                const res = await localStorage.copyFile(dumpMetaData.filePath);
                uploadedData.push(res);
            }
            backupEvent.emit("backup_success", { ...dumpMetaData, uploadedData, ...otherMeta, storage: "local-storage" })
        } catch (error) {
            backupEvent.emit("backup_failed", { ...dumpMetaData, ...otherMeta, storage: "local-storage" })
        }
    }
}

async function execMongoJob(job, cbOverflow) {
    const startAt = Date.now() / 1000;
    try {
        let sourceConf = null, activeConfigDests = [];

        if (job.target_id) {
            const targetDetailConf = await targetService.getTargetDetailConf(job.target_id);
            sourceConf = targetDetailConf.source;
            activeConfigDests = targetDetailConf.destinations;
        } else {
            sourceConf = searchConfig(job.source);    
            activeConfigDests = await getActiveDestConfigs();
        }
        const useEncryption = job.is_encrypted === 1;
        let dumpMetaData;
        if (sourceConf.type === "mongodb") {
            const name = getFormattedName(sourceConf.database);
            const mongoMng = new MongodbManager(sourceConf);
            if (useEncryption) {
                dumpMetaData = await mongoMng.dumpMongoDb(name)
            } else {
                dumpMetaData = await mongoMng.plainDumpMongoDb(name);
            }
        }

        // call overflow delete
        if (typeof cbOverflow === "function")
            await cbOverflow(dumpMetaData.size);
        
        if (activeConfigDests.length === 0)
            throw new Error("No active configuration for destinations.")
        for (const conf of activeConfigDests) {
            await uploadToStorage({ conf, dumpMetaData, job })
        }
        // Mark job as runned
        // backupEvent.emit("job_run_success", job, { startAt, finishedAt: Date.now() / 1000 })
    } catch(error) {
        // backupEvent.emit("job_run_failed", job, { startAt, finishedAt: Date.now() / 1000 })
        console.log(`Fail when executing job ${job.name}`, error);
    }
}

async function syncObjectToDestinations(sourceConfig, destinations, onProgress) {
    let sourceConf = null;
    let validConfigs = [];
    sourceConf = typeof sourceConfig === "string" ? getS3Config(sourceConfig) : sourceConfig;
    if (!sourceConf) {
        throw new Error(`The source configuration ${sourceConfName} does not exists.`);
    }
    validConfigs = destinations.every(dest => typeof dest === "string") 
    ? destinations.map((confName) => {
        const s3Conf = getS3Config(confName)
        if (s3Conf) 
            return {...s3Conf, type: "s3"}
        const hostConf = findHostConfig(confName)
        if (hostConf)
            return {...hostConf, type: "ssh"};
        return;
    }).filter(Boolean)
    : destinations;

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

async function syncAppData (job, cbOverflow) {
    try {
        const startAt = Date.now() / 1000;
        const { target, destConfigs } = getConfigurationsByTargetName(job.target);
        const appDataMng = new AppDataManager(target);
        const metaData = await appDataMng.dumpCompressData();
        if (typeof cbOverflow === "function")
            await cbOverflow(metaData.size / 1024);
        for (const destConfig of destConfigs) {
            await uploadToStorage({ conf: destConfig, dumpMetaData: metaData, job })
        }
        backupEvent.emit("job_run_success", job, { startAt, finishedAt: Date.now() / 1000 })
    } catch (error) {
        backupEvent.emit("job_run_failed", job, { startAt, finishedAt: Date.now() / 1000 })
        console.log(error.message);
    }
}

module.exports = {
    execMongoJob,
    syncAppData,
    runJob,
    syncObjectToDestinations,
    uploadToStorage          
}