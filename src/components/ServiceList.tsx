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
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Выберите услуги</h2>
      {tenant.services.map((service) => {
        const isSelected = selectedServiceIds.includes(service.id);
        return (
          <button
            key={service.id}
            onClick={() => onToggleService(service.id)}
            className={twMerge(
              clsx(
                "w-full text-left p-4 rounded-2xl flex flex-col gap-2 transition-all duration-200 border",
                isSelected 
                  ? "shadow-sm border-transparent"
                  : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80"
              )
            )}
            style={{
              backgroundColor: isSelected ? tenant.colors.secondary : undefined,
              borderColor: isSelected ? tenant.colors.primary : undefined,
            }}
          >
            <div className="flex justify-between items-start w-full gap-2">
              <span className="font-medium text-zinc-100 leading-tight flex-1">{service.name}</span>
              <span 
                className="font-bold whitespace-nowrap"
                style={{ color: isSelected ? tenant.colors.primary : '#e4e4e7' }}
              >
                {service.price} ₽
              </span>
            </div>
            <div className="flex items-center text-sm text-zinc-400 gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{service.durationMinutes} мин</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
