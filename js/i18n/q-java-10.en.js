/*
 * English translation of js/data/q-java.js — task T480. Format: js/core/i18n.js (content overlay).
 * ids: modern-018 modern-019 modern-020 modern-021 modern-022 modern-023 modern-024
 */
App.i18n.content({
  'modern-018': {
    q: 'The team is using Lombok {{@Data}}, {{@Value}}, and {{@Builder}} everywhere, and someone proposed switching to {{record}}. For request/response DTOs, value objects (Money, Email), configuration classes, and JPA entities, would you choose records, Lombok, or hand-written classes? Why?',
    a: `**Summary:** {{record}} (Java 16) is the default choice for **immutable** data: DTOs, value objects, configuration classes ({{@ConfigurationProperties}}), projections. Lombok {{@Value}} is close to a record but is an external library; {{@Data}} generates setters, so it produces a mutable object and is only appropriate when a framework needs setters. Keep JPA entities as **plain classes** (a few safe Lombok annotations such as {{@Getter}} are fine), do not use records and avoid {{@Data}}. {{@Builder}} is still useful when an object has many optional fields.

### Quick understanding
A record is like a printed invoice: written once, readable by everyone, editable by no one, and two invoices with the same content are equal. Lombok {{@Data}} is like a draft written in pencil: easy to change, but anyone holding it can change it. Lombok is an "automatic printer" that runs at compile time, while a record is a feature built into the language.

### Terminology
- **Record**: a final class with {{private final}} fields that automatically generates the constructor, accessors of the form {{name()}}, {{equals}}, {{hashCode}}, and {{toString}}.
- **Lombok**: an annotation processor that hooks into compilation to generate code (getters, setters, builders...).
- **Value object**: an object identified by its value (two {{Money(100, VND)}} are the same), with no identity of its own.

### Comparison
| | record | Lombok @Value | Lombok @Data | Hand-written class |
|---|---|---|---|---|
| Immutable | yes | yes | no (has setters) | depends |
| External dependency | no | yes (Lombok + IDE plugin) | yes | no |
| Accessor | {{name()}} | {{getName()}} | {{getName()}}/{{setName()}} | depends |
| Extend another class | no | no (final) | yes | yes |
| Builder | write it yourself | add {{@Builder}} | add {{@Builder}} | write it yourself |
| JPA entity | no | no | risky | should use |

### Choosing by type (step by step)
1. **Request/response DTOs**: records. Jackson 2.12+ can map records, and Bean Validation annotations go on the components ({{record CreateOrder(@NotBlank String sku, @Positive int qty)}}).
2. **Value objects**: records plus a compact constructor to validate and normalize. Why: immutability makes a value object safe to use as a Map key or to share between threads.
3. **Configuration classes**: records with {{@ConfigurationProperties}} (Spring Boot 3 binds through the constructor), no setters needed.
4. **JPA entities**: plain classes. JPA needs a no-arg constructor and non-final fields, and Hibernate creates proxies by subclassing the class; records are final, so they cannot satisfy that. Avoid {{@Data}} on entities because {{equals}}/{{hashCode}} over every field and {{toString}} reach into lazy relationships.

~~~java
// Value object as a record: validate once, after that nobody can modify it
public record Email(String value) {
    public Email {                                  // compact constructor
        Objects.requireNonNull(value, "email");
        value = value.strip().toLowerCase();        // normalize before assigning to the field
        if (!value.contains("@")) throw new IllegalArgumentException("invalid email");
    }
}
~~~

### Common pitfalls
1. **A record holding a mutable {{List}}**: a record is only "shallowly" immutable; a caller keeping the original list can still modify it. Use {{List.copyOf}} in the compact constructor.
2. **Switching {{@Data}} to a record breaks code that calls {{getName()}}**: record accessors are named {{name()}}; some older libraries (JSP EL, old BeanUtils) only understand JavaBean-style getters.
3. **A record with too many fields (15+)**: the constructor gets long and it is easy to pass arguments in the wrong position; split it into smaller records or use a builder.
4. **Mixing Lombok {{@Data}} with inheritance**: the generated {{equals}} does not call {{super.equals}} by default, with a warning; it is easy to end up with two different objects treated as equal.

### One-minute spoken answer
"For immutable data I use records: DTOs, value objects, configuration. They are built into the language, do not depend on Lombok, are immutable, and equal by value. Lombok @Data creates mutable objects, so I only use it when the framework needs setters. I keep JPA entities as plain classes because they need a no-arg constructor, non-final fields, and proxies; on entities I do not use @Data. For builders I still use Lombok @Builder when there are many optional fields."

> Senior tip: do not convert wholesale from Lombok to records in one PR; go module by module and start with the DTOs of new APIs. Lombok is still a compile-time dependency that must keep up with every JDK upgrade (older Lombok releases broke on Java 16+ because of strong encapsulation), so the fewer places depend on it, the lighter the upgrade.`,
    follow: ['Can a record implement interfaces and have static factory methods?', 'Why does @Data on a JPA entity cause StackOverflowError or LazyInitializationException?', 'How do you add a builder to a record without using Lombok?']
  },
  'modern-019': {
    q: 'The sign-up form receives a string that users paste in, with odd whitespace and line breaks, and you need to generate email content with a specific format. How do you use the String APIs from Java 11 onwards ({{strip}}, {{isBlank}}, {{lines}}, {{repeat}}, {{formatted}}...), and how does {{strip()}} differ from {{trim()}}?',
    a: `**Summary:** {{trim()}} only removes characters with a code lower than or equal to U+0020 (the space and ASCII control characters), while {{strip()}} (Java 11) removes every character that {{Character.isWhitespace}} considers whitespace, including Unicode spaces such as U+3000 or U+2003. {{isBlank()}} checks whether a string is empty or all whitespace, {{lines()}} splits it into a Stream, {{repeat(n)}} repeats it, and {{formatted(...)}} (Java 15) is a concise {{String.format}}. Note: neither {{strip}} nor {{trim}} removes the non-breaking space U+00A0.

### Quick understanding
Users copying from Word, Excel, or the web often drag along "invisible spaces": they look like a space but are a different character. {{trim()}} only knows the space of old typewriters; {{strip()}} also knows the spaces of the Unicode standard. It is like a guard who only recognises the old uniform versus a guard who has an up-to-date list of uniforms.

### Terminology
- **Unicode whitespace**: whitespace characters other than the ordinary space, for example em space (U+2003), ideographic space (U+3000).
- **NBSP (U+00A0)**: the "non-breaking" space, often seen when copying from HTML; {{Character.isWhitespace}} returns false for it.
- **Line terminator**: {{\\n}}, {{\\r}}, {{\\r\\n}}; {{lines()}} understands all three.

### APIs worth remembering
| API | Since | Use for |
|---|---|---|
| {{isBlank()}} | 11 | validating input that is empty or all whitespace |
| {{strip()}}, {{stripLeading()}}, {{stripTrailing()}} | 11 | trimming Unicode whitespace |
| {{lines()}} | 11 | splitting into a Stream without allocating a large array |
| {{repeat(n)}} | 11 | repeating a string (rules, padding) |
| {{indent(n)}}, {{transform(f)}} | 12 | indenting each line, applying a function to a string |
| {{formatted(...)}}, {{stripIndent()}} | 15 | concise formatting, handling text blocks |
| {{String.join}}, {{chars()}} | 8 | joining with a separator, iterating characters |

### Step-by-step input handling
~~~java
String raw = "\\u3000 Nguyen Van A\\u00A0\\n";
raw.trim();        // U+3000 at the start remains (code > U+0020) and NBSP at the end
raw.strip();       // removes U+3000 and \\n, but NBSP remains
String name = raw.replace('\\u00A0', ' ').strip();   // handle NBSP first, then strip
if (name.isBlank()) throw new IllegalArgumentException("Name is empty");

long nonEmpty = csvText.lines().filter(l -> !l.isBlank()).count(); // count lines with data
String line = "-".repeat(40);
String body = "Hello %s, order %d has been delivered.".formatted(name, orderId);
~~~
1. {{replace('\\u00A0', ' ')}} turns NBSP into a regular space. Why do it by hand: {{strip}} is based on {{isWhitespace}}, and that method deliberately excludes "non-breaking" spaces.
2. {{strip()}} trims both ends while preserving whitespace between words; to collapse runs of spaces use {{replaceAll("\\\\s+", " ")}} (note that {{\\s}} only matches ASCII by default).
3. {{lines()}} returns a lazy Stream, handy when processing a multi-line string without {{split("\\n")}} allocating a whole array.

### Common pitfalls
1. **Using {{trim()}} on data copied from Excel/the web**: comparing names or emails fails, and duplicate records are created.
2. **Thinking {{strip()}} handles everything**: NBSP and zero-width space (U+200B) still slip through; they need their own normalization.
3. **Using {{isEmpty()}} instead of {{isBlank()}}**: the string "   " passes validation.
4. **{{String.format}}/{{formatted}} in a hot loop**: slower than repeated concatenation because it has to parse the pattern; use it for logs and messages, not for processing millions of lines.
5. **Locale dependency**: {{toLowerCase()}} without {{Locale.ROOT}} can give a different result on a machine configured for Turkish (the letter I).

### One-minute spoken answer
"trim only removes characters up to U+0020; strip from Java 11 removes Unicode whitespace according to Character.isWhitespace, but neither removes NBSP, so I replace NBSP first. For validation I use isBlank instead of isEmpty. I split lines with lines, draw rules with repeat, and generate content with formatted or text blocks. For user input, I normalize in a single place before saving."

> Senior tip: put one shared normalization function in place (replace NBSP, zero-width, {{strip}}, Unicode {{Normalizer.normalize(s, Form.NFC)}} for Vietnamese) and call it at the data-ingestion boundary. Vietnamese text can be in precomposed form (NFC) or decomposed form (NFD, common when copying from macOS): two strings look identical but {{equals}} returns false, causing duplicate customers when you search by name.`,
    follow: ['Why does Character.isWhitespace not treat NBSP as whitespace?', 'How do NFC and NFD differ, and how do they affect Vietnamese text search?', 'When should you use StringBuilder instead of formatted?']
  },
  'modern-020': {
    q: 'You need to compute a due date "one month later", the number of overdue days, and a "same time tomorrow" reminder for customers in several time zones. How do you use {{Period}}, {{Duration}}, and {{ChronoUnit}}? What are the traps around month-end, DST, and {{YYYY}} formatting, and how do you test time-dependent code?',
    a: `**Summary:** {{Period}} measures time **by calendar** (years, months, days), {{Duration}} measures an **exact length of time** (seconds, nanos). To add months use {{plusMonths}}/{{Period}} (31 Jan + 1 month = 29 Feb in a leap year, automatically clamped to the last day of the month); to count days use {{ChronoUnit.DAYS.between}}. "Same time tomorrow" in a region with DST must use {{plusDays(1)}} on {{ZonedDateTime}}, not a plus of 24 hours. Format the year with {{yyyy}}, never with {{YYYY}} (the week-based year). Code that depends on "now" takes a {{Clock}} through the constructor so tests can pin the time.

### Quick understanding
{{Period}} is like a wall calendar: "in one month" means flipping to the next month's page, and if February is short you stop on its last day. {{Duration}} is like a stopwatch: exactly 86,400 seconds, regardless of whether that day switches to daylight saving time.

### Terminology
- **DST (Daylight Saving Time)**: summer time, when some countries move the clock forward or back by one hour, producing 23- or 25-hour days. Vietnam has no DST, but customers in the US and Europe do.
- **ChronoUnit**: a unit of time ({{DAYS}}, {{MONTHS}}...), with {{between(a, b)}} counting whole units.
- **Week-based year**: the ISO week year; a few days at the end of December can belong to the following "week year".

### Step-by-step mechanics
~~~java
LocalDate.of(2024, 1, 31).plusMonths(1);   // 2024-02-29: clamped to the last day of the month
LocalDate.of(2024, 1, 31).plusMonths(1).plusMonths(1); // 2024-03-29, NOT 31 Mar
LocalDate.of(2024, 1, 31).plusMonths(2);   // 2024-03-31

long overdue = ChronoUnit.DAYS.between(dueDate, today);   // whole days

ZonedDateTime ny = ZonedDateTime.of(2024, 3, 9, 12, 0, 0, 0, ZoneId.of("America/New_York"));
ny.plusDays(1);                    // 2024-03-10T12:00-04:00: same time on the clock
ny.plus(Duration.ofHours(24));     // 2024-03-10T13:00-04:00: 10 Mar is only 23 hours long
~~~
1. {{plusMonths}} keeps the same day if it can; if the target month does not have that day, it takes the last day of the month. That is why adding one month twice differs from adding two months at once: an instalment plan must always be calculated from the **origin date** ({{start.plusMonths(i)}}), never accumulated from the previous instalment.
2. {{plusDays}} on {{ZonedDateTime}} works on the local clock and then resolves the new offset; {{plus(Duration)}} adds on the absolute timeline. Why they differ: on 10 Mar 2024 in New York the clock jumps from 2:00 to 3:00.
3. For a deadline measured in time (a token expiring after 24h), use {{Instant.plus(Duration)}}, because that is a real length of time.

### Selection table
| Need | Use |
|---|---|
| N months/years later (contracts, instalments) | {{LocalDate.plusMonths}}, {{Period}} |
| Expires after N hours/minutes (tokens, OTP) | {{Instant.plus(Duration)}} |
| Count days between two dates | {{ChronoUnit.DAYS.between}} |
| Reminders at the customer's local time | {{ZonedDateTime.plusDays}} with the customer's ZoneId |

### Common pitfalls
1. **{{YYYY}} in a pattern**: {{DateTimeFormatter.ofPattern("YYYY-MM-dd")}} prints 30 Dec 2024 as "2025-12-30" because {{Y}} is the week-based year. Use {{yyyy}} (or {{uuuu}}).
2. **{{hh}} instead of {{HH}}**: {{hh}} is the 1-12 hour format; without AM/PM, 14:00 becomes 02:00.
3. **Calling {{LocalDate.now()}} all over the place**: it depends on the server's default timezone (the container is usually UTC) and cannot be pinned in tests.
4. **A shared static {{SimpleDateFormat}}**: not thread-safe; {{DateTimeFormatter}} is immutable, so it is safe to share.
5. **{{Period.between(a, b).getDays()}} to get the total number of days**: it only returns the "days" part after subtracting months (1 month and 3 days gives 3).

### Testing with Clock
~~~java
class DueService {
    private final Clock clock;                        // injected, never call now() directly
    DueService(Clock clock) { this.clock = clock; }
    boolean isOverdue(LocalDate due) { return LocalDate.now(clock).isAfter(due); }
}
var fixed = Clock.fixed(Instant.parse("2024-12-31T17:30:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
new DueService(fixed).isOverdue(LocalDate.of(2024, 12, 31)); // true: in Vietnam it is already 1 Jan 2025
~~~

### One-minute spoken answer
"Period is for calendar-based spans such as months and years; Duration is for an exact length of time such as a 24-hour token; I count days with ChronoUnit.DAYS.between. Adding months clamps to the end of the month, so an instalment plan must always be calculated from the origin date. For a same-time-tomorrow reminder I use plusDays on ZonedDateTime in the customer's timezone, because a DST day is only 23 or 25 hours long. The pattern uses yyyy, not YYYY, and I inject Clock so I can test."

> Senior tip: the {{YYYY}} bug usually only shows up in the last week of December, when the whole team is on holiday; add unit tests with 29-31 Dec for every date pattern. In Spring, declare a {{Clock}} bean ({{Clock.systemUTC()}}) and let every service receive it through the constructor; tests simply swap in {{Clock.fixed}}.`,
    follow: ['How do you calculate an instalment schedule for the 31st of every month correctly?', 'At which layer should Instant, LocalDateTime, and ZonedDateTime be used?', 'How does ZonedDateTime handle a local time that doesn\'t exist because of DST (2:30 AM)?']
  },
  'modern-021': {
    q: 'You need to pass custom logic (a check, a conversion, object creation) into a shared method. When do you use the built-in {{Function}}, {{Predicate}}, {{Supplier}}, {{Consumer}}, {{UnaryOperator}}, when do you use primitive variants such as {{IntPredicate}}, and how do you compose them with {{andThen}}, {{compose}}, {{Predicate.not}}? When should you define your own interface?',
    a: `**Summary:** The {{java.util.function}} package ships the common function "shapes": {{Function<T, R>}} (T in, R out), {{Predicate<T>}} (T in, boolean out), {{Supplier<T>}} (nothing in, T out), {{Consumer<T>}} (T in, nothing out), {{UnaryOperator<T>}}/{{BinaryOperator<T>}} (same input and output type). Primitive variants ({{IntPredicate}}, {{ToLongFunction}}...) avoid boxing in hot code. Compose functions with {{andThen}}/{{compose}}, compose conditions with {{and}}/{{or}}/{{negate}}/{{Predicate.not}} (Java 11). Define your own {{@FunctionalInterface}} when you need **a meaningful business name**, need to throw checked exceptions, or have more than 2 parameters.

### Quick understanding
A functional interface is like a standard electrical outlet: {{Predicate}} is the "plug in and get true/false" outlet, {{Supplier}} is the "give me something without plugging anything in" outlet. A lambda is the plug. With standard outlets every plug fits, so you do not have to build a custom outlet for each device.

### Terminology
- **Functional interface**: an interface with exactly one abstract method, which a lambda can stand in for.
- **Boxing**: converting {{int}} to {{Integer}} (an object on the heap); it happens when you use {{Function<Integer, Integer>}}.
- **Composition**: combining small functions into a larger one without rewriting the logic.

### Selection table
| Shape | Interface | Example |
|---|---|---|
| T in, R out | {{Function<T, R>}} | {{Order::total}} |
| T in, boolean out | {{Predicate<T>}} | {{o -> o.paid()}} |
| nothing in, T out | {{Supplier<T>}} | {{() -> new ArrayList<>()}} |
| T in, nothing out | {{Consumer<T>}} | {{log::info}} |
| T, U in, R out | {{BiFunction<T, U, R>}} | {{(a, b) -> a.add(b)}} |
| T in, T out | {{UnaryOperator<T>}} | {{String::strip}} |
| int in, boolean out | {{IntPredicate}} | {{n -> n > 0}} (no boxing) |

### Step-by-step composition
~~~java
Function<String, String> clean = String::strip;
Function<String, String> lower = s -> s.toLowerCase(Locale.ROOT);
Function<String, String> normalize = clean.andThen(lower);  // strip first, then lower
// compose reverses the order: lower.compose(clean) is also strip first, then lower

Predicate<Order> paid = Order::paid;
Predicate<Order> bigPaid = paid.and(o -> o.totalCents() > 10_000_000);
List<String> nonBlank = names.stream()
        .filter(Predicate.not(String::isBlank))   // cleaner than s -> !s.isBlank()
        .toList();

// Supplier: create the value only when it is actually needed (lazy)
String v = cache.getOrDefault(key, null);
String r = Optional.ofNullable(v).orElseGet(() -> loadFromDb(key));
~~~
1. {{f.andThen(g)}} means "run f, pass the result to g"; {{f.compose(g)}} means "run g first, then f". Why it matters: misreading the order swaps strip and lower, which is usually harmless, but with "validate then encrypt" it is a serious bug.
2. {{Predicate.not(String::isBlank)}} exists because a method reference cannot be written as {{!String::isBlank}}.
3. {{Supplier}} defers the computation: {{orElseGet(supplier)}} only calls the DB when there is no value, unlike {{orElse(loadFromDb(key))}}, which always calls it.

### When to define your own interface
~~~java
@FunctionalInterface
interface FeeCalculator {                  // a business name, clearer than BiFunction<Order, Customer, BigDecimal>
    BigDecimal fee(Order order, Customer customer);
}
~~~
- The name conveys the meaning, it can carry Javadoc, and the IDE suggests it well.
- You need to throw a checked exception (the standard interfaces do not declare {{throws}}).
- You have 3 or more parameters (the JDK has no {{TriFunction}}).

### Common pitfalls
1. **{{Function<Integer, Integer>}} in a loop running millions of times**: boxing creates garbage; use {{IntUnaryOperator}}.
2. **A method signature taking {{BiFunction<Map<String, Object>, List<Long>, Optional<Result>>}}**: nobody can read it; define a dedicated interface.
3. **A stateful lambda** (counting calls inside it): hard to test, and wrong when run in parallel.
4. **Getting the order of {{andThen}}/{{compose}} wrong**.

### One-minute spoken answer
"I choose by shape: Function for a transformation, Predicate for a condition, Supplier for lazy creation, Consumer for an action, UnaryOperator when the input and output types match. In hot code over primitives I use the primitive variants to avoid boxing. I compose with andThen, compose, and, or, and Predicate.not. When the generic signature gets too long, I need a checked exception, or there are many parameters, I define my own @FunctionalInterface with a business name."

> Senior tip: in business code, purpose-named interfaces such as {{FeeCalculator}} and {{DiscountRule}} are immediately readable to newcomers and easy to turn into Spring beans (one class per rule) as the logic grows. The JDK's standard interfaces fit best at the utility layer and inside stream pipelines.`,
    follow: ['Why doesn\'t the JDK have a TriFunction?', 'Do lambdas and method references differ in performance?', 'How do you turn rules written as Predicate into configuration?']
  },
  'modern-022': {
    q: 'You have several payment methods (card, wallet, bank transfer). When do you put the logic in an overridden method inside each class (polymorphism), and when do you use a sealed interface + record + {{switch}} pattern matching (Java 21) from the outside? What are the trade-offs when adding a new type versus a new operation?',
    a: `**Summary:** This is the classic "add a type or add an operation" problem. **Polymorphism** (each class implements the method itself) makes it easy to **add a new type** (add a class, change no existing code), but every time you **add an operation** you must change every class. **Sealed + switch pattern matching** is the other way around: adding an operation is just writing one more method with a {{switch}}, while adding a new type makes the compiler point out every {{switch}} that needs updating. Choose polymorphism for behaviour tightly bound to the object and for open type sets; choose sealed + switch when the type set is **closed and stable** and there are many different operations living in different layers (fee calculation, display, reporting, mapping).

### Quick understanding
Polymorphism is like every employee knowing their own job: hiring another person is easy, but adding a new kind of task means retraining each person. Sealed + switch is like a chore chart on the wall: adding a new kind of task only needs one more chart; hiring a new person means every chart needs one more row, and the compiler is the manager checking that no chart was missed.

### Terminology
- **Sealed interface**: an interface that allows only a fixed list of classes to implement it ({{permits}}), since Java 17.
- **Pattern matching for switch**: a {{switch}} over the type that also extracts data into variables, final in Java 21 (JEP 441).
- **Exhaustive**: the switch covers every case; with a sealed type the compiler verifies it, so {{default}} is not needed.

### Two ways to write it
~~~java
// Approach 1: polymorphism
interface Payment { BigDecimal fee(); }
record Card(BigDecimal amount) implements Payment {
    public BigDecimal fee() { return amount.multiply(new BigDecimal("0.02")); }
}
// Approach 2: sealed + record + switch (Java 21)
sealed interface Pay permits CardPay, WalletPay, BankPay {}
record CardPay(BigDecimal amount, String bin) implements Pay {}
record WalletPay(BigDecimal amount, String provider) implements Pay {}
record BankPay(BigDecimal amount) implements Pay {}

static BigDecimal fee(Pay p) {
    return switch (p) {                    // no default: a missing case is a compile error
        case CardPay c   -> c.amount().multiply(new BigDecimal("0.02"));
        case WalletPay w when w.provider().equals("MOMO") -> BigDecimal.ZERO;
        case WalletPay w -> new BigDecimal("1000");
        case BankPay b   -> new BigDecimal("3300");
    };
}
~~~

### Trade-offs (step by step as the system grows)
1. **Adding an "Instalment" type**: polymorphism needs only a new class. Sealed: add it to {{permits}} and the compiler reports an error at every {{switch}} that lacks the new case. Why this is a benefit: you cannot forget to update the fee calculation or the reporting.
2. **Adding an "export reconciliation" operation**: polymorphism has to add a method to the interface and modify every class (and domain classes end up depending on the reporting layer). Sealed: write a new method in the reporting module; the domain records do not change.
3. **A third-party plugin adds a type**: only polymorphism can do that; sealed forbids classes outside the list.

| Criterion | Polymorphism | Sealed + switch |
|---|---|---|
| Adding a new type | easy, no changes to old code | must modify every switch (the compiler reminds you) |
| Adding a new operation | modify every class | add one method |
| Type set | open, supports plugins | closed, stable |
| Data and behaviour | packaged together | separated: a record is data, the logic lives where it is used |

### Common pitfalls
1. **Adding {{default}} to a switch over a sealed type**: you lose the exhaustive check, and a new type silently falls into the default branch.
2. **Wrong case order**: placing a general case ({{case WalletPay w}}) before a guarded case of the same type makes the compiler report an error, because the later case can never be reached (dominance).
3. **Using switch-by-type on an open type set** (a non-sealed class): {{default}} is mandatory, so you lose the main benefit.
4. **Scattering identical switch statements in 10 places**: if the same logic repeats, that is a sign it should become a method on the type itself.

### One-minute spoken answer
"Polymorphism makes adding a new type easy, but adding an operation means touching every class. Sealed plus records plus switch in Java 21 is the opposite: adding an operation is a new method, and adding a type is guided by the compiler thanks to the exhaustive check. Closed type sets such as payment methods, states, or processing results that several layers handle differently get sealed; open type sets with plugins get polymorphism. And I never put a default on a switch over a sealed type."

> Senior tip: the two approaches are not mutually exclusive. I usually keep the core, invariant domain behaviour in methods on the type (for example {{amount()}}), while operations "belonging to another layer" such as DTO mapping, display, and reconciliation are written with switch in that layer. Remember that sealed only pays off when every module is recompiled together; for API contracts between services you still have to handle unexpected values at runtime.`,
    follow: ['Why should you not put a default branch in a switch over a sealed interface?', 'Can a sealed interface be used across module/library boundaries?', 'Is the Visitor pattern still necessary now that Java 21 exists?']
  },
  'modern-023': {
    q: 'In a stream you call a method that throws a checked exception ({{Files.readString}}, an API call that returns {{IOException}}) and the code does not compile. How do you handle it: wrap it as unchecked, sneaky throw, or turn the error into a result? When processing 10,000 files where a few fail, what should you do?',
    a: `**Summary:** The standard functional interfaces ({{Function}}, {{Consumer}}...) do not declare {{throws}}, so a lambda cannot throw a checked exception. There are three directions: (1) **wrap it as unchecked** ({{UncheckedIOException}}) when one error means stopping the whole batch; (2) **turn the error into data** (a result record for success/failure) when you need to keep processing the remaining elements and report the failures; (3) **fall back to a for loop** when the error logic is complex. Avoid "sneaky throw" because it deceives the compiler and leaves the caller unaware of what it must catch.

### Quick understanding
A stream is like a packaging line: if one box is damaged there are two policies. "Stop the whole line" (throw an exception) is right when a damaged box means the whole batch is suspect. "Label the error and let the box keep moving" (error as data) is right when you want to pack every good box and collect the bad ones in a separate bin to look at later.

### Terminology
- **Checked exception**: an exception the compiler forces you to declare or catch ({{IOException}}, {{SQLException}}).
- **UncheckedIOException**: an unchecked class available since Java 8 for wrapping {{IOException}}.
- **Sneaky throw**: a trick that uses generics to throw a checked exception without the compiler knowing.

### Approach 1: wrap as unchecked (fail fast)
~~~java
List<String> contents = paths.stream()
        .map(p -> {
            try {
                return Files.readString(p);
            } catch (IOException e) {
                throw new UncheckedIOException("Cannot read " + p, e); // keep the cause and the file name
            }
        })
        .toList();
~~~
Step by step: the failing element throws, the stream stops immediately, and the following elements never run. Why this is reasonable: for example when loading config files, if one is missing the application should not start at all.

### Approach 2: error as data (keep processing)
~~~java
sealed interface Outcome permits Ok, Failed {}
record Ok(Path path, String content) implements Outcome {}
record Failed(Path path, String error) implements Outcome {}

static Outcome read(Path p) {
    try { return new Ok(p, Files.readString(p)); }
    catch (IOException e) { return new Failed(p, e.toString()); }
}
Map<Boolean, List<Outcome>> parts = paths.stream()
        .map(Main::read)
        .collect(Collectors.partitioningBy(o -> o instanceof Ok));
// parts.get(true): keep processing; parts.get(false): write a report, retry, send an alert
~~~
With 10,000 files where a few fail: take this approach, process the 9.99x good files, emit the list of failures with their reasons, and set a threshold (for example, mark the job FAILED when more than 1% fail) so a large incident is never silently swallowed.

### Comparison
| Approach | Pros | Cons | When to use |
|---|---|---|---|
| Wrap as unchecked | simple, keeps the stack trace | stops the whole batch | one error means the whole batch is bad |
| Error as data | processes the rest, produces a report | adds data types | batch, import, reconciliation |
| For loop + try/catch | explicit, allows retry and continue | longer | complex error logic |
| Sneaky throw | short | the caller does not know what to catch | almost never |

### Common pitfalls
1. **Swallowing the error**: catch {{IOException}} and {{return null}}, then {{filter(Objects::nonNull)}}: data disappears and nobody knows.
2. **Wrapping but losing the cause**: {{new RuntimeException(e.getMessage())}} loses the original stack trace; always pass {{e}} as the cause.
3. **Catching the exception outside the stream hoping to get the processed part**: when the stream throws, the {{toList()}} result does not exist; whatever already ran (if it had side effects) is left half done.
4. **Parallel stream + exception**: other elements may still be running or may already have run when the exception surfaces; do not assume "nothing happened yet".

### One-minute spoken answer
"Function and Consumer do not declare throws, so a lambda cannot throw a checked exception. If one error means stopping the batch, I wrap it in UncheckedIOException and keep the cause. For a batch over many files, I turn errors into data with Ok/Failed records, use partitioningBy to process the good part and report the bad part, and add a failure-rate threshold. For complex logic with retries I use a for loop. I avoid sneaky throw."

> Senior tip: in real import jobs, "error as data" also makes the job idempotent and re-runnable: store the {{Failed}} list in a table or a file, and the next run only re-processes those elements instead of running all 10,000 files again. Track the failure count by type as a metric so you notice when a partner changes the file format.`,
    follow: ['Why is sneaky throw considered dangerous?', 'How are exceptions thrown from a parallel stream?', 'How do you design retries for the failed elements of a batch?']
  },
  'modern-024': {
    q: 'As a tech lead, you set the Java version policy for more than 20 services: which JDK to run (LTS or the six-month release), which distribution (Temurin, Corretto, Oracle...), whether to allow preview features, and at what cadence to upgrade?',
    a: `**Summary:** Java releases a new version every six months (since Java 10 in 2018), and every two years there is an **LTS** release (17 in 2021, 21 in 2023, 25 in 2025). Production should run an **LTS** from an OpenJDK distribution that is committed to security updates (Eclipse Temurin, Amazon Corretto, Microsoft Build of OpenJDK, Azul Zulu, or Oracle JDK if you accept Oracle's license terms). **Do not use preview features** in production code because they can change or be withdrawn, and a class compiled with a preview feature only runs on that exact JDK release. Upgrade cadence: apply patches quarterly, and move to a new LTS within about 6-12 months of its release, once the main frameworks support it.

### Quick understanding
An LTS is like a car model the maker backs with a multi-year warranty; six-month releases are like a showroom model that is only serviced until the next one arrives. A preview feature is like an "experimental" feature on that showroom car: fine to test-drive, but do not carry real passengers with it.

### Terminology
- **LTS (Long-Term Support)**: a release the vendor patches and secures for many years.
- **Distribution**: an OpenJDK build packaged and patched by a provider; the source is nearly the same, and they differ in support period, license, and paid support channels.
- **Preview feature**: a language/API feature that is complete but not final, requiring {{--enable-preview}} both at compile time and at runtime.
- **CPU (Critical Patch Update)**: the quarterly security patch round (January, April, July, October).

### Proposed policy (step by step)
1. **Standardize on one target LTS** for all services (for example 21), with a time-limited list of exceptions. Why: one base image, one set of GC tunings, one patching process.
2. **Pick one distribution** and use it consistently in Docker base images, CI, and dev machines. Deployments on AWS usually choose Corretto; a neutral choice is Temurin. Document the license reasoning if you use Oracle JDK.
3. **Patch quarterly**: rebuild the base image when a new patch arrives (for example 21.0.x), let the pipeline run tests, then roll out gradually. Why: TLS/crypto vulnerabilities in the JDK are real, and slow patching is a risk.
4. **Move to a new LTS in waves**: wait for Spring Boot, Hibernate, the APM agent, and the build tool to officially support it; try it on 1-2 low-risk services, measure GC and latency, then expand. You can build with the new JDK while keeping the old {{--release}} level during the transition.
5. **Preview**: allowed in spikes, internal tools, and test code; forbidden in production code, enforced by a build check (no {{--enable-preview}} in the configuration).

~~~bash
# Check which JDK is running in the container (vendor and version columns)
java -XshowSettings:properties -version 2>&1 | grep -E "java.vendor|java.version"
# Compile targeting an LTS regardless of which JDK is used to build
javac --release 21 -d out $(find src -name "*.java")
~~~

### Trade-off table
| Choice | Benefit | Risk |
|---|---|---|
| LTS only | stable, ecosystem support | slow to get new features |
| Follow the six-month release | features, GC improvements early | must upgrade every six months, support ends quickly |
| Use preview | try new features | API changes, locked to one exact JDK |
| Different vendors | teams choose their own | hard to patch in sync, hard to reproduce bugs |

### Common pitfalls
1. **One JDK and one vendor per service**: security patches are not in sync, and a bug reproduces on only one machine.
2. **An image using a floating tag ({{latest}})**: tomorrow's build produces a different JDK, and GC or TLS behaviour changes without anyone knowing. Pin the version and update deliberately.
3. **Turning on preview "for fun" in a production service**: the next JDK upgrade no longer compiles.
4. **Forgetting to keep the JDK in sync between CI and runtime**: tests are green on 21 but production runs 17, or the other way round.
5. **Ignoring the license**: using Oracle JDK without reading the terms, until an audit finds it.

### One-minute spoken answer
"In production I run an LTS, currently 21 or 25, from one unified distribution such as Temurin or Corretto, pinned in the base image and patched quarterly. I do not use preview features in production because they can change and the class stays locked to that exact JDK release. I move to a new LTS in waves once Spring Boot and the agents support it, testing on a few services first, measuring GC and latency, then expanding."

> Senior tip: set up a Java "golden base image" owned by the platform team, along with a dashboard counting services per JDK version; that single chart is often enough to convince management to fund upgrade time. When you move to a new LTS, the most visible benefit is usually not syntax but better GC and performance on the same hardware.`,
    follow: ['Why can\'t a class compiled with --enable-preview run on another JDK?', 'How does javac --release differ from -source/-target?', 'How do you convince management to make time for LTS upgrades?']
  }
});
