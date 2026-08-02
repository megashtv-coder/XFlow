/**
 * AIChatFloat.jsx
 * Floating AI Chat widget that appears in bottom-right corner
 * Accessible from any page in the application
 */

import React, { useState, useEffect, useRef } from 'react'
import { Send, X, Loader, AlertCircle, CheckCircle, MessageCircle, Minimize2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { createAICommandProcessor } from '../services/ai/AICommandProcessor'

export default function AIChatFloat() {
  const appContext = useApp()
  const processorRef = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'system',
      content: 'Përshëndetje! Jam AI asistenti juaj. Mund të më japni komandat në shqip.',
      timestamp: new Date(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState(null)
  const messagesEndRef = useRef(null)

  // Initialize AI processor
  useEffect(() => {
    if (!processorRef.current && appContext) {
      processorRef.current = createAICommandProcessor(appContext)
    }
  }, [appContext])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || !processorRef.current) return

    const userMessage = input.trim()
    setInput('')

    const userMsg = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const result = await processorRef.current.processCommand(userMessage)
      setCurrentResult(result)

      let responseMsg

      if (!result.success) {
        if (result.error?.code === 'MISSING_FIELDS' && result.error?.followUpQuestion) {
          responseMsg = {
            id: `ai-${Date.now()}`,
            type: 'question',
            content: result.error.followUpQuestion,
            missingFields: result.error.fields,
            previousResult: result,
            timestamp: new Date(),
          }
        } else {
          responseMsg = {
            id: `ai-${Date.now()}`,
            type: 'error',
            content: result.error?.message || 'Pati një gabim në përpunimin e komandës.',
            error: result.error,
            timestamp: new Date(),
          }
        }
      } else {
        responseMsg = {
          id: `ai-${Date.now()}`,
          type: 'action',
          content: result.intent ? `${getIntentLabel(result.intent)}:` : 'Komanda pranuar',
          action: result.action,
          timestamp: new Date(),
        }
      }

      setMessages(prev => [...prev, responseMsg])
    } catch (err) {
      console.error('AIChat Float error:', err)
      const errorMsg = {
        id: `ai-${Date.now()}`,
        type: 'error',
        content: 'Gabim në procesim',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const getIntentLabel = (intent) => {
    const labels = {
      CREATE_INVOICE: 'Krijo Faturë',
      EDIT_INVOICE: 'Ndrysho Faturë',
      DELETE_INVOICE: 'Fshi Faturë',
      LIST_INVOICES: 'Listo Faturat',
      REGISTER_PAYMENT: 'Regjistro Pagese',
      REGISTER_EXPENSE: 'Regjistro Shpenzim',
      MONTHLY_SUMMARY: 'Përmbledhje Mujore',
    }
    return labels[intent] || 'Veprim'
  }

  const handleAcceptAction = async () => {
    if (!currentResult?.action) return
    // Action execution logic here
    const successMsg = {
      id: `ai-${Date.now()}`,
      type: 'success',
      content: '✓ Veprim u pranua',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, successMsg])
    setCurrentResult(null)
  }

  return (
    <>
      {/* Float Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
          title="Hap AI Chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-red-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">🤖 AI Asistenti</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Mbyll"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id}>
                {msg.type === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-red-500 text-white px-4 py-2 rounded-lg max-w-xs break-words">
                      {msg.content}
                    </div>
                  </div>
                )}

                {msg.type === 'system' && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                    {msg.content}
                  </div>
                )}

                {msg.type === 'question' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex gap-2 items-start">
                      <HelpCircle size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 dark:text-gray-200">{msg.content}</p>
                    </div>
                  </div>
                )}

                {msg.type === 'error' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex gap-2 items-start">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 dark:text-gray-200">{msg.content}</p>
                    </div>
                  </div>
                )}

                {msg.type === 'action' && msg.action && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{msg.content}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAcceptAction}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-1.5 rounded transition-colors"
                      >
                        ✓ Pranohe
                      </button>
                      <button
                        onClick={() => setCurrentResult(null)}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm py-1.5 rounded transition-colors"
                      >
                        ✗ Anulo
                      </button>
                    </div>
                  </div>
                )}

                {msg.type === 'success' && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex gap-2 items-start">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 dark:text-gray-200">{msg.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-center py-2">
                <Loader size={18} className="animate-spin text-red-500" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Shkruaj komandë..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
