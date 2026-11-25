import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiError, conversationPath, errorText, get, post } from '../api';
import { useLatest } from '../useLatest';
import { addMessage, setStatus } from '../messages';
import type { ConversationInfo, Frame, Me, Message, Subscribe } from '../types';
import { MessageBubble } from './MessageBubble';
import { ReplyBox } from './ReplyBox';
import { ThreadHeader } from './ThreadHeader';
import { Banner } from './Banner';

interface Props {
  me: Me;
  workspace: string;
  contact: string;
  isAdmin: boolean;
  subscribe: Subscribe;
  epoch: number;
}

interface MessagePage {
  conversation: ConversationInfo | null;
  messages: Message[];
  older: string | null;
}

const NEAR_BOTTOM = 80;

export function Thread({ me, workspace, contact, isAdmin, subscribe, epoch }: Props) {
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [older, setOlder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const heightBeforePrepend = useRef<number | null>(null);

  const fetchPage = useCallback(
    (before?: string) => {
      const params = new URLSearchParams({ workspace, limit: '50' });
      if (before) params.set('before', before);
      return get<MessagePage>(`${conversationPath(contact, '/messages')}?${params}`);
    },
    [workspace, contact],
  );

  useEffect(() => {
    let cancelled = false;
    fetchPage()
      .then((page) => {
        if (cancelled) return;
        setConversation(page.conversation);
        setMessages(page.messages);
        setOlder(page.older);
      })
      .catch((err) => !cancelled && setError(errorText(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  useEffect(() => {
    if (epoch === 0) return;
    fetchPage()
      .then((page) => {
        setConversation(page.conversation);
        setMessages((current) => page.messages.reduce(addMessage, current));
      })
      .catch((err) => setError(errorText(err)));
  }, [epoch]);

  async function refreshConversation() {
    try {
      const page = await fetchPage();
      setConversation(page.conversation);
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function loadEarlier() {
    if (!older) return;
    try {
      const page = await fetchPage(older);
      heightBeforePrepend.current = scroller.current?.scrollHeight ?? null;
      setMessages((current) => {
        const known = new Set(current.map((m) => `${m.direction}:${m.id}`));
        return [...page.messages.filter((m) => !known.has(`${m.direction}:${m.id}`)), ...current];
      });
      setOlder(page.older);
    } catch (err) {
      setError(errorText(err));
    }
  }

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (heightBeforePrepend.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforePrepend.current;
      heightBeforePrepend.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
  }

  const handleFrame = useLatest((frame: Frame) => {
    if (frame.contact !== contact) return;
    switch (frame.type) {
      case 'message.inbound':
        setMessages((current) =>
          addMessage(current, { direction: 'in', id: frame.message_id, text: frame.text, at: frame.occurred_at }),
        );
        break;
      case 'message.outbound':
        setMessages((current) =>
          addMessage(current, {
            direction: 'out',
            id: frame.client_ref,
            text: frame.text,
            at: new Date().toISOString(),
            status: frame.status,
            sender: frame.sender,
          }),
        );
        break;
      case 'message.status':
        setMessages((current) => setStatus(current, frame.client_ref, frame.status));
        break;
      case 'conversation.assigned':
        setConversation((c) => ({ contact, status: 'open', ...c, assignee: frame.assignee }));
        break;
      case 'conversation.status':
        setConversation((c) => ({ contact, assignee: null, ...c, status: frame.status }));
        break;
    }
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  async function send(text: string) {
    const clientRef = crypto.randomUUID();
    const body = { workspace, text, clientRef };
    const path = conversationPath(contact, '/reply');
    stickToBottom.current = true;
    setMessages((current) =>
      addMessage(current, {
        direction: 'out',
        id: clientRef,
        text,
        at: new Date().toISOString(),
        status: 'queued',
        sender: me.sub,
      }),
    );
    try {
      try {
        await post(path, body);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        await post(path, body);
      }
    } catch {
      setMessages((current) => setStatus(current, clientRef, 'failed'));
    }
  }

  async function act(action: 'claim' | 'release' | 'close' | 'reopen') {
    setBusy(true);
    setError(null);
    try {
      await post(conversationPath(contact, `/${action}`), { workspace });
      if (action === 'claim') setConversation((c) => ({ contact, status: 'open', ...c, assignee: me.sub }));
      if (action === 'release') setConversation((c) => ({ contact, status: 'open', ...c, assignee: null }));
      if (action === 'close') setConversation((c) => ({ contact, assignee: null, ...c, status: 'closed' }));
      if (action === 'reopen') setConversation((c) => ({ contact, assignee: null, ...c, status: 'open' }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(action === 'claim' ? 'This conversation is already claimed by someone else.' : 'Someone else changed this conversation.');
        await refreshConversation();
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(false);
    }
  }

  const closed = conversation?.status === 'closed';

  return (
    <section className="thread" aria-label={`Conversation with ${contact}`}>
      <ThreadHeader
        contact={contact}
        conversation={conversation}
        meSub={me.sub}
        isAdmin={isAdmin}
        busy={busy}
        onClaim={() => act('claim')}
        onRelease={() => act('release')}
        onToggleStatus={() => act(closed ? 'reopen' : 'close')}
      />
      {error && <Banner>{error}</Banner>}
      <div className="messages" ref={scroller} onScroll={onScroll}>
        {older && <button className="load-more" onClick={loadEarlier}>Load earlier</button>}
        {loading ? (
          <p className="empty" role="status">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="empty">No messages yet.</p>
        ) : (
          <ul className="bubbles">
            {messages.map((m) => (
              <MessageBubble key={`${m.direction}:${m.id}`} message={m} />
            ))}
          </ul>
        )}
      </div>
      <ReplyBox onSend={send} />
    </section>
  );
}
