const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login with thammarak / 1234 ...');
        const response = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'thammarak',
            password: '1234'
        });
        console.log('Login Successful:', response.data);
    } catch (error) {
        console.error('Login Failed:', error.response ? error.response.data : error.message);
    }
}

testLogin();
