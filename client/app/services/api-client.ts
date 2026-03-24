const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

let refreshRequest: Promise<boolean> | null = null;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(buildApiUrl(path), { credentials: "include", ...init });
}

export async function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      try {
        const response = await apiFetch("/api/auth/refresh", {
          method: "POST",
        });

        return response.ok;
      } catch {
        return false;
      } finally {
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
