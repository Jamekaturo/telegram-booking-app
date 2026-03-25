import React, { useState, useEffect } from 'react';
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
  const [currentTheme, setCurrentTheme] = useState('midnight');

  useEffect(() => {
    if (tenant) {
      const themes = ['midnight', 'snow', 'blossom', 'cyberpunk'];
      let hash = 0;
      for (let i = 0; i < tenant.id.length; i++) {
        hash = tenant.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const themeIndex = Math.abs(hash) % themes.length;
      
      const savedTheme = localStorage.getItem('app_theme');
      const finalTheme = savedTheme || themes[themeIndex];
      document.documentElement.setAttribute('data-theme', finalTheme);
      setCurrentTheme(finalTheme);
    }
  }, [tenant]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <div className="w-12 h-12 border-4 border-[var(--border-main)] border-t-[var(--accent-main)] rounded-full animate-spin mb-4" />
        <p className="text-[var(--text-secondary)] font-medium">Загрузка данных мастера...</p>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="text-center p-6 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-main)] max-w-sm mx-4">
          <h2 className="text-xl font-bold text-red-500 mb-2">Ошибка</h2>
          <p className="text-[var(--text-secondary)]">{error || "Нет данных"}</p>
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
      const webApp = (window as any).Telegram?.WebApp;
      const tgUser = webApp?.initDataUnsafe?.user;
      
      const tgId = tgUser?.id || Math.floor(Math.random() * 1000000);
      const firstName = tgUser?.first_name || 'Клиент';
      const lastName = tgUser?.last_name || '';
      const username = tgUser?.username || '';

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
      } else {
        await supabase
          .from('clients')
          .update({ first_name: firstName, last_name: lastName, username: username })
          .eq('id', clientData.id);
      }

      // Генерируем уникальный ID заказа для связи услуг
      const orderId = Math.random().toString(36).substring(2, 9);
      
      let currentStartTime = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(':').map(Number);
      currentStartTime.setHours(hours, minutes, 0, 0);

      const appointmentsToInsert = selectedServices.map(service => {
        const startSlot = `${currentStartTime.getHours().toString().padStart(2, '0')}:${currentStartTime.getMinutes().toString().padStart(2, '0')}`;
        currentStartTime = new Date(currentStartTime.getTime() + service.durationMinutes * 60000);
        const endSlot = `${currentStartTime.getHours().toString().padStart(2, '0')}:${currentStartTime.getMinutes().toString().padStart(2, '0')}`;
        
        return {
          client_id: clientData.id,
          service_id: service.id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: `${startSlot}:00`,
          end_time: `${endSlot}:00`,
          status: 'pending',
          client_comment: `order_${orderId}`
        };
      });

      const { error: apptError } = await supabase.from('appointments').insert(appointmentsToInsert);
      if (apptError) throw apptError;

      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: `${firstName} ${lastName}`.trim(),
            telegramId: tgId,
            username: username,
            serviceName: selectedServices.map(s => s.name).join(', '),
            date: format(selectedDate, 'dd.MM.yyyy'),
            time: selectedSlot,
            price: totalPrice
          })
        });
      } catch (e) {
        console.error('Failed to notify admin', e);
      }
      
      if (webApp && webApp.showAlert) {
        webApp.showAlert(`Успешно! Вы записаны на ${format(selectedDate, 'dd.MM')} в ${selectedSlot}. Ждем вас!`);
      } else {
        alert(`Запись успешно создана!`);
      }
      // Сброс формы и оставляем MiniApp открытым
      setSelectedServiceIds([]);
      setSelectedDate(null);
      setSelectedSlot(null);
    } catch (err: any) {
      console.error('Ошибка записи:', err);
      alert('Произошла ошибка при записи: ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <>
      {/* 🚀 GPU-Accelerated Fixed Background pattern (prevents repaint on scroll) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[var(--bg-main)]" style={{ backgroundImage: 'var(--bg-pattern)' }} />
      
      <div className="min-h-[100dvh] pb-[140px] font-sans text-[var(--text-main)] relative overflow-x-hidden w-full">
      {tenant && (
        <button
          onClick={() => setMode(mode === 'booking' ? 'admin' : 'booking')}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-main)] shadow-lg text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors active:scale-95"
        >
          {mode === 'booking' ? <SettingsIcon className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
        </button>
      )}

      {/* Theme Tester (Temp) */}
      <div className="absolute top-6 left-4 z-50 flex gap-1.5 p-1.5 bg-[var(--bg-card)] rounded-full border border-[var(--border-main)] shadow-lg hover:shadow-xl transition-shadow bg-opacity-95">
        {[
          { id: 'midnight', bg: '#040405', border: '#9333ea' },
          { id: 'snow', bg: '#ffffff', border: '#9333ea' },
          { id: 'blossom', bg: '#fdf5f5', border: '#eda8b5' },
          { id: 'cyberpunk', bg: '#000b18', border: '#ec4899' }
        ].map(theme => (
          <button
            key={theme.id}
            onClick={() => {
              localStorage.setItem('app_theme', theme.id);
              document.documentElement.setAttribute('data-theme', theme.id);
              setCurrentTheme(theme.id);
            }}
            className={`w-6 h-6 rounded-full border shadow-inner transition-transform active:scale-90 ${currentTheme === theme.id ? 'scale-110 ring-2 ring-offset-1 ring-offset-[var(--bg-card)]' : 'scale-100 opacity-60 hover:opacity-100'}`}
            style={{ 
              backgroundColor: theme.bg, 
              borderColor: 'rgba(150,150,150,0.3)',
              ...(currentTheme === theme.id && { '--tw-ring-color': theme.border } as any)
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {mode === 'booking' && <Header tenant={tenant} />}
        
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
                  selectedTotalDuration={selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0)}
                />
              </div>
            )}
          </main>
        ) : (
          <main className="max-w-[480px] mx-auto min-h-[100dvh] relative z-20">
            {/* ФОН ДЛЯ АДМИНКИ: Всегда тёмный, чтобы избежать проблем с белым текстом на светлых темах */}
            <div className="fixed inset-0 bg-[#040405] -z-10" />
            
            <div className="relative z-10 pt-12 pb-10">
              <AdminPanel 
                tenant={tenant} 
                onUpdateTenant={(updates) => setTenant(prev => prev ? { ...prev, ...updates } : prev)}
              />
            </div>
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
    </>
  );
}

export default App;
