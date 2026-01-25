import { useState, useEffect } from 'react'
import { Settings, Check, Type, Eye, Zap, Type as TypeIcon } from 'lucide-react'

// Hook to manage accessibility settings
export function useAccessibility() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('accessibility_settings')
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      textSize: 'normal', // normal, large, xlarge
      readableFont: false,
      reduceMotion: false
    }
  })

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement
    const body = document.body

    // 1. Text Size (handled via root font-size percentage)
    if (settings.textSize === 'large') root.style.fontSize = '110%'
    else if (settings.textSize === 'xlarge') root.style.fontSize = '125%'
    else root.style.fontSize = '100%'

    // 2. High Contrast
    if (settings.highContrast) body.classList.add('high-contrast')
    else body.classList.remove('high-contrast')

    // 3. Readable Font
    if (settings.readableFont) body.classList.add('readable-font')
    else body.classList.remove('readable-font')

    // 4. Reduced Motion
    if (settings.reduceMotion) body.classList.add('reduce-motion')
    else body.classList.remove('reduce-motion')

    // Save to local storage
    localStorage.setItem('accessibility_settings', JSON.stringify(settings))
  }, [settings])

  const toggleSetting = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const setTextSize = (size) => {
    setSettings(prev => ({ ...prev, textSize: size }))
  }

  return { settings, toggleSetting, setTextSize }
}

// The Menu Component
export default function AccessibilityMenu({ isOpen, onClose, settings, toggleSetting, setTextSize }) {
  if (!isOpen) return null

  return (
    <div className="absolute top-16 right-6 z-50 w-72 bg-white rounded-xl shadow-xl border-2 border-gray-200 overflow-hidden animate-fade-in">
      <div className="p-4 bg-[#2d3436] text-white flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Accessibility
        </h3>
        <button onClick={onClose} className="hover:text-gray-300">✕</button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Text Size */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
            <Type className="w-4 h-4" /> Text Size
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['normal', 'large', 'xlarge'].map((size) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`flex-1 py-1 text-sm rounded-md transition-all ${
                  settings.textSize === size 
                    ? 'bg-white shadow text-[#14B8A6] font-bold' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast */}
        <button
          onClick={() => toggleSetting('highContrast')}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-[#14B8A6] text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Eye className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">High Contrast</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.highContrast ? 'bg-[#14B8A6]' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.highContrast ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Readable Font */}
        <button
          onClick={() => toggleSetting('readableFont')}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.readableFont ? 'bg-[#14B8A6] text-white' : 'bg-gray-100 text-gray-500'}`}>
              <TypeIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">Readable Font</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.readableFont ? 'bg-[#14B8A6]' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.readableFont ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Reduce Motion */}
        <button
          onClick={() => toggleSetting('reduceMotion')}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.reduceMotion ? 'bg-[#14B8A6] text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">Reduce Motion</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.reduceMotion ? 'bg-[#14B8A6]' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.reduceMotion ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  )
}
