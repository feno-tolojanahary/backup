type ServerFetchOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: string | ArrayBuffer | null;
};

function getApiBaseUrl(): string {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
        throw new Error("API_URL is not set. Define it in admin-ui/.env.local.");
    }
    return apiUrl;
}

export async function serverFetch(path: string, options: ServerFetchOptions = {}) {
    const baseUrl = getApiBaseUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(normalizedPath, baseUrl);

    return fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body ?? undefined
    });
}

export async function serverJson<T>(
    path: string,
    options: ServerFetchOptions & { json?: unknown } = {}
): Promise<{ res: Response; data: T }> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
    };

    const body = options.json !== undefined ? JSON.stringify(options.json) : options.body ?? null;

    const res = await serverFetch(path, {
        method: options.method ?? "GET",
        headers,
        body
    });

    const data = (await res.json()) as T;
    return { res, data };
}
