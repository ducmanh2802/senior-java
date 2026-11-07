/*
 * English translation of js/data/lessons-testing.js — task T698. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-005
 */
App.i18n.content({
  'lesson-testing-005': {
    title: 'Characterization test (golden master)',
    goals: [
      'Understand what a characterization test is',
      'Write a golden master',
      'Know the pitfalls',
    ],
    body: `**Summary:** A characterization test captures the actual behaviour of legacy code, bugs included, so you have a safety net before refactoring. The golden master is the captured output you compare against to detect behaviour changes. This is an important technique when maintaining a legacy system and it comes up often in senior interviews.

### Why capturing behaviour is needed
Legacy code usually has no tests. When you have to change it, you do not know what you will break. A characterization test lets you refactor without changing the observable behaviour. It does not check whether the spec is right or wrong, it only records "what the system is currently doing". That is what gives you the confidence to change the implementation inside.

### Step by step
1. Run the legacy version over a wide set of representative inputs, including edge cases and real production data.
2. Save the output (the golden master) into a file or a snapshot under the test resources.
3. Write the new version with the same interface and clearer logic.
4. Compare the output of the new version against the golden master for every input.

### Worked example
~~~java
// golden master test
@Test
void goldenMaster() {
    String input = "abc,123";
    String legacyOutput = LegacyParser.parse(input);
    String newOutput = NewParser.parse(input);
    assertEquals(legacyOutput, newOutput);
}
~~~
In practice you would save the output into a file and use a snapshot library.

### Pitfalls
The golden master captures the bugs too, so you must track them and fix them gradually. When you find a bug, update the golden master deliberately and record the reason. Do not let the golden master grow too large; pick representative inputs. If the output contains a timestamp or a random value, normalise it before comparing. Avoid comparing objects whose ordering is not stable.

### When to use / when not to
Use it when refactoring legacy code that has no tests. Do not use it when you are building a new feature from scratch; then you should write spec tests.

### Comparison with a spec test
A spec test checks the behaviour that is expected according to the requirements. A characterization test checks the behaviour that currently exists. When refactoring you want to keep the current behaviour; when fixing a bug you intentionally change the golden master.

### Common mistakes
- Comparing non-normalised output makes the test unstable (a flaky test).
- A golden master that is too large makes the test slow.
- Updating the golden master without recording the reason.

### Interview summary
A characterization test lets you refactor legacy code safely by capturing and comparing the actual behaviour, bugs included, and then tracking intentional changes.

### Interview notes
Interviewers ask about characterization tests when talking about maintaining legacy code, especially in the question "how would you refactor an old system without breaking production?". Answer: capture the behaviour, refactor in small steps, run the golden master, track the bugs.

> Senior tip: The golden master is a safety net, not a spec. Always review the output to spot latent bugs.`,
    exercises: [
      {
        title: 'Refactor premium',
        prompt: `Write the method {{refactored}} so that it has the same behaviour as {{legacy}}. You must keep the logic unchanged and only restructure the code to make it more readable.`,
        hints: [
          'Copy the current logic exactly as it is',
          'Change only the way it is written, not the behaviour',
        ],
        explain: `**Summary:** The goal is to keep the observable behaviour unchanged.

### Explanation
The method {{legacy}} returns exactly the value passed to it. To pass the characterization test, {{refactored}} must return the same result. This is a simple example to understand the idea: you do not change "what the system does", you only change the internal structure of the code.`,
      },
    ],
    check: [
      {
        q: 'What does a characterization test check?',
        options: [
          'That the code follows the requirement spec',
          'The behaviour that actually exists today',
          'Performance',
          'Security',
        ],
        explain: 'A characterization test records the current behaviour of the code, bugs included, to serve as a safety net when refactoring.',
      },
      {
        q: 'What is the golden master used for?',
        options: [
          'Generating random data',
          'Capturing the output so it can be compared after a refactor',
          'Mocking objects',
          'Auto-generating tests',
        ],
        explain: 'The golden master is the capture of the observable output, used to compare the old version with the new one.',
      },
    ],
  },
});
