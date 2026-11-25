import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'node:http';
import { notes } from '../src/routes/notes.ts';
import { cols } from '../src/db.ts';
import { wipe, close } from './helpers.ts';

let server: Server;
let base = '';

before(async () => {
  await wipe();
  const app = express();
  app.use(express.json());
  // stand-in for the session middleware: the test names the user in a header
  app.use((req, _res, next) => {
    const sub = req.header('x-sub');
    if (sub) req.session = { sub, workspaces: [{ id: 'ws_acme', role: 'agent' }] };
    next();
  });
  app.use(notes);
  server = app.listen(0);
  base = `http://localhost:${(server.address() as { port: number }).port}`;
});

after(async () => {
  server.close();
  await wipe();
  await close();
});

const call = (sub: string, method: string, path: string, body?: unknown) =>
  fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-sub': sub },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const pub = (n: string) => `cHVibGlj${n}`;
const wrapped = (n: string) => `d3JhcHBlZA${n}`;

test('only one member can create the workspace key', async () => {
  assert.equal((await call('u_asha', 'PUT', '/api/keys', { workspace: 'ws_acme', publicKey: pub('A') })).status, 200);
  assert.equal((await call('u_ben', 'PUT', '/api/keys', { workspace: 'ws_acme', publicKey: pub('B') })).status, 200);

  const results = await Promise.all(
    ['u_asha', 'u_ben'].map((s) => call(s, 'POST', '/api/workspaces/ws_acme/keyring', { wrappedKey: wrapped(s) })),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
});

test('a member without the key cannot hand it out, and cannot overwrite one', async () => {
  const { keys } = await cols();
  const holder = (await keys.findOne({ ws: 'ws_acme', wrappedKey: { $exists: true } }))!.sub;
  const other = holder === 'u_asha' ? 'u_ben' : 'u_asha';

  assert.equal((await call(other, 'PUT', `/api/workspaces/ws_acme/keys/${holder}`, { wrappedKey: wrapped('x') })).status, 403);
  assert.equal((await call(holder, 'PUT', `/api/workspaces/ws_acme/keys/${other}`, { wrappedKey: wrapped('1') })).status, 200);
  assert.equal((await call(holder, 'PUT', `/api/workspaces/ws_acme/keys/${other}`, { wrappedKey: wrapped('2') })).status, 409);
});

test('key state shows who has a key and my own wrapped key', async () => {
  const res = await call('u_ben', 'GET', '/api/workspaces/ws_acme/keys');
  const body = (await res.json()) as any;
  assert.equal(body.initialised, true);
  assert.equal(body.members.length, 2);
  assert.ok(body.mine.wrappedKey);
});

test('notes come back as the opaque strings that were stored', async () => {
  const note = { workspace: 'ws_acme', ciphertext: 'c2VjcmV0', iv: 'aXZpdml2aXZpdg' };
  assert.equal((await call('u_ben', 'POST', '/api/conversations/%2B14155550101/notes', note)).status, 201);
  const list = (await (await call('u_asha', 'GET', '/api/conversations/%2B14155550101/notes?workspace=ws_acme')).json()) as any;
  assert.equal(list.notes.length, 1);
  assert.equal(list.notes[0].author, 'u_ben');
  assert.equal(list.notes[0].ciphertext, 'c2VjcmV0');
});

test('notes stay inside their conversation and workspace', async () => {
  const other = (await (await call('u_ben', 'GET', '/api/conversations/%2B14155550102/notes?workspace=ws_acme')).json()) as any;
  assert.equal(other.notes.length, 0);
  assert.equal((await call('u_ben', 'GET', '/api/conversations/%2B14155550101/notes?workspace=ws_globex')).status, 403);
});

test('rejects junk instead of storing it', async () => {
  assert.equal((await call('u_ben', 'POST', '/api/conversations/%2B14155550101/notes', { workspace: 'ws_acme', ciphertext: '<script>', iv: 'abc' })).status, 400);
  assert.equal((await call('u_ben', 'POST', '/api/conversations/%2B14155550101/notes', { workspace: 'ws_acme', ciphertext: 'a'.repeat(20_000), iv: 'abc' })).status, 400);
});
