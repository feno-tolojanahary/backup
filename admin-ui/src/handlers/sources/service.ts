import api from "../globalAxios";
import { CreateSourcePayload, Source, SourceConfig, UpdateSourcePayload } from "./type";


const BASE_URL = "/sources";

export async function getSources(): Promise<Source[]> {
    const { data } = await api.get(BASE_URL);
    return data?.data;
}

export async function createSource(url: string, { arg }: { arg: CreateSourcePayload }): Promise<any> {
    const res = await api.post(url, arg);
    return res.data?.data;
}

export async function updateSource(url: string, { arg }: { arg: { id: number, payload: UpdateSourcePayload }}): Promise<any> {
    const res = await api.put(`${url}/${arg.id}`, arg.payload)
    return res.data?.data;
}

export async function deleteSource(url: string, { arg }: { arg: { id: number } }) : Promise<any> {
    const res = await api.delete(`${url}/${arg.id}`)
    return res.data?.data;
}

export async function testSourceConnection(source: SourceConfig): Promise<SourceConfig> {
    console.log("api call source: ", api.defaults);
    const res = await api.post(`${BASE_URL}/test-connection`, source);
    return res.data?.data;
}

export async function getApi<Entity>(url: string): Promise<Entity[]> {
    const res = await api.get(url)
    return res.data;
}
