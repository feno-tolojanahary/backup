
export type Setting = {
    key: string,
    value: any,
    updatedAt?: string,
    createdBy?: string
}

export type CreateSettingPayload = {
    key: string,
    value: string,
    createdBy?: string
}

export type UpdateSettingPayload = {
    key: string,
    value: string
}