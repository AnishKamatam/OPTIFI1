import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const PORT = process.env.PORT || 8787
const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (req, res) => res.json({ ok: true }))

app.post('/reconcile', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' })

    const { bank_transactions, app_transactions } = req.body || {}
    if (!Array.isArray(bank_transactions) || !Array.isArray(app_transactions)) {
      return res.status(400).json({ error: 'bank_transactions and app_transactions arrays required' })
    }

    const system = 'You are an expert accounting assistant. Given two datasets (bank transactions and app transactions), match items that likely represent the same payment using date proximity (±3 days) and amount similarity (exact or small rounding deltas). Return strict JSON with keys: matched (array of {bank, app}), unmatched_bank (array of bank items), unmatched_app (array of app items). Do not include any text outside JSON.'
    const body = {
      model: 'claude-3-5-sonnet-20241022',
      system,
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: JSON.stringify({ bank_transactions, app_transactions }) }]
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })
    const text = await resp.text()
    if (!resp.ok) {
      return res.status(resp.status).json({ error: text })
    }
    let content = ''
    try {
      const data = JSON.parse(text)
      content = Array.isArray(data?.content) && data.content[0]?.type === 'text' ? data.content[0].text : ''
    } catch {
      return res.status(500).json({ error: 'Invalid response from Anthropic' })
    }

    // Extract JSON from model output
    let jsonText = content
    const fenceMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/)
    if (fenceMatch && fenceMatch[1]) jsonText = fenceMatch[1]
    let parsed
    try { parsed = JSON.parse(jsonText) } catch {
      const start = jsonText.indexOf('{')
      const end = jsonText.lastIndexOf('}')
      if (start !== -1 && end !== -1) parsed = JSON.parse(jsonText.slice(start, end + 1))
    }
    if (!parsed) return res.status(502).json({ error: 'Failed to parse model output', raw: content })
    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal Error' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})


