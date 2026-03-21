"use client";

import { useSyncExternalStore } from "react";
import { buildApiUrl } from "@/app/services/api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  authProvider: string;
  emailVerified: boolean;
};

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
};

const state: AuthState = {
  user: null,
  status: "idle",
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(nextState: Partial<AuthState>) {
  Object.assign(state, nextState);
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAuthStore<T>(selector: (authState: AuthState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function getAuthStoreState() {
  return state;
}

export function setAuthenticatedUser(user: AuthUser) {
  setState({
    user,
    status: "authenticated",
  });
}

export function clearAuthState() {
  setState({
    user: null,
    status: "unauthenticated",
  });
}

let inFlightSessionRequest: Promise<AuthUser | null> | null = null;

export async function fetchCurrentUser(force = false): Promise<AuthUser | null> {
  if (!force) {
    if (state.status === "authenticated" && state.user) {
      return state.user;
    }

    if (state.status === "loading" && inFlightSessionRequest) {
      return inFlightSessionRequest;
    }
  }

  setState({ status: "loading" });

  inFlightSessionRequest = (async () => {
    try {
      const response = await fetch(buildApiUrl("/api/auth/me"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        clearAuthState();
        return null;
      }

      const payload = (await response.json()) as {
        data?: { user?: AuthUser };
      };
      const user = payload.data?.user ?? null;

      if (!user) {
        clearAuthState();
        return null;
      }

      setAuthenticatedUser(user);
      return user;
    } catch {
      clearAuthState();
      return null;
    } finally {
      inFlightSessionRequest = null;
    }
  })();

  return inFlightSessionRequest;
}

export async function logoutUser() {
  try {
    await fetch(buildApiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearAuthState();
  }
}
