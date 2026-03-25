require('dotenv').config(); 
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'Smartsphere API is live' }));
app.use('/api/auth', authRoutes);

const clientBuildPath = path.join(__dirname, '../client/dist');
app.use('/projects/smartsphere', express.static(clientBuildPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});