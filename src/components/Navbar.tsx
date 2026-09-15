import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <nav className="bg-[#FAFAF8] text-[#171717] px-6 py-4 flex items-center justify-between border-b border-[#E7E7E3] w-full">
      <Link to="/" className="text-2xl md:text-3xl font-bold text-[#171717] tracking-tight">
        Poolly
      </Link>
      <div className="flex items-center space-x-4">
        {loading ? null : user ? (
          <>
            <span className="font-medium text-[#171717]">
              {user.email || user.phone || 'Account'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-[#087F5B] text-white px-4 py-1.5 rounded-md hover:bg-[#087F5B]/90 transition-colors font-medium text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/auth/login" className="text-[#171717] hover:text-[#087F5B] transition-colors font-medium text-sm">
              Login
            </Link>
            <Link to="/auth/signup" className="bg-[#087F5B] text-white px-4 py-1.5 rounded-md hover:bg-[#087F5B]/90 transition-colors font-medium text-sm">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

