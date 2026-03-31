"use client";

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { authenticatedFetch } from "@/app/services/api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string;
  isVerified?: boolean;
  authProvider: string[];
  emailVerified: boolean;
  preferences: {
    cinemas: string[];
    genres: string[];
    languages: string[];
    moods: string[];
    formats: string[];
    onboardingCompleted: boolean;
  };
};

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
};

const initialState: AuthState = {
  user: null,
  status: "idle",
};

export const fetchCurrentUserThunk = createAsyncThunk<
  AuthUser | null,
  boolean | undefined
>("auth/fetchCurrentUser", async () => {
  const response = await authenticatedFetch("/api/auth/profile", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    data?: { user?: AuthUser };
  };

  return payload.data?.user ?? null;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticatedUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = "authenticated";
    },
    clearAuthState(state) {
      state.user = null;
      state.status = "unauthenticated";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUserThunk.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCurrentUserThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.status = "authenticated";
          return;
        }

        state.user = null;
        state.status = "unauthenticated";
      })
      .addCase(fetchCurrentUserThunk.rejected, (state) => {
        state.user = null;
        state.status = "unauthenticated";
      });
  },
});

export const { setAuthenticatedUser, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
