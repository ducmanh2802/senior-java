/*
 * English translation of js/data/lessons-testing.js — task T807. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-006
 */
App.i18n.content({
  'lesson-testing-006': {
    title: 'Shrinking: write your own counterexample reducer so PBT reports a bug anyone can debug',
    goals: [
      'Explain what shrinking is and why a raw counterexample is almost useless for debugging',
      'Write the "drop one element, keep it if it still fails" shrink loop yourself and know when it stops',
      'Read a real jqwik/PBT report and turn the minimal counterexample into a regression test',
      'Know the traps: a non-pure predicate, shrinking that destroys the property, over-simplifying, an unfixed seed',
    ],
    body: `**Summary:** A property-based test generates hundreds of random inputs in order to **find an input that breaks the property** (that input is called a counterexample). **Shrinking** is the step that automatically reduces that counterexample — drop elements, lower values — as long as the property **still fails** — so what you get back is the smallest case that still reproduces the bug. Without shrinking, PBT hands you a random 200-element array and leaves you to hunt for the break yourself; with shrinking, it hands you exactly {{[3, 4, 5]}} — small enough to understand by eye.

### Recap: the three pieces of a PBT harness
The previous lesson (lesson-testing-003) built the first two pieces; this lesson adds the third.

| Piece | Job | Where |
|---|---|---|
| Generator | Draw one valid sample of data from a {{Random}} with a seed | {{gen.apply(r)}} |
| Property (predicate) | State what **must hold** for every valid input; returning false (or throwing) means a bug was found | {{property.test(xs)}} |
| Shrinker | From a failing sample, produce **smaller variants** and keep whichever variant still fails | {{shrink(xs, property)}} |

In everyday terms: the generator is the person drawing the test samples, the property is the metal detector, and the shrinker is the person sifting the sand away so that the tiny fleck of metal becomes visible.

### Why a raw counterexample is almost useless
Suppose your property is "the array returned by {{merge}} must be sorted". The harness runs 300 trials and fails on trial 137 with two arrays of 19 and 22 elements. You print them, stare at 41 numbers, and… conclude nothing. The real merge bug may be as small as "the tail is not copied when {{a}} is empty", but right now it is buried under 40 elements of noise.

Now let the harness shrink, each example smaller than the last and still failing: you end up with {{a = []}}, {{b = [7, 2]}}. Looking at those two lines, most developers immediately guess the cause. That is exactly the value of shrinking: **it turns a statistical report into a hint about the root cause**.

### The simplest shrink algorithm: drop one element
For a list, "smaller" has a very natural meaning: **fewer elements**. The greedy algorithm (greedy — take the step that looks good right now, never backtrack):

~~~java
static List<Integer> shrink(List<Integer> bad, Predicate<List<Integer>> property) {
    List<Integer> cur = new ArrayList<>(bad);
    boolean changed = true;
    while (changed) {
        changed = false;
        for (int i = 0; i < cur.size(); i++) {
            List<Integer> cand = new ArrayList<>(cur);
            cand.remove(i);                       // smaller variant: drop 1 element
            if (violates(cand, property)) {       // still failing?
                cur = cand;                       // accept it, restart the scan
                changed = true;
                break;
            }
        }
    }
    return cur;
}

static boolean violates(List<Integer> xs, Predicate<List<Integer>> property) {
    try { return !property.test(xs); }            // property returns false = violation
    catch (Throwable t) { return true; }          // property THROWING is also a violation
}
~~~

Three details worth noticing:
- **Copy before dropping** ({{new ArrayList<>(cur)}}): never mutate the input list, because the harness still needs the original in order to print it when you turn shrinking off.
- **{{break}} to restart the outer loop**: after dropping one element the indexes of everything after it shift; starting the scan over from the beginning keeps the algorithm from missing a candidate.
- **A thrown error counts as a failure**: real bugs usually show up as a {{NullPointerException}} or an {{IndexOutOfBoundsException}}, not as {{false}}. If you let the exception escape the shrinker, the harness loses its chance to reduce at all.

### Walking one round by hand to see it work
Property: "the list sum must be less than 10" ({{xs -> sum(xs) < 10}}). The generator returns {{[1, 2, 3, 4, 5]}} → sum 15 → violation.

~~~text
[1, 2, 3, 4, 5]  sum 15  violates            (start)
   drop idx 0 -> [2, 3, 4, 5]  sum 14  still violates  -> accept, restart the scan
   drop idx 0 -> [3, 4, 5]     sum 12  still violates  -> accept, restart the scan
   drop idx 0 -> [4, 5]        sum 9   -> property HOLDS (9 < 10): may not drop
   drop idx 1 -> [3, 5]        sum 8   -> property HOLDS : may not drop
   drop idx 2 -> [3, 4]        sum 7   -> property HOLDS : may not drop
-> no element can be dropped any more => stop. Minimal counterexample: [3, 4, 5]
~~~

Notice that the result is **not** the triple with the largest sum — the greedy algorithm only promises "no further element can be dropped", it does not promise "as small as possible in every direction". To be sure of a global optimum you would have to try other directions (lower the value of individual elements, permute them) or backtrack. In practice one-directional greedy is already enough to turn a 200-element case into 3 elements, and that is why jqwik also runs greedy with a cap on the number of steps.

### Shrinking for other data types
| Type | What "smaller" means | Notes |
|---|---|---|
| {{Integer}} | move toward 0, then try 0, 1, {{MIN_VALUE}} | always shrink numbers to 0 first, because 0 is the easiest boundary to reason about |
| {{String}} | drop characters, then reduce toward the empty string; keep validity | for a parseable string, reduce to the shortest length that still fails to parse |
| {{List}} | drop elements, then shrink each element inside | two dimensions: length and value |
| {{Map}} | drop entries | keep the key that triggers the failure |
| Object/record | shrink each field in field order | only break one field at a time |
| Constrained values ({{enum}}, foreign key) | do **not** shrink freely | easily produces input outside the valid domain, so the property fails for the wrong reason |

The golden rule: **every variant you offer for testing must still be valid under the property's assumptions**. If your property says "for every order with a non-empty {{items}}", the shrinker must never return an empty list — otherwise it will "shrink" down to an input the property never committed to, and report a fake success.

### Common traps
- **Shrinking by re-running the generator**: the shrinker must transform **the counterexample itself**, not draw a fresh random sample. With the generator you are no longer reducing the example, you are looking for a different one, and the result loses its reproducibility.
- **A non-pure property**: the property reads a static {{Random}}, calls {{LocalDateTime.now()}}, or reads shared state. Then {{violates(cand)}} for the same list can answer differently between two calls — the shrinker can stop at a list that in fact passes, i.e. the report is **simply untrue**.
- **A loop that never terminates**: if your "smaller" function sometimes returns a variant **longer than** the original, or exactly equal to it, and that variant still violates, {{changed}} stays true forever. Always guarantee that each accepted step strictly reduces a finite measure (size, total magnitude).
- **Over-simplifying**: the bug is "overflow when {{sum}} exceeds {{Integer.MAX_VALUE}}"; if you shrink both the length and the values toward 0, the counterexample ends up as {{[1, 2]}} and the very characteristic that caused the failure is gone. Shrinking must respect **the invariants of the input domain** (correct types, correct constraints).
- **No fixed seed**: the same bug, two runs, two different counterexamples — and the whole team stops trusting the report. Fixed seed + deterministic shrink algorithm = deterministic report.
- **Only looking at the counterexample, never saving it**: after you fix the bug, if that minimal case is not added to the example tests, the bug comes back at the next refactor and the PBT (which does not run in every pipeline) will not catch it.

### What a real PBT report (jqwik) gives you
A failing jqwik output normally has two lines: the "falsified sample" (the original sample that broke the property) and the "shrunken sample" (the reduced one), plus the seed needed to replay that exact run. Read the report in this order: **the shrunken sample to understand the bug, the falsified sample + seed to reproduce it** and to check whether the generator covers the domain at all — if hundreds of trials only ever produce ascending arrays, your "is sorted" property is being checked on data that is far too easy.

> Senior tip: treat shrinking as a **debug filter**, not as a proof machine. After the PBT reports {{[3, 4, 5]}}, your job is to rewrite those three numbers as an example test whose name describes the bug ("merge that drops tail when left side is empty") and only then fix the code. A compact workflow: run the PBT with a fixed seed → take the minimal counterexample → add a red example test → fix → run the PBT with 5 different seeds to make sure you did not just patch one spot. Cost: size the number of trials so that a single run stays under ~1 second (a few hundred trials), and cap the shrink steps (say 500) so that one nasty bug cannot hang CI.

### Interview relevance
A common question: "what is good about property-based testing, have you used it, and for what?" — the strongest answer is usually "pure functions and the serialize/parse layer, and I understand shrinking, because that is precisely what makes the report debuggable". A senior candidate should also be able to say: the seed is what reproduces the failure, the generator has to cover the boundaries, a property must state the contract rather than the implementation, and the counterexample must be frozen into a regression test. The exercise below makes you write {{forAll}} and {{shrink}} yourself, so that later, reading a jqwik report, you know exactly what those three lines mean.`,
    exercises: [
      {
        title: 'Write Prop.forAll and Prop.shrink: return the reduced counterexample',
        prompt: `You are building a mini property-based harness for lists of integers. Write the two methods of class {{Prop}} (the {{Function}} takes a {{Random}} and returns a {{List<Integer>}}, the {{Predicate}} is the property):

**1. {{forAll(seed, trials, gen, property)}}**
- {{trials <= 0}} → throw {{IllegalArgumentException}}.
- In trial {{i}} (numbered from 0), draw a sample with {{gen.apply(new Random(seed + i))}} — a separate {{Random}} instance per trial, so the run is reproducible.
- A sample **violates** the property if {{property.test(sample)}} returns {{false}} **or** throws any error.
- Stop at the first violating sample and return {{Optional.of}} of the **shrunk** version of that sample (i.e. the result of {{shrink}}). No sample violates → {{Optional.empty()}}.
- {{gen}} may be called at most {{trials}} times and must stop right after the counterexample is found.

**2. {{shrink(counterexample, property)}}**
- Greedy algorithm: loop until no element can be dropped any more. In each pass, scan the index {{i}} from 0; try the list with **exactly one element removed** at position {{i}} (keeping the order of the remaining elements); if that reduced list **still violates** the property, accept it as the new candidate and **restart the scan from the beginning**; if removing every element makes the property hold, stop and return the current list.
- Never mutate the input list: always make a copy before removing an element.
- The returned result is a {{List<Integer>}} (not wrapped in {{Optional}}) and must **still violate** the property, unless the input is empty.

Debug hint: the property "{{the sum is less than 10}}" applied to {{[1, 2, 3, 4, 5]}} must reduce to {{[3, 4, 5]}}.`,
        hints: [
          'forAll: loop {{for (int trial = 0; trial < trials; trial++)}}, draw the sample with {{gen.apply(new Random(seed + trial))}}; if the sample violates, {{return Optional.of(shrink(sample, property));}} immediately — do not keep running.',
          'Write a helper {{violates(xs, property)}} that wraps {{try/catch}}: {{property.test}} throwing also counts as a violation, because real bugs surface as exceptions rather than as false.',
          'shrink: copy into {{new ArrayList<>(cur)}} then call {{cand.remove(i)}} ({{remove(int)}} removes by index), test {{violates(cand, property)}}; if it is accepted, assign {{cur = cand}} and {{break}} to start the scan again.',
          'The stop condition is {{changed == false}}, meaning no element can be dropped while the failure remains. Because every accepted step reduces the size by 1, the loop always terminates.',
        ],
        explain: `**What the two methods mean.** {{forAll}} is the sampler: each trial uses a {{Random}} built from {{seed + trial}}, so the whole session can be replayed from one single number. It stops at the first failing sample because the point of PBT is **to find a bug**, not to count bugs — the earlier the report, the cheaper it is. {{shrink}} is the filter: it may only reuse the very property that detected the failure, which is why "the case I hand you still makes the test red" is always true.

**Why you must wrap {{try/catch}}.** If {{property.test}} throws a {{NullPointerException}} and you let it escape, the harness dies right there and you lose the counterexample — while that exception is itself the bug. Real PBT tools (jqwik, Hypothesis) also treat an exception as falsified and only then shrink.

**Why copy before dropping.** {{List.of(1, 2, 3)}}, {{Arrays.asList}} and {{Collections.unmodifiableList}} all throw {{UnsupportedOperationException}} when you call {{remove}}, and mutating the input also destroys the original you need to print in the report.

**Why the result is {{[3, 4, 5]}} and not the "biggest" combination.** The algorithm removes elements from the left and accepts as soon as it can, so it gets pulled toward the tail of the list. That is a property of every greedy shrinker: **a deterministic result with no global-optimality guarantee**. It is also why real libraries offer several shrink directions (drop elements, lower values, change the window size) and then pick the smallest one according to some measure.

**The four mistakes authors make**:
- Shrinking by calling {{gen}} again: you are searching for a different sample instead of reducing the old one, and you lose reproducibility.
- Using a property that depends on {{Random}} or on the clock: the same list sometimes fails and sometimes passes, so the shrinker stops at a case that actually passes — a report that is untrue.
- Forgetting to check "is the candidate still valid": for a property only defined on non-empty input, removing the last element produces out-of-domain input and invalidates the entire conclusion.
- Fixing the bug without freezing the counterexample: add {{[3, 4, 5]}} as an example test whose name describes the bug, because the PBT usually runs only in one particular pipeline.

**After this lesson**, read a real PBT report again and you will recognise its three parts: the falsified sample (the original), the shrunken sample (the output of exactly the algorithm you just wrote), and the seed (the key to replaying the run).`,
      },
    ],
    check: [
      {
        q: 'What is shrinking in property-based testing?',
        options: [
          'Reducing the number of trials so CI runs faster',
          'Automatically finding smaller variants of the counterexample, as long as the property is still violated',
          'Re-running the test with a different seed until it goes green',
          'Deleting assertions so the test becomes less sensitive to refactoring',
        ],
        explain: `Shrinking starts from a sample that already made the property fail, then tries "smaller" variants (fewer elements, smaller values) and keeps whichever variant still fails. It has nothing to do with the number of trials, it does not change the seed (changing the seed looks for a different sample), and it certainly is not about removing assertions.`,
      },
      {
        q: 'Your property states "for every order whose items are non-empty, the total equals the sum of its lines". Which shrinker below is correct?',
        options: [
          'Remove every element to get down to an empty list, just to be tidy',
          'Remove one element at a time, but keep a variant only while the result is still a non-empty list and still violates the property',
          'Generate a new random sample until you hit a one-element sample',
          'Lower the value of every line to 0, even if that makes the total 0',
        ],
        explain: `Every candidate you test must still lie inside the domain the property commits to — here a non-empty {{items}}. Removing all elements produces out-of-domain input, so "still failing" is only an illusion. Drawing new samples is the generator's job, not shrinking. Lowering values to 0 can also destroy the characteristic that caused the failure (the bug only shows once the total crosses a threshold).`,
      },
      {
        q: 'Why must {{property.test}} throwing an exception be treated as a "violation" instead of letting the exception escape the harness?',
        options: [
          'Because Java does not allow a {{Predicate}} to throw an exception',
          'Because real bugs usually surface as exceptions; if one escapes, the harness crashes before it can reduce anything and you lose the counterexample',
          'Because an exception is always the generator\'s fault, not the fault of the code under test',
          'Because the shrinker needs the exception to know it should stop',
        ],
        explain: `{{NullPointerException}} and {{IndexOutOfBoundsException}} are the most common bug signals. The harness has to turn them into "this sample violates", then shrink to find the smallest sample that still throws. Java does let a lambda throw a {{RuntimeException}}; {{Predicate}} declares no checked exception, which is exactly why you must wrap {{try/catch}} yourself.`,
      },
      {
        q: 'After the PBT finds a minimal counterexample and you have fixed the bug, what should you do next?',
        options: [
          'Delete the property, since it has done its job',
          'Add that exact counterexample to the example test suite as a regression test whose name describes the bug',
          'Raise the number of trials to 100,000 to be certain the bug never comes back',
          'Turn shrinking off so the report is shorter',
        ],
        explain: `A PBT usually does not run in every pipeline, and each run only examines a random set of samples for one seed. Only the fixed example test guarantees that the bug cannot come back. Raising trials to 100,000 slows CI without guaranteeing that this exact case is hit again, and turning shrinking off puts the report back into the hard-to-debug form.`,
      },
    ],
  },
});
