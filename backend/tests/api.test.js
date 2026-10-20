import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ethers } from 'ethers';

process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-123';

const { default: app } = await import('../src/app.js');
const { loginMessage, registrationMessage } = await import('../src/utils/messages.js');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health endpoint responds', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, service: 'backend' });
});

test('unknown routes return JSON 404', async () => {
  const res = await fetch(`${base}/does-not-exist`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).message, 'Not found');
});

test('protected routes require a bearer token', async () => {
  for (const path of ['/auth/me', '/voters', '/audit', '/voting/status/x']) {
    const res = await fetch(`${base}${path}`);
    assert.equal(res.status, 401, path);
  }
});

test('an invalid token is rejected', async () => {
  const res = await fetch(`${base}/auth/me`, { headers: { Authorization: 'Bearer not-a-jwt' } });
  assert.equal(res.status, 401);
});

test('admin routes cannot be reached without auth', async () => {
  const res = await post('/elections', { title: 'x', chainElectionId: 1 });
  assert.equal(res.status, 401);
});

test('nonce rejects an invalid wallet address', async () => {
  const res = await post('/auth/nonce', { walletAddress: 'nope' });
  assert.equal(res.status, 400);
});

test('verify-signature validates its input before touching the database', async () => {
  const res = await post('/auth/verify-signature', {});
  assert.equal(res.status, 400);
});

test('register rejects requests without a wallet signature', async () => {
  const wallet = ethers.Wallet.createRandom();
  const form = new FormData();
  for (const [k, v] of Object.entries({ name: 'A', email: 'a@example.com', password: 'password123', demoVoterId: 'D1', walletAddress: wallet.address })) {
    form.append(k, v);
  }
  const res = await fetch(`${base}/auth/register`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
  assert.match((await res.json()).message, /signature/i);
});

test('register rejects disallowed upload types', async () => {
  const form = new FormData();
  form.append('document', new Blob(['<script>'], { type: 'text/html' }), 'evil.html');
  const res = await fetch(`${base}/auth/register`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
  assert.match((await res.json()).message, /Unsupported file type/);
});

test('signed messages recover to the signing wallet', async () => {
  const wallet = ethers.Wallet.createRandom();
  const reg = registrationMessage(wallet.address, 'User@Example.com');
  assert.equal(ethers.verifyMessage(reg, await wallet.signMessage(reg)), wallet.address);
  assert.equal(reg, registrationMessage(wallet.address.toLowerCase(), 'user@example.com'));
  const login = loginMessage('abc');
  assert.equal(ethers.verifyMessage(login, await wallet.signMessage(login)), wallet.address);
});
