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

export type RecentJobRunType = {
    id: number;
    jobId: number;
    jobName: string;
    status: string;
    startedAt: number | null;
    finishedAt: number | null;
    errorMessage: string | null;
}

export type InfraNodeType = {
    name: string;
    type: string;
    status: string | null;
}

export type InfrastructureType = {
    sources: InfraNodeType[];
    destinations: InfraNodeType[];
}

export type StatType = {
    totalData: TotalDataType,
    backupActivities: BackupActivityType[],
    backupStatus: BackupStatusType[],
    storageUsedByDest: StorageUsedByDestType[],
    recentJobRuns: RecentJobRunType[],
    infrastructure: InfrastructureType
}