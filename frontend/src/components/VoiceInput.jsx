import { Mic, MicOff, AlertCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

function VoiceInput({ onTranscript, disabled }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.')
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else {
        setError('Voice input error. Please try again.')
      }
    }

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + ' '
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)
      
      if (final) {
        onTranscript(final.trim())
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setError(null)
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start recognition:', err)
      }
    }
  }

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-3.5 rounded-xl bg-soft-100 text-soft-400 cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={`p-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25' 
            : 'bg-soft-100 text-soft-600 hover:bg-soft-200'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap animate-fade-in">
          🎤 Listening...
        </div>
      )}

      {/* Interim transcript preview */}
      {interimTranscript && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-soft-800 text-white text-xs px-3 py-1.5 rounded-lg max-w-[200px] truncate">
          "{interimTranscript}"
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg whitespace-nowrap flex items-center gap-1.5 z-10">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  )
}

export default VoiceInput
