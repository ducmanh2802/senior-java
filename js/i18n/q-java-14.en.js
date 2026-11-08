/*
 * English translation of js/data/q-java.js — task T731. Format: js/core/i18n.js (content overlay).
 * ids: modern-031 modern-032 modern-033 modern-034 modern-035 core-035 modern-037 modern-038
 */
App.i18n.content({
  'modern-031': {
    q: `Sequenced collections (Java 21) add what compared to the older List/Set API?`,
    a: `**Summary:** Java 21 introduces the {{SequencedCollection}} interface (and its siblings {{SequencedSet}} and {{SequencedMap}}) to standardize order-based operations. It provides clear APIs for accessing/manipulating the first and last elements, and reversing the collection, with {{reversed()}} returning an efficient view rather than a copy.

### The Problem: Before Java 21
- Different collections had different APIs for the same concept: {{List}} used {{get(0)}} and {{get(size()-1)}}, {{ArrayDeque}} used {{peekFirst()}} and {{peekLast()}}, while {{LinkedHashSet}} lacked a direct way to access the first/last element without an iterator.
- Developers had to use {{instanceof}} or rely on specific implementations, making generic code messy and hard to maintain.

### The Solution: SequencedCollection
- The new {{SequencedCollection<E>}} interface standardizes:
  - {{first()}}, {{last()}} (O(1) for most implementations).
  - {{addFirst(E)}}, {{addLast(E)}}.
  - {{removeFirst()}}, {{removeLast()}}.
  - {{reversed()}} (returns a view with the same elements in reverse order).
- {{List}}, {{Deque}}, {{LinkedHashSet}}, and {{SortedSet}} now implement this interface.

### Real-World Example
~~~java
SequencedCollection<String> items = new ArrayList<>(List.of("a", "b", "c"));
System.out.println(items.first()); // "a"
System.out.println(items.last());  // "c"

// Iterate backwards efficiently (view, no copy)
for (String s : items.reversed()) {
    System.out.println(s); // "c", "b", "a"
}

items.addFirst("z"); // items is now ["z", "a", "b", "c"]
~~~

### Pitfalls & Best Practices
- {{reversed()}} is a **view**: Modifying the original collection reflects in the reversed view, and vice versa. This can lead to bugs if you expect a snapshot.
- **Copying**: If you need an independent snapshot, explicitly copy: {{new ArrayList<>(items.reversed())}}.
- **Sets**: Remember that {{SequencedSet}} does not have index-based access ({{get(i)}}).

### Interview Answer
"Before Java 21, handling ordered collections like {{ArrayList}} or {{LinkedHashSet}} was inconsistent because there wasn't a unified API to access or manipulate the first and last elements. {{SequencedCollection}} solves this by providing standard methods like {{first()}}, {{last()}}, and the ability to add/remove from both ends. A key point is that {{reversed()}} returns a view, not a copy, making reverse iteration efficient even for large collections, though you must remember it's a view and modifications to the original collection will affect the reversed version."

> Senior tip: Replace manual {{get(size()-1)}} calls with {{last()}} for better readability. Always be clear whether you are using a view ({{reversed()}}) or need a snapshot (copy).`,
    follow: ['Is reversed() a copy?', 'What is different about SequencedMap?'],
  },
  'modern-032': {
    q: `How do record patterns and switch-pattern exhaustiveness work with a sealed class?`,
    a: `**Summary:** A record pattern destructures a record inside pattern matching; a switch over a sealed type is exhaustiveness-checked by the compiler — a missing case is a compile error, forcing you to handle all possible subtypes.

### Why it is needed
- Traditionally, you had to write {{instanceof}} followed by an explicit cast and getter calls. Java 21 allows you to write {{if (o instanceof Point(int x, int y))}}.
- A sealed class limits its own subtypes, allowing the compiler to verify if all cases are covered in a {{switch}}.

### How it works
- **Record patterns**: Deconstructs a record into its components.
- **Switch exhaustiveness**: {{switch (shape) { case Circle c -> ...; case Rect r -> ...; }}} does not require a {{default}} case if the type is sealed because the compiler knows all possible cases. If you add a new subtype, the compiler reports all unhandled cases.

### Pitfall
- A {{switch}} over a non-sealed type still needs a {{default}} case to be exhaustive.
- Pattern matching for primitives is not fully complete yet.
- Records work best for domain modeling; avoid overusing destructuring for complex objects.

### Interview Answer
"Record patterns let us deconstruct objects directly in {{instanceof}} or {{switch}}, significantly reducing boilerplate code like manual casts. Combined with sealed classes, Java's {{switch}} becomes exhaustive, meaning the compiler can check if every possible subtype is handled. If I add a new subtype to a sealed class, any unhandled {{switch}} expression will immediately fail to compile, which acts as a great safeguard against bugs when domain models expand."

> Senior tip: Combine {{sealed}} classes, {{record}} types, and {{switch}} expressions to model your domain safely; the compiler will actively help you maintain consistency when adding new subtypes.`,
    follow: ['What is a sealed class?', 'When do you need a default in a switch?'],
  },
  'modern-033': {
    q: `What is the current status of string templates (JEP 430)? Should you use them in production?`,
    a: `**Summary:** String templates were a preview feature in JDK 21 and were withdrawn in JDK 22; they are NOT currently slated for stable release. DO NOT use them in production. Use {{Text Blocks}} with {{String.formatted()}} or {{MessageFormat}} instead.

### Why it is important
- Many online tutorials still show {{"\"\"\""}} as if it were a string template—that is incorrect; those are {{Text Blocks}} (introduced in Java 15).
- Preview/withdrawn features change between JDK releases; only use stable APIs in production code.

### The Safe Alternatives
- Use **Text Blocks** for SQL/JSON to handle multi-line strings cleanly.
- Use {{String.formatted()}} or {{MessageFormat}} for string interpolation in stable code.
- Avoid enabling {{--enable-preview}} in production builds, as the compiled bytecode may not be compatible with different JDK versions.

### Pitfalls
- Confusion: mistaking Text Blocks for string templates.
- **Preview feature risk**: enabling preview features in production makes your application tightly coupled to a specific (and potentially unstable) JDK version, causing major issues during future upgrades or runtime environment changes.

### Interview Answer
"String templates were introduced as a preview in JDK 21 but were subsequently withdrawn in later releases, so they are not currently suitable for production use. I stick to Text Blocks for readable multi-line string handling, combined with {{String.formatted()}} or {{MessageFormat}} for interpolation. My rule of thumb is to never enable {{--enable-preview}} in production because it ties the code to a specific, potentially unstable JDK version and complicates future maintenance."

> Senior tip: Always check the JEP status; for production, only merge features once they are marked as 'Final' or 'Stable'. Clearly state the target JDK version in your build configuration.`,
    follow: ['Text block vs string templates?', 'When would you enable preview?'],
  },
  'modern-034': {
    q: `Which problems of ThreadLocal do Scoped Values and Structured Concurrency (preview) solve?`,
    a: `**Summary:** {{ScopedValue}} is an immutable {{ThreadLocal}} with lexical scope, avoiding leaks and making cleanup automatic. {{StructuredTaskScope}} groups child tasks into a single unit of work, ensuring all tasks within that structure are managed (cancelled, joined, or monitored) together, which prevents task leakage and orphan tasks.

### The Problem with ThreadLocal
- **Mutables**: Any code can call {{set()}} on a {{ThreadLocal}}, making it hard to track where values are modified.
- **Leaks**: They require manual cleanup ({{remove()}}), which is easy to forget in {{finally}} blocks.
- **Virtual Threads**: With millions of virtual threads, {{ThreadLocal}} objects create significant memory overhead as each thread carries its own map of values.

### The Solution
- **ScopedValue**: Defines values that exist only within a specific block (lexical scope). It is immutable and automatically inherited by child tasks.
- **StructuredTaskScope**: Forks tasks within a scope, allowing you to easily join them or cancel the entire scope if one task fails, providing structured exception handling.

### Pitfalls
- Both are currently **preview features**—they are not ready for production code yet.
- {{StructuredTaskScope}} API continues to evolve.

### Interview Answer
"{{ThreadLocal}} is problematic because it's mutable, prone to memory leaks if cleanup is forgotten, and expensive when using virtual threads. {{ScopedValue}} solves this by providing immutable, lexically-scoped values that are automatically cleaned up and inherited. {{StructuredTaskScope}} provides better task lifecycle management, ensuring that all subtasks are accounted for and cancelled if the parent fails. While these are currently preview features, they represent the future of manageable concurrency in Java."

> Senior tip: Keep monitoring these features, but continue using {{ThreadLocal}} with explicit cleanup in {{finally}} blocks for current production workloads until these alternatives become stable.`,
    follow: ['Where does ThreadLocal leak?', 'Virtual threads + ThreadLocal?'],
  },
  'modern-035': {
    q: `What does Generational ZGC (Java 21) improve compared with the older ZGC?`,
    a: `**Summary:** Generational ZGC adds a young/old generation to ZGC, which significantly reduces CPU overhead and improves pause times for workloads with many short-lived objects. It is enabled with {{-XX:+UseZGC -XX:+ZGenerational}} in Java 21; it became the default ZGC implementation in Java 23+.

### The Problem with Non-Generational ZGC
- The older non-generational ZGC scanned the entire heap on every collection cycle.
- This resulted in high CPU usage for workloads where many objects are allocated and die quickly (high churn).

### The Solution: Generational ZGC
- It applies the **Weak Generational Hypothesis**: most objects die young.
- By separating the heap into young and old generations, it can collect young objects more frequently and efficiently, drastically reducing the effort needed for old generation collection.

### Pitfalls & Best Practices
- **CPU vs Latency**: ZGC prioritizes low latency (sub-millisecond pauses), but it generally requires more CPU overhead compared to G1 (the default GC for most applications).
- **GC Choice**: Always choose your Garbage Collector based on your specific workload requirements (throughput vs. latency).
- **Measurement**: Never change the GC without measuring the impact on your real workload.

### Interview Answer
"Generational ZGC, introduced as a stable feature in JDK 21, adds generational capability to ZGC. Previously, ZGC scanned the whole heap, which was inefficient for high-churn applications. By separating young and old objects, it collects young ones more efficiently based on the generational hypothesis. It’s ideal for latency-sensitive applications that require sub-millisecond pauses, but you should still measure it against G1—the default for most applications—because the CPU footprint of ZGC can be higher."

> Senior tip: Start with G1 as the default GC. Only move to ZGC if your p99 latency requirements strictly demand it and you've benchmarked the CPU overhead."`,
    follow: ['So sánh G1 vs ZGC?', 'Khi nào dùng Shenandoah?'],
  },
  'core-035': {
    q: `What steps does an upgrade roadmap from a Java 8/11 project to Java 21 include — jdeps, --add-opens, old libraries?`,
    a: `**Summary:** Upgrading to Java 21 is a structured process: 1. Update the JDK used in the build, 2. Run existing tests, 3. Use {{jdeps}} and {{jdeprscan}} to identify removed or deprecated APIs, 4. Resolve issues with deep reflection (e.g., {{--add-opens}}), 5. Update major dependencies (Spring Boot 3, Hibernate 6), 6. Enable a suitable GC and monitor metrics. Avoid enabling preview features in production.

### Detailed Steps
1. **Infrastructure**: Install JDK 21 and set {{source/target}} to 21 in build tools (Maven/Gradle).
2. **Compile & Test**: Run the full suite. Address compile errors, such as {{javax.*}} to {{jakarta.*}} namespaces if migrating to Spring Boot 3.
3. **Analyze**:
   - {{jdeps --jdk-internals}}: Identifies usage of internal JDK APIs that may have been removed or encapsulated.
   - {{jdeprscan}}: Identifies usage of APIs deprecated for removal.
4. **Reflection/Encapsulation**: If third-party libraries use deep reflection (common in older libs), add {{--add-opens module/package=ALL-UNNAMED}} as a temporary workaround. *Prioritize refactoring these away.*
5. **Update Dependencies**: Update core frameworks (Spring, Hibernate, etc.) to versions compatible with Java 21.
6. **Performance Tuning**: Configure a suitable Garbage Collector and monitor p99 latency, GC pauses, and memory usage under load.

### Pitfalls
- **{{--add-opens}} as a permanent solution**: This is a workaround, not a fix. Maintain a backlog for refactoring.
- **Dependency Issues**: Not all libraries are modularity-aware or compatible with JDK 21+.

### Interview Answer
"Upgrading to Java 21 isn't just about changing the JDK version; it's a structured engineering process. I start by updating the JDK and running tests to catch breaking changes. I use tools like {{jdeps}} and {{jdeprscan}} to proactively find internal or deprecated API usage. I handle deep reflection issues—common in older libraries—by temporarily adding {{--add-opens}} while maintaining a refactor backlog to remove them later. Finally, I update core dependencies, tune the GC, and thoroughly monitor metrics like latency and memory to ensure performance parity before fully rolling out."

> Senior tip: Migrate small services first; keep a dual build (JDK 11 and 21) in CI for a while."`,
    follow: ['How do you read jdeps output?', 'When do you need --add-exports?'],
  },
  'modern-037': {
    q: `How do text blocks help in SQL/JSON tests, and what should you know about indentation?`,
    a: `**Summary:** A text block ({{"\"\"\""}}) holds a multi-line string; indentation is stripped according to the least-indented line; {{ \s}} preserves trailing space; it makes SQL/JSON tests highly readable.

### Why it is needed
- Traditionally, you had to concatenate strings and manually escape quotes—which is noisy and error-prone.
- A text block keeps the formatting, so SQL/JSON remains human-readable.

### How it works
- The first line after the opening {{"\"\"\""}} must be a line break (or {{ \}} for continuation).
- The minimum indentation is automatically stripped. Align the closing {{"\"\"\""}} with your code for predictable indentation removal.
- **Escapes**: {{ \\}} for a backslash, {{"\""}} for a quote—note that a single quote inside a text block needs **no** escape!

### Pitfalls & Best Practices
- **Trailing whitespace**: It is automatically stripped unless you explicitly use {{ \s}}.
- **Indentation**: Mixing spaces and tabs or misaligning indentation levels often results in unexpected string content.

### Interview Answer
"Text blocks, introduced in Java 15, allow us to represent multi-line strings without cumbersome concatenation and escaping, making SQL queries and JSON payloads much more readable. The key is that the compiler automatically strips the minimum common indentation, which is why aligning the closing {{ \"\"\"}} with the opening code is crucial. It simplifies testing and documentation, and I use {{ \s}} when I need to explicitly preserve trailing whitespace."

> Senior tip: Align the closing {{"\"\"\""}} with the code so the indentation is stripped correctly; write a snapshot test to compare the output."`,
    follow: ['Is a text block a compile-time constant?'],
  },
  'modern-038': {
    q: `(Lead) An LTS upgrade policy for 30 services: how do you keep it synchronised and safe?`,
    a: `**Summary:** Treating an LTS upgrade as a project with clear owner, playbook, and metrics, not just "bumping a version." Split the upgrade into waves (pilot → non-critical → core) and implement a CI matrix, canary deploys, and rollback plans. Use {{jdeps}}/{{jdeprscan}} and contract tests to ensure safety; track metrics (latency, error rate, GC pause) before and after.

### Why it is important
- 30 services cannot be upgraded at the same time. You need a controlled approach with waves.
- Risks include outdated libraries, reflection issues (strong encapsulation), and GC behavioral changes that affect latency.

### How to do it
1. **Standardise**: Define a JDK 21 baseline, a build toolchain (Maven/Gradle), and prohibit internal API usage.
2. **Waves**: Start with low-traffic services, then core, then the rest.
3. **Rollout**: Use canary deploys (5% traffic) and strictly monitor p99 latency, error rates, and GC pause times. Roll back immediately if regressions occur.
4. **Tooling**: Use {{jdeps}}/{{jdeprscan}} to identify issues early, and SCA (Software Composition Analysis) for dependency CVEs.

### Pitfalls
- **No rollback plan**: Always keep the old image ready for a quick rollback.
- **Ignoring Dependency CVEs**: Treat the upgrade as an opportunity to also address security debt.

### Interview Answer
"I treat LTS upgrades as a project, not just a version bump. I establish a standard JDK baseline and rollout in waves, starting with non-critical services. I utilize {{jdeps}} and {{jdeprscan}} to identify incompatible APIs early and use canary deployments (5% traffic) to validate each service in production while monitoring p99 latency, GC pauses, and error rates. The most crucial part is a clear rollback plan and treating the upgrade as an opportunity to also clean up technical debt and address dependency security vulnerabilities."

> Senior tip: Treat the LTS upgrade as an RFC (Request for Comments) with a clear owner and a documented playbook; freeze new feature deployments during high-risk upgrade waves."`,
    follow: ['How do you measure a regression after an upgrade?'],
  },
});
