const API_BASE = "/api";

function withApiBase(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/api/")) return url;
    if (url.startsWith("/")) return `${API_BASE}${url}`;
    return `${API_BASE}/${url}`;
}

export function callFetch(url: string, method: "POST" | "PUT" | "DELETE" | "GET", payload: any = {}): Promise<Response> {
    return fetch(withApiBase(url), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
}

export function fetchJson(url: string): Promise<Response> {
    return fetch(withApiBase(url), {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
}

type ApiFetchOptions = {
    headers?: Record<string, string>
}

export function apiFetch(url: string, method: "POST" | "PUT" | "DELETE" | "GET", payload: any = {}, { headers = {} }: ApiFetchOptions = {}): Promise<Response> {
    return fetch(withApiBase(url), {
        method,
        headers: { 
            "Content-Type": "application/json",
            ...headers
        },
        body: JSON.stringify(payload)
    })
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (!Number.isFinite(bytes)) return "0 B"

    const sign = bytes < 0 ? "-" : ""
    bytes = Math.abs(bytes)

    if (bytes < 1024) return `${sign}${bytes} B`

    const units = ["KB", "MB", "GB", "TB", "PB"]
    let unitIndex = -1

    do {
        bytes /= 1024
        unitIndex++
    } while (bytes >= 1024 && unitIndex < units.length - 1)

    return `${sign}${bytes.toFixed(decimals)} ${units[unitIndex]}`
}
