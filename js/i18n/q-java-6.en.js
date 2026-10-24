/*
 * English translation of js/data/q-java.js — task T164. Format: js/core/i18n.js (content overlay).
 * ids: collections-016 collections-017 collections-018 modern-011 modern-012 modern-013 modern-014 modern-015
 */
App.i18n.content({
  'collections-016': {
    q: '{{HashSet}} works inside? What happens if you modify the field participating in {{hashCode}} of an object after adding it to {{HashSet}} or using it as a {{HashMap}} key?',
    a: `**Summary:** {{HashSet}} is essentially a {{HashMap}} inside: elements are keys, value is a shared dummy object ({{PRESENT}}). {{add}} returns true when {{map.put}} returns null (key not present). Thus all {{HashMap}} rules apply: find bucket by {{hashCode}}, confirm with {{equals}}. If the field participating in {{hashCode}} is changed after add, the object is "lost" in the old bucket: {{contains}} and {{remove}} both return false, adding again creates a duplicate entry, and the old object is never removed (memory leak).

### Inside
~~~java
// Shortened from JDK source
public class HashSet<E> {
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object();

    public boolean add(E e)      { return map.put(e, PRESENT) == null; }
    public boolean contains(Object o) { return map.containsKey(o); }
    public boolean remove(Object o)   { return map.remove(o) == PRESENT; }
}
~~~
- {{LinkedHashSet}} is based on {{LinkedHashMap}}, so it keeps insertion order.
- {{TreeSet}} is based on {{TreeMap}}, comparing by {{compareTo}}/{{Comparator}}, **not** using {{equals}}/{{hashCode}}. For example, {{new BigDecimal("2.0")}} and {{new BigDecimal("2.00")}}: {{HashSet}} keeps 2 elements (equals compares scale), {{TreeSet}} keeps only 1 (compareTo equals 0).

### Predicted output: key changed after add
~~~java
class Key {
    String no;
    Key(String no) { this.no = no; }
    @Override public boolean equals(Object o) { return o instanceof Key k && k.no.equals(no); }
    @Override public int hashCode() { return no.hashCode(); }
}

Set<Key> set = new HashSet<>();
Key a = new Key("001");
set.add(a);
a.no = "002";                                  // change field used in hashCode

System.out.println(set.contains(a));           // false
System.out.println(set.contains(new Key("001"))); // false
System.out.println(set.remove(a));             // false
set.add(a);
System.out.println(set.size());                // 2
~~~
Why: the node in the bucket stores the **old hash** (computed from "001"). Finding {{a}} uses the new hash (from "002") which does not match that node. Finding {{new Key("001")}} hits the right bucket and hash, but {{equals}} compares "001" with the current field "002" so still false. The object stays in the set but nobody can find it, and adding again creates a second node pointing to the same object.

### Real-world scenario
- **JPA entity** with {{hashCode}} based on auto-generated id: add a new entity (id null) to {{Set<OrderItem>}}, after {{persist}} the id is assigned, hash changes, then {{remove}} cannot delete it, orphanRemoval does not run. Common fix: use an immutable business key, or have {{hashCode}} return a constant by class and {{equals}} compare id when id is not null.
- Using {{List}} or {{StringBuilder}} mutable as cache key: someone modifies the list after put, so cache never hits and grows continuously.
- Lombok {{@Data}} generates {{hashCode}} based on all fields: entity changed means it is lost from the set.

### Prevention
| Approach | Note |
|---|---|
| Immutable key ({{record}}, String, final field) | Best choice |
| {{hashCode}} based only on immutable fields | Example account code, not balance |
| Change key: remove, modify, then add again | Must do before object is changed |
| Defensive copy when receiving key from outside | {{List.copyOf}} before using as key |

### Common wrong answers
- "HashSet uses equals to check duplicates": not enough, it uses {{hashCode}} to choose bucket first, then {{equals}}.
- "Changing key makes the set update automatically": the collection does not know the object was modified.
- "TreeSet also relies on equals": wrong, it relies on compareTo.

> Senior tip: when you see a bug like "added to set but contains returns false" or a memory leak in a cache map, the first thing is to check whether the key was modified after put. The team rule should be: every class used as a Map/Set key must be immutable, ideally a {{record}}.`,
    follow: [
      'How to write {{equals}}/{{hashCode}} for a JPA entity so it is safe with Set and Hibernate proxy?',
      'Why does {{TreeSet}} with an inconsistent comparator violate the {{Set}} contract?',
      'If {{hashCode}} always returns the same constant, how does {{HashSet}} behave from Java 8?'
    ]
  },
  'collections-017': {
    q: 'You need to remove elements matching a condition from an {{ArrayList}} (or {{Map}}) while iterating. How do for-each, {{Iterator.remove}}, {{removeIf}}, and index-based loops differ? Predict output for a few trap cases.',
    a: `**Summary:** Calling {{list.remove}} inside a for-each loop usually throws {{ConcurrentModificationException}} because the iterator detects {{modCount}} changed outside it. Correct ways: {{Iterator.remove()}} when complex logic is needed, {{removeIf}} (Java 8+) is shortest and fastest for {{ArrayList}}, and for maps use {{map.entrySet().removeIf(...)}}. Index loops need to iterate backwards or adjust the index carefully.

### Why for-each throws CME
For-each on {{List}} is compiled into {{Iterator}}. {{ArrayList}} increments {{modCount}} on every structural change; the iterator stores {{expectedModCount}} when created and compares it in each {{next()}}. Calling {{list.remove}} directly changes {{modCount}}, so the next {{next()}} throws CME. This happens even with **a single thread**.

### Predicted output: two trap cases
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Throws ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> NO exception, and "c" is never checked
~~~
Why case 2 has no error: after removing "b", size is 2, the iterator {{cursor}} is also 2. {{hasNext()}} only checks {{cursor != size}}, so it returns false and the loop ends before {{next()}} checks {{modCount}}. The code "runs" but skips the last element: a silent bug more dangerous than CME.

### Correct ways
~~~java
// 1. Iterator.remove: removes the element just next()-ed, iterator updates state
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    Order o = it.next();
    if (o.isExpired()) {
        audit.log(o);            // extra logic before removing
        it.remove();
    }
}

// 2. removeIf: concise and O(n) for ArrayList
orders.removeIf(Order::isExpired);

// 3. Map: remove on entrySet / values view
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);

// 4. Index: iterate backwards so shifting elements do not skip
for (int i = list.size() - 1; i >= 0; i--) {
    if (shouldRemove(list.get(i))) list.remove(i);
}
~~~

### Comparison
| Approach | Complexity with ArrayList | Note |
|---|---|---|
| for-each + list.remove | CME or skip | Never use |
| Iterator.remove | O(n) per removal, total may be O(n^2) | Flexible, works with LinkedList (O(1)) |
| removeIf | O(n) total, shifts array once | Default choice |
| for index forwards + remove(i) | Skip next if forget i-- | Easy to get wrong |
| stream().filter().toList() | O(n), creates new list | When you want to keep original |

### Common wrong answers
- "CME only happens with multiple threads": wrong, one thread can still hit it.
- "Switch to {{CopyOnWriteArrayList}} fixes it": it avoids CME because it iterates a snapshot, but each remove copies the whole array, and {{iterator().remove()}} throws {{UnsupportedOperationException}}.
- "CME is always thrown on any modification": JDK docs say fail-fast is best-effort, as shown with "b" above.

> Senior tip: in code review, seeing {{remove}} inside for-each is a red flag to block immediately. For large batches (hundreds of thousands of elements), switching from {{Iterator.remove}} to {{removeIf}} can reduce time from seconds to milliseconds by avoiding repeated array shifts.`,
    follow: [
      'Why does {{ConcurrentHashMap}} allow removal during iteration without throwing CME?',
      'Can modifying a value (not structure) inside a {{HashMap}} iteration throw CME?',
      'How is {{ArrayList.removeIf}} implemented to achieve O(n)?'
    ],
  },
  'collections-018': {
    q: 'What traps does {{Arrays.asList}} have (fixed-size, view of array, primitive array)? Predict output and tell which replacement you choose in each case.',
    a: `**Summary:** {{Arrays.asList}} does not create {{java.util.ArrayList}} but returns an inner class {{Arrays$ArrayList}} wrapping the **original array**. Thus it has fixed size ({{add}}/{{remove}} throw {{UnsupportedOperationException}}), {{set}} writes through to the array and vice versa, and passing a primitive array produces a list with **one element** which is the whole array. Need a modifiable list? Wrap with {{new ArrayList<>(...)}}; need immutable? Use {{List.of}}/{{List.copyOf}}.

### Predicted output
~~~java
String[] arr = {"b", "a", "c"};
List<String> list = Arrays.asList(arr);

list.set(0, "z");
System.out.println(arr[0]);                 // z          (list writes through to array)
arr[1] = "y";
System.out.println(list);                   // [z, y, c]  (array change visible to list)
Collections.sort(list);
System.out.println(Arrays.toString(arr));   // [c, y, z]  (sort list sorts array)
list.add("d");                              // UnsupportedOperationException

int[] nums = {1, 2, 3};
System.out.println(Arrays.asList(nums).size());    // 1 -> type is List<int[]>
Integer[] boxed = {1, 2, 3};
System.out.println(Arrays.asList(boxed).size());   // 3
~~~

### Why
- **View, not copy**: {{Arrays$ArrayList}} only holds a reference to the array, so creating the list is O(1) with no memory cost. Changing size is forbidden because arrays cannot grow. The class extends {{AbstractList}}, where {{add}}/{{remove}} throw UOE by default; {{clear()}} or {{removeIf}} on any match also throw UOE because they eventually call {{remove}}.
- **Primitive array**: the signature is {{asList(T... a)}}; generics do not accept primitives, so {{int[]}} cannot match {{T[]}} and becomes a single {{T}}. The result is {{List<int[]>}} with 1 element. Need a number list: use {{Arrays.stream(nums).boxed().toList()}} or declare {{Integer[]}}.
- **Null**: {{Arrays.asList}} accepts null, but {{List.of}} throws NPE on creation, and {{List.of(...).contains(null)}} also throws NPE.

### Which replacement to choose
| Need | Use | Note |
|---|---|---|
| Modifiable list, add/remove | {{new ArrayList<>(Arrays.asList(arr))}} | Copy, separate from array |
| Immutable list, no null | {{List.of(...)}} / {{List.copyOf(c)}} | Throws UOE for {{set}} |
| View array as list, sortable | {{Arrays.asList(arr)}} | Accepts writes through |
| Primitive to List<Integer> | {{IntStream.of(...).boxed().toList()}} | Or primitive collection library |

### Common wrong answers
- "Arrays.asList returns ArrayList": correct class name but it is the inner class in {{Arrays}}, not {{java.util.ArrayList}}.
- "Arrays.asList is immutable": wrong, {{set}} and {{sort}} still work and modify the original array.
- "Arrays.asList(intArray) gives List<Integer>": wrong, gives {{List<int[]>}}.

### Production pitfall
- Function A returns {{Arrays.asList(...)}}, function B in another module receives a {{List}} and calls {{add}}: A's tests pass, error only appears at integration time on production with {{UnsupportedOperationException}}, very hard to understand.
- Passing {{Arrays.asList(arr)}} to a component, then later reusing or modifying array {{arr}} (reused buffer): that component suddenly sees changed data.
- Assigning {{Arrays.asList(...)}} to a JPA entity collection at initialization, then business code calls {{getItems().add(...)}} and breaks. Initialize entity collections with {{new ArrayList<>()}}.

> Senior tip: internal API convention: a public method returning {{List}} should either be clearly immutable ({{List.copyOf}}), or explicitly document in Javadoc that callers may modify. Never return {{Arrays.asList}} across module boundaries, because it is the hardest-to-predict "half-modifiable" state.`,
    follow: [
      'How does {{List.of}} differ from {{Collections.unmodifiableList}} when the original list changes?',
      'Why does {{Arrays.asList(1, 2, 3).contains(1L)}} return false?',
      'How to convert {{int[]}} to {{List<Integer}} efficiently with millions of elements?'
    ],
  },
  'modern-011': {
    q: '{{Stream.toList()}} (Java 16) differs from {{collect(Collectors.toList())}} and {{Collectors.toUnmodifiableList()}} in mutability, null handling, and return type? Is bulk replacement by IDE safe?',
    a: `**Summary:** {{collect(Collectors.toList())}} (Java 8) returns a list whose spec **does not promise** anything about type or mutability (in practice it is {{ArrayList}}, modifiable). {{Collectors.toUnmodifiableList()}} (Java 10) returns an unmodifiable list and **throws NPE if any null** is present. {{Stream.toList()}} (Java 16) returns an unmodifiable list but **allows null**. Replacing all {{collect(toList())}} with {{toList()}} is not safe: any code that calls {{add}}/{{sort}}/{{set}} on the result will throw {{UnsupportedOperationException}} at runtime.

### Predicted output
~~~java
List<String> a = Stream.of("x", "y").collect(Collectors.toList());
a.add("z");                 // works (currently ArrayList), but spec does not guarantee

List<String> b = Stream.of("x", "y").toList();
b.add("z");                 // UnsupportedOperationException

List<String> c = Stream.of("x", null).toList();     // OK: [x, null]

List<String> d = Stream.of("x", null)
        .collect(Collectors.toUnmodifiableList());  // NullPointerException
~~~

### Comparison table
| | collect(toList()) | toUnmodifiableList() | Stream.toList() |
|---|---|---|---|
| From version | Java 8 | Java 10 | Java 16 |
| Modifiable | Not guaranteed (in practice yes) | No | No |
| Null elements | Allowed | NPE | Allowed |
| Type inference | By target type | By target type | Fixed by stream element type |
| Code length | Long | Long | Shortest |

### Type difference trap (when migrating)
~~~java
// Compiles: T of collector inferred as Number from target type
List<Number> ok = Stream.of(1, 2).collect(Collectors.toList());

// Compile error: toList() of Stream<Integer> returns exactly List<Integer>
// List<Number> err = Stream.of(1, 2).toList();
~~~
{{toList()}} is a method of {{Stream<T>}} and returns {{List<T>}}, so there is no room for the compiler to infer a broader type. To do that you must {{map}} to the parent type or use {{Stream.<Number>of(1, 2)}}.

### Why Java added toList()
- Pattern {{collect(Collectors.toList())}} appears everywhere and is verbose.
- Most cases only need to read the result; returning immutable prevents shared-state bugs.
- Allowing null replaces much old code without immediately breaking due to NPE (unlike {{toUnmodifiableList}}).

### When to use which
- Default for new code: {{toList()}}.
- Need modifiable list (will sort, add more): {{collect(Collectors.toCollection(ArrayList::new))}}, ensuring explicit type instead of relying on hidden behavior of {{Collectors.toList()}}.
- Want to catch null data early (e.g., transaction code list must not be null): {{toUnmodifiableList()}}.

### Common wrong answers
- "toList() is just shorthand for collect(Collectors.toList())": wrong, different in both mutability and type inference.
- "toList() and toUnmodifiableList() are identical": different in null handling.
- "Immutable list means elements are also immutable": wrong, only the list structure is immutable; inner objects are still mutable.

### Production pitfall
- Sonar/IDE suggests "Replace with toList()", dev applies to the whole project; a distant service calls {{result.sort(...)}} or {{removeIf}} and explodes with UOE on production, because tests did not cover that branch.
- Returning an immutable list to Jackson is fine, but assigning to a JPA entity collection and letting another piece of code call {{add}} causes failure.

> Senior tip: when migrating, proceed module by module and grep for places where the result list is modified ({{add}}, {{sort}}, {{remove}}, {{set}}) before switching. Add a coding convention: "lists returned from streams are immutable; if modification is needed use {{toCollection(ArrayList::new)}}" so intent is visible in code.`,
    follow: [
      'Why does {{Collectors.toList()}} not promise to return {{ArrayList}}? How does that affect JDK upgrades?',
      'How do {{Collectors.toMap}} and {{Collectors.toUnmodifiableMap}} handle duplicate keys and null?',
      'When would you actively want null elements blocked early instead of allowed?'
    ],
  },
  'modern-012': {
    q: 'Your service needs to call a core banking/partner API over HTTP. How to use {{java.net.http.HttpClient}} (Java 11+) correctly (sync/async, timeout, HTTP/2)? Compared to RestTemplate, RestClient, and WebClient, which do you choose and why?',
    a: `**Summary:** {{HttpClient}} is the standard JDK HTTP client from Java 11: immutable, thread-safe, with an internal connection pool, so **create once and share**; supports HTTP/2 (auto fallback to HTTP/1.1), {{send}} is synchronous and {{sendAsync}} returns {{CompletableFuture}}. By default **there is no timeout**, so you must set {{connectTimeout}} and {{timeout}} for each request. In Spring Boot 3.2+, I choose {{RestClient}} (which can run on the JDK HttpClient itself) for message converters, error handling, and observability; use HttpClient directly for libraries or tools that avoid Spring dependency.

### Using HttpClient correctly
~~~java
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_2)        // prefer HTTP/2, server not supporting uses 1.1
        .connectTimeout(Duration.ofSeconds(2))     // TCP/TLS connection open timeout
        .build();                                  // immutable, thread-safe: shared

HttpRequest req = HttpRequest.newBuilder(URI.create("https://core-bank.internal/api/accounts/123"))
        .timeout(Duration.ofSeconds(5))            // max 5s wait for response, else HttpTimeoutException
        .header("Accept", "application/json")
        .GET()
        .build();

// Sync: throws IOException, InterruptedException; very suitable for virtual threads
HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() >= 400) {                     // 4xx/5xx does NOT throw automatically
    throw new UpstreamException(res.statusCode(), res.body());
}

// Async: does not block the calling thread
CompletableFuture<String> body = CLIENT.sendAsync(req, HttpResponse.BodyHandlers.ofString())
        .thenApply(HttpResponse::body);
~~~

### Why share one instance
Each {{HttpClient}} has its own connection pool and selector management threads. Creating a new one per request loses keep-alive (re-handshaking TLS every time, costing tens of ms) and may leak threads/connections. From Java 21, {{HttpClient}} implements {{AutoCloseable}} ({{close}}, {{shutdown}}) for active cleanup when a short-lived client is truly needed.

### Comparison
| | JDK HttpClient | RestTemplate | RestClient (Spring 6.1) | WebClient |
|---|---|---|---|---|
| Type | Sync + async (CompletableFuture) | Sync | Sync, fluent API | Reactive |
| Dependency | JDK only | Spring | Spring | Spring WebFlux, Reactor |
| JSON mapping | Manual | Built-in | Built-in | Built-in |
| 4xx/5xx error | Manual check | Throws exception | {{retrieve()}} throws | Throws on {{retrieve()}} |
| Observability | Manual | Yes (Micrometer) | Yes | Yes |
| Status | JDK standard | Maintenance mode | Recommended for new sync code | Use when already reactive |

~~~java
RestClient client = RestClient.builder()
        .requestFactory(new JdkClientHttpRequestFactory(CLIENT)) // reuse JDK HttpClient
        .baseUrl("https://core-bank.internal")
        .build();

AccountDto dto = client.get().uri("/api/accounts/{id}", id)
        .retrieve()                                // 4xx/5xx -> RestClientResponseException
        .body(AccountDto.class);
~~~

### Selection criteria (Lead perspective)
- Spring MVC codebase, Java 21 + virtual threads: {{RestClient}} sync is simple enough and scales well; no need to pull in Reactor just to call HTTP.
- Need detailed connection pool control (max per route, idle eviction): set Apache HttpClient 5 as request factory, because JDK HttpClient only configures pool via system properties such as {{jdk.httpclient.keepalive.timeout}}.
- Internal SDK library used by multiple teams: JDK HttpClient to avoid imposing a Spring version.

### Common wrong answers
- "HttpClient throws exception automatically on 500": wrong, must check {{statusCode()}} yourself.
- "connectTimeout is enough": it only covers connection opening; if server accepts connection and then hangs, it will wait forever without a request {{timeout}}.
- "Async is always faster": async only frees the calling thread, it does not make upstream respond faster.

### Production pitfall
- No timeout: upstream hang drains the Tomcat thread pool and kills the service (c cascading failure).
- Blind retry for money transfer: must have idempotency key and only retry safe errors; add circuit breaker (Resilience4j).
- Logging full response body containing account number or national ID: must mask.

> Senior tip: set timeout according to upstream SLA (e.g., p99 is 800 ms so timeout around 2 s) and the total timeout of the call chain must be shorter than the timeout your client waits for you. Every external HTTP client should go through a shared bean with preset timeout, tracing headers, and metrics, instead of letting each developer create their own client.`,
    follow: [
      'How do you set connect timeout, read timeout, and total deadline for a chain of 3 service calls?',
      'Retrying a money-transfer API that times out: how to avoid double deduction?',
      'When running on virtual threads, is synchronous HTTP still a scalability concern?'
    ],
  },
  'modern-013': {
    q: 'How do helpful NullPointerException and pattern matching for {{instanceof}} help in debugging and daily coding? Besides that, which small improvements from Java 9 to 21 do you actually use?',
    a: `**Summary:** From Java 14 (enabled by default from Java 15), NPE messages clearly indicate **which expression** is null, e.g., "because the return value of getAddress() is null", so you no longer need to guess in long call chains. Pattern matching for {{instanceof}} (official in Java 16) checks the type and declares the casted variable at the same time, eliminating manual cast. Along with that, small APIs such as {{List.of}}, {{String.isBlank}}, {{Files.readString}}, {{Stream.toList}} make code shorter and less error-prone.

### Helpful NullPointerException
~~~java
String city = customer.getAddress().getCity().toUpperCase();
~~~
~~~text
// Java 8:
java.lang.NullPointerException
    at CustomerService.format(CustomerService.java:42)

// Java 17 (enriched message):
java.lang.NullPointerException: Cannot invoke "Address.getCity()"
    because the return value of "Customer.getAddress()" is null
~~~
- The JVM analyzes bytecode at the error site to know which value is null (field, array element, method result, local variable).
- Local variable names appear only if compiled with debug info ({{-g}}, default in Maven and Gradle); otherwise you see {{<local4>}}.
- The message is computed only when {{getMessage()}} is called, so it does not cost anything for caught-and-ignored NPEs. It can be disabled with {{-XX:-ShowCodeDetailsInExceptionMessages}} if worried about exposing code structure.

### Pattern matching for instanceof
~~~java
// Before Java 16
if (event instanceof PaymentEvent) {
    PaymentEvent p = (PaymentEvent) event;      // repeated cast, easy to cast wrong type
    process(p.amount());
}

// Java 16+
if (event instanceof PaymentEvent p && p.amount().signum() > 0) {
    process(p.amount());                         // p exists only when matched
}
~~~
Pattern variables have control-flow scoping: usable in branches where the compiler is sure it matched. Using {{||}} instead of {{&&}} prevents accessing {{p}} in the right-hand side.

### Small useful improvements
| Version | Feature | When to use |
|---|---|---|
| 9 | {{List.of}}, {{Set.of}}, {{Map.of}} | Constants, test data |
| 9 | {{Optional.ifPresentOrElse}}, {{Optional.stream}}, {{Stream.takeWhile}} | Optional handling, stream cutoff |
| 10 | {{var}}, {{List.copyOf}}, {{Optional.orElseThrow()}} | Long local types, defensive copy |
| 11 | {{String.isBlank}}, {{strip}}, {{lines}}, {{repeat}}; {{Files.readString}}; {{Predicate.not}} | Input validation, small file reading |
| 12 | {{Collectors.teeing}} | Two results in a single pass |
| 14–16 | Switch expression, text block, record, {{Stream.toList}} | DTO, multi-line SQL/JSON |
| 17 | Sealed class | Closed-state modeling |
| 21 | SequencedCollection, record pattern, virtual thread, {{Math.clamp}} | First/last access, IO-bound |

### Common wrong answers
- "Need a flag to enable helpful NPE": enabled by default since Java 15.
- "Pattern instanceof is just syntax sugar": it also eliminates wrong-cast bugs because check and cast are the same step.
- Listing features without saying where used: interviewers want real examples.

### Pitfall
- Logging only {{e.toString()}} or a custom message that swallows the stack trace: the message is great, but it misses the code line; always log the full exception.
- Helpful NPE points to the null source; it does not replace designing to avoid null: validate at boundaries (Bean Validation), use {{Optional}} for possibly absent return values.

> Senior tip: when listing "useful improvements", tie them to impact: "after upgrading to 17, investigation time for production NPE dropped because messages point straight to which getter returned null." Answers with measurable results always score higher than feature lists.`,
    follow: [
      'Why was helpful NPE disabled by default in Java 14?',
      'Can a pattern variable in {{instanceof}} be {{final}}? Can it be reassigned?',
      'What problem does {{Collectors.teeing}} solve? Give an example computing min and max at once.'
    ],
  },
  'modern-014': {
    q: '"What is new in Java 8 and which feature do you use most?" How to answer this classic opening to score points, and what do interviewers usually press on afterward?',
    a: `**Summary:** Java 8 brought functional programming to Java: **lambda + functional interfaces + method references**, **Stream API**, **Optional**, **default/static methods in interfaces**, **java.time** replacing {{Date}}/{{Calendar}}, and **CompletableFuture**. I use Stream most for business data processing, java.time for all date/time logic (cut-off, terms), and CompletableFuture to call multiple services in parallel. Then give a concrete example and mention what you are careful with.

### Structure for a high-scoring answer
1. Short list of 5–6 feature groups (15 seconds).
2. Pick 2–3 you really use, each with a business example.
3. Mention a trade-off or pitfall, showing depth rather than just usage.
4. If the project is on 17/21, briefly mention what else you use (record, switch expression, virtual thread).

### Example: Stream replacing loop for grouping
~~~java
// Java 7: sum successful transactions by type
Map<String, BigDecimal> totals = new HashMap<>();
for (Txn t : txns) {
    if (t.getStatus() == Status.SUCCESS) {
        BigDecimal cur = totals.get(t.getType());
        totals.put(t.getType(), cur == null ? t.getAmount() : cur.add(t.getAmount()));
    }
}

// Java 8: declare "what" instead of "how"
Map<String, BigDecimal> totals8 = txns.stream()
        .filter(t -> t.getStatus() == Status.SUCCESS)
        .collect(Collectors.groupingBy(Txn::getType,
                 Collectors.reducing(BigDecimal.ZERO, Txn::getAmount, BigDecimal::add)));
~~~

### Example: CompletableFuture for parallel calls
~~~java
// Need profile and credit score from 2 systems for a loan
CompletableFuture<Profile> profile =
        CompletableFuture.supplyAsync(() -> profileApi.get(id), ioPool);
CompletableFuture<Score> score =
        CompletableFuture.supplyAsync(() -> creditApi.score(id), ioPool);
LoanOffer offer = profile.thenCombine(score, LoanOffer::of).join(); // ~max(t1, t2) instead of t1 + t2
~~~
Pass a dedicated executor ({{ioPool}}) because default {{supplyAsync}} uses {{ForkJoinPool.commonPool()}}, which has about core-count threads and is shared across the JVM; blocking IO on it will choke other parts.

### Follow-up questions interviewers ask
| Question | Key point to cover |
|---|---|
| Why default methods? | To add {{stream()}}, {{forEach}} to {{Collection}}/{{Iterable}} without breaking millions of existing implementations |
| Lambda vs anonymous class? | No separate .class file, uses {{invokedynamic}}; {{this}} refers to enclosing class; captures only effectively final variables |
| Why drop Date/SimpleDateFormat? | {{Date}} mutable, {{SimpleDateFormat}} not thread-safe; java.time is immutable and separates {{Instant}}/{{LocalDate}}/{{ZonedDateTime}} |
| Optional usage? | For possibly absent return values; not for fields, parameters, or collections |
| Is Stream always faster? | Not by default; main benefit is readability and composability |

Additionally, Java 8 added: {{HashMap}} treeifies buckets on collision, Metaspace replaces PermGen, {{StringJoiner}}, {{Base64}}, {{Map.computeIfAbsent}}/{{merge}}.

### Common wrong answers
- Citing features from later versions: {{var}} (Java 10), {{List.of}} (Java 9), record (Java 16), module (Java 9) are **not** in Java 8.
- Listing like a release note without any used example.
- Saying "stream is always faster" or "use parallel stream for speed" without mentioning costs.

### Production pitfall
- Long nested streams of 15 lines are hard to debug; split into clearly named methods.
- {{Optional.get()}} without checking, or {{orElse(expensiveCall())}} always calling the expensive function even when value exists (use {{orElseGet}}).
- {{CompletableFuture}} forgetting error handling ({{exceptionally}}/{{handle}}) or timeouts ({{orTimeout}} available since Java 9).

> Senior tip: prepare a "before/after" story: e.g., "the customer info API called 3 services sequentially taking about 900 ms, after switching to CompletableFuture in parallel it takes about 350 ms." A real number from your project is worth more than any definition.`,
    follow: [
      'Can default methods cause diamond problem? How does Java resolve it?',
      'Why does a static {{SimpleDateFormat}} variable cause errors under multi-threading?',
      'Which thread does CompletableFuture use when no executor is passed? What is the risk?'
    ],
  },
  'modern-015': {
    q: 'Distinguish {{map}} vs {{flatMap}}, {{reduce}} vs {{collect}}, and {{peek}} in Stream. Give business examples and common errors, including predicted output with {{peek}}.',
    a: `**Summary:** {{map}} turns each element into **exactly one** element; {{flatMap}} turns each element into **a stream** then flattens those streams together (one to many or none). {{reduce}} combines values into an **immutable** result (sum, max), while {{collect}} is mutable reduction into a container such as list or map. {{peek}} is for debug only: it is lazy and the JVM may skip it, so it must not be used to change state.

### map vs flatMap
~~~java
// Stream<List<OrderItem>>: each order produces a list, still nested
List<List<OrderItem>> nested = orders.stream()
        .map(Order::getItems)
        .toList();

// Stream<OrderItem>: flatten to a list of all items from all orders
List<OrderItem> items = orders.stream()
        .flatMap(o -> o.getItems().stream())
        .toList();

// Optional: when mapper returns Optional, use flatMap to avoid Optional<Optional<...>>
Optional<String> city = findCustomer(id)
        .flatMap(Customer::getAddress)       // getAddress() returns Optional<Address>
        .map(Address::getCity);
~~~
Java 16 added {{mapMulti}} to emit 0..n elements without creating intermediate streams, useful when each element produces only a few results.

### reduce vs collect
~~~java
// reduce: right place, combining immutable values
BigDecimal total = txns.stream()
        .map(Txn::amount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);   // ZERO is a true identity

// WRONG: using reduce to collect into a mutable container
List<String> ids = txns.stream().reduce(new ArrayList<>(),
        (acc, t) -> { acc.add(t.id()); return acc; },
        (a, b) -> { a.addAll(b); return a; });       // parallel: many threads modify one ArrayList

// RIGHT: collect creates a separate container per branch
List<String> ids2 = txns.stream().map(Txn::id).collect(Collectors.toList());
~~~
Why: {{reduce}} assumes identity and intermediate results are immutable; in parallel streams the same identity is used for every branch. {{collect}} calls a supplier to create a **new** container for each branch, so it is safe.

Another trap: identity must be a true neutral element. {{Stream.of(1, 2, 3).reduce(10, Integer::sum)}} returns 16 sequentially, but with {{parallel()}} it may return 36 because 10 is added for each split (3 splits = added 3 times).

### peek: predicted output
~~~java
long n = List.of("a", "b", "c").stream()
        .peek(s -> System.out.println("peek " + s))
        .count();
System.out.println(n);
// Java 9+: prints only "3", no "peek" lines at all
~~~
Since Java 9, {{count()}} can compute directly from the source size when the pipeline has no {{filter}}/{{flatMap}}, so it skips iteration and {{peek}} never runs. Also, without a terminal operation {{peek}} never runs.

### Summary table
| Operation | Input -> Output | Use for |
|---|---|---|
| map | 1 -> 1 | Change type, extract field |
| flatMap | 1 -> 0..n (stream) | Flatten parent-child relations, nested Optional |
| reduce | n -> 1 immutable value | Sum, min/max, combine values |
| collect | n -> container | List, Map, groupingBy, joining |
| peek | No change | Log debug, no important side effect |

### Common wrong answers
- "flatMap is for flattening Map": wrong, it flattens nested streams.
- "reduce and collect are the same": different in mutability and parallel safety.
- "peek is like forEach but does not end the stream": peek is not guaranteed to run, while forEach is terminal and always runs.

### Production pitfall
- Using {{peek(o -> o.setStatus(PROCESSED))}} to update order status: someday someone changes the terminal operation to {{count()}} or adds {{limit}}, and some orders never get updated.
- {{flatMap}} over lazy JPA relations inside a loop causes N+1 queries; fetch join before streaming.

> Senior tip: team convention: lambdas inside streams must be **stateless** (except final {{forEach}}). Seeing {{peek}} containing a setter, or {{reduce}} with {{ArrayList}}, in code review means it needs rewriting immediately.`,
    follow: [
      'When does {{reduce}} use its 3-argument form (identity, accumulator, combiner)? When is the combiner used?',
      'When should {{mapMulti}} be used instead of {{flatMap}}?',
      'Why should lambdas in streams be stateless? Give an example of a stateful lambda causing wrong results under parallel execution.'
    ],
  }
});