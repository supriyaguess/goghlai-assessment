import type { Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { config, isWorkspace } from './config.js';
import { getRedis } from './redis.js';
import { channel, framesAfter, lastSeq } from './lib/frames.js';
import { roleIn, sessionFromCookie } from './lib/session.js';

type Client = { socket: WebSocket; ws: string; sent: number; busy: boolean; again: boolean };

const clients = new Set<Client>();

async function flush(c: Client) {
  if (c.busy) {
    c.again = true;
    return;
  }
  c.busy = true;
  try {
    do {
      c.again = false;
      while (c.socket.readyState === c.socket.OPEN) {
        const batch = await framesAfter(c.ws, c.sent);
        if (!batch.length) break;
        for (const f of batch) c.socket.send(JSON.stringify(f));
        c.sent = batch[batch.length - 1].seq;
      }
    } while (c.again);
  } catch (e) {
    console.error('ws flush failed', e);
  } finally {
    c.busy = false;
  }
}

const reject = (socket: Duplex, line: string) => {
  socket.write(`HTTP/1.1 ${line}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
};

export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  const sub = getRedis().duplicate();
  sub.subscribe(...config.workspaces.map(channel)).catch((e) => console.error('subscribe failed', e));
  sub.on('message', (chan) => {
    for (const c of clients) if (channel(c.ws) === chan) void flush(c);
  });

  // a missed pub/sub message must not leave a client behind
  const timer = setInterval(() => clients.forEach((c) => void flush(c)), 2000);
  timer.unref();

  server.on('upgrade', async (req, socket, head) => {
    try {
      const url = new URL(req.url ?? '', 'http://x');
      if (url.pathname !== '/ws') return reject(socket, '404 Not Found');
      const origin = req.headers.origin;
      if (origin && origin !== config.webOrigin && origin !== `http://${req.headers.host}`) return reject(socket, '403 Forbidden');
      const session = await sessionFromCookie(req.headers.cookie);
      if (!session) return reject(socket, '401 Unauthorized');
      const ws = url.searchParams.get('workspace');
      if (!isWorkspace(ws) || !roleIn(session, ws)) return reject(socket, '403 Forbidden');

      const afterParam = url.searchParams.get('after');
      const newest = await lastSeq(ws);
      const after = afterParam !== null && /^\d+$/.test(afterParam) ? Math.min(Number(afterParam), newest) : newest;

      wss.handleUpgrade(req, socket, head, (socket) => {
        const client: Client = { socket, ws, sent: after, busy: false, again: false };
        clients.add(client);
        socket.on('close', () => clients.delete(client));
        socket.on('error', () => clients.delete(client));
        void flush(client);
      });
    } catch (e) {
      console.error('ws upgrade failed', e);
      reject(socket, '500 Internal Server Error');
    }
  });
}
