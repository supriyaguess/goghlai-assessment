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
