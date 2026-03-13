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
}

export const Calendar: React.FC<CalendarProps> = ({ tenant, selectedDate, onSelectDate }) => {
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
    <div className="p-4 bg-zinc-900 rounded-3xl mx-4 shadow-sm border border-zinc-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-zinc-400" />
          <h2 className="text-base font-semibold text-zinc-100 capitalize">
            {format(currentDate, 'LLLL yyyy', { locale: ru })}
          </h2>
        </div>
        <div className="flex gap-1 -mr-2">
          <button onClick={prev} className="p-2 rounded-full hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="p-2 rounded-full hover:bg-zinc-800 active:bg-zinc-700 transition-colors text-zinc-400 hover:text-zinc-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDayHeaders.map((day, i) => (
            <div key={i} className="text-center text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-2">
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(selectedDate, day);
          const available = isAvailable(day);
          const isCurrentMonth = isExpanded ? isSameMonth(day, currentDate) : true;

          return (
            <div key={i} className="flex justify-center items-center">
              <button
                disabled={!available}
                onClick={() => available && onSelectDate(day)}
                className={twMerge(
                  clsx(
                    "flex flex-col items-center justify-center rounded-2xl transition-all duration-200 w-full",
                    isExpanded ? "aspect-square max-w-[40px] py-1" : "py-2 max-w-[48px]",
                    isSelected ? "shadow-md scale-105" : "",
                    available && !isSelected ? "hover:bg-zinc-800 active:scale-95 text-zinc-300" : "",
                    !available ? "opacity-20 cursor-not-allowed" : "",
                    !isCurrentMonth ? "opacity-0 invisible" : ""
                  )
                )}
                style={isSelected ? { backgroundColor: tenant.colors.primary, color: 'white' } : {}}
              >
                {!isExpanded && (
                  <span className={clsx(
                      "text-[10px] sm:text-xs font-medium mb-1 uppercase tracking-wider",
                      isSelected ? "text-white/90" : "text-zinc-500"
                    )}>
                    {format(day, 'EEEEEE', { locale: ru })}
                  </span>
                )}
                <span className={clsx(
                    "text-[15px] sm:text-[17px] font-bold flex items-center justify-center rounded-full leading-none",
                    isExpanded ? "w-8 h-8" : "w-8 h-8 sm:w-10 sm:h-10",
                    isSelected ? "text-white" : "text-zinc-100",
                    available && !isSelected ? "bg-zinc-800/50 group-hover:bg-zinc-700" : ""
                  )}>
                  {format(day, 'd')}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Явная кнопка раскрытия снизу */}
      <div className="pt-2 border-t border-zinc-800/50 flex justify-center mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl text-zinc-400 bg-zinc-800/30 hover:bg-zinc-800 transition-colors active:scale-95"
        >
          {isExpanded ? (
            <>
              <span>Свернуть</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Раскрыть на месяц</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
