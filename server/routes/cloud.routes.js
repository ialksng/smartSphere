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

router.get('/google/auth', (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ message: 'User ID required' });
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/drive'],
        state: userId
    });

    res.json({ url: authUrl });
});

router.get('/google/callback', async (req, res) => {
    const { code, state: userId } = req.query;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        await User.findByIdAndUpdate(userId, { googleTokens: tokens });

        res.redirect('https://www.ialksng.me/projects/smartsphere/cloudhub/google?cloud=success');
    } catch (error) {
        const errMsg = encodeURIComponent(error.message || 'Unknown error');
        res.redirect(`https://www.ialksng.me/projects/smartsphere/cloudhub/google?cloud=error&msg=${errMsg}`);
    }
});

router.get('/google/files', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user?.googleTokens) {
            return res.status(401).json({ message: 'Google Drive not connected' });
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
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

router.post('/google/import', verifyToken, async (req, res) => {
    try {
        const { fileId, fileName, mimeType } = req.body;

        const user = await User.findById(req.user.id);

        if (!user?.googleTokens) {
            return res.status(401).json({ message: 'Google Drive not connected' });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        let fileBuffer;
        let finalMimeType = mimeType;

        const fileMeta = await drive.files.get({
            fileId,
            fields: 'webViewLink'
        });

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

        const extractedText = await extractTextFromBuffer(fileBuffer, finalMimeType);
        const cleanText = extractedText?.replace(/\s+/g, ' ').trim() || '';

        const summary = await analyzeText(
            `Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`,
            "You are a helpful document summarizer."
        );

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

        res.json({
            message: 'Import successful',
            insight: newInsight
        });
    } catch (error) {
        res.status(500).json({ message: 'Import failed' });
    }
});

router.post('/google/upload-dochub', verifyToken, async (req, res) => {
    try {
        const { fileId } = req.body;

        if (!fileId) {
            return res.status(400).json({ message: 'File ID is required' });
        }

        const file = await Insight.findById(fileId);

        if (!file || file.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: 'File not found' });
        }

        const user = await User.findById(req.user.id);

        if (!user?.googleTokens) {
            return res.status(401).json({ message: 'Google Drive not connected' });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const response = await drive.files.create({
            requestBody: {
                name: file.filename,
                mimeType: 'text/plain'
            },
            media: {
                mimeType: 'text/plain',
                body: file.content || ''
            }
        });

        await Insight.findByIdAndUpdate(fileId, {
            driveFileId: response.data.id,
            fileUrl: `https://drive.google.com/file/d/${response.data.id}/view`,
            source: 'google_drive'
        });

        res.json({
            message: 'Upload successful',
            file: response.data
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed' });
    }
});

router.get('/google/storage', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user?.googleTokens) {
            return res.status(401).json({ message: 'Google Drive not connected' });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const response = await drive.about.get({
            fields: 'storageQuota'
        });

        const used = Number(response.data.storageQuota.usage || 0);
        const total = Number(response.data.storageQuota.limit || 0);

        res.json({ used, total });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch storage info' });
    }
});

module.exports = router;