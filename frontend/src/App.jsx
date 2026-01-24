import { useState, useEffect } from 'react'
import { Heart, Send, Copy, Download, RefreshCw, CheckCircle, AlertCircle, Sparkles, Shield, ChevronDown, ChevronUp, FileText, Trash2, Calendar, TrendingUp } from 'lucide-react'
import DisclaimerModal from './components/DisclaimerModal'
import InputSection from './components/InputSection'
import OutputSection from './components/OutputSection'
import Header from './components/Header'
import Footer from './components/Footer'
import SessionSummary from './components/SessionSummary'
import ThemeTrendsChart from './components/ThemeTrendsChart'
import storage from './services/storage'

// In development, uses localhost:8000. In production (Vercel), API is at same origin
const API_BASE = import.meta.env.VITE_API_BASE || ''

function App() {
  // Check localStorage BEFORE initial render to prevent flash
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    // Only show disclaimer if not previously accepted
    return localStorage.getItem('disclaimer_accepted') !== 'true'
  })
  const [rawText, setRawText] = useState('')
  const [tone, setTone] = useState('neutral')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])
  const [recurringThemes, setRecurringThemes] = useState([])
  const [showSessionSummary, setShowSessionSummary] = useState(false)
  const [storageReady, setStorageReady] = useState(false)

  // Initialize storage and load history
  useEffect(() => {
    const initStorage = async () => {
      // Initialize IndexedDB
      await storage.init()
      
      // Migrate from old localStorage if needed
      await storage.migrateFromOldStorage()
      
      // Load all entries
      const entries = await storage.getAllEntries()
      setHistory(entries)
      setStorageReady(true)
    }
    
    initStorage()
  }, [])

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true')
    setShowDisclaimer(false)
  }

  const handleTranslate = async () => {
    if (rawText.trim().length < 10) {
      setError('Please enter at least 10 characters to translate.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: rawText,
          tone: tone
        })
      })

      if (!response.ok) {
        throw new Error('Failed to translate. Please try again.')
      }

      const data = await response.json()
      setResult(data)
      
      // Save FULL data to history (for therapist summaries)
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        rawInput: rawText,
        summary: data.summary,
        themes: data.themes,
        shareReady: data.share_ready,
        tone: tone
      }
      
      // Save to IndexedDB storage
      await storage.saveEntry(newEntry)
      const updatedHistory = await storage.getAllEntries()
      setHistory(updatedHistory)
      
      // Analyze recurring themes if we have history
      if (history.length > 0) {
        try {
          const pastThemes = history.flatMap(h => h.themes.map(t => t.theme))
          const currentThemes = data.themes.map(t => t.theme)
          
          const themeResponse = await fetch(`${API_BASE}/analyze-themes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              current_themes: currentThemes,
              past_themes: pastThemes
            })
          })
          
          if (themeResponse.ok) {
            const themeData = await themeResponse.json()
            setRecurringThemes(themeData.recurring_themes || [])
          }
        } catch (themeErr) {
          console.log('Theme analysis unavailable:', themeErr)
          // Non-critical - don't show error to user
        }
      }
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    const content = `Say It Better - Translation Result
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════

ORIGINAL TEXT:
${rawText}

═══════════════════════════════════════

CLEAR SUMMARY:
${result.summary}

KEY THEMES:
${result.themes.map(t => `• ${t.theme}: ${t.description}`).join('\n')}

SHARE-READY VERSION:
${result.share_ready}

═══════════════════════════════════════

Note: This tool is a communication aid and does not provide 
therapy, diagnosis, or medical advice.
`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `say-it-better-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    setRawText('')
    setResult(null)
    setError(null)
  }

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all saved entries? This cannot be undone.')) {
      await storage.clearAll()
      setHistory([])
      setRecurringThemes([])
    }
  }

  const handleDeleteEntry = async (id) => {
    await storage.deleteEntry(id)
    const updatedHistory = await storage.getAllEntries()
    setHistory(updatedHistory)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Session Summary Modal */}
      {showSessionSummary && (
        <SessionSummary 
          history={history}
          onClose={() => setShowSessionSummary(false)}
          onCopy={handleCopy}
          copied={copied}
        />
      )}
      {showDisclaimer && (
        <DisclaimerModal onAccept={handleAcceptDisclaimer} />
      )}
      
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Introduction */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-semibold text-soft-800 mb-3">
            Express yourself clearly
          </h2>
          <p className="text-soft-600 max-w-2xl mx-auto">
            Write your thoughts freely. We'll help you translate them into clear, 
            calm language that's easier to share with others.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <InputSection 
            rawText={rawText}
            setRawText={setRawText}
            tone={tone}
            setTone={setTone}
            onTranslate={handleTranslate}
            onClear={handleClear}
            loading={loading}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <OutputSection 
              result={result}
              rawText={rawText}
              onCopy={handleCopy}
              onDownload={handleDownload}
              copied={copied}
              recurringThemes={recurringThemes}
            />
          )}

          {/* Theme Trends Visualization */}
          {history.length >= 2 && (
            <ThemeTrendsChart history={history} />
          )}

          {/* History Section */}
          {history.length > 0 && (
            <HistorySection 
              history={history} 
              onOpenSummary={() => setShowSessionSummary(true)}
              onClearHistory={handleClearHistory}
              onDeleteEntry={handleDeleteEntry}
            />
          )}
        </div>

        {/* Data Storage Notice */}
        <div className="mt-12 bg-calm-50 border border-calm-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-calm-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-calm-800 mb-1">Your data stays with you</h3>
              <p className="text-sm text-calm-700">
                Your translations are saved <strong>only in your browser's local storage</strong>. 
                We don't store your data on any server. You can generate a summary of your entries 
                to share with a therapist, and delete everything at any time.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function HistorySection({ history, onOpenSummary, onClearHistory, onDeleteEntry }) {
  const [expanded, setExpanded] = useState(false)

  // Group entries by date
  const groupedByDate = history.reduce((acc, entry) => {
    const date = entry.date || new Date(entry.timestamp).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-soft-200 overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-soft-200 bg-soft-50">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left hover:text-calm-600 transition-colors"
        >
          <Calendar className="w-4 h-4 text-soft-500" />
          <span className="font-medium text-soft-700">Saved Entries</span>
          <span className="text-xs bg-soft-200 text-soft-600 px-2 py-0.5 rounded-full">
            {history.length}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-soft-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-soft-400" />
          )}
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-calm-500 text-white text-sm rounded-lg hover:bg-calm-600 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Summary for Therapist</span>
          </button>
          <button
            onClick={onClearHistory}
            className="p-1.5 text-soft-400 hover:text-red-500 transition-colors"
            title="Delete all entries"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="divide-y divide-soft-100 max-h-96 overflow-y-auto">
          {Object.entries(groupedByDate).map(([date, entries]) => (
            <div key={date}>
              <div className="px-4 py-2 bg-soft-100 text-xs font-medium text-soft-600 sticky top-0">
                {date} — {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </div>
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-soft-50 transition-colors group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-soft-700 mb-2 flex-1">
                      {entry.summary || entry.rawInput?.substring(0, 150) + '...'}
                    </p>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-soft-400 hover:text-red-500 transition-all"
                      title="Delete this entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.themes?.map((theme, i) => (
                      <span key={i} className="text-xs bg-calm-100 text-calm-700 px-2 py-1 rounded-full">
                        {typeof theme === 'string' ? theme : theme.theme}
                      </span>
                    ))}
                    <span className="text-xs text-soft-400 ml-auto">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
