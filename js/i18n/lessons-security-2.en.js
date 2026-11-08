/*
 * English translation of js/data/lessons-security.js — task T1121. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-002
 */
App.i18n.content({
  'lesson-security-002': {
    title: 'Signing and verifying JWTs with HS256: signatures, exp, and the alg trap',
    goals: [
      'Describe the {{header.payload.signature}} structure and identify exactly what is covered by the signature',
      'Sign and verify tokens using {{javax.crypto.Mac}}, {{HmacSHA256}}, and URL-safe {{Base64}}',
      'Identify production traps: never trust {{alg}} from the header, always validate {{exp}}, and understand JWT revocation limits',
    ],
    body: `### Structure: header.payload.signature
A JWT (JSON Web Token — a small, signed "identity card" that a server issues to a client and later accepts back) consists of three Base64URL-encoded strings joined by dots. Base64URL is a variant of Base64 designed for URLs: it uses {{-}} and {{_}} instead of {{+}} and {{/}}, and **drops the padding** {{=}}, allowing the token to fit neatly into a URL, HTTP header, or cookie without needing character escaping. Base64URL is **not encryption**: anyone can decode it to read the claims (the key/value pairs inside the payload, such as {{sub}} — who the token is about — and {{exp}} — when it expires); all security relies on the signature.

~~~java
String headerB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
String payloadB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
String signingInput = headerB64 + "." + payloadB64;   // this specific part is signed
String token = signingInput + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(macBytes);
~~~

### Signing and verifying with HMAC-SHA256
HS256 stands for HMAC-SHA256 — HMAC (Hash-based Message Authentication Code) mixes the message with a secret key to produce a signature, so only someone holding the secret can produce it — using **one shared secret** for both signing and verifying:

~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
byte[] signature = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
~~~

The verifier recomputes the HMAC over the exact {{header.payload}} segment, then compares it with the received signature using {{MessageDigest.isEqual}} (a byte-by-byte comparison that takes a constant amount of time, preventing timing attacks where an attacker guesses the signature byte-by-byte based on response speed). The full, ordered procedure:

0. The algorithm is decided by **the verifier\'s configuration** (fixed to HS256 here), never read from the token header.
1. Split the token into exactly 3 parts separated by 2 dots; anything else is malformed, reject it immediately.
2. Recompute the HMAC over {{header.payload}} — **before** trusting any claim.
3. Compare signatures with {{MessageDigest.isEqual}} (constant-time).
4. Decode the payload and check {{exp}}: accept only when {{now < exp}} (in practice, add a leeway of a few tens of seconds to account for clock skew — the inevitable, slight time mismatch between two machines).
5. Check other claims based on business rules: {{iss}} (who issued the token), {{aud}} (the token was issued for our service), {{nbf}} (not valid before) if present.

In Spring Boot 3, you rarely write this by hand: {{spring-boot-starter-oauth2-resource-server}} with {{NimbusJwtDecoder}} performs these steps automatically (signature verification, {{exp}}/{{nbf}} with a 60-second default leeway, {{iss}} if {{issuer-uri}} is configured).

### Production traps with JWT
- **{{alg=none}}**: the token has no signature; if the library trusts the header, an attacker can send a token with an empty signature and it passes. Always reject {{none}}.
- **{{alg}} confusion**: the server uses RS256 (asymmetric: a private key signs, a public key verifies) and holds the **public key** — which is public, so anyone can fetch it. The attacker changes the header to {{HS256}} and signs the HMAC themselves, using the public key as the secret. Old libraries read {{alg}} from the header, so they verify the HMAC with the "key" they hold — the public key — and accept the forged signature. Rule: the algorithm is decided by **the verifier**, not by the token.
- **Weak secret, or secret committed to repo**: HS256 is only as safe as the secret. Keep it in an environment variable or Secrets Manager, rotate it, and make it at least 32 bytes long.
- **Not checking {{exp}}**, or checking it while services have clock skew: allow for a few tens of seconds of skew and synchronize all machine clocks (NTP — Network Time Protocol).
- **Reading payload without verification**: taking {{sub}} or {{role}} at face value → instant privilege escalation.
- **Believing JWT supports instant revocation**: an issued token is valid until {{exp}}. To revoke it immediately, you need a blacklist (revocation list), refresh token rotation, or you must switch to an opaque token (a random string that the server looks up in its own store).

### HS256 vs. RS256?
| Criterion | HS256 (symmetric) | RS256 (asymmetric) |
|---|---|---|
| Key | one shared secret for both sides | private key signs, public key verifies |
| Speed | very fast (HMAC only) | signing is slower; verification is still fast |
| Distribution | every verifier holds the secret, and anyone holding the secret can also **sign** tokens — one leak breaks everything | verifiers only need the public key (fetched via Identity Provider JWKS endpoint) |
| Suitable for | a single service that issues and verifies, or very few verifiers | many verifiers, tokens issued by an IdP (e.g., Keycloak, Cognito) |

### Replay protection: sign each request with a timestamp
JWTs have {{exp}}, but anyone who captures a token can reuse it an unlimited number of times within its validity window (this is why JWTs must only travel over HTTPS and should be short-lived, 5–15 minutes). For APIs between two systems (e.g., bank calling a partner), the common approach is to **sign each request**: include a {{timestamp}} in the signed string and allow at most {{tolerance}} seconds of drift (usually 300 seconds); requests outside this window are rejected. The second exercise below does exactly that.

### Interview relevance
Interviewers often ask: "what steps do you follow to verify a JWT?", "why should you not trust the {{alg}} in the header?", "if the customer demands instant logout, how do you do that with JWT?", "HS256 or RS256, when do you pick which one?". Once you finish the two exercises below — signing yourself with {{javax.crypto.Mac}} and writing your own verification function that checks {{exp}} — you can answer all four questions with your own code.`,
    exercises: [
      {
        title: 'Building your own Jwt: sign with HS256, verify the signature, and check exp',
        prompt: `Complete the {{Jwt}} class — a minimal version of a JWT signed with HS256, using only JDK 17:

- {{sign(subject, secret, expiresAtSeconds)}}: a fixed JSON header with {{alg}} = HS256 and {{typ}} = JWT; the JSON payload written compactly, with no whitespace, in exactly the order {{sub}} then {{exp}} (subject {{user-42}}, exp 2000 for the payload shown below). Encode each part as Base64URL without padding; the signature is HMAC-SHA256 over {{header.payload}}. Return {{header.payload.signature}}.
- {{verify(token, secret, nowSeconds)}}: true exactly when the signature matches (recompute HMAC-SHA256 over the {{header.payload}} segment, compare with {{MessageDigest.isEqual}}) **and** {{nowSeconds < exp}}. Garbage tokens, a wrong secret, an expired token, or a broken Base64 string must all return **false**, never throw an exception.
- {{subject(token)}}: decode the payload and return the {{sub}} value — a utility for reading a claim without verifying the signature. A garbage token or null returns {{null}}.

~~~json
{"sub":"user-42","exp":2000}
~~~

The verifier always fixes HS256 and never reads {{alg}} from the token.`,
        hints: [
          'Sign only the part before the second dot ({{header.payload}}); changing even one character breaks the signature.',
          'Use {{Base64.getUrlEncoder().withoutPadding()}} and split the token using {{indexOf}} to ensure there are exactly 3 parts before doing anything else.',
          'After the signature matches, find {{exp}} in the payload and compare {{nowSeconds < exp}}; any parsing error must return false instead of throwing an exception.',
        ],
        explain: `Verification order determines security: check the signature **first**, then read {{exp}}. Reading claims before verifying the signature means you trust unauthenticated data.

Common traps:
- Signing the entire token string instead of just {{header.payload}}: it may match itself but is not standard-compliant and cannot detect tampering with the header.
- Comparing signatures with {{String.equals}} → timing channel (the comparison stops at the first difference, so how long it takes leaks information); you must decode to bytes and use {{MessageDigest.isEqual}}.
- Trusting {{alg}} from the header → alg confusion (switching to none, or using the public key as the HMAC secret); the algorithm is fixed by the verifier.
- Incorrect expiry boundary: RFC 7519 requires {{now}} to be **less than** {{exp}}, so being equal to {{exp}} means it is already expired; writing {{nowSeconds <= exp}} is wrong.

{{subject}} deliberately does not verify the signature: it is only a utility to read a claim. Every authorization decision must pass through {{verify}} first. In production, do not hand-parse JSON like this — use Jackson or Nimbus — but maintain exactly the same order of steps shown above.`,
      },
      {
        title: 'Signing HTTP requests with HMAC: tamper-proof and replay-proof',
        prompt: `Write {{RequestSigner}} so that service A signs a request before sending it and service B verifies it before processing (using only JDK 17, and the clock is passed in as a parameter so the code is testable):

- {{sign(method, path, timestampSeconds, body, secret)}}: build a canonical string made of {{method}}, {{path}}, {{timestampSeconds}}, {{body}} separated by a newline character, sign it with HMAC-SHA256, and return the signature as Base64URL without padding.
- {{verify(method, path, timestampSeconds, body, secret, signature, nowSeconds, toleranceSeconds)}}: true exactly when {{|now - timestamp| <= tolerance}} **and** the signature matches; a garbage Base64 string or a null {{signature}} is false.

Goal: a tampered request (body, path) is rejected; a request captured and replayed after {{tolerance}} seconds is also rejected.`,
        hints: [
          'The canonical string must be built **identically** on both sides: same separators, same order, same timestamp formatting — otherwise the signature will never match.',
          'Replay protection: check {{Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds}} before computing the HMAC, so expired requests are rejected immediately.',
          'Compare signatures with {{MessageDigest.isEqual}} on the decoded byte array; a decoding error returns false rather than throwing an exception.',
        ],
        explain: `Two layers of defense live in a single function: **authenticity** (the HMAC proves the request was created by someone holding the secret and has not been modified) and **freshness** (the timestamp is within {{tolerance}}, so a captured request can be replayed for roughly that long at most).

The canonical string (the exact byte sequence both sides agree to sign — like a fixed template: method, newline, path, newline, timestamp, newline, body) is the easiest place to go wrong: if the two sides differ by a single space or change the field order, the signature never matches, and this bug is often blamed on "missing permissions". In practice, you should include both {{timestamp}} and {{nonce}} (a random value used only once) in the signed string, and have the server remember the nonce for a short window — because within {{tolerance}} the old request **is still valid**, and only a nonce blocks replay completely.

If {{tolerance}} is too large (1 hour) the attack window is wide; if it is too small (1 second) clock skew makes valid requests get rejected. 300 seconds is a common default, together with NTP on every machine. A Base64URL signature is compact: 43 characters instead of 64 hex characters, and it needs no escaping when placed in a header.`,
      },
    ],
    check: [
      {
        q: 'Which part of the token does the HS256 signature of a JWT cover?',
        options: [
          'Only the payload part',
          'Only the header part',
          'The {{header.payload}} part before the second dot — so changing one character in the header immediately breaks the signature',
          'The whole token, including the signature itself',
        ],
        answer: 2,
        explain: `The signature is an HMAC computed over the **signing input** {{header.payload}}, so any tampering with the header or the payload (including changing {{alg}}) makes the signature invalid. The payload is not covered on its own, and the signature cannot cover itself (that would be meaningless, since the attacker could simply re-sign).`,
      },
      {
        q: 'When verifying, should you read {{alg}} from the header to choose the algorithm?',
        options: [
          'Yes — per the spec, verify with whatever algorithm the header says',
          'No: the verifier must fix the algorithm (for example HS256) to avoid alg confusion such as switching to none or using the public key as the HMAC secret',
          'Only read {{alg}} when the token comes from an internal service',
          'You may read it, but you must hash {{alg}} again before using it',
        ],
        answer: 1,
        explain: `Reading {{alg}} from the token is exactly the vulnerability: an attacker changes the header to {{none}} to skip the signature, or — against a server using RS256 — changes the header to HS256 and signs the HMAC with the public key (which is public); a library that trusts the header will use the public key as the HMAC secret and accept it. The algorithm decision must live on the verifier side; the other options have no basis in RFC 7519.`,
      },
      {
        q: 'The token already has {{exp}}. How do you revoke it immediately when the user changes their password or the token is stolen?',
        options: [
          'You cannot with a plain JWT — the token stays valid until {{exp}}; you need an outside mechanism such as a blacklist, refresh token rotation, or an opaque token looked up on the server',
          'It expires automatically because the {{sub}} claim identifies the user',
          'Services receive a broadcast notification and delete the token themselves',
          'Setting {{exp}} to 0 revokes the token instantly',
        ],
        answer: 0,
        explain: `A JWT is a self-contained token: once issued, the server keeps no state, so until {{exp}} it still verifies as valid. Real solutions: a blacklist (each revoked token stored with an expiry equal to its {{exp}}, so the list cleans itself up), refresh token rotation, or an opaque token looked up on the server.`,
      },
    ],
  },
});

