import { callFetch } from "../utils/utils";
import { CreateSourcePayload, Source, UpdateSourcePayload } from "./type";


const BASE_URL = "/sources";

export async function getSources(): Promise<Source[]> {
    const res = await fetch(BASE_URL);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to get sources.");
    }

    return res.json();
}

export async function createSource(url: string, { arg }: { arg: { payload: CreateSourcePayload  }}): Promise<any> {
    const res = await callFetch(url, "POST", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error creating ressource");
    }
    
    return res.json();
}

export async function updateSource(url: string, { arg }: { arg: { id: string, payload: UpdateSourcePayload }}): Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "PUT", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error updating source");
    }
    return res.json()
}

export async function deleteSource(url: string, { arg }: { arg: { id: string } }) : Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "DELETE");
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error delete source.");
    }
    return res.json();
}