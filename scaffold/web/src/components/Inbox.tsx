import { useCallback, useEffect, useRef, useState } from 'react';
import { errorText, get } from '../api';
import { useLatest } from '../useLatest';
import type { ConversationSummary, Frame, Me, Subscribe } from '../types';
import { ConversationRow } from './ConversationRow';
import { Banner } from './Banner';

type Filter = 'open' | 'closed' | 'mine';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'mine', label: 'Mine' },
];

interface Page {
  conversations: ConversationSummary[];
  next: string | null;
}

interface Props {
  me: Me;
  workspace: string;
  selected: string | null;
  onSelect: (contact: string) => void;
  subscribe: Subscribe;
  epoch: number;
}

export function Inbox({ me, workspace, selected, onSelect, subscribe, epoch }: Props) {
  const [filter, setFilter] = useState<Filter>('open');
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const query = useCallback(
    (before?: string) => {
      const params = new URLSearchParams({ workspace, limit: '30' });
      if (filter === 'mine') {
        params.set('assignee', 'me');
      } else {
        params.set('status', filter);
      }
      if (before) params.set('before', before);
      return get<Page>(`/api/conversations?${params}`);
    },
    [workspace, filter],
  );

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const page = await query();
      if (id !== requestId.current) return;
      setItems(page.conversations);
      setNext(page.next);
      setError(null);
    } catch (err) {
      if (id === requestId.current) setError(errorText(err));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    setLoading(true);
    loadFirstPage();
    return () => {
      requestId.current++;
    };
  }, [loadFirstPage]);

  // a (re)connected socket may have skipped frames, so reload the list
  useEffect(() => {
    if (epoch > 0) loadFirstPage();
  }, [epoch]);

  async function loadMore() {
    if (!next) return;
    const id = requestId.current;
    try {
      const page = await query(next);
      if (id !== requestId.current) return;
      setItems((current) => {
        const known = new Set(current.map((c) => c.contact));
        return [...current, ...page.conversations.filter((c) => !known.has(c.contact))];
      });
      setNext(page.next);
    } catch (err) {
      setError(errorText(err));
    }
  }

  const itemsRef = useLatest(items);
  const handleFrame = useLatest((frame: Frame) => {
    const known = itemsRef.current.some((c) => c.contact === frame.contact);
    if (!known) {
      loadFirstPage();
      return;
    }
    setItems((current) => applyFrame(current, frame, filter, me.sub));
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  return (
    <nav className="inbox" aria-label="Inbox">
      <div className="tabs" role="group" aria-label="Filter conversations">
        {FILTERS.map((f) => (
          <button key={f.id} className="tab" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {error && <Banner>{error}</Banner>}
      {loading ? (
        <p className="empty" role="status">Loading...</p>
      ) : items.length === 0 && !error ? (
        <p className="empty">No conversations yet.</p>
      ) : (
        <ul className="rows">
          {items.map((c) => (
            <ConversationRow
              key={c.contact}
              conversation={c}
              selected={c.contact === selected}
              meSub={me.sub}
              onSelect={() => onSelect(c.contact)}
            />
          ))}
        </ul>
      )}
      {next && !loading && <button className="load-more" onClick={loadMore}>Load more</button>}
    </nav>
  );
}

function applyFrame(
  list: ConversationSummary[],
  frame: Frame,
  filter: Filter,
  meSub: string,
): ConversationSummary[] {
  const index = list.findIndex((c) => c.contact === frame.contact);
  if (index === -1) return list;
  const current = list[index];

  switch (frame.type) {
    case 'message.inbound':
      return moveToTop(list, index, { preview: frame.text, lastActivityAt: frame.occurred_at });
    case 'message.outbound':
      return moveToTop(list, index, { preview: frame.text, lastActivityAt: new Date().toISOString() });
    case 'message.status':
    case 'note.added':
      return list;
    case 'conversation.assigned': {
      if (filter === 'mine' && frame.assignee !== meSub) return list.filter((_, i) => i !== index);
      return replaceAt(list, index, { ...current, assignee: frame.assignee });
    }
    case 'conversation.status': {
      const stillShown = filter === 'mine' || frame.status === filter;
      if (!stillShown) return list.filter((_, i) => i !== index);
      return replaceAt(list, index, { ...current, status: frame.status });
    }
  }
}

function replaceAt(list: ConversationSummary[], index: number, item: ConversationSummary) {
  return list.map((c, i) => (i === index ? item : c));
}

function moveToTop(list: ConversationSummary[], index: number, changes: Partial<ConversationSummary>) {
  const updated = { ...list[index], ...changes };
  return [updated, ...list.filter((_, i) => i !== index)];
}
