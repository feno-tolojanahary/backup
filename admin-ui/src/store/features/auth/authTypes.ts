import { User } from "@/handlers/users/type";

export type LoadingState = "idle" | "pending" | "succeeded" | "failed";

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    loading: LoadingState,
    error: string | null
}

export interface LoginPayload {
    email: string;
    password: string;
}