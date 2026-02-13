const { MongoClient } = require("mongodb");
const util = require('node:util');
const fs = require('node:fs/promises');
const {
    existsSync
} = require("node:fs")
const path = require('node:path');
const AdmZip = require("adm-zip");
const { config } = require("./../config");
const exec = util.promisify(require('node:child_process').exec);
const { archivePath, getDirSize } = require("./utils");
const { encryptFile } = require("./encryption/cryptoTools")

exports.databaseExists = async (uri, dbName) => {
   
    try {
        const client = new MongoClient(uri, { connectTimeoutMS: 5000 });
        await client.connect();
        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();
        const exists = databases.some(db => db.name === dbName);
        return exists;
    } catch (err) {
        return false;
    }
}

exports.plainDumpMongoDb = async (outName) => {
    const { stdout, stderr } = await exec(`mongodump --db ${config.dbName} -o ${outName}`, 
                                    { cwd: config.workingDirectory })
    console.log("start dumping database")
    if (stderr) {
        console.log("database backup done ");
        // process.exit(1);     
    }
    if (stdout) {
        console.log("dump database: ", stdout);
    }
    
    const outZip = path.join(config.workingDirectory, `${outName}.zip`);
    const filePath = path.join(config.workingDirectory, outName);
    const name = await archivePath(filePath, outZip);
    const stat = await fs.stat(filePath);
    return { 
        name,
        size: stat.size / 1024 / 1024 
    };
}

exports.dumpMongoDb = async (outName) => {
    const { stdout, stderr } = await exec(`mongodump --db ${config.dbName} -o ${outName}`, 
                                    { cwd: config.workingDirectory })
    console.log("start dumping database")
    if (stderr) {
        console.log("database backup done ");
        // process.exit(1);     
    }
    if (stdout) {
        console.log("dump database: ", stdout);
    }
    
    const outZip = path.join(config.workingDirectory, `${outName}.zip`);
    const filePath = path.join(config.workingDirectory, outName);
    const name = await archivePath(filePath, outZip);
    await fs.rm(filePath, { recursive: true });
    const stat = await fs.stat(outZip);
    const encryptedDir = await encryptFile(outZip);
    await fs.unlink(outZip)    
    const cryptoDirSize = await getDirSize(encryptedDir);
    return { 
        name,
        size: stat.size / 1024 / 1024,
        encryptedSize: cryptoDirSize,
        encryptedDirPath: encryptedDir
    };
}

exports.restoreMongoDb = async (zipPath, dbName) => {
    const ensureDir = (dirName) => {
        if (!existsSync(dstFolderPath)) 
        return fs.mkdir(dstFolderPath);
    }
    console.log("restoring mongodb database");
    if (!dbName) {
        dbName = path.basename(zipPath).split(".")[0];
    }
    let dstFolderPath = "flattedMongoDB";
    await ensureDir(dstFolderPath);
    dstFolderPath = path.join(dstFolderPath, dbName);
    await ensureDir(dstFolderPath);
    const zip = new AdmZip(zipPath);
    await zip.extractAllToAsync(dstFolderPath, true);
    const folderPath = path.join(dstFolderPath, config.dbName);
    console.log("exec cmd:", `mongorestore --db ${dbName} ${folderPath}`)
    const { stdout, stderr } = await exec(`mongorestore --db ${dbName} ${folderPath}`);
    if (stderr) {
        console.log("database restored to %s", dbName);
    }
    if (stdout) {
        console.log("restoring database: ", stdout);
    }
}