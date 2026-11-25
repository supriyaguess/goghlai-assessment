import express, { type ErrorRequestHandler } from 'express';
import { createServer } from 'node:http';
import { config } from './config.js';
import { ensureIndexes } from './db.js';
import { getRedis } from './redis.js';
import { webhook } from './routes/webhook.js';
import { grader } from './routes/grader.js';
import { startSender, stopSender } from './lib/outbox.js';

const app = express();
app.disable('x-powered-by');

let ready = false;
app.get('/healthz', (_req, res) => {
  res.status(ready ? 200 : 503).json({ ok: ready });
});

app.use(webhook);
app.use(grader);

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = Number(err?.status) >= 400 && Number(err?.status) < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  if (!res.headersSent) res.status(status).json({ error: status === 500 ? 'internal error' : 'bad request' });
};
app.use(onError);

const server = createServer(app);

async function main() {
  server.listen(config.port, () => console.log(`server on http://localhost:${config.port}`));
  await ensureIndexes();
  await getRedis().ping();
  startSender();
  ready = true;
}

main().catch((e) => {
  console.error('startup failed', e);
  process.exit(1);
});

for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => {
    stopSender();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
