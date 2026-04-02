import axios, { InternalAxiosRequestConfig } from "axios";
import { store } from "@/store/index";
import { setAuth } from "@/store/features/auth/authSlice";
import { AuthData } from "./auth/type";

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
    baseURL: "http://localhost:3030",
    headers: {
        "Content-Type": "application/json"
    }
})

api.interceptors.request.use((config) => {
    const token = store.getState().auth.accessToken;
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as RetryAxiosRequestConfig;
        if (error.response?.status !== 401)
            return;
        if (!originalRequest?._retry) {
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
            const { data } = await axios.post<{ auth: AuthData }>("/api/auth/refresh", {}, { headers: { "Content-Type": "application/json" } });
            const newAccessToken = data.auth?.accessToken;
            store.dispatch(setAuth(data.auth));
            api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`            ;
            processQueue(null, newAccessToken);
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError: any) {
            processQueue(refreshError);

            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false;
        }
    }
)

export default api;
