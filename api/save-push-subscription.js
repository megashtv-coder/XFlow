/**
 * Ruan (ose përditëson) regjistrimin e njoftimeve push të kësaj pajisjeje —
 * thirret nga src/utils/pushNotifications.js pasi shfletuesi jep leje dhe
 * krijon subscription-in. Nuk kërkon identifikim të përdoruesit (vendimi i
 * marrë: çdo pajisje e regjistruar merr çdo njoftim, si lista e detyrave që
 * e shohin të gjithë).
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zssasbllfjeaailfteep.supabase.co',
  'sb_publishable_RmkUSCdjd71U6_gYlkb7Nw_Of8u4QLx'
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { subscription } = req.body || {}
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Mungon subscription-i.' })

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: subscription.endpoint, subscription }, { onConflict: 'endpoint' })

  if (error) {
    console.error('[save-push-subscription] error:', error)
    return res.status(500).json({ error: error.message })
  }
  return res.status(200).json({ ok: true })
}
