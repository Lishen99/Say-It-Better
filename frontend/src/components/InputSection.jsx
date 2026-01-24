import { Send, Trash2, Sparkles, Loader2, Lightbulb } from 'lucide-react'
import VoiceInput from './VoiceInput'
import GuidedPrompts from './GuidedPrompts'
import { useState } from 'react'

function InputSection({ rawText, setRawText, tone, setTone, onTranslate, onClear, loading }) {
  const [showPrompts, setShowPrompts] = useState(false)
  const charCount = rawText.length
  const minChars = 10
  const maxChars = 5000

  const handleVoiceTranscript = (transcript) => {
    setRawText(prev => prev + (prev ? ' ' : '') + transcript)
  }

  const handleSelectPrompt = (prompt) => {
    setRawText(prompt)
    setShowPrompts(false)
  }

  return (
    <div className="space-y-4">
      {/* Guided Prompts */}
      {showPrompts && (
        <GuidedPrompts 
          onSelectPrompt={handleSelectPrompt}
          onClose={() => setShowPrompts(false)}
        />
      )}

      <div className="bg-white rounded-2xl shadow-lg shadow-soft-200/50 border border-soft-200 overflow-hidden animate-fade-in">
      {/* Input Header */}
      <div className="bg-gradient-to-r from-soft-50 to-calm-50 px-6 py-4 border-b border-soft-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-soft-800">Write your thoughts</h3>
            <p className="text-sm text-soft-500">Express yourself freely — no formatting needed</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${charCount < minChars ? 'text-red-500' : charCount > maxChars ? 'text-red-500' : 'text-soft-400'}`}>
              {charCount} / {maxChars}
            </span>
          </div>
        </div>
      </div>

      {/* Text Area */}
      <div className="p-6">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="I don't even know what's wrong. I feel tired all the time, I can't focus, and everything just feels heavy and overwhelming. It's like I'm carrying something I can't see but it weighs me down every day..."
          className="w-full h-48 p-4 bg-soft-50 rounded-xl border border-soft-200 resize-none text-soft-800 placeholder-soft-400 focus:border-calm-400 focus:bg-white transition-all text-base leading-relaxed"
          maxLength={maxChars}
        />
      </div>

      {/* Tone Selector */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-soft-600">Output tone:</span>
          <div className="flex gap-2">
            {[
              { value: 'neutral', label: 'Neutral', desc: 'Balanced and clear' },
              { value: 'personal', label: 'Personal', desc: 'Warmer, first-person' },
              { value: 'clinical', label: 'Clinical', desc: 'Medical-appropriate' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tone === option.value
                    ? 'bg-calm-500 text-white shadow-md'
                    : 'bg-soft-100 text-soft-600 hover:bg-soft-200'
                }`}
                title={option.desc}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <button
          onClick={onTranslate}
          disabled={loading || charCount < minChars}
          className="flex-1 bg-gradient-to-r from-calm-500 to-calm-600 text-white py-3.5 px-6 rounded-xl font-medium hover:from-calm-600 hover:to-calm-700 transition-all shadow-lg shadow-calm-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Translate My Thoughts</span>
            </>
          )}
        </button>
        
        {/* Voice Input */}
        <VoiceInput 
          onTranscript={handleVoiceTranscript}
          disabled={loading}
        />
        
        {/* Guided Prompts Toggle */}
        <button
          onClick={() => setShowPrompts(!showPrompts)}
          disabled={loading}
          className={`p-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            showPrompts 
              ? 'bg-amber-500 text-white' 
              : 'bg-soft-100 text-soft-600 hover:bg-soft-200'
          }`}
          title="Get writing prompts"
        >
          <Lightbulb className="w-5 h-5" />
        </button>
        
        <button
          onClick={onClear}
          disabled={loading || !rawText}
          className="p-3.5 rounded-xl bg-soft-100 text-soft-600 hover:bg-soft-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
    </div>
  )
}

export default InputSection
