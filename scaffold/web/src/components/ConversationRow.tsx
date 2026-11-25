import { firstName, formatPhone, listTime } from '../format';
import { usePeopleNames } from '../people';
import type { ConversationSummary } from '../types';
import { Avatar } from './Avatar';

interface Props {
  conversation: ConversationSummary;
  selected: boolean;
  unread: boolean;
  meSub: string;
  onSelect: () => void;
}

export function ConversationRow({ conversation, selected, unread, meSub, onSelect }: Props) {
  const { contact, assignee, status, lastActivityAt, preview, lastOut } = conversation;
  const { nameOf } = usePeopleNames();
  const phone = formatPhone(contact);

  return (
    <li>
      <button
        className={`row${selected ? ' selected' : ''}${unread ? ' unread' : ''}`}
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
      >
        <Avatar label={contact} size={36} />
        <span className="row-body">
          <span className="row-top">
            <span className="row-name">{phone}</span>
            <time dateTime={lastActivityAt}>{listTime(lastActivityAt)}</time>
          </span>
          <span className="row-preview">{lastOut ? `You: ${preview}` : preview}</span>
          <span className="row-chips">
            {status === 'closed' && <span className="chip chip-closed">Closed</span>}
            {assignee === meSub ? (
              <span className="chip chip-mine">You</span>
            ) : assignee ? (
              <span className="chip chip-other">
                <Avatar label={nameOf(assignee)} seed={assignee} size={16} />
                {firstName(nameOf(assignee))}
              </span>
            ) : (
              <span className="chip chip-none">Unassigned</span>
            )}
            {unread && <span className="unread-dot" role="img" aria-label="Unread" />}
          </span>
        </span>
      </button>
    </li>
  );
}
