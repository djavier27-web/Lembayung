// Proxy ke Groq. API key HANYA ada di environment variable Vercel (tidak pernah ke browser).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST' });
  // Key ditaruh di file server ini (bukan di frontend). Env var GROQ_API_KEY di Vercel, kalau ada, diprioritaskan.
  const key = process.env.GROQ_API_KEY || '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';
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY belum diset di Vercel' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const msgs = Array.isArray(body && body.messages)
    ? body.messages.slice(-20).map(m => ({
        role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
        content: String(m.content || '').slice(0, 4000)
      }))
    : [];
  if (!msgs.length) return res.status(400).json({ error: 'messages kosong' });

  const payload = {
    model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    messages: msgs,
    temperature: 0.8,
    max_tokens: Number(process.env.GROQ_MAX_TOKENS || 1200)
  };
  // Opsional, hanya kalau model kamu mendukung (mis. "none" untuk mematikan thinking)
  if (process.env.GROQ_REASONING_EFFORT) payload.reasoning_effort = process.env.GROQ_REASONING_EFFORT;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify(payload)
    });
    const j = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (j.error && j.error.message) || 'Error dari Groq' });
    let text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
