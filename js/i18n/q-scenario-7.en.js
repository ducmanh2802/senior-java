/*
 * English translation of js/data/q-scenario.js — task T389. Format: js/core/i18n.js (content overlay).
 * ids: scenario-068 scenario-069 scenario-070 scenario-071 scenario-072 scenario-073
 */
App.i18n.content({
  'scenario-068': {
    q: 'The company has 40 services running on Java 8 and Java 11, and needs to upgrade to Java 21 within two quarters to meet support deadlines and prepare for Spring Boot 3. How do you plan the upgrade, identify risks, and avoid production incidents?',
    a: `**Summary:** Upgrade in two distinct steps: **run old bytecode on JVM 21** first (change runtime, do not change code yet), then **compile with {{--release 21}}** and use new features. The main risks are: removed APIs (Java EE modules like JAXB since Java 11), **strong encapsulation** of JDK internals (Java 16/17), outdated libraries using bytecode/reflection (Lombok, Mockito/ByteBuddy, ASM, JaCoCo), removed JVM/GC flags, and behavioral changes (default charset UTF-8 from Java 18, CLDR locale data). Inventory with {{jdeps}}/{{jdeprscan}}, canary each service, compare metrics before and after.

### Quick Understanding
Like **moving a whole company to a new building**: first, try to let each department **move with their old furniture** (change runtime) to see if electricity and water work, then **buy new furniture** (change code, new features). Doing both at the same time makes it impossible to know the cause if something breaks.

### Technical Terms
- **Runtime upgrade**: run old JAR file (compiled in Java 8/11) on JVM 21; Java maintains backward compatibility at the bytecode level very well.
- **--release N**: javac flag to compile for the correct API of version N.
- **Strong encapsulation**: from Java 16 (JEP 396), reflection access to JDK internals is blocked by default; Java 17 (JEP 403) completely removed the {{--illegal-access}} flag, only allows opening package by package with {{--add-opens}}.
- **jdeps / jdeprscan**: JDK tools to find dependencies on internal APIs and deprecated/removed APIs.

### Inventory and risk categorization
1. {{jdeps --jdk-internals --multi-release 21 -cp 'libs/*' app.jar}}: list where {{sun.misc}}, {{sun.security}} are used...
2. {{jdeprscan --release 21 app.jar}}: APIs marked as removed.
3. Build scan: Maven/Gradle plugins, agents (APM, JaCoCo), JVM flags in Dockerfile/Helm.
4. Rank 40 services by risk: number of old libraries, level of reflection usage, business criticality.

### Things that often break (and symptoms)
| Problem | Symptom | How to fix |
|---|---|---|
| JAXB, JAX-WS removed since Java 11 | {{NoClassDefFoundError: javax/xml/bind/...}} | add Jakarta XML Binding dependency |
| Strong encapsulation | {{InaccessibleObjectException: Unable to make field ... accessible}} | upgrade library; temporarily use {{--add-opens}} with a note to remove |
| Old Lombok/ByteBuddy/ASM | compilation error, Mockito cannot mock | upgrade to version supporting Java 21 |
| Old JVM flags | JVM does not start with {{-XX:+PrintGCDateStamps}} (Unrecognized VM option) | switch to unified logging {{-Xlog:gc*}} |
| CMS removed (Java 14) | warning ignoring flag, different GC than expected | choose G1 (default) or ZGC with measurements |
| Default UTF-8 charset (Java 18) | files read/written with wrong encoding on Windows/old locale | always specify charset explicitly |
| CLDR locale data (from Java 9) | date/currency format different from before, string comparison test fails | use explicit pattern; review test |

### Roadmap
~~~text
Phase 0 Preparation: JDK 21 base image, CI runs tests on both old JDK and 21
Phase 1 Runtime: run old JAR on JDK 21 in staging -> canary 5% -> 100%
Phase 2 Build: --release 21, upgrade plugins/libraries, fix warnings
Phase 3 Leverage: records, switch patterns, virtual threads (measure first, enable selectively)
Each phase: 2-3 low-risk services go first as a "playbook", then scale up
~~~

### Production verification
- Compare before and after for each service: p99 latency, GC pause, container RSS, CPU, error count.
- Enable {{-Xlog:gc*}} and JFR ({{-XX:StartFlightRecording}}) on canary to have comparison data.
- Memory consideration: new JVM might use different metaspace/native than before; review {{-XX:MaxRAMPercentage}} and memory limit.

### Project management (lead perspective)
- A common library "BOM" verified on Java 21 for 40 services to use.
- Tracking table for status of each service by phase; each service has an owner and canary date.
- Clear rollback criteria: error increase > X%, p99 increase > Y% in 30 minutes, revert to old image (old JDK image must be ready).

### Common mistakes
1. **Combining Java 21 upgrade + Spring Boot 3 + GC change in one go**: incident cannot be isolated.
2. **Spreading {{--add-opens}} everywhere then forgetting**: technical debt, blocking future upgrades.
3. **Only unit testing**: changes in charset, locale, TLS only surface in integration tests and real data.

### One-minute oral answer
"I split the upgrade into two steps: first run the old JAR on JVM 21 to verify runtime, then compile with --release 21 and use new features. I inventory using jdeps and jdeprscan, check JVM flags, agents, and bytecode libraries like Lombok, Mockito, JaCoCo. Common breakage points are JAXB removal, strong encapsulation causing InaccessibleObjectException, old GC flags, and the default UTF-8 charset. I have a few low-risk services go first to create a 'playbook', canary each service, compare p99, GC, and memory, have clear rollback criteria, and do not combine it with the Spring Boot 3 upgrade."

> Senior tip: the most time-consuming part is usually **not the application code** but the toolchain: APM agents, build plugins, base images, operational scripts using old JVM flags. Inventory these first. In an upgrade of 30 services, over half the errors came from agents and JVM flags in Helm charts, not from Java code.`,
    follow: [
      'Do you think it is a good idea to enable virtual threads immediately after upgrading to Java 21?',
      'Why should {{--add-opens}} not be used as a long-term solution?',
      'How to choose between G1 and ZGC (generational) for low latency services?'
    ]
  },
  'scenario-069': {
    q: 'You are in charge of upgrading a Spring Boot 2.7 monolith (Hibernate 5, Spring Security 5, Sleuth) to Spring Boot 3. The first build has over 800 compilation errors, and after fixing them, staging shows strange 404 errors, generated IDs are duplicated, and traces are lost. How do you plan the upgrade and handle each group of issues?',
    a: `**Summary:** Spring Boot 3 requires **Java 17+**, is based on **Spring Framework 6** and **Jakarta EE** (Java EE packages {{javax.*}} changed to {{jakarta.*}}), and comes with **Hibernate 6** and **Spring Security 6**. Most of the 800 compilation errors are namespace changes, which can be fixed with tools (OpenRewrite). The dangerous errors are **behavioral changes that do not cause compilation errors**: Spring MVC 6 removed trailing slash matching (causing 404s), Hibernate 6 changed ID/sequence generation, and Sleuth is no longer supported (replaced by Micrometer Tracing). Follow the roadmap: upgrade to latest 2.7 and resolve deprecations, run migration tools, fix behavior according to checklist, do regression testing, and canary.

### Quick Understanding
Like **changing license plates for the whole city**: most of the work is changing the plates ({{javax}} to {{jakarta}}), which machines can do. The dangerous part is that some **traffic laws also changed** without anyone notifying: old routes are no longer allowed (URL with trailing "/" no longer matched), and new vehicle numbering is different (sequence generation). Cars still run, but they run incorrectly.

### Technical Terms
- **Jakarta EE**: new name for Java EE after moving to Eclipse Foundation; from Jakarta EE 9, packages changed to {{jakarta.*}}.
- **OpenRewrite**: automatic refactoring tool based on "recipes", includes a recipe to upgrade to Spring Boot 3.
- **spring-boot-properties-migrator**: temporary dependency, when run, will report renamed properties.
- **Micrometer Tracing**: tracing layer of Boot 3, replacing Spring Cloud Sleuth.

### Roadmap
1. **Upgrade to latest Spring Boot 2.7.x**, fix all deprecated warnings (many APIs removed in 3.0 were marked deprecated in 2.x).
2. **Upgrade to Java 17/21** before or in parallel (Boot 3 requires Java 17+).
3. Run OpenRewrite recipe to upgrade to Boot 3 for namespace changes and common API changes.
4. Add {{spring-boot-properties-migrator}} temporarily to detect renamed properties; remove after fixing.
5. Handle third-party libraries still using {{javax}} (e.g., springfox must be replaced by springdoc-openapi version 2.x).
6. Regression testing, API contract testing, canary.

### Group 1: Compilation errors (easy, many)
- {{javax.persistence}}, {{javax.servlet}}, {{javax.validation}}, {{javax.annotation.PostConstruct}} changed to {{jakarta.*}}.
- **Trap**: do not blindly find-replace all {{javax.}}. JDK packages like {{javax.sql.DataSource}}, {{javax.crypto}}, {{javax.net.ssl}} **remain unchanged**.
- Spring Security 6: {{WebSecurityConfigurerAdapter}} was removed; switch to {{SecurityFilterChain}} bean, {{authorizeRequests}} to {{authorizeHttpRequests}}, {{antMatchers}} to {{requestMatchers}}.

~~~java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health/**").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
}
~~~

### Group 2: Behavioral errors (hard, few, dangerous)
| Symptom | Cause | How to fix |
|---|---|---|
| {{GET /orders/}} returns 404, worked before | Spring Framework 6 disabled trailing slash matching by default | fix client to call correct URL; or redirect/rewrite at gateway during transition |
| Insert primary key duplicate or missing sequence | Hibernate 6 changed default sequence naming strategy (separate sequence per entity instead of shared {{hibernate_sequence}}) | declare sequence explicitly on entity, or temporarily use {{hibernate.id.db_structure_naming_strategy=legacy}}; check {{allocationSize}} matches DB sequence INCREMENT |
| TraceId lost in logs, traces not connected between services | Sleuth not supported in Boot 3 | {{micrometer-tracing-bridge-otel}} or Brave bridge, reconfigure log pattern |
| HQL query fails at runtime | Hibernate 6 parser is stricter, some old syntax no longer accepted | test all repository/queries with real DB (Testcontainers) |
| Actuator endpoint renamed | {{httptrace}} to {{httpexchanges}} | update dashboard/scripts |

### Verification on staging
- API contract test: run recorded requests from production (with sensitive data masked) against old and new versions, compare status code and body.
- Schema check: enable {{spring.jpa.hibernate.ddl-auto=validate}} on staging to detect drift between entities and DB.
- Compare SQL count per request (Hibernate statistics) between versions: Hibernate 6 might generate different SQL.

### Risk management (lead perspective)
- Short-lived upgrade branch, rebase frequently; or split into modules to upgrade monolith module by module.
- Freeze major features in the last 1–2 sprints.
- Canary 5% traffic with comparison dashboard; rollback by old image (DB migration must be backward compatible with both versions).

### Common mistakes
1. **Blindly find-replace {{javax}}**: breaks {{javax.sql}}, {{javax.crypto}}.
2. **Only relying on successful compilation**: behavioral changes (URL, sequence, tracing) do not cause compilation errors.
3. **Jumping from Boot 2.3/2.4 to 3**: skipping deprecations of 2.5–2.7, resulting in a pile of errors.

### One-minute oral answer
"I divide the issues into two groups. Compilation group: change javax to jakarta, Spring Security 6 removed WebSecurityConfigurerAdapter; I use OpenRewrite and properties migrator after upgrading to the latest 2.7, being careful not to change JDK's javax packages. Behavioral group: dangerous new behaviors: Spring 6 disabled trailing slash match causing 404s, Hibernate 6 changed sequence naming causing ID duplication or errors, Sleuth must be replaced with Micrometer Tracing. I verify by replaying requests comparing both versions, validate ddl-auto, compare SQL counts, and then canary with clear rollback criteria."

> Senior tip: establish a **checklist of behavioral changes** from the official migration guide before writing any code, and assign a way to automatically verify each item. In one project, just replaying 50 thousand real requests into staging caught 3 404 endpoints due to the trailing "/" from an old mobile app, errors that unit tests would never have found.`,
    follow: [
      'How do you handle a shared internal library still depending on {{javax.servlet}}?',
      'How to make DB migration compatible with both Boot 2 and Boot 3 during canary?',
      'How does Hibernate 6 sequence strategy change affect {{allocationSize}}?'
    ]
  },
  'scenario-070': {
    q: 'After a backend release at 10 PM, the crash rate of Android app version 3.2 (accounting for 30% of users) increased from 0.1% to 18%. Cause: API renamed field {{fullName}} to {{name}} and added enum value {{PARTIALLY_SHIPPED}}. The mobile app cannot be "rolled back" like the backend. How do you handle the incident and design a process to not repeat it?',
    a: `**Summary:** handle incident first: **rollback or restore old field immediately** on the backend (this is the only side that can be changed quickly), confirm crash rate drops. Then establish an API evolution policy for uncontrolled clients: **change only by adding** (additive), keep old fields until the percentage of old app traffic is below a threshold (expand → migrate → contract), client should be **tolerant reader** (ignore unknown fields, unknown enums as UNKNOWN), versioning when forced to break, consumer-driven contract tests in CI, and a **minimum version/force update** mechanism for the app.

### Quick Understanding
Backend is like **a menu printing factory**, the app is like **diners who have printed instructions on how to read the menu in their pockets**. The backend can print a new menu every day, but customers with old instructions still come in for months and cannot be recalled. Changing dish names ({{fullName}} to {{name}}) or adding strange dish types makes those with old instructions "unable to read and faint" (crash).

### Technical Terms
- **Breaking change**: changes that make old clients misunderstand or fail: deleting/renaming fields, changing types, adding enums that clients parse strictly, changing meanings.
- **Tolerant reader**: client only reads what it needs, ignores unknown parts.
- **Expand–contract**: add new in parallel with the old, migrate clients gradually, and finally remove the old.
- **Consumer-driven contract test**: client describes the contract it needs (Pact, Spring Cloud Contract), backend CI checks it is not violated.

### Incident handling (first 60 minutes)
1. **Confirm correlation**: Crashlytics groups crashes by app version, stack trace {{JsonDataException: Required value 'fullName' missing}} and enum parsing error, starting from 10:02; API logs split by header {{User-Agent}}/{{X-App-Version}}.
2. **Fastest action**: rollback backend if the release did not include a breaking DB migration; if rollback is not possible, hotfix to return **both** {{fullName}} and {{name}}, and for client version ≤ 3.2, map {{PARTIALLY_SHIPPED}} to a value old clients understand ({{SHIPPING}}) based on version header.
3. **Confirm restoration**: crash rate of version 3.2 returns to baseline in 15–30 minutes.
4. Notify support/partners; write a postmortem without blame.

### Why it crashes
~~~text
New backend: { "name": "An", "status": "PARTIALLY_SHIPPED" }
App 3.2: data class Order(val fullName: String, val status: Status)  // non-null
  -> parser cannot find fullName  -> exception
  -> enum Status has no PARTIALLY_SHIPPED -> exception
  -> no error handling at parse layer -> order screen crash
~~~
In Java, Jackson default **fails** on unknown fields ({{FAIL_ON_UNKNOWN_PROPERTIES}} = true); Spring Boot turned this off for its ObjectMapper. But mobile apps use their own libraries and configurations, the backend must not assume the client is "forgiving".

### API evolution rules
| Change | Safe? | Correct way |
|---|---|---|
| Add new field (optional) | safe if client is tolerant | allow by default |
| Rename field | breaking | add new field, keep old until old app < threshold |
| Add enum value | breaking with strict client | client has UNKNOWN; server maps for old version based on version header |
| Change type (number to string) | breaking | new field with new name |
| Delete endpoint | breaking | header {{Deprecation}}/{{Sunset}}, measure traffic, then remove |

Client-side (Jackson for Java/Kotlin):
~~~java
enum Status { CREATED, SHIPPING, DELIVERED, @JsonEnumDefaultValue UNKNOWN }
// ObjectMapper: enable READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE,
// disable FAIL_ON_UNKNOWN_PROPERTIES -> unknown fields are ignored, unknown enums become UNKNOWN
~~~

### Prevention process (lead perspective)
- **Contract test** for every app version still having > 1% traffic, running in backend CI; PR violating contract is blocked.
- **Version telemetry**: dashboard of % requests by app version; rules to remove old fields only when the version using it is < 1–2%.
- **Minimum version**: configuration endpoint for the app to know "minimum supported version" to show force update screen (use for security or last resort cases).
- **Versioning**: when breaking change is mandatory, open {{/v2}} (or version by header/media type) running in parallel; have BFF for mobile if there are many different apps.
- **Backend release by feature flag** and canary by app version.

### Common mistakes
1. **Assuming "the new app version is out" is enough**: update rate usually takes weeks, some users never update.
2. **Contract test only for latest app version**: the old version is the one that breaks.
3. **Using force update to fix backend bugs**: punishing users for our own mistakes, affecting store ratings.

### One-minute oral answer
"First priority is stopping the bleeding: backend is the only side I can change quickly, so I rollback or hotfix to return both old and new fields, map the new enum to an old value for version 3.2 based on the version header, and then track crash rate on Crashlytics back to baseline. Then I set API evolution rules: change only additive, expand-contract with traffic threshold by version, client tolerant reader with UNKNOWN enum, contract tests for every version still having significant traffic, versioning when forced to break, and a minimum version mechanism for special cases."

> Senior tip: for APIs serving mobile, treat every released app version as **a separate customer that never disappears**. I require every response to be mappable by client version from the start (mandatory version header), because it turns a "must wait 2 days for store approval" incident into a 15-minute hotfix on the server.`,
    follow: [
      'Compare versioning via URL, header, and media type: which do you choose for mobile?',
      'How do consumer-driven contract tests work between the mobile team and the backend team?',
      'When do you accept using force update?'
    ]
  },
  'scenario-071': {
    q: 'After upgrading to Java 21 and enabling {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+), the order service is not faster but occasionally **hangs completely** for tens of seconds under load; HikariCP reports connection acquisition timeout. How do you diagnose and decide?',
    a: `**Summary:** virtual threads make **waiting for I/O cheap** but do not make DB faster: thousands of virtual threads fighting for a pool of 20 Hikari connections causes timeout. On Java 21, virtual threads blocking inside {{synchronized}} will **pin** the carrier thread; when all carriers (equal to the number of cores) are pinned, all other virtual threads stand waiting, so the service "hangs". Diagnose with JSON thread dump ({{jcmd <pid> Thread.dump_to_file -format=json}}), JFR event {{jdk.VirtualThreadPinned}}, and pool metrics; fix by limiting concurrency according to resources behind, replacing {{synchronized}} around I/O with {{ReentrantLock}}, upgrading libraries, or upgrading to JDK 24+ (JEP 491 removes most pinning due to synchronized).

### Quick Understanding
Platform threads are like **hiring a dedicated waiter for each customer** (expensive, limited). Virtual threads are **numbered tickets**: very cheap, issue thousands of them, a few waiters (carriers) take turns serving whoever is ready. But the kitchen only has 20 stoves (DB connections), issuing more tickets does not cook faster. And if a waiter **locks the kitchen door and sits waiting** for a dish (synchronized + I/O), that waiter serves no one else; enough waiters doing this means the whole restaurant stands still.

### Technical Terms
- **Carrier thread**: platform thread in ForkJoinPool that the JVM attaches a virtual thread to in order to run; default number of carriers equals the number of cores.
- **Unmount**: when a virtual thread blocks on I/O, JVM detaches it from the carrier so the carrier can run other work.
- **Pinning**: virtual thread cannot unmount (Java 21: currently in {{synchronized}} or native frame), so it blocks the carrier.
- **Backpressure**: limiting the number of concurrent tasks based on the capacity of resources behind.

### Symptoms and metrics
- Before: Tomcat 200 platform threads, p99 180ms. After: p99 250ms, occasionally 30 seconds with no response, then recovers.
- {{hikaricp_connections_pending}} jumps to 3,000; "Connection is not available, request timed out after 30000ms".
- Pod is 4 cores so only 4 carrier threads.

### Hypotheses and verification
1. **DB pool is the bottleneck, not threads.** Before, 200 threads limited requests to DB; now that limit is gone. Verification: pending connections increase proportional to concurrent requests.
2. **Pinning causes hanging.** Run JFR ({{jcmd <pid> JFR.start duration=60s filename=pin.jfr}}) then {{jfr print --events jdk.VirtualThreadPinned pin.jfr}}: see pin stack trace in a {{synchronized}} method calling HTTP/JDBC. On Java 21, can also use {{-Djdk.tracePinnedThreads=full}} to print stack when pinned (this option was removed in JDK 24).
3. **Thread dump**: {{jcmd <pid> Thread.dump_to_file -format=json /tmp/td.json}} lists virtual threads; see thousands of virtual threads waiting for connections and 4 carriers all stuck in the same synchronized block.

### Hanging mechanism step-by-step
~~~text
4 carriers: C1..C4
VT-a enters synchronized(cache) -> calls DB -> waits for connection (pool exhausted)
   Java 21: VT-a is PINNED, C1 is held tightly
VT-b, VT-c, VT-d do the same -> C2, C3, C4 are held
VT holding connection wants to return it, but needs carrier to continue -> no carrier left
=> whole service stands still until 30s timeout releases
~~~

### Fix
~~~java
// Before: synchronized surrounding I/O -> pinning on Java 21
// After: ReentrantLock allows virtual thread to unmount when waiting
private final ReentrantLock lock = new ReentrantLock();
public Price refresh(String sku) {
    lock.lock();
    try {
        return priceClient.fetch(sku);       // I/O while holding lock: best to avoid completely
    } finally {
        lock.unlock();
    }
}

// Limit concurrency based on DB capacity, replacing the old "200 threads" limit
private final Semaphore dbPermits = new Semaphore(40);
~~~
- **Backpressure**: Semaphore or limit requests at the web/gateway layer, placed around scarce resources (DB pool, partner API).
- **Upgrade libraries**: many drivers/libraries replaced synchronized with locks to be virtual thread friendly; check release notes.
- **JDK 24+** (JEP 491): virtual threads are no longer pinned when blocking in synchronized; but Java 21 is a popular LTS so these steps are still needed.
- If workload is primarily CPU or DB is already the bottleneck, virtual threads **provide no benefit**; can turn off and keep platform threads.

### When are virtual threads worth using
| Workload | Benefit |
|---|---|
| Many I/Os, long waits, calling many slow APIs | high |
| Limited by small DB pool | low, needs backpressure |
| Heavy CPU computation | almost none |

### Common mistakes
1. **Enabling virtual threads then increasing Hikari pool to 500**: moves congestion to DB, might exceed {{max_connections}}.
2. **Using ThreadLocal to cache heavy objects** (e.g., large buffer per thread): with tens of thousands of virtual threads, memory usage spikes.
3. **Pooling virtual threads** (placing into a fixed pool): defeats the purpose; virtual threads are created anew for each task.

### One-minute oral answer
"Virtual threads make I/O waits cheap, but do not increase DB capacity. When removing Tomcat's 200 thread limit, thousands of requests fought for 20 connections causing Hikari timeouts. The total hang is pinning on Java 21: virtual threads blocking in synchronized hold the carrier, 4 carriers stuck means the whole service stops. I verify using JFR event VirtualThreadPinned and JSON thread dumps. I fix by adding a Semaphore to limit concurrency based on DB capacity, changing synchronized around I/O to ReentrantLock, upgrading libraries, and considering JDK 24 where JEP 491 removed most pinning."

> Senior tip: before enabling virtual threads for a service, I run load tests with JFR pinning events enabled and record the **true scarce resources** (DB pool, partner rate limit). Virtual threads remove the implicit limit that the old thread pool accidentally created, so you must add an explicit limit in the right place, otherwise you just move the incident from the app to the DB.`,
    follow: [
      'Why should you not place virtual threads into a fixed thread pool?',
      'How are ScopedValues different from ThreadLocal and why are they suitable for virtual threads?',
      'When do you keep platform threads instead of virtual threads?'
    ]
  },
  'scenario-072': {
    q: 'At 10 PM on a Saturday, requests to {{POST /api/auth/login}} increase from 50 to 3,000 requests/second, 98% return 401, CPU on auth pods reaches 95%, and real users cannot log in. The next morning, 40 customers report their phone numbers were changed. Each IP sent only a few requests. How do you handle it?',
    a: `**Summary:** this is **credential stuffing**: attackers try email/password pairs leaked from other sites, each account is tried only once, via tens of thousands of proxy IPs, so rate limiting by IP and locking after N failed attempts do not catch them. Handle in order: block at the edge (WAF rate-based + bot rule, challenge), limit based on aggregate signals (global fail rate, number of different usernames per IP/ASN, fingerprint), and simultaneously **save occupied accounts** (revoke sessions, force password reset, lock phone number changes), then long-term is MFA, checking for leaked passwords, and step-up when performing sensitive actions.

### Quick Understanding
Brute force is like a thief trying 10,000 keys on **one door**. Credential stuffing is a thief with a keychain labeled with the homeowner's name (leaked from a site hack), going to **every house to try exactly one key**. Because users reuse passwords, the success rate is usually around 0.1–2%: 1 million attempts can occupy thousands of accounts.

### Symptoms and verification
| Signal | Brute force | Credential stuffing |
|---|---|---|
| Number of different usernames | few | many, almost one per request |
| Number of attempts per user | many | 1–2 |
| Number of IPs | few | tens of thousands (residential proxies) |
| Success rate | near 0 | 0.1–2% |

Commands/metrics for verification:
- Count distinct usernames and distinct IPs in 10 minutes from login logs (remember to log **hash** of username, do not log password).
- Check User-Agent, ASN, country: bots usually use a few identical UAs, concentrated in a few hosting/proxy networks.
- Compare success rate from new IP, new device with baseline.

### Why CPU reaches 95%
Passwords are saved using bcrypt cost 10–12: each verification takes about 50–250ms of CPU (intentionally slow to resist cracking). 3,000 requests/second × 0.1 seconds = **300 cores**. The attack both occupies accounts and is a DoS. Therefore, must block **before** the password hashing step.

### Handling in the first hour
1. **Edge**: enable AWS WAF rate-based rule for the login path, managed rule Bot Control / Account Takeover Prevention if available, or challenge/CAPTCHA for all logins while under attack.
2. **Application**: block cheaply before bcrypt.
3. **Rescue victims**: filter successful logins during the attack window from suspicious IP/ASN, revoke session/refresh token, force password reset, temporarily lock phone number/email changes for 24 hours and send notification to customer.

~~~java
// Cheap check (Redis) runs BEFORE calling AuthenticationManager (bcrypt)
public void preCheck(String ip, String username) {
    long perIp = redis.opsForValue().increment("login:ip:" + ip);          // total attempts by IP
    redis.expire("login:ip:" + ip, Duration.ofMinutes(10));
    redis.opsForHyperLogLog().add("login:ipusers:" + ip, sha256(username)); // distinct users/IP
    long distinctUsers = redis.opsForHyperLogLog().size("login:ipusers:" + ip);
    if (perIp > 20 || distinctUsers > 5) {
        throw new ChallengeRequiredException(); // return 429 or request CAPTCHA, do not hash password
    }
}
~~~
- Set the same generic error message "Email or password incorrect" so as not to reveal which email exists.
- **Do not lock account hard after N failed attempts**: attackers can deliberately lock many real customers. Use soft lock with expiration or require a challenge.

### Long term
- **MFA** (prefer passkey/TOTP over SMS), at least mandatory for new devices.
- When registering/changing password, check if password is in a leaked list (e.g., Pwned Passwords API via k-anonymity: only send first 5 characters of SHA-1).
- **Step-up authentication** for sensitive actions: change phone number, email, add payment recipient.
- Dashboard: global fail rate, username/IP count, successful logins from new devices; alert when deviating from baseline.

### Common mistakes
1. Only rate limit by IP: bot rotates tens of thousands of IPs, each IP few requests.
2. Hard lock account: self-inflicted DoS for real customers.
3. Only block the attack but forget **customers already occupied**: real damage is there.
4. Log password or username in clear text in debug log when investigating.

### One-minute oral answer
"Each IP has a few requests but usernames almost never repeat, success rate is about 1%: that's credential stuffing not brute force. I block at the edge using WAF rate-based and bot rules, enable challenge for login, and in the app add a cheap check using Redis before bcrypt, because 3,000 requests/second of bcrypt was a self-inflicted DoS. In parallel I find suspicious successful logins, revoke sessions, force password reset, and lock phone number changes. Long-term is MFA, checking for leaked passwords, and step-up for sensitive actions."

> Senior tip: track **number of distinct usernames per IP, ASN, and device fingerprint**, not just request count. And always have a "switch" to enable challenge for all logins (feature flag or WAF rule ready in Count mode) to turn on in 1 minute when under attack, instead of writing code at 10 PM.`,
    follow: [
      'Why is hard locking an account after 5 failed attempts dangerous in this case?',
      'How to detect accounts already occupied after the attack has passed?',
      'How is step-up authentication different from MFA during login?'
    ]
  },
  'scenario-073': {
    q: 'Your "change avatar by URL" feature downloads images from a URL entered by the user. A pentester enters {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} and receives content containing the name of an IAM role of the server. Evaluate the severity and how to fix it.',
    a: `**Summary:** this is **SSRF (Server-Side Request Forgery)**: your server calls the URL on behalf of the attacker, from **inside** the network, so it reaches places the Internet cannot reach: cloud metadata, internal admin, Redis, actuator. Immediately: disable the feature or block with allowlist, enforce **IMDSv2**, and check CloudTrail to see if the role's credentials were used from outside. Correct fix: only allow {{https}}, resolve DNS then block all internal/link-local IPs, do not automatically follow redirects, limit size/time, and most importantly **block egress at the network level** (proxy with allowlist), because checks in code always have loopholes.

### Quick Understanding
You ask the building receptionist (server) to "get me a document at this address". The attacker gives the address "basement vault room". Outsiders cannot enter, but the receptionist has an access card.

### Why 169.254.169.254 is dangerous
That is EC2's Instance Metadata Service (link-local). With **IMDSv1**, a simple GET to {{/latest/meta-data/iam/security-credentials/<role>}} returns **temporary access keys** of the role. Attackers use those keys from their machine to read S3, DynamoDB... with the server's permissions. The pentester just saw the role name, but just adding the role name to the URL gets the key.

**IMDSv2** requires sending a PUT first to get a token then attaching the token in the header; image upload features usually only send GET and do not allow the attacker to set headers, so IMDSv2 blocks this common type of SSRF. Add hop limit = 1 so the container cannot reach metadata through an extra network hop (on EKS should use IRSA/EKS Pod Identity instead of node role).

### Verify severity
1. Check if instance is at {{HttpTokens=optional}} (IMDSv1 still on) or {{required}}.
2. CloudTrail: search for API calls using the role's credentials from an IP **not** of the instance. If found, consider it compromised: revoke role session, rotate every secret the role can read.
3. App logs: avatar URLs pointing to internal IPs, {{localhost}}, {{file:}}, strange ports (6379, 8080/actuator).

### Fix in code
~~~java
HttpClient client = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NEVER)   // redirect to internal IP is a common workaround
    .connectTimeout(Duration.ofSeconds(3))
    .build();

void validate(URI uri) throws UnknownHostException {
    if (!"https".equals(uri.getScheme())) throw new BadRequest("only https allowed");
    for (InetAddress ip : InetAddress.getAllByName(uri.getHost())) {   // check ALL IPs
        if (ip.isLoopbackAddress() || ip.isLinkLocalAddress() || ip.isSiteLocalAddress()
                || ip.isAnyLocalAddress() || ip.isMulticastAddress() || isUniqueLocalV6(ip)) {
            throw new BadRequest("address not allowed");
        }
    }
}
~~~
- Limit size read (e.g., 5 MB) and total time; try decoding into an image, do not return raw content to the user (blind SSRF is still dangerous but leaks less data).
- The blocking function must cover IPv6 (e.g., {{fc00::/7}} is not in {{isSiteLocalAddress}}), range {{100.64.0.0/10}} and strange IPv4 ({{http://2852039166}}, {{0x7f.1}}): use standard parser then check resolved IP, do not compare strings.

### Why code alone is not enough: DNS rebinding
The attacker controls the domain's DNS: first resolution for check returns public IP, second resolution during connection (a few ms later) returns {{169.254.169.254}}. Code check passed but connection still went inside. Sure-fire block: make all outgoing requests for this feature go through a dedicated **egress proxy** that only allows public IPs (or only allows a specific domain list), place the service in a subnet/NetworkPolicy with no route to internal network.

### Alternative better approaches
| Method | SSRF risk | Note |
|---|---|---|
| Server downloads from arbitrary URL | high | need all layers of blocking |
| Allowlist domain (only Gravatar, partner CDN) | low | enough for most needs |
| Client uploads straight to S3 via presigned URL | almost none | server does not call strange URL |

### Common mistakes
1. Blacklist string "169.254" or "localhost": bypassed by decimal IP, IPv6, domain pointing to internal IP.
2. Checking URL once but letting HTTP client follow redirects automatically.
3. Returning detailed errors ("connection refused port 6379"), turning blind SSRF into a port scanner.

### One-minute oral answer
"This is SSRF, high severity because on EC2 with IMDSv1, the next step is getting the role's access key. I disable the feature, enforce IMDSv2, set hop limit 1, then check CloudTrail to see if the role's credentials were used from a strange IP. About code, I only allow https, resolve DNS and block all internal, link-local, IPv6 local IPs, do not follow redirects, limit size and timeout. But because of DNS rebinding, I make every outgoing request go through an egress proxy with an allowlist, and if possible, change the design to upload via presigned URL."

> Senior tip: whenever you see a "URL input" feature (webhook, link import, link preview, PDF HTML render), treat it as an SSRF surface. I consolidate everything to **one** common HTTP client with built-in IP blocking, timeout, size limits, and egress proxy, so new devs don't rewrite it and forget a step.`,
    follow: [
      'How does IMDSv2 block SSRF, and in what case does it not block it?',
      'How does DNS rebinding work and why is checking IP in code not enough?',
      'How do you apply the above measures for webhooks registered by customers?'
    ]
  }
});
