import axios from "axios";
import { useNavigate } from "react-router";
import { redirectToLogin } from "@/utils/navigation";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" }, // header의 Content-Type을 JSON 형식의 데이터를 전송한다
  withCredentials: true,
});

instance.interceptors.response.use(
  function (response) {
    console.log("normal response", response);
    return response;
  },
  async function (error) {
    console.log("instance response error");
    const originalConfig = error.config; // 기존에 수행하려고 했던 작업
    const msg = error.response?.data?.msg || "Unauthorized access";
    const code = error.response?.data?.code;
    const status = error.response.status;
    if (status == 401) {
      switch (code) {
        case "TOKEN_EXPIRED":
          console.log("Token expired");
          console.log("refreshing token...");
          try {
            // Wait for the token to be refreshed
            await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/token/reissue`,
              { withCredentials: true }
            );
            console.log("refresh successful");

            // Retry the original request and await its response
            const response = await axios.request(originalConfig);
            console.log("Retried request response:", response); // Log the retried request's response

            return response; // Return the new response
          } catch (refreshError) {
            if (refreshError.response?.status === 401) {
              alert("Please login!");
              console.error("Refresh token expired. Redirecting to login...");
              redirectToLogin();
            } else {
              console.error(
                "An error occurred during token refresh:",
                refreshError
              );
            }
            error.handled = true;

            return Promise.reject(refreshError);
          }

        case "INVALID_CREDENTIALS":
          // alert();
          error.handled = true;
          break;

        case "UNKNOWN_ROLE":
          redirectToLogin();
          error.handled = true;
          break;

        case "MISSING_ACCESS_COOKIE":
          redirectToLogin();
          error.handled = true;
          break;

        case "ERR_BAD_REQUEST":
          redirectToLogin();
          error.handled = true;
          break;

        default:
          console.warn("Unhandled 401 error code:", code);
          break;
      }
      // if(msg == "Token has expired"){
      //   console.log("refreshing token...")
      //   try {
      //     // Wait for the token to be refreshed
      //     await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/token/reissue`, { withCredentials: true });
      //     console.log("refresh successful");

      //     // Retry the original request and await its response
      //     const response = await axios.request(originalConfig);
      //     console.log("Retried request response:", response); // Log the retried request's response

      //     return response; // Return the new response
      //   } catch (refreshError) {
      //     if (refreshError.response?.status === 401) {
      //       console.error("Refresh token expired. Redirecting to login...");
      //       redirectToLogin(msg);
      //     } else {
      //       console.error("An error occurred during token refresh:", refreshError);
      //     }
      //     return Promise.reject(refreshError)
      //   }
      // }
      // else if(msg == "Invalid username or password"){
      //   alert("Invalid username or password")
      // }
      // else if(code == "UNAUTHENTICATED_UNKNOWN_ROLE"){
      //   redirectToLogin("unknown role!");
      // }
      // else if(code == "MISSING_ACCESS_COOKIE"){
      //   redirectToLogin("missing cookie!");
      // }
      // else{
      //   console.log("error 401 with msg", msg)
      // }
    } else if (status == 404) {
      if (msg == "No current class found.") {
        alert("There is no class!");
      } else {
        console.log("error 401 with msg", msg);
      }
    } else if (status == 400 || status == 409) {
      console.log(msg);
      // console.log(msg)
    } else if (status == 422) {
      redirectToLogin("status 422 error");
    }

    return Promise.reject(error);
  }
);

export default instance;
