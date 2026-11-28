/* CKAD hands-on mock exam 3 (docs/CKAD-MOCK.md) — killer.sh-level difficulty, original tasks (T2840). */
(function () {
  'use strict';
  // Shared verify prologue: ok/ko counters, every verify ends with "RESULT passed/total".
  const H = `P=0; T=0
ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }
ko() { T=$((T+1)); echo "FAIL $1: $2"; }
`;
  const CTX = 'Context: {{kubectl config use-context kind-ckad}}\n\n';

  (window.CKAD_EXAMS = window.CKAD_EXAMS || []).push({
    id: 'ckad-3',
    title: 'Đề thi thử CKAD thực hành số 3',
    minutes: 120,
    passPct: 66,
    intro: `**Đề số 3 khó hơn đề thi CKAD bình thường** (mức killer.sh): nhiều namespace trong cùng một bài, sửa file YAML hỏng có sẵn trên đĩa, xuất kết quả ra file đúng định dạng, debug ứng dụng hỏng nhiều lớp. 17 bài, 120 phút, đậu khi đạt 66%. Nếu bạn làm kịp 70% trong 2 giờ thì yên tâm đi thi. Đây là đề tự soạn để luyện kỹ năng, không phải câu hỏi của kỳ thi chính thức.

### Môi trường: một cluster kind tên ckad

Tạo file {{kind-ckad.yaml}} (1 control-plane + 2 worker, tắt CNI mặc định để cài Calico, gắn nhãn cho ingress-nginx):

~~~yaml
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
kind create cluster --config kind-ckad.yaml          # context: kind-ckad
# Calico: CNI mặc định của kind KHÔNG thực thi NetworkPolicy (bài 9 cần)
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/calico.yaml
kubectl -n kube-system rollout status ds/calico-node --timeout=300s
# ingress-nginx bản dành cho kind (bài 14 cần)
kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
kubectl -n ingress-nginx wait --for=condition=Ready pod -l app.kubernetes.io/component=controller --timeout=180s
# Helm 3 (bài 3 cần)
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
# thư mục đáp án: mọi file kết quả nằm dưới /opt/ckad
sudo mkdir -p /opt/ckad && sudo chown "$(id -u):$(id -g)" /opt/ckad
~~~

### Alias nên gõ ngay khi vào phòng thi

~~~bash
alias k=kubectl
export do="--dry-run=client -o yaml"     # k create deploy x --image=nginx $do > x.yaml
export now="--force --grace-period 0"    # k delete pod x $now
~~~

### Cách làm từng bài

1. Chép script **setup** của bài vào file (ví dụ {{setup.sh}}) rồi chạy {{bash setup.sh}}. Setup idempotent: chạy lại sẽ đưa bài về trạng thái ban đầu.
2. Làm bài như trong phòng thi: chỉ dùng terminal và tài liệu kubernetes.io, helm.sh.
3. Chạy script **verify**: mỗi tiêu chí in {{PASS tên}} hoặc {{FAIL tên: chi tiết}}, dòng cuối {{RESULT đạt/tổng}}. Verify kiểm **hành vi** (pod Ready, curl qua Service/Ingress, {{kubectl auth can-i}}, nội dung file) chứ không chỉ kiểm YAML.
4. Mọi namespace của đề bắt đầu bằng {{m3-}}; dọn sau khi luyện: {{kubectl get ns -o name | grep m3- | xargs kubectl delete}}.

> Mẹo: đề thật có nhiều context, luôn chạy dòng Context đầu mỗi bài (ở đây đều là kind-ckad) và để ý namespace. Bài khó, điểm thấp thì để sau; đánh dấu và quay lại.`,
    tasks: [
      // ---------------------------------------------------------------- 01 Job
      {
        id: 'ckad-3-01', no: 1, domain: 'Design & Build', weight: 6, env: 'kind', minutes: 6,
        title: 'Job chạy song song có giới hạn thời gian và retry, gom log ra file',
        task: CTX + `Team báo cáo cần một Job chạy 6 lần thành công, mỗi lúc tối đa 2 pod song song.

Trong namespace {{m3-batch}} tạo Job {{report-gen}}:
- image {{busybox:1.36}}, container tên {{report}}, lệnh {{sh -c "echo report $(hostname); sleep 2"}}
- {{completions: 6}}, {{parallelism: 2}}, {{backoffLimit: 3}}, {{activeDeadlineSeconds: 120}}
- {{restartPolicy: Never}}

Đợi Job hoàn tất, sau đó ghi log của **tất cả** pod thuộc Job vào file {{/opt/ckad/m3-01/logs.txt}} (mỗi pod một dòng {{report <tên pod>}}).`,
        setup: `kubectl create ns m3-batch --dry-run=client -o yaml | kubectl apply -f -
kubectl delete job report-gen -n m3-batch --ignore-not-found
mkdir -p /opt/ckad/m3-01
rm -f /opt/ckad/m3-01/logs.txt`,
        verify: H + `NS=m3-batch
J=$(kubectl get job report-gen -n $NS -o jsonpath='{.spec.completions} {.spec.parallelism} {.spec.backoffLimit} {.spec.activeDeadlineSeconds}' 2>/dev/null)
[ "$J" = "6 2 3 120" ] && ok job-spec || ko job-spec "completions/parallelism/backoffLimit/activeDeadlineSeconds = '$J'"
C=$(kubectl get job report-gen -n $NS -o jsonpath='{.spec.template.spec.containers[0].name} {.spec.template.spec.containers[0].image} {.spec.template.spec.restartPolicy}' 2>/dev/null)
[ "$C" = "report busybox:1.36 Never" ] && ok container || ko container "got '$C'"
kubectl wait --for=condition=complete job/report-gen -n $NS --timeout=90s >/dev/null 2>&1 && ok complete || ko complete "Job chưa Complete"
S=$(kubectl get job report-gen -n $NS -o jsonpath='{.status.succeeded}' 2>/dev/null)
[ "$S" = "6" ] && ok succeeded || ko succeeded "succeeded=$S"
N=$(grep -c '^report ' /opt/ckad/m3-01/logs.txt 2>/dev/null)
[ "$N" -ge 6 ] 2>/dev/null && ok logs-file || ko logs-file "cần ≥ 6 dòng 'report ...', có '$N'"
echo "RESULT $P/$T"`,
        solution: `**Ý chính:** {{kubectl create job}} không có flag cho completions/parallelism, nên sinh YAML rồi thêm field.

~~~bash
kubectl config use-context kind-ckad
kubectl create job report-gen -n m3-batch --image=busybox:1.36 $do \\
  -- sh -c 'echo report $(hostname); sleep 2' > /opt/ckad/m3-01/job.yaml
~~~

~~~yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: report-gen
  namespace: m3-batch
spec:
  completions: 6
  parallelism: 2
  backoffLimit: 3
  activeDeadlineSeconds: 120
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: report          # create job đặt tên = tên job, phải sửa thành report
        image: busybox:1.36
        command: ["sh", "-c", "echo report $(hostname); sleep 2"]
~~~

~~~bash
kubectl apply -f /opt/ckad/m3-01/job.yaml
kubectl wait --for=condition=complete job/report-gen -n m3-batch --timeout=120s
kubectl logs -n m3-batch -l job-name=report-gen --tail=-1 > /opt/ckad/m3-01/logs.txt
~~~

**Vì sao:** {{activeDeadlineSeconds}} giới hạn thời gian của **cả Job** (hết hạn thì mọi pod bị dừng, Job Failed với reason DeadlineExceeded), còn {{backoffLimit}} giới hạn số lần retry pod lỗi. Pod của Job tự có nhãn {{job-name}} (và {{batch.kubernetes.io/job-name}}), nên {{kubectl logs -l}} gom được log mọi pod. Khi dùng {{-l}}, kubectl chỉ lấy 10 dòng cuối mỗi pod nếu không đặt {{--tail}}.

> Mẹo tiết kiệm thời gian: {{kubectl explain job.spec --recursive | less}} để tra tên field thay vì mở docs; tên container mặc định của create job là tên job, đề hay bắt đổi tên container.`,
        refs: [{ type: 'doc', title: 'Jobs', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' }],
        tags: ['job', 'completions', 'parallelism', 'logs'],
      },
      // ---------------------------------------------------------------- 02 Service fix
      {
        id: 'ckad-3-02', no: 2, domain: 'Services & Networking', weight: 6, env: 'kind', minutes: 7,
        title: 'Service không tới được pod: sai selector và targetPort',
        task: CTX + `Trong namespace {{m3-svc}}, Deployment {{payments}} (image {{nginxinc/nginx-unprivileged:1.27-alpine}}, nghe cổng 8080) đang chạy, nhưng gọi {{http://payments-svc.m3-svc:80}} từ pod khác bị lỗi.

1. Sửa Service {{payments-svc}} để nó chuyển traffic cổng **80** tới **đúng và chỉ** các pod của Deployment {{payments}}. **Không** sửa Deployment {{payments}}, không xoá Deployment {{payment-mock}}.
2. Ghi các IP endpoint của {{payments-svc}} sau khi sửa vào {{/opt/ckad/m3-02/endpoints.txt}}, mỗi IP một dòng, sắp xếp tăng dần.

Verify sẽ tạo một pod busybox tạm trong {{m3-svc}} để gọi Service.`,
        setup: `kubectl create ns m3-svc --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-02 && rm -f /opt/ckad/m3-02/endpoints.txt
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payments
  namespace: m3-svc
spec:
  replicas: 2
  selector:
    matchLabels:
      app: payments
  template:
    metadata:
      labels:
        app: payments
        tier: backend
    spec:
      containers:
      - name: web
        image: nginxinc/nginx-unprivileged:1.27-alpine
        ports:
        - name: http
          containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-mock
  namespace: m3-svc
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment
  template:
    metadata:
      labels:
        app: payment
    spec:
      containers:
      - name: mock
        image: busybox:1.36
        command: ["sh", "-c", "sleep 86400"]
---
apiVersion: v1
kind: Service
metadata:
  name: payments-svc
  namespace: m3-svc
spec:
  selector:
    app: payment
  ports:
  - port: 80
    targetPort: 80
EOF`,
        verify: H + `NS=m3-svc
kubectl rollout status deploy/payments -n $NS --timeout=90s >/dev/null 2>&1
SEL=$(kubectl get svc payments-svc -n $NS -o jsonpath='{.spec.selector.app}' 2>/dev/null)
[ "$SEL" = "payments" ] && ok selector || ko selector "selector app='$SEL'"
PT=$(kubectl get svc payments-svc -n $NS -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)
[ "$PT" = "80" ] && ok port-80 || ko port-80 "port=$PT"
EXP=$(kubectl get pods -n $NS -l app=payments -o jsonpath='{range .items[*]}{.status.podIP}{"\\n"}{end}' | sort)
GOT=$(kubectl get endpoints payments-svc -n $NS -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\\n"}{end}' 2>/dev/null | sort)
[ -n "$GOT" ] && [ "$GOT" = "$EXP" ] && ok endpoints || ko endpoints "endpoints phải đúng IP các pod payments"
kubectl delete pod m3-02-check -n $NS --ignore-not-found >/dev/null 2>&1
OUT=$(kubectl run m3-02-check -n $NS --image=busybox:1.36 --restart=Never --rm -i --quiet -- wget -qO- -T 5 http://payments-svc:80 2>&1)
echo "$OUT" | grep -qi "welcome to nginx" && ok http || ko http "không gọi được http://payments-svc:80"
F=$(sort /opt/ckad/m3-02/endpoints.txt 2>/dev/null | sed '/^$/d')
[ -n "$F" ] && [ "$F" = "$EXP" ] && ok endpoints-file || ko endpoints-file "file phải chứa đúng các IP endpoint"
echo "RESULT $P/$T"`,
        solution: `**Hai lỗi chồng nhau:** selector {{app: payment}} khớp nhầm pod {{payment-mock}} (nên Endpoints KHÔNG rỗng, dễ tưởng đúng), và {{targetPort: 80}} trong khi nginx-unprivileged nghe 8080.

~~~bash
kubectl config use-context kind-ckad
kubectl get svc payments-svc -n m3-svc -o wide
kubectl get endpoints payments-svc -n m3-svc          # IP của pod mock, không phải payments
kubectl get pods -n m3-svc --show-labels -o wide
kubectl patch svc payments-svc -n m3-svc --type=merge \\
  -p '{"spec":{"selector":{"app":"payments"},"ports":[{"port":80,"targetPort":8080}]}}'
kubectl get endpoints payments-svc -n m3-svc -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\\n"}{end}' \\
  | sort -V > /opt/ckad/m3-02/endpoints.txt
kubectl run tmp -n m3-svc --image=busybox:1.36 --restart=Never --rm -i -- wget -qO- -T 5 http://payments-svc
~~~

**Vì sao:** Service chỉ là selector + bảng cổng; kube-proxy chuyển {{port}} của Service sang {{targetPort}} trên pod. Selector khớp **bất kỳ** pod nào có đủ nhãn, kể cả pod của Deployment khác, nên luôn đối chiếu IP trong Endpoints với {{kubectl get pods -o wide}}. Merge patch thay **toàn bộ** mảng {{ports}}, nên ghi đủ port và targetPort. Có thể dùng {{targetPort: http}} (tên cổng của container) để không phụ thuộc số cổng.

> Mẹo tiết kiệm thời gian: debug Service theo thứ tự cố định: {{get endpoints}} (rỗng hay sai IP?) rồi so selector với {{--show-labels}}, rồi targetPort với {{containerPort}}, cuối cùng mới curl từ pod tạm.`,
        refs: [{ type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
        tags: ['service', 'selector', 'targetPort', 'endpoints', 'troubleshooting'],
      },
      // ---------------------------------------------------------------- 03 Helm
      {
        id: 'ckad-3-03', no: 3, domain: 'Deployment', weight: 6, env: 'kind', minutes: 7,
        title: 'Helm: tìm revision tốt, rollback rồi upgrade với file values',
        task: CTX + `Trong namespace {{m3-helm}} có Helm release {{shop-web}} cài từ chart local {{/opt/ckad/m3-03/webchart}}. Lần upgrade gần nhất đã làm hỏng ứng dụng (pod không chạy được).

1. Tìm revision **gần nhất đã chạy tốt** của release và ghi **chỉ số revision** vào {{/opt/ckad/m3-03/good-revision.txt}}.
2. Rollback release {{shop-web}} về revision đó.
3. Sau đó upgrade release {{shop-web}} bằng file values {{/opt/ckad/m3-03/values-prod.yaml}} và đặt thêm {{image.tag=1.27-alpine}}.

Kết quả: Deployment {{shop-web-webchart}} có 3 replica Ready, image {{nginx:1.27-alpine}}, resources lấy từ values-prod.yaml; lịch sử release còn dấu vết rollback.`,
        setup: `mkdir -p /opt/ckad/m3-03
[ -d /opt/ckad/m3-03/webchart ] || helm create /opt/ckad/m3-03/webchart >/dev/null
cat > /opt/ckad/m3-03/values-prod.yaml <<'EOF'
replicaCount: 3
service:
  type: ClusterIP
  port: 80
resources:
  requests:
    cpu: 50m
    memory: 64Mi
  limits:
    cpu: 200m
    memory: 128Mi
EOF
rm -f /opt/ckad/m3-03/good-revision.txt
kubectl create ns m3-helm --dry-run=client -o yaml | kubectl apply -f -
helm uninstall shop-web -n m3-helm --wait >/dev/null 2>&1 || true
helm install shop-web /opt/ckad/m3-03/webchart -n m3-helm --set replicaCount=1 --set image.tag=1.27-alpine --wait --timeout 3m
helm upgrade shop-web /opt/ckad/m3-03/webchart -n m3-helm --set replicaCount=1 --set image.tag=1.27-alpne
helm history shop-web -n m3-helm`,
        verify: H + `NS=m3-helm
G=$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-03/good-revision.txt 2>/dev/null)
[ "$G" = "1" ] && ok good-revision || ko good-revision "file chứa '$G'"
helm history shop-web -n $NS 2>/dev/null | grep -q "Rollback to 1" && ok rollback || ko rollback "history không có 'Rollback to 1'"
ST=$(helm status shop-web -n $NS 2>/dev/null)
REV=$(echo "$ST" | awk '/^REVISION:/{print $2}')
echo "$ST" | grep -q "STATUS: deployed" && [ "$REV" -ge 4 ] 2>/dev/null && ok upgraded || ko upgraded "cần revision ≥ 4 trạng thái deployed (đang $REV)"
kubectl rollout status deploy/shop-web-webchart -n $NS --timeout=120s >/dev/null 2>&1
R=$(kubectl get deploy shop-web-webchart -n $NS -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
[ "$R" = "3" ] && ok replicas || ko replicas "readyReplicas=$R"
I=$(kubectl get deploy shop-web-webchart -n $NS -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)
[ "$I" = "nginx:1.27-alpine" ] && ok image || ko image "image=$I"
RC=$(kubectl get deploy shop-web-webchart -n $NS -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu}' 2>/dev/null)
[ "$RC" = "50m" ] && ok values-file || ko values-file "requests.cpu=$RC (chưa dùng values-prod.yaml?)"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
helm list -n m3-helm
helm history shop-web -n m3-helm
# REVISION 1 deployed->superseded "Install complete", REVISION 2 "Upgrade complete" nhưng pod ImagePullBackOff
helm get values shop-web -n m3-helm --revision 2     # image.tag: 1.27-alpne (gõ sai)
kubectl get pods -n m3-helm                          # xác nhận ErrImagePull
echo 1 > /opt/ckad/m3-03/good-revision.txt
helm rollback shop-web 1 -n m3-helm --wait           # tạo revision 3 "Rollback to 1"
helm upgrade shop-web /opt/ckad/m3-03/webchart -n m3-helm \\
  -f /opt/ckad/m3-03/values-prod.yaml --set image.tag=1.27-alpine --wait
helm history shop-web -n m3-helm                     # revision 4 deployed
kubectl get deploy shop-web-webchart -n m3-helm
~~~

**Vì sao:** Helm đánh dấu revision là "deployed" ngay khi gửi manifest thành công (không có {{--wait}}), nên trạng thái "superseded/deployed" **không** chứng minh app chạy được: phải xem {{helm get values --revision}} và pod thật. Rollback **không xoá** lịch sử mà tạo revision mới (3) có mô tả "Rollback to 1". Upgrade không có {{--reuse-values}} sẽ lấy values mặc định của chart + {{-f}} + {{--set}} ({{--set}} ưu tiên cao nhất), nên replicaCount=3 và resources đến từ values-prod.yaml. Tên Deployment = {{<release>-<chart>}} theo helper fullname của chart do {{helm create}} sinh.

> Mẹo tiết kiệm thời gian: luôn thêm {{-n <namespace>}} cho mọi lệnh helm (helm không dùng namespace của context nếu bạn chưa đặt), và {{--wait}} để biết ngay upgrade có lên được không.`,
        tags: ['helm', 'rollback', 'upgrade', 'values'],
      },
      // ---------------------------------------------------------------- 04 RBAC
      {
        id: 'ckad-3-04', no: 4, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 7,
        title: 'ServiceAccount + Role/RoleBinding tối thiểu, kiểm bằng kubectl auth can-i',
        task: CTX + `Trong namespace {{m3-rbac}}, Deployment {{release-agent}} đang chạy với ServiceAccount {{default}}. Nó cần quyền tối thiểu để cập nhật Deployment.

1. Tạo ServiceAccount {{deploy-bot}}.
2. Tạo Role {{deploy-manager}}: với {{deployments}} (API group {{apps}}) được {{get, list, watch, update, patch}}; với {{pods}} được {{get, list}}; với {{pods/log}} được {{get}}. Không thêm quyền nào khác.
3. Tạo RoleBinding {{deploy-bot-binding}} gán Role trên cho ServiceAccount {{deploy-bot}}.
4. Cho Deployment {{release-agent}} chạy bằng ServiceAccount {{deploy-bot}}.
5. Ghi output của lệnh kiểm tra "ServiceAccount deploy-bot có được **xoá** deployments trong m3-rbac không" vào {{/opt/ckad/m3-04/can-delete.txt}}, và danh sách toàn bộ quyền của nó trong m3-rbac ({{kubectl auth can-i --list}}) vào {{/opt/ckad/m3-04/perms.txt}}.`,
        setup: `kubectl create ns m3-rbac --dry-run=client -o yaml | kubectl apply -f -
kubectl delete rolebinding deploy-bot-binding -n m3-rbac --ignore-not-found
kubectl delete role deploy-manager -n m3-rbac --ignore-not-found
kubectl delete sa deploy-bot -n m3-rbac --ignore-not-found
kubectl delete deploy release-agent -n m3-rbac --ignore-not-found
kubectl create deploy release-agent -n m3-rbac --image=busybox:1.36 -- sh -c "sleep 86400"
mkdir -p /opt/ckad/m3-04 && rm -f /opt/ckad/m3-04/can-delete.txt /opt/ckad/m3-04/perms.txt`,
        verify: H + `NS=m3-rbac
AS=system:serviceaccount:m3-rbac:deploy-bot
can() { kubectl auth can-i "$@" -n $NS --as=$AS 2>/dev/null; }
[ "$(can patch deployments.apps)" = "yes" ] && [ "$(can watch deployments.apps)" = "yes" ] && ok patch-deploy || ko patch-deploy "deploy-bot phải patch/watch được deployments"
[ "$(can list pods)" = "yes" ] && [ "$(can get pods/log)" = "yes" ] && ok read-pods || ko read-pods "deploy-bot phải list pods và get pods/log"
[ "$(can delete deployments.apps)" = "no" ] && [ "$(can create pods)" = "no" ] && [ "$(can get secrets)" = "no" ] && ok least-privilege || ko least-privilege "có quyền thừa (delete deployments / create pods / get secrets)"
RR=$(kubectl get rolebinding deploy-bot-binding -n $NS -o jsonpath='{.roleRef.kind}/{.roleRef.name}' 2>/dev/null)
[ "$RR" = "Role/deploy-manager" ] && ok rolebinding || ko rolebinding "roleRef=$RR"
SA=$(kubectl get deploy release-agent -n $NS -o jsonpath='{.spec.template.spec.serviceAccountName}' 2>/dev/null)
kubectl rollout status deploy/release-agent -n $NS --timeout=60s >/dev/null 2>&1
PSA=$(kubectl get pods -n $NS -l app=release-agent --field-selector=status.phase=Running -o jsonpath='{.items[*].spec.serviceAccountName}' 2>/dev/null)
[ "$SA" = "deploy-bot" ] && echo "$PSA" | grep -q deploy-bot && ok deployment-sa || ko deployment-sa "serviceAccountName=$SA"
[ "$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-04/can-delete.txt 2>/dev/null)" = "no" ] && ok can-delete-file || ko can-delete-file "file phải chứa 'no'"
grep -q "deployments.apps" /opt/ckad/m3-04/perms.txt 2>/dev/null && ok perms-file || ko perms-file "perms.txt thiếu deployments.apps"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl create sa deploy-bot -n m3-rbac
kubectl create role deploy-manager -n m3-rbac \\
  --verb=get,list,watch,update,patch --resource=deployments.apps
# create role không gộp được verb khác nhau cho từng resource -> thêm rule bằng edit
kubectl edit role deploy-manager -n m3-rbac
~~~

~~~yaml
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
~~~

~~~bash
kubectl create rolebinding deploy-bot-binding -n m3-rbac --role=deploy-manager --serviceaccount=m3-rbac:deploy-bot
kubectl set serviceaccount deploy/release-agent deploy-bot -n m3-rbac
kubectl auth can-i delete deployments -n m3-rbac --as=system:serviceaccount:m3-rbac:deploy-bot > /opt/ckad/m3-04/can-delete.txt
kubectl auth can-i --list -n m3-rbac --as=system:serviceaccount:m3-rbac:deploy-bot > /opt/ckad/m3-04/perms.txt
~~~

**Vì sao:** RBAC chỉ cộng quyền, không có "deny": quyền thừa chỉ đến từ rule thừa. {{pods/log}} là **subresource** nên phải khai riêng; có {{get pods}} chưa chắc đọc được log. Username của ServiceAccount có dạng {{system:serviceaccount:<ns>:<name>}}, đúng chuỗi {{--as}} dùng để giả lập. Đổi serviceAccountName làm thay đổi pod template nên Deployment rollout pod mới (token mới được mount).

> Mẹo tiết kiệm thời gian: {{kubectl create role}} với nhiều {{--resource}} sẽ áp **cùng** bộ verb cho mọi resource; khi verb khác nhau hãy tạo bằng $do rồi sửa YAML, hoặc edit thêm rule như trên. {{kubectl auth can-i}} in yes/no ra stdout nên ghi file trực tiếp được.`,
        refs: [{ type: 'doc', title: 'Using RBAC Authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' }],
        tags: ['rbac', 'serviceaccount', 'auth can-i'],
      },
      // ---------------------------------------------------------------- 05 OOMKilled
      {
        id: 'ckad-3-05', no: 5, domain: 'Observability & Maintenance', weight: 6, env: 'kind', minutes: 7,
        title: 'Pod restart liên tục vì OOMKilled: đọc lastState bằng jsonpath rồi chỉnh memory',
        task: CTX + `Deployment {{thumbnailer}} trong namespace {{m3-oom}} (container {{worker}}, image {{polinux/stress}}) restart liên tục. Ứng dụng cần khoảng 150 MiB RAM khi chạy.

1. Dùng {{kubectl}} lấy trạng thái **lần chạy trước** của container {{worker}}: ghi **lý do** kết thúc (termination reason) vào {{/opt/ckad/m3-oom/reason.txt}} và **exit code** vào {{/opt/ckad/m3-oom/exit-code.txt}} (mỗi file chỉ một giá trị).
2. Sửa Deployment để ứng dụng chạy ổn định: memory request {{200Mi}}, memory limit {{256Mi}}. Không đổi CPU, không đổi lệnh/tham số của container.

Kết quả: pod mới Ready và không restart.`,
        setup: `kubectl create ns m3-oom --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-oom && rm -f /opt/ckad/m3-oom/reason.txt /opt/ckad/m3-oom/exit-code.txt
kubectl delete deploy thumbnailer -n m3-oom --ignore-not-found --wait=true
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thumbnailer
  namespace: m3-oom
spec:
  replicas: 1
  selector:
    matchLabels:
      app: thumbnailer
  template:
    metadata:
      labels:
        app: thumbnailer
    spec:
      containers:
      - name: worker
        image: polinux/stress
        command: ["stress"]
        args: ["--vm", "1", "--vm-bytes", "150M", "--vm-hang", "1"]
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 100Mi
EOF`,
        verify: H + `NS=m3-oom
[ "$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-oom/reason.txt)" = "OOMKilled" ] && ok reason-file || ko reason-file "reason.txt phải là termination reason"
[ "$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-oom/exit-code.txt)" = "137" ] && ok exit-code-file || ko exit-code-file "exit-code.txt sai"
R=$(kubectl get deploy thumbnailer -n $NS -o jsonpath='{.spec.template.spec.containers[0].resources.requests.memory} {.spec.template.spec.containers[0].resources.limits.memory} {.spec.template.spec.containers[0].resources.requests.cpu} {.spec.template.spec.containers[0].resources.limits.cpu}' 2>/dev/null)
[ "$R" = "200Mi 256Mi 50m 200m" ] && ok resources || ko resources "requests/limits='$R'"
kubectl get deploy thumbnailer -n $NS -o jsonpath='{.spec.template.spec.containers[0].args}' 2>/dev/null | grep -q "150M" && ok args-unchanged || ko args-unchanged "tham số container bị đổi"
kubectl rollout status deploy/thumbnailer -n $NS --timeout=120s >/dev/null 2>&1 && ok rollout || ko rollout "rollout chưa xong"
sleep 15
L=$(kubectl get pods -n $NS -l app=thumbnailer -o jsonpath='{range .items[*]}{.status.containerStatuses[0].ready} {.status.containerStatuses[0].restartCount} {.spec.containers[0].resources.limits.memory}{"\\n"}{end}' 2>/dev/null | awk '$1=="true" && $3=="256Mi"{print $2; exit}')
[ "$L" = "0" ] && ok stable || ko stable "pod mới Ready có restartCount='$L'"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl get pods -n m3-oom                                   # RESTARTS tăng, STATUS OOMKilled/CrashLoopBackOff
kubectl describe pod -n m3-oom -l app=thumbnailer | grep -A4 "Last State"
P=$(kubectl get pod -n m3-oom -l app=thumbnailer -o jsonpath='{.items[0].metadata.name}')
kubectl get pod $P -n m3-oom -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}' > /opt/ckad/m3-oom/reason.txt
kubectl get pod $P -n m3-oom -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}' > /opt/ckad/m3-oom/exit-code.txt
cat /opt/ckad/m3-oom/*.txt                                   # OOMKilled / 137
kubectl set resources deploy/thumbnailer -n m3-oom -c worker \\
  --requests=memory=200Mi --limits=memory=256Mi            # chỉ đổi memory, CPU giữ nguyên
kubectl rollout status deploy/thumbnailer -n m3-oom
~~~

**Vì sao:** khi container dùng vượt {{limits.memory}}, kernel (cgroup OOM killer) giết tiến trình bằng SIGKILL, nên exit code = 128 + 9 = **137** và kubelet ghi {{reason: OOMKilled}} vào {{lastState.terminated}} (state hiện tại thường là Waiting/CrashLoopBackOff, nên phải đọc {{lastState}} chứ không phải {{state}}). Log thường **không** có dòng lỗi nào vì tiến trình bị giết đột ngột, nên đừng tìm lý do trong {{kubectl logs}}. Request nên gần mức dùng thật (150 MiB) để scheduler đặt pod lên node đủ RAM; limit chừa khoảng 30–70% headroom.

> Mẹo tiết kiệm thời gian: {{kubectl set resources}} sửa đúng container bằng {{-c}} và chỉ đụng tới những giá trị bạn truyền vào, nhanh hơn edit YAML. Exit code 137 = bị kill (OOM hoặc liveness), 143 = SIGTERM, 1 = lỗi của chính ứng dụng.`,
        refs: [{ type: 'doc', title: 'Assign Memory Resources to Containers and Pods', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/' }],
        tags: ['OOMKilled', 'lastState', 'jsonpath', 'resources'],
      },
      // ---------------------------------------------------------------- 06 broken YAML
      {
        id: 'ckad-3-06', no: 6, domain: 'Design & Build', weight: 7, env: 'kind', minutes: 8,
        title: 'Sửa file YAML pod hai container dùng chung volume rồi apply',
        task: CTX + `Một đồng nghiệp để lại file {{/opt/ckad/m3-06/log-shipper.yaml}} cho Pod {{log-shipper}} (namespace {{m3-files}}) nhưng apply bị lỗi. Thiết kế mong muốn:
- container {{app}} ({{busybox:1.36}}) mỗi 2 giây ghi một dòng {{tick}} vào {{/var/log/app/app.log}};
- container {{shipper}} ({{busybox:1.36}}) đọc cùng file đó qua volume dùng chung, mount tại {{/logs}} ở chế độ **chỉ đọc**, chạy {{tail -F /logs/app.log}};
- volume dùng chung là {{emptyDir}} tên {{logs}}.

Sửa **file** (giữ nguyên tên pod, container, volume, đường dẫn) cho tới khi apply thành công và pod chạy đủ 2/2 container. Sau đó ghi dòng log cuối cùng của container {{shipper}} vào {{/opt/ckad/m3-06/last.txt}}.`,
        setup: `kubectl create ns m3-files --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod log-shipper -n m3-files --ignore-not-found --wait=true
mkdir -p /opt/ckad/m3-06 && rm -f /opt/ckad/m3-06/last.txt
cat > /opt/ckad/m3-06/log-shipper.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: log-shipper
  namespace: m3-files
  labels:
    app: log-shipper
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: sh -c "while true; do echo tick >> /var/log/app/app.log; sleep 2; done"
    volumeMounts:
    - name: log
      mountPath: /var/log/app
  - name: shipper
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /logs/app.log"]
    volumeMount:
    - name: logs
      mountPath: /logs
      readOnly: true
  volumes:
  - name: logs
    emptyDir:
      sizeLimit: 50Mi
EOF`,
        verify: H + `NS=m3-files
kubectl wait --for=condition=Ready pod/log-shipper -n $NS --timeout=60s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod log-shipper chưa Ready"
CN=$(kubectl get pod log-shipper -n $NS -o jsonpath='{.spec.containers[*].name}' 2>/dev/null)
[ "$CN" = "app shipper" ] && ok containers || ko containers "containers='$CN'"
RO=$(kubectl get pod log-shipper -n $NS -o jsonpath='{.spec.containers[1].volumeMounts[?(@.mountPath=="/logs")].readOnly}' 2>/dev/null)
VN=$(kubectl get pod log-shipper -n $NS -o jsonpath='{.spec.volumes[*].name}' 2>/dev/null)
[ "$RO" = "true" ] && echo "$VN" | grep -qw logs && ok shared-volume || ko shared-volume "shipper phải mount volume logs readOnly tại /logs"
sleep 3
kubectl logs log-shipper -c shipper -n $NS --tail=5 2>/dev/null | grep -q tick && ok shipper-reads || ko shipper-reads "shipper chưa đọc được tick"
kubectl apply --dry-run=server -f /opt/ckad/m3-06/log-shipper.yaml >/dev/null 2>&1 && ok file-fixed || ko file-fixed "file vẫn lỗi hoặc khác pod đang chạy"
grep -q tick /opt/ckad/m3-06/last.txt 2>/dev/null && ok last-file || ko last-file "last.txt không có tick"
echo "RESULT $P/$T"`,
        solution: `File có **3 lỗi**, mỗi lần apply chỉ báo một lỗi nên phải đọc kỹ:

1. {{command}} là chuỗi, trong khi field này là **mảng** (lỗi "cannot unmarshal string into ... []string").
2. {{volumeMount}} (thiếu s) ở container shipper: kubectl mặc định validate strict nên báo "unknown field".
3. Container app mount volume tên {{log}} nhưng volume khai báo là {{logs}}.

~~~yaml
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "while true; do echo tick >> /var/log/app/app.log; sleep 2; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  - name: shipper
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /logs/app.log"]
    volumeMounts:
    - name: logs
      mountPath: /logs
      readOnly: true
~~~

~~~bash
kubectl config use-context kind-ckad
kubectl apply --dry-run=server -f /opt/ckad/m3-06/log-shipper.yaml   # lặp tới khi hết lỗi
kubectl apply -f /opt/ckad/m3-06/log-shipper.yaml
kubectl get pod log-shipper -n m3-files            # 2/2 Running
kubectl logs log-shipper -c shipper -n m3-files --tail=1 > /opt/ckad/m3-06/last.txt
~~~

**Vì sao:** emptyDir sống theo pod, mọi container trong pod mount cùng một thư mục, nên app ghi ở {{/var/log/app}} thì shipper thấy ở {{/logs}}. {{tail -F}} (F hoa) chờ file xuất hiện và theo dõi khi file bị tạo lại; {{-f}} thường sẽ thoát nếu file chưa có. {{--dry-run=server}} đi qua đủ validate + admission của API server mà không tạo gì.

> Mẹo tiết kiệm thời gian: Pod không cho sửa phần lớn spec; nếu lỡ tạo sai thì {{kubectl replace --force -f file}} (xoá và tạo lại một lệnh). Dùng {{kubectl explain pod.spec.containers.volumeMounts}} để chắc tên field.`,
        refs: [{ type: 'doc', title: 'Volumes: emptyDir', url: 'https://kubernetes.io/docs/concepts/storage/volumes/#emptydir' }],
        tags: ['multi-container', 'emptyDir', 'yaml', 'troubleshooting'],
      },
      // ---------------------------------------------------------------- 07 blue-green
      {
        id: 'ckad-3-07', no: 7, domain: 'Deployment', weight: 6, env: 'kind', minutes: 7,
        title: 'Blue-green: dựng bản green, chuyển Service một lần, giữ blue để rollback',
        task: CTX + `Trong namespace {{m3-bg}}, Deployment {{billing-blue}} (3 replica, image {{nginx:1.25-alpine}}, nhãn pod {{app=billing, color=blue}}) đang nhận toàn bộ traffic qua Service {{billing}}. Thực hiện blue-green:

1. Tạo Deployment {{billing-green}}: 3 replica, image {{nginx:1.27-alpine}}, nhãn pod {{app=billing}} và {{color=green}}. Chờ cả 3 pod Ready.
2. Chuyển Service {{billing}} sang **chỉ** các pod green (không lúc nào trộn blue và green).
3. Không xoá {{billing-blue}} (để rollback nhanh), nhưng scale nó về **0** replica.

Verify sẽ tạo một pod busybox tạm trong {{m3-bg}} để gọi Service.`,
        setup: `kubectl create ns m3-bg --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deploy billing-green -n m3-bg --ignore-not-found
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: billing-blue
  namespace: m3-bg
spec:
  replicas: 3
  selector:
    matchLabels:
      app: billing
      color: blue
  template:
    metadata:
      labels:
        app: billing
        color: blue
    spec:
      containers:
      - name: web
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: billing
  namespace: m3-bg
spec:
  selector:
    app: billing
    color: blue
  ports:
  - port: 80
    targetPort: 80
EOF`,
        verify: H + `NS=m3-bg
kubectl rollout status deploy/billing-green -n $NS --timeout=90s >/dev/null 2>&1
G=$(kubectl get deploy billing-green -n $NS -o jsonpath='{.status.readyReplicas} {.spec.template.spec.containers[0].image} {.spec.template.metadata.labels.app} {.spec.template.metadata.labels.color}' 2>/dev/null)
[ "$G" = "3 nginx:1.27-alpine billing green" ] && ok green || ko green "billing-green='$G'"
B=$(kubectl get deploy billing-blue -n $NS -o jsonpath='{.spec.replicas}' 2>/dev/null)
[ "$B" = "0" ] && ok blue-kept-at-zero || ko blue-kept-at-zero "billing-blue phải còn và replicas=0 (đang '$B')"
S=$(kubectl get svc billing -n $NS -o jsonpath='{.spec.selector.app}/{.spec.selector.color}' 2>/dev/null)
[ "$S" = "billing/green" ] && ok svc-selector || ko svc-selector "selector='$S'"
EXP=$(kubectl get pods -n $NS -l app=billing,color=green -o jsonpath='{range .items[*]}{.status.podIP}{"\\n"}{end}' 2>/dev/null | sort)
GOT=$(kubectl get endpoints billing -n $NS -o jsonpath='{range .subsets[*].addresses[*]}{.ip}{"\\n"}{end}' 2>/dev/null | sort)
[ -n "$GOT" ] && [ "$GOT" = "$EXP" ] && ok endpoints || ko endpoints "endpoints phải đúng 3 pod green"
kubectl delete pod m3-07-check -n $NS --ignore-not-found >/dev/null 2>&1
OUT=$(kubectl run m3-07-check -n $NS --image=busybox:1.36 --restart=Never --rm -i --quiet -- wget -S -O /dev/null -T 5 http://billing 2>&1)
echo "$OUT" | grep -qi "server: nginx/1.27" && ok http-green || ko http-green "Service chưa trả về nginx/1.27"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl get deploy billing-blue -n m3-bg -o yaml > /opt/ckad/green.yaml
# sửa: name billing-green, color: blue -> green (CẢ selector.matchLabels lẫn template.labels), image nginx:1.27-alpine,
# xoá status, uid, resourceVersion, creationTimestamp, annotation last-applied
vi /opt/ckad/green.yaml
kubectl apply -f /opt/ckad/green.yaml
kubectl rollout status deploy/billing-green -n m3-bg          # chờ Ready TRƯỚC khi chuyển traffic
kubectl patch svc billing -n m3-bg -p '{"spec":{"selector":{"app":"billing","color":"green"}}}'
kubectl get endpoints billing -n m3-bg -o wide                # chỉ còn IP green
kubectl scale deploy billing-blue -n m3-bg --replicas=0
~~~

~~~yaml
spec:
  replicas: 3
  selector:
    matchLabels:
      app: billing
      color: green
  template:
    metadata:
      labels:
        app: billing
        color: green
    spec:
      containers:
      - name: web
        image: nginx:1.27-alpine
~~~

**Vì sao:** blue-green khác canary ở chỗ traffic chuyển **một lần, 100%**: Service đổi selector thì Endpoints được cập nhật một lượt, không có giai đoạn trộn (miễn là selector luôn có {{color}}). Green phải Ready trước khi chuyển, nếu không sẽ có khoảng thời gian Service không có endpoint. Giữ Deployment blue ở 0 replica: rollback = scale blue lên 3, chờ Ready, đổi selector về {{color: blue}}; nhanh hơn nhiều so với deploy lại. Merge patch của map selector giữ các key cũ, nên ghi rõ cả {{app}} và {{color}}.

> Mẹo tiết kiệm thời gian: sinh Deployment mới từ YAML của bản cũ rồi {{sed 's/blue/green/g'}} (kiểm lại image) nhanh hơn gõ tay; nhớ xoá các field runtime hoặc dùng {{kubectl create deploy ... $do}} rồi thêm nhãn color.`,
        refs: [{ type: 'doc', title: 'Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' }],
        tags: ['blue-green', 'deployment', 'service', 'selector'],
      },
      // ---------------------------------------------------------------- 08 Secret env-file
      {
        id: 'ckad-3-08', no: 8, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 7,
        title: 'Secret từ env-file: một key thành biến môi trường, một key thành file qua subPath',
        task: CTX + `File {{/opt/ckad/m3-08/db.env}} chứa thông tin kết nối DB dạng {{KEY=VALUE}}. Trong namespace {{m3-secret}}:

1. Tạo Secret {{db-cred}} từ **env-file** đó (mỗi dòng thành một key riêng).
2. Tạo Pod {{reporter}} image {{nginx:1.27-alpine}} sao cho:
   - chỉ key {{DB_USER}} được đưa vào biến môi trường {{DB_USER}} (lấy từ Secret); **không** biến môi trường nào khác chứa mật khẩu;
   - key {{DB_PASSWORD}} xuất hiện dưới dạng **file** {{/etc/nginx/db-password}};
   - các file có sẵn trong {{/etc/nginx}} (ví dụ {{nginx.conf}}) **không** bị che mất.`,
        setup: `kubectl create ns m3-secret --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod reporter -n m3-secret --ignore-not-found --wait=true
kubectl delete secret db-cred -n m3-secret --ignore-not-found
mkdir -p /opt/ckad/m3-08
cat > /opt/ckad/m3-08/db.env <<'EOF'
DB_USER=ledger_app
DB_PASSWORD=S3cr3t-Pa55
DB_HOST=pg.m3-secret.svc
EOF`,
        verify: H + `NS=m3-secret
d() { kubectl get secret db-cred -n $NS -o jsonpath="{.data.$1}" 2>/dev/null | base64 -d 2>/dev/null; }
[ "$(d DB_USER)" = "ledger_app" ] && [ "$(d DB_PASSWORD)" = "S3cr3t-Pa55" ] && [ "$(d DB_HOST)" = "pg.m3-secret.svc" ] && ok secret-keys || ko secret-keys "Secret db-cred phải có 3 key từ env-file"
kubectl wait --for=condition=Ready pod/reporter -n $NS --timeout=60s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod reporter chưa Ready"
REF=$(kubectl get pod reporter -n $NS -o jsonpath='{.spec.containers[0].env[?(@.name=="DB_USER")].valueFrom.secretKeyRef.name}' 2>/dev/null)
EV=$(kubectl exec reporter -n $NS -- printenv DB_USER 2>/dev/null)
[ "$REF" = "db-cred" ] && [ "$EV" = "ledger_app" ] && ok env-user || ko env-user "DB_USER phải lấy từ secretKeyRef db-cred"
kubectl exec reporter -n $NS -- sh -c 'env | grep -q S3cr3t' >/dev/null 2>&1 && ko no-password-env "mật khẩu đang nằm trong biến môi trường" || ok no-password-env
PW=$(kubectl exec reporter -n $NS -- cat /etc/nginx/db-password 2>/dev/null)
[ "$PW" = "S3cr3t-Pa55" ] && ok password-file || ko password-file "/etc/nginx/db-password='$PW'"
kubectl exec reporter -n $NS -- test -f /etc/nginx/nginx.conf >/dev/null 2>&1 && ok nginx-conf-kept || ko nginx-conf-kept "/etc/nginx/nginx.conf bị che (thiếu subPath?)"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl create secret generic db-cred -n m3-secret --from-env-file=/opt/ckad/m3-08/db.env
kubectl run reporter -n m3-secret --image=nginx:1.27-alpine $do > /opt/ckad/m3-08/pod.yaml
~~~

~~~yaml
spec:
  containers:
  - name: reporter
    image: nginx:1.27-alpine
    env:
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: db-cred
          key: DB_USER
    volumeMounts:
    - name: db-pass
      mountPath: /etc/nginx/db-password   # đường dẫn FILE
      subPath: db-password                # chỉ gắn 1 file, không che /etc/nginx
      readOnly: true
  volumes:
  - name: db-pass
    secret:
      secretName: db-cred
      items:
      - key: DB_PASSWORD
        path: db-password
~~~

~~~bash
kubectl apply -f /opt/ckad/m3-08/pod.yaml
kubectl exec reporter -n m3-secret -- cat /etc/nginx/db-password
kubectl exec reporter -n m3-secret -- ls /etc/nginx       # nginx.conf vẫn còn
~~~

**Vì sao:** {{--from-env-file}} tách mỗi dòng thành một key (khác {{--from-file}}: cả file thành **một** key). Không dùng {{envFrom}} vì nó đổ cả DB_PASSWORD vào env (lộ qua {{/proc/<pid>/environ}}, crash dump, log). Mount volume vào {{/etc/nginx}} sẽ **che** cả thư mục; {{subPath}} chỉ bind một file. Đánh đổi: file mount bằng subPath **không** tự cập nhật khi Secret đổi, phải restart pod.

> Mẹo tiết kiệm thời gian: {{items}} chọn key và đổi tên file; {{subPath}} phải trùng {{path}} trong items. Kiểm nhanh bằng {{kubectl exec -- ls -la}} thay vì describe.`,
        refs: [{ type: 'doc', title: 'Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' }],
        tags: ['secret', 'env-file', 'subPath', 'secretKeyRef'],
      },
      // ---------------------------------------------------------------- 09 NetworkPolicy
      {
        id: 'ckad-3-09', no: 9, domain: 'Services & Networking', weight: 7, env: 'kind', minutes: 8,
        title: 'NetworkPolicy ingress: chỉ pod role=api của một namespace khác được vào DB',
        task: CTX + `Cần Calico (xem phần giới thiệu). Namespace {{m3-np-data}} có Deployment + Service {{ledger-db}} (cổng 80) và NetworkPolicy {{default-deny}} chặn mọi ingress. Có các pod thử nghiệm: {{api}} (nhãn {{role=api}}) và {{batch}} (nhãn {{role=batch}}) trong namespace {{m3-np-app}}; {{api}} (nhãn {{role=api}}) trong namespace {{m3-np-other}}.

Tạo NetworkPolicy {{ledger-db-ingress}} trong {{m3-np-data}} áp cho pod {{app=ledger-db}}, cho phép ingress TCP cổng 80 **chỉ** từ pod có nhãn {{role=api}} **nằm trong** namespace {{m3-np-app}}. Không xoá, không sửa {{default-deny}}. Không gắn thêm nhãn cho namespace.

Kết quả: {{m3-np-app/api}} gọi được {{http://ledger-db.m3-np-data}}; {{m3-np-app/batch}} và {{m3-np-other/api}} bị chặn.`,
        setup: `for n in m3-np-data m3-np-app m3-np-other; do kubectl create ns $n --dry-run=client -o yaml | kubectl apply -f -; done
kubectl delete networkpolicy ledger-db-ingress -n m3-np-data --ignore-not-found
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ledger-db
  namespace: m3-np-data
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ledger-db
  template:
    metadata:
      labels:
        app: ledger-db
    spec:
      containers:
      - name: db
        image: nginx:1.27-alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: ledger-db
  namespace: m3-np-data
spec:
  selector:
    app: ledger-db
  ports:
  - port: 80
    targetPort: 80
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: m3-np-data
spec:
  podSelector: {}
  policyTypes:
  - Ingress
EOF
kubectl run api -n m3-np-app --image=busybox:1.36 -l role=api --dry-run=client -o yaml --command -- sleep 86400 | kubectl apply -f -
kubectl run batch -n m3-np-app --image=busybox:1.36 -l role=batch --dry-run=client -o yaml --command -- sleep 86400 | kubectl apply -f -
kubectl run api -n m3-np-other --image=busybox:1.36 -l role=api --dry-run=client -o yaml --command -- sleep 86400 | kubectl apply -f -`,
        verify: H + `kubectl get networkpolicy default-deny -n m3-np-data >/dev/null 2>&1 && ok default-deny-kept || ko default-deny-kept "default-deny bị xoá"
kubectl get networkpolicy ledger-db-ingress -n m3-np-data >/dev/null 2>&1 && ok policy-exists || ko policy-exists "chưa có ledger-db-ingress"
kubectl rollout status deploy/ledger-db -n m3-np-data --timeout=60s >/dev/null 2>&1
kubectl wait --for=condition=Ready pod/api pod/batch -n m3-np-app --timeout=60s >/dev/null 2>&1
kubectl wait --for=condition=Ready pod/api -n m3-np-other --timeout=60s >/dev/null 2>&1
U=http://ledger-db.m3-np-data
kubectl exec api -n m3-np-app -- wget -qO- -T 3 $U >/dev/null 2>&1 && ok app-api-allowed || ko app-api-allowed "m3-np-app/api không gọi được ledger-db"
kubectl exec batch -n m3-np-app -- wget -qO- -T 3 $U >/dev/null 2>&1 && ko app-batch-denied "m3-np-app/batch vẫn gọi được" || ok app-batch-denied
kubectl exec api -n m3-np-other -- wget -qO- -T 3 $U >/dev/null 2>&1 && ko other-api-denied "m3-np-other/api vẫn gọi được" || ok other-api-denied
echo "RESULT $P/$T"`,
        solution: `~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ledger-db-ingress
  namespace: m3-np-data
spec:
  podSelector:
    matchLabels:
      app: ledger-db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:          # CÙNG một phần tử với podSelector => AND
        matchLabels:
          kubernetes.io/metadata.name: m3-np-app
      podSelector:
        matchLabels:
          role: api
    ports:
    - protocol: TCP
      port: 80
~~~

~~~bash
kubectl config use-context kind-ckad
kubectl apply -f ledger-db-ingress.yaml
kubectl exec api -n m3-np-app -- wget -qO- -T 3 http://ledger-db.m3-np-data     # OK
kubectl exec batch -n m3-np-app -- wget -qO- -T 3 http://ledger-db.m3-np-data   # timeout
~~~

**Vì sao:** trong {{from}}, một phần tử có **cả** namespaceSelector và podSelector nghĩa là "pod role=api TRONG namespace m3-np-app" (AND). Nếu viết thành hai phần tử (thêm dấu {{-}} trước podSelector) thì thành OR: mọi pod của m3-np-app (kể cả batch) **hoặc** pod role=api trong chính m3-np-data, sai yêu cầu. Từ 1.21 mọi namespace tự có nhãn {{kubernetes.io/metadata.name}}, nên không cần gắn nhãn thêm. Các policy cộng dồn: default-deny vẫn giữ, policy mới chỉ mở thêm đúng một đường.

> Mẹo tiết kiệm thời gian: sau khi viết YAML, chạy {{kubectl describe networkpolicy ledger-db-ingress -n m3-np-data}}: phần "Allowing ingress traffic" in rõ AND hay OR. Luôn test cả case được phép **và** case bị chặn.`,
        refs: [{ type: 'doc', title: 'Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' }],
        tags: ['networkpolicy', 'namespaceSelector', 'podSelector', 'calico'],
      },
      // ---------------------------------------------------------------- 10 custom-columns report
      {
        id: 'ckad-3-10', no: 10, domain: 'Observability & Maintenance', weight: 5, env: 'kind', minutes: 6,
        title: 'Báo cáo bằng custom-columns, sort-by và jsonpath ra file đúng định dạng',
        task: CTX + `Namespace {{m3-report}} có nhiều pod với nhãn {{tier}} khác nhau. Dùng **kubectl** (không gõ tay kết quả) để tạo 3 file:

1. {{/opt/ckad/m3-10/backend.txt}}: các pod có nhãn {{tier=backend}}, đúng 2 cột với header {{NAME}} và {{IMAGE}} (image của container đầu tiên), sắp xếp theo tên pod.
2. {{/opt/ckad/m3-10/most-restarts.txt}}: **chỉ tên** của pod có số lần restart (container đầu tiên) lớn nhất trong namespace.
3. {{/opt/ckad/m3-10/images.txt}}: danh sách image **không trùng** của mọi pod trong namespace, mỗi image một dòng, sắp xếp theo thứ tự chữ cái.`,
        setup: `kubectl create ns m3-report --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-10 && rm -f /opt/ckad/m3-10/backend.txt /opt/ckad/m3-10/most-restarts.txt /opt/ckad/m3-10/images.txt
kubectl run orders-api -n m3-report --image=nginx:1.27-alpine -l tier=backend --dry-run=client -o yaml | kubectl apply -f -
kubectl run cart-api -n m3-report --image=redis:7-alpine -l tier=backend --dry-run=client -o yaml | kubectl apply -f -
kubectl run audit-worker -n m3-report --image=busybox:1.36 -l tier=backend --dry-run=client -o yaml --command -- sleep 86400 | kubectl apply -f -
kubectl run web-ui -n m3-report --image=nginx:1.27-alpine -l tier=frontend --dry-run=client -o yaml | kubectl apply -f -
kubectl run flaky -n m3-report --image=busybox:1.36 -l tier=batch --dry-run=client -o yaml --command -- sh -c "echo boom; sleep 5; exit 1" | kubectl apply -f -`,
        verify: H + `NS=m3-report
norm() { sed 's/[[:space:]]*$//' | tr -s ' ' | sed '/^$/d'; }
EXP=$(kubectl get pods -n $NS -l tier=backend --sort-by=.metadata.name -o custom-columns='NAME:.metadata.name,IMAGE:.spec.containers[0].image' | norm)
GOT=$(cat /opt/ckad/m3-10/backend.txt 2>/dev/null | norm)
[ -n "$GOT" ] && [ "$GOT" = "$EXP" ] && ok backend-file || ko backend-file "backend.txt khác output mong đợi"
TOP=$(kubectl get pods -n $NS --sort-by='.status.containerStatuses[0].restartCount' -o jsonpath='{.items[-1:].metadata.name}')
MR=$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-10/most-restarts.txt 2>/dev/null)
[ -n "$MR" ] && [ "$MR" = "$TOP" ] && ok most-restarts || ko most-restarts "most-restarts.txt='$MR'"
EI=$(kubectl get pods -n $NS -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\\n"}{end}' | sort -u | sed '/^$/d')
GI=$(sed 's/[[:space:]]*$//' /opt/ckad/m3-10/images.txt 2>/dev/null | sed '/^$/d')
[ -n "$GI" ] && [ "$GI" = "$EI" ] && ok images-file || ko images-file "images.txt phải là danh sách image sort -u"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl get pods -n m3-report -l tier=backend --sort-by=.metadata.name \\
  -o custom-columns='NAME:.metadata.name,IMAGE:.spec.containers[0].image' > /opt/ckad/m3-10/backend.txt

kubectl get pods -n m3-report --sort-by='.status.containerStatuses[0].restartCount' \\
  -o custom-columns='NAME:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount'   # nhìn để chắc
kubectl get pods -n m3-report --sort-by='.status.containerStatuses[0].restartCount' \\
  -o jsonpath='{.items[-1:].metadata.name}' > /opt/ckad/m3-10/most-restarts.txt

kubectl get pods -n m3-report -o jsonpath='{range .items[*]}{.spec.containers[*].image}{"\\n"}{end}' \\
  | sort -u > /opt/ckad/m3-10/images.txt
cat /opt/ckad/m3-10/*.txt
~~~

**Vì sao:** {{--sort-by}} sắp tăng dần theo một JSONPath, nên phần tử cuối ({{.items[-1:]}}) là lớn nhất. custom-columns in header đúng tên bạn đặt trước dấu {{:}}. jsonpath {{range ... end}} kèm {{"\\n"}} cho mỗi pod một dòng; {{sort -u}} vừa sắp xếp vừa bỏ trùng. Luôn **quote** biểu thức có {{[0]}} để shell không coi là glob.

> Mẹo tiết kiệm thời gian: đề yêu cầu "chỉ tên" thì dùng jsonpath hoặc {{-o name}} (nhưng {{-o name}} có tiền tố {{pod/}}), đừng cắt bằng awk từ bảng. {{cat}} lại file sau khi ghi để chắc định dạng.`,
        refs: [{ type: 'doc', title: 'JSONPath Support', url: 'https://kubernetes.io/docs/reference/kubectl/jsonpath/' }],
        tags: ['jsonpath', 'custom-columns', 'sort-by', 'output'],
      },
      // ---------------------------------------------------------------- 11 progress deadline
      {
        id: 'ckad-3-11', no: 11, domain: 'Deployment', weight: 4, env: 'kind', minutes: 6,
        title: 'Rollout quá progressDeadlineSeconds: đọc condition, undo, thêm minReadySeconds',
        task: CTX + `Deployment {{catalog}} trong namespace {{m3-roll}} có {{progressDeadlineSeconds: 30}}. Một bản hotfix vừa được triển khai và rollout đã bị đánh dấu thất bại.

1. Ghi giá trị {{reason}} của condition {{Progressing}} của Deployment {{catalog}} (trạng thái hiện tại, trước khi sửa) vào {{/opt/ckad/m3-roll/progress-reason.txt}}.
2. Đưa {{catalog}} về phiên bản chạy được ngay trước hotfix.
3. Đặt {{minReadySeconds: 10}} cho Deployment và annotation {{kubernetes.io/change-cause}} có giá trị {{rollback failed hotfix}}.

Kết quả: 3 replica Ready, rollout hoàn tất.`,
        setup: `kubectl create ns m3-roll --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-roll && rm -f /opt/ckad/m3-roll/progress-reason.txt
kubectl delete deploy catalog -n m3-roll --ignore-not-found --wait=true
kubectl create deploy catalog -n m3-roll --image=nginx:1.26-alpine --replicas=3
kubectl patch deploy catalog -n m3-roll -p '{"spec":{"progressDeadlineSeconds":30}}'
kubectl rollout status deploy/catalog -n m3-roll --timeout=120s || true
kubectl set image deploy/catalog -n m3-roll nginx=nginx:1.27-alpine-hotfx
kubectl annotate deploy catalog -n m3-roll kubernetes.io/change-cause="hotfix 2024.3.1" --overwrite
echo "Chờ rollout vượt progressDeadlineSeconds..."
kubectl rollout status deploy/catalog -n m3-roll --timeout=90s || true`,
        verify: H + `NS=m3-roll
[ "$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-roll/progress-reason.txt)" = "ProgressDeadlineExceeded" ] && ok reason-file || ko reason-file "progress-reason.txt sai"
kubectl rollout status deploy/catalog -n $NS --timeout=120s >/dev/null 2>&1 && ok rollout-complete || ko rollout-complete "rollout chưa xong"
I=$(kubectl get deploy catalog -n $NS -o jsonpath='{.spec.template.spec.containers[0].image} {.status.readyReplicas}' 2>/dev/null)
[ "$I" = "nginx:1.26-alpine 3" ] && ok image || ko image "image/ready='$I'"
C=$(kubectl get deploy catalog -n $NS -o jsonpath='{.status.conditions[?(@.type=="Progressing")].reason}' 2>/dev/null)
[ "$C" = "NewReplicaSetAvailable" ] && ok progressing || ko progressing "Progressing reason='$C'"
M=$(kubectl get deploy catalog -n $NS -o jsonpath='{.spec.minReadySeconds}' 2>/dev/null)
[ "$M" = "10" ] && ok min-ready || ko min-ready "minReadySeconds='$M'"
A=$(kubectl get deploy catalog -n $NS -o jsonpath='{.metadata.annotations.kubernetes\\.io/change-cause}' 2>/dev/null)
[ "$A" = "rollback failed hotfix" ] && ok change-cause || ko change-cause "change-cause='$A'"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl rollout status deploy/catalog -n m3-roll --timeout=5s   # error: deployment "catalog" exceeded its progress deadline
kubectl get deploy catalog -n m3-roll \\
  -o jsonpath='{.status.conditions[?(@.type=="Progressing")].reason}' > /opt/ckad/m3-roll/progress-reason.txt
cat /opt/ckad/m3-roll/progress-reason.txt                        # ProgressDeadlineExceeded
kubectl rollout undo deploy/catalog -n m3-roll                   # về revision liền trước (1.26-alpine)
kubectl patch deploy catalog -n m3-roll -p '{"spec":{"minReadySeconds":10}}'
kubectl annotate deploy catalog -n m3-roll kubernetes.io/change-cause="rollback failed hotfix" --overwrite
kubectl rollout status deploy/catalog -n m3-roll
~~~

**Vì sao:** nếu rollout không tiến triển (không có pod mới Available) trong {{progressDeadlineSeconds}}, controller đặt condition {{Progressing=False}} với reason {{ProgressDeadlineExceeded}}. Kubernetes **không tự rollback**; nó chỉ báo, và {{kubectl rollout status}} trả exit code khác 0, nên CI/CD dựa vào đó để tự undo. Sau khi rollout xong, reason trở về {{NewReplicaSetAvailable}}. {{minReadySeconds}} bắt pod mới phải Ready liên tục 10 giây mới tính là Available, chặn trường hợp app Ready rồi crash ngay. Đổi minReadySeconds không đổi pod template nên không tạo revision mới. Ghi annotation change-cause **sau** khi undo: rollback chép annotation của ReplicaSet cũ sang Deployment và có thể ghi đè giá trị bạn đặt trước đó.

> Mẹo tiết kiệm thời gian: jsonpath filter {{?(@.type=="Progressing")}} dùng được cho mọi danh sách conditions (pod, node, deployment); thuộc mẫu này giúp xuất đúng một giá trị ra file mà không cần grep/awk.`,
        refs: [{ type: 'doc', title: 'Deployments: Failed Deployment', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#failed-deployment' }],
        tags: ['rollout', 'progressDeadlineSeconds', 'minReadySeconds', 'conditions'],
      },
      // ---------------------------------------------------------------- 12 securityContext
      {
        id: 'ckad-3-12', no: 12, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 8,
        title: 'Hardening Deployment: non-root, readOnlyRootFilesystem, drop ALL capabilities',
        task: CTX + `File {{/opt/ckad/m3-12/hardened-web.yaml}} định nghĩa Deployment {{hardened-web}} (namespace {{m3-sec}}, image {{nginxinc/nginx-unprivileged:1.27-alpine}}, cổng 8080). Sửa file rồi apply sao cho:

- cấp **pod**: {{runAsNonRoot: true}}, {{runAsUser: 101}}, {{runAsGroup: 101}};
- cấp **container** {{web}}: {{readOnlyRootFilesystem: true}}, {{allowPrivilegeEscalation: false}}, capabilities drop {{ALL}};
- nginx vẫn chạy và trả trang chủ ở cổng 8080 (nginx cần ghi vào {{/tmp}}: dùng volume {{emptyDir}} tên {{tmp}}).

Kết quả: 2 replica Ready, không ghi được vào filesystem gốc của container.`,
        setup: `kubectl create ns m3-sec --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deploy hardened-web -n m3-sec --ignore-not-found
mkdir -p /opt/ckad/m3-12
cat > /opt/ckad/m3-12/hardened-web.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hardened-web
  namespace: m3-sec
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hardened-web
  template:
    metadata:
      labels:
        app: hardened-web
    spec:
      containers:
      - name: web
        image: nginxinc/nginx-unprivileged:1.27-alpine
        ports:
        - containerPort: 8080
EOF`,
        verify: H + `NS=m3-sec
kubectl rollout status deploy/hardened-web -n $NS --timeout=90s >/dev/null 2>&1
R=$(kubectl get deploy hardened-web -n $NS -o jsonpath='{.status.readyReplicas}' 2>/dev/null)
[ "$R" = "2" ] && ok ready || ko ready "readyReplicas=$R"
PS=$(kubectl get deploy hardened-web -n $NS -o jsonpath='{.spec.template.spec.securityContext.runAsNonRoot} {.spec.template.spec.securityContext.runAsUser} {.spec.template.spec.securityContext.runAsGroup}' 2>/dev/null)
[ "$PS" = "true 101 101" ] && ok pod-securitycontext || ko pod-securitycontext "pod securityContext='$PS'"
CS=$(kubectl get deploy hardened-web -n $NS -o jsonpath='{.spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem} {.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation} {.spec.template.spec.containers[0].securityContext.capabilities.drop[*]}' 2>/dev/null)
[ "$CS" = "true false ALL" ] && ok container-securitycontext || ko container-securitycontext "container securityContext='$CS'"
P1=$(kubectl get pods -n $NS -l app=hardened-web --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
[ "$(kubectl exec -n $NS $P1 -- id -u 2>/dev/null)" = "101" ] && ok uid || ko uid "uid khác 101"
kubectl exec -n $NS $P1 -- touch /etc/ro-test >/dev/null 2>&1 && ko readonly-root "ghi được vào /etc" || ok readonly-root
kubectl exec -n $NS $P1 -- touch /tmp/rw-test >/dev/null 2>&1 && ok tmp-writable || ko tmp-writable "/tmp không ghi được"
kubectl exec -n $NS $P1 -- wget -qO- -T 3 http://127.0.0.1:8080 2>/dev/null | grep -qi "welcome to nginx" && ok http || ko http "nginx không trả trang chủ"
echo "RESULT $P/$T"`,
        solution: `~~~yaml
    spec:
      securityContext:                 # cấp pod
        runAsNonRoot: true
        runAsUser: 101
        runAsGroup: 101
      containers:
      - name: web
        image: nginxinc/nginx-unprivileged:1.27-alpine
        ports:
        - containerPort: 8080
        securityContext:               # cấp container
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      volumes:
      - name: tmp
        emptyDir: {}
~~~

~~~bash
kubectl config use-context kind-ckad
kubectl apply -f /opt/ckad/m3-12/hardened-web.yaml
kubectl rollout status deploy/hardened-web -n m3-sec
kubectl logs -n m3-sec deploy/hardened-web | tail     # nếu CrashLoop: "Read-only file system" chỉ ra thư mục cần emptyDir
~~~

**Vì sao:** {{readOnlyRootFilesystem}}, {{allowPrivilegeEscalation}} và {{capabilities}} **chỉ có ở cấp container**; {{runAsUser}}/{{runAsNonRoot}} có ở cả hai cấp (container ghi đè pod). Bản nginx-unprivileged đã đặt pid và temp path vào {{/tmp}}, nên chỉ cần một emptyDir ở {{/tmp}}; image nginx thường cần thêm {{/var/cache/nginx}} và {{/var/run}} và nghe cổng 80 (cần root hoặc NET_BIND_SERVICE). Drop ALL vẫn chạy được vì cổng 8080 > 1024.

> Mẹo tiết kiệm thời gian: nhớ vị trí field bằng {{kubectl explain pod.spec.securityContext}} và {{kubectl explain pod.spec.containers.securityContext}}. App crash sau khi bật read-only: đọc log tìm đường dẫn bị từ chối, thêm emptyDir đúng chỗ đó.`,
        refs: [{ type: 'doc', title: 'Configure a Security Context for a Pod or Container', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' }],
        tags: ['securityContext', 'readOnlyRootFilesystem', 'capabilities', 'non-root'],
      },
      // ---------------------------------------------------------------- 13 init container
      {
        id: 'ckad-3-13', no: 13, domain: 'Design & Build', weight: 6, env: 'kind', minutes: 7,
        title: 'Init container chờ Service sẵn sàng; tự tìm vì sao pod kẹt Init',
        task: CTX + `Trong namespace {{m3-init}} có Deployment {{inventory-db}} (image {{redis:7-alpine}}, cổng 6379) nhưng chưa có Service, và có thể chưa có pod nào phục vụ.

1. Tạo Service ClusterIP {{inventory-db}} cổng {{6379}} trỏ tới các pod của Deployment {{inventory-db}}.
2. Tạo Pod {{order-worker}}:
   - init container {{wait-db}} image {{busybox:1.36}} lặp {{nc -z inventory-db 6379}} (nghỉ 2 giây giữa các lần) cho tới khi kết nối được;
   - container chính {{worker}} image {{busybox:1.36}}, lệnh {{sh -c "echo connected; sleep 86400"}}, biến môi trường {{DB_HOST=inventory-db.m3-init.svc.cluster.local}}.
3. Làm mọi thứ cần thiết để {{order-worker}} chuyển sang **Running** (không sửa image của inventory-db).`,
        setup: `kubectl create ns m3-init --dry-run=client -o yaml | kubectl apply -f -
kubectl delete pod order-worker -n m3-init --ignore-not-found --wait=true
kubectl delete svc inventory-db -n m3-init --ignore-not-found
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inventory-db
  namespace: m3-init
spec:
  replicas: 0
  selector:
    matchLabels:
      app: inventory-db
  template:
    metadata:
      labels:
        app: inventory-db
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
EOF`,
        verify: H + `NS=m3-init
SP=$(kubectl get svc inventory-db -n $NS -o jsonpath='{.spec.type} {.spec.ports[0].port}' 2>/dev/null)
[ "$SP" = "ClusterIP 6379" ] && ok service || ko service "service type/port='$SP'"
kubectl rollout status deploy/inventory-db -n $NS --timeout=90s >/dev/null 2>&1
EP=$(kubectl get endpoints inventory-db -n $NS -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null)
[ -n "$EP" ] && ok endpoints || ko endpoints "Service inventory-db không có endpoint (Deployment có pod chưa?)"
IC=$(kubectl get pod order-worker -n $NS -o jsonpath='{.spec.initContainers[0].name} {.spec.initContainers[0].image}' 2>/dev/null)
ICMD=$(kubectl get pod order-worker -n $NS -o jsonpath='{.spec.initContainers[0].command} {.spec.initContainers[0].args}' 2>/dev/null)
[ "$IC" = "wait-db busybox:1.36" ] && echo "$ICMD" | grep -q "6379" && ok init-container || ko init-container "init container='$IC'"
kubectl wait --for=condition=Ready pod/order-worker -n $NS --timeout=90s >/dev/null 2>&1 && ok pod-running || ko pod-running "order-worker chưa Ready"
E=$(kubectl get pod order-worker -n $NS -o jsonpath='{.spec.containers[0].name} {.spec.containers[0].env[?(@.name=="DB_HOST")].value}' 2>/dev/null)
[ "$E" = "worker inventory-db.m3-init.svc.cluster.local" ] && ok worker-env || ko worker-env "container/env='$E'"
kubectl logs order-worker -c worker -n $NS 2>/dev/null | grep -q connected && ok worker-log || ko worker-log "log worker không có 'connected'"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl expose deploy inventory-db -n m3-init --port=6379     # tạo Service ClusterIP cùng tên
kubectl run order-worker -n m3-init --image=busybox:1.36 --env=DB_HOST=inventory-db.m3-init.svc.cluster.local \\
  $do --command -- sh -c "echo connected; sleep 86400" > /opt/ckad/m3-init-pod.yaml
~~~

~~~yaml
spec:
  initContainers:
  - name: wait-db
    image: busybox:1.36
    command: ["sh", "-c", "until nc -z inventory-db 6379; do echo waiting; sleep 2; done"]
  containers:
  - name: worker            # kubectl run đặt tên container = order-worker, đổi thành worker
    image: busybox:1.36
    command: ["sh", "-c", "echo connected; sleep 86400"]
    env:
    - name: DB_HOST
      value: inventory-db.m3-init.svc.cluster.local
~~~

~~~bash
kubectl apply -f /opt/ckad/m3-init-pod.yaml
kubectl get pod order-worker -n m3-init           # Init:0/1 mãi
kubectl logs order-worker -c wait-db -n m3-init   # "waiting" lặp lại
kubectl get endpoints inventory-db -n m3-init     # <none>: Deployment đang replicas 0
kubectl scale deploy inventory-db -n m3-init --replicas=1
kubectl get pod order-worker -n m3-init -w        # PodInitializing -> Running
~~~

**Vì sao:** init container chạy tuần tự và phải **exit 0** thì container chính mới bắt đầu. {{nc -z}} kiểm thật kết nối TCP, tốt hơn {{nslookup}} (DNS của Service trả ClusterIP ngay cả khi không có endpoint, nên chờ DNS không đủ). Lớp lỗi thứ hai: Service tồn tại nhưng Deployment {{replicas: 0}} nên Endpoints rỗng.

> Mẹo tiết kiệm thời gian: pod kẹt {{Init:0/1}} thì xem log của **init container** bằng {{-c <tên init>}}; {{kubectl logs pod}} mặc định chỉ đọc container chính và báo đang chờ khởi tạo.`,
        refs: [{ type: 'doc', title: 'Init Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/init-containers/' }],
        tags: ['initContainers', 'service', 'troubleshooting'],
      },
      // ---------------------------------------------------------------- 14 Ingress fan-out
      {
        id: 'ckad-3-14', no: 14, domain: 'Services & Networking', weight: 7, env: 'kind', minutes: 8,
        title: 'Sửa Ingress fan-out hai path: class, pathType, tên và cổng backend',
        task: CTX + `Cần ingress-nginx (xem phần giới thiệu). Trong namespace {{m3-ing}} có Service {{api-svc}} (trả chữ {{catalog-api}}) và {{static-svc}} (trả chữ {{static-files}}), cùng Ingress {{shop}} định nghĩa ở {{/opt/ckad/m3-14/shop-ingress.yaml}}, nhưng gọi qua ingress-nginx đều lỗi.

Sửa **file** rồi apply sao cho với host {{shop.m3.local}}:
- {{/api}} và mọi đường dẫn con (ví dụ {{/api/products}}) tới {{api-svc}};
- {{/static}} và mọi đường dẫn con tới {{static-svc}};
- host khác không được chuyển tới hai Service trên.

Ingress phải dùng IngressClass {{nginx}}. Không sửa Service và Deployment. Verify gọi controller qua {{http://ingress-nginx-controller.ingress-nginx.svc.cluster.local}} với header Host.`,
        setup: `kubectl create ns m3-ing --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-14
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: m3-ing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: echo
        image: hashicorp/http-echo:0.2.3
        args: ["-text=catalog-api", "-listen=:8080"]
        ports:
        - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: static
  namespace: m3-ing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: static
  template:
    metadata:
      labels:
        app: static
    spec:
      containers:
      - name: echo
        image: hashicorp/http-echo:0.2.3
        args: ["-text=static-files", "-listen=:5678"]
        ports:
        - containerPort: 5678
---
apiVersion: v1
kind: Service
metadata:
  name: api-svc
  namespace: m3-ing
spec:
  selector:
    app: api
  ports:
  - port: 8080
    targetPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: static-svc
  namespace: m3-ing
spec:
  selector:
    app: static
  ports:
  - port: 80
    targetPort: 5678
EOF
cat > /opt/ckad/m3-14/shop-ingress.yaml <<'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: m3-ing
spec:
  rules:
  - host: shop.m3.local
    http:
      paths:
      - path: /api
        pathType: Exact
        backend:
          service:
            name: api-svc
            port:
              number: 80
      - path: /static
        pathType: Prefix
        backend:
          service:
            name: static
            port:
              number: 80
EOF
kubectl delete ingress shop -n m3-ing --ignore-not-found
kubectl apply -f /opt/ckad/m3-14/shop-ingress.yaml`,
        verify: H + `NS=m3-ing
CL=$(kubectl get ingress shop -n $NS -o jsonpath='{.spec.ingressClassName}' 2>/dev/null)
[ "$CL" = "nginx" ] && ok ingress-class || ko ingress-class "ingressClassName='$CL'"
kubectl rollout status deploy/api -n $NS --timeout=60s >/dev/null 2>&1
kubectl rollout status deploy/static -n $NS --timeout=60s >/dev/null 2>&1
sleep 5
kubectl delete pod m3-14-check -n $NS --ignore-not-found >/dev/null 2>&1
OUT=$(kubectl run m3-14-check -n $NS --image=busybox:1.36 --restart=Never --rm -i --quiet --command -- sh -c 'U=http://ingress-nginx-controller.ingress-nginx.svc.cluster.local; echo A:$(wget -qO- -T 5 --header "Host: shop.m3.local" $U/api/products); echo S:$(wget -qO- -T 5 --header "Host: shop.m3.local" $U/static/logo.png); echo X:$(wget -qO- -T 5 --header "Host: other.m3.local" $U/api/products)' 2>&1)
echo "$OUT" | grep -q "A:catalog-api" && ok api-path || ko api-path "/api/products không tới api-svc"
echo "$OUT" | grep -q "S:static-files" && ok static-path || ko static-path "/static/logo.png không tới static-svc"
echo "$OUT" | grep -q "^X:" && ! echo "$OUT" | grep -q "X:catalog-api" && ok other-host || ko other-host "host khác vẫn tới api-svc"
kubectl apply --dry-run=server -f /opt/ckad/m3-14/shop-ingress.yaml >/dev/null 2>&1 && grep -q "ingressClassName" /opt/ckad/m3-14/shop-ingress.yaml && ok file-fixed || ko file-fixed "file shop-ingress.yaml chưa được sửa"
echo "RESULT $P/$T"`,
        solution: `File có **4 lỗi** (apply vẫn thành công, nên chỉ test hành vi mới lộ):

| Lỗi | Hậu quả | Sửa |
|---|---|---|
| thiếu {{ingressClassName}} | ingress-nginx bỏ qua Ingress (không có class mặc định) | {{ingressClassName: nginx}} |
| {{/api}} dùng {{pathType: Exact}} | {{/api/products}} không khớp → 404 | {{Prefix}} |
| {{api-svc}} cổng 80 | Service chỉ có cổng 8080 → 503 | {{number: 8080}} |
| backend tên {{static}} | không có Service này → 503 | {{static-svc}} |

~~~yaml
spec:
  ingressClassName: nginx
  rules:
  - host: shop.m3.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 8080
      - path: /static
        pathType: Prefix
        backend:
          service:
            name: static-svc
            port:
              number: 80
~~~

~~~bash
kubectl config use-context kind-ckad
kubectl get ingressclass                       # tên class: nginx
kubectl apply -f /opt/ckad/m3-14/shop-ingress.yaml
kubectl describe ingress shop -n m3-ing        # Backends phải hiện IP:port, không "<error: endpoints not found>"
curl -s -H "Host: shop.m3.local" http://localhost/api/products   # nhờ extraPortMappings 80 của kind
~~~

**Vì sao:** Prefix khớp theo **từng đoạn path** ({{/api}} khớp {{/api}} và {{/api/products}} nhưng không khớp {{/apis}}). Backend của Ingress trỏ **cổng của Service** (port), không phải containerPort. Rule có {{host}} chỉ nhận request đúng Host header; host khác rơi vào default backend (404).

> Mẹo tiết kiệm thời gian: {{kubectl describe ingress}} cho biết ngay backend nào sai (endpoints not found). Không có trình duyệt thì test bằng {{curl -H "Host: ..."}} hoặc từ pod tạm qua Service của controller.`,
        refs: [{ type: 'doc', title: 'Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
        tags: ['ingress', 'pathType', 'ingressClassName', 'troubleshooting'],
      },
      // ---------------------------------------------------------------- 15 debug
      {
        id: 'ckad-3-15', no: 15, domain: 'Observability & Maintenance', weight: 6, env: 'kind', minutes: 8,
        title: 'Debug hai pod: log --previous của pod crash và ephemeral container cho image không shell',
        task: CTX + `Namespace {{m3-debug}} có hai pod gặp vấn đề.

**Phần A.** Pod {{invoice}} đang CrashLoopBackOff. Manifest ở {{/opt/ckad/m3-debug/invoice.yaml}}.
1. Ghi **nguyên văn** dòng lỗi mà container in ra trước khi chết vào {{/opt/ckad/m3-debug/error.txt}}.
2. Sửa pod để chạy ổn định. **Không** sửa ConfigMap {{invoice-config}} và không đổi lệnh của container; chỉ sửa cách mount.

**Phần B.** Pod {{pricing}} (container {{pricing}}) dùng image không có shell. Dùng **ephemeral container** image {{busybox:1.36}} chia sẻ process namespace với container {{pricing}}, tìm lệnh (COMMAND) của tiến trình PID 1 trong container đó và ghi vào {{/opt/ckad/m3-debug/pricing-pid1.txt}}. Không tạo lại pod {{pricing}}.`,
        setup: `kubectl create ns m3-debug --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-debug && rm -f /opt/ckad/m3-debug/error.txt /opt/ckad/m3-debug/pricing-pid1.txt
kubectl create configmap invoice-config -n m3-debug --from-literal=application.conf=currency=VND --dry-run=client -o yaml | kubectl apply -f -
cat > /opt/ckad/m3-debug/invoice.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata:
  name: invoice
  namespace: m3-debug
spec:
  containers:
  - name: invoice
    image: busybox:1.36
    command:
    - sh
    - -c
    - |
      if [ ! -f /config/app.conf ]; then
        echo "FATAL: config file /config/app.conf not found"
        exit 1
      fi
      echo "invoice started"
      sleep 86400
    volumeMounts:
    - name: cfg
      mountPath: /config
  volumes:
  - name: cfg
    configMap:
      name: invoice-config
EOF
kubectl delete pod invoice pricing -n m3-debug --ignore-not-found --wait=true
kubectl apply -f /opt/ckad/m3-debug/invoice.yaml
kubectl run pricing -n m3-debug --image=registry.k8s.io/pause:3.9`,
        verify: H + `NS=m3-debug
grep -qx "FATAL: config file /config/app.conf not found" /opt/ckad/m3-debug/error.txt 2>/dev/null && ok error-file || ko error-file "error.txt phải chứa đúng dòng lỗi"
kubectl wait --for=condition=Ready pod/invoice -n $NS --timeout=60s >/dev/null 2>&1 && ok invoice-ready || ko invoice-ready "invoice chưa Ready"
kubectl logs invoice -n $NS 2>/dev/null | grep -q "invoice started" && [ "$(kubectl exec invoice -n $NS -- cat /config/app.conf 2>/dev/null)" = "currency=VND" ] && ok invoice-config || ko invoice-config "/config/app.conf chưa có nội dung từ ConfigMap"
K=$(kubectl get cm invoice-config -n $NS -o jsonpath='{.data.application\\.conf}/{.data.app\\.conf}' 2>/dev/null)
[ "$K" = "currency=VND/" ] && ok configmap-unchanged || ko configmap-unchanged "ConfigMap invoice-config bị sửa"
EC=$(kubectl get pod pricing -n $NS -o jsonpath='{.spec.ephemeralContainers[*].image}|{.spec.ephemeralContainers[*].targetContainerName}' 2>/dev/null)
echo "$EC" | grep -q "busybox:1.36" && echo "$EC" | cut -d'|' -f2 | grep -qw pricing && ok ephemeral-container || ko ephemeral-container "pricing chưa có ephemeral container busybox --target=pricing"
grep -q "/pause" /opt/ckad/m3-debug/pricing-pid1.txt 2>/dev/null && ok pid1-file || ko pid1-file "pricing-pid1.txt sai"
echo "RESULT $P/$T"`,
        solution: `**Phần A**

~~~bash
kubectl config use-context kind-ckad
kubectl logs invoice -n m3-debug --previous       # FATAL: config file /config/app.conf not found
kubectl logs invoice -n m3-debug --previous | grep FATAL > /opt/ckad/m3-debug/error.txt
kubectl get cm invoice-config -n m3-debug -o yaml # key thật là application.conf
~~~

ConfigMap mount cả thư mục thì mỗi **key** thành một file, nên chỉ có {{/config/application.conf}}. Dùng {{items}} để đổi tên file (không sửa ConfigMap):

~~~yaml
  volumes:
  - name: cfg
    configMap:
      name: invoice-config
      items:
      - key: application.conf
        path: app.conf
~~~

~~~bash
kubectl replace --force -f /opt/ckad/m3-debug/invoice.yaml   # volume của pod không sửa tại chỗ được
~~~

**Phần B**

~~~bash
kubectl debug -it pricing -n m3-debug --image=busybox:1.36 --target=pricing -- sh
# trong shell của ephemeral container:
ps                     # PID 1 = /pause
exit
echo "/pause" > /opt/ckad/m3-debug/pricing-pid1.txt
~~~

**Vì sao:** {{--previous}} đọc log của container **lần chạy trước** (đã chết); không có nó bạn thường chỉ thấy log rỗng của lần đang khởi động. {{kubectl debug --target}} thêm ephemeral container vào pod **đang chạy** (không restart) và cho nó dùng chung process namespace với container đích, nên {{ps}} thấy tiến trình của image distroless/pause. Ephemeral container không xoá được; nó nằm trong {{spec.ephemeralContainers}} tới khi pod bị xoá.

> Mẹo tiết kiệm thời gian: CrashLoopBackOff luôn bắt đầu bằng {{logs --previous}} và {{describe}} (Last State, Exit Code). Image không có shell: nghĩ ngay tới {{kubectl debug --target}}, đừng tốn thời gian thử {{kubectl exec}}.`,
        refs: [
          { type: 'doc', title: 'Debug Running Pods', url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/' },
          { type: 'doc', title: 'Configure a Pod to Use a ConfigMap', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/' },
        ],
        tags: ['kubectl debug', 'ephemeral container', 'logs --previous', 'configmap items'],
      },
      // ---------------------------------------------------------------- 16 ResourceQuota
      {
        id: 'ckad-3-16', no: 16, domain: 'Environment, Config & Security', weight: 6, env: 'kind', minutes: 6,
        title: 'Rollout kẹt vì ResourceQuota hết chỗ cho pod surge',
        task: CTX + `Trong namespace {{m3-quota}}, Deployment {{stock-api}} (4 replica) vừa được đổi image sang {{nginx:1.27-alpine}} nhưng rollout đứng yên, pod mới không được tạo. Namespace có ResourceQuota {{team-quota}}.

1. Tìm nguyên nhân. Ghi **tên tài nguyên** của quota bị vượt (đúng như trong ResourceQuota, ví dụ {{limits.memory}}) vào {{/opt/ckad/m3-quota/exceeded.txt}}.
2. Làm cho rollout hoàn tất với **mọi** ràng buộc: không sửa/xoá ResourceQuota, không đổi resources của container, giữ 4 replica, vẫn dùng chiến lược {{RollingUpdate}}. Được phép tạm thời chỉ còn 3 pod sẵn sàng trong lúc cập nhật.

Kết quả: 4 pod Ready chạy {{nginx:1.27-alpine}}.`,
        setup: `kubectl create ns m3-quota --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/m3-quota && rm -f /opt/ckad/m3-quota/exceeded.txt
kubectl delete deploy stock-api -n m3-quota --ignore-not-found --wait=true
kubectl apply -f - <<'EOF'
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: m3-quota
spec:
  hard:
    requests.cpu: "1"
    requests.memory: 2Gi
    limits.cpu: "4"
    limits.memory: 4Gi
    pods: "10"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: stock-api
  namespace: m3-quota
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: stock-api
  template:
    metadata:
      labels:
        app: stock-api
    spec:
      containers:
      - name: nginx
        image: nginx:1.26-alpine
        resources:
          requests:
            cpu: 250m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
EOF
kubectl rollout status deploy/stock-api -n m3-quota --timeout=180s || true
kubectl set image deploy/stock-api -n m3-quota nginx=nginx:1.27-alpine`,
        verify: H + `NS=m3-quota
[ "$(tr -d ' \\r\\n' 2>/dev/null < /opt/ckad/m3-quota/exceeded.txt 2>/dev/null)" = "requests.cpu" ] && ok exceeded-file || ko exceeded-file "exceeded.txt sai"
Q=$(kubectl get resourcequota team-quota -n $NS -o jsonpath='{.spec.hard.requests\\.cpu} {.spec.hard.pods}' 2>/dev/null)
[ "$Q" = "1 10" ] && ok quota-unchanged || ko quota-unchanged "ResourceQuota bị sửa: '$Q'"
RS=$(kubectl get deploy stock-api -n $NS -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu} {.spec.template.spec.containers[0].resources.limits.cpu} {.spec.replicas} {.spec.strategy.type}' 2>/dev/null)
[ "$RS" = "250m 500m 4 RollingUpdate" ] && ok constraints-kept || ko constraints-kept "resources/replicas/strategy bị đổi: '$RS'"
kubectl rollout status deploy/stock-api -n $NS --timeout=150s >/dev/null 2>&1 && ok rollout-complete || ko rollout-complete "rollout vẫn kẹt"
I=$(kubectl get deploy stock-api -n $NS -o jsonpath='{.spec.template.spec.containers[0].image} {.status.readyReplicas} {.status.updatedReplicas}' 2>/dev/null)
[ "$I" = "nginx:1.27-alpine 4 4" ] && ok updated || ko updated "image/ready/updated='$I'"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
kubectl rollout status deploy/stock-api -n m3-quota --timeout=10s   # waiting... 0 of 4 updated
kubectl get rs -n m3-quota                                          # RS mới DESIRED 1, CURRENT 0
kubectl describe rs -n m3-quota | grep -i quota
# Error creating: pods "stock-api-..." is forbidden: exceeded quota: team-quota,
#   requested: requests.cpu=250m, used: requests.cpu=1, limited: requests.cpu=1
kubectl describe resourcequota team-quota -n m3-quota               # requests.cpu 1/1
echo requests.cpu > /opt/ckad/m3-quota/exceeded.txt
kubectl patch deploy stock-api -n m3-quota \\
  -p '{"spec":{"strategy":{"rollingUpdate":{"maxSurge":0,"maxUnavailable":1}}}}'
kubectl rollout status deploy/stock-api -n m3-quota
~~~

**Vì sao:** 4 pod x 250m = 1 CPU, dùng hết {{requests.cpu}} của quota. Với {{maxSurge: 1, maxUnavailable: 0}} controller phải tạo pod thứ 5 **trước** khi xoá pod cũ, nhưng admission của ResourceQuota từ chối pod đó, nên rollout đứng yên mãi (Deployment không báo lỗi, lỗi nằm ở Events của **ReplicaSet**). Đổi sang {{maxSurge: 0, maxUnavailable: 1}}: xoá 1 pod cũ trả lại 250m rồi tạo 1 pod mới, lặp lại 4 lần. Bài học production: quota phải chừa chỗ cho surge (khoảng 25% hoặc 1 pod) nếu muốn rollout không mất capacity.

> Mẹo tiết kiệm thời gian: Deployment "đứng yên" mà pod không có gì lỗi thì {{kubectl get events -n <ns> --sort-by=.lastTimestamp | tail}}: lỗi quota, LimitRange, PodSecurity đều hiện ở đó với tên ReplicaSet.`,
        refs: [{ type: 'doc', title: 'Resource Quotas', url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/' }],
        tags: ['resourcequota', 'rollout', 'maxSurge', 'events'],
      },
      // ---------------------------------------------------------------- 17 Kustomize overlay
      {
        id: 'ckad-3-17', no: 17, domain: 'Deployment', weight: 4, env: 'kind', minutes: 6,
        title: 'Kustomize overlay prod: namespace, namePrefix, label, đổi image tag, patch replicas',
        task: CTX + `Thư mục {{/opt/ckad/m3-17/base}} chứa kustomization cho Deployment {{api}} và Service {{api}}. **Không** sửa base. Tạo overlay {{/opt/ckad/m3-17/overlays/prod/kustomization.yaml}} sao cho khi {{kubectl apply -k /opt/ckad/m3-17/overlays/prod}}:

- mọi resource vào namespace {{m3-kust}} và có tên tiền tố {{prod-}} (thành {{prod-api}});
- mọi resource có nhãn {{env=prod}};
- image {{nginx}} dùng tag {{1.27-alpine}};
- Deployment chạy 3 replica (dùng patch trong overlay).

Apply overlay đó. Kết quả: Deployment {{prod-api}} 3/3 Ready và Service {{prod-api}} có 3 endpoint trong {{m3-kust}}.`,
        setup: `kubectl create ns m3-kust --dry-run=client -o yaml | kubectl apply -f -
kubectl delete deploy prod-api -n m3-kust --ignore-not-found
kubectl delete svc prod-api -n m3-kust --ignore-not-found
mkdir -p /opt/ckad/m3-17/base
rm -rf /opt/ckad/m3-17/overlays
cat > /opt/ckad/m3-17/base/kustomization.yaml <<'EOF'
resources:
- deployment.yaml
- service.yaml
EOF
cat > /opt/ckad/m3-17/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: web
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
EOF
cat > /opt/ckad/m3-17/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  selector:
    app: api
  ports:
  - port: 80
    targetPort: 80
EOF`,
        verify: H + `NS=m3-kust
B=/opt/ckad/m3-17/base/deployment.yaml
grep -q "image: nginx:1.25-alpine" $B 2>/dev/null && grep -q "replicas: 1" $B && ok base-unchanged || ko base-unchanged "base bị sửa"
kubectl kustomize /opt/ckad/m3-17/overlays/prod >/dev/null 2>&1 && ok overlay-builds || ko overlay-builds "overlay không build được"
kubectl rollout status deploy/prod-api -n $NS --timeout=90s >/dev/null 2>&1
D=$(kubectl get deploy prod-api -n $NS -o jsonpath='{.status.readyReplicas} {.spec.template.spec.containers[0].image} {.metadata.labels.env}' 2>/dev/null)
[ "$D" = "3 nginx:1.27-alpine prod" ] && ok deployment || ko deployment "prod-api ready/image/label='$D'"
SL=$(kubectl get svc prod-api -n $NS -o jsonpath='{.metadata.labels.env}' 2>/dev/null)
N=$(kubectl get endpoints prod-api -n $NS -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)
[ "$SL" = "prod" ] && [ "$N" -eq 3 ] && ok service || ko service "Service prod-api label='$SL', endpoints=$N"
echo "RESULT $P/$T"`,
        solution: `~~~bash
kubectl config use-context kind-ckad
mkdir -p /opt/ckad/m3-17/overlays/prod && cd /opt/ckad/m3-17/overlays/prod
~~~

~~~yaml
# /opt/ckad/m3-17/overlays/prod/kustomization.yaml
resources:
- ../../base
namespace: m3-kust
namePrefix: prod-
labels:
- pairs:
    env: prod
images:
- name: nginx
  newTag: 1.27-alpine
patches:
- path: replicas.yaml
~~~

~~~yaml
# /opt/ckad/m3-17/overlays/prod/replicas.yaml (patch dùng TÊN GỐC của base)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
~~~

~~~bash
kubectl kustomize /opt/ckad/m3-17/overlays/prod      # xem trước output
kubectl apply -k /opt/ckad/m3-17/overlays/prod
kubectl get deploy,svc,endpoints -n m3-kust
~~~

**Vì sao:** patch tham chiếu resource theo **tên trong base** ({{api}}); namePrefix được áp sau, và kustomize tự đổi cả tham chiếu liên quan. Trường {{images}} đổi tag mà không đụng YAML base. {{labels}} với {{pairs}} chỉ thêm nhãn vào metadata (không đổi selector, an toàn với Deployment đã tồn tại); {{commonLabels}} cũ thì thêm cả vào selector, mà selector của Deployment là immutable.

> Mẹo tiết kiệm thời gian: luôn chạy {{kubectl kustomize <dir>}} trước khi {{apply -k}} để thấy ngay tên, namespace, image cuối cùng. Kustomize đã có sẵn trong kubectl, không cần cài binary riêng.`,
        refs: [{ type: 'doc', title: 'Declarative Management of Kubernetes Objects Using Kustomize', url: 'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/' }],
        tags: ['kustomize', 'overlay', 'namePrefix', 'images', 'patches'],
      },
    ],
  });
})();
