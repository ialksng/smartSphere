const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// --- FIX: Define base path to match Vercel proxy routing ---
const BASE_PATH = '/projects/smartsphere';

app.use(`${BASE_PATH}/api/auth`, require('./routes/auth.routes'));
app.use(`${BASE_PATH}/api/ai`, require('./routes/ai.routes'));     
app.use(`${BASE_PATH}/api/cloud`, require('./routes/cloud.routes'));

app.get(`${BASE_PATH}/api/health`, (req, res) => {
    res.json({ status: 'ok', message: 'Smart Sphere API is running' });
});
// -----------------------------------------------------------

const clientBuildPath = path.join(__dirname, '../client/dist');

// Serve the static files exactly where Vite expects them
app.use('/projects/smartsphere', express.static(clientBuildPath));

// Also serve them at the root just in case
app.use(express.static(clientBuildPath));

// Redirect the bare domain to your project path
app.get('/', (req, res) => {
    res.redirect('/projects/smartsphere');
});

// Catch-all route needs to stay at the very bottom
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));