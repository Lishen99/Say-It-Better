import { AlertTriangle, Shield, Heart, X, Lock } from 'lucide-react'

function DisclaimerModal({ onAccept }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border-2 border-gray-200 shadow-xl rounded-2xl max-w-lg w-full max-h-[90vh] border-2 border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d3436] to-[#3d4a4c] text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#14B8A6] rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Welcome</h2>
              <p className="text-gray-300 text-sm">Please read before continuing</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* What This Tool Is */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-[#14B8A6]" />
              <h3 className="font-semibold text-sm text-[#2d3436]">
                What This Tool Is
              </h3>
            </div>
            <p className="text-[#636e72] leading-relaxed">
              Say It Better is a <strong className="text-[#2d3436]">communication aid</strong> that helps you translate 
              emotional or unstructured thoughts into clear, calm language. It's designed to 
              help you express yourself better when talking to therapists, doctors, or 
              trusted people in your life.
            </p>
          </div>

          {/* What This Tool Is NOT */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-sm text-amber-800">
                Important: What This Tool Is NOT
              </h3>
            </div>
            <ul className="text-sm text-amber-700 space-y-2">
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>This is <strong>not therapy</strong> or counseling</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>This does <strong>not diagnose</strong> any conditions</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>This does <strong>not provide medical advice</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>This does <strong>not handle crisis situations</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-500" />
                <span>This is <strong>not a replacement</strong> for professional care</span>
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-5 h-5 text-[#14B8A6]" />
              <h3 className="font-semibold text-sm text-[#2d3436]">
                Your Privacy
              </h3>
            </div>
            <p className="text-[#636e72] leading-relaxed text-sm">
              Your text is processed only for the current request. We do not use your data for training 
              or share it with anyone. History is stored locally in your browser by default. 
              <strong className="text-[#2d3436]">Optional cloud sync uses end-to-end encryption</strong> — 
              only you can decrypt your data with your passphrase.
            </p>
          </div>

          {/* Crisis Resources */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-red-800 mb-3">
              If You Need Immediate Help
            </h3>
            <p className="text-sm text-red-700 mb-3">
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
        <div className="p-6 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex-shrink-0">
          <button
            onClick={onAccept}
            className="w-full bg-[#14B8A6] hover:bg-[#0d9488] text-white py-4 px-6 font-semibold rounded-xl shadow-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>I Understand — Continue</span>
          </button>
          <p className="text-center text-xs text-[#636e72] mt-4">
            By continuing, you acknowledge that this tool is a communication aid only.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DisclaimerModal
