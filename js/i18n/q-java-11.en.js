(function () {
  'use strict';
  App.i18n.content({
    'core-014': {
        q: 'Autoboxing: Integer cache (-128..127), {{==}} on wrapper, NPE when unboxing, and boxing cost in hot loops.',
        a: `**Summary:** autoboxing auto-converts primitive ↔ wrapper; {{Integer.valueOf}} caches -128..127 so {{==}} works on cache but fails outside range; unboxing {{null}} throws NPE; boxing in loops creates heavy GC garbage — use primitive or primitive collection.

### Integer Cache
- {{Integer.valueOf(int)}} caches [-128, 127] (can be extended via {{-XX:AutoBoxCacheMax}}); {{new Integer()}} deprecated (Java 9) and doesn't use cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} have similar caches.
- {{Boolean}} caches {{TRUE}}/{{FALSE}} as singletons.

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // newly created -> different objects
System.out.println(a == b);      // true
System.out.println(c == d);      // false (comparing reference!)
System.out.println(c.equals(d)); // true (comparing value)
~~~

### NPE when unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE at this line (implicit unboxing)
~~~
- Occurs when: map.get(key) returns null then assigned to primitive; ternary operator {{condition ? 1 : null}} coerced to primitive; stream {{reduce}} with null identity.
- Defense: use {{Objects.requireNonNull}}, {{Optional}}, or check null before unboxing.

### Boxing cost in hot path
- Each boxing creates a new object (except cache), causing high allocation rate ⇒ frequent young GC, increased pauses.
- Example: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} boxed/unboxed every iteration.
- Fix: use primitive local ({{long sum = 0;}}), or primitive streams ({{LongStream}}, {{IntStream}}), or primitive collections (fastutil/Eclipse Collections).
- JIT may eliminate boxing via escape analysis if object doesn't escape method, but not guaranteed.

### Comparing wrapper
- Always use {{equals}} for wrapper; {{==}} only works by cache luck and is a silent bug.
- {{Comparator.naturalOrder()}} safe for wrapper null (throws NPE), {{Comparator.nullsFirst}} handles null explicitly.

> Senior tip: enable {{-XX:+PrintCompilation}} and {{-XX:+PrintInlining}} to see if JIT eliminates boxing; in critical code (low latency), manually use primitives or primitive collection libraries. Don't trust "JIT will handle it" — measure with JMH.`,
        follow: [
            'Why does {{Integer}} cache default to -128..127 and how to extend it?',
            'Why does ternary operator {{flag ? 1 : null}} throw NPE when assigned to {{int}}?',
            'When should you use {{OptionalInt}} instead of {{Optional<Integer>}}?'
        ]
    }
  });
})();