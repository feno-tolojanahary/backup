    import { Source } from "../sources/type"
import { Destination } from "../destinations/type";

export type JobStatus = "success" | "failed" | "running" | "canceled";

export type DestinationJob = {
    id: string;
    name: string;
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
    lastRun?: string;
    updatedAt?: string;
    destinations?: DestinationJob[];
    source?: SourceJob;
    retentionDays?: number;
}

export type JobRun = {
    id: number;
    jobId: number;
    status: string;
    startedAt: string;
    finishedAt: string;
    errorCode?: string;
    errorMessage?: string;
    duration?: number;
    createdAt?: string;
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