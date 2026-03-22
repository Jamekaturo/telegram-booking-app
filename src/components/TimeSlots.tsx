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
      <div className="p-4 text-center text-[var(--text-secondary)] text-sm italic mt-2">
        Выберите дату, чтобы увидеть доступное время
      </div>
    );
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const slots = tenant.timeSlots[dateStr] || [];
  
  const now = new Date();
  const isToday = dateStr === format(now, 'yyyy-MM-dd');
  const currentFormatTime = format(now, 'HH:mm');

  if (slots.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)] text-sm bg-[var(--bg-card)] rounded-2xl mx-4 mt-4 border border-[var(--border-main)]">
        Нет свободного времени на эту дату
      </div>
    );
  }

  return (
    <div className="p-5 bg-[var(--bg-card)] rounded-[2rem] mx-4 border border-[var(--border-main)] mt-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center border border-[var(--border-main)]">
          <Clock className="w-4 h-4 text-[var(--text-main)]" />
        </div>
        <h3 className="text-[17px] font-bold text-[var(--text-main)] tracking-wide">Доступное время</h3>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot;
          const isBooked = tenant.bookedSlots?.[dateStr]?.includes(slot);
          const isPastTime = isToday && slot < currentFormatTime;
          const isDisabled = isBooked || isPastTime;

          return (
            <button
              key={slot}
              onClick={() => !isDisabled && onSelectSlot(slot)}
              disabled={isDisabled}
              className={twMerge(
                clsx(
                  "py-3.5 rounded-2xl text-[15px] font-bold tracking-wide border relative overflow-hidden active:scale-95",
                  isDisabled 
                    ? "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-main)] opacity-50 cursor-not-allowed"
                    : isSelected
                      ? "text-[var(--accent-text)] border-transparent scale-[1.03] z-10"
                      : "bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-main)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--border-hover)] active:scale-95 z-0"
                )
              )}
              style={isSelected && !isDisabled ? { background: 'linear-gradient(135deg, var(--accent-main) 0%, var(--accent-secondary) 100%)' } : {}}
            >
              {isSelected && !isDisabled && (
                <div className="absolute inset-0 w-full h-full bg-white opacity-10" />
              )}
              <span className="relative z-10">{slot}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
