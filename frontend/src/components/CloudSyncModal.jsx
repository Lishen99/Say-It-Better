/**
 * CloudSyncModal - Zero-Knowledge E2E Encrypted Cloud Storage UI
 * 
 * Features:
 * - Username + passphrase for secure identification
 * - Secure passphrase setup with strength indicator
 * - Cloud sync toggle
 * - Backup/restore functionality
 * - Clear explanation of security model
 */

import { useState, useEffect } from 'react'
import { encryption } from '../services/encryption.js'
import { cloudStorage } from '../services/cloudStorage.js'

export default function CloudSyncModal({ isOpen, onClose, onSync, entries }) {
  const [mode, setMode] = useState('setup') // 'setup', 'connected', 'backup'
  const [username, setUsername] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [strength, setStrength] = useState({ score: 0, strength: 'none', feedback: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cloudAvailable, setCloudAvailable] = useState(false)
  const [connectedUsername, setConnectedUsername] = useState('')

  // Check cloud availability and auto-login on mount
  useEffect(() => {
    const init = async () => {
      // Try to auto-login from localStorage if not already connected
      if (!cloudStorage.isAuthenticated) {
        // Try localStorage first (persistent), then sessionStorage (session-only)
        const storedAuth = localStorage.getItem('sayitbetter_auth') || sessionStorage.getItem('sayitbetter_auth')
        if (storedAuth) {
          try {
            const { username: storedUser, passphrase: storedPass } = JSON.parse(storedAuth)
            await cloudStorage.initialize(storedUser, storedPass)
            setMode('connected')
            setConnectedUsername(storedUser)
            // Ensure both storages are in sync
            localStorage.setItem('sayitbetter_auth', storedAuth)
            sessionStorage.setItem('sayitbetter_auth', storedAuth)
            setSuccess('Restored connection from saved credentials')
          } catch (e) {
            console.error('Auto-login failed', e)
            // Clear invalid creds from both storages
            localStorage.removeItem('sayitbetter_auth')
            sessionStorage.removeItem('sayitbetter_auth')
          }
        }
      }

      checkCloudStatus()
    }

    if (isOpen) {
      init()
    }
  }, [isOpen])

  // Update passphrase strength
  useEffect(() => {
    if (passphrase) {
      setStrength(encryption.evaluatePassphraseStrength(passphrase))
    } else {
      setStrength({ score: 0, strength: 'none', feedback: [] })
    }
  }, [passphrase])

  const checkCloudStatus = async () => {
    try {
      const status = cloudStorage.getStatus()
      if (status.isEnabled) {
        setMode('connected')
        setConnectedUsername(status.username || '')
      }
      const available = await cloudStorage.checkAvailability()
      setCloudAvailable(available)
    } catch {
      setCloudAvailable(false)
    }
  }

  const handleConnect = async () => {
    setError('')
    setSuccess('')

    if (!username || username.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    if (!passphrase || passphrase.trim().length === 0) {
      setError('Passphrase cannot be empty')
      return
    }

    if (passphrase !== confirmPassphrase) {
      setError('Passphrases do not match')
      return
    }

    if (strength.strength === 'weak') {
      setError('Please choose a stronger passphrase')
      return
    }

    setIsLoading(true)

    try {
      // IMPORTANT: Use passphrase exactly as entered - any modification will cause decryption to fail
      // Do NOT trim or normalize the passphrase - it must match exactly what was used during initial setup
      const exactPassphrase = passphrase

      // Initialize cloud storage with username and passphrase
      await cloudStorage.initialize(username, exactPassphrase)

      // Save credentials for persistence (localStorage) and current session (sessionStorage)
      const authData = JSON.stringify({
        username: username,
        passphrase: exactPassphrase
      })
      localStorage.setItem('sayitbetter_auth', authData)
      sessionStorage.setItem('sayitbetter_auth', authData)

      // Sync entries using the exact same passphrase
      const result = await cloudStorage.syncEntries(entries || [], exactPassphrase)

      setSuccess(`Connected! ${result.mergedCount || result.entries?.length || 0} entries synced.`)
      setMode('connected')
      setConnectedUsername(username.trim().toLowerCase())

      if (onSync) {
        onSync(result.entries)
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to cloud storage')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Get passphrase from storage if not in state (for auto-login case)
      let currentPassphrase = passphrase
      if (!currentPassphrase) {
        // Try localStorage first (persistent), then sessionStorage
        const storedAuth = localStorage.getItem('sayitbetter_auth') || sessionStorage.getItem('sayitbetter_auth')
        if (storedAuth) {
          currentPassphrase = JSON.parse(storedAuth).passphrase
        }
      }

      if (!currentPassphrase) {
        throw new Error('Passphrase not found. Please reconnect.')
      }

      const result = await cloudStorage.syncEntries(entries || [], currentPassphrase)
      setSuccess(`Synced ${result.mergedCount || result.entries?.length || 0} entries`)

      if (onSync) {
        onSync(result.entries)
      }
    } catch (err) {
      setError(err.message || 'Sync failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    cloudStorage.disconnect()
    // Clear from both storages
    localStorage.removeItem('sayitbetter_auth')
    sessionStorage.removeItem('sayitbetter_auth')
    setUsername('')
    setPassphrase('')
    setConfirmPassphrase('')
    setConnectedUsername('')
    setMode('setup')
    setSuccess('Disconnected from cloud storage')
  }

  const handleDownloadBackup = async () => {
    setError('')
    setIsLoading(true)

    try {
      // Get passphrase from local storage if needed
      let currentPassphrase = passphrase
      if (!currentPassphrase) {
        const storedAuth = localStorage.getItem('sayitbetter_auth')
        if (storedAuth) {
          currentPassphrase = JSON.parse(storedAuth).passphrase
        }
      }

      const backup = await cloudStorage.createEncryptedBackup(entries || [], currentPassphrase)

      // Create download link
      const url = URL.createObjectURL(backup.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('Encrypted backup downloaded')
    } catch (err) {
      setError(err.message || 'Failed to create backup')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setIsLoading(true)

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      // Get passphrase from local storage if needed
      let currentPassphrase = passphrase
      if (!currentPassphrase) {
        const storedAuth = localStorage.getItem('sayitbetter_auth')
        if (storedAuth) {
          currentPassphrase = JSON.parse(storedAuth).passphrase
        }
      }

      const result = await cloudStorage.restoreFromBackup(backup, currentPassphrase)
      setSuccess(`Restored ${result.entryCount} entries from backup`)

      if (onSync) {
        onSync(result.entries)
      }
    } catch (err) {
      setError(err.message || 'Failed to restore backup. Wrong passphrase?')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const strengthColors = {
    none: 'bg-gray-200',
    weak: 'bg-red-500',
    moderate: 'bg-yellow-500',
    strong: 'bg-green-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-teal-100 rounded-t-2xl flex-shrink-0 hc-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Secure Cloud Sync</h2>
                <p className="text-sm text-gray-600">End-to-end encrypted storage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="modal-close-btn p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Security Notice */}
          <div className="p-4 mb-6 bg-teal-50 border-2 border-teal-200 rounded-xl hc-security-notice">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-teal-900">Zero-Knowledge Encryption</p>
                <p className="text-xs text-teal-700 mt-1">
                  Your data is encrypted on your device before upload. Only you can decrypt it with your passphrase.
                  <strong className="block mt-1">Even we cannot access your data.</strong>
                </p>
              </div>
            </div>
          </div>
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 mb-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {mode === 'setup' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter your username and passphrase to sync your data across devices. Use the same credentials on any device to access your encrypted data.
              </p>

              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username (min 3 characters)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                    autoComplete="username"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-1">This identifies your account across devices</p>
              </div>

              {/* Passphrase Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encryption Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => {
                      // Preserve exact input - don't trim or modify
                      setPassphrase(e.target.value)
                    }}
                    onBlur={(e) => {
                      // Ensure we don't lose any characters on blur
                      if (e.target.value !== passphrase) {
                        setPassphrase(e.target.value)
                      }
                    }}
                    placeholder="Enter a secure passphrase"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassphrase ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Strength Indicator */}
                {passphrase && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strengthColors[strength.strength]} transition-all`}
                          style={{ width: `${(strength.score / 7) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${strength.strength === 'strong' ? 'text-green-600' :
                        strength.strength === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {strength.strength}
                      </span>
                    </div>
                    {strength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-500 space-y-0.5">
                        {strength.feedback.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Passphrase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Passphrase
                </label>
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
                />
                {confirmPassphrase && passphrase !== confirmPassphrase && (
                  <p className="text-xs text-red-500 mt-1">Passphrases do not match</p>
                )}
              </div>

              {/* Warning */}
              <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>⚠️ Important:</strong> If you forget your username or passphrase, your data cannot be recovered.
                  We do not store your credentials and cannot reset them.
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  <strong>For existing accounts:</strong> Enter your passphrase EXACTLY as you did when you first set up cloud sync.
                  Any difference (including spaces) will prevent decryption.
                </p>
              </div>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={isLoading || !username || username.trim().length < 3 || !passphrase || passphrase !== confirmPassphrase || strength.strength === 'weak'}
                className="w-full py-3 px-4 bg-teal-500 text-white font-semibold rounded-xl shadow-lg hover:bg-teal-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Enable Cloud Sync
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'connected' && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="p-2 bg-green-500 rounded-full">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Cloud Sync Active</p>
                  <p className="text-xs text-green-600">Logged in as <strong>{connectedUsername}</strong></p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="py-3 px-4 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </button>

                <button
                  onClick={handleDownloadBackup}
                  disabled={isLoading}
                  className="py-3 px-4 bg-white border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Backup
                </button>
              </div>

              {/* Restore from backup */}
              <div>
                <label className="block w-full py-3 px-4 bg-white border-2 border-dashed border-gray-300 rounded-xl font-medium text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="flex items-center justify-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Restore from Backup
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Disconnect */}
              <button
                onClick={handleDisconnect}
                className="w-full py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Disconnect Cloud Sync
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            🔐 AES-256-GCM encryption • PBKDF2 key derivation • 100,000 iterations
          </p>
        </div>
      </div>
    </div>
  )
}
