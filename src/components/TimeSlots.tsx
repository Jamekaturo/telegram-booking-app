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
    <div className="p-4 mt-2">
      <div className="flex items-center gap-2 mb-4 mx-1">
        <Clock className="w-5 h-5 text-zinc-400" />
        <h3 className="text-base font-semibold text-zinc-100">Доступное время</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              onClick={() => onSelectSlot(slot)}
              className={twMerge(
                clsx(
                  "py-3 rounded-[1.25rem] text-sm font-semibold tracking-wide transition-all border",
                  isSelected
                    ? "text-white shadow-md border-transparent scale-105"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 active:scale-95"
                )
              )}
              style={isSelected ? { backgroundColor: tenant.colors.primary } : {}}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
};
