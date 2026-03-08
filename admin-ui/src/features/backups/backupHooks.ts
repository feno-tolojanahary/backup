import useSWR, { mutate } from "swr";
import { deleteBackup } from "./backupService";
import { Backup } from "./type";
import { fetcher } from "@/services/fetcher";
import useSWRMutation from "swr/mutation";


const baseUrl = "/backups";

export function useBackupList() {
    const { data, error, isLoading } = useSWR<Backup[]>(baseUrl, fetcher);
    return {
        data,
        error,
        isLoading
    }
}

export function useDeleteBackup() {
    const { trigger, error, isMutating } = useSWRMutation<Backup, Error, string, { id: string }>(baseUrl, deleteBackup);
    async function deleteById(id: string) {
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