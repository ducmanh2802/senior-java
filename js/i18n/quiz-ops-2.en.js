/*
 * English translation of js/data/quiz-ops.js — task T430. Format: js/core/i18n.js (content overlay).
 * ids: qz-aws-018 qz-aws-019 qz-aws-020 qz-aws-021 qz-aws-022 qz-security-009 qz-security-010 qz-security-011 qz-security-012 qz-security-013 qz-security-014 qz-security-015 qz-security-016 qz-security-017 qz-security-018 qz-security-019 qz-security-020 qz-security-021 qz-security-022 qz-primer-001 qz-primer-002 qz-primer-003
 */
App.i18n.content({
  'qz-aws-018': {
    q: 'A payment system needs cross-region DR with an RPO of a few seconds and an RTO under 15 minutes; leadership accepts higher cost but does not want to double it as with active-active. Which strategy fits best?',
    options: [
      'Backup & restore: copy daily RDS snapshots to another region',
      'Pilot light: copy only the AMIs to another region, no database replication yet',
      'Multi-region active-active with writes in both places',
      'Warm standby: the database replicates continuously (for example Aurora Global Database), the secondary region already runs a scaled-down version of the app, and during an incident you promote the DB and scale up'
    ],
    explain: `**Summary:** an RPO of a few seconds requires **continuous data replication**; an RTO under 15 minutes requires infrastructure that is **already running** so you only need to scale and shift traffic. That is warm standby.

| Strategy | RPO | RTO | Cost |
|---|---|---|---|
| Backup & restore | hours | hours | lowest |
| Pilot light | minutes (data replicated) | tens of minutes–hours | low |
| Warm standby | seconds–minutes | minutes | medium |
| Multi-site active-active | near 0 | near 0 | highest |

Aurora Global Database replication lag is typically under 1 second; during an incident you can promote the secondary cluster within minutes.

### Why the other options are wrong
- **Daily backup & restore**: an RPO of up to 24 hours, and a restore takes hours.
- **Pilot light that only copies AMIs**: without database replication you cannot reach a seconds-level RPO; the correct definition of pilot light does replicate data, but compute has to be built up, so the RTO is longer.
- **Active-active**: exceeds the requirement and is indeed the most expensive and complex option (write conflicts, consistency).

> Senior tip: a DR plan that has never been rehearsed is not a DR plan. Schedule real failover game days, measure the actual RTO, and keep the DNS TTL (Route 53) low so traffic can move quickly.`
  },
  'qz-aws-019': {
    q: 'The DynamoDB table {{Orders}} has partition key {{orderId}}. You now need to fetch a customer\'s orders sorted by time. Which two statements are correct? (Choose 2)',
    options: [
      'Create a Global Secondary Index with partition key {{customerId}} and sort key {{createdAt}}, then Query the index',
      'Use Scan with FilterExpression {{customerId = :c}}; the filter reduces RCU because only matching items are counted',
      'Adding a Local Secondary Index to the existing table is the fastest way',
      'Reads from a GSI are only eventually consistent, so an order that was just created may not show up immediately',
      'A GSI supports strongly consistent reads if you set {{ConsistentRead=true}}'
    ],
    explain: `**Summary:** querying by an attribute that is not the key calls for designing a **GSI** around the access pattern. GSIs are updated asynchronously, so reads from a GSI are only eventually consistent.

~~~java
QueryRequest req = QueryRequest.builder()
    .tableName("Orders").indexName("customerId-createdAt-index")
    .keyConditionExpression("customerId = :c")
    .expressionAttributeValues(Map.of(":c", AttributeValue.fromS(cid)))
    .scanIndexForward(false)        // newest first
    .limit(20).build();
~~~

### Why the other options are wrong
- **Scan + FilterExpression saves RCU**: the filter is applied **after reading**; you pay for all the data that was scanned. On a large table that is both slow and expensive.
- **Adding an LSI to an existing table**: an LSI can only be created **when the table is created**, and it must share the table partition key ({{orderId}}), so it does not solve the customerId query.
- **Strongly consistent GSI**: DynamoDB rejects {{ConsistentRead=true}} on a GSI.

> Senior tip: watch the cardinality of the partition key in the GSI. A large B2B customer with millions of orders can create a hot partition on the index; in that case add a shard suffix or split by month. Remember that a GSI with insufficient capacity **throttles writes to the base table too**.`
  },
  'qz-aws-020': {
    q: 'The AWS bill spikes on "NAT Gateway – Data Processing". Analysis shows the services in private subnets read and write tens of TB with S3 every month. What is the most correct way to cut the cost?',
    options: [
      'Create an S3 Gateway VPC Endpoint and add it to the private subnet route table; S3 traffic then goes straight through the endpoint instead of NAT, and gateway endpoints are free',
      'Move the services to a public subnet and assign public IPs to get rid of NAT',
      'Use S3 Transfer Acceleration',
      'Compress the data with gzip; NAT charges per request, not per volume'
    ],
    explain: `**Summary:** NAT Gateway charges **per GB that passes through** (on top of the hourly fee). Traffic to S3 (and DynamoDB) can go through a **gateway endpoint** for free, you only add a route, no code changes.

### How it works
A gateway endpoint adds a route with the S3 prefix list to the route table. Traffic to S3 matches this more specific route instead of {{0.0.0.0/0 -> NAT}}. You can attach an endpoint policy that restricts which buckets are reachable.

### Why the other options are wrong
- **Move to a public subnet**: increases the attack surface and breaks the network architecture; unnecessary when a free endpoint exists.
- **Transfer Acceleration**: speeds up uploads from remote locations through edge locations, **costs extra**, and still goes through NAT.
- **NAT charges per request**: wrong, NAT charges per GB; compression helps a little but does not fix the root cause.

> Senior tip: other services (ECR, CloudWatch Logs, SQS, Secrets Manager) need **interface endpoints** (PrivateLink), which charge per hour and per GB but are usually cheaper than NAT under heavy traffic. Pulling ECR images through NAT is another common leak; remember ECR also needs the S3 endpoint because layers live in S3.`
  },
  'qz-aws-021': {
    q: 'The {{OrderPlaced}} event must be sent to 3 services (email, inventory, analytics); every service must receive **all** events and process them at its own pace. Which design is correct?',
    options: [
      'One SQS queue that all 3 services poll',
      'An SNS topic with a dedicated SQS queue per service subscribed to it (fan-out), plus a DLQ for each queue',
      'One SQS queue with visibility timeout set to 0 so all 3 services see the message',
      'The producer calls all 3 services over HTTP synchronously within the same request'
    ],
    explain: `**Summary:** SQS is a **competing consumers** model: each message is processed by only one consumer. To let every service receive everything you need **pub/sub**: SNS fan-out into several SQS queues, each owned by one service.

~~~text
OrderService --> SNS topic order-events --> SQS email-q      --> Email service
                                       --> SQS inventory-q  --> Inventory service
                                       --> SQS analytics-q  --> Analytics service
~~~
A dedicated queue acts as a buffer: if analytics is slow or down, the other two services are unaffected; each queue has its own DLQ and retry policy.

### Why the other options are wrong
- **One queue, 3 services polling**: each message reaches only one service, and the other two miss it.
- **Visibility timeout 0**: the message is redelivered continuously, it still does not guarantee which service gets it, and the message is deleted as soon as one service deletes it.
- **Synchronous HTTP**: tight coupling; one slow or failing service breaks the order-placement request.

> Senior tip: use SNS subscription filter policies so each queue only receives the event types it needs. EventBridge is an equivalent choice with richer routing rules; Kafka/Kinesis fit when you need to replay history.`
  },
  'qz-aws-022': {
    q: 'The company uses AWS Organizations and wants to apply the guardrail "nobody may turn off CloudTrail" to every account. Regarding Service Control Policies (SCPs), which two statements are correct? (Choose 2)',
    options: [
      'An SCP only sets the maximum permissions; it does not grant permissions, so users still need an IAM policy that allows the action',
      'Attaching an Allow SCP for {{s3:*}} to an OU grants S3 permissions to every user in the accounts under that OU',
      'SCPs do not apply to the management account of the organization',
      'The root user of a member account is not affected by SCPs',
      'SCPs completely replace IAM policies in member accounts'
    ],
    explain: `**Summary:** an SCP is a **guardrail**: effective permission = the intersection of (what the SCP allows) and (what the IAM policy allows), minus any Deny. The management account is outside the scope of SCPs, so do not run workloads there.

~~~json
{ "Effect": "Deny",
  "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail"],
  "Resource": "*" }
~~~

### Why the other options are wrong
- **An Allow SCP for s3:* grants permissions**: SCPs never grant permissions; users still need an IAM policy.
- **The root user of a member account is unaffected**: wrong, SCPs restrict every principal in a member account including root (only the management account and service-linked roles are exceptions).
- **Replaces IAM policies**: both layers exist and are evaluated together.

> Senior tip: try an SCP on a sandbox OU first, because a broad Deny can break the whole company's deployment pipeline. Combine it with a CloudTrail organization trail so logging does not depend on each account.`
  },
  'qz-security-009': {
    q: 'A product detail page renders user comments with {{element.innerHTML = comment.text}}. One comment contains {{<img src=x onerror=...>}} and steals the viewer\'s data. What is the most correct fix?',
    options: [
      'Block the < > characters with client-side JavaScript in the comment form',
      'Switch the page to HTTPS',
      'Encode output for its context when rendering (use {{textContent}} or a template engine that escapes by default; if you need HTML, sanitize with an allowlist), plus Content-Security-Policy as a second line of defence',
      'Store comments as base64 in the database'
    ],
    explain: `**Summary:** this is **stored XSS**. The root cause is untrusted data being inserted into HTML as code. The fix is **context-aware output encoding** at the point of rendering; CSP limits the damage if something still slips through.

~~~text
el.textContent = comment.text;     // the browser treats it as text, it does not parse HTML
~~~
If you must allow some tags (bold, links), use a sanitizer with an allowlist (DOMPurify on the client, OWASP Java HTML Sanitizer on the server). A CSP such as {{script-src 'self'}} blocks inline scripts and foreign scripts.

### Why the other options are wrong
- **Blocking characters on the client**: an attacker calls the API directly and bypasses the form's JavaScript. Client-side validation is only UX.
- **HTTPS**: protects the transport and has nothing to do with the browser executing the payload.
- **Storing base64**: when read back it is still decoded and inserted into innerHTML, so the payload still runs.

> Senior tip: add the {{HttpOnly}} flag to the session cookie so XSS cannot read it, but remember XSS can still send requests on the user's behalf. Roll CSP out in {{Content-Security-Policy-Report-Only}} mode first to collect violations, then switch to enforcing.`
  },
  'qz-security-010': {
    q: 'Upgrading from Spring Boot 2.7 to 3.x, the security configuration class {{extends WebSecurityConfigurerAdapter}} no longer compiles. What is the correct way to write it with Spring Security 6?',
    options: [
      'Add the spring-security-legacy dependency to keep the old class',
      'Change it to {{extends WebSecurityConfigurer}} and keep the methods as they are',
      'Downgrade Spring Security to 5.x inside Spring Boot 3',
      'Declare a {{@Bean SecurityFilterChain}} that takes {{HttpSecurity}}, configure it with the lambda DSL ({{authorizeHttpRequests}}, {{requestMatchers}}) and {{return http.build()}}'
    ],
    explain: `**Summary:** {{WebSecurityConfigurerAdapter}} was deprecated in 5.7 and **removed in 6.0**. Configuration moves to a component style: declare a {{SecurityFilterChain}} bean.

~~~java
@Configuration
@EnableWebSecurity
class SecurityConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/actuator/health").permitAll()   // replaces antMatchers
          .requestMatchers("/admin/**").hasRole("ADMIN")
          .anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
  }
}
~~~
The accompanying changes: {{antMatchers/mvcMatchers}} becomes {{requestMatchers}}, {{authorizeRequests}} becomes {{authorizeHttpRequests}}, and the string-style {{and()}} chain has been deprecated since 6.1 so use the lambda DSL. AuthenticationManager is also declared as a bean.

### Why the other options are wrong
- **spring-security-legacy**: no such official artifact exists.
- **WebSecurityConfigurer**: a low-level interface with none of the convenient {{configure(HttpSecurity)}} methods of the adapter; not the recommended direction.
- **Downgrading to 5.x**: Spring Boot 3 requires Spring Security 6 (Jakarta EE) and is not compatible with 5.x.

> Senior tip: you can declare several {{SecurityFilterChain}} beans with different {{securityMatcher}} and {{@Order}} (for example JWT for the API, form login for admin pages). Run the OpenRewrite migrate recipe to save manual edits.`
  },
  'qz-security-011': {
    q: 'Regarding CORS in a Spring Boot API called by an SPA on another domain, which two statements are correct? (Choose 2)',
    options: [
      'CORS is enforced by the browser; it does not protect the API from curl, Postman or another server, so the API must still authenticate and authorize',
      'A correct CORS configuration prevents every CSRF attack',
      'Spring refuses a configuration that combines {{allowedOrigins("*")}} with {{allowCredentials(true)}}; if you need multiple origins with credentials, list them explicitly or use {{allowedOriginPatterns}} carefully',
      'Echoing back the Origin header of every request together with {{Access-Control-Allow-Credentials: true}} is safe',
      'Once CORS is configured, the API no longer needs authentication'
    ],
    explain: `**Summary:** CORS is the mechanism that **relaxes** the Same-Origin Policy enforced by the **browser**: the server tells the browser which origins may **read** the response. It is not an authentication mechanism.

### How it works
- A "non-simple" request (for example one with an Authorization header or a JSON Content-Type) triggers an {{OPTIONS}} preflight; the browser only sends the real request if the preflight response allows it.
- With credentials (cookies), the spec forbids {{Access-Control-Allow-Origin: *}}; Spring detects this and throws {{IllegalArgumentException}} for that combination.

### Why the other options are wrong
- **Prevents every CSRF attack**: a simple (urlencoded) form POST is still sent with cookies; CORS only blocks **reading** the response. CSRF defence needs tokens, SameSite cookies and Origin checks.
- **Echoing Origin + credentials**: equivalent to letting any website read a logged-in user's data, a classic vulnerability.
- **No authentication needed**: if the attacker does not use a browser, CORS has no effect at all.

> Senior tip: configure CORS in one place (the gateway, or Spring Security {{http.cors()}} with a {{CorsConfigurationSource}}); configuring it both at the gateway and in the app creates duplicate headers that the browser rejects.`
  },
  'qz-security-012': {
    q: 'A "link preview" feature lets users enter a URL and a Spring Boot server on EC2 downloads that page. A pentester enters {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} and gets the credentials. Which measure is the most correct and complete?',
    options: [
      'Combined: allow only http/https, resolve DNS and then block internal/link-local/loopback IPs (re-check after every redirect or disable redirects), send egress through a proxy with an allowlist, and require IMDSv2 with hop limit 1',
      'Check the URL string and block it if it contains "169.254"',
      'Allow only URLs that start with https',
      'Set a 2 second timeout on the HTTP client'
    ],
    explain: `**Summary:** this is **SSRF**: the server is tricked into sending requests to an internal target. Defence needs multiple layers: check the **IP after resolution**, control egress at the network layer, and reduce the value of the target (IMDSv2).

### Why string checks are not enough
The same destination can be written many ways: {{http://2852039166/}} (decimal), {{http://[::ffff:169.254.169.254]/}}, a domain that resolves to 169.254.169.254, or a legitimate URL that returns a 302 redirect to an internal IP. Then there is DNS rebinding: the check resolves to a public IP, the download re-resolves to an internal IP, so you must connect to exactly the IP you validated.

### IMDSv2
It requires fetching a token with {{PUT}} and a dedicated header; ordinary SSRF can only issue GET. Hop limit 1 means a container one network hop away cannot reach IMDS.

### Why the other options are wrong
- **Blocking the string "169.254"**: bypassed with the other notations or a redirect, as shown above.
- **HTTPS only**: an attacker uses their own domain with HTTPS and then redirects, or targets an internal service that speaks HTTPS.
- **2 second timeout**: the metadata service answers in milliseconds.

> Senior tip: run the URL-fetch feature in a separate service, in a subnet whose only egress to the internet goes through a proxy, with no broadly privileged IAM role. Cap the response size and content-type so it cannot be used as a tool for downloading huge files.`
  },
  'qz-security-013': {
    q: 'A mobile app and an SPA need to sign in through an OAuth2/OIDC authorization server (Keycloak). Which flow is recommended today?',
    options: [
      'Implicit flow because a public client cannot keep a secret',
      'Authorization Code + PKCE, with the client as a public client that has no client secret',
      'Resource Owner Password Credentials: the app collects the username/password and sends them to the token endpoint',
      'Client Credentials with a client secret embedded in the app'
    ],
    explain: `**Summary:** the OAuth 2.0 Security Best Current Practice (RFC 9700) recommends **Authorization Code + PKCE** for all clients, especially public clients; Implicit and the Password grant should no longer be used.

### How PKCE works
1. The app creates a random {{code_verifier}} and sends {{code_challenge = BASE64URL(SHA256(verifier))}} in the authorize request.
2. The server returns an authorization code via redirect.
3. The app exchanges the code for tokens, sending the {{code_verifier}}; the server hashes it again and compares.
An attacker who intercepts the code (a malicious app registering the same custom scheme) has no verifier, so it cannot exchange it for tokens.

### Why the other options are wrong
- **Implicit**: the token is returned directly in the URL fragment, easily leaked via history/referrer, and there is no way to bind it to the client; it is recommended against.
- **Password grant**: the app sees the user's password, and it does not properly support MFA/SSO; it was removed from OAuth 2.1.
- **Client Credentials + secret in the app**: meant for machine-to-machine with no user; a secret embedded in an app leaks as soon as the app is decompiled.

> Senior tip: for SPAs many teams use the **BFF** pattern: the backend acts as a confidential client and holds the tokens, so the browser only has an HttpOnly session cookie. That way the token never lives in JavaScript.`
  },
  'qz-security-014': {
    q: 'The access token lives 10 minutes and the refresh token lives 30 days. You worry the refresh token could be stolen from the user\'s device. Which mechanism reduces the risk most effectively?',
    options: [
      'Extend the access token to 30 days so no refresh token is needed',
      'Encrypt the refresh token with base64 before returning it to the client',
      'Refresh token rotation: each use issues a new refresh token and invalidates the old one; if an already-used token is presented again, revoke the whole chain (token family) and force a new sign-in',
      'Store the refresh token in localStorage for easier management'
    ],
    explain: `**Summary:** **rotation + reuse detection** turns a theft into something detectable: the thief and the real user will use the same token, the second use exposes it, and the server revokes the whole family.

### Scenario
~~~text
User uses RT1 -> receives RT2 (RT1 no longer valid)
Thief uses RT1 (stolen earlier) -> server sees RT1 was already used -> revokes RT2 and the whole family
=> both must sign in again; the thief loses access
~~~
The server needs to store refresh-token state (a table with family id, used flag, expiry). You can add an absolute lifetime for the family and bind tokens to the device (DPoP/mTLS sender-constrained tokens).

### Why the other options are wrong
- **30-day access token**: a JWT is hard to revoke; if leaked, the thief can use it for a month, which is even worse.
- **base64**: that is not encryption; anyone can decode it.
- **localStorage**: any XSS can read it; it is the least safe place to store it.

> Senior tip: handle the legitimate race (two tabs refreshing within a few hundred ms) with a short grace period for the token that was just replaced, otherwise you will keep kicking users out. Log and alert on reuse events, because they are usually a sign of a real attack.`
  },
  'qz-security-015': {
    q: 'A critical CVE (CVSS 10) is published in a logging library that the project uses indirectly through another dependency. You have 40 microservices. What is the most correct approach?',
    options: [
      'Wait for the parent library to release a new version, then upgrade',
      'Only upgrade the services that have direct internet access',
      'Put a WAF rule in place to block the payload and call it done',
      'Use an SBOM/SCA tool to find every service that contains the library (including transitive copies), override the patched version via dependencyManagement or a BOM, apply temporary mitigations if you cannot patch in time, and add scanning to CI'
    ],
    explain: `**Summary:** first you must **know what you use and where** (SBOM), then patch fast by forcing the transitive version, add temporary mitigations, and let CI prevent a recurrence. This is the "Vulnerable and Outdated Components" risk in the OWASP Top 10.

~~~text
mvn dependency:tree -Dincludes=org.apache.logging.log4j
# override the transitive version in the parent pom
<dependencyManagement> ... patched log4j-bom version ... </dependencyManagement>
~~~
Tools: OWASP Dependency-Check, Dependabot/Renovate, Trivy/Grype scan the whole image too (libraries can live in the base image, not only in the jar).

### Why the other options are wrong
- **Wait for the parent library**: that can take weeks; meanwhile the exploit is already public.
- **Only public services**: the payload can travel through an internal service's logs (headers, message queues) and be processed there.
- **WAF only**: the payload has countless variants that slip past signatures; a WAF is a temporary mitigation, not a substitute for patching.

> Senior tip: keep an SBOM (CycloneDX/SPDX) for every build so next time you can answer "are we affected" in minutes instead of days. Define patch SLAs by severity (for example critical within 48 hours).`
  },
  'qz-security-016': {
    q: 'An API accepts JSON and uses Jackson with default typing enabled for every {{Object}} to preserve type information (the JSON carries an {{@class}} field). What is the biggest risk, and how do you fix it?',
    options: [
      'An attacker names an arbitrary class in {{@class}} to trigger a gadget chain leading to RCE; disable default typing, use concrete-typed DTOs, or {{@JsonTypeInfo}} with logical type names plus an allowlist PolymorphicTypeValidator',
      'Large JSON wastes memory; you only need to limit the request size',
      'There is no risk because Jackson only creates objects of classes inside the application package',
      'The risk is leaking class names; just rename the package to something hard to guess'
    ],
    explain: `**Summary:** polymorphic deserialization with a type **chosen by the client** is insecure deserialization: Jackson instantiates the class that is named and calls its setters/constructor; some classes on the classpath (gadgets) have dangerous side effects such as a JNDI lookup, leading to RCE. Many jackson-databind CVEs are of this kind.

### How to fix
~~~java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")  // logical name, not a class name
@JsonSubTypes({
  @JsonSubTypes.Type(value = CardPayment.class, name = "card"),
  @JsonSubTypes.Type(value = BankPayment.class, name = "bank") })
sealed interface Payment permits CardPayment, BankPayment {}
~~~
If you are forced to use default typing (for example for a cache), use {{activateDefaultTyping}} with a {{BasicPolymorphicTypeValidator}} that only allows your own packages.

### Why the other options are wrong
- **Just memory**: a size limit does not stop a small payload that names a gadget class.
- **Only classes in the application package**: with default typing and no validator, every class on the classpath (libraries included) is a candidate.
- **Renaming the package**: security through obscurity; the gadget lives in a third-party library and does not depend on your package name.

> Senior tip: configuring Spring's Redis cache with {{GenericJackson2JsonRedisSerializer}} also writes type information; make sure only trusted data is written to the cache and keep jackson-databind on the latest version.`
  },
  'qz-security-017': {
    q: 'You are the tech lead of a multi-tenant SaaS that shares one PostgreSQL database (column {{tenant_id}}). An audit finds several endpoints that take tenantId from a query parameter. What is the most correct way to isolate tenants?',
    options: [
      'Add a tenantId check in the frontend before calling the API',
      'Take the tenant from the authenticated token on the server and enforce it automatically at the data layer (Hibernate {{@TenantId}}/filters or PostgreSQL Row-Level Security), plus automated tests for cross-tenant access',
      'Encrypt tenantId in the URL so users cannot modify it',
      'Ask every developer to remember to add {{WHERE tenant_id = ?}} during code review'
    ],
    explain: `**Summary:** the tenant must come from the **authenticated identity** (a claim in the token/session), never from client input; and the filtering must be **the default at the data layer**, so a query that forgets the condition still does not leak data.

### Two layers of protection
- **Application**: Hibernate 6 supports {{@TenantId}} for discriminator-based multitenancy; it adds the tenant condition to queries automatically and sets the value on insert, with a {{CurrentTenantIdentifierResolver}} reading from the SecurityContext.
- **Database**: PostgreSQL RLS
~~~sql
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON invoice
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- per transaction: SET LOCAL app.tenant_id = '...'
~~~
Note: table owners and superusers bypass RLS by default; the app should use a dedicated role (or FORCE ROW LEVEL SECURITY).

### Why the other options are wrong
- **Checking in the frontend**: an attacker calls the API directly.
- **Encrypting tenantId in the URL**: it is still client input; it can be replayed across resources, and it still does not verify that the user belongs to that tenant.
- **Relying on code review**: humans will forget; one native query or one new report is enough to leak.

> Senior tip: write an integration test "tenant A never sees tenant B's data" that runs against every endpoint through automatic generation; this is the SaaS bug with the heaviest legal consequences. Remember that cache keys and S3 file names must also include the tenant.`
  },
  'qz-security-018': {
    q: 'The login page is under credential stuffing: thousands of IPs try email/password pairs leaked from other sites. Which two measures are effective and harmless to real users? (Choose 2)',
    options: [
      'Lock the account permanently after 3 failed logins',
      'Rate limiting/backoff that increases per both account and IP/fingerprint, plus CAPTCHA or bot detection when anomalies are detected',
      'Show different messages for "email does not exist" and "wrong password" so users understand better',
      'Enable MFA (prefer passkey/TOTP) and check passwords against breached-password lists at sign-up/password change',
      'Switch to storing passwords with SHA-256 for faster verification'
    ],
    explain: `**Summary:** credential stuffing uses **correct** passwords leaked elsewhere, so rate limiting slows the attack down, while **MFA** makes a correct password insufficient. Breached-password checks stop users from reusing that password.

### Why the other options are wrong
- **Permanent lock after 3 failures**: an attacker can deliberately lock accounts in bulk (a denial of service against real users); use temporary/exponential lockouts instead.
- **Different messages**: enables **user enumeration**, helping attackers filter the list down to valid emails. Use a generic "Email or password is incorrect".
- **SHA-256**: a fast hash is a weakness when the DB leaks (GPU brute force); use bcrypt/Argon2id. And it has nothing to do with blocking stuffing.

### Implementation hints
Count failures under several keys (email, IP, ASN, device fingerprint) in Redis with a TTL; WAF/bot management at the edge blocks some of the automated traffic before it reaches the app.

> Senior tip: track the failed-login ratio over time; credential stuffing usually shows up as a spike in failures across many different emails. Notify users when a login comes from an unfamiliar device.`
  },
  'qz-security-019': {
    q: 'A stateless Spring Boot API where the client sends a JWT in the {{Authorization: Bearer}} header and no cookies are used. A colleague asks whether CSRF protection should be kept. What is the most correct answer?',
    options: [
      'CSRF must always be enabled for every API, otherwise you will be attacked',
      'CSRF only applies to GET requests, so it is irrelevant',
      'You can disable CSRF: the browser does not attach the Authorization header to requests from another site; but if you move the token into a cookie you must enable it again (or use SameSite + a CSRF token)',
      'Disabling CSRF stops the JWT signature from being verified'
    ],
    explain: `**Summary:** CSRF exploits the fact that the **browser sends credentials automatically** (cookies, remembered HTTP Basic) with a request triggered by another site. The Authorization header is set by the app's own JavaScript, which another site cannot do, so a pure bearer-token API is not exposed to CSRF.

~~~java
http.csrf(csrf -> csrf.disable())                         // only when authentication does NOT rely on cookies
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
~~~

### Why the other options are wrong
- **Always enable it**: Spring Security enables CSRF by default because many apps use session cookies; with a pure bearer token it adds no protection.
- **Only applies to GET**: the opposite; CSRF targets **state-changing** requests (POST/PUT/DELETE); Spring skips GET/HEAD/OPTIONS because they are not allowed to modify data.
- **Disabling CSRF breaks JWT verification**: the two mechanisms are independent; the JWT authentication filter still runs normally.

> Senior tip: when you move to a BFF (token on the server, session cookie in the browser), remember to **re-enable** CSRF, use {{CookieCsrfTokenRepository}} for the SPA, and set the cookie to {{SameSite=Lax}} or Strict.`
  },
  'qz-security-020': {
    q: `After an incident you find that the centralised log (ELK) contains raw {{Authorization}} headers, card numbers and customers' national ID numbers, and the whole dev team can read them. What is the most correct response?`,
    options: [
      'Delete all the logs and turn request logging off to be safe',
      'Just encrypt the disks of the ELK cluster',
      'Move logging to DEBUG level so less is logged',
      'Revoke/rotate the exposed tokens, redact sensitive data right at the logging layer (mask headers, PII fields), restrict who can access logs and how long they are kept, and add automated checks that detect PII in logs'
    ],
    explain: `**Summary:** address **both the consequences and the root cause**: exposed credentials must be rotated; sensitive data must be masked **before** it is written to logs; access to logs is access to data, so it needs authorisation and retention rules.

### Concrete measures
- Logback: use a masking pattern or a custom encoder to mask fields such as {{authorization}}, {{cardNumber}}; with logstash-logback-encoder you can configure masking by field name/regex.
- Do not log raw request/response bodies; log ids and metadata instead of data.
- Delete/redact old records that already contain PII, and assess notification obligations under the relevant regulations (PCI DSS for card numbers, personal-data protection law).

### Why the other options are wrong
- **Delete everything, turn logging off**: you lose investigation and security monitoring, which is itself an OWASP Top 10 category (logging and monitoring failures).
- **Disk encryption**: only protects against physical disk theft; anyone with read access to ELK still sees plain text.
- **DEBUG to log less**: DEBUG is a **more verbose** level, so it logs more.

> Senior tip: add a test that the log output of sensitive endpoints does not contain token-like or PAN-like strings, and run a PII scanner on the log pipeline. Logs are the most common but least noticed place data leaks.`
  },
  'qz-security-021': {
    q: `The service has {{@PreAuthorize("hasRole('ADMIN')")}} on the {{deleteUser()}} method. Inside the same class, the {{cleanup()}} method (no annotation) calls {{this.deleteUser()}}, and a regular user can call {{cleanup()}} and delete users. Why?`,
    options: [
      'Method security is based on a Spring AOP proxy; an internal call through {{this}} does not go through the proxy, so the annotation is never checked',
      'It is missing {{@Transactional}}, so Spring Security skips it',
      'hasRole adds a prefix automatically, so ADMIN must be written as ROLE_ROLE_ADMIN',
      '@PreAuthorize only works on controllers, not on services'
    ],
    explain: `**Summary:** the same trap as {{@Transactional}}: method security is implemented by a **proxy** wrapped around the bean. Calls from outside go through the proxy and are checked; calling {{this.deleteUser()}} internally is a direct call on the real object and bypasses the interceptor.

~~~text
Controller --> [Proxy: checks @PreAuthorize] --> UserService.cleanup()
                                                     --> this.deleteUser()   (does NOT go through the proxy)
~~~

### How to fix
- Put the permission check on **every public entry-point method** ({{cleanup()}} needs an annotation too), or at class level.
- Move {{deleteUser}} into another bean so the call goes through a proxy.
- Spring Security 6 uses {{@EnableMethodSecurity}} (replacing the old {{@EnableGlobalMethodSecurity}}); without that annotation {{@PreAuthorize}} is ignored entirely.

### Why the other options are wrong
- **Missing @Transactional**: the two mechanisms are independent; transactions do not affect permission checks.
- **ROLE_ROLE_ADMIN**: {{hasRole('ADMIN')}} adds the {{ROLE_}} prefix automatically to compare with the authority {{ROLE_ADMIN}}; adding ROLE_ yourself is wrong in the other direction.
- **Only on controllers**: @PreAuthorize works on any proxied Spring bean, and putting it on the service is good practice.

> Senior tip: write authorisation tests at the service layer with {{@WithMockUser(roles = "USER")}} for every public method; self-invocation bugs only surface when a test calls that exact path.`
  },
  'qz-security-022': {
    q: 'You are hardening the GitHub Actions pipeline of a public repo against supply-chain attacks. Which two measures are correct? (Choose 2)',
    options: [
      'Pin third-party actions by full commit SHA instead of a tag like {{@v4}}',
      'Use the {{pull_request_target}} trigger to build PR code from forks, because it has access to secrets',
      'Declare minimal {{permissions}} for {{GITHUB_TOKEN}} at workflow/job level (for example only {{contents: read}}), and grant write only to the jobs that need it',
      'Use a fixed self-hosted runner for the public repo so builds are faster',
      'Print secrets to the log in base64 for debugging'
    ],
    explain: `**Summary:** reduce trust in third-party code (SHA pinning, immutability) and reduce default privilege (least privilege for {{GITHUB_TOKEN}}), so that a compromised step can do very little.

~~~yaml
permissions:
  contents: read
jobs:
  build:
    steps:
      - uses: actions/checkout@<full-40-char-sha>   # comment with the version name for readability
~~~
A tag can be moved to a malicious commit if the action's repository is taken over (this has actually happened to popular actions). Dependabot can still update SHA-pinned actions.

### Why the other options are wrong
- **pull_request_target running fork PR code**: the workflow runs in the base repo context with secrets and a write-capable token; checking out and building the PR code hands that power to strangers (the "pwn request" pattern).
- **Self-hosted runner for a public repo**: GitHub advises against it; a PR from a fork can run arbitrary code on your machine and leave processes/persistence behind for later jobs.
- **Printing secrets as base64**: GitHub only masks the literal value; base64 exposes the secret in the log.

> Senior tip: combine OIDC instead of long-lived secrets, required reviewers for the production environment, and CODEOWNERS for the {{.github/workflows}} directory so pipeline changes are always reviewed.`
  },
  'qz-primer-001': {
    q: 'You use {{docker exec}} to enter a running container, edit a configuration file, then {{docker rm}} the container and start a new one from the same image. Is the change still there?',
    options: [
      'Yes, because Docker saves changes back into the image automatically',
      'No: the change lives in the container\'s own writable layer; the image is immutable. Use a volume if you need to keep data; to change configuration, edit the Dockerfile or pass it via environment variables',
      'Yes, if the new container has the same name as the old one',
      'No, because Docker deletes the image too when it deletes the container'
    ],
    explain: `**Summary:** an **image** is like a read-only "mould"; a **container** is one run of that mould plus a thin writable layer. Deleting the container deletes the writable layer; a new container starts again from the clean image.

### Mental picture
~~~text
Old container:  [writable layer: edited file]  <- deleted with the container
                [image layers, read-only]
New container:  [empty writable layer]
                [image layers, read-only] (exactly as before)
~~~
- Data that must survive (database, uploads): use a **volume** ({{-v data:/var/lib/postgresql/data}}).
- Configuration: environment variables ({{-e SPRING_PROFILES_ACTIVE=prod}}) or a mounted config file.

### Why the other options are wrong
- **Saved back into the image automatically**: Docker never modifies an image on its own. ({{docker commit}} creates a new image, but it is a manual step and should not replace a Dockerfile.)
- **Same name**: the name is only a label; a new container is still a new container.
- **Deletes the image too**: {{docker rm}} only deletes the container; deleting an image is {{docker rmi}}.

> Senior tip: treat containers as disposable (immutable infrastructure). Every change must go through the Dockerfile/config in Git, so all environments are identical and reproducible.`
  },
  'qz-primer-002': {
    q: 'In Kubernetes you have a Deployment with {{replicas: 3}} and you manually delete a Pod with {{kubectl delete pod}}. What happens, and why should other services call through a Service rather than the Pod IP?',
    options: [
      'The Pod is gone for good; the Deployment is left with 2 Pods until the next deploy',
      'Kubernetes restarts that exact Pod with the same IP',
      'The Deployment (through its ReplicaSet) sees only 2 Pods and creates a new one with a new name and IP; the Service keeps a stable address and points at the ready Pods by itself',
      'The whole Deployment is deleted with it because the Pod is part of it'
    ],
    explain: `**Summary:** Kubernetes works on **desired state**: you declare "I want 3 Pods", and the controller keeps comparing reality with that and correcting it. Pods are disposable, so their IPs are not stable.

### Step by step
1. You delete the Pod {{orders-7d9f-abc}}.
2. The ReplicaSet controller sees 2/3 Pods and creates a new Pod {{orders-7d9f-xyz}} with a different IP.
3. The Service {{orders}} (a stable DNS name, for example {{orders.default.svc.cluster.local}}) updates its list of target Pods by label, so callers do not need to know anything.

### Why the other options are wrong
- **Only 2 Pods left**: that is exactly what the Deployment prevents; it always drives the Pod count back to the configured replicas.
- **Restart the same Pod with the same IP**: a deleted Pod is gone; a new Pod has a new name and a new IP. (Restarting the container inside the same Pod when the app dies is different, that is the kubelet's job.)
- **The whole Deployment is deleted**: the ownership chain is Deployment owns ReplicaSet, ReplicaSet owns Pods; deleting a child does not delete the parent.

> Senior tip: to restart all Pods safely, use {{kubectl rollout restart deployment/orders}} instead of deleting Pods one by one; it replaces them gradually according to the rolling update strategy.`
  },
  'qz-primer-003': {
    q: 'The Kafka topic {{orders}} has 3 partitions. You run 5 instances of the same service, all using {{group.id=order-processor}}. What happens?',
    options: [
      'Every message is processed by all 5 instances',
      'Kafka automatically increases the number of partitions to 5',
      'Messages are spread evenly across the 5 instances in round-robin fashion',
      'Each partition is assigned to only one consumer in the group, so 3 instances get one partition each and the other 2 instances sit idle'
    ],
    explain: `**Summary:** within one consumer group, **a partition is read by only one consumer** at a time (to preserve ordering inside the partition). Therefore the useful number of consumers is capped at the number of partitions.

~~~text
partition 0 -> instance A
partition 1 -> instance B
partition 2 -> instance C
instance D, E: no partition (standby, they take over if A/B/C die and a rebalance happens)
~~~

### Why the other options are wrong
- **All 5 process every message**: that is the behaviour when each instance has a **different group.id** (each group receives every message). Within one group, work is split.
- **Partitions increase automatically**: Kafka does not add partitions by itself; increasing them is a manual operation and it changes how keys are distributed.
- **Round-robin across 5 instances**: Kafka splits by partition, not per message.

> Senior tip: pick the partition count from the target throughput and the maximum number of consumers you expect (usually with headroom, for example 12 or 24). If processing is slow, adding consumers only helps while there are partitions that nobody is reading.`
  }
});
