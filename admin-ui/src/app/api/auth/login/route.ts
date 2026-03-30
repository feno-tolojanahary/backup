import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverJson } from "@/lib/serverApi";

export async function POST(req: Request) {
    const body = await req.json();

    const { res, data } = await serverJson<{ data: any }>("/auth/login", {
        method: "POST",
        json: body
    });

    const authData = data?.data;
    if (!res.ok) {
        return NextResponse.json({ message: "Invalid credentials", success: false }, { status: 401 });
    }

    const cookieStore = await cookies();
    
    cookieStore.set("access_token", authData.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15 * 24,
        path: "/"
    })

    cookieStore.set("refresh_token", authData.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7
    })

    return NextResponse.json({ auth: authData.auth, success: true });
}
