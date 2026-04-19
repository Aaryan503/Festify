import axios from "axios";

/**
 * Global Axios interceptor that attaches the JWT from localStorage
 * as an Authorization: Bearer header on every outgoing request.
 *
 * This replaces the cookie-based approach that breaks on Railway
 * because `.up.railway.app` is on the Public Suffix List and browsers
 * refuse to store cross-subdomain cookies.
 */

const TOKEN_KEY = "festify_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Request interceptor ──────────────────────────────────────────
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // withCredentials is no longer needed for token auth, but keep it
  // harmless for local development with cookies as a fallback.
  return config;
});

export default axios;
