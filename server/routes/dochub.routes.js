const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

        const query = {
            userId: req.user.id,
            parentId: parentId || null
        };

        const docs = await Insight.find(query).sort({ type: -1, createdAt: -1 });

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        const size = file.size;

        const totalSize = await Insight.aggregate([
            { $match: { userId: req.user.id } },
            { $group: { _id: null, total: { $sum: "$size" } } }
        ]);

        const used = totalSize[0]?.total || 0;

        if (used + size > 500 * 1024 * 1024) {
            return res.status(400).json({ message: "Storage limit exceeded (500MB)" });
        }

        const doc = await Insight.create({
            userId: req.user.id,
            filename: file.originalname,
            type: 'file',
            filePath: file.path,
            size,
            fileType: path.extname(file.originalname),
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
            parentId: parentId || null,
            content: ""
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

        const doc = await Insight.create({
            userId: req.user.id,
            filename,
            content: content || "",
            type: 'file',
            parentId: parentId || null,
            size
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

        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const content = req.body.content || "";
        const size = Buffer.byteLength(content, 'utf8');

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
        const doc = await Insight.findOne({ _id: req.params.id, userId: req.user.id });

        if (doc?.filePath && fs.existsSync(doc.filePath)) {
            fs.unlinkSync(doc.filePath);
        }

        await Insight.deleteMany({
            userId: req.user.id,
            $or: [
                { _id: req.params.id },
                { parentId: req.params.id }
            ]
        });

        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;