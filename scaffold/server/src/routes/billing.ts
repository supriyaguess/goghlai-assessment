import { Router, type Request, type Response } from 'express';
import { isWorkspace } from '../config.js';
import { roleIn } from '../lib/session.js';
import { billingView, cancelAtPeriodEnd, changeSeats, subscribeWorkspace, validSeats, type Result } from '../lib/billing.js';

// Mounted after the session middleware. Admins only, on every route.
export const billingApi = Router();

function admin(req: Request, res: Response): string | null {
  const ws = (req.query.workspace ?? req.body?.workspace) as unknown;
  if (!isWorkspace(ws)) {
    res.status(ws === undefined ? 400 : 403).json({ error: 'workspace required' });
    return null;
  }
  if (roleIn(req.session!, ws) !== 'admin') {
    res.status(403).json({ error: 'only an admin can manage billing' });
    return null;
  }
  return ws;
}

billingApi.get('/api/billing', async (req, res) => {
  const ws = admin(req, res);
  if (!ws) return;
  res.json(await billingView(ws));
});

// the UI always gets the full view (price, plain-language state); the action's own result adds error, warning and the bank link
async function respond(res: Response, ws: string, r: Result) {
  const extra: Record<string, unknown> = {};
  if (r.body.error) extra.error = r.body.error;
  if (r.body.warning) extra.warning = r.body.warning;
  const url = (r.body.next_action as { url?: string } | undefined)?.url;
  if (url) extra.nextActionUrl = url;
  res.status(r.code).json({ ...(await billingView(ws)), ...extra });
}

billingApi.post('/api/billing/subscribe', async (req, res) => {
  const ws = admin(req, res);
  if (!ws) return;
  const { seats, token } = req.body ?? {};
  if (!validSeats(seats) || typeof token !== 'string' || !token || token.length > 200) return res.status(400).json({ error: 'seats (1 to 1000) and a card token are required' });
  const r = await subscribeWorkspace(ws, seats, token, req.session!.sub);
  await respond(res, ws, r);
});

billingApi.post('/api/billing/seats', async (req, res) => {
  const ws = admin(req, res);
  if (!ws) return;
  if (!validSeats(req.body?.seats)) return res.status(400).json({ error: 'seats must be a whole number from 1 to 1000' });
  const r = await changeSeats(ws, req.body.seats);
  await respond(res, ws, r);
});

billingApi.post('/api/billing/cancel', async (req, res) => {
  const ws = admin(req, res);
  if (!ws) return;
  const r = await cancelAtPeriodEnd(ws);
  await respond(res, ws, r);
});
