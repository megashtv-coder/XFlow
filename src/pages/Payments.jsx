import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import {
  CreditCard, Download, Search, X,
  Pencil, Trash2, FileSpreadsheet, Plus, Users,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/dateFormat'
import { EmptyState, Pagination } from '../components/UI'
import FormPageWrapper from '../components/FormPageWrapper'
import PaymentModal from './PaymentModal'
import { downloadTemplate } from '../components/ImportExcelModal'
const ImportExcelModal = lazy(() => import('../components/ImportExcelModal'))

// sort/page defaults

/* ── method badge colour ── */
const METHOD_COLOR = {
  'PayPal':          'bg-sky-50 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
  'Transfer Bankar': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  'Kesh':            'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  'Western Union':   'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  'Ria':             'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
  'Money Gram':      'bg-pink-50 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  'Crypto':          'bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
  'Stripe':          'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
}
const METHOD_ICON = {
  'PayPal': '🅿️', 'Transfer Bankar': '🏦', 'Kesh': '💵',
  'Western Union': '🌐', 'Ria': '🔄', 'Money Gram': '💱',
  'Crypto': '₿', 'Stripe': '⚡',
}

/* ── Export Modal Component ── */
function PaymentsExportModal({ isOpen, onClose, payments, fmt }) {
  const [exportMonth, setExportMonth] = useState('')
  const [exportFormat, setExportFormat] = useState('csv')

  if (!isOpen) return null

  const filtered = exportMonth
    ? payments.filter(p => p.date.startsWith(exportMonth))
    : payments

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('Nuk ka pagesa për eksporto me këta filtera')
      return
    }

    if (exportFormat === 'csv') {
      exportCSV(filtered, exportMonth, 'all', fmt)
    } else {
      exportToJSON(filtered)
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Eksporto Pagesat</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">Muaji (opsional)</label>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">Format</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">CSV</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">JSON</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold">{filtered.length}</span> pagesa do të eksportohen
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
          >
            Anulo
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Eksporto
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Export Helper Functions ── */
function exportToJSON(payments) {
  const json = JSON.stringify(payments, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `pagesat-${new Date().toISOString().slice(0, 10)}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* ── CSV export ── */
function exportCSV(payments, month, partner, fmt) {
  const label    = partner === 'all' ? 'Te-gjitha' : `Tek-${partner}`
  const filename = `Pagesat-${month || 'Gjitha'}-${label}.csv`

  const BOM     = '﻿'
  const headers = [
    'Data', 'Fatura', 'Klienti', 'Shuma (€)', 'Fee (€)', 'Neto (€)',
    'Metoda', 'Llogaria', 'Referenca', 'Depozituar tek',
  ]

  const rows = payments.map(p => [
    p.date, p.invoiceId, `"${p.customer}"`,
    p.amount, p.fee, p.net,
    p.method, `"${p.depositAccount}"`,
    `"${p.reference}"`, p.depositedTo,
  ])

  const totalNet   = payments.reduce((s, p) => s + p.net,    0)
  const totalFee   = payments.reduce((s, p) => s + p.fee,    0)
  const totalGross = payments.reduce((s, p) => s + p.amount, 0)
  const samkiNet   = payments.filter(p => p.depositedTo === 'Samki').reduce((s, p) => s + p.net, 0)
  const enndiNet   = payments.filter(p => p.depositedTo === 'Enndy').reduce((s, p) => s + p.net, 0)
  const halfProfit = totalNet / 2

  const summary = [
    [],
    ['=== PËRMBLEDHJE ==='],
    ['Shuma bruto:',           totalGross.toFixed(2)],
    ['Fee totale:',            totalFee.toFixed(2)],
    ['Neto totale:',           totalNet.toFixed(2)],
    [],
    ['=== NDARJA E FITIMIT ==='],
    ['Tek Enndy:',             enndiNet.toFixed(2)],
    ['Tek Samki:',             samkiNet.toFixed(2)],
    ['50% secili (nga neto):', halfProfit.toFixed(2)],
  ]

  const csv = BOM + [
    headers.join(','),
    ...rows.map(r => r.join(',')),
    ...summary.map(r => r.join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* ── unique months from payments ── */
function getMonths(payments) {
  const set = new Set(payments.map(p => p.date.slice(0, 7)))
  return Array.from(set).sort().reverse()
}

/* ══════════════════════════════════════════════════════════ */
export default function Payments() {
  const {
    payments, setPayments,
    invoices, setInvoices,
    closeModal,
    showToast, fmt,
    page, navigate, logActivity,
    paymentsExportOpen: exportOpen, setPaymentsExportOpen: setExportOpen,
    paymentsImportOpen: importOpen, setPaymentsImportOpen: setImportOpen,
  } = useApp()

  const [search,      setSearch]    = useState('')
  const [monthFilt,   setMonthFilt] = useState('all')
  const [partnerFilt, setPartner]   = useState('all')
  const [methodFilt,  setMethod]    = useState('all')
  const [pg,          setPg]        = useState(1)
  const [perPage,     setPerPage]   = useState(50)
  const [sortField,   setSortField] = useState('date')
  const [sortDir,     setSortDir]   = useState('desc')
  const [deletingId,  setDeletingId] = useState(null)

  // Read filters from URL parameters
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location)
    const filter = url.searchParams.get('filter')
    const year = url.searchParams.get('year')

    if (filter === 'year' && year) {
      // Set month filter to show only payments from the specified year
      setMonthFilt('all') // Show all months of that year, we'll filter by year in the data
      // Remove URL params after reading
      url.searchParams.delete('filter')
      url.searchParams.delete('year')
      window.history.replaceState({}, '', url.toString())
      // Store year in sessionStorage temporarily for filtering
      sessionStorage.setItem('xflow_payment_year', year)
    }
  }, [])

  // Detect if we're in form mode (page like "payments:create" or "payments:ID:edit")
  const pageMatch = page.split(':')
  const isFormMode = pageMatch[0] === 'payments' && (pageMatch[1] === 'create' || pageMatch[1]?.includes('PAY-'))
  const editPaymentId = pageMatch[1]?.includes('PAY-') ? pageMatch[1] : null
  const editPayment = editPaymentId ? payments.find(p => p.id === editPaymentId) : null

  // Close modal if we leave form mode
  useEffect(() => {
    if (!isFormMode) {
      closeModal()
    }
  }, [isFormMode, closeModal])

  const months  = useMemo(() => getMonths(payments), [payments])
  const methods = useMemo(() => [...new Set(payments.map(p => p.method))], [payments])

  /* filtering */
  const filtered = useMemo(() => {
    const yearFilter = sessionStorage.getItem('xflow_payment_year')
    return payments.filter(p => {
      const matchSearch  = !search
        || p.customer.toLowerCase().includes(search.toLowerCase())
        || p.invoiceId.includes(search)
        || (p.reference || '').toLowerCase().includes(search.toLowerCase())
      const matchMonth   = monthFilt  === 'all' || p.date.startsWith(monthFilt)
      const matchPartner = partnerFilt === 'all' || p.depositedTo === partnerFilt
      const matchMethod  = methodFilt  === 'all' || p.method === methodFilt
      const matchYear    = !yearFilter || p.date.startsWith(yearFilter)
      return matchSearch && matchMonth && matchPartner && matchMethod && matchYear
    })
  }, [payments, search, monthFilt, partnerFilt, methodFilt])

  const toggleSort = field => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPg(1)
  }

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    let cmp = 0
    if      (sortField === 'date')        cmp = a.date.localeCompare(b.date)
    else if (sortField === 'invoiceId')   cmp = a.invoiceId.localeCompare(b.invoiceId)
    else if (sortField === 'customer')    cmp = a.customer.localeCompare(b.customer)
    else if (sortField === 'amount')      cmp = a.amount - b.amount
    else if (sortField === 'net')         cmp = a.net - b.net
    else if (sortField === 'method')      cmp = a.method.localeCompare(b.method)
    else if (sortField === 'depositedTo') cmp = a.depositedTo.localeCompare(b.depositedTo)
    return sortDir === 'asc' ? cmp : -cmp
  }), [filtered, sortField, sortDir])

  const paged = sorted.slice((pg - 1) * perPage, pg * perPage)

  /* stats from filtered — single pass instead of 5 separate reduce/filter+reduce scans */
  const { totalGross, totalFee, totalNet, enndiNet, samkiNet } = useMemo(() => {
    let gross = 0, fee = 0, net = 0, enndi = 0, samki = 0
    for (const p of filtered) {
      gross += p.amount
      fee   += p.fee
      net   += p.net
      if (p.depositedTo === 'Enndy') enndi += p.net
      else if (p.depositedTo === 'Samki') samki += p.net
    }
    return { totalGross: gross, totalFee: fee, totalNet: net, enndiNet: enndi, samkiNet: samki }
  }, [filtered])

  const openNewPayment  = ()  => navigate('payments:create')
  const openEditPayment = (p) => navigate(`payments:${p.id}:edit`)

  function handleImportPayments(rows) {
    // Shto pagesat e reja (shmang dublikatat sipas id)
    const existingIds = new Set(payments.map(p => p.id))
    const newPayments = rows.filter(p => !existingIds.has(p.id))

    setPayments(prev => [...prev, ...newPayments])

    if (newPayments.length === 0) {
      showToast('Nuk ka pagesa të reja për të importuar.')
      return
    }

    // Match VETËM me invoiceId direkt — shmang false positives
    const paidByInvoiceId = new Set(
      newPayments.map(p => (p.invoiceId || '').trim()).filter(Boolean)
    )

    let markedPaid = 0
    setInvoices(prev => prev.map(inv => {
      if (inv.status === 'paid') return inv
      if (paidByInvoiceId.has(inv.id)) {
        markedPaid++
        return { ...inv, status: 'paid' }
      }
      // status i panjohur → konverto në 'pending'
      if (!['draft','pending','overdue','paid','void'].includes(inv.status)) {
        return { ...inv, status: 'pending' }
      }
      return inv
    }))

    showToast(`U importuan ${newPayments.length} pagesa · ${markedPaid} fatura u shënuan si të paguara ✓`)
  }

  const deletePayment = (p) => {
    setPayments(prev => prev.filter(x => x.id !== p.id))
    setInvoices(prev => prev.map(i =>
      i.id === p.invoiceId ? { ...i, status: 'pending' } : i
    ))
    logActivity(`Fshiu pagesën ${p.id} — ${p.customer} €${Number(p.amount)}`, 'Pagesat')
    showToast('Pagesa u fshi. Fatura kaloi në pritje.')
    setDeletingId(null)
  }

  // If in form mode, show only the form
  if (isFormMode) {
    return (
      <div key={`payment-form-${editPaymentId || 'create'}`}>
        <FormPageWrapper
          title={editPayment ? `Ndrysho Pagesën` : 'Pagese e Re'}
          subtitle={editPayment ? `${fmt(editPayment.amount)} - ${editPayment.method}` : 'Regjistro një pagesë të re'}
          onBack={() => navigate('payments')}
        >
          <PaymentModal
            key={`modal-${editPaymentId || 'create'}`}
            payment={editPayment || undefined}
            onClose={() => navigate('payments')}
            isFormPage={true}
          />
        </FormPageWrapper>
      </div>
    )
  }

  return (
    <div>
      {/* Titulli, eksporti, importi dhe +Regjistro Pagesë tani jetojnë te header-i global
         (Header.jsx, kur page === 'payments'); FAB-i mobil mbetet këtu. */}

      {importOpen && (
        <Suspense fallback={null}>
          <ImportExcelModal
            entity="payments"
            onImport={handleImportPayments}
            onClose={() => setImportOpen(false)}
          />
        </Suspense>
      )}

      {/* Filtrat */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200/90 dark:border-gray-700 shadow-sm mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
            placeholder="Kërko klient, faturë..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPg(1) }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setPg(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-semibold outline-none focus:border-red-400 cursor-pointer"
            value={monthFilt}
            onChange={e => { setMonthFilt(e.target.value); setPg(1) }}
          >
            <option value="all">Të gjitha muajt</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-semibold outline-none focus:border-red-400 cursor-pointer"
            value={partnerFilt}
            onChange={e => { setPartner(e.target.value); setPg(1) }}
          >
            <option value="all">Të dy partnerët</option>
            <option value="Enndy">Tek Enndy</option>
            <option value="Samki">Tek Samki</option>
          </select>

          <select
            className="text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-semibold outline-none focus:border-red-400 cursor-pointer"
            value={methodFilt}
            onChange={e => { setMethod(e.target.value); setPg(1) }}
          >
            <option value="all">Të gjitha metodat</option>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            className="hidden sm:block text-xs px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 font-semibold outline-none focus:border-red-400 cursor-pointer"
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPg(1) }}
          >
            <option value={25}>25 / faqe</option>
            <option value={50}>50 / faqe</option>
            <option value={100}>100 / faqe</option>
            <option value={200}>200 / faqe</option>
            <option value={300}>300 / faqe</option>
          </select>

          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 font-mono px-2">
            {filtered.length}
          </span>
        </div>
      </div>

      {/* Mobile Card View - Hidden on sm+ */}
      {paged.length > 0 && (
        <div className="sm:hidden space-y-2 mb-4">
          {paged.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3">
              <div className="flex justify-between items-start gap-2">
                {/* Col 1: Customer + Payment Date + Invoice */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditPayment(p)}>
                  <p className="font-bold text-gray-900 dark:text-white text-sm truncate hover:text-red-500 dark:hover:text-red-400 transition-colors">{p.customer}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{formatDate(p.date)}</p>
                  <p className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">{p.invoiceId}</p>
                </div>

                {/* Col 2: Amount + Fee + Partner */}
                <div className="text-right">
                  <p className="font-mono font-bold text-gray-900 dark:text-white text-sm">{fmt(p.amount)}</p>
                  <p className="text-xs font-mono text-amber-600 dark:text-amber-400 mt-0.5">{p.fee > 0 ? `- ${fmt(p.fee)}` : '—'}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                    p.depositedTo === 'Enndy'
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                  }`}>
                    {p.depositedTo}
                  </span>
                </div>

                {/* Col 3: Actions - Larger Button */}
                <div className="relative flex-shrink-0 flex gap-1">
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Ndrysho"
                    onClick={() => openEditPayment(p)}
                  >
                    <Pencil size={16}/>
                  </button>
                  <button
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    title="Fshij"
                    onClick={() => setDeletingId(p.id)}
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>

              {/* Delete confirmation inline */}
              {deletingId === p.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-2 justify-end">
                  <button
                    className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                    onClick={() => deletePayment(p)}
                  >
                    Po, fshi
                  </button>
                  <button
                    className="px-3 py-1 text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                    onClick={() => setDeletingId(null)}
                  >
                    Anulo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile pagination - hidden on sm+ */}
      {paged.length > 0 && (
        <div className="sm:hidden mb-6">
          <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
        </div>
      )}

      {/* Tabela */}
      {paged.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Nuk ka pagesa"
          sub={search ? 'Provo kërkim tjetër' : 'Regjistro pagesën e parë'}
          action={
            !search && (
              <button className="btn btn-primary mt-2" onClick={openNewPayment}>
                <CreditCard size={14} /> Regjistro Pagesë
              </button>
            )
          }
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 shadow-sm overflow-hidden hidden sm:block">
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          <table className="w-full text-sm min-w-[560px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                {[
                  { key: 'date',        label: 'Data',    cls: '' },
                  { key: 'invoiceId',   label: 'Fatura',  cls: '' },
                  { key: 'customer',    label: 'Klienti', cls: '' },
                ].map(col => (
                  <th key={col.key} className={`px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${col.cls}`}
                      onClick={() => toggleSort(col.key)}>
                    <span className="flex items-center gap-1">
                      {col.label}
                      <span className="text-[10px]">{sortField === col.key ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300 dark:text-gray-600">↕</span>}</span>
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort('amount')}>
                  <span className="flex items-center justify-end gap-1">
                    Shuma
                    <span className="text-[10px]">{sortField === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300 dark:text-gray-600">↕</span>}</span>
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">Fee</th>
                <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort('net')}>
                  <span className="flex items-center justify-end gap-1">
                    Neto
                    <span className="text-[10px]">{sortField === 'net' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300 dark:text-gray-600">↕</span>}</span>
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden lg:table-cell cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort('method')}>
                  <span className="flex items-center gap-1">
                    Metoda
                    <span className="text-[10px]">{sortField === 'method' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300 dark:text-gray-600">↕</span>}</span>
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden lg:table-cell">Llogaria</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">Referenca</th>
                <th className="px-4 py-3 text-left text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => toggleSort('depositedTo')}>
                  <span className="flex items-center gap-1">
                    Partneri
                    <span className="text-[10px]">{sortField === 'depositedTo' ? (sortDir === 'asc' ? '↑' : '↓') : <span className="text-gray-300 dark:text-gray-600">↕</span>}</span>
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Veprimet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {paged.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500 text-xs">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-red-600 dark:text-red-400 text-xs">{p.invoiceId}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white text-xs max-w-[140px] truncate">{p.customer}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">{fmt(p.amount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400 text-xs hidden md:table-cell">
                    {p.fee > 0 ? `- ${fmt(p.fee)}` : <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmt(p.net)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${METHOD_COLOR[p.method] || 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300'}`}>
                      {METHOD_ICON[p.method] || '💳'} {p.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell max-w-[130px] truncate">
                    {p.depositAccount || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {p.reference || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.depositedTo === 'Enndy'
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                    }`}>
                      {p.depositedTo}
                    </span>
                  </td>

                  {/* ── Actions cell ── */}
                  <td className="px-4 py-3 text-right">
                    {deletingId === p.id ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs text-red-600 dark:text-red-400 font-semibold whitespace-nowrap">Fshij?</span>
                        <button
                          className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                          onClick={() => deletePayment(p)}
                        >
                          Po
                        </button>
                        <button
                          className="px-2 py-0.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setDeletingId(null)}
                        >
                          Jo
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Ndrysho pagesën"
                          onClick={() => openEditPayment(p)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                          title="Fshij pagesën"
                          onClick={() => setDeletingId(p.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Totals row - hidden on mobile */}
          {filtered.length > 0 && (
            <div className="hidden sm:flex items-center justify-end gap-6 px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-bold text-gray-400 dark:text-gray-500">
              <span>Bruto: <span className="font-mono text-gray-900 dark:text-white">{fmt(totalGross)}</span></span>
              <span>Fee: <span className="font-mono text-amber-600 dark:text-amber-400">- {fmt(totalFee)}</span></span>
              <span>Neto: <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">{fmt(totalNet)}</span></span>
            </div>
          )}

          <div className="hidden sm:block">
            <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
          </div>
        </div>
      )}

      {/* Profit split box (kur filtrohet muaj) */}
      {monthFilt !== 'all' && filtered.length > 0 && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Users size={15} className="text-red-500" />
            Ndarja e Fitimit — {monthFilt}
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Neto Totale</p>
              <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{fmt(totalNet)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">👤 Enndy</p>
              <p className="text-lg font-black font-mono text-red-600 dark:text-red-400">{fmt(enndiNet)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pritshme 50%: {fmt(totalNet / 2)}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">👤 Samki</p>
              <p className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{fmt(samkiNet)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pritshme 50%: {fmt(totalNet / 2)}</p>
            </div>
          </div>
          {Math.abs(enndiNet - samkiNet) > 0.01 && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-2.5">
              ⚖️ Diferenca mes partnerëve: <strong>{fmt(Math.abs(enndiNet - samkiNet))}</strong> —{' '}
              {enndiNet > samkiNet ? 'Enndy' : 'Samki'} ka marrë më shumë këtë muaj.
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      <PaymentsExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        payments={payments}
        fmt={fmt}
      />

      {/* Floating Action Button - Mobile only */}
      <div
        className="fab sm:hidden"
        onClick={openNewPayment}
        title="Regjistro Pagesë"
      >
        <Plus size={28}/>
      </div>
    </div>
  )
}
