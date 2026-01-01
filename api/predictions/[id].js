// Vercel Serverless Function - Get Prediction Status
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    const { id } = req.query;

    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    if (!id) {
        return res.status(400).json({ error: 'Prediction ID required' });
    }

    try {
        const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
            headers: {
                'Authorization': authHeader
            }
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: error.message });
    }
}
