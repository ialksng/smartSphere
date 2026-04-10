const express = require('express');
const { google } = require('googleapis');
const User = require('../models/User'); 
const { verifyToken } = require('../middleware/auth.middleware'); 
const { extractTextFromBuffer } = require('../services/document.service');
const { analyzeText } = require('../services/ai.service');
const Insight = require('../models/Insight');

const router = express.Router();

// OAuth setup
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

// 2. Handle Callback
router.get('/google/callback', async (req, res) => {
    const { code, state: userId } = req.query; 
    
    try {
        const { tokens } = await oauth2Client.getToken(code);
        await User.findByIdAndUpdate(userId, { googleTokens: tokens });

        res.redirect('https://www.ialksng.me/projects/smartsphere/cloudhub/google?cloud=success');
        
    } catch (error) {
        console.error("OAuth Error:", error);
        const errMsg = encodeURIComponent(error.message || 'Unknown error');
        res.redirect(`https://www.ialksng.me/projects/smartsphere/cloudhub/google?cloud=error&msg=${errMsg}`);
    }
});

// 3. Fetch Files
router.get('/google/files', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user?.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const searchQuery = req.query.search || '';
        const targetFolderId = req.query.folderId || 'root';

        let query = `'${targetFolderId}' in parents and trashed = false`;

        if (searchQuery) {
            query = `name contains '${searchQuery}' and trashed = false`;
        }

        const response = await drive.files.list({
            pageSize: 1000,
            fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
            q: query,
            orderBy: 'folder, name'
        });

        res.json(response.data.files);

    } catch (error) {
        console.error("Fetch Files Error:", error);
        res.status(500).json({ message: "Failed to fetch files" });
    }
});

// 4. Import File → DocHub
router.post('/google/import', verifyToken, async (req, res) => {
    try {
        const { fileId, fileName, mimeType } = req.body;

        const user = await User.findById(req.user.id);
        if (!user?.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let fileBuffer;
        let finalMimeType = mimeType;

        // Get metadata
        const fileMeta = await drive.files.get({
            fileId,
            fields: 'webViewLink'
        });

        // Handle Google Docs
        if (mimeType === 'application/vnd.google-apps.document') {
            const response = await drive.files.export(
                { fileId, mimeType: 'text/plain' },
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
            finalMimeType = 'text/plain';
        } else {
            const response = await drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'arraybuffer' }
            );
            fileBuffer = Buffer.from(response.data);
        }

        // Extract text
        const extractedText = await extractTextFromBuffer(fileBuffer, finalMimeType);
        const cleanText = extractedText?.replace(/\s+/g, ' ').trim() || '';

        // Generate summary
        const summary = await analyzeText(
            `Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`,
            "You are a helpful document summarizer."
        );

        // Save to DB
        const newInsight = new Insight({
            userId: req.user.id,
            filename: fileName,
            fileType: finalMimeType,
            content: cleanText,
            summary,

            source: 'google_drive',
            driveFileId: fileId,

            contentType: finalMimeType.includes('pdf')
                ? 'pdf'
                : finalMimeType.includes('image')
                ? 'image'
                : 'text',

            fileUrl: fileMeta.data.webViewLink
        });

        await newInsight.save();

        console.log("✅ Saved to DocHub:", fileName);

        res.json({
            message: "Import successful",
            insight: newInsight
        });

    } catch (error) {
        console.error("Import Error:", error);
        res.status(500).json({ message: "Import failed" });
    }
});

// 🔥 5. GOOGLE DRIVE STORAGE (NEW)
router.get('/google/storage', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user?.googleTokens) {
            return res.status(401).json({ message: "Google Drive not connected." });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const response = await drive.about.get({
            fields: 'storageQuota'
        });

        const quota = response.data.storageQuota;

        // Convert safely (Google returns strings)
        const used = Number(quota.usage || 0);
        const total = Number(quota.limit || 0);

        res.json({
            used,
            total
        });

    } catch (error) {
        console.error("Storage Fetch Error:", error);
        res.status(500).json({ message: "Failed to fetch storage info" });
    }
});

module.exports = router;