/**
 * AIQueryService.js
 * Fallback for free-form questions the rule-based command pipeline can't
 * parse ("cilët klientë skadojnë nesër?", "sa fitim kam deri tash?"). Sends
 * the question plus a compact snapshot of the org's real data to the
 * /api/ai-query serverless function (Claude), which answers based on it.
 */

function trimInvoice(inv) {
  return {
    id: inv.id,
    customer: inv.customer,
    amount: inv.amount,
    paidAmount: inv.paidAmount || 0,
    status: inv.status,
    date: inv.date,
    due: inv.due,
    subscriptionExpiry: inv.subscriptionExpiry || null,
    referent: inv.referent || null,
  }
}

function trimCustomer(c) {
  return {
    id: c.id,
    name: c.name,
    country: c.country || null,
    type: c.type || null,
    referredBy: c.referredBy || null,
  }
}

function trimExpense(e) {
  return {
    id: e.id,
    type: e.type,
    vendor: e.vendor || null,
    amount: e.amount,
    date: e.date,
    paidBy: e.paidBy || null,
  }
}

function trimPayment(p) {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    customer: p.customer,
    amount: p.amount,
    fee: p.fee || 0,
    net: p.net,
    date: p.date,
    method: p.method || null,
    depositedTo: p.depositedTo || null,
  }
}

export function buildDataSnapshot(appContext) {
  return {
    invoices: (appContext.invoices || []).map(trimInvoice),
    customers: (appContext.customers || []).map(trimCustomer),
    expenses: (appContext.expenses || []).map(trimExpense),
    payments: (appContext.payments || []).map(trimPayment),
  }
}

/**
 * @param {string} question
 * @param {Object} appContext - from useApp()
 * @returns {Promise<string>} the AI's answer text
 */
export async function askAI(question, appContext) {
  const data = buildDataSnapshot(appContext)

  const resp = await fetch('/api/ai-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, data }),
  })

  if (!resp.ok) {
    let details = ''
    try {
      const errBody = await resp.json()
      details = errBody.error || ''
    } catch {
      // ignore — resp wasn't JSON
    }
    throw new Error(details || `Gabim ${resp.status}`)
  }

  const result = await resp.json()
  return result.answer
}
