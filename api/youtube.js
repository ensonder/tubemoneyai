module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { ytKey, query, maxResults = 12, type = "video", publishedAfter } = req.query;
  if (!ytKey) return res.status(400).json({ error: "YouTube API key required" });
  try {
    const params = new URLSearchParams({
      part: "snippet", q: query, maxResults, type, key: ytKey, order: "viewCount",
      ...(publishedAfter && { publishedAfter }),
    });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "YouTube error" });
    res.status(200).json(d);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
