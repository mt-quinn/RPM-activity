import React from 'react';
import { twMerge } from 'tailwind-merge';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ className, variant = 'primary', disabled, ...rest }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = 'btn px-4 py-2 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';
  const styles: Record<Variant, string> = {
    primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-[color:var(--text)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return <button className={twMerge(base, styles[variant], className)} disabled={disabled} {...rest} />;
}


