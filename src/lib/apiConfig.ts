/**
 * Global API URL Configuration
 * 
 * 1. Checks if a custom server URL was configured in-app (e.g. on mobile via Server Settings).
 * 2. In production builds with VITE_API_URL configured, uses the deployed backend domain.
 * 3. In production builds without VITE_API_URL, falls back to "" (relative "/api/..." requests for reverse proxy / same domain).
 * 4. In local development, falls back to "http://localhost:8000".
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("landlens_api_url");
    if (stored && stored.trim() !== "") {
      return stored.trim().replace(/\/+$/, "");
    }
  }

  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && envApiUrl.trim() !== "") {
    return envApiUrl.trim().replace(/\/+$/, "");
  }

  if (import.meta.env.PROD) {
    return "";
  }

  return "http://localhost:8000";
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== "undefined") {
    if (!url || url.trim() === "") {
      localStorage.removeItem("landlens_api_url");
    } else {
      localStorage.setItem("landlens_api_url", url.trim().replace(/\/+$/, ""));
    }
  }
}

// Proxy getter for backward compatibility with `import { API_BASE_URL }`
export const API_BASE_URL: string = getApiBaseUrl();
