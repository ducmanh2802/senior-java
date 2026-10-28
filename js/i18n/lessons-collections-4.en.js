/* 
 * English translation of js/data/lessons-collections.js - task T306 review. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-004
 */
App.i18n.content({
  'lesson-collections-004': {
    title: 'TreeMap and NavigableMap: range lookup and Comparator consistency with equals',
    goals: [
      'Explain how TreeMap stores data in a red-black tree and why every operation is O(log n)',
      'Use floorEntry/ceilingEntry/lowerEntry/higherEntry correctly, along with the headMap/tailMap/subMap views',
      'Write a Comparator consistent with equals, avoid overflow, and understand why a wrong Comparator "loses" elements',
    ],
    body: `### TreeMap is a self-balancing binary search tree
{{TreeMap}} stores each entry in a node with {{key}}, {{value}}, left child, right child, parent and a color bit. BST rule: every key in the left branch is **less than** the node, every key in the right branch is **greater than**. To find a key, start at the root, compare, then go left or right; each step discards a whole branch.

With naive insertion, already-sorted data turns the tree into a one-sided "list" (O(n)). TreeMap uses a **red-black tree**: after each insert/delete it recolors and rotates nodes to keep height at most about 2·log2(n). Result: {{get}}, {{put}}, {{remove}}, {{floorKey}}... are all **O(log n) in the worst case**. One million keys need only about 20 to 40 comparisons.

Compared with {{HashMap}} (O(1) average), TreeMap is slower and uses more memory (3 extra pointers per node), but in return it offers what HashMap lacks: **ordering** and **range lookup**.

### NavigableMap: asking "nearest" instead of "exact"


| Method | Returns key | Example with keys 0, 100, 500 |
|---|---|---|
| {{floorKey(x)}} | greatest **≤** x | floorKey(250) = 100, floorKey(100) = 100 |
| {{lowerKey(x)}} | greatest **<** x | lowerKey(100) = 0 |
| {{ceilingKey(x)}} | smallest **≥** x | ceilingKey(101) = 500 |
| {{higherKey(x)}} | smallest **>** x | higherKey(500) = null |
| {{headMap(x, incl)}} / {{tailMap(x, incl)}} / {{subMap(a, ai, b, bi)}} | view by range | tailMap(100, true) = 100, 500 |
| {{firstEntry()}} / {{pollFirstEntry()}} / {{descendingMap()}} | first, remove-and-return-first, reversed | |

The {{...Entry}} methods return the corresponding entry. If no key matches, they return **null**, so always check for null.

The classic problem is **tiered lookup**: fee by amount tier, progressive tax, price effective at a time, IP range:

~~~java
NavigableMap<Long, Long> feeByTier = new TreeMap<>();
feeByTier.put(0L, 1_100L);              // from 0: fee 1,100
feeByTier.put(10_000_000L, 3_300L);     // from 10 million: fee 3,300
feeByTier.put(500_000_000L, 11_000L);   // from 500 million: fee 11,000
Map.Entry<Long, Long> e = feeByTier.floorEntry(25_000_000L);  // tier 10 million -> 3,300
// Without Map: linear scan or hard-coded if/else chain
~~~

The views ({{headMap}}, {{subMap}}...) **do not copy**: they look straight at the underlying tree; modifying a view modifies the original map, and {{put}}ting a key outside the view's range throws {{IllegalArgumentException}}. The entry returned by {{floorEntry}} and similar methods is an immutable snapshot: calling {{setValue}} throws {{UnsupportedOperationException}}.

### TreeMap uses compare, never equals
This is the most important point of the lesson. TreeMap decides two keys are "equal" when {{compare(a, b) == 0}}. It **never calls** {{equals}} or {{hashCode}}. Therefore the Comparator must be **consistent with equals**: {{compare(a, b) == 0}} if and only if {{a.equals(b)}}. Violating it:

~~~java
// Comparator compares only amount: two different transactions with the same 500,000 are treated as ONE key
Set<Txn> ranking = new TreeSet<>(Comparator.comparingLong(Txn::amount).reversed());
ranking.add(new Txn("T1", 500_000));
ranking.add(new Txn("T2", 500_000));   // compare == 0 -> add returns false, T2 disappears silently
// Fix: add a secondary criterion that uniquely identifies the element
Comparator.comparingLong(Txn::amount).reversed().thenComparing(Txn::id);
~~~

The reverse example in the JDK: {{new BigDecimal("1.0")}} and {{new BigDecimal("1.00")}} are **not** equals (different scale) but {{compareTo}} is 0. Put both in a {{HashSet}} you get 2 elements, in a {{TreeSet}} only 1. With {{TreeMap.put}}, the old key is kept and only the value is overwritten.

### Common production pitfalls
- **Comparator by subtraction**: {{(a, b) -> a.amount() - b.amount()}} overflows when values are large or negative (e.g. refunds), giving the wrong sign, so the tree is sorted incorrectly and lookups "cannot find" a key that is present. Use {{Long.compare}}, {{Comparator.comparingLong}}.
- **Mutable key**: changing a field that participates in comparison after put places the key in the wrong position in the tree; {{get}} cannot find it, same as the mutable-key bug in HashMap.
- **Null**: with natural ordering, {{put(null, v)}} throws {{NullPointerException}}. Use {{Comparator.nullsFirst(...)}} if null is needed.
- **Forgetting the null check** of {{floorEntry}} when the value is below the lowest tier, causing NPE in the caller.
- **Shared across threads**: TreeMap is not thread-safe. For a concurrent NavigableMap use {{ConcurrentSkipListMap}} (skip list, expected O(log n), no lock on read).

> Since Java 21, {{TreeMap}} is a {{SequencedMap}}: it has {{firstEntry()}}, {{lastEntry()}}, {{reversed()}}; but {{putFirst}}/{{putLast}} throw {{UnsupportedOperationException}} because the position is decided by the Comparator.

### Interview relevance
Interviewers ask: when to choose TreeMap over HashMap (need ordering or range query), the complexity and why (balanced red-black tree), and the trap "TreeSet naturally loses elements" to see whether you know TreeMap compares via {{compare}}, not {{equals}}. A good answer includes a real use case such as tiered fees using {{floorEntry}}, exactly like the exercise below.
`,
    exercises: [
      {
        title: 'Tiered transfer fee by amount using floorEntry',
        prompt: `A bank charges transfer fees by tier: each tier starts at an amount {{fromAmount}} (inclusive) and applies up to the next tier's start. Write {{FeeSchedule}}:

- {{addTier(fromAmount, fee)}}: add a tier; adding again with the same {{fromAmount}} overwrites the fee. {{fromAmount < 0}} throws {{IllegalArgumentException}}. Tiers may be added in any order.
- {{feeFor(amount)}}: the fee of the tier whose {{fromAmount}} is the **largest that is ≤ amount**. If no such tier exists (amount below the lowest tier, or no tiers yet) throw {{IllegalArgumentException}}.
- {{nextThreshold(amount)}}: the start of the **strictly greater** tier than {{amount}} (to tell the customer "from X the fee changes"), or null if none.

Every operation must be O(log n).`,
        hints: [
          'Use {{TreeMap<Long, Long>}}: key is the tier start amount, value is the fee.',
          '{{floorEntry(amount)}} returns the entry with the greatest key ≤ amount, or null if amount is below the lowest tier.',
          'The tier strictly greater than amount is {{higherKey}}, not {{ceilingKey}} (ceiling includes amount itself).',
        ],
        explain: `{{floorEntry}} is exactly the question "which tier applies to this amount", answered in O(log n) without an if/else chain or a list scan. Adding a tier is just a {{put}}; in practice the fee schedule is usually loaded from the DB or config into an immutable TreeMap at startup.

Common mistakes:
- Using {{ceilingKey}} for {{nextThreshold}}: when amount exactly equals a tier start (10,000,000), ceiling returns that same tier instead of the next one.
- Forgetting that {{floorEntry}} can return null: causes {{NullPointerException}} on unboxing instead of a clear business error.
- Using {{HashMap}} then scanning all keys to find the tier: correct result but O(n) and depends on iteration order if written carelessly.
- Using {{double}} for money: always use {{long}} (smallest unit) or {{BigDecimal}}.`,
      },
      {
        title: 'Ranking transactions with a Comparator consistent with equals',
        prompt: `The monitoring system needs a ranking of transactions by **amount descending** using {{TreeSet<Txn>}}. The current version uses {{Comparator.comparingLong(Txn::amount).reversed()}} and the report is **missing transactions** whenever two transactions share the same amount.

Write {{Rankings.byAmountDesc()}} returning a Comparator that:
- Sorts by amount descending.
- Treats two transactions as equal only when they have the **same amount AND the same id** (consistent with the record's equals).

{{Txn}} is a record {{(String id, long amount)}}.`,
        hints: [
          'Start from {{Comparator.comparingLong(Txn::amount).reversed()}}; it uses {{Long.compare}} so it is safe with extreme values.',
          'Add {{.thenComparing(Txn::id)}}: two transactions are "equal" only when both amount and id match, exactly like the record\'s equals.',
        ],
        explain: `TreeSet treats two elements as duplicates when {{compare == 0}}, so a Comparator that compares only amount makes the second transaction with the same amount have {{add}} return false and disappear from the report, with no exception. Adding the secondary criterion {{id}} (unique) makes the Comparator consistent with equals.

The order in the chain matters: {{comparingLong(...).reversed().thenComparing(Txn::id)}} reverses only the amount. If you write {{comparingLong(...).thenComparing(Txn::id).reversed()}} the id is reversed too (T3 before T1).

Common mistakes:
- {{(a, b) -> (int) (b.amount() - a.amount())}}: the difference of two longs can overflow, and casting to int drops the high 32 bits, so 3,000,000,000 vs 0 can become negative. Result: the tree is sorted in the wrong place, {{contains}} returns false for an element that is present, and {{Collections.sort}} may throw "Comparison method violates its general contract".
- Hand-writing {{-Long.compare(a, b)}} is still correct, but {{-a.compareTo(b)}} when a hand-written compareTo returns {{Integer.MIN_VALUE}} keeps the same value after negation. Use {{reversed()}} or swap the arguments {{Long.compare(b, a)}} for safety.`,
      },
    ],
    check: [
      {
        q: 'You add {{new BigDecimal("1.0")}} and {{new BigDecimal("1.00")}} to a {{HashSet}} and a {{TreeSet}}. What is the size of each set?',
        options: [
          'HashSet 1, TreeSet 1',
          'HashSet 2, TreeSet 2',
          'HashSet 2, TreeSet 1',
          'HashSet 1, TreeSet 2',
        ],
        answer: 2,
        explain: '{{BigDecimal.equals}} compares both value and scale, so "1.0" and "1.00" differ and have different hashCode: HashSet keeps 2. {{compareTo}} compares only value and returns 0: TreeSet treats them as duplicates and keeps 1. This is the classic example of natural ordering **not** being consistent with equals. The other options assume both sets use the same comparison criterion, which is not true.',
      },
      {
        q: 'TreeMap has keys 0, 100, 500. What do {{floorKey(100)}} and {{lowerKey(100)}} return respectively?',
        options: [
          '100 and 0',
          '0 and 0',
          '100 and 100',
          '100 and null',
        ],
        answer: 0,
        explain: 'floor is "greatest ≤ x" so it returns 100 itself; lower is "greatest < x" (strict) so it returns 0. null only happens when no key is smaller, e.g. {{lowerKey(0)}}. Confusing floor with lower is a common off-by-one error when computing tiered fees.',
      },
      {
        q: 'Comparator {{(a, b) -> (int) (a.amount() - b.amount())}} with {{amount}} of type long. What is the problem?',
        options: [
          'No problem, just slower than Long.compare',
          'The subtraction can overflow and the cast truncates bits, giving the wrong sign so TreeMap/sort behave incorrectly',
          'Compile error because the lambda does not return int',
          'Only wrong when amount is 0',
        ],
        answer: 1,
        explain: 'The difference of two longs can exceed the long range (e.g. MAX and a negative), and casting to int drops the high 32 bits: a difference of 3,000,000,000 becomes negative. The wrong sign violates the compare contract: the tree is sorted in the wrong place, lookups fail to find a present key, and sort may throw IllegalArgumentException. The lambda compiles fine because of the {{(int)}} cast; and 0 is the least problematic value.',
      },
    ],
  },
});
