const fs = require("fs");
const { stat } = require("fs/promises");
const jobService = require("../db/jobService");
const userService = require('../db/userService');
const MongodbManager = require('../sources/mongodb/mongodbManager')
const { searchConfig, getSourceConfByTargetName, getConfigurationsByTargetName } = require("../helper/mapConfig");
const { printJobs, printJobRuns } = require("../helper/ui-console");
const { validCronExpression, parseIntervalToSeconds } = require("../helper/validation");
const { getFormattedName } = require("../helper/utils");
const S3Provider = require("./storages/storages/s3/s3Provider");
const RemoteHost = require("./storages/storages/remote/remoteHost");
const { backupEvent } = require("../helper/event");
const LocalStorage = require("../storages/localStorage/localStorages");

exports.createJob = async (opts) => {
    const modes = [opts.interval, opts.cron].filter(Boolean);
    let scheduleValue = "";

    if (modes.length === 0) {
        console.log("Choose exactly one of --interval or --cron for the scheduling");
        process.exit(1)
    }

    let sourceConf = getSourceConfByTargetName(opts.target);
    if (!sourceConf)
        throw new Error(`The configuration ${opts.target} does not exists.`);

    if (opts.cron) {
        if (!validCronExpression(opts.cron)) {
            throw new Error(`Cron expression ${opts.cron} is not valid.`);
        }
        scheduleValue = opts.cron;
    }

    if (opts.interval) {
        scheduleValue = parseIntervalToSeconds(opts.interval);
    }

    const { name } = opts;
    const adminUser = await userService.adminUser();
    const job = {
        name,
        target: opts.target,
        status: "running",
        scheduleType: opts.cron ? "cron" : "interval",
        scheduleValue,
        createdBy: adminUser.id
    };
    const res = await jobService.insert(job);
    if (res.success) {
        console.log("Job created with success.");
        process.exit(0)
    } else {
        console.log("Error creating job: ", res.message)
    }
}


exports.disableJob = async (opts) => {
    const ids = [opts.name, opts.id].filter(Boolean);
    if (ids.length === 0) {
        console.log("Precise --id or --name for the job to disable")
    }
    const [id] = ids;
    const field = opts.name ? "name" : "id"
    const res = await jobService.update({ [field]: id }, { status: "disabled" });
    if (res.success) {
        console.log(`The job ${id} is disabled.`);
        process.exit(0);
    } else {
        console.log(error.message);
        process.exit(1);
    }
}

exports.enableJob = async (opts) => {
    const ids = [opts.name, opts.id].filter(Boolean);
    if (ids.length === 0) {
        console.log("Precise --id or --name for the job to be enable")
    }
    const [id] = ids;
    const field = opts.name ? "name" : "id"
    const res = await jobService.update({ [field]: id }, { status: "running" });
    if (res.success) {
        console.log(`The job ${id} is now enable.`);
        process.exit(0);
    } else {
        console.log(error.message);
        process.exit(1);
    }
}

exports.listJob = async (opts) => {
    const adminUser = await userService.adminUser();
    const jobList = await jobService.listJob({ userId: adminUser });
    printJobs(jobList);
    process.exit(0);
}

exports.jobRunList = async (jobId, opts) => {
    const jobRunParams = {
        jobId,
        status: opts.status,
        since: opts.since ? new Date(opts.since).getTime() / 1000 : null
    }
    const jobRunList = await jobService.getJobRuns(jobRunParams);
    printJobRuns(jobRunList);
}

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
    try {
        const job = await jobService.findJob({ id: jobId });
        if (!job) {
            throw new Error(`No job found with id ${jobId}`)
        }
        const configs = getConfigurationsByTargetName(job.target);
        if (configs.target.type === "database") {
            await execMongoJob(job)
        } else if (configs.target === "object-replication") {
            const handleProgress = ({ skippedCount, processCount, uploadedCount, percent, total }) => {
                console.log(`Progress: ${percent}% - ${processCount}/${total} - - uploaded: ${uploadedCount} - Skipped: ${skippedCount} `);
            }  
            await syncObjectToDestinations(configs.target.source, configs.target.destinations, handleProgress);

        }
    } catch (error) {
        console.log(error.message);
    }
}

exports.runJob = runJob;

async function execMongoJob(job, cbOverflow) {
    try {
        const startAt = Date.now() / 1000;
        const sourceConf = searchConfig(job.source);
        const useEncryption = job.use_encryption === 1;
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

        const activeConfigDests = await getActiveDestConfigs();
        if (activeConfigDests.length === 0)
            throw new Error("No active configuration for destinations.")
        for (const conf of activeConfigDests) {
            const otherMeta = { jobId: job.id, storageConf: confName, encrypted: useEncryption };
            if (conf.type === "ssh") {
                try {
                    const remoteMng = new RemoteHost();
                    await remoteMng.connect();
                    let backupInfo = {};
                    if (useEncryption) {
                        backupInfo = await remoteMng.uploadDir(dumpMetaData.encryptedDirPath);
                    } else {
                        backupInfo = await remoteMng.uploadFile(dumpMetaData.filePath)
                    }
                    await remoteMng.disconnect();
                    backupEvent.emit("backup_success", { ...backupInfo, ...otherMeta, storage: "remote" })
                } catch (error) {
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
                    backup.emit("backup_success", { ...dumpMetaData, uploadedData, ...otherMeta, storage: "s3" })
                } catch (error) {
                    backup.emit("backup_failed", { ...dumpMetaData, ...otherMeta, storage: "s3" })
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
                    backup.emit("backup_success", { ...dumpMetaData, uploadedData, ...otherMeta, storage: "local-storage" })
                } catch (error) {
                    backup.emit("backup_failed", { ...dumpMetaData, ...otherMeta, storage: "local-storage" })
                }
            }
        }
        // Mark job as runned
        backup.emit("job_run_success", job, { startAt, finishedAt: Date.now() / 1000 })
    } catch(error) {
        backup.emit("job_run_failed", job, { startAt, finishedAt: Date.now() / 1000 })
        console.log("Fail when executing job %s. Error: %s ", job.name, error.message);
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

exports.execMongoJob = execMongoJob;