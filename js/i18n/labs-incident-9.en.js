/*
 * English translation of js/data/labs-incident.js — task T1011. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-022 lab-incident-023 lab-incident-024
 */
App.i18n.content({
  'lab-incident-022': {
    title: 'Partner API call fails with SSLHandshakeException: expired certificate and missing intermediate chain',
    scenario: `**Context:** **payment-service** (Spring Boot 3.2, Java 17, running on Kubernetes - the container orchestration platform) calls the partner **VBK** API at {{https://api.vbk.example/payments}} over HTTPS using {{RestTemplate}} (Spring's HTTP client). The HTTPS connection uses **TLS** (Transport Layer Security - the protocol that encrypts the channel: the "padlock" in the browser). Java verifies the server's TLS certificate via a **truststore** (a store of CA - Certificate Authority, the organization that issues certificates - that Java trusts). The application uses the JDK's default truststore ({{\$JAVA_HOME/lib/security/cacerts}}), mounted into the container.

**Symptoms:** At **00:03 on 01/11/2026** (after midnight), every request to VBK started failing with {{javax.net.ssl.SSLHandshakeException: PKIX path building failed}}. Up to 23:59 on 31/10 the calls still succeeded. VBK confirmed "we didn't change any API code". The ops team ran {{openssl s_client}} (a command-line tool to test TLS connections/certificates) from inside the pod and found the server's presented certificate had expired; the certificate chain was also missing an **intermediate CA** (the intermediate CA - the certificate between the server's certificate and the root CA). Some browsers could still reach the site, but the Java client in the pod failed.

**Data collected:** Java stack trace, {{openssl s_client -showcerts}} output, expiry date, and the application's truststore/TLS configuration.`,
    questions: [
      'Explain the error PKIX path building failed / unable to find valid certification path to requested target. How does the TLS certificate chain work, and why does Java in the pod fail while the browser may still reach the site?',
      'Analyse the two issues in the artifact: expired certificate and missing intermediate CA. Does each issue alone cause a failure? Cite specific evidence.',
      'How do you handle the incident immediately to restore calls to VBK, and what is the long-term prevention design (certificate expiry monitoring, automatic renewal/distribution)?'
    ],
    hints: [
      'TLS uses a "chain of trust": the server certificate (leaf) is signed by the Intermediate CA, and the Intermediate CA is signed by the Root CA. The client only trusts the server if it can build a path from leaf up to a Root CA present in its truststore. PKIX path building failed means Java could not build a valid path.',
      'openssl s_client shows: verify error num=10 certificate has expired, notAfter Oct 31 16:59:59 2026 GMT (already past 00:03 on 01/11 UTC+7). The server only sends 1 certificate (Certificate chain has 0 s: ... api.vbk.example) - missing the intermediate "Example RSA Issuing CA 2", so openssl verify with only the CA bundle also reports unable to get local issuer certificate. Expiry definitely causes failure; missing intermediate also causes failure on clients that do not fetch it (Java usually does not). The browser may "hide" the error via cache/AIA (Authority Information Access) or a different session.',
      'Short term: coordinate with VBK to renew and send the full chain; temporarily, only within controlled scope, you may update the truststore/bundle if a CA is missing (but NEVER disable verification). Long term: expiry monitoring (blackbox_exporter/cert-manager/alert at 30-14-7 days), automatic renewal (ACM/Let us Encrypt + cert-manager), fullchain distribution, and a process for certificate changes.'
    ],
    answer: `**Summary:** The Java client fails with {{SSLHandshakeException: PKIX path building failed}} because it cannot build a **valid certificate trust chain** (certificate chain - the path from the server's certificate up to a root CA that Java trusts). The artifact shows two problems: (1) the {{api.vbk.example}} certificate **expired** at {{Oct 31 16:59:59 2026 GMT}} ({{openssl}} reports {{verify error:num=10:certificate has expired}}), so any client that validates correctly rejects it; (2) the server sends only the **leaf certificate** (the server's own certificate) and **misses the intermediate CA** ("Example RSA Issuing CA 2"), so even before expiry, Java struggles to build the chain to the root in its truststore. The immediate fix is for VBK to renew and configure **fullchain** delivery; prevention is certificate expiry monitoring plus automatic renewal/distribution.

### TLS/certificate chain mechanism (from the ground up)

- **What is TLS?** When Java calls {{https://...}}, it opens a TLS connection: the two sides agree on encryption and the server presents a **digital certificate** to prove "I really am api.vbk.example". The certificate is like the server's ID card, signed by a trusted organization (CA).
- **Chain of trust:**
  1. **Leaf (server cert):** the certificate for {{api.vbk.example}}, signed by the Intermediate CA.
  2. **Intermediate CA:** the intermediate certificate, signed by the Root CA. (Usually 1-2 intermediates.)
  3. **Root CA:** the root certificate, already present in the client's **truststore** (Java uses {{cacerts}}; the OS/browser has its own store).
- **Path building:** The client receives the certificate from the server, verifies each link's signature, and checks whether it can reach a Root CA it trusts. It also checks: still valid ({{NotBefore/NotAfter}}), correct hostname, not revoked (depending on config). If it cannot build a valid path → {{PKIX path building failed}} / {{unable to find valid certification path to requested target}}. (PKIX is the X.509 certificate validation standard.)
- **Why may the browser "reach" the site while Java fails?** (real-world trap)
  - The browser may **cache** intermediates seen before, or use **AIA** (Authority Information Access - a hint in the certificate to download the intermediate), or behave differently per session/machine. Java (JSSE - the JDK's TLS library) **does not depend** on browser cache and usually **does not fetch** intermediates itself; it needs the server to send the full chain or the intermediate to be in the truststore. So "the browser still shows green" does not mean the Java client is safe.
  - Also, an **expired** certificate must be rejected by any correctly validating client; if one machine still shows "green" it may be due to clock drift, cache, or a different session - trust {{openssl}} and the real time.

### Evidence from the artifact

- **Expiry:** {{openssl s_client}} reports {{verify error:num=10:certificate has expired}}, {{notAfter=Oct 31 16:59:59 2026 GMT}}, while the check time is {{Fri Nov 1 00:05:10 UTC 2026}} (already past expiry). This is the direct cause of handshake failure since 00:03.
- **Missing intermediate:** {{Certificate chain}} contains only {{0 s:CN = api.vbk.example}} (1 certificate). The {{issuer}} is {{Example RSA Issuing CA 2}} but the server does not send that CA's certificate. {{openssl verify}} with only {{ca-certificates.crt}} reports {{unable to get local issuer certificate}} (cannot find the issuing certificate). When given enough {{-untrusted intermediate2.pem}}, chain verification reaches {{OK}} (before expiry). Conclusion: **missing intermediate alone is also enough to break** a typical Java client; here it accompanies the expiry.
- **Java stack trace:** {{ValidatorException: PKIX path building failed}} → {{SunCertPathBuilderException: unable to find valid certification path to requested target}} matches exactly the inability to build a valid chain.
- **Configuration context:** the truststore is a snapshot {{jdk17-cacerts-2025-01}} in a ConfigMap, not auto-updated - not the cause of VBK's certificate expiry (that cert is managed by VBK), but a risk if a new CA is needed later.

### How to fix

*Short term (safe recovery):*
1. **Determine blast radius:** all requests to {{api.vbk.example}} fail TLS since 00:03. The app marks payments {{UNKNOWN}} (correct direction: a TLS error occurs before debit confirmation) - reconcile UNKNOWN transactions, do not retry blindly to avoid duplicates.
2. **Coordinate with VBK (owner of the server certificate):** renew/reissue the certificate for {{api.vbk.example}} and configure the server to send **fullchain** including leaf + intermediate (in the right order). Ask them to verify with {{openssl s_client -showcerts}} from outside.
3. **On our side:** after VBK fixes it, verify from inside the pod: {{openssl s_client -connect api.vbk.example:443 -servername api.vbk.example}} must report {{Verify return code: 0 (ok)}} and the chain must be complete. No Java code change is needed if fullchain is correct and the root CA is in {{cacerts}}.
4. **Absolutely do not** "fix temporarily" by disabling certificate verification ({{trust all}}, {{NoopHostnameVerifier}}, disabling SSL verify). That opens a serious security hole (an attacker could impersonate the server - man-in-the-middle). Only in extremely rare, controlled, time-limited cases consider adding the exact needed certificate/CA to a separate truststore.

*Long term (prevention):*
- **Certificate expiry monitoring:** track {{notAfter}} of critical endpoints and alert 30, 14, 7, 1 days in advance. Methods: Prometheus {{blackbox_exporter}} (TLS probe), a periodic job running {{openssl}}/libraries, or a certificate management service. Alert also when the chain is incomplete.
- **Automatic renewal and distribution:**
  - If we own the certificate: use **cert-manager** (Kubernetes) with Let's Encrypt/internal CA, or **AWS ACM** (AWS Certificate Manager) for ALB/CloudFront/API Gateway - ACM auto-renews certificates it issues. Always deploy **fullchain**.
  - If a partner owns it (like VBK): put it in the dependency list, require SLA/advance notice before expiry, and still monitor from our side.
- **Change process:** checklist includes fullchain, correct hostname/SAN, verify with {{openssl}} and with the real Java client, monitor TLS errors after deploy.
- **Truststore:** avoid freezing an old {{cacerts}} snapshot in a ConfigMap for too long; have a mechanism to update base image/JDK periodically. Consider using the OS/base image truststore that gets patched.

> Senior tip: When you see {{PKIX path building failed}}, do not jump to "missing CA in truststore". Run {{openssl s_client -showcerts -servername <host>}} and check three things: (1) is it expired, (2) does the server send the full chain (fullchain), (3) is the root in the client truststore. And remember: **never disable TLS verification** to "get through" temporarily - that turns an ops incident into a security incident.`,
    rubric: [
      'Correctly explain the TLS chain of trust (leaf → intermediate → root), the role of truststore/cacerts, the meaning of PKIX path building failed / unable to find valid certification path, and why the browser may differ from Java (cache/AIA, Java usually does not fetch intermediates).',
      'Cite two issues from the artifact: expired certificate (verify error 10, notAfter 2026-10-31 16:59:59 GMT) and missing intermediate (Certificate chain has only 1 cert, openssl verify reports unable to get local issuer certificate; passes with intermediate+root).',
      'Propose safe immediate handling: VBK renews and sends fullchain, re-verify with openssl/Java client, reconcile UNKNOWN payments; clearly state NOT to disable TLS/hostname verification.',
      'Propose prevention: expiry monitoring (alert at 30/14/7 days, blackbox_exporter), automatic renewal/distribution (cert-manager/ACM), fullchain process, truststore updates, separate metric/log for TLS errors.'
    ],
  },
  'lab-incident-023': {
    title: 'StatefulSet Redis/MariaDB stuck Pending after cluster migration: PVC not bound',
    scenario: `**Context:** payment-service (Spring Boot 3.2) uses Redis (cache) and MariaDB (relational database) running in Kubernetes as StatefulSet (a K8s controller for stateful workloads, where each pod has a stable name and its own volume). After migrating from the old cluster to the new cluster (same namespace), the Redis/MariaDB pods stay in Pending state and cannot mount their volumes. The app cannot connect to DB/cache, readinessProbe fails, traffic is removed from the Service.

**Symptoms:** {{kubectl get pods}} shows {{redis-0}} and {{mariadb-0}} Pending. {{kubectl get pvc}} shows PVC (PersistentVolumeClaim - a request for persistent storage) Pending with message "waiting for first consumer" or "no persistent volumes available for this claim and no storage class is set". {{kubectl get storageclass}} shows no default storage class. PVC events report "no persistent volumes available for this claim".`,
    questions: [
      'What is the root cause? Cite evidence from the artifact.',
      'How do you fix it, short-term and long-term?'
    ],
    hints: [
      'PVC Pending means the volume is not bound; check the storage class and PV.',
      'StatefulSet creates PVCs from the template; if there is no default storage class, the PVC cannot bind.'
    ],
    answer: `**Summary:** The PVC is Pending because there is no default storage class and no matching PV; you need to set storageClassName explicitly or create a default storage class, then recreate pods/PVCs correctly.

### Inner mechanism
PVC (PersistentVolumeClaim) is a pod's storage request. K8s must bind the PVC to a PV (PersistentVolume) or provision it dynamically via a StorageClass. StatefulSet creates PVCs from volumeClaimTemplates. If the PVC has no storageClassName and there is no default storage class, the controller cannot provision the volume → PVC Pending → pod Pending.

### Evidence
- pvc.txt: STATUS Pending, STORAGECLASS empty.
- storageclass.txt: no default storage class (none marked (default)).
- describe-pvc.txt: "no persistent volumes available for this claim and no storage class is set".

### Short-term fix
1. Create a default storage class or assign storageClassName in volumeClaimTemplates.
2. If old PVs exist from the previous cluster: create PVs pointing at the right volumes (EBS/Azure disk) with a matching storageClassName, then bind.
3. Delete the Pending pods so the StatefulSet recreates them after the PVC binds (do not delete the PVC if it still holds data).

### Long-term fix / prevention
- Always declare storageClassName explicitly in manifests.
- Set a default storage class in the cluster.
- Back up/restore data before migrating clusters (Velero).
- Validate manifests with kubeval/helm lint in the pipeline.

> Senior tip: PVC Pending is usually caused by a missing default storage class or a PV that does not match the access mode; do not delete the PVC hastily because that loses data.`,
    rubric: [
      'Explain PVC/PV/StorageClass and the bind/provision mechanism.',
      'Cite evidence: PVC Pending, empty storage class, event "no persistent volumes available".',
      'Propose fixes: set storageClassName or a default storage class, bind old PVs, do not delete PVC hastily.',
      'Propose prevention: explicit manifests, default storage class, backup before cluster migration.'
    ],
  },
  'lab-incident-024': {
    title: 'Ingress returns 502/503 after deploying a new Spring Boot version: empty endpoints',
    scenario: `**Context:** payment-service (Spring Boot 3.2, Java 17) deploys a new version on Kubernetes. Ingress (the HTTP traffic router into the cluster) uses ingress-nginx. After the deploy, users receive 502/503 from Ingress. ingress-nginx logs report "upstream connect error" / "no endpoints". {{kubectl get endpoints}} returns empty because the readinessProbe has the wrong port/path or the Service targetPort mismatches the containerPort.

**Symptoms:** curl to the host returns 502 Bad Gateway. ingress-nginx log: "upstream connect error or disconnect/reset before headers" and "no endpoints available". {{kubectl get endpoints payment-service}} is empty. {{kubectl get pods}} shows the pod Running but readinessProbe failing. describe pod shows the readinessProbe on the wrong port/path.`,
    questions: [
      'What is the root cause? Cite evidence from the artifact.',
      'How do you fix it, short-term and long-term?'
    ],
    hints: [
      'Empty endpoints means no pod is ready; check readinessProbe and targetPort.',
      'Ingress 502 usually means the upstream is unreachable.'
    ],
    answer: `**Summary:** Ingress returns 502 because a wrong readinessProbe port/path leaves the pod not ready → empty endpoints; fix the probe and targetPort, then rollout undo if needed.

### Inner mechanism
Ingress (nginx controller) routes traffic to a Service. The Service forwards only to pods whose readinessProbe passes (ready). If the probe uses the wrong port/path, the pod is not ready → empty endpoints → nginx returns 502/503. targetPort must match containerPort.

### Evidence
- endpoints.txt: ENDPOINTS <none>.
- describe-pod.txt: readinessProbe http://:8081/actuator/health, connection refused (app listens on 8080).
- ingress-log.txt: upstream connect error.
- service.yaml: targetPort 8080 (correct), but the probe is wrong.

### Short-term fix
1. Fix the readinessProbe to port 8080 and the correct path ({{/actuator/health}}).
2. Apply the manifest, wait for the pod to become ready.
3. If speed is needed: kubectl rollout undo deployment/payment.

### Long-term fix / prevention
- Add correct readinessProbe and livenessProbe to the manifest.
- CI pipeline: validate manifests (kubeval), run smoke tests after deploy.
- Canary/blue-green deploy, monitor error rate.
- Alert when endpoints are empty or 5xx rises.

> Senior tip: A 502 from Ingress is rarely an app crash - it is usually a wrong readiness/probe; always check endpoints before debugging the app.`,
    rubric: [
      'Explain Ingress → Service → Pod readiness and endpoints.',
      'Cite evidence: empty endpoints, wrong readinessProbe port, ingress log upstream connect error.',
      'Propose fixes: fix probe/targetPort, rollout undo.',
      'Propose prevention: correct probes, CI validation, canary, alerts.'
    ],
  }
});
