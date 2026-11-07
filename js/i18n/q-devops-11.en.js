/*
 * English translation of js/data/q-devops.js — task T671. Format: js/core/i18n.js (content overlay).
 * ids: devops-056
 */
App.i18n.content({
  'devops-056': {
    q: 'Your company has 8 on-call teams, each of 4–5 people rotating shifts. After 6 months: 2 people quit from burnout, the alert channel has 200+ alerts/week but 70% is noise, and response time to real incidents is slow because everyone has learned to "endure" alerts. How do you design a sustainable on-call policy: the rota structure, reducing alert fatigue, and migrating to SLO-based alerting?',
    a: `**Summary:** A sustainable on-call = the person on shift gets genuine rest, is woken only for problems that **truly affect users**, and has enough context/tools to act. Three pillars: (1) **Reasonable rota** — fair rotation, recovery time, never let one person carry too much; (2) **Reducing alert fatigue** — classify alerts (page vs ticket vs log), delete/tune noisy alerts, set thresholds on symptoms, not causes; (3) **SLO-based alerting** — alert when the error budget is being burned fast, instead of alerting on every small error. Target: on-call receives < 2 actionable pages per shift, and every page requires a real response.

### Background terms

- **On-call**: the person assigned to be ready to respond to incidents outside working hours. When the system raises a severe alert (a page), their phone/pager rings.
- **Rota**: the schedule of who is on call when. Example: person A takes this week, person B takes next week.
- **Alert fatigue**: when you receive too many alerts (especially alerts that need no action), the on-call person starts ignoring them, responding slowly, or muting notifications — and real incidents get missed.
- **Page**: a severe alert that wakes the on-call person immediately (phone call, SMS). Use it only for problems that need action **right now**.
- **Ticket**: an alert that matters but is not urgent — create a ticket to handle during working hours.
- **SLO (Service Level Objective)**: a service-level target, e.g. "99.9% of requests successful over 30 days" or "p99 latency < 500ms". Measured by an SLI (Service Level Indicator — the actual measured number).
- **Error budget**: the amount of errors "allowed" within the SLO period. A 99.9% SLO over 30 days = 0.1% allowed = ~43 minutes of downtime. If the budget is spent, stop shipping features and focus on reliability.
- **Burn rate**: the speed at which the error budget is being consumed. Burn rate = 1 means the budget will be exactly used up by the end of the period. Burn rate = 10 means the budget will be exhausted in 1/10 of the time (3 days if the period is 30 days).

### An everyday analogy

On-call is like a night security guard in an office building. **Alert fatigue** = the alarm system rings 30 times a night, 28 of them because a cat crosses the sensor — by the 29th time, the guard turns the bell off. The 30th time is a real burglar. **SLO-based alerting** = instead of alarming every time the sensor vibrates, alarm only when "the number of abnormal vibrations in 1 hour exceeds this month's allowance" — i.e. a systemic problem, not a cat. **A sustainable rota** = the guard works 1 week then rests 3 weeks, has a backup, and gets compensatory days off after night shifts with many incidents.

### Pillar 1: a sustainable rota

**Proposed structure (team of 4–5)**:
- **Primary + Secondary**: each shift has 1 primary on-call and 1 backup. The secondary is only paged if the primary does not respond within 15 minutes.
- **Cycle**: weekly rotation (1 week on, 3–4 weeks off). Avoid daily rotation (too much context switching) or 2-week rotation (burnout).
- **Follow-the-sun** (if you have teams across time zones): each team only covers its own working hours. Avoid night shifts — serious health impact.
- **No follow-the-sun** (single time zone): limit night paging. Example: during 18:00–08:00 only page for severity 1 (affecting > 50% of users). Severity 2 waits until morning.
- **Compensation**: night/out-of-hours shifts are compensated (money or days off). A shift with many incidents → extra recovery days.

**Rules**:
- Nobody is on call for > 1 consecutive week.
- After a shift with > 3 night pages → the next day is off or light duties.
- On-call people get no feature-work deadlines during their week on call (incidents + reliability improvements only).
- Review the rota monthly: is it fair? Who gets paged the most? Why?

### Pillar 2: reducing alert fatigue

**Step 1: audit the current alerts (alert audit)**

With 200 alerts/week and 70% noise = 140 meaningless alerts. Classify every alert:

| Action | Criterion | Example |
|---|---|---|
| **Keep + page** | Affects users now, needs action now | Error rate > 5% for 5 minutes, service down |
| **Turn into a ticket** | Needs handling but not urgent | Disk at 80% (2 days left), certificate expiring in 14 days |
| **Turn into a dashboard/log** | Reference information, no action needed | Short CPU spike, 1 pod restart (self-recovered) |
| **Delete** | Nobody acts on it, nobody remembers why it exists | A "test-alert-do-not-remove" alert from 2 years ago |

**Step 2: principles of good alert design**

- **Alert on symptoms, not causes**: alert on "users see 500 errors" (symptom), not on "CPU at 90%" (cause — high CPU does not necessarily mean users are affected). High CPU → look at the dashboard; users getting errors → page.
- **Every alert must have a runbook**: a link to the doc "when you get this alert, what to do first". An alert without a runbook = an alert nobody knows how to handle.
- **Every alert must be actionable**: if you get the alert and can do nothing (wait it out, self-recovers) → that is not a page, that is noise.
- **Deduplicate and group**: 1 service down triggers 15 alerts (health check fail, latency up, error rate up, downstream timeout...) → group them into 1 page with context.

### Pillar 3: SLO-based alerting

Instead of alerting on each metric individually, alert when the **error budget is burning fast**.

**SLO setup (example):**

~~~text
Service: payment-api
SLI: ratio of successful (non-5xx) requests / total requests
SLO: 99.9% over 30 days (rolling window)
Error budget: 0.1% = ~43.2 minutes of equivalent downtime per month

Burn rate alert (multi-window, multi-burn-rate):
┌──────────────────────────────────────────────────────────────────┐
│ Long window + short window (confirm) │ Burn rate │ Budget burn  │ Action    │
│───────────────────────────────────────────────────────────────────│
│ 1h + 5m both over threshold          │ 14.4x     │ 2% in 1h     │ PAGE      │
│ 6h + 30m both over threshold         │ 6x        │ 5% in 6h     │ PAGE      │
│ 3 days over threshold                │ 1x        │ 10% over 3d  │ TICKET    │
└──────────────────────────────────────────────────────────────────┘
~~~
**Prometheus alerting rule (example, burn rate 14.4x):**

~~~yaml
# Alert when 2% of the error budget burns within 1 hour (burn rate 14.4x)
# = at this pace, the 30-day budget is exhausted in ~50 hours
groups:
  - name: slo-payment-api
    rules:
      - alert: PaymentAPIHighBurnRate
        expr: |
          (
            sum(rate(http_server_requests_seconds_count{service="payment-api",status=~"5.."}[1h]))
            / sum(rate(http_server_requests_seconds_count{service="payment-api"}[1h]))
          ) > (14.4 * 0.001)
          and
          (
            sum(rate(http_server_requests_seconds_count{service="payment-api",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="payment-api"}[5m]))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: page
          service: payment-api
        annotations:
          summary: "payment-api is burning its error budget very fast (14.4x)"
          runbook: "https://wiki.internal/runbooks/payment-api-errors"
          dashboard: "https://grafana.internal/d/slo-payment"
~~~

**Why multi-window**: the long window (1h) confirms the problem is sustained (not a 30s spike). The short window (5m) confirms the problem is still happening (no page for an incident that self-recovered 55 minutes ago).

**Benefits of SLO-based alerting**:
- Less noise: small scattered errors that do not burn the budget fast → no page. Page only when it genuinely matters.
- Tied to user experience: the SLO reflects what users feel, not infrastructure metrics.
- Clear decisions: plenty of budget left → ship features. Budget nearly gone → focus on reliability. No gut-feel arguments.

### Rollout roadmap (6–8 weeks)

1. **Weeks 1–2**: alert audit — classify the 200 alerts. Delete/convert the 70% of noise. Every remaining alert must have a runbook.
2. **Weeks 2–3**: define SLI/SLO for the 3 most important services (ask: "what do users expect?"). Start measuring the error budget.
3. **Weeks 3–5**: roll out SLO-based alerting (burn rate) in parallel with the old alerts. Compare: which alerts fire, and which set is more accurate?
4. **Weeks 5–6**: turn off old alerts that SLO alerts have replaced. Review the rota: add a secondary, compensation, night-page limits.
5. **Weeks 6–8**: extend SLOs to the remaining services. Set up a monthly review: error budget report, on-call health (page count, satisfaction).

### Real-world traps

- **Over-ambitious SLO (99.99%)**: the error budget is tiny (4.3 minutes/month) → every small fluctuation burns budget → the team gets paged constantly again. Start with a realistic SLO (measure a 3-month baseline, set the SLO slightly above current reality), then improve gradually.
- **Too-loose SLO (99%)**: 7.2 hours of budget per month → users complain but alerts never fire. The SLO must reflect user expectations, not "easy to hit".
- **SLO alerts with no action**: high burn rate → page → the on-call person looks at the dashboard and does nothing, because there is no runbook. Every SLO alert needs a runbook and an authority/escalation path.
- **Ignoring on-call wellbeing**: you cut alerts but still rotate 1 person per week with no compensation and no recovery after a heavy shift → people still quit. The rota and compensation matter as much as the technique.
- **Measuring only infrastructure SLIs**: CPU, memory, pod count — they do not reflect the user experience. SLIs must be measured from the user's point of view (request success, latency at the entry point).

> Senior tip: a sustainable on-call is a **culture + engineering** problem, not engineering alone. Start with the alert audit (remove noise — wins show up in week one and the team feels it). In parallel, build SLOs for the 2–3 most important services. The single most important on-call health metric: **actionable night pages per week** — target < 2. If it stays > 2 for 2 weeks, that is an incident of the on-call process itself and must be treated with production-incident priority. Track "on-call toil" (time spent on repetitive work that creates no lasting value) — if > 50% of on-call time is toil, the team needs to invest in automation, not in more people on shift.`,
    follow: [
      'You set a 99.9% SLO for payment-api (30 days). This month 60% of the error budget was already spent in the first 10 days by one major incident. How do you run the remaining 20 days — freeze deploys, accept the risk, or adjust the SLO?',
      'A service has 3 dependencies (DB, Redis, an external API). The service SLO is 99.9% but the external API only commits to 99.5%. How do you set the SLO and error budget? Who "absorbs" the budget the dependency burns?',
      'How do you convince an engineering manager to invest 4 weeks in an alert audit + SLO setup while the team is under a feature deadline? What numbers do you use?'
    ],
  },
});
