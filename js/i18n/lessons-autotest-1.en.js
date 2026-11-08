/*
 * English translation of js/data/lessons-autotest.js — task T759. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-001 lesson-autotest-002
 */
App.i18n.content({
  'lesson-autotest-001': {
    title: 'Automation testing: what it is, the test pyramid, and test case design techniques',
    goals: [
      'Distinguish manual vs automation testing and compute the ROI of an automation script',
      'Apply equivalence partitioning and boundary value analysis to choose a minimal input set that still covers the cases',
      'Read decision tables, understand the don\'t care notation, and generate a test set covering every rule',
      'Explain smoke / sanity / regression suites and the QA vs SDET roles in a team',
    ],
    body: `### Manual testing and automation testing

**Testing** = run the program with a given input and compare the **actual result** with the **expected result**. A **test case** consists of: precondition, steps, data, and expected result.

**Manual testing**: a real person follows a checklist. **Automation testing**: a program (script) does it instead — opens a browser or calls HTTP, enters data, clicks buttons, reads the result, and prints **PASS/FAIL**. The script runs many times, in many environments, without a person — that is its whole essence: **amplifying mental labor into repeatable execution**.

| Aspect | Manual | Automation |
|---|---|---|
| Cost per run | tester's time | near zero after the script is written |
| Catching new, unusual, feel-based bugs (usability) | very good | almost none |
| Rerunning a 500-case regression suite weekly | impossible for a human | routine |
| Error-prone on repetition | high (tired, wrong steps) | 0 (machine repeats exactly) |

### ROI: why not automate everything
The cost of an automated test = **write + maintain + run/host on CI**; benefit = **time saved × number of runs + bugs caught earlier**. Example with numbers: a manual login flow test takes 1 hour; the script takes 4 hours to write plus ~2 hours/year to fix when the UI changes; each CI run (Continuous Integration — a system that automatically builds and runs tests on every code push) takes 15 minutes. If the suite runs ~100 times/year, it saves ~100 hours for 6 hours spent — clear profit. Conversely, a case that runs only once/year loses heavily.

Three criteria for deciding **worth automating**: runs **many times** (regression), the object is **stable** (API/UI rarely change), the result is **determinable by code** (clear right/wrong). Not worth: UX evaluation, brand-new flows that may be dropped next sprint, one-off tests.

### Test pyramid: which layer to automate
~~~text
        / UI E2E \         few, slow, expensive to maintain — critical flows only
       / API / integration \   moderate: faster than UI, covers core business logic
      /  unit tests (widest)  milliseconds, run on every commit
~~~

- **Unit test** (dev writes, JUnit 5): tests one function or class in isolation, no DB or network. Example: a transaction fee calculation function.
- **API/integration test** (QA/SDET writes, often REST Assured): calls real HTTP to the service, checks status code and body, no UI. More stable than UI because APIs change slower than CSS.
- **UI E2E** (Selenium/Playwright): simulates a user clicking through screens. Broadest coverage but slowest and breaks fastest when the UI changes.

Three suite types often confused: **smoke suite** is a few fastest cases checking "is the system alive" (login + open home page + place 1 order), run before every other suite; **sanity check** is a quick check that a group of features just fixed works; **regression suite** is the full set rerun end-to-end to ensure new changes do not break old ones.

Automation lives in the CI pipeline — flow among multiple systems:

~~~seq
title: CI pipeline of an automation suite
actors: Dev | CI Runner | App | Test Suite
Dev -> CI Runner: push code to branch
CI Runner -> App: build and start service
CI Runner -> Test Suite: run unit then API tests
Test Suite -> App: call real HTTP and UI smoke
Test Suite --> CI Runner: PASS/FAIL report
CI Runner --> Dev: result after 10 minutes
note CI Runner..Test Suite: UI E2E runs only at night to avoid congesting CI
~~~

### QA and SDET roles
**QA (Quality Assurance)** designs test cases, does exploratory testing (tester freely probes based on experience), owns product quality. **SDET (Software Development Engineer in Test)** is a programmer who writes **test infrastructure**: framework, page object, CI driver, test data tools, reporting (Allure). A Java dev with 4 years of experience moving to SDET has a big advantage: the framework is essentially OOP + design patterns (strategy for wait, facade for page object) — you already have the language, just missing the browser context.

### Test case design: don't test by feel
Automation multiplies the value of a good test case — and multiplies the cost of a bad one. Three core techniques:

**1. Equivalence partitioning (EP).** Group inputs into **classes** the system handles alike; one representative per class is enough. Registration form: valid age 18–60 splits into 3 classes {under 18: reject}, {18–60: accept}, {over 60: reject}. Password 8–64 characters also 3 classes. No need to try ages 20, 25, 31, 44 — within one class one representative suffices.

**2. Boundary value analysis (BVA).** Bugs cluster at **boundaries** because of easy comparison-operator mistakes (< instead of ≤, off-by-one). For a closed range [min, max], take 7 boundary points:

~~~text
age:   ... 17  18  19 ... 39 ... 59  60  61 ...
        invalid| valid begin |  | valid end |invalid
        min-1    min   min+1  mid         max-1 max  max+1
~~~

**3. Decision table.** When the result depends on **a combination of multiple conditions**, list rules and generate cases from rules — avoiding missed combinations. Registration form with 3 conditions:

| Rule | age_ok | pw_ok | terms_ok | Result |
|---|---|---|---|---|
| R1 | T | T | T | accept |
| R2 | F | - | - | reject: age |
| R3 | - | F | - | reject: password |
| R4 | - | - | F | reject: missing consent |

The **-** (don't care) means that condition does not affect the rule's result — one rule row covers multiple combinations, so the minimal case set equals the number of rules, instead of 2^3 = 8 combinations.

### Common mistakes
- Testing only the **happy path** (the correct flow), skipping boundaries and invalid classes — that's where real bugs hide.
- Testing **every combination**: 3 fields × 3 classes = 27 cases; EP + BVA cut to ~10 cases with equivalent coverage.
- "Excel automation": copying 500 manual checklist rows into 500 unmaintainable scripts.
- Script **passes without checking anything**: missing assertions, or only checking "page opened".

### Interview relevance
Typical questions: "Where do you start automation?", "Why not automate 100% of the manual suite?", "Tell me about a bug BVA caught". Answer formula: state selection criteria (frequency × stability × clear result), cite the pyramid, give a real number (suite duration, runs per week). Answering ROI with numbers always scores with SDET roles.

> Senior tip: what interviewers want to hear is often "slow and steady": start with 5–10 API smoke tests running in CI on every commit, prove value, then expand to UI. Automating 100% in the first week is the fastest way to shut the suite down by month two.`,
    exercises: [
      {
        title: 'Boundary value generator and decision table expander',
        prompt: `Write class {{TestDesign}} with 2 static methods to generate a minimal test set for a registration form (age 18–60, password 8–64 characters).

**1.** {{boundaries(min, max)}}: return an array of **exactly 7 values in order**: {{min-1, min, min+1, mid, max-1, max, max+1}} with {{mid = (min + max) / 2}} (integer division). If {{min >= max}} throw {{IllegalArgumentException}}.

**2.** {{expandRules(rules)}}: takes a list of decision-table rules; each rule is a string of space-separated tokens, each token is {{"T"}} (true), {{"F"}} (false), or {{"D"}} (don't care). Turn each rule into a **concrete row** by replacing every {{"D"}} with {{"T"}}, keeping input order and **removing duplicate rows** (keep first occurrence). Return a list of token strings separated by a single space.

Example: rules = [{{"T T D", "T F F", "T T T"}}] → result = [{{"T T T", "T F F"}}] (row 3 duplicates row 1 after filling D).`,
        hints: [
          'Boundaries: use Java array literal syntax (new int[] then list elements in braces); mid is integer division {{(min + max) / 2}}.',
          'Decision table: use {{LinkedHashSet}} to deduplicate while keeping insertion order, then wrap with {{new ArrayList<>(set)}}.',
          'Split rules with {{rule.trim().split(" +")}} (regex "one or more spaces"); rejoin with a single space.',
        ],
        explain: `{{LinkedHashSet}} is the key to question 2: it deduplicates like {{HashSet}} but keeps **first insertion order**, matching "keep first occurrence". This is also the right model of a decision table: each rule needs only **one** evidence row — duplicate rows add no information.

Common mistake with boundaries: forgetting that {{mid}} can equal a boundary when {{max - min}} is small, or confusing the condition for throwing {{IllegalArgumentException}} (it must be {{min >= max}}, not just {{min > max}}). In interviews, interviewers often follow up: "What about string or date inputs — what is the boundary?" — the general rule is still the value just before / at / just after the processing threshold.`,
      },
    ],
    check: [
      {
        q: 'By BVA, for a text field accepting length 8–64 characters, what are the classic 7 boundary values?',
        options: [
          '7, 8, 9, 36, 63, 64, 65',
          '8, 16, 24, 32, 40, 48, 64',
          'only 7, 36, 65 are needed',
          'only 8 and 64 are needed',
        ],
        explain: 'min−1, min, min+1, a middle value of the range, max−1, max, max+1. Values inside one equivalence class need only one representative, but **boundaries** must be tried on both sides.',
      },
      {
        q: 'What is the main idea of equivalence partitioning?',
        options: [
          'Split tests to run in parallel for speed',
          'Group inputs into classes treated alike; one representative per class is enough',
          'Generate random input and record results as baseline',
          'Test every value combination to avoid misses',
        ],
        explain: 'EP assumes the system treats all values in the same class alike, so one representative per class is enough — cutting 27 combinations down to a few cases with unchanged coverage. Validating this assumption is exactly why BVA exists.',
      },
      {
        q: "In a decision table, what does \"don't care\" mean in a condition cell?",
        options: [
          'The condition is always false at runtime',
          "Don't care whether that condition is true or false — the rule's result doesn't change",
          'The condition is faulty, so skip it',
          'The whole rule row is invalid',
        ],
        explain: "Don't care lets one rule row represent multiple combinations; when turning it into test cases, you fill freely (the exercise convention fills T) to get a minimal case set covering every rule.",
      },
      {
        q: 'Which situation has the **worst** automation ROI?',
        options: [
          'Smoke suite running on every CI build',
          'Regression API suite running nightly',
          'Exploratory testing of a new UI being redesigned next sprint',
          'Core payment flow check before every release',
        ],
        explain: 'Automation pays off when run repeatedly on a stable object. A new UI that keeps changing incurs maintenance costs (fixing locators, flows) that wipe out the benefit — leave it to manual/exploratory, and only automate once stable.',
      },
    ],
  },
  'lesson-autotest-002': {
    title: 'Locators: id, CSS, XPath, data-testid — and why locators break',
    goals: [
      'Explain that the DOM is a tree and how the browser finds elements by selector',
      'Compare durability of id, CSS, XPath, data-testid, and getByRole with real examples',
      'Write multi-level CSS selectors and XPath with predicates',
      'Name at least 3 causes of broken locators and how to prevent them',
    ],
    body: `### DOM: the tree the browser finds elements in
When loading a page, the browser parses HTML into **DOM (Document Object Model)** — a **tree of nodes**: each tag is a node with a label ({{tag}}), **attributes** ({{id}}, {{class}}, {{type}}, {{href}}...) and child nodes. Example:

~~~text
html
 └─ body
      └─ div#app.shell
          ├─ nav.menu
          │   └─ a[href=/home]
          └─ form.login
              ├─ input#user[type=text]
              └─ button#submit.btn.primary
~~~

**Locator** (element locator) is a **selector** string describing "which node in the tree". The automation engine walks the tree; whichever node matches is returned. That explains everything about locators: the less a selector depends on the tree's current shape, the more durable it is.

### Selenium: By types and durability
~~~java
driver.findElement(By.id("submit"));                              // fastest: getElementById
driver.findElement(By.cssSelector("form.login button.primary"));  // browser's querySelectorAll
driver.findElement(By.xpath("//form[@class='login']//button"));   // XPath: find by tree and path
driver.findElement(By.name("email"));                             // name attribute — legacy forms
driver.findElement(By.linkText("Sign in"));                     // a tags only, exact text match
~~~

| Type | Example | Durability | Note |
|---|---|---|---|
| static id | {{By.id("submit")}} | high | dynamic id ({{id-18392}}) is even worse than class |
| semantic attribute CSS | {{button[type=submit]}} | high | selector "as written in HTML" |
| XPath | {{//div[@role='dialog']//button}} | medium | powerful but easily absolutized |
| text | {{By.linkText("Add to cart")}} | low | wording change / i18n breaks it |
| framework CSS class | {{.css-1x9k2b}} | very low | rebuild renames it |
| **data-testid** | {{\[data-testid=checkout-btn\]}} | **highest** | set deliberately by the team, not for styling |

**CSS selector** reads left to right: {{tag}} matches the tag name, {{#id}} matches the id attribute, {{.class}} matches one token in the class attribute ({{class="btn primary"}} matches both {{.btn}} and {{.primary}}), {{\[k=v\]}} matches attribute k equal v; parts joined together are **AND** ({{button#submit.primary}}), parts separated by a space are **descendant** ({{form button}} = every button inside a form, at any depth).

**XPath** allows what classic CSS does not: go up ({{//button/ancestor::form}}), select by position ({{(//li)\[2\]}}), match by text content ({{//span\[text()='Total'\]}}), {{contains()}}, and match any attribute with {{@}}. That power is also the trap — it invites writing absolute paths.

### Why locators break: 4 culprits
1. **Absolute path**: {{/html/body/div\[3\]/button\[1\]}} — add a banner above and the index shifts, silently breaking or throwing {{NoSuchElementException}} (element not found). This is the most hated locator type in automation code review.
2. **Build-generated class**: styled-components / CSS modules generate {{css-1x9k2b}} — each build may rename it.
3. **Dynamic id**: a form uses an auto-generated id ({{input_58f2}}) by counter/uuid — change the field number and the id changes.
4. **Displayed text**: add a space, change case, switch language — a text-based locator dies.

**Defense**: prioritize **intentional test identifiers** — the {{data-testid}} attribute. Frontend (React/Vue) attaches {{data-testid="checkout-btn"}} to the component; the tester writes {{\[data-testid=checkout-btn\]}}; the production pipeline can be configured to strip this attribute so it is not exposed. Practical strategy when a testid is not allowed: **semantic id → attribute CSS → short XPath with predicate → text** as the last resort.

### Playwright: locator by the user's eyes
Playwright for Java models locators on the **accessibility role** — what the user (and screen readers) actually see:

~~~java
page.getByRole(AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Sign in")).click();
page.getByLabel("Email").fill("bean@example.com");
page.getByTestId("checkout-btn").click();
~~~

**{{getByRole}}** matches role (button, textbox, link...) and display name — changing class is fine, changing **button text** matters (sync wording with the frontend team). Architectural difference: Selenium {{findElement}} **takes a snapshot** — returns an object pointing to the node at call time; Playwright {{Locator}} is a **lazy description** — resolved only when the action runs, so it re-finds the element after each DOM change (the basis of auto-wait — next lesson).

### Common mistakes
- One element matches the selector but **more than one node** matches: {{findElement}} returns the first node — the test clicks the wrong node, a confusing flaky. Playwright catches this: a selector matching multiple nodes fails the action immediately with a clear message.
- Forgetting the selector is inside an **iframe**: call {{driver.switchTo().frame(...)}} first, because each iframe is its own DOM tree.
- Copying a selector from DevTools via "Copy XPath" — produces the worst possible absolute path.

### Interview relevance
Classic question: "Which locator is most durable and why?" — answer by principle, not a list: the most durable locator is the one with **the least irrelevant information**, deliberately set by the team (data-testid). When asked "the UI keeps changing, how does your suite survive", scoring points: attach testid to components, centralize locators in a page object (lesson 4), run a locator-broken report on failure to know where it broke.

> Senior tip: proposing {{data-testid}} must come with a commitment to strip it from the production bundle; otherwise the frontend reviewer will block it over exposing DOM structure. A deal that works: "testid is the API contract between UI and test; I take responsibility for fixing tests when it changes."`,
    exercises: [
      {
        title: 'Write a CSS locator subset on a fake DOM',
        prompt: `Given {{DomNode}} simulating a DOM node: {{tag}}, {{attrs}} (Map id/class/type/href...), {{children}}. Write {{Locator.css(root, selector)}} returning **the list of matching nodes, in document order** (depth-first recursion: node first, then its children...).

Selector language (CSS subset, case-sensitive):

- A selector consists of **segments** separated by spaces: the **descendant** relationship — the node matching the last segment must be in the subtree of the node matching the previous segment.
- One segment = a compound: optional {{tag}} first + {{#id}} + {{.class}} + {{\[attr=value\]}}, all **AND**. {{.class}} matches if the value is in the attribute {{class}} split by spaces.
- Example on the tree from the example above: {{css(root, "form button")}} returns buttons inside the form at any depth; {{css(root, "#submit")}} returns exactly the node with {{id=submit}}.

No need to support other selectors (">", ",", * prefix, quoted values...). Return {{List.of()}} (empty list) if no node matches.

{{DomNode}} and the function signature are given; write only the body of {{Locator.css}} (private helper methods allowed).`,
        hints: [
          'Selenium-style solution: traverse the tree once to get nodes in document order ({{collect}}), then for each segment filter the current list.',
          'For segment k>0, a node is taken only if it is a **true descendant** ({{==}} on the subtree) of a node from class k−1 — not the node itself.',
          'Parse compound: read the tag until the first #/./*[ character; each following part is cut until the next #/./*[. Attribute {{[k=v]}} locates = and ].',
        ],
        explain: `The "layer-by-layer filtering" structure correctly simulates how a browser/CSS engine handles the descendant combinator: the set of nodes matching previous segments, then expanded. Note two easy-to-miss details:

1. {{.btn}} must match by **token** of the class attribute ({{class="btn primary"}}), not {{contains(string)}} — otherwise {{.bt}} would also match, exactly the bug the {{class*=}} locator causes on real Selenium.
2. Descendant must be a **real tree relationship** ({{contains}} uses {{==}} node identity): checking only "ancestor matches the previous segment" along a single parent chain fails when multiple branches match.

This is the core of a locator engine: real DOM adds pseudo-classes, shadow DOM, and frames — but 95% of selectors in real suites lie in the subset you just wrote.`,
      },
    ],
    check: [
      {
        q: 'Which locator is usually **most durable** against appearance changes (class, layout, text)?',
        options: [
          'Absolute XPath',
          'CSS by build-generated class (css-1x9k2)',
          'data-testid deliberately attached for tests',
          'linkText',
        ],
        explain: 'data-testid exists only to serve tests, controlled by the team, not changed by style or refactor; the other three attach directly to what changes most often.',
      },
      {
        q: 'In CSS selector {{form.login button#submit}}, what does the space between two segments mean?',
        options: [
          'Direct child only',
          'Descendant at any depth',
          'Two independent selectors',
          'First segment ignored',
        ],
        explain: 'Space = descendant combinator: find button#submit inside the subtree of form.login, at any depth. In real CSS, direct child uses the > operator — outside this lesson\'s selector subset.',
      },
      {
        q: 'Why is {{/html/body/div[3]/button[1]}} considered a bad locator?',
        options: [
          'XPath does not support this syntax',
          'Just adding, removing, or reordering one element above makes it point wrong or die',
          'It is always slower than id',
          'The browser rejects paths with numbers',
        ],
        explain: 'It encodes the **current physical position** in the DOM instead of the element\'s meaning. A banner inserted at body shifts the whole locator to div[4].',
      },
      {
        q: 'What is the architectural difference between Playwright Locator and Selenium findElement?',
        options: [
          'Locator is faster because it caches nodes',
          'Locator is a lazy description: each action re-resolves and waits for the element; findElement snapshots immediately',
          'Locator does not need a browser',
          'findElement waits until the element is visible',
        ],
        explain: 'Because it re-resolves on every use, when the DOM re-renders the locator finds the new node — that is the basis of auto-wait. Selenium\'s WebElement is a stale reference: DOM change = stale.',
      },
    ],
  },
});
