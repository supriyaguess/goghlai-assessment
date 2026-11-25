import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { getRedis } from '../redis.js';
import { authorizeUrl, exchange, pkce } from '../lib/oidc.js';
import { parseCookies, setCookie } from '../lib/cookies.js';
import { createSession, destroySession, SESSION_COOKIE } from '../lib/session.js';
import { cols } from '../db.js';

export const auth = Router();

const FLOW_COOKIE = 'sb_flow';
const secure = config.webOrigin.startsWith('https:');

auth.get('/auth/login', async (_req, res) => {
  try {
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');
    const { verifier, challenge } = pkce();
    await getRedis().set(`sb:flow:${state}`, JSON.stringify({ verifier, nonce }), 'EX', 600);
    setCookie(res, FLOW_COOKIE, state, 600, secure);
    res.redirect(await authorizeUrl(state, nonce, challenge));
  } catch (e) {
    console.error('login start failed', e);
    res.status(502).json({ error: 'identity provider unavailable' });
  }
});

auth.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  const cookies = parseCookies(req.header('cookie'));
  if (typeof code !== 'string' || typeof state !== 'string' || cookies[FLOW_COOKIE] !== state) {
    return res.status(400).json({ error: 'invalid login response' });
  }
  const raw = await getRedis().getdel(`sb:flow:${state}`);
  if (!raw) return res.status(400).json({ error: 'login expired, start again' });
  try {
    const { verifier, nonce } = JSON.parse(raw);
    const who = await exchange(code, verifier, nonce);
    const { people } = await cols();
    await Promise.all(
      who.workspaces.map((w) =>
        people.updateOne({ ws: w.id, sub: who.sub }, { $set: { name: who.name || who.email || who.sub, email: who.email } }, { upsert: true }),
      ),
    );
    const sid = await createSession(who);
    res.clearCookie(FLOW_COOKIE, { path: '/' });
    setCookie(res, SESSION_COOKIE, sid, config.sessionTtlSec, secure);
    res.redirect(config.webOrigin);
  } catch (e) {
    console.error('login failed', e);
    res.status(401).json({ error: 'login failed' });
  }
});

auth.post('/auth/logout', async (req, res) => {
  const origin = req.header('origin');
  if (origin && origin !== config.webOrigin && origin !== `http://${req.header('host')}`) return res.status(403).json({ error: 'bad origin' });
  const sid = parseCookies(req.header('cookie'))[SESSION_COOKIE];
  if (sid) await destroySession(sid);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});
