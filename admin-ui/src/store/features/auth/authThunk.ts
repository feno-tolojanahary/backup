import { createAppThunk } from "../shared/utils";
import { LoginPayload } from "./authTypes";
import { loginService, logoutService } from "@/handlers/auth/authService";

export const login = createAppThunk(
    'auth/login',
    async (payload: LoginPayload, { rejectWithValue }) => {
        try {
            const data = await loginService(payload);
            return data;
        } catch (error: any) {
            return rejectWithValue({
                message: error?.response?.data?.message ?? 'Login failed',
                code: error?.response?.status ?? 500
            })
        }
    }
)

export const logout = createAppThunk(
    'auth/logout',
    async (userId: number, { rejectWithValue }) => {
        try {
            await logoutService(userId);
        } catch (err: any) {
            return rejectWithValue({
                message: "Logout failed",
                code: 500
            })
        }
    }
)