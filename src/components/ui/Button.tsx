import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyle = "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm transition active:scale-97 cursor-pointer focus:outline-none flex items-center justify-center space-x-1.5 disabled:opacity-50";
  
  const variantStyles = {
    primary: "bg-neutral-900 hover:bg-black text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900",
    secondary: "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 border border-neutral-250 dark:border-neutral-700",
    danger: "bg-red-650 hover:bg-red-750 text-white",
    ghost: "bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
