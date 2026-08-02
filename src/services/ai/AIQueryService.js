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

function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : 'unknown' // "YYYY-MM"
}

// Collapse a large record list down to a per-month {count, total} series —
// answers "profit so far" / "this month vs last month" style questions
// without needing every raw record, so the payload stays small regardless
// of how many years of history the org has.
function aggregateByMonth(records, amountField) {
  const byMonth = {}
  for (const r of records) {
    const key = monthKey(r.date)
    if (!byMonth[key]) byMonth[key] = { month: key, count: 0, total: 0 }
    byMonth[key].count += 1
    byMonth[key].total += Number(r[amountField]) || 0
  }
  return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))
}

function daysFromToday(dateStr) {
  if (!dateStr) return null
  return (new Date(dateStr) - new Date()) / 86400000
}

// Sending every historical record (thousands of payments/expenses, years of
// invoices) blew past Vercel's 4.5MB serverless request-body limit. Instead:
// raw records only for what's actually actionable right now (unpaid
// invoices, subscriptions expiring soon, the most recent transactions), and
// month-by-month totals for everything else so full history stays queryable
// for trend/profit questions without shipping every row.
export function buildDataSnapshot(appContext) {
  const invoices = appContext.invoices || []
  const customers = appContext.customers || []
  const expenses = appContext.expenses || []
  const payments = appContext.payments || []

  const unpaidInvoices = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'draft')
    .slice(0, 1000)
    .map(trimInvoice)

  // Renewals that recently lapsed or are coming up soon — the actionable
  // window for "which subscriptions expire tomorrow/this week" — regardless
  // of whether that invoice happens to already be paid.
  const subscriptionActivity = invoices
    .filter(i => {
      const d = daysFromToday(i.subscriptionExpiry)
      return d !== null && d >= -30 && d <= 90
    })
    .slice(0, 1000)
    .map(trimInvoice)

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 200)
    .map(trimExpense)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 200)
    .map(trimPayment)

  return {
    note: 'unpaidInvoices = faturat aktuale të papaguara/pjesore. subscriptionActivity = abonime që kanë skaduar 30 ditët e fundit ose skadojnë brenda 90 ditëve. invoicesMonthlySummary/expensesMonthlySummary/paymentsMonthlySummary = totale mujore për të gjithë historikun (për pyetje rreth fitimit/trendit). recentExpenses/recentPayments = 200 transaksionet më të fundit.',
    unpaidInvoices,
    subscriptionActivity,
    invoicesMonthlySummary: aggregateByMonth(invoices.filter(i => i.status === 'paid'), 'amount'),
    customers: customers.slice(0, 3000).map(trimCustomer),
    customersTotal: customers.length,
    recentExpenses,
    expensesMonthlySummary: aggregateByMonth(expenses, 'amount'),
    recentPayments,
    paymentsMonthlySummary: aggregateByMonth(payments, 'net'),
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
