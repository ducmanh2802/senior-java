/*
 * English translation of js/data/lessons-security.js — task T696. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-006
 */
App.i18n.content({
  'lesson-security-006': {
    title: 'OAuth2 Authorization Code + PKCE: why an app cannot hold a client_secret and how code_verifier closes that hole',
    goals: [
      'Tell a confidential client apart from a public client; explain why an SPA and a mobile app cannot keep a {{client_secret}}',
      'Generate a correct {{code_verifier}} (43–128 characters) and {{code_challenge}} = BASE64URL(SHA-256(verifier)) without padding, using nothing but the plain JDK',
      'Write the authorization-server side: the code is single-use, has a limited lifetime, and a wrong verifier is rejected and also invalidates the code immediately',
      'Explain what {{state}} defends against, why it cannot replace PKCE, and which risks PKCE does not fix',
    ],
    body: `### The four roles in OAuth2 (defined from scratch, because everything below depends on them)
- **Resource Owner**: the user — the owner of the data.
- **Client**: the application that wants to read that data **on behalf of** the user. It can be a SPA (Single-Page Application: a React/Vue app that runs inside the browser), an iOS/Android app, or a backend that runs a nightly batch job.
- **Authorization Server (AS)**: the place where the person actually types their password and clicks "Allow". Examples: Google, Keycloak, Spring Authorization Server, Auth0. The AS issues an **authorization code** (a short-lived ticket) and then exchanges that ticket for an **access token**.
- **Resource Server (RS)**: the API that holds the data — usually your own Spring Boot app. The RS knows nobody's password; it only checks the access token sent in the **Authorization** header and answers "does this token have the scope to read orders?".

Everyday example: a "Calorie counter" app wants to read the meal plan stored in your Google Calendar. Giving the app your Google password is like handing your house key to a stranger: they keep it forever, they can open every room (mail, Drive, photos), and you cannot revoke that one app alone. OAuth solves this by letting **Google itself** hand the app a ticket that opens only the calendar door and expires after one hour.

| Client type | Where it runs | Can it keep a secret? | Examples |
|---|---|---|---|
| **Confidential client** | **Your** server (backend, batch job) | Yes — the secret lives in an environment you control | Spring Boot acting as a BFF, service-to-service |
| **Public client** | The **user's** machine | **Never** | SPA in the browser, mobile app, CLI, smart TV |

### Why an SPA and a mobile app cannot hold a client_secret
With an SPA, the whole JavaScript has already been downloaded to the user's machine in order to run. That means anyone can press F12 → Sources tab (or Ctrl+U to view the source) and read every string in the bundle — including the string you call "secret" and removed from the repo ages ago. On mobile it is worse: the APK/IPA file is taken straight from the store, unpacked with widely available tooling, and {{strings}} is run over it. Obfuscation only makes the code harder to **read**, not harder to **extract**: an algorithm that runs on the attacker's machine is an algorithm the attacker can read.

So a {{client_secret}} for a public client is not a secret at all, and the current OAuth standards (RFC 9700, OAuth 2.1) **drop** the use of a secret there entirely; the {{client_id}} is only a public identifier, like a domain name — it proves nothing about who is calling. The consequence: when the app comes back to exchange the code for a token, the AS has no way to know "is this really the app that started the flow?". That is exactly the hole PKCE fills.

### Step by step: the Authorization Code flow with PKCE
~~~seq
title: Authorization Code + PKCE for an SPA
actors: App | AS | RS
App -> App: create random code_verifier
App -> AS: /authorize?code_challenge&state
AS --> App: login and consent screen
AS --> App: redirect ?code&state
App -> AS: /token (code + code_verifier)
App -> App: check that state matches
AS -> AS: SHA256(verifier) == challenge?
AS --> App: access token + refresh token
App -> RS: GET /api/orders (Bearer token)
RS --> App: order data
note App..RS: the code is single use, TTL of tens of seconds
~~~

**Step 1.** The app generates a random {{code_verifier}}, keeps it in the memory of the current browsing session ({{sessionStorage}}), then redirects the browser to the AS:

~~~text
GET https://auth.example.com/authorize
  ?response_type=code
  &client_id=spa-calorie
  &redirect_uri=https://app.example.com/callback
  &scope=openid%20profile
  &state=7f3Aq0Kz9Xk2mQpR
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
~~~

**Step 2.** The user logs in **on the AS's own screen**. The app never sees the password — that is the whole meaning of "delegation instead of handing over the key".
**Step 3.** The AS redirects back to the {{redirect_uri}} with {{?code=...&state=...}}. Note: the code travels through the **browser**, that is through the address bar, through history, through logs.
**Step 4.** The app POSTs to {{/token}} with {{code}}, {{code_verifier}}, {{client_id}} (no secret):

~~~text
POST /oauth2/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SlaxwqT3vN9dLk2Yh
&redirect_uri=https://app.example.com/callback
&client_id=spa-calorie
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
~~~

**Step 5.** The AS checks that {{SHA-256(code_verifier)}} equals the {{code_challenge}} it stored in Step 1, and only then issues the access token (plus a refresh token).
**Step 6.** The app calls the RS with the header **Authorization: Bearer**. The RS does not have to ask the AS on every request if the token is a self-contained JWT (it verifies the signature + {{exp}} + {{aud}}); when you need instant revocation, use an opaque token + introspection.

### How the code gets stolen — the lesson that produced PKCE
An attacker only has to **see** the {{code}} to obtain a token, if there is no PKCE:
- **Mobile, custom URL scheme**: the app registers {{myapp://oauth/callback}}. The operating system opens **whichever app registered that scheme**, without caring who owns it. A malicious app installed with the same scheme receives the code verbatim.
- **SPA**: the code shows up in the address bar → it lands in browser history, in the **Referer** header if the callback page immediately loads third-party resources, in reverse-proxy/CDN logs, in extensions that read the DOM, and even in a screenshot when somebody says "send me the link".
- The user copies the link "to send it to support", or the browser auto-fills an old URL that still contains the code.

This is the **authorization code interception attack**. The same kind of leak is why the **Implicit flow** was retired: it returns the access token directly in the URL fragment after the # — the token appears in plain sight in the address bar, sits in history, every script on the page can read it, and there is no refresh token either, so the login flow has to run again every five minutes.

### PKCE: a password only its creator knows, and one that never crosses the leaking channel
The principle in one sentence: **on the exposed step send the hash, on the closed step send the original**.
- {{code_verifier}} is a random string of 43–128 characters taken from the *unreserved* alphabet {{A-Za-z0-9-._~}} (the set of characters that is safe in a URI and needs no escaping). In practice you take exactly 32 random bytes from {{SecureRandom}} and base64url-encode them without padding → 43 characters, which satisfies the spec.
- {{code_challenge}} = BASE64URL(**without padding**) of the SHA-256 computed over the verifier's ASCII bytes.
- The challenge travels in the {{/authorize}} request (the leaking channel): an attacker who sees it gains nothing, because SHA-256 is one-way — you cannot derive the verifier backwards from it.
- The verifier travels in the **POST body** of {{/token}} over TLS: not in the URL, not in history, not in proxy logs, not in Referer. An attacker holding the code is still missing the last piece.

The official test vector in Appendix B of RFC 7636 — compute it yourself once so you actually believe it:

| | Value |
|---|---|
| {{code_verifier}} | dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk |
| {{code_challenge}} | E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM |

{{code_challenge_method=plain}} means sending the raw verifier already in the {{/authorize}} request: anyone sitting in the middle (or a proxy log) reads the verifier from step 1 and PKCE becomes useless. The new standard allows only {{S256}}; the AS must **reject** every request that uses {{plain}} or that omits {{code_challenge_method}}.

All PKCE proves is: "the one exchanging the code is the one that started this session". It does **not** authenticate the client's identity, it does not prove the app is a real app.

### state: its own CSRF defence, do not confuse it with PKCE
The attacker logs in with **their own account**, obtains a valid code, then makes the victim's browser open the callback URL containing that code (a chat link, an image page). The victim clicks → the victim's session is now attached to the attacker's account → everything the victim types (orders, photos, notes) lands in the attacker's account, and the attacker can read it. This is **login CSRF**, and PKCE cannot stop it because the code is perfectly valid and the verifier is correct too.
The defence: the app generates a random {{state}}, ties it to the current session of that very browser, sends it to the AS, receives it back at the callback and compares it with the stored value. The AS should treat state as an opaque parameter and never interpret it.
({{nonce}} is the sibling idea applied to the OIDC {{id_token}}, defending against token replay.)

### What PKCE does not fix — and what does
| Risk | The right countermeasure |
|---|---|
| Code captured on the way back | PKCE (S256) + short code TTL, single use |
| Someone else's valid code pushed into your browser | {{state}} |
| Token read by XSS (token sitting in {{localStorage}}) | The **BFF** pattern: the backend holds the token, the SPA only gets an {{HttpOnly}} {{SameSite}} cookie |
| Token escapes and gets reused | Refresh token **rotation** (single use, reuse detection revokes the whole chain) + sender-constraining (DPoP, mTLS) |
| A fake app impersonating a {{client_id}} | App Attest / Play Integrity, and an AS that mandates PKCE |
| id_token replayed | {{nonce}} + validation of {{aud}}, {{iss}}, {{exp}} |

### Writing it in plain Java
Three JDK classes are enough: {{SecureRandom}}, {{MessageDigest}}, {{java.util.Base64}}:

~~~java
byte[] raw = new byte[32];                                  // 256 bits of entropy
new SecureRandom().nextBytes(raw);                          // NOT Math.random: its seed is predictable
String verifier = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);   // 43 chars, A-Za-z0-9-_

MessageDigest md = MessageDigest.getInstance("SHA-256");
String challenge = Base64.getUrlEncoder().withoutPadding()  // withoutPadding strips the "=" signs
    .encodeToString(md.digest(verifier.getBytes(StandardCharsets.US_ASCII)));    // the verifier is ASCII
~~~

In Spring, two configuration points come up a lot in interviews:
- AS mandates PKCE: {{ClientSettings.builder().requireProofKey(true).build()}} (Spring Authorization Server), or set the PKCE method to {{S256}} for the client in Keycloak.
- Spring Security **acting as the client**: {{OAuth2AuthorizationRequestCustomizers.withPkce()}} plugged into {{DefaultOAuth2AuthorizationRequestResolver}} so it generates the verifier itself and sends S256.

### Production traps
- {{redirect_uri}} validated with {{startsWith}} or {{matches}}: the attacker registers {{https://app.example.com.callback.evil.tld}} and receives the code. Compare **character for character** against the registered allow-list.
- The AS only checks that the request carries a {{code_challenge}} and never compares the verifier when the code is exchanged ("let the request through") — PKCE becomes decoration.
- Reusing one verifier across logins, or writing the verifier into a log/URL: the protection is gone immediately.
- Sending the code to {{/token}} via GET, or putting the verifier in the query string: the verifier ends up in the access log.
- Code TTL of minutes to hours, and exchangeable more than once: it must be single use, TTL 15–60 seconds, and bound tightly to the {{client_id}} + {{redirect_uri}} used at the authorize step.
- When the verifier is **wrong**, the RFC advises invalidating every pending code of that client (proof someone is guessing) instead of letting them retry.
- An SPA that keeps access token + refresh token in JS storage: one XSS loses everything; consider a BFF rather than trying to "hide" a secret.

### Interview relevance
Typical questions: "how does an SPA sign in with Google without a client_secret?", "which specific attack does PKCE stop?", "what is the difference between state and nonce?", "can PKCE replace refresh token rotation?". Answering those four with the correct attack names (code interception, login CSRF) and the correct verifier character range already puts you ahead of most candidates. Do the exercise below to own the mechanism yourself: generate a verifier, compute a challenge that matches the RFC's test vector, and write the server side that rejects a used / expired / wrong-verifier code.`,
    exercises: [
      {
        title: 'Implement Pkce and AuthServerSim: generate a verifier, compute the challenge, exchange a code for a token safely',
        prompt: `Two classes to complete ({{Exchange}} is already written, just use it).

**{{Pkce}}**
- {{newVerifier(random)}}: take {{VERIFIER_BYTES}} (32) bytes from the {{SecureRandom}} passed in, return their base64url encoding **without padding** → exactly 43 characters, all from the unreserved alphabet.
- {{challenge(verifier)}}: SHA-256 over the **US-ASCII** bytes of the verifier, return base64url without padding of the digest. Wrap {{NoSuchAlgorithmException}} in an {{IllegalStateException}}.

**{{AuthServerSim}}** — the authorization-server side; the clock is **passed in** so tests are deterministic:
- {{issueCode(codeChallenge, issuedAtEpochSec)}}: generate a {{code}} from 16 random bytes base64url-encoded (no padding), store {{code -> (challenge, issuedAt, used=false)}} in the map, return the {{code}}.
- {{exchange(code, codeVerifier, nowEpochSec)}} returns an {{Exchange}}, running these checks in **exactly this order**:
1. {{code}} is null or not present in the map → {{Exchange.failed("unknown_code")}}.
2. the code has already been used → {{failed("redeemed")}}.
3. {{nowEpochSec - issuedAt >= CODE_TTL_SECONDS}} → {{failed("expired")}} (the last second before the deadline must still **succeed**).
4. any kind of bad verifier → {{failed("invalid_grant")}} **and mark the code as used** (someone guessing verifiers must not get a second try). "Bad" covers: {{null}}, length outside 43..128, a character outside the alphabet {{A-Za-z0-9-._~}}, or SHA-256(verifier) not matching the stored challenge. Compare with {{MessageDigest.isEqual}} over bytes, not with {{equals}}.
5. everything is fine → set {{used = true}}, return {{Exchange.granted("at-" + code)}}.

JDK 17 only, no external libraries, no wall-clock time.`,
        hints: [
          'Base64url **without padding** is {{Base64.getUrlEncoder().withoutPadding()}}; the plain {{Base64.getEncoder()}} appends = signs and uses the characters + / , so it violates the PKCE spec.',
          '32 bytes encoded as base64url give exactly 43 characters (10 groups of 3 bytes = 40 characters, the leftover group of 2 bytes = 3 characters) — that is why the verifier range starts at 43.',
          'Inside {{exchange}}, do not "fix" the comparison by matching strings with {{equals}}; convert both the stored challenge and the recomputed challenge to bytes and use {{MessageDigest.isEqual}}.',
          'Set {{used = true}} in **the wrong-verifier branch too**: RFC 9700 advises invalidating the code when the PKCE evidence does not match, because that is a sign of active guessing.',
        ],
        explain: `The three places people most often get wrong when writing this by hand.

**First, plain base64 instead of base64url.** The SHA-256 digest is 32 bytes; standard base64 produces the characters {{+}} and {{/}} and may append {{=}}. All three must be escaped when they travel in a query string, so clients typically break right here. RFC 7636 mandates base64url **without padding**; that is why the challenge is always exactly 43 characters long (32 bytes of SHA-256 never need more than one padding character, and the url-safe alphabet has no {{+}} or {{/}}). The test vector in the RFC is the "mirror" you check your implementation against.

**Second, checking only the challenge and forgetting the verifier.** If the server only compares {{SHA-256(verifier)}} with the challenge, a 6-character verifier still gets through and the entropy of the whole mechanism collapses. The 43–128 length range and the unreserved alphabet are **part of the standard**, and the server must enforce them — that is why the exercise has a case where "a too-short verifier whose hash still matches must be rejected".

**Third, the order of the checks and what it implies.** If you test expiry after testing the verifier, the attacker can probe verifiers against an already-dead code. If you do not mark the code as used when the verifier fails, the same code gets tried thousands of times. Conversely, if you delete the entry on failure, the legitimate client coming back a second time gets "unknown_code" instead of "redeemed" and you lose the signal you would use to raise an alarm. This exercise keeps the entry and marks it used, so both sides have enough information to act.

One more point worth stating clearly in an interview: a real server **does not tell the client why it refused** (RFC 6749 only has {{invalid_grant}}); we split "unknown_code"/"expired"/"redeemed" in the exercise so it can be tested and logged internally, but the response returned to the app should merge them so the attacker cannot learn whether the code exists at all.`,
      },
    ],
    check: [
      {
        q: 'Why do an SPA and a mobile app use PKCE instead of a {{client_secret}}?',
        options: [
          'Because PKCE is stronger than a secret: a 43-character verifier is longer than the average secret',
          'Because SPA/mobile code runs on the user machine, where a secret can be extracted and therefore is no longer a secret; PKCE replaces it by proving the client started the session, with no shared secret',
          'Because the AS refuses {{client_secret}} for any client at all',
          'Because PKCE encrypts the access token, which makes a secret redundant',
        ],
        explain: `The crux is **where the code runs**: JavaScript in the browser and an APK/IPA can both have their internal strings extracted, so a secret cannot stay secret. PKCE is not "stronger than a secret" — it solves a different problem: without any shared secret it forces the one exchanging the code to be the one that created the verifier. The AS still accepts a secret from confidential clients (backends), and PKCE has nothing to do with encrypting tokens.`,
      },
      {
        q: 'In a flow with PKCE, at which step are {{code_challenge}} and {{code_verifier}} used?',
        options: [
          'Both are sent at {{/authorize}} and the verifier is ignored',
          'The verifier is sent at {{/authorize}}, the challenge at {{/token}}',
          'The challenge (the hash of the verifier) is sent at {{/authorize}}, the original verifier is sent in the POST body at {{/token}}; the AS compares SHA-256(verifier) with the stored challenge',
          'The verifier is sent along with the access token in the header on every API call',
        ],
        explain: `The rule is "on the exposed step send the hash, on the closed step send the original": {{/authorize}} goes through the browser, so only the challenge travels there (one-way, it cannot be reversed), while the verifier travels in the body of the TLS POST to {{/token}}. Swapping them (sending the raw verifier at step 1) is {{plain}}, which an attacker in the middle simply captures; the verifier is never sent with the access token when calling the API.`,
      },
      {
        q: 'The attacker logs in **with their own account**, obtains a valid code, then makes the victim open a callback URL containing that code. What is this and how do you defend against it?',
        options: [
          'Authorization code interception; defended with PKCE using S256',
          'Login CSRF; defended with a random {{state}} stored on the app side and compared when the callback arrives',
          'An {{id_token}} replay; defended by lengthening the access token TTL',
          'Not an attack, because the code belongs to the attacker\'s own account',
        ],
        explain: `The code is valid and the verifier is correct (the attacker created it), so PKCE is completely powerless — this is login CSRF: the victim is accidentally signed into the attacker's account and writes data there. The {{state}} binds the request to the victim's browser session, so the app detects that the code is not its own. {{nonce}} is the mechanism for the {{id_token}}, and raising the TTL only makes things worse; the damage is real: the victim's data ends up in an account the attacker controls.`,
      },
    ],
  },
});
