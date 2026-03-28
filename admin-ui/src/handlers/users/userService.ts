import api from "./../globalAxios";
import { CreateUserPayload, UpdateUserPayload } from "./type";

export async function insertUser(payload: CreateUserPayload): Promise<any> {
    const res = await api.post("/users", payload);
    return res.data;
}

export type ResultUpdateType = {
    ok: boolean,
    changes: number
}

export async function updateUser(id: number, payload: FormData): Promise<ResultUpdateType> {
    const res = await api.put(`/users/${id}`, payload);
    return res.data?.data;
}