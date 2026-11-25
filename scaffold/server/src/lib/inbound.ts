import { cols, isDup, type OutStatus } from '../db.js';
import { addFrame } from './frames.js';
import { touchConversation } from './conversations.js';

export const RANK: Record<OutStatus, number> = { queued: 0, sent: 1, delivered: 2, failed: 2 };
const isStatus = (s: unknown): s is OutStatus => typeof s === 'string' && s in RANK && s !== 'queued';

export async function storeInbound(ws: string, d: { message_id: string; from: string; text: string }, occurredAt: Date) {
  const { messages } = await cols();
  let fresh = false;
  try {
    const res = await messages.updateOne(
      { ws, messageId: d.message_id },
      { $setOnInsert: { ws, contact: d.from, messageId: d.message_id, text: d.text, occurredAt, receivedAt: new Date() } },
      { upsert: true },
    );
    fresh = res.upsertedCount === 1;
  } catch (e) {
    if (!isDup(e)) throw e;
  }
  await touchConversation(ws, d.from, occurredAt, d.text, fresh);
  await addFrame(ws, `in:${d.message_id}`, {
    type: 'message.inbound',
    contact: d.from,
    message_id: d.message_id,
    text: d.text,
    occurred_at: occurredAt.toISOString(),
  });
}

export async function storeStatus(ws: string, d: { message_id?: string; client_ref: string; status: string }) {
  if (!isStatus(d.status)) return;
  const { outbox } = await cols();
  const doc = await outbox.findOne({ ws, clientRef: d.client_ref });
  if (!doc) return;
  const rank = RANK[d.status];
  await outbox.updateOne(
    { ws, clientRef: d.client_ref, rank: { $lt: rank } },
    { $set: { status: d.status, rank, sendDone: true, ...(d.message_id ? { pigeonId: d.message_id } : {}) } },
  );
  const now = await outbox.findOne({ ws, clientRef: d.client_ref });
  if (now?.status !== d.status) return;
  await addFrame(ws, `st:${d.client_ref}:${d.status}`, {
    type: 'message.status',
    contact: doc.contact,
    client_ref: d.client_ref,
    status: d.status,
  });
}
