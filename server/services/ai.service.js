import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const callGroqFallback = async (prompt) => {
    console.log("⚠️ Falling back to Groq API...");
    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
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
        const groqError = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error("❌ Groq API also failed:", groqError);
        throw new Error(`AI APIs failed. Gemini and Groq both rejected the request. Check server logs.`);
    }
};

export const analyzeText = async (text, task = "summarize") => {
    const prompt = `Task: ${task}. \n\nAnalyze the following text and provide key insights, topics, and a brief summary.\n\nText: ${text}`;

    try {
        console.log("🤖 Attempting to use Gemini for analysis...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("❌ Gemini API failed:", error.message);
        return await callGroqFallback(prompt);
    }
};

export const chatWithAI = async (prompt) => {
    try {
        console.log("🤖 Attempting to use Gemini for chat...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("❌ Gemini API chat failed:", error.message);
        return await callGroqFallback(prompt);
    }
};