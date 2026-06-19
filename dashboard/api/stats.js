export default async function handler(req, res) {
  const backend = process.env.RENDER_API_URL || 'http://localhost:8080';
  try {
    const r = await fetch(`${backend}/api/stats`);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch { res.status(502).json({ error: 'Backend unavailable' }); }
}