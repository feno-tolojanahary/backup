const { config } = require("../../config");

function resolveS3Config (nameConf = null) {
    if (!config.s3?.[0])
        return {};
    if (!nameConf) {
        return config.s3[0];
    }

    const foundConf = config.s3.find(({ name }) => name === nameConf) || config.s3[0];
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

function getS3Config (nameConf = null) {
    const nameConf = `${nameConf ? nameConf : ""}`.trim();
    const configs = Array.isArray(config.s3) ? config.s3 : [];
    return configs.find(({ name }) => name === nameConf) || {}   
}

function getHostConfigs () {
    if (!Array.isArray(config.hosts) || config.hosts.length === 0) 
        return [];
    return config.hosts;
}

function findHostConfig (confName) {
    const hostConfs = getHostConfigs();
    const foundConf = hostConfs.find(({ name }) => name === confName);
    const validConf = foundConf.host && foundConf.username && (foundConf.password || foundConf.privateKey) 
    if (!validConf) 
        throw new Error(`SSH configuration for ${confName} is not valid.`);
    return foundConf;
}

function searchConfig (confName) {
    const s3Conf = getS3Config(confName)
    if (s3Conf) return s3Conf;
    const hostConf = findHostConfig(confName);
    return hostConf;
}

module.exports = {
    getS3Config,
    resolveS3Config,
    findHostConfig,
    searchConfig
}