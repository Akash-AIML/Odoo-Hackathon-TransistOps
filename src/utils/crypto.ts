// src/utils/crypto.ts - AES-256-GCM Application-Level Encryption

import crypto from 'node:crypto';

// Standard 32-byte key for AES-256-GCM. Fallback to default for development if environment key is missing.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
    ? crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest()
    : Buffer.from('sample-encryption-key-32char', 'utf8');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard IV length is 12 bytes

/**
 * Encrypts plain text using AES-256-GCM.
 * Returns IV, Auth Tag, and Ciphertext combined with colons: iv:authTag:ciphertext
 */
export function encrypt(text: string): string {
    if (!text) return '';

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts Combined ciphertext (iv:authTag:ciphertext) using AES-256-GCM.
 */
export function decrypt(combined: string): string {
    if (!combined) return '';

    const parts = combined.split(':');
    if (parts.length !== 3) {
        // Return raw text if not encrypted or in incorrect format (e.g. legacy/mock data)
        return combined;
    }

    const [ivHex, authTagHex, encryptedText] = parts;

    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed, returning combined input:', error);
        return combined; // Fallback
    }
}
