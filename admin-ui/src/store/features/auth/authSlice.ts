import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "./authTypes";


const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: "idle",
    error: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; }
    }
})

export default authSlice.reducer;