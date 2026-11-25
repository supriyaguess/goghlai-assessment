import { clockTime } from '../format';
import type { Message } from '../types';

export function MessageBubble({ message }: { message: Message }) {
  const outbound = message.direction === 'out';
  const failed = message.status === 'failed';
  return (
    <li className={`bubble ${outbound ? 'out' : 'in'}${failed ? ' failed' : ''}`}>
      <p className="bubble-text">{message.text}</p>
      <span className="bubble-meta">
        <time dateTime={message.at}>{clockTime(message.at)}</time>
        {outbound && message.status && <span className={`status status-${message.status}`}>{message.status}</span>}
      </span>
    </li>
  );
}
