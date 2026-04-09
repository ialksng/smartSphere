const express = require('express');
const multer = require('multer');
const { analyzeText } = require('../services/ai.service');
const router = express.Router();

// Memory storage for serverless-friendly file processing
const upload = multer({ storage: multer.memoryStorage() }); 

// 1. Chat Endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        // Format history for the AI
        const context = history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
        const prompt = `Context:\n${context}\n\nUser: ${message}\nAI:`;
        
        const reply = await analyzeText(prompt, "You are Smart Sphere, an intelligent multimodal assistant. Respond conversationally.");
        res.json({ reply });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. RAG Document Upload (Stubbed for now, using memory buffer)
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file provided" });
        
        // Next Session: We will pass req.file.buffer to a document.service.js
        // to extract text using pdf-parse or mammoth, then feed it to Insight model.
        
        res.json({ message: "File received. RAG processing coming soon.", filename: req.file.originalname });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;