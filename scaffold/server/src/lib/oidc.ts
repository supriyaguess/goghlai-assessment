import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';
import { config } from '../config.js';
import type { Membership } from './session.js';

type Discovery = { issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string };
let discovery: { at: number; doc: Discovery } | undefined;
let jwks: { at: number; keys: any[] } | undefined;

const getJson = async (url: string) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
};

async function getDiscovery(): Promise<Discovery> {
  if (!discovery || Date.now() - discovery.at > 10 * 60_000) {
    discovery = { at: Date.now(), doc: await getJson(`${config.oidc.issuer}/.well-known/openid-configuration`) };
  }
  return discovery.doc;
}

async function getKeys(force = false) {
  if (force || !jwks || Date.now() - jwks.at > 10 * 60_000) {
    const d = await getDiscovery();
    jwks = { at: Date.now(), keys: (await getJson(d.jwks_uri)).keys ?? [] };
  }
  return jwks.keys;
}

export const pkce = () => {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
};

export async function authorizeUrl(state: string, nonce: string, challenge: string) {
  const d = await getDiscovery();
  const u = new URL(d.authorization_endpoint);
  u.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.oidc.clientId,
    redirect_uri: config.oidc.redirectUri,
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return u.toString();
}

export type Identity = { sub: string; name?: string; email?: string; workspaces: Membership[] };

export async function exchange(code: string, verifier: string, nonce: string): Promise<Identity> {
  const d = await getDiscovery();
  const res = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oidc.redirectUri,
      client_id: config.oidc.clientId,
      client_secret: config.oidc.clientSecret,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`token endpoint answered ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error('no id_token');
  return verifyIdToken(id_token, d.issuer, nonce);
}

async function verifyIdToken(token: string, issuer: string, nonce: string): Promise<Identity> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('malformed id_token');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  if (header.alg !== 'RS256') throw new Error('unexpected alg');
  let jwk = (await getKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'));
  if (!ok) throw new Error('bad id_token signature');

  const c = JSON.parse(Buffer.from(p, 'base64url').toString());
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (c.iss !== issuer || !aud.includes(config.oidc.clientId)) throw new Error('wrong issuer or audience');
  if (typeof c.exp !== 'number' || c.exp * 1000 < Date.now()) throw new Error('id_token expired');
  if (c.nonce !== nonce) throw new Error('nonce mismatch');
  if (typeof c.sub !== 'string' || !c.sub) throw new Error('no sub');

  const workspaces: Membership[] = (Array.isArray(c.workspaces) ? c.workspaces : [])
    .filter((w: any) => w && typeof w.id === 'string' && (w.role === 'admin' || w.role === 'agent'))
    .map((w: any) => ({ id: w.id, role: w.role }));
  return { sub: c.sub, name: c.name, email: c.email, workspaces };
}
