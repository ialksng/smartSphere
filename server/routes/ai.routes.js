const express = require('express');
const multer = require('multer');
const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


// 🔥 1. CHAT (RAG)
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        const recentInsights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(2);

        let documentContext = "";

        if (recentInsights.length > 0) {
            documentContext += "\n\n--- KNOWLEDGE BASE CONTEXT ---\n";

            recentInsights.forEach((doc) => {
                const safeContent = doc.content.substring(0, 15000);
                documentContext += `Document: ${doc.filename}\n${safeContent}\n\n`;
            });

            documentContext += "--- END CONTEXT ---\n\n";
        }

        const conversationHistory = history
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`)
            .join('\n');

        const prompt = `
${documentContext}
Conversation:
${conversationHistory}

User: ${message}
AI:
        `;

        const reply = await analyzeText(
            prompt,
            "You are SmartSphere AI. Use provided context if relevant, otherwise answer normally."
        );

        res.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
});


// 🔥 2. UPLOAD
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

        const summary = await analyzeText(
            `Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`,
            "You are a document summarizer."
        );

        const newInsight = new Insight({
            userId: req.user.id,
            filename: req.file.originalname,
            fileType: req.file.mimetype,
            content: cleanText,
            summary,
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


// 🔥 3. RECENT INSIGHTS (for dashboard/activity)
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