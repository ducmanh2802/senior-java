/*
 * English translation of js/data/lessons-devops.js — task T1034. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-018 lesson-devops-019 lesson-devops-020
 */
App.i18n.content({
  'lesson-devops-018': {
    title: 'Pipeline as code: the dependency graph (DAG), parallel execution, and cycle detection',
    goals: [
      'Understand why a real CI/CD pipeline is, at its core, a dependency graph between its steps (jobs)',
      'Schedule steps into "waves" that can run in parallel from a dependency list',
      'Detect circular dependencies and dependencies on non-existent steps before the pipeline runs',
      'Know the levers that make a pipeline faster: parallelism, caching, and running only the affected parts',
    ],
    body: `### A pipeline, viewed as data
A CI/CD pipeline is made of several **steps (jobs)**: checkout, build, unit test, integration test, vulnerability scan, build image, push image, deploy. Some steps **depend on** others (you cannot build the image before the jar is built), while some steps are **independent** (unit tests and a dependency scan can run at the same time). Written as data:
~~~text
build:        (no dependencies)
unit-test:    build
it-test:      build
dep-scan:     (no dependencies)
image:        unit-test, it-test
image-scan:   image
deploy-dev:   image-scan, dep-scan
~~~
This is a **Directed Acyclic Graph** (DAG): each step is a vertex and each dependency is an edge. GitHub Actions ({{needs:}}), GitLab CI ({{needs:}} or stages), Jenkins (stage + parallel), Argo Workflows, and Airflow all model pipelines this way.

### Scheduling by "waves" (topological levels)
The idea (Kahn's algorithm by levels):
1. Wave 1 = every step that has **no unfinished dependencies**.
2. Treat wave 1 as finished and remove those steps from the dependency lists of the remaining steps.
3. Wave 2 = the steps that now have no dependencies left. Repeat until no steps remain.
For the example above: wave 1 = build, dep-scan; wave 2 = it-test, unit-test; wave 3 = image; wave 4 = image-scan; wave 5 = deploy-dev. Steps in the same wave **can run in parallel**. The pipeline time ≈ the sum of the **longest step** in each wave (the critical path), not the sum of every step.

### Two configuration errors to catch before running
- **Circular dependency**: A needs B, B needs A → no step can ever start; the pipeline hangs or reports a confusing error. The algorithm above detects this: if no step becomes ready while steps remain unscheduled → there is a cycle.
- **Dependency on a step that does not exist** (a typo like "unit-tests" instead of "unit-test"): this must be reported clearly right away, never silently ignored.

### Making the pipeline faster
| Lever | Idea | Caveat |
|---|---|---|
| Parallelism | Independent steps run in the same wave | Limited by the number of runners |
| Shorten the critical path | Optimize the longest step of each wave | Optimizing a step off the critical path does not make the pipeline faster |
| Content-addressed cache | Key = hash of the lock file (pom.xml, gradle.lockfile); a changed key triggers a fresh dependency download | A wrong key lets a stale cache cause hard-to-debug failures |
| Run only the affected parts | Monorepo: build only the modules that changed | Default to safe: a change to a shared file must run everything |
| Split tests | Shard integration tests across several runners | Balance shards by execution time |

~~~java
// Critical path: pipeline time by waves (assuming unlimited runners)
long total = 0;
for (List<String> wave : waves) {
    long longest = 0;
    for (String step : wave) longest = Math.max(longest, durationSec.get(step));
    total += longest;   // steps in a wave run in parallel -> count only the longest
}
~~~

> On a platform team, you do not write a pipeline per service — you write a **reusable pipeline** (reusable workflow, template). Validating the DAG as soon as the configuration is read lets every team catch configuration errors in seconds instead of after 10 minutes of waiting for a runner.

### Interview notes
The question "how do you cut a pipeline from 40 minutes down to 10?" is really asking whether you see the pipeline as a DAG: find the critical path, parallelize independent steps, cache with the right key, and run only the affected parts. Being able to say "pipeline time is the sum of the longest step in each wave, so optimizing a step off the critical path does not help at all" is a clear Senior signal.`,
    exercises: [{
      title: 'Schedule a pipeline into parallel waves',
      prompt: `Write {{PipelinePlanner.plan(Map<String, List<String>> deps)}}: the key is the step name and the value is the list of steps it depends on.
- Return a list of **waves**: each wave is a list of steps that can run in parallel, and the steps inside a wave must be **sorted in alphabetical order**.
- A step goes into the earliest possible wave (all of its dependencies are already in earlier waves).
- A dependency on a step not present in the map → throw {{IllegalArgumentException}} with a message that contains the name of the missing step.
- A circular dependency → throw {{IllegalArgumentException}} with a message that contains the word {{cycle}}.`,
      hints: [
        'Count, for each step, how many unfinished dependencies it has; the first wave contains the steps whose count is 0.',
        'After each wave, decrease the count of the steps that depend on the steps just finished; any step that reaches 0 goes into the next wave.',
        'If you run out of ready steps while the total number of scheduled steps is still less than the total number of steps, there is a cycle.',
      ],
      explain: `The solution is **Kahn's algorithm by levels**: track the number of unfinished dependencies (in-degree), put the steps with count 0 into a wave, "complete" the whole wave, then decrease the count of the steps that depend on them. The complexity is O(number of steps + number of edges).
- Check for a non-existent step **first**, so you report the real cause instead of reporting "cycle".
- Use a {{HashSet}} when counting so that a duplicated dependency declaration does not corrupt the count.
- Sort inside each wave to make the result **deterministic** — important for tests and for readable logs.
Common mistakes: doing a recursive DFS without a "visiting" marker and therefore missing cycles; scheduling one step at a time instead of by waves and losing the information about which steps can run in parallel.`,
    }],
    check: [
      { q: 'A pipeline has 3 waves; the step durations are: wave 1 {4, 2} minutes, wave 2 {6, 1, 3} minutes, wave 3 {2} minutes. With unlimited runners, how long does the pipeline take?', options: ['12 minutes', '18 minutes', '6 minutes', '10 minutes'], answer: 0, explain: 'Each wave runs in parallel, so you only count the longest step: 4 + 6 + 2 = 12 minutes. 18 minutes is the sum of every step (running sequentially). 6 minutes is just the longest step of a single wave. 10 minutes misses wave 3 or is miscounted.' },
      { q: 'You optimize the "dep-scan" step from 3 minutes down to 1 minute, but the pipeline still takes exactly the same total time. What is the most plausible explanation?', options: ['dep-scan is not on the critical path: another step in the same wave is still longer', 'The cache is broken', 'The runners execute sequentially so every optimization is pointless', 'The pipeline has a circular dependency'], answer: 0, explain: 'The time of a wave equals its longest step; shortening a step that is not the longest does not change the total. A broken cache usually makes things slower, not unchanged. If runners executed sequentially, optimizing any step would reduce the total. A cycle would prevent the pipeline from running at all.' },
      { q: 'What is the best basis for a Maven dependency cache key?', options: ['A hash of the contents of pom.xml (and the lock file, if present)', 'The git branch name', 'The date the pipeline runs', 'An incrementing build number'], answer: 0, explain: 'Keying by the content of the dependency declaration file means: unchanged dependencies reuse the cache, and a change triggers a fresh download. Keying by branch forces every new branch to download from scratch. Keying by date or by build number means you almost never get a cache hit.' },
    ],
  },

  'lesson-devops-019': {
    title: 'Quality gate: blocking a merge by coverage and vulnerability thresholds, with time-limited exceptions',
    goals: [
      'Understand a quality gate as an automated policy that decides whether a change may be merged/deployed',
      'Design gate rules: tests, coverage of new code, and vulnerabilities by severity',
      'Handle exceptions (waivers) with an expiry instead of turning the gate off',
      'Return clear reasons so the developer knows exactly what to fix',
    ],
    body: `### What is a quality gate
A quality gate is an **automated gate** in the pipeline: it reads the results of other steps (tests, coverage, vulnerability scanning, secret scanning) and decides **PASS** (may merge/deploy) or **FAIL** (blocked), together with the **reasons**. SonarQube has a "Quality Gate", GitHub/GitLab have required status checks, and scanning tools like Trivy have {{--exit-code}} by severity. A platform team usually provides **one shared policy** for every service instead of letting each team choose its own.

### Designing sensible rules
| Rule | Why | Pitfall |
|---|---|---|
| No failing tests | Obvious | Flaky tests make everyone want to turn the gate off — fix the flakiness, do not disable the gate |
| Coverage **on new code** ≥ 80% | You do not force a team to fix the whole legacy codebase before they can merge | Coverage of the entire repo makes the gate meaningless for a legacy codebase |
| No **CRITICAL** vulnerabilities left unhandled | High risk of exploitation | A vulnerability in a library that has no fix yet |
| Number of HIGH vulnerabilities ≤ a threshold | Gradual control | A threshold that is too strict when first adopted → every PR turns red |
| No secrets in code | Credential leakage | False positives on test strings |

### Time-limited exceptions (waivers)
When a CRITICAL vulnerability sits in a library that **has no fix yet** and you have assessed that it cannot be exploited in your context, the team needs a way to keep working **without turning the whole gate off**. The right approach is a **waiver**: an exception for that exact vulnerability id, with a reason, an approver, and an **expiry date**. When it expires and the issue is still unresolved → the gate blocks again. A waiver without an expiry will live forever and the gate will gradually lose its meaning.

~~~java
// A waiver stays active through the end of its expiry date (date-based comparison, easy for an approver to reason about)
boolean active(Waiver w, LocalDate today) {
    return !today.isAfter(w.expires());   // today <= expires
}
~~~
Pass {{LocalDate today}} in instead of calling {{LocalDate.now()}} inside: the function becomes **deterministic** and testable (see the Clock injection lesson).

### Return reasons, not just PASS/FAIL
The developer needs to know **what to fix**: "COVERAGE: 72% < 80% on new code", "CRITICAL: CVE-2024-1234 in library X (no waiver)". A gate that only prints "FAILED" pushes people to work around it. A stable order of reasons makes runs easy to compare.

> At platform scale, the gate policy should be **managed as code** (a configuration file in a shared repo, reviewed) and **rolled out gradually**: a warning mode for a few weeks (report only, do not block) before turning blocking on — otherwise, on day one 80% of PRs turn red and the teams will push back against the whole platform.

### Interview notes
The question "how do you design a quality gate for 30 services?" checks whether you can balance safety and speed: coverage on new code rather than the whole repo, blocking by severity, time-limited waivers with an approver, a gradual rollout starting from warning mode, and clear reasons for the developer.`,
    exercises: [{
      title: 'Evaluate a quality gate with time-limited waivers',
      prompt: `Write {{QualityGate.evaluate(report, policy, waivers, today)}} and return {{GateResult(boolean passed, List<String> reasons)}}. Check in **exactly this order** and append a reason:
1. {{report.failedTests() > 0}} → {{"TESTS_FAILED"}}
2. {{report.newCodeCoverage() < policy.minNewCoverage()}} → {{"COVERAGE"}}
3. Each finding with severity {{CRITICAL}} that has **no active waiver** → {{"CRITICAL:" + id}} (in the order they appear in the report)
4. The number of {{HIGH}} findings with no active waiver is **greater than** {{policy.maxHigh()}} → {{"HIGH_COUNT"}}
A waiver is active when its {{findingId}} matches and {{today}} is not after {{expires}}. {{passed}} is true when there are no reasons.`,
      hints: [
        'First build a Set of the ids of findings that have an active waiver: !today.isAfter(expires).',
        'Iterate the findings in report order; skip a finding that is in the Set; add a reason immediately for CRITICAL, and count HIGH.',
        'Append HIGH_COUNT at the end, when the number of unwaived HIGH findings is greater than maxHigh.',
      ],
      explain: `Separate the **data** (report, policy, waiver, today) from the **logic** to make the gate deterministic and testable: do not call {{LocalDate.now()}} inside. Waivers are normalized into a {{Set}} of active ids before iterating, so each finding needs only an O(1) lookup.
- The convention "active through the end of the expiry date" ({{!today.isAfter(expires)}}) must be written down clearly in the policy documentation, because that is how approvers read dates.
- A stable order of reasons makes runs easy to diff.
Common mistakes: using {{today.isBefore(expires)}}, which makes the waiver expire one day early; counting HIGH findings that are already waived; returning only the first reason, which forces the developer to fix things one round at a time.`,
    }],
    check: [
      { q: 'Why should the coverage threshold be set on **new code** rather than the whole repo for a legacy codebase?', options: ['So every new PR must have tests without forcing the team to fix all legacy code before merging', 'Because whole-repo coverage cannot be measured', 'Because legacy code cannot run tests', 'To speed up the pipeline'], answer: 0, explain: 'Whole-repo coverage on a legacy codebase is often low, so a high threshold would block every PR even if that PR has good tests; measuring new code applies pressure in the right place. Whole-repo coverage can still be measured. Legacy code can still run tests. The threshold does not affect pipeline speed.' },
      { q: 'A CRITICAL CVE in a library that has no fix yet is blocking every PR. What is the right way to handle it?', options: ['Create a waiver for that exact CVE, with a reason, an approver, and an expiry date', 'Turn off vulnerability scanning until a fix is available', 'Downgrade CRITICAL to HIGH in the configuration', 'Allow manual merges without the gate'], answer: 0, explain: 'A time-limited waiver keeps the gate working for every other vulnerability and blocks again automatically when it expires. Turning off scanning or bypassing the gate removes protection entirely. Changing the severity hides the risk and affects every other CVE.' },
      { q: 'A platform team wants to roll out a new quality gate to 30 services. Which rollout causes the least pushback?', options: ['Run in warning mode for a few weeks, share the numbers, then turn blocking on', 'Turn blocking on for everyone immediately to enforce discipline', 'Let each team choose whether to use the gate', 'Apply it only to new services and never to existing ones'], answer: 0, explain: 'Warning mode gives teams time to fix issues and gives the platform data to tune the thresholds. Turning blocking on immediately usually turns most PRs red on day one. Leaving it optional means no one uses it. Excluding existing services forever leaves the highest-risk code uncontrolled.' },
    ],
  },

  'lesson-devops-020': {
    title: 'Golden path: a template that creates a new service with validated parameters',
    goals: [
      'Understand the golden path / paved road: the standard, easiest way for a team to create and operate a service',
      'Design a template that generates a new service (code, pipeline, Helm values, dashboard) from a few parameters',
      'Validate input parameters strictly so you never generate a non-compliant service',
      'Detect unresolved placeholders before creating the repo',
    ],
    body: `### What is a golden path
A company has 40 services: every team writes its own Dockerfile, pipeline, Helm chart, and dashboard in its own way → 40 different approaches, every upgrade requires touching 40 places, and a newcomer spends days understanding the setup. The **golden path** (or paved road) is the **supported standard route**: use it and everything is ready and maintained; go off it and you still can, but your team owns the responsibility. It is not a ban — it is the **easiest** path.

### A template that creates a new service
In Backstage this is called a **software template**; in a smaller company it might be a sample repo plus a script. The user enters a few parameters and the template generates:
~~~text
Parameters: name = payment-reconciler, team = payments, port = 8080
Generates:
  payment-reconciler/
    pom.xml                     (groupId, artifactId derived from name)
    Dockerfile                  (standard image, non-root user)
    .github/workflows/ci.yml    (calls the platform's reusable workflow)
    deploy/values.yaml          (Helm values for the shared chart: name, team, port, probes)
    catalog-info.yaml           (registers in the service catalog: owner = payments)
    docs/index.md               (starter documentation)
~~~
Each file in the template contains **placeholders** such as {{__NAME__}}, {{__TEAM__}}, {{__PORT__}}; the tool replaces them with the real values — in both the **file contents** and the **file paths**.

### Validating parameters: a mistake here multiplies everywhere
A service name appears in DNS, in Kubernetes object names, in the repo name, and in metrics. Kubernetes requires names to be valid DNS labels: lowercase letters, digits, and hyphens; starting with a letter; not ending with a hyphen; at most 63 characters. Platform teams often enforce stricter rules (for example 3–30 characters, no consecutive hyphens). Validate **before generating** and report clearly which field is wrong.
| Parameter | Rule | Why |
|---|---|---|
| name | 3–30 chars, a-z 0-9 and "-", starts with a letter, no "--", does not end with "-" | Valid for DNS, Kubernetes, and repo names |
| team | Not null, not empty after trim (and in the list of teams) | Every service must have an owner for on-call |
| port | Integer 1024–65535 | No privileged ports, no out-of-range values |

### Unresolved placeholders
Templates are edited by many people; someone adds {{__REGION__}} to a file but forgets to add the parameter. If you do not check, the generated service contains the literal string {{__REGION__}} and fails at deploy time in a very confusing way. After rendering, **scan** every file: if any pattern like {{__UPPERCASE__}} remains, stop and report an error.

~~~java
// Replace placeholders in both the path and the content
String render(String text, Map<String, String> values) {
    String out = text;
    for (Map.Entry<String, String> e : values.entrySet())
        out = out.replace(e.getKey(), e.getValue());   // replace substitutes every occurrence, not a regex
    return out;
}
~~~

> Measure the golden path like a product: **time from clicking "create service" to the service running in the dev environment**, the share of new services that use the template, and how often teams have to ask the platform team for help. If the template is harder to use than doing it yourself, teams will not use it.

### Interview notes
"How do you standardize the way 20 teams create a service?" — a Senior answer: the golden path is the easiest route, not a ban; the template generates code, pipeline, deploy config, dashboard, and catalog registration; parameters are validated strictly; the template is versioned with a path to update services already generated; and you measure onboarding time and adoption rate.`,
    exercises: [{
      title: 'Render a new-service template with parameter validation',
      prompt: `Write {{ServiceScaffolder.render(templates, params)}}: {{templates}} is a map of path → content, containing the placeholders {{__NAME__}}, {{__TEAM__}}, {{__PORT__}}. Return a {{TreeMap}} of path → rendered content (replace in **both the path and the content**).
- {{name}}: 3–30 characters, only lowercase letters a–z, digits, and "-"; starts with a letter; does not end with "-"; does not contain "--". If invalid → throw {{IllegalArgumentException}} with a message that contains {{name}}.
- {{team}}: not null, not empty after trim. If invalid → throw {{IllegalArgumentException}} containing {{team}}.
- {{port}}: an integer in 1024–65535. If invalid (including not a number) → throw {{IllegalArgumentException}} containing {{port}}.
- After replacement, if any path or content still contains a string of the form {{__X__}} (two underscores, one or more **uppercase** letters A–Z or "_", two underscores) → throw {{IllegalStateException}}.`,
      hints: [
        'Validate name, team, and port before rendering; each error throws an IllegalArgumentException whose message contains the field name.',
        'Use String.replace (not replaceAll) to substitute placeholders in both the key and the value.',
        'After replacement, scan the string for "__" + uppercase letters + "__"; if found, throw IllegalStateException.',
      ],
      explain: `Two main ideas: **validate the input before generating** and **validate the output after generating**.
- Validate the name with an explicit character loop (you could use a regex in real code), paying attention to the easy-to-miss rules: does not end with "-", no "--", starts with a letter.
- {{Integer.parseInt}} throws {{NumberFormatException}} for "abc" — catch it and rethrow as {{IllegalArgumentException}} that names the field so the user understands the problem.
- Return a {{TreeMap}} so the file order is stable when printing or committing.
- Scanning for unresolved placeholders after rendering is a safety net for templates edited by many people.
Common mistakes: using {{replaceAll}}, which treats the value as a regex; forgetting to replace placeholders in the **file path**; validating only the name length while ignoring which characters are allowed.`,
    }],
    check: [
      { q: 'What distinguishes a golden path from a "mandatory rule"?', options: ['A golden path is the easiest supported route; you can still go off it, but your team owns the responsibility', 'A golden path forbids every other approach', 'A golden path is only documentation, with no tooling', 'A golden path applies only to new services written in Java'], answer: 0, explain: 'A golden path attracts people through convenience and support; it does not ban alternatives. Forbidding every other approach is a hard rule and usually triggers pushback. A golden path comes with tooling such as templates and pipelines, not just documentation. It is not limited to a single language.' },
      { q: 'Why must you scan for unresolved placeholders after rendering a template?', options: ['Templates are edited by many people; a new placeholder missing a parameter would slip into the service and cause a confusing deploy-time failure', 'To make rendering faster', 'Because String.replace cannot substitute every occurrence', 'To validate that the service name is valid'], answer: 0, explain: 'Scanning after rendering catches template errors before the repo is created. It does not speed things up. String.replace substitutes every occurrence. Validating the name is input validation, done before rendering.' },
      { q: 'Which metric best reflects the quality of a golden path from a developer point of view?', options: ['Time from creating the service to having it running in the dev environment', 'The number of lines of code in the template', 'The number of services running in the cluster', 'How often the platform team deploys each week'], answer: 0, explain: "A golden path serves developers, so you measure their experience: time to a running service. The size of the template says nothing about its value. The number of running services depends on many other factors. The platform team's deploy frequency does not measure the experience of the platform's users." },
    ],
  },
});
