/**
 * Vercel Serverless Function — përgjigjet e AI mbi të dhënat reale të app-it, via Claude API
 * Konfiguro këtë env var në Vercel dashboard:
 *   ANTHROPIC_API_KEY  →  nga console.anthropic.com
 *
 * E dhëna e organizatës i dërgohet Claude-it si kontekst në çdo pyetje — API key-i
 * mbetet vetëm server-side, kurrë s'ekspozohet te klienti.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, data } = req.body || {}
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question është e detyrueshme' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI Q&A nuk është konfiguruar (mungon ANTHROPIC_API_KEY në Vercel env vars)' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const systemPrompt = `Je asistenti financiar i X-Flow, një app menaxhimi financiar (fatura, klientë, pagesa, shpenzime, abonime). Të dhënat reale të organizatës të përdoruesit jepen më poshtë si JSON. Përgjigju pyetjes SAKTËSISHT bazuar në këto të dhëna — mos shpik numra apo emra që s'i sheh aty. Nëse pyetja kërkon një listë, jepe si listë e shkurtër me emra/vlera. Nëse kërkon një shumë, jepe të saktë me €. Nëse të dhënat s'mjaftojnë për t'u përgjigjur, thuaje qartë. Përgjigju në shqip, shkurt e qartë. Data e sotme është ${today}.`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: [
          { type: 'text', text: systemPrompt },
          {
            type: 'text',
            text: `TË DHËNAT (JSON):\n${JSON.stringify(data || {})}`,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: question }],
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return res.status(resp.status).json({ error: 'Anthropic API error', details: errText })
    }

    const result = await resp.json()
    const answer = result.content?.find(b => b.type === 'text')?.text
    if (!answer) {
      // TEMP DEBUG: expose why extraction failed instead of a silent fallback
      return res.status(200).json({
        answer: 'Nuk munda të gjeja përgjigje.',
        debug: { stop_reason: result.stop_reason, usage: result.usage, content: result.content },
      })
    }
    return res.status(200).json({ answer })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
