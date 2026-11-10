/*
 * English translation of js/data/q-security.js — task T965. Format: js/core/i18n.js (content overlay).
 * ids: security-037 security-038 security-039 security-040
 */
App.i18n.content({
  'security-037': {
    q: `SSRF (Server-Side Request Forgery) — what is it, and how dangerous is it in a Java backend? Explain the attack mechanism step by step (including cloud metadata access), common bypass forms, and how to defend in Java (allowlist, blocking private IPs, redirect/DNS checks).`,
    a: `**Summary:** **SSRF** (Server-Side Request Forgery) happens when an **attacker** controls the URL that your **server** calls out to. Since the request originates from the **server** (inside the internal network, with access to internal services), the attacker can read internal data or cloud metadata (e.g. AWS {{169.254.169.254}}) to steal credentials. Defending against SSRF is not just "blocking localhost": you must **allowlist the destination** (host/scheme/port), resolve DNS then **block private/link-local/loopback IPs** at connection time, disable or control redirects, and limit protocols.

### 1. Attack mechanism step by step
- **Context**: an API with a "fetch image from URL" or "call webhook URL" feature provided by the user.
- **Normal**: user sends {{url=https://cdn.example.com/a.png}} → server fetches the image → returns it.
- **SSRF**: attacker sends {{url=http://169.254.169.254/latest/meta-data/iam/security-credentials/}} (AWS metadata address, accessible only from inside the cloud instance). Your server runs **inside** the cloud infrastructure, calls that address → gets temporary access keys → attacker obtains credentials.

~~~text
[Attacker] --(1) POST /fetch?url=http://169.254.169.254/..--> [Your App Server]
                                                                   |
                                                         (2) Server calls the URL itself
                                                                   v
                                                  [Internal metadata service]
                                                                   |
                                                         (3) Returns IAM credentials
                                                                   v
[Attacker] <--(4) App returns/leaks data---------------- [Your App Server]
~~~

- **Why dangerous**: the server is usually inside a VPC/internal network, can access internal DB, Redis, admin panel ({{http://10.0.0.5:8080/admin}}), Kubernetes API, or cloud metadata. Firewall blocks Internet access but **does not block** requests initiated by the server itself.
- **Real-world impact**: stealing cloud credentials (escalating the entire infrastructure), reading internal data, scanning internal service ports, and in some cases combining into RCE.

### 2. Common bypass forms (don't use a simple blocklist)
- **Localhost variants**: {{127.0.0.1}}, {{127.0.0.2}}, {{0.0.0.0}}, {{[::1]}}, {{localhost}}, or domain names pointing to 127.0.0.1.
- **IP obfuscation**: integer form ({{2130706433}} = 127.0.0.1), octal/hex form, IPv6-mapped IPv4 ({{::ffff:127.0.0.1}}).
- **DNS rebinding**: a domain controlled by the attacker resolves once to a public IP (passes the check), then at connection time returns {{127.0.0.1}}. This is why you must check the IP **at connection time**.
- **Redirect**: the initial URL is {{https://good.com}} (passes allowlist) but returns 302 redirect to {{http://169.254.169.254}}. If the HTTP client follows redirects automatically, it bypasses the allowlist.
- **Other protocols**: {{file:///etc/passwd}}, {{gopher://}}, {{dict://}} — some libraries support them, adding more attack surface.

### 3. Defense in Java (defense in depth)
Principle: **allowlist the destination** (allow only what is needed), don't try to list everything forbidden.

~~~java
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.Set;

public final class SafeFetcher {
    // ONLY allow business hosts that need to be called (e.g. registered partner webhooks)
    private static final Set<String> ALLOWED_HOSTS = Set.of("api.partner-a.com", "hooks.partner-b.com");

    public String fetch(String rawUrl) throws Exception {
        URI uri = URI.create(rawUrl);

        // 1) Only allow https (block file://, gopher://, internal http per policy)
        if (!"https".equalsIgnoreCase(uri.getScheme())) throw new SecurityException("scheme blocked");

        String host = uri.getHost();
        if (host == null || !ALLOWED_HOSTS.contains(host.toLowerCase())) {
            throw new SecurityException("host not allowed"); // allowlist
        }

        // 2) Resolve DNS and block private/loopback/link-local IPs (simple DNS rebinding protection)
        for (InetAddress addr : InetAddress.getAllByName(host)) {
            if (isBlocked(addr)) throw new SecurityException("resolved to blocked IP: " + addr);
        }

        // 3) Do NOT automatically follow redirects; or use a client that checks each hop
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NEVER) // handle redirects manually + re-check allowlist
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        HttpResponse<String> res = client.send(
                HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).GET().build(),
                HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 300 && res.statusCode() < 400) {
            throw new SecurityException("redirect blocked"); // or check Location through the same filter
        }
        return res.body();
    }

    private static boolean isBlocked(InetAddress a) {
        return a.isAnyLocalAddress()      // 0.0.0.0 / ::
            || a.isLoopbackAddress()      // 127.0.0.0/8, ::1
            || a.isLinkLocalAddress()     // 169.254.0.0/16 (metadata!), fe80::/10
            || a.isSiteLocalAddress()     // 10/8, 172.16/12, 192.168/16, fc00::/7
            || a.isMulticastAddress();
    }
}
~~~

- **DNS rebinding note**: checking {{InetAddress.getAllByName}} before connecting still has a small TOCTOU window because the client may resolve again. Mitigate by configuring the HTTP client to use the resolved IP address, or use a specialized egress library/proxy against SSRF. For sensitive systems, route all outbound requests through a centralized-allowlist **egress proxy**.
- **Cloud**: on AWS, use **IMDSv2** (requires PUT to get session token + hop-limit header) to make metadata harder to exploit via SSRF; GKE/GCP have similar metadata headers. This is an additional layer, not a replacement for the allowlist.

### 4. On production
- **Symptoms**: logs contain requests to {{169.254.169.254}}, {{127.0.0.1}}, or ranges {{10.x/172.16.x/192.168.x}} from the fetch-URL feature; unusual alerts when the app calls the metadata service.
- **Architecture**: network separation (network policy) — pods/apps calling external URLs can only go to the Internet via egress gateway, **cannot** route to metadata IP or internal subnets. This is the "second wall" when code slips.
- **Additional limits**: short timeouts, response size limits, do not return raw internal responses to the client (attacker uses you as a blind/half-blind SSRF proxy).
- **Monitoring**: metrics/alerts for outbound requests to private/link-local IPs; audit the allowed host list.

> Senior tip: Blocklisting IPs (blocking 127.0.0.1, 169.254.169.254) is almost certainly bypassed via encoding/DNS. Flip the mindset: **allowlist only the host + scheme needed by the business**, resolve and check that private/link-local IPs are blocked, and disable automatic redirect following. At infrastructure level, require IMDSv2 (AWS) and block routes to metadata via network policy. SSRF is a "single fetch URL line" bug, but consequences can be losing the entire cloud account — review every place that accepts URLs from users.`,
    follow: [
      `How does DNS rebinding bypass a simple "resolve then block private IP" check, and how should an egress proxy/HTTP client be configured to reduce TOCTOU?`,
      `How does AWS IMDSv2 reduce SSRF risk, and can it replace the allowlist in code?`,
      `Distinguish regular SSRF, blind SSRF, and semi-blind SSRF: how does the attacker confirm successful exploitation when no response is returned?`
    ]
  },
  'security-038': {
    q: `Explain TLS/mTLS between microservices at the mechanism level: how does the TLS 1.2/1.3 handshake proceed step by step, how is the certificate chain verified, and how do you rotate certificates without downtime? In Java/Spring Boot, what are the {{keyStore/trustStore}} configurations and common errors?`,
    a: `**Summary:** **TLS** (Transport Layer Security) encrypts the channel and authenticates the server; **mTLS** (mutual TLS) requires **both client and server** to present certificates, so every service must prove its identity — suitable for internal zero-trust communication. The handshake exchanges version/cipher, authenticates the **certificate chain** to a trusted CA, then derives session keys to encrypt data. **Rotation without downtime** requires: issuing the new cert before the old one expires, loading them side by side (overlap), and hot reload instead of abrupt restart. In Java, {{keyStore}} holds the service's own certificate/private key, {{trustStore}} holds CAs/services it trusts.

### 1. Background terms
- **Digital certificate (certificate)**: a digital "ID card" of a party, containing public key + name (CN/SAN) + validity period, signed by a **CA** (Certificate Authority — certificate authority). Anyone who trusts that CA trusts the certificate the CA signed.
- **Private key**: the private key corresponding to the public key in the cert; only the owner holds it. Used to prove "I am who the cert says" and to participate in deriving session keys.
- **Certificate chain**: a service's cert is usually signed by an **intermediate CA**, which is signed by a **root CA**. Chain: {{leaf cert (service) → intermediate CA → root CA}}. The browser/service trusts the **root CA**; it verifies signatures up the chain to root.
- **Cipher suite**: the set of algorithms agreed for a session (key exchange, encryption, MAC). TLS 1.3 simplifies and uses only modern safe ciphers.

### 2. TLS handshake step by step (simplified, key points)
TLS 1.3 (preferred) is more compact than TLS 1.2; the general idea: agree parameters, authenticate cert, derive session keys.

~~~text
TLS 1.3 (1-RTT, simplified) — server-only TLS:
Client                                           Server
  |--- ClientHello --------------------------------->|
  |    (version, cipher suites, key_share DH, SNI) |
  |                                                  |
  |<-- ServerHello, {EncryptedExtensions} -----------|
  |<-- {Certificate}  (sends cert chain) -------------|
  |<-- {CertificateVerify} (signs with private key) ----|  (proves private key ownership)
  |<-- {Finished} -----------------------------------|
  |                                                  |  both derive the same session keys (ECDHE)
  |--- {Finished} ---------------------------------->|
  |<========= application data encrypted =============>|

mTLS differs in that: the Server additionally sends "CertificateRequest" (requesting the client to present a certificate),
Client returns {Certificate} + {CertificateVerify} → the server also authenticates the client's chain.
~~~

- **Certificate chain authentication (happens on both sides with mTLS)**: (1) check each link's signature: leaf signed by intermediate, intermediate signed by root; (2) root (or a trusted intermediate) must be in {{trustStore}}; (3) cert still valid ({{notBefore/notAfter}}); (4) name matches (SAN/CN matches hostname or SPIFFE ID, depending on config); (5) check revocation if enabled (CRL/OCSP) — in practice internal systems often use **short-lived certs** instead of complex OCSP.
- **Why ECDHE (forward secrecy)**: session keys are ephemeral per connection; leaking the long-term private key later also **does not** decrypt previously recorded traffic.

### 3. Rotating certificates without downtime
Certs have validity (internal usually 24h–90 days; public CA max 398 days). Expiry without replacement → handshake fails, services stop calling each other.

~~~text
Overlap strategy (no downtime):
t0: cert A in use (expires at t2)
t1: issue new cert B (expires at t3), B already trusted by client (same CA chain)
    - Server loads B: keeps A serving old connections, uses B for new connections (or replaces)
    - Parties still accept A until t2
t2: A expires, all new connections use B. A is dropped.
Requirement: (t2 - t1) must be large enough for ALL clients to receive the new trust/cert (minutes → hours).
~~~

- **Automatic issuance**: service mesh (Istio citadel/istiod, Linkerd identity) issues short-lived certs (e.g. 24h) with SPIFFE ID, auto-renews before expiry and pushes to sidecar via SDS (Secret Discovery Service) — **hot reload**, no pod restart. Use cert-manager (Kubernetes) to issue/renew {{Secret}} TLS.
- **Hot reload outside mesh (Java)**: reload {{keyStore/trustStore}} from file when cert changes (custom {{SSLContext}} + file watcher, or a library like Netflix {{ssl-context-kickstart}}; Spring Boot 3.1+ has SSL bundles with reload in some scenarios). Avoid restarting the whole JVM for each rotation.
- **Principle**: short-lived certs + automation > long-lived certs renewed manually (forgetting to renew is a common incident).

### 4. Java/Spring Boot: keyStore and trustStore
- **keyStore** ({{javax.net.ssl.keyStore}}): holds the **service's own certificate + private key** (its own identity). Used to present cert when acting as TLS server, or as client in mTLS.
- **trustStore** ({{javax.net.ssl.trustStore}}): holds **CA/cert that the service trusts**. Used to authenticate the other party's cert. Java default uses {{<java-home>/lib/security/cacerts}} (system trust store).
- Format: PKCS12 ({{.p12/.pfx}}, modern standard) or JKS (old Java format). From Java 9+, PKCS12 is default.

~~~yaml
# Spring Boot (example: enabling TLS for server and configuring client mTLS)
server:
  ssl:
    enabled: true
    key-store: classpath:service.p12
    key-store-type: PKCS12
    key-store-password: \${KEYSTORE_PASS}        # take from secret manager, do NOT hardcode
    key-alias: service

# Client calling another service with mTLS (using RestClient/WebClient with SSL bundle — Spring Boot 3.1+)
spring:
  ssl:
    bundle:
      jks:
        payment-client:
          keystore:
            location: classpath:client.p12
            password: \${CLIENT_KEYSTORE_PASS}
          truststore:
            location: classpath:trust.p12
            password: \${TRUST_PASS}
~~~

### 5. On production
- **Common errors**:
  - {{PKIX path building failed: unable to find valid certification path}}: the other party uses a cert from a CA not in trustStore (forgot to import intermediate/root), or the chain sent is missing intermediate. Check the full chain.
  - {{No subject alternative names present}} / hostname verify fail: cert has no SAN matching the hostname/IP you call. Java verifies hostname by default; don't disable hostname verification just to "make it work".
  - {{CertificateExpiredException}}: forgot to rotate. Alert before expiry (e.g. 7 days, 1 day).
  - {{Received fatal alert: bad_certificate}} (mTLS): server doesn't trust the client cert — client sent the wrong cert or the server's trustStore lacks the client's CA.
- **Observation**: metric for remaining cert time ({{x509_cert_not_after}}), expiry alerts; log handshake errors (enable {{javax.net.debug=ssl,handshake}} **only temporarily when debugging**, because logs are sensitive/noisy).
- **Zero-trust internal**: prefer mTLS (via mesh) for every service-to-service call; disable TLS 1.0/1.1, only allow TLS 1.2+ (prefer 1.3). Automate cert lifecycle, don't issue long-lived certs manually.

> Senior tip: 80% of microservice TLS incidents are "expired cert" or "missing intermediate in chain". Automate the full cert lifecycle (issue, distribute, reload, expiry alert) — mesh or cert-manager + hot reload. And never "quick fix" by disabling hostname verification or using an all-trust {{TrustManager}}: that effectively disables TLS, turning the encrypted channel into one wide open to MITM. When you see {{PKIX path building failed}}, inspect the chain ({{openssl s_client -showcerts}}) instead of blindly adding certs to trustStore.`,
    follow: [
      `mTLS authenticates "which service is calling" (authentication); how do you add authorization "service A is allowed to call which actions of B" on top of mTLS?`,
      `Why does TLS 1.3 remove static RSA key exchange and require (EC)DHE, and what benefit does forward secrecy bring when the private key is leaked later?`,
      `If you must rotate the root CA (changing the trust anchor), how do you avoid disrupting running services?`
    ]
  },
  'security-039': {
    q: `What is XXE (XML External Entity), and how does exploitation work step by step (reading local files, SSRF via XML)? In Java, how to safely configure {{DocumentBuilderFactory}}/{{SAXParserFactory}}/{{XMLInputFactory}} and popular libraries to block XXE?`,
    a: `**Summary:** **XXE** (XML External Entity — external entity in XML) is a vulnerability that occurs when an XML parser is allowed to process **entity/DOCTYPE injected by the attacker**. The attacker inserts a declaration {{<!ENTITY ... SYSTEM "file:///...">}} so the parser automatically reads internal files (e.g. {{/etc/passwd}}, config files with secrets) or sends requests out (SSRF), then injects the content where the application responds. Defending XXE in Java: **disable DTD and external entities** on every parser ({{DocumentBuilderFactory}}, {{SAXParserFactory}}, {{XMLInputFactory}}/StAX, {{TransformerFactory}}, {{SchemaFactory}}) — each library/version's default differs, so you must set explicitly.

### 1. What is an XML entity (foundation)
- **Entity** in XML is a "variable" replacing text, declared in **DOCTYPE/DTD**. Internal entity: {{<!ENTITY hi "hello">}}. **External entity**: content fetched from outside via URI — {{<!ENTITY xxe SYSTEM "file:///etc/passwd">}}.
- When the parser encounters {{&xxe;}} in the document, if external entities are allowed, it will **fetch** that URI and substitute the content. Dangerous when XML comes from the user.
- Real-world example: like allowing a letter sender to write "please paste the contents of your safe here" and the system automatically does it.

### 2. Exploitation mechanism step by step (reading local files)
~~~text
(1) Attacker sends malicious XML:
    <?xml version="1.0"?>
    <!DOCTYPE foo [
      <!ENTITY xxe SYSTEM "file:///etc/hostname">
    ]>
    <order><note>&xxe;</note></order>

(2) Server parses XML with a parser that hasn't disabled external entities:
    - Parser reads DOCTYPE, registers entity "xxe" pointing to file:///etc/hostname
    - When it meets &xxe; inside <note>, the parser OPENS the internal file and substitutes the content

(3) The application gets the value of <note> ("ip-10-0-1-23") and returns/logs it
    -> Attacker reads the server's internal file

Variant: SYSTEM "http://169.254.169.254/..." -> SSRF to cloud metadata.
Blind XXE variant: data is exfiltrated via DNS/HTTP to an attacker-controlled server.
~~~

### 3. Defending XXE in Java — disable DTD and external entities
Principle: if your application **does not need** DTD/external entities (most modern APIs use XML only for data), **disable completely**. You must configure on the **correct parser type** you use, because each API has its own flag. Always set {{disallow-doctype-decl}} (block DOCTYPE) when possible — the strongest way.

~~~java
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.SAXParserFactory;
import javax.xml.stream.XMLInputFactory;
import javax.xml.transform.TransformerFactory;

// 1) DOM (DocumentBuilderFactory)
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); // strongest: ban DOCTYPE
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
dbf.setXIncludeAware(false);
dbf.setExpandEntityReferences(false);

// 2) SAX
SAXParserFactory spf = SAXParserFactory.newInstance();
spf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
spf.setFeature("http://xml.org/sax/features/external-general-entities", false);
spf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);

// 3) StAX (XMLInputFactory) - used by many libs (JAXB impl, SOAP stack)
XMLInputFactory xif = XMLInputFactory.newFactory();
xif.setProperty(XMLInputFactory.SUPPORT_DTD, false);              // disable DTD
xif.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);

// 4) XSLT / Schema
TransformerFactory tf = TransformerFactory.newInstance();
tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
tf.setAttribute(XMLConstants.ACCESS_EXTERNAL_STYLESHEET, "");
~~~

- **Version/library note**: default behavior changes between JDK and parser implementation (Xerces). A patch may change defaults; don't rely on "defaults are already safe" — **set flags explicitly**. Test by inserting XXE payload: a safe parser must throw an error (DOCTYPE banned) or return empty/unresolved entity.
- **JAXB / SOAP (JAX-WS) / Spring XML**: higher layers often create parsers underneath. Check whether they allow passing a hardened {{XMLInputFactory/SAXParserFactory}}; with JAXB unmarshalling from untrusted sources, load via {{SAXSource}} using an {{XMLReader}} with features disabled.
- **If you really need DTD** (rare, e.g. validating against an old schema): you cannot ban DOCTYPE entirely — then block external entity/DTD fetch ({{ACCESS_EXTERNAL_DTD}} empty) and use a strictly controlled entity resolver. Complex, avoid if possible.

### 4. On production
- **Symptoms**: parser throws DOCTYPE error (good, blocking), or unusual outbound requests from the Java process to internal host/metadata when processing XML (sign of XXE/SSRF). WAF can catch {{<!DOCTYPE}}/{{<!ENTITY}} payloads.
- **Attack surface**: any endpoint receiving XML/HTML/XHTML, file uploads (SVG, DOCX/XLSX are zip files containing XML — OOXML is also vulnerable to XXE if the inner parser isn't hardened), SOAP, SAML, RSS/Atom feeds.
- **Layered defense**: harden parser (mandatory) + block outbound network from the XML-processing service to internal network/metadata (network policy) + validate schema strictly (accept only expected structure) + prefer JSON over XML when you have a choice.
- **Testing**: add XXE payload to security tests/DAST (OWASP ZAP has XXE check). Unit test: parsing a string with {{<!ENTITY}} must be rejected.

> Senior tip: XXE is a "forgotten one parser config line" bug that exposes internal files/secrets. Team rule: **never** call {{DocumentBuilderFactory.newInstance()}} (or any parser) without hardening immediately after — wrap into a shared utility factory ({{SafeXml.newDocumentBuilderFactory()}}) and ban direct calls via review/lint. And remember to scan Office/SVG processing paths: they are disguised XML; the libraries reading them (Apache POI, SVG libs) also need safe configuration.`,
    follow: [
      `Why can DOCX/XLSX/SVG files also be XXE even though users think they're uploading "documents/images"? How do you control the parser of third-party libraries processing them?`,
      `Distinguish classic XXE (data appears in response) vs blind XXE: when can the attacker still exfiltrate data, and what network measures mitigate?`,
      `Besides XXE, how does DTD lead to "Billion Laughs" (entity expansion DoS) attacks, and which flag blocks it?`
    ]
  },
  'security-040': {
    q: `What is unsafe Java deserialization, and how does gadget chain exploitation work (why does just controlling the object stream lead to command execution)? How does {{ObjectInputFilter}} (JEP 290) reduce risk, and what is the long-term defense strategy for Java systems?`,
    a: `**Summary:** **Java deserialization** is the mechanism of turning a byte stream (object stream) back into a Java object ({{ObjectInputStream.readObject}}). The vulnerability occurs when the application **deserializes untrusted data**: the attacker crafts a byte stream so that during object restoration, "magic" methods ({{readObject/readResolve}}) of classes already on the classpath are called one after another, forming a **gadget chain**, finally reaching dangerous behavior (command execution, file writing, JNDI calls). **{{ObjectInputFilter}} (JEP 290, Java 9+)** allows allowlisting classes that can be deserialized to block chains, but it's a mitigation layer — durable defense is **not deserializing untrusted data** and using safe data formats (JSON/Protobuf).

### 1. Deserialization mechanism and why dangerous
- **Serialization**: {{ObjectOutputStream}} writes object state into a byte stream. **Deserialization**: {{ObjectInputStream.readObject()}} reads the byte stream and **reconstructs the object**, automatically calling hooks like {{readObject}}, {{readResolve}}, sometimes {{finalize}} of the corresponding class.
- **Danger point**: the byte stream specifies **which class** will be restored. {{readObject()}} will instantiate/restore any class on the classpath that the stream requests — **before** the application gets a chance to check whether the received object is the expected type.
- Real-world example: you ask the post office to deliver a "package" and the system automatically opens the package, assembles it according to instructions inside; the sender slips in instructions "after assembling, open the safe and bring the money out the door" — the system executes the instructions before you get a chance to check the sender.

~~~text
Attack flow (conceptual):
(1) Attacker finds classes on the victim's classpath with readObject/readResolve
    performing sensitive behavior when receiving controlled data (gadget). Historically e.g.
    transform chains on commons-collections, JNDI lookup, etc.
(2) Attacker chains gadgets: output of gadget A becomes input
    triggering gadget B ... -> final gadget calls Runtime.exec(...) / JNDI lookup.
(3) Attacker serializes the gadget chain into a byte stream, sends it to an endpoint receiving
    ObjectInputStream (RMI, JMX, cookie/session serialization, JMS ObjectMessage, ...).
(4) Server calls readObject() -> chain executes automatically -> RCE / loads remote class / ...
    All happens INSIDE readObject(), before the app checks the result type.
~~~

- **Why "filtering type after reading" is too late**: {{Object obj = ois.readObject(); if (obj instanceof MyDto) ...}} — the gadget chain has already run at {{readObject()}}, the {{if}} line is meaningless against the attack.

### 2. {{ObjectInputFilter}} (JEP 290) — allowlist of deserializable classes
Since Java 9, JEP 290 adds **during-deserialization** filtering: the filter is called for **each** class/array being restored; it decides {{ALLOWED / REJECTED / UNDECIDED}}. Goal: only allow classes you expect.

~~~java
import java.io.*;

public Object safeRead(byte[] data) throws Exception {
    try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(data))) {
        // Allowlist: only allow classes in my DTO package + necessary java.base types
        ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
            "com.mybank.dto.*;java.base/*;!*"  // allow dto + java.base, REJECT everything else (!*)
        );
        ois.setObjectInputFilter(filter); // set BEFORE readObject
        return ois.readObject();
    }
}

// Or set a JVM-wide filter (protects deserialize paths you don't control directly):
// -Djava.io.serialFilter=com.mybank.dto.*;java.base/*;!*
// or ObjectInputFilter.Config.setSerialFilter(...)
~~~

- **Filter pattern**: {{module/package.Class}}, {{*}} wildcard, {{!}} reject, limits {{maxdepth}}, {{maxrefs}}, {{maxbytes}}, {{maxarray}} (also block DoS attacks exhausting memory with huge/deep streams).
- **Filter limits**: (1) you must know and list exactly valid classes — missing a business class causes errors; (2) if the allowlist is too broad (allowing a whole large library), gadgets in it still slip through; (3) it **does not** make deserialization absolutely safe, only narrows the attack surface. So this is **defense in depth**, not the sole shield.
- **JVM-wide filter** ({{jdk.serialFilter}}): useful to set default reject when you can't fix all code, but may break real serialization features (internal RMI, some old frameworks) — test carefully.

### 3. Long-term defense strategy
- **Best: do not deserialize untrusted data.** This is OWASP's #1 recommendation. If data comes from network/user, don't use Java native serialization.
- **Use safe, schema-bound data formats**: JSON (Jackson/Gson) bound to **explicit DTO classes** ({{objectMapper.readValue(json, OrderDto.class)}}) — Jackson does not instantiate arbitrary classes from the payload (unless you enable dangerous features like {{enableDefaultTyping}}; **don't enable**). Protobuf/Avro also bind schema.
- **Close dangerous entry points**: don't accept {{ObjectMessage}} (JMS) from untrusted sources; check RMI/JMX configuration (pre-Java 9 and some configs still expose deserialize endpoints); don't store session/state via Java serialization in unsigned cookies.
- **Reduce gadgets**: update libraries (remove/bump old commons-collections, etc.), reduce unnecessary classpath. Don't rely entirely on "no gadgets" — new gadgets are constantly found.
- **Monitoring**: RASP/WAF products can detect serialization byte streams (starting with {{0xAC 0xED}}) entering HTTP; alert when they appear.

### 4. On production
- **Exploitation signs**: Java process spawns strange child processes ({{curl}}, {{sh}}), unusual outbound connections, strange files created — signs of RCE after gadget chain. Hard to detect if blind; need EDR/process behavior monitoring.
- **Attack surface inventory**: find every {{new ObjectInputStream(…)/readObject/readUnshared}}, open RMI/JMX endpoints, libraries using serialization under the hood (some cache/session stores, old middleware). Label data sources: only deserialize data created by your own system and integrity-protected (signed/MAC), **not** data from clients.
- **If you must keep internal serialization**: sign/HMAC the byte stream before sending, verify before {{readObject}}, combined with strict {{ObjectInputFilter}} allowlist + limits {{maxbytes/maxdepth/maxrefs}}.

> Senior tip: {{ObjectInputFilter}} is a safety net, not a license to use {{readObject}} on untrusted input. The right design review question: "does this data come from a place we don't fully control?" — if yes, switch to JSON/Protobuf with specific DTOs. And absolutely never enable {{ObjectMapper.enableDefaultTyping()}} / {{@JsonTypeInfo(use=Id.CLASS)}} on untrusted input: that recreates a polymorphic deserialization vulnerability on Jackson, a similar gadget mechanism, similar consequences (RCE).`,
    follow: [
      `Why does an {{instanceof}} check after {{readObject()}} not block gadget chains, and what does that say about when the JEP 290 filter intervenes?`,
      `Why is polymorphic deserialization in Jackson ({{enableDefaultTyping}} / {{@JsonTypeInfo(use=Id.CLASS)}}) dangerous, and what is the safe alternative configuration?`,
      `You audit a legacy system for Java deserialization attack surface: besides direct {{ObjectInputStream}}, which protocols/libraries commonly deserialize under the hood?`
    ]
  },
});
