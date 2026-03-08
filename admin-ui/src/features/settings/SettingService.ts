import createRessourceService from "../utils/ressourceService";
import { CreateSettingPayload, Setting, UpdateSettingPayload } from "./type";

const baseUrl = "/settings";

const { create, update, deleteById, getList } = createRessourceService<Setting, CreateSettingPayload, UpdateSettingPayload>(baseUrl);

export const createSetting = create;
export const getListSetting = getList;
export const updateSetting = update;
export const deleteSetting = deleteById;