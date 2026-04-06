import { mutate } from "swr";
import useSWRMutation from "swr/mutation";
import { createCrudHooks } from "../../utils/crudHooks";
import {
    createNotificationProvider,
    deleteNotificationProvider,
    getListNotificationProviders,
    setNotificationProviderEnabled,
    updateNotificationProvider
} from "./notificationProviderService";
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

export function useSetNotificationProviderEnabled() {
    const { trigger, isMutating, error } = useSWRMutation<
        NotificationProvider,
        Error,
        string,
        { id: number; isEnable: boolean }
    >(sourceUrl, setNotificationProviderEnabled);

    async function setEnabled(id: number, isEnable: boolean) {
        const result = await trigger({ id, isEnable });
        mutate(
            sourceUrl,
            (currentProviders?: NotificationProvider[]) =>
                Array.isArray(currentProviders)
                    ? currentProviders.map((provider) =>
                          provider.id === id
                              ? { ...provider, isEnable }
                              : provider
                      )
                    : currentProviders,
            false
        );
                    return result;
    }

    return {
        setEnabled,
        isMutating,
        error
    };
}
