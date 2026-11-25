import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import express from 'express';
import type { Server } from 'node:http';
import { payboxWebhook } from '../src/routes/paybox.ts';
import { grader } from '../src/routes/grader.ts';
import { billingApi } from '../src/routes/billing.ts';
import { checkSignature } from '../src/lib/signature.ts';
import { refreshFromPaybox, getBilling, canSend } from '../src/lib/billing.ts';
import { config } from '../src/config.ts';
import { cols } from '../src/db.ts';
import { wipe, close } from './helpers.ts';

const PB = config.paybox.url;
const secret = config.paybox.webhookSecret;
let server: Server;
let base = '';

before(async () => {
  await wipe();
  const app = express();
  app.use(payboxWebhook);
  app.use(grader);
  app.use((req, _res, next) => {
    const role = req.header('x-role');
    if (role) req.session = { sub: 'u1', workspaces: [{ id: 'ws_acme', role: role as 'admin' | 'agent' }] };
    next();
  });
  app.use(express.json());
  app.use(billingApi);
  server = app.listen(0);
  base = `http://localhost:${(server.address() as { port: number }).port}`;
});

after(async () => {
  server.close();
  await wipe();
  await close();
});

const grade = (path: string, body: unknown) =>
  fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-grader-token': config.graderToken }, body: JSON.stringify(body) });
const snapshot = async () => ((await (await fetch(base + '/__grader/snapshot', { headers: { 'x-grader-token': config.graderToken } })).json()) as any).workspaces;

async function token(number = '4242424242424242') {
  const res = await fetch(`${PB}/v1/tokens`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${config.paybox.publishableKey}` },
    body: JSON.stringify({ card: { number, exp_month: 12, exp_year: 2031, cvc: '123' } }),
  });
  return ((await res.json()) as { id: string }).id;
}

const report = async () => (await (await fetch(`${PB}/__admin/report`)).json()) as any;

const sign = (raw: string, t = Math.floor(Date.now() / 1000), key = secret) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.${raw}`).digest('hex')}`;
const hook = (raw: string, header: string | null) =>
  fetch(`${base}/webhooks/paybox`, { method: 'POST', headers: { 'content-type': 'application/json', ...(header ? { 'x-paybox-signature': header } : {}) }, body: raw });
const evt = (type: string, customer: string, id = `evt_${Math.random()}`) => JSON.stringify({ id, type, created: 1, data: { object: { id: 'sub_x', customer, status: 'active' } } });

test('the signature check follows the Paybox header format', () => {
  const raw = '{"a":1}';
  const now = Math.floor(Date.now() / 1000);
  assert.equal(checkSignature(sign(raw, now), Buffer.from(raw), secret, now), 'ok');
  assert.equal(checkSignature(sign(raw, now, 'other'), Buffer.from(raw), secret, now), 'bad');
  assert.equal(checkSignature(sign(raw, now - 400), Buffer.from(raw), secret, now), 'stale');
  assert.equal(checkSignature(undefined, Buffer.from(raw), secret, now), 'bad');
});

test('a never-subscribed workspace is on a free trial and can send', async () => {
  const snap = await snapshot();
  assert.deepEqual(snap.ws_globex.billing, { status: 'none', seats: 0, can_send: true });
  const r = await grade('/__grader/reply', { workspace: 'ws_globex', contact: '+14155550101', text: 'hi', client_ref: 'trial-1' });
  assert.equal(r.status, 202);
});

test('three subscribes at the same instant make one customer and one subscription', async () => {
  const before = (await report()).customers.filter((c: any) => c.workspace === 'ws_acme').length;
  const tokens = await Promise.all([token(), token(), token()]);
  const rs = await Promise.all(tokens.map((t) => grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 3, token: t })));
  assert.deepEqual(rs.map((r) => r.status), [200, 200, 200]);
  const after = (await report()).customers.filter((c: any) => c.workspace === 'ws_acme');
  assert.equal(after.length, before + 1);
  const b = (await getBilling('ws_acme'))!;
  const mine = after.find((c: any) => c.id === b.customerId);
  assert.equal(mine.subscriptions.length, 1);
  assert.equal(mine.subscriptions[0].quantity, 3);
  assert.deepEqual((await snapshot()).ws_acme.billing, { status: 'active', seats: 3, can_send: true });
});

test('seat changes: increase is charged, decrease warns when below headcount, bad input is 400', async () => {
  const { people } = await cols();
  await people.insertMany([1, 2, 3, 4].map((n) => ({ ws: 'ws_acme', sub: `p${n}`, name: `P${n}` })));
  const up = await grade('/__grader/billing/seats', { workspace: 'ws_acme', seats: 5 });
  assert.equal(up.status, 200);
  assert.equal(((await up.json()) as any).seats, 5);
  const down = await grade('/__grader/billing/seats', { workspace: 'ws_acme', seats: 2 });
  const body = (await down.json()) as any;
  assert.equal(down.status, 200);
  assert.equal(body.seats, 2);
  assert.match(body.warning, /4 known people/);
  for (const seats of [0, -1, 1.5, '3', null, 100000]) assert.equal((await grade('/__grader/billing/seats', { workspace: 'ws_acme', seats })).status, 400);
  assert.equal((await grade('/__grader/billing/seats', { workspace: 'ws_nope', seats: 2 })).status, 404);
  assert.equal((await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 2 })).status, 400);
});

test('a seat increase the card cannot pay for is 402 and the stored seats stay as Paybox has them', async () => {
  await wipe();
  const t = await token('4000000000000341');
  assert.equal((await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 2, token: t })).status, 200);
  const r = await grade('/__grader/billing/seats', { workspace: 'ws_acme', seats: 6 });
  assert.equal(r.status, 402);
  assert.equal(((await r.json()) as any).seats, 2);
  assert.equal((await getBilling('ws_acme'))!.seats, 2);
});

test('a declined card is 402 and the workspace is incomplete', async () => {
  await wipe();
  const r = await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 2, token: await token('4000000000000002') });
  const body = (await r.json()) as any;
  assert.equal(r.status, 402);
  assert.match(body.error, /declined/);
  assert.equal((await snapshot()).ws_acme.billing.status, 'incomplete');
  assert.equal(await canSend('ws_acme'), true);
});

test('a card that needs bank approval is 402 with the approval url', async () => {
  await wipe();
  const r = await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 1, token: await token('4000002500003155') });
  const body = (await r.json()) as any;
  assert.equal(r.status, 402);
  assert.equal(body.requires_action, true);
  assert.match(body.next_action.url, /\/authenticate\//);
  const b = (await getBilling('ws_acme'))!;
  assert.equal(b.status, 'incomplete');
  await fetch(body.next_action.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"outcome":"approve"}' });
  await refreshFromPaybox('ws_acme');
  assert.equal((await getBilling('ws_acme'))!.status, 'active');
});

test('forged, stale and unsigned webhooks are 401; unknown types are 2xx; bad json is 400', async () => {
  const raw = evt('invoice.paid', 'cus_x');
  assert.equal((await hook(raw, null)).status, 401);
  assert.equal((await hook(raw, sign(raw, undefined, 'not-the-secret'))).status, 401);
  assert.equal((await hook(raw, sign(raw, Math.floor(Date.now() / 1000) - 600))).status, 401);
  const unknown = evt('thing.happened', 'cus_x');
  assert.equal((await hook(unknown, sign(unknown))).status, 200);
  assert.equal((await hook('nope', sign('nope'))).status, 400);
  assert.equal((await hook('{"id":"e1","type":"invoice.paid"}', sign('{"id":"e1","type":"invoice.paid"}'))).status, 400);
});

test('a signed event is stored once, repeats are acknowledged, and a fake payload does not change state', async () => {
  await wipe();
  await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 1, token: await token('4000000000000002') });
  const b = (await getBilling('ws_acme'))!;
  const raw = evt('customer.subscription.updated', b.customerId!, 'evt_fixed_1');
  assert.equal((await hook(raw, sign(raw))).status, 200);
  const again = await hook(raw, sign(raw));
  assert.equal(again.status, 200);
  assert.equal(((await again.json()) as any).duplicate, true);
  const { billingEvents } = await cols();
  assert.equal(await billingEvents.countDocuments({ eventId: 'evt_fixed_1' }), 1);
  // the event said active; Paybox says incomplete
  assert.equal((await getBilling('ws_acme'))!.status, 'incomplete');
  const stranger = evt('invoice.paid', 'cus_unknown');
  assert.equal((await hook(stranger, sign(stranger))).status, 200);
});

test('renewal failures move the workspace to past_due then canceled, and replies stop only then', async () => {
  await wipe();
  const t = await token('4000000000000341');
  assert.equal((await grade('/__grader/billing/subscribe', { workspace: 'ws_acme', seats: 1, token: t })).status, 200);
  await fetch(`${PB}/v1/test_clock/advance`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"days":31}' });
  await refreshFromPaybox('ws_acme');
  assert.equal((await getBilling('ws_acme'))!.status, 'past_due');
  assert.equal(await canSend('ws_acme'), true);
  await fetch(`${PB}/v1/test_clock/advance`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"days":10}' });
  await refreshFromPaybox('ws_acme');
  assert.deepEqual((await snapshot()).ws_acme.billing, { status: 'canceled', seats: 1, can_send: false });

  const r = await grade('/__grader/reply', { workspace: 'ws_acme', contact: '+14155550101', text: 'hi', client_ref: 'blocked-1' });
  assert.equal(r.status, 402);
  assert.deepEqual(await r.json(), { error: 'subscription canceled' });
  const { outbox, convs } = await cols();
  assert.equal(await outbox.countDocuments({ ws: 'ws_acme' }), 0);
  assert.equal(await convs.countDocuments({ ws: 'ws_acme' }), 0);
  const ok = await grade('/__grader/reply', { workspace: 'ws_globex', contact: '+14155550101', text: 'hi', client_ref: 'other-ws' });
  assert.equal(ok.status, 202);
});

test('billing routes are for admins only', async () => {
  const call = (role: string, path: string, method = 'GET', body?: unknown) =>
    fetch(base + path, { method, headers: { 'content-type': 'application/json', 'x-role': role }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.equal((await call('agent', '/api/billing?workspace=ws_acme')).status, 403);
  assert.equal((await call('agent', '/api/billing/seats', 'POST', { workspace: 'ws_acme', seats: 3 })).status, 403);
  assert.equal((await call('agent', '/api/billing/subscribe', 'POST', { workspace: 'ws_acme', seats: 3, token: 'x' })).status, 403);
  assert.equal((await call('agent', '/api/billing/cancel', 'POST', { workspace: 'ws_acme' })).status, 403);
  const r = await call('admin', '/api/billing?workspace=ws_acme');
  assert.equal(r.status, 200);
  const v = (await r.json()) as any;
  assert.equal(v.priceCentsPerSeat, 1200);
  assert.equal(v.canSend, false);
  assert.match(v.plainState, /canceled/);
});
