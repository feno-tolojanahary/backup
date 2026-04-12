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

type RestoreRes = {
    success: boolean
}

type RestorePayload = {
    id: string
    restoreName: string
}

export async function restoreBackup(url: string, params: RestorePayload): Promise<RestoreRes> {
    const res = await api.post(`${url}/${params.id}`, { params });
    return res.data;
}
