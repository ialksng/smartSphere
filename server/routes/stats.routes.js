const express = require('express');
const router = express.Router();

const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');


// 📊 GET STATS (SaaS-level)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 📄 Total Docs
    const totalDocs = await Insight.countDocuments({ userId });

    // ⭐ Favorites
    const totalFavorites = await Insight.countDocuments({
      userId,
      isFavorite: true
    });

    // 🧠 AI Chats (using insights as proxy)
    const totalChats = await Insight.countDocuments({ userId });

    // 📊 File Type Breakdown
    const fileTypes = await Insight.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: "$fileType",
          count: { $sum: 1 }
        }
      }
    ]);

    // 💾 Storage Calculation (better)
    const docs = await Insight.find({ userId });

    const totalSizeBytes = docs.reduce((acc, doc) => {
      return acc + (doc.size || 0);
    }, 0);

    const storageMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

    res.json({
      docs: totalDocs,
      favorites: totalFavorites,
      chats: totalChats,
      storage: `${storageMB} MB`,
      fileTypes
    });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;