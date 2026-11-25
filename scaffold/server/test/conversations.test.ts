import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { claim, release, setStatus } from '../src/lib/conversations.ts';
import { cols } from '../src/db.ts';
import { wipe, close } from './helpers.ts';

before(wipe);
after(async () => {
  await wipe();
  await close();
});

test('six agents claiming at once: exactly one wins', async () => {
  const agents = Array.from({ length: 6 }, (_, i) => `agent_${i}`);
  const results = await Promise.all(agents.map((a) => claim('ws_acme', '+14155550101', a)));
  const winners = results.filter((r) => r === 'claimed');
  assert.equal(winners.length, 1);
  assert.equal(results.filter((r) => r === 'taken').length, 5);

  const { convs } = await cols();
  const row = await convs.findOne({ ws: 'ws_acme', contact: '+14155550101' });
  assert.equal(row?.assignee, agents[results.indexOf('claimed')]);
});

test('the holder claiming again is not an error', async () => {
  assert.equal(await claim('ws_acme', '+14155550102', 'a'), 'claimed');
  assert.equal(await claim('ws_acme', '+14155550102', 'a'), 'already');
  assert.equal(await claim('ws_acme', '+14155550102', 'b'), 'taken');
});

test('claiming a contact that never wrote creates the conversation', async () => {
  assert.equal(await claim('ws_globex', '+442079460299', 'x'), 'claimed');
  const { convs } = await cols();
  assert.equal((await convs.findOne({ ws: 'ws_globex', contact: '+442079460299' }))?.status, 'open');
});

test('same contact in two workspaces is two conversations', async () => {
  assert.equal(await claim('ws_acme', '+10000000001', 'a'), 'claimed');
  assert.equal(await claim('ws_globex', '+10000000001', 'b'), 'claimed');
});

test('only the holder or an admin can release', async () => {
  await claim('ws_acme', '+14155550103', 'a');
  assert.equal(await release('ws_acme', '+14155550103', 'b', false), false);
  assert.equal(await release('ws_acme', '+14155550103', 'b', true), true);
  assert.equal(await claim('ws_acme', '+14155550103', 'b'), 'claimed');
});

test('close and reopen only report a change when there is one', async () => {
  await claim('ws_acme', '+14155550104', 'a');
  assert.equal(await setStatus('ws_acme', '+14155550104', 'open'), false);
  assert.equal(await setStatus('ws_acme', '+14155550104', 'closed'), true);
  assert.equal(await setStatus('ws_acme', '+14155550104', 'closed'), false);
  assert.equal(await setStatus('ws_acme', '+14155550104', 'open'), true);
});
