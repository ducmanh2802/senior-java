/*
 * English translation of js/data/lessons-devops.js — task T700. Format: js/core/i18n.js (content overlay).
 * ids: lesson-devops-006
 */
App.i18n.content({
  'lesson-devops-006': {
    title: 'Graceful shutdown: the timeline from SIGTERM to SIGKILL, draining the thread pool, and rolling updates that drop no requests',
    goals: [
      "Draw the shutdown timeline of a Pod (Terminating → preStop → SIGTERM → Spring closes the context → SIGKILL) and point out which steps run in parallel",
      "Compute the time budget: terminationGracePeriodSeconds must exceed preStop + the total time of the Spring shutdown phases + resource cleanup",
      'Implement the canonical drain pattern for an ExecutorService: shutdown → awaitTermination with a deadline → shutdownNow, and report the number of cancelled requests',
      'Configure a rolling update (maxSurge, maxUnavailable, minReadySeconds) and recognise traps such as a shell-form ENTRYPOINT swallowing SIGTERM',
    ],
    body: `### Why does a deploy still drop requests even with graceful shutdown turned on?
The "Liveness, readiness, startup probe" lesson already built the READY → DRAINING state machine. This lesson continues at the level of the **whole system**: look at the entire timeline from the moment Kubernetes decides to delete a Pod to the moment the JVM exits, **add up time** for each step, and implement yourself the core part that Spring normally does on your behalf: **draining a thread pool** (wait for in-flight requests, cancel them when the deadline hits and report).

Graceful shutdown is only correct when **three tiers** cooperate. Break one tier and requests are lost:

| Tier | Responsibility | Key configuration |
|---|---|---|
| Kubernetes | Remove the Pod from the Service, run preStop, send SIGTERM, SIGKILL at the deadline | {{preStop}}, {{terminationGracePeriodSeconds}} |
| Container (PID 1) | Forward SIGTERM to the JVM | exec-form {{ENTRYPOINT}} |
| Spring Boot / JVM | Stop accepting new work, wait for work in flight, close resources in order | {{server.shutdown}}, {{spring.lifecycle.timeout-per-shutdown-phase}}, {{spring.task.execution.shutdown.*}} |

### The shutdown timeline of a Pod (worked example with numbers)
~~~text
t=0s    Pod enters Terminating (rolling update / scale down / kubectl delete)
        ├─ parallel A: EndpointSlice removes the Pod; kube-proxy, Ingress, ALB update within 1-5s
        │               (during this window NEW requests can still reach the Pod)
        └─ parallel B: kubelet runs preStop "sleep 10"
t=10s   preStop done → kubelet sends SIGTERM to PID 1 of the container
        JVM runs the shutdown hook → Spring closes the ApplicationContext:
          1. readiness = REFUSING_TRAFFIC
          2. web server stops accepting new connections, waits for in-flight requests  (≤ 20s)
          3. other SmartLifecycles stop: Kafka listener, scheduler…   (each phase ≤ 20s)
          4. destroy beans: executor waits for tasks, HikariCP closes connections
t≈25s   JVM exits (exit code 143 = 128 + 15, i.e. terminated by SIGTERM) → the Pod disappears
t=60s   terminationGracePeriodSeconds deadline: still alive → SIGKILL (exit 137)
~~~

The key point: the {{terminationGracePeriodSeconds}} clock starts ticking **from t=0**, which means it **includes the preStop time**. If preStop is still running when the deadline hits, kubelet only grants one extra 2-second window and then kills.

### The time budget: the addition must be right
~~~text
terminationGracePeriodSeconds ≥ preStop
                               + (number of shutdown phases that wait × timeout-per-shutdown-phase)
                               + destroy-bean time (executor, connection pool)
                               + 5-10s headroom
~~~
A wrong example that is very common in practice: leave {{terminationGracePeriodSeconds: 30}} at the default, add a 10s preStop, and keep Spring's default {{timeout-per-shutdown-phase: 30s}}. The possible total is 40s+ > 30s → the longest request is cut off by SIGKILL, and because the Kafka offset was not committed, the message gets processed again. The correct configuration, matching the timeline above:

~~~yaml
# Deployment (excerpt)
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
~~~

~~~yaml
# application.yml
server:
  shutdown: graceful                 # default from Spring Boot 3.4 onwards; older versions must state it explicitly
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s  # each phase waits at most 20s
  task:
    execution:
      shutdown:
        await-termination: true      # the executor of @Async waits for running tasks
        await-termination-period: 15s
~~~

### Inside the JVM: in what order does Spring close the context?
1. **SIGTERM → shutdown hook.** Spring Boot registers a JVM shutdown hook out of the box ({{spring.main.register-shutdown-hook=true}} by default) that calls {{context.close()}}.
2. **Readiness = REFUSING_TRAFFIC.** The web application context publishes an {{AvailabilityChangeEvent}} before stopping beans, so {{/actuator/health/readiness}} returns 503.
3. **Stop the SmartLifecycle beans phase by phase** (the highest phases stop first). The web server's graceful shutdown is one phase: Tomcat/Jetty/Undertow stop accepting new connections and wait for in-flight requests. The Spring Kafka listener containers, the scheduler… are other phases. Each phase waits at most {{timeout-per-shutdown-phase}}; past the deadline Spring logs it and **moves on** rather than waiting forever.
4. **Destroy the singleton beans**: {{@PreDestroy}}, {{DisposableBean}}. By default {{ThreadPoolTaskExecutor}} does **not wait**: it calls {{shutdownNow()}} — running tasks are interrupted, tasks in the queue are dropped. To make it wait, turn on {{await-termination}} as above (this corresponds to {{setWaitForTasksToCompleteOnShutdown(true)}} + {{setAwaitTerminationSeconds}}). HikariCP closes the pool; any task that keeps running after that hits the error "HikariDataSource has been closed".
5. All non-daemon threads finish → the JVM exits.

### The canonical drain pattern for an ExecutorService
This is exactly the core of steps 3–4, and it is the thing you have to write yourself when you own a thread pool (self-managed consumer, batch worker):

~~~java
pool.shutdown();                                     // 1. no new tasks accepted; queued tasks STILL run
if (!pool.awaitTermination(20, TimeUnit.SECONDS)) {  // 2. wait with a deadline, never wait unboundedly
    List<Runnable> dropped = pool.shutdownNow();     // 3. pull the not-yet-started tasks out + interrupt the running ones
    log.warn("Shutdown timeout, dropped {} queued tasks", dropped.size());
    pool.awaitTermination(5, TimeUnit.SECONDS);      // 4. give the interrupted tasks time to clean up
}
~~~

| Call | New tasks | Tasks in the queue | Running tasks | Blocks the calling thread? |
|---|---|---|---|---|
| {{shutdown()}} | Rejected ({{RejectedExecutionException}}) | Still run | Keep running | No |
| {{awaitTermination(t)}} | — | — | — | Yes, at most t; returns true if everything has finished |
| {{shutdownNow()}} | Rejected | Pulled out, returned as a {{List<Runnable>}} | **Interrupted** | No |

Interruption is **cooperative**: a task blocked in {{socket.read()}} without a timeout will not react. That is why every network call must have a timeout, and code catching {{InterruptedException}} must restore the flag ({{Thread.currentThread().interrupt()}}) instead of swallowing it.

### Rolling update: turning old Pods off is only half the story
- **maxSurge / maxUnavailable** (defaults 25% / 25%; maxSurge rounds **up**, maxUnavailable rounds **down**). For an important Service set {{maxUnavailable: 0}} so capacity is never short, and {{maxSurge: 1}} or 25% depending on the resource quota.
- A rolling update only turns an old Pod off once the new Pod is **Ready**. The new Pod's readiness must reflect real warm-up (connection pool opened, caches loaded); otherwise the new Pod takes traffic while still "cold" and p99 jumps.
- **minReadySeconds**: a new Pod must stay Ready continuously for N seconds before it counts as available — this blocks the case of Ready and then crashing immediately.
- **progressDeadlineSeconds** (default 600s): a rollout that stops progressing is marked failed, but the Deployment **does not roll back by itself**; that job belongs to the pipeline (Argo Rollouts, kubectl rollout undo).
- **PodDisruptionBudget** protects you when draining a node (voluntary eviction); it does **not** apply to a Deployment's rolling update.

### Common production traps
- **Shell-form ENTRYPOINT**: {{ENTRYPOINT java -jar app.jar}} makes {{/bin/sh}} PID 1; sh does not forward SIGTERM to the JVM. The log never contains the line "Commencing graceful shutdown", the Pod always takes exactly {{terminationGracePeriodSeconds}} and then gets SIGKILLed (exit 137). Fix: exec form {{ENTRYPOINT ["java", "-jar", "app.jar"]}}, or {{exec java …}} inside a script, or a small init such as tini.
- **Distroless images have no sh**: preStop {{sh -c "sleep 10"}} fails right away (FailedPreStopHook event), so there is no delay at all. Use the Kubernetes {{preStop.sleep}} (available since 1.30).
- **Requests longer than the timeout** (2-minute report exports, large uploads): always cut short during a deploy. Turn them into asynchronous jobs with an idempotency key and have the client poll for the result.
- **Long-lived connections** (WebSocket, gRPC streams): the web server stops accepting **new** connections but the old ones stay open until the deadline. Proactively send close signals (close frame, gRPC GOAWAY) so clients reconnect to another Pod.
- **A self-written shutdown hook that calls {{System.exit()}}**: while the JVM is already running shutdown hooks, {{System.exit}} blocks forever → the process hangs until SIGKILL.

### Interview notes
A question you often hear: "server.shutdown=graceful is on, yet every deploy still has Pods killed by SIGKILL and some 502 errors — how do you investigate?" Answer along the timeline: (1) check whether SIGTERM even reaches the JVM (ENTRYPOINT form, the "Commencing graceful shutdown" log line, exit code 137 vs 143); (2) preStop so the load balancer has time to remove the Pod; (3) the budget addition: grace ≥ preStop + the phases + cleanup; (4) executors and your own consumers drain with a timeout and count how many tasks were cancelled; (5) rolling update with {{maxUnavailable: 0}} + real readiness + minReadySeconds. The exercise below implements part (4).

> Senior tip: Log and turn into metrics three numbers for every shutdown: the moment SIGTERM was received, the actual drain duration and the number of cancelled requests. Base {{timeout-per-shutdown-phase}} on the p99.9 request processing time (add 50%), then compute the grace period backwards from it. Teams that do this usually discover a "long tail" — a few endpoints that run for 40 seconds — that nobody knew about.`,
    exercises: [
      {
        title: 'GracefulServer: stop accepting, drain with a deadline, cancel and count dropped requests',
        prompt: `Simulate the "drain" part of graceful shutdown with one {{ExecutorService}}. The starter already creates the pool (daemon threads), the counters and {{shutdown(timeoutMs)}} = {{beginShutdown()}} + {{awaitDrain(timeoutMs)}}. You need to complete:

- {{submit(Runnable request)}}: if the server is shutting down, return **false** and do **not** run the request. Otherwise hand the pool a wrapper: increment {{running}} at the start, run the request, increment {{completed}} on success, always decrement {{running}} in {{finally}}; a request that throws {{RuntimeException}} must not be allowed to kill the worker. Return **true**. If the pool is already closed ({{RejectedExecutionException}}), return false.
- {{beginShutdown()}}: stop accepting new requests (so that {{isAccepting()}} returns false) and make the pool stop accepting new tasks. It must **not block** and must **not cancel** requests that are running or queued.
- {{awaitDrain(timeoutMs)}}: wait at most {{timeoutMs}} for every accepted request (running **and** queued) to finish. If they finish in time, return **0**. When the deadline expires, cancel forcibly: requests that never started are dropped, running requests are interrupted; return the **number of cancelled requests** = the running ones + the ones that never started.

A hint about ordering: read the number of running requests **before** interrupting them, because an interrupted request exits and decrements the counter.`,
        hints: [
          'In {{submit}}, check the {{accepting}} flag first; wrap the request in a lambda that increments/decrements {{running}} (decrement in {{finally}}) and catches {{RuntimeException}}. Do not forget to catch {{RejectedExecutionException}} thrown by {{pool.execute}}.',
          '{{beginShutdown}} only needs to set {{accepting = false}} and call {{pool.shutdown()}} — this method must not block and still lets queued tasks run. Do not call {{shutdownNow()}} here.',
          'In {{awaitDrain}}: if {{pool.awaitTermination(timeoutMs, TimeUnit.MILLISECONDS)}} returns true, return 0. Otherwise read {{running.get()}} first and only then call {{pool.shutdownNow()}}; the result = the number running + the size of the returned list.',
        ],
        explain: `**The idea**: split shutdown into two steps, just like Spring and Kubernetes do. {{beginShutdown}} corresponds to the moment SIGTERM is received: stop taking new work but **do not touch** the work already accepted. {{awaitDrain}} corresponds to {{timeout-per-shutdown-phase}}: wait with a deadline, and when it expires cancel forcibly so the process still exits before SIGKILL, and **report** how many requests were cancelled so you get a metric.

**Why {{shutdown()}} and not {{shutdownNow()}} at step 1?** The test "queued requests still run" checks exactly this: 3 requests already accepted (the client is waiting for a response) that get dropped are no different from being killed. {{shutdownNow()}} is only the last resort once the time is up.

**Why read {{running}} before {{shutdownNow()}}?** After being interrupted, a running request exits very quickly and decrements the counter in {{finally}}; reading afterwards can yield 0 or 1 instead of 2, which makes the test pass sometimes and fail other times. In real code this number feeds logs/metrics, so a small deviation caused by the race is acceptable, but the correct ordering minimises it.

**Common mistakes:**
- Only setting the flag {{accepting = false}} and forgetting {{pool.shutdown()}}: {{awaitTermination}} never returns true, so every shutdown waits out the full timeout.
- {{awaitTermination}} with no deadline ({{Long.MAX_VALUE}}): one hung request keeps the Pod alive until SIGKILL — you lose any chance of controlled cleanup.
- Not catching {{RuntimeException}} inside the wrapper: with {{execute()}}, an exception kills the worker thread (the pool spawns a replacement, but {{completed}}/{{running}} must still stay correct thanks to {{finally}}).
- A request catching {{InterruptedException}} and swallowing it (no flag restore, keeps running): {{shutdownNow()}} loses its effect.

> Senior tip: Spring Kafka, {{@Scheduled}} and {{@Async}} all build on exactly this pattern. When reviewing a configuration, ask three questions: does the pool wait for tasks (await-termination), for how long at most, and does the sum of those durations fit inside the grace period minus preStop?`
      }
    ],
    check: [
      {
        q: 'A Deployment has {{terminationGracePeriodSeconds: 30}}, preStop {{sleep 10}}, Spring Boot {{timeout-per-shutdown-phase: 30s}}. A request that takes 25 seconds is running when the Pod is deleted. What is most likely to happen?',
        options: ['The request finishes normally because Spring waits up to 30 seconds', 'The request is cut off by SIGKILL because the grace period counts from the moment the Pod is deleted and includes the 10s preStop', 'Kubernetes automatically extends the grace period until Spring reports it is done', 'preStop is not counted in the grace period, so a full 30 seconds remain after SIGTERM'],
        explain: `The grace-period clock runs from the moment the Pod enters Terminating; preStop eats 10 seconds, so after SIGTERM only about 20 seconds remain — not enough for a 25-second request, and SIGKILL arrives first. "Spring waits up to 30 seconds" is true on Spring's side, but Kubernetes does not know that and does not wait. Kubernetes never extends the period per app; the only exception is one extra 2 seconds when preStop is still running at the deadline. The last option is wrong because preStop is counted inside the grace period.`
      },
      {
        q: 'When shutting down an {{ExecutorService}} to drain requests, what is the correct difference between {{shutdown()}} and {{shutdownNow()}}?',
        options: ['shutdown() blocks until every task is done; shutdownNow() does not block', 'shutdown() rejects new tasks but still runs the tasks in the queue; shutdownNow() pulls the queued tasks out (returning them as a list) and interrupts the running tasks', 'shutdown() cancels the tasks in the queue; shutdownNow() kills the threads immediately', 'The two are the same, shutdownNow() is just faster'],
        explain: `{{shutdown()}} only closes the door to new work; work already queued still runs to completion. {{shutdownNow()}} returns the {{Runnable}}s that never started and sends an interrupt to the running threads. Both **do not block** — to wait you must call {{awaitTermination}}, so the first option is wrong. {{shutdownNow()}} does not kill threads: interruption is cooperative, a task must check the flag itself or be blocked in a method that reacts to interruption. The two differ in semantics, not in speed.`
      },
      {
        q: 'A Deployment with 10 replicas, rolling update with {{maxSurge: 25%}} and {{maxUnavailable: 0}}. Which statement is correct?',
        options: ['At most 13 Pods at a time and never fewer than 10 available, because maxSurge rounds up (2.5 → 3)', 'At most 12 Pods because 25% of 10 rounds down to 2', 'The configuration is invalid because maxUnavailable may not be 0', 'Kubernetes turns the old Pods off first and only then creates the new Pods'],
        explain: `maxSurge rounds **up** (2.5 → 3), so there can be up to 13 Pods; with maxUnavailable = 0 the number of available Pods never drops below 10 — an old Pod is only turned off once the new Pod is Ready. Rounding down is the rule of maxUnavailable, not of maxSurge. The configuration is invalid only when **both** are 0 (the rollout could never progress). With maxUnavailable = 0, Kubernetes is forced to create the new Pod first and only then turn the old one off, so the last option is wrong.`
      }
    ],
  },
});
