const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Groq Fallback Function
const callGroqFallback = async (prompt) => {
    console.log("⚠️ Falling back to Groq API...");
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "mixtral-8x7b-32768",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        throw new Error("Both Gemini and Groq APIs failed.");
    }
};

// Main Analysis Function
const analyzeText = async (text, task = "summarize") => {
    const prompt = `Task: ${task}. \n\nAnalyze the following text and provide key insights, topics, and a brief summary.\n\nText: ${text}`;

    try {
        console.log("🤖 Attempting to use Gemini...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("❌ Gemini API failed:", error.message);
        // Trigger Fallback
        return await callGroqFallback(prompt);
    }
};

module.exports = { analyzeText };