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

## Choices where the brief is silent

- Every change a client may need is a row in `frames` with a per-workspace `seq`. The WebSocket reads rows after the client's last `seq`; Redis pub/sub only wakes sockets up, so a lost pub/sub message costs at most 2 seconds.
- `seq` is assigned under a short Redis lock so rows commit in order. The unique `(workspace, seq)` index is what really guarantees uniqueness if the lock ever expires.
- A message from a customer reopens a closed conversation.
- `assignee` is the IdP `sub`. The check's `agent` is stored as given.
- Any 2xx from Pigeon counts as accepted. A 4xx other than 429 marks the reply `failed`; 5xx, 408, timeouts and network errors are retried with backoff forever.
- A lease of 20 s on an outbox row is how a dead copy's work is picked up. Failover therefore takes up to about 20 s.
- Message status only moves forward (queued, sent, delivered or failed).

## What I know is still wrong or weak

- Replies to the same contact can leave in a different order than they were typed if one of them is retried.
- Assign / close frames are written after the database update. If the process dies in between, the frame is missing until the same agent repeats the action. A client that reconnects and refetches still sees the right state.
- A customer message that is stored but whose process dies before the conversation is reopened will not reopen it when Pigeon retries (the retry sees the message already stored).
- `frames` is never cleaned up.
- Level 4 is not in the local check. I sent every case from the answer table in `PIGEON.md` to a running server with a small script and got the documented codes, but I have not seen it scored.
- The web app was driven through a full session in headless Chrome (login, claim, reply, note, live update, close); the screenshots in `docs/screenshots` come from that run. It has not been tried on other browsers or on small screens, and there are no automated frontend tests.
- Secrets default to the dev values when the environment is empty. The server refuses to start in production without `GRADER_TOKEN`, but not for the others.
