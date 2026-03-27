export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;
  if (!apiBase) return res.status(500).json({ error: 'API_BASE_URL not set' });
  
  const path = req.url.replace(/^\/api/, '') || '/';
  const targetUrl = apiBase.replace(/\/$/, '') + path;
  
  try {
    const options = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (['POST','PUT','PATCH'].includes(req.method) && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    const apiRes = await fetch(targetUrl, options);
    const data = await apiRes.json();
    return res.status(apiRes.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach API', detail: err.message });
  }
}
