import React, { useState, useEffect } from 'react';
import { Tenant, Service } from '../types';
import { supabase } from '../lib/supabase';
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

  // --- Appointments State ---
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppts(true);
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            appointment_date,
            start_time,
            status,
            client_comment,
            clients ( first_name, last_name, username ),
            services ( name )
          `)
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;
        setAppointments(data || []);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        setLoadingAppts(false);
      }
    };

    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  const handleConfirmAppt = async (id: string, dateStr: string, timeStr: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', id);
      if (error) throw error;
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
      
      const newBooked = { ...(tenant.bookedSlots || {}) };
      if (!newBooked[dateStr]) newBooked[dateStr] = [];
      const slot = timeStr.substring(0, 5);
      if (!newBooked[dateStr].includes(slot)) {
        newBooked[dateStr].push(slot);
      }
      onUpdateTenant({ bookedSlots: newBooked });
    } catch (err: any) {
      alert('Ошибка при подтверждении: ' + err.message);
    }
  };

  const handleCancelAppt = async (id: string) => {
    if (confirm('Отменить запись?')) {
      try {
        const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
        if (error) throw error;
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a).filter(a => a.status !== 'cancelled')); 
      } catch (err: any) {
        alert('Ошибка при отмене: ' + err.message);
      }
    }
  };

  // --- Schedule State ---
  const [localSlots, setLocalSlots] = useState<Record<string, string[]>>(tenant.timeSlots);
  const [localAvailable, setLocalAvailable] = useState<string[]>(tenant.availableDates);

  useEffect(() => {
    setLocalSlots(tenant.timeSlots);
    setLocalAvailable(tenant.availableDates);
  }, [tenant.timeSlots, tenant.availableDates]);

  const [fastMode, setFastMode] = useState(false);

  const dateStr = tempDate ? format(tempDate, 'yyyy-MM-dd') : null;
  const currentSlots = (dateStr ? localSlots[dateStr] : []) || [];
  const isWorkingDay = dateStr ? localAvailable.includes(dateStr) : false;

  const allTimes = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

  const handleToggleSlot = (time: string) => {
    if (!dateStr || !isWorkingDay) return;
    setLocalSlots(prev => {
      const existing = prev[dateStr] || [];
      if (existing.includes(time)) {
        return { ...prev, [dateStr]: existing.filter(t => t !== time) };
      } else {
        return { ...prev, [dateStr]: [...existing, time].sort() };
      }
    });
  };

  const handleToggleWorkingDay = () => {
    if (!dateStr) return;
    if (!isWorkingDay) {
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

  const handleCalendarClick = (d: Date) => {
    const dStr = format(d, 'yyyy-MM-dd');
    if (fastMode) {
      const isWork = localAvailable.includes(dStr);
      if (isWork) {
         setLocalAvailable(prev => prev.filter(x => x !== dStr));
      } else {
         setLocalAvailable(prev => [...prev, dStr]);
         setLocalSlots(prev => {
            if (!prev[dStr] || prev[dStr].length === 0) {
               return { ...prev, [dStr]: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'] };
            }
            return prev;
         });
      }
    }
    setTempDate(d);
  };

  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      // Подготовим данные для upsert в Supabase
      const availabilityRecords: any[] = [];
      const allDatesToSave = new Set([ ...Object.keys(localSlots), ...localAvailable ]);

      allDatesToSave.forEach(dateStr => {
        const isDayOff = !localAvailable.includes(dateStr);
        availabilityRecords.push({
          work_date: dateStr,
          time_slots: isDayOff ? [] : (localSlots[dateStr] || []),
          is_day_off: isDayOff
        });
      });

      if (availabilityRecords.length > 0) {
        const { error } = await supabase.from('availability').upsert(availabilityRecords, { onConflict: 'work_date' });
        if (error) throw error;
      }

      onUpdateTenant({ timeSlots: localSlots, availableDates: localAvailable });
      alert('Расписание успешно сохранено в базе!');
    } catch (err: any) {
      alert('Ошибка при сохранении расписания: ' + err.message);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // --- Services State ---
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingServiceForm, setEditingServiceForm] = useState({ name: '', price: '', durationMinutes: '' });

  const startAddingService = () => {
    setEditingServiceId(null);
    setIsAddingService(true);
    setEditingServiceForm({ name: '', price: '', durationMinutes: '60' });
  };

  const startEditingService = (service: Service) => {
    setIsAddingService(false);
    if (editingServiceId === service.id) {
      setEditingServiceId(null);
    } else {
      setEditingServiceId(service.id);
      setEditingServiceForm({
        name: service.name,
        price: service.price.toString(),
        durationMinutes: service.durationMinutes.toString()
      });
    }
  };

  const [isSavingService, setIsSavingService] = useState(false);

  const handleSaveService = async () => {
    const price = parseInt(editingServiceForm.price, 10);
    const durationCount = parseInt(editingServiceForm.durationMinutes, 10);
    
    if (!editingServiceForm.name || isNaN(price) || isNaN(durationCount)) {
      alert('Заполните все поля корректно');
      return;
    }

    setIsSavingService(true);
    try {
      if (isAddingService) {
        const { data, error } = await supabase.from('services').insert([
          { name: editingServiceForm.name, price, duration_minutes: durationCount }
        ]).select().single();

        if (error) throw error;

        const newService: Service = { 
          id: data.id, 
          name: data.name, 
          price: Number(data.price), 
          durationMinutes: data.duration_minutes 
        };
        onUpdateTenant({ services: [...tenant.services, newService] });
        setIsAddingService(false);
      } else if (editingServiceId) {
        const { error } = await supabase.from('services').update({
          name: editingServiceForm.name, 
          price, 
          duration_minutes: durationCount
        }).eq('id', editingServiceId);

        if (error) throw error;

        const newServices = tenant.services.map(s => 
          s.id === editingServiceId ? { ...s, name: editingServiceForm.name, price, durationMinutes: durationCount } : s
        );
        onUpdateTenant({ services: newServices });
        setEditingServiceId(null);
      }
    } catch (err: any) {
      alert('Ошибка при сохранении услуги: ' + err.message);
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Точно удалить эту услугу?')) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', serviceId);
        if (error) throw error;

        onUpdateTenant({ services: tenant.services.filter(s => s.id !== serviceId) });
        setEditingServiceId(null);
      } catch (err: any) {
        alert('Ошибка удаления: ' + err.message);
      }
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
              {loadingAppts ? (
                <p className="text-zinc-500 text-sm py-4 text-center w-full">Загрузка записей...</p>
              ) : appointments.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center w-full">Нет новых записей</p>
              ) : (
                appointments.map(appt => {
                  const clientName = appt.clients ? `${appt.clients.first_name || ''} ${appt.clients.last_name || ''}`.trim() || 'Без имени' : 'Без имени';
                  const handle = appt.clients?.username ? `@${appt.clients.username}` : '';
                  const serviceName = appt.services?.name || 'Услуга удалена';
                  const dateStr = format(new Date(appt.appointment_date), 'dd MMM', { locale: ru });
                  const timeStr = appt.start_time.substring(0, 5); // "14:00:00" -> "14:00"

                  return (
                    <div key={appt.id} className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-zinc-100 text-[15px] flex items-center gap-2">
                            {clientName}
                            {handle && (
                              <a href={`https://t.me/${handle.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 text-[12px] font-normal hover:underline bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 active:scale-95 transition-transform flex items-center">
                                {handle}
                              </a>
                            )}
                          </p>
                          <div className="text-zinc-500 text-[13px] mt-1.5 flex items-center gap-1.5">
                            <div className={`w-1 h-1 rounded-full opacity-80 ${appt.status === 'confirmed' ? 'bg-green-500' : 'bg-purple-500'}`} />
                            {serviceName} {appt.status === 'confirmed' && <span className="text-green-500 text-[11px] ml-1">(Подтверждено)</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-950/50 text-zinc-300 text-[11px] font-medium border border-white/5 shadow-sm">
                            {dateStr}, {timeStr}
                          </span>
                        </div>
                      </div>
                      {appt.status === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleConfirmAppt(appt.id, appt.appointment_date, appt.start_time)} className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-400 text-[13px] font-bold hover:bg-green-500/20 active:bg-green-500/30 transition-all border border-green-500/20 shadow-sm active:scale-95">
                            Подтвердить
                          </button>
                          <button onClick={() => handleCancelAppt(appt.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-[13px] font-bold hover:bg-red-500/20 active:bg-red-500/30 transition-all border border-red-500/20 shadow-sm active:scale-95">
                            Отменить
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
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
              
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-[10px] text-purple-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-purple-100">Быстрый режим</h4>
                      <p className="text-[12px] text-purple-300">Клик по дню = вкл/выкл рабочий день</p>
                    </div>
                 </div>
                 <div 
                    onClick={() => setFastMode(!fastMode)}
                    className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors border border-purple-500/30 shadow-inner ${fastMode ? 'bg-purple-500' : 'bg-purple-900/50 hover:bg-purple-800/50'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${fastMode ? 'translate-x-5' : ''}`} />
                  </div>
              </div>

              <div className="bg-zinc-950/80 p-2 sm:p-4 rounded-3xl border border-white/5 shadow-inner">
                <Calendar tenant={{...tenant, availableDates: localAvailable} as Tenant} selectedDate={tempDate} onSelectDate={handleCalendarClick} isAdmin />
              </div>

              {tempDate && (
                <div className="mt-6 p-5 bg-zinc-800/40 rounded-3xl border border-white/5 animate-slide-up shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-zinc-100 font-semibold text-[16px]">
                      Окна на <span className="text-purple-400 font-bold">{format(tempDate, 'd MMMM', { locale: ru })}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-medium text-zinc-400 hidden sm:block">Рабочий день</span>
                       <div 
                         onClick={handleToggleWorkingDay}
                         className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors border border-white/5 shadow-inner ${isWorkingDay ? 'bg-purple-500' : 'bg-zinc-700/80 hover:bg-zinc-600'}`}
                       >
                         <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isWorkingDay ? 'translate-x-5' : ''}`} />
                       </div>
                    </div>
                  </div>
                  
                  <div className={`grid grid-cols-4 gap-2 transition-all duration-300 ${!isWorkingDay ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
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
                </div>
              )}

              <button onClick={handleSaveSchedule} disabled={isSavingSchedule} className="w-full mt-2 py-3.5 rounded-2xl bg-zinc-100 text-zinc-900 font-bold text-[14px] hover:bg-white transition-colors border border-transparent active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50">
                {isSavingSchedule ? 'Сохранение...' : 'Сохранить расписание'}
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 animate-slide-up">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100">Ваши услуги</h3>
                <button 
                  onClick={startAddingService} 
                  className={`p-2.5 rounded-xl transition-colors border active:scale-95 ${isAddingService ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20'}`}
                >
                  <Plus className={`w-5 h-5 transition-transform ${isAddingService ? 'rotate-45' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {isAddingService && (
                  <div className="bg-zinc-900 border border-purple-500/30 p-4 rounded-2xl animate-fade-in shadow-lg">
                    <h4 className="text-[14px] font-semibold text-purple-300 mb-3">Добавление услуги</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Название</label>
                        <input value={editingServiceForm.name} onChange={e => setEditingServiceForm(p => ({...p, name: e.target.value}))} placeholder="Например: Классический маникюр" type="text" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Стоимость (₽)</label>
                          <input value={editingServiceForm.price} onChange={e => setEditingServiceForm(p => ({...p, price: e.target.value}))} type="number" placeholder="1500" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Время (мин)</label>
                          <input value={editingServiceForm.durationMinutes} onChange={e => setEditingServiceForm(p => ({...p, durationMinutes: e.target.value}))} type="number" placeholder="60" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
                        <button onClick={handleSaveService} disabled={isSavingService} className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-[13px] font-bold hover:bg-purple-600 transition-colors shadow-sm disabled:opacity-50">
                          {isSavingService ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button onClick={() => setIsAddingService(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[13px] font-bold hover:bg-zinc-700 transition-colors shadow-sm border border-white/5">
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tenant.services.length === 0 && !isAddingService && <p className="text-zinc-500 text-sm text-center py-4 text-full">Нет добавленных услуг</p>}
                
                {tenant.services.map((service) => (
                  <div key={service.id} className="bg-zinc-800/40 rounded-2xl border border-white/5 overflow-hidden transition-colors">
                    <div className="p-4 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
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
                      <button 
                        onClick={() => startEditingService(service)} 
                        className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm ${editingServiceId === service.id ? 'bg-zinc-700 border-white/10 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'}`}
                      >
                        <Settings className={`w-4 h-4 transition-transform ${editingServiceId === service.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>

                    {/* Expandable Edit Menu */}
                    {editingServiceId === service.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-zinc-900/30 animate-fade-in">
                        <div className="space-y-3">
                          <div>
                            <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Название услуги</label>
                            <input value={editingServiceForm.name} onChange={e => setEditingServiceForm(p => ({...p, name: e.target.value}))} type="text" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Стоимость (₽)</label>
                              <input value={editingServiceForm.price} onChange={e => setEditingServiceForm(p => ({...p, price: e.target.value}))} type="number" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                            </div>
                            <div className="flex-1">
                              <label className="text-[12px] text-zinc-500 mb-1 block ml-1">Время (мин)</label>
                              <input value={editingServiceForm.durationMinutes} onChange={e => setEditingServiceForm(p => ({...p, durationMinutes: e.target.value}))} type="number" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 pt-2">
                            <button onClick={handleSaveService} disabled={isSavingService} className="flex-1 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[13px] font-bold hover:bg-purple-500/30 transition-colors shadow-sm disabled:opacity-50">
                              {isSavingService ? 'Сохранение...' : 'Сохранить'}
                            </button>
                            <button onClick={() => handleDeleteService(service.id)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[13px] font-bold hover:bg-red-500/20 transition-colors shadow-sm">
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
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
