const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// Load credentials from environment variables or use fallback (from user input)
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'poUwcW+bBI3OKkn10XuuLuX4v0Jw4bsb3V76xtV1bVXmGI9cKnNTARCweHDttKss8luwOg+8BJBQkuBVJIy4cdqS1f2WAbcsace3PrBXqzsG5W4GySkGfnlEsQb/AkopP/cL6JFno6azQPACzSk3awdB04t89/1O/w1cDnyilFU=';
const LINE_USER_ID = process.env.LINE_USER_ID || 'C15f9f5da8022558853307931bf42e9b2'; // Updated to Group ID

const sendLineNotification = async (message) => {
    try {
        const payload = {
            to: LINE_USER_ID,
            messages: [
                {
                    type: 'text',
                    text: message
                }
            ]
        };

        await axios.post('https://api.line.me/v2/bot/message/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });

        console.log('LINE Notification sent successfully');
    } catch (error) {
        console.error('Error sending LINE Notification:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendLineNotification };
