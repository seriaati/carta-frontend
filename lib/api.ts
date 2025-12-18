const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiRequest<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  async function doRequest(tokenOverride?: string): Promise<Response> {
    const headers = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...options.headers,
    };
    const token = tokenOverride || (typeof window !== "undefined" ? localStorage.getItem("access_token") : null);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const config: RequestInit = {
      ...options,
      headers,
    };
    return fetch(url, config);
  }

  let response = await doRequest();

  if (response.status === 401) {
    let errorData: any = {};
    try {
      errorData = await response.clone().json();
    } catch {}
    if (typeof window !== "undefined") {
      // Attempt to refresh token
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (refreshResponse.ok) {
            const responseData = await refreshResponse.json();
            console.log('[API] Token refresh successful', responseData);
            // Handle both wrapped ({ data: { access_token, ... } }) and unwrapped formats
            const tokenData = responseData.data || responseData;
            const { access_token, refresh_token } = tokenData;
            if (access_token) {
              localStorage.setItem("access_token", access_token);
              // Update refresh token if provided
              if (refresh_token) {
                localStorage.setItem("refresh_token", refresh_token);
              }
              // Notify auth context that tokens were refreshed
              window.dispatchEvent(new Event('tokenRefreshed'));
              console.log('[API] Retrying original request with new token');
              // Retry original request with new token
              response = await doRequest(access_token);
            } else {
              // No access token in refresh response, treat as failure
              console.error('[API] Refresh response missing access_token:', responseData);
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth")) {
                window.location.href = "/login";
              }
              throw new ApiError("Failed to refresh token - no access_token in response", 401, refreshResponse);
            }
          } else {
            // Refresh failed
            const errorData = await refreshResponse.json().catch(() => ({}));
            console.error('[API] Token refresh failed:', refreshResponse.status, errorData);
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth")) {
              window.location.href = "/login";
            }
            throw new ApiError(`Failed to refresh token: ${errorData.detail || refreshResponse.statusText}`, 401, refreshResponse);
          }
        } catch (refreshError) {
          console.error('[API] Token refresh exception:', refreshError);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth")) {
            window.location.href = "/login";
          }
          throw new ApiError(
            `Failed to refresh token: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`,
            401
          );
        }
      } else {
        // No refresh token available
        localStorage.removeItem("access_token");
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/auth")) {
          window.location.href = "/login";
        }
        const errorMessage = errorData.detail || response.statusText || "An error occurred";
        throw new ApiError(errorMessage, response.status, response);
      }
    } else {
      // Not in browser
      const errorMessage = errorData.detail || response.statusText || "An error occurred";
      throw new ApiError(errorMessage, response.status, response);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle 403 Forbidden - admin-only endpoint
    if (response.status === 403) {
      const errorMessage = errorData.detail || "Access forbidden. This endpoint requires admin privileges.";
      throw new ApiError(errorMessage, response.status, response);
    }
    
    const errorMessage = errorData.detail || response.statusText || "An error occurred";
    throw new ApiError(errorMessage, response.status, response);
  }

  // Some endpoints might return empty body (like 204)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Helper to extract payload from JWT without external library
export function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )

    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}
