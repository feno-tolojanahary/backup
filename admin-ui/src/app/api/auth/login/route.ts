import { cookies } from "next/headers";
import { apiFetch } from "@/handlers/utils/utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();

    const res = await apiFetch("/auth/login", body);

    const data = await res.json();
    if (!res.ok) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
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
        secure: process.env.NODE_ENV === "production"?,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({ user: data.user, success: true });
}