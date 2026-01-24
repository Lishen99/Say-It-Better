import { Copy, Download, CheckCircle, FileText, Tag, Share2, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import ShareModal from './ShareModal'
import { jsPDF } from 'jspdf'

function OutputSection({ result, rawText, onCopy, onDownload, copied, recurringThemes = [] }) {
  const [showShareModal, setShowShareModal] = useState(false)

  // Generate PDF directly
  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    const margin = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // Header
    doc.setFillColor(20, 184, 166)
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('Say It Better', margin, 25)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Communication Summary', margin, 33)
    
    y = 55

    // Date
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y)
    y += 15

    // Summary Section
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Clear Summary', margin, y)
    y += 8
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const summaryLines = doc.splitTextToSize(result.summary, contentWidth)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 6 + 12

    // Themes Section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Themes', margin, y)
    y += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    result.themes.forEach((theme, index) => {
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${theme.theme}`, margin + 5, y)
      y += 6
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(theme.description, contentWidth - 10)
      doc.text(descLines, margin + 10, y)
      y += descLines.length * 5 + 6
    })
    y += 5

    // Share-Ready Section
    doc.setFillColor(240, 253, 250)
    doc.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F')
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 118, 110)
    doc.text('Share-Ready Version', margin + 5, y + 10)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    const shareLines = doc.splitTextToSize(`"${result.share_ready}"`, contentWidth - 10)
    doc.text(shareLines, margin + 5, y + 20)
    y += 50

    // Footer disclaimer
    if (y > 250) {
      doc.addPage()
      y = margin
    }
    
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F')
    
    doc.setTextColor(185, 28, 28)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Important Notice', margin + 5, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.text('This tool is a communication aid. It does not provide therapy, diagnosis, or medical advice.', margin + 5, y + 18)
    doc.text('Please discuss these observations with a qualified professional.', margin + 5, y + 24)

    doc.save(`say-it-better-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="space-y-4 animate-slide-up">
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
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Recurring Patterns Detected</h4>
            <p className="text-sm text-amber-700 mb-2">
              These themes have appeared in your previous translations:
            </p>
            <div className="flex flex-wrap gap-2">
              {recurringThemes.map((theme, i) => (
                <span key={i} className="text-xs bg-amber-200 text-amber-800 px-3 py-1 rounded-full font-medium">
                  {theme}
                </span>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              This is not a diagnosis — just a pattern in your language that may be worth discussing with someone you trust.
            </p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-soft-200/50 border border-soft-200 overflow-hidden">
        <div className="bg-gradient-to-r from-calm-500 to-calm-600 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <h3 className="font-medium">Clear Summary</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-soft-800 leading-relaxed text-lg">{result.summary}</p>
          <button
            onClick={() => onCopy(result.summary)}
            className="mt-4 flex items-center gap-2 text-sm text-calm-600 hover:text-calm-700 transition-colors"
          >
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy summary'}</span>
          </button>
        </div>
      </div>

      {/* Themes Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-soft-200/50 border border-soft-200 overflow-hidden">
        <div className="bg-gradient-to-r from-soft-600 to-soft-700 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Tag className="w-5 h-5" />
            <h3 className="font-medium">Key Themes</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-3">
            {result.themes.map((theme, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-soft-50 rounded-xl"
              >
                <span className="w-8 h-8 bg-calm-100 text-calm-700 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <h4 className="font-medium text-soft-800">{theme.theme}</h4>
                  <p className="text-sm text-soft-600">{theme.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share-Ready Card */}
      <div className="bg-white rounded-2xl shadow-lg shadow-soft-200/50 border border-calm-200 overflow-hidden">
        <div className="bg-gradient-to-r from-calm-400 to-calm-500 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Share2 className="w-5 h-5" />
            <h3 className="font-medium">Share-Ready Version</h3>
          </div>
          <p className="text-calm-100 text-sm mt-1">
            Polished language suitable for sharing with professionals or trusted people
          </p>
        </div>
        <div className="p-6">
          <div className="bg-calm-50 border border-calm-200 rounded-xl p-4 mb-4">
            <p className="text-soft-800 leading-relaxed italic">"{result.share_ready}"</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onCopy(result.share_ready)}
              className="flex items-center gap-2 px-4 py-2 bg-calm-500 text-white rounded-lg hover:bg-calm-600 transition-colors"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-soft-100 text-soft-700 rounded-lg hover:bg-soft-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>More Options</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-sm text-soft-500 py-2">
        <span>Original: {result.original_length} characters</span>
        <span className="w-1 h-1 bg-soft-300 rounded-full"></span>
        <span>Summary: {result.translated_length} characters</span>
      </div>
    </div>
  )
}

export default OutputSection
