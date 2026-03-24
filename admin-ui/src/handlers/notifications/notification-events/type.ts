export type EventType = "succeeded" | "failed";
export type CategoryType = "backup" | "destination_storage";

export type NotificationEvent = {
    id: number;
    eventType: EventType;
    message: string;
    payload?: string;
    createdAt: string;
    jobName: string;
    backupName: string;
    category: string;
    redirection?: string;
}