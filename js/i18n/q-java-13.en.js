/*
 * English translation of js/data/q-java.js — task T653. Format: js/core/i18n.js (content overlay).
 * ids: modern-030
 */
App.i18n.content({
  'modern-030': {
    q: `Upgrading a Java 8 codebase to Java 21: {{Text blocks}}, {{var}}, {{switch expression}}, {{SequencedCollection}} — what do you have to watch out for?`,
    a: `**Summary:** upgrading from Java 8 to Java 21 is a planned project, not a version bump in the pom. Java 21 gives you text blocks, var, switch expressions, pattern matching, virtual threads and SequencedCollection. Upgrade one LTS at a time — 8 → 11 → 17 → 21 — and pay attention to the module system, strong encapsulation, reflection and deprecated APIs.

### Text blocks (Java 15)
- They open with three double quotes plus a mandatory line break, and close with three double quotes.
- Incidental whitespace (the smallest common indentation plus trailing whitespace on each line) is stripped; the rules are the semantics of {{stripIndent}}.
- Escapes still work; there is {{ \\s }} to keep a trailing space; a single double quote does not need escaping.
- Use {{formatted}} or {{String.format}}; there is no direct interpolation.
- Perfect for SQL/JSON/HTML/XML; but **do not** concatenate user data into a SQL text block — still use a PreparedStatement.

### var (Java 10)
- The type is inferred at compile time from the initializer; it is not dynamic typing and it costs nothing at runtime.
- Legal only for **local variables**, including in for/foreach and try-with-resources; not for fields, parameters or return types.
- Not usable without an initializer: {{var x;}} is illegal, and {{var x = null;}} is illegal too.
- Use it when the type is long and obvious from the right-hand side: {{var users = new ArrayList<User>();}}.
- Avoid it when the type is not obvious: {{var result = service.process();}} — the reader has to jump into the method to learn what came back. Prefer a name that says the type, or keep the explicit declaration.

### Switch expression (Java 14)
- The {{->}} form has no fallthrough and needs no {{break}}; a block plus {{yield}} is also allowed.
- As an expression it must be exhaustive; a switch over enum/String needs a default unless every value is covered.
- A null selector: throws NPE unless there is a {{case null}} (for a switch on a reference type).
- It produces a value directly, which removes temporary variables and missed-branch assignment bugs.
- Switch statements can still use the old syntax; migrate gradually to the arrow form to avoid fallthrough.
- For an enum, adding a new constant and forgetting a case becomes a compile error in a switch expression — a major benefit when refactoring.

### SequencedCollection (Java 21)
- {{getFirst()}} / {{getLast()}}: read the first/last element (throws {{NoSuchElementException}} when empty).
- {{addFirst(E)}} / {{addLast(E)}}: insert at either end (optional operation, {{UnsupportedOperationException}} if immutable).
- {{removeFirst()}} / {{removeLast()}}: remove at either end (optional).
- {{reversed()}}: returns a reverse **view** (read-only, no copy; changes to the backing collection show through in the view).
- Main implementers: {{List}}, {{Deque}}, {{LinkedHashSet}}, {{LinkedHashMap}}, {{TreeSet}}, {{TreeMap}}.
- **Do not implement it**: {{HashSet}}, {{HashMap}}, {{ConcurrentHashMap}} (they guarantee no stable order).

### Migration path
1. **Measure a baseline**: test suite, JMH numbers, heap/GC logs, dependency tree.
2. **8 → 11**: run {{jdeps --jdk-internals}}, replace the APIs that were removed (JAXB, JAX-WS, CORBA, Nashorn), update TLS, deal with {{--illegal-access}} (11 still allows it, 17 is strict).
3. **11 → 17**: clean up reflection into JDK internals ({{--add-opens}}), move to Spring Boot 3 if you use it, verify that bytecode-sensitive libraries (Lombok, CGLIB, Mockito) are compatible.
4. **17 → 21**: take advantage of pattern matching and records, try virtual threads in I/O-bound code but **measure again** (synchronized pins the carrier thread before Java 24; the connection pool needs re-tuning).
5. **CI**: run old and new JDK side by side, run integration tests, smoke test on staging under real load.
6. **Rollout**: new container image, blue-green if possible; watch GC, p99 latency and memory.

### Pitfalls
- Jumping straight from 8 to 21 makes debugging far harder; moving one LTS at a time narrows down what broke.
- Reflection and bytecode instrumentation (APM agents, an old Lombok) is where things break most often.
- Old libraries that use {{sun.misc.Unsafe}}: they still run on 17/21, but the memory-access methods are deprecated for removal since Java 23 (JEP 471) and print runtime warnings from 24 (JEP 498); plan a move to {{VarHandle}} or the FFM API.
- Virtual threads are not faster for CPU-bound work; do not replace every thread pool.
- {{--add-opens}} is a temporary workaround; fix the code or the library.
- Check TLS, certificates and database driver compatibility.

> Senior tip: treat a JDK migration as a planned project, not a version change in the pom. Start by running the tests on the new JDK in CI **before** touching production; use jdeprscan to find soon-to-be-removed APIs and OpenRewrite to automate part of the work. Never use preview features in production — they can change or be dropped, and a class compiled with a preview feature only runs on that exact JDK build. With text blocks, remember the indentation is stripped per {{stripIndent}}; with var, use it only when the right-hand side already states the type; with switch expressions, add {{case null}} when the data may be null; with SequencedCollection, {{reversed()}} is a view, not a copy.`,
    follow: [`Does var change the type at runtime?`, `How does a switch expression differ from a switch statement?`, `When is SequencedCollection more useful than get(0)/get(size-1)?`]
  }
});
