import { LoginPayload } from "@/store/features/auth/authTypes";
import api from "./../globalAxios";

export async function loginService(payload: LoginPayload) {
    const res = await api.post("/auth/login", payload);
    return res.data;
}

export async function logoutService(userId: number) {
    const res = await api.post(`/auth/logout/${userId}`);
    return res.data;
}