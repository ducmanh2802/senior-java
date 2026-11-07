/*
 * English translation of js/data/lessons-autotest.js — task T763. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-007
 */
App.i18n.content({
  'lesson-autotest-007': {
    title: 'BDD with Cucumber-JVM: Gherkin, step definitions, hooks — and when BDD becomes a burden',
    goals: [
      'Write a Feature that really describes behaviour: Background, Scenario, Scenario Outline + Examples, DataTable',
      'Wire one Gherkin line to a Java step definition with a Cucumber Expression and understand how it is turned into a regex',
      'Explain how an undefined step and an ambiguous step happen and how Cucumber deals with them',
      'Name 3 signs that BDD is turning into a maintenance burden and how to fix them',
    ],
    body: `### BDD is a way of working, Gherkin is only what gets written down
**BDD (Behavior-Driven Development)** is a way of working: before any code, the **BA/PO + dev + QA** sit together and write **concrete examples** of the behaviour they want ("a customer holding an expired voucher cannot apply it"). The benefit is not in the words themselves: it is that three people must **agree on one shared understanding** before coding starts, so an ambiguous question surfaces at minute 10 instead of at minute 1000.

**Gherkin** is the structured language used to write those examples down: {{Feature}} → {{Scenario}} → {{Given/When/Then}} (precondition → action → outcome). It is **not code**, it has no loops and no if — it is deliberately simple so that a non-technical person can read it. Cucumber-JVM is the tool that turns a Gherkin file into a runnable test, by **wiring each line to a Java method**.

~~~text
Feature: Voucher at check-out
  Background:
    Given the shop has product "Ao" priced 200000 VND

  Scenario: An expired voucher cannot be applied
    Given the customer has a voucher "XMAS24" expired on 2024-01-01
    When the customer applies voucher "XMAS24" at check-out
    Then the order total is 200000 VND
    And the message is "Voucher has expired"

  Scenario Outline: Tax by product group
    When the customer checks out <qty> x <sku>
    Then the tax is <tax> VND

    Examples:
      | qty | sku       | tax  |
      | 1   | "AO-SM"   | 1000 |
      | 2   | "SACH-JV" | 0    |
~~~

Four things worth memorising, because interviews ask about them:
- **Background**: a shared setup block that runs before **every** scenario — use it for preconditions that are genuinely shared (login, baseline data); never put the behaviour under test in there.
- **Scenario Outline + Examples**: one scenario run over many data sets — exactly {{@ParameterizedTest}}, but written in Gherkin so the PO can read it.
- **DataTable** (the {{|...|}} table): feeds structured data into a step; Cucumber turns it into a {{List}}/{{Map}}, or into POJOs via {{asList(Voucher.class)}}/{{asMaps}}.
- **DocString** (three double quotes): a long block of text (JSON payload, log) attached to one step.

### How Cucumber runs
~~~text
cart.feature  ->  Cucumber parser (walks Feature/Scenario/Step)
                     |
                     +--> find the matching step definition (regex built from the Cucumber Expression)
                     |
                     +--> run @Before hook -> the steps -> @After hook
                     |
                     +--> report: status of each step (passed/failed/skipped/undefined)
~~~

A modern runner uses **JUnit Platform Suite** (Cucumber 7):

~~~java
import org.junit.platform.suite.api.IncludeEngines;
import org.junit.platform.suite.api.SelectClasspathResource;
import org.junit.platform.suite.api.ConfigurationParameter;
import org.junit.platform.suite.api.Suite;

@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = "cucumber.glue", value = "com.shop.steps")   // where the step definitions live
@ConfigurationParameter(key = "cucumber.filter.tags", value = "smoke")     // run only the smoke tag
public class RunCucumberTest { }
~~~

(Older versions used {{@RunWith(Cucumber.class)}} + {{@CucumberOptions(features=..., glue=...)}} — plenty of repos still look like that, so recognising both styles is a plus in an interview.)

### Step definitions: Cucumber Expressions and regex
~~~java
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class VoucherSteps {
    private final CheckOut checkOut = new CheckOut();          // state of ONE scenario

    @Given("the customer has a voucher {string} expired on {word}")
    public void voucher(String code, String expiry) {
        checkOut.addVoucher(code, expiry);
    }

    @When("the customer applies voucher {string} at check-out")
    public void apply(String code) {
        checkOut.apply(code);
    }

    @Then("the order total is {int} VND")
    public void totalIs(int amount) {
        assertEquals(amount, checkOut.total());                 // assert in the THEN step, not in some other step
    }
}
~~~

A **Cucumber Expression** is a readable shell laid over a regex. The mapping:

| Placeholder | Accepts | Java parameter type |
|---|---|---|
| {int} | an integer, may be negative | int / Integer |
| {float} | a decimal number, with a dot | double / BigDecimal |
| {string} | a string wrapped in double quotes (single quotes work too) | String, **quotes already stripped** |
| {word} | one word with no spaces | String |
| empty placeholder (an unnamed pair of braces) | anything at all (anonymous) | String |
| optional suffix (s) | optional text — "apple(s)" matches both "apple" and "apples" | creates no parameter |
| alternation yes / no | several accepted spellings, separated by a vertical bar in the real pattern | String if you need to capture the value |

How it works inside: Cucumber builds a **regex** from the expression ({int} → a capturing group for digits, {string} → a capturing group between the quotes), matches it against the **whole** step line, then calls the method with the captured groups in order. Hence:
- **Undefined step**: no pattern matches the Gherkin line. Cucumber prints a **sample Java snippet** with exactly the right parameters so you can copy it — this is how new steps actually get written: run first, take the snippet, fill in the code.
- **Ambiguous step**: two step definitions match the same line. Cucumber **does not pick one for you**; it fails and lists both — and in that case one of the two patterns is usually too wide ({int} or an empty placeholder sitting at the start).

### Hooks, tags and state between steps
~~~java
import io.cucumber.java.Before;
import io.cucumber.java.After;
import io.cucumber.java.Scenario;

public class BrowserHooks {
    private Playwright pw;                             // Cucumber re-creates the hook instance for every scenario
    private BrowserContext context;                    // other step classes get the page through the World

    @Before("@ui")                        // runs only for scenarios tagged @ui
    public void open() {
        pw = Playwright.create();
        context = pw.chromium().launch().newContext();
        World.set(context.newPage());
    }

    @After("@ui")
    public void shot(Scenario scenario) {
        Page page = World.page();
        if (scenario.isFailed()) {
            scenario.attach(page.screenshot(), "image/png", "screenshot");   // attached to the report
        }
        context.close();
        pw.close();                            // mandatory: never leave a browser process alive until the JVM shuts down
    }
}
~~~
The state of a scenario lives in **the step class instance that Cucumber re-creates for each scenario** (the default) — so the {{checkOut}} field above is safe; it only becomes dangerous if you deliberately use {{static}} or a SharedDataContext. This is one thing Cucumber gets right and many hand-written suites get wrong: **scenarios are isolated and never leak into each other**.

### When BDD pays off and when it becomes a burden
| BDD is worth it | BDD becomes a burden |
|---|---|
| Complex business rules that change by PO decision (fees, tax, vouchers, returns) | Purely technical flows no business person ever reads (retry, pagination, health check) |
| A rule set that must have evidence for an audit or a customer contract | Steps written per **screen** ("click button Submit") instead of per behaviour |
| The BA/PO really takes part in writing and reviewing the features | Features that **only QA** translated from an existing Selenium script |
| A scenario of 5–15 steps that reads as a decision | A 60-step scenario used as setup for other scenarios |

Three anti-patterns that kill BDD (all three get asked about in interviews):
1. **Gherkin as a mere shell**: every step just wraps one {{page.click()}}. When the UI changes you edit three places; the PO reads no business intent. Fix: steps at decision level, page objects underneath.
2. **English-to-English Gherkin**: {{Given the user clicks the button and then navigates to the page}} — restating every single click. Fix: {{When the customer applies voucher "X"}} (one intention, many actions underneath).
3. **Features as dead documentation**: a scenario is only worth something while it **runs**; if the team stops updating steps when the business changes, BDD loses all its meaning and ends up more expensive than plain tests (one extra abstraction layer to maintain).

### Common mistakes
- A step defined in a package that is not listed in {{cucumber.glue}} → undefined step, even though the code looks completely correct.
- A placeholder that is too wide (a Then line ending in an empty pair of braces) matches almost everything → it masks ambiguous steps and makes the report hard to read.
- Using {{Then}} for a preparation step: in plain language {{Then}} is a **verdict**; if a later step depends on the outcome of the earlier one, that line should be a {{Given}} or an {{And}}.
- Asserting inside {{Given}}/{{When}}: the failing report does not say "the result is wrong", it says "the precondition is wrong", which is very hard to trace back.
- Forgetting that Gherkin **has no conditionals and no loops**: want more data → Scenario Outline; want logic → push it down into the step definition.

### Interview relevance
Typical questions: "what is BDD and how does your team apply it", "how does Cucumber work", "what is an undefined step", "when would you **not** use BDD". The formula that scores points: (1) say BDD is first of all a **three-way conversation**, Gherkin is only the artefact written down; (2) describe the mechanism: parser → expression/regex match → hooks → report, plus one real detail ("I keep the steps in package com.shop.steps and tag @smoke so CI stays fast"); (3) state the limit: only BDD-ise the **business decisions**, leave the technical part to JUnit/REST Assured. For "does BDD slow the team down" — answer honestly: yes, if you turn every test into Gherkin; no, if you only use it for rules the PO needs to read.

> Senior tip: a pocket rule so features do not become technical debt — **one scenario talks about one decision**, no more than 12 steps, and every {{Then}} line must answer the question "would the PO agree that this result is wrong?". If nobody in the room can read one Gherkin line and understand it, delete that line: BDD exists to communicate, not to look professional.`,
    exercises: [
      {
        title: 'Write your own StepRegistry: turn a Cucumber Expression into a regex and match Gherkin lines',
        prompt: `Real Cucumber only does three things: build a **regex** from the step definition, match the **whole** Gherkin line, then **call the method** with parameters that have been converted to the right type. You will write {{Steps}} that does exactly those three things.

Already provided, **do not modify**: {{StepBody}} (the step handler), {{StepMatch}} (a match result), {{UndefinedStepException}}, {{AmbiguousStepException}}.

Expression rules — only two placeholders:
- {int}: matches an integer, a leading minus sign is allowed; the method receives an {{Integer}}.
- {string}: matches a string **wrapped in double quotes**; the value passed in is the inside part, with the quotes stripped.
- Plain text must match **literally** (regex special characters have to be escaped — use {{Pattern.quote}} to keep it short), spaces are matched one-to-one.
- The pattern matches the **whole** line after the Gherkin keyword at the start has been stripped ({{Given}}, {{When}}, {{Then}}, {{And}}, {{But}}, the {{*}} marker); strip only one keyword, and a line with no keyword must still match.

The {{Steps}} API:
- {{Steps add(String pattern, StepBody body)}} — register a step, **returns this** so calls can be chained.
- {{int size()}} — how many steps are registered.
- {{StepMatch match(String line)}} — three cases:
  - no pattern matches: status {{undefined}}, args empty, candidates empty;
  - more than one pattern matches: status {{ambiguous}}, args empty, candidates is the list of matching patterns **in registration order**;
  - exactly one pattern matches: status {{defined}}, args are the parameters converted to their types in the order the placeholders appear in the pattern, candidates empty.
- {{String run(String line)}} — defined: call the body of the matched step and return its result. undefined: throw {{UndefinedStepException}} with a message containing the line after the keyword was stripped. ambiguous: throw {{AmbiguousStepException}} (that class builds its own message, you only have to pass the right {{candidates}}).

Example: pattern "I have {int} apples" and line "Then I have 3 apples" → status defined, args is a list containing the number 3 (as Integer), and {{run}} returns exactly the string the body returned.

JDK only. No file reading, no network, no randomness, no wall-clock time.`,
        hints: [
          'Do not escape special characters by hand: collect the plain text between two placeholders and wrap it with {{Pattern.quote(chunk)}} — it produces the regex part that matches literally, dots and brackets included.',
          'On an already compiled regex use {{matcher(step).matches()}} (matches the WHOLE line), not {{find()}} (matches a fragment). That is exactly why "I have 3 apples today" has to come out as undefined.',
          'Converting parameter types: walk the pattern again in parallel with the captured groups — on {int} call {{Integer.parseInt(m.group(g))}}, on {string} take the bare {{m.group(g)}}, incrementing g each time. The order of the capturing groups is exactly the order of the placeholders.',
          'match() should be a pure function that returns a StepMatch; run() only decides based on status and then calls the body. Splitting it that way lets a report print the list of undefined steps without running anything.',
        ],
        explain: `Everything Cucumber-JVM does with a Gherkin line fits inside this exercise:

1. **A step definition is just a regex wearing a readable shell.** People think Gherkin is "smarter than code", but the engine does exactly three steps: expression → regex → {{matches()}} over the whole line. Understand that and you immediately see why a {{Then}} ending in an empty placeholder matches nearly everything, and why that is dangerous: it **swallows** lines that should have been undefined.
2. **undefined and ambiguous are two different failures.** Undefined = a step definition is missing (CI reports it, Cucumber prints a sample snippet). Ambiguous = one extra pattern overlapping another; the engine **does not choose** between them, because choosing would silently run something other than what the person who wrote the feature meant. This exercise makes you preserve exactly that behaviour.
3. **Scenario state lives in the step class, not in the feature file.** The line {{REC = args -> "call" + args}} in the harness is a plain step body; in a UI test it would be {{page.click()}}, and the data travels through fields of the step class — Cucumber re-creates the instance per scenario, so nothing leaks from one scenario to the next.

Two places where hand-written runners very often go wrong, and both are classic bugs in real step runners too: failing to strip the Gherkin keyword before matching (so "{{Given}} I have 3 apples" does not match a pattern written without {{Given}}), and using {{find()}} instead of {{matches()}} (so every longer line wrongly "matches").`,
      },
    ],
    check: [
      {
        q: 'What does the Cucumber Expression {string} accept, and what type does it pass into the step definition?',
        options: [
          'Any string containing spaces, passed verbatim including the quotes',
          'A string wrapped in double or single quotes, the inside part passed with the quotes stripped',
          'Only one word without spaces',
          'A Java expression, passed as an Object',
        ],
        explain: '{string} requires the surrounding quotes (in practice: forgetting the quotes in the feature turns the step into an undefined step). What the method receives is a String with the quotes already removed, so the step definition does not have to handle quoting.',
      },
      {
        q: 'When does an undefined step happen and what does Cucumber do about it?',
        options: [
          'No step definition matches the Gherkin line; Cucumber fails that case and prints a sample Java snippet for you to implement',
          'A step definition threw an exception; Cucumber retries it once',
          'Two steps match the same line; Cucumber picks the first one',
          'The feature file could not be read; Cucumber skips the scenario',
        ],
        explain: 'This is how new steps get written: run the feature first, take the snippet Cucumber generates (with the parameters in the right order), then fill in the code. Two steps matching the same line is the ambiguous case, and Cucumber never picks one itself.',
      },
      {
        q: 'Why should assertions go in the Then step rather than in Given/When?',
        options: [
          'Because Gherkin forbids methods in other steps',
          'Because on failure the report must say "the result is not what the PO expected"; an assert in a setup step only shows that a precondition was wrong',
          'Because Then runs faster',
          'Because the @After hook can only read Then',
        ],
        explain: 'Given/When describe the world and the action; Then is the verdict. Put it in the wrong place and whoever reads the CI output cannot tell an application bug from broken test data — which costs a lot of time in a large suite.',
      },
      {
        q: 'Which sign shows that BDD is a burden rather than an asset?',
        options: [
          'Features are reviewed by the BA/PO and updated when the business rules change',
          'Each step wraps exactly one interface action such as clicking Submit, and the PO cannot read the scenario',
          'Scenario Outline is used instead of many duplicated scenarios',
          'Steps use page objects inside, while the scenario stays at the behaviour level',
        ],
        explain: 'When Gherkin is only a shell around a UI script, you pay for one extra abstraction layer to maintain and lose the communication value — the only thing BDD actually sells. Steps must describe business intent; the mechanical actions belong in the layer below.',
      },
    ],
  },
});
