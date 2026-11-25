import { sameDay } from './format';
import type { Message, MessageStatus } from './types';

const rank: Record<MessageStatus, number> = { queued: 0, sent: 1, delivered: 2, failed: 2 };

export function laterStatus(current: MessageStatus | undefined, next: MessageStatus): MessageStatus {
  if (!current) return next;
  return rank[next] > rank[current] ? next : current;
}

export function setStatus(messages: Message[], id: string, status: MessageStatus): Message[] {
  return messages.map((m) =>
    m.direction === 'out' && m.id === id ? { ...m, status: laterStatus(m.status, status) } : m,
  );
}

export function addMessage(messages: Message[], message: Message): Message[] {
  const existing = messages.find((m) => m.direction === message.direction && m.id === message.id);
  if (!existing) return [...messages, message];
  if (message.direction === 'out' && message.status) return setStatus(messages, message.id, message.status);
  return messages;
}

export interface MessageRow {
  message: Message;
  first: boolean;
  last: boolean;
  newDay: boolean;
}

const GROUP_WINDOW = 5 * 60_000;

function joins(prev: Message, next: Message) {
  return (
    prev.direction === next.direction &&
    sameDay(prev.at, next.at) &&
    new Date(next.at).getTime() - new Date(prev.at).getTime() < GROUP_WINDOW
  );
}

export function layoutMessages(messages: Message[]): MessageRow[] {
  return messages.map((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    return {
      message,
      first: !prev || !joins(prev, message),
      last: !next || !joins(message, next),
      newDay: !prev || !sameDay(prev.at, message.at),
    };
  });
}
