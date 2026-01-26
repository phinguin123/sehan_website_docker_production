import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import instance from "@/apis/axiosInstance";
import axios from "axios";
import { Box } from "@chakra-ui/react";
import background_image from "@/assets/brand/blue_background.jpg";

const PrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const url = `/api/auth-ext/verify-token`;
        console.log("Verifying token with URL:", url);
        const response = await instance.get(
          url,
          {
            withCredentials: true,
            params: {
              role: "student",
            },
          }
        );
        console.log("Verify token response:", response.data);
        // Backend returns { role: "student", user_id: ..., name: ... }
        if (response.data && response.data.role === "student") {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        });
        setIsAuthenticated(false);
      } finally {
        setLoading(false); // Set loading to false after verification is complete
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    console.log("loooooooadiung");
    return <div>Loading...</div>; // You can customize this loading indicator
  }

  if (isAuthenticated === null) {
    console.log("null authentication");
    return <Navigate to="/login" />;
  }
  if (isAuthenticated == false) {
    console.log("Not logged in");
    return <Navigate to="/login" />;
  }
  if (isAuthenticated) {
    console.log("Logged in");
    return (
      <Box pl={{ base: 0, md: "14rem" }} flex="1" width="100%">
        <Outlet />
      </Box>
    );
  }
};

export default PrivateRoutes;
