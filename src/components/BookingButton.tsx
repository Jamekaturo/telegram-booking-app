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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/50 pb-10 sm:pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-50">
      <button
        disabled={disabled}
        onClick={onClick}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[17px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] shadow-lg disabled:shadow-none"
        style={{
          backgroundColor: disabled ? '#27272a' : tenant.colors.primary, // zinc-800 for disabled
          color: disabled ? '#a1a1aa' : 'white', // zinc-400 for text
        }}
      >
        <span>
          {disabled ? 'Ожидание выбора...' : `Записаться на ${totalPrice} ₽`}
        </span>
        {!disabled && <CheckCircle className="w-5 h-5 text-white/90" />}
      </button>
    </div>
  );
};
