
export type DestinationType = "local" | "s3" | "local-storage";

export type Destination = {
    id: string,
    name: string,
    type: DestinationType,
    config: any,
    createdBy?: string
}

export type CreateDestinationPayload = {
    name: string,
    type: DestinationType,
    config: any,
    createdBy?: string
}

export type UpdateDestinationPayload = {
    name?: string,
    type?: DestinationType,
    config?: any,
    createdBy?: string
}