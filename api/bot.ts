import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('CRITICAL: TELEGRAM_BOT_TOKEN is missing in Vercel Environment Variables!');
}

const bot = new Telegraf(token || 'dummy_token');
const APP_URL = process.env.MINI_APP_URL || 'https://telegram-booking-app.vercel.app';

// Включаем логирование запросов
bot.use(Telegraf.log());

bot.start(async (ctx) => {
  try {
    const payload = ctx.payload || 'master_1';
    const finalUrl = `${APP_URL}?tenant=${payload}`;
    
    console.log('User sent /start. Replying with URL:', finalUrl);

    await ctx.reply('Ласкаво просимо до студії! ✨\n\nНатисніть кнопку нижче, щоб обрати послугу та час:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Запишіться онлайн 📅', web_app: { url: finalUrl } }]
        ]
      }
    });

    // Оновлюємо текст кнопки меню
    try {
      await ctx.setChatMenuButton({
        type: 'web_app',
        text: 'Запис',
        web_app: { url: APP_URL }
      });
    } catch (e) {
      console.error('Failed to set chat menu button:', e);
    }
  } catch (error) {
    console.error('Error sending start message:', error);
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      console.log('Received payload from Telegram:', JSON.stringify(req.body, null, 2));
      await bot.handleUpdate(req.body, res);
      if (!res.headersSent) {
        res.status(200).send('OK');
      }
    } catch (e) {
      console.error('Vercel Webhook Error:', e);
      res.status(200).send('OK with errors'); // Всегда возвращаем 200 телеграму, чтобы он не повторял запросы
    }
  } else {
    res.status(200).json({ status: 'Bot is running. Send POST request.', hasToken: !!token, appUrl: APP_URL });
  }
}
