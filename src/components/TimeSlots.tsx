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
  selectedTotalDuration?: number;
}

export const TimeSlots: React.FC<TimeSlotsProps> = ({ tenant, selectedDate, selectedSlot, onSelectSlot, selectedTotalDuration = 60 }) => {
  if (!selectedDate) {
    return (
      <div className="p-4 text-center text-[var(--text-secondary)] text-sm italic mt-2">
        Выберите дату, чтобы увидеть доступное время
      </div>
    );
  }

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const availableSlotsSet = new Set(tenant.timeSlots[dateStr] || []);
  
  // Всегда показываем с 10 до 17, даже если день пустой или окна недоступны
  const defaultSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const slotsToRender = Array.from(new Set([...defaultSlots, ...availableSlotsSet])).sort();
  
  const now = new Date();
  const isToday = dateStr === format(now, 'yyyy-MM-dd');
  const currentFormatTime = format(now, 'HH:mm');

  return (
    <div className="p-5 bg-[var(--bg-card)] rounded-[2rem] mx-4 border border-[var(--border-main)] mt-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center border border-[var(--border-main)]">
          <Clock className="w-4 h-4 text-[var(--text-main)]" />
        </div>
        <h3 className="text-[17px] font-bold text-[var(--text-main)] tracking-wide">Доступное время</h3>
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        {slotsToRender.map((slot) => {
          const isSelected = selectedSlot === slot;
          
          const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          
          let isDisabled = false;
          let currentMins = timeToMins(slot);
          const endMins = currentMins + selectedTotalDuration;
          
          while (currentMins < endMins) {
             const hStr = Math.floor(currentMins / 60).toString().padStart(2, '0');
             const mStr = (currentMins % 60).toString().padStart(2, '0');
             const checkSlot = `${hStr}:${mStr}`;
             
             const b = tenant.bookedSlots?.[dateStr]?.includes(checkSlot);
             const past = isToday && checkSlot < currentFormatTime;
             const unavail = !availableSlotsSet.has(checkSlot);
             
             if (b || past || unavail) {
                isDisabled = true;
                break;
             }
             currentMins += 60; // assume 60 min intervals
          }

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
