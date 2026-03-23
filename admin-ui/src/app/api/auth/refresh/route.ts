import { apiFetch } from "@/handlers/utils/utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface RefreshResponse {
    accessToken: string;
    refreshToken: string;
}

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
        return NextResponse.json({ message: "No refresh token" }, { status: 401 });
    }

    const res = await apiFetch("/auth/refresh", "POST", refreshToken);

    if (!res.ok) {
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const data: RefreshResponse = (await res.json()).data ?? {};

    const response = NextResponse.json({ accessToken: data.accessToken });

    cookieStore.set("refresh_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax',
        path: "/",
        maxAge: 60 * 5
    })

    return response;
}