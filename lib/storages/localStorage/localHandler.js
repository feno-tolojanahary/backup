const { config } = require("../../../config");

exports.hasValidConfig = () => {
    if (!Array.isArray(config.localStorages) || config.localStorages.length === 0)
        return false
    const firstConf = config.localStorages[0];
    return firstConf.name && firstConf.destinationFolder;
}