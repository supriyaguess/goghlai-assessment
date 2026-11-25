import { config } from '../config.js';

export class PayboxError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
  // 0 means Paybox never answered
  get unreachable() {
    return this.status === 0;
  }
}

export type Payment = {
  id: string;
  status: 'succeeded' | 'failed' | 'requires_action';
  error?: { code: string };
  next_action?: { type: string; url: string };
};

export type Invoice = { id: string; status: string; amount_due: number; payment: Payment | null };

export type Subscription = {
  id: string;
  customer: string;
  status: string;
  quantity: number;
  cancel_at_period_end: boolean;
  current_period_end: number;
  latest_invoice: Invoice | null;
};

export type Customer = { id: string; metadata?: Record<string, string> };

const TIMEOUT_MS = 8000;

async function once(method: string, path: string, body: unknown, idemKey?: string) {
  const res = await fetch(config.paybox.url + path, {
    method,
    headers: {
      authorization: `Bearer ${config.paybox.secretKey}`,
      'content-type': 'application/json',
      ...(idemKey ? { 'idempotency-key': idemKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw new PayboxError(res.status, data?.error?.code ?? 'error', data?.error?.message);
  return data;
}

// A network failure is retried once. Mutating calls always carry an idempotency
// key, so a request that did arrive the first time is not applied twice.
async function call<T>(method: string, path: string, body?: unknown, idemKey?: string): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await once(method, path, body, idemKey);
    } catch (e) {
      if (e instanceof PayboxError) throw e;
      if (i === 1) throw new PayboxError(0, 'unreachable', 'Paybox did not answer');
    }
  }
}

export const paybox = {
  createCustomer: (body: { name: string; metadata: Record<string, string> }, key: string) => call<Customer>('POST', '/v1/customers', body, key),
  getCustomer: (id: string) => call<Customer>('GET', `/v1/customers/${encodeURIComponent(id)}`),
  attachPaymentMethod: (customer: string, token: string, key: string) =>
    call<Customer>('POST', `/v1/customers/${encodeURIComponent(customer)}/payment_method`, { token }, key),
  createSubscription: (customer: string, quantity: number, key: string, metadata: Record<string, string>) =>
    call<Subscription>('POST', '/v1/subscriptions', { customer, price: 'price_seat_monthly', quantity, metadata }, key),
  getSubscription: (id: string) => call<Subscription>('GET', `/v1/subscriptions/${encodeURIComponent(id)}`),
  listSubscriptions: (customer: string) =>
    call<{ data: Subscription[] }>('GET', `/v1/subscriptions?customer=${encodeURIComponent(customer)}`).then((r) => r.data),
  updateSubscription: (id: string, body: { quantity?: number; cancel_at_period_end?: boolean }, key: string) =>
    call<Subscription>('POST', `/v1/subscriptions/${encodeURIComponent(id)}`, body, key),
  cancelNow: (id: string) => call<Subscription>('DELETE', `/v1/subscriptions/${encodeURIComponent(id)}`),
};
