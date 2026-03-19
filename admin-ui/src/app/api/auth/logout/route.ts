import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch } from "@/handlers/utils/utils";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    if (accessToken) {
        await apiFetch("/auth/logout", "POST", { headers: {
            Authorization: `Bearer ${accessToken}` 
        } })
    }
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    return NextResponse.json({ ok: true })
}