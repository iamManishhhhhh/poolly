import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const base = 'px-4 py-1.5 rounded-md font-medium transition-colors';
  const primary = 'bg-[#087F5B] text-white hover:bg-[#087F5B]/90';
  const secondary = 'bg-transparent text-[#087F5B] border border-[#087F5B] hover:bg-[#087F5B]/10';
  const classes = `${base} ${variant === 'primary' ? primary : secondary} ${className}`;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};
