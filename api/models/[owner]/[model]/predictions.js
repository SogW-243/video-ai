// Vercel Serverless Function - Models Predictions
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    const { owner, model } = req.query;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const url = `https://api.replicate.com/v1/models/${owner}/${model}/predictions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
