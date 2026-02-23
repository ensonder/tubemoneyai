module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { ytKey, ids } = req.query;
  if (!ytKey) return res.status(400).json({ error: "YouTube API key required" });
  try {
    const params = new URLSearchParams({ part: "statistics,contentDetails,snippet", id: ids, key: ytKey });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "YouTube error" });
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
