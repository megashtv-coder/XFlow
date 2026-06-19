import { useApp } from '../context/AppContext'
import { ChevronLeft } from 'lucide-react'

export default function CurrentYearExpenses() {
  const { expenses, fmt, navigate } = useApp()

  const thisYear = new Date().getFullYear().toString()
  const data = expenses.filter(e => e.date?.startsWith(thisYear)).sort((a, b) => new Date(b.date) - new Date(a.date))

  const CAT_COLORS = {
    'Shërbime': '#2563eb',
    'Software': '#7c3aed',
    'Marketing': '#d97706',
    'Ushqim': '#059669',
    'Pajisje': '#dc2626',
    'Udhëtime': '#be185d',
    'Tjera': '#6b7280',
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shpenzime {thisYear}</h1>
          <p className="text-sm text-gray-500 mt-1">Lista e shpenzimeve për vitin aktual</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <p className="font-semibold text-gray-800">{data.length} shpenzim{data.length !== 1 ? 'e' : ''}</p>
          <p className="text-sm font-bold text-gray-600">{fmt(data.reduce((s, e) => s + e.amount, 0))}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nuk ka shpenzime për këtë periudhë</div>
          ) : (
            data.map(exp => (
              <div key={exp.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: CAT_COLORS[exp.category] || '#6b7280' }} />
                      <p className="font-semibold text-gray-800">{exp.description}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{exp.category}</p>
                    <p className="text-xs text-gray-400 mt-1">{exp.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800">{fmt(exp.amount)}</p>
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
