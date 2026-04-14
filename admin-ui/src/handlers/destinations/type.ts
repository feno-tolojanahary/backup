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
    privateKeyEnc?: {
        alg: string;
        iv: string;
        tag: string;
        data: string;
    };
    keyMode?: "private_key" | "password";
    privateKeyPath?: string;
    passphrase?: string;
    destinationFolder?: string;
    maxDiskUsage?: string;
    removePrivateKey?: boolean;
}

export type LocalStorageConfig = {
    destinationFolder: string;
    status?: StatusType;
    maxDiskUsage?: string;
}

export type DestinationConfig = S3Config | HostConfig | LocalStorageConfig;

export type Destination = {
    id: number;
    name: string;
    type: DestinationType;
    config: DestinationConfig;
    status?: StatusType;
    errorMsg: string;
    createdBy?: string;
    hasPrivateKey?: boolean;
    fingerprint?: string;
    updatedAt?: string;
}

export type CreateDestinationPayload = {
    name: string;
    type: DestinationType;
    status?: StatusType;
    config: DestinationConfig;
    createdBy?: string;
}

export type UpdateDestinationPayload = {
    name?: string;
    type?: DestinationType;
    status?: StatusType;
    config?: DestinationConfig;
    createdBy?: string;
    removePrivateKey?: boolean;
}
