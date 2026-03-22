"use client";

export type AppToast = {
  title: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  duration?: number;
};

const TOAST_EVENT = "app-toast";

export function toast(detail: AppToast) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<AppToast>(TOAST_EVENT, { detail }));
}

export function getToastEventName() {
  return TOAST_EVENT;
}
