import api from "../../globalAxios";
import { CreateNotificationProvider, UpdateNotificationProvider } from "./type";

const baseUrl = "/notification-providers";

export async function getListNotificationProviders(): Promise<CreateNotificationProvider[]> {
    try {
        const res = await api.get(baseUrl);
        return res.data?.data ?? res.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error notificationProvider get list.";
        throw new Error(message);
    }
}

export async function createNotificationProvider(url: string, { arg }: { arg: { payload: CreateNotificationProvider } }): Promise<any> {
    try {
        const res = await api.post(url, arg.payload);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error notificationProvider creation.";
        throw new Error(message);
    }
}

export async function updateNotificationProvider(url: string, { arg }: { arg: { id: number, payload: UpdateNotificationProvider } }): Promise<any> {
    try {
        const res = await api.put(`${url}/${arg.id}`, arg.payload);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error notificationProvider update.";
        throw new Error(message);
    }
}

export async function setNotificationProviderEnabled(
    url: string,
    { arg }: { arg: { id: number; isEnable: boolean } }
): Promise<any> {
    try {
        const res = await api.put(`${url}/${arg.id}`, { isEnable: arg.isEnable });
        return res.data?.data;
    } catch (error: any) {
        const message =
            error?.response?.data?.message ||
            error?.message ||
            "Error notificationProvider enable state update.";
        throw new Error(message);
    }
}

export async function deleteNotificationProvider(url: string, { arg }: { arg: { id: number } }): Promise<any> {
    try {
        const res = await api.delete(`${url}/${arg.id}`);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error notificationProvider creation.";
        throw new Error(message);
    }
}
