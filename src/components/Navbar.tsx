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
    <nav className="bg-[#F8FAF9]/95 backdrop-blur-sm sticky top-0 z-40 border-b border-[#EAEAE6] w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 group">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#171717] group-hover:text-[#087F5B] transition-colors">
            poolly
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#087F5B]" />
        </Link>
        <div className="flex items-center space-x-3 sm:space-x-4">
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#087F5B] text-xs font-bold flex items-center justify-center border border-emerald-200/60">
                  {(user.email?.[0] || user.phone?.[0] || 'U').toUpperCase()}
                </div>
                <span className="text-xs font-medium text-neutral-600 hidden sm:inline-block max-w-[150px] truncate">
                  {user.email || user.phone || 'Account'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="text-neutral-600 hover:text-neutral-900 transition-colors font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-neutral-100"
              >
                Login
              </Link>
              <Link
                to="/auth/signup"
                className="bg-[#087F5B] text-white px-3.5 py-1.5 rounded-xl hover:bg-[#066c4d] transition-colors font-medium text-xs sm:text-sm shadow-2xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

