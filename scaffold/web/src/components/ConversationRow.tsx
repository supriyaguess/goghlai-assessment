import { relativeTime } from '../format';
import type { ConversationSummary } from '../types';

interface Props {
  conversation: ConversationSummary;
  selected: boolean;
  meSub: string;
  onSelect: () => void;
}

export function ConversationRow({ conversation, selected, meSub, onSelect }: Props) {
  const { contact, assignee, status, lastActivityAt, preview } = conversation;
  return (
    <li>
      <button className={`row${selected ? ' selected' : ''}`} onClick={onSelect} aria-current={selected}>
        <span className="row-top">
          <span className="contact">{contact}</span>
          <time dateTime={lastActivityAt}>{relativeTime(lastActivityAt)}</time>
        </span>
        <span className="preview">{preview}</span>
        <span className="row-badges">
          <span className={`badge${assignee === meSub ? ' mine' : ''}`}>
            {assignee ? (assignee === meSub ? 'You' : assignee) : 'Unassigned'}
          </span>
          {status === 'closed' && <span className="badge">Closed</span>}
        </span>
      </button>
    </li>
  );
}
