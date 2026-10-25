/*
 * English translation of js/data/q-devops.js — task T213. Format: js/core/i18n.js (content overlay).
 * ids: devops-001 devops-002 devops-003 devops-004 devops-005 devops-006 devops-007 devops-008 devops-009
 */
App.i18n.content({
  'devops-001': {
    q: 'How would you write a Dockerfile for a Spring Boot 3 service so the image is small, builds fast when only code changes, and is safe when running in production?',
    a: `**Summary:** Use multi-stage build: a JDK stage to build and split the layered jar, a runtime stage with only JRE. Copy layers in order of least change first (dependencies, loader, snapshot, application) so Docker cache reuses them, run as non-root user, use exec-form ENTRYPOINT so JVM receives SIGTERM directly, and set {{-XX:MaxRAMPercentage}} instead of a fixed Xmx.

### Why not just \"COPY app.jar\"
Fat jar 80–150 MB is ~95% third-party libraries, only a few hundred KB of your code. If you copy the whole jar as **one layer**, every time you change one line the 120 MB layer changes digest, and the registry and node must pull the entire layer again. Docker cache is layer-based: one changed layer forces **all later layers** to rebuild. Therefore split the rarely changing parts first and the frequently changing parts (your classes) last.

### Spring Boot layered jar
Spring Boot packages a {{layers.idx}} file inside the jar. From Boot 3.3 use {{-Djarmode=tools}} to extract (the old {{-Djarmode=layertools}} is deprecated). Four default layers: {{dependencies}}, {{spring-boot-loader}}, {{snapshot-dependencies}}, {{application}}.

### Example
~~~text
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
# Cache .m2 directory with BuildKit: new pom downloads dependencies again
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q package -DskipTests
# Split jar into layer directories + launcher
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /out

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
# Least changing copied first
COPY --from=build /out/dependencies/ ./
COPY --from=build /out/spring-boot-loader/ ./
COPY --from=build /out/snapshot-dependencies/ ./
COPY --from=build /out/application/ ./
USER 10001
# Exec form: java is PID 1, receives SIGTERM directly
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
~~~

### Each decision and reason
| Decision | Reason |
|---|---|
| Multi-stage | Final image has no JDK, Maven, source: smaller by hundreds of MB, fewer CVEs |
| JRE base (or distroless/jlink) | Less extra tooling, smaller attack surface |
| Copy pom before src | Changing code does not lose dependency download cache |
| Non-root USER with numeric UID | Container escape is less dangerous; Kubernetes {{runAsNonRoot}} can check numeric UID |
| Exec-form ENTRYPOINT | Shell form wraps java in {{/bin/sh -c}}, sh does not pass SIGTERM, graceful shutdown does not run and pod gets SIGKILL after grace period |
| MaxRAMPercentage | Heap auto-scales with container memory limit |

### Common wrong answers
- \"Use tag {{latest}} for base image\": build is not reproducible. Pin version, best pin digest.
- \"Run {{mvn package}} on machine then COPY jar\": okay, but build environment differs per machine; CI should build in a standard stage.
- \"Set {{-Xmx}} exactly equal to memory limit\": forgets metaspace, thread stack, code cache, direct buffer, so easy to get OOMKilled.

### Production pitfalls
- Forgetting {{.dockerignore}}: {{target}}, {{.git}} sent into build context, build slow, sometimes leak secrets.
- Putting secrets into {{ARG}}/{{ENV}}: stays permanently in image history. Use {{RUN --mount=type=secret}} of BuildKit.
- Alpine (musl) with some native libs (Netty tcnative, font for PDF reports) causes hard-to-predict errors; use Ubuntu/Debian-based image for safety.

> Senior tip: Measure with {{docker history}} or tool dive: after layering, a commit changing code usually pushes only the application layer of a few hundred KB instead of hundreds of MB. With 50 services and 20 deploys/day, registry and node pull time drop clearly. You can use Buildpacks ({{spring-boot:build-image}}) if the team does not want to maintain a Dockerfile themselves.`,
    follow: [
      'What are the pros and cons of Distroless or jlink custom runtime vs a regular JRE image?',
      'How to pass Nexus credentials into the build step without leaving them in the image?',
      'How does CDS/AOT cache help startup time and how to include it in the Dockerfile?'
    ]
  },
  'devops-002': {
    q: 'How does a container differ from a VM? Why does running a Java app in a container require special attention to CPU and RAM limits, and how do you configure the JVM?',
    a: `**Summary:** VM virtualizes hardware and has its own kernel; container is just a process on the host, shares the kernel, isolated by namespaces and limited by cgroups. The JVM must read the correct cgroup limits to choose heap size, GC threads, thread pools; if misconfigured the app gets OOMKilled or CPU throttled despite available host resources.

### Container from the kernel perspective
- **Namespaces** (pid, net, mnt, uts, ipc, user) decide what process **sees**: separate PID 1, separate network, separate filesystem.
- **cgroups** decide what process **may use**: memory.max, cpu.max (cgroup v2).
- **Image** is a stack of read-only layers (overlayfs), container adds a thin writable layer on top. Many containers share layers so disk is saved and startup is fast.

| | VM | Container |
|---|---|---|
| Kernel | Separate per VM | Shared host kernel |
| Startup | Tens of seconds to minutes | Milliseconds (plus app time) |
| Isolation | Strong (hypervisor) | Weaker; kernel vulnerability affects all containers |
| Overhead | GB RAM per guest OS | Nearly none |
| Best for | Multi-tenant with no trust, different OS | Packaging and scaling microservices |

### Why Java is especially sensitive
JVM chooses settings by the "machine" it sees (ergonomics). Before JDK 10, JVM reads {{/proc/meminfo}} and sees host RAM (say 64 GB), so default heap is 1/4 = 16 GB while container only has 2 GB, leading to kernel OOM killer killing the process (exit 137) with no OutOfMemoryError in logs.

From JDK 10 (backported to 8u191), {{-XX:+UseContainerSupport}} is on by default; cgroup v2 support from JDK 15 and backported to 11.0.16, 8u372. Still there are traps:
- **Default heap is only 25%** of memory limit ({{MaxRAMPercentage=25}}). A 2 GB pod gets only 512 MB heap, wasting resources.
- **Memory is not just heap**: metaspace, code cache, thread stack (~1 MB per thread, 300 threads ~300 MB), direct buffer from Netty, GC overhead. So usually set 70–75%, never 100%.
- **CPU**: JVM computes {{availableProcessors}} from CPU **limit** (quota). If limit = 1 CPU, JVM treats the machine as non-server-class and chooses **SerialGC**, ForkJoinPool common pool and many thread pools only 1 thread.
- **CPU throttling**: CFS quota is calculated over 100 ms cycles. Limit 1 CPU with 8 threads running in parallel uses quota in ~12 ms, then frozen ~88 ms. Symptoms: p99 latency spikes while average CPU is only 40%.

### Recommended configuration
~~~bash
# Check what JVM sees inside the container
java -XshowSettings:system -version
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|UseSerialGC|UseG1GC"

# Real flags
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=2"
~~~
- Memory: set request = limit for critical services (predictable, avoid eviction).
- CPU: many teams drop CPU limit (only request) to avoid throttling; then set {{-XX:ActiveProcessorCount}} to keep thread pools from expanding to node core count.

### Common wrong answers
- \"Container is a light VM\": wrong by nature, container is a process.
- \"JVM does not know it runs in a container\": true for old JDK 8, false for JDK 17/21.
- \"Set Xmx = limit is safe\": wrong, non-heap will exceed limit.

> Senior tip: When pod is OOMKilled but heap usage is only 60%, compare RSS with limit and enable {{-XX:NativeMemoryTracking=summary}} then {{jcmd 1 VM.native_memory summary}} to see outside-heap parts. When p99 rises but CPU is low, check metric {{container_cpu_cfs_throttled_periods_total}}: very common cause on clusters where banks set 500m limits for Java services.`,
    follow: [
      'Pod is OOMKilled but heap usage is 60%. How do you investigate the remaining memory?',
      'Should you drop CPU limits for Java services? What is the risk for other pods on the same node?'
    ]
  },
  'devops-003': {
    q: 'A user calls https://api.bank.vn/accounts/123 to a service running on Kubernetes. Describe the request passing through which components (Pod, Deployment, Service, Ingress, ConfigMap, Secret) and the role of each.',
    a: `**Summary:** DNS points to the load balancer in front of the Ingress controller; Ingress controller reads Ingress rules (host + path) to pick Service; Service is a stable address selecting Ready Pods via label selector (EndpointSlice list); kube-proxy or controller forwards packets to a Pod IP. Deployment is not on the request path: it only ensures enough Pods of correct version exist. ConfigMap and Secret provide configuration to Pods at startup.

### Request path
~~~text
Client
  -> DNS api.bank.vn -> Load Balancer IP (cloud LB / F5 / MetalLB)
  -> Ingress controller (nginx, HAProxy, Traefik...) running as Pod
       match rule: host api.bank.vn, path /accounts -> Service account-svc:80
  -> Service account-svc (ClusterIP 10.96.12.34, port 80 -> targetPort 8080)
       selector app=account -> EndpointSlice: 10.244.1.15, 10.244.2.7 (only Ready Pods)
  -> kube-proxy (iptables/IPVS) or eBPF (Cilium) DNAT to 1 Pod IP
  -> Spring Boot container listening on 8080
~~~

### Role of each component
| Component | What it is | Why needed |
|---|---|---|
| Pod | Smallest runnable unit, 1 or more containers sharing network namespace and IP | Pod is \"ephemeral\": dies, a new Pod with new IP is created |
| Deployment | Desired-state declaration (image, replica count), manages ReplicaSet | Auto-replaces dead Pods, rolling update, rollback |
| Service | Stable DNS + virtual IP for a group of Pods | Client does not need to know continuously changing Pod IPs |
| Ingress | L7 rule (host, path, TLS) for external traffic | One LB used for many services instead of one LB per service |
| ConfigMap | Non-sensitive configuration (URL, feature flag) | Separate config from image: one image runs on every environment |
| Secret | DB password, API key, cert | Separate access control (RBAC), can be encrypted at-rest in etcd |

### Why Service uses label selector instead of Pod list
Pods are created/deleted continuously during scale or deploy. Service just declares \"all Pods with label app=account\"; control plane updates EndpointSlice automatically. Only Pods passing **readiness probe** enter the list, which is why readiness is important during deploy.

### Service types
- **ClusterIP** (default): only callable inside cluster, used for service-to-service ({{http://account-svc.payment.svc.cluster.local}}).
- **NodePort**: opens port 30000–32767 on every node, common on-prem when external LB points to nodes.
- **LoadBalancer**: cloud creates a dedicated LB for the Service.

### How ConfigMap and Secret enter the Pod
~~~yaml
containers:
  - name: account
    image: harbor.bank.local/core/account:1.8.2
    envFrom:
      - configMapRef: { name: account-config }   # SPRING_PROFILES_ACTIVE, URL...
    env:
      - name: SPRING_DATASOURCE_PASSWORD
        valueFrom:
          secretKeyRef: { name: account-db, key: password }
~~~
Environment variables are read only at container startup: changing ConfigMap **does not** make the app see new values until Pod restart. Volume mount updates files after a delay (unless using subPath), but the app must reload itself.

### Common wrong answers
- \"Request passes through Deployment\": wrong, Deployment is just a controller.
- \"Secret is encrypted\": default is base64; must enable encryption at rest and restrict RBAC.
- \"Service is a proxy process\": with kube-proxy iptables, Service is just a NAT rule on each node, no process receives packets.

### Production pitfalls
- Ingress-nginx by default sends directly to Pod IP from endpoint, not through ClusterIP; therefore retry/timeout config on Ingress affects individual Pods directly.
- Wrong label selector: Service has 0 endpoints, Ingress returns 503. Check with {{kubectl get endpointslices -l kubernetes.io/service-name=account-svc}}.

> Senior tip: When debugging \"call does not reach\", go step by step from inside out: {{kubectl port-forward}} into Pod, then curl Service from another Pod, then go to Ingress. Moreover Kubernetes is recommending moving from Ingress to **Gateway API** (HTTPRoute) because Ingress lacks standards for header routing, traffic split; worth knowing for trend answers.`,
    follow: [
      'If readiness probe fails, how are requests handled by that Pod?',
      'ConfigMap changed, how to make Pods receive new config in a controlled way?',
      'What is Headless Service and when is it needed (e.g. StatefulSet, Kafka)?'
    ]
  },
  'devops-004': {
    q: 'Every time you deploy the payment service on Kubernetes, monitoring records dozens of 502/503 errors. How do you configure rolling update, probes and graceful shutdown so deploy drops no requests?',
    a: `**Summary:** Errors come from two ends: new Pod receives traffic before ready, and old Pod is killed while still routed or processing a request. Fix: correct readiness probe (warmed up, DB connected), maxUnavailable 0 with appropriate maxSurge, preStop sleep for several seconds to wait for endpoint removal from all proxies, Spring Boot graceful shutdown, and terminationGracePeriodSeconds large enough.

### How rolling update works
Deployment creates a new ReplicaSet and gradually increases its replicas, while reducing the old ReplicaSet:
- {{maxSurge}} (default 25%): how many extra Pods allowed compared to replicas.
- {{maxUnavailable}} (default 25%): how many ready Pods may be missing.
With 4 replicas, set maxSurge 1, maxUnavailable 0: always ≥ 4 Ready Pods, add 1 new Pod at a time, wait until Ready then delete 1 old Pod. A Pod is counted as \"available\" only when Ready and after {{minReadySeconds}}.

### Why requests still drop when old Pod is deleted
When Pod is deleted, two things happen **in parallel**, with no order:
1. Kubelet runs preStop hook then sends SIGTERM to container.
2. Control plane removes Pod from EndpointSlice, then kube-proxy on all nodes and Ingress controller update rules.
If app receives SIGTERM and closes port immediately while step 2 has not spread to all proxies, new requests are still sent, resulting in connection refused or 502. Therefore need **preStop sleep** for several seconds to \"wait for network to forget me\" before starting shutdown.

~~~text
t=0   Pod marked Terminating -> start removing from endpoint (spreads gradually)
t=0   preStop: sleep 10              -> app still serves normally
t=10  SIGTERM -> Spring graceful: stop accepting new requests, wait for running requests
t=10..40  running requests finish, close DB pool, Kafka consumer commits offset
t=60  terminationGracePeriodSeconds exceeded -> SIGKILL if still alive
~~~

### Sample configuration
~~~yaml
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  minReadySeconds: 10
  template:
    spec:
      terminationGracePeriodSeconds: 60   # > preStop + Spring shutdown time
      containers:
        - name: payment
          lifecycle:
            preStop:
              exec: { command: ["sh", "-c", "sleep 10"] }  # distroless image: use sleep action built into K8s
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 10
            failureThreshold: 3
          startupProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 30   # allow startup up to 150s
~~~
On Spring Boot side: {{server.shutdown=graceful}} (default from Boot 3.4) and {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.

### Readiness vs liveness vs startup
| Probe | If fails | Should check |
|---|---|---|
| startup | Not yet running liveness/readiness; fail over threshold -> restart | App finished startup |
| readiness | Removed from Service, **not** restarted | Can serve requests (warmed up, pool ready) |
| liveness | Restart container | App stuck, cannot recover (deadlock) |

### Common wrong answers
- \"Let liveness check DB\": DB slow 30 seconds causes all Pods to restart at once, turning a small issue into a system crash.
- \"Rolling update is automatically zero-downtime\": only true when probes and shutdown are configured correctly.
- \"Increasing terminationGracePeriodSeconds is enough\": without preStop, errors still occur in the first seconds.

### Rollback
{{kubectl rollout status deploy/payment}} waits for result; {{kubectl rollout undo deploy/payment}} rolls back to previous revision (keeps {{revisionHistoryLimit}}, default 10). If new Pod is not Ready, rollout stops and reports error after {{progressDeadlineSeconds}} (default 600s) but **does not auto-rollback**; pipeline must call undo or use Argo Rollouts.

> Senior tip: DB schema changes must be backward-compatible (expand-contract) because during rolling update old and new versions run in parallel. Verify zero-downtime by running k6/JMeter continuously during deploy on staging and requiring 0 errors; for payment services this should be a release checklist step.`,
    follow: [
      'What should a Kafka consumer in a shutting-down Pod do to avoid duplicate or lost messages?',
      'When do you choose blue-green or canary over rolling update?',
      'Should readiness probe check DB? What is the trade-off?'
    ]
  },
  'devops-005': {
    q: 'After deploy, your Pod falls into one of CrashLoopBackOff, ImagePullBackOff, Pending or OOMKilled. What sequence of diagnosis steps do you follow for each case?',
    a: `**Summary:** Always start with {{kubectl get pod}} to see status, {{kubectl describe pod}} to read Events and Last State, then {{kubectl logs --previous}} to see logs from the last run that died. Pending is scheduling (resources, taint, PVC); ImagePullBackOff is registry/tag/credential; CrashLoopBackOff is app starts then dies; OOMKilled is memory limit exceeded, kernel kills process with exit code 137.

### General procedure
~~~bash
kubectl get pod -n payment -o wide                 # STATUS, RESTARTS, NODE
kubectl describe pod payment-7d9f-abcde -n payment # last Events, Last State, Exit Code
kubectl logs payment-7d9f-abcde -n payment --previous   # log of dead container
kubectl get events -n payment --sort-by=.lastTimestamp
kubectl top pod -n payment                          # needs metrics-server
~~~

### Each state
| State | Meaning | Common causes | Evidence |
|---|---|---|---|
| Pending | Not scheduled on node | No node with enough CPU/RAM per **request**; missing toleration for taint; wrong nodeSelector/affinity; PVC not bound | Event {{FailedScheduling}}: \"0/6 nodes are available: 3 Insufficient memory...\" |
| ImagePullBackOff / ErrImagePull | Kubelet cannot pull image | Wrong tag, image not pushed, missing imagePullSecrets, internal registry cert expired or node cannot reach registry | Event Failed: \"manifest unknown\", \"unauthorized\", \"x509\" |
| CrashLoopBackOff | Container runs then exits continuously, kubelet waits longer before restart (10s, 20s, 40s... max 5 min) | Spring config error (missing property, wrong DB URL), Flyway migration fails, liveness probe kills slow-starting app | Last State: Terminated, Exit Code 1; log --previous has stack trace |
| OOMKilled | Kernel kills process exceeding memory limit | Heap too close to limit, native memory, too many threads | Last State: Terminated, Reason: OOMKilled, Exit Code: 137 |
| CreateContainerConfigError | Cannot create container | Missing ConfigMap/Secret or referenced key | Event: \"secret ... not found\" |

### Read exit codes
- **1**: app exits due to exception (Spring {{APPLICATION FAILED TO START}}).
- **137** = 128 + 9 (SIGKILL): OOMKilled or killed due to grace period / liveness fail. Distinguish by Reason field.
- **143** = 128 + 15 (SIGTERM): normal shutdown.

### CrashLoopBackOff: two common traps
1. **Liveness kills slow-starting app**: Spring app needs 90 seconds, liveness starts after 30s with failureThreshold 3, so app restarts forever. Log has no error; Events show \"Liveness probe failed\". Fix with startupProbe.
2. **Empty log**: app dies before writing log (wrong ENTRYPOINT, missing main class, wrong arm64/amd64 architecture reports \"exec format error\"). Check Events and try image with {{docker run}} locally.

### OOMKilled vs OutOfMemoryError
| | OOMKilled | java.lang.OutOfMemoryError |
|---|---|---|
| Who detects | Kernel (cgroup) | JVM |
| Stack trace | No | Yes (and heap dump if enabled) |
| Cause | Total RSS > limit | Heap/metaspace full |
| Fix | Reduce MaxRAMPercentage, increase limit, check native memory | Find leak, increase heap |

### Common wrong answers
- \"Delete Pod so it creates a new one\": new Pod has same error because cause is in spec.
- \"CrashLoopBackOff is a Kubernetes error\": no, almost always app or config error.
- \"Pending because node out of actual RAM\": scheduler checks total **request**, not actual usage.

> Senior tip: Set alerts for {{kube_pod_container_status_restarts_total}} increasing and for reason OOMKilled instead of waiting for user reports. In banks, ImagePullBackOff at 2 AM is often due to internal Harbor cert expiration or robot account rotation: include cert expiry date and token rotation in the operations checklist.`,
    follow: [
      'How to debug a distroless container in CrashLoopBackOff without a shell? (hint: kubectl debug, ephemeral container)',
      'Pod is Pending due to Insufficient cpu while node uses only 20% actual CPU. How do you explain and handle this?'
    ]
  },
  'devops-006': {
    q: 'How do you configure HPA for a Java service: scale by CPU or by custom metric like RPS or Kafka lag? Why do Java apps usually scale slowly and how do you handle that?',
    a: `**Summary:** HPA calculates periodically (default 15s) replicas = ceil(current replicas × metric / target). CPU is easy but indirect; for Kafka consumers or I/O-bound APIs scale by metrics close to real load (lag, RPS, queue length) via Prometheus Adapter or KEDA. Java scales slowly because JVM startup is long and JIT warm-up causes CPU spikes in new Pods; handle with startupProbe, enough minReplicas, fast scaleUp / slow scaleDown policies, and reduced startup time (CDS, AOT cache).

### Formula and effects
~~~text
desired = ceil(current * currentMetric / target)
Example: 4 Pods, average CPU 90% of request, target 60%
desired = ceil(4 * 90 / 60) = 6
~~~
- CPU percentage is computed **by request**, not by limit. No CPU request means CPU-based HPA does not work.
- Default tolerance is 10%: small differences do not scale to avoid fluctuation.
- Scale down has a default stabilization window of 300 seconds.

### CPU or custom metric
| Metric | Good for | Limitations |
|---|---|---|
| CPU | Compute-heavy, serialization-heavy services | Services waiting on DB/HTTP: latency rises while CPU stays low, HPA does not react |
| Memory | Rarely good for Java | Heap rarely shrinks after GC, so only scales up |
| RPS / concurrent requests | API gateway, I/O-bound services | Requires Prometheus + adapter, must know 1 Pod capacity |
| Kafka lag | Consumer | Replicas exceed partition count means extra Pods sit idle |

### Sample configuration (autoscaling/v2)
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: payment }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: payment }
  minReplicas: 4
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 60 }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies: [ { type: Percent, value: 100, periodSeconds: 30 } ]  # max double every 30s
    scaleDown:
      stabilizationWindowSeconds: 600
      policies: [ { type: Pods, value: 1, periodSeconds: 60 } ]       # decrease slowly
~~~
With Kafka, KEDA has built-in lag scalers and can scale to 0; when setting maxReplicas must be ≤ partition count.

### Why Java scales slowly
1. **Startup**: Large Spring Boot app takes 30–90 seconds (classpath scanning, bean creation, pool setup, Flyway).
2. **JIT warm-up**: first minutes run in interpreter/C1, CPU high, latency worse than warm Pods.
3. **Bad loop**: new Pod consumes CPU during startup, raises average CPU, HPA scales more. Kubernetes reduces this by ignoring CPU samples from Pods not Ready during initial phase, but readiness probe reporting Ready too early removes this protection.
4. From load increase to new Pod serving: metric cycle + image pull time + startup + warm-up, easily 2–3 minutes. Short load spikes pass before new Pods are ready.

### How to handle
- **minReplicas** enough for normal load + buffer; HPA only absorbs increases.
- **Scheduled scaling** for known peaks (salary on 25th, flash sale 12.12): KEDA cron scaler or CronJob changes minReplicas.
- Reduce startup time: CDS/AppCDS, lazy init selectively, JDK 24+ AOT cache (JEP 483), or GraalVM native image if accepting constraints.
- Active warm-up before reporting Ready (call main endpoints hundreds of times).
- Pre-pull images or keep images small; node pool has space (Cluster Autoscaler/Karpenter adding nodes takes minutes).

### Common wrong answers
- \"Setting HPA means it handles all peaks\": HPA reacts in minutes, not seconds.
- \"Scale by memory for Java\": heap does not return, replicas only increase.
- \"Raise maxReplicas to 100\": DB connection pool × replicas may exceed max_connections.

> Senior tip: Before peak season, run load tests to measure 1 Pod capacity (e.g., 400 RPS at p99 under 200 ms) then compute minReplicas from that; do not rely on HPA. Always multiply connection pool count by maxReplicas to ensure DB can handle it, and remember HPA and VPA should not both control CPU/memory of the same Deployment.`,
    follow: [
      'What happens when Kafka consumer replicas exceed partition count? How does rebalance behave during continuous scaling?',
      'HPA scales to 20 Pods but latency does not drop. Where do you suspect the bottleneck?',
      'How to reduce Spring Boot startup from 60 seconds to under 10 seconds?'
    ]
  },
  'devops-007': {
    q: 'You SSH into a Linux server running a Java service reported as slow. Which commands do you type, in what order, to narrow down the cause (CPU, RAM, disk, network, log)?',
    a: `**Summary:** Go by resource order: {{uptime}}/{{top}} for load and CPU (watch %wa, %st), {{free -m}} for RAM and swap, {{df -h}}/{{df -i}} for disk and inode, {{ss}} for connections and ports, {{lsof}} for files/sockets held by process, then read logs with {{tail}}/{{grep}}/{{journalctl}} and {{dmesg}} to catch OOM killer. For Java, combine {{top -H}} to find CPU-eating threads then match with thread dump.

### 1. CPU and load
~~~bash
uptime                     # 1/5/15 min load average, compare to core count (nproc)
top -c                     # press 1 for per-core, P sort by CPU, M by RAM
vmstat 1 5                 # r: runnable queue, si/so: swap, wa: I/O wait
~~~
Read {{%Cpu(s)}} line in top:
- **us** high: code computing (loops, GC, serialize).
- **sy** high: many system calls, context switches.
- **wa** high: CPU idle but waiting for disk, suspect I/O.
- **st** high (VM): hypervisor takes your CPU, issue at infrastructure layer.

Load average includes processes waiting for I/O (D state) on Linux, so high load does not always mean low CPU.

### 2. Which Java thread eats CPU
~~~bash
top -H -p 12345            # 12345 = java PID; see thread 12399 using 98% CPU
jstack 12345 | grep -A 20 'nid=12399 '  # JDK 18+: nid in decimal
printf '%x\n' 12399        # JDK 8–17: nid is hex -> 306f
jstack 12345 | grep -A 20 'nid=0x306f'
~~~
If it is \"GC Thread\" or \"G1 Conc\", the problem is memory, not code: check GC log.

### 3. Memory
~~~bash
free -m                    # look at available, not free
dmesg -T | grep -i -E 'killed process|out of memory'   # has OOM killer acted
~~~
Linux uses free RAM for page cache, so low \"free\" is normal. Swap used with JVM is very bad: GC must touch entire heap, swap causes pauses of seconds.

### 4. Disk
~~~bash
df -h                      # usage; 100% means log/DB write errors
df -i                      # inode: out of inode still reports \"No space left\" despite GB left
du -sh /var/log/* | sort -h | tail
lsof +L1                   # deleted files still held open by process, space not freed
iostat -x 1                # %util, await per disk (sysstat package)
~~~

### 5. Network and connections
~~~bash
ss -s                                   # total connections by state
ss -ltnp                                # listening ports and owning process
ss -tan state close-wait | wc -l        # many CLOSE_WAIT: app does not close connection
ss -tan state time-wait | wc -l
ss -tnp | grep 5432 | wc -l             # connections to PostgreSQL
~~~

### 6. Logs
~~~bash
tail -f /opt/app/logs/app.log | grep --line-buffered ERROR
grep -c ' 500 ' access.log
awk '{print $9}' access.log | sort | uniq -c | sort -rn   # count by status code
journalctl -u payment.service --since '10 min ago' -f
~~~

### Quick symptom table
| Symptom | Suspect | Confirm with |
|---|---|---|
| CPU 100% one core | Infinite loop, regex | top -H + jstack |
| High CPU, many GC threads | Heap near full | jstat -gcutil PID 1000 |
| High wa | Slow disk, too many logs | iostat -x |
| CLOSE_WAIT increasing | Not closing response/connection | ss, lsof -p PID |
| \"Too many open files\" | File descriptor leak | ls /proc/PID/fd, wc -l; ulimit -n |
| Process disappears | OOM killer | dmesg, journalctl -k |

### Common wrong answers
- \"Restart service first for speed\": loses all evidence. Capture thread dump, heap histogram ({{jcmd PID GC.class_histogram}}) and metrics first, restart after.
- \"Low free means out of RAM\": wrong, check available column.
- \"Delete large log files fixes it\": if process still holds file, space not released; must truncate ({{: > file}}) or restart process.

> Senior tip: Prepare a collection script (top, ss, df, 3 thread dumps 5 seconds apart, jstat) and run immediately when incident occurs; in banks SSH to prod usually requires approval per session, so every minute on server must collect maximum evidence. If running on Kubernetes, equivalents are kubectl top, kubectl exec, and jcmd inside container.`,
    follow: [
      'CLOSE_WAIT connections increase over time. Is the error on client or server side, and in Java code it is usually caused by what?',
      'Server reports \"No space left on device\" but df -h still has 30%. What do you check next?'
    ]
  },
  'devops-008': {
    q: 'Compare merge, rebase and squash when integrating a branch. When do you use cherry-pick? How does revert differ from reset, and which command is forbidden on a shared branch?',
    a: `**Summary:** Merge keeps full history and creates a merge commit; rebase rewrites your commits on top of target branch for a linear history; squash merges the entire branch into one commit. Cherry-pick copies a specific commit to another branch (often to bring a hotfix). Revert creates a new commit reversing changes, safe on shared branches; reset moves branch pointer and rewrites history, only use on local branches. Golden rule: never rebase, reset then force-push onto a branch others are using.

### Visualize
~~~text
Start:         main: A---B---C
                 feature:   \\---D---E

merge:           A---B---C-------M      (M has 2 parents: C and E)
                       \\---D---E---/

rebase then FF:   A---B---C---D'---E'    (D', E' are NEW commits, different hash)

squash merge:    A---B---C---S          (S contains changes from D+E)
~~~

### Why rebase is \"dangerous\"
A Git commit is identified by hash of content + parent. Rebase changes parent so creates new commits D', E'. If colleagues have pulled D, E and continued, after your force-push they have two copies of the same change, repeated conflicts and possibly lost code. Therefore only rebase your **own** branch, and when forced to force-push use {{git push --force-with-lease}} (refuses if remote has commits you have not seen).

### Comparison
| | Merge | Rebase | Squash |
|---|---|---|---|
| History | True, has branch | Straight, easy to read | One commit per feature |
| Rewrites commits | No | Yes | Yes (creates new commit) |
| Conflict | Solved once | May solve multiple times (each commit) | Once |
| git bisect | Works | Best | Commit too big, hard to isolate |
| Best for | Release branch, shared branch | Update feature branch from main | Small PR, messy draft commits |

### Cherry-pick
~~~bash
git switch release/2.4
git cherry-pick -x 9f3c2ab     # -x records \"cherry picked from commit ...\" for traceability
~~~
Use when you need to bring **one** fix from main to a release branch running prod without pulling unfinished features. Overusing cherry-pick makes two branches have the same change with different hashes, making later merge conflicts hard to track.

### Revert vs reset
~~~bash
git revert 9f3c2ab             # creates new commit reversing 9f3c2ab; push normally
git revert -m 1 <merge-commit> # revert a merge commit, keep parent 1 (main branch)

git reset --soft HEAD~1        # drop commit, keep changes in staging
git reset --mixed HEAD~1       # (default) keep changes in working dir
git reset --hard HEAD~1        # drop all changes, only when sure
git reflog                     # rescue \"lost\" commit after reset --hard (within reflog time)
~~~

| Command | Rewrites history | Use on shared branch |
|---|---|---|
| revert | No | Yes, standard way to undo on main |
| reset | Yes | No (unless whole team agrees) |

### Common wrong answers
- \"Rebase is always better than merge\": no, rebasing shared branches destroys others' history.
- \"Reset --hard then push -f to delete accidentally pushed password\": password stays in others' clones, CI cache. Must **rotate secret immediately\", history deletion is only a secondary step.
- \"Reverting merge then merging the branch again is enough\": Git considers those commits already merged, changes will not come back; must revert the revert.

> Senior tip: Most teams use rules: rebase to update personal branch, squash or merge when closing PR per repo standard, revert to undo on main, and enable branch protection banning force-push to main/release. Set {{git config --global pull.rebase true}} to avoid meaningless \"Merge branch main into main\" merge commits.`,
    follow: [
      'A merge commit has been reverted on main. Now you want to merge the feature again after fixing the bug, how?',
      'You accidentally committed a file containing DB password and pushed to GitLab. What are the steps in order?'
    ]
  },
  'devops-009': {
    q: 'You are tech lead of a core banking team: release every 2 weeks through CAB approval, but you must hotfix urgently when prod breaks. Do you choose Git Flow or trunk-based development, and how do you organize release/hotfix branches?',
    a: `**Summary:** Git Flow (develop, feature, release, hotfix, main) fits scheduled releases and multiple concurrent versions, but long-lived branches cause merge hell and slow response. Trunk-based (short branches under 1–2 days, continuous merge to main, hide unfinished features with feature flags) gives continuous integration and better quality. For banks the practical way is trunk-based + release branches cut from main for each CAB cycle, hotfix fixed on main then cherry-picked to the release branch running prod, every release tagged.

### Git Flow
~~~text
main     ----*------------------*------------*----   (tag v2.3.0, v2.3.1, v2.4.0)
hotfix          \\---h1----------/  (then merge to both main and develop)
release              \\--r1--r2--------------/
develop  --*--*--*--*--*--*--*--*--*--*---
feature     \\--f1--f2--/   \\--g1--g2--g3--/
~~~
- Pros: clearly separates \"in development\" and \"in prod\", fits packaged products, supports multiple versions.
- Cons: feature branches live 2–4 weeks, large conflicts at merge; hotfix must merge to **two** places (main and develop), forget and error returns in next release; develop is often \"red\" due to late integration.

### Trunk-based
~~~text
main  --*--*--*--*--*--*--*--*--*--*--   (CI green always, every commit releaseable)
          \\-/  \\-/      \\
       short PR (hours/days)  release/2.4 (cut for CAB, only accepts cherry-pick)
~~~
- Unfinished features still merged but **hidden with feature flags** (Unleash, Togglz, DB flag).
- Requirements: good automated tests, fast code review, CI under 10–15 minutes.

### Comparison
| Criteria | Git Flow | Trunk-based + release branch |
|---|---|---|
| Feature branch length | Weeks | Hours to 2 days |
| Merge conflict | Large, at sprint end | Small, continuous |
| Hotfix | Merge to main + develop | Fix on main, cherry-pick to release |
| Unfinished feature | Outside main branch | In main, off by flag |
| Technical requirements | Low | Auto tests, flags, fast CI |
| Best for | Multiple parallel versions, immature CI team | Microservices, frequent deploy |

### Proposed process for banks
1. Dev creates short branch from main, PR needs 2 approvals and green pipeline (unit, integration, SAST).
2. Code freeze day: cut {{release/2.4}} from main, build **one** artifact, deploy SIT then UAT. Main continues receiving code for next cycle.
3. UAT error: fix on main first, cherry-pick to release (fix-forward, do not fix directly on release to avoid forgetting to bring back to main).
4. CAB approves exactly the tested artifact (same digest), deploy prod, tag {{v2.4.0}}.
5. Hotfix prod: fix on main, cherry-pick into {{release/2.4}}, tag {{v2.4.1}}, go through emergency change approval (but still run full pipeline).

### Common wrong answers
- \"Banks must use Git Flow because of CAB\": CAB approves **release**, does not dictate branching strategy.
- \"Trunk-based is pushing straight to main without review\": wrong, still PR and review, just very short branches.
- \"Hotfix directly on release branch is enough\": next release repeats the error because main does not have the fix.

### Pitfalls when transitioning
- Feature flags not cleaned up: after months hundreds of flags, combinations untested. Each flag needs owner and removal deadline.
- DB migration runs with code still hidden by flag but active in reality: schema must be backward-compatible.
- Sudden switch when auto tests are weak makes main continuously red; increase test coverage first.

> Senior tip: Measure DORA metrics (lead time, deployment frequency, change failure rate, MTTR) before and after strategy change to convince management with numbers. For auditors, traceability is key: from ticket to commit, PR, pipeline, artifact digest and approval record; name branches and commits by ticket code (e.g. CORE-1234) to make this automatic.`,
    follow: [
      'How do feature flags affect testing and audit in banks?',
      'You have 3 versions running on 3 branches/customers. How does your branch strategy change?'
    ]
  }
});
