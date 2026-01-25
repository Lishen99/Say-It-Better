import { X, Brain, Download, Shield, Sparkles, FileText, Mic, TrendingUp, Link2, Mail, Cloud, Lock } from 'lucide-react'

function GuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] border-2 border-gray-200 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="hc-header bg-gradient-to-r from-[#2d3436] to-[#3d4a4c] text-white p-5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#14B8A6] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-lg">How to Use Say It Better</h2>
            </div>
            <button
              onClick={onClose}
              className="modal-close-btn p-2 hover:bg-white/20 transition-colors rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Overview */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-5 bg-[#14B8A6] rounded-full"></span>
              <h3 className="font-semibold text-[#2d3436]">Overview</h3>
            </div>
            <p className="text-[#636e72] leading-relaxed text-sm">
              Say It Better helps you express scattered thoughts clearly. Type or speak what's on your mind,
              and get a structured summary with key themes identified - perfect for sharing with a therapist
              or just understanding yourself better.
            </p>
          </section>

          {/* Step by Step */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-[#14B8A6] rounded-full"></span>
              <h3 className="font-semibold text-[#2d3436]">Step-by-Step Guide</h3>
            </div>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="bg-[#fafafa] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#2d3436] mb-1">Share Your Thoughts</h4>
                    <p className="text-[#636e72] text-sm leading-relaxed">
                      Type or paste what you're feeling. You can also use the
                      <span className="text-[#14B8A6] font-medium"> voice input</span> button to speak.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#fafafa] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#0d9488] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#2d3436] mb-1 flex items-center gap-2">
                      Click "Translate My Thoughts"
                      <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                    </h4>
                    <p className="text-[#636e72] text-sm leading-relaxed">
                      The tool will analyze your input and generate a clear summary with identified themes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#fafafa] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#2d3436] mb-1">Review & Save</h4>
                    <p className="text-[#636e72] text-sm leading-relaxed">
                      Read the clarified statement, key themes, and summary. Save as PDF or copy to share.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Features Grid */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-[#14B8A6] rounded-full"></span>
              <h3 className="font-semibold text-[#2d3436]">Powerful Features</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-4 h-4 text-[#14B8A6]" />
                  <h4 className="font-medium text-[#2d3436] text-sm">Voice Input</h4>
                </div>
                <p className="text-xs text-[#636e72]">Speak your thoughts naturally using the microphone button.</p>
              </div>

              <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[#14B8A6]" />
                  <h4 className="font-medium text-[#2d3436] text-sm">Theme Trends</h4>
                </div>
                <p className="text-xs text-[#636e72]">Visualize recurring emotional patterns over time.</p>
              </div>

              <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-[#14B8A6]" />
                  <h4 className="font-medium text-[#2d3436] text-sm">Cloud Sync</h4>
                </div>
                <p className="text-xs text-[#636e72]">Sync across devices with End-to-End Encryption.</p>
              </div>

              <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-[#14B8A6]" />
                  <h4 className="font-medium text-[#2d3436] text-sm">Therapist Summary</h4>
                </div>
                <p className="text-xs text-[#636e72]">Generate professional reports from your history.</p>
              </div>
            </div>
          </section>

          {/* Sharing Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-[#14B8A6] rounded-full"></span>
              <h3 className="font-semibold text-[#2d3436]">Sharing & Privacy</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#e6fffa] rounded-lg border border-[#14B8A6]/20">
                <Lock className="w-5 h-5 text-[#14B8A6] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-[#2d3436] text-sm mb-1">Zero-Knowledge Secure Links</h4>
                  <p className="text-xs text-[#636e72]">
                    Create temporary, encrypted links to share summaries. The encryption key is in the link itself
                    (after the #), meaning our server <strong>never sees your data</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Download className="w-4 h-4 text-[#636e72]" />
                    <span className="text-sm font-medium text-[#2d3436]">PDF Export</span>
                  </div>
                  <p className="text-xs text-[#636e72]">Download professionally formatted records.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-[#636e72]" />
                    <span className="text-sm font-medium text-[#2d3436]">Email Draft</span>
                  </div>
                  <p className="text-xs text-[#636e72]">Open directly in your mail app.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer - Fixed */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white px-5 py-3 transition-all font-semibold rounded-xl shadow-sm hover:shadow-md"
          >
            Got It, Let's Start
          </button>
        </div>
      </div>
    </div>
  )
}

export default GuideModal
