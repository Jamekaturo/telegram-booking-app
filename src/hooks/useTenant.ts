import { useState, useEffect } from 'react';
import { Tenant } from '../types';

export const useTenant = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем start_param из Telegram WebApp API
    // https://core.telegram.org/bots/webapps#webappinitdata
    const webApp = (window as any).Telegram?.WebApp;
    
    // Check URL parameters for tenant fallback (used when opened via Inline Button)
    const urlParams = new URLSearchParams(window.location.search);
    const urlTenant = urlParams.get('tenant');

    // Если мы запускаем локально или нет start_param, берём параметр из URL или тестовый ID "master_1"
    const startParam = webApp?.initDataUnsafe?.start_param || urlTenant || 'master_1';

    // Имитация запроса к API для получения данных арендатора (мастера) по ID
    const fetchTenantData = async (tenantId: string) => {
      setLoading(true);
      try {
        // Имитация сетевой задержки
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Мокированные данные: в реальности здесь будет fetch(`/api/tenants/${tenantId}`)
        if (tenantId === 'master_1') {
          setTenant({
            id: 'master_1',
            name: 'Beauty Studio "Glow"',
            description: 'Маникюр, педикюр и уход за ногтями 💅',
            colors: {
              primary: '#c084fc', // Purple 400 (better for dark mode)
              secondary: '#3b0764' // Purple 900 (background tint)
            },
            services: [
              { id: 's1', name: 'Маникюр с покрытием гель-лак', price: 2000, durationMinutes: 90 },
              { id: 's2', name: 'Педикюр', price: 2500, durationMinutes: 120 },
              { id: 's3', name: 'Снятие чужого покрытия', price: 500, durationMinutes: 30 }
            ],
            availableDates: [
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 86400000).toISOString().split('T')[0],
              new Date(Date.now() + 172800000).toISOString().split('T')[0],
            ],
            timeSlots: {
              [new Date().toISOString().split('T')[0]]: ['10:00', '11:00', '14:00', '16:00'],
              [new Date(Date.now() + 86400000).toISOString().split('T')[0]]: ['12:00', '15:00'],
              [new Date(Date.now() + 172800000).toISOString().split('T')[0]]: ['09:00', '10:00', '18:00'],
            }
          });
        } else {
          // Другие мастера
          setTenant({
             id: tenantId,
             name: `Мастер ${tenantId}`,
             description: 'Стрижки и окрашивание ✂️',
             colors: { primary: '#60a5fa', secondary: '#1e3a8a' }, // Blue 400 and Blue 900
             services: [
               { id: 'h1', name: 'Стрижка женская', price: 1500, durationMinutes: 60 },
               { id: 'h2', name: 'Окрашивание', price: 4000, durationMinutes: 180 },
             ],
             availableDates: [new Date().toISOString().split('T')[0]],
             timeSlots: { [new Date().toISOString().split('T')[0]]: ['10:00', '11:00'] }
          });
        }
      } catch (err) {
        setError('Не удалось загрузить данные мастера');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData(startParam);

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

  return { tenant, loading, error };
};
