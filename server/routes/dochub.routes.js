const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, folder, favorite } = req.query;

        let query = { userId: req.user.id };

        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        if (folder) {
            query.folder = folder;
        }

        if (favorite === 'true') {
            query.isFavorite = true;
        }

        const docs = await Insight.find(query).sort({ createdAt: -1 });

        const totalSize = docs.reduce((acc, doc) => {
            return acc + Buffer.byteLength(doc.content || '', 'utf8');
        }, 0);

        res.json({
            docs,
            totalSize,
            remaining: 500 * 1024 * 1024 - totalSize
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { filename, content, folder, source } = req.body;

        const docs = await Insight.find({ userId: req.user.id });

        const currentSize = docs.reduce((acc, doc) => {
            return acc + Buffer.byteLength(doc.content || '', 'utf8');
        }, 0);

        const newSize = Buffer.byteLength(content || '', 'utf8');

        if (currentSize + newSize > 500 * 1024 * 1024) {
            return res.status(400).json({ message: 'Storage limit exceeded' });
        }

        const doc = await Insight.create({
            userId: req.user.id,
            filename,
            content,
            folder,
            source: source || 'local'
        });

        res.json(doc);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json(doc);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { content, folder } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { content, folder },
            { new: true }
        );

        res.json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/favorite', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        doc.isFavorite = !doc.isFavorite;
        await doc.save();

        res.json(doc);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch('/:id/tags', verifyToken, async (req, res) => {
    try {
        const { tags } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { tags },
            { new: true }
        );

        res.json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Insight.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        res.json({ message: 'Deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;