import api from "./../globalAxios";
import { CreateUserPayload } from "./type";

export async function insertUser(payload: CreateUserPayload): Promise<any> {
    const res = await api.post("/users", payload);
    return res.data;
}