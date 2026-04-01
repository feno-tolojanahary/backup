import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/serverAxios";
import { AuthData } from "@/handlers/auth/type";

export async function POST(req: NextRequest) {
    const refreshToken = req.cookies.get("refresh_token")?.value;
    
    if (!refreshToken) {
        return NextResponse.json({ message: "No refresh token" }, { status: 401 });
    }
    try {
        const { data, statusText } = await api.post<{ data: AuthData }>("/auth/refresh", { refreshToken });
        const payload: AuthData = data?.data ?? ({} as AuthData);
    
        const auth = {
            accessToken: payload.accessToken,
            user: payload.user,
            permissions: payload.permissions,
            roles: payload.roles
        }

        const response = NextResponse.json({ auth });
    
        response.cookies.set("refresh_token", payload.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7
        })
    
        return response;
    } catch(error: any) {
        if (error.response.status === 400) {
            cookieStore.delete("access_token");
            cookieStore.delete("refresh_token");
            return NextResponse.json({ message: "Session expired" }, { status: 401 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

}
