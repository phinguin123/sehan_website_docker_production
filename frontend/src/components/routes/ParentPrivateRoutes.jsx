import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import instance from "@/apis/axiosInstance";

const ParentPrivateRoutes = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isParent, setIsParent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await instance.get(`/api/auth-ext/verify-token`, {
          withCredentials: true,
          params: {
            role: "parent",
          },
        });
        console.log("Parent token verification response:", response.data);
        // Backend returns { role: "parent", user_id: ..., name: ... }
        if (response.data && response.data.role === "parent") {
          setIsAuthenticated(true);
          setIsParent(true);
        } else {
          setIsAuthenticated(false);
          setIsParent(false);
        }
      } catch (error) {
        console.error("Parent token verification failed:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  if (loading) {
    console.log("Loading parent authentication...");
    return <div>Loading...</div>;
  }

  if (isAuthenticated && isParent) {
    console.log("Logged in as parent");
    return <Outlet />;
  }

  console.log("Not logged in as parent, redirecting...");
  return <Navigate to="/parent/login" />;
};

export default ParentPrivateRoutes;
