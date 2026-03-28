import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATH = ["/backups", "/infrastructure", "/jobs", "/notificatons", "/settings"];

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isProtected = PROTECTED_PATH.some(p => pathname.startsWith(p))

    if (!isProtected) return NextResponse.next();

    const token = req.cookies.get("access_token")?.value;
    if (!token) {
        return NextResponse.redirect(new URL("/signin", req.url));
    }

    try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        return NextResponse.next();
    } catch (error: any) {
        const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
            method: "POST",
            headers: { cookie: req.headers.get("cookie") ?? "" }
        })
        if (refreshRes.ok) {
            const res = NextResponse.next();
            refreshRes.headers.getSetCookie().forEach(c => 
                res.headers.append('Set-Cookie', c)
            )
            return res;
        }

        return NextResponse.redirect(new URL("/signin", req.url));
    }
}

export const config = {
    matcher: ["/backups/:path*", "/infrastructure/:path*", "/jobs/:path*", "/notificatons/:path*", "/settings/:path*"]
}