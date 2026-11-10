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
- {{minReplicas}} should be **>= 2** for services with warm-up: if only 1 Pod remains and that Pod is restarting, the service dies completely. Wanting {{minReplicas: 0}} (shut down at night) is better served by the KEDA cron scaler, because pure HPA behaves unpredictably when no metric samples remain.
- {{maxReplicas}} caps both cost **and** cascading effects: 20 Pods x 200 connections = 4000 connections, and your database pool may collapse before CPU even drops. The maximum Pod count must be a number the layers below (DB, Kafka, node capacity) can actually carry.
- When **multiple metrics** are declared, HPA takes the **largest** desired among them — safe for you, but you must be sure every metric is meaningful.

### Stabilization window: scale up immediately, scale down must wait
Default {{--horizontal-pod-autoscaler-downscale-stabilization = 300}} seconds (in the manifest: {{behavior.scaleDown.stabilizationWindowSeconds}}). The mechanism, stated precisely: the controller **records the history of proposals**; when the current proposal is **smaller** than the current Pod count, it takes the **largest value within the last 300s** as its decision. To scale down, you must wait for all high proposals to age out of the window. Scale up uses {{stabilizationWindowSeconds: 0}}, applying the proposal immediately.

The manifest declares both behaviors explicitly:

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
      stabilizationWindowSeconds: 0   # rising load: react immediately
    scaleDown:
      stabilizationWindowSeconds: 300 # default: wait for old proposals to expire
      policies:
      - type: Percent
        value: 50                     # remove at most 50% of pods every 60s
        periodSeconds: 60
~~~

Why the asymmetry — this is what interviewers love to hear:
- **The damage is not equal.** Scaling a few cycles late = users see slowness/5xx. Keeping a few extra Pods = a little extra money. Better to be slow to remove Pods.
- A fresh Java Pod needs 60-120s of warm-up; every shrink-then-grow cycle pays that cost again.
- CPU spikes from cron jobs or 2-3 minute batches are normal noise. 300s ~ 20 measurement cycles, enough to tell noise spikes apart from real ones.
- {{scaleDown.policies}} (e.g. at most 50% of Pods per 60s) prevents "falling off a cliff": at 20 Pods with a sudden metric drop, without a policy HPA would demand removing 18 Pods in one step.

### Why CPU % is computed from the request, not the limit
{{percent = CPU usage / requests.cpu}}. Practical consequences:
- **No {{requests.cpu}} set** → HPA by CPU **does not work at all** (controller log: "missing request for cpu"). Many teams open an HPA and never see it scale — the bug is exactly here.
- Set {{requests.cpu = 0.5}}, {{limits.cpu = 2}}: when a Pod eats 1 core, HPA sees **200%** and scales hard, even though the node still has free CPU. So the request must be "the CPU each Pod truly needs at full load", not a cheap quota number.
- If a Pod has no limit, the JVM (since 17.0.5) sees **the whole node's cores**, not the request — JIT/GC/thread-pool thread counts balloon, CPU usage rises, and HPA misreads it as high load.

### JVM warm-up: the thorn in every autoscaler
A freshly started Java Pod has **artificially high** CPU because:
1. New code runs on the **interpreter** (not yet compiled to machine code) and the **JIT compiler** (C1 then C2) spends background CPU compiling hot methods.
2. Spring Boot loads thousands of classes, proxies, auto-configuration; the Hikari connection pool creates connections; the cache is cold so every request hits the DB for real.
3. Result: requests in the first 1-2 minutes can be 3-10x slower, and **that boot CPU itself is folded into the cluster average**.

The classic bad loop: load rises → HPA adds Pods → new Pods boot and eat CPU → average CPU rises further → HPA adds more Pods → ever more cold Pods → latency gets worse, not better. Kubernetes reduces it by ignoring samples from newly started Pods for a period (flag {{--horizontal-pod-autoscaler-initial-readiness-delay}} ~30s and {{--horizontal-pod-autoscaler-cpu-initialization-period}} ~5 min). You must do the rest:
- **readiness probe** returns "ready" only after real warm-up (fire an internal request on {{ApplicationReadyEvent}}, then open {{/readiness}}); **startupProbe** lets the app boot 60-90s so liveness does not kill early; {{minReadySeconds}} kicks out Pods that become Ready then crash immediately.
- For I/O-bound apps (waiting on DB, waiting on HTTP), **do not scale on CPU**: use RPS or Kafka lag as a custom metric — latency climbs while CPU stays low, and CPU-based HPA just watches.
- Pre-scale on a schedule (KEDA cron scaler) for known peak hours; do not wait for a queue to form before calling for more hands.
- Set the target with headroom: {{averageUtilization: 90}} is suicidal, because within the next 15s cycle load can climb further before the new Pod is Ready. In practice 50-70%.

### Production pitfalls
- **Scaling on JVM memory**: the heap almost never returns to the OS, the metric only climbs → scale up then stuck forever. Use CPU/RPS/lag.
- **HPA vs Cluster Autoscaler fighting**: HPA spawns new Pods but the cluster is out of nodes → Pods pending. Requests must be set correctly so the chain HPA → Cluster Autoscaler → node actually runs.
- **Scale down killing long jobs**: a Pod processing a 5-minute batch gets removed; need {{terminationGracePeriodSeconds}} long enough + graceful shutdown, and PodDisruptionBudget for node drains.
- **DB/Kafka cannot keep up**: Pods grow 3x, each opens 200 connections → pool collapses, everything slows down. Autoscaling only removes the bottleneck when the layers below also scale.
- **No PDB with small minReplicas**: a single node drain wipes out capacity.

### Interview angle
Question: "How would you configure autoscaling for a Java service?" — answer with a frame: (1) which metric I pick and **why** (my app is I/O-bound so RPS/lag, not CPU), (2) target with headroom because of the 15s cycle + 90s boot, (3) min/max constrained by what (DB pool, cost), (4) tolerance and stabilization window so it does not jitter, (5) JVM warm-up: readiness after warm-up, startupProbe, flag that shields new-Pod samples, (6) how to detect "scaled but still not relieved" (Pods pending, p95 still high after replicas rose). The exercise below is the algorithm itself, written as {{HpaSim}} and tested with a fake clock.

> Senior tip: Say real numbers when you answer: "target 60% CPU, request 1 core, min 3, max 20, stabilization 300s because the service boots in 70s and the DB pool ceiling is 2000 connections". Interviewers grade on whether you know **where the limit sits**, not on whether you know HPA exists.`,
    exercises: [
      {
        title: 'HpaSim: observe(currentReplicas, metric) following the HPA rules (tolerance, clamp, stabilization window)',
        prompt: `Implement {{HpaSim}} simulating one HPA decision cycle. The clock is passed in as {{java.time.Clock}} so time can be controlled in tests (no real clock).

Available constants: {{TOLERANCE = 0.1}}, {{DEFAULT_DOWN_WINDOW_SECONDS = 300}}.

- {{HpaSim(min, max, target, clock)}}: delegates to the 5-arg constructor with {{downWindowSeconds = DEFAULT_DOWN_WINDOW_SECONDS}}.
- {{HpaSim(min, max, target, clock, downWindowSeconds)}}: throws {{IllegalArgumentException}} when {{min < 1}}, {{max < min}}, {{target <= 0}}, {{clock == null}} or {{downWindowSeconds < 0}}; stores the parameters.
- {{observe(currentReplicas, currentMetric)}}: throws {{IllegalArgumentException}} if {{currentReplicas < 0}} or {{currentMetric < 0}}. Then:
  1. {{ratio = currentMetric / target}}. If {{|ratio - 1| <= TOLERANCE}} then {{raw = currentReplicas}} (dead band), otherwise {{raw = ceil(currentReplicas x ratio)}}.
  2. Clamp {{raw}} into {{[min, max]}}.
  3. Record {{(clock.millis(), raw)}} in the proposal history, then drop entries with {{clock.millis() - timestamp > downWindowSeconds x 1000}}.
  4. If {{raw >= currentReplicas}} (scale up or hold) return {{raw}} immediately.
  5. If {{raw < currentReplicas}} (scale down requested) return the **largest value** in the remaining history — i.e. held by the stabilization window.

Note: the history always contains the just-recorded {{raw}}, so on the first scale-down of a cluster that never scaled up, the result is still {{raw}}.`,
        hints: [
'Tolerance step: use {{Math.abs(ratio - 1.0) <= TOLERANCE}} before {{Math.ceil}}; inside the dead band desired = currentReplicas.',
'The history holds (timestampMillis, recommendation) pairs; {{clock.millis()}} gives the simulated time, never {{System.currentTimeMillis()}}.',
'Apply "largest value in the window" only when {{raw < currentReplicas}}; on scale up return {{raw}} immediately.',
'Drop stale entries: {{while (!history.isEmpty() && now - history.peekFirst()[0] > windowMillis) history.removeFirst();}}',
      ],
        explain: `This is verbatim what the controller does, minus the metrics-server calls. Three layers stack up: (1) {{ceil}} ensures we never deliberately overshoot the target; (2) tolerance turns ±10% into forgivable noise, blocking flapping; (3) the stabilization window makes scale-down **slower** than scale-up, by taking the largest surviving proposal in the window — so a 30s traffic spike is not enough to drop Pods, and a cluster that just grew must "cool" for 300s before it can shrink.

Mistakes learners make:
- Forgetting to clamp {{min}}/{{max}} **before** recording history, so the late-clamped value wins in {{max(history)}} and keeps the cluster outside range.
- Applying "max in the window" to scale-up too → the cluster never grows fast enough on a sudden spike.
- Using {{System.currentTimeMillis()}} inside the function: tests pass at 2am and fail at 2pm, because the 300s window depends on real time. The fake clock is exactly why {{Clock}} is injected.
- Forgetting that the history includes the just-recorded entry, so the first scale-down of a cluster that never grew still returns the correct {{raw}}.

Interview answer: state the formula, then immediately give three real consequences — the CPU request must exist (% is computed against the request), tolerance/window explain why HPA is "slow by design", and cold Java Pods make metrics look bad so a warm-up gate is needed.`,
      },
    ],
    check: [
      { q: 'What is the HPA desiredReplicas formula?', options: ['ceil(current x currentMetric / targetMetric)', 'floor(currentMetric / targetMetric)', 'current + (currentMetric - target)', 'maxReplicas when metric > target'], answer: 0, explain: 'Pod count is inversely proportional to load: desired = current x (currentMetric / target), rounded up with ceil so we never deliberately overshoot the target.' },
      { q: 'How is the CPU percentage HPA compares against the target computed?', options: ['usage divided by CPU limit', 'usage divided by CPU request', 'usage divided by node cores', 'usage divided by the oldest Pod CPU'], answer: 1, explain: 'Kubernetes uses requests.cpu as the denominator. Without a request, CPU-based HPA does not work at all.' },
      { q: 'Which direction does the default 300s stabilization window apply to?', options: ['Both scale up and scale down', 'Scale up only', 'Scale down only: largest proposal inside the window', 'Only for custom metrics'], answer: 2, explain: 'Scale down must wait for all high proposals to age out of the 300s window; scale up applies the proposal immediately so the service does not collapse.' },
      { q: 'Why do freshly started Java Pods make CPU-based HPA over-scale?', options: ['Because metrics-server double-counts new Pods', 'Because JIT/Spring boot burn CPU so the average is artificially high before real load arrives', 'Because HPA does not know about new Pods', 'Because the CPU limit is ignored for new Pods'], answer: 1, explain: 'Interpreter + JIT compiler and Spring startup consume large CPU in the first 1-2 minutes, pushing the average up and triggering more Pods — the bad loop.' },
    ],
  },
});
