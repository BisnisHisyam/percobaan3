require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(cors()); // Optional: batasi dengan origin jika perlu
app.use(express.json());

app.post('/send-message', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }

    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        res.json({ success: true, data: response.data });
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).json({ success: false, error: 'Failed to send message to Telegram' });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

