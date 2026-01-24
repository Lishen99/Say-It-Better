/**
 * End-to-End Encryption Service for Say It Better
 * 
 * ZERO-KNOWLEDGE ARCHITECTURE:
 * - All encryption/decryption happens client-side using Web Crypto API
 * - Encryption keys are derived from user's passphrase using PBKDF2
 * - The passphrase never leaves the user's device
 * - Even developers cannot decrypt user data
 * 
 * Algorithm: AES-256-GCM (Authenticated Encryption)
 * Key Derivation: PBKDF2 with SHA-256, 100,000 iterations
 */

class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
    this.ivLength = 12 // 96 bits for GCM
    this.saltLength = 16 // 128 bits
    this.iterations = 100000 // PBKDF2 iterations
    this.cachedKey = null
    this.cachedKeyHash = null
  }

  /**
   * Check if Web Crypto API is available
   */
  isAvailable() {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle
  }

  /**
   * Generate a cryptographic salt
   */
  generateSalt() {
    return window.crypto.getRandomValues(new Uint8Array(this.saltLength))
  }

  /**
   * Generate a random IV (Initialization Vector)
   */
  generateIV() {
    return window.crypto.getRandomValues(new Uint8Array(this.ivLength))
  }

  /**
   * Derive an encryption key from a passphrase using PBKDF2
   * @param {string} passphrase - User's secret passphrase
   * @param {Uint8Array} salt - Random salt for key derivation
   * @returns {Promise<CryptoKey>} - Derived AES-GCM key
   */
  async deriveKey(passphrase, salt) {
    // Import passphrase as a key material
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive the actual AES-GCM key
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false, // Not extractable - key never leaves CryptoKey object
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Create a hash of the passphrase for verification purposes
   * (NOT used for encryption, just to verify passphrase is correct)
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<string>} - Base64 encoded hash
   */
  async hashPassphrase(passphrase) {
    const encoder = new TextEncoder()
    const data = encoder.encode(passphrase + '_sayitbetter_verification')
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
    return this.arrayBufferToBase64(hashBuffer)
  }

  /**
   * Encrypt data with the user's passphrase
   * @param {Object|string} data - Data to encrypt
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<Object>} - Encrypted data package with salt and IV
   */
  async encrypt(data, passphrase) {
    if (!this.isAvailable()) {
      throw new Error('Web Crypto API not available')
    }

    // Convert data to string if it's an object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data)
    
    // Generate random salt and IV
    const salt = this.generateSalt()
    const iv = this.generateIV()
    
    // Derive key from passphrase
    const key = await this.deriveKey(passphrase, salt)
    
    // Encrypt the data
    const encodedData = new TextEncoder().encode(plaintext)
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv
      },
      key,
      encodedData
    )

    // Return the encrypted package
    return {
      encrypted: this.arrayBufferToBase64(encryptedBuffer),
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv),
      algorithm: this.algorithm,
      keyDerivation: 'PBKDF2',
      iterations: this.iterations,
      version: 1
    }
  }

  /**
   * Decrypt data with the user's passphrase
   * @param {Object} encryptedPackage - Encrypted data package
   * @param {string} passphrase - User's passphrase
   * @returns {Promise<Object|string>} - Decrypted data
   */
  async decrypt(encryptedPackage, passphrase) {
    if (!this.isAvailable()) {
      throw new Error('Web Crypto API not available')
    }

    const { encrypted, salt, iv } = encryptedPackage
    
    // Convert from base64
    const encryptedData = this.base64ToArrayBuffer(encrypted)
    const saltArray = this.base64ToArrayBuffer(salt)
    const ivArray = this.base64ToArrayBuffer(iv)
    
    // Derive key from passphrase
    const key = await this.deriveKey(passphrase, new Uint8Array(saltArray))
    
    try {
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: new Uint8Array(ivArray)
        },
        key,
        encryptedData
      )

      // Convert back to string
      const decryptedText = new TextDecoder().decode(decryptedBuffer)
      
      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decryptedText)
      } catch {
        return decryptedText
      }
    } catch (error) {
      if (error.name === 'OperationError') {
        throw new Error('Incorrect passphrase or corrupted data')
      }
      throw error
    }
  }

  /**
   * Cache the derived key for performance (optional)
   * Key remains in memory until page refresh
   */
  async cacheKey(passphrase) {
    const salt = this.generateSalt()
    this.cachedKey = await this.deriveKey(passphrase, salt)
    this.cachedKeyHash = await this.hashPassphrase(passphrase)
    return this.cachedKeyHash
  }

  /**
   * Clear the cached key (for logout)
   */
  clearCachedKey() {
    this.cachedKey = null
    this.cachedKeyHash = null
  }

  /**
   * Verify if a passphrase matches the cached one
   */
  async verifyPassphrase(passphrase) {
    if (!this.cachedKeyHash) return false
    const hash = await this.hashPassphrase(passphrase)
    return hash === this.cachedKeyHash
  }

  /**
   * Generate a random encryption key for one-time use (e.g., sharing)
   * @returns {Promise<string>} - Base64 encoded key
   */
  async generateRandomKey() {
    const key = await window.crypto.subtle.generateKey(
      { name: this.algorithm, length: this.keyLength },
      true, // Extractable for export
      ['encrypt', 'decrypt']
    )
    const exported = await window.crypto.subtle.exportKey('raw', key)
    return this.arrayBufferToBase64(exported)
  }

  /**
   * Calculate a simple checksum for data integrity
   */
  async calculateChecksum(data) {
    const encoder = new TextEncoder()
    const dataString = typeof data === 'string' ? data : JSON.stringify(data)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(dataString))
    return this.arrayBufferToBase64(hashBuffer).substring(0, 16) // First 16 chars
  }

  // ============ Utility Methods ============

  /**
   * Convert ArrayBuffer to Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Estimate the strength of a passphrase
   * @returns {Object} - Strength score and feedback
   */
  evaluatePassphraseStrength(passphrase) {
    let score = 0
    const feedback = []

    if (!passphrase) {
      return { score: 0, strength: 'none', feedback: ['Enter a passphrase'] }
    }

    // Length checks
    if (passphrase.length >= 8) score += 1
    if (passphrase.length >= 12) score += 1
    if (passphrase.length >= 16) score += 1

    // Character diversity
    if (/[a-z]/.test(passphrase)) score += 1
    if (/[A-Z]/.test(passphrase)) score += 1
    if (/[0-9]/.test(passphrase)) score += 1
    if (/[^a-zA-Z0-9]/.test(passphrase)) score += 1

    // Feedback
    if (passphrase.length < 12) {
      feedback.push('Use at least 12 characters')
    }
    if (!/[A-Z]/.test(passphrase)) {
      feedback.push('Add uppercase letters')
    }
    if (!/[0-9]/.test(passphrase)) {
      feedback.push('Add numbers')
    }
    if (!/[^a-zA-Z0-9]/.test(passphrase)) {
      feedback.push('Add special characters')
    }

    // Strength rating
    let strength = 'weak'
    if (score >= 6) strength = 'strong'
    else if (score >= 4) strength = 'moderate'

    return { score, strength, feedback }
  }
}

// Export singleton instance
export const encryption = new EncryptionService()
export default encryption
