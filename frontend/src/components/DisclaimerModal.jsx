import { AlertTriangle, Shield, Heart, X } from 'lucide-react'

function DisclaimerModal({ onAccept }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soft-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-calm-500 to-calm-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-semibold">Welcome to Say It Better</h2>
              <p className="text-calm-100 text-sm">Please read before continuing</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What This Tool Is */}
          <div>
            <h3 className="font-semibold text-soft-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-calm-500" />
              What This Tool Is
            </h3>
            <p className="text-soft-600 text-sm leading-relaxed">
              Say It Better is a <strong>communication aid</strong> that helps you translate 
              emotional or unstructured thoughts into clear, calm language. It's designed to 
              help you express yourself better when talking to therapists, doctors, or 
              trusted people in your life.
            </p>
          </div>

          {/* What This Tool Is NOT */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Important: What This Tool Is NOT
            </h3>
            <ul className="text-sm text-amber-700 space-y-1.5">
              <li>❌ This is <strong>not therapy</strong> or counseling</li>
              <li>❌ This does <strong>not diagnose</strong> any conditions</li>
              <li>❌ This does <strong>not provide medical advice</strong></li>
              <li>❌ This does <strong>not handle crisis situations</strong></li>
              <li>❌ This is <strong>not a replacement</strong> for professional care</li>
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="font-semibold text-soft-800 mb-2">Your Privacy</h3>
            <p className="text-soft-600 text-sm leading-relaxed">
              Your text is processed only for the current request. We do not store your 
              personal thoughts, use them for training, or share them with anyone. 
              Local history is stored only on your device and can be cleared anytime.
            </p>
          </div>

          {/* Crisis Resources */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-800 mb-2">If You Need Immediate Help</h3>
            <p className="text-sm text-red-700 mb-2">
              If you're experiencing a mental health crisis, please contact:
            </p>
            <ul className="text-sm text-red-700 space-y-1">
              <li><strong>Emergency Services:</strong> 911</li>
              <li><strong>Suicide Prevention Lifeline:</strong> 988</li>
              <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-soft-50 border-t border-soft-200 rounded-b-2xl">
          <button
            onClick={onAccept}
            className="w-full bg-gradient-to-r from-calm-500 to-calm-600 text-white py-3 px-6 rounded-xl font-medium hover:from-calm-600 hover:to-calm-700 transition-all shadow-lg shadow-calm-500/25 flex items-center justify-center gap-2"
          >
            <span>I Understand — Continue</span>
          </button>
          <p className="text-center text-xs text-soft-500 mt-3">
            By continuing, you acknowledge that this tool is a communication aid only.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DisclaimerModal
