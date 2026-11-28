/* CKAD labs part 3 (docs/CKAD-MOCK.md): modules 9–12 — ConfigMap/Secret, resources & security, Services/Ingress, NetworkPolicy/PVC/CRD. Task T2844. */
(function () {
  'use strict';

  // ---- bash snippets dùng chung (ghép vào setup/verify) ----
  var SH = `kubectl config use-context kind-ckad >/dev/null
mkdir -p /opt/ckad 2>/dev/null || sudo mkdir -p /opt/ckad
[ -w /opt/ckad ] || sudo chmod a+rwx /opt/ckad
mkns() { kubectl create namespace "$1" --dry-run=client -o yaml | kubectl apply -f - >/dev/null; }
`;

  var VH = `P=0; T=0
pass() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail() { T=$((T+1)); echo "FAIL $1: $2"; }
eq() { if [ "$2" = "$3" ]; then pass "$1"; else fail "$1" "cần '$2', đang '$3'"; fi; }
has() { case "$2" in *"$3"*) pass "$1";; *) fail "$1" "không thấy '$3'";; esac; }
okcmd() { n="$1"; shift; if "$@" >/dev/null 2>&1; then pass "$n"; else fail "$n" "lệnh thất bại: $*"; fi; }
nocmd() { n="$1"; shift; if "$@" >/dev/null 2>&1; then fail "$n" "lẽ ra phải bị từ chối: $*"; else pass "$n"; fi; }
fval() { cat "$1" 2>/dev/null | tr -d '[:space:]'; }
newest() { kubectl get pods -n "$1" -l "$2" --sort-by=.metadata.creationTimestamp -o name 2>/dev/null | tail -1; }
`;

  var END = `echo "RESULT $P/$T"
`;

  // module 11: client curl + Deployment web
  var BASE11 = SH + `mkns lab11
kubectl run curl-client -n lab11 --image=curlimages/curl:8.10.1 --restart=Never --dry-run=client -o yaml --command -- sleep 36000 | kubectl apply -f -
kubectl create deployment web -n lab11 --image=nginx:1.27-alpine --replicas=2 --port=80 --dry-run=client -o yaml | kubectl apply -f -
kubectl wait --for=condition=Ready pod/curl-client -n lab11 --timeout=120s
`;

  // ingress-nginx cho kind (manifest chính thức của kind, controller chạy trên node có nhãn ingress-ready=true)
  var INGRESS = `kubectl label node ckad-control-plane ingress-ready=true --overwrite >/dev/null 2>&1 || true
kubectl get ns ingress-nginx >/dev/null 2>&1 || kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
kubectl wait -n ingress-nginx --for=condition=Ready pod -l app.kubernetes.io/component=controller --timeout=180s
`;

  var SHOP = `kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: shop-front, namespace: lab11}
spec:
  replicas: 1
  selector: {matchLabels: {app: shop-front}}
  template:
    metadata: {labels: {app: shop-front}}
    spec:
      containers:
      - name: httpd
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo shop-front > /www/index.html && httpd -f -p 8080 -h /www"]
        ports: [{containerPort: 8080}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: shop-api, namespace: lab11}
spec:
  replicas: 1
  selector: {matchLabels: {app: shop-api}}
  template:
    metadata: {labels: {app: shop-api}}
    spec:
      containers:
      - name: httpd
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www/api && echo shop-api > /www/index.html && echo shop-api > /www/api/index.html && httpd -f -p 8080 -h /www"]
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: shop-front-svc, namespace: lab11}
spec:
  selector: {app: shop-front}
  ports: [{port: 80, targetPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: shop-api-svc, namespace: lab11}
spec:
  selector: {app: shop-api}
  ports: [{port: 80, targetPort: 8080}]
EOF
kubectl rollout status deploy/shop-front -n lab11 --timeout=120s
kubectl rollout status deploy/shop-api -n lab11 --timeout=120s
`;

  var HGET = `ING=http://ingress-nginx-controller.ingress-nginx.svc.cluster.local
hget() { i=0; while [ $i -lt 8 ]; do out=$(kubectl exec -n lab11 curl-client -- curl -s --max-time 4 -H "Host: $2" "$ING$3" 2>/dev/null); case "$out" in *"$4"*) pass "$1"; return;; esac; i=$((i+1)); sleep 3; done; fail "$1" "Host $2, path $3 không trả về $4"; }
cget() { kubectl exec -n lab11 curl-client -- curl -s --max-time 4 "$@" 2>/dev/null; }
`;

  // module 12: Calico (kindnet của kind không đảm bảo thực thi NetworkPolicy) + các pod thử kết nối
  var CALICO = `if kubectl -n kube-system get ds calico-node >/dev/null 2>&1; then
  kubectl -n kube-system rollout status ds/calico-node --timeout=300s
elif kubectl -n kube-system get ds kindnet >/dev/null 2>&1; then
  echo "CẢNH BÁO: cluster đang dùng kindnet (CNI mặc định của kind), NetworkPolicy có thể KHÔNG được thực thi."
  echo "Tạo lại cluster ckad với disableDefaultCNI: true + Calico như phần Khái niệm của module 12 rồi chạy lại setup."
else
  kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml
  kubectl -n kube-system rollout status ds/calico-node --timeout=300s
fi
`;

  var NET12 = SH + `mkns lab12; mkns lab12-monitor; mkns lab12-ext
` + CALICO + `kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: db, namespace: lab12}
spec:
  replicas: 1
  selector: {matchLabels: {app: db}}
  template:
    metadata: {labels: {app: db}}
    spec:
      containers:
      - name: httpd
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo db-ok > /www/index.html && httpd -f -p 8080 -h /www"]
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: db-svc, namespace: lab12}
spec:
  selector: {app: db}
  ports: [{port: 8080, targetPort: 8080}]
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: public-web, namespace: lab12-ext}
spec:
  replicas: 1
  selector: {matchLabels: {app: public-web}}
  template:
    metadata: {labels: {app: public-web}}
    spec:
      containers:
      - name: httpd
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo public-ok > /www/index.html && httpd -f -p 8080 -h /www"]
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: public-web, namespace: lab12-ext}
spec:
  selector: {app: public-web}
  ports: [{port: 80, targetPort: 8080}]
EOF
for p in frontend backend; do
  kubectl run $p -n lab12 --image=busybox:1.36 --labels=app=$p --restart=Never --dry-run=client -o yaml --command -- sleep 36000 | kubectl apply -f -
done
kubectl run prober -n lab12-monitor --image=busybox:1.36 --labels=app=prober --restart=Never --dry-run=client -o yaml --command -- sleep 36000 | kubectl apply -f -
kubectl run intruder -n lab12-monitor --image=busybox:1.36 --labels=app=other --restart=Never --dry-run=client -o yaml --command -- sleep 36000 | kubectl apply -f -
kubectl wait --for=condition=Ready pod --all -n lab12 --timeout=180s
kubectl wait --for=condition=Ready pod --all -n lab12-monitor --timeout=180s
kubectl wait --for=condition=Ready pod --all -n lab12-ext --timeout=180s
`;

  var DENY12 = `kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: default-deny-ingress, namespace: lab12}
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
EOF
`;

  var NETV = `DB=http://db-svc.lab12.svc.cluster.local:8080
reach() { kubectl exec -n "$1" "$2" -- wget -qO- -T 3 "$3" 2>/dev/null | grep -q "$4"; }
canreach() { if reach "$2" "$3" "$4" "$5"; then pass "$1"; else fail "$1" "$3 không gọi được $4"; fi; }
blocked() { if reach "$2" "$3" "$4" "$5"; then fail "$1" "$3 vẫn gọi được $4"; else pass "$1"; fi; }
`;

  var CRD12 = `kubectl apply -f - <<'EOF'
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: backups.ops.lab12.io
spec:
  group: ops.lab12.io
  scope: Namespaced
  names:
    plural: backups
    singular: backup
    kind: Backup
    shortNames: ["bk"]
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: ["schedule", "target"]
            properties:
              schedule: {type: string}
              target: {type: string}
              retentionDays: {type: integer, minimum: 1, maximum: 30, default: 7}
              suspend: {type: boolean, default: false}
    additionalPrinterColumns:
    - {name: Target, type: string, jsonPath: .spec.target}
    - {name: Retention, type: integer, jsonPath: .spec.retentionDays}
    - {name: Schedule, type: string, jsonPath: .spec.schedule}
EOF
kubectl wait --for=condition=Established crd/backups.ops.lab12.io --timeout=60s
`;

  (window.CKAD_LABS = window.CKAD_LABS || []).push(

  // =====================================================================
  // MODULE 9 — ConfigMap và Secret
  // =====================================================================
  {
    id: 'ckad-lab-09', order: 9,
    title: 'ConfigMap và Secret: tách cấu hình khỏi image',
    summary: 'Tạo ConfigMap/Secret từ literal, file, env-file; nạp vào Pod bằng env, envFrom, volume, subPath; immutable; hiểu khi nào cập nhật tự lan vào Pod và khi nào phải restart.',
    concepts: `### Vì sao cần ConfigMap và Secret
Image nên **giống hệt nhau** ở dev, staging, prod; thứ khác nhau là cấu hình. ConfigMap giữ cấu hình không nhạy cảm (URL, feature flag, file nginx.conf), Secret giữ dữ liệu nhạy cảm (mật khẩu, token, key TLS). Cả hai là object trong etcd, Pod tham chiếu tới chúng theo tên nên đổi cấu hình không cần build lại image.

**Secret không phải mã hoá:** dữ liệu chỉ được **base64**, ai có quyền {{get secrets}} là đọc được. An toàn thật đến từ RBAC, encryption at rest của etcd và không commit manifest Secret vào Git.

### 4 cách tạo
- {{--from-literal=KEY=VALUE}}: mỗi cặp một key.
- {{--from-file=path}}: **tên file thành key**, nội dung file thành value (dùng cho file cấu hình). {{--from-file=key=path}} để đặt tên key khác.
- {{--from-env-file=app.env}}: **mỗi dòng KEY=VALUE thành một key** (bỏ qua dòng trống và dòng bắt đầu bằng #). Nhầm với {{--from-file}} là bẫy rất hay gặp: dùng --from-file sẽ ra đúng 1 key tên app.env.
- YAML: {{data}} (ConfigMap: chuỗi thô; Secret: base64) hoặc {{stringData}} (Secret, viết chuỗi thô, API server tự mã hoá base64).

### 3 cách dùng trong Pod
| Cách | Cập nhật khi ConfigMap đổi? | Ghi chú |
|---|---|---|
| {{env.valueFrom.configMapKeyRef}} / {{secretKeyRef}} | Không, phải restart Pod | chọn từng key, đổi tên biến được |
| {{envFrom}} (+ {{prefix}}) | Không, phải restart Pod | nạp mọi key, key không hợp lệ làm tên biến bị bỏ qua |
| volume {{configMap}} / {{secret}} | Có, kubelet đồng bộ sau khoảng 1 phút | mỗi key thành 1 file; {{items}} chọn key, {{defaultMode}} đặt quyền |
| volume + {{subPath}} | **Không bao giờ** | dùng khi chỉ muốn ghi đè 1 file mà không che cả thư mục |

Key tham chiếu không tồn tại (và không đặt {{optional: true}}) thì container kẹt ở **CreateContainerConfigError**; {{kubectl describe pod}} cho biết key nào thiếu.

**immutable: true** khoá ConfigMap/Secret: không sửa được {{data}}, chỉ xoá và tạo lại. Lợi ích: tránh sửa nhầm làm sập app, kubelet ngừng watch nên giảm tải API server khi có hàng nghìn Pod.

### Cheat sheet
~~~bash
kubectl create cm app-config --from-literal=A=1 --from-literal=B=2
kubectl create cm nginx-conf --from-file=default.conf
kubectl create cm env-cfg --from-env-file=app.env
kubectl create secret generic db --from-literal=password=abc
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key
kubectl get secret db -o jsonpath='{.data.password}' | base64 -d
# sửa ConfigMap theo kiểu khai báo (không cần kubectl edit)
kubectl create cm app-config --from-literal=A=9 --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deploy/api        # Pod dùng env cần restart để nhận giá trị mới
kubectl explain pod.spec.containers.envFrom
~~~

### Bẫy hay gặp trong đề
- Đề nói "toàn bộ key thành biến môi trường" là {{envFrom}}, không phải liệt kê từng {{env}}.
- Quên {{base64 -d}} khi đề bắt ghi giá trị Secret ra file; dùng {{echo}} để base64 mà không có {{-n}} sẽ dính ký tự xuống dòng.
- Mount ConfigMap vào **thư mục** có sẵn file (ví dụ /etc/nginx) sẽ che toàn bộ thư mục đó: dùng {{subPath}} hoặc mount vào thư mục con.
- Pod không nhận giá trị mới sau khi sửa ConfigMap: env thì phải restart; volume thì chờ khoảng 1 phút; subPath thì không bao giờ tự cập nhật.`,
    videos: [
      { title: 'Day 19/40 - kubernetes configmap and secret - CKA Full Course 2024', url: 'https://www.youtube.com/watch?v=Q9fHJLSyd7Q', note: 'Xem cả video: tạo ConfigMap/Secret bằng lệnh imperative, nạp vào Pod qua env và kiểm tra bằng exec.' },
      { title: 'Kubernetes ConfigMap and Secret as Kubernetes Volumes | Demo', url: 'https://www.youtube.com/watch?v=FAnQTgr04mU', note: 'Phần demo mount ConfigMap/Secret thành volume: mỗi key thành một file, khớp bài 03 và 06.' },
      { title: 'Kubernetes Components explained! Pods, Services, Secrets, ConfigMap | Kubernetes Tutorial 14', url: 'https://www.youtube.com/watch?v=Krpb44XR0bk', note: 'Đoạn giải thích ConfigMap và Secret: vì sao tách cấu hình khỏi image, Secret chỉ là base64.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-09-01', no: 1, domain: 'Environment, Config & Security', level: 'easy', env: 'kind', minutes: 4,
        title: 'ConfigMap từ literal và nạp toàn bộ bằng envFrom',
        task: `Context: {{kubectl config use-context kind-ckad}}

Team thanh toán muốn cấu hình ứng dụng bằng biến môi trường thay vì hard-code trong image. Trong namespace {{lab09}}:

1. Tạo ConfigMap {{app-config}} có đúng 2 key: {{APP_MODE=production}} và {{LOG_LEVEL=info}}.
2. Tạo Pod {{env-pod}} dùng image {{busybox:1.36}}, chạy lệnh {{sleep 3600}}, nạp **toàn bộ** key của ConfigMap {{app-config}} thành biến môi trường bằng một tham chiếu duy nhất (không liệt kê từng key).

Pod phải ở trạng thái Running và Ready.`,
        setup: SH + `mkns lab09
`,
        verify: VH + `eq "cm-APP_MODE" "production" "$(kubectl get cm app-config -n lab09 -o jsonpath='{.data.APP_MODE}' 2>/dev/null)"
eq "cm-LOG_LEVEL" "info" "$(kubectl get cm app-config -n lab09 -o jsonpath='{.data.LOG_LEVEL}' 2>/dev/null)"
okcmd "pod-ready" kubectl wait --for=condition=Ready pod/env-pod -n lab09 --timeout=60s
eq "dung-envFrom" "app-config" "$(kubectl get pod env-pod -n lab09 -o jsonpath='{.spec.containers[0].envFrom[0].configMapRef.name}' 2>/dev/null)"
eq "env-APP_MODE" "production" "$(kubectl exec env-pod -n lab09 -- printenv APP_MODE 2>/dev/null)"
eq "env-LOG_LEVEL" "info" "$(kubectl exec env-pod -n lab09 -- printenv LOG_LEVEL 2>/dev/null)"
` + END,
        solution: `~~~bash
kubectl create configmap app-config -n lab09 --from-literal=APP_MODE=production --from-literal=LOG_LEVEL=info
kubectl run env-pod -n lab09 --image=busybox:1.36 --dry-run=client -o yaml --command -- sleep 3600 > env-pod.yaml
~~~
{{kubectl run}} không có cờ nạp ConfigMap, nên sinh YAML rồi thêm {{envFrom}} vào container:
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-pod
  namespace: lab09
spec:
  containers:
  - name: env-pod
    image: busybox:1.36
    command: ["sleep", "3600"]
    envFrom:
    - configMapRef:
        name: app-config
~~~
~~~bash
kubectl apply -f env-pod.yaml
kubectl exec -n lab09 env-pod -- printenv APP_MODE LOG_LEVEL
~~~
**Vì sao:** {{envFrom}} biến mọi key của ConfigMap thành biến môi trường cùng tên; thêm key mới vào ConfigMap thì chỉ cần restart Pod là có, không phải sửa manifest. {{env.valueFrom.configMapKeyRef}} chỉ dùng khi cần chọn từng key hoặc đổi tên biến.

**Mẹo tiết kiệm thời gian:** gõ {{kubectl explain pod.spec.containers.envFrom}} để nhớ đúng cấu trúc, và luôn sinh YAML bằng {{--dry-run=client -o yaml}} thay vì gõ tay từ đầu.`,
        hints: ['Tạo ConfigMap bằng hai cờ --from-literal trong cùng một lệnh.', 'Trường cần thêm vào container là envFrom với configMapRef.name: app-config.'],
        refs: [{ type: 'doc', title: 'Configure a Pod to Use a ConfigMap', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/' }],
        tags: ['configmap', 'envFrom'],
      },
      {
        id: 'ckad-lab-09-02', no: 2, domain: 'Environment, Config & Security', level: 'easy', env: 'kind', minutes: 5,
        title: 'Secret generic, secretKeyRef và giải mã Secret có sẵn',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab09}}:

1. Tạo Secret loại generic tên {{db-cred}} với 2 key: {{DB_USER=orders}} và {{DB_PASS=Pa55w0rd-2026}}.
2. Tạo Pod {{db-client}} (image {{busybox:1.36}}, lệnh {{sleep 3600}}) có 2 biến môi trường: {{DATABASE_USER}} lấy từ key {{DB_USER}} và {{DATABASE_PASSWORD}} lấy từ key {{DB_PASS}} của Secret {{db-cred}}.
3. Namespace đã có Secret {{legacy-token}}. Ghi giá trị **đã giải mã** của key {{token}} vào file {{/opt/ckad/lab09-02.txt}} (chỉ giá trị, không thêm gì khác).`,
        setup: SH + `mkns lab09
kubectl create secret generic legacy-token -n lab09 --from-literal=token=tk-7f3a9c --dry-run=client -o yaml | kubectl apply -f -
rm -f /opt/ckad/lab09-02.txt
`,
        verify: VH + `eq "secret-DB_USER" "orders" "$(kubectl get secret db-cred -n lab09 -o jsonpath='{.data.DB_USER}' 2>/dev/null | base64 -d 2>/dev/null)"
eq "secret-DB_PASS" "Pa55w0rd-2026" "$(kubectl get secret db-cred -n lab09 -o jsonpath='{.data.DB_PASS}' 2>/dev/null | base64 -d 2>/dev/null)"
okcmd "pod-ready" kubectl wait --for=condition=Ready pod/db-client -n lab09 --timeout=60s
eq "env-DATABASE_USER" "orders" "$(kubectl exec db-client -n lab09 -- printenv DATABASE_USER 2>/dev/null)"
eq "env-DATABASE_PASSWORD" "Pa55w0rd-2026" "$(kubectl exec db-client -n lab09 -- printenv DATABASE_PASSWORD 2>/dev/null)"
eq "dung-secretKeyRef" "db-cred" "$(kubectl get pod db-client -n lab09 -o jsonpath='{.spec.containers[0].env[*].valueFrom.secretKeyRef.name}' 2>/dev/null | awk '{print $1}')"
eq "file-token" "tk-7f3a9c" "$(fval /opt/ckad/lab09-02.txt)"
` + END,
        solution: `~~~bash
kubectl create secret generic db-cred -n lab09 --from-literal=DB_USER=orders --from-literal=DB_PASS=Pa55w0rd-2026
kubectl run db-client -n lab09 --image=busybox:1.36 --dry-run=client -o yaml --command -- sleep 3600 > db-client.yaml
kubectl get secret legacy-token -n lab09 -o jsonpath='{.data.token}' | base64 -d > /opt/ckad/lab09-02.txt
~~~
Thêm phần {{env}} vào container trong db-client.yaml rồi {{kubectl apply -f db-client.yaml}}:
~~~yaml
    env:
    - name: DATABASE_USER
      valueFrom:
        secretKeyRef:
          name: db-cred
          key: DB_USER
    - name: DATABASE_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-cred
          key: DB_PASS
~~~
**Vì sao:** tên biến trong container ({{DATABASE_PASSWORD}}) khác tên key trong Secret ({{DB_PASS}}) nên phải dùng {{secretKeyRef}} từng biến, {{envFrom}} sẽ giữ nguyên tên key. Dữ liệu trong {{.data}} của Secret là base64, nên đọc ra phải qua {{base64 -d}}; nếu ghi thẳng chuỗi base64 vào file là sai đáp án.

**Mẹo tiết kiệm thời gian:** {{kubectl set env pod}} không sửa được Pod đang chạy (env của Pod là bất biến), nhưng với Deployment có thể dùng {{kubectl set env deploy/x --from=secret/db-cred}} để nạp nhanh; với Pod thì sửa YAML trước khi tạo.`,
        hints: ['Key trong Secret và tên biến môi trường khác nhau: dùng env[].valueFrom.secretKeyRef.', 'Lấy key token bằng jsonpath {.data.token} rồi pipe qua base64 -d.'],
        refs: [{ type: 'doc', title: 'Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' }],
        tags: ['secret', 'base64'],
      },
      {
        id: 'ckad-lab-09-03', no: 3, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 7,
        title: 'ConfigMap từ file, mount đúng một file bằng subPath',
        task: `Context: {{kubectl config use-context kind-ckad}}

File cấu hình nginx đã có sẵn ở {{/opt/ckad/lab09-03/default.conf}} (nghe cổng 8080, trả {{lab09 ok}} ở đường dẫn {{/healthz}}). Trong namespace {{lab09}}:

1. Tạo ConfigMap {{nginx-conf}} từ file trên, key phải tên đúng là {{default.conf}}.
2. Tạo Pod {{web-conf}} dùng image {{nginx:1.27-alpine}}, khai báo containerPort 8080, mount key {{default.conf}} vào **đúng file** {{/etc/nginx/conf.d/default.conf}} bằng {{subPath}} (không mount đè cả thư mục).

Kiểm tra: gọi {{http://127.0.0.1:8080/healthz}} từ trong Pod phải trả về {{lab09 ok}}.`,
        setup: SH + `mkns lab09
mkdir -p /opt/ckad/lab09-03
cat > /opt/ckad/lab09-03/default.conf <<'EOF'
server {
    listen 8080;
    location /healthz {
        default_type text/plain;
        return 200 'lab09 ok';
    }
    location / {
        root /usr/share/nginx/html;
        index index.html;
    }
}
EOF
`,
        verify: VH + `has "cm-key-default.conf" "$(kubectl get cm nginx-conf -n lab09 -o jsonpath='{.data}' 2>/dev/null)" "default.conf"
okcmd "pod-ready" kubectl wait --for=condition=Ready pod/web-conf -n lab09 --timeout=90s
eq "subPath" "default.conf" "$(kubectl get pod web-conf -n lab09 -o jsonpath='{.spec.containers[0].volumeMounts[*].subPath}' 2>/dev/null | awk '{print $1}')"
has "healthz" "$(kubectl exec web-conf -n lab09 -- wget -qO- -T 3 http://127.0.0.1:8080/healthz 2>/dev/null)" "lab09 ok"
okcmd "nginx.conf-van-con" kubectl exec web-conf -n lab09 -- test -f /etc/nginx/nginx.conf
` + END,
        solution: `~~~bash
kubectl create configmap nginx-conf -n lab09 --from-file=/opt/ckad/lab09-03/default.conf
kubectl get cm nginx-conf -n lab09 -o yaml | head -20     # key là default.conf
kubectl run web-conf -n lab09 --image=nginx:1.27-alpine --port=8080 --dry-run=client -o yaml > web-conf.yaml
~~~
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-conf
  namespace: lab09
spec:
  containers:
  - name: web-conf
    image: nginx:1.27-alpine
    ports:
    - containerPort: 8080
    volumeMounts:
    - name: conf
      mountPath: /etc/nginx/conf.d/default.conf   # đường dẫn FILE
      subPath: default.conf                        # key trong ConfigMap
  volumes:
  - name: conf
    configMap:
      name: nginx-conf
~~~
~~~bash
kubectl apply -f web-conf.yaml
kubectl exec -n lab09 web-conf -- wget -qO- http://127.0.0.1:8080/healthz
~~~
**Vì sao:** {{--from-file=path}} lấy tên file làm key. Nếu mount ConfigMap vào {{/etc/nginx}} không có subPath, volume che toàn bộ thư mục, mất {{nginx.conf}} và nginx không khởi động. {{subPath}} chỉ chèn một file. Đánh đổi: file mount bằng subPath **không tự cập nhật** khi ConfigMap đổi, phải restart Pod.

**Mẹo tiết kiệm thời gian:** nếu Pod CrashLoopBackOff, {{kubectl logs web-conf -n lab09}} của nginx in rõ dòng cấu hình lỗi; sửa ConfigMap rồi {{kubectl replace --force -f web-conf.yaml}} để tạo lại Pod trong một lệnh.`,
        hints: ['--from-file=/opt/ckad/lab09-03/default.conf tự đặt key là default.conf.', 'mountPath là đường dẫn đầy đủ tới file, subPath là tên key trong ConfigMap.'],
        refs: [{ type: 'doc', title: 'ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' }],
        tags: ['configmap', 'subPath', 'volume'],
      },
      {
        id: 'ckad-lab-09-04', no: 4, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 6,
        title: 'env-file và prefix: tránh bẫy --from-file',
        task: `Context: {{kubectl config use-context kind-ckad}}

File {{/opt/ckad/lab09-04/app.env}} chứa cấu hình dạng {{KEY=VALUE}} (có cả dòng chú thích). Trong namespace {{lab09}}:

1. Tạo ConfigMap {{region-config}} sao cho **mỗi dòng KEY=VALUE** trong file là một key riêng (không phải một key tên app.env).
2. Tạo Pod {{env-file-pod}} (image {{busybox:1.36}}, lệnh {{sleep 3600}}) nạp toàn bộ ConfigMap {{region-config}} thành biến môi trường với tiền tố {{CFG_}} (ví dụ key REGION thành biến CFG_REGION).
3. Ghi **số key** của ConfigMap {{region-config}} vào file {{/opt/ckad/lab09-04.txt}} (chỉ một số).`,
        setup: SH + `mkns lab09
mkdir -p /opt/ckad/lab09-04
cat > /opt/ckad/lab09-04/app.env <<'EOF'
# cấu hình vùng triển khai
REGION=ap-southeast-1
CACHE_TTL=300

# bật tính năng thử nghiệm
FEATURE_X=true
EOF
rm -f /opt/ckad/lab09-04.txt
`,
        verify: VH + `eq "cm-REGION" "ap-southeast-1" "$(kubectl get cm region-config -n lab09 -o jsonpath='{.data.REGION}' 2>/dev/null)"
eq "cm-FEATURE_X" "true" "$(kubectl get cm region-config -n lab09 -o jsonpath='{.data.FEATURE_X}' 2>/dev/null)"
okcmd "pod-ready" kubectl wait --for=condition=Ready pod/env-file-pod -n lab09 --timeout=60s
eq "env-CFG_REGION" "ap-southeast-1" "$(kubectl exec env-file-pod -n lab09 -- printenv CFG_REGION 2>/dev/null)"
eq "env-CFG_CACHE_TTL" "300" "$(kubectl exec env-file-pod -n lab09 -- printenv CFG_CACHE_TTL 2>/dev/null)"
eq "file-so-key" "3" "$(fval /opt/ckad/lab09-04.txt)"
` + END,
        solution: `~~~bash
kubectl create configmap region-config -n lab09 --from-env-file=/opt/ckad/lab09-04/app.env
kubectl get cm region-config -n lab09 -o yaml        # 3 key: REGION, CACHE_TTL, FEATURE_X
kubectl run env-file-pod -n lab09 --image=busybox:1.36 --dry-run=client -o yaml --command -- sleep 3600 > p.yaml
echo 3 > /opt/ckad/lab09-04.txt
~~~
Thêm vào container trong p.yaml rồi {{kubectl apply -f p.yaml}}:
~~~yaml
    envFrom:
    - prefix: CFG_
      configMapRef:
        name: region-config
~~~
**Vì sao:** {{--from-env-file}} đọc từng dòng {{KEY=VALUE}}, bỏ qua dòng trống và dòng bắt đầu bằng {{#}}, nên ra 3 key. Nếu dùng {{--from-file}} bạn được **1 key** tên {{app.env}} chứa cả file, và {{envFrom}} sẽ bỏ qua key đó vì "app.env" không phải tên biến hợp lệ trong nhiều phiên bản: Pod chạy nhưng không có biến nào, rất khó nhận ra. {{prefix}} trong {{envFrom}} giúp tránh đụng tên khi nạp nhiều nguồn.

**Mẹo tiết kiệm thời gian:** đếm key nhanh bằng {{kubectl get cm region-config -n lab09}} (cột DATA) thay vì đọc YAML.`,
        hints: ['Cờ đúng là --from-env-file, không phải --from-file.', 'prefix nằm cùng cấp với configMapRef trong một phần tử của envFrom.', 'Cột DATA của kubectl get cm cho biết số key.'],
        refs: [{ type: 'doc', title: 'Configure a Pod to Use a ConfigMap', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/' }],
        tags: ['configmap', 'env-file', 'prefix'],
      },
      {
        id: 'ckad-lab-09-05', no: 5, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 8,
        title: 'Cập nhật ConfigMap: volume tự đổi, env phải restart, immutable',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab09}} đã có ConfigMap {{feature-flags}} (key {{checkout=off}}, {{search=on}}), Pod {{flag-reader}} mount ConfigMap này dạng volume tại {{/etc/flags}}, và Deployment {{flag-env}} đọc key {{checkout}} qua biến môi trường {{CHECKOUT}}.

1. Đổi key {{checkout}} của ConfigMap {{feature-flags}} thành {{on}} (giữ nguyên key search).
2. **Không** xoá hay tạo lại Pod {{flag-reader}}: nó phải tự thấy file {{/etc/flags/checkout}} có nội dung {{on}}.
3. Làm cho các Pod của Deployment {{flag-env}} có {{CHECKOUT=on}} mà không sửa manifest.
4. Tạo ConfigMap {{release-info}} với key {{VERSION=2.4.1}} và **không cho phép sửa** dữ liệu sau khi tạo.

Lưu ý: verify chờ tối đa khoảng 90 giây để kubelet đồng bộ volume.`,
        setup: SH + `mkns lab09
kubectl create configmap feature-flags -n lab09 --from-literal=checkout=off --from-literal=search=on --dry-run=client -o yaml | kubectl apply -f -
kubectl delete configmap release-info -n lab09 --ignore-not-found
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata: {name: flag-reader, namespace: lab09}
spec:
  containers:
  - name: reader
    image: busybox:1.36
    command: ["sleep", "36000"]
    volumeMounts: [{name: flags, mountPath: /etc/flags}]
  volumes:
  - name: flags
    configMap: {name: feature-flags}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: flag-env, namespace: lab09}
spec:
  replicas: 1
  selector: {matchLabels: {app: flag-env}}
  template:
    metadata: {labels: {app: flag-env}}
    spec:
      containers:
      - name: app
        image: busybox:1.36
        command: ["sleep", "36000"]
        env:
        - name: CHECKOUT
          valueFrom: {configMapKeyRef: {name: feature-flags, key: checkout}}
EOF
kubectl wait --for=condition=Ready pod/flag-reader -n lab09 --timeout=90s
kubectl get pod flag-reader -n lab09 -o jsonpath='{.metadata.uid}' > /opt/ckad/lab09-05.uid
`,
        verify: VH + `eq "cm-checkout" "on" "$(kubectl get cm feature-flags -n lab09 -o jsonpath='{.data.checkout}' 2>/dev/null)"
eq "cm-search-giu-nguyen" "on" "$(kubectl get cm feature-flags -n lab09 -o jsonpath='{.data.search}' 2>/dev/null)"
eq "flag-reader-khong-tao-lai" "$(cat /opt/ckad/lab09-05.uid 2>/dev/null)" "$(kubectl get pod flag-reader -n lab09 -o jsonpath='{.metadata.uid}' 2>/dev/null)"
v=""; i=0
while [ $i -lt 18 ]; do
  v=$(kubectl exec flag-reader -n lab09 -- cat /etc/flags/checkout 2>/dev/null)
  [ "$v" = "on" ] && break
  i=$((i+1)); sleep 5
done
eq "volume-tu-cap-nhat" "on" "$v"
kubectl rollout status deploy/flag-env -n lab09 --timeout=60s >/dev/null 2>&1
eq "env-CHECKOUT" "on" "$(kubectl exec -n lab09 "$(newest lab09 app=flag-env)" -- printenv CHECKOUT 2>/dev/null)"
eq "release-immutable" "true" "$(kubectl get cm release-info -n lab09 -o jsonpath='{.immutable}' 2>/dev/null)"
eq "release-VERSION" "2.4.1" "$(kubectl get cm release-info -n lab09 -o jsonpath='{.data.VERSION}' 2>/dev/null)"
nocmd "release-khong-sua-duoc" kubectl patch cm release-info -n lab09 --dry-run=server -p '{"data":{"VERSION":"9.9.9"}}'
` + END,
        solution: `~~~bash
# 1. sửa theo kiểu khai báo (hoặc kubectl edit cm feature-flags -n lab09)
kubectl patch cm feature-flags -n lab09 -p '{"data":{"checkout":"on"}}'
# 2. không làm gì với flag-reader: kubelet đồng bộ volume ConfigMap sau khoảng 1 phút
kubectl exec -n lab09 flag-reader -- cat /etc/flags/checkout
# 3. env chỉ đọc lúc container khởi động -> tạo Pod mới
kubectl rollout restart deploy/flag-env -n lab09
kubectl rollout status deploy/flag-env -n lab09
# 4. ConfigMap immutable
kubectl create cm release-info -n lab09 --from-literal=VERSION=2.4.1 --dry-run=client -o yaml > ri.yaml
echo "immutable: true" >> ri.yaml
kubectl apply -f ri.yaml
~~~
~~~yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: release-info
  namespace: lab09
data:
  VERSION: 2.4.1
immutable: true
~~~
**Vì sao:** volume ConfigMap (không subPath) là symlink tới thư mục {{..data}}; kubelet thay symlink nguyên tử khi ConfigMap đổi, nên app đọc lại file sẽ thấy giá trị mới mà Pod không restart. Biến môi trường thì được copy vào process lúc start, chỉ có cách tạo Pod mới; {{rollout restart}} thêm annotation thời gian vào template để Deployment cuốn chiếu Pod mà không cần sửa manifest. {{immutable}} là field cấp cao nhất (ngang {{data}}), không nằm trong metadata; muốn đổi giá trị phải xoá và tạo lại.

**Mẹo tiết kiệm thời gian:** {{kubectl patch ... -p}} với JSON merge nhanh hơn mở editor; kiểm tra immutable bằng {{kubectl patch --dry-run=server}} sẽ thấy lỗi "field is immutable when immutable is set".`,
        hints: ['Volume ConfigMap tự cập nhật, chỉ cần chờ; biến môi trường thì không.', 'kubectl rollout restart deploy/flag-env tạo Pod mới mà không đổi spec.', 'immutable: true nằm ở cấp cao nhất của object, cạnh data.'],
        refs: [{ type: 'doc', title: 'ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' }],
        tags: ['configmap', 'immutable', 'rollout restart'],
      },
      {
        id: 'ckad-lab-09-06', no: 6, domain: 'Environment, Config & Security', level: 'hard', env: 'kind', minutes: 12,
        title: 'Sửa Deployment kẹt CreateContainerConfigError và mount Secret có quyền 0400',
        task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{orders}} trong namespace {{lab09}} không lên được Pod nào. Deployment đọc {{DB_HOST}} từ ConfigMap {{orders-config}} (key {{db_host}}) và {{DB_PASSWORD}} từ Secret {{orders-db}} (key {{password}}). **Không được sửa phần env của Deployment.**

1. Tìm lý do (reason) container không khởi động và ghi đúng chuỗi reason đó vào {{/opt/ckad/lab09-06.txt}}.
2. Bổ sung key {{db_host=postgres.lab09.svc.cluster.local}} vào ConfigMap {{orders-config}} (giữ key cũ).
3. Tạo Secret {{orders-db}} với {{user=orders}} và {{password=Orders-2026}}.
4. Mount Secret {{orders-db}} vào container của Deployment tại {{/etc/orders/db}}, readOnly, với {{defaultMode}} là 0400 (tên volume tuỳ ý).

Kết quả: Deployment {{orders}} có 2/2 Pod Ready, file {{/etc/orders/db/password}} chứa {{Orders-2026}} và có quyền 400.`,
        setup: SH + `mkns lab09
kubectl delete deploy orders -n lab09 --ignore-not-found --wait=true
kubectl delete cm orders-config -n lab09 --ignore-not-found
kubectl delete secret orders-db -n lab09 --ignore-not-found
rm -f /opt/ckad/lab09-06.txt
kubectl create configmap orders-config -n lab09 --from-literal=dbhost=postgres.lab09.svc.cluster.local
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: orders, namespace: lab09}
spec:
  replicas: 2
  selector: {matchLabels: {app: orders}}
  template:
    metadata: {labels: {app: orders}}
    spec:
      containers:
      - name: orders
        image: busybox:1.36
        command: ["sleep", "36000"]
        env:
        - name: DB_HOST
          valueFrom: {configMapKeyRef: {name: orders-config, key: db_host}}
        - name: DB_PASSWORD
          valueFrom: {secretKeyRef: {name: orders-db, key: password}}
EOF
`,
        verify: VH + `eq "file-reason" "CreateContainerConfigError" "$(fval /opt/ckad/lab09-06.txt)"
eq "cm-key-cu-con" "postgres.lab09.svc.cluster.local" "$(kubectl get cm orders-config -n lab09 -o jsonpath='{.data.dbhost}' 2>/dev/null)"
eq "env-ref-khong-doi" "db_host" "$(kubectl get deploy orders -n lab09 -o jsonpath='{.spec.template.spec.containers[0].env[0].valueFrom.configMapKeyRef.key}' 2>/dev/null)"
okcmd "rollout-xong" kubectl rollout status deploy/orders -n lab09 --timeout=90s
eq "ready-2" "2" "$(kubectl get deploy orders -n lab09 -o jsonpath='{.status.readyReplicas}' 2>/dev/null)"
POD=$(newest lab09 app=orders)
eq "env-DB_HOST" "postgres.lab09.svc.cluster.local" "$(kubectl exec -n lab09 "$POD" -- printenv DB_HOST 2>/dev/null)"
eq "env-DB_PASSWORD" "Orders-2026" "$(kubectl exec -n lab09 "$POD" -- printenv DB_PASSWORD 2>/dev/null)"
eq "file-password" "Orders-2026" "$(kubectl exec -n lab09 "$POD" -- cat /etc/orders/db/password 2>/dev/null)"
eq "quyen-400" "400" "$(kubectl exec -n lab09 "$POD" -- stat -L -c %a /etc/orders/db/password 2>/dev/null)"
okcmd "mount-readonly" sh -c "kubectl get deploy orders -n lab09 -o jsonpath='{.spec.template.spec.containers[0].volumeMounts[*].readOnly}' | grep -q true"
` + END,
        solution: `~~~bash
kubectl get pods -n lab09 -l app=orders          # STATUS: CreateContainerConfigError
kubectl describe pod -n lab09 -l app=orders | grep -A3 -i warning   # couldn't find key db_host ...
echo CreateContainerConfigError > /opt/ckad/lab09-06.txt
kubectl patch cm orders-config -n lab09 -p '{"data":{"db_host":"postgres.lab09.svc.cluster.local"}}'
kubectl create secret generic orders-db -n lab09 --from-literal=user=orders --from-literal=password=Orders-2026
kubectl edit deploy orders -n lab09
~~~
Thêm vào Pod template:
~~~yaml
    spec:
      containers:
      - name: orders
        # ... env giữ nguyên ...
        volumeMounts:
        - name: db-secret
          mountPath: /etc/orders/db
          readOnly: true
      volumes:
      - name: db-secret
        secret:
          secretName: orders-db
          defaultMode: 0400
~~~
**Vì sao:** khi một key ConfigMap/Secret được tham chiếu trong env không tồn tại, kubelet không tạo được container và báo reason **CreateContainerConfigError** (khác với ImagePullBackOff hay CrashLoopBackOff). Sửa ConfigMap/Secret là đủ, kubelet tự thử lại, không cần xoá Pod; nhưng vì ta còn thêm volume nên Deployment cuốn chiếu Pod mới. {{defaultMode: 0400}} trong YAML là số bát phân (YAML 1.1 hiểu tiền tố 0); trong JSON phải viết số thập phân 256. Kiểm tra bằng {{stat -L}} vì file trong volume Secret là symlink.

**Mẹo tiết kiệm thời gian:** {{kubectl get pods}} cho reason ngay ở cột STATUS; {{kubectl get events -n lab09 --sort-by=.lastTimestamp}} chỉ ra chính xác key nào thiếu.`,
        hints: ['Cột STATUS của kubectl get pods chính là reason cần ghi.', 'Thiếu cả key db_host trong ConfigMap lẫn Secret orders-db: phải sửa cả hai.', 'defaultMode: 0400 đặt trong volumes[].secret, readOnly: true đặt trong volumeMounts.'],
        refs: [{ type: 'doc', title: 'Distribute Credentials Securely Using Secrets', url: 'https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/' }],
        tags: ['secret', 'configmap', 'troubleshooting', 'defaultMode'],
      },
    ],
  },

  // =====================================================================
  // MODULE 10 — Resources và bảo mật
  // =====================================================================
  {
    id: 'ckad-lab-10', order: 10,
    title: 'Resources và bảo mật: quota, LimitRange, SecurityContext, RBAC',
    summary: 'Đặt requests/limits và hiểu QoS; giới hạn namespace bằng ResourceQuota và LimitRange; chạy container non-root, read-only, bỏ capabilities; ServiceAccount, Role/RoleBinding và kiểm tra bằng kubectl auth can-i.',
    concepts: `### requests, limits và QoS
- **requests**: lượng tài nguyên scheduler **đặt chỗ** trên node. Pod chỉ được xếp vào node còn đủ requests.
- **limits**: trần khi chạy. Vượt CPU limit thì bị **throttle** (chạy chậm), vượt memory limit thì bị **OOMKilled**.
- QoS class (trong {{status.qosClass}}): **Guaranteed** (mọi container có requests = limits cho cả cpu và memory), **Burstable** (có ít nhất một request/limit nhưng không đủ điều kiện Guaranteed), **BestEffort** (không khai báo gì). Khi node thiếu memory, BestEffort bị đuổi trước.

### ResourceQuota và LimitRange: giới hạn ở cấp namespace
- **ResourceQuota** giới hạn **tổng** của namespace: số Pod, tổng {{requests.cpu}}, {{limits.memory}}, số Service, PVC... Vượt quota thì API server **từ chối tạo Pod** (Deployment vẫn tạo, nhưng ReplicaSet báo event FailedCreate "exceeded quota").
- Có quota cho {{requests.cpu}} hay {{limits.memory}} thì **mọi Pod mới phải khai báo** tài nguyên đó, nếu không bị từ chối. Vì vậy thường đi kèm **LimitRange**.
- **LimitRange** áp cho **từng container/Pod**: {{default}} (limit mặc định), {{defaultRequest}}, {{min}}, {{max}}. Nó là admission plugin: tự điền giá trị mặc định vào Pod mới và từ chối Pod vượt max. Không ảnh hưởng Pod đã chạy.

### SecurityContext
| Field | Cấp | Tác dụng |
|---|---|---|
| {{runAsUser}} / {{runAsGroup}} | Pod hoặc container | UID/GID của process |
| {{runAsNonRoot: true}} | Pod hoặc container | kubelet từ chối chạy nếu UID là 0 (lỗi CreateContainerConfigError) |
| {{fsGroup}} | **chỉ Pod** | volume được chown sang GID này để process ghi được |
| {{readOnlyRootFilesystem}} | **chỉ container** | root filesystem chỉ đọc; chỗ cần ghi thì mount emptyDir |
| {{allowPrivilegeEscalation: false}} | **chỉ container** | chặn setuid leo quyền |
| {{capabilities.add/drop}} | **chỉ container** | ví dụ drop ALL, add NET_BIND_SERVICE |
Giá trị ở container ghi đè giá trị ở Pod.

### ServiceAccount và RBAC
Mỗi namespace có SA {{default}}. Pod dùng SA qua {{serviceAccountName}}; token được mount tại {{/var/run/secrets/kubernetes.io/serviceaccount}} trừ khi {{automountServiceAccountToken: false}} (đặt trên SA hoặc Pod). Quyền gắn bằng **Role** (verbs trên resources trong một namespace) + **RoleBinding** (gắn Role cho user/group/SA). Tên subject của SA là {{system:serviceaccount:<ns>:<tên>}}.

### Cheat sheet
~~~bash
kubectl create quota team-quota --hard=pods=5,requests.cpu=1,limits.memory=2Gi -n ns
kubectl describe quota -n ns                  # Used / Hard
kubectl set resources deploy/api --requests=cpu=100m,memory=64Mi --limits=cpu=200m,memory=128Mi
kubectl create sa pod-reader -n ns
kubectl create role read-pods --verb=get,list,watch --resource=pods -n ns
kubectl create rolebinding read-pods-rb --role=read-pods --serviceaccount=ns:pod-reader -n ns
kubectl auth can-i list pods -n ns --as=system:serviceaccount:ns:pod-reader
kubectl set serviceaccount deploy/api pod-reader -n ns
kubectl get pod x -o jsonpath='{.status.qosClass}'
~~~

### Bẫy hay gặp trong đề
- Đặt {{readOnlyRootFilesystem}} hay {{capabilities}} ở cấp Pod: API báo lỗi field không tồn tại. Hai field này chỉ có ở container.
- RoleBinding cho SA viết {{--serviceaccount=ns:name}} (dấu hai chấm), không phải {{--user}}.
- Sửa resources của Pod đang chạy: không được (trừ tính năng resize mới), phải tạo lại Pod hoặc sửa Deployment.
- Image chạy bằng root (nginx thường) + {{runAsNonRoot: true}} = Pod không bao giờ start. Cần image non-root hoặc runAsUser phù hợp với image.`,
    videos: [
      { title: 'Kubernetes securityContext: run as non-root, drop capabilities and Pod Security Admission', url: 'https://www.youtube.com/watch?v=5creJtM4sIM', note: 'Xem phần runAsNonRoot và drop capabilities: đúng các field trong bài 04, 05, 07.' },
      { title: 'Day 41: Pod Security in Kubernetes – Mastering Security Context & Linux Capabilities | CKA 2025', url: 'https://www.youtube.com/watch?v=ZoTKkmY6VSw', note: 'Demo securityContext cấp Pod và container, kiểm tra bằng id trong container; ôn trước bài 04.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-10-01', no: 1, domain: 'Environment, Config & Security', level: 'easy', env: 'kind', minutes: 4,
        title: 'requests/limits cho Pod và xác định QoS class',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab10}}, tạo Pod {{limited}} dùng image {{nginx:1.27-alpine}} với:
- requests: cpu {{100m}}, memory {{64Mi}}
- limits: cpu {{200m}}, memory {{128Mi}}

Sau khi Pod Running, ghi **QoS class** mà Kubernetes gán cho Pod này vào file {{/opt/ckad/lab10-01.txt}} (chỉ tên class, đúng chữ hoa/thường như Kubernetes trả về).`,
        setup: SH + `mkns lab10
rm -f /opt/ckad/lab10-01.txt
`,
        verify: VH + `okcmd "pod-ready" kubectl wait --for=condition=Ready pod/limited -n lab10 --timeout=60s
eq "req-cpu" "100m" "$(kubectl get pod limited -n lab10 -o jsonpath='{.spec.containers[0].resources.requests.cpu}' 2>/dev/null)"
eq "req-mem" "64Mi" "$(kubectl get pod limited -n lab10 -o jsonpath='{.spec.containers[0].resources.requests.memory}' 2>/dev/null)"
eq "lim-cpu" "200m" "$(kubectl get pod limited -n lab10 -o jsonpath='{.spec.containers[0].resources.limits.cpu}' 2>/dev/null)"
eq "lim-mem" "128Mi" "$(kubectl get pod limited -n lab10 -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null)"
eq "qos" "Burstable" "$(kubectl get pod limited -n lab10 -o jsonpath='{.status.qosClass}' 2>/dev/null)"
eq "file-qos" "Burstable" "$(fval /opt/ckad/lab10-01.txt)"
` + END,
        solution: `~~~bash
kubectl run limited -n lab10 --image=nginx:1.27-alpine --dry-run=client -o yaml > limited.yaml
~~~
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: limited
  namespace: lab10
spec:
  containers:
  - name: limited
    image: nginx:1.27-alpine
    resources:
      requests:
        cpu: 100m
        memory: 64Mi
      limits:
        cpu: 200m
        memory: 128Mi
~~~
~~~bash
kubectl apply -f limited.yaml
kubectl get pod limited -n lab10 -o jsonpath='{.status.qosClass}' > /opt/ckad/lab10-01.txt
~~~
**Vì sao:** requests khác limits nên Pod là **Burstable**: được đảm bảo 100m/64Mi, được dùng tới 200m/128Mi khi node rảnh. Muốn **Guaranteed** thì requests phải bằng limits cho cả cpu lẫn memory ở mọi container. QoS quyết định thứ tự bị đuổi khi node thiếu memory: BestEffort trước, Burstable sau, Guaranteed cuối.

**Mẹo tiết kiệm thời gian:** cờ {{--requests}}/{{--limits}} của {{kubectl run}} đã bị bỏ, đừng mất thời gian thử; sinh YAML rồi thêm khối resources. Lấy QoS trực tiếp bằng jsonpath rồi redirect vào file để tránh gõ sai chính tả.`,
        hints: ['kubectl run không còn cờ --limits: sinh YAML rồi thêm resources.', 'QoS nằm trong status.qosClass sau khi Pod được tạo.'],
        refs: [{ type: 'doc', title: 'Pod Quality of Service Classes', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/' }],
        tags: ['resources', 'qos'],
      },
      {
        id: 'ckad-lab-10-02', no: 2, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 6,
        title: 'LimitRange: giá trị mặc định và trần cho container',
        task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab10-quota}} dành cho team batch. Nhiều Pod được tạo mà không khai báo resources. Tạo LimitRange {{container-defaults}} trong namespace {{lab10-quota}} áp cho **Container** với:
- default (limit mặc định): cpu {{300m}}, memory {{256Mi}}
- defaultRequest: cpu {{100m}}, memory {{128Mi}}
- max: cpu {{1}}, memory {{512Mi}}

Kết quả mong đợi: Pod mới không khai báo resources tự nhận các giá trị mặc định trên; Pod xin limit cpu {{2}} bị API server từ chối.`,
        setup: SH + `mkns lab10-quota
kubectl delete limitrange container-defaults -n lab10-quota --ignore-not-found
`,
        verify: VH + `eq "limitrange-ton-tai" "Container" "$(kubectl get limitrange container-defaults -n lab10-quota -o jsonpath='{.spec.limits[0].type}' 2>/dev/null)"
eq "mac-dinh-limit-cpu" "300m" "$(kubectl run lr-probe -n lab10-quota --image=nginx:1.27-alpine --restart=Never --dry-run=server -o jsonpath='{.spec.containers[0].resources.limits.cpu}' 2>/dev/null)"
eq "mac-dinh-limit-mem" "256Mi" "$(kubectl run lr-probe -n lab10-quota --image=nginx:1.27-alpine --restart=Never --dry-run=server -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null)"
eq "mac-dinh-request-mem" "128Mi" "$(kubectl run lr-probe -n lab10-quota --image=nginx:1.27-alpine --restart=Never --dry-run=server -o jsonpath='{.spec.containers[0].resources.requests.memory}' 2>/dev/null)"
if kubectl apply --dry-run=server -f - >/dev/null 2>&1 <<'EOF'
apiVersion: v1
kind: Pod
metadata: {name: lr-too-big, namespace: lab10-quota}
spec:
  containers:
  - name: big
    image: nginx:1.27-alpine
    resources:
      limits: {cpu: "2", memory: 256Mi}
EOF
then fail "vuot-max-bi-tu-choi" "Pod xin cpu 2 vẫn được chấp nhận"; else pass "vuot-max-bi-tu-choi"; fi
` + END,
        solution: `~~~yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: container-defaults
  namespace: lab10-quota
spec:
  limits:
  - type: Container
    default:            # limit khi container không khai báo
      cpu: 300m
      memory: 256Mi
    defaultRequest:     # request khi container không khai báo
      cpu: 100m
      memory: 128Mi
    max:
      cpu: "1"
      memory: 512Mi
~~~
~~~bash
kubectl apply -f lr.yaml
kubectl describe limitrange container-defaults -n lab10-quota
# thử nhanh mà không tạo Pod thật: dry-run phía server có chạy admission
kubectl run t -n lab10-quota --image=nginx:1.27-alpine --dry-run=server -o yaml | grep -A6 resources
~~~
**Vì sao:** LimitRange là admission controller: chỉ tác động lúc **tạo** Pod, tự điền {{default}}/{{defaultRequest}} và từ chối Pod vượt {{max}}. Pod đã chạy không bị đổi. Lưu ý {{default}} trong LimitRange là **limit**, không phải request (bẫy hay gặp). Không có lệnh {{kubectl create limitrange}}, phải viết YAML: mở docs trang "Limit Ranges" và copy khung.

**Mẹo tiết kiệm thời gian:** {{--dry-run=server}} cho thấy kết quả sau admission (LimitRange, quota) mà không tạo object, rất tiện để tự kiểm tra trong lúc thi.`,
        hints: ['Không có kubectl create limitrange: copy YAML mẫu từ trang Limit Ranges trên kubernetes.io.', 'default là limit mặc định, defaultRequest là request mặc định, cả hai nằm trong cùng một phần tử type: Container.'],
        refs: [{ type: 'doc', title: 'Limit Ranges', url: 'https://kubernetes.io/docs/concepts/policy/limit-range/' }],
        tags: ['limitrange', 'admission'],
      },
      {
        id: 'ckad-lab-10-03', no: 3, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 10,
        title: 'ResourceQuota chặn Deployment: đọc event và sửa requests',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab10-quota}} có Deployment {{batch-worker}} (đang 0 replica, mỗi Pod xin requests cpu 400m).

1. Tạo ResourceQuota {{team-quota}} trong {{lab10-quota}} với hard: {{pods=5}}, {{requests.cpu=1}}, {{requests.memory=1Gi}}, {{limits.cpu=2}}, {{limits.memory=2Gi}}.
2. Scale {{batch-worker}} lên 4 replica. Quan sát: chỉ một phần Pod được tạo.
3. Ghi **nguyên văn message** của event FailedCreate (dòng có chứa {{exceeded quota}}) vào {{/opt/ckad/lab10-03.txt}}.
4. Không đổi quota, sửa Deployment để cả 4 Pod chạy được: đổi requests cpu thành {{200m}} (giữ nguyên các giá trị khác).

Kết quả: {{batch-worker}} có 4/4 Pod Ready.`,
        setup: SH + `mkns lab10-quota
kubectl delete resourcequota team-quota -n lab10-quota --ignore-not-found
kubectl delete deploy batch-worker -n lab10-quota --ignore-not-found --wait=true
rm -f /opt/ckad/lab10-03.txt
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: batch-worker, namespace: lab10-quota}
spec:
  replicas: 0
  selector: {matchLabels: {app: batch-worker}}
  template:
    metadata: {labels: {app: batch-worker}}
    spec:
      containers:
      - name: worker
        image: busybox:1.36
        command: ["sleep", "36000"]
        resources:
          requests: {cpu: 400m, memory: 128Mi}
          limits: {cpu: 400m, memory: 128Mi}
EOF
`,
        verify: VH + `H=$(kubectl get resourcequota team-quota -n lab10-quota -o jsonpath='{.spec.hard}' 2>/dev/null)
has "quota-pods" "$H" '"pods":"5"'
has "quota-requests.cpu" "$H" '"requests.cpu":"1"'
has "quota-requests.memory" "$H" '"requests.memory":"1Gi"'
has "quota-limits.cpu" "$H" '"limits.cpu":"2"'
has "quota-limits.memory" "$H" '"limits.memory":"2Gi"'
has "file-event" "$(cat /opt/ckad/lab10-03.txt 2>/dev/null)" "exceeded quota"
eq "request-cpu-200m" "200m" "$(kubectl get deploy batch-worker -n lab10-quota -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu}' 2>/dev/null)"
eq "limit-cpu-giu-nguyen" "400m" "$(kubectl get deploy batch-worker -n lab10-quota -o jsonpath='{.spec.template.spec.containers[0].resources.limits.cpu}' 2>/dev/null)"
kubectl rollout status deploy/batch-worker -n lab10-quota --timeout=120s >/dev/null 2>&1
eq "ready-4" "4" "$(kubectl get deploy batch-worker -n lab10-quota -o jsonpath='{.status.readyReplicas}' 2>/dev/null)"
` + END,
        solution: `~~~bash
kubectl create quota team-quota -n lab10-quota --hard=pods=5,requests.cpu=1,requests.memory=1Gi,limits.cpu=2,limits.memory=2Gi
kubectl scale deploy batch-worker -n lab10-quota --replicas=4
kubectl get pods -n lab10-quota                     # chỉ 2 Pod (2 x 400m = 800m, Pod thứ 3 sẽ thành 1200m > 1)
kubectl get events -n lab10-quota --field-selector reason=FailedCreate -o jsonpath='{.items[-1:].message}' > /opt/ckad/lab10-03.txt
kubectl describe quota team-quota -n lab10-quota    # Used requests.cpu 800m / 1
kubectl set resources deploy batch-worker -n lab10-quota --requests=cpu=200m
kubectl rollout status deploy batch-worker -n lab10-quota
~~~
Message mẫu: {{Error creating: pods "batch-worker-..." is forbidden: exceeded quota: team-quota, requested: requests.cpu=400m, used: requests.cpu=800m, limited: requests.cpu=1}}.

**Vì sao:** quota được kiểm ở admission khi **tạo Pod**; Deployment và ReplicaSet vẫn tồn tại, chỉ ReplicaSet liên tục báo FailedCreate, nên {{kubectl get deploy}} hiện 2/4 mà Pod không hề Pending. Phải đọc **event** (hoặc {{kubectl describe rs}}) mới thấy lý do. Với 200m: 4 x 200m = 800m nằm trong 1 CPU, kể cả lúc rolling update có thêm 1 Pod surge (1000m), nên rollout chạy hết. {{kubectl set resources --requests}} chỉ đổi requests, limits giữ nguyên.

**Mẹo tiết kiệm thời gian:** {{kubectl describe quota}} cho thấy Used/Hard tức thì; khi rollout kẹt vì quota, scale về 0 rồi lên lại là cách nhanh nhất để giải phóng chỗ.`,
        hints: ['kubectl create quota --hard=... nhận nhiều cặp phân tách bằng dấu phẩy.', 'Event nằm trên ReplicaSet: kubectl get events -n lab10-quota --field-selector reason=FailedCreate.', 'kubectl set resources --requests=cpu=200m chỉ đổi request.'],
        refs: [{ type: 'doc', title: 'Resource Quotas', url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/' }],
        tags: ['resourcequota', 'events', 'troubleshooting'],
      },
      {
        id: 'ckad-lab-10-04', no: 4, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 8,
        title: 'SecurityContext: non-root, fsGroup, root filesystem chỉ đọc',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab10}}, tạo Pod {{secure-app}} (image {{busybox:1.36}}, lệnh {{sleep 3600}}) đáp ứng yêu cầu bảo mật:
- Cấp Pod: {{runAsUser: 1000}}, {{runAsGroup: 3000}}, {{fsGroup: 2000}}, {{runAsNonRoot: true}}.
- Cấp container: {{allowPrivilegeEscalation: false}}, {{readOnlyRootFilesystem: true}}, bỏ **toàn bộ** Linux capabilities.
- Một volume {{emptyDir}} tên {{data}} mount tại {{/data}} để ứng dụng có chỗ ghi.

Kiểm tra: trong container {{id -u}} ra 1000, ghi được vào /data nhưng không ghi được vào /tmp.`,
        setup: SH + `mkns lab10
`,
        verify: VH + `okcmd "pod-ready" kubectl wait --for=condition=Ready pod/secure-app -n lab10 --timeout=60s
eq "uid-1000" "1000" "$(kubectl exec secure-app -n lab10 -- id -u 2>/dev/null)"
eq "gid-3000" "3000" "$(kubectl exec secure-app -n lab10 -- id -g 2>/dev/null)"
eq "fsGroup-2000" "2000" "$(kubectl exec secure-app -n lab10 -- stat -c %g /data 2>/dev/null)"
okcmd "ghi-duoc-data" kubectl exec secure-app -n lab10 -- touch /data/ok
if kubectl get pod secure-app -n lab10 >/dev/null 2>&1; then nocmd "rootfs-chi-doc" kubectl exec secure-app -n lab10 -- touch /tmp/x; else fail "rootfs-chi-doc" "chưa có Pod"; fi
eq "runAsNonRoot" "true" "$(kubectl get pod secure-app -n lab10 -o jsonpath='{.spec.securityContext.runAsNonRoot}' 2>/dev/null)"
eq "no-priv-escalation" "false" "$(kubectl get pod secure-app -n lab10 -o jsonpath='{.spec.containers[0].securityContext.allowPrivilegeEscalation}' 2>/dev/null)"
eq "drop-ALL" "ALL" "$(kubectl get pod secure-app -n lab10 -o jsonpath='{.spec.containers[0].securityContext.capabilities.drop[0]}' 2>/dev/null)"
` + END,
        solution: `~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  namespace: lab10
spec:
  securityContext:              # cấp Pod: áp cho mọi container + volume
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    runAsNonRoot: true
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep", "3600"]
    securityContext:            # cấp container: các field chỉ có ở đây
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: data
      mountPath: /data
  volumes:
  - name: data
    emptyDir: {}
~~~
~~~bash
kubectl apply -f secure-app.yaml
kubectl exec -n lab10 secure-app -- sh -c 'id; ls -ld /data; touch /tmp/x'
~~~
**Vì sao:** {{fsGroup}} khiến kubelet đổi group sở hữu của volume thành 2000 và thêm GID này vào supplementary groups của process, nhờ đó user không phải root vẫn ghi được volume. {{readOnlyRootFilesystem}} giảm bề mặt tấn công (kẻ tấn công không cài được tool), nên mọi chỗ cần ghi (cache, tmp) phải mount emptyDir. {{readOnlyRootFilesystem}}, {{capabilities}}, {{allowPrivilegeEscalation}} chỉ có ở cấp container; đặt nhầm ở Pod sẽ bị API báo "unknown field".

**Mẹo tiết kiệm thời gian:** {{kubectl explain pod.spec.securityContext}} và {{kubectl explain pod.spec.containers.securityContext}} cho biết ngay field nào thuộc cấp nào.`,
        hints: ['fsGroup chỉ có ở securityContext cấp Pod.', 'readOnlyRootFilesystem, capabilities, allowPrivilegeEscalation chỉ có ở cấp container.'],
        refs: [{ type: 'doc', title: 'Configure a Security Context for a Pod or Container', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' }],
        tags: ['securitycontext', 'fsGroup', 'capabilities'],
      },
      {
        id: 'ckad-lab-10-05', no: 5, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 8,
        title: 'Deployment không start vì runAsNonRoot: đổi sang image non-root',
        task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{legacy-web}} trong namespace {{lab10}} không có Pod nào Running. Chính sách bảo mật bắt buộc giữ {{runAsNonRoot: true}} ở securityContext cấp Pod.

1. Ghi **reason** khiến container không khởi động vào {{/opt/ckad/lab10-05.txt}}.
2. Sửa Deployment (vẫn giữ {{runAsNonRoot: true}}) bằng cách đổi image của container {{web}} sang {{nginxinc/nginx-unprivileged:1.27-alpine}} và containerPort thành {{8080}}.

Kết quả: Deployment {{legacy-web}} 1/1 Ready, process chạy với UID 101, gọi {{http://127.0.0.1:8080}} trong Pod trả về trang nginx.`,
        setup: SH + `mkns lab10
kubectl delete deploy legacy-web -n lab10 --ignore-not-found --wait=true
rm -f /opt/ckad/lab10-05.txt
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: legacy-web, namespace: lab10}
spec:
  replicas: 1
  selector: {matchLabels: {app: legacy-web}}
  template:
    metadata: {labels: {app: legacy-web}}
    spec:
      securityContext:
        runAsNonRoot: true
      containers:
      - name: web
        image: nginx:1.27-alpine
        ports: [{containerPort: 80}]
EOF
`,
        verify: VH + `eq "file-reason" "CreateContainerConfigError" "$(fval /opt/ckad/lab10-05.txt)"
eq "runAsNonRoot-giu-nguyen" "true" "$(kubectl get deploy legacy-web -n lab10 -o jsonpath='{.spec.template.spec.securityContext.runAsNonRoot}' 2>/dev/null)"
eq "image" "nginxinc/nginx-unprivileged:1.27-alpine" "$(kubectl get deploy legacy-web -n lab10 -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)"
okcmd "rollout-xong" kubectl rollout status deploy/legacy-web -n lab10 --timeout=120s
POD=$(newest lab10 app=legacy-web)
eq "uid-101" "101" "$(kubectl exec -n lab10 "$POD" -- id -u 2>/dev/null)"
has "http-8080" "$(kubectl exec -n lab10 "$POD" -- wget -qO- -T 3 http://127.0.0.1:8080 2>/dev/null)" "nginx"
` + END,
        solution: `~~~bash
kubectl get pods -n lab10 -l app=legacy-web         # CreateContainerConfigError
kubectl describe pod -n lab10 -l app=legacy-web | grep -i root
# Error: container has runAsNonRoot and image will run as root
echo CreateContainerConfigError > /opt/ckad/lab10-05.txt
kubectl set image deploy/legacy-web web=nginxinc/nginx-unprivileged:1.27-alpine -n lab10
kubectl patch deploy legacy-web -n lab10 --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/ports/0/containerPort","value":8080}]'
kubectl rollout status deploy/legacy-web -n lab10
~~~
**Vì sao:** {{runAsNonRoot: true}} không tự đổi user, nó chỉ là **kiểm tra**: kubelet xem UID mà container sẽ chạy (từ {{runAsUser}} hoặc USER trong image), nếu là 0 thì từ chối tạo container. Image nginx chuẩn chạy master process bằng root để bind cổng 80. Chỉ thêm {{runAsUser: 101}} cho image nginx chuẩn vẫn hỏng vì user thường không bind được cổng 80 và không ghi được {{/var/cache/nginx}}. Image {{nginx-unprivileged}} được build sẵn để chạy UID 101 và nghe 8080, nên là cách sửa đúng.

**Mẹo tiết kiệm thời gian:** {{kubectl set image deploy/x <container>=<image>}} nhanh hơn {{kubectl edit}}; tên container lấy bằng {{kubectl get deploy legacy-web -n lab10 -o jsonpath='{.spec.template.spec.containers[*].name}'}}.`,
        hints: ['kubectl describe pod cho thấy thông báo "container has runAsNonRoot and image will run as root".', 'kubectl set image deploy/legacy-web web=<image mới> -n lab10.'],
        refs: [{ type: 'doc', title: 'Configure a Security Context for a Pod or Container', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' }],
        tags: ['securitycontext', 'runAsNonRoot', 'troubleshooting'],
      },
      {
        id: 'ckad-lab-10-06', no: 6, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 8,
        title: 'ServiceAccount, Role, RoleBinding và tắt automount token',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab10}}:

1. Tạo ServiceAccount {{pod-reader}}. Tạo Role {{pod-read-role}} cho phép {{get}}, {{list}}, {{watch}} trên {{pods}}, và RoleBinding {{pod-reader-binding}} gắn Role này cho ServiceAccount {{pod-reader}}. ServiceAccount này **không** được xoá Pod, không được đọc Secret, không có quyền ở namespace khác.
2. Tạo ServiceAccount {{no-token-sa}} **không tự mount token** vào Pod (đặt trên chính ServiceAccount).
3. Tạo Pod {{quiet-pod}} (image {{busybox:1.36}}, lệnh {{sleep 3600}}) dùng ServiceAccount {{no-token-sa}}.

Kiểm tra bằng {{kubectl auth can-i}} với {{--as=system:serviceaccount:lab10:pod-reader}}.`,
        setup: SH + `mkns lab10
`,
        verify: VH + `AS=system:serviceaccount:lab10:pod-reader
eq "can-list-pods" "yes" "$(kubectl auth can-i list pods -n lab10 --as=$AS 2>/dev/null)"
eq "can-watch-pods" "yes" "$(kubectl auth can-i watch pods -n lab10 --as=$AS 2>/dev/null)"
eq "khong-delete-pods" "no" "$(kubectl auth can-i delete pods -n lab10 --as=$AS 2>/dev/null)"
eq "khong-get-secrets" "no" "$(kubectl auth can-i get secrets -n lab10 --as=$AS 2>/dev/null)"
eq "khong-ns-khac" "no" "$(kubectl auth can-i list pods -n default --as=$AS 2>/dev/null)"
eq "sa-no-automount" "false" "$(kubectl get sa no-token-sa -n lab10 -o jsonpath='{.automountServiceAccountToken}' 2>/dev/null)"
okcmd "quiet-pod-ready" kubectl wait --for=condition=Ready pod/quiet-pod -n lab10 --timeout=60s
eq "quiet-pod-sa" "no-token-sa" "$(kubectl get pod quiet-pod -n lab10 -o jsonpath='{.spec.serviceAccountName}' 2>/dev/null)"
if kubectl get pod quiet-pod -n lab10 >/dev/null 2>&1; then nocmd "khong-co-token" kubectl exec quiet-pod -n lab10 -- ls /var/run/secrets/kubernetes.io/serviceaccount/token; else fail "khong-co-token" "chưa có Pod"; fi
` + END,
        solution: `~~~bash
kubectl create sa pod-reader -n lab10
kubectl create role pod-read-role -n lab10 --verb=get,list,watch --resource=pods
kubectl create rolebinding pod-reader-binding -n lab10 --role=pod-read-role --serviceaccount=lab10:pod-reader
kubectl auth can-i list pods -n lab10 --as=system:serviceaccount:lab10:pod-reader     # yes
kubectl auth can-i delete pods -n lab10 --as=system:serviceaccount:lab10:pod-reader   # no
kubectl create sa no-token-sa -n lab10 --dry-run=client -o yaml > sa.yaml
~~~
~~~yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: no-token-sa
  namespace: lab10
automountServiceAccountToken: false
~~~
~~~bash
kubectl apply -f sa.yaml
kubectl run quiet-pod -n lab10 --image=busybox:1.36 --overrides='{"spec":{"serviceAccountName":"no-token-sa"}}' --command -- sleep 3600
~~~
**Vì sao:** Role chỉ có hiệu lực trong namespace của nó, nên SA không có quyền ở {{default}}. RoleBinding với {{--serviceaccount=lab10:pod-reader}} tạo subject kind ServiceAccount (dùng {{--user}} là sai). Pod không gọi Kubernetes API thì không nên có token: {{automountServiceAccountToken: false}} trên SA áp cho mọi Pod dùng SA đó (Pod có thể ghi đè bằng field cùng tên trong spec). {{automountServiceAccountToken}} là field cấp cao nhất của ServiceAccount, không nằm trong metadata.

**Mẹo tiết kiệm thời gian:** luôn kiểm tra RBAC bằng {{kubectl auth can-i ... --as=system:serviceaccount:<ns>:<sa>}} thay vì tạo Pod chạy kubectl; với Pod, cờ {{--overrides}} hoặc sinh YAML rồi thêm {{serviceAccountName}} (cờ {{--serviceaccount}} của kubectl run đã bị bỏ).`,
        hints: ['kubectl create role ... --verb=get,list,watch --resource=pods.', 'RoleBinding cho SA: --serviceaccount=lab10:pod-reader.', 'automountServiceAccountToken: false đặt ở cấp cao nhất của manifest ServiceAccount.'],
        refs: [{ type: 'doc', title: 'Using RBAC Authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' }, { type: 'doc', title: 'Configure Service Accounts for Pods', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/' }],
        tags: ['rbac', 'serviceaccount', 'auth can-i'],
      },
      {
        id: 'ckad-lab-10-07', no: 7, domain: 'Environment, Config & Security', level: 'hard', env: 'kind', minutes: 14,
        title: 'Tổng hợp: Deployment audit-bot an toàn với quyền tối thiểu',
        task: `Context: {{kubectl config use-context kind-ckad}}

Triển khai agent kiểm toán trong namespace {{lab10}} theo nguyên tắc quyền tối thiểu:

1. ServiceAccount {{audit-bot}}. Role {{audit-reader}}: {{get}}, {{list}} trên {{pods}} và **chỉ** {{get}} trên {{configmaps}}. RoleBinding {{audit-reader-binding}} gắn Role cho SA {{audit-bot}}.
2. Deployment {{audit-bot}}, 1 replica, image {{busybox:1.36}}, lệnh {{sleep 36000}}, dùng SA {{audit-bot}} (token phải được mount vì agent gọi API).
3. Pod chạy với {{runAsUser: 65534}} và {{runAsNonRoot: true}}; container {{readOnlyRootFilesystem: true}}, {{allowPrivilegeEscalation: false}}, drop {{ALL}} capabilities.
4. Resources: requests cpu {{50m}} memory {{32Mi}}, limits cpu {{100m}} memory {{64Mi}}.

Kết quả: Deployment Ready; SA được list Pod, get ConfigMap nhưng không list ConfigMap, không xoá Pod, không đọc Secret.`,
        setup: SH + `mkns lab10
kubectl create configmap audit-settings -n lab10 --from-literal=level=full --dry-run=client -o yaml | kubectl apply -f -
`,
        verify: VH + `AS=system:serviceaccount:lab10:audit-bot
eq "can-list-pods" "yes" "$(kubectl auth can-i list pods -n lab10 --as=$AS 2>/dev/null)"
eq "can-get-cm" "yes" "$(kubectl auth can-i get configmaps -n lab10 --as=$AS 2>/dev/null)"
eq "khong-list-cm" "no" "$(kubectl auth can-i list configmaps -n lab10 --as=$AS 2>/dev/null)"
eq "khong-delete-pods" "no" "$(kubectl auth can-i delete pods -n lab10 --as=$AS 2>/dev/null)"
eq "khong-get-secrets" "no" "$(kubectl auth can-i get secrets -n lab10 --as=$AS 2>/dev/null)"
okcmd "rollout-xong" kubectl rollout status deploy/audit-bot -n lab10 --timeout=90s
POD=$(newest lab10 app=audit-bot)
[ -n "$POD" ] || POD=pod/khong-co
eq "pod-sa" "audit-bot" "$(kubectl get -n lab10 "$POD" -o jsonpath='{.spec.serviceAccountName}' 2>/dev/null)"
eq "uid-65534" "65534" "$(kubectl exec -n lab10 "$POD" -- id -u 2>/dev/null)"
okcmd "co-token" kubectl exec -n lab10 "$POD" -- ls /var/run/secrets/kubernetes.io/serviceaccount/token
if kubectl get -n lab10 "$POD" >/dev/null 2>&1; then nocmd "rootfs-chi-doc" kubectl exec -n lab10 "$POD" -- touch /x; else fail "rootfs-chi-doc" "chưa có Pod"; fi
eq "drop-ALL" "ALL" "$(kubectl get -n lab10 "$POD" -o jsonpath='{.spec.containers[0].securityContext.capabilities.drop[0]}' 2>/dev/null)"
eq "no-priv-escalation" "false" "$(kubectl get -n lab10 "$POD" -o jsonpath='{.spec.containers[0].securityContext.allowPrivilegeEscalation}' 2>/dev/null)"
eq "limit-mem" "64Mi" "$(kubectl get -n lab10 "$POD" -o jsonpath='{.spec.containers[0].resources.limits.memory}' 2>/dev/null)"
eq "qos" "Burstable" "$(kubectl get -n lab10 "$POD" -o jsonpath='{.status.qosClass}' 2>/dev/null)"
` + END,
        solution: `~~~bash
kubectl create sa audit-bot -n lab10
kubectl create role audit-reader -n lab10 --verb=get,list --resource=pods
kubectl create role audit-reader -n lab10 --verb=get --resource=configmaps --dry-run=client -o yaml   # xem khung rule thứ 2
kubectl edit role audit-reader -n lab10          # thêm rule configmaps chỉ get (xem YAML dưới)
kubectl create rolebinding audit-reader-binding -n lab10 --role=audit-reader --serviceaccount=lab10:audit-bot
kubectl create deploy audit-bot -n lab10 --image=busybox:1.36 --dry-run=client -o yaml -- sleep 36000 > audit.yaml
~~~
~~~yaml
# Role: 2 rule riêng vì verbs khác nhau
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
---
# phần template.spec của audit.yaml
    spec:
      serviceAccountName: audit-bot
      securityContext:
        runAsUser: 65534
        runAsNonRoot: true
      containers:
      - name: busybox
        image: busybox:1.36
        command: ["sleep", "36000"]
        securityContext:
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        resources:
          requests: {cpu: 50m, memory: 32Mi}
          limits: {cpu: 100m, memory: 64Mi}
~~~
~~~bash
kubectl apply -f audit.yaml
kubectl auth can-i list configmaps -n lab10 --as=system:serviceaccount:lab10:audit-bot   # no
~~~
**Vì sao:** {{kubectl create role}} với nhiều {{--resource}} gán **cùng** bộ verbs cho mọi resource, nên ở đây phải có 2 rule riêng (sửa YAML). {{get}} mà không có {{list}} nghĩa là chỉ đọc được ConfigMap biết tên, không liệt kê được: đúng tinh thần quyền tối thiểu. Token phải còn được mount vì agent gọi API, nên không đặt automountServiceAccountToken false. Requests khác limits nên QoS là Burstable.

**Mẹo tiết kiệm thời gian:** sinh Deployment bằng {{kubectl create deploy ... -- sleep 36000}} (lệnh sau {{--}} thành command), rồi chỉ việc dán khối securityContext/resources; dùng {{kubectl set resources}} và {{kubectl set serviceaccount}} nếu thích sửa bằng lệnh.`,
        hints: ['Role cần 2 rule: pods (get, list) và configmaps (get).', 'serviceAccountName và securityContext cấp Pod nằm trong spec.template.spec.', 'readOnlyRootFilesystem/capabilities/allowPrivilegeEscalation đặt trong securityContext của container.'],
        refs: [{ type: 'doc', title: 'Using RBAC Authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' }],
        tags: ['rbac', 'securitycontext', 'resources', 'least privilege'],
      },
    ],
  },

  // =====================================================================
  // MODULE 11 — Services và Ingress
  // =====================================================================
  {
    id: 'ckad-lab-11', order: 11,
    title: 'Services và Ingress: ClusterIP, NodePort, DNS, ingress-nginx',
    summary: 'Expose Deployment bằng ClusterIP/NodePort, phân biệt port/targetPort/nodePort, sửa selector sai, dùng DNS tên service; định tuyến HTTP theo host/path và rewrite bằng Ingress với ingress-nginx trên kind.',
    concepts: `### Service: địa chỉ ổn định cho tập Pod thay đổi liên tục
Pod có IP thay đổi mỗi lần tạo lại. Service cho một IP ảo (ClusterIP) và tên DNS cố định; kube-proxy chuyển gói tin tới các Pod khớp **selector**. Danh sách Pod đích nằm trong **EndpointSlice** (object Endpoints cũ đã bị đánh dấu deprecated từ 1.33). Service không có endpoint gần như luôn do **selector không khớp label** hoặc Pod chưa Ready.

| Field | Nghĩa |
|---|---|
| {{port}} | cổng của Service (client gọi) |
| {{targetPort}} | cổng của container nhận traffic (số hoặc tên port) |
| {{nodePort}} | (NodePort) cổng mở trên **mọi node**, mặc định dải 30000–32767 |

Loại Service: **ClusterIP** (mặc định, chỉ trong cluster), **NodePort** (ClusterIP + cổng trên node), **LoadBalancer** (NodePort + LB của cloud; trên kind sẽ Pending nếu không cài thêm), **ExternalName** (CNAME DNS).

### DNS
- Cùng namespace: gọi {{http://web-svc}}.
- Khác namespace: {{web-svc.lab11}} hoặc đầy đủ {{web-svc.lab11.svc.cluster.local}}.
Pod tìm được tên ngắn nhờ dòng {{search}} trong /etc/resolv.conf do kubelet tạo.

### Ingress
Ingress là **luật** định tuyến HTTP(S) theo host và path tới Service; cần **Ingress controller** (ở đây ingress-nginx) để thực thi. Không có controller, Ingress chỉ là object nằm im. Các điểm phải nhớ:
- {{apiVersion: networking.k8s.io/v1}}, {{spec.ingressClassName: nginx}} (annotation kubernetes.io/ingress.class đã lỗi thời).
- {{pathType}}: **Prefix** (khớp theo từng đoạn phân tách bởi /), **Exact**, **ImplementationSpecific** (dùng cho regex của nginx).
- backend: {{service.name}} + {{service.port.number}} (hoặc {{port.name}}), là **port của Service** chứ không phải port container.
- Rewrite: annotation {{nginx.ingress.kubernetes.io/rewrite-target}} với capture group của regex.

Trên kind, setup cài ingress-nginx bằng manifest chính thức của kind (controller chạy trên node có nhãn {{ingress-ready=true}}). Verify gọi controller qua Service nội bộ {{ingress-nginx-controller.ingress-nginx}} kèm header Host, nên không cần sửa /etc/hosts. Dự án ingress-nginx đã ngừng phát triển tính năng mới (hướng đi tiếp theo là Gateway API), nhưng Ingress API vẫn là kiến thức của CKAD.

### Cheat sheet
~~~bash
kubectl expose deploy web --name=web-svc --port=80 --target-port=8080
kubectl expose deploy web --name=web-np --type=NodePort --port=80 --target-port=8080
kubectl create service nodeport web-np --tcp=80:8080 --node-port=30111   # selector app=web-np, phải sửa lại
kubectl get endpointslices -l kubernetes.io/service-name=web-svc
kubectl set selector svc web-svc app=web
kubectl create ingress shop --class=nginx --rule="shop.local/api*=api-svc:80" --rule="shop.local/*=front-svc:80"
kubectl run tmp --rm -it --restart=Never --image=curlimages/curl:8.10.1 -- curl -s http://web-svc
~~~

### Bẫy hay gặp trong đề
- {{kubectl create service}} đặt selector {{app=<tên service>}}, gần như luôn sai; ưu tiên {{kubectl expose}}.
- Backend của Ingress trỏ tới port của **Service**, không phải containerPort.
- Quên {{ingressClassName}}: controller bỏ qua Ingress, mọi request trả 404.
- {{--rule="host/path*=svc:port"}}: dấu {{*}} cuối path tạo pathType Prefix, không có {{*}} là Exact.`,
    videos: [
      { title: 'Kubernetes Services explained | ClusterIP vs NodePort vs LoadBalancer vs Headless Service', url: 'https://www.youtube.com/watch?v=T4Z7visMM4E', note: 'Xem phần ClusterIP và NodePort: cách selector, port, targetPort ghép với nhau; ôn trước bài 01–03.' },
      { title: 'Kubernetes Ingress Tutorial for Beginners | simply explained | Kubernetes Tutorial 22', url: 'https://www.youtube.com/watch?v=80Ew_fsV4rM', note: 'Giải thích Ingress controller và luật host/path; xem trước bài 04–06.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-11-01', no: 1, domain: 'Services & Networking', level: 'easy', env: 'kind', minutes: 4,
        title: 'Expose Deployment bằng ClusterIP và gọi qua DNS',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab11}} đã có Deployment {{web}} (nginx, 2 replica, cổng 80) và Pod {{curl-client}} để thử kết nối.

1. Tạo Service {{web-svc}} loại ClusterIP, cổng {{80}}, chuyển tới cổng {{80}} của các Pod thuộc Deployment {{web}}.
2. Ghi **tên DNS đầy đủ (FQDN)** của Service này vào {{/opt/ckad/lab11-01.txt}}.

Kiểm tra: từ Pod {{curl-client}}, gọi FQDN đó trả về trang nginx; Service có 2 endpoint.`,
        setup: BASE11 + `kubectl delete svc web-svc -n lab11 --ignore-not-found
rm -f /opt/ckad/lab11-01.txt
`,
        verify: VH + HGET + `eq "svc-type" "ClusterIP" "$(kubectl get svc web-svc -n lab11 -o jsonpath='{.spec.type}' 2>/dev/null)"
eq "svc-port" "80" "$(kubectl get svc web-svc -n lab11 -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)"
kubectl rollout status deploy/web -n lab11 --timeout=60s >/dev/null 2>&1
N=$(kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=web-svc -o jsonpath='{.items[*].endpoints[*].addresses[0]}' 2>/dev/null | wc -w | tr -d ' ')
eq "endpoints-2" "2" "$N"
has "curl-fqdn" "$(cget http://web-svc.lab11.svc.cluster.local)" "Welcome to nginx"
eq "file-fqdn" "web-svc.lab11.svc.cluster.local" "$(fval /opt/ckad/lab11-01.txt)"
` + END,
        solution: `~~~bash
kubectl expose deploy web -n lab11 --name=web-svc --port=80 --target-port=80
kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=web-svc
kubectl exec -n lab11 curl-client -- curl -s http://web-svc.lab11.svc.cluster.local | head -5
echo web-svc.lab11.svc.cluster.local > /opt/ckad/lab11-01.txt
~~~
**Vì sao:** {{kubectl expose deploy}} copy selector của Deployment ({{app=web}}) sang Service, nên endpoint đúng ngay. FQDN có dạng {{<service>.<namespace>.svc.cluster.local}}; {{cluster.local}} là domain mặc định của cluster (kind dùng giá trị này). Trong cùng namespace gọi {{web-svc}} là đủ nhờ search domain trong /etc/resolv.conf của Pod.

**Mẹo tiết kiệm thời gian:** nếu không có sẵn Pod client, dùng {{kubectl run tmp --rm -it --restart=Never --image=busybox:1.36 -- wget -qO- http://web-svc.lab11}}: Pod tự xoá sau khi chạy xong.`,
        hints: ['kubectl expose deploy web --name=web-svc --port=80 -n lab11.', 'FQDN: <service>.<namespace>.svc.cluster.local.'],
        refs: [{ type: 'doc', title: 'DNS for Services and Pods', url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' }],
        tags: ['service', 'clusterip', 'dns'],
      },
      {
        id: 'ckad-lab-11-02', no: 2, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 7,
        title: 'Service không có endpoint: sửa selector và targetPort',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab11}}, Service {{api-svc}} (cổng 80) được tạo cho Deployment {{api}} nhưng mọi request đều lỗi. Deployment {{api}} chạy nginx không cần quyền root, **nghe cổng 8080**.

Sửa **chỉ Service** {{api-svc}} (không sửa Deployment {{api}}) để:
- Service chọn đúng các Pod của Deployment {{api}};
- Service vẫn mở cổng {{80}} và chuyển tới cổng {{8080}} của container.

Kiểm tra: từ Pod {{curl-client}}, {{curl http://api-svc}} trả về trang nginx.`,
        setup: BASE11 + `kubectl delete svc api-svc -n lab11 --ignore-not-found
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: api, namespace: lab11}
spec:
  replicas: 2
  selector: {matchLabels: {app: api, tier: backend}}
  template:
    metadata: {labels: {app: api, tier: backend}}
    spec:
      containers:
      - name: api
        image: nginxinc/nginx-unprivileged:1.27-alpine
        ports: [{name: http, containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: api-svc, namespace: lab11}
spec:
  selector: {app: api-v1}
  ports: [{port: 80, targetPort: 80}]
EOF
kubectl rollout status deploy/api -n lab11 --timeout=120s
`,
        verify: VH + HGET + `eq "svc-port-80" "80" "$(kubectl get svc api-svc -n lab11 -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)"
eq "deploy-label-giu-nguyen" "api" "$(kubectl get deploy api -n lab11 -o jsonpath='{.spec.template.metadata.labels.app}' 2>/dev/null)"
N=$(kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=api-svc -o jsonpath='{.items[*].endpoints[*].addresses[0]}' 2>/dev/null | wc -w | tr -d ' ')
eq "endpoints-2" "2" "$N"
eq "endpoint-port-8080" "8080" "$(kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=api-svc -o jsonpath='{.items[0].ports[0].port}' 2>/dev/null)"
has "curl-api-svc" "$(cget http://api-svc)" "Welcome to nginx"
` + END,
        solution: `~~~bash
kubectl get svc api-svc -n lab11 -o wide                 # SELECTOR app=api-v1
kubectl get pods -n lab11 --show-labels -l app=api       # Pod có app=api,tier=backend
kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=api-svc   # không có endpoint
kubectl edit svc api-svc -n lab11
~~~
~~~yaml
spec:
  selector:
    app: api
    tier: backend
  ports:
  - port: 80
    targetPort: 8080      # hoặc targetPort: http (tên port của container)
~~~
Cách dùng lệnh thay cho editor:
~~~bash
kubectl set selector svc api-svc -n lab11 app=api,tier=backend
kubectl patch svc api-svc -n lab11 --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'
kubectl exec -n lab11 curl-client -- curl -s http://api-svc | head -3
~~~
**Vì sao:** có 2 lỗi chồng nhau. Selector sai nên EndpointSlice rỗng (request bị từ chối ngay); sửa selector xong vẫn lỗi vì {{targetPort: 80}} trong khi container nghe 8080 (connection refused). Luôn kiểm tra theo thứ tự: selector khớp label, Pod Ready, targetPort khớp containerPort. Dùng **tên port** ({{targetPort: http}}) giúp Service không phải sửa khi container đổi số cổng.

**Mẹo tiết kiệm thời gian:** {{kubectl get svc -o wide}} hiện cột SELECTOR; so ngay với {{kubectl get pods --show-labels}} là thấy lỗi trong 10 giây.`,
        hints: ['So cột SELECTOR của kubectl get svc -o wide với nhãn Pod (--show-labels).', 'Sửa selector xong vẫn lỗi? Kiểm tra targetPort so với containerPort 8080.'],
        refs: [{ type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
        tags: ['service', 'selector', 'targetPort', 'troubleshooting'],
      },
      {
        id: 'ckad-lab-11-03', no: 3, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 6,
        title: 'NodePort cố định và phân biệt port/targetPort/nodePort',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab11}}, tạo Service {{web-np}} loại **NodePort** cho Deployment {{web}} với:
- {{port}}: {{8080}} (cổng của Service bên trong cluster)
- {{targetPort}}: {{80}} (cổng nginx trong container)
- {{nodePort}}: {{30111}}

Kiểm tra: từ Pod {{curl-client}}, cả {{http://web-np:8080}} lẫn {{http://<InternalIP của một node>:30111}} đều trả về trang nginx.`,
        setup: BASE11 + `kubectl delete svc web-np -n lab11 --ignore-not-found
`,
        verify: VH + HGET + `eq "svc-type" "NodePort" "$(kubectl get svc web-np -n lab11 -o jsonpath='{.spec.type}' 2>/dev/null)"
eq "port-8080" "8080" "$(kubectl get svc web-np -n lab11 -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)"
eq "nodePort-30111" "30111" "$(kubectl get svc web-np -n lab11 -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)"
has "curl-clusterip" "$(cget http://web-np:8080)" "Welcome to nginx"
NODEIP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)
has "curl-nodeport" "$(cget http://$NODEIP:30111)" "Welcome to nginx"
` + END,
        solution: `~~~bash
kubectl expose deploy web -n lab11 --name=web-np --type=NodePort --port=8080 --target-port=80 --dry-run=client -o yaml > np.yaml
~~~
Thêm {{nodePort}} (cờ của expose không đặt được giá trị này):
~~~yaml
spec:
  type: NodePort
  selector:
    app: web
  ports:
  - port: 8080
    targetPort: 80
    nodePort: 30111
~~~
~~~bash
kubectl apply -f np.yaml
kubectl get nodes -o wide                                  # lấy INTERNAL-IP
kubectl exec -n lab11 curl-client -- curl -s http://172.18.0.3:30111 | head -3
~~~
**Vì sao:** một gói tin đi qua 3 cổng: client ngoài cluster gọi **nodePort** trên bất kỳ node nào, kube-proxy chuyển tới **port** của Service (ClusterIP), rồi tới **targetPort** của Pod. NodePort mở trên **mọi** node, kể cả node không chạy Pod web. Không chỉ định nodePort thì Kubernetes chọn ngẫu nhiên trong dải 30000–32767; đề bắt cố định thì phải sửa YAML.

**Mẹo tiết kiệm thời gian:** {{kubectl create service nodeport web-np --tcp=8080:80 --node-port=30111}} đặt được nodePort nhưng selector sẽ là {{app=web-np}}: phải sửa thêm, nên {{expose}} + sửa YAML thường nhanh và ít sai hơn.`,
        hints: ['kubectl expose ... --type=NodePort --port=8080 --target-port=80 --dry-run=client -o yaml, rồi thêm nodePort: 30111.', 'Node IP lấy bằng kubectl get nodes -o wide (cột INTERNAL-IP).'],
        refs: [{ type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
        tags: ['service', 'nodeport'],
      },
      {
        id: 'ckad-lab-11-04', no: 4, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 8,
        title: 'Ingress định tuyến theo path tới hai Service',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup cài **ingress-nginx** cho kind (idempotent, chờ controller Ready) và tạo trong namespace {{lab11}} hai Service {{shop-front-svc}} và {{shop-api-svc}} (cổng 80).

Tạo Ingress {{shop-ing}} trong namespace {{lab11}} dùng IngressClass {{nginx}}, host {{shop.lab11.local}}:
- path {{/api}} (pathType {{Prefix}}) tới {{shop-api-svc}} cổng 80;
- path {{/}} (pathType {{Prefix}}) tới {{shop-front-svc}} cổng 80.

Kiểm tra: gọi ingress controller với header {{Host: shop.lab11.local}}: {{/}} trả về {{shop-front}}, {{/api/}} trả về {{shop-api}}.`,
        setup: BASE11 + INGRESS + SHOP + `kubectl delete ingress shop-ing -n lab11 --ignore-not-found
`,
        verify: VH + HGET + `eq "ingressClassName" "nginx" "$(kubectl get ingress shop-ing -n lab11 -o jsonpath='{.spec.ingressClassName}' 2>/dev/null)"
eq "host" "shop.lab11.local" "$(kubectl get ingress shop-ing -n lab11 -o jsonpath='{.spec.rules[0].host}' 2>/dev/null)"
hget "route-root" shop.lab11.local / shop-front
hget "route-api" shop.lab11.local /api/ shop-api
` + END,
        solution: `~~~bash
kubectl create ingress shop-ing -n lab11 --class=nginx --rule="shop.lab11.local/api*=shop-api-svc:80" --rule="shop.lab11.local/*=shop-front-svc:80"
kubectl get ingress shop-ing -n lab11
kubectl exec -n lab11 curl-client -- curl -s -H 'Host: shop.lab11.local' http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/
~~~
YAML tương đương:
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ing
  namespace: lab11
spec:
  ingressClassName: nginx
  rules:
  - host: shop.lab11.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: shop-api-svc
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: shop-front-svc
            port:
              number: 80
~~~
**Vì sao:** khi nhiều path cùng khớp, nginx chọn path **dài nhất** nên {{/api/}} vào shop-api, mọi path khác vào shop-front, không phụ thuộc thứ tự khai báo. Prefix khớp theo từng đoạn: {{/api}} khớp {{/api}} và {{/api/x}} nhưng không khớp {{/apix}}. Backend không rewrite, nên shop-api nhận nguyên đường dẫn {{/api/}}.

**Mẹo tiết kiệm thời gian:** {{kubectl create ingress}} với {{--rule}} nhanh hơn viết YAML nhiều; dấu {{*}} cuối path cho ra pathType Prefix. Ingress mới cần vài giây để controller nạp cấu hình, nên nếu 404 hãy thử lại trước khi sửa.`,
        hints: ['kubectl create ingress shop-ing --class=nginx --rule="host/path*=service:port" (lặp --rule cho từng path).', 'Dấu * cuối path nghĩa là pathType Prefix.'],
        refs: [{ type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
        tags: ['ingress', 'ingress-nginx', 'pathType'],
      },
      {
        id: 'ckad-lab-11-05', no: 5, domain: 'Services & Networking', level: 'hard', env: 'kind', minutes: 9,
        title: 'Ingress rewrite-target: giữ URL cũ /old cho ứng dụng mới',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup cài **ingress-nginx** cho kind và tạo Service {{shop-front-svc}} (cổng 80) trong namespace {{lab11}}; ứng dụng chỉ phục vụ ở gốc {{/}}. Khách hàng cũ vẫn dùng URL dạng {{http://legacy.lab11.local/old/...}}.

Tạo Ingress {{legacy-ing}} trong {{lab11}} (IngressClass {{nginx}}, host {{legacy.lab11.local}}) sao cho request {{/old/<phần còn lại>}} được chuyển tới {{shop-front-svc}} cổng 80 với đường dẫn **đã bỏ tiền tố /old** (ví dụ {{/old/index.html}} thành {{/index.html}}, {{/old/}} thành {{/}}). Dùng annotation rewrite của ingress-nginx với regex và pathType {{ImplementationSpecific}}.`,
        setup: BASE11 + INGRESS + SHOP + `kubectl delete ingress legacy-ing -n lab11 --ignore-not-found
`,
        verify: VH + HGET + `eq "ingressClassName" "nginx" "$(kubectl get ingress legacy-ing -n lab11 -o jsonpath='{.spec.ingressClassName}' 2>/dev/null)"
eq "backend" "shop-front-svc" "$(kubectl get ingress legacy-ing -n lab11 -o jsonpath='{.spec.rules[0].http.paths[0].backend.service.name}' 2>/dev/null)"
hget "rewrite-old-slash" legacy.lab11.local /old/ shop-front
hget "rewrite-old-index" legacy.lab11.local /old/index.html shop-front
` + END,
        solution: `~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: legacy-ing
  namespace: lab11
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - host: legacy.lab11.local
    http:
      paths:
      - path: /old(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: shop-front-svc
            port:
              number: 80
~~~
~~~bash
kubectl apply -f legacy-ing.yaml
kubectl exec -n lab11 curl-client -- curl -s -H 'Host: legacy.lab11.local' http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/old/index.html
~~~
**Vì sao:** regex {{/old(/|$)(.*)}} có 2 nhóm: nhóm 1 là dấu / (hoặc hết chuỗi), nhóm 2 là phần còn lại. {{rewrite-target: /$2}} thay đường dẫn gửi tới backend bằng {{/}} + nhóm 2, nên {{/old/index.html}} thành {{/index.html}}. Không có rewrite, backend nhận nguyên {{/old/index.html}} và trả 404. Regex cần pathType {{ImplementationSpecific}}: các bản ingress-nginx mới kiểm tra chặt path của Prefix/Exact và từ chối ký tự regex.

**Mẹo tiết kiệm thời gian:** sinh khung bằng {{kubectl create ingress legacy-ing --class=nginx --rule="legacy.lab11.local/old=shop-front-svc:80" --annotation=nginx.ingress.kubernetes.io/rewrite-target=/ --dry-run=client -o yaml}} rồi chỉ sửa path và pathType; ví dụ rewrite đầy đủ có trong docs của ingress-nginx.`,
        hints: ['Annotation: nginx.ingress.kubernetes.io/rewrite-target: /$2.', 'path dùng regex /old(/|$)(.*) với pathType ImplementationSpecific.'],
        refs: [{ type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
        tags: ['ingress', 'rewrite-target', 'regex'],
      },
      {
        id: 'ckad-lab-11-06', no: 6, domain: 'Services & Networking', level: 'hard', env: 'kind', minutes: 12,
        title: 'Tổng hợp: sửa chuỗi Deployment, Service, Ingress cho hai host',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup cài **ingress-nginx** cho kind. Trong namespace {{lab11}}, team blog đã tạo Deployment {{blog}} (nghe cổng 8080, trả {{blog-home}}), Service {{blog-svc}} và Ingress {{blog-ing}}, nhưng gọi {{http://blog.lab11.local/}} qua ingress chỉ nhận 404/503. Giữ nguyên tên các object và **không sửa Deployment**.

1. Sửa Service {{blog-svc}} để có endpoint đúng (cổng Service giữ {{80}}).
2. Sửa Ingress {{blog-ing}} để được ingress-nginx xử lý (IngressClass {{nginx}}) và backend trỏ đúng cổng của Service.
3. Thêm host thứ hai {{www.blog.lab11.local}} vào {{blog-ing}}, cũng định tuyến {{/}} (Prefix) tới {{blog-svc}}.
4. Ghi FQDN của Service vào {{/opt/ckad/lab11-06.txt}}.

Kết quả: cả hai host qua ingress đều trả về {{blog-home}}.`,
        setup: BASE11 + INGRESS + `kubectl delete ingress blog-ing -n lab11 --ignore-not-found
kubectl delete svc blog-svc -n lab11 --ignore-not-found
rm -f /opt/ckad/lab11-06.txt
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: {name: blog, namespace: lab11}
spec:
  replicas: 2
  selector: {matchLabels: {app: blog}}
  template:
    metadata: {labels: {app: blog}}
    spec:
      containers:
      - name: httpd
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo blog-home > /www/index.html && httpd -f -p 8080 -h /www"]
        ports: [{containerPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: blog-svc, namespace: lab11}
spec:
  selector: {app: blog}
  ports: [{port: 80, targetPort: 9090}]
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: {name: blog-ing, namespace: lab11}
spec:
  rules:
  - host: blog.lab11.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog-svc
            port: {number: 8080}
EOF
kubectl rollout status deploy/blog -n lab11 --timeout=120s
`,
        verify: VH + HGET + `eq "svc-port-80" "80" "$(kubectl get svc blog-svc -n lab11 -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)"
eq "svc-targetPort" "8080" "$(kubectl get svc blog-svc -n lab11 -o jsonpath='{.spec.ports[0].targetPort}' 2>/dev/null)"
has "curl-svc" "$(cget http://blog-svc.lab11.svc.cluster.local)" "blog-home"
eq "ingressClassName" "nginx" "$(kubectl get ingress blog-ing -n lab11 -o jsonpath='{.spec.ingressClassName}' 2>/dev/null)"
eq "backend-port-80" "80" "$(kubectl get ingress blog-ing -n lab11 -o jsonpath='{.spec.rules[0].http.paths[0].backend.service.port.number}' 2>/dev/null)"
hget "host-blog" blog.lab11.local / blog-home
hget "host-www" www.blog.lab11.local / blog-home
eq "file-fqdn" "blog-svc.lab11.svc.cluster.local" "$(fval /opt/ckad/lab11-06.txt)"
` + END,
        solution: `~~~bash
kubectl get endpointslices -n lab11 -l kubernetes.io/service-name=blog-svc   # port 9090: sai
kubectl get pods -n lab11 -l app=blog -o jsonpath='{.items[0].spec.containers[0].ports}'   # 8080
kubectl patch svc blog-svc -n lab11 --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'
kubectl edit ingress blog-ing -n lab11
echo blog-svc.lab11.svc.cluster.local > /opt/ckad/lab11-06.txt
~~~
~~~yaml
spec:
  ingressClassName: nginx
  rules:
  - host: blog.lab11.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog-svc
            port:
              number: 80          # port của Service, không phải 8080 của container
  - host: www.blog.lab11.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: blog-svc
            port:
              number: 80
~~~
**Vì sao:** có 3 lỗi theo 3 tầng. (1) targetPort 9090 trong khi container nghe 8080: endpoint có nhưng kết nối bị từ chối. (2) Ingress không có {{ingressClassName}}: ingress-nginx chỉ xử lý Ingress thuộc class của nó, nên bỏ qua hoàn toàn. (3) backend port 8080 không tồn tại trên Service (Service chỉ có cổng 80): nginx trả 503. Debug theo thứ tự từ trong ra ngoài: Pod trả lời được không, Service có endpoint đúng cổng không, rồi mới tới Ingress.

**Mẹo tiết kiệm thời gian:** {{kubectl describe ingress blog-ing -n lab11}} hiện cột Backends với endpoint thực tế; dòng "error: endpoints not found" hoặc thiếu backend chỉ ra ngay tầng hỏng.`,
        hints: ['So targetPort của Service với cổng container (8080).', 'Ingress thiếu spec.ingressClassName: nginx và backend port phải là 80 (port của Service).', 'Thêm một phần tử mới trong spec.rules cho host www.blog.lab11.local.'],
        refs: [{ type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }, { type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
        tags: ['ingress', 'service', 'troubleshooting', 'host-based'],
      },
    ],
  },

  // =====================================================================
  // MODULE 12 — NetworkPolicy, PVC, CRD
  // =====================================================================
  {
    id: 'ckad-lab-12', order: 12,
    title: 'NetworkPolicy, PersistentVolumeClaim và Custom Resource',
    summary: 'Default deny, mở luồng theo podSelector/namespaceSelector, egress kèm DNS với Calico trên kind; lưu dữ liệu bền bằng PVC local-path; đọc và sửa custom resource của một CRD có sẵn.',
    concepts: `### NetworkPolicy: firewall cấp Pod
Mặc định mọi Pod gọi được mọi Pod. Ngay khi **một** NetworkPolicy chọn một Pod (qua {{podSelector}}) cho chiều Ingress hoặc Egress, chiều đó của Pod trở thành **chỉ cho phép những gì được liệt kê**. Các policy **cộng dồn** (union), không có luật "deny" riêng. NetworkPolicy là luật trên API, **CNI plugin** mới là thứ thực thi: CNI không hỗ trợ thì policy tồn tại nhưng không có tác dụng.

**Trên kind:** CNI mặc định là kindnet; các bản kind cũ không thực thi NetworkPolicy, nên module này dùng **Calico**. Tạo lại cluster {{ckad}} với CNI tắt rồi để setup cài Calico (setup sẽ cảnh báo nếu cluster vẫn chạy kindnet):
~~~yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  disableDefaultCNI: true
  podSubnet: 192.168.0.0/16
nodes:
- role: control-plane
- role: worker
- role: worker
~~~
~~~bash
kind delete cluster --name ckad
kind create cluster --name ckad --config kind-ckad-calico.yaml
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml
kubectl -n kube-system rollout status ds/calico-node
~~~

### Ngữ nghĩa from/to: AND hay OR
~~~yaml
ingress:
- from:
  - namespaceSelector: {matchLabels: {team: monitoring}}
    podSelector: {matchLabels: {app: prober}}      # CÙNG phần tử: AND
- from:
  - namespaceSelector: {matchLabels: {team: monitoring}}
  - podSelector: {matchLabels: {app: prober}}      # 2 phần tử: OR (rộng hơn nhiều)
~~~
Một dấu gạch đầu dòng thừa biến luật chặt thành luật lỏng: đây là bẫy kinh điển. Namespace có sẵn nhãn {{kubernetes.io/metadata.name=<tên>}} để chọn theo tên.

**Egress default deny chặn cả DNS**: phải mở UDP/TCP 53 tới Pod CoreDNS ({{k8s-app=kube-dns}} trong {{kube-system}}), nếu không mọi lời gọi bằng tên service đều lỗi.

### PersistentVolumeClaim
Pod xin dung lượng qua **PVC** (kích thước, accessModes, storageClassName); **StorageClass** quyết định provisioner tạo **PV** tự động. kind có sẵn StorageClass {{standard}} (provisioner {{rancher.io/local-path}}, mặc định), với {{volumeBindingMode: WaitForFirstConsumer}}: PVC ở trạng thái **Pending** cho tới khi có Pod dùng nó (đây là bình thường, không phải lỗi). Dữ liệu nằm trên đĩa một node, PV có nodeAffinity nên Pod sau sẽ được xếp về đúng node đó.

### CRD và custom resource
**CustomResourceDefinition** mở rộng API bằng kind mới (operator thường cài sẵn CRD). Với CKAD bạn cần **dùng** CR: tìm tên/shortName/group bằng {{kubectl api-resources}}, đọc schema bằng {{kubectl explain}}, rồi get/describe/edit/patch như resource thường.

### Cheat sheet
~~~bash
kubectl get netpol -n ns; kubectl describe netpol x -n ns
kubectl label ns lab12-monitor team=monitoring
kubectl exec -n ns frontend -- wget -qO- -T 3 http://db-svc:8080     # thử kết nối, -T là timeout
kubectl get sc; kubectl get pvc,pv -n ns
kubectl api-resources --api-group=ops.lab12.io
kubectl explain backup.spec
kubectl patch bk nightly-db -n lab12 --type=merge -p '{"spec":{"retentionDays":14}}'
~~~

### Bẫy hay gặp trong đề
- {{podSelector: {} }} nghĩa là **mọi Pod** trong namespace, không phải "không Pod nào".
- Quên {{policyTypes: [Egress]}} khi chỉ viết khối egress rỗng: dễ hiểu sai kết quả, luôn ghi rõ policyTypes.
- Port trong NetworkPolicy là cổng **của Pod** (targetPort), không phải cổng Service.
- PVC Pending với WaitForFirstConsumer không cần sửa; còn Pending khi đã có Pod thì kiểm tra storageClassName và accessModes.`,
    videos: [
      { title: 'Day 26/40 - Kubernetes Network Policies Explained', url: 'https://www.youtube.com/watch?v=eVtnevr3Rao', note: 'Cả video: default deny, mở theo podSelector và cài Calico trên kind; khớp bài 01–04.' },
      { title: 'Kubernetes Network Policy Deep Dive', url: 'https://www.youtube.com/watch?v=Fr-6oDHbobM', note: 'Đi sâu ngữ nghĩa from/to (AND/OR), namespaceSelector và egress; xem trước bài 03–04.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-12-01', no: 1, domain: 'Services & Networking', level: 'easy', env: 'kind', minutes: 5,
        title: 'Default deny ingress cho cả namespace',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup kiểm tra/cài **Calico** (kindnet mặc định của kind có thể không thực thi NetworkPolicy, xem phần Khái niệm), xoá mọi NetworkPolicy cũ trong {{lab12}} và tạo: Deployment {{db}} + Service {{db-svc}} (cổng 8080), Pod {{frontend}} và {{backend}} trong namespace {{lab12}}, Service {{public-web}} trong namespace {{lab12-ext}}.

Tạo NetworkPolicy {{default-deny-ingress}} trong {{lab12}} chặn **mọi traffic đi vào** mọi Pod của namespace (không chặn traffic đi ra).

Kết quả: {{frontend}} và {{backend}} không gọi được {{db-svc}}, nhưng {{frontend}} vẫn gọi được {{public-web.lab12-ext}}.`,
        setup: NET12 + `kubectl delete networkpolicy --all -n lab12
`,
        verify: VH + NETV + `eq "podSelector-rong" "{}" "$(kubectl get netpol default-deny-ingress -n lab12 -o jsonpath='{.spec.podSelector}' 2>/dev/null)"
eq "policyTypes" "Ingress" "$(kubectl get netpol default-deny-ingress -n lab12 -o jsonpath='{.spec.policyTypes[*]}' 2>/dev/null)"
blocked "frontend-x-db" lab12 frontend "$DB" db-ok
blocked "backend-x-db" lab12 backend "$DB" db-ok
canreach "frontend-ra-ngoai" lab12 frontend http://public-web.lab12-ext public-ok
` + END,
        solution: `~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: lab12
spec:
  podSelector: {}          # mọi Pod trong namespace
  policyTypes:
  - Ingress                # không có khối ingress nào = không cho gì vào
~~~
~~~bash
kubectl apply -f deny.yaml
kubectl exec -n lab12 frontend -- wget -qO- -T 3 http://db-svc:8080          # timeout
kubectl exec -n lab12 frontend -- wget -qO- -T 3 http://public-web.lab12-ext  # public-ok
~~~
**Vì sao:** {{podSelector: {} }} chọn mọi Pod; liệt kê {{Ingress}} trong policyTypes mà không có khối {{ingress}} nghĩa là danh sách cho phép rỗng, nên mọi traffic vào bị chặn. Không liệt kê {{Egress}} nên traffic ra vẫn tự do (frontend vẫn gọi được namespace khác, DNS vẫn chạy). Đây là nền "zero trust" của namespace: sau đó mở từng luồng cần thiết bằng policy khác.

**Mẹo tiết kiệm thời gian:** không có lệnh {{kubectl create networkpolicy}}; mở docs trang "Network Policies", mục "Default policies" có sẵn YAML default deny để copy. Thử kết nối luôn kèm timeout ({{wget -T 3}}, {{curl --max-time 3}}) để không bị treo khi bị chặn.`,
        hints: ['Docs Network Policies có mục Default policies với YAML mẫu.', 'podSelector: {} + policyTypes: [Ingress], không viết khối ingress.'],
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
        tags: ['networkpolicy', 'default deny', 'calico'],
      },
      {
        id: 'ckad-lab-12-02', no: 2, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 6,
        title: 'Mở luồng backend tới db theo podSelector và cổng',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup (cần **Calico**, xem module 12) tạo lại môi trường của bài 01 và áp sẵn {{default-deny-ingress}} trong {{lab12}}.

Tạo NetworkPolicy {{db-allow-backend}} trong {{lab12}} áp cho các Pod có nhãn {{app=db}}, chỉ cho phép traffic vào từ Pod có nhãn {{app=backend}} (cùng namespace), giao thức TCP cổng {{8080}}.

Kết quả: {{backend}} gọi được {{db-svc:8080}}; {{frontend}} vẫn bị chặn.`,
        setup: NET12 + `kubectl delete networkpolicy --all -n lab12
` + DENY12,
        verify: VH + NETV + `eq "deny-van-con" "default-deny-ingress" "$(kubectl get netpol default-deny-ingress -n lab12 -o jsonpath='{.metadata.name}' 2>/dev/null)"
eq "chon-db" "db" "$(kubectl get netpol db-allow-backend -n lab12 -o jsonpath='{.spec.podSelector.matchLabels.app}' 2>/dev/null)"
eq "port-8080" "8080" "$(kubectl get netpol db-allow-backend -n lab12 -o jsonpath='{.spec.ingress[0].ports[0].port}' 2>/dev/null)"
canreach "backend-den-db" lab12 backend "$DB" db-ok
blocked "frontend-x-db" lab12 frontend "$DB" db-ok
` + END,
        solution: `~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-backend
  namespace: lab12
spec:
  podSelector:
    matchLabels:
      app: db                  # policy áp cho Pod db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: backend         # nguồn: Pod backend cùng namespace
    ports:
    - protocol: TCP
      port: 8080
~~~
~~~bash
kubectl apply -f db-allow-backend.yaml
kubectl exec -n lab12 backend -- wget -qO- -T 3 http://db-svc:8080     # db-ok
kubectl exec -n lab12 frontend -- wget -qO- -T 3 http://db-svc:8080    # timeout
~~~
**Vì sao:** policy cộng dồn: default deny chặn tất cả, {{db-allow-backend}} thêm một ngoại lệ cho Pod db. {{podSelector}} trong {{from}} không kèm namespaceSelector nghĩa là **cùng namespace với policy**. Cổng 8080 là cổng của Pod; nếu Service map 80 sang 8080 thì policy vẫn phải ghi 8080 vì policy được áp sau khi kube-proxy đã đổi địa chỉ.

**Mẹo tiết kiệm thời gian:** {{kubectl describe netpol db-allow-backend -n lab12}} in luật bằng chữ ("Allowing ingress traffic: To Port 8080/TCP, From PodSelector app=backend"), dễ soát lỗi hơn đọc YAML.`,
        hints: ['spec.podSelector chọn Pod ĐÍCH (db), ingress.from.podSelector chọn Pod NGUỒN (backend).', 'Thêm ports: [{protocol: TCP, port: 8080}] cùng phần tử với from.'],
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
        tags: ['networkpolicy', 'podSelector'],
      },
      {
        id: 'ckad-lab-12-03', no: 3, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 8,
        title: 'namespaceSelector AND podSelector: chỉ prober của team monitoring',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup (cần **Calico**) áp {{default-deny-ingress}} trong {{lab12}} và tạo trong namespace {{lab12-monitor}} hai Pod: {{prober}} (nhãn {{app=prober}}) và {{intruder}} (nhãn {{app=other}}).

1. Gắn nhãn {{team=monitoring}} cho namespace {{lab12-monitor}}.
2. Tạo NetworkPolicy {{db-allow-monitoring}} trong {{lab12}} cho Pod {{app=db}}: chỉ cho phép traffic TCP {{8080}} từ Pod có nhãn {{app=prober}} **nằm trong** namespace có nhãn {{team=monitoring}} (cả hai điều kiện cùng lúc).

Kết quả: {{prober}} gọi được {{db-svc.lab12:8080}}; {{intruder}} (cùng namespace monitoring) và {{frontend}} (lab12) đều bị chặn.`,
        setup: NET12 + `kubectl delete networkpolicy --all -n lab12
kubectl label namespace lab12-monitor team- >/dev/null 2>&1 || true
` + DENY12,
        verify: VH + NETV + `eq "ns-label" "monitoring" "$(kubectl get ns lab12-monitor -o jsonpath='{.metadata.labels.team}' 2>/dev/null)"
eq "chon-db" "db" "$(kubectl get netpol db-allow-monitoring -n lab12 -o jsonpath='{.spec.podSelector.matchLabels.app}' 2>/dev/null)"
canreach "prober-den-db" lab12-monitor prober "$DB" db-ok
blocked "intruder-x-db" lab12-monitor intruder "$DB" db-ok
blocked "frontend-x-db" lab12 frontend "$DB" db-ok
` + END,
        solution: `~~~bash
kubectl label namespace lab12-monitor team=monitoring
~~~
~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-allow-monitoring
  namespace: lab12
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:          # KHÔNG có dấu - ở dòng podSelector bên dưới
        matchLabels:
          team: monitoring
      podSelector:
        matchLabels:
          app: prober
    ports:
    - protocol: TCP
      port: 8080
~~~
~~~bash
kubectl apply -f db-allow-monitoring.yaml
kubectl exec -n lab12-monitor prober -- wget -qO- -T 3 http://db-svc.lab12:8080     # db-ok
kubectl exec -n lab12-monitor intruder -- wget -qO- -T 3 http://db-svc.lab12:8080   # timeout
~~~
**Vì sao:** namespaceSelector và podSelector trong **cùng một phần tử** của {{from}} là phép AND: Pod phải có app=prober và nằm trong namespace team=monitoring. Nếu viết thành 2 phần tử (thêm dấu {{-}} trước podSelector) thì thành OR: mọi Pod trong namespace monitoring (kể cả intruder) **hoặc** mọi Pod app=prober trong lab12 đều vào được. Namespace không có nhãn team thì namespaceSelector không khớp, nên bước gắn nhãn là bắt buộc.

**Mẹo tiết kiệm thời gian:** nếu đề không cho nhãn namespace, dùng nhãn có sẵn {{kubernetes.io/metadata.name: lab12-monitor}} thay vì tự gắn nhãn; kiểm tra bằng {{kubectl get ns --show-labels}}.`,
        hints: ['kubectl label namespace lab12-monitor team=monitoring.', 'namespaceSelector và podSelector phải nằm trong CÙNG một phần tử của from (chỉ một dấu -).'],
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
        tags: ['networkpolicy', 'namespaceSelector'],
      },
      {
        id: 'ckad-lab-12-04', no: 4, domain: 'Services & Networking', level: 'hard', env: 'kind', minutes: 10,
        title: 'Egress chỉ tới db và DNS',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup (cần **Calico**) áp {{default-deny-ingress}} và {{db-allow-backend}} (backend được vào db cổng 8080) trong {{lab12}}. Hiện Pod {{backend}} gọi được mọi nơi, kể cả {{public-web.lab12-ext}}.

Tạo NetworkPolicy {{backend-egress}} trong {{lab12}} cho Pod {{app=backend}}, kiểm soát chiều **Egress**, chỉ cho phép:
- tới Pod {{app=db}} cùng namespace, TCP {{8080}};
- tới Pod CoreDNS (nhãn {{k8s-app=kube-dns}}) trong namespace {{kube-system}}, cổng {{53}} cả UDP và TCP.

Kết quả: {{backend}} vẫn gọi được {{db-svc}} **bằng tên** (DNS chạy), nhưng không gọi được {{public-web.lab12-ext}}; {{frontend}} không bị ảnh hưởng.`,
        setup: NET12 + `kubectl delete networkpolicy --all -n lab12
` + DENY12 + `kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: db-allow-backend, namespace: lab12}
spec:
  podSelector: {matchLabels: {app: db}}
  policyTypes: ["Ingress"]
  ingress:
  - from: [{podSelector: {matchLabels: {app: backend}}}]
    ports: [{protocol: TCP, port: 8080}]
EOF
`,
        verify: VH + NETV + `has "policyTypes-Egress" "$(kubectl get netpol backend-egress -n lab12 -o jsonpath='{.spec.policyTypes[*]}' 2>/dev/null)" "Egress"
eq "chon-backend" "backend" "$(kubectl get netpol backend-egress -n lab12 -o jsonpath='{.spec.podSelector.matchLabels.app}' 2>/dev/null)"
canreach "backend-den-db-bang-ten" lab12 backend "$DB" db-ok
if kubectl get netpol backend-egress -n lab12 >/dev/null 2>&1; then blocked "backend-x-public" lab12 backend http://public-web.lab12-ext public-ok; else fail "backend-x-public" "chưa có policy backend-egress"; fi
canreach "frontend-khong-anh-huong" lab12 frontend http://public-web.lab12-ext public-ok
` + END,
        solution: `~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: lab12
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: db
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
~~~
~~~bash
kubectl apply -f backend-egress.yaml
kubectl exec -n lab12 backend -- wget -qO- -T 3 http://db-svc:8080                # db-ok
kubectl exec -n lab12 backend -- wget -qO- -T 3 http://public-web.lab12-ext       # timeout
~~~
**Vì sao:** khi chiều Egress của backend bị một policy chọn, mọi kết nối ra (kể cả truy vấn DNS tới CoreDNS) đều bị chặn trừ những gì liệt kê. Quên luật DNS thì {{wget http://db-svc:8080}} báo "bad address" dù luật tới db đúng: lỗi kinh điển. Luồng backend tới db cần **cả hai chiều** được phép: egress của backend (policy này) và ingress của db ({{db-allow-backend}} có sẵn). DNS dùng UDP là chính, TCP khi bản trả lời lớn, nên mở cả hai.

**Mẹo tiết kiệm thời gian:** {{kubectl get pods -n kube-system --show-labels | grep dns}} để chắc nhãn của CoreDNS; namespace luôn có nhãn {{kubernetes.io/metadata.name}} nên không cần tự gắn.`,
        hints: ['policyTypes: [Egress] và hai phần tử trong egress: một tới db, một tới kube-dns.', 'Chọn namespace kube-system bằng nhãn kubernetes.io/metadata.name: kube-system, cùng phần tử với podSelector k8s-app: kube-dns.', 'Mở cổng 53 cho cả UDP và TCP.'],
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
        tags: ['networkpolicy', 'egress', 'dns'],
      },
      {
        id: 'ckad-lab-12-05', no: 5, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 8,
        title: 'PVC local-path: dữ liệu sống sót khi Pod bị xoá',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab12}} (setup xoá các object cũ của bài này):

1. Tạo PVC {{data-pvc}}: {{1Gi}}, accessMode {{ReadWriteOnce}}, StorageClass {{standard}}.
2. Tạo Pod {{pvc-writer}} (image {{busybox:1.36}}) mount PVC tại {{/data}}, ghi chuỗi {{persisted-12}} vào {{/data/out.txt}} rồi ngủ. Khi file đã được ghi, **xoá** Pod {{pvc-writer}}.
3. Tạo Pod {{pvc-reader}} (image {{busybox:1.36}}, lệnh {{sleep 3600}}) mount cùng PVC tại {{/data}}.
4. Ghi tên **provisioner** của StorageClass {{standard}} vào {{/opt/ckad/lab12-05.txt}}.

Kết quả: PVC Bound, {{pvc-reader}} đọc được {{persisted-12}} trong {{/data/out.txt}}.`,
        setup: SH + `mkns lab12
kubectl delete pod pvc-writer pvc-reader -n lab12 --ignore-not-found --wait=true
kubectl delete pvc data-pvc -n lab12 --ignore-not-found --wait=true
rm -f /opt/ckad/lab12-05.txt
`,
        verify: VH + `eq "pvc-bound" "Bound" "$(kubectl get pvc data-pvc -n lab12 -o jsonpath='{.status.phase}' 2>/dev/null)"
eq "storageClass" "standard" "$(kubectl get pvc data-pvc -n lab12 -o jsonpath='{.spec.storageClassName}' 2>/dev/null)"
eq "size-1Gi" "1Gi" "$(kubectl get pvc data-pvc -n lab12 -o jsonpath='{.spec.resources.requests.storage}' 2>/dev/null)"
eq "accessMode" "ReadWriteOnce" "$(kubectl get pvc data-pvc -n lab12 -o jsonpath='{.spec.accessModes[0]}' 2>/dev/null)"
nocmd "writer-da-xoa" kubectl get pod pvc-writer -n lab12
okcmd "reader-ready" kubectl wait --for=condition=Ready pod/pvc-reader -n lab12 --timeout=90s
eq "reader-dung-pvc" "data-pvc" "$(kubectl get pod pvc-reader -n lab12 -o jsonpath='{.spec.volumes[*].persistentVolumeClaim.claimName}' 2>/dev/null)"
eq "du-lieu-con" "persisted-12" "$(kubectl exec pvc-reader -n lab12 -- cat /data/out.txt 2>/dev/null)"
eq "file-provisioner" "rancher.io/local-path" "$(fval /opt/ckad/lab12-05.txt)"
` + END,
        solution: `~~~yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: lab12
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: standard
  resources:
    requests:
      storage: 1Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: pvc-writer
  namespace: lab12
spec:
  containers:
  - name: w
    image: busybox:1.36
    command: ["sh", "-c", "echo persisted-12 > /data/out.txt && sleep 3600"]
    volumeMounts:
    - {name: data, mountPath: /data}
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: data-pvc
~~~
~~~bash
kubectl apply -f pvc-writer.yaml
kubectl get pvc -n lab12                  # Pending cho tới khi Pod được xếp lịch, rồi Bound
kubectl wait --for=condition=Ready pod/pvc-writer -n lab12
kubectl delete pod pvc-writer -n lab12 --grace-period=0 --force
# pvc-reader: copy pvc-writer.yaml, đổi name và command thành ["sleep", "3600"]
kubectl apply -f pvc-reader.yaml
kubectl exec -n lab12 pvc-reader -- cat /data/out.txt
kubectl get sc standard -o jsonpath='{.provisioner}' > /opt/ckad/lab12-05.txt
~~~
**Vì sao:** PVC tách vòng đời dữ liệu khỏi vòng đời Pod: xoá Pod không xoá PVC/PV. StorageClass {{standard}} của kind dùng {{WaitForFirstConsumer}} nên PVC Pending tới khi có Pod: đừng hoảng và đừng sửa gì. local-path lưu dữ liệu trên một node; PV có nodeAffinity nên scheduler tự đặt {{pvc-reader}} lên đúng node đó. {{ReadWriteOnce}} giới hạn theo **node**, không phải theo Pod.

**Mẹo tiết kiệm thời gian:** {{--grace-period=0 --force}} xoá ngay Pod busybox (sleep không xử lý SIGTERM nên bình thường chờ 30 giây); trong đề, đặt alias {{export now="--force --grace-period=0"}}.`,
        hints: ['PVC Pending trước khi có Pod là bình thường (WaitForFirstConsumer).', 'Pod dùng volumes[].persistentVolumeClaim.claimName: data-pvc.', 'kubectl get sc standard -o jsonpath={.provisioner}.'],
        refs: [{ type: 'doc', title: 'Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' }],
        tags: ['pvc', 'storageclass', 'local-path'],
      },
      {
        id: 'ckad-lab-12-06', no: 6, domain: 'Environment, Config & Security', level: 'medium', env: 'kind', minutes: 7,
        title: 'Làm việc với custom resource của CRD có sẵn',
        task: `Context: {{kubectl config use-context kind-ckad}}

Một operator sao lưu đã cài CRD với kind {{Backup}} (setup tạo CRD và custom resource {{nightly-db}} trong namespace {{lab12}}).

1. Tìm **apiVersion đầy đủ** (dạng group/version) của kind {{Backup}} và ghi vào {{/opt/ckad/lab12-06.txt}}.
2. Sửa Backup {{nightly-db}}: đổi {{spec.retentionDays}} thành {{14}}, các field khác giữ nguyên.
3. Tạo Backup mới {{weekly-files}} trong {{lab12}} với {{spec.schedule}} là {{0 3 * * 0}}, {{spec.target}} là {{files}}, {{spec.retentionDays}} là {{30}}.

Gợi ý tìm hiểu: dùng {{kubectl api-resources}} và {{kubectl explain}}; giá trị retentionDays bị CRD giới hạn trong khoảng cho phép.`,
        setup: SH + `mkns lab12
` + CRD12 + `kubectl delete backup weekly-files -n lab12 --ignore-not-found
rm -f /opt/ckad/lab12-06.txt
kubectl apply -f - <<'EOF'
apiVersion: ops.lab12.io/v1
kind: Backup
metadata: {name: nightly-db, namespace: lab12}
spec:
  schedule: "0 1 * * *"
  target: postgres
  retentionDays: 7
EOF
`,
        verify: VH + `eq "file-apiVersion" "ops.lab12.io/v1" "$(fval /opt/ckad/lab12-06.txt)"
eq "nightly-retention-14" "14" "$(kubectl get backup nightly-db -n lab12 -o jsonpath='{.spec.retentionDays}' 2>/dev/null)"
eq "nightly-target-giu" "postgres" "$(kubectl get backup nightly-db -n lab12 -o jsonpath='{.spec.target}' 2>/dev/null)"
eq "nightly-schedule-giu" "0 1 * * *" "$(kubectl get backup nightly-db -n lab12 -o jsonpath='{.spec.schedule}' 2>/dev/null)"
eq "weekly-schedule" "0 3 * * 0" "$(kubectl get backup weekly-files -n lab12 -o jsonpath='{.spec.schedule}' 2>/dev/null)"
eq "weekly-target" "files" "$(kubectl get backup weekly-files -n lab12 -o jsonpath='{.spec.target}' 2>/dev/null)"
eq "weekly-retention" "30" "$(kubectl get backup weekly-files -n lab12 -o jsonpath='{.spec.retentionDays}' 2>/dev/null)"
` + END,
        solution: `~~~bash
kubectl get crd | grep -i backup                      # backups.ops.lab12.io
kubectl api-resources | grep -i backup                # backups  bk  ops.lab12.io/v1  true  Backup
echo ops.lab12.io/v1 > /opt/ckad/lab12-06.txt
kubectl explain backup.spec                           # schedule, target, retentionDays (1..30), suspend
kubectl get bk -n lab12                               # cột Target, Retention, Schedule từ additionalPrinterColumns
kubectl patch bk nightly-db -n lab12 --type=merge -p '{"spec":{"retentionDays":14}}'
~~~
~~~yaml
apiVersion: ops.lab12.io/v1
kind: Backup
metadata:
  name: weekly-files
  namespace: lab12
spec:
  schedule: "0 3 * * 0"      # bắt buộc đặt trong nháy kép: dấu * không hợp lệ ở đầu giá trị YAML
  target: files
  retentionDays: 30
~~~
~~~bash
kubectl apply -f weekly.yaml
kubectl get bk -n lab12
~~~
**Vì sao:** custom resource dùng như resource thường: get/describe/edit/patch, kể cả shortName ({{bk}}) mà CRD khai báo. apiVersion là {{<group>/<version>}} lấy từ CRD (cột APIVERSION của api-resources). Schema OpenAPI của CRD được API server kiểm tra: thử {{retentionDays: 60}} sẽ bị từ chối vì vượt maximum 30; đây là cách operator chặn cấu hình sai từ sớm. Với CR, {{--type=merge}} là bắt buộc khi patch vì custom resource không hỗ trợ strategic merge patch (kiểu mặc định của kubectl patch).

**Mẹo tiết kiệm thời gian:** {{kubectl get bk nightly-db -n lab12 -o yaml > weekly.yaml}} rồi sửa tên và spec, xoá {{uid}}/{{resourceVersion}}/{{creationTimestamp}}: nhanh hơn viết từ đầu và không sai apiVersion.`,
        hints: ['kubectl api-resources | grep -i backup cho shortName và APIVERSION.', 'Patch custom resource phải dùng --type=merge.', 'Giá trị schedule chứa * phải đặt trong nháy kép trong YAML.'],
        refs: [{ type: 'doc', title: 'Extend the Kubernetes API with CustomResourceDefinitions', url: 'https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/' }],
        tags: ['crd', 'custom resource'],
      },
      {
        id: 'ckad-lab-12-07', no: 7, domain: 'Services & Networking', level: 'hard', env: 'kind', minutes: 15,
        title: 'Tổng hợp: dịch vụ ledger có PVC, NetworkPolicy và Backup CR',
        task: `Context: {{kubectl config use-context kind-ckad}}

Setup (cần **Calico**) áp {{default-deny-ingress}} trong {{lab12}}, tạo CRD {{Backup}} và Pod {{auditor}} (nhãn {{app=auditor}}) cùng {{frontend}} trong {{lab12}}. Triển khai dịch vụ ledger trong {{lab12}}:

1. PVC {{ledger-data}}: {{256Mi}}, {{ReadWriteOnce}}, StorageClass {{standard}}.
2. Deployment {{ledger}} (1 replica, nhãn {{app=ledger}}, image {{busybox:1.36}}) với lệnh {{sh -c "echo ledger-ok > /data/index.html && httpd -f -p 8080 -h /data"}}, mount PVC {{ledger-data}} tại {{/data}}.
3. Service {{ledger-svc}}: cổng {{80}} tới cổng {{8080}} của Pod ledger.
4. NetworkPolicy {{ledger-allow-frontend}}: Pod {{app=ledger}} chỉ nhận traffic TCP {{8080}} từ Pod {{app=frontend}}.
5. Backup {{ledger-backup}} ({{ops.lab12.io/v1}}): target {{ledger-data}}, schedule {{*/30 * * * *}}, retentionDays {{3}}.

Kết quả: {{frontend}} gọi {{http://ledger-svc}} nhận {{ledger-ok}}; {{auditor}} bị chặn.`,
        setup: NET12 + CRD12 + `kubectl delete networkpolicy --all -n lab12
` + DENY12 + `kubectl run auditor -n lab12 --image=busybox:1.36 --labels=app=auditor --restart=Never --dry-run=client -o yaml --command -- sleep 36000 | kubectl apply -f -
kubectl wait --for=condition=Ready pod/auditor -n lab12 --timeout=120s
`,
        verify: VH + NETV + `LED=http://ledger-svc.lab12.svc.cluster.local
eq "pvc-bound" "Bound" "$(kubectl get pvc ledger-data -n lab12 -o jsonpath='{.status.phase}' 2>/dev/null)"
eq "pvc-256Mi" "256Mi" "$(kubectl get pvc ledger-data -n lab12 -o jsonpath='{.spec.resources.requests.storage}' 2>/dev/null)"
okcmd "ledger-rollout" kubectl rollout status deploy/ledger -n lab12 --timeout=120s
eq "ledger-dung-pvc" "ledger-data" "$(kubectl get deploy ledger -n lab12 -o jsonpath='{.spec.template.spec.volumes[*].persistentVolumeClaim.claimName}' 2>/dev/null)"
eq "svc-port-80" "80" "$(kubectl get svc ledger-svc -n lab12 -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)"
canreach "frontend-den-ledger" lab12 frontend "$LED" ledger-ok
if kubectl get netpol ledger-allow-frontend -n lab12 >/dev/null 2>&1; then blocked "auditor-x-ledger" lab12 auditor "$LED" ledger-ok; else fail "auditor-x-ledger" "chưa có policy ledger-allow-frontend"; fi
eq "netpol-chon-ledger" "ledger" "$(kubectl get netpol ledger-allow-frontend -n lab12 -o jsonpath='{.spec.podSelector.matchLabels.app}' 2>/dev/null)"
eq "backup-target" "ledger-data" "$(kubectl get backup ledger-backup -n lab12 -o jsonpath='{.spec.target}' 2>/dev/null)"
eq "backup-schedule" "*/30 * * * *" "$(kubectl get backup ledger-backup -n lab12 -o jsonpath='{.spec.schedule}' 2>/dev/null)"
eq "backup-retention" "3" "$(kubectl get backup ledger-backup -n lab12 -o jsonpath='{.spec.retentionDays}' 2>/dev/null)"
` + END,
        solution: `~~~yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: ledger-data, namespace: lab12}
spec:
  accessModes: ["ReadWriteOnce"]
  storageClassName: standard
  resources: {requests: {storage: 256Mi}}
---
apiVersion: apps/v1
kind: Deployment
metadata: {name: ledger, namespace: lab12}
spec:
  replicas: 1
  selector: {matchLabels: {app: ledger}}
  template:
    metadata: {labels: {app: ledger}}
    spec:
      containers:
      - name: ledger
        image: busybox:1.36
        command: ["sh", "-c", "echo ledger-ok > /data/index.html && httpd -f -p 8080 -h /data"]
        volumeMounts: [{name: data, mountPath: /data}]
      volumes:
      - name: data
        persistentVolumeClaim: {claimName: ledger-data}
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: ledger-allow-frontend, namespace: lab12}
spec:
  podSelector: {matchLabels: {app: ledger}}
  policyTypes: ["Ingress"]
  ingress:
  - from: [{podSelector: {matchLabels: {app: frontend}}}]
    ports: [{protocol: TCP, port: 8080}]
---
apiVersion: ops.lab12.io/v1
kind: Backup
metadata: {name: ledger-backup, namespace: lab12}
spec:
  schedule: "*/30 * * * *"
  target: ledger-data
  retentionDays: 3
~~~
~~~bash
kubectl apply -f ledger.yaml
kubectl expose deploy ledger -n lab12 --name=ledger-svc --port=80 --target-port=8080
kubectl exec -n lab12 frontend -- wget -qO- -T 3 http://ledger-svc     # ledger-ok
kubectl exec -n lab12 auditor -- wget -qO- -T 3 http://ledger-svc      # timeout
~~~
**Vì sao:** bài ghép đủ chuỗi của một dịch vụ có trạng thái: PVC giữ dữ liệu, Deployment dùng PVC, Service cho tên ổn định, NetworkPolicy mở đúng một luồng trên nền default deny, CR mô tả lịch sao lưu cho operator. Policy ghi cổng **8080** (cổng Pod) dù client gọi Service cổng 80. Deployment dùng PVC RWO nên chỉ để 1 replica; khi rolling update, Pod mới cùng node vẫn mount được, nhưng nhiều replica rải nhiều node thì không.

**Mẹo tiết kiệm thời gian:** gom nhiều object vào một file phân tách bằng {{---}} và apply một lần; dùng {{kubectl expose}} cho Service thay vì viết YAML; kiểm tra từng tầng theo thứ tự PVC Bound, Pod Ready, endpoint, rồi mới thử NetworkPolicy.`,
        hints: ['Làm theo thứ tự: PVC, Deployment, Service (kubectl expose), NetworkPolicy, Backup CR.', 'NetworkPolicy dùng cổng 8080 của Pod, không phải cổng 80 của Service.', 'schedule */30 * * * * phải đặt trong nháy kép trong YAML.'],
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }, { type: 'doc', title: 'Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' }],
        tags: ['networkpolicy', 'pvc', 'crd', 'tổng hợp'],
      },
    ],
  }

  );
})();
