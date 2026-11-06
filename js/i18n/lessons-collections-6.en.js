/*
 * English translation of js/data/lessons-collections.js - task T799. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-006
 */
App.i18n.content({
  'lesson-collections-006': {
    title: 'Iterators from the inside: modCount, fail-fast, removeIf, ListIterator and writing your own Iterable',
    goals: [
      'Explain how {{ConcurrentModificationException}} comes out of {{modCount}}/{{expectedModCount}}, and why wrong code can still NOT throw any exception',
      'Name 4 ways to remove elements safely while iterating, and the cost of each one on {{ArrayList}}/{{HashMap}}',
      'Tell apart fail-fast, snapshot ({{CopyOnWriteArrayList}}) and weakly consistent ({{ConcurrentHashMap}}) iterators',
      'Write an {{Iterable}}/{{Iterator}} that honours the contract, and explain why {{hasNext}} must be idempotent',
    ],
    body: `### for-each is just an Iterator in disguise
When {{orders}} is a {{Collection}}, the loop {{for (Order o : orders)}} is compiled into exactly three steps: call {{orders.iterator()}}, loop on {{while (it.hasNext())}}, then {{Order o = it.next()}}. Nothing else happens, so every rule of {{Iterator}} applies to for-each as well. The only exception: looping over an **array** uses indices {{0..length-1}}, there is no iterator at all, and therefore no fail-fast either.

{{Iterator}} has three methods and one contract that the Javadoc spells out clearly but few people read:

1. {{hasNext()}} may be called any number of times and **must not change the state**. To make that possible, a real iterator must **prefetch** the next element into a field, while {{next()}} just returns that field.
2. {{next()}} throws {{NoSuchElementException}} once the elements run out; it does not return {{null}}.
3. {{remove()}} is only legal after a successful {{next()}} and **at most once per {{next()}}**; call it wrongly and it throws {{IllegalStateException}}.

### modCount and expectedModCount: the root of ConcurrentModificationException
Every {{ArrayList}}, {{HashMap}}, {{LinkedHashMap}}, {{TreeMap}} has an {{int modCount}} field that goes up on each **structural change**: {{add}}, {{remove}}, {{clear}}, and {{put}} of a key that is **not in the map yet**. When you call {{iterator()}}, the iterator copies {{modCount}} into its own {{expectedModCount}} and then compares the two numbers at every step:

~~~java
// Simplified version of HashMap.KeyIterator.nextNode() and ArrayList.Itr.next()
public E next() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();   // "the collection changed after I started iterating"
    ...
}
~~~

Three consequences that candidates often get wrong:

- **A single thread can throw CME too.** The exception name suggests a race, but this is a *fail-fast* mechanism that catches logic bugs: changing the structure through a route other than the iterator ({{map.remove(k)}}, {{list.remove(o)}}, {{list.add(...)}}) makes {{modCount}} jump, and the iterator notices it at the very next {{next()}} call.
- **Not every mutating operation is forbidden.** {{list.set(i, x)}}, {{entry.setValue(v)}} and a {{put}} that overwrites an existing key do **not** change {{modCount}}, so they stay safe while iterating.
- **Wrong code can stay silent.** The check lives inside {{next()}}, so if the element you removed was the **last** one visited, there is no further {{next()}} left that could throw. The loop finishes, the result is correct, the unit test is green. Tomorrow the data has one more row and the system crashes. That is why the question "does this snippet throw CME" has to be answered from {{modCount}}, not from a feeling.

{{modCount}} is a plain {{int}}: not {{volatile}}, not updated atomically. So in a multi-threaded system it is only a heuristic - sometimes it fails to notice a race, sometimes it cries wolf. CME is **not** a synchronisation mechanism.

### Four ways to remove elements while iterating
~~~java
List<Order> orders = new ArrayList<>(loaded);

orders.removeIf(o -> o.ageSeconds() > 300);                        // 1. Shortest (JDK 8+)

for (Iterator<Order> it = orders.iterator(); it.hasNext(); )       // 2. Iterator.remove: the standard way, works on any Collection
    if (it.next().ageSeconds() > 300) it.remove();

for (ListIterator<Order> it = orders.listIterator(orders.size()); it.hasPrevious(); )
    if (it.previous().ageSeconds() > 300) it.remove();             // 3. ListIterator: can walk backwards

for (int i = orders.size() - 1; i >= 0; i--)                       // 4. No iterator at all: descending index
    if (orders.get(i).ageSeconds() > 300) orders.remove(i);
~~~

| Approach | Safe? | Cost on {{ArrayList}} | Notes |
|---|---|---|---|
| {{removeIf(p)}} | Yes | one traversal + **one** array compaction | clearly faster than removing one by one; still bumps {{modCount}}, so an iterator created before it will get CME if you keep using it |
| {{Iterator.remove()}} | Yes | O(n) per removal in the middle (the elements have to shift) | for-each gives you no way to touch the iterator, so you must write the classic {{for}} loop |
| **Descending** index + {{remove(i)}} | Yes | O(n) per removal | with no iterator there is no CME either; going backwards keeps the not-yet-visited elements from skipping an index |
| **Ascending** index + {{remove(i)}} | **Wrong** | — | the element on the right slides into index {{i}} and is skipped forever; **no exception warns you** |
| Copy first, then remove ({{new ArrayList<>(src)}}, {{src.toArray()}}) | Yes | O(n) memory | the copy is a snapshot: writes to {{src}} afterwards will not show up |
| {{subList(from, to).clear()}} | Yes (List) | O(n) | cuts a whole range; counted as a structural change of the backing list |

Why removing in the middle is expensive: {{ArrayList}} keeps the elements in one contiguous array, so {{remove(i)}} must {{System.arraycopy}} the entire tail. When many elements must go, **building a new list** is far cheaper than deleting them one by one from the old one.

### ListIterator: the two-way iterator of List
{{ListIterator}} is an iterator that knows how to walk backwards and how to insert: {{previous}}, {{hasPrevious}}, {{nextIndex}}/{{previousIndex}}, {{add(e)}}, {{set(e)}}. {{listIterator(i)}} puts the cursor right **before** index {{i}}. Two things that are often asked:
- {{add(e)}} inserts **ahead of** the cursor, and the next {{next()}} does **not** return the element you just inserted (to see it again you would have to call {{previous}}). That is exactly why a "traverse and insert" loop cannot spin forever.
- {{set(e)}} replaces the element that was just returned and does **not** change {{modCount}}, so it is safe while iterating.

### Views: changing a view changes the backing collection
{{subList}}, {{keySet}}, {{values}}, {{entrySet}} and the map returned by {{Collectors.groupingBy}} **hold no data of their own** - they are windows onto the original collection. A change made through the view bumps the {{modCount}} of the original, and vice versa.

~~~java
List<String> ids = new ArrayList<>(List.of("a", "b", "c", "d"));
List<String> tail = ids.subList(1, 3);   // view: ["b", "c"]
ids.add("e");                            // structural change of the backing list
tail.remove(0);                          // ConcurrentModificationException: the view has been invalidated
~~~

Two classic traps:
- A service returns {{bigList.subList(0, 10)}} because it "saves memory". The view keeps a reference to the **whole backing array**, so 10 displayed rows still keep millions of objects alive - a memory leak that is very hard to spot in a heap dump. To really cut a slice, copy it: {{List.copyOf(...)}} or {{new ArrayList<>(...)}}.
- {{map.keySet().removeAll(other)}} and {{map.values().removeIf(...)}} **do** modify the original map; but {{new ArrayList<>(map.keySet())}} is a copy - change it as much as you like and the map is untouched.

### Many threads: fail-fast, snapshot or weakly consistent
| Family | Iterator behaviour | Consequence |
|---|---|---|
| {{ArrayList}}, {{HashMap}}, {{HashSet}}, {{LinkedList}}, {{TreeMap}} | fail-fast | several threads reading while others writing is undefined behaviour; CME is only a symptom, not a contract |
| {{CopyOnWriteArrayList}}, {{CopyOnWriteArraySet}} | snapshot | the iterator walks the array as it was at the moment of creation and never throws CME; every write copies the whole array, so it only fits read-many / write-rare cases (a listener list) |
| {{ConcurrentHashMap}}, {{ConcurrentSkipListMap}}, {{ConcurrentLinkedQueue}} | weakly consistent | may or may not see the writes that happen concurrently, never repeats an element, never throws CME, and never promises to see everything |
| {{Hashtable}}, {{Collections.synchronizedList(...)}} | fail-fast | you still have to wrap the whole loop in a {{synchronized (list)}} block, otherwise you still get CME |

The senior answer: in a multi-threaded system, do not "fix CME away" by catching the exception and retrying; change the data structure instead, or synchronise the **entire loop block**.

### Writing your own Iterable and Iterator
~~~java
final class Countdown implements Iterable<Integer> {
    private final int from;
    Countdown(int from) { this.from = from; }

    @Override public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int next = from;                                 // prefetch: "next" is the element that will be returned
            @Override public boolean hasNext() { return next >= 1; }  // idempotent, call it as many times as you like
            @Override public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return next--;                                        // returns 3, then 2, then 1
            }
        };
    }
}
for (int i : new Countdown(3)) System.out.print(i);   // prints 321
~~~

{{Iterable}} means "a thing you can **start** a traversal of"; {{Iterator}} means "one traversal in progress". Every {{iterator()}} call returns a fresh object, so you can loop twice and loop concurrently with two independent iterators - that is why {{Collection}} extends {{Iterable}} rather than {{Iterator}}. If you want {{stream()}} and {{parallelStream()}} to divide the work well on your own class, also override {{spliterator()}}; otherwise the default is {{Spliterators.spliteratorUnknownSize}}, which can almost never be split in half.

> Three lines of code that have each ruined an on-call shift: (1) {{for (String k : map.keySet()) if (bad(k)) map.remove(k);}} runs smoothly with 3 keys and throws CME with 5000 keys; (2) {{removeIf}} on {{Arrays.asList(...)}} throws {{UnsupportedOperationException}} - a completely **different** bug from CME: that list is fixed-size, only {{set}} works on it, and to add or drop elements you must wrap it in {{new ArrayList<>(...)}}; (3) a hand-written iterator that implements {{hasNext()}} as "read one line from the socket" (so it consumes the message): calling it twice loses data in silence, with no exception to report it.

### Interview relevance
The usual set of questions and the points you must touch: "Does this snippet throw {{ConcurrentModificationException}}?" - compare {{modCount}} with {{expectedModCount}}, and remember that only {{next()}} does the check, so wrong code may never blow up; "How do you remove the elements that match a condition while iterating?" - {{removeIf}} or {{Iterator.remove}}, never {{list.remove(o)}} inside a for-each; "How does fail-fast differ from snapshot and weakly consistent?"; "Why must {{Iterator.remove}} be called after {{next}}?" - the iterator has to know which element was "just returned" and must keep a way to raise {{IllegalStateException}} when you remove twice; "When do you need {{ListIterator}}?" - walking backwards, inserting, or replacing right at the cursor. Related questions in the bank: collections-004, collections-029, collections-024.`,
    exercises: [
      {
        title: 'Clear expired sessions without breaking the loop',
        prompt: `{{SessionStore}} keeps a map of {{id -> last moment the session was seen}} for all the sessions that are still active. Write the two methods:

- {{removeExpired(cutoff)}}: delete every entry whose value is **smaller than** {{cutoff}} and return how many entries were deleted. It must not throw {{ConcurrentModificationException}}, must not miss anything, and calling it a second time must return 0.
- {{liveIds(cutoff)}}: return a **list of copies** of the ids that are still alive (value {{>= cutoff}}), sorted ascending by id. This method must **not** delete anything from the map, and the list it returns must be a snapshot: after the call the map may change while the old list stays exactly as it was.

{{touch}}, {{lastSeen}}, {{size}} are already written. Hint about the goal: to delete while iterating you have to delete **through the iterator itself** ({{Iterator.remove}}) and not call {{map.remove(key)}}.`,
        hints: [
          'Take an {{Iterator<Map.Entry<String, Long>>>}} from {{lastSeenAt.entrySet().iterator()}}, then call {{it.remove()}} when you meet an expired entry - that is the only way to delete safely right in the middle of a traversal.',
          'Do not call {{lastSeenAt.remove(key)}} inside a for-each loop over {{entrySet()}}.',
          '{{liveIds}}: collect into a **new** {{ArrayList}} (that already gives you a snapshot), then {{sort}} it; do not return {{new ArrayList<>(map.keySet())}} without filtering, and do not delete anything at all.',
        ],
        explain: `The wrong shape people write most often is {{for (Map.Entry<...> e : map.entrySet()) if (expired) map.remove(e.getKey());}}. {{map.remove}} makes {{modCount}} go up, while the {{expectedModCount}} the iterator copied at creation stays where it was - but the check sits inside {{next()}}, so the bug only explodes when there **is still** an element to step to. A 3-key store where the deleted key is the last one "runs fine", and with 5000 keys it becomes {{ConcurrentModificationException}}. The 5000-entry test above exists for precisely that reason.

All three fixes pass: {{Iterator.remove}} (the one used in the solution), {{lastSeenAt.entrySet().removeIf(...)}} (reads shorter, still a single traversal), or walking a **copy**, {{new ArrayList<>(map.entrySet())}}, and then calling {{map.remove(k)}} - the copy is a snapshot, so no iterator gets invalidated.

The lesson that comes with it: if you want a list that is safe to hand to the outside, you must **copy** it. Returning {{keySet}}, {{values}}, {{entrySet}} or {{subList}} means returning a window onto your internal state, and the caller (or another thread) can change it right after you finished checking.`,
      },
      {
        title: 'Write your own PeekingIterator: one element of lookahead',
        prompt: `The "split into sentences" task needs to know what the **next** element is, without being allowed to consume it yet. The plain {{Iterator}} class has no {{peek}}, so write {{PeekingIterator}}, which wraps another {{Iterator}}:

- The constructor takes {{Iterator<T> src}}.
- {{hasNext()}}: whether any element is left; calling it **any number of times must not change anything** (including {{src}}).
- {{peek()}}: return the next element **without** consuming it. If nothing is left, throw {{NoSuchElementException}}.
- {{next()}}: return the next element (if {{peek()}}/hasNext already read it, return that prefetched element and {{src}} must not advance any further). At the end, throw {{NoSuchElementException}}.
- {{remove()}}: remove from the source collection the element that {{next()}} returned most recently. Throw {{IllegalStateException}} if {{next()}} has not been called since construction or since the last {{remove()}}.

Keep the {{Iterator}} contract in mind: {{hasNext}} is idempotent, {{next}} signals exhaustion with an exception instead of returning {{null}}, {{remove}} only works after {{next}}.`,
        hints: [
          'Keep three pieces of state: {{cached}}, {{hasCached}}, {{canRemove}}. {{prefetch()}} takes one element from {{src}} only while {{hasCached}} is still false - that is what turns {{hasNext}} into an idempotent method.',
          '{{next()}} must return {{cached}} when it holds something, and must **not** call {{src.next()}} again; otherwise a {{peek()}} followed by {{next()}} loses one element.',
          '{{remove()}}: if {{canRemove}} is false throw {{IllegalStateException}}; otherwise call {{src.remove()}}, because {{src}} has not advanced since {{next()}} handed out {{cached}}.',
        ],
        explain: `The whole technique is **reading one element ahead into a field**. Without that, {{hasNext}} would have to "look" into {{src}} without taking anything, and {{Iterator}} has no {{peek}} - which is exactly why this class exists (Guava ships a {{PeekingIterator}}, and JDBC plus the line-based parsers use the same shape).

Two bugs show up often when you write it yourself:
- {{next()}} calls {{src.next()}} and forgets to return {{cached}}: every element that was already {{peek}}ed gets stolen, {{hasNext}} says true but the data is gone.
- Setting {{canRemove = true}} right after {{peek}}: {{src.remove()}} would then delete an element the caller **has never seen**.

A note about threads: {{PeekingIterator}} does not make iteration thread-safe in the slightest. If {{src}} is the iterator of an {{ArrayList}} and another thread is writing, you still get {{ConcurrentModificationException}} (or wrong results with a {{HashMap}}). To share safely, iterate a snapshot ({{List.copyOf}}) or use a weakly consistent collection.`,
      },
    ],
    check: [
      {
        q: 'The loop {{for (String k : map.keySet()) if (bad(k)) map.remove(k);}} runs on a {{HashMap}} with 3 keys. Which statement is the most accurate?',
        options: ['It always throws {{ConcurrentModificationException}} at the very first removal', 'It can run to completion when the key removed is the last one visited; CME is thrown only once another element still follows it', 'It never throws CME, because {{HashMap}} is thread-safe with for-each', 'It always leaves a half-deleted entry behind'],
        explain: `The {{modCount != expectedModCount}} check lives in the iterator {{next()}}/{{hasNext}}, not in {{map.remove}}. If no element is left to step to, the loop ends normally and the code looks correct. CME is no guarantee of correctness, and HashMap is not thread-safe either; the fix is {{Iterator.remove}} or {{entrySet().removeIf}}.`,
      },
      {
        q: 'While iterating a {{List}} with for-each, which operation does **not** change {{modCount}} (so it cannot cause CME)?',
        options: ['{{list.add(e)}}', '{{list.remove(o)}}', '{{list.set(i, x)}}', '{{list.clear()}}'],
        explain: `{{set}} only replaces the value in an existing slot, the number of elements does not change, so {{modCount}} stays where it was. {{add}}, {{remove}} and {{clear}} are structural changes; {{add}}/{{remove}} also make every live iterator throw CME at the next step. To insert while iterating, use {{ListIterator.add}}.`,
      },
      {
        q: 'How does the iterator of {{ConcurrentHashMap}} differ from the iterator of {{HashMap}} while another thread is writing?',
        options: ['Both throw CME, they only differ in how often', '{{ConcurrentHashMap}} is weakly consistent: no CME, and it may or may not see the concurrent writes; the {{HashMap}} iterator is fail-fast and the behaviour under concurrent writes is undefined', '{{ConcurrentHashMap}} always sees every write, so it is completely safe', 'The {{ConcurrentHashMap}} iterator makes a full copy of the map'],
        explain: `Weakly consistent means: no exception, no duplicated elements, but no commitment to see every change that happens concurrently. A full copy is what {{CopyOnWriteArrayList}} does (it copies on every **write**). {{HashMap}} was never designed for concurrent writes: CME is only a symptom you happen to get.`,
      },
    ],
  },
});
