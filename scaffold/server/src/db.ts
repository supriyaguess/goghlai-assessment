import { MongoClient, type Db } from 'mongodb';
import { config } from './config.js';

export type Msg = {
  ws: string;
  contact: string;
  messageId: string;
  text: string;
  occurredAt: Date;
  receivedAt: Date;
};

export type Conv = {
  ws: string;
  contact: string;
  assignee: string | null;
  status: 'open' | 'closed';
  v?: number;
  lastActivityAt: Date;
  preview?: string;
  createdAt: Date;
};

export type OutStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export type Out = {
  ws: string;
  contact: string;
  clientRef: string;
  text: string;
  sender: string;
  status: OutStatus;
  rank: number;
  createdAt: Date;
  attempts: number;
  nextAttemptAt: Date;
  lockedUntil: Date;
  sendDone: boolean;
  pigeonId?: string;
};

export type FrameDoc = {
  ws: string;
  seq: number;
  key: string;
  frame: Record<string, unknown>;
  createdAt: Date;
};

let connecting: Promise<Db> | undefined;

export function getDb(): Promise<Db> {
  connecting ??= new MongoClient(config.mongoUrl).connect().then((c) => c.db());
  return connecting;
}

export async function cols() {
  const d = await getDb();
  return {
    messages: d.collection<Msg>('messages'),
    convs: d.collection<Conv>('conversations'),
    outbox: d.collection<Out>('outbox'),
    frames: d.collection<FrameDoc>('frames'),
  };
}

export type Cols = Awaited<ReturnType<typeof cols>>;

export async function ensureIndexes() {
  const c = await cols();
  await Promise.all([
    c.messages.createIndex({ ws: 1, messageId: 1 }, { unique: true }),
    c.messages.createIndex({ ws: 1, contact: 1, occurredAt: 1 }),
    c.convs.createIndex({ ws: 1, contact: 1 }, { unique: true }),
    c.convs.createIndex({ ws: 1, lastActivityAt: -1, _id: -1 }),
    c.outbox.createIndex({ ws: 1, clientRef: 1 }, { unique: true }),
    c.outbox.createIndex({ sendDone: 1, ws: 1, nextAttemptAt: 1 }),
    c.outbox.createIndex({ ws: 1, contact: 1, createdAt: 1 }),
    c.frames.createIndex({ ws: 1, seq: 1 }, { unique: true }),
    c.frames.createIndex({ ws: 1, key: 1 }, { unique: true }),
  ]);
}

export const isDup = (e: unknown) => (e as { code?: number })?.code === 11000;
