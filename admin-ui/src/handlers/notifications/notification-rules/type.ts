import { NotificationProvider } from "../notification-providers/type"


export type NotificationRule = {
    id: number;
    name: string;
    eventType: string;
    provider: NotificationProvider;
    isEnable: boolean;
    createdAt?: string;
}

export type CreateNotificationRule = {
    name: string;
    eventType: string;
    providerId: number;
    isEnable: boolean;
}

export type UpdateNotificationRule = {
    name?: string;
    eventType?: string;
    providerId?: number;
    isEnable?: boolean; 
}