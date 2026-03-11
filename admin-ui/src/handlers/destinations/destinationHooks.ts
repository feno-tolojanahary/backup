import { mutate } from "swr";
import api from "../globalAxios";
import { createCrudHooks } from "../utils/crudHooks";
import { createDestination, deleteDestination, getDestinations, updateDestination } from "./desinationService";
import { CreateDestinationPayload, Destination, DestinationConfig, UpdateDestinationPayload } from "./type";

const sourceUrl = "/destinations";

const sourceCrud = createCrudHooks<
    Destination,
    CreateDestinationPayload,
    UpdateDestinationPayload
>(sourceUrl, {
    create: createDestination,
    update: updateDestination,
    delete: deleteDestination,
    getList: getDestinations
});

export const useListDestinations = sourceCrud.useList;
export const useCreateDestination = sourceCrud.useCreate;
export const useUdpateDestination = sourceCrud.useUpdate;
export const useDeleteDestination = sourceCrud.useDelete;

export async function testConnection(config: DestinationConfig): Promise<DestinationConfig> {
    const res = await api.post(`${sourceUrl}/test-connection`, config);
    if (res.data) {
        mutate(sourceUrl);       
    }
    return res.data;
}