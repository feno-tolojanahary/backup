import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/backups", "/infrastructure", "/jobs", "/notifications", "/settings"];

function isProtectedPath(pathname: string) {
    return PROTECTED_PATHS.some((p) => pathname.startsWith(p)) || pathname === "/";
}

async function getUserCount(): Promise<number> {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) return 0;

    const res = await fetch(new URL("/users/count", apiUrl), { method: "GET" });
    if (!res.ok) return 0;

    const data = (await res.json()) as { data?: number };
    return data?.data ?? 0;
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (!isProtectedPath(pathname)) return NextResponse.next();

    const userCount = await getUserCount();
    if (userCount === 0) {
        return NextResponse.redirect(new URL("/signup", req.url));
    }

    const accessToken = req.cookies.get("access_token")?.value;
    if (accessToken) return NextResponse.next();

    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
        method: "POST",
        headers: { cookie: req.headers.get("cookie") ?? "" }
    });

    if (refreshRes.ok) {
        const res = NextResponse.next();
        refreshRes.headers.getSetCookie().forEach((cookie) => {
            res.headers.append("Set-Cookie", cookie);
        });
        return res;
    }

    return NextResponse.redirect(new URL("/signin", req.url));
}

export const config = {
    matcher: ["/", "/backups/:path*", "/infrastructure/:path*", "/jobs/:path*", "/notifications/:path*", "/settings/:path*"]
};
