# Switchboard

A shared team inbox. Customers write to a business through a messaging provider
(Pigeon), support agents sign in, see conversations arrive live, claim them and
reply. Several workspaces share one deployment and never see each other's data.

Stack: Node 22, Express 5, TypeScript, MongoDB, Redis, `ws`. The web app is
React + Vite.

## Run it

You need Node 22+ and Docker.

```
npm run up                  # MongoDB, Redis, Pigeon, IdP, Paybox in Docker
npm run scaffold:install    # server and web dependencies
npm run scaffold:server     # API on http://localhost:4000
npm run scaffold:web        # web app on http://localhost:5173
```

Settings come from the environment; the defaults match the local Docker
services, so no `.env` is needed. `.env.example` lists every variable.
`GRADER_TOKEN` must be set explicitly when `NODE_ENV=production`.

No Docker: `npm run mocks` starts the simulators with plain Node, and
`MONGO_URL` / `REDIS_URL` can point at any MongoDB and Redis.

## Check

```
npm run check               # level 1, about 90 s
npm run check:full          # levels 1, 2, 3 and 5, about 4 min, writes CHECK_REPORT.json
npm run check -- --levels 5
```

The check starts the server itself (see `switchboard.json`), so stop your dev
server first. It wipes application data.

## How it is put together

```
Pigeon --webhook--> POST /webhooks/pigeon --> MongoDB (messages, frames)
                                                  |
                          Redis pub/sub  <--------+
                                |
browser <--WebSocket /ws--------+

agent reply --> outbox (MongoDB) --> sender loop --> Pigeon /v1/messages
```

- **Webhooks** (`routes/webhook.ts`): HMAC signature over the raw body, five
  minute window. A message is stored first and acknowledged after, so a
  crash makes Pigeon retry. Inserts are keyed on Pigeon's `message_id`, so
  duplicates collapse. Order is by `occurred_at`, not arrival.
- **Frames** (`lib/frames.ts`): every change a client may care about is a row
  with a per-workspace `seq`, written under a short Redis lock so rows commit
  in seq order. WebSocket clients read rows after their last seq, which is
  also how `?after=` replay works.
- **Replies** (`lib/outbox.ts`): a reply is a row in `outbox`, written before
  the request is answered. Any server copy can lease a due row (20 s lease),
  so work left by a dead copy is picked up by the others. Pigeon gets the
  `client_ref` as `Idempotency-Key`, which makes every retry safe.
- **Rate limit** (`lib/ratelimit.ts`): one token bucket per workspace in
  Redis, shared by all copies. A `429 Retry-After` or `503` pauses the
  workspace for everyone.
- **Claim** (`lib/conversations.ts`): one atomic upsert guarded by a unique
  index on `(workspace, contact)`, so only one agent can hold a conversation.

## Layout

```
scaffold/server/src
  index.ts            wiring, health, shutdown
  config.ts           environment
  db.ts               collections and indexes
  routes/             webhook, grader (check endpoints)
  lib/                signature, frames, inbound, outbox, ratelimit, conversations
harness/              the check (given)
pigeon/ idp/ paybox/  simulators (given)
```

`DECISIONS.md` has what was cut and what is still wrong.
