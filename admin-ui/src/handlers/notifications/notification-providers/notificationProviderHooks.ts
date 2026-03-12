import api from "../../globalAxios";
import { createCrudHooks } from "../../utils/crudHooks";
import { createNotificationProvider, deleteNotificationProvider, getListNotificationProviders, updateNotificationProvider } from "./notificationProviderService";
import { CreateNotificationProvider, NotificationProvider, UpdateNotificationProvider } from "./type";

const sourceUrl = "/notification-providers";

const sourceCrud = createCrudHooks<
    NotificationProvider,
    CreateNotificationProvider,
    UpdateNotificationProvider
>(sourceUrl, {
    create: createNotificationProvider,
    update: updateNotificationProvider,
    delete: deleteNotificationProvider,
    getList: getListNotificationProviders
});

export const useListNotificationProviders = sourceCrud.useList;
export const useCreateNotificationProvider = sourceCrud.useCreate;
export const useUdpateNotificationProvider = sourceCrud.useUpdate;
export const useDeleteNotificationProvider = sourceCrud.useDelete;