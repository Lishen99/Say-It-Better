import { Copy, Download, CheckCircle, FileText, Tag, Share2, TrendingUp, Brain, Heart, Lightbulb, Save, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import ShareModal from './ShareModal'
import { jsPDF } from 'jspdf'

function OutputSection({ result, rawText, onCopy, onDownload, copied, recurringThemes = [], onSave, onClear }) {
  const [showShareModal, setShowShareModal] = useState(false)

  // Generate PDF directly
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF()
      const margin = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // Header - Teal brutalist style
      doc.setFillColor(20, 184, 166)
      doc.rect(0, 0, pageWidth, 40, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text('SAY IT BETTER', margin, 25)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Analysis Results', margin, 33)

      y = 55

      // Date
      doc.setTextColor(99, 110, 114)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
      y += 15

      // Clarified Statement Section (highlighted)
      doc.setFillColor(20, 184, 166)
      doc.rect(margin, y, contentWidth, 35, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('CLARIFIED STATEMENT', margin + 5, y + 10)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const shareLines = doc.splitTextToSize(result.share_ready, contentWidth - 10)
      doc.text(shareLines, margin + 5, y + 20)
      y += 45

      // Summary Section
      doc.setTextColor(45, 52, 54)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('SUMMARY', margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const summaryLines = doc.splitTextToSize(result.summary, contentWidth)
      doc.text(summaryLines, margin, y)
      y += summaryLines.length * 5 + 12

      // Themes Section
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('KEY THEMES IDENTIFIED', margin, y)
      y += 10

      doc.setFontSize(10)
      result.themes.forEach((theme, index) => {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 184, 166)
        doc.text(`${theme.theme}`, margin + 5, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(99, 110, 114)
        const descLines = doc.splitTextToSize(theme.description, contentWidth - 10)
        doc.text(descLines, margin + 5, y)
        y += descLines.length * 5 + 6
      })
      y += 5

      // Footer disclaimer
      if (y > 250) {
        doc.addPage()
        y = margin
      }

      doc.setDrawColor(45, 52, 54)
      doc.setLineWidth(1)
      doc.rect(margin, y, contentWidth, 25)

      doc.setTextColor(45, 52, 54)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('IMPORTANT NOTICE', margin + 5, y + 8)
      doc.setFont('helvetica', 'normal')
      doc.text('This tool is a communication aid. It does not provide therapy, diagnosis, or medical advice.', margin + 5, y + 15)
      doc.text('Please discuss these observations with a qualified professional.', margin + 5, y + 21)

      doc.save(`say-it-better-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('PDF Generation Error:', e)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="space-y-4 mb-10">
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          result={result}
          rawText={rawText}
          onClose={() => setShowShareModal(false)}
          onCopy={onCopy}
          copied={copied}
        />
      )}

      {/* Recurring Themes Alert */}
      {recurringThemes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-[#2d3436] text-sm mb-1">Recurring Patterns</h4>
              <p className="text-xs text-[#636e72] mb-2">
                These themes have appeared before:
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {recurringThemes.map((theme, i) => (
                  <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#636e72]">
                This is just a pattern - consider discussing with someone you trust.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Actions */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#14B8A6]" />
            <h2 className="font-semibold text-lg text-[#2d3436]">Analysis Results</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {onSave && (
              <button
                onClick={onSave}
                className="flex items-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9488] text-white px-3 py-2 transition-all font-medium text-sm rounded-lg shadow-sm"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white px-3 py-2 transition-all font-medium text-sm rounded-lg shadow-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 bg-[#636e72] hover:bg-[#2d3436] text-white px-3 py-2 transition-all font-medium text-sm rounded-lg shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            {onClear && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 bg-[#f5f5f5] hover:bg-[#e8e8e8] text-[#636e72] px-3 py-2 transition-all font-medium text-sm rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
                New
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clarified Statement - Highlighted */}
      <div className="bg-gradient-to-br from-[#14B8A6] to-[#0d9488] rounded-2xl shadow-md p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-white/80" />
          <h3 className="font-medium text-sm text-white/90">Clarified Statement</h3>
        </div>
        <p className="text-white text-lg leading-relaxed">
          {result.share_ready}
        </p>
        <button
          onClick={() => onCopy(result.share_ready)}
          className="mt-4 flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
        >
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-[#14B8A6]" />
          <h3 className="font-medium text-sm text-[#2d3436]">Summary</h3>
        </div>
        <p className="text-[#636e72] leading-relaxed">{result.summary}</p>
      </div>

      {/* Key Themes */}
      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[#14B8A6]" />
          <h3 className="font-medium text-sm text-[#2d3436]">Key Themes</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.themes.map((theme, index) => (
            <div key={index} className="group">
              <span className="px-3 py-1.5 bg-[#14B8A6]/10 text-[#0d9488] font-medium rounded-lg text-sm inline-block">
                {theme.theme}
              </span>
              <p className="text-xs text-[#636e72] mt-1 max-w-[180px]">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-[#b2bec3] py-1">
        <span>Original: {result.original_length} chars</span>
        <span className="w-1 h-1 bg-[#14B8A6] rounded-full"></span>
        <span>Summary: {result.translated_length} chars</span>
      </div>
    </div>
  )
}

export default OutputSection
