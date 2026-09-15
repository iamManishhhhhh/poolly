import React from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export const Input: React.FC<InputProps> = ({ label, className = '', ...rest }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      className={`w-full px-3 py-2 bg-white text-[#171717] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
      {...rest}
    />
  </div>
);
