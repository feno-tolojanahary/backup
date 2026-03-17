import useSWR, { mutate } from "swr";
import { deleteBackup, restoreBackup } from "./backupService";
import { Backup } from "./type";
import { fetcher } from "@/handlers/fetcher";
import useSWRMutation from "swr/mutation";


const baseUrl = "/backups";

export function useBackupList() {
    const { data, error, isLoading } = useSWR<Backup[]>(baseUrl, fetcher);
    return {
        data: data || [],
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
    const { trigger, error, isMutating } = useSWRMutation(baseUrl, (_, { arg }) => restoreBackup(baseUrl, arg));

    return {
        restore: trigger,
        isLoading: isMutating,
        error
    }
}