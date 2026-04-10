const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

// GET all docs
router.get('/', verifyToken, async (req, res) => {
    const docs = await Insight.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
});

// GET single doc
router.get('/:id', verifyToken, async (req, res) => {
    const doc = await Insight.findById(req.params.id);
    res.json(doc);
});

// UPDATE doc (edit)
router.put('/:id', verifyToken, async (req, res) => {
    const { content } = req.body;

    const updated = await Insight.findByIdAndUpdate(
        req.params.id,
        { content },
        { new: true }
    );

    res.json(updated);
});

// DELETE doc
router.delete('/:id', verifyToken, async (req, res) => {
    await Insight.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

module.exports = router;