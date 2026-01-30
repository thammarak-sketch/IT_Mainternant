const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'poUwcW+bBI3OKkn10XuuLuX4v0Jw4bsb3V76xtV1bVXmGI9cKnNTARCweHDttKss8luwOg+8BJBQkuBVJIy4cdqS1f2WAbcsace3PrBXqzsG5W4GySkGfnlEsQb/AkopP/cL6JFno6azQPACzSk3awdB04t89/1O/w1cDnyilFU=';
const LINE_USER_ID = process.env.LINE_USER_ID || 'C15f9f5da8022558853307931bf42e9b2';

/**
 * Sends a Flex Message (Card) to LINE
 */
const sendLineFlexNotification = async (data) => {
    try {
        const {
            service_type,
            reporter_name,
            location,
            description,
            asset_code,
            status = 'pending'
        } = data;

        // Map service type for display
        const typeLabel = service_type === 'new_setup' ? 'ติดตั้งใหม่' :
            service_type === 'service' ? 'บริการ' : 'ซ่อม';
        const typeColor = service_type === 'new_setup' ? '#A855F7' :
            service_type === 'service' ? '#3B82F6' : '#EA580C';

        // Map status for display
        const statusLabel = status === 'completed' ? 'เสร็จสิ้น' :
            status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอคิว';
        const statusColor = status === 'completed' ? '#22C55E' :
            status === 'in_progress' ? '#EAB308' : '#6B7280';

        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        const payload = {
            to: LINE_USER_ID,
            messages: [
                {
                    type: 'flex',
                    altText: `🛠️ แจ้งเตือน${typeLabel}ใหม่: ${reporter_name}`,
                    contents: {
                        type: 'bubble',
                        header: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: `🔔 แจ้งเตือน${typeLabel}ใหม่`,
                                    weight: 'bold',
                                    size: 'lg',
                                    color: '#FFFFFF'
                                }
                            ],
                            backgroundColor: typeColor
                        },
                        body: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'เวลา:', size: 'sm', color: '#888888', flex: 2 },
                                        { type: 'text', text: timeStr, size: 'sm', color: '#111111', flex: 4, weight: 'bold' }
                                    ],
                                    margin: 'md'
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'ประเภท:', size: 'sm', color: '#888888', flex: 2 },
                                        { type: 'text', text: typeLabel, size: 'sm', color: typeColor, flex: 4, weight: 'bold' }
                                    ],
                                    margin: 'md'
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'สถานที่:', size: 'sm', color: '#888888', flex: 2 },
                                        { type: 'text', text: location || '-', size: 'sm', color: '#111111', flex: 4, wrap: true }
                                    ],
                                    margin: 'md'
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'สถานะ:', size: 'sm', color: '#888888', flex: 2 },
                                        { type: 'text', text: statusLabel, size: 'sm', color: statusColor, flex: 4, weight: 'bold' }
                                    ],
                                    margin: 'md'
                                },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'ผู้แจ้ง:', size: 'sm', color: '#888888', flex: 2 },
                                        { type: 'text', text: reporter_name || '-', size: 'sm', color: '#111111', flex: 4, wrap: true, weight: 'bold' }
                                    ],
                                    margin: 'md'
                                },
                                { type: 'separator', margin: 'lg' },
                                { type: 'text', text: 'รายละเอียด:', size: 'xs', color: '#888888', margin: 'md' },
                                { type: 'text', text: description || 'ไม่มีรายละเอียด', size: 'sm', color: '#333333', wrap: true, margin: 'xs' },
                                {
                                    type: 'box',
                                    layout: 'horizontal',
                                    contents: [
                                        { type: 'text', text: 'รหัสเครื่อง:', size: 'xs', color: '#888888', flex: 2 },
                                        { type: 'text', text: asset_code || '-', size: 'xs', color: '#111111', flex: 4 }
                                    ],
                                    margin: 'md'
                                }
                            ]
                        },
                        footer: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'ITAssist Management System',
                                    size: 'xxs',
                                    color: '#AAAAAA',
                                    align: 'center'
                                }
                            ]
                        }
                    }
                }
            ]
        };

        await axios.post('https://api.line.me/v2/bot/message/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });

        console.log('LINE Flex Notification sent successfully');
    } catch (error) {
        console.error('Error sending LINE Flex Notification:', error.response ? error.response.data : error.message);
    }
};

const sendLineNotification = async (message) => {
    try {
        const payload = {
            to: LINE_USER_ID,
            messages: [{ type: 'text', text: message }]
        };
        await axios.post('https://api.line.me/v2/bot/message/push', payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
            }
        });
        console.log('LINE Text Notification sent successfully');
    } catch (error) {
        console.error('Error sending LINE Text Notification:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendLineNotification, sendLineFlexNotification };
