import type { WithId } from 'mongodb';
import { cols, isDup, type Out } from '../db.js';
import { config } from '../config.js';
import { addFrame } from './frames.js';
import { touchConversation } from './conversations.js';
import { acquire, refund, pause } from './ratelimit.js';
import { RANK } from './inbound.js';

export async function createReply(ws: string, contact: string, text: string, clientRef: string, sender: string) {
  const { outbox } = await cols();
  const now = new Date();
  const doc: Out = {
    ws,
    contact,
    clientRef,
    text,
    sender,
    status: 'queued',
    rank: 0,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    lockedUntil: new Date(0),
    sendDone: false,
  };
  try {
    await outbox.insertOne(doc);
  } catch (e) {
    if (!isDup(e)) throw e;
  }
  // every step below is idempotent, so a repeated request finishes whatever a crashed one left undone
  const stored = (await outbox.findOne({ ws, clientRef })) ?? doc;
  await touchConversation(ws, contact, stored.createdAt, text, false);
  await addFrame(ws, `out:${clientRef}`, {
    type: 'message.outbound',
    contact,
    client_ref: clientRef,
    text: stored.text,
    sender: stored.sender,
    status: 'queued',
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_INFLIGHT = 4;
const inflight = new Map<string, number>();

async function attempt(doc: WithId<Out>) {
  const { outbox } = await cols();
  const back = (ms: number) =>
    outbox.updateOne({ _id: doc._id }, { $set: { lockedUntil: new Date(0), nextAttemptAt: new Date(Date.now() + ms) } });
  const retryLater = () => back(Math.min(500 * 2 ** Math.min(doc.attempts, 4), 8000) + Math.random() * 300);

  let res: Response;
  try {
    res = await fetch(`${config.pigeon.url}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.pigeon.apiKeys[doc.ws]}`,
        'idempotency-key': doc.clientRef,
      },
      body: JSON.stringify({ to: doc.contact, text: doc.text, client_ref: doc.clientRef }),
      signal: AbortSignal.timeout(config.sendTimeoutMs),
    });
  } catch {
    await pause(doc.ws, 800);
    return retryLater();
  }

  if (res.ok) {
    const out = (await res.json().catch(() => ({}))) as { id?: string };
    await outbox.updateOne({ _id: doc._id }, { $set: { sendDone: true, lockedUntil: new Date(0), ...(out.id ? { pigeonId: out.id } : {}) } });
    return;
  }
  if (res.status === 429) {
    const wait = Number(res.headers.get('retry-after')) || 2;
    await pause(doc.ws, wait * 1000 + 250);
    return back(wait * 1000 + 250);
  }
  if (res.status >= 500 || res.status === 408 || (res.status >= 300 && res.status < 400)) {
    await pause(doc.ws, 1000);
    return retryLater();
  }
  // 4xx other than 429 will not get better by trying again
  await addFrame(doc.ws, `st:${doc.clientRef}:failed`, { type: 'message.status', contact: doc.contact, client_ref: doc.clientRef, status: 'failed' });
  await outbox.updateOne(
    { _id: doc._id, rank: { $lt: RANK.failed } },
    { $set: { status: 'failed', rank: RANK.failed, sendDone: true, lockedUntil: new Date(0) } },
  );
}

async function tick(): Promise<boolean> {
  const { outbox } = await cols();
  let worked = false;
  for (const ws of config.workspaces) {
    if ((inflight.get(ws) ?? 0) >= MAX_INFLIGHT) continue;
    const now = new Date();
    const due = { sendDone: false, ws, nextAttemptAt: { $lte: now }, lockedUntil: { $lte: now } };
    if (!(await outbox.findOne(due, { projection: { _id: 1 } }))) continue;
    if (!(await acquire(ws))) continue;
    const doc = await outbox.findOneAndUpdate(
      due,
      { $set: { lockedUntil: new Date(now.getTime() + config.leaseMs) }, $inc: { attempts: 1 } },
      { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
    );
    if (!doc) {
      await refund(ws);
      continue;
    }
    worked = true;
    inflight.set(ws, (inflight.get(ws) ?? 0) + 1);
    attempt(doc)
      .catch((e) => console.error('send attempt failed', e))
      .finally(() => inflight.set(ws, (inflight.get(ws) ?? 1) - 1));
  }
  return worked;
}

let running = false;
export function startSender() {
  running = true;
  (async () => {
    while (running) {
      let worked = false;
      try {
        worked = await tick();
      } catch (e) {
        console.error('sender tick', e);
      }
      await sleep(worked ? 15 : 200);
    }
  })();
}
export const stopSender = () => {
  running = false;
};
