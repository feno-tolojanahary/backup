

export type NotificationProvider = {
    id: string,
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