import React from 'react';
import { twMerge } from 'tailwind-merge';

export function Card({ className, children }:{ className?: string; children: React.ReactNode }) {
  return <div className={twMerge('card', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle }:{ title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <div className="text-lg font-semibold">{title}</div>
      {subtitle && <div className="stat">{subtitle}</div>}
    </div>
  );
}


