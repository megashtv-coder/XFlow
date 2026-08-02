/**
 * ActionExecutor.js
 * Turns an action descriptor from ActionRouter into a real change in app state.
 * generateAction() only builds a plain description of what should happen —
 * this is the step that actually persists it (e.g. creates the invoice).
 */

function generateNextInvoiceId(invoices = []) {
  let maxNum = 0
  invoices.forEach(inv => {
    const match = inv.id?.match(/INV-(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  return `INV-${String(maxNum + 1).padStart(6, '0')}`
}

function extractMonths(desc) {
  if (!desc) return null
  const plusMatch = desc.match(/(\d+)\s*\+\s*(\d+)\s*muaj/i)
  if (plusMatch) return parseInt(plusMatch[1], 10) + parseInt(plusMatch[2], 10)
  const m = desc.match(/(\d+)\s*muaj/i)
  return m ? parseInt(m[1], 10) : null
}

function calculateSubscriptionExpiry(baseDate, months) {
  const date = new Date(baseDate)
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  let newMonth = month + months
  let newYear = year
  while (newMonth > 11) {
    newMonth -= 12
    newYear += 1
  }

  const expiryDate = new Date(newYear, newMonth, day)
  if (expiryDate.getMonth() !== newMonth) {
    expiryDate.setDate(0) // last day of previous month
  }
  return expiryDate
}

function executeCreateInvoice(params, appContext) {
  const { invoices = [], setInvoices, customers = [], logActivity } = appContext

  if (!params?.customer) {
    return { success: false, error: 'Mungon klienti për faturën.' }
  }
  if (!params?.amount) {
    return { success: false, error: 'Mungon shuma për faturën.' }
  }
  if (typeof setInvoices !== 'function') {
    return { success: false, error: 'Nuk mund të krijohet fatura (sistemi nuk është gati).' }
  }

  const custObj = customers.find(c => c.name === params.customer)
  const newId = generateNextInvoiceId(invoices)

  const months = extractMonths(params.items?.[0]?.desc)
  let subscriptionExpiry = ''
  let notifyDate = ''
  if (months) {
    const exp = calculateSubscriptionExpiry(params.date, months)
    subscriptionExpiry = exp.toISOString().slice(0, 10)
    const notifyD = new Date(exp)
    notifyD.setDate(notifyD.getDate() - 7)
    notifyDate = notifyD.toISOString().slice(0, 10)
  }

  const invoice = {
    id: newId,
    date: params.date,
    customer: params.customer,
    referent: '',
    country: custObj?.country || '',
    email: custObj?.email || '',
    amount: params.amount,
    due: params.due,
    subscriptionExpiry,
    notifyDate,
    status: params.status || 'pending',
    items: params.items?.length ? params.items : [{ desc: 'Shërbim', qty: 1, price: params.amount }],
    discount: null,
    comments: [],
  }

  setInvoices(prev => [invoice, ...prev])
  logActivity?.(`Krijoi faturën ${newId} — ${params.customer} €${params.amount} (AI)`, 'Faturat')

  return { success: true, invoice, message: `✓ Fatura ${newId} u krijua me sukses!` }
}

/**
 * Execute an action descriptor produced by ActionRouter.generateAction()
 * @param {Object} action - {action, type, operation, parameters}
 * @param {Object} appContext - App context from useApp()
 * @returns {{success: boolean, message?: string, error?: string, [key: string]: any}}
 */
export function executeAction(action, appContext) {
  if (!action) {
    return { success: false, error: 'Nuk ka veprim për të ekzekutuar.' }
  }

  switch (action.action) {
    case 'create_invoice':
      return executeCreateInvoice(action.parameters, appContext)
    default:
      return {
        success: false,
        error: `Ky veprim (${action.action}) nuk mbështetet ende nga asistenti.`,
      }
  }
}
