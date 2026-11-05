/*
 * English translation of js/data/lessons-core.js — task T753. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-009
 */
App.i18n.content({
  'lesson-core-009': {
    title: 'Optional and handling null correctly: return types, the entrance, and expensive defaults',
    goals: [
      'Explain why a NullPointerException explodes far away from the place where the bad data came in',
      'Use Optional in the right places: as a return type, never for fields, parameters or collection elements',
      'Write a lookup chain with map/flatMap instead of nested null-checks and explain how map handles a function that returns null',
      'Pick orElse or orElseGet based on what it costs to compute the default value, and block null at the entrance with Objects.requireNonNull',
    ],
    body: `**Summary:** {{null}} means "this variable points to no object"; call any method on it and the JVM throws {{NullPointerException}}. {{Optional}} is a small object that wraps a value — it either holds one value or holds nothing at all — and it exists to state right inside the return type that "the result may be absent". It fits as a **return type**, not as a field, a method parameter or a collection element. {{orElse}} takes a **value**, so that value has already been computed before the method even runs; {{orElseGet}} takes an **unrun recipe** (a {{Supplier}}) and only calls it when something really is missing.

### What null is and why it is so damaging
A variable of an object type does not hold an object, it holds a **reference** (an address pointing to an object on the heap). {{null}} is a special value of a reference: "there is nothing here". Read a field or call a method on a null reference and the JVM throws {{NullPointerException}} — which is a {{RuntimeException}}, so the compiler never forces you to handle it.

The problem is not the NPE itself, it is that **the place where it explodes is usually not the place where the data got broken**:

~~~java
String city = order.getCustomer().getAddress().getCity().toUpperCase();
// the NPE lands on this line, but the missing data may have been written three layers earlier, or by an import job at 2 a.m.
~~~

The real depth of this chain is this: every layer trusts that the layer below it will not return null. When one layer breaks that promise, the whole system carries the debt, and the one who ends up paying it is whoever reads the stack trace.

### Blocking bad data at the entrance
{{Objects}} is a utility class in {{java.util}}. The three usages that matter most:

~~~java
void ship(User user, String id) {
    Objects.requireNonNull(user, "user");                 // NPE with the message "user"
    Objects.requireNonNull(id);                           // NPE but the message is null -> a very useless log line
    if (id.isBlank()) throw new IllegalArgumentException("empty id: " + id);  // a caller error, with context attached
}
~~~

How to choose: {{requireNonNull}} for the "must not be null" precondition (a mistake in the code of whoever calls you, i.e. usually a bug); {{IllegalArgumentException}} when null **is** syntactically valid input but the business rules refuse it; and when absence is perfectly normal, do not raise an error at all — return {{Optional.empty()}}. {{requireNonNull}} has two further members that people often overlook: {{requireNonNullElse(x, "default-value")}} (take a fallback value) and {{requireNonNullElseGet(x, () -> expensive())}} (compute the fallback only when it is actually needed), plus {{checkFromIndexSize}} for index validation.

{{Optional.of(maybeNull)}} throws NPE; {{Optional.ofNullable(maybeNull)}} returns {{Optional.empty()}}. This is the most frequently miswritten pair, and one of the tests below is built on exactly it.

### Three ways to create one, and a lookup chain instead of nested null-checks
~~~java
// before: four nested if levels, easy to forget one of them
String city = null;
if (users.containsKey(id)) {
    User u = users.get(id);
    if (u != null && u.address() != null) {
        Address a = u.address();
        if (a.city() != null && !a.city().isBlank()) city = a.city();
    }
}

// after: one expression, each level stops on its own when something is missing
Optional<String> cityOpt = Optional.ofNullable(id)
        .map(k -> users.get(k))      // Optional<User>: empty when there is no user for this key
        .map(User::address)          // empty when address is null (map converts null into empty by itself)
        .map(Address::city)          // empty when city is null
        .filter(c -> !c.isBlank());  // empty when it is only whitespace
~~~

The key point about {{map}}: if the function inside it returns **null**, the result is {{Optional.empty()}}, not an NPE. That is what lets one {{map}} chain replace a whole pile of {{if (x != null)}} blocks. When your function **already returns an Optional**, use {{flatMap}} so you do not end up with an {{Optional}} nested inside an {{Optional}}:

~~~java
Optional<Address> viaMap     = userOpt.map(u -> lookupAddress(u));    // Optional<Optional<Address>> — wrong
Optional<Address> viaFlatMap = userOpt.flatMap(u -> lookupAddress(u)); // Optional<Address> — right
~~~

The remaining functions, and the Java version that introduced them:

| Function | What it does | Available since |
|---|---|---|
| {{ifPresent(c -> ...)}} | runs {{c}} when a value is present | 8 |
| {{orElse(d)}} | returns the value or {{d}}; **{{d}} was already computed beforehand** | 8 |
| {{orElseGet(s)}} | calls {{s}} only when empty | 8 |
| {{orElseThrow()}} | throws {{NoSuchElementException}} with the message "No value present" | 10 |
| {{orElseThrow(() -> new NotFoundException(...))}} | turns "not there" into a business error that carries a message | 8 |
| {{filter(p)}} | keeps the value if it satisfies {{p}}, otherwise empty | 8 |
| {{ifPresentOrElse(c, otherwise)}} | two explicit branches, the usual replacement for {{isPresent()}} | 9 |
| {{or(() -> otherSource)}} | when empty, try another source | 9 |
| {{stream()}} | 0 or 1 element, for splicing into a {{Stream}} | 9 |
| {{isEmpty()}} | stands in for {{!isPresent()}}, reads better | 11 |

### orElse or orElseGet: the question is the cost of computing the default
This is not a quirk of {{Optional}} but a rule of Java itself: **every argument is evaluated before the method is called**.

~~~java
static final AtomicInteger calls = new AtomicInteger();

static User expensiveFallback() {              // reads the DB: each run adds one to the counter
    calls.incrementAndGet();
    return new User("guest-user", null);
}

User a = userOpt.orElse(expensiveFallback());          // the fallback still runs, even though userOpt already has a value
User b = userOpt.orElseGet(() -> expensiveFallback()); // runs only when userOpt is empty
~~~

An everyday comparison: {{orElse}} is like **having already ordered and paid for** the backup dish and only then asking the guest whether they want it; {{orElseGet}} hands the kitchen to the guest, and if they do not ask for anything, nothing gets cooked. On production, a service that calls {{orElse(loadDefaultFromDb())}} inside a loop over 50,000 orders sends 50,000 redundant queries even though 99% of the orders have a user — this is the kind of defect you only spot in an APM, never by reading the code.

| The default value is | Use |
|---|---|
| a constant, a static string, a variable you already have | {{orElse}} |
| a function call, something with a side effect, or it needs a new object | {{orElseGet}} |
| absence is simply not acceptable | {{orElseThrow}} with a business exception that carries a message |

### Where Optional does not belong
- **A field of a class or DTO**: {{Optional}} does not implement {{Serializable}}, it complicates mapping (Jackson needs {{Jdk8Module}}), and with JPA/Hibernate an Optional field is not supported the way ordinary fields are.
- **A method parameter**: it forces the caller to write a pointless {{Optional.of(x)}}. If you want "may be left out", use an overload, or {{@Nullable}} plus {{requireNonNullElse}}.
- **A collection element / a Map key**: {{List<Optional<String>>}} should be a plain {{List<String>}} with the absent entries filtered out; and a method that returns a list should return an empty list, not {{Optional<List<T>>}}, because the caller then has to handle two levels of "not there".
- **Primitives have their own Optional**: {{OptionalInt}}, {{OptionalLong}}, {{OptionalDouble}} avoid boxing, but their API is less convenient ({{getAsInt}}); consider returning a default value instead of an Optional.
- **Hot loops**: every {{Optional}} is an object; JIT may remove it through escape analysis, but nothing guarantees that. In a loop over a million elements, measure before you draw conclusions.

> Senior tip: at the boundary (repository, HTTP client) let {{Optional}} "speak" the absence; once you are inside the presentation layer or inside a business layer that is already certain, convert it into a value or into an error. Spring Data JPA's {{findById}} returns an {{Optional}} — write {{repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Not found id=" + id))}} instead of {{.get()}}: identical behaviour, but the message says what was missing. {{.get()}} throws {{NoSuchElementException}} with the message "No value present", which is useless in a log.

### Production pitfalls
- A method declared to return {{Optional}} but with a {{return null;}} branch somewhere → the NPE explodes on the caller side, at the very place that believed no check was needed. Rule: never return null from an {{Optional}} type.
- {{opt.isPresent()}} followed by {{opt.get()}} inside an if: that is just a null-check written longer; it uses none of what Optional offers — replace it with {{map/orElse/ifPresentOrElse}}.
- {{Map.of(...)}}, {{List.of(...)}} and the other immutable collections **forbid null**: {{Map.of().get(null)}} throws NPE while {{new HashMap<>().get(null)}} returns null. That is why a lookup chain should start with {{Optional.ofNullable(id).map(k -> users.get(k))}} and not with {{Optional.ofNullable(users.get(id))}}.
- {{ConcurrentHashMap}} forbids null in both keys and values; to represent "not there", return an {{Optional}} or use a sentinel — do not stuff null into the map.
- Forgetting {{filter}}: "no city" stored as an empty string or a whitespace string; {{Optional.of("")}} treats that as **present** and prints a blank line.
- Wrapping {{Optional}} around a result that is already guaranteed: {{Optional.of(value)}} where value comes from the DB and may be null → NPE; use {{ofNullable}} for anything arriving from outside.
- Logging an {{Optional}} directly: {{toString}} prints "Optional[Hanoi]", which confuses anyone parsing the log; apply {{orElse("-")}} before logging.
- {{Optional.empty()}} is a single reused instance, while {{Optional.of(x)}} allocates a new object: comparing two Optionals with {{==}} is wrong — use {{equals}}, or {{isPresent}} plus {{equals}}.

### Interview relevance
The classic question set: where Optional belongs and where it does not; how {{of}} differs from {{ofNullable}}; how {{orElse}} differs from {{orElseGet}} (this one almost certainly comes up, and the correct answer lives in the **argument-evaluation rule**, not inside the Optional class); how {{map}} handles a function that returns null and when you need {{flatMap}}; why Optional should not be a JPA field; what to do so you never receive an NPE from {{get()}}. Answer it compactly: the return type expresses absence, block null at the entrance with {{requireNonNull}}, choose {{orElseGet}} when the default is expensive, and always put a business message into {{orElseThrow}}.`,
    exercises: [
      {
        title: 'Refactor a nested null-check lookup chain to Optional and count how often the fallback runs',
        prompt: `Use the three declared types: {{record User(String name, Address address)}}, {{record Address(String city)}} and the class {{Lookups}}. Write four functions, **using only features available in Java 17**, never {{get()}}, and no reading of the clock, no randomness, no sleeping.
- {{Lookups.city(Map<String, User> users, String id)}} returns {{Optional<String>}}: the chain {{id}} -> user -> address -> city. Return {{Optional.empty()}} when {{id}} is null, when the map does not contain the id, when {{address}} is null, when {{city}} is null, and when {{city}} is only whitespace. **It must not throw an exception**, even when {{users}} is {{Map.of()}} (whose {{get(null)}} does throw NPE). Never return {{null}}.
- {{Lookups.cityOrDefault(Map<String, User> users, String id, Supplier<String> fallback)}}: return the city when there is one, otherwise return the result of {{fallback}}. {{fallback}} **may only be called when the value is missing** — meaning use {{orElseGet}}, not {{orElse}}.
- {{Lookups.mustFind(Map<String, User> users, String id)}}: return exactly the {{User}} stored in the map; when it is not there, throw {{IllegalArgumentException}} with a message that contains {{id}} (use {{orElseThrow}}, not {{get()}}).
- {{Lookups.tagged(String tag, Optional<String> value)}}: block a null {{tag}} at the entrance with {{Objects.requireNonNull(tag, "tag")}}, then return {{tag + "=" + the value}}; when {{value}} is empty, the value part is a {{-}}. The parameter {{value}} is always an Optional, never null.
Hint on the safe order for {{city}}: start with {{Optional.ofNullable(id)}}, then {{map}} one level at a time, then {{filter}}.`,
        hints: [
          'Start the chain with {{Optional.ofNullable(id)}}: when id is null, no line ever reaches the map, so {{Map.of()}} never gets a chance to throw NPE.',
          'Each level is one {{map}}; if the function inside map returns null, Optional turns that into empty for you, so you need no {{if}} at all. Add {{filter(c -> !c.isBlank())}} to drop whitespace-only strings.',
          'Count how many times the fallback is called: the test feeds an {{AtomicInteger}} in through the {{Supplier}}. If you write {{orElse(fallback.get())}}, the counter goes up even when a value is present.',
          'Write {{orElseThrow(() -> new IllegalArgumentException("... " + id))}} instead of {{get()}}: the message tells whoever reads the log which id was missing.',
        ],
        explain: `The four {{map}} lines are equivalent to four nested {{if != null}} levels, except that adding a new level means adding one {{map}} rather than another level of nesting. The part people get wrong most is the first level: {{Optional.ofNullable(users.get(id))}} looks tidier but calls {{users.get(null)}} straight away, and with {{Map.of(...)}} (Java 9+, and the same holds for every {{List.of}} and {{Set.of}}) that call throws NPE; wrap {{id}} in {{Optional.ofNullable}} first and only then {{map}} into the map, and the chain stops safely. {{cityOrDefault}} uses {{orElseGet}} for the reason already given in the body: the argument of {{orElse}} is always evaluated before the method runs, so a fallback with a side effect runs on every single call. {{mustFind}} shows where {{orElseThrow}} beats {{get()}}, and it is exactly one place: the message — {{get()}} only says "No value present" while your message says which id is missing. Finally, {{tagged}} uses {{Objects.requireNonNull(tag, "tag")}}: drop the message parameter and the NPE carries a {{null}} message, so your log loses all of its context.`,
      },
    ],
    check: [
      {
        q: 'Why does orElse(loadDefaultFromDb()) always hit the database even when the Optional already holds a value?',
        options: [
          'Because orElse is defined to call the supplier twice, to be safe',
          'Because Java finishes evaluating every argument before calling the method: loadDefaultFromDb() runs first, and only its result is passed into orElse; orElseGet takes a Supplier that has not run yet and calls it only when empty',
          'Because orElse only works with collections',
          'Because loadDefaultFromDb is a static method, so the JVM caches it',
        ],
        explain: 'This is a rule of the language, not a peculiarity of Optional. orElse receives a value that already exists, whereas orElseGet receives a recipe for producing the value. The practical consequence: orElse with a side-effecting function pays for that side effect on every call, including the calls that already have all the data.',
      },
      {
        q: 'How do Optional.of(x) and Optional.ofNullable(x) differ when x may be null?',
        options: [
          'Both return Optional.empty() when x is null',
          'of throws NullPointerException immediately, while ofNullable returns Optional.empty() — for values coming from outside your code, use ofNullable to stay safe',
          'of accepts null, ofNullable does not accept null',
          'ofNullable is only for primitive types',
        ],
        explain: 'of expresses the claim "I am certain this is not null", so breaking that claim is a bug and it gets reported right where it happens. ofNullable expresses "there may be nothing here", turning the absence into Optional.empty() so that the map/filter chain downstream stops quietly.',
      },
      {
        q: 'Which of the following is a place where Optional SHOULD be used?',
        options: [
          'A field of a JPA entity used to represent a nullable column',
          'The return type of a repository method that may not find the row, for example findById',
          'An element of a List<Optional<String>> handed back to the presentation layer',
          'A method parameter, so the caller passes Optional.empty() when it has no value',
        ],
        explain: 'Optional was created to act as a signal in the return type. As a field it is not Serializable and it makes mapping awkward; as a collection element you should filter the absent values out and return a plain list; as a parameter it forces the caller into pointless wrapping — better an overload, or blocking null at the entrance.',
      },
      {
        q: 'What happens when the function inside map returns null?',
        options: [
          'map returns Optional.empty(), which is why a chain of map calls can replace many nested null-check ifs',
          'map throws NullPointerException at that level',
          'map returns an Optional that contains null, and the later get() is what blows up',
          'map skips the whole chain and returns the Optional of the first level',
        ],
        explain: 'This is precisely the mechanism that makes the map chain safe: an Optional never contains null, so a null result from your function is normalised into absence. If your function already returns an Optional, use flatMap, because map would produce an Optional wrapping an Optional.',
      },
    ],
  },
});
