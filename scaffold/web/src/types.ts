export type Role = 'admin' | 'agent';
export type ConversationStatus = 'open' | 'closed';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export interface Me {
  sub: string;
  name: string;
  email: string;
  workspaces: { id: string; role: Role }[];
}

export interface ConversationSummary {
  contact: string;
  assignee: string | null;
  status: ConversationStatus;
  lastActivityAt: string;
  preview: string;
  lastOut?: boolean;
}

export interface ConversationInfo {
  contact: string;
  assignee: string | null;
  status: ConversationStatus;
}

export interface Message {
  direction: 'in' | 'out';
  id: string;
  text: string;
  at: string;
  status?: MessageStatus;
  sender?: string;
}

export type Frame =
  | { seq: number; type: 'message.inbound'; contact: string; message_id: string; text: string; occurred_at: string }
  | { seq: number; type: 'message.outbound'; contact: string; client_ref: string; text: string; sender: string; status: MessageStatus }
  | { seq: number; type: 'message.status'; contact: string; client_ref: string; status: MessageStatus }
  | { seq: number; type: 'conversation.assigned'; contact: string; assignee: string | null }
  | { seq: number; type: 'conversation.status'; contact: string; status: ConversationStatus }
  | { seq: number; type: 'note.added'; contact: string; note_id: string; author: string };

export interface KeyMember {
  sub: string;
  publicKey: string;
  hasKey: boolean;
}

export interface KeyState {
  initialised: boolean;
  members: KeyMember[];
  mine: { wrappedKey: string; wrappedBy: string } | null;
}

export interface NoteRecord {
  id: string;
  author: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
}

export type Subscribe = (listener: (frame: Frame) => void) => () => void;
