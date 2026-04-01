import axios from "axios";
import { createAppThunk } from "../shared/utils";
import { LoginPayload } from "./authTypes";

export const login = createAppThunk(
    'auth/login',
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            const res = await axios.post("/api/auth/login", payload);
            return res?.data.auth;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message ?? 'Login failed',
                code: error?.response?.status ?? 500
            })
        }
    }
)

type LogoutRes = {
    ok: boolean
}

export const logout = createAppThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.post<LogoutRes>(`/api/auth/logout`);
            if (!res.data?.ok)
                throw new Error("Logout failed.");
            return {
                user: null,
                permissions: [],
                roles: [],
                accessToken: ""
            };
        } catch (err: any) {
            return rejectWithValue({
                message: "Logout failed",
                code: 500
            })
        }
    }
)