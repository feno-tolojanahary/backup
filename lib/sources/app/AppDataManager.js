const fs = require("node:fs/promises");
const { getConfigurationsByTargetName } = require("../../helper/mapConfig");
const path = require("node:path");
const exec = util.promisify(require('node:child_process').exec);
const { config } = require("../../../config");
const { getFormattedName, archivePath, getDirSize } = require("../../helper/utils");
const { encryptFile } = require("../../encryption/cryptoTools");

class AppDataManager {
    constructor(config) {
        this.config = config;
    }

    async dumpCompressData (outName = null) {
        const { sourceConf: dbSourceConf } = getConfigurationsByTargetName(this.config.name);
        const folderPath = path.join(config.workingDirectory, outName || getFormattedName("app-db-file"))
        await fs.mkdir(folderPath, { recursive: true });
        const { stdout, stderr } = await exec(`mongodump --db ${dbSourceConf.database} -o ${outName || dbSourceConf.database}`, { cwd: folderPath });
        if (stdout) {
            console.log("mongodb database dumped.")
        }
        if (stderr) {
            console.log("mongodb database dump done.");
        }

        if (this.config.files.length > 0) {
            for (const filePath of this.config.files) {
                const stat = await fs.stat(filePath);
                const destPath = path.join(folderPath, path.basename(filePath));
                if (stat.isDirectory()) {
                    await fs.cp(filePath, destPath, { recursive: true });
                } else if (stat.isFile()) {
                    await fs.copyFile(filePath, destPath);
                }
            }
        }

        const outZip = path.join(config.workingDirectory, `${path.basename(folderPath)}.zip`);
        const name = await archivePath(folderPath, outZip);
        await fs.rm(folderPath, { recursive: true });
        const zipStat = await fs.stat(outZip);
        let filePath = outZip;
        const originalSize = zipStat.size;
        let size = zipStat.size;
        let encrypted = false;
        let encryptedSize = size;
        if (config.useEncryption || this.config.useEncryption) {
            filePath = await encryptFile(outZip);
            encryptedSize = await getDirSize(filePath);
        }
        return {
            name,
            storagePath: path.basename(filePath),
            originalSize,
            size,
            filePath,
            encrypted,
            encryptedSize,
            encryptedDirPath: filePath
        }
    }
}

module.exports = AppDataManager;