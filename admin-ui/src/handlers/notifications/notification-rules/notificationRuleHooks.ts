import { createCrudHooks } from "../../utils/crudHooks";
import { createNotificationRule, deleteNotificationRule, getListNotificationRule, updateNotificationRule } from "./notificationRuleService";
import { CreateNotificationRule, NotificationRule, UpdateNotificationRule } from "./type";


const sourceUrl = "/notification-rules";

const sourceCrud = createCrudHooks<
    NotificationRule,
    CreateNotificationRule,
    UpdateNotificationRule
>(sourceUrl, { 
    create: createNotificationRule, 
    update: updateNotificationRule, 
    delete: deleteNotificationRule,
    getList: getListNotificationRule
});

export const useNotificationRuleList = sourceCrud.useList;
export const useNotificationRuleCreate = sourceCrud.useCreate;
export const useNotificationRuleUpdate = sourceCrud.useUpdate;
export const useNotificationRuleDelete = sourceCrud.useDelete;