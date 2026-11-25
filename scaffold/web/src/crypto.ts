const enc = new TextEncoder();
const dec = new TextDecoder();
const WRAP_INFO = enc.encode('switchboard-wrap-v1');

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  return toBase64(new Uint8Array(await crypto.subtle.exportKey('spki', key)));
}

function importPublicKey(spki: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', fromBase64(spki), { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}

export function generateWorkspaceKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function deriveWrapKey(mine: CryptoKey, theirPublic: string): Promise<CryptoKey> {
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: await importPublicKey(theirPublic) }, mine, 256);
  const base = await crypto.subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: WRAP_INFO },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function wrapWorkspaceKey(key: CryptoKey, mine: CryptoKey, recipientPublic: string): Promise<string> {
  const wrapKey = await deriveWrapKey(mine, recipientPublic);
  const raw = await crypto.subtle.exportKey('raw', key);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, raw));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return toBase64(out);
}

export async function unwrapWorkspaceKey(wrapped: string, mine: CryptoKey, wrapperPublic: string): Promise<CryptoKey> {
  const bytes = fromBase64(wrapped);
  const wrapKey = await deriveWrapKey(mine, wrapperPublic);
  const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, wrapKey, bytes.slice(12));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export function noteAad(workspace: string, contact: string, author: string): Uint8Array<ArrayBuffer> {
  return enc.encode(`${workspace}|${contact}|${author}`);
}

export async function encryptNote(key: CryptoKey, text: string, aad: Uint8Array<ArrayBuffer>) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, enc.encode(text));
  return { ciphertext: toBase64(new Uint8Array(ct)), iv: toBase64(iv) };
}

export async function decryptNote(key: CryptoKey, ciphertext: string, iv: string, aad: Uint8Array<ArrayBuffer>) {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv), additionalData: aad },
    key,
    fromBase64(ciphertext),
  );
  return dec.decode(pt);
}
