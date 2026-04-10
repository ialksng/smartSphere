const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const axios = require('axios');

const Insight = require('../models/Insight');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
const MAX_STORAGE = 500 * 1024 * 1024;

const getUsedStorage = async (userId) => {
    const result = await Insight.aggregate([
        { $match: { userId, isTrashed: false } },
        {
            $group: {
                _id: null,
                total: { $sum: "$size" }
            }
        }
    ]);
    return result[0]?.total || 0;
};

const checkStorage = async (userId, newSize) => {
    const used = await getUsedStorage(userId);
    return used + newSize <= MAX_STORAGE;
};

const getContentType = (mime) => {
    if (!mime) return 'text';
    if (mime.includes('pdf')) return 'pdf';
    if (mime.includes('image')) return 'image';
    return 'text';
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// GET ALL FILES
router.get('/', verifyToken, async (req, res) => {
    try {
        const { folderId, isTrashed, isFavorite, all } = req.query;

        let query = { userId: req.user.id };

        // Handle Trashed filter
        if (isTrashed === 'true') {
            query.isTrashed = true;
        } else {
            query.isTrashed = false;
        }

        // Handle Favorite filter
        if (isFavorite === 'true') {
            query.isFavorite = true;
        }

        // If 'all' is true, bypass folderId completely to get a flat list
        if (all !== 'true' && folderId !== undefined) {
            query.folderId = folderId || null;
        }

        // 1. Fetch Local Files
        const localDocs = await Insight.find(query).sort({ type: -1, createdAt: -1 });
        let results = [...localDocs.map(d => ({
            ...d.toObject(),
            source: d.source || 'local'
        }))];

        // 2. Fetch Cloud Files if 'all' is requested
        if (all === 'true') {
            const user = await User.findById(req.user.id);
            
            // --- Fetch from Google Drive ---
            if (user?.googleTokens) {
                try {
                    const oauth2Client = new google.auth.OAuth2(
                        process.env.GOOGLE_CLIENT_ID,
                        process.env.GOOGLE_CLIENT_SECRET,
                        process.env.GOOGLE_REDIRECT_URI
                    );
                    oauth2Client.setCredentials(user.googleTokens);
                    const drive = google.drive({ version: 'v3', auth: oauth2Client });
                    
                    let driveQuery = isTrashed === 'true' ? 'trashed = true' : 'trashed = false';
                    if (isFavorite === 'true') driveQuery += ' and starred = true';

                    const gRes = await drive.files.list({
                        q: driveQuery,
                        fields: 'files(id, name, mimeType, size, starred)',
                        pageSize: 50
                    });
                    
                    const gFiles = gRes.data.files.map(f => ({
                        _id: f.id,
                        filename: f.name,
                        source: 'google_drive',
                        mimeType: f.mimeType,
                        size: parseInt(f.size) || 0,
                        isFavorite: f.starred || false,
                        isExternal: true
                    }));
                    results = [...results, ...gFiles];
                } catch(e) {
                    console.error("Google Drive list error", e.message);
                }
            }

            // --- Fetch from OneDrive ---
            if (user?.microsoftTokens?.access_token && isTrashed !== 'true' && isFavorite !== 'true') {
                try {
                    const msRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root/children`, {
                        headers: { Authorization: `Bearer ${user.microsoftTokens.access_token}` },
                        params: { $top: 50 }
                    });
                    
                    const msFiles = msRes.data.value.map(f => ({
                        _id: f.id,
                        filename: f.name,
                        source: 'onedrive',
                        mimeType: f.file?.mimeType || 'unknown',
                        size: f.size || 0,
                        isFavorite: false,
                        isExternal: true
                    }));
                    results = [...results, ...msFiles];
                } catch(e) {
                    console.error("OneDrive list error", e.message);
                }
            }
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// SEARCH FILES
router.get('/search', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.json([]);
        }

        const user = await User.findById(req.user.id);
        let results = [];

        // 1. Search Local
        const localDocs = await Insight.find({
            userId: req.user.id,
            isTrashed: false,
            $or: [
                { filename: { $regex: q, $options: 'i' } },
                { content: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(50); // Increased from 10 to 50

        results = [...localDocs.map(d => ({
            _id: d._id,
            filename: d.filename,
            source: d.source || 'local',
            summary: d.summary,
            mimeType: d.mimeType,
            isExternal: false
        }))];

        // 2. Search Google Drive
        if (user?.googleTokens) {
            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
                oauth2Client.setCredentials(user.googleTokens);
                const drive = google.drive({ version: 'v3', auth: oauth2Client });
                
                const gRes = await drive.files.list({
                    // Ignored folders so it only pulls actual files
                    q: `name contains '${q}' and trashed = false and mimeType != 'application/vnd.google-apps.folder'`,
                    fields: 'files(id, name, mimeType, size)',
                    pageSize: 50 // Increased from 5 to 50
                });
                
                const gFiles = gRes.data.files.map(f => ({
                    _id: f.id,
                    filename: f.name,
                    source: 'google_drive_live',
                    mimeType: f.mimeType,
                    size: parseInt(f.size) || 0,
                    isExternal: true
                }));
                results = [...results, ...gFiles];
            } catch(e) {
                console.error("Google Drive live search error", e.message);
            }
        }

        // 3. Search OneDrive
        if (user?.microsoftTokens?.access_token) {
            try {
                const msRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root/search(q='${q}')`, {
                    headers: { Authorization: `Bearer ${user.microsoftTokens.access_token}` },
                    params: { $top: 50 } // Increased from 5 to 50
                });
                
                const msFiles = msRes.data.value.map(f => ({
                    _id: f.id,
                    filename: f.name,
                    source: 'onedrive_live',
                    mimeType: f.file?.mimeType || 'unknown',
                    size: f.size || 0,
                    isExternal: true
                }));
                results = [...results, ...msFiles];
            } catch(e) {
                console.error("OneDrive live search error", e.message);
            }
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DOWNLOAD FILE
router.get('/download/:id', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (doc.filePath && fs.existsSync(doc.filePath)) {
            return res.download(doc.filePath, doc.filename);
        } 
        
        if (doc.content !== undefined) {
            res.setHeader('Content-disposition', 'attachment; filename=' + (doc.filename || 'document.txt'));
            res.setHeader('Content-type', doc.mimeType || 'text/plain');
            return res.send(doc.content);
        }

        res.status(404).json({ message: 'File content not found on server' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPLOAD FILE
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const size = file.size;

        const allowed = await checkStorage(req.user.id, size);

        if (!allowed) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const mimeType = file.mimetype;
        const folderId = req.body.folderId; 

        const doc = await Insight.create({
            userId: req.user.id,
            filename: file.originalname,
            type: 'file',
            filePath: file.path,
            size,
            fileType: path.extname(file.originalname),
            mimeType,
            contentType: getContentType(mimeType),
            source: 'local',
            folderId: folderId || null
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE EMPTY FILE
router.post('/file', verifyToken, async (req, res) => {
    try {
        const { filename, content, folderId } = req.body;

        const size = Buffer.byteLength(content || '', 'utf8');
        const allowed = await checkStorage(req.user.id, size);

        if (!allowed) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const doc = await Insight.create({
            userId: req.user.id,
            filename,
            content: content || "",
            type: 'file',
            folderId: folderId || null,
            size,
            contentType: 'text'
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET SINGLE FILE
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: 'Not found' });
        }

        await Insight.findByIdAndUpdate(req.params.id, {
            lastOpened: new Date()
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE/RENAME FILE
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { content, name, isFavorite, isTrashed } = req.body;
        let updateData = {};

        // Handle rename
        if (name) updateData.filename = name;

        // Handle Favorites and Trash toggles
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
        if (isTrashed !== undefined) updateData.isTrashed = isTrashed;

        // Handle content update
        if (content !== undefined) {
            const size = Buffer.byteLength(content, 'utf8');
            const allowed = await checkStorage(req.user.id, size);

            if (!allowed) {
                return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
            }
            updateData.content = content;
            updateData.size = size;
        }

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            updateData,
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MOVE FILE
router.patch('/:id/move', verifyToken, async (req, res) => {
    try {
        const { folderId } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { folderId: folderId || null },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MOVE TO TRASH
router.put('/:id/trash', verifyToken, async (req, res) => {
    try {
        await Insight.updateMany(
            {
                userId: req.user.id,
                $or: [
                    { _id: req.params.id },
                    { folderId: req.params.id }
                ]
            },
            { isTrashed: true }
        );

        res.json({ message: 'Moved to trash' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PERMANENT DELETE
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Insight.deleteMany({
            userId: req.user.id,
            $or: [
                { _id: req.params.id },
                { folderId: req.params.id }
            ]
        });

        res.json({ message: 'Deleted permanently' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;