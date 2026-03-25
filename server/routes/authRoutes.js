const express = require('express');
const router = express.Router();
const { getGoogleAuthUrl, getGoogleTokens } = require('../services/googleDriveService');
// const User = require('../models/User'); 
// const { encryptToken } = require('../utils/crypto');

router.get('/google', (req, res) => {
    const url = getGoogleAuthUrl();
    res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
    const code = req.query.code;
    
    try {
        
        const tokens = await getGoogleTokens(code);
        
        console.log("Tokens received from Google!", tokens);
        
        res.redirect('https://ialksng.me/projects/smartsphere/dashboard');

    } catch (error) {
        console.error('Error during Google Auth Callback:', error);
        res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
});

module.exports = router;