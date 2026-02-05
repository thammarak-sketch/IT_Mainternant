const axios = require('axios');

async function testNextCode() {
    try {
        console.log('Testing GET /api/assets/next-code for Laptop...');
        const res1 = await axios.get('http://localhost:3000/api/assets/next-code?type=Laptop');
        console.log('Response for Laptop:', res1.data);

        console.log('Testing GET /api/assets/next-code for PC...');
        const res2 = await axios.get('http://localhost:3000/api/assets/next-code?type=PC');
        console.log('Response for PC:', res2.data);

    } catch (err) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Status:', err.response.status);
            console.error('Response Data:', err.response.data);
        }
    }
}

testNextCode();
