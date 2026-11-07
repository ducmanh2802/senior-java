/*
 * English translation of js/data/lessons-security.js — task T1028. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-010 lesson-security-011
 */
App.i18n.content({
  'lesson-security-010': {
    title: 'Signing and verifying JWT with HS256',
    goals: ['Understand the JWT structure and HMAC-SHA256', 'Sign/verify a token in Java', 'Prevent alg=none and bad signatures'],
    body: `**Summary:** JWT = base64url(header).base64url(payload).base64url(HMAC(header.payload, secret)); verification must compare the signature in constant time and check exp/nbf/alg.

### What JWT is
JWT (JSON Web Token) is a three-part string separated by dots: header.payload.signature. Each part is base64url (a URL-safe base64 variant with no padding =).

### Why HMAC is needed
HMAC-SHA256 guarantees the payload is not tampered with; the secret is shared between issuer and verifier.

### Base64url in Java
Use Base64.getUrlEncoder().withoutPadding() and getUrlDecoder().

### Signing
~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
byte[] sig = mac.doFinal((h+"."+p).getBytes(StandardCharsets.UTF_8));
~~~

### Verification
1. Split into 3 parts and decode.
2. Parse the header JSON and check alg == "HS256" (reject alg=none, RS256...).
3. Recompute the HMAC and compare using MessageDigest.isEqual (constant time, against timing attacks).
4. Parse the payload and check exp (expired) and nbf (not yet valid) with an injected clock for testing.

### Injected clock
Pass a Clock/Instant into the verify function instead of System.currentTimeMillis() so expired-token cases can be tested.

### Why alg must be checked before HMAC
If an attacker changes alg to none and removes the signature, a server that does not check alg treats it as valid. Checking alg before computing the HMAC stops the bypass.

### Key rotation
Use the kid header to select the secret; rotation does not immediately invalidate old tokens if the old secret is kept during a grace period.

### Further interview notes
Explain that HMAC does not encrypt the payload; base64url has no padding; secret >= 256 bits; timing attacks; alg confusion.

### Common pitfalls
- Comparing signatures with String.equals -> timing leak.
- Not checking alg -> alg=none bypass.
- Not checking exp -> token lives forever.
- Using standard base64 instead of base64url -> '+' '/' break in URLs.

### Full example
~~~java
// sign
String data = header + "." + payload;
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
String sig = Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes()));
~~~

### Interview answer
Answer: JWT is not encrypted; HMAC protects integrity; verify alg/exp/nbf; compare in constant time.

### Common pitfalls
Forgetting exp, using standard base64, comparing with equals, alg confusion.

### Production notes
Log kid, monitor failed verifies, rotate secret periodically, never put secret in code.

### Best practices
Use constant-time compare, check exp with a small tolerance (clock skew), validate iss/aud.

### Interview notes
Make clear that HMAC only protects integrity, not confidentiality; the secret must be long enough (>=256 bits); key rotation; kid header.`,
    exercises: [
      {
        title: 'JWT sign/verify',
        prompt: `Implement Jwt.sign(payloadJson, secret, nowEpochSec) and Jwt.verify(token, secret, nowEpochSec) returning boolean. Reject algorithms other than HS256, expired exp, not-yet-valid nbf, and bad signatures.`,
        hints: ['Use MessageDigest.isEqual', 'Check alg before computing HMAC'],
        explain: 'The solution signs with HMAC and verifies with a constant-time comparison; it parses exp/nbf simply.',
      },
    ],
    check: [
      { q: 'Why use MessageDigest.isEqual?', options: ['Faster', 'Constant time, against timing attacks', 'Supports unicode', 'Hashes automatically'], answer: 1, explain: 'Compares bytes in fixed time, avoiding information leakage through timing.' },
      { q: 'Why is alg=none dangerous?', options: ['Slow', 'Bypasses the signature', 'Uses memory', 'No UTF-8 support'], answer: 1, explain: 'An attacker removes the signature and sets alg to none; a server that does not check alg accepts it.' },
    ],
  },
  'lesson-security-011': {
    title: 'PKCE S256 for OAuth public clients',
    goals: ['Understand PKCE and the S256 code_challenge', 'Simulate authorize + token exchange', 'Block attackers without the verifier'],
    body: `**Summary:** PKCE: the client creates a random code_verifier and sends code_challenge = base64url(SHA256(verifier)); the server stores the challenge at authorize and checks the verifier when exchanging the code for a token.

### The problem
Public clients (SPA/mobile) cannot keep a secret; the authorization code can be stolen via the redirect. PKCE binds the code to a verifier only the client knows.

### Flow
~~~seq
title: PKCE
actors: Client | AuthServer | Resource
Client -> AuthServer: authorize + code_challenge
AuthServer -> Client: code
Client -> AuthServer: token + code + code_verifier
AuthServer -> Client: access_token
~~~

### code_challenge
code_challenge = BASE64URL(SHA-256(code_verifier)).

### Server check
Store the challenge by code; at the token request, compute base64url(SHA256(verifier)) and compare in constant time with the challenge.

### Common pitfalls
- Using the plain method instead of S256.

### S256 details
SHA-256 gives a 256-bit output, base64url without padding. The verifier is 43-128 characters from [A-Z a-z 0-9 - . _ ~].

### Constant-time comparison
MessageDigest.isEqual avoids timing leaks when comparing challenges.

### CSRF protection
Combine with the state parameter; PKCE does not replace state, the two mechanisms complement each other.

### Further interview notes
PKCE is mandatory for public clients per OAuth 2.1; confidential clients should use it too; code_verifier must not be logged.
- Not checking the verifier makes PKCE meaningless.
- Verifier too short (<43 characters).

### Challenge example
~~~java
MessageDigest md = MessageDigest.getInstance("SHA-256");
byte[] d = md.digest(verifier.getBytes(StandardCharsets.UTF_8));
String challenge = Base64.getUrlEncoder().withoutPadding().encodeToString(d);
~~~

### Extra5
Use SecureRandom for the verifier; length 43-128; unreserved charset.

### Extra4
The authorization server stores the challenge; the token endpoint recomputes and compares.

### Extra3
Public clients cannot keep a secret; PKCE provides proof of possession.

### Extra2
The token endpoint validates code + verifier + redirect_uri; a mismatch rejects.

### Extra
RFC 7636, OAuth 2.1 mandates PKCE, verifier entropy, challenge storage, replay protection.

### Interview answer
Answer: PKCE binds the code to the verifier, uses S256, is mandatory for public clients, prevents code interception.

### Common pitfalls
Using the plain method, short verifier, not checking the verifier, replaying the code.

### Production notes
Log the challenge, reject code reuse, enforce PKCE for all public clients, exact redirect.

### Best practices
Generate the verifier with SecureRandom, use S256 challenge, use state against CSRF, exact redirect URI match.

### Interview notes
PKCE is mandatory for public clients (RFC 7636); combine with state against CSRF.`,
    exercises: [
      {
        title: 'AuthServer PKCE',
        prompt: `Implement AuthServer with authorize(clientId, challenge) returning a code, and token(code, verifier) returning a token or null if the verifier is wrong.`,
        hints: ['challenge = base64url(SHA256(verifier))', 'Compare in constant time'],
        explain: 'The solution stores the challenge by code, checks the verifier and prevents replay.',
      },
    ],
    check: [
      { q: 'What does PKCE protect against?', options: ['CSRF', 'Authorization code theft on a public client', 'XSS', 'SQLi'], answer: 1, explain: 'It binds the code to a verifier only the client knows.' },
      { q: 'Which PKCE method should be used?', options: ['plain', 'S256', 'MD5', 'SHA-1'], answer: 1, explain: 'S256 = base64url(SHA-256(verifier)).' },
    ],
  },
});
