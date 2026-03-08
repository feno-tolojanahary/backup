
export type BackupFile = {
    id: number,
    storagePath: string,
    backupId: number,
    size: number,
    status: string,
    type: string,
    prefix: string,
    destinationFolder: string
}

export type Backup = {
    id: number,
    name: string,
    backupUid: string,
    userId: number, 
    status: string,
    lastSynced?: string,
    storage: string,
    storageConf: string,
    jobId: string,
    files: BackupFile[]
}