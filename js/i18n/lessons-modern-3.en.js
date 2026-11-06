/*
 * English translation of js/data/lessons-modern.js — task T801. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-006
 */
App.i18n.content({
  'lesson-modern-006': {
    title: 'Advanced Collectors: downstream collectors, ordering with LinkedHashMap/TreeMap, toMap merge and teeing',
    goals: [
      'Read the groupingBy/partitioningBy/toMap/teeing signatures and pick the right downstream collector for each report',
      'Control the key order of the result map through mapFactory (TreeMap/LinkedHashMap) and know why HashMap has no order',
      'Handle duplicate keys in toMap with a merge function instead of letting it throw IllegalStateException, and combine two statistics with teeing',
    ],
    body: `**Summary:** {{Collectors}} is much more than {{toList}} and the basic {{groupingBy}}. Three concepts decide the quality of a report built with streams: the **downstream collector** (what happens next to the elements of the same group), the **mapFactory** (which map implementation is used, i.e. the key order you get when iterating) and the **merge function** of {{toMap}} (dealing with duplicate keys instead of throwing {{IllegalStateException}}). Add {{partitioningBy}} for binary reports and {{teeing}} to compute two statistics in a single pass. This lesson is meant to be read in order: what a collector is → the grouping factories → map order → duplicate keys → two groups → combining statistics.

### What a Collector actually is (why you must not accumulate into an outer variable)
What people usually write when they first meet streams:

~~~java
Map<String, BigDecimal> total = new HashMap<>();
orders.forEach(o -> total.merge(o.customerId(), o.amount(), BigDecimal::add));  // runs fine, but wrong under parallel
~~~

The snippet above has a **side effect**: it mutates a live object that lives outside the pipeline. Run sequentially it is correct; switch it to {{parallelStream}} and it can lose records or throw an exception, because {{HashMap}} is not a thread-safe structure and several threads write into it at the same time. {{Collector}} exists to describe a "gathering" operation in a form the machine can execute safely across many threads. A collector has 5 parts ({{Collector.of(supplier, accumulator, combiner, finisher, characteristics)}}):

| Part | What it does | For {{toList}} |
|---|---|---|
| {{supplier()}} | creates an **empty container** (one per thread under parallel) | a brand new {{ArrayList}} |
| {{accumulator()}} | puts one element into the container | {{list.add(t)}} |
| {{combiner()}} | merges two containers into one | {{left.addAll(right)}} |
| {{finisher()}} | turns the container into the final result | returns the list itself |
| {{characteristics()}} | describes the collector's properties so the stream can optimise | {{IDENTITY_FINISH}} |

Because every container belongs to **one thread on its own** and containers are only joined afterwards by the {{combiner}}, {{collect}} behaves correctly in parallel without any lock. Hence the rule: to gather data use {{collect}}, never gather into an outer variable.

### groupingBy and the downstream collector
The signature (3 overloads; the 3-argument form is the most practical):

~~~java
groupingBy(classifier)                                  // key only, default HashMap + toList
groupingBy(classifier, downstream)                      // key + "what the value of each group is"
groupingBy(classifier, mapFactory, downstream)          // key + map implementation + value of each group
~~~

The third argument is the one that actually produces a "report": it decides what each group becomes instead of a raw list of elements.

~~~java
Map<String, Long> ordersPerCustomer = orders.stream()
    .collect(Collectors.groupingBy(Order::customerId, Collectors.counting()));

Map<String, BigDecimal> amountPerCustomer = orders.stream()
    .collect(Collectors.groupingBy(Order::customerId,
        Collectors.reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add)));

Map<String, Optional<Order>> biggestOrderPerMonth = orders.stream()
    .collect(Collectors.groupingBy(Order::month,
        Collectors.maxBy(Comparator.comparing(Order::amount))));

// per sales channel: the distinct customer ids, already sorted
Map<String, Set<String>> customersPerChannel = orders.stream()
    .collect(Collectors.groupingBy(Order::channel,
        Collectors.mapping(Order::customerId, Collectors.toCollection(TreeSet::new))));
~~~

Downstream collectors you will use often: {{counting}}, {{summingInt}}/{{summingLong}}/{{summingDouble}}, {{averagingDouble}}, {{mapping(f, downstream)}} (transform the element, then gather), {{filtering(pred, downstream)}} (filter, then gather), {{minBy}}/{{maxBy}}, {{reducing}}, {{toCollection(factory)}}, {{joining(", ")}}, and a nested {{groupingBy}} (multi-level reports). To group into a thread-safe concurrent structure: {{groupingByConcurrent}}.

### Map order: HashMap, LinkedHashMap or TreeMap
{{groupingBy}} uses a map with **no guaranteed order** by default (in practice a {{HashMap}}; the {{Collector}} specification promises neither a particular implementation, nor stability across runs, nor thread-safety of the returned {{Map}}). The iteration order therefore depends on the implementation and can change when the map resizes — do not rely on it. When the report must print in a given order, choose the map implementation through mapFactory:

| Map type | Order while iterating | Extra cost | Use when |
|---|---|---|---|
| {{HashMap}} | no order at all | none | you only need lookup by key |
| {{LinkedHashMap}} | **insertion order** (you control it) | almost none | you need a custom order, e.g. a ranking by revenue |
| {{TreeMap}} | **keys** ascending according to the Comparator | O(log n) per insert | the natural key order already means something: "YYYY-MM" months, area codes |

{{TreeMap}} solves the order of the **keys**. Sorting by **value** (revenue descending) cannot be done with mapFactory, because mapFactory is only called before there is any data in it. The correct approach: collect, sort the entries, then pour them into a fresh {{LinkedHashMap}} — that is exactly exercise 1.

> Months formatted as "YYYY-MM" compare correctly as plain strings, because the year comes first and the month always has two digits. With "MM/YYYY" it is wrong (01/2025 sorts before 12/2024).

### toMap and IllegalStateException on duplicate keys
{{Collectors.toMap(Order::customerId, Order::amount)}} behaves like calling {{map.put(k, v)}} for every element, but the overload without a merge function uses {{Map.merge}} with a function that "throws on conflict": as soon as a key repeats you get {{IllegalStateException: Duplicate key ...}}.

Why did Java choose to fail instead of overwriting? Silently overwriting means the second order of the same customer **disappears** from the revenue report, and you only find out when that customer complains. Fail-fast turns that defect into an exception during dev/test.

The two correct ways to use it:

~~~java
// 1. Provide a merge function: (stored value, new value) -> value to keep
Map<String, BigDecimal> totalPerCustomer = orders.stream()
    .collect(Collectors.toMap(Order::customerId, Order::amount, BigDecimal::add));

// 2. Want to keep ALL records? Switch to groupingBy
Map<String, List<Order>> ordersByCustomer = orders.stream()
    .collect(Collectors.groupingBy(Order::customerId));
~~~

The second trap of {{toMap}}: it throws {{NullPointerException}} when the **value is null** (not the key). The reason: internally it calls {{Map.merge}}, and merge does not accept a null value. Options: filter beforehand with {{.filter(o -> o.note() != null)}}, or use {{groupingBy}} + {{toList}}, or run {{map.keySet().removeIf(k -> map.get(k) == null)}} after collecting.

### partitioningBy: both groups always exist
{{partitioningBy(predicate)}} is like {{groupingBy}}, but the key is a {{Boolean}} and **both keys are always present** in the map (a group with no elements simply has an empty list as its value). A {{groupingBy}} over a predicate can omit a key completely, so you end up writing {{getOrDefault}} everywhere.

~~~java
Map<Boolean, List<Order>> cancelled = orders.stream()
    .collect(Collectors.partitioningBy(o -> "CANCEL".equals(o.channel())));
long cancelledCount = cancelled.getOrDefault(Boolean.TRUE, List.of()).size();

// split on "big order" and compute each side's total amount at the same time
Map<Boolean, BigDecimal> amountPerTier = orders.stream()
    .collect(Collectors.partitioningBy(o -> o.amount().compareTo(new BigDecimal("1000")) > 0,
        Collectors.reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add)));
~~~
{{partitioningBy}} can only split into **two** groups; from three groups on you need {{groupingBy}} with a classification function.

### teeing: two statistics in one pass
{{Collectors.teeing(c1, c2, merger)}} (Java 12) feeds **the same stream** into two collectors, then combines the two results with {{merger}}. Use it when you need one metric derived from two other metrics, and you do not want to scan the data twice or hand-write a class that gathers the counters.

~~~java
// cancelled orders over the total number of orders
double cancellationRate = orders.stream().collect(Collectors.teeing(
    Collectors.filtering(o -> "CANCEL".equals(o.channel()), Collectors.counting()),
    Collectors.counting(),
    (cancelled, total) -> total == 0 ? 0.0 : cancelled / (double) total));
~~~

{{teeing}} can be nested to produce three metrics (exercise 2). It accepts only **two** collectors per call, so three metrics need two nesting levels plus one intermediate record.

### Quick pick table
| You want | Use |
|---|---|
| gather elements into a list | {{toList()}}/{{toUnmodifiableList()}} |
| count / sum / average per group | {{groupingBy(key, counting)}} / {{summingLong}} / {{averagingDouble}} |
| the biggest value of each group | {{groupingBy(key, maxBy(comparator))}} (value is an {{Optional}}) |
| unique keys, but the data may repeat keys | {{toMap(k, v, mergeFn)}} |
| exactly 2 groups, both always present | {{partitioningBy(pred)}} |
| keys must be sorted | mapFactory {{TreeMap::new}} |
| order by revenue | gather first, then rebuild into a {{LinkedHashMap}} |
| 2 metrics combined into 1 result | {{teeing(c1, c2, merger)}} |

> Senior tip: don't switch to {{parallelStream}} just because {{collect}} looks slow; the real bottleneck of a report is usually the loop calling the DB (N+1) or a {{toMap}} that builds a gigantic map, not the collector itself. Use {{reducing}}/{{mapping}} to cut down copies, and if you genuinely need parallelism, split by data range with a dedicated executor.

### Interview relevance
Interviewers often ask: what {{toMap}} does on a duplicate key and why Java chose to throw, how many parameters {{groupingBy}} has and which one decides the value, how to get the result map sorted by key and by value, what makes {{partitioningBy}} useful compared to {{groupingBy}}, how to use {{collect}} instead of a {{forEach}} that adds into an outer variable, and what to do when you want two statistics in a single pass. Exercise 1 tests the ordering by key and by value, exercise 2 tests {{toMap}} merge, {{partitioningBy}} and {{teeing}}.`,
    exercises: [
      {
        title: 'Multi-level revenue report, correct order on both levels',
        prompt: `Given {{record Order(String customerId, String month, String channel, BigDecimal amount)}} where {{month}} has the form "YYYY-MM". Write {{SalesReport.report(List<Order> orders)}} returning a {{Map<String, Map<String, BigDecimal>>}}: customer → (month → that customer's total amount in that month).

Requirements:
- The outer map (customers) must iterate in **descending total revenue**; when two customers have the same total, the customer id ascending.
- The inner map (months) must iterate in **ascending month** order.
- Add money with {{BigDecimal}}, never double.
- Use stream + Collectors for the grouping part; do the revenue ordering after the gathering is finished.
- An empty list gives an empty map. Customers/months with no orders must not appear.`,
        hints: [
          "For the inner level use {{Collectors.groupingBy(Order::month, TreeMap::new, Collectors.reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add))}} so the months sort themselves.",
          'You cannot sort before the totals exist: after grouping, compute the total of each customer with {{values().stream().reduce(BigDecimal.ZERO, BigDecimal::add)}}.',
          'Finally pour the results into a {{LinkedHashMap}} following the already sorted list of keys — {{HashMap}}/{{TreeMap}} do not keep that order.',
          'Compare {{BigDecimal}} with {{compareTo}}, not with {{equals}} ({{equals}} distinguishes 1.0 from 1.00).',
        ],
        explain: `This task holds two separate problems, so the solution must be split into two steps.

**Step 1 — gather and add up.** {{groupingBy(Order::customerId, downstream)}} groups the orders by customer; the downstream is another {{groupingBy}} that groups further by month and uses {{reducing(BigDecimal.ZERO, Order::amount, BigDecimal::add)}} to add the money. Here {{reducing}} extracts each value with {{Order::amount}} and joins them with {{BigDecimal::add}}, so the result is a {{BigDecimal}} rather than a {{List<Order>}}. Pass {{TreeMap::new}} as the mapFactory of the inner level so the months come out ascending.

**Step 2 — sort by value.** The outer map cannot be ordered with mapFactory, because mapFactory only builds the **empty** container before there is any data. So you have to finish collecting, compute the total of each customer (sum the values of the inner map), then insert into a {{LinkedHashMap}} in the sorted order. {{LinkedHashMap}} iterates in insertion order, so it preserves that sort exactly.

Common mistakes:
- Forgetting the secondary comparator: two customers with the same total make the order undefined and the test turns red when you change machine — always have a tie-break.
- Using {{summingDouble}} for money: {{double}} rounds, 0.1 + 0.2 gives 0.30000000000000004.
- Comparing {{BigDecimal}} with {{equals}}: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} is **false** even though the values are the same, because {{equals}} also compares the scale. You must use {{compareTo}}.
- Sorting {{grouped.entrySet()}} then collecting back with {{toMap}} without passing {{LinkedHashMap::new}} → the order is lost.
- Using {{forEach}} to add into an outer map: it works sequentially but breaks under parallel.`,
      },
      {
        title: 'toMap merge, partitioningBy and teeing in one audit record',
        prompt: `Still using {{record Order(String customerId, String month, String channel, BigDecimal amount)}}. Write the class {{OrderAudit}} with three static methods:

1. {{Map<String, BigDecimal> revenueByCustomer(List<Order> orders)}}: the total amount per customer. It must **not throw {{IllegalStateException}} on duplicate keys** (one customer can have many orders).
2. {{Map<Boolean, Long> customerCountByTier(List<Order> orders, BigDecimal threshold)}}: count the **number of customers** whose total amount is >= {{threshold}} (key {{true}}) and the number of the remaining customers (key {{false}}). Use {{toMap}} with a merge function, then {{partitioningBy}} with {{counting}} as the downstream. The map must always hold **both keys**, even when the data is empty or one group has nobody.
3. {{Audit audit(List<Order> orders)}}: a single stream pass computing three metrics — number of orders, number of distinct customers, total amount. Use {{Collectors.teeing}} (nesting allowed). {{record Audit(long orderCount, long distinctCustomers, BigDecimal total)}}.`,
        hints: [
          'Method 1: {{toMap(Order::customerId, Order::amount, BigDecimal::add)}} — the third parameter is the merge function for repeated keys.',
          'Method 2: call method 1, then {{values().stream().collect(partitioningBy(total -> total.compareTo(threshold) >= 0, counting()))}}. partitioningBy produces both keys by itself.',
          'Method 3: {{teeing}} only joins TWO collectors, so nest them: teeing(teeing(counting(), mapping(...toCollection(HashSet::new))), reducing(...), merger).',
          'Count distinct customers by gathering into a {{HashSet}} and taking its {{size}} — Java 17 has no "countingDistinct".',
        ],
        explain: `**A {{toMap}} with a merge function** is the only way to make it tolerate duplicate keys; the third parameter receives (stored value, new value). Because every customer can have several orders, leaving it out makes the report die halfway with {{IllegalStateException}}. Adding {{TreeMap::new}} keeps the key order stable (not required by the tests, but good for a report).

**{{partitioningBy}} always returns both keys**: even for an empty stream the map still has {{false}} → 0 and {{true}} → 0. This is its most practical difference from a {{groupingBy}} over a predicate, and the reason people pick it for pass/fail reports: no {{getOrDefault}} needed and no NPE risk when unboxing a {{Long}}.

**Nested {{teeing}}**: every {{teeing}} call joins only two collectors, so three metrics need two levels. The inner level combines {{counting}} (number of orders) and {{mapping(customerId, toCollection(HashSet::new))}} (the set of distinct customers) into a temporary {{long[]}}; the outer level combines that {{long[]}} with the total amount from {{reducing}} and calls the {{Audit}} constructor. Everything passes through the stream **once** instead of calling {{stream()}} three times.

Common mistakes:
- Using the three-argument {{toMap}} but mixing up the merge: its parameters are (old value, new value).
- Forgetting that {{counting}} is a downstream → the one-argument {{partitioningBy(pred)}} gives a {{Map<Boolean, List<BigDecimal>>}}, not counts.
- Counting distinct with {{distinct()}} then {{counting()}} inside the same collector does **not work** ({{counting}} does not take a stream); you have to turn the elements into a collection through {{toCollection}}/{{toSet}}.
- The one-argument {{reducing}} returns an {{Optional}}; the three-argument form has an identity, so it returns a bare value and is safe on an empty stream.
- In {{audit}} over an empty stream, {{reducing}} returns exactly {{BigDecimal.ZERO}} — without an identity you would get an empty {{Optional}} and the unboxing would throw NPE.`,
      },
    ],
    check: [
      {
        q: 'What does {{Collectors.toMap(k, v)}} do when two elements have the same key?',
        options: ['Overwrites with the new value', 'Skips the second element', 'Throws IllegalStateException', 'Returns a List holding both values'],
        explain: 'The two-argument overload uses the merge function {{throwingMerger}}, which throws IllegalStateException on a duplicate key. That is a deliberate choice: overwriting or skipping both lose records from the report without anyone noticing. To handle duplicates, supply a merge function (the third parameter) or switch to groupingBy.',
      },
      {
        q: 'Which parameter of {{groupingBy}} decides the value of each key in the result map?',
        options: ['classifier', 'mapFactory', 'the downstream collector', 'characteristics'],
        explain: 'The classifier produces the keys, mapFactory decides the map implementation (and therefore the key order), while the downstream collector decides what each group is gathered into (toList, counting, reducing, a nested groupingBy...). Characteristics describe the properties of the collector so the stream can optimise; they are not a parameter of groupingBy.',
      },
      {
        q: 'How do you make the result map iterate in ascending key order?',
        options: ['Use LinkedHashMap::new as mapFactory', 'Use TreeMap::new as mapFactory', 'Call sorted() on the stream before collect', 'Impossible, maps are always unordered'],
        explain: 'TreeMap sorts its keys by Comparator (or naturally), so the mapFactory TreeMap::new gives exactly the key order you want. LinkedHashMap keeps insertion order and does not sort keys by itself; sorted() on the stream only orders the elements, not the keys of a map built afterwards (unless the classifier already yields keys in the wanted order).',
      },
      {
        q: 'What is the practically useful difference of partitioningBy compared to groupingBy over a predicate?',
        options: ['It is faster', 'It splits into at most 3 groups', 'Both the true and false keys are always in the map', 'It returns a List instead of a Map'],
        explain: 'partitioningBy always contains both Boolean keys; a group with no elements gets an empty value (an empty list, or 0 when counting), so getOrDefault is never needed. It splits into exactly 2 groups, not 3.',
      },
    ],
  },
});
