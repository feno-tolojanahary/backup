import { CreateNotificationProvider, UpdateNotificationProvider } from "./type";
import { callFetch } from "../../utils/utils";

const baseUrl = "/notification-providers";

export async function getListNotificationProviders(): Promise<CreateNotificationProvider[]> {
    const res = await fetch(baseUrl)
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error notificationProvider get list.")
    }

    return res.json();
}

export async function createNotificationProvider(url: string, { arg }: { arg: { payload: CreateNotificationProvider } }): Promise<any> {
    const res = await callFetch(url, "POST", arg.payload)
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error notificationProvider creation.")
    }

    return res.json();
}

export async function updateNotificationProvider(url: string, { arg }: { arg: { id: number, payload: UpdateNotificationProvider } }): Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "PUT", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error notificationProvider update.")
    }
    return res.json()
}

export async function deleteNotificationProvider(url: string, { arg }: { arg: { id: number } }): Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "DELETE");
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error notificationProvider creation.")
    }
    return res.json();
}