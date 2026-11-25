import { formatPhone } from '../format';
import { usePeopleNames } from '../people';
import type { ConversationInfo } from '../types';
import { Avatar } from './Avatar';
import { BackIcon, InfoIcon, LockIcon } from './icons';
import type { Panel } from './Thread';

interface Props {
  contact: string;
  conversation: ConversationInfo | null;
  meSub: string;
  isAdmin: boolean;
  busy: boolean;
  panel: Panel | null;
  onPanel: (panel: Panel | null) => void;
  onBack: () => void;
  onClaim: () => void;
  onRelease: () => void;
  onToggleStatus: () => void;
}

export function ThreadHeader({
  contact,
  conversation,
  meSub,
  isAdmin,
  busy,
  panel,
  onPanel,
  onBack,
  onClaim,
  onRelease,
  onToggleStatus,
}: Props) {
  const { nameOf } = usePeopleNames();
  const assignee = conversation?.assignee ?? null;
  const closed = conversation?.status === 'closed';
  const heldByMe = assignee === meSub;
  const heldByOther = assignee !== null && !heldByMe;
  const owner = nameOf(assignee);
  const busyTitle = busy ? 'Please wait for the last action to finish' : undefined;

  function toggle(next: Panel) {
    onPanel(panel === next ? null : next);
  }

  function actions() {
    if (closed) {
      return (
        <button className="btn btn-secondary" onClick={onToggleStatus} disabled={busy} title={busyTitle}>
          Reopen
        </button>
      );
    }
    if (heldByOther) {
      return (
        <>
          <button className="btn btn-secondary" disabled title={`${owner} claimed this. They need to release it first.`}>
            Held by {owner}
          </button>
          {isAdmin && (
            <button className="btn btn-ghost" onClick={onRelease} disabled={busy} title={busyTitle}>Release</button>
          )}
          <button className="btn btn-secondary" onClick={onToggleStatus} disabled={busy} title={busyTitle}>
            Close conversation
          </button>
        </>
      );
    }
    if (heldByMe) {
      return (
        <>
          <button className="btn btn-secondary" onClick={onToggleStatus} disabled={busy} title={busyTitle}>
            Close conversation
          </button>
          <button className="btn btn-ghost" onClick={onRelease} disabled={busy} title={busyTitle}>Release</button>
        </>
      );
    }
    return (
      <>
        <button className="btn btn-primary" onClick={onClaim} disabled={busy} title={busyTitle}>Claim</button>
        <button className="btn btn-ghost" onClick={onToggleStatus} disabled={busy} title={busyTitle}>
          Close conversation
        </button>
      </>
    );
  }

  return (
    <header className="thread-header">
      <button className="icon-btn back-btn" aria-label="Back to conversations" onClick={onBack}>
        <BackIcon size={20} />
      </button>
      <Avatar label={contact} size={32} />
      <div className="thread-title">
        <h2>{formatPhone(contact)}</h2>
        <p>
          <span className={`pill ${closed ? 'pill-closed' : 'pill-open'}`}>{closed ? 'Closed' : 'Open'}</span>
          <span className="owner">{assignee ? `Claimed by ${heldByMe ? 'you' : owner}` : 'Unclaimed'}</span>
        </p>
      </div>
      <div className="thread-actions">
        {actions()}
        <button
          className="icon-btn"
          aria-label="Private notes"
          title="Private notes"
          aria-pressed={panel === 'notes'}
          onClick={() => toggle('notes')}
        >
          <LockIcon size={18} />
        </button>
        <button
          className="icon-btn"
          aria-label="Details"
          title="Details"
          aria-pressed={panel === 'details'}
          onClick={() => toggle('details')}
        >
          <InfoIcon size={18} />
        </button>
      </div>
    </header>
  );
}
