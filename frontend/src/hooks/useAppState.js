/**
 * Custom React Hooks for Say It Better
 * 
 * These hooks separate business logic from UI components,
 * making it easy to swap out the UI (e.g., from Figma) while keeping the logic intact.
 */

import { useState, useEffect, useCallback } from 'react'
import storage from '../services/storage'

const API_BASE = 'http://localhost:8000'

/**
 * Hook for managing translation operations
 */
export function useTranslation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const translate = useCallback(async (rawText, tone = 'neutral') => {
    if (rawText.trim().length < 10) {
      setError('Please enter at least 10 characters to translate.')
      return null
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: rawText, tone })
      })

      if (!response.ok) {
        throw new Error('Failed to translate. Please try again.')
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { translate, clear, loading, error, result }
}

/**
 * Hook for managing entry history
 */
export function useHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  // Initialize and load history
  useEffect(() => {
    const init = async () => {
      await storage.init()
      await storage.migrateFromOldStorage()
      const entries = await storage.getAllEntries()
      setHistory(entries)
      setLoading(false)
    }
    init()
  }, [])

  const addEntry = useCallback(async (entry) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      ...entry
    }
    await storage.saveEntry(newEntry)
    const updated = await storage.getAllEntries()
    setHistory(updated)
    return newEntry
  }, [])

  const deleteEntry = useCallback(async (id) => {
    await storage.deleteEntry(id)
    const updated = await storage.getAllEntries()
    setHistory(updated)
  }, [])

  const clearAll = useCallback(async () => {
    await storage.clearAll()
    setHistory([])
  }, [])

  const getByDateRange = useCallback(async (startDate, endDate) => {
    return storage.getEntriesByDateRange(startDate, endDate)
  }, [])

  return { 
    history, 
    loading, 
    addEntry, 
    deleteEntry, 
    clearAll, 
    getByDateRange 
  }
}

/**
 * Hook for theme analysis
 */
export function useThemeAnalysis() {
  const [recurringThemes, setRecurringThemes] = useState([])
  const [loading, setLoading] = useState(false)

  const analyzeThemes = useCallback(async (currentThemes, pastThemes) => {
    if (!currentThemes?.length || !pastThemes?.length) {
      return []
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/analyze-themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_themes: currentThemes,
          past_themes: pastThemes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecurringThemes(data.recurring_themes || [])
        return data.recurring_themes || []
      }
    } catch (err) {
      console.log('Theme analysis unavailable:', err)
    } finally {
      setLoading(false)
    }
    return []
  }, [])

  return { recurringThemes, loading, analyzeThemes }
}

/**
 * Hook for clipboard operations
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }, [])

  return { copy, copied }
}

/**
 * Hook for file download
 */
export function useDownload() {
  const download = useCallback((content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  return { download }
}

/**
 * Hook for disclaimer modal
 */
export function useDisclaimer() {
  const [showDisclaimer, setShowDisclaimer] = useState(true)

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimer_accepted')
    if (accepted) {
      setShowDisclaimer(false)
    }
  }, [])

  const acceptDisclaimer = useCallback(() => {
    localStorage.setItem('disclaimer_accepted', 'true')
    setShowDisclaimer(false)
  }, [])

  const resetDisclaimer = useCallback(() => {
    localStorage.removeItem('disclaimer_accepted')
    setShowDisclaimer(true)
  }, [])

  return { showDisclaimer, acceptDisclaimer, resetDisclaimer }
}
