import createRessourceService from "../utils/ressourceService";
import { Backup } from "./type";
import api from "./../globalAxios";

const baseUrl = "/backups";

const { deleteById } = createRessourceService<Backup>(baseUrl);

export async function getBackupList(): Promise<Backup[]> {
    const res = await api.get(baseUrl);
    const payload = res.data;
    const data =
        payload?.data?.data?.data ??
        payload?.data?.data ??
        payload?.data ??
        payload;

    if (Array.isArray(data)) return data as Backup[];
    if (data && typeof data === "object") return [data as Backup];
    return [];
}
export const deleteBackup = deleteById;

export type RestoreRes = {
    success: boolean
}

export type RestorePayload = {
    id: string
    restoreName: string
}

export async function restoreBackup(url: string, params: RestorePayload): Promise<RestoreRes> {
    const res = await api.post(`${url}/restore/${params.id}`, params);
    return res.data;
}

export type DownloadResult = {
    blob: Blob;
    filename?: string;
};

export async function downloadBackupService(id: string | number): Promise<DownloadResult> {
    const res = await api.get(`${baseUrl}/download/${id}`, { responseType: "blob" });
    const disposition = (res.headers?.["content-disposition"] ?? res.headers?.["Content-Disposition"]) as string | undefined;
    let filename: string | undefined;
    if (disposition) {
        const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
        const plainMatch = /filename="?([^";]+)"?/i.exec(disposition);
        const raw = utf8Match?.[1] ?? plainMatch?.[1];
        if (raw) {
            try {
                filename = decodeURIComponent(raw);
            } catch {
                filename = raw;
            }
        }
    }
    return { blob: res.data as Blob, filename };
}
                