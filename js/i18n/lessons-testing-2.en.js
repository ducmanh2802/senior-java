/*
 * English translation of js/data/lessons-testing.js — task T507. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-003
 */
App.i18n.content({
  'lesson-testing-003': {
    title: 'Property-based testing mini: generating inputs from a fixed seed to find merge/sort bugs',
    goals: [
      'Tell example-based tests apart from property-based tests and name the useful kinds of properties',
      'Write your own seeded random-input harness that reports counterexamples and reproduces failures',
      'Know the limits of PBT: wrong properties, biased generators, run cost, and the role of shrinking',
    ],
    body: `### Example-based tests only check what you thought of
A typical test looks like this: feed in three sample arrays, compare against the expected result. It is good for documenting examples and catching regressions, but it has one inherent weakness: **you only check the cases you thought of**. Bugs in a merge function usually live in empty arrays, single-element arrays, duplicate elements, negative numbers, or the tail of one side — combinations that are easy to miss when written by hand.

**Property-based testing (PBT)** flips the approach around: you describe a **property** that must hold for **every** valid input, then let the machine generate hundreds of random inputs to try to refute that property. If it finds an input that makes the property false, it reports a **counterexample** — a concrete input for you to debug and then turn into a regression test.

### Common kinds of properties
| Kind | Statement | Example with merge/sort |
|---|---|---|
| Invariant | The result always satisfies a condition | The merged array is always non-decreasing |
| Oracle | Compare against an implementation known to be correct | Compare against {{Arrays.sort}} on a copy |
| Round-trip | Transform, then invert back to the original | encode then decode must equal the input |
| Idempotence | Doing it twice is the same as doing it once | sort(sort(a)) equals sort(a) |
| Metamorphic | Change the input in a known way and the output changes in a known way | merge(a, b) equals merge(b, a); adding k to every input element makes every output element grow by k |
| Permutation invariance | Reordering the input does not change the result | sort(any permutation of a) equals sort(a) |

For merge, the three strongest properties are: **the result is sorted**, **the multiset of elements equals the union of the two inputs**, and **the length equals the sum of the two lengths**. Those three alone expose almost every "drops an element", "wrong order" or "mishandles duplicates" bug.

### Seeds: random, yet reproducible
PBT must not use an uncontrolled source of randomness. If the test goes red on CI and you cannot reproduce it, you cannot debug it. The standard approach:

~~~java
long seed = 42L;                         // fixed in CI
for (int trial = 0; trial < 300; trial++) {
    Random r = new Random(seed + trial); // one deterministic seed per trial
    int[] a = randomArray(r);
    int[] b = randomArray(r);
    // check the property; on failure throw AssertionError with the seed and trial
}
~~~

{{new Random(42)}} always produces the same sequence of numbers on every machine and every JDK. When a property fails, the message must contain **the seed and the trial number** (and the input too, if possible) so that someone else can re-run exactly that one case in a few seconds.

Note: {{Random}} is thread-safe (the seed lives in an {{AtomicLong}} updated with CAS), so sharing it does not corrupt data, but threads contending for the same seed slow each other down and — more importantly — which test draws which numbers then depends on execution order, so reproducibility is lost. That is why each test (each trial) should have its own instance; do not use one shared static {{Random}}. {{ThreadLocalRandom}} is faster but **cannot be seeded** ({{setSeed}} throws {{UnsupportedOperationException}}), so it is unusable for tests that need reproducibility; {{SplittableRandom}} does accept a seed.

### A minimal harness
The harness only needs to do three things: generate input from the seed, run the property, and wrap failures with context:

~~~java
static void check(String name, long seed, int trials, Consumer<Random> property) {
    if (trials <= 0) throw new IllegalArgumentException("trials must be positive");
    for (int trial = 0; trial < trials; trial++) {
        long trialSeed = seed + trial;
        try {
            property.accept(new Random(trialSeed));
        } catch (Throwable t) {
            throw new AssertionError(
                "property failed: " + name + " (seed=" + trialSeed + ", trial=" + trial + "): " + t.getMessage(), t);
        }
    }
}
~~~

The property receives a {{Random}} and generates its own data, so the same harness works for arrays, strings, maps or pairs of inputs. This is exactly the core idea behind jqwik, QuickCheck and Hypothesis; real libraries also add typed generators, shrinking and smarter distributions.

### Shrinking: from a large counterexample to a small case
Suppose the property fails on a 27-element array. That array is hard to read. **Shrinking** is the process of automatically trying smaller variants (drop elements, shrink values, shorten strings) that still make the property fail, so you are shown the minimal case — often only a handful of elements. For example, the bug "forgot to copy the rest of array b" shrinks to something like {{a = []}}, {{b = [0]}} instead of two 20-element arrays.

The harness written by hand in this lesson has no shrinking; that is why real projects should use jqwik. But understanding shrinking helps you read PBT failure reports correctly: **the reported input is only one counterexample, not the entire failure space**. After fixing, run many more seeds and add the minimal case to your set of example tests.

### Limits and traps
- **Weak or wrong property**: if the property only checks "does not throw an exception", code returning an empty array still passes. A property must describe the contract, not the implementation.
- **Biased generator**: generating only positive numbers from 0 to 10 will never hit negative numbers, overflow, or duplicates at the edges. Deliberately generate the edges too: empty, one element, duplicates, {{Integer.MIN_VALUE}}, {{Integer.MAX_VALUE}}.
- **Not deterministic**: using {{ThreadLocalRandom}} without printing the seed, or depending on wall-clock time, turns PBT into a flaky-test machine.
- **Too many trials**: 100,000 trials slow CI down while the benefit barely grows past a few hundred cases. Pick 100–1000 depending on the cost of each run.
- **Correct but insufficient properties**: a merge that puts elements in order and keeps all of them, yet loses stability (the relative order of equal elements), is not caught by the three properties above. Add a dedicated property if the contract requires it.

> Senior tip: PBT is most effective on **pure functions** and **serialize/parse**, and least effective on I/O-heavy workflows. A practical pattern: use example tests for the main business flow and PBT for core functions such as fee calculation, splitting money, merging time intervals, parsing configuration. When PBT finds a bug, always turn the counterexample into a fixed example test — PBT may not run in every pipeline, whereas a regression test must always run.

### Interview relevance
Interviewers often ask: "How is property-based testing different from a regular unit test?", "Which properties would you check a sort function with?", "What are seeds and shrinking for?", "When should you NOT use PBT?". A good answer names concrete properties (sorted, same multiset, length), explains that the seed enables reproduction, that shrinking minimizes the counterexample, and that PBT does not replace example tests for business contracts. The exercise below makes you write merge and a minimal PBT harness yourself.`,
    exercises: [
      {
        title: 'Merge two sorted arrays and a seeded property-based harness',
        prompt: `Complete two parts in class {{Pbt}}:

**1. {{merge(a, b)}}**: return a new array containing all elements of {{a}} and {{b}}, sorted in ascending order. Both inputs are already sorted and may be empty. Duplicate elements must all be kept (merge is not union). You must not modify the input arrays.

**2. {{check(name, seed, trials, property)}}**: run {{property}} exactly {{trials}} times. At trial {{i}}, create {{new Random(seed + i)}} and pass it to the property. If the property throws any error, stop immediately and throw an {{AssertionError}} whose message contains {{name}}, {{seed=<the seed of that trial>}} and {{trial=<the trial number>}} (for example seed 42 failing at trial 3 → {{seed=45}}, {{trial=3}}), with the original error as the cause. If {{trials <= 0}}, throw {{IllegalArgumentException}}.

The tests use the harness to run 300 trials with seed 42, checking that the merge result is both sorted and keeps exactly the same multiset of elements.`,
        hints: [
          'Merge uses three pointers: compare {{a[i]}} with {{b[j]}} and take the smaller element (use {{<=}} to keep duplicates); after the main loop, copy the remainder of whichever side is not exhausted.',
          'Harness: loop with {{for (int trial = 0; trial < trials; trial++)}}, create {{new Random(seed + trial)}} so each trial is reproducible, then call {{property.accept(r)}} inside a {{try/catch}}.',
          'When catching the error, throw a new {{AssertionError}} whose message contains {{seed}} and {{trial}}; pass {{t}} as the cause to keep the original stack trace.',
        ],
        explain: `The two core properties of merge are **sorted** and **keeps exactly the same multiset of elements**. Generating a few hundred random array pairs is enough to catch almost every common bug: forgetting to copy the remainder of one side, using {{<}} and losing duplicates, allocating one slot too few, or modifying the input array.

Why a fixed seed matters: {{new Random(42)}} produces the same sequence of numbers on every machine, so the test is deterministic. When the property fails, the message carries the seed and the trial so you can re-run exactly that case. In real harnesses (jqwik, Hypothesis), the seed is printed when the test fails and shrinking automatically minimizes the input; this minimal harness skips shrinking, so the counterexample may still be long.

Common mistakes:
- Using {{a[i] <= b[j]}} but forgetting the {{while}} loop that copies the remainder, which loses the tail.
- Using {{Math.min(a.length, b.length)}} as the result length, which drops elements.
- Returning one of the input arrays instead of a new array, which makes the "no mutation" test red and causes downstream bugs at call sites.
- A harness that uses {{ThreadLocalRandom}} or does not print the seed, making the failure impossible to reproduce.
- A property that checks by calling the function under test again (for example comparing merge with merge) — tautologically true and therefore meaningless. Use an independent oracle such as {{Arrays.sort}}, or check the properties directly.`,
      },
    ],
    check: [
      {
        q: 'Which property is **not** strong enough to verify a function that merges two sorted arrays?',
        options: [
          'The result is always non-decreasing',
          'The result length equals the sum of the two input lengths',
          'The function does not throw an exception',
          'The multiset of elements of the result equals the multiset union of the two inputs',
        ],
        answer: 2,
        explain: `"Does not throw an exception" is far too weak: a function returning an empty or wrong array still passes. The other three properties together assert order, length and content — enough to catch most merge bugs. They still do not verify stability (the relative order of equal elements) if the contract requires it, so a dedicated property is sometimes needed.`,
      },
      {
        q: 'Why must the **seed** be printed when a property-based test fails?',
        options: [
          'To add entropy to the next run',
          'To reproduce exactly the sequence of inputs that made the test red',
          'Because Java requires printing the seed before throwing AssertionError',
          'To make shrinking run faster',
        ],
        answer: 1,
        explain: `The same seed produces the same sequence of random numbers on every machine, so printing the seed and the trial number lets someone else reproduce the exact counterexample. A seed does not add entropy; Java does not require printing it; shrinking is the process of minimizing the input and does not depend on printing the seed (although the seed helps reproduce the failure before shrinking).`,
      },
      {
        q: 'A generator only produces integers from 0 to 10. What is the main risk?',
        options: [
          'Tests run too slowly',
          'It never verifies negative numbers, overflow, empty arrays or boundary values',
          'Random is not reproducible even with a fixed seed',
          'Properties always fail',
        ],
        answer: 1,
        explain: `The input distribution determines which part of the input space the test actually reaches. Generating only 0..10 skips negative numbers, large values, duplicates at the edges and empty arrays, so bugs in those regions never surface. A narrow generator does not make tests slower; a fixed seed is still reproducible; and properties do not necessarily fail — they only get weaker.`,
      },
    ],
  },
});
