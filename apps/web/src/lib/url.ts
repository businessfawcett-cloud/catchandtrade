// API URL configuration for the app
// In production: https://catchandtrade.com
// In development: relative URLs or http://localhost:3002

export function getApiUrl(): string {
  // For server-side (API routes), always use the production URL
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://catchandtrade.com';
  }
  // For client-side, use relative URL when on same origin, or configured URL
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export function getWebUrl(): string {
  return process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://catchandtrade.com';
}

// For client-side API calls, use this to build URLs
export function apiUrl(path: string): string {
  const base = getApiUrl();
  if (base) {
    return `${base}${path}`;
  }
  // If no base configured, use relative URL (works on same origin)
  return path;
}

// For auth callbacks that need absolute URLs
export function getAuthCallbackUrl(): string {
  return `${getWebUrl()}/api/auth/google/callback`;
}

export function getGoogleAuthUrl(): string {
  return `${getWebUrl()}/api/auth/google`;
}
