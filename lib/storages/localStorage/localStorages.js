const path = require("path");
const fs = require("fs/promises");
const { createReadStream, createWriteStream } = require("fs");
const { entryExists, getDirSize } = require("../../helper/utils");

class LocalStorage {
    constructor(config) {
        this.config = config;
    }

    getDestPath = () => {
      const defaultPath = path.join(__dirname, "../../../../default-data-test");
      return this.config.destinationFolder || defaultPath;
    }

    async copyFolder(folderPath, dest = null, metaFiles = []) {
      const destDirPath = dest || this.getDestPath();
      await fs.mkdir(destDirPath, { recursive: true });    
      const dir = await fs.opendir(folderPath);
      let totalSize = 0;
      
      for await (const dirent of dir) {
        const srcPath = path.join(folderPath, dirent.name);
        const destPath = path.join(destDirPath, dirent.name);

        if (dirent.isDirectory()) {
          await this.copyFolder(srcPath, destPath, metaFiles);
        } else if (dirent.isFile()) {
          await fs.pipeline(createReadStream(srcPath), createWriteStream(destPath));
          const stat = await fs.stat(srcPath);
          const parentFolder = destPath.replace(this.getDestPath(), '');
          totalSize += stat.size;
          metaFiles.push({
            size: stat.size,
            storagePath: path.posix.join(parentFolder, dirent.name),
            destinationFolder: this.getDestPath(),
            type: "file"
          })
        }
      }

      metaFiles.push({
        size: totalSize,
        storagePath: path.basename(folderPath),
        type: "folder",
        destinationFolder: destDirPath
      })
      return {
        storagePath: path.basename(folderPath),
        uploadedData: metaFiles,
        type: "folder",
        destinationFolder: destDirPath,
      }
    }

    async copyFile(filePath, dest = null) {
      const destDirPath = dest || this.getDestPath();
      const destPath = path.join(destDirPath, path.basename(filePath))
      await fs.pipeline(createReadStream(filePath, createWriteStream(destPath)))
      const stat = await stat(filePath);
      return {
        storagePath: path.basename(filePath),
        destinationFolder: destDirPath,
        size: stat.size,
        type: "file"
      }
    }

    async deleteEntry(backup) {
      try {
        const entryPath = path.join(backup.destinationFolder, backup.storagePath);
        if (!(await entryExists(entryPath)))
          return;
        const stat = await fs.stat(entryPath);
        if (stat.isFile()) {
          await fs.unlink(entryPath);
        } else if (stat.isDirectory()) {
          await fs.rm(entryPath, { recursive: true, force: true })
        }
      } catch (error) {
        console.log(`Error deleting entry ${backup.storagePath} for local storage: ${error.message}`)
      }
    }

    async getFiles () {
      const entries = [];
      const workDirPath = this.getDestPath();
      const dir = await fs.opendir(workDirPath);

      for await (const dirent of dir) {
        if (dirent.isFile) {
          const stat = await fs.stat(path.join(workDirPath), dirent.name);
          entries.push({
            name: dirent.name,
            type: "file",
            size: stat.size,
            modifyTime: stat.mtime
          })
        } else if (dirent.isDirectory()) {
          const dirSize = await getDirSize(path.join(workDirPath, dirent.name));
          entries.push({
            name: dirent.name,
            type: "folder",
            size: dirSize,
            modifyTime: stat.mtime
          })
        }
      }
      return entries;
    }
}

module.exports = LocalStorage;