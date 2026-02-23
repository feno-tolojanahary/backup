

async function createObjectReplication(opts) {
    const jobConfig = {
        type: "object-replication",
        sourceConfig: opts.sourceConfig,
        sourceBucket: opts.sourceBucket,
        destinationConfig: opts.destinationConfig,
        destinationBucket: opts.destinationBucket
    };
    console.log("Object replication job configuration:");
    console.log(JSON.stringify(jobConfig, null, 2));
}

async function syncObjectStorage(opts) {
    const syncConfig = {
        sourceConfig: opts.sourceConfig,
        sourceBucket: opts.source,
        destinationConfig: opts.destinationConfig,
        destinationBucket: opts.destination,
        prefix: opts.prefix
    };
    console.log("Object sync configuration:");
    console.log(JSON.stringify(syncConfig, null, 2));
}

module.exports = {
    createObjectReplication,
    syncObjectStorage
}