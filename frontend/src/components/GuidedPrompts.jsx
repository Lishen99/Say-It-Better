import { Lightbulb, ChevronRight, Shuffle } from 'lucide-react'
import { useState } from 'react'

const PROMPTS = [
  {
    category: "Getting Started",
    prompts: [
      "I've been feeling... and it's been affecting my daily life by...",
      "Something that's been on my mind lately is...",
      "I'm not sure how to explain this, but...",
    ]
  },
  {
    category: "Physical Feelings",
    prompts: [
      "My body has been feeling... especially when...",
      "I've noticed that I'm having trouble with sleep/eating/energy because...",
      "I keep experiencing this physical sensation of...",
    ]
  },
  {
    category: "Emotional State",
    prompts: [
      "I feel overwhelmed when I think about...",
      "Something that's been making me anxious/sad/frustrated is...",
      "I've been struggling to feel... even when...",
    ]
  },
  {
    category: "Relationships",
    prompts: [
      "I'm finding it hard to communicate with... about...",
      "There's a situation with... that I don't know how to handle...",
      "I feel misunderstood by... when they...",
    ]
  },
  {
    category: "Work & Life",
    prompts: [
      "I'm feeling pressure about... and it's causing...",
      "I can't seem to find motivation for... because...",
      "There's a conflict between what I want and what I need to do about...",
    ]
  },
  {
    category: "Self-Reflection",
    prompts: [
      "I've been noticing a pattern in myself where...",
      "Something I wish I could change about how I feel is...",
      "I'm trying to understand why I react to... by...",
    ]
  }
]

function GuidedPrompts({ onSelectPrompt, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState(null)

  const getRandomPrompt = () => {
    const allPrompts = PROMPTS.flatMap(c => c.prompts)
    const random = allPrompts[Math.floor(Math.random() * allPrompts.length)]
    onSelectPrompt(random)
  }

  return (
    <div className="bg-white border-4 border-[#f39c12] shadow-[6px_6px_0px_0px_rgba(243,156,18,0.5)] overflow-hidden">
      {/* Header */}
      <div className="bg-[#f39c12] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wide text-sm">Not sure what to write?</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm uppercase tracking-wide font-medium"
          >
            Hide
          </button>
        </div>
        <p className="text-white/80 text-sm mt-1">
          Start with one of these prompts to help express your thoughts
        </p>
      </div>

      <div className="p-4">
        {/* Random Prompt Button */}
        <button
          onClick={getRandomPrompt}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#f39c12]/10 hover:bg-[#f39c12]/20 text-[#f39c12] border-2 border-[#f39c12] font-bold uppercase tracking-wide text-sm transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          <span>Give me a random prompt</span>
        </button>

        {/* Categories */}
        <div className="space-y-2">
          {PROMPTS.map((category) => (
            <div key={category.category} className="border-2 border-[#2d3436] overflow-hidden">
              <button
                onClick={() => setSelectedCategory(
                  selectedCategory === category.category ? null : category.category
                )}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f9f5f0] hover:bg-[#e8e3dd] transition-colors"
              >
                <span className="font-bold text-[#2d3436] uppercase tracking-wide text-sm">{category.category}</span>
                <ChevronRight className={`w-4 h-4 text-[#636e72] transition-transform ${
                  selectedCategory === category.category ? 'rotate-90' : ''
                }`} />
              </button>
              
              {selectedCategory === category.category && (
                <div className="p-3 space-y-2 bg-white">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectPrompt(prompt)}
                      className="w-full text-left p-3 bg-[#f9f5f0] hover:bg-[#14B8A6]/10 hover:border-[#14B8A6] border-2 border-transparent text-[#636e72] text-sm transition-colors font-serif"
                    >
                      "{prompt}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GuidedPrompts
