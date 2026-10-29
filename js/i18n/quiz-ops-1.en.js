/*
 * English translation of js/data/quiz-ops.js — task T429. Format: js/core/i18n.js (content overlay).
 * ids: qz-devops-009 qz-devops-010 qz-devops-011 qz-devops-012 qz-devops-013 qz-devops-014 qz-devops-015 qz-devops-016 qz-devops-017 qz-devops-018 qz-devops-019 qz-devops-020 qz-devops-021 qz-devops-022 qz-aws-009 qz-aws-010 qz-aws-011 qz-aws-012 qz-aws-013 qz-aws-014 qz-aws-015 qz-aws-016 qz-aws-017
 */
App.i18n.content({
  'qz-devops-009': {
    q: 'After deploying a new build, the Pod stays in the {{ImagePullBackOff}} state and never runs. What is the most likely cause?',
    options: [
      'The kubelet cannot pull the image: wrong image name/tag, a tag that has not been pushed, or a private registry where the Pod lacks imagePullSecrets/read permission on the registry',
      'The Java application fails at startup, so Kubernetes retries pulling the image',
      'The liveness probe fails, so Kubernetes deletes the image from the node',
      'The node is out of CPU, so the scheduler cannot place the Pod'
    ],
    explain: `**Summary:** {{ImagePullBackOff}} means the container **was never created** because the kubelet could not pull the image; Kubernetes backs off the retries exponentially.

### How to investigate
~~~bash
kubectl describe pod my-api-7c9f   # look at Events: "manifest unknown", "unauthorized", "not found"
kubectl get pod my-api-7c9f -o jsonpath='{.spec.containers[*].image}'
~~~
- {{manifest unknown}} / {{not found}}: the tag is wrong or the pipeline has not finished pushing.
- {{unauthorized}} / {{denied}}: private registry, missing {{imagePullSecrets}}, or the node role (for example ECR) has no pull permission.

### Why the other options are wrong
- **Java application fails at startup**: at that point the image has already been pulled, the container runs and then dies, so the state would be {{CrashLoopBackOff}}, not ImagePullBackOff.
- **Liveness probe fails**: a probe only makes the kubelet restart the container; it never deletes the image and never causes a pull failure.
- **Node out of CPU**: when the scheduler cannot place the Pod, the Pod stays in {{Pending}} with a {{FailedScheduling}} event, so it never reaches the image-pull step.

> Senior tip: deploy by **digest** or an immutable tag (git SHA), never {{latest}}. The pipeline should update the manifest **only after** the image push succeeds, so "tag does not exist yet" errors almost disappear.`
  },
  'qz-devops-010': {
    q: 'The Dockerfile uses {{CMD java -jar app.jar}} (shell form). On every rolling update the Pod takes exactly 30 seconds to shut down, exits with code 137, and in-flight requests are cut. What is the root cause?',
    options: [
      'Java does not support SIGTERM, so Kubernetes always has to use SIGKILL',
      'Shell form runs {{/bin/sh -c}} as PID 1; the shell does not forward SIGTERM to the Java process, so when terminationGracePeriodSeconds (30s by default) runs out the kubelet sends SIGKILL',
      'The memory limit is too low, so the container is OOMKilled during shutdown',
      'The readiness probe has the wrong path, so Kubernetes kills the Pod after 30 seconds'
    ],
    explain: `**Summary:** with shell form, PID 1 is {{sh}}, not the JVM. A SIGTERM sent to PID 1 never reaches Java, the JVM never runs its shutdown hooks, and after 30 seconds the kubelet sends SIGKILL (137 = 128 + 9).

### How it works
1. Kubernetes deletes the Pod and sends **SIGTERM** to PID 1 of the container.
2. {{/bin/sh -c "java -jar app.jar"}}: many shells (dash, ash) do not forward signals to their child process.
3. When {{terminationGracePeriodSeconds}} runs out, the kubelet sends **SIGKILL**: no graceful shutdown, the connection pool is not closed, and in-flight requests are cut.

~~~text
# Wrong (shell form)          # Correct (exec form)
CMD java -jar app.jar         ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~
If you must use a startup script, its last line has to be {{exec java ...}} so the JVM replaces the shell as PID 1.

### Why the other options are wrong
- **Java does not support SIGTERM**: wrong; the JVM handles SIGTERM and runs shutdown hooks, and Spring Boot relies on that for graceful shutdown.
- **OOMKilled**: OOM also produces 137, but it does not consistently happen exactly 30 seconds after the delete command; {{kubectl describe}} would report {{Reason: OOMKilled}}.
- **Readiness probe is wrong**: a failing readiness probe only removes the Pod from the Service; it never kills the container.

> Senior tip: read {{Last State}} in {{kubectl describe pod}}: Reason {{Error}} + exit 137 + a shutdown time equal to the grace period is the classic sign of a signal that never reaches the JVM.`
  },
  'qz-devops-011': {
    q: 'You pushed a commit to the shared {{main}} branch that breaks things, and a teammate has already pulled it. What is the safest way to undo it?',
    options: [
      'Run {{git reset --hard HEAD~1}} and then {{git push --force}} to remove the commit from history',
      'Delete the main branch on the remote and push the previous state again',
      'Run {{git revert <sha>}} to create a new commit that undoes the change, then push normally',
      'Use {{git commit --amend}} to fix the bad commit and then push'
    ],
    explain: `**Summary:** with **shared** history, never rewrite it. {{git revert}} creates a new commit whose content is the inverse of the bad one, so history only moves forward and everyone pulls normally.

### Why revert is safe
~~~text
A -- B -- C(bad)                 before
A -- B -- C(bad) -- C'(revert)   after git revert C
~~~
A teammate's machine that already has C still matches the remote; the next pull simply receives C'.

### Why the other options are wrong
- **reset --hard + push --force**: rewrites history on the remote; anyone who pulled C diverges, and their next push can either bring C back or overwrite other people's commits. The main branch is usually also blocked by branch protection against force pushes.
- **Delete main and push again**: breaks every PR and protection configuration, and at heart it is still history rewriting.
- **commit --amend**: also creates a new commit that replaces C (with a new SHA), so you still have to force push, with the same problems as reset.

> Senior tip: to revert a merge commit use {{git revert -m 1 <merge-sha>}}. If you want the feature back after fixing it, you must **revert the revert**, otherwise Git considers the old commits already merged.`
  },
  'qz-devops-012': {
    q: 'On every rolling update of a Spring Boot Deployment, clients see a few dozen 502/connection-reset errors for a few seconds. Which two measures fix the root cause? (Choose 2)',
    options: [
      'Increase the number of replicas to 10 so the errors are spread across more Pods',
      'Have a readiness probe that reflects whether the app is ready to serve requests, so a new Pod only receives traffic once it has finished starting up',
      'Set {{maxUnavailable: 100%}} so the rollout finishes faster',
      'Add a preStop hook that waits a few seconds and enable graceful shutdown ({{server.shutdown=graceful}}) so the old Pod finishes its in-flight requests before terminating',
      'Disable the liveness probe during the deployment'
    ],
    explain: `**Summary:** rollout errors come from two sides: a **new** Pod receives traffic too early (missing readiness) and an **old** Pod terminates while the load balancer is still sending requests to it (missing preStop + graceful shutdown).

### How it works on the old Pod side
When a Pod is deleted, two things happen **in parallel**: the kubelet sends SIGTERM, and the control plane removes the Pod from the EndpointSlice, after which kube-proxy/Ingress updates. That removal takes a few seconds, so if the app exits immediately, requests arriving during that window are reset. {{preStop}} waits ~5–10 seconds to keep the app alive until the endpoint has been fully removed; after that, graceful shutdown (enabled by default since Spring Boot 3.4) waits for in-flight requests to complete.

### How it works on the new Pod side
Without a readiness probe the Pod is considered Ready as soon as the container starts, while Spring is still initializing the context → requests land on an app that is not ready yet. Use {{/actuator/health/readiness}}.

### Why the other options are wrong
- **More replicas**: only makes the error rate smaller; every Pod that gets replaced still causes errors.
- **maxUnavailable 100%**: shuts down all old Pods at once, causing worse downtime.
- **Disable liveness**: liveness has nothing to do with routing traffic; disabling it only removes the self-healing ability.

> Senior tip: make sure {{terminationGracePeriodSeconds}} is greater than the sum of preStop time + {{spring.lifecycle.timeout-per-shutdown-phase}}, otherwise SIGKILL arrives before the app finishes its work.`
  },
  'qz-devops-013': {
    q: 'A Linux server reports 100% full for the /var partition in {{df -h}}, but {{du -sh /var}} shows only 20 GB of 100 GB. You have just deleted an 80 GB log file with {{rm}}. What is happening?',
    options: [
      'The filesystem is corrupted; fsck must be run immediately',
      'du is miscounting because there is no root permission',
      'Linux needs a reboot to reclaim every deleted file',
      'A process (usually the app writing the log) still has the deleted file open; the inode is not freed until the file descriptor is closed'
    ],
    explain: `**Summary:** {{rm}} only deletes the file's **name** (the directory entry). The data keeps occupying disk as long as a process holds the file descriptor open; {{du}} walks by name so it does not see it, while {{df}} reads from the filesystem so it still reports full.

### How to find and fix it
~~~bash
sudo lsof +L1 | grep deleted        # list deleted files that are still open
# java  1234 app  12w  REG ... /var/log/app/app.log (deleted)
sudo truncate -s 0 /proc/1234/fd/12 # free the space immediately, no restart needed
~~~
Or restart the process so it closes the file.

### Why the other options are wrong
- **Filesystem corrupted**: this is normal Unix behavior; fsck is not needed and would not solve it.
- **du lacks permission**: without permission, du prints "Permission denied" errors, and the 80 GB gap matches exactly the file you just deleted.
- **A reboot is required**: a reboot only helps because it closes every process; closing just the process holding the file is enough.

> Senior tip: do not delete logs that are currently being written; use logrotate with {{copytruncate}} or let the app rotate them itself (Logback {{RollingFileAppender}}). In containers, write logs to stdout and let the runtime manage them.`
  },
  'qz-devops-014': {
    q: 'The Pods of the {{orders}} Deployment are all Running and Ready, but calling {{http://orders:8080}} from another Pod gets connection refused/timeout. {{kubectl get endpointslices -l kubernetes.io/service-name=orders}} shows no addresses at all. What is the most likely cause?',
    options: [
      'The Service selector does not match the Pod labels (for example {{app: order}} vs {{app: orders}}), so the Service has no endpoints',
      'CoreDNS is broken, so the name orders does not resolve',
      'The Pods lack a liveness probe, so they are not added to the Service',
      'A ClusterIP Service does not allow other Pods to connect; it must be changed to NodePort'
    ],
    explain: `**Summary:** a Service selects Pods by **label selector**. Empty endpoints while the Pods are Ready almost certainly means the selector does not match the labels (or they are in different namespaces).

### How to check
~~~bash
kubectl get svc orders -o jsonpath='{.spec.selector}'
kubectl get pods --show-labels | grep orders
kubectl get endpoints orders      # older command, still works
~~~
Also check that {{targetPort}} matches the port the app is listening on (a wrong targetPort still produces endpoints, but connections are refused).

### Why the other options are wrong
- **CoreDNS broken**: a DNS failure reports "unknown host", not refused/timeout, and it would not leave the EndpointSlice empty.
- **Missing liveness**: the condition for being added to endpoints is **readiness**, not liveness; the Pods are already Ready.
- **ClusterIP does not allow connections**: ClusterIP is exactly the type intended for traffic inside the cluster; NodePort is for exposing a service outside the node.

> Senior tip: use a shared set of standard labels ({{app.kubernetes.io/name}}, {{app.kubernetes.io/instance}}) through Helm/Kustomize instead of typing them by hand in each manifest; label mismatches are a very common error when refactoring a chart.`
  },
  'qz-devops-015': {
    q: 'A Java service on Kubernetes has {{limits.cpu: 1}}. Average CPU is only 40%, but p99 latency occasionally jumps to several hundred ms, especially when GC runs. Which explanation is most plausible?',
    options: [
      'The heap is too large so GC is always slow; -Xmx needs to be reduced',
      'The CPU limit is enforced through CFS quota in 100ms periods; when several threads (GC, requests) run together, the container exhausts its quota early and is throttled until the period ends',
      'The CPU request is too high, so the scheduler places the Pod on a slow node',
      'Kubernetes reduces the node CPU frequency when a Pod uses less than 50% CPU'
    ],
    explain: `**Summary:** low average CPU does not mean no throttling. A limit of 1 CPU = 100ms of CPU time per 100ms period; 8 GC/request threads running in parallel can burn the whole quota in ~12ms and then be **frozen** for the remaining ~88ms.

### How to confirm
Compare the cAdvisor metric {{container_cpu_cfs_throttled_periods_total}} with {{container_cpu_cfs_periods_total}}. A throttle ratio above 5–10% is usually enough to cause latency spikes.

### How to fix it
- Remove the CPU limit (keep the CPU **request** so the scheduler can place Pods and share fairly), or raise the limit.
- The JVM sees the CPU count from the limit: {{availableProcessors()}} = 1 makes the JVM choose SerialGC and small pools; you can set {{-XX:ActiveProcessorCount}} appropriately.

### Why the other options are wrong
- **Lower -Xmx**: a smaller heap makes GC run **more often**; the problem here is throttling, not heap size.
- **High CPU request**: the request only affects Pod placement and sharing under contention; it does not make the node "slow".
- **Kubernetes reduces CPU frequency**: Kubernetes does not control CPU frequency.

> Senior tip: many teams run latency-sensitive services with a CPU request but no CPU limit (while keeping a memory limit). Measure throttling before deciding; do not rely on average CPU.`
  },
  'qz-devops-016': {
    q: 'A GitHub Actions pipeline needs to deploy to AWS. Today an IAM user access key is stored in repository secrets. What is the currently recommended approach?',
    options: [
      'Keep the access key but rotate it manually every 90 days',
      'base64-encode the access key before storing it in secrets',
      'Use OIDC: the workflow has {{permissions: id-token: write}}, an IAM role trusts the provider {{token.actions.githubusercontent.com}} with a {{sub}} condition limiting repo/branch, and the job assumes the role to obtain temporary credentials',
      'Use the root account access key because it has enough permissions to deploy'
    ],
    explain: `**Summary:** use **OIDC federation**: on each run GitHub issues a short-lived ID token; AWS STS exchanges it for temporary credentials (usually 1 hour). There is no long-lived secret left to leak.

~~~yaml
permissions:
  id-token: write      # allow the job to request an OIDC token
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
      aws-region: ap-southeast-1
~~~
The role trust policy must include a condition on {{token.actions.githubusercontent.com:sub}} such as {{repo:my-org/orders:ref:refs/heads/main}}, otherwise any repository can assume it.

### Why the other options are wrong
- **Rotate the key every 90 days**: it is still a long-lived credential; leaking it within those 90 days is enough to cause damage, and the rotation is operational work.
- **base64**: that is only encoding, anyone can decode it; it adds no security.
- **Root access key**: violates the most basic AWS principle; the root account should not have access keys.

> Senior tip: split roles per environment and use GitHub Environments ({{sub}} such as {{repo:org/repo:environment:prod}}) with required reviewers, so only jobs that have been approved can assume the production role.`
  },
  'qz-devops-017': {
    q: 'A Spring Boot image is 900 MB because it is built on {{maven:3-eclipse-temurin-21}} and that same image is also used at runtime. Which two changes reduce the image size effectively? (Choose 2)',
    options: [
      'Multi-stage build: stage 1 uses a Maven/JDK image to build, stage 2 only COPYs the jar file (or the extracted layers) into a runtime image',
      'Add {{RUN apt-get clean}} in a separate RUN command after the packages have already been installed',
      'Use a slim runtime base image: JRE instead of a full JDK (for example {{eclipse-temurin:21-jre}}), distroless, or a runtime built with jlink',
      'Use the {{latest}} tag for the base image so you always get the smallest version',
      'Give the Docker daemon more memory when building'
    ],
    explain: `**Summary:** most of the size is Maven, the JDK, the {{.m2}} cache, and sources that are not needed at runtime. Multi-stage removes the whole build toolchain; a slim runtime base cuts the remaining redundant JDK parts.

~~~text
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre          # JRE only
COPY --from=build /src/target/app.jar /app/app.jar
USER 1000                            # do not run as root
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~

### Why the other options are wrong
- **apt-get clean in a separate RUN**: an image is a stack of immutable layers; files that already exist in a previous layer still take up space. To have any effect, cleanup must happen in the **same** RUN command that installed them.
- **latest tag**: unrelated to size, and it makes builds non-reproducible.
- **More daemon memory**: affects build speed/capacity, not the image content.

> Senior tip: a small image is not only about pulling faster when scaling; fewer packages also means fewer CVEs in scan reports. Combine it with Spring Boot layered jars so the dependency layer is cached and only the code layer changes on each deploy.`
  },
  'qz-devops-018': {
    q: 'The cluster uses GitOps (Argo CD auto-sync with self-heal enabled). A new build is bad, the on-call engineer runs {{kubectl rollout undo deployment/orders}}, and a few minutes later the bad version comes back. What is the correct rollback in this model?',
    options: [
      'Disable Argo CD permanently so kubectl takes precedence',
      'Run {{kubectl rollout undo}} repeatedly every minute via cron',
      'Delete the Deployment so Argo CD recreates it from scratch',
      'Revert the commit that changed the image tag in the config repository (the source of truth), so Argo CD syncs the cluster back to the old version'
    ],
    explain: `**Summary:** in GitOps, **Git is the source of truth**. Changing the cluster directly is drift; with self-heal enabled, Argo CD brings the cluster back to the state in Git, which is the bad version. The rollback must be done **in Git**.

### The correct process
1. Revert the commit that bumped the image tag (or set the old tag again) in the config repository, through a fast PR or an agreed emergency process.
2. Argo CD detects the change and syncs back to the old version; the Git history records who rolled back, when, and why.
3. In an emergency you can temporarily disable auto-sync for **that app only** and roll back with Argo CD, but you must bring Git back in line right afterwards.

### Why the other options are wrong
- **Disable Argo CD permanently**: throws away all the GitOps benefits (audit, reproducibility, drift protection) because of a single incident.
- **Cron rollout undo**: fights the controller; the state flaps back and forth.
- **Delete the Deployment**: Argo CD recreates exactly what is in Git (the bad version), and it also causes downtime.

> Senior tip: write a rollback runbook for GitOps before you need it. Many teams use Argo Rollouts with canary + analysis to abort automatically when metrics degrade, which cuts down manual rollbacks dramatically.`
  },
  'qz-devops-019': {
    q: 'A teammate says: "The DB password stored in a Kubernetes Secret is safe because it is encrypted." Which statement is most accurate?',
    options: [
      'False: by default a Secret is only base64-encoded; you need encryption at rest for etcd (for example a KMS provider), tight RBAC on reading Secrets, or an external secret manager',
      'True: a Secret is always AES-encrypted with a per-namespace key',
      'True: only cluster-admin can read a Secret, Pods cannot',
      'False: a Secret is always stored as plain text on the disks of every worker node, so it should never be used'
    ],
    explain: `**Summary:** the {{data}} of a Secret is only **base64** (encoding, not encryption). The real level of safety depends on how the cluster is configured: encryption at rest for etcd, RBAC, and how Pods consume the Secret.

### What you need to do
- Enable {{EncryptionConfiguration}} (preferably with a KMS provider; EKS supports envelope encryption with AWS KMS).
- RBAC: restrict {{get/list/watch}} on {{secrets}}. Note: whoever can **create a Pod** in a namespace can mount that namespace's Secrets and read them.
- Or keep the secret in AWS Secrets Manager/Vault and sync it with the External Secrets Operator / CSI driver.

### Why the other options are wrong
- **Always encrypted per namespace**: there is no such default mechanism.
- **Only cluster-admin can read it, Pods cannot**: Pods can read Secrets (that is the purpose of a Secret), and any subject with suitable RBAC can read them too.
- **Always plain text on every node's disk**: the kubelet only delivers a Secret to nodes that have a Pod using it and mounts it into tmpfs (RAM); the conclusion "never use it" is also too strong.

> Senior tip: also check the indirect leak paths: a Secret printed to logs when the app starts, sitting in Helm values committed to Git, or pasted into a ticket from {{kubectl get secret -o yaml}}.`
  },
  'qz-devops-020': {
    q: 'The {{feature/payment}} branch is being pushed to by 3 people. One of them rebases it onto main and then does {{push --force}}. What is the consequence and what should you do?',
    options: [
      'No problem, a rebase only changes commit order on the local machine',
      'Rebase rewrites the SHA of shared commits, so other people end up with a diverged history and may lose commits. On a branch several people use, merge main into the branch (or at least use {{--force-with-lease}} and warn the team first)',
      'Git automatically merges the commits from all 3 people, so nothing is lost',
      'Only the person who rebased is affected; everyone else keeps pushing normally'
    ],
    explain: `**Summary:** the golden rule: **never rebase commits that have been shared**. Rebase creates new commits with new SHAs; force push replaces the remote history, while everyone else's machine still has the old history.

### What happens
~~~text
remote before:  M1 -- A -- B        (B was pushed by a teammate)
you rebase onto a local copy that only has A:  M1 -- M2 -- A'
push --force:  the remote loses B
~~~
Teammates pull and run into a divergent history; if they force push again, your commits are lost.

### What to do instead
- Shared branch: {{git merge main}} into the branch and accept a merge commit.
- If you really must force push: {{git push --force-with-lease}} refuses when the remote has a commit you have not seen, and warn the team first.

### Why the other options are wrong
- **Only changes order on the local machine**: true before the push, but the force push has already put the change on the remote.
- **Git merges automatically**: force push overwrites, it does not merge anything.
- **Only the person who rebased is affected**: it is the other people whose history diverges and whose push gets rejected.

> Senior tip: rebase is great for tidying a **personal** branch before opening a PR; on shared branches, enable branch protection that blocks force pushes.`
  },
  'qz-devops-021': {
    q: 'When the platform team upgrades nodes (draining them one by one), the {{payment}} service with 3 replicas sometimes goes completely dark for a few minutes. Which two measures are most appropriate? (Choose 2)',
    options: [
      'Create a PodDisruptionBudget (for example {{minAvailable: 2}}) so evictions during a drain cannot take the number of ready Pods below the threshold',
      'Set {{restartPolicy: Never}} so the Pods are not restarted',
      'Use topologySpreadConstraints or podAntiAffinity so replicas do not sit on the same node/zone',
      'Raise {{terminationGracePeriodSeconds}} to 1 hour',
      'Use bare Pods (not created by a Deployment) so they are not drained'
    ],
    explain: `**Summary:** going dark happens because (1) all 3 replicas can be evicted at the same time when there is no PDB, and (2) several replicas sit on the same node, so draining one node removes many Pods. A PDB limits **voluntary disruption**; spreading reduces the damage from a single node/zone.

~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  minAvailable: 2
  selector: { matchLabels: { app: payment } }
~~~
{{kubectl drain}} uses the Eviction API, so it waits whenever an eviction would violate the PDB.

### Why the other options are wrong
- **restartPolicy Never**: a Deployment only accepts {{Always}}; and restarts have nothing to do with draining.
- **1 hour grace period**: only makes the drain hang longer; it does not stop many Pods from being shut down at once.
- **Bare Pods**: drain refuses them (it needs {{--force}}), and when they are deleted they are **not** recreated, which is worse.

> Senior tip: do not set a PDB of {{maxUnavailable: 0}} or {{minAvailable}} equal to the replica count; the drain then hangs forever and the platform team has to bypass the PDB, which defeats its purpose.`
  },
  'qz-devops-022': {
    q: 'On-call receives 200 alerts a week (CPU > 80%, heap > 70%, 1 Pod restart…), most of which need no action, and people are starting to ignore alerts. As tech lead, which direction is the right one?',
    options: [
      'Raise every threshold to 95% to reduce the number of alerts',
      'Move all alerts to email so they do not disturb anyone',
      'Define SLOs for the user journey (availability, latency) and page based on error budget burn rate; move cause-based alerts such as CPU/heap to dashboards or non-urgent tickets',
      'Hire more people so each person receives fewer alerts'
    ],
    explain: `**Summary:** page on **symptoms users feel** (SLOs), not on causes. Every page must require immediate action; everything else is a ticket or a dashboard.

### How burn-rate alerts work
An SLO of 99.9% over 30 days gives an error budget of 0.1%. Burn rate = how fast the budget is being spent relative to the even pace:
| Burn rate | Window | Meaning | Action |
|---|---|---|---|
| 14.4 | 1h (+5m confirmation) | 2% of the budget per hour | page |
| 6 | 6h (+30m) | 5% within 6h | page |
| 1 | 3 days | spending at the expected pace | ticket |
This multi-window style (from the Google SRE Workbook) catches failures quickly while keeping false alarms low.

### Why the other options are wrong
- **Raise thresholds to 95%**: still cause-based alerting; 95% CPU may be harmless, while a flood of 500 errors at 30% CPU still slips through.
- **Move to email**: important alerts get buried too, and now nobody reads them at all.
- **Hire more people**: it splits the noise, it does not reduce it; burnout still arrives.

> Senior tip: track the "actionable page" ratio every week; the usual target is fewer than 2 pages per on-call shift. Every alert should link to a runbook — if you cannot write a runbook for it, it probably does not deserve to page.`
  },
  'qz-aws-009': {
    q: 'A Spring Boot service running on ECS Fargate needs to read objects from an S3 bucket. What is the correct way to grant permission?',
    options: [
      'Create an IAM user and store the access key in an environment variable of the task definition',
      'Attach the S3 policy to the task execution role',
      'Make the bucket public-read so the service can read it',
      'Create a task role (taskRoleArn) with a policy that only allows {{s3:GetObject}} on the exact bucket/prefix; the AWS SDK picks up temporary credentials from the task automatically'
    ],
    explain: `**Summary:** use a **task role**: ECS hands temporary, auto-rotated credentials to the code inside the container; the AWS SDK for Java v2 finds them through the default credentials provider chain with no configuration.

### Two roles that are easy to confuse
| Role | Used by | Example permissions |
|---|---|---|
| Task **execution** role | ECS agent | pull images from ECR, write logs to CloudWatch, read secrets to inject into env |
| Task role | **your code** | S3, SQS, DynamoDB… |

~~~json
{ "Effect": "Allow", "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::invoice-bucket/reports/*" }
~~~

### Why the other options are wrong
- **Access key in env**: a long-lived credential, easily leaked through logs and {{describe-task-definition}}, and it does not rotate.
- **Execution role**: that role belongs to the ECS agent; code inside the container does not receive its credentials.
- **Public-read**: the whole internet can read the data; S3 Block Public Access blocks this by default anyway.

> Senior tip: add a bucket policy restricted by {{aws:SourceVpce}} (access through a VPC endpoint) for sensitive data, so even leaked credentials cannot be used from outside the VPC.`
  },
  'qz-aws-010': {
    q: 'A Lambda is attached to a VPC to reach RDS. Afterwards the Lambda cannot call a third-party API on the internet (timeouts), even though it was placed in a public subnet. What is the correct fix?',
    options: [
      'Put the Lambda in a private subnet whose route table sends {{0.0.0.0/0}} to a NAT Gateway (the NAT sits in a public subnet)',
      'Enable "Assign public IP" for the Lambda',
      'Increase the Lambda timeout to 15 minutes',
      'Attach an Internet Gateway directly to the Lambda'
    ],
    explain: `**Summary:** a Lambda ENI inside a VPC **has no public IP**, even in a public subnet, so a route to the Internet Gateway is useless. Traffic to the internet must go through a **NAT Gateway**.

### Diagram
~~~text
Lambda (private subnet) --route 0.0.0.0/0--> NAT GW (public subnet) --> IGW --> Internet
                         \--> RDS (private subnet)
~~~

### Why the other options are wrong
- **Assign public IP**: Lambda does not support assigning a public IP to its ENI.
- **Increase the timeout**: only makes the function wait longer before it still times out, and it costs more money.
- **Attach IGW to the Lambda**: an IGW is attached to a VPC, not to a function; and you still need a public IP to use it.

> Senior tip: a NAT Gateway charges per hour **and** per GB of data. If the Lambda only calls AWS services (S3, DynamoDB, SQS…), use VPC endpoints instead of going through NAT — cheaper and safer. Also, if a Lambda does not genuinely need a VPC, do not put it in one.`
  },
  'qz-aws-011': {
    q: 'You host static files (product images, JS, CSS) on S3, and need HTTPS with your own domain, caching close to users, and the bucket must **not** be public. Which architecture is correct?',
    options: [
      'Enable S3 static website hosting and make the bucket public-read',
      'Put CloudFront in front of the bucket, use Origin Access Control (OAC), and a bucket policy that only allows that CloudFront distribution to read',
      'Run Nginx on EC2 to proxy to S3',
      'Issue presigned URLs for every static file, expiring after 7 days'
    ],
    explain: `**Summary:** **CloudFront + OAC**: CloudFront signs requests to S3 with SigV4; the bucket policy only allows the {{cloudfront.amazonaws.com}} principal with an {{AWS:SourceArn}} condition equal to your distribution. The bucket stays private and users only go through CloudFront.

~~~json
{ "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::static-assets/*",
  "Condition": { "StringEquals": {
    "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1ABC" } } }
~~~
HTTPS with your own domain: an ACM certificate (it must be created in {{us-east-1}} for CloudFront).

### Why the other options are wrong
- **Website hosting + public-read**: violates the non-public requirement; the S3 website endpoint does not support HTTPS either.
- **EC2 + Nginx**: you take on the operations and scaling yourself, and there is no global edge cache.
- **7-day presigned URLs for static files**: the URLs change and break browser/CDN caching, which is needless complexity; presigned URLs are suited to per-user private files.

> Senior tip: OAC is the recommended replacement for OAI (the older approach) and supports buckets encrypted with SSE-KMS. Name files with a hash ({{app.3f9a1c.js}}) so you can cache them for a long time and do not need an invalidation on every deploy.`
  },
  'qz-aws-012': {
    q: 'Compare RDS PostgreSQL **Multi-AZ DB instance** (1 standby) with **read replicas**. Which two statements are correct? (Choose 2)',
    options: [
      'A Multi-AZ DB instance is used to scale reads because the standby receives SELECT queries',
      'The standby of a Multi-AZ DB instance is replicated synchronously and does not serve reads; its purpose is automatic failover',
      'Read replicas replicate asynchronously, so they have replica lag; reading right after a write may return stale data',
      'A read replica fails over automatically when the primary dies and loses no data',
      'Multi-AZ replicates asynchronously to another region'
    ],
    explain: `**Summary:** Multi-AZ (instance) is about **availability**, read replicas are about **read scaling**. Do not confuse the two purposes.

| | Multi-AZ DB instance | Read replica |
|---|---|---|
| Replication | synchronous, across AZs in the same region | asynchronous (can be cross-region) |
| Reads from the copy | no | yes |
| Failover | automatic, usually 1–2 minutes, endpoint unchanged | manual promote, endpoint changes |
| Data loss on failover | none (already committed synchronously) | may lose what has not been replicated |

### Why the other options are wrong
- **Multi-AZ for read scaling**: the standby of the DB instance form does not accept connections. (The **Multi-AZ DB cluster** form, with 2 readable standbys, is a different deployment type.)
- **Read replica fails over automatically with no data loss**: with RDS PostgreSQL a replica must be promoted; replication is asynchronous so data can be lost.
- **Multi-AZ async to another region**: Multi-AZ is within one region and synchronous; cross-region is the job of read replicas or Aurora Global Database.

> Senior tip: when reading from a replica, "write then read it back immediately" flows (read-your-writes) must go to the primary. Monitor the {{ReplicaLag}} metric and fall back to the primary when lag exceeds a threshold.`
  },
  'qz-aws-013': {
    q: 'Events of the same order ({{CREATED}}, {{PAID}}, {{SHIPPED}}) must be processed in order, but different orders can be processed in parallel. How do you use SQS?',
    options: [
      'SQS Standard with several consumers, because Standard guarantees ordering',
      'SQS FIFO with a single fixed MessageGroupId for every message',
      'SQS FIFO with {{MessageGroupId = orderId}}: order is preserved within each group, and different groups are processed in parallel',
      'SQS Standard with increasing DelaySeconds for each event'
    ],
    explain: `**Summary:** a FIFO queue guarantees ordering **within each message group**. Choose the group by the unit that needs ordering (orderId) so you get both ordering and parallelism.

### How it works
- While a message of a group is in flight, SQS does not deliver the next message **of that group** to another consumer; other groups are still delivered.
- Deduplication: {{MessageDeduplicationId}} (or content-based deduplication) removes duplicates within a 5-minute window.

~~~java
sqs.sendMessage(b -> b.queueUrl(url)
    .messageGroupId(orderId)                  // ordering per order
    .messageDeduplicationId(eventId)          // prevent duplicates on retry
    .messageBody(json));
~~~

### Why the other options are wrong
- **Standard guarantees ordering**: wrong; Standard is best-effort ordering and at-least-once (duplicates possible).
- **One fixed MessageGroupId**: ordering holds, but the whole queue becomes sequential, with only one message processed at a time.
- **Increasing DelaySeconds**: guarantees nothing; retries or a slow consumer still reorder events.

> Senior tip: FIFO has lower throughput than Standard (enable high throughput mode if needed). Many systems choose Standard + idempotent consumers + checking version/state in the DB, accepting reprocessing instead of depending on absolute ordering.`
  },
  'qz-aws-014': {
    q: 'A subnet has a custom Network ACL: inbound allows TCP 443 from {{0.0.0.0/0}}, outbound only allows TCP 443. The EC2 security group allows inbound 443. Clients still time out. Why?',
    options: [
      'Security groups are stateless, so outbound must also be opened',
      'A NACL is stateless: the server response leaves toward the client ephemeral port (1024–65535), so the outbound NACL must allow that port range',
      'Port 80 must be opened because HTTPS always starts with HTTP',
      'NACLs only apply to traffic between subnets, so this cannot be the cause'
    ],
    explain: `**Summary:** a **security group is stateful** (if you allow traffic in, the response is automatically allowed out), a **NACL is stateless** (each direction is evaluated independently). An HTTPS response has source port 443 but a **destination** port equal to the client's ephemeral port, so the outbound NACL blocks it.

~~~text
Client 203.0.113.5:51734  --->  EC2:443     (inbound NACL: 443 OK)
EC2:443  --->  203.0.113.5:51734            (outbound NACL: destination 51734, only 443 allowed -> DROP)
~~~
Fix: make the outbound NACL allow TCP 1024–65535 toward clients.

### Why the other options are wrong
- **SG is stateless**: the opposite; SGs are stateful, so allowing inbound 443 is enough for the response.
- **Port 80 must be open**: HTTPS performs the TLS handshake directly on 443 and does not need port 80 (an HTTP→HTTPS redirect is a different thing).
- **NACLs only apply between subnets**: NACLs apply to all traffic entering and leaving the subnet, including traffic from the internet.

> Senior tip: most systems leave NACLs at the default (allow all) and control access with security groups that reference each other (the ALB's SG as the source for the app's SG). Use VPC Reachability Analyzer or Flow Logs (look for {{REJECT}}) to diagnose instead of guessing.`
  },
  'qz-aws-015': {
    q: 'Security requirement: the RDS password must rotate automatically on a schedule, and the Spring Boot app on ECS must not go down during rotation. What is the right approach?',
    options: [
      'Store the password in AWS Secrets Manager and enable rotation; the app reads the secret through the SDK with caching, and when a DB login fails it refreshes the secret and retries',
      'Hard-code the password in application.yml, change it by hand every quarter and redeploy',
      'Store it as plain text in an environment variable of the task definition',
      'Store it in a public S3 bucket but give the file an unguessable name'
    ],
    explain: `**Summary:** Secrets Manager has built-in rotation for RDS (a Lambda rotation function, or managed rotation when you let RDS manage the master password). On the app side you need to **read the secret dynamically and know how to refresh**, otherwise it keeps using the old password after rotation.

### Common mistakes
- Injecting the secret into env at task start means a running task keeps the old value: you need a refresh mechanism (a cache with TTL, retry after an authentication failure) or a rolling restart after rotation.
- The **alternating users** strategy (two DB users rotated in turn) keeps open connections from being dropped the moment the password changes.
- The connection pool (HikariCP) keeps old connections: already-open connections keep working; only new connections need the new password.

### Why the other options are wrong
- **Hard-code + manual change**: the secret lives in Git and the image; manual rotation is easy to forget and needs a redeploy.
- **Plain text env**: anyone with {{ecs:DescribeTaskDefinition}} can read it, and it does not rotate.
- **Public S3 with an unguessable name**: security through obscurity; public data is public.

> Senior tip: consider IAM database authentication for RDS (a 15-minute token instead of a password), but be aware of the rate limit on creating new connections. Parameter Store SecureString does not have the built-in rotation that Secrets Manager has.`
  },
  'qz-aws-016': {
    q: 'A Lambda on Java 21 using Spring Boot has a 6–8 second cold start, which hurts a synchronous API. Which option reduces cold start most effectively with the least code change?',
    options: [
      'Set reserved concurrency so the Lambda always has a warm environment',
      'Enable Lambda SnapStart: Lambda snapshots the initialized environment (after init) and restores it on cold start; note that unique data (random seeds, connections) must be re-created after restore',
      'Increase the function timeout to 60 seconds',
      'Switch to the arm64 architecture because Graviton has no cold start'
    ],
    explain: `**Summary:** a Java cold start is mostly **init** time (class loading, creating the Spring context). SnapStart runs init once when a version is published, takes a Firecracker microVM snapshot, and later cold starts only have to restore it, often dropping below 1 second.

### Things to watch when using SnapStart
- It applies to **published versions/aliases**, not {{$LATEST}}.
- State that is "frozen" in the snapshot is shared across environments: random numbers, unique IDs, network/DB connections. Re-create them after restore (CRaC runtime hooks {{afterRestore}}).
- You can "prime": call the main code path in {{beforeCheckpoint}} so that JIT and class loading are already captured in the snapshot.

### Why the other options are wrong
- **Reserved concurrency**: it only **caps/reserves** the maximum number of instances; it does not pre-initialize environments. The feature that does that is provisioned concurrency (and it costs money continuously).
- **Increase the timeout**: does not make init faster, it only allows a longer wait.
- **arm64 has no cold start**: Graviton is cheaper and can be slightly faster, but it still has cold starts.

> Senior tip: measure first using {{Init Duration}} in the REPORT log. If the API needs stable p99 latency, consider running Spring Boot on ECS/Fargate instead of forcing it into Lambda.`
  },
  'qz-aws-017': {
    q: 'An API behind an Application Load Balancer returns many HTTP 504s for the report-export endpoint, while the other endpoints are fine. Which explanation is most plausible?',
    options: [
      'The ALB is overloaded and should be replaced by a Network Load Balancer',
      'The target returns a 500 error and the ALB turns it into a 504',
      'The ALB security group blocks port 443',
      'The target takes longer to respond than the ALB idle timeout (60 seconds by default), so the ALB closes the connection and returns 504 Gateway Timeout'
    ],
    explain: `**Summary:** a 504 from an ALB means the ALB **did not receive a response from the target in time**: either it could not connect within the connection timeout, or the target stayed silent longer than the idle timeout (60s by default). Only one heavy endpoint failing is a clear sign of a request that runs too long.

### How to tell them apart
- The {{HTTPCode_ELB_5XX_Count}} metric (errors generated by the ALB) is different from {{HTTPCode_Target_5XX_Count}} (errors returned by the app).
- ALB access log: {{target_processing_time}} = -1 together with a 504.

### The right fix
Do not just raise the idle timeout: move report export to **asynchronous processing** (return 202 + jobId, a worker creates a file on S3, the client polls or gets a notification, and downloads it with a presigned URL).

### Why the other options are wrong
- **ALB overloaded**: the ALB scales itself; overload would affect every endpoint, not just one.
- **500 turned into 504**: the ALB passes the target's 500 through to the client as-is (counted in Target_5XX); it does not change the code.
- **SG blocks 443**: then every request would fail from the start, not just the report endpoint.

> Senior tip: if you must raise the ALB idle timeout, remember to set the backend server's keep-alive timeout **higher** than the ALB idle timeout, otherwise you get sporadic 502s when the server closes a connection the ALB is reusing.`
  }
});
