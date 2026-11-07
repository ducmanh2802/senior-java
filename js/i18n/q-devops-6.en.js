/*
 * English translation of js/data/q-devops.js — task T666. Format: js/core/i18n.js (content overlay).
 * ids: devops-031 devops-032 devops-033 devops-034 devops-035
 */
App.i18n.content({
  'devops-031': {
    q: 'After an open-source library was found to carry malicious code, the CISO demands: every image running on the production cluster must have an SBOM, must have been vulnerability-scanned, and must be signed by the official pipeline; Kubernetes must refuse to run any image that does not meet these conditions. How do you design the chain of SBOM (CycloneDX/Syft), scanning (Trivy/Grype), image signing (cosign) and blocking at admission?',
    a: `**Summary:** In CI, after the image is built and pushed, I take its **digest**, generate a **SBOM** in CycloneDX format with Syft, scan for vulnerabilities with Trivy (or Grype) and fail the pipeline according to a threshold, then use **cosign** to sign the image by digest (keyless, using the CI provider's OIDC) and attach the SBOM as a signed **attestation**. On the cluster, an admission controller (Kyverno {{verifyImages}} or the Sigstore policy-controller) checks that the signature comes from **exactly the pipeline identity** before allowing a Pod to start. Because new CVEs are published every day, SBOMs are stored centrally so that **running** images can be re-scanned.

### What risk each piece addresses
- **SBOM** (Software Bill of Materials): the list of every component inside the image — OS packages (glibc, openssl), the Java runtime, each jar in {{BOOT-INF/lib}} with its version and its purl identifier. When the next Log4Shell shows up, you query the SBOMs in a few minutes to learn which services are affected instead of grepping repository by repository.
- **Vulnerability scanning**: matches the components against a CVE database, answering the question "does this image have known vulnerabilities".
- **Image signing**: proves the image was produced by **your pipeline** and **was not modified** afterwards. Scanning cannot stop someone who has registry push rights from publishing a foreign image; a signature can.
- **Admission policy**: the enforcement point. Without this step the signature is decoration: anyone with {{kubectl apply}} rights can still run whatever image they want.

### The flow inside the pipeline
~~~bash
IMAGE=registry.bank.vn/payment
# 1. Build + push, take the digest (an immutable identity; a tag can be overwritten)
docker buildx build -t $IMAGE:1.8.0 --push --metadata-file meta.json .
REF=$IMAGE@$(jq -r '."containerimage.digest"' meta.json)
# 2. CycloneDX SBOM built from the image itself (sees both OS packages and jars)
syft $REF -o cyclonedx-json > sbom.cdx.json
# 3. Gate: fail only on severe vulnerabilities that ALREADY have a patch
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 $REF
# 4. Keyless signing: the CI's OIDC token is exchanged for a short-lived certificate (Fulcio), and the signature is recorded in a public transparency log (Rekor)
cosign sign --yes $REF
# 5. Attach the SBOM as a signed attestation that travels with the image in the registry
cosign attest --yes --type cyclonedx --predicate sbom.cdx.json $REF
~~~
On GitHub Actions the signing job needs {{permissions: id-token: write}} to obtain an OIDC token. Swapping Trivy for Grype also works: {{grype sbom:sbom.cdx.json --fail-on high}} scans directly from the SBOM.

### Why signing binds to the digest, and why keyless
- A cosign signature is bound to the **digest** (the sha256 of the manifest). Signing a tag is meaningless: overwrite the tag and it points at different content. The Deployment manifest should also reference the digest; Kyverno can rewrite tag into verified digest by itself ({{mutateDigest}}).
- **Keyless** means there is no long-lived private key that can leak. The short-lived certificate records the signer's **identity**, for example the workflow {{https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main}}. When verifying, you require exactly that identity, so an image signed from a feature branch or from a developer's laptop is rejected.
- An air-gapped environment cannot reach the public Fulcio/Rekor: use a key pair held in KMS/HSM (cosign supports AWS KMS, GCP KMS, Azure Key Vault, HashiCorp Vault) or run your own internal Sigstore deployment.

### Blocking at admission (Kyverno)
~~~yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-signed-images }
spec:
  webhookTimeoutSeconds: 30
  rules:
    - name: verify-cosign
      match:
        any:
          - resources: { kinds: [Pod] }
      verifyImages:
        - imageReferences: ["registry.bank.vn/*"]
          failureAction: Enforce      # older Kyverno releases: spec.validationFailureAction
          mutateDigest: true          # replace the tag with the verified digest
          attestors:
            - entries:
                - keyless:
                    issuer: https://token.actions.githubusercontent.com
                    subject: https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main
~~~

### Reasonable scan thresholds
| Scan result | Action |
|---|---|
| CRITICAL/HIGH **with** a patch available | Fail the build, bump the version and rebuild |
| CRITICAL with **no** patch yet | Do not block blindly: assess exploitability, record an exception with an **expiry date** and the person who approved it |
| MEDIUM/LOW | Report it, fold it into the periodic base-image upgrade cycle |
| New CVE on an image **already running** | Re-scan the stored SBOM daily ({{trivy sbom}}, OWASP Dependency-Track), open a ticket for the owner |

### Production pitfalls
- **The policy matches only the internal registry**: images from {{docker.io}} do not match {{imageReferences}}, so they pass unchecked. You need an additional rule allowing only the internal registry.
- **Rebuilding for each environment**: the digest changes and the signature no longer matches. Build once, promote by copying the manifest verbatim ({{cosign copy}} copies the signatures and attestations too).
- **The webhook is a failure point**: Kyverno is down while the webhook is in fail-closed mode and no Pod can be created, even while you are handling an incident. Run Kyverno HA (≥ 3 replicas), exclude system namespaces, and monitor webhook latency.
- **The Maven SBOM and the image SBOM are not the same thing**: the CycloneDX Maven plugin only sees Java dependencies, not glibc/openssl. Spring Boot 3.3+ can embed the application SBOM into the jar and expose it through {{/actuator/sbom}}; you still need the image SBOM for the OS part.
- **Trivy downloads the vulnerability database on every run**: the pipeline becomes slow and breaks when the network is unavailable; cache the database or mirror it inside CI.

> Senior tip: the real measure is the question "a Log4Shell-style CVE is published at 9 a.m. — by 9:30 do you have the list of services, versions and namespaces running that library?". Only centrally stored SBOMs can answer that. When I turn the policy on, I run it in **Audit** mode for 2–4 weeks to see who violates it (usually third-party images and sidecars), and only then switch to **Enforce** namespace by namespace.`,
    follow: [
      'How does SLSA provenance differ from an image signature, and which SLSA level is realistic for your team?',
      'A CRITICAL CVE with no patch appears in the base image right before the release window; how do you decide what to do?',
      'How do you handle third-party images (Redis, Kafka, sidecars) that were never signed by your pipeline?'
    ],
  },
  'devops-032': {
    q: 'Your team\'s Spring Boot image runs on a full JDK image, weighs close to 500 MB, and every scan reports dozens of CVEs. Compare the base image options for Java: a plain JRE (Ubuntu/Debian), distroless, a runtime you cut yourself with jlink, and Alpine (musl). Which one do you choose, and what do you give up in exchange when you need to debug on production?',
    a: `**Summary:** Production only needs a **JRE**, not a JDK (javac, jshell, build tools). The path most teams take: JRE on Debian/Ubuntu (easy, has a shell) → **distroless Java** (no shell, no package manager, few OS CVEs) → a **jlink** runtime containing only the modules the application needs, placed on a minimal base (smallest, but the easiest way to be missing a module at runtime). **Alpine** is small but uses **musl** instead of glibc, which can break native libraries and change DNS behaviour, so use it only after thorough testing. The shared price of a minimal image: no shell to {{kubectl exec}} into and no jcmd/jstack, so you must prepare a way to debug in advance.

### Which layers a Java image is made of
~~~text
+-----------------------------+  application layer: dependency jars, code (changes frequently)
+-----------------------------+  Java runtime: JDK (~300 MB) or JRE or a jlink runtime (~60-80 MB)
+-----------------------------+  OS userland: libc, ca-certificates, tzdata, shell, apt/apk...
~~~
Most of the CVEs a scanner reports live in the **OS layer**: the fewer packages there are, the fewer CVEs there are, and the fewer tools an attacker can use after compromising the container. The application layer (the jars) is something every base image leaves to you.

### Comparison
| Option | Size (estimate) | Debug | OS CVEs | Main risk |
|---|---|---|---|---|
| {{eclipse-temurin:21-jdk}} | ~450 MB | full shell, jcmd, jstack | many | carries the compiler and build tools for nothing |
| {{eclipse-temurin:21-jre}} (Ubuntu) | ~250 MB | has shell, apt; **no jcmd** | medium | still lots of OS packages |
| {{gcr.io/distroless/java21-debian12}} | ~200 MB | no shell; the {{:debug}} tag has busybox | few | {{sh -c}} cannot run |
| jlink runtime on a minimal base | ~100–150 MB | depends on the base | fewest | missing modules, which only surface at runtime |
| {{eclipse-temurin:21-jre-alpine}} | ~180 MB | has sh (busybox), apk | few | musl: native libraries, DNS |
The numbers are directional only; measure them again with {{docker images}} on your own image.

### jlink: cut the runtime down to exactly what you need
~~~bash
# In the build stage (eclipse-temurin:21-jdk). Split the Spring Boot jar (Boot 3.3+)
java -Djarmode=tools -jar app.jar extract --destination extracted
# Ask jdeps: which modules do the application plus its dependencies use
jdeps --ignore-missing-deps -q --recursive --multi-release 21 --print-module-deps --class-path 'extracted/lib/*' extracted/app.jar > modules.txt
# Add the modules jdeps cannot see (loaded through ServiceLoader/reflection), then build the runtime
jlink --add-modules $(cat modules.txt),jdk.crypto.ec,jdk.management --strip-debug --no-man-pages --no-header-files --compress=zip-6 --output /opt/jre
~~~
- **Why you have to add modules by hand**: jdeps analyses bytecode statically. It cannot see anything loaded dynamically: for example on JDK 21 the EC algorithm used by TLS lives in {{jdk.crypto.ec}} (from JDK 22 it is folded into java.base) — without it the TLS handshake breaks **at runtime**, not at build time. A smoke test suite (call HTTPS, connect to the DB, read a locale) running against the final image is mandatory.
- {{--compress=zip-6}} is the syntax from JDK 21; older releases use {{--compress=2}}.

### Distroless: the things that work differently
- There is no shell: the ENTRYPOINT must be in exec form, for example {{["java", "-jar", "/app/app.jar"]}}, and you cannot use environment variables inside the ENTRYPOINT. Pass JVM arguments through the {{JAVA_TOOL_OPTIONS}} or {{JDK_JAVA_OPTIONS}} variable in the Pod spec.
- A preStop of the form {{sh -c "sleep 10"}} will not run; use Kubernetes' built-in {{sleep}} action (enabled by default since 1.30).
- Use the {{:nonroot}} tag to run as UID 65532 instead of root.

### Debugging with no shell
~~~bash
# Attach an ephemeral container holding the full toolset, sharing the process namespace with the "app" container
kubectl debug -it pod/payment-7d9f8-x2k4q --image=eclipse-temurin:21-jdk --target=app -- bash
# Inside: ps shows the Java process; jcmd can only attach when it runs under the same UID as that process
~~~
A gentler option: enable the Actuator {{threaddump}} and {{heapdump}} endpoints on a **separate management port** that is not publicly exposed, so you can take a thread dump without needing any tool inside the image.

### Alpine and musl
- Temurin ships its own Alpine build, so the JVM itself runs fine.
- The risk sits in **JNI libraries** compiled for glibc (some Netty native transport builds, RocksDB, older snappy, fonts used for PDF export): {{UnsatisfiedLinkError}} at runtime.
- The musl DNS resolver handles search domains and resolver options differently from glibc (it ignores {{single-request-reopen}}), which makes DNS diagnosis on Kubernetes harder.
- Compared to distroless, Alpine saves only a few tens of MB and adds one more variable; for Java I do not choose it unless the whole company has standardised on it.

### Production pitfalls
- **Switching to a JRE image and only then finding out there is no jcmd/jstack**, right when you need a thread dump in the middle of an incident. Prepare in advance: Actuator, ephemeral containers, or JFR already enabled and writing to a volume.
- **Never rebuilding**: a minimal base still picks up new CVEs every month. Pin the base image by digest so builds are reproducible, and use Renovate/Dependabot to open PRs bumping the digest weekly.
- **Writing a heap dump into the container filesystem**: a small image does not save you from a 3 GB dump file pushing the Pod over its ephemeral-storage limit.

> Senior tip: moving from a JDK image to distroless usually cuts OS-level CVEs from a few dozen down to single digits — but that is the easy part. The real risk usually lives in the jars (Spring, Jackson, drivers). I present the security team two separate numbers: CVEs of the base image (solved by base selection and periodic rebuilds) and CVEs of the dependencies (solved by version bumps), so that nobody thinks "switching to distroless is the end of it".`,
    follow: [
      'How do you take a thread dump from a distroless container when there is no shell and no jcmd?',
      'Why does a native library run fine on Debian but throw UnsatisfiedLinkError on Alpine?',
      'How do CDS/AppCDS affect startup time and the way you package the image?'
    ],
  },
  'devops-033': {
    q: 'A 6-person team manages its AWS infrastructure with Terraform; the state file lives on individual laptops and is committed to Git. One day two people apply at almost the same time, and afterwards the plan wants to create a brand-new RDS that is in fact already running. Explain what happened, then reorganise things: remote state, locking, plan review in PRs, drift detection, and how you split modules and environments.',
    a: `**Summary:** The state is the "map" that connects Terraform code to real resources. With two parallel maps (the laptop and Git) and no lock, the later apply **overwrites** the state written by the earlier one: Terraform "forgets" the RDS and wants to create it again. The fix: a **remote backend** (S3 with versioning and encryption) with **locking**, only **CI** applies **the plan that was reviewed** in the PR, **split state by environment and by component** to shrink the blast radius, and run plans periodically to **detect drift**.

### What the state is and why it matters
- Terraform cannot tell by itself which resources on AWS it manages. It reads the state: the address {{aws_db_instance.main}} ↔ the real ID {{payment-prod-db}} together with every attribute.
- {{terraform plan}} compares three things: the **code** (what you want), the **state** (what was known last time) and **reality** (refreshed through the AWS API).
- The state carries a **serial** number that increases after every write. The state also contains sensitive values in plain text (passwords, outputs), so it must **never** be committed to Git.

### What happened
~~~text
09:00  An and Binh both hold state serial 40 (from Git)
09:10  An applies: creates the RDS, the state on An's laptop becomes serial 41 (contains the RDS). An has not pushed yet.
09:12  Binh applies: adds a security group, based on serial 40 -> Binh's state (without the RDS)
09:20  Binh pushes the state to Git first; An pulls, hits a conflict, and picks "Binh's version"
=> the state no longer contains aws_db_instance.main; the RDS is still running on AWS
=> plan: + aws_db_instance.main will be created (it will fail on a duplicate name, or create a second database)
~~~
Immediate remediation: **do not apply**; bring the RDS back into the state with {{terraform import}} or an {{import}} block (Terraform 1.5+), and then the plan must come out clean.

### Remote backend and locking
~~~text
terraform {
  backend "s3" {
    bucket       = "bank-tfstate-prod"
    key          = "payment/prod/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true   # locking via a .tflock file on S3 (Terraform 1.10+)
    # older configuration: dynamodb_table = "tf-locks" (being deprecated)
  }
}
~~~
- The bucket has **versioning** enabled (roll back to an earlier state when something breaks), blocks public access, encrypts with KMS, and only the CI role plus a break-glass account may write to it.
- The second person to run apply gets {{Error acquiring the state lock}} together with the Lock ID, who holds it, and since when. Use {{terraform force-unlock}} only when you are **certain** the process holding the lock is dead (for example a CI job that was killed).

### The plan-review process in a PR
~~~bash
terraform fmt -check && terraform validate
terraform plan -input=false -lock-timeout=5m -out=tfplan
terraform show -no-color tfplan > plan.txt            # posted on the PR so reviewers can read it
# Count resources that would be deleted or replaced: more than 0 requires an additional approver
terraform show -json tfplan | jq '[.resource_changes[] | select(.change.actions | index("delete"))] | length'
~~~
1. The reviewer reads the **plan**, not only the code diff: a single rename in the code can produce {{must be replaced}} (delete then recreate) for a database.
2. After the merge, CI applies **exactly the reviewed plan file** ({{terraform apply tfplan}}). If the state changed since the plan was produced, Terraform refuses the stale plan and demands a new one. Atlantis is the common way to automate the plan/apply loop through PR comments.
3. CI allows only **one job per state** to run at a time (concurrency group); the lock is the last layer of protection, not the only one.
4. Humans have no write permission on the prod environment; emergency access (break-glass) is audited.

### Detecting and handling drift
- **Drift** = reality differs from code/state, typically because someone edited a resource by hand in the console during an incident.
- A nightly job runs {{terraform plan -detailed-exitcode}}: exit code 2 means there are changes → alert. {{terraform plan -refresh-only}} shows only what changed from outside.
- Handling: a change that is correct goes **into the code**; a wrong one is applied over. Attributes owned by another system (the desired task count adjusted by autoscaling) are declared in {{ignore_changes}} inside the lifecycle block.

### Splitting modules and environments
~~~text
modules/                 # shared modules, released by git tag (v1.4.0, v1.5.0)
  rds/  vpc/  eks-service/
envs/
  dev/network/   dev/payment/      # each directory = one separate state
  prod/network/  prod/payment/     # prod pins the module at ?ref=v1.4.0, dev tries v1.5.0 first
~~~
- Small per-component states: plans run faster, locks contend less, and a failed apply affects only one piece.
- A **CLI workspace** shares the backend and the credentials; HashiCorp's own documentation advises against using it to separate environments that need different permissions. Prod should live in a **separate AWS account**.

| Risk | Countermeasure |
|---|---|
| Two applies at once | Lock + CI concurrency |
| State corrupted or lost | S3 versioning, never edit state by hand, {{terraform state pull}} for a backup before any state operation |
| Deleting a database by mistake | {{prevent_destroy}} in lifecycle, {{deletion_protection = true}} on RDS, a gate when the plan contains deletes |
| Renaming a resource causes destroy/create | {{moved}} blocks (Terraform 1.1+) |
| Secrets leaked through the state | {{manage_master_user_password = true}} so RDS keeps the password in Secrets Manager itself; restrict read access to the bucket |

### Production pitfalls
- Not committing {{.terraform.lock.hcl}} and not pinning provider versions: every person's machine plans to a different result.
- {{force-unlock}} while the other job is still running: two processes writing the same state.
- One giant state with thousands of resources: the plan takes 15 minutes, hits AWS API rate limits, and everyone is afraid to run it, so drift accumulates.

> Senior tip: I set a hard rule: **a plan containing delete or replace on a stateful resource** (RDS, S3, EBS, DynamoDB) requires two approvers and a written justification in the PR. This simple rule blocks the "one small parameter change recreates the database" class of incident — the kind a backup cannot recover fast enough to meet RPO.`,
    follow: [
      'How do you bring a resource that was created by hand in the console under Terraform management without recreating it?',
      'When do you use terraform_remote_state, and when is it better to share values through SSM Parameter Store?',
      'Compare Terraform with OpenTofu or AWS CDK when choosing an IaC tool for an organization?'
    ],
  },
  'devops-034': {
    q: 'A Java service calls a partner API over HTTPS. At peak, one Pod floods with "Too many open files", another reports "java.net.BindException: Cannot assign requested address", and the node shows tens of thousands of TIME_WAIT sockets. How do you diagnose this with ss, lsof, ulimit and /proc, and at which layer do you fix it: code, JVM, OS or infrastructure?',
    a: `**Summary:** Two different errors that usually share one root cause: **the code opens a new connection for every request**, or **never closes resources**. "Too many open files" (EMFILE) means the process hit its **file descriptor** limit — every socket is also a file descriptor. "Cannot assign requested address" (EADDRNOTAVAIL) means there are no **ephemeral ports** left to open a connection to the same destination, because a closed socket still sits in **TIME_WAIT for 60 seconds**. Diagnose by counting file descriptors by kind ({{/proc/PID/fd}}, lsof) and sockets by state and by destination ({{ss}}). The root fix belongs in code (share one client, use a connection pool, close the response); raising ulimit or tuning sysctl only moves the boundary.

### Background knowledge
- Everything a process opens (file, socket, pipe, epoll) is a **file descriptor**. The per-process limit is a soft/hard {{RLIMIT_NOFILE}} ({{ulimit -n}}). On Linux, HotSpot automatically raises the soft limit to the hard limit at startup, so the number that actually decides is the **hard limit**.
- A TCP connection is identified by the 4-tuple (source IP, source port, destination IP, destination port). When you call the **same destination** IP:443, only the source port varies, and it comes from the {{net.ipv4.ip_local_port_range}} range — by default 32768–60999, roughly **28 thousand ports**.
- **TIME_WAIT** belongs to the side that **closes the connection first**, and on Linux it lasts a fixed **60 seconds**. You cannot tune it with {{tcp_fin_timeout}} — that parameter is about FIN_WAIT_2, and confusing the two is a very common mistake.
- The arithmetic: 28 thousand ports / 60 seconds ≈ **470 new connections per second** to one destination. A service doing 800 RPS that opens a fresh connection for each partner call exhausts its ports in less than a minute.
- **CLOSE_WAIT**: the other side has already closed but **the application has not called close**. A growing CLOSE_WAIT count is almost always an application bug (the response body is never fully read or closed) and is a form of file descriptor leak.

### Diagnosing step by step
~~~bash
PID=$(pgrep -f payment.jar)                        # inside a container this is usually 1
grep -i "open files" /proc/$PID/limits             # the REAL soft/hard limits of the process
ls /proc/$PID/fd | wc -l                           # how many fds are open
lsof -nP -p $PID | awk '{print $5}' | sort | uniq -c | sort -rn | head   # by type: IPv4, REG, FIFO
ss -s                                              # overview of sockets by state
ss -tan state time-wait | wc -l
ss -tan state close-wait | wc -l
ss -tan state time-wait | awk '{print $4}' | sort | uniq -c | sort -rn | head   # the destinations opened/closed most often
sysctl net.ipv4.ip_local_port_range net.ipv4.tcp_tw_reuse
cat /proc/sys/fs/file-nr                           # system-wide fds: allocated / free / maximum
~~~
| Observation | Conclusion |
|---|---|
| fd count grows steadily over hours, many REG lines pointing at the same file | File leak: a stream is opened with no try-with-resources |
| Lots of CLOSE_WAIT toward the partner IP | Responses/connections are never closed |
| Tens of thousands of TIME_WAIT toward the same IP:443, few ESTABLISHED | One new connection per request, nothing reused |
| Very many ESTABLISHED and stable | Pool too large or the partner is slow: cap the pool, set timeouts |

### Typical code that causes this
~~~java
// WRONG: each request builds a new HttpClient -> a new pool, a new TCP connection + TLS handshake, zero reuse
public Quote fetch(String id) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    return parse(client.send(request(id), HttpResponse.BodyHandlers.ofString()).body());
}

// CORRECT: one shared client (thread-safe); keep-alive retains and reuses the connections
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();

// Another kind of fd leak: Files.lines keeps the file open until the stream is closed
try (Stream<String> lines = Files.lines(path)) {
    return lines.filter(l -> l.startsWith("ERR")).count();
}
~~~
With Spring, create **one** {{RestClient}}/{{WebClient}} bean with a configured pool and inject it; with Apache HttpClient always close the response or drain the entity so the connection returns to the pool.

### Where to fix it
| Layer | What to do | Note |
|---|---|---|
| Code | Share one client, bounded pool, timeouts, close responses | The root fix |
| Process limits | systemd: {{LimitNOFILE=65536}} in the unit; Docker: {{--ulimit nofile=65536:65536}}; Kubernetes: the Pod spec has **no** ulimit field, the value comes from the container runtime on the node | {{/etc/security/limits.conf}} applies only to login sessions through PAM, **not** to systemd services |
| Kernel | Widen {{ip_local_port_range}}; {{tcp_tw_reuse=1}} lets **outgoing** connections reuse sockets sitting in TIME_WAIT (requires TCP timestamps) | Do not look for {{tcp_tw_recycle}}: it was removed in kernel 4.12 because it broke clients behind NAT |
| Infrastructure | A NAT Gateway has a ceiling too: an AWS NAT Gateway supports roughly 55,000 concurrent connections to any single destination, and past that the {{ErrorPortAllocation}} metric rises | Many Pods behind one NAT all calling the same partner |

In Kubernetes, {{ip_local_port_range}} is in the "safe" sysctl group and can be set directly in the Pod:
~~~yaml
spec:
  securityContext:
    sysctls:
      - name: net.ipv4.ip_local_port_range
        value: "10240 65000"
~~~
{{tcp_tw_reuse}} is not in the safe group: you must enable {{--allowed-unsafe-sysctls}} on the kubelet, or set it on the node.

### Production pitfalls
- **Raising ulimit to 1 million to "make the error go away"**: the leak is still there, it just explodes later, and by then it can also exhaust the node's kernel memory for sockets.
- **Ignoring TIME_WAIT on the server side**: a server that closes first does hold TIME_WAIT sockets, but its port is fixed (8080) so it does not run out of ports; it only costs a little RAM.
- **Keep-alive with a client idle timeout longer than the partner's or the load balancer's**: the client reuses a connection the other side has already closed and gets "Connection reset". Set the client-side idle timeout shorter (LB at 60 seconds, client around 50 seconds).
- **A full conntrack table** on a Kubernetes node ({{nf_conntrack: table full}} in dmesg) produces symptoms that look like port exhaustion but is a different limit.

> Senior tip: put {{process_files_open_files}} and {{process_files_max_files}} (Micrometer already exports them through Actuator) on the dashboard and alert above 80% — an fd leak is a steady upward line for hours before it explodes, and catching it early costs one ordinary fix instead of a midnight hotfix. For port exhaustion I always start with one question: "where is the HTTP client created, and how many times?".`,
    follow: [
      'Why does TIME_WAIT exist at all, and what risk does disabling it with SO_LINGER = 0 create?',
      'How do you size the connection pool toward a partner API when the partner caps you at 200 concurrent connections?',
      'On Kubernetes, how does a full conntrack table show up, and how does it differ from running out of ephemeral ports?'
    ],
  },
  'devops-035': {
    q: 'A Spring Boot service on Kubernetes calls the API api.partner.com: p99 is normally around 120 ms but occasionally jumps to almost exactly 5 seconds, and the CoreDNS logs are full of NXDOMAIN queries like api.partner.com.payments.svc.cluster.local. Explain the search domain and ndots:5 mechanism, why the spike is exactly 5 seconds, and how you fix it.',
    a: `**Summary:** Inside a Pod, the file {{/etc/resolv.conf}} holds a list of **search domains** and {{options ndots:5}}: a name with **fewer than 5 dots** is treated as a "relative name", so the resolver appends each search domain in turn **before** it asks for the original name. {{api.partner.com}} has only 2 dots, so a single resolution generates 4–5 lookups, each for both an A and a AAAA record, and most of them return NXDOMAIN. The more UDP packets you send, the more likely one is dropped; when a packet is lost the glibc resolver waits for the **default 5-second timeout** before retransmitting — that is where the 5 seconds comes from. Fix it by lowering ndots for the Pods that mostly call outside, enabling **NodeLocal DNSCache**, sharing a connection pool and caching DNS sensibly in the JVM, and keeping CoreDNS adequately replicated.

### What resolv.conf looks like inside a Pod
~~~text
nameserver 10.96.0.10          # the ClusterIP of the kube-dns Service (CoreDNS)
search payments.svc.cluster.local svc.cluster.local cluster.local ap-southeast-1.compute.internal
options ndots:5
~~~
- The first three search domains are added by Kubernetes (the Pod's namespace is {{payments}}); the last one is inherited from the node (for example an EC2 instance).
- **Why Kubernetes picked ndots:5**: so that short names like {{orders}}, {{orders.shop}} and {{orders.shop.svc}} all resolve through the search list. The price is that external domain names get appended too.

### The resolver rule and the real number of queries
If the name has **at least ndots dots**, the original name is queried first; otherwise the search list is tried first and the original name only comes last.
~~~text
api.partner.com.payments.svc.cluster.local        A + AAAA -> NXDOMAIN
api.partner.com.svc.cluster.local                 A + AAAA -> NXDOMAIN
api.partner.com.cluster.local                     A + AAAA -> NXDOMAIN
api.partner.com.ap-southeast-1.compute.internal   A + AAAA -> NXDOMAIN (this one leaves for the VPC resolver)
api.partner.com                                   A + AAAA -> returns the IPs
=> 10 queries for one resolution, 8 of them useless
~~~

### Why exactly 5 seconds
1. glibc sends the A and the AAAA query **in parallel from the same UDP socket**.
2. On a node where kube-proxy runs in iptables mode, packets to the DNS ClusterIP pass through DNAT and the **conntrack** table. Two packets sent almost simultaneously can "race" while creating their conntrack entry, and one gets dropped.
3. The resolver gets no answer, so it waits for the {{timeout}} (5 seconds by default) before retransmitting → the HTTP request is slowed by almost exactly 5 seconds.
4. The more superfluous queries you send, the higher the chance of hitting one drop, which is why p99 has a 5-second "tail".

Secondary causes: too few CoreDNS replicas; and on AWS the VPC resolver limits roughly 1024 packets/second per network interface — an "NXDOMAIN storm" from several Pods on the same node hits that ceiling.

### How the JVM caches DNS
- Java resolves through the operating system's resolver, so it is subject to exactly the search/ndots rules above.
- {{InetAddress}} caches successful lookups for **30 seconds** by default (when no security manager is installed) and failed lookups for 10 seconds. Tune it with the {{networkaddress.cache.ttl}} property in the {{java.security}} file, or with {{Security.setProperty}} at startup.
- Do **not** cache forever (TTL -1): when the partner or an AWS load balancer changes its IPs, the application keeps calling the old IP until it restarts.
- A connection pool with keep-alive reduces how often resolution happens at all: a reused connection does not need DNS.

### The fixes
~~~yaml
spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"                    # names with >= 2 dots: query the absolute name first
      - name: single-request-reopen   # glibc: reduces the A/AAAA-shared-socket bug (musl ignores this option)
~~~
| Fix | Effect | Caveat |
|---|---|---|
| ndots 2 for Pods that mostly call outside | Removes the 8 wasted queries for {{api.partner.com}} | {{orders}} and {{orders.shop}} still go through the search list; a name like {{orders.shop.svc}} is now queried externally before the search list — so configure the fully qualified name {{orders.shop.svc.cluster.local}} |
| FQDN with a trailing dot {{api.partner.com.}} | No search-domain appending at all | Some HTTP clients put that dot into the Host/SNI header and break the certificate or the virtual host; usually only sensible for internal names |
| NodeLocal DNSCache | A DNS cache on every node; Pods query a link-local address and the traffic does not go through conntrack | One more DaemonSet to operate |
| CoreDNS: enough replicas (autoscaler), the {{cache}} plugin, the {{autopath}} plugin | With {{autopath}} CoreDNS tries the search list server-side, so the client sends a single query | {{autopath}} requires {{pods verified}} mode and costs extra RAM to track Pods |
| Keep-alive pool + JVM TTL of 30–60 seconds | Lower resolution frequency | Does not replace any of the fixes above |

### Verifying
~~~bash
kubectl exec -it payment-7d9f8-x2k4q -- cat /etc/resolv.conf
# netshoot ships dig; +search uses the search list, +showsearch prints each appending step
kubectl debug -it pod/payment-7d9f8-x2k4q --image=nicolaka/netshoot -- dig +search +showsearch api.partner.com
~~~
In Prometheus, watch {{coredns_dns_responses_total}} by the {{rcode}} label (the NXDOMAIN ratio) and {{coredns_dns_request_duration_seconds}}.

### Production pitfalls
- **Alpine images (musl)** handle search domains, ndots and resolver options differently from glibc, so identical configuration produces different behaviour; always verify on the exact image you ship.
- **Setting ndots 1 cluster-wide**: names like {{orders.shop}} are sent to the external resolver first — extra latency, and it leaks your internal service names outside the cluster.
- **Blaming the partner**: the trace only shows "the HTTP client took 5 seconds". Enable resolution timing in logs/metrics, or split out a DNS span, to actually see it.

> Senior tip: in a cluster that has never been tuned, NXDOMAIN usually accounts for most of the CoreDNS traffic — look at that ratio before adding replicas. When you see latency at **exactly a multiple of 5 seconds** (5 s, 10 s), think of the DNS resolver timeout immediately; when you see exactly 1 or 3 seconds, think of TCP SYN retransmit. A "round" number is the strongest clue in network diagnosis.`,
    follow: [
      'How does NodeLocal DNSCache work, and why does it avoid the conntrack race?',
      'Why is caching DNS forever in the JVM dangerous when calling an AWS ALB or RDS after a failover?',
      'How do you tell DNS latency apart from TLS handshake latency or waiting for a connection pool in a trace?'
    ],
  },
});
