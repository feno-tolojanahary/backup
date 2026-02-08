const path = require("node:path");
require("dotenv").config();
const fs = require('node:fs');
const net = require("net");
const { config } = require("./config");
const { Command } = require('commander');
const { spawn } = require("node:child_process");
const Action = require("./lib/action");
const dbDriver = require("./lib/dbdriver");
const { CronExpressionParser } = require("cron-parser");

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

program
    .name("backupdb")
    .description("Backup mongoose db into wasabi s3")
    .version("1.0.0");

program.command("now")
    .description("Run a backup of a database now")
    .argument("[name]", "database name")
    .option("-w, --wasabi", "send the backup to wasabi")
    .option("-r, --remote", "send the backup to the remote servers")
    .option("-t, --tag <name>", "Specify the name of the compressed file")
    .action(Action.backupManually);

program.command("configure")
    .description("Configure backup password for the global user")
    .action(Action.setupPassword)

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
    .option("-w, --wasabi", "Only the list of backup on wasabi")
    .option("-r, --remote", "Only the list of backup on the remote server")
    .option("-a, --all", "Resume the list of all backup")
    .option("-s, --syncAll", "Launch synchronisation of the backup list")
    .action(Action.backupList);

program.command("restore <name>")
    .option("-w, --wasabi", "restore the backup file from wasabi")
    .option("-r, --remote", "restore the backup file from a remote server")
    .option("--to <restorename>", "Restore the backup as a database name")
    .option("-h, --host <hostname>", "Host name to download the file for restoration")
    .description("Restore a backup directly into the database. Requires the vault to be unlocked and decrypts data in memory only.")
    .action(Action.restoreBackup)

program.command("logs")
    .description("Show the log of the running deamon")
    .action(Action.watchLogDaemon2)

program.command("download")
    .argument("[name]", "backup name")
    .description("Download an encrypted backup and its metadata to local storage. Does not require a password and never decrypts data.")
    .requiredOption("-o, --output", "Where to save encrypted file")
    .action(Action.download);

program.command("export")
    .argument("[name]", "backup name")
    .description("Decrypt and export a backup as plaintext files to a specified directory. Requires the vault to be unlocked and writes decrypted data to disk.")
    .requiredOption("-o, --output", "Where to save the decrypted file")
    .action(Action.export);

program.command("health")
    .description("Check all status of servers connections")
    .action(Action.checkHealth)

program.command("remove")
    .argument("[name]", "backup name")
    .description("Manually remove backup")
    .option("-w, --wasabi", "Remove backup on wasabi")
    .option("-r, --remote", "Remove backup on remote host")
    .action(Action.removeBackup);

program.command("reset")
    .option("-w, --wasabi", "Reset all storage on wasabi")
    .option("-r, --remote", "Reset all storage on the remote server")
    .action(Action.resetStorage)

program.parse();

function isDaemonStarted () {
    return new Promise((resolve) => {
        const socket = net.createConnection(IPC_PATH);
        socket.once("connect", () => {
            socket.destroy();
            resolve(true);
        })
        socket.once("error", () => {
            resolve(false)
        })
    })
}

async function startDaemon() {
    try {
        if (await isDaemonStarted()) {
            console.log("Service backup already active.");
            process.exit(0);
        }
        const daemonOut = fs.openSync(config.daemonOut, 'a');
        const daemonErr = fs.openSync(config.daemonErr, 'a');
        const daemon = spawn("node", [ "./server/daemon" ], {
            detached: true,
            stdio: [ 'ignore', daemonOut, daemonErr ]
        });
        daemon.unref();
        console.log("Backup service started.");
    } catch (error) {
        console.log("Error starting daemon: ", error.message)
    }
    process.exit(0);
}

async function statusDaemon() {
    if (await isDaemonStarted()) 
        console.log("Service backup status: [active]");
    else 
        console.log("Service backup status: [not active]");
    process.exit(0);
}

async function stopDaemon() {
    const socket = net.createConnection(IPC_PATH);
    socket.on("connect", () => {
        socket.write(JSON.stringify({ action: "shutdown" }))
        console.log("Service backup stopped.");
    });
    socket.on("error", () => {
        console.log("The backup service is not running.");
    })
}

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
