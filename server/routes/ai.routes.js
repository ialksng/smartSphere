import express from 'express';
import multer from 'multer';
import { analyzeText, chatWithAI } from '../services/ai.service.js';
import { extractTextFromBuffer } from '../services/document.service.js';
import Insight from '../models/Insight.js';
import Message from '../models/Message.js'; // Import the new model
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 🧠 GET CHAT HISTORY
router.get('/chat/history', verifyToken, async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.user.id }).sort({ createdAt: 1 });
        const formatted = messages.map(msg => ({
            role: msg.role,
            text: msg.text,
            type: msg.type,
            isSystem: msg.isSystem
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 🧠 CHAT WITH MEMORY & RAG
router.post('/chat', verifyToken, async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // 1. Save User's Message to DB
        await Message.create({ userId: req.user.id, role: 'user', text: message });

        // 2. Fetch Context (Recent Uploaded Docs)
        const recentInsights = await Insight.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(4);

        let context = recentInsights.length > 0 
            ? recentInsights.map(doc => `File: ${doc.filename}\nContent:\n${doc.content.substring(0, 3500)}`).join('\n\n')
            : "No documents available.";

        // 3. Format Previous History (Excluding the very last message which is the current query)
        const previousHistory = history
            .slice(0, -1)
            .map(m => `${m.role === 'user' ? 'User' : 'BuddyBot'}: ${m.text}`)
            .join('\n');

        const currentQuery = message || history[history.length - 1]?.text;

        // 4. Strict Prompt Architecture
        const prompt = `
You are BuddyBot, an AI assistant for SmartSphere. You have a persistent memory of the chat and access to the user's recent documents.

--- PAST CONVERSATION HISTORY ---
${previousHistory || "No previous conversation."}

--- RECENT DOCUMENTS CONTEXT ---
${context}

--- INSTRUCTIONS ---
1. Read the "CURRENT USER QUERY".
2. If the user refers to past conversation, use the "PAST CONVERSATION HISTORY".
3. If the user asks about a file/document, use the "RECENT DOCUMENTS CONTEXT".
4. Provide a direct, helpful, and concise response. Do not repeat the prompt.

--- CURRENT USER QUERY ---
User: ${currentQuery}
BuddyBot Response:`;

        const reply = await chatWithAI(prompt);

        // 5. Save AI's Reply to DB
        await Message.create({ userId: req.user.id, role: 'ai', text: reply });

        res.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 🧠 UPLOAD + AI TAGGING (Updated to save to chat history)
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file provided" });

        const extractedText = await extractTextFromBuffer(req.file.buffer, req.file.mimetype);
        const cleanText = extractedText.replace(/\s+/g, ' ').trim();

        const summary = await analyzeText(`Summarize in 2 sentences:\n\n${cleanText.substring(0, 3000)}`);
        
        const tagsRaw = await analyzeText(`Extract 3-5 short tags from this document (comma separated):\n${cleanText.substring(0, 2000)}`);
        const tags = tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

        const newInsight = new Insight({
            userId: req.user.id,
            filename: req.file.originalname,
            fileType: req.file.mimetype,
            content: cleanText,
            summary,
            tags,
            source: 'local'
        });
        await newInsight.save();

        // Save AI acknowledgment to chat history
        const aiResponseText = `I've successfully read **${req.file.originalname}**. Here is a quick summary:\n\n${summary}\n\nYou can now ask me follow-up questions about this document.`;
        await Message.create({ userId: req.user.id, role: 'ai', text: aiResponseText });

        res.json({ message: "File uploaded successfully", doc: newInsight, summary });

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: error.message });
    }
});

// 🧠 RECENT ACTIVITY
router.get('/insights', verifyToken, async (req, res) => {
    try {
        const insights = await Insight.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(10);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;