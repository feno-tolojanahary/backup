const { config } = require("../../config");

const normalize = (value) => (typeof value === "string" ? value.trim() : "");

const getS3Configs = () => {
    if (!Array.isArray(config.s3)) {
        return [];
    }
    return config.s3;
};

const getS3Config = (configName = null) => {
    const configs = getS3Configs();
    if (!configs.length) {
        return {};
    }

    const name = normalize(configName);
    if (!name) {
        return configs[0];
    }

    return configs.find((cfg) => normalize(cfg.name || cfg.configName) === name) || configs[0];
};

module.exports = { getS3Configs, getS3Config };
