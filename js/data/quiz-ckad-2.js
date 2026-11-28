/* CKAD quiz part 2 (task T2835): 40 câu tình huống module 7–12, topic devops.
   Tag domain đầu câu: [Design & Build] [Deployment] [Observability] [Config & Security] [App Networking]. */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-041',
  topic: 'devops',
  q: '[Deployment] Bạn cần liệt kê MỌI Helm release trên TẤT CẢ namespace của cluster. Lệnh nào đúng?',
  options: ['helm list namespaces', 'kubectl get helmreleases -A', 'helm list -A', 'helm ls --all-namespaces=false'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{helm list -A}} (hay {{--all-namespaces}}) liệt kê release ở mọi namespace. Mặc định {{helm list}} chỉ hiện release trong namespace hiện tại, nên thiếu -A là hay bị sót.

### Vì sao các phương án khác sai
- **A:** {{helm list namespaces}} không phải cú pháp; namespaces là resource của kubectl chứ không phải đối số của helm list.
- **B:** {{helmreleases}} chỉ tồn tại khi bạn cài operator (ví dụ Helm Operator); cluster CKAD không có sẵn.
- **D:** {{--all-namespaces=false}} tắt đúng thứ bạn cần, chỉ xem namespace hiện tại.

> Mẹo thi: "mọi namespace" → luôn nghĩ tới cờ {{ -A }} (hoặc {{--all-namespaces}}).`
},
{
  id: 'qz-ckad-042',
  topic: 'devops',
  q: '[Deployment] Bạn muốn một lệnh vừa cài mới (nếu chưa có) vừa nâng cấp (nếu đã có) Helm release, kèm file values. Lệnh nào?',
  options: ['helm install --upgrade myrel ./chart', 'helm upgrade --install myrel ./chart -f values.yaml', 'helm upgrade myrel ./chart --force-create', 'helm apply myrel ./chart'],
  answer: 1,
  explain: `**Đáp án đúng: B.** {{helm upgrade --install}} (viết tắt {{helm upgrade -i}}) là mẫu câu chuẩn: nếu release chưa tồn tại thì cài, đã có thì nâng cấp. {{ -f values.yaml }} nạp giá trị cấu hình.

### Vì sao các phương án khác sai
- **A:** {{helm install}} không có cờ {{--upgrade}}; sai cú pháp.
- **C:** {{--force-create}} không phải cờ của helm upgrade.
- **D:** {{helm apply}} không tồn tại (apply là của kubectl, không phải helm).

> Đây là lệnh hay dùng trong CI/CD: chạy lại nhiều lần vẫn an toàn (idempotent).`
},
{
  id: 'qz-ckad-043',
  topic: 'devops',
  q: '[Deployment] Bạn muốn xem YAML mà chart sẽ sinh ra (render template) mà KHÔNG cài gì lên cluster. Lệnh nào?',
  options: ['helm install --dry-run=client', 'helm show chart ./chart', 'helm lint --render', 'helm template myrel ./chart'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{helm template myrel ./chart}} render toàn bộ manifest ra stdout, hoàn toàn phía client, không đụng cluster — rất hợp để xem/sửa trước khi cài.

### Vì sao các phương án khác sai
- **A:** {{helm install --dry-run=client}} cũng render nhưng vẫn là lệnh install (cần tên release, và dễ gây nhầm là đã cài).
- **B:** {{helm show chart}} chỉ in metadata Chart.yaml, không render resource.
- **C:** {{helm lint --render}} kiểm tra cú pháp chart, không in manifest đầy đủ.

> Khi đề nói "xem trước, không cài" → {{helm template}} là lựa chọn an toàn nhất.`
},
{
  id: 'qz-ckad-044',
  topic: 'devops',
  multi: true,
  q: '[Deployment] Khi gỡ một Helm release, hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['helm uninstall myrel sẽ xoá luôn namespace chứa nó', 'helm uninstall --keep-history myrel giữ lại lịch sử release (trạng thái uninstalled)', 'helm uninstall myrel mặc định xoá cả tài nguyên do chart tạo lẫn lịch sử', 'helm delete là lệnh khác hoàn toàn, không liên quan uninstall'],
  answer: [1, 2],
  explain: `**Đáp án đúng: B, C.** Mặc định {{helm uninstall}} (hay {{helm delete}}) xoá toàn bộ tài nguyên do chart tạo VÀ lịch sử release. Thêm {{--keep-history}} thì giữ lại bản ghi release ở trạng thái {{uninstalled}} (hữu ích khi cần audit/rollback tham chiếu).

### Vì sao các phương án khác sai
- **A:** uninstall không xoá namespace, chỉ xoá tài nguyên bên trong do release quản lý.
- **D:** {{helm delete}} chính là alias của {{helm uninstall}}, không phải lệnh lạ.`
},
{
  id: 'qz-ckad-045',
  topic: 'devops',
  q: '[Deployment] Trong Kustomize overlay, bạn cần thêm tiền tố "prod-" vào tên MỌI resource. Khai báo nào trong kustomization.yaml?',
  options: ['namePrefix: prod-', 'prefix: prod-', 'nameSuffix: prod-', 'commonPrefix: prod-'],
  answer: 0,
  explain: `**Đáp án đúng: A.** {{namePrefix}} (và {{nameSuffix}}) là transformer có sẵn của Kustomize, tự động thêm tiền tố/hậu tố vào {{metadata.name}} của mọi resource.

### Vì sao các phương án khác sai
- **B:** không có khoá {{prefix}}.
- **C:** {{nameSuffix}} thêm HẬU TỐ (cuối tên), không phải tiền tố.
- **D:** {{commonPrefix}} không tồn tại trong schema kustomization.

> Name prefix rất hợp để tách môi trường: cùng một base, overlay prod thêm "prod-", overlay dev thêm "dev-".`
},
{
  id: 'qz-ckad-046',
  topic: 'devops',
  q: '[Deployment] Bạn muốn Kustomize tự tạo một ConfigMap từ file app.properties (mỗi dòng KEY=VALUE). Khai báo nào đúng?',
  options: ['configMapGenerator: [{name: app-config, literals: [app.properties]}]', 'resources: [app.properties]', 'configMapGenerator: [{name: app-config, files: [app.properties]}]', 'patches: [{configMap: app-config}]'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{configMapGenerator}} với {{files:}} tạo ConfigMap, mỗi file thành một key (key = tên file, value = nội dung). Kustomize còn tự thêm hậu tố hash vào tên để đổi tên khi nội dung đổi.

### Vì sao các phương án khác sai
- **A:** {{literals:}} cần dạng {{KEY=VALUE}} chứ không phải đường dẫn file.
- **B:** {{resources:}} chỉ tham chiếu manifest có sẵn, không sinh ConfigMap từ file.
- **D:** {{patches:}} để vá resource, không tạo mới.

> Nhớ: file → {{files}}, chuỗi KEY=VALUE → {{literals}}.`
},
{
  id: 'qz-ckad-047',
  topic: 'devops',
  q: '[Deployment] Bạn cần vá một danh sách container trong Deployment, MERGE theo tên container (không ghi đè cả list). Dùng kiểu patch nào?',
  options: ['patches kiểu JSONPatch add /spec/template/spec/containers/0', 'patchesStrategicMerge (merge theo merge key name của container)', 'images transformer', 'replacements'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Strategic merge patch hiểu "merge key": với list container, key là {{name}}, nên nó gộp theo tên container thay vì thay cả mảng. Đây là cách vá an toàn nhất cho Deployment.

### Vì sao các phương án khác sai
- **A:** JSONPatch {{add .../containers/0}} ghi đè phần tử đầu tiên, dễ mất container khác.
- **C:** {{images}} transformer chỉ đổi image, không vá field tuỳ ý.
- **D:** {{replacements}} thay giá trị theo đường dẫn, không merge list theo key.

> Khi đề nói "merge theo tên, giữ các phần tử khác" → strategic merge.`
},
{
  id: 'qz-ckad-048',
  topic: 'devops',
  q: '[Deployment] Bạn muốn ghi chú LÝ DO thay đổi để xem lại trong rollout history. Annotation nào?',
  options: ['kubernetes.io/change-reason', 'deployment.kubernetes.io/revision', 'kubectl.kubernetes.io/last-applied', 'kubernetes.io/change-cause: "tăng replicas lên 5"'],
  answer: 3,
  explain: `**Đáp án đúng: D.** Annotation {{kubernetes.io/change-cause}} trên Deployment lưu mô tả thay đổi; {{kubectl rollout history}} sẽ hiển thị nó, rất tiện truy vết ai/sao đổi.

### Vì sao các phương án khác sai
- **A:** {{change-reason}} không phải annotation chuẩn.
- **B:** {{deployment.kubernetes.io/revision}} là số revision do hệ thống quản lý, không phải ghi chú của bạn.
- **C:** {{kubectl.kubernetes.io/last-applied}} là annotation hệ thống lưu bản apply gần nhất, không dùng để ghi lý do.

> Có thể set nhanh: {{kubectl annotate deployment/web kubernetes.io/change-cause="..."}}`
},
{
  id: 'qz-ckad-049',
  topic: 'devops',
  q: '[Design & Build] Hai container trong cùng Pod cần NHÌN THẤY tiến trình của nhau (ví dụ để debug). Field nào ở cấp Pod?',
  options: ['spec.processSharing: true', 'spec.shareProcessNamespace: true', 'container.shareProcess: true', 'spec.hostPID: true'],
  answer: 1,
  explain: `**Đáp án đúng: B.** {{spec.shareProcessNamespace: true}} cho các container dùng chung một PID namespace, nên container này thấy được process của container kia (qua {{ps}}, {{kill}}…).

### Vì sao các phương án khác sai
- **A:** không có field {{processSharing}}.
- **C:** không có field cấp container tên vậy; đây là cấu hình cấp Pod.
- **D:** {{hostPID: true}} chia sẻ PID namespace của NODE (mọi tiến trình trên máy) — quá rộng và rủi ro bảo mật.

> Phân biệt: shareProcessNamespace = trong Pod; hostPID = cả node.`
},
{
  id: 'qz-ckad-050',
  topic: 'devops',
  q: '[Design & Build] Bạn cần một volume tạm dạng tmpfs (nằm trong RAM, không ghi xuống đĩa) để mount vào /tmp. Cấu hình volume nào?',
  options: ['volumes: [{name: tmp, emptyDir: {sizeLimit: 1Gi}}]', 'volumes: [{name: tmp, hostPath: {path: /tmp}}]', 'volumes: [{name: tmp, configMap: {}}]', 'volumes: [{name: tmp, emptyDir: {medium: Memory}}]'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{emptyDir}} với {{medium: Memory}} tạo tmpfs (lưu trong RAM). Nhanh và không chạm đĩa, hợp cho dữ liệu tạm cần tốc độ hoặc cần mã hoá ở RAM.

### Vì sao các phương án khác sai
- **A:** {{sizeLimit}} chỉ giới hạn dung lượng, vẫn lưu trên đĩa node.
- **B:** {{hostPath}} ghi thẳng lên đĩa node, không phải RAM, và vướng bảo mật.
- **C:** {{configMap}} là volume đọc từ ConfigMap, không phải nơi ghi tạm.

> Lưu ý: tmpfs tính vào memory limit của pod, dùng nhiều dễ OOM.`
},
{
  id: 'qz-ckad-051',
  topic: 'devops',
  q: '[Design & Build] Bạn muốn đưa TÊN NODE (nơi pod đang chạy) vào một biến môi trường. Dùng fieldPath nào?',
  options: ['valueFrom.fieldRef.fieldPath: spec.nodeName', 'valueFrom.fieldRef.fieldPath: metadata.name', 'valueFrom.configMapKeyRef', 'valueFrom.resourceFieldRef'],
  answer: 0,
  explain: `**Đáp án đúng: A.** {{fieldRef}} với {{spec.nodeName}} lấy tên node. Đây là Downward API — cách đưa metadata của pod/node vào biến môi trường hoặc file.

### Vì sao các phương án khác sai
- **B:** {{metadata.name}} là tên POD, không phải node.
- **C:** {{configMapKeyRef}} lấy từ ConfigMap, không phải metadata.
- **D:** {{resourceFieldRef}} lấy requests/limits, không phải tên node.

> Cùng Downward API: {{metadata.name}} (pod), {{spec.nodeName}} (node), {{status.podIP}} (IP pod).`
},
{
  id: 'qz-ckad-052',
  topic: 'devops',
  multi: true,
  q: '[Design & Build] Về init container, hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['Init container chạy tuần tự theo thứ tự khai báo, xong cái này mới tới cái sau', 'Init container chạy song song với container chính', 'Nếu một init container thất bại, kubelet khởi động lại Pod theo restartPolicy', 'Init container luôn có restartPolicy: Always'],
  answer: [0, 2],
  explain: `**Đáp án đúng: A, C.** Init container chạy lần lượt theo thứ tự; nếu một cái lỗi, kubelet restart Pod theo {{restartPolicy}} của Pod (mặc định Always). Mục đích: chuẩn bị điều kiện (chờ DB, tạo schema…) trước khi container chính chạy.

### Vì sao các phương án khác sai
- **B:** init container KHÔNG chạy song song với container chính; nó phải xong hết mới tới main.
- **D:** mặc định init container có {{restartPolicy: Never}}; chỉ khi đặt {{Always}} (K8s 1.29+) nó thành native sidecar.

> Trật tự: init 1 → init 2 → … → container chính.`
},
{
  id: 'qz-ckad-053',
  topic: 'devops',
  q: '[Design & Build] Bạn mount một Secret thành file và muốn mọi file chỉ có chủ sở hữu đọc/ghi (0400). Field nào đặt quyền mặc định cho các file trong volume?',
  options: ['readOnly: true', 'mode: 0400', 'defaultMode: 0400', 'fileMode: 0400'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{defaultMode}} đặt quyền (octal) cho mọi file trong volume Secret/ConfigMap. {{0400}} = chỉ owner đọc.

### Vì sao các phương án khác sai
- **A:** {{readOnly: true}} chỉ gắn cờ mount read-only, không quyết định con số 0400 (nên vẫn nên đặt kèm).
- **B:** {{mode}} không phải field của volume.
- **D:** {{fileMode}} không tồn tại.

> Nên dùng cả hai: {{defaultMode: 0400}} + {{readOnly: true}}.`
},
{
  id: 'qz-ckad-054',
  topic: 'devops',
  q: '[Design & Build] Bạn muốn Pod đạt QoS class Guaranteed (ưu tiên cao nhất, ít bị evict). Điều kiện nào?',
  options: ['Chỉ cần đặt limits', 'Mọi container đặt requests = limits cho CẢ cpu và memory', 'Đặt requests > limits', 'Không đặt resources'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Guaranteed yêu cầu mọi container có requests = limits cho cả CPU lẫn memory. Khi thiếu, pod rơi xuống Burstable hoặc BestEffort.

### Vì sao các phương án khác sai
- **A:** chỉ đặt limits (thiếu requests) → Burstable.
- **C:** requests > limits là cấu hình vô nghĩa, K8s không cho.
- **D:** không đặt gì → BestEffort (dễ bị evict đầu tiên khi thiếu tài nguyên).

> Thứ tự evict khi thiếu RAM: BestEffort → Burstable → Guaranteed.`
},
{
  id: 'qz-ckad-055',
  topic: 'devops',
  multi: true,
  q: '[Design & Build] Nạp biến môi trường từ một ConfigMap (KHÔNG phải Secret), hai cách nào đúng? (Chọn 2)',
  options: ['volumeMounts nạp ConfigMap thành biến môi trường', 'env với valueFrom.configMapKeyRef cho từng biến', 'envFrom.secretRef nạp từ Secret', 'envFrom.configMapRef nạp toàn bộ key thành biến'],
  answer: [1, 3],
  explain: `**Đáp án đúng: B, D.** {{env}} + {{configMapKeyRef}} lấy từng key thành một biến; {{envFrom}} + {{configMapRef}} nạp tất cả key thành biến cùng lúc.

### Vì sao các phương án khác sai
- **A:** {{volumeMounts}} biến ConfigMap thành FILE, không phải biến môi trường.
- **C:** {{envFrom.secretRef}} nạp từ Secret, sai nguồn (đề yêu cầu ConfigMap).

> env = từng biến; envFrom = tất cả biến; volume = thành file.`
},
{
  id: 'qz-ckad-056',
  topic: 'devops',
  q: '[Design & Build] imagePullPolicy Always và IfNotPresent khác nhau thế nào?',
  options: ['Always: chỉ pull khi tag đổi', 'IfNotPresent: pull lại mỗi lần pod khởi động', 'Cả hai luôn pull image', 'IfNotPresent: chỉ pull khi node chưa có image; Always: pull mỗi lần tạo container'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{IfNotPresent}} chỉ tải image khi node chưa có; {{Always}} tải lại mỗi lần tạo container (bắt kịp tag {{latest}} hoặc image vừa bị ghi đè trên registry).

### Vì sao các phương án khác sai
- **A:** Always pull mỗi lần, không chờ tag đổi.
- **B:** IfNotPresent KHÔNG pull nếu node đã có.
- **C:** IfNotPresent không luôn pull.

> Mặc định: tag {{latest}} → Always; tag cố định → IfNotPresent.`
},
);
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-057',
  topic: 'devops',
  q: '[Observability] Bạn cần xem log của TẤT CẢ pod có label app=api, kèm tên pod trước mỗi dòng. Lệnh nào?',
  options: ['kubectl logs -l app=api --prefix', 'kubectl logs app=api', 'kubectl get logs -l app=api', 'kubectl logs --selector api'],
  answer: 0,
  explain: `**Đáp án đúng: A.** {{kubectl logs -l app=api}} (hay {{--selector}}) chọn log theo label; {{--prefix}} in tên pod trước mỗi dòng để phân biệt khi nhiều pod.

### Vì sao các phương án khác sai
- **B:** {{kubectl logs app=api}} hiểu "app=api" là tên pod, không phải selector.
- **C:** {{kubectl get logs}} không phải lệnh (logs không phải resource get được).
- **D:** {{--selector api}} thiếu dạng key=value.

> Pod nhiều container: thêm {{--all-containers}}; xem lần chạy trước: {{--previous}}.`
},
{
  id: 'qz-ckad-058',
  topic: 'devops',
  q: '[Observability] Bạn muốn liệt kê event trong namespace, sắp xếp theo thời gian. Lệnh nào?',
  options: ['kubectl get events --order=asc', 'kubectl describe events', 'kubectl get events --sort-by=.metadata.creationTimestamp', 'kubectl logs events'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{--sort-by=.metadata.creationTimestamp}} sắp event theo thời gian tạo (dùng JSONPath). Rất hợp để đọc trình tự sự cố.

### Vì sao các phương án khác sai
- **A:** {{--order}} không phải cờ của kubectl get.
- **B:** {{kubectl describe events}} xem chi tiết nhưng không sắp theo thời gian.
- **D:** {{kubectl logs events}} sai — events không phải pod.

> Khi debug CrashLoop, đọc event theo thứ tự thời gian để thấy nguyên nhân.`
},
{
  id: 'qz-ckad-059',
  topic: 'devops',
  multi: true,
  q: '[Observability] Startup probe chỉ chạy lúc khởi động. Hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['Trong khi startup probe chạy, liveness và readiness bị tạm vô hiệu', 'Startup probe thay thế hoàn toàn readiness vĩnh viễn', 'Startup probe chỉ hỗ trợ TCP', 'Thời gian tối đa cho khởi động = failureThreshold × periodSeconds'],
  answer: [0, 3],
  explain: `**Đáp án đúng: A, D.** Khi startup probe chưa pass, kubelet chưa chạy liveness/readiness (tránh restart oan app khởi động chậm). Tổng thời gian chờ tối đa = {{failureThreshold × periodSeconds}}; quá ngưỡng đó container bị restart.

### Vì sao các phương án khác sai
- **B:** sau khi startup pass, readiness/liveness chạy lại bình thường — không bị thay thế vĩnh viễn.
- **C:** startup probe hỗ trợ http/tcp/exec như các probe khác.

> App Spring/JVM khởi động lâu → startup probe là bạn thân của liveness.`
},
{
  id: 'qz-ckad-060',
  topic: 'devops',
  q: '[Observability] Bạn muốn gắn một container tạm (busybox) vào một pod đang chạy để debug, KHÔNG restart pod. Lệnh nào?',
  options: ['kubectl exec -it mypod -- sh', 'kubectl debug -it mypod --image=busybox --target=mycontainer', 'kubectl attach mypod -c mycontainer', 'kubectl debug node/mynode'],
  answer: 1,
  explain: `**Đáp án đúng: B.** {{kubectl debug -it mypod --image=busybox --target=mycontainer}} tạo một ephemeral container, chia sẻ process namespace với container đích nên thấy được tiến trình/file của nó.

### Vì sao các phương án khác sai
- **A:** {{kubectl exec}} cần container đã có shell; nếu image không có sh thì vô dụng.
- **C:** {{kubectl attach}} chỉ nối vào stdin/stdout tiến trình đang chạy, không tạo công cụ mới.
- **D:** {{kubectl debug node/...}} tạo pod debug trên NODE, không gắn vào pod cụ thể.

> Ephemeral container không thay được container chính, chỉ để soi.`
},
{
  id: 'qz-ckad-061',
  topic: 'devops',
  q: '[Observability] Bạn nghi một apiVersion cũ đã bị loại bỏ. Lệnh nào liệt kê tài nguyên kèm phiên bản API ưu tiên để đối chiếu?',
  options: ['kubectl version --api', 'kubectl get --all', 'kubectl explain --deprecated', 'kubectl api-resources'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{kubectl api-resources}} liệt kê mọi resource type kèm apiVersion ưu tiên (preferred). Đối chiếu manifest cũ với danh sách này để biết field/version nào đã deprecate.

### Vì sao các phương án khác sai
- **A:** {{kubectl version --api}} không phải cờ đúng.
- **B:** {{kubectl get --all}} không tồn tại.
- **C:** {{kubectl explain --deprecated}} sai; {{kubectl explain <field>}} để xem mô tả field.

> Thường đi kèm: {{kubectl explain deployment.spec.template.spec.containers}} xem field.`
},
{
  id: 'qz-ckad-062',
  topic: 'devops',
  q: '[Observability] Bạn muốn readiness probe bắt đầu kiểm tra SAU 5 giây, rồi mỗi 3 giây một lần. Cấu hình nào?',
  options: ['initialDelaySeconds: 5, periodSeconds: 3', 'timeoutSeconds: 5, periodSeconds: 3', 'initialDelaySeconds: 3, periodSeconds: 5', 'delaySeconds: 5, intervalSeconds: 3'],
  answer: 0,
  explain: `**Đáp án đúng: A.** {{initialDelaySeconds}} là số giây chờ trước lần kiểm tra đầu; {{periodSeconds}} là chu kỳ lặp lại giữa các lần.

### Vì sao các phương án khác sai
- **B:** {{timeoutSeconds}} là thời gian chờ MỖI lần probe, không phải delay ban đầu.
- **C:** đảo ngược 5 và 3.
- **D:** {{delaySeconds}}/{{intervalSeconds}} không phải tên field chuẩn.

> 5 cờ hay gặp: initialDelaySeconds, periodSeconds, timeoutSeconds, successThreshold, failureThreshold.`
},
);
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-063',
  topic: 'devops',
  q: '[Config & Security] Bạn cần ResourceQuota giới hạn tổng requests.cpu của namespace là 4 CPU. Khai báo nào đúng?',
  options: ['hard: {requests.cpu: 4}', 'limits: {cpu: "4"}', 'hard: {requests.cpu: "4"}', 'spec.quota: 4'],
  answer: 2,
  explain: `**Đáp án đúng: C.** ResourceQuota dùng khoá {{hard}} với các quantity dạng CHUỖI. {{requests.cpu: "4"}} = tổng 4 CPU.

~~~yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute
spec:
  hard:
    requests.cpu: "4"
~~~

### Vì sao các phương án khác sai
- **A:** quantity phải là chuỗi "4", không phải số 4.
- **B:** {{limits:}} không phải khoá của ResourceQuota (đó là của container).
- **D:** {{spec.quota}} không tồn tại; dùng {{spec.hard}}.

> Quantity luôn để trong ngoặc kép: "4", "2Gi", "500m".`
},
{
  id: 'qz-ckad-064',
  topic: 'devops',
  multi: true,
  q: '[Config & Security] Về LimitRange trong một namespace, hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['LimitRange giới hạn tổng tài nguyên cả namespace (thay cho ResourceQuota)', 'defaultRequest/default đặt giá trị mặc định cho container không khai báo resources', 'max/min chặn giá trị requests/limits của MỖI container', 'LimitRange bắt buộc mọi pod phải đặt limits'],
  answer: [1, 2],
  explain: `**Đáp án đúng: B, C.** LimitRange cấp "default" (mặc định) và "max/min" (giới hạn mỗi container). Nhờ default, pod không khai báo resources vẫn có giá trị hợp lệ.

### Vì sao các phương án khác sai
- **A:** giới hạn TỔNG cả namespace là việc của ResourceQuota, không phải LimitRange.
- **D:** LimitRange không ép buộc; nó cung cấp default nên pod thiếu khai báo vẫn chạy.

> ResourceQuota = trần tổng namespace; LimitRange = mặc định + biên độ mỗi container.`
},
{
  id: 'qz-ckad-065',
  topic: 'devops',
  q: '[Config & Security] Bạn muốn CHẶN container tự nâng quyền (ví dụ qua binary setuid). Field SecurityContext nào?',
  options: ['privileged: false', 'allowPrivilegeEscalation: false', 'noNewPrivileges: true', 'capabilities.drop: [ALL]'],
  answer: 1,
  explain: `**Đáp án đúng: B.** {{allowPrivilegeEscalation: false}} bật cờ no_new_privs của tiến trình, chặn việc nhận thêm quyền qua setuid/setgid.

### Vì sao các phương án khác sai
- **A:** {{privileged: false}} là mặc định, không chặn escalation.
- **C:** {{noNewPrivileges}} không phải field K8s (đó là tên cờ Linux; K8s dùng allowPrivilegeEscalation).
- **D:** {{drop: [ALL]}} bỏ bớt capability nhưng không chặn escalation.

> Bộ "an toàn cơ bản": runAsNonRoot + allowPrivilegeEscalation:false + drop ALL + readOnlyRootFilesystem.`
},
{
  id: 'qz-ckad-066',
  topic: 'devops',
  q: '[Config & Security] Bạn chạy non-root nhưng app cần bind cổng 80 (quyền đặc quyền <1024). Thêm capability nào và bỏ gì?',
  options: ['add: [NET_ADMIN]', 'privileged: true', 'drop: [CHOWN]', 'drop: [ALL], add: [NET_BIND_SERVICE]'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{drop: [ALL]}} bỏ hết capability rồi chỉ thêm {{NET_BIND_SERVICE}} — đúng cái cần để bind cổng thấp, theo nguyên tắc least privilege.

### Vì sao các phương án khác sai
- **A:** {{NET_ADMIN}} là quyền quản trị mạng, quá rộng và không giúp bind cổng.
- **B:** {{privileged: true}} bỏ toàn bộ bảo vệ — phản tác dụng.
- **C:** {{drop: [CHOWN]}} chỉ bỏ một cap, không thêm quyền bind cổng.

> Mẫu an toàn: drop ALL rồi add đúng capability tối thiểu.`
},
{
  id: 'qz-ckad-067',
  topic: 'devops',
  q: '[Config & Security] Bạn muốn filesystem gốc của container CHỈ ĐỌC, nhưng app vẫn cần ghi vào /tmp. Cấu hình nào?',
  options: ['securityContext.readOnlyRootFilesystem: true + volume emptyDir mount vào /tmp', 'readOnlyRootFilesystem: false', 'mount /tmp từ hostPath', 'privileged: true'],
  answer: 0,
  explain: `**Đáp án đúng: A.** {{readOnlyRootFilesystem: true}} khoá toàn bộ root fs; rồi mount một {{emptyDir}} vào /tmp để có chỗ ghi riêng, tách khỏi root bất biến.

### Vì sao các phương án khác sai
- **B:** tắt readOnly — mất luôn lớp bảo vệ.
- **C:** hostPath ghi lên đĩa node, rủi ro và không "sạch".
- **D:** privileged phá mọi giới hạn.

> emptyDir mount /tmp là cách kinh điển để chạy với root fs read-only.`
},
{
  id: 'qz-ckad-068',
  topic: 'devops',
  multi: true,
  q: '[Config & Security] Về RBAC cơ bản, hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['RoleBinding gắn quyền (Role hoặc ClusterRole) cho subject trong MỘT namespace', 'Role chỉ áp dụng ở phạm vi toàn cluster', 'ServiceAccount không thể là subject của RoleBinding', 'ClusterRoleBinding gắn ClusterRole cho subject trên TOÀN cluster'],
  answer: [0, 3],
  explain: `**Đáp án đúng: A, D.** RoleBinding gắn Role/ClusterRole cho user/SA/group trong một namespace; ClusterRoleBinding gắn ClusterRole trên toàn cluster. Subject (chủ thể) có thể là ServiceAccount.

### Vì sao các phương án khác sai
- **B:** Role là namespace-scoped; ClusterRole mới là cluster-wide.
- **C:** ServiceAccount là subject hợp lệ (rất hay dùng cho pod).

> Role+RoleBinding = trong namespace; ClusterRole+ClusterRoleBinding = toàn cluster.`
},
{
  id: 'qz-ckad-069',
  topic: 'devops',
  q: '[Config & Security] Tạo một ServiceAccount tên api trong namespace team-a. Lệnh nào?',
  options: ['kubectl create serviceaccount api/team-a', 'kubectl get serviceaccounts api -n team-a', 'kubectl create serviceaccount api -n team-a', 'kubectl run api --serviceaccount'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{kubectl create serviceaccount api -n team-a}} (viết tắt {{create sa}}) tạo SA mới trong namespace chỉ định.

### Vì sao các phương án khác sai
- **A:** cú pháp {{api/team-a}} sai; namespace phải truyền bằng {{ -n }}.
- **B:** {{kubectl get}} chỉ xem, không tạo.
- **D:** {{kubectl run}} tạo Pod, {{--serviceaccount}} chỉ gán SA có sẵn chứ không tạo SA.

> Nhớ: {{ -n team-a }} đặt namespace cho lệnh.`
},
{
  id: 'qz-ckad-070',
  topic: 'devops',
  q: '[Config & Security] Tạo Secret chứa credential để pull image từ private registry. Loại Secret và lệnh nào?',
  options: ['kubectl create secret generic regcred --from-literal=...', 'kubectl create secret docker-registry regcred --docker-server=... --docker-username=... --docker-password=...', 'kubectl create secret tls regcred --cert=... --key=...', 'kubectl create secret registry regcred ...'],
  answer: 1,
  explain: `**Đáp án đúng: B.** {{kubectl create secret docker-registry}} tạo Secret type {{kubernetes.io/dockerconfigjson}} đúng định dạng cho imagePullSecrets.

### Vì sao các phương án khác sai
- **A:** generic tạo Secret thường, không đúng type cho registry.
- **C:** {{tls}} dành cho chứng chỉ TLS, không phải registry.
- **D:** không có type {{registry}}.

> Dùng: pod.spec.imagePullSecrets trỏ tới regcred.`
},
{
  id: 'qz-ckad-071',
  topic: 'devops',
  q: '[Config & Security] Bạn muốn TẮT tự động mount token cho MỌI pod dùng ServiceAccount default trong namespace. Đặt ở đâu?',
  options: ['automount: false trên Node', 'chỉ đặt trên từng container', 'không thể tắt ở cấp ServiceAccount', 'automountServiceAccountToken: false trên ServiceAccount'],
  answer: 3,
  explain: `**Đáp án đúng: D.** Đặt {{automountServiceAccountToken: false}} trên ServiceAccount áp dụng cho mọi pod dùng SA đó (trừ khi pod tự override). Giảm bề mặt tấn công từ token SA.

### Vì sao các phương án khác sai
- **A:** {{automount}} trên Node không tồn tại.
- **B:** đặt trên container không phải cách chuẩn (field này ở cấp pod/SA).
- **C:** hoàn toàn tắt được ở cấp SA.

> Có thể override ở cấp Pod: cùng tên field {{automountServiceAccountToken}}.`
},
{
  id: 'qz-ckad-072',
  topic: 'devops',
  q: '[Config & Security] Đặt {{immutable: true}} cho một Secret. Hệ quả là gì?',
  options: ['Không sửa được Secret; muốn đổi phải tạo Secret mới và cập nhật pod', 'Secret tự động mã hoá nội dung', 'Pod không mount được Secret', 'Secret bị xoá khi pod bị xoá'],
  answer: 0,
  explain: `**Đáp án đúng: A.** Secret immutable không cho update; muốn đổi giá trị phải tạo Secret mới (tên khác) rồi trỏ pod sang nó. Bù lại, kubelet không phải theo dõi thay đổi nên nhẹ hơn.

### Vì sao các phương án khác sai
- **B:** immutable không liên quan mã hoá (mã hoá là etcd encryption).
- **C:** pod vẫn mount bình thường.
- **D:** vòng đời Secret độc lập với pod.

> Cùng cơ chế immutable với ConfigMap: đổi = tạo mới.`
},
);
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-ckad-073',
  topic: 'devops',
  q: '[App Networking] Bạn muốn Service KHÔNG có IP ảo (VIP), để DNS trả về IP của TỪNG pod. Cấu hình nào?',
  options: ['spec.type: ExternalName', 'spec.clusterIP: 0.0.0.0', 'spec.clusterIP: None', 'spec.selector: null'],
  answer: 2,
  explain: `**Đáp án đúng: C.** {{clusterIP: None}} tạo headless service: không cấp VIP, DNS trả thẳng danh sách IP pod. Hợp cho client tự cân bằng hoặc StatefulSet.

### Vì sao các phương án khác sai
- **A:** {{ExternalName}} là CNAME tới tên ngoài, không phải headless.
- **B:** {{0.0.0.0}} không phải cách khai báo headless.
- **D:** {{selector: null}} làm service không chọn pod nào, không tạo headless.

> Headless = clusterIP: None; hay dùng với StatefulSet.`
},
{
  id: 'qz-ckad-074',
  topic: 'devops',
  multi: true,
  q: '[App Networking] Về Service và container, hai phát biểu nào ĐÚNG? (Chọn 2)',
  options: ['port phải luôn bằng targetPort', 'targetPort là cổng NodePort', 'port là cổng Service nhận, targetPort là cổng trên container', 'targetPort có thể là TÊN cổng đã khai báo trong container'],
  answer: [2, 3],
  explain: `**Đáp án đúng: C, D.** {{port}} là cổng Service mở ra; {{targetPort}} là cổng (số hoặc TÊN) mà container thực sự lắng nghe. Dùng tên cổng giúp đổi số cổng mà không sửa Service.

### Vì sao các phương án khác sai
- **A:** port và targetPort có thể khác nhau (ví dụ 80 → 8080).
- **B:** targetPort không phải NodePort; NodePort là cổng mở trên node (30000–32767).

> port (Service) → targetPort (container) → nodePort (node).`
},
{
  id: 'qz-ckad-075',
  topic: 'devops',
  q: '[App Networking] Bạn cần Ingress route theo HOST: app.example.com về service web, các host khác dùng default. Khai báo nào đúng?',
  options: ['spec.rules: [{host: "*", http: {paths: [...]}}]', 'spec.rules: [{host: app.example.com, http: {paths: [...]}}]', 'spec.defaultBackend: web', 'spec.tls: [{hosts: [app.example.com]}]'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Trong {{spec.rules}}, mỗi rule có {{host}} và {{http.paths}}. Khai báo {{host: app.example.com}} để ingress-nginx route đúng theo Host header.

### Vì sao các phương án khác sai
- **A:** {{host: "*"}} bắt mọi host, không route riêng cho app.example.com.
- **C:** {{defaultBackend}} là rule dự phòng, không phải route theo host.
- **D:** {{tls}} chỉ cấu hình chứng chỉ HTTPS, không định tuyến.

> Host-based routing = nhiều rule, mỗi rule một host.`
},
{
  id: 'qz-ckad-076',
  topic: 'devops',
  q: '[App Networking] Bạn muốn Ingress CHỈ khớp đúng đường dẫn /api/status, KHÔNG khớp /api/status/xyz. pathType nào?',
  options: ['Prefix', 'ImplementationSpecific', 'Regex', 'Exact'],
  answer: 3,
  explain: `**Đáp án đúng: D.** {{pathType: Exact}} khớp chính xác tuyệt đối; {{/api/status}} không trỏ tới {{/api/status/xyz}}.

### Vì sao các phương án khác sai
- **A:** {{Prefix}} khớp theo tiền tố, nên /api/status/xyz vẫn trúng.
- **B:** {{ImplementationSpecific}} tuỳ ingress controller, không đảm bảo.
- **C:** {{Regex}} không phải pathType hợp lệ (dùng ImplementationSpecific + regex).

> pathType hợp lệ: Exact, Prefix, ImplementationSpecific.`
},
{
  id: 'qz-ckad-077',
  topic: 'devops',
  q: '[App Networking] Bạn muốn CHẶN MỌI ingress tới TẤT CẢ pod trong namespace (default deny). Cấu hình NetworkPolicy nào?',
  options: ['podSelector: {} + policyTypes: [Ingress], không có ingress.from', 'podSelector rỗng + có ingress.from rỗng', 'policyTypes: [Egress]', 'namespaceSelector: {}'],
  answer: 0,
  explain: `**Đáp án đúng: A.** podSelector rỗng chọn mọi pod; {{policyTypes: [Ingress]}} bật chế độ chặn ingress; vì không có rule {{from}} nào nên mọi ingress bị từ chối.

~~~yaml
spec:
  podSelector: {}
  policyTypes:
    - Ingress
~~~

### Vì sao các phương án khác sai
- **B:** nếu có {{ingress.from}} rỗng thì... thực tế from rỗng không hợp lệ; chặn all là do THIẾU from.
- **C:** {{Egress}} chặn chiều đi ra, không chặn vào.
- **D:** {{namespaceSelector}} chỉ là bộ chọn namespace, không phải policy hoàn chỉnh.

> Mẫu "deny all ingress": podSelector {} + policyTypes Ingress, không from.`
},
{
  id: 'qz-ckad-078',
  topic: 'devops',
  multi: true,
  q: '[App Networking] Bạn cho phép pod backend nhận traffic TỪ pod frontend CÙNG namespace. Hai khai báo nào đúng? (Chọn 2)',
  options: ['ingress.from có podSelector match frontend', 'policyTypes chứa Ingress', 'ingress.from dùng namespaceSelector match tất cả namespace', 'policyTypes chứa Egress'],
  answer: [0, 1],
  explain: `**Đáp án đúng: A, B.** {{policyTypes: [Ingress]}} bật chặn ingress; {{ingress.from}} với {{podSelector}} match label của frontend giới hạn nguồn vào. Vì cùng namespace, chỉ cần podSelector.

### Vì sao các phương án khác sai
- **C:** {{namespaceSelector}} match mọi namespace → mở rộng quá "cùng namespace".
- **D:** {{Egress}} là chiều ra, không liên quan cho phép vào.

> Cùng namespace: podSelector. Khác namespace: thêm namespaceSelector (kết hợp = AND).`
},
{
  id: 'qz-ckad-079',
  topic: 'devops',
  q: '[App Networking] Bạn dùng storageClass local-path, tạo PVC 1Gi rồi mount vào pod. Thành phần nào tạo volume thực tế?',
  options: ['phải tạo PV thủ công trước', 'hostPath khai báo trực tiếp trong pod', 'PVC yêu cầu storageClass local-path; PV được cấp phát ĐỘNG (dynamic provisioning)', 'emptyDir'],
  answer: 2,
  explain: `**Đáp án đúng: C.** Với storageClass local-path (mặc định ở kind), PVC sẽ kích hoạt dynamic provisioning: provisioner tự tạo PersistentVolume khớp yêu cầu, pod mount qua PVC.

### Vì sao các phương án khác sai
- **A:** không cần tạo PV tay khi có provisioner.
- **B:** hostPath bỏ qua PVC/PV, không "sạch" và vướng bảo mật.
- **D:** emptyDir không bền, mất khi pod xoá.

> Luồng: PVC → (provisioner) → PV → mount vào pod.`
},
{
  id: 'qz-ckad-080',
  topic: 'devops',
  q: '[App Networking] Một operator đã cài CRD tên "widgets.example.com". Liệt kê các custom resource widget. Lệnh nào?',
  options: ['kubectl get crd widgets', 'kubectl get widgets.example.com', 'kubectl get customresources', 'kubectl api-resources --namespaced=false'],
  answer: 1,
  explain: `**Đáp án đúng: B.** Sau khi CRD tồn tại, resource "widgets" (số nhiều trong CRD) dùng được như resource thường: {{kubectl get widgets.example.com}} (hoặc {{kubectl get widgets}}).

### Vì sao các phương án khác sai
- **A:** {{kubectl get crd widgets}} chỉ xem định nghĩa CRD, không liệt kê instance.
- **C:** {{customresources}} không phải resource type.
- **D:** {{api-resources --namespaced=false}} chỉ liệt kê resource non-namespaced, không lấy danh sách widget.

> Tên resource = spec.names.plural trong CRD; dùng kubectl get/describe/edit như thường.`
},
);