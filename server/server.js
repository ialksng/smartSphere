const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();


// 🔥 DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));


// 🔥 MIDDLEWARE
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));


// --- API ROUTER ---
const apiRouter = express.Router();

// 🔥 ROUTES
apiRouter.use('/auth', require('./routes/auth.routes'));
apiRouter.use('/ai', require('./routes/ai.routes'));
apiRouter.use('/cloud', require('./routes/cloud.routes'));
apiRouter.use('/dochub', require('./routes/dochub.routes'));
apiRouter.use('/folders', require('./routes/folder.routes')); // ✅ NEW
apiRouter.use('/stats', require('./routes/stats.routes'));


// 🔥 HEALTH CHECK
apiRouter.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SmartSphere API running 🚀'
    });
});


// 🔥 MOUNT API
app.use('/api', apiRouter);
app.use('/projects/smartsphere/api', apiRouter);


// --- STATIC FRONTEND ---
const clientBuildPath = path.join(__dirname, '../client/dist');

app.use('/projects/smartsphere', express.static(clientBuildPath));
app.use(express.static(clientBuildPath));


// 🔥 ROOT
app.get('/', (req, res) => {
    res.redirect('/projects/smartsphere');
});


// 🔥 SPA FALLBACK
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});


// 🔥 GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong',
        error: err.message
    });
});


// 🔥 START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});