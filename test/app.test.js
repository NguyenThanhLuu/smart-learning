import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports API and database state', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload, {
    data: { status: 'ok', database: 'disconnected' },
  });
});

test('allows requests from any CORS origin', async () => {
  const origin = 'https://frontend.example.com';
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: origin },
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
});

test('protected endpoints reject requests without a token', async () => {
  const response = await fetch(`${baseUrl}/api/articles`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.message, 'Authentication is required.');
});
