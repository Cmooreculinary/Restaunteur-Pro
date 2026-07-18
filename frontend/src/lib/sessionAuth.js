const TOKEN_KEY = "restaurateur-pro-access-token";

export const getAccessToken = () => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage may be unavailable in hardened/private browser contexts.
  }
};
