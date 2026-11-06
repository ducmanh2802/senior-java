/*
 * English translation of js/data/q-primer.js — task T794. Format: js/core/i18n.js (content overlay).
 * ids: primer-018 primer-019 primer-020 primer-021 primer-022 primer-023
 */
App.i18n.content({
  'primer-018': {
    q: 'Process, thread and CPU core: how do they differ? In a Java backend application, how are they related?',
    a: `**Summary:**
- **Process** is a running program with its own memory space. **Thread** is a "sub-task" running inside a process; threads in the same process share memory. **CPU core** is the hardware unit that actually executes instructions; the number of cores determines how many tasks can run truly in parallel at the same time.
- A JVM Spring Boot application is usually 1 process, which creates dozens to hundreds of threads (HTTP thread pools, GC threads, scheduler threads). CPU cores are the physical/virtual machine resources these threads compete for.

### Real-world context: why a 4-year dev still needs to understand this
When production slows down, people say "add threads", "add instances", "CPU at 100%". If you don't distinguish process, thread, and core, you easily choose the wrong direction: adding threads when CPU is already saturated (doesn't help, makes it worse), or confusing "2 cores" with "running unlimited tasks in parallel".

### Each concept from scratch

#### 1) What is a process
**Process**: the operating system gives a running program its own "house" consisting of: virtual memory space, open file table, environment variables, and at least one thread.
- Isolation: process A cannot directly read/write process B's memory. To exchange data, they must use inter-process communication (IPC: socket, file, pipe, message queue).
- Everyday example: each process is like an **apartment in a condominium**. Each apartment has its own furniture; to move items to another apartment you have to go through the hallway/door (IPC), you cannot just reach over and take them directly.
- In the backend: you run {{java -jar app.jar}} → the OS creates 1 JVM process. Running 3 instances on 3 machines → 3 processes (usually 1 process per instance).

#### 2) What is a thread
**Thread**: a smaller execution unit inside a process. Multiple threads in the same process:
- **Share**: heap (object memory), code, open files, static variables.
- **Own per thread**: stack (call stack), instruction pointer (which line is running), CPU registers.
- Everyday example: within one apartment (process), there are multiple **people working** (threads). They share the kitchen/refrigerator (heap) but each has their own notebook (stack). Sharing is convenient but they may fight over the kitchen → need "rules" (synchronization/lock).
- In Spring Boot (default Tomcat): each HTTP request is handled by 1 thread taken from a thread pool (for example max 200 threads). 200 simultaneous requests → up to 200 threads living at the same time in 1 JVM process.

#### 3) What is a CPU core
**CPU core**: the hardware circuit that actually executes machine instructions. 1 core at any moment executes only 1 instruction stream (ignoring hyper-threading to keep it simple).
- **True parallelism**: 4 cores can run 4 threads at the same time.
- **Fake simultaneity (concurrency)**: 100 threads on 4 cores → the OS continuously switches the core among threads (context switch). Each thread runs for a bit then yields. The user feels "at the same time", but actually they interleave very quickly.
- Everyday example: 4 cores are like **4 chefs**. 100 orders (threads) are cooked by the 4 chefs taking turns cooking each dish, not by 100 chefs.

### Relationship diagram (ASCII)
~~~text
Server has 4 CPU cores: [C1] [C2] [C3] [C4]

Process JVM (PID 1234) — own memory
  Heap (shared): [Object A] [Object B] [Connection Pool]
  Thread T1 (HTTP)  own stack ---- may be running on C1
  Thread T2 (HTTP)  own stack ---- may be running on C2
  Thread T3 (GC)    own stack ---- waiting for turn (C1, C2 busy)
  Thread T4 (HTTP)  own stack ---- waiting
  ... (total 150 threads)

Process Postgres (PID 5678) — own memory, does not touch JVM heap
~~~

### Concrete example with figures
Suppose the Order service receives 300 requests/second, each request waits for DB on average 50ms and computes 5ms:
- 1 request occupies a thread ~55ms → 1 thread serves ~18 req/s.
- Need ~17 "busy" threads to handle 300 req/s. Tomcat pool of 200 threads is plenty for this case.
- 4-core machine: while threads wait for DB (I/O wait), idle cores can run other threads → having more threads than cores is still beneficial for I/O-heavy workloads.
- If the workload is CPU-heavy, for example encryption/image resizing 55ms pure CPU: 4 cores only truly process ~72 req/s. Increasing threads to 200 doesn't help, it only increases context switching; the solution is to add cores/instances or optimize the algorithm.

### Quick comparison table
| Criterion | Process | Thread | CPU core |
|---|---|---|---|
| What | Running program | Execution thread within a process | Hardware that executes |
| Memory | Separate | Shared heap, own stack | Not memory |
| Create/destroy | Heavy (resource-intensive) | Lighter than process | Fixed by hardware |
| Error impact | Usually kills only that process | 1 crashing thread can take down the whole JVM (depending on the error) | Damaged core affects the whole machine |
| Communication | IPC (socket, queue) | Call shared variables/objects (need locks) | N/A |

### Common pitfalls in Java backend
- **Blindly increasing {{server.tomcat.threads.max}} when CPU is already 90%**: adding threads → more context switching → slower. Measure: is the bottleneck CPU or I/O/DB?
- **Thinking "8 threads = running on 8 cores"**: only true if the machine has ≥8 cores and threads are CPU-bound. Kubernetes containers sometimes have CPU limits (e.g. 500m = half a core) → actual parallelism is less than expected.
- **Sharing variables between threads without synchronization**: because they share the heap, 2 threads editing the same {{HashMap}} often → corrupted data, {{ConcurrentModificationException}}, or infinite deadlock (the classic {{HashMap}} story in multithreaded environments).
- **Confusing process isolation with thread safety**: splitting microservices (multiple processes) helps isolate errors/memory, but it doesn't automatically fix race conditions within each service.

### How to answer in the interview
Answer at 3 levels: (1) briefly define each concept, (2) state the relationship: 1 JVM is 1 process containing many threads, cores are the hardware resources that execute them, (3) give a real backend example (Tomcat thread pool, I/O-bound vs CPU-bound) and one trade-off (many threads are good for I/O waiting, but context switching and lock contention have costs).

> Senior tip: when investigating "high CPU" on production, always look at **load average** and **thread dump** ({{jstack}}). CPU 100% due to 4 threads doing heavy computation (normal if enough cores) is very different from CPU 100% due to 500 threads contending for locks/context switching. Thread counts and thread states (RUNNABLE, BLOCKED, WAITING) give you the root cause.`,
    follow: ['When should you increase the number of threads, and when should you increase the number of instances (processes)?', 'What is context switching, and why do too many threads slow down a system?']
  },
  'primer-019': {
    q: 'Stack and heap: how do they differ at the OS and JVM level? Where does a variable/object in Java reside, and why does understanding this help you debug bugs?',
    a: `**Summary:**
- **Stack** is memory allocated for **each thread**, used to store function calls (stack frames), local primitive variables, and references. Allocation/deallocation is very fast, automatic when entering/leaving a function.
- **Heap** is memory **shared by the whole process/JVM**, used to store objects ({{new ...}}). Managed by the Garbage Collector (GC) in Java.
- Understanding stack/heap helps explain {{StackOverflowError}} (deep recursion, full stack), {{OutOfMemoryError: Java heap space}} (too many objects/objects held too long), and why passing an object into a function "seems modifiable".

### Real-world context
Devs often hear "stack overflow", "heap dump", "memory leak" but sometimes confuse the two memory areas. Consequence: debugging in the wrong direction (increasing heap when the error is due to stack recursion), or not understanding why modifying an object field inside a function changes it outside too.

### Terminology (explained first time)
- **Primitive**: basic Java data types such as {{int}}, {{long}}, {{boolean}}, {{double}} — store the value directly, not objects.
- **Reference**: a variable that "points to" an object on the heap; the reference itself is just a small address/reference, not the whole object.
- **Stack frame**: the packet of information for one function call (parameters, local variables, return address). Calling a function → pushes 1 frame onto the stack; function returns → pops the frame.
- **GC (Garbage Collector)**: the mechanism that automatically finds objects on the heap no longer referenced by anyone and reclaims memory.

### How each works

#### How the stack works
~~~java
int calc(int a) {          // frame calc: stores a, local variables
  int b = a * 2;           // b (primitive) is in frame calc
  return b;
}
void main() {
  int x = 10;              // frame main: x is here
  int y = calc(x);         // call calc -> push frame calc onto stack
}                          // calc done -> pop frame calc; main done -> pop frame main
~~~
- Entering a function: stack "goes up" (push frame). Leaving a function: the frame disappears immediately, no GC needed.
- Each thread has its own stack (size usually configured by {{-Xss}}, e.g. 512KB-1MB). Recursion too deep → runs out of space → {{StackOverflowError}}.

#### How the heap works
~~~java
void main() {
  User u = new User("An"); // (1) new User(...) creates an object on the HEAP
                            // (2) variable u is a reference, on the STACK (frame main)
  u.age = 20;               // follow reference u to the object on the heap, modify the field
}
~~~
- {{new}} always creates an object on the heap. Variable {{u}} on the stack only holds the "address" pointing to that object.
- When no reference points to the object anymore (and it's unreachable), GC **may** reclaim it (not immediately).

### Visual diagram (ASCII)
~~~text
Thread Stack (own)                 Heap (shared JVM)
+---------------------+             +---------------------------+
| frame: calc         |             | User@0x1A { name:"An",   |
|   a = 10 (int)      |             |             age:20 }      |
|   b = 20 (int)      |             |                           |
+---------------------+             | int[]@0x2B [1,2,3]        |
| frame: main         |      +----->|                           |
|   x = 10 (int)      |      |      | String@0x3C "An"          |
|   u = ref 0x1A -----+------+      +---------------------------+
|   arr = ref 0x2B ---+----------------------^
+---------------------+
Primitives/references: on stack. Objects/arrays: on heap.
~~~

### The "pass by value" example that's easy to confuse
~~~java
void rename(User u) { u.name = "Binh"; }   // modifies the object field on the heap -> outside sees the change
void reassign(User u) { u = new User("Chi"); } // reassigns the local reference u -> outside NOT changed
~~~
Java always passes **the value of the variable**: with objects, the value passed is a copy of the reference (pointing to the same heap object). So modifying a field is visible, but assigning {{u}} to a new object only changes the local copy of the reference inside the {{reassign}} frame.

### Comparison table
| Criterion | Stack | Heap |
|---|---|---|
| Scope | One stack per thread | Shared by the whole JVM/process |
| Contains (Java) | Stack frame, local primitives, references | Objects, arrays, instance fields |
| Managed by | Automatic on entering/leaving function | GC reclaims unused objects |
| Allocation speed | Very fast | Slower, can cause GC pauses |
| Typical error | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Size | Small (default ~1MB/thread) | Large, configured with {{-Xmx}} |

### Common pitfalls in production
- **{{StackOverflowError}}**: usually due to recursion without a base case or a very deep tree. Fix: add a termination condition, or switch to a loop/clear data structure (Deque) instead of recursion.
- **{{OutOfMemoryError: Java heap space}}**: objects accumulate without being GC'd (logical memory leak: unbounded cache, holding references in static {{List}}, listener not removed). Debug with heap dump ({{jmap}}) and analyze which objects occupy the most memory.
- **Increasing {{-Xmx}} is a fire-fighting measure, not the root cause**: if there's a leak, a bigger heap only helps it survive longer, then OOMs anyway.
- **Creating too many threads**: each thread needs its own stack → 2000 threads × 1MB stack ≈ 2GB just for stack (besides heap). Can cause {{OutOfMemoryError: unable to create native thread}}.

### How to answer in the interview
State clearly: stack is for function calls/local variables per thread, heap is for objects shared and managed by GC. Draw a quick diagram "reference on stack points to object on heap". Include 2 classic errors (StackOverflowError vs OOM heap) and how to distinguish debugging direction. Emphasize Java passes by value of reference (explain with the rename/reassign example).

> Senior tip: if you suspect a memory leak, don't guess. Take a **heap dump** when memory is high ({{jmap -dump:live,format=b,file=heap.hprof <pid>}}) and open it in Eclipse MAT: look at the "Dominator Tree" to see which object holds the most memory and who holds a reference to it. That is how you find a leak based on evidence, instead of "try increasing Xmx".`,
    follow: ['How do StackOverflowError and OutOfMemoryError differ in cause and handling?', 'Why is String immutable in Java, and how is that related to the heap?']
  },
  'primer-020': {
    q: 'TCP three-way handshake: what is it? Why does a backend need a connection pool instead of opening a new connection for every request?',
    a: `**Summary:**
- **TCP** (Transmission Control Protocol) is a reliable data transfer protocol over the network: before sending data, both sides must "shake hands" in three steps to establish a connection, and close the connection when done.
- **3-way handshake**: Client sends {{SYN}} (connection request) → Server replies {{SYN-ACK}} (agrees, requests connection back) → Client sends {{ACK}} (confirmation). Only then is data sent.
- Each connection setup and teardown takes time (multiple network round-trips) and resources (socket, kernel memory, ports). A **connection pool** keeps a number of connections open for reuse across many requests, reducing latency and avoiding overload.

### Real-world context
A Spring Boot API calls the database for each request. If every DB call opens a new TCP connection to Postgres and closes it, you pay tens of milliseconds extra for handshake/TLS and create/destroy resources continuously. Under high traffic, the DB may reject connections due to too many. This is why HikariCP (Spring Boot's default connection pool) is almost always present.

### Terminology
- **Socket**: connection endpoint, bound to an (IP address, port) pair. Applications read/write data through sockets.
- **Round-trip time (RTT)**: time for a packet to go from client to server and get a response. Within the same data center it can be < 1ms; across regions 50-200ms.
- **SYN, ACK**: flags in a TCP packet. SYN = synchronize (request to sync/initiate), ACK = acknowledge (confirmation).

### TCP 3-way handshake step by step
~~~seq
title: TCP 3-way handshake
actors: Client | Server
Client -> Server: 1) SYN, seq=x (request to open connection)
Server --> Client: 2) SYN-ACK, seq=y, ack=x+1 (agree)
Client -> Server: 3) ACK, ack=y+1 (confirm, connection ready)
Client -> Server: 4) Send data (HTTP request, DB query...)
Server --> Client: 5) Return data
note Client..Server: Closing the connection takes additional steps (FIN/ACK)
~~~

- Steps 1-3 occur **before** the first byte of application data is sent. It takes at least 1 RTT (client waits for step 2) before step 3 can carry data in some optimizations, but essentially there is still setup cost.
- If TLS is used (HTTPS/encrypted DB connection), after the TCP handshake there is an additional TLS handshake → 1-2 more RTTs.

### Why a connection pool is necessary
~~~text
No pool (each request opens a new DB connection):
  Request 1: [TCP handshake][TLS?][DB auth][Query][Close] ~ 15-50ms overhead + query
  Request 2: [TCP handshake][TLS?][DB auth][Query][Close] ~ 15-50ms overhead + query
  100 req/s * 30ms overhead = 3 seconds of CPU/network wasted per second (impossible!), plus pressure from socket creation

With pool (HikariCP keeps 10 connections open):
  Startup: open 10 connections once
  Request 1: [borrow connection from pool][Query][return connection] ~ query + <1ms borrow/return
  Request 2: [borrow connection from pool][Query][return connection] ~ reuse, no handshake
~~~

Specific benefits:
1. **Lower latency**: skip handshake/auth cost per request.
2. **Limit number of connections**: DB (Postgres, MySQL) handles a limited number of connections well (depending on configuration, usually dozens to a few hundred). Pool sets {{maximumPoolSize}} so you don't fire thousands of connections that crash the DB.
3. **Resource reuse**: reduce socket create/destroy, reduce GC/memory pressure.

### HikariCP configuration example (Spring Boot)
~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/orders
    hikari:
      maximum-pool-size: 10       # max 10 concurrent connections to DB
      minimum-idle: 5             # keep at least 5 idle connections ready
      connection-timeout: 30000   # wait max 30s to borrow a connection, then error
      max-lifetime: 1800000       # recreate connection after 30 minutes (avoid "stale" connections cut mid-way)
~~~
- {{maximum-pool-size}} is not "the bigger the better". DB also processes concurrent queries limited by CPU/IO/disk; too large a pool → DB overloaded, context switching increases. A commonly cited rule of thumb: small pool, tied to DB core count (measure in practice).

### Trade-off table
| Approach | Pros | Cons | When to use |
|---|---|---|---|
| Open a new connection per request | Simple, no state kept | Slow, resource-intensive, easily overloads DB | Almost never for real backend traffic |
| Connection pool | Fast, controls DB load | Needs configuration; connections can "run out" if held too long | Default for DB, HTTP client (Apache HttpClient, OkHttp pool) |
| Keep 1 fixed connection | Low overhead | No concurrency; one connection failure kills everything | Single-threaded tools, simple batch |

### Common pitfalls
- **Not returning the connection to the pool**: borrow a connection and forget {{close()}} (or don't use try-with-resources). Pool runs out → new requests wait until {{connection-timeout}} → cascading failure. Symptom: log "Connection is not available, request timed out".
- **Holding a connection while calling a slow external API**: borrow connection, call another HTTP service taking 5s, then query DB and return. Connection is "hogged" uselessly → pool runs out. Rule: keep DB connections as short as possible.
- **{{maximum-pool-size}} too large**: e.g. 200 connections × 10 app instances = 2000 connections to 1 DB → DB choked. Must count across all instances.
- **Confusing TCP handshake with HTTP**: HTTP is an application protocol running *on top of* TCP (HTTP/1.1, HTTP/2). HTTPS adds TLS on top. Connection pooling applies at both TCP/HTTP level (keep-alive/pool) and DB level (JDBC pool).

### How to answer in the interview
Describe the 3-way handshake (SYN, SYN-ACK, ACK) and emphasize round-trip + resource cost. Then explain connection pool reuses connections, reduces latency, limits DB load. Give HikariCP example and a real-world mistake (not returning connections / pool too large). If the interviewer goes deeper, connect to TLS handshake and HTTP keep-alive.

> Senior tip: when an API suddenly slows down, check the **connection pool wait time** and **active vs max connections** metrics (HikariCP/Micrometer expose these). Pool wait rising before DB CPU increases is a sign the app is "queuing for connections" — the cause is usually slow queries holding connections too long or an unsuitable pool size, not necessarily a "weak DB".`,
    follow: ['What usually causes connection pool exhaustion, and how do you investigate it?', 'How is HTTP keep-alive related to reusing TCP connections?']
  },
  'primer-021': {
    q: 'How does DNS resolve domain names to IP addresses? When a Spring Boot application calls https://api.partner.com, what happens behind the scenes?',
    a: `**Summary:**
- **DNS** (Domain Name System) is like the Internet's "phone book": it converts easy-to-remember names ({{api.partner.com}}) into **IP addresses** (e.g. {{203.0.113.10}}) so computers know where to send packets.
- DNS resolution usually goes through multiple steps: cache on the machine/application → OS/resolver of ISP → if not known then asks **root server** → server managing the domain suffix (TLD, e.g. {{.com}}) → **authoritative DNS server** for {{partner.com}}.
- Results are cached by **TTL** (time to live). Understanding DNS helps debug errors like "calls work sometimes, not others", first-connection latency, and incidents when changing server IP.

### Real-world context
Java backends often call partner APIs, connect to DBs by hostname, or reach internal services via Kubernetes DNS. When "switching to a new server IP but the app still calls the old IP", or "timeouts for a few seconds on the first call", the cause is often DNS cache/TTL, not Java code.

### Terminology (explained first time)
- **Domain name**: easy-to-remember string, e.g. {{api.partner.com}}.
- **IP address**: numeric address of a machine on the network (IPv4 like {{203.0.113.10}}, or IPv6). Network packets are routed by IP.
- **Resolver**: component that "asks around" for DNS and returns the result (usually provided by the OS or ISP/company DNS).
- **Authoritative DNS server**: server holding the official record for a domain (the final correct answer source).
- **TTL (Time To Live)**: time (seconds) a DNS result may be cached before being re-queried.
- **Record (record)**: {{A}} maps name → IPv4, {{AAAA}} → IPv6, {{CNAME}} → alias pointing to another name.

### Resolution step by step
~~~seq
title: DNS resolution for api.partner.com
actors: App | OS/Resolver | Root | TLD(.com) | Auth(partner.com)
App -> OS/Resolver: 1) What is the IP of api.partner.com?
OS/Resolver --> App: 2) In cache? Return immediately
OS/Resolver -> Root: 3) Ask root: who manages .com?
Root --> OS/Resolver: 4) Address of .com TLD server
OS/Resolver -> TLD(.com): 5) Ask .com: who manages partner.com?
TLD(.com) --> OS/Resolver: 6) Address of authoritative server for partner.com
OS/Resolver -> Auth(partner.com): 7) What is the IP of api.partner.com?
Auth(partner.com) --> OS/Resolver: 8) A = 203.0.113.10, TTL 300s
OS/Resolver --> App: 9) Return IP, cached by TTL
~~~

In practice, the resolver usually has cache, so steps 3-8 rarely run for every call. The app's step 1 may also go through JVM/HTTP library cache.

### Concrete example
- You change server {{api.partner.com}} from IP {{203.0.113.10}} to {{203.0.113.20}}, old TTL is 300 seconds (5 minutes).
- Within 5 minutes after the change, some clients still receive the old IP from cache → call the old server. So when migrating infrastructure, people usually **lower TTL in advance** (e.g. down to 60s) to reduce "propagation" time.
- A Java request for the first time in a process may be slower by 20-100ms due to DNS lookup (depending on network/cache). Subsequent requests are faster if still cached.

### DNS and Java applications
Spring Boot calls: RestClient.get().uri("https://api.partner.com/v1/pay").retrieve()
  1) Need IP of api.partner.com → DNS lookup (JVM/OS resolver)
  2) Have IP → open TCP to IP:443 → TLS handshake → send HTTP request
- JVM has a DNS cache mechanism (configured via {{networkaddress.cache.ttl}} in JDK security properties; default behavior varies by version/security config). Cache too long → app doesn't see new IP; turn cache off completely → continuous lookup cost.
- In Kubernetes, service names (e.g. {{orders.default.svc.cluster.local}}) are resolved by internal DNS. Pod scale/IP change → DNS updates; client must honor TTL and not hard-code IPs.

### Quick reference of common record types
| Record | Meaning | Example use in backend |
|---|---|---|
| A / AAAA | Name → IPv4 / IPv6 address | Point {{api.example.com}} to server IP |
| CNAME | Name → another name (alias) | {{www}} points to {{lb.cloudprovider.net}} |
| TXT | Text string | Domain verification, SPF/DKIM email config |

### Common pitfalls
- **Hard-coding IP** in configuration instead of using hostname: when server IP changes/scales → must change config and redeploy. Hostname + DNS is more flexible.
- **Confusing DNS with "no network"**: {{UnknownHostException}} usually means name resolution failed (DNS error, wrong name, network blocks DNS) — different from {{ConnectException}} (reached IP but can't connect to port).
- **TTL too long when preparing migration**: forget to lower TTL in advance → some traffic still sticks to old IP.
- **Multiple cache layers** (HTTP library, JVM, OS, resolver) make "changed DNS but app still goes to old IP" hard to understand. When debugging, check from the exact environment the app runs in ({{nslookup}}, {{dig}}, or logs).

### How to answer in the interview
Explain DNS maps domain → IP. Describe the query flow briefly: cache → resolver → root/TLD → authoritative (with diagram). Explain TTL/cache role and a real backend example (IP change, {{UnknownHostException}}, DNS in Kubernetes). Emphasize: Java apps depend on DNS, so configuring hostname, TTL, and monitoring resolution errors is very important in operations.

> Senior tip: when encountering "intermittent" connection errors to a partner, log both the **hostname and resolved IP** (if the library allows) along with DNS lookup time. Many "app is broken" incidents are actually DNS returning wrong/stale IPs, one cluster node answering differently than another, or TTL/cache causing inconsistent behavior across instances.`,
    follow: ['How do UnknownHostException and ConnectException differ, and how do you narrow down the cause?', 'Why do people lower DNS TTL in advance when switching a server to a new IP?']
  },
  'primer-022': {
    q: 'How does HTTPS use TLS to secure connections? Explain simply the TLS handshake process (key exchange, certificate) between client and server.',
    a: `**Summary:**
- **HTTPS** is HTTP running on **TLS** (Transport Layer Security). TLS helps: (1) **encrypt** data so eavesdroppers can't read it, (2) **authenticate** the server via **digital certificates** to prevent impersonation, (3) **integrity** to detect data modified in transit.
- **TLS handshake** happens after TCP connection: client and server agree on version/encryption, server sends its certificate (containing public key), client verifies the certificate, both sides create a **session key** shared to encrypt data afterwards. The handshake takes extra time (round-trips) so it affects first-connection latency.

### Real-world context
Java backends almost always use HTTPS: partner APIs, internal APIs via ingress, webhooks. Common errors: {{SSLHandshakeException}}, expired certificates, untrusted CA, hostname mismatch. If you don't understand the handshake, you'll "turn off SSL verification" to make it work — very dangerous.

### Terminology (explained first time)
- **Encryption**: transforming data into "scrambled" form; only someone with the right key can decrypt and read.
- **Asymmetric encryption**: has a **public key** (public) and **private key** (secret). Used for secure key exchange/setup. Slower than symmetric encryption.
- **Symmetric encryption**: both sides use the **same secret key** to encrypt/decrypt. Fast, used to encrypt actual data after handshake.
- **Digital certificate**: server's "ID card", signed by a **CA** (Certificate Authority, trusted certificate issuer) confirming: domain name bound to server's public key.
- **CA/Trust store**: list of CAs the client trusts. On the JVM it's the truststore file (default {{cacerts}}). Certificates not signed by a trusted CA → client rejects.

### Simplified TLS handshake (TLS 1.2 simplified / general idea)
~~~seq
title: TLS handshake (simplified)
actors: Client (app/browser) | Server (api.partner.com)
Client -> Server: 1) ClientHello: TLS versions supported, cipher list
Server --> Client: 2) ServerHello: selected cipher
Server --> Client: 3) Certificate: certificate (public key, domain, CA signature)
Server --> Client: 4) ServerHelloDone
Client -> Client: 5) Verify certificate: trusted CA? still valid? matches domain?
Client -> Server: 6) Exchange secret to create session key
note Client..Server: 7) Both compute the same session key (symmetric)
Client -> Server: 8) Finished (encrypted with session key)
Server --> Client: 9) Finished (encrypted with session key)
Client -> Server: 10) HTTP request/response encrypted with session key
~~~

(Note: TLS 1.3 is more compact, reduces round-trips and drops weak ciphers; but the core idea remains: verify certificate + agree on session key + encrypt data with symmetric encryption.)

### Everyday example
- You send a confidential letter: (1) ask the partner for their **public key** and verify it's really them (check certificate), (2) you create a **box key** (session key) and send it in a way only they can open, (3) from then on both sides use the same box key to exchange quickly. The mail carrier sees the envelope but can't open it (encryption).

### Concrete example with figures
- First call to {{GET https://api.partner.com}}:
  - TCP handshake: ~1 RTT.
  - TLS handshake: additional ~1-2 RTT (depending on TLS 1.2/1.3, with or without resume).
  - Intra-region RTT 1ms → adds a few ms; cross-country RTT 100ms → adds 100-200ms before receiving the first HTTP byte.
- That's why HTTP clients use **connection pool/keep-alive** with HTTPS too: reuse already-handshaked connections, avoiding repeated TLS cost.

### Table: what HTTPS/TLS protects against / doesn't protect against
| HTTPS/TLS helps | HTTPS/TLS does not solve by itself |
|---|---|
| Eavesdroppers on the network can't read content | Your server has application vulnerabilities (SQL injection, broken auth) |
| Verify you're talking to the right domain (if certificate verified) | Decrypted data leaked in logs, DB, or due to app bugs |
| Detect content modified in transit | Access control: who can call the API (needs token/auth) |

### Common pitfalls
- **{{SSLHandshakeException: PKIX path building failed}}**: JVM doesn't trust the certificate (CA not in truststore, or self-signed cert). Correct fix: import the appropriate CA/certificate into the truststore or use a certificate from a trusted CA. **Do not** disable verification globally.
- **Expired certificate**: server forgot to renew → all clients reject. Monitor expiry dates.
- **Hostname mismatch**: certificate issued for {{api.partner.com}} but you call by IP or a different name.
- **Confusing TLS termination**: many systems let load balancer/ingress handle TLS, traffic behind is plain HTTP within. Understand where encryption ends, don't expose plain HTTP to the internet.

### How to answer in the interview
State 3 goals: encryption, authentication, integrity. Describe handshake at the idea level: client receives certificate → verifies (CA, expiry, domain) → both sides agree on symmetric session key → encrypt data. Explain why handshake costs RTT and relate to connection reuse. Include 1-2 real errors (expired certificate, PKIX) and correct handling (don't disable verification).

> Senior tip: always monitor **certificate expiry dates** and automate renewal (Let's Encrypt/ACM). "HTTPS suddenly dies across the whole system" because of a forgotten renewal is a very common and entirely preventable outage. When debugging {{SSLHandshakeException}}, temporarily enable {{-Djavax.net.debug=ssl,handshake}} in a safe environment to see exactly which step fails (but be careful with sensitive data in logs).`,
    follow: ['What does TLS protect you from, and what does it not protect against?', 'When you get PKIX path building failed in Java, how do you handle it correctly?']
  },
  'primer-023': {
    q: 'What is a database index, and how does a B-tree index work? Explain intuitively why indexes speed up queries and when indexes are not useful.',
    a: `**Summary:**
- An **index** in a database is an auxiliary data structure created on one or more columns to help the DB find rows faster, like the index at the end of a book: instead of reading the whole book, you look up the index to jump to the right page.
- A **B-tree** (balanced tree) is the most common index type (default in Postgres/MySQL). It organizes keys in order in a multi-way tree with low height, so finding a value usually requires reading only a few **nodes** (disk blocks) instead of scanning the whole table.
- Trade-off: index speeds up {{SELECT}} but slows down {{INSERT/UPDATE/DELETE}} and takes extra space, because the DB must update both the table and every related index.

### Real-world context
Backend devs often encounter: "users table with 10 million rows, query {{WHERE email = ?}} takes 3 seconds", add an index → 5ms. But also "already have an index but query still slow". Understanding B-tree intuitively helps you know when indexes help, when they don't, and how to place indexes correctly.

### Terminology (explained first time)
- **Full table scan**: DB reads row by row to check conditions. Large table → very slow, heavy disk I/O.
- **B-tree / B+tree**: balanced tree structure. Here "B-tree" is used as the common term; many DBs (InnoDB, Postgres) use B+tree variants (leaves organized optimally for range scans). The idea of searching via a balanced tree is the same.
- **Node/page**: a "block" of tree data, usually corresponding to one disk page (e.g. 8KB or 16KB).
- **Selectivity**: a column with many distinct values → high selectivity (index useful). A column with only a few values (e.g. {{status}} only ACTIVE/INACTIVE where 95% is ACTIVE) → index of little use.

### Visual: without index vs with B-tree index
orders table (10,000,000 rows), find WHERE order_code = 'ORD-773812'

Without index (full table scan):
  Read row 1? no. Row 2? no. ... Row 7,738,120? YES.
  May need to read millions of rows (many disk pages).

With B-tree index on order_code (simple illustration):
                    [M]
                   /   \
             [D,H]         [R,W]
            /  |   \       /  |  \
        [A-C][E-G][I-L] [N-Q][S-V][X-Z]  (leaf nodes point to actual rows)

  Find 'ORD-773812' (starts with 'O'):
    1) Root [M]: 'O' > 'M' -> go right branch
    2) Node [R,W]: 'O' falls in range N-Q -> go middle branch
    3) Leaf node [N-Q]: found 'ORD-773812' -> get row address
  Only read ~3 nodes instead of millions of rows.

Key point: B-tree is **balanced** (every leaf branch has nearly the same depth) and each node contains many keys, so the tree is "short and wide". A table with millions of rows usually only needs to pass through 3-4 node levels.

### Concrete SQL example
~~~sql
-- Create index on frequently filtered column
CREATE INDEX idx_orders_code ON orders(order_code);

-- Query benefits: DB looks up index -> finds quickly
SELECT * FROM orders WHERE order_code = 'ORD-773812';

-- Composite index (multiple columns): useful when filtering/sorting by (customer_id, created_at)
CREATE INDEX idx_orders_cust_created ON orders(customer_id, created_at);
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
~~~

### When indexes are NOT useful (or little use)
| Situation | Why | Example |
|---|---|---|
| Function wrapping column in WHERE | DB finds it hard to use index on original value | {{WHERE YEAR(created_at)=2026}} → consider range: {{created_at >= '2026-01-01'}} |
| {{LIKE '%abc'}} (wildcard at start) | B-tree sorts from left; doesn't know where to start | Searching for a substring in the middle → consider full-text search |
| Low-selectivity column | Filters out too many rows; reading index then table costs more | {{WHERE is_active = true}} when 95% are true |
| Very small table | Scanning whole table is cheaper than using index | Configuration table with a few dozen rows |
| Only selecting a few columns but index doesn't cover | DB still has to jump back to table (lookup) | See "covering index" for important queries |

### Trade-off: indexes aren't free
- **Take up space**: additional B-tree structure on disk.
- **Slow down writes**: every {{INSERT/UPDATE/DELETE}} must update both the table **and** every related index. Write-heavy tables with too many indexes → noticeably slower writes.
- **Need maintenance/monitoring**: unused indexes only waste space. DB has statistics/EXPLAIN to check.

### Common pitfalls in production
- **"Add index to every WHERE column"**: writes slow down, memory/space waste. Only index columns actually used in important queries, based on real queries and {{EXPLAIN}}.
- **Forgetting foreign key indexes or frequently joined/filtered columns**: leads to full scans on large tables.
- **Wrong composite index order**: index {{(a,b)}} helps queries filtering {{a}} or {{(a,b)}}, but usually not well if only filtering {{b}}. Column order must match how queries use them.
- **Trusting "index means fast" without running {{EXPLAIN}}**: the optimizer may choose not to use the index.

### How to answer in the interview
Start with the book index analogy (intuitive), then describe B-tree: balanced tree, go from root down to leaf through a few comparisons, avoid full scan. State trade-offs (fast reads, slow writes, extra space). Give 2-3 cases where indexes don't help (function-wrapped column, {{LIKE '%...'}}, low selectivity) and mention {{EXPLAIN}} to verify.

> Senior tip: before adding an index on production, always run {{EXPLAIN (ANALYZE, BUFFERS)}} with real data/query to see the actual execution plan, estimated vs actual rows, and I/O. A "theoretically correct" index may still be skipped if statistics are stale or the condition returns too many rows. After adding, measure again and monitor impact on writes.`,
    follow: ['How do composite indexes (a, b) and (b, a) differ in the queries they support?', 'When do you choose NOT to create an index even though the column appears in WHERE?']
  }
});
