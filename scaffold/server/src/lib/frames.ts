import { randomUUID } from 'node:crypto';
import { cols, isDup } from '../db.js';
import { getRedis } from '../redis.js';

export const channel = (ws: string) => `sb:frames:${ws}`;
// lock ttl is short on purpose, the unique (ws, seq) index is what really protects us
const lockKey = (ws: string) => `sb:lock:frames:${ws}`;

const UNLOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withLock<T>(ws: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  const token = randomUUID();
  const until = Date.now() + 4000;
  while (true) {
    const got = await redis.set(lockKey(ws), token, 'PX', 3000, 'NX');
    if (got) break;
    if (Date.now() > until) throw new Error('frame lock timeout');
    await sleep(4 + Math.random() * 10);
  }
  try {
    return await fn();
  } finally {
    await redis.eval(UNLOCK, 1, lockKey(ws), token).catch(() => null);
  }
}

// Frames get their seq while holding a per-workspace lock, so they are
// committed in seq order and a reader never skips one. `key` makes the write
// idempotent: the same event arriving twice creates one frame.
export async function addFrame(ws: string, key: string, frame: Record<string, unknown>): Promise<void> {
  const { frames } = await cols();
  if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return;
  let seq = 0;
  for (let attempt = 0; attempt < 5 && !seq; attempt++) {
    seq = await withLock(ws, async () => {
      if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return -1;
      const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
      const next = (last?.seq ?? 0) + 1;
      try {
        await frames.insertOne({ ws, seq: next, key, frame, createdAt: new Date() });
        return next;
      } catch (e) {
        if (isDup(e)) return 0;
        throw e;
      }
    });
  }
  // out of attempts: fail the request so the caller retries instead of losing the frame
  if (!seq) throw new Error('could not allocate a seq');
  if (seq > 0) await getRedis().publish(channel(ws), String(seq)).catch(() => null);
}

export async function framesAfter(ws: string, after: number, limit = 500) {
  const { frames } = await cols();
  const docs = await frames.find({ ws, seq: { $gt: after } }).sort({ seq: 1 }).limit(limit).toArray();
  return docs.map((d) => ({ seq: d.seq, ...d.frame }));
}

export async function lastSeq(ws: string): Promise<number> {
  const { frames } = await cols();
  const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
  return last?.seq ?? 0;
}
