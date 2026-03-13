import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';

// Создаем инстанс бота. Данные берутся из переменных окружения Vercel
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

// Базовый URL до нашего Mini App
const APP_URL = process.env.MINI_APP_URL || 'https://ВСТАВИТЬ_СВОЙ_VERCEL.vercel.app';

// Обработчик команды /start
bot.start((ctx) => {
  // Вытягиваем start_param (полезную нагрузку) - например, t.me/bot?start=master_2
  // ctx.payload содержит "master_2"
  const payload = ctx.payload || 'master_1';
  
  // Прикрепляем payload как query-параметр: https://...vercel.app?tenant=master_2
  const finalUrl = `${APP_URL}?tenant=${payload}`;

  // Отправляем приветственное видео или гифку (по желанию), а сейчас просто текст
  return ctx.reply('Добро пожаловать в студию! ✨\n\nНажмите кнопку ниже, чтобы выбрать услугу и время:', {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: 'Записаться онлайн 📅',
            web_app: { url: finalUrl }
          }
        ]
      ]
    }
  });
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Vercel Serverless Function отлавливает POST-запросы от Telegram
    if (req.method === 'POST') {
      // Передаем тело запроса во внутренний обработчик Telegraf
      await bot.handleUpdate(req.body, res);
      
      if (!res.headersSent) {
        res.status(200).send('OK');
      }
    } else {
      // Если кто-то просто зайдет по ссылке api/bot в браузере (GET)
      res.status(405).send('Method Not Allowed. This is a Telegram Bot Webhook.');
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
}
