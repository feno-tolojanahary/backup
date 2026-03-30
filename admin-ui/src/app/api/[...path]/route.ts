import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/serverApi";

type RouteParams = { path: string[] };
type RouteContext = {
    params: RouteParams | Promise<RouteParams>;
};

async function getPath(ctx: RouteContext): Promise<string[]> {
    const params = await ctx.params;
    return params?.path ?? [];
}

async function handleProxy(req: NextRequest, ctx: RouteContext) {
    const path = await getPath(ctx);
    const search = req.nextUrl.search;
    const targetPath = `/${path.join("/")}${search}`;

    const incomingHeaders = new Headers(req.headers);
    incomingHeaders.delete("host");
    incomingHeaders.delete("connection");
    incomingHeaders.delete("content-length");

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    if (accessToken) {
        incomingHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    // Avoid leaking browser cookies to the backend unless explicitly needed.
    incomingHeaders.delete("cookie");

    const method = req.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody ? await req.arrayBuffer() : null;

    const res = await serverFetch(targetPath, {
        method,
        headers: Object.fromEntries(incomingHeaders.entries()),
        body
    });

    const resHeaders = new Headers(res.headers);
    resHeaders.delete("content-encoding");

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
        status: res.status,
        headers: resHeaders
    });
}

export async function GET(req: NextRequest, ctx: RouteContext) {
    return handleProxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
    return handleProxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
    return handleProxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
    return handleProxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
    return handleProxy(req, ctx);
}
