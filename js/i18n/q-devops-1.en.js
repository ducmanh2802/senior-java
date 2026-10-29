/*
 * English translation of js/data/q-devops.js — task T519 (re-translated after the Vietnamese rewrite).
 * Format: js/core/i18n.js (content overlay).
 * ids: devops-001 devops-002 devops-003 devops-004 devops-005 devops-006 devops-007 devops-008 devops-009
 */
App.i18n.content({

  'devops-001': {
    q: 'How would you write a Dockerfile for a Spring Boot 3 service so the image is small, builds fast when only code changes, and is safe to run in production?',
    a: `**Summary:** Use a multi-stage build: a JDK stage to build and split the layered jar, and a runtime stage with only the JRE. Copy layers starting with the ones that change least (dependencies, loader, snapshot, application) so the Docker cache can reuse them, run as a non-root user, use an exec-form ENTRYPOINT so the JVM receives SIGTERM directly, and set {{-XX:MaxRAMPercentage}} instead of a hard-coded Xmx.

### Quick understanding
A Dockerfile is like a recipe with many steps; each step produces a layer, stacked like the tiers of a cake. Docker remembers the layers it has already built (the cache): if you only change the top layer, the lower layers are reused instead of rebuilt. Third-party libraries are about 95% of the jar size and rarely change, so they belong at the bottom; your code changes every day, so it belongs on top. A multi-stage build is like cooking in a big kitchen but carrying only the lunch box to the table: the final image does not bring the "pots and pans" — the JDK, Maven and the source code.

### Terms
- **Image**: a read-only package holding a minimal OS, the JRE and the application; a container is one run of an image.
- **Layer**: one filesystem change produced by a command such as COPY or RUN, identified by a digest.
- **Build cache**: Docker reuses a layer when the command and its inputs are unchanged; if one layer changes, every layer after it must be rebuilt.
- **Multi-stage build**: several {{FROM}} instructions in one Dockerfile; later stages copy only the needed outputs from earlier stages.
- **Layered jar**: a Spring Boot jar with a {{layers.idx}} file that describes how to split it into the dependencies, loader, snapshot and application layers.
- **BuildKit**: Docker's modern build engine; it supports {{RUN --mount=type=cache}} and {{--mount=type=secret}}.
- **Exec form**: an ENTRYPOINT written as a JSON array, so the java process runs directly as PID 1 and receives the SIGTERM signal.
- **Distroless**: a base image that contains only the runtime, with no shell or package manager; it reduces the attack surface but is harder to debug.

### Why not just copy the whole app.jar
A fat jar of 80–150 MB is about 95% third-party libraries; only a few hundred KB is your code. If you copy the whole jar as **one layer**, every time you change a single line of code that 120 MB layer gets a new digest, and the registry has to store and the node has to pull the whole thing again. Docker caches per layer: when one layer changes, **every later layer** must be rebuilt too. That is why the part that rarely changes (dependencies) must be copied first and the part that changes constantly (your classes) must be copied last.

Spring Boot already packs a {{layers.idx}} file inside the jar. From Boot 3.3 on, use {{-Djarmode=tools}} to extract it (the old {{-Djarmode=layertools}} is deprecated). The four default layers are {{dependencies}}, {{spring-boot-loader}}, {{snapshot-dependencies}} and {{application}}.

### Example
~~~text
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
# BuildKit cache for the .m2 directory: a new pom downloads dependencies again
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q package -DskipTests
# Split the jar into layer directories + launcher
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /out

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
# Copy what changes least first
COPY --from=build /out/dependencies/ ./
COPY --from=build /out/spring-boot-loader/ ./
COPY --from=build /out/snapshot-dependencies/ ./
COPY --from=build /out/application/ ./
USER 10001
# Exec form: java is PID 1 and receives SIGTERM directly
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
~~~

### Each decision and why
| Decision | Reason |
|---|---|
| Multi-stage | The final image contains no JDK, Maven or source code: hundreds of MB smaller, fewer CVEs |
| JRE base (or distroless/jlink) | Fewer extra tools, smaller attack surface |
| Copy the pom before src | Changing code does not invalidate the dependency download cache |
| Non-root USER with a numeric UID | Container escape is less dangerous; Kubernetes {{runAsNonRoot}} can check a numeric UID |
| Exec-form ENTRYPOINT | Shell form wraps java in {{/bin/sh -c}}; sh does not forward SIGTERM, so graceful shutdown never runs and the pod gets SIGKILL after the grace period |
| MaxRAMPercentage | The heap scales automatically with the container memory limit |

### Common wrong answers
- "Use the {{latest}} tag for the base image": the build is no longer reproducible. Pin the version, and ideally the digest as well.
- "Run {{mvn package}} on your machine and COPY the jar in": it works, but every machine has a different build environment; CI should build inside a standard stage.
- "Set {{-Xmx}} exactly equal to the memory limit": it ignores metaspace, thread stacks, code cache and direct buffers, so OOMKilled is easy to hit.

### Common pitfalls
- Forgetting {{.dockerignore}}: the {{target}} directory and {{.git}} are sent into the build context, builds get slow, and secrets can leak.
- Putting secrets in {{ARG}}/{{ENV}}: they live forever in the image history. Use {{RUN --mount=type=secret}} from BuildKit instead.
- Alpine (musl) with some native libs (Netty tcnative, fonts for PDF reports) causes hard-to-predict failures; an Ubuntu/Debian-based image is safer.

### One-minute spoken answer
"I use a multi-stage build: the first stage has the JDK to build with the Maven wrapper and split the layered jar using {{-Djarmode=tools}}, and the final stage has only the JRE. The reason is that Docker caches by layer: I copy the pom first, download dependencies with a BuildKit cache mount, and only then copy the sources; in the final image I copy the layers in the order dependencies, loader, snapshot, application, so a code change only changes a layer of a few hundred KB. For safety I run a non-root user with a numeric UID, use an exec-form ENTRYPOINT so java is PID 1 and receives SIGTERM so graceful shutdown actually runs, set MaxRAMPercentage instead of a hard-coded Xmx, pin the base image by version or digest, and pass credentials through a BuildKit secret instead of ARG. The trade-off: Alpine is small but musl often breaks with native libs, while distroless is safer but has no shell for debugging. In practice, after splitting the layers each deploy pushes only a few hundred KB instead of more than a hundred MB."

> Senior tip: Measure with {{docker history}} or the dive tool: after splitting the layers, a commit that changes code usually pushes only the application layer of a few hundred KB instead of hundreds of MB. With 50 services and 20 deploys per day, registry and node pull times drop noticeably. You can also use Buildpacks ({{spring-boot:build-image}}) if the team does not want to maintain a Dockerfile itself.`,
    follow: [
      'What are the pros and cons of Distroless or a jlink custom runtime compared with a regular JRE image?',
      'How do you pass Nexus credentials into the build step without leaving them in the image?',
      'How does CDS/AOT cache help startup time and how do you include it in the Dockerfile?'
    ]
  },

  'devops-002': {
    q: 'How is a container different from a VM? Why does running a Java app in a container require particular attention to CPU and RAM limits, and how do you configure the JVM?',
    a: `**Summary:** A VM virtualizes hardware and has its own kernel; a container is just a process on the host that shares the kernel, is isolated by namespaces and limited by cgroups. The JVM must read the correct cgroup limits to choose the heap size, the number of GC threads and thread pools; if it is configured wrong the app gets OOMKilled or CPU-throttled even though the host machine still has spare resources.

### Quick understanding
A VM is like a private house: its own foundation, plumbing and electricity (its own kernel and operating system), so isolation is good but it costs resources. A container is like an apartment in a shared building: it uses the building's foundation and electrical system (the host kernel), each apartment has its own lock (namespace) and there is a metered electricity meter (cgroup). The JVM is like a tenant measuring the area to buy furniture: if it measures the whole building instead of the apartment, it buys too much furniture (a heap that is too large) and gets evicted (OOMKilled). That is why the JVM must read the correct cgroup limit and you must configure the heap and the CPU count to match.

### Terms
- **Kernel**: the core of the operating system that manages CPU, memory and devices; every container on a host shares one kernel.
- **Namespace**: a Linux mechanism that isolates what a process can see (PID, network, mount, hostname, user).
- **cgroup**: a Linux mechanism that limits the resources a process may use; cgroup v2 exposes the files {{memory.max}} and {{cpu.max}}.
- **OverlayFS**: a filesystem that stacks the read-only layers of an image and a thin writable layer for the container.
- **Ergonomics**: the JVM mechanism that picks the heap, the GC and thread counts based on the number of CPUs and the RAM it sees.
- **OOM killer**: the kernel component that kills a process when its cgroup exceeds the memory limit; the container exits with exit code 137.
- **CFS throttling**: when a container uses up its CPU quota within a 100 ms period, the kernel pauses it until the next period.
- **RSS**: the real RAM a process occupies, including heap, metaspace, thread stacks, code cache and native memory.

### Container from the kernel's point of view
- **Namespaces** (pid, net, mnt, uts, ipc, user) decide what the process **sees**: its own PID 1, its own network, its own filesystem.
- **cgroups** decide how much the process **may use**: memory.max, cpu.max (cgroup v2).
- **An image** is a stack of read-only layers (overlayfs); a container adds a thin writable layer on top. Many containers share the same layers, which saves disk and makes startup fast.

| | VM | Container |
|---|---|---|
| Kernel | Its own, per VM | Shares the host kernel |
| Startup | Tens of seconds to minutes | Milliseconds (plus app time) |
| Isolation | Strong (hypervisor) | Weaker; a kernel vulnerability affects every container |
| Overhead | GB of RAM per guest OS | Almost none |
| Good fit | Multi-tenant with no mutual trust, different OSes | Packaging and scaling microservices |

### Why Java is especially sensitive
The JVM picks its configuration based on the "machine" it sees (ergonomics). Before JDK 10, the JVM read {{/proc/meminfo}} and saw the **host** RAM (say 64 GB), so the default heap was 1/4 = 16 GB while the container only had 2 GB, and the kernel OOM killer shot the process (exit code 137) with no OutOfMemoryError in the logs.

From JDK 10 on (backported to 8u191), {{-XX:+UseContainerSupport}} is on by default; cgroup v2 support arrived in JDK 15 and was backported to 11.0.16 and 8u372. Even so, the defaults still have traps:
- **The default heap is only 25%** of the memory limit ({{MaxRAMPercentage=25}}). A 2 GB pod gets only a 512 MB heap, wasting resources.
- **Memory is not only the heap**: metaspace, code cache, thread stacks (~1 MB per thread, so ~300 MB for 300 threads), Netty direct buffers, GC overhead. That is why people usually set 70–75%, never 100%.
- **CPU**: the JVM computes {{availableProcessors}} from the CPU **limit** (quota). If the limit is 1 CPU, the JVM treats the machine as not server-class and picks **SerialGC**, and the common ForkJoinPool and many thread pools get only 1 thread.
- **CPU throttling**: the CFS quota is computed over 100 ms periods. With a 1 CPU limit and 8 threads running in parallel, the app burns the quota in ~12 ms and is then frozen for ~88 ms. The symptom is p99 latency spikes while average CPU is only 40%.

### Recommended configuration
~~~bash
# Check what the JVM sees inside the container
java -XshowSettings:system -version
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|UseSerialGC|UseG1GC"

# The flags you actually run with
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=2"
~~~
- Memory: set request = limit for critical services (avoids eviction, easier to predict).
- CPU: many teams drop the CPU limit (set only a request) to avoid throttling; in that case set {{-XX:ActiveProcessorCount}} so thread pools do not grow with the number of node cores.

### Common wrong answers
- "A container is a lightweight VM": wrong in principle, a container is a process.
- "The JVM does not know it runs in a container": true for old JDK 8, false for JDK 17/21.
- "Setting Xmx = limit is safe": wrong, the non-heap parts will exceed the limit.

### Common pitfalls
1. **The pod is OOMKilled (exit 137) but the log has no OutOfMemoryError**: the heap was set too close to the limit, so the non-heap parts push RSS over the limit. How to avoid: keep the heap at 70–75% of the limit, watch RSS, and use NativeMemoryTracking when you suspect a native leak.
2. **A 500m or 1 CPU limit for an online Java service**: the JVM sees 1 CPU, picks SerialGC, many pools have only 1 thread, and p99 rises sharply once load increases. How to avoid: at least 2 CPUs for latency-sensitive services and verify with {{-XshowSettings:system}}.
3. **An old JDK on a cgroup v2 node**: JDK 8 before 8u372 or JDK 11 before 11.0.16 cannot read cgroup v2, so the heap is computed from the host RAM again. How to avoid: upgrade to a patched JDK, preferably 17/21.

### One-minute spoken answer
"A container is not a lightweight VM: a VM has its own kernel running on a hypervisor, while a container is just a process on the host that shares the kernel, is isolated by namespaces and limited by cgroups. So containers start fast and cost almost no overhead, but they isolate less than VMs. For Java the issue is that the JVM picks the heap, the GC and the thread counts from the 'machine' it sees. JDK 17/21 can read cgroups, but the default heap is only 25% of the limit, and if the CPU limit is 1 the JVM picks SerialGC. I usually set MaxRAMPercentage around 75 to leave room for metaspace, thread stacks and direct buffers; I make the memory request equal to the limit; and I watch out for CPU throttling because the CFS quota is computed over 100 ms periods. My experience: when p99 rises while average CPU is low, look at the throttling metric before suspecting the code."

> Senior tip: When a pod is OOMKilled and the heap dump is empty, compare the process RSS with the limit and enable {{-XX:NativeMemoryTracking=summary}} then {{jcmd 1 VM.native_memory summary}} to see the parts outside the heap. When p99 rises while CPU is low, check the {{container_cpu_cfs_throttled_periods_total}} metric: this is a very common cause on bank clusters that set a 500m limit for Java services.`,
    follow: [
      'The pod is OOMKilled but heap usage is only 60%. How do you investigate the remaining memory?',
      'Should you drop CPU limits for Java services? What is the risk for other pods on the same node?'
    ]
  },

  'devops-003': {
    q: 'A user calls https://api.bank.vn/accounts/123 and reaches a service running on Kubernetes. Describe which components the request passes through (Pod, Deployment, Service, Ingress, ConfigMap, Secret) and the role of each.',
    a: `**Summary:** DNS points to the load balancer in front of the Ingress controller; the Ingress controller reads the Ingress rules (host + path) to pick a Service; the Service is a stable address that selects the Ready Pods through a label selector (the EndpointSlice list); kube-proxy or an eBPF dataplane forwards the packet to the IP of one Pod. The Deployment is not on the request path: it only guarantees that enough Pods of the right version exist. ConfigMap and Secret supply configuration to the Pod at startup.

### Quick understanding
Imagine sending a document to a department in a big building. DNS is the building address, the load balancer is the main gate, and Ingress is the reception desk that reads the room name on the envelope (host, path) and points the way. The Service is the department's fixed extension number: the staff may change but the extension stays the same. The Pod is the employee who actually processes the document. The Deployment is like HR: it receives no documents but always keeps the department staffed, with the right version; ConfigMap and Secret are the handbook and the password safe handed to employees when they join.

### Terms
- **Pod**: the smallest runnable unit in Kubernetes, one or more containers that share an IP and a network namespace.
- **ReplicaSet**: the controller that keeps the right number of Pods for one version; the Deployment creates and replaces ReplicaSets during a rolling update.
- **Label selector**: a condition that selects objects by label, for example {{app=account}}, instead of listing every Pod name.
- **EndpointSlice**: the list of IP:port entries of the Ready Pods behind a Service, updated automatically by the control plane.
- **kube-proxy**: the component on each node that writes iptables/IPVS rules to forward packets addressed to a Service to a Pod IP.
- **Ingress controller**: an L7 proxy Pod (nginx, HAProxy, Traefik...) that reads the Ingress rules and routes traffic from outside into the cluster.
- **ClusterIP**: the virtual IP of a Service, reachable only from inside the cluster.
- **Readiness probe**: a periodic check; a Pod is added to the EndpointSlice only when this probe succeeds.

### Request path
~~~text
Client
  -> DNS api.bank.vn  -> Load Balancer IP (cloud LB / F5 / MetalLB)
  -> Ingress controller (nginx, HAProxy, Traefik...) running as a Pod
       match rule: host api.bank.vn, path /accounts -> Service account-svc:80
  -> Service account-svc (ClusterIP 10.96.12.34, port 80 -> targetPort 8080)
       selector app=account  -> EndpointSlice: 10.244.1.15, 10.244.2.7 (Ready Pods only)
  -> kube-proxy (iptables/IPVS) or eBPF (Cilium) DNAT to one Pod IP
  -> Spring Boot container listening on 8080
~~~

### Role of each component
| Component | What it is | Why it is needed |
|---|---|---|
| Pod | The smallest runnable unit, one or more containers sharing a network namespace and an IP | A Pod is "ephemeral": when it dies, a new Pod is born with a new IP |
| Deployment | A declaration of desired state (image, replica count) that manages ReplicaSets | Replaces dead Pods automatically, rolling update, rollback |
| Service | A stable DNS name + virtual IP in front of a group of Pods | The client does not have to track Pod IPs that keep changing |
| Ingress | An L7 rule (host, path, TLS) for traffic from outside | One LB serves many services instead of one LB per service |
| ConfigMap | Non-sensitive configuration (URL, feature flag) | Configuration is separated from the image: one image runs in every environment |
| Secret | DB password, API key, certificate | Separate access control (RBAC), can be encrypted at rest in etcd |

### Why Service uses a label selector instead of a list of Pods
Pods are created and deleted all the time when scaling or deploying. A Service only declares "all Pods with the label app=account"; the control plane updates the EndpointSlice by itself. Only Pods that pass the **readiness probe** are added to the list, which is why readiness matters during deploys.

### Service types
- **ClusterIP** (default): reachable only inside the cluster, used for service-to-service calls ({{http://account-svc.payment.svc.cluster.local}}).
- **NodePort**: opens a port in 30000–32767 on every node, often used on-prem when an external LB points at the nodes.
- **LoadBalancer**: the cloud creates a dedicated LB for the Service.

### How ConfigMap and Secret get into a Pod
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
Environment variables are read only when the container starts: changing the ConfigMap **does not** make the app see the new values until the Pod restarts. A volume mount does update the file after a delay (unless subPath is used), but the app still has to reload itself.

### Common wrong answers
- "The request goes through the Deployment": wrong, the Deployment is only a controller.
- "Secrets are encrypted": by default they are only base64; you must enable encryption at rest and restrict RBAC.
- "A Service is a proxy process": with kube-proxy iptables a Service is only a NAT rule on each node; no process receives the packets.

### Common pitfalls
- Ingress-nginx by default sends traffic straight to the Pod IP taken from the endpoint, bypassing the ClusterIP; that is why retry/timeout settings on the Ingress affect each Pod directly.
- A typo in the selector label: the Service has 0 endpoints and the Ingress returns 503. Check with {{kubectl get endpointslices -l kubernetes.io/service-name=account-svc}}.
- Still running ingress-nginx after Kubernetes retired the project (no maintenance since March 2026): there are no more security patches for the component sitting right at the front door. Plan a move to Gateway API or another maintained controller.

### One-minute spoken answer
"The request follows a chain: the DNS name api.bank.vn points to a load balancer, which forwards into the Ingress controller. The Ingress controller reads the Ingress rule by host and path to pick the Service account-svc. The Service is a stable DNS name and virtual IP; it selects Pods through a label selector, and only Pods that pass the readiness probe are in the EndpointSlice. kube-proxy or eBPF forwards the packet to the IP of one Pod, where Spring Boot listens on port 8080. The Deployment is not on the request path; it only keeps enough Pods of the right version and handles rolling updates. ConfigMap and Secret provide configuration to the Pod at startup; note that Secrets are only base64 by default, so they need encryption at rest and RBAC. When debugging 'the call does not arrive', I go from the inside out: port-forward into the Pod, curl the Service from another Pod, and only then look at the Ingress."

> Senior tip: When debugging "calls do not arrive", walk segment by segment from the inside out: {{kubectl port-forward}} into the Pod, then curl the Service from another Pod, and only then go to the Ingress. Also, Kubernetes is encouraging a move from Ingress to the **Gateway API** (HTTPRoute) because Ingress lacks standards for header routing and traffic splitting; worth knowing when you get asked about trends.`,
    follow: [
      'If the readiness probe fails, how are requests routed to that Pod handled?',
      'You changed the ConfigMap — how do the Pods receive the new configuration in a controlled way?',
      'What is a Headless Service and when is it needed (for example StatefulSet, Kafka)?'
    ]
  },

  'devops-004': {
    q: 'Every time you deploy the payment service on Kubernetes, monitoring records a few dozen 502/503 errors. How do you configure rolling update, probes and graceful shutdown so the deploy drops no requests?',
    a: `**Summary:** Errors come from two ends: a new Pod receives traffic before it is ready, and an old Pod is shut down while it is still being routed to or still processing a request. The fix: a real readiness probe (warmed up, DB connected), maxUnavailable 0 with a sensible maxSurge, a preStop sleep of a few seconds so the endpoint is removed from every proxy, Spring Boot graceful shutdown, and a terminationGracePeriodSeconds that is large enough.

### Quick understanding
Think of a shift change at a bank teller counter. The new teller must sit at the counter and be ready (readiness) before the old teller may leave (maxUnavailable 0). Before leaving, the old teller puts up a "paused" sign and waits a few seconds so the guard stops guiding customers over (preStop sleep), then serves the customers already seated (graceful shutdown); once the allowed time is up, the manager shows them out immediately (SIGKILL). Miss any step and a few customers are left mid-transaction, which is exactly the 502/503 errors you see during a deploy.

### Terms
- **maxSurge / maxUnavailable**: how many Pods may be created on top of the replicas and how many Pods may be missing compared with the replicas during a rolling update.
- **minReadySeconds**: how many seconds a Pod must stay Ready before it counts as available.
- **preStop hook**: a command kubelet runs before sending SIGTERM to the container.
- **SIGTERM / SIGKILL**: a signal asking the app to shut down politely (it gets to clean up) and a signal that kills it immediately (no cleanup possible).
- **terminationGracePeriodSeconds**: the maximum total time from the moment the Pod starts terminating until it is SIGKILLed; 30 seconds by default.
- **EndpointSlice**: the list of Pods that receive traffic for a Service; a terminating Pod is removed from it, but spreading that change to every proxy takes a few seconds.
- **Graceful shutdown**: Spring Boot stops accepting new requests and waits for the running ones to finish before closing the context.

### How rolling update works
The Deployment creates a new ReplicaSet and gradually increases its replicas while decreasing the old ReplicaSet:
- {{maxSurge}} (25% by default): how many extra Pods may be created compared with the replicas.
- {{maxUnavailable}} (25% by default): how many ready Pods may be missing.
With 4 replicas, set maxSurge 1 and maxUnavailable 0: there are always ≥ 4 Ready Pods, one new Pod is added at a time, and an old Pod is deleted only after the new one is Ready. A Pod counts as "available" only when it is Ready and has passed {{minReadySeconds}}.

### Why requests still drop when the old Pod is deleted
When a Pod is deleted, two things happen **in parallel**, with no ordering:
1. Kubelet runs the preStop hook and then sends SIGTERM to the container.
2. The control plane removes the Pod from the EndpointSlice, and only then do kube-proxy on every node and the Ingress controller update their rules.
If the app receives SIGTERM and closes the port immediately while step 2 has not reached every proxy yet, new requests are still sent to it and come back as connection refused or 502. That is why you need a **preStop sleep** of a few seconds to "wait for the network to forget you" before starting the shutdown.

~~~text
t=0   Pod marked Terminating -> endpoint removal starts (spreads gradually)
t=0   preStop: sleep 10              -> app keeps serving normally
t=10  SIGTERM -> Spring graceful: stop accepting new requests, wait for running ones
t=10..40  in-flight requests finish, DB pool closed, Kafka consumer commits offset
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
              exec: { command: ["sh", "-c", "sleep 10"] }  # distroless image: use the sleep action built into K8s
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
On the Spring Boot side: {{server.shutdown=graceful}} (the default since Boot 3.4) and {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.

### Readiness vs liveness vs startup
| Probe | What happens if it fails | What it should check |
|---|---|---|
| startup | liveness/readiness are not running yet; failing past the threshold restarts the container | The app has finished starting |
| readiness | Removed from the Service, **not** restarted | It can serve requests (warm-up done, pool ready) |
| liveness | Restarts the container | The app is stuck and cannot recover (deadlock) |

### Common wrong answers
- "Let liveness check the DB": a 30-second DB slowdown restarts every Pod at once, turning a small incident into an outage.
- "Rolling update is automatically zero-downtime": only true when probes and shutdown are configured correctly.
- "Raising terminationGracePeriodSeconds is enough": without preStop you still get errors in the first seconds.

### Rollback
{{kubectl rollout status deploy/payment}} waits for the result; {{kubectl rollout undo deploy/payment}} goes back to the previous revision (it keeps {{revisionHistoryLimit}}, 10 by default). If a new Pod never becomes Ready, the rollout stops and reports an error after {{progressDeadlineSeconds}} (600s by default) but **does not roll back automatically**; the pipeline must call undo itself or use Argo Rollouts.

### Common pitfalls
1. **No preStop**: in the first seconds after SIGTERM you get 502s or connection refused because the Ingress and kube-proxy have not removed the Pod yet. How to avoid: a preStop sleep of 5–10 seconds (if the image has no shell, use the Kubernetes sleep action or an httpGet call).
2. **The grace period is smaller than preStop plus the Spring shutdown time**: the Pod gets SIGKILL and in-flight requests are cut. How to avoid: set terminationGracePeriodSeconds larger than preStop + timeout-per-shutdown-phase + a buffer.
3. **Readiness reports Ready too early** (it only checks that the port is open): the new Pod receives traffic while the DB pool is not ready, so the first requests fail or are very slow. How to avoid: use {{/actuator/health/readiness}} and warm up before reporting Ready.
4. **Shell-form ENTRYPOINT**: java never receives SIGTERM, graceful shutdown does not run and the Pod is always SIGKILLed. How to avoid: use exec form.

### One-minute spoken answer
"502/503 errors during a deploy come from two ends: a new Pod receives traffic before it is ready, and an old Pod is shut down while it is still being routed to. For new Pods I use a real readiness probe on {{/actuator/health/readiness}}, a startupProbe for slow-starting apps, and a rolling update with maxUnavailable 0 and maxSurge 1 so there are always enough Ready Pods. For old Pods, removing the endpoint and sending SIGTERM run in parallel, so I add a preStop sleep of about 10 seconds so every proxy forgets the Pod, enable Spring graceful shutdown with a 30-second timeout, and set terminationGracePeriodSeconds larger than the sum of both. The trade-off is a slightly slower deploy and one extra Pod during the rollout. To prove it, I run a continuous load test during the deploy on staging and require zero errors; the DB schema must also be backward compatible because two versions run side by side."

> Senior tip: DB schema changes must be backward compatible (expand-contract) because old and new versions run in parallel during a rolling update. Prove zero downtime by running k6/JMeter continuously during the deploy on staging and requiring zero errors; for a payment service this should be a step in the release checklist.`,
    follow: [
      'What should a Kafka consumer in a Pod that is shutting down do to avoid processing messages twice or losing them?',
      'When do you choose blue-green or canary instead of a rolling update?',
      'Should the readiness probe check the DB? What is the trade-off?'
    ]
  },

  'devops-005': {
    q: 'After a deploy, your Pod lands in one of CrashLoopBackOff, ImagePullBackOff, Pending or OOMKilled. Which diagnostic steps do you follow for each case?',
    a: `**Summary:** Always start with {{kubectl get pod}} to see the status, {{kubectl describe pod}} to read the Events and Last State, then {{kubectl logs --previous}} to see the log of the run that just died. Pending is a scheduling problem (resources, taints, PVC); ImagePullBackOff is a registry/tag/credential problem; CrashLoopBackOff means the app starts and then dies; OOMKilled means the memory limit was exceeded and the kernel killed the process with exit code 137.

### Quick understanding
Diagnosing a Pod is like a doctor examining a patient in order: ask about the symptoms ({{kubectl get pod}}), read the medical record ({{kubectl describe}}: Events, Last State, Exit Code), then look at the tests from the previous flare-up ({{kubectl logs --previous}}). Each state points to the "organ" that has the problem: Pending means no bed was found (node), ImagePullBackOff means the medicine could not be fetched (image), CrashLoopBackOff means the patient woke up and fainted again (the app starts and then dies), OOMKilled means eating beyond the ration (exceeding the memory limit).

### Terms
- **Scheduler**: the component that picks a node for a Pod based on the free total request, taints, affinity and volumes.
- **Request / limit**: a request is the resource reserved for scheduling; a limit is the maximum the container may use.
- **Taint / toleration**: a node marks itself as "rejecting Pods"; only Pods with a matching toleration are placed there.
- **PVC (PersistentVolumeClaim)**: a Pod's request for a disk; while the PVC is unbound the Pod stays Pending.
- **imagePullSecrets**: the credentials kubelet uses to log in to a private registry when pulling an image.
- **Back-off**: kubelet waits progressively longer (10s, 20s, 40s... up to 5 minutes) between restarts or failed image pulls.
- **Exit code 137 / 143**: 128 + the signal number; 137 is SIGKILL (OOM or killed), 143 is SIGTERM (normal shutdown).
- **Ephemeral container**: a debug container attached temporarily to a running Pod with {{kubectl debug}}, useful with distroless images.

### General procedure
~~~bash
kubectl get pod -n payment -o wide                 # STATUS, RESTARTS, NODE
kubectl describe pod payment-7d9f-abcde -n payment # Events at the end of the output, Last State, Exit Code
kubectl logs payment-7d9f-abcde -n payment --previous   # log of the container that died
kubectl get events -n payment --sort-by=.lastTimestamp
kubectl top pod -n payment                          # requires metrics-server
~~~

### Each state
| State | Meaning | Common causes | Evidence |
|---|---|---|---|
| Pending | Not yet placed on a node | No node has enough CPU/RAM by **request**; missing toleration for a taint; wrong nodeSelector/affinity; PVC not bound | Event {{FailedScheduling}}: "0/6 nodes are available: 3 Insufficient memory..." |
| ImagePullBackOff / ErrImagePull | Kubelet cannot pull the image | Wrong tag, image not pushed, missing imagePullSecrets, internal registry certificate expired or node cannot reach the registry | Failed event: "manifest unknown", "unauthorized", "x509" |
| CrashLoopBackOff | The container runs then exits repeatedly, and kubelet waits longer and longer before restarting (10s, 20s, 40s... up to 5 minutes) | Spring configuration error (missing property, wrong DB URL), failing Flyway migration, liveness probe killing a slow-starting app | Last State: Terminated, Exit Code 1; the --previous log has the stack trace |
| OOMKilled | The kernel kills the process for exceeding the memory limit | Heap too close to the limit, native memory, too many threads | Last State: Terminated, Reason: OOMKilled, Exit Code: 137 |
| CreateContainerConfigError | The container cannot be created | Missing ConfigMap/Secret or a referenced key | Event: "secret ... not found" |

### Reading exit codes
- **1**: the app exits on its own due to an exception (Spring {{APPLICATION FAILED TO START}}).
- **137** = 128 + 9 (SIGKILL): OOMKilled or killed because the grace period ran out / liveness failed. Tell them apart with the Reason field.
- **143** = 128 + 15 (SIGTERM): shut down normally.

### CrashLoopBackOff: two common traps
1. **Liveness kills a slow-starting app**: the Spring app needs 90 seconds, but liveness starts after 30 seconds with failureThreshold 3, so the app restarts forever. The log has no error; Events say "Liveness probe failed". Fix with startupProbe.
2. **Empty log**: the app dies before it can write a log (wrong ENTRYPOINT, missing main class, an arm64/amd64 architecture mismatch reports "exec format error"). Read Events and try the image locally with {{docker run}}.

### OOMKilled vs OutOfMemoryError
| | OOMKilled | java.lang.OutOfMemoryError |
|---|---|---|
| Who detects it | The kernel (cgroup) | The JVM |
| Stack trace | No | Yes (and a heap dump if enabled) |
| Cause | Total RSS > limit | Heap/metaspace full |
| Fix | Lower MaxRAMPercentage, raise the limit, check native memory | Find the leak, increase the heap |

### Common wrong answers
- "Delete the Pod so it is recreated": the new Pod fails exactly the same way because the cause is in the spec.
- "CrashLoopBackOff is a Kubernetes bug": no, it is almost always an app or configuration problem.
- "Pending because the node is out of real RAM": the scheduler looks at total **request**, not actual usage.

### Common pitfalls
1. **Running kubectl logs without --previous during CrashLoopBackOff**: you see the almost empty log of the container that was just restarted. How to avoid: always add {{--previous}} to read the log of the run that died.
2. **Raising the memory limit on every OOMKilled without finding the cause**: a native memory leak or a growing thread count just makes the Pod die more slowly. How to avoid: compare RSS with the heap, enable NativeMemoryTracking, count threads.
3. **A request larger than any node can offer** (for example 8 CPU requested on a 4 CPU node): the Pod stays Pending forever. How to avoid: set requests from real measurements and read the FailedScheduling event.
4. **An image built on an Apple-silicon Mac (arm64) running on an amd64 node**: the container dies immediately with "exec format error". How to avoid: build with {{docker buildx --platform linux/amd64}} or publish a multi-arch image.

### One-minute spoken answer
"I always go through three commands: get pod to see the status and the restart count, describe pod to read Events, Last State and Exit Code, then logs --previous to read the log of the run that just died. Pending is a scheduling problem: no node has enough request, a toleration is missing, affinity is wrong or the PVC is unbound; note that the scheduler looks at requests, not actual usage. ImagePullBackOff means a wrong tag, missing imagePullSecrets or an expired registry certificate. CrashLoopBackOff is almost always an app or configuration bug, such as a missing property, a failing Flyway migration or liveness killing a slow-starting app. OOMKilled is the kernel killing the process because RSS exceeded the limit, which is different from a JVM OutOfMemoryError, so I re-check MaxRAMPercentage and native memory. My experience: deleting the Pod does not fix anything because the cause is in the spec; I set alerts on the restart count and the OOMKilled reason."

> Senior tip: Alert on {{kube_pod_container_status_restarts_total}} increasing and on the OOMKilled reason instead of waiting for users to report. In banks, an ImagePullBackOff at 2 AM is usually an expired certificate on the internal Harbor or a rotated robot account: put certificate expiry dates and token rotation into the operations checklist.`,
    follow: [
      'How do you debug a distroless container stuck in CrashLoopBackOff when there is no shell? (hint: kubectl debug, ephemeral container)',
      'A Pod is Pending due to Insufficient cpu while the node uses only 20% of its actual CPU. How do you explain and handle this?'
    ]
  },

  'devops-006': {
    q: 'How do you configure HPA for a Java service: scale on CPU or on a custom metric such as RPS or Kafka lag? Why do Java apps usually scale slowly, and how do you handle that?',
    a: `**Summary:** HPA periodically (every 15 seconds by default) computes replicas = ceil(current replicas × metric value / target). CPU is easy to use but is an indirect signal; for Kafka consumers or APIs that depend on I/O you should scale on a metric close to the real load (lag, RPS, queue length) through the Prometheus Adapter or KEDA. Java scales slowly because the JVM takes long to start and JIT warm-up makes CPU spike in new Pods; handle it with startupProbe, a large enough minReplicas, fast scaleUp / slow scaleDown policies and a shorter startup time (CDS, AOT cache).

### Quick understanding
HPA is like a supermarket manager watching the situation to open more checkout lanes. If the manager only looks at "are the cashiers' hands busy" (CPU), there are moments when a cashier is waiting for the card terminal to respond (I/O) and looks idle even though the queue is long; that is why for services waiting on a DB or HTTP you should look directly at the queue length (RPS, Kafka lag). A new Java cashier needs 1–2 minutes to start the register and get up to speed (Spring startup, JIT warm-up), so you open lanes before the peak instead of waiting for a long queue before calling people in.

### Terms
- **HPA (HorizontalPodAutoscaler)**: the controller that grows or shrinks the replica count based on metrics, evaluating every 15 seconds by default.
- **metrics-server**: the component that provides Pod CPU/RAM to HPA and {{kubectl top}}.
- **Utilization**: the CPU percentage computed against the container request, not the limit.
- **Stabilization window**: the look-back period HPA uses to avoid scaling up and down constantly (300 seconds by default when scaling down).
- **Custom / External metric**: a metric other than CPU/RAM, such as RPS or queue depth, fetched through the Prometheus Adapter or KEDA.
- **KEDA**: an autoscaling extension project with many ready-made scalers (Kafka, cron...), able to scale to 0; underneath it still creates an HPA.
- **Consumer lag**: the number of messages in a Kafka topic that the consumer group has not processed yet.
- **JIT warm-up**: the early phase when the JVM runs code in the interpreter/C1 before C2 compiles optimized code; CPU is high and latency is worse.

### Formula and consequences
~~~text
desired = ceil(current * currentMetric / target)
Example: 4 Pods, average CPU 90% of request, target 60%
desired = ceil(4 * 90 / 60) = 6
~~~
- The CPU percentage is computed **against the request**, not the limit. Without a CPU request, CPU-based HPA does not work.
- There is a default 10% tolerance: small differences do not trigger scaling, to avoid oscillation.
- Scale down has a default stabilization window of 300 seconds.

### CPU or custom metric
| Metric | Good for | Limitation |
|---|---|---|
| CPU | Services doing heavy computation, encryption or serialization | Services waiting on a DB/HTTP: latency rises while CPU stays low, so HPA does not react |
| Memory | Rarely a good fit for Java | The JVM heap seldom shrinks after GC, so it only scales up, never down |
| RPS / concurrent requests | API gateways, I/O-bound services | Needs Prometheus + an adapter, and you must know the capacity of one Pod |
| Kafka lag | Consumers | When replicas exceed the partition count, the extra Pods sit idle |

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
      policies: [ { type: Percent, value: 100, periodSeconds: 30 } ]  # at most double every 30s
    scaleDown:
      stabilizationWindowSeconds: 600
      policies: [ { type: Pods, value: 1, periodSeconds: 60 } ]       # decrease slowly
~~~
With Kafka, KEDA has a built-in consumer-lag scaler and can scale to 0; when setting maxReplicas it must be ≤ the partition count.

### Why Java scales slowly
1. **Startup**: a large Spring Boot app takes 30–90 seconds (classpath scanning, bean creation, pool connections, Flyway).
2. **JIT warm-up**: for the first minutes code runs in the interpreter/C1, CPU is high and latency is worse than in a warm Pod.
3. **Vicious loop**: a new Pod burns CPU while starting, pushing the average CPU up, so HPA scales further. Kubernetes mitigates this by ignoring CPU samples from Pods that are not Ready in the initial phase, but a readiness probe that reports Ready too early removes that protection.
4. From the load increase to the new Pod serving: metric cycle + image pull time + startup + warm-up, easily 2–3 minutes. Short load spikes are over before the new Pod is ready.

### How to handle it
- **minReplicas** large enough for the normal load + a buffer; HPA only absorbs the increase.
- **Scheduled scaling** for known peaks (payday on the 25th, the 12.12 flash sale): a KEDA cron scaler or a CronJob that changes minReplicas.
- Reduce startup time: CDS/AppCDS, selective lazy init, the JDK 24+ AOT cache (JEP 483), or a GraalVM native image if you accept the constraints.
- Active warm-up before reporting Ready (call the main endpoints a few hundred times).
- Pre-pull images or keep images small; the node pool needs spare capacity (Cluster Autoscaler/Karpenter take minutes to add a node).

### Common wrong answers
- "Having HPA means every peak is handled": HPA reacts in minutes, not seconds.
- "Scale on memory for Java": the heap does not give memory back, so replicas only grow.
- "Raise maxReplicas to 100": DB connection pool × replicas can exceed the DB max_connections.

### Common pitfalls
1. **No CPU request**: CPU-based HPA shows {{unknown}} and never scales. How to avoid: always set {{requests.cpu}}.
2. **maxReplicas times the pool size exceeds DB max_connections**: scaling up makes the DB reject connections, so errors grow instead of shrinking. How to avoid: compute the total connections up front, shrink the pool or use PgBouncer.
3. **Scaling a Kafka consumer beyond the partition count**: the extra Pods sit idle and the constant rebalancing makes lag grow. How to avoid: keep maxReplicas below the partition count.
4. **Readiness reports Ready too early**: a new Pod that is still JITing is counted with high CPU, HPA scales further and the system oscillates. How to avoid: a real readiness probe, a warm-up before Ready, and slow scaleDown.

### One-minute spoken answer
"HPA computes the replica count as the ceiling of current replicas times the current metric divided by the target, evaluates every 15 seconds, and computes the CPU percentage against the request. CPU is easy to use but is an indirect signal: I/O-bound services show rising latency while CPU stays low. So for Kafka consumers I scale on lag with KEDA, and for APIs waiting on a DB I consider RPS through the Prometheus Adapter. Java scales slowly because Spring Boot takes 30–90 seconds to start and JIT warm-up makes the CPU of a new Pod spike, so from a load increase to a new Pod serving well can take 2–3 minutes. I handle it with a minReplicas that covers the baseline, fast scaleUp and slow scaleDown, scheduled scaling for payday, and a shorter startup with CDS or the AOT cache. I always multiply maxReplicas by the connection pool size to make sure the DB can take it."

> Senior tip: Before peak season, run a load test to measure the capacity of one Pod (for example 400 RPS at p99 below 200 ms) and compute minReplicas from that; do not rely on HPA. Always multiply the connection pool size by maxReplicas to be sure the DB can cope, and remember HPA and VPA should not both control the CPU/memory of the same Deployment.`,
    follow: [
      'What happens when Kafka consumer replicas exceed the partition count? How does rebalancing behave under continuous scaling?',
      'HPA scales to 20 Pods but latency does not drop. Where do you suspect the bottleneck?',
      'How do you cut Spring Boot startup from 60 seconds to under 10 seconds?'
    ]
  },

  'devops-007': {
    q: 'You SSH into a Linux server running a Java service that is reported as slow. Which commands do you type, and in what order, to narrow down the cause (CPU, RAM, disk, network, logs)?',
    a: `**Summary:** Go in resource order: {{uptime}}/{{top}} for load and CPU (watch %wa, %st), {{free -m}} for RAM and swap, {{df -h}}/{{df -i}} for disk and inodes, {{ss}} for connections and ports, {{lsof}} for the files/sockets a process holds, then read the logs with {{tail}}/{{grep}}/{{journalctl}} and {{dmesg}} to catch the OOM killer. For Java, combine {{top -H}} to find the CPU-eating thread and match it with a thread dump.

### Quick understanding
Act like a mechanic following a checklist: the engine (CPU), the fuel tank (RAM), the trunk (disk), the pipes (network), then read the black box (logs). A fixed order keeps you from missing things and from guessing when the boss is rushing you. For Java, the "engine" has many cylinders — the threads: {{top -H}} shows which thread is hot, and the thread dump shows which line of code that thread is running.

### Terms
- **Load average**: the average number of processes running or waiting (including waiting for I/O on Linux) over 1, 5 and 15 minutes.
- **%wa / %st**: the percentage of CPU idle because it is waiting for disk, and the percentage of CPU taken away by the hypervisor (on a VM).
- **Page cache**: free RAM Linux uses to cache files; it is returned when an app needs it, which is why you look at the available column.
- **Swap**: a disk area used instead of RAM; when the JVM gets swapped, GC pauses stretch to seconds.
- **Inode**: the structure that stores a file's metadata; when inodes run out you cannot create files even with free space.
- **File descriptor**: the number that represents an open file or socket of a process, limited by {{ulimit -n}}.
- **CLOSE_WAIT / TIME_WAIT**: TCP states; a steadily growing CLOSE_WAIT usually means the app is not closing connections.
- **Thread dump**: a snapshot of the stack of every JVM thread at one moment, taken with {{jstack}} or {{jcmd PID Thread.print}}.

### 1. CPU and load
~~~bash
uptime                     # 1/5/15 min load average, compare with the core count (nproc)
top -c                     # press 1 for per-core, P to sort by CPU, M by RAM
vmstat 1 5                 # r: run queue, si/so: swap, wa: I/O wait
~~~
Reading the {{%Cpu(s)}} line in top:
- **us** high: code is computing (loops, GC, serialization).
- **sy** high: lots of system calls, context switches.
- **wa** high: CPU idle but waiting for disk, suspect I/O.
- **st** high (VM): the hypervisor is taking your CPU, the problem is at the infrastructure layer.

On Linux, load average also counts processes waiting for I/O (D state), so high load does not always mean a CPU shortage.

### 2. Which Java thread is eating CPU
~~~bash
top -H -p 12345            # 12345 = java PID; say thread 12399 uses 98% CPU
jstack 12345 | grep -A 20 'nid=12399 '  # JDK 21: nid is decimal
printf '%x\\n' 12399        # JDK 8–17: nid is hex -> 306f
jstack 12345 | grep -A 20 'nid=0x306f'
~~~
If it is a "GC Thread" or "G1 Conc" thread, the problem is memory, not code: look at the GC log.

### 3. Memory
~~~bash
free -m                    # look at the available column, not free
dmesg -T | grep -i -E 'killed process|out of memory'   # did the OOM killer act
~~~
Linux uses free RAM as page cache, so a low "free" value is normal. A lot of swap in use with a JVM is very bad: GC has to touch the whole heap, and with swap the pauses stretch to seconds.

### 4. Disk
~~~bash
df -h                      # space; 100% means log/DB write errors
df -i                      # inodes: running out still reports "No space left" despite free GB
du -sh /var/log/* | sort -h | tail
lsof +L1                   # deleted files still held open by a process, space not freed
iostat -x 1                # %util, await per disk (sysstat package)
~~~

### 5. Network and connections
~~~bash
ss -s                                   # summary of connections by state
ss -ltnp                                # listening ports and the owning process
ss -tan state close-wait | wc -l        # many CLOSE_WAIT: the app is not closing connections
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
| 100% CPU on one core | Infinite loop, regex | top -H + jstack |
| High CPU, many GC threads | Heap nearly full | jstat -gcutil PID 1000 |
| High wa | Slow disk, too much logging | iostat -x |
| CLOSE_WAIT growing | Response/connection not closed | ss, lsof -p PID |
| "Too many open files" | File descriptor leak | ls /proc/PID/fd, wc -l; ulimit -n |
| Process disappears | OOM killer | dmesg, journalctl -k |

### Common wrong answers
- "Restart the service first to save time": you lose all the evidence. Capture a thread dump, a heap histogram ({{jcmd PID GC.class_histogram}}) and the metrics first, restart afterwards.
- "Low free means out of RAM": wrong, look at the available column.
- "Deleting the big log file fixes it": if the process still holds the file, the space is not released; you must truncate ({{: > file}}) or restart the process.

### Common pitfalls
1. **Seeing a high load average and immediately concluding the CPU is short**: on Linux the load also counts processes waiting for I/O (D state). How to avoid: check %wa, {{vmstat}} and {{iostat -x}} before concluding.
2. **Taking only one thread dump**: you cannot tell a thread that has been stuck for a long time from one that was just passing through. How to avoid: take 3 dumps about 5 seconds apart and compare them.
3. **Deleting a large log file that is still being written**: {{df}} still reports full because the process holds the file. How to avoid: truncate the file or find it with {{lsof +L1}} and restart in a controlled way.

### One-minute spoken answer
"I follow resource order so I do not end up guessing. First uptime and top to see load and CPU, paying attention to %wa as disk wait and %st as CPU taken by the hypervisor. If a java process is burning CPU, I use top -H to find the hot thread, convert the thread id to the nid form used in the thread dump, and see what it is running; if it is a GC thread the problem is memory. Next, free -m for the available column and swap, and dmesg to see whether the OOM killer acted. Then df -h and df -i for space and inodes, and lsof +L1 for deleted files still held open. Then ss to count connections, especially CLOSE_WAIT. Finally the application logs and journalctl. Most important: collect evidence such as a thread dump and a class histogram before restarting, because a restart wipes every trace."

> Senior tip: Prepare a collection script (top, ss, df, 3 thread dumps 5 seconds apart, jstat) and run it the moment an incident happens; in banks, SSH access to prod usually has to be requested per session, so every minute on the server must collect as much evidence as possible. On Kubernetes the equivalents are kubectl top, kubectl exec and jcmd inside the container.`,
    follow: [
      'The number of CLOSE_WAIT connections grows over time. Is the bug on the client or the server side, and in Java code what usually causes it?',
      'The server reports "No space left on device" but df -h still shows 30% free. What do you check next?'
    ]
  },

  'devops-008': {
    q: 'Compare merge, rebase and squash when integrating a branch. When do you use cherry-pick? How does revert differ from reset, and which command is forbidden on a shared branch?',
    a: `**Summary:** Merge keeps history intact and creates a merge commit; rebase replays your commits on top of the target branch for a straight history; squash merges the whole branch into one commit. Cherry-pick copies one specific commit to another branch (usually to carry a hotfix). Revert creates a new commit that reverses the change, which is safe on shared branches; reset moves the branch pointer and rewrites history, so use it only on local branches. The golden rule: never rebase or reset and then force-push a branch other people are using.

### Quick understanding
Git history is like a diary where every page gets its own number computed from its content and the page before it. Merge is taping in an extra page saying "the two storylines meet here". Rebase is copying your pages to the end of the main book: the content is the same, but they are new pages with new numbers. Squash is summarizing the whole chapter on one page. Revert is writing a new page that says "undo the content of page 42", while reset is tearing a page out; tearing pages out is only safe when the notebook is yours alone, because other people may already have photocopies of those pages.

### Terms
- **Commit hash**: the SHA id of a commit, computed from the content, the author and the parent; change the parent and the hash changes.
- **Fast-forward**: a merge that only moves the branch pointer forward without creating a merge commit, when history has not diverged.
- **Merge commit**: a commit with two parents that records the moment two branches joined.
- **Force push**: overwrites the branch history on the remote; {{--force-with-lease}} refuses if the remote has commits you have not seen.
- **Reflog**: a local log of every HEAD movement, used to rescue commits after a mistaken reset.
- **Cherry-pick**: applies the change of one specific commit to another branch, creating a new commit with a different hash.
- **Branch protection**: a GitLab/GitHub setting that forbids force pushes and requires review and a green pipeline on important branches.

### Visualize
~~~text
Start:         main: A---B---C
                 feature:   \\---D---E

merge:           A---B---C-------M      (M has 2 parents: C and E)
                       \\---D---E---/

rebase then FF:   A---B---C---D'---E'    (D', E' are NEW commits, different hash)

squash merge:    A---B---C---S          (S contains the changes from D+E)
~~~

### Why rebase is "dangerous"
A Git commit is identified by the hash of its content + parent. Rebase changes the parent, so it creates new commits D', E'. If colleagues have already pulled D, E and continued working, after your force push they have two copies of the same change, repeated conflicts and possibly lost code. That is why you should only rebase **your own** branch, and when a force push is unavoidable use {{git push --force-with-lease}} (it refuses if the remote has commits you have not seen).

### Comparison
| | Merge | Rebase | Squash |
|---|---|---|---|
| History | Truthful, shows the branch | Straight, easy to read | One commit per feature |
| Rewrites commits | No | Yes | Yes (creates a new commit) |
| Conflicts | Resolved once | May be resolved several times (once per commit) | Once |
| git bisect | Works | Best | The commit is too big, hard to narrow down |
| Good for | Release branch, shared branch | Updating a feature branch from main | Small PRs, messy draft commits |

### Cherry-pick
~~~bash
git switch release/2.4
git cherry-pick -x 9f3c2ab     # -x records "cherry picked from commit ..." for traceability
~~~
Use it when you need to bring **one** fix from main to a release branch running in production without dragging along unfinished features. Overusing cherry-pick makes two branches carry the same change under different hashes, which makes later merges conflict and makes it hard to know where a change already exists.

### Revert vs reset
~~~bash
git revert 9f3c2ab             # creates a new commit reversing 9f3c2ab; push normally
git revert -m 1 <merge-commit> # revert a merge commit, keeping parent 1 (the main branch)

git reset --soft HEAD~1        # drop the commit, keep changes staged
git reset --mixed HEAD~1       # (default) keep changes in the working tree
git reset --hard HEAD~1        # drop everything, only when sure
git reflog                     # rescue a "lost" commit after reset --hard (within reflog retention)
~~~

| Command | Rewrites history | Safe on a shared branch |
|---|---|---|
| revert | No | Yes, the standard way to undo on main |
| reset | Yes | No (unless the whole team agrees) |

### Common wrong answers
- "Rebase is always better than merge": no, rebasing shared branches destroys other people's history.
- "Reset --hard then push -f to delete a password that was pushed by accident": the password still lives in other people's clones and in the CI cache. You must **rotate the secret immediately**; deleting history is only a secondary step.
- "Reverting a merge and then merging the branch again is enough": Git considers those commits already merged, so the changes will not come back; you have to revert the revert.

### Common pitfalls
1. **Rebasing a shared branch and force pushing**: colleagues who pull get repeated conflicts and can lose commits. How to avoid: only rebase personal branches, use {{--force-with-lease}}, and enable branch protection on main and release.
2. **Reverting a merge and then merging that same branch again**: the changes do not come back because Git considers those commits merged. How to avoid: revert the revert commit itself, then merge the new fix.
3. **Committing a password by accident and only deleting the history**: the secret still lives in other people's clones and in the CI cache. How to avoid: rotate the secret immediately and enable secret scanning (for example gitleaks) in pre-commit or CI.

### One-minute spoken answer
"Merge keeps the real history and creates a merge commit with two parents; rebase copies my commits onto the tip of the target branch so history is straight but the hashes change; squash folds the whole branch into one commit, which suits a small PR with many draft commits. I use cherry-pick to carry exactly one fix from main to a release branch running in production, with -x for traceability. Revert creates a new commit that reverses the change, so it is safe on shared branches; reset moves the branch pointer and rewrites history, so it is only for local work. The forbidden rule is rebasing or resetting and then force pushing a branch other people are using. Trade-off: a straight history is easier to read and bisect, but you pay for it by rewriting commits. My team rebases to update personal branches, squashes when closing a PR, reverts to undo on main, and enables branch protection."

> Senior tip: Most teams follow these rules: rebase to update a personal branch, squash or merge when closing a PR according to the repo standard, revert to undo on main, and enable branch protection that forbids force pushes to main/release. Setting {{git config --global pull.rebase true}} avoids meaningless "Merge branch main into main" commits.`,
    follow: [
      'A merge commit has been reverted on main. Now you want to merge that feature again after fixing the bug — how?',
      'You accidentally committed a file containing a DB password and pushed it to GitLab. What are the steps, in order?'
    ]
  },

  'devops-009': {
    q: 'You are the tech lead of a core banking team: you release every 2 weeks through CAB approval, but you must still hotfix urgently when production breaks. Do you choose Git Flow or trunk-based development, and how do you organize release/hotfix branches?',
    a: `**Summary:** Git Flow (develop, feature, release, hotfix, main) suits scheduled releases and multiple versions living side by side, but long-lived branches cause merge hell and slow response. Trunk-based (branches shorter than 1–2 days, continuous merges into main, unfinished features hidden behind feature flags) gives continuous integration and better quality. For a bank, the practical approach is trunk-based + a release branch cut from main for each approval cycle, hotfixes fixed on main and then cherry-picked to the release branch running in production, and every release tagged.

### Quick understanding
Git Flow is like a publisher giving every author their own chapter to write for weeks before assembling the manuscript: merging late is why it breaks and costs time to fix. Trunk-based is like writing one shared online document: everyone edits small sections and saves continuously, and a section that is not finished is hidden for now (feature flag). A bank still needs a fixed "printed edition" for CAB to approve, so when packaging we cut a release branch from trunk; hotfixes are fixed on the main document first and only then copied to the print, so the next edition does not lose the fix.

### Terms
- **Trunk (main)**: the single main branch that everyone integrates into continuously.
- **Long-lived branch**: a branch that lives for weeks; the longer it lives, the further it drifts from main and the bigger the conflicts.
- **Feature flag**: a configuration switch that enables or disables a feature at runtime, letting you merge unfinished code without exposing it.
- **Code freeze**: the moment the release scope is frozen; after that the release branch only accepts fixes.
- **CAB (Change Advisory Board)**: the committee that approves changes to production.
- **Emergency change**: the expedited approval path for a hotfix; faster, but it still has a record and a full pipeline.
- **DORA metrics**: four metrics that measure software delivery: lead time, deployment frequency, change failure rate, MTTR.

### Git Flow
~~~text
main     ----*------------------*------------*----   (tag v2.3.0, v2.3.1, v2.4.0)
hotfix          \\---h1----------/  (then merged back into develop as well)
release              \\--r1--r2--------------/
develop  --*--*--*--*--*--*--*--*--*--*---
feature     \\--f1--f2--/   \\--g1--g2--g3--/
~~~
- Pros: it clearly separates "in development" from "in production", fits packaged products and supports multiple versions.
- Cons: feature branches live 2–4 weeks, so merges bring big conflicts; a hotfix must be merged into **two** places (main and develop) and if you forget, the bug returns in the next release; develop is often "red" because integration happens late.

### Trunk-based
~~~text
main  --*--*--*--*--*--*--*--*--*--*--   (CI green at all times, every commit is releasable)
          \\-/  \\-/      \\
       short PR (hours/days)  release/2.4 (cut when packaging for CAB, accepts cherry-picks only)
~~~
- Unfinished features are still merged but **hidden behind a feature flag** (Unleash, Togglz, a flag in the DB).
- Requirements: good automated tests, fast code review, CI under 10–15 minutes.

### Comparison
| Criteria | Git Flow | Trunk-based + release branch |
|---|---|---|
| Feature branch length | Weeks | Hours to 2 days |
| Merge conflicts | Large, piled up at the end of the sprint | Small, continuous |
| Hotfix | Merge into main + develop | Fix on main, cherry-pick to release |
| Unfinished feature | Outside the main branch | Inside main, switched off by a flag |
| Technical requirements | Low | Automated tests, flags, fast CI |
| Good for | Many parallel versions, teams with immature CI | Microservices, frequent deploys |

### Proposed process for a bank
1. A dev creates a short branch from main; the PR needs 2 approvals and a green pipeline (unit, integration, SAST).
2. On the code freeze day, cut {{release/2.4}} from main, build **one** artifact, deploy to SIT and then UAT. Main keeps receiving code for the next cycle.
3. UAT bug: fix on main first, cherry-pick to release (fix-forward; do not fix directly on release, or you will forget to bring it back to main).
4. CAB approves exactly the artifact that was tested (same digest), deploy to prod, tag {{v2.4.0}}.
5. Prod hotfix: fix on main, cherry-pick into {{release/2.4}}, tag {{v2.4.1}}, go through the emergency change path but still run the full pipeline.

### Common wrong answers
- "Banks must use Git Flow because of CAB": CAB approves the **release**, it does not dictate a branching strategy.
- "Trunk-based means pushing straight to main without review": wrong, there is still a PR and review; the branches are just very short.
- "Fixing a hotfix directly on the release branch is enough": the next release repeats the bug because main does not have the fix.

### Common pitfalls
- Feature flags are not cleaned up: after a few months there are hundreds of flags and nobody tests the combinations. Every flag needs an owner and a removal deadline.
- A DB migration ships with code that is still behind a flag but runs for real: the schema must be compatible in both directions.
- Switching suddenly while the automated tests are weak makes main red all the time; increase test coverage first.

### One-minute spoken answer
"I choose trunk-based combined with release branches. Git Flow separates develop, release and hotfix clearly and fits multiple versions living side by side, but feature branches live for weeks and cause big conflicts, and a hotfix has to be merged into two places so it is easy to forget. With trunk-based, devs work on branches shorter than two days, PRs get review and a green pipeline, and unfinished features are hidden behind feature flags. On the code freeze day I cut a release branch from main, build one artifact, run it through SIT and UAT, and CAB approves that exact digest. UAT fixes and prod hotfixes are both made on main first and then cherry-picked to release, tagged, and taken through the emergency change path while still running the full pipeline. The trade-off is that it needs good automated tests, fast CI and the discipline to clean up flags. To convince management, I measure DORA metrics before and after the change."

> Senior tip: Measure the DORA metrics (lead time, deployment frequency, change failure rate, MTTR) before and after changing strategy so you can convince management with numbers. For auditors, what matters is traceability: from ticket to commit, PR, pipeline, artifact digest and approval record; naming branches and commits by ticket id (for example CORE-1234) automates this.`,
    follow: [
      'How do feature flags affect testing and audit in banks?',
      'You have 3 versions running for 3 different branches/customers. How does your branch strategy change?'
    ]
  }
});
