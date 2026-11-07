/*
 * English translation of js/data/q-primer.js — task T795. Format: js/core/i18n.js (content overlay).
 * ids: primer-024 primer-025
 */
App.i18n.content({
  'primer-024': {
    q: 'What is encoding? How do UTF-8, bytes, and characters (char) differ, and why does a Java backend need to understand this when handling strings, APIs, and databases?',
    a: `**Summary:**
- **Character** is the human-readable concept (e.g. {{A}}, a Chinese character, emoji). **Byte** is the 8-bit data unit computers store/transmit. **Encoding** (character encoding) is the rule mapping characters to byte sequences.
- **UTF-8** is the most common encoding today: uses **1-4 bytes** per character (ASCII like {{A}} costs 1 byte, non-ASCII characters/emoji usually cost more bytes). UTF-8 is backward-compatible with ASCII and is the de facto default of the web, JSON, and modern APIs.
- Confusing byte vs character causes errors: truncated strings, wrong lengths, garbled "mojibake" display, incorrect comparison/storage in DB, or errors when transferring data between systems.

### Real-world context
A Java backend receives JSON from clients, saves to DB, writes logs, calls other APIs. Every step converts back and forth between **character strings** and **bytes** (network/file/DB all transmit bytes). If one side uses UTF-8 and another misinterprets a different encoding, you will see customer names like "café" turn into garbled characters, or emoji breaking length/truncation.

### Terminology (explained first time)
- **ASCII**: old table, 128 basic English characters/symbols, each character 1 byte (actually uses 7 bits). Cannot represent Vietnamese with diacritics.
- **Unicode**: standard assigning a "code number" (code point, e.g. {{U+1EBF}}) to almost every character/language. Unicode is **not** an encoding; it only assigns code numbers.
- **UTF-8/UTF-16**: ways to **encode** Unicode code points into bytes. UTF-8 is variable-length (1-4 bytes). UTF-16 is usually 2 or 4 bytes.
- **Mojibake**: the phenomenon of text "breaking" into strange characters due to wrong encoding decoding (e.g. UTF-8 bytes read as Latin-1).

### Visual: same character, different bytes
~~~text
Character:    C   a   f   é
Unicode:      U+0043 U+0061 U+0066 U+00E9

UTF-8 bytes (hex):
  'C' 'a' 'f'  -> 43 61 66         (each ASCII character = 1 byte)
  'é'          -> C3 A9            (non-ASCII character = 2 bytes in UTF-8)
The string "café" = 4 characters, but 5 bytes when encoded UTF-8.
~~~
Another example: emoji is usually 4 bytes in UTF-8. So **character count != byte count**.

### Concrete Java example
~~~java
String s = "café";
System.out.println(s.length()); // 4 (number of UTF-16 char units in Java; for BMP usually matches intuitive "character count")

byte[] utf8 = s.getBytes(java.nio.charset.StandardCharsets.UTF_8);
System.out.println(utf8.length); // 5 (number of UTF-8 bytes)

String bad = new String(utf8, java.nio.charset.StandardCharsets.ISO_8859_1); // read with wrong encoding
// bad will be mojibake: UTF-8 bytes misinterpreted as ISO-8859-1
~~~
- Always specify charset when converting {{String <-> byte[]}} ({{getBytes(UTF_8)}}, {{new String(bytes, UTF_8)}}). Avoid relying on platform default, because another machine may have a different default.
- HTTP/JSON modern is almost always UTF-8; header {{Content-Type: application/json; charset=utf-8}} is a clear signal.

### Byte vs char: common mistake scenarios
| Situation | Easy to confuse | Consequence |
|---|---|---|
| DB/API length limit | "Max 255 characters" but column/check counts bytes | Non-ASCII characters exceed byte limit, truncation/storage errors |
| Cutting string by bytes | Cutting in the middle of a UTF-8 character's byte sequence | Last character broken (replacement char) |
| Message/HTTP size | Counting {{length()}} of String | Actual payload larger (bytes) |
| Signature/comparison hash | Both sides encode with different charset | Same string but different bytes → signature doesn't match |

### Common production pitfalls
- **Not unifying encoding**: DB column/tablespace one type, app sends UTF-8, log file another → mojibake or data write errors. Safe convention: unify on **UTF-8** across the system when possible.
- **Using default encoding**: {{new String(bytes)}} or {{getBytes()}} without charset → behavior depends on the machine (dev Windows differs from server Linux).
- **Cutting by substring just looking at length** for byte-limit scenarios (e.g. header, SMS, DB byte limit): need to count by bytes of target encoding.
- **Wrong "allowed characters" validation** due to confusing byte/char or skipping extended Unicode.

### How to answer in the interview
Explain character is human-readable concept, byte is storage/transmission unit, encoding is mapping. State UTF-8 variable-length (1-4 bytes), ASCII-compatible, common for web/API. Give the "café" example: 4 characters but 5 UTF-8 bytes. Mention 1-2 real errors (mojibake from wrong charset, byte vs character limit, always specify {{StandardCharsets.UTF_8}} in Java) and the principle: unify UTF-8 end-to-end.

> Senior tip: when designing DB and API, clearly state whether the limit is **characters** or **bytes** (e.g. Postgres {{varchar(255)}} is 255 characters, while some systems/drivers/columns count bytes). For multilingual data + emoji, always use UTF-8 (Postgres: {{UTF8}}, MySQL: {{utf8mb4}} — avoid MySQL's old 3-byte {{utf8}} because it is insufficient for 4-byte emoji). Encoding incidents are very hard to fix retroactively on corrupted data, so get it right from the start.`,
    follow: ['Why can "café" be 4 characters but take 5 bytes in UTF-8?', 'In Java, when must you specify Charset instead of using the default?']
  },
  'primer-025': {
    q: 'What is Big-O time complexity? Explain O(1), O(n), O(log n), O(n log n), O(n^2) with practical backend examples (searching in a list, index lookup, sorting, nested loops).',
    a: `**Summary:**
- **Big-O** describes **how time (or memory) grows as input size (n) increases**, at the approximate highest order. It does not measure exact milliseconds, but tells how the algorithm "scales": if n grows 10x, how much does time grow?
- Common order (good → bad when n is large): {{O(1)}} (constant) < {{O(log n)}} < {{O(n)}} < {{O(n log n)}} < {{O(n^2)}}. With small n (dozens of elements) the difference may not matter; with large n (millions) the difference is huge.
- In backend, Big-O helps you predict: searching in a {{List}} of 1 million elements, batch iteration, B-tree index lookup, sorting, or nested loops will be expensive as data grows.

### Real-world context
API slows down when table/user/list grows from 1,000 to 1,000,000. Code that "works" in dev with little data crashes in production. Big-O is a thinking tool to spot early code segments likely to "explode" with data, before profiling.

### Terminology (explained first time)
- **n**: input size (number of elements in list, number of rows, number of requests in a batch...).
- **Constant/lower order ignored**: {{O(2n + 5)}} is still called {{O(n)}} because when n is very large, the n term dominates.
- **Worst case / average case**: sometimes say worst case (e.g. search not found must scan all) or average case. Interview usually states explicitly or defaults to worst/average depending on structure.

### Big-O levels via practical backend examples

#### 1) O(1) — time nearly unchanged by n
- Example: get {{ArrayList}} element by index {{list.get(5)}}; lookup {{HashMap}} by key (average) {{map.get(userId)}}; read a field.
- Backend: check cache hit in {{HashMap}} — 1 element or 1 million elements — average lookup steps do not grow linearly with n.
- Note: "O(1)" does not mean "0 seconds", just does not grow with n.

#### 2) O(log n) — grows very slowly (halving each step)
- Example: **binary search** on sorted array; **B-tree index** lookup (root down to leaf).
- Concrete numbers: n = 1,000,000 → {{log2(n)}} ~ 20 steps. n grows 1000x, steps only add ~10.
- Backend: {{WHERE id = ?}} with B-tree index on 10 million row table usually only needs a few node reads (I/O), instead of scanning 10 million rows.

#### 3) O(n) — grows linearly with n
- Example: scan entire {{List}} to find an element without index/key; sum; filter with one loop.
- Backend: scanning 1,000 orders takes ~X ms; then 1,000,000 orders (same op) tends ~1000X ms (ignoring constants/infrastructure). Batch job processing each line once is O(n).
~~~java
// O(n): iterate each element exactly once
long sum = 0;
for (Order o : orders) { sum += o.getAmount(); }
~~~

#### 4) O(n log n) — usually efficient sorting
- Example: {{Collections.sort}} / {{Arrays.sort}} (algorithms like TimSort/dual-pivot quicksort) have average complexity {{O(n log n)}}.
- Backend: sorting 1,000,000 records in memory at {{O(n log n)}} is still feasible; if you write your own {{O(n^2)}} sort it is much slower when n is large.
- DB: {{ORDER BY}} on a large set without suitable index has significant cost (DB uses suitable sort algorithms/plans).

#### 5) O(n^2) — nested loops over same collection, explodes fast
- Example: compare every pair of elements (double loop).
~~~java
// O(n^2): with n=10,000 -> ~100,000,000 iterations
for (Order a : orders) {
  for (Order b : orders) {
    if (a.getUserId().equals(b.getUserId())) { /* ... */ }
  }
}
~~~
- Backend: joining 2 lists with 2 nested {{for}} loops instead of using {{HashMap}} (reduces to ~O(n)) is a classic performance mistake. n=100 → ~10,000 comparisons; n=100,000 → ~10,000,000,000 — won't run.

### Approximate growth table (step counts)
| n | O(1) | O(log n) | O(n) | O(n log n) | O(n^2) |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 1 | ~10 | 1,000 | ~10,000 | 1,000,000 |
| 1,000,000 | 1 | ~20 | 1,000,000 | ~20,000,000 | 1,000,000,000,000 |

(Figures illustrate growth order, not milliseconds.)

### Where to see Big-O in backend
- **Java code**: loops, nested loops, {{contains}} on {{List}} (O(n) each time) inside a loop (becomes O(n^2)), use {{HashSet/HashMap}} to reduce lookup.
- **Database**: full table scan ~ scan O(n) by rows read; B-tree index ~ O(log n) steps on tree (plus I/O cost). {{EXPLAIN}} shows what DB is doing.
- **Network/IO**: sometimes n is number of requests; calling API sequentially n times vs batch/parallel is a big difference beyond pure CPU Big-O.

### Common pitfalls
- **Only looking at Big-O, ignoring constants and I/O**: an O(n) algorithm accessing network/disk randomly can be slower than O(n log n) in RAM. Big-O is guidance, still need to measure (profiling, metrics).
- **Using {{list.contains}} inside a loop**: {{ArrayList.contains}} is O(n) → whole thing O(n^2). Switch to {{HashSet}} if you need frequent lookups.
- **Premature micro-optimization** but ignoring obvious O(n^2) on data that can grow (import, sync, report).
- **Misunderstanding n**: is n "orders per user" or "total system orders"? Getting n right is needed to evaluate correctly.

### How to answer in the interview
Define Big-O as growth rate vs n. Quickly state 5 levels with one backend example each ({{HashMap}}/index O(1)/O(log n), list scan O(n), sort O(n log n), nested loop O(n^2)). Give a numeric example (n=1,000,000 then O(n^2) infeasible) and a real mistake ({{contains}} inside loop). Emphasize: Big-O helps choose the right direction, but final decision needs measurement on real data.

> Senior tip: when reviewing code processing collections/batches, ask yourself "what's max n in production?" If n can reach tens of thousands, any O(n^2) is a potential incident candidate when data grows. Prefer fixing with the right data structure ({{Map/Set}}), or push filtering/joining to the database with index — a place with algorithms and optimization suitable for large sets.`,
    follow: ['Why can {{ArrayList.contains}} inside a loop cause O(n^2)? How do you fix it?', 'When is B-tree index lookup considered near O(log n) and what are its practical limits?']
  }
});
