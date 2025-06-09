// File: netlify/functions/sendMessage.js
exports.handler = async function(event, context) {
  // Ambil token dan ID dari Environment Variables (dijelaskan di langkah 3)
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  // Ambil pesan yang dikirim dari browser pengguna
  const { message } = JSON.parse(event.body);

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=<span class="math-inline">\{TELEGRAM\_CHAT\_ID\}&text\=</span>{encodeURIComponent(message)}`;
  
  try {
    const fetch = require('node-fetch');
    const response = await fetch(url);
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};