export type NotificationProvider = {
    id: number,
    name: string,
    type: string,
    config: any,
    isEnable: boolean,
    createdAt?: string,
    createdBy?: string
}

export type UpdateNotificationProvider = {
    name?: string,
    type?: string,
    config?: any,
    isEnable?: boolean,
    createdAt?: string,
    createdBy?: string
}

export type CreateNotificationProvider = {
    name: string,
    type: string,
    config: any,
    isEnable?: boolean,
    createdBy?: string
}

export type CreateNotificatonRulePayload = {
    name: string,
    eventType: string,
    providerId: number,
    isEnable: boolean,
    createdAt: string
}

export type UpdateNotificationRulePayload = {
    name?: string,
    eventType?: string,
    providerId?: number,
    isEnable?: boolean,
}