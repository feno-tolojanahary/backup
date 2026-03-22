import type { AppDispatch, RootState } from "@/store"
import { createAsyncThunk } from "@reduxjs/toolkit"

export type ThunkApiConfig = {
    state: RootState,
    dispatch: AppDispatch
}

export const createAppThunk = createAsyncThunk.withTypes<ThunkApiConfig>();