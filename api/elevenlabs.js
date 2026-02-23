module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { elKey, voiceId, text, voice_settings } = req.body;
  if (!elKey) return res.status(400).json({ error: "ElevenLabs API key required" });
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": elKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      return res.status(r.status).json({ error: d?.detail?.message || "ElevenLabs error" });
    }
    const buffer = await r.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
