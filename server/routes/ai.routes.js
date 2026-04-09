const express = require('express');
const multer = require('multer');

const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');

// const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

/* =========================
   MULTER CONFIG
========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/* =========================
   1. CHAT (RAG ENABLED)
========================= */
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // 👉 Replace with req.user.id after auth
    const userId = '65f0a0b1c2d3e4f5a6b7c8d9';

    /* ===== FETCH CONTEXT ===== */
    const recentInsights = await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    let documentContext = "";

    if (recentInsights.length > 0) {
      documentContext += `\n--- KNOWLEDGE BASE CONTEXT ---\n`;

      for (const doc of recentInsights) {
        const safeContent = doc.content.substring(0, 8000); // safer limit

        documentContext += `
Document: ${doc.filename}
Summary: ${doc.summary || "No summary available"}

Content:
${safeContent}

`;
      }

      documentContext += `--- END CONTEXT ---\n\n`;
    }

    /* ===== HISTORY FORMAT ===== */
    const conversationHistory = history
      .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    /* ===== FINAL PROMPT ===== */
    const prompt = `
${documentContext}

Conversation:
${conversationHistory}

User: ${message}
AI:
`;

    /* ===== SYSTEM INSTRUCTION ===== */
    const systemInstruction = `
You are Smart Sphere, an advanced AI assistant with access to the user's private documents.

Rules:
1. Prefer answers from the provided context
2. If not found, use general knowledge
3. Keep answers concise and helpful
4. Mention document names if used
`;

    /* ===== AI CALL ===== */
    const reply = await analyzeText(prompt, systemInstruction);

    res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

/* =========================
   2. FILE UPLOAD (RAG INGESTION)
========================= */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { buffer, mimetype, originalname } = req.file;

    /* ===== TEXT EXTRACTION ===== */
    const extractedText = await extractTextFromBuffer(buffer, mimetype);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ message: "Could not extract text from file" });
    }

    /* ===== CLEAN TEXT ===== */
    const cleanText = extractedText.replace(/\s+/g, ' ').trim();

    /* ===== SUMMARY ===== */
    const summaryPrompt = `
Summarize the following document in 2 concise sentences:

${cleanText.substring(0, 3000)}
`;

    const summary = await analyzeText(
      summaryPrompt,
      "You are a precise document summarizer."
    );

    /* ===== SAVE TO DB ===== */
    const newInsight = new Insight({
      userId: '65f0a0b1c2d3e4f5a6b7c8d9', // replace later with req.user.id
      filename: originalname,
      fileType: mimetype,
      content: cleanText,
      summary: summary,
      source: 'local',
    });

    await newInsight.save();

    res.json({
      message: "File processed successfully",
      insightId: newInsight._id,
      filename: originalname,
      summary,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;