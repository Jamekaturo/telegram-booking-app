import React, { useState } from 'react';
import { Tenant } from '../types';
import { 
  format, isSameDay, startOfWeek, addDays, 
  startOfMonth, endOfMonth, endOfWeek, isSameMonth,
  addMonths, subMonths, addWeeks, subWeeks
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CalendarProps {
  tenant: Tenant;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  isAdmin?: boolean;
}

export const Calendar: React.FC<CalendarProps> = ({ tenant, selectedDate, onSelectDate, isAdmin = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  const availableDatesStr = tenant.availableDates;
  const isAvailable = (date: Date) => availableDatesStr.includes(format(date, 'yyyy-MM-dd'));

  const next = () => setCurrentDate(isExpanded ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  const prev = () => setCurrentDate(isExpanded ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));

  // Generate days based on view mode
  let days: Date[] = [];
  
  if (isExpanded) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
  } else {
    // Just the week
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }

  // Weekday headers for month view
  const weekDayHeaders = Array.from({ length: 7 }).map((_, i) => 
    format(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i), 'EEEEEE', { locale: ru })
  );

  return (
    <div className="p-5 bg-[var(--bg-card)] rounded-[2rem] mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--border-main)] transition-colors duration-500">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center border border-[var(--border-main)]">
            <CalendarIcon className="w-4 h-4 text-[var(--text-main)]" />
          </div>
          <h2 className="text-[17px] font-bold text-[var(--text-main)] capitalize tracking-wide">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
        </div>
        <div className="flex gap-1 md:gap-2 -mr-1">
          <button onClick={prev} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-card-hover)] active:bg-[var(--bg-card-solid)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-hover)]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--bg-card-hover)] active:bg-[var(--bg-card-solid)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-transparent hover:border-[var(--border-hover)]">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDayHeaders.map((day, i) => (
            <div key={i} className="text-center text-[10px] sm:text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-y-3 gap-x-1 mb-2 relative z-10">
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const available = isAvailable(day);
          const isCurrentMonth = isExpanded ? isSameMonth(day, currentDate) : true;
          const disabled = !isAdmin && !available;

          return (
            <div key={i} className="flex justify-center items-center relative">
              {isSelected && (
                <div 
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full opacity-40 z-0 pointer-events-none"
                  style={{ backgroundColor: 'var(--accent-main)' }}
                />
              )}
              <button
                disabled={disabled}
                onClick={() => !disabled && onSelectDate(day)}
                className={twMerge(
                  clsx(
                    "flex flex-col items-center justify-center rounded-2xl transition-colors duration-300 w-full relative z-10",
                    isExpanded ? "aspect-square max-w-[44px] py-1" : "py-2.5 max-w-[48px]",
                    isSelected ? "shadow-lg scale-[1.08]" : "",
                    !disabled && !isSelected ? "hover:bg-[var(--bg-card-hover)] active:scale-95 text-[var(--text-main)]" : "",
                    disabled ? "opacity-20 cursor-not-allowed" : "",
                    !isCurrentMonth ? "opacity-0 invisible" : ""
                  )
                )}
                style={isSelected ? { background: 'linear-gradient(135deg, var(--accent-main) 0%, var(--accent-secondary) 100%)', color: 'var(--accent-text)' } : {}}
              >
                {!isExpanded && (
                  <span className={clsx(
                      "text-[10px] sm:text-[11px] font-bold mb-1.5 uppercase tracking-widest",
                      isSelected ? "text-[var(--accent-text)] opacity-90" : "text-[var(--text-muted)]"
                    )}>
                    {format(day, 'EEEEEE', { locale: ru })}
                  </span>
                )}
                <span className={clsx(
                    "text-[16px] sm:text-[17px] font-bold flex items-center justify-center rounded-full leading-none",
                    isExpanded ? "w-8 h-8" : "w-8 h-8 sm:w-10 sm:h-10",
                    isSelected ? "text-[var(--accent-text)] shadow-sm" : "text-[var(--text-main)]",
                    available && !isSelected ? "bg-[var(--bg-card)] group-hover:bg-[var(--bg-card-hover)] border border-[var(--border-main)]" : "border border-transparent"
                  )}>
                  {format(day, 'd')}
                </span>
                
                {/* Available indicator dot */}
                {available && !isSelected && isExpanded && (
                  <div className="w-1 h-1 rounded-full bg-[var(--accent-main)] mt-1" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-[var(--border-main)] flex justify-center mt-2 relative z-10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-2xl text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-transparent hover:border-[var(--border-hover)] transition-colors active:scale-95 shadow-sm"
        >
          {isExpanded ? (
            <>
              <span>Уменьшить</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Раскрыть месяц</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
