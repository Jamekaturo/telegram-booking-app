import React, { useState } from 'react';
import { useTenant } from './hooks/useTenant';
import { Header } from './components/Header';
import { ServiceList } from './components/ServiceList';
import { Calendar } from './components/Calendar';
import { TimeSlots } from './components/TimeSlots';
import { BookingButton } from './components/BookingButton';
import { AdminPanel } from './components/AdminPanel';
import { format } from 'date-fns';
import { Settings as SettingsIcon, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from './lib/supabase';

function App() {
  const { tenant, setTenant, loading, error } = useTenant();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<'booking' | 'admin'>('booking');
  const [isBooking, setIsBooking] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400 font-medium">Загрузка данных мастера...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center p-6 bg-zinc-900 rounded-3xl shadow-sm border border-red-900/50 max-w-sm mx-4">
          <h2 className="text-xl font-bold text-red-500 mb-2">Ошибка</h2>
          <p className="text-zinc-400">{error || "Нет данных"}</p>
        </div>
      </div>
    );
  }

  const handleToggleService = (id: string) => {
    setSelectedServiceIds((prev) => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const selectedServices = tenant.services.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const canBook = selectedServiceIds.length > 0 && selectedDate !== null && selectedSlot !== null;

  const handleBooking = async () => {
    if (!canBook || !selectedDate || !selectedSlot) return;

    setIsBooking(true);
    try {
      // 1. Создаем или находим мокового клиента (т.к. у нас пока нет реальной авторизации)
      // В реальном приложении данные берутся из Telegram WebApp initData
      const webApp = (window as any).Telegram?.WebApp;
      const tgUser = webApp?.initDataUnsafe?.user;
      
      const tgId = tgUser?.id || Math.floor(Math.random() * 100000);
      const firstName = tgUser?.first_name || 'Тестовый';
      const lastName = tgUser?.last_name || 'Клиент';
      const username = tgUser?.username || 'testclient';

      // Пытаемся найти или создать клиента
      let { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('telegram_id', tgId)
        .single();

      if (!clientData) {
        const { data: newClient, error: newClientError } = await supabase
          .from('clients')
          .insert([{ telegram_id: tgId, first_name: firstName, last_name: lastName, username: username }])
          .select('id')
          .single();
        
        if (newClientError) throw newClientError;
        clientData = newClient;
      }

      // 2. Рассчитываем время окончания (очень простой расчет)
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);
      const endSlot = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

      // 3. Создаем записи (по одной на каждую услугу, либо можно объединить)
      // В текущей схеме БД 1 запись = 1 услуга. Создадим записи для всех выбранных услуг.
      const appointmentsToInsert = selectedServiceIds.map(serviceId => ({
        client_id: clientData.id,
        service_id: serviceId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: `${selectedSlot}:00`,
        end_time: `${endSlot}:00`,
        status: 'pending'
      }));

      const { error: apptError } = await supabase.from('appointments').insert(appointmentsToInsert);
      if (apptError) throw apptError;



      if (webApp && webApp.showAlert) {
        webApp.showAlert(`Успешно! Вы записаны на ${format(selectedDate, 'dd.MM')} в ${selectedSlot}. Ждем вас!`, () => {
          webApp.close();
        });
      } else {
        alert(`Запись успешно создана в базе данных!`);
        // Сброс формы
        setSelectedServiceIds([]);
        setSelectedDate(null);
        setSelectedSlot(null);
      }
    } catch (err: any) {
      console.error('Ошибка записи:', err);
      alert('Произошла ошибка при записи: ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#040405] pb-[140px] font-sans text-zinc-100 relative overflow-x-hidden">
      {/* Toggler Button */}
      {tenant && (
        <button
          onClick={() => setMode(mode === 'booking' ? 'admin' : 'booking')}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-zinc-900 border border-white/10 shadow-lg text-zinc-400 hover:text-white transition-colors active:scale-95"
        >
          {mode === 'booking' ? <SettingsIcon className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
        </button>
      )}

      <div className="relative z-10">
        <Header tenant={tenant} />
        
        {mode === 'booking' ? (
          <main className="max-w-[480px] mx-auto fade-in pb-8">
            <ServiceList 
              tenant={tenant}
              selectedServiceIds={selectedServiceIds}
              onToggleService={handleToggleService}
            />
            
            {selectedServiceIds.length > 0 && (
              <div className="space-y-6 mt-2 pt-4 animate-slide-up">
                <Calendar 
                  tenant={tenant}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />
                
                <TimeSlots 
                  tenant={tenant}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                />
              </div>
            )}
          </main>
        ) : (
          <main className="max-w-[480px] mx-auto">
            <AdminPanel 
              tenant={tenant} 
              onUpdateTenant={(updates) => setTenant(prev => prev ? { ...prev, ...updates } : prev)}
            />
          </main>
        )}
      </div>

      {mode === 'booking' && (
        <BookingButton 
          tenant={tenant}
          disabled={!canBook || isBooking}
          onClick={handleBooking}
          totalPrice={totalPrice}
        />
      )}
    </div>
  );
}

export default App;
