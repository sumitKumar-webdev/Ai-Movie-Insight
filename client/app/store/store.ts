"use client";

import { configureStore } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { apiFetch } from "@/app/services/api-client";
import authReducer, {
  clearAuthState as clearAuthStateAction,
  fetchCurrentUserThunk,
  setAuthenticatedUser as setAuthenticatedUserAction,
  type AuthState,
  type AuthUser,
} from "@/app/store/auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAuthStore = <T>(selector: (authState: AuthState) => T): T =>
  useAppSelector((state) => selector(state.auth));

export const getAuthStoreState = (): AuthState => store.getState().auth;

export const setAuthenticatedUser = (user: AuthUser) => {
  store.dispatch(setAuthenticatedUserAction(user));
};

export const clearAuthState = () => {
  store.dispatch(clearAuthStateAction());
};

let inFlightSessionRequest: Promise<AuthUser | null> | null = null;

export const fetchCurrentUser = async (force = false): Promise<AuthUser | null> => {
  const authState = getAuthStoreState();

  if (!force) {
    if (authState.status === "authenticated" && authState.user) {
      return authState.user;
    }

    if (authState.status === "unauthenticated") {
      return null;
    }

    if (authState.status === "loading" && inFlightSessionRequest) {
      return inFlightSessionRequest;
    }
  }

  inFlightSessionRequest = (async () => {
    try {
      const user = await store.dispatch(fetchCurrentUserThunk()).unwrap();
      return user ?? null;
    } catch {
      clearAuthState();
      return null;
    } finally {
      inFlightSessionRequest = null;
    }
  })();

  return inFlightSessionRequest;
};

export const logoutUser = async () => {
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthState();
  }
};
