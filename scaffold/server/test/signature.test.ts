import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { checkSignature } from '../src/lib/signature.ts';

const secret = 'whsec_test';
const body = Buffer.from('{"id":"evt_1","type":"message.inbound"}');
const now = 1_800_000_000;

const sign = (t: number, raw = body) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.`).update(raw).digest('hex')}`;

test('accepts a fresh, correctly signed body', () => {
  assert.equal(checkSignature(sign(now), body, secret, now), 'ok');
});

test('accepts a timestamp just inside five minutes', () => {
  assert.equal(checkSignature(sign(now - 299), body, secret, now), 'ok');
});

test('flags a correctly signed body older than five minutes as stale', () => {
  assert.equal(checkSignature(sign(now - 301), body, secret, now), 'stale');
  assert.equal(checkSignature(sign(now + 301), body, secret, now), 'stale');
});

test('rejects a body that was changed after signing', () => {
  const header = sign(now);
  assert.equal(checkSignature(header, Buffer.from('{"id":"evt_2"}'), secret, now), 'bad');
});

test('rejects a wrong secret', () => {
  const header = `t=${now},v1=${createHmac('sha256', 'other').update(`${now}.`).update(body).digest('hex')}`;
  assert.equal(checkSignature(header, body, secret, now), 'bad');
});

test('a bad signature on an old timestamp is bad, not stale', () => {
  assert.equal(checkSignature(`t=${now - 1000},v1=${'0'.repeat(64)}`, body, secret, now), 'bad');
});

test('rejects missing and malformed headers', () => {
  for (const h of [undefined, '', 'garbage', `t=${now}`, `v1=${'a'.repeat(64)}`, `t=abc,v1=${'a'.repeat(64)}`, `t=${now},v1=zz`, `t=${now},v1=${'a'.repeat(10)}`]) {
    assert.equal(checkSignature(h, body, secret, now), 'bad', String(h));
  }
});
