const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// API Route Check (to test backend is alive)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Smart Sphere API is running' });
});

// Redirect bare Render URL to your portfolio
app.use((req, res, next) => {
    if (req.hostname.includes('onrender.com') && req.path === '/') {
        return res.redirect(301, 'https://ialksng.me/projects/smartsphere');
    }
    next();
});

// Serve Frontend Static Files
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Catch-all Route for React Router
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));