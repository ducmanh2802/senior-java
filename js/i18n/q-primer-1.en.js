/*
 * English translation of js/data/q-primer.js — task T400. Format: js/core/i18n.js (content overlay).
 * ids: primer-001 primer-002 primer-003 primer-004 primer-005 primer-006 primer-007
 */
App.i18n.content({
  'primer-001': {
    q: 'Docker primer: what are an image, a container, and a Dockerfile? How would you package and run a Spring Boot application with Docker?',
    a: `**Summary:**
- An **image** is a "package" containing the application and everything it needs (JDK, libraries, configuration files).
- A **container** is a **running process** created from an image and isolated from the host machine.
- A **Dockerfile** is the recipe used to build an image.

With Docker, something that "works on my machine" runs exactly the same way on the server.

### Quick overview
An image is like a **prepackaged meal box**: it contains the rice, side dishes, and chopsticks. A container is **when you open the box and eat it**. One box template can produce many identical boxes (many containers), and the meal tastes the same wherever you eat it. Before Docker, each server had to do its own "cooking" (install the correct JDK version and apply the correct configuration), so environments often drifted apart.

### What problems does Docker solve?
1. **Consistent environments**: dev, test, and prod use the same image, eliminating errors such as "a library is missing on the server".
2. **Fast deployment**: download an image and run it within seconds, with no manual installation.
3. **Isolation**: multiple applications (Java 17, Java 21, Postgres) can run on the same machine without interfering with one another.
4. It is the foundation of **Kubernetes** (see primer-002).

### Terminology
- **Layer**: each instruction in a Dockerfile creates a layer. Unchanged layers are **cached**, making subsequent builds faster.
- **Registry**: an image repository (Docker Hub, Amazon ECR…). You **push** images to it, and servers **pull** them down.
- **Tag**: an image version label, for example {{myapp:1.4.2}}.
- **Volume**: storage for data outside the container. Data in a volume remains after the container is deleted.
- **Port mapping**: connects a port on the host machine to a port inside the container, for example {{-p 8080:8080}}.
- **Docker Compose**: a YAML file declaring multiple containers that run together (app + Postgres + Redis).

### Dockerfile for Spring Boot (multi-stage)
~~~text
# Stage 1: build with Maven (this image is large and is used only for the build)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline          # download dependencies first: take advantage of layer caching
COPY src ./src
RUN mvn -q package -DskipTests

# Stage 2: runtime only, using a compact JRE
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
USER 1000                                  # do not run as root
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
~~~
**Why multi-stage:** the final image contains neither Maven nor the source code, so it is much smaller, more secure, and faster to download.

### Try it out
~~~bash
docker build -t myapp:1.0 .                # build an image from the Dockerfile
docker run -d -p 8080:8080 --name myapp myapp:1.0   # run a container in the background and map the port
docker logs -f myapp                       # view logs
docker exec -it myapp sh                   # enter the container to inspect it
docker stop myapp && docker rm myapp       # stop and delete the container
~~~
~~~yaml
# docker-compose.yml: run the app and Postgres together
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes: [ "pgdata:/var/lib/postgresql/data" ]
  app:
    image: myapp:1.0
    ports: [ "8080:8080" ]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/postgres   # "db" is the service name
    depends_on: [ db ]
volumes:
  pgdata:
~~~

### Common pitfalls
- **The JVM does not recognize the container memory limit** (very old JDK versions) → it is killed due to OOM. Modern JDKs are container-aware; set {{-XX:MaxRAMPercentage}} instead of a fixed {{-Xmx}}.
- **Copying the entire directory before downloading dependencies** → every code change rebuilds everything from scratch (losing the cache). Copy pom.xml first.
- **Storing data inside the container** (for example, Postgres without a volume) → deleting the container loses the data.
- **Putting secrets into the image** (passwords in ARG/ENV) → anyone who pulls the image can read them. Pass them at runtime or use a secret manager.
- **Using the latest tag in production** → you do not know which version is running, making rollback difficult.

### Common follow-up interview questions
- How do an image and a container differ? How does a container differ from a virtual machine (VM)? (Containers share the host kernel, so they are lighter and start faster than VMs, but provide weaker isolation.)
- How do you reduce image size and speed up builds?
- See also: the devops-* questions in the question bank.

### One-minute spoken answer
"Docker packages an application together with its entire runtime environment into an image. A container is an isolated process running from that image, so dev, test, and prod run exactly the same way. For Spring Boot, I write a multi-stage Dockerfile: the first stage builds with Maven, and the second copies only the jar file into a compact JRE image, runs as a non-root user, and sets MaxRAMPercentage so the JVM respects the container memory limit. Data that must be retained goes in a volume, secrets are supplied at runtime rather than embedded in the image, and images are tagged with specific versions to make rollback easier."

> Senior tip: add an image vulnerability scanning step (for example, Trivy) to CI and allow only scanned images to be deployed. That is a "software supply chain security" answer that senior interviewers really appreciate.`,
    follow: ['How does a container differ from a virtual machine (VM)?', 'How do you reduce the size of a Spring Boot image?']
  },
  'primer-002': {
    q: 'Kubernetes primer: what are a Pod, Deployment, Service, and Ingress? How does Kubernetes help run a Spring Boot application in production?',
    a: `**Summary:** Kubernetes (K8s) is a system that **automatically runs, replicates, recovers, and updates** containers across a cluster of machines. You **declare the desired state** (for example, "always keep 3 replicas of app version 1.4"), and K8s makes reality match that declaration:
- if a container dies, it creates a replacement;
- if a machine fails, it moves the workload to another machine;
- when a new version is available, it updates gradually.

### Quick overview
Docker gives you a "meal box" (a container). Kubernetes is the **manager of an industrial kitchen**: you simply say, "We need 300 meals for lunch today; always keep the counter fully stocked." The manager assigns work to kitchens, replaces ruined boxes, cooks more when demand rises, and changes trays gradually when the menu changes so the counter is never empty.

### Terminology
- **Cluster**: a group of machines (nodes) managed by K8s. The **control plane** is the brain; **worker nodes** are where containers run.
- **Pod**: the smallest unit, consisting of one (usually) or several containers running together with their own IP. Pods are **ephemeral**: when one dies, the new pod has a different IP.
- **Deployment**: declares "run N pod replicas from image X" and handles replication and **rolling updates** (replacing pods one by one).
- **Service**: a stable address (DNS name) in front of a group of pods that load-balances traffic among them. Common types: {{ClusterIP}} (internal to the cluster), {{LoadBalancer}} (external through a cloud load balancer).
- **Ingress**: an HTTP entry point from the internet that routes by domain/path to Services.
- **ConfigMap / Secret**: configuration and secrets separated from the image and injected into pods through environment variables or files.
- **Probe**: K8s checks pod health. **readiness** (ready to receive traffic?), **liveness** (still alive, or should it be restarted?), **startup** (has startup completed?).
- **requests / limits**: the amount of CPU/RAM a pod **is guaranteed** / **is allowed to use at most**.
- **HPA (Horizontal Pod Autoscaler)**: automatically increases or decreases the pod count based on CPU or another metric.
- **Namespace**: a "folder" that divides a cluster by team or environment.

### Deployment + Service for Spring Boot
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders }
spec:
  replicas: 3                                 # always keep 3 pods
  selector: { matchLabels: { app: orders } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      containers:
        - name: app
          image: registry.example.com/orders:1.4.2
          ports: [ { containerPort: 8080 } ]
          resources:
            requests: { cpu: "500m", memory: "768Mi" }   # guaranteed minimum
            limits:   { memory: "1Gi" }                  # exceeding this causes a kill (OOMKilled)
          readinessProbe:                     # do not receive traffic until ready
            httpGet: { path: /actuator/health/readiness, port: 8080 }
          livenessProbe:                      # restart if the application hangs
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            initialDelaySeconds: 30
---
apiVersion: v1
kind: Service
metadata: { name: orders }
spec:
  selector: { app: orders }                   # points to pods with the label app=orders
  ports: [ { port: 80, targetPort: 8080 } ]
~~~
Other services in the cluster call this app through {{http://orders}} without needing to know the IP of each pod.

### Flow of deploying a new version
1. CI builds image {{orders:1.4.3}} and pushes it to the registry.
2. Update the image in the Deployment (using kubectl, Helm, or GitOps such as Argo CD).
3. K8s creates new pods, waits for **readiness** to pass before sending traffic to them, and then gradually shuts down old pods.
4. If new pods fail (readiness never passes) → the rollout stops and old pods continue serving; run {{kubectl rollout undo}} to roll back.

~~~bash
kubectl get pods -n shop                      # view pods
kubectl describe pod orders-7d9c -n shop      # view events: why the pod is failing
kubectl logs -f deploy/orders -n shop         # view logs
kubectl rollout status deploy/orders -n shop  # monitor the rolling update
kubectl rollout undo deploy/orders -n shop    # return to the previous version
~~~

### Common pitfalls
- **An overly aggressive liveness probe** (calls the DB, has a short timeout) → a slightly slow DB makes K8s restart many pods, worsening the incident. Liveness should check only that "the JVM is alive"; leave dependency checks to readiness.
- **Not setting requests/limits** → pods compete for resources and are killed unpredictably; or setting a memory limit below the JVM heap → repeated **OOMKilled** events.
- **The app does not handle graceful shutdown** → every deployment drops a few requests. Spring Boot provides {{server.shutdown=graceful}}.
- **Putting secrets in a ConfigMap or in git** → exposure. K8s Secrets are also only base64-encoded; production should use a secret manager.

### Common follow-up interview questions
- How do readiness and liveness differ, and what happens if they are configured incorrectly?
- Rolling update vs. blue-green vs. canary?
- Why can a pod be OOMKilled even when the heap still has free space? (Total JVM memory includes heap, metaspace, thread stacks, and direct buffers, so it can exceed the limit.)

### One-minute spoken answer
"Kubernetes is a container orchestration system: I declare the desired state, such as a Deployment with 3 replicas of image version 1.4, and K8s maintains that state, recreates dead pods, and performs a rolling update when a new version is released. A Pod is an ephemeral runtime unit; a Service provides a stable DNS name and load-balances across pods; an Ingress brings HTTP traffic in from outside. For Spring Boot, I set requests and limits appropriate for JVM memory, point the readiness probe at actuator readiness so traffic is accepted only when ready, use liveness only to check that the process is alive, enable graceful shutdown, and supply configuration through ConfigMaps and Secrets."

> Senior tip: set a **PodDisruptionBudget** and spread pods across multiple zones. When the cluster upgrades nodes, it ensures that too many of your pods are never shut down at once. This operational detail distinguishes people who have "actually run K8s" from those who have only read the documentation.`,
    follow: ['How do readiness and liveness probes differ?', 'Why can a pod be OOMKilled even when the heap still has free space?']
  },
  'primer-003': {
    q: 'Kafka primer: what are a topic, partition, offset, and consumer group? Why do large systems use Kafka, and how do you use it in Spring Boot?',
    a: `**Summary:** Kafka is a **distributed event log**:
- Producers **append** events to a **topic**.
- A topic is divided into multiple **partitions** for parallel processing.
- Each event has a sequence number called an **offset**.
- Consumers **read by offset** and keep track of how far they have read.

Events are **not deleted when read**; they are retained for a configured period (retention), so multiple systems can read the same event stream, including replaying it from the beginning.

### Quick overview
Imagine **numbered conveyor belts** at a post office:
- Senders (producers) place parcels on a belt; each parcel has a sequence number (offset).
- The post office has multiple parallel conveyor belts (partitions) to move parcels faster.
- Each receiving team (consumer group) has a notebook recording "the last parcel number collected" on each belt.
- Unlike a regular queue, a parcel **does not disappear** when team A collects it: team B (analytics) can still read the same parcels using its own notebook.

### What problems does Kafka solve?
1. **Decoupling**: the Order service only publishes an {{OrderPlaced}} event; Inventory, Email, and Analytics read it independently. Adding a new service does not require changing the Order service.
2. **Absorbing traffic spikes**: during peak hours, events accumulate in Kafka (a buffer), and consumers process them gradually.
3. **Very high throughput**: sequential disk writes and use of the operating system page cache support hundreds of thousands to millions of events per second.
4. **Replayability**: after fixing a consumer bug, you can reread events from an old offset.

### Terminology
- **Broker**: a Kafka server; a cluster consists of multiple brokers.
- **Topic**: the name of an event stream, for example {{orders}}.
- **Partition**: one part of a topic. **Ordering is guaranteed only within a partition.**
- **Key**: events with the same key (for example, orderId) always go to the **same partition**, preserving order for the same order.
- **Offset**: an event sequence number within a partition.
- **Consumer group**: a group of consumers that share partitions. A partition is assigned to only **one** consumer in the group, so the maximum number of consumers processing in parallel equals the number of partitions.
- **Commit offset**: the consumer reports "processed up to here"; after a restart, it resumes reading from that point.
- **Replication**: each partition has replicas on multiple brokers; if a broker dies, a replica takes over.
- **Rebalance**: when consumers join or leave a group, Kafka redistributes partitions.

~~~text
Topic "orders" (3 partitions)
P0: [0][1][2][3][4] ...     <- orders with key K1 always go here
P1: [0][1][2] ...
P2: [0][1][2][3] ...
Group "inventory": C1 reads P0, C2 reads P1+P2   (only 1 consumer per partition)
Group "email":     C3 reads all 3 partitions      (reads independently, with its own offsets)
~~~

### Using it in Spring Boot (Spring for Apache Kafka)
~~~java
// Producer: send an event with key = orderId to preserve per-order ordering
@Service
class OrderEvents {
  private final KafkaTemplate<String, OrderPlaced> kafka;
  OrderEvents(KafkaTemplate<String, OrderPlaced> kafka) { this.kafka = kafka; }
  void publish(OrderPlaced e) { kafka.send("orders", e.orderId(), e); }
}

// Consumer: each group reads independently
@Component
class InventoryListener {
  @KafkaListener(topics = "orders", groupId = "inventory")
  void on(OrderPlaced e) {
    inventory.reserve(e);   // MUST be idempotent: the same event may arrive a second time
  }
}
~~~

### Delivery semantics, explained simply
- **At-least-once** (the most common): commit the offset only after processing. If the consumer crashes midway, the event is delivered **again**, so the consumer must be **idempotent** (processing twice still produces the correct result, for example by storing processed event ids).
- **At-most-once**: commit before processing; a crash loses the event.
- **Exactly-once**: Kafka supports this within Kafka itself (idempotent producer + transactions), but when an external DB is involved, the practical solution still relies on idempotency or an outbox.

### Common pitfalls
- **Not setting a key** → events for the same order land in different partitions and are processed out of order (for example, "cancel" arrives before "create").
- **A non-idempotent consumer** → inventory is deducted twice when an event is redelivered.
- **Taking too long in the listener** → exceeding {{max.poll.interval.ms}} makes Kafka think the consumer is dead, causing continuous rebalances.
- **Writing to the DB and then sending to Kafka** (two separate steps) → a crash between them loses the event; use the **transactional outbox**.
- **Using Kafka as a job queue** that requires retrying individual jobs: one bad message blocks everything behind it in the partition. Consider a DLQ or retry topic, or a different queue.

### Common follow-up interview questions
- How does Kafka guarantee ordering? What should you increase to speed up processing? (The number of partitions, and the corresponding number of consumers.)
- How do you avoid losing events when writing to a DB and sending to Kafka? (The outbox pattern.)
- How does Kafka differ from RabbitMQ?

### One-minute spoken answer
"Kafka is a distributed event log: producers append to a topic, the topic is divided into partitions for parallelism, and each event has an offset. Events are not deleted when read but are kept according to retention, so multiple consumer groups read independently and can replay events. Ordering is guaranteed only within a partition, so I use the entity id, such as orderId, as the key. Within a group, each partition is processed by one consumer, so the degree of parallelism equals the number of partitions. I use at-least-once delivery and commit after processing, so consumers must be idempotent, and I use an outbox to avoid losing events when writing to the DB and publishing to Kafka."

> Senior tip: monitor **consumer lag** (the gap between the latest offset and the processed offset) for each group. Steadily increasing lag is the earliest indicator that a consumer is slow or stuck, before users notice stale data.`,
    follow: ['How does Kafka guarantee ordering?', 'What problem does the outbox pattern solve?', 'How does Kafka differ from RabbitMQ?']
  },
  'primer-004': {
    q: 'Redis primer: what is Redis, which data types does it provide, and what is it commonly used for in a Java backend? How do you use caching correctly with Spring Boot?',
    a: `**Summary:** Redis is an **in-memory key-value data store**, very fast (usually under 1ms), supporting many data types (string, hash, list, set, sorted set, stream) and **TTL** (automatic expiration). Backends commonly use it for **caching**, **rate limiting**, **sessions**, **distributed locks**, **leaderboards**, and **counting**. Redis is usually **not the primary source of truth** (the DB is); it is an acceleration layer.

### Quick overview
A database is like a **warehouse** outside the city: complete and safe, but retrieving something takes time. Redis is like a **shelf right next to the checkout counter**: frequently sold items are kept there for immediate retrieval. The shelf is small (RAM is limited), so it should hold only frequently used items, and there must be a rule for removing expired items (TTL) to avoid selling stale goods.

### Terminology
- **TTL (time to live)**: a key lifetime; Redis automatically deletes the key when it expires.
- **Cache-aside**: the app checks the cache first; on a miss, it reads the DB and writes the result to the cache.
- **Eviction**: when RAM is full, Redis removes keys according to a policy (for example, allkeys-lru: remove keys that have not been used recently).
- **Persistence**: RDB (periodic snapshots) and AOF (a log of each command). These help recovery after a restart, but Redis still does not replace a DB.
- **Single-threaded** (command execution): each command is atomic. One slow command blocks all other commands.

### Data types and common uses
| Type | Example command | Used for |
|---|---|---|
| String | SET/GET, INCR, SET key v NX EX 30 | Cached objects (JSON), counters, simple locks |
| Hash | HSET/HGET | Objects with multiple fields (sessions, shopping carts) |
| List | LPUSH/RPOP | Simple queues, recent history |
| Set | SADD/SISMEMBER | Unique collections (users who liked an item) |
| Sorted set | ZADD/ZREVRANGE | Leaderboards, sliding-window rate limits |
| Stream | XADD/XREADGROUP | Event queues with consumer groups |

~~~bash
SET product:42 '{"name":"Tai nghe","price":990000}' EX 300   # cache for 5 minutes
GET product:42
INCR rate:user:7:202610281530        # count requests from user 7 during this minute
EXPIRE rate:user:7:202610281530 60
ZADD leaderboard 1500 "an" 1720 "binh"
ZREVRANGE leaderboard 0 9 WITHSCORES # top 10
~~~

### Caching with Spring Boot (cache-aside)
~~~java
@Service
class ProductService {
  @Cacheable(cacheNames = "product", key = "#id")     // return immediately if cached, without calling the DB
  public ProductDto get(long id) { return repo.findDto(id); }

  @CacheEvict(cacheNames = "product", key = "#id")    // evict the cache after updating the DB
  @Transactional
  public void updatePrice(long id, long price) { repo.updatePrice(id, price); }
}
// application.yml: spring.cache.type=redis, spring.cache.redis.time-to-live=5m
~~~
**Why evict instead of overwrite:** evicting and letting the next read reload from the DB is simpler and less error-prone, especially when multiple instances update concurrently.

### Common pitfalls
- **Not setting a TTL** → the cache grows indefinitely and stale data remains forever.
- **Cache stampede**: a hot key expires and 1,000 requests hit the DB simultaneously. Mitigations: slightly randomized TTLs, allowing only one request to reload (using a lock), or refreshing before expiration.
- **The KEYS * command in production** → scans everything and blocks Redis (single-threaded). Use SCAN instead.
- **Big key** (a list or hash with millions of elements) → slow commands that block Redis.
- **Treating Redis as the source of truth** for balances or inventory → data loss during failures. Important decisions must be based on the DB.
- **Sloppy distributed locking** ({{SETNX}} without a TTL, deleting another owner's lock) → see the Redis lock question in the Database section.

### Common follow-up interview questions
- How do cache-aside, write-through, and write-behind differ?
- How do you keep the cache and DB consistent during updates?
- Why is Redis fast despite single-threaded command execution? (Data in RAM, optimized data structures, I/O multiplexing, and no locking overhead.)

### One-minute spoken answer
"Redis is an in-memory key-value store with sub-millisecond latency, multiple data types such as string, hash, list, set, sorted set, and stream, and TTL support. In a backend, I use it for caching, rate limiting, sessions, distributed locks, and leaderboards, but the DB remains the source of truth. I use cache-aside: Cacheable for reads, and for updates I write to the DB and then evict the cache, always with a TTL. I watch out for cache stampedes when hot keys expire and avoid KEYS and big keys because Redis executes commands on a single thread."

> Senior tip: measure the **hit rate** of each cache name. A cache with a hit rate below roughly 50–60% often adds complexity and stale-data risk without significantly reducing DB load. Do not hesitate to remove it.`,
    follow: ['How do you keep the cache and DB consistent during updates?', 'What is a cache stampede and how do you handle it?']
  },
  'primer-005': {
    q: 'AWS primer for Java developers: what are the core services (IAM, VPC, EC2, ECS/EKS, Lambda, S3, RDS, SQS/SNS, CloudWatch), and how does a Spring Boot application typically run on AWS?',
    a: `**Summary:** AWS is a cloud provider: you rent servers, databases, storage, queues… **on demand and pay for what you use**, instead of buying and operating servers yourself. Java developers need to understand four groups:
- **Security/networking**: IAM, VPC, Security Group.
- **Running code**: EC2, ECS/EKS, Lambda.
- **Storing data**: S3, RDS, DynamoDB.
- **Connectivity/observability**: SQS, SNS, CloudWatch.

### Quick overview
AWS is like a **rental industrial park**:
- A **Region** is an industrial park in one city.
- An **Availability Zone (AZ)** is a separate factory building within that park: if one building catches fire, the others keep running.
- A **VPC** is the fence around your plot of land.
- **IAM** is the access-card system: who may enter which room.
- You rent machinery (EC2), storage space (S3), and data safes (RDS) by the hour.

### Core terminology and services
| Service | What it is | When a Java developer uses it |
|---|---|---|
| IAM | Identity and access management (users, roles, policies) | Granting the app permission to read S3, send to SQS… |
| VPC, Subnet, Security Group | Private network; public/private subnets; port-based firewall | Placing the app and DB in private subnets |
| EC2 | Virtual machine | Running an app in the traditional way |
| ECS / EKS | Running containers (ECS is an AWS-specific service; EKS is Kubernetes) | Running a Spring Boot Docker image |
| Lambda | Event-driven functions without server management | Small jobs, uploaded-file processing, webhooks |
| S3 | Virtually unlimited object (file) storage | Images, report files, backups |
| RDS / Aurora | Managed relational databases (Postgres, MySQL) | The app primary DB |
| DynamoDB | Managed key-value NoSQL | Key-based access at very high scale |
| SQS / SNS | Queue / pub-sub notifications | Decoupling asynchronous processing |
| CloudWatch | Logs, metrics, alarms | Monitoring and alerting |
| Secrets Manager | Secret storage (DB passwords, API keys) | Keeping secrets out of code |

### Typical architecture for Spring Boot
~~~text
Internet -> Route 53 (DNS) -> ALB (load balancer, HTTPS) [public subnet]
                                   |
                          ECS/EKS: 3 Spring Boot containers [private subnet, 2-3 AZs]
                             |            |               |
                    RDS Postgres     ElastiCache       SQS -> worker
                    (Multi-AZ)       (Redis)
The app reads secrets from Secrets Manager, writes logs/metrics to CloudWatch, and stores files in S3.
~~~

### Basic deployment steps
1. Create a VPC with public subnets (load balancer only) and private subnets (app, DB) spanning at least 2 AZs.
2. Place RDS Postgres in a private subnet, enable Multi-AZ, and configure the Security Group to allow only the app to connect to port 5432.
3. Build a Docker image and push it to ECR (the AWS registry).
4. Run it on ECS Fargate (no machines to manage) or EKS, behind an ALB.
5. Assign an **IAM role** to the task/pod (do not use access keys), granting only the required permissions, for example {{s3:PutObject}} on exactly one bucket.
6. Store the DB password in Secrets Manager; send logs and metrics to CloudWatch, and set alarms for 5xx errors and latency.

~~~java
// AWS SDK for Java v2: no access key is supplied: the SDK automatically obtains permissions from the container IAM role
S3Client s3 = S3Client.builder().region(Region.AP_SOUTHEAST_1).build();
s3.putObject(PutObjectRequest.builder().bucket("reports-prod").key("2026/10/report.pdf").build(),
             RequestBody.fromFile(Path.of("/tmp/report.pdf")));
~~~

### Common pitfalls
- **Hard-coding access keys in code or git** → they are scanned and abused (for crypto mining) within minutes. Always use IAM roles.
- **Public S3 buckets** → customer data exposure. Enable Block Public Access and share files using expiring presigned URLs.
- **A DB in a public subnet** or a Security Group open to 0.0.0.0/0 → password-guessing attacks.
- **Running in only one AZ** → an AZ failure takes down everything.
- **Forgetting a budget alarm** → surprise bills (NAT Gateway, data transfer, high log volume).
- **IAM policies using a wildcard ({{*}}) for everything** → violates least privilege.

### Common follow-up interview questions
- ECS vs. EKS vs. Lambda: when do you choose each?
- How do SQS and SNS differ, and how do they differ from Kafka?
- How can an app in a container call S3 without an access key?

### One-minute spoken answer
"For a Spring Boot app on AWS, I place an ALB load balancer in public subnets, run containers on ECS Fargate or EKS in private subnets across at least two AZs, and use Multi-AZ RDS Postgres as the DB, with Security Groups allowing access only from the app. Images are stored in ECR. Permissions to call S3 or SQS are granted through IAM roles following least privilege, never through access keys in code; the DB password is stored in Secrets Manager. Logs and metrics go to CloudWatch, with alarms for errors and latency, plus a budget alarm to control costs. Asynchronous work is sent to SQS for workers to process."

> Senior tip: in an interview, mention **cost**: NAT Gateway, cross-AZ data transfer, and CloudWatch logs are three items that often cause unexpectedly high bills. People with real operating experience always remember them.`,
    follow: ['ECS, EKS, and Lambda: when do you choose each?', 'How do you grant S3 access to an app without using access keys?']
  },
  'primer-006': {
    q: 'Observability primer: how do logs, metrics, and traces differ? How would you instrument a Spring Boot system with multiple services for observability?',
    a: `**Summary:** Observability is the ability to **answer "what is happening and why" from data emitted by the system itself**. The three pillars are:
- **Metric**: a number over time that tells you **whether there is a problem** (error rate, latency, CPU).
- **Trace**: the path of **one request** through multiple services, showing **where it is slow**.
- **Log**: a detailed event record, showing **exactly what happened**.

In Spring Boot: **Actuator + Micrometer** for metrics (exported to Prometheus/Grafana), **Micrometer Tracing/OpenTelemetry** for traces, and **JSON logs with a traceId** for logs.

### Quick overview
It is like a medical examination:
- Metrics are **vital signs** (heart rate, blood pressure): one look tells you whether things are okay.
- A trace is **imaging along a pathway**: it shows where the blockage is.
- Logs are the **detailed medical record**: read them to learn exactly what happened.

A good doctor checks the vital signs first, then narrows down the area and reads the details.

### Terminology
- **Micrometer**: the Spring ecosystem metric "facade" library, capable of exporting to many systems (Prometheus, CloudWatch…).
- **Prometheus / Grafana**: stores time-series metrics / builds dashboards and alerts.
- **OpenTelemetry (OTel)**: an open standard for collecting traces, metrics, and logs.
- **Span**: one unit of work in a trace (for example, "call the DB", "call payment-service"); multiple spans form a trace.
- **traceId / correlation id**: an identifier attached throughout a request and included in every service log so they can be joined.
- **MDC**: an SLF4J/Logback mechanism for automatically inserting the traceId into every log line.
- **RED**: Rate (number of requests), Errors, Duration (latency), the three basic metrics for each API.
- **SLO**: a quality objective, for example 99.9% of requests under 300ms over 30 days.
- **Cardinality**: the number of distinct values for a metric label. A label such as userId has extremely high cardinality and can overwhelm the metrics system.

### Step-by-step instrumentation
1. **Actuator + Micrometer Prometheus**: provides HTTP, JVM (heap, GC, threads), and connection pool (HikariCP) metrics out of the box.
~~~yaml
management:
  endpoints.web.exposure.include: health,info,prometheus
  metrics.tags.application: orders-service      # common label for filtering by service
  tracing.sampling.probability: 0.1             # sample 10% of traces to save costs
~~~
2. **Business metrics** for what management cares about:
~~~java
Counter.builder("orders.placed").tag("channel", channel).register(registry).increment();
Timer.builder("payment.call").register(registry).record(() -> paymentClient.charge(req));
// DO NOT tag userId/orderId: high cardinality overwhelms Prometheus
~~~
3. **Tracing**: add Micrometer Tracing with the OpenTelemetry bridge. Traces propagate automatically through RestClient/WebClient/Kafka and are sent to Tempo, Jaeger, or a cloud service.
4. **JSON logs** containing {{traceId}}, {{spanId}}, and the service name; aggregate them in one place (Loki, ELK, CloudWatch). Never log passwords or PII.
5. **A RED dashboard** for each service, plus JVM, DB pool, and consumer lag (if using Kafka).
6. **Alert on user-visible symptoms** (error rate, p95/p99 latency exceeding the SLO), not on everything (CPU at 70%).

### Investigating a sample incident
~~~text
1. Alert: p99 latency for API /checkout rises from 300ms to 4s       (metric)
2. Open a slow trace: span "payment-service POST /charge" takes 3.8s  (trace)
3. Filter payment-service logs by that traceId:
   "HikariPool-1 - Connection is not available, request timed out"   (log)
4. Conclusion: the payment-service DB pool is exhausted -> check slow queries / pool size
~~~

### Common pitfalls
- **Only logs, no metrics** → you must grep logs to discover that the system is failing, so detection is slow.
- **High-cardinality metric labels** (userId, URLs containing ids) → Prometheus consumes RAM, slows down, and may crash.
- **Logs without a traceId** → logs cannot be correlated across services.
- **Too many alerts** → "alert fatigue" causes people to ignore real alerts too.
- **Measuring averages instead of percentiles** → a 200ms average hides the 1% of users waiting 10s.

### Common follow-up interview questions
- Why use p95/p99 instead of the average?
- How do SLO, SLI, and SLA differ?
- How have you investigated a production incident using observability? (Prepare a STAR story.)

### One-minute spoken answer
"I use the three pillars. Metrics tell me whether there is a problem, using RED—rate, errors, and duration by percentile—for each API, plus JVM, connection pool, and business metrics through Actuator, Micrometer, Prometheus, and Grafana. Traces show which service is slow through Micrometer Tracing with OpenTelemetry, with sampling. JSON logs include a traceId for detailed investigation and are aggregated in one place. Alerts are based on SLOs and user-visible symptoms. I avoid high-cardinality labels such as userId and never log sensitive data."

> Senior tip: after resolving each incident, ask "which metric or alert should have warned us earlier?" and then add it. A good observability system is built incrementally from postmortems, not from a one-time configuration.`,
    follow: ['Why measure p95/p99 instead of the average?', 'How do SLO, SLI, and SLA differ?']
  },
  'primer-007': {
    q: 'MCP (Model Context Protocol) primer: what is MCP, what components does it include, and why would a backend developer build an MCP server?',
    a: `**Summary:** MCP is an **open standard** that lets AI applications (such as Claude Code, Claude Desktop, or your own app) connect to **external tools and data** through a common protocol. You build an **MCP server** to expose a system (DB, Jira, logs, internal APIs) as:
- **tools**: actions the AI can invoke;
- **resources**: data the AI can read;
- **prompts**: prompt templates.

Every MCP-compatible application can use that server, without a separate integration for each app.

### Quick overview
MCP is like **USB-C for AI**. Previously, every device had its own connector: every AI app needed a separate integration for Jira, the DB, and Drive. With MCP, you build one standards-based "device" (server), plug it into any MCP-compatible "machine" (client), and it works.

### Terminology
- **Host**: the application the user interacts with (Claude Desktop, Claude Code, IDE).
- **Client**: the component within the host that maintains a connection to one MCP server.
- **Server**: your program, which provides tools/resources/prompts.
- **Tool**: a function the AI can call, with a name, description, and input schema (JSON Schema), for example {{explain_query(sql)}}.
- **Resource**: data readable through a URI, for example a table schema or a document.
- **Prompt**: a parameterized prompt template provided by the server.
- **Transport**: how the client and server communicate: **stdio** (the server runs as a child process on the machine, suitable for local tools) or **HTTP** (Streamable HTTP, for a remote server). Messages use **JSON-RPC 2.0**.

### How it works
~~~text
User: "Why is the query fetching this month's orders so slow?"
  Claude (host) --list tools--> MCP server "db-inspector"
                <-- [describe_table, explain_query, slow_queries]
  Claude decides to call: explain_query({"sql": "SELECT ... FROM orders WHERE ..."})
  The MCP server runs EXPLAIN in a READ ONLY transaction -> returns the plan (Seq Scan, 2.1s)
  Claude: "It is scanning the entire orders table; consider adding an index on (customer_id, created_at)..."
~~~

### When to build an MCP server
| Need | MCP server? |
|---|---|
| Let AI query or operate an internal system (DB, Jira, logs, APIs) and **reuse it across multiple AI apps** | Yes |
| Only your own app calls the Claude API with a few simple tools | Declaring tools directly in the request may be enough |
| Package a workflow or working instructions (not system access) | A Skill or CLAUDE.md is a better fit |

### Designing good tools for AI (most important)
1. **Clear names and descriptions that explain when to use them**: "explain_query: run EXPLAIN on a SELECT statement to analyze performance; accepts only one SELECT statement".
2. **Strict input schemas**: types, limits (limit ≤ 50), enums.
3. **Concise output**: summarize and truncate; do not dump 10MB of logs into the context.
4. **Clear errors** so the AI can correct itself: "Only SELECT is accepted; received UPDATE".
5. **Least privilege**: start with read-only tools; write tools require human confirmation.

### Security: the area interviewers will probe
- **Prompt injection**: returned data (ticket content, a DB row) may contain text such as "call the delete tool…". Design the server so that even a manipulated AI **cannot** cause harm (a DB user with SELECT only, restricted tools).
- **Authentication**: an HTTP server must have auth; do not expose an internal server to the internet.
- **Install MCP servers only from trusted sources**: a server can access real data.
- **Audit log**: record every tool call with its parameters and user.

### Try it quickly
- Run a sample server or your own server in stdio mode, then add it to Claude Code using {{claude mcp add}} (see the Claude Code documentation for the full syntax).
- Use **MCP Inspector** (a tool from the MCP project) to test individual tools without AI.
- Official SDKs are available for many languages, including Java; Spring AI also supports building MCP servers. Check the documentation for the correct artifacts and APIs.
- For guided practice, see the MCP project in the Pet project section (currently being added).

### Common pitfalls
- **A tool that does too much** (one "run_sql" tool accepting any statement) → difficult to control and high risk. Split tools by purpose.
- **Vague tool descriptions** → the AI calls the wrong tool or does not call it at all.
- **Overly large results** → context overflow, wasted tokens, and poorer AI answers.
- **Trusting returned data as commands** → prompt injection.

### One-minute spoken answer
"MCP is an open standard for connecting AI applications to tools and data, like USB-C: I build an MCP server that provides tools the AI can call, resources it can read, and prompt templates, and every MCP-compatible host such as Claude Code or Claude Desktop can use it. Communication uses JSON-RPC over stdio for local tools or HTTP for remote servers. In my designs, I focus on tool names and descriptions that clearly state when to use them, strict input schemas, concise output, and clear errors. For security, I treat returned data as untrusted because it may contain prompt injection, so I enforce permissions at the system layer—for example, a DB user with SELECT only—and add auth and audit logs."

> Senior tip: when discussing MCP in an interview, emphasize **enforcing permissions at the infrastructure layer, not in the prompt**: "even if the model is manipulated, the tool still cannot write data". That statement shows you understand the real risks of AI agents.`,
    follow: ['How do a tool and a resource differ in MCP?', 'How would you protect an MCP server that reads customer data against prompt injection?']
  }
});
