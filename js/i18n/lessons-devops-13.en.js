/*
 * English translation of js/data/lessons-devops.js — task T1035. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-021
 */
App.i18n.content({
  'lesson-devops-021': {
    title: 'Measuring the platform as a product: calculating the 4 DORA metrics from deployment and incident data',
    goals: [
      'Understand the 4 DORA metrics: deployment frequency, lead time for changes, change failure rate, and time to restore service',
      'Calculate the metrics yourself from raw data (commit, deployment, and incident timestamps)',
      'Know why lead time uses the median and how to avoid common measurement pitfalls',
      'Use metrics to demonstrate the value of the platform, not to score individual performance',
    ],
    body: `### Why a platform team must measure
A platform is an **internal product**: without measurement, you cannot prove it helps teams move faster and more safely, and you do not know where to invest next. The DORA (DevOps Research and Assessment) research proposes 4 metrics that balance **speed** and **stability**:
| Metric | Question | Simple calculation |
|---|---|---|
| Deployment frequency | How often do you deploy to production? | Number of deployments / number of days |
| Lead time for changes | How long does it take from a commit to production? | Median of (deployment time − commit time) |
| Change failure rate | What percentage of deployments cause an incident? | Deployments that caused an incident / total deployments |
| Time to restore (MTTR) | When an incident occurs, how long does recovery take? | Average of (recovery time − start time) |
The first two metrics measure **speed**; the last two measure **stability**. A team that deploys frequently but suffers constant incidents, or a team that is stable but deploys only once a month, is not doing well in either case.

### Why lead time uses the median
Lead time has a **long tail**: most changes reach production within a few hours, but occasionally a change sits waiting for 3 weeks (a forgotten branch). The average is skewed by a few large values; the **median** reflects the typical experience. With an even number of elements, the median is the average of the two middle values.

~~~java
// Median of a list of durations (seconds)
List<Long> xs = new ArrayList<>(secs);
Collections.sort(xs);
int n = xs.size();
long median = n % 2 == 1 ? xs.get(n / 2) : (xs.get(n / 2 - 1) + xs.get(n / 2)) / 2;
~~~

### Measurement pitfalls
- The **definition of "incident"** must be consistent (rollback, hotfix, P1–P2 incident) — otherwise every team counts differently.
- **Do not divide by 0**: a time window with no deployments or no incidents must return a reasonable value (0 or empty), not throw an error.
- **Collect data automatically** from systems (Git, pipelines, incident tooling), not by manual entry.
- **Do not use metrics to score individuals or compare teams**: the metrics will be "beautified" (splitting deployments into meaningless pieces, failing to report incidents). Use them to spot trends and find bottlenecks.

> The strongest story for a platform engineer's CV looks like this: "after introducing the golden path and automated canary, median lead time dropped from 4 days to 6 hours and the change failure rate fell from 18% to 6%." The exercise below is exactly how you calculate those numbers.

### Interview notes
"How do you know your platform delivers value?" — answer with DORA metrics measured automatically before and after, combined with developer experience surveys, and make it clear that the metrics are used to improve the system, not to evaluate individuals.`,
    exercises: [{
      title: 'Calculate the 4 DORA metrics',
      prompt: `Write the methods of {{DoraCalculator}}:
- {{deploysPerDay(List<Deploy> deploys, int days)}}: number of deployments / days (double). {{days <= 0}} → {{IllegalArgumentException}}.
- {{medianLeadTime(List<Deploy> deploys)}}: median of {{deployedAt − committedAt}} (in seconds; for an even number of elements take the average of the two middle values, using integer division). Empty list → {{Duration.ZERO}}.
- {{changeFailureRate(List<Deploy> deploys)}}: the fraction of deployments with {{causedIncident == true}} (0.0 if empty).
- {{meanTimeToRestore(List<Incident> incidents)}}: average of {{resolvedAt − startedAt}} in seconds (integer division); empty → {{Duration.ZERO}}.`,
      hints: [
        'Duration.between(a, b).getSeconds() gives the duration in seconds.',
        'Median: sort the list; for an odd count take the middle element, for an even count take the average of the two middle elements.',
        'Handle the empty list first to avoid division by 0.',
      ],
      explain: `The metrics are all simple calculations; the hard part lies in the **definitions and the data**. The code separates each metric clearly, handles empty cases, and uses the **median** for lead time because the distribution has a long tail: in the test, a single change that waited 72 hours pulls the average up to 20.25 hours while the median is 4 hours — much closer to the real experience.
Common mistakes: using the average for lead time; forgetting the empty-list case (division by 0 produces NaN); computing the change failure rate over the number of incidents instead of the number of deployments; using {{toHours()}} and losing the fractional part.`,
    }],
    check: [
      { q: 'The lead times of 5 changes are: 1h, 2h, 3h, 4h, 200h. Why should you report the median rather than the average?', options: ['The median of 3h reflects the typical experience; the average of 42h is skewed by one large value', 'The average is harder to compute', 'The median is always greater than the average', 'DORA forbids using the average'], answer: 0, explain: 'With a long-tailed distribution the average (42h) does not represent most changes; the median (3h) does. Computational difficulty is not the reason. The median is not always greater than the average — here it is much smaller. There is no rule forbidding the average.' },
      { q: 'Which DORA metrics measure stability?', options: ['Change failure rate and time to restore', 'Deployment frequency and lead time', 'Deployment frequency only', 'Lines of code per week'], answer: 0, explain: 'Change failure rate and time to restore measure stability; deployment frequency and lead time measure speed. Lines of code is not a DORA metric and does not reflect value.' },
      { q: 'Leadership wants to rank each developer by DORA metrics. What is the most appropriate response?', options: ['The metrics are for systems and teams to spot trends; ranking individuals will cause the metrics to be beautified and lose their value', 'Agree because the metrics are objective', 'Only rank by deployment frequency', 'Rank them but do not publish the results'], answer: 0, explain: 'When metrics become a personal evaluation target, people optimize the numbers (splitting deployments, not reporting incidents) instead of the real outcomes. Using only a speed metric further encourages ignoring stability. A private ranking still creates an incentive to beautify the numbers.' },
    ],
  },
});
