/**
 * Vercel Serverless Function — dërgon mesazh WhatsApp via WhatsApp Cloud API
 * (Meta), duke përdorur një template të miratuar paraprakisht.
 * Konfiguro në Vercel dashboard:
 *   WHATSAPP_PHONE_NUMBER_ID  →  nga Meta App Dashboard → WhatsApp → API Setup
 *   WHATSAPP_ACCESS_TOKEN     →  token i përhershëm (System User)
 *   WHATSAPP_TEMPLATE_NAME    →  emri i template-it të miratuar (parazgjedhje: renewal_reminder)
 */
import { isWhatsAppConfigured, sendWhatsAppTemplate } from './_lib/whatsapp.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone, templateName, languageCode, bodyParams } = req.body || {}
  if (!phone || !Array.isArray(bodyParams)) {
    return res.status(400).json({ error: 'phone dhe bodyParams (array) janë të detyrueshme' })
  }

  if (!isWhatsAppConfigured()) {
    return res.status(503).json({ error: 'WhatsApp API nuk është konfiguruar në Vercel env vars' })
  }

  try {
    const data = await sendWhatsAppTemplate({ phone, templateName, languageCode, bodyParams })
    return res.status(200).json({ ok: true, messageId: data.messages?.[0]?.id })
  } catch (err) {
    return res.status(502).json({ error: err.message })
  }
}
