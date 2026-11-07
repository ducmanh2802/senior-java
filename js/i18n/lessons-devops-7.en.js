/*
 * English translation of js/data/lessons-devops.js — task T703. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-010
 */
App.i18n.content({
  'lesson-devops-010': {
    title: "HPA algorithm: desired = ceil(current x metric / target), tolerance 0.1, min/max and the stabilization window",
    goals: [
      "Write the HPA formula {{ceil(currentReplicas x currentMetric / targetMetric)}} and explain why it rounds up and why the relation is proportional",
      "Explain the default tolerance of 0.1, the {{minReplicas}}/{{maxReplicas}} clamp and the 300-second downscale stabilization window (it takes the largest proposal inside the window)",
      "Understand why HPA's CPU percentage is computed from the CPU **request**, and why JVM warm-up creates a bad scale-up loop",
      "Implement {{HpaSim}} that reproduces the algorithm exactly, driven by a fake clock so the tests are deterministic",
    ],
    body: `### Three foundational concepts - read these first if you have never touched Kubernetes
- **Pod**: one running instance of your service (a Java container plus the resources capped around it). Think of it as "one checkout counter that is open".
- **Deployment**: the declaration "I want {{N}} Pods running this image". You change N, and Kubernetes works out on which nodes to place the Pods.
- **HPA (HorizontalPodAutoscaler)**: a **controller** — a program running in the control plane that forever loops "measure reality -> compute the desired N -> write it back into the Deployment".

HPA does **not** react to individual requests. Its default cycle is **15 seconds**: every 15s it measures and adjusts once, like an air conditioner that reads the temperature every few tens of seconds instead of turning the valve continuously. This matters enormously in an interview: between the moment load rises and the moment a new Pod actually receives traffic there is **an unavoidable lag** (15s to measure + 30-120s to boot + warm-up), and every sizing decision has to account for that lag.

~~~seq
title: One HPA reconcile cycle (15 seconds)
actors: HPA | metrics-server | kubelet | Deployment
HPA -> metrics-server: ask average CPU of the Pods
metrics-server -> kubelet: read usage from each cgroup
kubelet --> metrics-server: CPU usage per Pod
metrics-server --> HPA: average CPU, converted to % of request
HPA -> HPA: compute desired, apply tolerance + clamp
HPA -> Deployment: write replicas = desired
note HPA..Deployment: scale down must outlast the stabilization window
~~~

### The core formula, and why it is a division
{{desiredReplicas = ceil(currentReplicas x currentMetricValue / targetMetricValue)}}

{{currentMetricValue}} is the load intensity **averaged over a single Pod** (CPU percentage, or RPS per pod, or Kafka lag per pod). {{targetMetricValue}} is the level you want each Pod to carry. The logic: when traffic doubles, every Pod is carrying twice the target; to bring each Pod back down to the target you must double the number of Pods — hence {{desired = current x (currentMetric / target)}}. Kubernetes uses {{ceil}} (round **up**) because rounding down deliberately leaves you over target: the math says 8.2 Pods, you take 8, then each Pod carries 102% of the target, so the next cycle asks for 9 — the cluster keeps oscillating around the target forever.

A real example, {{target = 50}}% CPU with 4 Pods running:

| Average CPU | current/target | desired = ceil | Meaning |
|---|---|---|---|
| 20% | 0.4 | 2 | Load halved, ask to remove 2 Pods (but still has to wait for the window) |
| 50% | 1.0 | 4 | Exactly on target, keep as is |
| 90% | 1.8 | 8 | 7.2 -> 8, each Pod comes back to ~45% |
| 150% | 3.0 | 12 | 3x load, 12 Pods needed |

~~~java
// the stripped-down algorithm of the "horizontal controller" inside kube-controller-manager
static int desiredReplicas(int current, double metric, double target, double tolerance) {
    double ratio = metric / target;                          // 1.0 = exactly on target
    if (Math.abs(ratio - 1.0) <= tolerance) return current;  // dead band: treated as "no change"
    return (int) Math.ceil(current * ratio);                 // always round up
}
~~~

### Tolerance 0.1: the "dead band" that prevents jerky scaling
The flag {{--horizontal-pod-autoscaler-tolerance}} defaults to **0.1**. If {{|current/target - 1| <= 0.1}} — meaning the metric only wobbles within ±10% around the target — HPA considers things "fine" and **keeps the Pod count**, no matter what {{ceil}} would ask for. Without the dead band, 5 Pods at 54% CPU would round up to 6 Pods; those 6 Pods spread the load to 45%, and then it swings back the other way — the cluster jumps up and down all day long (this is called {{flapping}}), and every jump is another Pod booting and another chunk of money spent.

### minReplicas / maxReplicas: the clamp applied to both ends after computing
desired is forced into {{[minReplicas, maxReplicas]}}. This is not a formality:
- {{minReplicas}} should be **>= 2** for any service with warm-up: if you are down to 1 Pod and that Pod is restarting, the service is fully dead. If you genuinely want {{minReplicas: 0}} (service off at night), in practice use the KEDA cron scaler, because plain HPA behaves very unpredictably once there is no metric sample left.
- {{maxReplicas}} caps cost **and** caps the cascade effect: 20 Pods x 200 connections = 4000 connections, and your database pool can die long before CPU has any chance to come down. The maximum Pod count must be a number the layers beneath you (DB, Kafka, node capacity) can actually carry.
- When you declare **several metrics**, HPA takes the **largest** desired among them — safer for you, but you must be sure every one of those metrics means something.

### The stabilization window: scale up at once, scale down has to wait
The default {{--horizontal-pod-autoscaler-downscale-stabilization = 300}} seconds (in the manifest it is {{behavior.scaleDown.stabilizationWindowSeconds}}). The mechanism, stated precisely: the controller **keeps a history of its proposals**; when the current proposal is **smaller** than the number of Pods you actually have, it uses **the largest value inside the last 300s window** as the decision. To come down you must wait until every high proposal has aged out of the window. Scale up uses {{stabilizationWindowSeconds: 0}} and takes the proposal immediately.

The manifest declares both behaviours explicitly:

~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service
spec:
  scaleTargetRef:
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60        # % of requests.cpu, NOT of the limit
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "800"           # each pod carries at most 800 RPS
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0   # load rising: react immediately
    scaleDown:
      stabilizationWindowSeconds: 300 # default: wait for old proposals to expire
      policies:
      - type: Percent
        value: 50                     # every 60s remove at most 50% of the pods
        periodSeconds: 60
~~~

Why the asymmetry — this is the part interviewers like to hear:
- **The damage is not symmetric.** Scaling a few cycles late = users see slowness/5xx. Keeping a few extra Pods = a little more money spent. So being slow to remove Pods is the right trade.
- A new Java Pod costs 60-120s of warm-up; every shrink-then-stretch pays that price all over again.
- A CPU spike from a cron job or a 2-3 minute batch run is ordinary noise. 300s is roughly 20 measurement cycles, enough to tell a noise spike from a real one.
- {{scaleDown.policies}} (for example at most 50% of the Pods per 60s) prevent a "free fall": at 20 Pods, if the metric suddenly collapses and you have no policy, HPA will ask to remove 18 Pods in a single beat.

### Why CPU % is measured against the request, not the limit
{{percent = CPU usage / requests.cpu}}. Practical consequences:
- **Not setting {{requests.cpu}}** → CPU-based HPA **does not work at all** (controller log: "missing request for cpu"). Plenty of teams enable HPA and never see it scale once; the bug is exactly this line.
- {{requests.cpu = 0.5}}, {{limits.cpu = 2}}: when a Pod eats 1 core, HPA sees **200%** and scales hard even though the node still has spare CPU. So the request must be "the CPU each Pod truly needs at full load", not the small number you quote to make quota look cheap.
- If the Pod sets no limit, the JVM (from 17.0.5) sees **all the cores of the node** rather than the request — the JIT/GC thread counts and any thread-pool sizing inflate accordingly, CPU usage goes up, and HPA misreads that as heavy load.

### JVM warm-up: the thorn in every autoscaler
A Java Pod that just started shows **falsely high** CPU because:
1. Fresh code runs on the **interpreter** (not yet compiled to machine code) while the **JIT compiler** (C1 first, then C2) burns background CPU compiling the hot methods.
2. Spring Boot loads thousands of classes, proxies and auto-configurations; the Hikari connection pool opens its connections; caches are still cold, so every request has to hit the real database.
3. The result: requests in the first 1-2 minutes can be 3-10x slower, and **that boot CPU itself is added into the cluster average**.

The classic bad loop: load rises → HPA adds Pods → the new Pods boot and burn CPU → the CPU average climbs further → HPA adds even more Pods → more and more cold Pods → latency gets worse instead of better. Kubernetes dampens this by ignoring samples from just-started Pods for a while (the flags {{--horizontal-pod-autoscaler-initial-readiness-delay}} ~30s and {{--horizontal-pod-autoscaler-cpu-initialization-period}} ~5 minutes). You have to do the rest:
- a **readiness probe** that answers "ready" only after real warm-up (fire a few internal requests yourself inside {{ApplicationReadyEvent}} before you open up {{/readiness}}); a **startupProbe** for apps that boot in 60-90s so liveness does not kill them prematurely; {{minReadySeconds}} so a Pod that is "Ready and then crashes immediately" gets pushed out.
- For I/O-bound apps (waiting on the DB, waiting on HTTP), **do not scale on CPU**: use RPS or Kafka lag as a custom metric — when latency rises but CPU stays low, a CPU-based HPA just stands there watching.
- Pre-scale on a schedule (KEDA cron scaler) for peak hours you already know about; do not wait until the queue is long before calling in more staff.
- Leave headroom in the target: {{averageUtilization: 90}} is self-harm, because within the next 15s cycle load can exceed that again before any new Pod is Ready. In practice use 50-70%.

### Production traps you will actually meet
- **Scaling on JVM memory**: a heap that has been allocated is almost never returned to the OS, so the metric only ever goes up → it scales up and then stays there forever. Use CPU/RPS/lag.
- **HPA and Cluster Autoscaler fighting each other**: HPA creates new Pods but the cluster has no node left → the Pods sit in Pending. Requests must be sized correctly for the chain HPA → Cluster Autoscaler → new node to actually run.
- **Scaling down kills long-running jobs**: a Pod in the middle of a 5-minute batch gets removed; you need a {{terminationGracePeriodSeconds}} long enough + graceful shutdown, and a PodDisruptionBudget for node drains.
- **DB/Kafka cannot keep up**: Pods triple, each Pod opens 200 connections → the pool collapses and everything gets slower. Autoscaling only clears the bottleneck when the layers below also stretch.
- **No PDB while minReplicas is small**: one node drain removes your entire capacity.

### Interview notes
The question: "How do you configure autoscaling for a Java service?" — answer with a frame: (1) which metric I picked and **why** (my app is I/O-bound, so RPS/lag rather than CPU), (2) the target leaves headroom because of the 15s cycle + 90s boot, (3) what constrains min/max (DB pool, cost), (4) tolerance and the stabilization window so the fleet does not flap, (5) JVM warm-up: readiness after warm-up, startupProbe, the flags that mask samples from new Pods, (6) how you detect "it scaled but the bottleneck is still there" (Pending Pods, p95 still high even though replicas went up). The exercise below is that very algorithm, written as {{HpaSim}} and tested with a fake clock.

> Senior tip: Give real numbers when you answer: "target 60% CPU, request 1 core, min 3, max 20, stabilization 300s because the service boots in 70s and the DB pool is capped at 2000 connections". Interviewers grade you on knowing **where the limit sits**, not on knowing that HPA exists.`,
    exercises: [
      {
        title: "HpaSim: observe(currentReplicas, metric) following the exact HPA rules (tolerance, clamp, stabilization window)",
        prompt: `Implement {{HpaSim}} simulating one decision cycle of HPA. The clock is passed in as a {{java.time.Clock}} so tests can control time (never use the real clock).

Available constants: {{TOLERANCE = 0.1}}, {{DEFAULT_DOWN_WINDOW_SECONDS = 300}}.

- {{HpaSim(min, max, target, clock)}}: delegate to the 5-argument constructor with {{downWindowSeconds = DEFAULT_DOWN_WINDOW_SECONDS}}.
- {{HpaSim(min, max, target, clock, downWindowSeconds)}}: throw {{IllegalArgumentException}} when {{min < 1}}, {{max < min}}, {{target <= 0}}, {{clock == null}} or {{downWindowSeconds < 0}}; store the parameters.
- {{observe(currentReplicas, currentMetric)}}: throw {{IllegalArgumentException}} if {{currentReplicas < 0}} or {{currentMetric < 0}}. Then:
  1. {{ratio = currentMetric / target}}. If {{|ratio - 1| <= TOLERANCE}} then {{raw = currentReplicas}} (the dead band), otherwise {{raw = ceil(currentReplicas x ratio)}}.
  2. Clamp {{raw}} into {{[min, max]}}.
  3. Append {{(clock.millis(), raw)}} to the proposal history, then drop the records where {{clock.millis() - timestamp > downWindowSeconds x 1000}}.
  4. If {{raw >= currentReplicas}} (scale up or hold) return {{raw}} immediately.
  5. If {{raw < currentReplicas}} (asking to scale down) return the **largest value** still left in the history — that is, you are being held back by the stabilization window.

Keep in mind: the history always contains the {{raw}} you just wrote, so on the first scale down of a cluster that has never inflated, the result is still {{raw}}.`,
        hints: [
          "Tolerance step: evaluate {{Math.abs(ratio - 1.0) <= TOLERANCE}} before you apply {{Math.ceil}}; if you are inside the dead band then desired = currentReplicas.",
          "History holds pairs {{(timestampMillis, recommendation)}}; the {{clock.millis()}} call gives you the simulated time, do not use {{System.currentTimeMillis()}}.",
          "Apply \"take the largest value in the window\" only when {{raw < currentReplicas}}; on scale up return {{raw}} immediately.",
          "Drop old records: {{while (!history.isEmpty() && now - history.peekFirst()[0] > windowMillis) history.removeFirst();}}",
        ],
        explain: `This is verbatim what the controller does, minus the metrics-server calls. Three layers of processing stack on top of each other: (1) {{ceil}} makes sure you never deliberately stay above target; (2) tolerance turns ±10% into noise that is forgiven, which stops flapping; (3) the stabilization window makes scale down **slower** than scale up, by taking the largest proposal still alive in the window — so a 30s load peak is not enough to let you remove a Pod, and a cluster that just inflated has to "cool down" for the full 300s before it may shrink.

Mistakes learners usually make:
- Forgetting to clamp {{min}}/{{max}} **before** writing to history, so a late-clamped value wins inside {{max(history)}} and pins the cluster at a number outside the allowed range.
- Applying "max in the window" to scale up as well → the cluster never inflates fast enough when load spikes.
- Using {{System.currentTimeMillis()}} inside the method: the test passes at 2am and fails at 2pm, because a 300s window depends on real time. The fake clock is exactly why {{Clock}} is passed in.
- Forgetting that history also contains the record you just wrote, so the first scale down of a cluster that has never inflated still returns exactly {{raw}}.

Interview answer: state the formula, then immediately give the three practical consequences — the CPU request must exist (% is computed against the request), tolerance/window explain why HPA is "slow" by design, and cold Java Pods corrupt the metric so you need a warm-up gate.`,
      },
    ],
    check: [
      {
        q: "What is the HPA desiredReplicas formula?",
        options: [
          "ceil(current x currentMetric / targetMetric)",
          "floor(currentMetric / targetMetric)",
          "current + (currentMetric - target)",
          "maxReplicas when metric > target",
        ],
        explain: "Load is inversely proportional to the Pod count: desired = current x (currentMetric / target), rounded up with ceil so you never end up deliberately above target.",
      },
      {
        q: "How is the CPU percentage that HPA compares against the target computed?",
        options: [
          "usage divided by the CPU limit",
          "usage divided by the CPU request",
          "usage divided by the node core count",
          "usage divided by the CPU of the oldest pod",
        ],
        explain: "Kubernetes uses requests.cpu as the denominator. Without a request set, CPU-based HPA does not work.",
      },
      {
        q: "The 300s stabilization window (default) applies to which direction?",
        options: [
          "Both scale up and scale down",
          "Scale up only",
          "Scale down only: it takes the largest proposal inside the window",
          "Only when the metric is custom",
        ],
        explain: "Scale down has to wait until every high proposal has aged out of the 300s window; scale up uses the proposal right away so the service does not collapse.",
      },
      {
        q: "Why does a newly started Java Pod make CPU-based HPA prone to over-scaling?",
        options: [
          "Because metrics-server double-counts new pods",
          "Because JIT/Spring boot burns CPU, so average CPU is falsely high before the pod takes any load",
          "Because HPA does not know new pods exist",
          "Because the CPU limit is ignored for new pods",
        ],
        explain: "The interpreter + JIT compiler and Spring startup consume a lot of CPU in the first 1-2 minutes, which pushes the average up and triggers more Pods — the bad loop.",
      },
    ],
  },
});
