/*
 * English translation of js/data/q-devops.js — task T403. Format: js/core/i18n.js (content overlay).
 * ids: devops-023 devops-024 devops-025 devops-026 devops-027
 */
App.i18n.content({
  'devops-023': {
    q: 'A new developer spends two days installing PostgreSQL, Redis, and Kafka before the service can run on a new machine. How would you set up a development environment with Docker Compose: what goes in the Compose file, how do you make the app start only after the database is ready, is data lost when containers are stopped, and what support does Spring Boot provide?',
    a: `**Summary:** Put a {{compose.yaml}} file in the repository that declares the dependent **services** (postgres, redis, kafka) with pinned image versions, ports, environment variables, **healthchecks**, and **named volumes** to persist data. Use {{depends_on}} with {{condition: service_healthy}} so startup order depends on services being "ready", not merely "running". A single {{docker compose up -d}} command does the rest. Since Spring Boot 3.1, the {{spring-boot-docker-compose}} module can also start Compose when the app starts and automatically configure the datasource.

### Quick overview
Compose is like a **menu for ordering a banquet**: instead of ordering each dish separately (manually installing each piece of software differently on every machine), you hand over one sheet listing "1 PostgreSQL 16, 1 Redis 7, 1 Kafka", and the kitchen (Docker) prepares exactly the same setup for everyone. A **healthcheck** is the server checking that a dish is fully cooked before bringing it to the guests. A **volume** is the refrigerator: turning off the kitchen (stopping containers) does not remove the food inside it.

### Terminology
- **Service (in Compose)**: a container declared in the file, with a name — that name is also the **hostname** other containers use to reach it.
- **Healthcheck**: a command Docker runs periodically inside a container to determine whether it is ready to serve requests (for example, {{pg_isready}}).
- **depends_on + condition**: controls startup order; {{service_started}} waits only for the container to run, while {{service_healthy}} waits for its healthcheck to report healthy.
- **Named volume**: a data storage area managed by Docker that exists independently of containers.
- **Compose profiles**: groups of optional services enabled only when needed ({{--profile kafka}}).
- **.env**: an environment-variable file Compose reads automatically, so passwords do not have to be hard-coded in the Compose file.

### Step-by-step mechanics
1. A developer clones the repository and runs {{docker compose up -d}}. Compose reads {{compose.yaml}}, creates a **dedicated network** for the project, and pulls images if they are not already present.
2. It creates the postgres and redis containers, and their healthchecks start running. Why are healthchecks necessary? PostgreSQL takes a few seconds to initialize; a "running" container does not necessarily accept connections yet.
3. A service declaring {{depends_on: postgres: condition: service_healthy}} waits until postgres is healthy before that service is created.
4. The app running on the host (in an IDE) connects to {{localhost:5432}} through the published port; another container in the same Compose project connects using the service name {{postgres:5432}}.
5. {{docker compose down}} removes containers and the network but **retains named volumes**, so the data is still there next time. Only {{docker compose down -v}} removes volumes (a complete data reset).

### Example Compose file
~~~yaml
services:
  postgres:
    image: postgres:16.4             # pinned version; do not use latest
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpass     # development machines only
    ports: ["5432:5432"]             # host:container, so an app in the IDE can connect
    volumes: ["pgdata:/var/lib/postgresql/data"]   # data survives down/up
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      retries: 10
  redis:
    image: redis:7.4
    ports: ["6379:6379"]
  orders-api:                        # optional: run the app in a container too
    build: .
    profiles: ["full"]               # runs only with: docker compose --profile full up
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orders   # service name, not localhost
    depends_on:
      postgres:
        condition: service_healthy   # wait until the DB is actually ready
volumes:
  pgdata:
~~~

### What Spring Boot provides
Add the {{spring-boot-docker-compose}} dependency (development scope only, such as Maven {{optional}} or Gradle {{developmentOnly}}). When you run the app, Spring Boot finds {{compose.yaml}}, runs {{docker compose up}}, waits for the containers to be ready, and automatically creates **ServiceConnections** for images it recognizes (PostgreSQL, Redis, Kafka, and so on) — you do not need to declare {{spring.datasource.url}} on a development machine. This module is disabled by default when running tests.

### Comparing development environment setups
| Approach | Advantages | Disadvantages |
|---|---|---|
| Manual installation on each machine | No Docker required | Different versions on each machine, hours of setup, difficult to reset |
| Docker Compose | One command, identical on every machine, easy to reset | Requires Docker Desktop/Engine, consumes RAM |
| Testcontainers (for tests) | Containers follow the test lifecycle and are isolated | Not intended for running the app every day |
| Shared development database on a server | No RAM used on developer machines | Developers overwrite each other's data and depend on the network |

### Common pitfalls
- **Using {{depends_on}} without a condition.** Symptom: the app intermittently fails at startup with "Connection refused" because the database is not ready. Prevention: use a healthcheck plus {{service_healthy}}; the app should still retry connections.
- **An app inside a container calling {{localhost:5432}}.** Symptom: Connection refused. Inside the container, localhost is the app container itself. Prevention: use the service name {{postgres}}.
- **Using the {{latest}} image.** Symptom: it works today but fails tomorrow because the image moved to a new major version. Prevention: pin versions and upgrade deliberately.
- **Assuming {{down}} deletes data**, or conversely, running {{down -v}} and losing prepared test data. Prevention: understand volumes and provide a data-seeding script.
- **Committing real passwords in Compose to Git.** Prevention: use the Compose file only for development with dummy passwords; keep sensitive values in an uncommitted {{.env}} file.
- **Misconfigured Kafka listeners.** Symptom: an app on the host can reach the bootstrap server but then hangs because the broker advertises an internal container address. Prevention: configure separate advertised listeners for access from the host and from within the network.

### One-minute interview answer
"I keep a compose.yaml file in the repository declaring PostgreSQL, Redis, and Kafka with pinned versions, published ports for the app running in an IDE, named volumes so data remains after down, and healthchecks for each service. Any service that depends on the database uses depends_on with condition service_healthy, so it waits for the database to be genuinely ready rather than merely running. Within the same Compose project, containers call each other by service name, not localhost. Since Spring Boot 3.1, I add spring-boot-docker-compose so the app starts Compose and configures connections automatically. The result is that a new developer only needs to clone the repository and run one command, with down -v providing a clean reset."

> Senior tip: treat {{compose.yaml}} as **living documentation** of the system — new developers can read it to learn what the service needs. Set a goal of "clone to running in 15 minutes" and measure it every quarter on a clean machine. On a 16 GB development machine, Kafka plus a few databases can consume 3–4 GB; use profiles to enable only what the current task actually needs.`,
    follow: [
      'When should you use Testcontainers instead of Docker Compose for integration tests?',
      'For Kafka in Compose, how should advertised listeners be configured so both apps on the host and other containers can connect?',
      'How do you seed sample data into PostgreSQL during its first initialization?'
    ]
  },
  'devops-024': {
    q: 'You run a Spring Boot service in Docker and encounter three problems: the app cannot connect to PostgreSQL at localhost:5432 even though the database is running on the host, opening localhost:8080 in a browser does not reach the app, and uploaded files disappear whenever the container is deleted. Explain Docker networking and storage so you can fix all three.',
    a: `**Summary:** Each container has its own **network namespace**: {{localhost}} inside a container refers to that container itself, not the host machine. To reach the host, use {{host.docker.internal}} (Docker Desktop; on Linux, add {{--add-host=host.docker.internal:host-gateway}}), or better, put the database and app on the **same user-defined network** and use the container name. To reach the app from the host, you must **publish a port** with {{-p 8080:8080}}, and the app must listen on {{0.0.0.0}}. Data written to the container's **writable layer** disappears when the container is deleted — use a **volume** or **bind mount** instead.

### Quick overview
Each container is like **an apartment in a building**: it has its own internal address, and "my home" (localhost) means its own apartment, not the building manager's office (the host). **Publishing a port** is like installing a doorbell at the building entrance that rings directly inside the apartment: an outside visitor presses 8080 and the bell rings in that apartment. A **user-defined network** is like a building with an internal directory: asking for "postgres" takes you to the right apartment. The container's **writable layer** is like belongings in a rented room — moving out (deleting the container) clears the room; a **volume** is a separate storage unit whose contents remain when you change rooms.

### Terminology
- **Network namespace**: each container's separate network stack (IP addresses, ports, and localhost).
- **Bridge network**: a virtual network on the host that connects containers. The default {{bridge}} network does **not** resolve container names; a **user-defined bridge** (created manually or by Compose) provides internal name-based DNS.
- **Publish port** ({{-p HOST:CONTAINER}}): maps a port on the host to a port in the container. {{EXPOSE}} in a Dockerfile is documentation only and does **not** publish anything by itself.
- **Writable layer**: a thin writable layer above the image for each container; it is lost when the container is deleted.
- **Volume**: a directory managed by Docker (within Docker's data area) that persists beyond the container lifecycle.
- **Bind mount**: mounts a specific host directory into a container ({{-v /data/uploads:/app/uploads}}).

### Step-by-step mechanics: fixing each problem
1. **The app-to-database connection to "localhost:5432" fails.** An app in a container using localhost is calling itself, where PostgreSQL is not running. Fix: create a network with {{docker network create backend}}, run both containers with {{--network backend}}, and set {{SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/orders}}. If the database runs directly on the host, use {{host.docker.internal}}.
2. **The host cannot reach the app at "localhost:8080".** Common causes: forgetting {{-p 8080:8080}}, reversing the port order ({{-p 8080:80}} while the app listens on 8080), or binding the app only to {{127.0.0.1}} inside the container. Spring Boot listens on all interfaces by default, so the problem is usually just a missing {{-p}}.
3. **Uploaded files disappear.** The app writes to {{/app/uploads}} in the writable layer. Fix: use {{-v uploads:/app/uploads}} (a named volume) or a bind mount. In production, storing files in object storage (S3) is preferable to storing them on a container disk.

~~~text
Host (your machine)                user-defined network "backend"
 localhost:8080 ──-p 8080:8080──►  [orders-api 172.18.0.3]
                                        │  jdbc:postgresql://postgres:5432
                                        ▼
                                   [postgres  172.18.0.2]
                                        │ volume pgdata → /var/lib/postgresql/data
 Inside orders-api: localhost = orders-api itself, NOT the host
~~~

### Example commands
~~~bash
docker network create backend
docker volume create uploads
docker run -d --name postgres --network backend -e POSTGRES_PASSWORD=dev postgres:16.4
docker run -d --name orders-api --network backend \\
  -p 8080:8080 \\
  -v uploads:/app/uploads \\
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/postgres \\
  orders-api:1.4.2
# Check whether the name resolves within the network
docker exec orders-api getent hosts postgres
~~~

### Volume or bind mount
| Criterion | Named volume | Bind mount |
|---|---|---|
| Who manages the path | Docker | You choose the host directory |
| File permissions | Docker initializes them from the image contents | Determined by host directory permissions; often problematic when the container runs as non-root |
| Performance on Mac/Windows | Good | Slower with many small files |
| Use when | Database data, application data | Mounting source code during development, configuration files |

### Common pitfalls
- **Using the default bridge network and then calling containers by name.** Symptom: {{UnknownHostException: postgres}}. Prevention: use a user-defined network or Compose.
- **Assuming {{EXPOSE 8080}} is sufficient.** Without publishing the port, the host cannot reach the app.
- **Writing logs or important files into the container.** They disappear when the container is replaced. Write logs to stdout and files to a volume or object storage.
- **Using a bind mount with a non-root container.** Symptom: {{AccessDeniedException}} on writes. Prevention: adjust the host directory permissions/UID or use a named volume.
- **Publishing a database port on {{0.0.0.0}} on a server.** Symptom: the database is exposed to the Internet. Prevention: publish only {{127.0.0.1:5432:5432}}, or do not publish it at all and let containers communicate within the network.

### One-minute interview answer
"Each container has its own network namespace, so localhost inside it refers to the container itself, not the host. To let the app reach the database, I put both on the same user-defined network and use the container name; the default bridge network has no name-based DNS. If the database is on the host, I use host.docker.internal. To reach the app from the host, I publish the port with -p host:container; EXPOSE is only documentation. For data, anything written to the writable layer is lost when the container is deleted, so I use a named volume for data that must persist, a bind mount when I need to map a specific directory, and object storage for files in production."

> Senior tip: when debugging container networking, **test from inside the container** ({{docker exec -it orders-api sh}}, then {{getent hosts postgres}} and {{nc -zv postgres 5432}}) instead of guessing from the host — most mistakes come from losing track of "where you are". On servers, also inspect published ports carefully: Docker adds its own iptables rules, so a published port can bypass a firewall such as ufw even when you thought it was blocked.`,
    follow: [
      'Why can a Docker-published port bypass the ufw firewall on Linux?',
      'How does host network mode differ from bridge mode, and when would you use it?',
      'What is the Kubernetes equivalent of a volume, and why should a Pod not store uploaded files on its disk?'
    ]
  },
  'devops-025': {
    q: 'The same Spring Boot image must run in DEV, UAT, and PROD on Kubernetes with different database URLs, feature flags, and passwords. How do you pass configuration from ConfigMaps and Secrets into Spring (environment variables or files), what is the precedence order, and does the app automatically pick up changes after you edit a ConfigMap?',
    a: `**Summary:** The image must **not contain** environment-specific configuration. Put ordinary values (URLs, flags) in a **ConfigMap** and sensitive values in a **Secret**; pass them into the Pod in two ways: as **environment variables** (Spring automatically maps {{SPRING_DATASOURCE_URL}} to {{spring.datasource.url}} through relaxed binding) or as **mounted files** read through {{spring.config.import=optional:configtree:/etc/secrets/}}. Environment variables take precedence over {{application.yml}} inside the jar. When a ConfigMap changes, environment variables **do not change** until the Pod restarts; mounted files are updated by kubelet after a delay, but the app must reload them itself — the safe approach is a controlled **rollout restart**.

### Quick overview
An image is like **a car leaving the factory**: every customer receives exactly the same car. ConfigMaps and Secrets are **each customer's keys and paperwork**, handed over with the car. Environment variables are like information stuck to the dashboard when the engine starts — changing it requires stopping and restarting the engine. A mounted file is like paperwork in the glove compartment — the papers can be replaced, but the driver (the app) must open the compartment and read them again to notice.

### Terminology
- **ConfigMap**: a Kubernetes object that stores non-sensitive key–value pairs.
- **Secret**: similar to a ConfigMap but intended for sensitive data; by default it is only **base64-encoded** (not securely encrypted) — enable encryption at rest for etcd and use strict RBAC.
- **envFrom / valueFrom**: loads all keys or individual keys as container environment variables.
- **Relaxed binding**: Spring maps uppercase, underscore-separated environment variables to properties: {{SPRING_DATASOURCE_URL}} → {{spring.datasource.url}}.
- **configtree**: a Spring Boot configuration source where **each file becomes one property**: the filename is the key and the file contents are the value.
- **Profile**: an environment-specific configuration set ({{application-prod.yml}}), enabled with {{SPRING_PROFILES_ACTIVE}}.

### Step-by-step mechanics
1. Create the {{orders-config}} ConfigMap (database URL, flags) and {{orders-secret}} Secret (database password) **separately for each namespace/environment**.
2. The Deployment declares {{envFrom}} for the ConfigMap, giving the container {{SPRING_DATASOURCE_URL}} and {{FEATURE_NEW_CHECKOUT}} variables.
3. The Secret is mounted as the {{/etc/secrets}} directory, with one file per key: {{/etc/secrets/spring.datasource.password}}. Why prefer files over environment variables for secrets? Environment variables are more easily exposed through {{/proc}}, crash dumps, logs that print the environment, and child processes that inherit them.
4. The app starts with {{spring.config.import=optional:configtree:/etc/secrets/}}, so Spring reads the file into the {{spring.datasource.password}} property.
5. Spring merges sources in this precedence order: command-line arguments > environment variables > configuration files outside the jar > {{application-<profile>.yml}} inside the jar > {{application.yml}} inside the jar.
6. When the ConfigMap changes, environment variables do not change; mounted files (without {{subPath}}) are updated after kubelet's synchronization delay (usually within a few minutes). To apply changes safely, run {{kubectl rollout restart deployment/orders-api}} so new Pods start gradually with readiness checks.

### Example manifest
~~~yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: orders-config, namespace: uat }
data:
  SPRING_DATASOURCE_URL: jdbc:postgresql://pg-uat:5432/orders
  SPRING_PROFILES_ACTIVE: uat
  FEATURE_NEW_CHECKOUT: "true"          # values are always strings
---
# in the Deployment, container section:
envFrom:
  - configMapRef: { name: orders-config }
env:
  - name: SPRING_CONFIG_IMPORT
    value: optional:configtree:/etc/secrets/
volumeMounts:
  - { name: secrets, mountPath: /etc/secrets, readOnly: true }
# pod section:
volumes:
  - name: secrets
    secret:
      secretName: orders-secret          # key "spring.datasource.password" → file with the same name
~~~

### Environment variables or files
| Criterion | Environment variables | File mount + configtree |
|---|---|---|
| Simplicity | Very simple | Requires an additional spring.config.import |
| Updates after edits | Only when the Pod restarts | Files change after a delay; the app must reload them itself |
| Exposure risk | Higher (environment dumps, child processes) | Lower; file read permissions can be restricted |
| Suitable for | URLs, flags, ordinary configuration | Passwords, keys, certificates |

### Common pitfalls
- **Building a separate image for each environment** (embedding application-prod.yml containing passwords in the image). Prevention: use one image with configuration outside it; never put passwords in an image or Git.
- **Assuming a Secret is encrypted.** Anyone allowed to {{get secret}} in the namespace can read it with base64 decoding. Prevention: least-privilege RBAC, encryption at rest, or retrieving secrets from an external store (Secrets Manager, Vault).
- **Using {{subPath}} and expecting files to update automatically.** subPath mounts are **never** updated. Prevention: mount the whole directory or restart the Pod.
- **Editing a ConfigMap and assuming it has taken effect.** Existing Pods keep the old values while new Pods (from scaling out) use the new ones, producing two behaviors at once. Prevention: pair configuration changes with a rollout restart, or put a ConfigMap hash in the Pod template annotation so every change triggers a rollout.
- **Misspelling an environment variable** ({{SPRING_DATASOURCE-URL}}). Spring silently ignores it and uses the default. Prevention: inspect {{/actuator/env}} (with sensitive values masked) in a test environment.

### One-minute interview answer
"I build one image and inject environment-specific configuration from outside. Ordinary configuration such as URLs, profiles, and feature flags goes in a ConfigMap loaded through envFrom; Spring relaxed binding maps SPRING_DATASOURCE_URL to spring.datasource.url, and environment variables override application.yml in the jar. I mount Secrets as files and read them through spring.config.import configtree because environment variables are more easily exposed in dumps. Secrets are only base64-encoded, so RBAC and encryption at rest are required. When a ConfigMap changes, environment variables do not change until the Pod restarts, so I always use a rollout restart with readiness checks, or attach the ConfigMap hash to an annotation so every configuration change becomes a controlled rollout."

> Senior tip: treat a **configuration change like a deployment**: reviewed, rolled out Pod by Pod, and reversible. Automatic hot reloading sounds attractive, but it makes the question "which value was each Pod running at 14:00?" difficult to answer. The checksum annotation technique (commonly used by Helm) gives you a clear history without requiring any reload library.`,
    follow: [
      'When should you retrieve secrets directly from AWS Secrets Manager or Vault instead of Kubernetes Secrets?',
      'How can you see which configuration values the app is actually using without exposing passwords?',
      'Should feature flags live in a ConfigMap or a dedicated flag service? Why?'
    ]
  },
  'devops-026': {
    q: 'Your team builds images tagged latest and deploys them to Kubernetes. During one rollback "to the old version", the new version kept running, and two Pods in the same Deployment ran different versions. Explain why, and describe your strategy for tags, digests, imagePullPolicy, and registry cleanup.',
    a: `**Summary:** A **tag is a movable label**: {{latest}} yesterday and today can refer to two different images, and a node that already has an older image cached may not pull it again — so Pods run different versions and "rolling back" to {{latest}} does not actually go back anywhere. The correct approach is an **immutable, unique** tag for every build (a git SHA, plus semver for releases), **tag immutability** enabled in the registry, deployment using a specific tag or **digest** ({{@sha256:...}}), and a **lifecycle policy** to clean up old images.

### Quick overview
A tag is like **a file named "latest-report.docx"**: anyone can overwrite it, and different people in the room may have different versions open while believing they are looking at the same file. A **digest** is like **a hash of the file's actual contents**: changing one byte changes the hash, so saying "run sha256:ab12…" guarantees everyone runs the same thing. A git SHA tag is like including a version code in the filename: every version has its own name and nobody overwrites it.

### Terminology
- **Image tag**: a name attached to an image ({{orders-api:1.4.2}}); it can be moved to another image (mutable).
- **Digest**: the SHA-256 hash of an image manifest; immutable and identifies the exact content.
- **imagePullPolicy**: when kubelet pulls an image: {{Always}} (always contact the registry), {{IfNotPresent}} (use the copy already on the node), or {{Never}}.
- **Kubernetes defaults**: if the tag is {{latest}} or omitted, the default is {{Always}}; for other tags, it is {{IfNotPresent}}.
- **Tag immutability**: a registry setting (for example, in ECR) that prevents existing tags from being overwritten.
- **Lifecycle policy**: rules that automatically delete old images (retain the N most recent versions, delete untagged images after X days).

### Mechanics: why two Pods run different versions
1. On Monday: build A, push {{orders-api:latest}}, which points to A. A Pod on node-1 pulls A.
2. On Tuesday: build B, push {{latest}} again, which now points to B.
3. Scale out with a Pod on node-2: it pulls {{latest}} = B. Node-1 is still running A. **Same Deployment, two versions.** (If someone sets {{IfNotPresent}} for {{latest}}, it gets even worse: a node with A cached keeps using A even for new Pods.)
4. Rollback: {{kubectl rollout undo}} restores the old Pod template — but that old template also says {{latest}}, so it still pulls B. Kubernetes knows only the template, not the image content behind a tag.
5. With the tag {{3f9c2a1}} (a git SHA): the old template says {{3f9c2a1}} and the new one says {{8be0d47}}, so rollback genuinely returns to the correct version.

~~~text
latest tag:  latest ──(Monday)──► image A
             latest ──(Tuesday)──► image B      ← the tag "moves"
SHA tags:    orders-api:3f9c2a1 ──► image A     (forever)
             orders-api:8be0d47 ──► image B
Digest:      orders-api@sha256:ab12... ──► exactly one content, cannot change
~~~

### Recommended strategy
| Item | Approach | Why |
|---|---|---|
| Tag every build | Short git SHA ({{3f9c2a1}}) | Traceable to a commit and unique |
| Release tag | Add {{1.4.2}} pointing to the same image | Easier for people to understand |
| Registry | Enable tag immutability | Nobody can overwrite a released version |
| Deployment manifest | SHA tag or {{image@sha256:...}} | Every Pod runs the same content and rollback is exact |
| Environment promotion | Reuse the **same digest** from DEV → UAT → PROD | Build once; what was tested is what reaches production |
| Cleanup | Lifecycle: retain the 50 most recent versions, delete untagged images after 14 days | Prevents registry growth and reduces storage costs |

### Example commands
~~~bash
SHA=$(git rev-parse --short HEAD)
docker build -t orders-api:$SHA .
docker tag orders-api:$SHA 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:$SHA
docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:$SHA
# Show the digest to record in the manifest/release notes
docker images --digests 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api
~~~

### Common pitfalls
- **Deploying with {{latest}}.** Symptom: Pods run different versions, rollback is ineffective, and nobody knows which commit production is running. Prevention: SHA tags plus immutability.
- **Rebuilding the image for each environment.** Symptom: UAT passes but PROD fails because the PROD image was built at a different time and pulled different dependencies. Prevention: build once and promote the same digest.
- **A lifecycle policy deleting images that are still running.** Symptom: a new node cannot pull the image, and Pods enter ImagePullBackOff during scaling. Prevention: retain enough versions, especially those running in every environment and candidates for rollback.
- **Setting {{imagePullPolicy: Always}} with a slow or rate-limited registry.** Every new Pod contacts the registry; Docker Hub rate-limits anonymous pulls. Prevention: use a private registry/mirror; with immutable tags, {{IfNotPresent}} is sufficient.
- **Not recording the deployed digest.** During an incident, you cannot prove which version ran. Prevention: have the pipeline record both tag and digest in the release notes.

### One-minute interview answer
"latest is a movable tag: every push points it at a new image, so Pods on different nodes pulling at different times run different versions, and rolling back to an old template still references latest and does not actually go back. I tag every build with a git SHA, add semver for releases, and enable tag immutability in the registry so nobody can overwrite them. Manifests use SHA tags or digests, so every Pod has the same content and rollout undo returns to the exact old version. Images are built once and the same digest is promoted through DEV, UAT, and PROD. Finally, a lifecycle policy retains enough versions for rollback and deletes untagged images."

> Senior tip: ask the quick question "which commit is production running?" — if the team needs more than 30 seconds to answer, the tagging strategy has a problem. I always have the pipeline add the OCI label {{org.opencontainers.image.revision}} containing the git SHA to the image and expose it through {{/actuator/info}}: one curl command reveals it immediately, even after a manual deployment.`,
    follow: [
      'What disadvantages does deploying by digest instead of tag have for manifest readability and GitOps?',
      'What risks are addressed by signing images (cosign) and verifying signatures during deployment?',
      'How do Docker Hub rate limits affect a cluster, and how do you handle them?'
    ]
  },
  'devops-027': {
    q: 'Your GitHub Actions pipeline stores long-lived AWS access keys in repository secrets for deployment, Maven builds take eight minutes because dependencies are downloaded every time, and two consecutive merges have deployed on top of each other. How would you fix the workflow (OIDC, caching, environments, concurrency, permissions)?',
    a: `**Summary:** Remove access keys and use **OIDC**: the workflow requests an OIDC token from GitHub ({{permissions: id-token: write}}), and AWS STS exchanges it for temporary credentials for an **IAM role** whose trust policy is restricted to the exact repository and branch/environment. Cache Maven with {{actions/setup-java}} using {{cache: maven}}. Attach the deployment job to an **environment** (with required reviewers for production) and use a **concurrency group** so two deployments do not overlap. Set minimum **permissions** for {{GITHUB_TOKEN}} and pin third-party actions to commit SHAs.

### Quick overview
A long-lived access key in secrets is like **a warehouse key kept in a shared desk drawer**: anyone who obtains it can enter the warehouse indefinitely. **OIDC** is like a temporary access badge: on each run, GitHub provides a "signed letter of introduction" (an OIDC token) stating "this is a workflow from repository X, branch main", and AWS verifies it before issuing **a badge valid for one hour**. A **cache** is like keeping ingredients already prepared so you do not have to go shopping again next time. **Concurrency** is like a rule that "only one truck may enter the loading bay at a time".

### Terminology
- **Workflow / job / step**: a YAML file in {{.github/workflows}}; each job runs on a separate runner, and steps run sequentially within the job.
- **OIDC token**: a signed token GitHub issues for each run, containing repository, branch, and environment information (the {{sub}} claim).
- **IAM OIDC identity provider**: configured in AWS to trust tokens from {{token.actions.githubusercontent.com}}.
- **Trust policy**: conditions for assuming the role — for example, the {{sub}} claim must be {{repo:acme/orders-api:environment:production}}.
- **Environment**: a GitHub concept for a deployment environment, with its own secrets, required reviewers, and restrictions on deployable branches.
- **Concurrency group**: runs in the same group are queued or cancel the older run.
- **GITHUB_TOKEN permissions**: permissions of the automatic workflow token; these should be minimized.

### Step-by-step mechanics (OIDC)
1. The deployment job declares {{permissions: id-token: write}} so it can request an OIDC token.
2. The {{aws-actions/configure-aws-credentials}} action requests a token from GitHub and calls {{sts:AssumeRoleWithWebIdentity}} with the role ARN.
3. AWS verifies the token signature, the {{sts.amazonaws.com}} audience, and that the {{sub}} claim matches the trust policy. Why restrict {{sub}}? Without this condition, **any repository on GitHub** could assume your role.
4. STS returns temporary credentials (one hour by default), and the action places them in environment variables for subsequent steps.
5. When the job ends, the credentials expire on their own; there is no long-lived secret to leak or rotate.

### Abbreviated workflow
~~~yaml
name: ci-cd
on:
  push:
    branches: [main]
permissions:
  contents: read                      # minimum default for every job
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven                # cache ~/.m2 using the pom.xml hash
      - run: ./mvnw -B verify
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production           # required reviewers approve before it runs
    concurrency:
      group: deploy-production        # only one production deployment at a time
      cancel-in-progress: false       # queue while deploying; do not cancel midway
    permissions:
      id-token: write                 # allowed to request an OIDC token
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-orders-deploy
          aws-region: ap-southeast-1
      - run: ./deploy.sh "$GITHUB_SHA"
~~~
The trust policy for role {{gha-orders-deploy}} requires {{token.actions.githubusercontent.com:aud}} = {{sts.amazonaws.com}} and {{token.actions.githubusercontent.com:sub}} = {{repo:acme/orders-api:environment:production}}.

### Comparing CI credential approaches
| Approach | Consequences of a leak | Operations |
|---|---|---|
| Access key in secrets | Usable until revoked, potentially for months | Requires periodic rotation, easy to forget |
| OIDC + role | Token lives for minutes, credentials for hours, and only the correct repository/environment is valid | One-time configuration |
| Self-hosted runner with an instance role | Anyone who can run a workflow on that runner gets its permissions | Runner must be isolated per repository |

### Common pitfalls
- **A trust policy checking only the audience and not {{sub}}.** Risk: another repository (including a stranger's) can assume the role. Prevention: always bind {{sub}} to the repository and branch/environment.
- **Forgetting {{id-token: write}}.** Symptom: the action reports that it cannot obtain a token. Note: declaring job permissions replaces the defaults, so every required permission must be listed.
- **Using the wrong cache key.** Symptom: the cache never hits or an old version is used indefinitely. {{setup-java}} automatically keys the cache by the build-file hash; when writing {{actions/cache}} yourself, the key must include the {{pom.xml}} hash.
- **Using a third-party action through the {{@v1}} tag.** The tag can be moved to malicious code. Prevention: pin actions outside your organization to a **full commit SHA** and update them through Dependabot.
- **Running a workflow for a pull request from a fork with {{pull_request_target}}** and then checking out the PR code. Untrusted code runs with your secrets. Prevention: avoid this pattern or separate it into a job without secrets.
- **Using {{cancel-in-progress: true}} for deployment.** Cancelling midway can leave the system in a partially deployed state. Prevention: use it for build/test jobs but queue deployments.

### One-minute interview answer
"I remove long-lived access keys and switch to OIDC: the deployment job has id-token write permission, the configure-aws-credentials action exchanges GitHub's OIDC token for temporary credentials for an IAM role, and the trust policy binds both the audience and sub claim to the correct repository and production environment, so other repositories cannot assume it and there is no key left to leak. The build uses setup-java with Maven caching to avoid downloading dependencies again. The deployment job uses the production environment with required reviewers plus a concurrency group so two merges do not deploy over each other, with cancel-in-progress disabled for deployment. Finally, default permissions are contents read only, and third-party actions are pinned to commit SHAs."

> Senior tip: after migrating to OIDC, **delete** the old access key in IAM rather than merely removing it from GitHub secrets — an "unused" key that remains active is one of the most commonly exploited assets. Use separate roles per environment (a UAT deployment cannot assume the production role), and enable CloudTrail so every deployment can be traced back to the exact workflow run through the session name.`,
    follow: [
      'How does the OIDC token sub claim differ between a job with an environment and one without an environment?',
      'How do reusable workflows help when 30 repositories need the same standard pipeline?',
      'What security risks do self-hosted runners have compared with GitHub-hosted runners?'
    ]
  }
});
