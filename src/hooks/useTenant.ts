import { useState, useEffect } from 'react';
import { Tenant } from '../types';
import { supabase } from '../lib/supabase';

export const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    
    const fetchTenantData = async () => {
      setLoading(true);
      try {
        const [ { data: servicesData, error: servicesError }, { data: availabilityData, error: availabilityError }, { data: appointmentsData, error: appointmentsError } ] = await Promise.all([
           supabase.from('services').select('*'),
           supabase.from('availability').select('*'),
           supabase.from('appointments').select('appointment_date, start_time, status, created_at')
        ]);

        if (servicesError) throw servicesError;
        if (availabilityError) throw availabilityError;

        const services = (servicesData || [])
          .sort((a, b) => {
             // Fallback to order_index, or fallback to created_at
             const orderA = a.order_index ?? 999;
             const orderB = b.order_index ?? 999;
             if (orderA !== orderB) return orderA - orderB;
             // Secondary sort by date
             return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          })
          .map(s => ({
            id: s.id,
            name: s.name,
            price: Number(s.price),
            durationMinutes: s.duration_minutes
          }));

        const availableDates: string[] = [];
        const timeSlots: Record<string, string[]> = {};

        (availabilityData || []).forEach(a => {
          if (!a.is_day_off) {
            // Supabase returns date fields as standard YYYY-MM-DD strings
            availableDates.push(a.work_date);
            if (a.time_slots && Array.isArray(a.time_slots)) {
              timeSlots[a.work_date] = [...a.time_slots].sort();
            } else {
              timeSlots[a.work_date] = [];
            }
          }
        });

        const bookedSlots: Record<string, string[]> = {};
        (appointmentsData || []).forEach(appt => {
           const dateStr = appt.appointment_date;
           const slot = appt.start_time.substring(0, 5);
           
           if (appt.status === 'confirmed') {
             if (!bookedSlots[dateStr]) bookedSlots[dateStr] = [];
             if (!bookedSlots[dateStr].includes(slot)) {
               bookedSlots[dateStr].push(slot);
             }
           }
        });

        // Use standard ID and mocked theme info until DB handles it
        setTenant({
          id: 'master_1',
          name: 'Beauty Studio "Glow"',
          description: 'Маникюр, педикюр и уход за ногтями 💅',
          colors: {
            primary: '#c084fc',
            secondary: '#3b0764'
          },
          services,
          availableDates,
          timeSlots,
          bookedSlots
        });
        
      } catch (err: any) {
        console.error('Error fetching tenant data:', err);
        setError('Не удалось загрузить данные мастера. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();

    // Инициализация Telegram WebApp
    if (webApp) {
      webApp.ready();
      webApp.expand();
      
      // Tell Telegram UI we are in dark mode
      if(webApp.setHeaderColor) {
        webApp.setHeaderColor('#09090b'); // zinc-950
      }
      if(webApp.setBackgroundColor) {
        webApp.setBackgroundColor('#09090b');
      }
    }
  }, []);

  return { tenant, setTenant, loading, error };
};
