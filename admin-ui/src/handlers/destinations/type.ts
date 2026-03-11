
export type DestinationType = "local" | "s3" | "local-storage";

export type S3Config = {
    accessKey: string,
    secretKey: string,
    bucketName: string,
    backupPrefix?: string
}

export type HostConfig = {
    host: string,
    port: string,
    username: string,
    password?: string,
    privateKey?: string,
    passphrase?: string,
    destinationFolder?: string,
    maxDiskUsage?: string
}

export type LocalStorageConfig = {
    destinationFolder: string,
    maxDiskUsage?: string
}

export type DestinationConfig = S3Config | HostConfig | LocalStorageConfig;

export type Destination = {
    id: string,
    name: string,
    type: DestinationType,
    config: DestinationConfig,
    createdBy?: string
}

export type CreateDestinationPayload = {
    name: string,
    type: DestinationType,
    config: DestinationConfig,
    createdBy?: string
}

export type UpdateDestinationPayload = {
    name?: string,
    type?: DestinationType,
    config?: DestinationConfig,
    createdBy?: string
}