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
// Create a unified router for all API endpoints
const apiRouter = express.Router();

apiRouter.use('/auth', require('./routes/auth.routes'));
apiRouter.use('/ai', require('./routes/ai.routes'));     
apiRouter.use('/cloud', require('./routes/cloud.routes'));
apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Smart Sphere API is running' });
});

// CRITICAL FIX: Mount the API router on BOTH paths.
// This ensures that when Google redirects back to your custom domain
// (ialksng.me/projects/smartsphere/api/cloud/google/callback), 
// the Express backend catches it before the React frontend tries to render a blank page.
app.use('/api', apiRouter);
app.use('/projects/smartsphere/api', apiRouter); 
// --------------------------------------------------

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