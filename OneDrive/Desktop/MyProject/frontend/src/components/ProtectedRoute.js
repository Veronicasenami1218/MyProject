import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const location = useLocation();
  const isAuthenticated = apiService.isAuthenticated();
  const currentUser = apiService.getCurrentUserFromStorage();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, redirect to unauthorized page
  if (requiredRole && currentUser?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute; 