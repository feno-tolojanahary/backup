const path = require("node:path");
require("dotenv").config();
const fs = require('node:fs');
const { config } = require("./config");
const { Command } = require('commander');
const Action = require("./lib/actions/action");
const dbDriver = require("./lib/dbdriver");
const { CronExpressionParser } = require("cron-parser");
const { startDaemon, statusDaemon, stopDaemon } = require("./server/daemonHandler");
const remoteHandler = require("./lib/storages/remote/remoteHandler");
const jobAction = require("./lib/db/jobService");
const targetAction = require("./lib/actions/targetAction");
const program = new Command();

function createEnvFile () {
    return new Promise((resolve, reject) => {
        try {
            const envPath = path.join(__dirname, ".env");
            const baseEnvContent = `WS3_ACCESS_KEY=\nWS3_SECRET_KEY=\nWS3_BUCKET_NAME=`
            if (!fs.existsSync(envPath)) {
                fs.writeFile(envPath, baseEnvContent, (error) => { 
                    if (error)
                        console.log(error)
                    resolve()
                })  
            } else {
                resolve()
            }
        } catch (error) {
            console.log("Error when creating .env file: ", error.message);
            reject(error);
        }
    })
}

function validateConfig () {
    if (config.cronJob) {
        try {
            CronExpressionParser.parse(config.cronJob);
        } catch {
            throw new Error(`In the configuration file, cronJob don't have a valid cron expression value ${config.cronJob}`);
        }
    }
}

async function init() {
    try {
        // ensure that the destination folder on the remote exist
        await remoteHandler.ensureDestFolder();

        if (!fs.existsSync(config.workingDirectory)) {
            fs.mkdirSync(config.workingDirectory);
        }  
        if (!fs.existsSync(config.backupLog)) {
            fs.mkdirSync(config.backupLog);
        }
        if (!fs.existsSync(config.dataDirectory)) {
            fs.mkdirSync(config.dataDirectory);
        }
        await createEnvFile();
    } catch(error) {
        console.log("Error creating system backup directories: ", error.message);
    }
    validateConfig();
}

init();

const collectArgs = (value, previous) => {
    return previous.concat(value);
}

program
    .name("backupdb")
    .description("Backup mongoose db into wasabi s3")
    .version("1.0.0");

// to replace with job later
program.command("now")
    .description("Run a backup of a database now")
    .requiredOption("-s, --source", "The configuration name of data for the backup")
    .option("--s3", "Backup to an s3 storage only")
    .option("-r, --remote", "Backup into a remote server only")
    .option("-l, --local-storage", "Backup into a local storage only")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .option("-t, --tag <name>", "Specify the name of the compressed file")
    .action(Action.backupManually);

program.command("configure")
    .description("Configure backup password for the global user")
    .action(Action.configure)

program.command("unlock")
    .description(`Unlocks the vault for the current session by prompting for the password.
                The vault remains unlocked only while this process is running and
                automatically locks on exit or after inactivity.`)
    .action(Action.unlockVault)

program.command("lock")
        .description(`Locks the vault immediately by clearing encryption keys from memory.
                    Any operation requiring access to the vault will require unlocking again.`)
        .action(Action.lockVault);

program.command("test")
    .description("Launch a test of the mongodb database connection")
    .argument("[name]", "database name")
    .action(testDatabaseConnection);

program.command("list-config")
    .description("List all configuration and give a status of each config")
    .action(Action.listConfigs)

program.command("start")
    .description("Start the service backup")
    .action(startDaemon);

program.command("status")
    .description("Check status of service backup")
    .action(statusDaemon);

program.command("stop")
    .description("Stop the service backup")
    .action(stopDaemon);

program.command("list")
    .description("Get list of backup")
    .option("--s3", "Only the list of backup on s3 storage")
    .option("-r, --remote", "Only the list of backup on the remote server")
    .option("-l, --local", "List of the backup on local storage only")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .option("-a, --all", "Resume the list of all backup")
    .option("-s, --syncAll", "Launch synchronisation of the backup list")
    .action(Action.backupList);

program.command("restore <backup>")
    .description("Restore a backup by id or name directly into the database. Requires the vault to be unlocked and decrypts data in memory only.")
    .option("--s3", "restore the backup file from an s3 storage")
    .option("-r, --remote", "restore the backup file from a remote server")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .option("--to <restorename>", "Restore the backup as a database name")
    .action(Action.restoreBackup)

program.command("logs")
    .description("Show the log of the running deamon")
    .action(Action.watchLogDaemon2)

program.command("download")
    .argument("[backup]", "Id or name of the backup")
    .description("Download an encrypted backup and its metadata to local storage. Does not require a password and never decrypts data.")
    .requiredOption("-o, --output", "Where to save encrypted file")
    .action(Action.download);

program.command("export")
    .argument("[backup]", "Id or name of the backup")
    .description("Decrypt and export a backup as plaintext files to a specified directory. Requires the vault to be unlocked and writes decrypted data to disk.")
    .requiredOption("-o, --output", "Where to save the decrypted file")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .action(Action.export);

program.command("health")
    .description("Check all status of servers connections")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .action(Action.checkHealth)

program.command("remove")
    .argument("[backup]", "Id or name of the backup")
    .description("Manually remove backup")
    .option("--s3", "Remove backup on a s3 storage")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")    .option("-r, --remote", "Remove backup on remote host")
    .action(Action.removeBackup);

    
    // This is used for development purpose
program.command("reset")
    .option("--s3", "Reset all storage on a s3 storage")
    .option("--s3-config <name>", "S3 configurationn to use (default is the first configured entry)")
    .option("--remote-config <name>", "Remote host configuration to use (default is the first configured entry)")
    .option("--local-storage-config <name>", "Name of the local storage configuration to use (default is the first configured entry)")
    .option("-r, --remote", "Reset all storage on the remote server")
    .option("-t, --table", "Reset backups table")
    .option("-a, --all", "Reset all backups data")
    .action(Action.resetStorage)
    
const jobCmd = program.command("job")
    .description("Manage job for the backup")
    
    jobCmd.command("list")
        .description("List all backup jobs")
        .action(jobAction.listJob)

    jobCmd.command("disable")
        .option("-n, --name <name>", "Job name")
        .option("--id", "Job id")
        .action(jobAction.disableJob)
        
    jobCmd.command("enable")
        .option("-n, --name <name>", "Job name")
        .option("--id", "Job id")
        .action(jobAction.enableJob)
    
        const jobCreateCmd = jobCmd.command("create")
            .description("Create a backup job")
            .requiredOption("-n, --name <name>", "Job name")
            .requiredOption("-t, --target", "Name of the target specified on the configuration")
            .option("-i, --interval", "Run the job every interval (e.g. 1h, 24h)")
            .option("-c, --cron", "Precise a cron string to schedule the backup job")
            .action(jobAction.createJob)

        // S3 Object replication and backup
        jobCreateCmd.command("object-replication")
            .description("Create an object replication job")
            .requiredOption("--name <name>", "The job name")
            .requiredOption("-t, --target", "Name of the target specified on the configuration")
            .requiredOption("--schedule <value>", "Execution schedule for the job. Supports intervals (e.g. 1h, 24h, 30m)")
            .action(targetAction.createObjectReplication)
    
    jobCmd.command("history")
        .description("Show the history execution of a job")
        .arguments("<job-id>", "Job id")
        .option("--status", "Filter list by status success|failed|partial")
        .option("--since", "History since a date e.g. 2026-02-01")
        .action(jobAction.jobRunList)

    jobCmd.command("run")
        .argument("<job-id>")
        .description("Execute imediatly a job")
        .action(jobAction.runJob)

// const objectCmd = program.command("target")
//     .description("Manage target configuration");

    objectCmd.command("test-config")
        .description("Test connexion of existing configurations")
        .requiredOption("--name", "Configuration name")
        .action(targetAction.testConfig)
    
program.parse();


async function testDatabaseConnection(cmd, opts) {
    ((async () => {
        let dbName = cmd;
        if (!dbName) {
            dbName = config.dbName;
        }
        const uri = "mongodb://localhost:27017";
        const exists = await dbDriver.databaseExists(uri, dbName);
        if (exists) {
            console.log(`Connected to the database ${dbName}`);
        } else {
            console.log(`Could not connect to the database ${dbName}`);
        }
        process.exit(0);
    }))()
}
