const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');


// 🔥 GET ALL DOCS + SEARCH
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search } = req.query;

        let query = { userId: req.user.id };

        // 🔍 Search support
        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const docs = await Insight.find(query)
            .sort({ createdAt: -1 });

        res.json(docs);

    } catch (error) {
        console.error("Fetch Docs Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 GET SINGLE DOC
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        res.json(doc);

    } catch (error) {
        console.error("Get Doc Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 UPDATE DOC
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;

        const updated = await Insight.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { content },
            { new: true }
        );

        res.json(updated);

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 DELETE DOC
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await Insight.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        res.json({ message: "Deleted successfully" });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;