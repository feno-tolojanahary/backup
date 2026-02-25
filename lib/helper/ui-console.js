const moment = require("moment");
const { prompt } = require("enquirer");
const { Table } = require("console-table-printer");
const zxcvbn = require("zxcvbn");
const MAX_ATTEMPT = 5;
const FAILED_TIMEOUT = 2000;

exports.getNewPassword = async () => {
    while (true) {
        const { p1 } = await prompt({
            type: "password",
            name: "p1",
            message: "Enter new password"
        })

        const { p2 } = await prompt({
            type: "password",
            name: "p2",
            message: "Confirm password"
        })

        if (p1.length < 14) {
            console.log("Too short — use at least 14 characters or a passphrase.");
            continue;
        }

        if (zxcvbn(p1).score < 3) {
            console.log("This looks weak — consider a longer or more random passphrase.");
            continue;
        }

        if (p1 !== p2) {
            console.log("Passwords do not match");
            continue;
        }
        return p1;       
    }
}

exports.unlockPrompt = async (testPassword) => {
    let attempt = 0;
    while (attempt < MAX_ATTEMPT) {
        const { password} = await prompt({
            type: "password",
            name: "password",
            message: "Enter password"
        })

        const isOk = await testPassword(password)
        if (isOk) 
            break;
        await new Promise(r => setTimeout(r, FAILED_TIMEOUT));
        continue;
    }   
    process.exit(0)
}

exports.printTable = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
        console.log("No entry found.");
        return;
    }
    const table = new Table({
        columns: [
            { name: "id", title: "ID" },
            { name: 'name', title: 'Name' },
            { name: 'size', title: 'Size (Mb)' },
            { name: 'date', title: 'Date' },
            { name: 'storage', title: 'Storage' },
            { name: 'encrypted', title: 'Encrypted' }
        ]
    });

    for (const entry of list) {
        table.addRow({
            id: entry.backupUid ?? "",
            name: entry.name,
            size: entry.size ? `${(entry.size / 1024).toFixed(2)} Mb` : '0 Mb',
            date: moment(entry.modifiedAt).format("LLL"),
            storage: entry.storage,
            encrypted: entry.encrypted === 1 ? 'yes' : 'no'
        });
    }

    table.printTable();
}

exports.printJobs = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
        console.log("No entry found.");
        return;
    }

    const table = new Table({
        columns: [
            { name: "id", title: "ID" },
            { name: "name", title: "Name" },
            { name: "status", title: "Status" },
            { name: "storage", title: "Storage" },
            { name: "schedule", title: "Schedule" }
        ]
    })

    for (const job of list) {
        table.addRow({
            id: job.id,
            name: job.name,
            status: job.status,
            storage: job.storage,
            schedule: ` ${job.scheduleValue} (${job.scheduleType})`
        })
    }

    table.printTable();
}

exports.printS3Configs = (configs) => {
    if (!Array.isArray(configs) || configs.length === 0) {
        console.log("No config entry found.");
        return;
    }   

    const table = new Table({
        columns: [
            { name: "name", title: "Name" },
            { name: "accessKey", title: "Access Key" },
            { name: "secretKey", title: "Secret Key" },
            { name: "bucketName", title: "Bucket" },
            { name: "status", title: "Status" },
            { name: "errorMsg", title: "Error" }
        ]
    })

    for (const config of configs) {
        table.addRow(config)
    }

    table.printTable();
}

exports.printHostConfigs = (configs) => {
    if (!Array.isArray(configs) || configs.length === 0) {
        console.log("No config entry found.");
        return;
    }

    const table = new Table({
        columns: [
            { name: "name", title: "Name" },
            { name: "login", title: "Login identifier" },
            { name: "port", title: "Port" },
            { name: "status", title: "Status" },
            { name: "errorMsg", title: "Error" }
        ]
    })

    for (const config of configs) {
        table.addRow({
            name: config.name,
            login: `${config.username}@${config.host}`,
            port: config.port,
            status: config.status,
            errorMsg: config.errorMsg
        })       
    }

    table.printTable();
}