const fs = require("fs/promises");
const { constants } = require("fs");
const jobService = require("../db/jobService");
const userService = require("../db/userService");
const { getConfigurationsByTargetName } = require("../helper/mapConfig");
const { parseScheduleToSeconds } = require("../lib/utils");
const { testConf } = require("../storages/storageHelper");
const { printResTestConfig } = require("../helper/ui-console");

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

async function testConfig(targetName) {
    try {
        let { target, sourceConf, destConfigs } = getConfigurationsByTargetName(targetName);

        const resTests = [];

        const srcRes = await testConf(sourceConf);
        resTests.push(srcRes);
        for (const destConf of destConfigs) {
            const dstRes = await testConf(destConf);
            resTests.push(dstRes);
        }

        printResTestConfig(resTests);
        
        const readFileChecks = [];
        if (Array.isArray(target.files) && target.files.length > 0) {
            console.log("\n, \n Status of target files: \n");
            for (const filePath of files) {
                try {
                    await fs.access(filePath, constants.R_OK);
                    readFileChecks.push({ path: filePath, readable: true });
                } catch (error) {
                    readFileChecks.push({ path: filePath, readable: false, errorMsg: error.message })
                }
            }
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    createObjectReplication,
    syncObjectStorage,
    testConfig,
    syncObjectToLocal   
}