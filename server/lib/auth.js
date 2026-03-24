import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
export const AUTH_COOKIE_NAME = "movie_insight_auth";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

export function signAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function normalizeOrigin(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return "";
  }
}

export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const clientOrigin = normalizeOrigin(process.env.CLIENT_ORIGIN);
  const serverOrigin = normalizeOrigin(process.env.SERVER_PUBLIC_URL);
  const isCrossOriginDeployment =
    Boolean(clientOrigin) && Boolean(serverOrigin) && clientOrigin !== serverOrigin;

  return {
    httpOnly: true,
    sameSite: isCrossOriginDeployment ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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

export function getCookieToken(request) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const entry of cookies) {
    const [rawName, ...rawValueParts] = entry.trim().split("=");
    if (rawName !== AUTH_COOKIE_NAME) continue;

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

export function getAuthToken(request) {
  return getCookieToken(request) || getBearerToken(request);
}
