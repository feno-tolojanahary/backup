import { store } from "@/store";
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

interface QueueItem {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((query) => {
        if (error) {
            query.reject(error);
        } else {
            query.resolve(token)
        }
        failedQueue = [];
    })
}

let isRefreshing = false;

const api = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
        "Content-Type": "application/json"
    }
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryAxiosRequestConfig;

        if (error.response?.status === 401 && !originalRequest?._retry) {
            if (isRefreshing) {
                return new Promise<string | null>((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then((token: string | null) => {
                    originalRequest.headers["Authorization"] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((error) => Promise.reject(error))
            }
        }
        originalRequest._retry = true;
        isRefreshing = true;

        try {  
            const { data } = await axios.post<{accessToken: string}>("/api/auth/refresh");
            const newAccessToken = data.accessToken;
            localStorage.setItem("access_token", newAccessToken);
            api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`            ;
            processQueue(null, newAccessToken);
        
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError: any) {
            processQueue(refreshError);
            localStorage.removeItem("access_token");

            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false;
        }
    }
)

export default api;
