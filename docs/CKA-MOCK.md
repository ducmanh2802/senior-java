# CKA mock exam (#/cka) — schema for `window.CKA_EXAMS`

Hands-on mock exams in the style of the real CKA (performance-based, terminal only). The real exam is under NDA:
**never copy or claim "real exam" questions**. Write original tasks that test the same skills at the same difficulty.

Format of the real exam (reference, Linux Foundation pages): 2 hours, about 15–20 tasks, each with a weight, pass 66%.
Domains (CNCF curriculum): Troubleshooting 30%, Cluster Architecture, Installation & Configuration 25%,
Services & Networking 20%, Workloads & Scheduling 15%, Storage 10%.

## Practice environment

The learner runs everything on their own machine:
- `env: 'kind'`: a kind cluster created from the kind config in the exam's `intro` (1 control plane + 2 workers, name `cka`).
  Context name `kind-cka`. Most tasks use this.
- `env: 'kubeadm'`: needs a kubeadm cluster on VMs (or a free online playground such as killercoda). Use only for tasks
  that cannot work on kind: kubeadm upgrade, etcd backup/restore with static pod manifests, kubelet/systemd, certificates on disk.
  At most 4 such tasks per exam. `setup` may be empty for these; `verify` must still check the result.

## Data files

`js/data/cka-mock-N.js`, one exam per file:

```js
(window.CKA_EXAMS = window.CKA_EXAMS || []).push({
  id: 'cka-1',                       // cka-N, matches the file number
  title: 'Đề thi thử CKA số 1',
  minutes: 120, passPct: 66,
  intro: `markup: môi trường, kind config (~~~yaml), alias gợi ý, cách chạy setup/verify`,
  tasks: [ { ...task }, ... ]        // 15–20 tasks, weights sum to exactly 100
});
```

Task:

| field | rule |
|---|---|
| `id` | `cka-<N>-NN` (two digits, 01, 02… in order) |
| `no` | 1..n in order |
| `domain` | one of the 5 domain names above, exactly |
| `weight` | integer 2–13; sum per exam = 100. Domain share per exam within ±7 points of the official weight |
| `env` | `'kind'` or `'kubeadm'` |
| `minutes` | suggested time 2–15; sum per exam ≤ 120 |
| `title` | ≤ 90 chars |
| `task` | markup ≥ 200 chars, Vietnamese with diacritics. Start with the context line, e.g. "Context: {{kubectl config use-context kind-cka}}". State precisely the names, namespace, file paths, expected output files (e.g. write the answer to {{/opt/cka/t3.txt}}), as the real exam does |
| `setup` | bash script (string) run before the task: creates namespaces, broken objects, etc. Idempotent (`kubectl apply`, `--dry-run=client -o yaml \| kubectl apply -f -`, `|| true`). May be `''` for kubeadm tasks |
| `verify` | bash script that checks the result and prints one line per check: `PASS <name>` or `FAIL <name>: <detail>`, and the last line `RESULT <passed>/<total>`. Check behaviour, not wording (e.g. pod Ready, `kubectl auth can-i` answer, endpoint exists, file content) |
| `solution` | markup ≥ 300 chars: commands (~~~bash), YAML (~~~yaml), why, plus a time-saving tip for the exam |
| `refs` | optional, ≤ 3 `{type:'doc', title, url}`, kubernetes.io only |
| `tags` | optional array of strings |

Rules for scripts inside template literals:
- No backtick and no `${` anywhere. Use `$VAR` and `$(cmd)`, never `${VAR}`.
- A backslash must be written `\\` (the JS string must produce a valid script).
- Scripts must pass `bash -n` (the checker runs it) and must not touch anything outside the cluster except `/opt/cka/`.
- Every resource name used by `verify` must appear in `task`.

## Example task (copy this level of detail)

```js
{
  id: 'cka-1-01', no: 1, domain: 'Troubleshooting', weight: 7, env: 'kind', minutes: 8,
  title: 'Deployment không có pod nào Ready trong namespace billing',
  task: `Context: {{kubectl config use-context kind-cka}}

Deployment {{invoice-api}} trong namespace {{billing}} không có pod nào Ready. Tìm nguyên nhân và sửa để **cả 2 replica Ready**.
Không xoá Deployment, không đổi image. Ghi nguyên nhân (1 dòng) vào {{/opt/cka/t1.txt}}.`,
  setup: `kubectl create ns billing --dry-run=client -o yaml | kubectl apply -f -
kubectl -n billing create deployment invoice-api --image=nginx:1.27 --replicas=2 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n billing patch deployment invoice-api --type=json -p='[{"op":"add","path":"/spec/template/spec/containers/0/readinessProbe","value":{"httpGet":{"path":"/","port":8080},"periodSeconds":3}}]'`,
  verify: `p=0; t=2
r=$(kubectl -n billing get deploy invoice-api -o jsonpath='{.status.readyReplicas}')
if [ "$r" = "2" ]; then echo "PASS ready"; p=$((p+1)); else echo "FAIL ready: readyReplicas=$r"; fi
if [ -s /opt/cka/t1.txt ]; then echo "PASS reason-file"; p=$((p+1)); else echo "FAIL reason-file: /opt/cka/t1.txt trống"; fi
echo "RESULT $p/$t"`,
  solution: `### Điều tra
~~~bash
kubectl -n billing get pods            # 0/1 Running: container chạy nhưng không Ready
kubectl -n billing describe pod -l app=invoice-api | grep -A3 Readiness
# Readiness probe failed: dial tcp ...:8080: connect: connection refused
~~~
nginx nghe cổng 80 nhưng readinessProbe gọi 8080.

### Sửa
~~~bash
kubectl -n billing edit deploy invoice-api   # đổi readinessProbe.httpGet.port: 80
echo "readinessProbe sai port 8080, nginx nghe 80" > /opt/cka/t1.txt
~~~

> Mẹo thi: pod Running nhưng 0/1 Ready gần như luôn là probe; đọc Events cuối của describe trước khi xem log.`,
  tags: ['probe', 'deployment'],
}
```

# CKA labs (#/cka, tab Lab) — schema for `window.CKA_LABS`

Untimed practice, one lab per module of the 22-session course (modules 1–20; 21–22 are the mock exams above).
Files `js/data/cka-labs-N.js` (N = 1..4), each pushes several labs:

```js
(window.CKA_LABS = window.CKA_LABS || []).push({
  id: 'cka-lab-05',                 // cka-lab-NN, NN = module number (01..20)
  order: 5,                         // = module number
  title: 'Scheduling cơ bản: nodeSelector, affinity, taints, resources',
  summary: '1–2 câu: lab này luyện gì',          // 40–300 chars
  concepts: `markup ≥ 800 chars: ôn nhanh khái niệm VÌ SAO + cheat sheet lệnh (~~~bash) + bẫy hay gặp trong đề`,
  tasks: [ ...4–8 tasks ]
}, { ...next lab });
```

Lab task = exam task (same fields and script rules) **except**: `id` is `cka-lab-NN-MM`, there is no `weight`;
instead `level: 'easy' | 'medium' | 'hard'` and `hints: ['…', '…']` (1–3, from vague to specific).
Tasks in a lab go from easy to hard; the last task combines several skills of the module.
`env: 'kubeadm'` only for modules that need it (9 maintenance, 10 certificates, 16–17 install, parts of 19).

File split: `cka-labs-1.js` modules 1–5, `cka-labs-2.js` 6–10, `cka-labs-3.js` 11–15, `cka-labs-4.js` 16–20.
Module titles follow the course: 1 overview & environment, 2 cluster architecture/control plane, 3 workloads & services,
4 kubectl imperative/declarative, 5 scheduling basics, 6 advanced scheduling (DaemonSet, static pod, multiple schedulers,
admission controllers), 7 logging & monitoring, 8 application lifecycle (rollout, command/args, ConfigMap, Secret,
multi-container, initContainer, HPA/VPA), 9 cluster maintenance (drain, upgrade, etcd backup/restore), 10 TLS/certificates/kubeconfig,
11 RBAC/ServiceAccount/image security, 12 securityContext/NetworkPolicy/CRD, 13 storage, 14 cluster & pod networking/CNI/DNS,
15 Service/CoreDNS/Ingress/Gateway API, 16 cluster design & HA, 17 kubeadm install, 18 Helm & Kustomize, 19 troubleshooting,
20 JSONPath & advanced kubectl.
