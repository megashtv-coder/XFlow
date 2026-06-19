import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'

export default function PendingClientInvoices() {
  const { invoices, customers, fmt, navigate } = useApp()

  const getType = name => customers.find(c => c.name === name)?.type || 'individual'
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
  const data = pendingInvoices.filter(i => getType(i.customer) !== 'reseller').sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Në pritje — Klient</h1>
          <p className="text-sm text-gray-500 mt-1">Fatura të papaguara — Klientë individualë</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <p className="font-semibold text-gray-800">{data.length} faturë{data.length !== 1 ? 'a' : ''}</p>
          <p className="text-sm font-bold text-gray-600">{fmt(data.reduce((s, i) => s + i.amount, 0))}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nuk ka fatura të papaguara</div>
          ) : (
            data.map(inv => (
              <div key={inv.id} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('invoices')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{inv.customer}</p>
                    <p className="text-xs text-gray-400 mt-1">{inv.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800">{fmt(inv.amount)}</p>
                    <p className={`text-xs font-semibold mt-1 ${inv.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`}>
                      {inv.status === 'overdue' ? 'VONUAR' : 'PENDING'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
