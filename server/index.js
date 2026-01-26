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

app.use('/api/assets', assetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes);

console.log('Maintenance routes registered at /api/maintenance');

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
// Restart trigger
