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

app.use((req, res, next) => {
    if (req.hostname.includes('onrender.com') && req.path === '/') {
        return res.redirect(301, 'https://ialksng.me/projects/smartsphere');
    }
    next();
});

const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));