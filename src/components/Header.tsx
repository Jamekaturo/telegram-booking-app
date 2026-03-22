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
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] opacity-60"
        style={{ backgroundColor: 'var(--accent-main)', boxShadow: '0 0 10px 2px var(--accent-main)' }}
      />
      
      {/* Glowing Icon */}
      <div className="relative mb-5 group">
        <div 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative shadow-[0_0_20px_var(--accent-main)] border border-[var(--border-main)]" 
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-main) 0%, var(--accent-secondary) 100%)',
            boxShadow: 'var(--glow-shadow, 0 0 40px rgba(0,0,0,0.5))'
          }}
        >
          <Sparkles className="text-[var(--accent-text)] w-9 h-9 sm:w-11 sm:h-11 opacity-90 drop-shadow-md" />
        </div>
      </div>

      <h1 className="text-[28px] sm:text-3xl font-extrabold text-center tracking-tight text-[var(--text-main)] drop-shadow-sm">
        {tenant.name}
      </h1>
      <p className="text-[15px] sm:text-base text-center text-[var(--text-secondary)] mt-2 max-w-xs font-medium tracking-wide">
        {tenant.description}
      </p>
    </header>
  );
};
