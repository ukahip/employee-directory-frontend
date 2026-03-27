// api/proxy.js — Save this file as api/proxy.js in your repo root
// Vercel Serverless Function — API Proxy with CORS & Error Handling

export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!apiBase) {
    console.error('❌ API_BASE_URL is not set');
    return res.status(500).json({ 
      error: 'API_BASE_URL not configured'
    });
  }

  // Strip /api prefix
  const path = req.url.replace(/^\/api/, '') || '/';
  const targetUrl = `${apiBase}${path}`;

  console.log(`📡 ${req.method} ${targetUrl}`);

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      timeout: 10000,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, options);
    const data = await apiRes.json();

    console.log(`✅ ${apiRes.status}`);
    res.status(apiRes.status).json(data);

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(502).json({
      error: 'API unreachable',
      message: err.message
    });
  }
}
