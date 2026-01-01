import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Proxy endpoint for creating predictions with official models
// POST /api/models/{owner}/{model}/predictions
app.post('/api/models/:owner/:model/predictions', async (req, res) => {
    const authHeader = req.headers.authorization;
    const { owner, model } = req.params;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const url = `https://api.replicate.com/v1/models/${owner}/${model}/predictions`;
        console.log('Proxying to:', url);
        console.log('Body:', JSON.stringify(req.body));

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for legacy predictions (with version)
app.post('/api/predictions', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for checking prediction status
app.get('/api/predictions/:id', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${req.params.id}`, {
            headers: {
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for account info
app.get('/api/account', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const response = await fetch('https://api.replicate.com/v1/account', {
            headers: {
                'Authorization': authHeader
            }
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running at http://localhost:${PORT}`);
    console.log(`📡 Proxying requests to Replicate API`);
});
