import { redirect } from "react-router-dom";
import { getCookie } from './Cookie'

// Example authentication check function
const isAuthenticated = () => {
  // Check if the user is authenticated (e.g., by checking a token in localStorage)
  return getCookie("jwt_access_token") !== undefined;
};

export const loader = async () => {
  // If the user is not authenticated, redirect to the /login page
  if (!isAuthenticated()) {
    return redirect("/login");
  }

  // If authenticated, you can load and return data needed for this page
  return null; // Or return any necessary data here
};

