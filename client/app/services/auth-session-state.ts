"use client";

import { useSyncExternalStore } from "react";

type AuthSessionState = {
  isRefreshing: boolean;
};

let authSessionState: AuthSessionState = {
  isRefreshing: false,
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function setAuthSessionRefreshing(isRefreshing: boolean) {
  if (authSessionState.isRefreshing === isRefreshing) {
    return;
  }

  authSessionState = {
    ...authSessionState,
    isRefreshing,
  };

  emitChange();
}

export function subscribeAuthSessionState(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getAuthSessionState() {
  return authSessionState;
}

export function useAuthSessionRefreshing() {
  return useSyncExternalStore(
    subscribeAuthSessionState,
    () => getAuthSessionState().isRefreshing,
    () => false,
  );
}
