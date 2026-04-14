import useSWR, { mutate } from "swr";
import { deleteBackup, restoreBackup, getBackupList, RestorePayload, RestoreRes } from "./backupService";
import { Backup } from "./type";
import useSWRMutation from "swr/mutation";


const baseUrl = "/backups";

export function useBackupList() {
    const { data, error, isLoading } = useSWR<Backup[]>(baseUrl, getBackupList);
    const list = Array.isArray(data) ? data : [];
    return {
        data: list,
        error,
        isLoading
    }
}

export function useDeleteBackup() {
    const { trigger, error, isMutating } = useSWRMutation<Backup, Error, string, { id: number }>(baseUrl, deleteBackup);
    async function deleteById(id: number) {
        const result = await trigger({id});
        mutate(baseUrl);
        return result;
    }

    return {
        error,
        isMutating,
        deleteBackup: deleteById
    }
}

export function useRestoreBackup() {
    const { trigger, error, isMutating } = useSWRMutation<RestoreRes, Error, string, RestorePayload>(
        baseUrl,
        (_, { arg }) => restoreBackup(baseUrl, arg)
    );

    return {
        restore: trigger,
        isLoading: isMutating,
        error
    }
}
