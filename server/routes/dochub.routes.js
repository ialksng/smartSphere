const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
const axios = require('axios');

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

router.get('/', verifyToken, async (req, res) => {
    try {
        const { parentId } = req.query;

        const docs = await Insight.find({
            userId: req.user.id,
            parentId: parentId || null,
            isTrashed: false
        }).sort({ type: -1, createdAt: -1 });

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/search', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.json([]);
        }

        const user = await User.findById(req.user.id);
        let results = [];

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
        .limit(10);

        results = [...localDocs.map(d => ({
            _id: d._id,
            filename: d.filename,
            source: d.source || 'local',
            summary: d.summary,
            mimeType: d.mimeType,
            isExternal: false
        }))];

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
                    q: `name contains '${q}' and trashed = false`,
                    fields: 'files(id, name, mimeType)',
                    pageSize: 5
                });
                
                const gFiles = gRes.data.files.map(f => ({
                    _id: f.id,
                    filename: f.name,
                    source: 'google_drive_live',
                    mimeType: f.mimeType,
                    isExternal: true
                }));
                results = [...results, ...gFiles];
            } catch(e) {
                console.error("Google Drive live search error", e.message);
            }
        }

        if (user?.microsoftTokens?.access_token) {
            try {
                const msRes = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/root/search(q='${q}')`, {
                    headers: { Authorization: `Bearer ${user.microsoftTokens.access_token}` },
                    params: { $top: 5 }
                });
                
                const msFiles = msRes.data.value.map(f => ({
                    _id: f.id,
                    filename: f.name,
                    source: 'onedrive_live',
                    mimeType: f.file?.mimeType || 'unknown',
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

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const size = file.size;

        const allowed = await checkStorage(req.user.id, size);

        if (!allowed) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const mimeType = file.mimetype;

        const doc = await Insight.create({
            userId: req.user.id,
            filename: file.originalname,
            type: 'file',
            filePath: file.path,
            size,
            fileType: path.extname(file.originalname),
            mimeType,
            contentType: getContentType(mimeType),
            source: 'local'
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/folder', verifyToken, async (req, res) => {
    try {
        const { name, parentId } = req.body;

        const folder = await Insight.create({
            userId: req.user.id,
            filename: name,
            type: 'folder',
            parentId: parentId || null
        });

        res.json(folder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/file', verifyToken, async (req, res) => {
    try {
        const { filename, content, parentId } = req.body;

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
            parentId: parentId || null,
            size,
            contentType: 'text'
        });

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const content = req.body.content || "";
        const size = Buffer.byteLength(content, 'utf8');

        const allowed = await checkStorage(req.user.id, size);

        if (!allowed) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { content, size },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/rename', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { filename: name },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/:id/move', verifyToken, async (req, res) => {
    try {
        const { parentId } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { parentId: parentId || null },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Insight.updateMany(
            {
                userId: req.user.id,
                $or: [
                    { _id: req.params.id },
                    { parentId: req.params.id }
                ]
            },
            { isTrashed: true }
        );

        res.json({ message: 'Moved to trash' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;