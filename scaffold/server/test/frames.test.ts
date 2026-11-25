import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { addFrame, framesAfter, lastSeq } from '../src/lib/frames.ts';
import { wipe, close } from './helpers.ts';

before(wipe);
after(async () => {
  await wipe();
  await close();
});

test('concurrent frames get gap-free, unique seqs', async () => {
  await Promise.all(Array.from({ length: 40 }, (_, i) => addFrame('ws_acme', `k${i}`, { type: 'x', n: i })));
  const all = await framesAfter('ws_acme', 0, 100);
  assert.deepEqual(
    all.map((f) => f.seq),
    Array.from({ length: 40 }, (_, i) => i + 1),
  );
});

test('the same key written many times at once is one frame', async () => {
  const before = await lastSeq('ws_globex');
  await Promise.all(Array.from({ length: 10 }, () => addFrame('ws_globex', 'same', { type: 'x' })));
  assert.equal((await lastSeq('ws_globex')) - before, 1);
});

test('framesAfter only returns what comes after, in order', async () => {
  const rest = await framesAfter('ws_acme', 35);
  assert.deepEqual(rest.map((f) => f.seq), [36, 37, 38, 39, 40]);
});

test('workspaces count their own seq', async () => {
  assert.equal((await framesAfter('ws_globex', 0))[0].seq, 1);
});
