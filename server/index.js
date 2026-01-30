const express = require('express'); // Restart trigger
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const assetRoutes = require('./routes/assets');
const authRoutes = require('./routes/auth');
const maintenanceRoutes = require('./routes/maintenance');
const userRoutes = require('./routes/users');
const emailRoutes = require('./routes/emails');

app.use('/api/assets', assetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);

console.log('Maintenance routes registered at /api/maintenance');

// LINE Webhook to capture Group ID
app.post('/api/webhook', (req, res) => {
    try {
        const events = req.body.events;
        if (events && events.length > 0) {
            events.forEach(event => {
                console.log('LINE Event Received:', JSON.stringify(event, null, 2));
                if (event.source) {
                    console.log('Source ID:', event.source.groupId || event.source.userId);
                }
            });
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).send('Error');
    }
});

// app.get('/', (req, res) => {
//     res.send('Prompt Repository API is running');
// });

// Serve static files from the React app
const path = require('path');
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Basic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const runMigrations = require('./migrations');

const startServer = async () => {
    try {
        // Run database migrations before starting the server
        await runMigrations();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

startServer();
// Restart trigger
