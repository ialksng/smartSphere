const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, async (req, res) => {
    const { parentId } = req.query;

    const query = {
        userId: req.user.id,
        parentId: parentId || null
    };

    const docs = await Insight.find(query).sort({ type: -1, createdAt: -1 });

    res.json(docs);
});

router.post('/folder', verifyToken, async (req, res) => {
    const { name, parentId } = req.body;

    const folder = await Insight.create({
        userId: req.user.id,
        filename: name,
        type: 'folder',
        parentId: parentId || null
    });

    res.json(folder);
});

router.post('/file', verifyToken, async (req, res) => {
    const { filename, content, parentId } = req.body;

    const doc = await Insight.create({
        userId: req.user.id,
        filename,
        content,
        type: 'file',
        parentId: parentId || null
    });

    res.json(doc);
});

router.get('/:id', verifyToken, async (req, res) => {
    const doc = await Insight.findOne({
        _id: req.params.id,
        userId: req.user.id
    });

    res.json(doc);
});

router.put('/:id', verifyToken, async (req, res) => {
    const updated = await Insight.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { content: req.body.content },
        { new: true }
    );

    res.json(updated);
});

router.delete('/:id', verifyToken, async (req, res) => {
    await Insight.deleteMany({
        $or: [
            { _id: req.params.id },
            { parentId: req.params.id }
        ],
        userId: req.user.id
    });

    res.json({ message: 'Deleted' });
});

module.exports = router;