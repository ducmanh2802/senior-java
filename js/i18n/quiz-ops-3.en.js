/*
 * English translation of js/data/quiz-ops.js — task T431. Format: js/core/i18n.js (content overlay).
 * ids: qz-primer-004 qz-primer-005 qz-primer-006 qz-primer-007 qz-primer-008 qz-primer-009 qz-primer-010
 */
App.i18n.content({
  'qz-primer-004': {
    q: 'You want to see what a teammate has pushed to the remote but **do not** want to touch the code you still have in progress on the current branch. Which command fits?',
    options: [
      '{{git fetch}}: downloads new commits into the remote-tracking branches (such as {{origin/main}}) without touching the current branch or your files; then inspect with {{git log HEAD..origin/main}}',
      '{{git pull}}, because pull only downloads and changes nothing',
      '{{git push}} to sync in both directions',
      '{{git clone}} the repo again into the current directory'
    ],
    explain: `**Summary:** {{git pull}} = {{git fetch}} + {{git merge}} (or rebase if configured). If you only want to **look** without merging into your branch, use {{git fetch}}.

~~~bash
git fetch origin
git log --oneline HEAD..origin/main   # commits that exist on the remote but not locally yet
git diff HEAD...origin/main           # see what actually changed
git merge origin/main                 # once you are ready to merge
~~~

### Why the other options are wrong
- **git pull only downloads**: pull also merges/rebases straight into the current branch and can cause conflicts while you are in the middle of your work.
- **git push**: pushes your commits to the remote, the opposite direction of what you need; Git has no automatic two-way sync.
- **git clone again**: creates a new copy, cannot be used inside a directory that is already a repo, and is completely unnecessary.

> Senior tip: set {{git config --global pull.rebase true}} (or {{pull.ff only}}) to avoid noisy merge commits like "Merge branch main of ...". The habit of fetching first and deciding on the merge afterwards keeps you in control when working in a team.`
  },
  'qz-primer-005': {
    q: 'When designing a REST API, which two uses of HTTP status codes are correct? (Choose 2)',
    options: [
      '401 Unauthorized: the request was not authenticated (missing token, or an invalid/expired token)',
      '404 Not Found when the user types the wrong password',
      '403 Forbidden: we know who the caller is, but they are not allowed to perform this action',
      '500 Internal Server Error when the client omits a required field',
      '200 OK with a body {{"error": "not found"}} for every error'
    ],
    explain: `**Summary:** the **4xx** group means client errors, **5xx** means server errors. 401 = "who are you?", 403 = "I know who you are, but you are not allowed to do this".

| Code | When to use |
|---|---|
| 200 / 201 / 204 | success / created / success with no body |
| 400 | the submitted data is invalid (missing field, wrong format) |
| 401 | not authenticated, or the token is broken/expired |
| 403 | authenticated but lacking permission |
| 404 | the resource does not exist |
| 409 | conflict (for example, a duplicate email) |
| 500 | an unexpected error on the server |

### Why the other options are wrong
- **404 on a wrong password**: a wrong password is an authentication failure, so use 401 (or 400 depending on the login endpoint design); 404 makes the client believe the endpoint does not exist.
- **500 when a field is missing**: that is a client error, so it must be 400; returning 500 skews server-error metrics and triggers false alerts.
- **200 for every error**: clients, caches, load balancers and monitoring tools all rely on the status code; hiding errors in the body breaks all of them.

> Senior tip: in Spring Boot 3, return errors in the **Problem Details (RFC 9457)** format with {{ProblemDetail}} so every service shares the same error shape.`
  },
  'qz-primer-006': {
    q: 'Your Spring Boot app on a Linux server fails with {{Port 8080 was already in use}}. How do you find the process holding the port?',
    options: [
      'Restarting the server is the only way',
      'Run {{sudo ss -ltnp | grep 8080}} (or {{sudo lsof -i :8080}}) to see the PID and name of the listening process, then decide whether to stop it or move the app to another port',
      'Run {{ping localhost:8080}}',
      'Delete the {{/etc/hosts}} file to free the port'
    ],
    explain: `**Summary:** on a given address only one process can listen on a TCP port. Find the **PID** of the process holding the port and deal with that specific process.

~~~bash
sudo ss -ltnp | grep 8080
# LISTEN 0 100 *:8080 *:* users:(("java",pid=21345,fd=45))
ps -fp 21345            # full command line, so you know which app it is
kill 21345              # sends SIGTERM, a graceful shutdown; use kill -9 only when it hangs
~~~
Usually it is an old copy of the app that was never stopped (started from the IDE or via nohup). Or just change the port: {{--server.port=8081}}.

### Why the other options are wrong
- **Restart the server**: far too heavy-handed, interrupts everything else running, and that process (if it is a service that starts on boot) will grab the port again.
- **ping**: ping uses ICMP and has no notion of ports; the {{localhost:8080}} syntax is not valid for ping either.
- **Delete /etc/hosts**: that file maps hostnames to IPs and has nothing to do with ports; deleting it breaks resolution of {{localhost}}.

> Senior tip: only kill by **specific PID** after checking what it is; never kill by name ({{pkill java}}), because that can take down every other Java app on the machine. For services managed by systemd, use {{systemctl stop <name>}}.`
  },
  'qz-primer-007': {
    q: 'A Maven project has two dependencies that both pull in the Jackson library at different versions: A pulls 2.15 at depth 2, B pulls 2.17 at depth 3. Which version will Maven use, and how do you control it?',
    options: [
      'Always the newest version (2.17), like Gradle',
      'A build error that forces you to choose',
      '2.15, because it is closer to the root of the dependency tree (nearest wins); to take control, declare the version in {{dependencyManagement}} or import a BOM (Spring Boot already manages the Jackson version for you)',
      'Both versions at the same time on the classpath'
    ],
    explain: `**Summary:** Maven resolves conflicts by **nearest definition**: the version closest to the project in the dependency tree wins; at equal depth the one declared first wins. This can pick an **older version** and cause a {{NoSuchMethodError}} at runtime.

~~~bash
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core   # see who pulls which version
~~~
~~~text
<dependencyManagement>
  <dependencies> jackson-bom version 2.17.x, scope import, type pom </dependencies>
</dependencyManagement>
~~~

### Why the other options are wrong
- **Always newest**: that is **Gradle**'s default strategy (highest version), not Maven's.
- **Build error**: Maven does not fail by default; to enforce it you must add the maven-enforcer-plugin with a rule such as dependencyConvergence.
- **Use both**: a normal classpath holds only one copy of each artifact; if two jars really contain the same class, which one gets loaded depends on ordering, which is even worse.

> Senior tip: in a Spring Boot project, do not write versions for libraries Boot already manages; to change one, override the property (for example {{jackson-bom.version}}) so every Jackson module moves in lockstep.`
  },
  'qz-primer-008': {
    q: 'You add Redis as a cache for the API {{GET /products/42}} using the cache-aside pattern. What is the correct flow?',
    options: [
      'Write every product into Redis at startup and never read the database again',
      'Always read the database first, then read Redis to compare',
      'Write only to Redis, and the database is updated every 24 hours',
      'Read Redis first; on a hit return it; on a miss read the database, write it into Redis with a TTL and return it; when a product is updated, evict the corresponding key'
    ],
    explain: `**Summary:** cache-aside means **the application manages the cache itself**: read the cache first, on a miss load from the DB and fill the cache; on a write, update the DB and then evict the cache key so the next read reloads the fresh copy.

~~~java
@Cacheable(cacheNames = "product", key = "#id")      // hit: return from Redis; miss: run the method and store the result
public ProductDto get(long id) { return repo.findById(id).map(mapper::toDto).orElseThrow(); }

@CacheEvict(cacheNames = "product", key = "#cmd.id") // evict the key once the DB update is done
public void update(UpdateProduct cmd) { ... }
~~~
The TTL (for example {{spring.cache.redis.time-to-live=10m}}) is a safety net: even if you forget to evict, stale data lives at most 10 minutes.

### Why the other options are wrong
- **Load everything at startup, drop the DB**: Redis keeps data in RAM, so it can be lost; newly added products are never loaded; and you spend memory on data almost nobody reads.
- **Read the DB first, then Redis**: this throws away the entire benefit of the cache because the DB is still hit on every request.
- **Write only to Redis, DB updated after 24 hours**: Redis is not the source of truth; data is lost if Redis goes down.

> Senior tip: evict the key instead of updating it on writes, because two concurrent writes can put an old value into the cache over a newer one. Add a little randomness to the TTL so a batch of keys does not all expire at the same moment.`
  },
  'qz-primer-009': {
    q: 'After signing in through OpenID Connect, the application receives an ID token and an access token. Which two statements are correct? (Choose 2)',
    options: [
      'The ID token is for the **client** (the application) to know who the user is (claims such as {{sub}}, {{email}}); it should not be sent to an API as a bearer token',
      'The access token must always be a JWT according to the OAuth2 standard',
      'The access token is sent with requests to the resource server (API) in the {{Authorization: Bearer ...}} header; the API validates it to decide whether to allow access',
      'The refresh token is sent with every request to the API to keep the session alive',
      'The ID token is used to call any third-party API in place of the access token'
    ],
    explain: `**Summary:** the **ID token** (OIDC) answers "who just signed in?" for the application; the **access token** (OAuth2) is the "ticket" sent to the API. The two tokens have different audiences.

| Token | Audience | Used for |
|---|---|---|
| ID token (always a JWT) | client | showing the name, knowing the user id |
| Access token | resource server (API) | calling the API according to its scopes |
| Refresh token | authorization server | exchanging for a new access token when it expires |

### Why the other options are wrong
- **Access token is always a JWT**: OAuth2 does not prescribe a format; it can be an opaque random string that the API must validate through the introspection endpoint.
- **Refresh token sent on every request**: the refresh token is only sent to the token endpoint of the authorization server; sending it everywhere raises the risk of leaking a long-lived token.
- **ID token calls third-party APIs**: the ID token's audience is the client, so an API should not accept it; API permissions are expressed by scopes in the access token.

> Senior tip: in Spring Boot, a web app that signs users in uses {{spring-boot-starter-oauth2-client}}, while an API that validates tokens uses {{spring-boot-starter-oauth2-resource-server}}; mixing up these two roles is a very common mistake when you are just starting out.`
  },
  'qz-primer-010': {
    q: 'The team says "we already have Continuous Delivery", but someone else says "that is not Continuous Deployment yet". What is the difference between the two ideas?',
    options: [
      'Continuous Delivery: every change that goes through the pipeline is **ready** to be deployed to production, but the step that puts it there needs a human to approve; Continuous Deployment: changes that pass all tests are **automatically** pushed to production',
      'The two ideas are the same, only the name differs',
      'Continuous Delivery is running unit tests, Continuous Deployment is running integration tests',
      'Continuous Deployment means deploying once a week on a schedule'
    ],
    explain: `**Summary:** both automate building, testing and packaging. They differ in the **last step**: Delivery stops and waits for a human decision; Deployment automatically ships to production whenever the pipeline is green.

~~~text
commit -> build -> unit test -> integration test -> deploy staging -> [manual approval] -> production   (Delivery)
commit -> build -> unit test -> integration test -> deploy staging -> automatic -> production           (Deployment)
~~~
Continuous Integration is the part before that: everyone merges into the main branch often, and every merge builds and tests automatically.

### Why the other options are wrong
- **The same**: the difference in the production approval step is significant; it decides how much automation you have and how much you trust the tests.
- **Unit test vs integration test**: both models run every kind of test; that is pipeline content, not a definition.
- **Weekly scheduled deploy**: scheduled deploys are not "continuous"; Continuous Deployment ships as soon as each change is ready, possibly many times a day.

> Senior tip: moving to Continuous Deployment requires trustworthy automated tests, feature flags to separate "deploy" from "release the feature", plus canaries and automatic rollback. Without those, keeping a manual approval step is the sensible choice.`
  }
});
