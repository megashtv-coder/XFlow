import { useState } from 'react'
import { Upload, Plus, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function ImportData() {
  const { setInvoices, setPayments, showToast } = useApp()

  const [tab, setTab] = useState('invoices') // 'invoices' or 'payments'
  const [invRows, setInvRows] = useState([{ invNum: '', customer: '', date: '', amount: '', items: '' }])
  const [payRows, setPayRows] = useState([{ invNum: '', customer: '', date: '', amount: '', method: '', depositedTo: 'Enndy' }])

  /* ── INVOICES ── */
  const addInvRow = () => setInvRows([...invRows, { invNum: '', customer: '', date: '', amount: '', items: '' }])
  const removeInvRow = i => setInvRows(invRows.filter((_, idx) => idx !== i))
  const updateInvRow = (i, field, value) => {
    const newRows = [...invRows]
    newRows[i][field] = value
    setInvRows(newRows)
  }

  const saveInvoices = () => {
    const newInvs = invRows
      .filter(r => r.invNum && r.customer && r.amount)
      .map(r => ({
        id: r.invNum.toUpperCase(),
        customer: r.customer,
        date: r.date || new Date().toISOString().slice(0, 10),
        amount: parseFloat(r.amount) || 0,
        status: 'pending',
        items: r.items ? [{ desc: r.items, qty: 1, price: parseFloat(r.amount) || 0 }] : [],
        subscriptionExpiry: null,
        notifyDate: null,
      }))

    if (newInvs.length === 0) {
      showToast('Nuk ka fatura për të importuar!')
      return
    }

    setInvoices(prev => [...newInvs, ...prev])
    showToast(`✓ ${newInvs.length} fatura u importuan!`)
    setInvRows([{ invNum: '', customer: '', date: '', amount: '', items: '' }])
  }

  /* ── PAYMENTS ── */
  const addPayRow = () => setPayRows([...payRows, { invNum: '', customer: '', date: '', amount: '', method: '', depositedTo: 'Enndy' }])
  const removePayRow = i => setPayRows(payRows.filter((_, idx) => idx !== i))
  const updatePayRow = (i, field, value) => {
    const newRows = [...payRows]
    newRows[i][field] = value
    setPayRows(newRows)
  }

  const savePayments = () => {
    const newPays = payRows
      .filter(r => r.invNum && r.amount)
      .map((r, idx) => ({
        id: `PAY-${r.invNum.toUpperCase()}-${idx}`,
        invoiceId: r.invNum.toUpperCase(),
        customer: r.customer,
        date: r.date || new Date().toISOString().slice(0, 10),
        amount: parseFloat(r.amount) || 0,
        fee: 0,
        net: parseFloat(r.amount) || 0,
        method: r.method || 'Kesh',
        depositAccount: r.method || 'Kesh',
        depositedTo: r.depositedTo,
        reference: '',
        notes: 'Manual import',
      }))

    if (newPays.length === 0) {
      showToast('Nuk ka pagesa për të importuar!')
      return
    }

    setPayments(prev => [...newPays, ...prev])
    showToast(`✓ ${newPays.length} pagesa u importuan!`)
    setPayRows([{ invNum: '', customer: '', date: '', amount: '', method: '', depositedTo: 'Enndy' }])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Upload size={24} /> Import Data
        </h1>
        <p className="text-sm text-gray-500">Shto manuale faturat dhe pagesat me numra</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('invoices')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            tab === 'invoices'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Faturat
        </button>
        <button
          onClick={() => setTab('payments')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            tab === 'payments'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Pagesat
        </button>
      </div>

      {/* INVOICES TAB */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Numri i Faturës *</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Klienti *</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Data</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700">Shuma (€) *</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Produkti/Shërbimi</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {invRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="INV-001"
                        value={row.invNum}
                        onChange={e => updateInvRow(i, 'invNum', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="Emri i klientit"
                        value={row.customer}
                        onChange={e => updateInvRow(i, 'customer', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="form-control text-xs w-full"
                        value={row.date}
                        onChange={e => updateInvRow(i, 'date', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="form-control text-xs w-full text-right"
                        placeholder="0.00"
                        step="0.01"
                        value={row.amount}
                        onChange={e => updateInvRow(i, 'amount', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="p.sh. 3 muaj abonim"
                        value={row.items}
                        onChange={e => updateInvRow(i, 'items', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeInvRow(i)}
                        className="text-red-500 hover:text-red-700"
                        title="Fshi rreshtin"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addInvRow}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              <Plus size={14} /> Shto rresht
            </button>
            <button
              onClick={saveInvoices}
              className="btn btn-primary text-xs ml-auto"
            >
              Importo Faturat
            </button>
          </div>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {tab === 'payments' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Numri i Faturës *</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Klienti</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Data</th>
                  <th className="text-right px-3 py-2 font-semibold text-gray-700">Shuma (€) *</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Metoda</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Depozituar te</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {payRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="INV-001"
                        value={row.invNum}
                        onChange={e => updatePayRow(i, 'invNum', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="Emri i klientit"
                        value={row.customer}
                        onChange={e => updatePayRow(i, 'customer', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        className="form-control text-xs w-full"
                        value={row.date}
                        onChange={e => updatePayRow(i, 'date', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="form-control text-xs w-full text-right"
                        placeholder="0.00"
                        step="0.01"
                        value={row.amount}
                        onChange={e => updatePayRow(i, 'amount', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="form-control text-xs w-full"
                        placeholder="PayPal, Stripe, Kesh..."
                        value={row.method}
                        onChange={e => updatePayRow(i, 'method', e.target.value)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="form-control text-xs w-full"
                        value={row.depositedTo}
                        onChange={e => updatePayRow(i, 'depositedTo', e.target.value)}
                      >
                        <option value="Enndy">Enndy</option>
                        <option value="Samki">Samki</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removePayRow(i)}
                        className="text-red-500 hover:text-red-700"
                        title="Fshi rreshtin"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addPayRow}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-1"
            >
              <Plus size={14} /> Shto rresht
            </button>
            <button
              onClick={savePayments}
              className="btn btn-primary text-xs ml-auto"
            >
              Importo Pagesat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
