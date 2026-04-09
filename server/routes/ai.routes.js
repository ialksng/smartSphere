const express = require('express');
const multer = require('multer');
const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');
// Assuming you have an auth middleware to get req.user.id
// const { verifyToken } = require('../middleware/auth.middleware'); 

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ... existing /chat route remains here ...

// 2. RAG Document Upload & Extraction
router.post('/upload', /* verifyToken, */ upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // 1. Extract Text
        const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        
        // Clean up text (remove excessive whitespace)
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        // 2. Generate a quick summary using your AI service
        const prompt = `Please provide a concise 2-sentence summary of the following document:\n\n${cleanText.substring(0, 3000)}`; // limit chars to save tokens on summary
        const summary = await analyzeText(prompt, "You are a helpful document summarizer.");

        // 3. Save to Database
        // NOTE: Replace 'dummy-user-id' with req.user.id once auth middleware is attached
        const newInsight = new Insight({
            userId: '65f0a0b1c2d3e4f5a6b7c8d9', // Placeholder
            filename: req.file.originalname,
            fileType: req.file.mimetype,
            content: cleanText,
            summary: summary,
            source: 'local'
        });

        await newInsight.save();

        res.json({ 
            message: "File processed successfully.", 
            insightId: newInsight._id,
            summary: summary,
            filename: req.file.originalname 
        });

    } catch (error) {
        console.error("Upload Route Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;