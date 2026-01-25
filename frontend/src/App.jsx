import { useState, useEffect } from 'react'
import { Heart, Send, Copy, Download, RefreshCw, CheckCircle, AlertCircle, Sparkles, Shield, ChevronDown, ChevronUp, FileText, Trash2, Calendar, TrendingUp, Lock, BookOpen } from 'lucide-react'
import DisclaimerModal from './components/DisclaimerModal'
import InputSection from './components/InputSection'
import OutputSection from './components/OutputSection'
import Header from './components/Header'
import Footer from './components/Footer'
import SessionSummary from './components/SessionSummary'
import ThemeTrendsChart from './components/ThemeTrendsChart'
import GuideModal from './components/GuideModal'
import CloudSyncModal from './components/CloudSyncModal'
import AccessibilityMenu, { useAccessibility } from './components/AccessibilityMenu'
import storage from './services/storage'
import { cloudStorage } from './services/cloudStorage'
import { importKey, decrypt } from './services/crypto'

// In development, uses localhost:8000. In production (Vercel), API is at /api
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

function App() {
  // Check localStorage BEFORE initial render to prevent flash
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    // Only show disclaimer if not previously accepted
    return localStorage.getItem('disclaimer_accepted') !== 'true'
  })

  // Accessibility Hook
  const { settings: a11ySettings, toggleSetting: toggleA11y, setTextSize } = useAccessibility()
  const [showA11yMenu, setShowA11yMenu] = useState(false)

  const [rawText, setRawText] = useState('')
  const [tone, setTone] = useState('neutral')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])
  const [recurringThemes, setRecurringThemes] = useState([])
  const [showSessionSummary, setShowSessionSummary] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showCloudSync, setShowCloudSync] = useState(false)
  const [isCloudConnected, setIsCloudConnected] = useState(false)
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

      // Auto-connect to cloud if credentials exist
      const storedAuth = localStorage.getItem('sayitbetter_auth')
      if (storedAuth) {
        try {
          const { username, passphrase } = JSON.parse(storedAuth)
          await cloudStorage.initialize(username, passphrase)
          setIsCloudConnected(true)
        } catch (e) {
          console.error('Auto-login failed', e)
          localStorage.removeItem('sayitbetter_auth')
        }
      } else {
        // Check status normally
        const cloudStatus = cloudStorage.getStatus()
        setIsCloudConnected(cloudStatus.isEnabled)
      }
    }

    initStorage()

    // Check for shared link on mount
    const checkSharedLink = async () => {
      const params = new URLSearchParams(window.location.search)
      const shareId = params.get('share_id')
      const hash = window.location.hash

      // Look for key in hash
      let keyString = ''
      if (hash.startsWith('#key=')) {
        keyString = hash.substring(5)
      } else if (params.get('share')) {
        // Legacy simulated link support (optional, or just ignore)
        return
      }

      if (shareId && keyString) {
        try {
          setLoading(true)

          // 1. Fetch encrypted blob
          const response = await fetch(`${API_BASE}/share/${shareId}`)
          if (!response.ok) {
            if (response.status === 410) throw new Error('This shared link has expired.')
            if (response.status === 404) throw new Error('Shared link not found.')
            throw new Error('Failed to load shared content.')
          }

          const { encrypted_data, iv } = await response.json()

          // 2. Decrypt locally
          const key = await importKey(keyString)
          const data = await decrypt(encrypted_data, iv, key)

          setResult({
            summary: data.summary,
            themes: data.themes || [],
            share_ready: data.share_ready,
            original_length: 0,
            translated_length: data.summary?.length || 0
          })

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname)

        } catch (e) {
          console.error('Share link error:', e)
          setError(e.message || 'Invalid or corrupted shared link.')
        } finally {
          setLoading(false)
        }
      }
    }

    checkSharedLink()
  }, [])

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted', 'true')
    setShowDisclaimer(false)

    // Auto-show guide on first time
    if (localStorage.getItem('guide_seen') !== 'true') {
      setShowGuide(true)
      localStorage.setItem('guide_seen', 'true')
    }
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
    <div className="min-h-screen flex flex-col bg-[#f9f5f0]">
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
      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}
      {showCloudSync && (
        <CloudSyncModal
          isOpen={showCloudSync}
          onClose={() => setShowCloudSync(false)}
          entries={history}
          onSync={async (syncedEntries) => {
            // Update local storage with synced entries
            for (const entry of syncedEntries) {
              await storage.saveEntry(entry)
            }
            const updatedHistory = await storage.getAllEntries()
            setHistory(updatedHistory)
            setIsCloudConnected(true)
          }}
        />
      )}

      <Header
        onGuideClick={() => setShowGuide(true)}
        onCloudClick={() => setShowCloudSync(true)}
        isCloudConnected={isCloudConnected}
        onAccessibilityClick={() => setShowA11yMenu(!showA11yMenu)}
      />

      {/* Accessibility Menu */}
      <AccessibilityMenu
        isOpen={showA11yMenu}
        onClose={() => setShowA11yMenu(false)}
        settings={a11ySettings}
        toggleSetting={toggleA11y}
        setTextSize={setTextSize}
      />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2d3436] mb-4 tracking-tight leading-tight">
            Say what you
            <span className="text-[#14B8A6]"> really mean</span>
          </h1>
          <p className="text-lg text-[#636e72] max-w-xl mx-auto leading-relaxed">
            Transform scattered thoughts into clear, shareable summaries.
            A gentle tool to help you express yourself.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
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

        {/* Privacy Info Box */}
        <div className="mt-12 bg-[#14B8A6]/5 border border-[#14B8A6]/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#14B8A6] rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2d3436] mb-1">
                Your Data Stays Private
              </h3>
              <p className="text-[#636e72] text-sm leading-relaxed">
                By default, translations are saved <strong className="text-[#2d3436]">locally in your browser</strong>.
                Enable <strong className="text-[#2d3436]">cloud sync</strong> to access across devices with
                <strong className="text-[#14B8A6]"> end-to-end encryption</strong> - only you can decrypt your data.
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
    <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-[#e0e0e0] bg-[#fafafa]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 text-left hover:text-[#14B8A6] transition-colors"
        >
          <Calendar className="w-5 h-5 text-[#636e72]" />
          <span className="font-semibold text-[#2d3436]">Saved Entries</span>
          <span className="history-count-badge text-xs bg-[#14B8A6] text-white px-2 py-0.5 rounded-full font-medium">
            {history.length}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#636e72]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#636e72]" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSummary}
            className="primary-btn flex items-center gap-2 px-4 py-2 bg-[#14B8A6] text-white text-sm font-medium rounded-lg hover:bg-[#0d9488] transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Generate Summary</span>
          </button>
          <button
            onClick={onClearHistory}
            className="p-2 text-[#636e72] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
            title="Delete all entries"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="divide-y divide-[#e8e8e8] max-h-80 overflow-y-auto">
          {Object.entries(groupedByDate).map(([date, entries]) => (
            <div key={date}>
              <div className="px-4 py-2 bg-[#f5f5f5] text-xs font-medium text-[#636e72] sticky top-0 border-b border-[#e0e0e0]">
                {date} — {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </div>
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-[#fafafa] transition-colors group">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-[#636e72] mb-2 flex-1">
                      {entry.summary || entry.rawInput?.substring(0, 150) + '...'}
                    </p>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#636e72] hover:text-red-500 transition-all rounded"
                      title="Delete this entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.themes?.map((theme, i) => (
                      <span key={i} className="text-xs bg-[#14B8A6]/10 text-[#0d9488] px-2 py-0.5 rounded-full font-medium">
                        {typeof theme === 'string' ? theme : theme.theme}
                      </span>
                    ))}
                    <span className="text-xs text-[#b2bec3] ml-auto">
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
