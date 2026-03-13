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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#040405] via-[#040405]/95 to-transparent pt-12 pb-10 sm:pb-6 z-50 pointer-events-none">
      <div className="max-w-[480px] mx-auto pointer-events-auto">
        <button
          disabled={disabled}
          onClick={onClick}
          className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 sm:py-4.5 rounded-[2rem] text-[17px] font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] shadow-[0_10px_40px_rgba(0,0,0,0.6)] disabled:shadow-none border border-white/5"
          style={{
            background: disabled ? '#18181b' : `linear-gradient(135deg, ${tenant.colors.primary} 0%, ${tenant.colors.secondary} 100%)`,
            color: disabled ? '#71717a' : 'white',
          }}
        >
          {/* Animated Shine Effect */}
          {!disabled && (
            <div className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
          )}
          
          <span className="relative z-10 flex items-center gap-3 drop-shadow-sm">
            {disabled ? 'Ожидание выбора...' : `Записаться на ${totalPrice} ₽`}
            {!disabled && <CheckCircle className="w-5 h-5 text-white/90" />}
          </span>
        </button>
      </div>
    </div>
  );
};
