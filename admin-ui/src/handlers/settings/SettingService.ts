import api from "../globalAxios";
import createRessourceService from "../utils/ressourceService";
import { CreateSettingPayload, Setting, UpdateSettingPayload } from "./type";

const baseUrl = "/settings";

const { create, update, deleteById, getList } = createRessourceService<Setting, CreateSettingPayload, UpdateSettingPayload>(baseUrl);

export const createSetting = create;
export const getListSetting = getList;
export const updateSetting = update;
export const deleteSetting = deleteById;

export async function upsertSetting (url: string, { arg }: { arg: Setting[] }) {
    const res = await api.post(url, arg.payload);
    return res.data;
}