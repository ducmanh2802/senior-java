/* CKAD labs part 2 (docs/CKAD-MOCK.md): modules 5–8 — Deployment rollout, blue-green/canary, Helm/Kustomize, probes/observability. */
(window.CKAD_LABS = window.CKAD_LABS || []).push(
// ============================================================ MODULE 5
{
  id: 'ckad-lab-05', order: 5,
  title: 'Deployment: rolling update, rollout và rollback',
  summary: 'Điều khiển vòng đời Deployment như trong đề CKAD: maxSurge/maxUnavailable, set image, change-cause, rollout status/history/undo --to-revision, pause/resume, Recreate và xử lý rollout bị kẹt.',
  concepts: `### Deployment hoạt động thế nào
Deployment không tự chạy Pod: nó quản lý **ReplicaSet**. Mỗi lần **pod template** ({{spec.template}}) đổi (image, env, probe, resources…), controller tạo một ReplicaSet mới (một **revision** mới) rồi tăng dần ReplicaSet mới, giảm dần ReplicaSet cũ. Đổi {{replicas}} **không** tạo revision vì template không đổi. ReplicaSet cũ được giữ lại (scale về 0) để rollback, số lượng giữ lại do {{revisionHistoryLimit}} quyết định (mặc định 10).

### Rolling update: maxSurge và maxUnavailable
- {{maxSurge}}: được tạo **thêm** bao nhiêu Pod vượt {{replicas}} trong lúc update (mặc định 25%, làm tròn lên).
- {{maxUnavailable}}: được phép **thiếu** bao nhiêu Pod Ready so với {{replicas}} (mặc định 25%, làm tròn xuống).
- {{maxSurge: 1, maxUnavailable: 0}} là cấu hình "không bao giờ giảm capacity": phù hợp API production. Nếu Pod mới không bao giờ Ready, Pod cũ vẫn phục vụ, rollout chỉ đứng yên.
- {{Recreate}}: xoá hết Pod cũ rồi mới tạo Pod mới (có downtime), dùng khi app không chạy được hai phiên bản cùng lúc (schema DB, lock file). Đổi sang Recreate phải xoá {{rollingUpdate}} ({{"rollingUpdate": null}}), nếu không API server từ chối.

### change-cause và revision
{{kubectl rollout history}} lấy cột CHANGE-CAUSE từ annotation {{kubernetes.io/change-cause}} của ReplicaSet. Cờ {{--record}} đã bị loại bỏ, nên cách đúng là {{kubectl annotate}} lên Deployment ngay sau khi đổi template: controller chép annotation sang ReplicaSet mới nhất. Số revision hiện tại nằm ở annotation {{deployment.kubernetes.io/revision}}. Khi {{rollout undo --to-revision=1}}, revision 1 được "đánh số lại" thành revision mới nhất (không còn số 1 trong history).

### Rollout bị kẹt
{{progressDeadlineSeconds}} (mặc định 600) quy định bao lâu không có tiến triển thì condition {{Progressing}} chuyển {{status=False, reason=ProgressDeadlineExceeded}}. Kubernetes **không tự rollback**: bạn phải undo hoặc sửa tiến (fix forward). {{kubectl rollout status}} trả exit code khác 0 khi vượt deadline, rất tiện trong CI.

### Cheat sheet
~~~bash
kubectl create deploy web --image=nginx:1.25-alpine --replicas=3 --dry-run=client -o yaml > web.yaml
kubectl set image deploy/web nginx=nginx:1.26-alpine          # <container>=<image>
kubectl annotate deploy/web kubernetes.io/change-cause="upgrade 1.26" --overwrite
kubectl rollout status deploy/web --timeout=90s
kubectl rollout history deploy/web                            # liệt kê revision + change-cause
kubectl rollout history deploy/web --revision=2               # xem template của revision 2
kubectl rollout undo deploy/web                               # về revision liền trước
kubectl rollout undo deploy/web --to-revision=1
kubectl rollout pause deploy/web   # gom nhiều thay đổi
kubectl set resources deploy/web -c nginx --requests=cpu=50m,memory=64Mi
kubectl rollout resume deploy/web  # chỉ 1 revision mới
kubectl get deploy web -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}'
~~~

### Bẫy hay gặp trong đề
- {{kubectl set image}} cần **tên container**, không phải tên Deployment. Deployment tạo bằng {{kubectl create deploy --image=nginx:...}} có container tên {{nginx}}.
- Đề bảo "rollback về bản có change-cause X": xem history trước, đừng gõ {{undo}} mù (undo chỉ về revision liền trước).
- Đang pause mà quên {{resume}}: Deployment không bao giờ rollout, verify fail.
- {{spec.selector}} của Deployment **immutable**: muốn đổi label selector phải xoá và tạo lại.`,
  videos: [
    { title: 'Day 8/40 - Kubernetes Deployment, Replication Controller and ReplicaSet Explained', url: 'https://www.youtube.com/watch?v=oe2zjRb51F0', note: 'Xem phần Deployment và ReplicaSet: hiểu vì sao mỗi lần đổi template sinh ReplicaSet mới, nền tảng cho rollout/undo.' },
    { title: 'Blue-Green vs Canary vs Rolling Deploy Explained', url: 'https://www.youtube.com/watch?v=Kmi4VfxRsvw', note: 'Xem phần rolling deploy để nắm trade-off so với blue-green/canary trước khi làm bài maxSurge/maxUnavailable.' }
  ],
  tasks: [
    {
      id: 'ckad-lab-05-01', no: 1, domain: 'Deployment', level: 'easy', env: 'kind', minutes: 5,
      title: 'Tạo Deployment với chiến lược rolling update không giảm capacity',
      task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab05}}, tạo Deployment {{web}}:
- image {{nginx:1.25-alpine}}, container tên {{nginx}}, {{3}} replicas;
- chiến lược {{RollingUpdate}} với {{maxSurge: 1}} và {{maxUnavailable: 0}} (không bao giờ thiếu Pod Ready khi update);
- {{revisionHistoryLimit: 5}}.

Cả 3 Pod phải ở trạng thái Ready.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab05 delete deploy web --ignore-not-found
mkdir -p /opt/ckad 2>/dev/null || true`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/web --timeout=60s >/dev/null 2>&1
chk image "$(j deploy web '{.spec.template.spec.containers[0].image}')" "nginx:1.25-alpine"
chk container-name "$(j deploy web '{.spec.template.spec.containers[0].name}')" "nginx"
chk ready-3 "$(j deploy web '{.status.readyReplicas}')" "3"
chk maxSurge "$(j deploy web '{.spec.strategy.rollingUpdate.maxSurge}')" "1"
chk maxUnavailable "$(j deploy web '{.spec.strategy.rollingUpdate.maxUnavailable}')" "0"
chk revisionHistoryLimit "$(j deploy web '{.spec.revisionHistoryLimit}')" "5"
echo "RESULT $P/$T"`,
      solution: `Sinh YAML bằng lệnh imperative rồi chỉ sửa phần strategy, nhanh hơn gõ tay cả file:
~~~bash
kubectl -n lab05 create deploy web --image=nginx:1.25-alpine --replicas=3 --dry-run=client -o yaml > web.yaml
~~~
Sửa {{spec}} trong {{web.yaml}}:
~~~yaml
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
~~~
~~~bash
kubectl apply -f web.yaml
kubectl -n lab05 rollout status deploy/web
~~~
**Vì sao:** {{maxUnavailable: 0}} buộc controller chỉ xoá Pod cũ khi Pod mới đã Ready, {{maxSurge: 1}} cho phép tạo thêm đúng 1 Pod tạm thời, nên capacity không bao giờ dưới 3. Đổi lại rollout chậm hơn (từng Pod một) và cần dư tài nguyên cho 1 Pod.

**Mẹo tiết kiệm thời gian:** nếu Deployment đã tồn tại, dùng patch thay vì mở editor:
~~~bash
kubectl -n lab05 patch deploy web -p '{"spec":{"revisionHistoryLimit":5,"strategy":{"rollingUpdate":{"maxSurge":1,"maxUnavailable":0}}}}'
~~~
Gõ {{kubectl explain deploy.spec.strategy.rollingUpdate}} nếu quên tên field.`,
      hints: ['Dùng kubectl create deploy ... --dry-run=client -o yaml để có khung YAML.', 'Các field nằm ở spec.strategy.rollingUpdate và spec.revisionHistoryLimit.'],
      refs: [{ type: 'doc', title: 'Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' }],
      tags: ['deployment', 'rolling-update', 'maxSurge']
    },
    {
      id: 'ckad-lab-05-02', no: 2, domain: 'Deployment', level: 'easy', env: 'kind', minutes: 5,
      title: 'Nâng image, ghi change-cause và đọc revision hiện tại',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab05}} có Deployment {{api}} (container {{api}}, image {{nginx:1.25-alpine}}).
1. Nâng image của container {{api}} lên {{nginx:1.26-alpine}}.
2. Ghi lý do thay đổi để {{kubectl rollout history}} hiển thị đúng chuỗi {{upgrade to 1.26}} trong cột CHANGE-CAUSE.
3. Chờ rollout hoàn tất, rồi ghi **số revision hiện tại** của Deployment (chỉ một con số) vào file {{/opt/ckad/lab05-02.txt}}.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab05-02.txt
kubectl -n lab05 delete deploy api --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: lab05
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
EOF
kubectl -n lab05 rollout status deploy/api --timeout=120s`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/api --timeout=60s >/dev/null 2>&1
chk image "$(j deploy api '{.spec.template.spec.containers[0].image}')" "nginx:1.26-alpine"
chk ready "$(j deploy api '{.status.updatedReplicas}/{.status.readyReplicas}')" "2/2"
if kubectl -n $NS rollout history deploy/api 2>/dev/null | grep -q "upgrade to 1.26"; then ok change-cause; else no change-cause "rollout history không có 'upgrade to 1.26'"; fi
REV=$(j deploy api '{.metadata.annotations.deployment\\.kubernetes\\.io/revision}')
chk revision-file "$(tr -d '[:space:]' < /opt/ckad/lab05-02.txt 2>/dev/null)" "$REV"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab05 set image deploy/api api=nginx:1.26-alpine
kubectl -n lab05 annotate deploy/api kubernetes.io/change-cause="upgrade to 1.26" --overwrite
kubectl -n lab05 rollout status deploy/api
kubectl -n lab05 rollout history deploy/api
kubectl -n lab05 get deploy api -o jsonpath='{.metadata.annotations.deployment\\.kubernetes\\.io/revision}' > /opt/ckad/lab05-02.txt
cat /opt/ckad/lab05-02.txt   # 2
~~~
**Vì sao:** cột CHANGE-CAUSE đọc annotation {{kubernetes.io/change-cause}} trên ReplicaSet; controller chép annotation của Deployment sang ReplicaSet mới nhất nên annotate ngay sau {{set image}} là đủ. Cờ {{--record}} đã bị loại bỏ, đừng dựa vào nó. Revision nằm trong annotation {{deployment.kubernetes.io/revision}}; trong jsonpath phải escape dấu chấm bằng {{\\.}}.

**Mẹo tiết kiệm thời gian:** không cần jsonpath, dòng cuối của {{kubectl rollout history}} chính là revision hiện tại: {{kubectl -n lab05 rollout history deploy/api | tail -2}}. Luôn ghi file bằng lệnh redirect thay vì mở editor để tránh thừa khoảng trắng.`,
      hints: ['kubectl set image deploy/<tên> <container>=<image>', 'Annotation kubernetes.io/change-cause, thêm --overwrite nếu đã có.'],
      tags: ['set-image', 'change-cause', 'rollout-history']
    },
    {
      id: 'ckad-lab-05-03', no: 3, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 7,
      title: 'Rollback về đúng revision ổn định bằng --to-revision',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{shop}} trong namespace {{lab05}} vừa được cập nhật lên một image hỏng, một phần Pod đang lỗi kéo image. Đội vận hành yêu cầu quay về đúng phiên bản có change-cause {{release v1 stable}} (không phải phiên bản liền trước).
1. Tìm số revision có change-cause {{release v1 stable}} và ghi số đó (chỉ một con số, trước khi rollback) vào {{/opt/ckad/lab05-03.txt}}.
2. Rollback Deployment {{shop}} về revision đó.
3. Rollout phải hoàn tất: cả 4 Pod Ready, không còn Pod lỗi image.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab05-03.txt
kubectl -n lab05 delete deploy shop --ignore-not-found --wait=true
kubectl -n lab05 create deploy shop --image=nginx:1.25-alpine --replicas=4
kubectl -n lab05 annotate deploy/shop kubernetes.io/change-cause="release v1 stable" --overwrite
kubectl -n lab05 rollout status deploy/shop --timeout=120s
kubectl -n lab05 set image deploy/shop nginx=nginx:1.26-alpine
kubectl -n lab05 annotate deploy/shop kubernetes.io/change-cause="release v2 cache tuning" --overwrite
kubectl -n lab05 rollout status deploy/shop --timeout=120s
kubectl -n lab05 set image deploy/shop nginx=nginx:0.0.0-notfound
kubectl -n lab05 annotate deploy/shop kubernetes.io/change-cause="release v3 new base image" --overwrite
sleep 3
kubectl -n lab05 rollout history deploy/shop`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/shop --timeout=60s >/dev/null 2>&1
chk revision-file "$(tr -d '[:space:]' < /opt/ckad/lab05-03.txt 2>/dev/null)" "1"
chk image-v1 "$(j deploy shop '{.spec.template.spec.containers[0].image}')" "nginx:1.25-alpine"
chk rollout-complete "$(j deploy shop '{.status.updatedReplicas}/{.status.readyReplicas}/{.status.replicas}')" "4/4/4"
BAD=$(kubectl -n $NS get pods -l app=shop -o jsonpath='{range .items[*]}{.status.containerStatuses[0].state.waiting.reason}{"\\n"}{end}' 2>/dev/null | grep -c Err)
chk no-image-errors "$BAD" "0"
echo "RESULT $P/$T"`,
      solution: `Đọc history trước, đừng undo mù:
~~~bash
kubectl -n lab05 rollout history deploy/shop
# REVISION  CHANGE-CAUSE
# 1         release v1 stable
# 2         release v2 cache tuning
# 3         release v3 new base image
echo 1 > /opt/ckad/lab05-03.txt
kubectl -n lab05 rollout history deploy/shop --revision=1   # kiểm tra image nginx:1.25-alpine
kubectl -n lab05 rollout undo deploy/shop --to-revision=1
kubectl -n lab05 rollout status deploy/shop
~~~
**Vì sao:** {{rollout undo}} không có {{--to-revision}} chỉ quay về revision liền trước (v2), sai yêu cầu. Với {{--to-revision=1}}, controller lấy pod template của ReplicaSet revision 1, scale nó lên lại và đánh số nó thành revision 4; ReplicaSet hỏng (revision 3) bị scale về 0 nên Pod lỗi image biến mất. Trong lúc v3 kẹt, nhờ {{maxUnavailable}} mặc định 25% nên vẫn còn 3 Pod cũ phục vụ, đây là lý do rolling update an toàn hơn Recreate.

**Mẹo tiết kiệm thời gian:** {{kubectl rollout history deploy/shop --revision=N}} in đúng pod template của revision đó, xác nhận image trước khi undo mất 5 giây nhưng tránh rollback nhầm. Sau khi rollback, revision số 1 không còn trong history, nên luôn ghi file **trước** khi undo.`,
      hints: ['kubectl rollout history liệt kê CHANGE-CAUSE của từng revision.', 'rollout undo mặc định chỉ lùi 1 bước; cần --to-revision.'],
      tags: ['rollout-undo', 'to-revision']
    },
    {
      id: 'ckad-lab-05-04', no: 4, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 6,
      title: 'Gom nhiều thay đổi vào một revision bằng pause/resume',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{catalog}} trong namespace {{lab05}} (container {{nginx}}) đang ở revision 1. Cần áp dụng **hai** thay đổi nhưng chỉ được sinh ra **đúng một** revision mới (revision 2):
- image {{nginx:1.27-alpine}};
- requests của container {{nginx}}: {{cpu=50m}}, {{memory=64Mi}}.

Kết thúc: Deployment không còn ở trạng thái paused, rollout hoàn tất với 2 Pod Ready.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab05 delete deploy catalog --ignore-not-found --wait=true
kubectl -n lab05 create deploy catalog --image=nginx:1.25-alpine --replicas=2
kubectl -n lab05 rollout status deploy/catalog --timeout=120s`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/catalog --timeout=60s >/dev/null 2>&1
chk image "$(j deploy catalog '{.spec.template.spec.containers[0].image}')" "nginx:1.27-alpine"
chk requests "$(j deploy catalog '{.spec.template.spec.containers[0].resources.requests.cpu}/{.spec.template.spec.containers[0].resources.requests.memory}')" "50m/64Mi"
PAUSED=$(j deploy catalog '{.spec.paused}')
if [ "$PAUSED" != "true" ]; then ok not-paused; else no not-paused "Deployment vẫn paused"; fi
chk single-new-revision "$(j deploy catalog '{.metadata.annotations.deployment\\.kubernetes\\.io/revision}')" "2"
chk ready "$(j deploy catalog '{.status.updatedReplicas}/{.status.readyReplicas}')" "2/2"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab05 rollout pause deploy/catalog
kubectl -n lab05 set image deploy/catalog nginx=nginx:1.27-alpine
kubectl -n lab05 set resources deploy/catalog -c nginx --requests=cpu=50m,memory=64Mi
kubectl -n lab05 rollout resume deploy/catalog
kubectl -n lab05 rollout status deploy/catalog
kubectl -n lab05 rollout history deploy/catalog   # chỉ có 1 và 2
~~~
**Vì sao:** khi {{spec.paused: true}}, controller vẫn ghi nhận thay đổi template nhưng **không** tạo ReplicaSet mới. Lúc resume, nó so sánh template cuối cùng với ReplicaSet hiện tại và tạo đúng một ReplicaSet (một revision) chứa cả hai thay đổi. Không pause thì mỗi lệnh {{set}} sinh một revision, Pod bị thay hai lần, và revision sẽ là 3.

**Mẹo tiết kiệm thời gian:** cách khác là sửa cả hai chỗ trong một lần {{kubectl edit}} hoặc một file {{apply}}, cũng chỉ tạo 1 revision. Nhưng đề yêu cầu dùng lệnh imperative thì pause/resume là nhanh nhất. Lỡ chạy sai, chạy lại setup để làm lại từ revision 1.`,
      hints: ['kubectl rollout pause / resume', 'kubectl set resources deploy/<tên> -c <container> --requests=cpu=...,memory=...'],
      tags: ['rollout-pause', 'set-resources']
    },
    {
      id: 'ckad-lab-05-05', no: 5, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 6,
      title: 'Chuyển Deployment sang chiến lược Recreate',
      task: `Context: {{kubectl config use-context kind-ckad}}

Ứng dụng {{legacy}} (namespace {{lab05}}, container {{nginx}}) giữ file lock trên volume nên không được phép chạy hai phiên bản cùng lúc.
1. Đổi chiến lược của Deployment {{legacy}} thành {{Recreate}}.
2. Đặt {{minReadySeconds: 5}}.
3. Nâng image lên {{nginx:1.26-alpine}}; rollout phải hoàn tất với 2 Pod Ready.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab05 delete deploy legacy --ignore-not-found --wait=true
kubectl -n lab05 create deploy legacy --image=nginx:1.25-alpine --replicas=2
kubectl -n lab05 rollout status deploy/legacy --timeout=120s`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/legacy --timeout=90s >/dev/null 2>&1
chk strategy "$(j deploy legacy '{.spec.strategy.type}')" "Recreate"
chk minReadySeconds "$(j deploy legacy '{.spec.minReadySeconds}')" "5"
chk image "$(j deploy legacy '{.spec.template.spec.containers[0].image}')" "nginx:1.26-alpine"
chk ready "$(j deploy legacy '{.status.updatedReplicas}/{.status.readyReplicas}')" "2/2"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab05 patch deploy legacy -p '{"spec":{"minReadySeconds":5,"strategy":{"type":"Recreate","rollingUpdate":null}}}'
kubectl -n lab05 set image deploy/legacy nginx=nginx:1.26-alpine
kubectl -n lab05 rollout status deploy/legacy
~~~
**Vì sao:** Deployment mặc định có {{strategy.rollingUpdate}} (25%/25%). Nếu chỉ đổi {{type: Recreate}} mà còn khối {{rollingUpdate}}, API server từ chối với lỗi kiểu {{may not be specified when strategy type is 'Recreate'}}. Giá trị {{null}} trong strategic merge patch nghĩa là "xoá field". Với Recreate, controller scale ReplicaSet cũ về 0, chờ Pod cũ chết hẳn rồi mới tạo Pod mới: có downtime ngắn nhưng không bao giờ có hai phiên bản cùng giữ lock. {{minReadySeconds}} bắt Pod phải Ready liên tục 5 giây mới tính là available.

**Mẹo tiết kiệm thời gian:** dùng {{kubectl edit deploy legacy}} cũng được, nhớ xoá luôn 3 dòng {{rollingUpdate/maxSurge/maxUnavailable}}. Nếu edit bị từ chối, kubectl lưu bản nháp vào {{/tmp/kubectl-edit-*.yaml}}: sửa file đó rồi {{kubectl replace -f}} thay vì gõ lại.`,
      hints: ['Recreate không được đi kèm khối rollingUpdate.', 'Trong strategic merge patch, null xoá một field.'],
      tags: ['recreate', 'strategy', 'minReadySeconds']
    },
    {
      id: 'ckad-lab-05-06', no: 6, domain: 'Deployment', level: 'hard', env: 'kind', minutes: 12,
      title: 'Rollout bị kẹt: chẩn đoán ProgressDeadlineExceeded và fix forward',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{payment}} trong namespace {{lab05}} (3 replicas, container {{nginx}}) vừa được cập nhật lên {{nginx:1.26-alpine}} kèm một readinessProbe mới, nhưng rollout không tiến triển.
1. Chờ đến khi Deployment vượt {{progressDeadlineSeconds}}, rồi ghi **reason** của condition {{Progressing}} (chỉ một từ) vào {{/opt/ckad/lab05-06.txt}}.
2. **Fix forward** (không rollback): giữ image {{nginx:1.26-alpine}}, giữ readinessProbe kiểu httpGet port 80 nhưng sửa path cho đúng thành {{/}}.
3. Giữ {{maxUnavailable: 0}} và ghi change-cause {{v3 fix readiness path}}.
4. Rollout hoàn tất: 3 Pod mới Ready, condition {{Progressing}} trở lại bình thường.`,
      setup: `kubectl create namespace lab05 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab05-06.txt
kubectl -n lab05 delete deploy payment --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment
  namespace: lab05
  annotations:
    kubernetes.io/change-cause: v1 initial
spec:
  replicas: 3
  progressDeadlineSeconds: 30
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: payment
  template:
    metadata:
      labels:
        app: payment
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /
            port: 80
          periodSeconds: 3
EOF
kubectl -n lab05 rollout status deploy/payment --timeout=120s
kubectl -n lab05 patch deploy payment --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/image","value":"nginx:1.26-alpine"},{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/healthz"}]'
kubectl -n lab05 annotate deploy/payment kubernetes.io/change-cause="v2 add healthz probe" --overwrite`,
      verify: `NS=lab05; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/payment --timeout=60s >/dev/null 2>&1
chk reason-file "$(tr -d '[:space:]' < /opt/ckad/lab05-06.txt 2>/dev/null)" "ProgressDeadlineExceeded"
chk image "$(j deploy payment '{.spec.template.spec.containers[0].image}')" "nginx:1.26-alpine"
chk probe-path "$(j deploy payment '{.spec.template.spec.containers[0].readinessProbe.httpGet.path}')" "/"
chk probe-port "$(j deploy payment '{.spec.template.spec.containers[0].readinessProbe.httpGet.port}')" "80"
chk maxUnavailable "$(j deploy payment '{.spec.strategy.rollingUpdate.maxUnavailable}')" "0"
chk change-cause "$(j deploy payment '{.metadata.annotations.kubernetes\\.io/change-cause}')" "v3 fix readiness path"
chk rollout-complete "$(j deploy payment '{.status.updatedReplicas}/{.status.readyReplicas}/{.status.replicas}')" "3/3/3"
chk progressing "$(j deploy payment '{.status.conditions[?(@.type=="Progressing")].reason}')" "NewReplicaSetAvailable"
echo "RESULT $P/$T"`,
      solution: `Chẩn đoán:
~~~bash
kubectl -n lab05 rollout status deploy/payment --timeout=40s   # error: deployment "payment" exceeded its progress deadline
kubectl -n lab05 get deploy payment -o jsonpath='{.status.conditions[?(@.type=="Progressing")].reason}' > /opt/ckad/lab05-06.txt
kubectl -n lab05 describe pod -l app=payment | grep -i readiness   # Readiness probe failed: HTTP probe failed with statuscode: 404
~~~
Sửa tiến:
~~~bash
kubectl -n lab05 patch deploy payment --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/path","value":"/"}]'
kubectl -n lab05 annotate deploy/payment kubernetes.io/change-cause="v3 fix readiness path" --overwrite
kubectl -n lab05 rollout status deploy/payment
~~~
**Vì sao:** nginx không có {{/healthz}} nên probe nhận 404, Pod mới không bao giờ Ready. Vì {{maxUnavailable: 0}}, controller không dám xoá Pod cũ: người dùng không bị ảnh hưởng nhưng rollout đứng yên. Sau 30 giây không tiến triển, condition {{Progressing}} chuyển {{False}} với reason {{ProgressDeadlineExceeded}}. Kubernetes không tự rollback; ở đây đề yêu cầu fix forward nên ta chỉ sửa path, tạo revision 3, Pod mới Ready và Pod cũ bị thay dần. Khi xong, reason trở lại {{NewReplicaSetAvailable}}.

**Mẹo tiết kiệm thời gian:** JSON patch {{op: replace}} theo đường dẫn chính xác nhanh và ít rủi ro hơn edit cả manifest. Lệnh {{kubectl rollout status --timeout}} trả exit code khác 0 khi kẹt, dùng nó để biết sớm thay vì ngồi chờ.`,
      hints: ['kubectl describe pod cho thấy probe nào đang fail và mã HTTP.', 'Reason nằm ở .status.conditions với type Progressing.', 'Fix forward = sửa template chứ không dùng rollout undo.'],
      tags: ['progressDeadlineSeconds', 'readinessProbe', 'troubleshooting']
    }
  ]
},
// ============================================================ MODULE 6
{
  id: 'ckad-lab-06', order: 6,
  title: 'Blue-green và canary bằng Deployment + Service',
  summary: 'Triển khai blue-green và canary chỉ với Deployment, label và Service selector: chuyển traffic tức thì, chia tỉ lệ theo số replica, promote, rollback và sửa canary không nhận traffic.',
  concepts: `### Ý tưởng chung: Service chọn Pod bằng label
Service không biết Deployment là gì. Nó chọn **mọi Pod Ready** có label khớp {{spec.selector}} rồi kube-proxy chia đều kết nối giữa các endpoint đó. Vì vậy hai chiến lược triển khai nâng cao trong CKAD chỉ là chơi với label:

| | Blue-green | Canary |
|---|---|---|
| Số Deployment | 2 ({{-blue}}, {{-green}}), chạy đủ replica cả hai | 2 ({{-stable}}, {{-canary}}) |
| Selector Service | có label phiên bản ({{version: blue}}) | chỉ label chung ({{app: shop}}) |
| Chuyển traffic | đổi selector: 0% → 100% tức thì | tỉ lệ ≈ số Pod canary / tổng Pod |
| Rollback | đổi selector về lại | scale canary về 0 / xoá |
| Chi phí | gấp đôi tài nguyên lúc chuyển | thêm vài Pod |

### Blue-green
Chạy bản mới (green) song song, chờ **Ready** rồi mới đổi selector Service. Giữ bản cũ (blue) chạy một thời gian để rollback trong vài giây. Bẫy: đổi selector khi green chưa Ready thì Service không có endpoint, sập ngay.

### Canary theo số replica
Muốn 20% traffic: tổng 5 Pod, 4 stable + 1 canary, Service selector chỉ {{app}}. Tỉ lệ là xác suất theo kết nối (kube-proxy chọn ngẫu nhiên), không phải theo request HTTP trong một kết nối keep-alive. Muốn chia chính xác theo % hay theo header thì cần Ingress controller / service mesh (ngoài phạm vi CKAD).

### Promote canary
Cập nhật Deployment stable lên phiên bản mới (rolling update), **sau đó** mới xoá canary, để capacity không bị hụt.

### Cheat sheet
~~~bash
kubectl get deploy web-blue -o yaml > green.yaml           # copy rồi sửa name/label/image
kubectl patch svc web -p '{"spec":{"selector":{"app":"web","version":"green"}}}'
kubectl set selector svc shop app=shop                      # THAY toàn bộ selector
kubectl get endpointslices -l kubernetes.io/service-name=shop
kubectl get pods -l app=shop -L track,version --show-labels
kubectl scale deploy shop-stable --replicas=4
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh -c 'for i in $(seq 1 20); do wget -qO- -T 2 http://shop; done'
~~~

### Bẫy hay gặp trong đề
- {{spec.selector}} của Deployment **immutable**: canary có label sai thì phải xoá Deployment và tạo lại, không {{edit}} được.
- {{kubectl patch}} kiểu strategic merge trên selector chỉ **thêm/ghi đè** key, không xoá key; muốn bỏ key dùng {{kubectl set selector}} hoặc JSON patch {{remove}}.
- Pod canary Ready nhưng lắng nghe sai port so với {{targetPort}}: Service vẫn gửi traffic tới, gây lỗi một phần request. Luôn kiểm tra bằng curl/wget nhiều lần.
- Copy YAML từ {{kubectl get -o yaml}} nhớ bỏ {{status}}, {{uid}}, {{resourceVersion}}, {{creationTimestamp}}.`,
  videos: [
    { title: 'Canary Deployment in Kubernetes | Step-by-Step Demo (90/10 Traffic Split Explained)', url: 'https://www.youtube.com/watch?v=b8KIEIkV9zI', note: 'Demo chia traffic 90/10 bằng số replica và label chung: đúng kỹ thuật dùng trong các bài canary của lab này.' },
    { title: 'Blue-Green vs Canary vs Rolling Deploy Explained', url: 'https://www.youtube.com/watch?v=Kmi4VfxRsvw', note: 'Xem để so sánh blue-green và canary: khi nào chọn cái nào, chi phí tài nguyên và cách rollback.' }
  ],
  tasks: [
    {
      id: 'ckad-lab-06-01', no: 1, domain: 'Deployment', level: 'easy', env: 'kind', minutes: 7,
      title: 'Blue-green: tạo bản green và chuyển Service',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab06}} có Deployment {{web-blue}} (label {{app=web, version=blue}}, biến môi trường {{MSG=blue}}, trả nội dung "blue" trên port 8080) và Service {{web}} đang trỏ vào blue. Pod {{client}} dùng để thử traffic.
1. Tạo Deployment {{web-green}}: giống hệt {{web-blue}} nhưng label {{version: green}} (cả selector lẫn pod template) và {{MSG=green}}, 2 replicas.
2. Chỉ khi 2 Pod green đã Ready, chuyển Service {{web}} sang {{version: green}}.
3. Giữ {{web-blue}} chạy nguyên 2 replicas để rollback nhanh.

Kiểm tra: {{kubectl -n lab06 exec client -- wget -qO- http://web}} phải trả về {{green}}.`,
      setup: `kubectl create namespace lab06 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab06 delete deploy web-green --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-blue
  namespace: lab06
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
      version: blue
  template:
    metadata:
      labels:
        app: web
        version: blue
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo $MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - name: MSG
          value: blue
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: web
  namespace: lab06
spec:
  selector:
    app: web
    version: blue
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: lab06
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: client
    image: busybox:1.36
    command: ["sleep", "86400"]
EOF
kubectl -n lab06 set selector svc web app=web,version=blue
kubectl -n lab06 rollout status deploy/web-blue --timeout=120s
kubectl -n lab06 wait --for=condition=Ready pod/client --timeout=90s`,
      verify: `NS=lab06; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/web-green --timeout=60s >/dev/null 2>&1
chk green-ready "$(j deploy web-green '{.status.readyReplicas}')" "2"
chk green-label "$(j deploy web-green '{.spec.template.metadata.labels.version}')" "green"
chk svc-selector "$(j svc web '{.spec.selector.app}/{.spec.selector.version}')" "web/green"
OUT=$(kubectl -n $NS exec client -- sh -c 'for i in $(seq 1 10); do wget -qO- -T 2 http://web; done' 2>/dev/null)
chk traffic-all-green "$(echo "$OUT" | grep -c '^green$')" "10"
chk blue-kept "$(j deploy web-blue '{.status.readyReplicas}')" "2"
echo "RESULT $P/$T"`,
      solution: `~~~bash
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-green
  namespace: lab06
spec:
  replicas: 2
  selector:
    matchLabels: {app: web, version: green}
  template:
    metadata:
      labels: {app: web, version: green}
    spec:
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo $MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - {name: MSG, value: green}
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet: {path: /, port: 8080}
EOF
kubectl -n lab06 rollout status deploy/web-green
kubectl -n lab06 patch svc web -p '{"spec":{"selector":{"app":"web","version":"green"}}}'
kubectl -n lab06 exec client -- wget -qO- http://web    # green
~~~
**Vì sao:** Service chỉ gửi traffic tới Pod Ready khớp selector. Đổi một key {{version}} trong selector là chuyển 100% traffic trong một thao tác, và đổi lại {{blue}} là rollback tức thì vì blue vẫn chạy đủ replica. Chờ {{rollout status}} trước khi patch để không có khoảnh khắc Service rỗng endpoint.

**Mẹo tiết kiệm thời gian:** {{kubectl -n lab06 get deploy web-blue -o yaml > g.yaml}}, rồi {{sed -i 's/blue/green/g' g.yaml}} và xoá các dòng {{uid}}, {{resourceVersion}}, {{creationTimestamp}}, khối {{status}} trước khi apply. Với manifest ngắn, gõ YAML gọn như trên thường nhanh hơn.`,
      hints: ['Selector của Deployment và label của pod template đều phải có version: green.', 'kubectl patch svc web -p ... để đổi một key của selector.'],
      refs: [{ type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
      tags: ['blue-green', 'service-selector']
    },
    {
      id: 'ckad-lab-06-02', no: 2, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 8,
      title: 'Canary 20% bằng số replica',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab06}} có Deployment {{shop-stable}} (4 replicas, label {{app=shop, track=stable}}, trả "v1") và Service {{shop}} đang chọn {{app=shop, track=stable}}.
1. Tạo Deployment {{shop-canary}} 1 replica, label {{app=shop, track=canary}}, cùng image và lệnh như stable nhưng {{MSG=v2}} (trả "v2").
2. Sửa Service {{shop}} để nó chọn Pod của **cả hai** Deployment (chỉ dựa vào {{app=shop}}), sao cho khoảng 20% traffic tới canary.
3. Không thay đổi {{shop-stable}}.`,
      setup: `kubectl create namespace lab06 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab06 delete deploy shop-canary --ignore-not-found
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-stable
  namespace: lab06
spec:
  replicas: 4
  selector:
    matchLabels:
      app: shop
      track: stable
  template:
    metadata:
      labels:
        app: shop
        track: stable
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo $MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - name: MSG
          value: v1
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: shop
  namespace: lab06
spec:
  selector:
    app: shop
    track: stable
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: lab06
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: client
    image: busybox:1.36
    command: ["sleep", "86400"]
EOF
kubectl -n lab06 set selector svc shop app=shop,track=stable
kubectl -n lab06 rollout status deploy/shop-stable --timeout=120s
kubectl -n lab06 wait --for=condition=Ready pod/client --timeout=90s`,
      verify: `NS=lab06; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/shop-canary --timeout=60s >/dev/null 2>&1
chk canary-ready "$(j deploy shop-canary '{.status.readyReplicas}')" "1"
chk canary-labels "$(j deploy shop-canary '{.spec.template.metadata.labels.app}/{.spec.template.metadata.labels.track}')" "shop/canary"
chk stable-ready "$(j deploy shop-stable '{.status.readyReplicas}')" "4"
chk svc-selector "$(j svc shop '{.spec.selector.app}|{.spec.selector.track}')" "shop|"
OUT=$(kubectl -n $NS exec client -- sh -c 'for i in $(seq 1 40); do wget -qO- -T 2 http://shop; done' 2>/dev/null)
V1=$(echo "$OUT" | grep -c '^v1$'); V2=$(echo "$OUT" | grep -c '^v2$')
if [ "$V1" -gt 0 ] && [ "$V2" -gt 0 ] && [ "$V2" -lt "$V1" ]; then ok traffic-split; else no traffic-split "40 request: v1=$V1, v2=$V2"; fi
echo "RESULT $P/$T"`,
      solution: `~~~bash
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shop-canary
  namespace: lab06
spec:
  replicas: 1
  selector:
    matchLabels: {app: shop, track: canary}
  template:
    metadata:
      labels: {app: shop, track: canary}
    spec:
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo $MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - {name: MSG, value: v2}
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet: {path: /, port: 8080}
EOF
kubectl -n lab06 rollout status deploy/shop-canary
kubectl -n lab06 set selector svc shop app=shop      # thay TOÀN BỘ selector
kubectl -n lab06 get endpointslices -l kubernetes.io/service-name=shop   # 5 endpoint
~~~
**Vì sao:** Service giờ chọn mọi Pod có {{app=shop}}: 4 stable + 1 canary = 5 endpoint, kube-proxy chọn ngẫu nhiên nên ≈ 1/5 = 20% kết nối tới canary. Muốn 10% thì 9 + 1, muốn 50% thì 1 + 1. Lưu ý: patch strategic merge chỉ ghi đè key được nêu, **không** xoá key {{track}}; phải dùng {{set selector}} hoặc JSON patch:
~~~bash
kubectl -n lab06 patch svc shop -p '{"spec":{"selector":{"app":"shop"}}}'      # SAI: track vẫn còn
kubectl -n lab06 patch svc shop --type=json -p '[{"op":"remove","path":"/spec/selector/track"}]'   # đúng
~~~

**Mẹo tiết kiệm thời gian:** xác nhận bằng một vòng lặp wget trong Pod client thay vì gọi nhiều lần bằng tay; {{kubectl get pods -l app=shop -L track}} cho thấy ngay số Pod mỗi track.`,
      hints: ['Tỉ lệ traffic ≈ số Pod canary / tổng số Pod mà Service chọn.', 'kubectl set selector thay thế toàn bộ selector, patch thì không xoá key cũ.'],
      tags: ['canary', 'set-selector']
    },
    {
      id: 'ckad-lab-06-03', no: 3, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 6,
      title: 'Promote canary lên 100% không hụt capacity',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab06}}: Service {{api}} chọn {{app=api}}; Deployment {{api-stable}} (4 replicas, container {{web}}, {{MSG=v1}}) và {{api-canary}} (1 replica, {{MSG=v2}}). Canary đã ổn định, cần promote:
1. Cập nhật {{api-stable}} để trả "v2" (đặt {{MSG=v2}}), chờ rollout xong, vẫn 4 replicas.
2. Sau đó xoá Deployment {{api-canary}}.
3. Không sửa Service {{api}}. 100% request tới {{http://api}} phải trả "v2".`,
      setup: `kubectl create namespace lab06 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab06 delete deploy api-stable api-canary --ignore-not-found --wait=true
for T in stable canary; do
  if [ "$T" = stable ]; then R=4; M=v1; else R=1; M=v2; fi
  cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-$T
  namespace: lab06
spec:
  replicas: $R
  selector:
    matchLabels:
      app: api
      track: $T
  template:
    metadata:
      labels:
        app: api
        track: $T
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo \\$MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - name: MSG
          value: $M
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 3
EOF
done
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: api
  namespace: lab06
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: lab06
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: client
    image: busybox:1.36
    command: ["sleep", "86400"]
EOF
kubectl -n lab06 rollout status deploy/api-stable --timeout=120s
kubectl -n lab06 rollout status deploy/api-canary --timeout=120s
kubectl -n lab06 wait --for=condition=Ready pod/client --timeout=90s`,
      verify: `NS=lab06; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/api-stable --timeout=60s >/dev/null 2>&1
chk stable-msg "$(j deploy api-stable '{.spec.template.spec.containers[0].env[?(@.name=="MSG")].value}')" "v2"
chk stable-ready "$(j deploy api-stable '{.status.updatedReplicas}/{.status.readyReplicas}')" "4/4"
if kubectl -n $NS get deploy api-canary >/dev/null 2>&1; then no canary-removed "api-canary vẫn còn"; else ok canary-removed; fi
chk svc-unchanged "$(j svc api '{.spec.selector.app}|{.spec.selector.track}')" "api|"
OUT=$(kubectl -n $NS exec client -- sh -c 'for i in $(seq 1 20); do wget -qO- -T 2 http://api; done' 2>/dev/null)
chk traffic-all-v2 "$(echo "$OUT" | grep -c '^v2$')" "20"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab06 set env deploy/api-stable MSG=v2
kubectl -n lab06 rollout status deploy/api-stable
kubectl -n lab06 delete deploy api-canary
kubectl -n lab06 exec client -- sh -c 'for i in $(seq 1 10); do wget -qO- http://api; done'
~~~
**Vì sao:** đổi env làm đổi pod template, nên {{api-stable}} rolling update từng Pod sang v2 trong khi canary vẫn phục vụ v2: capacity luôn ≥ 4 Pod. Nếu xoá canary trước, trong lúc stable đang rollout sẽ có giai đoạn vẫn còn Pod v1 nhận traffic và số Pod giảm. Service giữ nguyên selector {{app=api}} nên không có khoảnh khắc nào thiếu endpoint.

**Mẹo tiết kiệm thời gian:** {{kubectl set env}} và {{kubectl set image}} là hai lệnh promote nhanh nhất; không cần mở YAML. Kiểm tra lại bằng {{kubectl -n lab06 get pods -l app=api -L track}} để chắc chỉ còn Pod track=stable.`,
      hints: ['kubectl set env deploy/<tên> KEY=VALUE tạo rollout mới.', 'Thứ tự: promote stable trước, xoá canary sau.'],
      tags: ['canary', 'promote', 'set-env']
    },
    {
      id: 'ckad-lab-06-04', no: 4, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 8,
      title: 'Blue-green rollback khi green không Ready',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab06}}: Service {{pay}} vừa được chuyển sang {{version=green}} nhưng toàn bộ request tới {{http://pay}} đều lỗi. Deployment {{pay-blue}} (bản cũ, label {{app=pay, version=blue}}) đã bị scale về 0.
1. Khôi phục dịch vụ: scale {{pay-blue}} lên 3 replicas và chuyển Service {{pay}} về {{version=blue}}.
2. **Không** xoá {{pay-green}} (team cần debug).
3. Tìm lý do Pod green không Ready và ghi **path HTTP** mà probe đang gọi (ví dụ {{/abc}}) vào {{/opt/ckad/lab06-04.txt}}.`,
      setup: `kubectl create namespace lab06 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab06-04.txt
kubectl -n lab06 delete deploy pay-blue pay-green --ignore-not-found --wait=true
for V in blue green; do
  if [ "$V" = blue ]; then R=0; RP=/; else R=3; RP=/ready; fi
  cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pay-$V
  namespace: lab06
spec:
  replicas: $R
  selector:
    matchLabels:
      app: pay
      version: $V
  template:
    metadata:
      labels:
        app: pay
        version: $V
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo \\$MSG > /www/index.html && exec httpd -f -p 8080 -h /www"]
        env:
        - name: MSG
          value: $V
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: $RP
            port: 8080
          periodSeconds: 3
EOF
done
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: pay
  namespace: lab06
spec:
  selector:
    app: pay
    version: green
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: lab06
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: client
    image: busybox:1.36
    command: ["sleep", "86400"]
EOF
kubectl -n lab06 set selector svc pay app=pay,version=green
kubectl -n lab06 wait --for=condition=Ready pod/client --timeout=90s`,
      verify: `NS=lab06; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/pay-blue --timeout=60s >/dev/null 2>&1
chk blue-ready "$(j deploy pay-blue '{.status.readyReplicas}')" "3"
chk svc-selector "$(j svc pay '{.spec.selector.app}/{.spec.selector.version}')" "pay/blue"
OUT=$(kubectl -n $NS exec client -- sh -c 'for i in $(seq 1 10); do wget -qO- -T 2 http://pay; done' 2>/dev/null)
chk traffic-all-blue "$(echo "$OUT" | grep -c '^blue$')" "10"
if kubectl -n $NS get deploy pay-green >/dev/null 2>&1; then ok green-kept; else no green-kept "pay-green đã bị xoá"; fi
chk probe-path-file "$(tr -d '[:space:]' < /opt/ckad/lab06-04.txt 2>/dev/null)" "/ready"
echo "RESULT $P/$T"`,
      solution: `Khôi phục dịch vụ trước, điều tra sau:
~~~bash
kubectl -n lab06 scale deploy pay-blue --replicas=3
kubectl -n lab06 rollout status deploy/pay-blue
kubectl -n lab06 patch svc pay -p '{"spec":{"selector":{"version":"blue"}}}'
kubectl -n lab06 exec client -- wget -qO- http://pay      # blue
~~~
Điều tra green:
~~~bash
kubectl -n lab06 get pods -l app=pay,version=green          # READY 0/1
kubectl -n lab06 describe pod -l version=green | grep -A2 Readiness
# Readiness probe failed: HTTP probe failed with statuscode: 404
kubectl -n lab06 get deploy pay-green -o jsonpath='{.spec.template.spec.containers[0].readinessProbe.httpGet.path}' > /opt/ckad/lab06-04.txt
~~~
**Vì sao:** Pod green chạy nhưng không Ready (httpd chỉ có {{/index.html}}, {{/ready}} trả 404), nên Service {{pay}} không có endpoint Ready nào: mọi request lỗi. Scale blue lên **trước** rồi mới đổi selector, để lúc đổi đã có 3 endpoint sẵn sàng. Đây là bài học vận hành: không bao giờ chuyển selector khi bản đích chưa Ready.

**Mẹo tiết kiệm thời gian:** {{kubectl get endpointslices -l kubernetes.io/service-name=pay}} cho biết ngay Service có endpoint hay không; endpoint rỗng gần như luôn là vấn đề label selector hoặc readiness.`,
      hints: ['Service chỉ gửi tới Pod Ready; xem READY của Pod green.', 'kubectl describe pod cho thấy readiness probe fail với path nào.'],
      tags: ['blue-green', 'rollback', 'readinessProbe']
    },
    {
      id: 'ckad-lab-06-05', no: 5, domain: 'Deployment', level: 'hard', env: 'kind', minutes: 13,
      title: 'Canary không nhận traffic: sửa label bất biến và port',
      task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab06}}: Service {{cart}} (selector {{app=cart}}, port 80 → targetPort 8080) đang phục vụ Deployment {{cart-v1}} (3 replicas, trả "v1"). Một đồng nghiệp đã tạo canary {{cart-v2}} (trả "v2") nhưng canary không nhận được request nào.

Yêu cầu: chạy canary đúng **20%** traffic.
1. {{cart-v2}}: đúng 1 replica, Pod có label {{app=cart}} và {{track=canary}}, phục vụ trên port **8080**; giữ tên Deployment {{cart-v2}}.
2. Scale {{cart-v1}} lên 4 replicas (tổng 5 Pod). Không đổi image/lệnh của {{cart-v1}}.
3. **Không** sửa Service {{cart}}.
4. Mọi request tới {{http://cart}} phải thành công (không có request lỗi).`,
      setup: `kubectl create namespace lab06 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab06 delete deploy cart-v1 cart-v2 --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-v1
  namespace: lab06
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cart
      track: stable
  template:
    metadata:
      labels:
        app: cart
        track: stable
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo v1 > /www/index.html && exec httpd -f -p 8080 -h /www"]
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 3
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cart-v2
  namespace: lab06
spec:
  replicas: 1
  selector:
    matchLabels:
      app: carts
      track: canary
  template:
    metadata:
      labels:
        app: carts
        track: canary
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: web
        image: busybox:1.36
        command: ["sh", "-c", "mkdir -p /www && echo v2 > /www/index.html && exec httpd -f -p 8081 -h /www"]
        ports:
        - containerPort: 8081
        readinessProbe:
          httpGet:
            path: /
            port: 8081
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: cart
  namespace: lab06
spec:
  selector:
    app: cart
  ports:
  - port: 80
    targetPort: 8080
---
apiVersion: v1
kind: Pod
metadata:
  name: client
  namespace: lab06
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: client
    image: busybox:1.36
    command: ["sleep", "86400"]
EOF
kubectl -n lab06 set selector svc cart app=cart
kubectl -n lab06 rollout status deploy/cart-v1 --timeout=120s
kubectl -n lab06 wait --for=condition=Ready pod/client --timeout=90s`,
      verify: `NS=lab06; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
kubectl -n $NS rollout status deploy/cart-v1 --timeout=60s >/dev/null 2>&1
kubectl -n $NS rollout status deploy/cart-v2 --timeout=60s >/dev/null 2>&1
chk svc-unchanged "$(j svc cart '{.spec.selector.app}|{.spec.selector.track}|{.spec.ports[0].targetPort}')" "cart||8080"
chk v1-ready "$(j deploy cart-v1 '{.status.readyReplicas}')" "4"
chk v2-ready "$(j deploy cart-v2 '{.status.readyReplicas}')" "1"
chk v2-labels "$(j deploy cart-v2 '{.spec.template.metadata.labels.app}/{.spec.template.metadata.labels.track}')" "cart/canary"
OUT=$(kubectl -n $NS exec client -- sh -c 'for i in $(seq 1 40); do wget -qO- -T 2 http://cart || echo ERR; done' 2>/dev/null)
V1=$(echo "$OUT" | grep -c '^v1$'); V2=$(echo "$OUT" | grep -c '^v2$')
chk all-requests-ok "$((V1 + V2))" "40"
if [ "$V2" -gt 0 ] && [ "$V2" -lt "$V1" ]; then ok canary-receives-traffic; else no canary-receives-traffic "v1=$V1, v2=$V2"; fi
echo "RESULT $P/$T"`,
      solution: `Chẩn đoán:
~~~bash
kubectl -n lab06 get pods -l app=cart -L track          # chỉ thấy Pod v1
kubectl -n lab06 get deploy cart-v2 -o yaml | grep -A3 matchLabels   # app: carts (sai)
~~~
{{spec.selector}} của Deployment là immutable, nên không thể {{edit}} label {{app}}. Xuất YAML, sửa, xoá rồi tạo lại:
~~~bash
kubectl -n lab06 get deploy cart-v2 -o yaml > v2.yaml
# sửa: matchLabels + template labels app: cart; lệnh httpd -p 8080; containerPort 8080; readinessProbe port 8080
# xoá metadata.uid/resourceVersion/creationTimestamp và khối status
kubectl -n lab06 delete deploy cart-v2
kubectl apply -f v2.yaml
kubectl -n lab06 scale deploy cart-v1 --replicas=4
kubectl -n lab06 rollout status deploy/cart-v2
kubectl -n lab06 exec client -- sh -c 'for i in $(seq 1 20); do wget -qO- -T 2 http://cart || echo ERR; done'
~~~
**Vì sao:** có hai lỗi chồng nhau. (1) Label {{app=carts}} không khớp selector {{app=cart}} của Service nên canary không bao giờ thành endpoint. (2) Kể cả sửa label, container nghe port 8081 trong khi Service gửi tới {{targetPort: 8080}}: Pod vẫn Ready (probe kiểm 8081) nhưng 20% request bị connection refused. Readiness probe chỉ bảo vệ bạn nếu nó kiểm đúng port mà Service dùng. 4 + 1 = 5 Pod cho tỉ lệ 20%.

**Mẹo tiết kiệm thời gian:** {{kubectl replace --force -f v2.yaml}} xoá và tạo lại trong một lệnh. Luôn test bằng vòng lặp có {{|| echo ERR}} để thấy lỗi một phần mà một lần curl dễ bỏ sót.`,
      hints: ['So sánh selector của Service với label của Pod cart-v2.', 'Selector của Deployment không sửa được: phải xoá và tạo lại.', 'Pod Ready chưa chắc nghe đúng targetPort của Service.'],
      tags: ['canary', 'labels', 'troubleshooting', 'targetPort']
    }
  ]
},
// ============================================================ MODULE 7
{
  id: 'ckad-lab-07', order: 7,
  title: 'Helm và Kustomize',
  summary: 'Đóng gói và tuỳ biến manifest: helm install/upgrade với --set và -f, history/rollback, template, list -A; Kustomize với overlay, namePrefix, images, replicas, configMapGenerator và patches qua kubectl apply -k.',
  concepts: `### Helm: package manager của Kubernetes
Một **chart** là thư mục gồm {{Chart.yaml}}, {{values.yaml}} và {{templates/}} (Go template). {{helm install}} render template với values thành manifest rồi apply, đồng thời lưu một **release** (tên + revision) dưới dạng Secret {{sh.helm.release.v1.<tên>.v<N>}} trong namespace của release. Nhờ đó Helm biết lịch sử để {{upgrade}}/{{rollback}}.

Thứ tự ưu tiên values (sau ghi đè trước): {{values.yaml}} của chart → các file {{-f}} theo thứ tự → {{--set}}. Lưu ý {{helm upgrade}} **không** giữ các {{--set}} cũ trừ khi dùng {{--reuse-values}}: mỗi upgrade nên truyền đủ values.

{{helm rollback <release> <rev>}} không "quay ngược" revision mà tạo **revision mới** có nội dung của revision cũ (description "Rollback to N"). {{helm upgrade}} không có {{--wait}} trả về thành công ngay cả khi Pod kéo image lỗi.

### Kustomize: tuỳ biến không cần template
Built-in trong kubectl ({{kubectl apply -k}}, {{kubectl kustomize}}). Một **base** chứa manifest thuần; mỗi **overlay** có {{kustomization.yaml}} trỏ {{resources: [../../base]}} và khai báo biến đổi: {{namespace}}, {{namePrefix}}/{{nameSuffix}}, {{labels}}, {{images}} (đổi tag không sửa file), {{replicas}}, {{configMapGenerator}}/{{secretGenerator}}, {{patches}}. Base không bao giờ bị sửa.

{{configMapGenerator}} thêm hash vào tên ({{app-config-7f8k2...}}) và tự cập nhật mọi tham chiếu (env, envFrom, volume). Đổi nội dung → tên mới → pod template đổi → Deployment tự rollout. Đây là cách giải bài "ConfigMap đổi mà Pod không nhận".

### Cheat sheet
~~~bash
helm create mychart                        # khung chart mẫu
helm show values ./mychart                 # xem values mặc định
helm install web ./mychart -n ns --set replicaCount=2 --set service.type=NodePort
helm upgrade web ./mychart -n ns -f prod.yaml --wait
helm list -A                               # mọi release mọi namespace
helm history web -n ns
helm rollback web 1 -n ns
helm get values web -n ns [--revision 2]
helm template api ./mychart --set replicaCount=3 > out.yaml   # render, không cài
helm uninstall web -n ns

kubectl kustomize overlays/prod            # xem kết quả render
kubectl apply -k overlays/prod
kubectl delete -k overlays/prod
~~~

### Bẫy hay gặp trong đề
- Quên {{-n <namespace>}} với helm: release được cài vào namespace mặc định của context, rồi {{helm list}} "không thấy".
- Tên resource do chart sinh: với chart {{helm create}}, release {{shop}} của chart {{webapp}} cho ra {{shop-webapp}}.
- Kustomize: {{replicas}}/{{images}}/{{patches}} tham chiếu tên **gốc** trong base, không phải tên sau {{namePrefix}}.
- {{commonLabels}} đã cũ (vẫn chạy nhưng cảnh báo); kustomize v5 dùng {{labels}}.`,
  videos: [
    { title: 'Helm Tutorial - Crash Course In 15 Minutes', url: 'https://www.youtube.com/watch?v=JHj2pCO7Wbk', note: 'Xem cả video (15 phút): chart, values, install/upgrade/rollback, đủ nền cho bài 1–3 và 6.' },
    { title: 'Day 44 - Kustomize Tutorial For Beginners | Kubernetes Kustomized Simply Explained (with demo)', url: 'https://www.youtube.com/watch?v=Od4BROWS3M0', note: 'Phần demo base/overlay, namePrefix, patch và configMapGenerator: khớp bài 4–5.' },
    { title: 'Kustomize: The Best Way to Manage Your Kubernetes Configs', url: 'https://www.youtube.com/watch?v=spCdNeNCuFU', note: 'Xem để hiểu vì sao kustomize không dùng template và khi nào chọn nó thay cho Helm.' }
  ],
  tasks: [
    {
      id: 'ckad-lab-07-01', no: 1, domain: 'Deployment', level: 'easy', env: 'kind', minutes: 5,
      title: 'Cài release Helm từ chart local với --set',
      task: `Context: {{kubectl config use-context kind-ckad}}

Cần có {{helm}} 3 trên máy. Chart {{webapp}} nằm ở {{/opt/ckad/lab07/webapp}} (setup tạo bằng {{helm create}}).
Cài release {{shop}} từ chart này vào namespace {{lab07}} với:
- {{replicaCount=2}};
- {{service.type=NodePort}}.

Kết quả: release ở trạng thái {{deployed}}, Deployment {{shop-webapp}} có 2 Pod Ready, Service {{shop-webapp}} kiểu NodePort.`,
      setup: `command -v helm >/dev/null 2>&1 || { echo "Cần cài helm 3: https://helm.sh/docs/intro/install/"; exit 1; }
mkdir -p /opt/ckad/lab07
[ -f /opt/ckad/lab07/webapp/Chart.yaml ] || helm create /opt/ckad/lab07/webapp
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
helm -n lab07 uninstall shop >/dev/null 2>&1 || true`,
      verify: `NS=lab07; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
if helm -n $NS list --filter '^shop$' -o json 2>/dev/null | grep -q '"status":"deployed"'; then ok release-deployed; else no release-deployed "không thấy release shop deployed trong lab07"; fi
kubectl -n $NS rollout status deploy/shop-webapp --timeout=90s >/dev/null 2>&1
chk ready-2 "$(j deploy shop-webapp '{.status.readyReplicas}')" "2"
chk svc-nodeport "$(j svc shop-webapp '{.spec.type}')" "NodePort"
echo "RESULT $P/$T"`,
      solution: `~~~bash
helm show values /opt/ckad/lab07/webapp | grep -E 'replicaCount|type:'   # xác nhận tên key
helm install shop /opt/ckad/lab07/webapp -n lab07 --set replicaCount=2 --set service.type=NodePort
helm list -n lab07
kubectl -n lab07 get deploy,svc
~~~
**Vì sao:** {{--set}} ghi đè key trong {{values.yaml}} của chart (đường dẫn lồng nhau viết bằng dấu chấm: {{service.type}}). Template {{_helpers.tpl}} của chart mẫu đặt tên fullname = {{<release>-<chart>}}, nên resource có tên {{shop-webapp}}. Release được lưu dưới dạng Secret trong {{lab07}}, vì thế luôn truyền {{-n lab07}} cho mọi lệnh helm tiếp theo.

**Mẹo tiết kiệm thời gian:** chạy {{helm show values}} trước để biết đúng tên key thay vì đoán; thêm {{--wait}} khi cần chắc Pod Ready trước khi sang bài khác. Nhiều {{--set}} có thể gộp: {{--set replicaCount=2,service.type=NodePort}}.`,
      hints: ['helm install <release> <đường dẫn chart> -n <ns> --set key=value', 'helm show values để xem tên key.'],
      tags: ['helm', 'install', 'set']
    },
    {
      id: 'ckad-lab-07-02', no: 2, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 7,
      title: 'Helm history và rollback sau upgrade hỏng',
      task: `Context: {{kubectl config use-context kind-ckad}}

Release {{blog}} (chart {{/opt/ckad/lab07/webapp}}, namespace {{lab07}}) vừa được upgrade và Pod mới không chạy được.
1. Tìm image tag đã được đặt trong lần upgrade hỏng và ghi tag đó (chỉ tag, ví dụ {{1.2.3}}) vào {{/opt/ckad/lab07-02.txt}}.
2. Rollback release {{blog}} về revision **1** bằng Helm.
3. Deployment {{blog-webapp}} phải có Pod Ready và không còn dùng tag hỏng.`,
      setup: `command -v helm >/dev/null 2>&1 || { echo "Cần cài helm 3: https://helm.sh/docs/intro/install/"; exit 1; }
mkdir -p /opt/ckad/lab07
[ -f /opt/ckad/lab07/webapp/Chart.yaml ] || helm create /opt/ckad/lab07/webapp
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
rm -f /opt/ckad/lab07-02.txt
helm -n lab07 uninstall blog --wait >/dev/null 2>&1 || true
helm -n lab07 install blog /opt/ckad/lab07/webapp --set replicaCount=1 --wait --timeout 180s
helm -n lab07 upgrade blog /opt/ckad/lab07/webapp --set image.tag=1.99-broken
helm -n lab07 history blog`,
      verify: `NS=lab07; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
chk tag-file "$(tr -d '[:space:]' < /opt/ckad/lab07-02.txt 2>/dev/null)" "1.99-broken"
if helm -n $NS history blog -o json 2>/dev/null | grep -q 'Rollback to 1'; then ok helm-rollback; else no helm-rollback "helm history không có 'Rollback to 1'"; fi
kubectl -n $NS rollout status deploy/blog-webapp --timeout=90s >/dev/null 2>&1
IMG=$(j deploy blog-webapp '{.spec.template.spec.containers[0].image}')
case "$IMG" in *1.99-broken*|"") no image-restored "image hiện tại: '$IMG'";; *) ok image-restored;; esac
chk ready "$(j deploy blog-webapp '{.status.updatedReplicas}/{.status.readyReplicas}')" "1/1"
echo "RESULT $P/$T"`,
      solution: `~~~bash
helm -n lab07 history blog
# REVISION  STATUS      DESCRIPTION
# 1         superseded  Install complete
# 2         deployed    Upgrade complete
helm -n lab07 get values blog --revision 2      # image: tag: 1.99-broken
echo 1.99-broken > /opt/ckad/lab07-02.txt
helm -n lab07 rollback blog 1 --wait
helm -n lab07 history blog                       # revision 3: Rollback to 1
kubectl -n lab07 get pods -l app.kubernetes.io/instance=blog
~~~
**Vì sao:** Helm lưu values đã dùng ở từng revision, nên {{helm get values --revision N}} cho biết chính xác ai đã đặt gì. Upgrade không có {{--wait}} vẫn được ghi là {{deployed}} dù Pod kéo image lỗi, vì Helm chỉ apply manifest. {{helm rollback blog 1}} render lại manifest của revision 1 và tạo revision 3; Deployment đổi template về image cũ nên ReplicaSet tốt được scale lại.

**Mẹo tiết kiệm thời gian:** trong thực tế dùng {{helm upgrade --atomic --timeout 5m}} để Helm tự rollback khi Pod không Ready (Helm 4 đổi tên cờ này thành {{--rollback-on-failure}}). Trong đề, {{helm history}} + {{helm get values --revision}} là hai lệnh đủ để trả lời mọi câu "ai đổi gì".`,
      hints: ['helm history liệt kê các revision.', 'helm get values <release> --revision N xem values của một revision.'],
      tags: ['helm', 'rollback', 'history']
    },
    {
      id: 'ckad-lab-07-03', no: 3, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 7,
      title: 'helm template và dọn release ở namespace lạ',
      task: `Context: {{kubectl config use-context kind-ckad}}

1. Render chart {{/opt/ckad/lab07/webapp}} với tên release {{api}}, namespace {{lab07}}, {{replicaCount=3}} và {{service.port=8080}} ra file {{/opt/ckad/lab07-03.txt}}. **Không** cài release {{api}} vào cluster.
2. Có một release tên {{legacy-cache}} bị cài nhầm ở một namespace nào đó trong cluster. Tìm và gỡ (uninstall) nó.`,
      setup: `command -v helm >/dev/null 2>&1 || { echo "Cần cài helm 3: https://helm.sh/docs/intro/install/"; exit 1; }
mkdir -p /opt/ckad/lab07
[ -f /opt/ckad/lab07/webapp/Chart.yaml ] || helm create /opt/ckad/lab07/webapp
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace lab07-legacy --dry-run=client -o yaml | kubectl apply -f -
rm -f /opt/ckad/lab07-03.txt
helm -n lab07 uninstall api >/dev/null 2>&1 || true
helm -n lab07-legacy status legacy-cache >/dev/null 2>&1 || helm -n lab07-legacy install legacy-cache /opt/ckad/lab07/webapp --set replicaCount=1`,
      verify: `P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
F=/opt/ckad/lab07-03.txt
if [ -s $F ]; then ok file-exists; else no file-exists "$F rỗng hoặc không có"; fi
if grep -q 'kind: Deployment' $F 2>/dev/null && grep -q 'name: api-webapp' $F 2>/dev/null; then ok rendered-deployment; else no rendered-deployment "thiếu Deployment api-webapp trong file"; fi
if grep -q 'replicas: 3' $F 2>/dev/null; then ok replicas-3; else no replicas-3 "không thấy replicas: 3"; fi
if grep -q 'port: 8080' $F 2>/dev/null; then ok port-8080; else no port-8080 "không thấy port: 8080"; fi
if helm -n lab07 status api >/dev/null 2>&1; then no api-not-installed "release api đang được cài"; else ok api-not-installed; fi
if helm list -A -q 2>/dev/null | grep -qx legacy-cache; then no legacy-removed "legacy-cache vẫn còn"; else ok legacy-removed; fi
echo "RESULT $P/$T"`,
      solution: `~~~bash
helm template api /opt/ckad/lab07/webapp -n lab07 --set replicaCount=3 --set service.port=8080 > /opt/ckad/lab07-03.txt
grep -E 'replicas:|port:' /opt/ckad/lab07-03.txt
helm list -A | grep legacy-cache        # NAMESPACE = lab07-legacy
helm uninstall legacy-cache -n lab07-legacy
~~~
**Vì sao:** {{helm template}} render chart hoàn toàn phía client: không tạo release, không cần quyền ghi cluster. Rất hữu ích để review manifest, đưa vào GitOps hoặc kiểm tra values trước khi upgrade. Release Helm thuộc về **một namespace**: {{helm list}} không có cờ chỉ xem namespace hiện tại, nên phải dùng {{-A}} (all namespaces) để tìm rồi uninstall đúng {{-n}}.

**Mẹo tiết kiệm thời gian:** {{helm list -A}} là lệnh đầu tiên nên chạy khi đề nói "một release nào đó". Với {{helm template}}, nhớ truyền {{-n}} nếu chart dùng {{.Release.Namespace}}, nếu không manifest sẽ mang namespace {{default}}.`,
      hints: ['helm template <release> <chart> --set ... > file', 'helm list -A cho biết namespace của mọi release.'],
      tags: ['helm', 'template', 'list']
    },
    {
      id: 'ckad-lab-07-04', no: 4, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 8,
      title: 'Kustomize overlay prod: namespace, namePrefix, images, replicas',
      task: `Context: {{kubectl config use-context kind-ckad}}

Base Kustomize ở {{/opt/ckad/lab07/kust/base}} gồm Deployment {{inventory}} (image {{nginx:1.25-alpine}}, 1 replica) và Service {{inventory}}. **Không sửa base.**
Tạo overlay {{/opt/ckad/lab07/kust/overlays/prod/kustomization.yaml}} sao cho:
- mọi resource vào namespace {{lab07}} và có tiền tố tên {{prod-}};
- image {{nginx}} dùng tag {{1.27-alpine}};
- Deployment có 3 replicas.

Apply overlay bằng kubectl (Kustomize built-in). Kết quả: Deployment {{prod-inventory}} 3 Pod Ready, Service {{prod-inventory}} tồn tại.`,
      setup: `mkdir -p /opt/ckad/lab07/kust/base
cat > /opt/ckad/lab07/kust/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory
  labels:
    app: inventory
spec:
  replicas: 1
  selector:
    matchLabels:
      app: inventory
  template:
    metadata:
      labels:
        app: inventory
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
EOF
cat > /opt/ckad/lab07/kust/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: inventory
spec:
  selector:
    app: inventory
  ports:
  - port: 80
    targetPort: 80
EOF
cat > /opt/ckad/lab07/kust/base/kustomization.yaml <<'EOF'
resources:
- deployment.yaml
- service.yaml
EOF
rm -rf /opt/ckad/lab07/kust/overlays/prod
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab07 delete deploy,svc prod-inventory --ignore-not-found`,
      verify: `NS=lab07; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
if kubectl kustomize /opt/ckad/lab07/kust/overlays/prod 2>/dev/null | grep -q 'name: prod-inventory'; then ok overlay-renders; else no overlay-renders "kubectl kustomize overlays/prod lỗi hoặc thiếu prod-inventory"; fi
kubectl -n $NS rollout status deploy/prod-inventory --timeout=90s >/dev/null 2>&1
chk image "$(j deploy prod-inventory '{.spec.template.spec.containers[0].image}')" "nginx:1.27-alpine"
chk ready-3 "$(j deploy prod-inventory '{.status.readyReplicas}')" "3"
chk service "$(j svc prod-inventory '{.metadata.name}')" "prod-inventory"
if grep -q 'nginx:1.25-alpine' /opt/ckad/lab07/kust/base/deployment.yaml && grep -q 'replicas: 1' /opt/ckad/lab07/kust/base/deployment.yaml; then ok base-untouched; else no base-untouched "base/deployment.yaml đã bị sửa"; fi
echo "RESULT $P/$T"`,
      solution: `~~~bash
mkdir -p /opt/ckad/lab07/kust/overlays/prod
cat > /opt/ckad/lab07/kust/overlays/prod/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namespace: lab07
namePrefix: prod-
images:
- name: nginx
  newTag: 1.27-alpine
replicas:
- name: inventory
  count: 3
EOF
kubectl kustomize /opt/ckad/lab07/kust/overlays/prod     # xem trước
kubectl apply -k /opt/ckad/lab07/kust/overlays/prod
kubectl -n lab07 rollout status deploy/prod-inventory
~~~
**Vì sao:** overlay chỉ mô tả **khác biệt** so với base. {{images}} khớp theo tên image ({{nginx}}) và thay tag ở mọi container dùng nó; {{replicas}} và mọi tham chiếu khác dùng **tên gốc** {{inventory}}, Kustomize tự áp {{namePrefix}} sau đó. Selector của Service không bị đổi vì namePrefix chỉ đổi tên, không đổi label.

**Mẹo tiết kiệm thời gian:** luôn {{kubectl kustomize <dir>}} trước khi {{apply -k}} để thấy lỗi ngay. Có thể tạo nhanh bằng CLI kustomize ({{kustomize edit set image nginx=nginx:1.27-alpine}}) nhưng trong đề thường chỉ có kubectl, nên thuộc cấu trúc YAML trên.`,
      hints: ['resources trỏ về ../../base; namespace và namePrefix là field cấp cao nhất.', 'images: name/newTag; replicas: name/count (tên gốc trong base).'],
      refs: [{ type: 'doc', title: 'Declarative Management of Kubernetes Objects Using Kustomize', url: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/' }],
      tags: ['kustomize', 'overlay', 'images']
    },
    {
      id: 'ckad-lab-07-05', no: 5, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 10,
      title: 'Kustomize configMapGenerator + patch envFrom và rollout khi đổi config',
      task: `Context: {{kubectl config use-context kind-ckad}}

Dùng lại base {{/opt/ckad/lab07/kust/base}} (Deployment {{inventory}}, container {{nginx}}). Tạo overlay {{/opt/ckad/lab07/kust/overlays/staging}}:
- namespace {{lab07}}, tiền tố tên {{staging-}};
- {{configMapGenerator}} tên {{app-config}} với {{LOG_LEVEL=debug}} và {{FEATURE_X=on}};
- một patch file {{env-patch.yaml}} thêm {{envFrom}} tham chiếu ConfigMap {{app-config}} vào container {{nginx}}.

Apply overlay. Sau đó đổi {{LOG_LEVEL}} thành {{info}} **trong overlay** và apply lại: Pod của {{staging-inventory}} phải tự được thay mới và thấy {{LOG_LEVEL=info}}.`,
      setup: `mkdir -p /opt/ckad/lab07/kust/base
cat > /opt/ckad/lab07/kust/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory
  labels:
    app: inventory
spec:
  replicas: 1
  selector:
    matchLabels:
      app: inventory
  template:
    metadata:
      labels:
        app: inventory
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
EOF
cat > /opt/ckad/lab07/kust/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: inventory
spec:
  selector:
    app: inventory
  ports:
  - port: 80
    targetPort: 80
EOF
cat > /opt/ckad/lab07/kust/base/kustomization.yaml <<'EOF'
resources:
- deployment.yaml
- service.yaml
EOF
rm -rf /opt/ckad/lab07/kust/overlays/staging
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab07 delete deploy,svc staging-inventory --ignore-not-found
kubectl -n lab07 get cm -o name | grep '/staging-app-config-' | xargs -r kubectl -n lab07 delete`,
      verify: `NS=lab07; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
K=/opt/ckad/lab07/kust/overlays/staging/kustomization.yaml
if grep -q configMapGenerator $K 2>/dev/null; then ok uses-generator; else no uses-generator "kustomization.yaml không có configMapGenerator"; fi
kubectl -n $NS rollout status deploy/staging-inventory --timeout=90s >/dev/null 2>&1
CM=$(j deploy staging-inventory '{.spec.template.spec.containers[0].envFrom[0].configMapRef.name}')
if echo "$CM" | grep -Eq '^staging-app-config-[a-z0-9]+$'; then ok hashed-configmap-ref; else no hashed-configmap-ref "envFrom trỏ tới '$CM'"; fi
chk log-level-info "$(kubectl -n $NS exec deploy/staging-inventory -- printenv LOG_LEVEL 2>/dev/null)" "info"
chk feature-x "$(kubectl -n $NS exec deploy/staging-inventory -- printenv FEATURE_X 2>/dev/null)" "on"
chk ready "$(j deploy staging-inventory '{.status.updatedReplicas}/{.status.readyReplicas}')" "1/1"
echo "RESULT $P/$T"`,
      solution: `~~~bash
mkdir -p /opt/ckad/lab07/kust/overlays/staging && cd /opt/ckad/lab07/kust/overlays/staging
cat > kustomization.yaml <<'EOF'
resources:
- ../../base
namespace: lab07
namePrefix: staging-
configMapGenerator:
- name: app-config
  literals:
  - LOG_LEVEL=debug
  - FEATURE_X=on
patches:
- path: env-patch.yaml
EOF
cat > env-patch.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory
spec:
  template:
    spec:
      containers:
      - name: nginx
        envFrom:
        - configMapRef:
            name: app-config
EOF
kubectl apply -k .
sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=info/' kustomization.yaml
kubectl apply -k .
kubectl -n lab07 rollout status deploy/staging-inventory
kubectl -n lab07 exec deploy/staging-inventory -- printenv LOG_LEVEL   # info
~~~
**Vì sao:** generator tạo ConfigMap {{staging-app-config-<hash>}} với hash tính từ nội dung, và Kustomize tự sửa {{configMapRef.name}} trong Deployment cho khớp. Đổi {{LOG_LEVEL}} → hash mới → tên mới → pod template đổi → Deployment rollout Pod mới đọc config mới. Nếu dùng ConfigMap tên cố định, env chỉ được đọc lúc container khởi động nên Pod cũ vẫn giữ giá trị cũ. Patch strategic merge khớp container theo {{name: nginx}} nên chỉ thêm {{envFrom}}, không thay cả danh sách container. ConfigMap cũ vẫn còn (rác vô hại), có thể dọn bằng {{kubectl apply -k . --prune}} với label selector.

**Mẹo tiết kiệm thời gian:** patch luôn dùng **tên gốc** {{inventory}} và tên ConfigMap gốc {{app-config}}. Kiểm tra {{kubectl kustomize .}} thấy tên có hash ở cả ConfigMap lẫn envFrom là đúng.`,
      hints: ['configMapGenerator: name + literals; patches: - path: env-patch.yaml', 'Patch dùng tên gốc inventory, container nginx, configMapRef app-config.', 'Đổi literal rồi kubectl apply -k lại: hash đổi nên Pod tự rollout.'],
      tags: ['kustomize', 'configMapGenerator', 'patches']
    },
    {
      id: 'ckad-lab-07-06', no: 6, domain: 'Deployment', level: 'hard', env: 'kind', minutes: 12,
      title: 'Helm upgrade bằng values file + --set, đọc revision',
      task: `Context: {{kubectl config use-context kind-ckad}}

Release {{portal}} (chart {{/opt/ckad/lab07/webapp}}, namespace {{lab07}}) đang chạy 1 replica.
1. Viết values file {{/opt/ckad/lab07/portal-values.yaml}} đặt: {{replicaCount: 3}}, image tag {{1.27-alpine}}, requests {{cpu: 50m}}, {{memory: 64Mi}}, limit {{memory: 128Mi}}.
2. Upgrade {{portal}} dùng file đó **và** thêm {{service.type=NodePort}} bằng {{--set}}; lệnh upgrade phải chờ đến khi các Pod Ready.
3. Ghi số revision hiện tại của release {{portal}} (một con số) vào {{/opt/ckad/lab07-06.txt}}.

Kết quả: Deployment {{portal-webapp}} 3 Pod Ready dùng {{nginx:1.27-alpine}}, Service {{portal-webapp}} kiểu NodePort.`,
      setup: `command -v helm >/dev/null 2>&1 || { echo "Cần cài helm 3: https://helm.sh/docs/intro/install/"; exit 1; }
mkdir -p /opt/ckad/lab07
[ -f /opt/ckad/lab07/webapp/Chart.yaml ] || helm create /opt/ckad/lab07/webapp
kubectl create namespace lab07 --dry-run=client -o yaml | kubectl apply -f -
rm -f /opt/ckad/lab07-06.txt /opt/ckad/lab07/portal-values.yaml
helm -n lab07 uninstall portal --wait >/dev/null 2>&1 || true
helm -n lab07 install portal /opt/ckad/lab07/webapp --set replicaCount=1 --wait --timeout 180s`,
      verify: `NS=lab07; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
if grep -Eq '^replicaCount: *3' /opt/ckad/lab07/portal-values.yaml 2>/dev/null; then ok values-file; else no values-file "portal-values.yaml thiếu replicaCount: 3"; fi
kubectl -n $NS rollout status deploy/portal-webapp --timeout=90s >/dev/null 2>&1
chk image "$(j deploy portal-webapp '{.spec.template.spec.containers[0].image}')" "nginx:1.27-alpine"
chk ready-3 "$(j deploy portal-webapp '{.status.updatedReplicas}/{.status.readyReplicas}')" "3/3"
chk resources "$(j deploy portal-webapp '{.spec.template.spec.containers[0].resources.requests.cpu}/{.spec.template.spec.containers[0].resources.requests.memory}/{.spec.template.spec.containers[0].resources.limits.memory}')" "50m/64Mi/128Mi"
chk svc-nodeport "$(j svc portal-webapp '{.spec.type}')" "NodePort"
REV=$(helm -n $NS list --filter '^portal$' -o json 2>/dev/null | grep -o '"revision":"*[0-9]*' | tr -dc '0-9')
if [ -n "$REV" ] && [ "$REV" -ge 2 ]; then ok upgraded; else no upgraded "revision hiện tại: '$REV'"; fi
chk revision-file "$(tr -d '[:space:]' < /opt/ckad/lab07-06.txt 2>/dev/null)" "$REV"
echo "RESULT $P/$T"`,
      solution: `~~~bash
helm show values /opt/ckad/lab07/webapp | grep -A3 -E '^image:|^resources:'
cat > /opt/ckad/lab07/portal-values.yaml <<'EOF'
replicaCount: 3
image:
  tag: "1.27-alpine"
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    memory: 128Mi
EOF
helm upgrade portal /opt/ckad/lab07/webapp -n lab07 -f /opt/ckad/lab07/portal-values.yaml --set service.type=NodePort --wait --timeout 3m
helm -n lab07 list                     # cột REVISION = 2
helm -n lab07 get values portal        # values người dùng của revision hiện tại
helm -n lab07 list --filter '^portal$' -o json | grep -o '"revision":"*[0-9]*' | tr -dc '0-9' > /opt/ckad/lab07-06.txt
~~~
**Vì sao:** values file phù hợp khi có nhiều key lồng nhau (image, resources) và nên được lưu vào Git; {{--set}} ghi đè lên file nên thích hợp cho một giá trị riêng lẻ. Thứ tự ưu tiên: values mặc định của chart < {{-f}} < {{--set}}. Upgrade không có {{--reuse-values}} nên {{replicaCount=1}} của lần install bị thay bằng 3 trong file. {{--wait}} giữ lệnh đến khi Deployment có đủ Pod Ready, nếu image sai bạn biết ngay thay vì thấy "deployed" giả.

**Mẹo tiết kiệm thời gian:** {{helm get values portal -n lab07 -a}} in toàn bộ values đã tính (gồm mặc định), tiện để đối chiếu đường dẫn key. Đọc revision nhanh nhất là cột REVISION trong {{helm list -n lab07}}.`,
      hints: ['Cấu trúc key xem bằng helm show values: image.tag, resources.requests...', 'helm upgrade <release> <chart> -f file --set key=value --wait', 'helm list -n lab07 có cột REVISION.'],
      tags: ['helm', 'upgrade', 'values']
    }
  ]
},
// ============================================================ MODULE 8
{
  id: 'ckad-lab-08', order: 8,
  title: 'Probes và observability: probe, logs, events, top, debug, API deprecation',
  summary: 'Cấu hình liveness/readiness/startup probe đúng cách, đọc logs (-c, --previous), events, kubectl top với metrics-server, gắn ephemeral container bằng kubectl debug và chuyển manifest dùng API đã bị loại bỏ.',
  concepts: `### Ba loại probe và VÌ SAO cần cả ba
| Probe | Khi fail thì | Dùng cho |
|---|---|---|
| {{readinessProbe}} | Pod bị gỡ khỏi endpoint Service (không restart) | app chưa sẵn sàng nhận request, đang warm-up, mất kết nối DB |
| {{livenessProbe}} | kubelet **restart** container | app treo (deadlock) mà process vẫn sống |
| {{startupProbe}} | restart container; trong lúc chưa pass thì liveness/readiness **bị tắt** | app khởi động chậm (JVM, migrate) |

Mỗi probe có ba kiểu kiểm tra: {{httpGet}} (2xx/3xx là pass), {{tcpSocket}} (mở được port), {{exec}} (exit code 0), và {{grpc}}. Tham số: {{initialDelaySeconds}}, {{periodSeconds}} (mặc định 10), {{timeoutSeconds}} (1), {{failureThreshold}} (3), {{successThreshold}}. Thời gian tối đa cho startup = {{failureThreshold × periodSeconds}}.

**Bẫy kinh điển:** liveness quá gắt với app khởi động chậm → container bị giết trước khi kịp chạy → CrashLoopBackOff vô tận. Cách đúng là thêm startupProbe, không phải nới liveness thật lỏng. Và **đừng** để liveness kiểm tra dependency bên ngoài (DB): DB chậm sẽ làm restart hàng loạt Pod.

### Logs và events
- {{kubectl logs pod -c <container>}} khi Pod nhiều container; {{--previous}} (-p) đọc log của lần chạy **trước** (container đã crash), gần như bắt buộc khi debug CrashLoopBackOff.
- {{kubectl logs -l app=x --all-containers --prefix}} đọc nhiều Pod cùng lúc; {{--since=10m}}, {{--tail=50}}.
- Events: {{kubectl get events --sort-by=.lastTimestamp}}, {{--field-selector reason=Unhealthy}} hoặc phần cuối {{kubectl describe pod}}. Event chỉ giữ khoảng 1 giờ.

### kubectl top và kubectl debug
{{kubectl top pod/node}} cần **metrics-server** (kind không có sẵn; cần cờ {{--kubelet-insecure-tls}} vì kubelet của kind dùng cert tự ký). Image distroless/scratch không có shell: dùng {{kubectl debug -it pod --image=busybox:1.36 --target=<container>}} để thêm **ephemeral container** dùng chung process namespace với container đích (thấy được process, {{/proc/1/root}}). Ephemeral container không xoá được; Pod giữ nó đến khi bị xoá. {{kubectl debug --copy-to}} tạo bản sao Pod để thử nghiệm mà không đụng Pod gốc.

### API deprecation
API beta bị **loại bỏ** sau vài phiên bản: {{networking.k8s.io/v1beta1}} Ingress (gỡ ở 1.22), {{batch/v1beta1}} CronJob (1.25), {{autoscaling/v2beta2}} HPA (1.26). Manifest cũ apply sẽ báo {{no matches for kind ... in version ...}}. Xem version cluster đang phục vụ bằng {{kubectl api-resources}} / {{kubectl api-versions}} / {{kubectl explain <kind>}}. Plugin {{kubectl convert}} không có sẵn trong đề, hãy sửa tay theo {{kubectl explain}}.

### Cheat sheet
~~~bash
kubectl explain pod.spec.containers.startupProbe
kubectl logs batch -c runner --previous
kubectl get events -n ns --sort-by=.lastTimestamp | tail -20
kubectl top pod -n ns --sort-by=cpu
kubectl debug -it mypod --image=busybox:1.36 --target=app -c dbg -- sh
kubectl api-resources | grep -i ingress
kubectl get pod p -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'
~~~`,
  videos: [
    { title: 'Day 18/40 - Kubernetes Health Probes Explained | Liveness vs Readiness Probes', url: 'https://www.youtube.com/watch?v=x2e6pIBLKzw', note: 'Demo liveness/readiness với http, tcp, exec: đúng nội dung bài 1–3.' },
    { title: 'Kubernetes Liveness vs Readiness vs Startup Probes Explained 2026', url: 'https://www.youtube.com/watch?v=6_zxiCqCOPM', note: 'Xem phần startupProbe: vì sao app khởi động chậm bị liveness giết và cách tính failureThreshold × periodSeconds.' },
    { title: 'kubectl debug: Ephemeral Debug Containers for Kubernetes Troubleshooting', url: 'https://www.youtube.com/watch?v=TJozPhWIACY', note: 'Demo kubectl debug với ephemeral container và --target, chuẩn bị cho bài 5.' }
  ],
  tasks: [
    {
      id: 'ckad-lab-08-01', no: 1, domain: 'Observability & Maintenance', level: 'easy', env: 'kind', minutes: 6,
      title: 'Thêm readiness httpGet và liveness tcpSocket',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{frontend}} trong namespace {{lab08}} (container {{nginx}}, port 80) chưa có probe. Thêm vào container {{nginx}}:
- {{readinessProbe}} kiểu httpGet path {{/}} port {{80}}, {{initialDelaySeconds: 3}}, {{periodSeconds: 5}};
- {{livenessProbe}} kiểu tcpSocket port {{80}}, {{periodSeconds: 10}}, {{failureThreshold: 3}}.

Rollout phải hoàn tất với 2 Pod Ready.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab08 delete deploy frontend --ignore-not-found --wait=true
kubectl -n lab08 create deploy frontend --image=nginx:1.25-alpine --replicas=2 --port=80
kubectl -n lab08 expose deploy frontend --port=80 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab08 rollout status deploy/frontend --timeout=120s`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
C='{.spec.template.spec.containers[0]'
kubectl -n $NS rollout status deploy/frontend --timeout=60s >/dev/null 2>&1
chk readiness-http "$(j deploy frontend "$C.readinessProbe.httpGet.path}:$C.readinessProbe.httpGet.port}")" "/:80"
chk readiness-timing "$(j deploy frontend "$C.readinessProbe.initialDelaySeconds}/$C.readinessProbe.periodSeconds}")" "3/5"
chk liveness-tcp "$(j deploy frontend "$C.livenessProbe.tcpSocket.port}")" "80"
chk liveness-timing "$(j deploy frontend "$C.livenessProbe.periodSeconds}/$C.livenessProbe.failureThreshold}")" "10/3"
chk ready "$(j deploy frontend '{.status.updatedReplicas}/{.status.readyReplicas}')" "2/2"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab08 edit deploy frontend
~~~
Thêm vào container {{nginx}}:
~~~yaml
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 3
          periodSeconds: 5
        livenessProbe:
          tcpSocket:
            port: 80
          periodSeconds: 10
          failureThreshold: 3
~~~
~~~bash
kubectl -n lab08 rollout status deploy/frontend
kubectl -n lab08 describe pod -l app=frontend | grep -E 'Liveness|Readiness'
~~~
**Vì sao:** readiness quyết định Pod có nằm trong endpoint của Service {{frontend}} hay không, nên dùng httpGet để chắc nginx thật sự trả 200. Liveness chỉ cần biết process còn nghe port, tcpSocket rẻ hơn và không bị ảnh hưởng nếu trang chủ chậm. Với {{periodSeconds: 10, failureThreshold: 3}}, container chỉ bị restart sau khoảng 30 giây không mở được port, đủ khoan dung với một lần nghẽn ngắn.

**Mẹo tiết kiệm thời gian:** không nhớ cú pháp thì mở trang "Configure Liveness, Readiness and Startup Probes" trên kubernetes.io và copy khối YAML, hoặc {{kubectl explain deploy.spec.template.spec.containers.livenessProbe.tcpSocket}}. Cẩn thận thụt lề: probe nằm cùng cấp với {{image}}.`,
      hints: ['Probe nằm trong spec.template.spec.containers[] cùng cấp với image.', 'tcpSocket chỉ có port; httpGet có path và port.'],
      refs: [{ type: 'doc', title: 'Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' }],
      tags: ['readinessProbe', 'livenessProbe']
    },
    {
      id: 'ckad-lab-08-02', no: 2, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 8,
      title: 'Pod restart liên tục vì livenessProbe sai: đọc events và sửa',
      task: `Context: {{kubectl config use-context kind-ckad}}

Pod của Deployment {{reporter}} (namespace {{lab08}}, container {{reporter}}) cứ khoảng 15 giây lại bị restart.
1. Dùng events để tìm lý do. Ghi **reason** của event cảnh báo về probe (một từ) vào {{/opt/ckad/lab08-02.txt}}.
2. Sửa livenessProbe để nó kiểm tra đúng file mà ứng dụng thực sự tạo ra (xem lệnh khởi động của container). Giữ kiểu exec và các tham số thời gian.
3. Sau khi sửa, Pod mới phải Ready và không bị restart.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab08-02.txt
kubectl -n lab08 delete deploy reporter --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reporter
  namespace: lab08
spec:
  replicas: 1
  selector:
    matchLabels:
      app: reporter
  template:
    metadata:
      labels:
        app: reporter
    spec:
      terminationGracePeriodSeconds: 2
      containers:
      - name: reporter
        image: busybox:1.36
        command: ["sh", "-c", "touch /tmp/healthy; echo reporter started; sleep 36000"]
        livenessProbe:
          exec:
            command: ["cat", "/tmp/ready"]
          initialDelaySeconds: 5
          periodSeconds: 5
          failureThreshold: 2
EOF`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
chk reason-file "$(tr -d '[:space:]' < /opt/ckad/lab08-02.txt 2>/dev/null)" "Unhealthy"
CMD=$(j deploy reporter '{.spec.template.spec.containers[0].livenessProbe.exec.command}')
case "$CMD" in *"/tmp/healthy"*) ok probe-fixed;; *) no probe-fixed "command hiện tại: $CMD";; esac
chk probe-timing "$(j deploy reporter '{.spec.template.spec.containers[0].livenessProbe.periodSeconds}/{.spec.template.spec.containers[0].livenessProbe.failureThreshold}')" "5/2"
kubectl -n $NS rollout status deploy/reporter --timeout=60s >/dev/null 2>&1
sleep 20
RC=$(kubectl -n $NS get pods -l app=reporter -o jsonpath='{range .items[*]}{.status.containerStatuses[0].restartCount}{" "}{end}' 2>/dev/null | tr -d ' ')
chk no-restarts "$RC" "0"
chk ready "$(j deploy reporter '{.status.readyReplicas}')" "1"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab08 get pods -l app=reporter            # RESTARTS tăng dần
kubectl -n lab08 get events --sort-by=.lastTimestamp | grep -i probe
# Warning  Unhealthy  pod/reporter-...  Liveness probe failed: cat: can't open '/tmp/ready': No such file or directory
echo Unhealthy > /opt/ckad/lab08-02.txt
kubectl -n lab08 get deploy reporter -o jsonpath='{.spec.template.spec.containers[0].command}'   # tạo /tmp/healthy
kubectl -n lab08 patch deploy reporter --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/exec/command","value":["cat","/tmp/healthy"]}]'
kubectl -n lab08 rollout status deploy/reporter
~~~
**Vì sao:** kubelet chạy {{cat /tmp/ready}} trong container; file không tồn tại nên exit code khác 0, sau {{failureThreshold: 2}} lần liên tiếp (5 + 2×5 ≈ 15 giây) kubelet ghi event {{Unhealthy}} rồi kill và restart container. Ứng dụng thật ra khoẻ, lỗi là probe kiểm sai file. Sửa probe đổi pod template nên Deployment tạo Pod mới với restartCount 0.

**Mẹo tiết kiệm thời gian:** {{kubectl describe pod}} gom cả lý do lẫn event ở cuối output; với nhiều Pod, {{kubectl get events --field-selector reason=Unhealthy}} lọc ngay. JSON patch {{replace}} sửa đúng một mảng command mà không phải edit cả manifest.`,
      hints: ['kubectl get events --sort-by=.lastTimestamp hoặc phần Events của describe pod.', 'So sánh file mà lệnh khởi động tạo ra với file mà probe đọc.'],
      tags: ['livenessProbe', 'events', 'CrashLoop']
    },
    {
      id: 'ckad-lab-08-03', no: 3, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 8,
      title: 'App khởi động chậm bị liveness giết: thêm startupProbe',
      task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{legacy-app}} (namespace {{lab08}}, container {{app}}) mất khoảng 40 giây để khởi động (tạo file {{/tmp/started}} khi xong) và đang bị restart liên tục.
Thêm {{startupProbe}} kiểu exec chạy {{test -f /tmp/started}} cho container {{app}}, cho phép thời gian khởi động tối đa **ít nhất 60 giây** ({{failureThreshold × periodSeconds ≥ 60}}).
**Không** sửa livenessProbe hiện có ({{periodSeconds: 5}}, {{failureThreshold: 3}}). Pod phải Ready và không restart.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab08 delete deploy legacy-app --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legacy-app
  namespace: lab08
spec:
  replicas: 1
  selector:
    matchLabels:
      app: legacy-app
  template:
    metadata:
      labels:
        app: legacy-app
    spec:
      terminationGracePeriodSeconds: 2
      containers:
      - name: app
        image: busybox:1.36
        command: ["sh", "-c", "echo booting; sleep 40; touch /tmp/started; echo started; sleep 36000"]
        livenessProbe:
          exec:
            command: ["test", "-f", "/tmp/started"]
          periodSeconds: 5
          failureThreshold: 3
EOF`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
C='{.spec.template.spec.containers[0]'
SP=$(j deploy legacy-app "$C.startupProbe.exec.command}")
case "$SP" in *"/tmp/started"*) ok startup-probe;; *) no startup-probe "startupProbe.exec.command: '$SP'";; esac
FT=$(j deploy legacy-app "$C.startupProbe.failureThreshold}"); PS=$(j deploy legacy-app "$C.startupProbe.periodSeconds}")
[ -n "$FT" ] || FT=3
[ -n "$PS" ] || PS=10
if [ $((FT * PS)) -ge 60 ]; then ok startup-budget; else no startup-budget "failureThreshold x periodSeconds = $((FT * PS))s < 60s"; fi
chk liveness-unchanged "$(j deploy legacy-app "$C.livenessProbe.periodSeconds}/$C.livenessProbe.failureThreshold}")" "5/3"
kubectl -n $NS rollout status deploy/legacy-app --timeout=100s >/dev/null 2>&1
chk ready "$(j deploy legacy-app '{.status.updatedReplicas}/{.status.readyReplicas}')" "1/1"
RC=$(kubectl -n $NS get pods -l app=legacy-app -o jsonpath='{range .items[*]}{.status.containerStatuses[0].restartCount}{" "}{end}' 2>/dev/null | tr -d ' ')
chk no-restarts "$RC" "0"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab08 get pods -l app=legacy-app     # CrashLoopBackOff, RESTARTS tăng
kubectl -n lab08 logs deploy/legacy-app         # chỉ thấy "booting"
kubectl -n lab08 edit deploy legacy-app
~~~
Thêm vào container {{app}} (giữ nguyên livenessProbe):
~~~yaml
        startupProbe:
          exec:
            command: ["test", "-f", "/tmp/started"]
          periodSeconds: 5
          failureThreshold: 12      # 12 x 5s = 60s
~~~
~~~bash
kubectl -n lab08 rollout status deploy/legacy-app --timeout=120s
~~~
**Vì sao:** liveness hiện tại cho app tối đa 3 × 5 = 15 giây, trong khi app cần 40 giây, nên bị kill trước khi kịp tạo {{/tmp/started}}: vòng lặp vô tận. Khi có startupProbe, kubelet **tắt** liveness và readiness cho tới khi startupProbe pass lần đầu; startupProbe cho tối đa 60 giây. Sau đó liveness gắt (15 giây) vẫn phát hiện treo nhanh lúc runtime. Nới liveness lên 60 giây cũng "chạy" nhưng làm chậm phát hiện treo suốt vòng đời app.

**Mẹo tiết kiệm thời gian:** copy nguyên khối livenessProbe, đổi tên thành startupProbe và chỉ sửa {{failureThreshold}}: ít gõ, ít sai thụt lề. Với app Java/Spring Boot thật, startupProbe trỏ {{/actuator/health/liveness}} với ngân sách 2–5 phút là phổ biến.`,
      hints: ['startupProbe tạm tắt liveness cho tới khi pass.', 'Ngân sách khởi động = failureThreshold × periodSeconds.'],
      tags: ['startupProbe', 'livenessProbe', 'slow-start']
    },
    {
      id: 'ckad-lab-08-04', no: 4, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 7,
      title: 'Đọc log của lần crash trước trong Pod nhiều container',
      task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{batch-runner}} trong namespace {{lab08}} có hai container: {{runner}} (bị CrashLoopBackOff) và {{shipper}} (chạy bình thường).
Ghi vào {{/opt/ckad/lab08-04.txt}} đúng 2 dòng:
1. Dòng 1: nguyên văn dòng log bắt đầu bằng {{FATAL}} của **lần chạy đã kết thúc gần nhất** của container {{runner}}.
2. Dòng 2: exit code của lần kết thúc đó (chỉ con số).`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab08-04.txt
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: batch-runner
  namespace: lab08
  labels:
    app: batch-runner
spec:
  terminationGracePeriodSeconds: 1
  containers:
  - name: runner
    image: busybox:1.36
    command: ["sh", "-c", "echo attempt at $(date +%T); sleep 5; echo FATAL code=E4271 upstream inventory-db timeout after 3 retries; exit 3"]
  - name: shipper
    image: busybox:1.36
    command: ["sh", "-c", "while true; do echo shipped batch; sleep 10; done"]
EOF
sleep 15
kubectl -n lab08 get pod batch-runner`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
F=/opt/ckad/lab08-04.txt
L1=$(sed -n 1p $F 2>/dev/null | tr -d '\\r')
L2=$(sed -n 2p $F 2>/dev/null | tr -d '[:space:]')
chk fatal-line "$L1" "FATAL code=E4271 upstream inventory-db timeout after 3 retries"
EC=$(kubectl -n $NS get pod batch-runner -o jsonpath='{.status.containerStatuses[?(@.name=="runner")].lastState.terminated.exitCode}' 2>/dev/null)
chk exit-code "$L2" "$EC"
chk exit-code-is-3 "$L2" "3"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab08 get pod batch-runner        # READY 1/2, CrashLoopBackOff
kubectl -n lab08 logs batch-runner -c runner --previous | grep '^FATAL' > /opt/ckad/lab08-04.txt
kubectl -n lab08 get pod batch-runner -o jsonpath='{.status.containerStatuses[?(@.name=="runner")].lastState.terminated.exitCode}' >> /opt/ckad/lab08-04.txt
echo >> /opt/ckad/lab08-04.txt
cat /opt/ckad/lab08-04.txt
~~~
**Vì sao:** Pod có hai container nên phải chỉ rõ {{-c runner}}; nếu không kubectl chọn container mặc định (container đầu tiên, kèm thông báo "Defaulted container"). Khi container đang trong backoff hoặc vừa khởi động lại, log **hiện tại** chỉ có dòng "attempt at ...", còn dòng FATAL thuộc về lần chạy trước: {{--previous}} đọc log đó (kubelet giữ log của đúng một lần chạy trước). Exit code nằm trong {{lastState.terminated}}; {{kubectl describe pod}} cũng hiện "Last State: Terminated, Exit Code: 3".

**Mẹo tiết kiệm thời gian:** dùng redirect {{>}} rồi {{>>}} để ghi file thay vì mở vi; jsonpath filter {{[?(@.name=="runner")]}} tránh nhầm thứ tự container trong {{containerStatuses}}.`,
      hints: ['kubectl logs <pod> -c <container> --previous', 'Exit code ở status.containerStatuses[].lastState.terminated.exitCode.'],
      tags: ['logs', 'previous', 'multi-container']
    },
    {
      id: 'ckad-lab-08-05', no: 5, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 7,
      title: 'kubectl debug: ephemeral container cho image không có shell',
      task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{api-min}} trong namespace {{lab08}} chạy container {{app}} từ image tối giản, không có shell ({{kubectl exec ... sh}} thất bại).
1. Gắn một **ephemeral container** tên {{dbg}}, image {{busybox:1.36}}, dùng chung process namespace với container {{app}}. Không tạo lại hay sao chép Pod.
2. Từ {{dbg}}, xem tiến trình PID 1 của container {{app}} và ghi lệnh (COMMAND) của nó vào {{/opt/ckad/lab08-05.txt}}.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab08-05.txt
kubectl -n lab08 delete pod api-min --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: api-min
  namespace: lab08
spec:
  containers:
  - name: app
    image: registry.k8s.io/pause:3.9
EOF
kubectl -n lab08 wait --for=condition=Ready pod/api-min --timeout=90s`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
chk ephemeral-image "$(j pod api-min '{.spec.ephemeralContainers[?(@.name=="dbg")].image}')" "busybox:1.36"
chk ephemeral-target "$(j pod api-min '{.spec.ephemeralContainers[?(@.name=="dbg")].targetContainerName}')" "app"
chk app-not-restarted "$(j pod api-min '{.status.containerStatuses[0].restartCount}')" "0"
if grep -q pause /opt/ckad/lab08-05.txt 2>/dev/null; then ok pid1-command; else no pid1-command "file không chứa lệnh PID 1 của app"; fi
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl -n lab08 exec api-min -- sh          # lỗi: executable file not found
kubectl -n lab08 debug -it api-min --image=busybox:1.36 --target=app -c dbg -- sh
# trong shell dbg:
ps            # PID 1  65535  0:00 /pause
exit
echo /pause > /opt/ckad/lab08-05.txt
~~~
Cách không tương tác (nhanh khi chỉ cần một lệnh):
~~~bash
kubectl -n lab08 debug api-min --image=busybox:1.36 --target=app -c dbg -- ps
sleep 3; kubectl -n lab08 logs api-min -c dbg
~~~
**Vì sao:** ephemeral container được thêm vào Pod **đang chạy** qua subresource {{ephemeralcontainers}}, không restart Pod. {{--target=app}} cho nó vào process namespace của container {{app}}, nên {{ps}} thấy PID 1 là {{/pause}} và có thể đọc file của app qua {{/proc/1/root/}}. Không có {{--target}} thì {{ps}} chỉ thấy tiến trình của chính dbg. Ephemeral container không có probe/port/resources và không xoá được: nó ở lại tới khi Pod bị xoá.

**Mẹo tiết kiệm thời gian:** nếu đề yêu cầu không động vào Pod gốc thì dùng {{kubectl debug api-min --copy-to=api-min-debug --image=busybox:1.36 --share-processes}}; ở bài này đề yêu cầu ngược lại, nên đọc kỹ chữ "không tạo lại hay sao chép".`,
      hints: ['kubectl debug -it <pod> --image=... --target=<container> -c <tên>', 'ps trong container debug cho thấy PID 1 của container đích.'],
      refs: [{ type: 'doc', title: 'Debug Running Pods', url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/' }],
      tags: ['kubectl-debug', 'ephemeral-container']
    },
    {
      id: 'ckad-lab-08-06', no: 6, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 10,
      title: 'Chuyển manifest dùng API đã bị loại bỏ (Ingress v1beta1, HPA v2beta2)',
      task: `Context: {{kubectl config use-context kind-ckad}}

File {{/opt/ckad/lab08/legacy.yaml}} chứa Ingress {{legacy-ing}} và HorizontalPodAutoscaler {{frontend-hpa}} viết cho cluster cũ; {{kubectl apply}} hiện báo lỗi.
1. Sửa **ngay trong file đó** để dùng API version mà cluster đang phục vụ, giữ nguyên ý nghĩa: Ingress path {{/api}} (pathType {{Prefix}}) tới Service {{frontend}} port {{80}}; HPA cho Deployment {{frontend}}, min 2, max 4, CPU 70%.
2. Apply file vào namespace {{lab08}}.
3. Ghi apiVersion đầy đủ mà cluster ưu tiên cho HorizontalPodAutoscaler vào {{/opt/ckad/lab08-06.txt}}.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/lab08
rm -f /opt/ckad/lab08-06.txt
kubectl -n lab08 delete ingress legacy-ing --ignore-not-found
kubectl -n lab08 delete hpa frontend-hpa --ignore-not-found
cat > /opt/ckad/lab08/legacy.yaml <<'EOF'
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: legacy-ing
  namespace: lab08
spec:
  rules:
  - http:
      paths:
      - path: /api
        backend:
          serviceName: frontend
          servicePort: 80
---
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: lab08
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 4
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
F=/opt/ckad/lab08/legacy.yaml
if [ -s $F ] && ! grep -Eq 'v1beta1|v2beta2' $F; then ok file-migrated; else no file-migrated "legacy.yaml vẫn còn API beta hoặc không tồn tại"; fi
B='{.spec.rules[0].http.paths[0]'
chk ingress-path "$(j ingress legacy-ing "$B.path}|$B.pathType}")" "/api|Prefix"
chk ingress-backend "$(j ingress legacy-ing "$B.backend.service.name}:$B.backend.service.port.number}")" "frontend:80"
chk hpa "$(j hpa frontend-hpa '{.spec.scaleTargetRef.name}/{.spec.minReplicas}/{.spec.maxReplicas}/{.spec.metrics[0].resource.target.averageUtilization}')" "frontend/2/4/70"
chk apiversion-file "$(tr -d '[:space:]' < /opt/ckad/lab08-06.txt 2>/dev/null)" "autoscaling/v2"
echo "RESULT $P/$T"`,
      solution: `~~~bash
kubectl apply -f /opt/ckad/lab08/legacy.yaml   # no matches for kind "Ingress" in version "networking.k8s.io/v1beta1"
kubectl api-resources | grep -Ei 'ingresses|horizontalpod'
kubectl explain hpa | head -3                   # GROUP: autoscaling  VERSION: v2
kubectl explain ingress.spec.rules.http.paths.backend.service
~~~
Sửa file:
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: legacy-ing
  namespace: lab08
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
# phần còn lại giữ nguyên: schema v2beta2 và v2 giống nhau
~~~
~~~bash
kubectl apply -f /opt/ckad/lab08/legacy.yaml
echo autoscaling/v2 > /opt/ckad/lab08-06.txt
~~~
**Vì sao:** Ingress v1 không chỉ đổi version mà đổi cấu trúc: {{serviceName/servicePort}} thành {{service.name/service.port.number}} và {{pathType}} trở thành bắt buộc. HPA {{autoscaling/v2}} có schema giống {{v2beta2}} nên chỉ đổi apiVersion. API beta bị gỡ khỏi server, nên manifest cũ không apply được kể cả khi object tương đương đã tồn tại.

**Mẹo tiết kiệm thời gian:** {{kubectl explain <kind>}} in GROUP/VERSION ưu tiên ở đầu output, nhanh hơn lục docs. Plugin {{kubectl convert}} thường không có trong môi trường thi, đừng phụ thuộc vào nó; xem bảng "Deprecated API Migration Guide" trên kubernetes.io khi cần.`,
      hints: ['kubectl api-resources / kubectl explain cho biết version cluster đang phục vụ.', 'Ingress v1: backend.service.name, backend.service.port.number, pathType bắt buộc.'],
      refs: [{ type: 'doc', title: 'Deprecated API Migration Guide', url: 'https://kubernetes.io/docs/reference/using-api/deprecation-guide/' }, { type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
      tags: ['deprecation', 'ingress', 'hpa']
    },
    {
      id: 'ckad-lab-08-07', no: 7, domain: 'Observability & Maintenance', level: 'hard', env: 'kind', minutes: 13,
      title: 'Tổng hợp: kubectl top tìm Pod ngốn CPU và sửa readiness làm Service rỗng',
      task: `Context: {{kubectl config use-context kind-ckad}}

Setup cài **metrics-server** (cần Internet, đợi 1–2 phút để có số liệu) và tạo trong namespace {{lab08}} các Deployment {{hungry}}, {{calm}}, {{checkout}} cùng Service {{checkout}}.
1. Tìm Pod tiêu thụ **CPU nhiều nhất** trong namespace {{lab08}} và ghi **tên Pod** vào {{/opt/ckad/lab08-07.txt}}.
2. Service {{checkout}} không có endpoint Ready nào. Dùng describe/events tìm nguyên nhân và sửa Deployment {{checkout}} (container {{nginx}}) sao cho cả 2 Pod Ready. **Giữ** readinessProbe kiểu httpGet.
3. Ghi change-cause {{fix readiness port}} cho Deployment {{checkout}}.`,
      setup: `kubectl create namespace lab08 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad 2>/dev/null || true
rm -f /opt/ckad/lab08-07.txt
if ! kubectl -n kube-system get deploy metrics-server >/dev/null 2>&1; then
  kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
fi
if ! kubectl -n kube-system get deploy metrics-server -o jsonpath='{.spec.template.spec.containers[0].args}' | grep -q kubelet-insecure-tls; then
  kubectl -n kube-system patch deploy metrics-server --type=json -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
fi
kubectl -n lab08 delete deploy checkout --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hungry
  namespace: lab08
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hungry
  template:
    metadata:
      labels:
        app: hungry
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: burn
        image: busybox:1.36
        command: ["sh", "-c", "while true; do :; done"]
        resources:
          requests:
            cpu: 100m
          limits:
            cpu: 300m
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calm
  namespace: lab08
spec:
  replicas: 2
  selector:
    matchLabels:
      app: calm
  template:
    metadata:
      labels:
        app: calm
    spec:
      terminationGracePeriodSeconds: 1
      containers:
      - name: idle
        image: busybox:1.36
        command: ["sleep", "86400"]
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: checkout
  namespace: lab08
spec:
  replicas: 2
  selector:
    matchLabels:
      app: checkout
  template:
    metadata:
      labels:
        app: checkout
    spec:
      containers:
      - name: nginx
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          periodSeconds: 5
        livenessProbe:
          tcpSocket:
            port: 80
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: checkout
  namespace: lab08
spec:
  selector:
    app: checkout
  ports:
  - port: 80
    targetPort: 80
EOF
kubectl -n kube-system rollout status deploy/metrics-server --timeout=180s || true`,
      verify: `NS=lab08; P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
no() { T=$((T+1)); echo "FAIL $1: $2"; }
chk() { if [ "$2" = "$3" ]; then ok "$1"; else no "$1" "mong đợi '$3', thực tế '$2'"; fi; }
j() { kubectl -n $NS get "$1" "$2" -o jsonpath="$3" 2>/dev/null; }
POD=$(tr -d '[:space:]' < /opt/ckad/lab08-07.txt 2>/dev/null)
if [ -n "$POD" ] && [ "$(j pod "$POD" '{.metadata.labels.app}')" = "hungry" ]; then ok top-cpu-pod; else no top-cpu-pod "file chứa '$POD', không phải Pod hungry đang chạy"; fi
kubectl -n $NS rollout status deploy/checkout --timeout=60s >/dev/null 2>&1
H=$(j deploy checkout '{.spec.template.spec.containers[0].readinessProbe.httpGet.path}')
if [ -n "$H" ]; then ok readiness-still-http; else no readiness-still-http "readinessProbe httpGet đã bị bỏ"; fi
chk checkout-ready "$(j deploy checkout '{.status.updatedReplicas}/{.status.readyReplicas}')" "2/2"
EP=$(kubectl -n $NS get endpointslices -l kubernetes.io/service-name=checkout -o jsonpath='{range .items[*].endpoints[*]}{.conditions.ready}{" "}{end}' 2>/dev/null | grep -o true | wc -l | tr -d ' ')
chk service-endpoints "$EP" "2"
chk change-cause "$(j deploy checkout '{.metadata.annotations.kubernetes\\.io/change-cause}')" "fix readiness port"
echo "RESULT $P/$T"`,
      solution: `Phần 1, metrics:
~~~bash
kubectl top pod -n lab08 --sort-by=cpu        # nếu "metrics not available yet" thì đợi thêm
kubectl top pod -n lab08 --sort-by=cpu --no-headers | head -1 | awk '{print $1}' > /opt/ckad/lab08-07.txt
~~~
Phần 2, readiness:
~~~bash
kubectl -n lab08 get endpointslices -l kubernetes.io/service-name=checkout   # endpoint ready=false
kubectl -n lab08 describe pod -l app=checkout | grep -i readiness
# Readiness probe failed: Get "http://10.244.x.y:8080/": dial tcp ...:8080: connect: connection refused
kubectl -n lab08 patch deploy checkout --type=json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/port","value":80}]'
kubectl -n lab08 annotate deploy/checkout kubernetes.io/change-cause="fix readiness port" --overwrite
kubectl -n lab08 rollout status deploy/checkout
~~~
**Vì sao:** {{kubectl top}} đọc Metrics API do metrics-server cung cấp (kind cần {{--kubelet-insecure-tls}}), {{--sort-by=cpu}} đặt Pod ngốn CPU lên đầu: Pod {{hungry}} chạy vòng lặp bận, bị limit ở khoảng 300m. Ở phần 2, nginx nghe port 80 nhưng readiness gọi 8080 nên connection refused: Pod chạy (liveness tcp 80 vẫn pass) nhưng không bao giờ Ready, EndpointSlice có địa chỉ với {{ready: false}} nên Service không gửi traffic. Sửa port của probe là đủ; bỏ probe sẽ làm Service gửi traffic vào Pod chưa sẵn sàng.

**Mẹo tiết kiệm thời gian:** {{--no-headers | head -1 | awk}} ghi tên Pod vào file không cần copy tay. Khi Service "không có endpoint", kiểm tra theo thứ tự: selector khớp label? Pod Ready? targetPort đúng port container? Ba câu hỏi này giải quyết hầu hết bài networking/observability.`,
      hints: ['kubectl top pod -n lab08 --sort-by=cpu (đợi metrics-server có số liệu).', 'Readiness gọi port nào, nginx nghe port nào?', 'Annotation kubernetes.io/change-cause với --overwrite.'],
      tags: ['kubectl-top', 'metrics-server', 'readinessProbe', 'endpoints']
    }
  ]
}
);
