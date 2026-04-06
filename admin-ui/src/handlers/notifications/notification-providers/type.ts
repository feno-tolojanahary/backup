export type ProviderType = "email";
export type ProviderStatus = "connected" | "disconnected"

export type SmtpConfigType = {
    host: string;
    port: string;
    username: string;
    auth: string;
    method?: string;
    senderEmail: string;
    destinations: string[];
}

export type SESConfigType = {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    senderEmail: string;
    method?: string;
    destinations: string[];
}

export type NotificationProvider = {
    id: number;
    name: string;
    type: ProviderType;
    status: string;
    config: SmtpConfigType | SESConfigType;
    isEnable: boolean;
    createdAt?: string;
    createdBy?: string;
}

export type UpdateNotificationProvider = {
    name?: string;
    type?: string;
    config?: SmtpConfigType | SESConfigType;
    isEnable?: boolean;
    createdAt?: string;
    createdBy?: string;
}

export type CreateNotificationProvider = {
    name: string;
    type: string;
    config: SmtpConfigType | SESConfigType;
    isEnable?: boolean;
    createdBy?: string;
}

export type CreateNotificatonRulePayload = {
    name: string;
    eventType: string;
    providerId: number;
    isEnable: boolean;
    createdAt: string;
}

export type UpdateNotificationRulePayload = {
    name?: string;
    eventType?: string;
    providerId?: number;
    isEnable?: boolean;
}
