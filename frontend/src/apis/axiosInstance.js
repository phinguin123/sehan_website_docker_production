import axios from "axios";
import { redirectToLogin } from "@/utils/helpers/navigation";

// Use empty string for baseURL since nginx proxies /api/ routes
// This ensures relative paths work correctly
const envBaseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL =
  envBaseURL &&
  envBaseURL !== "undefined" &&
  envBaseURL !== undefined &&
  typeof envBaseURL === "string" &&
  envBaseURL.trim() !== ""
    ? envBaseURL
    : "";

// Debug logging (remove in production if needed)
console.log("AxiosInterceptor baseURL:", baseURL, "envBaseURL:", envBaseURL);

const instance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" }, // header의 Content-Type을 JSON 형식의 데이터를 전송한다
  withCredentials: true,
});

// Helper: attempt to refresh tokens when access token is expired/invalid
async function tryRefreshToken(originalConfig) {
  try {
    console.log("Refreshing access token via /api/auth/token/reissue ...");

    // Use refresh token (cookie) to get new access/refresh tokens
    await axios.get(`/api/auth-ext/token/reissue`, { withCredentials: true });

    console.log("Token refresh successful. Retrying original request...");

    // Retry the original request with the new access token (cookies/headers updated by backend)
    const response = await axios.request(originalConfig);
    console.log("Retried request response:", response);

    return response;
  } catch (refreshError) {
    if (refreshError.response?.status === 401) {
      alert("Your session has expired. Please log in again.");
      console.error("Refresh token expired. Redirecting to login...");
      redirectToLogin();
    } else {
      console.error("An error occurred during token refresh:", refreshError);
    }

    // Mark as handled so callers can distinguish this case if needed
    refreshError.handled = true;
    throw refreshError;
  }
}

instance.interceptors.response.use(
  function (response) {
    console.log("normal response", response);
    return response;
  },
  async function (error) {
    console.log("instance response error");

    // Network / unexpected error
    if (!error.response) {
      console.error("No response on error (network issue?)", error);
      return Promise.reject(error);
    }

    const originalConfig = error.config; // 기존에 수행하려고 했던 작업
    const msg =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      "Unauthorized access";
    const code = error.response?.data?.code;
    const status = error.response.status;

    if (status === 401) {
      // Unified handling for expired/invalid/unauthorized access tokens
      const lowerMsg = typeof msg === "string" ? msg.toLowerCase() : "";
      const isTokenExpired =
        code === "TOKEN_EXPIRED" ||
        code === "INVALID_TOKEN" ||
        // Global JWT/PyJWT handlers sometimes return generic JWT_ERROR
        (code === "JWT_ERROR" && lowerMsg.includes("signature has expired")) ||
        // Some backends only send the message string
        lowerMsg.includes("token has expired");

      if (isTokenExpired) {
        // Avoid infinite loop: don't retry the refresh call itself
        if (originalConfig?.url?.includes("/api/auth/token/reissue")) {
          console.error("Token reissue endpoint itself returned 401.");
          redirectToLogin();
          error.handled = true;
          return Promise.reject(error);
        }

        try {
          const refreshedResponse = await tryRefreshToken(originalConfig);
          return refreshedResponse;
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Other 401 reason codes
      switch (code) {
        case "INVALID_CREDENTIALS":
          error.handled = true;
          break;

        case "UNKNOWN_ROLE":
          redirectToLogin();
          error.handled = true;
          break;

        case "MISSING_ACCESS_COOKIE":
          // Don't logout immediately! Try to refresh first.
          if (originalConfig?.url?.includes("/api/auth/token/reissue")) {
              redirectToLogin();
              error.handled = true;
              return Promise.reject(error);
          }
          try {
              const refreshedResponse = await tryRefreshToken(originalConfig);
              return refreshedResponse;
          } catch (refreshError) {
              redirectToLogin(); // Only redirect if refresh ALSO fails
              return Promise.reject(refreshError);
          }

        case "ERR_BAD_REQUEST":
          redirectToLogin();
          error.handled = true;
          break;

        default:
          console.warn("Unhandled 401 error code:", code, "message:", msg);
          break;
      }
    } else if (status === 404) {
      if (msg === "No current class found.") {
        alert("There is no class!");
      } else {
        console.log("error 404 with msg", msg);
      }
    } else if (status === 400 || status === 409) {
      console.log(msg);
    } else if (status === 422) {
      redirectToLogin("status 422 error");
    }

    return Promise.reject(error);
  }
);

export default instance;
