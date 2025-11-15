import React, { useEffect, useState }  from "react"
import { Outlet, Navigate } from "react-router-dom"
import instance from '../apis/AxiosInterceptor'

const AdminPrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await instance.get(`/api/verify-token`, 
          { 
            withCredentials: true,
            params: {
              role: 'admin',
            }  
          });
        console.log("response after admin login", response)
        setIsAuthenticated(response.data.authenticated);
        setIsAdmin(response.data.role === "admin");
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
