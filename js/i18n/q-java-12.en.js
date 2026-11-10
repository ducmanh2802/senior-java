/*
 * English translation of js/data/q-java.js — task T652/T1177. Format: js/core/i18n.js (content overlay).
 * ids: core-014 collections-027 collections-028 modern-025 modern-026 modern-027 core-032 core-033 core-034 collections-029 collections-030 modern-028 modern-029
 */
App.i18n.content({
  'core-014': {
    q: "Autoboxing: the Integer cache (-128..127), {{==}} on wrappers, NPE when unboxing, and the cost of boxing inside a hot loop.",
    a: `**Summary:** autoboxing (automatic conversion between a primitive type like {{int}} and its wrapper class like {{Integer}}) converts primitive ↔ wrapper automatically; {{Integer.valueOf}} caches values from -128 to 127, so {{==}} (which compares references, not values) appears to work inside the cache but is wrong outside that range; unboxing (converting a wrapper back to a primitive) a {{null}} throws an NPE (NullPointerException - the program crashes because it tries to read a value from "nothing"); boxing inside a loop generates a large amount of GC (Garbage Collector - the JVM component that frees unused memory) garbage — use primitives or primitive collections.

### The Integer cache
- {{Integer.valueOf(int)}} caches [-128, 127] (the upper bound can be enlarged with the JVM flag {{-XX:AutoBoxCacheMax}}); {{new Integer()}} was deprecated (marked as outdated) in Java 9 and does not use the cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} have equivalent caches.
- {{Boolean}} caches the {{TRUE}}/{{FALSE}} singletons (single shared instances).

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // newly created -> different objects
System.out.println(a == b);      // true
System.out.println(c == d);      // false (comparing references!)
System.out.println(c.equals(d)); // true (comparing values)
~~~

### NPE when unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE on this line (implicit unboxing)
~~~
- It happens when: {{map.get(key)}} returns null and the result is assigned to a primitive; the ternary operator (a shorthand if/else) {{condition ? 1 : null}} is coerced to a primitive type; {{reduce}} on a stream with a null identity.
- Defend with: {{Objects.requireNonNull}}, {{Optional}} (a container that makes "may be absent" explicit), or an explicit null check before unboxing.

### Boxing cost on a hot path
- Every boxing operation creates a new object (outside the cache), which drives a high allocation rate ⇒ more young GC cycles, longer pauses.
- Example: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} is boxed and unboxed on every iteration.
- Fix it: use a primitive local ({{long sum = 0;}}), a primitive stream ({{LongStream}}, {{IntStream}}), or a primitive collection (a library like fastutil or Eclipse Collections that stores primitives directly).
- The JIT (Just-In-Time compiler - the JVM compiles hot code to fast machine code while the app runs) can remove boxing through escape analysis (proving an object never leaves the method), but this is never guaranteed.

### Comparing wrappers
- Always use {{equals}} for wrappers; {{==}} only works by cache luck and is a silent bug.
- {{Comparator.naturalOrder()}} is not safe against null wrappers (it throws NPE); {{Comparator.nullsFirst}} handles null explicitly.

### Under the hood: why the -128..127 cache
{{Integer.valueOf(int)}} checks whether the value falls inside the cache range (by default -128..127, upper bound extendable via {{-XX:AutoBoxCacheMax}}) and returns a pre-created object; outside the range it creates a {{new Integer}}. The compiler's autoboxing is literally a call to {{valueOf}}. That is why {{==}} "works" for small numbers in tests (ids 1, 2, 3) but fails with real data (id 1000) — the kind of bug that only shows up in production. {{Long}}, {{Short}}, {{Byte}}, {{Character}} (0..127) have similar caches; {{Double}} and {{Float}} do not.

### Real production example
An authorization service compared {{if (user.getTenantId() == resource.getTenantId())}} with the type {{Long}}. Every test was green because test data used tenants 1–50. In production, tenant ids from 1,000 upward made the reference comparison always false → legitimate users were denied access to their own resources (about 300 complaints in one morning). Fix: use {{Objects.equals}} or compare primitive {{long}} values; enable the SpotBugs warning RC_REF_COMPARISON; add test data with ids greater than 127. Another service also found a {{Map<Long, Long>}} accumulation loop creating 40 million {{Long}} objects per minute — switching to a {{long[]}}/primitive map cut GC time by 25%.

### Sample interview answer
"Autoboxing is the compiler automatically converting between primitive types and wrapper classes; under the hood it calls valueOf when boxing and intValue when unboxing. Integer.valueOf caches values from -128 to 127, so comparing two Integers with == only happens to work for small numbers — for larger values it compares references and returns false. That bug often passes tests because test data is usually small. I always use equals or compare primitive values. Unboxing a null wrapper throws a NullPointerException, which commonly happens when map.get returns null and the result is added to an int, or when an entity maps a nullable column to an int. In a hot loop, boxing creates a lot of garbage objects, so I use primitive types, arrays, or IntStream/LongAdder instead of collections of wrappers."

> Senior tip: enable {{-XX:+PrintCompilation}} and {{-XX:+PrintInlining}} to see whether the JIT actually removes the boxing; in latency-critical code, write it by hand with primitives or use a primitive collection library. Never assume "the JIT will deal with it" — measure with JMH.`,
    follow: ["Why does the {{Integer}} cache default to -128..127, and how do you widen it?","Why does the ternary expression {{flag ? 1 : null}} throw NPE when assigned to an {{int}}?","When should you use {{OptionalInt}} instead of {{Optional<Integer>}}?"]
  },
  'collections-027': {
    q: "A mutable key in a HashMap/HashSet \"loses\" elements: what is the mechanism, and how do you prevent it?",
    a: `**Summary:** {{HashMap}} (a hash table that maps a key to a value) and {{HashSet}} (a set of unique elements, implemented internally with a {{HashMap}}) locate an element by its {{hashCode()}} (a number derived from the object, used to pick a bucket - a storage slot) at the moment of {{put}}/{{add}}. If you use a mutable key (an object whose fields can change) and then modify a field that participates in {{hashCode}}/{{equals}} after inserting it, {{get}}/{{contains}}/{{remove}} will compute a new hash, search a different bucket, and "not see" the old entry — even though the entry still sits inside the map (a logic bug and a potential memory leak). The simplest prevention: use only immutable keys.

### What - why - how (step by step)
- **Step 1 - put:** {{map.put(key, value)}} calls {{key.hashCode()}}, computes the bucket index, and stores the entry (key, value) in that bucket. For example, a key with {{hashCode() = 42}} goes into bucket 42.
- **Step 2 - mutate (the mistake):** you change a field of the key (for example {{key.setName("X")}}) and that field is used by {{hashCode}}. Now {{key.hashCode()}} may return {{99}}. But the old entry **still sits untouched in bucket 42** — {{HashMap}} is never notified about this change.
- **Step 3 - get/remove:** {{map.get(key)}} recomputes the hash → {{99}}, searches bucket 99 → finds nothing → returns {{null}}. The entry in bucket 42 becomes an "orphan": unreachable by key, and {{remove(key)}} cannot delete it either. {{size()}} still counts it; iterating {{entrySet()}} may still show it.
- **{{HashSet}}:** it is essentially {{HashMap<E, PRESENT>}}, so it has exactly the same problem.

~~~java
import java.util.*;

class BadKey {            // mutable: a setter changes hashCode
    String name;
    BadKey(String n) { this.name = n; }
    public int hashCode() { return Objects.hash(name); }
    public boolean equals(Object o) {
        return o instanceof BadKey k && Objects.equals(name, k.name);
    }
}

Map<BadKey, String> map = new HashMap<>();
BadKey k = new BadKey("A");
map.put(k, "value");          // entry stored in the bucket for hash("A")
k.name = "B";                 // hashCode changes -> hash("B")
System.out.println(map.get(k));    // null  (searches bucket hash("B"))
System.out.println(map.size());    // 1     (the orphan entry still exists)
// Safe update: remove BEFORE changing the field, then put it back
~~~

### Real production example
Assume a service caches access permissions in memory: {{HashMap<UserKey, Permissions>}} with ~200,000 users and ~5,000 QPS (queries per second) checking permissions. {{UserKey}} originally included {{department}} in {{hashCode}}/{{equals}}. When a user changed department, the HR sync thread called {{userKey.setDepartment("Sales")}} on the exact key object already stored in the map (because it kept a reference). After that, {{map.get(userKey)}} returned {{null}} → the system treated the user as "having no permissions" and returned 403 for about ~300 requests/minute from users who changed department. The old entry still occupied memory (unreachable by {{get}}/{{remove}} with the changed key), and the map grew ~15% over a few weeks. Investigation: a heap dump showed many entries with the "same" meaning but hashes spread across buckets; reproduced by a mutate-key test. Fix: change {{UserKey}} to a {{record UserKey(String userId)}} (immutable, using only a stable id, not {{department}}); when HR changes a department, {{remove}} the old key and {{put}} the new key/permission. Result: the false 403 errors disappeared and the map size stayed stable.

### When to use / not use
| Situation | Recommendation |
|---|---|
| Lookup key in {{HashMap}}/{{HashSet}} | Use only immutable types: {{String}}, {{Integer}}, {{Long}}, {{UUID}}, a {{record}} whose components are immutable |
| JPA entity as a key | Be very careful: a generated id is null before persist, a business key may change; usually avoid using an entity as a key |
| You must change a key | {{remove()}} with the old state → change the field → {{put()}} again. If you already changed it, {{remove(key)}} with the new state will not find it |

### Production pitfalls
- **JPA entity:** {{hashCode}} uses an {{@GeneratedValue}} id → the id is {{null}} while transient; after {{persist}} the id gets a value, the hash changes, and the entity "disappears" from a {{HashSet}}. Use a stable business key or a constant hash based on the class.
- **{{TreeMap}}/{{TreeSet}}:** suffer a similar problem when the attribute used for comparison changes (the tree loses its ordering), even though the mechanism is not hash buckets.
- **Assuming the entry was deleted:** the entry is not deleted — it just sits in the wrong bucket. This is a hard-to-detect leak because it throws no exception.

### Sample interview answer
"HashMap locates an element by the key's hashCode at the time of put: it computes the hash, picks a bucket, and stores the entry there. If the key is a mutable object and I change a field that participates in hashCode or equals after put, the new hashCode will differ, so when I call get or remove HashMap computes the new hash and looks in a different bucket — the result is null even though the old entry is still inside the map. This is a nasty bug because there is no exception; the element just silently goes missing and it can also leak memory. The standard prevention is to use only immutable keys such as String, numbers, or a record with immutable components. With a JPA entity you must be even more careful because a generated id changes after persist, so I usually avoid using an entity as a key or I use a stable business key. If I really must change a key, the rule is remove before the change, change it, then put it back."

> Senior tip: treat this as a review rule: "every key put into a {{HashMap}}/{{HashSet}} must be immutable." If you see a setter on a class used as a key, that is a code smell. With an entity, add a test: {{set.add(entity); persist; assert set.contains(entity);}} — this test exposes a hashCode that depends on the id.`,
    follow: ["How does this affect HashSet?","Why is the entry still there but impossible to find?","What traps come from using a JPA entity as a key?"]
  },
  'collections-028': {
    q: "Choosing the structure for a 1 million entry in-memory cache: HashMap vs ConcurrentHashMap vs LinkedHashMap (LRU) vs Caffeine. Trade-offs and memory footprint?",
    a: `**Summary:** when you design an in-memory cache (data kept in RAM for fast access) you have to weigh thread-safety (safe to use from multiple threads - independent execution paths - at the same time), an eviction policy (rules for removing entries, such as LRU - Least Recently Used / W-TinyLFU), a size bound, TTL/refresh (time-to-live - how long an entry stays valid), and the memory cost (object overhead). For a production cache today the {{Caffeine}} library is usually the most practical choice because it already handles many traps (efficient eviction, cache stampede protection - preventing a burst of requests from all recomputing the same missing value, statistics). But a library is not always required — pick what the requirement actually demands.

### Comparison
| Structure | Thread-safe | Automatic eviction | Notes |
|---|---|---|---|
| {{HashMap}} | No | No | Single-thread only. Not suitable for concurrent use. |
| {{ConcurrentHashMap}} | Yes (concurrent) | Not automatic | Good concurrent reads/writes, fine-grained locking (it locks small parts, not the whole map). It is still only a map: no size- or time-based eviction policy. |
| {{LinkedHashMap}} ({{accessOrder}} = {{true}}) + {{removeEldestEntry()}} | No | Can be made into a simple LRU (access order) | Easy to implement, but the whole map is not thread-safe; eviction happens synchronously inside put and can cause side effects; no TTL/refresh/statistics. |
| {{Caffeine}} | Yes | Yes (LRU, W-TinyLFU, TTL, maximum size, and so on) | Library outside the JDK. Asynchronous eviction, good cache stampede handling, statistics tracking, and a much better memory efficiency than a simple hand-rolled implementation. |

### When to choose what
- **You only need a concurrent map, with no size bound**: {{ConcurrentHashMap}}.
- **A simple LRU, single-threaded or self-synchronised**: {{LinkedHashMap}} with {{removeEldestEntry()}} (only fits very simple cases).
- **A multi-threaded production cache with a size bound and efficient eviction**: {{Caffeine}} (recommended).
- **Very simple and strictly single-threaded**: {{HashMap}}.

### Notes on footprint (memory size)
- Each entry carries overhead: key, value, and the node/hash/next references. With 1 million entries the overhead can be significant (tens of MB) depending on the structure.
- {{ConcurrentHashMap}} has node/segment overhead (in older JDK versions) but remains a plain map.
- {{Caffeine}} packs entries more tightly, and its eviction keeps the footprint below a threshold instead of letting the map grow without bound.
- Always **bound the cache size** to avoid OutOfMemoryError (OOM - the JVM runs out of memory). Never run an unbounded cache in production.

### Under the hood: the real footprint of one entry
Estimated with compressed oops (ordinary object pointers, enabled for heaps under 32GB): one {{HashMap}} entry = a Node (32 bytes) + one slot in the bucket array (4 bytes, multiplied by the load factor's empty space) + the key object + the value object. A {{String}} key of 10 characters ≈ 56 bytes (String object 24 + byte array 24+). A value object with 3 fields ≈ 24–32 bytes. Total about 120–150 bytes/entry → 1 million entries ≈ 120–150MB, not counting data inside the value. {{LinkedHashMap}} adds 8 bytes (two before/after references). Caffeine adds metadata for eviction and statistics (a few dozen bytes/entry) — in exchange for a size bound and a better policy. Measure for real with JOL ({{GraphLayout.parseInstance(map).totalSize()}}) or a heap dump instead of estimating.

### Real production example
A routing service kept a table of 1.2 million postal codes → warehouses in a {{ConcurrentHashMap<String, Warehouse>}}, reloaded every hour by calling {{clear()}} then {{putAll}} — during the reload there were a few seconds with missing data, and about 0.3% of orders were routed to the default warehouse. Fix: build a new, fully populated map and then **swap the reference** (a volatile field - a field whose latest value is always visible across threads), and also change the key to {{int}} (postal codes are numbers) using a primitive map: footprint dropped from 210MB to 45MB and no more misrouted orders. Another cache (customer data, skewed access, needs TTL) used Caffeine {{maximumSize(500_000)}} + {{expireAfterWrite(10 minutes)}} with a 94% hit rate.

### Sample interview answer
"I choose based on three questions: is it accessed by multiple threads, does it need a size limit or expiry, and how much memory is available. HashMap is only for a single thread or for data that is immutable after construction. ConcurrentHashMap is for shared, read-heavy data and it does not evict on its own; for a lookup table reloaded periodically, I build a new map and swap the reference instead of clearing and reloading in place. LinkedHashMap as an LRU only fits a small, single-thread cache. For a real cache that needs a size bound, TTL, and statistics, I use Caffeine with W-TinyLFU. For memory, each HashMap entry with a short String key usually costs about 120 to 150 bytes, so one million entries is over a hundred megabytes; I measure with JOL or a heap dump, and if the key is a number I use a primitive map to cut the footprint significantly."

> Senior tip: do not hand-write a complex cache on {{LinkedHashMap}} for a multi-threaded production environment. If you need eviction/LRU/TTL/statistics, {{Caffeine}} is proven to be a far more efficient and far safer solution.`,
    follow: ["Why does Caffeine use W-TinyLFU instead of plain LRU?","What is a cache stampede and how do you avoid it?","How do you estimate the memory footprint of a cache?"]
  },
  'modern-025': {
    q: "Modelling a domain with sealed interface + record + pattern matching switch (Java 21): why is it better than enum/visitor?",
    a: `**Summary:** to model a domain (the business area) where "a value is one of several forms, and each form carries different data", modern Java provides a trio: {{sealed interface}} (a "sealed" interface - only a fixed set of subtypes is allowed to inherit it), {{record}} (an immutable data class that auto-generates {{equals}}/{{hashCode}}/{{toString}}), and pattern matching in {{switch}} (Java 21: a switch can "open" a type and extract its fields). The big win: the compiler checks that the switch is **exhaustive** (covers every case) — add a new subtype and forget to handle it in a switch, and you get a **compile error** instead of a runtime bug. Compared with {{enum}} (cannot attach different data per constant flexibly) and the Visitor pattern (a lot of boilerplate - repetitive scaffolding code), this approach is both concise and type-safe.

### What - why
- **ADT (Algebraic Data Type - an "either/or" data type):** the idea that "this value is A or B or C", and each of A/B/C has its own data structure. For example a payment method: Card (carries card number, cvv) or Wallet (carries token) or Bank Transfer (carries IBAN) — only one of the three, never mixed.
- **The old problem:** with an {{enum}}, every constant has the same "shape" so you cannot attach cvv/token/iban separately. With freely extensible inheritance, anyone can add a new subtype, and {{switch/instanceof}} scattered around the code never reminds you to update them when a new type appears.
- **{{sealed}} + {{permits}}:** it "seals" the inheritance tree — only the listed subtypes (or those in the same file/module, depending on the declaration) may {{implements/extends}}. The compiler knows the closed list.
- **{{record}}:** each subtype is an immutable record that declares its data fields concisely. Immutability (cannot be changed after creation) makes it safe to share across threads/layers.
- **Pattern matching switch (Java 21):** {{case CreditCard(var num, var cvv) -> ...}} both checks the type and deconstructs (extracts) the fields. Because the subtype set is closed (sealed), omitting {{default}} while covering every case forces the compiler to make you update every switch when a new subtype is added.

### Step-by-step mechanism (code example)
~~~java
// 1) A CLOSED set of types: only 3 valid payment methods
public sealed interface PaymentMethod
        permits CreditCard, Wallet, BankTransfer {}
public record CreditCard(String number, String cvv) implements PaymentMethod {}
public record Wallet(String provider, String token) implements PaymentMethod {}
public record BankTransfer(String iban) implements PaymentMethod {}

// 2) Handle it: exhaustive - missing 1 case will NOT compile
static String describe(PaymentMethod pm) {
    return switch (pm) {                     // Java 21 pattern matching
        case CreditCard(var n, var c) -> "Card ****" + n.substring(n.length()-4);
        case Wallet(var p, var t)     -> "Wallet " + p;
        case BankTransfer(var iban)   -> "IBAN " + iban;
        // no default needed: the compiler knows all 3 types are covered
    };
}
// 3) Add a new type, e.g. record Cash() implements PaymentMethod {}
//    -> every switch without a default will report a compile error immediately.
~~~

### Comparison / trade-offs
| Criterion | {{enum}} | Visitor pattern | sealed + record + switch |
|---|---|---|---|
| Each kind carries different data | Hard/forced | Yes | Natural (record) |
| Add a new **behaviour** (operation) | Change the enum or switch | Add a method to Visitor + every class | Add/change a switch (concise) |
| Add a new **type** | Change switches (easy to miss if there is a {{default}}) | Change the Visitor interface + every visitor (lots of boilerplate) | Compiler forces you to update every exhaustive switch |
| Immutability | Depends | Depends | Default (record) |
| Code size | Short | Long | Short |

Rule of thumb: if the set of types is **stable** and you often add behaviour → sealed+switch is convenient. If the set of types changes constantly → rethink the design (or accept editing many switches, but the compiler will point them out).

### Real production example
Assume a payment system processes ~120,000 transactions/day with 3 methods (card, wallet, bank transfer) modelled as {{if (pm instanceof CreditCard) ...}} scattered across 6 services (fee calculation, display, risk checks, refunds, reporting, notifications). When adding the "Buy Now Pay Later" (BNPL) method, the team added the new class but forgot to update the refund flow — the case fell into a generic {{else}} branch and silently returned "not supported". Consequence: ~1,800 BNPL refund requests were stuck for 3 days, complaints rose, and manual handling cost ~12 hours. Investigation: a grep found no place handling {{BNPL}}; there was no compile-time signal. Fix: refactor to {{sealed interface PaymentMethod permits CreditCard, Wallet, BankTransfer, BNPL}} + a record per kind, replacing the {{if-instanceof}} chains with exhaustive switches. After adding {{record BNPL(...)}} to {{permits}}, all 6 switches failed to compile at once → developers were forced to handle it. Result: adding new methods later no longer missed a branch, and review time dropped because the compiler carried the checking.

### Production pitfalls
- **Adding {{default}} carelessly:** {{default}} makes the switch non-exhaustive → the compiler no longer warns when a new subtype is added. Only use {{default}} when you truly want a "catch-all" behaviour and accept the risk.
- **Sealed does not make it null-safe:** switching on a {{null}} reference can still throw {{NullPointerException}} if there is no {{case null}} (Java 21). Decide: reject null at the boundary or handle {{case null}}.
- **Mistaking a {{record}} for an entity:** a record is immutable and has no no-arg constructor — it fits value/DTO objects, not a JPA {{@Entity}}.

### Sample interview answer
"When a domain has a fixed set of kinds but each kind carries different data, I use a sealed interface together with records and a pattern matching switch — Java's modern take on an ADT. The sealed interface seals the subtype set so the compiler knows the closed list; each subtype is an immutable record holding exactly its own fields; and a switch in Java 21 can deconstruct records and is checked for exhaustiveness. The biggest strength is compile-time safety: if I add a new subtype to permits, every switch without a default fails to compile, so I cannot forget to handle it the way scattered if-instanceof checks do. Compared to an enum it is more flexible because each kind has its own data; compared to Visitor it needs less boilerplate when adding new behaviour. I am careful not to overuse default because it disables the exhaustiveness warning, and I remember to handle case null when needed. In practice this lets the team add new methods or states with more confidence because the compiler acts as a safety net."

> Senior tip: use sealed+record for a "closed world" (a set of kinds you control: order states, processing results, domain events). Do not seal things that must be extended by plugins/third parties. Always weigh: "do we add types or add behaviour more often?" — that is the key to choosing between switch and Visitor.`,
    follow: ["When would you use Visitor instead of sealed + switch?","What is exhaustiveness in a pattern matching switch?","Why is record a good fit for modelling an ADT?"]
  },
  'modern-026': {
    q: "Record as a JPA entity / DTO / Map key: what do you gain, what do you lose? Best practice?",
    a: `**Summary:** a {{record}} is immutable (its components - the declared fields - are final, with no setters), it auto-generates {{equals()}}/{{hashCode()}}/{{toString()}} from the components, and it has no default no-arg constructor (a constructor with no parameters). That makes it **an excellent fit** for DTOs (Data Transfer Objects - simple objects used to carry data between layers), projections (queries that return only selected fields), value objects and keys in a {{Map}}/{{Set}}. Conversely a {{record}} **is a bad fit** for a JPA {{@Entity}} (a Java Persistence API object mapped to a database table) in most cases, because of what JPA/Hibernate (the ORM - Object-Relational Mapper that maps Java objects to database rows) requires.

### Analysis by use case
| Use case | Recommendation | Reason |
|---|---|---|
| DTO/Request/Response | Very good | Immutable, concise, safe to pass across layers. |
| JPA projection (constructor expression; interface-based is rarer) | Usually good | Hibernate/JPA can map a record constructor for projection queries. |
| Value object (domain) | Very good | Matches immutability and value-based {{equals}}. |
| Map key | Very good | Immutable {{equals}}/{{hashCode}} → safe, no risk of "losing" the entry the way a mutable key does. |
| Embeddable ({{@Embeddable}}) | Careful / provider-dependent | Some providers support it, but it is uncommon and limited. Verify carefully. |
| JPA entity ({{@Entity}}) | Not recommended | See the details below. |

### Why it does not fit a JPA entity
- **A no-arg constructor is required**: JPA/Hibernate needs a constructor without arguments to create an instance when hydrating an entity (filling an object from a database row). A {{record}} has no default no-arg constructor.
- **Immutability vs dirty tracking**: an entity must change state (update fields) so Hibernate can track changes (dirty checking - comparing old and new values) and flush them. The immutability of a {{record}} does not match that model.
- **Proxies for lazy loading**: Hibernate usually creates a proxy subclass (a fake subclass generated at runtime) to lazy load (load data only when first accessed) {{@ManyToOne}}/{{@OneToMany}}. A {{record}} is {{final}} and has no suitable constructor, so proxying it is not easy.
- **Complex lifecycle**: an entity has a lifecycle (managed/detached/removed) — immutability runs against that design.

### Best practice
- **Entity = stateful, has identity and a lifecycle** (may be mutable). Use a regular class.
- **DTO/record = data transfer, immutable, no complex business identity**.
- **As a Map key**: only when every component of the record is **itself immutable**.

### Under the hood: why Hibernate needs an "open" class
Hibernate creates an entity with a **no-arg constructor** and then sets fields via reflection (reading/writing object internals at runtime); it tracks changes (dirty checking) by **comparing a snapshot** and **mutating fields** on merge/refresh; lazy loading needs a **proxy subclass** (generated with ByteBuddy). A record breaks all three: no no-arg constructor, final fields cannot be reassigned, and a final class cannot be subclassed. That is why a record cannot be an entity; but since Hibernate 6.2 a record can be used as an **{{@Embeddable}}** (an embedded value - Hibernate calls the canonical constructor), and as a projection result ({{select new com.x.OrderView(o.id, o.total) ...}}) or a Spring Data projection.

### Real production example
A team converted all DTOs to records — good — but also used a record as a **cache key** with a {{BigDecimal amount}} component. Two requests "100.0" and "100.00" (different scale - number of decimal digits stored) produced two different keys because {{BigDecimal.equals}} compares the scale → the cache hit rate was abnormally low (31%). Fix in the compact constructor (a short constructor form for records): {{amount = amount.setScale(2, RoundingMode.HALF_UP)}}; hit rate rose to 74%. In the same effort, a JPQL projection returned a record instead of an entity for a list screen: dirty checking and unnecessary lazy loading were removed, and the list API p95 (95th percentile latency) dropped by 40%.

### Sample interview answer
"A record is a great fit for DTOs, projections, value objects, and Map keys: shallow immutability, equals and hashCode by value, and concise syntax. But a record cannot be a JPA entity, because Hibernate needs a no-arg constructor to create the object, needs to reassign fields on merge or refresh, and needs to create a proxy subclass for lazy loading — while a record has final fields, no no-arg constructor, and is a final class. Since Hibernate 6.2, a record can be used as an Embeddable and as a projection result via select new or a Spring Data projection, which is excellent for read-only screens because it removes dirty checking. When using a record as a key, I normalise data in the compact constructor, such as copying a list with List.copyOf or normalising the scale of a BigDecimal, so that equals and hashCode stay stable."

> Senior tip: "an entity is about lifecycle and identity; a DTO/value object is about immutable data". Do not force a record into the entity role just because it is shorter — you would trade away lazy loading, proxies and dirty tracking.`,
    follow: ["Why does JPA need a no-arg constructor?","Can a record be used as a projection?","Why is a record a good Map key?"]
  },
  'modern-027': {
    q: "Parallel streams in production: when are they slower, the shared ForkJoinPool, side effects?",
    a: `**Summary:** {{Stream.parallel()}} turns a sequential stream into a parallel one by splitting data across multiple threads (independent execution paths) running at the same time, and it uses the shared {{ForkJoinPool.commonPool()}} (a thread pool - a group of reusable worker threads - shared by the whole JVM, the Java Virtual Machine). It is **not always faster**: it only helps when the work is CPU-bound (mostly computation), the data set is large enough and easy to split, there is no blocking I/O (blocking I/O - waiting for the network/disk/database), and there are no side effects (side effect - changing state outside the operation). Used wrongly (especially with blocking I/O) it can be slower than a normal stream and can also stall other parts of the application because they share the same pool.

### What - why - how
- **Why parallel?** For heavy computation over a large data set (filtering, mapping, summing millions of elements), splitting work across multiple CPU cores running at once can reduce total time.
- **How does Fork/Join work?** {{parallel()}} asks the data source for a {{Spliterator}} (a splittable iterator) to "fork" (split) the data into chunks. Each chunk is processed on a worker thread of the {{ForkJoinPool}} (work-stealing algorithm: an idle thread "steals" work from a busy one). Then it "joins" (merges) the results. The split and merge steps **cost time**.
- **What is {{commonPool}}?** By default {{ForkJoinPool.commonPool()}} has roughly {{number of CPU cores - 1}} threads. It is **shared** by the whole application: {{parallel stream}}, {{CompletableFuture}} without an explicit executor, and other APIs. That means you compete for threads with the rest of the system.
- **CPU-bound vs I/O-bound:** CPU-bound work keeps the CPU busy (encoding, calculation). I/O-bound work mostly **waits** (calling HTTP, querying a DB) — while waiting, the thread is blocked and does no useful work. Using a small thread pool to wait on I/O wastes it and causes congestion.

### When it is slower (and why)
| Cause | Why it is slower / dangerous |
|---|---|
| Small data (a few hundred/thousand elements) | The split/fork/join + coordination cost is larger than the actual computation time |
| Hard-to-split source ({{LinkedList}}, {{iterate}}, {{Stream.generate}}) | Poor splitting → little real parallelism, but you still pay the overhead |
| Blocking I/O (calling DB/HTTP/files in the pipeline) | Blocks {{commonPool}} workers → the pool runs dry → other {{CompletableFuture}}/parallel streams in the app also stall (starvation - running out of resources) |
| Ordered stream + {{forEachOrdered}}/{{limit}} | Must preserve order, reducing the benefit of parallelism and adding synchronisation |
| Side effects (writing to {{ArrayList}}/shared variables) | Race condition (data contention between threads), wrong/missing results; {{ArrayList}} is not thread-safe |

### Real production example
Assume a reporting aggregation API: for each of ~50 IDs, call HTTP to another service (average latency 120ms) then combine the results. A developer changed {{ids.stream()}} to {{ids.parallelStream().map(id -> httpClient.get(id))...}} expecting it to be faster. On an 8-core machine, {{commonPool}} has ~7 threads. The first 7 requests run, the remaining 43 wait in the pool — but worse: another part of the same application uses {{CompletableFuture.supplyAsync(...)}} (which also uses {{commonPool}} by default) for background work. Result: the reporting API p99 (99th percentile latency) improved slightly (from ~6s to ~4.5s) but the p99 of other endpoints spiked from 80ms to 900ms during peak hours, because workers were held waiting on HTTP. Investigation: thread dumps showed many {{ForkJoinPool.commonPool-worker-*}} threads in {{WAITING}} state on socket read. Fix: drop {{parallelStream}} for the I/O path; use {{CompletableFuture.supplyAsync(() -> httpClient.get(id), ioExecutor)}} with {{ioExecutor}} as {{Executors.newFixedThreadPool(32)}} (or virtual threads in Java 21) kept separate, with bounded concurrency. Result: the reporting API ~1.2s (32 requests truly in parallel, not blocking the shared pool), other endpoints back to p99 85ms.

~~~java
import java.util.List;
import java.util.concurrent.*;

// BAD: blocking I/O on the commonPool
List<Report> bad = ids.parallelStream()
        .map(id -> http.get("/r/" + id))   // blocks a worker
        .toList();

// GOOD: I/O-bound -> a dedicated executor (or a virtual thread, Java 21)
ExecutorService io = Executors.newFixedThreadPool(32);
try {
    List<Report> ok = ids.stream()
        .map(id -> CompletableFuture.supplyAsync(() -> http.get("/r/" + id), io))
        .toList().stream()                  // collect futures
        .map(CompletableFuture::join)
        .toList();
} finally { io.shutdown(); }
// Heavy CPU-bound work, large data, easy-to-split source (ArrayList) -> consider parallel
long sum = hugeArray.parallelStream().mapToLong(this::heavyCpu).sum();
~~~

### Production pitfalls
- **Sharing the pool without knowing it:** blocking {{commonPool}} in one place breaks other, far-away parts of the codebase — a system-wide, hard-to-trace bug.
- **Hidden side effects:** {{parallelStream().forEach(list::add)}} on an {{ArrayList}} is common → elements randomly go missing. Use {{collect(Collectors.toList())}} (or {{toList()}}) so the collector merges safely.
- **"Parallel" is not automatically faster:** with small N or very light per-element work, overhead > benefit. Always measure (benchmark, e.g. JMH) before keeping it.

### Sample interview answer
"parallelStream splits data via a Spliterator and runs on ForkJoinPool.commonPool, which is shared by the whole JVM. It is only truly faster when the problem is CPU-bound, the data set is large enough, the source splits easily like an ArrayList, and the pipeline has no side effects. On the other hand, with small data the split and merge cost is higher than the computation, and with I/O-bound tasks like calling HTTP or a DB the worker threads block waiting — while commonPool has few threads and is shared, so one misuse can stall CompletableFuture or parallel streams elsewhere. I once saw a case where switching to parallelStream to call HTTP in parallel made the p99 of other endpoints spike because commonPool was starved. The fix is to use CompletableFuture with a dedicated executor for I/O, or virtual threads in Java 21. My rule: default to a sequential stream, and only enable parallel when a benchmark shows a clear improvement on real production data."

> Senior tip: treat {{ForkJoinPool.commonPool()}} as a sensitive shared resource — **never** put blocking I/O on it. If you need "parallel for I/O", use an appropriately sized executor (or virtual threads) kept separate. Before merging code that uses {{parallel()}}, require a benchmark against the sequential version on production-sized data.`,
    follow: ["How is ForkJoinPool.commonPool bounded?","Why is blocking I/O dangerous when using parallel streams?","When would you use CompletableFuture instead of a parallel stream?"]
  },
  'core-032': {
    q: "{{equals}}/{{hashCode}} for JPA entities and with inheritance: use {{getClass()}} or {{instanceof}}? Why is putting an entity into a {{HashSet}} before {{persist}} a real bug?",
    a: `**Summary:** for a JPA entity (an object mapped to a database row), equality (what it means for two objects to be "the same") must stay stable across the transient → managed → detached lifecycle (transient = not yet saved, managed = tracked by the ORM, detached = no longer tracked). If hashCode depends on a generated id (null before persist - saving to the database), an entity already added to a HashSet becomes "lost" once the id is assigned. For inheritance, {{getClass()}} is stricter than {{instanceof}} about symmetry (if A equals B then B must equal A), but Hibernate proxies (runtime-generated subclasses used for lazy loading) must be taken into account.

### The problem with a generated id
- Right after {{new Entity()}} the id is null. If hashCode is based on the id, two freshly created entities share the same hashCode (null) → they are treated as duplicates inside a HashSet.
- After {{persist}} the id is assigned → hashCode changes → the entry sits in the old bucket, and {{contains()}} and {{remove()}} cannot find it.
- This is a real bug: add the entity to a Set, persist it, then try to remove it → the removal silently fails and you leak memory.

### Business key
- Use an attribute that is unique, immutable, and already available at creation time (country code, a verified email).
- Example: {{Country.equals}} compares {{code}} (ISO 3166); no persist needed.
- Not every entity has a business key → in that case you need a different strategy.

### getClass() vs instanceof
~~~java
// getClass(): equal only when both objects have the same class
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    return Objects.equals(id, ((Entity) o).id);
}
// instanceof: lets a proxy (subclass) compare equal
if (!(o instanceof Entity e)) return false;
~~~
- {{getClass()}} guarantees symmetry: if a.equals(b) then b.equals(a) always holds. With {{instanceof}}, a subclass can equal a superclass while the superclass does not equal the subclass → symmetry is violated.
- But a Hibernate lazy proxy is a subclass of the entity, so {{getClass()}} treats the proxy and the real entity as different objects. That is why you need {{instanceof}} or {{Hibernate.getClass(o)}}.

### A safe strategy
~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Account e)) return false;
    return id != null && id.equals(e.getId());   // id null -> equal only to itself
}
@Override public int hashCode() {
    return Account.class.hashCode();   // stable, does not change when the id is assigned
}
~~~
- Never put associations or lazy collections into equals/hashCode (it triggers queries, recursion, N+1).
- Write tests: transient entity, managed entity, detached entity, proxy, two instances with the same id.

### Pitfall
- {{@Data}} (Lombok - a library that auto-generates boilerplate) generates a hashCode over every field including the id → the entity disappears from the Set after persist.
- Putting the entity in a Set before persist and then changing a field through a {{setter}} → hashCode changes.

### Real production example
An insurance system had {{Policy}} and a subclass {{LifePolicy extends Policy}}; {{Policy.equals}} used {{instanceof}} and compared {{policyNumber}}, while {{LifePolicy}} overrode {{equals}} to also compare {{beneficiary}}. Result: {{policy.equals(lifePolicy)}} was true but {{lifePolicy.equals(policy)}} was false — symmetry was violated; a {{HashSet<Policy>}} used to deduplicate during import sometimes kept and sometimes dropped a contract depending on file order, and 1,300 contracts were duplicated in the quarterly report. Fix: base equality only on the business key {{policyNumber}} declared {{final}} in the parent class, and let subclasses not override equals. With Hibernate proxies, compare using {{Hibernate.getClass(o)}} instead of {{getClass()}} directly so a proxy and the real entity still compare equal.

### Sample interview answer
"For a JPA entity, equality must be stable across the lifecycle: if hashCode is based on a generated id, an entity added to a HashSet before persist will be lost when the id is assigned, because it still sits in the bucket for the old hash. I prefer an immutable business key; if there is none, I compare the id only when it is not null and keep hashCode as a constant based on the class. Regarding inheritance, getClass guarantees symmetry because two objects of different classes are never equal, while instanceof allows a subclass to equal a superclass, which can break symmetry if the subclass overrides equals with extra fields. But with Hibernate, a proxy's getClass differs from the real class, so I use Hibernate.getClass or instanceof together with equals declared final in the parent. The practical rule: equals is based on the key, declared final, and subclasses do not override it."

> Senior tip: pick one rule for the whole system and pin it down with tests that use a HashSet before and after persist. Entity equality is an identity decision, not boilerplate.`,
    follow: ["Why does Hibernate recommend a business key rather than the id in equals/hashCode?","How do getClass() and instanceof differ in their effect on the symmetry of equals?","If an entity is already inside a HashSet before persist and its hashCode changes, how do you recover?"]
  },
  'core-033': {
    q: "Generics: PECS, type erasure, heap pollution, {{@SafeVarargs}} — and what they mean when you write a library/API?",
    a: `**Summary:** generics (type parameters like {{List<String>}} that let you write code for "a list of something") are checked at compile time and then erased (type erasure - removed from the bytecode, the compiled class format) at runtime. PECS is the rule for choosing a wildcard (a placeholder type like {{?}}): Producer Extends, Consumer Super. Heap pollution (a variable of a generic type ends up pointing to an object of the wrong type) happens when raw types (a generic used without its type parameter) are mixed with generics, so an array ends up holding elements of the wrong type. {{@SafeVarargs}} may only be applied to static/final/private methods and is a promise made by the author — the compiler cannot verify it.

### Type erasure
- {{List<String>}} and {{List<Integer>}} are both simply {{List}} in the bytecode; you cannot write {{new T()}}, {{instanceof T}}, or overloads that differ only in the type parameter.
- The compiler inserts casts and bridge methods (extra methods the compiler generates to keep polymorphism working). The bridge method for {{Comparable}} is {{compareTo(Object)}} which calls {{compareTo(MyType)}}.
- Consequence: generic types cannot be checked at runtime; reflection (inspecting classes/fields/methods at runtime) does not carry complete generic information (but {{ParameterizedType}} metadata survives when it is declared on a class/field/method — Jackson, a JSON library, exploits exactly this).

### PECS: Producer Extends, Consumer Super
- Generics are invariant: {{List<Integer>}} is not a subtype of {{List<Number>}}. If it were allowed, you could {{add(3.14)}} into a list of Integer.
- {{? extends T}}: you may only read a {{T}}, never write (except {{null}}) — use it for a producer (something you take values out of).
- {{? super T}}: you may write a {{T}}, but reading yields only {{Object}} — use it for a consumer (something you put values into).
- {{?}} = {{? extends Object}}: read {{Object}}, no writes.
- The classic example: {{Collections.copy(List<? super T> dest, List<? extends T> src)}}.

### Heap pollution
- It occurs when a generic array holds an element of the wrong type, and because of erasure the runtime does not detect it.
- Example: {{List<String>[] = new List<?>[10]}} → assigning a {{List<Integer>}} into that array is a runtime error.
- Using a raw type ({{List}} without arguments) and then adding generic elements: {{list.add(123)}} succeeds because the raw type skips the checks, but {{list.get(0)}} blows up with a {{ClassCastException}} at the cast.
- {{@SafeVarargs}} is a promise: allowed only for static/final/private methods; if the method is not final and takes varargs (a variable number of arguments, written {{T...}}) of a generic array, a caller can write a different array into it and cause heap pollution later.

### When writing an API
- Use wildcards on inputs so callers can pass more kinds of arguments; use concrete types for outputs.
- Do not use raw types in a new API; they switch off compile-time checking and produce warnings.
- Avoid generic varargs in public methods when you cannot prove they are safe → take a collection instead of varargs.

### Real production example
An internal utility library had a method {{static <T> List<T> listOf(T... items)}} annotated with {{@SafeVarargs}} but it **stored the varargs array in a field** for reuse. When called with a generic type ({{listOf(List.of(1), List.of(2))}}), the array was actually an {{Object[]}}; another place wrote an element of the wrong type into that array (heap pollution) and a {{ClassCastException}} blew up in a different service, far from the cause, costing the team a day to trace. Fix: never keep or return the varargs array ({{List.copyOf(Arrays.asList(items))}}), and only apply {{@SafeVarargs}} when the method only **reads** elements. Add {{-Xlint:unchecked}} to the build so every unchecked warning becomes an error in the shared library.

### Sample interview answer
"Generics are checked only at compile time and then erased, so at runtime the JVM does not know what a List contains. When writing an API, I follow PECS: use extends for a parameter I only read from, super for one I only write to, like Collections.copy, and keep the return type concrete. Heap pollution is when a generic variable points to an object of the wrong type, usually because of a raw type or generic varargs: varargs creates an array, and a generic array is really an Object array, so someone can put an element of the wrong type in and a ClassCastException blows up elsewhere. @SafeVarargs is only the author's promise that the method does not write into the varargs array and does not let it escape; the compiler cannot verify it. In a shared library I enable Xlint unchecked as an error and avoid raw types entirely."

> Senior tip: when designing a library, always use wildcards on input (PECS) and concrete types on output. {{@SafeVarargs}} is only a promise — if the method is not final/static/private, the compiler warns. Never create a generic array {{new T[]}}; use {{List<List<T>>}} or {{Array.newInstance}} plus a controlled cast.`,
    follow: ["Why can you not create a generic array new T[]?","How does heap pollution occur, and how do you detect it?","When do you use @SafeVarargs, and why only on static/final/private methods?"]
  },
  'core-034': {
    q: '{{BigDecimal}} for money: scale, precision, {{RoundingMode}}, {{equals}} vs {{compareTo}}, division, and the "off by one cent" bug?',
    a: `**Summary:** money requires {{BigDecimal}} because {{double}}/{{float}} cannot represent decimal fractions exactly (0.1 + 0.2 ≠ 0.3). {{equals}} compares both scale and value; {{compareTo}} compares only the numeric value. A division that does not terminate must be given a scale and a {{RoundingMode}}. A wrong scale or rounding mode is what produces the one-cent discrepancy.

### Why not double
- {{double}} follows binary IEEE 754: a finite decimal (0.1, 19.99) is usually an infinitely repeating fraction in binary ⇒ accumulated rounding error.
- The classic example: {{0.1 + 0.2 = 0.30000000000000004}}; interest and discount calculations drift by cents and the drift adds up into a large number across thousands of transactions.
- Accounting and banking standards (ISO 4217, PCI DSS) require exact precision; {{double}} does not provide it.

### BigDecimal basics
~~~java
// Created from String — SAFE
BigDecimal price = new BigDecimal("19.99");

// Created from double — FORBIDDEN
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // uses Double.toString -> "0.1"
~~~
- Always use the {{String}} constructor or {{BigDecimal.valueOf(double)}}.
- {{scale}} = the number of digits after the decimal point; a negative scale means multiplying by 10^|scale|}.

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (different scale)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (same value)
~~~
- {{equals}} compares both scale and value; {{compareTo}} compares only the numeric value.
- Use {{compareTo}} for business logic (comparing prices, checking negative/positive); use {{equals}} only when you need the exact representation (serialization).
- {{signum()}} returns -1/0/1, which is convenient in conditions.

### Division and the "off by one cent" bug
- {{divide(divisor)}} without an explicit scale throws {{ArithmeticException}} when the quotient is a non-terminating decimal.
- {{divide(divisor, scale, RoundingMode.HALF_UP)}} always states both the scale and the rounding mode.
- The "off by one cent" bug appears when: an intermediate {{double}} is used, or the rounding mode is wrong ({{HALF_DOWN}} where {{HALF_UP}} was meant), or the scales differ between calculation steps.
- Summing many amounts with percentages: rounding each line separately → the error accumulates. The correct way: keep the running total in {{BigDecimal}} and round once at the end.

### Production pitfalls
- Forgetting the {{divide}} overload with scale + rounding ⇒ a runtime exception the first time you divide 10 by 3.
- Storing in the database: a {{NUMERIC(19,4)}} or {{DECIMAL}} column; never {{FLOAT}}/{{DOUBLE}}. Hibernate mapping: {{@Column(precision = 19, scale = 4)}}.
- Multiple currencies: always carry the {{Currency}} (ISO 4217); never add or subtract across currencies.
- Write your own {{Money}} wrapper (record {{Money(BigDecimal amount, Currency currency)}}) with validation in the constructor; keep rounding, conversion and comparison logic in one place.

> Senior tip: write a {{Money}} wrapper with validation in the constructor; centralise rounding, conversion and comparison so that {{RoundingMode.HALF_UP}} is not scattered throughout the codebase. For financial reporting, {{RoundingMode.HALF_EVEN}} (banker's rounding) is the accounting standard, but it must be applied consistently across the whole system.`,
    follow: ['Why does BigDecimal("1.00").equals(BigDecimal("1.0")) return false?', 'When do you use RoundingMode.HALF_EVEN instead of HALF_UP?', 'How do you avoid the off-by-one-cent bug when summing many amounts with percentages?']
  },
  'collections-029': {
    q: '{{Iterator}} fail-fast, {{ConcurrentModificationException}} in a single thread, {{removeIf}} and {{CopyOnWriteArrayList}}: when is each appropriate?',
    a: `**Summary:** a fail-fast iterator checks {{modCount}} and throws {{ConcurrentModificationException}} when the collection is modified outside the iterator. Fail-safe (weakly consistent) collections such as {{ConcurrentHashMap}}, or snapshot collections such as {{CopyOnWriteArrayList}}, do not throw, but they may show stale or incomplete data.

### How fail-fast works
- {{ArrayList}}, {{HashMap}}, {{HashSet}} and friends keep a {{modCount}} field that is incremented on every structural change.
- The iterator stores {{expectedModCount}}; each {{next()}}/{{remove()}} compares the two and throws CME immediately on a mismatch.
- This is **best-effort detection**, not a synchronisation mechanism: it does not guarantee that every case is caught, especially across threads.
- CME can occur in **a single thread**, when you combine a for-each with {{list.remove(x)}} or {{map.put}}.

### Predicting the output
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Throws ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> NO exception thrown, and "c" is never checked
~~~
Why case 2 does not fail: after removing "b" the size is 2 and the iterator's {{cursor}} is also 2. {{hasNext()}} only checks {{cursor != size}}, so it returns false and the loop ends before {{next()}} gets a chance to check {{modCount}}. The code "runs fine" but silently skips the last element — a bug more dangerous than CME.

### removeIf — the standard solution
~~~java
orders.removeIf(Order::isExpired);
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);
~~~
- {{removeIf}} (Java 8+) is O(n) overall, compacts the array once, and is safe both logically and in performance terms.
- {{Iterator.remove()}} is still the right tool when you need complex logic (audit before deleting), but each removal is O(n) for an ArrayList, so the total can become O(n²).

### CopyOnWriteArrayList
- Every write operation ({{add}}, {{set}}, {{remove}}) builds a new array and then swaps a {{volatile}} reference; reads take no lock.
- The iterator is a **snapshot**: it never throws CME, it has no {{remove}}, and it may show stale data.
- Writes cost O(n) in both time and memory; continuous writes ⇒ very heavy GC pressure.
- Fits: a listener/observer list that rarely changes, read-mostly configuration. Does not fit: caches, queues, large collections updated frequently.

### How to avoid it
- Modify through the iterator ({{it.remove()}}, {{it.set()}}).
- Use {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- For maps, use {{entrySet().removeIf}} or {{map.compute}} instead of removing inside a for-each.
- Across threads: use the right concurrent collection, or copy into a new list before iterating when a snapshot is enough.

### Pitfall
- Catching CME and ignoring it hides a bug; CME is a signal of wrong logic, not a transient error to retry on.
- Iterating a {{subList}} while modifying the backing list also throws CME.
- Modifying a collection inside its own {{forEach}} also throws CME (unless it is a concurrent collection).

> Senior tip: in code review, prefer {{removeIf}}/{{computeIfAbsent}} — they are shorter and CME-free; with ConcurrentHashMap, do not rely on {{size()}} to stop a loop under concurrency — use the return value of the operation or count locally. For large batches, switching from an {{Iterator.remove}} loop to {{removeIf}} can take the runtime from several seconds down to a few milliseconds.`,
    follow: ['Why can a for-each loop throw ConcurrentModificationException?', 'How does Iterator.remove() differ from collection.remove()?', 'Why does a CopyOnWriteArrayList iterator never throw CME?']
  },
  'collections-030': {
    q: "Sorting/comparison: {{Comparator}} chaining, nullsFirst/nullsLast, \"consistent with equals\", and elements \"disappearing\" from a {{TreeMap}} when the comparator is wrong?",
    a: `**Summary:** {{TreeMap}}/{{TreeSet}} (sorted collections that keep elements in order using a comparison, not hashing) use {{compare()}} to define order; they do not use {{equals}}/{{hashCode}}. If a comparator (an object that decides which of two elements comes first) is not consistent with equals (it returns 0 while equals is false), the map or set treats two different keys as one and loses data silently. A comparator must be symmetric, transitive, and ideally consistent with equals.

### Comparator chaining
~~~java
// Sort by: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: a key extractor plus an optional key comparator.
- {{thenComparing}}: appends another comparator used as a tie-breaker (a secondary sort when the first is equal).
- {{nullsFirst}}/{{nullsLast}}: wrappers around a delegate comparator that treat null as the smallest/largest value.
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} avoid boxing.

### consistent with equals
- Rule: {{compare(a, b) == 0}} if and only if {{a.equals(b)}}.
- If the comparator returns 0 but equals is false, {{TreeMap}} treats them as the same key: {{put(b, ...)}} overwrites the value of {{a}}, {{size()}} does not increase, and {{get(b)}} returns a's value.
- The classic example: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" and "cd" both have length 2, so only one is kept.
- {{BigDecimal}} is a famous trap: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is false but {{compareTo}} is 0 ⇒ using it as a TreeMap key merges them.

### TreeMap "loses" elements
- {{TreeMap}} does not use {{equals}}/{{hashCode}} to identify keys; it uses {{compare()}}.
- If the comparator is not symmetric or transitive (if A < B and B < C then A < C), the red-black tree (the balanced tree structure TreeMap uses internally) can become unbalanced or search incorrectly.
- Null: {{TreeMap}} does not allow a null key unless the comparator handles null; natural ordering throws NPE.
- {{subMap}}, {{headMap}}, {{tailMap}} are views — changing the view affects the original map.

### Pitfall
- A comparator based on a nullable field without handling null: {{a.getName().compareTo(b.getName())}} throws NPE or violates transitivity when null appears.
- Broken comparison logic: {{(a, b) -> a.x < b.x ? -1 : 1}} (forgets the equal case that must return 0).
- Comparing float/double with NaN (Not a Number): {{Double.compare}} handles NaN, but a hand-written {{a < b ? -1 : 1}} is wrong for NaN.
- Sorting a primitive array is not stable (equal elements may change relative order): {{Arrays.sort(int[])}} uses quicksort; for a stable sort use {{Integer[]}} or {{List.sort}}.

### Under the hood: TimSort detects a broken comparator
{{List.sort}}/{{Arrays.sort}} for objects uses TimSort (a hybrid sorting algorithm), which assumes the comparator obeys its contract (symmetric, transitive). When it detects a violation while merging already-sorted runs, it throws {{IllegalArgumentException: Comparison method violates its general contract!}} — but **only when the data is large enough and falls into the right order** (often from a few dozen elements upward), so the bug frequently slips past small tests. Common causes: subtracting two numbers to compare ({{a - b}} overflows for large ints), a comparator that does not handle null consistently, comparing by a field that changes during the sort, comparing doubles that include NaN. Use {{Comparator.comparingInt}}, {{Integer.compare}}, {{Comparator.nullsLast(...)}} instead of writing it by hand.

### Real production example
A report ranking agents occasionally failed with HTTP 500 and the message "Comparison method violates its general contract!" — only at month end when the list had about 5,000 agents. The hand-written comparator was {{(a, b) -> (int)(a.revenue() - b.revenue())}} with revenue as {{long}} (in VND): the difference overflowed the int range so the cast produced the wrong sign. Fix: {{Comparator.comparingLong(Agent::revenue).reversed().thenComparing(Agent::code)}} — adding a secondary key to keep the order stable when revenues are equal. A new test generates 10,000 random elements with extreme values to reproduce it.

### Sample interview answer
"A comparator must obey its contract: symmetric, transitive, and consistent. I build comparators with factories like comparing, comparingLong, thenComparing, reversed, and nullsFirst or nullsLast to handle null clearly, instead of writing subtraction, because subtracting two large numbers can overflow and flip the sign. If a comparator breaks the contract, TimSort can throw IllegalArgumentException, but only when the data is large enough, so the bug often passes tests. With TreeMap and TreeSet it is more dangerous: they use compare rather than equals, so if compare returns 0 for two different elements, the later one overwrites the earlier one and data is silently lost. That is why I always add a secondary key such as id at the end of the chain so it returns 0 only for truly identical elements."

> Senior tip: when using a custom comparator, write a unit test asserting that **different** keys remain distinct elements; this is the kind of bug that throws no exception and only loses records, making it extremely hard to detect. With BigDecimal, always normalise ({{stripTrailingZeros}}) before using it as a key. For large data, use {{comparingInt}}/{{comparingLong}} to avoid boxing. Do not hand-write complex comparison logic — chain the built-in comparators.`,
    follow: ["How do Comparable and Comparator differ?","Why does TreeMap not use equals/hashCode?","What problems does a comparator that is not consistent with equals cause?"]
  },
  'modern-028': {
    q: 'Virtual threads (Java 21) for an I/O-bound service: when to use them, how to migrate, pinning, {{ThreadLocal}}, and bounding concurrency with a {{Semaphore}}?',
    a: `**Summary:** a virtual thread (VT) is a thread the JVM creates at extremely low cost (just an object on the heap, with its stack stored as chunks). VTs suit I/O-bound code (database calls, HTTP, files, message queues) because when a VT blocks (on {{socket.read}}, for example) the JVM can unmount its stack to the heap and reuse the carrier thread for another VT. Pinning happens when a VT runs inside a {{synchronized}} block or calls a native method — the carrier thread then cannot be released. {{ThreadLocal}} across millions of VTs costs a lot of memory. A {{Semaphore}} is still needed to bound concurrency towards downstream systems (DB connection pool, API rate limit).

### VT vs platform thread
- Platform thread: one thread corresponds to one OS thread; expensive (1 MB stack, context switch performed by the OS).
- Virtual thread: thousands or millions of VTs run on a small number of platform threads (carrier threads). A blocked VT does not block its carrier thread.
- What VTs solve: writing naturally blocking code ({{Thread.sleep}}, synchronized, blocking I/O) in the obvious way while still scaling to high concurrency.

### Migrating
- Use {{Executors.newVirtualThreadPerTaskExecutor()}} in place of {{Executors.newFixedThreadPool}}.
- Spring Boot 3.5+ supports VTs through {{spring.threads.virtual.enabled=true}} (it automatically uses VTs for {{@RestController}}).
- VTs are not faster for CPU-bound work: if the code is heavy computation, VTs add nothing; you still need to spread the work across cores.

### Pinning
- Pinning occurs when a VT runs inside a {{synchronized}} block or calls a native method: the JVM cannot unmount the VT because the stack may still be reachable from native code.
- Solution: use {{ReentrantLock}} instead of {{synchronized}} (especially in critical code paths).
- From Java 24, pinning is largely removed thanks to improvements (JEP 487: Silently absorb pinning events; JEP 491: virtual thread-friendly synchronized).

### ThreadLocal and ScopedValue
- {{ThreadLocal}} across millions of VTs creates millions of entries → heavy memory use and possible leaks.
- {{ScopedValue}} (Java 20 preview; finalized in 24) is the safer replacement: values are carried by scope rather than one entry per VT.
- If you must use ThreadLocal: restrict it to short-lived data, and clean up with {{remove()}}.

### Semaphore and bounding concurrency
- VTs do not bound their own concurrency: creating 10,000 VTs is no problem, but 10,000 database connections are.
- Use a {{Semaphore}} to limit the number of simultaneous requests to a downstream system (connection pool, rate limit).
- Example: a {{Semaphore(20)}} to allow at most 20 concurrent requests against the core banking API.

### Pitfall
- Using VTs for CPU-bound work: no benefit, only slower because of unmount/mount overhead.
- Blocking a VT inside {{synchronized}}: the carrier thread is held, and throughput drops.
- Forgetting to bound concurrency: too many database connections opened → the connection pool is exhausted.
- Debugging long stack traces, because a VT stack is a combination of the carrier stack and virtual stack chunks.

> Senior tip: use VTs for all I/O-bound code, but always measure: the number of connections/thread pools towards downstream, CPU usage, and memory. If the downstream already has a connection pool (for example HikariCP with max 20), set a matching {{Semaphore}} to avoid overflow. VTs do not replace architecture, they only make blocking code easier to write. For a service running today, enabling VTs can reduce p99 latency noticeably under load, because the thread-creation overhead disappears.`,
    follow: ['What is pinning, and when does it happen?', 'Why is ReentrantLock better than synchronized with virtual threads?', 'When do you still need to bound concurrency even with virtual threads?']
  },
  'modern-029': {
    q: '{{Optional}} used correctly and incorrectly, {{Stream}} anti-patterns in production, {{peek}}, and {{collect(toMap)}} with duplicate keys?',
    a: `**Summary:** {{Optional}} is a **return type** that forces the caller to deal with "there may be nothing"; do not use it as a field, a parameter, or a collection element. The main Stream anti-pattern is side effects (dumping results into an external list, using {{peek}} for business logic). {{peek}} is for debugging only and the JVM may skip it. {{collect(toMap)}} throws {{IllegalStateException}} on a duplicate key when no merge function is supplied.

### Optional done right
- A method whose result may be absent: {{Optional<User> findById(long id)}}.
- Processing chains: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} turns absence into an explicit error.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) to convert into a stream.

### Where Optional does not belong
- **Fields** of an entity/DTO: not Serializable, awkward for JPA/Jackson mapping (needs a module), adds complexity; use null plus validation.
- **Method parameters**: the caller has to wrap pointlessly in {{Optional.of(...)}}; use overloads or validate null.
- **Collections**: {{List<Optional<T>>}} is usually a sign that nulls should be filtered out; return an empty list instead of an empty Optional.
- **Primitives**: use {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} to avoid boxing.

### orElse vs orElseGet
~~~java
// orElse: the argument is computed IMMEDIATELY, even when the Optional holds a value
User u1 = opt.orElse(loadFromDb());       // always calls the DB -> wasteful

// orElseGet: the supplier is called only when empty
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} takes a value that already exists; if producing it allocates an object or reads from the DB, use {{orElseGet}}.
- {{orElseThrow()}} (Java 10) throws {{NoSuchElementException}}; the variant with a supplier throws a custom exception.

### Stream anti-patterns
- **Side effects**: a lambda that changes state outside the stream (adding into a list, incrementing a counter, writing logs, calling the DB). It appears to work on a sequential stream but is **wrong once switched to parallel** (lost elements, wrong totals, sometimes exceptions).
- Using {{forEach(x -> list.add)}} or a one-element array {{int[] total}}: both are side effects.
- Rewrite as {{map(...).toList()}}, {{collect(...)}}, {{mapToLong(...).sum()}}, {{reduce}}.

### peek is for debugging only
- {{peek}} is an intermediate operation meant for inspecting data mid-pipeline; the JVM is allowed to skip it (for example {{count()}} on a source of known size, from Java 9 onward, does not run the pipeline).
- Do not use {{peek}} for business logic (updating state, writing to the DB) — if the terminal operation changes, that logic can disappear.

### collect(toMap) and duplicate keys
~~~java
// Wrong: duplicate key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// Right: decide which record wins
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // or merge by updatedAt
        LinkedHashMap::new));     // keep order if needed
~~~
- Duplicate key: without a merge function it throws {{IllegalStateException}} ("Duplicate key ...", and from Java 9 both values are included).
- Null value: **NPE** — the two-argument form checks {{requireNonNull(value)}}, and the merge-function form uses {{Map.merge}}, which forbids null values; filter with {{filter(Objects::nonNull)}} or substitute a sentinel.
- Null key: {{HashMap}} accepts it (the hash of null is 0) but {{ConcurrentHashMap}} does not; do not rely on null keys, filter them or guarantee non-null keys.

### Production pitfalls
- {{Optional.get()}} without a check ⇒ {{NoSuchElementException}}, equivalent to a null but harder to debug. Use {{orElseThrow}} with a message.
- {{opt.isPresent()}} followed by {{get()}} is a null check in disguise; prefer {{map}}/{{ifPresent}}.
- Comparing {{opt == Optional.empty()}} is wrong; use {{isEmpty()}} (Java 11) or {{isPresent()}}.
- {{Optional}} inside a JPA entity breaks mapping; in Jackson it needs {{Jdk8Module}}.
- Reaching for {{Optional}} everywhere makes code tangled and slower; sometimes a controlled null plus {{@Nullable}} is the more pragmatic choice.

> Senior tip: use {{Optional}} at the service/repository layer, and convert it to a value or an explicit error at the controller/DTO layer. Never wrap a collection in Optional — return an empty {{List.of()}} so the caller does not have to handle two levels of "nothing". In streams, prefer {{toList()}} for an immutable result and {{toCollection(ArrayList::new)}} when the result must be mutable. With toMap, always assume keys can collide and values can be null; write an explicit merge function (for example keep the newest by timestamp) instead of letting an exception blow up in production. For reports, use {{LinkedHashMap}}/{{TreeMap}} so the ordering stays stable between runs.`,
    follow: ['Why should Optional not be used as a field?', 'Should peek() be used to mutate objects, and why or why not?', 'When does Collectors.toMap throw IllegalStateException, and how do you solve it?']
  }
});
