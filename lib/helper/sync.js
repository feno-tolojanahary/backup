const moment = require("moment");
const { s3Log, hostLog, resumeLog } = require("../backupLog");
const { Table } = require("console-table-printer");
const path = require("node:path");

exports.getResumeLog = async () => {
    const resLog = await resumeLog.readAll();
    return resLog;
}

exports.syncLogList = async ({ s3List, remoteList }) => {
    const allList = [];
    if (Array.isArray(s3List) && s3List.length > 0) {
        await s3Log.emptyFile();                
        for (const meta of s3List) {
            const data = { 
                name: meta.Key, 
                size: `${(meta.Size / 1024).toFixed(2)} Mb`, 
                storage: "wasabi", 
                modifiedAt: meta.LastModified,
                encrypted:  meta.Key.includes(".zip") ? false : true
            };
            s3Log.objLog(data);
            allList.push(data);
        }
    }

    if (Array.isArray(remoteList) && remoteList.length > 0) {
        await hostLog.emptyFile();
        for (const meta of remoteList) {
            const data = { 
                name: meta.name, 
                size: `${(meta.size / 1024).toFixed(2)} Mb`, 
                storage: "remote",
                modifiedAt: meta.modifyTime,
                encrypted:  meta.name.includes(".zip") ? false : true
            };
            hostLog.objLog(data);
            allList.push(data);
        }
    }
}

exports.printSyncLog = async () => {
    const wasabiList = await s3Log.readAll();
    const remoteList = await hostLog.readAll();

    const list = [...wasabiList, ...remoteList];
    if (!Array.isArray(list) || list.length === 0) {
        console.log("No backups found");
        return;
    }

    // Normalize names (strip directory prefixes and known suffixes) and deduplicate
    const normalize = (name) => {
        const base = path.basename(name);
        if (base.endsWith('.meta.json')) return base.replace(/\.meta\.json$/, '');
        if (base.endsWith('.enc')) return base.replace(/\.enc$/, '');
        if (base.endsWith('.zip')) return base.replace(/\.zip$/, '');
        return base;
    }

    const grouped = new Map();
    for (const b of list) {
        const key = normalize(b.name);
        const sizeVal = typeof b.size === 'string' ? parseFloat(b.size) : (b.size || 0);
        const existing = grouped.get(key);
        if (!existing) {
            grouped.set(key, {
                name: key,
                size: sizeVal,
                rawSize: b.size,
                date: b.modifiedAt,
                storage: b.storage,
                encrypted: b.encrypted
            });
        } else {
            // keep the largest size
            if (sizeVal > (existing.size || 0)) {
                existing.size = sizeVal;
                existing.rawSize = b.size;
            }
            // keep the latest date
            if (new Date(b.modifiedAt) > new Date(existing.date)) {
                existing.date = b.modifiedAt;
            }
            // mark encrypted if any entry is encrypted
            existing.encrypted = existing.encrypted || b.encrypted;
            // prefer wasabi over remote if mixed
            if (existing.storage !== b.storage) {
                existing.storage = existing.storage || b.storage;
            }
        }
    }

    const table = new Table({
        columns: [
            { name: 'name', title: 'Name' },
            { name: 'size', title: 'Size (Mb)' },
            { name: 'date', title: 'Date' },
            { name: 'storage', title: 'Storage' },
            { name: 'encrypted', title: 'Encrypted' }
        ]
    });

    for (const entry of grouped.values()) {
        table.addRow({
            name: entry.name,
            size: entry.rawSize || (entry.size ? `${entry.size.toFixed(2)} Mb` : '0 Mb'),
            date: moment(entry.date).format("LLL"),
            storage: entry.storage,
            encrypted: entry.encrypted ? 'yes' : 'no'
        });
    }

    table.printTable();
}

exports.listBeforeDate = async (inputDate, type) => {
    const lists = [];
    let archiveLists = [];
    
    if (type === "wasabi")
        archiveLists = await s3Log.readAll();
    else
        archiveLists = await hostLog.readAll();

    if (!Array.isArray(archiveLists) || archiveLists.length === 0)
        return [];
    for (const metaBcp of archiveLists) {
        try {
            const backupDate = new Date(metaBcp.modifiedAt)
            if (backupDate < new Date(inputDate)) {
                // console.log("remote: ", metaBcp.name)
                lists.push(metaBcp.name);
            }
        } catch(error) {
            console.log(`ERROR on name ${metaBcp.name} --> `, error.message)
        }
    }
    return lists;
}