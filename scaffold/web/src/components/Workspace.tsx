import { useEffect, useState } from 'react';
import { formatPhone } from '../format';
import { useBilling } from '../billing';
import { PeopleContext, usePeople } from '../people';
import { useUnread } from '../unread';
import { useLatest } from '../useLatest';
import { useSocket } from '../useSocket';
import type { Frame, Me } from '../types';
import { BillingScreen } from './billing/BillingScreen';
import { Inbox, type Filter } from './Inbox';
import { Rail } from './Rail';
import { Thread, type Panel } from './Thread';

interface Props {
  me: Me;
  workspaces: Me['workspaces'];
  workspace: string;
  isAdmin: boolean;
  onWorkspace: (id: string) => void;
  onSignOut: () => void;
}

export function Workspace({ me, workspaces, workspace, isAdmin, onWorkspace, onSignOut }: Props) {
  const { connected, epoch, subscribe } = useSocket(workspace);
  const people = usePeople(workspace, me);
  const unread = useUnread(workspace);
  const [filter, setFilter] = useState<Filter>('open');
  const [contact, setContact] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [view, setView] = useState<'inbox' | 'billing'>('inbox');
  const [sendBlocked, setSendBlocked] = useState(false);
  const billing = useBilling(workspace, isAdmin);
  const [announcement, setAnnouncement] = useState('');
  const openContact = useLatest(contact);

  const handleFrame = useLatest((frame: Frame) => {
    switch (frame.type) {
      case 'message.inbound':
        if (frame.contact === openContact.current) unread.markSeen(frame.contact);
        else unread.markInbound(frame.contact);
        setAnnouncement(`New message from ${formatPhone(frame.contact)}: ${frame.text}`);
        break;
      case 'message.outbound':
        people.seen(frame.sender);
        break;
      case 'conversation.assigned':
        people.seen(frame.assignee);
        break;
      case 'note.added':
        people.seen(frame.author);
        break;
    }
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel]);

  function select(next: string) {
    unread.markSeen(next);
    setContact(next);
  }

  const showPanel = view === 'inbox' && contact !== null && panel !== null;
  const billingStatus = billing.billing?.status ?? null;
  const sendPaused = billingStatus === 'canceled' || (sendBlocked && (!isAdmin || billingStatus === null));

  function pauseSending() {
    setSendBlocked(true);
    if (isAdmin) billing.refresh();
  }

  function chooseFilter(next: Filter) {
    setView('inbox');
    setFilter(next);
  }

  return (
    <PeopleContext.Provider value={people}>
      <a className="skip-link" href="#thread">Skip to conversation</a>
      <div className={`shell${showPanel ? ' info-open' : ''}`}>
        <Rail
          me={me}
          workspaces={workspaces}
          workspace={workspace}
          onWorkspace={onWorkspace}
          isAdmin={isAdmin}
          view={view}
          onBilling={() => setView('billing')}
          filter={filter}
          onFilter={chooseFilter}
          connected={connected}
          onSignOut={onSignOut}
        />
        {view === 'billing' ? (
          <BillingScreen workspace={workspace} isAdmin={isAdmin} state={billing} />
        ) : (
        <>
        <Inbox
          me={me}
          workspace={workspace}
          filter={filter}
          onFilter={setFilter}
          selected={contact}
          onSelect={select}
          isUnread={unread.isUnread}
          subscribe={subscribe}
          epoch={epoch}
        />
        {contact ? (
          <Thread
            key={contact}
            me={me}
            workspace={workspace}
            contact={contact}
            isAdmin={isAdmin}
            billingStatus={billingStatus}
            sendPaused={sendPaused}
            onSendPaused={pauseSending}
            onOpenBilling={() => setView('billing')}
            subscribe={subscribe}
            epoch={epoch}
            panel={panel}
            onPanel={setPanel}
            onBack={() => setContact(null)}
          />
        ) : (
          <main className="thread-empty" id="thread" tabIndex={-1} aria-label="Conversation">
            <p>Pick a conversation to start.</p>
          </main>
        )}
        </>
        )}
        {showPanel && <div className="scrim" onClick={() => setPanel(null)} />}
      </div>
      <div className="visually-hidden" aria-live="polite">{announcement}</div>
    </PeopleContext.Provider>
  );
}
