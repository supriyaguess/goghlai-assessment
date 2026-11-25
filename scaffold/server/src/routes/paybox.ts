import { Router, raw } from 'express';
import { config } from '../config.js';
import { cols, isDup } from '../db.js';
import { checkSignature } from '../lib/signature.js';
import { refreshForCustomer } from '../lib/billing.js';

export const payboxWebhook = Router();

const KNOWN = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
]);

// The payload is never used as state. It only says which customer to look at;
// the subscription is read from Paybox again.
payboxWebhook.post('/webhooks/paybox', raw({ type: () => true, limit: '256kb' }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const sig = checkSignature(req.header('x-paybox-signature'), body, config.paybox.webhookSecret);
  if (sig !== 'ok') return res.status(401).json({ error: sig === 'stale' ? 'stale timestamp' : 'bad signature' });

  let evt: any;
  try {
    evt = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid json' });
  }
  if (!evt || typeof evt !== 'object' || Array.isArray(evt) || typeof evt.id !== 'string' || !evt.id) return res.status(400).json({ error: 'invalid event' });
  if (!KNOWN.has(evt.type)) return res.json({ ok: true, ignored: 'type' });
  const customer = evt.data?.object?.customer;
  if (typeof customer !== 'string' || !customer) return res.status(400).json({ error: 'invalid event' });

  try {
    const { billingEvents } = await cols();
    if (await billingEvents.findOne({ eventId: evt.id }, { projection: { _id: 1 } })) return res.json({ ok: true, duplicate: true });
    const ours = await refreshForCustomer(customer);
    try {
      await billingEvents.insertOne({ eventId: evt.id, type: evt.type, at: new Date() });
    } catch (e) {
      if (!isDup(e)) throw e;
    }
    res.json({ ok: true, ...(ours ? {} : { ignored: 'customer' }) });
  } catch (err) {
    // Paybox retries on 5xx, which is what we want when it or the database was unreachable
    console.error('paybox webhook failed', err);
    res.status(503).json({ error: 'try again' });
  }
});
