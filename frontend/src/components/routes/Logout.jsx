import { useEffect, useRef } from 'react';
import { useLocation  } from "react-router-dom"
import instance from '@/apis/axiosInstance'


const Logout = () => {
  const location = useLocation();
  // Prevent strict mode from running logout twice in dev
  const handledLogout = useRef(false);

  useEffect(() => {
    if (handledLogout.current) return;
    handledLogout.current = true;

    const performLogout = async () => {
      try {
        // 1. Server Logout (Crucial for HttpOnly cookies)
        await instance.get("/logout", { withCredentials: true });
      } catch (error) {
        console.error("Server logout failed, forcing client redirect anyway:", error);
      } finally {
        // 3. Determine Redirect Path
        // Check state first, then maybe a query param, then default
        const originPath = location.state?.from || "/";
        
        let basePath = "/login"; // Default to student/public login

        // Robust check for Admin or Parent paths
        if (originPath.includes("/secure-sehan-admin")) {
           basePath = "/secure-sehan-admin/login";
        } else if (originPath.includes("/parent")) {
           basePath = "/parent/login";
        }

        // 4. Hard Redirect to ensure clean state
        window.location.href = basePath;
      }
    };

    performLogout()
    
  }, [location]);

  return <div>Logging out...</div>;
}

export default Logout