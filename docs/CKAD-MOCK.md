# CKAD mock exams + labs (#/ckad) — schema for `window.CKAD_EXAMS` and `window.CKAD_LABS`

Hands-on mock exams and labs in the style of the real CKAD (Certified Kubernetes Application Developer:
performance-based, terminal only). The real exam is under NDA: **never copy or claim "real exam" questions**.
Write original tasks that test the same skills at the same difficulty. Checked by `scripts/check-ckad.js`
(run by `scripts/validate.js`).

Format of the real exam (reference, Linux Foundation pages): 2 hours, about 15–20 tasks, each with a weight, pass 66%,
several clusters/contexts, kubernetes.io docs allowed. Domains (CNCF CKAD curriculum, names used in `domain`):

| `domain` | CNCF name | weight |
|---|---|---|
| `Design & Build` | Application Design and Build (images, Jobs/CronJobs, multi-container: init/sidecar, volumes) | 20 |
| `Deployment` | Application Deployment (rolling update/rollback, blue-green/canary with Deployments + Services, Helm, Kustomize) | 20 |
| `Observability & Maintenance` | Application Observability and Maintenance (probes, logs, events, kubectl debug, API deprecations, monitoring with top) | 15 |
| `Environment, Config & Security` | Application Environment, Configuration and Security (ConfigMap, Secret, ServiceAccount, SecurityContext, requests/limits, ResourceQuota, LimitRange, RBAC basics, CRD/operators usage) | 25 |
| `Services & Networking` | Services and Networking (Service types, Ingress, NetworkPolicy, troubleshooting connectivity) | 20 |

## Practice environment

Everything runs on one kind cluster on the learner's machine (no kubeadm tasks in CKAD):
`kind create cluster --name ckad --config kind-ckad.yaml` (1 control plane + 2 workers), context `kind-ckad`.
Tasks that need extras (ingress-nginx, metrics-server, Calico for NetworkPolicy, helm, docker/podman for images)
install them in `setup` or say so in `task`. `env` is always `'kind'`.

## Mock exams: `js/data/ckad-mock-N.js`, one exam per file

```js
(window.CKAD_EXAMS = window.CKAD_EXAMS || []).push({
  id: 'ckad-1', title: 'Đề thi thử CKAD số 1', minutes: 120, passPct: 66,
  intro: `markup: môi trường (kind config ~~~yaml), cài thêm gì, alias, cách chạy setup/verify`,
  tasks: [ ...15–20 tasks, weights sum to exactly 100, each domain within ±7 of its weight ]
});
```

Task fields:

| field | rule |
|---|---|
| `id` | `ckad-<N>-NN` (01, 02… in order) |
| `no` | 1..n in order |
| `domain` | one of the 5 names above, exactly |
| `weight` | integer 2–13; sum per exam = 100 |
| `env` | `'kind'` |
| `minutes` | suggested time 2–15; sum per exam ≤ 120 |
| `title` | ≤ 90 chars |
| `task` | markup ≥ 200 chars, Vietnamese with diacritics. Starts with "Context: {{kubectl config use-context kind-ckad}}". Exact names, namespace, image, file paths (answers written to {{/opt/ckad/...}}), like the real exam |
| `setup` | bash, idempotent (`kubectl apply`, `--dry-run=client -o yaml \| kubectl apply -f -`, `\|\| true`) |
| `verify` | bash printing `PASS <name>` / `FAIL <name>: <detail>` per check and last line `RESULT <passed>/<total>`. Check behaviour (pod Ready, rollout revision, `kubectl auth can-i`, curl from a test pod, file content) |
| `solution` | markup ≥ 300 chars: commands (~~~bash), YAML (~~~yaml), why, and an exam time-saving tip |
| `refs` | optional ≤ 3 `{type:'doc', title, url}` on kubernetes.io |
| `tags` | optional |

Script rules (inside template literals): no backtick, no `${` (use `$VAR`, `$(cmd)`), backslash written `\\`,
must pass `bash -n` (the checker runs it), touch nothing outside the cluster except `/opt/ckad/`.
Every resource name used by `verify` must appear in `task`.

## Labs: `js/data/ckad-labs-N.js` → `window.CKAD_LABS`

12 modules, untimed practice. `ckad-labs-1.js` modules 1–4, `ckad-labs-2.js` 5–8, `ckad-labs-3.js` 9–12.

```js
(window.CKAD_LABS = window.CKAD_LABS || []).push({
  id: 'ckad-lab-05', order: 5,
  title: '…', summary: '40–300 chars',
  concepts: `markup ≥ 800 chars: khái niệm + VÌ SAO, cheat sheet lệnh (~~~bash), bẫy hay gặp trong đề`,
  videos: [{ title: '…', url: 'https://www.youtube.com/watch?v=…', note: 'xem đoạn nào, vì sao' }],   // 1–3, xem dưới
  tasks: [ ...4–8 tasks, easy → hard, the last one combines the module's skills ]
});
```

### `videos` (bắt buộc cho mỗi lab module)

`videos: [{ title, url, note? }]`, 1–3 video hướng dẫn, kiểm tra bởi checker:
- `url` dạng `https://www.youtube.com/watch?v=<ID>` (được thêm `&t=<giây>s` để nhảy tới đoạn liên quan).
- **Chỉ dùng ID có trong `scripts/videos-verified.js`** (đã kiểm chứng bằng oEmbed). Không đoán ID: AI hay bịa ID video, checker chặn mọi ID ngoài danh sách. Cần video khác thì ghi đề xuất vào `## Notes` của task.
- `title` chép đúng tên video trong danh sách (không có `[` `]`); `note` ≤ 160 ký tự, tiếng Việt: xem đoạn nào, vì sao hữu ích (ví dụ "phút 10–25: demo init container chờ DB").
- Chọn video khớp chủ đề (cột thứ 3 trong danh sách), video chuyên đề trước, khoá học tổng quan sau.

Lab task = exam task **without** `weight`, plus `level: 'easy' | 'medium' | 'hard'` and `hints: [1–3 strings]`;
id `ckad-lab-NN-MM`. Namespace per lab `lab<NN>`, answer files `/opt/ckad/lab<NN>-<MM>.txt`.

Modules:
1. kubectl tốc độ: imperative (run/create/expose/set), --dry-run=client -o yaml, explain, alias, context/namespace
2. Pod design: labels/selectors/annotations, multi-container (init container, sidecar native — restartPolicy: Always trong initContainers từ 1.29, adapter), shared volume emptyDir
3. Jobs và CronJobs: completions, parallelism, backoffLimit, activeDeadlineSeconds, schedule, concurrencyPolicy, suspend, history limits
4. Container image: Dockerfile, build/tag/save bằng docker hoặc podman, imagePullPolicy, dùng image local trong kind (kind load docker-image)
5. Deployment: rolling update (maxSurge/maxUnavailable), rollout status/history/undo, pause/resume, record change-cause bằng annotation
6. Blue-green và canary bằng Deployment + Service selector, chia tỉ lệ theo số replica
7. Helm (install/upgrade --set/-f, rollback, list -A, template, show values) và Kustomize (apply -k, overlay, patches, images, namePrefix, configMapGenerator)
8. Probes và observability: liveness/readiness/startup (http/tcp/exec), logs (-c, --previous, -l), events, kubectl top, kubectl debug (ephemeral container), API deprecations (kubectl api-resources, explain, convert manifest cũ)
9. ConfigMap và Secret: từ literal/file/env-file, env/envFrom/volume, subPath, immutable, cập nhật mount
10. Resources và bảo mật: requests/limits, ResourceQuota, LimitRange, SecurityContext (runAsUser, runAsNonRoot, fsGroup, readOnlyRootFilesystem, capabilities, allowPrivilegeEscalation), ServiceAccount (automountServiceAccountToken), Role/RoleBinding cơ bản và kubectl auth can-i
11. Services và Ingress: ClusterIP/NodePort, selector/endpoints, port vs targetPort, DNS tên service, Ingress (ingress-nginx cho kind: path, host, pathType, rewrite annotation)
12. NetworkPolicy (default deny, allow theo podSelector/namespaceSelector, egress DNS; cài Calico vì CNI mặc định của kind không thực thi), volume PVC (local-path), CRD và custom resource (kubectl get/describe/edit CR của operator có sẵn)
