import { createHmac, timingSafeEqual } from 'node:crypto';

export type SigResult = 'ok' | 'bad' | 'stale';

const TOLERANCE_SEC = 300;

export function checkSignature(header: string | undefined, raw: Buffer, secret: string, nowSec = Date.now() / 1000): SigResult {
  if (!header) return 'bad';
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return i < 0 ? ['', ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !/^\d{1,12}$/.test(t) || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return 'bad';
  const expected = createHmac('sha256', secret).update(`${t}.`).update(raw).digest();
  const given = Buffer.from(v1, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'bad';
  return Math.abs(nowSec - Number(t)) > TOLERANCE_SEC ? 'stale' : 'ok';
}
