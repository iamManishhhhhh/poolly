import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <nav className="bg-[#FAFAF8] text-[#171717] px-6 py-4 flex items-center justify-between border-b border-[#E7E7E3] w-full">
      <Link to="/" className="text-2xl md:text-3xl font-bold text-[#171717] tracking-tight">
        Poolly
      </Link>
      <div className="space-x-4">
        <Link to="/auth/login" className="text-[#171717] hover:text-[#087F5B] transition-colors font-medium">
          Login
        </Link>
        <Link to="/auth/signup" className="bg-[#087F5B] text-white px-4 py-1 rounded-md hover:bg-[#087F5B]/90 transition-colors font-medium">
          Sign Up
        </Link>
      </div>
    </nav>
  );
};
