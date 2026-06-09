import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'

/**
 * Side panel form wrapper (like Zoho)
 * Displays a form as a right-side drawer while keeping list visible
 */
export default function FormPageWrapper({ title, subtitle, children, onBack }) {
  const { darkMode } = useApp()

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onBack}
      />

      {/* Side Panel - slides from right */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 z-50 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } shadow-2xl overflow-y-auto animate-in slide-in-from-right`}>
        {/* Header */}
        <div className={`sticky top-0 border-b ${
          darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
        } px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onBack}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 ${
                darkMode
                  ? 'text-gray-400 hover:bg-gray-700'
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title="Mbyll"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  )
}
