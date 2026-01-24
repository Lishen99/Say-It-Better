/**
 * Cloud Storage Service for Say It Better
 * 
 * ZERO-KNOWLEDGE CLOUD STORAGE:
 * - All data is encrypted client-side BEFORE upload
 * - Server only stores encrypted blobs
 * - Only the user with the correct username + passphrase can decrypt
 * - Developers have NO access to plaintext data
 * 
 * User Identification: username + passphrase → unique user ID
 * - Username: identifies the user (like an account name)
 * - Passphrase: encrypts the data (the secret key)
 */

import { encryption } from './encryption.js'

class CloudStorageService {
  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_CLOUD_API_URL || '/api/cloud'
    this.isEnabled = false
    this.userId = null
    this.username = null
    this.isAuthenticated = false
    this.syncInProgress = false
  }

  /**
   * Initialize cloud storage with username and passphrase
   * @param {string} username - User's unique username
   * @param {string} passphrase - User's encryption passphrase
   */
  async initialize(username, passphrase) {
    if (!encryption.isAvailable()) {
      throw new Error('Encryption not available in this browser')
    }

    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters')
    }

    // Generate user ID from username + passphrase
    this.username = username.trim().toLowerCase()
    this.userId = await this._getUserId(this.username, passphrase)
    
    // Cache the encryption key
    await encryption.cacheKey(passphrase)
    
    this.isEnabled = true
    this.isAuthenticated = true
    
    return {
      userId: this.userId,
      username: this.username,
      isEnabled: this.isEnabled
    }
  }

  /**
   * Generate a deterministic user ID from username + passphrase
   * This ensures:
   * - Same username + passphrase = same data from any device
   * - Different usernames = different data (even with same passphrase)
   * - Cannot reverse-engineer username or passphrase from user ID
   */
  async _getUserId(username, passphrase) {
    // Create a deterministic but non-reversible user ID
    const encoder = new TextEncoder()
    const data = encoder.encode(username + ':' + passphrase + '_sayitbetter_userid_v2')
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    
    // Convert to hex string (first 32 chars = 128 bits)
    const hashArray = new Uint8Array(hashBuffer)
    const hashHex = Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return 'user_' + hashHex.substring(0, 32)
  }

  /**
   * Upload encrypted entries to cloud
   * @param {Array} entries - Array of entry objects
   * @param {string} passphrase - User's passphrase for encryption
   */
  async uploadEntries(entries, passphrase) {
    if (!this.isEnabled) {
      throw new Error('Cloud storage not initialized')
    }

    this.syncInProgress = true

    try {
      // Encrypt the entire entries array
      const encryptedPackage = await encryption.encrypt(entries, passphrase)
      
      // Add metadata (NOT encrypted, but contains NO user data)
      const cloudPayload = {
        userId: this.userId,
        encryptedData: encryptedPackage,
        entryCount: entries.length,
        lastModified: new Date().toISOString(),
        checksum: await encryption.calculateChecksum(entries),
        version: 1
      }

      // Upload to cloud
      const response = await fetch(`${this.apiBaseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cloudPayload)
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(error.message || 'Cloud upload failed')
      }

      const result = await response.json()
      
      return {
        success: true,
        timestamp: result.timestamp,
        entryCount: entries.length
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Download and decrypt entries from cloud
   * @param {string} passphrase - User's passphrase for decryption
   */
  async downloadEntries(passphrase) {
    if (!this.isEnabled) {
      throw new Error('Cloud storage not initialized')
    }

    this.syncInProgress = true

    try {
      // Fetch encrypted data from cloud
      const response = await fetch(`${this.apiBaseUrl}/sync/${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No cloud data yet
          return { success: true, entries: [], isNew: true }
        }
        const error = await response.json().catch(() => ({ message: 'Download failed' }))
        throw new Error(error.message || 'Cloud download failed')
      }

      const cloudData = await response.json()
      
      // Decrypt the entries
      const entries = await encryption.decrypt(cloudData.encryptedData, passphrase)
      
      // Verify checksum
      const checksum = await encryption.calculateChecksum(entries)
      if (checksum !== cloudData.checksum) {
        console.warn('Data checksum mismatch - data may be corrupted')
      }

      return {
        success: true,
        entries: entries,
        lastModified: cloudData.lastModified,
        entryCount: entries.length
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Sync local entries with cloud (merge strategy)
   * @param {Array} localEntries - Local entries from IndexedDB
   * @param {string} passphrase - User's passphrase
   */
  async syncEntries(localEntries, passphrase) {
    if (!this.isEnabled) {
      throw new Error('Cloud storage not initialized')
    }

    try {
      // Download cloud entries
      const cloudResult = await this.downloadEntries(passphrase)
      
      if (cloudResult.isNew) {
        // No cloud data, upload local
        if (localEntries.length > 0) {
          await this.uploadEntries(localEntries, passphrase)
        }
        return { entries: localEntries, action: 'uploaded' }
      }

      const cloudEntries = cloudResult.entries || []
      
      // Merge entries (latest version wins)
      const mergedEntries = this._mergeEntries(localEntries, cloudEntries)
      
      // Upload merged entries
      await this.uploadEntries(mergedEntries, passphrase)
      
      return {
        entries: mergedEntries,
        action: 'merged',
        localCount: localEntries.length,
        cloudCount: cloudEntries.length,
        mergedCount: mergedEntries.length
      }
    } catch (error) {
      console.error('Sync failed:', error)
      throw error
    }
  }

  /**
   * Merge local and cloud entries
   * Strategy: Keep all unique entries, for duplicates keep the newer version
   */
  _mergeEntries(local, cloud) {
    const entriesMap = new Map()
    
    // Add cloud entries first
    for (const entry of cloud) {
      entriesMap.set(entry.id, entry)
    }
    
    // Override with local entries if they're newer
    for (const entry of local) {
      const existing = entriesMap.get(entry.id)
      if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
        entriesMap.set(entry.id, entry)
      }
    }
    
    // Convert back to array and sort by timestamp (newest first)
    return Array.from(entriesMap.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  /**
   * Delete all cloud data for this user
   * @param {string} passphrase - User's passphrase to verify identity
   */
  async deleteAllCloudData(passphrase) {
    if (!this.isEnabled) {
      throw new Error('Cloud storage not initialized')
    }

    // Verify passphrase
    const isValid = await encryption.verifyPassphrase(passphrase)
    if (!isValid) {
      throw new Error('Invalid passphrase')
    }

    const response = await fetch(`${this.apiBaseUrl}/sync/${this.userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete cloud data')
    }

    return { success: true }
  }

  /**
   * Check if cloud storage is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET'
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Disconnect from cloud (clear local auth state)
   */
  disconnect() {
    encryption.clearCachedKey()
    this.isEnabled = false
    this.isAuthenticated = false
    this.userId = null
    this.username = null
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isAuthenticated: this.isAuthenticated,
      syncInProgress: this.syncInProgress,
      username: this.username,
      userId: this.userId ? this.userId.substring(0, 12) + '...' : null
    }
  }

  /**
   * Export encrypted backup for manual download
   * @param {Array} entries - Entries to backup
   * @param {string} passphrase - Encryption passphrase
   */
  async createEncryptedBackup(entries, passphrase) {
    const encryptedPackage = await encryption.encrypt(entries, passphrase)
    
    const backup = {
      type: 'sayitbetter_encrypted_backup',
      version: 1,
      createdAt: new Date().toISOString(),
      entryCount: entries.length,
      encryptedData: encryptedPackage,
      checksum: await encryption.calculateChecksum(entries)
    }

    // Create downloadable blob
    const blob = new Blob([JSON.stringify(backup, null, 2)], { 
      type: 'application/json' 
    })
    
    return {
      blob,
      filename: `sayitbetter_backup_${new Date().toISOString().split('T')[0]}.encrypted.json`
    }
  }

  /**
   * Restore from encrypted backup file
   * @param {Object} backup - Backup object from file
   * @param {string} passphrase - Decryption passphrase
   */
  async restoreFromBackup(backup, passphrase) {
    if (backup.type !== 'sayitbetter_encrypted_backup') {
      throw new Error('Invalid backup file format')
    }

    const entries = await encryption.decrypt(backup.encryptedData, passphrase)
    
    // Verify checksum
    const checksum = await encryption.calculateChecksum(entries)
    if (checksum !== backup.checksum) {
      throw new Error('Backup file is corrupted')
    }

    return {
      entries,
      createdAt: backup.createdAt,
      entryCount: entries.length
    }
  }
}

// Export singleton instance
export const cloudStorage = new CloudStorageService()
export default cloudStorage
