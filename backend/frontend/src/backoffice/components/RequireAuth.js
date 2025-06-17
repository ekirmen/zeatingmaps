import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token'); // Check for token

  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/" replace />;
  }

  return children; // Render children if authenticated
};

export default RequireAuth;
