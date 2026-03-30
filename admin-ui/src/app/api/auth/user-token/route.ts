import { cookies } from "next/headers";

import { NextResponse } from "next/server";
import { serverJson } from "@/lib/serverApi";
import { User } from "@/handlers/users/type";

export async function GET() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
        return NextResponse.json({ message: "No refresh token" }, { status: 401 });
    }

    const { res, data } = await serverJson<{ data: User }>("/users/by-token", {
        method: "POST",
        json: refreshToken
    });

    if (!res.ok) {
        return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    NextResponse.json({ user: data?.data });
}
