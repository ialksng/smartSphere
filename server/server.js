const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const apiRouter = express.Router();

apiRouter.use('/auth', require('./routes/auth.routes'));
apiRouter.use('/ai', require('./routes/ai.routes'));
apiRouter.use('/cloud', require('./routes/cloud.routes'));
apiRouter.use('/dochub', require('./routes/dochub.routes'));
apiRouter.use('/folders', require('./routes/folder.routes'));
apiRouter.use('/stats', require('./routes/stats.routes'));

apiRouter.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SmartSphere API running'
    });
});

app.use('/api', apiRouter);
app.use('/projects/smartsphere/api', apiRouter);

const clientBuildPath = path.join(__dirname, '../client/dist');

app.use('/projects/smartsphere', express.static(clientBuildPath));
app.use(express.static(clientBuildPath));

app.get('/', (req, res) => {
    res.redirect('/projects/smartsphere');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong',
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});