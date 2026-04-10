const cron = require("node-cron");
const jobService = require("../lib/db/jobService");
const { execMongoJob } = require("../lib/jobAction");
const backupService = require("../lib/db/backupService");
const RemoteHost = require("../lib/storages/remote/remoteHost");
const { config } = require("../config");
const { removeOverflowData } = require("../lib/storages/storageHelper");
const { syncAppData } = require("../lib/actions/jobAction");
const { searchConfig, findTargetConf } = require("../lib/helper/mapConfig");

const retentionTask = cron.schedule("0 * * * *", async () => {
    try {
        const jobs = await jobService.getRentetionJobs();
        const remoteInstances = new Map();
        for (const job of jobs) {
            try {
                // Connect remote host in advance
                const destinations = job.destinations;
                for (const destConfName of destinations) {
                    const confDest = searchConfig(destConfName);
                    try {
                        if (confDest.type === "ssh" && !remoteInstances.has(destConfName)) {
                            const remoteHost = new RemoteHost(confDest);
                            await remoteHost.connect();
                            remoteInstances.set(destConfName, remoteHost);
                        }
                    } catch (error) {
                        console.log("Error when connecting to the host %s. Error: %s ", `${confDest.username}@${confDest.host}`, error.message)
                    }
                }
                await backupService.deleteExpiredBackupByJob(job, remoteInstances);
            } catch (error) {
                console.log("Error when remove old retention for job %. Error: %s ", job.name, error.message)
            }
        }
        // Disconnect all remote host
        if (remoteInstances.size > 0) {
            for (const remoteHost of remoteInstances.values()) {
                try {
                    await remoteHost.disconnect();
                } catch (err) {}
            }
        }
    } catch (error) {
        console.log("Error when launching cleanup old backup: ", error.message);
    }
})

async function deleteOverFlowDataStorage (newBackupSize) {
    newBackupSize = newBackupSize * 1024;
    // delete overflow local storage
    for (const localConf of config.localStorages) {
        if (localConf.maxDiskUsage) {
            localConf.type = "local-storage"
            await removeOverflowData(localConfig, newBackupSize);
        }
    }
    for (const s3Conf of config.s3) {
        if (s3Conf.maxDiskUsage) {
            s3Conf.type = "s3";
            await removeOverflowData(s3Conf, newBackupSize)
        }
    }
    for (const remoteConf of config.hosts) {
        if (remoteConf.maxDiskUsage) {
            remoteConf.type = "remote";
            await removeOverflowData(remoteConf, newBackupSize);
        }
    } 
}

let wakeUpTimer = null;

const launchSchedule = async () => {
    try {
        if (wakeUpTimer) clearTimeout(wakeUpTimer);
        const runJobs = await jobService.getNextRunJob(Date.now() / 1000);
        if (runJobs && runJobs.length > 0) {
            // Execute jobs
            for (const job of runJobs) {
                const targetConf = findTargetConf(job.target);
                if (targetConf.type === "database") {
                    await execMongoJob(job, deleteOverFlowDataStorage);
                } else if (targetConf.type === "app") {
                    await syncAppData(job, deleteOverFlowDataStorage);
                } else if (targetConf.type === "object-replication") {
                    const configs = getConfigurationsByTargetName(job.target);
                    const handleProgress = ({ skippedCount, processCount, uploadedCount, percent, total }) => {
                        console.log(`Progress: ${percent}% - ${processCount}/${total} - - uploaded: ${uploadedCount} - Skipped: ${skippedCount} `);
                    }
                    await syncObjectToDestinations(configs.target.source, configs.target.destinations, handleProgress);
                }
            }
        }
        const nextJob = await jobService.getNextToLaunch();
        if (!nextJob) {
            return;
        }
        const nextTimer = Math.max(Number(nextJob.next_run_at) * 1000 - Date.now(), 1000) ;
        wakeUpTimer = setTimeout(launchSchedule, nextTimer);
    } catch (error) {
        console.log("Error wake up schedule: ", error.message);
    }
}

module.exports = {
    retentionTask,
    launchSchedule
}