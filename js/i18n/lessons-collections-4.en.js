/*
 * English translation of js/data/lessons-collections.js — task T264. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-004
 */
App.i18n.content({
  'lesson-collections-004': {
    title: 'TreeMap and NavigableMap: range lookup and consistent Comparator with equals',
    goals: [
      'Explain the difference between TreeMap and HashMap for sorted access',
      'Describe how NavigableMap methods (headMap, tailMap, lowerKey, higherKey) work',
      'Understand the contract of Comparator.compare vs equals for sorting',
    ],
    body: `### Overview
TreeMap implements NavigableMap using a red‑black tree, providing O(log n) operations for ordered key access. Unlike HashMap, keys are sorted according to their natural ordering or a Comparator supplied at creation time.

### Key operations
- {{lowerKey(key)}}: returns the greatest key strictly less than the given key, or null if no such key.
- {{higherKey(key)}}: returns the least key strictly greater than the given key, or null.
- {{ceilingKey(key)}}: returns the least key greater than or equal to the given key.
- {{floorKey(key)}}: returns the greatest key less than or equal to the given key.

### NavigableMap view methods
- {{headMap(toKey)}}: returns a view containing keys strictly less than toKey.
- {{tailMap(fromKey)}}: returns a view containing keys greater than or equal to fromKey.
- {{subMap(fromKey, toKey)}}: returns a view containing keys from fromKey (inclusive) to toKey (exclusive).

### Comparator and equals
The ordering is determined by the Comparator supplied to the TreeMap constructor, or by the natural ordering of keys (Comparable.compareTo). The contract requires that comparator.compare(a,b) == 0 iff a.equals(b). Violating this contract leads to unpredictable behavior, especially with sorted sets and maps.

### Performance
All operations are O(log n). The tree may be rebalanced during insertions/deletions, but the sorted property is always maintained.

### When to use
Use TreeMap when you need sorted iteration, range queries, or navigation methods. Use HashMap when you only need key‑value lookup without ordering.

### When not to use
Avoid TreeMap for high‑throughput simple lookups; HashMap or ConcurrentHashMap will be faster and use less memory.
`,
    exercises: [],
    check: [],
    related: ['collections-003', 'collections-005', 'concurrency-001'],
    tags: ['TreeMap', 'NavigableMap', 'Comparator'],
  },
});