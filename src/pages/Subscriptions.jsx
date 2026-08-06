import { useState, memo, useMemo, useCallback } from 'react'
import { Bell, MessageCircle, Send, Calendar, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
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
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors dark:border-gray-700">
      {/* Klienti */}
      <td className="table-td">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-500 flex-shrink-0">
            {inv.customer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm dark:text-gray-100">{inv.customer}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">{inv.id}</p>
          </div>
        </div>
      </td>

      {/* Data skadimit */}
      <td className="table-td">
        <span className="font-semibold text-red-600 text-sm">{formatDate(inv.subscriptionExpiry)}</span>
      </td>

      {/* Data njoftimit */}
      <td className="table-td">
        <div>
          <span className={`text-sm ${dateCls}`}>{formatDate(inv.notifyDate)}</span>
          {daysLeft !== null && (
            <p className={`text-[11px] mt-0.5 ${
              daysLeft < 0  ? 'text-red-400' :
              daysLeft === 0 ? 'text-red-500 font-bold' :
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
        <span className="font-bold text-gray-800 dark:text-gray-100">{fmt(inv.amount)}</span>
      </td>

      {/* Veprime */}
      <td className="table-td">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {phone ? (
            <>
              <a
                href={`https://wa.me/${phone}?text=${msg}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors whitespace-nowrap"
              >
                <MessageCircle size={13} /> WA
              </a>
              <a
                href={`https://t.me/+${phone}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-900/40 text-sky-700 dark:text-sky-400 text-xs font-semibold rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors whitespace-nowrap"
              >
                <Send size={13} /> TG
              </a>
            </>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600 italic">Pa numër</span>
          )}
          <button
            onClick={() => onMarkSent(inv.id)}
            title="Hiqe nga lista — e keni njoftuar tashmë këtë klient"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 transition-colors whitespace-nowrap"
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
        <span className={`w-2.5 h-2.5 rounded-full ${
          color === 'red'   ? 'bg-red-500' :
          color === 'amber' ? 'bg-amber-400' : 'bg-red-400'
        }`} />
        <h3 className={`text-sm font-bold ${
          color === 'red'   ? 'text-red-700' :
          color === 'amber' ? 'text-amber-700' : 'text-gray-600 dark:text-gray-300'
        }`}>{title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          color === 'red'   ? 'bg-red-50 text-red-500' :
          color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'
        }`}>{items.length}</span>
      </div>

      {/* Mobile Card View - Hidden on sm+ */}
      {paginatedItems.length > 0 && (
        <div className="sm:hidden space-y-2 mb-4">
          {paginatedItems.map(inv => {
            const [openDropdown, setOpenDropdown] = useState(null)
            const phone = getPhone(inv.customer)
            const msg = encodeURIComponent(`Përshëndetje!\nAbonimit juaj skadon më ${inv.subscriptionExpiry}.\nJu lutem, rinovoni për të vazhduar shërbimin.\nFaleminderit!`)
            const daysLeft = inv.notifyDate
              ? Math.round((new Date(inv.notifyDate) - new Date(today)) / 86_400_000)
              : null

            return (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-3 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-start gap-2">
                  {/* Col 1: Customer + Expiry + Notify */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate dark:text-gray-100">{inv.customer}</p>
                    <p className="text-xs font-bold text-red-500 mt-0.5">{formatDate(inv.subscriptionExpiry)}</p>
                    <p className="text-xs font-bold text-red-600 mt-0.5">{formatDate(inv.notifyDate)}</p>
                  </div>

                  {/* Col 2: Amount + Product */}
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm dark:text-gray-100">{fmt(inv.amount)}</p>
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
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50 dark:bg-gray-800 dark:border-gray-700">
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

      <div className="card overflow-hidden hidden sm:block">
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-gray-50 bg-white dark:bg-gray-800 dark:border-gray-700">
                <th className="table-th">Klienti</th>
                <th className="table-th">Skadon</th>
                <th className="table-th">Njoftim</th>
                <th className="table-th">Vlera</th>
                <th className="table-th text-right">Veprime</th>
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
            <Bell size={20} className="text-red-500" />
            Njoftimet e Abonimit
          </h2>
          <p className="text-sm text-gray-400 mt-0.5 dark:text-gray-500">
            {withNotify.length} abonim ·{' '}
            {totalPending > 0
              ? <span className="text-red-500 font-semibold">{totalPending} kërkon vëmendje sot</span>
              : <span className="text-emerald-500 font-semibold">Gjithçka është e rregullt</span>
            }
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs text-gray-400 flex items-center gap-1.5 dark:text-gray-500">
            <Calendar size={13} />
            Sot: <span className="font-semibold text-gray-600 dark:text-gray-300">{today}</span>
          </div>
        </div>
      </div>

      {/* Info: automation runs server-side now, not from this page -- collapsible, off by default */}
      <div className="mb-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowInfo(v => !v)}
          className="w-full flex items-center justify-between gap-2 p-4 text-left"
        >
          <p className="text-sm font-bold text-blue-800 dark:text-blue-300">🔔 Njoftimet dërgohen automatikisht çdo ditë</p>
          {showInfo ? <ChevronUp size={16} className="text-blue-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-blue-500 flex-shrink-0" />}
        </button>
        {showInfo && (
          <div className="px-4 pb-4">
            <p className="text-xs text-blue-700 dark:text-blue-300/80">
              Një herë në ditë sistemi dërgon vetë një mesazh WhatsApp për abonimet që skadojnë pas 7 ditësh (vetëm ditën kur bie data e njoftimit — jo për faturat e vjetra në listën më poshtë). Nga kjo faqe mund të dërgosh edhe manualisht me butonat WA/TG te çdo rresht, ose ta shënosh si "Njoftuar" që të hiqet nga lista.
            </p>
            <div className="mt-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2.5 text-xs text-blue-900 dark:text-blue-200">
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
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card !border-l-4 !border-l-red-400">
          <p className="text-3xl font-bold text-red-600">{urgent.length}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium dark:text-gray-500">Duhen kontaktuar sot</p>
        </div>
        <div className="stat-card !border-l-4 !border-l-amber-400">
          <p className="text-3xl font-bold text-amber-500">{thisWeek.length}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium dark:text-gray-500">Këtë javë (7 ditë)</p>
        </div>
        <div className="stat-card !border-l-4 !border-l-red-400">
          <p className="text-3xl font-bold text-red-500">{future.length}</p>
          <p className="text-xs text-gray-400 mt-1 font-medium dark:text-gray-500">Ardhshme</p>
        </div>
      </div>

      {/* Empty state */}
      {withNotify.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
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
          <Section title="Sot & Të kaluara — Kërkon vëmendje!" color="red"   items={urgent}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
          <Section title="Kjo javë (7 ditët e ardhshme)"        color="amber" items={thisWeek} today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
          <Section title="Ardhshme"                             color="blue"  items={future}   today={today} onMarkSent={handleMarkSent} customerMap={customerMap} />
        </>
      )}
    </div>
  )
}
