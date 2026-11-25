import { getRedis } from '../redis.js';

// Pigeon allows a burst of 8 and refills 4 a second per workspace. We stay a
// little under that, and share the bucket between all copies through Redis.
const CAP = 6;
const RATE = 3.5;

const bucket = (ws: string) => `sb:rl:${ws}`;
const cool = (ws: string) => `sb:cool:${ws}`;

const ACQUIRE = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
local t = redis.call('TIME')
local now = t[1] * 1000 + math.floor(t[2] / 1000)
local d = redis.call('HMGET', KEYS[1], 'tokens', 'at')
local tokens = tonumber(d[1])
local at = tonumber(d[2])
if not tokens then tokens = tonumber(ARGV[1]); at = now end
tokens = math.min(tonumber(ARGV[1]), tokens + (now - at) / 1000 * tonumber(ARGV[2]))
if tokens < 1 then
  redis.call('HSET', KEYS[1], 'tokens', tokens, 'at', now)
  return 0
end
redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'at', now)
redis.call('PEXPIRE', KEYS[1], 60000)
return 1
`;

const REFUND = `
local d = redis.call('HMGET', KEYS[1], 'tokens')
local tokens = tonumber(d[1])
if not tokens then return 0 end
redis.call('HSET', KEYS[1], 'tokens', math.min(tonumber(ARGV[1]), tokens + 1))
return 1
`;

export async function acquire(ws: string): Promise<boolean> {
  return (await getRedis().eval(ACQUIRE, 2, bucket(ws), cool(ws), CAP, RATE)) === 1;
}

export async function refund(ws: string): Promise<void> {
  await getRedis().eval(REFUND, 1, bucket(ws), CAP);
}

const PAUSE = `
if redis.call('PTTL', KEYS[1]) < tonumber(ARGV[1]) then redis.call('SET', KEYS[1], '1', 'PX', ARGV[1]) end
return 1
`;

export async function pause(ws: string, ms: number): Promise<void> {
  await getRedis().eval(PAUSE, 1, cool(ws), Math.max(1, Math.round(ms)));
}
