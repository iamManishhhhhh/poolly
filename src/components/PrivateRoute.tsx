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
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8] text-[#171717]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087F5B] mx-auto mb-3"></div>
          <p className="font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve intended destination in state for later redirect after login
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
