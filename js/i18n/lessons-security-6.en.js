/*
 * English translation of js/data/lessons-security.js — task T697. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-007
 */
App.i18n.content({
  'lesson-security-007': {
    title: 'Encrypting sensitive fields with AES-GCM: the IV must never repeat, key versions enable rotation, blind index enables search',
    goals: [
      'Tell apart when you need {{hash}} and when you need two-way {{encryption}}, and why AES-{{ECB}} is banned while {{AES/GCM/NoPadding}} is the right choice',
      'Generate a fresh random 12-byte {{IV}} for **every** encrypt call, and understand why reusing an IV under the same key is a disaster',
      'Design the storage format {{v<version>:base64(iv + ciphertext + tag)}} and rotate keys while still being able to read old data',
      'Write {{blindIndex}} with {{HmacSHA256}} to enable equality search on an encrypted column, and know in advance what it leaks',
    ],
    body: `### Three things people mix up: encoding, hashing, encryption
| Tool | Can you read it back | Needs a key | Used for |
|---|---|---|---|
| Encoding (Base64, hex, URL-encode) | Yes, anyone can read it | No | Changing the byte **format** — provides zero security |
| Hash (SHA-256, bcrypt) | **No** | No (the salt is not secret) | Passwords, integrity checks, matching values |
| Encryption (AES-GCM) | Yes, when you have the key | **Yes** | Business data you must **reuse**: CCCD number, bank account number |

The previous lesson settled passwords: a password **never needs to be read back**, so hashing is the right tool. A CCCD number (Vietnam's national ID number) is different: you print it on contracts, cross-check it against the civil-residency authority's data, show the customer the last 4 digits — meaning the application **must be able to decrypt**. That is the moment you use symmetric encryption. And that is also the moment every problem of this lesson appears: how to manage the key, how to rotate it, and how to search over encrypted data.

One legal note for the Vietnamese context: CCCD numbers, bank account numbers and card numbers are personal data under Decree 13/2023/ND-CP, and the "sensitive personal data" group must be encrypted both in transit and at rest. In other words, a {{cccd}} column stored in plaintext in the DB is not a "fix it if you notice it" detail — it is a violation.

### AES and its "mode" — why ECB is banned
{{AES}} is a **block cipher**: it encrypts data one 16-byte block at a time with a 128/192/256-bit key. Real data is longer than 16 bytes, so you need a **mode** that decides how multiple blocks are chained together. That is exactly what {{Cipher.getInstance("AES/.../...")}} is asking you.

{{ECB}} (Electronic CodeBook) is the naive-est mode: each block is encrypted independently. Consequence: **the same plaintext block always produces the same ciphertext block**, no matter which row or which moment. CCCD numbers differ only in a few last digits, so the leading part of millions of people's ciphertexts is **identical**; an attacker looking at the table can see who shares the first 8 digits, group them together and infer the numbering rules. The classic picture: encrypting the Tux whale image with ECB still clearly shows the whale, because regions of the same colour produce the same ciphertext.

{{CBC}} (Cipher Block Chaining) fixes that by XOR-ing the previous block into the next one, but it needs padding and it suffers a notorious family of flaws called **padding oracle**: if the server returns a different error for "bad padding" versus "bad MAC", an attacker replays millions of requests to decrypt the data byte by byte without ever knowing the key — a class of bugs that has been exploited in the real world many times, from the encrypted cookies of web platforms all the way to BitLocker and SSH (CipherSuck, 2024). The general lesson: **do not assemble security out of separate primitives**; use a mode that authenticates out of the box.

### GCM: one mode, two features
{{GCM}} (Galois/Counter Mode) = the **encryption** part runs in CTR mode + the **authentication** part is GHASH.
- CTR: from the IV (also called a nonce) and a counter, AES generates a **keystream**, then XORs the keystream with the plaintext. That is why the ciphertext is **exactly as long as** the plaintext — hence the third parameter of {{Cipher.getInstance("AES/GCM/NoPadding")}} is {{NoPadding}} (no need to stuff extra bytes to fill a block).
- GHASH: computes a 16-byte **tag** that covers the IV, the ciphertext and (optionally) extra bytes called AAD. When decrypting, the software recomputes the tag and compares; on any difference it throws {{AEADBadTagException}}.

This encryption + authentication pair is called **authenticated encryption** (AEAD). It blocks a very realistic attack: the attacker cannot read plaintext but has full power to modify column values in the DB. With {{ECB}} or {{CBC}} without a MAC, flipping a few bytes can change an entire number or the recipient's name. With GCM, even a single modified bit makes {{decrypt}} fail immediately.

### The 12-byte IV: why reuse is fatal
With {{GCM}}, the absolute taboo is **reusing an IV under the same key**. The reason, step by step:
1. Same key + same IV → the same keystream (the keystream is derived only from the key and the IV).
2. {{C1 = P1 xor K}} and {{C2 = P2 xor K}} → {{C1 xor C2 = P1 xor P2}}. The keystream cancels out and the attacker obtains **the XOR of the two plaintexts**. Knowing one of the two values reveals the other; and with fixed-format records (a 12-digit CCCD) you can recover both.
3. Worse for GCM: IV reuse also allows recovering the GHASH subkey {{H}}, meaning the attacker can **forge valid tags** without ever knowing the AES key.

Because {{GCM}} typically uses random IVs, you must estimate the **collision** probability (the birthday bound): the NIST standard SP 800-38D recommends no more than {{2^32}} ciphertexts produced under one key with random IVs. That number is the real reason you **must** have key rotation — not the vague "for safety". Using an 8-byte IV or hand-writing your own counter is asking for trouble; 12 bytes is the standard length that GCM processes fastest.

### The record format and AAD
The widely used format (and the format this exercise requires):

~~~text
stored = "v" + keyVersion + ":" + base64( IV(12 bytes) + ciphertext + tag(16 bytes) )
example = v2:Sjao9xkQ0m1QY3p0Y2V...
~~~

| Piece | Who can read it | Note |
|---|---|---|
| {{v2}} | No key needed | Says which key must be fetched to decrypt; it must exist in the keyring |
| {{IV}} 12 bytes | No key needed | Travels with the ciphertext, is **not** secret, but must **not** repeat |
| ciphertext | Only holders of the key | Exactly as long as the plaintext |
| tag 16 bytes | No key needed (verification only) | Proof that the ciphertext has not been modified |

The {{tag}} already sits at the end of the array returned by {{doFinal}}, you never compute it separately. Extra size: 12 + 16 = 28 bytes, then base64 inflates it by ~1.37x. A 12-character CCCD → 40 bytes → 56 base64 characters → a {{varchar(96)}} column leaves comfortable room for the prefix too.

**AAD** (Additional Authenticated Data): bytes fed into the tag computation but **not encrypted** — typically the column name, the tenant id, the user id of the row. Its purpose: it blocks **ciphertext cut-and-paste** attacks between rows (take the CCCD ciphertext of person A and write it into person B's row: nothing readable, but without AAD, B suddenly carries A's CCCD). AAD also makes the ciphertext of the same value in two different columns come out different.

### Key rotation via versions
No key lives forever: someone with read access has left the company, the volume of data encrypted under one key has exceeded the safe limit, or a key leak is suspected (including a leak through logs). Rotating a key means: **add a new key, bump the "current version", never edit the content of an old key**.

The most practical strategy (the {{rotate}} method in the exercise):
- {{decrypt}}: read the version from the prefix → fetch the matching key. Old keys must still be present in the keyring, otherwise old data is **lost forever**.
- {{encrypt}}: always write with the current key → data gradually "migrates" itself every time a record is updated.
- **Re-wrap on read**: if decrypting an old-version blob succeeds, rewrite it with the new version while you are at it (idempotent — nothing to write if it is already the current version). This spreads the cost evenly, with no giant overnight job locking the table.
- **Batch job**: run offline when you need an "emergency rotation" after a key leak, in small batches with progress metrics.
- Once no record uses the old key anymore → **destroy** the key. Deleting the key is deleting the data (**crypto-shredding**, one way to honour a "forget me" request), and that is also why you must not back up keys in the same place you back up the DB.

In production, do not keep keys in an {{application.yml}} committed to git. The standard pattern is **envelope encryption**: a KMS (AWS KMS, GCP KMS) or HashiCorp Vault holds the **KEK**, the app only receives a wrapped **DEK** and unwraps the DEK in memory; the app can read the current DEK and old DEKs but cannot obtain the KEK on its own. If the DB is dumped without the keyring, the data is just garbage.

### Blind index: searching an encrypted column
Once you encrypt, {{WHERE cccd = '0791234567890'}} stops working: the value in the DB is a base64 blob, and because the {{IV}} is random, encrypting the same CCCD twice yields two different results → nothing to compare against.

The solution is a **blind index**: an auxiliary column holding {{HMAC-SHA256(index_key, normalized_value)}} — deterministic, so {{SELECT * FROM customers WHERE cccd_index = ?}} runs and uses a normal B-tree index. The application computes the HMAC of the just-typed value and then asks the DB; the DB never sees plaintext.

Why a keyed HMAC and not bare SHA-256? A CCCD consists of only 12 digits, a value space of roughly {{10^12}} (in practice even narrower because of the numbering rules) — a GPU hashes hundreds of millions of SHA-256 values per second, so a rainbow-style lookup table can be built within a few hours. The HMAC key makes such lookup tables useless and gives each environment its own distinct index.

Three costs you have to pay, so state them clearly when designing:
- **Normalize** the value before generating the index and before querying (strip whitespace, strip leading zeros, same UTF-8 normalization) — if the two sides differ by one character, the search finds nothing.
- The index **reveals duplication**: two rows with the same value share the same {{blind_index}}. For CCCD (unique by nature) that is fine; for a low-cardinality column (gender, document type) you have just drawn the value-distribution chart for the attacker.
- No {{LIKE}}, no range search. If the business truly needs "search the last 4 digits", design a dedicated {{cccd_last4}} column (still scoped with {{tenant_id}}) instead of forcing the impossible.

### Plain Java: 8 lines is enough
~~~java
Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);                       // fresh IV for EVERY call
c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
byte[] body = c.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));   // ciphertext || tag

// when decrypting: the tag is checked inside doFinal
Cipher d = Cipher.getInstance("AES/GCM/NoPadding");
d.init(Cipher.DECRYPT_MODE, oldKey, new GCMParameterSpec(128, ivFromStorage));
byte[] plain = d.doFinal(ctFromStorage, 12, ctFromStorage.length - 12);   // throws AEADBadTagException if tampered
~~~

### The price you pay
- AES runs at several GB/s thanks to CPU {{AES-NI}}, so **performance is not the reason** to fear encryption; the real cost is losing queryability.
- You lose {{ORDER BY}}, {{GROUP BY}}, {{LIKE}} and aggregates on the encrypted column; reports must be computed at the application layer or from a derived column.
- The key is a **single point of failure**: KMS down, key deleted, region lost — the data becomes unreadable. You need a keyring with several versions and a restore procedure that is actually rehearsed periodically.
- Plaintext can still leak through other channels: request logs, exception messages, APM, audit logs, API responses returning DTOs, the clipboard of operations staff. Encrypting the column while logging {{cccd}} is the same as not encrypting.
- Migration: adding a column or changing the format later requires a script and inventory numbers (how many rows per version).

### Production traps
- A fixed IV, IV = 0, or a counter that restarts from 0 every time the app restarts → IV reuse.
- "Encrypting" with {{Base64}} and calling it encrypted; or hand-rolling {{AES-CBC}} + {{MD5}} for integrity.
- Using **the same key** for {{AES}} and for the {{HMAC}} index, or one key for every column and every environment → you lose independence; split the keys, or derive them from one master key with a dedicated label per purpose.
- Converting {{AEADBadTagException}} into {{IllegalArgumentException}}: the caller can no longer distinguish "data with a bad format" from "data that was tampered with", and you lose the early-warning signal entirely.
- Putting the key in an environment variable and then printing all environment variables to the startup log "for debugging".
- Forgetting that encrypted data still must be **validated before use** (after {{decrypt}}, still check the CCCD format), and still needs SQL-injection protection like any other column.
- Rotating keys by overwriting the old key in the keyring: the correct move is to add a new version; overwriting makes every old blob unreadable.

### Interview angle
The usual question set: "How do you store a CCCD number?", "What is the difference between an IV, a nonce and a salt?", "Why not ECB?", "How do you rotate keys and still read the old data?", "Once it is encrypted, how do you search?", "What is AAD for?". Each question is answered above; when answering, go in the order **threat → mechanism → trade-off** (for example: "ECB leaks patterns, so use GCM; GCM forbids IV reuse, so every encrypt call gets a fresh random 12-byte IV and you rotate the key before hitting the 2^32 ciphertexts ceiling; since the column can no longer be queried, you add an HMAC blind index column"). Do the exercise to really own the mechanism part: write {{encrypt}}, {{decrypt}}, {{rotate}}, {{blindIndex}} and watch with your own hands {{AEADBadTagException}} blow up when someone flips a single byte.`,
    exercises: [
      {
        title: 'Write FieldCipher: AES-GCM with random IV, key versions, rotate and blind index',
        prompt: `Complete the {{FieldCipher}} class. The two constants {{IV_BYTES = 12}} and {{TAG_BITS = 128}} are already declared, **do not change them**.

- {{FieldCipher(keysByVersion, currentVersion, random)}}: store a **copy** of the map ({{new HashMap<>(...)}} so that external mutation cannot destroy your ability to decrypt); {{currentVersion}} must have a key in the map, otherwise throw {{IllegalArgumentException}}.
- {{encrypt(plaintext)}}: generate {{IV_BYTES}} fresh bytes with the {{SecureRandom}} passed in, encrypt with {{AES/GCM/NoPadding}} using the current key and {{GCMParameterSpec(TAG_BITS, iv)}}, return
  {{"v" + currentVersion + ":" + Base64.getEncoder().encodeToString(iv || ciphertext || tag)}}
  ({{doFinal}} already returns the ciphertext followed by the tag, you just prepend {{iv}}). Do not throw any checked exception other than {{GeneralSecurityException}}.
- {{decrypt(stored)}}: split off the version and the base64 part, **take the key according to the version read from the string** (it may be an old key), decrypt and return the UTF-8 plaintext. Error convention: malformed input (the {{null}} string, missing {{v}} prefix, no {{:}}, a version not present in the map, bad base64, or a decoded length smaller than {{IV_BYTES + TAG_BITS / 8}}) → {{IllegalArgumentException}}; invalid tag → **let {{AEADBadTagException}} propagate as-is**, never wrap it into another type (the caller must be able to tell "bad format" apart from "tampered").
- {{rotate(stored)}}: if {{stored}} already carries the current version, **return that exact string** (idempotent, no pointless rewrite); otherwise decrypt with the old key and return a new ciphertext under the current version.
- {{blindIndex(plaintext, hmacKey)}} (static): HMAC-SHA256 over the UTF-8 bytes of {{plaintext}}, return **lowercase** hex, 64 characters ({{HexFormat.of().formatHex(...)}}). This is the value written into the {{cccd_index}} column for equality queries. Do not throw a checked exception.

JDK 17 only. Do not use {{ThreadLocal}} or real time; create a new {{Cipher}} on every call (it is not thread-safe).`,
        hints: [
          'Assemble the array with {{ByteBuffer.allocate(iv.length + body.length).put(iv).put(body).array()}}; when splitting it back apart, use {{Arrays.copyOfRange}} for the IV and {{doFinal(all, IV_BYTES, all.length - IV_BYTES)}} for the rest.',
          '{{GCMParameterSpec(TAG_BITS, all, 0, IV_BYTES)}} is the overload that reads the IV straight from the stored array — no copy needed.',
          'Do not wrap the entire {{decrypt}} in one {{catch}} of {{GeneralSecurityException}} and rethrow {{IllegalArgumentException}}: {{AEADBadTagException}} is a subclass of {{GeneralSecurityException}}, so it would get swallowed.',
          '{{Integer.parseInt}} throws {{NumberFormatException}} (a subclass of {{IllegalArgumentException}}) and {{Base64.getDecoder().decode}} throws {{IllegalArgumentException}} — those two already satisfy the requirement "bad format means IllegalArgumentException".',
          'For {{stored.charAt(0)}} when {{stored}} is empty: check {{null}} and {{isEmpty}} before reading {{charAt}}, so you do not throw {{IndexOutOfBoundsException}}.',
        ],
        explain: `Four places decide this lesson, and they are also the four things an interviewer loves to dig into.

**First: do not wrap {{AEADBadTagException}}.** It is a subclass of {{GeneralSecurityException}}, so a tidy-looking {{catch (GeneralSecurityException e)}} will swallow it and turn "someone is tampering with the data" into "string with a bad format". Those two situations need very different actions: a bad format is dirty data, a bad tag is an **integrity violation** — you must write an audit log and raise an alert. This is why {{decrypt}} declares {{throws GeneralSecurityException}} and lets the exception travel up naturally.

**Second: enforce the minimum length.** {{GCM}} needs room for the 12-byte IV and the 16-byte tag. A 20-byte blob is valid base64 but cryptographically meaningless: if you do not block it and push it straight into {{doFinal}}, you get {{InvalidAlgorithmParameterException}} or an unpredictable result. Blocking it with {{IllegalArgumentException}} at the format-parsing layer is the right place and the right error type.

**Third: rotate must be idempotent.** If {{rotate}} always decrypts and re-encrypts, every run generates a new IV → the blob changes constantly, the batch job overwrites itself, the binary diff of your backups balloons, and you never converge. Check the version first; if it is already current, return the string verbatim — that is also how a rotate job can run again and again without keeping any state.

**Fourth: the HMAC key must be different from the AES key.** One key serving two purposes (encryption and indexing) means a single leak takes down both, and for some constructions it even opens the door to attacks that use the HMAC oracle itself to probe ciphertexts. Split the keys, or derive them from a master key with HKDF using a dedicated label per purpose.

Beyond the exercise, remember two things because they are the "why" questions that get challenged the hardest: (1) a deterministic {{blindIndex}} is a **deliberate leak** — it tells you "two rows share the same value", so accept it only for near-unique data like CCCD, never for low-cardinality columns; (2) {{AAD}} does not hide data, it **binds** the dependent data (tenant id, column name) into the tag check, blocking ciphertext cut-and-paste between rows. Add {{c.updateAAD}} before {{doFinal}} and feed it the same bytes when decrypting, otherwise the tag will never match.`,
      },
    ],
    check: [
      {
        q: 'Why is {{ECB}} banned and {{GCM}} chosen for a sensitive data column?',
        options: [
          'ECB is slower than GCM, so it should only be used when you need speed',
          'ECB encrypts each block independently, so the same plaintext always gives the same ciphertext and leaks patterns; GCM both encrypts and attaches an authentication tag, so a modified ciphertext is detected',
          'ECB only works with 128-bit keys, while GCM supports 256-bit',
          'ECB cannot be decrypted back, so you must use GCM',
        ],
        explain: `The problem with {{ECB}} is **per-block determinism**: two rows whose first 16 bytes are identical will have identical first 16 ciphertext bytes — enough to group rows and infer the structure of the data. {{GCM}} fixes this with CTR (a different keystream for every IV) and adds a tag for integrity checking — i.e. **authenticated encryption**. Both ECB and GCM run with 256-bit keys and both decrypt back; speed is not the reason.`,
      },
      {
        q: 'Two {{encrypt}} calls on the same CCCD with the same key produce two different blobs. What happens if those two calls **reuse the IV**?',
        options: [
          'No problem, because the ciphertexts already differ thanks to the tag',
          'The same key and the same IV produce the same keystream, so C1 xor C2 equals P1 xor P2: the attacker cancels the keystream and obtains the XOR of the two plaintexts, and with GCM can even recover the GHASH subkey to forge tags',
          'It only increases storage size, with no effect on security',
          '{{decrypt}} will fail, so the system detects the problem on its own',
        ],
        explain: `This is a **detectable but irrecoverable** kind of bug: {{decrypt}} still returns the correct plaintext, so the logs say nothing, while confidentiality is already lost. Two ciphertexts under the same IV → the same keystream, and XOR-ing them cancels the keystream out. Because {{GCM}} typically uses random IVs, the NIST standard puts a ceiling of {{2^32}} ciphertexts per key — and that is precisely why key rotation is mandatory.`,
      },
      {
        q: 'You need {{WHERE cccd = ?}} on a column encrypted with AES-GCM. How do you do it?',
        options: [
          'Encrypt the value you are looking for with the same encrypt function and compare, because the same input always gives the same ciphertext',
          'Store an extra blind-index column holding HMAC-SHA256 of the normalized value under a separate key, and query with {{WHERE cccd_index = ?}}',
          'Switch the column to AES-ECB so the ciphertext becomes deterministic',
          'Impossible — you must decrypt the whole table into memory',
        ],
        explain: `{{encrypt}} with GCM is **not deterministic** (random IV), so the first option is wrong from its very assumption. {{blindIndex}} produces a deterministic value without revealing the content; decrypting the entire table would blow up memory and violate the least-privilege principle as well. ECB is indeed deterministic, but in exchange it leaks the pattern of the whole dataset — that is a vulnerability, not a solution.`,
      },
      {
        q: 'What is the correct way to rotate keys?',
        options: [
          'Edit the old key in the keyring into the new key, so old data reads itself back automatically',
          'Add a new key with a higher version, let decrypt pick the key by the version stored in the blob, let encrypt always write with the current key, and destroy the old key once no record uses it anymore',
          'Keep one single key and change the IV every day',
          'Re-encrypt the whole table in one large transaction during off-peak hours',
        ],
        explain: `Overwriting the old key makes **every old blob unreadable** — the most common disaster of this kind. The version inside the blob says which key to use, so the keyring keeps several keys at once and data "migrates" itself as records are read and written. Changing the IV has nothing to do with the key. Rescanning the whole table in a single transaction locks it for hours and cannot handle rows that fail mid-way; the real strategy combines re-wrap-on-read with small batched jobs.`,
      },
    ],
  },
});
