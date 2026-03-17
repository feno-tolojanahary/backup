export type BackupStatus = "completed" | "failed" | "archived";

export type JobBackup = {
    id: number;
    name: string;
}

export type BackupFile = {
    id: number;
    storagePath: string;
    backupId: number;
    size: number;
    status: string;
    type: string;
    prefix: string;
    destinationFolder: string;
}

export type Backup = {
    id: number;
    name: string;
    backupUid: string;
    userId: number; 
    status: BackupStatus;
    lastSynced?: string;
    storage: string;
    storageConf: string;
    jobId: number;
    size: number;
    files: BackupFile[];
    isEncrypted: boolean;
    job: JobBackup;
    createdAt: string;
}