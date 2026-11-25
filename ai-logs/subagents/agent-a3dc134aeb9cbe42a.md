# Claude Code sub-agent session agent-a3dc134aeb9cbe42a

Plain rendering of the adjacent `.jsonl` file, which is the unedited export. Nothing is removed except binary image data.


---

## user  
2026-11-25T13:53:52.406Z

You are writing PART A of a personal study guide (it will be turned into a PDF) for a candidate who must explain their take-home project in a follow-up interview. The reader is NOT an expert: they want to understand the project in very simple language. Write in simple Hinglish (Roman Hindi mixed with English technical words, the way an Indian engineer talks to a friend), short sentences, friendly tone, NO heavy jargon without an immediate plain explanation, use everyday analogies (post office, bank locker, shop counter, etc). Do not mention anything about AI hiding or the user's private chat. Do NOT edit any repo file; write ONLY your output file /tmp/pdf-parts/A.md (create the directory) in Markdown.

Source of truth: read the project in /Users/apple/Desktop/repo-new/gohlai-assessment (BRIEF.md, PIGEON.md, README.md, DECISIONS.md, PROTOCOL.md, CHECK_REPORT.json and the code in scaffold/server/src and scaffold/web/src). Do not invent features; every claim must match the code.

Write these sections (use `##` headings, each under ~350 words, with small ASCII or bullet diagrams where helpful):
1. 'Assignment kya tha' - the Switchboard problem in plain words: customers, support agents, workspaces, Pigeon (unreliable messaging provider), the 5 levels of the check and what each level tests, and how scoring works (85 points automatic check, security 4, quality 5, frontend 3, AI use 3, bonus billing 10).
2. 'Humne kya banaya (bade picture)' - the whole system in one story with a diagram: Pigeon -> webhook -> MongoDB -> Redis -> WebSocket -> browser, and agent reply -> outbox -> Pigeon. Explain each box with an analogy.
3. 'Chhoti chhoti cheezein jo sabse zyada poochhi jayengi' - plain explanations (analogy + the exact file name where it lives) of: webhook signature (HMAC) and the 5-minute rule; idempotency (why the same message twice does not matter); why we store first and answer 2xx after; ordering by occurred_at; outbox + lease + Idempotency-Key (why a reply is never lost and never sent twice, even if the server is killed); the Redis token bucket (rate limit shared across copies) and Retry-After; the claim race (unique index, one winner); seq numbers and the frames table and how WebSocket reconnect replays missed messages (?after=); login with OIDC + PKCE (state, nonce) in kid-friendly steps; tenant isolation (why one workspace never sees another's data).
4. 'Numbers jo yaad rakhne hain' - the key numbers (lease 20 s, rate limit 3.5/s burst 6, 5 min webhook window, 6 s send timeout, 8 h session, 75/75 check score, 43 tests) with where each is set in code (file name).
Keep every explanation correct and concrete. Final message: just say the file is written (one line).


---

## user  
2026-11-25T13:53:52.428Z

<system-reminder>
Your final report is delivered through SubagentHandback: when your work is complete, call SubagentHandback({message: <your full report>}). The call ends your run, so make it your last step. Only a SubagentHandback call reaches your caller as your result; plain text you write at the end is not delivered. Do not also send the report with SendMessage: your caller would get it twice.
</system-reminder>


---

## assistant  
2026-11-25T13:53:53.987Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; ls; wc -c BRIEF.md PIGEON.md README.md DECISIONS.md PROTOCOL.md CHECK_REPORT.json; find scaffold/server/src scaffold/web/src -type f | head -80"
}
```


---

## assistant  
2026-11-25T13:53:54.339Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; cat BRIEF.md PIGEON.md | head -400"
}
```


---

## user  
2026-11-25T13:53:55.024Z

**tool result**

```
# Switchboard — build round

Build the first version of **Switchboard**, a shared team inbox. Customers
write to a business over a messaging provider. Support agents (people who work
at that business) log in, see conversations arrive in real time, reply, and
leave private notes for each other.

Several businesses (workspaces) use the same deployment. They must never see
each other's data.

**You will not finish everything below.** That is intended. Build the product
first, then make it survive: a small product that keeps working when the
network is bad, the process dies or a second copy is started beats a large one
that works only on the happy path.

Use any AI tools you like. You own every line you submit: in the follow-up
call we open your code, ask why it is the way it is, and debug it with you.

## The two hours

| Time | What |
| --- | --- |
| 0:00 – 0:10 | Read `START_HERE.md` and this brief. Start the services. |
| 0:10 – 1:50 | Build. Commit at least every 15 minutes. |
| 1:50 – 2:00 | Run the full check, push, make the repository public, send the form. See `SUBMISSION.md`. |

The form closes at 2:00. What counts is the commit you name in the form.

## How it fits together

`​``
simulated customers -> Pigeon :4010 --webhook POST--> YOUR SERVER --WebSocket--> YOUR REACT APP
        (given)          (given)                      (you build)                 (you build)

agent types a reply -> YOUR SERVER -> POST /v1/messages on Pigeon -> status webhooks back to you
`​``

You build the business side only. The customers are simulated and live inside
Pigeon; there is no customer app, and they do not answer your replies.

| Service | Port | What it is |
| --- | --- | --- |
| Pigeon | 4010 | The messaging provider (simulated). Sends you webhooks, accepts your sends. Unreliable on purpose. See `PIGEON.md`. |
| Mock IdP | 4020 | OpenID Connect provider with five test users. Discovery at `/.well-known/openid-configuration`. Client id `switchboard-web`. PKCE (S256) is required. |
| MongoDB | 27017 | Real. |
| Redis | 6379 | Real. |
| Elasticsearch | 9200 | Real, optional: `npm run up:search`. |
| Paybox | 4030 | Simulated payment provider. Only for the bonus. See `PAYBOX.md`. |

`scaffold/` is an optional empty shell (Express + TypeScript server, Vite +
React app, already pointed at the services). It has no product code. Use it,
or delete it and bring your own Node stack; then change the `start` command in
`switchboard.json`.

## What to build

### The product
1. **Login.** Sign in through the IdP (authorization code + PKCE). A user's
   workspaces and roles come from the `workspaces` claim. Roles: `admin`, `agent`.
2. **Receive messages.** Accept Pigeon webhooks at `POST /webhooks/pigeon`.
   Pigeon is not a friendly network: read `PIGEON.md` before you write this.
3. **Inbox.** Conversations per contact, newest activity first, paginated.
   Open a conversation and read its messages in order. An agent can claim a
   conversation; two agents cannot both hold it. Close and reopen.
4. **Reply.** An agent replies and the message goes out through Pigeon. The
   agent sees its status: queued, sent, delivered, failed. A customer must
   never receive the same reply twice, and a reply must not be lost.
5. **Real time.** New messages, status changes and assignments appear without
   a refresh (WebSockets). A client that drops and reconnects misses nothing.
6. **Frontend.** A React app an agent could actually use for the above.

### Making it survive: the five levels
The automatic check has five levels. Each is worth points on its own. You can
run all of them yourself except level 4.

| Level | Situation | Points |
| --- | --- | --- |
| 1 | One copy of your server. Webhooks arrive duplicated, out of order, forged and replayed. Pigeon rate-limits you, answers slowly, and goes down for a while. Six agents claim one conversation in the same instant. | 24 |
| 2 | Your server is **killed without warning** (`kill -9`) and started again a few seconds later: once in the middle of a flood of webhooks, once just after it accepted a batch of replies. Nothing may be lost, duplicated or sent twice. | 14 |
| 3 | **Several copies** of your server run behind a load balancer and share MongoDB and Redis. Everything in level 1 must still hold, the rate limit is per workspace and not per copy, and when one copy dies for good the others finish its work within 60 seconds. | 22 |
| 4 | **The written rules.** Not in the check you can run. We send your server the awkward cases that `PIGEON.md` ("How your endpoint must answer") and the contract below describe in words. Ten rules, one point each. | 10 |
| 5 | **Login, tenant isolation and real time**, with several copies running. The check signs in through the IdP as a browser would, calls your API as a user of one workspace, and listens on your WebSocket while customers write. | 15 |

### Also valued (reviewed, not checked automatically)
- **Private notes, end-to-end encrypted.** Agents leave a note on a
  conversation for other agents in the workspace. The server stores it but
  must not be able to read it. Write `PROTOCOL.md`: who holds which key, what
  the server stores, and three attacks your scheme does **not** stop.
- **Tests** for the two or three pieces of logic most likely to be wrong.
- **Search** over messages with Elasticsearch, limited to the user's workspace.
- **Bonus: billing.** Per-seat subscriptions through Paybox. Scored separately
  (10 bonus points). See `BONUS_BILLING.md`. Last, if at all.

## The contract the check relies on

Keep these exactly as written. Everything else about your API is yours.

**A. `switchboard.json`** in the repository root holds the command that starts
your server from a clean clone after `install`. The check runs it itself.

`​``json
{ "install": "npm run scaffold:install", "start": "npm --prefix scaffold/server start", "health": "/healthz" }
`​``

**B. Configuration comes from the environment.** Your server listens on the
port in `PORT` and reads every URL and secret from the variables in
`.env.example`. Hard-coded ports or URLs will fail the check. The health path
answers `200` once the server is ready for traffic, and the check waits for that.

**C. Webhook path:** `POST /webhooks/pigeon`.

**D. Check endpoints**, protected by header `x-grader-token` equal to the env
var `GRADER_TOKEN`; without it, or with a wrong one, they answer `401`. They must go through the same code paths your UI uses.

| Endpoint | What it does |
| --- | --- |
| `POST /__grader/reset` | Delete all application data, in MongoDB and Redis (login sessions may stay). Answer `200`. |
| `GET /__grader/snapshot` | Return what your system currently believes (shape below). |
| `POST /__grader/reply` `{ workspace, contact, text, client_ref }` | Send a reply to that contact as if an agent typed it, using the given `client_ref` with Pigeon. The contact may not have written yet: the reply still goes out and a conversation now exists. Answer `202` once it is safely stored. The same `client_ref` asked twice, even at the same instant, is one reply and both requests get `202`. A workspace that does not exist is a `4xx`. |
| `POST /__grader/claim` `{ workspace, contact, agent }` | Agent claims that contact's conversation. `200` if this agent now holds it, `409` if someone else does. The holder claiming again gets `200`. If the contact has not written yet, the claim creates the conversation. `agent` is an opaque id; do not look it up in the IdP. |

**E. Login and API**, used by level 5 and by your own frontend.

| Endpoint | What it does |
| --- | --- |
| `GET /auth/login` | Redirects the browser to the IdP (authorization code + PKCE). |
| `GET /auth/callback` | Finishes the login and sets a session cookie. |
| `GET /api/me` | `200 { "sub": "u_ben", "workspaces": [{ "id": "ws_acme", "role": "agent" }] }` with a session, `401` without. |
| `GET /api/conversations?workspace=<id>` | The inbox list, in any shape you like. `200` for a member of that workspace, `403` for a signed-in user who is not a member, `401` without a session. |

**F. WebSocket:** `GET /ws?workspace=<id>`, authenticated by the same session
cookie. Refuse the upgrade without a session, or for a workspace the user is
not a member of. Send JSON text frames. Every frame that reports a change
carries `seq`, an integer that only goes up within a workspace:

`​``json
{ "seq": 41, "type": "message.inbound", "contact": "+14155550101", "message_id": "pmsg_00001ab12" }
{ "seq": 42, "type": "message.status", "contact": "+14155550101", "client_ref": "<ref>", "status": "delivered" }
{ "seq": 43, "type": "conversation.assigned", "contact": "+14155550101", "assignee": "u_ben" }
`​``

Add any other fields you need. `GET /ws?workspace=<id>&after=41` first sends
every frame after 41 that the client missed, then continues live. With several
copies running, a browser connected to one copy must receive what another
copy processed.

The snapshot shape:

`​``json
{
  "workspaces": {
    "ws_acme": {
      "contacts": {
        "+14155550101": { "inbound": ["pmsg_00001ab12", "pmsg_00007cd34"], "assignee": "u_ben" }
      },
      "outbound": { "<client_ref>": "delivered" }
    }
  }
}
`​``

`inbound` is the list of Pigeon `message_id`s for that contact, in the order
your UI shows them, oldest first. `assignee` is who holds the conversation, or
`null`. `outbound` maps the `client_ref` of each message you sent to its
current status.

## Checking yourself

The check is the same program we run on your final commit. We run it with
larger numbers, three copies, different timing, and level 4 added. Reading
`harness/check.js` is allowed and sensible.
Do the levels in the order 1, 5, 2, 3: a product people can log in to comes
before one that survives a crash.

`​``
npm run check         # level 1 only, about 90 seconds
npm run check:full    # levels 1, 2, 3 and 5, about 4 minutes, writes CHECK_REPORT.json
npm run check -- --levels 5     # one level on its own (or several: --levels 1,5)
`​``

Stop your own dev server first: the check starts your server itself (from
`switchboard.json`) behind a small load balancer on port 4000. **It deletes
your application data.** Server output goes to `.check-logs/`.

## How you are scored

| | Points |
| --- | --- |
| The check: levels 1 to 5 | 24 + 14 + 22 + 10 + 15 = **85** |
| Security beyond the check: sessions, secrets, encrypted notes if attempted | 4 |
| Data model, structure, code quality and tests | 5 |
| The frontend, and what you chose to build and cut | 3 |
| How you worked with AI (from `ai-logs/`) | 3 |

A submission whose check cannot start scores 0 of 85, so keep
`npm run check` working from your first hour on.

## What the repository must contain

- The code, with history.
- `README.md`: how to run it from a clean clone.
- `switchboard.json`: correct `install` and `start` commands.
- `DECISIONS.md`, half a page: what you built, what you cut and why, what you
  assumed where this brief is silent, and **what you know is still wrong**.
  An honest "level 3 loses replies when a copy dies; I think it is the lock"
  is worth more than silence.
- `CHECK_REPORT.json`: written by your last `npm run check:full`.
- `ai-logs/`: exported transcripts of every AI session you used. Required:
  without them the AI part scores 0 and your submission goes to manual review.
- `PROTOCOL.md`, only if you attempted encrypted notes.

This brief leaves several things unsaid. When you hit one, decide, write the
decision in `DECISIONS.md`, and move on. Questions go in the question channel;
answers go to everyone.
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
`​``

Body, status of a message you sent:

`​``json
{ "id": "evt_...", "type": "message.status", "workspace": "ws_acme",
  "occurred_at": "2026-11-18T09:30:02.456Z",
  "data": { "message_id": "pm_...", "client_ref": "<yours>", "status": "sent" } }
`​``

`status` is `sent`, then `delivered` or `failed`.

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

## user  
2026-11-25T13:53:55.037Z

**tool result**

```
BONUS_BILLING.md
BRIEF.md
CHECK_REPORT.json
DECISIONS.md
PAYBOX.md
PIGEON.md
PROTOCOL.md
README.md
REFERENCE.html
REFERENCE.pdf
START_HERE.md
SUBMISSION.md
docker-compose.yml
docs
harness
idp
package.json
paybox
pigeon
scaffold
switchboard.json
   11606 BRIEF.md
    5200 PIGEON.md
    6551 README.md
    5651 DECISIONS.md
    5457 PROTOCOL.md
    6049 CHECK_REPORT.json
   40514 total
scaffold/server/src/redis.ts
scaffold/server/src/ws.ts
scaffold/server/src/index.ts
scaffold/server/src/config.ts
scaffold/server/src/db.ts
scaffold/web/src/App.tsx
scaffold/web/src/main.tsx
scaffold/web/src/messages.ts
scaffold/web/src/keyring.ts
scaffold/web/src/people.ts
scaffold/web/src/crypto.ts
scaffold/web/src/api.ts
scaffold/web/src/types.ts
scaffold/web/src/format.ts
scaffold/web/src/vite-env.d.ts
scaffold/web/src/useLatest.ts
scaffold/web/src/unread.ts
scaffold/web/src/useSocket.ts
scaffold/server/src/lib/conversations.ts
scaffold/server/src/lib/outbox.ts
scaffold/server/src/lib/signature.ts
scaffold/server/src/lib/frames.ts
scaffold/server/src/lib/inbound.ts
scaffold/server/src/lib/ratelimit.ts
scaffold/server/src/lib/session.ts
scaffold/server/src/lib/cookies.ts
scaffold/server/src/lib/oidc.ts
scaffold/server/src/routes/api.ts
scaffold/server/src/routes/notes.ts
scaffold/server/src/routes/webhook.ts
scaffold/server/src/routes/grader.ts
scaffold/server/src/routes/auth.ts
scaffold/web/src/styles/tokens.css
scaffold/web/src/styles/thread.css
scaffold/web/src/styles/layout.css
scaffold/web/src/styles/panel.css
scaffold/web/src/styles/base.css
scaffold/web/src/components/Toasts.tsx
scaffold/web/src/components/ThreadHeader.tsx
scaffold/web/src/components/Inbox.tsx
scaffold/web/src/components/ReplyBox.tsx
scaffold/web/src/components/NotesPanel.tsx
scaffold/web/src/components/Workspace.tsx
scaffold/web/src/components/InfoPanel.tsx
scaffold/web/src/components/MessageBubble.tsx
scaffold/web/src/components/Avatar.tsx
scaffold/web/src/components/icons.tsx
scaffold/web/src/components/ConversationRow.tsx
scaffold/web/src/components/Rail.tsx
scaffold/web/src/components/Thread.tsx
scaffold/web/src/components/SignIn.tsx
```


---

## assistant  
2026-11-25T13:53:56.664Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment; cat README.md DECISIONS.md; head -c 2500 CHECK_REPORT.json; cd scaffold/server/src; wc -l *.ts lib/*.ts routes/*.ts"
}
```


---

## assistant  
2026-11-25T13:53:57.218Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; cat config.ts lib/signature.ts routes/webhook.ts lib/inbound.ts lib/outbox.ts lib/ratelimit.ts"
}
```


---

## user  
2026-11-25T13:53:57.910Z

**tool result**

```
import { randomBytes } from 'node:crypto';

try {
  process.loadEnvFile(new URL('../../../.env', import.meta.url));
} catch {
  // no .env, defaults apply
}

const env = (name: string, fallback: string) => process.env[name] ?? fallback;

if (process.env.NODE_ENV === 'production' && !process.env.GRADER_TOKEN) {
  throw new Error('GRADER_TOKEN must be set in production');
}

const apiKeys: Record<string, string> = {
  ws_acme: env('PIGEON_KEY_WS_ACME', 'pk_acme_7d1f0a'),
  ws_globex: env('PIGEON_KEY_WS_GLOBEX', 'pk_globex_c93b22'),
};

export const config = {
  port: Number(env('PORT', '4000')),
  webOrigin: env('WEB_ORIGIN', 'http://localhost:5173'),
  // without GRADER_TOKEN the check endpoints are unreachable instead of open to a known default
  graderToken: process.env.GRADER_TOKEN ?? randomBytes(24).toString('hex'),
  mongoUrl: env('MONGO_URL', 'mongodb://localhost:27017/switchboard'),
  redisUrl: env('REDIS_URL', 'redis://localhost:6379'),
  elasticsearchUrl: env('ELASTICSEARCH_URL', 'http://localhost:9200'),
  workspaces: Object.keys(apiKeys),
  pigeon: {
    url: env('PIGEON_URL', 'http://localhost:4010'),
    webhookSecret: env('PIGEON_WEBHOOK_SECRET', 'whsec_pigeon_dev'),
    apiKeys,
  },
  oidc: {
    issuer: env('OIDC_ISSUER', 'http://localhost:4020'),
    clientId: env('OIDC_CLIENT_ID', 'switchboard-web'),
    clientSecret: env('OIDC_CLIENT_SECRET', 'dev-secret-not-for-production'),
    redirectUri: env('OIDC_REDIRECT_URI', 'http://localhost:4000/auth/callback'),
  },
  paybox: {
    url: env('PAYBOX_URL', 'http://localhost:4030'),
    secretKey: env('PAYBOX_SECRET_KEY', 'sk_test_paybox_51c0de'),
    publishableKey: env('PAYBOX_PUBLISHABLE_KEY', 'pk_test_paybox_9a7b3e'),
    webhookSecret: env('PAYBOX_WEBHOOK_SECRET', 'whsec_paybox_dev'),
  },
  sessionTtlSec: 8 * 3600,
  leaseMs: 20_000,
  sendTimeoutMs: 6_000,
};

export const isWorkspace = (id: unknown): id is string =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(apiKeys, id);
import { createHmac, timingSafeEqual } from 'node:crypto';

export type SigResult = 'ok' | 'bad' | 'stale';

const TOLERANCE_SEC = 300;

export function checkSignature(header: string | undefined, raw: Buffer, secret: string, nowSec = Date.now() / 1000): SigResult {
  if (!header) return 'bad';
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return i < 0 ? ['', ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !/^\d{1,12}$/.test(t) || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return 'bad';
  const expected = createHmac('sha256', secret).update(`${t}.`).update(raw).digest();
  const given = Buffer.from(v1, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'bad';
  return Math.abs(nowSec - Number(t)) > TOLERANCE_SEC ? 'stale' : 'ok';
}
import { Router, raw } from 'express';
import { config, isWorkspace } from '../config.js';
import { checkSignature } from '../lib/signature.js';
import { storeInbound, storeStatus } from '../lib/inbound.js';

export const webhook = Router();

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

webhook.post('/webhooks/pigeon', raw({ type: () => true, limit: '256kb' }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const sig = checkSignature(req.header('x-pigeon-signature'), body, config.pigeon.webhookSecret);
  if (sig !== 'ok') return res.status(401).json({ error: sig === 'stale' ? 'stale timestamp' : 'bad signature' });

  let evt: unknown;
  try {
    evt = JSON.parse(body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid json' });
  }
  if (!isObj(evt)) return res.status(400).json({ error: 'invalid event' });
  // unknown types and workspaces are acknowledged, otherwise Pigeon keeps retrying
  if (evt.type !== 'message.inbound' && evt.type !== 'message.status') return res.json({ ok: true, ignored: 'type' });
  if (!isWorkspace(evt.workspace)) return res.json({ ok: true, ignored: 'workspace' });
  if (!isObj(evt.data)) return res.status(400).json({ error: 'invalid event' });

  try {
    if (evt.type === 'message.inbound') {
      const d = evt.data;
      const at = new Date(evt.occurred_at);
      if (!str(d.message_id) || !str(d.from) || typeof d.text !== 'string' || Number.isNaN(at.getTime())) {
        return res.status(400).json({ error: 'invalid inbound' });
      }
      await storeInbound(evt.workspace, { message_id: d.message_id, from: d.from, text: d.text }, at);
    } else if (evt.type === 'message.status') {
      const d = evt.data;
      // no client_ref means it is not one of ours
      if (!str(d.client_ref) || !str(d.status)) return res.json({ ok: true, ignored: 'status' });
      await storeStatus(evt.workspace, { message_id: str(d.message_id) ? d.message_id : undefined, client_ref: d.client_ref, status: d.status });
    }
  } catch (err) {
    console.error('webhook store failed', err);
    return res.status(503).json({ error: 'try again' });
  }
  res.json({ ok: true });
});
import { cols, isDup, type OutStatus } from '../db.js';
import { addFrame } from './frames.js';
import { touchConversation } from './conversations.js';

export const RANK: Record<OutStatus, number> = { queued: 0, sent: 1, delivered: 2, failed: 2 };
const isStatus = (s: unknown): s is OutStatus => typeof s === 'string' && s in RANK && s !== 'queued';

export async function storeInbound(ws: string, d: { message_id: string; from: string; text: string }, occurredAt: Date) {
  const { messages } = await cols();
  let fresh = false;
  try {
    const res = await messages.updateOne(
      { ws, messageId: d.message_id },
      { $setOnInsert: { ws, contact: d.from, messageId: d.message_id, text: d.text, occurredAt, receivedAt: new Date() } },
      { upsert: true },
    );
    fresh = res.upsertedCount === 1;
  } catch (e) {
    if (!isDup(e)) throw e;
  }
  await touchConversation(ws, d.from, occurredAt, d.text, fresh);
  await addFrame(ws, `in:${d.message_id}`, {
    type: 'message.inbound',
    contact: d.from,
    message_id: d.message_id,
    text: d.text,
    occurred_at: occurredAt.toISOString(),
  });
}

export async function storeStatus(ws: string, d: { message_id?: string; client_ref: string; status: string }) {
  if (!isStatus(d.status)) return;
  const { outbox } = await cols();
  const doc = await outbox.findOne({ ws, clientRef: d.client_ref });
  if (!doc) return;
  const rank = RANK[d.status];
  await outbox.updateOne(
    { ws, clientRef: d.client_ref, rank: { $lt: rank } },
    { $set: { status: d.status, rank, sendDone: true, ...(d.message_id ? { pigeonId: d.message_id } : {}) } },
  );
  const now = await outbox.findOne({ ws, clientRef: d.client_ref });
  if (now?.status !== d.status) return;
  await addFrame(ws, `st:${d.client_ref}:${d.status}`, {
    type: 'message.status',
    contact: doc.contact,
    client_ref: d.client_ref,
    status: d.status,
  });
}
import type { WithId } from 'mongodb';
import { cols, isDup, type Out } from '../db.js';
import { config } from '../config.js';
import { addFrame } from './frames.js';
import { touchConversation } from './conversations.js';
import { acquire, refund, pause } from './ratelimit.js';
import { RANK } from './inbound.js';

export async function createReply(ws: string, contact: string, text: string, clientRef: string, sender: string) {
  const { outbox } = await cols();
  const now = new Date();
  const doc: Out = {
    ws,
    contact,
    clientRef,
    text,
    sender,
    status: 'queued',
    rank: 0,
    createdAt: now,
    attempts: 0,
    nextAttemptAt: now,
    lockedUntil: new Date(0),
    sendDone: false,
  };
  try {
    await outbox.insertOne(doc);
  } catch (e) {
    if (!isDup(e)) throw e;
  }
  // every step below is idempotent, so a repeated request finishes whatever a crashed one left undone
  const stored = (await outbox.findOne({ ws, clientRef })) ?? doc;
  await touchConversation(ws, contact, stored.createdAt, text, false);
  await addFrame(ws, `out:${clientRef}`, {
    type: 'message.outbound',
    contact,
    client_ref: clientRef,
    text: stored.text,
    sender: stored.sender,
    status: 'queued',
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_INFLIGHT = 4;
const inflight = new Map<string, number>();

async function attempt(doc: WithId<Out>) {
  const { outbox } = await cols();
  const back = (ms: number) =>
    outbox.updateOne({ _id: doc._id }, { $set: { lockedUntil: new Date(0), nextAttemptAt: new Date(Date.now() + ms) } });
  const retryLater = () => back(Math.min(500 * 2 ** Math.min(doc.attempts, 4), 8000) + Math.random() * 300);

  let res: Response;
  try {
    res = await fetch(`${config.pigeon.url}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.pigeon.apiKeys[doc.ws]}`,
        'idempotency-key': doc.clientRef,
      },
      body: JSON.stringify({ to: doc.contact, text: doc.text, client_ref: doc.clientRef }),
      signal: AbortSignal.timeout(config.sendTimeoutMs),
    });
  } catch {
    await pause(doc.ws, 800);
    return retryLater();
  }

  if (res.ok) {
    const out = (await res.json().catch(() => ({}))) as { id?: string };
    await outbox.updateOne({ _id: doc._id }, { $set: { sendDone: true, lockedUntil: new Date(0), ...(out.id ? { pigeonId: out.id } : {}) } });
    return;
  }
  if (res.status === 429) {
    const wait = Number(res.headers.get('retry-after')) || 2;
    await pause(doc.ws, wait * 1000 + 250);
    return back(wait * 1000 + 250);
  }
  if (res.status >= 500 || res.status === 408 || (res.status >= 300 && res.status < 400)) {
    await pause(doc.ws, 1000);
    return retryLater();
  }
  // other 4xx is probably final, but give a transient auth or conflict error a few tries
  if (doc.attempts < 5) return retryLater();
  await addFrame(doc.ws, `st:${doc.clientRef}:failed`, { type: 'message.status', contact: doc.contact, client_ref: doc.clientRef, status: 'failed' });
  await outbox.updateOne(
    { _id: doc._id, rank: { $lt: RANK.failed } },
    { $set: { status: 'failed', rank: RANK.failed, sendDone: true, lockedUntil: new Date(0) } },
  );
}

async function tick(): Promise<boolean> {
  const { outbox } = await cols();
  let worked = false;
  for (const ws of config.workspaces) {
    if ((inflight.get(ws) ?? 0) >= MAX_INFLIGHT) continue;
    const now = new Date();
    const due = { sendDone: false, ws, nextAttemptAt: { $lte: now }, lockedUntil: { $lte: now } };
    if (!(await outbox.findOne(due, { projection: { _id: 1 } }))) continue;
    if (!(await acquire(ws))) continue;
    const doc = await outbox.findOneAndUpdate(
      due,
      { $set: { lockedUntil: new Date(now.getTime() + config.leaseMs) }, $inc: { attempts: 1 } },
      { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
    );
    if (!doc) {
      await refund(ws);
      continue;
    }
    worked = true;
    inflight.set(ws, (inflight.get(ws) ?? 0) + 1);
    attempt(doc)
      .catch((e) => console.error('send attempt failed', e))
      .finally(() => inflight.set(ws, (inflight.get(ws) ?? 1) - 1));
  }
  return worked;
}

let running = false;
export function startSender() {
  running = true;
  (async () => {
    while (running) {
      let worked = false;
      try {
        worked = await tick();
      } catch (e) {
        console.error('sender tick', e);
      }
      await sleep(worked ? 15 : 200);
    }
  })();
}
export const stopSender = () => {
  running = false;
};
import { getRedis } from '../redis.js';

// Pigeon allows a burst of 8 and refills 4 a second per workspace. We stay a
// little under that, and share the bucket between all copies through Redis.
const CAP = 6;
const RATE = 3.5;

const bucket = (ws: string) => `sb:rl:${ws}`;
const cool = (ws: string) => `sb:cool:${ws}`;

const ACQUIRE = `
if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
local t = redis.call('TIME')
local now = t[1] * 1000 + math.floor(t[2] / 1000)
local d = redis.call('HMGET', KEYS[1], 'tokens', 'at')
local tokens = tonumber(d[1])
local at = tonumber(d[2])
if not tokens then tokens = tonumber(ARGV[1]); at = now end
tokens = math.min(tonumber(ARGV[1]), tokens + (now - at) / 1000 * tonumber(ARGV[2]))
if tokens < 1 then
  redis.call('HSET', KEYS[1], 'tokens', tokens, 'at', now)
  return 0
end
redis.call('HSET', KEYS[1], 'tokens', tokens - 1, 'at', now)
redis.call('PEXPIRE', KEYS[1], 60000)
return 1
`;

const REFUND = `
local d = redis.call('HMGET', KEYS[1], 'tokens')
local tokens = tonumber(d[1])
if not tokens then return 0 end
redis.call('HSET', KEYS[1], 'tokens', math.min(tonumber(ARGV[1]), tokens + 1))
return 1
`;

export async function acquire(ws: string): Promise<boolean> {
  return (await getRedis().eval(ACQUIRE, 2, bucket(ws), cool(ws), CAP, RATE)) === 1;
}

export async function refund(ws: string): Promise<void> {
  await getRedis().eval(REFUND, 1, bucket(ws), CAP);
}

const PAUSE = `
if redis.call('PTTL', KEYS[1]) < tonumber(ARGV[1]) then redis.call('SET', KEYS[1], '1', 'PX', ARGV[1]) end
return 1
`;

export async function pause(ws: string, ms: number): Promise<void> {
  await getRedis().eval(PAUSE, 1, cool(ws), Math.max(1, Math.round(ms)));
}
```


---

## user  
2026-11-25T13:53:57.914Z

**tool result**

```
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
{
  "profile": "full",
  "startedAt": "2026-11-25T13:46:17.941Z",
  "checks": [
    {
      "level": 1,
      "id": "inbound_complete",
      "max": 4,
      "got": 4,
      "detail": "175 of 175 genuine messages stored"
    },
    {
      "level": 1,
      "id": "inbound_no_duplicates",
      "max": 3,
      "got": 3,
      "detail": "0 duplicate entries"
    },
    {
      "level": 1,
      "id": "inbound_order",
      "max": 3,
      "got": 3,
      "detail": "0 out-of-order positions (by occurred_at)"
    },
    {
      "level": 1,
      "id": "isolation",
      "max": 2,
      "got": 2,
      "detail": "0 messages under the wrong workspace or contact, or forged/replayed ids stored"
    },
    {
      "level": 1,
      "id": "rejects_forged",
      "max": 2,
      "got": 2,
      "detail": "0 of 6 forged webhooks accepted"
    },
    {
      "level": 1,
      "id": "rejects_stale",
      "max": 1,
      "got": 1,
      "detail": "0 of 3 replayed webhooks accepted"
    },
    {
      "level": 1,
      "id": "ack_speed",
      "max": 1,
      "got": 1,
      "detail": "p95 acknowledgement 45 ms, 0 first attempts not acknowledged"
    },
    {
      "level": 1,
      "id": "outbound_exactly_once",
      "max": 2,
      "got": 2,
      "detail": "12 of 12 replies reached the carrier, 0 more than once, 0 requests without Idempotency-Key"
    },
    {
      "level": 1,
      "id": "honours_retry_after",
      "max": 1,
      "got": 1,
      "detail": "0 requests sent inside a Retry-After window"
    },
    {
      "level": 1,
      "id": "status_lifecycle",
      "max": 1,
      "got": 1,
      "detail": "12 of 12 final statuses match the carrier"
    },
    {
      "level": 1,
      "id": "claim_atomic",
      "max": 2,
      "got": 2,
      "detail": "5 of 5 conversations had exactly one winner out of six, 0 had several, 0 had none; snapshot assignee correct for 5"
    },
    {
      "level": 1,
      "id": "outage_recovery",
      "max": 2,
      "got": 2,
      "detail": "6 of 6 replies requested during a 8 s provider outage were delivered afterwards, 0 more than once; 8 requests made during the outage"
    },
    {
      "level": 2,
      "id": "crash_inbound_complete",
      "max": 3,
      "got": 3,
      "detail": "killed at 9 s, down 4 s: 175 of 175 genuine messages stored"
    },
    {
      "level": 2,
      "id": "crash_inbound_no_dupes",
      "max": 2,
      "got": 2,
      "detail": "0 duplicate entries"
    },
    {
      "level": 2,
      "i      52 config.ts
     113 db.ts
      55 index.ts
      10 redis.ts
      81 ws.ts
      77 lib/conversations.ts
      20 lib/cookies.ts
      66 lib/frames.ts
      49 lib/inbound.ts
      96 lib/oidc.ts
     138 lib/outbox.ts
      52 lib/ratelimit.ts
      29 lib/session.ts
      22 lib/signature.ts
     176 routes/api.ts
      63 routes/auth.ts
      63 routes/grader.ts
     118 routes/notes.ts
      47 routes/webhook.ts
    1327 total
```


---

## assistant  
2026-11-25T13:53:59.752Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold/server/src; cat lib/frames.ts lib/conversations.ts ws.ts lib/oidc.ts routes/auth.ts lib/session.ts; sed -n 1,113p db.ts; sed -n 1,80p routes/api.ts; cat routes/grader.ts index.ts"
}
```


---

## assistant  
2026-11-25T13:54:00.779Z

**tool call: Bash**

```
{
  "command": "cd /Users/apple/Desktop/repo-new/gohlai-assessment/scaffold; ls server/test; grep -c \"^\\s*\\(it\\|test\\)(\" server/test/* ; grep -n \"after\\|seq\\|reconnect\" web/src/useSocket.ts | head -30; grep -n \"43\\|41\" ../README.md | head; grep -n \"got\\|max\" ../CHECK_REPORT.json | tail -5; tail -15 ../CHECK_REPORT.json"
}
```


---

## user  
2026-11-25T13:54:00.952Z

**tool result**

```
import { randomUUID } from 'node:crypto';
import { cols, isDup } from '../db.js';
import { getRedis } from '../redis.js';

export const channel = (ws: string) => `sb:frames:${ws}`;
// lock ttl is short on purpose, the unique (ws, seq) index is what really protects us
const lockKey = (ws: string) => `sb:lock:frames:${ws}`;

const UNLOCK = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withLock<T>(ws: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  const token = randomUUID();
  const until = Date.now() + 4000;
  while (true) {
    const got = await redis.set(lockKey(ws), token, 'PX', 3000, 'NX');
    if (got) break;
    if (Date.now() > until) throw new Error('frame lock timeout');
    await sleep(4 + Math.random() * 10);
  }
  try {
    return await fn();
  } finally {
    await redis.eval(UNLOCK, 1, lockKey(ws), token).catch(() => null);
  }
}

// Frames get their seq while holding a per-workspace lock, so they are
// committed in seq order and a reader never skips one. `key` makes the write
// idempotent: the same event arriving twice creates one frame.
export async function addFrame(ws: string, key: string, frame: Record<string, unknown>): Promise<void> {
  const { frames } = await cols();
  if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return;
  let seq = 0;
  for (let attempt = 0; attempt < 5 && !seq; attempt++) {
    seq = await withLock(ws, async () => {
      if (await frames.findOne({ ws, key }, { projection: { _id: 1 } })) return -1;
      const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
      const next = (last?.seq ?? 0) + 1;
      try {
        await frames.insertOne({ ws, seq: next, key, frame, createdAt: new Date() });
        return next;
      } catch (e) {
        if (isDup(e)) return 0;
        throw e;
      }
    });
  }
  // out of attempts: fail the request so the caller retries instead of losing the frame
  if (!seq) throw new Error('could not allocate a seq');
  if (seq > 0) await getRedis().publish(channel(ws), String(seq)).catch(() => null);
}

export async function framesAfter(ws: string, after: number, limit = 500) {
  const { frames } = await cols();
  const docs = await frames.find({ ws, seq: { $gt: after } }).sort({ seq: 1 }).limit(limit).toArray();
  return docs.map((d) => ({ seq: d.seq, ...d.frame }));
}

export async function lastSeq(ws: string): Promise<number> {
  const { frames } = await cols();
  const last = await frames.find({ ws }).sort({ seq: -1 }).limit(1).next();
  return last?.seq ?? 0;
}
import { cols, isDup } from '../db.js';
import { addFrame } from './frames.js';

export async function touchConversation(ws: string, contact: string, at: Date, preview: string, reopen: boolean) {
  const { convs } = await cols();
  const run = () =>
    convs.updateOne(
      { ws, contact },
      {
        $setOnInsert: { assignee: null, status: 'open', createdAt: new Date() },
        $max: { lastActivityAt: at },
      },
      { upsert: true },
    );
  try {
    await run();
  } catch (e) {
    if (!isDup(e)) throw e;
    await run();
  }
  await convs.updateOne({ ws, contact, lastActivityAt: { $lte: at } }, { $set: { preview: preview.slice(0, 140) } });
  if (reopen) await convs.updateOne({ ws, contact, status: 'closed' }, { $set: { status: 'open' } });
}

export type ClaimResult = 'claimed' | 'already' | 'taken';

// v counts assignment/status changes; frame keys use it so re-emitting after a crash is a no-op
async function emitAssigned(ws: string, contact: string) {
  const { convs } = await cols();
  const c = await convs.findOne({ ws, contact });
  if (c) await addFrame(ws, `assign:${contact}:${c.v ?? 0}`, { type: 'conversation.assigned', contact, assignee: c.assignee });
}

export async function claim(ws: string, contact: string, agent: string): Promise<ClaimResult> {
  const { convs } = await cols();
  const filter = { ws, contact, $or: [{ assignee: null }, { assignee: agent }] };
  const before = await convs.findOne({ ws, contact }, { projection: { assignee: 1 } });
  if (before?.assignee === agent) {
    await emitAssigned(ws, contact);
    return 'already';
  }

  const update = {
    $set: { assignee: agent },
    $inc: { v: 1 },
    $setOnInsert: { status: 'open' as const, createdAt: new Date(), lastActivityAt: new Date() },
  };
  let res;
  try {
    res = await convs.updateOne(filter, update, { upsert: true });
  } catch (e) {
    if (!isDup(e)) throw e;
    // someone created the row first; retry as a plain update
    res = await convs.updateOne(filter, { $set: { assignee: agent }, $inc: { v: 1 } });
  }
  if (!res.matchedCount && !res.upsertedCount) return 'taken';
  await emitAssigned(ws, contact);
  return 'claimed';
}

export async function release(ws: string, contact: string, agent: string, force: boolean): Promise<boolean> {
  const { convs } = await cols();
  const filter = force ? { ws, contact, assignee: { $ne: null } } : { ws, contact, assignee: agent };
  const res = await convs.updateOne(filter, { $set: { assignee: null }, $inc: { v: 1 } });
  if (!res.modifiedCount) return false;
  await emitAssigned(ws, contact);
  return true;
}

export async function setStatus(ws: string, contact: string, status: 'open' | 'closed'): Promise<boolean> {
  const { convs } = await cols();
  const res = await convs.updateOne({ ws, contact, status: status === 'open' ? 'closed' : 'open' }, { $set: { status }, $inc: { v: 1 } });
  if (!res.modifiedCount) return false;
  const c = await convs.findOne({ ws, contact });
  if (c) await addFrame(ws, `status:${contact}:${c.v ?? 0}`, { type: 'conversation.status', contact, status: c.status });
  return true;
}
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
import { createHash, createPublicKey, randomBytes, verify } from 'node:crypto';
import { config } from '../config.js';
import type { Membership } from './session.js';

type Discovery = { issuer: string; authorization_endpoint: string; token_endpoint: string; jwks_uri: string };
let discovery: { at: number; doc: Discovery } | undefined;
let jwks: { at: number; keys: any[] } | undefined;

const getJson = async (url: string) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
};

async function getDiscovery(): Promise<Discovery> {
  if (!discovery || Date.now() - discovery.at > 10 * 60_000) {
    discovery = { at: Date.now(), doc: await getJson(`${config.oidc.issuer}/.well-known/openid-configuration`) };
  }
  return discovery.doc;
}

async function getKeys(force = false) {
  if (force || !jwks || Date.now() - jwks.at > 10 * 60_000) {
    const d = await getDiscovery();
    jwks = { at: Date.now(), keys: (await getJson(d.jwks_uri)).keys ?? [] };
  }
  return jwks.keys;
}

export const pkce = () => {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
};

export async function authorizeUrl(state: string, nonce: string, challenge: string) {
  const d = await getDiscovery();
  const u = new URL(d.authorization_endpoint);
  u.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.oidc.clientId,
    redirect_uri: config.oidc.redirectUri,
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();
  return u.toString();
}

export type Identity = { sub: string; name?: string; email?: string; workspaces: Membership[] };

export async function exchange(code: string, verifier: string, nonce: string): Promise<Identity> {
  const d = await getDiscovery();
  const res = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oidc.redirectUri,
      client_id: config.oidc.clientId,
      client_secret: config.oidc.clientSecret,
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`token endpoint answered ${res.status}`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error('no id_token');
  return verifyIdToken(id_token, d.issuer, nonce);
}

async function verifyIdToken(token: string, issuer: string, nonce: string): Promise<Identity> {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('malformed id_token');
  const header = JSON.parse(Buffer.from(h, 'base64url').toString());
  if (header.alg !== 'RS256') throw new Error('unexpected alg');
  let jwk = (await getKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown signing key');
  const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(s, 'base64url'));
  if (!ok) throw new Error('bad id_token signature');

  const c = JSON.parse(Buffer.from(p, 'base64url').toString());
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (c.iss !== issuer || !aud.includes(config.oidc.clientId)) throw new Error('wrong issuer or audience');
  if (typeof c.exp !== 'number' || c.exp * 1000 < Date.now()) throw new Error('id_token expired');
  if (c.nonce !== nonce) throw new Error('nonce mismatch');
  if (typeof c.sub !== 'string' || !c.sub) throw new Error('no sub');

  const workspaces: Membership[] = (Array.isArray(c.workspaces) ? c.workspaces : [])
    .filter((w: any) => w && typeof w.id === 'string' && (w.role === 'admin' || w.role === 'agent'))
    .map((w: any) => ({ id: w.id, role: w.role }));
  return { sub: c.sub, name: c.name, email: c.email, workspaces };
}
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
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { getRedis } from '../redis.js';
import { parseCookies } from './cookies.js';

export type Membership = { id: string; role: 'admin' | 'agent' };
export type Session = { sub: string; name?: string; email?: string; workspaces: Membership[] };

export const SESSION_COOKIE = 'sb_sid';
const key = (id: string) => `sb:sess:${id}`;

export async function createSession(s: Session): Promise<string> {
  const id = randomBytes(32).toString('hex');
  await getRedis().set(key(id), JSON.stringify(s), 'EX', config.sessionTtlSec);
  return id;
}

export async function destroySession(id: string) {
  await getRedis().del(key(id));
}

export async function sessionFromCookie(header: string | undefined): Promise<Session | null> {
  const id = parseCookies(header)[SESSION_COOKIE];
  if (!id || !/^[0-9a-f]{64}$/.test(id)) return null;
  const raw = await getRedis().get(key(id));
  return raw ? (JSON.parse(raw) as Session) : null;
}

export const roleIn = (s: Session, ws: string) => s.workspaces.find((m) => m.id === ws)?.role ?? null;
import { MongoClient, type Db } from 'mongodb';
import { config } from './config.js';

export type Msg = {
  ws: string;
  contact: string;
  messageId: string;
  text: string;
  occurredAt: Date;
  receivedAt: Date;
};

export type Conv = {
  ws: string;
  contact: string;
  assignee: string | null;
  status: 'open' | 'closed';
  v?: number;
  lastActivityAt: Date;
  preview?: string;
  createdAt: Date;
};

export type OutStatus = 'queued' | 'sent' | 'delivered' | 'failed';

export type Out = {
  ws: string;
  contact: string;
  clientRef: string;
  text: string;
  sender: string;
  status: OutStatus;
  rank: number;
  createdAt: Date;
  attempts: number;
  nextAttemptAt: Date;
  lockedUntil: Date;
  sendDone: boolean;
  pigeonId?: string;
};

export type FrameDoc = {
  ws: string;
  seq: number;
  key: string;
  frame: Record<string, unknown>;
  createdAt: Date;
};

export type Note = {
  ws: string;
  contact: string;
  author: string;
  ciphertext: string;
  iv: string;
  createdAt: Date;
};

export type KeyDoc = {
  ws: string;
  sub: string;
  publicKey: string;
  wrappedKey?: string;
  wrappedBy?: string;
};

export type Person = { ws: string; sub: string; name: string; email?: string };

export type Keyring = { ws: string; creator: string; createdAt: Date };

let connecting: Promise<Db> | undefined;

export function getDb(): Promise<Db> {
  connecting ??= new MongoClient(config.mongoUrl).connect().then((c) => c.db());
  return connecting;
}

export async function cols() {
  const d = await getDb();
  return {
    messages: d.collection<Msg>('messages'),
    convs: d.collection<Conv>('conversations'),
    outbox: d.collection<Out>('outbox'),
    frames: d.collection<FrameDoc>('frames'),
    notes: d.collection<Note>('notes'),
    keys: d.collection<KeyDoc>('keys'),
    keyring: d.collection<Keyring>('keyring'),
    people: d.collection<Person>('people'),
  };
}

export type Cols = Awaited<ReturnType<typeof cols>>;

export async function ensureIndexes() {
  const c = await cols();
  await Promise.all([
    c.messages.createIndex({ ws: 1, messageId: 1 }, { unique: true }),
    c.messages.createIndex({ ws: 1, contact: 1, occurredAt: 1 }),
    c.convs.createIndex({ ws: 1, contact: 1 }, { unique: true }),
    c.convs.createIndex({ ws: 1, lastActivityAt: -1, _id: -1 }),
    c.outbox.createIndex({ ws: 1, clientRef: 1 }, { unique: true }),
    c.outbox.createIndex({ sendDone: 1, ws: 1, nextAttemptAt: 1 }),
    c.outbox.createIndex({ ws: 1, contact: 1, createdAt: 1 }),
    c.frames.createIndex({ ws: 1, seq: 1 }, { unique: true }),
    c.frames.createIndex({ ws: 1, key: 1 }, { unique: true }),
    c.notes.createIndex({ ws: 1, contact: 1, createdAt: 1 }),
    c.keys.createIndex({ ws: 1, sub: 1 }, { unique: true }),
    c.keyring.createIndex({ ws: 1 }, { unique: true }),
    c.people.createIndex({ ws: 1, sub: 1 }, { unique: true }),
  ]);
}

export const isDup = (e: unknown) => (e as { code?: number })?.code === 11000;
import { Router, json, type Request, type Response, type NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { config, isWorkspace } from '../config.js';
import { cols } from '../db.js';
import { roleIn, sessionFromCookie, type Session } from '../lib/session.js';
import { claim, release, setStatus } from '../lib/conversations.js';
import { createReply } from '../lib/outbox.js';
import { notes, validContact } from './notes.js';

export const api = Router();


declare module 'express-serve-static-core' {
  interface Request {
    session?: Session;
  }
}

api.use('/api', json({ limit: '64kb' }));

// cookie auth: refuse writes that come from some other site
api.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.header('origin');
  if (origin && origin !== config.webOrigin && origin !== `http://${req.header('host')}`) {
    return res.status(403).json({ error: 'bad origin' });
  }
  next();
});

api.use('/api', async (req, res, next) => {
  try {
    const s = await sessionFromCookie(req.header('cookie'));
    if (!s) return res.status(401).json({ error: 'not signed in' });
    req.session = s;
    next();
  } catch (e) {
    next(e);
  }
});

api.use(notes);

api.get('/api/me', (req, res) => {
  const s = req.session!;
  res.json({ sub: s.sub, name: s.name, email: s.email, workspaces: s.workspaces });
});

// resolves ?workspace= (or body.workspace) and checks membership
function member(req: Request, res: Response): { ws: string; role: 'admin' | 'agent' } | null {
  const ws = (req.query.workspace ?? req.body?.workspace) as unknown;
  if (!isWorkspace(ws)) {
    res.status(ws === undefined ? 400 : 403).json({ error: 'workspace required' });
    return null;
  }
  const role = roleIn(req.session!, ws);
  if (!role) {
    res.status(403).json({ error: 'not a member of this workspace' });
    return null;
  }
  return { ws, role };
}

const pageSize = (v: unknown) => Math.min(Math.max(Number(v) || 30, 1), 100);

// display names for the people in a workspace, so the UI can show "Ben Ortiz" instead of an id
api.get('/api/workspaces/:ws/people', async (req, res) => {
  const ws = req.params.ws;
  if (!isWorkspace(ws) || !roleIn(req.session!, ws)) return res.status(403).json({ error: 'not a member of this workspace' });
  const { people } = await cols();
  const me = req.session!;
  const list = (await people.find({ ws }).toArray()).map((p) => ({ sub: p.sub, name: p.name }));
  if (!list.some((p) => p.sub === me.sub)) list.push({ sub: me.sub, name: me.name || me.email || me.sub });
  res.json({ people: list });
});

api.get('/api/conversations', async (req, res) => {
  const m = member(req, res);
  if (!m) return;
import { Router, json } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { config, isWorkspace } from '../config.js';
import { cols } from '../db.js';
import { getRedis } from '../redis.js';
import { claim } from '../lib/conversations.js';
import { createReply } from '../lib/outbox.js';

export const grader = Router();

grader.use('/__grader', (req, res, next) => {
  // hash both sides so the compare does not depend on the token length
  const digest = (v: string) => createHash('sha256').update(v).digest();
  if (!timingSafeEqual(digest(String(req.header('x-grader-token') ?? '')), digest(config.graderToken))) return res.status(401).json({ error: 'unauthorized' });
  next();
});
grader.use('/__grader', json({ limit: '64kb' }));

grader.post('/__grader/reset', async (_req, res) => {
  const c = await cols();
  await Promise.all(Object.values(c).map((col) => col.deleteMany({})));
  const redis = getRedis();
  for (const pattern of ['sb:rl:*', 'sb:cool:*', 'sb:lock:*']) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  }
  res.json({ ok: true });
});

grader.get('/__grader/snapshot', async (_req, res) => {
  const { messages, convs, outbox } = await cols();
  const out: Record<string, any> = {};
  for (const ws of config.workspaces) {
    const contacts: Record<string, { inbound: string[]; assignee: string | null }> = Object.create(null);
    const msgs = await messages.find({ ws }).sort({ occurredAt: 1, messageId: 1 }).toArray();
    for (const m of msgs) (contacts[m.contact] ??= { inbound: [], assignee: null }).inbound.push(m.messageId);
    for (const cv of await convs.find({ ws }).toArray()) (contacts[cv.contact] ??= { inbound: [], assignee: null }).assignee = cv.assignee;
    const outbound: Record<string, string> = {};
    for (const o of await outbox.find({ ws }).toArray()) outbound[o.clientRef] = o.status;
    out[ws] = { contacts, outbound };
  }
  res.json({ workspaces: out });
});

grader.post('/__grader/reply', async (req, res) => {
  const { workspace, contact, text, client_ref } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if ([contact, text, client_ref].some((v) => typeof v !== 'string' || !v || v.length > 4000) || contact.length > 64 || client_ref.length > 100) return res.status(400).json({ error: 'contact, text and client_ref are required' });
  await createReply(workspace, contact, text, client_ref, 'grader');
  res.status(202).json({ ok: true });
});

grader.post('/__grader/claim', async (req, res) => {
  const { workspace, contact, agent } = req.body ?? {};
  if (!isWorkspace(workspace)) return res.status(404).json({ error: 'unknown workspace' });
  if ([contact, agent].some((v) => typeof v !== 'string' || !v)) return res.status(400).json({ error: 'contact and agent are required' });
  const r = await claim(workspace, contact, agent);
  res.status(r === 'taken' ? 409 : 200).json({ result: r });
});
import express, { type ErrorRequestHandler } from 'express';
import { createServer } from 'node:http';
import { config } from './config.js';
import { ensureIndexes } from './db.js';
import { getRedis } from './redis.js';
import { webhook } from './routes/webhook.js';
import { grader } from './routes/grader.js';
import { auth } from './routes/auth.js';
import { api } from './routes/api.js';
import { attachWebSocket } from './ws.js';
import { startSender, stopSender } from './lib/outbox.js';

const app = express();
app.disable('x-powered-by');

let ready = false;
app.get('/healthz', (_req, res) => {
  res.status(ready ? 200 : 503).json({ ok: ready });
});

app.use(webhook);
app.use(grader);
app.use(auth);
app.use(api);

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = Number(err?.status) >= 400 && Number(err?.status) < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  if (!res.headersSent) res.status(status).json({ error: status === 500 ? 'internal error' : 'bad request' });
};
app.use(onError);

const server = createServer(app);
attachWebSocket(server);

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
```


---

## user  
2026-11-25T13:54:00.983Z

**tool result**

```
conversations.test.ts
frames.test.ts
helpers.ts
notes.test.ts
outbox.test.ts
ratelimit.test.ts
signature.test.ts
webhook.test.ts
server/test/conversations.test.ts:6
server/test/frames.test.ts:4
server/test/helpers.ts:0
server/test/outbox.test.ts:6
server/test/ratelimit.test.ts:5
server/test/signature.test.ts:7
server/test/notes.test.ts:8
server/test/webhook.test.ts:7
29:      if (lastSeq > 0) query.set('after', String(lastSeq));
46:        if (typeof frame.seq !== 'number' || frame.seq <= lastSeq) return;
47:        lastSeq = frame.seq;
97:npm --prefix scaffold/server test    # 41 unit and integration tests (needs MongoDB and Redis)
239:      "max": 14
242:      "got": 22,
243:      "max": 22
246:      "got": 15,
247:      "max": 15
    "2": {
      "got": 14,
      "max": 14
    },
    "3": {
      "got": 22,
      "max": 22
    },
    "5": {
      "got": 15,
      "max": 15
    }
  },
  "finishedAt": "2026-11-25T13:49:46.163Z"
}
```


---

## assistant  
2026-11-25T13:54:03.385Z

_thinking_




---

## assistant  
2026-11-25T13:54:55.390Z

**tool call: Bash**

```
{
  "command": "mkdir -p /tmp/pdf-parts; cat > /tmp/pdf-parts/A.md <<'EOF'\n## 1. Assignment kya tha\n\n**Switchboard** ek shared team inbox hai. Socho ek shop hai jahan customers WhatsApp jaise messages bhejte hain, aur shop ke support agents un messages ka jawab dete hain.\n\n**Kaun kaun hai:**\n\n- **Customers**: log jo business ko message likhte hain. Yahan sab simulated (nakli) hain, Pigeon ke andar rehte hain.\n- **Support agents**: business ke employees. Login karke inbox dekhte hain, conversation claim karte hain, reply dete hain, private notes likhte hain.\n- **Workspaces**: alag alag businesses (`ws_acme`, `ws_globex`). Ek hi server share karte hain, par ek ka data doosre ko kabhi nahi dikhna chahiye. Jaise ek bank ke alag alag customers ke lockers.\n- **Pigeon**: messaging provider (post office jaisa). Customer ke messages hum tak webhook se pahunchata hai, aur hamare replies bhejta hai. Yeh jaanbujhkar unreliable hai: duplicate, ulte order mein, jaali (forged) aur purane (replayed) messages bhejta hai, kabhi slow, kabhi down, kabhi 429 (rate limit) deta hai.\n\n**5 levels ka check (har level ke points alag):**\n\n| Level | Kya test hota hai | Points |\n| --- | --- | --- |\n| 1 | Ek server copy. Duplicate/out-of-order/forged/stale webhooks, Pigeon slow/down/rate-limit, 6 agents ek saath claim | 24 |\n| 2 | Server ko `kill -9` (achanak maar dena) aur phir start. Kuch lost, duplicate ya double-sent nahi | 14 |\n| 3 | Kai copies load balancer ke peeche, shared MongoDB + Redis. Rate limit per workspace, ek copy marne par baaki 60 s mein kaam khatam karein | 22 |\n| 4 | Likhe hue rules (`PIGEON.md` ki answer table). 10 rules, 1 point each. Local mein nahi chalta | 10 |\n| 5 | Login (IdP), tenant isolation, WebSocket real time, kai copies ke saath | 15 |\n\n**Scoring (total 100 + bonus):**\n\n- Automatic check: 24+14+22+10+15 = **85**\n- Security (sessions, secrets, encrypted notes): **4**\n- Quality (data model, structure, code, tests): **5**\n- Frontend: **3**\n- AI use (ai-logs se): **3**\n- Bonus billing (Paybox): **10** alag se. Humne yeh nahi banaya.\n\nHamara local check: levels 1, 2, 3, 5 mein **75/75**. Level 4 local nahi chalta.\n\n---\n\n## 2. Humne kya banaya (bade picture)\n\nPoori kahani ek line mein: customer message likhta hai, hum use safe store karte hain, agent ke browser tak live pahunchate hain, agent reply likhta hai, aur hum use kabhi lose ya double kiye bina Pigeon tak bhejte hain.\n\n`​``\nINBOUND (customer -> agent)\n\nPigeon --webhook POST--> Express server --> MongoDB (messages, frames)\n                           /webhooks/pigeon        |\n                                                   v\n                                      Redis pub/sub (\"naya frame aaya!\")\n                                                   |\n                                                   v\n                         Browser <--WebSocket /ws-- Server\n\nOUTBOUND (agent -> customer)\n\nAgent reply --> outbox (MongoDB) --> sender loop --> Pigeon /v1/messages\n                                                         |\nBrowser <-- WebSocket <-- frames <-- status webhook <----+\n`​``\n\n**Har box ko analogy se:**\n\n- **Pigeon** = post office. Chitthi laata hai, kabhi do baar, kabhi late.\n- **Webhook endpoint** (`routes/webhook.ts`) = shop ka gate guard. Check karta hai chitthi asli hai ya nakli, phir andar rakhta hai.\n- **MongoDB** = shop ka pakka register / bank locker. Jo yahan likh diya, wo crash ke baad bhi rahega. Collections: messages, conversations, outbox, frames.\n- **Redis** = shop ka notice board / bell. Tez hai, shared hai. Hum ise 3 kaam ke liye use karte hain: sessions, rate-limit bucket, aur \"naya frame aaya\" ki ghanti (pub/sub).\n- **WebSocket** = browser aur server ke beech ki khuli phone line. Server khud bata deta hai jab kuch naya ho, refresh nahi karna padta.\n- **Outbox** = \"jaane wali dak\" ki tokri. Reply pehle tokri mein rakhte hain, phir sender loop use post office tak pahunchata hai.\n- **Frames** = ek diary jisme har change ka numbered entry hai (seq 1, 2, 3...). Section 3 mein detail.\n\nStack: Node 22, Express 5, TypeScript, MongoDB, Redis, `ws`. Frontend: React + Vite.\n\n---\n\n## 3. Chhoti chhoti cheezein jo sabse zyada poochhi jayengi\n\n### a) Webhook signature (HMAC) aur 5-minute rule\n**File:** `scaffold/server/src/lib/signature.ts`, use hota hai `routes/webhook.ts` mein.\n\nAnalogy: Pigeon ek secret mohar (seal) lagata hai. Sirf Pigeon aur hum secret `whsec_pigeon_dev` jaante hain. Header `t=<time>,v1=<hex>` aata hai. Hum bhi wahi HMAC-SHA256 apne se banate hain (`\"<t>.<raw body>\"` par) aur compare karte hain (`timingSafeEqual`, taaki timing se secret guess na ho). Match nahi to **401**.\n\n5-minute rule: agar signature sahi hai par `t` 300 seconds se purana hai to bhi 401. Warna koi purani asli chitthi dobara bhej kar (replay) hamein dhoka de sakta hai. Raw body use karte hain (parse karne se pehle), kyunki body ka ek byte badla to mohar toot jaati hai.\n\n### b) Idempotency (same message do baar aaye to farak nahi)\n**File:** `lib/inbound.ts`, index in `db.ts`.\n\nAnalogy: register mein har chitthi ka number likha hai. Wahi number dobara aaye to \"pehle se hai\" bolke chhod do. Messages `(ws, messageId)` par unique index hai, aur `updateOne` with `$setOnInsert` + upsert use hota hai. Duplicate aaya to kuch naya insert nahi hota. Frames mein bhi `key` (jaise `in:<message_id>`) unique hai, to frame bhi ek hi banta hai.\n\n### c) Pehle store, baad mein 2xx\n**File:** `routes/webhook.ts`\n\nAnalogy: chitthi register mein likhne ke **baad** hi receipt do. Agar pehle receipt de di aur likhne se pehle server mar gaya, chitthi gayi. Hum store fail hone par **503** dete hain, to Pigeon retry karta hai (6 attempts, ~22 s). Server kuch seconds down bhi ho to kuch nahi khota. Aur unknown event type ya unknown workspace par 2xx dete hain (varna Pigeon retry karta rahega); kharab JSON par 400.\n\n### d) Ordering by occurred_at\nPigeon ke events ulte order mein aa sakte hain. Isliye messages `occurredAt` (event ka asli time) se sort hote hain, arrival time se nahi (`routes/api.ts`, aur `routes/grader.ts` snapshot mein `sort({ occurredAt: 1, messageId: 1 })`). Status bhi sirf aage badhta hai: `queued(0) < sent(1) < delivered/failed(2)` (`RANK` in `lib/inbound.ts`), to `delivered` pehle aa gaya aur `sent` baad mein, to status piche nahi jaata.\n\n### e) Outbox + lease + Idempotency-Key\n**File:** `lib/outbox.ts`\n\n- Reply aate hi `outbox` row banti hai (`createReply`) **pehle**, phir API `202` deti hai. To reply kabhi lost nahi.\n- Sender loop (`startSender`, `tick`) har copy mein chalta hai. Wo \"due\" row uthata hai aur uspar **lease** (`lockedUntil = abhi + 20 s`) lagata hai, ek atomic `findOneAndUpdate` se. Jaise library ki kitaab: jisne li, uske naam 20 din ke liye. Wapas nahi aayi to koi doosra le sakta hai.\n- Agar server `kill -9` ho gaya beech mein, lease expire hoti hai aur doosri (ya wahi restart hui) copy row utha leti hai. Isliye \"failover about 20 s\" lagta hai.\n- Double send kyun nahi? Har send mein header `Idempotency-Key = client_ref` jaata hai. Pigeon same key dobara aaye to pehle wala jawab lauta deta hai, naya send nahi karta. Retry hamesha safe hai.\n- Send timeout 6 s. Timeout/5xx/network error par backoff ke saath retry (forever). Aur `client_ref` par unique index hai, to same reply do baar maangi gayi to ek hi row banti hai.\n\n### f) Redis token bucket aur Retry-After\n**File:** `lib/ratelimit.ts`\n\nAnalogy: ek bucket mein tokens hain; har send ek token leta hai; bucket dheere dheere bharta hai. Pigeon allow karta hai burst 8, 4/s. Hum thoda neeche rehte hain: **burst 6, 3.5/s**. Bucket **Redis mein** ek Lua script se atomic hai, to saari copies ek hi bucket share karti hain (per workspace, per copy nahi). Pigeon ne `429 Retry-After` diya ya 503 aaya to `pause()` workspace ko sabke liye roak deta hai. Retry-After se pehle koi request nahi jaati.\n\n### g) Claim race (ek hi winner)\n**File:** `lib/conversations.ts`, index in `db.ts`\n\n6 agents ek saath claim karein. `conversations` par `(ws, contact)` unique index hai, aur claim ek atomic `updateOne` hai jiska filter hai \"assignee null **ya** wahi agent\". Sirf ek ka update match karta hai. Baaki ko `taken` milta hai (HTTP 409). Jaise ek hi seat par ek hi insaan baith sakta hai. Holder dobara claim kare to 200 (`already`).\n\n### h) seq, frames table, aur reconnect replay\n**File:** `lib/frames.ts`, `ws.ts`, `web/src/useSocket.ts`\n\nHar change (naya message, status, assign, close) `frames` collection mein ek row hai jiska workspace ke andar badhta hua `seq` hai (1, 2, 3...). `seq` ek chhote Redis lock ke andar diya jaata hai taaki rows seq ke order mein commit hon; aur `(ws, seq)` unique index asli safety hai.\n\nWebSocket: server frames ko `seq > client.sent` se padhta hai aur bhejta hai. Redis pub/sub sirf \"uth jao\" ki ghanti hai; ghanti miss ho to bhi 2 s ke timer se pakad leta hai. Browser apna `lastSeq` yaad rakhta hai. Connection toot ke wapas aaye to `GET /ws?workspace=X&after=<lastSeq>` bolta hai, server pehle saare missed frames bhejta hai, phir live. Duplicate frame (`seq <= lastSeq`) browser ignore karta hai. Kai copies ho to bhi chalta hai kyunki frames MongoDB se aate hain, kisi ek copy ki memory se nahi.\n\n### i) Login: OIDC + PKCE (bachchon wali steps)\n**File:** `lib/oidc.ts`, `routes/auth.ts`, `lib/session.ts`\n\n1. Browser `/auth/login` maangta hai. Server teen random cheezein banata hai: **state** (is login ka token), **nonce** (id_token ke liye), **verifier** (PKCE ka secret). Verifier ka SHA-256 = **challenge**.\n2. Server verifier+nonce Redis mein 10 minute ke liye rakhta hai aur browser ko IdP par bhej deta hai (challenge ke saath).\n3. User IdP par apna naam chunta hai. IdP wapas `/auth/callback?code=...&state=...` bhejta hai.\n4. Server check karta hai: cookie wali state == URL wali state (CSRF se bachne ke liye), aur Redis se verifier nikalta hai (`getdel`, ek hi baar use hota hai).\n5. Server `code + verifier` IdP ko deta hai. IdP challenge se verifier match karta hai. Isse \"code churaya hua ho to bhi bekaar\" ho jaata hai.\n6. id_token ka signature IdP ki public keys (JWKS) se RS256 verify hota hai; issuer, audience, expiry, aur **nonce** match check hota hai.\n7. Token mein `workspaces` claim se roles milte hain. Server session banata hai Redis mein (**8 ghante**), aur browser ko `sb_sid` cookie milti hai.\n\n### j) Tenant isolation\n**File:** `routes/api.ts` (`member()`), `ws.ts`, `lib/session.ts`\n\nHar API call session cookie se user nikalta hai, phir `roleIn(session, ws)` dekhta hai: user us workspace ka member hai? Nahi to **403**; session nahi to **401**. WebSocket upgrade par bhi yahi check hai. Har database query mein `ws` filter hota hai, aur indexes bhi `ws` se shuru hote hain. Workspace id sirf `config.ts` ki known list se (`isWorkspace`) maana jaata hai. Isliye ek workspace ka user doosre ka data na API se, na WebSocket se dekh sakta hai.\n\n---\n\n## 4. Numbers jo yaad rakhne hain\n\n| Number | Matlab | Kahan set hai |\n| --- | --- | --- |\n| **20 s** | Outbox lease. Dead copy ka kaam isi ke baad doosri copy uthati hai | `config.ts` (`leaseMs: 20_000`), use `lib/outbox.ts` |\n| **3.5 / s, burst 6** | Hamara per-workspace send rate (Pigeon ka 4/s, burst 8 se thoda kam) | `lib/ratelimit.ts` (`RATE`, `CAP`) |\n| **5 min (300 s)** | Webhook timestamp window | `lib/signature.ts` (`TOLERANCE_SEC`) |\n| **6 s** | Pigeon send ka timeout | `config.ts` (`sendTimeoutMs`) |\n| **8 h** | Login session ki life | `config.ts` (`sessionTtlSec: 8 * 3600`) |\n| **10 min** | Login flow (state/verifier) Redis mein, aur OIDC discovery/keys cache | `routes/auth.ts`, `lib/oidc.ts` |\n| **2 s** | WebSocket ka safety poll timer (pub/sub miss ho to) | `ws.ts` |\n| **4** | Ek workspace ke max parallel sends | `lib/outbox.ts` (`MAX_INFLIGHT`) |\n| **75 / 75** | Check score, levels 1, 2, 3, 5 | `CHECK_REPORT.json` |\n| **43** | Tests (7 files, `scaffold/server/test`) | `scaffold/server/test/*.test.ts` |\n\nYaad rakhne wali baat: README mein likha hai \"41 tests\", par test files gino to 43 `it/test` blocks hain. Jo bhi poochhe, \"43 tests\" bolna theek hai (aur README ka number purana hai, ise fix karna chahiye).\n\nPigeon ke apne numbers (jo hamare numbers ki wajah hain): 5 s webhook answer deadline, 6 attempts ~22 s mein, send bucket 8 aur 4/s refill, kabhi kabhi 12 s ka slow response.\nEOF\nwc -w /tmp/pdf-parts/A.md"
}
```


---

## user  
2026-11-25T13:54:55.547Z

**tool result**

```
    1985 /tmp/pdf-parts/A.md
```


---

## assistant  
2026-11-25T13:54:57.201Z

**tool call: SubagentHandback**

```
{
  "message": "/tmp/pdf-parts/A.md is written. It has all four sections, and every claim was checked against the code. One thing to know: README.md says \"41 tests\", but the test files hold 43 test blocks. I used 43, and the file notes the README number is outdated."
}
```


---

## user  
2026-11-25T13:54:57.733Z

**tool result**

```
{"success":true,"message":"Report delivered to your caller."}
```

