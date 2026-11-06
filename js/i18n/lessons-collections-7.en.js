/*
 * English translation of js/data/lessons-collections.js - task T800. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-007
 */
App.i18n.content({
  'lesson-collections-007': {
    title: 'Sorting in Java: Comparable or Comparator, stable TimSort and the "violates its general contract" error',
    goals: [
      'Tell apart {{Comparable}} (the natural order, exactly one) and {{Comparator}} (a strategy, as many as you like), and pick the right one for each class',
      'Explain TimSort: stable, adaptive to nearly sorted data, and the three comparator contract conditions',
      'Write a comparator that does not overflow, survives {{null}} without an NPE, and carries a tie-breaker so the result is deterministic',
      'Sort large data correctly: external merge sort, pushing {{ORDER BY}} down to the DB, and why the tie-breaker also decides pagination',
    ],
    body: `### Two ways to say "sort by what"
{{Comparable<T>}} is the **natural order** of the class itself: a class has exactly one, and it is the order used by {{list.sort()}} and by {{TreeMap}}/{{TreeSet}} (when you pass no comparator). {{Comparator<T>}} is a strategy **bought from outside**: you may have as many as you want and you do not have to touch the class being sorted — it is also the only option when you sort {{String}}, {{Instant}} or an entity from a library whose source you cannot edit.

~~~java
record Transfer(String id, long amountCents, Instant createdAt) implements Comparable<Transfer> {
    @Override public int compareTo(Transfer o) {
        return Long.compare(amountCents, o.amountCents);   // NEVER write (int)(a - b): subtracting two longs and casting back to int overflows
    }
}

// Closing report: amount descending; equal amount means the earlier created one comes first; still equal then by id
static final Comparator<Transfer> REPORT =
        Comparator.comparingLong(Transfer::amountCents).reversed()
                  .thenComparing(Transfer::createdAt)
                  .thenComparing(Transfer::id);

List<Transfer> rows = load();
rows.sort(REPORT);                       // Java 8+: List.sort; Collections.sort(rows, REPORT) is equivalent
~~~

The choice is not vague: if **the whole system** treats one order as the default (id, timestamp, severity), put it in {{Comparable}}. If the order depends on a screen, a report, a user, use a {{Comparator}}. Do not push one screen's order into {{Comparable}} and change your mind later: every {{TreeMap}} already built on the old order has to be rebuilt from scratch.

### TimSort: what {{List.sort}} actually runs
{{ArrayList.sort}} and {{Arrays.sort(Object[])}} (Java 7+) use **TimSort**: it scans for stretches that are already sorted ({{run}}), lengthens the short runs with binary insertion sort, then **merges** the runs. Three properties you should know by heart:

- **Stable**: two elements for which the comparator returns 0 keep the relative order they had in the input. The practical consequence: sorting by salary over a list already sorted by name leaves people with equal pay alphabetical; and to "sort by several criteria" you can simply sort from the secondary criterion up to the primary one.
- **Adaptive**: nearly sorted input runs close to O(n); the worst case is still O(n log n) and it needs scratch memory of about n/2.
- **It is only the algorithm of {{List.sort}}**, not of {{PriorityQueue}}. The heap is **not stable**: two jobs with the same priority come out in an order that depends on their position in the heap array, which means it is not reproducible between two runs.

The warning interviewers love to ask about: {{Arrays.sort(int[])}}/{{Arrays.sort(long[])}} use **dual-pivot quicksort** and are **not stable**. Only sorting objects (arrays of wrappers, {{List}}) is guaranteed stable.

### The three contract conditions, and why the error only explodes in production
A Comparator must define a **weak total order** (total preorder). For every {{x, y, z}}:

~~~text
1) symmetry:                sgn(compare(x, y)) == -sgn(compare(y, x))
2) transitivity:            compare(x, y) > 0  and  compare(y, z) > 0  =>  compare(x, z) > 0
3) transitivity of equivalence: compare(x, y) == 0 => sgn(compare(x, z)) == sgn(compare(y, z))
~~~

TimSort merges the runs assuming this holds. When it can no longer find a legal insertion point it **stops and throws** {{IllegalArgumentException: Comparison method violates its general contract!}}. The part that makes people paranoid: the blow-up **depends on the data and the size**. A list of 5 elements may never throw; 10,000 elements that are "nearly sorted" will. That is why this class of bug usually appears for the first time in production and not in a unit test.

Four common sources of the bug:
1. **Subtracting numbers then casting to int**: {{(int) (a.amount - b.amount)}} — a true difference of 3,000,000,000 gets chopped into a negative number; with {{int}} it overflows too, because {{Integer.MIN_VALUE - 1}} is a positive number. Use {{Integer.compare}}, {{Long.compare}}, {{Comparator.comparingLong}}.
2. **{{double}}/{{float}} and {{NaN}}**: every comparison with {{NaN}} is false, so symmetry is broken. Use {{Double.compare}} and filter out {{NaN}}/{{Infinity}} before sorting.
3. **A key that changes while sorting**: the comparator reads a field another thread is writing, or calls {{LocalDate.now()}}, or recomputes an expensive value (a price fetched from the DB). The result is no longer a function of the two arguments. The fix: materialise the key before sorting — turn each element into a {{record Keyed(long key, DomainItem item)}} and sort on {{key}}.
4. **{{reversed()}} in the wrong place**: {{comparing(a).thenComparing(b).reversed()}} flips **both** criteria. To flip only one, write {{comparing(a).reversed().thenComparing(b)}}.

### Numbers, null, strings and Vietnamese
| Need | The correct way |
|---|---|
| {{int}}/{{long}}/{{double}} | {{comparingInt}}, {{comparingLong}}, {{comparingDouble}} — or {{Integer.compare}}…; never subtract |
| {{boolean}}, urgent ones first | {{comparingInt(x -> x.isUrgent() ? 0 : 1)}} or {{Comparator.comparing(X::isUrgent).reversed()}} |
| A key that may be null | {{Comparator.nullsLast(Comparator.naturalOrder())}} on the **comparator itself**, {{Comparator.comparing(f, Comparator.nullsLast(naturalOrder()))}} when the **field** is null |
| Ignore upper/lower case | {{String.CASE_INSENSITIVE_ORDER}} or {{Comparator.comparing(X::name, String.CASE_INSENSITIVE_ORDER)}} |
| Vietnamese / multilingual | {{Collator.getInstance(Locale.forLanguageTag("vi"))}}, wrapped as {{Comparator.comparing(X::name, collator)}} |

{{String.compareTo}} compares by **UTF-16 code unit**, so "Zoo" sorts before "apple", and the accented Vietnamese letters ("á", "à", "ả") sit far away from the base letter. On top of that, a composed "é" (NFD: {{e}} + acute accent, two code points) and a precomposed "é" (NFC: a single code point) look exactly the same yet {{compareTo}} returns **non-zero** — one data source that normalises the other way is enough for key joining, sorting and {{contains}} to go silently wrong. For user names: {{Normalizer.normalize(s, Normalizer.Form.NFC)}} and then compare with a {{Collator}}.

### Sorting then paginating: the same bug at two layers
The same "you must have a tie-breaker" condition applies to {{ORDER BY}} in the database. If the order is not determined, two runs of the same query can return a different order between one page and the next, and the result is one record appearing **twice** while another record **never** appears:

~~~seq
title: Pagination without a tie-breaker
actors: Client | API | DB
Client -> API: GET /txns?page=1
API -> DB: ORDER BY amount DESC LIMIT 20
DB --> API: 20 rows, many rows with equal amount
API --> Client: page 1
Client -> API: GET /txns?page=2
API -> DB: ORDER BY amount DESC LIMIT 20 OFFSET 20
DB --> API: the order among equal rows may differ from run 1
API --> Client: 1 duplicated row, 1 missing row
note API..DB: Add a tie-breaker: ORDER BY amount DESC, id
~~~

In the app the equivalent is: an "incomplete" comparator plus {{subList(page*size, ...)}}, or re-sorting a list that changed while the user was flipping pages. The fix is always to append a unique key at the end of the comparator / of {{ORDER BY}}.

### Data that does not fit in RAM
- **Push it down to where the data lives**: {{ORDER BY}} in the DB with cursor pagination ({{WHERE (amount, id) < (:a, :i)}}), or sorting inside Elasticsearch/Spark.
- **External merge sort**: read a chunk that fits in memory, sort it with TimSort, write it to a temp file; then merge the K files with **one {{PriorityQueue}} holding the head of each file** (see lesson lesson-collections-005). Total O(n log K) time, O(K) memory.
- **Only need the top K**: do not sort everything. Keep a min-heap of K elements: O(n log K) time and O(K) memory.
- If you really must sort in place over a huge list, remember that {{List.sort}} needs scratch memory, and every {{Long}}/{{Integer}} element inside a {{List}} also costs 16 bytes for its object wrapper.

> What actually breaks in production: {{List.of(...).sort(cmp)}} and {{Collectors.toUnmodifiableList().sort(...)}} throw {{UnsupportedOperationException}}, because an immutable list does not allow {{set}} — you must copy first: {{new ArrayList<>(immutable)}} and then sort. Conversely, {{Arrays.asList(...)}} **is sortable** (it is a fixed-size view of an array that does allow {{set}}), and that sort also changes the original array — a trap nobody expects: "why did my source list change?".

### Interview relevance
Questions you do get asked: "Compare {{Comparable}} and {{Comparator}}, when do you use which?" — you must say that {{Comparable}} is the single natural order and that {{TreeMap}} uses it when nothing is passed; "Is sort stable, what does stable mean, and where is it not?" — TimSort is stable, the heap and {{Arrays.sort(int[])}} are not; "Write a comparator for {{long}}, why not subtract?" — because of overflow; "What does 'Comparison method violates its general contract' mean and how do you debug it?" — point at the 3 contract conditions, explain why it depends on the data, and describe how you isolate the comparator and fuzz it with random triples; "10 million rows, sort in 2 GB of RAM?" — external merge sort, or push it down to the DB. Related questions: collections-013, collections-020, collections-030.`,
    exercises: [
      {
        title: 'A total-order comparator for a leaderboard',
        prompt: `{{Ordering}} is the only place where the leaderboard display order is defined. Write two things:

- {{byScore()}} returns a {{Comparator<Player>}}: {{points}} **descending**; on equal points {{penalties}} **ascending** (fewer penalties first); still equal then {{id}} **ascending**. The last criterion must make sure the comparator returns 0 only when two objects are identical on those three criteria, so that {{List.sort}} never has to guess an order.
- {{sorted(players)}} returns a **new list** ordered by {{byScore()}}, keeps the relative order of the remaining equal elements, **must not modify** the input list, and **skips** {{null}} elements in the input (it must not throw {{NullPointerException}}).

Technical constraints: {{points}} is a {{long}}, so any subtraction followed by a cast to {{int}} is forbidden; your comparator must run safely with {{Long.MIN_VALUE}} and {{Long.MAX_VALUE}}.`,
        hints: [
          'Use {{Comparator.comparingLong(Player::points).reversed()}}, do not write {{(int) (a.points() - b.points())}}.',
          'The {{thenComparing}} chain applies from left to right; put {{reversed()}} right after {{comparingLong}} so that only the points criterion is flipped.',
          '{{sorted}}: build a new {{ArrayList}} and {{sort}} that list. Calling {{players.sort(...)}} modifies the caller list; {{new ArrayList<>(players)}} still keeps the {{null}} elements, so you must filter them out.',
        ],
        explain: `{{comparingLong}} and {{thenComparingInt}} call {{Long.compare}}/{{Integer.compare}} internally, so they can never overflow; that is why the Javadoc of {{Comparator}} advises never comparing numbers by subtraction. The {{id}} tie-breaker turns the order into a **total** one: the comparator returns 0 for no two different players, so the sorted result does not depend on the input order — the precondition for paginating the list with {{subList}}.

{{reversed()}} placed in the middle flips only the criteria before it. Writing {{comparingLong(points).thenComparingInt(penalties).reversed()}} flips penalties as well, into "most penalised first" — a bug that is very hard to spot in code review.

Two mistakes people make in {{sorted}}: {{return players.stream().sorted(cmp).toList()}} is right, but {{players.sort(cmp)}} changes the caller list; and {{new ArrayList<>(players).removeAll(List.of(null))}} works, yet do not use that in production code because it reads as if the data were being edited.

If the list is so large that sorting takes over the RAM, do not make yet another copy: sort over an index array ({{Integer[]}} pointing into the original list) or push {{ORDER BY}} down to the DB.`,
      },
      {
        title: 'Stable sort and dense rank for a job queue',
        prompt: `The input is a list of jobs **already in submission order** ({{submittedAt}} ascending). Write:

- {{byPriority(jobs)}}: a **new** list, ordered by {{priority}} descending, using **only** that criterion. Because {{List.sort}} is stable, two jobs with the same {{priority}} must come out in submission order — this is exactly what the test asks you to prove (a {{PriorityQueue}} is not stable and will fail). You must not modify the input list.
- {{rankByPriority(jobs)}}: a map {{id -> rank}} in the **dense rank** style: the highest priority is rank 1, all jobs with the same priority **share that rank**, and the next rank is rank + 1 however large the priority gap is (100, 50, 50, 1 → 1, 2, 2, 3). You must not modify the input; a repeated {{id}} gets a single rank.

{{priority}} is an {{int}}, it may be negative, it may be {{Integer.MIN_VALUE}} or {{Integer.MAX_VALUE}}.`,
        hints: [
          '{{copy.sort(cmp)}}, not {{new PriorityQueue<>(cmp)}}: the heap is not stable, two jobs with the same priority come out in an order that depends on how they sift up.',
          'Compare {{int}} with {{Integer.compare(y.priority(), x.priority())}} to sort descending without overflow.',
          '{{rankByPriority}}: loop over the sorted list and increase {{rank}} only when the priority changes; use a {{LinkedHashMap}} if you also want the map iteration order to follow the rank.',
        ],
        explain: `This exercise has two layers. The first layer is **stability**: the comparator deliberately returns 0 for every pair with the same priority, so the input order is what decides — precisely what {{List.sort}} (TimSort) promises and {{PriorityQueue}} does not. This is stability used in real life: sorting by salary over a list already sorted by name, or "jobs submitted earlier are handled first within the same priority".

The second layer is **dense rank**: the rank only increases when the priority changes, so a gap in scores (100 versus 1) does not skip a rank. For "competition rank" (1, 2, 2, 4) you add the number of elements already seen instead of 1.

The classic mistake: writing {{x.priority() - y.priority()}} instead of {{Integer.compare}} — with {{Integer.MIN_VALUE}} the subtraction overflows into a positive number, the comparator loses transitivity, and {{List.sort}} may throw {{IllegalArgumentException: Comparison method violates its general contract}}. If you do not want to rely on the stability of {{List.sort}} (because someone may change how the sorting is done, or you need identical results on every machine), add {{thenComparingLong(Job::submittedAt)}} so the order becomes absolutely determined.`,
      },
    ],
    check: [
      {
        q: 'A {{List<Job>}} is already sorted by {{name}} ascending. You {{sort}} it again by {{score}} descending using a comparator that only contains {{score}}. For two jobs with the same {{score}}, what is the resulting order?',
        options: [
          'Random, because sort guarantees nothing',
          'The {{name}} order is kept, because {{List.sort}} uses stable TimSort',
          'Always the original insertion order, from before the sort by name',
          'Java adds a tie-breaker on {{hashCode}} by itself',
        ],
        explain: `{{List.sort}}/{{Collections.sort}} (on objects) use TimSort and are specified as **stable**: elements that compare equal keep their relative order from the input, so the list still carries the "mark" of the sort by name. To stop depending on that, add a tie-breaker to the comparator. {{PriorityQueue}} is not stable.`,
      },
      {
        q: 'What is wrong with the comparator {{(a, b) -> (int) (a.longField - b.longField)}}?',
        options: [
          'Nothing, it is only slightly slower',
          'The {{long}} difference is cast to {{int}}: two values more than 2^31 apart produce the wrong sign, which breaks transitivity and can throw "Comparison method violates its general contract" during the sort',
          'It is only wrong when one of the two values is negative',
          'It does not compile because the lambda has no types',
        ],
        explain: `Casting {{long}} to {{int}} keeps the low 32 bits, so {{Long.MAX_VALUE}} becomes -1 and the sign is wrong. The consequence is not only a scrambled order but also an {{IllegalArgumentException}} from TimSort, and because the blow-up depends on the data it may only happen in production. The correct form is {{Comparator.comparingLong(X::longField)}} or {{Long.compare}}.`,
      },
      {
        q: 'Why does {{List.of("b", "a").sort(Comparator.naturalOrder())}} throw, while {{Arrays.asList("b", "a").sort(Comparator.naturalOrder())}} runs fine?',
        options: [
          'Because {{List.of}} does not accept a natural {{Comparator}}',
          'Because {{List.of}} returns an immutable list: {{sort}} has to write elements back with {{set}}, and {{set}} throws {{UnsupportedOperationException}}; {{Arrays.asList}} forbids adding/removing but allows {{set}}',
          'Because {{Arrays.asList}} returns a copy, so it is always safe',
          'Because {{sort}} only works on {{ArrayList}}',
        ],
        explain: `{{List.sort}} is implemented by reading the elements into an array, sorting it, then writing each position back through {{set}}. The immutable lists of {{List.of}}, {{copyOf}}, {{toUnmodifiableList}} block {{set}}, so they throw {{UnsupportedOperationException}} — you must copy into an {{ArrayList}} first. {{Arrays.asList}} is a **fixed-size view** of an array: {{add}}/{{remove}} are forbidden but {{set}} is allowed, so the sort runs and changes the backing array as well. {{nullsLast}} has nothing to do with this.`,
      },
    ],
  },
});
