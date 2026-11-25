import { useCallback, useEffect, useState } from 'react';

type Stamps = Record<string, number>;
interface Stored {
  seen: Stamps;
  inbound: Stamps;
}

const storageKey = (workspace: string) => `switchboard.unread.${workspace}`;

function read(workspace: string): Stored {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(workspace)) ?? '{}');
    return { seen: parsed.seen ?? {}, inbound: parsed.inbound ?? {} };
  } catch {
    return { seen: {}, inbound: {} };
  }
}

export function useUnread(workspace: string) {
  const [stored, setStored] = useState(() => read(workspace));

  useEffect(() => {
    localStorage.setItem(storageKey(workspace), JSON.stringify(stored));
  }, [workspace, stored]);

  const markInbound = useCallback((contact: string) => {
    setStored((s) => ({ ...s, inbound: { ...s.inbound, [contact]: Date.now() } }));
  }, []);

  const markSeen = useCallback((contact: string) => {
    setStored((s) => ({ ...s, seen: { ...s.seen, [contact]: Date.now() } }));
  }, []);

  const isUnread = useCallback(
    (contact: string) => (stored.inbound[contact] ?? 0) > (stored.seen[contact] ?? 0),
    [stored],
  );

  const count = Object.keys(stored.inbound).filter(isUnread).length;

  useEffect(() => {
    document.title = count > 0 ? `(${count}) Switchboard` : 'Switchboard';
    return () => {
      document.title = 'Switchboard';
    };
  }, [count]);

  return { isUnread, markInbound, markSeen };
}
