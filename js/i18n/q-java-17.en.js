/*
 * English translation of js/data/q-java.js — task T949. Format: js/core/i18n.js (content overlay).
 * ids: modern-043 modern-044 modern-045 modern-046
 */
App.i18n.content({
  'modern-043': {
    q: `Record: canonical/compact constructor, shallow immutability, equals/hashCode, DTO/JPA.`,
    a: `**Summary:** {{record}} (Java 16) is an immutable "data carrier" class: the compiler generates the constructor, accessors, {{equals/hashCode/toString}}. The **compact constructor** lets you validate/normalize parameters before assignment; but immutability is only **shallow** — if a component is a mutable {{List/Map}}, the record can still be changed indirectly. Records are a great fit for DTOs (Data Transfer Object — an object for carrying data), and **not** a good fit for JPA entities (objects mapped to database tables).

### What a record is and why it exists
- **Problem:** "data-only" classes (POJOs) often repeat constructor, getters, {{equals}}, {{hashCode}}, {{toString}} — lots of code, easy to forget to update when you add a field.
- **Record solves it:** declaring {{record Order(String id, long amountCents)}} makes the compiler generate everything. Each component is {{private final}} and has an accessor with the same name ({{order.id()}}, not {{getId()}}).
- Everyday analogy: instead of filling in every box on a form repeatedly, you use a pre-printed template — you only declare the fields.

### Canonical constructor vs Compact constructor
- **Canonical constructor:** the "full" constructor that takes all components in declaration order. You can write it yourself for validation, but you must assign every field manually.
- **Compact constructor:** a shortened form that **does not** list parameters and **does not** assign fields manually. You only validate/normalize; at the end of the compact constructor, the compiler assigns {{this.id = id}} (the value after normalization) for every component.

~~~java
public record Order(String id, List<String> items) {
    // Compact constructor: validate + normalize + defensive copy
    public Order {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id is blank");
        }
        id = id.trim();                         // normalize -> compiler assigns it
        items = List.copyOf(items);             // defensive copy
        // DO NOT write this.items = ... ; the compiler does it after this block
    }
}
~~~

### Shallow immutability — the important trap
- {{final}} only prevents reassigning the {{items}} **reference** to another list; it does **not** prevent modifying the contents if that list is mutable (changeable).
- So {{record R(List<String> items)}} that takes a {{new ArrayList<>()}} from outside without copying → the caller can still {{add/remove}} → the record "changes unexpectedly".
- **Correct approach:** use {{List.copyOf(items)}} (returns an immutable copy, and also rejects {{null}} elements). For arrays, use {{array.clone()}} or wrap as immutable.

### equals/hashCode/toString
- Generated automatically based on **all** components, compared by value (value-based). Two records of the same type with the same component values → {{equals}} is {{true}}.
- **Caution:** if a component is an array ({{byte[]}}), array {{equals}} compares references, not contents → two records holding arrays with identical contents can still be {{equals}} false. Avoid raw arrays in records; use {{List}} or override manually (rarely needed).

### Records as DTOs — a great fit
- Less boilerplate, immutable, {{toString}} is useful for logging, easy to serialize/deserialize with Jackson (Jackson 2.12+ has good record support) and to use as response/request objects.
- Good fits: API responses, event messages, domain value objects.

### Records as JPA entities — NOT recommended
- **JPA/Hibernate (an ORM library — maps objects to database tables; Hibernate 6 is used in Spring Boot 3.x)** requires: a no-arg constructor, mutable fields, and the ability to create a **proxy** (a subclass generated at runtime for lazy loading — loading data later).
- A record: has no no-arg constructor, has {{final}} components, is a {{final}} class (cannot be extended) → Hibernate cannot create a proxy and cannot assign fields via setters. So **do not use a record as an {{@Entity}}**.
- **What you can do:** use a record as a **projection** (a read-only query result), e.g. {{select new com.app.UserDto(u.id, u.name) from User u}} in JPQL, or Spring Data JPA interface/DTO projections.

### Production pitfalls
- Assuming a record is "absolutely immutable" and putting a mutable {{List}} inside → state is modified elsewhere, hard-to-trace bugs.
- Using a record as an entity → Hibernate startup errors or incorrect lazy-loading behavior.
- Adding heavy logic in the compact constructor (DB/network calls) → constructor is hard to test, surprising during deserialization.
- Mixing record-style accessors {{id()}} with JavaBean convention {{getId()}} makes some older frameworks fail to map (rare, but check when integrating).

> Senior tip: use records for value objects/DTOs and query results; always defensively copy collection/array components in the compact constructor ({{List.copyOf}}, {{Map.copyOf}}). With JPA, keep entities as regular classes and map to record DTOs at the service/controller layer — you get immutability without breaking Hibernate's proxy/lazy mechanisms.`,
    follow: [
      'Why can Hibernate not create a proxy for a record, and how does that affect lazy loading?',
      'How does the compact constructor differ from the canonical constructor, and when should you use the compact form?',
      'How does record patterns (Java 21, deconstruction) help when processing nested data?'
    ]
  },
  'modern-044': {
    q: `Sealed + pattern matching switch: exhaustiveness, compiler checking, and benefits when adding a new subtype.`,
    a: `**Summary:** {{sealed}} (Java 17) restricts the exact set of allowed subclasses; combined with **pattern matching for switch** (Java 21), the compiler can check **exhaustiveness** (all subtypes handled) at compile time. The biggest benefit: when you add a new subtype to the hierarchy, every {{switch}} expression missing a branch becomes a **compile error** — the compiler "guides you to fix it" instead of you discovering a bug at runtime.

### What sealed is and why it exists
- **Problem:** a regular class/interface can be extended/implemented by anyone → you cannot know in advance "how many kinds" there are to handle. Adding a new kind easily leaves a missing {{if-else/switch}} branch.
- **Sealed solves it:** {{sealed class Payment permits Card, Cash, Wallet}} declares a closed list of subtypes. Each direct subtype must choose exactly one of: {{final}} (cannot be extended further), {{sealed}} (closed for another level), or {{non-sealed}} (reopened for free extension). Subtypes usually must be in the same module or package (Java rules).
- Everyday analogy: a shop's payment methods are only cash, card, e-wallet — a fixed list helps the cashier know they must handle all kinds.

### Exhaustiveness — what the compiler checks
- With a {{switch}} **expression** (returns a value) over a sealed type, if you list every permitted subtype you **do not need a {{default}}**. The compiler proves "there are no other cases".
- If a subtype is missing → **compile-time error**. This is the key difference from a chain of {{if-else}} (checked only at runtime; a missing branch fails silently).

~~~java
sealed interface Payment permits Card, Cash {}
record Card(String number) implements Payment {}
record Cash(long amountCents) implements Payment {}

String fee(Payment p) {
    return switch (p) {                     // switch expression
        case Card c -> "1.5%";             // handle Card
        case Cash c -> "0";                // handle Cash
    }; // all permits covered -> no default needed, compiler accepts
}
// If later you add: record Wallet(...) implements Payment
// and update permits -> fee() WILL FAIL TO COMPILE because case Wallet is missing.
~~~

### Adding a new subtype — why this is a "lead-level" benefit
- Safe workflow: (1) add {{Wallet}} and declare it in {{permits}}; (2) build → the compiler lists every {{switch}} that does not handle {{Wallet}}; (3) fix each place. No more "forgot one spot, bug shows up 3 months later".
- Compared to the **visitor pattern** (a design pattern that separates an algorithm from the object structure): visitor also forces updates when adding a type, but needs more boilerplate (visitor interface, accept method). Sealed + switch gives exhaustiveness checking with shorter code and dispatch (branch selection) clearly visible at the call site.

### {{non-sealed}} and trade-offs
- A {{non-sealed}} branch allows "uncontrolled" subclasses outside → the compiler can **no longer** prove everything is covered (unknown subtypes may appear at runtime) → you **must** have a {{default}} or a parent-type branch. So use {{non-sealed}} deliberately, only when you truly need an extension point.

### Migration and review pitfalls
- **{{null}}:** pattern matching switch throws {{NullPointerException}} if the selector is {{null}} and you do not have {{case null}}. Always decide clearly: accept null ({{case null}}) or reject it before the switch.
- **Case order (dominance):** a general pattern (e.g. a parent type) placed before a specific pattern → the specific branch is hidden and the compiler reports an error. Put specific branches first.
- **Guard {{when}}:** {{case Card c when c.expired() -> ...}} adds a condition; a guarded branch may not cover that whole subtype → you may still need a "remaining" branch for the same subtype.
- **Overuse on open domains:** if subtypes change often via external plugins, sealed forces edits in many places; use a regular interface with {{default}} instead.

| Approach | When adding a new type | Boilerplate | Checking |
|---|---|---|---|
| Old {{if-else/instanceof}} | Easy to forget, silent | Low | Runtime |
| Visitor pattern | Forced to update | High | Compile-time (with discipline) |
| Sealed + switch pattern | Compiler reports every missing spot | Low | Compile-time |

> Senior tip: model "closed" domains (order states, event kinds, processing results) with {{sealed interface}} + {{record}} for each variant, then use exhaustive switch expressions. When someone adds a new variant, let the compiler lead the way — that is a bigger design benefit than the syntax. Only use {{default}} when you truly accept "unknown types" (e.g. reading future data), and in that case log/warn instead of swallowing silently.`,
    follow: [
      'Why does a pattern switch over a sealed type usually not need {{default}}, and when do you still need it?',
      'How does {{non-sealed}} affect the compiler\'s ability to check exhaustiveness?',
      'How does a pattern switch handle {{null}} differently from a traditional switch on {{String/enum}}?'
    ]
  },
  'modern-045': {
    q: `Sealed class and pattern matching for switch (Java 21): when exhaustiveness is guaranteed and pitfalls when migrating from if-else/visitor.`,
    a: `**Summary:** Since Java 21, {{sealed}} (restricts the set of subclasses) combined with pattern matching for {{switch}} lets the compiler check exhaustiveness (all cases covered) at compile time. When migrating from a chain of {{if-else instanceof}} or from the visitor pattern, you get shorter code and better safety when adding new types, but you must watch out for {{null}}, case order, and only use it for truly "closed" domains.

### What and why (migration context)
- **Old approach 1 — {{if-else}} + {{instanceof}}:** checks types branch by branch. Easy to miss a branch; adding a new subtype has no mechanism to remind you, and the bug only appears when that case runs.
- **Old approach 2 — visitor pattern ("visitor" design pattern):** each subtype has {{accept(visitor)}}, and the visitor declares one method per subtype. Adding a new subtype forces changes to the visitor interface → every visitor implementation fails to compile. Safe, but lots of boilerplate.
- **New approach (Java 21):** {{sealed interface}} + {{record}} for variants + exhaustive switch expression. You keep compile-time checking close to visitor, but dispatch is compact at the call site with fewer helper classes.

~~~java
// Before: if-else can miss branches
String render(Shape s) {
    if (s instanceof Circle c) return "O r=" + c.r();
    else if (s instanceof Rect r) return "[] " + r.w() + "x" + r.h();
    return "?"; // adding Triangle later still returns "?" silently -> bug
}

// After (Java 21): sealed + exhaustive switch
sealed interface Shape permits Circle, Rect, Triangle {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}

String render(Shape s) {
    return switch (s) {
        case Circle c -> "O r=" + c.r();
        case Rect r   -> "[] " + r.w() + "x" + r.h();
        case Triangle t -> "/\\";
    }; // missing Triangle -> COMPILE ERROR (compiler guides you to fix)
}
~~~

### What exhaustiveness guarantees (and what it does not)
- **Guaranteed at compile time:** with a {{switch}} expression over a sealed type, if the hierarchy is completely "closed" (no {{non-sealed}} branch open), the compiler proves every permitted type is handled. Adding a new subtype → every switch missing a branch fails to compile.
- **Does not handle {{null}} automatically:** a {{null}} selector throws {{NullPointerException}} unless you have {{case null}} (Java 21) or reject it first. This is a common source of crashes when migrating.
- **Does not cover guarded conditions:** {{case Rect r when r.w() == 0 -> ...}} covers only part of {{Rect}}; you still need {{case Rect r -> ...}} for the rest, otherwise it is not exhaustive.

### Migration pitfalls (common in practice)
- **Keeping the habitual {{default}}:** adding {{default -> throw ...}} "just in case" on a fully closed sealed type → you just disabled the biggest benefit: the compiler no longer reports when a new subtype is added. Only use {{default}} when the hierarchy has {{non-sealed}} or you intentionally accept unknown types.
- **Wrong case order (dominated pattern):** placing {{case Shape s -> ...}} before child branches → child branches never run, and the compiler reports an error. Rule: specific first, general last.
- **Confusing preview vs final status:** pattern matching for switch went through several preview releases (Java 17-20) and became **final in Java 21**. Old preview code samples may differ in syntax/details; always check against your project's JDK.
- **Half-migrating from visitor:** mixing visitor and switch across the codebase scatters logic. Pick one approach per hierarchy.
- **Open domains:** if plugins/partners add subtypes at runtime, sealed forces edits in central code → not a fit; use a regular interface.

### Quick decision table
| Hierarchy characteristic | Recommendation |
|---|---|
| Fixed set of variants, owned by the team (states, events, results) | {{sealed}} + {{record}} + exhaustive switch |
| Needs extension points for third parties | regular interface (consider controlled {{non-sealed}}) |
| Visitor is stable and the team is comfortable with it | no rush to migrate; migrate when adding types becomes painful |

> Senior tip: when migrating, start with a "small, closed, instanceof-heavy" hierarchy (e.g. {{Success/Failure}} results). Step 1: turn it into {{sealed interface}} + {{record}}. Step 2: replace {{if-else}} with a switch expression **without {{default}}**. Step 3: add {{case null}} if the input can be null. The real payoff comes the next time someone adds a subtype: the compiler points straight to every place that must change — something {{if-else}} never does.`,
    follow: [
      'Why does the visitor pattern check completeness mainly via discipline/compile checks on the interface, while sealed+switch checks directly at the use site?',
      'When should you NOT use {{sealed}} for a hierarchy?',
      'How do nested record patterns (deconstruction patterns, Java 21) help when destructuring data?'
    ]
  },
  'modern-046': {
    q: `From Java 8 to 21: migration roadmap and the most valuable features.`,
    a: `**Summary:** The safest roadmap is to move through **LTS** releases (Long-Term Support — releases with long support windows: 8→11→17→21), with a measured baseline at each step, automated compatibility scanning, parallel CI, and canary/rollback rollouts. The biggest value of reaching 21 is not only syntax ({{record/sealed/pattern matching}}) but also runtime (modern GCs, **virtual threads** for I/O) and platform security (strong encapsulation).

### Why step through LTS releases instead of jumping 8→21
- Each milestone removes/breaks a different group of things: module/encapsulation, removed APIs, GC behavior, library requirements (Spring Boot 3 requires Java 17). Jumping straight mixes failures together and makes root-cause isolation hard.
- Stepping through lets you: (1) isolate causes, (2) upgrade dependencies to compatible versions at the right milestone, (3) keep a clear rollback path.
- Everyday analogy: renovating an old building — do the foundation, then plumbing/electrical, then interior; doing everything at once means you cannot tell what broke.

### Valuable milestones (practical view)
| Release | Valuable for real projects | Migration notes |
|---|---|---|
| 9 | Module system (JPMS), collection APIs {{List.of/Map.of}} | JPMS can be deferred initially, but encapsulation gets stricter |
| 10 | Local {{var}} | pure syntax, low risk |
| 11 (LTS) | Standard HTTP Client, new {{String}} APIs, TLS/cert updates, better runtime | many libraries drop Java 8 support; check {{javax.*}} → {{jakarta.*}} not required yet here |
| 14-16 | {{switch}} expression, text blocks, {{record}}, {{instanceof}} pattern | clear boilerplate reduction; easier build/test |
| 17 (LTS) | {{sealed}}, **strong encapsulation** by default (harder to access JDK internals), some default randomization changes | Spring Boot 3.x requires Java 17; this is often the biggest gate |
| 21 (LTS) | **virtual threads** (JEP 444), pattern matching for {{switch}}, record patterns, sequenced collections | big win for I/O-bound services; still needs measurement |

### Step-by-step migration roadmap (apply to 1 service, then scale to many)
1. **Measure a baseline before changing anything:** tests green, p50/p95/p99 latency, throughput, GC pauses, heap, startup time. Without a baseline you cannot prove "no regression".
2. **8→11:** upgrade the toolchain; run {{jdeps}} / {{jdeprscan}}; replace removed APIs ({{JAXB}}, {{javax.xml.bind}} — add dependencies if used); check TLS/ciphers; upgrade DB/broker drivers if needed. Keep CI running 8 and 11 in parallel for a short period.
3. **11→17 (often the hardest gate):** handle reflection/internal access ({{--add-opens}} is only a temporary workaround, track cleanup tickets); upgrade frameworks (Spring Boot 2.7 → 3.x pulls in {{javax.*}} → {{jakarta.*}} namespace); verify agent/bytecode compatibility (Mockito, APM, Lombok). With Spring Boot 3.x + Hibernate 6 (default ORM) run migration tests thoroughly.
4. **17→21:** use {{record/sealed/pattern}} to reduce error-prone code; try **virtual threads** for I/O-bound workloads (see {{modern-039}}: limit with semaphores, watch {{ThreadLocal}}/pinning) and **measure** before enabling broadly.
5. **Parallel CI and rollout:** JDK matrix (17, 21) during transition; staging smoke tests; deploy via canary/blue-green; monitor metrics for 24-48h; rollback by redeploying the previous image.

~~~text
8 (LTS) --upgrade deps/toolchain--> 11 (LTS) --encapsulation + jakarta--> 17 (LTS) --use VT/pattern--> 21 (LTS)
   | measure baseline at each step |  scan jdeps/jdeprscan  |  canary + rollback  |
~~~

### Production pitfalls
- **Skipping straight 8→21:** errors from module encapsulation, {{jakarta.*}}, GC, and libraries all pile up at once.
- **Reflection/agents break silently:** code runs but behavior changes (serialization, proxies). You need integration tests and startup log checks.
- **Virtual threads for CPU-bound work:** not faster, sometimes worse; VT solves the "many tasks waiting on I/O" problem.
- **Ignoring warmup/JIT cost:** comparing "cold" performance right after deploy with "warm" performance before → wrong conclusions.
- **Keeping {{--add-opens/--illegal-access}} forever:** technical debt that can break on a future JDK.

> Senior tip: treat an LTS upgrade as a project with an owner, a playbook, and metrics — not a "version bump". For multi-service systems, use waves (pilot → non-critical → core) as in {{modern-038}}. Value priority order: (1) safety/maintainability (LTS, CVEs, supported libraries), (2) runtime reliability (GC, observability), (3) developer productivity (record/sealed/pattern), (4) I/O throughput (virtual threads) — but (4) only pays off when you measure and limit downstream resources correctly.`,
    follow: [
      'Why is the 11→17 step often harder than 8→11 in Spring-based systems?',
      'What problems do virtual threads solve, and what problems do they NOT solve?',
      'How does strong encapsulation from Java 16/17 affect libraries that use reflection or access JDK internals?'
    ]
  }
});
