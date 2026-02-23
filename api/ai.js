module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey, prompt, system = "You are an expert YouTube content strategist." } = req.body;
  if (!apiKey) return res.status(400).json({ error: "No API key provided" });

  try {
    let text;

    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${system}\n\n${prompt}` }] }] }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "Gemini error" });
      text = d.candidates[0].content.parts[0].text;

    } else if (provider === "groq") {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 4000,
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "Groq error" });
      text = d.choices[0].message.content;

    } else if (provider === "openai") {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 4000,
          messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "OpenAI error" });
      text = d.choices[0].message.content;

    } else if (provider === "claude") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 4000,
          system,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d?.error?.message || "Claude error" });
      text = d.content[0].text;

    } else if (provider === "ollama") {
      return res.status(400).json({ error: "Ollama is local-only and cannot be used on Vercel." });
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
