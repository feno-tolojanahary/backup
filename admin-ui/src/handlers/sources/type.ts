export type SourceType = "s3" | "mongodb";
export type StatusType = "connected" | "error" | "warning";

export type MongodbConfig = {
    database: string,
    uri: string,
    connected?: boolean,
    errorMsg?: string
}

export type S3Config = {
    bucketName: string,
    secretKey: string,
    accessKey: string,
    prefix?: string,
    connected?: boolean,
    errorMsg?: string
}

export type SourceConfig = MongodbConfig | S3Config;

export type Source = {
    id: string,
    name: string,
    type: SourceType,
    status: StatusType,
    config: MongodbConfig | S3Config,
    createdBy?: string
}

export type CreateSourcePayload = {
    name: string,
    type: SourceType,
    config: any,
    status: StatusType,
    createdBy?: string
}

export type UpdateSourcePayload = {
    name?: string,
    status: StatusType,
    type?: SourceType,
    config?: any,
    createdBy?: string
}