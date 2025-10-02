// Lightweight password hashing utility using Web Crypto.
// Not production-grade (no PBKDF2 iterations customizing) but adequate for local demo.

export async function hashPassword(password, salt) {
  const TE = typeof TextEncoder !== 'undefined' ? TextEncoder : (await import('util')).TextEncoder;
  const enc = new TE();
  const saltBytes = enc.encode(salt);
  const cryptoObj = (globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : await import('crypto');
  const subtle = cryptoObj.subtle || cryptoObj.webcrypto?.subtle;
  if(!subtle) throw new Error('WebCrypto non disponibile');
  const passKey = await subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: 120000, hash: 'SHA-256' }, passKey, 256);
  const hashArray = Array.from(new Uint8Array(bits));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

export function generateSalt(len = 16) {
  const arr = new Uint8Array(len);
  if(globalThis.crypto?.getRandomValues){
    globalThis.crypto.getRandomValues(arr);
  } else {
    // Node fallback
  import('crypto').then(mod => mod.randomFillSync(arr));
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function hashWithNewSalt(password){
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  return { salt, hash };
}
