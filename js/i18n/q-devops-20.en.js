/*
 * English translation of js/data/q-devops.js — task T978. Format: js/core/i18n.js (content overlay).
 * ids: devops-112 devops-113 devops-114 devops-115 devops-116 devops-117 devops-118
 */
App.i18n.content({
  'devops-112': {
    q: 'What is a Docker network and how do the bridge, host, overlay, and none modes differ? When a Java app in one container needs to call PostgreSQL running in another container, how should you publish ports to the host and let containers discover each other correctly?',
    a: `**Summary:** A **Docker network** is a virtual network layer that Docker creates so containers can communicate with each other and with the outside world (like a software-defined LAN). By default you should use a **user-defined bridge**: containers call each other by **service name** thanks to Docker's built-in DNS, and you only **publish a port** ({{-p host:container}}) when you need access from the host machine. {{host}} mode removes the virtual layer (the container uses the host machine's network stack directly), {{overlay}} connects multiple machines (Swarm/Kubernetes use similar concepts), and {{none}} disables networking.

### Terms (explained on first use)
- **Container**: a "box" that runs a packaged application, isolated from the host machine (the real machine) in terms of processes and filesystem.
- **Network namespace**: a Linux mechanism that isolates the network stack (IP addresses, ports, routing tables) for each container.
- **Bridge**: a virtual network "bridge"; Docker creates a virtual switch and attaches containers to it.
- **Publish port (port mapping)**: open a port on the host machine and forward it into a port inside the container, for example {{-p 8080:8080}}.
- **Embedded DNS**: resolves a name (for example {{postgres}}) to a container IP within the same network.

### Network modes and when to use them
| Mode | Mechanism | Advantages | Drawbacks | When to use |
|---|---|---|---|---|
| Default {{bridge}} | The {{docker0}} bridge, no automatic DNS by name | Simple | Containers must call each other by IP, inconvenient | Limited, legacy |
| **User-defined bridge** | A dedicated bridge with DNS by container/service name | Stable names, good isolation | Single host only | Dev/local, Compose (default) |
| {{host}} | Uses the host's network namespace directly | No NAT, low latency | No port isolation, easy conflicts; not the same as Linux on Docker Desktop | Special performance tuning, Linux |
| {{overlay}} | An overlay network across multiple hosts (VXLAN) | Containers on different machines can reach each other | Requires an orchestrator, more complex | Swarm; Kubernetes uses its own CNI |
| {{none}} | No network interface (except loopback) | Maximum isolation | No communication | Offline processing jobs |

### Practical example: a Java app calling PostgreSQL in Compose
~~~yaml
# compose.yaml - Compose automatically creates a user-defined bridge for the project
services:
  app:
    image: myteam/order-api:dev
    ports:
      - "8080:8080"        # publish: access from the browser/IDE on the host
    environment:
      # CALL BY SERVICE NAME "db", do NOT use localhost, do NOT use an IP
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: devpass   # dev only; use a secret manager in prod
    # DO NOT publish 5432 to the host if you do not need external connections -> reduces attack surface
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10
~~~

### Step-by-step mechanics (why "localhost" inside a container is wrong)
1. Each container has its own network namespace, so {{localhost}} (127.0.0.1) inside the {{app}} container points only to {{app}} itself, **not** to {{db}}.
2. On a user-defined bridge, Docker runs an embedded DNS: a lookup for the name {{db}} returns the internal IP of the {{db}} container (that IP can change when the container is recreated, so always use the name).
3. {{ports: "8080:8080"}} creates a NAT rule (iptables on Linux) from the host port into the container. Containers talking to each other on the same bridge communicate **directly** over the container port (5432) and do not need publishing.

### Common mistakes
- Using {{localhost:5432}} in the app configuration running inside a container -> the connection is refused.
- Publishing the DB port on {{0.0.0.0}} on a dev machine connected to a public network -> the DB is exposed.
- Trusting a hard-coded container IP -> it breaks after {{docker compose up --force-recreate}}.

> Senior tip: Treat a published port as "opening a door to the outside" — only open what you actually need from the host. For internal service-to-service traffic, let services talk on the private Compose network by service name; in Kubernetes the mindset is similar but names resolve through the cluster's Service/DNS.`,
    follow: [
      'What is the difference between EXPOSE in a Dockerfile and ports in Compose?',
      'Why does DNS by name not work on the default docker0 bridge?',
      'How do you restrict a service to listen only on 127.0.0.1 of the host when publishing a port?'
    ]
  },
  'devops-113': {
    q: 'What is the difference between a Docker volume and a bind mount? When running a container as a non-root user, why do you often get "Permission denied" when writing files to a mounted directory, and how do you handle it safely?',
    a: `**Summary:** A **volume** is a storage area managed by Docker (usually under {{/var/lib/docker/volumes}}), persistent and decoupled from the host's directory layout — suitable for DB data. A **bind mount** maps a specific path on the host machine directly into the container — suitable in dev when you want to edit code/config on the host and see it immediately in the container. Permission errors happen because the process inside the container runs with a **UID/GID** (the numeric user/group ID in Linux) different from the owner of the files on the host; the fix is to align UID/GID or use a named volume and avoid running the container as root.

### Terms
- **Mount**: attach a storage location to a path in the container's filesystem.
- **UID/GID**: the numeric identifier of a user/group in Linux (root is typically UID 0). File permissions are checked against these numbers, not names.
- **Non-root**: run a process as a non-UID-0 user to limit the impact if the container is compromised.
- **Ephemeral**: a container's writable layer is temporary — deleting the container loses the data on that layer.

### Comparison
| Criterion | **Named volume** | **Bind mount** |
|---|---|---|
| Who manages the path | Docker | You (an absolute path on the host) |
| Data when the container is removed | Kept (unless {{down -v}}) | Kept on the host |
| Initial contents | If the volume is empty, Docker copies contents from the image into the volume | Hides (masks) the contents at that path in the image |
| Performance on Docker Desktop (Mac/Win) | Usually better | Can be slow due to file sharing through a VM |
| Used for | DB data, data that must persist | Dev source code, injected config files |
| Risks | Harder to "inspect" directly on the host | Depends on host layout, prone to permission issues |

### Example configuration
~~~yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data   # named volume: persistent DB data
  app:
    image: eclipse-temurin:21-jre
    user: "10001:10001"                    # run as non-root (UID:GID)
    volumes:
      - ./config:/app/config:ro           # bind mount, read-only: inject config
      - applogs:/app/logs                 # named volume: the app can write logs
volumes:
  pgdata:                                  # declare a Docker-managed volume
  applogs:
~~~

### Why "Permission denied" happens when a non-root user writes to a bind mount
1. On the host, the {{./config}} directory or the target write directory is owned by a host user (for example UID 1000).
2. The container runs as UID 10001. The kernel checks permissions on the inode: UID 10001 has no write permission -> {{Permission denied}}, even though inside the container you can "see" that the directory exists.
3. With a **new named volume** (empty), Docker often initializes permissions based on the directory in the image, so this happens less often; but if the image prepared the directory owned by root and the container runs as non-root, it can still fail.

### Safe ways to handle it (in priority order)
- **Prefer named volumes** for any app/DB data that needs to be written; avoid bind mounts for writable paths.
- Use read-only bind mounts ({{:ro}}) when no writes are needed.
- **Align UID/GID**: build the image with a user that has a fixed UID (for example 10001) and {{chown}} the writable directories in the Dockerfile; if a bind mount is unavoidable, ensure the host directory grants permission to that UID.
- Avoid "quick fixes" like {{chmod 777}} (open to everyone) or falling back to {{root}} — both break the security model.
- On SELinux (RHEL/Fedora), a bind mount may need the {{:z}}/{{:Z}} flag to relabel — use carefully because {{:Z}} applies a private label.

### Example: preparing a writable directory in a Dockerfile
~~~dockerfile
FROM eclipse-temurin:21-jre
# Create a non-root user with a fixed UID to make volume permission alignment easier
RUN groupadd -g 10001 app && useradd -u 10001 -g app -m app \\
    && mkdir -p /app/logs && chown -R 10001:10001 /app
USER 10001:10001
WORKDIR /app
COPY --chown=10001:10001 target/app.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
~~~

> Senior tip: File permissions in containers are a classic "blind spot" when moving from running as root to non-root. Pick a fixed UID for the image, document it in the README, and use named volumes for every writable path; reserve bind mounts for read-only data or source code in the dev environment.`,
    follow: [
      'What is the difference between a local volume driver and a volume backed by external storage (NFS, cloud)?',
      'When would you use a tmpfs mount and how does it help with sensitive data?',
      'How dangerous is the docker compose down -v command in an environment with important data?'
    ]
  },
  'devops-114': {
    q: 'A Java image has already been built, but running the container with Docker defaults still leaves too many privileges. How do you harden the container runtime: run as non-root, use a read-only filesystem, drop capabilities, and enable no-new-privileges? Explain each mechanism and map it to the Kubernetes securityContext.',
    a: `**Summary:** Runtime hardening means **reducing the privileges** of the process inside the container to the minimum required (the **least privilege** principle). The main layers are: (1) run as **non-root** to limit the impact if exploited; (2) a **read-only root filesystem** so an attacker has a harder time writing malicious code; (3) **drop Linux capabilities** (remove the "pieces" of root power such as {{NET_ADMIN}}) and only add back what is truly needed; (4) {{no-new-privileges}} to block escalation through setuid binaries. On Kubernetes the equivalent settings live in {{securityContext}} and are enforced by policy (Pod Security Admission).

### Terms
- **Hardening**: strengthening, reducing the attack surface through stricter configuration.
- **Linux capabilities**: Linux splits root privileges into many small pieces ({{CAP_NET_BIND_SERVICE}}, {{CAP_SYS_ADMIN}}...). A container still keeps a set of capabilities by default.
- **seccomp**: a syscall (system call) filter — it limits which kernel functions a process may invoke.
- **seccomp/AppArmor/SELinux**: kernel-level mandatory access control layers; seccomp filters syscalls, while AppArmor/SELinux apply labels and access policies.

### Mechanisms, why they matter, and how to enable them
| Mechanism | Why it is needed | Docker (example) | Kubernetes ({{securityContext}}) |
|---|---|---|---|
| Non-root | An RCE vulnerability has less opportunity to manipulate the system; some policies forbid root | {{USER 10001}} in the image; {{docker run --user 10001:10001}} | {{runAsNonRoot: true}}, {{runAsUser: 10001}} |
| Read-only rootfs | Prevents writing webshells/malware into the container filesystem | {{--read-only}} + mount {{tmpfs}} for {{/tmp}} | {{readOnlyRootFilesystem: true}} + {{emptyDir}}/{{tmpfs}} for writable dirs |
| Drop capabilities | Remove excess root powers (a few capabilities remain by default) | {{--cap-drop=ALL --cap-add=NET_BIND_SERVICE}} (if needed) | {{capabilities.drop: ["ALL"]}} |
| No new privileges | Blocks a process from gaining extra rights via setuid/setgid files | {{--security-opt=no-new-privileges:true}} | {{allowPrivilegeEscalation: false}} |
| Seccomp profile | Reduces the kernel syscall surface | {{--security-opt seccomp=profile.json}} (Docker already ships a default profile) | {{seccompProfile.type: RuntimeDefault}} |

### Example: a hardened Java service in Docker Compose
~~~yaml
services:
  order-api:
    image: my-registry.local/order-api:1.4.2@sha256:3b1c... # pin by digest
    user: "10001:10001"                # non-root
    read_only: true                    # root filesystem is read-only
    tmpfs:
      - /tmp:size=64m,mode=1777       # Java/libs often need /tmp for temporary writes
    cap_drop:
      - ALL                            # drop every capability
    security_opt:
      - no-new-privileges:true
    # do not use: privileged: true, network_mode: host (unless truly required)
~~~

### Example Kubernetes Pod (compatible with the "restricted" Pod Security level)
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: order-api
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: my-registry.local/order-api:1.4.2@sha256:3b1c...
      securityContext:
        runAsUser: 10001
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: tmp
          mountPath: /tmp              # writable location when rootfs is read-only
  volumes:
    - name: tmp
      emptyDir: {}
~~~

### Common issues when enabling read-only/cap-drop
- The app or a library writes to {{/tmp}}, {{/var}}, or Tomcat's work directory -> crash. Fix: mount an {{emptyDir}}/{{tmpfs}} at the paths that need writes; with Spring Boot running as a JAR (not an exploded WAR on an external Tomcat) you usually only need {{/tmp}}.
- Binding to a port below 1024 requires {{CAP_NET_BIND_SERVICE}}; a Java app typically listens on 8080, so {{drop: ALL}} is sufficient.
- The image was built assuming root (writing into {{/app}}) -> you must fix the Dockerfile ({{chown}} the directories that need writes, or move to a mounted path).

### In production
- **Real incident:** a container running as root was hit by RCE through a dependency vulnerability; the attacker installed a crypto miner in {{/tmp}}. With a read-only rootfs + {{/tmp}} as a tmpfs with {{noexec}} (advanced) and dropped capabilities, the impact is contained.
- **Verification:** {{docker inspect}} to check {{ReadonlyRootfs}} and {{CapDrop}}; on Kubernetes use {{kubectl auth can-i --as=system:serviceaccount:...}} and policy tools (Kyverno/OPA) to catch violating pods. Scan configuration with {{trivy config}} or {{kube-bench}}/policy audit.

> Senior tip: Runtime hardening is "defense in depth" — a clean image (few CVEs) running privileged is still dangerous. Set Pod Security Admission to the {{restricted}} level for prod namespaces and turn violations into CI failures (render manifests then scan) instead of patching after they reach the cluster.`,
    follow: [
      'What is the difference between allowPrivilegeEscalation: false and running as non-root?',
      'When do you actually need to add a capability back, and what should the approval process look like?',
      'What does the RuntimeDefault seccomp profile block, and when might an app be affected?'
    ]
  },
  'devops-115': {
    q: 'How do you build a trust chain for container images: scan images and dependencies for vulnerabilities (Trivy, Dependabot), generate an SBOM, sign images, and only allow the cluster to run images from a trusted/verified registry?',
    a: `**Summary:** The container **software supply chain** spans: source code -> dependencies -> image -> registry -> runtime. You need multiple layers: **SCA/Dependabot** to flag dependency vulnerabilities in code, **Trivy** to scan images (OS packages + app dependencies) and configuration, an **SBOM** (Software Bill of Materials — an "ingredient list" of components inside the image) to trace quickly when a new CVE appears, **image signing** (Cosign) to prove provenance, and an **admission policy** (Kyverno/OPA Gatekeeper/cosign policy) so the cluster **rejects** images that do not come from a trusted registry or are not signed.

### Terms
- **CVE**: the public identifier of a disclosed security vulnerability.
- **SCA (Software Composition Analysis)**: analyzes third-party components/libraries to find CVEs and license issues.
- **SBOM**: a list of components (name, version, source) packaged in the software/image; it helps answer "which images contain log4j 2.14?".
- **Image signing**: attaching a digital signature to an image in the registry; the runtime verifies the signature matches a trusted key/identity.
- **Admission controller/policy**: a component that blocks Kubernetes objects that do not meet policy before they are created.

### Control layers
| Layer | Example tools | What it detects/blocks | When it runs |
|---|---|---|---|
| Dependencies (code) | Dependabot, Renovate, {{trivy fs}} | CVEs in {{pom.xml}}/{{build.gradle}} | PR / scheduled |
| Image | {{trivy image}} | OS + app dependency CVEs inside the image | After build, before promote |
| Config/IaC | {{trivy config}} | Risky Dockerfile/K8s manifests | CI |
| SBOM | {{trivy image --format cyclonedx}} / Syft | Component inventory | Attached to the artifact on every build |
| Sign image | Cosign (Sigstore) | Proves the image was produced by a trusted pipeline | After pushing to the registry |
| Run only trusted images | Kyverno, Gatekeeper, Connaisseur | Rejects images from the wrong registry/unsigned | At deploy time (admission) |

### Example commands (conceptual, run in CI)
~~~bash
# 1) Scan the built image (fail CI on HIGH/CRITICAL with a fix available)
trivy image --severity HIGH,CRITICAL --ignore-unfixed \\
  --exit-code 1 my-registry.local/order-api:1.4.2

# 2) Generate an SBOM (CycloneDX) and store it with the artifact
trivy image --format cyclonedx --output sbom.json my-registry.local/order-api:1.4.2

# 3) Sign the image with Cosign (keyless/OIDC in CI, or a securely managed key)
cosign sign --yes my-registry.local/order-api@sha256:3b1c...

# 4) Verify the signature (performed by policy/admission or a verification step)
cosign verify --certificate-identity-regexp "https://gitlab.myco/.+" \\
  --certificate-oidc-issuer "https://gitlab.myco" \\
  my-registry.local/order-api@sha256:3b1c...
~~~

### Policy to "run only images from a trusted registry" (Kyverno idea)
~~~yaml
# Simplified idea: only allow images from the internal registry
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: allow-trusted-registry
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-registry
      match:
        resources:
          kinds: ["Pod"]
      validate:
        message: "Image must come from trusted registry"
        pattern:
          spec:
            containers:
              - image: "my-registry.local/*"   # only the internal registry is allowed
~~~

### In production
- **Real incident:** a critical CVE was disclosed in a logging library; without an SBOM it took days to audit every service. With an SBOM + registry inventory, the query "which images contain lib X version Y" is answered in minutes.
- **Real incident:** a developer ran {{kubectl run}} with an unknown {{docker.io/...}} image for debugging -> malware risk. Admission blocked images outside the internal registry.
- **Process:** scanning produces a signal (PR/CI), but an enforcement policy (admission) is the final control point. CVE handling: assess whether it is reachable, upgrade to the fix, rebuild the image (patch the base image regularly), then promote again.

> Senior tip: "Scanning" without "blocking" is just a report. Pin your pipeline to a digest ({{@sha256:...}}) rather than a floating tag ({{latest}}), because a tag can point to a different image after it has already been scanned/signed.`,
    follow: [
      'What is the difference between signing an image with a key pair and keyless (OIDC) signing with Cosign?',
      'Why should you reference images by digest instead of tag in production manifests?',
      'How do you balance a policy that blocks critical CVEs with the need for an urgent hotfix?'
    ]
  },
  'devops-116': {
    q: 'Running a database (PostgreSQL/MySQL) with Docker: when is it appropriate and when is it risky? How do you design backup/restore for data in volumes, health checks, and what memory/performance issues should you watch out for?',
    a: `**Summary:** Running a database with Docker is a **great fit** for dev/test/CI (fast to recreate, the same version for the whole team) but **high risk** for production if the team lacks the operational maturity for stateful workloads (durable storage, backup, failover, I/O monitoring). Data must live on a **volume** (not the ephemeral writable layer), backups should use native tools ({{pg_dump}}/{{mysqldump}} or a consistent snapshot) rather than just copying files while the DB is running, the health check must verify the DB actually accepts queries, and you need to watch memory ({{shared_buffers}} vs the container limit, {{shm_size}}).

### Terms
- **Stateful**: has state/data that must survive restarts (the opposite of stateless).
- **Ephemeral storage**: temporary storage that is lost when the container is removed.
- **Volume snapshot**: a point-in-time copy of block storage; it must be coordinated with the DB to ensure consistency.
- **shm (shared memory)**: a memory region shared between processes; PostgreSQL uses it for parts of its shared buffers mechanism.

### When to use / when to avoid
| Context | Run the DB in Docker? | Reason |
|---|---|---|
| Local dev, onboarding | Yes | One command brings up the right version, easy to reset |
| CI integration tests | Yes (ephemeral) | Each job gets a clean DB, destroyed after the run |
| Staging that mirrors prod (controlled) | Maybe | Acceptable if you have backup/monitoring |
| Critical production, small team | Usually **no** | Risk of data loss, complex failover; consider a managed DB (RDS/Cloud SQL) |
| Production, team skilled with K8s + storage | Possible (StatefulSet/operator) | Needs an operator (e.g. CloudNativePG), a good storage class, clear procedures |

### Example: running PostgreSQL durably for dev/test
~~~yaml
services:
  db:
    image: postgres:16-alpine
    shm_size: 128mb                    # avoid shared memory errors with some configurations
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password  # a file, not long-lived in env
    secrets:
      - db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d:ro  # .sql/.sh scripts run only when the data dir is empty
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10
    # Container memory limit (environment-dependent); understand shared_buffers
    # deploy/resources or --memory; avoid letting the DB contend for all host RAM
secrets:
  db_password:
    file: ./secrets/db_password.txt      # dev: a local file, not committed
volumes:
  pgdata:
~~~

### Backup and restore (principles)
- **Logical backup (recommended for portability):** {{pg_dump}} produces a SQL/compressed dump, restored with {{pg_restore}}/{{psql}}. It runs while the DB is active (consistent at the dump's transaction snapshot level).
~~~bash
# Backup (run from the host, exec into the container or use a psql client)
docker exec -t db pg_dump -U app -d orders -Fc -f /tmp/orders.dump
docker cp db:/tmp/orders.dump ./backups/orders-$(date +%F).dump

# Restore into an empty DB
docker cp ./backups/orders-2026-11-06.dump db:/tmp/orders.dump
docker exec -t db pg_restore -U app -d orders --clean --if-exists /tmp/orders.dump
~~~
- **Volume/file copy:** only safe when the DB is **stopped** or you use a freeze/consistent snapshot mechanism; copying the data directory while it is being written can corrupt the cluster.
- Always **test restores** periodically (a backup you have never restored is not a backup).

### Memory and performance
- PostgreSQL uses {{shared_buffers}} (a DB setting) and the OS cache. If {{shared_buffers}} is set high but the container's RAM limit is low (cgroup), it can be OOM-killed. Size {{shared_buffers}} reasonably relative to the container/host limit.
- Docker's default {{shm_size}} can be small; some workloads/images need it increased.
- Attach volumes to fast disks; on Docker Desktop I/O performance differs from native Linux.

### In production
- **Real incident:** a DB was placed in a container with no volume (using the writable layer) -> {{docker rm}} wiped all data.
- **Real incident:** scripts in {{/docker-entrypoint-initdb.d}} "did not run" — because the data directory already had data from a previous run; init scripts only run on the first initialization (empty data dir).
- **Verification:** monitor volume capacity and backup duration, alert when a restore test fails; {{pg_isready}} only reports that connections are accepted, it does not replace checking the application/real queries.

> Senior tip: "It runs" in Docker does not mean "safe for production". For money/medical/order data, the question is not whether Docker can run a DB, but whether the team has a rehearsed backup-restore-failover procedure; if not, a managed database is usually cheaper than a single data loss.`,
    follow: [
      'Why is depends_on: service_started not enough to guarantee the DB is ready to accept queries?',
      'What is the difference between pg_dump (logical) and a volume/disk snapshot in terms of recovery?',
      'When would you use a StatefulSet and an operator (e.g. CloudNativePG) instead of a single container?'
    ]
  },
  'devops-117': {
    q: 'How do you standardize Docker Compose for a Java team\'s dev environment (app + Postgres + Redis + Kafka): beyond "it starts up", what common pitfalls are there (depends_on, init, ports, image rebuilds, stale data) and how do you design it so everyone on the team gets the same experience?',
    a: `**Summary:** Dev Compose is not just a list of services but a **reproducible** environment. Common pitfalls: {{depends_on}} does not wait for the DB to be truly ready, Kafka/Zookeeper/KRaft starts slowly and has misconfigured listeners, DB init scripts only run once, port conflicts across dev machines, stale built images because {{--build}} was forgotten, and old volume data making behavior "different on my machine". Solutions: health checks + {{service_healthy}}, pin image versions, profiles for heavy services, a {{.env}} convention that does not commit secrets, a clear reset command, and "one command to run" documentation.

### Terms
- **Reproducible**: someone else following the same steps gets an equivalent environment.
- **Pin version/digest**: fix the version ({{postgres:16.3-alpine}}) or digest to avoid "pulling a different image today than yesterday".
- **Profile**: an optional group of services in Compose, enabled only when needed (reduces load on dev machines).
- **Init script**: a script that runs on first initialization (for example {{/docker-entrypoint-initdb.d}}).

### Common pitfalls and how to handle them
| Pitfall | Symptom | Why | Fix |
|---|---|---|---|
| Default {{depends_on}} | App fails to connect to the DB on startup | It only waits for the container to start, not to be healthy | {{condition: service_healthy}} + a real health check |
| DB init runs only once | You change the init file but the DB still has the old schema | Init is skipped if the data dir already has data | {{docker compose down -v}} when you need a reset, or use migrations (Flyway) |
| Wrong Kafka listeners | The in-container app connects, the host app does not (or vice versa) | {{ADVERTISED_LISTENERS}} must match the in/out-of-Docker context | Configure two listeners (internal/external) per the Kafka image you use |
| Port conflict | {{bind: address already in use}} | The dev machine already has 5432/6379 running | Allow port overrides via {{.env}} ({{DB_PORT=15432}}) |
| Stale image | Code changed but the container runs the old build | Compose uses an image that was already built | {{docker compose up --build}} or a separate build profile |
| Old volume data | Tests pass on machine A, fail on machine B | State left over from a previous run | A standard reset command; idempotent migrations |
| Resources consume the whole machine | Laptop heats up, Docker hangs | Kafka/ES are heavy | {{profiles}}, {{mem_limit}}/deploy.resources (depending on Compose), enable only what you need |

### Example team Compose skeleton (abridged, with comments)
~~~yaml
# compose.yaml - run: docker compose --profile kafka up -d
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
      SPRING_DATA_REDIS_HOST: redis
    ports:
      - "\${APP_PORT:-8080}:8080"       # override via .env if there is a conflict
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16.3-alpine        # pin the version, avoid :latest
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${DB_PASSWORD:-devpass}  # dev default; do not commit real secrets
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7.2-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  kafka:
    image: bitnami/kafka:3.7           # example; verify config variables for the actual image
    profiles: ["kafka"]                # enable only when needed: reduces load on dev machines
    environment:
      # Listener config depends on the image/mode (KRaft/ZK); read the image README carefully
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093

volumes:
  pgdata:
~~~

### Practices that keep the team aligned
- Commit {{compose.yaml}} + {{.env.example}} (do not commit a {{.env}} with real secrets). Document in the README: run, reset ({{down -v}}), view logs, enable profiles.
- Use **Flyway/Liquibase** for schema instead of relying on init scripts — migrations are repeatable and consistent across environments.
- For Java dev: hot reload inside a container needs a source mount + build tool config; simpler is to run the app in the IDE and keep only DB/Redis/Kafka in Compose (hybrid) — pick one approach and standardize it.

> Senior tip: A dev environment "close to prod" is a good goal, but do not copy prod security/topology verbatim onto a laptop. Optimize for a fast feedback loop and the ability to reset; deliberate differences (for example no internal TLS in dev) must be documented so they do not surprise you in staging.`,
    follow: [
      'When should you run the Java app in the IDE with infrastructure in Compose (hybrid) instead of containerizing the app too?',
      'How do you handle port conflicts when multiple developers run multiple copies of the stack on the same machine?',
      'Why should you avoid the :latest tag for infrastructure images in a team Compose file?'
    ]
  },
  'devops-118': {
    q: 'As a tech lead, compare managing secrets for Java/container applications using environment variables, file mounts, and dedicated systems (Vault, AWS Secrets Manager). Why are environment variables risky, and how do you design a secret rotation mechanism that does not disrupt the service?',
    a: `**Summary:** **Secrets** (DB passwords, API keys, certificates) must be stored, distributed, and rotated safely. **Environment variables** are convenient but easy to leak through logs, crash dumps, debug pages, or {{/proc/<pid>/environ}}, and they are inherited by child processes. **File mounts** (especially tmpfs/in-memory, like a Kubernetes Secret volume) reduce accidental exposure and support file updates, but the app must re-read them. **Vault/AWS Secrets Manager** (or equivalent mechanisms) centralize control, enforce access (IAM/policy), provide audit, and support **rotation**; the application fetches secrets at runtime (SDK/sidecar/External Secrets) and uses **short-lived credentials** when possible. Safe rotation needs two phases (accept both the old and new secret during a transition window) and a controlled reload/restart procedure.

### Terms
- **Secret sprawl**: secrets copied everywhere (repo, CI, chat, dev machines) that become hard to control.
- **Rotation**: replacing a secret on a schedule or when compromise is suspected; the goal is to reduce the time a secret can be abused.
- **Dynamic secret**: a short-lived secret issued on demand by a system (for example Vault issues a temporary DB user) that expires automatically.
- **Least privilege**: grant only read access to the specific secrets a service needs.

### Comparing distribution options
| Option | Advantages | Risks/limitations | When to use |
|---|---|---|---|
| Environment variables | Simple, familiar 12-factor approach | Leaks via logs/debug/dumps/{{/proc}}, inherited by child processes, hard to audit access in detail, changing values often requires a restart | Dev/local; low-sensitivity secrets; controlled risk acceptance |
| File mount (in-memory) | Not visible in env; Kubernetes can update the file (except subPath) | The app must read/reload the file; file permissions must be tight; still a "static secret" without rotation | K8s Secret volume, Docker secrets/files; better than env in most cases |
| Vault / AWS Secrets Manager + fetch at runtime | Centralized, IAM/policy, audit, rotation, can be dynamic/short-lived | Depends on secret infrastructure; must handle caching, expiry, network errors | Production, many services, compliance/audit requirements |

### Why environment variables are risky (mechanics)
1. Many frameworks/debug endpoints print configuration; a single log line that dumps the whole config object (containing secrets) can expose them.
2. On Linux, a process with the same privileges (or an escalation scenario) can read {{/proc/<pid>/environ}}.
3. Child processes inherit env; invoking external commands ({{Runtime.exec}}, scripts) can unintentionally carry secrets along.
4. Secrets placed in env show up in {{docker inspect}}/manifests and are not encrypted the way people assume — you must control who can see metadata.

### Non-disruptive rotation (two-phase pattern)
~~~text
T0: DB accepts password P1 (currently in use)
T1: Create password P2, configure the DB to accept BOTH P1 and P2 (transition window)
T2: Distribute P2 to the app (Secret Manager update / new Vault lease)
T3: The app loads P2 (reload) and opens new connections with P2; old connections drain from the pool
T4: Confirm no connections still use P1 -> revoke P1
~~~
- With a **dynamic secret** (a DB credential issued by Vault with a TTL), the app requests a new credential before expiry and revokes the old one — reducing the need for "passwords that live forever".
- In Spring, fetching the secret at startup is simple but changing it requires a restart; reloading needs a refresh mechanism (be careful with the connection pool). Many teams choose a controlled **rolling restart** after a secret change instead of complex reload logic, as long as downtime is designed for (multiple replicas).

### In production
- **Real incident:** an API key was committed to the repo and baked into the image -> permanently leaked in history. Response: revoke/rotate the key immediately, remove it from history (but treat it as compromised), move to a secret manager.
- **Real incident:** rotation changed the DB password on one side only -> the entire app lost connectivity. Cause: no dual-acceptance window and no coordinated order.
- **Verification:** audit logs of "who read which secret and when", alerts for secrets nearing expiry/not rotated, repo/image secret scanning in CI.

> Senior tip: The maturity goal is not just "keep secrets out of code" (step 1) but to **reduce blast radius**: short-lived secrets, narrow scope, audit, automated rotation, and an app that tolerates credential changes. In interviews, be explicit about the trade-off: complex reloads vs a simple rolling restart that requires multiple replicas.`,
    follow: [
      'How can a Java application pick up a new secret when using a connection pool without dropping requests?',
      'What problem does the External Secrets Operator solve in Kubernetes?',
      'What is the difference between rotating a static secret (changing a password) and using short-lived dynamic credentials?'
    ]
  }
});
