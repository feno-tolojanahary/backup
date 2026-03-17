import { Source } from "../sources/type"
import { Destination } from "../destinations/type";

export type JobStatus = "success" | "failed" | "running" | "canceled";
export type JobRunStatus = "success" | "failed" | "canceled" | "running";

export type DestinationJob = {
    id: string;
    name: string;
}

type LastJobRun = {
    finishedAt: string;
    status: JobRunStatus;
}

export type SourceJob = {
    id: string;
    name: string;
}

export type Job = {
    id: number;
    name: string;
    isEnable: boolean;
    status: string;
    scheduleType: string;
    scheduleValue: string;
    isEncrypted: boolean;
    createdBy?: number;
    createdAt?: string;
    lastJobRun?: LastJobRun;
    updatedAt?: string;
    destinations?: DestinationJob[];
    source?: SourceJob;
    retentionDays?: number;
}

export type JobRun = {
    id: number;
    jobId: number;
    status: JobRunStatus;
    startedAt: string;
    finishedAt: string;
    errorCode?: string;
    errorMessage?: string;
    duration?: number;
    createdAt?: string;
    backupCount: number;
}

export type CreateJobPayload = {
    name: string;
    isEnable: boolean;
    status: string;
    scheduleType: string;
    scheduleValue: string;
    createdBy: string;
    source: string;
    destinations: string[];
    isEncrypted: boolean;
    retentionDays?: number;
}

export type UpdateJobPayload = {
    name?: string;
    isEnable?: boolean;
    status?: string;
    source?: string,
    destinations?: string[];
    scheduleType?: string;
    scheduleValue?: string;
    createdBy?: string;
    isEncrypted?: boolean;
    retentionDays?: number;
}

export type JobDetail = {
    id: number;
    name: string;
    status: string;
    scheduleType: string;
    scheduleValue: string;
    createdBy?: number;
    isEncrypted: boolean;
    source: Source;
    destinations: Destination[];
 }