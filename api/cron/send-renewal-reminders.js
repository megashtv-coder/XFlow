/**
 * Vercel Cron Job — dërgon një njoftim WhatsApp (via Cloud API, Meta) për
 * abonimet që skadojnë pas 7 ditësh (invoice.notifyDate === sot), NJË herë
 * për faturë (shënon data/renewalReminderSentAt në Supabase pas dërgimit,
 * që të mos përsëritet).
 *
 * Konfiguro në Vercel dashboard:
 *   WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN / WHATSAPP_TEMPLATE_NAME
 *     →  si te api/_lib/whatsapp.js — kërkon një template të miratuar nga Meta,
 *        me 2 parametra: {{1}} emri, {{2}} data e skadimit.
 *   CRON_SECRET  →  një varg random që e zgjedh vet; Vercel e shton automatikisht
 *     si header "Authorization: Bearer <CRON_SECRET>" kur e thërret këtë
 *     funksion sipas orarit — mbron endpoint-in nga thirrje publike aksidentale.
 *
 * Orari: vercel.json → crons (parazgjedhje: 08:00 UTC çdo ditë).
 */
import { createClient } from '@supabase/supabase-js'
import { isWhatsAppConfigured, sendWhatsAppTemplate } from '../_lib/whatsapp.js'

const supabase = createClient(
  'https://zssasbllfjeaailfteep.supabase.co',
  'sb_publishable_RmkUSCdjd71U6_gYlkb7Nw_Of8u4QLx'
)

function cleanPhone(p) {
  return (p || '').replace(/[\s+\-()]/g, '')
}

function formatDate(dateStr) {
  return dateStr?.split('-').reverse().join('/') || dateStr
}

export default async function handler(req, res) {
  // Only Vercel's own scheduler (or someone with CRON_SECRET) may trigger this.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!isWhatsAppConfigured()) {
    return res.status(503).json({ error: 'WhatsApp API nuk është konfiguruar (WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN)' })
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    // Only today's exact reminder date — never the historical backlog — and
    // never one already sent (renewalReminderSentAt set on a prior run).
    const { data: invoiceRows, error: invErr } = await supabase
      .from('invoices')
      .select('id, data')
      .eq('data->>notifyDate', today)
      .is('data->>renewalReminderSentAt', null)

    if (invErr) throw invErr
    if (!invoiceRows || invoiceRows.length === 0) {
      return res.status(200).json({ ok: true, date: today, sent: 0, skipped: 0, message: 'Asnjë abonim për sot.' })
    }

    const customerNames = [...new Set(invoiceRows.map(r => r.data.customer).filter(Boolean))]
    const { data: customerRows, error: custErr } = await supabase
      .from('customers')
      .select('data')
      .in('data->>name', customerNames)
    if (custErr) throw custErr

    const phoneByName = new Map(customerRows.map(r => [r.data.name, cleanPhone(r.data.phone)]))

    let sent = 0
    let skipped = 0
    const errors = []

    for (const row of invoiceRows) {
      const inv = row.data
      const phone = phoneByName.get(inv.customer)

      if (!phone || phone.length < 6) {
        skipped++
        continue
      }

      try {
        const firstName = (inv.customer || '').split(' ')[0]
        await sendWhatsAppTemplate({
          phone,
          bodyParams: [firstName, formatDate(inv.subscriptionExpiry)],
        })

        await supabase
          .from('invoices')
          .update({ data: { ...inv, renewalReminderSentAt: new Date().toISOString() } })
          .eq('id', row.id)

        sent++
        // Anti-spam pacing between sends
        await new Promise(r => setTimeout(r, 1500))
      } catch (err) {
        errors.push({ invoiceId: row.id, customer: inv.customer, error: err.message })
      }
    }

    return res.status(200).json({ ok: true, date: today, sent, skipped, errors })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
