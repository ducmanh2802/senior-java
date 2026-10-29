/*
 * English translation of js/data/lessons-security.js — task T461. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-002
 */
App.i18n.content({
  'lesson-security-002': {
    title: 'Signing and verifying your own JWTs with HS256: the signature, exp, and the alg traps',
    goals: [
      'Describe the {{header.payload.signature}} structure and say exactly which part the signature covers',
      'Sign and verify tokens yourself with {{javax.crypto.Mac}}, {{HmacSHA256}} and URL-safe {{Base64}}',
      'Point out the production traps: never trust {{alg}} from the header, always check {{exp}}, and JWT cannot revoke itself',
    ],
    body: `### Structure: header.payload.signature
A JWT (JSON Web Token — a small signed "identity card" that a server hands to a client and later accepts back) is three Base64URL strings joined by dots. Base64URL is just Base64 that is safe to put in a URL; it uses {{-}} and {{_}} instead of {{+}} and {{/}}, and **drops the padding** {{=}}, so the token fits neatly into a URL, an HTTP header or a cookie without any escaping. Base64URL is **not encryption**: anyone can decode it and read the claims (the key/value pairs inside the payload, such as {{sub}} — who the token is about — and {{exp}} — when it expires); all of the secrecy lives in the signature.

~~~java
String headerB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(headerJson.getBytes(StandardCharsets.UTF_8));
String payloadB64 = Base64.getUrlEncoder().withoutPadding()
        .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
String signingInput = headerB64 + "." + payloadB64;   // exactly this part is signed
String token = signingInput + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(macBytes);
~~~

### Signing and verifying with HMAC-SHA256
HS256 means HMAC-SHA256 — HMAC (Hash-based Message Authentication Code) mixes the message with a secret key to produce a signature, so only someone holding the secret can produce it — with **one shared secret** used by both the signing side and the verifying side:

~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
byte[] signature = mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8));
~~~

The verifying side recomputes the HMAC over exactly {{header.payload}}, then compares it with the received signature using {{MessageDigest.isEqual}} (a byte-by-byte comparison whose running time does not depend on where the first difference is, so an attacker cannot recover the signature one byte at a time). The full procedure, in the right order:

0. The algorithm is decided by **the verifier's configuration** (fixed to HS256 here), not read from the header to choose.
1. Split the token into exactly 3 parts with 2 dots; anything else is garbage, reject it immediately.
2. Recompute the HMAC over {{header.payload}} — **before** trusting any claim.
3. Compare the signatures with {{MessageDigest.isEqual}} (constant-time).
4. Decode the payload, check {{exp}}: accept only when {{now < exp}} (in practice add a leeway of a few tens of seconds, because two machines' clocks never agree perfectly — that disagreement is called clock skew).
5. Check the remaining claims according to the business rules: {{iss}} (who issued it), {{aud}} (the token was issued for our service), {{nbf}} (not valid before) if present.

In Spring Boot 3 you rarely write this by hand: {{spring-boot-starter-oauth2-resource-server}} with {{NimbusJwtDecoder}} performs all the steps above (signature check, {{exp}}/{{nbf}} with a default leeway of 60 seconds, {{iss}} if {{issuer-uri}} is configured).

### Production traps with JWT
- **{{alg=none}}**: the token has no signature; if the library verifying it "trusts" the header, an attacker can send a token with an empty signature and it still passes. Always reject {{none}}.
- **{{alg}} confusion**: the server uses RS256 (asymmetric: a private key signs, a matching public key verifies) and keeps the **public key** — which is public, so anyone can fetch it. The attacker changes the header to {{HS256}} and signs the HMAC himself, using that very public key as the secret. Old libraries read {{alg}} from the header, so they verify the HMAC with the "key" they hold — that is, the public key — and accept the forged signature. Rule: the algorithm is decided by **the verifier**, not by the token.
- **Weak secret, or a secret committed to the repo**: HS256 is only as safe as that secret. Keep it in an environment variable or Secrets Manager, rotate it periodically, and make it at least 32 bytes long.
- **Not checking {{exp}}**, or checking it while services have clock skew: allow a few tens of seconds of skew and sync the clock on every machine (NTP — Network Time Protocol — is the standard way to do that).
- **Reading the payload without verifying**: taking {{sub}}, {{role}} at face value → instant privilege escalation.
- **Believing JWT helps with revocation**: an issued token lives until {{exp}}. Revoking it immediately requires a revocation list, refresh token rotation, or switching to an opaque token (a random string with no readable content, which the server looks up in its own store) that is looked up on the server.

### HS256 or RS256?
| Criterion | HS256 (symmetric) | RS256 (asymmetric) |
|---|---|---|
| Key | one shared secret for both sides | private key signs, public key verifies |
| Speed | very fast (HMAC only) | signing is much slower; verification is still fast |
| Distribution | every verifier holds the secret, and anyone holding the secret can also **sign** tokens — one leak breaks everything | verifying services only need the public key (usually fetched via the Identity Provider's JWKS endpoint — a public JSON list of the keys that provider uses) |
| Suitable for | a single service that both issues and verifies, or very few verifiers | many services verify, and tokens are issued by an IdP (Identity Provider — the central login service, e.g. Keycloak, Cognito, Auth0…) |

### Replay protection: sign each request together with a timestamp
JWT has {{exp}}, but anyone who captures a token can reuse it an unlimited number of times within its validity window (which is why JWTs must only travel over HTTPS and should be short-lived, 5–15 minutes). For APIs between two systems (for example a bank calling a partner), the common approach is to **sign each request**: put a {{timestamp}} into the signed string and let the verifier allow at most {{tolerance}} of drift (usually 300 seconds); requests outside the window are rejected. The second exercise below does exactly that.

### Interview relevance
Interviewers often ask: "what steps do you follow to verify a JWT?", "why should you not trust the {{alg}} in the header?", "if the customer demands instant logout, how do you do that with JWT?", "HS256 or RS256, when do you pick which one?". Once you finish the two exercises below — signing yourself with {{javax.crypto.Mac}} and writing your own verify function that checks {{exp}} — you can answer all four questions with your own code.`,
    exercises: [
      {
        title: 'Building your own Jwt: sign with HS256, verify the signature and check exp',
        prompt: `Complete the {{Jwt}} class — a minimal version of a JWT signed with HS256, using only JDK 17:

- {{sign(subject, secret, expiresAtSeconds)}}: a fixed JSON header with {{alg}} = HS256 and {{typ}} = JWT; the JSON payload written compactly, with no whitespace, in exactly the order {{sub}} then {{exp}} (subject {{user-42}}, exp 2000 for the payload shown in the block below). Encode each part as Base64URL without padding; the signature is HMAC-SHA256 over {{header.payload}}. Return {{header.payload.signature}}.
- {{verify(token, secret, nowSeconds)}}: true exactly when the signature matches (recompute HMAC-SHA256 over the {{header.payload}} segment, compare with {{MessageDigest.isEqual}}) **and** {{nowSeconds < exp}}. Garbage tokens, a wrong secret, an expired token, a broken Base64 string must all return **false**, never throw an exception.
- {{subject(token)}}: decode the payload and return the {{sub}} value — a utility for reading a claim, without verifying the signature. A garbage token or null returns {{null}}.

~~~json
{"sub":"user-42","exp":2000}
~~~

The verifying side always fixes HS256 and never reads {{alg}} from the token.`,
        hints: [
          'Sign only the part before the second dot ({{header.payload}}); change a single character in it and the signature breaks.',
          'Use {{Base64.getUrlEncoder().withoutPadding()}} and split the token with {{indexOf}} so you are certain there are exactly 3 parts before doing anything else.',
          'After the signature matches, find {{exp}} in the payload and compare {{nowSeconds < exp}}; any parse error returns false instead of throwing an exception.',
        ],
        explain: `The order of verification decides everything: check the signature **first**, then read {{exp}}. Reading claims before comparing the signature means you have already trusted unauthenticated data.

Common traps:
- Signing the whole token string instead of {{header.payload}}: it matches itself but is not standard-compliant and cannot detect tampering with the header.
- Comparing signatures with {{String.equals}} → timing channel (the comparison stops at the first difference, so how long it takes leaks how many leading bytes were right); you must decode to bytes and use {{MessageDigest.isEqual}}.
- Trusting {{alg}} from the header → alg confusion (switching to none, or using the public key as the HMAC secret); the algorithm is fixed by the verifying side.
- Getting the expiry boundary wrong: RFC 7519 requires {{now}} to be **less than** {{exp}}, so being equal to {{exp}} already means expired; writing {{nowSeconds <= exp}} is wrong.

{{subject}} deliberately does not verify the signature: it is only a claim-reading utility, and every authorization decision must go through {{verify}} first. In production, do not hand-parse JSON like this — use Jackson or Nimbus — but keep exactly the same order of steps shown above.`,
      },
      {
        title: 'Signing HTTP requests with HMAC: tamper-proof and replay-proof',
        prompt: `Write {{RequestSigner}} so that service A signs a request before sending it and service B verifies it before processing (everything uses only JDK 17, and the clock is passed in as a parameter so the code is testable):

- {{sign(method, path, timestampSeconds, body, secret)}}: build a canonical string made of {{method}}, {{path}}, {{timestampSeconds}}, {{body}} separated by a newline character, sign it with HMAC-SHA256, and return the signature as Base64URL without padding.
- {{verify(method, path, timestampSeconds, body, secret, signature, nowSeconds, toleranceSeconds)}}: true exactly when {{|now - timestamp| <= tolerance}} **and** the signature matches; a garbage Base64 string or a null {{signature}} is false.

Goal: a tampered request (body, path) does not get through; a request captured and replayed after {{tolerance}} seconds does not get through either.`,
        hints: [
          'The canonical string must be built **identically** on both sides: same separators, same order, same timestamp formatting — otherwise the signature will never match.',
          'Replay protection: check {{Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds}} before computing the HMAC, so expired requests are rejected immediately.',
          'Compare signatures with {{MessageDigest.isEqual}} on the decoded byte array; a decode error returns false rather than throwing an exception.',
        ],
        explain: `Two layers of defence live in a single function: **authenticity** (the HMAC proves the request was created by someone holding the secret and has not been modified) and **freshness** (the timestamp is within {{tolerance}}, so a captured request can be replayed for roughly that long at most).

The canonical string (the exact byte sequence both sides agree to sign — like a fixed template: method, newline, path, newline, timestamp, newline, body) is the easiest place to go wrong: if the two sides differ by a single space or change the field order, the signature never matches, and this bug is often blamed on "missing permissions". In practice you should put both {{timestamp}} and {{nonce}} (a random value used only once) into the signed string, and have the server remember the nonce for a short window — because within {{tolerance}} the old request **is still valid**, and only a nonce blocks replay completely.

If {{tolerance}} is too large (1 hour) the attack window is wide; if it is too small (1 second) clock skew between the two machines makes valid requests get rejected. 300 seconds is a common default, together with NTP on every machine. A Base64URL signature is compact: 43 characters instead of 64 hex characters, and it needs no escaping when placed in a header.`,
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
          'No: the verifying side must fix the algorithm (for example HS256) to avoid alg confusion such as switching to none or using the public key as the HMAC secret',
          'Only read {{alg}} when the token comes from an internal service',
          'You may read it, but you must hash {{alg}} again before using it',
        ],
        answer: 1,
        explain: `Reading {{alg}} from the token is exactly the vulnerability: an attacker changes the header to {{none}} to skip the signature, or — against a server using RS256 — changes the header to HS256 and signs the HMAC with the public key (which is public); a library that trusts the header will use the public key as the HMAC secret and accept it. The spec describes the structure, but **the algorithm decision must live on the verifying side**; the other two options have no basis in RFC 7519 and block nothing.`,
      },
      {
        q: 'The token already has {{exp}}. How do you revoke it immediately when the user changes their password or the token is stolen?',
        options: [
          'You cannot with a plain JWT — the token stays valid until {{exp}}; you need an outside mechanism such as a revocation list, refresh token rotation, or an opaque token looked up on the server',
          'It expires automatically because the {{sub}} claim identifies the user',
          'Services receive a broadcast notification and delete the token themselves',
          'Setting {{exp}} to 0 revokes the token instantly',
        ],
        answer: 0,
        explain: `A JWT is a self-contained token: once issued, the server keeps no state it could delete, so until {{exp}} it still verifies as valid. The {{sub}} claim only identifies the user, it does not help with revocation; there is no standard broadcast channel, and every instance still verifies the token as valid; changing an {{exp}} that was already signed breaks the signature immediately. Real solutions: a blacklist with a TTL (each revoked token is stored with an expiry equal to its {{exp}}, so the list cleans itself up), refresh token rotation when theft is detected, or an opaque token looked up on the server (trading latency on every request).`,
      },
    ],
  },
});
