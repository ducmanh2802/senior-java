/*
 * English translation of js/data/q-devops.js — task T977. Format: js/core/i18n.js (content overlay).
 * ids: devops-104 devops-105 devops-106 devops-107 devops-108 devops-109 devops-110 devops-111
 */
App.i18n.content({

  'devops-104': {
    q: 'How do Prometheus, node_exporter, Micrometer (Spring Boot Actuator) and Grafana monitor a Java app?',
    a: `**Summary:** Prometheus **pulls (scrapes)** metrics on a schedule from endpoints: **node_exporter** for the host (CPU, RAM, disk, network) and **Spring Boot Actuator + Micrometer** for the application ({{/actuator/prometheus}}: JVM, HTTP, Hikari, business metrics). Grafana queries Prometheus with PromQL to draw dashboards and alerts. Three things decide quality: **histograms for p95/p99**, **consistent tags** (application, env), and **cardinality control**.

### Data flow
~~~seq
title: Metric from Java app to dashboard
actors: Prometheus | App | NodeExp | Grafana
Prometheus -> App: GET /actuator/prometheus (every 15s)
App --> Prometheus: jvm_*, http_server_requests_*, hikaricp_*
Prometheus -> NodeExp: GET :9100/metrics
NodeExp --> Prometheus: node_cpu_*, node_memory_*
Grafana -> Prometheus: PromQL query
Prometheus --> Grafana: time series
~~~
The model is **pull**: Prometheus knows which targets are up or down ({{up == 0}}); on Kubernetes targets are discovered automatically via service discovery or ServiceMonitor (Prometheus Operator).

### Spring Boot 3 configuration
~~~yaml
# needs dependency io.micrometer:micrometer-registry-prometheus
management:
  endpoints.web.exposure.include: health,info,prometheus
  metrics:
    tags:
      application: order-service   # common tag for all metrics
    distribution:
      percentiles-histogram:
        http.server.requests: true   # export buckets so Prometheus can compute p95/p99
~~~
Without the histogram you only have count/sum/max — you can compute averages but **cannot** compute p99 across multiple pods.

### Custom business metrics
~~~java
@Component
class OrderMetrics {
  private final Counter placed;
  OrderMetrics(MeterRegistry r) {
    // tag with a small, fixed set of values: channel = web|app|pos
    placed = Counter.builder("orders.placed").tag("channel", "web").register(r);
  }
  void onPlaced() { placed.increment(); }   // exported as: orders_placed_total
}
~~~

### PromQL you need to know
~~~text
p99 per service:
histogram_quantile(0.99, sum by (le, application) (rate(http_server_requests_seconds_bucket[5m])))
Heap in use / max:
sum(jvm_memory_used_bytes{area="heap"}) / sum(jvm_memory_max_bytes{area="heap"})
Pool running out:
hikaricp_connections_pending > 0
~~~

### Minimal dashboard per service
| Group | Metric |
|---|---|
| Traffic & errors | rps, 5xx ratio, p50/p95/p99 per URI |
| JVM | heap after GC, {{jvm_gc_pause_seconds}}, thread count |
| Pool | Hikari active/idle/pending, connection wait time |
| Host / Pod | CPU, CPU throttling, memory vs limit |

### Real-world example
A team had Prometheus but only looked at CPU/RAM. A p99 spike four times higher lasted two hours because no one could see the cause. Then they enabled the histogram for {{http.server.requests}}, added a Hikari pending panel and GC pause panels. The next time, the Hikari pending > 0 panel showed the pool was exhausted within the first 5 minutes. Another time, Prometheus consumed 14 GB of RAM because someone added a {{userId}} tag to a metric: 2 million new time series; removing that tag brought memory back to 3 GB.

### Pitfalls
- Tags with unlimited values (userId, orderId, URLs with IDs) → **cardinality explosion**. Micrometer uses URI templates (like /orders/{id}) so it is safe, unless you build tags from real paths yourself.
- Exposing {{/actuator}} to the Internet — only open it on an internal management port.
- Averaging p99 across pods — mathematically wrong; compute it from histograms instead.
- Scrape interval too short with thousands of targets → Prometheus overloads.

### Sample interview answer
"Prometheus pulls metrics on a schedule from endpoints. node_exporter provides host metrics, and the Spring Boot application adds micrometer-registry-prometheus and exposes the actuator/prometheus endpoint, exporting JVM, HTTP and Hikari metrics out of the box. Grafana queries Prometheus with PromQL to draw dashboards and alerts. I always do three things. One: enable percentiles-histogram for http.server.requests, because without buckets you cannot compute p99 across multiple pods. Two: use consistent tags like application and env to filter. Three: control cardinality — never put userId or orderId in a tag. My minimal dashboard per service has rps, error rate, p99 per URI, heap after GC, GC pause, Hikari pending and CPU throttling. I once saw Prometheus consume 14 GB of RAM just because one userId tag created two million time series."

> Senior tip: add a "Hikari pending" panel and a "CPU throttling" panel to every service dashboard from day one. These two panels explain more latency incidents than all CPU/RAM charts combined.`,
    follow: ['Pull vs push metrics?', 'What is cardinality?', 'Prometheus retention period?'],
  },
  'devops-105': {
    q: 'How does Alertmanager send alerts to Telegram/Slack, avoid alert fatigue, and do SLO-based alerting?',
    a: `**Summary:** Alertmanager receives alerts from Prometheus, then **groups**, **deduplicates**, **inhibits** and **routes** them to Slack, Telegram or PagerDuty. To fight alert fatigue: **only page a person when users are being or will be affected and action is needed right now**; everything else becomes a ticket or a dashboard item. Alert on SLO (error rate, latency felt by users) instead of raw thresholds like "CPU > 80%".

### What Alertmanager does with an alert
1. **Group**: 30 pods failing at once → one message "OrderService: 30 instances", grouped by {{group_by: [alertname, service]}}.
2. **Wait and repeat**: {{group_wait}} (wait to group), {{group_interval}} (send updates), {{repeat_interval}} (remind if not handled).
3. **Inhibit**: when the alert "cluster lost DB connection" is firing, suppress the resulting "API error" alerts.
4. **Silence**: time-limited mute during maintenance, with creator and reason.
5. **Route** by label: {{severity=page}} → PagerDuty/phone; {{severity=ticket}} → the team's Slack channel.

~~~yaml
route:
  receiver: slack-team
  group_by: [alertname, service]
  group_wait: 30s
  repeat_interval: 4h
  routes:
    - matchers: [ severity="page" ]
      receiver: pagerduty-oncall
inhibit_rules:
  - source_matchers: [ alertname="DatabaseDown" ]
    target_matchers: [ severity="page" ]
    equal: [ cluster ]
~~~

### Why alert fatigue is dangerous
When 90% of alerts are noise, on-call engineers learn to ignore everything — and ignore the real alert too. Common noise sources: static thresholds on causes (CPU 80% but users are fine), no {{for:}} so alerts flap, alerts with no owner, alerts with no runbook.

### Rules for a good alert
- **Symptoms, not causes**: "checkout error rate > 2%" instead of "high CPU". Causes belong on the dashboard.
- Have {{for: 5m}} or longer to ride out short blips.
- Every alert has a **runbook link**, an owner and a severity.
- An alert must be **actionable**: if the answer is "wait and see", it is not an alert that should page someone.
- Thresholds come from the SLO; with SLOs, use **burn rate** (error budget consumption speed) instead of fixed thresholds (see devops-110).

### Telegram/Slack in practice
- Slack: receiver {{slack_configs}} with a webhook; Telegram: receiver {{telegram_configs}} (available since Alertmanager 0.24) with a bot token and chat id.
- Keep "page" and "ticket" channels separate; the page channel is only for things that need action now.

### Real-world example
The on-call team got about 140 alerts a week, only 9 needed action; a real incident was delayed 40 minutes because it was buried in noise. Review: deleted 31 static CPU/RAM/disk threshold rules (moved them to dashboards), added {{for:}} to every rule, grouped by service, inhibited by cluster, and replaced them with 6 SLO alerts for the three main journeys (login, search, payment). Result: down to about 12 alerts per week, 10 of them actionable; average response time dropped from 25 minutes to 6 minutes.

### Pitfalls
- Sending every alert to one shared channel → no one reads it.
- Silence without an expiry, then forgotten → real alerts missed for weeks.
- Alerts based on metrics that can disappear (a dead pod emits no metric) without an {{absent()}} or {{up == 0}} alert.
- Not reviewing alerts regularly.

### Sample interview answer
"Alertmanager receives alerts from Prometheus, then groups, deduplicates, inhibits and routes them. Grouping by service turns thirty failing pods into one message; inhibit means when the DB dies we do not fire dozens more API alerts; silence is time-limited for maintenance; routing is by severity: page calls the on-call person, ticket goes to the team Slack channel. To fight alert fatigue, I follow the rule: only page someone when users are being or will be affected and need action right now. So I alert on symptoms like error rate or latency of key journeys, based on SLO and burn rate, and leave CPU and RAM for dashboards. Every alert has a for clause to skip short blips, a runbook and an owner. At my previous team this review cut alerts from about 140 to 12 per week, and response time dropped from 25 minutes to 6 minutes."

> Senior tip: every month, list the alerts that fired with a column "was any action taken". Any alert that led to no action for three months straight should be deleted or demoted to a ticket — that is the cheapest way to keep on-call trustworthy.`,
    follow: ['PagerDuty escalation?', 'Silence vs inhibit?', 'What is burn rate?'],
  },
  'devops-106': {
    q: 'Centralized logging: ELK/EFK vs Loki, JSON logs, correlation id, retention and cost?',
    a: `**Summary:** Centralized logging needs three things: **structured (JSON) logs** so you can query by field, **correlation/trace id** to connect every log line of one request across services, and a **storage strategy by value** (hot logs short, cold logs cheap, debug logs little). **ELK/EFK** indexes full text — powerful search but heavy; **Loki** indexes only labels and compresses content on object storage — much cheaper but text search is slower.

### JSON logs in Spring Boot 3
From Spring Boot 3.4, structured logging is built in:
~~~yaml
logging:
  structured:
    format:
      console: ecs   # or logstash, gelf; each line is one JSON
~~~
Older versions use logstash-logback-encoder. The result is fields {{level}}, {{logger}}, {{message}}, {{traceId}}, {{spanId}}, {{service}} queryable directly, no regex needed.

### Correlation id / trace id
- With Micrometer Tracing (Spring Boot 3), {{traceId}} and {{spanId}} are automatically put into MDC and passed via the W3C {{traceparent}} header when calling with instrumented RestClient/WebClient/Kafka.
- {{traceId}}: the id of the whole journey across services; {{spanId}}: the id of one step in that journey.
- Return {{traceId}} in the response header or error message so support can pass it back to developers.
- Careful with thread pools/{{@Async}}: the context does not follow automatically unless the executor is wrapped (context propagation).

### ELK/EFK or Loki
| Criterion | ELK / EFK (Elasticsearch) | Loki |
|---|---|---|
| Index | Full text of every field | Labels only (service, env, level) |
| Query | Free-text search very fast, strong aggregation | Filter by label then scan content |
| Cost | High: RAM, SSD, replicas | Low: compressed, stored on S3/GCS |
| Operations | Complex (shards, mapping, heap) | Simpler |
| Good for | Deep log analysis, security/SIEM | Debug per service, used with Grafana |
EFK = replaces Logstash with Fluentd/Fluent Bit (lighter, common on Kubernetes).

### Retention and cost
- Tiered: 7–14 days hot (fast queries), 30–90 days warm/cold, long-term on S3 if legal requirements exist.
- Reduce volume at the source: turn off DEBUG in production, merge duplicate logs, **sampling** successful logs (keep 100% of errors, 5–10% of successful requests).
- Index Lifecycle Management (Elasticsearch) or retention per tenant/stream (Loki).
- Do not log request bodies and personal data — costs money and creates legal risk.

### Real-world example
A company with 40 microservices wrote 1.2 TB of logs per day to Elasticsearch: an 18-node cluster, about 22,000 USD per month; 60% of the volume was INFO "request succeeded" logs and request bodies. They moved application logs to Loki + S3, kept a small Elasticsearch for security/audit logs, dropped request bodies, and sampled 10% of successful logs. Volume dropped to 380 GB per day, logging cost fell about 70%. With {{traceId}} in every log line, time to find the root cause of an error across 5 services dropped from about 40 minutes to 5 minutes.

### Pitfalls
- Free-form text logs → you have to write regex to parse, and it breaks when the format changes.
- Putting highly variable values (userId, traceId) as **labels** in Loki → stream explosion, Loki gets slow and expensive.
- Dynamic mapping in Elasticsearch: a field sometimes a number, sometimes a string → logs get dropped.
- Losing traceId when switching threads or via Kafka without instrumentation.

### Sample interview answer
"Centralized logging, for me, has three pillars. First, structured JSON logs — Spring Boot 3.4 has structured logging built in — so you query by field instead of regex. Second, trace id: Micrometer Tracing puts traceId and spanId into MDC and passes them via the traceparent header, so a request across five services stays connected, and I even return traceId in error responses so support can send it back. Third, cost: tiered retention, turn off DEBUG, sample successful logs, and never log request bodies. About tools: Elasticsearch indexes full text, so search and analysis are strong but RAM and SSD are expensive; Loki only indexes labels and stores compressed content on object storage, so it is much cheaper, good for per-service debugging together with Grafana. At my previous company, moving application logs to Loki, dropping request bodies and sampling cut logging cost by about 70%."

> Senior tip: calculate logging cost **per service** per month and send it to each team. When a team sees their service takes 35% of the logging bill because of request bodies, they fix it faster than any shared rule.`,
    follow: ['TraceId vs SpanId?', 'Log sampling?', 'Elasticsearch cost?'],
  },
  'devops-107': {
    q: 'High availability: Keepalived + VIP (VRRP), HAProxy/Nginx active-passive, DB replication + failover, split-brain?',
    a: `**Summary:** Traditional HA on VMs/bare metal has two layers: the **entry layer** uses Keepalived (VRRP protocol) to keep one **VIP** (virtual IP) on one of two HAProxy/Nginx machines, the other as standby; the **data layer** uses replication plus a failover coordinator (Patroni for PostgreSQL, Orchestrator / MySQL InnoDB Cluster for MySQL). The biggest risk is **split-brain** — both sides thinking they are primary — so every failover decision must be based on **quorum** and **fencing**.

### How Keepalived + VIP works
- Two machines run Keepalived, each with a priority (e.g. 150 and 100). The MASTER sends VRRP advertisements every second; the VIP is attached to its network interface.
- A check script ({{vrrp_script}}, e.g. {{pidof haproxy}} or calling a health endpoint) lowers priority when HAProxy dies.
- The BACKUP does not hear the advertisement for about 3 cycles → takes over the VIP and sends gratuitous ARP so the switch updates. Switchover usually takes 1–3 seconds.
~~~text
vrrp_instance VI_1 {
  state BACKUP            # both set BACKUP + nopreempt to avoid flapping back and forth
  interface eth0
  virtual_router_id 51
  priority 150
  nopreempt
  virtual_ipaddress { 10.0.0.100/24 }
  track_script { chk_haproxy }
}
~~~
On the cloud, VRRP is usually not usable (the network does not allow gratuitous ARP at will); use the cloud's load balancer (AWS NLB/ALB) or move an Elastic IP via API instead.

### HAProxy/Nginx active-passive
Only the machine holding the VIP receives traffic; both machines must have identical configuration (synced via Ansible/Git). HAProxy checks backend health ({{option httpchk}}) and removes failed servers. Active-active (two VIPs + DNS) increases capacity but is more complex.

### DB replication + failover
- PostgreSQL streaming replication: the primary sends WAL to standbys. **Async**: fast but can lose a few seconds of data on failover; **sync** ({{synchronous_standby_names}}): no committed data lost, at the cost of write latency.
- **Patroni**: each node runs an agent; a DCS (etcd/Consul) holds a **leader lock** with TTL. Only the node holding the lock is primary; if the primary loses the lock it steps down. Applications connect via HAProxy asking Patroni's REST API ({{/primary}}) which node is primary.

### Split-brain and how to prevent it
The network between the two machines breaks but both are still alive → both take the VIP or both accept writes → data diverges, very hard to merge.
- **Quorum**: decisions need a majority (3 or 5 etcd nodes); the minority cannot become primary.
- **Fencing / STONITH**: make sure the old node is dead or isolated (power off via IPMI, revoke storage write rights) before the new node takes over.
- Watchdog: Patroni can use a hardware/softdog watchdog to reboot a node that lost the lock.

### Real-world example
A bank ran PostgreSQL on two nodes with a custom failover script based on ping. Once the switch failed so the two nodes could not see each other for 40 seconds: the script promoted the standby to primary while the old primary was still accepting writes from some applications → 1,700 transactions diverged across the two nodes, taking two days of manual reconciliation. Redesign: 3 PostgreSQL nodes + Patroni + 3 etcd nodes in three availability zones, one synchronous standby, HAProxy routing via {{/primary}}. Quarterly drills: average failover 12 seconds, no committed transaction lost, no more split-brain.

### Pitfalls
- Two nodes with "ping" to decide failover — without quorum you cannot tell "the other side died" from "the network is cut".
- Enabling preempt so the master grabs the VIP back as soon as it is up → flapping back and forth.
- Never practicing failover → on the real day you discover the configuration is wrong.
- Applications cache the DB address/DNS for a long time → after failover they still write to the old node.

### Sample interview answer
"I split it into two layers. The entry layer uses Keepalived with VRRP to keep one virtual IP on one of two HAProxy machines; if the primary machine or HAProxy dies, the check script lowers priority, the standby takes the VIP and sends gratuitous ARP, usually within one to three seconds. The data layer uses replication; for PostgreSQL, streaming replication plus Patroni to coordinate: nodes contend for a leader lock in etcd, only the lock holder is primary, and HAProxy asks Patroni which node is primary. What I focus on most is split-brain. Two nodes deciding by ping is not safe, because you cannot distinguish 'the other side died' from 'the network is cut'. You need quorum — at least three etcd nodes — and fencing to make sure the old node is no longer accepting writes. I also choose async or sync replication explicitly based on how much data loss is acceptable, and run failover drills regularly."

> Senior tip: measure and record two numbers after every drill: actual failover time and actual data loss (RPO in practice). An RTO/RPO commitment on paper that has never been measured is just hope.`,
    follow: ['What is Patroni?', 'Quorum majority?', 'What is STONITH?'],
  },
  'devops-108': {
    q: 'Database monitoring (PostgreSQL/MySQL exporter): slow queries, connections, replication lag?',
    a: `**Summary:** Database monitoring must answer four questions: **is the DB overloaded** (connections, CPU, I/O), **which queries are most expensive** (pg_stat_statements / performance_schema), **who is blocking whom** (locks, long transactions), and **are replicas keeping up** (replication lag). Use **postgres_exporter** or **mysqld_exporter** for Prometheus, plus slow query logs and a dashboard with alerts per group.

### Exporters and data sources
- **postgres_exporter** reads system views: {{pg_stat_database}} (commits, rollbacks, deadlocks, temp files), {{pg_stat_activity}} (connections by state), {{pg_stat_replication}}, {{pg_locks}}; custom queries can be added.
- **mysqld_exporter** reads {{SHOW GLOBAL STATUS}}, {{performance_schema}}, replication status.
- The exporter account only needs read rights to statistics (PostgreSQL: role {{pg_monitor}}).

### Slow queries
- PostgreSQL: enable the {{pg_stat_statements}} extension for aggregated statistics per query shape (number of calls, total/average time, rows, blocks read). Sort by **total time**, not single execution time: a 5 ms query called two million times an hour costs more than a 3-second query run ten times.
- {{log_min_duration_statement = 500}} logs queries slower than 500 ms; {{auto_explain}} logs the plan of slow queries too.
- MySQL: {{slow_query_log}} + {{long_query_time}}, analyzed with pt-query-digest.
~~~sql
SELECT left(query, 80) AS q, calls, round(total_exec_time) AS total_ms,
       round(mean_exec_time, 1) AS mean_ms, rows
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
~~~

### Connections
- Monitor connections by state: {{active}}, {{idle}}, **{{idle in transaction}}** (holds locks and blocks vacuum — very dangerous).
- Compared with {{max_connections}}: each PostgreSQL connection is a process; a few hundred connections already use significant RAM. The total pool of all pods must stay below the limit; with many pods use PgBouncer.
- Set {{idle_in_transaction_session_timeout}} to automatically cut forgotten sessions.

### Replication lag
- PostgreSQL: on the primary, view {{pg_stat_replication}} ({{replay_lag}}, LSN difference); on the replica, {{now() - pg_last_xact_replay_timestamp()}} (note this grows even when the primary is not writing, so it is not truly lag).
- Causes of lag: large batch writes, replica lacking I/O, long queries on the replica conflicting with replay.
- Applications reading from replicas must tolerate data that is seconds old, or read from the primary right after a write (read-your-writes).

### Alerts to have
| Alert | Suggested threshold |
|---|---|
| Connections nearly full | > 80% max_connections for 5 minutes |
| Long transaction | > 5 minutes (blocks vacuum, holds locks) |
| Replication lag | > 30 seconds for 5 minutes |
| Deadlock | unusual increase vs baseline |
| Disk/WAL | free space < 20% |

### Real-world example
A PostgreSQL DB of an e-commerce site hit 90% CPU every noon; the team planned to upgrade the instance (+1,800 USD per month). pg_stat_statements showed a cart-counting query of just 4 ms called six million times per hour, taking 38% of total DB time. Caching the result for 30 seconds in Redis cut noon CPU to 45% — no upgrade needed. In the same round, the "idle in transaction > 5 minutes" alert caught a report job that forgot to commit, which had bloated the orders table by 40% because vacuum could not clean it up.

### Pitfalls
- Only enabling slow query log → missing fast-but-extremely-frequent queries.
- Not resetting/comparing pg_stat_statements over time → you do not know which query just got worse.
- Exporter using a superuser account.
- Reading from a replica without monitoring lag → users see stale data and think data is lost.

### Sample interview answer
"I monitor the database along four questions. Is the DB overloaded: connections by state, CPU, I/O. Which queries are most expensive: I use pg_stat_statements and sort by total time, not single execution time, because a 4 ms query called millions of times usually costs more than a 3-second query run rarely; plus slow query log and auto_explain for slow queries. Who is blocking whom: locks and long transactions, especially idle in transaction because it holds locks and blocks vacuum. Are replicas keeping up: replay lag from pg_stat_replication. Data goes to Prometheus via postgres_exporter with the pg_monitor role, and the dashboard has alerts for connections above 80%, transactions above 5 minutes, lag above 30 seconds. Once, thanks to pg_stat_statements, a team dropped a plan to upgrade the DB for 1,800 USD per month just by caching a counter query called six million times per hour."

> Senior tip: snapshot the top 20 of pg_stat_statements every week and keep it. Comparing this week with last week is the fastest way to spot that a release just made a query worse, before it becomes an incident.`,
    follow: ['What is pg_stat_statements?', 'Connection pool tuning?', 'What is Vacuum?'],
  },
  'devops-109': {
    q: 'How do you build uptime/synthetic checks and an internal status page?',
    a: `**Summary:** A synthetic check is a **robot acting as a user**, calling key journeys from outside on a schedule (login, search, test payment) to detect incidents **before users report them**, even at night when there is no traffic. An internal status page aggregates the status of each service and ongoing incidents, so teams and support do not have to ask each other "is the system broken?".

### Why synthetic checks when you already have metrics
- Server-side metrics only see requests that **arrived**. Wrong DNS, expired TLS certificate, CDN failure, firewall blocking → the server sees nothing, metrics stay green.
- Low traffic at night: an error rate over 3 requests means nothing; the robot gives a steady signal.
- Measure from the user's perspective: many regions, many carriers.

### Synthetic check levels
| Level | Checks | Tool |
|---|---|---|
| Ping/HTTP | Endpoint returns 200, response time, certificate expiry | Prometheus blackbox_exporter, Uptime Kuma |
| API journey | Chained calls: login → get token → search product → create cart | k6 script scheduled, Checkly |
| Browser | Real UI script with Playwright | Checkly, Datadog Synthetics, CloudWatch Synthetics |

~~~yaml
# blackbox_exporter module: check HTTP and returned content
modules:
  http_api:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_body_not_matches_regexp: ['"status":"UP"']
# Certificate expiry alert: probe_ssl_earliest_cert_expiry - time() < 14 * 86400
~~~

### Design principles
- Use a **dedicated test account**, data marked and cleaned up; test payments use a sandbox or an amount refunded immediately.
- Run from at least 2–3 locations; only alert when **multiple locations** fail together, to avoid noise from one network problem.
- Check **content**, not just status 200 (an error page can still return 200).
- Kubernetes liveness/readiness checks are **inside** checks; synthetic is an **outside** check — you need both.

### Internal status page
- List services by business journey (Login, Payment, Reports…), status green/yellow/red taken automatically from synthetic checks and SLO.
- Open incidents: what is affected, who is handling it, latest update, contact channel.
- Upcoming maintenance windows; incident history and 90-day uptime.
- Tools: Statuspage, Upptime, Uptime Kuma, or a custom page reading from Prometheus. A public status page for customers is only updated by a person (to avoid showing noise).

### Real-world example
A B2B platform was reported by customers "cannot log in" at 7 AM — the SSO domain's TLS certificate had expired at midnight, but server metrics were green because no requests could get through. After the incident: 14 synthetic checks (8 API journeys, 6 UI pages with Playwright) run every minute from 3 regions, certificate alerts 14 days in advance, internal status page for customer support. Over the next 6 months, 5 of 7 incidents were detected by synthetic checks before any customer reported; average detection time dropped from 38 minutes to 3 minutes; the number of "is the system broken?" questions to the engineering channel dropped noticeably.

### Pitfalls
- The robot uses a real account or creates real orders without cleaning up → corrupts business metrics.
- Brittle UI scripts (selectors change) → constant false alarms.
- Only checking the home page.
- The status page is updated manually and forgotten during an incident.

### Sample interview answer
"A synthetic check is a robot acting as a user, calling key journeys from outside on a schedule. It complements server-side metrics, because errors like wrong DNS, expired certificates or a broken CDN mean the server sees no requests and metrics stay green, and at night low traffic makes error rates meaningless. I do three levels: blackbox_exporter for HTTP and certificate expiry, a scripted API chain from login to test payment, and a few Playwright scripts for important pages. Robots use dedicated test accounts, check content not just status 200, run from multiple regions, and only alert when several regions fail together. The internal status page takes status automatically from synthetic checks and SLO, with open incidents and owners. At my previous company, after doing this, most incidents were detected before customers reported, and detection time dropped from about 38 minutes to 3 minutes."

> Senior tip: write a synthetic check for **every incident that happened** but your current monitoring did not catch. After a year, that set reflects exactly how your system really breaks.`,
    follow: ['Liveness vs readiness?', 'Blackbox exporter?', 'SLI/SLO/SLA?'],
  },
  'devops-110': {
    q: 'SLO, SLI, error budget and how to set alerts based on error budget burn rate?',
    a: `**Summary:** **SLI** is a metric that measures user experience (successful request rate and fast enough), **SLO** is the target for the SLI over a time window (99.9% over 30 days), **error budget** is the allowed failure (0.1% ≈ 43 minutes per 30 days). Alerting based on **burn rate** — the error budget consumption speed versus the "steady" speed — uses **multiple windows** to catch both big incidents and slow burns, with few false alarms. An **error budget policy** turns the number into a decision: no budget left means stability takes priority over features.

### Definitions by example
- **SLI** = good requests / total requests. "Good" = not 5xx and faster than 300 ms, measured at the load balancer or gateway (close to the user).
- **SLO** = 99.9% good requests in a 30-day rolling window.
- **Error budget** = 0.1% × number of requests. With 100 million requests per month → 100,000 bad requests allowed.
- **SLA** is a contractual commitment (with compensation), usually looser than internal SLO (e.g. SLA 99.5%).

### What burn rate is
Burn rate = current error rate / allowed error rate.
~~~text
SLO 99.9% -> allowed error rate 0.1%
Current error rate is 1.44% -> burn rate = 14.4
=> at this speed the 30-day budget is gone after 30 / 14.4 ≈ 2 days
and in 1 hour it has consumed 1 h × 14.4 / 720 h = 2% of the monthly budget
~~~
A static threshold "errors > 1%" does not know what the SLO is; burn rate ties the alert directly to the actual severity.

### Multi-window alerting (per Google SRE Workbook)
| Level | Burn rate | Long / short window | Meaning | Action |
|---|---|---|---|---|
| Page | 14.4 | 1 hour / 5 minutes | Consumes 2% of budget in 1 hour | Call on-call |
| Page | 6 | 6 hours / 30 minutes | Consumes 5% in 6 hours | Call on-call |
| Ticket | 1 | 3 days / 6 hours | Slow burn, budget gone at end of period | Handle in business hours |
The long window suppresses false alarms; the short window helps the alert **clear quickly** once errors stop.

~~~yaml
# recording rule: error ratio per window (repeat for 5m, 30m, 6h...)
- record: slo:error_ratio:rate1h
  expr: |
    sum(rate(http_server_requests_seconds_count{application="checkout",status=~"5.."}[1h]))
    / sum(rate(http_server_requests_seconds_count{application="checkout"}[1h]))
- alert: CheckoutErrorBudgetFastBurn
  expr: slo:error_ratio:rate1h > (14.4 * 0.001) and slo:error_ratio:rate5m > (14.4 * 0.001)
  labels: { severity: page }
~~~

### Error budget policy
A written agreement between product and engineering: budget left → deploy normally, accept experiments; budget exhausted → freeze risky features, put people on stability until the SLI recovers; an incident consuming more than 20% of the budget → mandatory postmortem.

### Real-world example
A payment service used to alert when "5xx > 1% in 5 minutes": about 25 times per month, most clearing up after a few minutes; meanwhile a slow 0.3% error ran for 9 days without anyone knowing, consuming almost the whole budget. Switching to SLO 99.9% with multi-window alerts: pages dropped to 2–3 per month, all real incidents; the slow error was caught by the ticket alert after about 6 hours. When March's budget ran out, the policy made the team postpone a risky feature for two weeks to fix retries and timeouts — three months later, no month exceeded the budget.

### Pitfalls
- SLO 100% or 99.99% for everything — no budget left for change, or unachievable.
- Measuring SLI too deep (a single pod) instead of close to the user.
- Computing ratios when traffic is very low: 1 error / 3 requests = 33% → false alarm; you need a minimum request threshold or synthetic checks.
- Having an SLO but no policy → the number is just decoration.

### Sample interview answer
"An SLI is a metric that measures user experience, for example the ratio of requests that are not errors and are faster than 300 ms, measured at the gateway. An SLO is the target for that metric, like 99.9% over 30 days, and the error budget is the allowed failure, about 43 minutes per month. I alert on burn rate, meaning the current error rate divided by the allowed error rate. A burn rate of 14.4 over one hour means 2% of the monthly budget has been consumed, worth paging someone. I use multiple windows: 1 hour with 5 minutes and 6 hours with 30 minutes for pages, 3 days for tickets; the long window suppresses false alarms, the short window lets the alert clear quickly. Just as important is the error budget policy: no budget left means stability beats features. At a previous payment service, this cut pages from 25 to 2–3 per month and caught slow errors that had been missed before."

> Senior tip: start with one SLO for the **single most important journey** (usually payment or login) and one policy product signs off on. One respected SLO is worth ten SLOs nobody looks at.`,
    follow: ['Error budget policy?', 'Multi-window alert?', 'SLA penalty?'],
  },
  'devops-111': {
    q: 'Distributed tracing: OpenTelemetry, Jaeger/Tempo, trace context propagation in Spring Boot?',
    a: `**Summary:** Distributed tracing records a request's journey across multiple services as a **trace** made of many **spans** (each span is one piece of work: an HTTP call, a DB query, sending Kafka). **OpenTelemetry** is the common standard for generating and sending trace data; **trace context** travels with the request via the W3C {{traceparent}} header; **Jaeger/Tempo** store and display it. In Spring Boot 3, Micrometer Tracing with the OpenTelemetry bridge instruments most of the path automatically; your job is to make sure the context is not broken and to choose **sampling** sensibly.

### Concepts, step by step
~~~seq
title: One trace across 3 services
actors: Gateway | Order | Payment | DB
Gateway -> Order: POST /orders (traceparent: 00-T-A-01)
Order -> DB: INSERT order (span B, parent is A)
Order -> Payment: POST /charge (traceparent: 00-T-C-01)
Payment -> DB: UPDATE wallet (span D, parent is C)
Payment --> Order: 200
Order --> Gateway: 201
~~~
- **traceId (T)** is the same on every span of the journey; each span has its own **spanId** and the id of its parent span → you can build a timeline tree.
- The {{traceparent}} header has the form {{00-<32-hex traceId>-<16-hex spanId>-<flags>}}; the last flag bit says whether the request is sampled or not, so every service decides consistently.
- **Baggage**: key-value pairs traveling with the context (e.g. tenantId) — useful but sent with every call, so do not put sensitive data in it.

### Spring Boot 3
~~~yaml
# dependency: io.micrometer:micrometer-tracing-bridge-otel + io.opentelemetry:opentelemetry-exporter-otlp
management:
  tracing:
    sampling:
      probability: 0.1          # head sampling 10%; default 0.1
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
~~~
- RestClient/WebClient/RestTemplate only get instrumented when **created from a Spring-provided builder bean**; {{new RestTemplate()}} loses the context.
- Kafka: enable observation on KafkaTemplate and the listener container so context passes through message headers.
- {{@Async}} and custom executors: wrap with context propagation, otherwise child spans lose their parent.
- traceId goes into MDC automatically → logs and traces connect.

### Sampling
| Type | How it works | Pros / cons |
|---|---|---|
| Head-based | Decides at the start of the request (e.g. 10%) | Cheap, simple; can miss the very request that errored |
| Tail-based | OpenTelemetry Collector holds all spans of a trace then decides: keep 100% of error or slow traces, 5% of normal traces | Keeps important traces; Collector uses RAM and needs traceId-based routing |

### Jaeger or Tempo
Jaeger: good search UI by service/tag, stores on Elasticsearch/Cassandra. Grafana Tempo: indexes only by traceId, stores on object storage so it is cheap; search with TraceQL or jump from logs (traceId) and exemplars on metric charts to traces.

### Real-world example
Order API p99 = 2.1 s, every team said their own service was fast. Tracing with tail sampling (100% of traces over 1 s). The trace showed Order calling Inventory **sequentially** per line item (average 7 lines × 180 ms), and one unnecessary call to Pricing. Merged into one batch call and dropped the extra call: p99 down to 420 ms. Thanks to tracing, the team also found that calls via {{@Async}} lost context — they fixed the executor to have a full span tree.

### Pitfalls
- One service not forwarding the header → trace cut in half, exactly the part you need to see.
- 100% sampling at high production volume → storage cost explodes.
- High-cardinality attributes or personal data on spans.
- Each service using a different sampling rate without honoring the parent's sampled flag.

### Sample interview answer
"Distributed tracing records a request's journey as a trace made of spans, each span one piece of work like an HTTP call or DB query, with a shared traceId and parent span id to build a timeline tree. Context travels between services via the W3C traceparent header, which includes the sampled flag so every service decides the same way. In Spring Boot 3 I use Micrometer Tracing with the OpenTelemetry bridge, send via OTLP to the Collector, and store in Tempo or Jaeger. The places where context usually breaks are HTTP clients created with {{new RestTemplate()}} instead of Spring's builder bean, custom @Async executors, and Kafka without observation enabled. For sampling, head-based 10% is cheap but can miss the erroring request, so on important systems I use tail-based on the Collector: keep 100% of error and slow traces, sample normal traces lightly. Most recently, a trace showed Order calling Inventory one line at a time; merging into one batch call cut p99 from 2.1 seconds to about 420 ms."

> Senior tip: put traceId in the response header and in every error message returned to the client. When a customer or QA reports an error with a traceId, root-cause time drops from tens of minutes to a few minutes.`,
    follow: ['Tail-based sampling?', 'What is Baggage?', 'Tempo vs Jaeger?'],
  },
});
