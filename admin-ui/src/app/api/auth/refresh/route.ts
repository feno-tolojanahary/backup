import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { serverJson } from "@/lib/serverApi";

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

    const { res, data } = await serverJson<{ data: RefreshResponse }>("/auth/refresh", {
        method: "POST",
        json: refreshToken
    });

    if (!res.ok) {
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const payload: RefreshResponse = data?.data ?? ({} as RefreshResponse);

    const response = NextResponse.json({ accessToken: payload.accessToken });

    cookieStore.set("access_token", payload.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15
    });

    cookieStore.set("refresh_token", payload.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
    })

    return response;
}
