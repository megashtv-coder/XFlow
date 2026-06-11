/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date in DD/MM/YYYY format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'

  // Check if already in correct format
  if (dateStr.includes('/')) return dateStr

  // Split YYYY-MM-DD
  const [year, month, day] = dateStr.split('-')

  // Return DD/MM/YYYY
  return `${day}/${month}/${year}`
}

/**
 * Parse date from DD/MM/YYYY to YYYY-MM-DD for storage
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function parseDate(dateStr) {
  if (!dateStr) return ''

  // Check if already in YYYY-MM-DD format
  if (dateStr.includes('-') && !dateStr.includes('/')) return dateStr

  // Split DD/MM/YYYY
  const [day, month, year] = dateStr.split('/')

  // Return YYYY-MM-DD
  return `${year}-${month}-${day}`
}
