const express = require('express');
const { google } = require('googleapis');
const User = require('../models/User'); 
const { verifyToken } = require('../middleware/auth.middleware'); 
const { extractTextFromBuffer } = require('../services/document.service');
const { analyzeText } = require('../services/ai.service');
const Insight = require('../models/Insight');

const router = express.Router();

// This MUST match what is in your Google Cloud Console and your .env
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// 1. Generate Login URL
router.get('/google/auth', (req, res) => {
    const userId = req.query.userId; 
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', 
        prompt: 'consent',      
        scope: ['https://www.googleapis.com/auth/drive.readonly'], 
        state: userId           
    });
    
    res.json({ url: authUrl });
});

// 2. Handle Callback & Save Tokens
router.get('/google/callback', async (req, res) => {
    const { code, state: userId } = req.query; 
    
    try {
        if (!code) throw new Error("No authorization code provided.");

        // Exchange the code for actual access/refresh tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Save the tokens to MongoDB
        await User.findByIdAndUpdate(userId, { googleTokens: tokens });

        console.log(`Successfully connected Google Drive for User: ${userId}`);
        
        // Redirect back to your frontend dashboard on your custom domain
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=success');
        
    } catch (error) {
        console.error('Google OAuth Error:', error);
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=error');
    }
});

// 3. Fetch Google Drive Files
router.get('/google/files', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user || !user.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const response = await drive.files.list({
            pageSize: 10,
            fields: 'files(id, name, mimeType, modifiedTime)',
            q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false",
            orderBy: 'modifiedTime desc'
        });

        res.json(response.data.files);
    } catch (error) {
        console.error("Fetch Drive Files Error:", error);
        res.status(500).json({ message: "Failed to fetch files from Google Drive." });
    }
});

// 4. Download & Import File to AI
router.post('/google/import', verifyToken, async (req, res) => {
    try {
        const { fileId, fileName, mimeType } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user || !user.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let fileBuffer;
        let finalMimeType = mimeType;

        if (mimeType === 'application/vnd.google-apps.document') {
            const response = await drive.files.export(
                { fileId: fileId, mimeType: 'text/plain' }, 
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
            finalMimeType = 'text/plain'; 
        } else {
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' }, 
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
        }

        const extractedText = await extractTextFromBuffer(fileBuffer, finalMimeType);
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        const prompt = `Please provide a concise 2-sentence summary of the following document:\n\n${cleanText.substring(0, 3000)}`;
        const summary = await analyzeText(prompt, "You are a helpful document summarizer.");

        const newInsight = new Insight({
            userId: req.user.id,
            filename: fileName,
            fileType: finalMimeType,
            content: cleanText,
            summary: summary,
            source: 'googledrive' 
        });

        await newInsight.save();

        res.json({ message: "Import successful", insight: newInsight });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ message: `Import failed: ${error.message}` });
    }
});

module.exports = router;