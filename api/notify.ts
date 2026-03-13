import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Настройка CORS для вызова из браузера
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN environment variable');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const { clientName, telegramId, serviceName, date, time, price, username } = req.body;
    
    if (!clientName || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bot = new Telegraf(token);

    // Fetch the admin's telegram_id from supabase
    let targetChatId = adminChatId;
    if (supabaseUrl && supabaseKey) {
       const { data: adminUser, error: adminError } = await supabase
         .from('clients')
         .select('telegram_id')
         .eq('role', 'admin')
         .single();
       
       if (adminUser?.telegram_id) {
          targetChatId = adminUser.telegram_id;
       } else if (adminError) {
          console.error('Failed to fetch admin from DB:', adminError);
       }
    }

    if (!targetChatId) {
       console.error('No admin Chat ID could be found from DB or environment.');
       return res.status(500).json({ error: 'No admin Chat ID configured' });
    }

    const handleText = username ? ` (@${username})` : '';
    const nameMention = telegramId ? `[${clientName}](tg://user?id=${telegramId})` : clientName;
    const priceText = price ? `\n💰 *Стоимость:* ${price} ₽` : '';

    const message = `🔔 *Новая запись!*\n\n` +
      `👤 *Клиент:* ${nameMention}${handleText}\n` +
      `💅 *Услуга:* ${serviceName}\n` +
      `📅 *Дата:* ${date}\n` +
      `⏰ *Время:* ${time}${priceText}\n\n` +
      `Зайдите в Админ-панель (кнопка ⚙️) внутри вашего бота, чтобы подтвердить!`;

    await bot.telegram.sendMessage(targetChatId, message, { parse_mode: 'Markdown' });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error sending telegram notification:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
