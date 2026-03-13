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

function App() {
  const { tenant, setTenant, loading, error } = useTenant();
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<'booking' | 'admin'>('booking');

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

  const handleBooking = () => {
    if (!canBook) return;

    const bookingData = {
      tenantId: tenant.id,
      services: selectedServiceIds,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedSlot,
      totalPrice
    };

    console.log('Отправка данных записи:', bookingData);

    const webApp = (window as any).Telegram?.WebApp;
    if (webApp) {
      webApp.showAlert(`Успешно! Вы записаны на ${format(selectedDate, 'dd.MM')} в ${selectedSlot}. Ждем вас!`, () => {
        webApp.close();
      });
    } else {
      alert(`Локальный тест: Запись на ${format(selectedDate, 'dd.MM')} в ${selectedSlot} успешно создана!`);
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
          disabled={!canBook}
          onClick={handleBooking}
          totalPrice={totalPrice}
        />
      )}
    </div>
  );
}

export default App;
