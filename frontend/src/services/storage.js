/**
 * Storage Service for Say It Better
 * Uses IndexedDB for larger storage capacity (50%+ of disk space vs 5-10MB localStorage)
 * Falls back to localStorage if IndexedDB is unavailable
 * 
 * This service is designed to be easily swapped with a backend API later
 */

const DB_NAME = 'SayItBetterDB'
const DB_VERSION = 1
const STORE_NAME = 'entries'

class StorageService {
  constructor() {
    this.db = null
    this.isIndexedDBAvailable = 'indexedDB' in window
  }

  /**
   * Initialize the database connection
   */
  async init() {
    if (!this.isIndexedDBAvailable) {
      console.warn('IndexedDB not available, falling back to localStorage')
      return false
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        this.isIndexedDBAvailable = false
        resolve(false)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create the entries store with indexes
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('date', 'date', { unique: false })
        }
      }
    })
  }

  /**
   * Save a new entry
   */
  async saveEntry(entry) {
    if (this.db) {
      return this._saveToIndexedDB(entry)
    }
    return this._saveToLocalStorage(entry)
  }

  /**
   * Get all entries (including deleted ones)
   * Used for synchronization to ensure tombstones are propagated
   */
  async getAllEntries() {
    if (this.db) {
      return this._getAllFromIndexedDB()
    }
    return this._getAllFromLocalStorage()
  }

  /**
   * Get only active (non-deleted) entries
   * Used for UI display
   */
  async getActiveEntries() {
    const all = await this.getAllEntries()
    return all.filter(e => !e.deleted)
  }

  /**
   * Soft Delete an entry (Mark as deleted)
   * This allows the deletion to be synced to other devices
   */
  async softDeleteEntry(id) {
    // get existing entry first to preserve data
    const entries = await this.getAllEntries()
    const entry = entries.find(e => e.id === id)

    if (entry) {
      const deletedEntry = {
        ...entry,
        deleted: true,
        timestamp: new Date().toISOString() // Update timestamp so this "change" wins conflict resolution
      }
      return this.saveEntry(deletedEntry)
    }
    return false
  }

  /**
   * Hard Delete a specific entry by ID (Permanent)
   */
  async deleteEntry(id) {
    if (this.db) {
      return this._deleteFromIndexedDB(id)
    }
    return this._deleteFromLocalStorage(id)
  }

  /**
   * Delete all entries
   */
  async clearAll() {
    if (this.db) {
      return this._clearIndexedDB()
    }
    return this._clearLocalStorage()
  }

  /**
   * Get entries within a date range
   */
  async getEntriesByDateRange(startDate, endDate) {
    const allEntries = await this.getAllEntries()
    return allEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp)
      return entryDate >= startDate && entryDate <= endDate
    })
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      }
    }
    return { used: 0, available: 0, percentUsed: 0 }
  }

  // ============ IndexedDB Methods ============

  async _saveToIndexedDB(entry) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(entry)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  async _getAllFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('timestamp')
      const request = index.openCursor(null, 'prev') // Descending order

      const entries = []
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          entries.push(cursor.value)
          cursor.continue()
        } else {
          resolve(entries)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async _deleteFromIndexedDB(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  async _clearIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  // ============ LocalStorage Fallback Methods ============

  _saveToLocalStorage(entry) {
    try {
      const entries = this._getAllFromLocalStorage()
      const existingIndex = entries.findIndex(e => e.id === entry.id)

      if (existingIndex >= 0) {
        entries[existingIndex] = entry
      } else {
        entries.unshift(entry)
      }

      // Keep max 100 entries in localStorage to manage size
      const trimmed = entries.slice(0, 100)
      localStorage.setItem('sayitbetter_entries', JSON.stringify(trimmed))
      return true
    } catch (e) {
      console.error('localStorage save failed:', e)
      return false
    }
  }

  _getAllFromLocalStorage() {
    try {
      const data = localStorage.getItem('sayitbetter_entries')
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('localStorage read failed:', e)
      return []
    }
  }

  _deleteFromLocalStorage(id) {
    try {
      const entries = this._getAllFromLocalStorage()
      const filtered = entries.filter(e => e.id !== id)
      localStorage.setItem('sayitbetter_entries', JSON.stringify(filtered))
      return true
    } catch (e) {
      return false
    }
  }

  _clearLocalStorage() {
    try {
      localStorage.removeItem('sayitbetter_entries')
      return true
    } catch (e) {
      return false
    }
  }

  // ============ Migration from old localStorage ============

  async migrateFromOldStorage() {
    try {
      // Check for old storage format
      const oldData = localStorage.getItem('sayitbetter_full_history')
      if (oldData) {
        const entries = JSON.parse(oldData)

        // Save each entry to new storage
        for (const entry of entries) {
          await this.saveEntry(entry)
        }

        // Remove old storage
        localStorage.removeItem('sayitbetter_full_history')
        localStorage.removeItem('translation_history')

        console.log(`Migrated ${entries.length} entries to IndexedDB`)
        return entries.length
      }
      return 0
    } catch (e) {
      console.error('Migration failed:', e)
      return 0
    }
  }
}

// Export singleton instance
export const storage = new StorageService()
export default storage
