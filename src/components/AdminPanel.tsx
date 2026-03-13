import React, { useState } from 'react';
import { Tenant } from '../types';
import { Calendar as CalendarIcon, List, Clock, Settings, UserCircle, Plus } from 'lucide-react';
import { Calendar } from './Calendar';

interface AdminPanelProps {
  tenant: Tenant;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tenant }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'services'>('appointments');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const tabs = [
    { id: 'appointments', label: 'Записи', icon: <UserCircle className="w-5 h-5" /> },
    { id: 'schedule', label: 'График', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'services', label: 'Услуги', icon: <List className="w-5 h-5" /> },
  ];

  return (
    <div className="animate-fade-in fade-in pb-24 px-4 sm:px-6">
      <div className="flex flex-col space-y-6 mt-4">
        
        {/* Header and Tabs */}
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-6 drop-shadow-md">
            Админ Панель
          </h2>
          
          <div className="flex space-x-2 bg-zinc-900/50 p-1 rounded-2xl backdrop-blur-md border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-zinc-800 text-white shadow-md border border-white/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {tab.icon}
                <span className="text-[11px] font-medium mt-1.5">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-zinc-900/40 rounded-3xl p-5 border border-white/5 backdrop-blur-sm shadow-xl min-h-[400px]">
          
          {activeTab === 'appointments' && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" /> Последние записи
                </h3>
              </div>
              {/* Mock Appointment */}
              <div className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-zinc-100 text-[15px]">Анна С.</p>
                    <p className="text-zinc-500 text-[13px] mt-0.5">Маникюр с покрытием</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20">
                      Завтра, 14:00
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button className="flex-1 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20 active:bg-green-500/30 transition-colors border border-green-500/20">
                    Подтвердить
                  </button>
                  <button className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 active:bg-red-500/30 transition-colors border border-red-500/20">
                    Отменить
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100">Настройка графика</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Выберите даты, в которые вы планируете работать. Серые даты будут недоступны для записи.
              </p>
              
              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-white/5">
                <Calendar tenant={tenant} selectedDate={tempDate} onSelectDate={setTempDate} />
              </div>

              <button className="w-full mt-4 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-700 transition-colors border border-white/10 active:scale-95">
                Сохранить расписание
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 animate-slide-up">
               <div className="flexItems-center justify-between mb-4 flex">
                <h3 className="text-lg font-semibold text-zinc-100">Ваши услуги</h3>
                <button className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors border border-purple-500/20">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {tenant.services.map((service) => (
                  <div key={service.id} className="bg-zinc-800/40 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-200 text-sm group-hover:text-purple-300 transition-colors">{service.name}</h4>
                      <p className="text-zinc-500 text-[12px] mt-1">{service.durationMinutes} мин • {service.price} ₽</p>
                    </div>
                    <button className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
