/*
 * English translation of js/data/lessons-core.js — task T752/T1100. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-008
 */
App.i18n.content({
  'lesson-core-008': {
    title: `Record, sealed interface, and pattern matching: modeling business outcomes`,
    goals: [
      'Write a record with a compact constructor to reject invalid data at creation time',
      'Model outcomes with a sealed interface so that invalid states are no longer representable',
      'Use instanceof pattern to branch by type without manual casting',
      'Explain what Java 21 switch pattern adds in exhaustiveness and why the exercise uses only Java 17 features'
    ],
    body: `**Summary:** A **record** is a read-only data class the compiler writes for you: you declare the list of components (called **components**), and Java auto-generates final fields, a constructor, accessors, {{equals}}, {{hashCode}}, and {{toString}}. A **sealed interface** with {{permits}} restricts the set of allowed subtypes, so a payment result can only be Success, Declined, or Failed — no fourth state, no need to return {{null}}, and no need for a {{boolean}} flag. The **instanceof pattern** ({{r instanceof Success s}}) both checks the type and creates the already-cast binding variable {{s}}; **switch pattern** is a Java 21 feature, used here only for reading because the exercise compiles with Java 17.

### From a data-carrying class to a record
What is a "data-carrying class"? It is a class whose main job is to hold values (amount, currency, code) rather than perform complex behavior. Before records, writing such a class meant: declare final fields, write a constructor that assigns each field, write an accessor for each field, then write {{equals}}, {{hashCode}}, and {{toString}} — about thirty lines. The last three are where mistakes most often happen: forgetting a field in {{equals}} makes two different objects be considered equal; forgetting one in {{hashCode}} makes a HashMap lookup return an unpredictable result (the entry "disappears" because the map searches the wrong bucket).

~~~java
record Money(long amount, String currency) { }
~~~

One line replaces the whole block. The table below lists exactly what the compiler writes for you:

| You only declare | Compiler auto-generates |
|---|---|
| {{record Money(long amount, String currency)}} | each component as a private final field |
| | canonical constructor {{Money(long, String)}} in component order |
| | accessors {{amount()}} and {{currency()}} — no get prefix |
| | {{equals}} and {{hashCode}} computed over all components, impossible to forget a field |
| | {{toString}} in the form {{Money[amount=1000, currency=VND]}} |

Two points that are often asked in interviews. First, the accessor is {{amount()}} not {{getAmount()}}, because a record does not follow the JavaBeans convention (a getter naming style like {{getAmount}}). Jackson (a popular JSON library) has read records via the constructor and components since 2.12, so no getter is needed. Second, a record is implicitly **final** and already extends {{java.lang.Record}} — so it cannot extend another class, implementing interfaces is fine, and you cannot declare instance fields beyond the components (static fields are allowed).

### Compact constructor: closing the door at the entrance
What is a **constructor**? It is the special method that runs when you create an object with {{new}}, responsible for setting up its state. A **compact constructor** is a short body block written with the record name and no parameter list. It runs **before** the fields are assigned; at the end of the body, the compiler inserts field assignments from the parameters themselves.

~~~java
record Money(long amount, String currency) {
    Money {                                                      // compact: do not write (long amount, ...)
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        currency = currency.toUpperCase(java.util.Locale.ROOT);   // normalize the PARAMETER, do not write this
    }
}
~~~

Why must it run before assignment? Because the field is final (assigned only once), and that single assignment is the part the compiler adds at the end. If you write {{this.currency = ...}} inside the compact constructor, the compiler errors with "cannot assign a value to final variable currency" — Java's way of reminding you: to transform the value, override the parameter (change the parameter variable), and the compiler will assign the transformed parameter to the field.

> Design note (what is an **invariant**?): an invariant is a condition that is always true throughout an object's lifetime. When validation lives in the constructor, every Money object in the system is already valid. Functions that run later do not need to repeat the {{amount < 0}} check. The only place to enforce the invariant is at creation time.

| You want to | Use |
|---|---|
| Reject or normalize input data | compact constructor |
| Add a convenient creation method, e.g. infer currency automatically | an overload that calls {{this(amount, "VND")}} |
| Cut the link with the caller's list/array | {{List.copyOf}} in the compact constructor |
| Change the public signature | a hand-written canonical constructor, keeping correct types and component order |

### Shallow immutability: a record does not protect inner content automatically
What does **immutable** mean? An object is immutable if its observable state cannot change after creation. A record's final field only guarantees that **the reference** does not change (the field keeps pointing to the same object). If the component is a {{List}} or array and the caller still keeps the original reference, they can mutate the inner content; and since the record's {{hashCode}} is computed over that content, an object sitting in a HashMap/HashSet will "disappear" on lookup (its hash changes, so the map looks in the wrong bucket).

~~~java
record Basket(String id, List<String> items) {
    Basket { items = List.copyOf(items); }        // immutable snapshot: the caller has no path left to modify
}
~~~

{{List.copyOf}} copies and returns an unmodifiable list — that is **defensive copying** at the entrance (copying input so outside code cannot affect your state), the same principle as the "Immutable object and defensive copy" lesson in this track.

### Sealed interface: sealing the list of subtypes
Modeling goal (in plain words): "a payment command has exactly three possible outcomes".

~~~java
sealed interface PaymentResult permits Success, Declined, Failed {
    long amount();                                   // all three subtypes must have an amount
}
record Success(long amount, String reference, long fee) implements PaymentResult { }
record Declined(long amount, String code, String message, boolean retryable) implements PaymentResult { }
record Failed(long amount, String message, Throwable cause) implements PaymentResult { }
~~~

{{permits}} lists exactly the types allowed to implement the interface; any other class trying to implement {{PaymentResult}} is rejected by the compiler. Each subtype must choose one of three stances: final (no further extension), sealed (continues sealing), or non-sealed (opens to the world); records are implicitly final so nothing needs to be written. Subtypes must be in the **same package** as the sealed type (if the project uses modules, the same module). Placing them in one file is the tidiest way; in that case {{permits}} can be omitted because the compiler infers it.

Why not an enum (a fixed list of named constants)? Because each branch carries different data: Declined needs {{code}} and {{retryable}}, Success needs {{reference}} and {{fee}}. An enum constant is a single constant; to attach different data per occurrence you would stuff fields into the enum, and then every constant carries every field. Why not a {{boolean ok}} plus a bunch of separate fields? Because that allows expressing meaningless states.

| Modeling approach | Can a meaningless state be created? | Who catches it |
|---|---|---|
| boolean flag plus separate fields, allowing null | Yes: ok is true but reference is null | the user, after the error has already occurred |
| open superclass plus subclasses | Yes: add a new subtype with nowhere to handle it | code review, or a bug in production |
| sealed interface plus records | No: each branch carries exactly its own data | the compiler |

This is another way of stating the principle "make illegal states unrepresentable": design types so that invalid situations cannot be written in code. The real flow of a payment command through three systems, where {{PaymentResult}} is produced:

~~~seq
title: A payment command through three systems
actors: Service | Bank Gateway | Bank
Service -> Bank Gateway: POST /pay (amount, order code)
Bank Gateway -> Bank: card authorization
Bank --> Bank Gateway: error code 51 (expired card)
Bank Gateway --> Service: 200 + DECLINED result
Service -> Service: convert result to Success or Declined
note Service..Bank: Service only receives PaymentResult, never receives null
~~~

Step by step: the Service asks the Bank Gateway to pay; the Gateway asks the Bank to authorize the card; the Bank returns an error (e.g. code 51, expired card); the Gateway forwards a DECLINED result; the Service converts it into a typed {{PaymentResult}}. The important point is the last note: callers receive a concrete, typed result, not {{null}}.

### instanceof pattern (Java 16/17) and switch pattern (Java 21)
~~~java
static long charged(PaymentResult r) {
    if (r instanceof Success s) return s.amount();   // s is already Success, no manual cast needed
    if (r instanceof Declined d) return 0L;
    if (r instanceof Failed f) return 0L;
    return 0L;                                       // Java 17 does NOT know the three branches cover everything
}
~~~

The variable {{s}} in the pattern {{r instanceof Success s}} is called a **binding variable**: it lives only at points where the compiler has proven the condition is true — a rule called **flow scoping**. Because if the condition is false there is no object to cast, {{s}} cannot be used in the {{else}} block. The safest approach: return the result inside the branch; do not save the variable for later. A second limitation: a combined pattern like {{if (r instanceof Declined || r instanceof Failed)}} cannot bind a variable, because the compiler does not know which branch is true.

The final {{return 0L}} line is a classic annoyance: sealed tells us there are exactly three types, but the if-chain is not checked for exhaustiveness in Java 17. Java 21 (JEP 441) fixes this with switch pattern:

~~~java
static long charged21(PaymentResult r) {
    return switch (r) {                              // Java 21 — NOT used in the exercise below
        case Success s -> s.amount();
        case Declined d -> 0L;
        case Failed f -> 0L;                         // no default needed: sealed has listed everything
    };
}
~~~

In this form the compiler **forces** you to cover every subtype, and a record pattern can also destructure components: {{case Success(amt, ref, fee) -> ...}}, with a guard condition: {{case Declined d when d.retryable() -> ...}}. The practical consequence is very valuable: adding {{Crypto}} to {{permits}} makes every switch without default a **compile error** and lists exactly the places to fix. If you habitually write {{default}}, that benefit disappears, because {{default}} swallows new subtypes silently.

A detail about null: {{switch}} on a null value throws {{NullPointerException}} if there is no {{case null}} (Java 21 allows writing {{case null}}), while an if/else instanceof chain silently lets null fall through to the final line. If null is not valid input, start the function with {{Objects.requireNonNull(r, "result")}}.

> Senior tip: what kills you in production is not syntax but **missing branch handling**. A Java 17 codebase uses if/else instanceof chains: adding a new subtype silently falls into the last branch, for example returning zero instead of reporting an error. Three defenses: consolidate every "translation" of {{PaymentResult}} into behavior into **one** function; write a unit test per subtype; when moving to Java 21, switch to switch pattern and remove {{default}}.

### Production pitfalls (common real-world mistakes)
- Using a record as a JPA **entity** (a database-mapped object managed by Hibernate, an ORM). Hibernate needs a non-final class to create lazy-loading proxies (wrapper objects that load data on demand), needs a no-arg constructor, and needs fields that can be reassigned when loading. Records fit DTOs/projections (data transfer objects, just carrying data) very well; since Hibernate 6.2 records can also be used as {{@Embeddable}}.
- A component is a {{List}} or array with no copy: content gets modified from outside, {{equals}}/{{hashCode}} change, and the object is lost in a HashMap/HashSet.
- Writing {{this.x = ...}} inside a compact constructor: compile error; to normalize, override the parameter instead.
- A record's {{toString}} prints **all** components: if the record contains a PAN (card number), token, or password, logs will leak it. Overriding {{toString}} to mask sensitive parts is valid and should be done.
- {{equals}} compares by component, so two records of different types with the same values are still not equal; when you need to compare by business meaning, compare via the common interface accessor ({{amount()}}) instead of {{equals}}.
- A sealed subtype placed in another package: a confusing "illegal inheritance" error — remember the same package/module rule.
- Not checking parameters at the entry point, letting a NullPointerException (NPE) explode at a mapper layer far from where bad data was received; the investigator loses half a day finding a single {{null}} line.
- Thinking "a record is immutable so I can create as many as I want": each "edit" is a new object. A loop reading two million rows will show allocation pressure — but that is something to measure before optimizing, not a reason to drop records.

### Interview notes
Questions usually go in order: how a record differs from a regular class; when the compact constructor runs and whether {{this.x}} can be assigned; what sealed gives you that a regular interface does not; how exhaustiveness behaves when you add a subtype; why not to use a record as an entity; and how instanceof pattern differs from switch pattern and in which version. A high-scoring answer follows this structure: **mechanism → type-safety benefit → practical limits (mutable components, JPA, toString)**, then closes with an experience, for example "we consolidated result conversion into one function and switched to switch pattern on Java 21, so every unhandled case surfaced at compile time".`,
    exercises: [{
      title: `PaymentResult sealed, instanceof pattern, and compact constructor`,
      prompt: `Model the result of a payment command using a sealed interface with three records, then handle it with instanceof pattern. **Only use features available in Java 17**: no switch pattern, no record pattern deconstruction.

- {{sealed interface PaymentResult}} permits exactly three types: {{Success}}, {{Declined}}, {{Failed}}. Each type is a record and all have a component {{amount}} of type {{long}} (VND). The interface declares {{long amount();}}.
- {{Success}} additionally has {{reference}} (transaction code) and {{fee}} (fee, {{long}}). {{Declined}} additionally has {{code}}, {{message}}, and {{retryable}} ({{boolean}}). {{Failed}} additionally has {{message}} and {{cause}} ({{Throwable}}, a Java error/exception object you can keep for investigation).
- The compact constructor **rejects invalid data at creation time**: {{amount < 0}} → {{IllegalArgumentException}} whose message contains the word {{amount}}, applied to all three records; {{reference}} null or blank-only (a string containing only whitespace) → {{IllegalArgumentException}} whose message contains {{reference}}; {{code}} null or blank → {{IllegalArgumentException}} whose message contains {{code}}; in {{Failed}}, {{cause}} null → {{NullPointerException}} whose message is exactly the string {{cause}}.
- {{Checkout.charged(r)}}: Success returns {{amount}}, Declined returns 0, Failed returns 0.
- {{Checkout.receipt(r)}}: Success → {{OK }} + reference + {{ }} + (amount - fee); Declined → {{NO }} + code + {{ REUSE}} if retryable, otherwise {{NO }} + code + {{ STOP}}; Failed → {{ERR }} + message.
- {{Checkout.retryLater(r)}}: true only when Declined and retryable, or when Failed; Success → false.

Write branches using the pattern {{if (r instanceof Success s)}}, no manual casting. Do not read date/time, do not use random, do not sleep: running twice must give the same result.`,
      hints: [
        'A compact constructor only writes the record name followed by the body, with no parameter list. To normalize, override the parameter; do not assign to this.',
        'To check for an empty string, write {{reference == null || reference.isBlank()}}: {{isBlank}} treats a string containing only whitespace as empty (available since Java 11).',
        'The instanceof pattern is written {{if (r instanceof Success s)}} — one pair of parentheses wraps the condition; the variable {{s}} is only usable inside that branch.',
        'The function still needs a final return line because the Java 17 compiler does not know the three instanceof branches cover the sealed type; that is exactly where Java 21 switch pattern helps.'
      ],
      explain: `Each record auto-generates the accessor {{amount()}} from the same-named component, so all three subtypes satisfy the interface declaration {{long amount();}} without writing extra lines. The compact constructor runs before fields are assigned: if {{amount < 0}} then the object never exists, so {{charged}} never needs to guard against negative amounts. The line {{Objects.requireNonNull(cause, "cause")}} returns the exact instance passed in and throws only when it is null — this error type fits infrastructure failure (a gateway call failed) where you want a short message rather than a business exception. The test {{err.cause() == boom}} asserts the record keeps the original instance without copying, so the original stack trace remains intact for investigation. The compiler-generated {{equals}}/{{hashCode}} is also why many teams use records as keys: two {{Success}} values with the same data create only one entry in a HashMap, and {{toString}} prints component names ready-made so logs are readable — remember to mask sensitive data before letting it print.`
    }],
    check: [
      { q: 'When does a record\'s compact constructor run, and what is it allowed to do?', options: ['Runs after fields are assigned, so to normalize you must write this.x = ...', 'Runs before fields are assigned: you validate or override parameters, and assigning this.x causes a compiler error', 'Only runs for records without components, used to initialize static values', 'It is a required constructor the compiler generates when you write a canonical constructor yourself'], explain: 'The compiler inserts field assignments at the end of the compact constructor, so the body works with parameters. A record field is final and unassigned when the body runs, so writing this.x produces the error "cannot assign a value to final variable".' },
      { q: 'A Java 17 codebase handles PaymentResult with an if/else instanceof chain. A new subtype is added to the permits list. What happens?', options: ['The compiler errors at every branch that does not yet handle the new subtype', 'The runtime throws an illegal subtype exception, so tests catch it immediately', 'No compile error: the new branch silently falls into the remaining handling of the function and may return a wrong value', 'All old records are disabled and equals must be rewritten'], explain: 'An if-chain is not checked for exhaustiveness, even when the type is sealed. This is a bug that throws no exception: an order of the new type is treated as a failure or charged zero. Only Java 21 switch pattern forces full coverage, and then do not write default.' },
      { q: 'Why is a record not suitable as a JPA entity but suitable as a DTO?', options: ['Because a record has no equals and hashCode so JPA cannot compare', 'Because an entity needs a non-final class for Hibernate to create lazy-loading proxies, needs a no-arg constructor and fields that can be reassigned; a DTO only needs to carry immutable data', 'Because a record only contains integer types so it cannot map columns', 'Because Jackson cannot read records so every layer must use regular classes'], explain: 'Hibernate subclasses the entity class for lazy loading and dirty checking, so final classes like records are ruled out. Records remain a good choice for DTOs, for projections in queries, and since Hibernate 6.2 as @Embeddable. Jackson has supported records directly via the canonical constructor since 2.12.' },
      { q: 'Code: if (r instanceof Success s) return s.reference(); After this if line, is variable s still usable?', options: ['Yes, because s is declared at function scope', 'No: s only exists where the compiler has proven the condition true (flow scoping); to keep using it, handle it fully in the branch or assign to a separate variable', 'Only usable if Success is a subtype of a sealed interface', 'Only usable when adding case null'], explain: 'The binding variable of an instanceof pattern only enters scope at the branch where the condition is certainly true. If the condition is false there is no object to cast, so keeping s alive would break type safety — which is also why you should return inside the branch.' }
    ]
  }
});
