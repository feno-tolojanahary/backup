import api from "../../globalAxios";
import { NotificationEvent } from "./type";

export async function getNotificationEvents(url: string): Promise<NotificationEvent[]> {
    try {
        const res = await api.get(`${url}`);
        return res.data;
    } catch (error: any) {
        console.log("Error happen: ", error.message);
        return []
    }
}