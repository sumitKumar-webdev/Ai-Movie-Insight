import { setAuthSessionRefreshing } from "./auth-session-state";

let refreshRequest: Promise<boolean> | null = null;

export function buildApiUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
  });
}

export async function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      setAuthSessionRefreshing(true);

      try {
        const response = await apiFetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return false;
        }
        return response.ok;
      } catch {
        return false;
      } finally {
        setAuthSessionRefreshing(false);
        refreshRequest = null;
      }
    })();
  }

  return refreshRequest;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAuthSession();
  if (!refreshed) {
    return response;
  }

  return apiFetch(path, init);
}
