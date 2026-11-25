import { ApiError, get, post, put } from './api';
import { exportPublicKey, generateKeyPair, generateWorkspaceKey, unwrapWorkspaceKey, wrapWorkspaceKey } from './crypto';
import type { KeyState } from './types';

const DB_NAME = 'switchboard-keys';
const STORE = 'keypairs';

export interface LocalKeys {
  privateKey: CryptoKey;
  publicKey: string;
}

interface StoredKeys extends LocalKeys {
  registered: boolean;
}

// Workspace keys live in memory only.
const cache = new Map<string, CryptoKey>();

export function keyringSupported() {
  return typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined' && !!crypto.subtle;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readStored(id: string): Promise<StoredKeys | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as StoredKeys | undefined);
    req.onerror = () => reject(req.error);
  }).finally(() => db.close()) as Promise<StoredKeys | undefined>;
}

async function writeStored(id: string, value: StoredKeys): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }).finally(() => db.close());
}

export async function ensureKeypair(sub: string, workspace: string): Promise<LocalKeys> {
  const id = `${sub}:${workspace}`;
  let stored = await readStored(id);
  if (!stored) {
    const pair = await generateKeyPair();
    stored = { privateKey: pair.privateKey, publicKey: await exportPublicKey(pair.publicKey), registered: false };
    await writeStored(id, stored);
  }
  if (!stored.registered) {
    await put('/api/keys', { workspace, publicKey: stored.publicKey });
    stored = { ...stored, registered: true };
    await writeStored(id, stored);
  }
  return { privateKey: stored.privateKey, publicKey: stored.publicKey };
}

export function fetchKeyState(workspace: string) {
  return get<KeyState>(`/api/workspaces/${encodeURIComponent(workspace)}/keys`);
}

export async function loadWorkspaceKey(
  sub: string,
  workspace: string,
  keys: LocalKeys,
  state: KeyState,
): Promise<CryptoKey | null> {
  const id = `${sub}:${workspace}`;
  const cached = cache.get(id);
  if (cached) return cached;
  if (!state.mine) return null;
  const { wrappedKey, wrappedBy } = state.mine;
  const wrapperPublic = wrappedBy === sub ? keys.publicKey : state.members.find((m) => m.sub === wrappedBy)?.publicKey;
  if (!wrapperPublic) return null;
  const key = await unwrapWorkspaceKey(wrappedKey, keys.privateKey, wrapperPublic);
  cache.set(id, key);
  return key;
}

// Returns false when someone else initialised the workspace first.
export async function createKeyring(sub: string, workspace: string, keys: LocalKeys): Promise<boolean> {
  const key = await generateWorkspaceKey();
  const wrappedKey = await wrapWorkspaceKey(key, keys.privateKey, keys.publicKey);
  try {
    await post(`/api/workspaces/${encodeURIComponent(workspace)}/keyring`, { wrappedKey });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return false;
    throw err;
  }
  cache.set(`${sub}:${workspace}`, key);
  return true;
}

export async function shareWithPending(sub: string, workspace: string, keys: LocalKeys, key: CryptoKey, state: KeyState) {
  for (const member of state.members) {
    if (member.hasKey || member.sub === sub) continue;
    try {
      const wrappedKey = await wrapWorkspaceKey(key, keys.privateKey, member.publicKey);
      await put(`/api/workspaces/${encodeURIComponent(workspace)}/keys/${encodeURIComponent(member.sub)}`, { wrappedKey });
    } catch {
      // another member may have shared first; the next poll sorts it out
    }
  }
}
