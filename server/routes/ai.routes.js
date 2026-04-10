const express = require('express');
const multer = require('multer');
const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Chat Endpoint with RAG Context Injection
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, history } = req.body;
        
        // Fetch context using the AUTHENTICATED user's ID
        const recentInsights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(2);

        let documentContext = "";
        if (recentInsights.length > 0) {
            documentContext = "\n\n--- KNOWLEDGE BASE CONTEXT ---\n";
            documentContext += "The user has uploaded the following documents. Use this information to answer their questions if relevant:\n\n";
            
            recentInsights.forEach((doc) => {
                const safeContent = doc.content.substring(0, 15000); 
                documentContext += `Document Name: ${doc.filename}\nContent:\n${safeContent}\n\n`;
            });
            documentContext += "--- END KNOWLEDGE BASE ---\n\n";
        }

        const conversationHistory = history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
        const prompt = `${documentContext}Conversation History:\n${conversationHistory}\n\nUser: ${message}\nAI:`;
        const systemInstruction = "You are Smart Sphere, an intelligent multimodal assistant. Answer the user's questions based on the provided Knowledge Base Context. If the answer is not in the context, use your general knowledge.";

        const reply = await analyzeText(prompt, systemInstruction);
        res.json({ reply });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 2. RAG Document Upload & Extraction
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        const prompt = `Please provide a concise 2-sentence summary of the following document:\n\n${cleanText.substring(0, 3000)}`; 
        const summary = await analyzeText(prompt, "You are a helpful document summarizer.");

        const newInsight = new Insight({
            userId: req.user.id,
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

// 3. Fetch User's Document Insights (NEW)
router.get('/insights', verifyToken, async (req, res) => {
    try {
        const insights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(10);
            
        res.json(insights);
    } catch (error) {
        console.error("Fetch Insights Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;