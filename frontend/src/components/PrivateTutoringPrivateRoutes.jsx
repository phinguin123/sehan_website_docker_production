import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { isAuthenticated as checkAuth, getAuthHeaders, logout } from '../utils/privateTutoringAuth';

const PrivateTutoringPrivateRoutes = () => {
  const [authState, setAuthState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // First check if we have the required localStorage items
        if (!checkAuth()) {
          console.log('No private tutoring authentication found, redirecting to login');
          setAuthState(false);
          setLoading(false);
          return;
        }

        // Verify token with backend
        const response = await axios.get('/api/private-tutoring/auth/verify', {
          headers: getAuthHeaders()
        });
        
        if (response.data.success) {
          console.log('Private tutoring token verified successfully');
          setAuthState(true);
        } else {
          console.log('Private tutoring token verification failed');
          setAuthState(false);
          logout();
        }
      } catch (error) {
        console.log('Private tutoring token verification error:', error);
        setAuthState(false);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // You can customize this loading indicator
  }

  if (authState === null || authState === false) {
    console.log('Not authenticated for private tutoring, redirecting to login');
    return <Navigate to="/private-tutoring/login" replace />;
  }

  if (authState) {
    console.log('Authenticated for private tutoring');
    return <Outlet />;
  }
};

export default PrivateTutoringPrivateRoutes;
