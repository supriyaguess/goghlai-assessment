import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { get } from './api';
import { useLatest } from './useLatest';
import type { Me } from './types';

export interface People {
  nameOf: (sub: string | null | undefined) => string;
  seen: (sub: string | null | undefined) => void;
}

const FALLBACK = 'Teammate';
const RETRY_AFTER = 30_000;

export const PeopleContext = createContext<People>({ nameOf: () => FALLBACK, seen: () => {} });

export function usePeopleNames() {
  return useContext(PeopleContext);
}

export function usePeople(workspace: string, me: Me): People {
  const [names, setNames] = useState<Record<string, string>>({});
  const namesRef = useLatest(names);
  const loading = useRef(false);
  const tried = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const res = await get<{ people: { sub: string; name: string }[] }>(
        `/api/workspaces/${encodeURIComponent(workspace)}/people`,
      );
      setNames(Object.fromEntries(res.people.map((p) => [p.sub, p.name])));
    } catch {
      // names are cosmetic, the fallback label covers a failed lookup
    } finally {
      loading.current = false;
    }
  }, [workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const nameOf = useCallback(
    (sub: string | null | undefined) => {
      if (!sub) return FALLBACK;
      if (sub === me.sub) return me.name;
      return names[sub] ?? FALLBACK;
    },
    [names, me.sub, me.name],
  );

  const seen = useCallback(
    (sub: string | null | undefined) => {
      if (!sub || sub === me.sub || namesRef.current[sub]) return;
      const last = tried.current.get(sub) ?? 0;
      if (Date.now() - last < RETRY_AFTER) return;
      tried.current.set(sub, Date.now());
      load();
    },
    [me.sub, load, namesRef],
  );

  return useMemo(() => ({ nameOf, seen }), [nameOf, seen]);
}
