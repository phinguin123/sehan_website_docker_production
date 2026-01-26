import React, { useEffect, useState }  from "react"
import { Outlet, Navigate } from "react-router-dom"
import instance from '@/apis/axiosInstance'

const AdminPrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await instance.get(`/api/auth-ext/verify-token`, 
          { 
            withCredentials: true,
            params: {
              role: 'admin',
            }  
          });
        console.log("response after admin login", response)
        // Backend returns { role: "admin", user_id: ..., name: ... }
        if (response.data && response.data.role) {
          setIsAuthenticated(true);
          setIsAdmin(response.data.role === "admin" || response.data.role === "teacher");
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log("Token verification failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false)
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    console.log("loooooooadiung")
    return <div>Loading...</div>;
  }

  if(isAuthenticated && isAdmin){
    console.log("Logged in as admin")
    return <Outlet />
  }  
  console.log("Not logged in as admin")
	return <Navigate to="/secure-sehan-admin/login" />
}

export default AdminPrivateRoutes
