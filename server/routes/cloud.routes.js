const express = require('express');
const { google } = require('googleapis');
// We will need the User model to save the tokens later
// const User = require('../models/User'); 

const router = express.Router();

// Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// 1. Generate the Google Login URL
// The frontend will call this route to get the URL to redirect the user to.
router.get('/google/auth', (req, res) => {
    // We pass the user ID in the query string from the frontend so we remember 
    // exactly who is trying to connect their drive.
    const userId = req.query.userId; 

    if (!userId) {
        return res.status(400).json({ message: "User ID is required to connect Cloud services." });
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Requests a refresh token so the user stays logged in
        prompt: 'consent',      // Forces the consent screen to guarantee we get a refresh token
        scope: ['https://www.googleapis.com/auth/drive.readonly'], // Read-only access to their Drive
        state: userId           // We pass the userId into the 'state' parameter. Google will hand this exact string back to us in the callback.
    });
    
    res.json({ url: authUrl });
});

// 2. Handle the Google Callback
// Google redirects the user here AFTER they click "Allow" on the consent screen.
router.get('/google/callback', async (req, res) => {
    // Google hands us back an authorization 'code' and our original 'state' (which contains the userId)
    const { code, state: userId } = req.query; 
    
    try {
        if (!code) throw new Error("No authorization code provided by Google.");

        // Exchange the temporary code for permanent access/refresh tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // ---------------------------------------------------------
        // TODO for next session: Save these tokens to the database!
        // We will add a 'googleTokens' field to your User.js schema
        // await User.findByIdAndUpdate(userId, { googleTokens: tokens });
        // ---------------------------------------------------------

        console.log(`Successfully acquired Google Drive tokens for User ID: ${userId}`);

        // Securely redirect the user back to the SmartSphere frontend
        // We append a success query parameter so the frontend knows it worked
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=success');
        
    } catch (error) {
        console.error('Google OAuth Error:', error);
        // Redirect back with an error flag if something failed
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=error');
    }
});

// Future OneDrive endpoints (Stubs)
router.get('/onedrive/auth', (req, res) => res.json({ message: "OneDrive Auth Route" }));
router.get('/onedrive/callback', (req, res) => res.json({ message: "OneDrive Callback" }));

module.exports = router;