/*
 * English translation of js/data/lessons-collections.js — task T264. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-004
 */
App.i18n.content({
  'lesson-collections-004': {
    title: 'TreeMap and NavigableMap: range lookup and Comparators consistent with equals',
    goals: [
      'Explain how TreeMap stores data in a red-black tree and why every operation is O(log n)',
      'Use {{floorEntry}}/{{ceilingEntry}}/{{lowerEntry}}/{{higherEntry}} and the {{headMap}}/{{tailMap}}/{{subMap}} views correctly',
      'Write Comparators that are consistent with {{equals}} and never overflow, and understand why a broken Comparator "loses" elements',
    ],
    body: `### TreeMap is a self-balancing binary search tree
{{TreeMap}} stores each entry in a node with a {{key}}, {{value}}, left child, right child, parent, and one color bit. The search-tree rule: every key in the left subtree is **smaller than** the node, every key in the right subtree is **larger**. To find a key, start at the root, compare, then go left or right — each step eliminates an entire branch.

Naive insertion turns sorted data into a one-sided "list" (O(n)). TreeMap uses a **red-black tree**: after every insert/delete it recolors nodes and rotates them to keep the height at most around 2·log2(n). As a result, {{get}}, {{put}}, {{remove}}, {{floorKey}}… are all **O(log n) in the worst case**. One million keys need only about 20 to 40 comparisons.

Compared to {{HashMap}} (O(1) average), TreeMap is slower and uses more memory (each node has three extra pointers), but in return it offers what HashMap cannot: **ordering** and **range queries**.

### NavigableMap: ask for "nearest" instead of "exact match"
| Method | Returns key | Example with keys 0, 100, 500 |
|---|---|---|
| {{floorKey(x)}} | greatest **≤** x | floorKey(250) = 100, floorKey(100) = 100 |
| {{lowerKey(x)}} | greatest **<** x | lowerKey(100) = 0 |
| {{ceilingKey(x)}} | least **≥** x | ceilingKey(101) = 500 |
| {{higherKey(x)}} | least **>** x | higherKey(500) = null |
| {{headMap(x, incl)}} / {{tailMap(x, incl)}} / {{subMap(a, ai, b, bi)}} | range view | tailMap(100, true) = 100, 500 |
| {{firstEntry()}} / {{pollFirstEntry()}} / {{descendingMap()}} | first, poll-and-remove, reverse order | |

The {{...Entry}} methods return the matching entry. If no key qualifies they return **null**, so you must always null-check.

The classic use case is **tier lookup**: fee schedules by amount tier, progressive tax, prices effective at a point in time, IP range lookups:

~~~java
NavigableMap<Long, Long> feeByTier = new TreeMap<>();
feeByTier.put(0L, 1_100L);              // from 0: fee 1,100
feeByTier.put(10_000_000L, 3_300L);     // from 10 million: fee 3,300
feeByTier.put(500_000_000L, 11_000L);   // from 500 million: fee 11,000
Map.Entry<Long, Long> e = feeByTier.floorEntry(25_000_000L);  // 10 million tier → 3,300
// Without a Map: linear scan or a hard-coded if/else chain in code
~~~

The views ({{headMap}}, {{subMap}}…) do **not copy**: they look straight into the backing tree, so editing the view edits the original map, and {{put}}ting a key outside the view's range throws {{IllegalArgumentException}}. Entries returned by {{floorEntry}} and similar methods are immutable snapshots: calling {{setValue}} throws {{UnsupportedOperationException}}.

### TreeMap only uses compare, never equals
This is the most important point of the lesson. TreeMap decides two keys are "equal" when {{compare(a, b) == 0}}. It **never calls** {{equals}} or {{hashCode}}. Therefore the Comparator must be **consistent with equals**: {{compare(a, b) == 0}} if and only if {{a.equals(b)}}. If you break that:

~~~java
// Comparator only compares the amount: two different transactions of 500,000 count as ONE key
Set<Txn> ranking = new TreeSet<>(Comparator.comparingLong(Txn::amount).reversed());
ranking.add(new Txn("T1", 500_000));
ranking.add(new Txn("T2", 500_000));   // compare == 0 → add returns false, T2 vanishes silently
// Fix: add a secondary criterion that uniquely distinguishes them
Comparator.comparingLong(Txn::amount).reversed().thenComparing(Txn::id);
~~~

The JDK shows the opposite example: {{new BigDecimal("1.0")}} and {{new BigDecimal("1.00")}} are **not** equals (different scale) but {{compareTo}} is 0. Put both into a {{HashSet}} and you get 2 elements; into a {{TreeSet}} and only 1 remains. With {{TreeMap.put}}, the old key is kept and only the value is overwritten.

### Common production mistakes
- **Subtraction-based Comparator**: {{(a, b) -> a.amount() - b.amount()}} overflows on large or negative values (e.g. refunds), yields the wrong sign, makes the tree order incorrectly, and lookups "miss" keys that are present. Use {{Long.compare}} or {{Comparator.comparingLong}}.
- **Mutable keys**: changing a comparison field after put leaves the key in the wrong place in the tree, {{get}} cannot find it — the same bug class as mutable keys in HashMap.
- **Null**: with natural ordering, {{put(null, v)}} throws {{NullPointerException}}. If you need nulls, use {{Comparator.nullsFirst(...)}}.
- **Forgetting to null-check** {{floorEntry}} when the amount is below the lowest tier, causing an NPE at the caller.
- **Shared across threads**: TreeMap is not thread-safe. For a concurrent NavigableMap use {{ConcurrentSkipListMap}} (a skip list, O(log n) expected, lock-free reads).

> Since Java 21, {{TreeMap}} is a {{SequencedMap}}: it has {{firstEntry()}}, {{lastEntry()}}, {{reversed()}}; but {{putFirst}}/{{putLast}} throw {{UnsupportedOperationException}} because position is decided by the Comparator.

### Interview relevance
Interviewers often ask: when to choose TreeMap over HashMap (when you need ordering or range queries), the time complexity and why (balanced red-black tree), and the classic trap "a natural-order TreeSet drops elements" to check whether you know TreeMap compares with {{compare}} and not {{equals}}. A strong answer includes a real use case such as a tiered fee schedule built on {{floorEntry}}, exactly like the exercise below.`,
    exercises: [
      {
        title: 'Tiered transfer fees with floorEntry',
        prompt: `A bank charges transfer fees in tiers: each tier starts at an amount {{fromAmount}} (inclusive) and applies up to the next tier's start. Implement {{FeeSchedule}}:

- {{addTier(fromAmount, fee)}}: add a tier; re-adding the same {{fromAmount}} overwrites the fee. Throw {{IllegalArgumentException}} when {{fromAmount < 0}}. Tiers may be added in any order.
- {{feeFor(amount)}}: the fee of the tier whose {{fromAmount}} is the **greatest that is ≤ amount**. Throw {{IllegalArgumentException}} when no such tier exists (the amount is below the lowest tier, or no tier has been added yet).
- {{nextThreshold(amount)}}: the start of the next tier **strictly greater than** {{amount}} (to tell customers "transferring X or more changes the fee"), or null when there is none.

Every operation must be O(log n).`,
        hints: [
          'Use {{TreeMap<Long, Long>}}: the key is the tier start amount, the value is the fee.',
          '{{floorEntry(amount)}} returns the greatest tier whose key is ≤ amount, or null when amount is below every key.',
          'The next "strictly greater" tier comes from {{higherKey}}, not {{ceilingKey}} (ceiling returns the amount itself when it hits a tier boundary).',
        ],
        explain: `{{floorEntry}} answers exactly the question "which tier applies to this amount", in O(log n) with no if/else chain and no list scan. Adding a new tier is a single {{put}} — no code change; in practice fee schedules are usually loaded from the database or config into an immutable TreeMap at startup.

Common mistakes:
- Using {{ceilingKey}} for {{nextThreshold}}: when amount equals a boundary exactly (10,000,000), ceiling returns the amount itself instead of the next tier.
- Forgetting to check that {{floorEntry}} returns null: causes {{NullPointerException}} on unboxing instead of a clear business error.
- Using a {{HashMap}} and scanning every key to find the tier: correct but O(n), and with unpredictable iteration order if written carelessly.
- Using {{double}} for money: always use {{long}} (smallest unit) or {{BigDecimal}}.`,
      },
      {
        title: 'A transaction ranking Comparator consistent with equals',
        prompt: `A monitoring system needs a transaction ranking by **amount, descending**, using {{TreeSet<Txn>}}. The current version uses {{Comparator.comparingLong(Txn::amount).reversed()}} and reports **missing transactions** whenever two transactions share the same amount.

Implement {{Rankings.byAmountDesc()}} returning a Comparator that:
- Orders larger amounts first. Amounts may be negative (refunds) and may be {{Long.MIN_VALUE}}/{{Long.MAX_VALUE}}: there must be no overflow.
- For equal amounts, the smaller {{id}} (alphabetical order) comes first.
- Is consistent with the record's {{equals}}: {{compare(a, b) == 0}} if and only if {{a.equals(b)}}.`,
        hints: [
          'Start from {{Comparator.comparingLong(Txn::amount).reversed()}}; it uses {{Long.compare}}, so extreme values are safe.',
          'Add {{.thenComparing(Txn::id)}}: two transactions are only "equal" when both amount and id match — exactly the record equals.',
        ],
        explain: `TreeSet treats two elements as duplicates when {{compare == 0}}, so a Comparator that only compares the amount makes the second transaction with the same amount get {{add}} returning false and silently vanish from the report — with no exception. Adding the unique {{id}} as a secondary criterion makes the Comparator consistent with equals.

Order in the chain matters: {{comparingLong(...).reversed().thenComparing(Txn::id)}} reverses only the amount. Writing {{comparingLong(...).thenComparing(Txn::id).reversed()}} reverses the id as well (T3 before T1).

Common mistakes:
- {{(a, b) -> (int) (b.amount() - a.amount())}}: the difference of two longs can overflow, and casting to int drops the high 32 bits, so 3,000,000,000 compared against 0 can come out negative. The result: a wrongly ordered tree, {{contains}} returning false for elements that are present, and {{Collections.sort}} sometimes throwing "Comparison method violates its general contract".
- Writing {{-Long.compare(a, b)}} by hand is still correct, but negating {{-a.compareTo(b)}} with a hand-written compareTo that returns {{Integer.MIN_VALUE}} yields the same value again. Prefer {{reversed()}} or swapping the arguments {{Long.compare(b, a)}}.`,
      },
    ],
    check: [
      {
        q: 'Adding {{new BigDecimal("1.0")}} and {{new BigDecimal("1.00")}} to a {{HashSet}} and a {{TreeSet}}. What is the size of each set?',
        options: ['HashSet 1, TreeSet 1', 'HashSet 2, TreeSet 2', 'HashSet 2, TreeSet 1', 'HashSet 1, TreeSet 2'],
        explain: `{{BigDecimal.equals}} compares both the value and the scale, so "1.0" and "1.00" differ — and their hashCodes differ too: the HashSet keeps 2. {{compareTo}} compares only the value and returns 0: the TreeSet treats them as duplicates and keeps 1. This is the classic example of a natural ordering that is **not** consistent with equals. The other options assume both sets use the same comparison criterion, which is false.`,
      },
      {
        q: 'A TreeMap has keys 0, 100, 500. What do {{floorKey(100)}} and {{lowerKey(100)}} return respectively?',
        options: ['100 and 0', '0 and 0', '100 and 100', '100 and null'],
        explain: `floor is "greatest ≤ x" so it returns 100 itself; lower is "greatest < x" (strict) so it returns 0. null only occurs when no key is smaller, e.g. {{lowerKey(0)}}. Confusing floor with lower is a common boundary bug in tiered fee calculations.`,
      },
      {
        q: 'A Comparator {{(a, b) -> (int) (a.amount() - b.amount())}} where {{amount}} is a long. What is the problem?',
        options: ['No problem, just slower than Long.compare', 'The subtraction can overflow and the cast truncates bits, yielding the wrong sign so TreeMap/sort misbehave', 'Compile error because the lambda does not return int', 'Only wrong when amount is 0'],
        explain: `The difference of two longs can exceed the long range (e.g. MAX minus a negative), and casting to int drops the high 32 bits: a difference of 3,000,000,000 becomes a negative number. The wrong sign violates the compare contract: the tree is ordered incorrectly, keys cannot be found, and sort may throw IllegalArgumentException. The lambda has an {{(int)}} cast so it compiles fine; a difference of 0 is the most harmless case.`,
      },
    ],
  },
});
