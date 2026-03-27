// Vercel Serverless Function — API Proxy with CORS & Error Handling
// Reads API_BASE_URL from Vercel environment variables (server-side only).
// The ALB URL is NEVER sent to the browser — safe for public repos.

export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;

  // Set CORS headers to allow requests from your frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!apiBase) {
    console.error('❌ API_BASE_URL is not set in Vercel environment variables');
    return res.status(500).json({ 
      error: 'Configuration Error',
      message: 'API_BASE_URL environment variable is not set in Vercel.'
    });
  }

  // Strip /api prefix → get the real path e.g. /api/employees → /employees
  const path = req.url.replace(/^\/api/, '') || '/';
  const targetUrl = `${apiBase}${path}`;

  console.log(`📡 Proxy request: ${req.method} ${targetUrl}`);

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Pass through Authorization if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      timeout: 10000, // 10 second timeout
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, options);
    
    // Log response status
    console.log(`✅ API responded with status ${apiRes.status}`);
    
    const data = await apiRes.json();

    // Forward the status code from the actual API
    res.status(apiRes.status).json(data);

  } catch (err) {
    console.error('❌ Proxy error:', err.message);
    
    // More detailed error response to help with debugging
    res.status(502).json({
      error: 'Failed to reach the API',
      message: err.message,
      hint: 'Check that API_BASE_URL is correct and the ALB is reachable from Vercel',
      targetUrl: targetUrl // Only in development; remove for production if sensitive
    });
  }
}
