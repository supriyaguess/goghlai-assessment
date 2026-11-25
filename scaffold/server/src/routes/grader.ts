import { Router, json } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { config, isWorkspace } from '../config.js';
import { cols } from '../db.js';
import { getRedis } from '../redis.js';
import { claim } from '../lib/conversations.js';
import { createReply } from '../lib/outbox.js';
import { billingState, canSend, changeSeats, subscribeWorkspace, validSeats } from '../lib/billing.js';

export const grader = Router();

grader.use('/__grader', (req, res, next) => {
  // hash both sides so the compare does not depend on the token length
  const digest = (v: string) => createHash('sha256').update(v).digest();
  if (!timingSafeEqual(digest(String(req.header('x-grader-token') ?? '')), digest(config.graderToken))) return res.status(401).json({ error: 'unauthorized' });
  next();
});
grader.use('/__grader', json({ limit: '64kb' }));

grader.post('/__grader/reset', async (_req, res) => {
  const c = await cols();
  await Promise.all(Object.values(c).map((col) => col.deleteMany({})));
  const redis = getRedis();
  for (const pattern of ['sb:rl:*', 'sb:cool:*', 'sb:lock:*']) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  }
  res.json({ ok: true });
});

grader.get('/__grader/snapshot', async (_req, res) => {
  const { messages, convs, outbox } = await cols();
  const out: Record<string, any> = {};
  for (const ws of config.workspaces) {
    const contacts: Record<string, { inbound: string[]; assignee: string | null }> = Object.create(null);
    const msgs = await messages.find({ ws }).sort({ occurredAt: 1, messageId: 1 }).toArray();
    for (const m of msgs) (contacts[m.contact] ??= { inbound: [], assignee: null }).inbound.push(m.messageId);
    for (const cv of await convs.find({ ws }).toArray()) (contacts[cv.contact] ??= { inbound: [], assignee: null }).assignee = cv.assignee;
    const outbound: Record<string, string> = {};
    for (const o of await outbox.find({ ws }).toArray()) outbound[o.clientRef] = o.status;
    out[ws] = { contacts, outbound, billing: await billingState(ws) };
  }
  res.json({ workspaces: out });
});

grader.post('/__grader/reply', async (req, res) => {
  const { workspace, contact, text, client_ref } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if ([contact, text, client_ref].some((v) => typeof v !== 'string' || !v || v.length > 4000) || contact.length > 64 || client_ref.length > 100) return res.status(400).json({ error: 'contact, text and client_ref are required' });
  if (!(await canSend(workspace))) return res.status(402).json({ error: 'subscription canceled' });
  await createReply(workspace, contact, text, client_ref, 'grader');
  res.status(202).json({ ok: true });
});

grader.post('/__grader/claim', async (req, res) => {
  const { workspace, contact, agent } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if ([contact, agent].some((v) => typeof v !== 'string' || !v)) return res.status(400).json({ error: 'contact and agent are required' });
  const r = await claim(workspace, contact, agent);
  res.status(r === 'taken' ? 409 : 200).json({ result: r });
});

grader.post('/__grader/billing/subscribe', async (req, res) => {
  const { workspace, seats, token } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if (!validSeats(seats) || typeof token !== 'string' || !token) return res.status(400).json({ error: 'seats and token are required' });
  const r = await subscribeWorkspace(workspace, seats, token, 'grader');
  res.status(r.code).json(r.body);
});

grader.post('/__grader/billing/seats', async (req, res) => {
  const { workspace, seats } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if (!validSeats(seats)) return res.status(400).json({ error: 'seats must be a whole number of 1 or more' });
  const r = await changeSeats(workspace, seats);
  res.status(r.code).json(r.body);
});
