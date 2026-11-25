import { Router, json, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { config, isWorkspace } from '../config.js';
import { cols } from '../db.js';
import { roleIn, sessionFromCookie, type Session } from '../lib/session.js';
import { claim, release, setStatus } from '../lib/conversations.js';
import { createReply } from '../lib/outbox.js';
import { notes, validContact } from './notes.js';

export const api = Router();


declare module 'express-serve-static-core' {
  interface Request {
    session?: Session;
  }
}

api.use('/api', json({ limit: '64kb' }));

// cookie auth: refuse writes that come from some other site
api.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.header('origin');
  if (origin && origin !== config.webOrigin && origin !== `http://${req.header('host')}`) {
    return res.status(403).json({ error: 'bad origin' });
  }
  next();
});

api.use('/api', async (req, res, next) => {
  try {
    const s = await sessionFromCookie(req.header('cookie'));
    if (!s) return res.status(401).json({ error: 'not signed in' });
    req.session = s;
    next();
  } catch (e) {
    next(e);
  }
});

api.use(notes);

api.get('/api/me', (req, res) => {
  const s = req.session!;
  res.json({ sub: s.sub, name: s.name, email: s.email, workspaces: s.workspaces });
});

// resolves ?workspace= (or body.workspace) and checks membership
function member(req: Request, res: Response): { ws: string; role: 'admin' | 'agent' } | null {
  const ws = (req.query.workspace ?? req.body?.workspace) as unknown;
  if (!isWorkspace(ws)) {
    res.status(ws === undefined ? 400 : 403).json({ error: 'workspace required' });
    return null;
  }
  const role = roleIn(req.session!, ws);
  if (!role) {
    res.status(403).json({ error: 'not a member of this workspace' });
    return null;
  }
  return { ws, role };
}

const pageSize = (v: unknown) => Math.min(Math.max(Number(v) || 30, 1), 100);

// display names for the people in a workspace, so the UI can show "Ben Ortiz" instead of an id
api.get('/api/workspaces/:ws/people', async (req, res) => {
  const ws = req.params.ws;
  if (!isWorkspace(ws) || !roleIn(req.session!, ws)) return res.status(403).json({ error: 'not a member of this workspace' });
  const { people } = await cols();
  const me = req.session!;
  const list = (await people.find({ ws }).toArray()).map((p) => ({ sub: p.sub, name: p.name }));
  if (!list.some((p) => p.sub === me.sub)) list.push({ sub: me.sub, name: me.name || me.email || me.sub });
  res.json({ people: list });
});

api.get('/api/conversations', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  const { convs } = await cols();
  const filter: Record<string, unknown> = { ws: m.ws };
  if (req.query.status === 'open' || req.query.status === 'closed') filter.status = req.query.status;
  if (req.query.assignee === 'me') filter.assignee = req.session!.sub;

  const limit = pageSize(req.query.limit);
  const before = typeof req.query.before === 'string' ? req.query.before.split('_') : null;
  if (before && before.length === 2 && !Number.isNaN(Number(before[0])) && ObjectId.isValid(before[1])) {
    const t = new Date(Number(before[0]));
    filter.$or = [{ lastActivityAt: { $lt: t } }, { lastActivityAt: t, _id: { $lt: new ObjectId(before[1]) } }];
  }
  const rows = await convs.find(filter as any).sort({ lastActivityAt: -1, _id: -1 }).limit(limit + 1).toArray();
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  res.json({
    conversations: page.map((c) => ({
      contact: c.contact,
      assignee: c.assignee,
      status: c.status,
      lastActivityAt: c.lastActivityAt,
      preview: c.preview ?? '',
    })),
    next: rows.length > limit && last ? `${last.lastActivityAt.getTime()}_${last._id}` : null,
  });
});

api.get('/api/conversations/:contact/messages', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  const contact = req.params.contact;
  const limit = pageSize(req.query.limit ?? 50);
  const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null;
  const { messages, outbox, convs } = await cols();

  const inFilter: Record<string, unknown> = { ws: m.ws, contact };
  const outFilter: Record<string, unknown> = { ws: m.ws, contact };
  if (before && !Number.isNaN(before.getTime())) {
    inFilter.occurredAt = { $lt: before };
    outFilter.createdAt = { $lt: before };
  }
  const [ins, outs, conv] = await Promise.all([
    messages.find(inFilter as any).sort({ occurredAt: -1, messageId: -1 }).limit(limit).toArray(),
    outbox.find(outFilter as any).sort({ createdAt: -1 }).limit(limit).toArray(),
    convs.findOne({ ws: m.ws, contact }),
  ]);
  const merged = [
    ...ins.map((x) => ({ direction: 'in' as const, id: x.messageId, text: x.text, at: x.occurredAt })),
    ...outs.map((x) => ({ direction: 'out' as const, id: x.clientRef, text: x.text, at: x.createdAt, status: x.status, sender: x.sender })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .reverse();
  res.json({
    conversation: conv && { contact: conv.contact, assignee: conv.assignee, status: conv.status },
    messages: merged,
    older: merged.length === limit ? merged[0].at : null,
  });
});

api.post('/api/conversations/:contact/reply', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text || text.length > 4000) return res.status(400).json({ error: 'text required (max 4000 chars)' });
  const ref = typeof req.body?.clientRef === 'string' && req.body.clientRef.length <= 80 ? req.body.clientRef : randomUUID();
  await createReply(m.ws, req.params.contact, text, ref, req.session!.sub);
  res.status(202).json({ clientRef: ref });
});

api.post('/api/conversations/:contact/claim', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
  const r = await claim(m.ws, req.params.contact, req.session!.sub);
  res.status(r === 'taken' ? 409 : 200).json({ result: r });
});

api.post('/api/conversations/:contact/release', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  const ok = await release(m.ws, req.params.contact, req.session!.sub, m.role === 'admin');
  res.status(ok ? 200 : 409).json({ released: ok });
});

api.post('/api/conversations/:contact/close', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  res.json({ changed: await setStatus(m.ws, req.params.contact, 'closed') });
});

api.post('/api/conversations/:contact/reopen', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
  res.json({ changed: await setStatus(m.ws, req.params.contact, 'open') });
});
