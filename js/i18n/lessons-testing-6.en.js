/*
 * English translation of js/data/lessons-testing.js — task T808. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-007
 */
App.i18n.content({
  'lesson-testing-007': {
    title: 'Write your own mutation testing: know how many bugs your suite really catches',
    goals: [
      'Explain why 100% line coverage can still be a weak suite, and what mutation score measures',
      'Understand mutants, mutation operators (PIT), equivalent mutants and why you never reach 100%',
      'Write your own mutation-score calculator from a test-case table and a list of mutants',
      'Use the surviving mutants to pick exactly the boundary points that need new tests, instead of adding tests at random',
    ],
    body: `**Summary:** Coverage answers the question "**has this line of code run yet**". Mutation testing asks a much harder question: "**if there were a small bug here, would your tests catch it**". The method: tools automatically create copies of the code with exactly one spot broken (each copy is called a **mutant**), run the whole test suite against every copy, and count the fraction of copies the tests catch red-handed. That fraction is the **mutation score**. A suite that is green only because code ran through a line without asserting anything about it is exposed immediately by this number.

### Three concepts to grasp first
| Term | Meaning | Example |
|---|---|---|
| Mutant | A code copy with **exactly one** small detail changed | {{kg <= 5}} changed to {{kg <= 6}} |
| Killed | At least one test produces a result different from the expectation on the mutant (the test goes red) | the test {{kg = 6}} expects 23 but the mutant returns 20 → red |
| Survived | The whole suite ran and the mutant was still "not caught" → your suite is blind at that spot | the mutant only differs at {{kg > 47}}, and the suite has no case there |
| Equivalent mutant | A mutant that changes the syntax but whose **behaviour is identical** to the original, so no test can ever kill it | {{kg <= 5}} rewritten as {{kg < 6}} (for integers they are the same) |

### Why coverage is a metric that is easy to "game"
A test that walks through every branch of {{fee(kg)}} but asserts only a single case still scores very high line coverage: every line has run. Coverage cannot tell apart "this line ran and its result was checked" from "this line ran and its result was thrown away". That gap is exactly what mutation testing fills: it **grades the tests by attacking the code**, instead of grading the code by counting the tests.

### How PIT breaks your code
PIT (and equivalent tools) reads the class bytecode — the compiled form Java actually runs — and applies a list of **mutation operators**. Each time an operator is applied at one position, it spawns one mutant, runs the suite, and records whether the mutant was killed or survived. The most common operators:

| Operator group | Change | What kind of bug it catches |
|---|---|---|
| ConditionalsBoundary | {{<=}} → {{<}}, {{>=}} → {{>}} | off-by-one in conditions (a comparison one unit too wide/narrow), extremely common |
| NegateConditionals | negate a condition, turn the {{&&}} conjunction into a disjunction | a forgotten branch, a condition written wrongly |
| Math | {{+}} → {{-}}, {{*}} → {{/}} | wrong price/fee formulas |
| ReturnVals | return {{0}}, {{1}}, {{null}}, return an inverted value | forgetting to return the result, returning the wrong variable |
| Increments | {{i++}} → {{i--}}, changing the step | wrong loop, wrong index |
| VoidMethodCall | delete a call that returns no value | forgetting to save, to publish, to send the email |
| RemoveConditional / WrapReturnValue | drop a check guard entirely | validation silently removed |

The greatest strength of the ConditionalsBoundary group is that it hits exactly the cheapest bug to introduce and the most expensive one in consequences: **one unit wrong at a boundary**. Humans writing tests tend to skip boundaries, because a boundary "obviously looks right".

### Walking it through once with the shipping-fee function
The specification (unit: thousand dong — a small currency denomination used only to keep the numbers short), used as the running example throughout the lesson:

~~~java
static int fee(int kg) {
    if (kg <= 0) return -1;                              // invalid input
    int base;
    if (kg <= 5) base = 20;                              // light parcel: fixed fee
    else if (kg <= 20) base = 20 + 3 * (kg - 5);         // from the 6th kg: 3 per kg
    else base = 65 + 5 * (kg - 20);                      // from the 21st kg: 5 per kg
    return base > 200 ? 200 : base;                      // cap applied at 200
}
~~~

Four mutants and how to kill them:

| Mutant | Change | Which input kills it | Correct result | Mutant result |
|---|---|---|---|---|
| negative_guard | {{kg <= 0}} → {{kg < 0}} | {{kg = 0}} | -1 | 20 |
| cheap_rate | {{3 * (kg - 5)}} → {{2 * (kg - 5)}} | {{kg = 6}} | 23 | 22 |
| heavy_slope | {{5 * (kg - 20)}} → {{5 * (kg - 21)}} | {{kg = 21}} | 70 | 65 |
| cap_removed | the cap line is deleted | {{kg = 48}} | 200 | 205 |

The key observation: **four cases kill all four mutants**, and each case sits right at a boundary of the specification (0, 6, 21, 48). Adding 40 more cases in the middle of the ranges would not kill a single extra mutant. This is why the mutation score improves through **boundary thinking**, not through test count.

A fifth mutant, for example rewriting {{kg <= 5}} as {{kg < 6}}: for integers, the two conditions give the same result for **every** input, so no test that can kill it exists. That is an **equivalent mutant**, and it is the reason nobody sets a "mutation score = 100%" gate: some mutants are unkillable in principle, and chasing 100% usually only produces meaningless tests.

### Computing the score: formula and how to read it
~~~java
static double score(int[][] cases, Map<String, IntUnaryOperator> mutants) {
    if (mutants.isEmpty()) return 0.0;
    int killed = 0;
    for (IntUnaryOperator m : mutants.values()) {
        boolean caught = false;
        for (int[] c : cases) {
            if (m.applyAsInt(c[0]) != c[1]) { caught = true; break; }   // differs from expectation = killed
        }
        if (caught) killed++;
    }
    return (double) killed / mutants.size();
}
~~~

How to interpret the number, from practical experience:
- **Below ~50%**: your suite mostly executes code rather than checking it. However high your coverage is, it means nothing.
- **50–75%**: the main flow is checked; boundaries and error paths are not. This is the zone of most teams that have never looked at a mutation score.
- **75–90%**: quite good; what survives usually sits in less important defensive code or is equivalent mutants.
- **Above ~90% for a core module** (pricing, fees, parsing, permissions): worth keeping and gating. For a CRUD module dense with getters/setters, a lower score is normal.

In CI, teams set the gate **per-module** and **on new code** (measuring only mutants on changed lines, a "diff mutation score"), because running the whole repo on every PR is very slow: each mutant means re-running all of its relevant tests. PIT has test-selection by class to cut this cost.

### Common traps
- **Running mutation testing over the whole repo on every PR**: tens of thousands of mutants multiplied by suite runtime → not viable. Pick core modules, run on the diff, or run nightly.
- **Confusing a surviving mutant with a real bug**: a surviving mutant says "the tests cannot distinguish the two behaviours", not "the code is wrong". The action is to add a test, not to change the code.
- **Changing test expectations to match a mutant**: if you write the expectation wrong, you can "kill" a mutant by making a test red on correct code. To be safe, mutants must be judged by a suite whose expectations come from the **specification**, not from the code's output.
- **Forcing 100%**: it leads to tests for getters, tests for impossible branches, and internal arguments about equivalent mutants.
- **Ignoring call-deletion mutants (VoidMethodCall)**: these are often the most dangerous bugs — a forgotten event publish, a forgotten audit-log write — and they are exactly what assert-less tests let slip through.
- **Not re-measuring after a refactor**: mutants are generated from bytecode, and a refactor changes their positions and count; measure per module and track the **trend** of the score rather than the absolute number.

> Senior tip: treat the mutation score as a **test-design diagnostic** tool, not a KPI to race each other on. Three places I always inspect surviving mutants: boundary conditions ({{<=}}/{{>=}}), default return values, and deleted calls. If a mutant survives exactly where you just had a production incident, that is the most concrete evidence there is to convince the team to add tests and set a gate — far more convincing than "our coverage is only 60%". And never report a mutation score without the number of surviving mutants in the equivalent group, because a bare 100% is a false promise.

### Interview connection
The classic question: "How much coverage is enough? Why are there still bugs despite high coverage?" — a strong candidate answers immediately: coverage measures **code being run**, not **results being checked**, then gives the example of an off-by-one mutant that leaves the suite green, and names mutation testing as the answer. The second question: "How would you introduce mutation testing to a team?" — answer: start on the pricing/fee module, run it on the PR diff or nightly, set a moderate threshold (70–80%), handle surviving mutants by adding boundary tests, and accept a share of equivalent mutants. The exercise below has you write the score calculator yourself, so that later you can read a PIT report without needing anyone to explain it.`,
    exercises: [
      {
        title: 'Write the mutation-score calculator and a test suite of your own that kills every mutant',
        prompt: `The specification of the shipping-fee function {{int fee(int kg)}} (unit: thousand dong), integer {{kg}}:
- {{kg <= 0}}: invalid input → return {{-1}}.
- {{1 <= kg <= 5}}: fixed fee {{20}}.
- {{6 <= kg <= 20}}: {{20 + 3 * (kg - 5)}}.
- {{kg >= 21}}: {{65 + 5 * (kg - 20)}}.
- After computing, if the result is **greater than** 200 then return {{200}} (apply the cap; a result of exactly 200 is unchanged).

Examples: {{fee(0) = -1}}, {{fee(1) = 20}}, {{fee(5) = 20}}, {{fee(6) = 23}}, {{fee(10) = 35}}, {{fee(20) = 65}}, {{fee(21) = 70}}, {{fee(47) = 200}}, {{fee(48) = 200}}, {{fee(100) = 200}}.

Write three methods in the class {{Mutation}}. A mutant here is an {{IntUnaryOperator}} function (int → int) implementing one **broken version** of {{fee}}; the mutant table is passed in by the test, you do not need to know the names or the implementations of the mutants.

**1. {{score(cases, mutants)}}** — {{cases}} is an array of {{int[]}} of the shape {{input, expected}}, where {{expected}} is the value **correct per the specification**. A mutant is **killed** if there exists at least one case with {{mutant.applyAsInt(input) != expected}}. Return {{(double) killed / mutants.size()}}; if {{mutants}} is empty return {{0.0}}.

**2. {{survivors(cases, mutants)}}** — return the **keys (names)** of the mutants that are **not** killed, sorted in ascending alphabetical order (use {{Collections.sort}}). An empty table → an empty list.

**3. {{killerCases()}}** — you design the case set for the specification above; each element is a two-number {{int[]}}, the first being {{kg}} and the second being the correct value of {{fee(kg)}}. Requirements:
- between 4 and 12 cases, with all {{kg}} values **pairwise distinct**;
- every {{expected}} must be **spec-correct** (the test checks each case against a reference implementation);
- the case set must kill **every mutant the test provides, except a single equivalent mutant** (a mutant that only rewrites the code, with behaviour identical to the original). Hint: the mutants are produced with PIT's familiar operators — widen/narrow the {{<=}} boundary, change the coefficient of {{kg}}, drop the {{kg <= 0}} guard, drop the cap, change the subtraction range in the formula. Think about **the boundary points of each range** instead of adding random cases.

You may add private helpers as you like. Do not print to stdout; the test reads the return values directly.`,
        hints: [
          'List every **boundary point** of the specification, then take one input exactly at the boundary and one just past it: 0/1 (the validity guard), 5/6 (end of the fixed-fee range), 20/21 (coefficient switch), 47/48 (the cap threshold). The 5-case set {{0}}, {{1}}, {{6}}, {{21}}, {{48}} is enough to kill every killable mutant.',
          'score: count the mutants with **at least one** case where {{mutant.applyAsInt(c[0]) != c[1]}}, divided by {{mutants.size()}}; handle the empty table so you never divide by zero.',
          'survivors: write a shared helper {{isKilled(mutant, cases)}} used by both methods, then collect the keys of the mutants not yet killed and {{Collections.sort(out)}} so the order does not depend on {{HashMap}}.',
          'Do not add 12 cases in the middle of the ranges: they kill no extra mutant and they violate the point of the exercise, which is "minimal coverage of the boundaries".',
        ],
        explain: `**The case set and which mutant each case kills.**

~~~text
kg = 0   -> -1   kills negative_guard   (the mutant returns 20 at kg = 0)
kg = 1   -> 20   covers the fixed-fee range (kills no extra mutant, guards against "base = 21"-style mutants)
kg = 6   -> 23   kills tier1_upper (mutant returns 20) AND cheap_rate (mutant returns 22)
kg = 21  -> 70   kills tier2_upper (mutant returns 68) AND heavy_slope (mutant returns 65)
kg = 48  -> 200  kills cap_removed    (mutant returns 205)
=> 6/7 mutants killed. equivalent_rewrite cannot be killed.
~~~

One case can kill several mutants, and several cases can kill the same mutant: what matters is **being present at the spot where the behaviour changes**, not the count.

**Why an equivalent mutant cannot be killed.** {{kg <= 5}} and {{kg < 6}} give the same result for every integer, so for every input the mutant's output equals the original's output, so no correct expectation can ever differ from it. This is a **theoretical** limit of mutation testing (the halting problem — the undecidability of whether a program stops — makes it impossible for any tool to prove two programs equivalent), so a 100% score is impossible by nature, not a sign that you write bad tests. PIT marks some mutants of this kind by running extra tests and comparing behaviour, but most still have to be concluded by a human.

**Computing the score and why {{double}}.** killed/total is a ratio, so one side must be cast to double: {{(double) killed / mutants.size()}}. Forgetting the cast is the classic bug that makes the score always 0. An empty mutant table must be defined as 0.0 so the method does not throw {{ArithmeticException}}/NaN.

**Why {{survivors}} must sort.** {{HashMap}} makes no ordering guarantee; if you returned the keys in table order, your test would go red/green depending on the hash — precisely the kind of flakiness the test-determinism lessons warned about. In real tools the list of surviving mutants is always sorted and grouped by class so a reader can compare two runs.

**Common mistakes on this exercise**:
- Picking {{kg = 30}} instead of {{kg = 21}}: {{heavy_slope}} is wrong for every {{kg >= 21}} so 30 still kills it, but {{tier2_upper}} is not — it differs exactly at {{kg = 21}}. The lesson: a boundary mutant **lives at exactly one point**.
- Forgetting {{kg = 0}}: the whole "input guard" group survives, and that is the group related to validation — the stuff that most often slips into production.
- Never crossing the cap threshold: a mutant that deletes {{Math.min}}/the cap comparison only reveals itself when a large input exists.
- Writing tests by printing the code's output and copying it as the expectation (blind characterization testing): then every mutant is "killed" on paper because the expectation always agrees with the code, and your score becomes meaningless. Expectations must come from the **specification**.

**Applying this to a real project.** PIT works on bytecode, so it cannot be reimplemented in a plain-Java exercise like this one; the exercise keeps PIT's **scoring model** intact, while the mutant generation is handed to you as functions. When you read a PIT report, you only need to do exactly the three things you just did: identify which operator group each surviving mutant belongs to, find the boundary point where it differs from the original, and add a case whose expectation comes from the specification.`,
      },
    ],
    check: [
      {
        q: 'How is the mutation score of a suite computed?',
        options: [
          'Lines of code executed divided by total lines',
          'Mutants killed by the tests divided by total mutants generated',
          'Passing tests divided by total tests',
          'Production bugs divided by number of deploys',
        ],
        explain: `Each mutant is a code copy broken at exactly one detail; a mutant is "killed" when at least one test produces a result different from the expectation on that copy. The score is the fraction of killed mutants. Lines executed is line coverage; passing tests is a pass rate; production bugs play no part in this formula.`,
      },
      {
        q: 'Your suite reaches 100% line coverage but a 45% mutation score. What is the best conclusion?',
        options: [
          'The code is too complex, the classes must be split',
          'Many lines ran but their results are not checked; the tests lack asserts at boundary points and return values',
          'Write more tests that re-run the already covered paths',
          'PIT generated wrong mutants, which is why the score is low',
        ],
        explain: `Coverage only says the code was executed. 55% of mutants surviving means half the small details of the code can be broken without a single test going red — the classic sign of tests that walk through code without asserting on results. Splitting classes or adding tests over the same paths fixes nothing; the mutants are generated by a fixed operator list and are not the cause.`,
      },
      {
        q: 'A mutant is never killed, no matter how many spec-correct tests you add. What is it?',
        options: [
          'An equivalent mutant: its behaviour is identical to the original, so no expectation can distinguish them',
          'A mutant on a line not yet covered',
          'A real bug in the original code',
          'The tests are running in the wrong strict-stubs mode',
        ],
        explain: `Example: {{kg <= 5}} rewritten as {{kg < 6}} — for integers the two conditions always give the same result. This is the theoretical limit of mutation testing, so nobody sets a 100% gate. A mutant on an uncovered line can be killed by one test that covers it; a mutant has nothing to do with a pre-existing bug or with strict stubs.`,
      },
      {
        q: 'Why should you not run mutation testing over the whole repo on every PR?',
        options: [
          'Because PIT does not support Spring Boot',
          'Because each mutant needs the relevant tests re-run, so the total cost can reach hours; measure core modules and diffs instead',
          'Because the mutation score always drops as the codebase grows',
          'Because mutants generated from bytecode would break the build',
        ],
        explain: `The cost is the number of mutants times the suite runtime, so in practice you pick critical modules, measure only the changed code, or run nightly. PIT does run on a Spring Boot project; the score does not automatically fall with size; mutants are created inside the analysis process and never touch the real build.`,
      },
    ],
  },
});
