function getApiBaseUrl(): string {
  // Use environment variable if set (recommended for all deployments)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  // Fallback: detect based on browser hostname
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://dev-api.covrx.ai";
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();
