/*
 * English translation of js/data/lessons-security.js — task T500. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-001
 */
App.i18n.content({
  'lesson-security-001': {
    title: 'Storing passwords safely: random salt, PBKDF2 and timing-safe comparison',
    goals: [
      'Explain why hashing with plain SHA-256 or encrypting reversibly are both wrong for storing passwords, and what a salt actually solves',
      'Use {{SecretKeyFactory}} with {{PBKDF2WithHmacSHA256}} to derive keys in the right storage format',
      'Compare two hashes with {{MessageDigest.isEqual}} instead of {{equals}}, and explain the timing trap',
    ],
    body: `### Why storing a SHA-256 of the password is still wrong
Put yourself in the situation where the database leaks: the attacker holds the {{users}} table with password hashes for millions of people and wants to recover the original passwords. The only way is to **guess**: take each candidate password (dictionary, passwords leaked in other breaches...), hash it and compare with the stored hash. SHA-256 (like MD5 and SHA-1) is designed to be **fast** \u2014 a GPU can compute billions of SHA-256 per second, so an 8-character common password falls within a few hours. Meanwhile a single PBKDF2 run with a few hundred thousand iterations takes hundreds of milliseconds on a CPU. The strength of a password hash comes from being **deliberately slow** (every guess is expensive), not from the length of the output string.

The second problem is the **rainbow table**: the attacker precomputes a reverse lookup table for millions of common passwords. The same password "123456" always produces the same hash, so one table is enough to look up every user who has a weak password.

Reversible encryption (AES) goes against the goal: storing a password means the stored data must **not** allow recovering the password. With AES you have to manage a key; if the key leaks, every password leaks, and whoever holds the key can read users' passwords (even if they reuse them on another service). A system never needs to **read back** a password: at login it only hashes what the user just typed and compares it with the stored hash. So a one-way function (hash) is the right tool, and reversible encryption is not.

### Salt: one random grain per user
A salt is a random string **unique to each user**, generated with {{SecureRandom}} (not {{Random}} \u2014 its seed is predictable), at least 16 bytes, and **stored alongside** the hash. The salt is not a secret: leaking it does not help if the password is weak.

With a per-user salt, "123456" for two people yields two different hashes, so:
- a shared reverse lookup table is useless \u2014 it would have to be precomputed for each salt;
- two users with the same password are not exposed by comparing hashes;
- the attacker cannot use one hash computation to try every user at once: to guess "123456" for 1 million users they must compute 1 million different hashes.

A salt does **not** make a weak password stronger; it only blocks precomputation and mass attacks. Defending against guessing each individual password still comes from making every attempt **slow**.

### PBKDF2: raising the price of one attempt
PBKDF2 (Password-Based Key Derivation Function 2, RFC 2898) repeats HMAC many times over the password and the salt, also known as key stretching:

~~~java
// JDK 17 \u2014 JDK standard library only, no Bouncy Castle needed
PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_BITS);
SecretKeyFactory kf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
byte[] key = kf.generateSecret(spec).getEncoded();   // 32 bytes when KEY_BITS = 256
spec.clearPassword();                                // do not keep the password on the heap
~~~

- {{ITERATIONS}} is the "price of one attempt". Doubling it makes both you and the attacker twice as slow, but the two sides pay very different costs: the server hashes **once** per login (a few hundred milliseconds more), while the attacker needs **billions** of attempts, so every doubling doubles the number of days (or the GPU rental bill) the attacker must spend. OWASP (Password Storage Cheat Sheet, 2023) recommends around **600,000** iterations for PBKDF2-HMAC-SHA256.
- PBKDF2's weakness: it only costs CPU, not RAM, so GPUs/ASICs can run thousands of attempts in parallel very cheaply. Argon2id (and to a lesser degree scrypt, bcrypt) forces each attempt to use a lot of memory, which makes GPU parallelisation far more expensive \u2014 that is why OWASP ranks Argon2id as the preferred choice.
- {{KEY_BITS}} = 256: a longer output does **not** slow the attacker down, because the cost lives in the HMAC loop.
- {{PBEKeySpec}} takes a {{char[]}} rather than a {{String}}: a char array can be wiped with {{clearPassword()}}, while a String stays on the heap until GC reclaims it.

| Algorithm | Pros | Cons |
|---|---|---|
| PBKDF2-HMAC-SHA256 | available in the JDK, an RFC standard, easy to configure | weaker GPU resistance than Argon2 |
| bcrypt | decent GPU resistance, widespread, built into Spring Security | not in the JDK; only the first 72 bytes of the password are used |
| Argon2id | best GPU/ASIC resistance because it costs RAM | not in the JDK; Spring Security's {{Argon2PasswordEncoder}} needs Bouncy Castle on the classpath; costs server RAM |

In a Spring project, **Spring Security** (not Spring Boot) provides {{BCryptPasswordEncoder}}, {{Pbkdf2PasswordEncoder}}, {{Argon2PasswordEncoder}}. The recommended approach is {{PasswordEncoderFactories.createDelegatingPasswordEncoder()}}: the stored hash carries the algorithm name as a prefix in braces (for example the bcrypt prefix in front of the {{$2a$10$...}} string), so you can change the default algorithm while old hashes still verify. Prefer the built-in encoders over writing your own; this lesson writes one by hand so you understand the internals, set the parameters correctly and can answer interview questions.

### Timing-safe comparison
After computing the new hash from the user's password, we must compare it with the stored hash. {{String.equals}} **returns early** at the first differing character: if the two strings differ at the very first byte, it returns false almost instantly. An attacker who measures the response time character by character can infer where the difference is \u2014 this timing attack technique has actually broken the authentication mechanism of real systems and libraries.

With salted password hashes an attacker can hardly exploit this channel (they do not control the hash bytes), but for tokens, HMAC signatures and API keys it is a real vulnerability. The right habit: **every comparison of a secret must be constant-time**.

{{MessageDigest.isEqual(a, b)}} (since JDK 6u17) walks the **entire length of the first array** and combines all differences with XOR/OR, never returning early, so the time does not depend on where the difference is:

~~~java
byte[] expected = HexFormat.of().parseHex(storedHash);
byte[] actual   = HexFormat.of().parseHex(hashOf(password, salt));
return MessageDigest.isEqual(expected, actual);   // do NOT use expected.equals(actual)
~~~

Small note: the runtime of {{isEqual}} depends only on the length of the **first argument**, so put the value you keep (the stored hash) first. Two arrays of different lengths always compare false, and the hashes here are always 32 bytes, so the length leaks no information either.

### Storage format and the upgrade path
A common format is {{pbkdf2$600000$saltHex$hashHex}}: store **both the algorithm and the iteration count** with the hash. When verifying, you must recompute with exactly the iteration count **read from the stored string** (not the current constant), otherwise hashes created with 310,000 iterations will never match after you raise it to 600,000. When a user logs in successfully (at that point you hold the original password), compare the stored iteration count with the current value: if it is lower, **rehash and overwrite**. That is how you upgrade the hashing cost for the whole system without forcing users to change their password (Spring's {{DelegatingPasswordEncoder.upgradeEncoding}} does exactly this).

Parsing the format must **fail safe**: on corrupted data {{verify}} returns false instead of throwing an exception that turns the request into a 500. Also cap the iteration count read back (say, at most 10 million) so a tampered row cannot turn every login into a loop lasting minutes.

### Production traps
- **Login CPU cost**: 600,000 PBKDF2 iterations cost a few hundred milliseconds of CPU per login; 200 logins/second is dozens of cores just for hashing. Moving it to {{@Async}} does not reduce CPU (the request still waits for the result). The right approach: measure on real hardware and pick the parameters (typically targeting under one second), rate-limit the login endpoint, and cap the number of concurrent hash operations (a bulkhead, e.g. a {{Semaphore}}) so a login storm does not starve other APIs.
- **Passwords ending up in logs**: body-logging interceptors, exceptions that print arguments, APM capturing the form. A password must never enter a log; mask it at the logging layer.
- Using {{Random}} instead of {{SecureRandom}} for the salt, or using one shared salt for the whole system \u2014 both defeat the purpose of the salt.
- Hashing once and never upgrading the parameters: when a breach happens you are helpless because guessing is too cheap.

### Interview relevance
Interviewers often ask: "bcrypt or Argon2, when do you pick which?", "why does a salt not need to be secret?", "how long does one hash take and how do you handle that in production?", "why compare in constant time?". Finishing the exercise below \u2014 generating the salt with {{SecureRandom}}, calling {{PBKDF2WithHmacSHA256}}, comparing with {{MessageDigest.isEqual}} \u2014 means you can answer all four.`,
    exercises: [
      {
        title: 'Write PasswordHasher: generate the salt, PBKDF2 and a timing-safe verify',
        prompt: `Complete {{PasswordHasher}} so it stores and checks passwords correctly:

- {{create(password)}}: generate a 16-byte salt with {{SecureRandom}}, compute the hash with {{PBKDF2WithHmacSHA256}} using {{ITERATIONS}} iterations and {{KEY_BITS}} bits, return the string {{pbkdf2$ITERATIONS$saltHex$hashHex}} (lowercase hex via {{HexFormat}}).
- {{hash(password, salt)}}: compute the hash (lowercase hex, 64 characters) for a given salt with {{ITERATIONS}} iterations; this is the deterministic function (the same input always gives the same output). Add a private overload {{hash(password, salt, iterations)}} for {{verify}} to reuse.
- {{verify(password, stored)}}: split the stored string into 4 parts, check that the first part is {{pbkdf2}}, **read the iteration count from the second part** (it must be within 1..10,000,000), recompute the hash from the password, the salt and that iteration count, then compare with {{MessageDigest.isEqual}}. Return **false** (do not throw) when the string is null, malformed, the iteration count is invalid, the hex is invalid or the password is wrong.

JDK 17 only, no third-party libraries.`,
        hints: [
          'Generate the salt with {{new SecureRandom().nextBytes(salt)}}, encode to hex with {{HexFormat.of().formatHex(...)}}; cut the stored string with {{indexOf}} rather than {{split}} because the $ character is a regex character.',
          '{{PBEKeySpec}} takes a {{char[]}} \u2014 call {{clearPassword()}} in a {{finally}} block once the key has been generated.',
          '{{MessageDigest.isEqual}} takes {{byte[]}}: parse the stored hash and the recomputed hash into bytes before comparing; every error path returns false.',
          'Read the iteration count with {{Integer.parseInt}} from the second part; {{NumberFormatException}} is a subclass of {{IllegalArgumentException}}, so a single {{catch (IllegalArgumentException e)}} catches both number and hex errors.',
        ],
        explain: `The biggest trap is comparing with {{Arrays.equals(expected, actual)}} or comparing the two hex strings with {{equals}}: both return early at the first differing byte, so the timing channel remains. (Note that {{expected.equals(actual)}} on two {{byte[]}} arrays is even more wrong: it compares **object identity**, so it always returns false.) "Constant-time comparison" properly means walking all the bytes before returning the result.

The second trap is {{split("$")}}: {{split}} takes a regex and {{$}} is the "end of input" anchor, so the string is not split at all. Use {{indexOf}} as above, or {{split("\\\\$")}}.

The third trap is verifying with the {{ITERATIONS}} constant instead of the stored iteration count: the day you raise {{ITERATIONS}}, all existing users can no longer log in. The iteration count must travel with the hash.

The fourth trap is parse failure throwing: one corrupt row in the DB turns login into a 500 and leaks a stack trace. {{verify}} must wrap every parse error and return false. This lesson uses {{ITERATIONS = 6000}} so the tests run in a few dozen milliseconds; production follows the current OWASP recommendation for PBKDF2-HMAC-SHA256 (hundreds of thousands of iterations, about 600,000 in the 2023 table) and considers Argon2id if attackers have GPUs.`,
      },
    ],
    check: [
      {
        q: 'Why is storing {{SHA-256(password)}} not enough for passwords?',
        options: [
          'Because a SHA-256 output is only 32 bytes, too short to hold a password',
          'Because SHA-256 is too fast on specialised hardware, and the same password always gives the same hash, so an attacker can try billions per second',
          'Because SHA-256 has been completely broken and can no longer be used',
          'Because SHA-256 cannot handle Unicode characters in passwords',
        ],
        explain: `The weakness of SHA-256 for passwords is **speed**: a GPU tries billions of SHA-256 per second, whereas PBKDF2 with hundreds of thousands of iterations makes each attempt hundreds of thousands of times more expensive; on top of that, without a salt the same password always yields the same hash, so a rainbow table works. A 32-byte output is long enough (it has nothing to do with storing passwords) \u2014 what matters is the cost per attempt. SHA-256 has not been mathematically broken but it is the wrong tool for passwords; and it processes every byte including Unicode, so the "Unicode" option is wrong too.`,
      },
      {
        q: 'How is a proper salt generated and stored?',
        options: [
          'Generate it with {{Math.random}} once for the whole system, hidden inside the secret key',
          'Generate 16 bytes with {{Random}} per user, kept only in RAM',
          'Generate at least 16 bytes with {{SecureRandom}} per user and store it with the hash \u2014 it does not need to stay secret',
          'No salt is needed once you use HTTPS and hash the password',
        ],
        explain: `The salt must be **unique per user** (to break shared reverse lookup tables), generated with {{SecureRandom}} (the seeds of {{Random}}/{{Math.random}} are predictable) and **stored alongside** the hash \u2014 you need it when verifying, so it is not a secret. One shared salt for the whole system is nearly useless; a salt does not replace HTTPS, and conversely HTTPS does not replace a salt (which protects the data when the disk is stolen).`,
      },
      {
        q: 'Two hashes differ in the last byte; what do {{equals}} and {{MessageDigest.isEqual}} return?',
        options: [
          '{{MessageDigest.isEqual}} walks all the bytes without returning early, whereas {{equals}} stops at the first differing byte and can leak the position of the difference through the response time',
          'Both return false with the same complexity, there is no difference',
          '{{equals}} is safer because the JVM optimises String specially',
          '{{MessageDigest.isEqual}} hashes both strings again before comparing, so it is more accurate',
        ],
        explain: `Both return false, but **how they get to false** differs: {{equals}} stops at the first differing character (the response time depends on where the difference is), while {{MessageDigest.isEqual}} always walks the full length of the first array before returning. The JVM has no "safe optimisation" for {{equals}}, and {{isEqual}} compares the two byte arrays as they are rather than hashing again.`,
      },
    ],
  },
});