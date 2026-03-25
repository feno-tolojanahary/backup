export type TotalDataType = {
    totalTarget: number,
    totalJobs: number,
    totalBackups: number,
    totalBackupSize: number
}

export type BackupActivityType = {
    day: string;
    totalCompleted: number;
    totalFailed: number;
}

export type BackupStatusType = {
    status: string;
    total: number;
}

export type StorageUsedByDestType = {
    totalSize: number;
    storage: string;
}

export type StatType = {
    totalData: TotalDataType,
    backupActivities: BackupActivityType[],
    backupStatus: BackupStatusType[],
    storageUsedByDest: StorageUsedByDestType[]
}