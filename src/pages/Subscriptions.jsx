import { useState, memo, useMemo, useCallback } from 'react'
import { MessageCircle, Send, Calendar, CheckCircle2, AlertTriangle, Clock, Search, RefreshCw, PhoneOff, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react'
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

const MONTHS_SQ = ['Janar','Shkurt','Mars','Prill','Maj','Qershor','Korrik','Gusht','Shtator','Tetor','Nëntor','Dhjetor']
const shortDate = d => `${parseInt(d.slice(8, 10), 10)} ${MONTHS_SQ[parseInt(d.slice(5, 7), 10) - 1]}`

function buildRenewalMsg(inv) {
  const firstName = (inv.customer || '').split(' ')[0]
  return `Pershendetje ${firstName}!\nDeshironim t'ju kujtojme se abonimi juaj per TV skadon me date ${formatDate(inv.subscriptionExpiry)}.\nJu lutem na kontaktoni per rinovim.\nFaleminderit!\nMe respekt, PREDATOR - MEGA SH TV`
}

/* ── Single row card ── */
const SubRow = memo(function SubRow({ inv, phone, urgency, today, onMarkSent }) {
  const { fmt } = useApp()
  const msg = encodeURIComponent(buildRenewalMsg(inv))

  const dateCls =
    urgency === 'high'   ? 'text-red-600 dark:text-accent-soft font-bold' :
    urgency === 'medium' ? 'text-amber-600 dark:text-amber-400 font-semibold' :
                           'text-gray-600 dark:text-gray-400'
  // Dark mode: i njëjti ton për datën e skadimit dhe tekstin "X ditë"
  const toneDark =
    urgency === 'high'   ? 'dark:text-accent-soft' :
    urgency === 'medium' ? 'dark:text-amber-400' :
                           'dark:text-gray-400'
  const avatarDark =
    urgency === 'high'   ? 'dark:text-accent-soft' :
    urgency === 'medium' ? 'dark:text-amber-300' :
                           'dark:text-[#c0c1ff]'

  const daysLeft = inv.notifyDate
    ? Math.round((new Date(inv.notifyDate) - new Date(today)) / 86_400_000)
    : null

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors dark:border-dk-low dark:hover:bg-dk-low/50 group">
      {/* Klienti */}
      <td className="table-td">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 dark:w-10 dark:h-10 rounded-full dark:rounded-lg bg-red-100 dark:bg-dk-high flex items-center justify-center text-xs dark:text-sm font-bold text-red-600 ${avatarDark} flex-shrink-0`}>
            {inv.customer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm dark:text-gray-100 dark:text-[15px] dark:font-semibold">{inv.customer}</p>
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{inv.id}</p>
          </div>
        </div>
      </td>

      {/* Data skadimit */}
      <td className="table-td">
        <span className={`font-mono font-bold text-red-600 ${toneDark} text-sm`}>{formatDate(inv.subscriptionExpiry)}</span>
      </td>

      {/* Data njoftimit */}
      <td className="table-td">
        <div className="font-mono">
          <span className={`text-sm font-bold ${dateCls}`}>{formatDate(inv.notifyDate)}</span>
          {daysLeft !== null && (
            <p className={`text-[10px] font-extrabold uppercase tracking-wide mt-0.5 ${
              daysLeft < 0  ? `text-red-400 ${toneDark}` :
              daysLeft === 0 ? 'text-red-600 dark:text-accent-soft' :
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
                className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-emerald-950/60 border border-green-200/60 dark:border-transparent text-green-600 dark:text-emerald-400 text-[11px] font-bold rounded-lg hover:bg-green-100 dark:hover:bg-emerald-900 transition-colors whitespace-nowrap"
              >
                <MessageCircle size={13} /> WA
              </a>
              <a
                href={`https://t.me/+${phone}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/60 dark:border-transparent text-sky-600 dark:text-sky-400 text-[11px] font-bold rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors whitespace-nowrap"
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
            className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-dk-card border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 text-[11px] font-bold rounded-lg hover:bg-red-50 dark:hover:bg-dk-high hover:text-red-600 dark:hover:text-gray-100 hover:border-red-200 dark:hover:border-transparent transition-colors whitespace-nowrap"
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
      <div className="flex items-center gap-2 mb-3 dark:hidden">
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
              <div key={inv.id} className="bg-white border border-gray-200 rounded-2xl p-3 dark:bg-dk-low dark:border-white/[0.07] shadow-sm">
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

      <div className="bg-white dark:bg-dk-side rounded-2xl dark:rounded-xl border border-gray-200 dark:border-white/[0.07] shadow-sm overflow-hidden hidden sm:block">
        <div className="overflow-auto">
          <table className="sub-tbl w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-100 dark:border-transparent bg-gray-50/50 dark:bg-dk-low/70">
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-[#8b8e99] uppercase tracking-wider text-left">Klienti</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-[#8b8e99] uppercase tracking-wider text-left">Skadon</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-[#8b8e99] uppercase tracking-wider text-left">Njoftim</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-[#8b8e99] uppercase tracking-wider text-left">Vlera</th>
                <th className="py-3 px-4 text-[10px] font-extrabold text-gray-400 dark:text-[#8b8e99] uppercase tracking-wider text-right">Veprime</th>
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

        {/* Dark mode: shiriti i poshtëm me numrin e shfaqur + faqosjen */}
        <div className="hidden dark:flex items-center justify-between px-6 py-4 bg-dk-low text-[#8b8e99]">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Duke shfaqur</span>
            <span className="text-xs font-semibold text-gray-100">{paginatedItems.length}</span>
            <span>nga</span>
            <span className="text-xs font-semibold text-gray-100">{items.length}</span>
            <span>abonime</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-dk-card flex items-center justify-center text-gray-100 hover:bg-dk-high disabled:opacity-40 transition-colors"
                title="Faqja e mëparshme"
              ><ArrowLeft size={16} /></button>
              <span className="px-2 font-mono">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg bg-dk-card flex items-center justify-center text-gray-100 hover:bg-dk-high disabled:opacity-40 transition-colors"
                title="Faqja tjetër"
              ><ArrowRight size={16} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination for section - hidden on mobile */}
      {totalPages > 1 && (
        <div className="hidden sm:flex dark:!hidden items-center justify-center gap-2 mt-3">
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
  const { invoices, customers, setInvoices, showToast, darkMode } = useApp()
  const [search, setSearch] = useState('')
  const [tabState, setTab] = useState(null)   // vetëm dark mode: kategoria e hapur (si skedë)

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

  /* Filtrimi sipas kërkimit — vetëm shfaqja, nuk prek listat/kalkulimet burimore */
  const searchLower = search.trim().toLowerCase()
  const matchesSearch = useCallback(inv =>
    !searchLower || inv.customer.toLowerCase().includes(searchLower) || inv.id.toLowerCase().includes(searchLower),
  [searchLower])
  const urgentFiltered   = useMemo(() => urgent.filter(matchesSearch),   [urgent, matchesSearch])
  const thisWeekFiltered = useMemo(() => thisWeek.filter(matchesSearch), [thisWeek, matchesSearch])
  const futureFiltered   = useMemo(() => future.filter(matchesSearch),   [future, matchesSearch])
  // Dark mode shfaq një kategori në herë (skeda); default = e para që ka të dhëna
  const tab = tabState || (urgent.length ? 'urgent' : thisWeek.length ? 'week' : 'future')
  const activeCount = tab === 'urgent' ? urgentFiltered.length : tab === 'week' ? thisWeekFiltered.length : futureFiltered.length
  const TABS = [
    { key: 'urgent', label: 'Sot & Të kaluara — Kërkon vëmendje!', dot: 'bg-accent',   badge: 'bg-accent text-accent-on', count: urgent.length },
    { key: 'week',   label: 'Kjo javë (7 ditët e ardhshme)',        dot: 'bg-amber-400', badge: 'bg-dk-high text-amber-400', count: thisWeek.length },
    { key: 'future', label: 'Ardhshme',                              dot: 'bg-gray-500',  badge: 'bg-dk-high text-gray-400',  count: future.length },
  ]
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
      {/* Titulli "Njoftimet e Abonimit" dhe data tani jetojnë te header-i global
         (Header.jsx, kur page === 'subscriptions'). Numri/badge-i dhe kutia e
         informacionit për dërgimin automatik u hoqën — s'kishte nevojë të mbeteshin. */}

      {/* Summary stat cards — në dark mode janë klikueshme dhe kalojnë skedën poshtë */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="relative overflow-hidden bg-white dark:bg-dk-low rounded-2xl dark:rounded-xl border border-gray-200/90 dark:border-transparent dark:border-l-4 dark:border-l-accent p-5 dark:p-6 shadow-sm dark:cursor-pointer dark:hover:bg-dk-card transition-colors"
          onClick={() => { if (darkMode) setTab('urgent') }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 dark:hidden" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl dark:text-[32px] font-black text-red-600 dark:text-gray-100 font-mono dark:font-sans tracking-tight">{urgent.length.toLocaleString('en-US')}</span>
              <p className="text-xs dark:text-base font-bold dark:font-semibold text-gray-700 dark:text-accent mt-1">Duhen kontaktuar sot</p>
              <p className="text-[11px] dark:text-xs text-gray-400 dark:text-gray-500 mt-0.5">Abonime me njoftim aktiv për sot</p>
            </div>
            <div className="w-9 h-9 dark:w-10 dark:h-10 rounded-xl dark:rounded-lg bg-red-50 dark:bg-[#93000a]/40 text-red-500 dark:text-[#ffb4ab] flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="hidden dark:flex items-center justify-between mt-4 pt-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-accent-soft"><span className="w-1.5 h-1.5 rounded-full bg-accent-soft animate-ping" />Kërkon vëmendje të menjëhershme</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        </div>
        <div
          className="relative overflow-hidden bg-white dark:bg-dk-low rounded-2xl dark:rounded-xl border border-gray-200/90 dark:border-transparent dark:border-l-4 dark:border-l-amber-500 p-5 dark:p-6 shadow-sm dark:cursor-pointer dark:hover:bg-dk-card transition-colors"
          onClick={() => { if (darkMode) setTab('week') }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400 dark:hidden" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl dark:text-[32px] font-black text-amber-500 dark:text-gray-100 font-mono dark:font-sans tracking-tight">{thisWeek.length.toLocaleString('en-US')}</span>
              <p className="text-xs dark:text-base font-bold dark:font-semibold text-gray-700 dark:text-amber-400 mt-1">Këtë javë (7 ditë)</p>
              <p className="text-[11px] dark:text-xs text-gray-400 dark:text-gray-500 mt-0.5">Njoftime në radhë për përpunim</p>
            </div>
            <div className="w-9 h-9 dark:w-10 dark:h-10 rounded-xl dark:rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
          </div>
          <div className="hidden dark:flex items-center justify-between mt-4 pt-3 text-[11px] font-semibold">
            <span className="text-amber-400/90">Periudha: {shortDate(addDays(today, 1))} – {shortDate(week7)}</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        </div>
        <div
          className="relative overflow-hidden bg-white dark:bg-dk-low rounded-2xl dark:rounded-xl border border-gray-200/90 dark:border-transparent dark:border-l-4 dark:border-l-dk-line p-5 dark:p-6 shadow-sm dark:cursor-pointer dark:hover:bg-dk-card transition-colors"
          onClick={() => { if (darkMode) setTab('future') }}
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gray-300 dark:bg-gray-600 dark:hidden" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-3xl dark:text-[32px] font-black text-gray-800 dark:text-gray-100 font-mono dark:font-sans tracking-tight">{future.length.toLocaleString('en-US')}</span>
              <p className="text-xs dark:text-base font-bold dark:font-semibold text-gray-700 dark:text-gray-100 mt-1">Ardhshme</p>
              <p className="text-[11px] dark:text-xs text-gray-400 dark:text-gray-500 mt-0.5">Abonime aktive pa skadencë të afërt</p>
            </div>
            <div className="w-9 h-9 dark:w-10 dark:h-10 rounded-xl dark:rounded-lg bg-gray-100 dark:bg-dk-high text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
              <Calendar size={18} />
            </div>
          </div>
          <div className="hidden dark:flex items-center justify-between mt-4 pt-3 text-[11px] font-semibold">
            <span className="text-gray-400">Skadojnë pas {shortDate(week7)}</span>
            <ChevronRight size={16} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Skedat e kategorive — vetëm dark mode */}
      {darkMode && withNotify.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs shrink-0 transition-all ${
                tab === t.key ? 'bg-dk-high text-gray-100 font-semibold shadow-sm' : 'bg-dk-low hover:bg-dk-card text-gray-400 hover:text-gray-100 font-medium'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${t.dot}`} />
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.badge}`}>{t.count.toLocaleString('en-US')}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {withNotify.length === 0 ? (
        <div className="bg-white dark:bg-dk-low rounded-2xl border border-gray-200 dark:border-white/[0.07] flex flex-col items-center justify-center py-20 text-center">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-dk-side p-3 dark:p-2 rounded-2xl dark:rounded-xl border border-gray-200 dark:border-transparent shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Kërko klientin ose ID e faturës..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl dark:rounded-lg border border-gray-200 dark:border-transparent bg-gray-50 dark:bg-dk-low text-gray-900 dark:text-gray-100 dark:py-2.5 placeholder-gray-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 dark:focus:ring-accent/30"
              />
            </div>
            <button
              onClick={() => setSearch('')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl dark:rounded-lg border border-gray-200 dark:border-transparent bg-gray-50 dark:bg-dk-low text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dk-card dark:py-2.5 transition-colors"
            >
              <RefreshCw size={14} className="text-gray-400 dark:text-gray-500" />
              <span>Rifresko</span>
            </button>
          </div>

          {noSearchResults ? (
            <div className="bg-white dark:bg-dk-low rounded-2xl border border-gray-200 dark:border-white/[0.07] flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nuk u gjet asnjë abonim</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Provo një kërkim tjetër</p>
            </div>
          ) : (
            <>
              {(!darkMode || tab === 'urgent') && <Section title="Sot & Të kaluara — Kërkon vëmendje!" color="red"   items={urgentFiltered}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />}
              {(!darkMode || tab === 'week')   && <Section title="Kjo javë (7 ditët e ardhshme)"        color="amber" items={thisWeekFiltered} today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />}
              {(!darkMode || tab === 'future') && <Section title="Ardhshme"                             color="blue"  items={futureFiltered}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />}
              {darkMode && activeCount === 0 && (
                <div className="bg-dk-low rounded-xl border border-white/[0.07] py-12 text-center">
                  <p className="text-sm font-semibold text-gray-400">Asnjë abonim në këtë kategori</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
