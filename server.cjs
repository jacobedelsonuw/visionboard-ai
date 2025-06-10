// Use node-fetch in a way compatible with both CJS and ESM
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express');
const cors = require('cors');
const config = require('./config.cjs');
const path = require('path');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Add response caching
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Replicate prompt enhancement endpoint
app.post('/api/replicate/enhance', async (req, res) => {
    try {
        const { prompt, temperature, top_p, max_tokens } = req.body;
        
        console.log('🎨 Enhancing prompt with Replicate:', prompt);
        
        // Create prediction
        const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${config.REPLICATE.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
                input: {
                    prompt,
                    temperature,
                    top_p,
                    max_tokens
                }
            })
        });

        if (!predictionResponse.ok) {
            const error = await predictionResponse.text();
            throw new Error(`Replicate API error: ${error}`);
        }

        const prediction = await predictionResponse.json();
        if (!prediction.id) {
            throw new Error('No prediction ID received from Replicate');
        }

        console.log('⏳ Waiting for Replicate prediction:', prediction.id);

        // Poll for the result
        let attempts = 0;
        const maxAttempts = 30;
        const interval = 1000; // 1 second

        while (attempts < maxAttempts) {
            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: {
                    'Authorization': `Token ${config.REPLICATE.API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!statusResponse.ok) {
                const error = await statusResponse.text();
                throw new Error(`Replicate API error: ${error}`);
            }

            const status = await statusResponse.json();
            
            if (status.status === 'succeeded' && status.output) {
                console.log('✅ Replicate prediction completed');
                return res.json({ enhancedPrompt: status.output.join(' ').trim() });
            } else if (status.status === 'failed') {
                throw new Error('Prediction failed');
            }

            console.log(`⏳ Still waiting for prediction (attempt ${attempts + 1}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
        }

        throw new Error('Prediction timed out');
    } catch (error) {
        console.error('❌ Error enhancing prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

// Replicate image generation proxy endpoint
app.post('/api/replicate/predictions', async (req, res) => {
    try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${config.REPLICATE.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Replicate proxy error (create):', error);
        res.status(500).json({ detail: 'Failed to create prediction' });
    }
});

// Replicate prediction polling endpoint
app.get('/api/replicate/predictions/:id', async (req, res) => {
    try {
        const predictionId = req.params.id;
        
        // Check cache first
        const cachedResponse = responseCache.get(predictionId);
        if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
            return res.json(cachedResponse.data);
        }

        const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: {
                'Authorization': `Token ${config.REPLICATE.API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        // Cache successful responses
        if (data.status === 'succeeded') {
            responseCache.set(predictionId, {
                data,
                timestamp: Date.now()
            });
        }
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Replicate proxy error (poll):', error);
        res.status(500).json({ detail: 'Failed to poll prediction' });
    }
});

// Picsum endpoint removed - no longer using Picsum as fallback

// Existing endpoints
app.get('/api/picsum', async (req, res) => {
    // ... existing code ...
});

app.post('/api/replicate/generate', async (req, res) => {
    // ... existing code ...
});

// Start server
app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
    console.log(`Mood Board is now available at http://localhost:${port}`);
}); 