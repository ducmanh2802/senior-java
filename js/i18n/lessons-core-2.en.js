/*
 * English translation of js/data/lessons-core.js — task T687. Format: js/core/i18n.js (content overlay).
 * ids: lesson-core-006
 */
App.i18n.content({
  'lesson-core-006': {
    title: `equals, hashCode, compareTo: the trio that decides your behaviour inside collections`,
    goals: [
      'State what Object.equals does by default and why a value type must override it',
      'Keep the equals/hashCode contract and the rule that compareTo must be consistent with equals',
      'Write an immutable Money that is safe to use in HashMap, HashSet and TreeSet, and know what a record generates for you'
    ],
    body: `**Summary:** {{equals}} answers "are these two objects the same value", {{hashCode}} decides which bucket of the hash table the object is placed into, {{compareTo}} answers "does this object come before or after that one". The trio has to agree: {{equals}} and {{hashCode}} out of step makes {{HashMap}} unable to find a key you already put; a {{compareTo}} that merges two values which {{equals}} considers different makes {{TreeSet}} silently drop the record.

### The Object default: "I am myself"
Every class extends {{Object}}, so you receive {{equals}} and {{hashCode}} for free. The inherited {{equals}} compares with {{==}}, that is "do these two variables point at the same memory location". Therefore two writes of {{new Money(1000, "USD")}} are always two different keys, even though for an accountant they are the same amount of money. The inherited {{hashCode}} derives its number from the object identity in memory, so it never looks at the content either.
You MUST override when your class is a **value type**: the value carries meaning by itself (money, a date, a coordinate, a composite key built from several columns). You do NOT need to override when you want exactly the meaning "the same object" (an entity that is under management, an object used as a {{synchronized}} lock, a cache that is being mutated).

### Who calls which method
| Structure | What it uses when adding or looking up | What goes wrong if you break it |
|---|---|---|
| {{HashMap}}, {{HashSet}} | {{hashCode}} to pick the bucket, then {{equals}} to confirm the element inside that bucket | {{get}} returns null although the key was put; the set holds duplicates |
| {{TreeMap}}, {{TreeSet}} | {{compareTo}} (or a {{Comparator}}) to walk down the tree; a result of 0 means "already present" | Records lost with no warning at all |
| {{List.contains}}, {{distinct}}, {{removeIf}} | only {{equals}} | Still correct, but it costs O(n) |

> {{String}} and {{Integer}} already override all three methods, which is why you can use them as keys for years without ever thinking about it. For a class you write yourself, that free part does not exist.

### The equals contract: five rules
1. **Reflexive**: {{x.equals(x)}} is always true.
2. **Symmetric**: {{x.equals(y)}} and {{y.equals(x)}} must give the same answer. This is the rule most often broken when a subclass adds a field: {{Point}} versus {{ColorPoint}} — judged from the parent the colour is ignored so the two are equal, judged from the child the colour must match so they are not.
3. **Transitive**: if {{a}} equals {{b}} and {{b}} equals {{c}}, then {{a}} must equal {{c}}. It breaks as soon as you define an "approximately equal" such as {{Math.abs(a - b) < 0.01}}: a is close to b, b is close to c, yet a may not be close to c.
4. **Consistent**: as long as the fields do not change, the result does not change during the whole run of the program.
5. **With null**: {{x.equals(null)}} must return {{false}} and must never throw an exception.

The safe template for an immutable value type:

~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;                    // fast path, and correct too when o really is this object
    if (!(o instanceof Money m)) return false;     // instanceof on null yields false: no separate null check needed
    return amountMinor == m.amountMinor && currency.equals(m.currency);
}
~~~

{{o instanceof Money m}} is pattern matching for instanceof (Java 16 onwards): when the type matches, the value is bound straight into the variable {{m}}. Before Java 16 you had to write two lines: {{if (!(o instanceof Money)) return false; Money m = (Money) o;}}.

### The hashCode contract: the map to the bucket
For a given key {{HashMap}} only looks at ONE bucket: it uses {{hashCode}} to choose the bucket, then {{equals}} to search the list inside that bucket. Which yields the single rule: **if {{a.equals(b)}} then {{a.hashCode() == b.hashCode()}}**. Break it and two "equal" objects live in two different buckets, so {{get}} never brings them into the same place where {{equals}} could compare them, and the result is {{null}}.
The reverse direction is allowed: two different objects MAY share a hashCode (that is called a collision). The price is not paid in correctness but in speed: the same bucket means a longer chain, and {{get}} inside that bucket becomes O(n).

~~~java
@Override public int hashCode() {                  // use EXACTLY the fields that equals uses
    return Objects.hash(amountMinor, currency);
}
~~~

{{Objects.hash}} is handy, but every call allocates an array and boxes {{long}} into a {{Long}}; inside a hot loop write it by hand:

~~~java
@Override public int hashCode() {
    int r = Long.hashCode(amountMinor);
    return 31 * r + currency.hashCode();           // 31 is an odd prime: multiply then add spreads the bits evenly
}
~~~

### A mutable key: the "money vanished from the map" bug
{{hashCode}} must also stay **stable for as long as the object sits in the collection**. This is the classic failure of a mutable key:

~~~text
put(k, "orders/1")   hash(k) = 7    the entry lands in bucket 7
k.currency = "EUR"   hash(k) = 3    the state changed after the put
get(k)               hash(k) = 3    looks at bucket 3 (empty) => null
remove(k)                        also null: nobody can reach bucket 7 any more => memory leak
~~~

That is why the fields that feed the hash should be {{final}}, and the key should be a record or an immutable class. If you are forced to use a mutable object as a key, at least never modify it while it is in the map — but the best design never looks like that in the first place.

### compareTo and "consistent with equals"
{{Comparable<Money>}} declares the natural ordering of the type. {{TreeSet}} does not ask {{equals}} whether an element is already there: it relies on {{compareTo}} returning 0. If {{compareTo}} ignores {{currency}}:

~~~java
public int compareTo(Money o) { return Long.compare(amountMinor, o.amountMinor); }   // WRONG once a TreeSet uses it
~~~

then adding {{USD 1000}} followed by {{EUR 1000}} to a {{TreeSet}} leaves only ONE element: the amount vanishes in silence. The condition you need is that {{compareTo(x, y)}} returns 0 if and only if {{x.equals(y)}} (the English literature calls this *consistent with equals*). With money there are two valid designs, choose by business need:
- **Compare only inside the same currency**: throw {{IllegalArgumentException}} when the {{currency}} differs. Safest, because every comparison carries meaning, but you cannot sort a list that mixes currencies.
- **Compare the amount first, use the currency as tie-break**: compare {{amountMinor}} first, and if that result is 0 continue with {{currency.compareTo(o.currency)}}. Everything stays sortable, which suits a multi-currency statement.

Never return the difference computed by subtraction: {{(int)(a - b)}} with {{a = 5_000_000_000L}} and {{b = 0}} is truncated down to int into a negative number, so the ordering silently flips and nothing is reported. Always use {{Long.compare}} or {{Integer.compare}}; for strings use {{String.compareTo}}.

### Money: the invariant and the addition
~~~java
Money add(Money other) {
    if (other == null) throw new IllegalArgumentException("other null");
    if (!currency.equals(other.currency))               // a CROSS constraint between two instances: a record cannot generate it
        throw new IllegalArgumentException("Cannot add " + currency + " to " + other.currency);
    return new Money(Math.addExact(amountMinor, other.amountMinor), currency);
}
~~~

{{amountMinor}} is the number of smallest units (cents) as a {{long}}: 10.00 USD becomes 1000. Whole numbers are used because binary floating point never represents 0.1 correctly (an accumulated {{double}} drifts). {{Math.addExact}} throws {{ArithmeticException}} on overflow instead of rolling the number over into the negatives: in a money system a balance that overflows into a negative figure is an accident nobody wants to discover a year later.

### Can a record take over this part
~~~java
record Money(long amountMinor, String currency) implements Comparable<Money> {
    Money {                                       // compact constructor: validation only, no reassignment needed
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("Need a 3-character ISO 4217 code");
    }
    public int compareTo(Money o) { return 0; }   // you still have to write this yourself
}
~~~

A record generates {{equals}}, {{hashCode}}, {{toString}} and the accessors from ALL its components, so "forgot one field in hashCode" stops being a place where you can go wrong. A record does **not** generate {{compareTo}}; a record holding a {{List}} field still needs {{List.copyOf}} in its compact constructor; and a constraint across two instances, like the one in {{add}}, remains your own work.

### Production pitfalls
- You add a field to {{equals}} and forget {{hashCode}}, or the other way round. Grep for the field name and fix both places: the two methods must list the very same set of fields.
- {{hashCode}} returns one constant for every object: still legal by the contract, but every key piles into a single bucket, {{HashMap}} degrades into a linked list and CPU usage spikes under load.
- {{equals}} calls {{field.equals(...)}} on a field that may be null, so it throws NPE. Use {{Objects.equals(a, b)}}.
- Comparing with {{getClass() != other.getClass()}} while the object is behind a proxy (Hibernate): a proxy is always a different class, so every lookup fails quietly.
- Using one class both as a mutable entity and as a key inside a {{HashMap}}: the bug surfaces after a few hours of running and never reproduces in a unit test.
- Two different {{Comparator}}s for the same type, one place feeds a {{TreeSet}} and another calls {{sorted()}}: the notion of "already exists" then gives different answers in different places. Document which ordering is considered the canonical one.

### Interview notes
The follow-ups are usually: why {{equals}} needs both {{this == o}} and {{instanceof}}, what you do when a field must be added to a key that already sits in a live map (the answer: rebuild the map or move to a record key, do not change the contract retroactively), why a {{TreeSet}} is more dangerous than a {{HashSet}} when {{compareTo}} is not consistent, and when you would pick {{TreeSet}} over {{HashSet}} (you need an order, you need {{first()}}/{{last()}}/{{headSet()}}). Answer it by drawing the path of one {{put}} call and pointing at the exact step where the contract was broken.`,
    exercises: [{
      title: 'An immutable Money used safely in HashMap, HashSet and TreeSet',
      prompt: `Write {{Money}} as an immutable value type: {{amountMinor}} is the number of smallest units (cents) and {{currency}} is an ISO 4217 currency code — the international three-capital-letter standard such as USD, EUR, VND.
Requirements:
- The constructor rejects a null {{currency}}, a length other than 3, or any character outside A-Z, by throwing {{IllegalArgumentException}}.
- {{equals}} and {{hashCode}} are based on BOTH fields; {{equals(null)}} and a comparison against another type return {{false}}.
- {{add}} returns a new {{Money}} and leaves the two operands untouched; a different {{currency}} or a null {{other}} throws {{IllegalArgumentException}}; use {{Math.addExact}} to catch overflow.
- {{compareTo}} only compares two {{Money}} that share the {{currency}}; a different {{currency}} throws {{IllegalArgumentException}}.
- {{amountMinor()}} and {{currency()}} are the accessors.
The tests will drive {{HashSet}}, {{TreeSet}}, {{HashMap}} and {{Collections.sort}} to check real behaviour, not merely returned values.`,
      hints: [
        '{{HashSet}} locates first with {{hashCode}} and only calls {{equals}} inside one bucket: if {{hashCode}} leaves out {{currency}}, then {{USD 1000}} and {{EUR 1000}} fall into two different buckets and the set keeps both even though {{equals}} says they differ — meaning {{equals}} and {{hashCode}} must list exactly the same fields.',
        'compareTo throws IllegalArgumentException when the currency differs, while add compares with currency.equals and must check other for null before touching other.currency: hold to the rule "every comparison has to be meaningful" and neither TreeSet nor HashMap ever has to guess.',
        'Inside a TreeSet, adding a second element whose compareTo returns 0 means "already present", so it is discarded; that is why the test pushes {{USD 300}} in after {{EUR 300}} — if {{compareTo}} ignored {{currency}} the size would still be 2 and the exercise would not catch the bug.'
      ],
      explain: `The test suite does not only call {{equals}}, it also puts your objects into real {{HashSet}}, {{TreeSet}} and {{HashMap}} instances, because those are the places where the contract gets enforced. {{HashSet}} locates by {{hashCode}} and confirms with {{equals}}: leaving one of the two fields out of {{hashCode}} puts two identical records into two buckets and the set inflates. {{TreeSet}} does not use {{equals}} at all: it trusts {{compareTo}}, so a {{compareTo}} that ignores {{currency}} collapses {{USD 300}} and {{EUR 300}} into a single element. {{add}} has to return a new object to keep immutability; if it mutated {{this}}, every entry already put into a map could shift out of its bucket. {{Math.addExact}} protects you from {{long}} overflow — {{long}} itself rarely overflows, but cents do collide in a system that accumulates large sums.`
    }],
    check: [
      { q: 'The Money class has equals over (amountMinor, currency) but hashCode only over amountMinor. What happens to a HashSet?',
        options: ['Nothing is wrong: hashCode only concerns TreeMap', 'The HashSet can keep two duplicate elements because they land in two different buckets and equals is never called to compare them', 'The HashSet throws IllegalStateException while adding', 'hashCode does not affect equals, only compareTo does'],
        explain: 'HashMap and HashSet use hashCode to CHOOSE the bucket, and only afterwards use equals to confirm inside that bucket. Equals agreeing while the hashes differ means the two objects never stand in the same place to be compared, so the set holds both duplicate records.' },
      { q: 'Money compareTo only compares amountMinor. You insert USD 1000 and EUR 1000 into a TreeSet, what is the result?',
        options: ['The set keeps both because equals considers them different', 'The set throws ClassCastException', 'The set keeps only one element, the one added later is dropped in silence', 'Undefined, because TreeSet orders by hashCode'],
        explain: 'TreeSet positions elements with compareTo and treats a 0 result as "the element already exists", so it bypasses equals entirely. This is data loss with no log and no exception — you only notice it when reconciling the amounts.' },
      { q: 'Why must you not write compareTo as return (int)(amountMinor - other.amountMinor)?',
        options: ['Because javac forbids subtracting two longs', 'Because the difference is always 0 when two values are close', 'Because you would have to add currency into that difference too', 'Because the difference can exceed the int range, get narrowed and flip sign, so the ordering comes out wrong'],
        explain: 'Narrowing a long to int keeps only the low 32 bits. With a = 5_000_000_000 and b = 0 a positive difference is truncated into a negative number, so the comparator reports "a is smaller than b". Long.compare compares the values directly, so this trap disappears.' },
      { q: 'You convert Money into record Money(long amountMinor, String currency). Which work still has to be done by hand?',
        options: ['Writing equals and hashCode', 'Writing compareTo and the cross-instance checks when adding two values', 'Writing the accessor for amountMinor', 'Writing toString'],
        explain: 'A record auto-generates equals, hashCode, toString and the accessors over every component, and adds a compact constructor for validation. But the natural ordering (Comparable) and constraints between two objects, such as "same currency when adding", are business rules the record knows nothing about.' }
    ]
  },
});
