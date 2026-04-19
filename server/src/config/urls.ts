/** Defaults for Railway production; override with CLIENT_URL / SERVER_PUBLIC_URL in env. */
export const DEFAULT_CLIENT_URL =
  "https://festify-client-production.up.railway.app";

export const DEFAULT_SERVER_PUBLIC_URL =
  "https://festify-production-524b.up.railway.app";

export function getClientUrl(): string {
  return (process.env.CLIENT_URL || DEFAULT_CLIENT_URL).replace(/\/$/, "");
}

export function getGoogleCallbackUrl(): string {
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }
  const base = (
    process.env.SERVER_PUBLIC_URL || DEFAULT_SERVER_PUBLIC_URL
  ).replace(/\/$/, "");
  return `${base}/api/auth/google/callback`;
}
