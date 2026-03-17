import api from "../globalAxios";
import { callFetch } from "../utils/utils";
import { CreateSourcePayload, Source, SourceConfig, UpdateSourcePayload } from "./type";


const BASE_URL = "/sources";

export async function getSources(): Promise<Source[]> {
    const res = await fetch(BASE_URL);

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to get sources.");
    }

    const data = (await res.json()).data;
    return data;
}

export async function createSource(url: string, { arg }: { arg: CreateSourcePayload }): Promise<any> {
    const res = await callFetch(url, "POST", arg);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error creating ressource");
    }
    
    const data = (await res.json()).data;
    return data;
}

export async function updateSource(url: string, { arg }: { arg: { id: number, payload: UpdateSourcePayload }}): Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "PUT", arg.payload);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error updating source");
    }
    const data = (await res.json()).data;
    return data;
}

export async function deleteSource(url: string, { arg }: { arg: { id: number } }) : Promise<any> {
    const res = await callFetch(`${url}/${arg.id}`, "DELETE");
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error delete source.");
    }
    const data = (await res.json()).data;
    return data;
}

export async function testSourceConnection(source: SourceConfig): Promise<SourceConfig> {
    const res = await api.post(`${BASE_URL}`, source);
    return res.data;
}

export async function getApi<Entity>(url: string): Promise<Entity[]> {
    const res = await api.get(url)
    return res.data;
}