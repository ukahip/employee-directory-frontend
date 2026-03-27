// Vercel Serverless Function — API Proxy
// Reads API_BASE_URL from Vercel environment variables (server-side only).
// The ALB URL is NEVER sent to the browser — safe for public repos.

export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;

  if (!apiBase) {
    return res.status(500).json({ error: 'API_BASE_URL environment variable is not set in Vercel.' });
  }

  // Strip /api prefix → get the real path e.g. /api/employees → /employees
  const path = req.url.replace(/^\/api/, '') || '/';
  const targetUrl = `${apiBase}${path}`;

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, options);
    const data = await apiRes.json();

    // Forward the status code from the actual API
    res.status(apiRes.status).json(data);

  } catch (err) {
    res.status(502).json({
      error: 'Failed to reach the API',
      detail: err.message
    });
  }
}
