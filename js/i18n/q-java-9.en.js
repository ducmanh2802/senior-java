(function () {
  'use strict';
  App.i18n.content({
    'modern-018': {
        q: 'The team uses Lombok {{@Data}}, {{@Value}}, and {{@Builder}} extensively, and someone proposed switching to {{record}}. For request/response DTOs, value objects (Money, Email), configuration classes, and JPA entities, would you choose record, Lombok, or manual classes? Why?',
        a: `**Summary:** {{record}} (Java 16) is the default choice for **immutable** data: DTOs, value objects, configuration classes ({{@ConfigurationProperties}}), and projections. Lombok {{@Value}} is similar to records but is an external library; {{@Data}} generates setters, creating mutable objects, which is only appropriate when frameworks require setters. Keep JPA entities as **plain classes** (some safe Lombok annotations like {{@Getter}} can be used), avoiding records and {{@Data}}. {{@Builder}} is still useful for objects with many optional fields.

### Quick understanding
Records are like pre-printed receipts: write once, readable by all, immutable, and equality is value-based. Lombok {{@Data}} is like a pencil-written draft: easy to modify, but mutable. Lombok is an "automatic printer" running at compile-time, while records are a built-in language feature.

### Terminology
- **Record**: A final class, {{private final}} fields, automatically generates constructor, accessors (e.g., {{name()}}), {{equals}}, {{hashCode}}, {{toString}}.
- **Lombok**: Annotation processor that intercepts the compilation process to generate code (getters, setters, builders...).
- **Value object**: An object identified by its value (two {{Money(100, VND)}} are identical), with no distinct identity.

### Comparison
| | record | Lombok @Value | Lombok @Data | Manual class |
|---|---|---|---|---|
| Immutable | yes | yes | no (has setters) | optional |
| External dependency | no | yes (Lombok + IDE plugin) | yes | no |
| Accessor | {{name()}} | {{getName()}} | {{getName()}}/{{setName()}} | optional |
| Class inheritance | no | no (final) | yes | yes |
| Builder | manual | {{@Builder}} | {{@Builder}} | manual |
| JPA entity | no | no | risky | recommended |

### Choosing by type (step-by-step)
1. **Request/response DTOs**: Use records. Jackson 2.12+ can map records, and Bean Validation annotations can be placed on components ({{record CreateOrder(@NotBlank String sku, @Positive int qty)}}).
2. **Value objects**: Records + compact constructor for validation and normalization. Why: Immutability makes value objects safe when used as Map keys or shared across threads.
3. **Configuration classes**: Records with {{@ConfigurationProperties}} (Spring Boot 3 binds via constructor), no setters needed.
4. **JPA entities**: Plain classes. JPA requires a no-arg constructor, non-final fields, and Hibernate creates proxies by extending the class; records are final, so they cannot be used. Avoid {{@Data}} on entities because {{equals}}/{{hashCode}} on all fields and {{toString}} trigger lazy relationships.

~~~java
// Value object using record: validate once, then it cannot be modified
public record Email(String value) {
    public Email {                                  // compact constructor
        Objects.requireNonNull(value, "email");
        value = value.strip().toLowerCase();        // normalize before field assignment
        if (!value.contains("@")) throw new IllegalArgumentException("invalid email");
    }
}
~~~

### Common pitfalls
1. **Records containing mutable {{List}}**: Records are only "shallowly" immutable; callers holding the original list can still modify it. Use {{List.copyOf}} in the compact constructor.
2. **Switching {{@Data}} to records breaks callers of {{getName()}}**: Record accessors are named {{name()}}; some older libraries (JSP EL, older BeanUtils) only understand JavaBean-style getters.
3. **Records with too many fields (15+)**: Long constructor, easy to pass arguments in the wrong order; split into sub-records or use a builder.
4. **Mixing Lombok {{@Data}} with inheritance**: Default generated {{equals}} does not call {{super.equals}}, causing warnings; it's easy to have two distinct objects considered equal.

### Interview answer (1 minute)
"I use records for immutable data: DTOs, value objects, and configuration. They are built into the language, have no Lombok dependency, are immutable, and have value-based equality. Lombok @Data creates mutable objects, so I only use it when frameworks require setters. I keep JPA entities as plain classes because they need no-arg constructors, non-final fields, and proxies; I don't use @Data on entities. I still use Lombok @Builder for objects with many optional fields."

> Senior tip: Don't convert from Lombok to records en masse in one PR; proceed module by module, starting with DTOs in new APIs. Lombok remains a compile-time dependency that must keep up with every JDK upgrade (older Lombok versions broke on Java 16+ due to strong encapsulation), so reducing its footprint makes upgrades easier.`,
        follow: ['Can records implement interfaces and have static factory methods?', 'Why does @Data on JPA entities cause StackOverflowError or LazyInitializationException?', 'How do you add a builder to a record without using Lombok?']
    },
    'modern-019': {
        q: 'The form registers a string that users paste with weird spaces, newlines, and you need to generate email content with a specific format. How do you use String APIs from Java 11 onwards ({{strip}}, {{isBlank}}, {{lines}}, {{repeat}}, {{formatted}}...), and how does {{strip()}} differ from {{trim()}}?',
        a: `**Summary:** {{trim()}} only removes characters with codes less than or equal to U+0020 (spaces and ASCII control characters), while {{strip()}} (Java 11) removes all characters that {{Character.isWhitespace}} considers whitespace, including Unicode spaces like U+3000 or U+2003. {{isBlank()}} checks if a string is empty or contains only whitespace, {{lines()}} splits lines into a Stream, {{repeat(n)}} repeats the string, and {{formatted(...)}} (Java 15) is a concise {{String.format}}. Note: neither {{strip}} nor {{trim}} remove the non-breaking space U+00A0.

### Quick understanding
Users copying from Word, Excel, or web often bring along "invisible spaces": they look like spaces but are different characters. {{trim()}} only recognizes old typewriter-style spaces; {{strip()}} recognizes Unicode-standard whitespace. It's like a guard who only recognizes old uniforms versus a guard who has an updated list of new uniforms.

### Terminology
- **Unicode Whitespace**: Whitespace characters other than regular spaces, e.g., em space (U+2003), ideographic space (U+3000).
- **NBSP (U+00A0)**: Non-breaking space, common when copying from HTML; {{Character.isWhitespace}} returns false for it.
- **Line terminator**: {{\\n}}, {{\\r}}, {{\\r\\n}}; {{lines()}} recognizes all three.

### Notable APIs
| API | Since | Use for |
|---|---|---|
| {{isBlank()}} | 11 | validating empty or whitespace-only input |
| {{strip()}}, {{stripLeading()}}, {{stripTrailing()}} | 11 | removing Unicode whitespace |
| {{lines()}} | 11 | splitting into a Stream, without creating a large array |
| {{repeat(n)}} | 11 | repeating strings (rules, padding) |
| {{indent(n)}}, {{transform(f)}} | 12 | indenting lines, applying functions to strings |
| {{formatted(...)}}, {{stripIndent()}} | 15 | concise formatting, processing text blocks |
| {{String.join}}, {{chars()}} | 8 | joining with delimiters, traversing characters |

### Step-by-step input handling
~~~java
String raw = "\\u3000 Nguyen Van A\\u00A0\\n";
raw.trim();        // U+3000 at the start remains (code > U+0020) and NBSP at the end
raw.strip();       // removes U+3000 and \\n, but NBSP remains
String name = raw.replace('\\u00A0', ' ').strip();   // handle NBSP first, then strip
if (name.isBlank()) throw new IllegalArgumentException("Name is empty");

long nonEmpty = csvText.lines().filter(l -> !l.isBlank()).count(); // count non-empty lines
String line = "-".repeat(40);
String body = "Hello %s, order %d has been shipped.".formatted(name, orderId);
~~~
1. {{replace('\\u00A0', ' ')}} replaces NBSP with a regular space. Why manually: {{strip}} is based on {{isWhitespace}}, which intentionally excludes non-breaking spaces.
2. {{strip()}} removes from both ends, while whitespace between words is preserved; to collapse multiple spaces, use {{replaceAll("\\\\s+", " ")}} (note that {{\\s}} defaults to matching ASCII).
3. {{lines()}} returns a lazy Stream, suitable for processing multi-line strings without {{split("\\n")}} creating an array.

### Common pitfalls
1. **Using {{trim()}} for data copied from Excel/web**: Comparisons of names or emails fail, creating duplicate records.
2. **Thinking {{strip()}} handles everything**: NBSP and zero-width spaces (U+200B) still pass through; they require separate normalization.
3. **Using {{isEmpty()}} instead of {{isBlank()}}**: Inputs like "   " pass validation.
4. **{{String.format}}/{{formatted}} in hot loops**: Slower than string concatenation because it must parse the pattern; use for logs/notifications, not for processing millions of lines.
5. **Locale dependency**: {{toLowerCase()}} without {{Locale.ROOT}} can produce different results on machines configured for Turkish (I).

### Interview answer (1 minute)
"Trim only removes characters up to U+0020; strip from Java 11 removes Unicode whitespace based on Character.isWhitespace, but neither removes NBSP, so I replace NBSP first. I use isBlank instead of isEmpty for validation. I use lines for splitting, repeat for lines, and formatted or text blocks for content generation. For user input, I normalize in one place before saving."

> Senior tip: Implement a shared normalization function (replace NBSP, zero-width, {{strip}}, Unicode {{Normalizer.normalize(s, Form.NFC)}} for Vietnamese) and call it at the data ingestion layer. Vietnamese text can be pre-composed (NFC) or decomposed (NFD, common when copying from macOS): two strings look identical but {{equals}} returns false, causing duplicate customer issues when searching by name.` ,
        follow: ['Why does Character.isWhitespace not consider NBSP as whitespace?', 'How do NFC and NFD differ, and how do they affect Vietnamese text search?', 'When should you use StringBuilder instead of formatted?']
    },
    'modern-020': {
        q: 'You need to calculate a "1 month later" due date, overdue days, and reminders for "same time tomorrow" for customers in multiple time zones. How do you use {{Period}}, {{Duration}}, and {{ChronoUnit}}? What are the traps with month-endings, DST, and {{YYYY}} formatting, and how do you test time-dependent code?',
        a: `**Summary:** {{Period}} measures time **by calendar** (years, months, days), {{Duration}} measures **exact time** (seconds, nanos). For adding a month, use {{plusMonths}}/{{Period}} (31/1 + 1 month = 29/2 in a leap year, automatically clamping to the last day of the month); for counting days, use {{ChronoUnit.DAYS.between}}. For "same time tomorrow" in DST-affected regions, use {{plusDays(1)}} on {{ZonedDateTime}}, not plus 24 hours. Use {{yyyy}} for formatting years, not {{YYYY}} (week-based year). Inject a {{Clock}} into constructors to test time-dependent code.

### Quick understanding
{{Period}} is like a wall calendar: "in 1 month" means flipping to the next month's page; if the month is short, it stops at the last day. {{Duration}} is like a stopwatch: exactly 86,400 seconds, regardless of whether it's a Daylight Saving time change day.

### Terminology
- **DST (Daylight Saving Time)**: Clocks set forward/backward 1 hour, creating days of 23 or 25 hours. Vietnam doesn't have DST, but customers in the US and Europe do.
- **ChronoUnit**: Time units ({{DAYS}}, {{MONTHS}}...), has {{between(a, b)}} to count full units.
- **Week-based year**: Year calculated according to ISO week; the last few days of December can belong to the "week year" following.

### Step-by-step mechanisms
~~~java
LocalDate.of(2024, 1, 31).plusMonths(1);   // 2024-02-29: clamps to the last day
LocalDate.of(2024, 1, 31).plusMonths(1).plusMonths(1); // 2024-03-29, NOT 31/3
LocalDate.of(2024, 1, 31).plusMonths(2);   // 2024-03-31

long overdue = ChronoUnit.DAYS.between(dueDate, today);   // full days

ZonedDateTime ny = ZonedDateTime.of(2024, 3, 9, 12, 0, 0, 0, ZoneId.of("America/New_York"));
ny.plusDays(1);                    // 2024-03-10T12:00-04:00: same time on the clock
ny.plus(Duration.ofHours(24));     // 2024-03-10T13:00-04:00: March 10th is only 23 hours long
~~~
1. {{plusMonths}} preserves the day if possible; if the target month doesn't have that day, it takes the last day. Therefore, adding a month twice differs from adding two months once; installment schedules must always be calculated from the **origin date** ({{start.plusMonths(i)}}), not cumulatively from the previous period.
2. {{plusDays}} on {{ZonedDateTime}} works on local time before adjusting for the new offset; {{plus(Duration)}} adds on the absolute timeline.
3. For deadlines calculated by time (token expires in 24h), use {{Instant.plus(Duration)}}, as it is absolute duration.

### Selection table
| Need | Use |
|---|---|
| N months/years (contracts, installments) | {{LocalDate.plusMonths}}, {{Period}} |
| Expires after N hours/minutes (tokens, OTPs) | {{Instant.plus(Duration)}} |
| Count days between two dates | {{ChronoUnit.DAYS.between}} |
| Reminders for customer's local time | {{ZonedDateTime.plusDays}} with customer's ZoneId |

### Common pitfalls
1. **{{YYYY}} in pattern**: {{DateTimeFormatter.ofPattern("YYYY-MM-dd")}} prints 30/12/2024 as "2025-12-30" because {{Y}} is the week-based year. Use {{yyyy}} (or {{uuuu}}).
2. **{{hh}} instead of {{HH}}**: {{hh}} is 1-12 hour format; without AM/PM, 14:00 becomes 02:00.
3. **Calling {{LocalDate.now()}} everywhere**: Dependent on server default timezone (container is usually UTC), impossible to fix for tests.
4. **Using static {{SimpleDateFormat}}**: Not thread-safe; {{DateTimeFormatter}} is immutable and thread-safe.
5. **{{Period.between(a, b).getDays()}} to get total days**: It only returns the "day" part after subtracting months (1 month and 3 days returns 3).

### Testing with Clock
~~~java
class DueService {
    private final Clock clock;                        // inject, don't call now() directly
    DueService(Clock clock) { this.clock = clock; }
    boolean isOverdue(LocalDate due) { return LocalDate.now(clock).isAfter(due); }
}
var fixed = Clock.fixed(Instant.parse("2024-12-31T17:30:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
new DueService(fixed).isOverdue(LocalDate.of(2024, 12, 31)); // true: in VN it is 1/1/2025
~~~

### Interview answer (1 minute)
"Period is for calendar-based intervals like months/years; Duration is for exact time like 24-hour tokens; for days between dates, I use ChronoUnit.DAYS.between. Adding months clamps to the last day, so installment schedules should always be calculated from the origin date. To remind customers at the same time tomorrow in their local timezone, I use plusDays on ZonedDateTime, as DST days can be 23 or 25 hours long. I use yyyy, not YYYY, and I inject a Clock for testing."

> Senior tip: {{YYYY}} bugs usually only manifest in the last week of December when the whole team is on holiday; add unit tests covering Dec 29-31 for all date-time patterns. In Spring, define a {{Clock}} bean ({{Clock.systemUTC()}}) and have services accept it via constructor; tests then just swap in {{Clock.fixed}}.`,
        follow: ['How do you correctly calculate installment schedules for the 31st of each month?', 'At which layer should Instant, LocalDateTime, and ZonedDateTime be used?', 'How does ZonedDateTime handle a local time that doesn\'t exist due to DST (e.g., 2:30 AM)?']
    },
    'modern-021': {
        q: 'You need to pass custom logic (checking, conversion, object creation) into a shared method. When should you use built-in {{Function}}, {{Predicate}}, {{Supplier}}, {{Consumer}}, {{UnaryOperator}}, when should you use primitives like {{IntPredicate}}, and how do you compose them using {{andThen}}, {{compose}}, {{Predicate.not}}? When should you define your own interfaces?',
        a: `**Summary:** The {{java.util.function}} package provides common functional "shapes": {{Function<T, R>}} (T in, R out), {{Predicate<T>}} (T in, boolean out), {{Supplier<T>}} (no input, T out), {{Consumer<T>}} (T in, no out), {{UnaryOperator<T>}}/{{BinaryOperator<T>}} (same input/output type). Primitives ({{IntPredicate}}, {{ToLongFunction}}...) avoid boxing in hot code. Compose functions with {{andThen}}/{{compose}}, compose predicates with {{and}}/{{or}}/{{negate}}/{{Predicate.not}} (Java 11). Define your own {{@FunctionalInterface}} when you need **business-domain-specific names**, need to throw checked exceptions, or have more than 2 parameters.

### Quick understanding
Functional interfaces are like standard electrical outlets: {{Predicate}} is the "outputs true/false" outlet, {{Supplier}} is the "outputs something, no input needed" outlet. Lambdas are the plugs. Using standard outlets ensures any plug fits, so you don't need to build a custom outlet for every device.

### Terminology
- **Functional interface**: Interface with exactly one abstract method; lambdas can implement it.
- **Boxing**: Converting {{int}} to {{Integer}} (object on the heap); occurs when using {{Function<Integer, Integer>}}.
- **Composition**: Combining small functions into a larger one without rewriting the logic.

### Selection table
| Shape | Interface | Example |
|---|---|---|
| T in, R out | {{Function<T, R>}} | {{Order::total}} |
| T in, boolean out | {{Predicate<T>}} | {{o -> o.paid()}} |
| No in, T out | {{Supplier<T>}} | {{() -> new ArrayList<>()}} |
| T in, no out | {{Consumer<T>}} | {{log::info}} |
| T, U in, R out | {{BiFunction<T, U, R>}} | {{(a, b) -> a.add(b)}} |
| T in, T out | {{UnaryOperator<T>}} | {{String::strip}} |
| int in, boolean out | {{IntPredicate}} | {{n -> n > 0}} (no boxing) |

### Step-by-step composition
~~~java
Function<String, String> clean = String::strip;
Function<String, String> lower = s -> s.toLowerCase(Locale.ROOT);
Function<String, String> normalize = clean.andThen(lower);  // strip then lower
// compose reverses order: lower.compose(clean) also strips then lowers

Predicate<Order> paid = Order::paid;
Predicate<Order> bigPaid = paid.and(o -> o.totalCents() > 10_000_000);
List<String> nonBlank = names.stream()
        .filter(Predicate.not(String::isBlank))   // cleaner than s -> !s.isBlank()
        .toList();

// Supplier: only create value when truly needed (lazy)
String v = cache.getOrDefault(key, null);
String r = Optional.ofNullable(v).orElseGet(() -> loadFromDb(key));
~~~
1. {{f.andThen(g)}} means "run f, take result to g"; {{f.compose(g)}} runs g first then f. Remember: swapping order in "validate then encrypt" can be catastrophic.
2. {{Predicate.not(String::isBlank)}} exists because method references can't be written as {{!String::isBlank}}.
3. {{Supplier}} defers calculation: {{orElseGet(supplier)}} only calls the DB when there's no value, unlike {{orElse(loadFromDb(key))}} which always calls it.

### When to define custom interfaces
~~~java
@FunctionalInterface
interface FeeCalculator {                  // business name is clearer than BiFunction<Order, Customer, BigDecimal>
    BigDecimal fee(Order order, Customer customer);
}
~~~
- Names convey meaning, support Javadoc, and provide better IDE suggestions.
- Need to throw checked exceptions (standard interfaces don't declare {{throws}}).
- Need more than 2 parameters (JDK doesn't have {{TriFunction}}).

### Common pitfalls
1. **{{Function<Integer, Integer>}} in tight loops (millions of times)**: Boxing creates garbage; use {{IntUnaryOperator}}.
2. **Method signatures with {{BiFunction<Map<String, Object>, List<Long>, Optional<Result>>}}**: Unreadable; create a named interface.
3. **Stateful Lambdas** (counting calls): Hard to test, fails when running in parallel.
4. **Incorrect {{andThen}}/{{compose}} order**.

### Interview answer (1 minute)
"I choose based on the shape: Function for transformations, Predicate for conditions, Supplier for lazy creation, Consumer for actions, and UnaryOperator when input/output types match. I use primitive versions in hot code to avoid boxing. I compose using andThen, compose, and, or, and Predicate.not. When generic signatures get too long, checked exceptions are required, or there are many parameters, I define my own @FunctionalInterface with a business-meaningful name."

> Senior tip: In business logic code, named interfaces like {{FeeCalculator}}, {{DiscountRule}} make the code immediately readable and easy to turn into Spring beans (one class per rule) as logic grows. JDK's standard interfaces are best suited for utility layers and stream pipelines.` ,
        follow: ['Why doesn\'t the JDK have TriFunction?', 'Are lambdas and method references different in terms of performance?', 'How can you convert rules written as Predicates into configuration?']
    },
    'modern-022': {
        q: 'You have many payment methods (cards, wallets, transfers). When do you place logic in overridden methods in each class (polymorphism), and when do you use sealed interface + record + {{switch}} pattern matching (Java 21) externally? What are the trade-offs when adding new types versus new operations?',
        a: `**Summary:** This is the classic "adding types vs. adding operations" problem. **Polymorphism** (each class defines its own methods) makes **adding new types** easy (add a class, don't modify old code), but every time you **add an operation**, you must modify all classes. **Sealed + switch pattern matching** is the opposite: adding an operation is just writing a new method with a {{switch}}, while adding a new type forces the compiler to point out every {{switch}} that needs updating. Choose polymorphism for behavior tightly coupled to the object and open type sets; choose sealed + switch when the type set is **closed, stable**, and there are multiple operations located in different layers (pricing, display, reporting, mapping).

### Quick understanding
Polymorphism is like employees doing their own work: it's easy to hire new staff, but adding a new type of work requires retraining everyone. Sealed + switch is like a posted chore chart: adding a new task just requires adding a row; hiring new staff means every chart must have a new line, and the compiler is the manager checking that nothing is missed.

### Terminology
- **Sealed interface**: Interface allowing only a specific list of implementing classes ({{permits}}), since Java 17.
- **Pattern matching for switch**: {{switch}} by type and extracting data into variables, officially since Java 21 (JEP 441).
- **Exhaustive**: Switch covers all cases; with sealed types, the compiler verifies this, eliminating the need for {{default}}.

### Two approaches
~~~java
// Approach 1: Polymorphism
interface Payment { BigDecimal fee(); }
record Card(BigDecimal amount) implements Payment {
    public BigDecimal fee() { return amount.multiply(new BigDecimal("0.02")); }
}
// Approach 2: Sealed + record + switch (Java 21)
sealed interface Pay permits CardPay, WalletPay, BankPay {}
record CardPay(BigDecimal amount, String bin) implements Pay {}
record WalletPay(BigDecimal amount, String provider) implements Pay {}
record BankPay(BigDecimal amount) implements Pay {}

static BigDecimal fee(Pay p) {
    return switch (p) {                    // no default: missing case is a compile error
        case CardPay c   -> c.amount().multiply(new BigDecimal("0.02"));
        case WalletPay w when w.provider().equals("MOMO") -> BigDecimal.ZERO;
        case WalletPay w -> new BigDecimal("1000");
        case BankPay b   -> new BigDecimal("3300");
    };
}
~~~

### Trade-offs (step-by-step as system grows)
1. **Adding "Installments" type**: Polymorphism only requires a new class. Sealed: add to {{permits}}, and the compiler reports errors in all {{switch}} statements missing the new case. This is a benefit: you cannot forget to update pricing or reporting logic.
2. **Adding "Export audit" operation**: Polymorphism requires adding a method to the interface and modifying every class (and forces domain classes to depend on the reporting layer). Sealed: write a new method in the reporting module; domain records remain unchanged.
3. **Third-party plugin adds type**: Only polymorphism can do this; sealed forbids external classes.

| Criterion | Polymorphism | Sealed + switch |
|---|---|---|
| Adding new type | easy, no change to old code | must modify all switch statements (compiler-enforced) |
| Adding new operation | modify all classes | add a method |
| Type set | open, supports plugins | closed, stable |
| Data and behavior | packaged together | separated: record is data, logic is where it's used |

### Common pitfalls
1. **Adding {{default}} to switch on sealed type**: Loses exhaustive checking; new types slip into the default branch silently.
2. **Incorrect case order**: A general case ({{case WalletPay w}}) placed before a specific guard case for the same type causes a compile error, as the latter is unreachable.
3. **Using switch-by-type on open type sets (unsealed class)**: Requires {{default}}, losing the main benefit.
4. **Scattered identical switch statements**: If logic is duplicated in 10 places, it's a sign that it should be a method of the type itself.

### Interview answer (1 minute)
"Polymorphism makes it easy to add new types but harder to add operations. Sealed types with switch (Java 21) are the opposite: adding an operation is just a new method, and adding a type is guided by compiler errors thanks to exhaustive checking. For closed type sets like payment methods, statuses, or result types that multiple layers need to handle differently, I choose sealed; for open type sets with plugins, I choose polymorphism. And I never put a default branch on switch statements for sealed types."

> Senior tip: The two approaches aren't mutually exclusive. I keep core, immutable domain behavior in methods on the type (e.g., {{amount()}}), while "cross-cutting" operations like DTO mapping, UI display, or reporting are written using switch statements in those respective layers. Remember that sealed types are only valuable when all modules are recompiled together; for API contracts between services, you still need to handle unknown values at runtime.` ,
        follow: ['Why should you not put a default branch in a switch statement on sealed interfaces?', 'Can sealed interfaces be used across module/library boundaries?', 'Is the Visitor pattern still necessary with Java 21?']
    },
    'modern-023': {
        q: 'In streams, you call a method throwing checked exceptions ({{Files.readString}}, calling API returning {{IOException}}) and the code doesn\'t compile. How do you handle it: wrap in unchecked, sneaky throw, or aggregate into a result type? When processing 10,000 files where a few fail, what should you do?',
        a: `**Summary:** Standard functional interfaces ({{Function}}, {{Consumer}}...) do not declare {{throws}}, so lambdas cannot throw checked exceptions. There are three approaches: (1) **wrap into unchecked** ({{UncheckedIOException}}) when one error means stopping the entire batch; (2) **convert error into data** (a record representing success/failure) when you need to process remaining elements and report failed ones; (3) **return to a for-loop** when error logic is complex. Avoid "sneaky throws" because they deceive the compiler, and callers won't know which exceptions they need to catch.

### Quick understanding
Streams are like a conveyor belt for packaging: if a box is damaged, there are two policies. "Stop the whole line" (throwing an exception) is appropriate when a damaged box means the whole batch is suspect. "Label the error and let the box pass" (error as data) is appropriate when you want to package all good boxes and gather damaged ones in a separate bin for later inspection.

### Terminology
- **Checked exception**: Exception the compiler forces you to declare or catch ({{IOException}}, {{SQLException}}).
- **UncheckedIOException**: Pre-existing unchecked class since Java 8 to wrap {{IOException}}.
- **Sneaky throw**: A trick using generics to throw checked exceptions without the compiler knowing.

### Approach 1: wrap unchecked (fail fast)
~~~java
List<String> contents = paths.stream()
        .map(p -> {
            try {
                return Files.readString(p);
            } catch (IOException e) {
                throw new UncheckedIOException("Cannot read " + p, e); // keep cause and filename
            }
        })
        .toList();
~~~
Step-by-step: A failed element throws an exception, the stream stops immediately, and subsequent elements aren't processed. Why it's reasonable: e.g., loading config files; if one is missing, the application shouldn't start.

### Approach 2: error as data (continue processing)
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
// parts.get(true): process; parts.get(false): report, retry, send alert
~~~
For 10,000 files with a few failures: use this approach, process the 9,99x good files, export a list of errors with reasons, and set a threshold (e.g., > 1% failure means job FAILED) to avoid ignoring major outages.

### Comparison
| Approach | Pros | Cons | Use when |
|---|---|---|---|
| Wrap unchecked | simple, preserves stack trace | stops the whole batch | one error = batch is bad |
| Error as data | handles remainder, has reports | adds data types | batch, import, reconciliation |
| For-loop + try/catch | clear, retry, continue support | more verbose | complex error logic |
| Sneaky throw | short | caller doesn't know what to catch | almost never |

### Common pitfalls
1. **Swallowing errors**: catching {{IOException}} then {{return null}}, followed by {{filter(Objects::nonNull)}}: data is lost without anyone knowing.
2. **Wrapping but losing the cause**: {{new RuntimeException(e.getMessage())}} destroys the original stack trace; always pass {{e}} as the cause.
3. **Catching exceptions outside the stream expecting partial results**: when the stream throws, {{toList()}} results don't exist; already-run side-effects are incomplete.
4. **Parallel stream + exception**: other elements might still be running or have already run when the exception surfaces; don't assume "nothing happened."

### Interview answer (1 minute)
"Function and Consumer don't declare throws, so lambdas can't throw checked exceptions. If one error means stopping the batch, I wrap it in UncheckedIOException and keep the cause. For batch processing of many files, I convert errors into data using Ok/Failed records, use partitioningBy to handle the good part and report the bad part, with a failure threshold. I use for-loops for complex logic involving retries. I avoid sneaky throws."

> Senior tip: In real import jobs, "error as data" also facilitates idempotency and retries: store the {{Failed}} list in a database or file, and next time only process those elements instead of re-running all 10,000 files. Set up metrics on error counts by type to detect when a partner changes file formats.` ,
        follow: ['Why is sneaky throw considered dangerous?', 'How are exceptions thrown in parallel streams?', 'How do you design retries for failed elements in a batch?']
    },
    'modern-024': {
        q: 'As a tech lead, you set the Java version policy for 20+ services: which JDK to run (LTS or 6-month release), which distribution (Temurin, Corretto, Oracle...), whether to allow preview features, and the upgrade cadence?',
        a: `**Summary:** Java releases a new version every 6 months (since Java 10, 2018), and every 2 years there is an **LTS** release (17 in 2021, 21 in 2023, 25 in 2025). Production should run **LTS** from an OpenJDK distribution with a commitment to security updates (Eclipse Temurin, Amazon Corretto, Microsoft Build of OpenJDK, Azul Zulu, or Oracle JDK if Oracle license terms are accepted). **Do not use preview features** in production code because they can change or be dropped, and classes compiled with preview features only run on that exact JDK release. Upgrade cadence: apply patches quarterly, move to a new LTS within 6-12 months of release once major frameworks support it.

### Quick understanding
LTS is like a car model guaranteed for many years by the manufacturer; 6-month releases are like display cars, only serviced until the next model comes out. Preview features are like "experimental" features on display cars: great for testing, but don't use them to transport real passengers.

### Terminology
- **LTS (Long-Term Support)**: Releases with multi-year security and fix support from the vendor.
- **Distribution**: OpenJDK builds packaged and fixed by a provider; source code is nearly identical, differ in support duration, license, and paid support channels.
- **Preview feature**: Language/API feature that is complete but not finalized, requires {{--enable-preview}} for both compilation and runtime.
- **CPU (Critical Patch Update)**: Quarterly security patch cycle (January, April, July, October).

### Proposed policy (step-by-step)
1. **Standardize on a target LTS** for all services (e.g., 21), with a list of exceptions with expiration dates. Why: one base image, one set of GC tuning, one patching process.
2. **Choose a distribution** and use it consistently across Docker base images, CI, and dev machines. AWS deployments usually choose Corretto; neutral environments choose Temurin. Clearly document reasons if using Oracle JDK for license compliance.
3. **Patch quarterly**: Base images rebuild when new patches arrive (e.g., 21.0.x), pipelines run tests and roll out incrementally. Why: TLS/crypto vulnerabilities in the JDK are real; slow patching is a risk.
4. **Upgrade to new LTS in waves**: Wait for Spring Boot, Hibernate, APM agents, and build tools to support it officially; test on 1-2 low-risk services, measure GC and latency, then expand. You can build with a new JDK while keeping {{--release}} old during the transition.
5. **Preview**: Allowed in spikes, internal tools, test code; forbidden in production code via build checks (no {{--enable-preview}} in configuration).

~~~bash
# Check JDK running in container (vendor, version)
java -XshowSettings:properties -version 2>&1 | grep -E "java.vendor|java.version"
# Compile targeting LTS regardless of JDK used to build
javac --release 21 -d out $(find src -name "*.java")
~~~

### Comparison table
| Choice | Benefit | Risk |
|---|---|---|
| LTS only | stable, ecosystem support | slow to get new features |
| 6-month releases | features, GC improvements | must upgrade every 6 months, support ends quickly |
| Use preview | test new features | API changes, locked to specific JDK |
| Multiple vendors | team choice | difficult to patch uniformly, hard to reproduce bugs |

### Common pitfalls
1. **Each service has a different JDK, different vendor**: Patching is not synchronized, bugs are only reproducible on one machine.
2. **Image using moving tags ({{latest}})**: Rebuilding tomorrow produces a different JDK, GC or TLS behavior changes without anyone knowing. Pin versions, update intentionally.
3. **Enabling preview "for fun" in production services**: Next JDK upgrade, code doesn't compile.
4. **Not synchronizing JDK in CI and runtime**: Tests pass on 21 but production runs on 17, or vice-versa.
5. **Ignoring license**: Using Oracle JDK without reading terms until audit discovery.

### Interview answer (1 minute)
"In production, I run LTS, currently 21 or 25, from a unified distribution like Temurin or Corretto, pinned in the base image and patched quarterly. I don't use preview features in production because they might change and lock the class to that specific JDK version. I move to a new LTS in waves after Spring Boot and agents support it, testing on a few services first, measuring GC and latency, then expanding."

> Senior tip: Set up a "golden base image" for Java owned by the platform team, along with a dashboard counting services by JDK version; that chart alone is enough to convince management to spend time on upgrades. When moving to a new LTS, the most visible benefit is often not syntax but better GC and performance on the same hardware.` ,
        follow: ['Why can\'t classes compiled with --enable-preview run on other JDKs?', 'How does javac --release differ from -source/-target?', 'How do you convince management to dedicate time for LTS upgrades?']
    }
  });
})();
