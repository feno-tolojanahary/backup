import { post } from "../utils";
import { CreateSourcePayload, Source } from "./type";


const BASE_URL = "/sources";

export async function getSources(): Promise<Source[]> {
    const res = await fetch(BASE_URL);

    if (!res.success) {
        const text = res.text();
        throw new Error(text || "Failed to get sources.");
    }

    return res.json();
}

export async function createSource(payload: CreateSourcePayload): Promise<any> {
    const res = await post(BASE_URL, payload);
    if (!res.success) {
        const text = res.text();
        throw new Error(text || "Error creating ressource");
    }
    
    return res.json();
}

