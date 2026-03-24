import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import api from "@/handlers/globalAxios";

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: userId } = params;
        
        await api.post(`/auth/logout/${userId}`);
        
        const cookieStore = await cookies();
        cookieStore.delete("access_token");
        cookieStore.delete("refresh_token");
        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ ok: false });
    }
}