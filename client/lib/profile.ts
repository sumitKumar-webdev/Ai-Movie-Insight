export function normalizeProfileUsername(username?: string | null) {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  return normalizedUsername.replace(/^@+/, "");
}

export function getProfileHref(username?: string | null) {
  const normalizedUsername = normalizeProfileUsername(username);
  return normalizedUsername
    ? `/profile/@${encodeURIComponent(normalizedUsername)}`
    : "/profile";
}
