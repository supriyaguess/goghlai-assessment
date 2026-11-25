import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createReply } from '../src/lib/outbox.ts';
import { storeStatus } from '../src/lib/inbound.ts';
import { cols } from '../src/db.ts';
import { wipe, close } from './helpers.ts';

before(wipe);
after(async () => {
  await wipe();
  await close();
});

test('the same client_ref asked many times at once is one reply, one frame', async () => {
  await Promise.all(Array.from({ length: 8 }, () => createReply('ws_acme', '+14155550101', 'hello', 'ref-1', 'u_ben')));
  const { outbox, frames } = await cols();
  assert.equal(await outbox.countDocuments({ ws: 'ws_acme', clientRef: 'ref-1' }), 1);
  assert.equal(await frames.countDocuments({ ws: 'ws_acme', key: 'out:ref-1' }), 1);
});

test('a reply to a contact who never wrote still creates the conversation', async () => {
  await createReply('ws_globex', '+442079460299', 'first contact', 'ref-2', 'u_dev');
  const { convs } = await cols();
  const row = await convs.findOne({ ws: 'ws_globex', contact: '+442079460299' });
  assert.equal(row?.status, 'open');
});

test('a new reply is queued and due immediately, so any copy can pick it up', async () => {
  const { outbox } = await cols();
  const row = await outbox.findOne({ ws: 'ws_acme', clientRef: 'ref-1' });
  assert.equal(row?.status, 'queued');
  assert.equal(row?.sendDone, false);
  assert.ok(row!.nextAttemptAt.getTime() <= Date.now());
});

test('status only moves forward: delivered stays delivered if sent arrives late', async () => {
  await storeStatus('ws_acme', { client_ref: 'ref-1', status: 'delivered' });
  await storeStatus('ws_acme', { client_ref: 'ref-1', status: 'sent' });
  const { outbox } = await cols();
  assert.equal((await outbox.findOne({ ws: 'ws_acme', clientRef: 'ref-1' }))?.status, 'delivered');
});

test('once the carrier has reported on a reply it is no longer resent', async () => {
  const { outbox } = await cols();
  assert.equal((await outbox.findOne({ ws: 'ws_acme', clientRef: 'ref-1' }))?.sendDone, true);
});

test('a status from another workspace does not touch the reply', async () => {
  await createReply('ws_acme', '+14155550102', 'x', 'ref-3', 'u_ben');
  await storeStatus('ws_globex', { client_ref: 'ref-3', status: 'delivered' });
  const { outbox } = await cols();
  assert.equal((await outbox.findOne({ ws: 'ws_acme', clientRef: 'ref-3' }))?.status, 'queued');
});
