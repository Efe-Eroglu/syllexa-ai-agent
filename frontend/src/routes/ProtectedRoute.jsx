import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/pages/protectedRoute.css"

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner" />
        <p className="loading-text">Giriş bilgileri kontrol ediliyor...</p>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
