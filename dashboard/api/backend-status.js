export default async function handler(req, res) {
  const backend = process.env.RENDER_API_URL || 'http://localhost:8080';
  try {
    const r = await fetch(`${backend}/api/stats`);
    if (r.ok) return res.json({ connected: true });
  } catch {}
  res.json({ connected: false });
}