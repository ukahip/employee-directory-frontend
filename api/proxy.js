// api/proxy.js
// Simple API proxy for Vercel — NO rewrites needed in vercel.json

export default async function handler(req, res) {
  // Allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiBase = process.env.API_BASE_URL;
  
  if (!apiBase) {
    return res.status(500).json({ error: 'API_BASE_URL not set' });
  }

  // Get the endpoint from query string
  // Frontend calls: /api/proxy?endpoint=/employees
  const endpoint = req.query.endpoint || '/employees';
  const targetUrl = `${apiBase}${endpoint}`;

  try {
    const opts = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (req.body && req.method !== 'GET') {
      opts.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, opts);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(502).json({ error: 'Failed to reach backend', detail: error.message });
  }
}
