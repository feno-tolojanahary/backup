const { Command } = require('commander');
const program = new Command();
const fs = require('node:fs');
const Action = require("./lib/action");
const { spawn } = require('node:child_process');
const readline = require("node:readline");
const cron = require("node-cron");


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
    .description("Start the backup daemon")
    .action(start);



program.parse();

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

async function init() {
    try {
        if (!fs.existsSync(config.workingDirectory)) {
            fs.mkdirSync(config.workingDirectory);
        }  
        if (!fs.existsSync(config.backupLog)) {
            fs.mkdirSync(config.backupLog);
        }
    } catch(error) {
        console.log("Error creating system backup directories: ", error.message);
    }
}

init();

function start() {
    const outFile = fs.openSync("log/daemon-out.log", 'a');
    const errFile = fs.openSync("log/daemon-out.log", 'a');
    const daemon = spawn('node', ["lib/daemon.js"], {
        detached: true,
        stdio: [ 'ignore', outFile, errFile ]
    })
    daemon.unref();
    fs.writeFileSync("log/pid.log", `0 ${daemon.pid} start`, { flag: 'a' });
}

async function stop() {
    try {
        const streamPid = fs.createReadStream("log/pid.log");
        const rl = readline.createInterface({
            input: streamPid,
            crlDelay: Infinity
        })
        rl.on()
    } catch (error) {
        console.log("error stopping the process: ", error.message);
    }
}

