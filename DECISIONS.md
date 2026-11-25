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
- Billing bonus: server and admin screen (see Billing below). The seat-change screen was checked through the API tests, not clicked through by hand.
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

## Billing

Server only: Paybox client with idempotency keys, a `billing` collection per workspace, subscribe / seat change / cancel-at-period-end, a signed `POST /webhooks/paybox`, send gating, grader endpoints and an admin-only `/api/billing`. Webhooks never set state: any event only tells us which customer to look at, then the subscription is read again from Paybox and stored. Subscribes for one workspace run one at a time under a Redis lock, so three at once make one customer and one subscription.

- **past_due.** The workspace can keep sending. The customer has not done anything yet and Paybox cancels by itself after the third failed attempt (3 and 5 days later), so the limit is Paybox's own retry schedule, about 8 days. The admin sees the warning and can enter a new card, which replaces the card Paybox retries with. Cost: up to 8 days of sending that may never be paid for.
- **Seats below headcount.** Allowed. Nobody is removed or blocked, because there is no way to know which agents should lose access and the seat count is not tied to logins anywhere else. The response carries a `warning` with the headcount (from the `people` collection, so it only counts people who have opened the app). Seats are a billing number, not enforced.
- **Credit on seat reduction.** Yes, the response says the unused part becomes credit on the next invoice and is not refunded. The amount is not shown because Paybox does not return it on this call.
- **Waiting for the bank.** The workspace is `incomplete` and can still send (it is a free trial until it is active). The UI should say the bank needs approval, link to `nextActionUrl`, and update by itself once the webhook arrives. If the page was closed, the link stays in `GET /api/billing`. An `incomplete` subscription Paybox expires after 23 hours becomes `none` again.

Not done: no card update outside past_due and failed first payments, no invoices list, no proration preview, a `canceled` workspace that subscribes again gets a new subscription on the same customer, and the webhook secret and keys are the development defaults from config. Seat changes on `incomplete` are refused (409). Replies already queued before a cancel are still sent.
