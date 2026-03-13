import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
const adminChatId = process.env.ADMIN_CHAT_ID;

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

  if (!token || !adminChatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID environment variables');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const { clientName, serviceName, date, time, price, username } = req.body;
    
    if (!clientName || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bot = new Telegraf(token);

    const handleText = username ? ` (@${username})` : '';
    const priceText = price ? `\n💰 *Стоимость:* ${price} ₽` : '';

    const message = `🔔 *Новая запись!*\n\n` +
      `👤 *Клиент:* ${clientName}${handleText}\n` +
      `💅 *Услуга:* ${serviceName}\n` +
      `📅 *Дата:* ${date}\n` +
      `⏰ *Время:* ${time}${priceText}\n\n` +
      `Зайдите в Админ-панель (кнопка ⚙️) внутри вашего бота, чтобы подтвердить!`;

    await bot.telegram.sendMessage(adminChatId, message, { parse_mode: 'Markdown' });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Error sending telegram notification:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
