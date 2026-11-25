import { useCallback, useEffect, useRef, useState } from 'react';
import { errorText, get } from '../api';
import { usePeopleNames } from '../people';
import { useLatest } from '../useLatest';
import type { ConversationSummary, Frame, Me, Subscribe } from '../types';
import { ConversationRow } from './ConversationRow';
import { SearchIcon } from './icons';
import { useToast } from './Toasts';

export type Filter = 'open' | 'closed' | 'mine';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'Mine' },
  { id: 'closed', label: 'Closed' },
];

const EMPTY_COPY: Record<Filter, string> = {
  open: 'All caught up. New messages will show up here.',
  mine: 'Nothing assigned to you. Claim a conversation to get started.',
  closed: 'No closed conversations yet.',
};

interface Page {
  conversations: ConversationSummary[];
  next: string | null;
}

interface Props {
  me: Me;
  workspace: string;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  selected: string | null;
  onSelect: (contact: string) => void;
  isUnread: (contact: string) => boolean;
  subscribe: Subscribe;
  epoch: number;
}

function matches(conversation: ConversationSummary, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  if (digits && conversation.contact.replace(/\D/g, '').includes(digits)) return true;
  return conversation.preview.toLowerCase().includes(q);
}

export function Inbox({ me, workspace, filter, onFilter, selected, onSelect, isUnread, subscribe, epoch }: Props) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const requestId = useRef(0);
  const searchInput = useRef<HTMLInputElement>(null);
  const { seen } = usePeopleNames();
  const toast = useToast();

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

  const itemsRef = useLatest(items);

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const page = await query();
      if (id !== requestId.current) return;
      setItems(page.conversations);
      setNext(page.next);
      setFailed(false);
    } catch (err) {
      if (id !== requestId.current) return;
      if (itemsRef.current.length === 0) setFailed(true);
      else toast.show(errorText(err), 'error');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [query, itemsRef, toast]);

  useEffect(() => {
    setLoading(true);
    setFailed(false);
    loadFirstPage();
    return () => {
      requestId.current++;
    };
  }, [loadFirstPage]);

  // a (re)connected socket may have skipped frames, so reload the list
  useEffect(() => {
    if (epoch > 0) loadFirstPage();
  }, [epoch]);

  useEffect(() => {
    items.forEach((c) => seen(c.assignee));
  }, [items, seen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.matches('input, textarea, select') || target.isContentEditable;
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
      toast.show(errorText(err), 'error');
    }
  }

  const handleFrame = useLatest((frame: Frame) => {
    const known = itemsRef.current.some((c) => c.contact === frame.contact);
    if (!known) {
      loadFirstPage();
      return;
    }
    setItems((current) => applyFrame(current, frame, filter, me.sub));
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  const visible = items.filter((c) => matches(c, search));

  function body() {
    if (loading) {
      return (
        <ul className="rows" aria-busy="true" aria-label="Loading conversations">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="skeleton-row" aria-hidden="true">
              <span className="skeleton skeleton-avatar" />
              <span className="skeleton-lines">
                <span className="skeleton" />
                <span className="skeleton" />
                <span className="skeleton" />
              </span>
            </li>
          ))}
        </ul>
      );
    }
    if (failed) {
      return (
        <div className="empty">
          <p>Couldn't load conversations.</p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setLoading(true);
              loadFirstPage();
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    if (items.length === 0) return <p className="empty">{EMPTY_COPY[filter]}</p>;
    if (visible.length === 0) return <p className="empty">No loaded conversations match your search.</p>;
    return (
      <ul className="rows">
        {visible.map((c) => (
          <ConversationRow
            key={c.contact}
            conversation={c}
            selected={c.contact === selected}
            unread={isUnread(c.contact) && c.contact !== selected}
            meSub={me.sub}
            onSelect={() => onSelect(c.contact)}
          />
        ))}
      </ul>
    );
  }

  return (
    <nav className="inbox" aria-label="Conversations">
      <header className="inbox-head">
        <h1>Inbox</h1>
      </header>
      <div className="inbox-tools">
        <div className="segmented" role="group" aria-label="Filter conversations">
          {FILTERS.map((f) => (
            <button key={f.id} className="segment" aria-pressed={filter === f.id} onClick={() => onFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="search">
          <span className="visually-hidden">Search loaded conversations</span>
          <SearchIcon size={16} />
          <input
            ref={searchInput}
            type="search"
            value={search}
            placeholder="Search loaded conversations"
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="inbox-scroll">
        {body()}
        {next && !loading && (
          <button className="btn btn-secondary load-more" onClick={loadMore}>Load more</button>
        )}
      </div>
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
      return moveToTop(list, index, { preview: frame.text, lastActivityAt: frame.occurred_at, lastOut: false });
    case 'message.outbound':
      return moveToTop(list, index, { preview: frame.text, lastActivityAt: new Date().toISOString(), lastOut: true });
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
