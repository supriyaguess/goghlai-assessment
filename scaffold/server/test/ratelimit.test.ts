import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { acquire, pause, refund } from '../src/lib/ratelimit.ts';
import { getRedis } from '../src/redis.ts';

const ws = 'ws_test_rl';
const clear = () => getRedis().del(`sb:rl:${ws}`, `sb:cool:${ws}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

before(clear);
after(async () => {
  await clear();
  getRedis().disconnect();
});

test('a burst is capped below what the provider allows', async () => {
  let granted = 0;
  for (let i = 0; i < 20; i++) if (await acquire(ws)) granted++;
  assert.ok(granted >= 5 && granted <= 7, `granted ${granted}`);
});

test('tokens come back over time', async () => {
  await sleep(600);
  assert.equal(await acquire(ws), true);
});

test('a refund gives a token back', async () => {
  await clear();
  for (let i = 0; i < 20; i++) await acquire(ws);
  assert.equal(await acquire(ws), false);
  await refund(ws);
  assert.equal(await acquire(ws), true);
});

test('a pause blocks everyone until it ends', async () => {
  await clear();
  await pause(ws, 300);
  assert.equal(await acquire(ws), false);
  await sleep(350);
  assert.equal(await acquire(ws), true);
});

test('a short pause does not shorten a longer one', async () => {
  await clear();
  await pause(ws, 2000);
  await pause(ws, 100);
  const left = await getRedis().pttl(`sb:cool:${ws}`);
  assert.ok(left > 1500, `ttl ${left}`);
});
