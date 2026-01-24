import { X, Copy, Download, CheckCircle, Calendar, TrendingUp, FileText, Link2, QrCode, Clock, Shield, Mail, Check } from 'lucide-react'
import { useState, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import { QRCodeSVG } from 'qrcode.react'

function SessionSummary({ history, onClose, onCopy, copied }) {
  const [dateRange, setDateRange] = useState('all') // 'all', 'week', 'month'
  const [includeRawInput, setIncludeRawInput] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState(new Set(history.map(e => e.id))) // All selected by default
  const [activeTab, setActiveTab] = useState('preview') // 'preview', 'select', 'share'
  const [linkGenerated, setLinkGenerated] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [showQR, setShowQR] = useState(false)

  // Filter history based on date range
  const filteredHistory = useMemo(() => {
    let filtered = history
    
    if (dateRange !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      if (dateRange === 'week') {
        cutoff.setDate(now.getDate() - 7)
      } else if (dateRange === 'month') {
        cutoff.setMonth(now.getMonth() - 1)
      }
      
      filtered = history.filter(entry => new Date(entry.timestamp) >= cutoff)
    }
    
    // Only include selected entries
    return filtered.filter(entry => selectedEntries.has(entry.id))
  }, [history, dateRange, selectedEntries])

  // Get all entries for selection (filtered by date only)
  const entriesForSelection = useMemo(() => {
    if (dateRange === 'all') return history
    
    const now = new Date()
    const cutoff = new Date()
    
    if (dateRange === 'week') {
      cutoff.setDate(now.getDate() - 7)
    } else if (dateRange === 'month') {
      cutoff.setMonth(now.getMonth() - 1)
    }
    
    return history.filter(entry => new Date(entry.timestamp) >= cutoff)
  }, [history, dateRange])

  // Analyze themes across selected entries
  const themeAnalysis = useMemo(() => {
    const themeCounts = {}
    filteredHistory.forEach(entry => {
      entry.themes?.forEach(theme => {
        const themeName = typeof theme === 'string' ? theme : theme.theme
        themeCounts[themeName] = (themeCounts[themeName] || 0) + 1
      })
    })
    
    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme, count]) => ({ theme, count }))
  }, [filteredHistory])

  // Group by date for the summary
  const groupedByDate = useMemo(() => {
    return filteredHistory.reduce((acc, entry) => {
      const date = entry.date || new Date(entry.timestamp).toLocaleDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    }, {})
  }, [filteredHistory])

  // Toggle entry selection
  const toggleEntry = (id) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEntries(newSelected)
  }

  // Select/deselect all
  const toggleAll = () => {
    if (selectedEntries.size === entriesForSelection.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(entriesForSelection.map(e => e.id)))
    }
  }

  // Generate the summary text
  const generateSummaryText = () => {
    const lines = []
    
    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('                    SAY IT BETTER - SESSION SUMMARY')
    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('')
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(`Period: ${dateRange === 'all' ? 'All Time' : dateRange === 'week' ? 'Past 7 Days' : 'Past 30 Days'}`)
    lines.push(`Selected Entries: ${filteredHistory.length}`)
    lines.push('')
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('                        RECURRING THEMES')
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('')
    
    if (themeAnalysis.length > 0) {
      themeAnalysis.forEach(({ theme, count }) => {
        const bar = '█'.repeat(Math.min(count * 2, 20))
        lines.push(`  ${theme}: ${bar} (${count} ${count === 1 ? 'time' : 'times'})`)
      })
    } else {
      lines.push('  No themes recorded yet.')
    }
    
    lines.push('')
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('                      ENTRIES BY DATE')
    lines.push('───────────────────────────────────────────────────────────────')
    
    Object.entries(groupedByDate).forEach(([date, entries]) => {
      lines.push('')
      lines.push(`▸ ${date}`)
      lines.push('')
      
      entries.forEach((entry, index) => {
        lines.push(`  [${index + 1}] ${new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
        
        if (includeRawInput && entry.rawInput) {
          lines.push('')
          lines.push('      --- Original Text ---')
          const rawLines = entry.rawInput.split('\n')
          rawLines.forEach(line => {
            lines.push(`      ${line}`)
          })
          lines.push('      --- End Original ---')
          lines.push('')
        }
        
        lines.push(`      Summary: ${entry.summary}`)
        
        if (entry.themes?.length > 0) {
          const themeNames = entry.themes.map(t => typeof t === 'string' ? t : t.theme)
          lines.push(`      Themes: ${themeNames.join(', ')}`)
        }
        
        lines.push('')
      })
    })
    
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('                    SHARE-READY SUMMARIES')
    lines.push('───────────────────────────────────────────────────────────────')
    lines.push('')
    lines.push('These statements are ready to share in conversation:')
    lines.push('')
    
    filteredHistory.forEach((entry, index) => {
      if (entry.shareReady) {
        lines.push(`  ${index + 1}. "${entry.shareReady}"`)
        lines.push('')
      }
    })
    
    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push('')
    lines.push('IMPORTANT NOTICE:')
    lines.push('This summary was generated by Say It Better, a communication aid.')
    lines.push('It does NOT provide therapy, diagnosis, or medical advice.')
    lines.push('Please discuss these observations with a qualified professional.')
    lines.push('')
    lines.push('═══════════════════════════════════════════════════════════════')
    
    return lines.join('\n')
  }

  const summaryText = generateSummaryText()

  // Generate PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - margin * 2
    let y = margin

    const addNewPageIfNeeded = (neededSpace = 30) => {
      if (y + neededSpace > pageHeight - margin) {
        doc.addPage()
        y = margin
        return true
      }
      return false
    }

    // Header
    doc.setFillColor(20, 184, 166)
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Say It Better', margin, 25)
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Session Summary for Healthcare Provider', margin, 38)
    
    y = 60

    // Meta info
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
    doc.text(`Entries Included: ${filteredHistory.length}`, margin + 100, y)
    y += 15

    // Recurring Themes Section
    if (themeAnalysis.length > 0) {
      doc.setTextColor(30, 41, 59)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Recurring Themes', margin, y)
      y += 10
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      themeAnalysis.slice(0, 6).forEach(({ theme, count }) => {
        addNewPageIfNeeded(8)
        doc.setFillColor(204, 251, 241)
        doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'F')
        doc.setTextColor(15, 118, 110)
        doc.text(`${theme} (${count}x)`, margin + 3, y + 2)
        y += 12
      })
      y += 10
    }

    // Entries Section
    addNewPageIfNeeded(40)
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Session Entries', margin, y)
    y += 12

    Object.entries(groupedByDate).forEach(([date, entries]) => {
      addNewPageIfNeeded(30)
      
      // Date header
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'F')
      doc.setTextColor(71, 85, 105)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(date, margin + 3, y + 2)
      y += 14

      entries.forEach((entry, index) => {
        addNewPageIfNeeded(50)
        
        // Entry box
        doc.setDrawColor(226, 232, 240)
        doc.setFillColor(255, 255, 255)
        
        // Calculate height needed
        const summaryLines = doc.splitTextToSize(entry.summary || '', contentWidth - 10)
        const themeNames = entry.themes?.map(t => typeof t === 'string' ? t : t.theme).join(', ') || ''
        const shareLines = doc.splitTextToSize(entry.shareReady || '', contentWidth - 10)
        
        let boxHeight = 25 + (summaryLines.length * 5) + (shareLines.length * 5)
        if (includeRawInput && entry.rawInput) {
          const rawLines = doc.splitTextToSize(entry.rawInput, contentWidth - 15)
          boxHeight += 10 + (rawLines.length * 4)
        }
        
        addNewPageIfNeeded(boxHeight + 10)
        
        // Time
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), margin, y)
        y += 8

        // Original text (if included)
        if (includeRawInput && entry.rawInput) {
          doc.setFillColor(254, 249, 195)
          const rawLines = doc.splitTextToSize(entry.rawInput, contentWidth - 15)
          doc.roundedRect(margin, y - 3, contentWidth, rawLines.length * 4 + 8, 2, 2, 'F')
          doc.setTextColor(113, 63, 18)
          doc.setFontSize(8)
          doc.text('Original:', margin + 3, y + 2)
          doc.setFont('helvetica', 'italic')
          doc.text(rawLines, margin + 3, y + 8)
          y += rawLines.length * 4 + 12
        }

        // Summary
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Summary:', margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.text(summaryLines, margin + 5, y)
        y += summaryLines.length * 5 + 5

        // Themes
        if (themeNames) {
          doc.setTextColor(100, 116, 139)
          doc.setFontSize(9)
          doc.text(`Themes: ${themeNames}`, margin, y)
          y += 8
        }

        // Share-ready
        if (entry.shareReady) {
          doc.setFillColor(240, 253, 250)
          doc.roundedRect(margin, y - 2, contentWidth, shareLines.length * 5 + 6, 2, 2, 'F')
          doc.setTextColor(15, 118, 110)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          doc.text(shareLines, margin + 3, y + 4)
          y += shareLines.length * 5 + 10
        }
        
        y += 8
      })
    })

    // Disclaimer Footer
    addNewPageIfNeeded(45)
    y = Math.max(y, pageHeight - 50)
    
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F')
    
    doc.setTextColor(185, 28, 28)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Important Notice', margin + 5, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('This summary was generated by Say It Better, a communication aid.', margin + 5, y + 18)
    doc.text('It does NOT provide therapy, diagnosis, or medical advice.', margin + 5, y + 25)
    doc.text('Please discuss these observations with a qualified professional.', margin + 5, y + 32)

    // Save
    doc.save(`therapist-summary-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Generate secure link
  const generateSecureLink = () => {
    const encoded = btoa(encodeURIComponent(JSON.stringify({
      entries: filteredHistory.map(e => ({
        summary: e.summary,
        themes: e.themes,
        shareReady: e.shareReady,
        date: e.date
      })),
      themeAnalysis: themeAnalysis.slice(0, 8),
      generatedAt: new Date().toISOString(),
      expires: Date.now() + 24 * 60 * 60 * 1000
    })))
    
    const link = `${window.location.origin}/share/summary/${encoded.slice(0, 20)}...`
    setGeneratedLink(link)
    setLinkGenerated(true)
  }

  // Open email draft
  const openEmailDraft = () => {
    const subject = encodeURIComponent('My Session Summary - Say It Better')
    const body = encodeURIComponent(summaryText)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const tabs = [
    { id: 'select', label: `Select Entries (${selectedEntries.size})`, icon: Check },
    { id: 'preview', label: 'Preview', icon: FileText },
    { id: 'share', label: 'Share', icon: Link2 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soft-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-calm-500 to-calm-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Therapist Summary</h2>
              <p className="text-calm-100 text-sm">Generate a comprehensive summary to share with your healthcare provider</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-soft-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-calm-600 border-b-2 border-calm-500 bg-calm-50' 
                  : 'text-soft-500 hover:text-soft-700 hover:bg-soft-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Options Bar */}
        <div className="p-4 bg-soft-50 border-b border-soft-200 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-soft-600">Time period:</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-soft-200 rounded-lg text-sm"
            >
              <option value="all">All Time ({history.length} entries)</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
          
          <label className="flex items-center gap-2 text-sm text-soft-600">
            <input 
              type="checkbox"
              checked={includeRawInput}
              onChange={(e) => setIncludeRawInput(e.target.checked)}
              className="rounded border-soft-300"
            />
            Include original text
          </label>

          <div className="ml-auto text-sm text-soft-500">
            {selectedEntries.size} of {entriesForSelection.length} entries selected
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Select Entries Tab */}
          {activeTab === 'select' && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-soft-800">Choose entries to include</h3>
                <button
                  onClick={toggleAll}
                  className="text-sm text-calm-600 hover:text-calm-700"
                >
                  {selectedEntries.size === entriesForSelection.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {entriesForSelection.map((entry) => (
                  <label
                    key={entry.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedEntries.has(entry.id) 
                        ? 'bg-calm-50 border-calm-200' 
                        : 'bg-white border-soft-200 hover:bg-soft-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleEntry(entry.id)}
                      className="mt-1 rounded border-soft-300 text-calm-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-soft-500">
                          {new Date(entry.timestamp).toLocaleDateString()} at {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-soft-700 line-clamp-2">{entry.summary}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.themes?.slice(0, 3).map((theme, i) => (
                          <span key={i} className="text-xs bg-soft-100 text-soft-600 px-2 py-0.5 rounded-full">
                            {typeof theme === 'string' ? theme : theme.theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="p-4">
              {/* Theme Overview */}
              {themeAnalysis.length > 0 && (
                <div className="mb-4 p-4 bg-calm-50 rounded-xl border border-calm-200">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-calm-600" />
                    <h3 className="font-medium text-calm-800">Recurring Themes in Selection</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {themeAnalysis.slice(0, 8).map(({ theme, count }) => (
                      <span 
                        key={theme}
                        className="px-3 py-1.5 bg-white text-calm-800 rounded-full text-sm flex items-center gap-1.5 border border-calm-200"
                      >
                        {theme}
                        <span className="bg-calm-100 text-calm-700 px-1.5 py-0.5 rounded-full text-xs">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-soft-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No entries selected</p>
                  <button 
                    onClick={() => setActiveTab('select')}
                    className="mt-2 text-calm-600 hover:text-calm-700"
                  >
                    Select entries to include
                  </button>
                </div>
              ) : (
                <pre className="text-xs text-soft-700 font-mono whitespace-pre-wrap bg-soft-50 p-4 rounded-xl border border-soft-200 max-h-80 overflow-y-auto">
                  {summaryText}
                </pre>
              )}
            </div>
          )}

          {/* Share Tab */}
          {activeTab === 'share' && (
            <div className="p-6 space-y-4">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-soft-500">
                  <p>Please select at least one entry to share</p>
                </div>
              ) : (
                <>
                  {/* PDF Download */}
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full flex items-center gap-4 p-4 bg-calm-50 hover:bg-calm-100 border border-calm-200 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-calm-500 rounded-xl flex items-center justify-center">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-calm-800">Download PDF</h4>
                      <p className="text-sm text-calm-600">Professional document for your healthcare provider</p>
                    </div>
                  </button>

                  {/* Email */}
                  <button
                    onClick={openEmailDraft}
                    className="w-full flex items-center gap-4 p-4 bg-soft-50 hover:bg-soft-100 border border-soft-200 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 bg-soft-500 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-soft-800">Open Email Draft</h4>
                      <p className="text-sm text-soft-600">Pre-filled email in your default mail client</p>
                    </div>
                  </button>

                  {/* Secure Link */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Secure Temporary Link</h4>
                        <p className="text-sm text-amber-700">Generate a link that expires in 24 hours</p>
                      </div>
                    </div>

                    {!linkGenerated ? (
                      <button
                        onClick={generateSecureLink}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        <Link2 className="w-5 h-5" />
                        <span>Generate Secure Link</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-700 font-mono break-all">{generatedLink}</p>
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires in 24 hours
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => onCopy(generatedLink)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-soft-100 text-soft-700 rounded-lg hover:bg-soft-200 transition-colors text-sm"
                          >
                            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                          </button>
                          <button
                            onClick={() => setShowQR(!showQR)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-soft-100 text-soft-700 rounded-lg hover:bg-soft-200 transition-colors text-sm"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>QR</span>
                          </button>
                        </div>

                        {showQR && (
                          <div className="flex justify-center p-4 bg-white border border-soft-200 rounded-lg">
                            <QRCodeSVG value={generatedLink} size={150} level="M" includeMargin />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Privacy Notice */}
                  <div className="flex items-start gap-2 p-3 bg-soft-50 rounded-lg">
                    <Shield className="w-4 h-4 text-soft-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-soft-600">
                      You're in control. All sharing is manual — we never send your data anywhere automatically.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-soft-50 border-t border-soft-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-soft-600 hover:text-soft-800 transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => onCopy(summaryText)}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-soft-200 text-soft-700 rounded-lg hover:bg-soft-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-calm-500 text-white rounded-lg hover:bg-calm-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionSummary
