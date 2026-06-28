import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Pencil, X, Calendar, User, CheckCircle2, Circle, ListTodo } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/dateFormat'
import { supabase } from '../lib/supabase'

function TaskModal({ task, onClose, onSave, customers }) {
  const [formData, setFormData] = useState(task || {
    id: `TSK-${Date.now()}`,
    customer: '',
    description: '',
    reminderDate: new Date().toISOString().slice(0, 10),
    completed: false,
  })

  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)

  const filteredCustomers = (customers || []).filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleSelectCustomer = (customerName) => {
    setFormData({ ...formData, customer: customerName })
    setCustomerSearch('')
    setShowCustomerDropdown(false)
  }

  const handleSubmit = () => {
    if (!formData.customer.trim() || !formData.description.trim()) {
      alert('Plotëso customer dhe përshkrim!')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-800">{task ? 'Ndrysho Detyrën' : 'Detyrë e Re'}</h2>
          <button onClick={onClose} className="icon-btn"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <label className="block text-xs font-bold text-gray-600 mb-2">Emri i Klientit</label>
            <input
              type="text"
              placeholder="Kërko klient..."
              value={customerSearch || formData.customer}
              onChange={(e) => {
                setCustomerSearch(e.target.value)
                setShowCustomerDropdown(true)
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {showCustomerDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">Nuk ka klientë</div>
                ) : (
                  filteredCustomers.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectCustomer(c.name)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      {c.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Data e Kujtesës</label>
            <input
              type="date"
              value={formData.reminderDate}
              onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Përshkrimi i Punës</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Përshkruaj detyrën..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows="6"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            >
              Ruaj
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anulo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task, customers, onEdit, onDelete, onToggle }) {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.reminderDate < today && !task.completed
  const isToday = task.reminderDate === today
  const isFuture = task.reminderDate > today && !task.completed

  let statusBadge, statusColor
  if (task.completed) {
    statusBadge = 'Kompletuar'
    statusColor = 'bg-green-100 text-green-700'
  } else if (isOverdue) {
    statusBadge = 'Vonuar'
    statusColor = 'bg-red-100 text-red-700'
  } else if (isToday) {
    statusBadge = 'Sot'
    statusColor = 'bg-amber-100 text-amber-700'
  } else {
    statusBadge = 'Ardhshme'
    statusColor = 'bg-blue-100 text-blue-700'
  }

  return (
    <div className={`rounded-xl overflow-hidden transition-all ${
      task.completed
        ? 'bg-gray-50 opacity-60 shadow-sm'
        : isOverdue
        ? 'bg-white shadow-md hover:shadow-lg border-l-4 border-l-red-500'
        : isToday
        ? 'bg-white shadow-md hover:shadow-lg border-l-4 border-l-amber-500'
        : 'bg-white shadow-sm hover:shadow-md border-l-4 border-l-blue-500'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-base ${
              task.completed ? 'line-through text-gray-400' : 'text-gray-900'
            }`}>
              {task.customer}
            </p>
            <p className="text-xs text-gray-600 mt-1">{task.description}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusColor}`}>
            {statusBadge}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(task.id)}
              className="flex-shrink-0 text-gray-300 hover:text-green-500 transition-colors"
              title="Shëno si i plotësuar"
            >
              {task.completed ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : (
                <Circle size={18} />
              )}
            </button>
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar size={14} />
              <p className="text-xs">{formatDate(task.reminderDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Ndrysho"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors"
              title="Fshi"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const appContext = useApp() || {}
  const { customers = [], showToast, logActivity, currentOrg } = appContext

  const [tasks, setTasks] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [currentOrg?.id])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('reminderdate', { ascending: true })

      if (error) throw error

      const formattedTasks = (data || []).map(t => ({
        ...t,
        reminderDate: t.reminderdate,
      }))

      setTasks(formattedTasks)
    } catch (e) {
      console.error('Error loading tasks:', e)
      try {
        const saved = localStorage.getItem('xflow_tasks')
        if (saved) setTasks(JSON.parse(saved))
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const saveTasks = async (newTasks) => {
    setTasks(newTasks)
    try {
      localStorage.setItem('xflow_tasks', JSON.stringify(newTasks))
    } catch (e) {
      console.error('Error saving to localStorage:', e)
    }
  }

  const syncTaskToSupabase = async (taskData) => {
    try {
      const { reminderDate, createdAt, ...rest } = taskData
      const payload = {
        ...rest,
        reminderdate: reminderDate,
        orgId: currentOrg?.id || 'default'
        // Note: createdAt removed - column doesn't exist in Supabase schema
      }

      console.log('[Tasks] Syncing to Supabase:', { id: taskData.id, action: taskData.id?.startsWith('TSK-') ? 'INSERT' : 'UPDATE' })

      if (taskData.id?.startsWith('TSK-')) {
        // New task - INSERT
        const { data, error: insertError } = await supabase
          .from('tasks')
          .insert([payload])
          .select()

        if (insertError) {
          console.error('[Tasks] Insert error:', insertError)
          throw insertError
        }
        console.log('[Tasks] Insert success:', data)
      } else {
        // Edit task - UPDATE
        const { data, error: updateError } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', taskData.id)
          .select()

        if (updateError) {
          console.error('[Tasks] Update error:', updateError)
          throw updateError
        }
        console.log('[Tasks] Update success:', data)
      }
      return true
    } catch (e) {
      console.error('[Tasks] Sync error:', e.message || e)
      return false
    }
  }

  const deleteTaskFromSupabase = async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      if (error) throw error
      return true
    } catch (e) {
      console.error('Error deleting task:', e)
      return false
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowModal(true)
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setShowModal(true)
  }

  const handleSaveTask = async (formData) => {
    try {
      const taskWithOrg = {
        ...formData,
        orgId: currentOrg?.id || 'default',
        createdAt: formData.createdAt || new Date().toISOString(),
      }

      const synced = await syncTaskToSupabase(taskWithOrg)
      if (synced) {
        if (editingTask) {
          const updated = tasks.map(t => t.id === editingTask.id ? taskWithOrg : t)
          saveTasks(updated)
          if (logActivity) logActivity(`Ndrysho detyrën: ${formData.customer}`, 'Detyrat')
          if (showToast) showToast('Detyra u ndryshua ✓')
        } else {
          saveTasks([...tasks, taskWithOrg])
          if (logActivity) logActivity(`Krijo detyrë: ${formData.customer}`, 'Detyrat')
          if (showToast) showToast('Detyra u krijua ✓')
        }
      } else {
        if (showToast) showToast('Error saving task')
      }
      setShowModal(false)
    } catch (e) {
      console.error('Error saving task:', e)
      if (showToast) showToast('Error: ' + e.message)
    }
  }

  const handleDeleteTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (task && confirm(`Fshi detyrën për ${task.customer}?`)) {
      const deleted = await deleteTaskFromSupabase(taskId)
      if (deleted) {
        const updated = tasks.filter(t => t.id !== taskId)
        saveTasks(updated)
        if (logActivity) logActivity(`Fshi detyrën: ${task.customer}`, 'Detyrat')
        if (showToast) showToast('Detyra u fshi')
      }
    }
  }

  const handleToggleTask = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const updatedTask = { ...task, completed: !task.completed }
    const synced = await syncTaskToSupabase(updatedTask)
    if (synced) {
      const updated = tasks.map(t => t.id === taskId ? updatedTask : t)
      saveTasks(updated)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const totalTasks = tasks.length
  const activeTasks = tasks.filter(t => !t.completed).length
  const completedTasks = tasks.filter(t => t.completed).length
  const overdueTasks = tasks.filter(t => t.reminderDate < today && !t.completed).length

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (filterType === 'active') {
      result = result.filter(t => !t.completed)
    } else if (filterType === 'completed') {
      result = result.filter(t => t.completed)
    } else if (filterType === 'overdue') {
      result = result.filter(t => t.reminderDate < today && !t.completed)
    }

    return result.sort((a, b) => {
      const aIsOverdue = a.reminderDate < today && !a.completed
      const bIsOverdue = b.reminderDate < today && !b.completed
      const aIsToday = a.reminderDate === today && !a.completed
      const bIsToday = b.reminderDate === today && !b.completed

      if (aIsOverdue && !bIsOverdue) return -1
      if (!aIsOverdue && bIsOverdue) return 1
      if (aIsToday && !bIsToday) return -1
      if (!aIsToday && bIsToday) return 1
      return new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime()
    })
  }, [tasks, filterType])

  const filterOptions = [
    { key: 'all', label: 'Të gjitha', count: totalTasks },
    { key: 'active', label: 'Aktive', count: activeTasks },
    { key: 'completed', label: 'Kryera', count: completedTasks },
    { key: 'overdue', label: 'Vonuara', count: overdueTasks },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="px-4 sm:px-6 py-5 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ListTodo size={28} className="text-red-500" />
              Detyrat
            </h1>
          </div>
          <button
            onClick={handleAddTask}
            className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center"
            title="Detyrë e re"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold">Total</p>
            <p className="text-xl font-bold text-blue-700">{totalTasks}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 font-semibold">Aktive</p>
            <p className="text-xl font-bold text-green-700">{activeTasks}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3 border border-emerald-200">
            <p className="text-xs text-emerald-600 font-semibold">Kryera</p>
            <p className="text-xl font-bold text-emerald-700">{completedTasks}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
            <p className="text-xs text-red-600 font-semibold">Vonuara</p>
            <p className="text-xl font-bold text-red-700">{overdueTasks}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-gray-100 flex gap-2 overflow-x-auto">
        {filterOptions.map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${
              filterType === filter.key
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.label} <span className={`ml-1.5 ${filterType === filter.key ? 'text-red-200' : 'text-gray-400'}`}>({filter.count})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 animate-spin" />
              </div>
              <p className="text-sm text-gray-500">Po ngarkon detyrat...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ListTodo size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold mb-1">Nuk ka detyra</p>
            <p className="text-sm text-gray-400 mb-6">
              {filterType === 'completed' ? 'Nuk keni detyrë të përfunduar.' : filterType === 'overdue' ? 'Nuk keni detyrë vonuar. 🎉' : 'Krijo detyrën e parë tënde'}
            </p>
            {filterType === 'all' && (
              <button
                onClick={handleAddTask}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                + Detyrë e Re
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                customers={customers}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onToggle={handleToggleTask}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTask}
          customers={customers}
        />
      )}
    </div>
  )
}
