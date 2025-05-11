const util = require('node:util');
require("dotenv").config();
const fs = require('node:fs');
const { config } = require("./config");
const { Command } = require('commander');
const Log = require("./lib/log");
const { spawn } = require("node:child_process");
const { ProcessData } = require("./lib/localData");
const Action = require("./lib/action");

const program = new Command();
const processData = new ProcessData();

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
    } catch(error) {
        console.log("Error creating system backup directories: ", error.message);
    }
}

init();

program
    .name("backupdb")
    .description("Backup mongoose db into wasabi s3")
    .version("1.0.0");

program.command("now")
    .description("Run a backup of a database now")
    .option("-n, --name <value>", "set the name of the database backup")
    .option("-w, --wasabi", "also send a backup to wasabi")
    .action(backupManually);

program.command("start")
    .description("Start the service backup")
    .action(startDaemon);

program.command("status")
    .description("Check status of service backup")
    .action(statusDaemon);

program.command("stop")
    .description("Stop the service backup")
    .action(stopDaemon);

program.parse();

const logFile = new Log("backup.log");

function isDaemonActive () {
    try {
        const pid = processData.read();
        if (!pid) {
            throw Error("not active")
        }
        process.kill(parseInt(pid), 0);
        return pid;
    } catch(_err) {
        return null;
    }
}

async function startDaemon() {
    try {
        if (isDaemonActive()) {
            console.log("Service backup already active.");
            process.exit(0);
        }
        const daemonOut = fs.openSync('./log/daemon.log', 'a');
        const daemonErr = fs.openSync('./log/daemon.error', 'a');
        const daemon = spawn("node", [ "./lib/daemon" ], {
            detached: true,
            stdio: [ 'ignore', daemonOut, daemonErr ]
        });
        daemon.unref();
        localData.save(daemon.pid.toString());
        console.log("Backup service started.");
    } catch (error) {
        console.log("Error starting daemon: ", error.message)
    }
    process.exit(0);
}

async function statusDaemon() {
    if (isDaemonActive()) 
        console.log("Service backup status: [active]");
    else 
        console.log("Service backup status: [not active]");
    process.exit(0);
}

async function stopDaemon() {
    try {
        const pid = processData.read();
        if (!pid) {
            console.log("The backup service is not running")
        }
        process.kill(pid, 'SIGTERM');
        // empty log file
        processData.empty();
        const pidDaemon = isDaemonActive();
        if (!pidDaemon) {
            console.log("Service backup stoped.")
        } else {
            console.log(`Service backup still running, pid: [${pidDaemon}]`);
        }
    } catch(_err) { 
        console.log("Error when trying to stop service backup");
    }
    process.exit(0);
}

function backupManually (cmd, opts) { 
    (async () => {
        const dbName = opts.opts().name;
        const backupName = await Action.dumpDatabase(dbName);
        await logFile.log(backupName);
        if (opts.opts().wasabi) {   
            const res = await Action.copyBackupToS3(backupName);
            if (res) console.log("sending backup to s3 done")
        }
        process.exit();
    })()
}

