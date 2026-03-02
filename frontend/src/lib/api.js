const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

const hasHttpProtocol = (value) => /^https?:\/\//i.test(value);

export const buildApiUrl = (path) => {
  if (!path) {
    return API_BASE_URL || "/";
  }

  if (hasHttpProtocol(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const apiFetch = (path, options = {}) => {
  return fetch(buildApiUrl(path), options);
};
