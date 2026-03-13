import React from 'react';
import { Tenant } from '../types';
import { Sparkles } from 'lucide-react';

interface HeaderProps {
  tenant: Tenant;
}

export const Header: React.FC<HeaderProps> = ({ tenant }) => {
  return (
    <header className="px-6 pt-10 pb-8 flex flex-col items-center justify-center relative z-10 transition-all">
      {/* Sleek top glow line */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] blur-[3px] opacity-60"
        style={{ backgroundColor: tenant.colors.primary }}
      />
      
      {/* Glowing Icon */}
      <div className="relative mb-5 group">
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"
          style={{ backgroundColor: tenant.colors.primary }}
        />
        <div 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl" 
          style={{ background: `linear-gradient(135deg, ${tenant.colors.primary} 0%, ${tenant.colors.secondary} 100%)` }}
        >
          <Sparkles className="text-white w-9 h-9 sm:w-11 sm:h-11 opacity-90 drop-shadow-md" />
        </div>
      </div>

      <h1 className="text-[28px] sm:text-3xl font-extrabold text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-zinc-500 drop-shadow-sm">
        {tenant.name}
      </h1>
      <p className="text-[15px] sm:text-base text-center text-zinc-400/90 mt-2 max-w-xs font-medium tracking-wide">
        {tenant.description}
      </p>
    </header>
  );
};
