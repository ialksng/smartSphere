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

app.use('/api/auth', require('./routes/auth.routes'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Smart Sphere API is running' });
});

const clientBuildPath = path.join(__dirname, '../client/dist');

// FIX 1: Serve static files on the specific subpath Vite expects
app.use('/projects/smartsphere', express.static(clientBuildPath));

// FIX 2: Serve on root as a fallback (good for local dev)
app.use(express.static(clientBuildPath));

// FIX 3: If someone visits the root of the site, redirect them to the app
app.get('/', (req, res) => {
    res.redirect('/projects/smartsphere');
});

// Catch-all route needs to stay at the very bottom
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));