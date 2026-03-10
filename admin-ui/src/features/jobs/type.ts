import { Source } from "../sources/type"
import { Destination } from "../destinations/type";

export type Job = {
    id: number,
    name: string,
    isEnable: boolean,
    status: string,
    scheduleType: string,
    scheduleValue: string,
    createdBy?: number,
    createdAt?: string,
    updatedAt?: string,
    useEncryption: Boolean,
    retentionDays?: string
}

export type JobRun = {
    id: number,
    jobId: number,
    status: string,
    startAt: string,
    finishedAt: string,
    errorCode?: string,
    errorMessage?: string,
    createdAt?: string
}

export type CreateJobPayload = {
    name: string,
    isEnable: boolean,
    status: string,
    scheduleType: string,
    scheduleValue: string,
    createdBy: number,
    source: number,
    destinations: number[],
    type: string,
    useEncryption: boolean,
    retentionDays?: string
}

export type UpdateJobPayload = {
    name?: string,
    isEnable?: boolean,
    status?: string,
    scheduleType?: string,
    scheduleValue?: string,
    createdBy?: number,
    useEncryption?: boolean,
    retentionDays?: string
}

export type JobDetail = {
    id: number,
    name: string,
    status: string,
    scheduleType: string,
    scheduleValue: string,
    createdBy?: number,
    useEncryption: boolean,
    source: Source,
    destinations: Destination[]
 }