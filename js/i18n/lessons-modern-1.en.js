/*
 * English translation of js/data/lessons-modern.js — task T267. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-001 lesson-modern-002 lesson-modern-003 lesson-modern-004
 */
App.i18n.content({
  'lesson-modern-001': {
    title: 'Streams: lazy evaluation, stateless/stateful and Collectors for grouping by customer and month',
    goals: [
      'Explain how a Stream runs lazily and distinguish intermediate from terminal operations',
      'Use {{Collectors.groupingBy}}, {{toMap}}, {{partitioningBy}} to aggregate data',
      'Know when to use and when to avoid parallel streams, and avoid side effects inside a pipeline',
    ],
    body: `**Summary:** A Stream is a data-processing pipeline made of a source, intermediate operations (lazy, not yet executed) and one terminal operation that actually triggers the work. Telling stateless apart from stateful helps you write streams that are correct and fast; Collectors (groupingBy, toMap, partitioningBy) aggregate and group data by customer and month; parallel streams should only be used when the data is large and the work does not block.

### How lazy execution works: source → intermediate → terminal
A Stream stores no data; it only carries a pipeline of operations. When you call {{filter}} or {{map}}, the Stream merely **registers** the processing step — no element has been traversed yet. Only when a **terminal operation** appears ({{collect}}, {{forEach}}, {{toList}}, {{count}}, {{anyMatch}}…) is data pulled through each step.

~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("loc " + n); return n.length() > 3; })
    .map(String::toUpperCase);   // nothing printed yet
List<String> out = s.toList();   // terminal -> only now it runs, printing "loc ..."
~~~

- With stateless operations, each element usually flows through the downstream steps before the next element is processed; a stateful operation such as {{sorted}} may need to buffer or process more data. This mechanism is what lets short-circuiting terminal operations stop early.
- {{findFirst}}, {{anyMatch}}, {{limit}} can stop early; {{forEach}} always consumes everything.
- A Stream is **single-use**: calling a terminal operation a second time throws {{IllegalStateException}}.
- Without a terminal op nothing runs at all; forgetting {{collect}} is a mistake you will run into often.

### Stateless vs stateful
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}} process each element independently, with no need to remember other elements. Efficient and easy to parallelize.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} must buffer data or see the whole stream. {{sorted}} on an infinite stream never terminates; {{distinct}} must remember every value it has seen.
- Stateful operations parallelize poorly because they must synchronize/merge; {{limit}} in parallel is especially costly.

### Collectors: grouping and aggregating
| Collector | When to use | Result |
|---|---|---|
| {{groupingBy(f)}} | group elements by key | Map<K, List<T>> |
| {{groupingBy(f, groupingBy(g))}} | group two levels deep (customer, then month) | Map<K, Map<K2, List<T>>> |
| {{groupingBy(f, summingDouble(m))}} | group then sum | Map<K, Double> |
| {{toMap(k, v)}} | turn a stream into a map | Map<K, V> |
| {{partitioningBy(pred)}} | split into true/false | Map<Boolean, List<T>> |

{{toMap}} throws {{IllegalStateException}} on duplicate keys; use {{toMap(k, v, (old, newV) -> newV)}} to decide that the later value wins.

Example grouping transactions by customer and month:
~~~java
Map<String, Map<String, Double>> theoKhachHang = txns.stream()
    .collect(Collectors.groupingBy(
        Transaction::customerId,
        Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount))
    ));
// theoKhachHang.get("KH001").get("2024-03") = customer KH001's total for March
~~~

### Parallel streams: only when the data is big enough
By default a parallel stream uses {{ForkJoinPool.commonPool()}}, a pool shared across the whole JVM. Default parallelism is usually derived from the number of available processors minus one, but it can be configured; do not treat it as a fixed thread count in every environment. It is harmful when the work blocks (DB, HTTP, files), the data is small, the source splits poorly (LinkedList), or there are non-thread-safe side effects. There is no universal size threshold for deciding to go parallel: benchmark the real workload and check how contended the pool is. In web services, avoid {{parallelStream}} for I/O.

> Senior tip: write sequential streams by default for clarity; only enable parallel when a benchmark proves it and the data is large enough. Use {{BigDecimal}} for money, never double in production.

### Interview relevance
Interviewers like to ask: how intermediate and terminal differ, whether a Stream stores data, why sorting an infinite stream never finishes, how a two-level groupingBy is written, which pool parallel streams share and when to avoid them. The exercise below makes you write Collectors that group transactions by customer and month.`,
    exercises: [
      {
        title: 'Aggregate transactions by customer and month',
        prompt: `Given {{List<Transaction>}} (Transaction has {{customerId}}, {{month}} in "YYYY-MM" format, {{amount}}). Write {{TransactionStats.byCustomerAndMonth(txns)}} returning {{Map<String, Map<String, Double>>>}}: customer → (month → total amount). Use Stream + Collectors, no hand-written for loops.`,
        hints: [
          'Use {{Collectors.groupingBy(Transaction::customerId, Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount)))}}.',
          'Import {{java.util.stream.*}} (already available) to use {{Collectors}}.',
        ],
        explain: `{{groupingBy}} accepts a downstream collector besides the key, so nesting groupingBy twice builds the structure customer → month → total. {{summingDouble}} extracts the {{amount}} field and accumulates it. The result is a Map of customer × month; any combination that never appears simply has no key (no empty entry is created for you). Swap double for {{BigDecimal}} when handling real money.

Common mistakes: forgetting the terminal op (the result is empty), using {{toMap}} with duplicate keys without a merge function (it throws), and converting the stream to a list then using a for loop (throwing away the point of Stream).`,
      },
    ],
    check: [
      {
        q: 'What does a Stream intermediate operation (e.g. {{filter}}, {{map}}) do when called?',
        options: ['Traverses all data immediately', 'Only builds the pipeline, no element has been processed', 'Implicitly calls a terminal operation', 'Throws an exception if there is no terminal op'],
        answer: 1,
        explain: 'An intermediate op is lazy: it only registers a processing step into the pipeline; no data has been traversed. Only a terminal op pulls data through the pipeline.',
      },
      {
        q: 'What is Collectors.groupingBy(f, summingDouble(m)) for?',
        options: ['Filtering elements by f', 'Grouping by f then summing m per group', 'Splitting the stream into two true/false parts', 'Sorting by m'],
        answer: 1,
        explain: 'groupingBy splits by the key f; summingDouble(m) extracts the field m and accumulates it per group. The other options are different Collectors operations.',
      },
      {
        q: 'When should you NOT use a parallel stream?',
        options: ['Large data, CPU-bound', 'Blocking work such as DB/HTTP calls', 'The source is an ArrayList', 'Stateless operators'],
        answer: 1,
        explain: 'Blocking tasks starve the shared ForkJoinPool.commonPool, leaving other streams hungry. Large data, CPU-bound work, a well-splittable source and stateless operators are what suit parallel streams.',
      },
    ],
  },
  'lesson-modern-002': {
    title: 'Optional in APIs: orElse/orElseGet, avoiding get()',
    goals: [
      'Explain how Optional expresses a possibly absent result instead of returning null',
      'Distinguish {{orElse}} from {{orElseGet}}, and {{of}} from {{ofNullable}}',
      'Write handling chains with Optional without using {{get()}}',
    ],
    body: `**Summary:** Optional is usually used as a return type to express the "no result" case instead of returning null; use {{orElse}}/{{orElseGet}}, avoid bare {{get()}}, and think twice before using it as a field, a parameter or a collection element.

### Why Optional exists
Returning null makes callers forget to check ⇒ NullPointerException. Optional makes the possibility of absence visible in the return type so the caller can decide how to handle it. It is a **signal at the API boundary**, not a replacement for every null inside your code.

### How to create one
- {{Optional.of(x)}}: x must not be null, otherwise it throws NPE.
- {{Optional.ofNullable(x)}}: allows null → {{Optional.empty()}}.
- {{Optional.empty()}}: represents the absence of a value; use it when you know there is none.

### Chaining without get()
~~~java
Optional<User> opt = findById(id);
String email = opt.map(User::email)
                  .filter(e -> !e.isBlank())
                  .orElse("no email yet");
~~~
- {{map}} transforms the value if present, stays empty if empty.
- {{filter}} keeps the value if it matches the condition, becomes empty otherwise.
- {{orElse(default)}} returns the default (computed eagerly).
- {{orElseGet(supplier)}} only computes the default when empty → use it when the default is expensive (a DB read).
- {{orElseThrow(() -> new NotFoundException())}} turns absence into an explicit error.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9).

### flatMap: nested Optionals
If a method returns {{Optional}} and you want to keep chaining, use {{flatMap}} instead of {{map}} (map would produce {{Optional<Optional<T>>}}).

~~~java
Optional<Optional<Address>> addr = opt.map(User::address);   // Optional<Optional<Address>>
Optional<Address> addr2 = opt.flatMap(User::address);         // a flat Optional<Address>
~~~

### Where it should not go
- **Field** of an entity/DTO: {{Optional}} does not implement {{Serializable}}; such a field also tends to make mapping/payloads more complicated. With Jackson, support depends on the module/configuration, and a JPA entity should use a plain value field.
- **Method parameter**: usually accept a possibly-null value or provide overloads instead of forcing the caller to wrap one value in an Optional; choose based on the contract and how the API is used.
- **Collection**: return an empty list instead of an empty Optional.
- **{{opt.get()}}**: throws NoSuchElementException and is hard to debug. Use {{orElseThrow}} with a message.
- {{opt.isPresent()}} followed by {{get()}} is a disguised null check.

### orElse vs orElseGet
~~~java
User u1 = opt.orElse(loadFromDb());      // always hits the DB
User u2 = opt.orElseGet(() -> loadFromDb());  // only calls it when empty
~~~

> Senior tip: {{Optional}} is usually useful as a return type expressing a possibly absent result; for collections, return an empty collection rather than wrapping it in {{Optional}}.

### Interview relevance
Interviewers ask: where Optional should and should not be used, orElse vs orElseGet, of vs ofNullable, why get() should be avoided, why Optional makes no sense as a JPA field. The exercise below makes you refactor a chain of nested null checks into Optional without using get().`,
    exercises: [
      {
        title: 'Refactor a null-check chain into Optional',
        prompt: `Given {{Order}} with {{customer}}, {{Customer}} with {{address}}, {{Address}} with {{city}}. Write {{OrderService.cityOf(order)}} returning the city or "Unknown" if anything along the chain is null. Write {{cityOfLazy(order, fallback)}} using {{orElseGet}} so the fallback is only computed when actually missing. You must not use {{get()}}.`,
        hints: [
          'Use {{Optional.ofNullable(order)}} then {{.map(Order::customer).map(Customer::address).map(Address::city)}}.',
          'Finish with {{.orElse("Unknown")}} or {{.orElseGet(fallback)}}; do not use {{get()}}.',
          'Import {{java.util.Optional}} and {{java.util.function.Supplier}}.',
        ],
        explain: `{{Optional.ofNullable(order)}} is empty if order is null; then {{map}} short-circuits: one null link in the chain makes the whole thing empty and {{orElse}} returns the default. No nested if-null needed, and since {{get()}} is never used a NoSuchElementException can never be thrown. {{orElseGet}} only calls the supplier when empty, which suits an expensive fallback.

Common mistakes: calling {{opt.get()}} while convinced a value is present yet it is null at runtime; writing {{isPresent()}} then {{get()}} (a disguised null check); and using {{orElse}} with an expensive default computation that still runs even though a value exists.`,
      },
    ],
    check: [
      {
        q: 'How do {{Optional.of(x)}} and {{Optional.ofNullable(x)}} differ?',
        options: ['They do not differ', 'of throws NPE if x is null; ofNullable allows null → empty', 'ofNullable throws NPE if x is null', 'of only works with primitives'],
        answer: 1,
        explain: '{{Optional.of(x)}} throws NullPointerException if x is null; {{Optional.ofNullable(x)}} accepts null and returns {{Optional.empty()}}.',
      },
      {
        q: 'When should {{orElseGet}} be preferred over {{orElse}}?',
        options: ['Always, because it is faster', 'When the default is expensive and should only be computed when the Optional is empty', 'When the Optional has a value', 'Never'],
        answer: 1,
        explain: '{{orElse}} evaluates its argument immediately even when the Optional has a value; {{orElseGet}} only calls the supplier when empty, so use it when the default is expensive (e.g. a DB read).',
      },
      {
        q: 'Why should {{opt.get()}} be avoided?',
        options: ['It throws NoSuchElementException when empty', 'It only works with primitives', 'It always returns null', 'The method does not exist'],
        answer: 0,
        explain: '{{get()}} does no check and throws {{NoSuchElementException}} when empty. {{orElseThrow}} with a clear message is better.',
      },
    ],
  },
  'lesson-modern-003': {
    title: 'Records, sealed interfaces and pattern matching (Java 21)',
    goals: [
      'Explain what a record is, what a compact constructor is for, and when it fits a DTO',
      'Explain how a sealed interface restricts the set of subtypes and what exhaustiveness follows from it',
      'Distinguish instanceof pattern matching (Java 16) from switch pattern matching (Java 21)',
    ],
    body: `**Summary:** a record is a **final** class whose components are declared final, with accessors/equals/hashCode/toString generated automatically; a record itself does not guarantee deep immutability if a component points to a mutable object. A sealed interface restricts the set of classes allowed to implement it, modelling an algebraic data type; pattern matching (instanceof in Java 16, switch in Java 21) lets you branch by type, and the compiler checks exhaustiveness in switch expressions when the hierarchy is sealed.

### Record (Java 16+)
~~~java
record Transaction(String id, long amount) {
    Transaction {
        if (amount < 0) throw new IllegalArgumentException("amount < 0");
    }
}
~~~
- Generates {{private final}} fields, accessors {{id()}}/{{amount()}} (not getX), {{equals}}/{{hashCode}}/{{toString}}, and the canonical constructor.
- Cannot extend another class (it is final), but may implement interfaces.
- No setters; "changing" one means creating a new record.
- The compact constructor runs before fields are assigned and is used to validate/normalize (e.g. defensively copying a collection with {{List.copyOf}}).
- A great fit for DTOs/value objects. A record is not suitable as a standard JPA entity: an entity must satisfy the JPA requirements of a non-final class, a no-arg constructor and persistent state; Hibernate also usually needs a subclass proxy for lazy loading.

### Sealed interface (Java 17+)
~~~java
sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}
~~~
- {{permits}} lists the allowed subtypes; each subtype must extend/implement the sealed type and declare a modifier ({{final}}, {{non-sealed}}, or {{sealed}}).
- More concise than controlling inheritance with a private constructor, and the compiler knows the full set of subtypes.

### Pattern matching
- **instanceof pattern** (Java 16): {{if (p instanceof Card c)}} binds an already-cast variable {{c}}, no manual cast needed.
- **switch pattern** (Java 21): match by type plus guard; with a switch expression over a sealed hierarchy, the compiler can check **exhaustiveness** (no default needed in some cases).
~~~java
// Java 21 switch pattern (illustration only; the exercise uses Java 17)
double fee(Payment p) {
    return switch (p) {
        case Card c -> c.amount() * 0.001;
        case Transfer t -> 3000.0;
        case Wallet w -> 0.0;
    };
}
~~~
- You must handle {{null}} (a switch pattern throws NullPointerException unless there is a null case).
- Adding a new subtype can make a switch non-exhaustive ⇒ every switch must be updated.

> Senior tip: use a record for value objects/DTOs and keep JPA entities as regular classes. Sealed + pattern matching makes branching code safe; when you add a subtype, the compiler points out every switch expression that needs updating to stay exhaustive.

### Interview relevance
Interviewers ask: how a record differs from a regular class, what the compact constructor is for, what sealed buys you, what exhaustiveness guarantees, how the instanceof pattern differs from the switch pattern, why a record should not be a JPA entity. The exercise below (compiled on Java 17) makes you model a payment instruction with sealed + record and compute fees with the instanceof pattern.`,
    exercises: [
      {
        title: 'A payment instruction with sealed + record and fee calculation',
        prompt: `Model a payment instruction: {{sealed interface Payment}} with components {{Card}}, {{Transfer}}, {{Wallet}} (use records, each record has an {{amount}} field in VND). Write {{PaymentFee.fee(Payment)}} to compute the fee:
- Card: 0.1% of the amount, min 1,000 VND, max 50,000 VND.
- Transfer: a fixed 3,000 VND fee.
- Wallet: free (0).
Use the {{instanceof}} pattern (Java 16+); the code must compile on Java 17. Do not use the switch pattern (Java 21).`,
        hints: [
          'Use the {{instanceof}} pattern: {{if (p instanceof Card c)}} already casts and binds the variable {{c}}.',
          'For Card: {{c.amount() * 0.001}} then apply min/max with {{Math.max}} / {{Math.min}}.',
          'Each record is a subtype of {{Payment}}, so the instanceof pattern matches by type.',
        ],
        explain: `The {{instanceof}} pattern (Java 16+) checks the type and binds an already-cast variable in one statement, with no manual cast. The sealed interface guarantees that Card/Transfer/Wallet are the only subtypes, so the three instanceof branches cover every valid case (adding a default/IllegalArgumentException is just defensive). All of these features compile on Java 17; the switch pattern on a switch expression requires Java 21, so it is taught in theory only while the exercise uses instanceof.

Common mistakes: forgetting to handle null / an unknown subtype; using the switch pattern (Java 21) when the code must compile on Java 17; computing the fee with double, which introduces rounding error — real money belongs in BigDecimal.`,
      },
    ],
    check: [
      {
        q: 'What does a sealed interface use {{permits}} for?',
        options: ['Allowing every class to inherit', 'Listing the subtypes allowed to inherit', 'Generating records automatically', 'Replacing a regular interface'],
        answer: 1,
        explain: '{{sealed interface X permits A, B}} only allows A and B to implement X; each subtype must declare final/non-sealed/sealed. The compiler knows the full set of subtypes.',
      },
      {
        q: 'What does the instanceof pattern (Java 16) give you over plain instanceof?',
        options: ['It only checks the type', 'It checks the type and binds an already-cast variable, no manual cast needed', 'It only works with records', 'It throws an exception on the wrong type'],
        answer: 1,
        explain: '{{if (p instanceof Card c)}} both checks the type and creates the variable {{c}} of the cast type Card, with no manual cast.',
      },
      {
        q: 'What does the switch pattern (Java 21) guarantee over a sealed hierarchy?',
        options: ['It runs faster than if-else', 'The compiler checks exhaustiveness (covering every subtype)', 'New subtypes are generated automatically', 'null never needs handling'],
        answer: 1,
        explain: 'When the hierarchy is sealed, the compiler knows all the subtypes and verifies that the switch handles them all (exhaustive). null still needs separate handling.',
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
An interface with exactly one abstract method, annotated with {{@FunctionalInterface}}. The lambda creates an instance of it.

~~~java
@FunctionalInterface
interface Check<T> {
    boolean test(T t);
}
Check<Integer> isEven = n -> n % 2 == 0;   // a lambda
boolean ok = isEven.test(4);               // true
~~~

The JDK already ships {{Predicate<T>}}, {{Function<T,R>}}, {{Consumer<T>}}, {{Supplier<T>}} in {{java.util.function}}.

### Lambdas and method references
- {{Class::instanceMethod}} (e.g. {{String::isEmpty}})
- {{Class::staticMethod}} (e.g. {{Objects::isNull}})
- {{object::instanceMethod}} (e.g. {{this::validate}})
- {{Class::new}} (constructor reference)

### Composition (chaining functions)
{{Function.andThen}} / {{compose}} chain two functions; {{Predicate.and}}, {{or}}, {{negate}} combine conditions.

~~~java
Function<Integer, Integer> plus1 = n -> n + 1;
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> thenTimes2 = plus1.andThen(times2);  // (n+1)*2
Predicate<Integer> adult = n -> n >= 18;
Predicate<Integer> hasId = n -> n > 0;
Predicate<Integer> valid = adult.and(hasId).or(n -> n == 0);
~~~

### Pitfalls
- A lambda can only capture local variables that are **effectively final** (never reassigned).
- A method reference of the form {{object::instanceMethod}} captures the receiver {{object}}; the form {{Class::instanceMethod}} receives the receiver as its first argument. Inside a lambda, {{this}} still refers to the lexical scope.
- Side effects inside a lambda (mutating variables outside it) are unclear and not safe in parallel.

### Comparator: sorting and combining criteria
{{Comparator}} is a functional interface; use {{comparing}} then {{thenComparing}} to sort by multiple criteria.

~~~java
list.sort(Comparator.comparing(Transaction::month)
        .thenComparing(Comparator.comparing(Transaction::customerId)));
~~~
- {{Comparator.naturalOrder()}} and {{reversed()}} sort naturally/in reverse; {{comparingInt}} avoids autoboxing for int.

> Senior tip: prefer a method reference when it is shorter than the lambda; avoid deeply nested lambdas; for complex logic, write a named method and reference it instead.

### Interview relevance
Interviewers ask: what a functional interface is, how a lambda differs from a method reference, how andThen and compose differ, when Predicate.and/or is useful, and why captured locals must be effectively final. The exercise below makes you write a validation pipeline with Predicate.and/or.`,
    exercises: [
      {
        title: 'A validation pipeline with Predicate.and/or',
        prompt: `Given {{User(String name, int age, String email)}}. Write {{UserValidator.userValidator()}} returning a {{Predicate<User>}} that checks: name not blank, age >= 18, email contains "@". Use {{Predicate.and}} (and possibly {{or}}/{{negate}}). Do not use hand-written if loops.`,
        hints: [
          'Use {{Predicate<User>.and(...)}} to combine several conditions.',
          'The lambda {{u -> u.name() != null && !u.name().isBlank()}} checks the name; {{u -> u.age() >= 18}} checks the age; {{u -> u.email().contains("@")}} checks the email.',
        ],
        explain: `{{Predicate.and}} returns a new predicate that is true only when both sides are true, so the chain {{nameNotBlank.and(adult).and(hasEmail)}} only accepts a user satisfying all three conditions. You can add {{or}} (at least one condition) and {{negate}} (negation). isBlank is Java 11, already available on Java 17.

Common mistakes: mixing up the order of functions in {{andThen}}/{{compose}}; forgetting a null check before calling a method (NPE); confusing {{and}} with {{or}} (and requires both, or requires at least one).`,
      },
    ],
    check: [
      {
        q: 'What is a functional interface?',
        options: ['An interface with several abstract methods', 'An interface with exactly one abstract method', 'An interface with no methods', 'An abstract class'],
        answer: 1,
        explain: 'A functional interface has exactly one abstract method, which allows a lambda to create an instance. Marking it {{@FunctionalInterface}} lets the compiler check that.',
      },
      {
        q: 'When is {{Predicate.and(other)}} true?',
        options: ['When at least one predicate is true', 'When both predicates are true', 'When the first predicate is true', 'Always true'],
        answer: 1,
        explain: '{{and}} is logical AND: true only when both are true. {{or}} means at least one, {{negate}} negates.',
      },
      {
        q: 'What must a local variable captured by a lambda be?',
        options: ['Reassignable at any time', 'Effectively final (not reassigned after initialization)', 'static', 'A final tuple'],
        answer: 1,
        explain: 'A lambda can only capture a local variable that is effectively final (assigned once), which keeps behavior consistent when the lambda runs later.',
      },
    ],
  },
});
