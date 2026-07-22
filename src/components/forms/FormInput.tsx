import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({ label, error, className = '', ...props }: FormInputProps) {
  return (
    <div className="flex flex-col space-y-1.5 w-full text-left">
      <label className="text-xs font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-300">
        {label}
      </label>
      <input
        className={`w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-550 transition-all ${
          error ? 'border-red-500 ring-2 ring-red-500/10' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">{error}</p>}
    </div>
  );
}
