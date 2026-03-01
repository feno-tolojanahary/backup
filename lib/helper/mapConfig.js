const { config } = require("../../config");

function resolveS3Config (nameConf = null) {
    if (!config.infrastructure.destinations.s3?.[0])
        return {};
    if (!nameConf) {
        return config.infrastructure.destinations.s3[0];
    }

    const foundConf = config.infrastructure.destinations.s3.find(({ name }) => name === nameConf) || config.infrastructure.destinations.s3[0];
    if (foundConf.accessKey && foundConf.secretKey && foundConf.bucketName && foundConf.endpoint) {
        return foundConf
    }
    console.log("Warning, existing s3 config is not complete.");
    const envConfig = {
        accessKey: process.env.WS3_ACCESS_KEY_ID,
        secretKey: process.env.WS3_SECRET_ACCESS_KEY,
        endpoint: process.env.WS3_ENDPOINT,
        bucketName: process.env.WS3_DEFAULT_BUCKET,
        region: process.env.WS3_REGION
    }
    return envConfig;
}

function resolveRemoteConfig (nameConf = null) {
    if (!config.infrastructure.destinations.hosts?.[0])
        return {};
    if (!nameConf) 
        return config.infrastructure.destinations.hosts[0];
    const foundConf = config.infrastructure.destinations.hosts.find(({ name }) => name === nameConf) || config.infrastructure.destinations.hosts[0] ;
    return foundConf;
}

function resolveLocalConfig (nameConf = null) {
    if (!config.infrastructure.destinations.localStorages?.[0])
        return {};
    if (!nameConf)
        return config.infrastructure.destinations.localStorages[0];
    const foundConf = config.infrastructure.destinations.localStorages.find(({ name }) => name === nameConf) || config.infrastructure.destinations.localStorages[0];
    return foundConf;
}

function getS3Config (nameConf = null) {
    const nameConf = `${nameConf ? nameConf : ""}`.trim();
    const configs = Array.isArray(config.infrastructure.destinations.s3) ? config.infrastructure.destinations.s3 : [];
    return configs.find(({ name }) => name === nameConf) || {}   
}

function getRemoteConfigs () {
    if (!Array.isArray(config.infrastructure.destinations.hosts) || config.infrastructure.destinations.hosts.length === 0) 
        return [];
    return config.infrastructure.destinations.hosts;
}

function findHostConfig (confName) {
    const hostConfs = getRemoteConfigs();
    const foundConf = hostConfs.find(({ name }) => name === confName);
    const validConf = foundConf.host && foundConf.username && (foundConf.password || foundConf.privateKey) 
    if (!validConf) 
        throw new Error(`SSH configuration for ${confName} is not valid.`);
    return foundConf;
}

function searchConfig (confName) {
    const s3Conf = getS3Config(confName)
    if (s3Conf) return { ...s3Conf, type: "s3" };
    const hostConf = findHostConfig(confName);
    if (hostConf) return { ...hostConf, type: "ssh" };
    const mongodbConf = Array.isArray(config.infrastructure.destinations.mongodb) 
                            ? config.infrastructure.destinations.mongodb.find(({name}) => name === confName) : null;
    if (mongodbConf)
        return { ...mongodbConf, type: "mongodb" };
    const localStorage = Array.isArray(config.infrastructure.destinations.localStorages) ? config.infrastructure.destinations.localStorages.find(({ name }) => name === confName) : null;
    if (localStorage)
        return { ...localStorage, type: "local-storage" }
    return;
}

function resolveMongodbConf (confName = null) {
    if (!Array.isArray(config.infrastructure.destinations.mongodb) || config.infrastructure.destinations.mongodb.length === 0) 
        throw new Error("Not mongodb configuration set.");
    const foundConf = config.infrastructure.destinations.mongodb.find(({ name }) => name === confName);
    return foundConf ? foundConf : config.infrastructure.destinations.mongodb[0];
}

function getSourceConfByTargetName(targetName = null) {
    if (!Array.isArray(config.targets) || config.targets.length === 0) 
        throw new Error("No target configuration defined.");
    const foundTarget = config.targets.find(({name}) => name === targetName);
    if (!foundTarget)
        return;
    const sourceConf = searchConfig(targetName);
    if (!sourceConf) 
        throw new Error(`No matching configuration source found for name ${foundTarget.source}`)
    return sourceConf
}

function getConfigurationsByTargetName(targetName = null) {
    if (!Array.isArray(config.targets) || config.targets.length === 0) 
        throw new Error("No target configuration defined.");
    const foundTarget = config.targets.find(({name}) => name === targetName);
    if (!foundTarget)
        return;
    const destConfigs = [];
    for (const dest of foundTarget.destinations) {
        const destConf = searchConfig(dest);
        if (!destConf)
            throw new Error(`No maching configuration found for destination name ${dest}`);
        destConfigs.push(destConf);
    }
    const sourceConf = searchConfig(targetName);
    if (!sourceConf) 
        throw new Error(`No matching configuration source found for name ${foundTarget.source}`)
    return { target: foundTarget, destConfigs, sourceConf };
}

module.exports = {
    getS3Config,
    resolveS3Config,
    findHostConfig,
    searchConfig,
    resolveMongodbConf,
    resolveLocalConfig,
    resolveRemoteConfig,
    getSourceConfByTargetName,
    getConfigurationsByTargetName
}