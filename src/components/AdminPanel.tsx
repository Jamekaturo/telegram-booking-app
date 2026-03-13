import React, { useState, useEffect } from 'react';
import { Tenant, Service } from '../types';
import { Calendar as CalendarIcon, List, Clock, Settings, UserCircle, Plus, X } from 'lucide-react';
import { Calendar } from './Calendar';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AdminPanelProps {
  tenant: Tenant;
  onUpdateTenant: (updates: Partial<Tenant>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tenant, onUpdateTenant }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'services'>('appointments');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  // --- Appointments State (Mock) ---
  const [mockAppointments, setMockAppointments] = useState([
    { id: 1, name: 'Анна С.', handle: '@annasmith', service: 'Маникюр с покрытием', date: 'Завтра, 14:00', status: 'pending' },
    { id: 2, name: 'Елена В.', handle: '@elenav', service: 'Педикюр', date: 'Послезавтра, 16:00', status: 'pending' }
  ]);

  const handleConfirmAppt = (id: number) => {
    setMockAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
  };
  const handleCancelAppt = (id: number) => {
    setMockAppointments(prev => prev.filter(a => a.id !== id));
  };

  // --- Schedule State ---
  const [localSlots, setLocalSlots] = useState<Record<string, string[]>>(tenant.timeSlots);
  const [localAvailable, setLocalAvailable] = useState<string[]>(tenant.availableDates);

  useEffect(() => {
    setLocalSlots(tenant.timeSlots);
    setLocalAvailable(tenant.availableDates);
  }, [tenant.timeSlots, tenant.availableDates]);

  const dateStr = tempDate ? format(tempDate, 'yyyy-MM-dd') : null;
  const currentSlots = (dateStr ? localSlots[dateStr] : []) || [];
  const isDayOff = dateStr ? !localAvailable.includes(dateStr) : false;

  const allTimes = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  const handleToggleSlot = (time: string) => {
    if (!dateStr || isDayOff) return;
    setLocalSlots(prev => {
      const existing = prev[dateStr] || [];
      if (existing.includes(time)) {
        return { ...prev, [dateStr]: existing.filter(t => t !== time) };
      } else {
        return { ...prev, [dateStr]: [...existing, time].sort() };
      }
    });
  };

  const handleToggleDayOff = () => {
    if (!dateStr) return;
    if (isDayOff) {
      setLocalAvailable(prev => [...prev, dateStr]);
      setLocalSlots(prev => {
        if (!prev[dateStr] || prev[dateStr].length === 0) {
           return { ...prev, [dateStr]: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] };
        }
        return prev;
      });
    } else {
      setLocalAvailable(prev => prev.filter(d => d !== dateStr));
    }
  };

  const handleSaveSchedule = () => {
    onUpdateTenant({ timeSlots: localSlots, availableDates: localAvailable });
    alert('Расписание успешно сохранено!');
  };

  // --- Services State ---
  const handleAddService = () => {
    const name = prompt('Название услуги:');
    if (!name) return;
    const price = parseInt(prompt('Стоимость (₽):') || '0', 10);
    const duration = parseInt(prompt('Длительность (мин):') || '60', 10);
    if (!name || isNaN(price) || isNaN(duration)) {
      alert('Некорректные данные');
      return;
    }
    const newService: Service = { id: Date.now().toString(), name, price, durationMinutes: duration };
    onUpdateTenant({ services: [...tenant.services, newService] });
  };

  const handleEditService = (serviceId: string) => {
    const service = tenant.services.find(s => s.id === serviceId);
    if (!service) return;
    
    const action = prompt(`Редактируем "${service.name}". Введите "edit" чтобы изменить, "delete" чтобы удалить:`, 'edit');
    if (action === 'delete') {
      if (confirm(`Точно удалить "${service.name}"?`)) {
        onUpdateTenant({ services: tenant.services.filter(s => s.id !== serviceId) });
      }
      return;
    } else if (action === 'edit') {
      const name = prompt('Название услуги:', service.name) || service.name;
      const price = parseInt(prompt('Стоимость (₽):', service.price.toString()) || '0', 10) || service.price;
      const duration = parseInt(prompt('Длительность (мин):', service.durationMinutes.toString()) || '60', 10) || service.durationMinutes;
      
      const newServices = tenant.services.map(s => s.id === serviceId ? { ...s, name, price, durationMinutes: duration } : s);
      onUpdateTenant({ services: newServices });
    }
  };

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
              {mockAppointments.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center w-full">Нет новых записей</p>
              ) : (
                mockAppointments.map(appt => (
                  <div key={appt.id} className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-zinc-100 text-[15px] flex items-center gap-2">
                          {appt.name}
                          <a href={`https://t.me/${appt.handle.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-[12px] font-normal hover:underline bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 active:scale-95 transition-transform flex items-center">
                            {appt.handle}
                          </a>
                        </p>
                        <div className="text-zinc-500 text-[13px] mt-1.5 flex items-center gap-1.5">
                          <div className={`w-1 h-1 rounded-full opacity-80 ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-purple-500'}`} />
                          {appt.service} {appt.status === 'confirmed' && <span className="text-green-500 text-[11px] ml-1">(Подтверждено)</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-950/50 text-zinc-300 text-[11px] font-medium border border-white/5 shadow-sm">
                          {appt.date}
                        </span>
                      </div>
                    </div>
                    {appt.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleConfirmAppt(appt.id)} className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-400 text-[13px] font-bold hover:bg-green-500/20 active:bg-green-500/30 transition-all border border-green-500/20 shadow-sm active:scale-95">
                          Подтвердить
                        </button>
                        <button onClick={() => handleCancelAppt(appt.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-[13px] font-bold hover:bg-red-500/20 active:bg-red-500/30 transition-all border border-red-500/20 shadow-sm active:scale-95">
                          Отменить
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-slide-up pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  Настройка графика
                </h3>
              </div>
              <p className="text-zinc-400 text-[13px] mb-4 leading-relaxed font-medium">
                Выберите любую дату для настройки рабочих часов.
              </p>
              
              <div className="bg-zinc-950/80 p-2 sm:p-4 rounded-3xl border border-white/5 shadow-inner">
                <Calendar tenant={{...tenant, availableDates: localAvailable} as Tenant} selectedDate={tempDate} onSelectDate={setTempDate} isAdmin />
              </div>

              {tempDate && (
                <div className="mt-6 p-5 bg-zinc-800/40 rounded-3xl border border-white/5 animate-slide-up shadow-lg">
                  <h4 className="text-zinc-100 font-semibold mb-4 text-[15px] flex items-center justify-between">
                    <span>
                      Окна на <span className="text-purple-400">{format(tempDate, 'd MMMM', { locale: ru })}</span>
                    </span>
                  </h4>
                  <div className={`grid grid-cols-4 gap-2 mb-5 transition-opacity duration-300 ${isDayOff ? 'opacity-30 pointer-events-none' : ''}`}>
                    {allTimes.map(time => {
                      const isActive = currentSlots.includes(time);
                      return (
                        <button
                          key={time}
                          onClick={() => handleToggleSlot(time)}
                          className={`py-2 rounded-xl text-[13px] font-medium transition-all duration-300 border active:scale-95 ${
                            isActive 
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-sm' 
                              : 'bg-zinc-900 text-zinc-500 border-white/5 hover:bg-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-zinc-400">Сделать день выходным</span>
                    <div 
                      onClick={handleToggleDayOff}
                      className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors border border-white/5 ${isDayOff ? 'bg-purple-500/50' : 'bg-zinc-700/50 hover:bg-zinc-700'}`}
                    >
                      <div className={`w-4 h-4 bg-zinc-400 rounded-full shadow-sm transition-transform ${isDayOff ? 'translate-x-5 bg-white' : ''}`} />
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleSaveSchedule} className="w-full mt-2 py-3.5 rounded-2xl bg-zinc-100 text-zinc-900 font-bold text-[14px] hover:bg-white transition-colors border border-transparent active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Сохранить расписание
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 animate-slide-up">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100">Ваши услуги</h3>
                <button onClick={handleAddService} className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors border border-purple-500/20 active:scale-95">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {tenant.services.length === 0 && <p className="text-zinc-500 text-sm text-center py-4 text-full">Нет добавленных услуг</p>}
                {tenant.services.map((service) => (
                  <div key={service.id} className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-zinc-200 text-[14px] group-hover:text-purple-300 transition-colors pr-2">
                        {service.name}
                      </h4>
                      <p className="text-zinc-500 text-[12px] font-medium mt-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {service.durationMinutes} мин 
                        <span className="w-1 h-1 bg-zinc-700 rounded-full mx-0.5" /> 
                        {service.price} ₽
                      </p>
                    </div>
                    <button onClick={() => handleEditService(service.id)} className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-all active:scale-95 shadow-sm">
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
