
export interface User {
    id: number;
    email: string;
    fullName: string;
    token?: string;
    isActive: string;
    twoFactorEnabled?: string;
    companyName: string;
    avatarUrl?: string;
    passwordChangedAt?: string;
}

export interface CreateUserPayload {
    email: string;
    fullName: string;
    password: string;
    companyName: string;
    twoFactorEnable?: string;
}

export interface UpdateUserPayload {
    email?: string;
    firstName?: string;
    password?: string;
    companyName?: string;
    twoFactorEnable?: string;
}

export interface UserForm {
    fullName: string;
    email: string;
    companyName: string;
    role: string;
    avatarUrl: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    twoFactorEnabled: string;
    twoFactorSecret: string;
    lastPasswordChangeAt: string;
}