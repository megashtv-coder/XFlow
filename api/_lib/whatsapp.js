/**
 * Shared helper — sends a WhatsApp message via the official WhatsApp Cloud
 * API (Meta), used by both api/send-whatsapp.js and
 * api/cron/send-renewal-reminders.js. Not a route itself: files/folders
 * under api/_lib/ are excluded from Vercel's automatic API routing.
 *
 * Configure in Vercel dashboard:
 *   WHATSAPP_PHONE_NUMBER_ID  →  from Meta App Dashboard → WhatsApp → API Setup
 *   WHATSAPP_ACCESS_TOKEN     →  permanent token (System User, whatsapp_business_messaging)
 *   WHATSAPP_TEMPLATE_NAME    →  approved template name (default below)
 *
 * IMPORTANT: Cloud API only allows business-initiated messages (i.e. the
 * customer hasn't messaged you in the last 24h — always true for a
 * proactive renewal reminder) via a pre-approved message TEMPLATE, not
 * free-form text. The template must be created and approved in Meta
 * Business Manager first.
 */
export function isWhatsAppConfigured() {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN)
}

export async function sendWhatsAppTemplate({ phone, templateName, languageCode, bodyParams }) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  const to = String(phone).replace(/\D/g, '')
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName || process.env.WHATSAPP_TEMPLATE_NAME || 'renewal_reminder',
        language: { code: languageCode || 'sq' },
        components: [
          {
            type: 'body',
            parameters: (bodyParams || []).map(text => ({ type: 'text', text: String(text) })),
          },
        ],
      },
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`WhatsApp Cloud API ${resp.status}: ${errText}`)
  }

  return resp.json()
}
