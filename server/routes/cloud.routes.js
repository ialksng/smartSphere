const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const User = require('../models/User');
const Insight = require('../models/Insight');
const Folder = require('../models/Folder'); // Added Folder model
const { verifyToken } = require('../middleware/auth.middleware');
const { extractTextFromBuffer } = require('../services/document.service');
const { analyzeText } = require('../services/ai.service');

const router = express.Router();

const MAX_STORAGE = 500 * 1024 * 1024;

const checkStorage = async (userId, newSize) => {
    const result = await Insight.aggregate([
        { $match: { userId, isTrashed: false } },
        {
            $group: {
                _id: null,
                total: { $sum: "$size" }
            }
        }
    ]);

    const used = result[0]?.total || 0;
    return used + newSize <= MAX_STORAGE;
};

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
    } catch {
        res.status(500).json({ message: 'Failed to fetch files' });
    }
});

router.post('/google/import', verifyToken, async (req, res) => {
    try {
        const { fileId, fileName, mimeType, folderId } = req.body;

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

        const size = Buffer.byteLength(cleanText, 'utf8');

        const allowed = await checkStorage(req.user.id, size);
        if (!allowed) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const summary = await analyzeText(
            `Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`,
            "You are a helpful document summarizer."
        );

        const newInsight = new Insight({
            userId: req.user.id,
            folderId: folderId || null, 
            filename: fileName,
            fileType: finalMimeType,
            content: cleanText,
            summary,
            size,
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

        res.json({ message: 'Import successful', insight: newInsight });
    } catch {
        res.status(500).json({ message: 'Import failed' });
    }
});

// CHANGED: Replaced /google/upload-dochub with /google/upload-local
// Now smartly handles exporting both single files and entire local folders
router.post('/google/upload-local', verifyToken, async (req, res) => {
    try {
        const { itemId, type } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user?.googleTokens) {
            return res.status(401).json({ message: 'Google Drive not connected' });
        }

        oauth2Client.setCredentials(user.googleTokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Helper function to sanitize MimeTypes
        const sanitizeMimeType = (mt) => {
            if (!mt || mt.startsWith('.') || !mt.includes('/')) {
                if (mt === '.pdf') return 'application/pdf';
                if (mt === '.md') return 'text/markdown';
                if (mt === '.docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                return 'text/plain'; // Fallback for .txt or undefined
            }
            return mt;
        };

        // EXPORT A SINGLE FILE
        if (type === 'file') {
            const file = await Insight.findById(itemId);
            
            if (!file || file.userId.toString() !== req.user.id) {
                return res.status(404).json({ message: 'File not found' });
            }

            // Fixed MIME type assignment
            const mimeType = sanitizeMimeType(file.fileType || file.mimeType);

            const response = await drive.files.create({
                requestBody: {
                    name: file.filename || file.name,
                    mimeType
                },
                media: {
                    mimeType,
                    body: file.content || ''
                }
            });

            await Insight.findByIdAndUpdate(itemId, {
                driveFileId: response.data.id,
                fileUrl: `https://drive.google.com/file/d/${response.data.id}/view`,
                source: 'google_drive'
            });

            return res.json({ message: 'File successfully uploaded to Google Drive', file: response.data });
        } 
        
        // EXPORT AN ENTIRE FOLDER
        if (type === 'folder') {
            const folder = await Folder.findById(itemId);
            
            if (!folder || folder.userId.toString() !== req.user.id) {
                return res.status(404).json({ message: 'Folder not found' });
            }

            // 1. Create the Folder directly inside Google Drive
            const driveFolder = await drive.files.create({
                requestBody: {
                    name: folder.name,
                    mimeType: 'application/vnd.google-apps.folder'
                },
                fields: 'id'
            });

            const driveFolderId = driveFolder.data.id;

            // 2. Fetch all local files stored inside this folder
            const files = await Insight.find({ userId: req.user.id, folderId: folder._id });

            // 3. Loop through and upload all files directly into the newly created Drive Folder
            for (const f of files) {
                // Fixed MIME type assignment
                const mimeType = sanitizeMimeType(f.fileType || f.mimeType);
                
                await drive.files.create({
                    requestBody: {
                        name: f.filename || f.name,
                        mimeType,
                        parents: [driveFolderId] // Connects the file to the Google Drive Folder
                    },
                    media: {
                        mimeType,
                        body: f.content || ''
                    }
                });
            }

            return res.json({ message: 'Folder and contents successfully exported to Google Drive', folderId: driveFolderId });
        }

        res.status(400).json({ message: 'Invalid export type specified.' });

    } catch (error) {
        console.error("Cloud Upload Error:", error);
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
    } catch {
        res.status(500).json({ message: 'Failed to fetch storage info' });
    }
});

module.exports = router;