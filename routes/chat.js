const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // For text-only input, use the gemini-1.5-flash model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

        const prompt = `
            You are "JanMitra", a helpful AI assistant for a local community civic issue reporting platform.
            Your goal is to help citizens report issues like potholes, garbage, and streetlights.
            Keep answers short, friendly, and helpful.
            
            User: ${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

module.exports = router;