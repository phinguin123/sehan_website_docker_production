import {Button, Image} from '@chakra-ui/react'
import {useEffect} from 'react';
import { useNavigate, useLocation  } from "react-router-dom"
import instance from '../apis/AxiosInterceptor'


const Logout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const doLogout = async () => {
      const response = await instance.get(`${import.meta.env.VITE_API_BASE_URL}/logout`, {withCredentials: true});

      // Determine the base URL for redirection
      const originPath = location.state?.from || "/";
      console.log("currentPath ", originPath)
      let basePath = "/login";

      if (originPath.startsWith("/parent")) {
        basePath = "/parent/login";
      } else if (originPath.startsWith("/secure-sehan-admin")) {
        basePath = "/secure-sehan-admin/login";
      }

      // Redirect to the appropriate login page
      navigate(basePath, { replace: true });

      alert(response.data.message)
    }

    doLogout()
    
  }, [navigate]);

  return <div>Logging out...</div>;
}

export default Logout