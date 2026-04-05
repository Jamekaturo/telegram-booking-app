import React, { useState, useEffect } from 'react';
import { Tenant, Service } from '../types';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarIcon, List, Clock, Settings, UserCircle, Plus, Palette, GripVertical } from 'lucide-react';
import { Calendar } from './Calendar';
import { format } from 'date-fns';
import { ru, uk } from 'date-fns/locale';

const t = {
  title: 'Панель адміністратора',
  tabs: {
    appointments: 'Записи',
    schedule: 'Графік',
    services: 'Послуги',
    settings: 'Дизайн'
  },
  loadingAppts: 'Завантаження записів...',
  noAppts: 'Немає записів',
  allAppts: 'Всі записи',
  noName: 'Без імені',
  write: 'Написати',
  confirmed: 'Підтверджено',
  confirm: 'Підтвердити',
  cancel: 'Скасувати',
  cancelPrompt: 'Скасувати запис (всі послуги)?',
  errorConfirm: 'Помилка при підтвердженні: ',
  errorCancel: 'Помилка при скасуванні: ',
  scheduleTitle: 'Налаштування графіка',
  scheduleDesc: 'Оберіть будь-яку дату для налаштування робочих годин.',
  fastMode: 'Швидкий режим',
  fastModeDesc: 'Клік по дню = вкл/викл робочий день',
  windowsOn: 'Вікна на',
  workDay: 'Робочий день',
  saveSchedule: 'Зберегти графік',
  saving: 'Збереження...',
  successSchedule: 'Графік успішно збережено!',
  errorSchedule: 'Помилка при збереженні графіка: ',
  yourServices: 'Ваші послуги',
  addService: 'Додавання послуги',
  name: 'Назва',
  namePlaceholder: 'Наприклад: Класичний манікюр',
  price: 'Вартість',
  duration: 'Час (хв)',
  save: 'Зберегти',
  cancelBtn: 'Скасувати',
  noServices: 'Немає доданих послуг',
  serviceDeleted: 'Послугу видалено',
  deletePrompt: 'Точно видалити цю послугу?',
  errorDelete: 'Помилка видалення: ',
  errorSaveService: 'Помилка при збереженні послуги: ',
  fillAll: 'Заповніть всі поля коректно',
  designTitle: 'Налаштування дизайну',
  designDesc: 'Оберіть одну з 5 преміальних тем, яку побачать ваші клієнти.',
  themes: {
    midnight: 'Midnight (Темне листя)',
    snow: 'Snow (Світла чиста)',
    blossom: 'Blossom (Кремова)',
    cyberpunk: 'Cyberpunk (Неонова)'
  },
  min: 'хв'
};

// DND Kit
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableServiceItem = ({ service, startEditingService, editingServiceId, isActive }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: service.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`bg-zinc-800/40 rounded-2xl border border-white/5 overflow-hidden flex transition-colors ${isActive ? 'ring-2 ring-purple-500 z-50 bg-zinc-800/80 shadow-2xl' : ''}`}>
      <div {...attributes} {...listeners} className="p-4 pr-2 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 touch-none">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="py-4 pr-4 flex justify-between items-center group hover:bg-zinc-800/60 transition-colors">
          <div className="flex-1">
            <h4 className="font-medium text-zinc-200 text-[14px] group-hover:text-purple-300 transition-colors pr-2">
              {service.name}
            </h4>
            <p className="text-zinc-500 text-[12px] font-medium mt-1.5 flex items-center gap-1.5">
               <Clock className="w-3.5 h-3.5" /> {service.durationMinutes} {t.min} 
               <span className="w-1 h-1 bg-zinc-700 rounded-full mx-0.5" /> 
               {service.price}
            </p>
          </div>
          <button 
             onPointerDown={(e) => e.stopPropagation()}
             onClick={() => startEditingService(service)} 
             className={`p-2.5 rounded-xl border transition-all active:scale-95 shadow-sm ${editingServiceId === service.id ? 'bg-zinc-700 border-white/10 text-white' : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'}`}
          >
             <Settings className={`w-4 h-4 transition-transform ${editingServiceId === service.id ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface AdminPanelProps {
  tenant: Tenant;
  onUpdateTenant: (updates: Partial<Tenant>) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ tenant, onUpdateTenant }) => {
  const [activeTab, setActiveTab] = useState<'appointments' | 'schedule' | 'services' | 'settings'>('appointments');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [currentTheme, setCurrentTheme] = useState(document.documentElement.getAttribute('data-theme') || 'midnight');

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
            clients ( first_name, last_name, username, telegram_id ),
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

  const handleConfirmApptGroup = async (ids: string[], dateStr: string, timeSlots: string[]) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: 'confirmed' }).in('id', ids);
      if (error) throw error;
      setAppointments(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: 'confirmed' } : a));
      
      const newBooked = { ...(tenant.bookedSlots || {}) };
      if (!newBooked[dateStr]) newBooked[dateStr] = [];
      timeSlots.forEach(slot => {
        if (!newBooked[dateStr].includes(slot)) {
          newBooked[dateStr].push(slot);
        }
      });
      onUpdateTenant({ bookedSlots: newBooked });
    } catch (err: any) {
      alert(t.errorConfirm + err.message);
    }
  };

  const handleCancelApptGroup = async (ids: string[]) => {
    if (confirm(t.cancelPrompt)) {
      try {
        const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).in('id', ids);
        if (error) throw error;
        setAppointments(prev => prev.map(a => ids.includes(a.id) ? { ...a, status: 'cancelled' } : a).filter(a => a.status !== 'cancelled')); 
      } catch (err: any) {
        alert(t.errorCancel + err.message);
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
      alert(t.successSchedule);
    } catch (err: any) {
      alert(t.errorSchedule + err.message);
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
      alert(t.fillAll);
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
      alert(t.errorSaveService + err.message);
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm(t.deletePrompt)) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', serviceId);
        if (error) throw error;

        onUpdateTenant({ services: tenant.services.filter(s => s.id !== serviceId) });
        setEditingServiceId(null);
      } catch (err: any) {
        alert(t.errorDelete + err.message);
      }
    }
  };

  const tabs = [
    { id: 'appointments', label: t.tabs.appointments, icon: <UserCircle className="w-5 h-5" /> },
    { id: 'schedule', label: t.tabs.schedule, icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'services', label: t.tabs.services, icon: <List className="w-5 h-5" /> },
    { id: 'settings', label: t.tabs.settings, icon: <Palette className="w-5 h-5" /> },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tenant.services.findIndex(s => s.id === active.id);
    const newIndex = tenant.services.findIndex(s => s.id === over.id);

    const newServices = arrayMove(tenant.services, oldIndex, newIndex);
    onUpdateTenant({ services: newServices });

    try {
      await supabase.from('services').upsert(
        newServices.map((s, idx) => ({ 
          id: s.id, 
          name: s.name, 
          price: s.price, 
          duration_minutes: s.durationMinutes,
          order_index: idx
        })), { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('Backend sorting not natively supported unless order_index column exists.', e);
    }
  };

  return (
    <div className="animate-fade-in fade-in pb-24 px-4 sm:px-6">
      <div className="flex flex-col space-y-6 mt-4">
        
        {/* Header and Tabs */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 drop-shadow-md">
              {t.title}
            </h2>
          </div>
          
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" /> {t.allAppts}
                </h3>
              </div>
              
              {loadingAppts ? (
                <p className="text-zinc-500 text-sm py-4 text-center w-full">{t.loadingAppts}</p>
              ) : appointments.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center w-full">{t.noAppts}</p>
              ) : (
                (() => {
                  // Первая группировка: склеиваем услуги одного заказа вместе
                  const ordersMap = new Map<any, any[]>();
                  appointments.forEach(appt => {
                    const groupId = appt.client_comment?.startsWith('order_') ? appt.client_comment : appt.id;
                    if (!ordersMap.has(groupId)) {
                      ordersMap.set(groupId, []);
                    }
                    ordersMap.get(groupId)!.push(appt);
                  });
                  
                  // Вторая группировка: по датам
                  const datesMap = new Map<string, any[][]>();
                  Array.from(ordersMap.values()).forEach(group => {
                    const dateStr = group[0].appointment_date;
                    if (!datesMap.has(dateStr)) datesMap.set(dateStr, []);
                    datesMap.get(dateStr)!.push(group);
                  });

                  // Сортировка дат
                  const sortedDates = Array.from(datesMap.keys()).sort();

                  return sortedDates.map(dateStr => {
                    const groupsForDate = datesMap.get(dateStr)!;
                    const displayDate = format(new Date(dateStr), 'dd.MM', { locale: uk });
                    
                    return (
                      <div key={dateStr} className="mb-6 last:mb-0 animate-fade-in">
                        <h4 className="text-[17px] font-bold text-zinc-200 border-b border-white/10 pb-1.5 mb-3 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-purple-400" />
                          {displayDate}
                        </h4>
                        <div className="space-y-3 pl-1">
                          {groupsForDate.map(group => {
                            const mainAppt = group[0];
                    const clientName = mainAppt.clients ? `${mainAppt.clients.first_name || ''} ${mainAppt.clients.last_name || ''}`.trim() || t.noName : t.noName;
                    const handle = mainAppt.clients?.username ? `@${mainAppt.clients.username}` : '';
                    
                    const groupServices = group.map(a => a.services?.name || t.serviceDeleted);
                    const allServiceNames = groupServices.join(', ');
                    
                    const dateStr = format(new Date(mainAppt.appointment_date), 'dd MMM', { locale: uk });
                    const timeStr = mainAppt.start_time.substring(0, 5); 
                    const idsToConfirm = group.map(a => a.id);
                    const slotsToBook = group.map(a => a.start_time.substring(0, 5));
                    
                    const isAllConfirmed = group.every(a => a.status === 'confirmed');

                    return (
                      <div key={mainAppt.id} className="bg-zinc-800/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-zinc-100 text-[15px] flex items-center gap-2">
                              {clientName}
                              {handle ? (
                                <button onClick={(e) => {
                                  e.preventDefault();
                                  const tg = (window as any).Telegram?.WebApp;
                                  if (tg?.openTelegramLink) tg.openTelegramLink(`https://t.me/${handle.replace('@','')}`);
                                  else window.open(`https://t.me/${handle.replace('@','')}`, '_blank');
                                }} className="text-purple-400 text-[12px] font-normal hover:underline bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 active:scale-95 transition-transform flex items-center cursor-pointer">
                                  {handle}
                                </button>
                              ) : mainAppt.clients?.telegram_id ? (
                                <button onClick={(e) => {
                                  e.preventDefault();
                                  const tg = (window as any).Telegram?.WebApp;
                                  if (tg?.openTelegramLink) tg.openTelegramLink(`tg://user?id=${mainAppt.clients.telegram_id}`);
                                  else window.location.href = `tg://user?id=${mainAppt.clients.telegram_id}`;
                                }} className="text-purple-400 text-[12px] font-normal hover:underline bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 active:scale-95 transition-transform flex items-center cursor-pointer">
                                  Написати
                                </button>
                              ) : null}
                            </p>
                            <div className="text-zinc-500 text-[13px] mt-1.5 flex items-center gap-1.5 flex-wrap">
                              <div className={`w-1 h-1 rounded-full opacity-80 ${isAllConfirmed ? 'bg-green-500' : 'bg-purple-500'}`} />
                              {allServiceNames} {isAllConfirmed && <span className="text-green-500 text-[11px] ml-1">({t.confirmed})</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-950/50 text-zinc-300 text-[11px] font-medium border border-white/5 shadow-sm">
                              {dateStr}, {timeStr}
                            </span>
                          </div>
                        </div>
                        {!isAllConfirmed && (
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleConfirmApptGroup(idsToConfirm, mainAppt.appointment_date, slotsToBook)} className="flex-1 py-2 rounded-xl bg-green-500/10 text-green-400 text-[13px] font-bold hover:bg-green-500/20 active:bg-green-500/30 transition-all border border-green-500/20 shadow-sm active:scale-95">
                              Подтвердить
                            </button>
                            <button onClick={() => handleCancelApptGroup(idsToConfirm)} className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-500 text-[13px] font-bold hover:bg-red-500/20 active:bg-red-500/30 transition-all border border-red-500/20 shadow-sm active:scale-95">
                              Отменить
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              );
            });
          })()
        )}
      </div>
    )}

          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-slide-up pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-400" />
                  {t.scheduleTitle}
                </h3>
              </div>
              <p className="text-zinc-400 text-[13px] mb-4 leading-relaxed font-medium">
                {t.scheduleDesc}
              </p>
              
              <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-[10px] text-purple-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-purple-100">{t.fastMode}</h4>
                      <p className="text-[12px] text-purple-300">{t.fastModeDesc}</p>
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
                <Calendar tenant={{...tenant, availableDates: localAvailable} as Tenant} selectedDate={tempDate} onSelectDate={handleCalendarClick} isAdmin appointments={appointments} />
              </div>

              {tempDate && (
                <div className="mt-6 p-5 bg-zinc-800/40 rounded-3xl border border-white/5 animate-slide-up shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-zinc-100 font-semibold text-[16px]">
                      {t.windowsOn} <span className="text-purple-400 font-bold">{format(tempDate, 'd MMMM', { locale: uk })}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                       <span className="text-[12px] font-medium text-zinc-400 hidden sm:block">{t.workDay}</span>
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
                {isSavingSchedule ? t.saving : t.saveSchedule}
              </button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 animate-slide-up">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100">{t.yourServices}</h3>
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
                    <h4 className="text-[14px] font-semibold text-purple-300 mb-3">{t.addService}</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.name}</label>
                        <input value={editingServiceForm.name} onChange={e => setEditingServiceForm(p => ({...p, name: e.target.value}))} placeholder={t.namePlaceholder} type="text" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.price}</label>
                          <input value={editingServiceForm.price} onChange={e => setEditingServiceForm(p => ({...p, price: e.target.value}))} type="number" placeholder="1500" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.duration}</label>
                          <input value={editingServiceForm.durationMinutes} onChange={e => setEditingServiceForm(p => ({...p, durationMinutes: e.target.value}))} type="number" placeholder="60" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
                        <button onClick={handleSaveService} disabled={isSavingService} className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-[13px] font-bold hover:bg-purple-600 transition-colors shadow-sm disabled:opacity-50">
                          {isSavingService ? t.saving : t.save}
                        </button>
                        <button onClick={() => setIsAddingService(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-[13px] font-bold hover:bg-zinc-700 transition-colors shadow-sm border border-white/5">
                          {t.cancelBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tenant.services.length === 0 && !isAddingService && <p className="text-zinc-500 text-sm text-center py-4 text-full">{t.noServices}</p>}
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={tenant.services.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {tenant.services.map((service) => (
                      <div key={service.id} className="relative">
                        <SortableServiceItem 
                          service={service} 
                          startEditingService={startEditingService}
                          editingServiceId={editingServiceId}
                          isActive={editingServiceId === service.id}
                        />

                        {/* Expandable Edit Menu */}
                        {editingServiceId === service.id && (
                          <div className="bg-zinc-800/40 rounded-b-2xl border border-white/5 border-t-0 px-4 pb-4 pt-4 mt-[-8px] animate-fade-in z-10 relative">
                            <div className="space-y-3">
                              <div>
                                <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.name}</label>
                                <input value={editingServiceForm.name} onChange={e => setEditingServiceForm(p => ({...p, name: e.target.value}))} type="text" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                              </div>
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.price}</label>
                                  <input value={editingServiceForm.price} onChange={e => setEditingServiceForm(p => ({...p, price: e.target.value}))} type="number" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[12px] text-zinc-500 mb-1 block ml-1">{t.duration}</label>
                                  <input value={editingServiceForm.durationMinutes} onChange={e => setEditingServiceForm(p => ({...p, durationMinutes: e.target.value}))} type="number" className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[13px] text-zinc-100 placeholder:text-zinc-700 outline-none focus:border-purple-500/50 transition-colors" />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4 pt-2">
                                <button onClick={handleSaveService} disabled={isSavingService} className="flex-1 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[13px] font-bold hover:bg-purple-500/30 transition-colors shadow-sm disabled:opacity-50">
                                  {isSavingService ? t.saving : t.save}
                                </button>
                                <button onClick={() => handleDeleteService(service.id)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-[13px] font-bold hover:bg-red-500/20 transition-colors shadow-sm">
                                  {t.cancel}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 animate-slide-up pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-100 flex gap-2 items-center">
                  <Palette className="w-5 h-5 text-purple-400" /> {t.designTitle}
                </h3>
              </div>
              <p className="text-[13px] text-zinc-400 mb-4 leading-relaxed font-medium">
                {t.designDesc}
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {([
                  { id: 'midnight', accent: '#9333ea', bg: '#040405' },
                  { id: 'snow', accent: '#9333ea', bg: '#ffffff' },
                  { id: 'blossom', accent: '#f4c2c2', bg: '#fdfbf7' },
                  { id: 'cyberpunk', accent: '#ec4899', bg: '#000b18' }
                ] as const).map(theme => {
                   const isActive = currentTheme === theme.id;
                   return (
                     <button
                       key={theme.id}
                       onClick={() => {
                         localStorage.setItem('app_theme', theme.id);
                         document.documentElement.setAttribute('data-theme', theme.id);
                         setCurrentTheme(theme.id);
                       }}
                       className={`p-4 rounded-[1.25rem] border text-left flex justify-between items-center transition-all duration-300 active:scale-95 ${
                         isActive 
                           ? 'bg-[var(--bg-card)] border-[var(--accent-main)] shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-1 ring-[var(--accent-main)]' 
                           : 'bg-zinc-900/50 border-white/5 hover:border-white/20 hover:bg-zinc-800'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full border border-white/10 shadow-inner flex items-center justify-center overflow-hidden relative" style={{ backgroundColor: theme.bg }}>
                           {/* Decorative accent sliver */}
                           <div className="absolute right-0 bottom-0 top-0 w-3" style={{ background: theme.accent }} />
                         </div>
                         <span className={`text-[15px] font-bold ${isActive ? 'text-[var(--text-main)] drop-shadow-sm' : 'text-zinc-300'}`}>
                           {t.themes[theme.id]}
                         </span>
                       </div>
                       {isActive && <div className="w-3 h-3 rounded-full bg-[var(--accent-main)] shadow-[0_0_12px_var(--accent-main)] animate-pulse" />}
                     </button>
                   );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
