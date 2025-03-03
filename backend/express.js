import dotenv from 'dotenv';
dotenv.config();
// const express = require('express');
import express from 'express';
// const bodyParser = require('body-parser');
import bodyParser from 'body-parser';
// const cors = require('cors');
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = 5000;
const allowedOrigins = ['http://localhost:9006', 'https://vibe-match-ten.vercel.app'];

app.use(cors({
    origin: allowedOrigins,
    methods: 'GET',
    allowedHeaders: ['Content-Type', 'Authorization'],
})); // enable CORS
app.use(bodyParser.json()); // parse JSON bodies

// home route
app.get('/', (req, res) => {
    res.send('Welcome to the Vibe Match API. Use the /api/get-similar-vibes endpoint to get similar vibes.');
});
// API endpoint to get similar vibes
app.get('/api/get-similar-vibes', async (req, res) => {
    const { categoryActor, categoryActorName } = req.query;

    if (!categoryActor || !categoryActorName) {
        res.status(400).json({ error: "Missing required query parameters" });
        return;
    }
    const apikey = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(apikey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash"});

    try {
        const prompt = `If I like the ${categoryActor} ${categoryActorName}, give me a list of 20 similar ${categoryActor}s I might like without description - just the titles of the ${categoryActor}s only!`;
        const response = await model.generateContent(prompt);
        const responseText = response.response.candidates[0].content.parts[0].text; // Get the response text
        const list = responseText.match(/(\d+)\.\s+(.*?)(?=\n|$)/g); // Match numbered items
        const moviesArray = list ? list.map(item => item.replace(/^\d+\.\s+/, '')) : []; // Convert to array
        res.json({ data: moviesArray }); // send the array as JSON
    } catch (error) {
        // console.error("Error:", error);
        // res.status(500).json({ error: error.message });
        next(error);
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "An unexpected error occurred"});
})

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server listening on port ${PORT}`);
})
