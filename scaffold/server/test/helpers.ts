import { cols, ensureIndexes } from '../src/db.ts';
import { getRedis } from '../src/redis.ts';

export async function wipe() {
  await ensureIndexes();
  const c = await cols();
  await Promise.all(Object.values(c).map((col) => col.deleteMany({})));
  const redis = getRedis();
  const keys = await redis.keys('sb:*:ws_test*');
  if (keys.length) await redis.del(...keys);
}

export async function close() {
  getRedis().disconnect();
  const { getDb } = await import('../src/db.ts');
  (await getDb()).client.close();
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: import('../src/lib/session.ts').Session;
  }
}
