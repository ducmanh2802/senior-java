/*
 * English translation of js/data/lessons-core.js — task T752. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-008
 */
App.i18n.content({
  'lesson-core-008': {
    title: `Record, sealed interface and pattern matching: modeling business outcomes`,
    goals: [
      'Write a record with compact constructor to reject bad data at creation time',
      'Model outcomes with sealed interface so invalid states are no longer representable',
      'Use instanceof pattern to branch by type without manual casting',
      'Explain what Java 21 switch pattern adds in exhaustiveness and why the exercise only uses Java 17'
    ],
    body: `**Summary:** A **record** is a read-only data class written for you by the compiler: you declare the list of components (called **components**), Java auto-generates final fields, constructor, accessor, {{equals}}, {{hashCode}}, {{toString}}. A **sealed interface** with {{permits}} restricts the allowed subtypes, so a payment result can only be Success, Declined, or Failed — no fourth state, no need to return {{null}} and no need for a {{boolean}} flag. The **instanceof pattern** ({{r instanceof Success s}}) both checks the type and creates the already-cast variable {{s}}; **switch pattern** is a Java 21 feature, used here only for reading because the exercise compiles with Java 17.

### From data-carrying class to record
Previously a class that only carried data looked like this: final fields, constructor assigning each field, accessor for each field, then {{equals}}, {{hashCode}}, {{toString}} — about thirty lines, and the last three lines are where mistakes most often happen: forgetting a field in {{equals}} makes two different objects considered equal, forgetting one in {{hashCode}} makes HashMap lookups return unpredictable results.

~~~java
record Money(long amount, String currency) { }
~~~

One line replaces the entire block. The table below lists exactly what the compiler writes for you:

| You only declare | Compiler auto-generates |
|---|---|
| {{record Money(long amount, String currency)}} | each component as a private final field |
| | canonical constructor {{Money(long, String)}} in component order |
| | accessor {{amount()}} and {{currency()}} — no get prefix |
| | {{equals}} and {{hashCode}} computed over all components, impossible to forget a field |
| | {{toString}} in the form {{Money[amount=1000, currency=VND]}} |

Two points often asked: the accessor is {{amount()}} not {{getAmount()}}, because record does not follow the JavaBeans convention (Jackson from 2.12 reads records via constructor and components so no getter is needed); and a record is implicitly **final** and extends {{java.lang.Record}} — so it cannot extend another class, implementing interfaces is fine, and you cannot declare instance fields beyond the components (static fields are allowed).

### Compact constructor: closing the door at entry
A **compact constructor** is a short body block written with the record name and no parameter list. It runs **before** fields are assigned; at the end of the body, the compiler inserts field assignments from the parameters themselves.

~~~java
record Money(long amount, String currency) {
    Money {                                                      // compact: do not write (long amount, ...)
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        currency = currency.toUpperCase(java.util.Locale.ROOT);   // normalize PARAMETER, do not write this
    }
}
~~~

Why must it run before assignment? Because the field is final, assigned only once, and that assignment is the part the compiler adds at the end. If you write {{this.currency = ...}} inside the compact constructor, the compiler errors "cannot assign a value to final variable currency" — Java's way of reminding you: to transform the value, override the parameter.

> Design note: when validation is in the constructor, every Money object in the system is already valid. Functions after it do not need to repeat the {{amount < 0}} condition anymore. That is an **invariant**: something always true throughout the object's lifetime, and the only place to check it is at creation time.

| Want to | Use |
|---|---|
| Block or normalize input data | compact constructor |
| Add a convenient creation method, e.g. infer currency automatically | overload calling {{this(amount, "VND")}} |
| Cut the link with the caller's list/array | {{List.copyOf}} in compact constructor |
| Change the public signature | hand-written canonical constructor, keeping correct types and component order |

### Shallow immutability: record does not protect inner content automatically
A final field only guarantees **the reference** does not change. If the component is a {{List}} or array and the caller still keeps the original, they can mutate the inner content; and since the record's {{hashCode}} is computed over content, an object sitting in HashMap/HashSet will "disappear" on lookup.

~~~java
record Basket(String id, List<String> items) {
    Basket { items = List.copyOf(items); }        // immutable snapshot: the caller has no path left to modify
}
~~~

{{List.copyOf}} copies and returns an unmodifiable list — that is defensive copying at entry, the same principle as the Immutable object and defensive copying lesson in this track.

### Sealed interface: sealing the list of subtypes
Modeling goal: "a payment command has exactly three outcomes".

~~~java
sealed interface PaymentResult permits Success, Declined, Failed {
    long amount();                                   // all three subtypes must have an amount
}
record Success(long amount, String reference, long fee) implements PaymentResult { }
record Declined(long amount, String code, String message, boolean retryable) implements PaymentResult { }
record Failed(long amount, String message, Throwable cause) implements PaymentResult { }
~~~

{{permits}} lists exactly the types allowed to implement; any other class trying to implement {{PaymentResult}} is rejected by the compiler. Each subtype must choose one of three stances: final (no further extension), sealed (continues sealing), or non-sealed (opens to the world); records are implicitly final so nothing needs to be written. Subtypes must be in the **same package** as the sealed type (if the project uses modules, same module); placing them in one file is the tidiest way, in which case {{permits}} can be omitted because the compiler infers it.

Why not enum? Because each branch carries different data: Declined needs {{code}} and {{retryable}}, Success needs {{reference}} and {{fee}}; an enum constant is a single constant, to attach different data per creation you would stuff fields into the enum and then every constant carries every field. Why not a {{boolean ok}} plus a bunch of separate fields? Because that allows expressing meaningless states.

| Modeling approach | Can meaningless state be created | Who catches it |
|---|---|---|
| boolean flag plus separate fields, allowing null | Yes: ok true but reference null | the user, after the error has occurred |
| open superclass plus subclasses | Yes: add a new subtype with nowhere to handle it | code review, or a bug |
| sealed interface plus records | No: each branch carries exactly its own data | compiler |

This is another way of saying the principle "make illegal states unrepresentable": design types so errors cannot be written. The real flow of a payment command through three systems, where {{PaymentResult}} is born:

~~~seq
title: A payment command through three systems
actors: Service | Bank Gateway | Bank
Service -> Bank Gateway: POST /pay (amount, order code)
Bank Gateway -> Bank: card authorization
Bank --> Bank Gateway: error code 51 (expired card)
Bank Gateway --> Service: 200 + DECLINED result
Service --> Service: convert result to Success or Declined
note Service..Bank: Service only receives PaymentResult, never receives null
~~~seq

### instanceof pattern (Java 16/17) and switch pattern (Java 21)
~~~java
static long charged(PaymentResult r) {
    if (r instanceof Success s) return s.amount();   // s is already Success, no manual cast needed
    if (r instanceof Declined d) return 0L;
    if (r instanceof Failed f) return 0L;
    return 0L;                                       // Java 17 does not know the three branches cover everything
}
~~~

Variable {{s}} in the pattern {{r instanceof Success s}} is called a **binding variable**: it lives only at points where the compiler has proven the condition is true — a rule called flow scoping. Because if the condition is false there is no object to cast, {{s}} cannot be used in the {{else}} block. The safest approach: return the result inside the branch, do not save the variable for later. The second limitation: a combined pattern like {{if (r instanceof Declined || r instanceof Failed)}} cannot bind a variable, because the compiler does not know which branch is true.

The final {{return 0L}} line is a classic annoyance: sealed tells us there are exactly three types, but the if-chain is not checked for exhaustiveness in Java 17. Java 21 (JEP 441) fixes this with switch pattern:

~~~java
static long charged21(PaymentResult r) {
    return switch (r) {                              // Java 21 — NOT used in the exercise below
        case Success s -> s.amount();
        case Declined d -> 0L;
        case Failed f -> 0L;                         // no default needed: sealed has listed enough
    };
}
~~~

In this form the compiler **forces** covering every subtype, and record pattern also destructures components: {{case Success(amt, ref, fee) -> ...}}, with a guard condition: {{case Declined d when d.retryable() -> ...}}. The practical consequence is very valuable: adding {{Crypto}} to {{permits}} makes every switch without default a **compile error** and lists exactly the places to fix. If you habitually write default, the benefit disappears, because default swallows new subtypes.

A detail about null: {{switch}} on a null value throws {{NullPointerException}} if there is no {{case null}} (Java 21 allows writing {{case null}}), while an if/else instanceof chain silently lets null fall through to the final line. If null is not valid input, start the function with {{Objects.requireNonNull(r, "result")}}.

> Senior tip: what kills you in production is not syntax but **missing branch handling**. A Java 17 codebase uses if/else instanceof chains: adding a new subtype silently falls into the last branch, e.g. returning zero instead of reporting an error. Three defenses: consolidate every "translation" of {{PaymentResult}} into behavior into **one** function; write unit tests per subtype; when moving to Java 21, switch to switch pattern and remove both.

### Production pitfalls
- Using a record as a JPA **entity**: Hibernate needs a non-final class to create lazy-loading proxies, needs a no-arg constructor and fields that can be reassigned when loading. Records fit DTO/projection well; from Hibernate 6.2 records can also be used as {{@Embeddable}}.
- Component is a {{List}} or array without copying: content gets modified from outside, {{equals}}/{{hashCode}} change, object is lost in HashMap/HashSet.
- Writing {{this.x = ...}} inside compact constructor: compile error; to normalize, override the parameter instead.
- record's {{toString}} prints **all** components: if the record contains PAN, token, password, logs will leak it. Overriding {{toString}} to mask is valid and should be done at creation time.
- {{equals}} compares by component, so two records of different types with the same value are still not equal; when you need to compare by business logic, compare via the common interface accessor ({{amount()}}) instead of {{equals}}.
- Sealed subtype placed in another package: confusing "illegal inheritance" error — remember the same package/module rule.
- Not checking parameters at the entry point, letting NPE explode at a mapper layer far from where bad data was received; the investigator loses half a day finding a single {{null}} line.
- Thinking "record is immutable so create as many as you want": each "edit" is a new object. A loop reading two million rows will show allocation pressure — but that is a matter to measure then optimize, not a reason to drop records.

### Interview notes
Questions go in order: how record differs from a regular class, when compact constructor runs and whether {{this.x}} can be assigned, what sealed gives that a regular interface does not, how exhaustiveness works when adding a subtype, why not to use record as entity, how instanceof pattern differs from switch pattern in which version. A scoring answer: **mechanism → type-safety benefit → practical limits (mutable components, JPA, toString)** then close with an experience, e.g. "we consolidated result conversion into one function and switched to switch pattern on Java 21, so every unhandled case surfaces at compile time".`,
    exercises: [{
      title: `PaymentResult sealed, instanceof pattern and compact constructor`,
      prompt: `Model the result of a payment command using a sealed interface with three records, then handle it with instanceof pattern. **Only use features available in Java 17**: no switch pattern, no record pattern.
- {{sealed interface PaymentResult}} permits exactly three types {{Success}}, {{Declined}}, {{Failed}}; each type is a record and all have component {{amount}} of type {{long}} (VND); interface declares {{long amount();}}.
- {{Success}} additionally has {{reference}} (transaction code) and {{fee}} (fee, {{long}}). {{Declined}} additionally has {{code}}, {{message}} and {{retryable}} ({{boolean}}). {{Failed}} additionally has {{message}} and {{cause}} ({{Throwable}}).
- Compact constructor **rejects invalid data at creation time**: {{amount < 0}} → {{IllegalArgumentException}} whose message contains the word amount, applied to all three records; {{reference}} null or blank-only → {{IllegalArgumentException}} containing reference; {{code}} null or blank → {{IllegalArgumentException}} containing code; in {{Failed}}, {{cause}} null → {{NullPointerException}} whose message exactly equals the string cause.
- {{Checkout.charged(r)}}: Success returns {{amount}}, Declined returns 0, Failed returns 0.
- {{Checkout.receipt(r)}}: Success → "OK " + reference + " " + (amount - fee); Declined → "NO " + code + " REUSE" if retryable, otherwise "NO " + code + " STOP"; Failed → "ERR " + message.
- {{Checkout.retryLater(r)}}: true only when Declined with retryable, or when Failed; Success → false.
Write branches using the pattern {{if (r instanceof Success s)}}, no manual casting. No reading date/time, no random, no sleep: running twice must give the same result.`,
      hints: [
        'Compact constructor only writes the record name then the body, with no parameter list. To normalize, override the parameter, do not assign to this.',
        'To check for empty strings write {{reference == null || reference.isBlank()}}: isBlank treats a string of only whitespace as empty (available since Java 11).',
        'The instanceof pattern is written {{if (r instanceof Success s)}} — one pair of parentheses wraps the condition, variable s is only usable inside that branch.',
        'The function still needs a final return line because the Java 17 compiler does not know the three instanceof branches cover the sealed type; that is exactly where Java 21 switch pattern helps.'
      ],
      explain: `Each record auto-generates the accessor {{amount()}} from the same-named component, so all three subtypes satisfy the interface's {{long amount();}} declaration without writing extra lines. Compact constructor runs before fields are assigned: if {{amount < 0}} then the object does not exist at all, so {{charged}} never needs to guard against negative amounts. The line {{Objects.requireNonNull(cause, "cause")}} returns the exact instance passed in and only throws when it is null — this error type fits infrastructure failure (gateway call failed) where you want a short message rather than a business exception. The test {{err.cause() == boom}} asserts the record keeps the original instance without copying, so the original stack trace remains intact for investigation. The compiler-generated {{equals}}/{{hashCode}} is also why many teams use records as keys: two {{Success}} with the same value create only one entry in HashMap, and {{toString}} prints component names ready-made so logs are readable — remember to mask before letting it print sensitive data.`
    }],
    check: [
      { q: 'When does a record\'s compact constructor run and what is it allowed to do?', options: ['Runs after fields are assigned, so to normalize you must write this.x = ...', 'Runs before fields are assigned: you validate or override parameters, assigning this.x causes a compiler error', 'Only runs for records without components, used to initialize static values', 'It is a required constructor the compiler generates when you write a canonical constructor yourself'], explain: 'The compiler inserts field assignments at the end of the compact constructor, so the body works with parameters. Record fields are final and unassigned when the body runs, so writing this.x produces the error cannot assign a value to final variable.' },
      { q: 'A Java 17 codebase handles PaymentResult with an if/else instanceof chain. A new subtype is added to the permits list. What happens?', options: ['The compiler errors at every branch not yet handling the new subtype', 'The runtime throws an illegal subtype exception, so tests catch it immediately', 'No compile error: the new branch silently falls into the remaining handling of the function and may return a wrong value', 'All old records are disabled and equals must be rewritten'], explain: 'An if-chain is not checked for exhaustiveness even when the type is sealed. This is a bug that throws no exception: a new-type order is treated as failure or charged zero. Only Java 21 switch pattern forces full coverage, and then do not write default.' },
      { q: 'Why is a record not suitable as a JPA entity but suitable as a DTO?', options: ['Because a record has no equals and hashCode so JPA cannot compare', 'Because an entity needs a non-final class for Hibernate to create lazy-loading proxies, needs a no-arg constructor and fields that can be reassigned; a DTO only needs to carry immutable data', 'Because a record only contains integer types so it cannot map columns', 'Because Jackson cannot read records so every layer must use regular classes'], explain: 'Hibernate subclasses the entity class for lazy loading and dirty checking, so final classes like records are ruled out. Records remain a good choice for DTOs, for projections in queries, and from Hibernate 6.2 as @Embeddable. Jackson from 2.12 reads records directly through the canonical constructor.' },
      { q: 'Code: if (r instanceof Success s) return s.reference(); After this if line, is variable s still usable?', options: ['Yes, because s is declared at function scope', 'No: s only exists where the compiler has proven the condition true (flow scoping); to keep using it, handle it fully in the branch or assign to a separate variable', 'Only usable if Success is a subtype of a sealed interface', 'Only usable when adding case null'], explain: 'The binding variable of instanceof pattern only enters scope at the branch where the condition is certainly true. If the condition is false there is no object to cast, so keeping s alive would break type safety — also why you should return inside the branch.' }
    ]
  }
});
