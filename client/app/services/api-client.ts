const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";
const ACCESS_TOKEN_KEY = "movie_insight_access_token";
const REFRESH_TOKEN_KEY = "movie_insight_refresh_token";

let refreshRequest: Promise<boolean> | null = null;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function setSessionTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return;

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearSessionTokens() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getAccessToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

function getRefreshToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const accessToken = getAccessToken();
  const headers = new Headers(init.headers ?? {});

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
    headers,
  });
}

export async function refreshAuthSession() {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          return false;
        }

        const response = await apiFetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          clearSessionTokens();
          return false;
        }

        const payload = (await response.json()) as {
          data?: {
            accessToken?: string;
            refreshToken?: string;
          };
        };

        setSessionTokens(payload.data?.accessToken, payload.data?.refreshToken);
        return response.ok;
      } catch {
        clearSessionTokens();
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
