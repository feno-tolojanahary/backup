import { createCrudHooks } from "../utils/crudHooks";
import { createDestination, deleteDestination, updateDestination } from "./desinationService";
import { CreateDestinationPayload, Destination, UpdateDestinationPayload } from "./type";

const sourceUrl = "/destinations";

const sourceCrud = createCrudHooks<
    Destination,
    CreateDestinationPayload,
    UpdateDestinationPayload
>(sourceUrl, {
    create: createDestination,
    update: updateDestination,
    delete: deleteDestination
});

export const useListDestinations = sourceCrud.useList;
export const useCreateDestination = sourceCrud.useCreate;
export const useUdpateDestination = sourceCrud.useUpdate;
export const useDeleteDestination = sourceCrud.useDelete;