/*
 * English translation of js/data/q-primer.js — task T401. Format: js/core/i18n.js (content overlay).
 * ids: primer-008 primer-009 primer-010 primer-011 primer-012 primer-013
 */
App.i18n.content({
  'primer-008': {
    q: 'Git fundamentals: what are commits, branches, and remotes? How do you use Git day to day, and how do you resolve merge conflicts?',
    a: `**Summary:**
- Git is a **distributed version control system**: every machine (developer, CI, server) has the project's **entire history**.
- A **commit** is a "snapshot" with an identifier (hash) and a message; a **branch** is a lightweight pointer to the current commit, so switching branches is almost instantaneous; a **remote** is the copy "shared by the whole team" (GitHub, GitLab).
- Daily workflow: edit code → {{git add}} (select changes for the staging area) → {{git commit}} → {{git push}}; get other people's work: {{git pull}}.
- A **conflict** occurs when two branches modify the same line; Git stops and marks the file so you can choose or combine the correct content yourself, then run {{git add}} and {{git commit}} to complete the merge.

### Quick intuition
Git is like **a handwritten notebook with many photocopies**:
- Each page has an identifier (hash) and explicitly records "which page came before it" (parent) → you cannot secretly rewrite the past without everyone noticing.
- A branch is **a strip of paper attached to a page**: switching branches just moves the strip; no pages are lost. A new Git branch costs only a few bytes, so feel free to create one for each small feature.
- A remote is the notebook kept **on the meeting-room shelf**: everyone can photocopy it (clone), add new pages (push), and see one another's new pages (fetch/pull).

### The file flow in Git (understand this before using the commands)
~~~text
You edit a file
   |  (1) the file is in the working tree — changes are "loose" and not yet saved
   v
git add file
   |  (2) changes enter the staging area (index) — "selected for the next snapshot"
   v
git commit -m "msg"
   |  (3) a fixed snapshot + message, attached to the current branch's history
   v
git push origin main
        (4) send commits from your machine to the remote (origin)
~~~
- {{git status}}: which branch you are on and which files are modified, added, or not yet staged.
- {{git log --oneline -10}}: the 10 most recent commits, one hash + message per line.
- {{git diff}}: view changes you have not {{add}}ed; {{git diff --staged}}: view the changes you have {{add}}ed.

### Branches, merge, and rebase
- {{git switch -c feature-login}}: create a new branch and switch to it; {{git switch main}}: return to the main branch.
- {{git merge feature-login}}: **combine** two lines of history; if the two branches changed different parts of a file, Git merges them automatically, but if they changed the same part, it reports a **conflict**.
- {{git rebase main}}: "replay" your commits on top of {{main}}, producing a straighter history but **rewriting the hashes** — only rebase your own branch; never rebase a shared branch that others are using.

### Resolving a conflict step by step
1. {{git merge feature-login}} reports {{CONFLICT (content): ...}}.
2. {{git status}} lists the conflicted files. Open a file and you will see markers inserted by Git:
~~~text
<<<<<<< HEAD
    int timeout = 30;
=======
    int timeout = 60;
>>>>>>> feature-login
~~~
3. Edit the content to its **correct final form**, removing every {{<<<<<<<}}, {{=======}}, and {{>>>>>>>}} marker line.
4. Run {{git add file}}, then {{git commit}} — the merge is complete.

### Common mistakes
- **Not understanding working tree → staging → commit**, so you assume {{git commit}} "saves everything"; it actually commits only what has been {{add}}ed.
- **Force pushing ({{git push -f}}) after rebase/reset on a shared branch** → overwrites other people's commits and can destroy their work. Use {{git push --force-with-lease}} only on your own branch.
- **Committing a secret** (password, API key): if you have already pushed it, rotate the secret **immediately** (deleting it from history is not enough because other people's clones still contain it). Add secrets to {{.gitignore}} from the start.
- **Running {{git reset --hard}} to "clean up"**: permanently loses uncommitted changes; if you do this by mistake, {{git reflog}} can often still save you.
- **Only noticing after a merge that a commit message like "fix bug" is meaningless** → practice writing messages that explain **why**, not just "fix".

### One-minute spoken answer
"Git is a distributed version control system, and every copy contains the entire history. My daily workflow is to create a branch for each feature, edit the code, use {{git add}} to stage selected changes, {{git commit}} with a message that clearly explains why, and {{git push}} to the remote. When the main branch has new changes, I use {{git pull}} to fetch and merge them. When I hit a conflict, I open the file, read the sections marked by Git, keep the correct content, remove the marker lines, then run {{git add}} and commit to complete the merge. I do not rebase or force push on shared branches, and I always check {{.gitignore}} so I do not push secrets."

> Senior tip: practice {{git log --oneline --graph --all}} once a week — seeing the history as a tree helps you understand what is happening between branches, and it distinguishes someone who "knows how to use Git" from someone who "only remembers a few commands". In a team, squash merges plus branch protection rules (required reviews, no force pushes) keep history tidy without sacrificing safety.`,
    follow: [
      'How do merge and rebase differ in the history they produce, and when should you use each?',
      'How do you handle a commit containing a secret that you have already pushed to a remote?',
      'What is a fast-forward merge, and when can Git not fast-forward?'
    ]
  },
  'primer-009': {
    q: 'Linux fundamentals for backend developers: what are processes, ports, and services? Which commands do you use to inspect processes, ports, and logs, and to change file permissions on a Linux server?',
    a: `**Summary:**
- A **process** is a running program with an identifier called a **PID**; a **service** is a process that the operating system starts and monitors for you (on modern Linux, usually a **systemd unit**); a **port** is a numbered "gateway" on the machine where a process listens for network connections (for example, 8080).
- A backend developer's minimum command set: {{ps}}/{{top}} to inspect processes and resources, {{ss}} to inspect ports, {{tail -f}}/{{journalctl}} to read logs, {{chmod}}/{{chown}} to change file permissions, and {{kill}} to stop a process.
- A Java application's logs are usually written by the application itself (to a file or stdout); a service's logs are retained by {{journalctl}}.

### Quick intuition
Linux is like **a large factory**:
- A process is **a worker doing a job** — each worker has a badge number (PID), and their work costs wages (CPU/RAM).
- A service is **a managed work shift**: the manager (systemd) starts the worker at the beginning of the shift, monitors them, and replaces them if they fall over (auto-restart).
- A port is **a numbered entrance**: a visitor (client) comes to entrance 8080 to reach your service; only one person can stand at a given entrance.

### Inspecting processes and resources
~~~bash
ps -ef | grep java      # list Java processes: PID, startup command, user
top                     # realtime updates: CPU and RAM by process (press q to quit)
ps -o pid,rss,cmd -p 1234   # RAM (RSS, KB) and command for PID 1234
kill 1234               # send the TERM signal: ask the process to shut down cleanly (close sockets, flush logs...)
kill -9 1234            # force immediate termination: use only when a normal kill does not work
~~~
- When Java receives SIGTERM, Spring Boot performs a **graceful shutdown** (waits for in-flight requests to finish, up to {{spring.lifecycle.timeout-per-shutdown-phase}}). {{kill -9}} skips all of that — in-flight requests can be lost.
- {{top}}: inspect %CPU, %MEM, and RES; an unusually high column is the first warning sign.

### Inspecting network ports
~~~bash
ss -tlnp | grep 8080    # which process is listening on port 8080
ss -tnp | grep 8080     # open connections on port 8080
lsof -i :8080           # (alternative) the process that opened port 8080
~~~
The classic error: start the app a second time → {{BindException: Address already in use}} — an old process still holds the port; {{ss -tlnp | grep 8080}} immediately reveals the PID of the process "holding the door".

### Reading logs
~~~bash
tail -f /var/log/app/app.log        # follow logs in realtime
journalctl -u orders.service -f     # logs for a service managed by systemd
journalctl -u orders.service --since "1 hour ago" | grep ERROR
~~~
Rule of thumb: when an app runs on a server, let systemd manage it ({{Restart=on-failure}}), and write logs to stdout or to a file configured by the app itself (Logback). In a container (ECS, K8s), you usually do not need {{journalctl}} because logs are collected centrally.

### File permissions and users
Every Linux file has an **owner**, a **group**, and a permission string such as {{rwxr-xr--}}:
~~~text
rwx r-x r--
 |   |   +-- others: read only
 |   +------ group : read + execute (enter a directory)
 +---------- owner : read + write + execute
chmod 640 app.properties    # owner can write, group can only read, others have no access
chown app:app app.properties  # change ownership to user app
~~~
{{chmod 777}} (grants every permission to everyone) is a **trap**: it "gets rid of permission errors" but leaves your data wide open; grant only the minimum permissions required.

### Common mistakes
- **Running the app as root** to "avoid permission errors" — if there is a vulnerability, the attacker gets the whole machine. Run under a dedicated user and grant permissions precisely.
- **Not knowing which process holds a port**, so you keep restarting blindly; {{ss -tlnp}} tells you immediately.
- **Using {{kill -9}} out of habit** → no graceful shutdown, lost requests, and potentially corrupted partially written files.
- **Logs filling the disk** ({{No space left on device}}) → the app hangs; enable log rotation and monitor disk usage.
- **Forgetting {{chmod +x}}** on a shell script ({{./deploy.sh}}) → running it reports {{Permission denied}}.

### One-minute spoken answer
"A process is a running program with a PID; a service is a process managed by systemd, started automatically and restarted on failure; a port is the numbered endpoint where a process listens. When I suspect an incident, I use {{ps -ef | grep java}} to find the process, {{top}} to inspect CPU/RAM, {{ss -tlnp}} to see which process holds a port, and {{journalctl -u}} or {{tail -f}} to inspect logs around the failure. I stop processes with {{kill}} so the app can shut down gracefully; {{kill -9}} is only a last resort. For file permissions, I grant only what is needed with {{chmod}}/{{chown}}, and I never run a production app as root."

> Senior tip: when you SSH into an unfamiliar server, spend the first 30 seconds running {{uname -a}}, {{ss -tlnp | head}}, {{df -h}}, {{free -m}}, and {{uptime}} — a "snapshot" of the machine's current state; many incidents (full disk, exhausted RAM, high load) become obvious from those five commands before you even open the logs.`,
    follow: [
      'What is the difference between SIGTERM and SIGKILL, and why does Spring Boot need graceful shutdown?',
      'How do you diagnose a Java app that is hung (unresponsive) on Linux?',
      'How do file permissions 644 and 640 differ, and when should you use each?'
    ]
  },
  'primer-010': {
    q: 'HTTP fundamentals: what are the parts of a request and a response? How do headers, status codes, keep-alive, and HTTPS work?',
    a: `**Summary:**
- HTTP is a "request–response" protocol: the client sends a **request**, and the server returns a **response**. Both consist of a **start line + headers + a body**.
- **Headers** are metadata (format, encoding, version, cookies...); the **status code** reports the outcome: 2xx means success, 4xx means a client error, and 5xx means a server error.
- **Keep-alive** (enabled by default in HTTP/1.1) keeps one TCP connection open for multiple requests instead of opening a connection for each request; **HTTPS** = HTTP running inside a **TLS** layer for encryption and server authentication.

### Quick intuition
It is like **sending a written inquiry and receiving a reply at a post-office counter**:
- A request is **the inquiry form**: the top says "what I want" ({{GET /api/orders/42}}), the lines below carry additional information (headers: "please return JSON", "I am logged in"), and sometimes data is attached (the body).
- A response is **the reply form**: the top contains a result code ({{200 OK}} or {{404 Not Found}}), a header says "this is JSON", and the body contains the data.
- Keep-alive is **keeping the phone line open** for several questions instead of making a new call for each one — it eliminates repeated TCP handshake latency.
- HTTPS is **sending the message in a sealed envelope with an authentication stamp**: an intermediary can see only ciphertext, not the content; the stamp (certificate) proves you are talking to the real server rather than an impostor.

### The structure of a request/response
~~~text
GET /api/orders/42 HTTP/1.1        <- start line: method + path + version
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGci...

HTTP/1.1 200 OK                    <- response start line: version + status code
Content-Type: application/json
Content-Length: 256

{ "id": 42, "status": "PAID" }     <- body
~~~
- **Methods**: {{GET}} reads (safe, idempotent — calling it repeatedly produces the same result), {{POST}} creates, {{PUT}} replaces an entire resource (idempotent), {{PATCH}} partially updates, and {{DELETE}} removes. Preserve method semantics so caches and proxies behave correctly.
- Common **status codes** (table below).

| Code | Meaning | What Java developers commonly encounter |
|---|---|---|
| 200 / 201 / 204 | success / created / success with no body | successful API call |
| 301 / 304 | permanent redirect / Not Modified (the client's cached copy is still valid) | redirects, bandwidth savings |
| 400 / 401 / 403 | invalid data / unauthenticated / authenticated but not authorized | validation, Spring Security |
| 404 / 409 / 422 | not found / state conflict / business-invalid data | missing resource, version conflict |
| 429 | rate limit exceeded | API call throttled |
| 500 / 502 / 503 / 504 | server error / gateway received an invalid response from the backend / temporarily unavailable / gateway waited too long for the backend | application bugs, infrastructure failures |

- Important backend **headers**: {{Content-Type}}, {{Accept}}, {{Authorization}}, {{Cache-Control}}, {{X-Request-Id}} (a request identifier for correlating logs).

### Keep-alive and HTTPS
~~~text
Without keep-alive (HTTP/1.0):              With keep-alive (HTTP/1.1):
Client         Server                        Client              Server
  --TCP handshake-->                           --TCP handshake-->
  --request-->                                 --request 1-->
  <--response--                                <--response 1--
  x (close)                                    --request 2-->   (reuse the connection)
  --TCP handshake-->                           ...
  --request--...
~~~
HTTPS adds a TLS handshake **before** any HTTP communication:
~~~text
Client                                Server
  --- ClientHello (supported ciphers) --------->
  <--- ServerHello + certificate --------------
  (with ECDHE key-exchange parameters)
  validate certificate: signed by a trusted CA? correct hostname? still valid?
  --- client's ECDHE parameters ---------------->
  both sides INDEPENDENTLY DERIVE the same session key (the key never travels over the network)
  ====== HTTP runs inside the encrypted channel ======
~~~
- A certificate is signed by a CA (a trusted certificate authority): it proves the server really is {{api.example.com}}.
- **Why two kinds of keys are needed:** **asymmetric** encryption (a public/private key pair) is slow and is used only during the handshake: an RSA/ECDSA signature on the certificate proves the server's identity, while ECDHE lets both sides agree on a session key. The data is then encrypted with **symmetric** cryptography (AES-GCM, ChaCha20), which is much faster.
- TLS 1.3 needs only **1 round trip** for the handshake (TLS 1.2 needs 2), which is one reason to enable TLS 1.3.

### Inspect a real request to understand it
~~~bash
curl -v https://api.example.com/orders/42
# -v prints the TLS handshake, the request headers curl sends, and the response headers it receives
~~~

### Common mistakes
- **Confusing 401 and 403**: 401 = not logged in, 403 = logged in but not allowed.
- **Returning 200 with an error body** instead of 4xx/5xx → clients and monitoring cannot detect the failure.
- **No timeouts** on a Java HTTP client → a hung request can take down processing threads with it; always set {{connectTimeout}}/{{readTimeout}}.
- **Not understanding idempotency**: retrying {{POST}} after a timeout can create duplicates; you need an idempotency key at the business layer.
- **Incorrect caching**: a personalized response (account balance) without {{Cache-Control: private, no-store}} → a proxy/cache may serve one person's data to another.

### One-minute spoken answer
"An HTTP request has a method, path, headers, and body; a response has a status code, headers, and body. A 2xx status means success, 4xx means a client-side error (401 means not logged in, 403 means insufficient permission), and 5xx means a server-side error. Keep-alive (the default in HTTP/1.1) allows a TCP connection to be reused for multiple requests, and HTTP/2 can also multiplex many requests over one connection. HTTPS runs HTTP inside TLS: the handshake authenticates the server through its certificate, then the entire session uses symmetric encryption. When I write an HTTP client in Spring Boot, I always set timeouts and handle idempotency correctly for unsafe methods."

> Senior tip: when investigating an incident, read the **response headers** ({{X-Request-Id}}, {{Server-Timing}}, {{Retry-After}}) before the body — they tell you which layers the request passed through, how long each took, and when you should retry. This is an API troubleshooting skill that junior developers often overlook.`,
    follow: [
      'How do GET, POST, PUT, and PATCH differ in idempotency, and when should you use each?',
      'What steps make up the HTTPS TLS handshake, and why are both asymmetric and symmetric keys needed?',
      'How do 401 and 403 differ, and when does Spring Security return each status?'
    ]
  },
  'primer-011': {
    q: 'Maven and Gradle fundamentals: what are dependencies, scopes, and lifecycles? How do the two tools handle library version conflicts?',
    a: `**Summary:**
- Maven and Gradle are **Java build tools**: they download libraries (dependencies), compile code, run tests, package artifacts (jar/war), and publish them to a repository.
- A dependency is declared using the **coordinates** {{groupId:artifactId:version}}; **scope** (Maven) determines where a dependency is used (compile, test, runtime...); the **lifecycle** is an ordered sequence of build phases.
- Version conflicts: Maven selects based on **proximity** in the dependency tree (nearest-wins) and provides {{dependencyManagement}} to pin versions; Gradle selects the **highest version** (newest-wins) and provides {{resolutionStrategy}} to enforce a choice.

### Quick intuition
- **Maven** is like **a warehouse manager who follows a rigid ledger**: {{pom.xml}} is the catalog, with a fixed order of phases (many rules, but "everything follows convention"). Maven does exactly what {{pom.xml}} declares.
- **Gradle** is like **a warehouse manager working from a flexible script**: {{build.gradle.kts}} is programmable, builds are faster thanks to the daemon and caching, but excessive customization makes it easy to "make life difficult for yourself".
- Both download libraries from a **repository**: they check the local repository ({{~/.m2/repository}}) first, then download from Maven Central if anything is missing.

### Dependencies and the dependency tree
When you declare {{spring-boot-starter-web}}, Maven/Gradle downloads not only that artifact but also **all the libraries it depends on** (transitive dependencies) — Spring MVC, Tomcat, Jackson...
~~~xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <version>3.3.4</version>
</dependency>
~~~
{{mvn dependency:tree}} (or {{./gradlew dependencies}}) prints the tree showing who depends on whom — the number-one tool for diagnosing "why are there two Jackson versions?".

### Scope: where a dependency is used
| Scope | Compile | Test | Packaged into the artifact? | Example |
|---|---|---|---|---|
| compile (default) | yes | yes | yes | spring-boot-starter-web |
| provided | yes | yes | **no** | servlet-api (already supplied by the server) |
| runtime | no | yes | yes | JDBC driver at runtime |
| test | test only | yes | no | JUnit, Mockito |
| import | used to import a BOM | | | spring-boot-dependencies |

{{provided}} means "borrow it to write code, but do not bring it along": your code uses servlet-api, but the real Tomcat server already provides it at deployment — packaging it would create duplicates.

### Lifecycle and artifacts
Maven (fixed order; {{mvn package}} runs through the packaging phase):
~~~text
validate → compile → test → package → verify → install → deploy
           (compile)  (JUnit)  (jar)          (install locally) (push to shared repository)
~~~
- {{install}}: copies the jar into {{~/.m2}} so other projects on the machine can try it; {{deploy}}: pushes it to Nexus/Artifactory/Central.
- The Gradle equivalents: {{./gradlew build}} (includes {{test}} and {{assemble}}), and {{publish}} to push to a repository. Gradle uses a **daemon** (a process kept running) + a **build cache**, so rebuilds are often faster than Maven.

### BOM and dependencyManagement
{{spring-boot-dependencies}} is a **BOM** (Bill of Materials): a table of "a set of versions verified to work together" by Spring Boot.
~~~xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>3.3.4</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<!-- starter declarations no longer need a version -->
~~~

### Version conflicts
Suppose your project declares {{A}} and {{C}}; the tree is {{app→A→X 1.0}} and {{app→C→D→X 2.0}}. The classpath can contain only **one** version of X, so which one is selected?
- **Maven**: selects the version **nearest the root** (nearest-wins) → X 1.0 (depth 2 versus 3); at equal depth, the first declaration wins. Enforce a version with {{dependencyManagement}} or {{<exclusion>}}.
- **Gradle**: selects the **newest** version → X 2.0; enforce a choice with {{resolutionStrategy.force}} or {{failOnVersionConflict()}}.
- The clean approach: use a BOM and declare versions in **one place only**.

### Common mistakes
- **{{mvn package}} produces a jar without its dependencies** — you forgot {{spring-boot-maven-plugin}}, and {{java -jar}} reports {{no main manifest attribute}}.
- **Duplicate class / NoSuchMethodError**: two dependencies pull in two versions of the same library; use {{dependency:tree}} to find them and apply {{exclusion}} or pin the version.
- **Using an overly old plugin version** "to be safe" — security fixes never arrive; use the Spring Boot BOM and upgrade along the {{3.x.y}} line.
- **Not using the wrapper** ({{gradlew}}, {{mvnw}}): each machine has a different Gradle/Maven version, so builds work intermittently; commit the wrapper to Git and always run {{./gradlew}} / {{./mvnw}}.
- **{{-SNAPSHOT}} in a shared environment**: a snapshot can change hourly, making builds non-reproducible; pin only regular versions in real environments.

### One-minute spoken answer
"Both Maven and Gradle declare dependencies using groupId, artifactId, and version coordinates, automatically download transitive dependencies, and build according to a lifecycle — Maven has fixed phases from compile through package and deploy, while Gradle uses a task graph with a daemon and cache. Scope determines where a dependency is used: test is used only for tests, while provided is not packaged into the artifact. For version conflicts, Maven uses proximity while Gradle uses the newest version; I prevent these issues with the Spring Boot BOM through dependencyManagement, pinning versions for the entire project in one place."

> Senior tip: add {{dependency-check}} (OWASP) or your CI's SCA to the pipeline to detect vulnerable libraries; combine this with {{dependency:tree}} when upgrading versions — upgrading one starter can pull in dozens of transitive libraries, so run the full test suite rather than settling for a "green build".`,
    follow: [
      'How do the provided and runtime dependency scopes differ, and why is servlet-api provided?',
      'Maven selects the nearest version while Gradle selects the newest — what are the consequences, and how do you enforce a version?',
      'What problem does a BOM (dependencyManagement) solve that declaring a version for each dependency cannot?'
    ]
  },
  'primer-012': {
    q: 'Nginx fundamentals: what are reverse proxying and load balancing? Why is Nginx commonly placed in front of a Spring Boot application, and what does a basic configuration look like?',
    a: `**Summary:**
- Nginx is a high-performance **web server / reverse proxy**: it receives requests from clients and **forwards (proxies) them to the backend application** (Spring Boot), while also serving static files, load balancing, and terminating TLS.
- **Reverse proxy**: the client talks to Nginx; Nginx talks to the backend — the client does not know the backend exists. This differs from a **forward proxy** (which sits on the client side and hides the client from the server).
- **Load balancing**: Nginx distributes requests across multiple backend instances. **TLS termination**: Nginx holds the HTTPS certificate and speaks plain HTTP to internal backends — centralizing the encryption workload in one place.

### Quick intuition
Nginx is like **a building's receptionist**:
- Visitors (clients) do not walk straight into individual offices (backends); they go to the reception desk (Nginx) first.
- The receptionist receives mail, distributes it to available employees (load balancing), posts static signs (static files), and handles security paperwork at the entrance (TLS) so employees can focus on their work.
- The backend can therefore focus on "business logic" without worrying about certificates or serving CSS files.

### Why put Nginx in front of Spring Boot
~~~text
Client ──HTTPS──> Nginx ──HTTP──> Spring Boot #1
                        └──────> Spring Boot #2
                        └──────> Spring Boot #3
~~~
1. **TLS termination**: the HTTPS certificate lives in one place at Nginx; the 3 backend instances do not need to manage it.
2. **Load balancing**: add or remove backend instances without changing anything for clients.
3. **Static content**: Nginx serves HTML, CSS, and JS (fast, without consuming Java threads).
4. **Buffering large requests**: Nginx receives large file uploads first, so the backend does not get "clogged".
5. **An extra protection layer**: rate limiting and blocking malicious IPs before they reach the backend.

### Basic configuration
~~~text
# /etc/nginx/conf.d/api.conf
upstream backend {                    # backend group
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    keepalive 32;                    # keep connections to backends open for speed
}

server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;      # HTTPS certificate
    ssl_certificate_key /etc/ssl/api.key;

    client_max_body_size 10m;        # upload limit (prevent RAM exhaustion)

    location /api/ {
        proxy_pass http://backend;             # forward to the backend group
        proxy_http_version 1.1;                # required for backend keepalive
        proxy_set_header Connection "";        # (these 2 lines go with "keepalive 32")
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # tell the backend the client used https
        proxy_read_timeout 60s;        # how long to wait for a backend response
    }

    location / {
        root /usr/share/nginx/html;    # static files
        try_files $uri /index.html;    # SPA fallback
    }
}
~~~
{{upstream}} defines the backend group; {{proxy_pass}} forwards requests; {{proxy_set_header}} is **essential** so the backend (Spring Boot) knows the real client rather than seeing only Nginx's IP. In Spring Boot, set {{server.forward-headers-strategy=framework}} so {{request.getRemoteAddr()}} and {{X-Forwarded-Proto}} work correctly.

### Load balancing: which method to choose
| Method | How it works | When to use it |
|---|---|---|
| round-robin (default) | distributes evenly in turn | backends with equal capacity |
| least_conn | sends to the backend with the fewest active connections | requests with varying durations |
| ip_hash | same IP → same backend | when "sticky" sessions are needed |

Nginx also temporarily marks a backend as "failed" after repeated connection errors ({{max_fails}}, {{fail_timeout}}) and sends requests to another backend.

Load balancing at the Nginx layer is often sufficient; with Kubernetes, the K8s Service/Ingress handles this, and the Nginx Ingress Controller remains a popular choice.

### Common mistakes
- **Forgetting {{X-Forwarded-*}}** → the backend logs "the client is 127.0.0.1", and IP-based rate limiting is completely wrong.
- **{{proxy_read_timeout}} too short** (60s by default) → a 5-minute report export returns 504; increase the timeout for slow endpoints or make them asynchronous.
- **Forgetting {{client_max_body_size}}** → uploads fail with 413.
- **Seeing 502 Bad Gateway without knowing where to look**: 502 means Nginx **did not receive a valid response** from the backend (the backend is down, restarting, or listening on the wrong port). Check {{/var/log/nginx/error.log}} (you will often see {{connect() failed (111: Connection refused)}}) and run {{ss -tlnp}} on the backend machine.
- **Declaring {{keepalive}} in the upstream but forgetting {{proxy_http_version 1.1}}** → Nginx still opens a new connection for every request, so the keepalive configuration has no effect.

### One-minute spoken answer
"Nginx is a reverse proxy: clients talk only to Nginx, which forwards requests to backend instances and distributes the load. It handles TLS termination so backends do not need to manage certificates, serves static files, and adds layers such as rate limiting and upload-size limits. I configure an {{upstream}} to declare the backend group, {{proxy_pass}} to forward requests, and {{proxy_set_header}} so the backend knows the client's real IP and https scheme. For long-running endpoints, I increase {{proxy_read_timeout}} instead of letting a 504 cut them off."

> Senior tip: when the backend returns 502/504, check {{proxy_read_timeout}} and backend health before assuming "the code is broken"; and always propagate {{X-Request-Id}} through Nginx → backend → system logs so you can trace a specific request. This production troubleshooting skill comes up frequently in interviews.`,
    follow: [
      'How does a reverse proxy differ from a forward proxy?',
      'Nginx returns 502 Bad Gateway; in what order do you diagnose the problem?',
      'What are X-Forwarded-For and X-Forwarded-Proto used for, and what happens without them?'
    ]
  },
  'primer-013': {
    q: 'RabbitMQ fundamentals: what are exchanges, queues, bindings, and acks? How does a message travel from producer to consumer, and when should you choose RabbitMQ over Kafka?',
    a: `**Summary:**
- RabbitMQ is a **message broker** (an intermediary for exchanging messages): a **producer** sends a message to an **exchange**, the exchange routes it according to **bindings** into **queues**, and a **consumer** reads from a queue.
- An **ack** is a "receipt confirming processing is complete": the consumer tells the broker to delete the message; without an ack, the message is redelivered — so work is not lost if the consumer dies midway.
- Choose RabbitMQ when you need a flexible **work queue / router-style pub-sub**; choose Kafka when you need a **high-throughput, replayable event log** (see primer-003).

### Quick intuition
RabbitMQ is like **an intermediary post office**:
- You (the producer) bring mail to the counter instead of handing it directly to the recipient.
- The counter manager (exchange) looks at the **address and label**, then sorts it into the correct drawer (queue) according to rules (bindings).
- The recipient (consumer) collects the mail and, after reading it, **confirms receipt** (ack) so the post office deletes it; without confirmation, they send it again.
- One letter can go into multiple drawers (fan-out to multiple teams) or just one drawer (assigning work to one person).

### The flow of a message
~~~text
Producer --> Exchange --binding--> Queue --> Consumer
              (routes)             (waits)   (processes, acks)
~~~
- **Queue**: stores messages waiting for a consumer; if durable (backed by disk), it survives a broker restart.
- **Binding**: the rule connecting an exchange to a queue, with a **routing key** (a routing label) — for example, the binding {{order.*}} matches {{order.created}} and {{order.paid}}.
- **Exchange types** (table below). In a topic pattern, {{*}} matches exactly one word, and {{#}} matches zero or more words.

| Type | How it routes | Used for |
|---|---|---|
| direct | exact routing-key match | sending work to a specific queue |
| topic | wildcard pattern match ({{order.*}}, {{*.paid}}) | flexible pub-sub |
| fanout | sends to **every** bound queue, ignoring the routing key | broadcast (invalidating caches in multiple services) |
| headers | based on message headers | rarely used |


### Ack, redelivery, and poison messages
- After processing, the consumer calls {{channel.basicAck(tag, false)}}; only then does the broker delete the message from the queue.
- If the consumer dies **before acknowledging**, the broker redelivers the message to another consumer (**redeliver**) → no work is lost, but **duplicate processing is possible** → the consumer must be **idempotent**.
- A **poison message** (a bad message that makes the consumer fail repeatedly) → configure a **dead-letter exchange** for the queue: a message that is rejected **without requeue**, expires its TTL, or exceeds {{x-delivery-limit}} (quorum queue) is moved to a **DLQ** (dead-letter queue) for inspection and manual handling, without blocking the entire queue.
- **Prefetch** ({{basicQos}}): the number of messages the broker sends to a consumer in advance; set it low (for example, 10) to distribute work evenly among consumers and prevent one consumer from "hoarding" the whole queue.

### Quick comparison of RabbitMQ and Kafka
| Criterion | RabbitMQ | Kafka |
|---|---|---|
| Model | queues; messages are **deleted after being read** | append-only log; **retained according to retention** |
| Replay | no (each message is delivered to one consumer) | yes — every group reads independently and can replay from an offset |
| Routing | flexible (exchange + binding) | simple, partition-based |
| Throughput | high (tens of thousands of msg/s) | very high (hundreds of thousands+) |
| When to choose | job queues, RPC, pub-sub router | event streams, replay requirements, event-stream analytics |
Choose: "send an email when an order arrives, one email each time" → RabbitMQ; "publish order events to 10 services, and let services added later replay them" → Kafka.

### RabbitMQ with Spring Boot
~~~java
// Send a message (producer)
rabbitTemplate.convertAndSend("orders", "order.created", dto);

// Receive a message (consumer); queue "emails" is bound to exchange "orders" with key "order.*"
@RabbitListener(queues = "emails")
public void on(OrderCreatedEvent e) {
    sendWelcomeEmail(e);   // MUST be idempotent: the message may be redelivered
}
~~~
Spring AMQP uses AUTO ack mode by default: if the method returns normally, the container acks; if it throws an exception, the message is rejected and **requeued by default** ({{spring.rabbitmq.listener.simple.default-requeue-rejected=true}}). If the error is permanent (invalid data), the message will loop forever, so enable bounded retries ({{spring.rabbitmq.listener.simple.retry.enabled=true}}) so that after all attempts are exhausted, the message is rejected without requeue and sent to the DLQ.

### Common mistakes
- **Auto-acking too early** (before processing) → if the consumer dies, the message is lost permanently. Always ack after processing completes (or use asynchronous processing with persisted state).
- **No idempotency** → redelivery causes duplicate processing (inventory deducted twice, email sent twice).
- **No DLQ** → one "poison" message blocks the entire queue, and no one can read the messages behind it.
- **Non-durable queue + broker restart** → the entire pending queue is lost; both a durable queue **and** persistent messages are required to survive a restart.
- **Prefetch too high** → one consumer hoards the whole queue while the other consumers "sit idle".
- **Choosing the wrong tool**: using Kafka as a queue for long-running jobs (one slow message makes everything behind it in the partition wait, and per-message ack/retry is difficult); using RabbitMQ for an event stream that needs replay means acknowledged messages are gone and cannot be replayed.

### One-minute spoken answer
"RabbitMQ is a message broker: the producer sends to an exchange, the exchange routes through bindings into queues, and the consumer reads and acks to confirm processing is complete. If the consumer dies before acking, the message is redelivered, so the consumer must be idempotent; poison messages go to a DLQ so they do not block the queue. I use RabbitMQ for work queues and flexible pub-sub routing, and I choose Kafka for event streams that need replay and high throughput. When configuring it, I enable durable queues, persistent messages, and a prefetch limit to distribute work evenly."

> Senior tip: the RabbitMQ Management UI (port 15672) immediately shows queue depth, redelivery rate, and consumer connections — open it after every deployment to "see" your queues before users complain. And with Spring Boot, enable publisher confirms ({{spring.rabbitmq.publisher-confirm-type=correlated}}) so you know a message actually reached the broker, not just that "the send method was called".`,
    follow: [
      'How do ack and nack differ, and when is a message redelivered?',
      'What do you do when a RabbitMQ consumer crashes midway and you must ensure no work is lost?',
      'How do Kafka and RabbitMQ differ in storage model and replay, and when should you choose each?'
    ]
  }
});
