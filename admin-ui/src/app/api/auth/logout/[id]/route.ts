import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/serverApi";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: userId } = params;
        
        await serverFetch(`/auth/logout/${userId}`, { method: "POST" });
        
        const cookieStore = await cookies();
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ ok: false });
    }
}
