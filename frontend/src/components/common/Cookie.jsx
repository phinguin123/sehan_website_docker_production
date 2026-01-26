//cookie.js
import { Cookies } from "react-cookie";

const cookies = new Cookies();

export const setCookie = (name, value, options) => {
  console.log("setting cookie")
  return cookies.set(name, value, { ...options });
};

export const getCookie = (name) => {
  return cookies.get(name);
};
