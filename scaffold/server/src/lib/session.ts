import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { getRedis } from '../redis.js';
import { parseCookies } from './cookies.js';

export type Membership = { id: string; role: 'admin' | 'agent' };
export type Session = { sub: string; name?: string; email?: string; workspaces: Membership[] };

export const SESSION_COOKIE = 'sb_sid';
const key = (id: string) => `sb:sess:${id}`;

export async function createSession(s: Session): Promise<string> {
  const id = randomBytes(32).toString('hex');
  await getRedis().set(key(id), JSON.stringify(s), 'EX', config.sessionTtlSec);
  return id;
}

export async function destroySession(id: string) {
  await getRedis().del(key(id));
}

export async function sessionFromCookie(header: string | undefined): Promise<Session | null> {
  const id = parseCookies(header)[SESSION_COOKIE];
  if (!id || !/^[0-9a-f]{64}$/.test(id)) return null;
  const raw = await getRedis().get(key(id));
  return raw ? (JSON.parse(raw) as Session) : null;
}

export const roleIn = (s: Session, ws: string) => s.workspaces.find((m) => m.id === ws)?.role ?? null;
