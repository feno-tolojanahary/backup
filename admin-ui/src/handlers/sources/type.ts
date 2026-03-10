export type SourceType = "local" | "s3" | "local-storage";

export type Source = {
    id: string,
    name: string,
    type: SourceType,
    config: any,
    createdBy?: string
}

export type CreateSourcePayload = {
    name: string,
    type: SourceType,
    config: any,
    createdBy?: string
}

export type UpdateSourcePayload = {
    name?: string,
    type?: SourceType,
    config?: any,
    createdBy?: string
}