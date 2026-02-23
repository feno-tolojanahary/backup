

const { listAllObjectsFromSourceBucket, replicateMissingObjectsToDestination } = require("../lib/s3/s3sync");
const jobService = require("../lib/db/jobService");
const userService = require("../lib/db/userService");

async function createObjectReplication(opts) {
    const sourceObjects = await listAllObjectsFromSourceBucket({
        source: opts.source,
        sourceConfig: opts.sourceConfig,
        prefix: opts.prefix || ""
    });

    const replicationResult = await replicateMissingObjectsToDestination({
        source: opts.source,
        sourceConfig: opts.sourceConfig,
        destination: opts.destination,
        destinationConfig: opts.destinationConfig,
        sourceObjects
    });

    const jobConfig = {
        type: "object-replication",
        sourceConfig: opts.sourceConfig,
        sourceBucket: opts.source,
        destinationConfig: opts.destinationConfig,
        destinationBucket: opts.destination,
        prefix: opts.prefix || "",
        sourceObjectCount: sourceObjects.length,
        uploadedCount: replicationResult.uploaded.length,
        skippedCount: replicationResult.skipped.length
    };

    const adminUser = await userService.adminUser();
    const job = {
        name: `object-replication:${opts.source}->${opts.destination}`,
        storages: [{
            type: "object-replication",
            sourceConfig: opts.sourceConfig,
            sourceBucket: opts.source,
            destinationConfig: opts.destinationConfig,
            destinationBucket: opts.destination,
            prefix: opts.prefix || ""
        }],
        status: "running",
        scheduleType: "manual",
        scheduleValue: null,
        createdBy: adminUser.id
    };

    const insertRes = await jobService.insert(job);
    if (!insertRes.success) {
        console.log("Error creating object replication job:", insertRes.message);
        return;
    }

    console.log("Object replication job configuration:");
    console.log(JSON.stringify(jobConfig, null, 2));
    console.log(`Found ${sourceObjects.length} object(s) in source bucket "${opts.source}".`);
    console.log(`Object replication job saved with id ${insertRes.lastID}.`);
}

async function syncObjectStorage(opts) {
    const sourceObjects = await listAllObjectsFromSourceBucket({
        source: opts.source,
        sourceConfig: opts.sourceConfig,
        prefix: opts.prefix || ""
    });

    const replicationResult = await replicateMissingObjectsToDestination({
        source: opts.source,
        sourceConfig: opts.sourceConfig,
        destination: opts.destination,
        destinationConfig: opts.destinationConfig,
        sourceObjects
    });

    const syncConfig = {
        sourceConfig: opts.sourceConfig,
        sourceBucket: opts.source,
        destinationConfig: opts.destinationConfig,
        destinationBucket: opts.destination,
        prefix: opts.prefix,
        sourceObjectCount: sourceObjects.length,
        uploadedCount: replicationResult.uploaded.length,
        skippedCount: replicationResult.skipped.length
    };
    console.log("Object sync configuration:");
    console.log(JSON.stringify(syncConfig, null, 2));
}

module.exports = {
    createObjectReplication,
    syncObjectStorage
}
