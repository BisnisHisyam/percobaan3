// File BARU: netlify/functions/sendFaceImage.js

// Gunakan 'require' karena ini lingkungan Node.js
const fetch = require('node-fetch');
const FormData = require('form-data');

exports.handler = async function(event) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  try {
    const { caption, imageData } = JSON.parse(event.body);

    // Ubah data Base64 kembali menjadi data biner (Buffer)
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');

    // Siapkan form data untuk dikirim
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('caption', caption);
    // 'photo' adalah nama field yang diminta oleh API Telegram
    // 'face.jpg' adalah nama file fiktif
    formData.append('photo', buffer, 'face.jpg');

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

    // Kirim ke Telegram menggunakan POST dengan FormData
    await fetch(url, {
      method: 'POST',
      body: formData,
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};