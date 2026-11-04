// Server only: the key must never reach the browser, so this lives outside public/ and domain/.
const TOKEN_VERSION = 1
const IV_BYTES = 12 // 96-bit AES-GCM nonce, fresh for every seal
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/
const additionalData = Uint8Array.of(TOKEN_VERSION)

/** Derives the AES-256-GCM key from the server secret through SHA-256. */
export async function createReadingKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

/** Returns `base64url(version ‖ IV ‖ ciphertext+tag)`. */
export async function sealValue(key: CryptoKey, value: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    new TextEncoder().encode(JSON.stringify(value)),
  )
  return Buffer.concat([additionalData, iv, new Uint8Array(ciphertext)]).toString('base64url')
}

/** Returns the sealed JSON value, or `undefined` for any altered, foreign or unsupported token. */
export async function openValue(key: CryptoKey, token: string): Promise<unknown> {
  if (!TOKEN_PATTERN.test(token)) return undefined
  const bytes = Buffer.from(token, 'base64url')
  if (bytes.length <= 1 + IV_BYTES || bytes[0] !== TOKEN_VERSION) return undefined
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.subarray(1, 1 + IV_BYTES), additionalData },
      key,
      bytes.subarray(1 + IV_BYTES),
    )
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plaintext))
  } catch (error) {
    // A failed tag check is an OperationError; bad UTF-8 or JSON cannot come from our own seal.
    if (
      error instanceof DOMException ||
      error instanceof TypeError ||
      error instanceof SyntaxError
    ) {
      return undefined
    }
    throw error
  }
}
