import React from 'react';
import { Tenant } from '../types';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  tenant: Tenant;
}

export const Header: React.FC<HeaderProps> = ({ tenant }) => {
  return (
    <header className="p-5 flex flex-col items-center justify-center border-b border-zinc-800 shadow-sm relative overflow-hidden" style={{ borderColor: tenant.colors.secondary }}>
      <div 
        className="absolute w-full h-full opacity-10 top-0 left-0 -z-10"
        style={{ backgroundColor: tenant.colors.primary }}
      />
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md border border-white/10" style={{ backgroundColor: tenant.colors.primary }}>
        <Sparkles className="text-white w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-center tracking-tight text-white">{tenant.name}</h1>
      <p className="text-sm text-center text-zinc-400 mt-1 max-w-sm">{tenant.description}</p>
    </header>
  );
};
