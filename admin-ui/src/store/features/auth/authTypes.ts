import { User } from "@/handlers/users/type";

export type RoleAuth = {
    id: number;
    name: string;
}

export type PermissionAuth = {
    id: number;
    name: string;
}

export interface AuthState {
    user: User | null;
    roles: RoleAuth[],
    permissions: PermissionAuth[],
    isLoading: boolean,
    error: any
}

export interface LoginPayload {
    email: string;
    password: string;
}