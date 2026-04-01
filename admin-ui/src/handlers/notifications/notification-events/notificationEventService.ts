import api from "../../globalAxios";
import { NotificationEvent } from "./type";

export async function getNotificationEvents(url: string): Promise<NotificationEvent[]> {
    try {
        console.log("url event notificaton: ", url)
        const res = await api.get(`${url}`);
        return res.data?.data;
    } catch (error: any) {
        console.log("response status: ", error.response)
        console.log("Error happen: ", error.message);
        return []
    }
}