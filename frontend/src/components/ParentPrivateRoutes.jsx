import React, { useEffect, useState }  from "react"
import { Outlet, Navigate } from "react-router-dom"
import instance from '../apis/AxiosInterceptor'
import axios from 'axios'

const ParentPrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await instance.get(`${import.meta.env.VITE_API_BASE_URL}/verify-token`, 
          { 
            withCredentials: true,
            params: {
              role: 'parent',
            }  
          });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.log("Token verification failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Set loading to false after verification is complete
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    console.log("loooooooadiung")
    return <div>Loading...</div>; // You can customize this loading indicator
  }

  if(isAuthenticated === null){
    console.log("null authentication")
    return <Navigate to="/parent/login" />
  }
  if(isAuthenticated == false){
    console.log("Not logged in")
	  return <Navigate to="/parent/login" />
  }
  if(isAuthenticated){
    console.log("Logged in as Parent")
    return <Outlet />
  }
}

export default ParentPrivateRoutes
