import React from 'react';
import { Service, Tenant } from '../types';
import { Clock } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ServiceListProps {
  tenant: Tenant;
  selectedServiceIds: string[];
  onToggleService: (id: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ tenant, selectedServiceIds, onToggleService }) => {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-[19px] font-bold text-[var(--text-main)] flex items-center gap-2 px-1 mb-5">
        Услуги мастера
      </h2>
      <div className="flex flex-col gap-3">
      {tenant.services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);
        return (
          <button
            key={service.id}
            onClick={() => onToggleService(service.id)}
            className={twMerge(
              clsx(
                "w-full text-left p-4 sm:p-5 rounded-3xl flex flex-col gap-2 transition-all duration-300 border backdrop-blur-md relative overflow-hidden group",
                isSelected 
                  ? "shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-transparent"
                  : "bg-[var(--bg-card)] border-[var(--border-main)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]"
              )
            )}
            style={
              isSelected ? { 
                background: 'linear-gradient(135deg, var(--bg-card-hover) 0%, var(--bg-card-solid) 100%)', 
                borderColor: 'var(--accent-main)',
                boxShadow: '0 0 0 1px var(--accent-main)'
              } : undefined
            }
          >
            {isSelected && (
              <div 
                className="absolute top-[-50%] right-[-10%] w-32 h-32 blur-[40px] rounded-full opacity-30 pointer-events-none"
                style={{ backgroundColor: 'var(--accent-main)' }}
              />
            )}
            <div className="flex justify-between items-start w-full gap-2 relative z-10">
              <span className="font-semibold text-[var(--text-main)] leading-tight flex-1 text-[15px] sm:text-[17px]">{service.name}</span>
              <span 
                className="font-bold whitespace-nowrap text-[15px] sm:text-[17px]"
                style={{ color: isSelected ? 'var(--accent-main)' : 'var(--text-main)' }}
              >
                {service.price} ₴
              </span>
            </div>
            <div className="flex items-center text-[13px] font-medium gap-1.5 relative z-10" style={{ color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)' }}>
              <Clock className="w-4 h-4 opacity-70" />
              <span>{service.durationMinutes} мин</span>
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
};
