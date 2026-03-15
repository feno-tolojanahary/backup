export type StatusType = "connected" | "disconnected" | "failed";
export type DestinationType = "s3" | "local-storage" | "ssh";
export type AuthMethodType = "password" | "key";

export type S3Config = {
    accessKey: string;
    secretKey: string;
    endpoint: string;
    bucketName: string;    
    region?: string;
    prefix?: string;
    backupPrefix?: string;
}

export type HostConfig = {
    host: string;
    port: string;
    username: string;
    authMethod?: AuthMethodType;
    password?: string;
    privateKey?: string;
    passphrase?: string;
    destinationFolder?: string;
    maxDiskUsage?: string;
}

export type LocalStorageConfig = {
    destinationFolder: string;
    status?: StatusType;
    maxDiskUsage?: string;
}

export type DestinationConfig = S3Config | HostConfig | LocalStorageConfig;

export type Destination = {
    id: string;
    name: string;
    type: DestinationType;
    config: DestinationConfig;
    status?: StatusType;
    errorMsg: string;
    createdBy?: string;
}

export type CreateDestinationPayload = {
    name: string;
    type: DestinationType;
    config: DestinationConfig;
    createdBy?: string;
}

export type UpdateDestinationPayload = {
    name?: string;
    type?: DestinationType;
    config?: DestinationConfig;
    createdBy?: string;
}