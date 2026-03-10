import createRessourceService from "../utils/ressourceService";
import { Backup } from "./type";
import api from "./../globalAxios";

const baseUrl = "/backups";

const { getList, deleteById } = createRessourceService<Backup>(baseUrl);

export const getBackupList = getList;
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