import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { assertServerEnvironment, env } from './config/env.js';

let server;

async function start() {
  assertServerEnvironment();
  await connectDatabase();

  server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch((error) => {
  console.error('API failed to start:', error.message);
  process.exit(1);
});
