const express = require('express');
const multer = require('multer');
const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


// 🔥 CHAT (RAG)
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        const recentInsights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(3);

        let context = "";

        recentInsights.forEach(doc => {
            context += `\nDocument: ${doc.filename}\n${doc.content.substring(0, 8000)}\n`;
        });

        const conversationHistory = history
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
            .join('\n');

        const prompt = `
Context:
${context}

Conversation:
${conversationHistory}

User: ${message}
AI:
        `;

        const reply = await analyzeText(
            prompt,
            "You are SmartSphere AI. Use context if helpful."
        );

        res.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 UPLOAD + AI TAGGING
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        const extractedText = await extractTextFromBuffer(
            req.file.buffer,
            req.file.mimetype
        );

        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        // 🧠 SUMMARY
        const summary = await analyzeText(
            `Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`,
            "You are a document summarizer."
        );

        // 🧠 TAG GENERATION (NEW)
        const tagPrompt = `
Extract 3-5 short tags from this document (comma separated):
${cleanText.substring(0, 2000)}
        `;

        const tagsRaw = await analyzeText(tagPrompt);
        const tags = tagsRaw
            .split(',')
            .map(t => t.trim().toLowerCase())
            .filter(Boolean);

        const newInsight = new Insight({
            userId: req.user.id,
            filename: req.file.originalname,
            fileType: req.file.mimetype,
            content: cleanText,
            summary,
            tags, // 🔥 NEW
            source: 'local'
        });

        await newInsight.save();

        res.json({
            message: "File uploaded successfully",
            doc: newInsight
        });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 RECENT ACTIVITY
router.get('/insights', verifyToken, async (req, res) => {
    try {
        const insights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(insights);

    } catch (error) {
        console.error("Insights Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;