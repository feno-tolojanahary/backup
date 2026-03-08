
export function callFetch(url: string, method: "POST" | "PUT" | "DELETE", payload: any = {}): Promise<Response> {
    return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
}