/*
 * English translation of js/data/lessons-testing.js — task T698. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-005
 */
App.i18n.content({
  'lesson-testing-005': {
    title: 'Characterization test (golden master)',
    goals: [
      'Understand characterization test',
      'Write golden master',
      'Know pitfalls',
    ],
    body: `**Summary:** A characterization test captures the actual behavior of legacy code, including bugs, to provide a safety net before refactoring. The golden master is the snapshot of the output used for comparison to detect behavior changes. This is a crucial technique when maintaining legacy systems and is often asked in senior interviews.

### Why capturing behavior is needed
Legacy code rarely has tests. When you need to change it, you don't know what you'll break. A characterization test allows refactoring without changing the observable behavior. It does not test if the spec is correct, just records "what the system is currently doing". This helps you confidently change the implementation inside.

### Step-by-step approach
1. Run the legacy version on many representative inputs, including edge cases and real production data.
2. Save the output (golden master) into a file or snapshot in test resources.
3. Write the new version with the same interface and clearer logic.
4. Compare the output between the new version and the golden master for all inputs.

### Illustrative example
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
In practice, you can save the output to a file and use a snapshot library.

### Pitfalls
Golden master also captures bugs, so you must track and fix them gradually. When a bug is found, update the golden master deliberately and record the reason. Do not let the golden master grow too large; choose representative inputs. If the output has a timestamp or random value, normalize it before comparing. Avoid comparing objects with unstable order.

### When to use / not use
Use when refactoring legacy code without tests. Do not use when building new features from scratch; then you should write spec tests.

### Comparison with spec test
Spec tests check behavior expected according to requirements. Characterization tests check behavior that currently exists. When refactoring, you want to keep the current behavior; when fixing a bug, you intentionally change the golden master.

### Common mistakes
- Comparing non-normalized output leading to unstable (flaky) tests.
- Golden master too large causing slow tests.
- Not recording the reason when updating the golden master.

### Interview summary
Characterization tests help you refactor legacy code safely by capturing and comparing actual behavior, bugs included, and tracking changes deliberately.

### Interview connection
Interviewer often asks about characterization tests when maintaining legacy systems, especially the question "how do you refactor an old system without breaking production?". Answer: capture behavior, refactor small, run golden master, track bugs.

> Senior tip: The golden master is a safety net, not a spec. Always review the output to spot latent bugs.`,
    exercises: [
      {
        title: 'Refactor premium',
        prompt: `Write the method {{refactored}} such that it has the same behavior as {{legacy}}. You must keep the logic unchanged, only restructure to make it more readable.`,
        hints: [
          'Copy the current logic exactly',
          'Change only the writing style, not the behavior',
        ],
        explain: `**Summary:** The goal is to keep observable behavior unchanged.

### Explanation
The method {{legacy}} returns the same value passed to it. To pass the characterization test, {{refactored}} must return the same result. This is a simple example to understand the idea: you do not change "what the system does", only the internal structure.`,
      },
    ],
    check: [
      {
        q: 'What does a characterization test check?',
        options: [
          'According to requirement spec',
          'Actual behavior currently exists',
          'Performance',
          'Security',
        ],
        answer: 1,
        explain: 'Characterization test records current behavior of code, including bugs, to act as a safety net when refactoring.',
      },
      {
        q: 'What is the golden master used for?',
        options: [
          'Create random data',
          'Capture output to compare after refactor',
          'Mock object',
          'Generate test automatically',
        ],
        answer: 1,
        explain: 'Golden master is the snapshot of observable output, used to compare between old and new versions.',
      },
    ],
  },
});