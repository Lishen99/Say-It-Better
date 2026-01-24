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
    <div className="bg-white rounded-2xl shadow-lg shadow-soft-200/50 border border-amber-200 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-medium">Not sure what to write?</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-sm"
          >
            Hide prompts
          </button>
        </div>
        <p className="text-amber-100 text-sm mt-1">
          Start with one of these prompts to help express your thoughts
        </p>
      </div>

      <div className="p-4">
        {/* Random Prompt Button */}
        <button
          onClick={getRandomPrompt}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors border border-amber-200"
        >
          <Shuffle className="w-4 h-4" />
          <span>Give me a random prompt</span>
        </button>

        {/* Categories */}
        <div className="space-y-2">
          {PROMPTS.map((category) => (
            <div key={category.category} className="border border-soft-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setSelectedCategory(
                  selectedCategory === category.category ? null : category.category
                )}
                className="w-full flex items-center justify-between px-4 py-3 bg-soft-50 hover:bg-soft-100 transition-colors"
              >
                <span className="font-medium text-soft-700">{category.category}</span>
                <ChevronRight className={`w-4 h-4 text-soft-400 transition-transform ${
                  selectedCategory === category.category ? 'rotate-90' : ''
                }`} />
              </button>
              
              {selectedCategory === category.category && (
                <div className="p-3 space-y-2 bg-white">
                  {category.prompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => onSelectPrompt(prompt)}
                      className="w-full text-left p-3 rounded-lg bg-soft-50 hover:bg-calm-50 hover:border-calm-200 border border-transparent text-soft-700 text-sm transition-colors"
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
