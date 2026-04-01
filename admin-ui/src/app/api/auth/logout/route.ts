import { NextRequest, NextResponse } from "next/server";
import api from "@/lib/serverAxios";

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;
        const res = await api.post("/auth/logout", { token: refreshToken });
        if (!res.data?.data.ok) 
            throw new Error("Error authentification")
        const response = NextResponse.json({ ok: true });
        response.cookies.delete("refresh_token");
        return response;
    } catch (error: any) {
        console.log("Logout error: ", error.message)
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
