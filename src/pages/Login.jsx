import { useState } from 'react'
import { Eye, EyeOff, AlertCircle, Zap } from 'lucide-react'

export default function Login({ users = [], onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async (e) => {
  e?.preventDefault()
  if (!username || !password) { setError('Plotëso të gjitha fushat.'); return }

  setLoading(true)
  setError('')

  try {
    console.log('🔐 Logging in with username:', username)

    // Find user in local users list
    const user = users.find(u => u.username === username && u.password === password)

    if (!user) {
      throw new Error('Emri i përdoruesit ose fjalëkalimi i pasaktë')
    }

    console.log('✅ Login successful:', user.username)
    onLogin(user)

  } catch (err) {
    console.error('❌ Login error:', err)
    setError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">X-Flow</p>
            <p className="text-xs text-gray-400">Menaxhimi Financiar</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Kyçu</h1>
          <p className="text-sm text-gray-500 mt-1">Hyr në llogarinë tuaj</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} autoComplete="on" className="space-y-4">
          {/* Username */}
          <div>
            <input
              id="login-username"
              name="username"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Emri i përdoruesit"
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              id="login-password"
              name="password"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 pr-10"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Fjalëkalimi"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPw(v => !v)}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg px-3 py-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Duke u kyçur...
              </>
            ) : (
              'Kyçu në sistem'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
