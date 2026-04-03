
import api from "../globalAxios";
import { CreateDestinationPayload, Destination, UpdateDestinationPayload } from "./type";


const BASE_URL = "/destinations";

export async function getDestinations(): Promise<Destination[]> {
    try {
        const res = await api.get<Destination[]>(BASE_URL);
        return res.data?.data || [];
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Failed to get Destinations.";
        throw new Error(message);
    }
}

export async function createDestination(url: string, { arg }: { arg: { payload: CreateDestinationPayload }}): Promise<any> {
    try {
        const res = await api.post(url, arg.payload);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error creating Destination";
        throw new Error(message);
    }
}

export async function updateDestination(url: string, { arg }: { arg: { id: number, payload: UpdateDestinationPayload }}): Promise<any> {
    try {
        const res = await api.put(`${url}/${arg.id}`, arg.payload);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error updating Destination";
        throw new Error(message);
    }
}

export async function deleteDestination(url: string, { arg }: { arg: { id: number } }) : Promise<any> {
    try {
        const res = await api.delete(`${url}/${arg.id}`);
        return res.data?.data;
    } catch (error: any) {
        const message = error?.response?.data?.message || error?.message || "Error delete Destination.";
        throw new Error(message);
    }
}
