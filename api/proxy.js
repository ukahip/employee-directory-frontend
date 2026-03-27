export default async function handler(req, res) {
  const apiBase = process.env.API_BASE_URL;

  console.log('[Proxy] API_BASE_URL:', apiBase);
  console.log('[Proxy] req.url:', req.url);

  if (!apiBase) {
    return res.status(500).json({ 
      error: 'API_BASE_URL not set',
      hint: 'Check Vercel Environment Variables'
    });
  }

  // Parse path from query string
  let path = '';
  
  if (req.query && req.query.path) {
    path = req.query.path;
  } else {
    const match = req.url.match(/[?&]path=([^&]+)/);
    if (match) path = decodeURIComponent(match[1]);
  }

  console.log('[Proxy] Extracted path:', path);

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const targetUrl = apiBase.replace(/\/$/, '') + path;
  
  console.log('[Proxy] Target URL:', targetUrl);

  try {
    const options = {
      method: req.method,
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const apiRes = await fetch(targetUrl, options);
    
    console.log('[Proxy] Response status:', apiRes.status);

    const contentType = apiRes.headers.get('content-type') || '';
    const responseText = await apiRes.text();
    
    if (!contentType.includes('application/json')) {
      console.error('[Proxy] Non-JSON:', responseText.slice(0, 200));
      return res.status(502).json({
        error: 'Non-JSON from backend',
        status: apiRes.status,
        preview: responseText.slice(0, 200),
        targetUrl: targetUrl
      });
    }

    const data = JSON.parse(responseText);
    return res.status(apiRes.status).json(data);

  } catch (err) {
    console.error('[Proxy] Error:', err);
    return res.status(502).json({
      error: 'Failed to reach API',
      detail: err.message,
      targetUrl: targetUrl
    });
  }
}
