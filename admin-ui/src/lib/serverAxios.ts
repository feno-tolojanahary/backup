import { cookies } from "next/headers";
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3030",
    headers: {
        "Content-Type": "application/json"
    }
})

// api.interceptors.request.use(async (config) => {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("access_token")?.value;
//     if (token) config.headers["Authorization"] = `Bearer ${token}`;
//     return config;
// })

export default api;
