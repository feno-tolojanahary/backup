import useSWRMutation from "swr/mutation";
import { createCrudHooks } from "../utils/crudHooks";
import { createSetting, deleteSetting, getListSetting, updateSetting, upsertSetting } from "./SettingService";
import { CreateSettingPayload, Setting, UpdateSettingPayload } from "./type";
import { mutate } from "swr";
import { useCallback } from "react";

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

export function useSettingUpsert () {
    const { trigger, isMutating, error } = useSWRMutation<Setting, Error, string, Setting[]>(`${sourceUrl}/multi-upsert`, upsertSetting);
    
    const upsert = async (settings: Setting[]) => {
        const data = settings.map((setting) => ({
            ...setting,
            value: JSON.stringify(setting.value)
        }))
        const res = await trigger(data);
        mutate(sourceUrl);
        return res;
    }

    return {
        upsert,
        isLoading: isMutating,
        error
    }
}

export function useSettings() {
    const { data: settings } = useSettingList();

    const getSettingValue = useCallback((key: string): any => {
        try {
            const foundSetting = settings.find((setting) => setting.key === key);
            return foundSetting?.value ? JSON.parse(foundSetting.value) : null
        } catch (error) {
            return null;
        }
    }, [settings])

    return {
        getSettingValue,
        settings
    }

}