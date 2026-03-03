function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://dev-api.covrx.ai";
  }
  return "http://localhost:8000";
}

export const API_BASE_URL = getApiBaseUrl();
