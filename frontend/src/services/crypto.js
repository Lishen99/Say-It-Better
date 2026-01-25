// Web Crypto API helpers for Zero-Knowledge Sharing

// Generate a random AES-GCM key
export async function generateKey() {
    return window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
}

// Export key to base64 string (to put in URL hash)
export async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key)
    const exportedArray = new Uint8Array(exported)
    // Convert to base64url to be URL safe
    return btoa(String.fromCharCode(...exportedArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

// Import key from base64 string
export async function importKey(base64Key) {
    // Restore from base64url
    let base64 = base64Key.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='

    const rawKey = Uint8Array.from(atob(base64), c => c.charCodeAt(0))

    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    )
}

// Encrypt object to base64 string
export async function encrypt(data, key) {
    const encodedData = new TextEncoder().encode(JSON.stringify(data))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedData
    )

    return {
        encrypted_data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
        iv: btoa(String.fromCharCode(...iv))
    }
}

// Decrypt base64 string to object
export async function decrypt(encryptedDataB64, ivB64, key) {
    const encryptedData = Uint8Array.from(atob(encryptedDataB64), c => c.charCodeAt(0))
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0))

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encryptedData
    )

    const decoded = new TextDecoder().decode(decrypted)
    return JSON.parse(decoded)
}
