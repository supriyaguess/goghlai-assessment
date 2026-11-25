import type { Response } from 'express';

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function setCookie(res: Response, name: string, value: string, maxAgeSec: number, secure: boolean) {
  res.cookie(name, value, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: maxAgeSec * 1000, secure });
}
