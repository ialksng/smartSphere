const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => res.json({ status: 'Smartsphere API is live' }));

const clientBuildPath = path.join(__dirname, '../client/dist');
app.use('/projects/smartsphere', express.static(clientBuildPath));

app.get('/', (req, res) => res.redirect('/projects/smartsphere'));

app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));