import { AuthUser } from "@/app/store/auth-slice";
import { apiFetch, authenticatedFetch } from "./api-client";

type loginProps = {
  identifier: string;
  password: string;
};

type signUpProps = {
  name: string;
  username: string;
  email: string;
  password: string;
};

export const login = async ({ identifier, password }: loginProps) => {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: identifier.trim(), password }),
  });
  return await res.json();
};

export const signUp = async ({
  name,
  username,
  email,
  password,
}: signUpProps) => {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  return await res.json();
};

export const resendVerificationEmail = async (email: string) => {
  const res = await apiFetch("/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });

  return await res.json();
};

export const checkUserName = async (username: string) => {
  const res = await apiFetch(
    `/api/auth/check-username?username=${encodeURIComponent(username.trim())}`,
    {
      method: "GET",
    },
  );
  return await res.json();
};

type SaveUserPreferencesPayload = {
  cinemas: string[];
  genres: string[];
  languages: string[];
  moods: string[];
  formats: string[];
};

type UpdateProfilePayload = {
  name: string;
  username: string;
};

export const saveUserPreferences = async (payload: SaveUserPreferencesPayload) => {
  console.log("prefrence: ", payload)
  const res = await authenticatedFetch("/api/auth/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as {
    message?: string;
    error?: string;
    data?: {
      user?: AuthUser;
    };
  };

  return {
    ok: res.ok,
    message: data.message ?? data.error ?? "Failed to save preferences",
    user: data.data?.user ?? null,
  };
};

export const saveProfile = async (payload: UpdateProfilePayload) => {
  const res = await authenticatedFetch("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload.name.trim(),
      username: payload.username.trim(),
    }),
  });

  const data = (await res.json()) as {
    message?: string;
    error?: string;
    data?: {
      user?: AuthUser;
    };
  };

  return {
    ok: res.ok,
    message: data.message ?? data.error ?? "Failed to save profile",
    user: data.data?.user ?? null,
  };
};
