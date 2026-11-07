/*
 * English translation of js/data/q-java.js — task T731. Format: js/core/i18n.js (content overlay).
 * ids: modern-031 modern-032 modern-033 modern-034 modern-035 core-035 modern-037 modern-038
 */
App.i18n.content({
  'modern-031': {
    q: `What do sequenced collections (Java 21) add compared to the older List/Set API?`,
    a: `**Summary:** Java 21 adds the SequencedCollection interface with first()/last()/reversed(); reversed() is a view, not a copy.

### Why it is needed
- Before Java 21, getting the first/last element of a LinkedHashSet or a Deque was inconsistent (get(0), getLast, peekFirst).
- SequencedCollection standardises the whole family: first(), last(), addFirst/addLast, removeFirst/removeLast, reversed().

### How it works
- List, Deque, LinkedHashSet and SequencedSet implement the interface.
- reversed() returns a reversed view with no copy → changing the view changes the backing collection.

### Pitfall
- reversed() is a view: sorting the reversed view and then mutating the original will affect it.
- A Set has no index at all, only first/last.

> Senior tip: use reversed() to iterate backwards without copying a big list; watch out for concurrent modification.`,
    follow: ['Is reversed() a copy?', 'What is different about SequencedMap?'],
  },
  'modern-032': {
    q: `How do record patterns and switch-pattern exhaustiveness work with a sealed class?`,
    a: `**Summary:** A record pattern destructures a record inside pattern matching; a switch over a sealed type is exhaustiveness-checked by the compiler — a missing case is a compile error.

### Why it is needed
- Before, you wrote instanceof + an explicit cast + getter calls. Java 21 lets you write if (o instanceof Point(int x,int y)).
- A sealed class limits its own subtypes, so the compiler knows the complete set of cases.

### How it works
- switch (shape) { case Circle c -> ...; case Rect r -> ...; } needs no default when the type is sealed.
- Record patterns nest: case Line(Point p1, Point p2) pulls the components apart in one step.

### Pitfall
- A switch over a non-sealed type still needs a default.
- Pattern matching for primitives is not complete yet.

> Senior tip: combine sealed + record + a switch expression to model your domain; the compiler then reports every missing case when you add a new subtype.`,
    follow: ['What is a sealed class?', 'When do you need a default in a switch?'],
  },
  'modern-033': {
    q: `What is the current status of string templates (JEP 430)? Should you use them in production?`,
    a: `**Summary:** String templates were a preview feature in JDK 21 and were withdrawn from JDK 22; do NOT use them in production. Use text blocks + formatted, or String.formatted.

### Why you need to know this
- Many tutorials still show \\"\\"\\" as if it were a string template — it is only a text block.
- Preview/withdrawn status changes from one JDK to the next; production only uses stable APIs.

### The safe way
- Use text blocks for SQL/JSON.
- Use String.formatted or MessageFormat for interpolation.
- Do not turn on --enable-preview in production.

### Pitfall
- Turning on preview in prod → the compiled class will not run on any other JDK release.
- Confusing a text block with a string template.

> Senior tip: follow the JEPs, but only merge a feature once it is stable; state the JDK target explicitly in the pom.`,
    follow: ['Text block vs string templates?', 'When would you enable preview?'],
  },
  'modern-034': {
    q: `Which problems of ThreadLocal do scoped values and structured concurrency (preview) solve?`,
    a: `**Summary:** ScopedValue is an immutable ThreadLocal with a lexical scope; StructuredTaskScope groups child tasks by structure → easy to cancel, easy to propagate exceptions.

### Why it is needed
- ThreadLocal is mutable, leaks easily, is awkward to clean up, and does not propagate to child threads by itself.
- With many virtual threads, ThreadLocal costs memory.

### How it works
- ScopedValue.where(KEY, val).run(() -> ...) → the value only exists inside that block.
- StructuredTaskScope: fork the tasks, join them; the whole scope is cancelled when one task fails.

### Pitfall
- Both are preview → not for production.
- StructuredTaskScope is not a stable API yet.

> Senior tip: learn the concepts now to be ready; production still uses ThreadLocal + an ExecutorService with explicit cleanup.`,
    follow: ['Where does ThreadLocal leak?', 'Virtual threads + ThreadLocal?'],
  },
  'modern-035': {
    q: `What does Generational ZGC (Java 21) improve compared with the older ZGC?`,
    a: `**Summary:** Generational ZGC adds a young/old generation → less CPU overhead and shorter pause times for workloads with lots of short-lived objects; enable it with -XX:+UseZGC -XX:+ZGenerational.

### Why it is needed
- The old non-generational ZGC scanned the entire heap on every cycle → high CPU usage when object churn is large.
- The generational version exploits the weak generational hypothesis (most objects die young).

### How to enable
- JDK 21+: -XX:+UseZGC -XX:+ZGenerational.
- JDK 23+: generational is the default.

### Pitfall
- ZGC does not compact region-by-region the way G1 does? Pauses still stay under 1ms, but the price shows up as CPU footprint.
- Choose the GC from the workload: throughput vs latency.

> Senior tip: measure on your real workload; G1 is still the safe default for most applications; ZGC is for latency-sensitive ones.`,
    follow: ['G1 vs ZGC — how do they compare?', 'When would you use Shenandoah?'],
  },
  'core-035': {
    q: `What steps does an upgrade roadmap from a Java 8/11 project to Java 21 include — jdeps, --add-opens, old libraries?`,
    a: `**Summary:** The steps are: upgrade the JDK used to build → run the tests → use jdeps/jdeprscan to find removed APIs → handle --add-opens for reflection → update the libraries → enable preview? no. Tune the GC last.

### Detailed steps
1. Install JDK 21 and set source/target 21 in the build.
2. Run the full test suite; fix compile errors (javax→jakarta when moving to Spring 6).
3. Run jdeps --jdk-internals to find use of internal JDK APIs.
4. Run jdeprscan to find APIs deprecated for removal.
5. If an old library uses deep reflection: add --add-opens module/pkg=ALL-UNNAMED as a temporary measure.
6. Update the dependencies (Spring Boot 3, Hibernate 6).
7. Enable a suitable GC and measure.

### Pitfall
- --add-opens is only a workaround; refactor so you no longer need it.
- Pre-JPMS libraries are not module-aware.

> Senior tip: migrate small services first; keep a dual build (JDK 11 and 21) in CI for a while.`,
    follow: ['How do you read jdeps output?', 'When do you need --add-exports?'],
  },
  'modern-037': {
    q: `How do text blocks help in SQL/JSON tests, and what should you know about indentation?`,
    a: `**Summary:** A text block (""") holds a multi-line string; indentation is stripped according to the least-indented line; \\s keeps a trailing space; it makes SQL/JSON tests readable.

### Why it is needed
- Before, you concatenated strings and escaped quotes — very noisy.
- A text block keeps the formatting, so SQL/JSON stays readable.

### How it works
- The first line after the opening """ must be a line break (or \\).
- The minimum indentation is stripped; use {{stripIndent}} when you need that behaviour.
- Escapes: \\\\ for a backslash, \\" for a quote inside the block — a single quote needs no escape in a text block.

### Pitfall
- Trailing whitespace is stripped unless you write \\s.
- Mixing indentation levels gives a result that is not what you intended.

> Senior tip: line the closing """ up with the code so the indentation is stripped correctly; write a snapshot test to compare the output.`,
    follow: ['Is a text block a compile-time constant?'],
  },
  'modern-038': {
    q: `(Lead) An LTS upgrade policy for 30 services: how do you keep it synchronised and safe?`,
    a: `**Summary:** Write a policy: a standard JDK version, a timeline split into waves, a CI matrix, canary deploys and rollback; use jdeps/jdeprscan and contract tests; track metrics before and after.

### Why it is needed
- 30 services cannot be upgraded at the same time; you need waves and clear criteria.
- The risks: old libraries, reflection, and a GC change that moves latency.

### How to do it
1. Standardise the build (Maven/Gradle plugin, JDK 21).
2. Wave 1: low-traffic, non-critical services; wave 2: core services; wave 3: the rest.
3. Per service: test + staging + canary 5% → full rollout.
4. Track p99 latency, GC pause time and error rate; roll back on any regression.
5. Document every --add-opens as temporary and keep a refactor backlog.

### Pitfall
- No rollback plan.
- Ignoring dependency CVEs.

> Senior tip: put the "JDK 21 LTS baseline" in an RFC; review it quarterly; freeze new versions for stability.`,
    follow: ['How do you measure a regression after an upgrade?'],
  },
});
