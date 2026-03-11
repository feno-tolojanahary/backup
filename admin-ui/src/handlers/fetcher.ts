const API_URL = process.env.NEXT_API_PUBLIC_URL;

export async function fetcher<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Request failed");
    }
    return res.json();
}