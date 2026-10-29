/*
 * English translation of js/data/lessons-modern.js — task T267. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-001 lesson-modern-002 lesson-modern-003 lesson-modern-004
 */
App.i18n.content({
  'lesson-modern-001': {
    title: 'Streams: lazy evaluation, stateless/stateful and Collectors grouping by customer and month',
    goals: [
      'Explain how a Stream runs lazily and tell intermediate from terminal operations',
      'Use {{Collectors.groupingBy}}, {{toMap}} and {{partitioningBy}} to aggregate data',
      'Know when to use and when to avoid parallel streams, and avoid side effects inside a pipeline',
    ],
    body: `**Summary:** A Stream is a pipeline for processing data: a source, intermediate operations (lazy, not yet running) and one terminal operation that actually executes the work. Telling stateless from stateful apart helps you write streams that are correct and fast; Collectors (groupingBy, toMap, partitioningBy) aggregate and group data by customer and month; parallel streams should only be used when the data is large and the work does not block.

### How lazy execution works: source → intermediate → terminal
A Stream stores no data; it only carries a pipeline of operations. Calling {{filter}} or {{map}} merely **registers** a processing step — no element has been traversed yet. Only when a **terminal operation** appears ({{collect}}, {{forEach}}, {{toList}}, {{count}}, {{anyMatch}}…) is data pulled through each step.

~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("check " + n); return n.length() > 3; })
    .map(String::toUpperCase);   // nothing printed yet
List<String> out = s.toList();   // terminal -> only now it runs, printing "check ..."
~~~

- A stream works **vertically**: each element goes through every step before the next element enters — it does not filter the whole list and then map. With {{names = [Ann, Bob, Carol]}}, the code above prints "check Ann", "check Bob", "check Carol" interleaved with mapping each element; no intermediate list is ever created.
- A stateful operation such as {{sorted}} is a **barrier**: it must receive all elements before it can push the first one downstream.
- Vertical processing is exactly what lets {{findFirst}}, {{anyMatch}} and {{limit}} **stop early** (short-circuit): {{names.stream().filter(...).findFirst()}} stops at the first matching element and never visits the rest. {{forEach}}, {{collect}} and {{count}} consume everything.
- A Stream is **single-use**: calling a terminal operation a second time throws {{IllegalStateException}}.
- Without a terminal operation nothing runs at all; this is the bug you hit when you forget {{collect}}.

### Stateless vs stateful
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}} process each element independently and need no memory of other elements. Efficient and easy to parallelize.
- **Stateful**: the result for one element depends on other elements, so some state must be kept.
  - {{sorted}} must buffer **all** the data before returning the first element, so {{sorted}} over an infinite stream ({{Stream.iterate}}, {{Stream.generate}}) never terminates.
  - {{distinct}} must remember every value it has seen (a {{HashSet}} underneath), so its memory grows with the number of distinct values.
  - {{limit}}, {{skip}}, {{takeWhile}} and {{dropWhile}} only need a counter or a flag, which is cheap when running sequentially.
- Stateful operations parallelize poorly: the threads must coordinate to preserve encounter order. For example {{limit(10)}} on an ordered parallel stream has to know which are the **first** 10 elements, so it must buffer and synchronize between threads; if you do not need order, calling {{unordered()}} is cheaper.

### Collectors: grouping and aggregating
| Collector | When to use | Result |
|---|---|---|
| {{groupingBy(f)}} | group elements by key | Map<K, List<T>> |
| {{groupingBy(f, groupingBy(g))}} | group two levels deep (customer, then month) | Map<K, Map<K2, List<T>>> |
| {{groupingBy(f, summingDouble(m))}} | group then sum | Map<K, Double> |
| {{toMap(k, v)}} | turn a stream into a map | Map<K, V> |
| {{partitioningBy(pred)}} | split into true/false | Map<Boolean, List<T>> |

{{toMap}} throws {{IllegalStateException}} on duplicate keys; use {{toMap(k, v, (old, newV) -> newV)}} to declare that the newer value wins. {{groupingBy}} returns a {{HashMap}} by default (no ordering); if you want sorted keys, pass a map factory: {{groupingBy(f, TreeMap::new, downstream)}}.

Example grouping transactions by customer and month:
~~~java
Map<String, Map<String, Double>> byCustomer = txns.stream()
    .collect(Collectors.groupingBy(
        Transaction::customerId,
        Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount))
    ));
// byCustomer.get("KH001").get("2024-03") = total amount for customer KH001 in March
~~~

### Parallel streams: only when the data is big enough
A parallel stream splits the source into chunks (through a {{Spliterator}}), processes the chunks on {{ForkJoinPool.commonPool()}} and merges the results. That pool is **shared by the whole JVM** (including {{CompletableFuture.supplyAsync}} when you do not pass an executor). The default number of workers is the number of available CPUs minus one (the thread calling the stream also takes part in the work); you can change it with {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}. Inside a container, the number of available CPUs follows the container's CPU limit.

Parallel is harmful when:
- the work **blocks** (DB, HTTP, files): a few stuck workers clog the shared pool, so every other parallel stream in the JVM slows down too;
- the data is small: the cost of splitting work and merging results is larger than the saving;
- the source **splits poorly**: {{LinkedList}}, {{Stream.iterate}}, I/O streams; while {{ArrayList}}, arrays and {{IntStream.range}} split very well;
- there are non-thread-safe side effects, e.g. {{forEach(list::add)}} into a plain {{ArrayList}}: elements get lost or it throws random exceptions. Use {{collect}} instead of accumulating into an outer variable.

There is no universal size threshold: measure with a benchmark (JMH) on the real workload. In a web service, avoid {{parallelStream}} for I/O; use a dedicated bounded executor (or virtual threads from Java 21) instead.

> Senior tip: write sequential streams by default for clarity; only turn on parallel when a benchmark proves it and the data is large enough. Use {{BigDecimal}} for money, never double in production.

### Interview relevance
Interviewers like to ask: how intermediate and terminal operations differ, whether a Stream stores data, why sorting an infinite stream never finishes, how a two-level groupingBy is written, which pool parallel streams share and when to avoid them. The exercise below makes you write Collectors that group transactions by customer and month, with sorted keys.`,
    exercises: [
      {
        title: 'Aggregate transactions by customer and month',
        prompt: `Given {{List<Transaction>}} (Transaction has {{customerId}}, {{month}} in "YYYY-MM" format, {{amount}}). Write {{TransactionStats.byCustomerAndMonth(txns)}} returning {{Map<String, Map<String, Double>>>}}: customer → (month → total amount).

Requirements:
- Use Stream + Collectors, no hand-written for loops.
- Both the outer map (customer) and the inner map (month) must have their keys **sorted in ascending order** when iterated (so the report prints in order), i.e. use {{TreeMap}}.
- Customers/months without transactions must not appear in the result.`,
        hints: [
          'Start from {{Collectors.groupingBy(Transaction::customerId, Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount)))}}: two-level grouping, the inner level sums the money.',
          '{{groupingBy}} has a three-argument form {{groupingBy(classifier, mapFactory, downstream)}}; pass {{TreeMap::new}} as mapFactory at **both** levels so the keys are sorted.',
          '{{Collectors}} and {{TreeMap}} are already imported ({{java.util.*}}, {{java.util.stream.*}}).',
        ],
        explain: `{{groupingBy}} takes three things: a key function (classifier), the kind of map to build (mapFactory, default {{HashMap::new}}) and a downstream collector (default {{toList()}}) that decides what to do with the elements of the same key. Nesting groupingBy twice builds the structure customer → month → total; {{summingDouble}} extracts each transaction's {{amount}} and accumulates it. The result only contains customer/month pairs that really have transactions; no empty entries are created for you.

Why {{TreeMap::new}} is needed: {{HashMap}} gives no iteration order, so the printed report is jumbled and the order may even change between JDK versions. Months in "YYYY-MM" format also sort correctly as strings, because the year comes first and the month always has two digits.

Common mistakes:
- Passing {{TreeMap::new}} only to the outer level and forgetting the inner one.
- Using {{toMap}} with duplicate keys and no merge function: it throws {{IllegalStateException}}.
- Using {{forEach}} to add into an outer map: it works sequentially but breaks when you switch to parallel; {{collect}} is the correct way.
- Real money should use {{BigDecimal}}, because summing doubles accumulates rounding error (0.1 + 0.2 yields 0.30000000000000004). When {{amount}} is a {{BigDecimal}}, change the downstream collector to {{Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)}}.`,
      },
    ],
    check: [
      {
        q: 'What does a Stream intermediate operation (e.g. {{filter}}, {{map}}) do when called?',
        options: ['Traverses all the data immediately', 'Only builds the pipeline, no element has been processed', 'Implicitly calls a terminal operation', 'Throws an exception when there is no terminal operation'],
        answer: 1,
        explain: 'An intermediate op is lazy: it only registers a processing step into the pipeline, no data has been traversed. Only a terminal op pulls the data through the pipeline. "Traverses immediately" is wrong because laziness is exactly what enables short-circuiting; Java never calls a terminal op implicitly; and a missing terminal op does not throw either — the pipeline simply never runs (a silent bug).',
      },
      {
        q: 'What is Collectors.groupingBy(f, summingDouble(m)) for?',
        options: ['Filtering elements by f', 'Grouping by f then summing m per group', 'Splitting the stream into two true/false parts', 'Sorting by m'],
        answer: 1,
        explain: 'groupingBy splits by the key f; summingDouble(m) is the downstream collector that takes each element value m and accumulates it within its group, producing a Map from key to total. Filtering is the job of filter; splitting true/false is partitioningBy; sorting is sorted or a Comparator, not groupingBy.',
      },
      {
        q: 'When should you NOT use a parallel stream?',
        options: ['Large data, CPU-bound', 'Blocking work such as DB/HTTP calls', 'The source is an ArrayList', 'Stateless operators'],
        answer: 1,
        explain: 'Blocking work pins the workers of ForkJoinPool.commonPool (only about the number of CPUs minus one thread, shared across the whole JVM), starving every other parallel stream and CompletableFuture. The three other options are all conditions **favourable** to parallelism: large CPU-bound data, an ArrayList that splits in half cheaply, and stateless operators that need no coordination between threads.',
      },
    ],
  },
  'lesson-modern-002': {
    title: 'Optional in APIs: orElse/orElseGet, avoid get()',
    goals: [
      'Explain how Optional expresses a possibly absent result instead of returning null',
      'Distinguish {{orElse}} from {{orElseGet}}, and {{of}} from {{ofNullable}}',
      'Write handling chains with Optional without using {{get()}}',
    ],
    body: `**Summary:** Optional is usually used as a return type to express the "no result" case instead of returning null; use {{orElse}}/{{orElseGet}}, avoid the bare {{get()}}, and think carefully before using it as a field, a parameter or a collection element.

### Why Optional exists
Returning null makes callers forget to check ⇒ NullPointerException. Optional makes the possibility of absence visible in the return type so the caller can decide how to handle it. It is a **signal at the API boundary**, not a replacement for every null inside your code.

### How to create one
- {{Optional.of(x)}}: x is guaranteed non-null, otherwise it throws NPE.
- {{Optional.ofNullable(x)}}: accepts null → {{Optional.empty()}}.
- {{Optional.empty()}}: represents the absence of a value; use it when you know for sure there is none.

### Chaining without get()
~~~java
Optional<User> opt = findById(id);
String email = opt.map(User::email)
                  .filter(e -> !e.isBlank())
                  .orElse("no email yet");
~~~
- {{map(f)}}: applies {{f}} if a value is present; an empty Optional skips {{f}} and stays empty. Important detail: if {{f}} returns **null**, {{map}} turns the result into {{Optional.empty()}}. That is why one chain of {{map}} can replace a whole nest of {{if (x != null)}} checks.
- {{filter(p)}}: keeps the value if it matches the condition, becomes empty otherwise.
- {{orElse(default)}}: returns the value inside, or {{default}} if empty.
- {{orElseGet(supplier)}}: only calls {{supplier}} when empty — use it when the default is expensive (a DB read, an API call).
- {{orElseThrow(() -> new NotFoundException(...))}}: turns absence into a clear business error. The no-argument {{orElseThrow()}} (Java 10) throws {{NoSuchElementException}}, just like {{get()}} but with a name that states the intent.
- Java 9 added {{ifPresentOrElse}}, {{or(supplier)}} (try another source when empty) and {{stream()}}; Java 11 added {{isEmpty()}}.

### flatMap: nested Optionals
If a method returns {{Optional}} and you want to keep chaining, use {{flatMap}} instead of {{map}} (map would produce {{Optional<Optional<T>>}}).

~~~java
Optional<Optional<Address>> addr = opt.map(User::address);   // Optional<Optional<Address>>
Optional<Address> addr2 = opt.flatMap(User::address);         // a flat Optional<Address>
~~~

### Where you should not use it
- **Field** of an entity/DTO: {{Optional}} does not implement {{Serializable}}; such a field also usually makes mapping/payloads more complicated. With Jackson, support depends on the module/configuration, and a JPA entity should use a plain value field.
- **Method parameter**: usually accept a possibly-null value or provide overloads instead of forcing the caller to wrap one value in an Optional; choose based on the contract and how the API is used.
- **Collection**: return an empty list instead of {{Optional<List<T>>}}; the caller can iterate an empty list with no checks at all.
- **{{opt.get()}}**: throws {{NoSuchElementException: No value present}}; the message does not say what is missing, which makes it hard to debug. Use {{orElseThrow}} with a business-meaningful exception.
- Calling {{opt.isPresent()}} then {{opt.get()}} inside an if: that is just a longer null check and gains nothing from Optional.
- Never return {{null}} from a method whose return type is {{Optional}}: the caller trusts that no null check is needed and will hit a NPE.

### orElse vs orElseGet
~~~java
User u1 = opt.orElse(loadFromDb());      // always hits the DB
User u2 = opt.orElseGet(() -> loadFromDb());  // only calls it when empty
~~~

Why does {{orElse}} always call the DB? It is not Optional's fault — it is a Java rule: **every argument is fully evaluated before the method is called**. In the first line {{loadFromDb()}} runs first, its result is passed into {{orElse}}, and only then does {{orElse}} check whether the Optional has a value. In the second line the argument is a lambda (a "recipe" that has not run yet), and {{orElseGet}} invokes it only when actually needed.

Production consequence: {{orElse(createDefaultUser())}} where that function has side effects (inserting into the DB, sending an email) runs on **every call**, even when the user was found. Rule of thumb: if the default is a constant or an already available variable, use {{orElse}}; if it must be computed or has side effects, use {{orElseGet}}.

> Senior tip: {{Optional}} is usually useful as a return type expressing a possibly absent result; for collections, return an empty collection rather than wrapping it in {{Optional}}.

### Interview relevance
Interviewers ask: where Optional should and should not be used, orElse vs orElseGet, of vs ofNullable, why get() should be avoided, why Optional makes no sense as a JPA field. The exercise below makes you refactor a chain of nested null checks into Optional without using get().`,
    exercises: [
      {
        title: 'Refactor a null-check chain into Optional',
        prompt: `Given {{Order}} with {{customer}}, {{Customer}} with {{address}}, {{Address}} with {{city}}. Write {{OrderService.cityOf(order)}} returning the city, or the default text required by the tests (a Vietnamese phrase meaning "Unknown") when any link in the chain is null. Write {{cityOfLazy(order, fallback)}} using {{orElseGet}} so the fallback is only computed when it is really missing. You must not use {{get()}}.`,
        hints: [
          'Start with {{Optional.ofNullable(order)}} because order itself can be null ({{Optional.of}} would throw NPE).',
          'The classes here use fields, not getters, so write lambdas: {{.map(o -> o.customer).map(c -> c.address).map(a -> a.city)}}. Whenever one step returns null, the chain automatically becomes empty.',
          'Finish with {{.orElse(...)}} using exactly the literal default from the tests, or with {{.orElseGet(fallback)}}; do not use {{get()}}. {{Optional}} and {{Supplier}} are already imported.',
        ],
        explain: `{{Optional.ofNullable(order)}} is empty if order is null. Each {{map}} only runs its lambda while a value is present, and if the lambda returns null the result becomes empty; from then on the following {{map}} calls are skipped. So one null link anywhere (order, customer, address or city) makes the whole chain empty and the terminal call returns the default. No nested if-null is needed, and since {{get()}} is never used, a NoSuchElementException can never be thrown. {{orElseGet}} only calls the supplier when empty, which suits an expensive fallback.

Common mistakes: calling {{opt.get()}} while convinced a value is present yet it is null at runtime; writing {{isPresent()}} then {{get()}} (a disguised null check); and using {{orElse}} with an expensive default computation that still runs even though a value exists.`,
      },
    ],
    check: [
      {
        q: 'How do {{Optional.of(x)}} and {{Optional.ofNullable(x)}} differ?',
        options: ['They do not differ', 'of throws NPE if x is null; ofNullable allows null → empty', 'ofNullable throws NPE if x is null', 'of only works with primitives'],
        answer: 1,
        explain: '{{Optional.of(x)}} throws NullPointerException immediately if x is null (use it when a value is guaranteed, so the bug surfaces early); {{Optional.ofNullable(x)}} accepts null and returns {{Optional.empty()}}. They really are two different methods, so "no difference" is wrong; ofNullable is precisely the version that does not throw on null; and Optional only holds objects — primitives use OptionalInt/OptionalLong/OptionalDouble.',
      },
      {
        q: 'When should {{orElseGet}} be preferred over {{orElse}}?',
        options: ['Always, because it is faster', 'When the default is expensive and should only be computed when the Optional is empty', 'When the Optional has a value', 'Never'],
        answer: 1,
        explain: 'Java evaluates the argument of {{orElse}} before calling the method, even when the Optional has a value; {{orElseGet}} receives a supplier and only calls it when empty, so use it when the default is expensive (a DB read) or has side effects. "Always" is wrong: for a constant, orElseGet only adds a useless lambda. "When the Optional has a value" is wrong because then both return the inner value. "Never" is wrong because it skips the most important case.',
      },
      {
        q: 'Why should {{opt.get()}} be avoided?',
        options: ['It throws NoSuchElementException when empty', 'It only works with primitives', 'It always returns null', 'The method does not exist'],
        answer: 0,
        explain: '{{get()}} throws {{NoSuchElementException}} when empty, so the caller still has to remember to check, losing exactly the benefit of Optional. Use {{orElse}}/{{orElseGet}} or {{orElseThrow}} with a business-meaningful exception. The other options are wrong: get() works with any object type, never returns null, and the method does exist (it is just not meant to be used bare).',
      },
    ],
  },
  'lesson-modern-003': {
    title: 'Records, sealed interfaces and pattern matching (Java 21)',
    goals: [
      'Explain what a record is, what the compact constructor does, and when it fits a DTO',
      'Explain how a sealed interface restricts its subtypes and what exhaustiveness it gives you',
      'Distinguish instanceof pattern matching (Java 16) from switch pattern matching (Java 21)',
    ],
    body: `**Summary:** a record is a **final** class whose components are declared final, with accessors/equals/hashCode/toString generated for you; the record itself does not guarantee deep immutability if a component points to a mutable object. A sealed interface restricts the set of classes allowed to implement it, modelling an algebraic data type; pattern matching (instanceof in Java 16, switch in Java 21) lets you branch by type, and the compiler checks exhaustiveness in switch expressions when the hierarchy is sealed.

### Record (Java 16+)
~~~java
record Transaction(String id, long amount) {
    Transaction {
        if (amount < 0) throw new IllegalArgumentException("amount < 0");
    }
}
~~~
- Generates {{private final}} fields, accessors {{id()}}/{{amount()}} (not getX), {{equals}}/{{hashCode}}/{{toString}}, and the canonical constructor.
- Cannot extend another class (it is final), but it can implement interfaces.
- No setters; "modifying" one means creating a new record.
- The **compact constructor** (a constructor with no parameter list, as in the example) runs **before** the fields are assigned: the compiler appends {{this.id = id; this.amount = amount;}} at its end. That is why inside a compact constructor you validate or reassign the **parameters** to normalise them, for example {{items = List.copyOf(items);}} (a defensive copy), and not {{this.items}}.
- **Shallow immutability**: the fields are final, but if a component is a mutable {{List}} and you do not copy it, outside code can still change the list contents, and the record's {{hashCode}} changes with it, corrupting the HashSet/HashMap that holds it.
- A great fit for DTOs/value objects. A record is not suitable as a JPA **entity**: an entity needs a non-final class (Hibernate creates a subclass proxy for lazy loading), a no-arg constructor and fields it can reassign when loading/dirty checking. Records still work well as DTO projections in queries, and since Hibernate 6.2 as {{@Embeddable}}.

### Sealed interface (Java 17+)
~~~java
sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}
~~~
- {{permits}} lists the allowed subtypes; any other class/interface implementing {{Payment}} is a compiler error.
- Each subtype must pick one of three modifiers: {{final}} (closed for good), {{sealed}} (keeps restricting) or {{non-sealed}} (reopened so anyone can extend it). A record is implicitly final, so it needs no modifier.
- The subtypes must live in the same module (or the same package when not using modules) as the sealed type. If they are all in the same file you may drop {{permits}}; the compiler infers it.
- The real benefit: the compiler knows **every** subtype, so it can verify that a switch handles all possible cases. This is how Java models "a value is A **or** B **or** C" (a sum type / algebraic data type).

### Pattern matching
- **instanceof pattern** (Java 16): {{if (p instanceof Card c)}} binds an already-cast variable {{c}}, with no manual cast.
- **switch pattern** (Java 21, JEP 441): {{case}} matches by type and may add a {{when}} guard, e.g. {{case Card c when c.amount() > 1_000_000 -> ...}}. A pattern switch is **required to be exhaustive** (cover every possible value). With a sealed hierarchy, listing all subtypes is enough — no {{default}} needed.
- **Record pattern** (Java 21, JEP 440) even destructures the components: {{case Card(String last4, long amount) -> ...}}.
~~~java
// Java 21 switch pattern (illustration in the body only; the exercise uses Java 17)
double fee(Payment p) {
    return switch (p) {
        case Card c -> c.amount() * 0.001;
        case Transfer t -> 3000.0;
        case Wallet w -> 0.0;
    };
}
~~~
- {{null}}: without a {{case null}} branch, the switch throws {{NullPointerException}} when {{p}} is null (Java 21 allows writing {{case null ->}}).
- Adding a new subtype (say {{Crypto}}) to {{permits}} makes every switch over {{Payment}} without a {{default}} a **compile error** until you handle {{Crypto}}. That is exactly the benefit: the compiler points out every place that needs updating. If you add a {{default}} by habit, the benefit disappears, because the default silently swallows the new subtype.
- Compared with an {{instanceof}} if-else chain: the runtime behaviour is the same, but if-else gets no compiler check for completeness.

> Senior tip: use a record for value objects/DTOs and keep JPA entities as regular classes. Sealed + pattern matching makes branching code safe; when you add a subtype, the compiler points out every switch expression that must be updated to stay exhaustive.

### Interview relevance
Interviewers ask: how a record differs from a regular class, what the compact constructor is for, what sealed buys you, what exhaustiveness guarantees, how the instanceof pattern differs from the switch pattern, why a record should not be a JPA entity. The exercise below (compiled on Java 17) makes you model a payment instruction with sealed + record and compute fees with the instanceof pattern.`,
    exercises: [
      {
        title: 'A payment instruction with sealed + record and fee calculation',
        prompt: `Model a payment instruction: {{sealed interface Payment}} with three subtypes {{Card}}, {{Transfer}}, {{Wallet}} (use records, each record has an {{amount}} field in VND). Write {{PaymentFee.fee(Payment)}} to compute the fee:
- Card: 0.1% of the amount, min 1,000 VND, max 50,000 VND.
- Transfer: a fixed 3,000 VND fee.
- Wallet: free (0).
Use the {{instanceof}} pattern (Java 16+); the code must compile on Java 17. Do not use the switch pattern (Java 21).`,
        hints: [
          'Use the {{instanceof}} pattern: {{if (p instanceof Card c)}} already casts and binds the variable {{c}}.',
          'For Card: {{c.amount() * 0.001}} then apply min/max with {{Math.max}} / {{Math.min}}.',
          'Each record is a subtype of {{Payment}}, so the instanceof pattern matches by type.',
        ],
        explain: `The {{instanceof}} pattern (Java 16+) checks the type and binds an already-cast variable in a single statement, with no manual cast. The sealed interface guarantees that Card/Transfer/Wallet are the only subtypes, so the three instanceof branches cover every valid case (adding a default/IllegalArgumentException is just defensive programming). All of these features compile on Java 17; a pattern switch over a switch expression requires Java 21, so it is taught in theory only and the exercise uses instanceof.

Common mistakes: forgetting to handle null / an unknown subtype; using the switch pattern (Java 21) when the code must compile on Java 17; computing the fee with double, which introduces rounding error — real money belongs in BigDecimal.`,
      },
    ],
    check: [
      {
        q: 'What does a sealed interface use {{permits}} for?',
        options: ['Allowing every class to inherit', 'Listing the subtypes allowed to inherit', 'Generating records automatically', 'Replacing a regular interface'],
        answer: 1,
        explain: '{{sealed interface X permits A, B}} only allows A and B to implement X; each subtype must declare final/non-sealed/sealed. The compiler knows the full set of subtypes. "Allowing every class" is the opposite of sealed; sealed does not generate records; and it does not replace a regular interface — it only adds an inheritance restriction to that interface.',
      },
      {
        q: 'What does the instanceof pattern (Java 16) give you over plain instanceof?',
        options: ['It only checks the type', 'It checks the type and binds an already-cast variable, no manual cast needed', 'It only works with records', 'It throws an exception on the wrong type'],
        answer: 1,
        explain: '{{if (p instanceof Card c)}} both checks the type and creates the variable {{c}} of type Card already cast, with no need to write {{(Card) p}}. "Only checks the type" is the old instanceof; the pattern works with any class, not just records; and instanceof (old or new) returns false on a wrong type or a null p, it does not throw.',
      },
      {
        q: 'What does the switch pattern (Java 21) guarantee over a sealed hierarchy?',
        options: ['It runs faster than if-else', 'The compiler checks exhaustiveness (every subtype is covered)', 'New subtypes are added automatically', 'null never needs handling'],
        answer: 1,
        explain: 'When the hierarchy is sealed, the compiler knows all subtypes and reports a compile error if the switch misses a branch (exhaustive). It does not promise to run faster than if-else; it does not add subtypes (on the contrary, adding one breaks old switches at compile time so you fix them); and null still throws NullPointerException unless there is a {{case null}} branch.',
      },
    ],
  },
  'lesson-modern-004': {
    title: 'Lambdas, functional interfaces, method references and composition',
    goals: [
      'Explain what a functional interface is and how a lambda creates an instance of one',
      'Use method references (static, instance, constructor) and composition (andThen/compose, Predicate.and/or)',
      'Write a validation pipeline with Predicate.and/or',
    ],
    body: `**Summary:** A lambda is an anonymous function assigned to a functional interface (exactly one abstract method); a method reference is a shorthand for a lambda; compose chains functions, and Predicate.and/or/negate combine conditions. This is the foundation of Stream and of modern APIs.

### Functional interface
An interface with **exactly one abstract method** (SAM: single abstract method). Default methods, static methods and methods that duplicate public {{Object}} methods (such as {{equals}} in {{Comparator}}) do not count. The {{@FunctionalInterface}} annotation is optional: lambdas work with interfaces that lack it, but with it the compiler reports an error if someone accidentally adds a second abstract method.

A lambda has no type of its own: the compiler looks at the **target type** (the variable or parameter that receives the lambda) to know which interface it implements. At runtime the JVM creates an object implementing that interface through {{invokedynamic}} + {{LambdaMetafactory}}, without generating a separate {{.class}} file like an anonymous class does.

~~~java
@FunctionalInterface
interface Check<T> {
    boolean test(T t);
}
Check<Integer> isEven = n -> n % 2 == 0;   // a lambda
boolean ok = isEven.test(4);               // true
~~~

The JDK already ships these in {{java.util.function}}:

| Interface | Method | Meaning |
|---|---|---|
| {{Predicate<T>}} | {{boolean test(T)}} | tests a condition |
| {{Function<T,R>}} | {{R apply(T)}} | turns T into R |
| {{Consumer<T>}} | {{void accept(T)}} | receives and processes, returns nothing |
| {{Supplier<T>}} | {{T get()}} | takes nothing, returns a value |
| {{BiFunction<T,U,R>}}, {{UnaryOperator<T>}} | ... | two parameters; T into T |

There are also primitive variants such as {{IntPredicate}} and {{ToIntFunction}} to avoid boxing.

### Method references: 4 forms
A method reference is a shorter way to write a lambda that only calls one existing method.

| Form | Example | Equivalent lambda |
|---|---|---|
| {{Class::staticMethod}} | {{Objects::isNull}} | {{x -> Objects.isNull(x)}} |
| {{Class::instanceMethod}} | {{String::isEmpty}} | {{s -> s.isEmpty()}} (the first parameter is the receiver) |
| {{object::instanceMethod}} | {{this::validate}}, {{list::add}} | {{x -> this.validate(x)}} |
| {{Class::new}} | {{ArrayList::new}} | {{() -> new ArrayList<>()}} |

### Composition (chaining functions)
{{Function.andThen}} / {{compose}} chain two functions; {{Predicate.and}}, {{or}}, {{negate}} combine conditions.

~~~java
Function<Integer, Integer> plus1 = n -> n + 1;
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> a = plus1.andThen(times2);  // plus1 first: (n+1)*2, a.apply(3) = 8
Function<Integer, Integer> b = plus1.compose(times2);  // times2 first: n*2+1, b.apply(3) = 7

Predicate<String> notBlank = s -> s != null && !s.isBlank();
Predicate<String> isVip = s -> s.startsWith("VIP");
Predicate<String> isAdmin = s -> s.equals("admin");
Predicate<String> canEnter = notBlank.and(isVip.or(isAdmin));  // not blank AND (VIP OR admin)
Predicate<String> guest = canEnter.negate();
~~~

How to remember: {{f.andThen(g)}} reads "f then g"; {{f.compose(g)}} is like the maths f(g(x)) — g runs first. Predicate {{and}}/{{or}} short-circuit like {{&&}}/{{||}}: if {{notBlank}} is false, {{isVip}} is never called, which is why putting a null check first is safe.

### Pitfalls
- A lambda may only use local variables that are **effectively final** (assigned exactly once, never reassigned). Why: the lambda **copies the value** of the variable when it is created, while the local variable lives on the stack and disappears when the method returns, yet the lambda may run later, on another thread. If reassignment were allowed, the lambda and the method could see two different values, causing confusing bugs. Fields ({{this.count}}) are not restricted, because the lambda keeps a reference to {{this}}.
- {{object::instanceMethod}} evaluates {{object}} **at creation time**: {{obj::foo}} with a null {{obj}} throws NPE on that very line, whereas the lambda {{() -> obj.foo()}} only throws when it is invoked.
- Inside a lambda, {{this}} is the enclosing class instance; inside an anonymous class, {{this}} is the anonymous class itself.
- Side effects inside a lambda (accumulating into a list or an outer variable) are hard to read and wrong when run in parallel; prefer returning results through {{map}}/{{collect}}.

### Comparator: sorting and combining criteria
{{Comparator}} is a functional interface; use {{comparing}} then {{thenComparing}} to sort by several criteria.

~~~java
list.sort(Comparator.comparing(Transaction::month)       // by month first
        .thenComparing(Transaction::customerId)              // same month -> by customer
        .thenComparing(Transaction::amount, Comparator.reverseOrder()));  // then amount descending
~~~
- {{Comparator.naturalOrder()}}/{{reverseOrder()}} are natural/reverse order; {{reversed()}} reverses **the whole comparator** placed before it, so putting it in the wrong position also reverses the earlier criteria.
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} avoid autoboxing.
- {{Comparator.nullsFirst(...)}}/{{nullsLast(...)}} when the key may be null, otherwise the comparison throws NPE.

> Senior tip: prefer a method reference when it is shorter than the lambda; avoid deeply nested lambdas; for complex logic, write a named method and reference it instead.

### Interview relevance
Interviewers ask: what a functional interface is, how a lambda differs from a method reference, how andThen and compose differ, when Predicate.and/or is useful, and why captured locals must be effectively final. The exercise below makes you write a validation pipeline with Predicate.and/or.`,
    exercises: [
      {
        title: 'A validation pipeline with Predicate.and/or',
        prompt: `Given {{User(String name, int age, String email)}}. Write {{UserValidator.userValidator()}} returning a {{Predicate<User>}} that checks: name not blank, age >= 18, email contains the "@" character. Use {{Predicate.and}} (and possibly {{or}}/{{negate}}). Do not write hand-rolled if loops.`,
        hints: [
          'Declare each condition as its own {{Predicate<User>}} variable, then combine them with {{p1.and(p2).and(p3)}}.',
          'The lambda {{u -> u.name() != null && !u.name().isBlank()}} checks the name; {{u -> u.age() >= 18}} checks the age; {{u -> u.email() != null && u.email().contains("@")}} checks the email (do not forget the null check).',
        ],
        explain: `{{Predicate.and}} returns a new predicate that is true only when both sides are true, so the chain {{nameNotBlank.and(adult).and(hasEmail)}} only accepts a user satisfying all three conditions. {{and}} short-circuits: for a user with a null name, the two later predicates are never called. You can add {{or}} (at least one condition) and {{negate}} (negation). {{isBlank()}} arrived in Java 11: an empty string or one made only of whitespace is blank, unlike {{isEmpty()}} which only checks length 0, so the "blank name" test fails if you use isEmpty.

The advantage over one long if block: each rule is a named value, can be tested on its own, and can be reused/recombined for another context (e.g. an admin rule = {{nameNotBlank.and(hasEmail)}}, dropping the age rule).

Common mistakes: forgetting the null check inside each lambda (NPE with a null email); using {{isEmpty}} instead of {{isBlank}}; confusing {{and}} with {{or}}; mixing up the order when using {{andThen}}/{{compose}} of Function.`,
      },
    ],
    check: [
      {
        q: 'What is a functional interface?',
        options: ['An interface with several abstract methods', 'An interface with exactly one abstract method', 'An interface with no methods', 'An abstract class'],
        answer: 1,
        explain: 'A functional interface has exactly one abstract method (default/static methods do not count), so the compiler knows which method the lambda implements. With several abstract methods a lambda could not know which to implement; an interface with no methods leaves nothing to implement; and an abstract class cannot be used with a lambda even if it has a single abstract method. {{@FunctionalInterface}} is optional and lets the compiler verify the rule.',
      },
      {
        q: 'When is {{Predicate.and(other)}} true?',
        options: ['When at least one predicate is true', 'When both predicates are true', 'When the first predicate is true', 'Always true'],
        answer: 1,
        explain: '{{and}} is logical AND (like {{&&}}, with short-circuiting): the result is true only when both are true. "At least one" is {{or}}; "only the first predicate" ignores the second, which is wrong; "always true" is not what and means.',
      },
      {
        q: 'What must a local variable captured by a lambda be?',
        options: ['Reassignable at any time', 'Effectively final (not reassigned after it is assigned)', 'Declared static', 'Declared with the volatile keyword'],
        answer: 1,
        explain: 'A lambda copies the value of the local variable when it is created, and it may run after the method has returned or on another thread. Making it effectively final (you do not need to write final, just never reassign) guarantees that the value the lambda sees matches the method. Reassigning is a compiler error; local variables cannot be static; volatile applies only to fields, not locals.',
      },
    ],
  },
});
