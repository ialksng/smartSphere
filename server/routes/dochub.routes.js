const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');


// 🔥 GET ALL DOCS + SEARCH + FILTERS
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, folder, favorite } = req.query;

        let query = { userId: req.user.id };

        // 🔍 SEARCH
        if (search) {
            query.$or = [
                { filename: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // 📁 FILTER BY FOLDER
        if (folder) {
            query.folder = folder;
        }

        // ⭐ FILTER FAVORITES
        if (favorite === 'true') {
            query.isFavorite = true;
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


// 🔥 UPDATE DOC (CONTENT + FOLDER)
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
        console.error("Update Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// ⭐ TOGGLE FAVORITE
router.patch('/:id/favorite', verifyToken, async (req, res) => {
    try {
        const doc = await Insight.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        doc.isFavorite = !doc.isFavorite;
        await doc.save();

        res.json(doc);

    } catch (error) {
        console.error("Favorite Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🏷 ADD / UPDATE TAGS
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
        console.error("Tags Error:", error);
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