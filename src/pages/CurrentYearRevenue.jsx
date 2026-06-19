import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'

export default function CurrentYearRevenue() {
  const { payments, fmt, navigate } = useApp()

  const thisYear = new Date().getFullYear().toString()
  const data = payments.filter(p => p.date?.startsWith(thisYear)).sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Të ardhura {thisYear}</h1>
          <p className="text-sm text-gray-500 mt-1">Lista e pagesave të pranuara për vitin aktual</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <p className="font-semibold text-gray-800">{data.length} pagese{data.length !== 1 ? '' : ''}</p>
          <p className="text-sm font-bold text-gray-600">{fmt(data.reduce((s, p) => s + p.amount, 0))}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nuk ka pagesa për këtë periudhë</div>
          ) : (
            data.map(pay => (
              <div key={pay.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{pay.invoiceNumber}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{pay.customerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{pay.method}</span>
                      <span className="text-xs text-gray-400">{pay.date}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-600">{fmt(pay.amount)}</p>
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
