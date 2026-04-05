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

    const escapeHtml = (text: string) => {
       return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const handleText = username ? ` (@${username})` : '';
    const nameMention = telegramId ? `<a href="tg://user?id=${telegramId}">${escapeHtml(clientName)}</a>` : escapeHtml(clientName);
    const priceText = price ? `\n💰 <b>Вартість:</b> ${price}` : '';

    const safeService = escapeHtml(serviceName);

    const message = `🔔 <b>Новий запис!</b>\n\n` +
      `👤 <b>Клієнт:</b> ${nameMention}${handleText}\n` +
      `💅 <b>Послуги:</b> ${safeService}\n` +
      `📅 <b>Дата:</b> ${date}\n` +
      `⏰ <b>Час:</b> ${time}${priceText}\n\n` +
      `Зайдіть в Адмін-панель (кнопка ⚙️) всередині вашого бота, щоб підтвердити!`;

    try {
       await bot.telegram.sendMessage(targetChatId, message, { parse_mode: 'HTML' });
    } catch (err: any) {
       console.error('Failed to notify admin', err);
       // fallback without parse_mode
       await bot.telegram.sendMessage(targetChatId, message.replace(/<b>|<\/b>|<a>|<\/a>/g, ''));
    }

    // Send confirmation to client
    if (telegramId) {
      try {
        const clientMsg = `✅ <b>Ваш запис успішно створено!</b>\n\n` +
          `💅 <b>Послуги:</b> ${safeService}\n` +
          `📅 <b>Дата:</b> ${date}\n` +
          `⏰ <b>Час:</b> ${time}${priceText}\n\n` +
          `Ми зв'яжемося з вами у разі потреби, або просто чекаємо на вас у призначений час!`;
        await bot.telegram.sendMessage(telegramId, clientMsg, { parse_mode: 'HTML' });
      } catch (err) {
        console.error('Failed to notify client via DM', err);
      }
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error sending telegram notification:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
