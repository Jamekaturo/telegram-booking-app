import React from 'react';
import { Tenant } from '../types';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TimeSlotsProps {
  tenant: Tenant;
  selectedDate: Date | null;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({ tenant, selectedDate, selectedSlot, onSelectSlot }) => {
  if (!selectedDate) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm italic mt-2">
        Выберите дату, чтобы увидеть доступное время
      </div>
    );
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const slots = tenant.timeSlots[dateStr] || [];

  if (slots.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-400 text-sm bg-zinc-900 rounded-2xl mx-4 mt-4 border border-zinc-800">
        Нет свободного времени на эту дату
      </div>
    );
  }

  return (
    <div className="p-5 bg-zinc-900/40 backdrop-blur-xl rounded-[2rem] mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/5 mt-4 transition-all duration-300">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/5">
          <Clock className="w-4 h-4 text-zinc-300" />
        </div>
        <h3 className="text-[17px] font-bold text-zinc-100 tracking-wide">Доступное время</h3>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              onClick={() => onSelectSlot(slot)}
              className={twMerge(
                clsx(
                  "py-3.5 rounded-2xl text-[15px] font-bold tracking-wide transition-all duration-300 border relative overflow-hidden",
                  isSelected
                    ? "text-white shadow-[0_0_20px_rgba(0,0,0,0.15)] border-transparent scale-[1.03] z-10"
                    : "bg-zinc-800/40 text-zinc-300 border-white/5 hover:bg-zinc-800/80 hover:border-white/10 active:scale-95 z-0"
                )
              )}
              style={isSelected ? { background: `linear-gradient(135deg, ${tenant.colors.primary} 0%, ${tenant.colors.secondary} 100%)` } : {}}
            >
              {isSelected && (
                <div className="absolute inset-0 w-full h-full bg-white opacity-10" />
              )}
              <span className="relative z-10 drop-shadow-sm">{slot}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
