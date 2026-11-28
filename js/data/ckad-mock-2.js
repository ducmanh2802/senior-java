/* CKAD hands-on mock exam 2 (docs/CKAD-MOCK.md) — original tasks, a bit harder than the real exam (multi-step, stacked faults). */
(window.CKAD_EXAMS = window.CKAD_EXAMS || []).push({
  id: 'ckad-2',
  title: 'Đề thi thử CKAD thực hành số 2',
  minutes: 120,
  passPct: 66,
  intro: `**Đề tự biên soạn**, khó hơn kỳ thi CKAD một chút: nhiều bài có nhiều bước, có bài **lỗi chồng lỗi** (sửa xong một lỗi vẫn còn lỗi khác). 17 bài, 120 phút, đạt từ 66%. Mọi tài nguyên nằm trong các namespace bắt đầu bằng {{m2-}} nên không đụng các đề khác.

### Môi trường: một cluster kind tên ckad
Cần Docker (hoặc Podman), {{kind}} ≥ 0.23 và {{kubectl}} ≥ 1.30. Cluster gồm 1 control-plane và 2 worker. CNI mặc định của kind (kindnet) **không thực thi NetworkPolicy**, vì vậy ta tắt nó và cài Calico. Node control-plane có nhãn {{ingress-ready=true}} để ingress-nginx bản dành cho kind chạy trên đó.

~~~yaml
# kind-ckad.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: ckad
networking:
  disableDefaultCNI: true
  podSubnet: 192.168.0.0/16
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
  - containerPort: 443
    hostPort: 443
- role: worker
- role: worker
~~~

~~~bash
kind create cluster --config kind-ckad.yaml
kubectl config use-context kind-ckad
# Calico (bắt buộc: không có CNI thì node không Ready)
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml
kubectl wait --for=condition=Ready nodes --all --timeout=300s
# Thư mục chứa file đáp án
sudo mkdir -p /opt/ckad && sudo chown "$(id -u):$(id -g)" /opt/ckad
~~~

Các thành phần còn lại được setup của bài cần nó tự cài nếu chưa có: **ingress-nginx** bản kind (bài 4) và **metrics-server** với cờ {{--kubelet-insecure-tls}} (bài 15). StorageClass mặc định {{standard}} của kind (local-path) dùng cho bài PVC.

### Alias nên gõ ngay khi vào phòng thi
~~~bash
alias k=kubectl
export do="--dry-run=client -o yaml"   # k create deploy x --image=nginx $do > x.yaml
export now="--force --grace-period=0"  # k delete pod x $now
source <(kubectl completion bash); complete -o default -F __start_kubectl k
~~~

### Cách luyện
1. Mở bài, chép phần **Setup** vào file (ví dụ {{setup.sh}}) rồi chạy {{bash setup.sh}}. Setup idempotent: chạy lại sẽ đưa bài về trạng thái ban đầu.
2. Bấm giờ, làm bài chỉ bằng terminal và docs kubernetes.io (giống kỳ thi).
3. Chép phần **Verify** vào {{verify.sh}}, chạy {{bash verify.sh}}: mỗi dòng {{PASS}}/{{FAIL}} là một tiêu chí, dòng cuối {{RESULT đạt/tổng}}. Verify kiểm **hành vi** (pod Ready, curl được hay không, quyền RBAC, revision) chứ không so YAML từng chữ.
4. Chỉ xem Lời giải sau khi đã làm xong hoặc hết giờ. Bài nào quá thời gian gợi ý thì đánh dấu, làm bài khác rồi quay lại, đúng chiến thuật khi thi thật.

> Mỗi bài mở đầu bằng dòng Context: trong kỳ thi có nhiều cluster, quên chuyển context là mất điểm dù làm đúng. Ở đây chỉ có {{kind-ckad}} nhưng hãy tập thói quen chạy lệnh đó trước mỗi bài.`,
  tasks: [
    // ---------------------------------------------------------------- 1
    {
      id: 'ckad-2-01', no: 1, domain: 'Design & Build', weight: 7, env: 'kind', minutes: 8,
      title: 'Job không bao giờ Complete vì sidecar: chuyển sang native sidecar',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{m2-sidecar}} có Job {{m2-report}}: container {{report}} ghi 3 dòng vào {{/work/report.log}} rồi thoát, container {{shipper}} chạy {{tail -F}} để đẩy log. Job đã chạy rất lâu mà không bao giờ **Complete**, vì {{shipper}} là container thường và không bao giờ dừng.

Hãy sửa để Job hoàn thành:
1. Viết lại Job {{m2-report}} (cùng tên, cùng namespace) sao cho {{shipper}} là **native sidecar**: nằm trong {{initContainers}} với {{restartPolicy: Always}}. Trong {{containers}} chỉ còn {{report}}. Giữ nguyên image {{busybox:1.36}}, lệnh và volume {{emptyDir}} tên {{work}} mount ở {{/work}}.
2. Đặt {{terminationGracePeriodSeconds: 5}} cho Pod để sidecar dừng nhanh khi {{report}} xong.
3. Lưu manifest cuối cùng vào {{/opt/ckad/m2-report.yaml}}.

Job phải đạt trạng thái Complete và log của {{shipper}} phải chứa dòng {{line 3}}.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-report.yaml
kubectl create namespace m2-sidecar --dry-run=client -o yaml | kubectl apply -f -
kubectl delete job m2-report -n m2-sidecar --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: m2-report
  namespace: m2-sidecar
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      volumes:
      - name: work
        emptyDir: {}
      containers:
      - name: report
        image: busybox:1.36
        command: ["sh", "-c", "for i in 1 2 3; do echo line $i >> /work/report.log; sleep 2; done"]
        volumeMounts:
        - name: work
          mountPath: /work
      - name: shipper
        image: busybox:1.36
        command: ["sh", "-c", "touch /work/report.log; tail -F /work/report.log"]
        volumeMounts:
        - name: work
          mountPath: /work
EOF
echo "Setup xong: Job m2-report sẽ không bao giờ Complete."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-sidecar
RP=$(kubectl get job m2-report -n $NS -o jsonpath='{.spec.template.spec.initContainers[?(@.name=="shipper")].restartPolicy}' 2>/dev/null)
[ "$RP" = "Always" ] && pass native-sidecar || fail native-sidecar "initContainers shipper restartPolicy='$RP'"
C=$(kubectl get job m2-report -n $NS -o jsonpath='{.spec.template.spec.containers[*].name}' 2>/dev/null)
[ "$C" = "report" ] && pass only-report-container || fail only-report-container "containers='$C'"
G=$(kubectl get job m2-report -n $NS -o jsonpath='{.spec.template.spec.terminationGracePeriodSeconds}' 2>/dev/null)
[ "$G" = "5" ] && pass grace-period || fail grace-period "terminationGracePeriodSeconds='$G'"
if kubectl wait --for=condition=complete job/m2-report -n $NS --timeout=90s >/dev/null 2>&1; then pass job-complete; else fail job-complete "Job chưa Complete sau 90s"; fi
kubectl logs job/m2-report -c shipper -n $NS 2>/dev/null | grep -q "line 3" && pass shipper-log || fail shipper-log "log của shipper không có 'line 3'"
grep -q "restartPolicy: Always" /opt/ckad/m2-report.yaml 2>/dev/null && pass manifest-file || fail manifest-file "/opt/ckad/m2-report.yaml thiếu hoặc không có restartPolicy: Always"
echo "RESULT $P/$T"`,
      solution: `**Vì sao Job treo:** Job chỉ Complete khi Pod ở phase {{Succeeded}}, tức là **mọi** container thường đã thoát. {{shipper}} chạy {{tail -F}} vĩnh viễn nên Pod mãi ở Running. Native sidecar (beta và bật mặc định từ 1.29) là init container có {{restartPolicy: Always}}: nó khởi động **trước** container chính, chạy song song suốt vòng đời Pod, và **không** được tính khi xét Pod hoàn thành. Khi {{report}} thoát, kubelet tự gửi SIGTERM cho sidecar.

Template của Job là immutable, nên phải xoá rồi tạo lại:

~~~bash
k config use-context kind-ckad
k get job m2-report -n m2-sidecar -o yaml > /opt/ckad/m2-report.yaml
# sửa file như dưới (xoá status, uid, các label controller-uid/selector tự sinh), rồi:
k delete job m2-report -n m2-sidecar
k apply -f /opt/ckad/m2-report.yaml
k wait --for=condition=complete job/m2-report -n m2-sidecar --timeout=90s
k logs job/m2-report -c shipper -n m2-sidecar
~~~

~~~yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: m2-report
  namespace: m2-sidecar
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      terminationGracePeriodSeconds: 5
      volumes:
      - name: work
        emptyDir: {}
      initContainers:
      - name: shipper
        image: busybox:1.36
        restartPolicy: Always          # chính dòng này biến init container thành native sidecar
        command: ["sh", "-c", "touch /work/report.log; tail -F /work/report.log"]
        volumeMounts:
        - name: work
          mountPath: /work
      containers:
      - name: report
        image: busybox:1.36
        command: ["sh", "-c", "for i in 1 2 3; do echo line $i >> /work/report.log; sleep 2; done"]
        volumeMounts:
        - name: work
          mountPath: /work
~~~

**Vì sao cần grace period ngắn:** {{sh}} chạy ở PID 1 trong container không có handler cho SIGTERM nên bỏ qua tín hiệu; kubelet phải đợi hết grace period (mặc định 30 giây) mới SIGKILL. Đặt 5 giây giúp Job xong nhanh.

> Mẹo tiết kiệm thời gian: đừng tự viết lại từ đầu. Xuất YAML ra file, xoá khối {{status}} và các trường {{metadata.uid}}, {{controller-uid}}, {{batch.kubernetes.io/job-name}} trong selector/labels (nếu để lại, apply sẽ báo lỗi selector), rồi chỉ cần **cắt khối shipper dán sang initContainers** và thêm một dòng {{restartPolicy: Always}}.`,
      refs: [{ type: 'doc', title: 'Sidecar Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/' }],
      tags: ['native sidecar', 'Job', 'initContainers'],
    },
    // ---------------------------------------------------------------- 2
    {
      id: 'ckad-2-02', no: 2, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 6,
      title: 'ResourceQuota chặn tạo Pod: dùng LimitRange gán mặc định',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{m2-quota}} có ResourceQuota {{m2-rq}} yêu cầu mọi Pod khai báo requests/limits. Deployment {{m2-worker}} (2 replica, image {{nginx:1.27-alpine}}) không khai báo resources nên không tạo được Pod nào.

Yêu cầu:
1. **Không** thêm {{resources}} vào Deployment {{m2-worker}}. Thay vào đó tạo LimitRange {{m2-defaults}} trong {{m2-quota}}, loại {{Container}}:
   - default (limit): cpu {{200m}}, memory {{128Mi}}
   - defaultRequest: cpu {{100m}}, memory {{64Mi}}
   - max: cpu {{500m}}, memory {{256Mi}}
2. Làm cho cả 2 Pod của {{m2-worker}} chạy và Ready (được phép dùng {{kubectl rollout restart}}).

Pod mới phải nhận đúng giá trị mặc định ở trên.`,
      setup: `set -e
kubectl create namespace m2-quota --dry-run=client -o yaml | kubectl apply -f -
kubectl delete limitrange m2-defaults -n m2-quota --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: ResourceQuota
metadata:
  name: m2-rq
  namespace: m2-quota
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
    pods: "6"
EOF
kubectl delete deployment m2-worker -n m2-quota --ignore-not-found --wait=true
kubectl create deployment m2-worker --image=nginx:1.27-alpine --replicas=2 -n m2-quota
echo "Setup xong: xem 'kubectl get events -n m2-quota' để thấy lỗi FailedCreate."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-quota
LR=$(kubectl get limitrange m2-defaults -n $NS -o jsonpath='{.spec.limits[?(@.type=="Container")].default.cpu} {.spec.limits[?(@.type=="Container")].default.memory} {.spec.limits[?(@.type=="Container")].defaultRequest.cpu} {.spec.limits[?(@.type=="Container")].defaultRequest.memory}' 2>/dev/null)
[ "$LR" = "200m 128Mi 100m 64Mi" ] && pass limitrange-defaults || fail limitrange-defaults "default/defaultRequest='$LR'"
MX=$(kubectl get limitrange m2-defaults -n $NS -o jsonpath='{.spec.limits[?(@.type=="Container")].max.cpu} {.spec.limits[?(@.type=="Container")].max.memory}' 2>/dev/null)
[ "$MX" = "500m 256Mi" ] && pass limitrange-max || fail limitrange-max "max='$MX'"
R=$(kubectl get deploy m2-worker -n $NS -o jsonpath='{.spec.template.spec.containers[0].resources}' 2>/dev/null)
if [ -z "$R" ] || [ "$R" = "{}" ]; then pass deployment-untouched; else fail deployment-untouched "Deployment có resources: $R"; fi
if kubectl rollout status deploy/m2-worker -n $NS --timeout=90s >/dev/null 2>&1; then pass rollout-ready; else fail rollout-ready "m2-worker chưa đủ 2 Pod Ready"; fi
POD=$(kubectl get pods -n $NS -l app=m2-worker --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
PR=$(kubectl get pod "$POD" -n $NS -o jsonpath='{.spec.containers[0].resources.limits.cpu} {.spec.containers[0].resources.limits.memory} {.spec.containers[0].resources.requests.cpu} {.spec.containers[0].resources.requests.memory}' 2>/dev/null)
[ "$PR" = "200m 128Mi 100m 64Mi" ] && pass pod-got-defaults || fail pod-got-defaults "pod '$POD' resources='$PR'"
echo "RESULT $P/$T"`,
      solution: `**Chẩn đoán:** {{k get events -n m2-quota}} cho thấy {{FailedCreate ... must specify limits.cpu ...}}. Khi namespace có ResourceQuota cho {{requests.*}}/{{limits.*}}, admission từ chối mọi Pod thiếu các giá trị đó. LimitRange là admission plugin chạy **trước** quota: nó điền default vào Pod chưa khai báo, nhờ vậy Pod qua được quota mà không phải sửa Deployment.

~~~yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: m2-defaults
  namespace: m2-quota
spec:
  limits:
  - type: Container
    default:            # thành resources.limits
      cpu: 200m
      memory: 128Mi
    defaultRequest:     # thành resources.requests
      cpu: 100m
      memory: 64Mi
    max:
      cpu: 500m
      memory: 256Mi
~~~

~~~bash
k config use-context kind-ckad
k apply -f lr.yaml
# ReplicaSet controller retry theo backoff, có thể phải chờ lâu; restart để tạo Pod ngay
k rollout restart deploy/m2-worker -n m2-quota
k rollout status deploy/m2-worker -n m2-quota
k get pod -n m2-quota -l app=m2-worker -o jsonpath='{.items[0].spec.containers[0].resources}'
~~~

**Lưu ý:** LimitRange chỉ tác động lúc Pod được **tạo**, không sửa Pod đang chạy. Vì vậy sau khi tạo LimitRange, các Pod cũ (nếu có) vẫn giữ giá trị cũ. Nếu chỉ khai báo {{default}} mà không có {{defaultRequest}} thì request sẽ lấy bằng limit.

> Mẹo tiết kiệm thời gian: {{kubectl create}} không có lệnh tạo LimitRange, nên hãy mở trang docs "Limit Ranges" (tìm "defaultRequest"), chép YAML mẫu và sửa số. Kiểm tra nhanh bằng {{k describe limitrange m2-defaults -n m2-quota}} thay vì đọc YAML.`,
      refs: [
        { type: 'doc', title: 'Limit Ranges', url: 'https://kubernetes.io/docs/concepts/policy/limit-range/' },
        { type: 'doc', title: 'Resource Quotas', url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/' },
      ],
      tags: ['LimitRange', 'ResourceQuota'],
    },
    // ---------------------------------------------------------------- 3
    {
      id: 'ckad-2-03', no: 3, domain: 'Deployment', weight: 6, env: 'kind', minutes: 7,
      title: 'Gộp nhiều thay đổi vào một rollout bằng pause/resume',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{m2-web}} trong namespace {{m2-roll}} (3 replica, container {{nginx}}, image {{nginx:1.25-alpine}}) đang ở revision 1. Bạn cần đổi 3 thứ nhưng chỉ được tạo **đúng một** rollout mới (revision 2):
1. Tạm dừng rollout của {{m2-web}}.
2. Đổi image container {{nginx}} thành {{nginx:1.27-alpine}}.
3. Đặt requests cho container {{nginx}}: cpu {{50m}}, memory {{32Mi}}.
4. Thêm biến môi trường {{APP_COLOR=blue}}.
5. Gắn annotation {{kubernetes.io/change-cause}} với giá trị {{upgrade 1.27 + resources}}.
6. Tiếp tục rollout và chờ hoàn tất.

Cuối cùng ghi output của {{kubectl rollout history deployment m2-web -n m2-roll}} vào file {{/opt/ckad/m2-roll-history.txt}}.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-roll-history.txt
kubectl create namespace m2-roll --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-web -n m2-roll --ignore-not-found --wait=true
kubectl delete rs -n m2-roll -l app=m2-web --ignore-not-found --wait=true
kubectl create deployment m2-web --image=nginx:1.25-alpine --replicas=3 -n m2-roll
kubectl annotate deployment m2-web -n m2-roll kubernetes.io/change-cause="initial nginx 1.25" --overwrite
kubectl rollout status deployment m2-web -n m2-roll --timeout=120s`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-roll
REV=$(kubectl get deploy m2-web -n $NS -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}' 2>/dev/null)
[ "$REV" = "2" ] && pass single-new-revision || fail single-new-revision "revision hiện tại='$REV' (cần đúng 2)"
PAUSED=$(kubectl get deploy m2-web -n $NS -o jsonpath='{.spec.paused}' 2>/dev/null)
[ "$PAUSED" != "true" ] && pass resumed || fail resumed "Deployment vẫn đang pause"
IMG=$(kubectl get deploy m2-web -n $NS -o jsonpath='{.spec.template.spec.containers[?(@.name=="nginx")].image}' 2>/dev/null)
[ "$IMG" = "nginx:1.27-alpine" ] && pass image || fail image "image='$IMG'"
RQ=$(kubectl get deploy m2-web -n $NS -o jsonpath='{.spec.template.spec.containers[?(@.name=="nginx")].resources.requests.cpu} {.spec.template.spec.containers[?(@.name=="nginx")].resources.requests.memory}' 2>/dev/null)
[ "$RQ" = "50m 32Mi" ] && pass requests || fail requests "requests='$RQ'"
EV=$(kubectl get deploy m2-web -n $NS -o jsonpath='{.spec.template.spec.containers[?(@.name=="nginx")].env[?(@.name=="APP_COLOR")].value}' 2>/dev/null)
[ "$EV" = "blue" ] && pass env || fail env "APP_COLOR='$EV'"
if kubectl rollout status deploy/m2-web -n $NS --timeout=90s >/dev/null 2>&1; then pass rollout-complete; else fail rollout-complete "rollout chưa xong"; fi
grep -q "upgrade 1.27 + resources" /opt/ckad/m2-roll-history.txt 2>/dev/null && pass history-file || fail history-file "file không có change-cause 'upgrade 1.27 + resources'"
echo "RESULT $P/$T"`,
      solution: `**Vì sao phải pause:** mỗi lệnh {{kubectl set ...}} sửa Pod template, và mỗi lần template đổi Deployment controller tạo một ReplicaSet mới, tức một revision và một đợt thay Pod. Ba lệnh liên tiếp thành 3 rollout (revision 4), tốn thời gian và làm lịch sử khó đọc. Khi {{spec.paused: true}}, controller vẫn nhận thay đổi template nhưng **không** tạo ReplicaSet mới; lúc resume nó so template cuối cùng và tạo đúng một revision.

~~~bash
k config use-context kind-ckad
k rollout pause deploy/m2-web -n m2-roll
k set image deploy/m2-web nginx=nginx:1.27-alpine -n m2-roll
k set resources deploy/m2-web -c nginx --requests=cpu=50m,memory=32Mi -n m2-roll
k set env deploy/m2-web APP_COLOR=blue -n m2-roll
k annotate deploy/m2-web kubernetes.io/change-cause="upgrade 1.27 + resources" --overwrite -n m2-roll
k rollout resume deploy/m2-web -n m2-roll
k rollout status deploy/m2-web -n m2-roll
k rollout history deployment m2-web -n m2-roll > /opt/ckad/m2-roll-history.txt
cat /opt/ckad/m2-roll-history.txt
~~~

**Change-cause:** cờ {{--record}} đã deprecated, cách hiện hành là tự gắn annotation {{kubernetes.io/change-cause}}. Gắn **trước** khi resume: annotation được chép sang ReplicaSet mới tạo, nên {{rollout history}} hiển thị đúng ở revision 2. Gắn sau khi resume thì có thể ReplicaSet đã được tạo và cột CHANGE-CAUSE của revision 2 bị trống hoặc lấy giá trị cũ.

**Bẫy:** quên {{rollout resume}} thì {{rollout status}} sẽ báo "Waiting for deployment spec update to be observed..." hoặc đứng im; Deployment ở trạng thái pause cũng không rollback được bằng {{rollout undo}}.

> Mẹo tiết kiệm thời gian: gõ {{k rollout pause}} ngay đầu, rồi dùng lịch sử shell (mũi tên lên) để sửa nhanh namespace trong các lệnh {{set}}. Kiểm tra số revision bằng {{k get rs -n m2-roll}}: phải thấy đúng 2 ReplicaSet.`,
      refs: [{ type: 'doc', title: 'Deployments: Pausing and Resuming a rollout', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' }],
      tags: ['rollout pause', 'change-cause', 'kubectl set'],
    },
    // ---------------------------------------------------------------- 4
    {
      id: 'ckad-2-04', no: 4, domain: 'Services & Networking', weight: 7, env: 'kind', minutes: 9,
      title: 'Ingress theo host, rewrite tiền tố /api cho backend',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{m2-web}} có hai Service: {{m2-api-svc}} (port 80, backend phục vụ đường dẫn {{/hello}}, **không** biết tiền tố {{/api}}) và {{m2-frontend-svc}} (port 80, trang chủ {{/}}). Ingress controller là ingress-nginx (IngressClass {{nginx}}), setup đã cài.

Tạo 2 Ingress trong {{m2-web}}, cùng host {{shop.m2.local}}, {{ingressClassName: nginx}}:
1. {{m2-shop-api}}: đường dẫn regex {{/api(/|$)(.*)}}, pathType {{ImplementationSpecific}}, tới {{m2-api-svc:80}}, có annotation {{nginx.ingress.kubernetes.io/rewrite-target: /$2}} để {{/api/hello}} đến backend thành {{/hello}}.
2. {{m2-shop-web}}: đường dẫn {{/}}, pathType {{Prefix}}, tới {{m2-frontend-svc:80}}, **không** có rewrite.

Request tới host khác (ví dụ {{other.m2.local}}) không được đi vào {{m2-api-svc}}.`,
      setup: `set -e
if ! kubectl get namespace ingress-nginx >/dev/null 2>&1; then
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
fi
kubectl wait -n ingress-nginx --for=condition=Ready pod -l app.kubernetes.io/component=controller --timeout=240s
kubectl create namespace m2-web --dry-run=client -o yaml | kubectl apply -f -
kubectl delete ingress m2-shop-api m2-shop-web -n m2-web --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-api
  namespace: m2-web
spec:
  replicas: 1
  selector:
    matchLabels: {app: m2-api}
  template:
    metadata:
      labels: {app: m2-api}
    spec:
      containers:
      - name: api
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo api-hello > /www/hello && echo api-root > /www/index.html && exec httpd -f -p 8080 -h /www"]
        ports:
        - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-frontend
  namespace: m2-web
spec:
  replicas: 1
  selector:
    matchLabels: {app: m2-frontend}
  template:
    metadata:
      labels: {app: m2-frontend}
    spec:
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo frontend-home > /www/index.html && exec httpd -f -p 8080 -h /www"]
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: m2-api-svc
  namespace: m2-web
spec:
  selector: {app: m2-api}
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: m2-frontend-svc
  namespace: m2-web
spec:
  selector: {app: m2-frontend}
  ports:
  - port: 80
    targetPort: 8080
EOF
kubectl rollout status deploy/m2-api -n m2-web --timeout=120s
kubectl rollout status deploy/m2-frontend -n m2-web --timeout=120s`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-web
CLS=$(kubectl get ingress m2-shop-api m2-shop-web -n $NS -o jsonpath='{.items[*].spec.ingressClassName}' 2>/dev/null)
[ "$CLS" = "nginx nginx" ] && pass ingress-class || fail ingress-class "ingressClassName='$CLS'"
RW=$(kubectl get ingress m2-shop-web -n $NS -o jsonpath='{.metadata.annotations.nginx\\.ingress\\.kubernetes\\.io/rewrite-target}' 2>/dev/null)
[ -z "$RW" ] && pass web-no-rewrite || fail web-no-rewrite "m2-shop-web có rewrite-target='$RW'"
sleep 5
OUT=$(kubectl run m2-t-$RANDOM -n $NS --rm -i --quiet --restart=Never --image=curlimages/curl:8.8.0 --command -- sh -c 'U=http://ingress-nginx-controller.ingress-nginx.svc.cluster.local; echo "A=$(curl -s -m 5 -H Host:shop.m2.local $U/api/hello)"; echo "W=$(curl -s -m 5 -H Host:shop.m2.local $U/)"; echo "O=$(curl -s -m 5 -H Host:other.m2.local $U/api/hello)"' 2>/dev/null)
echo "$OUT" | grep -q "^A=api-hello" && pass api-rewrite || fail api-rewrite "/api/hello trả về: $(echo "$OUT" | grep '^A=' | head -c 120)"
echo "$OUT" | grep -q "^W=frontend-home" && pass frontend-root || fail frontend-root "/ trả về: $(echo "$OUT" | grep '^W=' | head -c 120)"
if echo "$OUT" | grep -q "^O=api-hello"; then fail host-rule "host other.m2.local vẫn tới m2-api-svc"; elif echo "$OUT" | grep -q "^O="; then pass host-rule; else fail host-rule "không chạy được pod curl"; fi
echo "RESULT $P/$T"`,
      solution: `**Ý tưởng:** annotation {{rewrite-target}} áp dụng cho **mọi** path trong cùng một Ingress, nên tách thành 2 Ingress: một cái có rewrite cho {{/api}}, một cái không cho {{/}}. ingress-nginx gộp chúng theo host. Với regex, nhóm bắt thứ hai {{(.*)}} là phần sau {{/api/}}, nên {{/$2}} biến {{/api/hello}} thành {{/hello}}.

~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: m2-shop-api
  namespace: m2-web
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - host: shop.m2.local
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific   # regex chỉ hợp lệ với ImplementationSpecific
        backend:
          service:
            name: m2-api-svc
            port:
              number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: m2-shop-web
  namespace: m2-web
spec:
  ingressClassName: nginx
  rules:
  - host: shop.m2.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: m2-frontend-svc
            port:
              number: 80
~~~

~~~bash
k config use-context kind-ckad
k apply -f ing.yaml
# tự kiểm tra từ trong cluster
k run t --rm -i --restart=Never --image=curlimages/curl:8.8.0 -- \\
  curl -s -H "Host: shop.m2.local" http://ingress-nginx-controller.ingress-nginx/api/hello
~~~

**Vì sao không dùng Prefix cho /api:** bản ingress-nginx mới bật kiểm tra path chặt, path có ký tự regex với pathType {{Prefix}} bị admission webhook từ chối. Có host trong rule thì request với Host khác không khớp rule nào và rơi vào default backend (404).

> Mẹo tiết kiệm thời gian: sinh khung bằng lệnh {{k create ingress m2-shop-web -n m2-web --class=nginx --rule="shop.m2.local/*=m2-frontend-svc:80"}} (dấu * nghĩa là Prefix). Với Ingress regex, tạo bằng {{--rule="shop.m2.local/api=m2-api-svc:80" --annotation=...}} rồi {{k edit}} sửa path và pathType, nhanh hơn gõ tay.`,
      refs: [{ type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
      tags: ['Ingress', 'rewrite-target', 'ingress-nginx'],
    },
    // ---------------------------------------------------------------- 5
    {
      id: 'ckad-2-05', no: 5, domain: 'Observability & Maintenance', weight: 6, env: 'kind', minutes: 8,
      title: 'Chuyển manifest dùng API đã bị gỡ sang phiên bản hiện hành',
      task: `Context: {{kubectl config use-context kind-ckad}}

File {{/opt/ckad/m2-legacy.yaml}} được viết cho cluster rất cũ, apply lên cluster 1.30 bị lỗi {{no matches for kind}}. File gồm Deployment {{m2-legacy-app}}, Service {{m2-legacy-svc}}, Ingress {{m2-legacy-ing}} và PodDisruptionBudget {{m2-legacy-pdb}}, tất cả trong namespace {{m2-legacy}}.

1. Tạo file {{/opt/ckad/m2-legacy-fixed.yaml}} chứa cùng 4 tài nguyên nhưng dùng apiVersion đang được hỗ trợ ({{apps/v1}}, {{networking.k8s.io/v1}}, {{policy/v1}}). Sửa luôn các field đã đổi cấu trúc (Deployment cần selector, backend của Ingress, pathType).
2. Apply file đó. Deployment {{m2-legacy-app}} phải có 2 Pod Ready; Ingress {{m2-legacy-ing}} trỏ tới {{m2-legacy-svc}} port {{80}} với pathType {{Prefix}}; PDB {{m2-legacy-pdb}} giữ {{minAvailable: 1}}.

Không sửa file gốc {{/opt/ckad/m2-legacy.yaml}}.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-legacy-fixed.yaml
kubectl create namespace m2-legacy --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-legacy-app -n m2-legacy --ignore-not-found
kubectl delete ingress m2-legacy-ing -n m2-legacy --ignore-not-found
kubectl delete pdb m2-legacy-pdb -n m2-legacy --ignore-not-found
cat > /opt/ckad/m2-legacy.yaml <<'EOF'
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: m2-legacy-app
  namespace: m2-legacy
spec:
  replicas: 2
  template:
    metadata:
      labels:
        app: m2-legacy-app
    spec:
      containers:
      - name: web
        image: nginx:1.27-alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: m2-legacy-svc
  namespace: m2-legacy
spec:
  selector:
    app: m2-legacy-app
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: m2-legacy-ing
  namespace: m2-legacy
spec:
  rules:
  - host: legacy.m2.local
    http:
      paths:
      - path: /
        backend:
          serviceName: m2-legacy-svc
          servicePort: 80
---
apiVersion: policy/v1beta1
kind: PodDisruptionBudget
metadata:
  name: m2-legacy-pdb
  namespace: m2-legacy
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: m2-legacy-app
EOF
echo "Thử: kubectl apply -f /opt/ckad/m2-legacy.yaml  (sẽ lỗi)"`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-legacy
F=/opt/ckad/m2-legacy-fixed.yaml
if [ -f "$F" ] && ! grep -Eq "v1beta|extensions/|serviceName|servicePort" "$F"; then pass fixed-file-clean; else fail fixed-file-clean "$F thiếu hoặc vẫn còn API/field cũ"; fi
grep -q "extensions/v1beta1" /opt/ckad/m2-legacy.yaml 2>/dev/null && pass original-untouched || fail original-untouched "file gốc đã bị sửa"
if kubectl apply --dry-run=server -f "$F" >/dev/null 2>&1; then pass server-dry-run; else fail server-dry-run "API server từ chối $F"; fi
if kubectl rollout status deploy/m2-legacy-app -n $NS --timeout=90s >/dev/null 2>&1; then pass deployment-ready; else fail deployment-ready "m2-legacy-app chưa Ready"; fi
ING=$(kubectl get ingress m2-legacy-ing -n $NS -o jsonpath='{.spec.rules[0].http.paths[0].backend.service.name}:{.spec.rules[0].http.paths[0].backend.service.port.number}:{.spec.rules[0].http.paths[0].pathType}' 2>/dev/null)
[ "$ING" = "m2-legacy-svc:80:Prefix" ] && pass ingress-v1 || fail ingress-v1 "backend/pathType='$ING'"
PDB=$(kubectl get pdb m2-legacy-pdb -n $NS -o jsonpath='{.spec.minAvailable}' 2>/dev/null)
[ "$PDB" = "1" ] && pass pdb-v1 || fail pdb-v1 "minAvailable='$PDB'"
echo "RESULT $P/$T"`,
      solution: `**Chẩn đoán:** {{extensions/v1beta1}} (Deployment, Ingress) đã bị gỡ ở 1.16/1.22, {{policy/v1beta1}} PDB bị gỡ ở 1.25. Xem phiên bản đang phục vụ bằng {{k api-resources | grep -Ei "deploy|ingress|poddisruption"}} và cấu trúc field mới bằng {{k explain ingress.spec.rules.http.paths.backend --api-version=networking.k8s.io/v1}}. Plugin {{kubectl convert}} không có sẵn trong kỳ thi, nên sửa tay.

Những chỗ phải đổi ngoài apiVersion:
- Deployment {{apps/v1}}: {{spec.selector}} **bắt buộc** và phải khớp label của template.
- Ingress {{networking.k8s.io/v1}}: {{serviceName}}/{{servicePort}} thành {{backend.service.name}} và {{backend.service.port.number}}; {{pathType}} bắt buộc.
- PDB {{policy/v1}}: field giữ nguyên.

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-legacy-app
  namespace: m2-legacy
spec:
  replicas: 2
  selector:
    matchLabels:
      app: m2-legacy-app
  template:
    metadata:
      labels:
        app: m2-legacy-app
    spec:
      containers:
      - name: web
        image: nginx:1.27-alpine
        ports:
        - containerPort: 80
---
# Service giữ nguyên (v1)
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: m2-legacy-ing
  namespace: m2-legacy
spec:
  rules:
  - host: legacy.m2.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: m2-legacy-svc
            port:
              number: 80
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: m2-legacy-pdb
  namespace: m2-legacy
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: m2-legacy-app
~~~

~~~bash
k config use-context kind-ckad
cp /opt/ckad/m2-legacy.yaml /opt/ckad/m2-legacy-fixed.yaml
vi /opt/ckad/m2-legacy-fixed.yaml          # sửa như trên, nhớ chép cả Service
k apply --dry-run=server -f /opt/ckad/m2-legacy-fixed.yaml && k apply -f /opt/ckad/m2-legacy-fixed.yaml
k rollout status deploy/m2-legacy-app -n m2-legacy
~~~

> Mẹo tiết kiệm thời gian: luôn chạy {{--dry-run=server}} trước khi apply thật: API server báo cùng lúc mọi lỗi schema (thiếu selector, field lạ) thay vì báo lần lượt từng tài nguyên. Trang "Deprecated API Migration Guide" trên kubernetes.io liệt kê field thay đổi theo từng phiên bản, nên tìm "Ingress" trong trang đó.`,
      refs: [{ type: 'doc', title: 'Deprecated API Migration Guide', url: 'https://kubernetes.io/docs/reference/using-api/deprecation-guide/' }],
      tags: ['API deprecation', 'kubectl explain', 'dry-run=server'],
    },
    // ---------------------------------------------------------------- 6
    {
      id: 'ckad-2-06', no: 6, domain: 'Design & Build', weight: 5, env: 'kind', minutes: 6,
      title: 'Adapter container chuẩn hoá log truy cập',
      task: `Context: {{kubectl config use-context kind-ckad}}

File {{/opt/ckad/m2-metrics.yaml}} định nghĩa Pod {{m2-metrics}} (namespace {{m2-adapter}}) với container {{app}} ghi mỗi 2 giây một dòng dạng {{GET /orders 200 35}} (method, path, status, độ trễ ms) vào {{/var/log/app/access.log}}. Hệ thống giám sát chỉ đọc được định dạng {{key=value}} từ stdout.

Sửa file và tạo Pod theo **adapter pattern**:
1. Thêm volume {{emptyDir}} tên {{logs}}, mount ở {{/var/log/app}} cho {{app}}.
2. Thêm container {{adapter}} (image {{busybox:1.36}}) mount cùng volume, đọc liên tục file log và in ra stdout mỗi dòng theo đúng định dạng: {{method=GET path=/orders status=200 latency_ms=35}}.
3. Không đổi lệnh của container {{app}}.

Pod phải Running, {{kubectl logs m2-metrics -c adapter -n m2-adapter}} phải có các dòng đúng định dạng trên.`,
      setup: `set -e
mkdir -p /opt/ckad
kubectl create namespace m2-adapter --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod m2-metrics -n m2-adapter --ignore-not-found --wait=true
cat > /opt/ckad/m2-metrics.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: m2-metrics
  namespace: m2-adapter
  labels:
    app: m2-metrics
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "mkdir -p /var/log/app; while true; do echo 'GET /orders 200 35' >> /var/log/app/access.log; sleep 2; done"]
EOF
echo "Setup xong: sửa /opt/ckad/m2-metrics.yaml rồi tạo Pod."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-adapter
if kubectl wait --for=condition=Ready pod/m2-metrics -n $NS --timeout=60s >/dev/null 2>&1; then pass pod-ready; else fail pod-ready "Pod m2-metrics chưa Ready"; fi
CMD=$(kubectl get pod m2-metrics -n $NS -o jsonpath='{.spec.containers[?(@.name=="app")].command}' 2>/dev/null)
echo "$CMD" | grep -q "GET /orders 200 35" && pass app-unchanged || fail app-unchanged "lệnh của container app đã đổi"
VT=$(kubectl get pod m2-metrics -n $NS -o jsonpath='{.spec.volumes[?(@.name=="logs")].emptyDir}' 2>/dev/null)
[ -n "$VT" ] && pass emptydir-logs || fail emptydir-logs "không có volume emptyDir tên logs"
sleep 6
L=$(kubectl logs m2-metrics -c adapter -n $NS --tail=20 2>/dev/null)
echo "$L" | grep -q "^method=GET path=/orders status=200 latency_ms=35$" && pass adapter-format || fail adapter-format "log adapter: $(echo "$L" | tail -n 1 | head -c 120)"
echo "$L" | grep -q "^GET /orders" && fail adapter-no-raw "adapter còn in dòng thô" || pass adapter-no-raw
echo "RESULT $P/$T"`,
      solution: `**Adapter pattern:** container phụ chuyển đầu ra của ứng dụng sang định dạng mà hệ thống bên ngoài hiểu, ứng dụng không phải sửa code. Hai container chia sẻ dữ liệu qua volume {{emptyDir}} chung trong Pod.

~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: m2-metrics
  namespace: m2-adapter
  labels:
    app: m2-metrics
spec:
  volumes:
  - name: logs
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "mkdir -p /var/log/app; while true; do echo 'GET /orders 200 35' >> /var/log/app/access.log; sleep 2; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  - name: adapter
    image: busybox:1.36
    command: ["sh", "-c", "touch /var/log/app/access.log; tail -F /var/log/app/access.log | while read m p s l; do echo \\"method=$m path=$p status=$s latency_ms=$l\\"; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
~~~

~~~bash
k config use-context kind-ckad
k apply -f /opt/ckad/m2-metrics.yaml
k logs m2-metrics -c adapter -n m2-adapter -f
~~~

**Vì sao dùng vòng while read thay vì awk:** khi stdout là pipe (log container), {{awk}} buffer đầu ra theo khối nên log xuất hiện rất chậm, trừ khi gọi {{fflush()}}. {{echo}} trong vòng lặp shell ghi ngay từng dòng. {{touch}} trước để {{tail -F}} không báo lỗi nếu adapter khởi động trước {{app}}. Có thể khai báo adapter là native sidecar (initContainers + {{restartPolicy: Always}}) để chắc chắn nó chạy trước, nhưng với Pod chạy mãi thì container thường cũng đạt yêu cầu.

> Mẹo tiết kiệm thời gian: trong YAML dạng mảng {{["sh", "-c", "..."]}} mọi dấu nháy kép bên trong phải escape; dùng dạng block {{- |}} dưới {{args}} sẽ đỡ lỗi hơn. Gõ xong chạy {{k apply --dry-run=client -f}} để bắt lỗi cú pháp trước.`,
      refs: [{ type: 'doc', title: 'Communicate Between Containers in the Same Pod Using a Shared Volume', url: 'https://kubernetes.io/docs/tasks/access-application-cluster/communicate-containers-same-pod-shared-volume/' }],
      tags: ['adapter', 'multi-container', 'emptyDir'],
    },
    // ---------------------------------------------------------------- 7
    {
      id: 'ckad-2-07', no: 7, domain: 'Environment, Config & Security', weight: 7, env: 'kind', minutes: 8,
      title: 'imagePullSecret gắn vào ServiceAccount và RBAC chỉ đọc Pod',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{m2-sec}}, Deployment {{m2-agent}} sắp chuyển sang registry riêng. Hãy chuẩn bị:
1. Secret kiểu docker-registry tên {{m2-regcred}}: server {{registry.m2.example.com}}, username {{ci-bot}}, password {{S3cretPass}}, email {{ci@m2.example.com}}.
2. ServiceAccount {{m2-deployer}} có {{imagePullSecrets}} trỏ tới {{m2-regcred}} (để mọi Pod dùng SA này tự nhận secret, không cần khai báo trong Pod).
3. Role {{m2-pod-reader}} cho phép {{get}}, {{list}}, {{watch}} trên {{pods}} và {{get}} trên {{pods/log}}; RoleBinding {{m2-deployer-rb}} gán Role đó cho SA {{m2-deployer}}. SA không được xoá Pod hay đọc Secret.
4. Cập nhật Deployment {{m2-agent}} chạy bằng SA {{m2-deployer}} (giữ image hiện tại). Pod mới phải Ready và trong spec của Pod phải có {{imagePullSecrets}} {{m2-regcred}}.`,
      setup: `set -e
kubectl create namespace m2-sec --dry-run=client -o yaml | kubectl apply -f -
kubectl delete secret m2-regcred -n m2-sec --ignore-not-found
kubectl delete serviceaccount m2-deployer -n m2-sec --ignore-not-found
kubectl delete role m2-pod-reader -n m2-sec --ignore-not-found
kubectl delete rolebinding m2-deployer-rb -n m2-sec --ignore-not-found
kubectl delete deployment m2-agent -n m2-sec --ignore-not-found --wait=true
kubectl create deployment m2-agent --image=nginx:1.27-alpine -n m2-sec
kubectl rollout status deploy/m2-agent -n m2-sec --timeout=120s`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-sec
SA=system:serviceaccount:m2-sec:m2-deployer
TY=$(kubectl get secret m2-regcred -n $NS -o jsonpath='{.type}' 2>/dev/null)
CFG=$(kubectl get secret m2-regcred -n $NS -o jsonpath='{.data.\\.dockerconfigjson}' 2>/dev/null | base64 -d 2>/dev/null)
if [ "$TY" = "kubernetes.io/dockerconfigjson" ] && echo "$CFG" | grep -q "registry.m2.example.com" && echo "$CFG" | grep -q '"ci-bot"'; then pass regcred; else fail regcred "type='$TY' hoặc nội dung sai"; fi
IPS=$(kubectl get sa m2-deployer -n $NS -o jsonpath='{.imagePullSecrets[*].name}' 2>/dev/null)
echo " $IPS " | grep -q " m2-regcred " && pass sa-pull-secret || fail sa-pull-secret "imagePullSecrets='$IPS'"
[ "$(kubectl auth can-i list pods -n $NS --as=$SA 2>/dev/null)" = "yes" ] && pass can-list-pods || fail can-list-pods "SA không list được pods"
[ "$(kubectl auth can-i get pods/log -n $NS --as=$SA 2>/dev/null)" = "yes" ] && pass can-read-logs || fail can-read-logs "SA không đọc được pods/log"
[ "$(kubectl auth can-i delete pods -n $NS --as=$SA 2>/dev/null)" = "no" ] && pass cannot-delete-pods || fail cannot-delete-pods "SA xoá được pods"
[ "$(kubectl auth can-i get secrets -n $NS --as=$SA 2>/dev/null)" = "no" ] && pass cannot-read-secrets || fail cannot-read-secrets "SA đọc được secrets"
kubectl rollout status deploy/m2-agent -n $NS --timeout=90s >/dev/null 2>&1
sleep 3
PODS=$(kubectl get pods -n $NS -l app=m2-agent -o jsonpath='{range .items[*]}{.spec.serviceAccountName}|{.spec.imagePullSecrets[*].name}|{.status.conditions[?(@.type=="Ready")].status}{"\\n"}{end}' 2>/dev/null)
echo "$PODS" | grep -q "^m2-deployer|m2-regcred|True$" && pass pod-uses-sa || fail pod-uses-sa "pods: $(echo $PODS | head -c 160)"
echo "RESULT $P/$T"`,
      solution: `**Cơ chế:** khi Pod không khai báo {{imagePullSecrets}}, admission controller ServiceAccount chép {{imagePullSecrets}} của SA vào spec Pod lúc tạo. Đây là cách chuẩn để cả namespace kéo image từ registry riêng mà không phải sửa từng Deployment.

~~~bash
k config use-context kind-ckad
k create secret docker-registry m2-regcred -n m2-sec \\
  --docker-server=registry.m2.example.com --docker-username=ci-bot \\
  --docker-password=S3cretPass --docker-email=ci@m2.example.com
k create sa m2-deployer -n m2-sec
k patch sa m2-deployer -n m2-sec -p '{"imagePullSecrets":[{"name":"m2-regcred"}]}'
k create role m2-pod-reader -n m2-sec --verb=get,list,watch --resource=pods
k edit role m2-pod-reader -n m2-sec     # thêm rule thứ hai cho pods/log, xem YAML dưới
k create rolebinding m2-deployer-rb -n m2-sec --role=m2-pod-reader --serviceaccount=m2-sec:m2-deployer
k set serviceaccount deploy/m2-agent m2-deployer -n m2-sec
k rollout status deploy/m2-agent -n m2-sec
k auth can-i get pods/log -n m2-sec --as=system:serviceaccount:m2-sec:m2-deployer
~~~

~~~yaml
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
~~~

**Vì sao không dùng --verb chung cho pods,pods/log:** {{k create role --verb=get,list,watch --resource=pods,pods/log}} cũng hợp lệ, nhưng cấp thừa {{list}}/{{watch}} cho {{pods/log}}. Đề chỉ cho {{get}} nên tách rule là chính xác nhất (cách gộp vẫn qua kiểm tra hành vi). Pod cũ được tạo trước khi đổi SA không có pull secret; {{set serviceaccount}} sửa template nên Deployment tự tạo Pod mới.

> Mẹo tiết kiệm thời gian: kiểm tra RBAC bằng {{k auth can-i --list -n m2-sec --as=system:serviceaccount:m2-sec:m2-deployer}}, một lệnh in toàn bộ quyền, thay vì thử từng verb.`,
      refs: [
        { type: 'doc', title: 'Pull an Image from a Private Registry', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/' },
        { type: 'doc', title: 'Using RBAC Authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
      ],
      tags: ['imagePullSecrets', 'ServiceAccount', 'RBAC'],
    },
    // ---------------------------------------------------------------- 8
    {
      id: 'ckad-2-08', no: 8, domain: 'Deployment', weight: 7, env: 'kind', minutes: 8,
      title: 'Kustomize overlay với configMapGenerator và rollout khi đổi cấu hình',
      task: `Context: {{kubectl config use-context kind-ckad}}

Thư mục {{/opt/ckad/m2-kust/base}} chứa Deployment {{m2-pricing}} (image {{nginx:1.25-alpine}}, đọc biến môi trường từ ConfigMap {{m2-pricing-config}} qua {{envFrom}}) và Service {{m2-pricing-svc}}. **Không sửa** thư mục base.

1. Tạo overlay {{/opt/ckad/m2-kust/overlays/prod/kustomization.yaml}}:
   - dùng base {{../../base}}, namespace {{m2-kust}}
   - {{configMapGenerator}} tên {{m2-pricing-config}} với literal {{CURRENCY=VND}} và {{TAX_RATE=0.08}}
   - đổi tag image {{nginx}} thành {{1.27-alpine}}, số replica của {{m2-pricing}} là {{2}}
2. Apply overlay bằng {{kubectl apply -k}}.
3. Sau đó đổi {{TAX_RATE}} thành {{0.1}} trong overlay và apply lại. Pod phải **tự** rollout để nhận giá trị mới (không dùng {{rollout restart}}).`,
      setup: `set -e
kubectl create namespace m2-kust --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-pricing -n m2-kust --ignore-not-found --wait=true
kubectl delete service m2-pricing-svc -n m2-kust --ignore-not-found
kubectl get configmap -n m2-kust -o name | grep m2-pricing-config | xargs -r kubectl delete -n m2-kust || true
rm -rf /opt/ckad/m2-kust
mkdir -p /opt/ckad/m2-kust/base /opt/ckad/m2-kust/overlays/prod
cat > /opt/ckad/m2-kust/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-pricing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: m2-pricing
  template:
    metadata:
      labels:
        app: m2-pricing
    spec:
      containers:
      - name: web
        image: nginx:1.25-alpine
        envFrom:
        - configMapRef:
            name: m2-pricing-config
EOF
cat > /opt/ckad/m2-kust/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: m2-pricing-svc
spec:
  selector:
    app: m2-pricing
  ports:
  - port: 80
EOF
cat > /opt/ckad/m2-kust/base/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
EOF
echo "Setup xong: viết overlay ở /opt/ckad/m2-kust/overlays/prod"`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-kust
K=/opt/ckad/m2-kust/overlays/prod/kustomization.yaml
grep -q "configMapGenerator" "$K" 2>/dev/null && pass overlay-generator || fail overlay-generator "$K thiếu hoặc không có configMapGenerator"
grep -q "m2-pricing-config" /opt/ckad/m2-kust/base/deployment.yaml 2>/dev/null && ! grep -q "1.27" /opt/ckad/m2-kust/base/deployment.yaml && pass base-untouched || fail base-untouched "base đã bị sửa"
kubectl rollout status deploy/m2-pricing -n $NS --timeout=90s >/dev/null 2>&1
REF=$(kubectl get deploy m2-pricing -n $NS -o jsonpath='{.spec.template.spec.containers[0].envFrom[0].configMapRef.name}' 2>/dev/null)
echo "$REF" | grep -Eq "^m2-pricing-config-[a-z0-9]+$" && pass hashed-name || fail hashed-name "configMapRef='$REF' (cần tên có hash)"
TR=$(kubectl get configmap "$REF" -n $NS -o jsonpath='{.data.TAX_RATE}/{.data.CURRENCY}' 2>/dev/null)
[ "$TR" = "0.1/VND" ] && pass configmap-values || fail configmap-values "TAX_RATE/CURRENCY='$TR'"
IR=$(kubectl get deploy m2-pricing -n $NS -o jsonpath='{.spec.template.spec.containers[0].image} {.spec.replicas} {.status.readyReplicas}' 2>/dev/null)
[ "$IR" = "nginx:1.27-alpine 2 2" ] && pass image-replicas || fail image-replicas "image/replicas/ready='$IR'"
REV=$(kubectl get deploy m2-pricing -n $NS -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}' 2>/dev/null)
RR=$(kubectl get deploy m2-pricing -n $NS -o jsonpath='{.spec.template.metadata.annotations.kubectl\\.kubernetes\\.io/restartedAt}' 2>/dev/null)
if [ "$REV" -ge 2 ] 2>/dev/null && [ -z "$RR" ]; then pass auto-rollout; else fail auto-rollout "revision='$REV' restartedAt='$RR'"; fi
sleep 3
V=$(kubectl exec deploy/m2-pricing -n $NS -- printenv TAX_RATE 2>/dev/null)
[ "$V" = "0.1" ] && pass pod-env || fail pod-env "TAX_RATE trong Pod='$V'"
echo "RESULT $P/$T"`,
      solution: `**Vì sao configMapGenerator tự kích hoạt rollout:** generator đặt tên ConfigMap kèm hash của nội dung ({{m2-pricing-config-<hash>}}) và kustomize sửa mọi chỗ tham chiếu (ở đây là {{envFrom.configMapRef.name}}). Đổi literal thì hash đổi, Pod template đổi, nên Deployment tạo revision mới. Nếu dùng ConfigMap tên cố định, đổi nội dung **không** làm Pod khởi động lại và biến môi trường giữ giá trị cũ.

~~~yaml
# /opt/ckad/m2-kust/overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: m2-kust
resources:
- ../../base
configMapGenerator:
- name: m2-pricing-config
  literals:
  - CURRENCY=VND
  - TAX_RATE=0.08        # bước 3 đổi thành 0.1
images:
- name: nginx
  newTag: 1.27-alpine
replicas:
- name: m2-pricing
  count: 2
~~~

~~~bash
k config use-context kind-ckad
k kustomize /opt/ckad/m2-kust/overlays/prod | less      # xem trước kết quả render
k apply -k /opt/ckad/m2-kust/overlays/prod
sed -i 's/TAX_RATE=0.08/TAX_RATE=0.1/' /opt/ckad/m2-kust/overlays/prod/kustomization.yaml
k apply -k /opt/ckad/m2-kust/overlays/prod
k rollout status deploy/m2-pricing -n m2-kust
k exec deploy/m2-pricing -n m2-kust -- printenv TAX_RATE
~~~

**Lưu ý:** ConfigMap cũ (hash cũ) vẫn nằm lại vì {{apply -k}} không xoá; đó là chủ ý, để rollback Deployment về revision trước vẫn tìm thấy cấu hình cũ. {{images.name}} khớp theo tên image ({{nginx}}), không phải tên container.

> Mẹo tiết kiệm thời gian: luôn chạy {{k kustomize <dir>}} (hoặc {{k apply -k <dir> --dry-run=client -o yaml}}) trước khi apply. Sai thụt lề trong kustomization.yaml là lỗi mất thời gian nhất, render trước giúp thấy ngay.`,
      refs: [{ type: 'doc', title: 'Declarative Management of Kubernetes Objects Using Kustomize', url: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/' }],
      tags: ['Kustomize', 'configMapGenerator', 'overlay'],
    },
    // ---------------------------------------------------------------- 9
    {
      id: 'ckad-2-09', no: 9, domain: 'Services & Networking', weight: 6, env: 'kind', minutes: 7,
      title: 'NetworkPolicy egress: chỉ cho phép DNS và database',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{m2-net}} có Pod {{m2-client}} (label {{app=client}}), Service {{m2-db-svc}} (Pod label {{app=db}}, port 80) và Service {{m2-other-svc}} (Pod label {{app=other}}, port 80). Cluster dùng Calico nên NetworkPolicy có hiệu lực.

Tạo NetworkPolicy {{m2-client-egress}} trong {{m2-net}} áp cho Pod có label {{app=client}}:
1. Chặn **mọi** egress, trừ:
2. DNS: UDP và TCP port {{53}} tới Pod có label {{k8s-app=kube-dns}} trong namespace {{kube-system}}.
3. TCP port {{80}} tới Pod có label {{app=db}} trong cùng namespace.

Kết quả: từ {{m2-client}} gọi {{http://m2-db-svc}} bằng tên DNS thành công, gọi {{http://m2-other-svc}} thất bại. Không tạo policy nào khác, không sửa Pod.`,
      setup: `set -e
kubectl get daemonset calico-node -n kube-system >/dev/null 2>&1 || echo "CẢNH BÁO: chưa thấy Calico, NetworkPolicy sẽ không có hiệu lực (xem phần giới thiệu)."
kubectl create namespace m2-net --dry-run=client -o yaml | kubectl apply -f -
kubectl delete networkpolicy m2-client-egress -n m2-net --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: m2-client
  namespace: m2-net
  labels: {app: client}
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: c
    image: busybox:1.36
    command: ["sleep", "36000"]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-db
  namespace: m2-net
spec:
  replicas: 1
  selector:
    matchLabels: {app: db}
  template:
    metadata:
      labels: {app: db}
    spec:
      containers:
      - name: db
        image: nginx:1.27-alpine
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-other
  namespace: m2-net
spec:
  replicas: 1
  selector:
    matchLabels: {app: other}
  template:
    metadata:
      labels: {app: other}
    spec:
      containers:
      - name: other
        image: nginx:1.27-alpine
---
apiVersion: v1
kind: Service
metadata:
  name: m2-db-svc
  namespace: m2-net
spec:
  selector: {app: db}
  ports:
  - port: 80
---
apiVersion: v1
kind: Service
metadata:
  name: m2-other-svc
  namespace: m2-net
spec:
  selector: {app: other}
  ports:
  - port: 80
EOF
kubectl wait --for=condition=Ready pod/m2-client -n m2-net --timeout=120s
kubectl rollout status deploy/m2-db -n m2-net --timeout=120s
kubectl rollout status deploy/m2-other -n m2-net --timeout=120s`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-net
PT=$(kubectl get networkpolicy m2-client-egress -n $NS -o jsonpath='{.spec.policyTypes[*]} {.spec.podSelector.matchLabels.app}' 2>/dev/null)
echo "$PT" | grep -q "Egress" && echo "$PT" | grep -q " client$" && pass policy-shape || fail policy-shape "policyTypes/podSelector='$PT'"
N=$(kubectl get networkpolicy -n $NS --no-headers 2>/dev/null | wc -l)
[ "$N" -eq 1 ] && pass single-policy || fail single-policy "có $N NetworkPolicy trong $NS"
kubectl exec m2-client -n $NS -- nslookup m2-db-svc.m2-net.svc.cluster.local >/dev/null 2>&1 && pass dns-allowed || fail dns-allowed "m2-client không phân giải được DNS"
kubectl exec m2-client -n $NS -- wget -qO- -T 3 http://m2-db-svc 2>/dev/null | grep -q "Welcome to nginx" && pass db-allowed || fail db-allowed "m2-client không gọi được m2-db-svc"
if kubectl exec m2-client -n $NS -- wget -qO- -T 3 http://m2-other-svc >/dev/null 2>&1; then fail other-blocked "m2-client vẫn gọi được m2-other-svc"; else pass other-blocked; fi
echo "RESULT $P/$T"`,
      solution: `**Vì sao phải mở DNS:** khi Pod bị một policy loại {{Egress}} chọn, mọi kết nối ra không khớp rule đều bị chặn, kể cả truy vấn DNS tới CoreDNS. Thiếu rule DNS thì {{wget http://m2-db-svc}} lỗi "bad address" dù port 80 tới db đã được mở. Đây là bẫy kinh điển của egress policy.

~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: m2-client-egress
  namespace: m2-net
spec:
  podSelector:
    matchLabels:
      app: client
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:          # cùng một phần tử "to" (không có dấu - thứ hai)
        matchLabels:              # nghĩa là AND: namespace kube-system VÀ pod kube-dns
          kubernetes.io/metadata.name: kube-system
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  - to:
    - podSelector:
        matchLabels:
          app: db
    ports:
    - protocol: TCP
      port: 80
~~~

~~~bash
k config use-context kind-ckad
k apply -f np.yaml
k exec m2-client -n m2-net -- wget -qO- -T 3 http://m2-db-svc        # OK
k exec m2-client -n m2-net -- wget -qO- -T 3 http://m2-other-svc     # timeout
~~~

**Chi tiết dễ sai:** policy so khớp **địa chỉ Pod đích sau khi kube-proxy DNAT**, nên rule dùng label của Pod ({{app=db}}) và port của container (80), không dùng ClusterIP của Service. Nhãn {{kubernetes.io/metadata.name}} được Kubernetes tự gắn lên mọi namespace, dùng nó thay vì tự đặt label.

> Mẹo tiết kiệm thời gian: copy YAML mẫu trong trang "Network Policies" rồi sửa. Luôn tự hỏi phần tử {{to}} là AND (một dấu gạch) hay OR (hai dấu gạch); thụt lề sai một cấp là policy mở cho cả cluster.`,
      refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
      tags: ['NetworkPolicy', 'egress', 'DNS'],
    },
    // ---------------------------------------------------------------- 10
    {
      id: 'ckad-2-10', no: 10, domain: 'Observability & Maintenance', weight: 6, env: 'kind', minutes: 8,
      title: 'Ứng dụng khởi động chậm bị liveness giết: thêm startupProbe, sửa readiness',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{m2-slow}} (namespace {{m2-probe}}, container {{app}}, 2 replica) cần khoảng 20 giây mới mở HTTP ở port {{8080}}. Pod đang restart liên tục (CrashLoopBackOff) và không bao giờ Ready.

Điều tra bằng events/describe, rồi sửa Deployment:
1. **Không** đổi lệnh ({{command}}) của container.
2. Thêm {{startupProbe}} httpGet {{/healthz}} port {{8080}}, {{periodSeconds: 5}}, {{failureThreshold: 12}} (cho tối đa 60 giây khởi động).
3. Giữ livenessProbe nhưng nó không được giết container trong lúc khởi động.
4. Sửa readinessProbe cho đúng: ứng dụng phục vụ đường dẫn {{/ready}} (không phải {{/readyz}}).

Kết quả: 2 Pod mới Ready và có restartCount bằng 0.`,
      setup: `set -e
kubectl create namespace m2-probe --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-slow -n m2-probe --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-slow
  namespace: m2-probe
spec:
  replicas: 2
  selector:
    matchLabels: {app: m2-slow}
  template:
    metadata:
      labels: {app: m2-slow}
    spec:
      terminationGracePeriodSeconds: 2
      containers:
      - name: app
        image: busybox:1.36
        command: ["sh", "-c", "sleep 20; mkdir -p /www; echo ok > /www/healthz; echo ready > /www/ready; exec httpd -f -p 8080 -h /www"]
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 2
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8080
          periodSeconds: 5
EOF
echo "Setup xong: chờ 30 giây rồi xem 'kubectl get pods -n m2-probe' và events."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-probe
J='{.spec.template.spec.containers[?(@.name=="app")]'
CMD=$(kubectl get deploy m2-slow -n $NS -o jsonpath="$J.command}" 2>/dev/null)
echo "$CMD" | grep -q "sleep 20" && pass command-unchanged || fail command-unchanged "command đã bị đổi"
SP=$(kubectl get deploy m2-slow -n $NS -o jsonpath="$J.startupProbe.httpGet.path}:$J.startupProbe.httpGet.port}:$J.startupProbe.periodSeconds}:$J.startupProbe.failureThreshold}" 2>/dev/null)
[ "$SP" = "/healthz:8080:5:12" ] && pass startup-probe || fail startup-probe "startupProbe='$SP'"
LP=$(kubectl get deploy m2-slow -n $NS -o jsonpath="$J.livenessProbe.httpGet.path}" 2>/dev/null)
[ "$LP" = "/healthz" ] && pass liveness-kept || fail liveness-kept "livenessProbe path='$LP'"
RP=$(kubectl get deploy m2-slow -n $NS -o jsonpath="$J.readinessProbe.httpGet.path}" 2>/dev/null)
[ "$RP" = "/ready" ] && pass readiness-path || fail readiness-path "readinessProbe path='$RP'"
if kubectl rollout status deploy/m2-slow -n $NS --timeout=180s >/dev/null 2>&1; then pass rollout-ready; else fail rollout-ready "rollout chưa xong sau 180s"; fi
sleep 5
ST=$(kubectl get pods -n $NS -l app=m2-slow -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status} {.status.containerStatuses[0].restartCount}{"\\n"}{end}' 2>/dev/null)
RDY=$(echo "$ST" | awk '$1=="True"' | wc -l)
BAD=$(echo "$ST" | awk '$1=="True" && $2!="0"' | wc -l)
if [ "$RDY" -eq 2 ] && [ "$BAD" -eq 0 ]; then pass ready-no-restart; else fail ready-no-restart "Ready=$RDY, Pod Ready có restart=$BAD"; fi
echo "RESULT $P/$T"`,
      solution: `**Chẩn đoán:** {{k describe pod -n m2-probe -l app=m2-slow}} cho thấy {{Liveness probe failed: ... connection refused}} rồi {{Container app failed liveness probe, will be restarted}}. Liveness bắt đầu sau 5 giây, thất bại 2 lần (khoảng giây thứ 10) là kubelet giết container, trong khi ứng dụng cần 20 giây. Vòng lặp này không bao giờ kết thúc. Lỗi thứ hai bị che: readiness gọi {{/readyz}} không tồn tại (404) nên dù sống sót Pod cũng không Ready.

**Vì sao dùng startupProbe thay vì tăng initialDelaySeconds:** khi có startupProbe, liveness và readiness **bị tắt** cho tới khi startupProbe thành công lần đầu. Ứng dụng có tối đa {{failureThreshold x periodSeconds}} = 60 giây để khởi động, nhưng sau đó liveness vẫn phát hiện treo nhanh (2 x 5 giây). Tăng initialDelaySeconds lên 60 thì mọi lần restart đều chậm 60 giây kể cả khi app khởi động nhanh.

~~~yaml
      containers:
      - name: app
        # command giữ nguyên
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          periodSeconds: 5
          failureThreshold: 12
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 2
        readinessProbe:
          httpGet:
            path: /ready          # sửa từ /readyz
            port: 8080
          periodSeconds: 5
~~~

~~~bash
k config use-context kind-ckad
k get events -n m2-probe --sort-by=.lastTimestamp | tail
k edit deploy m2-slow -n m2-probe        # thêm startupProbe, sửa readiness path
k rollout status deploy/m2-slow -n m2-probe
k get pods -n m2-probe -l app=m2-slow     # RESTARTS = 0
~~~

> Mẹo tiết kiệm thời gian: trong {{k edit}}, chép nguyên khối livenessProbe, dán ngay trên nó, đổi tên thành startupProbe và sửa hai số. Không cần mở docs. Nhớ rằng đề có thể có **hai** lỗi: sửa xong liveness hãy kiểm tra cột READY trước khi chuyển bài.`,
      refs: [{ type: 'doc', title: 'Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' }],
      tags: ['startupProbe', 'livenessProbe', 'readinessProbe', 'CrashLoopBackOff'],
    },
    // ---------------------------------------------------------------- 11
    {
      id: 'ckad-2-11', no: 11, domain: 'Design & Build', weight: 6, env: 'kind', minutes: 7,
      title: 'CronJob chồng Job: concurrencyPolicy, deadline và history limit',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{m2-cron}}, CronJob {{m2-cleanup}} chạy mỗi phút; Job đôi khi treo (lệnh {{sleep 600}} mô phỏng) nên các Job chồng lên nhau và tốn tài nguyên. Hãy sửa CronJob (giữ nguyên schedule và lệnh):
1. {{concurrencyPolicy: Forbid}}.
2. {{startingDeadlineSeconds: 20}}.
3. {{successfulJobsHistoryLimit: 2}} và {{failedJobsHistoryLimit: 1}}.
4. Mỗi Job bị dừng sau tối đa 40 giây: {{activeDeadlineSeconds: 40}} trong jobTemplate.
5. Xoá mọi Job cũ (label {{app=m2-cleanup}}) đã được tạo trước khi sửa.
6. Sau đó tạo thủ công Job {{m2-cleanup-manual}} từ CronJob {{m2-cleanup}} để chạy thử ngay.`,
      setup: `set -e
kubectl create namespace m2-cron --dry-run=client -o yaml | kubectl apply -f -
kubectl delete cronjob m2-cleanup -n m2-cron --ignore-not-found
kubectl delete job -n m2-cron -l app=m2-cleanup --ignore-not-found
kubectl delete job m2-cleanup-manual -n m2-cron --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: m2-cleanup
  namespace: m2-cron
spec:
  schedule: "*/1 * * * *"
  concurrencyPolicy: Allow
  jobTemplate:
    metadata:
      labels:
        app: m2-cleanup
    spec:
      backoffLimit: 0
      template:
        metadata:
          labels:
            app: m2-cleanup
        spec:
          restartPolicy: Never
          terminationGracePeriodSeconds: 1
          containers:
          - name: cleanup
            image: busybox:1.36
            command: ["sh", "-c", "echo cleanup-start; sleep 600"]
EOF
echo "Setup xong: sau vài phút sẽ có nhiều Job m2-cleanup-* chạy chồng nhau."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-cron
S=$(kubectl get cronjob m2-cleanup -n $NS -o jsonpath='{.spec.concurrencyPolicy}|{.spec.startingDeadlineSeconds}|{.spec.successfulJobsHistoryLimit}|{.spec.failedJobsHistoryLimit}|{.spec.jobTemplate.spec.activeDeadlineSeconds}' 2>/dev/null)
CP=$(echo "$S" | cut -d'|' -f1)
[ "$CP" = "Forbid" ] && pass concurrency-forbid || fail concurrency-forbid "concurrencyPolicy='$CP'"
[ "$(echo "$S" | cut -d'|' -f2)" = "20" ] && pass starting-deadline || fail starting-deadline "startingDeadlineSeconds='$(echo "$S" | cut -d'|' -f2)'"
[ "$(echo "$S" | cut -d'|' -f3-4)" = "2|1" ] && pass history-limits || fail history-limits "history='$(echo "$S" | cut -d'|' -f3-4)'"
[ "$(echo "$S" | cut -d'|' -f5)" = "40" ] && pass active-deadline || fail active-deadline "activeDeadlineSeconds='$(echo "$S" | cut -d'|' -f5)'"
SC=$(kubectl get cronjob m2-cleanup -n $NS -o jsonpath='{.spec.schedule}|{.spec.jobTemplate.spec.template.spec.containers[0].command}' 2>/dev/null)
echo "$SC" | grep -q '^\\*/1 \\* \\* \\* \\*|.*sleep 600' && pass schedule-command-kept || fail schedule-command-kept "schedule/command đã đổi: $SC"
OLD=$(kubectl get jobs -n $NS -l app=m2-cleanup -o jsonpath='{range .items[*]}{.metadata.name} {.spec.activeDeadlineSeconds}{"\\n"}{end}' 2>/dev/null | awk 'NF==1' | wc -l)
[ "$OLD" -eq 0 ] && pass old-jobs-removed || fail old-jobs-removed "còn $OLD Job không có activeDeadlineSeconds"
M=$(kubectl get job m2-cleanup-manual -n $NS -o jsonpath='{.metadata.annotations.cronjob\\.kubernetes\\.io/instantiate}|{.spec.activeDeadlineSeconds}' 2>/dev/null)
[ "$M" = "manual|40" ] && pass manual-job || fail manual-job "m2-cleanup-manual='$M' (cần tạo từ CronJob sau khi sửa)"
echo "RESULT $P/$T"`,
      solution: `**Ý nghĩa từng field:**
- {{concurrencyPolicy: Forbid}}: đến lịch mà Job trước còn chạy thì **bỏ qua** lần này ({{Replace}} thì huỷ Job cũ, {{Allow}} là mặc định và gây chồng Job).
- {{startingDeadlineSeconds: 20}}: lỡ lịch quá 20 giây (controller bận, bị Forbid) thì bỏ lần đó, tránh dồn nhiều lần chạy bù.
- {{activeDeadlineSeconds}} nằm ở **Job spec** (trong jobTemplate.spec), không phải CronJob spec: quá 40 giây Job bị đánh dấu Failed với lý do {{DeadlineExceeded}} và Pod bị dừng.
- History limit chỉ giữ 2 Job thành công và 1 Job lỗi gần nhất để không rác namespace.

~~~bash
k config use-context kind-ckad
k patch cronjob m2-cleanup -n m2-cron --type=merge -p '{
  "spec": {"concurrencyPolicy": "Forbid", "startingDeadlineSeconds": 20,
           "successfulJobsHistoryLimit": 2, "failedJobsHistoryLimit": 1,
           "jobTemplate": {"spec": {"activeDeadlineSeconds": 40}}}}'
k delete job -n m2-cron -l app=m2-cleanup
k create job m2-cleanup-manual --from=cronjob/m2-cleanup -n m2-cron
k get cronjob,job -n m2-cron
~~~

**Thứ tự quan trọng:** {{create job --from=cronjob}} chép jobTemplate **tại thời điểm chạy lệnh**, nên phải sửa CronJob trước rồi mới tạo Job thủ công (nếu không Job thủ công sẽ không có deadline). Xoá Job cũ trước khi tạo Job thủ công, vì Job thủ công cũng mang label {{app=m2-cleanup}} và sẽ bị xoá theo. Job tạo thủ công có annotation {{cronjob.kubernetes.io/instantiate: manual}}.

> Mẹo tiết kiệm thời gian: {{k explain cronjob.spec --recursive | less}} rồi tìm {{activeDeadline}} để biết field nằm ở cấp nào thay vì đoán. Dùng {{k edit}} nếu không chắc cú pháp JSON của {{patch}}.`,
      refs: [{ type: 'doc', title: 'CronJob', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' }],
      tags: ['CronJob', 'concurrencyPolicy', 'activeDeadlineSeconds'],
    },
    // ---------------------------------------------------------------- 12
    {
      id: 'ckad-2-12', no: 12, domain: 'Environment, Config & Security', weight: 5, env: 'kind', minutes: 6,
      title: 'SecurityContext: runAsUser, fsGroup và root filesystem chỉ đọc',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Pod {{m2-writer}} trong namespace {{m2-secctx}}, image {{busybox:1.36}}, container tên {{writer}}, lệnh {{sh -c "echo hello > /data/out.txt; sleep 3600"}}. Volume {{emptyDir}} tên {{data}} mount ở {{/data}}.

SecurityContext yêu cầu:
1. Cấp Pod: {{runAsUser: 1000}}, {{runAsGroup: 3000}}, {{fsGroup: 2000}}, {{runAsNonRoot: true}}.
2. Cấp container: {{allowPrivilegeEscalation: false}}, {{readOnlyRootFilesystem: true}}, bỏ mọi capability ({{drop: ["ALL"]}}).

Pod phải Running; file {{/data/out.txt}} phải thuộc group {{2000}}; ghi vào {{/tmp}} phải thất bại. Lưu manifest vào {{/opt/ckad/m2-writer.yaml}}.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-writer.yaml
kubectl create namespace m2-secctx --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod m2-writer -n m2-secctx --ignore-not-found --wait=true
echo "Setup xong."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-secctx
if kubectl wait --for=condition=Ready pod/m2-writer -n $NS --timeout=60s >/dev/null 2>&1; then pass pod-ready; else fail pod-ready "Pod m2-writer chưa Ready"; fi
U=$(kubectl exec m2-writer -n $NS -c writer -- id -u 2>/dev/null); G=$(kubectl exec m2-writer -n $NS -c writer -- id -g 2>/dev/null); GS=$(kubectl exec m2-writer -n $NS -c writer -- id -G 2>/dev/null)
[ "$U:$G" = "1000:3000" ] && pass uid-gid || fail uid-gid "uid:gid='$U:$G'"
echo " $GS " | grep -q " 2000 " && pass supplementary-fsgroup || fail supplementary-fsgroup "groups='$GS'"
FG=$(kubectl exec m2-writer -n $NS -c writer -- stat -c %g /data/out.txt 2>/dev/null)
[ "$FG" = "2000" ] && pass file-group || fail file-group "gid của /data/out.txt='$FG'"
if kubectl exec m2-writer -n $NS -c writer -- touch /tmp/x >/dev/null 2>&1; then fail readonly-rootfs "ghi được vào /tmp"; else pass readonly-rootfs; fi
C=$(kubectl get pod m2-writer -n $NS -o jsonpath='{.spec.containers[0].securityContext.allowPrivilegeEscalation} {.spec.containers[0].securityContext.capabilities.drop[*]} {.spec.securityContext.runAsNonRoot}' 2>/dev/null)
[ "$C" = "false ALL true" ] && pass container-hardening || fail container-hardening "allowPrivilegeEscalation/drop/runAsNonRoot='$C'"
grep -q "fsGroup: 2000" /opt/ckad/m2-writer.yaml 2>/dev/null && pass manifest-file || fail manifest-file "/opt/ckad/m2-writer.yaml thiếu hoặc không có fsGroup: 2000"
echo "RESULT $P/$T"`,
      solution: `**Cơ chế fsGroup:** với volume hỗ trợ quản lý quyền sở hữu (emptyDir, phần lớn PVC block/local), kubelet {{chown}} thư mục volume sang group {{fsGroup}} và bật bit setgid. File mới tạo trong đó thừa hưởng group của thư mục (2000) chứ không phải primary group của process (3000). Process cũng nhận 2000 làm supplementary group, nên nhiều container với UID khác nhau vẫn cùng ghi được volume.

~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: m2-writer
  namespace: m2-secctx
spec:
  securityContext:              # cấp Pod: áp cho mọi container + volume
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    runAsNonRoot: true
  volumes:
  - name: data
    emptyDir: {}
  containers:
  - name: writer
    image: busybox:1.36
    command: ["sh", "-c", "echo hello > /data/out.txt; sleep 3600"]
    securityContext:            # cấp container: capabilities và readOnlyRootFilesystem CHỈ có ở đây
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: data
      mountPath: /data
~~~

~~~bash
k config use-context kind-ckad
k run m2-writer -n m2-secctx --image=busybox:1.36 $do -- sh -c "echo hello > /data/out.txt; sleep 3600" > /opt/ckad/m2-writer.yaml
vi /opt/ckad/m2-writer.yaml       # đổi tên container thành writer, thêm securityContext + volume
k apply -f /opt/ckad/m2-writer.yaml
k exec m2-writer -n m2-secctx -- sh -c 'id; ls -ln /data'
~~~

**Bẫy:** đặt {{capabilities}} hay {{readOnlyRootFilesystem}} ở cấp Pod sẽ bị API server báo field không tồn tại; {{fsGroup}} thì ngược lại, chỉ có ở cấp Pod. {{runAsNonRoot: true}} với image chạy root mà không có {{runAsUser}} sẽ làm Pod kẹt ở {{CreateContainerConfigError}}.

> Mẹo tiết kiệm thời gian: {{k explain pod.spec.securityContext}} và {{k explain pod.spec.containers.securityContext}} cho biết ngay field nào ở cấp nào, nhanh hơn tìm trên docs.`,
      refs: [{ type: 'doc', title: 'Configure a Security Context for a Pod or Container', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' }],
      tags: ['securityContext', 'fsGroup', 'readOnlyRootFilesystem'],
    },
    // ---------------------------------------------------------------- 13
    {
      id: 'ckad-2-13', no: 13, domain: 'Deployment', weight: 6, env: 'kind', minutes: 6,
      title: 'Rollback về đúng revision theo image và siết chiến lược rolling update',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{m2-checkout}} trong namespace {{m2-hist}} đã qua 4 revision và bản hiện tại bị hỏng (image không tồn tại). Revision phiên bản trước nó cũng lỗi (readiness không bao giờ đạt).

1. Dùng {{kubectl rollout history}} tìm **số revision** duy nhất có image {{nginx:1.26-alpine}}. Ghi đúng con số đó (chỉ con số) vào {{/opt/ckad/m2-hist-rev.txt}}.
2. Rollback {{m2-checkout}} về revision đó (phải khôi phục toàn bộ Pod template của revision ấy, kể cả biến môi trường).
3. Đổi chiến lược rolling update thành {{maxSurge: 1}}, {{maxUnavailable: 0}} mà **không** tạo thêm revision.

Rollout phải hoàn tất với 3 Pod Ready.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-hist-rev.txt
NS=m2-hist
kubectl create namespace $NS --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-checkout -n $NS --ignore-not-found --wait=true
kubectl delete rs -n $NS -l app=m2-checkout --ignore-not-found --wait=true
waitrev(){ for i in $(seq 1 60); do R=$(kubectl get deploy m2-checkout -n $NS -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}'); [ "$R" = "$1" ] && return 0; sleep 1; done; echo "revision $1 chưa xuất hiện"; return 1; }
kubectl create deployment m2-checkout --image=nginx:1.25-alpine --replicas=3 -n $NS
kubectl annotate deploy m2-checkout -n $NS kubernetes.io/change-cause="v1 nginx 1.25" --overwrite
waitrev 1
kubectl rollout status deploy/m2-checkout -n $NS --timeout=120s
kubectl rollout pause deploy/m2-checkout -n $NS
kubectl set image deploy/m2-checkout nginx=nginx:1.26-alpine -n $NS
kubectl set env deploy/m2-checkout MODE=canary -n $NS
kubectl annotate deploy m2-checkout -n $NS kubernetes.io/change-cause="v2 canary" --overwrite
kubectl rollout resume deploy/m2-checkout -n $NS
waitrev 2
kubectl rollout status deploy/m2-checkout -n $NS --timeout=120s
kubectl rollout pause deploy/m2-checkout -n $NS
kubectl set image deploy/m2-checkout nginx=nginx:1.27-alpine -n $NS
kubectl patch deploy m2-checkout -n $NS --type=json -p '[{"op":"add","path":"/spec/template/spec/containers/0/readinessProbe","value":{"tcpSocket":{"port":8081},"periodSeconds":2}}]'
kubectl annotate deploy m2-checkout -n $NS kubernetes.io/change-cause="v3 new probe" --overwrite
kubectl rollout resume deploy/m2-checkout -n $NS
waitrev 3
kubectl rollout pause deploy/m2-checkout -n $NS
kubectl set image deploy/m2-checkout nginx=nginx:0.0-missing -n $NS
kubectl annotate deploy m2-checkout -n $NS kubernetes.io/change-cause="v4 hotfix" --overwrite
kubectl rollout resume deploy/m2-checkout -n $NS
waitrev 4
echo "Setup xong: m2-checkout đang ở revision 4 (hỏng)."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-hist
F=$(tr -d '[:space:]' < /opt/ckad/m2-hist-rev.txt 2>/dev/null)
[ "$F" = "2" ] && pass revision-file || fail revision-file "file chứa '$F'"
IE=$(kubectl get deploy m2-checkout -n $NS -o jsonpath='{.spec.template.spec.containers[0].image} {.spec.template.spec.containers[0].env[?(@.name=="MODE")].value}' 2>/dev/null)
[ "$IE" = "nginx:1.26-alpine canary" ] && pass template-restored || fail template-restored "image/MODE='$IE'"
PR=$(kubectl get deploy m2-checkout -n $NS -o jsonpath='{.spec.template.spec.containers[0].readinessProbe}' 2>/dev/null)
[ -z "$PR" ] && pass no-broken-probe || fail no-broken-probe "còn readinessProbe: $PR"
ST=$(kubectl get deploy m2-checkout -n $NS -o jsonpath='{.spec.strategy.rollingUpdate.maxSurge}/{.spec.strategy.rollingUpdate.maxUnavailable}' 2>/dev/null)
[ "$ST" = "1/0" ] && pass strategy || fail strategy "maxSurge/maxUnavailable='$ST'"
REV=$(kubectl get deploy m2-checkout -n $NS -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}' 2>/dev/null)
[ "$REV" = "5" ] && pass undo-revision || fail undo-revision "revision='$REV' (rollback về 2 phải thành revision 5, đổi strategy không tạo revision)"
if kubectl rollout status deploy/m2-checkout -n $NS --timeout=90s >/dev/null 2>&1; then pass rollout-ready; else fail rollout-ready "rollout chưa hoàn tất"; fi
echo "RESULT $P/$T"`,
      solution: `**Tìm revision:** {{rollout history}} chỉ hiện CHANGE-CAUSE; phải xem chi tiết từng revision bằng {{--revision=N}} để thấy image. Không suy đoán từ change-cause, vì change-cause do người gõ và có thể sai.

~~~bash
k config use-context kind-ckad
k rollout history deploy/m2-checkout -n m2-hist
for r in 1 2 3 4; do echo "== $r"; k rollout history deploy/m2-checkout -n m2-hist --revision=$r | grep -E "Image|MODE"; done
echo 2 > /opt/ckad/m2-hist-rev.txt
k rollout undo deploy/m2-checkout -n m2-hist --to-revision=2
k patch deploy m2-checkout -n m2-hist -p '{"spec":{"strategy":{"rollingUpdate":{"maxSurge":1,"maxUnavailable":0}}}}'
k rollout status deploy/m2-checkout -n m2-hist
k rollout history deploy/m2-checkout -n m2-hist     # revision 2 biến mất, xuất hiện revision 5
~~~

**Vì sao revision thành 5:** {{rollout undo}} không quay kim đồng hồ lùi lại; nó chép Pod template của revision 2 thành template hiện tại, ReplicaSet cũ của revision 2 được dùng lại và đánh số mới là 5. Vì vậy cả image lẫn {{MODE=canary}} được khôi phục, còn readinessProbe hỏng của revision 3 biến mất. Nếu chỉ {{set image nginx:1.26-alpine}} thì template vẫn mang readinessProbe 8081 của revision 4, Pod không bao giờ Ready.

**Vì sao strategy không tạo revision:** revision chỉ tăng khi {{spec.template}} đổi; {{spec.strategy}} nằm ngoài template. {{maxUnavailable: 0}} + {{maxSurge: 1}} đảm bảo luôn đủ 3 Pod phục vụ trong lúc rollout.

> Mẹo tiết kiệm thời gian: {{k get rs -n m2-hist -o wide}} hiện cột IMAGES và annotation revision của mọi ReplicaSet trong một màn hình, nhanh hơn xem từng {{--revision}}. Tìm RS có image cần, đọc {{deployment.kubernetes.io/revision}} bằng {{k describe rs}}.`,
      refs: [{ type: 'doc', title: 'Deployments: Rolling Back a Deployment', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' }],
      tags: ['rollout undo', 'rollout history', 'maxUnavailable'],
    },
    // ---------------------------------------------------------------- 14
    {
      id: 'ckad-2-14', no: 14, domain: 'Services & Networking', weight: 7, env: 'kind', minutes: 9,
      title: 'Service không phản hồi: lỗi chồng lỗi selector, targetPort, readiness, NetworkPolicy',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{m2-debug}}, Deployment {{m2-catalog}} (2 replica, nginx nghe port 80) đứng sau Service {{m2-catalog-svc}} port 80. Không client nào gọi được {{http://m2-catalog-svc}}. Namespace có NetworkPolicy {{m2-default-deny}} chặn mọi ingress, policy này phải **giữ nguyên**.

Yêu cầu (có nhiều lỗi độc lập, tìm và sửa hết):
1. Cả 2 Pod {{m2-catalog}} phải Ready và Service {{m2-catalog-svc}} phải có đủ 2 endpoint, đúng port.
2. Tạo NetworkPolicy {{m2-allow-frontend}} chỉ cho Pod có label {{role=frontend}} trong {{m2-debug}} truy cập Pod {{m2-catalog}} ở TCP port 80.
3. Pod không có label {{role=frontend}} vẫn **không** gọi được Service.

Không xoá và tạo lại Deployment.`,
      setup: `set -e
kubectl get daemonset calico-node -n kube-system >/dev/null 2>&1 || echo "CẢNH BÁO: chưa thấy Calico, NetworkPolicy sẽ không có hiệu lực."
kubectl create namespace m2-debug --dry-run=client -o yaml | kubectl apply -f -
kubectl delete networkpolicy m2-allow-frontend -n m2-debug --ignore-not-found
kubectl delete deployment m2-catalog -n m2-debug --ignore-not-found --wait=true
kubectl delete service m2-catalog-svc -n m2-debug --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-catalog
  namespace: m2-debug
spec:
  replicas: 2
  selector:
    matchLabels: {app: m2-catalog}
  template:
    metadata:
      labels: {app: m2-catalog, tier: backend}
    spec:
      containers:
      - name: web
        image: nginx:1.27-alpine
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: m2-catalog-svc
  namespace: m2-debug
spec:
  selector: {app: catalog}
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: m2-default-deny
  namespace: m2-debug
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
EOF
echo "Setup xong: m2-catalog-svc không phản hồi."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-debug
DD=$(kubectl get networkpolicy m2-default-deny -n $NS -o jsonpath='{.spec.policyTypes[*]}' 2>/dev/null)
[ "$DD" = "Ingress" ] && pass default-deny-kept || fail default-deny-kept "m2-default-deny bị xoá/sửa ('$DD')"
kubectl get networkpolicy m2-allow-frontend -n $NS >/dev/null 2>&1 && pass allow-policy-exists || fail allow-policy-exists "chưa có m2-allow-frontend"
if kubectl rollout status deploy/m2-catalog -n $NS --timeout=90s >/dev/null 2>&1; then pass pods-ready; else fail pods-ready "m2-catalog chưa đủ Pod Ready"; fi
EP=$(kubectl get endpoints m2-catalog-svc -n $NS -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)
EPP=$(kubectl get endpoints m2-catalog-svc -n $NS -o jsonpath='{.subsets[0].ports[0].port}' 2>/dev/null)
[ "$EP" -eq 2 ] && [ "$EPP" = "80" ] && pass endpoints || fail endpoints "endpoint ready=$EP, port='$EPP'"
FE=$(kubectl run m2-fe-$RANDOM -n $NS --labels=role=frontend --rm -i --quiet --restart=Never --image=busybox:1.36 --command -- wget -qO- -T 4 http://m2-catalog-svc 2>/dev/null)
echo "$FE" | grep -q "Welcome to nginx" && pass frontend-allowed || fail frontend-allowed "Pod role=frontend không gọi được m2-catalog-svc"
OT=$(kubectl run m2-x-$RANDOM -n $NS --rm -i --quiet --restart=Never --image=busybox:1.36 --command -- wget -qO- -T 4 http://m2-catalog-svc 2>/dev/null)
echo "$OT" | grep -q "Welcome to nginx" && fail others-blocked "Pod không có label vẫn gọi được" || pass others-blocked
echo "RESULT $P/$T"`,
      solution: `**Quy trình debug Service (đi từ trong ra ngoài):** Pod Ready? → Service có endpoint? → endpoint đúng port? → có policy chặn? Mỗi bước một lệnh:

~~~bash
k config use-context kind-ckad
k get pods -n m2-debug --show-labels             # 0/1 READY, label app=m2-catalog
k describe pod -n m2-debug -l app=m2-catalog | grep -A3 Readiness   # probe port 8080: connection refused
k get endpoints m2-catalog-svc -n m2-debug       # <none>
k get svc m2-catalog-svc -n m2-debug -o wide     # SELECTOR app=catalog (sai)
k get networkpolicy -n m2-debug
~~~

Bốn lỗi chồng nhau: (1) readinessProbe gọi port 8080 trong khi nginx nghe 80, nên Pod không Ready và **không bao giờ** vào endpoint; (2) selector {{app=catalog}} không khớp label {{app=m2-catalog}}; (3) targetPort 8080 sai; (4) default-deny chặn mọi ingress. Sửa thiếu một lỗi vẫn hỏng, nên phải kiểm tra lại sau mỗi bước.

~~~bash
k patch deploy m2-catalog -n m2-debug --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/port","value":80}]'
k patch svc m2-catalog-svc -n m2-debug --type=json -p '[{"op":"replace","path":"/spec/selector","value":{"app":"m2-catalog"}},{"op":"replace","path":"/spec/ports/0/targetPort","value":80}]'
k apply -f allow.yaml
k run t -n m2-debug --labels=role=frontend --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- -T 4 http://m2-catalog-svc
~~~

~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: m2-allow-frontend
  namespace: m2-debug
spec:
  podSelector:
    matchLabels:
      app: m2-catalog
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:            # không có namespaceSelector = chỉ Pod cùng namespace
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 80
~~~

**Vì sao không xoá default-deny:** các NetworkPolicy là **cộng dồn** (union): Pod bị chọn bởi một policy Ingress thì chỉ nhận traffic mà ít nhất một policy cho phép. Thêm policy allow là cách đúng; xoá deny sẽ mở cho mọi Pod.

> Mẹo tiết kiệm thời gian: {{k get endpoints}} (hoặc {{k get endpointslices}}) là lệnh "chẩn đoán một phát": rỗng nghĩa là lỗi ở selector hoặc readiness, có IP mà vẫn không gọi được thì lỗi ở targetPort hoặc NetworkPolicy.`,
      refs: [
        { type: 'doc', title: 'Debug Services', url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/' },
        { type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
      ],
      tags: ['troubleshooting', 'Service', 'NetworkPolicy', 'readinessProbe'],
    },
    // ---------------------------------------------------------------- 15
    {
      id: 'ckad-2-15', no: 15, domain: 'Observability & Maintenance', weight: 3, env: 'kind', minutes: 4,
      title: 'Tìm Pod tốn CPU nhất bằng kubectl top',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{m2-top}} có 3 Pod {{m2-cpu-a}}, {{m2-cpu-b}}, {{m2-cpu-c}}. metrics-server đã được setup cài (có thể cần chờ khoảng 1 phút để có số liệu).

1. Ghi **tên** Pod đang dùng nhiều CPU nhất trong {{m2-top}} (chỉ tên, một dòng) vào {{/opt/ckad/m2-top-cpu.txt}}.
2. Ghi output của lệnh liệt kê mức dùng CPU/memory của mọi Pod trong {{m2-top}}, **sắp xếp theo CPU**, vào {{/opt/ckad/m2-top-all.txt}}.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-top-cpu.txt /opt/ckad/m2-top-all.txt
if ! kubectl get deployment metrics-server -n kube-system >/dev/null 2>&1; then
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
fi
if ! kubectl get deployment metrics-server -n kube-system -o jsonpath='{.spec.template.spec.containers[0].args}' | grep -q kubelet-insecure-tls; then
  kubectl patch deployment metrics-server -n kube-system --type=json -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
fi
kubectl create namespace m2-top --dry-run=client -o yaml | kubectl apply -f -
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: m2-cpu-a
  namespace: m2-top
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: c
    image: busybox:1.36
    command: ["sleep", "36000"]
---
apiVersion: v1
kind: Pod
metadata:
  name: m2-cpu-b
  namespace: m2-top
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: c
    image: busybox:1.36
    command: ["sh", "-c", "while true; do :; done"]
    resources:
      limits:
        cpu: 300m
---
apiVersion: v1
kind: Pod
metadata:
  name: m2-cpu-c
  namespace: m2-top
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: c
    image: busybox:1.36
    command: ["sh", "-c", "while true; do sleep 1; done"]
EOF
kubectl rollout status deployment metrics-server -n kube-system --timeout=180s`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
F=$(tr -d '[:space:]' < /opt/ckad/m2-top-cpu.txt 2>/dev/null)
[ "$F" = "m2-cpu-b" ] && pass top-pod || fail top-pod "file chứa '$F'"
A=/opt/ckad/m2-top-all.txt
if grep -q "CPU" "$A" 2>/dev/null && grep -q "m2-cpu-a" "$A" && grep -q "m2-cpu-c" "$A"; then pass top-all-file; else fail top-all-file "$A thiếu hoặc không phải output kubectl top pod"; fi
FIRST=$(grep -v "^NAME" "$A" 2>/dev/null | head -n 1 | awk '{print $1}')
[ "$FIRST" = "m2-cpu-b" ] && pass sorted-by-cpu || fail sorted-by-cpu "dòng đầu là '$FIRST', chưa sắp theo CPU"
echo "RESULT $P/$T"`,
      solution: `**Lệnh cần nhớ:** {{kubectl top}} đọc Metrics API do metrics-server cung cấp. {{--sort-by}} chỉ nhận {{cpu}} hoặc {{memory}} và sắp **giảm dần**, nên dòng đầu tiên sau header chính là Pod tốn nhất.

~~~bash
k config use-context kind-ckad
k top pod -n m2-top --sort-by=cpu
k top pod -n m2-top --sort-by=cpu > /opt/ckad/m2-top-all.txt
k top pod -n m2-top --sort-by=cpu --no-headers | head -n 1 | awk '{print $1}' > /opt/ckad/m2-top-cpu.txt
cat /opt/ckad/m2-top-cpu.txt
~~~

**Nếu báo "Metrics API not available":** metrics-server chưa sẵn sàng hoặc chưa thu thập đủ một chu kỳ (mặc định 15 giây, lần đầu có thể mất tới một phút). Trên kind, kubelet dùng chứng chỉ tự ký nên metrics-server cần cờ {{--kubelet-insecure-tls}}; setup đã thêm. Trong kỳ thi, metrics-server thường đã có sẵn.

**Vì sao m2-cpu-b:** vòng lặp {{while true; do :; done}} chạy liên tục tới giới hạn 300m, hai Pod còn lại gần như 0m. Khi đề hỏi "Pod tốn nhiều nhất", hãy ghi đúng tên Pod chứ không ghi cả dòng output.

> Mẹo tiết kiệm thời gian: dùng {{--no-headers}} cộng {{head}}/{{awk}} để ghi đúng định dạng đề yêu cầu trong một lệnh, rồi {{cat}} lại file để chắc không có dòng thừa. Với Pod nhiều container, thêm {{--containers}} để thấy từng container.`,
      refs: [{ type: 'doc', title: 'Resource metrics pipeline', url: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/' }],
      tags: ['kubectl top', 'metrics-server'],
    },
    // ---------------------------------------------------------------- 16
    {
      id: 'ckad-2-16', no: 16, domain: 'Design & Build', weight: 4, env: 'kind', minutes: 5,
      title: 'PVC kẹt Pending vì StorageClass sai, dữ liệu phải sống qua lần tạo lại Pod',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{m2-pvc}}, PersistentVolumeClaim {{m2-data}} đang Pending và Pod {{m2-store}} (image {{nginx:1.27-alpine}}, mount claim ở {{/usr/share/nginx/html}}) cũng Pending.

1. Tìm nguyên nhân. Sửa để {{m2-data}} dùng StorageClass {{standard}}, dung lượng {{256Mi}}, accessMode {{ReadWriteOnce}} và đạt trạng thái Bound.
2. Pod {{m2-store}} phải Running với claim {{m2-data}}. Lưu manifest Pod vào {{/opt/ckad/m2-store.yaml}}.
3. Ghi nội dung {{m2-persist}} vào {{/usr/share/nginx/html/index.html}} bên trong Pod, sau đó **xoá Pod và tạo lại** từ file manifest: nội dung file vẫn phải còn.`,
      setup: `set -e
mkdir -p /opt/ckad
rm -f /opt/ckad/m2-store.yaml
kubectl create namespace m2-pvc --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod m2-store -n m2-pvc --ignore-not-found --wait=true
kubectl delete pvc m2-data -n m2-pvc --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: m2-data
  namespace: m2-pvc
spec:
  storageClassName: fast-ssd
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 256Mi
---
apiVersion: v1
kind: Pod
metadata:
  name: m2-store
  namespace: m2-pvc
spec:
  containers:
  - name: web
    image: nginx:1.27-alpine
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html
  volumes:
  - name: html
    persistentVolumeClaim:
      claimName: m2-data
EOF
echo "Setup xong: PVC m2-data Pending."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-pvc
PV=$(kubectl get pvc m2-data -n $NS -o jsonpath='{.status.phase} {.spec.storageClassName} {.spec.resources.requests.storage} {.spec.accessModes[*]}' 2>/dev/null)
[ "$PV" = "Bound standard 256Mi ReadWriteOnce" ] && pass pvc-bound || fail pvc-bound "pvc='$PV'"
if kubectl wait --for=condition=Ready pod/m2-store -n $NS --timeout=60s >/dev/null 2>&1; then pass pod-ready; else fail pod-ready "Pod m2-store chưa Ready"; fi
CL=$(kubectl get pod m2-store -n $NS -o jsonpath='{.spec.volumes[*].persistentVolumeClaim.claimName}' 2>/dev/null)
[ "$CL" = "m2-data" ] && pass pod-uses-claim || fail pod-uses-claim "claimName='$CL'"
C=$(kubectl exec m2-store -n $NS -- cat /usr/share/nginx/html/index.html 2>/dev/null)
[ "$C" = "m2-persist" ] && pass data-persisted || fail data-persisted "index.html='$C'"
PT=$(kubectl get pod m2-store -n $NS -o jsonpath='{.metadata.creationTimestamp}' 2>/dev/null)
CT=$(kubectl get pvc m2-data -n $NS -o jsonpath='{.metadata.creationTimestamp}' 2>/dev/null)
RS=$(kubectl get pod m2-store -n $NS -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null)
grep -q "claimName: m2-data" /opt/ckad/m2-store.yaml 2>/dev/null && [ -n "$PT" ] && [ "$PT" \\> "$CT" ] && pass manifest-and-recreated || fail manifest-and-recreated "thiếu /opt/ckad/m2-store.yaml hoặc Pod không được tạo sau PVC (pod=$PT pvc=$CT restarts=$RS)"
echo "RESULT $P/$T"`,
      solution: `**Chẩn đoán:** {{k describe pvc m2-data -n m2-pvc}} báo {{storageclass.storage.k8s.io "fast-ssd" not found}}. {{k get storageclass}} trên kind chỉ có {{standard (default)}} dùng provisioner {{rancher.io/local-path}} với {{volumeBindingMode: WaitForFirstConsumer}}: PVC chỉ Bound khi có Pod dùng nó được lên lịch, nên PVC Pending lúc chưa có Pod là **bình thường**; Pending kèm lỗi "not found" mới là lỗi.

{{storageClassName}} của PVC là immutable, phải xoá và tạo lại. PVC có finalizer {{kubernetes.io/pvc-protection}}: còn Pod dùng thì lệnh xoá PVC sẽ treo, nên xoá Pod trước.

~~~bash
k config use-context kind-ckad
k get pod m2-store -n m2-pvc -o yaml > /opt/ckad/m2-store.yaml   # rồi xoá status, uid, nodeName...
k get pvc m2-data -n m2-pvc -o yaml > /tmp/pvc.yaml
k delete pod m2-store -n m2-pvc
k delete pvc m2-data -n m2-pvc
# sửa storageClassName: standard trong /tmp/pvc.yaml (xoá status, uid, volumeName) rồi
k apply -f /tmp/pvc.yaml
k apply -f /opt/ckad/m2-store.yaml
k exec m2-store -n m2-pvc -- sh -c 'echo m2-persist > /usr/share/nginx/html/index.html'
k delete pod m2-store -n m2-pvc && k apply -f /opt/ckad/m2-store.yaml
k exec m2-store -n m2-pvc -- cat /usr/share/nginx/html/index.html    # vẫn là m2-persist
~~~

~~~yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: m2-data
  namespace: m2-pvc
spec:
  storageClassName: standard
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 256Mi
~~~

**Vì sao dữ liệu còn:** dữ liệu nằm trên PersistentVolume (thư mục local-path trên node), vòng đời PV gắn với PVC chứ không gắn với Pod. Với local-path, Pod tạo lại sẽ được lên lịch về đúng node chứa volume nhờ node affinity của PV.

> Mẹo tiết kiệm thời gian: khi xuất YAML Pod để tạo lại, chỉ cần giữ {{metadata.name/namespace}} và {{spec.containers}}, {{spec.volumes}}; viết tay khung Pod thường nhanh hơn dọn YAML xuất ra từ {{-o yaml}}.`,
      refs: [{ type: 'doc', title: 'Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' }],
      tags: ['PVC', 'StorageClass', 'local-path'],
    },
    // ---------------------------------------------------------------- 17
    {
      id: 'ckad-2-17', no: 17, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 7,
      title: 'Pod kẹt vì sai key Secret và thiếu ConfigMap: sửa tham chiếu, tạo ConfigMap immutable',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{m2-payments}} trong namespace {{m2-cfg}} không chạy được. Nó lấy biến môi trường {{DB_PASSWORD}} từ Secret {{m2-pay-secret}} và mount ConfigMap {{m2-pay-config}} ở {{/etc/pay}}.

1. **Không** sửa Secret {{m2-pay-secret}}. Sửa Deployment để {{DB_PASSWORD}} lấy đúng key đang có trong Secret.
2. Tạo ConfigMap {{m2-pay-config}} với {{APP_MODE=prod}} và {{MAX_RETRY=3}}, đặt {{immutable: true}}.
3. Pod phải Running: {{printenv DB_PASSWORD}} trả về mật khẩu trong Secret, các file {{/etc/pay/APP_MODE}} và {{/etc/pay/MAX_RETRY}} có nội dung {{prod}} và {{3}}.`,
      setup: `set -e
kubectl create namespace m2-cfg --dry-run=client -o yaml | kubectl apply -f -
kubectl delete configmap m2-pay-config -n m2-cfg --ignore-not-found
kubectl create secret generic m2-pay-secret -n m2-cfg --from-literal=db-password=Pa55word --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deployment m2-payments -n m2-cfg --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: m2-payments
  namespace: m2-cfg
spec:
  replicas: 1
  selector:
    matchLabels: {app: m2-payments}
  template:
    metadata:
      labels: {app: m2-payments}
    spec:
      containers:
      - name: api
        image: nginx:1.27-alpine
        env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: m2-pay-secret
              key: DB_PASSWORD
        volumeMounts:
        - name: cfg
          mountPath: /etc/pay
      volumes:
      - name: cfg
        configMap:
          name: m2-pay-config
EOF
echo "Setup xong: Pod m2-payments sẽ kẹt ContainerCreating/CreateContainerConfigError."`,
      verify: `P=0; T=0
pass(){ P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
fail(){ T=$((T+1)); echo "FAIL $1: $2"; }
NS=m2-cfg
SK=$(kubectl get secret m2-pay-secret -n $NS -o jsonpath='{.data.db-password}' 2>/dev/null | base64 -d 2>/dev/null)
SX=$(kubectl get secret m2-pay-secret -n $NS -o jsonpath='{.data.DB_PASSWORD}' 2>/dev/null)
[ "$SK" = "Pa55word" ] && [ -z "$SX" ] && pass secret-untouched || fail secret-untouched "Secret m2-pay-secret đã bị sửa"
CM=$(kubectl get configmap m2-pay-config -n $NS -o jsonpath='{.immutable} {.data.APP_MODE} {.data.MAX_RETRY}' 2>/dev/null)
[ "$CM" = "true prod 3" ] && pass configmap || fail configmap "immutable/APP_MODE/MAX_RETRY='$CM'"
if kubectl rollout status deploy/m2-payments -n $NS --timeout=90s >/dev/null 2>&1; then pass rollout-ready; else fail rollout-ready "m2-payments chưa Ready"; fi
sleep 3
V=$(kubectl exec deploy/m2-payments -n $NS -- printenv DB_PASSWORD 2>/dev/null)
[ "$V" = "Pa55word" ] && pass env-secret || fail env-secret "DB_PASSWORD='$V'"
F=$(kubectl exec deploy/m2-payments -n $NS -- sh -c 'cat /etc/pay/APP_MODE; echo; cat /etc/pay/MAX_RETRY' 2>/dev/null | tr '\\n' ' ')
[ "$F" = "prod 3" ] && pass mounted-files || fail mounted-files "/etc/pay='$F'"
echo "RESULT $P/$T"`,
      solution: `**Chẩn đoán hai lỗi chồng nhau:**
- {{k describe pod -n m2-cfg -l app=m2-payments}}: event {{MountVolume.SetUp failed ... configmap "m2-pay-config" not found}}, Pod kẹt {{ContainerCreating}}.
- Tạo ConfigMap xong thì lộ lỗi thứ hai: {{CreateContainerConfigError}} với {{couldn't find key DB_PASSWORD in Secret m2-cfg/m2-pay-secret}}. Xem key thật bằng {{k describe secret m2-pay-secret -n m2-cfg}} (chỉ hiện tên key và số byte): key là {{db-password}}.

~~~bash
k config use-context kind-ckad
k create configmap m2-pay-config -n m2-cfg --from-literal=APP_MODE=prod --from-literal=MAX_RETRY=3 $do > cm.yaml
echo "immutable: true" >> cm.yaml        # immutable là field cấp gốc, cùng cấp với data
k apply -f cm.yaml
k patch deploy m2-payments -n m2-cfg --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/env/0/valueFrom/secretKeyRef/key","value":"db-password"}]'
k rollout status deploy/m2-payments -n m2-cfg
k exec deploy/m2-payments -n m2-cfg -- sh -c 'printenv DB_PASSWORD; ls /etc/pay'
~~~

~~~yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: m2-pay-config
  namespace: m2-cfg
data:
  APP_MODE: prod
  MAX_RETRY: "3"          # value phải là chuỗi, số 3 không có nháy sẽ bị từ chối
immutable: true
~~~

**Vì sao immutable:** kubelet không phải watch ConfigMap immutable, giảm tải API server khi có hàng nghìn Pod, và tránh sửa nhầm cấu hình production. Đổi nội dung thì phải tạo ConfigMap tên mới (hoặc xoá rồi tạo lại) và rollout lại Deployment. Biến môi trường từ Secret chỉ được đọc lúc container khởi động; file mount từ ConfigMap (không immutable, không subPath) thì được kubelet cập nhật sau khoảng một phút.

> Mẹo tiết kiệm thời gian: đọc **events** trước tiên ({{k get events -n m2-cfg --sort-by=.lastTimestamp}}); lỗi thiếu ConfigMap/Secret luôn nằm ở đó, nhanh hơn mở YAML Deployment để dò.`,
      refs: [
        { type: 'doc', title: 'ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' },
        { type: 'doc', title: 'Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' },
      ],
      tags: ['Secret', 'ConfigMap', 'immutable', 'CreateContainerConfigError'],
    },
  ],
});
