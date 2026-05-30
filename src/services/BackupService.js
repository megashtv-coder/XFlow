/**
 * Backup Service
 * Handles export and import of all application data
 */

export function exportAllData(appState) {
  // Prepare backup data with timestamp and version
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      invoices: appState.invoices || [],
      customers: appState.customers || [],
      items: appState.items || [],
      payments: appState.payments || [],
      expenses: appState.expenses || [],
      users: appState.users || [],
    },
  }

  return backup
}

export function downloadBackup(appState) {
  try {
    const backup = exportAllData(appState)
    const jsonString = JSON.stringify(backup, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create download link
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `xflow-backup-${timestamp}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true, message: 'Backup u shkarko me sukses' }
  } catch (error) {
    console.error('Backup download error:', error)
    return { success: false, message: 'Gabim gjatë shkarkimit të backup-it' }
  }
}

export function validateBackupFile(jsonData) {
  // Check if it's a valid backup file
  if (!jsonData.version) {
    return { valid: false, error: 'Format i pavlefshëm - mungon versioni' }
  }

  if (!jsonData.data) {
    return { valid: false, error: 'Format i pavlefshëm - mungon data' }
  }

  const requiredFields = ['invoices', 'customers', 'items', 'payments', 'expenses']
  const missingFields = requiredFields.filter(field => !(field in jsonData.data))

  if (missingFields.length > 0) {
    return { valid: false, error: `Mungojnë fushat: ${missingFields.join(', ')}` }
  }

  return { valid: true }
}

export function importBackup(jsonData) {
  try {
    // Validate the backup file
    const validation = validateBackupFile(jsonData)
    if (!validation.valid) {
      return { success: false, message: validation.error }
    }

    // Return the imported data
    return {
      success: true,
      data: jsonData.data,
      message: 'Backup u importua me sukses',
    }
  } catch (error) {
    console.error('Backup import error:', error)
    return { success: false, message: 'Gabim gjatë importimit të backup-it' }
  }
}

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result)
        resolve(jsonData)
      } catch (error) {
        reject(new Error('Fichier-i nuk është JSON i vlefshëm'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Gabim në leximin e fichierit'))
    }

    reader.readAsText(file)
  })
}

export default {
  exportAllData,
  downloadBackup,
  validateBackupFile,
  importBackup,
  parseBackupFile,
}
