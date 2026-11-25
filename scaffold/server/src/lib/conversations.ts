import { cols, isDup } from '../db.js';
import { addFrame } from './frames.js';

export async function touchConversation(ws: string, contact: string, at: Date, preview: string, reopen: boolean) {
  const { convs } = await cols();
  const run = () =>
    convs.updateOne(
      { ws, contact },
      {
        $setOnInsert: { assignee: null, status: 'open', createdAt: new Date() },
        $max: { lastActivityAt: at },
      },
      { upsert: true },
    );
  try {
    await run();
  } catch (e) {
    if (!isDup(e)) throw e;
    await run();
  }
  await convs.updateOne({ ws, contact, lastActivityAt: { $lte: at } }, { $set: { preview: preview.slice(0, 140) } });
  if (reopen) await convs.updateOne({ ws, contact, status: 'closed' }, { $set: { status: 'open' } });
}

export type ClaimResult = 'claimed' | 'already' | 'taken';

// v counts assignment/status changes; frame keys use it so re-emitting after a crash is a no-op
async function emitAssigned(ws: string, contact: string) {
  const { convs } = await cols();
  const c = await convs.findOne({ ws, contact });
  if (c) await addFrame(ws, `assign:${contact}:${c.v ?? 0}`, { type: 'conversation.assigned', contact, assignee: c.assignee });
}

export async function claim(ws: string, contact: string, agent: string): Promise<ClaimResult> {
  const { convs } = await cols();
  const filter = { ws, contact, $or: [{ assignee: null }, { assignee: agent }] };
  const before = await convs.findOne({ ws, contact }, { projection: { assignee: 1 } });
  if (before?.assignee === agent) {
    await emitAssigned(ws, contact);
    return 'already';
  }

  const update = {
    $set: { assignee: agent },
    $inc: { v: 1 },
    $setOnInsert: { status: 'open' as const, createdAt: new Date(), lastActivityAt: new Date() },
  };
  let res;
  try {
    res = await convs.updateOne(filter, update, { upsert: true });
  } catch (e) {
    if (!isDup(e)) throw e;
    // someone created the row first; retry as a plain update
    res = await convs.updateOne(filter, { $set: { assignee: agent }, $inc: { v: 1 } });
  }
  if (!res.matchedCount && !res.upsertedCount) return 'taken';
  await emitAssigned(ws, contact);
  return 'claimed';
}

export async function release(ws: string, contact: string, agent: string, force: boolean): Promise<boolean> {
  const { convs } = await cols();
  const filter = force ? { ws, contact, assignee: { $ne: null } } : { ws, contact, assignee: agent };
  const res = await convs.updateOne(filter, { $set: { assignee: null }, $inc: { v: 1 } });
  if (!res.modifiedCount) return false;
  await emitAssigned(ws, contact);
  return true;
}

export async function setStatus(ws: string, contact: string, status: 'open' | 'closed'): Promise<boolean> {
  const { convs } = await cols();
  const res = await convs.updateOne({ ws, contact, status: status === 'open' ? 'closed' : 'open' }, { $set: { status }, $inc: { v: 1 } });
  if (!res.modifiedCount) return false;
  const c = await convs.findOne({ ws, contact });
  if (c) await addFrame(ws, `status:${contact}:${c.v ?? 0}`, { type: 'conversation.status', contact, status: c.status });
  return true;
}
