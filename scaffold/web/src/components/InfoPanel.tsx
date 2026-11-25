import { formatPhone } from '../format';
import { usePeopleNames } from '../people';
import type { ConversationInfo, Message, Subscribe } from '../types';
import { CloseIcon } from './icons';
import { NotesPanel } from './NotesPanel';
import type { Panel } from './Thread';

interface Props {
  panel: Panel;
  onPanel: (panel: Panel | null) => void;
  meSub: string;
  workspace: string;
  contact: string;
  conversation: ConversationInfo | null;
  messages: Message[];
  hasEarlier: boolean;
  subscribe: Subscribe;
}

const TABS: { id: Panel; label: string }[] = [
  { id: 'details', label: 'Details' },
  { id: 'notes', label: 'Private notes' },
];

export function InfoPanel({ panel, onPanel, meSub, workspace, contact, conversation, messages, hasEarlier, subscribe }: Props) {
  const { nameOf } = usePeopleNames();
  const assignee = conversation?.assignee ?? null;
  const first = messages[0];

  return (
    <aside className="info" aria-label="Conversation panel">
      <div className="info-head">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              className="tab"
              aria-selected={panel === t.id}
              aria-controls={`tabpanel-${t.id}`}
              onClick={() => onPanel(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button className="icon-btn" aria-label="Close panel" onClick={() => onPanel(null)}>
          <CloseIcon size={18} />
        </button>
      </div>
      <div id="tabpanel-details" role="tabpanel" aria-labelledby="tab-details" hidden={panel !== 'details'} className="info-body">
        <dl className="details">
          <dt>Phone</dt>
          <dd>{formatPhone(contact)}</dd>
          <dt>Status</dt>
          <dd>{conversation?.status === 'closed' ? 'Closed' : 'Open'}</dd>
          <dt>Owner</dt>
          <dd>{assignee ? (assignee === meSub ? `${nameOf(assignee)} (you)` : nameOf(assignee)) : 'Unclaimed'}</dd>
          <dt>Messages</dt>
          <dd>{messages.length}{hasEarlier ? '+' : ''}</dd>
          <dt>{hasEarlier ? 'Earliest loaded' : 'First message'}</dt>
          <dd>
            {first
              ? new Date(first.at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'None yet'}
          </dd>
        </dl>
      </div>
      <div id="tabpanel-notes" role="tabpanel" aria-labelledby="tab-notes" hidden={panel !== 'notes'} className="info-body">
        <NotesPanel
          active={panel === 'notes'}
          meSub={meSub}
          workspace={workspace}
          contact={contact}
          subscribe={subscribe}
        />
      </div>
    </aside>
  );
}
