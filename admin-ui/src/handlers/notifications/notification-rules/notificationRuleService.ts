
import createRessourceService from "../../utils/ressourceService";
import { CreateNotificationRule, NotificationRule, UpdateNotificationRule } from "./type";

const baseUrl = "/notification-rules";

const { create, update, deleteById, getList } = createRessourceService<NotificationRule, CreateNotificationRule, UpdateNotificationRule>(baseUrl);

export const createNotificationRule = create;
export const getListNotificationRule = getList;
export const updateNotificationRule = update;
export const deleteNotificationRule = deleteById;