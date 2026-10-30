/*
 * English translation of js/data/lessons-aws.js — task T570. Format: js/core/i18n.js (content overlay).
 * ids: lesson-aws-002
 */
App.i18n.content({
  'lesson-aws-002': {
    title: 'S3 for backend devs: consistency, multipart upload, presigned URL, storage class and encryption',
    goals: [
      'Understand S3 data model and consistency (strong read-after-write since 12/2020) and its limits',
      'Design upload/download of large files using presigned URL and multipart upload, without routing files through the app server',
      'Choose storage class, lifecycle rule, and encryption type (SSE-S3, SSE-KMS) appropriately',
      'Avoid production pitfalls: public bucket, LIST costs, incomplete uploads, 503 SlowDown',
    ],
    body: `### What S3 is, from a backend dev perspective
S3 is **object storage**: not a file system, not a database. Each **object** consists of a key (string, e.g. {{invoices/2026/10/inv-1.pdf}}), data (bytes), and metadata, living inside a **bucket** in a region. The {{/}} in a key is just a regular character: "folders" are only how the console displays things by **prefix**.

Basic operations over HTTP: {{PUT}} (overwrites the **entire** object, cannot modify a part), {{GET}} (supports byte range), {{DELETE}}, {{LIST}} (list by prefix, max 1,000 keys per page).

### Consistency: strong read-after-write
Since December 2020, S3 provides **strong read-after-write consistency** for all PUT, DELETE, and LIST operations, at no extra cost:
- After PUTting a new object or overwriting an existing one, a GET immediately after **always** sees the new version.
- After DELETE, GET returns 404 immediately; LIST reflects the just-added/removed object right away.

What this consistency **does not** give you:
- **No lock**: two PUTs to the same key at nearly the same time — the later one wins (last writer wins). To achieve "write only if not exists" or "write only if unchanged", use **conditional writes** ({{If-None-Match}}, {{If-Match}} via ETag) which S3 added in 2024, or track state in a database.
- **Bucket configuration changes** (bucket policy, lifecycle, etc.) still have propagation latency, not covered by the guarantee above.

### Upload/download the right way: don't route files through your app
Common anti-pattern: client uploads a 200 MB file to Spring Boot, the app reads the stream and PUTs to S3. The app burns bandwidth, RAM, threads, and the load balancer timeout becomes the file size limit.

~~~text
Correct approach (presigned URL):
 client --(1) requests upload URL--> Spring Boot (checks auth, generates key)
 client <--(2) presigned PUT URL (expires in 10 min)--
 client --(3) PUT file directly--> S3
 S3 --(4) ObjectCreated event--> SQS/EventBridge --> worker processes (scan, thumbnail)
~~~

A **presigned URL** is a URL with a SigV4 signature created using the **app's** credentials. Whoever holds the URL can perform exactly one operation (GET or PUT) on exactly one key, until it expires. The signing happens **entirely in the client SDK** — no network call to AWS.

~~~java
try (S3Presigner presigner = S3Presigner.create()) {        // create once, reuse in production
    GetObjectRequest get = GetObjectRequest.builder()
            .bucket("acme-invoices").key("2026/10/inv-1.pdf").build();
    GetObjectPresignRequest req = GetObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(10))       // shorter = safer
            .getObjectRequest(get).build();
    PresignedGetObjectRequest presigned = presigner.presignGetObject(req);
    String url = presigned.url().toString();                 // hand to client, client GETs S3 directly
}
~~~

Three things to remember:
- The URL's permissions **equal the permissions of the credentials that signed it**. If the app's role lacks {{s3:GetObject}}, the signed URL also gets 403.
- Maximum validity of a SigV4-signed URL is **7 days**. If signed with temporary credentials (role), the URL **expires earlier when the credential session expires**, even if you set a longer duration.
- A leaked URL (logs, referrer, chat) works for anyone until expiry: keep TTL short, don't log the full URL.

### Multipart upload for large files
A single PUT is limited to **5 GB**. For large files (AWS suggests considering multipart from ~100 MB), use **multipart upload**:
1. {{CreateMultipartUpload}} → receive {{uploadId}}.
2. {{UploadPart}} each part (each part **5 MiB** to 5 GiB, except the last; max **10,000 parts**), can run **in parallel**, failed parts retried individually.
3. {{CompleteMultipartUpload}} with part numbers + ETags → S3 assembles the object.

Each part can also use a presigned URL so the client uploads directly. In Java, {{S3TransferManager}} (built on {{S3AsyncClient}}) auto-splits parts, runs in parallel, and retries.

> Incomplete uploads (neither completed nor aborted) still **incur storage charges** for uploaded parts and do **not** appear in LIST objects. Always have a lifecycle rule {{AbortIncompleteMultipartUpload}} (e.g., after 7 days) on buckets that receive uploads.

### Storage class and lifecycle
| Class | When to use | Notes |
|---|---|---|
| S3 Standard | frequently accessed data | default |
| Intelligent-Tiering | unpredictable access patterns | auto-tiers, small monitoring fee per object |
| Standard-IA / One Zone-IA | infrequent access but need instant retrieval | per-GB retrieval fee, 30-day minimum; One Zone = single AZ |
| Glacier Instant Retrieval | long-term storage, occasional access, need milliseconds | 90-day minimum |
| Glacier Flexible Retrieval / Deep Archive | compliance archive, rarely read | must restore before read (minutes to hours); 90 / 180-day minimum |

**Lifecycle rules** automate transitions: e.g., invoices move to Standard-IA after 30 days, to Glacier Deep Archive after 365 days, delete after 10 years. Enable **versioning** to protect against accidental delete/overwrite, plus a rule to delete noncurrent versions after N days to prevent cost bloat.

### Encryption and blocking public access
- Since 01/2023, all new objects are encrypted by default with **SSE-S3** (key managed by S3).
- **SSE-KMS**: uses a KMS key, provides audit via CloudTrail and separation of duties: reader needs both {{s3:GetObject}} **and** {{kms:Decrypt}} on the key. Every encrypt/decrypt calls KMS, can hit KMS quota; enable **S3 Bucket Key** to drastically reduce KMS calls (and cost).
- **Block Public Access** is on by default for new buckets, and ACLs are disabled by default (Object Ownership: bucket owner enforced). To serve files publicly, put **CloudFront** in front with Origin Access Control — don't make the bucket public.

### Performance and cost pitfalls
- **"Hot prefix" is old news**: S3 supports at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD per second **per prefix**, and auto-partitions as load grows. No need to prepend random hashes to keys like pre-2018 advice. Under extreme ramp-up you may still hit **503 SlowDown**: SDK retries with backoff, and you can spread load across more prefixes if needed.
- **LIST is expensive and slow**: LIST request costs as much as PUT, max 1,000 keys per page. Don't LIST to "find files by condition"; store metadata (key, owner, date) in a database, or use S3 Inventory for periodic analytics.
- **Data transfer**: egress to Internet charges per GB; accessing S3 from a private subnet via NAT Gateway also incurs per-GB processing fees. Use a **Gateway VPC Endpoint** for S3 (free) to take the private path.

### Interview relevance
Interviewers often ask: "Design 2 GB upload from mobile", "How is presigned URL secure?", "Is S3 eventually consistent?", "Reduce cost of storing 3 years of logs". Strong answer: presigned URL + multipart, short TTL, least-privilege signing role; strong consistency since 2020 but no locking; lifecycle + storage class; SSE-KMS with Bucket Key; Block Public Access + CloudFront. The exercise below lets you implement the core of presigned URLs: HMAC + expiry.

> Senior tip: With many small files (a few KB), request costs and per-object minimums of IA/Glacier classes can exceed storage costs. Bundle small files (e.g., hourly compressed logs) before tiering, and check S3 Storage Lens to see where money actually goes.`,
    exercises: [
      {
        title: 'Build your own presigned URL: HMAC-SHA256 with expiry and signature verification',
        prompt: `Simulate the presigned URL mechanism (simplified SigV4) using {{javax.crypto.Mac}}.

{{UrlSigner}} takes a secret key and a **fake clock** ({{LongSupplier}} returning epoch seconds) for deterministic testing.

1. {{signature(method, path, expires)}}: returns lowercase hex string of **HMAC-SHA256**(key, {{method + "|" + path + "|" + expires}}) (UTF-8).
2. {{presign(method, path, ttlSeconds)}}: if {{ttlSeconds <= 0}} or {{> MAX_TTL}} (604800 seconds = 7 days) throw {{IllegalArgumentException}}. Otherwise {{expires = now + ttlSeconds}} and return {{path + "?expires=" + expires + "&sig=" + signature}}.
3. {{verify(method, url)}} returns:
  ▸ {{"MALFORMED"}} if no {{?}}, missing {{expires}} or {{sig}}, or {{expires}} not a number;
  ▸ {{"BAD_SIGNATURE"}} if signature doesn't match (compare **constant-time** via {{MessageDigest.isEqual}});
  ▸ {{"EXPIRED"}} if signature valid but {{now > expires}};
  ▸ {{"OK"}} if still valid (at exact {{expires}} second it's still OK).`,
        hints: [
          'HMAC in JDK: {{Mac.getInstance("HmacSHA256")}}, {{mac.init(new SecretKeySpec(key, "HmacSHA256"))}}, then {{mac.doFinal(bytes)}}. Convert to hex with {{HexFormat.of().formatHex(...)}} (Java 17).',
          'In {{verify}}, split path and query at the first {{?}}, then split each {{k=v}} pair by {{&}}. Recompute signature from method, path, and parsed expires, compare with {{sig}}.',
          'Verify signature **first**, then check expiry: if an attacker modifies {{expires}} to extend it, the signature won\'t match because {{expires}} is part of the signed string.',
        ],
        explain: `### Why this mechanism is secure
The server stores nothing about issued URLs. All information needed for verification (method, path, expires) is **included in the signed string**. Without the secret key, you cannot forge a valid signature for a different combination, so changing the path, switching GET to PUT, or extending expires all break the signature. This is exactly the idea behind SigV4: the signature covers method, URI, selected query params/headers, and signing time; S3 recomputes and compares.

### Key details
- **Constant-time compare**: {{MessageDigest.isEqual}} compares all bytes, never stopping early on mismatch, preventing timing attacks that could guess the signature byte by byte. {{String.equals}} stops early, so it's unsafe for secrets.
- **Unambiguous delimiter**: the string-to-sign must concatenate parts in a way that one part cannot "slide" into another. SigV4 uses a canonical request with each component on its own line with standard encoding; this exercise uses {{|}} for simplicity.
- **Injected clock**: tests run deterministically without {{Thread.sleep}}. In production, clock skew between the signer and S3 causes errors ({{RequestTimeTooSkewed}}), so servers must sync via NTP.

### Common mistakes
- Checking expiry before verifying the signature: tests may still pass, but you're trusting an unauthenticated value.
- Parsing {{expires}} with {{Integer.parseInt}}: epoch seconds fits in int until 2038, but that's a time bomb; use {{long}}.`,
      },
    ],
    check: [
      {
        q: 'Service A PUTs object {{reports/r1.json}} successfully, then service B (different machine) GETs the same key. Under S3\'s current consistency model, what does B receive?',
        options: ['May get 404 for a few seconds because S3 is eventually consistent', 'Always gets the just-PUT version (strong read-after-write)', 'Old version if B is in a different AZ', 'Only gets new version if versioning is enabled'],
        answer: 1,
        explain: `Since 12/2020 S3 has strong read-after-write consistency for PUT, DELETE, and LIST, with no configuration needed. "404 for a few seconds" was the pre-2020 behavior; S3 is a regional service, client AZ doesn't affect it; versioning is unrelated to consistency.`,
      },
      {
        q: 'An app runs with an IAM role (temporary credentials with 40 minutes left) and signs a presigned GET URL with a 6-hour duration. What happens?',
        options: ['URL works for the full 6 hours', 'SDK refuses to sign because it exceeds 1 hour', 'URL expires when the temporary credentials used to sign expire, i.e., ~40 minutes', 'URL works for 7 days because that is the default'],
        answer: 2,
        explain: `A presigned URL is only valid while the credentials that signed it remain valid. Signing with temporary credentials means the URL dies with the session, even if duration is longer. The SDK does not reject a 6-hour duration (max is 7 days); 7 days is the ceiling, not the default.`,
      },
      {
        q: 'Invoices are racking up S3 storage costs even though the LIST-visible object count isn\'t growing. The bucket receives multipart uploads from mobile where the network is flaky. Most likely cause and fix?',
        options: ['Versioning is enabled; disable versioning', 'Incomplete multipart uploads still charge for uploaded parts; add AbortIncompleteMultipartUpload lifecycle rule', 'S3 charges per LIST request; reduce LIST calls', 'Objects are being replicated to another region'],
        answer: 1,
        explain: `Parts of an incomplete upload still consume storage and **do not appear** in LIST objects, matching the symptoms. The {{AbortIncompleteMultipartUpload}} lifecycle rule cleans them up automatically. Noncurrent versions from versioning are visible when listing versions, and disabling versioning doesn't delete them; LIST charges request fees, not storage; replication only happens if you configure it.`,
      },
    ],
  },
});