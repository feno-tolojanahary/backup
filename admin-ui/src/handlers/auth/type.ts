import { User } from "../users/type"

export type RoleAuth = {
    id: number;
    name: string;
}

export type PermissionAuth = {
    id: number;
    name: string;
}

export type AuthData = {
    user: User;
    roles: RoleAuth[];
    permissions: PermissionAuth[];
    accessToken: string;
    refreshToken: string;
}