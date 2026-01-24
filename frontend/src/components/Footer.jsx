import { AlertTriangle, X, Lock, Check } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-[#2d3436] text-white py-12 px-6 mt-16">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - About */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-[#14B8A6] flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <h3 className="text-lg font-semibold">Say It Better</h3>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm">
              An AI-powered communication aid that transforms raw, emotional thoughts into clear, calm language. 
              We don't analyze your mind — we help you express it.
            </p>
          </div>

          {/* Right Side - What This Tool Doesn't Do */}
          <div>
            <h3 className="font-medium mb-3 text-gray-300">This tool does not:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <X className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span>Provide therapy or counseling</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <X className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span>Diagnose conditions or give medical advice</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <X className="w-4 h-4 text-red-400/70 flex-shrink-0" />
                <span>Replace professional care</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Crisis Support Banner */}
        <div className="mt-8 p-4 bg-[#1a1d1f] rounded-xl border border-[#14B8A6]/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-2">Need Immediate Support?</h4>
              <p className="text-gray-400 text-sm mb-3">
                If you're experiencing a mental health crisis, please reach out:
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
                <span><span className="text-white font-medium">Emergency:</span> 911</span>
                <span><span className="text-white font-medium">Suicide Prevention:</span> 988</span>
                <span><span className="text-white font-medium">Crisis Text:</span> Text HOME to 741741</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 pt-6 border-t border-gray-700/50 flex items-center justify-center gap-2 text-gray-500 text-xs">
          <Lock className="w-3.5 h-3.5" />
          <p>Your data stays local. Nothing is stored on our servers.</p>
        </div>

        {/* Copyright */}
        <div className="mt-4 text-center text-xs text-gray-600">
          <p>Built with care for TechNation Hackathon 2026</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
