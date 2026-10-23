/* Câu hỏi topic `devops`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
  {
    id: 'devops-001',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn sẽ viết Dockerfile cho một service Spring Boot 3 như thế nào để image nhỏ, build nhanh khi chỉ sửa code, và an toàn khi chạy production?',
    a: `**Tóm tắt:** Dùng multi-stage build: stage JDK để build và tách layered jar, stage runtime chỉ có JRE. Copy các layer theo thứ tự ít thay đổi nhất trước (dependencies, loader, snapshot, application) để Docker cache tái sử dụng, chạy bằng user non-root, ENTRYPOINT dạng exec để JVM nhận SIGTERM, và đặt {{-XX:MaxRAMPercentage}} thay cho Xmx cứng.

### Vì sao không chỉ "COPY app.jar"
Fat jar 80–150 MB gồm ~95% là thư viện bên thứ ba, chỉ vài trăm KB là code của bạn. Nếu copy cả jar thành **một layer**, mỗi lần sửa một dòng code thì layer 120 MB đó đổi digest, registry phải lưu và node phải pull lại toàn bộ. Docker cache theo layer: một layer bị đổi thì **mọi layer phía sau** cũng phải build lại. Vì vậy phải tách cái ít đổi (dependencies) ra trước, cái hay đổi (class của bạn) ra sau cùng.

Spring Boot đóng gói sẵn file {{layers.idx}} trong jar. Từ Boot 3.3 dùng {{-Djarmode=tools}} để tách (cách cũ {{-Djarmode=layertools}} đã deprecated). Bốn layer mặc định: {{dependencies}}, {{spring-boot-loader}}, {{snapshot-dependencies}}, {{application}}.

### Ví dụ
~~~text
# syntax=docker/dockerfile:1
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
# Cache thư mục .m2 của BuildKit: đổi pom mới tải lại dependency
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q dependency:go-offline
COPY src src
RUN --mount=type=cache,target=/root/.m2 ./mvnw -q package -DskipTests
# Tách jar thành các thư mục layer + launcher
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /out

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
WORKDIR /app
# Ít thay đổi nhất copy trước
COPY --from=build /out/dependencies/ ./
COPY --from=build /out/spring-boot-loader/ ./
COPY --from=build /out/snapshot-dependencies/ ./
COPY --from=build /out/application/ ./
USER 10001
# Exec form: java là PID 1, nhận SIGTERM trực tiếp
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "org.springframework.boot.loader.launch.JarLauncher"]
~~~

### Từng quyết định và lý do
| Quyết định | Lý do |
|---|---|
| Multi-stage | Image cuối không chứa JDK, Maven, source code: nhỏ hơn vài trăm MB, ít CVE hơn |
| Base JRE (hoặc distroless/jlink) | Bớt công cụ thừa, giảm bề mặt tấn công |
| Copy pom trước src | Sửa code không làm mất cache bước tải dependency |
| USER non-root, UID số | Container escape ít nguy hiểm hơn; Kubernetes {{runAsNonRoot}} kiểm tra được UID số |
| Exec form ENTRYPOINT | Shell form bọc java trong {{/bin/sh -c}}, sh không chuyển SIGTERM, graceful shutdown không chạy và pod bị SIGKILL sau grace period |
| MaxRAMPercentage | Heap tự co giãn theo memory limit của container |

### Câu trả lời sai phổ biến
- "Dùng tag {{latest}} cho base image": build không tái lập được. Nên pin version, tốt nhất pin cả digest.
- "Chạy {{mvn package}} trên máy rồi COPY jar vào": được, nhưng môi trường build mỗi máy một khác; CI nên build trong stage chuẩn.
- "Đặt {{-Xmx}} bằng đúng memory limit": quên metaspace, thread stack, code cache, direct buffer nên dễ bị OOMKilled.

### Pitfall production
- Quên {{.dockerignore}}: thư mục {{target}}, {{.git}} bị gửi vào build context, build chậm, có khi lộ secret.
- Nhét secret vào {{ARG}}/{{ENV}}: nằm vĩnh viễn trong lịch sử image. Dùng {{RUN --mount=type=secret}} của BuildKit.
- Alpine (musl) với một số native lib (Netty tcnative, font cho báo cáo PDF) gây lỗi khó đoán; dùng image Ubuntu/Debian-based an toàn hơn.

> Senior tip: Đo bằng {{docker history}} hoặc công cụ dive: sau khi tách layer, một commit sửa code thường chỉ đẩy layer application vài trăm KB thay vì cả trăm MB. Với 50 service và 20 deploy/ngày, registry và thời gian pull trên node giảm rõ rệt. Có thể dùng Buildpacks ({{spring-boot:build-image}}) nếu team không muốn tự bảo trì Dockerfile.`,
    follow: [
      'Distroless hoặc jlink custom runtime có ưu nhược điểm gì so với image JRE thường?',
      'Làm sao truyền credential Nexus vào bước build mà không để lại trong image?',
      'CDS/AOT cache giúp gì cho thời gian khởi động và đưa vào Dockerfile thế nào?'
    ],
    tags: ['Docker', 'Dockerfile', 'Spring Boot', 'Layered jar', 'BuildKit']
  },
  {
    id: 'devops-002',
    topic: 'devops',
    level: 'senior',
    q: 'Container khác VM ở điểm nào? Vì sao chạy app Java trong container cần đặc biệt chú ý giới hạn CPU và RAM, và bạn cấu hình JVM thế nào?',
    a: `**Tóm tắt:** VM ảo hoá phần cứng và có kernel riêng; container chỉ là process trên host, dùng chung kernel, được cô lập bằng namespaces và giới hạn tài nguyên bằng cgroups. JVM phải đọc đúng giới hạn cgroup để chọn heap, số GC thread, thread pool; nếu cấu hình sai thì app bị OOMKilled hoặc bị CPU throttling dù máy host còn dư tài nguyên.

### Container dưới góc nhìn kernel
- **Namespaces** (pid, net, mnt, uts, ipc, user) quyết định process **nhìn thấy** gì: PID 1 riêng, network riêng, filesystem riêng.
- **cgroups** quyết định process **được dùng** bao nhiêu: memory.max, cpu.max (cgroup v2).
- **Image** là chồng các layer read-only (overlayfs), container thêm một layer ghi mỏng ở trên. Nhiều container dùng chung layer nên tiết kiệm disk và khởi động nhanh.

| | VM | Container |
|---|---|---|
| Kernel | Riêng từng VM | Dùng chung kernel host |
| Khởi động | Hàng chục giây đến phút | Mili giây (cộng thời gian app) |
| Cô lập | Mạnh (hypervisor) | Yếu hơn; lỗ hổng kernel ảnh hưởng mọi container |
| Overhead | GB RAM cho mỗi guest OS | Gần như không |
| Phù hợp | Multi-tenant không tin nhau, OS khác nhau | Đóng gói và scale microservice |

### Vì sao Java đặc biệt nhạy cảm
JVM tự chọn cấu hình theo "máy" nó thấy (ergonomics). Trước JDK 10, JVM đọc {{/proc/meminfo}} và thấy RAM của **host** (ví dụ 64 GB), nên heap mặc định là 1/4 = 16 GB trong khi container chỉ được 2 GB, dẫn tới kernel OOM killer bắn chết process (exit code 137) mà không có OutOfMemoryError nào trong log.

Từ JDK 10 (backport về 8u191), {{-XX:+UseContainerSupport}} bật mặc định; hỗ trợ cgroup v2 có từ JDK 15 và được backport về 11.0.16, 8u372. Dù vậy mặc định vẫn có bẫy:
- **Heap mặc định chỉ 25%** memory limit ({{MaxRAMPercentage=25}}). Pod 2 GB chỉ có heap 512 MB, phí tài nguyên.
- **Memory không chỉ là heap**: metaspace, code cache, thread stack (~1 MB mỗi thread, 300 thread thì ~300 MB), direct buffer của Netty, GC overhead. Vì vậy thường đặt 70–75%, không đặt 100%.
- **CPU**: JVM tính {{availableProcessors}} từ CPU **limit** (quota). Nếu limit = 1 CPU, JVM coi máy không phải server-class và chọn **SerialGC**, ForkJoinPool common pool và nhiều thread pool chỉ có 1 thread.
- **CPU throttling**: CFS quota tính theo chu kỳ 100 ms. Limit 1 CPU mà app có 8 thread chạy song song thì dùng hết quota trong ~12 ms, sau đó bị treo ~88 ms. Biểu hiện là p99 latency tăng vọt trong khi CPU trung bình chỉ 40%.

### Cấu hình khuyến nghị
~~~bash
# Kiểm tra JVM thấy gì bên trong container
java -XshowSettings:system -version
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|UseSerialGC|UseG1GC"

# Cờ chạy thật
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -XX:ActiveProcessorCount=2"
~~~
- Memory: đặt request = limit cho service quan trọng (tránh bị evict, dễ dự đoán).
- CPU: nhiều team bỏ CPU limit (chỉ đặt request) để tránh throttling; khi đó nên đặt {{-XX:ActiveProcessorCount}} để thread pool không phình theo số core của node.

### Câu trả lời sai phổ biến
- "Container là VM nhẹ": sai về bản chất, container là process.
- "JVM không biết mình chạy trong container": đúng với JDK 8 cũ, sai với JDK 17/21.
- "Đặt Xmx = limit là an toàn": sai, phần non-heap sẽ vượt limit.

> Senior tip: Khi pod bị OOMKilled mà heap dump trống, hãy so RSS của process với limit và bật {{-XX:NativeMemoryTracking=summary}} rồi {{jcmd 1 VM.native_memory summary}} để xem phần ngoài heap. Khi p99 tăng mà CPU thấp, xem metric {{container_cpu_cfs_throttled_periods_total}}: đây là nguyên nhân rất hay gặp trên cluster ngân hàng đặt limit 500m cho service Java.`,
    follow: [
      'Pod bị OOMKilled nhưng heap usage chỉ 60%. Bạn điều tra phần bộ nhớ còn lại thế nào?',
      'Có nên bỏ CPU limit cho service Java không? Rủi ro với các pod khác trên cùng node là gì?'
    ],
    tags: ['Docker', 'cgroups', 'JVM', 'Container', 'OOMKilled']
  },
  {
    id: 'devops-003',
    topic: 'devops',
    level: 'mid',
    q: 'Người dùng gọi https://api.bank.vn/accounts/123 tới một service chạy trên Kubernetes. Hãy mô tả request đi qua những thành phần nào (Pod, Deployment, Service, Ingress, ConfigMap, Secret) và mỗi thành phần đóng vai trò gì.',
    a: `**Tóm tắt:** DNS trỏ tới load balancer phía trước Ingress controller; Ingress controller đọc rule Ingress (host + path) để chọn Service; Service là địa chỉ ổn định, chọn các Pod đang Ready qua label selector (danh sách EndpointSlice); kube-proxy hoặc controller chuyển gói tin tới IP của một Pod. Deployment không nằm trên đường đi của request: nó chỉ đảm bảo luôn có đủ Pod đúng version. ConfigMap và Secret cung cấp cấu hình cho Pod lúc khởi động.

### Đường đi của request
~~~text
Client
  -> DNS api.bank.vn  -> IP của Load Balancer (cloud LB / F5 / MetalLB)
  -> Ingress controller (nginx, HAProxy, Traefik...) chạy dưới dạng Pod
       khớp rule: host api.bank.vn, path /accounts -> Service account-svc:80
  -> Service account-svc (ClusterIP 10.96.12.34, port 80 -> targetPort 8080)
       selector app=account  -> EndpointSlice: 10.244.1.15, 10.244.2.7 (chỉ Pod Ready)
  -> kube-proxy (iptables/IPVS) hoặc eBPF (Cilium) DNAT tới 1 Pod IP
  -> Container Spring Boot lắng nghe 8080
~~~

### Vai trò từng thành phần
| Thành phần | Là gì | Vì sao cần |
|---|---|---|
| Pod | Đơn vị chạy nhỏ nhất, 1 hoặc nhiều container chung network namespace và IP | Pod là "phù du": chết thì sinh Pod mới với IP mới |
| Deployment | Khai báo trạng thái mong muốn (image, số replica), quản lý ReplicaSet | Tự thay Pod chết, rolling update, rollback |
| Service | Tên DNS + IP ảo ổn định trước một nhóm Pod | Client không phải biết IP Pod thay đổi liên tục |
| Ingress | Rule L7 (host, path, TLS) cho traffic từ ngoài vào | Một LB dùng cho nhiều service thay vì mỗi service một LB |
| ConfigMap | Cấu hình không nhạy cảm (URL, feature flag) | Tách cấu hình khỏi image: 1 image chạy mọi môi trường |
| Secret | Mật khẩu DB, API key, cert | Quản lý quyền truy cập (RBAC) riêng, có thể mã hoá at-rest trong etcd |

### Vì sao Service dùng label selector chứ không danh sách Pod
Pod được tạo/xoá liên tục khi scale hoặc deploy. Service chỉ khai báo "tất cả Pod có label app=account"; control plane tự cập nhật EndpointSlice. Chỉ Pod qua **readiness probe** mới được đưa vào danh sách, đây là lý do readiness quan trọng khi deploy.

### Loại Service
- **ClusterIP** (mặc định): chỉ gọi được trong cluster, dùng cho service-to-service ({{http://account-svc.payment.svc.cluster.local}}).
- **NodePort**: mở port 30000–32767 trên mọi node, hay dùng on-prem khi LB ngoài trỏ vào node.
- **LoadBalancer**: cloud tạo LB riêng cho Service.

### ConfigMap và Secret vào Pod thế nào
~~~yaml
containers:
  - name: account
    image: harbor.bank.local/core/account:1.8.2
    envFrom:
      - configMapRef: { name: account-config }   # SPRING_PROFILES_ACTIVE, URL...
    env:
      - name: SPRING_DATASOURCE_PASSWORD
        valueFrom:
          secretKeyRef: { name: account-db, key: password }
~~~
Biến môi trường chỉ đọc lúc container khởi động: sửa ConfigMap **không** làm app thấy giá trị mới cho tới khi Pod restart. Mount dạng volume thì file được cập nhật sau một khoảng trễ (trừ khi dùng subPath), nhưng app vẫn phải tự reload.

### Câu trả lời sai phổ biến
- "Request đi qua Deployment": sai, Deployment chỉ là controller.
- "Secret được mã hoá": mặc định chỉ base64; phải bật encryption at rest và giới hạn RBAC.
- "Service là một process proxy": với kube-proxy iptables, Service chỉ là rule NAT trên mỗi node, không có process nào nhận gói tin.

### Pitfall production
- Ingress-nginx mặc định gửi thẳng tới Pod IP lấy từ endpoint, không đi qua ClusterIP; vì vậy cấu hình retry/timeout ở Ingress ảnh hưởng trực tiếp tới từng Pod.
- Selector gõ sai label: Service có 0 endpoint, Ingress trả 503. Kiểm tra bằng {{kubectl get endpointslices -l kubernetes.io/service-name=account-svc}}.

> Senior tip: Khi debug "gọi không tới", đi từng chặng từ trong ra ngoài: {{kubectl port-forward}} vào Pod, rồi curl Service từ một Pod khác, rồi mới tới Ingress. Ngoài ra Kubernetes đang khuyến khích chuyển từ Ingress sang **Gateway API** (HTTPRoute) vì Ingress thiếu chuẩn cho header routing, traffic split; nên biết để trả lời khi bị hỏi xu hướng.`,
    follow: [
      'Readiness probe fail thì request đang tới Pod đó xử lý thế nào?',
      'Sửa ConfigMap rồi, làm sao để các Pod nhận cấu hình mới một cách có kiểm soát?',
      'Headless Service là gì và khi nào cần (ví dụ StatefulSet, Kafka)?'
    ],
    tags: ['Kubernetes', 'Service', 'Ingress', 'ConfigMap', 'Secret']
  },
  {
    id: 'devops-004',
    topic: 'devops',
    level: 'senior',
    q: 'Mỗi lần deploy service thanh toán trên Kubernetes, monitoring ghi nhận vài chục request lỗi 502/503. Bạn cấu hình rolling update, probe và graceful shutdown thế nào để deploy không rơi request nào?',
    a: `**Tóm tắt:** Lỗi đến từ hai đầu: Pod mới nhận traffic khi chưa sẵn sàng, và Pod cũ bị tắt khi vẫn còn được route tới hoặc đang xử lý request. Cách sửa: readiness probe đúng nghĩa (đã warm-up, đã kết nối DB), maxUnavailable 0 với maxSurge vừa phải, preStop sleep vài giây để chờ endpoint được gỡ khỏi mọi proxy, Spring Boot graceful shutdown, và terminationGracePeriodSeconds đủ lớn.

### Rolling update hoạt động thế nào
Deployment tạo ReplicaSet mới và tăng dần replica của nó, đồng thời giảm ReplicaSet cũ:
- {{maxSurge}} (mặc định 25%): được tạo dư bao nhiêu Pod so với replicas.
- {{maxUnavailable}} (mặc định 25%): được thiếu bao nhiêu Pod sẵn sàng.
Với 4 replica, đặt maxSurge 1, maxUnavailable 0: luôn có ≥ 4 Pod Ready, mỗi lượt thêm 1 Pod mới, chờ nó Ready rồi mới xoá 1 Pod cũ. Pod mới chỉ được tính là "available" khi Ready và đã qua {{minReadySeconds}}.

### Vì sao vẫn rơi request khi Pod cũ bị xoá
Khi Pod bị xoá, hai việc diễn ra **song song**, không có thứ tự:
1. Kubelet chạy preStop hook rồi gửi SIGTERM cho container.
2. Control plane gỡ Pod khỏi EndpointSlice, sau đó kube-proxy trên mọi node và Ingress controller mới cập nhật rule.
Nếu app nhận SIGTERM và đóng cổng ngay trong khi bước 2 chưa lan tới hết proxy, request mới vẫn bị gửi tới, trả về connection refused hoặc 502. Vì vậy cần **preStop sleep** vài giây để "chờ mạng quên mình" trước khi bắt đầu shutdown.

~~~text
t=0   Pod bị đánh dấu Terminating -> bắt đầu gỡ khỏi endpoint (lan dần)
t=0   preStop: sleep 10              -> app vẫn phục vụ bình thường
t=10  SIGTERM -> Spring graceful: ngừng nhận request mới, chờ request đang chạy
t=10..40  request dở dang hoàn tất, đóng pool DB, consumer Kafka commit offset
t=60  hết terminationGracePeriodSeconds -> SIGKILL nếu còn sống
~~~

### Cấu hình mẫu
~~~yaml
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
  minReadySeconds: 10
  template:
    spec:
      terminationGracePeriodSeconds: 60   # > preStop + thời gian shutdown của Spring
      containers:
        - name: payment
          lifecycle:
            preStop:
              exec: { command: ["sh", "-c", "sleep 10"] }  # image distroless: dùng sleep action có sẵn của K8s
          readinessProbe:
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 10
            failureThreshold: 3
          startupProbe:
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            periodSeconds: 5
            failureThreshold: 30   # cho phép khởi động tới 150s
~~~
Phía Spring Boot: {{server.shutdown=graceful}} (mặc định từ Boot 3.4) và {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.

### Readiness vs liveness vs startup
| Probe | Fail thì sao | Nên kiểm tra |
|---|---|---|
| startup | Chưa chạy liveness/readiness; fail quá ngưỡng thì restart | App đã khởi động xong |
| readiness | Gỡ khỏi Service, **không** restart | Có thể phục vụ request (warm-up xong, pool sẵn sàng) |
| liveness | Restart container | App bị treo không tự hồi phục (deadlock) |

### Câu trả lời sai phổ biến
- "Cho liveness kiểm tra DB": DB chậm 30 giây thì toàn bộ Pod bị restart cùng lúc, biến sự cố nhỏ thành sập hệ thống.
- "Rolling update tự động zero-downtime": chỉ đúng khi probe và shutdown được cấu hình đúng.
- "Tăng terminationGracePeriodSeconds là đủ": không có preStop thì vẫn lỗi trong vài giây đầu.

### Rollback
{{kubectl rollout status deploy/payment}} chờ kết quả; {{kubectl rollout undo deploy/payment}} quay về revision trước (giữ {{revisionHistoryLimit}}, mặc định 10). Nếu Pod mới không Ready, rollout dừng lại và báo lỗi sau {{progressDeadlineSeconds}} (mặc định 600s) nhưng **không tự rollback**; pipeline phải tự gọi undo hoặc dùng Argo Rollouts.

> Senior tip: Thay đổi schema DB phải tương thích ngược (expand-contract) vì trong lúc rolling update, version cũ và mới chạy song song. Kiểm chứng zero-downtime bằng cách chạy k6/JMeter liên tục trong lúc deploy trên staging và yêu cầu 0 lỗi; với service thanh toán đây nên là một bước trong checklist release.`,
    follow: [
      'Consumer Kafka trong Pod đang bị tắt cần làm gì để không xử lý trùng hoặc mất message?',
      'Khi nào bạn chọn blue-green hoặc canary thay vì rolling update?',
      'Readiness probe có nên kiểm tra DB không? Trade-off là gì?'
    ],
    tags: ['Kubernetes', 'Rolling update', 'Probe', 'Graceful shutdown', 'Zero downtime']
  },
  {
    id: 'devops-005',
    topic: 'devops',
    level: 'senior',
    q: 'Sau khi deploy, Pod của bạn rơi vào một trong các trạng thái CrashLoopBackOff, ImagePullBackOff, Pending hoặc OOMKilled. Bạn chẩn đoán từng trường hợp theo trình tự nào?',
    a: `**Tóm tắt:** Luôn bắt đầu bằng {{kubectl get pod}} để thấy trạng thái, {{kubectl describe pod}} để đọc phần Events và Last State, rồi {{kubectl logs --previous}} để xem log của lần chạy vừa chết. Pending là vấn đề lập lịch (tài nguyên, taint, PVC); ImagePullBackOff là vấn đề registry/tag/credential; CrashLoopBackOff là app khởi động rồi chết; OOMKilled là vượt memory limit, kernel giết process với exit code 137.

### Quy trình chung
~~~bash
kubectl get pod -n payment -o wide                 # STATUS, RESTARTS, NODE
kubectl describe pod payment-7d9f-abcde -n payment # Events cuối output, Last State, Exit Code
kubectl logs payment-7d9f-abcde -n payment --previous   # log của container đã chết
kubectl get events -n payment --sort-by=.lastTimestamp
kubectl top pod -n payment                          # cần metrics-server
~~~

### Từng trạng thái
| Trạng thái | Ý nghĩa | Nguyên nhân hay gặp | Bằng chứng |
|---|---|---|---|
| Pending | Chưa được xếp lên node | Không node nào đủ CPU/RAM theo **request**; taint không có toleration; nodeSelector/affinity sai; PVC chưa bind | Event {{FailedScheduling}}: "0/6 nodes are available: 3 Insufficient memory..." |
| ImagePullBackOff / ErrImagePull | Kubelet không kéo được image | Sai tag, image chưa push, thiếu imagePullSecrets, registry nội bộ hết hạn cert hoặc node không ra được registry | Event Failed: "manifest unknown", "unauthorized", "x509" |
| CrashLoopBackOff | Container chạy rồi thoát liên tục, kubelet chờ lâu dần trước khi restart (10s, 20s, 40s... tối đa 5 phút) | Lỗi cấu hình Spring (thiếu property, sai URL DB), Flyway migration fail, liveness probe giết app khởi động chậm | Last State: Terminated, Exit Code 1; log --previous có stack trace |
| OOMKilled | Kernel giết process vì vượt memory limit | Heap đặt quá gần limit, native memory, thread quá nhiều | Last State: Terminated, Reason: OOMKilled, Exit Code: 137 |
| CreateContainerConfigError | Không tạo được container | Thiếu ConfigMap/Secret hoặc key được tham chiếu | Event: "secret ... not found" |

### Đọc exit code
- **1**: app tự thoát do exception (Spring {{APPLICATION FAILED TO START}}).
- **137** = 128 + 9 (SIGKILL): OOMKilled hoặc bị kill do quá grace period / liveness fail. Phân biệt bằng trường Reason.
- **143** = 128 + 15 (SIGTERM): bị tắt bình thường.

### CrashLoopBackOff: hai bẫy hay gặp
1. **Liveness giết app khởi động chậm**: app Spring cần 90 giây, liveness bắt đầu sau 30 giây với failureThreshold 3, vậy app bị restart mãi mãi. Log không có lỗi, Events ghi "Liveness probe failed". Sửa bằng startupProbe.
2. **Log rỗng**: app chết trước khi kịp ghi log (sai ENTRYPOINT, thiếu class main, sai kiến trúc image arm64/amd64 sẽ báo "exec format error"). Xem Events và chạy thử image bằng {{docker run}} trên máy.

### OOMKilled khác OutOfMemoryError
| | OOMKilled | java.lang.OutOfMemoryError |
|---|---|---|
| Ai phát hiện | Kernel (cgroup) | JVM |
| Có stack trace | Không | Có (và heap dump nếu bật) |
| Nguyên nhân | Tổng RSS > limit | Heap/metaspace đầy |
| Sửa | Giảm MaxRAMPercentage, tăng limit, kiểm tra native memory | Tìm leak, tăng heap |

### Câu trả lời sai phổ biến
- "Xoá Pod đi cho nó tạo lại": Pod mới cũng lỗi y hệt vì nguyên nhân nằm ở spec.
- "CrashLoopBackOff là lỗi Kubernetes": không, gần như luôn là lỗi app hoặc cấu hình.
- "Pending vì node hết RAM thực tế": scheduler xét tổng **request**, không xét mức dùng thực.

> Senior tip: Đặt alert cho {{kube_pod_container_status_restarts_total}} tăng và cho reason OOMKilled thay vì chờ người dùng báo. Trong ngân hàng, lỗi ImagePullBackOff lúc 2 giờ sáng thường do cert của Harbor nội bộ hết hạn hoặc robot account bị rotate: hãy đưa ngày hết hạn cert và token vào checklist vận hành.`,
    follow: [
      'Làm sao debug một container distroless đang CrashLoopBackOff khi không có shell? (gợi ý: kubectl debug, ephemeral container)',
      'Pod Pending vì Insufficient cpu trong khi node chỉ dùng 20% CPU thực tế. Bạn giải thích và xử lý thế nào?'
    ],
    tags: ['Kubernetes', 'Troubleshooting', 'CrashLoopBackOff', 'OOMKilled', 'kubectl']
  },
  {
    id: 'devops-006',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn cấu hình HPA cho service Java như thế nào: scale theo CPU hay theo custom metric như RPS hoặc lag Kafka? Vì sao app Java thường scale chậm và bạn xử lý thế nào?',
    a: `**Tóm tắt:** HPA định kỳ (mặc định 15 giây) tính số replica = ceil(replica hiện tại × giá trị metric / target). CPU dễ dùng nhưng là chỉ số gián tiếp; với consumer Kafka hay API phụ thuộc I/O nên scale theo metric gần với tải thật (lag, RPS, độ dài queue) qua Prometheus Adapter hoặc KEDA. Java scale chậm vì JVM khởi động lâu và JIT warm-up làm CPU tăng vọt ở Pod mới; xử lý bằng startupProbe, minReplicas đủ lớn, chính sách scaleUp nhanh/scaleDown chậm và giảm thời gian khởi động (CDS, AOT cache).

### Công thức và hệ quả
~~~text
desired = ceil(current * currentMetric / target)
Ví dụ: 4 Pod, CPU trung bình 90% của request, target 60%
desired = ceil(4 * 90 / 60) = 6
~~~
- Phần trăm CPU tính **theo request**, không theo limit. Không đặt CPU request thì HPA theo CPU không hoạt động.
- Có tolerance mặc định 10%: lệch nhỏ không scale để tránh dao động.
- Scale down có stabilization window mặc định 300 giây.

### CPU hay custom metric
| Metric | Hợp với | Hạn chế |
|---|---|---|
| CPU | Service tính toán, mã hoá, serialize nặng | Service chờ DB/HTTP: latency tăng mà CPU thấp, HPA không phản ứng |
| Memory | Hiếm khi hợp với Java | Heap JVM ít khi co lại sau GC, nên chỉ scale lên mà không xuống |
| RPS / concurrent request | API gateway, service I/O-bound | Cần Prometheus + adapter, phải biết năng lực 1 Pod |
| Lag Kafka | Consumer | Replica vượt số partition thì Pod thừa ngồi không |

### Cấu hình mẫu (autoscaling/v2)
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: payment }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: payment }
  minReplicas: 4
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target: { type: Utilization, averageUtilization: 60 }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies: [ { type: Percent, value: 100, periodSeconds: 30 } ]  # tối đa gấp đôi mỗi 30s
    scaleDown:
      stabilizationWindowSeconds: 600
      policies: [ { type: Pods, value: 1, periodSeconds: 60 } ]       # giảm từ từ
~~~
Với Kafka, KEDA có sẵn scaler theo consumer lag và có thể scale về 0; khi đặt maxReplicas phải ≤ số partition.

### Vì sao Java scale chậm
1. **Khởi động**: Spring Boot app lớn mất 30–90 giây (classpath scanning, tạo bean, kết nối pool, Flyway).
2. **JIT warm-up**: vài phút đầu code chạy ở interpreter/C1, CPU tăng cao, latency kém hơn Pod đã ấm.
3. **Vòng lặp xấu**: Pod mới ngốn CPU khi khởi động, kéo trung bình CPU lên, HPA lại scale thêm. Kubernetes giảm ảnh hưởng này bằng cách bỏ qua mẫu CPU của Pod chưa Ready trong giai đoạn đầu, nhưng readiness probe báo Ready quá sớm sẽ làm mất tác dụng.
4. Từ lúc tải tăng đến lúc Pod mới phục vụ được: chu kỳ metric + thời gian pull image + khởi động + warm-up, dễ là 2–3 phút. Đợt tăng tải ngắn đã qua trước khi Pod mới sẵn sàng.

### Cách xử lý
- **minReplicas** đủ gánh tải bình thường + buffer; HPA chỉ để hấp thụ phần tăng.
- **Scale theo lịch** cho đỉnh biết trước (lương về ngày 25, flash sale 12.12): KEDA cron scaler hoặc CronJob đổi minReplicas.
- Giảm thời gian khởi động: CDS/AppCDS, lazy init có chọn lọc, JDK 24+ AOT cache (JEP 483), hoặc GraalVM native image nếu chấp nhận ràng buộc.
- Warm-up chủ động trước khi báo Ready (gọi các endpoint chính vài trăm lần).
- Pre-pull image hoặc giữ image nhỏ; node pool có sẵn chỗ (Cluster Autoscaler/Karpenter thêm node còn mất vài phút).

### Câu trả lời sai phổ biến
- "Đặt HPA là tự chịu được mọi đỉnh tải": HPA phản ứng theo phút, không theo giây.
- "Scale theo memory cho Java": heap không trả lại, replica chỉ tăng.
- "Tăng maxReplicas lên 100": DB connection pool × replica có thể vượt max_connections của DB.

> Senior tip: Trước mùa cao điểm, chạy load test đo năng lực một Pod (ví dụ 400 RPS ở p99 dưới 200 ms) rồi tính minReplicas từ đó, đừng trông chờ HPA. Luôn nhân số connection pool với maxReplicas để chắc DB chịu được, và nhớ HPA với VPA không nên cùng điều khiển CPU/memory của một Deployment.`,
    follow: [
      'Scale consumer Kafka vượt số partition thì chuyện gì xảy ra? Rebalance ảnh hưởng thế nào khi scale liên tục?',
      'HPA scale lên 20 Pod nhưng latency không giảm. Bạn nghi ngờ điểm nghẽn ở đâu?',
      'Làm sao rút thời gian khởi động Spring Boot từ 60 giây xuống dưới 10 giây?'
    ],
    tags: ['Kubernetes', 'HPA', 'KEDA', 'Autoscaling', 'JVM warm-up']
  },
  {
    id: 'devops-007',
    topic: 'devops',
    level: 'mid',
    q: 'Bạn SSH vào một server Linux chạy service Java đang bị báo chậm. Bạn sẽ gõ những lệnh nào, theo thứ tự nào, để khoanh vùng nguyên nhân (CPU, RAM, disk, network, log)?',
    a: `**Tóm tắt:** Đi theo thứ tự tài nguyên: {{uptime}}/{{top}} xem load và CPU (chú ý %wa, %st), {{free -m}} xem RAM và swap, {{df -h}}/{{df -i}} xem disk và inode, {{ss}} xem kết nối và port, {{lsof}} xem file/socket process đang giữ, rồi đọc log bằng {{tail}}/{{grep}}/{{journalctl}} và {{dmesg}} để bắt OOM killer. Với Java, kết hợp {{top -H}} tìm thread ăn CPU rồi đối chiếu với thread dump.

### 1. CPU và load
~~~bash
uptime                     # load average 1/5/15 phút, so với số core (nproc)
top -c                     # nhấn 1 để xem từng core, P sắp theo CPU, M theo RAM
vmstat 1 5                 # r: hàng đợi chạy, si/so: swap, wa: chờ I/O
~~~
Đọc dòng {{%Cpu(s)}} của top:
- **us** cao: code đang tính toán (vòng lặp, GC, serialize).
- **sy** cao: nhiều system call, context switch.
- **wa** cao: CPU rảnh nhưng chờ disk, nghi I/O.
- **st** cao (VM): hypervisor lấy CPU của bạn, vấn đề ở tầng hạ tầng.

Load average tính cả process đang chờ I/O (trạng thái D) trên Linux, nên load cao chưa chắc là thiếu CPU.

### 2. Thread Java nào ăn CPU
~~~bash
top -H -p 12345            # 12345 = PID java; thấy thread 12399 dùng 98% CPU
jstack 12345 | grep -A 20 'nid=12399 '  # JDK 18+: nid in dạng thập phân
printf '%x\\n' 12399        # JDK 8–17: nid là hex → 306f
jstack 12345 | grep -A 20 'nid=0x306f'
~~~
Nếu đó là thread "GC Thread" hoặc "G1 Conc", vấn đề là bộ nhớ chứ không phải code: xem GC log.

### 3. Bộ nhớ
~~~bash
free -m                    # nhìn cột available, không nhìn cột free
dmesg -T | grep -i -E 'killed process|out of memory'   # OOM killer đã ra tay chưa
~~~
Linux dùng RAM trống làm page cache, nên "free" thấp là bình thường. Swap đang dùng nhiều với JVM là rất xấu: GC phải chạm toàn bộ heap, bị swap thì pause kéo dài hàng giây.

### 4. Disk
~~~bash
df -h                      # dung lượng; 100% thì log/DB ghi lỗi
df -i                      # inode: hết inode vẫn báo "No space left" dù còn GB
du -sh /var/log/* | sort -h | tail
lsof +L1                   # file đã xoá nhưng process vẫn giữ mở, chưa giải phóng dung lượng
iostat -x 1                # %util, await của từng disk (gói sysstat)
~~~

### 5. Network và kết nối
~~~bash
ss -s                                   # tổng quan số kết nối theo trạng thái
ss -ltnp                                # port đang listen và process nào
ss -tan state close-wait | wc -l        # CLOSE_WAIT nhiều: app không đóng connection
ss -tan state time-wait | wc -l
ss -tnp | grep 5432 | wc -l             # số kết nối tới PostgreSQL
~~~

### 6. Log
~~~bash
tail -f /opt/app/logs/app.log | grep --line-buffered ERROR
grep -c ' 500 ' access.log
awk '{print $9}' access.log | sort | uniq -c | sort -rn   # đếm theo status code
journalctl -u payment.service --since '10 min ago' -f
~~~

### Bảng triệu chứng nhanh
| Triệu chứng | Nghi ngờ | Lệnh xác nhận |
|---|---|---|
| CPU 100% một core | Vòng lặp vô hạn, regex | top -H + jstack |
| CPU cao, nhiều thread GC | Heap gần đầy | jstat -gcutil PID 1000 |
| wa cao | Disk chậm, log quá nhiều | iostat -x |
| CLOSE_WAIT tăng dần | Không đóng response/connection | ss, lsof -p PID |
| "Too many open files" | Rò rỉ file descriptor | ls /proc/PID/fd, wc -l; ulimit -n |
| Process biến mất | OOM killer | dmesg, journalctl -k |

### Câu trả lời sai phổ biến
- "Restart service trước cho nhanh": mất hết bằng chứng. Lấy thread dump, heap histogram ({{jcmd PID GC.class_histogram}}) và số liệu trước, restart sau.
- "free thấp là hết RAM": sai, xem cột available.
- "Xoá file log to là xong": nếu process còn giữ file, dung lượng không được trả; phải truncate ({{: > file}}) hoặc restart process.

> Senior tip: Chuẩn bị sẵn một script thu thập (top, ss, df, 3 thread dump cách nhau 5 giây, jstat) và chạy ngay khi có sự cố; ở ngân hàng việc được SSH vào prod thường phải xin quyền theo phiên, nên mỗi phút trên server phải thu được tối đa bằng chứng. Nếu chạy trên Kubernetes, các lệnh tương đương là kubectl top, kubectl exec, và jcmd bên trong container.`,
    follow: [
      'Số kết nối CLOSE_WAIT tăng dần theo thời gian. Lỗi nằm ở phía client hay server, và trong code Java thường do đâu?',
      'Server báo "No space left on device" nhưng df -h còn 30%. Bạn kiểm tra gì tiếp?'
    ],
    tags: ['Linux', 'Troubleshooting', 'top', 'ss', 'lsof', 'jstack']
  },
  {
    id: 'devops-008',
    topic: 'devops',
    level: 'mid',
    q: 'So sánh merge, rebase và squash khi tích hợp nhánh. Khi nào dùng cherry-pick? Revert khác reset thế nào, và lệnh nào bị cấm trên nhánh dùng chung?',
    a: `**Tóm tắt:** Merge giữ nguyên lịch sử và tạo merge commit; rebase viết lại commit của bạn lên đỉnh nhánh đích cho lịch sử thẳng; squash gộp cả nhánh thành một commit. Cherry-pick chép một commit cụ thể sang nhánh khác (thường để mang hotfix). Revert tạo commit mới đảo ngược thay đổi, an toàn trên nhánh chung; reset di chuyển con trỏ nhánh và viết lại lịch sử, chỉ dùng trên nhánh local. Quy tắc vàng: không rebase, reset rồi force push lên nhánh người khác đang dùng.

### Hình dung
~~~text
Ban đầu:         main: A---B---C
                 feature:   \\---D---E

merge:           A---B---C-------M      (M có 2 parent: C và E)
                      \\---D---E---/

rebase rồi FF:   A---B---C---D'---E'    (D', E' là commit MỚI, hash khác)

squash merge:    A---B---C---S          (S chứa thay đổi của D+E)
~~~

### Vì sao rebase "nguy hiểm"
Commit trong Git được định danh bằng hash của nội dung + parent. Rebase đổi parent nên tạo ra commit mới D', E'. Nếu đồng nghiệp đã kéo D, E về và làm tiếp, sau khi bạn force push họ sẽ có hai bản của cùng thay đổi, conflict lặp lại và có thể mất code. Vì vậy chỉ rebase nhánh **của riêng bạn**, và khi bắt buộc force push thì dùng {{git push --force-with-lease}} (từ chối nếu remote có commit bạn chưa thấy).

### So sánh
| | Merge | Rebase | Squash |
|---|---|---|---|
| Lịch sử | Đúng sự thật, có nhánh | Thẳng, dễ đọc | Một commit mỗi feature |
| Viết lại commit | Không | Có | Có (tạo commit mới) |
| Conflict | Giải một lần | Có thể giải nhiều lần (mỗi commit) | Một lần |
| git bisect | Được | Tốt nhất | Commit to, khó khoanh vùng |
| Hợp với | Nhánh release, nhánh dùng chung | Cập nhật feature branch từ main | PR nhỏ, commit nháp lộn xộn |

### Cherry-pick
~~~bash
git switch release/2.4
git cherry-pick -x 9f3c2ab     # -x ghi "cherry picked from commit ..." để truy vết
~~~
Dùng khi cần mang **một** bản sửa từ main sang nhánh release đang chạy prod mà không kéo theo các feature chưa sẵn sàng. Lạm dụng cherry-pick làm hai nhánh có cùng thay đổi nhưng khác hash, merge về sau dễ conflict và khó biết thay đổi đã có ở đâu.

### Revert vs reset
~~~bash
git revert 9f3c2ab             # tạo commit mới đảo ngược 9f3c2ab; push bình thường
git revert -m 1 <merge-commit> # revert một merge commit, giữ parent 1 (nhánh chính)

git reset --soft HEAD~1        # bỏ commit, giữ thay đổi trong staging
git reset --mixed HEAD~1       # (mặc định) giữ thay đổi trong working dir
git reset --hard HEAD~1        # bỏ cả thay đổi, chỉ dùng khi chắc chắn
git reflog                     # cứu commit "mất" sau reset --hard (trong thời hạn reflog)
~~~

| Lệnh | Viết lại lịch sử | Dùng trên nhánh chung |
|---|---|---|
| revert | Không | Được, cách chuẩn để gỡ lỗi trên main |
| reset | Có | Không (trừ khi cả team thống nhất) |

### Câu trả lời sai phổ biến
- "Rebase luôn tốt hơn merge": không, rebase nhánh chung là phá lịch sử của người khác.
- "Reset --hard rồi push -f để xoá commit lỡ đẩy password": password vẫn nằm trong clone của người khác, trong CI cache. Phải **rotate secret ngay**, xoá lịch sử chỉ là bước phụ.
- "Revert merge xong merge lại nhánh đó là đủ": Git coi các commit kia đã được merge rồi, thay đổi sẽ không vào lại; phải revert cái revert.

> Senior tip: Hầu hết team dùng quy tắc: rebase để cập nhật nhánh cá nhân, squash hoặc merge khi đóng PR theo chuẩn của repo, revert để gỡ trên main, và bật branch protection cấm force push vào main/release. Đặt {{git config --global pull.rebase true}} giúp tránh các merge commit "Merge branch main into main" vô nghĩa.`,
    follow: [
      'Một merge commit đã được revert trên main. Giờ bạn muốn merge lại feature đó sau khi sửa lỗi, làm thế nào?',
      'Bạn lỡ commit file chứa password DB và đã push lên GitLab. Các bước xử lý theo thứ tự?'
    ],
    tags: ['Git', 'Rebase', 'Merge', 'Cherry-pick', 'Revert']
  },
  {
    id: 'devops-009',
    topic: 'devops',
    level: 'lead',
    refs: [{"type": "doc", "title": "Kubernetes Docs", "url": "https://kubernetes.io/docs/"}, {"type": "doc", "title": "Docker Docs", "url": "https://docs.docker.com/"}],
    q: 'Bạn là tech lead một team core banking: release mỗi 2 tuần qua phê duyệt CAB, nhưng vẫn phải hotfix gấp khi prod lỗi. Bạn chọn Git Flow hay trunk-based development, và tổ chức nhánh release/hotfix ra sao?',
    a: `**Tóm tắt:** Git Flow (develop, feature, release, hotfix, main) hợp với release theo lịch và nhiều version cùng tồn tại, nhưng nhánh sống lâu gây merge hell và chậm phản hồi. Trunk-based (nhánh ngắn dưới 1–2 ngày, merge liên tục vào main, ẩn tính năng dở bằng feature flag) cho tích hợp liên tục và chất lượng tốt hơn. Với ngân hàng, cách thực tế là trunk-based + nhánh release cắt từ main cho mỗi đợt phê duyệt, hotfix sửa trên main rồi cherry-pick sang nhánh release đang chạy prod, mọi bản phát hành đều gắn tag.

### Git Flow
~~~text
main     ----*------------------*------------*----   (tag v2.3.0, v2.3.1, v2.4.0)
hotfix          \\---h1----------/  (rồi merge cả về develop)
release              \\--r1--r2--------------/
develop  --*--*--*--*--*--*--*--*--*--*---
feature     \\--f1--f2--/   \\--g1--g2--g3--/
~~~
- Ưu: phân tách rõ "đang phát triển" và "đã lên prod", hợp với sản phẩm đóng gói, hỗ trợ nhiều version.
- Nhược: feature branch sống 2–4 tuần, conflict lớn khi merge; hotfix phải merge vào **hai** nơi (main và develop), quên là lỗi quay lại ở release sau; develop thường "đỏ" vì tích hợp muộn.

### Trunk-based
~~~text
main  --*--*--*--*--*--*--*--*--*--*--   (CI xanh mọi lúc, mỗi commit có thể release)
          \\-/  \\-/      \\
       PR ngắn (giờ/ngày)  release/2.4 (cắt khi đóng gói cho CAB, chỉ nhận cherry-pick)
~~~
- Tính năng chưa xong vẫn merge nhưng **tắt bằng feature flag** (Unleash, Togglz, flag trong DB).
- Yêu cầu: test tự động tốt, code review nhanh, CI chạy dưới 10–15 phút.

### So sánh
| Tiêu chí | Git Flow | Trunk-based + release branch |
|---|---|---|
| Độ dài nhánh feature | Tuần | Giờ đến 2 ngày |
| Merge conflict | Lớn, dồn cuối sprint | Nhỏ, liên tục |
| Hotfix | Merge vào main + develop | Sửa trên main, cherry-pick sang release |
| Tính năng dở dang | Nằm ngoài nhánh chính | Nằm trong main, tắt bằng flag |
| Yêu cầu kỹ thuật | Thấp | Test tự động, flag, CI nhanh |
| Hợp với | Nhiều version song song, team chưa trưởng thành CI | Microservice, deploy thường xuyên |

### Quy trình đề xuất cho ngân hàng
1. Dev làm nhánh ngắn từ main, PR cần 2 approval và pipeline xanh (unit, integration, SAST).
2. Ngày code freeze: cắt {{release/2.4}} từ main, build **một** artifact, deploy SIT rồi UAT. Main tiếp tục nhận code cho đợt sau.
3. Lỗi UAT: sửa trên main trước, cherry-pick sang release (fix-forward, không sửa thẳng release để tránh quên mang về main).
4. CAB duyệt đúng artifact đã test (cùng digest), deploy prod, gắn tag {{v2.4.0}}.
5. Hotfix prod: sửa trên main, cherry-pick vào {{release/2.4}}, tag {{v2.4.1}}, đi luồng phê duyệt khẩn cấp (emergency change) nhưng vẫn chạy đủ pipeline.

### Câu trả lời sai phổ biến
- "Ngân hàng phải dùng Git Flow vì có CAB": CAB phê duyệt **bản phát hành**, không quy định cách đặt nhánh.
- "Trunk-based là push thẳng lên main không review": sai, vẫn có PR và review, chỉ là nhánh rất ngắn.
- "Hotfix sửa trực tiếp trên nhánh release là xong": lần release sau lỗi quay lại vì main chưa có bản sửa.

### Pitfall khi chuyển đổi
- Feature flag không được dọn: sau vài tháng có hàng trăm flag, tổ hợp không ai test. Mỗi flag cần owner và hạn xoá.
- Migration DB đi cùng code đang tắt flag vẫn chạy thật: schema phải tương thích hai chiều.
- Chuyển đột ngột khi test tự động yếu làm main liên tục đỏ; nên tăng độ phủ test trước.

> Senior tip: Đo bằng các chỉ số DORA (lead time, deployment frequency, change failure rate, MTTR) trước và sau khi đổi chiến lược để thuyết phục quản lý bằng số liệu. Với auditor, điều quan trọng là truy vết được: từ ticket tới commit, PR, pipeline, artifact digest và bản ghi phê duyệt; đặt tên nhánh và commit theo mã ticket (ví dụ CORE-1234) giúp làm việc này tự động.`,
    follow: [
      'Feature flag ảnh hưởng thế nào tới testing và audit trong ngân hàng?',
      'Có 3 version đang chạy ở 3 chi nhánh/khách hàng khác nhau. Chiến lược nhánh của bạn thay đổi ra sao?'
    ],
    tags: ['Git', 'Git Flow', 'Trunk-based', 'Release', 'Hotfix']
  },
  {
    id: 'devops-010',
    topic: 'devops',
    level: 'lead',
    refs: [{"type": "doc", "title": "Kubernetes Docs", "url": "https://kubernetes.io/docs/"}, {"type": "doc", "title": "Docker Docs", "url": "https://docs.docker.com/"}],
    q: 'Thiết kế pipeline CI/CD cho một service Java Spring Boot trong ngân hàng: từ commit tới production qua DEV, SIT, UAT, PROD. Có những stage nào, gate nào, và nguyên tắc nào bạn bắt buộc?',
    a: `**Tóm tắt:** CI: build, unit test, integration test (Testcontainers), phân tích chất lượng và bảo mật (SAST, quét dependency, quét image, SBOM), đóng gói image gắn version và đẩy lên registry. CD: deploy cùng một artifact (cùng digest) lần lượt qua các môi trường, mỗi bước có gate (test tự động, phê duyệt), prod deploy qua GitOps hoặc pipeline có phê duyệt và rollback tự động. Nguyên tắc cốt lõi: **build once, promote many**, cấu hình theo môi trường tách khỏi artifact, mọi bước truy vết được.

### Các stage
~~~text
commit/PR
  1. Build + unit test           mvn -B verify (JUnit, JaCoCo)
  2. Integration test            Testcontainers: PostgreSQL/Oracle, Kafka thật
  3. Chất lượng & bảo mật        SonarQube quality gate, SAST, SCA (OWASP Dependency-Check/Trivy)
  4. Package                     image tag = version + git sha; SBOM (CycloneDX); ký image (cosign)
  5. Quét image                  Trivy/Harbor scanner: chặn CRITICAL có bản vá
  6. Push                        Nexus (jar) / Harbor (image), immutable tag
merge main
  7. Deploy DEV tự động          smoke test, contract test
  8. Deploy SIT                  regression API tự động, test tích hợp core banking giả lập
  9. Deploy UAT                  nghiệp vụ test, performance test (k6/JMeter), DAST
 10. Phê duyệt CAB               gắn với change request
 11. Deploy PROD                 canary/rolling, theo dõi error rate, tự rollback
~~~

### Vì sao "build once, promote many"
Nếu mỗi môi trường build lại từ source, dependency có thể đã đổi (SNAPSHOT, version range, base image cập nhật), nên thứ chạy ở prod **không phải** thứ đã được test ở UAT. Vì vậy chỉ build một lần, promote bằng **digest** (sha256), không bằng tag (tag có thể bị ghi đè). Cấu hình khác nhau giữa môi trường đi qua ConfigMap/Secret/values, không qua profile được nướng sẵn trong image.

### Gate và mục đích
| Gate | Chặn cái gì | Ví dụ ngưỡng |
|---|---|---|
| Unit + coverage | Lỗi logic | Coverage code mới ≥ 80% |
| Quality gate | Code smell, duplicate, bug | Không có bug Blocker/Critical mới |
| SCA | Thư viện có CVE (Log4Shell) | Không có CVE Critical có bản vá |
| Image scan | Lỗ hổng OS package | Như trên, có danh sách ngoại lệ có hạn |
| Contract test | Phá vỡ API của consumer | Pact/Spring Cloud Contract pass |
| Performance | Hồi quy hiệu năng | p99 không tăng quá 10% so với baseline |
| Approval | Rủi ro nghiệp vụ, tuân thủ | Người duyệt khác người viết code |

### CI hay GitOps cho CD
- **Push-based**: Jenkins/GitLab CI chạy {{helm upgrade}} vào cluster. Đơn giản, nhưng CI phải giữ credential cluster prod.
- **Pull-based (GitOps)**: pipeline chỉ sửa version trong repo cấu hình; Argo CD/Flux trong cluster tự đồng bộ. Lịch sử Git chính là audit log, rollback bằng revert, cluster không lộ credential ra ngoài. Hợp với yêu cầu tách quyền của ngân hàng.

### Migration DB
Flyway/Liquibase chạy như một bước riêng (Job hoặc init) trước khi deploy app, script phải tương thích ngược (expand-contract) để rollback app không cần rollback DB.

### Câu trả lời sai phổ biến
- "Build lại cho từng môi trường với profile tương ứng": vi phạm build once.
- "Tag latest rồi deploy": không biết prod đang chạy gì, không rollback chính xác được.
- "Chạy test sau khi deploy prod": gate phải đặt trước.
- "Pipeline càng nhiều stage càng tốt": pipeline 60 phút làm dev gộp nhiều thay đổi vào một lần, rủi ro tăng; nên chạy song song và giữ CI dưới 15 phút.

> Senior tip: Ở ngân hàng, auditor sẽ hỏi "chứng minh bản trên prod chính là bản đã được UAT duyệt". Hãy lưu digest, SBOM, kết quả scan và người phê duyệt cùng change request; Kubernetes admission policy (Kyverno/OPA Gatekeeper) chỉ cho chạy image đã ký từ Harbor nội bộ. Khi dependency có CVE mới như Log4Shell, SBOM giúp trả lời trong vài phút "service nào bị ảnh hưởng" thay vì vài ngày.`,
    follow: [
      'Một CVE Critical xuất hiện trong thư viện nhưng chưa có bản vá. Gate chặn pipeline, bạn xử lý thế nào để vẫn release được?',
      'So sánh deploy bằng Jenkins chạy helm upgrade với Argo CD về bảo mật và audit.',
      'Rollback tự động dựa trên tín hiệu gì và làm sao tránh rollback nhầm?'
    ],
    tags: ['CI/CD', 'DevSecOps', 'GitOps', 'Pipeline', 'SBOM']
  },
  {
    id: 'devops-011',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn có 30 microservice chạy trên 4 môi trường (DEV, SIT, UAT, PROD). Bạn quản lý manifest Kubernetes và secret cho nhiều môi trường thế nào? Chọn Helm hay Kustomize?',
    a: `**Tóm tắt:** Helm là package manager dùng template Go + file values, có khái niệm release, version, rollback và chia sẻ chart; Kustomize không template mà vá (patch) YAML thuần theo mô hình base + overlay, có sẵn trong kubectl. Thực tế hay làm một chart chung cho mọi service Spring Boot, mỗi môi trường một file values (hoặc Kustomize overlay). Secret không bao giờ commit dạng plain/base64: dùng External Secrets Operator kéo từ Vault/AWS Secrets Manager, hoặc Sealed Secrets/SOPS nếu phải lưu trong Git.

### Helm
~~~yaml
# templates/deployment.yaml (trích)
spec:
  replicas: {{ .Values.replicas }}
  template:
    metadata:
      annotations:
        # đổi ConfigMap -> checksum đổi -> Pod được rolling restart
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}@{{ .Values.image.digest }}"
          resources: {{- toYaml .Values.resources | nindent 12 }}
~~~
~~~bash
helm upgrade --install payment ./springboot-chart -n payment \\
  -f values.yaml -f values-prod.yaml --wait --timeout 10m
helm history payment -n payment     # các revision
helm rollback payment 12 -n payment # quay về revision 12
helm template ... | kubectl diff -f - # xem trước thay đổi
~~~

### Kustomize
~~~text
base/              deployment.yaml, service.yaml, kustomization.yaml
overlays/sit/      kustomization.yaml (namespace, replicas: 2, image tag)
overlays/prod/     kustomization.yaml + patch-resources.yaml (replicas: 6, limit lớn hơn)
~~~
Chạy {{kubectl apply -k overlays/prod}} hoặc để Argo CD render. {{configMapGenerator}} tự thêm hậu tố hash vào tên ConfigMap, nên sửa cấu hình sẽ đổi tên và tự kích hoạt rolling update.

### So sánh
| Tiêu chí | Helm | Kustomize |
|---|---|---|
| Cách tiếp cận | Template + values | Patch YAML thuần |
| Logic điều kiện, vòng lặp | Có (if, range) | Hạn chế, cố ý không có |
| Đọc hiểu | Template phức tạp khó đọc, lỗi thụt lề | YAML thật, dễ review |
| Quản lý release, rollback | Có (lưu revision trong Secret của namespace) | Không, dựa vào Git/Argo CD |
| Chia sẻ, cài phần mềm bên thứ ba | Chuẩn de facto (Kafka, Redis, ingress...) | Ít |
| Hợp với | Một chart chung cho nhiều service | Biến thể nhỏ giữa môi trường |

Có thể kết hợp: Argo CD render Helm chart rồi áp patch Kustomize cho chỉnh sửa đặc thù.

### Secret
Kubernetes Secret chỉ là base64, ai có quyền đọc Secret trong namespace hoặc đọc etcd không mã hoá là thấy mật khẩu.
| Cách | Cơ chế | Ghi chú |
|---|---|---|
| External Secrets Operator | CRD trỏ tới Vault/AWS Secrets Manager, operator tạo Secret K8s và đồng bộ định kỳ | Rotate tập trung, Git chỉ chứa tham chiếu |
| Vault Agent/CSI | Inject file secret vào Pod | Không cần lưu Secret trong etcd (CSI) |
| Sealed Secrets | Mã hoá bằng public key của controller trong cluster, commit được vào Git | Mất private key của controller là mất hết |
| SOPS | Mã hoá giá trị trong file bằng KMS/age/PGP | Hợp GitOps, cần plugin khi render |
Ngoài ra bật encryption at rest cho etcd và RBAC chặt (dev không có quyền get secret ở prod).

### Câu trả lời sai phổ biến
- "Mỗi môi trường copy một bộ YAML": 30 service × 4 môi trường = 120 bộ, sửa probe phải sửa 120 chỗ, cấu hình trôi dạt.
- "Secret đã base64 nên commit được": base64 không phải mã hoá.
- "Sửa ConfigMap là app tự nhận": env var chỉ đọc lúc khởi động; cần checksum annotation hoặc hash suffix.

### Pitfall production
- Values prod đặt sai do override nhiều tầng: luôn chạy {{helm template}}/{{kubectl diff}} trong pipeline và lưu kết quả để review.
- Release Helm kẹt ở trạng thái pending-upgrade khi pipeline bị huỷ giữa chừng: cần rollback thủ công trước lần deploy sau.
- Chart chung quá nhiều if/else cho từng service thì không ai dám sửa; giữ chart nhỏ, có test ({{helm lint}}, {{helm unittest}} plugin).

> Senior tip: Ở ngân hàng, mô hình hay được auditor chấp nhận: một chart chuẩn do platform team quản lý version, mỗi service một file values nhỏ trong repo GitOps, secret nằm ở Vault với policy theo namespace, Argo CD đồng bộ và mọi thay đổi prod đi qua merge request có phê duyệt. Khi rotate mật khẩu DB, ESO cập nhật Secret nhưng app vẫn giữ connection cũ; cần quy trình restart có kiểm soát hoặc dùng Spring Cloud Vault với credential động.`,
    follow: [
      'Rotate mật khẩu DB mà không gây downtime: phối hợp Vault, ESO và HikariCP thế nào?',
      'Helm release bị kẹt ở pending-upgrade. Bạn xử lý ra sao?'
    ],
    tags: ['Kubernetes', 'Helm', 'Kustomize', 'Secret', 'GitOps']
  },
  {
    id: 'devops-012',
    topic: 'devops',
    level: 'senior',
    q: 'App Spring Boot chạy trên Kubernetes nên ghi log thế nào và gom log về đâu? Làm sao để từ một traceId tìm được toàn bộ log của một giao dịch đi qua 6 service?',
    a: `**Tóm tắt:** Ghi log ra stdout/stderr dạng JSON một dòng, không ghi file trong container. Container runtime lưu log trên node, một agent dạng DaemonSet (Fluent Bit, Vector, Grafana Alloy) đọc, gắn metadata Kubernetes (namespace, pod, label) rồi đẩy về Elasticsearch/OpenSearch (ELK) hoặc Loki. Micrometer Tracing đặt traceId/spanId vào MDC và truyền qua header W3C traceparent giữa các service, nên chỉ cần tìm theo trường traceId là thấy cả giao dịch.

### Vì sao stdout chứ không phải file
- Container là phù du: Pod chết, file log trong filesystem container mất theo.
- Ghi file cần volume, rotate, agent đọc từng đường dẫn khác nhau; stdout là chuẩn chung (twelve-factor).
- Kubelet và runtime tự rotate (mặc định khoảng 10 MiB × 5 file mỗi container) và {{kubectl logs}} hoạt động ngay.

### Vì sao JSON
Log dạng text nhiều dòng (stack trace 80 dòng) bị agent cắt thành 80 bản ghi riêng; regex parse thì dễ vỡ khi đổi pattern. JSON một dòng giữ nguyên cấu trúc: level, logger, thread, traceId, message, stack trace nằm trong một bản ghi, tìm kiếm theo trường chính xác.

Từ Spring Boot 3.4 có structured logging dựng sẵn:
~~~yaml
logging:
  structured:
    format:
      console: ecs        # hoặc logstash, gelf
~~~
Các bản trước dùng logstash-logback-encoder trong logback-spring.xml.
~~~json
{"@timestamp":"2026-10-23T09:15:02.481Z","log.level":"ERROR","service.name":"payment",
 "message":"Debit failed","traceId":"4bf92f3577b34da6a3ce929d0e0e4736","spanId":"00f067aa0ba902b7",
 "accountId":"***4521","error.stack_trace":"java.sql.SQLTimeoutException: ..."}
~~~

### traceId đi xuyên service thế nào
1. Request vào gateway, Micrometer Tracing (bridge OpenTelemetry hoặc Brave) tạo traceId nếu chưa có.
2. traceId/spanId được đặt vào MDC của thread, encoder JSON tự in ra.
3. RestClient/WebClient/Feign/KafkaTemplate được instrument sẽ gắn header {{traceparent}} vào request/message gửi đi; service sau đọc header và dùng lại traceId.
4. Tìm trên Kibana: {{traceId: "4bf92f..."}} hoặc trên Grafana: {{| json | traceId = "4bf92f..."}} trong LogQL; từ Tempo/Jaeger nhảy sang log và ngược lại.

### ELK hay Loki
| | Elasticsearch/OpenSearch | Loki |
|---|---|---|
| Đánh chỉ mục | Toàn văn bản mọi trường | Chỉ label, nội dung lưu nén |
| Tìm kiếm tự do | Rất mạnh, nhanh | Chậm hơn khi quét khối lớn |
| Chi phí lưu trữ | Cao (RAM, disk cho index) | Thấp, dùng object storage |
| Vận hành | Nặng (shard, ILM) | Nhẹ hơn |
| Hợp với | Cần phân tích, audit, tìm kiếm phức tạp | Khối lượng lớn, đã dùng Grafana |
Trong Loki, **không** đưa traceId hay userId thành label: số giá trị khác nhau quá lớn (high cardinality) làm nổ index; label chỉ nên là namespace, app, level.

### Câu trả lời sai phổ biến
- "Mỗi service tự đẩy log thẳng sang Elasticsearch qua appender": ES chậm hoặc chết thì thread ghi log bị chặn, kéo theo app.
- "Tự sinh requestId riêng trong từng service": không nối được giữa các service; phải truyền theo chuẩn W3C.
- "MDC tự theo sang thread khác": không, khi dùng @Async hoặc executor riêng phải truyền context (Micrometer context-propagation, TaskDecorator).

### Pitfall production
- Log PII (số tài khoản, CCCD, OTP) vi phạm quy định bảo mật: mask ngay ở tầng logging.
- Log DEBUG ở prod làm tràn disk node và tốn tiền lưu trữ; dùng actuator loggers để bật tạm thời theo package.
- Đỉnh tải làm agent dồn buffer: cấu hình buffer trên disk và giới hạn tốc độ để không mất log khi backend chậm.

> Senior tip: Thống nhất một schema log chung (ECS) cho toàn bộ service ngay từ đầu, đưa vào starter nội bộ; ghép log, metric và trace bằng cùng traceId sẽ rút thời gian điều tra sự cố từ hàng giờ xuống vài phút. Lưu ý Promtail đã bị Grafana ngừng phát triển, hệ thống mới nên dùng Grafana Alloy hoặc Fluent Bit.`,
    follow: [
      'traceId bị mất khi message đi qua Kafka hoặc khi xử lý trong @Async. Bạn sửa thế nào?',
      'Log audit giao dịch ngân hàng có nên đi chung pipeline với log ứng dụng không? Vì sao?'
    ],
    tags: ['Logging', 'ELK', 'Loki', 'Tracing', 'traceId']
  },
  {
    id: 'devops-013',
    topic: 'devops',
    level: 'senior',
    q: 'Nginx đứng trước 3 instance Spring Boot. Người dùng báo: upload sao kê 5 MB bị lỗi 413, API xuất báo cáo bị 504 sau đúng 60 giây, và thỉnh thoảng một giao dịch POST bị gửi hai lần. Bạn giải thích và cấu hình lại thế nào?',
    a: `**Tóm tắt:** 413 vì {{client_max_body_size}} mặc định chỉ 1 MB. 504 sau 60 giây vì {{proxy_read_timeout}} mặc định 60 giây: Nginx chờ backend trả byte tiếp theo quá lâu thì cắt. POST bị gửi hai lần khi Nginx (hoặc tầng LB/client khác) retry sang upstream khác sau lỗi/timeout; Nginx từ 1.9.13 mặc định không retry request non-idempotent, nhưng cấu hình {{proxy_next_upstream ... non_idempotent}} hoặc retry ở tầng khác sẽ gây trùng, nên API tiền phải có idempotency key.

### Cấu hình mẫu
~~~text
upstream payment_backend {
    least_conn;                                   # ít kết nối đang mở nhất
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.13:8080 max_fails=3 fail_timeout=30s;
    keepalive 64;                                 # giữ kết nối tới backend, tránh handshake liên tục
}

server {
    listen 443 ssl;
    server_name api.bank.vn;
    client_max_body_size 10m;                     # mặc định 1m -> 413

    location /api/ {
        proxy_pass http://payment_backend;
        proxy_http_version 1.1;                   # bắt buộc để keepalive upstream hoạt động
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 3s;                 # backend chết thì biết nhanh
        proxy_read_timeout 30s;                   # thời gian chờ GIỮA hai lần đọc
        proxy_next_upstream error timeout;        # mặc định: không retry POST
        proxy_next_upstream_tries 2;
    }

    location /api/reports/ {                      # endpoint chậm có timeout riêng
        proxy_pass http://payment_backend;
        proxy_read_timeout 300s;
    }
}
~~~

### Các timeout hiểu cho đúng
| Directive | Đo cái gì | Mặc định |
|---|---|---|
| proxy_connect_timeout | Thiết lập TCP tới backend | 60s (không vượt quá ~75s) |
| proxy_send_timeout | Giữa hai lần ghi liên tiếp sang backend | 60s |
| proxy_read_timeout | Giữa hai lần đọc liên tiếp từ backend, không phải tổng thời gian | 60s |
| client_body_timeout | Giữa hai lần đọc body từ client | 60s |
| keepalive_timeout | Giữ kết nối client rảnh | 75s |

Timeout phải xếp tầng: client > LB > Nginx > timeout của app > timeout gọi DB/downstream. Nếu Nginx cắt ở 60 giây mà app vẫn chạy tiếp, báo cáo vẫn được sinh và tốn tài nguyên vô ích; client thấy lỗi nên bấm lại, tải càng tăng. Báo cáo nặng nên chuyển sang bất đồng bộ (202 + polling/tải file sau) thay vì chỉ tăng timeout.

### Load balancing và sticky session
- Mặc định round-robin; {{least_conn}} tốt khi thời gian xử lý chênh lệch; {{ip_hash}} hoặc {{hash $cookie_JSESSIONID consistent}} để dính phiên.
- Directive {{sticky}} chỉ có ở NGINX Plus (bản thương mại).
- Sticky session là triệu chứng của app stateful: instance chết thì mất phiên, tải lệch. Tốt hơn là đưa session ra Redis (Spring Session) hoặc dùng JWT.
- Health check chủ động ({{health_check}}) cũng là tính năng NGINX Plus; bản open source chỉ có passive check qua {{max_fails}}/{{fail_timeout}}.

### Spring Boot phía sau proxy
Đặt {{server.forward-headers-strategy=native}} (hoặc framework) để app hiểu X-Forwarded-Proto/For: redirect đúng https, log đúng IP client. Nếu backend cũng giới hạn upload, chỉnh {{spring.servlet.multipart.max-file-size}} và {{max-request-size}} (mặc định 1MB và 10MB) cho khớp.

### Câu trả lời sai phổ biến
- "Tăng mọi timeout lên 600s": request treo chiếm worker và kết nối, sự cố nhỏ thành nghẽn toàn hệ thống.
- "proxy_read_timeout là tổng thời gian request": sai, đó là khoảng lặng giữa hai lần đọc; backend stream từng chút thì không bị cắt.
- "Retry sau timeout là an toàn": với POST chuyển tiền, timeout không có nghĩa là backend chưa xử lý.

### Pitfall production
- Thiếu {{proxy_http_version 1.1}} và header Connection rỗng: keepalive upstream không có tác dụng, hết ephemeral port (TIME_WAIT tăng vọt) khi tải cao.
- SSE/streaming bị dồn do {{proxy_buffering on}}: tắt buffering cho location đó.
- Nginx resolve DNS tên upstream một lần lúc khởi động; backend đổi IP (container, cloud) thì Nginx vẫn gửi tới IP cũ cho tới khi reload.

> Senior tip: Bật log có {{$upstream_response_time}}, {{$request_time}} và {{$upstream_addr}} trong log_format: so hai giá trị thời gian cho biết chậm do backend hay do mạng/client, còn upstream_addr chỉ ra instance nào có vấn đề. Đây là bằng chứng đầu tiên cần lấy khi có báo cáo 502/504.`,
    follow: [
      '502 Bad Gateway và 504 Gateway Timeout khác nhau thế nào? Mỗi loại thường do nguyên nhân gì phía backend?',
      'Bạn thiết kế idempotency cho API chuyển tiền thế nào để retry ở bất kỳ tầng nào cũng an toàn?'
    ],
    tags: ['Nginx', 'Reverse proxy', 'Load balancer', 'Timeout', 'Upstream']
  },
  {
    id: 'devops-014',
    topic: 'devops',
    level: 'lead',
    refs: [{"type": "doc", "title": "Kubernetes Docs", "url": "https://kubernetes.io/docs/"}, {"type": "doc", "title": "Docker Docs", "url": "https://docs.docker.com/"}],
    q: 'Ngân hàng của bạn triển khai on-premise, mạng production không ra được internet và mọi thay đổi phải qua phê duyệt. Bạn tổ chức luồng dependency, image, triển khai và change management thế nào để vẫn release nhanh và an toàn?',
    a: `**Tóm tắt:** Mọi thứ từ bên ngoài đi qua một "cửa" có kiểm soát: Nexus/Artifactory proxy Maven Central và npm, Harbor làm registry image (proxy cache hoặc replication từ registry ngoài, quét lỗ hổng, ký image), có danh sách thư viện được duyệt. Pipeline build một lần trong vùng build, artifact được promote sang vùng prod bằng replication hoặc chép có kiểm soát. Triển khai gắn với change request (RFC) có kế hoạch rollback, cửa sổ bảo trì, tách quyền giữa người viết code, người duyệt và người deploy, và lưu vết đầy đủ cho audit.

### Kiến trúc phân vùng
~~~text
Internet
   |  (chỉ outbound qua proxy, whitelist domain)
[DMZ / vùng trung gian]  Nexus proxy (Maven Central, Gradle plugin), Harbor proxy cache
   |  firewall một chiều
[Vùng DEV/BUILD]  GitLab, Jenkins/GitLab Runner, SonarQube, Nexus hosted, Harbor dev
   |  replication có phê duyệt (chỉ artifact đã scan, đã ký)
[Vùng PROD]       Harbor prod (read-only với dev), Kubernetes/VM prod, Argo CD
~~~
Với vùng hoàn toàn air-gapped, chép image bằng {{skopeo copy}} hoặc {{docker save}} ra file, đưa qua kênh trung chuyển được kiểm duyệt, kiểm checksum rồi nạp vào Harbor nội bộ.

### Quản lý dependency
~~~text
<!-- settings.xml: mọi request Maven đi qua Nexus nội bộ -->
<mirror>
  <id>nexus</id>
  <mirrorOf>*</mirrorOf>
  <url>https://nexus.bank.local/repository/maven-public/</url>
</mirror>
~~~
- Nexus proxy chỉ cache những gì được kéo về, kết hợp chính sách chặn (Nexus Firewall/IQ hoặc quét SCA trong pipeline) để không vào thư viện có CVE nghiêm trọng hoặc license không phù hợp.
- Base image chuẩn (JRE đã harden) do platform team phát hành định kỳ trên Harbor; service không được kéo image tuỳ ý từ Docker Hub.
- Ghim version đầy đủ, không dùng version range hay SNAPSHOT khi release.

### Change management
| Loại thay đổi | Ví dụ | Quy trình |
|---|---|---|
| Standard (đã duyệt sẵn mẫu) | Scale replica, đổi flag đã đăng ký | Tự động, ghi log |
| Normal | Release định kỳ | RFC, đánh giá rủi ro, CAB duyệt, cửa sổ bảo trì |
| Emergency | Hotfix sự cố prod | ECAB duyệt nhanh, hồ sơ bổ sung sau, vẫn chạy pipeline đầy đủ |

Một RFC tốt có: phạm vi, artifact digest và version, kết quả test UAT, đánh giá ảnh hưởng (service, khách hàng, kênh), các bước triển khai, **tiêu chí và thời gian quyết định rollback**, người thực hiện và người kiểm tra (nguyên tắc bốn mắt).

### Làm sao vẫn nhanh
- Release nhỏ và thường xuyên ít rủi ro hơn release lớn ba tháng một lần; thương lượng với bộ phận rủi ro để đưa các thay đổi lặp lại thành standard change có pre-approval.
- Tự động hoá bằng chứng: pipeline xuất sẵn báo cáo test, scan, SBOM, digest gắn vào RFC; người duyệt không phải gom tay.
- GitOps: phê duyệt merge request vào repo cấu hình prod chính là bước phê duyệt, Argo CD thực hiện, Git là audit log.
- Feature flag tách "deploy" khỏi "bật tính năng": deploy trong giờ thấp điểm, bật cho khách hàng sau khi nghiệp vụ xác nhận.

### Câu trả lời sai phổ biến
- "Dev build trên máy rồi copy jar lên server prod": không truy vết được, vi phạm tách quyền.
- "Mở internet cho server build kéo thư viện trực tiếp": rủi ro supply chain (package giả mạo, typosquatting) và vi phạm chính sách mạng.
- "CAB làm chậm nên bỏ qua với hotfix": vẫn phải có emergency change, chỉ là nhanh hơn, không phải không có.

### Pitfall thực tế
- Cert nội bộ (Harbor, Nexus, CA riêng) không được import vào truststore của JDK trong image: build hoặc app báo PKIX path building failed.
- Image kiến trúc khác (arm64 từ máy Mac của dev) lọt vào registry prod x86.
- Đồng hồ các vùng lệch nhau làm token/chữ ký hết hạn sớm; NTP nội bộ là bắt buộc.

> Senior tip: Ở Việt Nam, các yêu cầu về an toàn hệ thống thông tin ngân hàng của NHNN và kiểm toán nội bộ sẽ hỏi: ai thay đổi gì, khi nào, ai duyệt, bằng chứng test ở đâu. Thiết kế pipeline sao cho mỗi câu đều trả lời được bằng một đường link thay vì một thư mục email; đó cũng là luận điểm mạnh nhất để thuyết phục CAB cho phép release thường xuyên hơn.`,
    follow: [
      'Log4Shell xuất hiện: trong môi trường không internet, bạn xác định service bị ảnh hưởng và vá trong bao lâu, bằng cách nào?',
      'Làm sao chứng minh với auditor rằng image chạy trên prod chính là image đã được quét và phê duyệt?',
      'Bạn thuyết phục CAB chuyển một loại thay đổi thành standard change như thế nào?'
    ],
    tags: ['On-premise', 'Nexus', 'Harbor', 'Change management', 'Air-gapped']
  }
);
