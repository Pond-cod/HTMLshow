/**
 * Password hashing utilities using the Web Crypto API (built-in, no dependencies needed).
 * Uses PBKDF2-SHA256 with 100,000 iterations — comparable to bcrypt in security.
 *
 * Format: "pbkdf2:v1:<base64-salt>:<base64-hash>"
 * Plain-text passwords (legacy) are detected by the absence of this prefix.
 */

const ITERATIONS = 100_000;
const KEY_LENGTH = 32; // bytes
const HASH_ALGO = "SHA-256";
const PREFIX = "pbkdf2:v1:";

/** Convert Uint8Array → base64 string */
function toBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string → Uint8Array backed by a guaranteed plain ArrayBuffer.
 * This avoids the SharedArrayBuffer/ArrayBufferLike type issue in strict TS.
 */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return view;
}

/**
 * Create a fresh Uint8Array<ArrayBuffer> — guaranteed compatible with Web Crypto.
 */
function freshUint8(size: number): Uint8Array {
  return new Uint8Array(new ArrayBuffer(size));
}

/**
 * Hashes a plain-text password. Returns a self-contained string with
 * the algorithm version, salt, and hash embedded.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = freshUint8(16);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plain),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return `${PREFIX}${toBase64(salt)}:${toBase64(new Uint8Array(derived))}`;
}

/**
 * Returns true if the plain-text password matches the stored hash.
 * Also handles legacy plain-text passwords (backwards-compatible).
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  // Legacy: stored value is plain-text (no prefix)
  if (!stored.startsWith(PREFIX)) {
    return plain === stored;
  }

  // Modern: PBKDF2 hash
  const parts = stored.slice(PREFIX.length).split(":");
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;

  try {
    const salt = fromBase64(saltB64);
    const expectedHash = fromBase64(hashB64);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(plain),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: ITERATIONS, hash: HASH_ALGO },
      keyMaterial,
      KEY_LENGTH * 8
    );
    const derivedArr = new Uint8Array(derived);

    // Constant-time comparison to prevent timing attacks
    if (derivedArr.length !== expectedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < derivedArr.length; i++) {
      diff |= derivedArr[i] ^ expectedHash[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Returns true if the stored value is already a modern hashed password.
 */
export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
