import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import express from 'express';
import type { Server } from 'node:http';
import { webhook } from '../src/routes/webhook.ts';
import { cols } from '../src/db.ts';
import { wipe, close } from './helpers.ts';

const secret = 'whsec_pigeon_dev';
let server: Server;
let url = '';

before(async () => {
  await wipe();
  const app = express();
  app.use(webhook);
  server = app.listen(0);
  url = `http://localhost:${(server.address() as { port: number }).port}/webhooks/pigeon`;
});

after(async () => {
  server.close();
  await wipe();
  await close();
});

const post = (raw: string, opts: { t?: number; header?: string | null } = {}) => {
  const t = opts.t ?? Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  const header = opts.header === undefined ? `t=${t},v1=${sig}` : opts.header;
  return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...(header ? { 'x-pigeon-signature': header } : {}) }, body: raw });
};

const event = (o: Record<string, unknown>) => JSON.stringify({ id: `evt_${Math.random()}`, occurred_at: new Date().toISOString(), ...o });
const inbound = (id: string, from = '+14155550101', workspace = 'ws_acme') =>
  event({ type: 'message.inbound', workspace, data: { message_id: id, from, text: 'hello' } });

test('a missing, malformed or wrong signature is 401', async () => {
  assert.equal((await post(inbound('pmsg_a'), { header: null })).status, 401);
  assert.equal((await post(inbound('pmsg_a'), { header: 'nonsense' })).status, 401);
  assert.equal((await post(inbound('pmsg_a'), { header: `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}` })).status, 401);
});

test('a valid signature older than five minutes is 401, four minutes is accepted', async () => {
  const now = Math.floor(Date.now() / 1000);
  assert.equal((await post(inbound('pmsg_old'), { t: now - 360 })).status, 401);
  assert.equal((await post(inbound('pmsg_ok4'), { t: now - 240 })).status, 200);
});

test('a stored event is acknowledged again when it is repeated, and stored once', async () => {
  const raw = inbound('pmsg_dup');
  assert.equal((await post(raw)).status, 200);
  assert.equal((await post(raw)).status, 200);
  const { messages } = await cols();
  assert.equal(await messages.countDocuments({ ws: 'ws_acme', messageId: 'pmsg_dup' }), 1);
});

test('unknown event types and unknown workspaces are acknowledged and ignored', async () => {
  assert.equal((await post(event({ type: 'thing.created', workspace: 'ws_acme', data: { a: 1 } }))).status, 200);
  assert.equal((await post(event({ type: 'thing.created', workspace: 'ws_acme' }))).status, 200);
  assert.equal((await post(inbound('pmsg_nope', '+1', 'ws_nope'))).status, 200);
  const { messages } = await cols();
  assert.equal(await messages.countDocuments({ messageId: 'pmsg_nope' }), 0);
});

test('a status for a message we never sent is acknowledged and ignored', async () => {
  const raw = event({ type: 'message.status', workspace: 'ws_acme', data: { message_id: 'pm_1', client_ref: 'never-sent', status: 'delivered' } });
  assert.equal((await post(raw)).status, 200);
});

test('a signed body that is not usable is 400, never 5xx', async () => {
  assert.equal((await post('this is not json')).status, 400);
  assert.equal((await post('[1,2]')).status, 400);
  assert.equal((await post(event({ type: 'message.inbound', workspace: 'ws_acme', data: {} }))).status, 400);
});

test('events for the same contact come back in occurred_at order, not arrival order', async () => {
  const at = (s: number) => new Date(1_800_000_000_000 + s * 1000).toISOString();
  const send = (id: string, s: number) =>
    post(JSON.stringify({ id: `evt_${id}`, type: 'message.inbound', workspace: 'ws_acme', occurred_at: at(s), data: { message_id: id, from: '+14155550199', text: id } }));
  await send('pmsg_late', 30);
  await send('pmsg_early', 10);
  await send('pmsg_mid', 20);
  const { messages } = await cols();
  const rows = await messages.find({ ws: 'ws_acme', contact: '+14155550199' }).sort({ occurredAt: 1, messageId: 1 }).toArray();
  assert.deepEqual(rows.map((r) => r.messageId), ['pmsg_early', 'pmsg_mid', 'pmsg_late']);
});
