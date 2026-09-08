import React, { type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Minimal loading state – centered text
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    // Preserve intended destination in state for later redirect after login
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
