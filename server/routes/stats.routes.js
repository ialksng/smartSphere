const express = require('express');
const router = express.Router();

const Doc = require('../models/Doc'); // or your document model
const Insight = require('../models/Insight'); // for AI chats (if using)

router.get('/', async (req, res) => {
  try {
    const totalDocs = await Doc.countDocuments();
    const totalChats = await Insight.countDocuments();

    // Simple storage calc (you can improve later)
    const storage = `${(totalDocs * 0.5).toFixed(1)} MB`;

    res.json({
      docs: totalDocs,
      chats: totalChats,
      storage
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;