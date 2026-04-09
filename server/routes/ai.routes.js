const express = require('express');
const multer = require('multer');

const { analyzeText } = require('../services/ai.service');
const { extractTextFromBuffer } = require('../services/document.service');
const Insight = require('../models/Insight');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

/* =========================
   MULTER CONFIG
========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/* =========================
   1. CHAT (SECURE + RAG)
========================= */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const userId = req.user.id;

    /* ===== FETCH USER DOCUMENTS ===== */
    const recentInsights = await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    let documentContext = "";

    if (recentInsights.length > 0) {
      documentContext += `\n--- KNOWLEDGE BASE CONTEXT ---\n`;

      for (const doc of recentInsights) {
        const safeContent = doc.content.substring(0, 6000);

        documentContext += `
Document: ${doc.filename}
Summary: ${doc.summary || "No summary available"}

Content:
${safeContent}

`;
      }

      documentContext += `--- END CONTEXT ---\n\n`;
    }

    /* ===== FORMAT HISTORY ===== */
    const conversationHistory = history
      .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    /* ===== PROMPT ===== */
    const prompt = `
${documentContext}

Conversation:
${conversationHistory}

User: ${message}
AI:
`;

    /* ===== SYSTEM PROMPT ===== */
    const systemInstruction = `
You are Smart Sphere, an AI assistant with access to user documents.

Rules:
1. Prefer knowledge base context
2. If not found, use general knowledge
3. Be concise and accurate
4. Mention document name if used
5. Do not hallucinate missing info
`;

    /* ===== AI CALL ===== */
    const reply = await analyzeText(prompt, systemInstruction);

    res.json({ reply });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ message: "Chat failed", error: error.message });
  }
});

/* =========================
   2. UPLOAD (SECURE RAG INGESTION)
========================= */
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { buffer, mimetype, originalname } = req.file;

    /* ===== EXTRACT TEXT ===== */
    const extractedText = await extractTextFromBuffer(buffer, mimetype);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ message: "Text extraction failed" });
    }

    /* ===== CLEAN TEXT ===== */
    const cleanText = extractedText.replace(/\s+/g, ' ').trim();

    /* ===== SUMMARY ===== */
    const summaryPrompt = `
Summarize this document in 2 concise sentences:

${cleanText.substring(0, 3000)}
`;

    const summary = await analyzeText(
      summaryPrompt,
      "You are a precise summarizer."
    );

    /* ===== SAVE ===== */
    const newInsight = new Insight({
      userId,
      filename: originalname,
      fileType: mimetype,
      content: cleanText,
      summary,
      source: 'local',
    });

    await newInsight.save();

    res.json({
      message: "File uploaded & processed",
      insightId: newInsight._id,
      filename: originalname,
      summary,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

module.exports = router;