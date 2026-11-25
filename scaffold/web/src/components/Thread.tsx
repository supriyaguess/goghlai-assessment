import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiError, conversationPath, errorText, get, post } from '../api';
import type { BillingStatus } from '../billing';
import { useLatest } from '../useLatest';
import { addMessage, layoutMessages, setStatus } from '../messages';
import { dayLabel, formatPhone } from '../format';
import { usePeopleNames } from '../people';
import type { ConversationInfo, Frame, Me, Message, Subscribe } from '../types';
import { InfoPanel } from './InfoPanel';
import { MessageBubble } from './MessageBubble';
import { ReplyBox } from './ReplyBox';
import { ThreadHeader } from './ThreadHeader';
import { useToast } from './Toasts';

export type Panel = 'details' | 'notes';

interface Props {
  me: Me;
  workspace: string;
  contact: string;
  isAdmin: boolean;
  billingStatus: BillingStatus | null;
  sendPaused: boolean;
  onSendPaused: () => void;
  onOpenBilling: () => void;
  subscribe: Subscribe;
  epoch: number;
  panel: Panel | null;
  onPanel: (panel: Panel | null) => void;
  onBack: () => void;
}

interface MessagePage {
  conversation: ConversationInfo | null;
  messages: Message[];
  older: string | null;
}

const NEAR_BOTTOM = 80;

export function Thread({ me, workspace, contact, isAdmin, billingStatus, sendPaused, onSendPaused, onOpenBilling, subscribe, epoch, panel, onPanel, onBack }: Props) {
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [older, setOlder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const toast = useToast();
  const { nameOf, seen } = usePeopleNames();
  const animate = useRef(false);
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
      .catch((err) => !cancelled && toast.show(errorText(err), 'error'))
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
      .catch((err) => toast.show(errorText(err), 'error'));
  }, [epoch]);

  useEffect(() => {
    if (!loading) animate.current = true;
  }, [loading]);

  async function refreshConversation() {
    try {
      const page = await fetchPage();
      setConversation(page.conversation);
    } catch (err) {
      toast.show(errorText(err), 'error');
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
      toast.show(errorText(err), 'error');
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
    if (frame.type === 'message.outbound') seen(frame.sender);
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

  async function deliver(clientRef: string, text: string) {
    const body = { workspace, text, clientRef };
    const path = conversationPath(contact, '/reply');
    try {
      try {
        await post(path, body);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        await post(path, body);
      }
    } catch (err) {
      setMessages((current) => setStatus(current, clientRef, 'failed'));
      if (err instanceof ApiError && err.status === 402) {
        onSendPaused();
        toast.show("Sending is paused: this workspace's subscription is canceled. Ask an admin.", 'error');
      } else {
        toast.show("Couldn't send. Check your connection.", 'error');
      }
    }
  }

  function send(text: string) {
    const clientRef = crypto.randomUUID();
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
    deliver(clientRef, text);
  }

  function retry(failedId: string, text: string) {
    setMessages((current) => current.filter((m) => !(m.direction === 'out' && m.id === failedId)));
    send(text);
  }

  async function act(action: 'claim' | 'release' | 'close' | 'reopen') {
    setBusy(true);
    try {
      await post(conversationPath(contact, `/${action}`), { workspace });
      if (action === 'close') toast.show('Conversation closed.');
      if (action === 'reopen') toast.show('Conversation reopened.');
      if (action === 'claim') setConversation((c) => ({ contact, status: 'open', ...c, assignee: me.sub }));
      if (action === 'release') setConversation((c) => ({ contact, status: 'open', ...c, assignee: null }));
      if (action === 'close') setConversation((c) => ({ contact, assignee: null, ...c, status: 'closed' }));
      if (action === 'reopen') setConversation((c) => ({ contact, assignee: null, ...c, status: 'open' }));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.show(action === 'claim' ? 'Someone else claimed this first.' : 'Someone else changed this conversation.', 'error');
        await refreshConversation();
      } else {
        toast.show(errorText(err), 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  const closed = conversation?.status === 'closed';
  const holder = conversation?.assignee ?? null;
  const heldByOther = holder !== null && holder !== me.sub;
  const rows = layoutMessages(messages);

  function composer() {
    if (sendPaused) {
      return (
        <ReplyBox
          onSend={send}
          disabledReason="Sending is paused because the subscription was canceled. An admin can resubscribe in Billing."
          reasonAction={
            isAdmin ? (
              <>
                {' '}
                <button type="button" className="link-btn" onClick={onOpenBilling}>Open Billing</button>
              </>
            ) : undefined
          }
        />
      );
    }
    if (closed) {
      return (
        <div className="closed-bar">
          <span>Closed. Reopen to reply.</span>
          <button className="btn btn-primary" onClick={() => act('reopen')} disabled={busy} title={busy ? 'Please wait for the last action to finish' : undefined}>
            Reopen
          </button>
        </div>
      );
    }
    return (
      <ReplyBox
        onSend={send}
        disabledReason={heldByOther ? `${nameOf(holder)} is handling this. Claim it to reply.` : undefined}
      />
    );
  }

  return (
    <>
      <main className="thread" id="thread" tabIndex={-1} aria-label={`Conversation with ${formatPhone(contact)}`}>
        {isAdmin && billingStatus === 'past_due' && (
          <p className="thread-notice">
            The last subscription payment did not go through.{' '}
            <button type="button" className="link-btn" onClick={onOpenBilling}>Review billing</button>
          </p>
        )}
        <ThreadHeader
          contact={contact}
          conversation={conversation}
          meSub={me.sub}
          isAdmin={isAdmin}
          busy={busy}
          panel={panel}
          onPanel={onPanel}
          onBack={onBack}
          onClaim={() => act('claim')}
          onRelease={() => act('release')}
          onToggleStatus={() => act(closed ? 'reopen' : 'close')}
        />
        <div className="messages" ref={scroller} onScroll={onScroll}>
          {older && <button className="btn btn-secondary load-earlier" onClick={loadEarlier}>Load earlier</button>}
          {loading ? (
            <p className="empty" role="status">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="empty">No messages yet.</p>
          ) : (
            <ul className="bubbles">
              {rows.map((row) => (
                <Fragment key={`${row.message.direction}:${row.message.id}`}>
                  {row.newDay && (
                    <li className="day"><span>{dayLabel(row.message.at)}</span></li>
                  )}
                  <MessageBubble row={row} animate={animate.current} onRetry={retry} />
                </Fragment>
              ))}
            </ul>
          )}
        </div>
        {composer()}
      </main>
      {panel && (
        <InfoPanel
          panel={panel}
          onPanel={onPanel}
          meSub={me.sub}
          workspace={workspace}
          contact={contact}
          conversation={conversation}
          messages={messages}
          hasEarlier={older !== null}
          subscribe={subscribe}
        />
      )}
    </>
  );
}
