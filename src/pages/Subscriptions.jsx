import { useState, memo, useMemo, useCallback } from 'react'
import { Bell, MessageCircle, Send, Calendar, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Clock, Search, RefreshCw, PhoneOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/dateFormat'

/* ── Vetëm abonimi nga Korriku e tutje ── */
const AUTO_FROM = '2026-07-01'

const cleanPhone = p => (p || '').replace(/[\s+\-()]/g, '')

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildRenewalMsg(inv) {
  const firstName = (inv.customer || '').split(' ')[0]
  return `Pershendetje ${firstName}!\nDeshironim t'ju kujtojme se abonimi juaj per TV skadon me date ${formatDate(inv.subscriptionExpiry)}.\nJu lutem na kontaktoni per rinovim.\nFaleminderit!\nMe respekt, PREDATOR - MEGA SH TV`
}

/* ── Single row card ── */
const SubRow = memo(function SubRow({ inv, phone, urgency, today, onMarkSent }) {
  const { fmt } = useApp()
  const msg = encodeURIComponent(buildRenewalMsg(inv))

  const dateCls =
    urgency === 'high'   ? 'text-red-600 font-bold' :
    urgency === 'medium' ? 'text-amber-600 font-semibold' :
                           'text-gray-600 dark:text-gray-300'

  const daysLeft = inv.notifyDate
    ? Math.round((new Date(inv.notifyDate) - new Date(today)) / 86_400_000)
    : null

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors dark:border-gray-700 dark:hover:bg-gray-700/40">
      {/* Klienti */}
      <td className="table-td">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0">
            {inv.customer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm dark:text-white">{inv.customer}</p>
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{inv.id}</p>
          </div>
        </div>
      </td>

      {/* Data skadimit */}
      <td className="table-td">
        <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">{formatDate(inv.subscriptionExpiry)}</span>
      </td>

      {/* Data njoftimit */}
      <td className="table-td">
        <div className="font-mono">
          <span className={`text-sm font-bold ${dateCls}`}>{formatDate(inv.notifyDate)}</span>
          {daysLeft !== null && (
            <p className={`text-[10px] font-extrabold uppercase tracking-wide mt-0.5 ${
              daysLeft < 0  ? 'text-red-400' :
              daysLeft === 0 ? 'text-red-600 dark:text-red-400' :
              'text-gray-400 dark:text-gray-500'
            }`}>
              {daysLeft < 0  ? `${Math.abs(daysLeft)} ditë e kaluar` :
               daysLeft === 0 ? 'Sot!' :
               `Pas ${daysLeft} ditë`}
            </p>
          )}
        </div>
      </td>

      {/* Vlera */}
      <td className="table-td">
        <span className="font-mono font-bold text-gray-900 dark:text-white">{fmt(inv.amount)}</span>
      </td>

      {/* Veprime */}
      <td className="table-td">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {phone ? (
            <>
              <a
                href={`https://wa.me/${phone}?text=${msg}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 border border-green-200/60 dark:border-green-800/50 text-green-600 dark:text-green-400 text-[11px] font-bold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors whitespace-nowrap"
              >
                <MessageCircle size={13} /> WA
              </a>
              <a
                href={`https://t.me/+${phone}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-900/30 border border-sky-200/60 dark:border-sky-800/50 text-sky-600 dark:text-sky-400 text-[11px] font-bold rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors whitespace-nowrap"
              >
                <Send size={13} /> TG
              </a>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 italic">
              <PhoneOff size={12} /> Pa numër
            </span>
          )}
          <button
            onClick={() => onMarkSent(inv.id)}
            title="Hiqe nga lista — e keni njoftuar tashmë këtë klient"
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-[11px] font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 transition-colors whitespace-nowrap"
          >
            <CheckCircle2 size={13} /> Njoftuar
          </button>
        </div>
      </td>
    </tr>
  )
})

/* ── Section block ── */
const Section = memo(function Section({ title, color, items, today, onMarkSent, customerMap, itemsPerPage = 30 }) {
  const { fmt } = useApp()
  const [page, setPage] = useState(1)
  const [openDropdown, setOpenDropdown] = useState(null)

  if (!items.length) return null

  const getPhone = name => cleanPhone(customerMap.get(name)?.phone || '')
  const urgency  = color === 'red' ? 'high' : color === 'amber' ? 'medium' : 'low'

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIdx = (page - 1) * itemsPerPage
  const endIdx = startIdx + itemsPerPage
  const paginatedItems = items.slice(startIdx, endIdx)

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
          color === 'red'   ? 'bg-red-500 animate-ping' :
          color === 'amber' ? 'bg-amber-400' : 'bg-gray-400 dark:bg-gray-600'
        }`} />
        <h3 className={`text-sm font-bold tracking-tight ${
          color === 'red'   ? 'text-red-600 dark:text-red-400' :
          color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-300'
        }`}>{title}</h3>
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
          color === 'red'   ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' :
          color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
        }`}>{items.length}</span>
      </div>

      {/* Mobile Card View - Hidden on sm+ */}
      {paginatedItems.length > 0 && (
        <div className="sm:hidden space-y-2 mb-4">
          {paginatedItems.map(inv => {
            const phone = getPhone(inv.customer)
            const msg = encodeURIComponent(`Përshëndetje!\nAbonimit juaj skadon më ${inv.subscriptionExpiry}.\nJu lutem, rinovoni për të vazhduar shërbimin.\nFaleminderit!`)
            const daysLeft = inv.notifyDate
              ? Math.round((new Date(inv.notifyDate) - new Date(today)) / 86_400_000)
              : null

            return (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-2xl p-3 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  {/* Col 1: Avatar + Customer + Expiry + Notify */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                      {inv.customer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate dark:text-white">{inv.customer}</p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{inv.id}</p>
                      <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-1">{formatDate(inv.subscriptionExpiry)}</p>
                    </div>
                  </div>

                  {/* Col 2: Amount + Product */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono font-bold text-gray-900 text-sm dark:text-white">{fmt(inv.amount)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">{inv.type || inv.product || '—'}</p>
                  </div>

                  {/* Col 3: Contact - Dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white transition-all"
                      onClick={() => setOpenDropdown(openDropdown === inv.id ? null : inv.id)}
                    >
                      ⋮
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === inv.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-50 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                        {phone && (
                          <>
                            <a
                              href={`https://wa.me/${phone}?text=${msg}`}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full text-left px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <MessageCircle size={14}/> WhatsApp
                            </a>
                            <a
                              href={`https://t.me/+${phone}`}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full text-left px-3 py-2 text-sm text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Send size={14}/> Telegram
                            </a>
                          </>
                        )}
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2"
                          onClick={() => { setOpenDropdown(null); onMarkSent(inv.id) }}
                        >
                          <CheckCircle2 size={14}/> Njoftuar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile pagination - hidden on sm+ */}
      {totalPages > 1 && (
        <div className="sm:hidden flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
          >
            ←
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">{page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
          >
            →
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Klienti</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Skadon</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Njoftim</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">Vlera</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Veprime</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(inv => (
                <SubRow
                  key={inv.id}
                  inv={inv}
                  phone={getPhone(inv.customer)}
                  urgency={urgency}
                  today={today}
                  onMarkSent={onMarkSent}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination for section - hidden on mobile */}
      {totalPages > 1 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
          >
            ←
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">{page}/{totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/50"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
})

/* ══════════════════════════════════════════════════════════
   Main page
══════════════════════════════════════════════════════════ */
export default function Subscriptions() {
  const { invoices, customers, setInvoices, showToast } = useApp()
  const [showInfo, setShowInfo] = useState(false)
  const [search, setSearch] = useState('')

  const today  = new Date().toISOString().slice(0, 10)
  const week7  = addDays(today, 7)

  const customerMap = useMemo(() => new Map(customers.map(c => [c.name, c])), [customers])

  /* Vetëm abonimi me notifyDate nga Korriku e tutje, dhe që s'janë shënuar
     ende si të njoftuar (as automatikisht nga cron-i, as manualisht këtu) */
  const { withNotify, urgent, thisWeek, future } = useMemo(() => {
    const notified = invoices
      .filter(i => i.notifyDate && i.notifyDate >= AUTO_FROM && !i.renewalReminderSentAt)
      .sort((a, b) => a.notifyDate.localeCompare(b.notifyDate))
    return {
      withNotify: notified,
      urgent:   notified.filter(i => i.notifyDate <= today),
      thisWeek: notified.filter(i => i.notifyDate > today && i.notifyDate <= week7),
      future:   notified.filter(i => i.notifyDate > week7),
    }
  }, [invoices, today, week7])

  /* Njoftimet dërgohen automatikisht një herë në ditë nga një cron job
     server-side (api/cron/send-renewal-reminders.js), vetëm për abonimet
     me datë njoftimi pikërisht sot — jo për backlog-un e vjetër. Kjo faqe
     nuk dërgon më vetë në hapje (ishte rrezik: do të kishte dërguar tërë
     "urgent" backlog-un e vjetër menjëherë sapo dikush ta hapte faqen). */

  const totalPending = urgent.length

  /* Filtrimi sipas kërkimit — vetëm shfaqja, nuk prek listat/kalkulimet burimore */
  const searchLower = search.trim().toLowerCase()
  const matchesSearch = useCallback(inv =>
    !searchLower || inv.customer.toLowerCase().includes(searchLower) || inv.id.toLowerCase().includes(searchLower),
  [searchLower])
  const urgentFiltered   = useMemo(() => urgent.filter(matchesSearch),   [urgent, matchesSearch])
  const thisWeekFiltered = useMemo(() => thisWeek.filter(matchesSearch), [thisWeek, matchesSearch])
  const futureFiltered   = useMemo(() => future.filter(matchesSearch),   [future, matchesSearch])
  const noSearchResults  = withNotify.length > 0 && searchLower &&
    !urgentFiltered.length && !thisWeekFiltered.length && !futureFiltered.length

  /* Shëno një njoftim si të dërguar/kryer -- e heq nga lista përgjithmonë
     (deri sa fatura tjetër e rinovimit të krijojë datë të re njoftimi) */
  const handleMarkSent = useCallback((invId) => {
    setInvoices(prev => prev.map(i =>
      // _synced: null forces diffSync to detect the change and push it to
      // Supabase -- without it, the fast-path comparison in AppContext's
      // diffSync sees an unchanged _synced timestamp and silently skips the
      // upsert, so the mark would only live in local state until refresh.
      i.id === invId ? { ...i, renewalReminderSentAt: new Date().toISOString(), _synced: null } : i
    ))
    showToast?.('U shënua si njoftuar', 'success')
  }, [setInvoices, showToast])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight dark:text-white">
            <Bell size={20} className="text-red-500 animate-bounce" />
            Njoftimet e Abonimit
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 font-medium dark:text-gray-400">{withNotify.length} abonim gjithsej</span>
            {totalPending > 0 && (
              <>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md border border-red-200/60 dark:border-red-900/50">
                  {totalPending} kërkojnë vëmendje sot
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <Calendar size={14} className="text-red-500" />
          <span>Sot: {today}</span>
        </div>
      </div>

      {/* Info: automation runs server-side now, not from this page -- collapsible, off by default */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200/80 dark:border-sky-900/50 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowInfo(v => !v)}
          className="w-full flex items-center gap-3 p-3.5 text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bell size={16} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-sky-900 dark:text-sky-200">Njoftimet dërgohen automatikisht çdo ditë në orën 09:00</p>
            <p className="text-[11px] text-sky-700 dark:text-sky-300/80 mt-0.5">Sistemi dërgon njoftime automatike në WhatsApp dhe Telegram për të gjitha faturat që skadojnë së shpejti.</p>
          </div>
          {showInfo ? <ChevronUp size={16} className="text-sky-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-sky-500 flex-shrink-0" />}
        </button>
        {showInfo && (
          <div className="px-4 pb-4">
            <div className="bg-sky-100 dark:bg-sky-900/30 rounded-lg p-2.5 text-xs text-sky-900 dark:text-sky-200">
              <p className="font-semibold mb-1">Konfigurimi (WhatsApp Cloud API, nëse s'është bërë ende):</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                <li>Shko te <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">developers.facebook.com</a>, krijo një Business App, shto produktin "WhatsApp" dhe lidh numrin</li>
                <li>Krijo një template mesazhi (kategoria "Utility", 2 parametra: emri dhe data e skadimit) dhe prit miratimin nga Meta</li>
                <li>Merr <strong>Phone Number ID</strong> dhe një <strong>access token të përhershëm</strong> (Business Settings → System Users)</li>
                <li>Shtoi te Vercel Dashboard → Settings → Environment Variables si <strong>WHATSAPP_PHONE_NUMBER_ID</strong>, <strong>WHATSAPP_ACCESS_TOKEN</strong>, <strong>WHATSAPP_TEMPLATE_NAME</strong>, pastaj redeploy</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 p-5 shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl font-black text-red-600 dark:text-red-400 font-mono tracking-tight">{urgent.length}</span>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Duhen kontaktuar sot</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Abonime me njoftim aktiv për sot</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 p-5 shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl font-black text-amber-500 dark:text-amber-400 font-mono tracking-tight">{thisWeek.length}</span>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Këtë javë (7 ditë)</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Njoftime në radhë për përpunim</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700 p-5 shadow-sm">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl font-black text-gray-800 dark:text-gray-100 font-mono tracking-tight">{future.length}</span>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">Ardhshme</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Abonime aktive pa skadencë të afërt</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {withNotify.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <p className="text-base font-semibold text-gray-500 mb-1 dark:text-gray-400">Gjithçka është e rregullt</p>
          <p className="text-sm text-gray-400 max-w-xs dark:text-gray-500">
            Nuk ka asnjë klient që pret njoftim tani. Njoftime të reja shfaqen automatikisht sipas datës së skadimit të abonimit.
          </p>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kërko klientin ose ID e faturës..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 dark:focus:ring-red-900/20"
              />
            </div>
            <button
              onClick={() => setSearch('')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={14} className="text-gray-400 dark:text-gray-500" />
              <span>Rifresko</span>
            </button>
          </div>

          {noSearchResults ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nuk u gjet asnjë abonim</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Provo një kërkim tjetër</p>
            </div>
          ) : (
            <>
              <Section title="Sot & Të kaluara — Kërkon vëmendje!" color="red"   items={urgentFiltered}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
              <Section title="Kjo javë (7 ditët e ardhshme)"        color="amber" items={thisWeekFiltered} today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
              <Section title="Ardhshme"                             color="blue"  items={futureFiltered}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
            </>
          )}
        </>
      )}
    </div>
  )
}
