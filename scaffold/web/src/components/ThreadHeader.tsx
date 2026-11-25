import type { ConversationInfo } from '../types';

interface Props {
  contact: string;
  conversation: ConversationInfo | null;
  meSub: string;
  isAdmin: boolean;
  busy: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onToggleStatus: () => void;
}

export function ThreadHeader({ contact, conversation, meSub, isAdmin, busy, onClaim, onRelease, onToggleStatus }: Props) {
  const assignee = conversation?.assignee ?? null;
  const closed = conversation?.status === 'closed';
  const heldByMe = assignee === meSub;
  const heldByOther = assignee !== null && !heldByMe;

  return (
    <header className="thread-header">
      <div>
        <h2>{contact}</h2>
        <p className="assignee">
          {assignee ? `Assigned to ${heldByMe ? 'you' : assignee}` : 'Unassigned'}
          {closed && ' (closed)'}
        </p>
      </div>
      <div className="actions">
        <button onClick={onClaim} disabled={busy || heldByMe || heldByOther}>
          {heldByOther ? `Held by ${assignee}` : 'Claim'}
        </button>
        {assignee && (heldByMe || isAdmin) && (
          <button onClick={onRelease} disabled={busy}>Release</button>
        )}
        <button onClick={onToggleStatus} disabled={busy}>{closed ? 'Reopen' : 'Close'}</button>
      </div>
    </header>
  );
}
