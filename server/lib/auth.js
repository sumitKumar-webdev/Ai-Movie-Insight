import jwt from "jsonwebtoken";

export const ACCESS_COOKIE_NAME = "movie_insight_access";
export const REFRESH_COOKIE_NAME = "movie_insight_refresh";

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("Missing JWT_ACCESS_SECRET in environment variables");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("Missing JWT_REFRESH_SECRET in environment variables");
}

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
}

export function getAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    path: "/",
  };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

export function getBearerToken(request) {
  const header = request.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function getCookieToken(request, cookieName) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = entry.trim().split("=");
    if (rawName !== cookieName) continue;

    const rawValue = rawValueParts.join("=");
    if (!rawValue) return null;

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

export function getAccessToken(request) {
  return getCookieToken(request, ACCESS_COOKIE_NAME) || getBearerToken(request);
}

export function getRefreshToken(request) {
  return getCookieToken(request, REFRESH_COOKIE_NAME);
}
