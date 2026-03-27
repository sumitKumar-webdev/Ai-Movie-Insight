"use client";

export function usePermissionChecker() {
  const can = (permissions?: string[]) => !permissions?.length || permissions.includes("*");

  return { can };
}
