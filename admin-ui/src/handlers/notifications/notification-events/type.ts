

export type NotificationEvent = {
    id: number,
    eventType: string,
    message: string,
    payload?: string,
    createdAt: string,
    jobName: string,
    backupName: string
}