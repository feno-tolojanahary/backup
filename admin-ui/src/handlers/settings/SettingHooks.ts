import { createCrudHooks } from "../utils/crudHooks";
import { createSetting, deleteSetting, getListSetting, updateSetting } from "./SettingService";
import { CreateSettingPayload, Setting, UpdateSettingPayload } from "./type";


const sourceUrl = "/settings";

const sourceCrud = createCrudHooks<
    Setting,
    CreateSettingPayload,
    UpdateSettingPayload
>(sourceUrl, { 
    create: createSetting, 
    update: updateSetting, 
    delete: deleteSetting,
    getList: getListSetting
});

export const useSettingList = sourceCrud.useList;
export const useSettingCreate = sourceCrud.useCreate;
export const useSettingUpdate = sourceCrud.useUpdate;
export const useSettingDelete = sourceCrud.useDelete;