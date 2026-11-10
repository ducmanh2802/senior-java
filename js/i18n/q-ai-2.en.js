/* English translation of js/data/q-ai.js — task T1137. Format: js/core/i18n.js (content overlay). */
App.i18n.content({
  'ai-011': {
    q: 'Using AI coding assistants (Copilot, Claude Code, Cursor) in a team: real benefits, risks, and how to set up a review process for code written by AI?',
    a: `**Summary:** AI coding assistants accelerate repetitive work and discover APIs, but can produce code that compiles correctly yet is logically wrong, increase tech debt, and leak data if used incorrectly. Value comes from process: clear prompts, careful review, automated tests, and rules governing what data may be sent to the tool.

### Real benefits
- Writing boilerplate: DTOs, mappers, test skeletons, config.
- Explaining unfamiliar code, reading logs, suggesting root causes.
- Converting syntax/languages, writing regex, one-shot scripts.
- Speeding up learning new libraries (but always verify official documentation).
- Supporting small refactors, renaming, adding null checks.

### Risks
- **API hallucination**: calling methods/classes that don't exist or have wrong signatures. Code compiles but logic is wrong — riskier than syntax errors.
- **Code runs correctly but not functionally**: missing edge cases, wrong transaction order, wrong call sequence.
- **Security**: generated code with SQL injection, logging secrets, weak algorithms, or adding unknown dependencies.
- **License/dependency**: recommended libraries with incompatible licenses or package squatting (slopsquatting).
- **Data leakage**: pasting proprietary code, secrets, customer data into tools without approval.
- **Skills**: junior devs rely too heavily, reducing debug and code comprehension ability.
- **Tech debt**: many duplicate codes, missing design, hard to maintain.

### Review process
1. Treat AI-generated code like code from an unfamiliar contributor: review line by line, don't glance over.
2. Mandatory tests: unit tests for logic, integration tests for DB/API; AI-written tests also need review because they may test incorrectly.
3. Check new dependencies: source, license, popularity, known CVEs.
4. Run static analysis/SAST, dependency scans like every PR.
5. With security/finance/data changes, need experienced reviewer for deeper check.
6. Clearly note in PR if code is created mostly by AI so reviewers know how much extra care is needed.
7. Never merge code the author doesn't explain what it does.

### Team conventions
- List allowed tools and allowed data.
- Never paste secrets, tokens, personal data, client code into unapproved tools.
- Prefer tools with offline mode or self-hosted.
- Provide prompt guidance: supply context, constrain Java/Spring versions, require explanations.
- Measure effectiveness by quality/lead time, not just lines of code.

### Effective use
- Split work small, demand clear goals, attach related files and conventions.
- Require AI to explain tradeoffs before coding parts it handles.
- Use AI to generate tests from requirements, then verify tests really test the right thing.
- For important code, design first, AI only supports implementation.

### Why AI-generated code can "look right but be wrong"
Models generate code by predicting tokens with high probability based on the context they see. They **do not execute code**, do not know the actual database schema, and do not know the team's internal conventions unless you put them into the context. Therefore, they are great at creating code **similar** to common patterns on the Internet: correct syntax, reasonable naming, but may use incorrect API versions (e.g., outdated Spring Security configurations), omit {{@Transactional}}, or assume a column that does not exist. Agent-type tools (Claude Code, Cursor agent mode) reduce the issue because they can read files in the repo, run tests and compilers, but they are only as correct as your tests check for. Practical conclusion: **tests are the contract**; parts without tests can be wrong without anyone knowing.

### Real-world example
An 8-person team enabled AI assistants for their entire repo. After 2 months: PRs per week increased from 35 to 52, but average review time rose from 3 to 7 hours and there were 2 production incidents. One incident: AI-generated method called {{repository.findAll()}} then filtered in Java — ran fast on 100-row test data, but OOMed on 2 million rows in production. Investigation showed large PRs (avg 600 lines) and reviewers just skimmed. Team changed the process: max PRs around 300 lines, mandatory integration tests with Testcontainers for DB-accessing code, specific review checklist for queries and transactions, and the author must explain each part in the review session. After 6 weeks: review time returned to 4 hours, no new AI-related incidents, PR count remained about 30% higher than before.

### Sample answer for interview
"I treat AI assistants as a fast but system-ignorant contributor. It's great for boilerplate, test skeletons, explaining unfamiliar code, and quickly trying new APIs, but it generates code based on common patterns, not by executing it, so it can misuse API versions, miss transactions, or query inefficiently on real data. Therefore, the process is more important than the tool. First, data policy: never paste secrets or customer data into unapproved tools. Second, small PRs and mandatory tests, especially integration tests for DB parts. Third, the author must explain the code they submit, they cannot say 'AI wrote it'. Fourth, automated dependency and secret scanning because AI can suggest non-existent or malicious packages. I measure effectiveness by lead time, review time, and post-release error rate, not lines of code."

> Senior tip: real productivity isn't typing speed but understanding and trust. An AI PR written 3× faster but review takes 5× longer is a loss. Invest in tests, conventions and strong reviewers — that's what turns AI into leverage rather than risk.`,
    follow: [
      'Why can AI-compiled code still be dangerous than syntax errors?',
      'What rules about data you can paste into AI tools would you set?',
      'How do you measure AI assistant effectiveness without counting lines of code?'
    ]
  }
});
