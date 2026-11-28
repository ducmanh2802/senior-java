/* CKAD labs part 1 (docs/CKAD-MOCK.md): module 1–4 — kubectl tốc độ, Pod design, Jobs/CronJobs, Container image. Task T2842. */
(function () {
  'use strict';
  // Hàm dùng chung cho mọi verify: ok/ko đếm điểm, eq so sánh chuỗi. Dòng cuối luôn là RESULT passed/total.
  var V = 'P=0; T=0\n' +
    'ok() { P=$((P+1)); T=$((T+1)); echo "PASS $1"; }\n' +
    'ko() { T=$((T+1)); echo "FAIL $1: $2"; }\n' +
    'eq() { if [ "$2" = "$3" ]; then ok "$1"; else ko "$1" "cần \'$3\', đang là \'$2\'"; fi; }\n';
  // probe <tên pod tạm> <url>: chạy wget từ một pod busybox tạm trong namespace $NS
  var PROBE = 'probe() { kubectl -n "$NS" delete pod "$1" --ignore-not-found --wait=true >/dev/null 2>&1; kubectl -n "$NS" run "$1" --rm -i --quiet --restart=Never --image=busybox:1.36 -- wget -qO- -T 5 "$2" 2>/dev/null; }\n';
  var END = '\necho "RESULT $P/$T"\n';

  (window.CKAD_LABS = window.CKAD_LABS || []).push(
  // ======================================================================= MODULE 1
  {
    id: 'ckad-lab-01', order: 1,
    title: 'kubectl tốc độ: imperative, dry-run, explain, context',
    summary: 'Luyện phản xạ kubectl để tiết kiệm thời gian thi: kubectl run/create/expose/set, sinh YAML bằng --dry-run=client -o yaml, tra field bằng kubectl explain, lọc output bằng jsonpath/custom-columns và đặt namespace mặc định cho context.',
    concepts: `### Vì sao tốc độ kubectl quyết định điểm CKAD
Bài thi CKAD chỉ có terminal và khoảng 2 giờ cho 15–20 bài, trung bình 6–7 phút mỗi bài. Gõ YAML từ đầu cho một Deployment mất 3–4 phút và dễ sai thụt lề; lệnh **imperative** tạo cùng object trong 10 giây. Chiến lược chuẩn: **imperative khi lệnh đủ flag**, còn khi cần field mà lệnh không có (resources, initContainers, volume…) thì **sinh khung YAML bằng {{--dry-run=client -o yaml}}**, sửa vài dòng rồi {{kubectl apply -f}}.

### Các nhóm lệnh cần thuộc
- {{kubectl run}} chỉ tạo **Pod** (từ 1.18). Flag hay dùng: {{--image}}, {{--labels}}, {{--port}}, {{--env}}, {{--restart=Never}}, {{--command -- sh -c "..."}}.
- {{kubectl create deployment|job|cronjob|configmap|secret|service|namespace}}: tạo object có generator riêng.
- {{kubectl expose}}: tạo Service lấy **selector của chính object** được expose (Deployment/Pod/Service).
- {{kubectl set image|env|resources|serviceaccount}}: sửa nhanh Deployment mà không mở editor.
- {{kubectl label}} / {{kubectl annotate}} (thêm dấu {{-}} sau key để xoá, {{--overwrite}} để ghi đè).
- {{kubectl explain pod.spec.containers --recursive}}: tra tên field ngay trong terminal, nhanh hơn tìm docs.

### Cheat sheet
~~~bash
alias k=kubectl                                 # thường đã có sẵn trên máy thi
export do="--dry-run=client -o yaml"            # k create deploy api --image=httpd $do > api.yaml
export now="--force --grace-period=0"           # xoá pod ngay: k delete pod x $now
kubectl config use-context kind-ckad            # LUÔN chạy dòng Context của từng bài
kubectl config set-context --current --namespace=lab01
kubectl run web --image=nginx:1.27-alpine --labels=app=web,tier=front --port=80
kubectl create deployment api --image=httpd:2.4-alpine --replicas=3 $do > api.yaml
kubectl expose deployment api --name=api-svc --port=8080 --target-port=80
kubectl set image deployment/api httpd=httpd:2.4.62-alpine
kubectl set resources deployment api --requests=cpu=100m,memory=64Mi --limits=memory=128Mi
kubectl explain deployment.spec.strategy.rollingUpdate
kubectl get pods -l tier=batch -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image --no-headers
kubectl get pod web -o jsonpath='{.spec.containers[0].image}'
~~~

### Bẫy hay gặp trong đề
- **Quên đổi context**: mỗi bài có thể ở cluster khác, làm đúng nhưng sai cluster là 0 điểm.
- **Quên {{-n}}**: object được tạo ở namespace {{default}}, verify không thấy.
- {{kubectl create service nodeport x}} đặt selector {{app=x}} theo **tên service**, không theo Deployment; muốn đúng selector hãy dùng {{kubectl expose}}.
- {{kubectl expose}} **không có flag nodePort**: sinh YAML rồi thêm {{nodePort}}, hoặc {{kubectl patch}} sau khi tạo.
- {{kubectl set image}} cần **tên container** (mặc định của {{create deployment}} là tên image, ví dụ {{nginx}}), không phải tên Deployment.
- File YAML sinh từ dry-run có {{status: {} }} và {{resources: {} }}: không sao khi apply, nhưng nhớ sửa {{resources: {} }} chứ đừng thêm khối resources thứ hai.

> Mẹo: đọc kỹ tên, namespace, image, port trong đề rồi copy-paste thay vì gõ lại; sai một ký tự là verify FAIL.`,
    videos: [
      { title: 'Kubernetes Components explained! Pods, Services, Secrets, ConfigMap | Kubernetes Tutorial 14', url: 'https://www.youtube.com/watch?v=Krpb44XR0bk', note: 'Xem toàn bộ để nắm Pod, Service, Deployment là gì trước khi luyện lệnh imperative tạo chúng.' },
      { title: 'Your Complete Guide to Passing CKAD the Right Way', url: 'https://www.youtube.com/watch?v=fnI_4wV7YZM', note: 'Xem phần chiến lược và thiết lập terminal (alias, dry-run, quản lý thời gian) để áp dụng vào module này.' },
      { title: 'My CKAD Strategy — The Certified Kubernetes Application Developer Exam (Yann Stoneman)', url: 'https://www.youtube.com/watch?v=7UzZU8KUqyw', note: 'Kinh nghiệm thực tế: thứ tự làm bài, dùng lệnh imperative và docs kubernetes.io sao cho nhanh.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-01-01', no: 1, domain: 'Design & Build', level: 'easy', env: 'kind', minutes: 3,
        title: 'Tạo Pod bằng một lệnh kubectl run',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab01}}, tạo Pod tên {{web}} chạy image {{nginx:1.27-alpine}} với yêu cầu:
- Label {{app=web}} và {{tier=front}}.
- Khai báo container port {{80}}.
- Pod phải ở trạng thái Ready và trả về trang chào của nginx khi gọi {{http://127.0.0.1}} từ bên trong container.

Chỉ dùng **một** lệnh {{kubectl run}}, không viết YAML.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 delete pod web --ignore-not-found --wait=true`,
        verify: 'NS=lab01\n' + V + `kubectl -n $NS wait --for=condition=Ready pod/web --timeout=90s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod web chưa Ready"
eq image "$(kubectl -n $NS get pod web -o jsonpath='{.spec.containers[0].image}' 2>/dev/null)" "nginx:1.27-alpine"
eq labels "$(kubectl -n $NS get pods -l app=web,tier=front -o name 2>/dev/null)" "pod/web"
eq port "$(kubectl -n $NS get pod web -o jsonpath='{.spec.containers[0].ports[0].containerPort}' 2>/dev/null)" "80"
kubectl -n $NS exec web -- wget -qO- -T 5 http://127.0.0.1 2>/dev/null | grep -q "Welcome to nginx" && ok http || ko http "không lấy được trang nginx trong pod"` + END,
        solution: `**Lệnh:**
~~~bash
kubectl config use-context kind-ckad
kubectl -n lab01 run web --image=nginx:1.27-alpine --labels=app=web,tier=front --port=80
kubectl -n lab01 get pod web --show-labels -w     # Ctrl+C khi thấy Running
~~~

**Vì sao:** {{kubectl run}} từ 1.18 chỉ tạo Pod, nhận đủ flag cho image, label ({{--labels}} nhận nhiều cặp phân cách bằng dấu phẩy) và port. Flag {{--port}} chỉ ghi {{containerPort}} vào spec (mang tính tài liệu, nginx vẫn nghe port 80 dù không khai báo), nhưng đề yêu cầu thì verify sẽ kiểm tra field này.

**Lỗi hay gặp:** dùng {{-l}} cho kubectl run (đó là flag của get), gõ {{--labels="app=web tier=front"}} có dấu cách, hoặc quên {{-n lab01}} nên Pod rơi vào namespace default.

> Mẹo tiết kiệm thời gian: đặt sẵn {{export do="--dry-run=client -o yaml"}} ngay đầu giờ thi; khi một lệnh run thiếu field, chỉ cần thêm {{$do > pod.yaml}} là có khung YAML để sửa.`,
        hints: ['Xem {{kubectl run -h}}: có flag {{--labels}} và {{--port}}.', 'Nhiều label viết {{--labels=app=web,tier=front}}, không có dấu cách.'],
        refs: [{ type: 'doc', title: 'kubectl Quick Reference', url: 'https://kubernetes.io/docs/reference/kubectl/quick-reference/' }],
        tags: ['kubectl run', 'labels'],
      },
      {
        id: 'ckad-lab-01-02', no: 2, domain: 'Deployment', level: 'easy', env: 'kind', minutes: 5,
        title: 'Sinh YAML bằng dry-run, sửa resources rồi apply',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab01}}:
1. Dùng {{kubectl create deployment ... --dry-run=client -o yaml}} để sinh manifest cho Deployment {{api}}, image {{httpd:2.4-alpine}}, {{3}} replicas. Lưu manifest vào file {{/opt/ckad/lab01-02.yaml}}.
2. Sửa file đó để container có requests {{cpu: 100m}} và {{memory: 64Mi}}.
3. Tạo Deployment từ file {{/opt/ckad/lab01-02.yaml}} (không dùng {{kubectl edit}} hay {{kubectl set}}).

Kết quả: Deployment {{api}} có 3 Pod Ready, mỗi Pod có đúng requests trên.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 delete deployment api --ignore-not-found --wait=true
mkdir -p /opt/ckad && rm -f /opt/ckad/lab01-02.yaml`,
        verify: 'NS=lab01\nF=/opt/ckad/lab01-02.yaml\n' + V + `[ -s $F ] && grep -q "kind: Deployment" $F && grep -q "name: api" $F && ok file || ko file "$F thiếu hoặc không phải manifest Deployment api"
grep -q "cpu: 100m" $F 2>/dev/null && grep -q "memory: 64Mi" $F 2>/dev/null && ok file-requests || ko file-requests "file chưa có requests cpu 100m / memory 64Mi"
kubectl -n $NS rollout status deployment/api --timeout=120s >/dev/null 2>&1 && ok rollout || ko rollout "deployment api chưa rollout xong"
eq ready "$(kubectl -n $NS get deployment api -o jsonpath='{.status.readyReplicas}' 2>/dev/null)" "3"
eq req-cpu "$(kubectl -n $NS get deployment api -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu}' 2>/dev/null)" "100m"
eq req-mem "$(kubectl -n $NS get deployment api -o jsonpath='{.spec.template.spec.containers[0].resources.requests.memory}' 2>/dev/null)" "64Mi"` + END,
        solution: `**Lệnh:**
~~~bash
kubectl -n lab01 create deployment api --image=httpd:2.4-alpine --replicas=3 \\
  --dry-run=client -o yaml > /opt/ckad/lab01-02.yaml
vi /opt/ckad/lab01-02.yaml      # thay dòng "resources: {}" như dưới
kubectl apply -f /opt/ckad/lab01-02.yaml
kubectl -n lab01 rollout status deployment/api
~~~

Đoạn container sau khi sửa:
~~~yaml
      containers:
      - image: httpd:2.4-alpine
        name: httpd
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
~~~

**Vì sao:** {{kubectl create deployment}} không có flag resources, nên cách nhanh nhất là sinh khung rồi sửa đúng một khối. Vì file được sinh với {{-n lab01}} nên manifest đã có {{namespace: lab01}}, apply không cần thêm {{-n}}. Đề yêu cầu tạo từ file để luyện thói quen giữ manifest: khi phải sửa lại, chỉ cần sửa file và apply lần nữa.

**Lỗi hay gặp:** để nguyên {{resources: {} }} rồi thêm một khối {{resources:}} thứ hai (YAML trùng key, field sau ghi đè hoặc bị cảnh báo), thụt lề {{requests}} sai cấp.

> Mẹo tiết kiệm thời gian: trong vi dùng {{:set paste}} trước khi dán YAML để không bị thụt lề lũy tiến; {{kubectl apply -f file --dry-run=server}} giúp bắt lỗi schema trước khi tạo thật.`,
        hints: ['Sinh file bằng {{--dry-run=client -o yaml > /opt/ckad/lab01-02.yaml}}.', 'Thay dòng {{resources: {} }} bằng khối {{requests}} có {{cpu}} và {{memory}}.'],
        refs: [{ type: 'doc', title: 'Resource Management for Pods and Containers', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' }],
        tags: ['dry-run', 'deployment', 'resources'],
      },
      {
        id: 'ckad-lab-01-03', no: 3, domain: 'Services & Networking', level: 'medium', env: 'kind', minutes: 7,
        title: 'Expose Deployment thành ClusterIP và NodePort cố định',
        task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab01}} đã có Deployment {{shop}} (2 replicas, nginx nghe port 80). Hãy tạo:
1. Service {{shop-svc}} kiểu ClusterIP: port {{8080}} chuyển tới targetPort {{80}} của các Pod {{shop}}.
2. Service {{shop-np}} kiểu NodePort: port {{80}}, targetPort {{80}}, nodePort cố định {{31041}}.

Cả hai Service phải chọn đúng 2 Pod của Deployment {{shop}}. Gọi {{http://shop-svc:8080}} từ một Pod trong {{lab01}} và gọi {{<InternalIP của node>:31041}} đều phải nhận trang nginx.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 create deployment shop --image=nginx:1.27-alpine --replicas=2 --port=80 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 delete service shop-svc shop-np --ignore-not-found`,
        verify: 'NS=lab01\n' + V + PROBE + `kubectl -n $NS rollout status deployment/shop --timeout=90s >/dev/null 2>&1 || true
eq svc-port "$(kubectl -n $NS get svc shop-svc -o jsonpath='{.spec.type} {.spec.ports[0].port} {.spec.ports[0].targetPort}' 2>/dev/null)" "ClusterIP 8080 80"
eq np-port "$(kubectl -n $NS get svc shop-np -o jsonpath='{.spec.type} {.spec.ports[0].nodePort}' 2>/dev/null)" "NodePort 31041"
eq np-endpoints "$(kubectl -n $NS get endpointslices -l kubernetes.io/service-name=shop-np -o jsonpath='{.items[*].endpoints[*].addresses[*]}' 2>/dev/null | wc -w | tr -d ' ')" "2"
probe lab01-03-c1 http://shop-svc:8080 | grep -q "Welcome to nginx" && ok clusterip-http || ko clusterip-http "không gọi được http://shop-svc:8080"
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
probe lab01-03-c2 "http://$NODE_IP:31041" | grep -q "Welcome to nginx" && ok nodeport-http || ko nodeport-http "không gọi được $NODE_IP:31041"` + END,
        solution: `**ClusterIP:** {{kubectl expose}} lấy selector của Deployment nên chắc chắn khớp Pod:
~~~bash
kubectl -n lab01 expose deployment shop --name=shop-svc --port=8080 --target-port=80
~~~

**NodePort cố định:** {{kubectl expose}} không có flag {{--node-port}}, còn {{kubectl create service nodeport}} có flag này nhưng lại đặt selector {{app=shop-np}} (theo tên service) nên không chọn Pod nào. Cách nhanh và an toàn: expose rồi patch nodePort.
~~~bash
kubectl -n lab01 expose deployment shop --name=shop-np --type=NodePort --port=80 --target-port=80
kubectl -n lab01 patch service shop-np -p '{"spec":{"ports":[{"port":80,"nodePort":31041}]}}'
kubectl -n lab01 get endpointslices -l kubernetes.io/service-name=shop-np
~~~

Hoặc sinh YAML và thêm một dòng:
~~~yaml
  ports:
  - port: 80
    targetPort: 80
    nodePort: 31041
  type: NodePort
~~~

**Vì sao:** Service định tuyến theo **selector**, không theo tên. Luôn kiểm tra EndpointSlice (hoặc {{kubectl get ep}}) sau khi tạo Service: rỗng nghĩa là selector sai hoặc Pod chưa Ready. Patch strategic merge dùng {{port}} làm khoá trộn của mảng {{ports}}, nên chỉ cập nhật đúng phần tử port 80.

> Mẹo tiết kiệm thời gian: kiểm tra nhanh bằng {{kubectl run tmp --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- -T 3 http://shop-svc:8080}}, mất 5 giây và chứng minh được cả DNS lẫn port.`,
        hints: ['{{kubectl expose}} giữ đúng selector của Deployment; {{kubectl create service}} thì không.', 'nodePort đặt bằng {{kubectl patch}} hoặc sửa YAML sinh từ {{--dry-run=client -o yaml}}.'],
        refs: [{ type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
        tags: ['expose', 'nodeport', 'service'],
      },
      {
        id: 'ckad-lab-01-04', no: 4, domain: 'Deployment', level: 'medium', env: 'kind', minutes: 6,
        title: 'Sửa Deployment bằng kubectl set, scale và annotate',
        task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab01}} có Deployment {{cart}} chạy {{nginx:1.25-alpine}} với 1 replica. Không dùng {{kubectl edit}} và không viết YAML, hãy:
1. Đổi image của container sang {{nginx:1.27-alpine}}.
2. Thêm biến môi trường {{APP_MODE=prod}} cho container.
3. Scale Deployment lên {{3}} replicas.
4. Thêm annotation {{owner=team-cart}} lên chính Deployment {{cart}}.

Sau khi xong, cả 3 Pod phải Ready, chạy image mới và thấy biến {{APP_MODE}}.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 delete deployment cart --ignore-not-found --wait=true
kubectl -n lab01 create deployment cart --image=nginx:1.25-alpine --replicas=1`,
        verify: 'NS=lab01\n' + V + `kubectl -n $NS rollout status deployment/cart --timeout=120s >/dev/null 2>&1 && ok rollout || ko rollout "rollout chưa xong"
eq image "$(kubectl -n $NS get deployment cart -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)" "nginx:1.27-alpine"
eq ready "$(kubectl -n $NS get deployment cart -o jsonpath='{.status.readyReplicas}' 2>/dev/null)" "3"
eq env "$(kubectl -n $NS exec deploy/cart -- printenv APP_MODE 2>/dev/null)" "prod"
eq annotation "$(kubectl -n $NS get deployment cart -o jsonpath='{.metadata.annotations.owner}' 2>/dev/null)" "team-cart"` + END,
        solution: `**Lệnh:**
~~~bash
kubectl -n lab01 set image deployment/cart nginx=nginx:1.27-alpine
kubectl -n lab01 set env deployment/cart APP_MODE=prod
kubectl -n lab01 scale deployment cart --replicas=3
kubectl -n lab01 annotate deployment cart owner=team-cart
kubectl -n lab01 rollout status deployment/cart
kubectl -n lab01 exec deploy/cart -- printenv APP_MODE
~~~

**Vì sao:**
- {{kubectl set image}} cần cặp {{<tên container>=<image>}}. {{kubectl create deployment --image=nginx:...}} đặt tên container là {{nginx}}; không chắc thì xem bằng {{kubectl get deploy cart -o jsonpath='{.spec.template.spec.containers[*].name}'}}.
- {{set image}} và {{set env}} đều sửa pod template nên mỗi lệnh sinh một ReplicaSet mới (một lần rollout). Không sao với bài này; nếu muốn gộp thành một rollout thì {{kubectl rollout pause}} trước và {{resume}} sau (module 5).
- {{scale}} chỉ đổi {{spec.replicas}}, không tạo revision mới.
- {{annotate deployment}} gắn vào metadata của Deployment, không phải của Pod; đề hỏi "lên chính Deployment" nên không đụng tới template.

> Mẹo tiết kiệm thời gian: {{kubectl exec deploy/cart -- ...}} tự chọn một Pod của Deployment, không cần tra tên Pod có hash.`,
        hints: ['Tên container mặc định là {{nginx}}: {{kubectl set image deployment/cart nginx=...}}.', 'Bốn lệnh: {{set image}}, {{set env}}, {{scale}}, {{annotate}}.'],
        refs: [{ type: 'doc', title: 'kubectl Quick Reference', url: 'https://kubernetes.io/docs/reference/kubectl/quick-reference/' }],
        tags: ['set image', 'set env', 'scale', 'annotate'],
      },
      {
        id: 'ckad-lab-01-05', no: 5, domain: 'Observability & Maintenance', level: 'medium', env: 'kind', minutes: 6,
        title: 'Lọc output bằng custom-columns và tra field bằng explain',
        task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab01}} có nhiều Pod, một số mang label {{tier=batch}}.
1. Ghi vào {{/opt/ckad/lab01-05.txt}} danh sách **mọi Pod có label tier=batch** trong {{lab01}}, mỗi dòng một Pod theo định dạng {{<tên-pod> <image của container đầu tiên>}} (cách nhau một dấu cách), sắp xếp theo tên Pod, không có dòng tiêu đề.
2. Dùng {{kubectl explain}} để tìm tên field trong {{pod.spec.containers}} quyết định **khi nào kubelet kéo image** (Always/IfNotPresent/Never). Ghi đúng tên field (chỉ một từ) vào {{/opt/ckad/lab01-05-field.txt}}.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
for p in batch-a batch-b batch-c web-1; do kubectl -n lab01 delete pod $p --ignore-not-found --wait=false; done
kubectl -n lab01 wait --for=delete pod/batch-a pod/batch-b pod/batch-c pod/web-1 --timeout=60s 2>/dev/null || true
kubectl -n lab01 run batch-c --image=busybox:1.36 --labels=tier=batch --command -- sleep 3600
kubectl -n lab01 run batch-a --image=alpine:3.20 --labels=tier=batch --command -- sleep 3600
kubectl -n lab01 run batch-b --image=alpine:3.19 --labels=tier=batch,team=data --command -- sleep 3600
kubectl -n lab01 run web-1 --image=nginx:1.27-alpine --labels=tier=web
mkdir -p /opt/ckad && rm -f /opt/ckad/lab01-05.txt /opt/ckad/lab01-05-field.txt`,
        verify: 'NS=lab01\nF=/opt/ckad/lab01-05.txt\n' + V + `EXP=$(kubectl -n $NS get pods -l tier=batch -o custom-columns=N:.metadata.name,I:.spec.containers[0].image --no-headers 2>/dev/null | sort | awk '{print $1" "$2}')
GOT=$(awk 'NF {print $1" "$2}' $F 2>/dev/null)
[ -n "$EXP" ] && [ "$EXP" = "$GOT" ] && ok pod-list || ko pod-list "nội dung $F chưa khớp danh sách pod tier=batch"
[ "$(awk 'NF' $F 2>/dev/null | head -1 | awk '{print $1}')" = "batch-a" ] && ok sorted || ko sorted "dòng đầu phải là batch-a (sắp theo tên, không có tiêu đề)"
eq field "$(tr -d ' ' < /opt/ckad/lab01-05-field.txt 2>/dev/null | head -1)" "imagePullPolicy"` + END,
        solution: `**Danh sách Pod:**
~~~bash
kubectl -n lab01 get pods -l tier=batch \\
  -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image \\
  --no-headers --sort-by=.metadata.name > /opt/ckad/lab01-05.txt
cat /opt/ckad/lab01-05.txt
~~~
custom-columns in các cột cách nhau bằng nhiều dấu cách để căn lề; nếu đề đòi **đúng một dấu cách** thì dùng jsonpath với range:
~~~bash
kubectl -n lab01 get pods -l tier=batch --sort-by=.metadata.name \\
  -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.containers[0].image}{"\\n"}{end}' > /opt/ckad/lab01-05.txt
~~~

**Tra field:**
~~~bash
kubectl explain pod.spec.containers | grep -i pull
kubectl explain pod.spec.containers.imagePullPolicy
echo imagePullPolicy > /opt/ckad/lab01-05-field.txt
~~~

**Vì sao:** {{--no-headers}} bỏ dòng tiêu đề, {{--sort-by}} sắp theo JSONPath ngay phía server-side output. {{kubectl explain}} đọc OpenAPI schema của chính cluster nên luôn khớp phiên bản, và nhanh hơn mở docs khi chỉ cần tên field hoặc kiểu dữ liệu.

> Mẹo tiết kiệm thời gian: {{kubectl explain pod.spec --recursive | less}} rồi gõ {{/tên}} để tìm; với đề "ghi kết quả vào file", luôn {{cat}} lại file để chắc không có dòng tiêu đề thừa.`,
        hints: ['{{-o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image --no-headers}}.', 'Thêm {{--sort-by=.metadata.name}}; với explain thử {{kubectl explain pod.spec.containers | grep -i pull}}.'],
        refs: [{ type: 'doc', title: 'JSONPath Support', url: 'https://kubernetes.io/docs/reference/kubectl/jsonpath/' }],
        tags: ['custom-columns', 'jsonpath', 'explain'],
      },
      {
        id: 'ckad-lab-01-06', no: 6, domain: 'Deployment', level: 'hard', env: 'kind', minutes: 10,
        title: 'Tổng hợp: namespace mặc định, Deployment, Service và Pod client',
        task: `Context: {{kubectl config use-context kind-ckad}}

Làm nhanh nhất có thể, chỉ dùng lệnh imperative (được sinh YAML bằng dry-run nếu cần):
1. Đặt namespace mặc định của context hiện tại thành {{lab01}} (sau bài này các lệnh không cần {{-n}}).
2. Tạo Deployment {{catalog}}: image {{nginx:1.27-alpine}}, {{2}} replicas, container port {{80}}.
3. Container của {{catalog}} có requests {{cpu=50m}}, {{memory=64Mi}} và limits {{memory=128Mi}}.
4. Tạo Service ClusterIP {{catalog}} port {{80}} trỏ tới các Pod của Deployment.
5. Tạo Pod {{catalog-client}} image {{busybox:1.36}}, label {{role=client}}, chạy lệnh {{sleep 3600}}. Từ Pod này, {{wget -qO- http://catalog}} phải trả về trang nginx.

Lưu ý: verify kiểm tra cả namespace mặc định của context, nên đừng đổi lại trước khi chạy verify.`,
        setup: `kubectl create namespace lab01 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab01 delete deployment catalog --ignore-not-found
kubectl -n lab01 delete service catalog --ignore-not-found
kubectl -n lab01 delete pod catalog-client --ignore-not-found --wait=true`,
        verify: 'NS=lab01\n' + V + `eq ctx-namespace "$(kubectl config view --minify -o jsonpath='{..namespace}')" "lab01"
kubectl -n $NS rollout status deployment/catalog --timeout=120s >/dev/null 2>&1 && ok rollout || ko rollout "deployment catalog chưa sẵn sàng"
eq ready "$(kubectl -n $NS get deployment catalog -o jsonpath='{.status.readyReplicas}' 2>/dev/null)" "2"
eq resources "$(kubectl -n $NS get deployment catalog -o jsonpath='{.spec.template.spec.containers[0].resources.requests.cpu} {.spec.template.spec.containers[0].resources.requests.memory} {.spec.template.spec.containers[0].resources.limits.memory}' 2>/dev/null)" "50m 64Mi 128Mi"
eq svc "$(kubectl -n $NS get svc catalog -o jsonpath='{.spec.type} {.spec.ports[0].port}' 2>/dev/null)" "ClusterIP 80"
eq endpoints "$(kubectl -n $NS get endpointslices -l kubernetes.io/service-name=catalog -o jsonpath='{.items[*].endpoints[*].addresses[*]}' 2>/dev/null | wc -w | tr -d ' ')" "2"
eq client-label "$(kubectl -n $NS get pods -l role=client -o name 2>/dev/null)" "pod/catalog-client"
kubectl -n $NS wait --for=condition=Ready pod/catalog-client --timeout=60s >/dev/null 2>&1
kubectl -n $NS exec catalog-client -- wget -qO- -T 5 http://catalog 2>/dev/null | grep -q "Welcome to nginx" && ok client-http || ko client-http "catalog-client không gọi được http://catalog"` + END,
        solution: `**Lệnh (khoảng 1 phút nếu gõ quen):**
~~~bash
kubectl config set-context --current --namespace=lab01
kubectl create deployment catalog --image=nginx:1.27-alpine --replicas=2 --port=80
kubectl set resources deployment catalog --requests=cpu=50m,memory=64Mi --limits=memory=128Mi
kubectl expose deployment catalog --port=80
kubectl run catalog-client --image=busybox:1.36 --labels=role=client --command -- sleep 3600
kubectl rollout status deployment/catalog
kubectl exec catalog-client -- wget -qO- -T 3 http://catalog | head -4
~~~

**Vì sao từng bước:**
- {{set-context --current --namespace}} chỉ sửa kubeconfig phía client, giúp các lệnh sau ngắn hơn; trên máy thi mỗi bài có thể dùng context khác, nên chỉ đặt khi làm nhiều lệnh liền trong một namespace.
- {{kubectl set resources}} thay cho việc mở YAML; requests ảnh hưởng scheduling, limits memory là trần OOMKill.
- {{kubectl expose}} không cần {{--target-port}} vì Deployment đã khai báo containerPort 80 và targetPort mặc định bằng port.
- {{--command -- sleep 3600}}: phần sau {{--}} thay cho {{command}} của container; thiếu {{--command}} thì nó thành {{args}} (vẫn chạy với busybox, nhưng với image có ENTRYPOINT sẽ sai).

Khôi phục sau khi verify xong:
~~~bash
kubectl config set-context --current --namespace=default
~~~

> Mẹo tiết kiệm thời gian: kiểm tra namespace đang dùng bằng {{kubectl config view --minify | grep namespace}} trước khi tạo object; tạo nhầm namespace là lỗi mất điểm phổ biến nhất.`,
        hints: ['{{kubectl config set-context --current --namespace=lab01}}.', 'Chuỗi lệnh: {{create deployment}} → {{set resources}} → {{expose}} → {{run ... --command -- sleep 3600}}.', 'Service tên trùng Deployment thì {{kubectl expose deployment catalog --port=80}} là đủ.'],
        refs: [{ type: 'doc', title: 'Configure Access to Multiple Clusters', url: 'https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/' }],
        tags: ['context', 'namespace', 'imperative'],
      },
    ],
  },
  // ======================================================================= MODULE 2
  {
    id: 'ckad-lab-02', order: 2,
    title: 'Pod design: labels, init container, sidecar, adapter',
    summary: 'Thiết kế Pod đúng chuẩn: labels/selectors/annotations, init container chờ phụ thuộc, native sidecar (initContainers với restartPolicy: Always), adapter chuyển định dạng log và chia sẻ dữ liệu giữa các container bằng emptyDir.',
    concepts: `### Labels, selectors, annotations
- **Label** là cặp key/value dùng để **chọn** object: Service, Deployment, NetworkPolicy, {{kubectl get -l}} đều dựa vào label. **Annotation** chỉ để ghi thông tin (owner, change-cause, cấu hình cho controller), không dùng để chọn.
- Selector dạng bằng: {{app=api,env!=dev}}. Dạng tập hợp: {{env in (prod,staging)}}, {{tier notin (frontend)}}, {{!legacy}} (không có key). Lưu ý {{tier!=frontend}} **cũng khớp Pod không có key tier**.

### Vì sao cần nhiều container trong một Pod
Các container trong một Pod dùng chung network namespace (gọi nhau qua {{localhost}}) và có thể mount chung volume, được lập lịch cùng node và sống chết cùng nhau. Ba pattern hay hỏi:
| Pattern | Vai trò | Ví dụ |
|---|---|---|
| Init container | chạy **tuần tự, chạy xong mới tới container chính** | chờ DB có DNS, render config, migrate schema |
| Sidecar | chạy **song song suốt đời Pod**, bổ trợ app | đẩy log, proxy, đồng bộ file |
| Adapter | biến output của app thành định dạng chuẩn | đổi log thô thành dòng metric |

### Native sidecar (GA từ Kubernetes 1.33, bật mặc định từ 1.29)
Khai báo sidecar trong {{initContainers}} kèm {{restartPolicy: Always}}. Lợi ích so với để sidecar trong {{containers}}: sidecar **khởi động trước** app và đã sẵn sàng (nếu có startupProbe/readinessProbe), **không chặn Job hoàn thành** (Job chỉ chờ container chính kết thúc) và **dừng sau** container chính khi Pod tắt. Thứ tự trong {{initContainers}} có ý nghĩa: init container thường đứng trước sẽ chạy xong rồi sidecar mới bắt đầu.

### emptyDir
Volume tạm sống theo vòng đời Pod (xoá khi Pod bị xoá, giữ nguyên khi container restart). Dùng để init container ghi file cho container chính, hoặc app ghi log cho sidecar đọc. {{emptyDir.medium: Memory}} dùng tmpfs (tính vào memory limit).

### Cheat sheet
~~~bash
kubectl label pods -l env=prod release=stable          # gắn label hàng loạt
kubectl label pod legacy tier-                          # xoá label tier
kubectl annotate pod api-1 owner=payments --overwrite
kubectl get pods -l 'env in (prod,staging),tier!=frontend' --show-labels
kubectl run app --image=busybox:1.36 --dry-run=client -o yaml --command -- sleep 3600 > pod.yaml
kubectl logs app-init -c wait-db                        # log của init container
kubectl get pod logger -o jsonpath='{.spec.initContainers[*].restartPolicy}'
kubectl explain pod.spec.initContainers.restartPolicy
~~~

### Bẫy hay gặp
- Không thể thêm container vào Pod đang chạy: phải xoá rồi tạo lại ({{kubectl replace --force -f pod.yaml}}).
- Pod kẹt {{Init:0/1}}: xem {{kubectl logs <pod> -c <init>}}, không phải log container chính.
- Sidecar để trong {{containers}} khiến Job không bao giờ Complete vì sidecar chạy mãi.
- Quên {{volumeMounts}} ở một trong hai container: mỗi bên thấy một thư mục rỗng riêng.
- {{kubectl expose}} lấy selector của Deployment: nếu Deployment chỉ chọn {{app=x}} mà namespace có Pod lạ cùng label thì Service cũng chọn nhầm Pod đó.`,
    videos: [
      { title: 'Day 11/40 - Multi Container Pod Kubernetes - Sidecar vs Init Container', url: 'https://www.youtube.com/watch?v=yRiFq1ykBxc', note: 'Xem phần demo init container chờ service và so sánh sidecar với init container, đúng trọng tâm module này.' },
      { title: 'Kubernetes Components explained! Pods, Services, Secrets, ConfigMap | Kubernetes Tutorial 14', url: 'https://www.youtube.com/watch?v=Krpb44XR0bk', note: 'Ôn lại Pod và cách Service chọn Pod qua label trước khi làm bài labels/selectors.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-02-01', no: 1, domain: 'Design & Build', level: 'easy', env: 'kind', minutes: 5,
        title: 'Gắn, xoá label hàng loạt và dùng selector dạng tập hợp',
        task: `Context: {{kubectl config use-context kind-ckad}}

Namespace {{lab02}} có các Pod {{api-1}}, {{api-2}}, {{web-1}}, {{legacy}}, {{job-x}} với label khác nhau.
1. Gắn label {{release=stable}} cho **mọi Pod có env=prod** (dùng selector, không gõ từng tên).
2. Xoá label {{tier}} khỏi Pod {{legacy}}.
3. Thêm annotation {{owner=payments}} cho Pod {{api-1}}.
4. Sau ba bước trên, ghi vào {{/opt/ckad/lab02-01.txt}} tên các Pod khớp selector {{env in (prod,staging),tier!=frontend}}, mỗi dòng một tên.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete pod api-1 api-2 web-1 legacy job-x --ignore-not-found --wait=true
kubectl -n lab02 run api-1 --image=busybox:1.36 --labels=app=api,env=prod,tier=backend --command -- sleep 3600
kubectl -n lab02 run api-2 --image=busybox:1.36 --labels=app=api,env=dev,tier=backend --command -- sleep 3600
kubectl -n lab02 run web-1 --image=busybox:1.36 --labels=app=web,env=prod,tier=frontend --command -- sleep 3600
kubectl -n lab02 run legacy --image=busybox:1.36 --labels=app=legacy,env=prod,tier=backend --command -- sleep 3600
kubectl -n lab02 run job-x --image=busybox:1.36 --labels=app=batch,env=staging --command -- sleep 3600
mkdir -p /opt/ckad && rm -f /opt/ckad/lab02-01.txt`,
        verify: 'NS=lab02\n' + V + `eq release "$(kubectl -n $NS get pods -l release=stable -o custom-columns=N:.metadata.name --no-headers 2>/dev/null | sort | xargs)" "api-1 legacy web-1"
eq legacy-no-tier "$(kubectl -n $NS get pod legacy -o jsonpath='{.metadata.labels.tier}' 2>/dev/null)" ""
eq legacy-exists "$(kubectl -n $NS get pod legacy -o name 2>/dev/null)" "pod/legacy"
eq annotation "$(kubectl -n $NS get pod api-1 -o jsonpath='{.metadata.annotations.owner}' 2>/dev/null)" "payments"
eq file "$(sort /opt/ckad/lab02-01.txt 2>/dev/null | xargs)" "api-1 job-x legacy"` + END,
        solution: `**Lệnh:**
~~~bash
kubectl -n lab02 label pods -l env=prod release=stable
kubectl -n lab02 label pod legacy tier-
kubectl -n lab02 annotate pod api-1 owner=payments
kubectl -n lab02 get pods -l 'env in (prod,staging),tier!=frontend' \\
  -o custom-columns=N:.metadata.name --no-headers > /opt/ckad/lab02-01.txt
cat /opt/ckad/lab02-01.txt     # api-1, job-x, legacy
~~~

**Vì sao kết quả là api-1, job-x, legacy:**
- {{env in (prod,staging)}} chọn api-1, web-1, legacy (prod) và job-x (staging).
- {{tier!=frontend}} loại web-1, nhưng **giữ** job-x và legacy dù hai Pod này không có key {{tier}}: toán tử {{!=}} và {{notin}} khớp cả object thiếu key. Muốn bắt buộc có key thì thêm điều kiện {{tier}} (chỉ tên key).

**Lưu ý:** selector có dấu cách hoặc ngoặc phải bọc trong nháy đơn, nếu không shell sẽ hiểu ngoặc là subshell. Dấu {{-}} sau tên key ({{tier-}}) là cú pháp xoá label/annotation.

> Mẹo tiết kiệm thời gian: thêm {{--show-labels}} hoặc {{-L env,tier}} vào {{kubectl get pods}} để nhìn label thành cột, kiểm tra kết quả trong một lệnh.`,
        hints: ['{{kubectl label pods -l env=prod release=stable}} gắn hàng loạt.', 'Xoá label: {{kubectl label pod legacy tier-}}. Pod không có key tier vẫn khớp {{tier!=frontend}}.'],
        refs: [{ type: 'doc', title: 'Labels and Selectors', url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/' }],
        tags: ['labels', 'selectors', 'annotations'],
      },
      {
        id: 'ckad-lab-02-02', no: 2, domain: 'Design & Build', level: 'easy', env: 'kind', minutes: 6,
        title: 'Pod kẹt Init:0/1: đọc log init container và gỡ phụ thuộc',
        task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{app-init}} trong namespace {{lab02}} đang kẹt ở trạng thái {{Init:0/1}}.
1. Tìm tên init container đang chặn Pod và ghi tên đó (chỉ một từ) vào {{/opt/ckad/lab02-02.txt}}.
2. Đọc log của init container để biết nó đang chờ gì, rồi tạo đúng thứ còn thiếu: một Service ClusterIP tên {{db}} trong {{lab02}}, port {{5432}}, targetPort {{5432}}, selector {{app=db}}.
3. **Không** xoá hay sửa Pod {{app-init}}: sau khi phụ thuộc có mặt, Pod phải tự chuyển sang Running và Ready.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete service db --ignore-not-found
kubectl -n lab02 delete pod app-init --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: app-init
  namespace: lab02
  labels:
    app: app-init
spec:
  initContainers:
  - name: wait-db
    image: busybox:1.36
    command: ["sh", "-c", "until nslookup db.lab02.svc.cluster.local; do echo waiting for service db; sleep 2; done"]
  containers:
  - name: app
    image: nginx:1.27-alpine
EOF
mkdir -p /opt/ckad && rm -f /opt/ckad/lab02-02.txt`,
        verify: 'NS=lab02\n' + V + `eq file "$(tr -d ' ' < /opt/ckad/lab02-02.txt 2>/dev/null | head -1)" "wait-db"
eq svc "$(kubectl -n $NS get svc db -o jsonpath='{.spec.type} {.spec.ports[0].port} {.spec.ports[0].targetPort} {.spec.selector.app}' 2>/dev/null)" "ClusterIP 5432 5432 db"
kubectl -n $NS wait --for=condition=Ready pod/app-init --timeout=90s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod app-init chưa Ready"
eq init-unchanged "$(kubectl -n $NS get pod app-init -o jsonpath='{.spec.initContainers[0].name}' 2>/dev/null)" "wait-db"` + END,
        solution: `**Điều tra:**
~~~bash
kubectl -n lab02 get pod app-init                 # STATUS Init:0/1
kubectl -n lab02 get pod app-init -o jsonpath='{.spec.initContainers[*].name}'
kubectl -n lab02 logs app-init -c wait-db --tail=5   # "waiting for service db", nslookup thất bại
echo wait-db > /opt/ckad/lab02-02.txt
~~~

**Sửa:** {{kubectl create service clusterip db}} tự đặt selector {{app=db}} (theo tên service), trùng đúng yêu cầu:
~~~bash
kubectl -n lab02 create service clusterip db --tcp=5432:5432
kubectl -n lab02 get pod app-init -w           # vài giây sau: Running 1/1
~~~

**Vì sao Pod tự khỏi:** init container chạy vòng {{until nslookup ...}}; Service ClusterIP có bản ghi DNS ngay khi tạo, **kể cả khi chưa có endpoint nào**. Lần lặp tiếp theo nslookup thành công, init container thoát mã 0, kubelet chuyển sang container chính. Đây là pattern "chờ phụ thuộc" phổ biến; nếu init container thoát mã khác 0 thì kubelet chạy lại nó theo {{restartPolicy}} của Pod.

**Lỗi hay gặp:** đọc {{kubectl logs app-init}} (mặc định container chính, chưa chạy nên báo lỗi) thay vì thêm {{-c wait-db}}; xoá Pod để "khởi động lại" trong khi đề cấm.

> Mẹo tiết kiệm thời gian: {{kubectl describe pod}} phần {{Init Containers}} cho biết ngay container nào đang Running/Waiting; kết hợp {{logs -c}} là đủ chẩn đoán trong 30 giây.`,
        hints: ['Log init container: {{kubectl logs app-init -c <tên>}}.', 'DNS của Service có ngay cả khi Service chưa có endpoint; {{kubectl create service clusterip db --tcp=5432:5432}}.'],
        refs: [{ type: 'doc', title: 'Init Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/init-containers/' }],
        tags: ['init container', 'troubleshooting'],
      },
      {
        id: 'ckad-lab-02-03', no: 3, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 7,
        title: 'Init container ghi nội dung vào emptyDir cho nginx phục vụ',
        task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Pod {{content}} trong namespace {{lab02}}:
- Volume {{html}} kiểu {{emptyDir}}.
- Init container {{fetch}}, image {{busybox:1.36}}, mount {{html}} tại {{/work}}, ghi đúng chuỗi {{hello-lab02}} vào file {{/work/index.html}} rồi thoát.
- Container chính {{web}}, image {{nginx:1.27-alpine}}, mount {{html}} tại {{/usr/share/nginx/html}}.

Gọi {{http://127.0.0.1}} bên trong container {{web}} phải trả về {{hello-lab02}}.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete pod content --ignore-not-found --wait=true`,
        verify: 'NS=lab02\n' + V + `kubectl -n $NS wait --for=condition=Ready pod/content --timeout=90s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod content chưa Ready"
eq init "$(kubectl -n $NS get pod content -o jsonpath='{.spec.initContainers[*].name}' 2>/dev/null)" "fetch"
eq containers "$(kubectl -n $NS get pod content -o jsonpath='{.spec.containers[*].name}' 2>/dev/null)" "web"
kubectl -n $NS get pod content -o jsonpath='{.spec.volumes[?(@.name=="html")].emptyDir}' 2>/dev/null | grep -q "{" && ok emptydir || ko emptydir "không có volume html kiểu emptyDir"
eq http "$(kubectl -n $NS exec content -c web -- wget -qO- -T 5 http://127.0.0.1 2>/dev/null | tr -d '[:space:]')" "hello-lab02"` + END,
        solution: `**Manifest** (sinh khung bằng {{kubectl run content --image=nginx:1.27-alpine $do > content.yaml}} rồi thêm phần còn thiếu):
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: content
  namespace: lab02
spec:
  volumes:
  - name: html
    emptyDir: {}
  initContainers:
  - name: fetch
    image: busybox:1.36
    command: ["sh", "-c", "echo hello-lab02 > /work/index.html"]
    volumeMounts:
    - name: html
      mountPath: /work
  containers:
  - name: web
    image: nginx:1.27-alpine
    volumeMounts:
    - name: html
      mountPath: /usr/share/nginx/html
~~~
~~~bash
kubectl apply -f content.yaml
kubectl -n lab02 exec content -c web -- wget -qO- http://127.0.0.1
~~~

**Vì sao:** emptyDir được tạo một lần cho cả Pod, nên file init container ghi vẫn còn khi container chính khởi động. Mount emptyDir vào {{/usr/share/nginx/html}} **che** nội dung mặc định của image (trang Welcome biến mất), đó là hành vi mong muốn ở đây. Init container chạy xong mới tới {{web}}, nên nginx không bao giờ phục vụ thư mục rỗng.

**Lỗi hay gặp:** dùng {{command: ["echo hello-lab02 > /work/index.html"]}} không có {{sh -c}} (redirect {{>}} cần shell), quên mount volume ở init container.

> Mẹo tiết kiệm thời gian: copy khối {{volumeMounts}} từ trang docs "Init Containers" hoặc "Volumes" rồi đổi tên; đừng gõ tay cả khối.`,
        hints: ['Lệnh có redirect cần {{["sh", "-c", "echo hello-lab02 > /work/index.html"]}}.', 'Cả hai container cùng mount volume {{html}}, khác {{mountPath}}.'],
        refs: [{ type: 'doc', title: 'Volumes: emptyDir', url: 'https://kubernetes.io/docs/concepts/storage/volumes/#emptydir' }],
        tags: ['emptyDir', 'init container'],
      },
      {
        id: 'ckad-lab-02-04', no: 4, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 8,
        title: 'Chuyển sidecar thường thành native sidecar (restartPolicy: Always)',
        task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{logger}} trong namespace {{lab02}} có hai container thường: {{app}} ghi một dòng {{tick <số>}} mỗi 2 giây vào {{/var/log/app/app.log}} và {{log-tail}} đọc file đó bằng {{tail -F}}. Cả hai dùng chung volume emptyDir {{logs}}.

Hãy tạo lại Pod {{logger}} (cùng tên, cùng namespace) sao cho {{log-tail}} trở thành **native sidecar**: khai báo trong {{initContainers}} với {{restartPolicy: Always}}. Trong {{containers}} chỉ còn {{app}}. Giữ nguyên image, lệnh và volume. Lưu manifest mới vào {{/opt/ckad/lab02-04.yaml}}.

Sau đó {{kubectl logs logger -c log-tail}} phải thấy các dòng {{tick}}.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete pod logger --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: logger
  namespace: lab02
spec:
  volumes:
  - name: logs
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "i=0; while true; do i=$((i+1)); echo tick $i >> /var/log/app/app.log; sleep 2; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  - name: log-tail
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /var/log/app/app.log"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
EOF
mkdir -p /opt/ckad && rm -f /opt/ckad/lab02-04.yaml`,
        verify: 'NS=lab02\n' + V + `[ -s /opt/ckad/lab02-04.yaml ] && grep -q "restartPolicy: Always" /opt/ckad/lab02-04.yaml && ok file || ko file "/opt/ckad/lab02-04.yaml thiếu hoặc chưa có restartPolicy: Always"
eq sidecar "$(kubectl -n $NS get pod logger -o jsonpath='{.spec.initContainers[?(@.name=="log-tail")].restartPolicy}' 2>/dev/null)" "Always"
eq containers "$(kubectl -n $NS get pod logger -o jsonpath='{.spec.containers[*].name}' 2>/dev/null)" "app"
kubectl -n $NS wait --for=condition=Ready pod/logger --timeout=90s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod logger chưa Ready"
sleep 5
kubectl -n $NS logs logger -c log-tail --tail=20 2>/dev/null | grep -q "^tick [0-9]" && ok sidecar-logs || ko sidecar-logs "log-tail chưa in dòng tick"` + END,
        solution: `**Manifest mới** ({{kubectl get pod logger -o yaml > /opt/ckad/lab02-04.yaml}} rồi chuyển khối, hoặc viết gọn như dưới):
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: logger
  namespace: lab02
spec:
  volumes:
  - name: logs
    emptyDir: {}
  initContainers:
  - name: log-tail
    image: busybox:1.36
    restartPolicy: Always          # biến init container thành sidecar
    command: ["sh", "-c", "tail -F /var/log/app/app.log"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "i=0; while true; do i=$((i+1)); echo tick $i >> /var/log/app/app.log; sleep 2; done"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
~~~
~~~bash
kubectl replace --force -f /opt/ckad/lab02-04.yaml   # xoá Pod cũ và tạo lại
kubectl -n lab02 logs logger -c log-tail -f
~~~

**Vì sao:** Pod là bất biến với danh sách container, nên phải tạo lại ({{replace --force}} = delete + create). Với {{restartPolicy: Always}} trong {{initContainers}}, kubelet khởi động {{log-tail}} rồi **không chờ nó kết thúc** mà chuyển sang init tiếp theo / container chính; sidecar được restart độc lập nếu chết và được dừng **sau** container chính khi Pod tắt, nên không mất dòng log cuối. Trong Job, sidecar kiểu này không giữ Job ở trạng thái Running mãi.

**Lưu ý:** {{tail -F}} (chữ F hoa) chờ file xuất hiện, nên sidecar chạy trước app vẫn ổn. Nếu dùng {{kubectl get -o yaml}} làm khung, hãy xoá {{status}}, {{uid}}, {{resourceVersion}}, {{nodeName}} để file gọn.

> Mẹo tiết kiệm thời gian: {{kubectl explain pod.spec.initContainers.restartPolicy}} xác nhận field có trên cluster; chỉ giá trị {{Always}} được chấp nhận ở cấp container.`,
        hints: ['Không thể sửa danh sách container của Pod đang chạy: dùng {{kubectl replace --force -f}}.', 'Chuyển khối {{log-tail}} sang {{initContainers}} và thêm {{restartPolicy: Always}} ngang hàng {{image}}.'],
        refs: [{ type: 'doc', title: 'Sidecar Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/' }],
        tags: ['native sidecar', 'initContainers'],
      },
      {
        id: 'ckad-lab-02-05', no: 5, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 8,
        title: 'Adapter container chuẩn hoá log thô thành dòng metric',
        task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{metrics}} trong namespace {{lab02}} có container {{app}} ghi các dòng dạng {{cpu=<số>}} vào {{/data/raw.log}} (volume emptyDir {{data}}). Hệ thống giám sát chỉ hiểu định dạng {{METRIC cpu VALUE <số>}} đọc từ stdout.

Tạo lại Pod {{metrics}} với thêm một container thường tên {{adapter}}, image {{busybox:1.36}}, mount volume {{data}} tại {{/data}}, liên tục đọc {{/data/raw.log}} và in ra stdout mỗi dòng theo định dạng {{METRIC cpu VALUE <số>}}. Giữ nguyên container {{app}}.

Kết quả: {{kubectl logs metrics -c adapter}} có các dòng như {{METRIC cpu VALUE 3}}.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete pod metrics --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: metrics
  namespace: lab02
spec:
  volumes:
  - name: data
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ["sh", "-c", "i=0; while true; do i=$((i+1)); echo cpu=$i >> /data/raw.log; sleep 2; done"]
    volumeMounts:
    - name: data
      mountPath: /data
EOF`,
        verify: 'NS=lab02\n' + V + `eq containers "$(kubectl -n $NS get pod metrics -o jsonpath='{.spec.containers[*].name}' 2>/dev/null | tr ' ' '\\n' | sort | xargs)" "adapter app"
eq adapter-mount "$(kubectl -n $NS get pod metrics -o jsonpath='{.spec.containers[?(@.name=="adapter")].volumeMounts[0].mountPath}' 2>/dev/null)" "/data"
kubectl -n $NS wait --for=condition=Ready pod/metrics --timeout=90s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod metrics chưa Ready"
sleep 6
kubectl -n $NS logs metrics -c adapter --tail=20 2>/dev/null | grep -Eq "^METRIC cpu VALUE [0-9]+$" && ok adapter-format || ko adapter-format "adapter chưa in METRIC cpu VALUE <số>"
kubectl -n $NS logs metrics -c adapter --tail=20 2>/dev/null | grep -q "cpu=" && ko no-raw "adapter còn in dòng thô cpu=" || ok no-raw` + END,
        solution: `**Container adapter thêm vào Pod:**
~~~yaml
  - name: adapter
    image: busybox:1.36
    command: ["sh", "-c", "tail -F /data/raw.log | awk -F= '{print \\"METRIC\\", $1, \\"VALUE\\", $2; fflush()}'"]
    volumeMounts:
    - name: data
      mountPath: /data
~~~
Viết lệnh ở dạng block scalar để khỏi phải escape dấu nháy kép:
~~~yaml
    command:
    - sh
    - -c
    - |
      tail -F /data/raw.log | awk -F= '{print "METRIC", $1, "VALUE", $2; fflush()}'
~~~
~~~bash
kubectl -n lab02 get pod metrics -o yaml > metrics.yaml   # thêm khối adapter vào containers
kubectl replace --force -f metrics.yaml
kubectl -n lab02 logs metrics -c adapter --tail=3
~~~

**Vì sao:** adapter là pattern "đổi giao diện" của app mà không sửa code app: app vẫn ghi định dạng riêng, adapter cùng Pod đọc qua volume chung và xuất định dạng chuẩn cho hệ thống bên ngoài. {{awk -F=}} tách {{cpu=3}} thành {{$1=cpu}}, {{$2=3}}. {{fflush()}} cần thiết vì khi stdout không phải terminal, awk gom output vào buffer và log sẽ không hiện ngay.

**Lỗi hay gặp:** quên {{-F}} (chữ hoa) ở {{tail}} khiến adapter thoát nếu file chưa tồn tại; quên mount volume ở adapter.

> Mẹo tiết kiệm thời gian: thử lệnh adapter trực tiếp trước bằng {{kubectl exec metrics -c app -- sh -c "tail -n 3 /data/raw.log | awk ..."}} rồi mới đưa vào YAML, tránh tạo lại Pod nhiều lần.`,
        hints: ['Cả {{app}} và {{adapter}} mount cùng volume {{data}} tại {{/data}}.', '{{tail -F /data/raw.log | awk -F= ...}}; nhớ {{fflush()}} để log hiện ngay.'],
        refs: [{ type: 'doc', title: 'Pods: how Pods manage multiple containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/' }],
        tags: ['adapter', 'multi-container'],
      },
      {
        id: 'ckad-lab-02-06', no: 6, domain: 'Design & Build', level: 'hard', env: 'kind', minutes: 12,
        title: 'Tổng hợp: Deployment có init, native sidecar, annotation và Service chọn đúng Pod',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab02}} đã có Pod {{orders-legacy}} (label {{app=orders}}, {{tier=frontend}}) không được nhận traffic. Tạo:
1. Deployment {{orders}}, {{2}} replicas, Pod template có label {{app=orders}} và {{tier=backend}}, annotation {{team=checkout}}, volume emptyDir {{shared}}.
2. Init container {{render}} ({{busybox:1.36}}) ghi chuỗi {{v2}} vào {{/shared/version.txt}}.
3. Native sidecar {{shipper}} ({{busybox:1.36}}, khai báo **sau** {{render}}) cứ 5 giây in ra stdout dòng {{shipper version=<nội dung file>}}.
4. Container chính {{web}} ({{nginx:1.27-alpine}}) mount {{shared}} tại {{/usr/share/nginx/html/meta}}.
5. Service ClusterIP {{orders}} port {{80}} chỉ chọn đúng 2 Pod của Deployment (không chọn {{orders-legacy}}).

Gọi {{http://127.0.0.1/meta/version.txt}} trong container {{web}} phải trả về {{v2}}.`,
        setup: `kubectl create namespace lab02 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab02 delete deployment orders --ignore-not-found
kubectl -n lab02 delete service orders --ignore-not-found
kubectl -n lab02 delete pod orders-legacy --ignore-not-found --wait=true
kubectl -n lab02 run orders-legacy --image=nginx:1.27-alpine --labels=app=orders,tier=frontend`,
        verify: 'NS=lab02\n' + V + `kubectl -n $NS rollout status deployment/orders --timeout=150s >/dev/null 2>&1 && ok rollout || ko rollout "deployment orders chưa sẵn sàng"
eq ready "$(kubectl -n $NS get deployment orders -o jsonpath='{.status.readyReplicas}' 2>/dev/null)" "2"
eq template-labels "$(kubectl -n $NS get deployment orders -o jsonpath='{.spec.template.metadata.labels.app} {.spec.template.metadata.labels.tier} {.spec.template.metadata.annotations.team}' 2>/dev/null)" "orders backend checkout"
eq init-order "$(kubectl -n $NS get deployment orders -o jsonpath='{.spec.template.spec.initContainers[*].name}' 2>/dev/null)" "render shipper"
eq sidecar "$(kubectl -n $NS get deployment orders -o jsonpath='{.spec.template.spec.initContainers[?(@.name=="shipper")].restartPolicy}' 2>/dev/null)" "Always"
eq http "$(kubectl -n $NS exec deploy/orders -c web -- wget -qO- -T 5 http://127.0.0.1/meta/version.txt 2>/dev/null | tr -d '[:space:]')" "v2"
sleep 6
kubectl -n $NS logs deploy/orders -c shipper --tail=5 2>/dev/null | grep -q "shipper version=v2" && ok shipper-logs || ko shipper-logs "shipper chưa in 'shipper version=v2'"
eq endpoints "$(kubectl -n $NS get endpointslices -l kubernetes.io/service-name=orders -o jsonpath='{.items[*].endpoints[*].addresses[*]}' 2>/dev/null | wc -w | tr -d ' ')" "2"
LEGACY_IP=$(kubectl -n $NS get pod orders-legacy -o jsonpath='{.status.podIP}' 2>/dev/null)
kubectl -n $NS get endpointslices -l kubernetes.io/service-name=orders -o jsonpath='{.items[*].endpoints[*].addresses[*]}' 2>/dev/null | grep -qw "$LEGACY_IP" && ko no-legacy "Service orders đang chọn cả orders-legacy" || ok no-legacy` + END,
        solution: `**Manifest:**
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
  namespace: lab02
spec:
  replicas: 2
  selector:
    matchLabels: {app: orders, tier: backend}
  template:
    metadata:
      labels: {app: orders, tier: backend}
      annotations: {team: checkout}
    spec:
      volumes:
      - name: shared
        emptyDir: {}
      initContainers:
      - name: render
        image: busybox:1.36
        command: ["sh", "-c", "echo v2 > /shared/version.txt"]
        volumeMounts: [{name: shared, mountPath: /shared}]
      - name: shipper
        image: busybox:1.36
        restartPolicy: Always
        command: ["sh", "-c", "while true; do echo shipper version=$(cat /shared/version.txt); sleep 5; done"]
        volumeMounts: [{name: shared, mountPath: /shared}]
      containers:
      - name: web
        image: nginx:1.27-alpine
        volumeMounts: [{name: shared, mountPath: /usr/share/nginx/html/meta}]
---
apiVersion: v1
kind: Service
metadata:
  name: orders
  namespace: lab02
spec:
  selector: {app: orders, tier: backend}
  ports:
  - port: 80
    targetPort: 80
~~~
~~~bash
kubectl apply -f orders.yaml
kubectl -n lab02 get endpointslices -l kubernetes.io/service-name=orders
~~~

**Vì sao:**
- **Thứ tự initContainers**: {{render}} (init thường) phải chạy xong trước, nên {{shipper}} khởi động khi file đã có. Đảo thứ tự thì sidecar chạy trước và lúc đầu in {{version=}} rỗng.
- **Bẫy selector**: nếu tạo bằng {{kubectl create deployment orders}} (selector {{app=orders}}) rồi {{kubectl expose}}, Service sẽ chọn cả {{orders-legacy}} → 3 endpoint. Service phải có thêm {{tier=backend}}. ReplicaSet không "nhận nuôi" Pod legacy vì selector của RS có thêm {{pod-template-hash}}.
- Annotation đặt ở {{template.metadata}} để mọi Pod đều mang; đặt ở metadata của Deployment thì Pod không có.

> Mẹo tiết kiệm thời gian: sinh khung bằng {{kubectl create deployment orders --image=nginx:1.27-alpine --replicas=2 $do}}, sửa tên container thành {{web}}, thêm label {{tier}} vào cả {{selector}} lẫn {{template}}, rồi dán khối initContainers.`,
        hints: ['Selector của Service (và Deployment) cần cả {{app=orders}} và {{tier=backend}}.', 'initContainers theo thứ tự: {{render}} trước, {{shipper}} (restartPolicy: Always) sau.', 'Annotation {{team=checkout}} đặt trong {{spec.template.metadata.annotations}}.'],
        refs: [
          { type: 'doc', title: 'Sidecar Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/' },
          { type: 'doc', title: 'Labels and Selectors', url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/' },
        ],
        tags: ['native sidecar', 'init container', 'selector', 'deployment'],
      },
    ],
  },
  // ======================================================================= MODULE 3
  {
    id: 'ckad-lab-03', order: 3,
    title: 'Jobs và CronJobs: completions, deadline, lịch chạy',
    summary: 'Chạy tác vụ batch đúng cách: Job với completions/parallelism/backoffLimit/activeDeadlineSeconds, Indexed Job, CronJob với schedule, timeZone, concurrencyPolicy, suspend, history limits, tạo Job thủ công từ CronJob và điều tra Job thất bại.',
    concepts: `### Job: chạy tới khi thành công
Deployment giữ Pod chạy mãi; **Job** chạy Pod tới khi đủ số lần thành công rồi dừng. Pod của Job phải có {{restartPolicy: Never}} hoặc {{OnFailure}} (không được {{Always}}).
| Field | Ý nghĩa | Mặc định |
|---|---|---|
| {{completions}} | cần bao nhiêu Pod thành công | 1 |
| {{parallelism}} | tối đa bao nhiêu Pod chạy cùng lúc | 1 |
| {{backoffLimit}} | số lần thử lại trước khi Job Failed (reason {{BackoffLimitExceeded}}) | 6 |
| {{activeDeadlineSeconds}} | thời gian sống tối đa của cả Job, quá thì kill mọi Pod (reason {{DeadlineExceeded}}) | không có |
| {{ttlSecondsAfterFinished}} | tự xoá Job sau khi xong | không có |
| {{completionMode: Indexed}} | mỗi Pod có chỉ số 0..completions-1 trong env {{JOB_COMPLETION_INDEX}} | NonIndexed |

**Vì sao cần activeDeadlineSeconds:** backoffLimit chỉ đếm lần thất bại; một Pod treo (chờ mạng, deadlock) không bao giờ thất bại nên Job chạy mãi. Deadline là "cầu dao" theo thời gian, và **ưu tiên hơn backoffLimit**.

### CronJob: tạo Job theo lịch
| Field | Ý nghĩa |
|---|---|
| {{schedule}} | cú pháp cron 5 trường: phút giờ ngày tháng thứ ({{*/5 * * * *}} = mỗi 5 phút) |
| {{timeZone}} | múi giờ IANA ({{Asia/Ho_Chi_Minh}}), GA từ 1.27; mặc định theo giờ của kube-controller-manager |
| {{concurrencyPolicy}} | {{Allow}} (mặc định), {{Forbid}} (bỏ lượt mới nếu lượt cũ chưa xong), {{Replace}} (huỷ lượt cũ) |
| {{startingDeadlineSeconds}} | lỡ lịch quá số giây này thì bỏ lượt |
| {{suspend}} | {{true}} thì ngừng tạo Job mới (Job đang chạy không bị ảnh hưởng) |
| {{successfulJobsHistoryLimit}} / {{failedJobsHistoryLimit}} | giữ lại bao nhiêu Job cũ (mặc định 3 / 1) |

### Cheat sheet
~~~bash
kubectl create job hello --image=busybox:1.36 -- sh -c 'echo hi'
kubectl create job calc --image=busybox:1.36 --dry-run=client -o yaml -- sh -c 'echo ok' > job.yaml
kubectl create cronjob report --image=busybox:1.36 --schedule='*/2 * * * *' -- sh -c 'date'
kubectl create job report-manual --from=cronjob/report      # chạy thử ngay, không chờ lịch
kubectl patch cronjob report -p '{"spec":{"suspend":true}}'
kubectl wait --for=condition=complete job/hello --timeout=60s
kubectl logs job/hello                                       # log của một Pod trong Job
kubectl get pods -l job-name=hello                           # Pod của Job mang label job-name
kubectl get job hello -o jsonpath='{.status.conditions[*].reason}'
~~~

### Bẫy hay gặp
- {{kubectl create job}} **không có** flag completions/parallelism/backoffLimit: sinh YAML rồi sửa. Các field đó nằm ở {{spec}} của Job, **không** ở {{spec.template.spec}}.
- Trong CronJob, các field Job nằm ở {{spec.jobTemplate.spec}}; {{activeDeadlineSeconds}} đặt nhầm vào CronJob spec sẽ bị từ chối.
- Pod template của Job **bất biến**: đổi lệnh/image thì phải xoá Job rồi tạo lại ({{kubectl replace --force}}).
- Quên đặt schedule trong nháy đơn: shell sẽ mở rộng dấu {{*}} thành tên file.
- {{restartPolicy: OnFailure}} restart container **trong cùng Pod** nên số Pod Failed không tăng; muốn giữ Pod lỗi để đọc log hãy dùng {{Never}}.`,
    videos: [
      { title: 'Kubernetes Jobs and CronJobs | Chapter 13 | Zero To Interview-Hero', url: 'https://www.youtube.com/watch?v=De8D-K4tyRI', note: 'Xem toàn bộ: giải thích completions, parallelism, backoffLimit và CronJob, khớp với các bài trong module.' },
      { title: 'How to create repeating jobs (aka CronJobs) in Kubernetes?', url: 'https://www.youtube.com/watch?v=HyEE2eSkBqk', note: 'Video ngắn về CronJob: cú pháp schedule, concurrencyPolicy và history limit; xem trước bài 4–5.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-03-01', no: 1, domain: 'Design & Build', level: 'easy', env: 'kind', minutes: 3,
        title: 'Tạo Job đơn giản và lưu log',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab03}}:
1. Tạo Job {{hello}} dùng image {{busybox:1.36}}, chạy lệnh {{sh -c "echo hello-ckad"}}.
2. Chờ Job hoàn thành, rồi lưu log của Job vào file {{/opt/ckad/lab03-01.txt}}.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete job hello --ignore-not-found --wait=true
mkdir -p /opt/ckad && rm -f /opt/ckad/lab03-01.txt`,
        verify: 'NS=lab03\n' + V + `kubectl -n $NS wait --for=condition=complete job/hello --timeout=90s >/dev/null 2>&1 && ok job-complete || ko job-complete "job hello chưa Complete"
eq image "$(kubectl -n $NS get job hello -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)" "busybox:1.36"
eq log-file "$(tr -d '[:space:]' < /opt/ckad/lab03-01.txt 2>/dev/null)" "hello-ckad"` + END,
        solution: `**Lệnh:**
~~~bash
kubectl -n lab03 create job hello --image=busybox:1.36 -- sh -c "echo hello-ckad"
kubectl -n lab03 wait --for=condition=complete job/hello --timeout=60s
kubectl -n lab03 logs job/hello > /opt/ckad/lab03-01.txt
cat /opt/ckad/lab03-01.txt
~~~

**Vì sao:** {{kubectl create job}} tự đặt {{restartPolicy: Never}} và {{backoffLimit}} mặc định 6. Phần sau {{--}} thành {{command}} của container. {{kubectl logs job/hello}} chọn một Pod của Job (đủ cho Job 1 Pod); với Job nhiều Pod dùng {{kubectl logs -l job-name=hello --tail=-1}}.

**Lỗi hay gặp:** lấy log khi Pod còn {{ContainerCreating}} (file rỗng); vì vậy luôn {{kubectl wait --for=condition=complete}} trước. Viết nhầm {{condition=completed}} sẽ chờ tới timeout vì condition tên là {{Complete}} (không phân biệt hoa thường).

> Mẹo tiết kiệm thời gian: {{kubectl run}} với {{--restart=Never}} chỉ tạo Pod, không phải Job; đề ghi "Job" thì phải {{kubectl create job}}.`,
        hints: ['{{kubectl create job hello --image=busybox:1.36 -- sh -c "echo hello-ckad"}}.', 'Chờ bằng {{kubectl wait --for=condition=complete job/hello}} rồi {{kubectl logs job/hello > file}}.'],
        refs: [{ type: 'doc', title: 'Jobs', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' }],
        tags: ['job'],
      },
      {
        id: 'ckad-lab-03-02', no: 2, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 6,
        title: 'Job chạy song song: completions, parallelism, backoffLimit',
        task: `Context: {{kubectl config use-context kind-ckad}}

Tạo Job {{batch-calc}} trong namespace {{lab03}}:
- Image {{busybox:1.36}}, lệnh {{sh -c "echo calc-ok; sleep 3"}}.
- Cần **6** lần chạy thành công, tối đa **2** Pod chạy cùng lúc.
- Job bị coi là thất bại sau **2** lần thử lại.
- Pod không tự restart container ({{restartPolicy: Never}}).

Lưu manifest vào {{/opt/ckad/lab03-02.yaml}} và chờ Job hoàn thành.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete job batch-calc --ignore-not-found --wait=true
mkdir -p /opt/ckad && rm -f /opt/ckad/lab03-02.yaml`,
        verify: 'NS=lab03\n' + V + `[ -s /opt/ckad/lab03-02.yaml ] && grep -q "completions: 6" /opt/ckad/lab03-02.yaml && ok file || ko file "/opt/ckad/lab03-02.yaml thiếu hoặc chưa có completions: 6"
eq spec "$(kubectl -n $NS get job batch-calc -o jsonpath='{.spec.completions} {.spec.parallelism} {.spec.backoffLimit} {.spec.template.spec.restartPolicy}' 2>/dev/null)" "6 2 2 Never"
kubectl -n $NS wait --for=condition=complete job/batch-calc --timeout=150s >/dev/null 2>&1 && ok job-complete || ko job-complete "job batch-calc chưa Complete"
eq succeeded "$(kubectl -n $NS get job batch-calc -o jsonpath='{.status.succeeded}' 2>/dev/null)" "6"` + END,
        solution: `**Sinh khung rồi sửa:**
~~~bash
kubectl -n lab03 create job batch-calc --image=busybox:1.36 --dry-run=client -o yaml \\
  -- sh -c "echo calc-ok; sleep 3" > /opt/ckad/lab03-02.yaml
vi /opt/ckad/lab03-02.yaml
kubectl apply -f /opt/ckad/lab03-02.yaml
kubectl -n lab03 get pods -l job-name=batch-calc -w     # thấy từng cặp 2 Pod
~~~
~~~yaml
spec:
  completions: 6
  parallelism: 2
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: batch-calc
        image: busybox:1.36
        command: ["sh", "-c", "echo calc-ok; sleep 3"]
~~~

**Vì sao:** ba field điều khiển Job nằm ở {{spec}} của Job (cùng cấp {{template}}), không phải trong Pod spec. Với completions 6 và parallelism 2, controller chạy 3 "đợt" 2 Pod, tổng khoảng 10–15 giây. {{backoffLimit: 2}} đếm số Pod thất bại (với restartPolicy Never) trước khi đánh dấu Job Failed; thời gian chờ giữa các lần thử tăng theo hàm mũ (10s, 20s, 40s… tối đa 6 phút).

> Mẹo tiết kiệm thời gian: {{kubectl explain job.spec | grep -E "completions|parallelism|backoff"}} để chắc cấp thụt lề trước khi sửa YAML.`,
        hints: ['{{kubectl create job}} không có flag completions: dùng {{--dry-run=client -o yaml}}.', '{{completions}}, {{parallelism}}, {{backoffLimit}} đặt ở {{spec}} của Job, ngang hàng {{template}}.'],
        refs: [{ type: 'doc', title: 'Jobs: Parallel execution', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' }],
        tags: ['job', 'parallelism', 'completions'],
      },
      {
        id: 'ckad-lab-03-03', no: 3, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 6,
        title: 'Chặn Job treo bằng activeDeadlineSeconds',
        task: `Context: {{kubectl config use-context kind-ckad}}

Một tác vụ đôi khi bị treo vô thời hạn. Trong namespace {{lab03}}, tạo Job {{long-task}}:
- Image {{busybox:1.36}}, lệnh {{sleep 600}} (giả lập treo).
- Job phải bị hệ thống dừng sau tối đa **30 giây** kể từ khi bắt đầu, và **không** thử lại ({{backoffLimit: 0}}).

Chờ Job thất bại, rồi ghi **reason** của condition {{Failed}} trên Job vào {{/opt/ckad/lab03-03.txt}}.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete job long-task --ignore-not-found --wait=true
mkdir -p /opt/ckad && rm -f /opt/ckad/lab03-03.txt`,
        verify: 'NS=lab03\n' + V + `eq spec "$(kubectl -n $NS get job long-task -o jsonpath='{.spec.activeDeadlineSeconds} {.spec.backoffLimit}' 2>/dev/null)" "30 0"
kubectl -n $NS wait --for=condition=failed job/long-task --timeout=90s >/dev/null 2>&1 && ok job-failed || ko job-failed "job long-task chưa bị dừng"
eq reason "$(kubectl -n $NS get job long-task -o jsonpath='{.status.conditions[?(@.type=="Failed")].reason}' 2>/dev/null)" "DeadlineExceeded"
eq file "$(tr -d '[:space:]' < /opt/ckad/lab03-03.txt 2>/dev/null)" "DeadlineExceeded"` + END,
        solution: `**Manifest:**
~~~yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: long-task
  namespace: lab03
spec:
  activeDeadlineSeconds: 30
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: long-task
        image: busybox:1.36
        command: ["sleep", "600"]
~~~
~~~bash
kubectl apply -f long-task.yaml
kubectl -n lab03 wait --for=condition=failed job/long-task --timeout=60s
kubectl -n lab03 get job long-task -o jsonpath='{.status.conditions[?(@.type=="Failed")].reason}' > /opt/ckad/lab03-03.txt
cat /opt/ckad/lab03-03.txt      # DeadlineExceeded
~~~

**Vì sao:** {{backoffLimit}} chỉ đếm lần **thất bại**; Pod treo không thất bại nên Job sẽ chạy tới 600 giây. {{activeDeadlineSeconds}} tính từ lúc Job bắt đầu, khi hết hạn controller kill mọi Pod đang chạy và đặt condition Failed với reason {{DeadlineExceeded}}, bất kể backoffLimit còn bao nhiêu. Trên production nên đặt deadline cho mọi Job gọi mạng hoặc DB.

**Lưu ý:** {{activeDeadlineSeconds}} cũng tồn tại trong Pod spec (giới hạn một Pod); đề yêu cầu giới hạn **Job** nên đặt ở {{spec}} của Job.

> Mẹo tiết kiệm thời gian: đọc nhanh mọi reason bằng {{kubectl describe job long-task | tail -5}} (phần Events ghi rõ "Job was active longer than specified deadline").`,
        hints: ['Field {{activeDeadlineSeconds: 30}} ở {{spec}} của Job, cùng {{backoffLimit: 0}}.', 'Reason lấy bằng jsonpath {{.status.conditions[?(@.type=="Failed")].reason}}.'],
        refs: [{ type: 'doc', title: 'Jobs: Job termination and cleanup', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/#job-termination-and-cleanup' }],
        tags: ['job', 'activeDeadlineSeconds'],
      },
      {
        id: 'ckad-lab-03-04', no: 4, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 7,
        title: 'CronJob với concurrencyPolicy, history limit và chạy thủ công',
        task: `Context: {{kubectl config use-context kind-ckad}}

Trong namespace {{lab03}}, tạo CronJob {{report}}:
- Image {{busybox:1.36}}, lệnh {{sh -c "date; echo report-done"}}.
- Chạy mỗi 2 phút ({{*/2 * * * *}}).
- Không cho hai lượt chạy chồng nhau ({{concurrencyPolicy: Forbid}}).
- Giữ lại {{2}} Job thành công và {{1}} Job thất bại gần nhất.
- Lượt bị lỡ quá {{60}} giây thì bỏ qua.

Sau đó **không chờ lịch**, tạo ngay Job {{report-manual}} từ CronJob {{report}} và chờ nó hoàn thành.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete cronjob report --ignore-not-found
kubectl -n lab03 delete job report-manual --ignore-not-found --wait=true`,
        verify: 'NS=lab03\n' + V + `eq schedule "$(kubectl -n $NS get cronjob report -o jsonpath='{.spec.schedule}' 2>/dev/null)" "*/2 * * * *"
eq policy "$(kubectl -n $NS get cronjob report -o jsonpath='{.spec.concurrencyPolicy} {.spec.successfulJobsHistoryLimit} {.spec.failedJobsHistoryLimit} {.spec.startingDeadlineSeconds}' 2>/dev/null)" "Forbid 2 1 60"
kubectl -n $NS wait --for=condition=complete job/report-manual --timeout=90s >/dev/null 2>&1 && ok manual-complete || ko manual-complete "job report-manual chưa Complete"
kubectl -n $NS get job report-manual -o yaml 2>/dev/null | grep -q "cronjob.kubernetes.io/instantiate: manual" && ok from-cronjob || ko from-cronjob "report-manual không được tạo bằng --from=cronjob/report"
kubectl -n $NS logs job/report-manual 2>/dev/null | grep -q "report-done" && ok manual-logs || ko manual-logs "log report-manual không có report-done"` + END,
        solution: `**Tạo CronJob** (lệnh imperative có schedule nhưng không có các field còn lại, nên sinh YAML):
~~~bash
kubectl -n lab03 create cronjob report --image=busybox:1.36 --schedule='*/2 * * * *' \\
  --dry-run=client -o yaml -- sh -c "date; echo report-done" > report.yaml
~~~
Thêm vào {{spec}} của CronJob (cùng cấp {{schedule}}):
~~~yaml
spec:
  schedule: '*/2 * * * *'
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  startingDeadlineSeconds: 60
  jobTemplate:
    ...
~~~
~~~bash
kubectl apply -f report.yaml
kubectl -n lab03 create job report-manual --from=cronjob/report
kubectl -n lab03 wait --for=condition=complete job/report-manual
kubectl -n lab03 logs job/report-manual
~~~

**Vì sao:**
- {{Forbid}}: nếu lượt trước chưa xong thì bỏ lượt mới, tránh hai báo cáo ghi đè nhau. {{Replace}} huỷ lượt cũ để chạy lượt mới; {{Allow}} cho chạy chồng.
- {{startingDeadlineSeconds}}: khi controller bị gián đoạn, lượt trễ quá 60 giây sẽ bị bỏ thay vì chạy dồn.
- {{--from=cronjob/report}} sao chép {{jobTemplate}} và gắn annotation {{cronjob.kubernetes.io/instantiate: manual}}: cách chuẩn để chạy thử CronJob ngay mà không sửa lịch.

> Mẹo tiết kiệm thời gian: luôn bọc schedule trong nháy đơn; {{kubectl get cronjob report}} cột {{LAST SCHEDULE}} và {{ACTIVE}} cho biết CronJob có chạy theo lịch không.`,
        hints: ['Sinh YAML bằng {{kubectl create cronjob ... --dry-run=client -o yaml}} rồi thêm 4 field vào {{spec}}.', 'Chạy thủ công: {{kubectl create job report-manual --from=cronjob/report}}.'],
        refs: [{ type: 'doc', title: 'CronJob', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' }],
        tags: ['cronjob', 'concurrencyPolicy'],
      },
      {
        id: 'ckad-lab-03-05', no: 5, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 5,
        title: 'Tạm dừng CronJob, đổi lịch và múi giờ',
        task: `Context: {{kubectl config use-context kind-ckad}}

CronJob {{cleanup}} trong namespace {{lab03}} đang chạy **mỗi phút** và gây tải cho database. Không xoá CronJob, hãy:
1. Tạm dừng nó ngay để không tạo Job mới.
2. Đổi lịch thành **02:00 mỗi ngày** ({{0 2 * * *}}) theo múi giờ {{Asia/Ho_Chi_Minh}} (dùng field {{timeZone}}).
3. Giữ lại tối đa {{1}} Job thành công trong lịch sử.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete cronjob cleanup --ignore-not-found
kubectl -n lab03 create cronjob cleanup --image=busybox:1.36 --schedule='* * * * *' -- sh -c "echo cleaning"`,
        verify: 'NS=lab03\n' + V + `eq exists "$(kubectl -n $NS get cronjob cleanup -o name 2>/dev/null)" "cronjob.batch/cleanup"
eq suspend "$(kubectl -n $NS get cronjob cleanup -o jsonpath='{.spec.suspend}' 2>/dev/null)" "true"
eq schedule "$(kubectl -n $NS get cronjob cleanup -o jsonpath='{.spec.schedule}' 2>/dev/null)" "0 2 * * *"
eq timezone "$(kubectl -n $NS get cronjob cleanup -o jsonpath='{.spec.timeZone}' 2>/dev/null)" "Asia/Ho_Chi_Minh"
eq history "$(kubectl -n $NS get cronjob cleanup -o jsonpath='{.spec.successfulJobsHistoryLimit}' 2>/dev/null)" "1"` + END,
        solution: `**Một lệnh patch cho cả bốn field:**
~~~bash
kubectl -n lab03 patch cronjob cleanup -p '{"spec":{"suspend":true,"schedule":"0 2 * * *","timeZone":"Asia/Ho_Chi_Minh","successfulJobsHistoryLimit":1}}'
kubectl -n lab03 get cronjob cleanup        # cột SUSPEND = True, SCHEDULE = 0 2 * * *
~~~
Hoặc {{kubectl -n lab03 edit cronjob cleanup}} và sửa:
~~~yaml
spec:
  schedule: 0 2 * * *
  timeZone: Asia/Ho_Chi_Minh
  suspend: true
  successfulJobsHistoryLimit: 1
~~~

**Vì sao:**
- {{suspend: true}} chỉ ngăn CronJob tạo Job **mới**; Job đang chạy vẫn tiếp tục (xoá riêng nếu cần). Khi bỏ suspend, các lượt bị lỡ trong lúc dừng có thể được chạy bù nếu còn trong {{startingDeadlineSeconds}}.
- {{timeZone}} (GA 1.27) dùng tên IANA; không đặt thì lịch tính theo múi giờ của kube-controller-manager (thường là UTC), nên {{0 2 * * *}} sẽ chạy lúc 9 giờ sáng giờ Việt Nam. Không được viết {{CRON_TZ=}} trong schedule, API server từ chối.

> Mẹo tiết kiệm thời gian: patch JSON một dòng nhanh hơn mở editor khi chỉ đổi vài field scalar; dùng nháy đơn bên ngoài để shell không đụng tới dấu {{*}}.`,
        hints: ['Dùng {{kubectl patch cronjob cleanup -p}} với một chuỗi JSON đặt {{spec.suspend}} thành {{true}}.', 'Thêm {{"schedule"}}, {{"timeZone"}}, {{"successfulJobsHistoryLimit"}} vào cùng patch.'],
        refs: [{ type: 'doc', title: 'CronJob: Time zones', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/#time-zones' }],
        tags: ['cronjob', 'suspend', 'timeZone'],
      },
      {
        id: 'ckad-lab-03-06', no: 6, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 8,
        title: 'Điều tra Job thất bại và tạo lại với lệnh đúng',
        task: `Context: {{kubectl config use-context kind-ckad}}

Job {{import}} trong namespace {{lab03}} đã thất bại.
1. Ghi vào {{/opt/ckad/lab03-06.txt}} đúng **2 dòng**: dòng 1 là **exit code** của container trong Pod thất bại; dòng 2 là **reason** của condition {{Failed}} trên Job.
2. Sửa lỗi bằng cách tạo lại Job {{import}} (cùng tên, cùng namespace, image {{busybox:1.36}}) với lệnh {{sh -c "echo imported"}}, giữ {{backoffLimit: 1}}. Job mới phải hoàn thành.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete job import --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: import
  namespace: lab03
spec:
  backoffLimit: 1
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: import
        image: busybox:1.36
        command: ["sh", "-c", "echo importing; echo input file missing >&2; exit 2"]
EOF
kubectl -n lab03 wait --for=condition=failed job/import --timeout=120s >/dev/null 2>&1 || true
mkdir -p /opt/ckad && rm -f /opt/ckad/lab03-06.txt`,
        verify: 'NS=lab03\nF=/opt/ckad/lab03-06.txt\n' + V + `eq exit-code "$(sed -n 1p $F 2>/dev/null | tr -d '[:space:]')" "2"
eq reason "$(sed -n 2p $F 2>/dev/null | tr -d '[:space:]')" "BackoffLimitExceeded"
kubectl -n $NS wait --for=condition=complete job/import --timeout=90s >/dev/null 2>&1 && ok job-complete || ko job-complete "job import chưa Complete"
eq backoff "$(kubectl -n $NS get job import -o jsonpath='{.spec.backoffLimit}' 2>/dev/null)" "1"
kubectl -n $NS logs job/import 2>/dev/null | grep -q "^imported" && ok logs || ko logs "log job import không có imported"` + END,
        solution: `**Điều tra:**
~~~bash
kubectl -n lab03 get job import                    # COMPLETIONS 0/1, STATUS Failed
kubectl -n lab03 get pods -l job-name=import       # 2 Pod Error (1 lần chạy + 1 lần thử lại)
kubectl -n lab03 logs -l job-name=import --tail=5  # "input file missing"
kubectl -n lab03 get pods -l job-name=import \\
  -o jsonpath='{.items[0].status.containerStatuses[0].state.terminated.exitCode}'
kubectl -n lab03 get job import -o jsonpath='{.status.conditions[?(@.type=="Failed")].reason}'
printf '2\\nBackoffLimitExceeded\\n' > /opt/ckad/lab03-06.txt
~~~

**Tạo lại:** Pod template của Job là bất biến, {{kubectl apply}} với lệnh mới sẽ báo lỗi "field is immutable". Xoá và tạo lại:
~~~bash
kubectl -n lab03 get job import -o yaml > import.yaml
# sửa command thành ["sh", "-c", "echo imported"]; xoá status, uid, selector và label controller-uid/batch.kubernetes.io/*
kubectl replace --force -f import.yaml
~~~
Hoặc nhanh hơn: {{kubectl -n lab03 delete job import}} rồi viết lại manifest ngắn có {{backoffLimit: 1}}.

**Vì sao:** {{backoffLimit: 1}} cho phép 1 lần thử lại, nên có 2 Pod lỗi rồi Job Failed với reason {{BackoffLimitExceeded}}. Exit code nằm ở {{state.terminated.exitCode}} của containerStatuses; {{kubectl describe pod}} cũng hiện "Exit Code: 2". Xoá Job mặc định xoá luôn các Pod (propagation background).

> Mẹo tiết kiệm thời gian: khi lấy YAML từ object có sẵn, phần {{spec.selector}} và label {{batch.kubernetes.io/controller-uid}} sinh tự động sẽ làm Job mới bị từ chối; viết manifest mới từ {{kubectl create job ... $do}} thường nhanh hơn dọn YAML cũ.`,
        hints: ['Exit code: {{kubectl describe pod -l job-name=import}} hoặc jsonpath {{state.terminated.exitCode}}.', 'Pod template của Job bất biến: xoá Job rồi tạo lại.'],
        refs: [{ type: 'doc', title: 'Jobs: Handling Pod and container failures', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/#handling-pod-and-container-failures' }],
        tags: ['job', 'troubleshooting', 'backoffLimit'],
      },
      {
        id: 'ckad-lab-03-07', no: 7, domain: 'Design & Build', level: 'hard', env: 'kind', minutes: 12,
        title: 'Tổng hợp: CronJob chạy Indexed Job có deadline và chạy thử ngay',
        task: `Context: {{kubectl config use-context kind-ckad}}

Pipeline ETL chia dữ liệu thành 3 phần. Trong namespace {{lab03}}, tạo CronJob {{etl}}:
- Lịch {{*/10 * * * *}}, {{concurrencyPolicy: Forbid}}, giữ {{3}} Job thành công và {{1}} Job thất bại.
- Job sinh ra là **Indexed Job**: {{completions: 3}}, {{parallelism: 3}}, {{completionMode: Indexed}}, {{backoffLimit: 1}}, {{activeDeadlineSeconds: 120}}.
- Container {{etl}}, image {{busybox:1.36}}, lệnh in ra dòng {{part-<chỉ số> processed}} với chỉ số lấy từ biến môi trường {{JOB_COMPLETION_INDEX}}.

Sau đó tạo ngay Job {{etl-now}} từ CronJob {{etl}} và chờ hoàn thành: log của 3 Pod phải có đủ {{part-0 processed}}, {{part-1 processed}}, {{part-2 processed}}.`,
        setup: `kubectl create namespace lab03 --dry-run=client -o yaml | kubectl apply -f -
kubectl -n lab03 delete cronjob etl --ignore-not-found
kubectl -n lab03 delete job etl-now --ignore-not-found --wait=true`,
        verify: 'NS=lab03\n' + V + `eq cron "$(kubectl -n $NS get cronjob etl -o jsonpath='{.spec.schedule}|{.spec.concurrencyPolicy}|{.spec.successfulJobsHistoryLimit}|{.spec.failedJobsHistoryLimit}' 2>/dev/null)" "*/10 * * * *|Forbid|3|1"
eq job-template "$(kubectl -n $NS get cronjob etl -o jsonpath='{.spec.jobTemplate.spec.completions} {.spec.jobTemplate.spec.parallelism} {.spec.jobTemplate.spec.completionMode} {.spec.jobTemplate.spec.backoffLimit} {.spec.jobTemplate.spec.activeDeadlineSeconds}' 2>/dev/null)" "3 3 Indexed 1 120"
kubectl -n $NS wait --for=condition=complete job/etl-now --timeout=120s >/dev/null 2>&1 && ok etl-now-complete || ko etl-now-complete "job etl-now chưa Complete"
eq etl-now-indexed "$(kubectl -n $NS get job etl-now -o jsonpath='{.spec.completionMode} {.status.succeeded}' 2>/dev/null)" "Indexed 3"
LOGS=$(kubectl -n $NS logs -l job-name=etl-now --tail=-1 2>/dev/null)
N=0; for i in 0 1 2; do echo "$LOGS" | grep -q "part-$i processed" && N=$((N+1)); done
eq parts "$N" "3"` + END,
        solution: `**Manifest:**
~~~yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: etl
  namespace: lab03
spec:
  schedule: '*/10 * * * *'
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      completions: 3
      parallelism: 3
      completionMode: Indexed
      backoffLimit: 1
      activeDeadlineSeconds: 120
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: etl
            image: busybox:1.36
            command: ["sh", "-c", "echo part-$JOB_COMPLETION_INDEX processed"]
~~~
~~~bash
kubectl apply -f etl.yaml
kubectl -n lab03 create job etl-now --from=cronjob/etl
kubectl -n lab03 wait --for=condition=complete job/etl-now --timeout=90s
kubectl -n lab03 logs -l job-name=etl-now --tail=-1
~~~

**Vì sao:**
- **Indexed Job** gán cho mỗi Pod một chỉ số 0..2 qua env {{JOB_COMPLETION_INDEX}} (và annotation {{batch.kubernetes.io/job-completion-index}}). Mỗi Pod xử lý đúng phần của mình, không cần hàng đợi bên ngoài; Job chỉ Complete khi **mọi chỉ số** đều thành công.
- Biến {{$JOB_COMPLETION_INDEX}} được shell **trong container** mở rộng nhờ {{sh -c}}; viết {{command: ["echo", "part-$JOB_COMPLETION_INDEX"]}} không có shell thì Kubernetes chỉ mở rộng cú pháp {{$(VAR)}}, không mở rộng {{$VAR}}.
- Field Job nằm ở {{spec.jobTemplate.spec}}, field CronJob ở {{spec}}: sai cấp là lỗi phổ biến nhất của dạng bài này.

> Mẹo tiết kiệm thời gian: sinh khung bằng {{kubectl create cronjob etl --image=busybox:1.36 --schedule='*/10 * * * *' $do -- sh -c 'echo part-$JOB_COMPLETION_INDEX processed'}} (nháy đơn để shell máy bạn không mở rộng biến), rồi chỉ thêm 5 field vào {{jobTemplate.spec}} và 3 field vào {{spec}}.`,
        hints: ['Field Job ({{completions}}, {{completionMode}}, {{activeDeadlineSeconds}}…) nằm trong {{spec.jobTemplate.spec}}.', 'Lệnh cần shell: {{["sh", "-c", "echo part-$JOB_COMPLETION_INDEX processed"]}}.', 'Chạy ngay: {{kubectl create job etl-now --from=cronjob/etl}}.'],
        refs: [
          { type: 'doc', title: 'Jobs: Completion mode', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/#completion-mode' },
          { type: 'doc', title: 'CronJob', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' },
        ],
        tags: ['cronjob', 'indexed job', 'activeDeadlineSeconds'],
      },
    ],
  },
  // ======================================================================= MODULE 4
  {
    id: 'ckad-lab-04', order: 4,
    title: 'Container image: Dockerfile, build, save và dùng image local trong kind',
    summary: 'Tự đóng gói ứng dụng thành image: viết Dockerfile (kể cả multi-stage, chạy non-root), build/tag/save bằng docker hoặc podman, hiểu imagePullPolicy và nạp image local vào cluster kind bằng kind load docker-image.',
    concepts: `### Vì sao CKAD hỏi về image
Domain "Application Design and Build" yêu cầu "define, build and modify container images". Trong đề thường gặp: sửa một Dockerfile, build với tag cho sẵn, **lưu image ra file tar** ({{docker save}} / {{podman save}}), rồi dùng image đó trong Pod. Máy thi có thể chỉ có podman; cú pháp gần như giống docker.

### Dockerfile: các lệnh cần nắm
| Lệnh | Ý nghĩa |
|---|---|
| {{FROM image AS name}} | image nền; nhiều FROM = **multi-stage**, chỉ stage cuối vào image kết quả |
| {{COPY src dst}} / {{COPY --from=build /out /dst}} | chép file từ context hoặc từ stage khác |
| {{RUN cmd}} | chạy lúc build, tạo layer mới |
| {{ENV}}, {{WORKDIR}}, {{EXPOSE}}, {{LABEL}}, {{USER}} | metadata và môi trường runtime |
| {{ENTRYPOINT}} / {{CMD}} | lệnh khi container chạy; trong Pod, {{command}} thay ENTRYPOINT, {{args}} thay CMD |

**Multi-stage** giữ image cuối nhỏ và không chứa mã nguồn, compiler hay secret dùng lúc build. **USER non-root** giảm thiệt hại khi container bị chiếm quyền, và cần thiết khi Pod đặt {{runAsNonRoot: true}}.

### imagePullPolicy
| Giá trị | Hành vi |
|---|---|
| {{Always}} | luôn hỏi registry (mặc định khi tag là {{latest}} hoặc không có tag) |
| {{IfNotPresent}} | dùng image có sẵn trên node, chỉ kéo khi thiếu (mặc định với tag cụ thể) |
| {{Never}} | không bao giờ kéo; thiếu image thì {{ErrImageNeverPull}} |

### Vì sao cần kind load
Node của kind là container chạy containerd riêng, **không thấy** image trong Docker của máy bạn. {{kind load docker-image <img> --name ckad}} chép image vào containerd của mọi node. Sau đó Pod phải dùng {{IfNotPresent}} hoặc {{Never}}: với {{Always}}, kubelet vẫn đi hỏi Docker Hub và báo {{ErrImagePull}}.

### Cheat sheet
~~~bash
docker build -t lab04/hello:1.0 /opt/ckad/lab04/hello
docker tag lab04/hello:1.0 registry.lab.local/team/hello:1.0
docker save -o /opt/ckad/lab04-03.tar registry.lab.local/team/hello:1.0
docker load -i /opt/ckad/lab04-03.tar
podman build -t lab04/hello:1.0 . && podman save -o out.tar lab04/hello:1.0
kind load docker-image lab04/hello:1.0 --name ckad
docker exec ckad-worker crictl images | grep lab04            # kiểm tra image đã ở trên node
docker run --rm --entrypoint id lab04/site:2.0 -u              # image chạy với UID nào
kubectl get pod hello -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}'
~~~

### Bẫy hay gặp
- Dùng tag {{latest}} cho image local: imagePullPolicy mặc định thành {{Always}} → ErrImagePull dù đã kind load.
- Quên {{--name ckad}} khi kind load (mặc định nạp vào cluster tên {{kind}}).
- {{COPY}} đường dẫn nằm ngoài build context; hoặc build sai thư mục context.
- Đổi nội dung image nhưng giữ nguyên tag: node đã có tag cũ với {{IfNotPresent}} sẽ không lấy bản mới. Hãy tăng tag ({{2.0}} → {{2.1}}).
- Podman tự thêm tiền tố {{localhost/}} cho image không có registry; khi đề ghi tên image chính xác, hãy tag đầy đủ.`,
    videos: [
      { title: 'Day 1/40 - Docker Tutorial For Beginners - Docker Fundamentals - CKA Full Course 2025', url: 'https://www.youtube.com/watch?v=ul96dslvVwY', note: 'Xem phần viết Dockerfile, docker build/tag/run: nền tảng cho mọi bài trong module image.' },
    ],
    tasks: [
      {
        id: 'ckad-lab-04-01', no: 1, domain: 'Design & Build', level: 'easy', env: 'kind', minutes: 6,
        title: 'Viết Dockerfile phục vụ trang tĩnh và build có tag',
        task: `Context: {{kubectl config use-context kind-ckad}}

Bài này cần docker (hoặc podman) trên máy. Thư mục {{/opt/ckad/lab04/hello}} đã có file {{index.html}}.
1. Viết {{/opt/ckad/lab04/hello/Dockerfile}}: image nền {{nginx:1.27-alpine}}, chép {{index.html}} vào {{/usr/share/nginx/html/}}, khai báo {{EXPOSE 80}} và label {{org.opencontainers.image.version=1.0}}.
2. Build image với tag {{lab04/hello:1.0}} từ thư mục đó.

Image phải chứa đúng file {{index.html}} của thư mục.`,
        setup: `kubectl create namespace lab04 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/lab04/hello
echo "hello-lab04 version 1.0" > /opt/ckad/lab04/hello/index.html
rm -f /opt/ckad/lab04/hello/Dockerfile
docker rmi lab04/hello:1.0 >/dev/null 2>&1 || true`,
        verify: 'D=/opt/ckad/lab04/hello\n' + V + `grep -Eiq "^FROM +nginx:1.27-alpine" $D/Dockerfile 2>/dev/null && ok dockerfile-from || ko dockerfile-from "Dockerfile chưa FROM nginx:1.27-alpine"
docker image inspect lab04/hello:1.0 >/dev/null 2>&1 && ok image-exists || ko image-exists "không có image lab04/hello:1.0"
eq label "$(docker image inspect lab04/hello:1.0 --format '{{index .Config.Labels "org.opencontainers.image.version"}}' 2>/dev/null)" "1.0"
docker image inspect lab04/hello:1.0 --format '{{json .Config.ExposedPorts}}' 2>/dev/null | grep -q '"80/tcp"' && ok expose || ko expose "image chưa EXPOSE 80"
eq content "$(docker run --rm --entrypoint cat lab04/hello:1.0 /usr/share/nginx/html/index.html 2>/dev/null)" "hello-lab04 version 1.0"` + END,
        solution: `**Dockerfile:**
~~~text
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.version="1.0"
COPY index.html /usr/share/nginx/html/
EXPOSE 80
~~~
**Build và kiểm tra:**
~~~bash
cd /opt/ckad/lab04/hello
docker build -t lab04/hello:1.0 .          # podman build -t lab04/hello:1.0 . cũng được
docker run --rm --entrypoint cat lab04/hello:1.0 /usr/share/nginx/html/index.html
docker image inspect lab04/hello:1.0 --format '{{.Config.Labels}}'
~~~

**Vì sao:** dấu {{.}} cuối lệnh build là **build context**: mọi đường dẫn trong {{COPY}} tính từ đây, nên phải {{cd}} đúng thư mục hoặc truyền đường dẫn thư mục làm đối số cuối. Image nginx đã có sẵn {{CMD}} chạy nginx, ta không cần khai báo lại. {{EXPOSE}} chỉ là metadata (không mở port), nhưng đề yêu cầu thì phải có. LABEL theo chuẩn OCI giúp truy vết phiên bản image trên registry.

**Lỗi hay gặp:** đặt tên file {{dockerfile}} chữ thường trên Linux rồi build không có {{-f}}; COPY tới {{/usr/share/nginx/html}} thiếu dấu {{/}} cuối khi chép nhiều file.

> Mẹo tiết kiệm thời gian: {{docker run --rm --entrypoint cat <image> <file>}} kiểm tra nội dung image trong 1 giây, không cần chạy nginx hay map port.`,
        hints: ['Bốn dòng: {{FROM}}, {{LABEL}}, {{COPY}}, {{EXPOSE}}.', 'Build trong thư mục chứa Dockerfile: {{docker build -t lab04/hello:1.0 .}}.'],
        refs: [{ type: 'doc', title: 'Images', url: 'https://kubernetes.io/docs/concepts/containers/images/' }],
        tags: ['dockerfile', 'docker build'],
      },
      {
        id: 'ckad-lab-04-02', no: 2, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 7,
        title: 'Pod ErrImagePull với image local: kind load và imagePullPolicy',
        task: `Context: {{kubectl config use-context kind-ckad}}

Pod {{hello}} trong namespace {{lab04}} dùng image local {{lab04/hello:1.0}} (đã có trong Docker của máy bạn) nhưng không chạy được.
1. Ghi **reason** đang hiển thị trong trạng thái chờ của container (ví dụ dạng {{Err...}} hoặc {{...BackOff}}) vào {{/opt/ckad/lab04-02.txt}}.
2. Nạp image vào cluster kind tên {{ckad}}.
3. Tạo lại Pod {{hello}} (giữ tên, image {{lab04/hello:1.0}}) với {{imagePullPolicy: IfNotPresent}} để Pod chạy được mà **không** cần registry.

Gọi {{http://127.0.0.1}} trong Pod phải trả về {{hello-lab04 version 1.0}}.`,
        setup: `kubectl create namespace lab04 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/lab04/hello-base
echo "hello-lab04 version 1.0" > /opt/ckad/lab04/hello-base/index.html
printf 'FROM nginx:1.27-alpine\\nCOPY index.html /usr/share/nginx/html/\\n' > /opt/ckad/lab04/hello-base/Dockerfile
docker image inspect lab04/hello:1.0 >/dev/null 2>&1 || docker build -q -t lab04/hello:1.0 /opt/ckad/lab04/hello-base
kubectl -n lab04 delete pod hello --ignore-not-found --wait=true
kubectl -n lab04 run hello --image=lab04/hello:1.0 --image-pull-policy=Always
rm -f /opt/ckad/lab04-02.txt`,
        verify: 'NS=lab04\n' + V + `grep -Eq "^(ErrImagePull|ImagePullBackOff)$" /opt/ckad/lab04-02.txt 2>/dev/null && ok reason-file || ko reason-file "/opt/ckad/lab04-02.txt phải là ErrImagePull hoặc ImagePullBackOff"
for n in ckad-worker ckad-worker2; do docker exec $n crictl images 2>/dev/null | grep -q "lab04/hello" && ok "image-on-$n" || ko "image-on-$n" "node $n chưa có image lab04/hello"; done
eq pull-policy "$(kubectl -n $NS get pod hello -o jsonpath='{.spec.containers[0].image} {.spec.containers[0].imagePullPolicy}' 2>/dev/null)" "lab04/hello:1.0 IfNotPresent"
kubectl -n $NS wait --for=condition=Ready pod/hello --timeout=60s >/dev/null 2>&1 && ok pod-ready || ko pod-ready "pod hello chưa Ready"
eq http "$(kubectl -n $NS exec hello -- wget -qO- -T 5 http://127.0.0.1 2>/dev/null)" "hello-lab04 version 1.0"` + END,
        solution: `**Điều tra:**
~~~bash
kubectl -n lab04 get pod hello
kubectl -n lab04 get pod hello -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}' > /opt/ckad/lab04-02.txt
kubectl -n lab04 describe pod hello | tail -5     # pull access denied / repository does not exist
~~~
**Sửa:**
~~~bash
kind load docker-image lab04/hello:1.0 --name ckad
kubectl -n lab04 delete pod hello
kubectl -n lab04 run hello --image=lab04/hello:1.0 --image-pull-policy=IfNotPresent
kubectl -n lab04 exec hello -- wget -qO- http://127.0.0.1
~~~

**Vì sao:** Node kind là container riêng với containerd riêng, image trong Docker của máy host không tự có ở đó. {{kind load docker-image}} chép image vào **mọi node** của cluster {{ckad}}. Tuy nhiên với {{imagePullPolicy: Always}} kubelet vẫn hỏi registry {{docker.io/lab04/hello}} (không tồn tại) nên tiếp tục {{ErrImagePull}}. Trường {{imagePullPolicy}} của Pod không sửa được sau khi tạo, nên phải tạo lại Pod.

**Lưu ý:** reason xen kẽ giữa {{ErrImagePull}} (vừa thử kéo và lỗi) và {{ImagePullBackOff}} (đang chờ backoff để thử lại); cả hai đều đúng tuỳ thời điểm.

> Mẹo tiết kiệm thời gian: với tag cụ thể (không phải {{latest}}) policy mặc định đã là {{IfNotPresent}}, nên chỉ cần bỏ flag {{--image-pull-policy=Always}} khi tạo lại; ghi rõ policy vẫn an toàn hơn khi đề yêu cầu.`,
        hints: ['Reason nằm ở {{.status.containerStatuses[0].state.waiting.reason}}.', '{{kind load docker-image lab04/hello:1.0 --name ckad}}, rồi tạo lại Pod với {{--image-pull-policy=IfNotPresent}}.'],
        refs: [{ type: 'doc', title: 'Images: Image pull policy', url: 'https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy' }],
        tags: ['kind load', 'imagePullPolicy', 'ErrImagePull'],
      },
      {
        id: 'ckad-lab-04-03', no: 3, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 5,
        title: 'Tag lại image và lưu ra file tar để chuyển sang máy khác',
        task: `Context: {{kubectl config use-context kind-ckad}}

Image {{lab04/hello:1.0}} có sẵn trên máy (docker hoặc podman). Team vận hành cần mang image sang môi trường không có internet.
1. Gắn thêm tag {{registry.lab.local/team/hello:1.0}} cho image đó (không build lại).
2. Lưu image với tag mới ra file {{/opt/ckad/lab04-03.tar}} (định dạng docker-archive, nạp lại được bằng {{docker load}}).
3. Ghi **image ID** ngắn (12 ký tự đầu, không có tiền tố {{sha256:}}) của image vào {{/opt/ckad/lab04-03.txt}}.`,
        setup: `mkdir -p /opt/ckad/lab04/hello-base
echo "hello-lab04 version 1.0" > /opt/ckad/lab04/hello-base/index.html
printf 'FROM nginx:1.27-alpine\\nCOPY index.html /usr/share/nginx/html/\\n' > /opt/ckad/lab04/hello-base/Dockerfile
docker image inspect lab04/hello:1.0 >/dev/null 2>&1 || docker build -q -t lab04/hello:1.0 /opt/ckad/lab04/hello-base
docker rmi registry.lab.local/team/hello:1.0 >/dev/null 2>&1 || true
rm -f /opt/ckad/lab04-03.tar /opt/ckad/lab04-03.txt`,
        verify: V + `SRC=$(docker image inspect lab04/hello:1.0 --format '{{.Id}}' 2>/dev/null)
DST=$(docker image inspect registry.lab.local/team/hello:1.0 --format '{{.Id}}' 2>/dev/null)
[ -n "$DST" ] && [ "$SRC" = "$DST" ] && ok tag-same-image || ko tag-same-image "tag registry.lab.local/team/hello:1.0 chưa có hoặc không trỏ cùng image"
[ -s /opt/ckad/lab04-03.tar ] && ok tar-exists || ko tar-exists "thiếu /opt/ckad/lab04-03.tar"
tar -xOf /opt/ckad/lab04-03.tar manifest.json 2>/dev/null | grep -q "registry.lab.local/team/hello:1.0" && ok tar-tag || ko tar-tag "file tar không chứa tag registry.lab.local/team/hello:1.0"
SHORT=$(echo "$SRC" | cut -d: -f2 | cut -c1-12)
eq image-id "$(tr -d '[:space:]' < /opt/ckad/lab04-03.txt 2>/dev/null)" "$SHORT"` + END,
        solution: `**Lệnh:**
~~~bash
docker tag lab04/hello:1.0 registry.lab.local/team/hello:1.0
docker save -o /opt/ckad/lab04-03.tar registry.lab.local/team/hello:1.0
docker images registry.lab.local/team/hello:1.0   # cột IMAGE ID là 12 ký tự
docker image inspect registry.lab.local/team/hello:1.0 --format '{{.Id}}' | cut -d: -f2 | cut -c1-12 > /opt/ckad/lab04-03.txt
tar -tf /opt/ckad/lab04-03.tar | head        # có manifest.json
~~~
Với podman:
~~~bash
podman tag lab04/hello:1.0 registry.lab.local/team/hello:1.0
podman save -o /opt/ckad/lab04-03.tar registry.lab.local/team/hello:1.0   # mặc định docker-archive
~~~

**Vì sao:** {{docker tag}} chỉ tạo thêm một **tên** trỏ tới cùng image ID, không sao chép layer, nên ID hai tag giống hệt. {{docker save}} đóng gói layer + config + {{manifest.json}} (chứa RepoTags) vào một file tar; khi {{docker load -i}} ở máy khác, image xuất hiện lại với đúng tag đã lưu. Nếu save theo ID thay vì tên, file tar không có tag và máy nhận sẽ thấy image {{<none>}}.

**Lưu ý:** {{docker export}} xuất **filesystem của container**, không phải image (mất layer và metadata), đừng nhầm với {{save}}.

> Mẹo tiết kiệm thời gian: luôn save theo **tên:tag** mà đề yêu cầu; kiểm tra bằng {{tar -xOf file manifest.json}} trước khi chuyển bài.`,
        hints: ['{{docker tag <nguồn> <đích>}} không build lại.', '{{docker save -o /opt/ckad/lab04-03.tar registry.lab.local/team/hello:1.0}}; ID lấy bằng {{docker images}}.'],
        refs: [{ type: 'doc', title: 'Images', url: 'https://kubernetes.io/docs/concepts/containers/images/' }],
        tags: ['docker tag', 'docker save', 'podman'],
      },
      {
        id: 'ckad-lab-04-04', no: 4, domain: 'Design & Build', level: 'medium', env: 'kind', minutes: 10,
        title: 'Dockerfile multi-stage, image cuối chạy non-root',
        task: `Context: {{kubectl config use-context kind-ckad}}

Thư mục {{/opt/ckad/lab04/site}} có {{src/index.html}} và {{src/VERSION}}. Viết {{/opt/ckad/lab04/site/Dockerfile}} **multi-stage**:
- Stage {{build}} từ {{busybox:1.36}}: chép {{src}} vào {{/src}}, tạo thư mục {{/out}} chứa {{index.html}} và file {{version.txt}} có nội dung {{version=<nội dung file VERSION>}}.
- Stage cuối từ {{nginxinc/nginx-unprivileged:1.27-alpine}}: chỉ chép nội dung {{/out}} của stage build vào {{/usr/share/nginx/html/}}, {{EXPOSE 8080}}.

Build image {{lab04/site:2.0}}. Image cuối **không** được chứa thư mục {{/src}} và **không** chạy bằng root (UID khác 0).`,
        setup: `mkdir -p /opt/ckad/lab04/site/src
echo "site-lab04" > /opt/ckad/lab04/site/src/index.html
echo "2.0" > /opt/ckad/lab04/site/src/VERSION
rm -f /opt/ckad/lab04/site/Dockerfile
docker rmi lab04/site:2.0 >/dev/null 2>&1 || true`,
        verify: 'D=/opt/ckad/lab04/site\nI=lab04/site:2.0\n' + V + `[ "$(grep -Eic "^FROM " $D/Dockerfile 2>/dev/null)" -ge 2 ] 2>/dev/null && ok multi-stage || ko multi-stage "Dockerfile cần ít nhất 2 FROM"
docker image inspect $I >/dev/null 2>&1 && ok image-exists || ko image-exists "không có image $I"
eq version "$(docker run --rm --entrypoint cat $I /usr/share/nginx/html/version.txt 2>/dev/null)" "version=2.0"
eq index "$(docker run --rm --entrypoint cat $I /usr/share/nginx/html/index.html 2>/dev/null)" "site-lab04"
docker run --rm --entrypoint sh $I -c "test ! -e /src" >/dev/null 2>&1 && ok no-src || ko no-src "image cuối vẫn có /src hoặc không chạy được"
U=$(docker run --rm --entrypoint id $I -u 2>/dev/null)
[ -n "$U" ] && [ "$U" != "0" ] && ok non-root || ko non-root "image chạy với UID '$U'"` + END,
        solution: `**Dockerfile:**
~~~text
FROM busybox:1.36 AS build
COPY src /src
RUN mkdir -p /out && cp /src/index.html /out/ && echo "version=$(cat /src/VERSION)" > /out/version.txt

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /out/ /usr/share/nginx/html/
EXPOSE 8080
~~~
~~~bash
cd /opt/ckad/lab04/site
docker build -t lab04/site:2.0 .
docker run --rm --entrypoint cat lab04/site:2.0 /usr/share/nginx/html/version.txt   # version=2.0
docker run --rm --entrypoint id lab04/site:2.0                                     # uid=101(nginx)
~~~

**Vì sao:**
- Image kết quả chỉ gồm **stage cuối**; stage {{build}} bị bỏ, nên {{/src}} và công cụ build không lọt vào image. Với ứng dụng Java thật, stage build dùng image có JDK + Maven, stage cuối chỉ cần JRE và file jar, giảm kích thước nhiều lần.
- {{nginxinc/nginx-unprivileged}} đã đặt {{USER 101}} và nghe port **8080** (port dưới 1024 cần quyền root hoặc capability {{NET_BIND_SERVICE}}). Dùng image này thay vì tự thêm {{USER}} vào nginx thường, vốn sẽ lỗi khi bind port 80 và ghi {{/var/cache/nginx}}.
- {{$(cat /src/VERSION)}} được shell trong {{RUN}} mở rộng lúc build.

> Mẹo tiết kiệm thời gian: đặt tên stage ({{AS build}}) rồi {{COPY --from=build}}; dùng số thứ tự ({{--from=0}}) dễ sai khi thêm stage.`,
        hints: ['Hai {{FROM}}: {{busybox:1.36 AS build}} và {{nginxinc/nginx-unprivileged:1.27-alpine}}.', 'Stage cuối chỉ cần {{COPY --from=build /out/ /usr/share/nginx/html/}}; image nền đã chạy non-root.'],
        refs: [{ type: 'doc', title: 'Images', url: 'https://kubernetes.io/docs/concepts/containers/images/' }],
        tags: ['multi-stage', 'non-root', 'dockerfile'],
      },
      {
        id: 'ckad-lab-04-05', no: 5, domain: 'Design & Build', level: 'hard', env: 'kind', minutes: 12,
        title: 'Tổng hợp: build phiên bản mới, nạp vào kind, sửa Deployment và expose',
        task: `Context: {{kubectl config use-context kind-ckad}}

Deployment {{site}} trong namespace {{lab04}} (2 replicas, image {{lab04/site:2.1}}) đang kẹt vì image chưa có trên cluster. Thư mục {{/opt/ckad/lab04/site2}} có sẵn Dockerfile và mã nguồn phiên bản 2.1.
1. Build image {{lab04/site:2.1}} từ {{/opt/ckad/lab04/site2}} (không dùng tag {{latest}}).
2. Nạp image vào cluster kind {{ckad}}.
3. Sửa Deployment {{site}} để dùng {{imagePullPolicy: IfNotPresent}} (giữ image {{lab04/site:2.1}}), đảm bảo 2 Pod Ready.
4. Tạo Service ClusterIP {{site}} port {{80}} chuyển tới port {{8080}} của container.

Từ một Pod khác trong {{lab04}}, {{http://site/version.txt}} phải trả về {{version=2.1}}.`,
        setup: `kubectl create namespace lab04 --dry-run=client -o yaml | kubectl apply -f -
mkdir -p /opt/ckad/lab04/site2/src
echo "site-lab04" > /opt/ckad/lab04/site2/src/index.html
echo "2.1" > /opt/ckad/lab04/site2/src/VERSION
cat > /opt/ckad/lab04/site2/Dockerfile <<'EOF'
FROM busybox:1.36 AS build
COPY src /src
RUN mkdir -p /out && cp /src/index.html /out/ && echo "version=$(cat /src/VERSION)" > /out/version.txt

FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /out/ /usr/share/nginx/html/
EXPOSE 8080
EOF
docker rmi lab04/site:2.1 >/dev/null 2>&1 || true
kubectl -n lab04 delete service site --ignore-not-found
kubectl -n lab04 delete deployment site --ignore-not-found --wait=true
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: site
  namespace: lab04
spec:
  replicas: 2
  selector:
    matchLabels:
      app: site
  template:
    metadata:
      labels:
        app: site
    spec:
      containers:
      - name: site
        image: lab04/site:2.1
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
EOF`,
        verify: 'NS=lab04\n' + V + PROBE + `docker image inspect lab04/site:2.1 >/dev/null 2>&1 && ok image-built || ko image-built "chưa build lab04/site:2.1"
for n in ckad-worker ckad-worker2; do docker exec $n crictl images 2>/dev/null | grep "lab04/site" | grep -q "2.1" && ok "image-on-$n" || ko "image-on-$n" "node $n chưa có lab04/site:2.1"; done
eq deploy-image "$(kubectl -n $NS get deployment site -o jsonpath='{.spec.template.spec.containers[0].image} {.spec.template.spec.containers[0].imagePullPolicy}' 2>/dev/null)" "lab04/site:2.1 IfNotPresent"
kubectl -n $NS rollout status deployment/site --timeout=120s >/dev/null 2>&1 && ok rollout || ko rollout "deployment site chưa rollout xong"
eq ready "$(kubectl -n $NS get deployment site -o jsonpath='{.status.readyReplicas}' 2>/dev/null)" "2"
eq svc "$(kubectl -n $NS get svc site -o jsonpath='{.spec.type} {.spec.ports[0].port} {.spec.ports[0].targetPort}' 2>/dev/null)" "ClusterIP 80 8080"
eq http "$(probe lab04-05-c1 http://site/version.txt | tr -d '[:space:]')" "version=2.1"` + END,
        solution: `**Build và nạp image:**
~~~bash
docker build -t lab04/site:2.1 /opt/ckad/lab04/site2
kind load docker-image lab04/site:2.1 --name ckad
~~~
**Sửa Deployment** (pod template thay đổi nên Deployment tự rollout Pod mới):
~~~bash
kubectl -n lab04 patch deployment site --type=json \\
  -p '[{"op":"replace","path":"/spec/template/spec/containers/0/imagePullPolicy","value":"IfNotPresent"}]'
kubectl -n lab04 rollout status deployment/site
~~~
**Expose và kiểm tra:**
~~~bash
kubectl -n lab04 expose deployment site --port=80 --target-port=8080
kubectl -n lab04 run tmp --rm -i --restart=Never --image=busybox:1.36 -- wget -qO- http://site/version.txt
~~~

**Vì sao từng bước:**
- Pod kẹt {{ErrImagePull}} vì hai lý do chồng nhau: image chưa có trên node **và** policy {{Always}} buộc kubelet hỏi Docker Hub. Chỉ kind load mà không đổi policy thì vẫn lỗi; chỉ đổi policy mà không load thì lỗi {{ErrImagePull}} tiếp (không có trên node, không kéo được).
- Patch JSON thay đúng một field; {{kubectl edit}} cũng được nhưng chậm hơn. Vì template thay đổi, Deployment tạo ReplicaSet mới, Pod cũ đang lỗi bị thay thế.
- Container nghe **8080** (nginx-unprivileged), nên Service cần {{targetPort: 8080}}; để mặc định targetPort = port 80 thì Service có endpoint nhưng mọi kết nối bị từ chối.

> Mẹo tiết kiệm thời gian: sau khi đổi nội dung image, **luôn tăng tag** (2.0 → 2.1). Giữ nguyên tag thì node đã có bản cũ với IfNotPresent sẽ chạy code cũ và rất khó phát hiện.`,
        hints: ['Hai nguyên nhân: image chưa có trên node và {{imagePullPolicy: Always}}.', '{{kind load docker-image lab04/site:2.1 --name ckad}}; patch policy bằng {{kubectl patch --type=json}} hoặc {{kubectl edit}}.', 'Service: {{kubectl expose deployment site --port=80 --target-port=8080}}.'],
        refs: [
          { type: 'doc', title: 'Images: Image pull policy', url: 'https://kubernetes.io/docs/concepts/containers/images/#image-pull-policy' },
          { type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
        ],
        tags: ['kind load', 'imagePullPolicy', 'deployment', 'service'],
      },
    ],
  }
  );
})();
