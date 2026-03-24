import { cookies } from "next/headers";
import { apiFetch } from "@/handlers/utils/utils";
import { NextResponse } from "next/server";
import api from "@/handlers/globalAxios";

export async function POST(req: Request) {
    const body = await req.json();

    const res = await api.post("/auth/login", body);
    const data = res.data;
    if (!data?.ok) {
        return NextResponse.json({ message: "Invalid credentials", success: false }, { status: 401 });
    }

    const cookieStore = await cookies();
    
    cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15 * 24,
        path: "/"
    })

    cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({ auth: data.auth, success: true });
}