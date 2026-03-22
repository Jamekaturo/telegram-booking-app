import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Добавлен фоллбэк, чтобы избежать краша (белого экрана) React приложения 
// при отсутствии файла .env с ключами Supabase. Вместо белого экрана покажется красивая ошибка.
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnonKey || 'missing-key'
);
