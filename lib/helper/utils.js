const fs = require("node:fs");
const { readdir, stat } = require("node:fs/promises");
const chokidar = require("chokidar");
const path = require("node:path");
const archiver = require("archiver");
const readline = require("node:readline");

const getIpcPath = () => {
    if (process.platform === "win32") {
        return "\\\\.\\pipe\\backupencd"
    }
    return "/run/backupencd/daemon.sock";
}

const IPC_PATH = getIpcPath();
exports.IPC_PATH = IPC_PATH;
exports.TEMP_DIR = path.join(__dirname, "..", "data", "temp")

exports.getFormattedName = (name, date = new Date()) => {
    const year = date.getFullYear(), month = date.getMonth(), day = date.getDay(),
        hour = date.getHours(), minutes = date.getMinutes(), seconds = date.getSeconds();

    return `${name}_${year}-${month}-${day}_${hour}-${minutes}-${seconds}`;
}


exports.archivePath = (filePath, outPath) => {
    const archiveName = path.basename(outPath);
    const outName = archiveName.split(".").shift();

    return new Promise((resolve, _reject) => {
        // write backup into archive
        console.log("archive start")
        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });
        archive.directory(filePath, false);
        output.on("close", () => {
            console.log("archiving file done: " + archiveName)
            resolve(archiveName);
        })
        archive.pipe(output);
        archive.on("error", function (err) {
            console.log("error archiving: ", err.message);
            reject(err);
        });
        archive.on("warning", function (err) {
            if (err.code === "ENOENT") {
                console.log("warning archiving file: ", err.message)
            } else {
                // throw error
                console.log("error archiving: ", err.message);
                reject(err);
            }
        });
        archive.finalize();
    })
}

exports.copyFile = (filePath, cpPath) => {
    const reader = fs.createReadStream(filePath);
    const writer = fs.createWriteStream(cpPath);    
    // reader.on('data', (chunk) => {
    // })
    reader.pipe(writer)
}

function getFileLists(folderPath) {
    let fileLists = [];
    const list = fs.readdirSync(folderPath, (fileName) => path.join(folderPath, fileName));
    
    for (const filePah of list) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
            fileLists.push({ path: filePah, type: "file" });
        } else if (stats.isDirectory()) {
            const childrens = getFileLists(filePath);
            fileLists.push({ path: filePah, type: "folder" });
            fileLists = fileLists.concat(childrens);    
        }
    }

    return fileLists;
}

exports.watchLogFile = (filePath, numLines = 10, startText) => {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    let bufferSize = 1024;
    let filePos = fileSize;
    let lines = [];
    let buffer;
    const fd = fs.openSync(filePath, "r");

    while(lines.length <= numLines && filePos > 0) {
        filePos = Math.max(0, filePos - bufferSize);
        const chunkSize = Math.min(bufferSize, fileSize - filePos);
        buffer = Buffer.alloc(chunkSize);

        fs.readSync(fd, buffer, 0, chunkSize, filePos);

        const chunkLines = buffer.toString("utf-8").split("\n");
        lines = [...chunkLines, ...lines];

    }
    
    lines = lines.slice(-numLines)
                .map(text => `${startText}: ${text}`);
    
    console.log(lines.join("\n"));

    let lastSize = fileSize;

    const watcher = chokidar.watch(filePath, {
        usePolling: true,
        interval: 1000,
        awaitWriteFinish: false
    })

    watcher.on("change", async (path) => {
        const newFileStat = fs.statSync(filePath);
        if (newFileStat.size > lastSize) {
            const rl = readline.createInterface({
                input: fs.createReadStream(filePath, { start: lastSize })
            })
            rl.on("line", (line) => {
                console.log(`${startText}: ${line}`)
            })
            rl.on("close", () => {
                lastSize = newFileStat.size;
            })
        } else if (newFileStat.size < lastSize) {
            lastSize = 0;
        }
    })
}

exports.entryExists = async (entryPath) => {
    try {
        await fs.access(entryPath);
        return true;        
    } catch(err) {
        return false;
    }
}

const getDirSize = async (dir) => {
    let total = 0;
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isSymbolicLink()) continue;
        
        if (entry.isDirectory()) {
            total += await getDirSize(fullPath);
        } else if (entry.isFile()) {
            total += (await stat(fullPath)).size;
        }
    }
    
    return total;
}
exports.getDirSize = getDirSize;

exports.mergeByStoragePath = (list) => {
    // Normalize names (strip directory prefixes and known suffixes) and deduplicate
    const normalize = (storagePath) => {
        const base = path.basename(storagePath);
        if (base.endsWith('.meta.json')) return base.replace(/\.meta\.json$/, '');
        if (base.endsWith('.enc')) return base.replace(/\.enc$/, '');
        if (base.endsWith('.zip')) return base.replace(/\.zip$/, '');
        return base;
    }

    const grouped = new Map();
    for (const b of list) {
        const key = normalize(b.storagePath);
        const sizeVal = typeof b.size === 'string' ? parseFloat(b.size) : (b.size || 0);
        const existing = grouped.get(key);
        if (!existing) {
            grouped.set(key, {
                ...b,
                name: key,
                size: sizeVal,
            });
        }
    }

    return [...grouped.values()];
}

exports.parseScheduleToSeconds = (input) => {
  if (typeof input !== 'string') {
    throw new Error('Schedule must be a string');
  }

  const value = input.trim().toLowerCase();

  const match = value.match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) {
    throw new Error(
      `Invalid schedule format "${input}". Expected formats: 30s, 15m, 1h, 24h, 2d`
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (amount <= 0) {
    throw new Error('Schedule value must be greater than zero');
  }

  const MULTIPLIERS = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return amount * MULTIPLIERS[unit];
}

exports.formatDuration = (totalSeconds) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new Error("Invalid duration");
  }

  const seconds = Math.floor(totalSeconds);

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];

  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
}

exports.parseStorageSize = (input) => {
  if (typeof input !== "string") {
    throw new Error("Storage size must be a string");
  }

  const normalized = input.trim().toUpperCase();

  // Match: number + optional unit
  const match = normalized.match(/^(\d+(\.\d+)?)([A-Z]*)$/);

  if (!match) {
    throw new Error(`Invalid storage format: ${input}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[3] || "B";

  if (value < 0) {
    throw new Error("Storage size cannot be negative");
  }

  const units = {
    B: 1,

    // Decimal (SI)
    KB: 1000,
    MB: 1000 ** 2,
    GB: 1000 ** 3,
    TB: 1000 ** 4,

    // Binary (IEC)
    KIB: 1024,
    MIB: 1024 ** 2,
    GIB: 1024 ** 3,
    TIB: 1024 ** 4,

    // Short forms (common CLI habit)
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
  };

  if (!units[unit]) {
    throw new Error(`Unsupported storage unit: ${unit}`);
  }

  const bytes = value * units[unit];

  if (!Number.isFinite(bytes)) {
    throw new Error("Storage size overflow");
  }

  return Math.floor(bytes);
}


exports.getFileLists = getFileLists;
