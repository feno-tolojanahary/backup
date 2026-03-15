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
    useEncryption: Boolean;
    createdBy?: number;
    createdAt?: string;
    lastRun?: string;
    updatedAt?: string;
    destinations?: DestinationJob[];
    source?: Source;
    retentionDays?: string;
}

export type JobRun = {
    id: number;
    jobId: number;
    status: string;
    startAt: string;
    finishedAt: string;
    errorCode?: string;
    errorMessage?: string;
    createdAt?: string;
}

export type CreateJobPayload = {
    name: string;
    isEnable: boolean;
    status: string;
    scheduleType: string;
    scheduleValue: string;
    createdBy: number;
    source: number;
    destinations: number[];
    type: string;
    useEncryption: boolean;
    retentionDays?: string;
}

export type UpdateJobPayload = {
    name?: string;
    isEnable?: boolean;
    status?: string;
    scheduleType?: string;
    scheduleValue?: string;
    createdBy?: number;
    useEncryption?: boolean;
    retentionDays?: string;
}

export type JobDetail = {
    id: number;
    name: string;
    status: string;
    scheduleType: string;
    scheduleValue: string;
    createdBy?: number;
    useEncryption: boolean;
    source: Source;
    destinations: Destination[];
 }