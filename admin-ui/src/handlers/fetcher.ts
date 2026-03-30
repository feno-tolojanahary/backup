import api from "./globalAxios";
import { fetchJson } from "./utils/utils";

export async function fetcher<T>(path: string): Promise<T> {
    const res = await fetchJson(path);
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Request failed");
    }
    return res.json();
}

export async function getData<T>(path: string): Promise<T> {
    const result = await api.get(path)
    return result.data.data;
}

export async function updateData<T, U>(url: string, { arg }: { arg: U }): Promise<T> {
    const res = await api.put(url, arg);
    return res.data?.data;
}
