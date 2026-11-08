/* Multiple-choice bank (exam pool ops) - owner: Claude quiz task. Format: see AGENTS.md section 4 */
(window.QUIZ = window.QUIZ || []).push(
/* ===================== DEVOPS ===================== */
{
  id: 'qz-devops-009', topic: 'devops',
  q: 'Sau khi deploy bản mới, Pod đứng ở trạng thái {{ImagePullBackOff}} và không bao giờ chạy. Nguyên nhân khả dĩ nhất là gì?',
  options: [
    'Kubelet không kéo được image: sai tên/tag image, tag chưa được push, hoặc registry private mà Pod thiếu imagePullSecrets/quyền đọc registry',
    'Ứng dụng Java bị lỗi khi khởi động nên Kubernetes thử kéo lại image',
    'Liveness probe thất bại nên Kubernetes xoá image khỏi node',
    'Node hết CPU nên scheduler không đặt được Pod'
  ],
  answer: 0,
  explain: `**Tóm tắt:** {{ImagePullBackOff}} nghĩa là container **chưa bao giờ được tạo** vì kubelet không kéo được image; Kubernetes lùi thời gian thử lại (back-off) theo cấp số nhân.

### Cách điều tra
~~~bash
kubectl describe pod my-api-7c9f   # xem phần Events: "manifest unknown", "unauthorized", "not found"
kubectl get pod my-api-7c9f -o jsonpath='{.spec.containers[*].image}'
~~~
- {{manifest unknown}} / {{not found}}: tag sai hoặc pipeline chưa push xong.
- {{unauthorized}} / {{denied}}: registry private, thiếu {{imagePullSecrets}} hoặc node role (ví dụ ECR) không có quyền pull.

### Vì sao các phương án còn lại sai
- **Ứng dụng Java lỗi khi khởi động**: khi đó image đã kéo xong, container chạy rồi chết, trạng thái sẽ là {{CrashLoopBackOff}} chứ không phải ImagePullBackOff.
- **Liveness probe thất bại**: probe chỉ khiến kubelet restart container, không bao giờ xoá image và không gây lỗi kéo image.
- **Node hết CPU**: scheduler không đặt được Pod thì Pod ở trạng thái {{Pending}} với event {{FailedScheduling}}, chưa đến bước kéo image.

> Senior tip: deploy theo **digest** hoặc tag bất biến (git SHA), không dùng {{latest}}. Pipeline chỉ cập nhật manifest **sau khi** push image thành công, nhờ vậy loại lỗi "tag chưa tồn tại" gần như biến mất.`
},
{
  id: 'qz-devops-010', topic: 'devops',
  q: 'Dockerfile dùng {{CMD java -jar app.jar}} (shell form). Mỗi lần rolling update, Pod mất đúng 30 giây mới tắt, exit code 137 và request đang xử lý bị cắt. Nguyên nhân gốc là gì?',
  options: [
    'Java không hỗ trợ SIGTERM nên Kubernetes luôn phải dùng SIGKILL',
    'Shell form chạy {{/bin/sh -c}} làm PID 1; shell không chuyển SIGTERM cho tiến trình Java, nên hết terminationGracePeriodSeconds (mặc định 30s) kubelet gửi SIGKILL',
    'Memory limit quá thấp nên container bị OOMKilled khi tắt',
    'Readiness probe sai đường dẫn nên Kubernetes kill Pod sau 30 giây'
  ],
  answer: 1,
  explain: `**Tóm tắt:** với shell form, PID 1 là {{sh}} chứ không phải JVM. SIGTERM gửi tới PID 1 không đến được Java, JVM không chạy shutdown hook, và sau 30 giây kubelet gửi SIGKILL (137 = 128 + 9).

### Cơ chế
1. Kubernetes xoá Pod và gửi **SIGTERM** tới PID 1 của container.
2. {{/bin/sh -c "java -jar app.jar"}}: nhiều shell (dash, ash) không forward tín hiệu cho tiến trình con.
3. Hết {{terminationGracePeriodSeconds}} kubelet gửi **SIGKILL**: không graceful shutdown, connection pool không đóng, request dở dang bị cắt.

~~~text
# Sai (shell form)            # Đúng (exec form)
CMD java -jar app.jar         ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~
Nếu buộc phải dùng script khởi động, dòng cuối phải là {{exec java ...}} để JVM thay thế shell làm PID 1.

### Vì sao các phương án còn lại sai
- **Java không hỗ trợ SIGTERM**: sai, JVM bắt SIGTERM và chạy shutdown hook; Spring Boot dựa vào đó để graceful shutdown.
- **OOMKilled**: OOM cũng ra 137, nhưng không xảy ra đều đặn đúng 30 giây sau lệnh xoá; {{kubectl describe}} sẽ ghi {{Reason: OOMKilled}}.
- **Readiness probe sai**: readiness thất bại chỉ gỡ Pod khỏi Service, không bao giờ kill container.

> Senior tip: đọc {{Last State}} trong {{kubectl describe pod}}: Reason {{Error}} + exit 137 + thời gian tắt bằng đúng grace period là dấu hiệu kinh điển của tín hiệu không tới JVM.`
},
{
  id: 'qz-devops-011', topic: 'devops',
  q: 'Bạn đã push lên nhánh {{main}} dùng chung một commit gây lỗi, và đồng nghiệp đã pull về. Cách hoàn tác an toàn nhất là gì?',
  options: [
    'Chạy {{git reset --hard HEAD~1}} rồi {{git push --force}} để xoá commit khỏi lịch sử',
    'Xoá nhánh main trên remote rồi push lại bản trước đó',
    'Chạy {{git revert <sha>}} để tạo commit mới đảo ngược thay đổi, rồi push bình thường',
    'Dùng {{git commit --amend}} để sửa commit lỗi rồi push'
  ],
  answer: 2,
  explain: `**Tóm tắt:** với lịch sử **đã chia sẻ**, đừng viết lại lịch sử. {{git revert}} tạo một commit mới có nội dung ngược với commit lỗi, nên lịch sử chỉ đi tiếp và mọi người pull về bình thường.

### Vì sao revert an toàn
~~~text
A -- B -- C(lỗi)                 trước
A -- B -- C(lỗi) -- C'(revert)   sau git revert C
~~~
Máy đồng nghiệp đang có C vẫn khớp với remote; lần pull tới chỉ nhận thêm C'.

### Vì sao các phương án còn lại sai
- **reset --hard + push --force**: viết lại lịch sử trên remote; ai đã pull C sẽ bị lệch, lần push sau có thể đưa C trở lại hoặc ghi đè mất commit của người khác. Nhánh main thường còn bị branch protection chặn force push.
- **Xoá nhánh main rồi push lại**: phá hỏng mọi PR và cấu hình protection, bản chất vẫn là viết lại lịch sử.
- **commit --amend**: cũng tạo commit mới thay thế C (đổi SHA), nên vẫn phải force push, cùng vấn đề như reset.

> Senior tip: nếu cần revert một merge commit thì dùng {{git revert -m 1 <merge-sha>}}. Muốn đưa lại tính năng đó sau khi sửa, bạn phải **revert cái revert**, nếu không Git coi các commit cũ đã được merge rồi.`
},
{
  id: 'qz-devops-012', topic: 'devops', multi: true,
  q: 'Mỗi lần rolling update một Deployment Spring Boot, client nhận vài chục lỗi 502/connection reset trong vài giây. Hai biện pháp nào xử lý đúng gốc vấn đề? (Chọn 2)',
  options: [
    'Tăng số replicas lên 10 để lỗi chia ra nhiều Pod',
    'Có readiness probe phản ánh đúng việc app đã sẵn sàng nhận request, để Pod mới chỉ nhận traffic khi đã khởi động xong',
    'Đặt {{maxUnavailable: 100%}} để rollout nhanh hơn',
    'Thêm preStop hook chờ vài giây và bật graceful shutdown ({{server.shutdown=graceful}}) để Pod cũ xử lý xong request trước khi tắt',
    'Tắt liveness probe trong lúc deploy'
  ],
  answer: [1, 3],
  explain: `**Tóm tắt:** lỗi lúc rollout đến từ hai phía: Pod **mới** nhận traffic quá sớm (thiếu readiness) và Pod **cũ** tắt trong khi load balancer vẫn còn gửi request tới (thiếu preStop + graceful shutdown).

### Cơ chế phía Pod cũ
Khi Pod bị xoá, hai việc diễn ra **song song**: kubelet gửi SIGTERM, và control plane gỡ Pod khỏi EndpointSlice, rồi kube-proxy/Ingress cập nhật. Việc gỡ mất vài giây, nên nếu app tắt ngay thì request đến trong khoảng đó bị reset. {{preStop}} chờ ~5–10 giây giữ app sống cho tới khi endpoint đã được gỡ hẳn; sau đó graceful shutdown (mặc định bật từ Spring Boot 3.4) chờ request đang chạy hoàn tất.

### Cơ chế phía Pod mới
Không có readiness probe thì Pod được coi là Ready ngay khi container start, trong khi Spring còn đang khởi tạo context → request rơi vào app chưa sẵn sàng. Dùng {{/actuator/health/readiness}}.

### Vì sao các phương án còn lại sai
- **Tăng replicas**: chỉ làm tỉ lệ lỗi nhỏ đi, mỗi Pod bị thay vẫn gây lỗi.
- **maxUnavailable 100%**: tắt hết Pod cũ cùng lúc, gây downtime nặng hơn.
- **Tắt liveness**: liveness không liên quan tới việc route traffic, tắt nó chỉ làm mất khả năng tự phục hồi.

> Senior tip: đảm bảo {{terminationGracePeriodSeconds}} lớn hơn tổng thời gian preStop + {{spring.lifecycle.timeout-per-shutdown-phase}}, nếu không SIGKILL sẽ đến trước khi app xong việc.`
},
{
  id: 'qz-devops-013', topic: 'devops',
  q: 'Server Linux báo {{df -h}} đầy 100% phân vùng /var, nhưng {{du -sh /var}} chỉ thấy 20 GB trên 100 GB. Bạn vừa xoá một file log 80 GB bằng {{rm}}. Chuyện gì đang xảy ra?',
  options: [
    'Hệ thống file bị hỏng, cần chạy fsck ngay',
    'du đếm sai vì không có quyền root',
    'Linux cần reboot mới thu hồi được mọi file đã xoá',
    'Một tiến trình (thường là chính app ghi log) vẫn đang mở file đã xoá; inode chưa được giải phóng cho tới khi file descriptor đóng'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{rm}} chỉ xoá **tên** file (directory entry). Dữ liệu còn chiếm đĩa chừng nào còn tiến trình giữ file descriptor mở; {{du}} duyệt theo tên nên không thấy, còn {{df}} đọc từ filesystem nên vẫn thấy đầy.

### Cách tìm và xử lý
~~~bash
sudo lsof +L1 | grep deleted        # liệt kê file đã xoá nhưng còn được mở
# java  1234 app  12w  REG ... /var/log/app/app.log (deleted)
sudo truncate -s 0 /proc/1234/fd/12 # giải phóng dung lượng ngay, không cần restart
~~~
Hoặc restart tiến trình để nó đóng file.

### Vì sao các phương án còn lại sai
- **Filesystem hỏng**: đây là hành vi bình thường của Unix, fsck không cần và không giải quyết.
- **du thiếu quyền**: thiếu quyền thì du in lỗi "Permission denied", và chênh lệch 80 GB khớp đúng file vừa xoá.
- **Phải reboot**: reboot có tác dụng chỉ vì nó đóng mọi tiến trình; chỉ cần đóng đúng tiến trình giữ file là đủ.

> Senior tip: đừng xoá log đang được ghi; dùng logrotate với {{copytruncate}} hoặc để app tự rotate (Logback {{RollingFileAppender}}). Trong container, ghi log ra stdout để runtime quản lý.`
},
{
  id: 'qz-devops-014', topic: 'devops',
  q: 'Pod của Deployment {{orders}} đều Running và Ready, nhưng gọi {{http://orders:8080}} từ Pod khác bị connection refused/timeout. {{kubectl get endpointslices -l kubernetes.io/service-name=orders}} không có địa chỉ nào. Nguyên nhân khả dĩ nhất?',
  options: [
    'Selector của Service không khớp label của Pod (ví dụ {{app: order}} so với {{app: orders}}), nên Service không có endpoint',
    'CoreDNS bị lỗi nên tên orders không phân giải được',
    'Pod thiếu liveness probe nên không được thêm vào Service',
    'Service type ClusterIP không cho phép Pod khác gọi tới, phải đổi sang NodePort'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Service chọn Pod bằng **label selector**. Endpoint rỗng trong khi Pod Ready gần như chắc chắn do selector không khớp label (hoặc khác namespace).

### Cách kiểm tra
~~~bash
kubectl get svc orders -o jsonpath='{.spec.selector}'
kubectl get pods --show-labels | grep orders
kubectl get endpoints orders      # lệnh cũ, vẫn chạy được
~~~
Ngoài ra kiểm tra {{targetPort}} có đúng cổng app đang listen không (sai targetPort thì có endpoint nhưng bị refused).

### Vì sao các phương án còn lại sai
- **CoreDNS lỗi**: DNS lỗi sẽ báo "unknown host", không phải refused/timeout; và nó không làm EndpointSlice rỗng.
- **Thiếu liveness**: điều kiện vào endpoint là **readiness**, không phải liveness; Pod đã Ready rồi.
- **ClusterIP không cho gọi**: ClusterIP chính là kiểu dành cho gọi nội bộ trong cluster; NodePort dùng để mở ra ngoài node.

> Senior tip: dùng chung bộ label chuẩn ({{app.kubernetes.io/name}}, {{app.kubernetes.io/instance}}) qua Helm/Kustomize thay vì gõ tay từng manifest; lỗi lệch label là loại lỗi rất hay gặp khi refactor chart.`
},
{
  id: 'qz-devops-015', topic: 'devops',
  q: 'Service Java trên Kubernetes có {{limits.cpu: 1}}. CPU trung bình chỉ 40% nhưng p99 latency thỉnh thoảng nhảy lên vài trăm ms, nhất là khi GC chạy. Giải thích nào hợp lý nhất?',
  options: [
    'Heap quá lớn nên GC luôn chậm, cần giảm -Xmx',
    'CPU limit được thực thi bằng CFS quota theo chu kỳ 100ms; khi nhiều thread (GC, request) cùng chạy, container dùng hết quota sớm và bị throttle tới hết chu kỳ',
    'CPU request quá cao nên scheduler đặt Pod vào node chậm',
    'Kubernetes giảm xung nhịp CPU của node khi Pod dùng dưới 50% CPU'
  ],
  answer: 1,
  explain: `**Tóm tắt:** CPU trung bình thấp không có nghĩa là không bị throttle. Limit 1 CPU = 100ms CPU time mỗi chu kỳ 100ms; 8 thread GC/request chạy song song có thể tiêu hết quota trong ~12ms rồi bị **đóng băng** ~88ms còn lại.

### Cách xác nhận
Xem metric cAdvisor {{container_cpu_cfs_throttled_periods_total}} so với {{container_cpu_cfs_periods_total}}. Tỉ lệ throttle > 5–10% thường đủ gây latency spike.

### Cách xử lý
- Bỏ CPU limit (giữ CPU **request** để scheduler và chia sẻ công bằng), hoặc nâng limit lên.
- JVM thấy số CPU theo limit: {{availableProcessors()}} = 1 làm JVM chọn SerialGC và pool nhỏ; có thể đặt {{-XX:ActiveProcessorCount}} phù hợp.

### Vì sao các phương án còn lại sai
- **Giảm -Xmx**: heap nhỏ hơn làm GC chạy **thường hơn**; vấn đề ở đây là bị throttle, không phải kích thước heap.
- **CPU request cao**: request chỉ ảnh hưởng việc xếp Pod và chia sẻ khi tranh chấp, không làm node "chậm".
- **Kubernetes giảm xung nhịp**: Kubernetes không điều khiển tần số CPU.

> Senior tip: nhiều đội chạy service latency-sensitive với request CPU nhưng không có limit CPU (vẫn giữ memory limit). Hãy đo throttling trước khi quyết định; đừng dựa vào CPU trung bình.`
},
{
  id: 'qz-devops-016', topic: 'devops',
  q: 'Pipeline GitHub Actions cần deploy lên AWS. Hiện access key của IAM user được lưu trong repository secrets. Cách làm được khuyến nghị hiện nay là gì?',
  options: [
    'Giữ access key nhưng xoay vòng thủ công mỗi 90 ngày',
    'Mã hoá access key bằng base64 trước khi lưu vào secrets',
    'Dùng OIDC: workflow có {{permissions: id-token: write}}, IAM role tin tưởng provider {{token.actions.githubusercontent.com}} với điều kiện {{sub}} giới hạn repo/nhánh, và assume role lấy credential tạm thời',
    'Dùng access key của root account vì có đủ quyền deploy'
  ],
  answer: 2,
  explain: `**Tóm tắt:** dùng **OIDC federation**: mỗi lần chạy, GitHub cấp một ID token ngắn hạn; AWS STS đổi nó lấy credential tạm (thường 1 giờ). Không còn secret dài hạn nào để lộ.

~~~yaml
permissions:
  id-token: write      # cho phép job xin OIDC token
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/gha-deploy
      aws-region: ap-southeast-1
~~~
Trust policy của role phải có điều kiện {{token.actions.githubusercontent.com:sub}} như {{repo:my-org/orders:ref:refs/heads/main}}, nếu không bất kỳ repo nào cũng assume được.

### Vì sao các phương án còn lại sai
- **Xoay key 90 ngày**: vẫn là credential dài hạn, lộ trong 90 ngày là đủ gây hại; cũng tốn công vận hành.
- **base64**: chỉ là encoding, ai cũng giải được; không thêm bảo mật.
- **Root access key**: vi phạm nguyên tắc cơ bản nhất của AWS; root không nên có access key.

> Senior tip: tách role theo môi trường và dùng GitHub Environments ({{sub}} dạng {{repo:org/repo:environment:prod}}) kèm required reviewers, nhờ vậy chỉ job đã được duyệt mới assume được role production.`
},
{
  id: 'qz-devops-017', topic: 'devops', multi: true,
  q: 'Image Spring Boot hiện nặng 900 MB vì build trên {{maven:3-eclipse-temurin-21}} và chạy luôn image đó. Hai thay đổi nào giảm kích thước image hiệu quả? (Chọn 2)',
  options: [
    'Multi-stage build: stage 1 dùng image Maven/JDK để build, stage 2 chỉ COPY file jar (hoặc các layer đã tách) sang image runtime',
    'Thêm {{RUN apt-get clean}} ở một lệnh RUN riêng sau khi đã cài package',
    'Dùng base image runtime gọn: JRE thay vì JDK đầy đủ (ví dụ {{eclipse-temurin:21-jre}}), distroless, hoặc runtime tạo bằng jlink',
    'Dùng tag {{latest}} cho base image để luôn có bản nhỏ nhất',
    'Tăng bộ nhớ cho Docker daemon khi build'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** phần lớn dung lượng là Maven, JDK, cache {{.m2}} và source không cần lúc chạy. Multi-stage bỏ toàn bộ công cụ build; base runtime gọn cắt tiếp phần JDK thừa.

~~~text
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN mvn -q package -DskipTests

FROM eclipse-temurin:21-jre          # chỉ JRE
COPY --from=build /src/target/app.jar /app/app.jar
USER 1000                            # không chạy bằng root
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
~~~

### Vì sao các phương án còn lại sai
- **apt-get clean ở RUN riêng**: image là chồng các layer bất biến; file đã nằm trong layer trước vẫn chiếm dung lượng. Muốn có tác dụng phải dọn trong **cùng** lệnh RUN đã cài.
- **Tag latest**: không liên quan kích thước, lại làm build không tái lập được.
- **Tăng bộ nhớ daemon**: ảnh hưởng tốc độ/khả năng build, không ảnh hưởng nội dung image.

> Senior tip: image nhỏ không chỉ để pull nhanh khi scale; ít package hơn nghĩa là ít CVE hơn trong báo cáo scan. Kết hợp layered jar của Spring Boot để layer dependency được cache, chỉ layer code thay đổi mỗi lần deploy.`
},
{
  id: 'qz-devops-018', topic: 'devops',
  q: 'Cluster dùng GitOps (Argo CD auto-sync, bật self-heal). Bản mới lỗi, on-call chạy {{kubectl rollout undo deployment/orders}}; vài phút sau bản lỗi quay lại. Cách rollback đúng trong mô hình này là gì?',
  options: [
    'Tắt Argo CD vĩnh viễn để kubectl được ưu tiên',
    'Chạy {{kubectl rollout undo}} lặp lại mỗi phút bằng cron',
    'Xoá Deployment để Argo CD tạo lại từ đầu',
    'Revert commit thay đổi image tag trong repo cấu hình (nguồn sự thật), để Argo CD đồng bộ cluster về phiên bản cũ'
  ],
  answer: 3,
  explain: `**Tóm tắt:** trong GitOps, **Git là nguồn sự thật**. Thay đổi trực tiếp trên cluster là drift; với self-heal, Argo CD đưa cluster về đúng trạng thái trong Git, tức là bản lỗi. Rollback phải làm **trên Git**.

### Quy trình đúng
1. Revert commit nâng image tag (hoặc chỉnh lại tag cũ) trong repo cấu hình, qua PR nhanh hoặc quy trình khẩn cấp đã thống nhất.
2. Argo CD phát hiện thay đổi, sync về bản cũ; lịch sử Git ghi lại ai rollback, khi nào, vì sao.
3. Khi khẩn cấp có thể tạm tắt auto-sync của **riêng app đó** rồi rollback bằng Argo CD, nhưng phải đưa Git về khớp ngay sau đó.

### Vì sao các phương án còn lại sai
- **Tắt Argo CD vĩnh viễn**: bỏ luôn lợi ích GitOps (audit, tái lập, chống drift) chỉ vì một sự cố.
- **Cron rollout undo**: đánh nhau với controller, trạng thái dao động liên tục.
- **Xoá Deployment**: Argo CD tạo lại đúng bản trong Git (bản lỗi), lại còn gây downtime.

> Senior tip: viết runbook rollback cho GitOps trước khi cần đến nó. Nhiều đội dùng Argo Rollouts với canary + analysis để tự động abort khi metric xấu, giảm hẳn số lần phải rollback tay.`
},
{
  id: 'qz-devops-019', topic: 'devops',
  q: 'Một bạn trong team nói: "Mật khẩu DB để trong Kubernetes Secret là an toàn vì đã được mã hoá." Phát biểu nào đúng nhất?',
  options: [
    'Sai: Secret mặc định chỉ được base64 encode; cần bật encryption at rest cho etcd (ví dụ KMS provider), giới hạn RBAC đọc Secret, hoặc dùng secret manager bên ngoài',
    'Đúng: Secret luôn được mã hoá AES bằng khoá riêng của từng namespace',
    'Đúng: chỉ cluster-admin mới đọc được Secret, các Pod không thể đọc',
    'Sai: Secret luôn lưu plain text trên đĩa của mọi worker node nên không bao giờ nên dùng'
  ],
  answer: 0,
  explain: `**Tóm tắt:** {{data}} của Secret chỉ là **base64** (encoding, không phải mã hoá). Mức an toàn thực tế phụ thuộc cấu hình cluster: encryption at rest cho etcd, RBAC và cách Pod dùng Secret.

### Những điểm cần làm
- Bật {{EncryptionConfiguration}} (tốt nhất là KMS provider; EKS hỗ trợ envelope encryption bằng AWS KMS).
- RBAC: hạn chế {{get/list/watch}} trên {{secrets}}. Lưu ý: ai được **tạo Pod** trong namespace thì có thể mount Secret của namespace đó để đọc.
- Hoặc giữ secret ở AWS Secrets Manager/Vault và đồng bộ bằng External Secrets Operator / CSI driver.

### Vì sao các phương án còn lại sai
- **Luôn mã hoá theo namespace**: không có cơ chế mặc định như vậy.
- **Chỉ cluster-admin đọc được, Pod không đọc**: Pod đọc được Secret (mục đích của Secret là để Pod dùng), và mọi subject có RBAC phù hợp đều đọc được.
- **Luôn plain text trên đĩa mọi node**: kubelet chỉ đưa Secret xuống node có Pod dùng nó và mount vào tmpfs (RAM); kết luận "không bao giờ nên dùng" cũng quá đà.

> Senior tip: kiểm tra cả các đường rò gián tiếp: Secret in ra log khi app khởi động, nằm trong Helm values commit lên Git, hoặc bị {{kubectl get secret -o yaml}} dán vào ticket.`
},
{
  id: 'qz-devops-020', topic: 'devops',
  q: 'Nhánh {{feature/payment}} đang được 3 người cùng push. Một người rebase nhánh đó lên main rồi {{push --force}}. Hậu quả là gì và nên làm thế nào?',
  options: [
    'Không sao, rebase chỉ đổi thứ tự commit trên máy cá nhân',
    'Rebase viết lại SHA của các commit đã chia sẻ; người khác bị lệch lịch sử và có thể mất commit. Với nhánh nhiều người dùng, hãy merge main vào nhánh (hoặc ít nhất dùng {{--force-with-lease}} và báo trước)',
    'Git tự động gộp commit của 3 người nên không mất gì',
    'Chỉ người rebase bị ảnh hưởng, người khác vẫn push bình thường'
  ],
  answer: 1,
  explain: `**Tóm tắt:** quy tắc vàng: **không rebase commit đã chia sẻ**. Rebase tạo commit mới với SHA mới; force push thay lịch sử remote, trong khi máy người khác vẫn giữ lịch sử cũ.

### Chuyện gì xảy ra
~~~text
remote trước:  M1 -- A -- B        (B của đồng nghiệp đã push)
bạn rebase trên bản local chỉ có A:  M1 -- M2 -- A'
push --force:  remote mất B
~~~
Đồng nghiệp pull về gặp lịch sử phân kỳ; nếu họ force push lại thì commit của bạn mất.

### Nên làm
- Nhánh dùng chung: {{git merge main}} vào nhánh, chấp nhận merge commit.
- Nếu buộc phải force push: {{git push --force-with-lease}} từ chối khi remote có commit mà bạn chưa thấy, và báo team trước.

### Vì sao các phương án còn lại sai
- **Chỉ đổi thứ tự trên máy cá nhân**: đúng trước khi push, nhưng force push đã đưa thay đổi lên remote.
- **Git tự gộp**: force push ghi đè, không gộp gì cả.
- **Chỉ người rebase bị ảnh hưởng**: chính người khác mới bị lệch lịch sử và bị từ chối push.

> Senior tip: rebase rất tốt để dọn nhánh **cá nhân** trước khi mở PR; trên nhánh dùng chung, bật branch protection chặn force push.`
},
{
  id: 'qz-devops-021', topic: 'devops', multi: true,
  q: 'Khi team platform nâng cấp node (drain từng node), service {{payment}} có 3 replica đôi khi mất trắng vài phút. Hai biện pháp nào phù hợp nhất? (Chọn 2)',
  options: [
    'Tạo PodDisruptionBudget (ví dụ {{minAvailable: 2}}) để eviction trong lúc drain không được đưa số Pod sẵn sàng xuống dưới ngưỡng',
    'Đặt {{restartPolicy: Never}} để Pod không bị khởi động lại',
    'Dùng topologySpreadConstraints hoặc podAntiAffinity để các replica không nằm chung một node/zone',
    'Tăng {{terminationGracePeriodSeconds}} lên 1 giờ',
    'Dùng Pod tạo trực tiếp (không qua Deployment) để không bị drain'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** mất trắng xảy ra vì (1) cả 3 replica có thể bị evict cùng lúc khi không có PDB, và (2) nhiều replica nằm chung một node nên drain một node là mất nhiều Pod. PDB giới hạn **disruption tự nguyện**; spread giảm thiệt hại từ một node/zone.

~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  minAvailable: 2
  selector: { matchLabels: { app: payment } }
~~~
{{kubectl drain}} dùng Eviction API, nên sẽ chờ khi việc evict làm vi phạm PDB.

### Vì sao các phương án còn lại sai
- **restartPolicy Never**: Deployment chỉ chấp nhận {{Always}}; và chuyện restart không liên quan tới drain.
- **Grace period 1 giờ**: chỉ làm drain treo lâu, không ngăn nhiều Pod bị tắt cùng lúc.
- **Pod trần**: drain sẽ từ chối (cần {{--force}}) và khi bị xoá thì Pod **không** được tạo lại, tệ hơn.

> Senior tip: đừng đặt PDB {{maxUnavailable: 0}} hoặc {{minAvailable}} bằng số replica; khi đó drain kẹt vĩnh viễn và team platform phải bỏ qua PDB, tức là mất tác dụng.`
},
{
  id: 'qz-devops-022', topic: 'devops',
  q: 'On-call nhận 200 alert mỗi tuần (CPU > 80%, heap > 70%, 1 Pod restart…), phần lớn không cần hành động và mọi người bắt đầu bỏ qua alert. Là tech lead, hướng thay đổi nào đúng nhất?',
  options: [
    'Tăng mọi ngưỡng lên 95% để giảm số alert',
    'Chuyển hết alert sang email để không làm phiền',
    'Định nghĩa SLO cho hành trình người dùng (availability, latency) và page dựa trên error budget burn rate; alert nguyên nhân như CPU/heap chuyển thành dashboard hoặc ticket không gấp',
    'Thuê thêm người để mỗi người nhận ít alert hơn'
  ],
  answer: 2,
  explain: `**Tóm tắt:** page theo **triệu chứng người dùng cảm nhận** (SLO), không theo nguyên nhân. Mỗi page phải cần hành động ngay; những thứ khác là ticket hoặc dashboard.

### Burn-rate alert hoạt động thế nào
SLO 99.9% trong 30 ngày cho error budget 0.1%. Burn rate = tốc độ tiêu budget so với mức đều:
| Burn rate | Cửa sổ | Ý nghĩa | Hành động |
|---|---|---|---|
| 14.4 | 1h (+5m xác nhận) | hết 2% budget/giờ | page |
| 6 | 6h (+30m) | hết 5% trong 6h | page |
| 1 | 3 ngày | tiêu đúng tốc độ | ticket |
Kiểu multi-window này (theo Google SRE Workbook) vừa bắt lỗi nhanh vừa ít báo nhầm.

### Vì sao các phương án còn lại sai
- **Nâng ngưỡng 95%**: vẫn là alert theo nguyên nhân; CPU 95% có thể vô hại, còn lỗi 500 hàng loạt khi CPU 30% vẫn lọt.
- **Chuyển sang email**: alert quan trọng cũng bị chìm, giờ còn không ai đọc.
- **Thuê thêm người**: chia nhỏ tiếng ồn, không giảm tiếng ồn; burnout vẫn đến.

> Senior tip: theo dõi tỉ lệ "page có hành động" mỗi tuần; mục tiêu thường là dưới 2 page mỗi ca trực. Mỗi alert nên kèm link runbook, nếu không viết được runbook cho nó thì có lẽ nó không đáng để page.`
},
{
  id: 'qz-devops-023', topic: 'devops',
  q: 'Pod chạy Spring Boot trên Java 17 với {{limits.memory: 2Gi}}, đặt trên node 64 GiB RAM. Biến {{JAVA_TOOL_OPTIONS}} không có cờ heap nào. Heap tối đa (MaxHeapSize) của JVM là bao nhiêu, và vì sao?',
  options: [
    'Khoảng 16 GiB: JVM thấy RAM của node (64 GiB) và lấy 1/4',
    'Khoảng 512 MiB: JVM đọc memory limit từ cgroup (2 GiB) và MaxRAMPercentage mặc định là 25%',
    'Đúng 2 GiB: JVM dùng toàn bộ memory limit cho heap',
    'Khoảng 1.5 GiB: JVM mặc định dành 75% limit cho heap và 25% cho phần ngoài heap'
  ],
  answer: 1,
  explain: `**Tóm tắt:** từ JDK 10 (và 8u191), JVM **nhận diện container**: nó đọc memory limit của cgroup (v1 hoặc v2) và coi đó là "RAM vật lý". Khi không có cờ heap, heap tối đa = {{MaxRAMPercentage}} (mặc định **25%**) × 2 GiB = **512 MiB**.

### Kiểm chứng ngay trong Pod
~~~bash
kubectl exec -it orders-7c9f -- java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|MaxRAMPercentage"
kubectl exec -it orders-7c9f -- java -Xlog:os+container=info -version   # in limit JVM đọc được
~~~
### Hệ quả
512 MiB heap trong khi Pod được 2 GiB: GC chạy dày, p99 xấu, còn khoảng 1.5 GiB nằm không. Cách đúng là đặt {{-XX:MaxRAMPercentage=70}} (khoảng 65–75%) để heap **tự co giãn theo limit**, chừa phần còn lại cho metaspace, thread stack, code cache, direct buffer. Tránh hard-code {{-Xmx}}: lần sau ai đó đổi limit mà quên sửa Xmx là lệch ngay.

### Vì sao các phương án còn lại sai
- **16 GiB theo RAM node**: đó là hành vi của JVM rất cũ (trước 8u191) chưa hiểu container. Java 17 bật container support mặc định ({{UseContainerSupport}}).
- **Đúng 2 GiB**: JVM không bao giờ mặc định dùng toàn bộ RAM cho heap; nếu làm vậy, phần off-heap sẽ đẩy process vượt limit và bị OOMKilled.
- **75% limit**: 75% là con số **bạn nên tự đặt** gần mức đó, không phải mặc định. Mặc định chỉ 25% (riêng máy RAM rất nhỏ thì JVM dùng quy tắc {{MinRAMPercentage}} 50%).

> Senior tip: đưa {{jvm_memory_max_bytes}} với nhãn {{area="heap"}} (Micrometer) lên dashboard cạnh memory limit của Pod. Chênh lệch kiểu "limit 2 GiB, heap max 512 MiB" là dấu hiệu quên cấu hình gặp rất thường xuyên khi team mới chuyển lên Kubernetes.`
},
{
  id: 'qz-devops-024', topic: 'devops', multi: true,
  q: 'Service Spring Boot có liveness probe trỏ vào {{/actuator/health}} (bao gồm cả kiểm tra DB). PostgreSQL failover mất 40 giây, và cả 6 Pod bị restart cùng lúc, kéo dài sự cố thêm 3 phút vì Pod khởi động lại chậm. Hai thay đổi nào đúng? (Chọn 2)',
  options: [
    'Tăng failureThreshold của liveness lên 100 để Pod gần như không bao giờ bị restart',
    'Trỏ liveness vào {{/actuator/health/liveness}}: chỉ phản ánh trạng thái nội bộ của app, không kiểm tra DB hay hệ thống bên ngoài',
    'Thêm kiểm tra Kafka vào liveness để phát hiện sự cố hạ tầng sớm hơn',
    'Không đưa DB vào liveness; nếu cần thì chỉ cân nhắc đưa vào readiness, vì readiness fail chỉ rút Pod khỏi endpoint chứ không restart, và Pod tự nhận lại traffic khi DB hồi phục',
    'Đặt initialDelaySeconds của liveness = 300 để Pod có thời gian chờ DB phục hồi'
  ],
  answer: [1, 3],
  explain: `**Tóm tắt:** liveness trả lời câu hỏi "process này có hỏng tới mức **restart sẽ chữa được** không?". DB failover không phải lỗi của Pod, restart không chữa được, chỉ làm mọi thứ tệ hơn: 6 Pod cùng khởi động lại (mỗi Pod 40–60 giây), trong lúc đó không còn Pod nào phục vụ.

### Cấu hình đúng với Actuator
~~~yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8081 }    # chỉ livenessState
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8081 }   # readinessState (+ phụ thuộc nếu thật sự cần)
~~~
Spring Boot tự bật hai health group này khi chạy trên Kubernetes (hoặc đặt {{management.endpoint.health.probes.enabled=true}}). Muốn readiness kiểm tra DB: {{management.endpoint.health.group.readiness.include=readinessState,db}} — nhưng nhớ rằng nếu mọi Pod cùng mất DB thì mọi Pod cùng unready và Service vẫn trả 503; nhiều team chọn để app tự trả lỗi nhanh (timeout ngắn, circuit breaker) thay vì đưa DB vào probe.

### Vì sao các phương án còn lại sai
- **failureThreshold 100**: liveness gần như bị vô hiệu hoá, Pod deadlock thật sẽ không bao giờ được restart. Sửa sai chỗ: vấn đề là liveness kiểm tra **sai thứ**, không phải ngưỡng.
- **Thêm Kafka vào liveness**: lặp lại đúng lỗi cũ với một phụ thuộc khác — Kafka chập chờn là cả cluster restart dây chuyền.
- **initialDelaySeconds = 300**: tham số này chỉ áp dụng **một lần lúc container khởi động**. DB sập giữa lúc đang chạy thì nó không có tác dụng gì; còn đặt 300 giây thì Pod bị treo lúc khởi động sẽ không được phát hiện trong 5 phút (dùng startupProbe cho chuyện khởi động chậm).

> Senior tip: quy tắc tôi dùng khi review manifest: **liveness không bao giờ được phụ thuộc vào thứ nằm ngoài process**. Mỗi lần thấy {{db}}, {{redis}}, {{kafka}} trong nhóm liveness là một sự cố restart dây chuyền đang chờ ngày xảy ra.`
},
{
  id: 'qz-devops-025', topic: 'devops',
  q: 'Node bị memory pressure. Bốn Pod cùng PriorityClass: A là Guaranteed (request = limit 2Gi, đang dùng 1.8Gi); B là Burstable (request 1Gi, limit 4Gi, đang dùng 2.5Gi); C là BestEffort (đang dùng 200Mi); D là Burstable (request 2Gi, đang dùng 1Gi). Kubelet evict Pod nào đầu tiên?',
  options: [
    'C: Pod BestEffort luôn bị evict đầu tiên, bất kể dùng bao nhiêu memory',
    'D: Pod có request lớn nhưng dùng ít, nên bị thu hồi để giải phóng phần request bỏ trống',
    'B: trong các Pod dùng vượt request (B và C), cùng priority thì Pod vượt request nhiều hơn (B vượt 1.5Gi) bị evict trước',
    'Không Pod nào: kubelet chỉ evict khi có container vượt memory limit của nó'
  ],
  answer: 2,
  explain: `**Tóm tắt:** khi node thiếu memory, kubelet xếp hạng Pod theo ba bước: (1) usage có **vượt request** không, (2) **Priority**, (3) **vượt request bao nhiêu**. B vượt 1.5Gi, C vượt 200Mi (request bằng 0), A và D dùng dưới request → B bị evict đầu tiên.

| Pod | Request | Usage | Vượt request |
|---|---|---|---|
| A (Guaranteed) | 2Gi | 1.8Gi | không |
| B (Burstable) | 1Gi | 2.5Gi | **+1.5Gi** |
| C (BestEffort) | 0 | 200Mi | +200Mi |
| D (Burstable) | 2Gi | 1Gi | không |

### Vì sao các phương án còn lại sai
- **C luôn đầu tiên**: QoS class không phải tiêu chí trực tiếp của eviction. BestEffort thường chết sớm vì request bằng 0 nên mọi usage đều là "vượt", nhưng một Pod Burstable "xin ít, dùng nhiều" còn vượt nhiều hơn. (QoS ảnh hưởng trực tiếp tới **OOM killer của kernel** qua {{oom_score_adj}}, đó là cơ chế khác.)
- **D vì request bỏ trống**: kubelet không "thu hồi" request chưa dùng; Pod dùng dưới request gần như an toàn trước memory pressure.
- **Chỉ khi vượt limit**: vượt limit là việc của OOM killer trong cgroup (OOMKilled). Node-pressure eviction là cơ chế riêng, kích hoạt khi {{memory.available}} của node xuống dưới ngưỡng (mặc định hard là 100Mi), kể cả khi không container nào chạm limit.

> Senior tip: với service Java, đặt **memory request = limit**: Pod không bao giờ dùng vượt request nên không bao giờ đứng đầu hàng eviction; nếu phình quá limit thì chỉ chính nó bị OOMKilled, rõ ràng và dễ điều tra.`
},
{
  id: 'qz-devops-026', topic: 'devops',
  q: 'Pod ở namespace {{shop}} dùng resolv.conf mặc định: search {{shop.svc.cluster.local svc.cluster.local cluster.local}} và {{options ndots:5}}. App gọi {{api.partner.com}}. Truy vấn DNS đầu tiên resolver gửi đi là gì?',
  options: [
    '{{api.partner.com}}: tên miền công khai luôn được hỏi trước',
    '{{api.partner.com.cluster.local}}: resolver thử search domain ngắn nhất trước',
    'Không có truy vấn nào tới CoreDNS: tên bên ngoài cluster phải được khai báo bằng Service kiểu ExternalName mới phân giải được',
    '{{api.partner.com.shop.svc.cluster.local}}: tên có 2 dấu chấm, ít hơn ndots 5, nên resolver ghép search domain đầu tiên trước'
  ],
  answer: 3,
  explain: `**Tóm tắt:** quy tắc của resolver: tên có **số dấu chấm ≥ ndots** thì hỏi tên gốc trước; ngược lại thì thử **lần lượt từng search domain theo thứ tự**, cuối cùng mới hỏi tên gốc. {{api.partner.com}} có 2 dấu chấm < 5.

~~~text
api.partner.com.shop.svc.cluster.local   -> NXDOMAIN
api.partner.com.svc.cluster.local        -> NXDOMAIN
api.partner.com.cluster.local            -> NXDOMAIN
api.partner.com                          -> IP thật
(mỗi bước gửi cả A và AAAA: 8 truy vấn, 6 NXDOMAIN)
~~~
Hậu quả: CoreDNS gánh nhiều truy vấn rác, và mỗi gói UDP thêm là một cơ hội bị rớt — rớt một gói thì glibc chờ timeout 5 giây.

### Cách giảm
~~~yaml
spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"     # tên >= 2 dấu chấm hỏi tên gốc trước
~~~
Kèm NodeLocal DNSCache, connection pool keep-alive để ít phải phân giải lại.

### Vì sao các phương án còn lại sai
- **Tên công khai luôn hỏi trước**: resolver không phân biệt "công khai" hay "nội bộ"; nó chỉ đếm dấu chấm so với ndots.
- **Search domain ngắn nhất trước**: search list được thử **theo đúng thứ tự** trong file, bắt đầu từ {{shop.svc.cluster.local}}.
- **Cần ExternalName**: CoreDNS chuyển tiếp tên ngoài cluster lên upstream resolver (plugin forward); ExternalName chỉ là cách tạo bí danh CNAME trong cluster, không bắt buộc.

> Senior tip: khi p99 có "đuôi" đúng khoảng 5 giây, hãy nghi DNS trước tiên: đếm tỷ lệ NXDOMAIN trên CoreDNS ({{coredns_dns_responses_total}} theo rcode) — con số đó thường cao bất ngờ.`
},
{
  id: 'qz-devops-027', topic: 'devops', multi: true,
  q: 'Hai kỹ sư chạy terraform apply gần như cùng lúc vào môi trường prod; state nằm trên S3 nhưng chưa bật lock, và sau đó state mất dấu một security group vừa tạo. Hai biện pháp nào ngăn chuyện này lặp lại? (Chọn 2)',
  options: [
    'Bật state locking của backend: S3 với {{use_lockfile = true}} (Terraform 1.10+), hoặc bảng DynamoDB ở cấu hình cũ',
    'Commit file terraform.tfstate vào Git để mọi người luôn có bản mới nhất',
    'Chỉ cho CI apply: mỗi state chỉ một job chạy cùng lúc (concurrency group) và apply đúng file plan đã được review trong PR',
    'Chạy apply với {{-lock=false}} để tránh bị treo vì lock',
    'Yêu cầu mỗi người chạy {{terraform refresh}} trước khi apply'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** hai apply song song cùng đọc state serial N, mỗi bên tạo tài nguyên riêng rồi ghi state của mình — bên ghi sau **đè** bên ghi trước, nên tài nguyên của bên kia vẫn tồn tại trên AWS nhưng biến mất khỏi state. Cần **lock** ở backend (lớp bảo vệ cuối) và **quy trình** để chỉ một luồng apply có kiểm soát.

### Lock hoạt động thế nào
Apply thứ hai gặp {{Error acquiring the state lock}} kèm Lock ID, người giữ và thời điểm. Chỉ dùng {{terraform force-unlock}} khi chắc chắn tiến trình giữ lock đã chết (ví dụ job CI bị kill), nếu không sẽ có hai tiến trình cùng ghi.
~~~bash
terraform plan -input=false -lock-timeout=5m -out=tfplan   # chờ lock tối đa 5 phút thay vì fail ngay
terraform apply tfplan                                     # plan cũ (state đã đổi) sẽ bị từ chối
~~~
Sửa hậu quả hiện tại: đưa security group về state bằng {{terraform import}} hoặc khối {{import}}, rồi plan phải sạch.

### Vì sao các phương án còn lại sai
- **Commit state vào Git**: Git không có khái niệm lock, merge conflict trên state rất nguy hiểm, và state chứa secret dạng plain text. Đây chính là một trong các nguyên nhân gốc.
- **{{-lock=false}}**: tắt đúng cơ chế đang cần, chỉ dùng trong tình huống đặc biệt có kiểm soát.
- **{{terraform refresh}} trước apply**: chỉ cập nhật state theo thực tế tại thời điểm đó; hai người vẫn có thể apply chồng nhau một giây sau. (Lệnh này cũng đã deprecated, thay bằng {{plan -refresh-only}}.)

> Senior tip: con người không nên có quyền ghi state prod hằng ngày. Khi CI là "người apply" duy nhất, lock gần như không bao giờ bị tranh chấp — và mỗi thay đổi đều có plan, người review và log đi kèm.`
},
{
  id: 'qz-devops-028', topic: 'devops',
  q: 'Argo CD bật auto-sync và self-heal. Manifest Deployment {{orders}} trong Git có {{replicas: 3}}, còn HPA scale lên 10 Pod lúc cao điểm. Argo CD liên tục báo OutOfSync và kéo số replica về 3, rồi HPA lại scale lên. Cách sửa đúng là gì?',
  options: [
    'Bỏ field {{replicas}} khỏi manifest trong Git để HPA là bên duy nhất quản lý số replica (hoặc khai báo ignoreDifferences cho /spec/replicas trong Application)',
    'Tắt self-heal cho toàn bộ cluster để Argo CD không can thiệp nữa',
    'Đặt {{minReplicas}} của HPA bằng 3 cho khớp với Git',
    'Bỏ HPA; mỗi lần cao điểm thì sửa replicas trong Git rồi chờ Argo CD sync'
  ],
  answer: 0,
  explain: `**Tóm tắt:** đây là **hai controller giành nhau một field**. Git (qua Argo CD) nói "3", HPA nói "10"; self-heal coi giá trị của HPA là **drift** và sửa lại, HPA lại scale lên — Pod bị tạo/xoá liên tục. Nguyên tắc: mỗi field chỉ có **một chủ**. Số replica động thì chủ là HPA, nên Git không được khai báo nó.

~~~yaml
# Cách 1 (khuyến nghị): manifest Deployment không có spec.replicas
# Cách 2: trong Argo CD Application
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers: [/spec/replicas]
~~~

### Vì sao các phương án còn lại sai
- **Tắt self-heal toàn cluster**: mất luôn khả năng sửa drift thật (ai đó {{kubectl edit}} image hay env trên prod). Chữa một field bằng cách bỏ cả cơ chế.
- **minReplicas = 3**: HPA vẫn scale lên 10 lúc cao điểm, Git vẫn nói 3 — cuộc giằng co còn nguyên.
- **Bỏ HPA, sửa Git bằng tay**: phản ứng chậm theo tốc độ con người và tốc độ sync, đúng lúc cao điểm cần nhanh nhất.

> Senior tip: khi bỏ {{replicas}} khỏi manifest của Deployment **đang chạy**, client-side apply có thể xoá field đó khỏi object và Kubernetes đặt về mặc định 1 trong chốc lát trước khi HPA kéo lên lại. Tài liệu Kubernetes có hướng dẫn riêng cho việc chuyển sang autoscaling; làm ngoài giờ cao điểm hoặc dùng server-side apply. Drift kiểu này cũng gặp với annotation do mesh/sidecar injector thêm vào — xử lý cùng nguyên tắc "một field, một chủ".`
},
{
  id: 'qz-devops-029', topic: 'devops',
  q: 'Pipeline ký image bằng cosign keyless; Kyverno chỉ cho chạy image có chữ ký với danh tính là workflow {{release.yml}} trên nhánh main. Kẻ tấn công có quyền push registry đẩy một image khác đè lên tag {{payment:1.8.0}} (tag này từng được ký hợp lệ). Khi Pod mới được tạo với tag đó, điều gì xảy ra?',
  options: [
    'Pod chạy bình thường vì tag 1.8.0 đã từng được ký hợp lệ',
    'Pod bị từ chối: chữ ký gắn với digest của image cũ, còn tag giờ trỏ tới digest mới không có chữ ký hợp lệ từ đúng danh tính workflow',
    'cosign phát hiện image mới có lỗ hổng CVE nên chặn lại',
    'Kyverno tự động dùng lại image cũ còn trong cache của node theo tag'
  ],
  answer: 1,
  explain: `**Tóm tắt:** cosign ký **digest** (sha256 của manifest image), không ký tag. Tag chỉ là con trỏ có thể bị ghi đè. Kyverno phân giải tag thành digest hiện tại, tìm chữ ký cho **digest đó** và kiểm tra chứng chỉ có đúng issuer/subject của workflow release không. Image của kẻ tấn công có digest mới, không có chữ ký nào từ danh tính đó → admission từ chối.

~~~bash
cosign verify registry.bank.vn/payment:1.8.0 --certificate-identity https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main --certificate-oidc-issuer https://token.actions.githubusercontent.com
# image bị đè: "no matching signatures" -> verify thất bại
~~~
Kẻ tấn công cũng không tự ký được: keyless yêu cầu OIDC token của **đúng workflow trên đúng nhánh**, và chữ ký nằm trong log công khai Rekor.

### Vì sao các phương án còn lại sai
- **Tag từng được ký**: chữ ký không đi theo tag. Nếu verify theo tag thì toàn bộ cơ chế vô nghĩa, vì ai đè tag cũng "thừa hưởng" chữ ký.
- **cosign phát hiện CVE**: ký và verify chỉ chứng minh **nguồn gốc và tính toàn vẹn**, không đánh giá lỗ hổng. Quét CVE là việc của Trivy/Grype.
- **Kyverno dùng image cũ trong cache**: admission controller không chọn image thay bạn; nó chỉ cho phép hoặc từ chối (và có thể đổi tag thành digest **đã verify** khi bật {{mutateDigest}}).

> Senior tip: ngoài verify chữ ký, hãy bật **tag immutability** ở registry (ECR, Harbor đều hỗ trợ) và deploy theo digest. Ba lớp: tag không đè được, manifest ghim digest, admission verify chữ ký — kẻ tấn công phải vượt cả ba.`
},
{
  id: 'qz-devops-030', topic: 'devops', multi: true,
  q: 'Phát biểu nào về SBOM và quét lỗ hổng image là đúng? (Chọn 2)',
  options: [
    'Image đã pass Trivy lúc build thì an toàn suốt vòng đời, không cần quét lại',
    'Ký image bằng cosign bảo đảm image không chứa lỗ hổng đã biết',
    'SBOM lưu danh sách thành phần của image, nên khi một CVE mới được công bố bạn tra ra service bị ảnh hưởng mà không cần build lại',
    'SBOM sinh từ plugin CycloneDX của Maven đã bao gồm cả gói hệ điều hành của base image',
    'Cờ {{--ignore-unfixed}} của Trivy bỏ qua lỗ hổng chưa có bản vá, giúp gate chỉ chặn những gì team thực sự sửa được bằng cách nâng version'
  ],
  answer: [2, 4],
  explain: `**Tóm tắt:** SBOM là "danh sách nguyên liệu" (gói OS, JRE, từng jar kèm version, purl) — tài sản dùng **lâu dài** để tra cứu. Gate trong CI nên chặn lỗ hổng **có bản vá** ({{--ignore-unfixed}}), còn lỗ hổng chưa có bản vá thì đánh giá và theo dõi riêng.

~~~bash
syft registry.bank.vn/payment@sha256:... -o cyclonedx-json > sbom.cdx.json
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 registry.bank.vn/payment@sha256:...
trivy sbom sbom.cdx.json      # hằng ngày: quét lại SBOM đã lưu với DB lỗ hổng mới nhất
~~~

### Vì sao các phương án còn lại sai
- **Pass lúc build là an toàn mãi**: CVE được công bố mỗi ngày; image "sạch" hôm nay có thể dính CVE CRITICAL tuần sau mà không ai đổi một byte. Phải quét lại image **đang chạy** (dựa trên SBOM, Trivy Operator, Dependency-Track…).
- **Ký bảo đảm không có lỗ hổng**: chữ ký chỉ chứng minh image do pipeline của bạn tạo ra và chưa bị sửa. Một image đầy lỗ hổng vẫn ký được bình thường.
- **SBOM từ Maven có cả gói OS**: plugin Maven chỉ thấy dependency Java trong project; nó không biết base image chứa glibc, openssl phiên bản nào. Cần SBOM sinh từ **image** (Syft, Trivy) cho phần OS.

> Senior tip: đặt ngoại lệ (CVE chưa có bản vá, hoặc không khai thác được trong ngữ cảnh của bạn) kèm **ngày hết hạn** và người duyệt. Danh sách ignore không có hạn là nơi các CVE nghiêm trọng nằm yên suốt nhiều năm.`
},
{
  id: 'qz-devops-031', topic: 'devops',
  q: 'Service Java gọi API đối tác khoảng 800 lần/giây. Lúc cao điểm log báo {{java.net.BindException: Cannot assign requested address}}; {{ss -tan state time-wait}} đếm được khoảng 28.000 socket, gần như tất cả tới cùng IP:443 của đối tác. Nguyên nhân gốc và cách sửa đúng nhất là gì?',
  options: [
    'Process chạm giới hạn file descriptor; tăng {{ulimit -n}} lên 1.000.000',
    'TIME_WAIT kéo dài do {{tcp_fin_timeout}}; giảm tham số này xuống 5 giây để TIME_WAIT hết nhanh',
    'Hết ephemeral port vì mỗi request mở một kết nối TCP mới rồi đóng; dùng chung một HTTP client có connection pool và keep-alive để tái sử dụng kết nối',
    'Bật {{net.ipv4.tcp_tw_recycle}} để kernel tái chế socket TIME_WAIT'
  ],
  answer: 2,
  explain: `**Tóm tắt:** kết nối tới **cùng một đích** chỉ khác nhau ở port nguồn, lấy từ {{ip_local_port_range}} (mặc định 32768–60999 ≈ 28 nghìn port). Socket đóng chủ động nằm ở TIME_WAIT **60 giây**, nên trần là khoảng 28.000 / 60 ≈ **470 kết nối mới mỗi giây**. 800 request/giây, mỗi request một kết nối mới → hết port. Lỗi EADDRNOTAVAIL ("Cannot assign requested address") chính là triệu chứng đó.

~~~java
// Lỗi điển hình: tạo client mới cho mỗi lần gọi
HttpClient client = HttpClient.newHttpClient();          // SAI nếu nằm trong method xử lý request
// Sửa: một instance dùng chung (thread-safe), kết nối được giữ và tái sử dụng
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2)).build();
~~~
Biện pháp phụ (nới biên, không thay sửa code): mở rộng {{ip_local_port_range}}, bật {{net.ipv4.tcp_tw_reuse=1}} để kết nối đi ra được tái dùng socket TIME_WAIT an toàn (dựa trên TCP timestamps).

### Vì sao các phương án còn lại sai
- **Giới hạn file descriptor**: hết fd cho lỗi khác hẳn — "Too many open files" (EMFILE). Socket TIME_WAIT đã được đóng, không còn giữ fd của process.
- **Giảm {{tcp_fin_timeout}}**: đây là nhầm lẫn rất phổ biến. Tham số này điều khiển FIN_WAIT_2; thời gian TIME_WAIT trên Linux cố định 60 giây trong kernel.
- **{{tcp_tw_recycle}}**: đã bị **xoá khỏi kernel từ bản 4.12** vì làm rớt kết nối của client đứng sau NAT. Trên kernel hiện đại, sysctl này không tồn tại.

> Senior tip: thấy TIME_WAIT dồn về một đích, câu hỏi đầu tiên luôn là "HTTP client được tạo ở đâu, bao nhiêu lần?". Nếu nhiều Pod đi ra qua một NAT gateway, nhớ thêm trần của NAT (AWS NAT Gateway khoảng 55.000 kết nối đồng thời tới mỗi đích) — cùng một bug, thêm một chỗ nổ.`
},
{
  id: 'qz-devops-032', topic: 'devops',
  q: 'Service Java chạy bằng systemd báo "Too many open files". Bạn SSH vào server, gõ {{ulimit -n}} thấy 65536, và {{/etc/security/limits.conf}} cũng đặt nofile 65536. Cách nào cho biết đúng giới hạn mà process Java đang thực sự chịu?',
  options: [
    'Tin kết quả {{ulimit -n}} trong phiên SSH, vì mọi process trên máy dùng chung giới hạn này',
    'Đọc {{sysctl fs.file-max}}, vì đó là giới hạn số file của từng process',
    'Đọc {{/etc/security/limits.conf}}, vì systemd áp dụng file này cho mọi service',
    'Đọc {{/proc/PID/limits}} của chính process Java (dòng "Max open files") và so với số fd đang mở trong {{/proc/PID/fd}}'
  ],
  answer: 3,
  explain: `**Tóm tắt:** giới hạn fd là thuộc tính **của từng process**, thừa kế từ process cha lúc khởi động. Nguồn sự thật duy nhất là {{/proc/PID/limits}} của chính process đó.

~~~bash
PID=$(pgrep -f orders.jar)
grep "Max open files" /proc/$PID/limits     # soft và hard thật
ls /proc/$PID/fd | wc -l                    # đang mở bao nhiêu
systemctl show orders.service -p LimitNOFILE
~~~
Service systemd lấy giới hạn từ {{LimitNOFILE=}} trong unit file (hoặc mặc định của systemd), **không** đi qua PAM nên không đọc limits.conf. Sửa: thêm {{LimitNOFILE=65536}} vào unit (drop-in qua {{systemctl edit}}), rồi restart service. HotSpot trên Linux mặc định nâng soft limit lên bằng hard limit lúc khởi động, nên hard limit là con số quyết định.

### Vì sao các phương án còn lại sai
- **{{ulimit -n}} trong SSH**: đó là giới hạn của **shell của bạn**, được PAM đặt khi đăng nhập. Process do systemd khởi động có cây process cha khác hẳn.
- **{{fs.file-max}}**: giới hạn **toàn hệ thống** (tổng fd kernel cấp được), không phải giới hạn mỗi process. Xem mức dùng tổng ở {{/proc/sys/fs/file-nr}}.
- **systemd đọc limits.conf**: sai — limits.conf được áp dụng bởi module {{pam_limits}} cho phiên đăng nhập; service systemd không đi qua PAM.

> Senior tip: nâng limit chỉ là một nửa câu chuyện. Nếu số fd tăng đều theo giờ (đường thẳng đi lên trên metric {{process_files_open_files}}), đó là **rò rỉ** — stream, socket không được đóng — và limit cao hơn chỉ dời giờ nổ sang lúc khó chịu hơn.`
},
{
  id: 'qz-devops-033', topic: 'devops',
  q: 'SLO của API thanh toán là 99.9% request thành công trong 30 ngày. Trong 1 giờ vừa qua, tỷ lệ lỗi ổn định ở mức 1.44%. Phát biểu nào đúng?',
  options: [
    'Burn rate là 14.4: giờ vừa qua đã tiêu khoảng 2% error budget của cả 30 ngày, nếu kéo dài thì budget cạn sau khoảng 50 giờ — đủ mức để page on-call ngay',
    'Burn rate là 1.44: vẫn nằm trong budget nên chỉ cần tạo ticket',
    'Chưa vi phạm SLO vì SLO tính trên 30 ngày, nên chưa cần cảnh báo cho tới khi hết tháng',
    'Burn rate là 144: error budget đã cạn hoàn toàn trong giờ vừa qua'
  ],
  answer: 0,
  explain: `**Tóm tắt:** error budget = 1 − 0.999 = **0.1%**. Burn rate = tỷ lệ lỗi / budget = 1.44% / 0.1% = **14.4**, tức tiêu budget nhanh gấp 14.4 lần mức "vừa đủ cho 30 ngày".

### Tính từng bước
- Cửa sổ 30 ngày = 720 giờ. Ở burn rate 1, budget hết đúng sau 720 giờ.
- 1 giờ ở burn rate 14.4 tiêu 14.4 / 720 = **2%** budget.
- Nếu tiếp tục: 720 / 14.4 = **50 giờ** là cạn budget cả tháng.
- Theo SRE Workbook, burn rate 14.4 trên cửa sổ 1 giờ (kèm cửa sổ 5 phút để xác nhận lỗi **vẫn đang diễn ra**) là ngưỡng **page**.

~~~yaml
expr: payment:error_ratio:rate1h > (14.4 * 0.001) and payment:error_ratio:rate5m > (14.4 * 0.001)
~~~

### Vì sao các phương án còn lại sai
- **Burn rate 1.44**: nhầm giữa tỷ lệ lỗi (1.44%) và burn rate; phải chia cho budget 0.1%, không phải cho 1.
- **Chờ hết tháng**: SLO đo trên 30 ngày nhưng cảnh báo phải dựa vào **tốc độ tiêu**. Chờ tới khi vi phạm thật thì đã quá muộn để hành động.
- **Burn rate 144, budget đã cạn**: tính sai bậc độ lớn; một giờ ở 14.4 mới tiêu 2% budget, còn xa mới cạn.

> Senior tip: với service ít traffic, 3 lỗi trên 100 request đã là 3% — burn rate vọt lên 30 dù chỉ là nhiễu. Thêm điều kiện số request tối thiểu trong cửa sổ, hoặc bơm synthetic traffic, trước khi bật page theo burn rate.`
},
{
  id: 'qz-devops-034', topic: 'devops',
  q: 'Deployment {{orders}} có 4 replica, strategy RollingUpdate với {{maxSurge: 1}} và {{maxUnavailable: 0}}. Bản mới có lỗi khiến readiness probe luôn fail (liveness vẫn pass). Sau khi apply, điều gì xảy ra?',
  options: [
    'Kubernetes tự động rollback về ReplicaSet cũ sau progressDeadlineSeconds',
    'Cả 4 Pod cũ lần lượt bị thay bằng Pod mới, service trả 503 cho tới khi sửa',
    'Pod mới bị kubelet restart liên tục vì readiness fail và rơi vào CrashLoopBackOff',
    'Rollout kẹt: 1 Pod mới được tạo nhưng không bao giờ Ready, 4 Pod cũ vẫn phục vụ; sau progressDeadlineSeconds (mặc định 600 giây) Deployment báo ProgressDeadlineExceeded nhưng không tự rollback'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{maxUnavailable: 0}} nghĩa là số Pod **sẵn sàng** không được xuống dưới 4. Controller tạo thêm 1 Pod mới (nhờ {{maxSurge: 1}}) và chỉ xoá một Pod cũ khi Pod mới **Ready**. Pod mới không bao giờ Ready → không Pod cũ nào bị xoá → rollout đứng yên, người dùng **không bị ảnh hưởng**.

~~~bash
kubectl rollout status deployment/orders --timeout=10m   # thất bại với ProgressDeadlineExceeded
kubectl get rs -l app=orders                             # RS cũ 4/4 ready, RS mới 1 desired, 0 ready
kubectl rollout undo deployment/orders                   # rollback do BẠN (hoặc pipeline) thực hiện
~~~

### Vì sao các phương án còn lại sai
- **Tự rollback**: Deployment chỉ đặt condition {{Progressing=False}} với reason {{ProgressDeadlineExceeded}}; rollback là việc của pipeline, của người vận hành, hoặc của công cụ như Argo Rollouts.
- **Thay hết 4 Pod cũ**: điều đó chỉ xảy ra khi bản mới Ready. Đây chính là giá trị của readiness probe kết hợp maxUnavailable 0: chặn bản hỏng ngay ở Pod đầu tiên.
- **CrashLoopBackOff**: readiness fail **không bao giờ** làm restart container — nó chỉ khiến Pod bị loại khỏi endpoint của Service. Restart là hệ quả của liveness fail hoặc process tự thoát.

> Senior tip: pipeline nên chạy {{kubectl rollout status}} với timeout và tự gọi rollback khi thất bại; nếu không, một rollout kẹt có thể nằm đó nhiều ngày, và lần deploy kế tiếp sẽ chồng lên trạng thái nửa vời này.`
},

/* ===================== AWS ===================== */
{
  id: 'qz-aws-009', topic: 'aws',
  q: 'Service Spring Boot chạy trên ECS Fargate cần đọc object từ một bucket S3. Cách cấp quyền đúng là gì?',
  options: [
    'Tạo IAM user, lưu access key vào biến môi trường của task definition',
    'Gắn policy S3 vào task execution role',
    'Mở bucket ở chế độ public-read để service đọc được',
    'Tạo task role (taskRoleArn) với policy chỉ cho phép {{s3:GetObject}} trên đúng bucket/prefix; AWS SDK tự lấy credential tạm thời từ task'
  ],
  answer: 3,
  explain: `**Tóm tắt:** dùng **task role**: ECS cấp credential tạm thời, tự xoay vòng, cho code trong container; AWS SDK for Java v2 tìm thấy chúng qua default credentials provider chain mà không cần cấu hình.

### Hai role dễ nhầm
| Role | Ai dùng | Ví dụ quyền |
|---|---|---|
| Task **execution** role | ECS agent | kéo image từ ECR, ghi log CloudWatch, đọc secret để inject vào env |
| Task role | **code của bạn** | S3, SQS, DynamoDB… |

~~~json
{ "Effect": "Allow", "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::invoice-bucket/reports/*" }
~~~

### Vì sao các phương án còn lại sai
- **Access key trong env**: credential dài hạn, dễ lộ qua log, {{describe-task-definition}}, không tự xoay vòng.
- **Execution role**: role này dành cho ECS agent; code trong container không nhận credential của nó.
- **Public-read**: cả internet đọc được dữ liệu; S3 Block Public Access mặc định cũng chặn điều này.

> Senior tip: thêm bucket policy giới hạn theo {{aws:SourceVpce}} (truy cập qua VPC endpoint) nếu dữ liệu nhạy cảm, để credential bị lộ cũng không dùng được từ ngoài VPC.`
},
{
  id: 'qz-aws-010', topic: 'aws',
  q: 'Lambda được gắn vào VPC để truy cập RDS. Sau đó Lambda không gọi được API của bên thứ ba ngoài internet (timeout), dù đã chọn cả public subnet. Cách sửa đúng là gì?',
  options: [
    'Đặt Lambda vào private subnet có route {{0.0.0.0/0}} tới NAT Gateway (NAT nằm trong public subnet)',
    'Bật "Assign public IP" cho Lambda',
    'Tăng timeout của Lambda lên 15 phút',
    'Gắn Internet Gateway trực tiếp vào Lambda'
  ],
  answer: 0,
  explain: `**Tóm tắt:** ENI của Lambda trong VPC **không có public IP**, kể cả khi nằm ở public subnet, nên route tới Internet Gateway vô dụng. Đi ra internet phải qua **NAT Gateway**.

### Sơ đồ
~~~text
Lambda (private subnet) --route 0.0.0.0/0--> NAT GW (public subnet) --> IGW --> Internet
                         \--> RDS (private subnet)
~~~

### Vì sao các phương án còn lại sai
- **Assign public IP**: Lambda không hỗ trợ gán public IP cho ENI của nó.
- **Tăng timeout**: chỉ làm hàm chờ lâu hơn rồi vẫn timeout, tốn thêm tiền.
- **Gắn IGW vào Lambda**: IGW gắn vào VPC, không gắn vào function; và vẫn cần public IP mới dùng được IGW.

> Senior tip: NAT Gateway tính phí theo giờ **và** theo GB dữ liệu. Nếu Lambda chỉ cần gọi dịch vụ AWS (S3, DynamoDB, SQS…), dùng VPC endpoint thay vì đi vòng qua NAT để vừa rẻ vừa an toàn hơn. Ngoài ra, nếu Lambda không thực sự cần VPC thì đừng gắn vào VPC.`
},
{
  id: 'qz-aws-011', topic: 'aws',
  q: 'Bạn host file tĩnh (ảnh sản phẩm, JS, CSS) trên S3, cần HTTPS với domain riêng, cache gần người dùng, và bucket **không** được public. Kiến trúc nào đúng?',
  options: [
    'Bật S3 static website hosting và để bucket public-read',
    'Đặt CloudFront trước bucket, dùng Origin Access Control (OAC) và bucket policy chỉ cho phép CloudFront distribution đó đọc',
    'Cho EC2 chạy Nginx proxy tới S3',
    'Phát presigned URL cho mọi file tĩnh, hết hạn sau 7 ngày'
  ],
  answer: 1,
  explain: `**Tóm tắt:** **CloudFront + OAC**: CloudFront ký request tới S3 bằng SigV4; bucket policy chỉ cho phép principal {{cloudfront.amazonaws.com}} với điều kiện {{AWS:SourceArn}} là distribution của bạn. Bucket giữ private, người dùng chỉ đi qua CloudFront.

~~~json
{ "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::static-assets/*",
  "Condition": { "StringEquals": {
    "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/E1ABC" } } }
~~~
HTTPS với domain riêng: chứng chỉ ACM (phải tạo ở {{us-east-1}} cho CloudFront).

### Vì sao các phương án còn lại sai
- **Website hosting + public-read**: vi phạm yêu cầu không public; endpoint website của S3 còn không hỗ trợ HTTPS.
- **EC2 + Nginx**: tự gánh vận hành, scale, không có edge cache toàn cầu.
- **Presigned URL 7 ngày cho file tĩnh**: URL thay đổi phá cache trình duyệt/CDN, phức tạp không cần thiết; presigned URL hợp cho file riêng tư từng user.

> Senior tip: OAC là cách được khuyến nghị thay cho OAI (cũ) và hỗ trợ cả bucket mã hoá SSE-KMS. Đặt tên file có hash ({{app.3f9a1c.js}}) để cache dài hạn và không cần invalidation mỗi lần deploy.`
},
{
  id: 'qz-aws-012', topic: 'aws', multi: true,
  q: 'So sánh RDS PostgreSQL **Multi-AZ DB instance** (1 standby) và **read replica**. Hai phát biểu nào đúng? (Chọn 2)',
  options: [
    'Multi-AZ DB instance dùng để scale đọc vì standby nhận query SELECT',
    'Standby của Multi-AZ DB instance được replicate đồng bộ và không phục vụ đọc; mục đích là failover tự động',
    'Read replica replicate bất đồng bộ nên có replica lag; đọc ngay sau khi ghi có thể thấy dữ liệu cũ',
    'Read replica tự động failover khi primary chết và không mất dữ liệu',
    'Multi-AZ replicate bất đồng bộ sang một region khác'
  ],
  answer: [1, 2],
  explain: `**Tóm tắt:** Multi-AZ (instance) là **tính sẵn sàng**, read replica là **scale đọc**. Đừng nhầm hai mục đích.

| | Multi-AZ DB instance | Read replica |
|---|---|---|
| Replication | đồng bộ, khác AZ cùng region | bất đồng bộ (có thể cross-region) |
| Đọc từ bản sao | không | có |
| Failover | tự động, thường 1–2 phút, endpoint giữ nguyên | phải promote (thủ công), endpoint đổi |
| Mất dữ liệu khi failover | không (đã commit đồng bộ) | có thể mất phần chưa replicate |

### Vì sao các phương án còn lại sai
- **Multi-AZ để scale đọc**: standby của dạng DB instance không nhận kết nối. (Dạng **Multi-AZ DB cluster** với 2 standby đọc được là một kiểu triển khai khác.)
- **Read replica tự failover, không mất dữ liệu**: với RDS PostgreSQL, replica phải được promote; replication bất đồng bộ nên có thể mất dữ liệu.
- **Multi-AZ async sang region khác**: Multi-AZ nằm trong một region và đồng bộ; cross-region là việc của read replica hoặc Aurora Global Database.

> Senior tip: khi đọc từ replica, các luồng "ghi xong đọc lại ngay" (read-your-writes) phải đi về primary. Theo dõi metric {{ReplicaLag}} và có fallback về primary khi lag vượt ngưỡng.`
},
{
  id: 'qz-aws-013', topic: 'aws',
  q: 'Các sự kiện của cùng một đơn hàng ({{CREATED}}, {{PAID}}, {{SHIPPED}}) phải được xử lý đúng thứ tự, nhưng các đơn khác nhau có thể xử lý song song. Dùng SQS thế nào?',
  options: [
    'SQS Standard với nhiều consumer, vì Standard đảm bảo thứ tự',
    'SQS FIFO với một MessageGroupId cố định cho mọi message',
    'SQS FIFO với {{MessageGroupId = orderId}}: thứ tự được giữ trong từng nhóm, các nhóm khác nhau được xử lý song song',
    'SQS Standard và đặt DelaySeconds tăng dần cho từng sự kiện'
  ],
  answer: 2,
  explain: `**Tóm tắt:** FIFO queue đảm bảo thứ tự **trong từng message group**. Chọn group theo đơn vị cần thứ tự (orderId) để vừa đúng thứ tự vừa song song được.

### Cơ chế
- Khi một message của group đang in-flight, SQS không giao message tiếp theo **của group đó** cho consumer khác; group khác vẫn được giao.
- Deduplication: {{MessageDeduplicationId}} (hoặc content-based) loại trùng trong cửa sổ 5 phút.

~~~java
sqs.sendMessage(b -> b.queueUrl(url)
    .messageGroupId(orderId)                  // thứ tự theo từng đơn
    .messageDeduplicationId(eventId)          // chống gửi trùng khi retry
    .messageBody(json));
~~~

### Vì sao các phương án còn lại sai
- **Standard đảm bảo thứ tự**: sai, Standard là best-effort ordering và at-least-once (có thể trùng).
- **Một MessageGroupId cố định**: đúng thứ tự nhưng toàn bộ queue thành tuần tự, chỉ một message xử lý tại một thời điểm.
- **DelaySeconds tăng dần**: không đảm bảo gì; retry hoặc consumer chậm vẫn đảo thứ tự.

> Senior tip: FIFO có giới hạn thông lượng thấp hơn Standard (bật high throughput mode nếu cần). Nhiều hệ thống chọn Standard + consumer idempotent + kiểm tra version/trạng thái trong DB, chấp nhận xử lý lại thay vì phụ thuộc thứ tự tuyệt đối.`
},
{
  id: 'qz-aws-014', topic: 'aws',
  q: 'Subnet có Network ACL tuỳ chỉnh: inbound cho phép TCP 443 từ {{0.0.0.0/0}}, outbound chỉ cho phép TCP 443. Security group của EC2 mở inbound 443. Client vẫn bị timeout. Vì sao?',
  options: [
    'Security group là stateless nên cần mở thêm outbound',
    'NACL là stateless: response từ server đi ra tới cổng ephemeral của client (1024–65535), nên outbound NACL phải cho phép dải cổng đó',
    'Phải mở cổng 80 vì HTTPS luôn bắt đầu bằng HTTP',
    'NACL chỉ áp dụng cho traffic giữa các subnet nên không phải nguyên nhân'
  ],
  answer: 1,
  explain: `**Tóm tắt:** **Security group stateful** (cho vào thì tự cho response ra), **NACL stateless** (đánh giá chiều ra độc lập). Response HTTPS có cổng nguồn 443 nhưng cổng **đích** là cổng ephemeral của client, nên bị outbound NACL chặn.

~~~text
Client 203.0.113.5:51734  --->  EC2:443     (inbound NACL: 443 OK)
EC2:443  --->  203.0.113.5:51734            (outbound NACL: đích 51734, chỉ cho 443 -> DROP)
~~~
Sửa: outbound NACL cho phép TCP 1024–65535 tới client.

### Vì sao các phương án còn lại sai
- **SG stateless**: ngược lại, SG là stateful; mở inbound 443 là đủ cho response.
- **Phải mở 80**: HTTPS bắt tay TLS trực tiếp trên 443, không cần cổng 80 (redirect HTTP->HTTPS là chuyện khác).
- **NACL chỉ áp dụng giữa các subnet**: NACL áp dụng cho mọi traffic vào/ra subnet, kể cả từ internet.

> Senior tip: phần lớn hệ thống để NACL mặc định (allow all) và kiểm soát bằng security group tham chiếu lẫn nhau (SG của ALB làm nguồn cho SG của app). Dùng VPC Reachability Analyzer hoặc Flow Logs (thấy {{REJECT}}) để chẩn đoán thay vì đoán.`
},
{
  id: 'qz-aws-015', topic: 'aws',
  q: 'Yêu cầu bảo mật: mật khẩu RDS phải tự động xoay vòng định kỳ, app Spring Boot trên ECS không được downtime khi xoay. Cách làm đúng?',
  options: [
    'Lưu mật khẩu trong AWS Secrets Manager và bật rotation; app đọc secret qua SDK có cache, và khi đăng nhập DB thất bại thì làm mới secret rồi thử lại',
    'Hard-code mật khẩu trong application.yml, đổi tay mỗi quý và redeploy',
    'Lưu trong biến môi trường của task definition dạng plain text',
    'Lưu trong S3 bucket public nhưng đặt tên file khó đoán'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Secrets Manager có rotation tích hợp cho RDS (Lambda rotation hoặc managed rotation khi để RDS quản lý master password). Phía app cần **đọc secret động và biết làm mới**, nếu không vẫn dùng mật khẩu cũ sau khi xoay.

### Những điểm hay sai
- Inject secret vào env lúc task khởi động thì task đang chạy giữ giá trị cũ: phải có cơ chế refresh (cache có TTL, retry khi lỗi xác thực) hoặc rolling restart sau rotation.
- Chiến lược **alternating users** (hai user DB xoay luân phiên) giúp connection đang mở không bị đứt ngay khi đổi mật khẩu.
- Connection pool (HikariCP) giữ connection cũ: connection đã mở vẫn chạy; chỉ connection mới cần mật khẩu mới.

### Vì sao các phương án còn lại sai
- **Hard-code + đổi tay**: secret nằm trong Git và image, xoay tay dễ quên và cần redeploy.
- **Env plain text**: ai có quyền {{ecs:DescribeTaskDefinition}} đều đọc được; không tự xoay.
- **S3 public tên khó đoán**: security through obscurity; dữ liệu public là public.

> Senior tip: cân nhắc IAM database authentication cho RDS (token 15 phút thay mật khẩu), nhưng chú ý giới hạn tốc độ tạo connection mới. Với Parameter Store SecureString thì không có rotation tích hợp như Secrets Manager.`
},
{
  id: 'qz-aws-016', topic: 'aws',
  q: 'Lambda Java 21 dùng Spring Boot có cold start 6–8 giây, ảnh hưởng API đồng bộ. Lựa chọn nào giảm cold start hiệu quả nhất mà ít thay đổi code?',
  options: [
    'Đặt reserved concurrency để Lambda luôn có môi trường chạy sẵn',
    'Bật Lambda SnapStart: Lambda snapshot môi trường đã khởi tạo (sau init) và restore khi cold start; chú ý dữ liệu duy nhất (random seed, connection) phải tạo lại sau restore',
    'Tăng timeout của hàm lên 60 giây',
    'Chuyển sang kiến trúc arm64 vì Graviton không có cold start'
  ],
  answer: 1,
  explain: `**Tóm tắt:** cold start Java chủ yếu là thời gian **init** (load class, khởi tạo Spring context). SnapStart chạy init một lần khi publish version, chụp snapshot Firecracker microVM, và cold start sau đó chỉ cần restore, thường giảm xuống dưới 1 giây.

### Lưu ý khi dùng SnapStart
- Áp dụng trên **published version/alias**, không phải {{$LATEST}}.
- Trạng thái được "đóng băng" trong snapshot sẽ bị dùng chung giữa các môi trường: số ngẫu nhiên, ID duy nhất, connection mạng/DB. Tạo lại chúng sau restore (runtime hooks {{afterRestore}} của CRaC API).
- Có thể "priming": gọi trước code path chính trong {{beforeCheckpoint}} để JIT/class loading nằm sẵn trong snapshot.

### Vì sao các phương án còn lại sai
- **Reserved concurrency**: chỉ **giới hạn/đặt trước** số instance tối đa, không khởi tạo sẵn môi trường. Thứ làm việc đó là provisioned concurrency (tốn tiền liên tục).
- **Tăng timeout**: không làm init nhanh hơn, chỉ cho phép chờ lâu hơn.
- **arm64 không có cold start**: Graviton rẻ hơn và có thể nhanh hơn chút, nhưng vẫn có cold start.

> Senior tip: đo trước bằng {{Init Duration}} trong log REPORT. Nếu API cần latency ổn định ở p99, cân nhắc chạy Spring Boot trên ECS/Fargate thay vì cố ép vào Lambda.`
},
{
  id: 'qz-aws-017', topic: 'aws',
  q: 'API sau Application Load Balancer trả về nhiều HTTP 504 cho endpoint xuất báo cáo, các endpoint khác bình thường. Giải thích nào hợp lý nhất?',
  options: [
    'ALB bị quá tải, cần chuyển sang Network Load Balancer',
    'Target trả về lỗi 500 và ALB chuyển thành 504',
    'Security group của ALB chặn cổng 443',
    'Target xử lý lâu hơn idle timeout của ALB (mặc định 60 giây) nên ALB đóng kết nối và trả 504 Gateway Timeout'
  ],
  answer: 3,
  explain: `**Tóm tắt:** 504 từ ALB nghĩa là ALB **không nhận được response từ target kịp thời**: hoặc không kết nối được trong connection timeout, hoặc target im lặng quá idle timeout (mặc định 60s). Chỉ một endpoint nặng bị lỗi là dấu hiệu rõ của request chạy quá lâu.

### Cách phân biệt
- Metric {{HTTPCode_ELB_5XX_Count}} (lỗi do ALB sinh ra) khác {{HTTPCode_Target_5XX_Count}} (lỗi app trả về).
- Access log ALB: {{target_processing_time}} = -1 kèm 504.

### Cách sửa đúng
Đừng chỉ tăng idle timeout: chuyển xuất báo cáo sang **xử lý bất đồng bộ** (trả 202 + jobId, worker tạo file lên S3, client poll hoặc nhận thông báo, tải bằng presigned URL).

### Vì sao các phương án còn lại sai
- **ALB quá tải**: ALB tự scale; quá tải sẽ ảnh hưởng mọi endpoint chứ không chỉ một.
- **500 bị đổi thành 504**: ALB chuyển nguyên lỗi 500 của target cho client (tính vào Target_5XX), không đổi mã.
- **SG chặn 443**: khi đó mọi request đều thất bại ngay từ đầu, không riêng endpoint báo cáo.

> Senior tip: nếu buộc phải tăng idle timeout của ALB, nhớ đặt keep-alive timeout của server phía sau **lớn hơn** idle timeout của ALB, nếu không sẽ gặp 502 lẻ tẻ do server đóng connection mà ALB đang tái sử dụng.`
},
{
  id: 'qz-aws-018', topic: 'aws',
  q: 'Hệ thống thanh toán cần DR cross-region với RPO vài giây và RTO dưới 15 phút; ban lãnh đạo chấp nhận tăng chi phí nhưng không muốn gấp đôi như active-active. Chiến lược nào phù hợp nhất?',
  options: [
    'Backup & restore: snapshot RDS hằng ngày copy sang region khác',
    'Pilot light: chỉ copy AMI sang region khác, chưa replicate database',
    'Active-active đa region với ghi ở cả hai nơi',
    'Warm standby: database replicate liên tục (ví dụ Aurora Global Database), region phụ chạy sẵn phiên bản thu nhỏ của app, khi sự cố thì promote DB và scale up'
  ],
  answer: 3,
  explain: `**Tóm tắt:** RPO vài giây đòi hỏi **replicate dữ liệu liên tục**; RTO dưới 15 phút đòi hỏi hạ tầng **đã chạy sẵn** để chỉ cần scale và chuyển traffic. Đó là warm standby.

| Chiến lược | RPO | RTO | Chi phí |
|---|---|---|---|
| Backup & restore | giờ | giờ | thấp nhất |
| Pilot light | phút (data replicate) | hàng chục phút–giờ | thấp |
| Warm standby | giây–phút | phút | trung bình |
| Multi-site active-active | gần 0 | gần 0 | cao nhất |

Aurora Global Database có độ trễ replicate thường dưới 1 giây; khi sự cố có thể promote cluster phụ trong vài phút.

### Vì sao các phương án còn lại sai
- **Backup & restore hằng ngày**: RPO tới 24 giờ, restore mất hàng giờ.
- **Pilot light chỉ copy AMI**: không replicate database thì không đạt RPO vài giây; định nghĩa đúng của pilot light vẫn replicate data, nhưng compute phải dựng lên nên RTO dài hơn.
- **Active-active**: vượt yêu cầu và đúng là phương án đắt và phức tạp nhất (xung đột ghi, consistency).

> Senior tip: DR chưa từng diễn tập là DR không tồn tại. Lên lịch game day failover thật, đo RTO thực tế, và đặt TTL DNS (Route 53) thấp để chuyển traffic nhanh.`
},
{
  id: 'qz-aws-019', topic: 'aws', multi: true,
  q: 'Bảng DynamoDB {{Orders}} có partition key {{orderId}}. Giờ cần lấy các đơn của một khách hàng sắp xếp theo thời gian. Hai phát biểu nào đúng? (Chọn 2)',
  options: [
    'Tạo Global Secondary Index với partition key {{customerId}} và sort key {{createdAt}}, rồi Query trên index',
    'Dùng Scan với FilterExpression {{customerId = :c}}; filter giúp giảm RCU vì chỉ tính các item khớp',
    'Thêm Local Secondary Index vào bảng đang có là cách nhanh nhất',
    'Đọc từ GSI chỉ hỗ trợ eventually consistent, nên đơn vừa tạo có thể chưa xuất hiện ngay',
    'GSI hỗ trợ strongly consistent read nếu đặt {{ConsistentRead=true}}'
  ],
  answer: [0, 3],
  explain: `**Tóm tắt:** truy vấn theo thuộc tính không phải key thì thiết kế **GSI** theo access pattern. GSI được cập nhật bất đồng bộ nên đọc từ GSI chỉ là eventually consistent.

~~~java
QueryRequest req = QueryRequest.builder()
    .tableName("Orders").indexName("customerId-createdAt-index")
    .keyConditionExpression("customerId = :c")
    .expressionAttributeValues(Map.of(":c", AttributeValue.fromS(cid)))
    .scanIndexForward(false)        // mới nhất trước
    .limit(20).build();
~~~

### Vì sao các phương án còn lại sai
- **Scan + FilterExpression giảm RCU**: filter áp dụng **sau khi đọc**; bạn trả tiền cho toàn bộ dữ liệu đã scan. Bảng lớn thì vừa chậm vừa đắt.
- **Thêm LSI vào bảng đang có**: LSI chỉ tạo được **lúc tạo bảng**, và phải dùng chung partition key với bảng ({{orderId}}), không giải quyết bài toán theo customerId.
- **GSI strongly consistent**: DynamoDB từ chối {{ConsistentRead=true}} trên GSI.

> Senior tip: chú ý cardinality của partition key trong GSI. Khách hàng lớn (B2B) có hàng triệu đơn có thể tạo hot partition trên index; khi đó thêm hậu tố shard hoặc tách theo tháng. Nhớ GSI thiếu capacity sẽ làm **throttle cả ghi vào bảng gốc**.`
},
{
  id: 'qz-aws-020', topic: 'aws',
  q: 'Hoá đơn AWS tăng vọt ở mục "NAT Gateway – Data Processing". Phân tích cho thấy các service trong private subnet đọc/ghi hàng chục TB với S3 mỗi tháng. Cách giảm chi phí đúng nhất?',
  options: [
    'Tạo S3 Gateway VPC Endpoint và thêm vào route table của private subnet; traffic S3 đi thẳng qua endpoint, không qua NAT và gateway endpoint không tính phí',
    'Chuyển service sang public subnet và gán public IP để bỏ NAT',
    'Dùng S3 Transfer Acceleration',
    'Nén dữ liệu bằng gzip, NAT tính phí theo số request chứ không theo dung lượng'
  ],
  answer: 0,
  explain: `**Tóm tắt:** NAT Gateway tính phí **theo mỗi GB đi qua** (ngoài phí giờ). Traffic tới S3 (và DynamoDB) có thể đi qua **gateway endpoint** miễn phí, chỉ cần thêm route, không đổi code.

### Cách hoạt động
Gateway endpoint thêm một route với prefix list của S3 trong route table. Traffic tới S3 khớp route cụ thể này thay vì {{0.0.0.0/0 -> NAT}}. Có thể gắn endpoint policy giới hạn bucket được truy cập.

### Vì sao các phương án còn lại sai
- **Chuyển sang public subnet**: tăng bề mặt tấn công, phá kiến trúc mạng; không cần thiết khi có endpoint miễn phí.
- **Transfer Acceleration**: tăng tốc upload từ xa qua edge location, **tính thêm phí**, và vẫn đi qua NAT.
- **NAT tính theo request**: sai, NAT tính theo GB; nén có giảm chút nhưng không giải quyết gốc.

> Senior tip: các dịch vụ khác (ECR, CloudWatch Logs, SQS, Secrets Manager) cần **interface endpoint** (PrivateLink) có tính phí theo giờ và GB nhưng thường rẻ hơn NAT khi lưu lượng lớn. Kéo image ECR qua NAT là "khoản rò" phổ biến khác; nhớ ECR cần cả endpoint S3 vì layer nằm trên S3.`
},
{
  id: 'qz-aws-021', topic: 'aws',
  q: 'Sự kiện {{OrderPlaced}} cần được gửi tới 3 service (email, kho, analytics); mỗi service phải nhận **đầy đủ** mọi sự kiện và xử lý theo tốc độ riêng. Thiết kế nào đúng?',
  options: [
    'Một SQS queue, 3 service cùng poll',
    'SNS topic, mỗi service có một SQS queue riêng subscribe vào topic (fan-out), kèm DLQ cho từng queue',
    'Một SQS queue, đặt visibility timeout bằng 0 để cả 3 service cùng thấy message',
    'Producer gọi HTTP đồng bộ tới cả 3 service trong cùng request'
  ],
  answer: 1,
  explain: `**Tóm tắt:** SQS là mô hình **competing consumers**: mỗi message chỉ được một consumer xử lý. Muốn mỗi service nhận đủ thì cần **pub/sub**: SNS fan-out ra nhiều SQS queue, mỗi queue thuộc một service.

~~~text
OrderService --> SNS topic order-events --> SQS email-q      --> Email service
                                       --> SQS inventory-q  --> Inventory service
                                       --> SQS analytics-q  --> Analytics service
~~~
Queue riêng làm bộ đệm: analytics chậm hoặc chết không ảnh hưởng hai service kia; mỗi queue có DLQ và retry riêng.

### Vì sao các phương án còn lại sai
- **Một queue, 3 service cùng poll**: mỗi message chỉ tới một service, hai service còn lại bỏ lỡ.
- **Visibility timeout 0**: message được giao lặp lại liên tục, cũng không đảm bảo service nào nhận, và message bị xoá khi một service xoá nó.
- **HTTP đồng bộ**: coupling chặt; một service chậm hoặc lỗi làm hỏng request đặt hàng.

> Senior tip: dùng SNS subscription filter policy để mỗi queue chỉ nhận loại sự kiện cần thiết. EventBridge là lựa chọn tương đương với rule định tuyến phong phú hơn; Kafka/Kinesis phù hợp khi cần replay lịch sử.`
},
{
  id: 'qz-aws-022', topic: 'aws', multi: true,
  q: 'Công ty dùng AWS Organizations và muốn áp dụng guardrail "không ai được tắt CloudTrail" cho mọi account. Về Service Control Policy (SCP), hai phát biểu nào đúng? (Chọn 2)',
  options: [
    'SCP chỉ đặt giới hạn quyền tối đa; nó không cấp quyền, user vẫn cần IAM policy cho phép hành động',
    'Gắn SCP Allow {{s3:*}} vào OU sẽ cấp quyền S3 cho mọi user trong các account thuộc OU',
    'SCP không áp dụng cho management account của organization',
    'Root user của member account không bị SCP ảnh hưởng',
    'SCP thay thế hoàn toàn IAM policy trong member account'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** SCP là **guardrail**: quyền hiệu lực = giao của (SCP cho phép) và (IAM policy cho phép), trừ đi mọi Deny. Management account nằm ngoài phạm vi SCP, nên đừng chạy workload trong đó.

~~~json
{ "Effect": "Deny",
  "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail"],
  "Resource": "*" }
~~~

### Vì sao các phương án còn lại sai
- **SCP Allow s3:* cấp quyền**: SCP không bao giờ cấp quyền; user vẫn cần IAM policy.
- **Root của member account không bị ảnh hưởng**: sai, SCP giới hạn mọi principal trong member account, kể cả root (chỉ management account và service-linked role là ngoại lệ).
- **Thay thế IAM policy**: hai lớp cùng tồn tại và được đánh giá cùng nhau.

> Senior tip: thử SCP trên một OU sandbox trước, vì một Deny rộng có thể làm hỏng pipeline deploy của cả công ty. Kết hợp với organization trail của CloudTrail để log không phụ thuộc vào từng account.`
},

/* ===================== SECURITY ===================== */
{
  id: 'qz-security-009', topic: 'security',
  q: 'Trang chi tiết sản phẩm hiển thị bình luận của người dùng bằng {{element.innerHTML = comment.text}}. Một bình luận chứa {{<img src=x onerror=...>}} đánh cắp dữ liệu của người xem. Cách sửa đúng nhất?',
  options: [
    'Chặn ký tự < > bằng JavaScript ở form nhập bình luận phía client',
    'Chuyển trang sang HTTPS',
    'Encode output theo ngữ cảnh khi render (dùng {{textContent}} hoặc template engine tự escape; nếu cần HTML thì sanitize bằng allowlist), kèm Content-Security-Policy làm lớp phòng thủ thứ hai',
    'Lưu bình luận dạng base64 trong database'
  ],
  answer: 2,
  explain: `**Tóm tắt:** đây là **stored XSS**. Gốc rễ là dữ liệu không tin cậy được chèn vào HTML như mã. Cách sửa là **output encoding đúng ngữ cảnh** tại nơi render; CSP giảm thiệt hại nếu còn sót.

~~~text
el.textContent = comment.text;     // trình duyệt coi là văn bản, không parse HTML
~~~
Nếu phải cho phép một số thẻ (bold, link), dùng sanitizer có allowlist (DOMPurify phía client, OWASP Java HTML Sanitizer phía server). CSP như {{script-src 'self'}} chặn inline script và script lạ.

### Vì sao các phương án còn lại sai
- **Chặn ký tự ở client**: kẻ tấn công gọi thẳng API, bỏ qua JS của form. Validation phía client chỉ là UX.
- **HTTPS**: bảo vệ đường truyền, không liên quan việc trình duyệt thực thi payload.
- **Lưu base64**: khi đọc ra vẫn decode rồi chèn vào innerHTML, payload vẫn chạy.

> Senior tip: thêm cookie session {{HttpOnly}} để XSS không đọc được cookie, nhưng nhớ XSS vẫn có thể gửi request thay người dùng. Đưa CSP ở chế độ {{Content-Security-Policy-Report-Only}} trước để thu vi phạm rồi mới bật chặn.`
},
{
  id: 'qz-security-010', topic: 'security',
  q: 'Nâng cấp từ Spring Boot 2.7 lên 3.x, class cấu hình bảo mật {{extends WebSecurityConfigurerAdapter}} không còn biên dịch được. Cách viết đúng với Spring Security 6 là gì?',
  options: [
    'Thêm dependency spring-security-legacy để giữ class cũ',
    'Đổi sang {{extends WebSecurityConfigurer}} và giữ nguyên các method',
    'Hạ Spring Security về 5.x trong Spring Boot 3',
    'Khai báo {{@Bean SecurityFilterChain}} nhận {{HttpSecurity}}, cấu hình bằng lambda DSL ({{authorizeHttpRequests}}, {{requestMatchers}}) rồi {{return http.build()}}'
  ],
  answer: 3,
  explain: `**Tóm tắt:** {{WebSecurityConfigurerAdapter}} bị deprecate từ 5.7 và **bị xoá ở 6.0**. Cấu hình theo kiểu component: khai báo bean {{SecurityFilterChain}}.

~~~java
@Configuration
@EnableWebSecurity
class SecurityConfig {
  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
          .requestMatchers("/actuator/health").permitAll()   // thay cho antMatchers
          .requestMatchers("/admin/**").hasRole("ADMIN")
          .anyRequest().authenticated())
      .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
  }
}
~~~
Các thay đổi đi kèm: {{antMatchers/mvcMatchers}} thay bằng {{requestMatchers}}, {{authorizeRequests}} thay bằng {{authorizeHttpRequests}}, kiểu chuỗi {{and()}} đã bị deprecate từ 6.1 nên dùng lambda DSL. AuthenticationManager cũng khai báo bằng bean.

### Vì sao các phương án còn lại sai
- **spring-security-legacy**: không có artifact chính thức nào như vậy.
- **WebSecurityConfigurer**: interface cấp thấp, không có các method {{configure(HttpSecurity)}} tiện dụng như adapter; không phải hướng được khuyến nghị.
- **Hạ về 5.x**: Spring Boot 3 yêu cầu Spring Security 6 (Jakarta EE), không tương thích 5.x.

> Senior tip: có thể khai báo nhiều {{SecurityFilterChain}} với {{securityMatcher}} và {{@Order}} khác nhau (ví dụ API dùng JWT, trang admin dùng form login). Chạy OpenRewrite recipe migrate để đỡ sửa tay.`
},
{
  id: 'qz-security-011', topic: 'security', multi: true,
  q: 'Về CORS trong một API Spring Boot được SPA ở domain khác gọi, hai phát biểu nào đúng? (Chọn 2)',
  options: [
    'CORS được trình duyệt thực thi; nó không bảo vệ API khỏi curl, Postman hay server khác, nên API vẫn phải xác thực và phân quyền',
    'Cấu hình CORS đúng sẽ ngăn được mọi tấn công CSRF',
    'Spring từ chối cấu hình {{allowedOrigins("*")}} cùng {{allowCredentials(true)}}; nếu cần nhiều origin có credential, liệt kê cụ thể hoặc dùng {{allowedOriginPatterns}} cẩn thận',
    'Phản hồi lại đúng giá trị header Origin của mọi request kèm {{Access-Control-Allow-Credentials: true}} là an toàn',
    'Đã cấu hình CORS thì không cần xác thực API nữa'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** CORS là cơ chế **nới lỏng** Same-Origin Policy do **trình duyệt** áp dụng: server nói cho trình duyệt biết origin nào được **đọc** response. Nó không phải cơ chế xác thực.

### Cơ chế
- Request "không đơn giản" (ví dụ có header Authorization, Content-Type JSON) gây preflight {{OPTIONS}}; trình duyệt chỉ gửi request thật nếu response preflight cho phép.
- Với credential (cookie), spec cấm {{Access-Control-Allow-Origin: *}}; Spring kiểm tra và ném {{IllegalArgumentException}} khi gặp tổ hợp này.

### Vì sao các phương án còn lại sai
- **Ngăn mọi CSRF**: form POST đơn giản (urlencoded) vẫn được gửi đi kèm cookie; CORS chỉ chặn việc **đọc** response. Phòng CSRF cần token, SameSite cookie, kiểm tra Origin.
- **Phản chiếu Origin + credentials**: tương đương cho mọi website đọc dữ liệu của user đã đăng nhập, lỗ hổng kinh điển.
- **Không cần xác thực**: kẻ tấn công không dùng trình duyệt thì CORS không có tác dụng gì.

> Senior tip: đặt CORS tại một nơi (gateway hoặc Spring Security {{http.cors()}} với {{CorsConfigurationSource}}), tránh vừa cấu hình ở gateway vừa ở app gây header trùng mà trình duyệt từ chối.`
},
{
  id: 'qz-security-012', topic: 'security',
  q: 'Tính năng "xem trước link" cho phép người dùng nhập URL, server Spring Boot trên EC2 tải trang đó về. Pentester nhập {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} và lấy được credential. Biện pháp nào đúng và đủ nhất?',
  options: [
    'Kết hợp: chỉ cho phép http/https, phân giải DNS rồi chặn IP nội bộ/link-local/loopback (kiểm tra lại sau mỗi redirect hoặc tắt redirect), egress qua proxy có allowlist, và bắt buộc IMDSv2 với hop limit 1',
    'Kiểm tra chuỗi URL có chứa "169.254" thì chặn',
    'Chỉ cho phép URL bắt đầu bằng https',
    'Đặt timeout 2 giây cho HTTP client'
  ],
  answer: 0,
  explain: `**Tóm tắt:** đây là **SSRF**: server bị lợi dụng gửi request tới đích nội bộ. Cần phòng thủ nhiều lớp: kiểm tra **IP sau khi phân giải**, kiểm soát egress ở tầng mạng, và giảm giá trị của mục tiêu (IMDSv2).

### Vì sao kiểm tra chuỗi không đủ
Cùng một đích có nhiều cách viết: {{http://2852039166/}} (số thập phân), {{http://[::ffff:169.254.169.254]/}}, một domain trỏ về 169.254.169.254, hoặc URL hợp lệ trả về redirect 302 tới IP nội bộ. Còn DNS rebinding: lần kiểm tra phân giải ra IP công khai, lần tải lại phân giải ra IP nội bộ, nên phải kết nối đúng IP đã kiểm tra.

### IMDSv2
Bắt buộc lấy token bằng {{PUT}} có header riêng; SSRF thông thường chỉ gửi được GET. Hop limit 1 khiến container phía sau thêm một hop mạng không tới được IMDS.

### Vì sao các phương án còn lại sai
- **Chặn chuỗi "169.254"**: bị vượt qua bằng các dạng viết khác hoặc redirect như trên.
- **Chỉ https**: kẻ tấn công dùng domain của họ có HTTPS rồi redirect, hoặc nhắm vào dịch vụ nội bộ có HTTPS.
- **Timeout 2 giây**: metadata service trả lời trong vài mili giây.

> Senior tip: chạy tính năng tải URL trong một service tách riêng, ở subnet chỉ có egress ra internet qua proxy, không có IAM role nhiều quyền. Giới hạn kích thước và content-type của response để tránh bị dùng làm công cụ tải file lớn.`
},
{
  id: 'qz-security-013', topic: 'security',
  q: 'Ứng dụng mobile và SPA cần đăng nhập qua authorization server OAuth2/OIDC (Keycloak). Luồng nào được khuyến nghị hiện nay?',
  options: [
    'Implicit flow vì client public không giữ được secret',
    'Authorization Code + PKCE, client là public client không có client secret',
    'Resource Owner Password Credentials: app nhận username/password rồi gửi lên token endpoint',
    'Client Credentials với client secret nhúng trong app'
  ],
  answer: 1,
  explain: `**Tóm tắt:** OAuth 2.0 Security Best Current Practice (RFC 9700) khuyến nghị **Authorization Code + PKCE** cho mọi client, đặc biệt client public; Implicit và Password grant không nên dùng nữa.

### PKCE hoạt động thế nào
1. App tạo {{code_verifier}} ngẫu nhiên, gửi {{code_challenge = BASE64URL(SHA256(verifier))}} trong request authorize.
2. Server trả authorization code qua redirect.
3. App đổi code lấy token, gửi kèm {{code_verifier}}; server băm lại và so khớp.
Kẻ chặn được code (app độc đăng ký cùng custom scheme) không có verifier nên không đổi được token.

### Vì sao các phương án còn lại sai
- **Implicit**: token trả thẳng trong URL fragment, dễ lộ qua history/referrer, không có cách ràng buộc với client; đã bị khuyến nghị bỏ.
- **Password grant**: app thấy mật khẩu người dùng, không hỗ trợ MFA/SSO đúng nghĩa; bị loại khỏi OAuth 2.1.
- **Client Credentials + secret trong app**: dành cho máy-với-máy, không có người dùng; secret nhúng trong app bị decompile là lộ.

> Senior tip: với SPA, nhiều đội dùng pattern **BFF**: backend làm confidential client giữ token, trình duyệt chỉ có session cookie HttpOnly. Như vậy token không bao giờ nằm trong JavaScript.`
},
{
  id: 'qz-security-014', topic: 'security',
  q: 'Access token sống 10 phút, refresh token sống 30 ngày. Bạn lo refresh token bị đánh cắp từ thiết bị người dùng. Cơ chế nào giảm rủi ro hiệu quả nhất?',
  options: [
    'Kéo dài access token lên 30 ngày để khỏi cần refresh token',
    'Mã hoá refresh token bằng base64 trước khi trả về client',
    'Refresh token rotation: mỗi lần dùng cấp refresh token mới và vô hiệu cái cũ; nếu một token đã dùng bị dùng lại thì thu hồi cả chuỗi (token family) và buộc đăng nhập lại',
    'Lưu refresh token trong localStorage để dễ quản lý'
  ],
  answer: 2,
  explain: `**Tóm tắt:** **rotation + reuse detection** biến việc đánh cắp thành thứ bị phát hiện: kẻ trộm và người dùng thật sẽ cùng dùng một token, lần dùng thứ hai lộ ra và server thu hồi cả family.

### Kịch bản
~~~text
User dùng RT1 -> nhận RT2 (RT1 hết hiệu lực)
Kẻ trộm dùng RT1 (đã bị đánh cắp) -> server thấy RT1 đã dùng -> thu hồi RT2 và cả family
=> cả hai phải đăng nhập lại; kẻ trộm mất quyền truy cập
~~~
Server cần lưu trạng thái refresh token (bảng có family id, used flag, expiry). Có thể thêm absolute lifetime cho family và ràng buộc thiết bị (DPoP/mTLS sender-constrained token).

### Vì sao các phương án còn lại sai
- **Access token 30 ngày**: JWT khó thu hồi; lộ là kẻ trộm dùng được cả tháng, còn tệ hơn.
- **base64**: không phải mã hoá, ai cũng giải được.
- **localStorage**: bất kỳ XSS nào cũng đọc được; đây là chỗ lưu kém an toàn.

> Senior tip: xử lý race hợp lệ (hai tab cùng refresh trong vài trăm ms) bằng grace period ngắn cho token vừa bị thay, nếu không sẽ đá người dùng ra liên tục. Ghi log và cảnh báo sự kiện reuse vì đó thường là dấu hiệu bị tấn công thật.`
},
{
  id: 'qz-security-015', topic: 'security',
  q: 'Một CVE nghiêm trọng (CVSS 10) được công bố trong thư viện logging mà dự án dùng gián tiếp qua dependency khác. Bạn có 40 microservice. Cách tiếp cận đúng nhất?',
  options: [
    'Chờ thư viện cha phát hành bản mới rồi mới nâng cấp',
    'Chỉ nâng cấp các service có internet truy cập trực tiếp',
    'Đặt WAF chặn payload rồi coi như xong',
    'Dùng SBOM/công cụ SCA để tìm mọi service chứa thư viện (kể cả transitive), override version đã vá qua dependencyManagement hoặc BOM, áp dụng giảm thiểu tạm thời nếu chưa vá kịp, và đưa scan vào CI'
  ],
  answer: 3,
  explain: `**Tóm tắt:** trước hết phải **biết mình đang dùng gì ở đâu** (SBOM), sau đó vá nhanh bằng cách ép version transitive, có giảm thiểu tạm thời, và để CI chặn tái diễn. Đây là nhóm rủi ro "Vulnerable and Outdated Components" trong OWASP Top 10.

~~~text
mvn dependency:tree -Dincludes=org.apache.logging.log4j
# override transitive version trong pom cha
<dependencyManagement> ... log4j-bom version đã vá ... </dependencyManagement>
~~~
Công cụ: OWASP Dependency-Check, Dependabot/Renovate, Trivy/Grype quét cả image (thư viện có thể nằm trong base image, không chỉ trong jar).

### Vì sao các phương án còn lại sai
- **Chờ thư viện cha**: có thể mất nhiều tuần; trong lúc đó exploit đã công khai.
- **Chỉ service public**: payload có thể đi qua log của service nội bộ (header, message queue) rồi được xử lý ở đó.
- **Chỉ WAF**: payload có vô số biến thể vượt qua chữ ký; WAF là giảm thiểu tạm thời, không thay thế vá.

> Senior tip: lưu SBOM (CycloneDX/SPDX) cho mỗi build, để lần sau trả lời câu hỏi "chúng ta có bị ảnh hưởng không" trong vài phút thay vì vài ngày. Quy định SLA vá theo mức độ (ví dụ critical trong 48 giờ).`
},
{
  id: 'qz-security-016', topic: 'security',
  q: 'API nhận JSON và dùng Jackson với default typing bật cho mọi {{Object}} để giữ thông tin kiểu (JSON có trường {{@class}}). Rủi ro lớn nhất và cách sửa?',
  options: [
    'Kẻ tấn công chỉ định class tuỳ ý trong {{@class}} để kích hoạt gadget chain dẫn tới RCE; tắt default typing, dùng DTO kiểu cụ thể, hoặc {{@JsonTypeInfo}} với tên kiểu logic và PolymorphicTypeValidator dạng allowlist',
    'JSON lớn làm tốn bộ nhớ; chỉ cần giới hạn kích thước request',
    'Không có rủi ro vì Jackson chỉ tạo object của các class trong package của ứng dụng',
    'Rủi ro là lộ tên class; chỉ cần đổi tên package cho khó đoán'
  ],
  answer: 0,
  explain: `**Tóm tắt:** polymorphic deserialization với kiểu do **client quyết định** là insecure deserialization: Jackson khởi tạo class được chỉ định và gọi setter/constructor của nó; một số class trên classpath (gadget) có side effect nguy hiểm như JNDI lookup, dẫn tới RCE. Nhiều CVE của jackson-databind thuộc loại này.

### Cách sửa
~~~java
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")  // tên logic, không phải tên class
@JsonSubTypes({
  @JsonSubTypes.Type(value = CardPayment.class, name = "card"),
  @JsonSubTypes.Type(value = BankPayment.class, name = "bank") })
sealed interface Payment permits CardPayment, BankPayment {}
~~~
Nếu buộc dùng default typing (ví dụ cache), dùng {{activateDefaultTyping}} với {{BasicPolymorphicTypeValidator}} chỉ cho phép package của bạn.

### Vì sao các phương án còn lại sai
- **Chỉ là bộ nhớ**: giới hạn kích thước không ngăn được payload nhỏ chỉ định gadget class.
- **Chỉ class trong package ứng dụng**: với default typing không kèm validator, mọi class trên classpath (kể cả thư viện) đều là ứng viên.
- **Đổi tên package**: obscurity; gadget nằm trong thư viện bên thứ ba, không phụ thuộc tên package của bạn.

> Senior tip: cấu hình Redis cache của Spring với {{GenericJackson2JsonRedisSerializer}} cũng ghi thông tin kiểu; đảm bảo chỉ dữ liệu tin cậy được ghi vào cache và giữ jackson-databind luôn ở bản mới.`
},
{
  id: 'qz-security-017', topic: 'security',
  q: 'Bạn là tech lead của SaaS multi-tenant dùng chung một database PostgreSQL (cột {{tenant_id}}). Audit phát hiện vài endpoint lấy tenantId từ query param. Thiết kế cách ly tenant đúng nhất?',
  options: [
    'Thêm kiểm tra tenantId trong frontend trước khi gọi API',
    'Lấy tenant từ token đã xác thực ở server và áp dụng ở tầng dữ liệu một cách tự động (Hibernate {{@TenantId}}/filter hoặc PostgreSQL Row-Level Security), kèm test tự động cho truy cập chéo tenant',
    'Mã hoá tenantId trong URL để người dùng không sửa được',
    'Yêu cầu mọi developer nhớ thêm {{WHERE tenant_id = ?}} trong code review'
  ],
  answer: 1,
  explain: `**Tóm tắt:** tenant phải đến từ **danh tính đã xác thực** (claim trong token/session), không bao giờ từ input client; và việc lọc phải **mặc định ở tầng dữ liệu**, để một query quên điều kiện vẫn không lộ dữ liệu.

### Hai lớp bảo vệ
- **Ứng dụng**: Hibernate 6 hỗ trợ {{@TenantId}} cho discriminator-based multitenancy, tự thêm điều kiện tenant vào query và đặt giá trị khi insert, với {{CurrentTenantIdentifierResolver}} đọc từ SecurityContext.
- **Database**: PostgreSQL RLS
~~~sql
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON invoice
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- mỗi transaction: SET LOCAL app.tenant_id = '...'
~~~
Lưu ý: chủ bảng và superuser bỏ qua RLS mặc định; app nên dùng role riêng (hoặc FORCE ROW LEVEL SECURITY).

### Vì sao các phương án còn lại sai
- **Kiểm tra ở frontend**: kẻ tấn công gọi thẳng API.
- **Mã hoá tenantId trong URL**: vẫn là input client; có thể bị replay giữa các tài nguyên, và vẫn không xác minh người dùng thuộc tenant đó.
- **Dựa vào code review**: con người sẽ quên; một query native hoặc báo cáo mới là đủ để lộ.

> Senior tip: viết test tích hợp "tenant A không bao giờ thấy dữ liệu tenant B" chạy trên mọi endpoint bằng cách sinh tự động; đây là lỗi có hậu quả pháp lý nặng nhất của SaaS. Nhớ cả cache key và tên file trên S3 cũng phải có tenant.`
},
{
  id: 'qz-security-018', topic: 'security', multi: true,
  q: 'Trang đăng nhập bị credential stuffing: hàng nghìn IP thử cặp email/mật khẩu bị lộ từ site khác. Hai biện pháp nào hiệu quả và không gây hại người dùng thật? (Chọn 2)',
  options: [
    'Khoá vĩnh viễn tài khoản sau 3 lần đăng nhập sai',
    'Rate limiting/độ trễ tăng dần theo cả tài khoản và IP/fingerprint, kèm CAPTCHA hoặc bot detection khi phát hiện bất thường',
    'Trả thông báo khác nhau cho "email không tồn tại" và "sai mật khẩu" để người dùng dễ hiểu',
    'Bật MFA (ưu tiên passkey/TOTP) và kiểm tra mật khẩu với danh sách mật khẩu đã bị lộ khi đăng ký/đổi mật khẩu',
    'Chuyển sang lưu mật khẩu bằng SHA-256 để xác minh nhanh hơn'
  ],
  answer: [1, 3],
  explain: `**Tóm tắt:** credential stuffing dùng mật khẩu **đúng** bị lộ từ nơi khác, nên giới hạn tốc độ làm chậm cuộc tấn công, còn **MFA** khiến mật khẩu đúng cũng không đủ. Kiểm tra mật khẩu bị lộ ngăn người dùng dùng lại mật khẩu đó.

### Vì sao các phương án còn lại sai
- **Khoá vĩnh viễn sau 3 lần**: kẻ tấn công cố tình khoá hàng loạt tài khoản (DoS người dùng thật); nên dùng khoá tạm thời/tăng dần.
- **Thông báo khác nhau**: cho phép **user enumeration**, giúp kẻ tấn công lọc danh sách email hợp lệ. Dùng thông báo chung "Email hoặc mật khẩu không đúng".
- **SHA-256**: hash nhanh là điểm yếu khi DB bị lộ (brute force GPU); nên dùng bcrypt/Argon2id. Và nó không liên quan tới việc chặn stuffing.

### Gợi ý triển khai
Đếm lỗi theo nhiều khoá (email, IP, ASN, device fingerprint) bằng Redis có TTL; WAF/bot management ở edge chặn bớt lưu lượng tự động trước khi tới app.

> Senior tip: theo dõi metric tỉ lệ đăng nhập thất bại theo thời gian; credential stuffing thường lộ ra bằng tỉ lệ thất bại tăng vọt với nhiều email khác nhau. Thông báo cho người dùng khi đăng nhập từ thiết bị lạ.`
},
{
  id: 'qz-security-019', topic: 'security',
  q: 'API Spring Boot stateless, client gửi JWT trong header {{Authorization: Bearer}}, không dùng cookie. Một đồng nghiệp hỏi có nên giữ CSRF protection không. Câu trả lời đúng nhất?',
  options: [
    'Luôn phải bật CSRF cho mọi API, nếu không sẽ bị tấn công',
    'CSRF chỉ áp dụng cho request GET nên không liên quan',
    'Có thể tắt CSRF: trình duyệt không tự đính kèm header Authorization vào request từ site khác; nhưng nếu chuyển sang lưu token trong cookie thì phải bật lại (hoặc dùng SameSite + CSRF token)',
    'Tắt CSRF làm JWT không còn được kiểm tra chữ ký'
  ],
  answer: 2,
  explain: `**Tóm tắt:** CSRF khai thác việc **trình duyệt tự gửi credential** (cookie, HTTP Basic đã nhớ) kèm request do site khác kích hoạt. Header Authorization do JS của chính app gắn vào, site khác không làm được, nên API bearer-token thuần không bị CSRF.

~~~java
http.csrf(csrf -> csrf.disable())                         // chỉ khi xác thực KHÔNG dựa vào cookie
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
~~~

### Vì sao các phương án còn lại sai
- **Luôn phải bật**: CSRF protection của Spring Security bật mặc định vì nhiều app dùng session cookie; với bearer token thuần thì nó không thêm bảo vệ.
- **Chỉ áp dụng cho GET**: ngược lại, CSRF nhắm vào request **thay đổi trạng thái** (POST/PUT/DELETE); Spring bỏ qua GET/HEAD/OPTIONS vì chúng không được phép thay đổi dữ liệu.
- **Tắt CSRF làm JWT không được kiểm tra**: hai cơ chế độc lập; filter xác thực JWT vẫn chạy bình thường.

> Senior tip: khi chuyển sang BFF (token trong server, trình duyệt có session cookie), nhớ **bật lại** CSRF, dùng {{CookieCsrfTokenRepository}} cho SPA, và đặt cookie {{SameSite=Lax}} hoặc Strict.`
},
{
  id: 'qz-security-020', topic: 'security',
  q: 'Sau một sự cố, phát hiện log tập trung (ELK) chứa nguyên header {{Authorization}}, số thẻ và CCCD của khách hàng, và cả team dev đều đọc được. Hướng xử lý đúng nhất?',
  options: [
    'Xoá toàn bộ log và tắt logging request cho an toàn',
    'Chỉ cần mã hoá ổ đĩa của cluster ELK',
    'Đổi log sang mức DEBUG để log ít hơn',
    'Thu hồi/xoay các token đã lộ, redact dữ liệu nhạy cảm ngay ở tầng logging (mask header, field PII), giới hạn quyền truy cập và thời gian lưu log, và thêm kiểm tra tự động phát hiện PII trong log'
  ],
  answer: 3,
  explain: `**Tóm tắt:** xử lý **cả hậu quả lẫn nguyên nhân**: credential đã lộ phải xoay; dữ liệu nhạy cảm phải được che **trước khi** ghi log; truy cập log cũng là truy cập dữ liệu nên phải phân quyền và có retention.

### Biện pháp cụ thể
- Logback: dùng masking pattern hoặc encoder tuỳ chỉnh che các field như {{authorization}}, {{cardNumber}}; với logstash-logback-encoder có thể cấu hình mask theo tên field/regex.
- Không log nguyên request/response body; log id và metadata thay vì dữ liệu.
- Xoá/redact các bản ghi cũ đã chứa PII, đánh giá nghĩa vụ thông báo theo quy định (PCI DSS với số thẻ, luật bảo vệ dữ liệu cá nhân).

### Vì sao các phương án còn lại sai
- **Xoá hết, tắt logging**: mất khả năng điều tra và giám sát an ninh, vốn chính là một hạng mục trong OWASP Top 10 (logging và monitoring failures).
- **Mã hoá ổ đĩa**: chỉ chống đánh cắp đĩa vật lý; người có quyền đọc ELK vẫn thấy plain text.
- **DEBUG để log ít hơn**: DEBUG là mức **chi tiết hơn**, sẽ log nhiều hơn.

> Senior tip: thêm test kiểm tra log output của các endpoint nhạy cảm không chứa chuỗi giống token/PAN, và bật scanner PII trên pipeline log. Log là nơi rò dữ liệu phổ biến nhưng ít được để ý nhất.`
},
{
  id: 'qz-security-021', topic: 'security',
  q: 'Service có {{@PreAuthorize("hasRole(\'ADMIN\')")}} trên method {{deleteUser()}}. Trong cùng class, method {{cleanup()}} (không có annotation) gọi {{this.deleteUser()}}, và user thường gọi được {{cleanup()}} xoá user. Vì sao?',
  options: [
    'Method security dựa trên Spring AOP proxy; lời gọi nội bộ qua {{this}} không đi qua proxy nên annotation không được kiểm tra',
    'Thiếu {{@Transactional}} nên Spring Security bỏ qua',
    'hasRole tự thêm tiền tố nên ADMIN phải viết là ROLE_ROLE_ADMIN',
    '@PreAuthorize chỉ hoạt động trên controller, không hoạt động trên service'
  ],
  answer: 0,
  explain: `**Tóm tắt:** cùng bẫy với {{@Transactional}}: method security được thực hiện bởi **proxy** bao quanh bean. Bên ngoài gọi qua proxy nên có kiểm tra; gọi {{this.deleteUser()}} bên trong là gọi thẳng object thật, bỏ qua interceptor.

~~~text
Controller --> [Proxy: kiểm tra @PreAuthorize] --> UserService.cleanup()
                                                     --> this.deleteUser()   (KHÔNG qua proxy)
~~~

### Cách sửa
- Đặt kiểm tra quyền ở **mọi method public là điểm vào** ({{cleanup()}} cũng cần annotation), hoặc ở class-level.
- Tách {{deleteUser}} sang bean khác để lời gọi đi qua proxy.
- Spring Security 6 dùng {{@EnableMethodSecurity}} (thay cho {{@EnableGlobalMethodSecurity}} cũ); thiếu annotation này thì {{@PreAuthorize}} bị bỏ qua hoàn toàn.

### Vì sao các phương án còn lại sai
- **Thiếu @Transactional**: hai cơ chế độc lập; transaction không ảnh hưởng việc kiểm tra quyền.
- **ROLE_ROLE_ADMIN**: {{hasRole('ADMIN')}} tự thêm tiền tố {{ROLE_}} để so với authority {{ROLE_ADMIN}}; viết thêm ROLE_ là sai theo hướng khác.
- **Chỉ trên controller**: @PreAuthorize hoạt động trên mọi Spring bean được proxy, và đặt ở service là thực hành tốt.

> Senior tip: viết test phân quyền ở tầng service với {{@WithMockUser(roles = "USER")}} cho từng method public; lỗi kiểu self-invocation chỉ lộ ra khi có test gọi đúng đường đó.`
},
{
  id: 'qz-security-022', topic: 'security', multi: true,
  q: 'Bạn làm cứng (harden) pipeline GitHub Actions của một repo public trước nguy cơ supply-chain attack. Hai biện pháp nào đúng? (Chọn 2)',
  options: [
    'Pin action bên thứ ba theo full commit SHA thay vì tag như {{@v4}}',
    'Dùng trigger {{pull_request_target}} để chạy build trên code của PR từ fork, vì nó có sẵn secrets',
    'Khai báo {{permissions}} tối thiểu cho {{GITHUB_TOKEN}} ở cấp workflow/job (ví dụ chỉ {{contents: read}}), chỉ cấp thêm quyền ghi cho job cần',
    'Dùng self-hosted runner cố định cho repo public để build nhanh hơn',
    'In secrets ra log ở dạng base64 để debug'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** giảm tin tưởng vào code bên thứ ba (pin SHA, bất biến) và giảm quyền mặc định (least privilege cho {{GITHUB_TOKEN}}), để một bước bị chiếm quyền không làm được nhiều.

~~~yaml
permissions:
  contents: read
jobs:
  build:
    steps:
      - uses: actions/checkout@<full-40-char-sha>   # comment kèm tên version để dễ đọc
~~~
Tag có thể bị dịch chuyển sang commit độc hại nếu repo của action bị chiếm (đã có sự cố thật với action phổ biến). Dependabot vẫn cập nhật được action pin theo SHA.

### Vì sao các phương án còn lại sai
- **pull_request_target chạy code PR từ fork**: workflow chạy trong ngữ cảnh repo gốc với secrets và token có quyền ghi; checkout và build code của PR là trao quyền cho người lạ (kiểu "pwn request").
- **Self-hosted runner cho repo public**: GitHub khuyến cáo không dùng; PR từ fork có thể chạy code tuỳ ý trên máy của bạn và để lại tiến trình/persistence cho job sau.
- **In secrets dạng base64**: GitHub chỉ che giá trị nguyên văn; base64 làm lộ secret trong log.

> Senior tip: kết hợp OIDC thay secret dài hạn, required reviewers cho environment production, và CODEOWNERS cho thư mục {{.github/workflows}} để thay đổi pipeline luôn được review.`
},

/* ===================== PRIMER ===================== */
{
  id: 'qz-primer-001', topic: 'primer',
  q: 'Bạn vào một container đang chạy bằng {{docker exec}}, sửa file cấu hình, rồi {{docker rm}} container và chạy lại container mới từ cùng image. Thay đổi lúc nãy còn không?',
  options: [
    'Còn, vì Docker tự lưu thay đổi ngược vào image',
    'Mất: thay đổi nằm ở lớp ghi (writable layer) riêng của container cũ; image là bất biến. Muốn giữ dữ liệu dùng volume, muốn đổi cấu hình thì sửa Dockerfile hoặc truyền qua biến môi trường',
    'Còn, nếu container mới có cùng tên với container cũ',
    'Mất, vì Docker xoá cả image khi xoá container'
  ],
  answer: 1,
  explain: `**Tóm tắt:** **image** giống như "khuôn" chỉ đọc, **container** là một lần chạy của khuôn đó cộng thêm một lớp ghi mỏng. Xoá container là xoá lớp ghi; container mới bắt đầu lại từ image sạch.

### Hình dung
~~~text
Container cũ:  [lớp ghi: file đã sửa]  <- bị xoá cùng container
               [image layers, chỉ đọc]
Container mới: [lớp ghi trống]
               [image layers, chỉ đọc] (y như cũ)
~~~
- Dữ liệu cần tồn tại (database, file upload): dùng **volume** ({{-v data:/var/lib/postgresql/data}}).
- Cấu hình: biến môi trường ({{-e SPRING_PROFILES_ACTIVE=prod}}) hoặc mount file cấu hình.

### Vì sao các phương án còn lại sai
- **Tự lưu vào image**: Docker không bao giờ tự sửa image. ({{docker commit}} tạo image mới, nhưng là thao tác thủ công và không nên dùng thay Dockerfile.)
- **Cùng tên**: tên chỉ là nhãn; container mới vẫn là container mới.
- **Xoá cả image**: {{docker rm}} chỉ xoá container; xoá image là {{docker rmi}}.

> Senior tip: coi container là "dùng xong vứt" (immutable infrastructure). Thay đổi gì cũng phải đi qua Dockerfile/cấu hình trong Git, nhờ vậy mọi môi trường giống nhau và tái tạo được.`
},
{
  id: 'qz-primer-002', topic: 'primer',
  q: 'Trong Kubernetes, bạn có Deployment với {{replicas: 3}} và xoá tay một Pod bằng {{kubectl delete pod}}. Chuyện gì xảy ra, và vì sao các service khác nên gọi qua Service thay vì IP của Pod?',
  options: [
    'Pod bị xoá vĩnh viễn, Deployment chỉ còn 2 Pod cho tới khi deploy lại',
    'Kubernetes khởi động lại đúng Pod đó với cùng IP',
    'Deployment (qua ReplicaSet) thấy chỉ còn 2 Pod nên tạo Pod mới với tên và IP mới; Service giữ một địa chỉ ổn định và tự trỏ tới các Pod đang sẵn sàng',
    'Cả Deployment bị xoá theo vì Pod là một phần của nó'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Kubernetes hoạt động theo kiểu **trạng thái mong muốn**: bạn khai báo "muốn 3 Pod", controller liên tục so sánh với thực tế và sửa cho khớp. Pod là thứ dùng xong thay được, nên IP của nó không ổn định.

### Từng bước
1. Bạn xoá Pod {{orders-7d9f-abc}}.
2. ReplicaSet controller thấy 2/3 Pod, tạo Pod mới {{orders-7d9f-xyz}} với IP khác.
3. Service {{orders}} (tên DNS ổn định, ví dụ {{orders.default.svc.cluster.local}}) tự cập nhật danh sách Pod đích theo label, nên bên gọi không cần biết gì.

### Vì sao các phương án còn lại sai
- **Chỉ còn 2 Pod**: đó chính là việc Deployment ngăn chặn; nó luôn kéo số Pod về đúng replicas.
- **Khởi động lại đúng Pod với cùng IP**: Pod bị xoá thì mất hẳn; Pod mới có tên và IP mới. (Restart container trong cùng Pod khi app chết thì khác, đó là việc của kubelet.)
- **Xoá cả Deployment**: quan hệ là Deployment sở hữu ReplicaSet, ReplicaSet sở hữu Pod; xoá con không xoá cha.

> Senior tip: muốn khởi động lại toàn bộ Pod một cách an toàn, dùng {{kubectl rollout restart deployment/orders}} thay vì xoá từng Pod; nó thay lần lượt theo chiến lược rolling update.`
},
{
  id: 'qz-primer-003', topic: 'primer',
  q: 'Topic Kafka {{orders}} có 3 partition. Bạn chạy 5 instance của cùng một service, đều dùng chung {{group.id=order-processor}}. Điều gì xảy ra?',
  options: [
    'Mỗi message được cả 5 instance xử lý',
    'Kafka tự tăng số partition lên 5',
    'Message được chia đều cho 5 instance theo kiểu round-robin',
    'Mỗi partition chỉ được gán cho một consumer trong group, nên 3 instance nhận mỗi cái một partition và 2 instance còn lại rảnh'
  ],
  answer: 3,
  explain: `**Tóm tắt:** trong một consumer group, **một partition chỉ được một consumer đọc** tại một thời điểm (để giữ thứ tự trong partition). Vì vậy số consumer hữu ích tối đa bằng số partition.

~~~text
partition 0 -> instance A
partition 1 -> instance B
partition 2 -> instance C
instance D, E: không có partition (dự phòng, sẽ nhận việc nếu A/B/C chết và rebalance)
~~~

### Vì sao các phương án còn lại sai
- **Cả 5 cùng xử lý**: đó là hành vi khi mỗi instance có **group.id khác nhau** (mỗi group nhận đủ message). Cùng group thì chia việc.
- **Tự tăng partition**: Kafka không tự tăng; tăng partition là thao tác thủ công và làm thay đổi việc phân phối theo key.
- **Round-robin cho 5 instance**: Kafka chia theo partition, không chia từng message.

> Senior tip: chọn số partition theo thông lượng mục tiêu và số consumer tối đa dự kiến (thường để dư, ví dụ 12 hoặc 24). Nếu xử lý chậm, tăng consumer chỉ có tác dụng khi còn partition chưa có ai đọc.`
},
{
  id: 'qz-primer-004', topic: 'primer',
  q: 'Bạn muốn xem đồng nghiệp đã push gì lên remote nhưng **chưa** muốn thay đổi code đang làm dở trên nhánh hiện tại. Lệnh nào phù hợp?',
  options: [
    '{{git fetch}}: tải commit mới về các nhánh remote-tracking (như {{origin/main}}) mà không đụng tới nhánh và file đang làm; sau đó xem bằng {{git log HEAD..origin/main}}',
    '{{git pull}}, vì pull chỉ tải về chứ không thay đổi gì',
    '{{git push}} để đồng bộ hai chiều',
    '{{git clone}} lại repo vào thư mục hiện tại'
  ],
  answer: 0,
  explain: `**Tóm tắt:** {{git pull}} = {{git fetch}} + {{git merge}} (hoặc rebase nếu cấu hình). Muốn chỉ **xem** mà không gộp vào nhánh của mình thì dùng {{git fetch}}.

~~~bash
git fetch origin
git log --oneline HEAD..origin/main   # commit có trên remote mà mình chưa có
git diff HEAD...origin/main           # xem nội dung thay đổi
git merge origin/main                 # khi đã sẵn sàng gộp
~~~

### Vì sao các phương án còn lại sai
- **git pull chỉ tải về**: pull còn merge/rebase ngay vào nhánh hiện tại, có thể gây conflict giữa lúc bạn đang làm dở.
- **git push**: đẩy commit của bạn lên remote, ngược chiều với nhu cầu; Git không có đồng bộ hai chiều tự động.
- **git clone lại**: tạo bản sao mới, không dùng được trong thư mục đã có repo, và hoàn toàn thừa.

> Senior tip: đặt {{git config --global pull.rebase true}} (hoặc {{pull.ff only}}) để tránh merge commit thừa kiểu "Merge branch main of ...". Thói quen fetch trước rồi mới quyết định merge giúp bạn chủ động hơn khi làm việc nhóm.`
},
{
  id: 'qz-primer-005', topic: 'primer', multi: true,
  q: 'Khi thiết kế REST API, hai cách dùng HTTP status code nào là đúng? (Chọn 2)',
  options: [
    '401 Unauthorized: request chưa được xác thực (thiếu token hoặc token không hợp lệ/hết hạn)',
    '404 Not Found khi người dùng nhập sai mật khẩu',
    '403 Forbidden: đã biết người gọi là ai nhưng họ không có quyền làm hành động này',
    '500 Internal Server Error khi client gửi thiếu trường bắt buộc',
    '200 OK kèm body {{"error": "not found"}} cho mọi lỗi'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** nhóm **4xx** là lỗi do client, **5xx** là lỗi do server. 401 = "bạn là ai?", 403 = "tôi biết bạn là ai, nhưng bạn không được phép".

| Code | Khi nào dùng |
|---|---|
| 200 / 201 / 204 | thành công / đã tạo mới / thành công không có body |
| 400 | dữ liệu gửi lên không hợp lệ (thiếu trường, sai định dạng) |
| 401 | chưa xác thực hoặc token hỏng/hết hạn |
| 403 | đã xác thực nhưng không đủ quyền |
| 404 | tài nguyên không tồn tại |
| 409 | xung đột (ví dụ trùng email) |
| 500 | lỗi không lường trước ở server |

### Vì sao các phương án còn lại sai
- **404 khi sai mật khẩu**: sai mật khẩu là lỗi xác thực, dùng 401 (hoặc 400 tuỳ thiết kế endpoint login); 404 làm client hiểu sai là endpoint không tồn tại.
- **500 khi thiếu trường**: lỗi do client, phải là 400; trả 500 làm sai lệch metric lỗi server và gây alert nhầm.
- **200 cho mọi lỗi**: client, cache, load balancer và công cụ giám sát đều dựa vào status code; giấu lỗi trong body làm hỏng tất cả.

> Senior tip: trong Spring Boot 3, trả lỗi theo chuẩn **Problem Details (RFC 9457)** với {{ProblemDetail}} để mọi service có cùng định dạng lỗi.`
},
{
  id: 'qz-primer-006', topic: 'primer',
  q: 'Chạy app Spring Boot trên server Linux thì báo lỗi {{Port 8080 was already in use}}. Bạn tìm tiến trình đang chiếm cổng bằng cách nào?',
  options: [
    'Khởi động lại server là cách duy nhất',
    'Dùng {{sudo ss -ltnp | grep 8080}} (hoặc {{sudo lsof -i :8080}}) để xem PID và tên tiến trình đang listen, rồi quyết định dừng nó hay đổi cổng cho app',
    'Chạy {{ping localhost:8080}}',
    'Xoá file {{/etc/hosts}} để giải phóng cổng'
  ],
  answer: 1,
  explain: `**Tóm tắt:** mỗi cổng TCP chỉ một tiến trình được listen (trên cùng địa chỉ). Tìm **PID** của tiến trình đang giữ cổng rồi xử lý cụ thể nó.

~~~bash
sudo ss -ltnp | grep 8080
# LISTEN 0 100 *:8080 *:* users:(("java",pid=21345,fd=45))
ps -fp 21345            # xem lệnh đầy đủ để biết đó là app nào
kill 21345              # gửi SIGTERM, cho app tắt êm; chỉ dùng kill -9 khi bị treo
~~~
Thường đó là một bản app cũ chưa tắt (chạy từ IDE hoặc nohup). Hoặc đổi cổng: {{--server.port=8081}}.

### Vì sao các phương án còn lại sai
- **Khởi động lại server**: quá tay, làm gián đoạn mọi thứ khác đang chạy, và tiến trình đó (nếu là service tự khởi động) sẽ chiếm lại cổng.
- **ping**: ping dùng ICMP, không có khái niệm cổng; cú pháp {{localhost:8080}} cũng không hợp lệ với ping.
- **Xoá /etc/hosts**: file này ánh xạ tên miền sang IP, không liên quan tới cổng, và xoá nó làm hỏng phân giải {{localhost}}.

> Senior tip: chỉ kill theo **PID cụ thể** sau khi đã xem nó là gì; đừng kill theo tên ({{pkill java}}) vì có thể tắt cả những app Java khác trên máy. Với service chạy bằng systemd, dùng {{systemctl stop <tên>}}.`
},
{
  id: 'qz-primer-007', topic: 'primer',
  q: 'Dự án Maven có 2 dependency cùng kéo thư viện Jackson nhưng khác version: A kéo 2.15 ở độ sâu 2, B kéo 2.17 ở độ sâu 3. Maven sẽ dùng version nào và bạn kiểm soát thế nào?',
  options: [
    'Luôn chọn version mới nhất (2.17), giống Gradle',
    'Báo lỗi build và bắt bạn chọn',
    'Chọn 2.15 vì gần gốc hơn trong cây dependency (nearest wins); để chủ động, khai báo version trong {{dependencyManagement}} hoặc import BOM (Spring Boot đã quản lý sẵn version Jackson)',
    'Dùng cả hai version cùng lúc trên classpath'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Maven giải xung đột theo **nearest definition**: version nào gần project nhất trong cây dependency thắng; bằng độ sâu thì cái được khai báo trước thắng. Điều này có thể chọn **version cũ hơn**, gây lỗi {{NoSuchMethodError}} lúc chạy.

~~~bash
mvn dependency:tree -Dincludes=com.fasterxml.jackson.core   # xem ai kéo version nào
~~~
~~~text
<dependencyManagement>
  <dependencies> jackson-bom version 2.17.x, scope import, type pom </dependencies>
</dependencyManagement>
~~~

### Vì sao các phương án còn lại sai
- **Luôn mới nhất**: đó là chiến lược mặc định của **Gradle** (highest version), không phải Maven.
- **Báo lỗi build**: Maven mặc định không báo lỗi; muốn bắt buộc thì phải thêm maven-enforcer-plugin với rule như dependencyConvergence.
- **Dùng cả hai**: classpath thông thường chỉ có một bản của mỗi artifact; nếu thực sự có hai jar cùng class thì class nào được nạp phụ thuộc thứ tự, còn tệ hơn.

> Senior tip: trong dự án Spring Boot, đừng tự ghi version cho thư viện mà Boot đã quản lý; muốn đổi thì override property (ví dụ {{jackson-bom.version}}) để mọi module Jackson đổi đồng bộ.`
},
{
  id: 'qz-primer-008', topic: 'primer',
  q: 'Bạn thêm Redis làm cache cho API {{GET /products/42}} theo mô hình cache-aside. Luồng xử lý đúng là gì?',
  options: [
    'Ghi mọi sản phẩm vào Redis lúc khởi động và không bao giờ đọc database nữa',
    'Luôn đọc database trước, sau đó mới đọc Redis để so sánh',
    'Chỉ ghi vào Redis, database cập nhật sau mỗi 24 giờ',
    'Đọc Redis trước; nếu có (hit) thì trả về; nếu không (miss) thì đọc database, ghi vào Redis kèm TTL rồi trả về; khi sản phẩm được cập nhật thì xoá (evict) key tương ứng'
  ],
  answer: 3,
  explain: `**Tóm tắt:** cache-aside nghĩa là **ứng dụng tự quản lý cache**: đọc cache trước, miss thì lấy từ DB và nạp vào cache; khi ghi thì cập nhật DB rồi xoá key cache để lần đọc sau nạp lại bản mới.

~~~java
@Cacheable(cacheNames = "product", key = "#id")      // hit: trả từ Redis, miss: chạy method rồi lưu
public ProductDto get(long id) { return repo.findById(id).map(mapper::toDto).orElseThrow(); }

@CacheEvict(cacheNames = "product", key = "#cmd.id") // cập nhật DB xong thì xoá key
public void update(UpdateProduct cmd) { ... }
~~~
TTL (ví dụ {{spring.cache.redis.time-to-live=10m}}) là lưới an toàn: kể cả khi quên evict, dữ liệu cũ cũng chỉ tồn tại tối đa 10 phút.

### Vì sao các phương án còn lại sai
- **Nạp hết lúc khởi động, bỏ DB**: Redis lưu trong RAM, dữ liệu có thể mất; dữ liệu mới thêm không bao giờ được nạp; tốn bộ nhớ cho cả dữ liệu ít ai đọc.
- **Đọc DB trước rồi Redis**: mất hoàn toàn lợi ích của cache vì DB vẫn bị gọi mỗi request.
- **Chỉ ghi Redis, DB cập nhật sau 24 giờ**: Redis không phải nguồn sự thật; mất dữ liệu nếu Redis sập.

> Senior tip: xoá key thay vì cập nhật key khi ghi, vì hai request ghi song song có thể đặt giá trị cache cũ đè lên mới. Đặt TTL có thêm chút ngẫu nhiên để hàng loạt key không cùng hết hạn một lúc.`
},
{
  id: 'qz-primer-009', topic: 'primer', multi: true,
  q: 'Sau khi đăng nhập qua OpenID Connect, ứng dụng nhận được ID token và access token. Hai phát biểu nào đúng? (Chọn 2)',
  options: [
    'ID token dành cho **client** (ứng dụng) để biết người dùng là ai (claim như {{sub}}, {{email}}); không nên gửi nó đến API làm bearer token',
    'Access token luôn phải là JWT theo chuẩn OAuth2',
    'Access token được gửi kèm request tới resource server (API) trong header {{Authorization: Bearer ...}}; API kiểm tra nó để quyết định cho phép truy cập',
    'Refresh token được gửi kèm mọi request tới API để giữ đăng nhập',
    'ID token được dùng để gọi mọi API của bên thứ ba thay cho access token'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** **ID token** (OIDC) trả lời câu hỏi "ai vừa đăng nhập?" cho ứng dụng; **access token** (OAuth2) là "vé vào cửa" gửi tới API. Hai token có người nhận (audience) khác nhau.

| Token | Người nhận | Dùng để |
|---|---|---|
| ID token (luôn là JWT) | client | hiển thị tên, biết user id |
| Access token | resource server (API) | cho phép gọi API theo scope |
| Refresh token | authorization server | đổi lấy access token mới khi hết hạn |

### Vì sao các phương án còn lại sai
- **Access token luôn là JWT**: OAuth2 không quy định định dạng; có thể là chuỗi ngẫu nhiên (opaque) mà API phải kiểm tra qua introspection endpoint.
- **Refresh token gửi kèm mọi request**: refresh token chỉ gửi tới token endpoint của authorization server; gửi khắp nơi làm tăng nguy cơ lộ token sống lâu.
- **ID token gọi API bên thứ ba**: audience của ID token là client, API không nên chấp nhận nó; quyền truy cập API được thể hiện bằng scope trong access token.

> Senior tip: trong Spring Boot, ứng dụng web đăng nhập dùng {{spring-boot-starter-oauth2-client}}, còn API kiểm tra token dùng {{spring-boot-starter-oauth2-resource-server}}; nhầm hai vai trò này là lỗi rất hay gặp khi mới học.`
},
{
  id: 'qz-primer-010', topic: 'primer',
  q: 'Team nói "chúng ta đã có Continuous Delivery" nhưng một người khác nói "chưa phải Continuous Deployment". Khác biệt giữa hai khái niệm là gì?',
  options: [
    'Continuous Delivery: mỗi thay đổi qua pipeline đều ở trạng thái **sẵn sàng** deploy production, nhưng bước đưa lên production cần người bấm duyệt; Continuous Deployment: thay đổi qua hết test được **tự động** đưa lên production',
    'Hai khái niệm giống nhau, chỉ khác tên gọi',
    'Continuous Delivery là chạy unit test, Continuous Deployment là chạy integration test',
    'Continuous Deployment nghĩa là deploy mỗi tuần một lần theo lịch'
  ],
  answer: 0,
  explain: `**Tóm tắt:** cả hai đều tự động build, test và đóng gói. Khác nhau ở **bước cuối**: Delivery dừng lại chờ quyết định của con người; Deployment tự động đưa lên production mỗi khi pipeline xanh.

~~~text
commit -> build -> unit test -> integration test -> deploy staging -> [duyệt tay] -> production   (Delivery)
commit -> build -> unit test -> integration test -> deploy staging -> tự động -> production       (Deployment)
~~~
Continuous Integration là phần trước đó: mọi người merge vào nhánh chính thường xuyên, mỗi lần merge đều build và test tự động.

### Vì sao các phương án còn lại sai
- **Giống nhau**: khác biệt về bước duyệt production là đáng kể, quyết định mức tự động và mức tự tin vào test.
- **Unit test vs integration test**: cả hai mô hình đều chạy mọi loại test; đó là nội dung pipeline, không phải định nghĩa.
- **Deploy hằng tuần theo lịch**: deploy theo lịch không phải "continuous"; Continuous Deployment deploy ngay khi mỗi thay đổi sẵn sàng, có thể nhiều lần mỗi ngày.

> Senior tip: muốn tiến tới Continuous Deployment cần test tự động đáng tin, feature flag để tách "deploy" khỏi "bật tính năng", canary và rollback tự động. Thiếu những thứ đó thì giữ bước duyệt tay là lựa chọn hợp lý.`
}
,
{
  id: 'qz-devops-035', topic: 'devops',
  q: 'Dockerfile sau đây có vấn đề gì?\n~~~dockerfile\nFROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN npm run build\nCMD npm start\n~~~',
  options: [
    'Thứ tự COPY và RUN npm install khiến rebuild reinstall toàn bộ dependency mỗi khi code đổi',
    'Thiếu EXPOSE nên container không expose port',
    'FROM node:20 không có digest nên không reproducible',
    'CMD dùng shell form nên không nhận signal SIGTERM đúng'
  ],
  answer: 0,
  explain: `**Tóm tắt:** COPY toàn bộ source trước npm install làm cache layer npm install bị invalidate mỗi khi bất kỳ file nào thay đổi.

### Cách sửa đúng
- COPY package.json và package-lock.json trước, RUN npm ci, rồi mới COPY source.

### Vì sao các phương án còn lại sai
- EXPOSE chỉ metadata.
- FROM tag là best practice nhưng không phải vấn đề chính.
- CMD shell form có vấn đề signal nhưng không phải trọng tâm câu hỏi.

> Senior tip: multi-stage build + .dockerignore + layer ordering.`
},
{
  id: 'qz-devops-036', topic: 'devops', multi: true,
  q: 'Pod bị OOMKilled. Chọn 2 nguyên nhân phổ biến nhất (Chọn 2)',
  options: [
    'Memory limit đặt thấp hơn peak usage',
    'Memory leak trong app',
    'CPU throttling',
    'Image pull error',
    'Readiness probe fail'
  ],
  answer: [0,1],
  explain: `**Tóm tắt:** OOMKilled xảy ra khi container vượt memory limit (cgroup OOM) hoặc node hết memory. Hai nguyên nhân phổ biến: limit quá thấp so với peak, và memory leak.

### Vì sao các phương án còn lại sai
- CPU throttling gây latency, không OOM.
- Image pull error → ImagePullBackOff.
- Readiness fail → Pod bị loại khỏi Service, không restart.

> Senior tip: set request = typical, limit = peak + 20%; dùng VPA để gợi ý. Theo dõi RSS và heap qua metrics.`
},
{
  id: 'qz-devops-037', topic: 'devops',
  q: 'CrashLoopBackOff khác ImagePullBackOff ở điểm nào?',
  options: [
    'CrashLoopBackOff: container đã start rồi crash; ImagePullBackOff: không kéo được image',
    'CrashLoopBackOff do readiness fail',
    'ImagePullBackOff do liveness fail',
    'Cả hai đều do OOM'
  ],
  answer: 0,
  explain: `**Tóm tắt:** CrashLoopBackOff = container khởi động thành công rồi exit/crash, kubelet restart có backoff. ImagePullBackOff = không kéo được image (sai tag, secret registry, network).

### Vì sao các phương án còn lại sai
- Readiness fail không restart container.
- Liveness fail gây restart nhưng ImagePullBackOff không liên quan liveness.
- OOM là một nguyên nhân của crash, không phải tất cả.

> Senior tip: kubectl describe pod xem Events; kubectl logs --previous xem log container vừa crash.`
},
{
  id: 'qz-devops-038', topic: 'devops',
  q: 'PromQL: rate(http_requests_total[5m]) vs irate(http_requests_total[5m]) — khác nhau thế nào?',
  options: [
    'rate tính trung bình trên toàn cửa sổ; irate chỉ dùng 2 mẫu cuối → nhạy với spike',
    'irate chính xác hơn mọi trường hợp',
    'rate chỉ dùng cho counter, irate dùng cho gauge',
    'Cả hai giống nhau'
  ],
  answer: 0,
  explain: `**Tóm tắt:** rate = (last-first)/window (trung bình). irate = (last-prev)/interval (istantaneous, nhạy spike). Dùng rate cho alert/SLO, irate cho debug spike.

### Vì sao các phương án còn lại sai
- irate không "chính xác hơn", nó nhạy nhiễu.
- Cả hai chỉ dùng cho counter (có reset handling).
- Chúng khác nhau rõ rệt.

> Senior tip: alert dùng rate; dashboard có thể dùng irate nhưng cẩn thận noise.`
},
{
  id: 'qz-devops-039', topic: 'devops',
  q: 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) — ý nghĩa?',
  options: [
    'p99 latency trong 5 phút gần nhất',
    'Tỷ lệ request lỗi',
    'Số request mỗi giây',
    'Max latency'
  ],
  answer: 0,
  explain: `**Tóm tắt:** histogram_quantile tính phân vị từ bucket. 0.99 = p99. Kết hợp rate → p99 latency gần đây.

### Vì sao các phương án còn lại sai
- Tỷ lệ lỗi cần counter errors/total.
- RPS cần rate(requests_total).
- Max latency không từ histogram (cần gauge hoặc max over time).

> Senior tip: đảm bảo bucket boundaries phù hợp (vd .005,.01,.025,.05,.1,.25,.5,1,2.5,5,10).`
},
{
  id: 'qz-devops-040', topic: 'devops',
  q: 'GitHub Actions cache: actions/cache với key {{hashFiles("package-lock.json")}}. Khi lock file đổi, cache miss. Mục đích?',
  options: [
    'Đảm bảo cache dependency đúng phiên bản lock file',
    'Tăng tốc build mọi trường hợp',
    'Cache code source',
    'Bắt buộc restore cache'
  ],
  answer: 0,
  explain: `**Tóm tắt:** key dựa trên lock file → cache hit chỉ khi dependency không đổi; khi đổi, rebuild và cache mới. Tránh dùng dependency cũ.

### Vì sao các phương án còn lại sai
- Không tăng tốc mọi trường hợp (miss khi đổi).
- Không cache source code (chỉ node_modules).
- restore-keys fallback có thể dùng cache cũ nhưng không bắt buộc.

> Senior tip: dùng restore-keys để fallback partial, nhưng verify integrity.`
},
{
  id: 'qz-devops-041', topic: 'devops',
  q: 'Flyway migration khi rolling update: app v2 cần schema mới, app v1 đang chạy. Chiến lược an toàn?',
  options: [
    'Migration backward-compatible (add column nullable) trước, deploy app, rồi cleanup cột cũ sau',
    'Chạy migration DROP COLUMN ngay khi deploy v2',
    'Stop toàn bộ app rồi migrate',
    'Migrate trong app startup'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Expand-contract: thêm cột nullable trước, deploy app mới đọc/ghi cột mới nhưng vẫn tương thích v1, sau đó drop cột cũ. Tránh downtime và lỗi v1.

### Vì sao các phương án còn lại sai
- DROP COLUMN ngay làm v1 crash (cột không tồn tại).
- Stop all gây downtime.
- Migrate trong startup race condition khi nhiều instance.

> Senior tip: Flyway chạy như init container hoặc job riêng, version schema theo app.`
},
{
  id: 'qz-devops-042', topic: 'devops',
  q: 'Helm values: override bằng --set và -f values-prod.yaml. Thứ tự ưu tiên?',
  options: [
    '--set cao hơn -f; giá trị sau cùng ghi đè',
    '-f luôn cao hơn --set',
    'Values mặc định chart cao nhất',
    'Không thể override'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Helm merge theo thứ tự: chart defaults → -f files (theo thứ tự) → --set. Giá trị sau cùng ghi đè. --set thường đặt sau cùng → cao nhất.

### Vì sao các phương án còn lại sai
- -f không luôn cao hơn --set.
- Defaults thấp nhất.
- Override được.

> Senior tip: dùng values-prod.yaml + --set cho secret động; tránh --set nhiều cho config lớn.`
},
{
  id: 'qz-devops-043', topic: 'devops',
  q: 'Terraform state lock: error "Error acquiring the state lock". Nguyên nhân?',
  options: [
    'Một process Terraform khác đang chạy hoặc lock cũ chưa giải phóng',
    'State file bị corrupt',
    'Provider version mismatch',
    'Backend chưa init'
  ],
  answer: 0,
  explain: `**Tóm tắt:** State lock (DynamoDB) ngăn apply đồng thời. Lock tồn tại khi process khác đang chạy hoặc crash để lại lock.

### Cách xử lý
- Chờ process khác xong.
- Nếu crash: terraform force-unlock <LOCK_ID> (cẩn thận).

### Vì sao các phương án còn lại sai
- Corrupt state → checksum error, không lock.
- Provider mismatch → plan error.
- Backend chưa init → init error.

> Senior tip: CI serialize terraform apply; dùng -lock-timeout.`
},
{
  id: 'qz-devops-044', topic: 'devops',
  q: 'Kubernetes liveness probe fail liên tục → ?',
  options: [
    'Container bị restart',
    'Pod bị xóa',
    'Service trả 503',
    'Scheduler reschedule'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Liveness fail → kubelet kill & restart container (theo restartPolicy). Nếu fail nhiều → CrashLoopBackOff.

### Vì sao các phương án còn lại sai
- Pod không bị xóa (trừ eviction).
- Service 503 do readiness, không liveness.
- Scheduler không reschedule trừ khi node fail.

> Senior tip: liveness nên check deadlock/hang, không check dependency ngoài (DB) để tránh restart storm.`
},
{
  id: 'qz-devops-045', topic: 'devops',
  q: 'Readiness probe fail → ?',
  options: [
    'Pod bị loại khỏi endpoints của Service (không nhận traffic), không restart',
    'Container restart',
    'Pod bị xóa',
    'Node bị drain'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Readiness fail → Pod removed from Service endpoints, không restart. Dùng để gate traffic khi startup hoặc dependency down.

### Vì sao các phương án còn lại sai
- Restart là liveness.
- Xóa pod là eviction/deletion.
- Drain node là admin action.

> Senior tip: readiness check dependency (DB) OK; liveness không.`
},
{
  id: 'qz-devops-046', topic: 'devops',
  q: 'Kubernetes Deployment strategy Recreate vs RollingUpdate?',
  options: [
    'Recreate: kill all old then create new (downtime); RollingUpdate: gradual replace',
    'Recreate nhanh hơn luôn',
    'RollingUpdate không hỗ trợ rollback',
    'Recreate dùng cho stateless'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Recreate terminate all old Pods rồi tạo mới → downtime, dùng khi không thể chạy hai version song song. RollingUpdate thay dần → zero downtime.

### Vì sao các phương án còn lại sai
- Recreate không luôn nhanh hơn (có downtime).
- RollingUpdate hỗ trợ rollback.
- Recreate thường dùng cho stateful/RWO volume.

> Senior tip: Recreate khi cần exclusive resource (volume RWO).`
},
{
  id: 'qz-devops-047', topic: 'devops', multi: true,
  q: 'Chọn 2 best practice cho container image (Chọn 2)',
  options: [
    'Dùng non-root user',
    'Image nhỏ (distroless/alpine)',
    'Chạy với --privileged',
    'Lưu secret trong image',
    'Tag latest trong production'
  ],
  answer: [0,1],
  explain: `**Tóm tắt:** Non-root giảm blast radius; image nhỏ giảm attack surface và pull time.

### Vì sao các phương án còn lại sai
- --privileged nguy hiểm.
- Secret trong image leak.
- Tag latest không reproducible.

> Senior tip: scan image (Trivy), sign (cosign), SBOM.`
},
{
  id: 'qz-devops-048', topic: 'devops',
  q: 'Prometheus scrape target down → up metric = 0. Alert rule thường dùng?',
  options: [
    'up == 0',
    'rate(errors) > 0',
    'histogram_quantile(...)',
    'node_cpu_seconds_total'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Metric {{up}} = 1 nếu scrape thành công, 0 nếu target down. Alert {{up == 0}}.

### Vì sao các phương án còn lại sai
- errors rate đo lỗi app, không phải target down.
- histogram quantile đo latency.
- node_cpu không liên quan scrape.

> Senior tip: alert theo up cho infra; theo error rate cho app.`
},
{
  id: 'qz-devops-049', topic: 'devops',
  q: 'Kubernetes HPA scale dựa trên metric nào mặc định?',
  options: [
    'CPU utilization (request-based)',
    'Memory only',
    'Custom metrics bắt buộc',
    'Network throughput'
  ],
  answer: 0,
  explain: `**Tóm tắt:** HPA mặc định dùng CPU utilization so với request (target average). Có thể thêm memory và custom metrics.

### Vì sao các phương án còn lại sai
- Memory không phải mặc định (cần config).
- Custom metrics optional.
- Network không mặc định.

> Senior tip: set resource requests đúng để HPA hoạt động; scale-down stabilization window tránh flapping.`
},
{
  id: 'qz-devops-050', topic: 'devops',
  q: 'Terraform plan cho thấy resource sẽ bị destroy và recreate. Nguyên nhân thường gặp?',
  options: [
    'Thay đổi thuộc tính immutable (force new resource)',
    'Thay đổi tag',
    'Thay đổi description',
    'Thay đổi count'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Một số thuộc tính immutable (vd AMI id, subnet) khi đổi → Terraform destroy+create. Cần xem plan carefully, có thể dùng lifecycle ignore_changes.

### Vì sao các phương án còn lại sai
- Tag/description thường update in-place.
- Count thay đổi có thể add/remove instance, không nhất thiết recreate all.

> Senior tip: dùng moved blocks/state mv để tránh recreate khi refactor; review plan trong CI.`
},
{
  id: 'qz-devops-051', topic: 'devops',
  q: "Trong Kubernetes (hệ thống điều phối container - chạy và quản lý nhiều container trên cụm máy chủ), bạn muốn chạy một job nhập dữ liệu chỉ chạy một lần rồi kết thúc. Dùng loại workload (tài nguyên mô tả cách chạy Pod) nào là phù hợp nhất?",
  options: [
    "Deployment: đảm bảo luôn có một số Pod chạy liên tục và tự khởi động lại khi Pod chết",
    "DaemonSet: đảm bảo mỗi node (máy chủ trong cụm) chạy đúng một bản sao Pod",
    "Job: tạo Pod chạy đến khi hoàn thành thành công rồi dừng, có thể thử lại nếu lỗi",
    "StatefulSet: quản lý Pod có định danh ổn định, thường dùng cho cơ sở dữ liệu"
  ],
  answer: 2,
  explain: `**Tóm tắt:** Job dành cho tác vụ chạy một lần rồi kết thúc (batch). Nó theo dõi Pod đến khi hoàn thành thành công; nếu Pod lỗi, Job có thể tạo Pod mới thử lại theo cấu hình.

### Cái gì, vì sao, hoạt động thế nào
- **Pod**: đơn vị nhỏ nhất trong Kubernetes, bọc một hoặc vài container.
- **Deployment** (triển khai liên tục): dùng cho ứng dụng luôn chạy (web API). Nó giữ số replica (bản sao) ổn định; nếu Pod crash, Deployment tạo Pod mới để thay.
- **Job**: dùng cho tác vụ có điểm kết thúc, ví dụ import dữ liệu, gửi báo cáo đêm. Job coi exit code 0 là thành công. Các tham số hay dùng: {{completions}} (cần bao nhiêu lần hoàn thành), {{parallelism}} (chạy song song bao nhiêu Pod), {{backoffLimit}} (số lần thử lại khi lỗi).
- **CronJob**: chạy Job theo lịch (giống cron trên Linux).

~~~yaml
apiVersion: batch/v1
kind: Job
metadata: { name: import-data }
spec:
  backoffLimit: 3        # thử lại tối đa 3 lần nếu lỗi
  template:
    spec:
      restartPolicy: Never  # Job tự quản lý việc thử lại
      containers:
        - name: importer
          image: myapp:1.0
          command: ["java","-jar","/app/import.jar"]
~~~

### Lỗi hay gặp
- Dùng Deployment cho job một lần: khi job chạy xong thoát, Deployment nghĩ Pod chết và khởi động lại liên tục (CrashLoopBackOff hoặc vòng lặp vô hạn).
- Đặt {{restartPolicy: Always}} trong Job: không hợp lệ; Job dùng {{Never}} hoặc {{OnFailure}}.

### Trả lời phỏng vấn
"Với tác vụ batch chạy một lần tôi dùng Job/CronJob; với service luôn chạy dùng Deployment; mỗi node một bản dùng DaemonSet; app có state/định danh ổn định dùng StatefulSet."

> Senior tip: Job hoàn thành vẫn để lại Pod (để xem log). Đặt {{ttlSecondsAfterFinished}} để Kubernetes tự dọn Pod cũ, tránh rác tích tụ trong namespace.`
},
{
  id: 'qz-devops-052', topic: 'devops', multi: true,
  q: "Một Pod có 2 container: container {{app}} (ứng dụng Java) và container {{cloud-sql-proxy}} (proxy kết nối DB). App khởi động nhanh hơn proxy nên bị lỗi kết nối DB vài giây đầu. Hai cách nào giúp app chỉ chạy khi proxy sẵn sàng? (Chọn 2)",
  options: [
    "Dùng initContainer để chờ proxy/DB sẵn sàng trước khi container app chính bắt đầu",
    "Dùng startupProbe hoặc readiness logic (hoặc native sidecar/init với restartPolicy Always trong K8s mới) để kiểm soát thứ tự sẵn sàng của sidecar",
    "Tăng số replica của Deployment lên 10 để luôn có Pod sẵn sàng",
    "Đặt livenessProbe của app kiểm tra DB để kubelet restart app khi DB chưa sẵn sàng",
    "Chuyển app sang chạy bằng {{sleep 60}} trước khi khởi động"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Vấn đề là thứ tự khởi động giữa các container trong cùng Pod. Dùng initContainer để làm bước chuẩn bị tuần tự, hoặc dùng cơ chế sidecar/startupProbe để báo khi phụ thuộc sẵn sàng. Liveness restart vòng vòng không giải quyết gốc rễ.

### Khái niệm
- **initContainer**: container chạy **trước** các container chính, lần lượt, và phải hoàn thành (exit 0) thì container chính mới bắt đầu. Ví dụ: chờ cổng DB mở, chạy migration.
- **sidecar**: container chạy **song song** cùng app trong một Pod (như proxy, log shipper).
- **Probe** (thăm dò): kubelet gọi định kỳ để biết trạng thái container. {{startupProbe}} cho giai đoạn khởi động; {{readinessProbe}} quyết định có nhận traffic; {{livenessProbe}} quyết định có restart.

~~~yaml
spec:
  initContainers:
    - name: wait-db
      image: busybox
      command: ['sh','-c','until nc -z db 5432; do sleep 1; done']
  containers:
    - name: app
      image: myapp:1.0
~~~

### Vì sao các phương án còn lại sai
- **Tăng replica**: không sửa thứ tự khởi động; mọi Pod mới vẫn lỗi vài giây đầu.
- **livenessProbe kiểm tra DB**: DB/proxy chưa sẵn sàng không phải lỗi nội bộ của app; kubelet restart app liên tục gây restart storm, đúng lúc phụ thuộc đang yếu.
- **sleep 60**: đoán mò thời gian, chậm không cần thiết khi proxy lên nhanh, và vẫn lỗi nếu proxy cần hơn 60 giây.

> Senior tip: Với dependency ngoài (DB), liveness không nên check chúng; readiness có thể cân nhắc. Đừng dùng restart để che lỗi thứ tự khởi động.`
},
{
  id: 'qz-devops-053', topic: 'devops',
  q: "File {{/var/app/config.yml}} có permission hiển thị là {{-rw-r-----}} (owner {{app}}, group {{app}}). User {{deploy}} (không thuộc group {{app}}, không phải root) chạy lệnh đọc file này. Kết quả là gì?",
  options: [
    "Đọc được vì mọi user đều đọc được file có chữ {{r}}",
    "Đọc được nếu {{deploy}} biết đường dẫn tuyệt đối",
    "Bị từ chối (Permission denied) vì {{deploy}} không phải owner và không thuộc group {{app}}, nên rơi vào quyền \"others\" là {{---}}",
    "Bị từ chối chỉ khi file nằm trong {{/root}}"
  ],
  answer: 2,
  explain: `**Tóm tắt:** Linux (hệ điều hành) kiểm tra quyền theo 3 lớp: **owner** (chủ sở hữu), **group** (nhóm), **others** (người khác). {{deploy}} rơi vào others và others không có quyền đọc ({{---}}) nên bị Permission denied.

### Giải thích từng phần
Chuỗi {{-rw-r-----}} gồm 10 ký tự:
~~~text
-  rw-  r--  ---
|  |    |    |
|  |    |    +-- others: không đọc/ghi/chạy
|  |    +------- group: đọc (r) thôi
|  +------------ owner: đọc + ghi (rw)
+--------------- loại file (- = file thường, d = thư mục)
~~~
- {{r}} = read, {{w}} = write, {{x}} = execute (với thư mục: được vào/liệt kê).
- Kernel kiểm tra **theo thứ tự**: nếu bạn là owner thì dùng quyền owner (kể cả owner chỉ {{---}}, không rơi xuống group).

### Ví dụ đời thường
Giống ổ khóa nhà: chủ nhà có chìa (owner), người trong gia đình có mã số (group), người lạ (others) không có gì.

### Lỗi hay gặp
- Chmod 777 cho nhanh: ai cũng đọc/ghi/chạy, rất nguy hiểm cho file chứa secret.
- Quên quyền {{x}} trên thư mục: có {{r}} file nhưng không {{x}} thư mục cha thì vẫn không vào được.

> Senior tip: Dùng {{ls -l}} xem quyền, {{namei -l /path}} kiểm tra quyền cả chuỗi thư mục cha. Trong container, chạy non-root và gán quyền tối thiểu (least privilege).`
},
{
  id: 'qz-devops-054', topic: 'devops',
  q: "Script deploy có dòng đầu {{#!/bin/bash}} và {{set -euo pipefail}}. Lệnh {{grep \"pattern\" missing.log | wc -l}} chạy trong khi {{missing.log}} không tồn tại. Với cấu hình này, script sẽ xử lý thế nào (bash mặc định, grep không tìm thấy file)?",
  options: [
    "Script bỏ qua lỗi và tiếp tục, vì {{wc -l}} vẫn chạy thành công",
    "Script dừng ngay: {{-e}} (thoát khi lệnh lỗi) kết hợp {{pipefail}} (pipe lỗi nếu bất kỳ lệnh nào trong pipe lỗi) nên lỗi từ {{grep}} làm toàn bộ pipeline thất bại",
    "Script chỉ dừng nếu thêm {{set -x}}",
    "Script treo chờ file xuất hiện"
  ],
  answer: 1,
  explain: `**Tóm tắt:** {{set -e}} làm script thoát khi một lệnh trả về mã lỗi khác 0; {{pipefail}} làm pipeline trả lỗi nếu **bất kỳ** lệnh nào trong pipe lỗi (không chỉ lệnh cuối). {{grep}} lỗi vì file không tồn tại nên pipeline lỗi và script dừng.

### Giải thích từng tùy chọn
- {{-e}} (errexit): lệnh lỗi → thoát. Giúp không chạy tiếp bước nguy hiểm (ví dụ deploy khi build lỗi).
- {{-u}} (nounset): dùng biến chưa khai báo → lỗi. Tránh {{rm -rf $DIR/}} khi $DIR rỗng.
- {{-o pipefail}}: mặc định {{cmd1 | cmd2}} lấy mã thoát của {{cmd2}}; với pipefail, nếu {{cmd1}} lỗi thì cả pipe lỗi.

~~~bash
#!/bin/bash
set -euo pipefail
grep "x" missing.log | wc -l   # grep lỗi -> pipe lỗi -> script dừng tại đây
echo "khong chay toi dong nay"
~~~

### Vì sao các phương án còn lại sai
- **Bỏ qua vì wc chạy thành công**: đó là hành vi **không** có pipefail. Có pipefail thì lỗi của grep được giữ lại.
- **Cần set -x**: {{-x}} chỉ in lệnh để debug, không ảnh hưởng thoát khi lỗi.
- **Treo chờ file**: shell không tự chờ file; cần vòng lặp tự viết.

> Senior tip: {{-e}} có bẫy (trong {{if}}, {{&&}}, {{||}}, hàm). Với lệnh được phép lỗi, dùng {{grep ... || true}} hoặc kiểm tra rõ ràng. Luôn test script với trường hợp file thiếu/biến rỗng.`
},
{
  id: 'qz-devops-055', topic: 'devops', multi: true,
  q: "Team đang chọn công cụ quản lý hạ tầng (infrastructure). Phát biểu nào đúng về Terraform và Ansible? (Chọn 2)",
  options: [
    "Terraform (công cụ IaC - hạ tầng như mã) thiên về khai báo tài nguyên hạ tầng (VM, VPC, DB) và dùng state để biết cái gì đã tạo, tính toán thay đổi (plan)",
    "Ansible thiên về cấu hình/phần mềm trên máy chủ (cài package, sửa file cấu hình) theo playbook, thường chạy theo mô hình đẩy (push) qua SSH, agentless",
    "Terraform và Ansible là một công cụ, chỉ khác tên",
    "Ansible lưu state file bắt buộc giống Terraform để biết tài nguyên cloud đã tạo",
    "Terraform thay thế hoàn toàn nhu cầu cấu hình hệ điều hành bên trong máy chủ trong mọi trường hợp"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Terraform mạnh về **tạo/quản lý hạ tầng** (provisioning) theo mô hình khai báo + state + plan. Ansible mạnh về **cấu hình máy** và tự động hóa tác vụ theo playbook, thường agentless qua SSH. Hai công cụ hay dùng bổ trợ nhau.

### So sánh dễ hiểu
- **Terraform**: bạn khai báo "tôi muốn 2 EC2, 1 RDS, 1 VPC". Terraform so sánh mong muốn với **state** (trạng thái đã biết) và hạ tầng thực tế, rồi đưa ra plan: tạo/sửa/xoá gì. Phù hợp tài nguyên cloud có vòng đời (create/update/destroy).
- **Ansible**: bạn viết playbook "cài Java 21, copy file cấu hình, restart service" chạy lên các máy qua SSH. Ansible không cần cài agent trên máy đích (agentless). Nhiều module hướng tới trạng thái mong muốn (idempotent - chạy lại không gây hỏng).

~~~text
Terraform:  [code HCL] -> plan -> tạo VPC/EC2/RDS
Ansible:    [playbook] -> SSH  -> cài Java, cấu hình app trên EC2
~~~

### Vì sao các phương án còn lại sai
- **Một công cụ khác tên**: hoàn toàn khác mục tiêu và cơ chế.
- **Ansible lưu state bắt buộc giống Terraform**: Ansible không dùng state file kiểu Terraform để theo dõi tài nguyên cloud theo cùng cách.
- **Terraform thay thế hoàn toàn cấu hình OS**: Terraform có thể gọi provisioner/user-data, nhưng cấu hình chi tiết trong OS thường dùng Ansible/cloud-init; dùng sai công cụ sẽ khó bảo trì.

> Senior tip: Ranh giới hay gặp: dùng Terraform tạo EC2, dùng Ansible (hoặc image bake/Packer + user-data) cấu hình bên trong. Tránh nhồi logic cấu hình phức tạp vào Terraform provisioner.`
},
{
  id: 'qz-devops-056', topic: 'devops',
  q: "Service thanh toán xử lý giao dịch không idempotent (chạy lặp có thể trừ tiền hai lần). Team muốn phát hành bản mới với rủi ro thấp và có thể chuyển traffic dần. Chiến lược deploy (phát hành) nào phù hợp nhất?",
  options: [
    "Recreate: tắt hết bản cũ rồi bật bản mới, nhanh và đơn giản",
    "Canary (chim mỏ than): chuyển một phần nhỏ traffic sang bản mới, theo dõi lỗi/metric, rồi tăng dần nếu ổn",
    "Đẩy thẳng 100% traffic sang bản mới lúc nửa đêm để ít người dùng",
    "Chỉ test trên máy developer là đủ, không cần chiến lược deploy"
  ],
  answer: 1,
  explain: `**Tóm tắt:** Canary phát hành bản mới cho một tỉ lệ nhỏ người dùng trước (ví dụ 5%), quan sát metric/lỗi/log, rồi tăng dần hoặc rollback. Với hệ thống nhạy cảm như thanh toán, cách này giảm blast radius (phạm vi ảnh hưởng).

### Các chiến lược chính
- **Recreate**: downtime, không chạy song song hai bản. Phù hợp khi không thể chạy hai version cùng lúc, nhưng rủi ro cao.
- **Rolling update**: thay Pod dần, thường zero downtime, nhưng vẫn đưa bản mới ra diện rộng theo đợt; cần app tương thích chạy song song.
- **Blue/Green**: có hai môi trường (cũ/mới), chuyển traffic một lần. Rollback nhanh, nhưng chuyển 100% vẫn là bước lớn và tốn tài nguyên gấp đôi tạm thời.
- **Canary**: chuyển traffic theo tỉ lệ nhỏ → quan sát → tăng dần. Cần metric tốt (error rate, latency, business metric như tỉ lệ giao dịch lỗi).

~~~text
v1 v1 v1 v1 v1  (100%)
v1 v1 v1 v1 v2  (20% canary) -> OK? -> 50% -> 100%
~~~

### Vì sao các phương án còn lại sai
- **Recreate**: downtime và rủi ro cả hệ thống.
- **Đẩy 100% nửa đêm**: vẫn là big-bang; lỗi thanh toán có thể xảy ra với giao dịch thật.
- **Chỉ test local**: môi trường prod khác local (dữ liệu, traffic, tích hợp).

> Senior tip: Với thanh toán, canary phải theo dõi cả metric kỹ thuật lẫn metric nghiệp vụ (tỉ lệ trừ tiền trùng, thất bại). Đảm bảo thao tác idempotent (idempotency key) để deploy/rollback/retry an toàn hơn.`
},
{
  id: 'qz-devops-057', topic: 'devops', multi: true,
  q: "Bạn viết alert Prometheus (hệ thống giám sát: thu thập số liệu theo thời gian). Cần chọn đúng loại metric (kiểu số liệu). Phát biểu nào đúng? (Chọn 2)",
  options: [
    "Counter (bộ đếm) chỉ tăng (hoặc reset về 0 khi process restart); dùng {{rate()}} để tính tốc độ mỗi giây, ví dụ số request lỗi/giây",
    "Gauge (đồng hồ đo) là giá trị có thể lên xuống tại thời điểm đo, ví dụ số kết nối đang mở hoặc dung lượng heap đang dùng",
    "Histogram (biểu đồ phân bố) lưu giá trị hiện tại chính xác duy nhất và không dùng để tính p95/p99",
    "Counter phù hợp nhất để lưu nhiệt độ CPU hiện tại vì nhiệt độ luôn tăng",
    "Gauge nên dùng {{rate()}} giống Counter vì giá trị gauge luôn chỉ tăng"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Counter = chỉ tăng, đo "đã xảy ra bao nhiêu", thường dùng với {{rate()/increase()}}. Gauge = lên xuống, đo "hiện tại là bao nhiêu". Histogram/Summary dùng cho phân bố (latency) và tính phân vị p95/p99.

### Bảng chọn nhanh
| Loại | Đặc điểm | Ví dụ | Cách query hay dùng |
|---|---|---|---|
| Counter | Chỉ tăng (reset khi restart) | {{http_requests_total}}, {{errors_total}} | {{rate(errors_total[5m])}} |
| Gauge | Lên/xuống | {{jvm_memory_used_bytes}}, {{connections_active}} | dùng trực tiếp, {{avg_over_time}} |
| Histogram | Đếm vào bucket, có {{_sum}}, {{_count}} | {{http_request_duration_seconds_bucket}} | {{histogram_quantile(0.95, rate(...[5m]))}} |
| Summary | Tính quantile ở client | latency quantile | cẩn thận khi aggregate nhiều instance |

### Vì sao các phương án còn lại sai
- **Histogram không dùng tính p95/p99**: ngược lại, histogram sinh bucket để tính {{histogram_quantile}} (p95/p99) ở server.
- **Counter cho nhiệt độ CPU**: nhiệt độ lên xuống → phải dùng Gauge.
- **Gauge dùng rate() vì luôn tăng**: gauge có thể giảm; dùng {{rate()}} trên gauge cho kết quả sai ý nghĩa.

> Senior tip: Alert lỗi thường dựa trên {{rate(counter)}} hoặc tỉ lệ lỗi, không alert trực tiếp trên counter tăng dần. Với latency, chọn bucket histogram phù hợp SLO (ví dụ 0.1s, 0.3s, 1s).`
},
{
  id: 'qz-devops-058', topic: 'devops',
  q: "Một Service kiểu ClusterIP tên {{orders}} ở namespace {{shop}} chọn các Pod có label {{app: orders}} trên cổng 8080. Pod đang Ready, nhưng Service không route traffic tới Pod nào. Nguyên nhân cấu hình nào thường gặp nhất?",
  options: [
    "Service selector không khớp label của Pod (ví dụ selector {{app: order}} thiếu chữ s)",
    "ClusterIP luôn chặn traffic nội bộ nên phải đổi sang LoadBalancer",
    "Pod thiếu annotation {{prometheus.io/scrape}} nên Service không thấy Pod",
    "Service chỉ hoạt động khi Pod chạy trên cùng node"
  ],
  answer: 0,
  explain: `**Tóm tắt:** Service dùng **label selector** để tìm Pod backend. Nếu selector không khớp label Pod, danh sách endpoints rỗng và không có traffic nào được chuyển tới Pod dù Pod đang chạy.

### Cơ chế
~~~text
Service (selector: app=orders)
        |  khớp label?
        v
Pod labels: app=orders  -> vào Endpoints -> nhận traffic
Pod labels: app=order   -> KHÔNG khớp  -> bị bỏ qua
~~~
- Kubernetes tạo đối tượng Endpoints/EndpointSlice chứa IP các Pod khớp selector và đủ điều kiện (thường là Ready).
- Kiểm tra: {{kubectl get svc orders -n shop}}, {{kubectl get endpoints orders -n shop}}, {{kubectl get pods -n shop --show-labels}}.

~~~yaml
apiVersion: v1
kind: Service
metadata: { name: orders, namespace: shop }
spec:
  selector:
    app: orders      # phải khớp đúng label Pod
  ports:
    - port: 80
      targetPort: 8080
~~~

### Vì sao các phương án còn lại sai
- **ClusterIP chặn traffic nội bộ**: ClusterIP dùng để gọi nội bộ trong cluster; không phải nguyên nhân endpoints rỗng.
- **Thiếu annotation Prometheus**: annotation phục vụ scrape metric, không ảnh hưởng Service routing.
- **Chỉ hoạt động cùng node**: Service route qua kube-proxy/CNI trong toàn cluster, không giới hạn cùng node.

> Senior tip: Lỗi lệch label rất hay gặp khi copy YAML. Ngoài selector, kiểm tra {{targetPort}} có đúng cổng container đang listen và Pod có Ready (readinessProbe) hay không.`
},
{
  id: 'qz-aws-023', topic: 'aws',
  q: "Bạn muốn {{api.example.com}} trỏ tới một Application Load Balancer (ALB - bộ cân bằng tải lớp ứng dụng) trên AWS. Dùng loại bản ghi Route 53 (dịch vụ DNS của AWS) nào là phù hợp nhất?",
  options: [
    "Bản ghi CNAME trỏ thẳng tới DNS name của ALB tại zone apex ({{example.com}})",
    "Bản ghi A thường trỏ tới IP tĩnh của ALB",
    "Bản ghi MX để định tuyến HTTP tới ALB",
    "Bản ghi Alias kiểu A (hoặc AAAA) trỏ tới ALB; Alias là tính năng Route 53 cho phép trỏ tên miền tới tài nguyên AWS mà không cần IP cố định"
  ],
  answer: 3,
  explain: `**Tóm tắt:** Dùng **Alias record** (kiểu A/AAAA) trỏ tới ALB. ALB không có IP tĩnh cố định và DNS name có thể thay đổi phía sau; Alias cho Route 53 tự theo dõi tài nguyên AWS đích, và có thể dùng ở zone apex.

### Giải thích khái niệm
- **DNS (hệ thống phân giải tên miền)**: đổi tên như {{api.example.com}} thành địa chỉ để máy kết nối.
- **Route 53**: dịch vụ DNS của AWS.
- **ALB**: cân bằng tải HTTP/HTTPS, IP có thể thay đổi khi scale/AZ thay đổi.
- **CNAME**: bản ghi bí danh trỏ tên này sang tên khác. Chuẩn DNS **không cho** CNAME ở zone apex ({{example.com}}), chỉ dùng cho tên con ({{api.example.com}}) - và trỏ CNAME tới một số đích có thể phát sinh chi phí query/trade-off; với tài nguyên AWS, Alias thường tốt hơn.
- **Alias** (Route 53 mở rộng): trỏ tới ALB, CloudFront, S3 website, API Gateway... Route 53 trả về IP hiện tại của tài nguyên AWS.

~~~text
api.example.com (Alias A) -> dualstack.my-alb-123.ap-southeast-1.elb.amazonaws.com
Route 53 tự resolve sang IP ALB hiện tại
~~~

### Vì sao các phương án còn lại sai
- **CNAME tại zone apex**: không hợp lệ theo chuẩn DNS; và nếu dùng cho tên con thì Alias vẫn là lựa chọn AWS-native tốt hơn cho ALB.
- **Bản ghi A tới IP tĩnh của ALB**: ALB không đảm bảo IP tĩnh; tự gắn IP sẽ gãy khi AWS thay đổi.
- **MX**: dùng cho mail exchange (email), không định tuyến HTTP.

> Senior tip: Với CloudFront dùng Alias; nếu dùng CNAME ở apex sẽ bị chặn. Kiểm tra health check Route 53 khi cần failover giữa nhiều endpoint.`
},
{
  id: 'qz-aws-024', topic: 'aws', multi: true,
  q: "Ứng dụng Java trong private subnet (mạng con riêng, không có IP công cộng truy cập trực tiếp từ Internet) cần kết nối tới RDS (dịch vụ cơ sở dữ liệu quan hệ). Security Group (SG - tường lửa stateful gắn vào tài nguyên) đang chặn kết nối. Hai phát biểu nào đúng? (Chọn 2)",
  options: [
    "SG của RDS cần cho phép inbound (chiều vào) trên cổng DB (ví dụ 5432 PostgreSQL) từ SG của ứng dụng, thay vì mở 0.0.0.0/0",
    "SG là stateful: nếu request outbound được phép đi ra, response chiều về thường được tự cho phép mà không cần rule inbound riêng cho response đó",
    "NACL (Network ACL - tường lửa stateless ở mức subnet) tự động cho phép mọi traffic nếu SG đã cho phép",
    "Muốn chặn một IP cụ thể đang tấn công, SG là nơi phù hợp nhất vì SG hỗ trợ deny rule chi tiết",
    "SG của ứng dụng phải có inbound rule mở cổng 5432 từ Internet để nhận dữ liệu từ RDS"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Cho phép app → RDS bằng cách mở **inbound trên SG của RDS** từ **SG của app** (nguồn là security group ID). SG là stateful nên response được tự cho phép. NACL là lớp stateless riêng; SG không có deny rule.

### Cơ chế
~~~text
[EC2/ECS app, SG-app]
      | outbound (thường cho phép)
      v  TCP 5432
[RDS, SG-rds: inbound 5432 from SG-app]
      |
      v response tự quay về (stateful)
~~~
- **Stateful (SG)**: nhớ kết nối; chiều trả về được cho phép.
- **Stateless (NACL)**: kiểm tra từng chiều độc lập; phải có rule outbound/inbound phù hợp cho cả request và response (ephemeral ports).
- **SG** chỉ có allow rule, không có deny rule. Muốn deny IP cụ thể ở mức subnet, dùng NACL deny.

### Vì sao các phương án còn lại sai
- **NACL tự cho phép nếu SG cho phép**: NACL đánh giá độc lập; nếu NACL chặn thì traffic vẫn bị chặn dù SG cho.
- **Dùng SG deny IP tấn công**: SG không hỗ trợ deny; dùng NACL, AWS WAF (lớp web), hoặc chặn ở tầng ứng dụng/CDN.
- **SG app phải inbound 5432 từ Internet**: app là bên khởi tạo kết nối tới RDS; không cần mở 5432 từ Internet vào app.

> Senior tip: Tham chiếu SG-to-SG (source là sg-id) an toàn hơn CIDR vì IP instance thay đổi. Kiểm tra cả SG, NACL, route table, DNS khi debug kết nối DB.`
},
{
  id: 'qz-aws-025', topic: 'aws',
  q: "Bạn cần sao chép object (file) từ bucket S3 (lưu trữ đối tượng) ở region A sang bucket ở region B để dự phòng. Điều kiện/bước nào là bắt buộc để S3 Replication hoạt động?",
  options: [
    "Chỉ cần hai bucket cùng tên là replication tự chạy",
    "Bật Versioning (lưu nhiều phiên bản object) trên cả bucket nguồn và bucket đích, và cấu hình Replication rule cùng IAM role có quyền đọc/ghi phù hợp",
    "Tắt mã hóa (encryption) trên cả hai bucket vì replication không hỗ trợ object mã hóa",
    "Replication chỉ sao chép các object được upload trước khi bật rule, không cần cấu hình thêm"
  ],
  answer: 1,
  explain: `**Tóm tắt:** S3 Replication (CRR/SRR) yêu cầu **Versioning bật ở cả nguồn và đích**, một replication rule (lọc prefix/tag nếu cần), và IAM role cho S3 thực hiện sao chép. Mặc định nó áp dụng cho object **mới** sau khi bật.

### Hoạt động thế nào
1. Bạn upload object mới vào bucket nguồn (versioning tạo version ID).
2. S3 đọc replication rule: đích là bucket nào, có lọc theo prefix/tag không.
3. S3 dùng IAM role để sao chép object (và có thể metadata, tag, ACL tùy cấu hình) sang bucket đích.
4. Object đã tồn tại trước khi bật rule **không tự** được sao chép; cần S3 Batch Replication nếu muốn sao chép dữ liệu cũ.

~~~text
Bucket A (ap-southeast-1, versioning ON)
   -- replication rule + IAM role -->
Bucket B (us-east-1, versioning ON)
~~~

### Vì sao các phương án còn lại sai
- **Cùng tên bucket là tự chạy**: tên bucket S3 là toàn cục duy nhất, không thể trùng; replication phải cấu hình rõ ràng.
- **Tắt mã hóa**: replication hỗ trợ object mã hóa (SSE-S3, SSE-KMS) nhưng cần cấu hình quyền KMS phù hợp.
- **Chỉ sao chép object cũ**: mặc định là object mới; object cũ cần Batch Replication.

> Senior tip: Bật "Delete marker replication" chỉ khi bạn hiểu rõ tác động. Kiểm tra quyền KMS nếu bucket dùng SSE-KMS. Replication là bất đồng bộ - có độ trễ, không dùng như cơ chế consistency tức thì.`
},
{
  id: 'qz-aws-026', topic: 'aws', multi: true,
  q: "Công ty cần kết nối mạng on-premises (trung tâm dữ liệu tại chỗ) với VPC trên AWS. So sánh Site-to-Site VPN và Direct Connect (DX), phát biểu nào đúng? (Chọn 2)",
  options: [
    "Site-to-Site VPN tạo kênh mã hóa qua Internet (thường qua Virtual Private Gateway/Transit Gateway), triển khai nhanh hơn nhưng băng thông/độ trễ phụ thuộc Internet",
    "Direct Connect là kết nối mạng riêng vật lý tới AWS, thường ổn định và băng thông cao hơn, nhưng thời gian triển khai và chi phí thường lớn hơn VPN",
    "Direct Connect tự động mã hóa toàn bộ dữ liệu mà không cần cấu hình thêm nên luôn thay thế VPN",
    "Site-to-Site VPN không thể dùng cùng Transit Gateway",
    "VPN luôn có độ trễ thấp và ổn định hơn Direct Connect vì dùng Internet toàn cầu"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** **VPN**: mã hóa qua Internet, nhanh dựng, phù hợp bắt đầu/backup, chất lượng phụ thuộc Internet. **Direct Connect**: đường riêng vật lý, ổn định/băng thông lớn, triển khai lâu hơn. Nhiều hệ thống dùng DX chính + VPN dự phòng.

### So sánh
| Tiêu chí | Site-to-Site VPN | Direct Connect |
|---|---|---|
| Đường truyền | Qua Internet công cộng (IPsec mã hóa) | Kết nối riêng tới AWS |
| Triển khai | Nhanh (phút/giờ) | Lâu hơn (đặt cổng, đối tác) |
| Độ trễ/ổn định | Phụ thuộc Internet | Thường ổn định hơn |
| Băng thông | Giới hạn theo tunnel/thiết bị | Có thể rất cao (Gbps+) |
| Mã hóa | Có (IPsec) | Riêng DX thì không tự mã hóa; cần VPN over DX nếu muốn |

~~~text
On-prem --Internet(IPsec)--> VGW/TGW  (VPN)
On-prem --đường riêng-----> DX location --> AWS  (Direct Connect)
~~~

### Vì sao các phương án còn lại sai
- **DX tự mã hóa nên luôn thay thế VPN**: DX thuần không mã hóa; có thể chạy MACsec/VPN over DX nếu cần mã hóa.
- **VPN không dùng với Transit Gateway**: hoàn toàn dùng được.
- **VPN luôn trễ thấp/ổn định hơn DX**: ngược lại trong phần lớn trường hợp production lớn.

> Senior tip: Chọn theo SLA, băng thông, độ nhạy dữ liệu và ngân sách. Thiết kế HA: 2 tunnel VPN, hoặc DX + VPN failover.`
},
{
  id: 'qz-aws-027', topic: 'aws',
  q: "Doanh nghiệp có 12 VPC (mạng ảo riêng) và một mạng on-premises. Hiện các VPC kết nối chằng chịt bằng VPC Peering (kết nối trực tiếp từng cặp VPC). Độ phức tạp tăng nhanh. Dịch vụ AWS nào giúp đơn giản hóa mô hình kết nối hub-and-spoke (trung tâm - vệ tinh)?",
  options: [
    "NAT Gateway: giúp subnet private ra Internet, không dùng để kết nối nhiều VPC với nhau",
    "Internet Gateway: cổng ra/vào Internet cho VPC",
    "AWS Transit Gateway: bộ định tuyến trung tâm để kết nối nhiều VPC và mạng on-premises theo mô hình hub-and-spoke",
    "S3 Gateway Endpoint: kết nối riêng từ VPC tới S3, không định tuyến giữa các VPC"
  ],
  answer: 2,
  explain: `**Tóm tắt:** **Transit Gateway (TGW)** hoạt động như hub trung tâm: các VPC và kết nối on-premises (VPN/DX) attach vào TGW. Thay vì N*(N-1)/2 đường peering, bạn quản lý route tập trung.

### Vì sao cần
- **VPC Peering**: kết nối 1-1 giữa hai VPC, không bắc cầu (non-transitive). 12 VPC full mesh cần 66 kết nối peering - khó quản lý route/security.
- **Transit Gateway**: mỗi VPC attach vào TGW; route table của TGW quyết định VPC nào nói chuyện với VPC/on-prem nào.

~~~text
VPC-A --\\
VPC-B --- TGW --- On-prem (VPN/DX)
VPC-C --/
~~~

### Vì sao các phương án còn lại sai
- **NAT Gateway**: cho phép instance trong private subnet gọi ra Internet (outbound), không phải kết nối liên-VPC/on-prem.
- **Internet Gateway**: gắn vào VPC để truy cập Internet, không giải quyết mesh VPC.
- **S3 Gateway Endpoint**: endpoint nội bộ cho S3/DynamoDB trong VPC, không phải router trung tâm.

> Senior tip: TGW có chi phí theo attachment và data processed. Thiết kế route table TGW cẩn thận để cô lập môi trường (prod không route sang dev nếu không cần). Kết hợp RAM để chia sẻ TGW đa tài khoản.`
},
{
  id: 'qz-aws-028', topic: 'aws',
  q: "Một ứng dụng chạy trên nhiều EC2 instance (máy ảo) ở nhiều Availability Zone (AZ - trung tâm dữ liệu tách biệt trong region) cần đọc/ghi cùng một thư mục file chia sẻ theo giao thức NFS (giao thức chia sẻ file qua mạng). Dịch vụ lưu trữ AWS nào phù hợp nhất?",
  options: [
    "Amazon EBS gp3: ổ đĩa block gắn vào một EC2 tại một thời điểm/AZ (trừ trường hợp multi-attach đặc biệt), không phải file share NFS đa instance điển hình",
    "Amazon S3: lưu trữ object qua API HTTP, không phải hệ thống file NFS mount trực tiếp như thư mục POSIX truyền thống",
    "Instance Store: ổ tạm gắn vật lý, mất dữ liệu khi stop/terminate, không chia sẻ",
    "Amazon EFS: hệ thống file NFS quản lý, có thể mount đồng thời từ nhiều EC2/đa AZ"
  ],
  answer: 3,
  explain: `**Tóm tắt:** **Amazon EFS** (Elastic File System) cung cấp file system NFS có thể mount bởi nhiều EC2/container cùng lúc, phù hợp chia sẻ file đa instance/đa AZ. EBS là block storage thường gắn 1 instance; S3 là object storage.

### Chọn dịch vụ lưu trữ
| Nhu cầu | Dịch vụ | Ghi nhớ |
|---|---|---|
| Ổ đĩa cho OS/DB một instance | EBS | Block, gắn như ổ cứng, thường 1 EC2/AZ |
| File chia sẻ NFS nhiều instance | EFS | File system, mount đồng thời |
| File Windows/SMB | FSx for Windows | Giao thức SMB |
| Lưu object (ảnh, backup, log) | S3 | API HTTP, không mount như NFS POSIX đầy đủ |
| Cache/tạm, rất nhanh, mất khi stop | Instance Store | Ephemeral |

~~~bash
# Trên EC2 (Linux), mount EFS qua NFS
sudo mount -t efs fs-12345678:/ /mnt/shared
~~~

### Vì sao các phương án còn lại sai
- **EBS gp3**: block storage, độ trễ thấp cho một máy; không phải giải pháp NFS chia sẻ đa máy mặc định.
- **S3**: truy cập bằng SDK/API (PutObject/GetObject), không tương đương thư mục NFS cho ứng dụng legacy cần POSIX file lock/semantics đầy đủ (trừ giải pháp đặc biệt).
- **Instance Store**: dữ liệu tạm, mất khi instance dừng/hỏng host.

> Senior tip: EFS tính phí theo dung lượng/throughput mode; cân nhắc EFS IA (Infrequent Access) cho file ít truy cập. Kiểm tra security group NFS (2049) và mount target trong từng AZ.`
},
{
  id: 'qz-aws-029', topic: 'aws', multi: true,
  q: "Worker Java đọc message từ Amazon SQS (hàng đợi thông điệp). Xử lý một message mất 90 giây, nhưng Visibility Timeout (thời gian tạm ẩn message sau khi có consumer nhận) đang đặt 30 giây. Hai vấn đề/cách xử lý nào đúng? (Chọn 2)",
  options: [
    "Message có thể hiện lại trên queue sau 30 giây và bị worker khác nhận lại, gây xử lý trùng nếu worker đầu chưa xong",
    "Tăng Visibility Timeout (hoặc dùng ChangeMessageVisibility để gia hạn định kỳ trong lúc xử lý) để đủ thời gian xử lý",
    "Visibility Timeout nên đặt thấp hơn thời gian xử lý để tăng tốc độ queue",
    "SQS FIFO tự động loại bỏ mọi message trùng mà không cần ứng dụng xử lý idempotent",
    "Khi worker xóa message trước khi xử lý xong, message sẽ tự quay lại an toàn nếu worker crash"
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Khi consumer nhận message, SQS tạm ẩn nó trong **Visibility Timeout**. Nếu hết timeout mà message chưa bị xóa, nó hiện lại và consumer khác có thể nhận → xử lý trùng. Timeout phải **lớn hơn** thời gian xử lý (hoặc được gia hạn).

### Cơ chế
~~~text
t=0s   Worker A nhận message (ReceiveMessage)
       SQS ẩn message 30s
t=30s  A vẫn đang xử lý (cần 90s) nhưng timeout hết
       -> message hiện lại
t=31s  Worker B nhận CÙNG message -> trùng xử lý
~~~
Cách đúng:
- Đặt Visibility Timeout > thời gian xử lý tối đa (có buffer), hoặc
- Worker A gọi {{ChangeMessageVisibility}} (gia hạn heartbeat) khi còn xử lý.

~~~text
Xử lý thành công -> DeleteMessage (xóa khỏi queue)
Xử lý lỗi       -> để message hiện lại (hoặc gửi DLQ sau maxReceiveCount)
~~~

### Vì sao các phương án còn lại sai
- **Timeout thấp hơn thời gian xử lý để tăng tốc**: gây duplicate processing, rất nguy hiểm với nghiệp vụ trừ tiền/tạo đơn.
- **SQS FIFO tự loại mọi trùng**: FIFO có cơ chế deduplication theo MessageDeduplicationId trong cửa sổ 5 phút và ordering, nhưng không thay thế thiết kế idempotent end-to-end của ứng dụng.
- **Xóa trước khi xử lý xong thì crash vẫn an toàn**: ngược lại - xóa trước khi xong mà worker crash sẽ **mất** message.

> Senior tip: Nguyên tắc an toàn: xử lý xong mới DeleteMessage; thiết kế consumer idempotent; dùng DLQ (Dead Letter Queue) với {{maxReceiveCount}} cho message lỗi lặp lại. Theo dõi {{ApproximateAgeOfOldestMessage}} và số message trong DLQ.`
}
,
{
  id: 'qz-devops-059', topic: 'devops', multi: true,
  q: "Pod backend trả 502 qua Ingress. kubectl get endpoints backend thấy endpoint rỗng, readiness probe fail. Chọn các nguyên nhân hợp lý (Chọn 2)",
  options: [
    'Readiness probe sai port/path nên pod không Ready',
    'Service selector không match label của Pod',
    'Ingress backend servicePort sai (targetPort)',
    'CPU limit quá thấp nên pod bị kill',
    'Pod đang Running nhưng container chưa listen port'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Endpoint rỗng nghĩa Service không chọn được Pod nào (selector mismatch) hoặc Pod chưa Ready (readiness fail). Ingress 502 thường do không có endpoint Ready.

### Vì sao các phương án còn lại sai
- Ingress backend port sai thường cho 502/503 nhưng endpoint vẫn có (service có pod Ready); ở đây endpoint rỗng nên không phải nguyên nhân chính.
- CPU limit thấp gây throttling/OOM, không làm endpoint rỗng.
- Pod Running nhưng chưa listen port là readiness fail (đã bao gồm trong readiness).

> Senior tip: debug: kubectl get ep, describe pod events, kiểm tra readiness httpGet path/port; đảm bảo targetPort khớp containerPort.`
},
{
  id: 'qz-devops-060', topic: 'devops',
  q: "ConfigMap đã update bằng kubectl apply, nhưng pod vẫn dùng giá trị cũ. Lệnh nào làm pod nhận config mới?",
  options: [
    'kubectl rollout restart deployment/<name>',
    'kubectl apply -f configmap.yaml lại',
    'Chờ kubelet tự refresh (không cần làm gì)',
    'kubectl delete pod để recreate'
  ],
  answer: 0,
  explain: `**Tóm tắt:** ConfigMap mount volume được kubelet sync định kỳ (~1 phút) nhưng env từ ConfigMap chỉ inject lúc pod start. Cách chuẩn: rollout restart deployment để recreate pod với config mới.

### Vì sao các phương án còn lại sai
- apply lại ConfigMap không tự restart pod.
- kubelet sync volume mount có delay và không áp dụng env.
- delete pod thủ công works nhưng không quản lý, rollout restart an toàn hơn.

> Senior tip: dùng checksum annotation trong pod template để auto-rollout khi config thay đổi; hoặc mount file và reload trong app.`
},
{
  id: 'qz-devops-061', topic: 'devops',
  q: "App Java khởi động 90s (Spring Boot). Readiness probe initialDelaySeconds=10, periodSeconds=5, failureThreshold=3. Kết quả?",
  options: [
    'Pod bị kill/restart vì readiness fail liên tục trong lúc khởi động',
    'Pod Ready ngay sau 10s',
    'Probe tự chờ đến khi app ready',
    'Liveness kill pod sau 90s'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Readiness probe bắt đầu sau 10s, fail liên tục → pod không Ready; nếu có liveness probe tương tự thì pod bị restart. Dùng startupProbe cho app khởi động chậm.

### Vì sao các phương án còn lại sai
- Không Ready ngay sau 10s vì app chưa listen.
- Probe không tự chờ; cần startupProbe hoặc initialDelaySeconds đủ lớn.
- Liveness chỉ kill nếu probe fail; nếu không có liveness thì không kill.

> Senior tip: dùng startupProbe với failureThreshold cao (vd 30 x 10s) để che thời gian khởi động; readiness chỉ check sau khi startup pass.`
},
{
  id: 'qz-devops-062', topic: 'devops',
  q: "Rolling update Deployment với maxUnavailable=1, replicas=3. Số pod tối thiểu available trong quá trình update?",
  options: ['1', '2', '3', '0'],
  answer: 1,
  explain: `**Tóm tắt:** maxUnavailable=1 → tại mọi thời điểm không quá 1 pod unavailable so với desired (3), nên tối thiểu 2 pod available.

### Vì sao các phương án còn lại sai
- 1 là số unavailable tối đa, không phải available.
- 3 chỉ khi maxUnavailable=0 (không cho phép downtime).
- 0 không hợp lý vì đang update.

> Senior tip: kết hợp maxSurge để tăng tốc; với DB migration backward-compatible để zero-downtime.`
},
{
  id: 'qz-devops-063', topic: 'devops',
  q: "Khi drain node, PodDisruptionBudget minAvailable=2 với 3 replicas. Kết quả drain?",
  options: [
    'Chỉ evict 1 pod, drain bị block cho đến khi có node khác',
    'Evict tất cả 3 pod',
    'Drain thành công ngay',
    'PDB bị ignore'
  ],
  answer: 0,
  explain: `**Tóm tắt:** PDB minAvailable=2 → không được evict nếu số available < 2. Với 3 replicas chỉ có thể evict 1 pod, drain chờ pod được reschedule elsewhere.

### Vì sao các phương án còn lại sai
- Evict tất cả vi phạm PDB.
- Drain ngay chỉ khi PDB cho phép.
- PDB không bị ignore (trừ force).

> Senior tip: đặt PDB cho workload critical; drain node với --ignore-daemonsets --delete-emptydir-data; theo dõi disruption.`
},
{
  id: 'qz-devops-064', topic: 'devops',
  q: "PVC Pending với storageClassName không tồn tại và không có default StorageClass. Nguyên nhân?",
  options: [
    'Không có StorageClass phù hợp / WaitForFirstConsumer',
    'Node không đủ CPU',
    'Image pull fail',
    'RBAC thiếu quyền'
  ],
  answer: 0,
  explain: `**Tóm tắt:** PVC Pending thường do không có StorageClass matching hoặc WaitForFirstConsumer chờ pod schedule. Kiểm tra kubectl get sc, kubectl describe pvc.

### Vì sao các phương án còn lại sai
- CPU thiếu làm pod Pending, không PVC.
- Image pull fail làm pod ErrImagePull.
- RBAC thiếu làm forbidden, không PVC pending.

> Senior tip: đặt default StorageClass; dùng WaitForFirstConsumer cho topology-aware provisioning; kiểm tra provisioner logs.`
},
{
  id: 'qz-devops-065', topic: 'devops', multi: true,
  q: "RoleBinding trong namespace team-a bind tới ClusterRole pod-reader. Hiệu lực của quyền? (Chọn 2)",
  options: [
    'Chỉ đọc pod trong namespace team-a',
    'Đọc pod mọi namespace',
    'Có quyền cluster-scoped (node, PV)',
    'RoleBinding chỉ hiệu lực trong namespace team-a'
  ],
  answer: [0, 3],
  explain: `**Tóm tắt:** RoleBinding luôn giới hạn trong namespace của nó, dù ClusterRole chứa quyền cluster-wide; quyền cluster-scoped trong ClusterRole bị bỏ qua khi bind qua RoleBinding.

### Vì sao các phương án còn lại sai
- Đọc pod mọi namespace cần ClusterRoleBinding.
- Quyền cluster-scoped (node/PV) chỉ qua ClusterRoleBinding.

> Senior tip: pattern: ClusterRole định nghĩa quyền, RoleBinding cấp trong namespace; ClusterRoleBinding cấp toàn cụm. Least privilege.`
},
{
  id: 'qz-devops-066', topic: 'devops',
  q: "Pod bị OOMKilled. Nguyên nhân và phân biệt với CPU throttling?",
  options: [
    'Vượt memory limit → kernel kill; CPU vượt limit chỉ throttling, không kill',
    'Vượt CPU limit → kill',
    'OOMKilled do GC pause',
    'CPU throttling cũng kill pod'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Memory là hard limit: vượt → OOMKilled. CPU là soft limit (throttling), không kill pod. Set requests/limits hợp lý, monitor usage.

### Vì sao các phương án còn lại sai
- CPU limit không kill.
- GC pause không trực tiếp OOM (có thể gây OOM nếu heap quá lớn).
- CPU throttling không kill.

> Senior tip: Java heap nên < container memory limit (để lại cho metaspace/thread); dùng -XX:MaxRAMPercentage. Theo dõi throttling via container_cpu_cfs_throttled_seconds.`
},
{
  id: 'qz-devops-067', topic: 'devops',
  q: "Patroni failover: primary down. JDBC URL dùng targetServerType=primary với nhiều host. Client sẽ làm gì?",
  options: [
    'Thử từng host, kết nối host là primary mới sau failover',
    'Luôn kết nối host đầu tiên',
    'Fail ngay nếu host đầu tiên down',
    'Cần restart app'
  ],
  answer: 0,
  explain: `**Tóm tắt:** PostgreSQL JDBC multi-host với targetServerType=primary sẽ iterate hosts, chọn host đang là primary (sau Patroni promote). Không cần restart app nếu retry/reconnect.

### Vì sao các phương án còn lại sai
- Không chỉ host đầu tiên; driver thử list.
- Không fail ngay nếu có retry.
- App không cần restart nếu connection pool reconnect.

> Senior tip: set loadBalanceHosts=false, connectTimeout, socketTimeout; dùng HikariCP + validation query; Patroni DCS (etcd/consul) đảm bảo single primary.`
},
{
  id: 'qz-devops-068', topic: 'devops',
  q: "Quorum trong cluster N node. Số node lẻ tối thiểu để chịu được f failure?",
  options: ['2f+1', 'f+1', '2f', 'f'],
  answer: 0,
  explain: `**Tóm tắt:** Quorum cần majority: N ≥ 2f+1 để chịu f failure (vd 3 node chịu 1 fail, 5 node chịu 2).

### Vì sao các phương án còn lại sai
- f+1 không đủ majority trong nhiều trường hợp.
- 2f thiếu 1.
- f quá ít.

> Senior tip: luôn dùng số node lẻ cho etcd/consul/ZK; witness node cho 2-site; tránh split-brain.`
},
{
  id: 'qz-devops-069', topic: 'devops',
  q: "Redis Sentinel: client kết nối sentinel. Khi master failover, client làm sao tìm master mới?",
  options: [
    'Sentinel thông báo master mới; client subscribe + query sentinel',
    'Client tự scan tất cả node',
    'Cần restart client',
    'Slave tự promote và client biết qua DNS'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Sentinel giám sát, bầu master mới và thông báo qua pub/sub + command SENTINEL get-master-addr-by-name. Client hỗ trợ Sentinel (Jedis/Lettuce) tự cập nhật.

### Vì sao các phương án còn lại sai
- Client không tự scan.
- Không cần restart nếu client hỗ trợ Sentinel.
- DNS không phải cơ chế chính.

> Senior tip: dùng Lettuce với Sentinel config; set readFrom REPLICA cho read scaling; attention: failover có downtime ngắn.`
},
{
  id: 'qz-devops-070', topic: 'devops',
  q: "Kafka: min.insync.replicas=2, acks=all, replication.factor=3. Mất bao nhiêu broker vẫn ghi được?",
  options: ['0 broker (không mất)', '1 broker', '2 broker', '3 broker'],
  answer: 1,
  explain: `**Tóm tắt:** Cần ít nhất min.insync.replicas (2) replica ack. RF=3, mất 1 broker còn 2 in-sync → ghi được. Mất 2 → còn 1 < 2 → NotEnoughReplicas.

### Vì sao các phương án còn lại sai
- Mất 0 không phải câu trả lời về khả năng chịu lỗi.
- Mất 2 broker làm không đủ ISR.
- Mất 3 broker không còn cluster.

> Senior tip: trade-off durability vs availability; theo dõi UnderReplicatedPartitions; không set min.insync.replicas=RF (sẽ mất availability khi 1 broker down).`
},
{
  id: 'qz-devops-071', topic: 'devops',
  q: "Galera cluster: node B commit transaction nhưng certification fail. Kết quả?",
  options: [
    'Transaction rollback trên node B, cluster tiếp tục',
    'Toàn cluster rollback',
    'Node B bị kick khỏi cluster',
    'Transaction vẫn commit trên node B'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Galera certification-based replication: nếu conflict (certification fail), transaction bị rollback trên node thực thi; cluster không bị ảnh hưởng. Ứng dụng cần retry.

### Vì sao các phương án còn lại sai
- Không rollback toàn cluster.
- Node không bị kick chỉ vì 1 conflict.
- Transaction không commit nếu cert fail.

> Senior tip: giảm conflict bằng partitioning writes theo node/key; retry transaction ở app; wsrep_cert_deps_distance theo dõi.`
},
{
  id: 'qz-devops-072', topic: 'devops', multi: true,
  q: "Elasticsearch split-brain prevention. Cấu hình đúng? (Chọn 2)",
  options: [
    'Số master-eligible node lẻ (3/5)',
    'discovery.seed_hosts đúng',
    'Tắt replication',
    'Mỗi node master-eligible'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Cần số master-eligible lẻ và seed hosts đúng để bầu master với quorum. ES 7+ tự quản lý (no minimum_master_nodes). Replication không liên quan split-brain.

### Vì sao các phương án còn lại sai
- Tắt replication không ngăn split-brain.
- Tất cả node master-eligible làm tăng rủi ro và voting complexity (best practice: dedicated master nodes).

> Senior tip: dùng 3 dedicated master nodes; theo dõi cluster health; split-brain gây duplicate data và mất mát.`
},
{
  id: 'qz-devops-073', topic: 'devops',
  q: "RPO và RTO khác nhau thế nào?",
  options: [
    'RPO = mất bao nhiêu dữ liệu chấp nhận được; RTO = thời gian khôi phục chấp nhận được',
    'RPO = thời gian khôi phục; RTO = mất dữ liệu',
    'Cả hai đều là thời gian khôi phục',
    'Cả hai đều là mất dữ liệu'
  ],
  answer: 0,
  explain: `**Tóm tắt:** RPO (Recovery Point Objective) là lượng dữ liệu có thể mất; RTO (Recovery Time Objective) là thời gian hệ thống phải khôi phục. Thiết kế backup/DR theo cả hai.

### Vì sao các phương án còn lại sai
- Đảo ngược định nghĩa.
- Không phải cùng khái niệm.

> Senior tip: RPO thấp → replication/sync backup; RTO thấp → failover tự động, runbook, chaos testing. Đo bằng drill định kỳ.`
}

);
