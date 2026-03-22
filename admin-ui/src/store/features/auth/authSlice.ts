import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "./authTypes";


const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    loading: "idle",
    error: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {

    }
})

export default authSlice.reducer;