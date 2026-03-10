
export function callFetch(url: string, method: "POST" | "PUT" | "DELETE" | "GET", payload: any = {}): Promise<Response> {
    return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
}

export function fetchJson(url: string): Promise<Response> {
    return fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
    })
}