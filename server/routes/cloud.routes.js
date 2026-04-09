const express = require('express');
const router = express.Router();

// Future OAuth endpoints
router.get('/google/auth', (req, res) => res.json({ message: "G-Drive Auth Route" }));
router.get('/google/callback', (req, res) => res.json({ message: "G-Drive Callback" }));

router.get('/onedrive/auth', (req, res) => res.json({ message: "OneDrive Auth Route" }));
router.get('/onedrive/callback', (req, res) => res.json({ message: "OneDrive Callback" }));

module.exports = router;