const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function sanitizeUser(user) {
  const preferences = user.preferences ?? {};

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    username: user.username ?? "",
    avatar: user.avatar ?? "",
    isVerified: Boolean(user.is_verified),
    authProvider: Array.isArray(user.authProvider)
      ? user.authProvider
      : user.authProvider
        ? [user.authProvider]
        : [],
    emailVerified: Boolean(user.emailVerified),
    preferences: {
      cinemas: Array.isArray(preferences.cinemas) ? preferences.cinemas : [],
      genres: Array.isArray(preferences.genres) ? preferences.genres : [],
      languages: Array.isArray(preferences.languages) ? preferences.languages : [],
      moods: Array.isArray(preferences.moods) ? preferences.moods : [],
      formats: Array.isArray(preferences.formats) ? preferences.formats : [],
      onboardingCompleted: Boolean(preferences.onboardingCompleted),
    },
  };
}

export function sanitizePublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username ?? "",
    avatar: user.avatar ?? "",
    isVerified: Boolean(user.is_verified),
  };
}

export function isValidUsername(value) {
  return USERNAME_PATTERN.test(String(value ?? "").trim());
}

export { USERNAME_PATTERN };
