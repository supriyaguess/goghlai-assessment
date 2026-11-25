# Claude Code sub-agent session agent-acef5be6276b83fad

Plain rendering of the adjacent `.jsonl` file, which is the unedited export. Nothing is removed except binary image data.


---

## user  
2026-11-25T13:53:52.422Z

You are writing PART B of a personal study guide (it will become a PDF) for a candidate who must defend their take-home project in a live follow-up call where interviewers open the code and ask why it is the way it is. The reader is not an expert: use simple Hinglish (Roman Hindi mixed with English technical words, friendly, short sentences), define any jargon in one line the first time, give small analogies. Do not mention hiding AI use or any private chat. Do NOT edit any repo file; write ONLY /tmp/pdf-parts/B.md (create the directory) in Markdown.

Source of truth: /Users/apple/Desktop/repo-new/gohlai-assessment: read the actual code in scaffold/server/src (index.ts, config.ts, db.ts, ws.ts, routes/*, lib/*), scaffold/server/test, scaffold/web/src, plus DECISIONS.md, PROTOCOL.md, README.md. Every statement must match the code; quote file names and function names; do not invent.

Sections:
1. 'Code ka tour' - a table or list of EVERY server file and the main web files: what it does in one or two plain sentences and the 1-2 functions that matter most. Group them (entry, routes, lib, tests, web).
2. 'Interview ke 25 sawal aur jawab' - 25 likely questions an interviewer would ask about THIS code (mix: crash safety, duplicates, ordering, locks vs counters, why Redis and Mongo both, rate limiting across copies, WebSocket replay, auth and cookies, CSRF/origin, tenant isolation, NoSQL injection, encrypted notes, retry rules, pagination cursors, unread state, the people endpoint, what is NOT done / known weaknesses from DECISIONS.md). For each: the question, then a crisp 3-6 line answer the candidate can speak aloud in simple words, then 'Code me kahan dikhana hai: file:function'. Include these specific questions: (a) kill -9 between storing a message and writing its frame - what happens on retry; (b) a reply times out at 6 s but Pigeon accepted it at 12 s - every mechanism that prevents a double send; (c) why a Redis lock for seq instead of an atomic counter, and what saves you if the lock expires; (d) how the conversation pagination cursor works and its weak spot; (e) why a failed reply retries with a NEW client_ref but a network-level failure reuses the same one; (f) what the Origin check protects and what SameSite=Lax does; (g) in PROTOCOL.md how a hostile server could trick a new member; (h) what is still wrong in the project (be honest, use DECISIONS.md).
3. 'Agar interviewer bole code badlo' - 6 small live-change tasks they might ask (e.g. change the rate limit, add a field to the snapshot, add a status, change lease time, add a new webhook type) with exactly which file and lines to touch and a 2-line how-to.
Final message: one line saying the file is written.


---

## user  
2026-11-25T13:53:52.440Z

<system-reminder>
Your final report is delivered through SubagentHandback: when your work is complete, call SubagentHandback({message: <your full report>}). The call ends your run, so make it your last step. Only a SubagentHandback call reaches your caller as your result; plain text you write at the end is not delivered. Do not also send the report with SendMessage: your caller would get it twice.
</system-reminder>


---

## assistant  
2026-11-25T13:53:54.273Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; find . -path ./node_modules -prune -o -type f -not -path '*/node_modules/*' -not -path './.git/*' -print | head -100; wc -l scaffold/server/src/*.ts scaffold/server/src/*/*.ts DECISIONS.md PROTOCOL.md README.md"
}
```


---

## user  
2026-11-25T13:53:54.908Z

**tool result**

```
./START_HERE.md
./REFERENCE.html
./REFERENCE.pdf
./README.md
./BONUS_BILLING.md
./switchboard.json
./PIGEON.md
./.gitignore
./package.json
./PAYBOX.md
./docker-compose.yml
./BRIEF.md
./.env.example
./CHECK_REPORT.json
./SUBMISSION.md
./DECISIONS.md
./PROTOCOL.md
./idp/server.js
./pigeon/server.js
./.check-logs/instance-2.log
./.check-logs/instance-1.log
./.devcontainer/devcontainer.json
./harness/pigeon.js
./harness/check.js
./harness/doctor.js
./harness/run-mocks.js
./paybox/server.js
./docs/screenshots/09-details-panel.png
./docs/screenshots/11-mobile-thread.png
./docs/screenshots/01-sign-in.png
./docs/screenshots/10-mobile-list.png
./docs/screenshots/04-conversation.png
./docs/screenshots/05-claim-and-reply.png
./docs/screenshots/03-inbox.png
./docs/screenshots/02-identity-provider.png
./docs/screenshots/07-live-update.png
./docs/screenshots/06-private-note.png
./docs/screenshots/08-closed-tab.png
./scaffold/web/index.html
./scaffold/web/package-lock.json
./scaffold/web/package.json
./scaffold/web/tsconfig.json
./scaffold/web/vite.config.ts
./scaffold/server/package-lock.json
./scaffold/server/package.json
./scaffold/server/tsconfig.json
./scaffold/web/src/App.tsx
./scaffold/web/src/main.tsx
./scaffold/web/src/messages.ts
./scaffold/web/src/keyring.ts
./scaffold/web/src/people.ts
./scaffold/web/src/crypto.ts
./scaffold/web/src/api.ts
./scaffold/web/src/types.ts
./scaffold/web/src/format.ts
./scaffold/web/src/vite-env.d.ts
./scaffold/web/src/useLatest.ts
./scaffold/web/src/unread.ts
./scaffold/web/src/useSocket.ts
./scaffold/server/test/helpers.ts
./scaffold/server/test/ratelimit.test.ts
./scaffold/server/test/signature.test.ts
./scaffold/server/test/outbox.test.ts
./scaffold/server/test/webhook.test.ts
./scaffold/server/test/frames.test.ts
./scaffold/server/test/conversations.test.ts
./scaffold/server/test/notes.test.ts
./scaffold/server/src/redis.ts
./scaffold/server/src/ws.ts
./scaffold/server/src/index.ts
./scaffold/server/src/config.ts
./scaffold/server/src/db.ts
./scaffold/web/src/styles/tokens.css
./scaffold/web/src/styles/thread.css
./scaffold/web/src/styles/layout.css
./scaffold/web/src/styles/panel.css
./scaffold/web/src/styles/base.css
./scaffold/web/src/components/Toasts.tsx
./scaffold/web/src/components/ThreadHeader.tsx
./scaffold/web/src/components/Inbox.tsx
./scaffold/web/src/components/ReplyBox.tsx
./scaffold/web/src/components/NotesPanel.tsx
./scaffold/web/src/components/Workspace.tsx
./scaffold/web/src/components/InfoPanel.tsx
./scaffold/web/src/components/MessageBubble.tsx
./scaffold/web/src/components/Avatar.tsx
./scaffold/web/src/components/icons.tsx
./scaffold/web/src/components/ConversationRow.tsx
./scaffold/web/src/components/Rail.tsx
./scaffold/web/src/components/Thread.tsx
./scaffold/web/src/components/SignIn.tsx
./scaffold/server/src/lib/conversations.ts
./scaffold/server/src/lib/outbox.ts
./scaffold/server/src/lib/signature.ts
./scaffold/server/src/lib/frames.ts
./scaffold/server/src/lib/inbound.ts
./scaffold/server/src/lib/ratelimit.ts
./scaffold/server/src/lib/session.ts
./scaffold/server/src/lib/cookies.ts
./scaffold/server/src/lib/oidc.ts
      52 scaffold/server/src/config.ts
     113 scaffold/server/src/db.ts
      55 scaffold/server/src/index.ts
      10 scaffold/server/src/redis.ts
      81 scaffold/server/src/ws.ts
      77 scaffold/server/src/lib/conversations.ts
      20 scaffold/server/src/lib/cookies.ts
      66 scaffold/server/src/lib/frames.ts
      49 scaffold/server/src/lib/inbound.ts
      96 scaffold/server/src/lib/oidc.ts
     138 scaffold/server/src/lib/outbox.ts
      52 scaffold/server/src/lib/ratelimit.ts
      29 scaffold/server/src/lib/session.ts
      22 scaffold/server/src/lib/signature.ts
     176 scaffold/server/src/routes/api.ts
      63 scaffold/server/src/routes/auth.ts
      63 scaffold/server/src/routes/grader.ts
     118 scaffold/server/src/routes/notes.ts
      47 scaffold/server/src/routes/webhook.ts
      57 DECISIONS.md
      43 PROTOCOL.md
     161 README.md
    1588 total
```


---

## assistant  
2026-11-25T13:53:56.286Z

_thinking_




---

## assistant  
2026-11-25T13:53:56.937Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; for f in index.ts config.ts db.ts redis.ts ws.ts lib/*.ts routes/*.ts; do echo \"=== $f\"; cat -n $f; done"
}
```


---

## assistant  
2026-11-25T13:53:57.330Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; cat DECISIONS.md PROTOCOL.md; sed -n 1,161p README.md"
}
```


---

## user  
2026-11-25T13:53:57.987Z

**tool result**

```
<persisted-output>
Output too large (59.4KB). Full output saved to: /Users/apple/.claude/projects/-Users-apple-Desktop-repo-new/1a768465-323a-4dbe-8328-9a2acfe3acc6/tool-results/bmtvs1uv2.txt

Preview (first 2KB):
=== index.ts
     1	import express, { type ErrorRequestHandler } from 'express';
     2	import { createServer } from 'node:http';
     3	import { config } from './config.js';
     4	import { ensureIndexes } from './db.js';
     5	import { getRedis } from './redis.js';
     6	import { webhook } from './routes/webhook.js';
     7	import { grader } from './routes/grader.js';
     8	import { auth } from './routes/auth.js';
     9	import { api } from './routes/api.js';
    10	import { attachWebSocket } from './ws.js';
    11	import { startSender, stopSender } from './lib/outbox.js';
    12	
    13	const app = express();
    14	app.disable('x-powered-by');
    15	
    16	let ready = false;
    17	app.get('/healthz', (_req, res) => {
    18	  res.status(ready ? 200 : 503).json({ ok: ready });
    19	});
    20	
    21	app.use(webhook);
    22	app.use(grader);
    23	app.use(auth);
    24	app.use(api);
    25	
    26	const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    27	  const status = Number(err?.status) >= 400 && Number(err?.status) < 500 ? err.status : 500;
    28	  if (status === 500) console.error(err);
    29	  if (!res.headersSent) res.status(status).json({ error: status === 500 ? 'internal error' : 'bad request' });
    30	};
    31	app.use(onError);
    32	
    33	const server = createServer(app);
    34	attachWebSocket(server);
    35	
    36	async function main() {
    37	  server.listen(config.port, () => console.log(`server on http://localhost:${config.port}`));
    38	  await ensureIndexes();
    39	  await getRedis().ping();
    40	  startSender();
    41	  ready = true;
    42	}
    43	
    44	main().catch((e) => {
    45	  console.error('startup failed', e);
    46	  process.exit(1);
    47	});
    48	
    49	for (const sig of ['SIGTERM', 'SIGINT'] as const) {
    50	  process.on(sig, () => {
    51	    stopSender();
    52	    server.close(() => process.exit(0));
    53	    setTimeout(() => process.exit(0), 2000).unref();
    54	  });
...
</persisted-output>
```


---

## user  
2026-11-25T13:53:58.009Z

**tool result**

```
# Decisions

## What is built

- Webhook ingest with signature and replay checks, idempotent by Pigeon id, ordered by `occurred_at`.
- Replies through an outbox in MongoDB, sent by a loop that any server copy can run. Pigeon gets the `client_ref` as `Idempotency-Key`.
- Per-workspace rate limit and `Retry-After` pause shared through Redis.
- OIDC login (code + PKCE, id_token verified against the IdP's JWKS), sessions in Redis, workspace membership checked on every API call and on the WebSocket.
- Inbox API with cursor pagination, claim / release / close / reopen, WebSocket with `seq` and `?after=` replay.
- React app for all of the above.
- Encrypted private notes (`PROTOCOL.md`).
- Tests for the signature check, claim race, frame ordering, rate limiter and the notes/key endpoints (`npm --prefix scaffold/server test`, needs MongoDB and Redis).

## What is cut

- Search (Elasticsearch). Not started.
- Billing bonus. Not started.
- No automated frontend tests.

## Product and design decisions (inbox UI)

Before redesigning the UI I had it reviewed from a product and from a design point of view, and kept the decisions that came out of it.

- Unread state lives in the browser (localStorage), not on the server. It needs no backend change, and an agent mostly works from one device. A server read-model would be the next step.
- People are shown by name, not by id. The one small backend addition for this is `GET /api/workspaces/:ws/people`.
- When another agent holds a conversation the reply box is locked with the reason written next to it, rather than allowing a reply with a warning. A duplicate reply to a customer cannot be taken back.
- Retry on a failed message sends it as a new message with a new `client_ref`. The server dedupes on `client_ref`, so reusing the old one would not resend. Only a request that got no answer at all is retried with the same ref.
- Search covers the conversations already loaded and is labelled that way, instead of pretending to be full-text search. Real search is the Elasticsearch item.
- A dark narrow rail on the left (workspace, connection state, account) instead of a top bar: more room for messages. One indigo accent; state is carried by icon plus text, never colour alone.
- Private notes sit in a side panel next to the thread, not above it, so the thread keeps its height and a note cannot be mistaken for a message to the customer.
- System fonts and inline SVG only, no icon or UI library, so the app has no extra dependencies.
- Not built on purpose: dark mode, canned replies, tags, snooze, SLA timers, attachments, typing indicators, bulk actions, editing or deleting notes (that would complicate the encryption protocol).

## Choices where the brief is silent

- Every change a client may need is a row in `frames` with a per-workspace `seq`. The WebSocket reads rows after the client's last `seq`; Redis pub/sub only wakes sockets up, so a lost pub/sub message costs at most 2 seconds.
- `seq` is assigned under a short Redis lock so rows commit in order. The unique `(workspace, seq)` index is what really guarantees uniqueness if the lock ever expires.
- A message from a customer reopens a closed conversation.
- `assignee` is the IdP `sub`. The check's `agent` is stored as given.
- Any 2xx from Pigeon counts as accepted. A 4xx other than 429 marks the reply `failed`; 5xx, 408, timeouts and network errors are retried with backoff forever.
- A lease of 20 s on an outbox row is how a dead copy's work is picked up. Failover therefore takes up to about 20 s.
- Message status only moves forward (queued, sent, delivered or failed).
- Cookie sessions use `SameSite=Lax` plus an Origin check on every write (API, logout, WebSocket upgrade) instead of CSRF tokens.
- The session keeps the IdP's workspace claim as it was at login for 8 hours. Removing someone from a workspace at the IdP therefore takes effect at their next sign-in, not immediately.
- Display names come from a small `people` collection filled in as users use the app (`GET /api/workspaces/:ws/people`). The brief gives no directory, so someone who has never opened the app shows as "Teammate".

## What I know is still wrong or weak

- Replies to the same contact can leave in a different order than they were typed if one of them is retried.
- Assign / close frames are written after the database update. If the process dies in between, the frame is missing until the same agent repeats the action. A client that reconnects and refetches still sees the right state.
- A customer message that is stored but whose process dies before the conversation is reopened will not reopen it when Pigeon retries (the retry sees the message already stored).
- `frames` is never cleaned up.
- Message paging in a thread uses the timestamp only, so messages with exactly the same millisecond can be skipped at a page boundary.
- A retried reply whose request was answered by Pigeon with an unexpected 4xx is tried five times and then marked failed.
- Level 4 is not in the local check. I sent every case from the answer table in `PIGEON.md` to a running server with a small script and got the documented codes, but I have not seen it scored.
- The web app was driven through a full session in headless Chrome (login, claim, reply, note, live update, close); the screenshots in `docs/screenshots` come from that run. The narrow-screen layout was checked in the same browser at 390 px wide; other browsers were not tried, and there are no automated frontend tests.
- Secrets default to the dev values when the environment is empty. The server refuses to start in production without `GRADER_TOKEN`, but not for the others.
# Private notes: encryption protocol

Private notes are end-to-end encrypted in the browser with WebCrypto only. The server stores and relays opaque bytes and cannot read note text.

## Who holds what

| Secret / data | Held by | Where |
|---|---|---|
| User ECDH P-256 private key (one per user per workspace) | that user's browser only | IndexedDB `switchboard-keys`, key `${sub}:${workspace}`, non-extractable CryptoKey |
| Workspace key K (random AES-GCM 256) | members' browsers only | memory while the page is open; never persisted in the clear |
| Public keys (SPKI, base64) | server | registered via `PUT /api/keys` |
| Wrapped K, one per member | server | `wrappedKey` + `wrappedBy` |
| Note ciphertext, IV, author id, timestamp, contact id | server | notes table |

The server never sees a private key, K, or note plaintext.

## Flows

**Join.** On first opening the notes panel, the browser generates an ECDH keypair, stores the private key, and registers the public key (`PUT /api/keys`; registering again replaces it and drops the key that was wrapped for the old one, which is also how a lost profile is recovered). Registration happens only when no local keypair exists, because replacing a key invalidates the K that was wrapped for the old one. The first registration for a user/workspace wins.

**First-member bootstrap.** If the workspace is not initialised and I have no wrapped key, I generate K, wrap it for my own public key (wrappedBy = me) and `POST .../keyring`. A 409 means someone else got there first; I reload state.

**Sharing K.** Any member holding K, on panel load and every 10 s, looks for members with `hasKey = false` and `PUT`s a wrapped K for each. Wrapping: `ECDH(my private, recipient public)` -> HKDF-SHA256 (empty salt, info `switchboard-wrap-v1`) -> AES-GCM 256 key; encrypt raw K with a random 12-byte IV; `wrappedKey = base64(iv || ciphertext)`. The server accepts a wrapped key for a member only if that member has none yet (first write wins), so a teammate cannot overwrite a key someone already holds. A member without K shows "Waiting for a teammate to share the workspace key" and polls every 5 s. To unwrap, the recipient derives the same key from `ECDH(my private, wrappedBy's public)`, with the wrapper's public key taken from the members list the server returns.

**Writing a note.** AES-GCM with K, random 12-byte IV, plaintext UTF-8, additional data `${workspace}|${contact}|${author}`. Sent as `{ciphertext, iv}`.

**Reading.** Fetch notes, decrypt each with K using AAD built from the workspace, the contact being viewed, and the note's author id as reported by the server. Failure (tampering, wrong key, moved note, changed author) shows "Could not decrypt this note" for that note. The AAD stops a note being moved to another conversation or workspace and stops it being attributed to a different user. Live updates arrive as `note.added` frames, which trigger a refetch.

## What the server can and cannot do

Cannot: read notes, recover K, forge a note that decrypts (it lacks K), edit a note undetected, or move a note to another conversation or author undetected.

Can: see all metadata, delete or withhold notes, replay or duplicate notes, refuse to serve keys, and substitute public keys (see attack 1).

## Attacks this scheme does NOT stop

1. **Public key substitution by the server.** Public keys are trusted as the server reports them; there is no out-of-band fingerprint or safety-number check. A malicious or compromised server can register a fake member with a key it controls, or replace a pending member's public key. A holder of K then wraps K for that key, and the server unwraps it and reads all notes from then on plus every existing note it holds. A member's own public key can be replaced by that member at any time, so a planted key is only noticed if someone compares keys outside the app, which this design does not ask anyone to do. The same trick works on a joiner: the server can answer a new member's key request with a workspace key it made up, wrapped by a key it controls, and the joiner has no way to tell it is not the real K, so that member's notes are readable by the server. An existing holder is only ever fooled this way: by the server handing over a substituted key.

2. **No forward secrecy, rotation or revocation.** K never changes. Someone removed from the workspace keeps K and any ciphertext they copied, and can read everything written under K, including future notes if they can still obtain ciphertext. A new member given K reads all old notes. A leaked device key or K compromises all notes, past and future.

3. **Dropping, withholding and replaying notes, and metadata.** Notes carry no signature and no sequence binding. The AAD prevents moving a note across conversations or authors but not deleting a note, hiding it from some readers, or duplicating a valid note within the same conversation; none of this is detectable. The server also sees who wrote each note, when, its length, and which contact it concerns.

Also out of scope: XSS in the web app can use the keys in the page (the private key is non-extractable, but the page can still ask the browser to use it, and K is in memory); and losing the browser profile (IndexedDB cleared, new device) loses the private key. Access is regained by registering a new public key (the server then drops the key that was wrapped for the old one) and having a teammate who holds K share it again.
# Switchboard

A shared team inbox. Customers write to a business through a messaging provider
(Pigeon), support agents sign in, see conversations arrive live, claim them,
reply, and leave private notes for each other. Several workspaces share one
deployment and never see each other's data.

Stack: Node 22, Express 5, TypeScript, MongoDB, Redis, `ws`. The web app is
React + Vite.

## Run it

You need Node 22+ and Docker.

`​``
npm run up                  # MongoDB, Redis, Pigeon, IdP, Paybox in Docker
npm run scaffold:install    # server and web dependencies
npm run scaffold:server     # API on http://localhost:4000
npm run scaffold:web        # web app on http://localhost:5173
`​``

Open http://localhost:5173. Settings come from the environment; the defaults
match the local Docker services, so no `.env` is needed. `.env.example` lists
every variable. `GRADER_TOKEN` must be set explicitly when `NODE_ENV=production`.

No Docker: `npm run mocks` starts the simulators with plain Node, and
`MONGO_URL` / `REDIS_URL` can point at any MongoDB and Redis.

## Using the app

Customers are simulated by Pigeon. To make one write to you:

`​``
npm run inbound
`​``

**1. Sign in.** The app opens on a sign-in page.

![Sign in](docs/screenshots/01-sign-in.png)

**2. Pick a test user.** The identity provider is a mock, so there are no
passwords: click a user. Ben Ortiz is an agent in `ws_acme`; Eli Novak belongs
to two workspaces and gets a workspace switcher.

![Identity provider](docs/screenshots/02-identity-provider.png)

**3. The inbox.** Conversations are listed with the newest activity first.
Use the Open, Closed and Mine tabs to filter. Each row shows the last message
and who holds the conversation.

![Inbox](docs/screenshots/03-inbox.png)

**4. Read a conversation.** Click a row. Customer messages are on the left, in
the order they were sent.

![Conversation](docs/screenshots/04-conversation.png)

**5. Claim it and reply.** Claim puts your name on the conversation; nobody else
can claim it until you release it. Type a reply and press Enter. The message
shows its status as it goes: queued, sent, delivered (or failed).

![Claim and reply](docs/screenshots/05-claim-and-reply.png)

**6. Leave a private note.** Click the lock icon in the conversation header to
open the side panel and add a note. Notes are encrypted in the browser, so the
server stores text it cannot read. See `PROTOCOL.md`.

![Private note](docs/screenshots/06-private-note.png)

**7. Watch it update live.** When a customer writes, the list and the open
conversation update without a refresh. If the connection drops, the app
reconnects and catches up on what it missed.

![Live update](docs/screenshots/07-live-update.png)

**8. Close a conversation.** Closed conversations move to the Closed tab. A new
message from the customer reopens them.

![Closed tab](docs/screenshots/08-closed-tab.png)

**9. Conversation details.** The info icon opens a panel with the number, owner,
status and how many messages there are.

![Details panel](docs/screenshots/09-details-panel.png)

**10. On a phone.** Below 640 px the list and the conversation take turns on the
screen, with a Back button.

![Mobile list](docs/screenshots/10-mobile-list.png) ![Mobile conversation](docs/screenshots/11-mobile-thread.png)

## Check and tests

`​``
npm run check               # level 1, about 90 s
npm run check:full          # levels 1, 2, 3 and 5, about 4 min, writes CHECK_REPORT.json
npm run check -- --levels 5
npm --prefix scaffold/server test    # 41 unit and integration tests (needs MongoDB and Redis)
`​``

The check starts the server itself (see `switchboard.json`), so stop your dev
server first. It wipes application data. The tests use a separate database
(`switchboard_test`).

`CHECK_REPORT.json` is the result of the last full run: 75 of 75 on levels 1, 2,
3 and 5. Level 4 (the written rules) is not part of the local check.

## How it is put together

`​``
Pigeon --webhook--> POST /webhooks/pigeon --> MongoDB (messages, frames)
                                                  |
                          Redis pub/sub  <--------+
                                |
browser <--WebSocket /ws--------+

agent reply --> outbox (MongoDB) --> sender loop --> Pigeon /v1/messages
`​``

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
- **Login** (`lib/oidc.ts`, `routes/auth.ts`): authorization code with PKCE,
  the id_token is checked against the IdP's keys, the session lives in Redis.
  Every API call and the WebSocket check workspace membership.
- **Private notes** (`routes/notes.ts`, `scaffold/web/src/crypto.ts`): keys are
  made and used in the browser only; the server stores ciphertext.

## Layout

`​``
scaffold/server/src
  index.ts            wiring, health, shutdown
  config.ts           environment
  db.ts               collections and indexes
  ws.ts               WebSocket server
  routes/             webhook, auth, api, notes, grader (check endpoints)
  lib/                signature, frames, inbound, outbox, ratelimit,
                      conversations, oidc, session, cookies
scaffold/server/test  tests
scaffold/web/src      React app (components/, crypto.ts, keyring.ts, useSocket.ts)
harness/              the check (given)
pigeon/ idp/ paybox/  simulators (given)
docs/screenshots      images used above
`​``

`DECISIONS.md` has what was cut and what is still wrong. `PROTOCOL.md` describes
the notes encryption.
```


---

## assistant  
2026-11-25T13:53:59.529Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; for f in config.ts db.ts redis.ts ws.ts lib/conversations.ts lib/cookies.ts lib/frames.ts lib/inbound.ts; do echo \"=== $f\"; cat -n $f; done"
}
```


---

## user  
2026-11-25T13:53:59.788Z

**tool result**

```
=== config.ts
     1	import { randomBytes } from 'node:crypto';
     2	
     3	try {
     4	  process.loadEnvFile(new URL('../../../.env', import.meta.url));
     5	} catch {
     6	  // no .env, defaults apply
     7	}
     8	
     9	const env = (name: string, fallback: string) => process.env[name] ?? fallback;
    10	
    11	if (process.env.NODE_ENV === 'production' && !process.env.GRADER_TOKEN) {
    12	  throw new Error('GRADER_TOKEN must be set in production');
    13	}
    14	
    15	const apiKeys: Record<string, string> = {
    16	  ws_acme: env('PIGEON_KEY_WS_ACME', 'pk_acme_7d1f0a'),
    17	  ws_globex: env('PIGEON_KEY_WS_GLOBEX', 'pk_globex_c93b22'),
    18	};
    19	
    20	export const config = {
    21	  port: Number(env('PORT', '4000')),
    22	  webOrigin: env('WEB_ORIGIN', 'http://localhost:5173'),
    23	  // without GRADER_TOKEN the check endpoints are unreachable instead of open to a known default
    24	  graderToken: process.env.GRADER_TOKEN ?? randomBytes(24).toString('hex'),
    25	  mongoUrl: env('MONGO_URL', 'mongodb://localhost:27017/switchboard'),
    26	  redisUrl: env('REDIS_URL', 'redis://localhost:6379'),
    27	  elasticsearchUrl: env('ELASTICSEARCH_URL', 'http://localhost:9200'),
    28	  workspaces: Object.keys(apiKeys),
    29	  pigeon: {
    30	    url: env('PIGEON_URL', 'http://localhost:4010'),
    31	    webhookSecret: env('PIGEON_WEBHOOK_SECRET', 'whsec_pigeon_dev'),
    32	    apiKeys,
    33	  },
    34	  oidc: {
    35	    issuer: env('OIDC_ISSUER', 'http://localhost:4020'),
    36	    clientId: env('OIDC_CLIENT_ID', 'switchboard-web'),
    37	    clientSecret: env('OIDC_CLIENT_SECRET', 'dev-secret-not-for-production'),
    38	    redirectUri: env('OIDC_REDIRECT_URI', 'http://localhost:4000/auth/callback'),
    39	  },
    40	  paybox: {
    41	    url: env('PAYBOX_URL', 'http://localhost:4030'),
    42	    secretKey: env('PAYBOX_SECRET_KEY', 'sk_test_paybox_51c0de'),
    43	    publishableKey: env('PAYBOX_PUBLISHABLE_KEY', 'pk_test_paybox_9a7b3e'),
    44	    webhookSecret: env('PAYBOX_WEBHOOK_SECRET', 'whsec_paybox_dev'),
    45	  },
    46	  sessionTtlSec: 8 * 3600,
    47	  leaseMs: 20_000,
    48	  sendTimeoutMs: 6_000,
    49	};
    50	
    51	export const isWorkspace = (id: unknown): id is string =>
    52	  typeof id === 'string' && Object.prototype.hasOwnProperty.call(apiKeys, id);
=== db.ts
     1	import { MongoClient, type Db } from 'mongodb';
     2	import { config } from './config.js';
     3	
     4	export type Msg = {
     5	  ws: string;
     6	  contact: string;
     7	  messageId: string;
     8	  text: string;
     9	  occurredAt: Date;
    10	  receivedAt: Date;
    11	};
    12	
    13	export type Conv = {
    14	  ws: string;
    15	  contact: string;
    16	  assignee: string | null;
    17	  status: 'open' | 'closed';
    18	  v?: number;
    19	  lastActivityAt: Date;
    20	  preview?: string;
    21	  createdAt: Date;
    22	};
    23	
    24	export type OutStatus = 'queued' | 'sent' | 'delivered' | 'failed';
    25	
    26	export type Out = {
    27	  ws: string;
    28	  contact: string;
    29	  clientRef: string;
    30	  text: string;
    31	  sender: string;
    32	  status: OutStatus;
    33	  rank: number;
    34	  createdAt: Date;
    35	  attempts: number;
    36	  nextAttemptAt: Date;
    37	  lockedUntil: Date;
    38	  sendDone: boolean;
    39	  pigeonId?: string;
    40	};
    41	
    42	export type FrameDoc = {
    43	  ws: string;
    44	  seq: number;
    45	  key: string;
    46	  frame: Record<string, unknown>;
    47	  createdAt: Date;
    48	};
    49	
    50	export type Note = {
    51	  ws: string;
    52	  contact: string;
    53	  author: string;
    54	  ciphertext: string;
    55	  iv: string;
    56	  createdAt: Date;
    57	};
    58	
    59	export type KeyDoc = {
    60	  ws: string;
    61	  sub: string;
    62	  publicKey: string;
    63	  wrappedKey?: string;
    64	  wrappedBy?: string;
    65	};
    66	
    67	export type Person = { ws: string; sub: string; name: string; email?: string };
    68	
    69	export type Keyring = { ws: string; creator: string; createdAt: Date };
    70	
    71	let connecting: Promise<Db> | undefined;
    72	
    73	export function getDb(): Promise<Db> {
    74	  connecting ??= new MongoClient(config.mongoUrl).connect().then((c) => c.db());
    75	  return connecting;
    76	}
    77	
    78	export async function cols() {
    79	  const d = await getDb();
    80	  return {
    81	    messages: d.collection<Msg>('messages'),
    82	    convs: d.collection<Conv>('conversations'),
    83	    outbox: d.collection<Out>('outbox'),
    84	    frames: d.collection<FrameDoc>('frames'),
    85	    notes: d.collection<Note>('notes'),
    86	    keys: d.collection<KeyDoc>('keys'),
    87	    keyring: d.collection<Keyring>('keyring'),
    88	    people: d.collection<Person>('people'),
    89	  };
    90	}
    91	
    92	export type Cols = Awaited<ReturnType<typeof cols>>;
    93	
    94	export async function ensureIndexes() {
    95	  const c = await cols();
    96	  await Promise.all([
    97	    c.messages.createIndex({ ws: 1, messageId: 1 }, { unique: true }),
    98	    c.messages.createIndex({ ws: 1, contact: 1, occurredAt: 1 }),
    99	    c.convs.createIndex({ ws: 1, contact: 1 }, { unique: true }),
   100	    c.convs.createIndex({ ws: 1, lastActivityAt: -1, _id: -1 }),
   101	    c.outbox.createIndex({ ws: 1, clientRef: 1 }, { unique: true }),
   102	    c.outbox.createIndex({ sendDone: 1, ws: 1, nextAttemptAt: 1 }),
   103	    c.outbox.createIndex({ ws: 1, contact: 1, createdAt: 1 }),
   104	    c.frames.createIndex({ ws: 1, seq: 1 }, { unique: true }),
   105	    c.frames.createIndex({ ws: 1, key: 1 }, { unique: true }),
   106	    c.notes.createIndex({ ws: 1, contact: 1, createdAt: 1 }),
   107	    c.keys.createIndex({ ws: 1, sub: 1 }, { unique: true }),
   108	    c.keyring.createIndex({ ws: 1 }, { unique: true }),
   109	    c.people.createIndex({ ws: 1, sub: 1 }, { unique: true }),
   110	  ]);
   111	}
   112	
   113	export const isDup = (e: unknown) => (e as { code?: number })?.code === 11000;
=== redis.ts
     1	import { Redis } from 'ioredis';
     2	import { config } from './config.js';
     3	
     4	let redis: Redis | undefined;
     5	
     6	// Connects on first use. Call from anywhere: const redis = getRedis();
     7	export function getRedis(): Redis {
     8	  if (!redis) redis = new Redis(config.redisUrl, { lazyConnect: false, maxRetriesPerRequest: 2 });
     9	  return redis;
    10	}
=== ws.ts
     1	import type { Server } from 'node:http';
     2	import type { Duplex } from 'node:stream';
     3	import { WebSocketServer, type WebSocket } from 'ws';
     4	import { config, isWorkspace } from './config.js';
     5	import { getRedis } from './redis.js';
     6	import { channel, framesAfter, lastSeq } from './lib/frames.js';
     7	import { roleIn, sessionFromCookie } from './lib/session.js';
     8	
     9	type Client = { socket: WebSocket; ws: string; sent: number; busy: boolean; again: boolean };
    10	
    11	const clients = new Set<Client>();
    12	
    13	async function flush(c: Client) {
    14	  if (c.busy) {
    15	    c.again = true;
    16	    return;
    17	  }
    18	  c.busy = true;
    19	  try {
    20	    do {
    21	      c.again = false;
    22	      while (c.socket.readyState === c.socket.OPEN) {
    23	        const batch = await framesAfter(c.ws, c.sent);
    24	        if (!batch.length) break;
    25	        for (const f of batch) c.socket.send(JSON.stringify(f));
    26	        c.sent = batch[batch.length - 1].seq;
    27	      }
    28	    } while (c.again);
    29	  } catch (e) {
    30	    console.error('ws flush failed', e);
    31	  } finally {
    32	    c.busy = false;
    33	  }
    34	}
    35	
    36	const reject = (socket: Duplex, line: string) => {
    37	  socket.write(`HTTP/1.1 ${line}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    38	  socket.destroy();
    39	};
    40	
    41	export function attachWebSocket(server: Server) {
    42	  const wss = new WebSocketServer({ noServer: true });
    43	
    44	  const sub = getRedis().duplicate();
    45	  sub.subscribe(...config.workspaces.map(channel)).catch((e) => console.error('subscribe failed', e));
    46	  sub.on('message', (chan) => {
    47	    for (const c of clients) if (channel(c.ws) === chan) void flush(c);
    48	  });
    49	
    50	  // a missed pub/sub message must not leave a client behind
    51	  const timer = setInterval(() => clients.forEach((c) => void flush(c)), 2000);
    52	  timer.unref();
    53	
    54	  server.on('upgrade', async (req, socket, head) => {
    55	    try {
    56	      const url = new URL(req.url ?? '', 'http://x');
    57	      if (url.pathname !== '/ws') return reject(socket, '404 Not Found');
    58	      const origin = req.headers.origin;
    59	      if (origin && origin !== config.webOrigin && origin !== `http://${req.headers.host}`) return reject(socket, '403 Forbidden');
    60	      const session = await sessionFromCookie(req.headers.cookie);
    61	      if (!session) return reject(socket, '401 Unauthorized');
    62	      const ws = url.searchParams.get('workspace');
    63	      if (!isWorkspace(ws) || !roleIn(session, ws)) return reject(socket, '403 Forbidden');
    64	
    65	      const afterParam = url.searchParams.get('after');
    66	      const newest = await lastSeq(ws);
    67	      const after = afterParam !== null && /^\d+$/.test(afterParam) ? Math.min(Number(afterParam), newest) : newest;
    68	
    69	      wss.handleUpgrade(req, socket, head, (socket) => {
    70	        const client: Client = { socket, ws, sent: after, busy: false, again: false };
    71	        clients.add(client);
    72	        socket.on('close', () => clients.delete(client));
    73	        socket.on('error', () => clients.delete(client));
    74	        void flush(client);
    75	      });
    76	    } catch (e) {
    77	      console.error('ws upgrade failed', e);
    78	      reject(socket, '500 Internal Server Error');
    79	    }
    80	  });
    81	}
=== lib/conversations.ts
     1	import { cols, isDup } from '../db.js';
     2	import { addFrame } from './frames.js';
     3	
     4	export async function touchConversation(ws: string, contact: string, at: Date, preview: string, reopen: boolean) {
     5	  const { convs } = await cols();
     6	  const run = () =>
     7	    convs.updateOne(
     8	      { ws, contact },
     9	      {
    10	        $setOnInsert: { assignee: null, status: 'open', createdAt: new Date() },
    11	        $max: { lastActivityAt: at },
    12	      },
    13	      { upsert: true },
    14	    );
    15	  try {
    16	    await run();
    17	  } catch (e) {
    18	    if (!isDup(e)) throw e;
    19	    await run();
    20	  }
    21	  await convs.updateOne({ ws, contact, lastActivityAt: { $lte: at } }, { $set: { preview: preview.slice(0, 140) } });
    22	  if (reopen) await convs.updateOne({ ws, contact, status: 'closed' }, { $set: { status: 'open' } });
    23	}
    24	
    25	export type ClaimResult = 'claimed' | 'already' | 'taken';
    26	
    27	// v counts assignment/status changes; frame keys use it so re-emitting after a crash is a no-op
    28	async function emitAssigned(ws: string, contact: string) {
    29	  const { convs } = await cols();
    30	  const c = await convs.findOne({ ws, contact });
    31	  if (c) await addFrame(ws, `assign:${contact}:${c.v ?? 0}`, { type: 'conversation.assigned', contact, assignee: c.assignee });
    32	}
    33	
    34	export async function claim(ws: string, contact: string, agent: string): Promise<ClaimResult> {
    35	  const { convs } = await cols();
    36	  const filter = { ws, contact, $or: [{ assignee: null }, { assignee: agent }] };
    37	  const before = await convs.findOne({ ws, contact }, { projection: { assignee: 1 } });
    38	  if (before?.assignee === agent) {
    39	    await emitAssigned(ws, contact);
    40	    return 'already';
    41	  }
    42	
    43	  const update = {
    44	    $set: { assignee: agent },
    45	    $inc: { v: 1 },
    46	    $setOnInsert: { status: 'open' as const, createdAt: new Date(), lastActivityAt: new Date() },
    47	  };
    48	  let res;
    49	  try {
    50	    res = await convs.updateOne(filter, update, { upsert: true });
    51	  } catch (e) {
    52	    if (!isDup(e)) throw e;
    53	    // someone created the row first; retry as a plain update
    54	    res = await convs.updateOne(filter, { $set: { assignee: agent }, $inc: { v: 1 } });
    55	  }
    56	  if (!res.matchedCount && !res.upsertedCount) return 'taken';
    57	  await emitAssigned(ws, contact);
    58	  return 'claimed';
    59	}
    60	
    61	export async function release(ws: string, contact: string, agent: string, force: boolean): Promise<boolean> {
    62	  const { convs } = await cols();
    63	  const filter = force ? { ws, contact, assignee: { $ne: null } } : { ws, contact, assignee: agent };
    64	  const res = await convs.updateOne(filter, { $set: { assignee: null }, $inc: { v: 1 } });
    65	  if (!res.modifiedCount) return false;
    66	  await emitAssigned(ws, contact);
    67	  return true;
    68	}
    69	
    70	export async function setStatus(ws: string, contact: string, status: 'open' | 'closed'): Promise<boolean> {
    71	  const { convs } = await cols();
    72	  const res = await convs.updateOne({ ws, contact, status: status === 'open' ? 'closed' : 'open' }, { $set: { status }, $inc: { v: 1 } });
    73	  if (!res.modifiedCount) return false;
    74	  const c = await convs.findOne({ ws, contact });
    75	  if (c) await addFrame(ws, `status:${contact}:${c.v ?? 0}`, { type: 'conversation.status', contact, status: c.status });
    76	  return true;
    77	}
=== lib/cookies.ts
     1	import type { Response } from 'express';
     2	
     3	export function parseCookies(header: string | undefined): Record<string, string> {
     4	  const out: Record<string, string> = {};
     5	  for (const part of (header ?? '').split(';')) {
     6	    const i = part.indexOf('=');
     7	    if (i < 0) continue;
     8	    const raw = part.slice(i + 1).trim();
     9	    try {
    10	      out[part.slice(0, i).trim()] = decodeURIComponent(raw);
    11	    } catch {
    12	      out[part.slice(0, i).trim()] = raw;
    13	    }
    14	  }
    15	  return out;
    16	}
    17	
    18	export function setCookie(res: Response, name: string, value: string, maxAgeSec: number, secure: boolean) {
    19	  res.cookie(name, value, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: maxAgeSec * 1000, secure });
    20	}
=== lib/frames.ts
     1	import { randomUUID } from 'node:crypto';
     2	import { cols, isDup } from '../db.js';
     3	import { getRedis } from '../redis.js';
     4	
     5	export const channel = (ws: string) => `sb:frames:${ws}`;
     6	// lock ttl is short on purpose, the unique (ws, seq) index is what really protects us
     7	const lockKey = (ws: string) => `sb:lock:frames:${ws}`;
     8	
     9	const UNLOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;
    10	
    11	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    12	
    13	async function withLock<T>(ws: string, fn: () => Promise<T>): Promise<T> {
    14	  const redis = getRedis();
    15	  const token = randomUUID();
    16	  const until = Date.now() + 4000;
    17	  while (true) {
    18	    const got = await redis.set(lockKey(ws), token, 'PX', 3000, 'NX');
    19	    if (got) break;
    20	    if (Date.now() > until) throw new Error('frame lock timeout');
    21	    await sleep(4 + Math.random() * 10);
    22	  }
    23	  try {
    24	    return await fn();
    25	  } finally {
    26	    await redis.eval(UNLOCK, 1, lockKey(ws), token).catch(() => null);
    27	  }
    28	}
    29	
    30	// Frames get their seq while holding a per-workspace lock, so they are
    31	// committed in seq order and a reader never skips one. `key` makes the write
    32	// idempotent: the same event arriving twice creates one frame.
    33	export async function addFrame(ws: string, key: string, frame: Record<string, unknown>): Promise<void> {
    34	  const { frames } = await cols();
    35	  if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return;
    36	  let seq = 0;
    37	  for (let attempt = 0; attempt < 5 && !seq; attempt++) {
    38	    seq = await withLock(ws, async () => {
    39	      if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return -1;
    40	      const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
    41	      const next = (last?.seq ?? 0) + 1;
    42	      try {
    43	        await frames.insertOne({ ws, seq: next, key, frame, createdAt: new Date() });
    44	        return next;
    45	      } catch (e) {
    46	        if (isDup(e)) return 0;
    47	        throw e;
    48	      }
    49	    });
    50	  }
    51	  // out of attempts: fail the request so the caller retries instead of losing the frame
    52	  if (!seq) throw new Error('could not allocate a seq');
    53	  if (seq > 0) await getRedis().publish(channel(ws), String(seq)).catch(() => null);
    54	}
    55	
    56	export async function framesAfter(ws: string, after: number, limit = 500) {
    57	  const { frames } = await cols();
    58	  const docs = await frames.find({ ws, seq: { $gt: after } }).sort({ seq: 1 }).limit(limit).toArray();
    59	  return docs.map((d) => ({ seq: d.seq, ...d.frame }));
    60	}
    61	
    62	export async function lastSeq(ws: string): Promise<number> {
    63	  const { frames } = await cols();
    64	  const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
    65	  return last?.seq ?? 0;
    66	}
=== lib/inbound.ts
     1	import { cols, isDup, type OutStatus } from '../db.js';
     2	import { addFrame } from './frames.js';
     3	import { touchConversation } from './conversations.js';
     4	
     5	export const RANK: Record<OutStatus, number> = { queued: 0, sent: 1, delivered: 2, failed: 2 };
     6	const isStatus = (s: unknown): s is OutStatus => typeof s === 'string' && s in RANK && s !== 'queued';
     7	
     8	export async function storeInbound(ws: string, d: { message_id: string; from: string; text: string }, occurredAt: Date) {
     9	  const { messages } = await cols();
    10	  let fresh = false;
    11	  try {
    12	    const res = await messages.updateOne(
    13	      { ws, messageId: d.message_id },
    14	      { $setOnInsert: { ws, contact: d.from, messageId: d.message_id, text: d.text, occurredAt, receivedAt: new Date() } },
    15	      { upsert: true },
    16	    );
    17	    fresh = res.upsertedCount === 1;
    18	  } catch (e) {
    19	    if (!isDup(e)) throw e;
    20	  }
    21	  await touchConversation(ws, d.from, occurredAt, d.text, fresh);
    22	  await addFrame(ws, `in:${d.message_id}`, {
    23	    type: 'message.inbound',
    24	    contact: d.from,
    25	    message_id: d.message_id,
    26	    text: d.text,
    27	    occurred_at: occurredAt.toISOString(),
    28	  });
    29	}
    30	
    31	export async function storeStatus(ws: string, d: { message_id?: string; client_ref: string; status: string }) {
    32	  if (!isStatus(d.status)) return;
    33	  const { outbox } = await cols();
    34	  const doc = await outbox.findOne({ ws, clientRef: d.client_ref });
    35	  if (!doc) return;
    36	  const rank = RANK[d.status];
    37	  await outbox.updateOne(
    38	    { ws, clientRef: d.client_ref, rank: { $lt: rank } },
    39	    { $set: { status: d.status, rank, sendDone: true, ...(d.message_id ? { pigeonId: d.message_id } : {}) } },
    40	  );
    41	  const now = await outbox.findOne({ ws, clientRef: d.client_ref });
    42	  if (now?.status !== d.status) return;
    43	  await addFrame(ws, `st:${d.client_ref}:${d.status}`, {
    44	    type: 'message.status',
    45	    contact: doc.contact,
    46	    client_ref: d.client_ref,
    47	    status: d.status,
    48	  });
    49	}
```


---

## assistant  
2026-11-25T13:54:01.330Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; for f in lib/oidc.ts lib/outbox.ts lib/ratelimit.ts lib/session.ts lib/signature.ts routes/*.ts; do echo \"=== $f\"; cat -n $f; done"
}
```


---

## user  
2026-11-25T13:54:01.583Z

**tool result**

```
<persisted-output>
Output too large (37.8KB). Full output saved to: /Users/apple/.claude/projects/-Users-apple-Desktop-repo-new/1a768465-323a-4dbe-8328-9a2acfe3acc6/tool-results/b58x8jz37.txt

Preview (first 2KB):
=== lib/oidc.ts
     1	import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';
     2	import { config } from '../config.js';
     3	import type { Membership } from './session.js';
     4	
     5	type Discovery = { issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string };
     6	let discovery: { at: number; doc: Discovery } | undefined;
     7	let jwks: { at: number; keys: any[] } | undefined;
     8	
     9	const getJson = async (url: string) => {
    10	  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    11	  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    12	  return res.json();
    13	};
    14	
    15	async function getDiscovery(): Promise<Discovery> {
    16	  if (!discovery || Date.now() - discovery.at > 10 * 60_000) {
    17	    discovery = { at: Date.now(), doc: await getJson(`${config.oidc.issuer}/.well-known/openid-configuration`) };
    18	  }
    19	  return discovery.doc;
    20	}
    21	
    22	async function getKeys(force = false) {
    23	  if (force || !jwks || Date.now() - jwks.at > 10 * 60_000) {
    24	    const d = await getDiscovery();
    25	    jwks = { at: Date.now(), keys: (await getJson(d.jwks_uri)).keys ?? [] };
    26	  }
    27	  return jwks.keys;
    28	}
    29	
    30	export const pkce = () => {
    31	  const verifier = randomBytes(32).toString('base64url');
    32	  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
    33	};
    34	
    35	export async function authorizeUrl(state: string, nonce: string, challenge: string) {
    36	  const d = await getDiscovery();
    37	  const u = new URL(d.authorization_endpoint);
    38	  u.search = new URLSearchParams({
    39	    response_type: 'code',
    40	    client_id: config.oidc.clientId,
    41	    redirect_uri: config.oidc.redirectUri,
    42	    scope: 'openid profile email',
    43	    state,
    44	    nonce,
...
</persisted-output>
```


---

## assistant  
2026-11-25T13:54:04.082Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; sed -n 44,96p lib/oidc.ts | cat -n | sed 's/^ *\\([0-9]*\\)/\\1+43/' >/dev/null; awk 'NR>=44{print NR\": \"$0}' lib/oidc.ts; for f in lib/outbox.ts lib/ratelimit.ts lib/session.ts lib/signature.ts; do echo \"=== $f\"; cat -n $f; done"
}
```


---

## user  
2026-11-25T13:54:04.265Z

**tool result**

```
44:     nonce,
45:     code_challenge: challenge,
46:     code_challenge_method: 'S256',
47:   }).toString();
48:   return u.toString();
49: }
50: 
51: export type Identity = { sub: string; name?: string; email?: string; workspaces: Membership[] };
52: 
53: export async function exchange(code: string, verifier: string, nonce: string): Promise<Identity> {
54:   const d = await getDiscovery();
55:   const res = await fetch(d.token_endpoint, {
56:     method: 'POST',
57:     headers: { 'content-type': 'application/x-www-form-urlencoded' },
58:     body: new URLSearchParams({
59:       grant_type: 'authorization_code',
60:       code,
61:       redirect_uri: config.oidc.redirectUri,
62:       client_id: config.oidc.clientId,
63:       client_secret: config.oidc.clientSecret,
64:       code_verifier: verifier,
65:     }),
66:     signal: AbortSignal.timeout(5000),
67:   });
68:   if (!res.ok) throw new Error(`token endpoint answered ${res.status}`);
69:   const { id_token } = (await res.json()) as { id_token?: string };
70:   if (!id_token) throw new Error('no id_token');
71:   return verifyIdToken(id_token, d.issuer, nonce);
72: }
73: 
74: async function verifyIdToken(token: string, issuer: string, nonce: string): Promise<Identity> {
75:   const [h, p, s] = token.split('.');
76:   if (!h || !p || !s) throw new Error('malformed id_token');
77:   const header = JSON.parse(Buffer.from(h, 'base64url').toString());
78:   if (header.alg !== 'RS256') throw new Error('unexpected alg');
79:   let jwk = (await getKeys()).find((k) => k.kid === header.kid);
80:   if (!jwk) jwk = (await getKeys(true)).find((k) => k.kid === header.kid);
81:   if (!jwk) throw new Error('unknown signing key');
82:   const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'));
83:   if (!ok) throw new Error('bad id_token signature');
84: 
85:   const c = JSON.parse(Buffer.from(p, 'base64url').toString());
86:   const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
87:   if (c.iss !== issuer || !aud.includes(config.oidc.clientId)) throw new Error('wrong issuer or audience');
88:   if (typeof c.exp !== 'number' || c.exp * 1000 < Date.now()) throw new Error('id_token expired');
89:   if (c.nonce !== nonce) throw new Error('nonce mismatch');
90:   if (typeof c.sub !== 'string' || !c.sub) throw new Error('no sub');
91: 
92:   const workspaces: Membership[] = (Array.isArray(c.workspaces) ? c.workspaces : [])
93:     .filter((w: any) => w && typeof w.id === 'string' && (w.role === 'admin' || w.role === 'agent'))
94:     .map((w: any) => ({ id: w.id, role: w.role }));
95:   return { sub: c.sub, name: c.name, email: c.email, workspaces };
96: }
=== lib/outbox.ts
     1	import type { WithId } from 'mongodb';
     2	import { cols, isDup, type Out } from '../db.js';
     3	import { config } from '../config.js';
     4	import { addFrame } from './frames.js';
     5	import { touchConversation } from './conversations.js';
     6	import { acquire, refund, pause } from './ratelimit.js';
     7	import { RANK } from './inbound.js';
     8	
     9	export async function createReply(ws: string, contact: string, text: string, clientRef: string, sender: string) {
    10	  const { outbox } = await cols();
    11	  const now = new Date();
    12	  const doc: Out = {
    13	    ws,
    14	    contact,
    15	    clientRef,
    16	    text,
    17	    sender,
    18	    status: 'queued',
    19	    rank: 0,
    20	    createdAt: now,
    21	    attempts: 0,
    22	    nextAttemptAt: now,
    23	    lockedUntil: new Date(0),
    24	    sendDone: false,
    25	  };
    26	  try {
    27	    await outbox.insertOne(doc);
    28	  } catch (e) {
    29	    if (!isDup(e)) throw e;
    30	  }
    31	  // every step below is idempotent, so a repeated request finishes whatever a crashed one left undone
    32	  const stored = (await outbox.findOne({ ws, clientRef })) ?? doc;
    33	  await touchConversation(ws, contact, stored.createdAt, text, false);
    34	  await addFrame(ws, `out:${clientRef}`, {
    35	    type: 'message.outbound',
    36	    contact,
    37	    client_ref: clientRef,
    38	    text: stored.text,
    39	    sender: stored.sender,
    40	    status: 'queued',
    41	  });
    42	}
    43	
    44	const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    45	const MAX_INFLIGHT = 4;
    46	const inflight = new Map<string, number>();
    47	
    48	async function attempt(doc: WithId<Out>) {
    49	  const { outbox } = await cols();
    50	  const back = (ms: number) =>
    51	    outbox.updateOne({ _id: doc._id }, { $set: { lockedUntil: new Date(0), nextAttemptAt: new Date(Date.now() + ms) } });
    52	  const retryLater = () => back(Math.min(500 * 2 ** Math.min(doc.attempts, 4), 8000) + Math.random() * 300);
    53	
    54	  let res: Response;
    55	  try {
    56	    res = await fetch(`${config.pigeon.url}/v1/messages`, {
    57	      method: 'POST',
    58	      headers: {
    59	        'content-type': 'application/json',
    60	        authorization: `Bearer ${config.pigeon.apiKeys[doc.ws]}`,
    61	        'idempotency-key': doc.clientRef,
    62	      },
    63	      body: JSON.stringify({ to: doc.contact, text: doc.text, client_ref: doc.clientRef }),
    64	      signal: AbortSignal.timeout(config.sendTimeoutMs),
    65	    });
    66	  } catch {
    67	    await pause(doc.ws, 800);
    68	    return retryLater();
    69	  }
    70	
    71	  if (res.ok) {
    72	    const out = (await res.json().catch(() => ({}))) as { id?: string };
    73	    await outbox.updateOne({ _id: doc._id }, { $set: { sendDone: true, lockedUntil: new Date(0), ...(out.id ? { pigeonId: out.id } : {}) } });
    74	    return;
    75	  }
    76	  if (res.status === 429) {
    77	    const wait = Number(res.headers.get('retry-after')) || 2;
    78	    await pause(doc.ws, wait * 1000 + 250);
    79	    return back(wait * 1000 + 250);
    80	  }
    81	  if (res.status >= 500 || res.status === 408 || (res.status >= 300 && res.status < 400)) {
    82	    await pause(doc.ws, 1000);
    83	    return retryLater();
    84	  }
    85	  // other 4xx is probably final, but give a transient auth or conflict error a few tries
    86	  if (doc.attempts < 5) return retryLater();
    87	  await addFrame(doc.ws, `st:${doc.clientRef}:failed`, { type: 'message.status', contact: doc.contact, client_ref: doc.clientRef, status: 'failed' });
    88	  await outbox.updateOne(
    89	    { _id: doc._id, rank: { $lt: RANK.failed } },
    90	    { $set: { status: 'failed', rank: RANK.failed, sendDone: true, lockedUntil: new Date(0) } },
    91	  );
    92	}
    93	
    94	async function tick(): Promise<boolean> {
    95	  const { outbox } = await cols();
    96	  let worked = false;
    97	  for (const ws of config.workspaces) {
    98	    if ((inflight.get(ws) ?? 0) >= MAX_INFLIGHT) continue;
    99	    const now = new Date();
   100	    const due = { sendDone: false, ws, nextAttemptAt: { $lte: now }, lockedUntil: { $lte: now } };
   101	    if (!(await outbox.findOne(due, { projection: { _id: 1 } }))) continue;
   102	    if (!(await acquire(ws))) continue;
   103	    const doc = await outbox.findOneAndUpdate(
   104	      due,
   105	      { $set: { lockedUntil: new Date(now.getTime() + config.leaseMs) }, $inc: { attempts: 1 } },
   106	      { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
   107	    );
   108	    if (!doc) {
   109	      await refund(ws);
   110	      continue;
   111	    }
   112	    worked = true;
   113	    inflight.set(ws, (inflight.get(ws) ?? 0) + 1);
   114	    attempt(doc)
   115	      .catch((e) => console.error('send attempt failed', e))
   116	      .finally(() => inflight.set(ws, (inflight.get(ws) ?? 1) - 1));
   117	  }
   118	  return worked;
   119	}
   120	
   121	let running = false;
   122	export function startSender() {
   123	  running = true;
   124	  (async () => {
   125	    while (running) {
   126	      let worked = false;
   127	      try {
   128	        worked = await tick();
   129	      } catch (e) {
   130	        console.error('sender tick', e);
   131	      }
   132	      await sleep(worked ? 15 : 200);
   133	    }
   134	  })();
   135	}
   136	export const stopSender = () => {
   137	  running = false;
   138	};
=== lib/ratelimit.ts
     1	import { getRedis } from '../redis.js';
     2	
     3	// Pigeon allows a burst of 8 and refills 4 a second per workspace. We stay a
     4	// little under that, and share the bucket between all copies through Redis.
     5	const CAP = 6;
     6	const RATE = 3.5;
     7	
     8	const bucket = (ws: string) => `sb:rl:${ws}`;
     9	const cool = (ws: string) => `sb:cool:${ws}`;
    10	
    11	const ACQUIRE = `
    12	if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
    13	local t = redis.call('TIME')
    14	local now = t[1] * 1000 + math.floor(t[2] / 1000)
    15	local d = redis.call('HMGET', KEYS[1], 'tokens', 'at')
    16	local tokens = tonumber(d[1])
    17	local at = tonumber(d[2])
    18	if not tokens then tokens = tonumber(ARGV[1]); at = now end
    19	tokens = math.min(tonumber(ARGV[1]), tokens + (now - at) / 1000 * tonumber(ARGV[2]))
    20	if tokens < 1 then
    21	  redis.call('HSET', KEYS[1], 'tokens', tokens, 'at', now)
    22	  return 0
    23	end
    24	redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'at', now)
    25	redis.call('PEXPIRE', KEYS[1], 60000)
    26	return 1
    27	`;
    28	
    29	const REFUND = `
    30	local d = redis.call('HMGET', KEYS[1], 'tokens')
    31	local tokens = tonumber(d[1])
    32	if not tokens then return 0 end
    33	redis.call('HSET', KEYS[1], 'tokens', math.min(tonumber(ARGV[1]), tokens + 1))
    34	return 1
    35	`;
    36	
    37	export async function acquire(ws: string): Promise<boolean> {
    38	  return (await getRedis().eval(ACQUIRE, 2, bucket(ws), cool(ws), CAP, RATE)) === 1;
    39	}
    40	
    41	export async function refund(ws: string): Promise<void> {
    42	  await getRedis().eval(REFUND, 1, bucket(ws), CAP);
    43	}
    44	
    45	const PAUSE = `
    46	if redis.call('PTTL', KEYS[1]) < tonumber(ARGV[1]) then redis.call('SET', KEYS[1], '1', 'PX', ARGV[1]) end
    47	return 1
    48	`;
    49	
    50	export async function pause(ws: string, ms: number): Promise<void> {
    51	  await getRedis().eval(PAUSE, 1, cool(ws), Math.max(1, Math.round(ms)));
    52	}
=== lib/session.ts
     1	import { randomBytes } from 'node:crypto';
     2	import { config } from '../config.js';
     3	import { getRedis } from '../redis.js';
     4	import { parseCookies } from './cookies.js';
     5	
     6	export type Membership = { id: string; role: 'admin' | 'agent' };
     7	export type Session = { sub: string; name?: string; email?: string; workspaces: Membership[] };
     8	
     9	export const SESSION_COOKIE = 'sb_sid';
    10	const key = (id: string) => `sb:sess:${id}`;
    11	
    12	export async function createSession(s: Session): Promise<string> {
    13	  const id = randomBytes(32).toString('hex');
    14	  await getRedis().set(key(id), JSON.stringify(s), 'EX', config.sessionTtlSec);
    15	  return id;
    16	}
    17	
    18	export async function destroySession(id: string) {
    19	  await getRedis().del(key(id));
    20	}
    21	
    22	export async function sessionFromCookie(header: string | undefined): Promise<Session | null> {
    23	  const id = parseCookies(header)[SESSION_COOKIE];
    24	  if (!id || !/^[0-9a-f]{64}$/.test(id)) return null;
    25	  const raw = await getRedis().get(key(id));
    26	  return raw ? (JSON.parse(raw) as Session) : null;
    27	}
    28	
    29	export const roleIn = (s: Session, ws: string) => s.workspaces.find((m) => m.id === ws)?.role ?? null;
=== lib/signature.ts
     1	import { createHmac, timingSafeEqual } from 'node:crypto';
     2	
     3	export type SigResult = 'ok' | 'bad' | 'stale';
     4	
     5	const TOLERANCE_SEC = 300;
     6	
     7	export function checkSignature(header: string | undefined, raw: Buffer, secret: string, nowSec = Date.now() / 1000): SigResult {
     8	  if (!header) return 'bad';
     9	  const parts = Object.fromEntries(
    10	    header.split(',').map((p) => {
    11	      const i = p.indexOf('=');
    12	      return i < 0 ? ['', ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    13	    }),
    14	  );
    15	  const t = parts.t;
    16	  const v1 = parts.v1;
    17	  if (!t || !/^\d{1,12}$/.test(t) || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return 'bad';
    18	  const expected = createHmac('sha256', secret).update(`${t}.`).update(raw).digest();
    19	  const given = Buffer.from(v1, 'hex');
    20	  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'bad';
    21	  return Math.abs(nowSec - Number(t)) > TOLERANCE_SEC ? 'stale' : 'ok';
    22	}
```


---

## assistant  
2026-11-25T13:54:05.963Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; for f in routes/*.ts; do echo \"=== $f\"; cat -n $f; done"
}
```


---

## user  
2026-11-25T13:54:06.405Z

**tool result**

```
=== routes/api.ts
     1	import { Router, json, type Request, type Response, type NextFunction } from 'express';
     2	import { randomUUID } from 'node:crypto';
     3	import { ObjectId } from 'mongodb';
     4	import { config, isWorkspace } from '../config.js';
     5	import { cols } from '../db.js';
     6	import { roleIn, sessionFromCookie, type Session } from '../lib/session.js';
     7	import { claim, release, setStatus } from '../lib/conversations.js';
     8	import { createReply } from '../lib/outbox.js';
     9	import { notes, validContact } from './notes.js';
    10	
    11	export const api = Router();
    12	
    13	
    14	declare module 'express-serve-static-core' {
    15	  interface Request {
    16	    session?: Session;
    17	  }
    18	}
    19	
    20	api.use('/api', json({ limit: '64kb' }));
    21	
    22	// cookie auth: refuse writes that come from some other site
    23	api.use('/api', (req: Request, res: Response, next: NextFunction) => {
    24	  if (req.method === 'GET' || req.method === 'HEAD') return next();
    25	  const origin = req.header('origin');
    26	  if (origin && origin !== config.webOrigin && origin !== `http://${req.header('host')}`) {
    27	    return res.status(403).json({ error: 'bad origin' });
    28	  }
    29	  next();
    30	});
    31	
    32	api.use('/api', async (req, res, next) => {
    33	  try {
    34	    const s = await sessionFromCookie(req.header('cookie'));
    35	    if (!s) return res.status(401).json({ error: 'not signed in' });
    36	    req.session = s;
    37	    next();
    38	  } catch (e) {
    39	    next(e);
    40	  }
    41	});
    42	
    43	api.use(notes);
    44	
    45	api.get('/api/me', (req, res) => {
    46	  const s = req.session!;
    47	  res.json({ sub: s.sub, name: s.name, email: s.email, workspaces: s.workspaces });
    48	});
    49	
    50	// resolves ?workspace= (or body.workspace) and checks membership
    51	function member(req: Request, res: Response): { ws: string; role: 'admin' | 'agent' } | null {
    52	  const ws = (req.query.workspace ?? req.body?.workspace) as unknown;
    53	  if (!isWorkspace(ws)) {
    54	    res.status(ws === undefined ? 400 : 403).json({ error: 'workspace required' });
    55	    return null;
    56	  }
    57	  const role = roleIn(req.session!, ws);
    58	  if (!role) {
    59	    res.status(403).json({ error: 'not a member of this workspace' });
    60	    return null;
    61	  }
    62	  return { ws, role };
    63	}
    64	
    65	const pageSize = (v: unknown) => Math.min(Math.max(Number(v) || 30, 1), 100);
    66	
    67	// display names for the people in a workspace, so the UI can show "Ben Ortiz" instead of an id
    68	api.get('/api/workspaces/:ws/people', async (req, res) => {
    69	  const ws = req.params.ws;
    70	  if (!isWorkspace(ws) || !roleIn(req.session!, ws)) return res.status(403).json({ error: 'not a member of this workspace' });
    71	  const { people } = await cols();
    72	  const me = req.session!;
    73	  const list = (await people.find({ ws }).toArray()).map((p) => ({ sub: p.sub, name: p.name }));
    74	  if (!list.some((p) => p.sub === me.sub)) list.push({ sub: me.sub, name: me.name || me.email || me.sub });
    75	  res.json({ people: list });
    76	});
    77	
    78	api.get('/api/conversations', async (req, res) => {
    79	  const m = member(req, res);
    80	  if (!m) return;
    81	  const { convs } = await cols();
    82	  const filter: Record<string, unknown> = { ws: m.ws };
    83	  if (req.query.status === 'open' || req.query.status === 'closed') filter.status = req.query.status;
    84	  if (req.query.assignee === 'me') filter.assignee = req.session!.sub;
    85	
    86	  const limit = pageSize(req.query.limit);
    87	  const before = typeof req.query.before === 'string' ? req.query.before.split('_') : null;
    88	  if (before && before.length === 2 && !Number.isNaN(Number(before[0])) && ObjectId.isValid(before[1])) {
    89	    const t = new Date(Number(before[0]));
    90	    filter.$or = [{ lastActivityAt: { $lt: t } }, { lastActivityAt: t, _id: { $lt: new ObjectId(before[1]) } }];
    91	  }
    92	  const rows = await convs.find(filter as any).sort({ lastActivityAt: -1, _id: -1 }).limit(limit + 1).toArray();
    93	  const page = rows.slice(0, limit);
    94	  const last = page[page.length - 1];
    95	  res.json({
    96	    conversations: page.map((c) => ({
    97	      contact: c.contact,
    98	      assignee: c.assignee,
    99	      status: c.status,
   100	      lastActivityAt: c.lastActivityAt,
   101	      preview: c.preview ?? '',
   102	    })),
   103	    next: rows.length > limit && last ? `${last.lastActivityAt.getTime()}_${last._id}` : null,
   104	  });
   105	});
   106	
   107	api.get('/api/conversations/:contact/messages', async (req, res) => {
   108	  const m = member(req, res);
   109	  if (!m) return;
   110	  const contact = req.params.contact;
   111	  const limit = pageSize(req.query.limit ?? 50);
   112	  const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null;
   113	  const { messages, outbox, convs } = await cols();
   114	
   115	  const inFilter: Record<string, unknown> = { ws: m.ws, contact };
   116	  const outFilter: Record<string, unknown> = { ws: m.ws, contact };
   117	  if (before && !Number.isNaN(before.getTime())) {
   118	    inFilter.occurredAt = { $lt: before };
   119	    outFilter.createdAt = { $lt: before };
   120	  }
   121	  const [ins, outs, conv] = await Promise.all([
   122	    messages.find(inFilter as any).sort({ occurredAt: -1, messageId: -1 }).limit(limit).toArray(),
   123	    outbox.find(outFilter as any).sort({ createdAt: -1 }).limit(limit).toArray(),
   124	    convs.findOne({ ws: m.ws, contact }),
   125	  ]);
   126	  const merged = [
   127	    ...ins.map((x) => ({ direction: 'in' as const, id: x.messageId, text: x.text, at: x.occurredAt })),
   128	    ...outs.map((x) => ({ direction: 'out' as const, id: x.clientRef, text: x.text, at: x.createdAt, status: x.status, sender: x.sender })),
   129	  ]
   130	    .sort((a, b) => b.at.getTime() - a.at.getTime())
   131	    .slice(0, limit)
   132	    .reverse();
   133	  res.json({
   134	    conversation: conv && { contact: conv.contact, assignee: conv.assignee, status: conv.status },
   135	    messages: merged,
   136	    older: merged.length === limit ? merged[0].at : null,
   137	  });
   138	});
   139	
   140	api.post('/api/conversations/:contact/reply', async (req, res) => {
   141	  const m = member(req, res);
   142	  if (!m) return;
   143	  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
   144	  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
   145	  if (!text || text.length > 4000) return res.status(400).json({ error: 'text required (max 4000 chars)' });
   146	  const ref = typeof req.body?.clientRef === 'string' && req.body.clientRef.length <= 80 ? req.body.clientRef : randomUUID();
   147	  await createReply(m.ws, req.params.contact, text, ref, req.session!.sub);
   148	  res.status(202).json({ clientRef: ref });
   149	});
   150	
   151	api.post('/api/conversations/:contact/claim', async (req, res) => {
   152	  const m = member(req, res);
   153	  if (!m) return;
   154	  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
   155	  const r = await claim(m.ws, req.params.contact, req.session!.sub);
   156	  res.status(r === 'taken' ? 409 : 200).json({ result: r });
   157	});
   158	
   159	api.post('/api/conversations/:contact/release', async (req, res) => {
   160	  const m = member(req, res);
   161	  if (!m) return;
   162	  const ok = await release(m.ws, req.params.contact, req.session!.sub, m.role === 'admin');
   163	  res.status(ok ? 200 : 409).json({ released: ok });
   164	});
   165	
   166	api.post('/api/conversations/:contact/close', async (req, res) => {
   167	  const m = member(req, res);
   168	  if (!m) return;
   169	  res.json({ changed: await setStatus(m.ws, req.params.contact, 'closed') });
   170	});
   171	
   172	api.post('/api/conversations/:contact/reopen', async (req, res) => {
   173	  const m = member(req, res);
   174	  if (!m) return;
   175	  res.json({ changed: await setStatus(m.ws, req.params.contact, 'open') });
   176	});
=== routes/auth.ts
     1	import { Router } from 'express';
     2	import { randomBytes } from 'node:crypto';
     3	import { config } from '../config.js';
     4	import { getRedis } from '../redis.js';
     5	import { authorizeUrl, exchange, pkce } from '../lib/oidc.js';
     6	import { parseCookies, setCookie } from '../lib/cookies.js';
     7	import { createSession, destroySession, SESSION_COOKIE } from '../lib/session.js';
     8	import { cols } from '../db.js';
     9	
    10	export const auth = Router();
    11	
    12	const FLOW_COOKIE = 'sb_flow';
    13	const secure = config.webOrigin.startsWith('https:');
    14	
    15	auth.get('/auth/login', async (_req, res) => {
    16	  try {
    17	    const state = randomBytes(16).toString('hex');
    18	    const nonce = randomBytes(16).toString('hex');
    19	    const { verifier, challenge } = pkce();
    20	    await getRedis().set(`sb:flow:${state}`, JSON.stringify({ verifier, nonce }), 'EX', 600);
    21	    setCookie(res, FLOW_COOKIE, state, 600, secure);
    22	    res.redirect(await authorizeUrl(state, nonce, challenge));
    23	  } catch (e) {
    24	    console.error('login start failed', e);
    25	    res.status(502).json({ error: 'identity provider unavailable' });
    26	  }
    27	});
    28	
    29	auth.get('/auth/callback', async (req, res) => {
    30	  const { code, state } = req.query;
    31	  const cookies = parseCookies(req.header('cookie'));
    32	  if (typeof code !== 'string' || typeof state !== 'string' || cookies[FLOW_COOKIE] !== state) {
    33	    return res.status(400).json({ error: 'invalid login response' });
    34	  }
    35	  const raw = await getRedis().getdel(`sb:flow:${state}`);
    36	  if (!raw) return res.status(400).json({ error: 'login expired, start again' });
    37	  try {
    38	    const { verifier, nonce } = JSON.parse(raw);
    39	    const who = await exchange(code, verifier, nonce);
    40	    const { people } = await cols();
    41	    await Promise.all(
    42	      who.workspaces.map((w) =>
    43	        people.updateOne({ ws: w.id, sub: who.sub }, { $set: { name: who.name || who.email || who.sub, email: who.email } }, { upsert: true }),
    44	      ),
    45	    );
    46	    const sid = await createSession(who);
    47	    res.clearCookie(FLOW_COOKIE, { path: '/' });
    48	    setCookie(res, SESSION_COOKIE, sid, config.sessionTtlSec, secure);
    49	    res.redirect(config.webOrigin);
    50	  } catch (e) {
    51	    console.error('login failed', e);
    52	    res.status(401).json({ error: 'login failed' });
    53	  }
    54	});
    55	
    56	auth.post('/auth/logout', async (req, res) => {
    57	  const origin = req.header('origin');
    58	  if (origin && origin !== config.webOrigin && origin !== `http://${req.header('host')}`) return res.status(403).json({ error: 'bad origin' });
    59	  const sid = parseCookies(req.header('cookie'))[SESSION_COOKIE];
    60	  if (sid) await destroySession(sid);
    61	  res.clearCookie(SESSION_COOKIE, { path: '/' });
    62	  res.json({ ok: true });
    63	});
=== routes/grader.ts
     1	import { Router, json } from 'express';
     2	import { createHash, timingSafeEqual } from 'node:crypto';
     3	import { config, isWorkspace } from '../config.js';
     4	import { cols } from '../db.js';
     5	import { getRedis } from '../redis.js';
     6	import { claim } from '../lib/conversations.js';
     7	import { createReply } from '../lib/outbox.js';
     8	
     9	export const grader = Router();
    10	
    11	grader.use('/__grader', (req, res, next) => {
    12	  // hash both sides so the compare does not depend on the token length
    13	  const digest = (v: string) => createHash('sha256').update(v).digest();
    14	  if (!timingSafeEqual(digest(String(req.header('x-grader-token') ?? '')), digest(config.graderToken))) return res.status(401).json({ error: 'unauthorized' });
    15	  next();
    16	});
    17	grader.use('/__grader', json({ limit: '64kb' }));
    18	
    19	grader.post('/__grader/reset', async (_req, res) => {
    20	  const c = await cols();
    21	  await Promise.all(Object.values(c).map((col) => col.deleteMany({})));
    22	  const redis = getRedis();
    23	  for (const pattern of ['sb:rl:*', 'sb:cool:*', 'sb:lock:*']) {
    24	    let cursor = '0';
    25	    do {
    26	      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    27	      cursor = next;
    28	      if (keys.length) await redis.del(...keys);
    29	    } while (cursor !== '0');
    30	  }
    31	  res.json({ ok: true });
    32	});
    33	
    34	grader.get('/__grader/snapshot', async (_req, res) => {
    35	  const { messages, convs, outbox } = await cols();
    36	  const out: Record<string, any> = {};
    37	  for (const ws of config.workspaces) {
    38	    const contacts: Record<string, { inbound: string[]; assignee: string | null }> = Object.create(null);
    39	    const msgs = await messages.find({ ws }).sort({ occurredAt: 1, messageId: 1 }).toArray();
    40	    for (const m of msgs) (contacts[m.contact] ??= { inbound: [], assignee: null }).inbound.push(m.messageId);
    41	    for (const cv of await convs.find({ ws }).toArray()) (contacts[cv.contact] ??= { inbound: [], assignee: null }).assignee = cv.assignee;
    42	    const outbound: Record<string, string> = {};
    43	    for (const o of await outbox.find({ ws }).toArray()) outbound[o.clientRef] = o.status;
    44	    out[ws] = { contacts, outbound };
    45	  }
    46	  res.json({ workspaces: out });
    47	});
    48	
    49	grader.post('/__grader/reply', async (req, res) => {
    50	  const { workspace, contact, text, client_ref } = req.body ?? {};
    51	  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
    52	  if ([contact, text, client_ref].some((v) => typeof v !== 'string' || !v || v.length > 4000) || contact.length > 64 || client_ref.length > 100) return res.status(400).json({ error: 'contact, text and client_ref are required' });
    53	  await createReply(workspace, contact, text, client_ref, 'grader');
    54	  res.status(202).json({ ok: true });
    55	});
    56	
    57	grader.post('/__grader/claim', async (req, res) => {
    58	  const { workspace, contact, agent } = req.body ?? {};
    59	  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
    60	  if ([contact, agent].some((v) => typeof v !== 'string' || !v)) return res.status(400).json({ error: 'contact and agent are required' });
    61	  const r = await claim(workspace, contact, agent);
    62	  res.status(r === 'taken' ? 409 : 200).json({ result: r });
    63	});
=== routes/notes.ts
     1	import { Router } from 'express';
     2	import { ObjectId } from 'mongodb';
     3	import { cols, isDup } from '../db.js';
     4	import { addFrame } from '../lib/frames.js';
     5	import { roleIn } from '../lib/session.js';
     6	import { isWorkspace } from '../config.js';
     7	
     8	// The server only ever stores and returns opaque base64 strings here.
     9	// Keys are made and used in the browser; see PROTOCOL.md.
    10	export const notes = Router();
    11	
    12	export const validContact = (v: unknown): v is string => typeof v === 'string' && /^\+?[0-9A-Za-z._:-]{3,40}$/.test(v);
    13	
    14	const MAX_B64 = 16_384;
    15	const b64 = (v: unknown, max = MAX_B64): v is string =>
    16	  typeof v === 'string' && v.length > 0 && v.length <= max && /^[A-Za-z0-9+/_-]+={0,2}$/.test(v);
    17	
    18	function workspaceOf(req: any, res: any): string | null {
    19	  const ws = req.params.ws ?? req.query.workspace ?? req.body?.workspace;
    20	  if (!isWorkspace(ws) || !roleIn(req.session, ws)) {
    21	    res.status(403).json({ error: 'not a member of this workspace' });
    22	    return null;
    23	  }
    24	  return ws;
    25	}
    26	
    27	// register (or replace) my public key; replacing drops the key that was wrapped for the old one
    28	notes.put('/api/keys', async (req, res) => {
    29	  const ws = workspaceOf(req, res);
    30	  if (!ws) return;
    31	  if (!b64(req.body?.publicKey, 400)) return res.status(400).json({ error: 'publicKey required' });
    32	  const { keys } = await cols();
    33	  await keys.updateOne(
    34	    { ws, sub: req.session!.sub },
    35	    { $set: { publicKey: req.body.publicKey }, $unset: { wrappedKey: '', wrappedBy: '' } },
    36	    { upsert: true },
    37	  );
    38	  res.json({ ok: true });
    39	});
    40	
    41	notes.get('/api/workspaces/:ws/keys', async (req, res) => {
    42	  const ws = workspaceOf(req, res);
    43	  if (!ws) return;
    44	  const { keys, keyring } = await cols();
    45	  const all = await keys.find({ ws }).toArray();
    46	  const mine = all.find((k) => k.sub === req.session!.sub);
    47	  res.json({
    48	    initialised: !!(await keyring.findOne({ ws })),
    49	    members: all.map((k) => ({ sub: k.sub, publicKey: k.publicKey, hasKey: !!k.wrappedKey })),
    50	    mine: mine?.wrappedKey ? { wrappedKey: mine.wrappedKey, wrappedBy: mine.wrappedBy } : null,
    51	  });
    52	});
    53	
    54	// the first member creates the workspace key; everyone after that is given it by a member who has it
    55	notes.post('/api/workspaces/:ws/keyring', async (req, res) => {
    56	  const ws = workspaceOf(req, res);
    57	  if (!ws) return;
    58	  if (!b64(req.body?.wrappedKey)) return res.status(400).json({ error: 'wrappedKey required' });
    59	  const { keys, keyring } = await cols();
    60	  const me = await keys.findOne({ ws, sub: req.session!.sub });
    61	  if (!me) return res.status(409).json({ error: 'register a public key first' });
    62	  try {
    63	    await keyring.insertOne({ ws, creator: me.sub, createdAt: new Date() });
    64	  } catch (e) {
    65	    if (!isDup(e)) throw e;
    66	    // a creator whose first attempt died before storing its key may finish the job
    67	    const ring = await keyring.findOne({ ws });
    68	    if (ring?.creator !== me.sub || me.wrappedKey) return res.status(409).json({ error: 'workspace key already exists' });
    69	  }
    70	  await keys.updateOne({ ws, sub: me.sub }, { $set: { wrappedKey: req.body.wrappedKey, wrappedBy: me.sub } });
    71	  res.status(201).json({ ok: true });
    72	});
    73	
    74	notes.put('/api/workspaces/:ws/keys/:sub', async (req, res) => {
    75	  const ws = workspaceOf(req, res);
    76	  if (!ws) return;
    77	  if (!b64(req.body?.wrappedKey)) return res.status(400).json({ error: 'wrappedKey required' });
    78	  const { keys } = await cols();
    79	  const me = await keys.findOne({ ws, sub: req.session!.sub });
    80	  if (!me?.wrappedKey) return res.status(403).json({ error: 'you do not hold the workspace key' });
    81	  // first write wins, so nobody can overwrite a key someone already has
    82	  const r = await keys.updateOne(
    83	    { ws, sub: req.params.sub, wrappedKey: { $exists: false } },
    84	    { $set: { wrappedKey: req.body.wrappedKey, wrappedBy: me.sub } },
    85	  );
    86	  if (!r.matchedCount) return res.status(409).json({ error: 'unknown member, or already has a key' });
    87	  res.json({ ok: true });
    88	});
    89	
    90	notes.post('/api/conversations/:contact/notes', async (req, res) => {
    91	  const ws = workspaceOf(req, res);
    92	  if (!ws) return;
    93	  if (!validContact(req.params.contact)) return res.status(400).json({ error: 'invalid contact' });
    94	  if (!b64(req.body?.ciphertext) || !b64(req.body?.iv, 64)) return res.status(400).json({ error: 'ciphertext and iv required' });
    95	  const { notes: col } = await cols();
    96	  const doc = {
    97	    _id: new ObjectId(),
    98	    ws,
    99	    contact: req.params.contact,
   100	    author: req.session!.sub,
   101	    ciphertext: req.body.ciphertext,
   102	    iv: req.body.iv,
   103	    createdAt: new Date(),
   104	  };
   105	  await col.insertOne(doc);
   106	  await addFrame(ws, `note:${doc._id}`, { type: 'note.added', contact: doc.contact, note_id: String(doc._id), author: doc.author });
   107	  res.status(201).json({ id: String(doc._id) });
   108	});
   109	
   110	notes.get('/api/conversations/:contact/notes', async (req, res) => {
   111	  const ws = workspaceOf(req, res);
   112	  if (!ws) return;
   113	  const { notes: col } = await cols();
   114	  const rows = await col.find({ ws, contact: req.params.contact }).sort({ createdAt: 1 }).limit(500).toArray();
   115	  res.json({
   116	    notes: rows.map((n) => ({ id: String(n._id), author: n.author, ciphertext: n.ciphertext, iv: n.iv, createdAt: n.createdAt })),
   117	  });
   118	});
=== routes/webhook.ts
     1	import { Router, raw } from 'express';
     2	import { config, isWorkspace } from '../config.js';
     3	import { checkSignature } from '../lib/signature.js';
     4	import { storeInbound, storeStatus } from '../lib/inbound.js';
     5	
     6	export const webhook = Router();
     7	
     8	const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
     9	const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
    10	
    11	webhook.post('/webhooks/pigeon', raw({ type: () => true, limit: '256kb' }), async (req, res) => {
    12	  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    13	  const sig = checkSignature(req.header('x-pigeon-signature'), body, config.pigeon.webhookSecret);
    14	  if (sig !== 'ok') return res.status(401).json({ error: sig === 'stale' ? 'stale timestamp' : 'bad signature' });
    15	
    16	  let evt: unknown;
    17	  try {
    18	    evt = JSON.parse(body.toString('utf8'));
    19	  } catch {
    20	    return res.status(400).json({ error: 'invalid json' });
    21	  }
    22	  if (!isObj(evt)) return res.status(400).json({ error: 'invalid event' });
    23	  // unknown types and workspaces are acknowledged, otherwise Pigeon keeps retrying
    24	  if (evt.type !== 'message.inbound' && evt.type !== 'message.status') return res.json({ ok: true, ignored: 'type' });
    25	  if (!isWorkspace(evt.workspace)) return res.json({ ok: true, ignored: 'workspace' });
    26	  if (!isObj(evt.data)) return res.status(400).json({ error: 'invalid event' });
    27	
    28	  try {
    29	    if (evt.type === 'message.inbound') {
    30	      const d = evt.data;
    31	      const at = new Date(evt.occurred_at);
    32	      if (!str(d.message_id) || !str(d.from) || typeof d.text !== 'string' || Number.isNaN(at.getTime())) {
    33	        return res.status(400).json({ error: 'invalid inbound' });
    34	      }
    35	      await storeInbound(evt.workspace, { message_id: d.message_id, from: d.from, text: d.text }, at);
    36	    } else if (evt.type === 'message.status') {
    37	      const d = evt.data;
    38	      // no client_ref means it is not one of ours
    39	      if (!str(d.client_ref) || !str(d.status)) return res.json({ ok: true, ignored: 'status' });
    40	      await storeStatus(evt.workspace, { message_id: str(d.message_id) ? d.message_id : undefined, client_ref: d.client_ref, status: d.status });
    41	    }
    42	  } catch (err) {
    43	    console.error('webhook store failed', err);
    44	    return res.status(503).json({ error: 'try again' });
    45	  }
    46	  res.json({ ok: true });
    47	});
```


---

## assistant  
2026-11-25T13:54:07.576Z

_thinking_




---

## assistant  
2026-11-25T13:54:08.445Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold; grep -nE \"^\\s*(it|test|describe)\\(\" server/test/*.ts | cut -c1-170; wc -l server/test/*.ts web/src/*.ts web/src/*.tsx web/src/components/*.tsx; cat -n web/src/api.ts web/src/useSocket.ts web/src/unread.ts web/src/people.ts"
}
```


---

## user  
2026-11-25T13:54:08.788Z

**tool result**

```
server/test/frames.test.ts:12:test('concurrent frames get gap-free, unique seqs', async () => {
server/test/frames.test.ts:21:test('the same key written many times at once is one frame', async () => {
server/test/frames.test.ts:27:test('framesAfter only returns what comes after, in order', async () => {
server/test/frames.test.ts:32:test('workspaces count their own seq', async () => {
server/test/notes.test.ts:43:test('only one member can create the workspace key', async () => {
server/test/notes.test.ts:53:test('a member without the key cannot hand it out, and cannot overwrite one', async () => {
server/test/notes.test.ts:63:test('key state shows who has a key and my own wrapped key', async () => {
server/test/notes.test.ts:71:test('notes come back as the opaque strings that were stored', async () => {
server/test/notes.test.ts:80:test('notes stay inside their conversation and workspace', async () => {
server/test/notes.test.ts:86:test('rejects junk instead of storing it', async () => {
server/test/notes.test.ts:91:test('a creator whose key setup died half way can finish it, nobody else can', async () => {
server/test/notes.test.ts:104:test('a contact id with a strange shape is refused', async () => {
server/test/conversations.test.ts:13:test('six agents claiming at once: exactly one wins', async () => {
server/test/conversations.test.ts:25:test('the holder claiming again is not an error', async () => {
server/test/conversations.test.ts:31:test('claiming a contact that never wrote creates the conversation', async () => {
server/test/conversations.test.ts:37:test('same contact in two workspaces is two conversations', async () => {
server/test/conversations.test.ts:42:test('only the holder or an admin can release', async () => {
server/test/conversations.test.ts:49:test('close and reopen only report a change when there is one', async () => {
server/test/ratelimit.test.ts:16:test('a burst is capped below what the provider allows', async () => {
server/test/ratelimit.test.ts:22:test('tokens come back over time', async () => {
server/test/ratelimit.test.ts:27:test('a refund gives a token back', async () => {
server/test/ratelimit.test.ts:35:test('a pause blocks everyone until it ends', async () => {
server/test/ratelimit.test.ts:43:test('a short pause does not shorten a longer one', async () => {
server/test/signature.test.ts:12:test('accepts a fresh, correctly signed body', () => {
server/test/signature.test.ts:16:test('accepts a timestamp just inside five minutes', () => {
server/test/signature.test.ts:20:test('flags a correctly signed body older than five minutes as stale', () => {
server/test/signature.test.ts:25:test('rejects a body that was changed after signing', () => {
server/test/signature.test.ts:30:test('rejects a wrong secret', () => {
server/test/signature.test.ts:35:test('a bad signature on an old timestamp is bad, not stale', () => {
server/test/signature.test.ts:39:test('rejects missing and malformed headers', () => {
server/test/webhook.test.ts:39:test('a missing, malformed or wrong signature is 401', async () => {
server/test/webhook.test.ts:45:test('a valid signature older than five minutes is 401, four minutes is accepted', async () => {
server/test/webhook.test.ts:51:test('a stored event is acknowledged again when it is repeated, and stored once', async () => {
server/test/webhook.test.ts:59:test('unknown event types and unknown workspaces are acknowledged and ignored', async () => {
server/test/webhook.test.ts:67:test('a status for a message we never sent is acknowledged and ignored', async () => {
server/test/webhook.test.ts:72:test('a signed body that is not usable is 400, never 5xx', async () => {
server/test/webhook.test.ts:78:test('events for the same contact come back in occurred_at order, not arrival order', async () => {
server/test/outbox.test.ts:14:test('the same client_ref asked many times at once is one reply, one frame', async () => {
server/test/outbox.test.ts:21:test('a reply to a contact who never wrote still creates the conversation', async () => {
server/test/outbox.test.ts:28:test('a new reply is queued and due immediately, so any copy can pick it up', async () => {
server/test/outbox.test.ts:36:test('status only moves forward: delivered stays delivered if sent arrives late', async () => {
server/test/outbox.test.ts:43:test('once the carrier has reported on a reply it is no longer resent', async () => {
server/test/outbox.test.ts:48:test('a status from another workspace does not touch the reply', async () => {
      55 server/test/conversations.test.ts
      34 server/test/frames.test.ts
      23 server/test/helpers.ts
     108 server/test/notes.test.ts
      53 server/test/outbox.test.ts
      49 server/test/ratelimit.test.ts
      43 server/test/signature.test.ts
      88 server/test/webhook.test.ts
      44 web/src/api.ts
      81 web/src/crypto.ts
      77 web/src/format.ts
     114 web/src/keyring.ts
      52 web/src/messages.ts
      66 web/src/people.ts
      64 web/src/types.ts
      50 web/src/unread.ts
       7 web/src/useLatest.ts
      69 web/src/useSocket.ts
       1 web/src/vite-env.d.ts
      78 web/src/App.tsx
      14 web/src/main.tsx
      19 web/src/components/Avatar.tsx
      51 web/src/components/ConversationRow.tsx
     276 web/src/components/Inbox.tsx
      81 web/src/components/InfoPanel.tsx
      60 web/src/components/MessageBubble.tsx
     195 web/src/components/NotesPanel.tsx
     125 web/src/components/Rail.tsx
      78 web/src/components/ReplyBox.tsx
      14 web/src/components/SignIn.tsx
     300 web/src/components/Thread.tsx
     126 web/src/components/ThreadHeader.tsx
      66 web/src/components/Toasts.tsx
     116 web/src/components/Workspace.tsx
     120 web/src/components/icons.tsx
    2797 total
     1	export class ApiError extends Error {
     2	  status: number;
     3	  constructor(status: number) {
     4	    super(`Request failed (${status})`);
     5	    this.status = status;
     6	  }
     7	}
     8	
     9	async function parse<T>(res: Response): Promise<T> {
    10	  if (!res.ok) throw new ApiError(res.status);
    11	  const text = await res.text();
    12	  return (text ? JSON.parse(text) : undefined) as T;
    13	}
    14	
    15	export async function get<T>(path: string): Promise<T> {
    16	  return parse<T>(await fetch(path));
    17	}
    18	
    19	export async function post<T>(path: string, body: unknown): Promise<T> {
    20	  const res = await fetch(path, {
    21	    method: 'POST',
    22	    headers: { 'content-type': 'application/json' },
    23	    body: JSON.stringify(body),
    24	  });
    25	  return parse<T>(res);
    26	}
    27	
    28	export async function put<T>(path: string, body: unknown): Promise<T> {
    29	  const res = await fetch(path, {
    30	    method: 'PUT',
    31	    headers: { 'content-type': 'application/json' },
    32	    body: JSON.stringify(body),
    33	  });
    34	  return parse<T>(res);
    35	}
    36	
    37	export function conversationPath(contact: string, action = '') {
    38	  return `/api/conversations/${encodeURIComponent(contact)}${action}`;
    39	}
    40	
    41	export function errorText(err: unknown) {
    42	  if (err instanceof ApiError) return `The server returned an error (${err.status}).`;
    43	  return 'Could not reach the server. Check your connection.';
    44	}
     1	import { useCallback, useEffect, useRef, useState } from 'react';
     2	import type { Frame, Subscribe } from './types';
     3	
     4	const MIN_DELAY = 1000;
     5	const MAX_DELAY = 10000;
     6	
     7	export function useSocket(workspace: string) {
     8	  const listeners = useRef(new Set<(frame: Frame) => void>());
     9	  const [connected, setConnected] = useState(false);
    10	  const [epoch, setEpoch] = useState(0);
    11	
    12	  const subscribe = useCallback<Subscribe>((listener) => {
    13	    listeners.current.add(listener);
    14	    return () => {
    15	      listeners.current.delete(listener);
    16	    };
    17	  }, []);
    18	
    19	  useEffect(() => {
    20	    let lastSeq = 0;
    21	    let delay = MIN_DELAY;
    22	    let socket: WebSocket | null = null;
    23	    let timer: ReturnType<typeof setTimeout> | undefined;
    24	    let stopped = false;
    25	
    26	    function connect() {
    27	      const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    28	      const query = new URLSearchParams({ workspace });
    29	      if (lastSeq > 0) query.set('after', String(lastSeq));
    30	      const ws = new WebSocket(`${scheme}://${location.host}/ws?${query}`);
    31	      socket = ws;
    32	
    33	      ws.onopen = () => {
    34	        delay = MIN_DELAY;
    35	        setConnected(true);
    36	        setEpoch((n) => n + 1);
    37	      };
    38	
    39	      ws.onmessage = (event) => {
    40	        let frame: Frame;
    41	        try {
    42	          frame = JSON.parse(String(event.data));
    43	        } catch {
    44	          return;
    45	        }
    46	        if (typeof frame.seq !== 'number' || frame.seq <= lastSeq) return;
    47	        lastSeq = frame.seq;
    48	        listeners.current.forEach((listener) => listener(frame));
    49	      };
    50	
    51	      ws.onclose = () => {
    52	        if (stopped) return;
    53	        setConnected(false);
    54	        timer = setTimeout(connect, delay);
    55	        delay = Math.min(delay * 2, MAX_DELAY);
    56	      };
    57	    }
    58	
    59	    connect();
    60	    return () => {
    61	      stopped = true;
    62	      clearTimeout(timer);
    63	      socket?.close();
    64	      setConnected(false);
    65	    };
    66	  }, [workspace]);
    67	
    68	  return { connected, epoch, subscribe };
    69	}
     1	import { useCallback, useEffect, useState } from 'react';
     2	
     3	type Stamps = Record<string, number>;
     4	interface Stored {
     5	  seen: Stamps;
     6	  inbound: Stamps;
     7	}
     8	
     9	const storageKey = (workspace: string) => `switchboard.unread.${workspace}`;
    10	
    11	function read(workspace: string): Stored {
    12	  try {
    13	    const parsed = JSON.parse(localStorage.getItem(storageKey(workspace)) ?? '{}');
    14	    return { seen: parsed.seen ?? {}, inbound: parsed.inbound ?? {} };
    15	  } catch {
    16	    return { seen: {}, inbound: {} };
    17	  }
    18	}
    19	
    20	export function useUnread(workspace: string) {
    21	  const [stored, setStored] = useState(() => read(workspace));
    22	
    23	  useEffect(() => {
    24	    localStorage.setItem(storageKey(workspace), JSON.stringify(stored));
    25	  }, [workspace, stored]);
    26	
    27	  const markInbound = useCallback((contact: string) => {
    28	    setStored((s) => ({ ...s, inbound: { ...s.inbound, [contact]: Date.now() } }));
    29	  }, []);
    30	
    31	  const markSeen = useCallback((contact: string) => {
    32	    setStored((s) => ({ ...s, seen: { ...s.seen, [contact]: Date.now() } }));
    33	  }, []);
    34	
    35	  const isUnread = useCallback(
    36	    (contact: string) => (stored.inbound[contact] ?? 0) > (stored.seen[contact] ?? 0),
    37	    [stored],
    38	  );
    39	
    40	  const count = Object.keys(stored.inbound).filter(isUnread).length;
    41	
    42	  useEffect(() => {
    43	    document.title = count > 0 ? `(${count}) Switchboard` : 'Switchboard';
    44	    return () => {
    45	      document.title = 'Switchboard';
    46	    };
    47	  }, [count]);
    48	
    49	  return { isUnread, markInbound, markSeen };
    50	}
     1	import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
     2	import { get } from './api';
     3	import { useLatest } from './useLatest';
     4	import type { Me } from './types';
     5	
     6	export interface People {
     7	  nameOf: (sub: string | null | undefined) => string;
     8	  seen: (sub: string | null | undefined) => void;
     9	}
    10	
    11	const FALLBACK = 'Teammate';
    12	const RETRY_AFTER = 30_000;
    13	
    14	export const PeopleContext = createContext<People>({ nameOf: () => FALLBACK, seen: () => {} });
    15	
    16	export function usePeopleNames() {
    17	  return useContext(PeopleContext);
    18	}
    19	
    20	export function usePeople(workspace: string, me: Me): People {
    21	  const [names, setNames] = useState<Record<string, string>>({});
    22	  const namesRef = useLatest(names);
    23	  const loading = useRef(false);
    24	  const tried = useRef(new Map<string, number>());
    25	
    26	  const load = useCallback(async () => {
    27	    if (loading.current) return;
    28	    loading.current = true;
    29	    try {
    30	      const res = await get<{ people: { sub: string; name: string }[] }>(
    31	        `/api/workspaces/${encodeURIComponent(workspace)}/people`,
    32	      );
    33	      setNames(Object.fromEntries(res.people.map((p) => [p.sub, p.name])));
    34	    } catch {
    35	      // names are cosmetic, the fallback label covers a failed lookup
    36	    } finally {
    37	      loading.current = false;
    38	    }
    39	  }, [workspace]);
    40	
    41	  useEffect(() => {
    42	    load();
    43	  }, [load]);
    44	
    45	  const nameOf = useCallback(
    46	    (sub: string | null | undefined) => {
    47	      if (!sub) return FALLBACK;
    48	      if (sub === me.sub) return me.name;
    49	      return names[sub] ?? FALLBACK;
    50	    },
    51	    [names, me.sub, me.name],
    52	  );
    53	
    54	  const seen = useCallback(
    55	    (sub: string | null | undefined) => {
    56	      if (!sub || sub === me.sub || namesRef.current[sub]) return;
    57	      const last = tried.current.get(sub) ?? 0;
    58	      if (Date.now() - last < RETRY_AFTER) return;
    59	      tried.current.set(sub, Date.now());
    60	      load();
    61	    },
    62	    [me.sub, load, namesRef],
    63	  );
    64	
    65	  return useMemo(() => ({ nameOf, seen }), [nameOf, seen]);
    66	}
```


---

## assistant  
2026-11-25T13:54:10.710Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/web/src; cat -n components/Thread.tsx | grep -nE \"clientRef|retry|Retry|fetchOlder|before|post\\(|function |epoch|onFrame|ApiError\" | head -60; grep -nE \"export|function \" keyring.ts crypto.ts messages.ts components/ReplyBox.tsx components/Workspace.tsx App.tsx | head -60; cat ../vite.config.ts"
}
```


---

## user  
2026-11-25T13:54:10.876Z

**tool result**

```
2:     2	import { ApiError, conversationPath, errorText, get, post } from '../api';
22:    22	  epoch: number;
36:    36	export function Thread({ me, workspace, contact, isAdmin, subscribe, epoch, panel, onPanel, onBack }: Props) {
51:    51	    (before?: string) => {
53:    53	      if (before) params.set('before', before);
76:    76	    if (epoch === 0) return;
83:    83	  }, [epoch]);
89:    89	  async function refreshConversation() {
98:    98	  async function loadEarlier() {
124:   124	  function onScroll() {
165:   165	  async function deliver(clientRef: string, text: string) {
166:   166	    const body = { workspace, text, clientRef };
170:   170	        await post(path, body);
172:   172	        if (err instanceof ApiError) throw err;
173:   173	        await post(path, body);
176:   176	      setMessages((current) => setStatus(current, clientRef, 'failed'));
181:   181	  function send(text: string) {
182:   182	    const clientRef = crypto.randomUUID();
187:   187	        id: clientRef,
194:   194	    deliver(clientRef, text);
197:   197	  function retry(failedId: string, text: string) {
202:   202	  async function act(action: 'claim' | 'release' | 'close' | 'reopen') {
205:   205	      await post(conversationPath(contact, `/${action}`), { workspace });
213:   213	      if (err instanceof ApiError && err.status === 409) {
229:   229	  function composer() {
277:   277	                  <MessageBubble row={row} animate={animate.current} onRetry={retry} />
messages.ts:6:export function laterStatus(current: MessageStatus | undefined, next: MessageStatus): MessageStatus {
messages.ts:11:export function setStatus(messages: Message[], id: string, status: MessageStatus): Message[] {
messages.ts:17:export function addMessage(messages: Message[], message: Message): Message[] {
messages.ts:24:export interface MessageRow {
messages.ts:33:function joins(prev: Message, next: Message) {
messages.ts:41:export function layoutMessages(messages: Message[]): MessageRow[] {
crypto.ts:5:export function toBase64(bytes: Uint8Array): string {
crypto.ts:11:export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
crypto.ts:18:export async function generateKeyPair(): Promise<CryptoKeyPair> {
crypto.ts:22:export async function exportPublicKey(key: CryptoKey): Promise<string> {
crypto.ts:23:  return toBase64(new Uint8Array(await crypto.subtle.exportKey('spki', key)));
crypto.ts:26:function importPublicKey(spki: string): Promise<CryptoKey> {
crypto.ts:30:export function generateWorkspaceKey(): Promise<CryptoKey> {
crypto.ts:34:async function deriveWrapKey(mine: CryptoKey, theirPublic: string): Promise<CryptoKey> {
crypto.ts:46:export async function wrapWorkspaceKey(key: CryptoKey, mine: CryptoKey, recipientPublic: string): Promise<string> {
crypto.ts:48:  const raw = await crypto.subtle.exportKey('raw', key);
crypto.ts:57:export async function unwrapWorkspaceKey(wrapped: string, mine: CryptoKey, wrapperPublic: string): Promise<CryptoKey> {
crypto.ts:64:export function noteAad(workspace: string, contact: string, author: string): Uint8Array<ArrayBuffer> {
crypto.ts:68:export async function encryptNote(key: CryptoKey, text: string, aad: Uint8Array<ArrayBuffer>) {
crypto.ts:74:export async function decryptNote(key: CryptoKey, ciphertext: string, iv: string, aad: Uint8Array<ArrayBuffer>) {
keyring.ts:2:import { exportPublicKey, generateKeyPair, generateWorkspaceKey, unwrapWorkspaceKey, wrapWorkspaceKey } from './crypto';
keyring.ts:8:export interface LocalKeys {
keyring.ts:20:export function keyringSupported() {
keyring.ts:24:function openDb(): Promise<IDBDatabase> {
keyring.ts:33:async function readStored(id: string): Promise<StoredKeys | undefined> {
keyring.ts:42:async function writeStored(id: string, value: StoredKeys): Promise<void> {
keyring.ts:52:export async function ensureKeypair(sub: string, workspace: string): Promise<LocalKeys> {
keyring.ts:57:    stored = { privateKey: pair.privateKey, publicKey: await exportPublicKey(pair.publicKey), registered: false };
keyring.ts:68:export function fetchKeyState(workspace: string) {
keyring.ts:72:export async function loadWorkspaceKey(
keyring.ts:91:export async function createKeyring(sub: string, workspace: string, keys: LocalKeys): Promise<boolean> {
keyring.ts:104:export async function shareWithPending(sub: string, workspace: string, keys: LocalKeys, key: CryptoKey, state: KeyState) {
components/ReplyBox.tsx:13:export function ReplyBox({ onSend, disabledReason }: Props) {
components/ReplyBox.tsx:27:  function send() {
components/ReplyBox.tsx:33:  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
App.tsx:12:function pickWorkspace(me: Me) {
App.tsx:18:export function App() {
App.tsx:31:  function chooseWorkspace(id: string) {
App.tsx:36:  async function signOut() {
components/Workspace.tsx:21:export function Workspace({ me, workspaces, workspace, isAdmin, onWorkspace, onSignOut }: Props) {
components/Workspace.tsx:61:  function select(next: string) {
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The browser talks to one origin (:5173). These paths are passed through to
// the server on :4000. Add or remove prefixes to suit your API.
const server = 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': server,
      '/auth': server,
      '/healthz': server,
      '/ws': { target: server, ws: true },
    },
  },
});
```


---

## assistant  
2026-11-25T13:54:13.014Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/web/src; sed -n 160,202p components/Thread.tsx; cat ../../server/test/helpers.ts; head -40 /Users/apple/Desktop/repo-new/gohlai-assessment/PIGEON.md | cut -c1-200; grep -n \"Level 4\\|webhook\\|status\" /Users/apple/Desktop/repo-new/gohlai-assessment/PIGEON.md | head -30"
}
```


---

## user  
2026-11-25T13:54:13.262Z

**tool result**

```
    }
  });

  useEffect(() => subscribe((frame) => handleFrame.current(frame)), [subscribe, handleFrame]);

  async function deliver(clientRef: string, text: string) {
    const body = { workspace, text, clientRef };
    const path = conversationPath(contact, '/reply');
    try {
      try {
        await post(path, body);
      } catch (err) {
        if (err instanceof ApiError) throw err;
        await post(path, body);
      }
    } catch {
      setMessages((current) => setStatus(current, clientRef, 'failed'));
      toast.show("Couldn't send. Check your connection.", 'error');
    }
  }

  function send(text: string) {
    const clientRef = crypto.randomUUID();
    stickToBottom.current = true;
    setMessages((current) =>
      addMessage(current, {
        direction: 'out',
        id: clientRef,
        text,
        at: new Date().toISOString(),
        status: 'queued',
        sender: me.sub,
      }),
    );
    deliver(clientRef, text);
  }

  function retry(failedId: string, text: string) {
    setMessages((current) => current.filter((m) => !(m.direction === 'out' && m.id === failedId)));
    send(text);
  }

  async function act(action: 'claim' | 'release' | 'close' | 'reopen') {
import { cols, ensureIndexes } from '../src/db.ts';
import { getRedis } from '../src/redis.ts';

export async function wipe() {
  await ensureIndexes();
  const c = await cols();
  await Promise.all(Object.values(c).map((col) => col.deleteMany({})));
  const redis = getRedis();
  const keys = await redis.keys('sb:*:ws_test*');
  if (keys.length) await redis.del(...keys);
}

export async function close() {
  getRedis().disconnect();
  const { getDb } = await import('../src/db.ts');
  (await getDb()).client.close();
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: import('../src/lib/session.ts').Session;
  }
}
# Pigeon — provider contract

Base URL `http://localhost:4010`. Workspaces and API keys:

| Workspace | API key |
| --- | --- |
| `ws_acme` | `pk_acme_7d1f0a` |
| `ws_globex` | `pk_globex_c93b22` |

Webhook signing secret: `whsec_pigeon_dev`.

## Who is on the other end

Nobody real. Pigeon contains twelve simulated customers, six per workspace,
and a small set of canned texts. It picks one and posts it to you as if that
person had just written to the business. There is no customer app to build.
Customers do not answer your replies; they write on their own schedule.
Nothing you send goes anywhere: Pigeon records it and reports a status.

| Workspace | Simulated customers |
| --- | --- |
| `ws_acme` | +14155550101, +14155550102, +14155550103, +12125550104, +12125550105, +13035550106 |
| `ws_globex` | +442079460201, +442079460202, +442079460203, +4930901820204, +34600111205, +34600111206 |

## Webhooks Pigeon sends you

`POST <your url>` (default `http://localhost:4000/webhooks/pigeon`)

Headers:

- `x-pigeon-signature: t=<unix seconds>,v1=<hex>` where `v1` is
  HMAC-SHA256 of `"<t>.<raw request body>"` with the signing secret.
- `x-pigeon-event-id: <event id>`

Body, a contact wrote in:

`​``json
{ "id": "evt_...", "type": "message.inbound", "workspace": "ws_acme",
  "occurred_at": "2026-11-18T09:30:00.123Z",
  "data": { "message_id": "pmsg_...", "from": "+14155550101", "text": "Hi" } }
18:Nothing you send goes anywhere: Pigeon records it and reports a status.
27:`POST <your url>` (default `http://localhost:4000/webhooks/pigeon`)
43:Body, status of a message you sent:
46:{ "id": "evt_...", "type": "message.status", "workspace": "ws_acme",
48:  "data": { "message_id": "pm_...", "client_ref": "<yours>", "status": "sent" } }
51:`status` is `sent`, then `delivered` or `failed`.
76:| Valid signature, a status for a message you never sent | `2xx`, and ignore it |
88:`200 { "id": "pm_...", "status": "accepted" }`
```


---

## assistant  
2026-11-25T13:54:15.736Z

_thinking_




---

## assistant  
2026-11-25T13:54:16.204Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; sed -n 52,130p PIGEON.md | cut -c1-220"
}
```


---

## user  
2026-11-25T13:54:16.446Z

**tool result**

```
What Pigeon promises, and what it does not:

- **At least once.** The same event can arrive several times.
- **No ordering.** Events can arrive in a different order than `occurred_at`.
  `delivered` can arrive before `sent`.
- **Retries.** If you do not answer `2xx` within 5 seconds, Pigeon sends the
  event again: six attempts in all, spread over about 22 seconds. After that
  it is gone. A server that is down for a few seconds therefore loses nothing,
  provided it never answers `2xx` for an event it has not safely stored.
- **Bursts.** Dozens of events in under a second happen.
- **The URL is public.** Anyone can post to it. Pigeon expects you to reject
  requests that are not genuinely from Pigeon, and requests whose timestamp is
  more than five minutes old, with `401`.

### How your endpoint must answer

| Request | Your answer |
| --- | --- |
| Signature missing, malformed, or not matching the raw body | `401`. Never a `5xx`. |
| Signature valid, timestamp more than five minutes old | `401` |
| Signature valid, timestamp up to five minutes old | Genuine. Slow networks exist. |
| Valid event, stored safely (or already stored earlier) | `2xx`, within 5 seconds |
| Valid signature, an event `type` you do not know | `2xx`. Pigeon adds event types without notice, and anything else makes it retry. |
| Valid signature, a status for a message you never sent | `2xx`, and ignore it |
| Valid signature, a body you cannot parse | `400`. Never a `5xx`. |
| Valid signature, a `workspace` you do not know | `2xx`, and ignore it |

## Sending a message

`POST /v1/messages` with `Authorization: Bearer <api key>`

`​``json
{ "to": "+14155550101", "text": "Hello", "client_ref": "<your id for this message>" }
`​``

`200 { "id": "pm_...", "status": "accepted" }`

- `Idempotency-Key` header: a repeated key returns the original response and
  does not send again.
- The limit is per workspace: a bucket of 8 sends that refills at 4 a second.
  Beyond it you get `429` with `Retry-After: <seconds>`. Requests sent before that time has
  passed are rejected and counted against you.
- `503` now and then.
- Sometimes Pigeon accepts and delivers a message but its HTTP response takes
  12 seconds. Your client will probably have given up by then.
- Now and then Pigeon is down altogether for a while: every send gets `503`
  until it recovers. A reply an agent sent in that window must still go out.

## While developing

`​``
# make a contact write to you now
curl -X POST localhost:4010/v1/simulate/inbound -H 'content-type: application/json' \
  -d '{"workspace":"ws_acme","from":"+14155550101","text":"hello"}'

# force a failure on a send: timeout | 503 | 429
curl -X POST localhost:4010/v1/messages -H 'authorization: Bearer pk_acme_7d1f0a' \
  -H 'x-pigeon-force: timeout' -H 'content-type: application/json' \
  -d '{"to":"+14155550101","text":"hi","client_ref":"m1"}'

# run the traffic profile the check uses
curl -X POST localhost:4010/__admin/start -H 'content-type: application/json' -d '{"profile":"chaos"}'

# what Pigeon saw
curl localhost:4010/__admin/report

# take the send API down for 15 seconds
curl -X POST localhost:4010/__admin/outage -H 'content-type: application/json' -d '{"seconds":15}'
`​``

The same things as npm scripts: `npm run inbound`, `npm run chaos`, `npm run report`.

By default Pigeon also sends one message every 4 to 8 seconds ("drizzle") so
your inbox is never empty. `npm run quiet` stops that and `npm run drizzle`
turns it back on.
```


---

## assistant  
2026-11-25T13:54:46.139Z

_thinking_




---

## assistant  
2026-11-25T13:54:47.065Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/web/src; cat -n types.ts | sed -n 1,64p; sed -n 1,22p messages.ts; grep -n \"failed\\|status\" components/MessageBubble.tsx | head; sed -n 1,20p ../../server/test/ratelimit.test.ts; sed -n 18,50p App.tsx"
}
```


---

## user  
2026-11-25T13:54:47.215Z

**tool result**

```
     1	export type Role = 'admin' | 'agent';
     2	export type ConversationStatus = 'open' | 'closed';
     3	export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed';
     4	
     5	export interface Me {
     6	  sub: string;
     7	  name: string;
     8	  email: string;
     9	  workspaces: { id: string; role: Role }[];
    10	}
    11	
    12	export interface ConversationSummary {
    13	  contact: string;
    14	  assignee: string | null;
    15	  status: ConversationStatus;
    16	  lastActivityAt: string;
    17	  preview: string;
    18	  lastOut?: boolean;
    19	}
    20	
    21	export interface ConversationInfo {
    22	  contact: string;
    23	  assignee: string | null;
    24	  status: ConversationStatus;
    25	}
    26	
    27	export interface Message {
    28	  direction: 'in' | 'out';
    29	  id: string;
    30	  text: string;
    31	  at: string;
    32	  status?: MessageStatus;
    33	  sender?: string;
    34	}
    35	
    36	export type Frame =
    37	  | { seq: number; type: 'message.inbound'; contact: string; message_id: string; text: string; occurred_at: string }
    38	  | { seq: number; type: 'message.outbound'; contact: string; client_ref: string; text: string; sender: string; status: MessageStatus }
    39	  | { seq: number; type: 'message.status'; contact: string; client_ref: string; status: MessageStatus }
    40	  | { seq: number; type: 'conversation.assigned'; contact: string; assignee: string | null }
    41	  | { seq: number; type: 'conversation.status'; contact: string; status: ConversationStatus }
    42	  | { seq: number; type: 'note.added'; contact: string; note_id: string; author: string };
    43	
    44	export interface KeyMember {
    45	  sub: string;
    46	  publicKey: string;
    47	  hasKey: boolean;
    48	}
    49	
    50	export interface KeyState {
    51	  initialised: boolean;
    52	  members: KeyMember[];
    53	  mine: { wrappedKey: string; wrappedBy: string } | null;
    54	}
    55	
    56	export interface NoteRecord {
    57	  id: string;
    58	  author: string;
    59	  ciphertext: string;
    60	  iv: string;
    61	  createdAt: string;
    62	}
    63	
    64	export type Subscribe = (listener: (frame: Frame) => void) => () => void;
import { sameDay } from './format';
import type { Message, MessageStatus } from './types';

const rank: Record<MessageStatus, number> = { queued: 0, sent: 1, delivered: 2, failed: 2 };

export function laterStatus(current: MessageStatus | undefined, next: MessageStatus): MessageStatus {
  if (!current) return next;
  return rank[next] > rank[current] ? next : current;
}

export function setStatus(messages: Message[], id: string, status: MessageStatus): Message[] {
  return messages.map((m) =>
    m.direction === 'out' && m.id === id ? { ...m, status: laterStatus(m.status, status) } : m,
  );
}

export function addMessage(messages: Message[], message: Message): Message[] {
  const existing = messages.find((m) => m.direction === message.direction && m.id === message.id);
  if (!existing) return [...messages, message];
  if (message.direction === 'out' && message.status) return setStatus(messages, message.id, message.status);
  return messages;
}
17:  failed: 'Not delivered',
20:function StatusIcon({ status }: { status: MessageStatus }) {
21:  const label = STATUS_LABEL[status];
22:  if (status === 'queued') return <ClockIcon size={14} label={label} />;
23:  if (status === 'sent') return <CheckIcon size={14} label={label} />;
24:  if (status === 'delivered') return <DoubleCheckIcon size={14} label={label} />;
32:  const failed = message.status === 'failed';
33:  const showMeta = last || failed;
39:    failed ? 'failed' : '',
50:          {failed && <span className="msg-failed">Not delivered</span>}
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { acquire, pause, refund } from '../src/lib/ratelimit.ts';
import { getRedis } from '../src/redis.ts';

const ws = 'ws_test_rl';
const clear = () => getRedis().del(`sb:rl:${ws}`, `sb:cool:${ws}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

before(clear);
after(async () => {
  await clear();
  getRedis().disconnect();
});

test('a burst is capped below what the provider allows', async () => {
  let granted = 0;
  for (let i = 0; i < 20; i++) if (await acquire(ws)) granted++;
  assert.ok(granted >= 5 && granted <= 7, `granted ${granted}`);
});
export function App() {
  const [session, setSession] = useState<Session>({ state: 'loading' });
  const [workspace, setWorkspace] = useState<string | null>(null);

  useEffect(() => {
    get<Me>('/api/me')
      .then((me) => {
        setWorkspace(pickWorkspace(me));
        setSession({ state: 'in', me });
      })
      .catch((err) => setSession({ state: err instanceof ApiError && err.status === 401 ? 'out' : 'error' }));
  }, []);

  function chooseWorkspace(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setWorkspace(id);
  }

  async function signOut() {
    try {
      await post('/auth/logout', {});
    } finally {
      setSession({ state: 'out' });
    }
  }

  if (session.state === 'loading') return <p className="loader" role="status">Loading...</p>;
  if (session.state === 'out') return <SignIn />;
  if (session.state === 'error') {
    return (
      <main className="centered">
        <p>Could not reach the server.</p>
        <button className="btn btn-secondary" onClick={() => location.reload()}>Try again</button>
```


---

## assistant  
2026-11-25T13:54:48.486Z

_thinking_




---

## assistant  
2026-11-25T13:56:51.992Z

**tool call: Bash**

```
{
  "command": "mkdir -p /tmp/pdf-parts; cat > /tmp/pdf-parts/B.md <<'EOF'\n# PART B: Code ka tour, Interview Q&A, Live-change tasks\n\nYeh part is liye hai ki interviewer jab code kholke poochhe \"yeh aisa kyun hai?\", tum seedha file aur function dikha sako. Sab kuch actual code se liya gaya hai (`scaffold/server/src`, `scaffold/web/src`, `DECISIONS.md`, `PROTOCOL.md`, `README.md`).\n\n**Pehle 6 shabd samajh lo (baar-baar aayenge):**\n\n- **Webhook**: dusra server (Pigeon) hamare URL pe POST karta hai jab kuch hota hai. Jaise doorbell: bell dusra bajata hai, darwaza hum kholte hain.\n- **Idempotent**: ek kaam ko 1 baar karo ya 10 baar, result same. Jaise lift ka button 5 baar dabao, lift ek hi baar aati hai.\n- **Frame**: ek row jo \"kuch badla\" batati hai (naya message, assign, status). Har frame ka ek `seq` (number 1, 2, 3...) hota hai.\n- **Lease**: kaam ka \"kiraye ka tala\". Ek server ne kaam uthaya to 20 s ke liye uska; agar wo mar gaya to 20 s baad koi aur utha lega.\n- **Outbox**: reply pehle DB me \"to-do list\" me likhte hain, phir alag loop bhejta hai. Jaise letter pehle post-box me, phir postman.\n- **Idempotency-Key**: header jo Pigeon ko bolta hai \"yeh wahi request hai, dubara mat bhejna\". Hum `client_ref` ko hi key banate hain.\n\n---\n\n# 1. Code ka tour\n\n## 1.1 Entry / setup (`scaffold/server/src`)\n\n| File | Kya karta hai | Zaroori function |\n|---|---|---|\n| `index.ts` | Express app banata hai, saare routers jodta hai, `/healthz` deta hai (ready hone tak 503), error handler, shutdown (SIGTERM/SIGINT). | `main()` (listen, `ensureIndexes()`, Redis `ping()`, `startSender()`, phir `ready = true`); `onError` |\n| `config.ts` | Environment se settings padhta hai; defaults local Docker jaise hain. Production me `GRADER_TOKEN` na ho to start hi nahi hota. | `config` object (`leaseMs: 20_000`, `sendTimeoutMs: 6_000`, `sessionTtlSec: 8*3600`); `isWorkspace()` |\n| `db.ts` | MongoDB connection, saare types (`Msg`, `Conv`, `Out`, `FrameDoc`, `Note`, `KeyDoc`, `Person`) aur saare indexes. | `ensureIndexes()` (unique indexes yahin hain); `cols()`; `isDup()` (error code 11000 = duplicate) |\n| `redis.ts` | Redis client, pehli baar use pe connect. | `getRedis()` |\n| `ws.ts` | WebSocket server. Upgrade pe cookie + Origin + workspace check, phir frames bhejta hai. | `attachWebSocket()`; `flush()` (`framesAfter` se naye frames bhejta hai) |\n\n## 1.2 Routes (`scaffold/server/src/routes`)\n\n| File | Kya karta hai | Zaroori function |\n|---|---|---|\n| `webhook.ts` | `POST /webhooks/pigeon`. Raw body pe signature check, phir `message.inbound` / `message.status` store karta hai. Store hone ke BAAD hi 200 deta hai. | handler of `webhook.post('/webhooks/pigeon', raw(...))` |\n| `auth.ts` | Login (OIDC) shuru karna, callback, logout. | `/auth/login` (state, nonce, PKCE banata hai); `/auth/callback` (`getdel` + `exchange()` + `createSession()`); `/auth/logout` |\n| `api.ts` | Browser ki saari API: me, people, conversation list, messages, reply, claim, release, close, reopen. Pehle Origin check, phir session check. | `member()` (workspace + role check); `/api/conversations` (cursor pagination); `/reply` |\n| `notes.ts` | Encrypted notes + key endpoints. Server sirf opaque base64 rakhta hai. | `PUT /api/keys`, `POST .../keyring`, `PUT .../keys/:sub` (first write wins), `POST .../notes`; `validContact()` |\n| `grader.ts` | Check ke liye endpoints (`/__grader/reset`, `snapshot`, `reply`, `claim`), `x-grader-token` se protected. | `/__grader/snapshot`; token compare `timingSafeEqual` |\n\n## 1.3 Lib (`scaffold/server/src/lib`)\n\n| File | Kya karta hai | Zaroori function |\n|---|---|---|\n| `signature.ts` | Webhook ki HMAC signature + 5 minute window check. | `checkSignature()` returns `'ok' / 'bad' / 'stale'` |\n| `inbound.ts` | Customer ka message aur status DB me daalta hai (duplicate-safe). Status sirf aage badhta hai (`RANK`). | `storeInbound()`; `storeStatus()`; `RANK` |\n| `frames.ts` | Har change ko `frames` me `seq` ke saath likhna, Redis lock ke neeche. | `addFrame()`; `withLock()`; `framesAfter()`; `lastSeq()` |\n| `conversations.ts` | Conversation upsert, claim/release, open/closed. | `touchConversation()`; `claim()`; `release()`; `setStatus()` |\n| `outbox.ts` | Reply ko outbox me likhna aur bhejne wala loop (lease, retry, backoff). | `createReply()`; `attempt()` (Pigeon ko POST); `tick()`; `startSender()` |\n| `ratelimit.ts` | Redis me token bucket (Lua script) + pause (cooldown), sab copies ke liye shared. | `acquire()`; `refund()`; `pause()`; consts `CAP = 6`, `RATE = 3.5` |\n| `oidc.ts` | IdP se baat: discovery, PKCE, code exchange, id_token verify (RS256, JWKS). | `pkce()`; `authorizeUrl()`; `exchange()`; `verifyIdToken()` |\n| `session.ts` | Session Redis me (`sb:sess:<id>`), cookie se wapas nikalna. | `createSession()`; `sessionFromCookie()`; `roleIn()` |\n| `cookies.ts` | Cookie parse aur set (`httpOnly`, `sameSite: 'lax'`). | `parseCookies()`; `setCookie()` |\n\n## 1.4 Tests (`scaffold/server/test`)\n\nRun: `npm --prefix scaffold/server test` (MongoDB + Redis chahiye; test DB alag: `switchboard_test`). README ke hisaab se 41 tests.\n\n| File | Kya saabit karta hai |\n|---|---|\n| `signature.test.ts` | Sahi/galat/stale signature, malformed header. |\n| `webhook.test.ts` | 401 cases, dobara aaya event ek hi baar store hota hai, unknown type/workspace ack hota hai, `occurred_at` order. |\n| `frames.test.ts` | Ek saath bahut frames: seq unique aur gap-free; same key = ek frame; workspace ka apna seq. |\n| `outbox.test.ts` | Same `client_ref` bahut baar = ek reply, ek frame; status sirf aage; dusre workspace ka status touch nahi karta. |\n| `conversations.test.ts` | 6 agents ek saath claim: sirf ek jeeta; release sirf holder ya admin. |\n| `ratelimit.test.ts` | Burst cap, tokens wapas aana, refund, pause. |\n| `notes.test.ts` | Sirf ek member workspace key banata hai; first write wins; notes conversation/workspace ke andar. |\n| `helpers.ts` | `wipe()` (DB + test Redis keys saaf) aur `close()`. |\n\n## 1.5 Web (`scaffold/web/src`)\n\n| File | Kya karta hai | Zaroori cheez |\n|---|---|---|\n| `App.tsx`, `main.tsx` | `/api/me` se login state; SignIn ya Workspace dikhata hai. | `signOut()` |\n| `api.ts` | `get/post/put` + `ApiError` (status ke saath). | `ApiError` (isse pata chalta hai server ne jawab diya ya network fail hua) |\n| `useSocket.ts` | WebSocket connect, `lastSeq` yaad rakhna, reconnect (1 s se 10 s backoff), `?after=`. | `connect()`; `epoch` |\n| `components/Thread.tsx` | Conversation ke messages, bhejna, retry, claim/close. | `deliver()`; `send()`; `retry()`; `loadEarlier()` |\n| `components/Inbox.tsx`, `ConversationRow.tsx` | Conversation list, tabs, \"load more\". | cursor `next` use karta hai |\n| `unread.ts` | Unread state browser ke `localStorage` me. | `useUnread()`: `markInbound`, `markSeen`, `isUnread` |\n| `people.ts` | `/api/workspaces/:ws/people` se naam; na mile to \"Teammate\". | `usePeople()`; `nameOf()` |\n| `messages.ts` | Message list helper; status sirf aage. | `laterStatus()`; `addMessage()`; `setStatus()` |\n| `crypto.ts` | WebCrypto: ECDH P-256, HKDF, AES-GCM, note encrypt/decrypt. | `wrapWorkspaceKey()`; `encryptNote()`; `noteAad()` |\n| `keyring.ts` | Keys IndexedDB me, workspace key ka bootstrap aur sharing. | `ensureKeypair()`; `createKeyring()`; `shareWithPending()` |\n| `components/NotesPanel.tsx` | Notes ka side panel. | decrypt fail pe \"Could not decrypt this note\" |\n| `components/ReplyBox.tsx`, `MessageBubble.tsx`, `ThreadHeader.tsx`, `InfoPanel.tsx`, `Rail.tsx`, `Workspace.tsx`, `SignIn.tsx`, `Toasts.tsx`, `Avatar.tsx`, `icons.tsx` | UI ke tukde. | `ReplyBox` doosre agent ke claim pe lock ho jata hai |\n| `types.ts`, `format.ts`, `useLatest.ts` | Types (`Frame`, `MessageStatus`), date/format helpers. | `Frame` union |\n\n---\n\n# 2. Interview ke 25 sawal aur jawab\n\nHar jawab aise likha hai ki tum bol sako. Last line me bataya hai code me kahan dikhana hai.\n\n---\n\n### Q1. Ek message store ho gaya, frame likhne se pehle `kill -9` ho gaya. Retry pe kya hota hai?\n\nWebhook ka 200 sabse last me jata hai (`res.json({ ok: true })`). Crash hua to Pigeon ko 2xx nahi mila, to wo retry karta hai (6 attempts, ~22 s). Retry pe `storeInbound` dobara chalta hai: message ka upsert duplicate collapse kar deta hai (unique `(ws, messageId)`), aur `addFrame` key `in:<message_id>` se frame ab likh deta hai. Yaani frame kho nahi jata. Ek honest kamzori: pehli baar me conversation \"reopen\" nahi hua tha to retry me bhi nahi hoga, kyunki retry ko message \"already stored\" dikhta hai (DECISIONS.md me likha hai).\n\n**Code me kahan:** `routes/webhook.ts` (200 last me), `lib/inbound.ts:storeInbound` (`fresh = res.upsertedCount === 1`), `lib/frames.ts:addFrame`.\n\n---\n\n### Q2. Reply 6 s pe timeout hua, par Pigeon ne 12 s pe accept kar liya. Double send rokne ke saare tareeke?\n\nChaar layer hain:\n1. **Unique index** `(ws, clientRef)` on `outbox`: ek `client_ref` = ek row. `createReply` me duplicate error ignore hota hai.\n2. **Idempotency-Key header**: `attempt()` Pigeon ko `'idempotency-key': doc.clientRef` bhejta hai. Pigeon repeated key pe purana response deta hai, dobara send nahi karta (PIGEON.md).\n3. **Lease 20 s > timeout 6 s**: row `lockedUntil` tak locked hai, to doosri copy beech me usi row ko nahi uthati. Timeout pe `lockedUntil` reset hota hai aur backoff ke baad retry hota hai.\n4. **Status se band**: jab Pigeon ka `sent/delivered` webhook aata hai, `storeStatus` `sendDone: true` set kar deta hai, aur `tick()` sirf `sendDone: false` rows uthata hai.\n\nRetry same key ke saath jata hai, isliye double send nahi hota.\n\n**Code me kahan:** `lib/outbox.ts:attempt` (timeout `catch` -> `retryLater`), `lib/outbox.ts:tick` (`due` filter), `lib/inbound.ts:storeStatus`, `db.ts:ensureIndexes` (outbox unique).\n\n---\n\n### Q3. `seq` ke liye Redis lock kyun, atomic counter (`INCR`) kyun nahi? Lock expire ho jaye to kya bachata hai?\n\n`INCR` number to unique deta, par commit ka order nahi. Agar A ko seq 5 mila, B ko 6, aur B pehle DB me likh gaya, to reader ne 6 dekhke `sent = 6` kar diya; baad me 5 aaya to wo kabhi nahi bheja jayega. Lock ke neeche \"last seq padho, +1, insert\" hota hai, isliye rows seq order me commit hote hain. Lock 3 s ka hai (`PX 3000`), jaanbujhkar chhota. Agar lock expire ho jaye aur do writers same `next` nikalein, to unique index `(ws, seq)` ek ko duplicate error deta hai. `addFrame` wo case `0` return karke retry karta hai (5 attempts tak), warna error throw karta hai taaki caller retry kare. Unlock Lua script se hota hai jo token match karta hai, taaki kisi aur ka lock na hate.\n\n**Code me kahan:** `lib/frames.ts:withLock`, `lib/frames.ts:addFrame` (`isDup(e) return 0`), `db.ts` (`frames` unique `{ws, seq}` aur `{ws, key}`). Test: `test/frames.test.ts`.\n\n---\n\n### Q4. Conversation list ka pagination cursor kaise kaam karta hai? Kamzori?\n\nSort hai `lastActivityAt` descending, phir `_id` descending. Cursor ek string hai: `<lastActivityAt ms>_<_id>`. Agle page ka filter: `lastActivityAt < t` YA (`lastActivityAt == t` aur `_id < id`). `_id` tiebreaker hai taaki same millisecond wali rows skip na hon. Server `limit + 1` rows laata hai; agar extra mili to `next` cursor deta hai. Index `{ws, lastActivityAt: -1, _id: -1}` isi ke liye hai. **Kamzori:** list \"live\" hai. Agar paging ke beech kisi purani conversation ko naya message mila, wo upar chali jati hai aur agle page me nahi aati (user ko live frame se dikh jati hai, par page se skip hoti hai). Aur kharab cursor chup-chaap ignore hota hai (pehla page milta hai). Thread ke messages ka paging (`/messages`, `before`) aur kamzor hai: sirf timestamp use hota hai, to bilkul same millisecond wale messages page boundary pe skip ho sakte hain (DECISIONS.md me likha hai).\n\n**Code me kahan:** `routes/api.ts` `api.get('/api/conversations')` (lines 78-105), `routes/api.ts` `/messages` handler (lines 107-138).\n\n---\n\n### Q5. Failed reply NEW `client_ref` se retry hota hai, par network failure SAME se. Kyun?\n\nDo alag situations hain. **Network-level fail** (kuch jawab hi nahi aaya): hume nahi pata server ne request liya ya nahi. Same `clientRef` dobara bhejna safe hai, kyunki server `clientRef` pe dedupe karta hai; agar pehli request pahunchi thi to dusri bas wahi row dikhati hai. `Thread.tsx:deliver` yahi karta hai: `if (err instanceof ApiError) throw err;` warna wahi body dobara `post`. **Failed status** (server ne jawab diya ya Pigeon ne final fail bataya): row `failed` aur `sendDone: true` hai. Wahi `client_ref` dobara bhejo to server sirf purani failed row dekhega aur dobara nahi bhejega. Isliye user \"Retry\" dabaye to `retry()` purana message hata ke `send()` se naya `crypto.randomUUID()` banata hai. Yeh DECISIONS.md me bhi hai.\n\n**Code me kahan:** `web/src/components/Thread.tsx:deliver`, `:send`, `:retry`; `lib/outbox.ts:createReply` (dup ignore).\n\n---\n\n### Q6. Origin check kis cheez se bachata hai, aur `SameSite=Lax` kya karta hai?\n\nHum cookie-based session use karte hain, to browser cookie khud bhej deta hai. Koi gandi site (evil.com) tumhare browser se hamare server pe POST bhejwa sakti hai: ise CSRF kehte hain (cross-site request forgery). **Origin check**: har write (POST/PUT, logout, WebSocket upgrade) pe agar `Origin` header hai aur wo `config.webOrigin` ya `http://<host>` nahi, to 403. **SameSite=Lax**: browser cross-site POST/fetch/iframe me cookie bhejta hi nahi; sirf top-level link click jaise GET me bhejta hai. Isliye GET endpoints read-only rakhe hain. Dono saath: Lax pehli deewar, Origin doosri (khaas kar WebSocket ke liye, jahan same-origin policy nahi lagti). Dhyaan: agar `Origin` header hi nahi hai (non-browser client) to request pass hoti hai; wo browser attack nahi hai, kyunki attacker ke paas cookie hi nahi. CSRF tokens ke bajay yeh simple choice DECISIONS.md me hai.\n\n**Code me kahan:** `routes/api.ts` (lines 22-30 Origin middleware), `routes/auth.ts` logout (line 57-58), `ws.ts` upgrade (line 58-59), `lib/cookies.ts:setCookie` (`sameSite: 'lax'`, `httpOnly`).\n\n---\n\n### Q7. PROTOCOL.md me ek hostile server naye member ko kaise bevakoof bana sakta hai?\n\nPublic keys server ke bataye par bharose se chalte hain; koi fingerprint / safety number ka out-of-band check nahi hai. Naya member join karta hai to workspace key K kisi teammate se aati hai. Hostile server ek **nakli K** bana ke, apni control wali key se wrap karke naye member ko de sakta hai. Member ko farq pata nahi chalta, to wo jo notes likhega, server padh sakta hai. Doosra raasta: server ek nakli member register karke ya pending member ki public key badalke K us key ke liye wrap karwa leta hai. Isliye notes \"server se secret\" tab tak hain jab tak server ek honest-but-curious hai, active attacker se nahi. PROTOCOL.md me yeh \"attacks this scheme does NOT stop\" me #1 hai.\n\n**Code me kahan:** `PROTOCOL.md` section \"Attacks this scheme does NOT stop\" (#1), `routes/notes.ts:PUT /api/keys` (key replace ho sakti hai), `web/src/keyring.ts:shareWithPending`.\n\n---\n\n### Q8. Project me abhi kya galat ya kamzor hai? (honest jawab)\n\nDECISIONS.md \"What I know is still wrong\" se:\n- Ek hi contact ko bheje replies me se kisi ek ka retry ho to order badal sakta hai.\n- Assign/close ke frames DB update ke BAAD likhte hain; beech me crash ho to frame gayab (refetch se sahi state dikhti hai).\n- Customer message store hua par reopen se pehle crash: retry reopen nahi karega.\n- `frames` kabhi saaf nahi hota.\n- Thread paging sirf timestamp pe (same millisecond skip ho sakta hai).\n- Pigeon ke unexpected 4xx pe 5 baar try, phir `failed`.\n- Level 4 local check me nahi hai; maine khud script se test kiya, score nahi dekha.\n- Frontend ke automated tests nahi; sirf headless Chrome me chalaya.\n- Env secrets ke dev defaults hain; production me sirf `GRADER_TOKEN` zaroori hai.\n- Cut: Elasticsearch search, billing bonus.\n- Session me workspace membership login ke time ki hai (8 ghante), IdP se hataya gaya user next sign-in tak access rakhta hai.\n\nSeedha bolna: \"Mujhe yeh pata hai, aur ye trade-off maine likh rakha hai.\"\n\n**Code me kahan:** `DECISIONS.md` section \"What I know is still wrong or weak\".\n\n---\n\n### Q9. Duplicate webhook aaye to kaise sambhalte ho?\n\nPigeon \"at least once\" hai, to duplicate normal hai. Message ka unique index `(ws, messageId)` hai aur `storeInbound` upsert karta hai (`$setOnInsert`), to dusri baar kuch nahi badalta. Frame ki key `in:<message_id>` hai aur `(ws, key)` unique hai, to frame bhi ek hi. Status ke liye key `st:<client_ref>:<status>`. Test: \"a stored event is acknowledged again when it is repeated, and stored once\".\n\n**Code me kahan:** `lib/inbound.ts:storeInbound`, `db.ts:ensureIndexes`, `test/webhook.test.ts`.\n\n---\n\n### Q10. Ordering kaise guarantee karte ho? Event ulte order me aaye to?\n\nPigeon ordering ka wada nahi karta. Hum messages ko `occurredAt` (event ka time) se sort karte hain, arrival ke time se nahi: `messages` index `{ws, contact, occurredAt}`, aur snapshot me `sort({occurredAt: 1, messageId: 1})`. Conversation ka `lastActivityAt` `$max` se update hota hai, to purana event time peeche nahi le jata. Status ke liye `RANK` (queued 0, sent 1, delivered 2, failed 2) aur update filter `rank: {$lt: rank}` hai, to `delivered` pehle aaye aur `sent` baad me, to `delivered` hi rehta hai. Frames ka order `seq` se.\n\n**Code me kahan:** `lib/inbound.ts:storeStatus`, `RANK`; `lib/conversations.ts:touchConversation` (`$max`); `test/webhook.test.ts` (occurred_at order); `test/outbox.test.ts` (\"status only moves forward\").\n\n---\n\n### Q11. Webhook signature ka verification kaise hota hai? Replay se kaise bachte ho?\n\nHeader `t=<unix>,v1=<hex>`. Hum `HMAC-SHA256(secret, \"<t>.\" + raw body)` nikalte hain aur `timingSafeEqual` se compare karte hain (timing attack se bachne ke liye). **Raw body** zaroori hai, isliye `raw({type: () => true})` use hua, JSON parse ke baad nahi. Timestamp 300 s se purana ho to `'stale'` -> 401. Galat signature + purana timestamp = `'bad'` (stale nahi). Parse na ho paye to 400, kabhi 5xx nahi. Dhyan do: 5 minute ke andar ek captured request dobara bheji ja sake to bhi sirf duplicate hogi, aur duplicate harmless hain (idempotent).\n\n**Code me kahan:** `lib/signature.ts:checkSignature` (`TOLERANCE_SEC = 300`), `routes/webhook.ts`.\n\n---\n\n### Q12. Rate limiting kaise sab server copies ke beech chalti hai?\n\nPigeon ka limit: 8 burst, 4/s refill, per workspace. Hum thoda neeche rehte hain: `CAP = 6`, `RATE = 3.5`. Bucket Redis me hai (`sb:rl:<ws>`), to saari copies ek hi bucket se token leti hain. Check-aur-minus ek Lua script me hota hai, matlab atomic: do copies ek saath ek token nahi le sakti. Time Redis ka `TIME` hai, copies ke apne clock nahi (clock skew ka darr nahi). Agar 429 aaye to `pause()` `sb:cool:<ws>` set karta hai (`Retry-After` + 250 ms), jise `acquire` pehle check karta hai: poore workspace ke liye sab copies ruk jati hain. Lease na mile to `refund()` token wapas deta hai. Har copy ek workspace ke liye max `MAX_INFLIGHT = 4` sends ek saath.\n\n**Code me kahan:** `lib/ratelimit.ts` (`ACQUIRE`, `REFUND`, `PAUSE`), `lib/outbox.ts:tick` (`acquire`/`refund`), `attempt()` (429 branch). Test: `test/ratelimit.test.ts`.\n\n---\n\n### Q13. Retry rules kya hain? Kab forever, kab fail?\n\n`attempt()` me:\n- Koi 2xx: accepted, `sendDone: true`.\n- **429**: `Retry-After` tak workspace pause, phir retry.\n- **5xx, 408, 3xx, network error/timeout**: backoff `min(500 * 2^min(attempts,4), 8000)` ms + jitter, **forever**, kyunki outage me bhi reply nikalna hi chahiye.\n- **Baaki 4xx**: pehle 5 attempts retry (shayad temporary auth/conflict), phir `failed`.\n\n**Code me kahan:** `lib/outbox.ts:attempt` (lines 71-92), `retryLater`.\n\n---\n\n### Q14. Do agents ek saath claim karein to kya hota hai?\n\n`claim()` ek hi atomic `updateOne` hai, filter me `assignee: null YA assignee: agent` aur `upsert: true`. Do agents me se ek ka filter match karta hai. Jiska nahi karta, wo upsert se naya row banane ki koshish karta hai aur unique index `(ws, contact)` se duplicate error (11000) aata hai. Hum use catch karke plain update chalate hain, `matchedCount` 0 aaya to `'taken'` -> HTTP 409. Holder dobara claim kare to `'already'` (error nahi). Test: \"six agents claiming at once: exactly one wins\".\n\n**Code me kahan:** `lib/conversations.ts:claim`, `test/conversations.test.ts`.\n\n---\n\n### Q15. Redis aur MongoDB dono kyun?\n\n**Mongo = sach ka ghar (durable)**: messages, outbox, frames, notes. Crash me bhi bacha rehta hai. **Redis = tez aur shared, kho jaye to chalega**: Redis lock (`sb:lock:frames:<ws>`), rate bucket, cooldown, sessions (`sb:sess:`), login flow state (`sb:flow:`) aur pub/sub. Pub/sub sirf \"jago\" ka ishara hai; asli data Mongo ke `frames` me hai, to ishara kho jaye to bhi 2 s ke polling se pakad lete hain. Aur multiple copies ke liye shared memory chahiye, jo process ke andar ki variable nahi de sakti.\n\n**Code me kahan:** `db.ts`, `redis.ts`, `ws.ts` (`sub.subscribe` + `setInterval(..., 2000)`).\n\n---\n\n### Q16. WebSocket replay kaise kaam karta hai?\n\nHar change `frames` me row hai (seq ke saath). Browser connect karte waqt `?after=<lastSeq>` bhejta hai. Server `framesAfter(ws, c.sent)` se us seq ke baad ke frames bhejta hai (500 ke batch me). Bina `after` ke client sirf naye frames dekhta hai (`lastSeq` se shuru). `after` agar newest se bada ho to newest tak clamp. Server do cheezon se jagta hai: Redis pub/sub aur har 2 s ka timer. `busy/again` flags ek hi client pe do `flush` ek saath nahi chalne dete. Browser me `useSocket` `frame.seq <= lastSeq` wale frames ignore karta hai (duplicate-safe), aur reconnect pe 1 s se 10 s tak backoff; reconnect pe `epoch` badhta hai jisse Thread REST se refetch karta hai.\n\n**Code me kahan:** `ws.ts:flush`, `ws.ts` upgrade handler (lines 65-67), `lib/frames.ts:framesAfter`, `web/src/useSocket.ts`.\n\n---\n\n### Q17. Login (auth) ka flow batao. Cookie me kya hai?\n\nOIDC \"authorization code + PKCE\". `/auth/login` random `state`, `nonce` aur PKCE verifier banata hai, Redis me 10 min ke liye rakhta hai aur `sb_flow` cookie me state set karta hai. `/auth/callback` check karta hai ki cookie ka state == URL ka state, phir `getdel` se flow data nikaalta hai (ek baar use). `exchange()` code ko token se badalta hai, `verifyIdToken` RS256 signature IdP ki JWKS keys se, aur `iss`, `aud`, `exp`, `nonce`, `sub` check karta hai. Phir `createSession`: 32 random bytes ka id, Redis me 8 ghante. Cookie `sb_sid`: `httpOnly` (JS padh nahi sakta), `sameSite: lax`, `secure` jab `WEB_ORIGIN` https ho. Session id regex `^[0-9a-f]{64}$` se validate hota hai.\n\n**Code me kahan:** `routes/auth.ts`, `lib/oidc.ts:verifyIdToken`, `lib/session.ts`, `lib/cookies.ts`.\n\n---\n\n### Q18. Tenant isolation (ek workspace ka data doosre ko na dikhe) kaise?\n\nTeen jagah. (1) Har query me `ws` filter hai (`{ ws, contact }`) aur har collection ke index `ws` se shuru hote hain. Same contact do workspace me do alag conversations hain (test hai). (2) `isWorkspace()` ek fixed list se check karta hai (`hasOwnProperty`, to `\"__proto__\"` jaisi string nahi chalti). (3) `member()` / `workspaceOf()` har request pe session ke `workspaces` se `roleIn()` check karte hain, aur WebSocket upgrade pe bhi. Redis keys me bhi `ws` hai. `storeStatus` ka update `ws` ke saath hai, to dusre workspace ka status touch nahi hota (test).\n\n**Code me kahan:** `config.ts:isWorkspace`, `routes/api.ts:member`, `routes/notes.ts:workspaceOf`, `ws.ts` (line 62-63), `test/conversations.test.ts` (\"same contact in two workspaces\").\n\n---\n\n### Q19. NoSQL injection se kaise bachte ho?\n\nMongo me attack ye hota hai ki `workspace` ki jagah `{\"$ne\": null}` jaisa object bhej do. Humne har input ka **type** check kiya hai: `isWorkspace` sirf string manta hai; `text` ke liye `typeof === 'string'`; `status` sirf literal `'open'/'closed'` se compare; `contact` `validContact()` regex (`/^\\+?[0-9A-Za-z._:-]{3,40}$/`) se reply, claim aur notes-create pe; URL params hamesha string hote hain. Cursor: `Number()` aur `ObjectId.isValid`. Notes me ciphertext/iv base64 regex se. `grader.ts` snapshot me `Object.create(null)` use hua, taaki contact naam `__proto__` ho to object kharab na ho. Honest note: release/close/reopen/messages pe `validContact` nahi lagta (sirf string param hai, to injection nahi hota, par shape check nahi hota).\n\n**Code me kahan:** `config.ts:isWorkspace`, `routes/notes.ts:validContact`, `b64`, `routes/api.ts` (reply handler, cursor parsing).\n\n---\n\n### Q20. Encrypted notes server ke liye kaise unreadable hain?\n\nBrowser me hi sab hota hai (WebCrypto). Har user ki ECDH P-256 private key browser ke IndexedDB me, non-extractable. Workspace key K (random AES-GCM 256) har member ke liye alag wrap hoti hai (ECDH -> HKDF -> AES-GCM) aur server wrapped bytes rakhta hai. Note AES-GCM se encrypt hota hai; extra data (AAD) `workspace|contact|author` hota hai, to note ko dusri conversation ya dusre author ke naam pe nahi khiska sakte (decrypt fail). Server sirf `ciphertext` aur `iv` dekhta hai. Note edit/delete UI jaanbujhkar nahi hai.\n\n**Code me kahan:** `web/src/crypto.ts:encryptNote`, `noteAad`, `wrapWorkspaceKey`; `web/src/keyring.ts`; `routes/notes.ts`; `PROTOCOL.md`.\n\n---\n\n### Q21. Workspace key kaun banata hai, race ho to?\n\nPehla member `POST /api/workspaces/:ws/keyring` karta hai. Server `keyring` me `{ws}` unique insert karta hai; jo pehle aaya wo jeeta, doosre ko 409 (\"workspace key already exists\"). Ek khaas case: creator ka pehla try beech me mar gaya, to wahi creator dobara aake kaam poora kar sakta hai (`ring.creator === me.sub` aur uske paas wrappedKey nahi). Doosre members ko K dene ka `PUT .../keys/:sub` filter `wrappedKey: {$exists: false}` rakhta hai (first write wins), to koi mojooda key overwrite nahi kar sakta.\n\n**Code me kahan:** `routes/notes.ts` (`keyring` route lines 55-72, `PUT keys/:sub` lines 74-88), `test/notes.test.ts`.\n\n---\n\n### Q22. Unread state kaise kaam karta hai?\n\nServer pe nahi, browser ke `localStorage` me (key `switchboard.unread.<workspace>`). Do timestamps per contact: `inbound` (jab customer ka message aaya) aur `seen` (jab agent ne conversation kholi). `isUnread = inbound > seen`. Tab title me `(count) Switchboard`. Fayda: backend change nahi. Nuksaan: doosre device pe alag state. DECISIONS.md kehta hai agent aksar ek device se kaam karta hai; agla step server read-model hota.\n\n**Code me kahan:** `web/src/unread.ts:useUnread`.\n\n---\n\n### Q23. `/people` endpoint kyun hai?\n\nUI me id ki jagah naam dikhane ke liye (\"Ben Ortiz\"). Brief me koi directory nahi di, to `auth.ts` callback me login pe har workspace ke liye `people` collection me `{sub, name, email}` upsert hota hai. `GET /api/workspaces/:ws/people` wahi list deta hai, member check ke baad; aur agar tum list me nahi ho to khud ko jod deta hai. Jisne kabhi app khola hi nahi wo \"Teammate\" dikhta hai. Frontend `usePeople` 30 s se pehle dobara lookup nahi karta.\n\n**Code me kahan:** `routes/api.ts` (line 68-76), `routes/auth.ts` (line 40-45), `web/src/people.ts`.\n\n---\n\n### Q24. Agar server graceful band ho ya do copies chalein, outbox ka kya hota hai?\n\n`SIGTERM` pe `stopSender()` loop rok deta hai aur server 2 s me exit. Agar kisi send ke beech process mar gaya to row `lockedUntil` ke baad (20 s) kisi bhi copy ko \"due\" dikhti hai, aur wo dobara bhejti hai, jo Idempotency-Key ki wajah se safe hai. Isliye failover me ~20 s tak lag sakta hai (DECISIONS.md). `tick()` pehle `findOne` se dekhta hai, phir rate token leta hai, phir `findOneAndUpdate` se atomically lease leta hai; do copies ek hi row nahi utha sakti.\n\n**Code me kahan:** `lib/outbox.ts:tick`, `startSender`, `stopSender`; `index.ts` signal handlers; `config.ts:leaseMs`.\n\n---\n\n### Q25. Customer message se closed conversation kyun reopen hoti hai, aur ye kahan hota hai?\n\nBrief khamosh thi, ye humne choose kiya (DECISIONS.md). `storeInbound` `touchConversation(..., reopen = fresh)` bulata hai: sirf jab message pehli baar store hua (`fresh`), closed conversation `open` ban jati hai. Isi `fresh` flag ki wajah se Q1 wali kamzori hai.\n\n**Code me kahan:** `lib/conversations.ts:touchConversation` (last line `if (reopen) ...`), `lib/inbound.ts:storeInbound`.\n\n---\n\n# 3. Agar interviewer bole \"code badlo\"\n\nPehle chhota rule: badlav ke baad `npm --prefix scaffold/server test` chalao (MongoDB + Redis chahiye) aur bolo kaunsa test is part ko cover karta hai.\n\n### Task 1. Rate limit badlo (jaise 6 se 4 per burst)\n\n**File:** `scaffold/server/src/lib/ratelimit.ts`, lines 5-6.\n**How-to:** `const CAP = 6;` aur `const RATE = 3.5;` badlo. Pigeon ka asli limit 8 burst, 4/s hai (PIGEON.md), isse upar mat jao warna 429 milenge. `test/ratelimit.test.ts` ka pehla test `granted >= 5 && <= 7` maanta hai, use bhi update karo.\n\n### Task 2. Snapshot me ek field jodo (jaise conversation ka `status`)\n\n**File:** `scaffold/server/src/routes/grader.ts`, lines 38-41.\n**How-to:** Line 38 ke type me `status?: string` jodo; line 41 pe `cv.assignee` ke saath `.status = cv.status` set karo (loop `for (const cv of await convs.find({ ws }))`). Field `Conv` type me pehle se hai (`db.ts:13`).\n\n### Task 3. Nayi message status jodo (jaise `read`)\n\n**Files:** `scaffold/server/src/db.ts:24` (`OutStatus`), `scaffold/server/src/lib/inbound.ts:5` (`RANK`), `scaffold/web/src/types.ts:3` (`MessageStatus`), `scaffold/web/src/messages.ts:4` (`rank`), `scaffold/web/src/components/MessageBubble.tsx` (label + icon, lines ~17-24).\n**How-to:** `RANK` me `read: 3` jodo (`isStatus` apne aap `RANK` ke keys se chalta hai, to webhook me `read` ab accept hoga). Web me type, rank aur label jodo. Rank ka number \"delivered\" se bada rakhna taaki status sirf aage badhe.\n\n### Task 4. Lease time badlo (20 s se 10 s)\n\n**File:** `scaffold/server/src/config.ts`, line 47 (`leaseMs: 20_000`).\n**How-to:** Value badlo. Lease hamesha `sendTimeoutMs` (line 48, 6000) se kafi bada rakho, warna doosri copy usi row ko beech me utha legi. Double send tab bhi Idempotency-Key se rukta hai, par yeh bolna mat bhoolna. Failover time bhi chhota ho jayega.\n\n### Task 5. Naya webhook type jodo (jaise `message.read`)\n\n**Files:** `scaffold/server/src/routes/webhook.ts` (line 24 allow-list, aur lines 28-41 branch), `scaffold/server/src/lib/inbound.ts` (naya function), `scaffold/web/src/types.ts` (`Frame` union).\n**How-to:** Line 24 me `evt.type !== 'message.read'` bhi allow karo (warna \"unknown type\" ack hoke ignore hota hai). `else if (evt.type === 'message.read')` branch me naya `storeRead()` bulao jo `storeStatus` jaisa ho: `outbox` update + `addFrame(ws, 'rd:<client_ref>', {...})` (key unique rakho, taaki duplicate safe rahe). Web me `Frame` union me naya type jodo.\n\n### Task 6. Chhote config badlav: page size, reply length, ya webhook window\n\n**Files:** `routes/api.ts:65` (`pageSize`, default 30, max 100); `routes/api.ts:145` (reply max 4000 chars); `lib/signature.ts:5` (`TOLERANCE_SEC = 300`); `config.ts:46` (`sessionTtlSec`).\n**How-to:** Number badlo. Signature window badlo to `test/signature.test.ts` aur `test/webhook.test.ts` ke \"four minutes accepted\" jaise tests bhi update karo (PIGEON.md ke hisaab se 5 minute hi sahi hai). Session TTL chhota karne se \"removed user\" wali kamzori kam hoti hai.\n\n---\n\n*Yaad rakho:* interviewer ko jawab do \"kya kiya, kyun, trade-off kya, kahan hai\". Jo cheez code me nahi, usse ban ke mat bolo; `DECISIONS.md` ki list seedha maan lo.\nEOF\nwc -l /tmp/pdf-parts/B.md"
}
```


---

## user  
2026-11-25T13:56:52.245Z

**tool result**

```
     352 /tmp/pdf-parts/B.md
```


---

## assistant  
2026-11-25T13:56:54.823Z

_thinking_




---

## assistant  
2026-11-25T13:56:57.586Z

**tool call: SubagentHandback**

```
{
  "message": "/tmp/pdf-parts/B.md is written (about 350 lines of Hinglish Markdown). It has three sections:\n- **Code ka tour:** every server file and the main web files, grouped as entry, routes, lib, tests and web.\n- **Interview ke 25 sawal aur jawab:** 25 questions, each with a short spoken answer and a \"Code me kahan\" line. Your required questions (a) to (h) are Q1 to Q8; the rest cover duplicates, ordering, signatures, rate limiting, retry rules, claim races, Redis plus Mongo, WebSocket replay, auth, tenant isolation, NoSQL injection, notes, unread state and the people endpoint.\n- **Agar interviewer bole code badlo:** 6 live-change tasks (rate limit, snapshot field, new status, lease time, new webhook type, small config values), each with the files and line numbers to touch and a short how-to.\n\nI read the server code, tests, web files, DECISIONS.md, PROTOCOL.md, README.md and PIGEON.md before writing, and did not run the tests. No repo file was edited."
}
```


---

## user  
2026-11-25T13:56:57.682Z

**tool result**

```
{"success":true,"message":"Report delivered to your caller."}
```

