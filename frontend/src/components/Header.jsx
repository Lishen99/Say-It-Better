import { BookOpen, Cloud, Settings } from 'lucide-react'

function Header({ onGuideClick, onCloudClick, isCloudConnected, onAccessibilityClick }) {
  return (
    <header className="bg-[#2d3436] text-white relative z-40">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div data-logo="back" className="hc-logo-back w-10 h-10 bg-[#14B8A6] rounded-lg rotate-6 absolute"></div>
            <div data-logo="front" className="w-10 h-10 bg-[#0d9488] rounded-lg -rotate-3 relative flex items-center justify-center">
              <img src="/logo.png" alt="Say It Better" className="w-5 h-5 brightness-0 invert" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-lg tracking-tight">Say It Better</h2>
            <p className="text-xs text-[#5eead4] opacity-80">Express Yourself Clearly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCloudClick && (
            <button
              onClick={onCloudClick}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors rounded-lg font-medium ${isCloudConnected
                  ? 'text-white bg-green-600 hover:bg-green-700'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              title={isCloudConnected ? 'Cloud sync active' : 'Enable cloud sync'}
            >
              <Cloud className={`w-4 h-4 ${isCloudConnected ? '' : 'opacity-70'}`} />
              <span className="hidden sm:inline">{isCloudConnected ? 'Synced' : 'Cloud'}</span>
            </button>
          )}

          {onGuideClick && (
            <button
              onClick={onGuideClick}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-lg font-medium"
              title="User Guide"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          )}

          {onAccessibilityClick && (
            <button
              onClick={onAccessibilityClick}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors rounded-lg"
              title="Accessibility Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
