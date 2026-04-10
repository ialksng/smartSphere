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

// --- API ROUTING CONFIGURATION ---
const apiRouter = express.Router();

apiRouter.use('/auth', require('./routes/auth.routes'));
apiRouter.use('/ai', require('./routes/ai.routes'));     
apiRouter.use('/cloud', require('./routes/cloud.routes'));

// 🔥 ADD THIS LINE (MOST IMPORTANT FIX)
apiRouter.use('/dochub', require('./routes/dochub.routes'));

apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Smart Sphere API is running' });
});

// Mount API
app.use('/api', apiRouter);
app.use('/projects/smartsphere/api', apiRouter); 

// --- STATIC FILE SERVING ---
const clientBuildPath = path.join(__dirname, '../client/dist');

app.use('/projects/smartsphere', express.static(clientBuildPath));
app.use(express.static(clientBuildPath));

app.get('/', (req, res) => {
    res.redirect('/projects/smartsphere');
});

// React SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));