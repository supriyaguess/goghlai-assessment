import { clockTime } from '../format';
import { usePeopleNames } from '../people';
import type { MessageRow } from '../messages';
import type { MessageStatus } from '../types';
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './icons';

interface Props {
  row: MessageRow;
  animate: boolean;
  onRetry: (id: string, text: string) => void;
}

const STATUS_LABEL: Record<MessageStatus, string> = {
  queued: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  failed: 'Not delivered',
};

function StatusIcon({ status }: { status: MessageStatus }) {
  const label = STATUS_LABEL[status];
  if (status === 'queued') return <ClockIcon size={14} label={label} />;
  if (status === 'sent') return <CheckIcon size={14} label={label} />;
  if (status === 'delivered') return <DoubleCheckIcon size={14} label={label} />;
  return <AlertIcon size={14} label={label} />;
}

export function MessageBubble({ row, animate, onRetry }: Props) {
  const { message, first, last } = row;
  const { nameOf } = usePeopleNames();
  const outbound = message.direction === 'out';
  const failed = message.status === 'failed';
  const showMeta = last || failed;
  const classes = [
    'msg',
    outbound ? 'out' : 'in',
    first ? 'first' : '',
    last ? 'last' : '',
    failed ? 'failed' : '',
    animate ? 'enter' : '',
  ];

  return (
    <li className={classes.filter(Boolean).join(' ')} title={outbound && message.sender ? `Sent by ${nameOf(message.sender)}` : undefined}>
      <div className="bubble">
        <p>{message.text}</p>
      </div>
      {showMeta && (
        <div className="msg-meta">
          {failed && <span className="msg-failed">Not delivered</span>}
          {failed && (
            <button className="link-btn" onClick={() => onRetry(message.id, message.text)}>Retry</button>
          )}
          {last && <time dateTime={message.at}>{clockTime(message.at)}</time>}
          {outbound && message.status && <span className={`status status-${message.status}`}><StatusIcon status={message.status} /></span>}
        </div>
      )}
    </li>
  );
}
