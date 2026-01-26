const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:3000/api/maintenance', {
            asset_id: 1,
            description: "test report",
            cost: 0,
            reporter_name: "Debug Agent",
            contact_info: "999",
            department: "IT",
            log_date: "2024-02-14"
        });
        console.log("Success:", res.data);
    } catch (err) {
        if (err.response) {
            console.log("Error Status:", err.response.status);
            console.log("Error Data:", err.response.data);
        } else {
            console.log("Error:", err.message);
        }
    }
}

test();
