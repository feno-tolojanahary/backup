import { createSlice } from "@reduxjs/toolkit";
import { AuthState, RoleAuth, PermissionAuth } from "./authTypes";
import { login, logout } from "./authThunk";
import { User } from "@/handlers/users/type";

const initialState: AuthState = {
    user: null,
    permissions: [],
    roles: [],
    isLoading: false,
    error: null,
    accessToken: ""
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state) => { state.error = null; },
        setUserProfile: (state, action: { payload: Partial<User> }) => {
            if (!state.user) return;
            state.user = { ...state.user, ...action.payload };
        },
        setAccessToken: (state, action: { payload: string }) => {
            state.accessToken = action.payload;
        },
        setRoles: (state, action: { payload: RoleAuth[] }) => {
            if (!state.roles) return;
            state.roles = action.payload;
        }, 
        setPermissions: (state, action: { payload: PermissionAuth[] }) => {
            if (!state.permissions) return;
            state.permissions = action.payload;
        },
        setAuth: (state, action: { payload: Partial<AuthState> }) => {
            state.accessToken = action.payload.accessToken ?? "";
            state.user = action.payload.user ?? null;
            state.permissions = action.payload.permissions ?? [];
            state.roles = action.payload.roles ?? [];
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
            state.accessToken = action.payload?.accessToken ?? ""
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
            state.accessToken = "";
        })
    }
})

export const { clearError, setUserProfile, setAccessToken, setAuth, setRoles, setPermissions } = authSlice.actions;
export default authSlice.reducer;