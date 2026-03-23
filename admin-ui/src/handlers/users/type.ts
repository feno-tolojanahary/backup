
export interface User {
    id: number;
    email: string;
    fullName: string;
    token?: string;
    isActive: string;
}

export interface CreateUserPayload {
    email: string;
    fullName: string;
    password: string;
    companyName: string;
}