export const DEFAULT_PRODUCTION_API_URL = "https://649a-2409-40f4-123-f538-c847-9d94-f1b7-28e2.ngrok-free.app";

/**
 * Global API URL Configuration
 * 
 * 1. Checks if a custom server URL was configured in-app (e.g. on mobile via Server Settings).
 * 2. In production builds with VITE_API_URL configured, uses the deployed backend domain.
 * 3. In production / mobile APK builds, defaults to deployed Render cloud URL: https://ai-land-assist.onrender.com.
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
    return DEFAULT_PRODUCTION_API_URL;
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

// Dynamically resolves current API URL
export const getApiUrl = getApiBaseUrl;
export const API_BASE_URL: string = DEFAULT_PRODUCTION_API_URL;
