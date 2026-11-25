import { Router, raw } from 'express';
import { config, isWorkspace } from '../config.js';
import { checkSignature } from '../lib/signature.js';
import { storeInbound, storeStatus } from '../lib/inbound.js';

export const webhook = Router();

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

webhook.post('/webhooks/pigeon', raw({ type: () => true, limit: '256kb' }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const sig = checkSignature(req.header('x-pigeon-signature'), body, config.pigeon.webhookSecret);
  if (sig !== 'ok') return res.status(401).json({ error: sig === 'stale' ? 'stale timestamp' : 'bad signature' });

  let evt: unknown;
  try {
    evt = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid json' });
  }
  if (!isObj(evt)) return res.status(400).json({ error: 'invalid event' });
  // unknown types and workspaces are acknowledged, otherwise Pigeon keeps retrying
  if (evt.type !== 'message.inbound' && evt.type !== 'message.status') return res.json({ ok: true, ignored: 'type' });
  if (!isWorkspace(evt.workspace)) return res.json({ ok: true, ignored: 'workspace' });
  if (!isObj(evt.data)) return res.status(400).json({ error: 'invalid event' });

  try {
    if (evt.type === 'message.inbound') {
      const d = evt.data;
      const at = new Date(evt.occurred_at);
      if (!str(d.message_id) || !str(d.from) || typeof d.text !== 'string' || Number.isNaN(at.getTime())) {
        return res.status(400).json({ error: 'invalid inbound' });
      }
      await storeInbound(evt.workspace, { message_id: d.message_id, from: d.from, text: d.text }, at);
    } else if (evt.type === 'message.status') {
      const d = evt.data;
      // no client_ref means it is not one of ours
      if (!str(d.client_ref) || !str(d.status)) return res.json({ ok: true, ignored: 'status' });
      await storeStatus(evt.workspace, { message_id: str(d.message_id) ? d.message_id : undefined, client_ref: d.client_ref, status: d.status });
    }
  } catch (err) {
    console.error('webhook store failed', err);
    return res.status(503).json({ error: 'try again' });
  }
  res.json({ ok: true });
});
