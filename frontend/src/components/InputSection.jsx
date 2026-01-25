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

  const characterCountColor = () => {
    const percentage = (charCount / maxChars) * 100
    if (percentage >= 90) return 'text-red-500'
    if (percentage >= 75) return 'text-orange-500'
    return 'text-[#636e72]'
  }

  return (
    <div className="space-y-6 relative mb-10">
      {/* Guided Prompts */}
      {showPrompts && (
        <GuidedPrompts 
          onSelectPrompt={handleSelectPrompt}
          onClose={() => setShowPrompts(false)}
        />
      )}

      <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-sm p-6 md:p-8">
        {/* Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-[#2d3436] flex items-center gap-2">
              <span className="w-1 h-4 bg-[#14B8A6] rounded-full"></span>
              Your Thoughts
            </label>
            <span className={`text-xs ${characterCountColor()} transition-colors font-mono`}>
              {charCount}/{maxChars}
            </span>
          </div>
          <p className="text-sm text-[#636e72] mb-3">
            Share what's on your mind - raw, unfiltered, however it comes out.
          </p>
          
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="I don't even know what's wrong. I feel tired all the time, I can't focus, and everything just feels heavy and overwhelming. It's like I'm carrying something I can't see but it weighs me down every day..."
            className="w-full h-44 px-4 py-3 border border-[#d0d5dd] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] text-base text-[#2d3436] placeholder:text-[#b2bec3] bg-[#fafafa] leading-relaxed transition-all"
            maxLength={maxChars}
          />
        </div>

        {/* Output Tone Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-[#14B8A6] rounded-full"></span>
            <label className="text-sm font-semibold text-[#2d3436]">
              Output Tone
            </label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'neutral', label: 'Neutral' },
              { value: 'personal', label: 'Personal' },
              { value: 'clinical', label: 'Clinical' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  tone === option.value
                    ? 'bg-[#14B8A6] text-white shadow-sm'
                    : 'bg-[#f5f5f5] text-[#636e72] hover:bg-[#e8e8e8]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onTranslate}
            disabled={loading || charCount < minChars}
            className="flex-1 min-w-[180px] flex items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#0d9488] text-white px-5 py-3 transition-all font-semibold text-sm rounded-xl shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
            className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              showPrompts 
                ? 'bg-[#f39c12] text-white shadow-sm' 
                : 'bg-[#f5f5f5] text-[#636e72] hover:bg-[#e8e8e8]'
            }`}
            title="Get writing prompts"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
          
          <button
            onClick={onClear}
            disabled={loading || !rawText}
            className="p-3 rounded-xl bg-[#f5f5f5] text-[#636e72] hover:bg-[#e8e8e8] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
