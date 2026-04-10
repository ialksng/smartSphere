const express = require('express');
const router = express.Router();
const Folder = require('../models/Folder');
const { verifyToken } = require('../middleware/auth.middleware');

// CREATE
router.post('/', verifyToken, async (req, res) => {
  const folder = new Folder({
    userId: req.user.id,
    name: req.body.name,
    parent: req.body.parent || null
  });

  await folder.save();
  res.json(folder);
});

// GET ALL
router.get('/', verifyToken, async (req, res) => {
  const folders = await Folder.find({ userId: req.user.id });
  res.json(folders);
});

module.exports = router;