import { randomBytes, randomUUID } from 'node:crypto';
import { cols, type Billing, type BillingStatus } from '../db.js';
import { config, isWorkspace } from '../config.js';
import { getRedis } from '../redis.js';
import { paybox, PayboxError, type Subscription } from './paybox.js';

export const PRICE_CENTS_PER_SEAT = 1200;
export const MAX_SEATS = 1000;
export const validSeats = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= MAX_SEATS;

export type Result = { code: number; body: Record<string, unknown> };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lockKey = (ws: string) => `sb:lock:billing:${ws}`;
const UNLOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;

// One billing change per workspace at a time, across server copies.
async function withLock<T>(ws: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  const token = randomUUID();
  const until = Date.now() + 30_000;
  while (!(await redis.set(lockKey(ws), token, 'PX', 60_000, 'NX'))) {
    if (Date.now() > until) throw new PayboxError(0, 'busy', 'another billing change is in progress');
    await sleep(10 + Math.random() * 20);
  }
  try {
    return await fn();
  } finally {
    await redis.eval(UNLOCK, 1, lockKey(ws), token).catch(() => null);
  }
}

export async function getBilling(ws: string): Promise<Billing | null> {
  const { billing } = await cols();
  return billing.findOne({ workspace: ws });
}

// past_due may still send: the customer did not do anything wrong yet and Paybox
// cancels on its own after the third failed attempt. See DECISIONS.md.
export const canSend = async (ws: string) => (await getBilling(ws))?.status !== 'canceled';

export async function billingState(ws: string) {
  const b = await getBilling(ws);
  const status = b?.status ?? 'none';
  return { status, seats: status === 'none' ? 0 : (b?.seats ?? 0), can_send: status !== 'canceled' };
}

async function ensureDoc(ws: string): Promise<Billing> {
  const { billing } = await cols();
  const now = new Date();
  await billing.updateOne(
    { workspace: ws },
    {
      $setOnInsert: {
        workspace: ws,
        nonce: randomBytes(6).toString('hex'),
        attempt: 0,
        customerId: null,
        subscriptionId: null,
        status: 'none',
        seats: 0,
        payment: null,
        nextActionUrl: null,
        cancelAtPeriodEnd: false,
        periodEnd: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  return (await billing.findOne({ workspace: ws }))!;
}

function statusOf(sub: Subscription): BillingStatus {
  switch (sub.status) {
    case 'active':
    case 'past_due':
    case 'incomplete':
    case 'canceled':
      return sub.status;
    default:
      // incomplete_expired: the first payment never happened, so it is as if they never subscribed
      return 'none';
  }
}

// Stores what Paybox says now. Never called with an event payload.
async function apply(ws: string, sub: Subscription): Promise<Billing> {
  const { billing } = await cols();
  const pay = sub.latest_invoice?.payment ?? null;
  const status = statusOf(sub);
  await billing.updateOne(
    { workspace: ws, subscriptionId: { $in: [null, sub.id] } },
    {
      $set: {
        customerId: sub.customer,
        subscriptionId: sub.id,
        status,
        seats: status === 'none' ? 0 : sub.quantity,
        payment: pay ? { status: pay.status, errorCode: pay.error?.code ?? null } : null,
        nextActionUrl: pay?.status === 'requires_action' ? (pay.next_action?.url ?? null) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        periodEnd: new Date(sub.current_period_end * 1000),
        updatedAt: new Date(),
      },
    },
  );
  return (await getBilling(ws))!;
}

const REASONS: Record<string, string> = {
  card_declined: 'Your card was declined.',
  insufficient_funds: 'Your card has insufficient funds.',
  authentication_failed: 'Your bank did not approve the payment.',
  no_payment_method: 'There is no card on file.',
};
const reason = (code: string | null | undefined) => REASONS[code ?? ''] ?? 'The payment did not go through.';

function outcome(b: Billing): Result {
  const base = { status: b.status, seats: b.seats, can_send: b.status !== 'canceled' };
  if (b.status === 'active') return { code: 200, body: base };
  if (b.nextActionUrl) {
    return { code: 402, body: { ...base, error: 'Your bank needs to approve this payment.', requires_action: true, next_action: { url: b.nextActionUrl } } };
  }
  if (b.status === 'incomplete') {
    const failed = b.payment?.status === 'failed';
    return { code: 402, body: { ...base, error: failed ? reason(b.payment?.errorCode) : 'The first payment is not confirmed yet.' } };
  }
  return { code: 402, body: { ...base, error: b.status === 'past_due' ? 'The last renewal payment failed.' : 'The subscription is not active.' } };
}

function failure(e: unknown): Result {
  if (!(e instanceof PayboxError)) throw e;
  if (e.unreachable) return { code: 503, body: { error: 'Payments are unavailable right now. Try again in a moment.' } };
  if (e.status === 402) return { code: 402, body: { error: reason(e.code) } };
  return { code: 400, body: { error: e.code === 'token_already_used' || e.code === 'no_such_token' ? 'The card details were already used or are not valid. Enter them again.' : e.message } };
}

const FAILED_RETRY_AFTER_MS = 5000;

// A new subscription is only made when there is none, the last one ended, or the
// first payment failed a moment ago (so the admin can try another card).
// Requests that land together find the one the first of them made.
function replaceable(b: Billing) {
  if (!b.subscriptionId || b.status === 'canceled' || b.status === 'none') return true;
  return b.status === 'incomplete' && b.payment?.status === 'failed' && Date.now() - b.updatedAt.getTime() > FAILED_RETRY_AFTER_MS;
}

export async function subscribeWorkspace(workspace: string, seats: number, token: string, who: string): Promise<Result> {
  try {
    return await withLock(workspace, async () => {
      const { billing } = await cols();
      let b = await ensureDoc(workspace);

      if (b.status === 'past_due' && b.customerId) {
        await paybox.attachPaymentMethod(b.customerId, token, `pm:${workspace}:${b.nonce}:${token}`);
        return { code: 402, body: { ...outcome(b).body, error: 'Card updated. Paybox will use it on the next retry.' } };
      }
      if (!replaceable(b)) return outcome(b);

      if (!b.customerId) {
        const c = await paybox.createCustomer({ name: `Workspace ${workspace}`, metadata: { workspace, created_by: who } }, `cus:${workspace}:${b.nonce}`);
        await billing.updateOne({ workspace }, { $set: { customerId: c.id } });
        b = { ...b, customerId: c.id };
      }
      await paybox.attachPaymentMethod(b.customerId!, token, `pm:${workspace}:${b.nonce}:${token}`);

      if (b.subscriptionId) {
        if (b.status !== 'canceled') await paybox.cancelNow(b.subscriptionId).catch((e) => { if (!(e instanceof PayboxError && e.status === 404)) throw e; });
        // clearing the id first means a crash from here on is retried with the same key
        await billing.updateOne(
          { workspace },
          { $set: { attempt: b.attempt + 1, subscriptionId: null, status: 'none', seats: 0, payment: null, nextActionUrl: null, updatedAt: new Date() } },
        );
        b = (await getBilling(workspace))!;
      }
      const sub = await paybox.createSubscription(b.customerId!, seats, `sub:${workspace}:${b.nonce}:${b.attempt}`, { workspace });
      return outcome(await apply(workspace, sub));
    });
  } catch (e) {
    return failure(e);
  }
}

export async function changeSeats(workspace: string, seats: number): Promise<Result> {
  try {
    return await withLock(workspace, async () => {
      const b = await getBilling(workspace);
      if (!b?.subscriptionId || (b.status !== 'active' && b.status !== 'past_due')) {
        return { code: 409, body: { error: 'There is no active subscription to change.' } };
      }
      const before = b.seats;
      if (seats === before) return { code: 200, body: { status: b.status, seats, can_send: true } };
      let sub: Subscription;
      try {
        sub = await paybox.updateSubscription(b.subscriptionId, { quantity: seats }, `seats:${randomUUID()}`);
      } catch (e) {
        if (e instanceof PayboxError && e.status === 402) {
          // keep whatever Paybox now says, not the number that was asked for
          const now = await paybox.getSubscription(b.subscriptionId).then((s) => apply(workspace, s)).catch(() => b);
          return { code: 402, body: { error: `The extra seats could not be charged. ${reason(e.code)}`, status: now.status, seats: now.seats, can_send: now.status !== 'canceled' } };
        }
        throw e;
      }
      const now = await apply(workspace, sub);
      const body: Record<string, unknown> = { status: now.status, seats: now.seats, can_send: now.status !== 'canceled' };
      if (seats < before) {
        body.note = 'The unused part of the removed seats becomes credit on your next invoice. It is not refunded.';
        const { people } = await cols();
        const known = await people.countDocuments({ ws: workspace });
        // allowed on purpose: nobody is locked out, the admin is only told
        if (seats < known) body.warning = `This workspace has ${known} known people but now pays for ${seats} seats.`;
      }
      return { code: 200, body };
    });
  } catch (e) {
    return failure(e);
  }
}

export async function cancelAtPeriodEnd(workspace: string): Promise<Result> {
  try {
    return await withLock(workspace, async () => {
      const b = await getBilling(workspace);
      if (!b?.subscriptionId || (b.status !== 'active' && b.status !== 'past_due')) {
        return { code: 409, body: { error: 'There is no active subscription to cancel.' } };
      }
      const sub = await paybox.updateSubscription(b.subscriptionId, { cancel_at_period_end: true }, `cancel:${workspace}:${b.nonce}:${b.attempt}`);
      const now = await apply(workspace, sub);
      return { code: 200, body: { status: now.status, seats: now.seats, can_send: true, cancel_at_period_end: true } };
    });
  } catch (e) {
    return failure(e);
  }
}

export async function refreshFromPaybox(workspace: string) {
  await withLock(workspace, async () => {
    const b = await getBilling(workspace);
    if (!b?.customerId) return;
    let id = b.subscriptionId;
    if (!id) {
      const list = (await paybox.listSubscriptions(b.customerId)).sort((x, y) => (x as any).created - (y as any).created);
      id = list.at(-1)?.id ?? null;
    }
    if (!id) return;
    try {
      await apply(workspace, await paybox.getSubscription(id));
    } catch (e) {
      if (!(e instanceof PayboxError && e.status === 404)) throw e;
    }
  });
}

// Which workspace does an event belong to? The customer id we stored, else the
// customer's metadata (an event can beat our own write).
export async function refreshForCustomer(customerId: string): Promise<boolean> {
  const { billing } = await cols();
  let ws = (await billing.findOne({ customerId }))?.workspace;
  if (!ws) {
    const c = await paybox.getCustomer(customerId).catch((e) => {
      if (e instanceof PayboxError && e.status === 404) return null;
      throw e;
    });
    const meta = c?.metadata?.workspace;
    if (!isWorkspace(meta)) return false;
    await ensureDoc(meta);
    await billing.updateOne({ workspace: meta, customerId: null }, { $set: { customerId } });
    if ((await getBilling(meta))?.customerId !== customerId) return false;
    ws = meta;
  }
  await refreshFromPaybox(ws);
  return true;
}

const copy: Record<BillingStatus, string> = {
  none: 'Free trial. You can send messages.',
  incomplete: 'Waiting for the first payment.',
  active: 'Subscribed.',
  past_due: 'A renewal payment failed. Paybox is retrying. Update your card.',
  canceled: 'Subscription canceled. You can read the inbox but cannot send messages.',
};

export async function billingView(ws: string) {
  const b = await getBilling(ws);
  const status = b?.status ?? 'none';
  const seats = status === 'none' ? 0 : (b?.seats ?? 0);
  let plainState = copy[status];
  let nextStep: string | null = null;
  if (status === 'none') nextStep = 'Choose the number of seats and enter a card to subscribe.';
  if (status === 'incomplete') {
    if (b?.nextActionUrl) {
      plainState = 'Your bank needs you to approve the first payment.';
      nextStep = 'Open the bank approval page and approve it. This page updates by itself afterwards.';
    } else if (b?.payment?.status === 'failed') {
      plainState = `The first payment failed. ${reason(b.payment.errorCode)}`;
      nextStep = 'Try another card.';
    } else {
      plainState = 'Waiting for the first payment to be confirmed.';
      nextStep = 'Nothing to do yet. This updates when the payment clears.';
    }
  }
  if (status === 'active') {
    plainState = `Subscribed with ${seats} ${seats === 1 ? 'seat' : 'seats'} at $${PRICE_CENTS_PER_SEAT / 100} per seat per month.`;
    if (b?.cancelAtPeriodEnd) {
      plainState += ' It will end at the close of this period.';
    }
  }
  if (status === 'past_due') nextStep = 'Enter a new card. Paybox retries 3 and 5 days after the first failure, then cancels.';
  if (status === 'canceled') nextStep = 'Subscribe again to send messages.';
  return {
    status,
    seats,
    canSend: status !== 'canceled',
    plainState,
    nextStep,
    nextActionUrl: status === 'incomplete' ? (b?.nextActionUrl ?? null) : null,
    priceCentsPerSeat: PRICE_CENTS_PER_SEAT,
    publishableKey: config.paybox.publishableKey,
  };
}
