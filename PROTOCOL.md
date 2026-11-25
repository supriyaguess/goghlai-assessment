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

**Join.** On first opening the notes panel, the browser generates an ECDH keypair, stores the private key, and registers the public key (`PUT /api/keys`). Registration happens only when no local keypair exists, because replacing a key invalidates the K that was wrapped for the old one. The first registration for a user/workspace wins.

**First-member bootstrap.** If the workspace is not initialised and I have no wrapped key, I generate K, wrap it for my own public key (wrappedBy = me) and `POST .../keyring`. A 409 means someone else got there first; I reload state.

**Sharing K.** Any member holding K, on panel load and every 10 s, looks for members with `hasKey = false` and `PUT`s a wrapped K for each. Wrapping: `ECDH(my private, recipient public)` -> HKDF-SHA256 (empty salt, info `switchboard-wrap-v1`) -> AES-GCM 256 key; encrypt raw K with a random 12-byte IV; `wrappedKey = base64(iv || ciphertext)`. The server accepts a wrapped key for a member only if that member has none yet (first write wins), so a teammate cannot overwrite a key someone already holds. A member without K shows "Waiting for a teammate to share the workspace key" and polls every 5 s. To unwrap, the recipient derives the same key from `ECDH(my private, wrappedBy's public)`, with the wrapper's public key taken from the members list the server returns.

**Writing a note.** AES-GCM with K, random 12-byte IV, plaintext UTF-8, additional data `${workspace}|${contact}|${author}`. Sent as `{ciphertext, iv}`.

**Reading.** Fetch notes, decrypt each with K using AAD built from the workspace, the contact being viewed, and the note's author id as reported by the server. Failure (tampering, wrong key, moved note, changed author) shows "Could not decrypt this note" for that note. The AAD stops a note being moved to another conversation or workspace and stops it being attributed to a different user. Live updates arrive as `note.added` frames, which trigger a refetch.

## What the server can and cannot do

Cannot: read notes, recover K, forge a note that decrypts (it lacks K), edit a note undetected, or move a note to another conversation or author undetected.

Can: see all metadata, delete or withhold notes, replay or duplicate notes, refuse to serve keys, and substitute public keys (see attack 1).

## Attacks this scheme does NOT stop

1. **Public key substitution by the server.** Public keys are trusted as the server reports them; there is no out-of-band fingerprint or safety-number check. A malicious or compromised server can register a fake member with a key it controls, or replace a pending member's public key. A holder of K then wraps K for that key, and the server unwraps it and reads all notes from then on plus every existing note it holds. A member's own public key can be replaced by that member at any time, so a planted key is only noticed if someone compares keys outside the app, which this design does not ask anyone to do. An existing holder is only ever fooled this way: by the server handing over a substituted key.

2. **No forward secrecy, rotation or revocation.** K never changes. Someone removed from the workspace keeps K and any ciphertext they copied, and can read everything written under K, including future notes if they can still obtain ciphertext. A new member given K reads all old notes. A leaked device key or K compromises all notes, past and future.

3. **Dropping, withholding and replaying notes, and metadata.** Notes carry no signature and no sequence binding. The AAD prevents moving a note across conversations or authors but not deleting a note, hiding it from some readers, or duplicating a valid note within the same conversation; none of this is detectable. The server also sees who wrote each note, when, its length, and which contact it concerns.

Also out of scope: XSS in the web app can use the keys in the page (the private key is non-extractable, but the page can still ask the browser to use it, and K is in memory); and losing the browser profile (IndexedDB cleared, new device) loses the private key. Access is regained by registering a new public key (the server then drops the key that was wrapped for the old one) and having a teammate who holds K share it again.
