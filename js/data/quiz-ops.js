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
);
