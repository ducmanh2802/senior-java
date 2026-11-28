/* CKAD hands-on mock exam 1 (docs/CKAD-MOCK.md) — original tasks, exam difficulty. */
(window.CKAD_EXAMS = window.CKAD_EXAMS || []).push({
  id: 'ckad-1',
  title: 'Đề thi thử CKAD số 1',
  minutes: 120,
  passPct: 66,
  intro: `### Môi trường thi
Đề chạy trên một cluster {{kind}} tên {{ckad}} (context {{kind-ckad}}): 1 control-plane + 2 worker. Tạo cluster bằng file {{kind-ckad.yaml}} có nội dung:

~~~yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
- role: worker
- role: worker
~~~

Rồi chạy: {{kind create cluster --name ckad --config kind-ckad.yaml}}. Đợi các node Ready.

### Chuẩn bị
Tạo thư mục nộp bài: {{mkdir -p /opt/ckad}}. Mọi file kết quả (nếu bài yêu cầu) ghi vào {{/opt/ckad/...}}.

Alias nên gõ ngay đầu giờ:
~~~bash
alias k=kubectl
export do="--dry-run=client -o yaml"
k config use-context kind-ckad
~~~

### Cách làm mỗi bài
1. Đọc dòng Context và chạy đúng {{kubectl config use-context kind-ckad}} trước khi làm.
2. Dán đoạn Setup để tạo tình huống (chạy lại nhiều lần vẫn an toàn, không nhân đôi tài nguyên).
3. Làm yêu cầu bằng {{kubectl}}, {{helm}} hoặc {{kustomize}} (đều có sẵn trên máy thi).
4. Dán Verify: nó in {{PASS}}/{{FAIL}} cho từng mục và dòng cuối {{RESULT passed/total}}. PASS hết là đạt bài.

Bài cần Ingress, NetworkPolicy hay metrics-server: phần Setup đã cài ingress-nginx, Calico hoặc metrics-server kèm {{|| true}} để cài lại không báo lỗi.`,
  tasks: [
    {
      id: 'ckad-1-01', no: 1, domain: 'Design & Build', weight: 7, env: 'kind', minutes: 7,
      title: 'Pod hai container dùng chung emptyDir (app + sidecar đọc log)',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Pod {{t01-pod}} ở namespace {{t01}} gồm hai container dùng chung một volume {{emptyDir}} tên {{cache}} mount tại {{/cache}}:
- Container {{app}} (image {{busybox:1.36}}) cứ mỗi 2 giây ghi một dòng thời gian vào {{/cache/out.txt}}.
- Container {{log}} (image {{busybox:1.36}}) đọc và in liên tục nội dung {{/cache/out.txt}} (dùng {{tail -f}}).

Cả hai container phải Ready (tổng 2/2). Đây là mẫu multi-container: một container sinh dữ liệu, một container đọc, chia sẻ qua ổ đĩa tạm.`,
      setup: `kubectl create namespace t01 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl delete pod t01-pod -n t01 --force --grace-period 0 >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
phase=$(kubectl get pod t01-pod -n t01 -o jsonpath='{.status.phase}' 2>/dev/null)
if [ "$phase" = "Running" ]; then ok pod-running; else bad pod-running "phase=$phase"; fi
ready=$(kubectl get pod t01-pod -n t01 -o jsonpath='{range .status.containerStatuses[?(@.ready==true)]}{.name} {end}' 2>/dev/null | wc -w)
if [ "$ready" -ge 2 ]; then ok two-containers-ready; else bad two-containers-ready "ready=$ready"; fi
data=$(kubectl exec t01-pod -n t01 -c app -- cat /cache/out.txt 2>/dev/null)
if [ -n "$data" ]; then ok shared-volume; else bad shared-volume "file rong"; fi
echo "RESULT $p/$t"`,
      solution: `### Tạo Pod hai container chia sẻ emptyDir
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: t01-pod
  namespace: t01
spec:
  volumes:
  - name: cache
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh","-c","while true; do date >> /cache/out.txt; sleep 2; done"]
    volumeMounts:
    - name: cache
      mountPath: /cache
  - name: log
    image: busybox:1.36
    command: ["sh","-c","tail -f /cache/out.txt"]
    volumeMounts:
    - name: cache
      mountPath: /cache
~~~

Áp dụng: {{kubectl apply -f t01.yaml}}.

### Vì sao
{{emptyDir}} là ổ đĩa tạm chung cho mọi container trong cùng một Pod; nó sống đúng bằng vòng đời Pod. Container {{app}} ghi, container {{log}} (sidecar) đọc cùng file. Verify chỉ PASS khi cả hai Ready và file có nội dung, tức là volume đã chia sẻ thật.

> Mẹo: sinh YAML nhanh bằng {{kubectl run app --image=busybox:1.36 --dry-run=client -o yaml}} rồi chép thêm container thứ hai và volumeMounts, nhanh hơn viết tay.`,
      refs: [
        { type: 'doc', title: 'Pods: multi-container', url: 'https://kubernetes.io/docs/concepts/workloads/pods/' },
        { type: 'doc', title: 'Volumes: emptyDir', url: 'https://kubernetes.io/docs/concepts/storage/volumes/#emptydir' }
      ],
      tags: ['pod', 'emptyDir', 'sidecar']
    },
    {
      id: 'ckad-1-02', no: 2, domain: 'Design & Build', weight: 6, env: 'kind', minutes: 6,
      title: 'Init container tạo file điều kiện trước khi container chính chạy',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Pod {{t02-pod}} ở namespace {{t02}} có:
- Một {{initContainer}} tên {{init}} (image {{busybox:1.36}}) mount volume {{emptyDir}} tên {{data}} tại {{/data}} và tạo file {{/data/ready.txt}} chứa chữ {{ok}}.
- Một container chính tên {{app}} (image {{busybox:1.36}}) mount cùng volume {{data}} tại {{/data}}, chạy {{sleep 3600}}.

Init container phải kết thúc với exit code 0 trước khi {{app}} khởi động, và file {{/data/ready.txt}} phải đọc được từ trong {{app}}.`,
      setup: `kubectl create namespace t02 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl delete pod t02-pod -n t02 --force --grace-period 0 >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
code=$(kubectl get pod t02-pod -n t02 -o jsonpath='{.status.initContainerStatuses[0].state.terminated.exitCode}' 2>/dev/null)
if [ "$code" = "0" ]; then ok init-done; else bad init-done "exitCode=$code"; fi
data=$(kubectl exec t02-pod -n t02 -c app -- cat /data/ready.txt 2>/dev/null)
if [ "$data" = "ok" ]; then ok init-file; else bad init-file "data=$data"; fi
echo "RESULT $p/$t"`,
      solution: `### Init container chạy trước container chính
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: t02-pod
  namespace: t02
spec:
  volumes:
  - name: data
    emptyDir: {}
  initContainers:
  - name: init
    image: busybox:1.36
    command: ["sh","-c","echo ok > /data/ready.txt"]
    volumeMounts:
    - name: data
      mountPath: /data
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","3600"]
    volumeMounts:
    - name: data
      mountPath: /data
~~~

Áp dụng: {{kubectl apply -f t02.yaml}}.

### Vì sao
{{initContainers}} chạy tuần tự và phải kết thúc thành công (exit 0) thì container chính mới bắt đầu. Chúng lý tưởng cho việc chờ DB, nạp cấu hình, kiểm tra điều kiện. Vì mount cùng {{emptyDir}}, file {{init}} tạo ra đã có sẵn khi {{app}} chạy.

> Mẹo: xem trạng thái init bằng {{kubectl get pod t02-pod -o jsonpath='{.status.initContainerStatuses[0].state}'}}; nếu kẹt ở {{PodInitializing}} thì init chưa xong.`,
      tags: ['init-container', 'emptyDir']
    },
    {
      id: 'ckad-1-03', no: 3, domain: 'Design & Build', weight: 7, env: 'kind', minutes: 7,
      title: 'CronJob chạy định kỳ và tạo được Job thủ công từ template',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo CronJob {{t03-cron}} ở namespace {{t03}}:
- Lịch chạy {{*/2 * * * *}} (cứ 2 phút một lần).
- Mỗi lần chạy tạo một Pod (image {{busybox:1.36}}) in ra ngày giờ hiện tại rồi thoát.
- Đặt {{concurrencyPolicy: Forbid}} để không chạy chồng nếu lần trước chưa xong.

CronJob phải tồn tại với đúng lịch, và khi tạo một Job thủ công từ template của nó thì Job đó phải hoàn thành (complete).`,
      setup: `kubectl create namespace t03 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl delete cronjob t03-cron -n t03 >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
sched=$(kubectl get cronjob t03-cron -n t03 -o jsonpath='{.spec.schedule}' 2>/dev/null)
if [ "$sched" = "*/2 * * * *" ]; then ok schedule; else bad schedule "sched=$sched"; fi
pol=$(kubectl get cronjob t03-cron -n t03 -o jsonpath='{.spec.concurrencyPolicy}' 2>/dev/null)
if [ "$pol" = "Forbid" ]; then ok concurrency; else bad concurrency "pol=$pol"; fi
kubectl create job t03-manual --from=cronjob/t03-cron -n t03 >/dev/null 2>&1
if kubectl wait --for=condition=complete job/t03-manual -n t03 --timeout=60s >/dev/null 2>&1; then ok job-spawned; else bad job-spawned "job khong complete"; fi
echo "RESULT $p/$t"`,
      solution: `### CronJob với lịch và concurrencyPolicy
~~~yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: t03-cron
  namespace: t03
spec:
  schedule: "*/2 * * * *"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: tick
            image: busybox:1.36
            command: ["sh","-c","date; echo tick"]
~~~

Áp dụng: {{kubectl apply -f t03.yaml}}.

### Vì sao
{{CronJob}} tạo {{Job}} theo lịch; {{jobTemplate}} là khuôn để sinh Job. {{concurrencyPolicy: Forbid}} bỏ qua lần chạy mới nếu lần cũ chưa xong, tránh dồn việc. Verify tạo Job thủ công bằng {{kubectl create job t03-manual --from=cronjob/t03-cron}} để kiểm tra template chạy được ngay, không phải đợi 2 phút.

> Mẹo: khi thi, đừng đợi lịch thật; luôn dùng {{--from=cronjob/...}} để kích hoạt một lần cho nhanh.`,
      tags: ['cronjob', 'job', 'schedule']
    },
    {
      id: 'ckad-1-04', no: 4, domain: 'Deployment', weight: 7, env: 'kind', minutes: 7,
      title: 'Rollout Deployment rồi rollback về đúng revision 1',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t04}} đã có sẵn Deployment {{t04-dep}} (một bản chạy tốt, image {{nginx:1.25}}). Một người đã cập nhật image sang bản {{nginx:9.9.9}} không tồn tại, khiến rollout đứng.

Nhiệm vụ: đưa Deployment về đúng revision đầu tiên (image {{nginx:1.25}}) bằng {{kubectl rollout undo}} tới {{--to-revision=1}}. Sau khi xong, Deployment phải có đủ Pod Ready và image là {{nginx:1.25}}.`,
      setup: `kubectl create namespace t04 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t04 delete deploy t04-dep >/dev/null 2>&1 || true
kubectl -n t04 create deployment t04-dep --image=nginx:1.25 >/dev/null
kubectl -n t04 rollout status deploy/t04-dep --timeout=60s >/dev/null 2>&1 || true
kubectl -n t04 set image deploy/t04-dep nginx=nginx:9.9.9 >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
img=$(kubectl get deploy t04-dep -n t04 -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)
if [ "$img" = "nginx:1.25" ]; then ok image; else bad image "img=$img"; fi
ready=$(kubectl get deploy t04-dep -n t04 -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
if [ "$ready" -ge 1 ] 2>/dev/null; then ok ready; else bad ready "ready=$ready"; fi
echo "RESULT $p/$t"`,
      solution: `### Rollback về revision cụ thể
Xem lịch sử: {{kubectl rollout history deploy/t04-dep -n t04}}.
Quay về revision 1: {{kubectl rollout undo deploy/t04-dep -n t04 --to-revision=1}}.
Đợi xong: {{kubectl rollout status deploy/t04-dep -n t04}}.

~~~bash
kubectl rollout history deployment/t04-dep -n t04
kubectl rollout undo deployment/t04-dep -n t04 --to-revision=1
kubectl rollout status deployment/t04-dep -n t04
~~~

### Vì sao
Mỗi lần đổi {{spec.template}} (image, env…) Kubernetes tạo một {{revision}} mới. {{rollout undo --to-revision=1}} đưa template về đúng bản đầu, Deployment tự tạo ReplicaSet cũ và xoá Pod lỗi. Dùng đúng số revision quan trọng hơn {{--to-revision=0}} (về bản liền trước) vì đề yêu cầu đúng revision 1.

> Mẹo: thêm {{--record}} hoặc annotation {{kubernetes.io/change-cause}} khi tạo để {{rollout history}} dễ đọc; bản 1.30 ghi chú tự động qua annotation.`,
      tags: ['deployment', 'rollback', 'revision']
    },
    {
      id: 'ckad-1-05', no: 5, domain: 'Deployment', weight: 7, env: 'kind', minutes: 7,
      title: 'Canary theo tỉ lệ replica với hai Deployment và một Service',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t05}} đã có Deployment {{t05-stable}} (9 replica, image {{nginx:1.25}}, label {{app=t05}}) và Service {{t05-svc}} chọn {{app=t05}} (port 80).

Nhiệm vụ: thêm Deployment canary {{t05-canary}} (1 replica, image {{nginx:1.26}}) có label {{app=t05}} và {{track=canary}} để Service {{t05-svc}} cũng route một phần nhỏ lưu lượng sang bản mới. Kết quả: Service có 10 endpoint (9 stable + 1 canary).`,
      setup: `kubectl create namespace t05 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t05 delete deploy t05-stable t05-canary svc t05-svc >/dev/null 2>&1 || true
kubectl -n t05 create deployment t05-stable --image=nginx:1.25 --replicas=9 >/dev/null
kubectl -n t05 label deploy t05-stable app=t05 >/dev/null
kubectl -n t05 expose deploy t05-stable --name=t05-svc --port=80 >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
rep=$(kubectl get deploy t05-canary -n t05 -o jsonpath='{.spec.replicas}' 2>/dev/null)
if [ "$rep" = "1" ]; then ok canary-replicas; else bad canary-replicas "rep=$rep"; fi
ips=$(kubectl get endpoints t05-svc -n t05 -o jsonpath='{.subsets[0].addresses[*].ip}' 2>/dev/null | wc -w)
if [ "$ips" -ge 10 ] 2>/dev/null; then ok endpoints; else bad endpoints "ips=$ips"; fi
echo "RESULT $p/$t"`,
      solution: `### Canary bằng cách trộn replica
Tạo canary Deployment:
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: t05-canary
  namespace: t05
spec:
  replicas: 1
  selector:
    matchLabels:
      app: t05
      track: canary
  template:
    metadata:
      labels:
        app: t05
        track: canary
    spec:
      containers:
      - name: web
        image: nginx:1.26
~~~

Áp dụng: {{kubectl apply -f t05-canary.yaml}}.

### Vì sao
{{Service}} chọn Pod theo label {{app=t05}}; cả stable (9) và canary (1) đều mang label này nên Service cân bằng theo tỉ lệ số replica: 90/10. Đây là canary thô, không cần công cụ mesh. Verify đếm endpoint của {{t05-svc}} phải bằng 10.

> Mẹo: đổi tỉ lệ chỉ bằng {{kubectl scale deploy/t05-canary --replicas=N}}; không cần sửa Service.`,
      tags: ['canary', 'deployment', 'service']
    },
    {
      id: 'ckad-1-06', no: 6, domain: 'Deployment', weight: 6, env: 'kind', minutes: 6,
      title: 'Helm upgrade một chart local với values ghi đè',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t06}}. Trong {{/opt/ckad/t06-chart}} đã có một chart Helm (tạo bằng {{helm create}}).

Nhiệm vụ: cài/ nâng cấp release tên {{t06-rel}} từ chart {{/opt/ckad/t06-chart}} vào namespace {{t06}}, ghi đè {{replicaCount=2}} bằng {{--set}}. Sau khi xong, Deployment {{t06-rel-t06-chart}} phải có {{spec.replicas}} bằng 2 và release ở trạng thái {{deployed}}.`,
      setup: `kubectl create namespace t06 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
if [ ! -d /opt/ckad/t06-chart ]; then helm create /opt/ckad/t06-chart >/dev/null 2>&1 || true; fi`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
if helm status t06-rel -n t06 >/dev/null 2>&1; then ok release; else bad release "chua co release"; fi
rep=$(kubectl get deploy t06-rel-t06-chart -n t06 -o jsonpath='{.spec.replicas}' 2>/dev/null)
if [ "$rep" = "2" ]; then ok replicas; else bad replicas "rep=$rep"; fi
echo "RESULT $p/$t"`,
      solution: `### Cài release bằng Helm với --set
~~~bash
helm upgrade --install t06-rel /opt/ckad/t06-chart \\
  --namespace t06 --set replicaCount=2
kubectl get deploy -n t06
~~~

Kiểm tra values: {{helm show values /opt/ckad/t06-chart}}. Lịch sử: {{helm history t06-rel -n t06}}.

### Vì sao
{{helm upgrade --install}} vừa cài (nếu chưa có) vừa nâng cấp (nếu đã có), idempotent. {{--set replicaCount=2}} ghi đè giá trị mặc định trong {{values.yaml}} mà không cần sửa file. Tên Deployment sinh ra là {{<release>-<chart>}} nên là {{t06-rel-t06-chart}}.

> Mẹo: dùng {{helm get values t06-rel -n t06}} để xem giá trị đang áp dụng; rollback bằng {{helm rollback t06-rel <revision> -n t06}}.`,
      tags: ['helm', 'upgrade', 'values']
    },
    {
      id: 'ckad-1-07', no: 7, domain: 'Observability & Maintenance', weight: 5, env: 'kind', minutes: 7,
      title: 'Sửa readiness probe trỏ sai đường dẫn khiến Pod không Ready',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t07}} có Deployment {{t07-dep}} (image {{nginx:1.25}}) nhưng readinessProbe đang trỏ vào đường dẫn {{/nope}} nên Pod không bao giờ Ready.

Nhiệm vụ: sửa probe để trỏ đúng đường dẫn {{/}} (nginx trả 200 ở {{/}}). Sau khi sửa, Deployment phải có Pod Ready.`,
      setup: `kubectl create namespace t07 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t07 delete deploy t07-dep >/dev/null 2>&1 || true
cat <<'YAML' | kubectl apply -f - >/dev/null
apiVersion: apps/v1
kind: Deployment
metadata:
  name: t07-dep
  namespace: t07
spec:
  replicas: 1
  selector:
    matchLabels: { app: t07 }
  template:
    metadata:
      labels: { app: t07 }
    spec:
      containers:
      - name: web
        image: nginx:1.25
        readinessProbe:
          httpGet:
            path: /nope
            port: 80
YAML`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
ready=$(kubectl get deploy t07-dep -n t07 -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
if [ "$ready" -ge 1 ] 2>/dev/null; then ok ready; else bad ready "ready=$ready"; fi
path=$(kubectl get deploy t07-dep -n t07 -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}' 2>/dev/null)
if [ "$path" = "/" ]; then ok probe-path; else bad probe-path "path=$path"; fi
echo "RESULT $p/$t"`,
      solution: `### Sửa readiness probe
Sửa deployment trỏ probe về {{/}}:
~~~bash
kubectl edit deploy t07-dep -n t07
# đổi readinessProbe.httpGet.path từ /nope thành /
kubectl rollout status deploy t07-dep -n t07
~~~

Hoặc patch nhanh:
~~~bash
kubectl patch deploy t07-dep -n t07 --type=json \\
  -p='[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/"}]'
~~~

### Vì sao
{{readinessProbe}} quyết định Pod có nhận lưu lượng không; trỏ sai path thì Pod luôn 失败 (not Ready) và Service không route tới. Đổi về {{/}} (nginx trả 200) là đủ. Phân biệt với {{livenessProbe}} (thất bại thì restart) và {{startupProbe}} (chờ khởi động chậm).

> Mẹo: khi Pod không Ready, xem {{kubectl describe pod}} phần Events và {{kubectl logs}} để biết probe fail vì path sai hay app chưa listen.`,
      tags: ['probe', 'readiness', 'troubleshoot']
    },
    {
      id: 'ckad-1-08', no: 8, domain: 'Observability & Maintenance', weight: 5, env: 'kind', minutes: 7,
      title: 'Dùng kubectl debug gắn ephemeral container vào Pod đang chạy',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t08}} có Pod {{t08-pod}} (image {{nginx:1.25}}) đang chạy nhưng không có shell để gỡ lỗi.

Nhiệm vụ: dùng {{kubectl debug}} gắn một {{ephemeral container}} (image {{busybox:1.36}}) vào Pod đang chạy để soi filesystem/tiến trình, không restart Pod. Sau khi xong, Pod phải có ít nhất một ephemeral container.`,
      setup: `kubectl create namespace t08 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t08 delete pod t08-pod >/dev/null 2>&1 || true
kubectl -n t08 run t08-pod --image=nginx:1.25 >/dev/null 2>&1 || true
kubectl -n t08 wait --for=condition=Ready pod/t08-pod --timeout=60s >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
names=$(kubectl get pod t08-pod -n t08 -o jsonpath='{.spec.ephemeralContainers[*].name}' 2>/dev/null)
if [ -n "$names" ]; then ok ephemeral; else bad ephemeral "khong co ephemeral container"; fi
echo "RESULT $p/$t"`,
      solution: `### Gắn ephemeral container bằng kubectl debug
~~~bash
kubectl debug -it t08-pod -n t08 --image=busybox:1.36 --target=web
# trong shell: ps, ls /, cat /etc/os-release ...
~~~

Nếu Pod không có container tên {{web}} thì bỏ {{--target}}; ephemeral container vẫn chạy chung namespaces.

### Vì sao
{{ephemeral container}} (từ 1.25 GA) chèn thêm container vào Pod đang chạy mà không restart, chia sẻ process/filesystem namespace với container đích (khi có {{--target}}). Rất hợp khi Pod {{distroless}} không có shell. Verify kiểm {{.spec.ephemeralContainers}} khác rỗng.

> Mẹo: ephemeral container không thay đổi được sau khi tạo; nếu sai image phải debug lại. Dùng {{kubectl debug node/...}} để mượn namespaces của node khi cần.`,
      tags: ['debug', 'ephemeral-container', 'troubleshoot']
    },
    {
      id: 'ckad-1-09', no: 9, domain: 'Observability & Maintenance', weight: 5, env: 'kind', minutes: 6,
      title: 'Lấy log lần chạy trước của Pod restart liên tục',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t09}} có Pod {{t09-pod}} với container liên tục in {{BOOM}} rồi thoát với mã lỗi, nên restart nhiều lần.

Nhiệm vụ: lấy log của {{lần chạy trước}} (container đã chết) để tìm nguyên nhân. Log lần trước phải chứa chữ {{BOOM}}. Dùng đúng cờ {{--previous}}.`,
      setup: `kubectl create namespace t09 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t09 delete pod t09-pod >/dev/null 2>&1 || true
kubectl -n t09 run t09-pod --image=busybox:1.36 --restart=Always \\
  -- sh -c "echo BOOM; exit 1" >/dev/null 2>&1 || true
sleep 6`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
restarts=$(kubectl get pod t09-pod -n t09 -o jsonpath='{.status.containerStatuses[0].restartCount}' 2>/dev/null)
if [ "$restarts" -ge 1 ] 2>/dev/null; then ok restarted; else bad restarted "restarts=$restarts"; fi
if kubectl logs t09-pod -n t09 --previous 2>/dev/null | grep -q BOOM; then ok previous-log; else bad previous-log "khong thay BOOM trong log truoc"; fi
echo "RESULT $p/$t"`,
      solution: `### Xem log lần chạy trước
~~~bash
kubectl logs t09-pod -n t09 --previous
kubectl logs -f t09-pod -n t09          # theo dõi bản hiện tại
kubectl get pod t09-pod -n t09          # xem RESTARTS
~~~

### Vì sao
Container đã chết thì {{kubectl logs}} mặc định chỉ xem bản đang chạy (có thể rỗng). {{--previous}} (hay {{--previous=true}}) trả log của lần chạy liền trước, nơi chứa {{BOOM}} và nguyên nhân crash. Kết hợp {{restartCount}} để biết mức độ.

> Mẹo: nếu Pod có nhiều container, thêm {{--all-containers=true}} hoặc {{kubectl logs -c <name>}}. Lỗi lặp lại thường do config sai hoặc dependency chưa sẵn sàng.`,
      tags: ['logs', 'previous', 'troubleshoot']
    },
    {
      id: 'ckad-1-10', no: 10, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 7,
      title: 'Mount ConfigMap thành volume trong Pod',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo ConfigMap {{t10-cm}} ở namespace {{t10}} với khóa {{app.properties}} giá trị {{mode=production}}.

Tạo Pod {{t10-pod}} (image {{busybox:1.36}}) mount ConfigMap {{t10-cm}} thành volume tại {{/etc/config}}, chạy {{sleep 3600}}. File {{/etc/config/app.properties}} trong Pod phải chứa đúng {{mode=production}}.`,
      setup: `kubectl create namespace t10 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t10 delete pod t10-pod configmap t10-cm >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
phase=$(kubectl get pod t10-pod -n t10 -o jsonpath='{.status.phase}' 2>/dev/null)
if [ "$phase" = "Running" ]; then ok pod-running; else bad pod-running "phase=$phase"; fi
val=$(kubectl exec t10-pod -n t10 -- cat /etc/config/app.properties 2>/dev/null)
if [ "$val" = "mode=production" ]; then ok config-volume; else bad config-volume "val=$val"; fi
echo "RESULT $p/$t"`,
      solution: `### ConfigMap dạng volume
~~~yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: t10-cm
  namespace: t10
data:
  app.properties: "mode=production"
---
apiVersion: v1
kind: Pod
metadata:
  name: t10-pod
  namespace: t10
spec:
  volumes:
  - name: cfg
    configMap:
      name: t10-cm
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","3600"]
    volumeMounts:
    - name: cfg
      mountPath: /etc/config
~~~

Áp dụng: {{kubectl apply -f t10.yaml}}.

### Vì sao
Mỗi khóa trong {{data}} thành một file dưới {{mountPath}}. ConfigMap mount dạng volume cập nhật động (khi đổi ConfigMap, file đổi sau ~1 phút), khác env (chỉ đọc lúc khởi động). Verify đọc file trong Pod để chắc chắn mount đúng.

> Mẹo: dùng {{kubectl create configmap t10-cm --from-literal=app.properties=mode=production}} để tạo nhanh, đỡ viết YAML.`,
      tags: ['configmap', 'volume']
    },
    {
      id: 'ckad-1-11', no: 11, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 8,
      title: 'Tạo Secret và truyền vào Pod bằng biến môi trường',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Secret {{t11-secret}} ở namespace {{t11}} với khóa {{DB_PASSWORD}} giá trị {{s3cr3t}}.

Tạo Pod {{t11-pod}} (image {{busybox:1.36}}) lấy biến môi trường {{DB_PASSWORD}} từ Secret {{t11-secret}} (dùng {{env.valueFrom.secretKeyRef}}), chạy {{sleep 3600}}. Biến {{DB_PASSWORD}} trong Pod phải bằng {{s3cr3t}}.`,
      setup: `kubectl create namespace t11 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t11 delete pod t11-pod secret t11-secret >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
val=$(kubectl exec t11-pod -n t11 -- printenv DB_PASSWORD 2>/dev/null)
if [ "$val" = "s3cr3t" ]; then ok secret-env; else bad secret-env "val=$val"; fi
echo "RESULT $p/$t"`,
      solution: `### Secret truyền qua env
Tạo Secret:
~~~bash
kubectl create secret generic t11-secret \\
  --from-literal=DB_PASSWORD=s3cr3t -n t11
~~~
Pod:
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: t11-pod
  namespace: t11
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","3600"]
    env:
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: t11-secret
          key: DB_PASSWORD
~~~
Áp dụng: {{kubectl apply -f t11.yaml}}.

### Vì sao
{{secretKeyRef}} đọc một khóa của Secret thành biến môi trường lúc Pod khởi động. Secret chỉ là base64 (không mã hoá), nên cần {{etcd encryption}} + RBAC chặt; không commit Secret vào git. Verify dùng {{printenv}} để chắc chắn giá trị đúng.

> Mẹo: {{kubectl create secret}} nhanh hơn viết tay; xem giá trị (debug) bằng {{kubectl get secret t11-secret -o jsonpath='{.data.DB_PASSWORD}' | base64 -d}}.`,
      tags: ['secret', 'env', 'security']
    },
    {
      id: 'ckad-1-12', no: 12, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 7,
      title: 'SecurityContext: chạy non-root và filesystem chỉ đọc',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Pod {{t12-pod}} ở namespace {{t12}} (image {{busybox:1.36}}, chạy {{sleep 3600}}) với {{securityContext}}:
- {{runAsNonRoot: true}} và {{runAsUser: 1000}}.
- {{readOnlyRootFilesystem: true}}.

Trong Pod, {{id -u}} phải trả về 1000 và không được ghi được vào {{/}} (filesystem chỉ đọc).`,
      setup: `kubectl create namespace t12 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t12 delete pod t12-pod >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
uid=$(kubectl exec t12-pod -n t12 -- id -u 2>/dev/null)
if [ "$uid" = "1000" ]; then ok uid; else bad uid "uid=$uid"; fi
if kubectl exec t12-pod -n t12 -- sh -c 'touch /x' >/dev/null 2>&1; then bad readonly "ghi duoc vao /"; else ok readonly; fi
echo "RESULT $p/$t"`,
      solution: `### Pod với SecurityContext siết chặt
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: t12-pod
  namespace: t12
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    readOnlyRootFilesystem: true
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","3600"]
~~~

Áp dụng: {{kubectl apply -f t12.yaml}}.

### Vì sao
{{runAsNonRoot}} + {{runAsUser: 1000}} buộc container chạy bằng UID thường, tránh leo thang root. {{readOnlyRootFilesystem}} chặn ghi vào {{/}}; app cần ghi thì mount {{emptyDir}} riêng. Verify kiểm {{id -u}} và thử {{touch /x}} phải thất bại.

> Mẹo: bổ sung {{allowPrivilegeEscalation: false}}, {{capabilities.drop: ["ALL"]}} để đạt baseline CIS; dùng {{kubectl get pod -o yaml}} để soi {{securityContext}} hiệu lực.`,
      tags: ['securitycontext', 'security', 'non-root']
    },
    {
      id: 'ckad-1-13', no: 13, domain: 'Environment, Config & Security', weight: 7, env: 'kind', minutes: 7,
      title: 'ResourceQuota chặn Pod đòi tài nguyên quá hạn mức',
      task: `Context: {{kubectl config use-context kind-ckad}}

Tạo ResourceQuota {{t13-quota}} ở namespace {{t13}} giới hạn {{requests.cpu: "1"}} và {{requests.memory: 1Gi}}.

Sau đó tạo một Pod {{t13-fit}} (image {{busybox:1.36}}) chỉ xin {{requests cpu 100m, memory 64Mi}} — Pod này phải chạy được. Đồng thời chứng minh Pod {{t13-big}} xin {{requests cpu 2}} sẽ bị {{từ chối}} (không tạo được) vì vượt hạn mức.`,
      setup: `kubectl create namespace t13 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t13 delete pod t13-fit t13-big resourcequota t13-quota >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
if kubectl get resourcequota t13-quota -n t13 >/dev/null 2>&1; then ok quota; else bad quota "chua co quota"; fi
kubectl apply -f - >/dev/null 2>&1 <<'YAML'
apiVersion: v1
kind: Pod
metadata: { name: t13-fit, namespace: t13 }
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","300"]
    resources:
      requests: { cpu: "100m", memory: "64Mi" }
YAML
if kubectl wait --for=condition=Ready pod/t13-fit -n t13 --timeout=60s >/dev/null 2>&1; then ok fit-pod; else bad fit-pod "pod vua khong Ready"; fi
if kubectl apply -f - >/dev/null 2>&1 <<'YAML'
apiVersion: v1
kind: Pod
metadata: { name: t13-big, namespace: t13 }
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ["sleep","300"]
    resources:
      requests: { cpu: "2", memory: "64Mi" }
YAML
then bad quota-block "pod lon van tao duoc"; else ok quota-block; fi
echo "RESULT $p/$t"`,
      solution: `### ResourceQuota chặn tài nguyên
~~~yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: t13-quota
  namespace: t13
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 1Gi
    limits.cpu: "2"
    limits.memory: 2Gi
~~~
Áp dụng: {{kubectl apply -f t13-quota.yaml}}.

Pod vừa hạn mức {{t13-fit}} xin {{requests cpu 100m}} chạy bình thường; Pod {{t13-big}} xin {{cpu 2}} vượt {{requests.cpu: "1"}} nên API server từ chối. Đây là cách namespace được bảo vệ khỏi Pod ngốn tài nguyên.

### Vì sao
{{ResourceQuota}} chặn ở tầng admission khi tạo Pod, không phải lúc chạy. Nếu namespace đã có Pod tồn tại trước quota, phải đảm bảo tổng {{requests}} còn dưới {{hard}}. Verify tạo Pod nhỏ (chạy) và Pod lớn (bị chặn) để kiểm hành vi.

> Mẹo: kết hợp {{LimitRange}} để đặt mặc định {{requests/limits}} cho container thiếu khai báo; nếu không, Pod không khai báo requests vẫn qua được quota.`,
      tags: ['resourcequota', 'resources', 'policy']
    },
    {
      id: 'ckad-1-14', no: 14, domain: 'Services & Networking', weight: 5, env: 'kind', minutes: 7,
      title: 'Sửa selector sai của Service để có endpoint',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t14}} có Deployment {{t14-dep}} (2 replica, Pod label {{app=t14}}) và Service {{t14-svc}} nhưng selector đang là {{app=wrong}} nên {{Endpoints}} rỗng.

Nhiệm vụ: sửa selector của {{t14-svc}} thành {{app=t14}}. Sau khi sửa, Endpoints của {{t14-svc}} phải có 2 địa chỉ.`,
      setup: `kubectl create namespace t14 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t14 delete deploy t14-dep svc t14-svc >/dev/null 2>&1 || true
kubectl -n t14 create deployment t14-dep --image=nginx:1.25 --replicas=2 >/dev/null
kubectl -n t14 expose deploy t14-dep --name=t14-svc --port=80 >/dev/null 2>&1 || true
kubectl -n t14 patch svc t14-svc --type=merge -p '{"spec":{"selector":{"app":"wrong"}}}' >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
ips=$(kubectl get endpoints t14-svc -n t14 -o jsonpath='{.subsets[0].addresses[*].ip}' 2>/dev/null | wc -w)
if [ "$ips" -ge 2 ] 2>/dev/null; then ok endpoints; else bad endpoints "ips=$ips"; fi
echo "RESULT $p/$t"`,
      solution: `### Sửa selector Service
~~~bash
kubectl patch svc t14-svc -n t14 --type=merge \\
  -p '{"spec":{"selector":{"app":"t14"}}}'
kubectl get endpoints t14-svc -n t14
~~~

### Vì sao
{{Service}} tìm Pod qua {{selector}} trùng {{labels}}; sai selector thì Endpoints rỗng và request bị trả về rỗng. Verify đếm số địa chỉ trong {{.subsets[0].addresses}}. Đây là lỗi cấu hình rất hay gặp khi label Pod và selector lệch nhau.

> Mẹo: {{kubectl get pod --show-labels}} để đối chiếu label; {{kubectl describe svc}} phần {{Endpoints}} cho biết ngay selector có khớp không.`,
      tags: ['service', 'selector', 'endpoints', 'troubleshoot']
    },
    {
      id: 'ckad-1-15', no: 15, domain: 'Services & Networking', weight: 5, env: 'kind', minutes: 7,
      title: 'Ingress định tuyến theo path tới Service',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t15}} có Service {{t15-svc}} (port 80). Cài ingress-nginx nếu chưa có.

Nhiệm vụ: tạo Ingress {{t15-ing}} (apiVersion {{networking.k8s.io/v1}}) với host {{example.com}}, path {{/foo}}, {{pathType: Prefix}}, chuyển tiếp tới Service {{t15-svc}} port {{80}}.`,
      setup: `kubectl create namespace t15 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t15 delete ingress t15-ing >/dev/null 2>&1 || true
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/kind/deploy.yaml >/dev/null 2>&1 || true`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
path=$(kubectl get ingress t15-ing -n t15 -o jsonpath='{.spec.rules[0].http.paths[0].path}' 2>/dev/null)
if [ "$path" = "/foo" ]; then ok path; else bad path "path=$path"; fi
pt=$(kubectl get ingress t15-ing -n t15 -o jsonpath='{.spec.rules[0].http.paths[0].pathType}' 2>/dev/null)
if [ "$pt" = "Prefix" ]; then ok path-type; else bad path-type "pt=$pt"; fi
svc=$(kubectl get ingress t15-ing -n t15 -o jsonpath='{.spec.rules[0].http.paths[0].backend.service.name}' 2>/dev/null)
if [ "$svc" = "t15-svc" ]; then ok backend; else bad backend "svc=$svc"; fi
echo "RESULT $p/$t"`,
      solution: `### Ingress networking.k8s.io/v1
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: t15-ing
  namespace: t15
spec:
  rules:
  - host: example.com
    http:
      paths:
      - path: /foo
        pathType: Prefix
        backend:
          service:
            name: t15-svc
            port:
              number: 80
~~~
Áp dụng: {{kubectl apply -f t15.yaml}}.

### Vì sao
{{Ingress}} gom nhiều Service sau một entrypoint (ingress-nginx), định tuyến theo {{host}} + {{path}}. {{pathType: Prefix}} khớp mọi path bắt đầu bằng {{/foo}}. Backend trỏ {{service.name}} + {{port.number}} (không phải targetPort). Verify kiểm đúng path, pathType và backend.

> Mẹo: kiểm Ingress bằng {{kubectl describe ingress}} phần {{Rules}}; với kind, vào bằng {{curl -H "Host: example.com" http://localhost/foo}}.`,
      tags: ['ingress', 'networking', 'routing']
    },
    {
      id: 'ckad-1-16', no: 16, domain: 'Services & Networking', weight: 5, env: 'kind', minutes: 8,
      title: 'NetworkPolicy: mặc định chặn, chỉ cho frontend truy cập backend',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t16}} có Pod {{t16-be}} (nginx, label {{app=backend}}), Pod {{t16-fe}} (busybox, label {{role=frontend}}) và Pod {{t16-other}} (busybox, không label). Cài Calico để NetworkPolicy có hiệu lực.

Nhiệm vụ: tạo NetworkPolicy {{t16-deny}} (mặc định chặn toàn bộ vào {{t16-be}}) và {{t16-allow}} (chỉ cho Pod có {{role=frontend}} truy cập {{t16-be}} port 80). Sau đó {{t16-fe}} phải curl được {{t16-be}}, còn {{t16-other}} phải bị chặn.`,
      setup: `kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml >/dev/null 2>&1 || true
kubectl create namespace t16 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t16 delete pod t16-be t16-fe t16-other netpol t16-deny t16-allow >/dev/null 2>&1 || true
kubectl -n t16 run t16-be --image=nginx:1.25 --labels app=backend >/dev/null 2>&1 || true
kubectl -n t16 run t16-fe --image=busybox:1.36 --labels role=frontend -- sleep 3600 >/dev/null 2>&1 || true
kubectl -n t16 run t16-other --image=busybox:1.36 -- sleep 3600 >/dev/null 2>&1 || true
sleep 5`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
if kubectl get netpol t16-allow -n t16 >/dev/null 2>&1; then ok allow-netpol; else bad allow-netpol "thieu t16-allow"; fi
if kubectl exec t16-fe -n t16 -- wget -qO- --timeout=3 t16-be >/dev/null 2>&1; then ok fe-to-be; else bad fe-to-be "frontend khong truy cap duoc"; fi
if kubectl exec t16-other -n t16 -- wget -qO- --timeout=3 t16-be >/dev/null 2>&1; then bad deny "other van truy cap duoc"; else ok deny; fi
echo "RESULT $p/$t"`,
      solution: `### Hai NetworkPolicy: default deny + allow
~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: t16-deny
  namespace: t16
spec:
  podSelector:
    matchLabels: { app: backend }
  policyTypes: [Ingress]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: t16-allow
  namespace: t16
spec:
  podSelector:
    matchLabels: { app: backend }
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector:
        matchLabels: { role: frontend }
    ports:
    - protocol: TCP
      port: 80
~~~
Áp dụng: {{kubectl apply -f t16.yaml}}.

### Vì sao
NetworkPolicy mặc định {{allow all}}; khi có policy {{Ingress}} chọn {{app=backend}} thì chỉ lưu lượng khớp {{from}} mới vào. {{t16-allow}} mở cho {{role=frontend}} port 80; {{t16-other}} không khớp nên bị chặn. Verify curl từ hai Pod để kiểm hành vi thật (cần Calico, CNI mặc định của kind không thực thi policy).

> Mẹo: thêm egress policy cho phép DNS (kube-dns, port 53) nếu Pod cần phân giải tên; nếu không sẽ chặn cả DNS.`,
      tags: ['networkpolicy', 'security', 'calico']
    },
    {
      id: 'ckad-1-17', no: 17, domain: 'Services & Networking', weight: 5, env: 'kind', minutes: 7,
      title: 'Service NodePort cho Deployment và kiểm tra endpoint',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{t17}} có Deployment {{t17-dep}} (2 replica, image {{nginx:1.25}}).

Nhiệm vụ: tạo Service {{t17-svc}} kiểu {{NodePort}} (port 80) chọn {{app=t17}}. Service phải có {{nodePort}} được cấp và Endpoints gồm 2 địa chỉ.`,
      setup: `kubectl create namespace t17 --dry-run=client -o yaml | kubectl apply -f - >/dev/null
kubectl -n t17 delete deploy t17-dep svc t17-svc >/dev/null 2>&1 || true
kubectl -n t17 create deployment t17-dep --image=nginx:1.25 --replicas=2 >/dev/null`,
      verify: `p=0; t=0
ok(){ t=$((t+1)); p=$((p+1)); echo "PASS $1"; }
bad(){ t=$((t+1)); echo "FAIL $1: $2"; }
typ=$(kubectl get svc t17-svc -n t17 -o jsonpath='{.spec.type}' 2>/dev/null)
if [ "$typ" = "NodePort" ]; then ok type; else bad type "typ=$typ"; fi
np=$(kubectl get svc t17-svc -n t17 -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null)
if [ -n "$np" ]; then ok nodeport; else bad nodeport "khong co nodePort"; fi
ips=$(kubectl get endpoints t17-svc -n t17 -o jsonpath='{.subsets[0].addresses[*].ip}' 2>/dev/null | wc -w)
if [ "$ips" -ge 2 ] 2>/dev/null; then ok endpoints; else bad endpoints "ips=$ips"; fi
echo "RESULT $p/$t"`,
      solution: `### Service NodePort
~~~yaml
apiVersion: v1
kind: Service
metadata:
  name: t17-svc
  namespace: t17
spec:
  type: NodePort
  selector:
    app: t17
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
~~~
Áp dụng: {{kubectl apply -f t17.yaml}}.

### Vì sao
{{NodePort}} mở một cổng (30000–32767) trên mọi node, forward tới Pod qua {{selector}}. {{port}} là cổng trong cluster, {{targetPort}} là cổng container, {{nodePort}} là cổng ngoài. Verify kiểm {{type}}, {{nodePort}} và số endpoint bằng số replica.

> Mẹo: truy cập bằng {{curl http://<node-ip>:30080}} (với kind là {{localhost:30080}}); nếu không có endpoint thì kiểm {{kubectl get pod --show-labels}} so với selector.`,
      tags: ['service', 'nodeport', 'networking']
    }
  ]
});