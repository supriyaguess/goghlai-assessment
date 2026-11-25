import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { cols, isDup } from '../db.js';
import { addFrame } from '../lib/frames.js';
import { roleIn } from '../lib/session.js';
import { isWorkspace } from '../config.js';

// The server only ever stores and returns opaque base64 strings here.
// Keys are made and used in the browser; see PROTOCOL.md.
export const notes = Router();

export const validContact = (v: unknown): v is string => typeof v === 'string' && /^\+?[0-9A-Za-z._:-]{3,40}$/.test(v);

const MAX_B64 = 16_384;
const b64 = (v: unknown, max = MAX_B64): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max && /^[A-Za-z0-9+/_-]+={0,2}$/.test(v);

function workspaceOf(req: any, res: any): string | null {
  const ws = req.params.ws ?? req.query.workspace ?? req.body?.workspace;
  if (!isWorkspace(ws) || !roleIn(req.session, ws)) {
    res.status(403).json({ error: 'not a member of this workspace' });
    return null;
  }
  return ws;
}

// register (or replace) my public key; replacing drops the key that was wrapped for the old one
notes.put('/api/keys', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  if (!b64(req.body?.publicKey, 400)) return res.status(400).json({ error: 'publicKey required' });
  const { keys } = await cols();
  await keys.updateOne(
    { ws, sub: req.session!.sub },
    { $set: { publicKey: req.body.publicKey }, $unset: { wrappedKey: '', wrappedBy: '' } },
    { upsert: true },
  );
  res.json({ ok: true });
});

notes.get('/api/workspaces/:ws/keys', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  const { keys, keyring } = await cols();
  const all = await keys.find({ ws }).toArray();
  const mine = all.find((k) => k.sub === req.session!.sub);
  res.json({
    initialised: !!(await keyring.findOne({ ws })),
    members: all.map((k) => ({ sub: k.sub, publicKey: k.publicKey, hasKey: !!k.wrappedKey })),
    mine: mine?.wrappedKey ? { wrappedKey: mine.wrappedKey, wrappedBy: mine.wrappedBy } : null,
  });
});

// the first member creates the workspace key; everyone after that is given it by a member who has it
notes.post('/api/workspaces/:ws/keyring', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  if (!b64(req.body?.wrappedKey)) return res.status(400).json({ error: 'wrappedKey required' });
  const { keys, keyring } = await cols();
  const me = await keys.findOne({ ws, sub: req.session!.sub });
  if (!me) return res.status(409).json({ error: 'register a public key first' });
  try {
    await keyring.insertOne({ ws, creator: me.sub, createdAt: new Date() });
  } catch (e) {
    if (!isDup(e)) throw e;
    // a creator whose first attempt died before storing its key may finish the job
    const ring = await keyring.findOne({ ws });
    if (ring?.creator !== me.sub || me.wrappedKey) return res.status(409).json({ error: 'workspace key already exists' });
  }
  await keys.updateOne({ ws, sub: me.sub }, { $set: { wrappedKey: req.body.wrappedKey, wrappedBy: me.sub } });
  res.status(201).json({ ok: true });
});

notes.put('/api/workspaces/:ws/keys/:sub', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  if (!b64(req.body?.wrappedKey)) return res.status(400).json({ error: 'wrappedKey required' });
  const { keys } = await cols();
  const me = await keys.findOne({ ws, sub: req.session!.sub });
  if (!me?.wrappedKey) return res.status(403).json({ error: 'you do not hold the workspace key' });
  // first write wins, so nobody can overwrite a key someone already has
  const r = await keys.updateOne(
    { ws, sub: req.params.sub, wrappedKey: { $exists: false } },
    { $set: { wrappedKey: req.body.wrappedKey, wrappedBy: me.sub } },
  );
  if (!r.matchedCount) return res.status(409).json({ error: 'unknown member, or already has a key' });
  res.json({ ok: true });
});

notes.post('/api/conversations/:contact/notes', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
  if (!b64(req.body?.ciphertext) || !b64(req.body?.iv, 64)) return res.status(400).json({ error: 'ciphertext and iv required' });
  const { notes: col } = await cols();
  const doc = {
    _id: new ObjectId(),
    ws,
    contact: req.params.contact,
    author: req.session!.sub,
    ciphertext: req.body.ciphertext,
    iv: req.body.iv,
    createdAt: new Date(),
  };
  await col.insertOne(doc);
  await addFrame(ws, `note:${doc._id}`, { type: 'note.added', contact: doc.contact, note_id: String(doc._id), author: doc.author });
  res.status(201).json({ id: String(doc._id) });
});

notes.get('/api/conversations/:contact/notes', async (req, res) => {
  const ws = workspaceOf(req, res);
  if (!ws) return;
  const { notes: col } = await cols();
  const rows = await col.find({ ws, contact: req.params.contact }).sort({ createdAt: 1 }).limit(500).toArray();
  res.json({
    notes: rows.map((n) => ({ id: String(n._id), author: n.author, ciphertext: n.ciphertext, iv: n.iv, createdAt: n.createdAt })),
  });
});
