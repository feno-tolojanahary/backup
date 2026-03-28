import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "./authTypes";
import { login, logout } from "./authThunk";
import { User } from "@/handlers/users/type";

const initialState: AuthState = {
    user: null,
    permissions: [],
    roles: [],
    isLoading: false,
    error: null
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {

        clearError: (state) => { state.error = null; },
        setUserProfile: (state, action: { payload: Partial<User> }) => {
            if (!state.user) return;
            state.user = { ...state.user, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {
            state.isLoading = true;
        }).addCase(login.fulfilled, (state, action) => {
            state.isLoading = false;
            state.user = action.payload?.user;
            state.permissions = action.payload?.permissions ?? [];
            state.roles = action.payload?.roles ?? [];
        }).addCase(login.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        })

        builder.addCase(logout.pending, (state) => {
            state.isLoading = true
        }).addCase(logout.fulfilled, (state) => {
            state.isLoading = false;
            state.user = null;
            state.permissions = [];
            state.roles = [];
            state.error = null;
        })
    }
})

export const { clearError, setUserProfile } = authSlice.actions;
export default authSlice.reducer;