export const getToken = () =>
  localStorage.getItem("token");

export const clearSession = () => {
  localStorage.removeItem("token");
};

export const getTokenPayload = () => {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const getCurrentUserId = () =>
  getTokenPayload()?.id || null;

export const isAuthenticated = () =>
  Boolean(getToken());
