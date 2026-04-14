import useSWR, { mutate } from "swr";
import { deleteBackup, restoreBackup, getBackupList, RestorePayload, RestoreRes, downloadBackupService } from "./backupService";
import { Backup } from "./type";
import useSWRMutation from "swr/mutation";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";


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

export function useDownloadBackup() {
    const [isDownloading, setIsDownloading] = useState(false);
    const { toastError, toastSuccess } = useToast();

    const download = async (backup: Backup) => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const { blob, filename } = await downloadBackupService(backup.id);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename || backup.name || `backup-${backup.id}`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            toastSuccess("Download started.");
        } catch (error: any) {
            console.log("Error downloading backup: ", error?.message);
            toastError();
        } finally {
            setIsDownloading(false);
        }
    }

    return {
        download,
        isDownloading
    }
}
