import { useCallback, useEffect, useRef, useState } from 'react';
import { conversationPath, errorText, get, post } from '../api';
import { useLatest } from '../useLatest';
import { decryptNote, encryptNote, noteAad } from '../crypto';
import {
  createKeyring,
  ensureKeypair,
  fetchKeyState,
  keyringSupported,
  loadWorkspaceKey,
  shareWithPending,
  type LocalKeys,
} from '../keyring';
import type { Frame, NoteRecord, Subscribe } from '../types';
import { relativeTime } from '../format';
import { usePeopleNames } from '../people';
import { LockIcon } from './icons';

interface Props {
  active: boolean;
  meSub: string;
  workspace: string;
  contact: string;
  subscribe: Subscribe;
}

interface Note {
  id: string;
  author: string;
  at: string;
  text: string | null;
}

type Phase = 'loading' | 'waiting' | 'ready';

export function NotesPanel({ active, meSub, workspace, contact, subscribe }: Props) {
  const supported = keyringSupported();
  const { nameOf, seen } = usePeopleNames();
  const [phase, setPhase] = useState<Phase>('loading');
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keys = useRef<LocalKeys | null>(null);
  const workspaceKey = useRef<CryptoKey | null>(null);
  const loadId = useRef(0);

  const loadNotes = useCallback(async () => {
    const key = workspaceKey.current;
    if (!key) return;
    const id = ++loadId.current;
    const { notes: records } = await get<{ notes: NoteRecord[] }>(
      `${conversationPath(contact, '/notes')}?${new URLSearchParams({ workspace })}`,
    );
    const decoded = await Promise.all(
      records.map(async (r): Promise<Note> => {
        try {
          const text = await decryptNote(key, r.ciphertext, r.iv, noteAad(workspace, contact, r.author));
          return { id: r.id, author: r.author, at: r.createdAt, text };
        } catch {
          return { id: r.id, author: r.author, at: r.createdAt, text: null };
        }
      }),
    );
    if (id === loadId.current) setNotes(decoded);
  }, [workspace, contact]);

  const sync = useCallback(async () => {
    keys.current ??= await ensureKeypair(meSub, workspace);
    const local = keys.current;
    let state = await fetchKeyState(workspace);
    let key = await loadWorkspaceKey(meSub, workspace, local, state);
    if (!key && !state.initialised) {
      await createKeyring(meSub, workspace, local);
      state = await fetchKeyState(workspace);
      key = await loadWorkspaceKey(meSub, workspace, local, state);
    }
    if (!key) {
      setPhase('waiting');
      return;
    }
    const first = !workspaceKey.current;
    workspaceKey.current = key;
    await shareWithPending(meSub, workspace, local, key, state);
    setPhase('ready');
    if (first) await loadNotes();
  }, [meSub, workspace, loadNotes]);

  useEffect(() => {
    if (!active || !supported) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function tick() {
      try {
        await sync();
        setError(null);
      } catch (err) {
        if (!stopped) setError(errorText(err));
      }
      if (!stopped) timer = setTimeout(tick, workspaceKey.current ? 10000 : 5000);
    }
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, supported, sync]);

  useEffect(() => {
    notes.forEach((n) => seen(n.author));
  }, [notes, seen]);

  const handleFrame = useLatest((frame: Frame) => {
    if (frame.type !== 'note.added' || frame.contact !== contact || !workspaceKey.current) return;
    loadNotes().catch((err) => setError(errorText(err)));
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  async function addNote() {
    const key = workspaceKey.current;
    const text = draft.trim();
    if (!key || !text) return;
    setBusy(true);
    setError(null);
    try {
      const body = await encryptNote(key, text, noteAad(workspace, contact, meSub));
      await post(conversationPath(contact, '/notes'), { workspace, ...body });
      setDraft('');
      await loadNotes();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function body() {
    if (!supported) {
      return <p className="notes-hint">Private notes need IndexedDB and WebCrypto, which are only available in a secure context (HTTPS or localhost).</p>;
    }
    if (phase === 'loading') return <p className="notes-hint" role="status">Setting up encryption...</p>;
    if (phase === 'waiting') return <p className="notes-hint" role="status">Waiting for a teammate to share the workspace key.</p>;
    return (
      <>
        {notes.length === 0 ? (
          <p className="notes-hint">No notes yet. Add context only your team can see.</p>
        ) : (
          <ul className="notes-list">
            {notes.map((n) => (
              <li key={n.id} className={n.text === null ? 'note undecryptable' : 'note'}>
                <p className="note-text">{n.text ?? "Can't decrypt this note on this device."}</p>
                <div className="note-meta">
                  <LockIcon size={12} />
                  {n.author === meSub ? 'You' : nameOf(n.author)} · {relativeTime(n.at)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <form
          className="notes-compose"
          onSubmit={(e) => {
            e.preventDefault();
            addNote();
          }}
        >
          <textarea
            aria-label="New private note"
            value={draft}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Only your team sees this"
          />
          <button
            className="btn btn-secondary"
            disabled={busy || !draft.trim()}
            title={busy ? 'Saving the note' : !draft.trim() ? 'Write a note first' : undefined}
          >
            Add note
          </button>
        </form>
      </>
    );
  }

  return (
    <section className="notes" aria-label="Private notes">
      <p className="notes-explainer"><LockIcon size={14} /> Encrypted. Only your team can read these.</p>
      {error && <p className="notes-error" role="alert">{error}</p>}
      {body()}
    </section>
  );
}
