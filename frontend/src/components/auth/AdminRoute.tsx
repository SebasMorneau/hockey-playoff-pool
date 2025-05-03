import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Loading from "../common/Loading";
import { useEffect, useState } from "react";

const AdminRoute = () => {
  const { isAuthenticated, isAdmin, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds timeout

    return () => clearTimeout(timer);
  }, []);

  // If still loading and we have a token, show loading spinner
  if (isLoading && token === null) {
    return <Loading fullPage tip="Initializing..." />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Otherwise, render the admin component
  return <Outlet />;
};

export default AdminRoute;
