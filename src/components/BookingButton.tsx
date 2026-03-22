import React from 'react';
import { Tenant } from '../types';
import { CheckCircle } from 'lucide-react';

interface BookingButtonProps {
  tenant: Tenant;
  disabled: boolean;
  onClick: () => void;
  totalPrice: number;
}

export const BookingButton: React.FC<BookingButtonProps> = ({ tenant, disabled, onClick, totalPrice }) => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 p-4 pb-8 z-40 pointer-events-none"
      style={{ background: 'linear-gradient(to top, var(--bg-main) 0%, var(--bg-main) 60%, transparent 100%)' }}
    >
      <div className="max-w-[480px] mx-auto pointer-events-auto">
        <button
          disabled={disabled}
          onClick={onClick}
          className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 sm:py-4.5 rounded-[2rem] text-[17px] font-bold transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] shadow-[var(--glow-shadow,0_10px_40px_rgba(0,0,0,0.6))] disabled:shadow-none border border-[var(--border-main)]"
          style={{
            background: disabled ? 'var(--bg-card-solid)' : 'linear-gradient(135deg, var(--accent-main) 0%, var(--accent-secondary) 100%)',
            color: disabled ? 'var(--text-muted)' : 'var(--accent-text)',
          }}
        >
          {/* Animated Shine Effect */}
          {!disabled && (
            <div className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
          )}
          
          <span className="relative z-10 flex items-center gap-3 drop-shadow-sm">
            {disabled ? 'Ожидание выбора...' : `Записаться на ${totalPrice} ₴`}
            {!disabled && <CheckCircle className="w-5 h-5 text-[var(--accent-text)] opacity-90" />}
          </span>
        </button>
      </div>
    </div>
  );
};
