const express = require('express');
const { google } = require('googleapis');
const User = require('../models/User'); 
const { verifyToken } = require('../middleware/auth.middleware'); 
const { extractTextFromBuffer } = require('../services/document.service');
const { analyzeText } = require('../services/ai.service');
const Insight = require('../models/Insight');

const router = express.Router();

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

        const { tokens } = await oauth2Client.getToken(code);
        
        // --- NEW: Actually save the tokens to MongoDB! ---
        await User.findByIdAndUpdate(userId, { googleTokens: tokens });

        console.log(`Successfully connected Google Drive for User: ${userId}`);
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=success');
        
    } catch (error) {
        console.error('Google OAuth Error:', error);
        res.redirect('https://www.ialksng.me/projects/smartsphere/dashboard?cloud=error');
    }
});

// 3. --- NEW: Fetch Google Drive Files ---
router.get('/google/files', verifyToken, async (req, res) => {
    try {
        // 1. Find the user in the database
        const user = await User.findById(req.user.id);
        
        // 2. Check if they have connected their drive
        if (!user || !user.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        // 3. Set the credentials for this specific user
        oauth2Client.setCredentials(user.googleTokens);
        
        // 4. Initialize the Google Drive API
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        // 5. Fetch their 10 most recent files (ignoring folders)
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

// 4. --- NEW: Download & Import File to AI ---
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

        // Google Docs cannot be downloaded directly; they must be "exported" to text
        if (mimeType === 'application/vnd.google-apps.document') {
            const response = await drive.files.export(
                { fileId: fileId, mimeType: 'text/plain' }, 
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
            finalMimeType = 'text/plain'; // Treat it as a standard text file now
        } else {
            // Standard files (PDFs, DOCX, TXT) can be downloaded directly
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' }, 
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
        }

        // Pass the downloaded file into your existing RAG extraction pipeline!
        const extractedText = await extractTextFromBuffer(fileBuffer, finalMimeType);
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        // Generate the AI summary
        const prompt = `Please provide a concise 2-sentence summary of the following document:\n\n${cleanText.substring(0, 3000)}`;
        const summary = await analyzeText(prompt, "You are a helpful document summarizer.");

        // Save to your MongoDB Insights database
        const newInsight = new Insight({
            userId: req.user.id,
            filename: fileName,
            fileType: finalMimeType,
            content: cleanText,
            summary: summary,
            source: 'googledrive' // Tag it so you know it came from the cloud
        });

        await newInsight.save();

        res.json({ message: "Import successful", insight: newInsight });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ message: `Import failed: ${error.message}` });
    }
});

module.exports = router;

