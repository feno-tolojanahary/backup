
import { callFetch, fetchJson } from "../utils/utils";
import { CreateDestinationPayload, Destination, UpdateDestinationPayload } from "./type";


const BASE_URL = "/destinations";

export async function getDestinations(): Promise<Destination[]> {
    const res = await fetchJson(BASE_URL);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to get Destinations.");
    }

    return res.json();
}

export async function createDestination(url: string, { arg }: { arg: { payload: CreateDestinationPayload }}): Promise<any> {
    const res = await callFetch(url, "POST", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error creating resDestination");
    }
    
    return res.json();
}

export async function updateDestination(url: string, { arg }: { arg: { id: string, payload: UpdateDestinationPayload }}): Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "PUT", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error updating Destination");
    }
    return res.json()
}

export async function deleteDestination(url: string, { arg }: { arg: { id: string } }) : Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "DELETE");
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error delete Destination.");
    }
    return res.json();
}
