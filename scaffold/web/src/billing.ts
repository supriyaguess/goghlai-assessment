import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, get, post } from './api';

export type BillingStatus = 'none' | 'incomplete' | 'active' | 'past_due' | 'canceled';

export interface Billing {
  status: BillingStatus;
  seats: number;
  canSend: boolean;
  plainState: string;
  nextStep: string | null;
  nextActionUrl: string | null;
  priceCentsPerSeat: number;
  publishableKey: string;
  warning?: string;
}

export interface Card {
  number: string;
  expiry: string;
  cvc: string;
}

export interface CardErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
}

export class PaymentError extends Error {
  nextActionUrl: string | null;
  constructor(message: string, nextActionUrl: string | null = null) {
    super(message);
    this.nextActionUrl = nextActionUrl;
  }
}

const PAYBOX_URL = String(import.meta.env.VITE_PAYBOX_URL || 'http://localhost:4030').replace(/\/$/, '');
const POLL_MS = 5000;

export function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function seatLabel(seats: number) {
  return `${seats} ${seats === 1 ? 'seat' : 'seats'}`;
}

export function totalLine(seats: number, priceCents: number) {
  return `${seatLabel(seats)} x ${money(priceCents)} = ${money(seats * priceCents)} per month`;
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCardNumber(value: string) {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})(?=.)/g, '$1 ');
}

export function formatExpiry(value: string) {
  const d = digitsOnly(value).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function luhn(number: string) {
  let sum = 0;
  for (let i = 0; i < number.length; i++) {
    let n = Number(number[number.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

function parseExpiry(expiry: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!m) return null;
  return { month: Number(m[1]), year: 2000 + Number(m[2]) };
}

export function validateCard(card: Card, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const number = digitsOnly(card.number);
  if (!number) errors.number = 'Enter the card number.';
  else if (number.length < 13 || !luhn(number)) errors.number = 'This card number does not look right.';

  const exp = parseExpiry(card.expiry);
  if (!card.expiry) errors.expiry = 'Enter the expiry date as MM/YY.';
  else if (!exp || exp.month < 1 || exp.month > 12) errors.expiry = 'Use the format MM/YY, for example 08/29.';
  else if (exp.year < now.getFullYear() || (exp.year === now.getFullYear() && exp.month < now.getMonth() + 1)) {
    errors.expiry = 'This card has expired.';
  }

  if (!card.cvc) errors.cvc = 'Enter the 3 or 4 digit security code.';
  else if (!/^\d{3,4}$/.test(card.cvc)) errors.cvc = 'The security code has 3 or 4 digits.';
  return errors;
}

export function hasErrors(errors: CardErrors) {
  return Boolean(errors.number || errors.expiry || errors.cvc);
}

const TOKEN_MESSAGES: Record<string, string> = {
  invalid_number: 'The payment provider did not recognise this card number.',
  invalid_cvc: 'The security code was not accepted.',
  expired_card: 'This card has expired.',
};

export async function tokenizeCard(publishableKey: string, card: Card): Promise<string> {
  const exp = parseExpiry(card.expiry);
  if (!exp) throw new PaymentError('Use the format MM/YY for the expiry date.');
  let res: Response;
  try {
    res = await fetch(`${PAYBOX_URL}/v1/tokens`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${publishableKey}` },
      body: JSON.stringify({
        card: { number: digitsOnly(card.number), exp_month: exp.month, exp_year: exp.year, cvc: card.cvc },
      }),
    });
  } catch {
    throw new PaymentError('Could not reach the payment provider. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id) {
    const code = data?.error?.code as string | undefined;
    throw new PaymentError((code && TOKEN_MESSAGES[code]) || 'The card could not be checked. Please review the details.');
  }
  return data.id as string;
}

export const fetchBilling = (workspace: string) =>
  get<Billing>(`/api/billing?workspace=${encodeURIComponent(workspace)}`);

async function paid(request: Promise<Billing>, fallback: string) {
  try {
    return await request;
  } catch (err) {
    if (err instanceof ApiError && err.status === 402) {
      const body = err.body as { error?: unknown; nextActionUrl?: unknown } | undefined;
      throw new PaymentError(
        typeof body?.error === 'string' && body.error ? body.error : fallback,
        typeof body?.nextActionUrl === 'string' ? body.nextActionUrl : null,
      );
    }
    throw err;
  }
}

export const subscribe = (workspace: string, seats: number, token: string) =>
  paid(post<Billing>('/api/billing/subscribe', { workspace, seats, token }), 'The payment did not go through.');

export const changeSeats = (workspace: string, seats: number) =>
  paid(post<Billing>('/api/billing/seats', { workspace, seats }), 'The extra charge did not go through.');

export const cancelSubscription = (workspace: string) => post<Billing>('/api/billing/cancel', { workspace });

export interface BillingState {
  billing: Billing | null;
  loading: boolean;
  failed: boolean;
  refresh: () => Promise<Billing | null>;
  replace: (next: Billing) => void;
}

export function useBilling(workspace: string, enabled: boolean): BillingState {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);
  const version = useRef(0);

  const refresh = useCallback(async () => {
    const started = version.current;
    try {
      const next = await fetchBilling(workspace);
      if (!alive.current || started !== version.current) return null;
      setBilling(next);
      setFailed(false);
      return next;
    } catch {
      if (alive.current && started === version.current) setFailed(true);
      return null;
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [workspace]);

  useEffect(() => {
    alive.current = true;
    if (enabled) refresh();
    return () => {
      alive.current = false;
    };
  }, [enabled, refresh]);

  const status = billing?.status;
  useEffect(() => {
    if (!enabled || status !== 'incomplete') return;
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, status, refresh]);

  const replace = useCallback((next: Billing) => {
    version.current += 1;
    setBilling(next);
    setFailed(false);
  }, []);

  return { billing, loading, failed, refresh, replace };
}
