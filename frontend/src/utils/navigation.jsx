import { alertOnce } from "@/utils/alertOnce";

export function redirectToLogin(message) {
  if (message) alertOnce(message);

  const currentPath = window.location.pathname;

  if (currentPath.startsWith("/secure-sehan-admin")) {
    window.location.href = "/secure-sehan-admin/login";
  } else if (currentPath.startsWith("/parent")) {
    window.location.href = "/parent/login";
  } else {
    window.location.href = "/login";
  }
}
