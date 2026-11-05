/*
 * English translation of js/data/q-security.js — task T656. Format: js/core/i18n.js (content overlay).
 * ids: security-025 security-026 security-027 security-028 security-029 security-030 security-031 security-032
 */
App.i18n.content({
  'security-025': {
    q: "Managing secrets (DB password, API key) in production: how do you use Vault/AWS Secrets Manager, rotate a DB secret without downtime, and avoid leaking secrets into env/logs?",
    a: `**Summary:** Never keep secrets in code or in git; read them from a secret manager at runtime, cache them briefly, rotate through dual-credential (two parallel DB users) and only then revoke the old one, once the app is already using the new credential.

### What a secret manager is
A secret manager (HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager) is a store purpose-built for secrets, with audit trail, versioning, automatic rotation and access control based on IAM (AWS's identity/permission system). The app does not hardcode the secret; it calls an API to fetch the secret at startup, or has the secret mounted as a file/volume.

### Why plain env vars are not enough
Env vars leak easily: {{/proc/<pid>/environ}}, core dumps, crash logs, Docker inspect, CI artifacts. A secret manager lets you revoke/rotate on demand and audit who read the value.

### The secret-reading pattern in Spring Boot
Use Spring Cloud Vault or the AWS Secrets Manager JDBC driver (aws-secretsmanager-jdbc). Example with AWS:
~~~yaml
spring:
  datasource:
    url: jdbc-secretsmanager:mysql://db:3306/app
    username: prod/db-creds   # secret name, not the real user
    driver-class-name: com.amazonaws.secretsmanager.sql.AWSSecretsManagerMySQLDriver
~~~
The driver calls Secrets Manager itself to obtain username/password. The app never sees the secret.

### Rotating a DB secret without downtime (dual credential)
1. Create a new DB user ({{app_v2}}) with the same grants as {{app_v1}}, keep both active.
2. Update the secret in the secret manager so it points to {{app_v2}} (a new version).
3. App instances pick up the new secret on restart/refresh (or use @RefreshScope + actuator refresh). Rolling restart, pod by pod.
4. After every pod uses the new credential and the old connections have timed out, drop {{app_v1}}.
5. Write an audit record: who rotated, when.

### Avoiding leaks in logs
- Never log an object that contains a password/token; mask it in toString().
- Redact secrets in exception stack traces (Spring Boot {{server.error.include-stacktrace=never}} in prod).
- Do not print the environment at startup (Spring Boot banner/custom code).
- Use structured logging and filter the {{password}}, {{token}}, {{secret}} fields.
- Pre-commit hooks (gitleaks, trufflehog) block secrets from entering git; scan images in CI.

### Short-lived credentials (Vault dynamic secrets)
Vault can hand out DB credentials that live for 1 hour and are revoked automatically. The app renews the lease periodically. This shrinks the blast radius if a credential leaks.

### Pitfalls
- Caching the secret for too long → rotation never takes effect; keep the cache TTL ≤ a few minutes.
- Partial rotation failure: half the pods still hold the old credential → keep both DB users active until you have verified.
- Secrets in a Kubernetes configmap (base64 only, not encrypted) — use Sealed Secrets/External Secrets Operator.

> Senior tip: I treat a secret as something "with a use-by date", not something "configured once". Every secret must have an owner, a TTL and a rotation procedure that has been tested in staging before production ever needs it.`,
    follow: [
      "Vault dynamic secret vs static secret: when to choose which, and what is the latency trade-off?",
      "How do you rotate a JWT signing key without killing currently active sessions?",
      "A secret already leaked into git: what are the emergency response steps?",
    ],
  },
  'security-026': {
    q: "mTLS between microservices and service mesh: the mechanism, cert rotation without downtime, and when you need mTLS instead of one-way TLS?",
    a: `**Summary:** mTLS authenticates both client and server with certificates; a service mesh (Istio/Linkerd) issues and rotates those certificates automatically and enforces policy, with no change to application code.

### One-way TLS vs mTLS
- One-way TLS: the client verifies the server (the server's certificate). The server has no idea who the client is → you authenticate with a token/API key.
- mTLS (mutual TLS): both sides present a certificate and verify each other. Identity = the certificate (a SPIFFE ID), no token needed.

### Why microservices need mTLS
Inside a cluster, services call services over the internal network. A token can be stolen and replayed; a certificate is bound to the workload identity, is harder to steal and rotates automatically.

### What a service mesh does
A service mesh (Istio, Linkerd) injects a sidecar proxy (Envoy) into every pod. The proxy handles mTLS: it gets the certificate from a CA (istiod), performs the handshake, rotates it. The app talks plaintext to the localhost sidecar; the sidecar encrypts everything crossing the network. The app needs no TLS code at all.

### Certificate rotation without downtime
- Short-lived certs (24h) + automatic renewal before expiry.
- Istio uses SDS (Secret Discovery Service): it pushes the new cert into the proxy without restarting the pod.
- Rotation overlap: the new cert is active before the old one expires; connections still using the old cert stay alive until they close.
- Gracefully: the proxy drains old connections.

### SPIFFE/SPIRE
A workload-identity standard: every workload has a SPIFFE ID ({{spiffe://cluster/namespace/sa}}). The mesh uses SPIFFE for authorization: "service A may call B".

### Authorization policy
After authentication via mTLS, enforce authorization: an {{AuthorizationPolicy}} allows only service-a to call service-b on the /orders path. This blocks lateral movement when one pod is compromised.

### When you do not need mTLS
- A simple monolith, few services.
- You already have a zero-trust network + strong tokens (short-TTL JWT) + network policy.
- The performance/complexity budget does not allow a mesh.

### Pitfalls
- An expired cert → all traffic fails; monitor certificate expiry.
- Debugging is harder: traffic is encrypted → use mesh tap/telemetry.
- A wrong trust domain → cross-cluster calls fail.

> Senior tip: mTLS solves "who is calling me" at the network layer; you still need authorization at the application layer for business rules. The mesh is infrastructure, it does not replace domain-level authorization.`,
    follow: [
      "Compare Istio vs Linkerd: when do you choose which?",
      "How do you debug a request that fails because of mTLS between two pods?",
      "Does mTLS protect against replay attacks?",
    ],
  },
  'security-027': {
    q: "Rate limiting and anti brute-force for login/OTP in a banking system: design, where to place it (gateway vs app), and which techniques actually work?",
    a: `**Summary:** Put rate limiting at the gateway/API gateway for raw traffic and inside the app for business logic (per account, per device); combine gradual lockout, CAPTCHA, device fingerprinting and OTP throttling keyed on the phone number.

### Two layers
- Gateway (Kong, AWS WAF, Cloudflare): limits by IP/globally, blocks volumetric attacks and bots. Cheap and fast, but it does not know the user.
- App: limits by username/account/device, and knows business context (5 wrong passwords → lock).

### The keys you limit on
- IP (easy to defeat with NAT/VPN).
- Username/account (stops credential stuffing — attacker replays leaked user/password pairs).
- Device fingerprint / user-agent.
- Phone number (for OTP).

### Algorithms
- Token bucket / leaky bucket: allows a small burst, steady average rate.
- Sliding window counter: more accurate, costs more memory.
- Fixed window: simplest, vulnerable to boundary bursts.

### Anti brute-force on login
- Gradual lockout: 5 failures → locked 15 minutes; 10 failures → 1 hour; never permanent lockout (an attacker can deliberately fail to lock the victim out).
- Progressive delay: each failure increases the response delay (tarpit) instead of locking.
- CAPTCHA after N failures.
- Notify the user when many failures happen (email/SMS).
- Compare password hashes in constant time ({{MessageDigest.isEqual}}) to avoid a timing attack.

### OTP throttling (banking)
- Cap OTP messages per phone number: 3/hour, 10/day.
- OTP with a short TTL (3-5 minutes), single-use, bound to the transaction (amount, recipient).
- Anti OTP brute-force: 3 wrong attempts → invalidate the OTP and require a new one; rate-limit the verify endpoint per IP+phone.
- Never return a message distinguishing "wrong OTP" from "expired OTP" (that is an oracle).

### Distributed rate limiting
Use Redis with an atomic Lua script (INCR + EXPIRE) to count across many instances. Or Redis Cell (the token-bucket module).

### Pitfalls
- Limiting by IP behind a corporate NAT → many users share one IP and get blocked together. Use a composite key (IP+account).
- The attacker rotates IPs (botnet) → you need device fingerprinting + behavioural signals.
- Permanent lockout is abused by attackers to DoS the victim → use gradual lockout + unlock via email.

> Senior tip: in banking, rate limiting is a compensating control, not the primary control. What matters more is MFA, transaction signing and anomaly monitoring. I design rate limits to buy time for detection, not to "block absolutely everything".`,
    follow: [
      "How do you implement distributed rate limiting accurately with a Redis cluster?",
      "Credential stuffing vs password spraying: how do they differ and how do you detect each?",
      "OTP brute-force: why is a 6-digit OTP only safe when rate limiting exists?",
    ],
  },
  'security-028': {
    q: "Supply chain security: SBOM, dependency scanning, container image signing, and handling CVEs in transitive dependencies?",
    a: `**Summary:** Produce an SBOM for every build, scan dependencies (direct + transitive) with an SCA tool, sign images with cosign and verify the signature at deploy time; handle transitive CVEs by overriding/upgrading the parent dependency or by controlled exclusion.

### The supply-chain threat model
The attacker does not attack your app directly, they come through a compromised dependency (event-stream, xz utils), an injected base image, or a modified build pipeline. The goal is to guarantee that the artifact you deploy really is the artifact built from reviewed code.

### SBOM (Software Bill of Materials)
An inventory of every component (library, version, license) inside an artifact. Standards: SPDX/CycloneDX. Generated with Syft/Trivy. Stored next to the release so you can trace back when a new CVE appears.

### Dependency scanning (SCA = Software Composition Analysis)
- Direct: declared in pom.xml.
- Transitive: resolve the whole dependency tree ({{mvn dependency:tree}}).
- Tools: OWASP Dependency-Check, Snyk, Trivy, GitHub Dependabot.
- Run in CI: fail the build on CVE severity >= High (with a time-bounded allowlist if you must).

### Handling a transitive CVE
1. Find the path: {{mvn dependency:tree -Dincludes=vulnerable-lib}}.
2. Option A: upgrade the parent dependency to a version that fixes the CVE.
3. Option B: force the version directly in dependencyManagement (override).
4. Option C: exclude the transitive dependency and add the safe version explicitly.
5. If no fix exists: assess exploitability (does the CVE actually touch your code path?), apply a compensating control, document the risk + a deadline.

### Signing container images
- Build the image → push to the registry → sign with cosign (Sigstore), keyless (OIDC) or with a key.
- An admission controller (Kyverno/OPA Gatekeeper) in Kubernetes verifies the signature before scheduling: only images signed by the CI identity are allowed.
- Attestation: attach an SBOM attestation to the image.

### Build reproducibility & SLSA
- SLSA levels: build provenance (who built it, from which commit, with which build script).
- Hermetic build: no dependency fetching during the build, use a verified cache.
- Pin the base image by digest (sha256) instead of by tag.

### Pitfalls
- Scanning only direct dependencies → you miss transitive ones (log4shell sat in a transitive dep).
- A permanent CVE allowlist → security debt.
- Signing images but never verifying at deploy → the signature is meaningless.

> Senior tip: supply chain is a "trust but verify" problem. I do not trust the registry or the dependency; I verify at deploy time through an admission policy and audit the provenance. If nothing is verified at runtime, everything before that is just paperwork.`,
    follow: [
      "Log4Shell: why did a CVE in a transitive dependency become a disaster, and how do you prevent a repeat?",
      "Cosign keyless vs key-based signing: trade-offs and rotation?",
      "What do you do when a dependency is yanked from Maven Central?",
    ],
  },
  'security-029': {
    q: "Storing user passwords: bcrypt/argon2, pepper, and migrating old hashes (MD5/SHA1) to a strong hash without forcing users to change their password?",
    a: `**Summary:** Use Argon2id (or bcrypt) with an automatic salt; add a secret pepper on the app side; migrate old hashes by re-hashing on successful login, transparently to the user.

### Why not MD5/SHA1/SHA256
These fast hashes are brute-forced on a GPU (billions of hashes per second). Passwords need a slow hash + a salt, to defeat rainbow tables and brute force.

### bcrypt vs Argon2
- bcrypt: a cost factor (work factor) that you raise over time; mature, widely supported.
- Argon2id: the PHC (Password Hashing Competition) winner; memory-hard, resists GPU/ASIC better; OWASP recommends it for new passwords.
- Both generate their own salt and embed it in the hash string.

### Pepper
A salt is stored next to the hash (public). A pepper is a global secret (an HMAC key) that is not kept in the DB and is appended to the password before hashing: {{hash(password + pepper)}}. If the DB is stolen, the attacker still lacks the pepper. Keep the pepper in a secret manager; rotating it is expensive (all passwords must be re-hashed), so it is rarely rotated.

### Migrating old hashes without forcing a password change
The lazy re-hash strategy:
1. The DB stores {{hash_algo, hash}}, or a prefix inside the hash string.
2. On login: verify with the old algo (MD5/SHA1) against the submitted password.
3. If correct: hash the password with Argon2id, update the DB, set the new algo.
4. From the next login on, use Argon2id.
Pros: the user notices nothing, migration follows traffic naturally. Cons: the old hash survives until the user logs in; inactive users keep the weak hash for a long time. You can force a reset for accounts that have not logged in for X months.

### Double hashing (alternative)
Store {{argon2(legacy_hash(password))}} immediately (a batch migration), without ever needing the plaintext password. At login: compute legacy_hash(input) then verify against argon2. Later re-hash to argon2(input) to drop the legacy layer. More complex, but migrates everything at once.

### Argon2id parameters (OWASP)
- memory: 19 MiB (or 64 MiB if the server allows)
- iterations: 2
- parallelism: 1
- salt: 16 random bytes
- output: 32 bytes

### Pitfalls
- Work factor too high → slow login, you DoS yourself.
- Comparing hashes with == → timing leak; use a constant-time comparison (frameworks already do this).
- Forgetting a pepper rotation plan.

> Senior tip: I set a benchmark: the login hash must take < 200ms on production hardware. If Argon2 parameters push login to 800ms, do users leave and does the attacker still brute-force offline? No — an offline attacker is not rate limited, so higher parameters are still worth it; but you have to balance against UX.`,
    follow: [
      "Argon2id vs bcrypt: benchmarks on the JVM, which library is good (BouncyCastle, Spring Security)?",
      "Pepper vs HMAC: how do they differ and when do you use which?",
      "How do you detect a compromised password (HaveIBeenPwned) at login?",
    ],
  },
  'security-030': {
    q: "A tamper-evident audit log for a financial system: storage design, hash chaining, and forensic/compliance requirements?",
    a: `**Summary:** Write the audit log append-only into immutable storage (WORM), have every record carry the hash of the previous record (a hash chain) so edits/deletions are detectable, and ship it out to an independent system.

### Financial requirements
- Who did what, when, from where, to which data, with what result.
- Nobody (not even admin/DBA) can edit or delete it.
- Integrity can be proven to an auditor/forensic investigator.

### Immutable storage (WORM = Write Once, Read Many)
- AWS S3 Object Lock (Compliance mode): the object cannot be deleted or modified during the retention period, not even by the root account.
- Azure Immutable Blob, GCP bucket retention.
- An append-only database table with UPDATE/DELETE privileges revoked; but a DBA can still bypass that → you need a hash chain + an external copy on top.

### Hash chain (blockchain-like)
Each audit record:
~~~json
{
  "seq": 1042,
  "ts": "2026-11-05T08:00:00Z",
  "actor": "user:42",
  "action": "transfer",
  "resource": "account:99",
  "prev_hash": "a1b2...",
  "hash": "sha256(seq|ts|actor|action|resource|prev_hash)"
}
~~~
Modify one record → the hash no longer matches → detected. Delete a record → a gap in seq → detected. Verify with a periodic job that recomputes the whole chain.

### Merkle tree / external anchor
- Combine the hashes of N records into a Merkle root, then publish that root to an external system (a public blockchain, an RFC 3161 timestamp authority) to prove the point in time.
- This detects a rewrite of the entire chain (an attacker recomputing hashes after editing).

### Separation of duties
- The app only INSERTs audit rows, never UPDATE/DELETE.
- The DB user for the audit table is different from the user for business tables.
- Audit storage lives in another account/cloud, never under the app's credentials.

### Audit content (do not store secrets)
- Never log passwords/tokens/full PII; log a hashed identifier or a masked one.
- Log before/after values (a diff) for critical fields (balance, limit).

### Forensics
- Clock sync (NTP) so timestamps are trustworthy.
- Immutable log shipping (Fluent Bit → S3/Kafka) in real time; if the app is compromised, the logs are already out.
- Retention per regulation (typically 5-7 years in finance).

### Pitfalls
- A hash chain in the same DB → a DBA can rewrite the chain; you need an external anchor.
- The audit log gets huge → sampling? No — finance needs everything. Use columnar storage (Parquet) + daily partitions.
- Missing idempotency: a retried request writes a duplicate audit row → use an idempotency key.

> Senior tip: an audit log is evidence, not a debug log. I design it so an independent auditor can verify integrity without trusting our system. If the auditor has to trust our DBA, the audit is worthless.`,
    follow: [
      "Hash chain vs Merkle tree: when do you use which?",
      "How do you verify audit log integrity automatically and alert on tampering?",
      "GDPR 'right to be forgotten' conflicts with an immutable audit log: how do you handle it?",
    ],
  },
  'security-031': {
    q: "Threat modeling (STRIDE) for a new money-transfer feature: how would you do it step by step, and what is the output?",
    a: `**Summary:** Draw a data flow diagram, apply STRIDE to each component/flow, rank the risks (DREAD or likelihood×impact), and turn them into controls + tests + monitoring; the output is a threat register plus a mitigation backlog.

### What STRIDE is
STRIDE = Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. Each letter is one class of attack you must consider.

### Step 1: Scope & actors
The transfer feature: user (mobile/web), API gateway, transfer service, account service, ledger DB, notification, fraud engine, bank partner (ACH/SWIFT). Draw the trust boundaries: internet ↔ edge ↔ internal ↔ DB ↔ external partner. A trust boundary is where an attacker crosses from a zone you control into one you do not.

### Step 2: Data Flow Diagram (DFD)
Nodes: process, data store, external entity, data flow. Number every flow (F1: user→gateway, F2: gateway→transfer service, ...). Trust boundaries are the places that need controls.

### Step 3: Apply STRIDE to each element
Example, flow F3 transfer service → ledger DB:
- Spoofing: a fake service pretending to be the transfer service? → mTLS + service identity.
- Tampering: amount modified in transit? → TLS + signed request + DB transaction.
- Repudiation: the user denies having sent the money? → audit log + non-repudiation (OTP/biometric approval).
- Information disclosure: logs containing account numbers? → masking.
- DoS: flooding the transfer endpoint → rate limit + queue.
- Elevation of Privilege: user A transfers from account B? → ownership check (a BOLA control).

### Step 4: Risk ranking
Use likelihood × impact (or DREAD). Example: "EoP: transfer from someone else's account" = critical impact, medium likelihood → priority P1. "DoS on notification" = low.

### Step 5: Mitigation → control
Each threat maps to a concrete control (code, config, process) + an owner + a deadline. Example, the threat "replay OTP" → the control "OTP single-use + 3-minute TTL + bound to the transaction id".

### Step 6: Verification
- Unit/integration tests for the control (an ownership-check test).
- Penetration test / red team for the top threats.
- Monitoring & alerting for anomalies (velocity, amount outliers).

### Output artifacts
- Threat register (spreadsheet): Threat ID, component, STRIDE category, description, likelihood, impact, risk, mitigation, owner, status.
- Updated architecture doc with the trust boundaries.
- Security test cases.
- A runbook for the related incidents.

### When to do threat modeling
For every new feature that touches sensitive data or money; for big changes; periodically (quarterly) for existing systems. The lead facilitates the session with dev + QA + ops (1-2 hours).

### Pitfalls
- A threat model that is too generic ("SQL injection") → not actionable. Be specific down to the flow and the control.
- Doing it once and forgetting it → it goes stale. Review whenever the architecture changes.
- Only developers take part, no security/ops → threats get missed.

> Senior tip: the most valuable outcome of threat modeling is not the list of threats but the shared understanding the team builds about what is dangerous. I run a 90-minute session with a whiteboard and come out with 10-15 concrete threats, not 100 generic ones.`,
    follow: [
      "STRIDE vs PASTA vs LINDDUN: how do they differ and when do you use each?",
      "How do you fit threat modeling into sprint planning without slowing delivery?",
      "A threat model for an OAuth login flow: what are the main threats?",
    ],
  },
  'security-032': {
    q: "OWASP API Security Top 10: tell BOLA/BFLA/Broken Authentication apart and how to prevent them in Spring Boot?",
    a: `**Summary:** BOLA = accessing an object that is not yours; BFLA = calling a function you have no right to call; Broken Authentication = impersonating an identity. Prevent them with object-level authorization + role/permission checks + strong authentication.

### The three concepts
- BOLA (Broken Object Level Authorization, API1): user A reads/modifies user B's object just by changing the id. Example: {{GET /orders/123}} belonging to someone else.
- BFLA (Broken Function Level Authorization, API5): a regular user calls an admin endpoint ({{DELETE /users/5}} or {{POST /admin/refund}}) because the role check is missing.
- Broken Authentication (API2): weak tokens, brute force, misconfigured JWT, session fixation.

### Preventing BOLA in Spring Boot
- Repository methods that carry the owner: {{findByOwnerIdAndId(ownerId, id)}} instead of {{findById}}.
- Spring Security @PreAuthorize with SpEL: {{@PreAuthorize("#order.ownerId == authentication.principal.id")}}.
- The object-level check lives in the service, not only in the controller.
- Unpredictable UUIDs + ownership check (defense in depth).

### Preventing BFLA
- Grant permissions per method/endpoint: {{@PreAuthorize("hasRole('ADMIN')")}} on admin APIs.
- A separate admin controller, never reusing the same path.
- Deny by default: every endpoint requires authentication; public ones are whitelisted.
- Check the role at the service layer, not only by hiding the button in the UI.

### Preventing Broken Authentication
- Use proven libraries (Spring Security, OAuth2/OIDC).
- JWT: verify signature, issuer, audience, expiry; use RS256 rather than HS256 with a weak secret; rotate keys.
- MFA for sensitive operations.
- Rate limit login/OTP (see security-027).
- Secure session: HttpOnly, Secure, SameSite cookies; regenerate the session id after login.

### Testing
- An authorization test matrix: every endpoint × every role × owner/non-owner → expected 200/403/404.
- DAST/automated: OWASP ZAP API scan.
- Code-review checklist: every {{findById}} fed from user input must carry an owner filter.

### Pitfalls
- Checking only the role, not the object → BOLA.
- Checking the object only in the controller while internal services call the repository directly → bypass.
- A JWT with {{alg: none}} or HS256 with a guessable secret → authentication bypass.

> Senior tip: authorization is two-dimensional: function-level (are you allowed to perform this action?) and object-level (does this object belong to you?). Many systems do one dimension well and forget the other. I require a test matrix covering both in CI.`,
    follow: [
      "Spring Security method security (@PreAuthorize, @PostAuthorize): how do they differ and when do you use which?",
      "JWT RS256 vs HS256: when to use each and what are the risks?",
      "How do you test authorization automatically in CI (OWASP ZAP, REST Assured)?",
    ],
  },
});
