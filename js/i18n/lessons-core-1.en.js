/*
 * English translation of js/data/lessons-core.js — task T266. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-001 lesson-core-002 lesson-core-003 lesson-core-004 lesson-core-005
 */
App.i18n.content({
  'lesson-core-001': {
    title: `Exceptions: error boundaries, resources and suppressed exceptions`,
    goals: [
      'Choose checked or unchecked exceptions based on whether the caller can actually handle them',
      'Explain the close order and suppressed exceptions of try-with-resources',
      'Design business exceptions that preserve the original cause'
    ],
    body: `**Summary:** A checked exception forces the caller to declare or handle it; an unchecked exception usually represents a precondition violation or an error that cannot be recovered at the current layer. {{try-with-resources}} closes resources in reverse order of opening and keeps close failures in {{getSuppressed()}} when the block body has already thrown.

### How exceptions travel through layers
When a {{throw}} statement runs, the JVM stops normal execution at that point, finds the nearest stack frame with a matching {{catch}}, and unwinds the frames in between. If no frame catches it, the exception reaches the uncaught handler and usually terminates the thread. That is why catching too broadly and only logging destroys the error signal: the upper layer believes the business operation succeeded while the data was never written.

A checked exception extends {{Exception}} but not {{RuntimeException}}. The compiler requires either a {{throws}} declaration or a catch, which fits when the caller has a real recovery option, for example asking the user to choose another file. Unchecked fits contract-violating input, broken programming state, or errors a middleware should handle. Do not choose by taste alone: ask whether the caller has any useful action to take.

| Kind | Compiler forces handling | Typical situation | Risk |
|---|---|---|---|
| Checked | Yes | Library API where the caller decides on recovery | Signature leaks through many layers |
| Unchecked | No | validation, invariant, persistence failures | Silently dropped if the boundary does not log/translate |

In Spring, an unchecked exception escaping a transaction usually causes a rollback by default; a checked exception does not roll back by default unless you configure {{rollbackFor}}. Do not wrap a database failure as checked just to "satisfy the declaration" and then accidentally commit a half-finished state.

### try-with-resources and close order
A resource must implement {{AutoCloseable}}. The try block holds references to the resources it opened; when leaving the block, whether by return or throw, Java calls {{close()}} in reverse declaration order. This matters when a reader depends on a stream: if you open the stream and then the reader, the reader must close first.

~~~java
try (Resource outer = open("outer"); Resource inner = open("inner")) {
    work(); // if it throws, inner is still closed, then outer
}
~~~

If {{work()}} throws primary exception A and {{inner.close()}} throws B, Java still tries to close outer; exception A is thrown, and B plus any outer-close failure are attached as suppressed. If the body throws nothing but close does, the first close failure becomes the primary exception. Walk {{getSuppressed()}} when diagnosing cleanup failures; logging only the primary exception can hide a leaked file handle or a failed flush.

### Designing business exceptions
Use a context-revealing name such as {{InsufficientFundsException}} instead of a generic {{Exception}}. You can carry a stable error code for the API and keep the cause for investigation:

~~~java
throw new PaymentException("PAYMENT_DECLINED", "Could not process payment", cause);
~~~

Never put PAN, tokens, or sensitive data in the message. Translate exceptions at layer boundaries (driver → repository/domain → HTTP) without losing the cause. Avoid catching and returning null: the caller cannot tell "no data" from "query failed".

### Production pitfalls
- Retrying every exception: validation failures get resent too, and a timeout after the server has already written can create a duplicate transaction. Retry only transient failures and use an idempotency key.
- Closing manually in finally: an exception from close can mask the original exception; try-with-resources already encodes this rule.
- Catching {{InterruptedException}} and dropping the interrupt flag: restore it with {{Thread.currentThread().interrupt()}} if you cannot propagate it.
- Turning every failure into HTTP 500: business errors need a stable status/code, while internal errors must not leak a stack trace to the client.

### Interview notes
Be ready to describe a time a cleanup failure hid the root cause, explain why resources close in reverse order, and state exactly how a checked exception affects Spring rollback.`,
    exercises: [{
      title: 'Close resources in order and preserve suppressed exceptions',
      prompt: `Implement {{Resource}} and {{run()}}. {{run()}} opens A then B and calls {{work()}}. Even on failure B must close before A. When work throws, that is the primary failure; close failures must appear in {{getSuppressed()}}.`,
      hints: [
        'Declare A then B in the same resource specification; Java closes them in reverse order.',
        'To observe suppressed exceptions, the block body must throw the primary failure and both closes must throw as well.'
      ],
      explain: `The compiler expands this into logic equivalent to nested finally blocks. That is why every initialized resource is closed, even when a later resource initialization or the block body fails. An exception from the body is preferred as the primary failure; close exceptions are appended to the suppressed array in close order. When the body succeeds, the first close failure becomes the thrown exception and later close failures are suppressed onto it.`
    }],
    check: [
      { q: 'Pick the correct Java rule.', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This option follows the mechanism described above.' },
      { q: 'Which choice avoids the production pitfall?', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This choice preserves the stated invariant.' }
    ]
  },
  'lesson-core-002': {
    title: `Generics and PECS: compile-time-safe variance`,
    goals: [
      'Explain Java generic invariance',
      'Use extends for producers and super for consumers',
      'Write a max API with a contravariant Comparator'
    ],
    body: `**Summary:** Java generics are invariant: {{List<Integer>}} is not a {{List<Number>}}, because if it were allowed we could insert a Double into a list of Integers. The PECS rule is Producer Extends, Consumer Super: a read-only source uses {{? extends T}}, a write-only destination uses {{? super T}}.

### Why wildcards exist
Java arrays are covariant: an {{Integer[]}} can be assigned to a {{Number[]}}, but writing a Double then throws {{ArrayStoreException}} at runtime. Generics chose invariance and check most type errors at compile time to avoid this class of bug. Wildcards let you express read-only or write-only relationships while staying safe.

{{List<? extends Number>}} may point to a List<Integer> or a List<Double>. When reading, the compiler only knows the value is a Number; when writing, it does not know which concrete subtype is accepted, so only {{null}} is allowed. {{List<? super Integer>}} may be a List<Integer>, List<Number>, or List<Object>; writing an Integer is safe because every destination type can hold an Integer. When reading, the only guaranteed type is Object.

| Declaration | Safe to read as | Safe to write | Meaning |
|---|---|---|---|
| {{List<T>}} | T | T | reads and writes the same type |
| {{List<? extends T>}} | T | almost nothing | producer |
| {{List<? super T>}} | Object | T | consumer |

### Capture and limitations
A wildcard is a hidden type that the compiler captures per call. That is why {{dst.add(src.get(i))}} inside a copy method is valid when both sides are bound by the same T: the read value can be converted to T, and T can always be written into a super-T destination.

~~~java
static <T> void copy(List<? super T> dst, List<? extends T> src) {
    for (T value : src) dst.add(value); // one T links both sides
}
~~~

You do not need a wildcard on every parameter. If a method both reads from and writes to the same collection, {{List<T>}} is clearer. Type erasure removes generic parameters at runtime: most {{List<String>}} and {{List<Integer>}} share the same runtime class, {{ArrayList}}. You cannot write {{value instanceof List<String>}}; use a wildcard and check elements, or design a type-safe data model.

### Comparator<? super T>
A comparator of Object can compare any T, so max takes {{Comparator<? super T>}}. The Collection is a producer, so it uses {{Collection<? extends T>}}. The algorithm makes a single pass and keeps the best element so far; if the comparator returns a positive number for candidate versus best, replace best. Complexity is O(n) time and O(1) memory.

### Production pitfalls
- An API taking {{List<Object>}} prevents clients from passing a List<String>; use {{List<?>}} for read-only access, or the appropriate wildcard.
- Casting a raw type removes checking and makes the failure appear far from where the data was written. Do not use raw collections to "dodge" generics.
- {{? extends T}} does not mean every subtype is valid to write; only null is guaranteed compatible.
- You cannot create {{new T[]}} because of erasure; use a collection or accept a {{Class<T>}}/factory instead.
- A Comparator inconsistent with equals can make TreeSet drop the wrong elements; choose the comparator on the identity that matters.

### Interview notes
Explain why {{List<Integer>}} cannot be assigned to {{List<Number>}}, then fix copy and max APIs without casts. State clearly what type can be read and what type can be written for each wildcard.`,
    exercises: [{
      title: 'Copy and max without casts',
      prompt: `Complete {{Ops.copy}} and {{Ops.max}} using PECS. {{max}} returns {{Optional.empty()}} for an empty collection and returns the first element on a comparator tie.`,
      hints: [
        'The destination consumes T so it uses super; the source produces T so it uses extends.',
        'Initialize best from the first element instead of a sentinel value so every type T works.'
      ],
      explain: `Both methods use a generic method so the same T links the two sides. The Comparator only consumes two T values, so it takes Comparator<? super T>; that way a Comparator<Object> still works when finding the max of Strings. Initializing from the first element avoids assuming T has a smallest value.`
    }],
    check: [
      { q: 'Pick the correct Java rule.', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This option follows the mechanism described above.' },
      { q: 'Which choice avoids the production pitfall?', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This choice preserves the stated invariant.' }
    ]
  },
  'lesson-core-003': {
    title: `Immutable objects and defensive copying`,
    goals: [
      'Spot aliasing through mutable references',
      'Design immutable Money and Transfer values',
      'Distinguish an unmodifiable view from a snapshot'
    ],
    body: `**Summary:** An immutable object does not change its observable state after creation. To achieve that, use private final fields, expose no setters, validate at construction time, and copy mutable data both on the way in and on the way out.

### A reference is not a copy
When you assign an object to a field, Java copies the reference value, not the object. If the constructor keeps the {{Date}} or {{List}} as-is, the caller still has another path to mutate the internal state. This is aliasing: several variables point to the same mutable object.

~~~java
Date input = new Date();
Transfer t = new Transfer(input); // if the reference is kept, input.setTime(...) mutates t
~~~

{{final}} only forbids reassigning the field variable; it does not make the referenced object immutable. That is why a {{final List<String>}} can still be {{add}}ed to. Defensive copying on input breaks the inbound alias; return a snapshot or immutable value on read so you create no outbound alias.

| How it is returned | Can the caller mutate? | Does it track source changes? |
|---|---|---|
| Return the original list | Yes | Yes |
| {{Collections.unmodifiableList(list)}} | Not through this view | Yes, because it is still a view |
| {{List.copyOf(list)}} | No | No, structural snapshot |

{{List.copyOf}} is a shallow copy: if the elements are mutable objects, the elements themselves are still shared. Choose immutable elements or deep-copy according to the domain.

### Rules for building immutables
1. Make the class {{final}} so subclasses cannot add mutable state.
2. Use {{private final}} fields; validate invariants in the constructor.
3. Primitives, String, enums, and immutable value types can be stored directly.
4. Clone/copy mutable input and on return.
5. Do not publish {{this}} from the constructor before initialization completes.

For {{Money}}, store amount and currency, and never use double because binary representation cannot exactly represent many decimal fractions. For {{Transfer}}, snapshot the creation date and the list of line items. An immutable object is easy to share across threads because there are no competing writes; however, immutability does not by itself make external dependencies or caches thread-safe.

Records generate accessors that return the field directly. A record holding a List still needs {{List.copyOf}} in its compact constructor; "record" does not imply deep immutability.

### Production pitfalls
- Hibernate entities are usually mutable and carry lifecycle proxies; do not turn an entity into an immutable value object merely by making the class final. Convert to an immutable DTO/domain snapshot at the boundary.
- {{unmodifiableList}} does not protect against changes through the original list; it fits when you need a controlled live view.
- Defensive copying costs O(n) time/memory. For large collections, consider persistent collections or an explicit ownership transfer, but do not claim immutability if the caller still holds an alias.
- Date/time: prefer {{Instant}}/{{LocalDate}} over {{Date}}; they are immutable.
- Immutability does not replace authorization checks, validation, or the atomicity of multi-object operations.

### Interview notes
Trace the reference path input → constructor → getter, point out every place where the caller can mutate the object, then explain shallow copying and a record with a nested list.`,
    exercises: [{
      title: 'Create an immutable Transfer snapshot',
      prompt: `Fix {{Transfer}} so neither the date nor the list can be changed through the constructor or the getters. The items are Strings, so a shallow snapshot is enough.`,
      hints: [
        'Date is mutable: copy the millis in the constructor and create a new Date in the accessor.',
        'List.copyOf creates an immutable structural snapshot; here the String elements are immutable.'
      ],
      explain: `The tests deliberately mutate both the input and the accessor result to find leaks in both directions. Copying only in the constructor is not enough if the getter returns the internal Date. List.copyOf blocks structural modification and detaches from the input list; it does not deep-copy arbitrary elements.`
    }],
    check: [
      { q: 'Pick the correct Java rule.', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This option follows the mechanism described above.' },
      { q: 'Which choice avoids the production pitfall?', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This choice preserves the stated invariant.' }
    ]
  },
  'lesson-core-004': {
    title: `BigDecimal for money: scale, rounding and exact allocation`,
    goals: [
      'Construct BigDecimal without losing precision',
      'Distinguish equals from compareTo',
      'Allocate the remainder so the total matches'
    ],
    body: `**Summary:** Use {{BigDecimal}} from a String or from the smallest unit, and define scale and {{RoundingMode}} explicitly at business boundaries. {{equals}} compares both value and scale; {{compareTo}} compares numeric value. When splitting money into installments, rounding each part creates a remainder, so you need a deterministic rule to allocate it.

### Why not use double
{{double}} stores binary floating-point numbers; 0.1 has no finite binary representation, so addition can produce an approximate result. {{new BigDecimal(0.1)}} preserves exactly that incorrect binary value. {{new BigDecimal("0.1")}} produces the intended decimal.

A BigDecimal consists of an unscaled integer and a scale: 123.45 has unscaled 12345 and scale 2. Scale represents the decimal point position, not a currency claim. Do not add USD and VND just because both are BigDecimal; currency must travel with the value object and with the business scale rules.

| API | Compares | Example |
|---|---|---|
| {{equals}} | value and scale | 2.0 differs from 2.00 |
| {{compareTo}} | numeric value | 2.0 equals 2.00 |
| {{setScale}} | explicit scale/rounding | may throw if rounding is needed but not specified |

### Rounding and allocation
Dividing {{10.00 / 3}} with scale 2 and HALF_UP gives 3.33; multiplying back across three installments yields only 9.99. If the contract requires the total to match exactly, allocate the remaining 0.01 to one installment in a stable order: 3.34, 3.33, 3.33. This keeps every installment at scale 2 and the total at 10.00.

~~~java
BigDecimal amount = new BigDecimal("10.00"); // does not go through double
BigDecimal rounded = amount.divide(BigDecimal.valueOf(3), 2, RoundingMode.DOWN);
~~~

RoundingMode is a business policy: HALF_UP is common but not the right default for every tax/interest case; HALF_EVEN reduces cumulative bias in some statistics. Do not use a vague {{MathContext}} in place of a concrete money scale.

### Persistence and production rules
- The database {{DECIMAL(p,s)}} must have enough precision/scale for the maximum value; check for overflow before writing.
- JPA/Hibernate maps BigDecimal to decimal, but schema migrations must match precision/scale. Reading back may keep whatever scale the database/driver returns; do not use equals to compare money if the business only cares about the numeric value.
- Define rounding at exactly one boundary. Rounding each line versus only the total can produce different results; document the rule in the business spec and in the audit trail.
- Do not use {{stripTrailingZeros}} for direct formatting: it can produce a negative scale such as 1E+3. Format by currency in the presentation layer.
- For allocation, define who receives the remainder and a stable tie-break so reruns produce the same result.

### Interview notes
Walk through the 10.00 split three ways, explain why 3.33 × 3 is off, then describe an auditable allocation rule. Distinguish a money comparator from BigDecimal equals.`,
    exercises: [{
      title: 'Split a fee into installments and allocate the remainder',
      prompt: `Implement {{Fees.split(BigDecimal total,int n)}} returning a list of n parts at scale 2. Split by cents: the leading installments receive at most one extra cent each; the total must equal total exactly. Reject n <= 0 and a negative total.`,
      hints: [
        'Convert the scale-2 amount into an integer number of cents; divide to get quotient and remainder.',
        'Give the extra cents to the leading installments so the order is always deterministic.'
      ],
      explain: `Dividing BigDecimal directly requires choosing scale and rounding; the remainder makes the sum of installments differ from the original total. Converting to integer cents turns the problem into integer division: each installment gets the quotient in cents, and the first remainder installments get one extra cent. Enforce scale 2 with UNNECESSARY so the input is never silently rounded.`
    }],
    check: [
      { q: 'Pick the correct Java rule.', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This option follows the mechanism described above.' },
      { q: 'Which choice avoids the production pitfall?', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This choice preserves the stated invariant.' }
    ]
  },
  'lesson-core-005': {
    title: `String, StringBuilder and the string pool`,
    goals: [
      'Explain String immutability and the string pool',
      'Choose StringBuilder for repeated concatenation',
      'Normalize and mask identity data safely'
    ],
    body: `**Summary:** {{String}} is immutable, so it can be shared safely and used as a key; repeated concatenation in a loop can create many intermediate objects, so use {{StringBuilder}}. The string pool canonicalizes some literals; compare content with {{equals}}, never rely on identity or call {{intern}} casually.

### String and the pool
A String stores content that never changes after creation. {{concat}} does not modify the old string but returns a new one; this keeps the hash cache, sharing, and key usage stable. A literal such as {{"java"}} is placed in the pool; the compiler may fold constant literals. {{new String("java")}} creates a separate object even though the content is equal.

~~~java
String a = "java", b = new String("java");
boolean sameText = a.equals(b); // true
boolean sameObject = a == b;    // false
~~~

{{==}} on references checks whether they are the same object, not whether they hold the same characters. {{intern()}} requests the canonical string from the pool, but keeping strings in the pool has a cost and is usually unnecessary in applications. Use it only after measuring cardinality and the memory benefit.

### The cost of concatenation
Inside a loop, {{result += part}} creates a new string each time because String is immutable; the total number of copied characters can grow quadratically as the result grows incrementally. {{StringBuilder}} keeps a mutable buffer, expands it as needed, then creates the final String via {{toString}}. The Java compiler optimizes simple concatenation within a single expression, but it cannot fold arbitrary concatenation across loop iterations.

| Approach | Use when | Note |
|---|---|---|
| {{+}} | short, readable expressions | the compiler usually optimizes it |
| {{StringBuilder}} | repeated concatenation in one thread | not thread-safe |
| {{StringBuffer}} | legacy API needing per-operation synchronization | synchronization does not make a whole business operation atomic |

### Normalization and masking
Define normalization per domain: card numbers may drop spaces/hyphens but must not drop arbitrary characters; account numbers may keep leading zeros, so never parse them into a long. Masking keeps only the necessary suffix and never logs the original value. Use a builder with an expected capacity to avoid repeated buffer allocation.

Immutable Java strings also have a downside: you cannot reliably erase every copy of a password from the heap. For short-lived secrets, a char[] API lets the caller overwrite the data, although GC/serialization/logging still demand care. Do not use a String for a credential and then trust that {{null}} erases the memory immediately.

### Production pitfalls
- Logging a request before masking: the data has already left the safe path; mask at the boundary before logging.
- {{substring}} is not Unicode normalization. Characters that look alike may have different code points; international business logic must pick a specific Unicode normalization.
- Masking by character count instead of by normalized digit characters can expose more than intended.
- Never use {{==}} for content, and do not rely on the pool to fix comparison bugs.
- A StringBuilder can grow its buffer and keep sensitive data in memory; avoid writing it to logs/debug output.

### Interview notes
Compare loop concatenation with a builder, explain that the pool is not a business cache, then describe the order normalize → validate → mask → log without losing leading zeros.`,
    exercises: [{
      title: 'Normalize and mask an account string',
      prompt: `Write {{Mask.account(String raw)}}: remove spaces and hyphens, require at least 4 ASCII letters/digits, preserve leading zeros; return {{*}} for every character except the last 4. A null or malformed input throws IllegalArgumentException.`,
      hints: [
        'Do not parse into a number because that loses leading zeros; filter characters into a StringBuilder.',
        'Compute the four-character suffix and build the masked result only after normalization.'
      ],
      explain: `Normalization must follow an explicit input contract; here only ASCII spaces and hyphens may be removed. Any character outside ASCII alphanumeric is rejected rather than silently deleted, so two different identifiers never collapse into one. The builder keeps the complexity linear at O(n) and creates no new string per character.`
    }],
    check: [
      { q: 'Pick the correct Java rule.', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This option follows the mechanism described above.' },
      { q: 'Which choice avoids the production pitfall?', options: ['Option A', 'Option B', 'Option C', 'Option D'], explain: 'This choice preserves the stated invariant.' }
    ]
  }
});
