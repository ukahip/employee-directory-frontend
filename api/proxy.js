// Vercel Serverless Proxy
// vercel.json passes the original path as ?path=employees
// so req.url here is /api/proxy?path=employees — NOT /api/employees
// We read req.query.path to get the real destination path.

export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;

  if (!apiBase) {
    return res.status(500).json({ error: 'API_BASE_URL environment variable is not set in Vercel.' });
  }

  // Read the real path from the query param set by vercel.json rewrite
  const path = req.query.path || '';
  const targetUrl = apiBase.replace(/\/$/, '') + '/' + path;

  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, options);

    // Check content type before parsing — avoids the HTML parse error
    const contentType = apiRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await apiRes.text();
      console.error('Non-JSON response from API:', apiRes.status, text.slice(0, 200));
      return res.status(502).json({
        error: 'API returned non-JSON response',
        status: apiRes.status,
        hint: 'Check that API_BASE_URL is correct and the ALB is reachable'
      });
    }

    const data = await apiRes.json();
    return res.status(apiRes.status).json(data);

  } catch (err) {
    return res.status(502).json({
      error: 'Failed to reach API',
      detail: err.message,
      target: targetUrl
    });
  }
}
