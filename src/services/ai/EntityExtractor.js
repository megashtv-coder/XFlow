/**
 * EntityExtractor.js
 * Extracts entities (customer name, amount, date, etc.) from user input
 */

/**
 * Extract entities from user text
 * @param {string} text - User input
 * @param {Object} context - Current app context (customers, items, etc.)
 * @returns {Object} - Extracted entities
 */
export function extractEntities(text, context = {}) {
  if (!text || typeof text !== 'string') {
    return {}
  }

  const entities = {}

  // Extract customer name
  entities.customer = extractCustomerName(text, context.customers || [])

  // Extract amount/price
  entities.amount = extractAmount(text)

  // Extract duration/package
  entities.package = extractPackage(text, context.items || [])

  // Extract dates
  entities.date = extractDate(text, 'date')
  entities.dueDate = extractDate(text, 'due')

  // Extract category/vendor
  entities.category = extractCategory(text, context.expenseCategories || [])
  entities.vendor = extractVendor(text, context.vendors || [])

  // Extract payment mode
  entities.paymentMode = extractPaymentMode(text, context.paymentModes || [])

  // Extract invoice ID
  entities.invoiceId = extractInvoiceId(text)

  // Extract numbers (for quantities, etc.)
  entities.quantity = extractQuantity(text)

  // Extract month/year references
  entities.period = extractPeriod(text)

  // Clean up empty values
  return Object.fromEntries(
    Object.entries(entities).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  )
}

/**
 * Extract mentions with @ prefix (customers or products)
 * @param {string} text - User input
 * @param {Array} items - List of items to match
 * @returns {Array} - Matching items
 */
export function extractMentions(text, items = []) {
  const mentionMatches = text.match(/@([\w\s]+)/g) || []
  if (mentionMatches.length === 0) return []

  const mentions = mentionMatches.map(m => m.substring(1).toLowerCase().trim())
  return items.filter(item =>
    mentions.some(mention => item.name.toLowerCase().includes(mention))
  )
}

/**
 * Extract customers mentioned with @ prefix
 * @param {string} text - User input
 * @param {Array} customers - List of customers
 * @returns {Array} - Matching customers
 */
export function extractCustomerMentions(text, customers = []) {
  const mentionMatches = text.match(/@([\w\s]+)/g) || []
  if (mentionMatches.length === 0) return []

  const firstMention = mentionMatches[0].substring(1).toLowerCase().trim()
  return customers.filter(c =>
    c.name.toLowerCase().includes(firstMention)
  )
}

/**
 * Extract products/items mentioned with @ prefix
 * @param {string} text - User input
 * @param {Array} items - List of products
 * @returns {Array} - Matching products
 */
export function extractProductMentions(text, items = []) {
  const mentionMatches = text.match(/@([\w\s]+)/g) || []
  if (mentionMatches.length < 2) return []

  // Get second mention (first is customer, second is product)
  const productMention = mentionMatches[1].substring(1).toLowerCase().trim()
  return items.filter(item =>
    item.name.toLowerCase().includes(productMention)
  )
}

/**
 * Extract customer name from text
 */
function extractCustomerName(text, customers = []) {
  // Check for @mention first
  const mentions = extractCustomerMentions(text, customers)
  if (mentions.length === 1) {
    return mentions[0].name
  }
  if (mentions.length > 1) {
    return null // Require user to select
  }

  // Check for known customers in text
  for (const customer of customers) {
    if (text.toLowerCase().includes(customer.name.toLowerCase())) {
      return customer.name
    }
  }

  // Extract potential customer name (usually after "për" or at end)
  const patterns = [
    /për\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /klient\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /faturë\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * Extract amount from text
 */
function extractAmount(text) {
  // Match numbers with or without euro symbol
  const patterns = [
    /(\d+(?:[.,]\d{2})?)\s*€/i,
    /€\s*(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s*euro/i,
    /euro\s+(\d+(?:[.,]\d{2})?)/i,
    /shuma\s+(\d+(?:[.,]\d{2})?)/i,
    /(\d+(?:[.,]\d{2})?)\s+euro/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      return isNaN(amount) ? null : amount
    }
  }

  return null
}

/**
 * Extract package/duration from text
 */
function extractPackage(text, items = []) {
  const durations = [
    { text: /(\d+)\s*muaj/i, value: (n) => `${n} months`, display: (n) => `${n} muaj` },
    { text: /(\d+)\s*vit/i, value: (n) => `${n * 12} months`, display: (n) => `${n} vit` },
    { text: /12\s*muaj/i, value: () => '12 months', display: () => '12 muaj' },
    { text: /6\s*muaj/i, value: () => '6 months', display: () => '6 muaj' },
    { text: /3\s*muaj/i, value: () => '3 months', display: () => '3 muaj' },
    { text: /1\s*muaj/i, value: () => '1 month', display: () => '1 muaj' },
  ]

  for (const duration of durations) {
    const match = text.match(duration.text)
    if (match) {
      const num = match[1] ? parseInt(match[1]) : null
      return {
        duration: num ? duration.value(num) : duration.value(),
        display: num ? duration.display(num) : duration.display(),
        months: num ? (duration.text.toString().includes('vit') ? num * 12 : num) : null,
      }
    }
  }

  // Check against item descriptions
  for (const item of items) {
    if (text.toLowerCase().includes(item.name.toLowerCase())) {
      return {
        item: item.name,
        price: item.salePrice,
      }
    }
  }

  return null
}

/**
 * Extract date from text
 */
function extractDate(text, type = 'date') {
  // Date patterns
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,  // YYYY-MM-DD
    /(\d{2}\/\d{2}\/\d{4})/, // DD/MM/YYYY
    /(\d{2}\.\d{2}\.\d{4})/, // DD.MM.YYYY
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return normalizeDate(match[1])
    }
  }

  // Relative dates
  if (text.toLowerCase().includes('sot')) {
    return new Date().toISOString().slice(0, 10)
  }
  if (text.toLowerCase().includes('nesër')) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  }

  return null
}

/**
 * Normalize date to YYYY-MM-DD format
 */
function normalizeDate(dateStr) {
  let date

  if (dateStr.includes('-')) {
    // Already YYYY-MM-DD
    date = new Date(dateStr)
  } else if (dateStr.includes('/')) {
    // DD/MM/YYYY
    const [d, m, y] = dateStr.split('/')
    date = new Date(`${y}-${m}-${d}`)
  } else if (dateStr.includes('.')) {
    // DD.MM.YYYY
    const [d, m, y] = dateStr.split('.')
    date = new Date(`${y}-${m}-${d}`)
  }

  if (date && !isNaN(date)) {
    return date.toISOString().slice(0, 10)
  }

  return null
}

/**
 * Extract category from text
 */
function extractCategory(text, categories = []) {
  const lowerText = text.toLowerCase()

  // Check against known categories
  for (const category of categories) {
    if (lowerText.includes(category.toLowerCase())) {
      return category
    }
  }

  // Common keywords
  const keywordMap = {
    'internet': 'Shërbime',
    'qira': 'Qira',
    'software': 'Software',
    'marketing': 'Marketing',
    'ushqim': 'Ushqim',
    'pajisje': 'Pajisje',
    'udhëtime': 'Udhëtime',
  }

  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (lowerText.includes(keyword)) {
      return category
    }
  }

  return null
}

/**
 * Extract vendor from text
 */
function extractVendor(text, vendors = []) {
  const lowerText = text.toLowerCase()

  for (const vendor of vendors) {
    if (lowerText.includes(vendor.name.toLowerCase())) {
      return vendor.name
    }
  }

  return null
}

/**
 * Extract payment mode from text
 */
function extractPaymentMode(text, paymentModes = []) {
  const lowerText = text.toLowerCase()

  const modeMap = {
    'paypal': 'PayPal',
    'transfer': 'Transfer Bankar',
    'kesh': 'Kesh',
    'cash': 'Kesh',
    'western': 'Western Union',
    'ria': 'Ria',
    'money gram': 'Money Gram',
    'crypto': 'Crypto',
    'stripe': 'Stripe',
    'wire': 'Transfer Bankar',
    'bank': 'Transfer Bankar',
  }

  for (const [keyword, mode] of Object.entries(modeMap)) {
    if (lowerText.includes(keyword)) {
      return mode
    }
  }

  // Check against known modes
  for (const mode of paymentModes) {
    if (lowerText.includes(mode.toLowerCase())) {
      return mode
    }
  }

  return null
}

/**
 * Extract invoice ID from text
 */
function extractInvoiceId(text) {
  const match = text.match(/INV-(\d+)/i)
  return match ? `INV-${match[1]}` : null
}

/**
 * Extract quantity from text
 */
function extractQuantity(text) {
  const patterns = [
    /(\d+)\s*copje/i,
    /(\d+)\s*njesesi/i,
    /sasia\s+(\d+)/i,
    /qty\s+(\d+)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return parseInt(match[1])
    }
  }

  return null
}

/**
 * Extract time period references (month, year)
 */
function extractPeriod(text) {
  const lowerText = text.toLowerCase()
  const months = [
    'janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor',
    'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor',
  ]

  const monthMap = {}
  months.forEach((m, i) => {
    monthMap[m] = i + 1
  })

  // Check for month names
  for (const [month, num] of Object.entries(monthMap)) {
    if (lowerText.includes(month)) {
      const yearMatch = text.match(/20\d{2}/)
      return {
        month: num,
        year: yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear(),
      }
    }
  }

  // Check for "këtë muaj", "muajin e kaluar", etc.
  if (lowerText.includes('këtë muaj')) {
    const now = new Date()
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }
  }

  if (lowerText.includes('muajin e kaluar')) {
    const now = new Date()
    const last = new Date(now.getFullYear(), now.getMonth() - 1)
    return {
      month: last.getMonth() + 1,
      year: last.getFullYear(),
    }
  }

  return null
}

/**
 * Get price from package/item
 */
export function getPriceFromPackage(pkg, items = []) {
  if (!pkg) return null

  // If item is referenced
  if (pkg.item) {
    const item = items.find(i => i.name === pkg.item)
    return item ? item.salePrice : null
  }

  // Default prices by duration
  const priceMap = {
    '1 month': 10,
    '3 months': 30,
    '6 months': 50,
    '12 months': 100,
  }

  return priceMap[pkg.duration] || null
}
