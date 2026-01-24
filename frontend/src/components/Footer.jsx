import { Heart, Shield, AlertTriangle } from 'lucide-react'

function Footer() {
  return (
    <footer id="about" className="bg-soft-800 text-soft-300 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-calm-400" />
              <h3 className="text-lg font-semibold text-white">Say It Better</h3>
            </div>
            <p className="text-sm leading-relaxed">
              An AI-powered communication aid that transforms raw, emotional thoughts 
              into clear, calm language. We don't analyze your mind — we help you express it.
            </p>
          </div>

          {/* What We Don't Do */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-calm-400" />
              What This Tool Doesn't Do
            </h3>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Provide therapy or counseling
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Diagnose conditions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Give medical or psychological advice
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">✗</span> Replace professional care
              </li>
            </ul>
          </div>
        </div>

        {/* Crisis Resources */}
        <div className="bg-soft-700/50 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-white mb-2">Need immediate support?</h4>
              <p className="text-sm mb-3">
                If you're experiencing a mental health crisis, please reach out to professional help:
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <span><strong className="text-white">Emergency:</strong> 911</span>
                <span><strong className="text-white">Suicide Prevention:</strong> 988</span>
                <span><strong className="text-white">Crisis Text:</strong> Text HOME to 741741</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-soft-500 pt-4 border-t border-soft-700">
          <p>
            Built with care for TechNation Hackathon 2026. 
            This tool is a communication aid, not a replacement for professional care.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
