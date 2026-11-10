/*
 * English translation of js/data/lessons-architecture.js — task T1036. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-009 lesson-architecture-010
 */
App.i18n.content({
  'lesson-architecture-009': {
    title: 'Consistent hashing and virtual node: distributing keys, adding/removing a node moves only ~1/N',
    goals: [
      'Explain the problem of distributing keys across many nodes and why plain modulo breaks when the cluster changes',
      'Describe consistent hashing: the hash ring, key/node mapping, and why adding/removing a node moves only about 1/N of the keys',
      'Understand virtual nodes (vnode) for load balancing and simulate a HashRing in pure Java with TreeMap',
    ],
    body: `**Summary:** Consistent hashing places both nodes and keys on the same hash "ring"; each key belongs to the next node clockwise on the ring. When a node is added or removed, only the keys on the affected arc move (expected ~1/N), instead of reshuffling almost everything like {{hash(key) % N}}. A virtual node (vnode) assigns many positions to each physical node for a more even distribution.

### The problem: distributing data/cache across many machines
Suppose you have a cache system (like Redis used as a cache, but here we talk about the distributed principle) of N machines. Each key (for example a user id) must sit on exactly one machine for fast lookup. **Terminology:** a **node** is a machine/member that stores data in the cluster (like a cache server). A **shard/partition** is the slice of data one node is responsible for.

The naive way: {{nodeIndex = hash(key) % N}}. With 3 nodes, key "user42" with hash 125 gives {{125 % 3 = 2}} → node 2. This is fast and even when the hash is good. But what happens when the cluster changes?

### Why modulo % N breaks when a node is added or removed
When N changes (adding 1 new machine: N=3→4, or 1 machine fails: N=3→2), the divisor of the modulo changes, so **almost every key** gets a different index. Result: mass cache miss, all requests hitting the origin database at once — the phenomenon called *cache stampede*. With stateful data (sharded database), you must move almost all of the data.

~~~text
3 nodes (mod 3):  hash 5->2, hash 7->1, hash 8->2
4 nodes (mod 4):  hash 5->1, hash 7->3, hash 8->0   (almost everything moves)
~~~

We need a mapping where, when N changes, only a small fraction of keys must move.

### Consistent hashing: the hash ring
Consistent hashing (Karger et al., 1997; popularised by Amazon Dynamo) uses a **ring**-structured hash space:

1. Pick a hash function {{H}} producing values in a fixed range, e.g. 0..2^32-1, and treat that range as a circle (0 sits next to the largest value).
2. **Place nodes on the ring:** hash each node's name/address → each node has a position (angle) on the ring.
3. **Place keys on the ring:** hash each key → the key has a position on the ring.
4. **Mapping rule:** go clockwise from the key's position; the **first node** you meet owns that key. (If you pass the largest point on the ring, wrap around to the smallest node — the ring "wraps".)

~~~text
            0
        N_C(20)
     k1(15)   k2(30)
   N_A(350)       N_B(90)
            200

k1(15) goes clockwise to N_C(20)  -> N_C
k2(30) goes clockwise to N_B(90)  -> N_B
k3(100) goes clockwise to N_A(350)-> N_A (wraps past 0)
~~~

### Why adding/removing a node moves only ~1/N keys
- **Adding node D** between B and A: only the keys that previously went from B to A and now meet D first — i.e. the keys on **arc B→D** — move to D. All other keys stay put. On average that arc is 1/N of the ring.
- **Removing node B:** only the keys currently owned by B move to the next node (A). Other nodes' keys do not change.

This is the key point: a local change (1 node) causes only local movement (~1/N of the data). Compared with modulo, this is the difference between "dumping the whole warehouse" and "moving one shelf".

### Uneven distribution and virtual nodes
With few physical nodes, a few random hash points can cluster on one side of the ring → one node carries many keys, another nearly empty (load imbalance). Solution: **virtual node (vnode)** — each physical node is given **V positions** on the ring (e.g. 100–200 vnodes), by hashing synthetic names like {{nodeA#0}}, {{nodeA#1}}, ..., {{nodeA#199}}. With large V, each node occupies many small arcs spread across the ring → load is more balanced (roughly uniform). When node A leaves the cluster, all of A's vnodes are removed; the keys on those small arcs spread to many other nodes instead of piling onto one.

### How real systems do it (real names)
- **Amazon Dynamo** (2007 paper) uses consistent hashing + vnodes to partition data; this is why the technique became popular.
- **Apache Cassandra**: each node owns *tokens* (vnode positions) on the ring; configured via {{num_tokens}} (vnodes). The Partitioner (e.g. {{Murmur3Partitioner}}) hashes the partition key into a token.
- **Riak** and **Akka Cluster** ({{ConsistentHashingRouter}} / {{ConsistentHash}} in the library) also use a hash ring + vnodes.
- **Ketama** is the consistent hashing algorithm used in memcached clients.
- **Redis Cluster** does **not** use this ring-style consistent hashing: it uses 16384 *hash slots*, assigning fixed slot ranges to each master ({{CRC16(key) mod 16384}}). Same goal (move little when changing), different mechanism — senior interviews often ask you to tell the two apart.

### The simulation in the exercise (simplified)
The exercise writes a {{HashRing}} in pure JDK:
- Uses {{TreeMap<Integer, String>}} (an ordered red-black tree) to store {{vnode position → physical node name}}. Looking up "the next node clockwise" is exactly {{ceilingEntry(hash)}}; if null, wrap around with {{firstEntry()}}. This is exactly the role of the ring.
- **Deterministic hash function**: uses {{key.hashCode() & 0x7fffffff}} (clears the sign bit) so the result is stable, independent of time or randomness — only then is the test deterministic. (Real systems use Murmur3/xxHash for better spread; {{String.hashCode()}} is enough for the simulation.)
- No network, no replication, no health checks. Goal: understand the mapping mechanism and the move ratio.

~~~java
// Idea of ring lookup with TreeMap (O(log V*N))
int h = hash(key);
Map.Entry<Integer, String> e = ring.ceilingEntry(h); // first node >= h
if (e == null) e = ring.firstEntry();                // wrap around
return e.getValue();                                  // physical node name
~~~

### Common pitfalls
- **Forgetting to wrap around:** a key whose hash is larger than every vnode → {{ceilingEntry}} returns null. Must use {{firstEntry()}}.
- **Too few vnodes:** 1 vnode per node → uneven distribution, one node may receive double another.
- **Unstable/non-deterministic hash:** a different mapping each run, cache can never find its data again. Hash must be a pure function of the input.
- **Treating "move 1/N" as absolute:** it is an expectation when the hash is even and vnodes are plentiful; in practice it varies, and vnodes reduce the variance.

### Interview relevance
Short answer: "A plain {{mod N}} must remap almost everything when N changes. Consistent hashing places keys and nodes on a hash ring, the key goes clockwise to the first node; adding/removing one node only affects the keys on the adjacent arc, expected ~1/N keys moving. Use virtual nodes for load balancing. Cassandra uses vnodes/tokens on the ring; Redis Cluster uses 16384 hash slots — same goal of reducing movement, different mechanism." You can quickly draw the ring and point at the moved arc.

> Senior tip: In production, "moving a key" for a cache only means a temporary cache miss (acceptable, can be *warmed up* gradually). But for durable data (sharded DB), moving 1/N of the data when adding a node is still tens of GB and needs a safe *rebalancing* mechanism, bandwidth limits, and no interruption of reads/writes. Consistent hashing reduces *how much* must move — it does not perform the move itself.
`,
    exercises: [
      {
        title: 'Implement HashRing consistent hashing with virtual nodes',
        prompt: `Complete {{HashRing}} simulating consistent hashing:

- {{HashRing(int ringSize, int virtualNodesPerNode)}}: {{ringSize}} is the size of the hash space (use {{hash % ringSize}} to bring positions into [0, ringSize-1]); {{virtualNodesPerNode}} is the number of vnodes per physical node.
- {{int hash(String s)}}: returns {{(s.hashCode() & 0x7fffffff) % ringSize}} (deterministic, non-negative).
- {{void addNode(String nodeId)}}: adds {{virtualNodesPerNode}} vnodes. The position of vnode i (i from 0) is {{hash(nodeId + "#" + i)}}. Record {{nodeId}} as a physical node. (If two hashes collide on a position, overwriting is acceptable for this exercise.)
- {{void removeNode(String nodeId)}}: removes all vnodes of {{nodeId}} from the ring and from the physical node set.
- {{String getNode(String key)}}: returns the physical node owning {{key}} (next node clockwise: {{ceilingEntry}} by the key's hash, null becomes {{firstEntry}}). Empty ring returns {{null}}.
- {{int nodeCount()}}: number of physical nodes.
- {{int vnodeCount()}}: total vnodes on the ring.

Use {{TreeMap<Integer, String>}} for the ring. No external libraries, no random/time.`,
hints: [
          'TreeMap has {{ceilingEntry(key)}} returning the entry with the smallest key >= key (the next node on the ring). If null, use {{firstEntry()}} to wrap around.',
          'Each vnode: {{ring.put(hash(nodeId + "#" + i), nodeId)}} with i from 0 to virtualNodesPerNode-1. Remember to add/remove {{physical}}.',
          'Deterministic hash: {{(s.hashCode() & 0x7fffffff) % ringSize}}. {{& 0x7fffffff}} clears the sign bit of {{hashCode()}} (which can be negative).',
        ],
        explain: `TreeMap keeps the vnode positions sorted, so {{ceilingEntry}} finds the next node in O(log M) where M is the total vnodes — exactly the "walk clockwise on the ring" operation. {{& 0x7fffffff}} turns a possibly negative hash into a positive value (keeping the low 31 bits) so {{% ringSize}} yields a valid index.

Common pitfalls:
- Forgetting to wrap around: a key whose hash is larger than every vnode → {{ceilingEntry}} null → NullPointerException; use {{firstEntry()}}.
- Too few vnodes (1–2): clearly uneven load. Many vnodes (100–200) give roughly uniform distribution but cost memory and make add/removeNode slower (still acceptable since topology changes are rare).
- When removing a node, with the rare hash collision on a vnode position, removing by position must check the owner to avoid deleting another node's vnode.

On the move ratio: adding the (N+1)-th node (going from N to N+1) expects 1/(N+1) of keys to move to the new node; the test accepts a wide band because {{String.hashCode()}} is not a perfect hash, but the trend must be correct.`,
      },
    ],
    check: [
      {
        q: 'Compared with {{hash(key) % N}}, what is the core benefit of consistent hashing when adding 1 node to an N-node cluster?',
        options: [
          'Hashing becomes faster',
          'Only about 1/N of the keys must move instead of almost all of them',
          'There will never be a cache miss',
          'No hash function is needed any more',
        ],
        answer: 1,
        explain: `Adding one node only splits the adjacent arc on the ring, so only the keys on that arc change owner (~1/N). Modulo changes the divisor and remaps almost every key. Hashing is still needed and a temporary cache miss can still happen when a key moves.`,
      },
      {
        q: 'What problem does the virtual node (vnode) solve in consistent hashing?',
        options: [
          'Encrypting data on the ring',
          'Reducing hash collisions to zero',
          'Balancing load when few physical nodes create very skewed arcs on the ring',
          'Replacing TreeMap entirely',
        ],
        answer: 2,
        explain: `Each physical node gets many positions spread across the ring, so it owns many small arcs and total load is roughly even. Vnodes do not remove hash collisions, do not encrypt, and still need an ordered lookup structure (like TreeMap) to find the next node.`,
      },
      {
        q: 'In the {{HashRing}} implementation using {{TreeMap}}, why must we fall back to {{firstEntry()}} when {{ceilingEntry(h)}} returns {{null}}?',
        options: [
          'Because TreeMap is buggy with large keys',
          'Because the hash ring wraps around: a key whose hash is larger than every vnode belongs to the smallest vnode (wrapping past point 0)',
          'Because firstEntry is always the fastest node',
          'Because ceilingEntry cannot be used with integers',
        ],
        answer: 1,
        explain: `The hash space is a ring (head joins tail). A hash larger than the last vnode position means walking clockwise passes the top of the ring and meets the first vnode with the smallest position. Skipping this step causes null/errors for some keys.`,
      },
    ],
  },
  'lesson-architecture-010': {
    title: 'Distributed lock, GC pause and fencing token: why a lock with TTL can still overwrite data',
    goals: [
      'Understand what a distributed lock is for and why TTL/expiry still lets two clients write at once',
      'Explain the scenario where a GC pause (or stop-the-world) makes the lock expire while the client still thinks it holds it',
      'Implement a monotonically increasing fencing token and have storage reject stale tokens to prevent wrong overwrites',
    ],
    body: `**Summary:** A distributed lock tries to ensure only one process modifies a shared resource. But locks usually have a TTL (time to live) so a dead client does not hold the lock forever; if client A is **paused** for longer than the TTL (GC pause, network delay), the lock expires and client B is granted it. A wakes up and overwrites B's data. A **fencing token** is a monotonically increasing number issued with each lock acquisition: storage only accepts writes whose token is **greater than** every token seen so far, so A's late write (old token) is rejected.

### Terminology (explained on first use)
- **Distributed lock (khóa phân tán):** a "only one person may do it" mechanism where the parties run on **different machines** (no shared memory). Example: only one worker processes order #123. (Different from a lock inside a single Java process like {{synchronized}}.)
- **TTL (time to live):** the lock auto-expires after X seconds if not renewed, so a crashed client does not hold the lock forever.
- **Lease:** a time-limited right to hold the lock, like TTL.
- **GC pause / stop-the-world:** the JVM's Garbage Collector temporarily suspends all application threads to clean memory. It can last from milliseconds to several seconds (or more with a large heap or poor tuning). During that time the client is "frozen" and cannot send a heartbeat to renew the lock.
- **Fencing token:** an increasing number (1, 2, 3, ...) issued each time someone acquires the lock; used as a "turn number", and the receiving side only accepts newer turns.

### How real distributed locks work (real names, for intuition)
- **Redis {{SET resource value NX PX 30000}}**: writes the key only if it does not exist (NX) with a 30s TTL (PX). Extension: *Redlock* (Redis's algorithm) takes locks on multiple instances. Careful: renewal, clock drift, and there is still debate about absolute safety.
- **ZooKeeper**: creates an *ephemeral sequential node* (a temporary node with an increasing number). The client holds the lock when its node has the smallest number; that number naturally acts as a monotonically increasing fencing token. When the session expires, the ephemeral node disappears.
- **etcd**: provides {{Lease}} (with TTL, needs {{KeepAlive}}) and compare-and-swap transactions to hold a lock more safely.
- Java libraries: **Redisson** (Redis lock with a renewal watchdog) or **Curator** (ZooKeeper recipes).

The exercise simulates the bare minimum in pure Java (a single process), enough to see **why TTL alone is not enough**.

### The failure scenario: GC pause defeats TTL
~~~seq
title: GC pause makes the lock expire, wrong overwrite (no fencing)
actors: A | Lock | B | Storage
A -> Lock: acquire(resource)
Lock -> A: grant lock (token 1)
note A..A: A is GC-paused / network-delayed longer than TTL
Lock -> Lock: lock expires (TTL)
B -> Lock: acquire(resource)
Lock -> B: grant lock (token 2)
B -> Storage: write(data B)
Storage -> B: OK (wrote B)
note A..A: A wakes up, still thinks it holds the lock
A -> Storage: write(data A)
Storage -> A: OK but OVERWRITES B  (wrong!)
~~~

The danger: **the lock service cannot tell** "A is still alive but paused" from "A is dead". Expiring the lock is the right thing so the system does not stall; but A does not know it lost the lock. If it just trusts "I hold the lock" and writes straight through, data is corrupted.

### How the fencing token fixes this
The lock service issues a **monotonically increasing** number on every successful {{acquire}}: A gets 1, B gets 2. The client must send the token along with the write to storage. **Storage** remembers the largest token it has accepted for that resource and **rejects every write whose token is smaller** (a stale/"outdated" token):

~~~text
Storage has already accepted token 2 (B's write)
A sends write(token=1, data A)  -> 1 < 2  -> REJECTED  (safe)
~~~

~~~seq
title: Fencing token prevents overwrite
actors: A | Lock | B | Storage
A -> Lock: acquire
Lock -> A: token=1
B -> Lock: acquire (after A expired)
Lock -> B: token=2
B -> Storage: write(token=2, dataB)
Storage -> B: OK (max=2)
A -> Storage: write(token=1, dataA)  (A wakes up late)
Storage -> A: REJECTED because 1 < 2
~~~

**Who checks the token?** The **storage/resource** (where the write actually lands) must check it — not the client checking itself. Client A's perception is wrong. This is the point Martin Kleppmann stresses when analysing Redlock: the lock is only a "hint"; correctness must be enforced by fencing at the storage layer.

### The simulation (simplified)
- {{LockService.acquire(resource)}} always issues an increasing token ({{++counter}}) and records the holder. {{simulateExpiry(resource)}} simulates the TTL expiring (clears the holder) **without** sleeping/waiting — deterministic.
- {{Storage.write(resource, token, value)}} accepts if {{token >= the largest token seen so far}} for that resource, updates the max and stores the value; otherwise returns {{false}} (rejects the stale token). Whether to use {{>=}} or {{>}}: a repeated token of the same value is rarely valid in a correct flow, but for absolute safety one could use {{>}}; this exercise's convention is **reject when token < maxSeen** (old token), with a newer-or-equal-to-current-max token accepted per the increasing rule — see the exercise for the exact rule.
- **Not** simulated: network, clock, multiple lock instances, lease renewal, Redlock quorum. Goal: clearly see "pause → lose lock → late write" and "old token blocked".

### Common pitfalls
- **Relying on TTL only, no fencing:** enough for optimisation (avoiding two workers doing the same expensive work) but **not enough** when a wrong write would corrupt data/money/invariants.
- **Client compares tokens itself:** meaningless if the client is the one paused/wrong.
- **Token not monotonically increasing globally per resource:** if tokens are random or decreasing, storage cannot tell new from old.
- **Lock renewal (watchdog) does not replace fencing:** it lowers the chance of expiry, but cannot rule out a pause longer than every threshold or network partition.

### Interview relevance
Sample answer (key points): "A distributed lock usually has a TTL to avoid deadlock when a client dies. But a client can be GC-paused longer than the TTL: the lock expires, another client takes it and writes; the old client wakes up and still writes → data loss. TTL/lease only reduce risk, they do not guarantee correctness. Need a fencing token: the lock service issues an increasing number on each acquire, the client sends the token on write, storage only accepts token >= max seen, so a late write (old token) is rejected. ZooKeeper's sequential node is a natural token; with Redis you must design fencing at storage yourself. Distinction: a lock for efficiency (avoiding duplicate work) can be TTL-only; a lock protecting data correctness needs fencing."

> Senior tip: Before choosing a distributed lock, ask: "If two run at once, what is the consequence?" If it is only a duplicate email or recomputed cache (idempotent/tolerable), a simple lock + TTL is enough. If it is deducting money, overwriting order state, granting permissions — design **fencing/conditional writes** at the data layer (compare version/token, {{UPDATE ... WHERE version = ?}} / optimistic lock, or have storage check the token itself). Do not treat a distributed lock as a "magic amulet" for correctness.
`,
    exercises: [
      {
        title: 'LockService issues fencing tokens and Storage rejects stale tokens',
        prompt: `Simulate distributed lock + fencing token (deterministic, no sleep/wait):

{{class LockService}}
- {{long acquire(String resource)}}: grant the right to hold {{resource}} and return a **fencing token** that is a positive integer increasing **globally** across every acquire (first call returns 1, second 2, ...), regardless of resource.
- {{void simulateExpiry(String resource)}}: simulate the lock for {{resource}} expiring/yielding (used to build the paused-client scenario). Does not change the token counter.
- {{Long currentToken(String resource)}}: the token currently held for {{resource}}, or {{null}} if free (optional check).

{{class Storage}}
- {{boolean write(String resource, long token, String value)}}: if {{token}} is **smaller than** the largest token ever accepted for {{resource}}, reject and return {{false}}. Otherwise accept: update the max token for the resource, store {{value}}, return {{true}}. (First write on a resource with no prior writes accepts any valid token.)
- {{String read(String resource)}}: current value, or {{null}}.

Scenario that must be buildable (deterministic): A acquires → token t1; simulateExpiry; B acquires → token t2 > t1; B write(t2) OK; A write(t1) rejected; value still B's; A write(t1) again still rejected.`,
hints: [
          'LockService only needs a {{long nextToken}} counter incremented with {{++nextToken}} on each {{acquire}}, returning that value (increasing globally across all resources). {{simulateExpiry}} only clears the held-lock state.',
          'Storage keeps {{maxSeen}} per resource. If a max exists and {{token < max}} return {{false}}; otherwise update {{maxSeen}} and {{data}} and return {{true}}.',
          'Pause scenario: A acquires (t1) → {{simulateExpiry}} → B acquires (t2) → B write(t2) OK → A write(t1) must be rejected thanks to {{t1 < t2}}.',
        ],
        explain: `{{LockService}} simulates issuing a lease with an increasing identity. The important point is that the token increases **monotonically**: a token issued later is always larger, so "newer" can be compared with arithmetic. {{simulateExpiry}} lets us build the "A lost the lock" situation without waiting for real time, so the test is deterministic.

{{Storage}} is the side that **enforces fencing**: it trusts no client, only token order. Once B has written with a larger token, every smaller token is treated as "stale" and blocked — even if A retries many times. Each resource has its own max, so different locks/resources do not interfere.

Common pitfalls:
- Issuing tokens per resource but comparing them in the wrong context, or forgetting monotonicity (using random) → storage cannot tell new from old.
- Checking fencing on the client instead of in storage → a paused client still allows itself to write.
- Using {{token <= maxSeen}} rejects valid cases by mistake, or forgetting to update maxSeen on accept. The exercise's convention is explicit: "reject tokens smaller than the largest accepted token" ({{token < max}}) — enough to block A (t1) after B (t2) was accepted.

Simulation limits: a real system needs storage supporting conditional writes (e.g. write if version matches), and must handle crashes mid-flight, retries, clocks; but the fencing-token principle stays the same.`,
      },
    ],
    check: [
      {
        q: 'Why can a distributed lock with only a TTL (no fencing token) still cause a wrong data overwrite?',
        options: [
          'Because TTL makes the lock faster',
          'Because the client holding the lock can be GC-paused longer than the TTL, the lock expires and is granted to another client, then the old client wakes up and still overwrites',
          'Because TTL is always 0',
          'Because two clients are never paused',
        ],
        answer: 1,
        explain: `Expiring the lock when the TTL runs out is the correct behaviour to avoid stalling, but the paused client does not know it lost the lock. Without any mechanism in storage to reject the late write, the data gets overwritten.`,
      },
      {
        q: 'In the fencing token mechanism, which component MUST check the token to guarantee safety?',
        options: [
          'Only the client that is writing',
          'Only the lock service',
          'The storage/resource receiving the write (storage)',
          'The load balancer',
        ],
        answer: 2,
        explain: `A paused client may wrongly believe it still holds the lock, so checking on the client is not enough. Storage is where the write actually lands and must reject old (smaller than max seen) tokens. The lock service issues tokens but does not block late writes on storage's behalf.`,
      },
      {
        q: 'What property must a fencing token have so storage can distinguish a new write from an old one?',
        options: [
          'Random each time',
          'Monotonically increasing with each successful lock acquisition',
          'Always equal to the lock TTL',
          'The same for every client',
        ],
        answer: 1,
        explain: `A monotonically increasing token allows comparison: the larger token is the newer turn. Random/equal tokens cannot be ordered as new/old; tying the token to TTL does not create an order across acquisitions.`,
      },
    ],
  },
});
