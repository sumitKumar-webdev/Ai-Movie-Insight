import { buildApiUrl } from "./api-client";

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
  const res = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
  const res = await fetch(buildApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: name.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  return await res.json();
};

export const checkUserName = async (username: string) => {
  const res = await fetch(
    buildApiUrl(
      `/api/auth/check-username?username=${encodeURIComponent(username.trim())}`,
    ),
    {
      method: "GET",
      credentials: "include",
    },
  );
  return await res.json();
};
