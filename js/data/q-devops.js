/* Câu hỏi topic `devops`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
  {
    id: 'devops-001',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn sẽ viết Dockerfile cho một service Spring Boot 3 như thế nào để image nhỏ, build nhanh khi chỉ sửa code, và an toàn khi chạy production?',
    a: `**Tóm tắt:** Dùng multi-stage build: stage JDK để build và tách layered jar, stage runtime chỉ có JRE. Copy các layer theo thứ tự ít thay đổi nhất trước (dependencies, loader, snapshot, application) để Docker cache tái sử dụng, chạy bằng user non-root, ENTRYPOINT dạng exec để JVM nhận SIGTERM, và đặt {{-XX:MaxRAMPercentage}} thay cho Xmx cứng.

### Hiểu nhanh
Dockerfile giống một công thức nấu ăn gồm nhiều bước; mỗi bước tạo ra một lớp (layer) xếp chồng như các tầng bánh. Docker nhớ các tầng đã làm (cache): nếu bạn chỉ đổi tầng trên cùng thì các tầng dưới được dùng lại, không phải làm lại. Thư viện bên thứ ba chiếm khoảng 95% dung lượng jar và hiếm khi đổi, nên đặt ở tầng dưới; code của bạn đổi hằng ngày nên đặt trên cùng. Multi-stage giống nấu trong bếp lớn nhưng chỉ mang hộp cơm ra bàn: image cuối không mang theo "nồi niêu" là JDK, Maven và source code.

### Thuật ngữ
- **Image**: gói chỉ đọc chứa hệ điều hành tối thiểu, JRE và ứng dụng; container là một lần chạy của image.
- **Layer**: một lớp thay đổi filesystem do một lệnh như COPY hoặc RUN tạo ra, được định danh bằng digest.
- **Build cache**: Docker tái sử dụng layer nếu lệnh và input không đổi; một layer đổi thì mọi layer sau phải build lại.
- **Multi-stage build**: nhiều {{FROM}} trong một Dockerfile; stage sau chỉ copy kết quả cần thiết từ stage trước.
- **Layered jar**: jar Spring Boot kèm file {{layers.idx}} mô tả cách tách thành các layer dependencies, loader, snapshot, application.
- **BuildKit**: engine build hiện đại của Docker, hỗ trợ {{RUN --mount=type=cache}} và {{--mount=type=secret}}.
- **Exec form**: ENTRYPOINT viết dạng mảng JSON, process java chạy trực tiếp làm PID 1 và nhận được tín hiệu SIGTERM.
- **Distroless**: base image chỉ có runtime, không có shell hay package manager, giảm bề mặt tấn công nhưng khó debug hơn.

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

### Lỗi hay gặp
- Quên {{.dockerignore}}: thư mục {{target}}, {{.git}} bị gửi vào build context, build chậm, có khi lộ secret.
- Nhét secret vào {{ARG}}/{{ENV}}: nằm vĩnh viễn trong lịch sử image. Dùng {{RUN --mount=type=secret}} của BuildKit.
- Alpine (musl) với một số native lib (Netty tcnative, font cho báo cáo PDF) gây lỗi khó đoán; dùng image Ubuntu/Debian-based an toàn hơn.

### Trả lời miệng 1 phút
Tôi dùng multi-stage build: stage đầu có JDK để build bằng Maven wrapper và tách layered jar bằng {{-Djarmode=tools}}, stage cuối chỉ có JRE. Lý do là Docker cache theo layer: tôi copy pom trước, tải dependency với cache mount của BuildKit, rồi mới copy source; ở image cuối tôi copy các layer theo thứ tự dependencies, loader, snapshot, application, nên sửa code chỉ làm đổi layer vài trăm KB. Về an toàn, tôi chạy user non-root với UID số, ENTRYPOINT dạng exec để java là PID 1 nhận SIGTERM và graceful shutdown chạy được, đặt MaxRAMPercentage thay cho Xmx cứng, pin base image theo version hoặc digest, và truyền credential bằng BuildKit secret thay vì ARG. Trade-off: Alpine nhỏ nhưng musl dễ lỗi với native lib, distroless an toàn nhưng không có shell để debug. Thực tế sau khi tách layer, mỗi lần deploy chỉ đẩy vài trăm KB thay vì hơn trăm MB.

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

### Hiểu nhanh
VM giống một căn nhà riêng: có móng, điện nước riêng (kernel và hệ điều hành riêng), nên cô lập tốt nhưng tốn tài nguyên. Container giống một căn hộ chung cư: dùng chung móng và hệ thống điện của toà nhà (kernel của host), mỗi căn có cửa khoá riêng (namespace) và đồng hồ điện có hạn mức (cgroup). JVM giống người thuê nhà đo diện tích để mua đồ đạc: nếu nó đo cả toà nhà thay vì căn hộ, nó mua quá nhiều đồ (heap quá lớn) và bị đuổi ra (OOMKilled). Vì vậy JVM phải đọc đúng hạn mức cgroup và bạn phải cấu hình heap, số CPU cho khớp.

### Thuật ngữ
- **Kernel**: lõi hệ điều hành quản lý CPU, bộ nhớ, thiết bị; mọi container trên một host dùng chung một kernel.
- **Namespace**: cơ chế Linux cô lập những gì process nhìn thấy (PID, network, mount, hostname, user).
- **cgroup**: cơ chế Linux giới hạn tài nguyên process được dùng; cgroup v2 dùng các file {{memory.max}}, {{cpu.max}}.
- **OverlayFS**: filesystem xếp chồng các layer chỉ đọc của image và một layer ghi mỏng của container.
- **Ergonomics**: cơ chế JVM tự chọn heap, GC và số thread dựa trên số CPU và RAM nó nhìn thấy.
- **OOM killer**: thành phần kernel giết process khi cgroup vượt memory limit; container thoát với exit code 137.
- **CFS throttling**: khi container dùng hết quota CPU trong một chu kỳ 100 ms, kernel tạm dừng nó tới chu kỳ sau.
- **RSS**: lượng RAM thật process đang chiếm, gồm heap, metaspace, thread stack, code cache và native memory.

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

### Lỗi hay gặp
1. **Pod bị OOMKilled (exit 137) nhưng log không có OutOfMemoryError**: heap đặt quá gần limit nên phần non-heap đẩy RSS vượt limit. Cách tránh: heap 70–75% limit, theo dõi RSS, dùng NativeMemoryTracking khi nghi rò rỉ native.
2. **CPU limit 500m hoặc 1 CPU cho service Java online**: JVM thấy 1 CPU, chọn SerialGC, nhiều pool chỉ có 1 thread, p99 tăng mạnh khi tải lên. Cách tránh: tối thiểu 2 CPU cho service nhạy latency và kiểm tra bằng {{-XshowSettings:system}}.
3. **JDK cũ trên node cgroup v2**: JDK 8 trước 8u372 hoặc JDK 11 trước 11.0.16 không đọc được cgroup v2, heap lại tính theo RAM của host. Cách tránh: nâng JDK lên bản vá mới, ưu tiên 17/21.

### Trả lời miệng 1 phút
Container không phải VM nhẹ: VM có kernel riêng chạy trên hypervisor, còn container chỉ là process trên host, dùng chung kernel, được cô lập bằng namespaces và bị giới hạn tài nguyên bằng cgroups. Vì vậy container khởi động nhanh và gần như không tốn overhead, nhưng cô lập yếu hơn VM. Với Java, vấn đề là JVM tự chọn heap, GC và số thread theo "máy" nó thấy. JDK 17/21 đọc được cgroup, nhưng mặc định heap chỉ 25% limit, và nếu CPU limit là 1 thì JVM chọn SerialGC. Tôi thường đặt MaxRAMPercentage khoảng 75 để chừa chỗ cho metaspace, thread stack, direct buffer; memory request bằng limit; và chú ý CPU throttling vì CFS quota tính theo chu kỳ 100 ms. Kinh nghiệm của tôi: khi p99 tăng mà CPU trung bình thấp, xem metric throttling trước khi nghi ngờ code.

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

### Hiểu nhanh
Hãy hình dung gửi hồ sơ tới một phòng ban trong toà nhà lớn. DNS là địa chỉ toà nhà, load balancer là cổng chính, Ingress là quầy lễ tân đọc tên phòng trên phong bì (host, path) để chỉ đường. Service là số máy lẻ cố định của phòng: nhân viên có đổi thì số máy lẻ vẫn vậy. Pod là nhân viên thật sự xử lý hồ sơ. Deployment giống phòng nhân sự: không nhận hồ sơ nào nhưng luôn đảm bảo phòng đủ người, đúng phiên bản; ConfigMap và Secret là sổ tay hướng dẫn và két mật khẩu được phát cho nhân viên khi vào làm.

### Thuật ngữ
- **Pod**: đơn vị chạy nhỏ nhất của Kubernetes, gồm một hoặc nhiều container dùng chung IP và network namespace.
- **ReplicaSet**: controller giữ đúng số Pod của một version; Deployment tạo và thay ReplicaSet khi rolling update.
- **Label selector**: điều kiện chọn đối tượng theo nhãn, ví dụ {{app=account}}, thay vì liệt kê tên từng Pod.
- **EndpointSlice**: danh sách IP:port của các Pod Ready phía sau một Service, do control plane cập nhật tự động.
- **kube-proxy**: thành phần trên mỗi node viết rule iptables/IPVS để chuyển gói tin gửi tới Service sang IP của Pod.
- **Ingress controller**: Pod proxy L7 (nginx, HAProxy, Traefik...) đọc các rule Ingress và định tuyến traffic từ ngoài vào.
- **ClusterIP**: IP ảo của Service chỉ dùng được bên trong cluster.
- **Readiness probe**: kiểm tra định kỳ; Pod chỉ được đưa vào EndpointSlice khi probe này thành công.

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

### Lỗi hay gặp
- Ingress-nginx mặc định gửi thẳng tới Pod IP lấy từ endpoint, không đi qua ClusterIP; vì vậy cấu hình retry/timeout ở Ingress ảnh hưởng trực tiếp tới từng Pod.
- Selector gõ sai label: Service có 0 endpoint, Ingress trả 503. Kiểm tra bằng {{kubectl get endpointslices -l kubernetes.io/service-name=account-svc}}.
- Vẫn chạy ingress-nginx sau khi Kubernetes cho dự án nghỉ hưu (ngừng bảo trì từ tháng 3/2026): không còn bản vá bảo mật cho thành phần đứng ngay cửa ngõ. Lên kế hoạch chuyển sang Gateway API hoặc một controller khác còn được bảo trì.

### Trả lời miệng 1 phút
Request đi theo chuỗi: DNS của api.bank.vn trỏ tới load balancer, load balancer chuyển vào Ingress controller. Ingress controller đọc rule Ingress theo host và path để chọn Service account-svc. Service là tên DNS và IP ảo ổn định; nó chọn Pod qua label selector, và chỉ những Pod qua readiness probe mới nằm trong EndpointSlice. kube-proxy hoặc eBPF chuyển gói tin tới IP của một Pod, nơi Spring Boot lắng nghe cổng 8080. Deployment không nằm trên đường đi của request, nó chỉ đảm bảo đủ Pod đúng version và lo rolling update. ConfigMap và Secret cấp cấu hình cho Pod lúc khởi động; lưu ý Secret mặc định chỉ base64, cần encryption at rest và RBAC. Khi debug "gọi không tới", tôi đi từ trong ra ngoài: port-forward vào Pod, curl Service từ Pod khác, rồi mới tới Ingress.

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

### Hiểu nhanh
Hãy nghĩ tới việc thay ca ở quầy giao dịch ngân hàng. Nhân viên ca mới phải ngồi vào quầy và sẵn sàng (readiness) thì nhân viên cũ mới được rời đi (maxUnavailable 0). Trước khi về, nhân viên cũ treo biển "tạm ngừng" và chờ vài giây để bảo vệ ngừng dẫn khách tới (preStop sleep), rồi phục vụ nốt khách đang ngồi (graceful shutdown); quá giờ quy định thì quản lý mời ra ngay (SIGKILL). Thiếu bất kỳ bước nào, vài khách sẽ bị bỏ dở giữa chừng, và đó chính là các lỗi 502/503 bạn thấy khi deploy.

### Thuật ngữ
- **maxSurge / maxUnavailable**: số Pod được tạo dư và số Pod được phép thiếu so với replicas trong lúc rolling update.
- **minReadySeconds**: số giây Pod phải Ready liên tục mới được tính là available.
- **preStop hook**: lệnh kubelet chạy trước khi gửi SIGTERM cho container.
- **SIGTERM / SIGKILL**: tín hiệu yêu cầu tắt lịch sự (app được dọn dẹp) và tín hiệu giết ngay (không dọn dẹp được).
- **terminationGracePeriodSeconds**: tổng thời gian tối đa từ lúc Pod bắt đầu tắt tới khi bị SIGKILL, mặc định 30 giây.
- **EndpointSlice**: danh sách Pod nhận traffic của Service; Pod đang tắt bị gỡ khỏi đây nhưng việc lan tới mọi proxy mất vài giây.
- **Graceful shutdown**: Spring Boot ngừng nhận request mới và chờ request đang chạy hoàn tất trước khi đóng context.

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

### Lỗi hay gặp
1. **Không có preStop**: vài giây đầu sau SIGTERM xuất hiện 502 hoặc connection refused vì Ingress và kube-proxy chưa kịp gỡ Pod. Cách tránh: preStop sleep 5–10 giây (image không có shell thì dùng sleep action của Kubernetes hoặc httpGet).
2. **Grace period nhỏ hơn preStop cộng thời gian shutdown của Spring**: Pod bị SIGKILL, request dở dang bị cắt. Cách tránh: đặt terminationGracePeriodSeconds lớn hơn preStop + timeout-per-shutdown-phase + buffer.
3. **Readiness báo Ready quá sớm** (chỉ kiểm tra cổng mở): Pod mới nhận traffic khi pool DB chưa sẵn, request đầu lỗi hoặc rất chậm. Cách tránh: dùng {{/actuator/health/readiness}} và warm-up trước khi Ready.
4. **ENTRYPOINT dạng shell**: java không nhận SIGTERM, graceful shutdown không chạy, Pod luôn bị SIGKILL. Cách tránh: dùng exec form.

### Trả lời miệng 1 phút
Lỗi 502/503 khi deploy đến từ hai đầu: Pod mới nhận traffic khi chưa sẵn sàng, và Pod cũ bị tắt trong lúc vẫn còn được route tới. Với Pod mới, tôi dùng readiness probe đúng nghĩa trên {{/actuator/health/readiness}}, startupProbe cho app khởi động chậm, và rolling update với maxUnavailable 0, maxSurge 1 để luôn đủ Pod Ready. Với Pod cũ, việc gỡ endpoint và gửi SIGTERM chạy song song, nên tôi thêm preStop sleep khoảng 10 giây cho mọi proxy kịp quên Pod, bật Spring graceful shutdown với timeout khoảng 30 giây, và đặt terminationGracePeriodSeconds lớn hơn tổng hai khoảng đó. Trade-off là deploy chậm hơn một chút và tốn thêm một Pod trong lúc rollout. Để chứng minh, tôi chạy load test liên tục trong lúc deploy trên staging và yêu cầu 0 lỗi; schema DB cũng phải tương thích ngược vì hai version chạy song song.

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

### Hiểu nhanh
Chẩn đoán Pod giống bác sĩ khám bệnh theo trình tự: hỏi triệu chứng ({{kubectl get pod}}), đọc hồ sơ bệnh án ({{kubectl describe}}: Events, Last State, Exit Code), rồi xem xét nghiệm của lần phát bệnh trước ({{kubectl logs --previous}}). Mỗi trạng thái chỉ ra "cơ quan" có vấn đề: Pending là chưa tìm được giường (node), ImagePullBackOff là không lấy được thuốc (image), CrashLoopBackOff là bệnh nhân vừa tỉnh dậy đã ngất lại (app khởi động rồi chết), OOMKilled là ăn vượt khẩu phần (vượt memory limit).

### Thuật ngữ
- **Scheduler**: thành phần chọn node cho Pod dựa trên tổng request còn trống, taint, affinity, volume.
- **Request / limit**: request là phần tài nguyên được đặt chỗ để lập lịch; limit là trần tối đa được dùng.
- **Taint / toleration**: node đánh dấu "từ chối Pod", chỉ Pod có toleration khớp mới được xếp lên.
- **PVC (PersistentVolumeClaim)**: yêu cầu ổ đĩa của Pod; PVC chưa bind thì Pod nằm Pending.
- **imagePullSecrets**: credential để kubelet đăng nhập registry riêng khi kéo image.
- **Back-off**: kubelet chờ lâu dần (10s, 20s, 40s... tối đa 5 phút) giữa các lần restart hoặc kéo image thất bại.
- **Exit code 137 / 143**: 128 + số tín hiệu; 137 là SIGKILL (OOM hoặc bị giết), 143 là SIGTERM (tắt bình thường).
- **Ephemeral container**: container debug gắn tạm vào Pod đang chạy bằng {{kubectl debug}}, hữu ích với image distroless.

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

### Lỗi hay gặp
1. **Chỉ chạy kubectl logs không kèm --previous khi CrashLoopBackOff**: thấy log gần như rỗng của container vừa được khởi động lại. Cách tránh: luôn thêm {{--previous}} để đọc log của lần chết.
2. **Tăng memory limit mỗi lần OOMKilled mà không tìm nguyên nhân**: rò rỉ native memory hoặc số thread vẫn tăng, Pod chỉ chết chậm hơn. Cách tránh: so RSS với heap, bật NativeMemoryTracking, đếm thread.
3. **Request lớn hơn khả năng của mọi node** (ví dụ request 8 CPU trên node 4 CPU): Pod Pending mãi. Cách tránh: đặt request theo số đo thực tế, đọc Event FailedScheduling.
4. **Image build trên Mac chip Apple (arm64) chạy trên node amd64**: container chết ngay với "exec format error". Cách tránh: build bằng {{docker buildx --platform linux/amd64}} hoặc image multi-arch.

### Trả lời miệng 1 phút
Tôi luôn đi theo ba lệnh: get pod để thấy trạng thái và số lần restart, describe pod để đọc Events, Last State và Exit Code, rồi logs --previous để đọc log của lần chạy vừa chết. Pending là vấn đề lập lịch: không node nào đủ request, thiếu toleration, affinity sai hoặc PVC chưa bind; lưu ý scheduler xét request chứ không xét mức dùng thực. ImagePullBackOff là sai tag, thiếu imagePullSecrets hoặc cert registry hết hạn. CrashLoopBackOff gần như luôn là lỗi app hoặc cấu hình, như thiếu property, Flyway fail, hay liveness giết app khởi động chậm. OOMKilled là kernel giết process vì RSS vượt limit, khác với OutOfMemoryError của JVM, nên tôi xem lại MaxRAMPercentage và native memory. Kinh nghiệm: xoá Pod để tạo lại không sửa được gì vì lỗi nằm ở spec; tôi đặt alert theo số restart và reason OOMKilled.

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

### Hiểu nhanh
HPA giống quản lý siêu thị nhìn tình hình để mở thêm quầy thu ngân. Nếu quản lý chỉ nhìn "nhân viên có bận tay không" (CPU), có lúc nhân viên đang chờ máy quẹt thẻ phản hồi (I/O) nên trông rảnh dù hàng người rất dài; vì vậy với service chờ DB hay HTTP, nên nhìn trực tiếp độ dài hàng (RPS, lag Kafka). Nhân viên Java mới vào ca cần 1–2 phút để mở máy và quen tay (khởi động Spring, JIT warm-up), nên phải mở quầy trước giờ cao điểm thay vì đợi hàng dài mới gọi người.

### Thuật ngữ
- **HPA (HorizontalPodAutoscaler)**: controller tăng giảm số replica theo metric, mặc định đánh giá mỗi 15 giây.
- **metrics-server**: thành phần cung cấp CPU/RAM của Pod cho HPA và {{kubectl top}}.
- **Utilization**: phần trăm CPU tính trên request của container, không phải trên limit.
- **Stabilization window**: khoảng thời gian HPA nhìn lại để tránh scale lên xuống liên tục (mặc định 300 giây khi scale down).
- **Custom / External metric**: metric ngoài CPU/RAM như RPS, độ sâu queue, lấy qua Prometheus Adapter hoặc KEDA.
- **KEDA**: dự án mở rộng autoscaling với nhiều scaler sẵn (Kafka, cron...), có thể scale về 0; bên dưới vẫn tạo HPA.
- **Consumer lag**: số message trong topic Kafka mà consumer group chưa xử lý.
- **JIT warm-up**: giai đoạn đầu JVM chạy code ở interpreter/C1 trước khi C2 biên dịch tối ưu, CPU cao và latency kém.

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

### Lỗi hay gặp
1. **Không đặt CPU request**: HPA theo CPU hiển thị {{unknown}} và không bao giờ scale. Cách tránh: luôn đặt {{requests.cpu}}.
2. **maxReplicas nhân pool size vượt max_connections của DB**: scale lên làm DB từ chối kết nối, lỗi tăng thay vì giảm. Cách tránh: tính trước tổng connection, giảm pool hoặc dùng PgBouncer.
3. **Scale consumer Kafka vượt số partition**: Pod thừa ngồi không, rebalance liên tục làm lag tăng. Cách tránh: maxReplicas không vượt số partition.
4. **Readiness báo Ready quá sớm**: Pod mới đang JIT bị tính CPU cao, HPA scale tiếp, hệ thống dao động. Cách tránh: readiness đúng nghĩa, warm-up trước khi Ready, scaleDown chậm.

### Trả lời miệng 1 phút
HPA tính số replica theo công thức ceil của replica hiện tại nhân metric hiện tại chia target, đánh giá mỗi 15 giây, và phần trăm CPU tính theo request. CPU dễ dùng nhưng là chỉ số gián tiếp: service I/O-bound có latency tăng mà CPU vẫn thấp. Vì vậy với consumer Kafka tôi scale theo lag bằng KEDA, với API chờ DB tôi cân nhắc RPS qua Prometheus Adapter. Java scale chậm vì Spring Boot khởi động 30–90 giây và JIT warm-up làm CPU Pod mới tăng vọt, nên từ lúc tải tăng tới lúc Pod mới phục vụ tốt có thể mất 2–3 phút. Tôi xử lý bằng minReplicas đủ gánh tải nền, scaleUp nhanh và scaleDown chậm, scale theo lịch cho ngày lương, và giảm thời gian khởi động bằng CDS hoặc AOT cache. Tôi luôn tính maxReplicas nhân connection pool để chắc DB chịu được.

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

### Hiểu nhanh
Hãy làm như thợ sửa xe khám theo checklist: động cơ (CPU), bình xăng (RAM), cốp xe (disk), đường ống (network), rồi đọc hộp đen (log). Đi theo thứ tự cố định giúp bạn không bỏ sót và không đoán mò khi đang bị sếp hối. Với Java, "động cơ" có nhiều xi-lanh là các thread: {{top -H}} chỉ ra thread nào đang nóng, còn thread dump cho biết thread đó đang chạy dòng code nào.

### Thuật ngữ
- **Load average**: số process trung bình đang chạy hoặc chờ (gồm cả chờ I/O trên Linux) trong 1, 5, 15 phút.
- **%wa / %st**: phần trăm CPU rảnh vì chờ disk, và phần trăm CPU bị hypervisor lấy đi (trên VM).
- **Page cache**: RAM trống được Linux dùng để cache file; sẽ được trả lại khi app cần, nên xem cột available.
- **Swap**: vùng disk dùng thay RAM; JVM bị swap thì GC pause kéo dài tới hàng giây.
- **Inode**: cấu trúc lưu thông tin một file; hết inode thì không tạo được file dù còn dung lượng.
- **File descriptor**: số hiệu đại diện cho file hoặc socket process đang mở, bị giới hạn bởi {{ulimit -n}}.
- **CLOSE_WAIT / TIME_WAIT**: trạng thái TCP; CLOSE_WAIT tăng dần thường do app không đóng connection.
- **Thread dump**: ảnh chụp stack của mọi thread JVM tại một thời điểm, lấy bằng {{jstack}} hoặc {{jcmd PID Thread.print}}.

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
jstack 12345 | grep -A 20 'nid=12399 '  # JDK 21: nid in dạng thập phân
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

### Lỗi hay gặp
1. **Thấy load average cao liền kết luận thiếu CPU**: trên Linux load tính cả process chờ I/O (trạng thái D). Cách tránh: xem thêm %wa, {{vmstat}}, {{iostat -x}} trước khi kết luận.
2. **Chỉ lấy một thread dump**: không phân biệt được thread kẹt lâu hay chỉ tình cờ đi ngang. Cách tránh: lấy 3 dump cách nhau khoảng 5 giây rồi so sánh.
3. **Xoá file log lớn đang được ghi**: {{df}} vẫn báo đầy vì process còn giữ file. Cách tránh: truncate file hoặc tìm bằng {{lsof +L1}} rồi restart có kiểm soát.

### Trả lời miệng 1 phút
Tôi đi theo thứ tự tài nguyên để không đoán mò. Đầu tiên uptime và top để xem load và CPU, chú ý %wa là chờ disk và %st là bị hypervisor lấy CPU. Nếu một process java ăn CPU, tôi dùng top -H tìm thread nóng, đổi thread id sang dạng nid trong thread dump rồi xem nó đang chạy gì; nếu đó là thread GC thì vấn đề là bộ nhớ. Tiếp theo free -m xem cột available và swap, dmesg để biết OOM killer đã ra tay chưa. Sau đó df -h và df -i cho dung lượng và inode, lsof +L1 cho file đã xoá mà còn giữ. Rồi ss để đếm kết nối, đặc biệt CLOSE_WAIT. Cuối cùng là log ứng dụng và journalctl. Quan trọng nhất: thu bằng chứng như thread dump, class histogram trước khi restart, vì restart xoá sạch dấu vết.

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

### Hiểu nhanh
Lịch sử Git giống một cuốn nhật ký mà mỗi trang có mã số riêng tính từ nội dung và trang trước nó. Merge là dán thêm một trang "hai mạch truyện gặp nhau". Rebase là chép lại các trang của bạn sang cuối cuốn chính: nội dung giống nhưng là trang mới, mã số mới. Squash là tóm tắt cả chương thành một trang. Revert là viết thêm trang "huỷ nội dung trang 42", còn reset là xé trang đi; xé trang chỉ an toàn khi cuốn sổ là của riêng bạn, vì người khác có thể đã photo các trang đó.

### Thuật ngữ
- **Commit hash**: mã SHA định danh commit, tính từ nội dung, tác giả và parent; đổi parent là đổi hash.
- **Fast-forward**: merge chỉ dời con trỏ nhánh lên trước, không tạo merge commit, khi lịch sử không rẽ nhánh.
- **Merge commit**: commit có hai parent, ghi lại thời điểm hai nhánh hợp nhất.
- **Force push**: ghi đè lịch sử nhánh trên remote; {{--force-with-lease}} từ chối nếu remote có commit bạn chưa thấy.
- **Reflog**: nhật ký local ghi mọi lần HEAD di chuyển, dùng để cứu commit sau reset nhầm.
- **Cherry-pick**: áp thay đổi của một commit cụ thể sang nhánh khác, tạo commit mới với hash khác.
- **Branch protection**: cấu hình trên GitLab/GitHub cấm force push, bắt buộc review và pipeline xanh trên nhánh quan trọng.

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

### Lỗi hay gặp
1. **Rebase nhánh dùng chung rồi force push**: đồng nghiệp pull về gặp conflict lặp lại, có thể mất commit. Cách tránh: chỉ rebase nhánh cá nhân, dùng {{--force-with-lease}}, bật branch protection cho main và release.
2. **Revert một merge rồi merge lại chính nhánh đó**: thay đổi không quay lại vì Git coi các commit đã được merge. Cách tránh: revert chính commit revert, rồi merge phần sửa mới.
3. **Lỡ commit password rồi chỉ xoá lịch sử**: secret vẫn nằm trong clone và cache CI của người khác. Cách tránh: rotate secret ngay, bật secret scanning (ví dụ gitleaks) ở pre-commit hoặc CI.

### Trả lời miệng 1 phút
Merge giữ nguyên lịch sử thật và tạo merge commit có hai parent; rebase chép commit của tôi lên đỉnh nhánh đích nên lịch sử thẳng nhưng hash thay đổi; squash gộp cả nhánh thành một commit, hợp với PR nhỏ có nhiều commit nháp. Cherry-pick tôi dùng để mang đúng một bản sửa từ main sang nhánh release đang chạy prod, kèm -x để truy vết. Revert tạo commit mới đảo ngược thay đổi nên an toàn trên nhánh chung; reset dời con trỏ nhánh và viết lại lịch sử, chỉ dùng ở local. Quy tắc cấm là rebase, reset rồi force push lên nhánh người khác đang dùng. Trade-off: lịch sử thẳng dễ đọc và bisect hơn, nhưng phải đổi bằng việc viết lại commit. Team tôi rebase để cập nhật nhánh cá nhân, squash khi đóng PR, revert để gỡ lỗi trên main, và bật branch protection.

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

### Hiểu nhanh
Git Flow giống một nhà xuất bản cho mỗi tác giả viết chương riêng trong nhiều tuần rồi mới ghép vào bản thảo: ghép muộn nên hay vỡ và tốn công sửa. Trunk-based giống viết chung một tài liệu online: ai cũng sửa đoạn nhỏ và lưu liên tục, đoạn chưa xong thì tạm ẩn đi (feature flag). Ngân hàng vẫn cần một "bản in" cố định để CAB duyệt, nên khi đóng gói ta cắt nhánh release từ trunk; hotfix sửa trên bản chính trước rồi mới chép sang bản in, để bản sau không mất bản sửa.

### Thuật ngữ
- **Trunk (main)**: nhánh chính duy nhất mà mọi người tích hợp vào liên tục.
- **Long-lived branch**: nhánh tồn tại nhiều tuần, càng lâu càng lệch xa main và conflict càng lớn.
- **Feature flag**: công tắc cấu hình bật tắt tính năng lúc chạy, cho phép merge code chưa xong mà không lộ ra.
- **Code freeze**: thời điểm chốt phạm vi release, sau đó nhánh release chỉ nhận bản sửa lỗi.
- **CAB (Change Advisory Board)**: hội đồng phê duyệt thay đổi trên production.
- **Emergency change**: luồng phê duyệt khẩn cấp cho hotfix, nhanh hơn nhưng vẫn có hồ sơ và pipeline đầy đủ.
- **DORA metrics**: bốn chỉ số đo năng lực giao phần mềm: lead time, deployment frequency, change failure rate, MTTR.

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

### Lỗi hay gặp
- Feature flag không được dọn: sau vài tháng có hàng trăm flag, tổ hợp không ai test. Mỗi flag cần owner và hạn xoá.
- Migration DB đi cùng code đang tắt flag vẫn chạy thật: schema phải tương thích hai chiều.
- Chuyển đột ngột khi test tự động yếu làm main liên tục đỏ; nên tăng độ phủ test trước.

### Trả lời miệng 1 phút
Tôi chọn trunk-based kết hợp nhánh release. Git Flow phân tách rõ develop, release, hotfix và hợp với nhiều version cùng tồn tại, nhưng feature branch sống vài tuần gây conflict lớn, và hotfix phải merge vào hai nơi nên dễ quên. Với trunk-based, dev làm nhánh ngắn dưới hai ngày, PR có review và pipeline xanh, tính năng dở dang được tắt bằng feature flag. Đến ngày code freeze, tôi cắt nhánh release từ main, build một artifact, đưa qua SIT, UAT rồi CAB duyệt đúng digest đó. Lỗi UAT hay hotfix prod đều sửa trên main trước rồi cherry-pick sang release, gắn tag và đi luồng emergency change nhưng vẫn chạy đủ pipeline. Trade-off là cần test tự động tốt, CI nhanh và kỷ luật dọn flag. Để thuyết phục quản lý, tôi đo DORA trước và sau khi chuyển đổi.

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

### Hiểu nhanh
Pipeline giống một dây chuyền nhà máy có nhiều trạm kiểm tra chất lượng. Sản phẩm chỉ được làm ra một lần, đóng hộp và dán mã vạch (digest), rồi đi qua các trạm DEV, SIT, UAT, PROD. Mỗi trạm chỉ kiểm tra, không làm lại sản phẩm: nếu UAT duyệt hộp mã X thì PROD phải nhận đúng hộp mã X. Cấu hình môi trường giống nhãn địa chỉ giao hàng: dán bên ngoài hộp (ConfigMap, Secret), không nhét vào trong sản phẩm.

### Thuật ngữ
- **Artifact**: kết quả build có thể triển khai, như jar trên Nexus hoặc image trên Harbor.
- **Digest**: mã sha256 của image, không đổi được, khác với tag có thể bị ghi đè.
- **SAST / SCA / DAST**: phân tích mã nguồn tĩnh / quét thư viện bên thứ ba có CVE / tấn công thử ứng dụng đang chạy.
- **SBOM**: danh sách mọi thành phần và version trong artifact (ví dụ định dạng CycloneDX).
- **Quality gate**: điều kiện bắt buộc để pipeline đi tiếp, ví dụ không có bug Critical mới.
- **Contract test**: kiểm tra API của provider vẫn đúng với kỳ vọng của consumer (Pact, Spring Cloud Contract).
- **GitOps**: trạng thái mong muốn của cluster nằm trong Git; Argo CD hoặc Flux trong cluster tự đồng bộ.
- **Image signing**: ký image (ví dụ cosign) để admission policy chỉ cho chạy image đáng tin.

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

### Lỗi hay gặp
1. **Build lại cho từng môi trường**: prod chạy bản khác với bản đã test vì dependency SNAPSHOT hoặc base image đã đổi. Cách tránh: build một lần, promote bằng digest.
2. **Ngoại lệ CVE không có hạn**: danh sách bỏ qua phình to, gate bảo mật mất tác dụng. Cách tránh: mỗi ngoại lệ có người chịu trách nhiệm và ngày hết hạn.
3. **CI giữ kubeconfig quyền admin cluster prod**: lộ credential CI là lộ cả cluster. Cách tránh: GitOps pull-based, hoặc OIDC ngắn hạn với quyền tối thiểu.

### Trả lời miệng 1 phút
Pipeline của tôi chia hai phần. CI chạy trên mỗi commit: build và unit test, integration test với Testcontainers, SonarQube quality gate, SAST và quét dependency, đóng gói image gắn version cộng git sha, sinh SBOM, ký image, quét image rồi đẩy lên Harbor với tag bất biến. CD đưa đúng digest đó qua DEV, SIT, UAT rồi PROD; mỗi chặng có gate như smoke test, regression, performance test, và phê duyệt CAB gắn với change request. Nguyên tắc tôi bắt buộc là build once, promote many, cấu hình môi trường nằm ngoài image, và mọi bước truy vết được. Với CD, tôi thích GitOps vì Git là audit log, rollback bằng revert, và CI không cần giữ credential prod. Trade-off là thêm stage thì pipeline chậm, nên tôi chạy song song và giữ CI dưới 15 phút. Migration DB chạy thành bước riêng và phải tương thích ngược.

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

### Hiểu nhanh
Helm giống một mẫu đơn có các ô trống: một mẫu (chart) dùng chung cho mọi service Spring Boot, mỗi môi trường điền một phiếu riêng (values file). Kustomize giống lấy bản gốc rồi dán giấy ghi chú sửa vài chỗ cho từng môi trường (patch), không có ô trống hay logic điều kiện. Secret thì không bao giờ viết thẳng lên mẫu: Git chỉ ghi "mật khẩu nằm ở két số 5" (tham chiếu tới Vault), còn operator trong cluster sẽ tự đi lấy.

### Thuật ngữ
- **Chart**: gói Helm gồm template YAML và giá trị mặc định, có version.
- **Values**: file YAML điền vào template; nhiều file {{-f}} được gộp, file sau ghi đè file trước.
- **Release / revision**: một lần cài chart vào namespace; mỗi lần upgrade tạo revision mới để rollback.
- **Base / overlay**: trong Kustomize, base là YAML chung, overlay là phần vá riêng cho từng môi trường.
- **configMapGenerator**: tính năng Kustomize sinh ConfigMap có hậu tố hash, đổi nội dung là đổi tên và kích hoạt rolling update.
- **External Secrets Operator**: operator đọc secret từ Vault hoặc AWS Secrets Manager và tạo Secret Kubernetes.
- **Sealed Secrets / SOPS**: hai cách mã hoá secret để có thể commit vào Git an toàn.

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

### Lỗi hay gặp
- Values prod đặt sai do override nhiều tầng: luôn chạy {{helm template}}/{{kubectl diff}} trong pipeline và lưu kết quả để review.
- Release Helm kẹt ở trạng thái pending-upgrade khi pipeline bị huỷ giữa chừng: cần rollback thủ công trước lần deploy sau.
- Chart chung quá nhiều if/else cho từng service thì không ai dám sửa; giữ chart nhỏ, có test ({{helm lint}}, {{helm unittest}} plugin).

### Trả lời miệng 1 phút
Với 30 service và 4 môi trường, tôi không copy YAML cho từng nơi vì sửa một probe sẽ phải sửa 120 chỗ. Tôi dùng một chart Helm chung do platform team quản lý version, mỗi service một file values nhỏ, mỗi môi trường một file values ghi đè. Helm cho template, release, history và rollback, và là chuẩn để cài phần mềm bên thứ ba. Kustomize thì không template, chỉ vá YAML thuần theo base và overlay, dễ review hơn, hợp khi khác biệt giữa môi trường nhỏ; hai cái có thể kết hợp qua Argo CD. Secret không bao giờ commit dạng base64: tôi dùng External Secrets Operator kéo từ Vault, hoặc Sealed Secrets hay SOPS nếu bắt buộc lưu trong Git, cộng encryption at rest cho etcd và RBAC chặt. Trong pipeline tôi luôn chạy helm template và kubectl diff để review trước khi áp dụng lên prod.

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

### Hiểu nhanh
Hãy coi 6 service như 6 trạm trong một dây chuyền giao hàng. Mỗi trạm ghi nhật ký ra cùng một chỗ chuẩn (stdout), một xe gom (agent DaemonSet) đi qua mọi node để thu nhật ký về kho trung tâm (ELK hoặc Loki). traceId giống mã vận đơn được in trên mọi dòng nhật ký: muốn biết một đơn hàng đã đi qua đâu, bạn chỉ cần tra mã vận đơn ở kho trung tâm thay vì đến từng trạm. Ghi log dạng JSON giống điền phiếu có ô sẵn: tìm theo ô traceId chính xác thay vì đọc văn bản tự do.

### Thuật ngữ
- **stdout / stderr**: hai luồng xuất chuẩn của process; container runtime ghi chúng thành file log trên node.
- **DaemonSet**: loại workload chạy đúng một Pod trên mỗi node, hợp cho agent thu log.
- **ELK / OpenSearch**: Elasticsearch (hoặc OpenSearch) lưu và đánh chỉ mục log, Kibana để tìm kiếm và hiển thị.
- **Loki**: hệ thống log của Grafana chỉ đánh chỉ mục label, nội dung lưu nén, rẻ hơn ELK.
- **MDC (Mapped Diagnostic Context)**: map gắn với thread trong SLF4J/Logback, các trường trong đó tự in vào mỗi dòng log.
- **W3C traceparent**: header chuẩn mang traceId và spanId giữa các service.
- **Micrometer Tracing**: thư viện tracing của Spring Boot 3 (bridge sang OpenTelemetry hoặc Brave), tạo và truyền traceId.
- **High cardinality**: một trường có quá nhiều giá trị khác nhau (traceId, userId), không được dùng làm label hay tag.

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

### Lỗi hay gặp
- Log PII (số tài khoản, CCCD, OTP) vi phạm quy định bảo mật: mask ngay ở tầng logging.
- Log DEBUG ở prod làm tràn disk node và tốn tiền lưu trữ; dùng actuator loggers để bật tạm thời theo package.
- Đỉnh tải làm agent dồn buffer: cấu hình buffer trên disk và giới hạn tốc độ để không mất log khi backend chậm.

### Trả lời miệng 1 phút
Tôi cho app ghi log ra stdout dạng JSON một dòng, không ghi file trong container, vì Pod là phù du và stdout là chuẩn chung để kubelet rotate và agent thu gom. Trên mỗi node có agent DaemonSet như Fluent Bit hoặc Grafana Alloy đọc log, gắn metadata namespace, pod, label rồi đẩy về Elasticsearch, OpenSearch hoặc Loki. Để nối một giao dịch qua 6 service, tôi dùng Micrometer Tracing: traceId nằm trong MDC nên mọi dòng log đều có, và được truyền qua header W3C traceparent ở HTTP client và Kafka. Khi điều tra chỉ cần tìm theo trường traceId, hoặc nhảy từ trace trong Tempo sang log. Trade-off: ELK tìm kiếm tự do mạnh nhưng tốn RAM và disk; Loki rẻ hơn nhưng chỉ index label, và tuyệt đối không đưa traceId làm label. Kinh nghiệm của tôi là chuẩn hoá schema ECS qua starter nội bộ và mask PII ngay ở tầng logging.

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

### Hiểu nhanh
Nginx giống quầy lễ tân đứng trước 3 nhân viên xử lý hồ sơ. Lễ tân có quy định "không nhận hồ sơ dày quá 1 MB" ({{client_max_body_size}}), nên hồ sơ 5 MB bị trả lại ngay với lỗi 413. Lễ tân chỉ chờ tối đa 60 giây giữa hai lần nhân viên phản hồi ({{proxy_read_timeout}}); nhân viên làm báo cáo mà im lặng quá 60 giây thì lễ tân báo khách "quá hạn" (504), dù nhân viên vẫn đang làm. Nếu lễ tân hoặc ai đó phía trước thấy chậm rồi đưa cùng hồ sơ chuyển tiền cho nhân viên khác, giao dịch bị làm hai lần; vì vậy mỗi hồ sơ cần một mã duy nhất (idempotency key) để người xử lý nhận ra hồ sơ đã làm rồi.

### Thuật ngữ
- **Reverse proxy**: máy chủ đứng trước backend, nhận request của client rồi chuyển tiếp; client không gọi thẳng backend.
- **upstream**: nhóm địa chỉ backend mà Nginx phân phối request tới theo thuật toán cân bằng tải.
- **keepalive (upstream)**: giữ sẵn kết nối TCP tới backend để tái sử dụng, khỏi bắt tay lại cho mỗi request.
- **proxy_read_timeout**: thời gian tối đa chờ giữa hai lần nhận dữ liệu liên tiếp từ backend, không phải tổng thời gian request.
- **proxy_next_upstream**: các điều kiện (error, timeout, http_502...) khiến Nginx thử lại request ở backend khác.
- **Idempotent**: gọi nhiều lần cho cùng kết quả như gọi một lần; theo chuẩn HTTP, GET, PUT, DELETE là idempotent, POST thì không.
- **Idempotency key**: mã duy nhất client gửi kèm request (thường trong header) để server phát hiện request trùng và trả lại kết quả cũ.
- **502 / 504**: 502 là backend trả phản hồi lỗi hoặc đóng kết nối; 504 là backend không trả lời kịp timeout.

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

### Lỗi hay gặp
- Thiếu {{proxy_http_version 1.1}} và header Connection rỗng: keepalive upstream không có tác dụng, hết ephemeral port (TIME_WAIT tăng vọt) khi tải cao.
- SSE/streaming bị dồn do {{proxy_buffering on}}: tắt buffering cho location đó.
- Nginx resolve DNS tên upstream một lần lúc khởi động; backend đổi IP (container, cloud) thì Nginx vẫn gửi tới IP cũ cho tới khi reload. Cách tránh: dùng {{resolver}} kèm biến trong proxy_pass, tham số {{resolve}} của server trong upstream (bản open source có từ 1.27.3), hoặc trỏ tới tên Service ổn định của Kubernetes.

### Trả lời miệng 1 phút
Ba lỗi này đều do giá trị mặc định của Nginx. 413 là vì client_max_body_size mặc định 1 MB, tôi tăng lên khoảng 10 MB cho location upload và chỉnh multipart của Spring cho khớp. 504 sau đúng 60 giây là vì proxy_read_timeout mặc định 60 giây, tức khoảng lặng giữa hai lần đọc chứ không phải tổng thời gian; tôi đặt timeout riêng dài hơn cho endpoint báo cáo, nhưng hướng đúng là chuyển báo cáo nặng sang bất đồng bộ, trả 202 rồi cho tải file sau. POST bị gửi hai lần là do retry: Nginx từ 1.9.13 mặc định không retry request non-idempotent, nhưng nếu ai đó bật non_idempotent hoặc client, load balancer retry sau timeout thì vẫn trùng, nên API tiền bắt buộc có idempotency key. Timeout phải xếp tầng từ client tới DB. Khi có báo cáo 502/504, việc đầu tiên tôi làm là xem upstream_response_time và upstream_addr trong access log.

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

### Hiểu nhanh
Hãy hình dung một toà nhà an ninh cao. Hàng hoá từ bên ngoài (thư viện Maven, base image) không được mang thẳng vào phòng làm việc mà phải qua kho kiểm hàng ở cổng (Nexus, Harbor ở vùng trung gian), được soi chiếu (quét lỗ hổng) và niêm phong (ký image). Sản phẩm được lắp ráp một lần ở xưởng (vùng build), rồi chuyển vào phòng làm việc (vùng prod) theo phiếu xuất kho có chữ ký (change request). Mọi lần ra vào đều được ghi sổ để kiểm toán đọc lại được: ai đổi gì, khi nào, ai duyệt.

### Thuật ngữ
- **Air-gapped**: mạng không có đường kết nối trực tiếp ra internet; dữ liệu vào ra qua kênh trung chuyển được kiểm soát.
- **Proxy repository**: kho Nexus/Artifactory đứng giữa, tải và cache thư viện từ Maven Central thay cho máy build.
- **Harbor**: registry image mã nguồn mở, có proxy cache, replication, quét lỗ hổng và kiểm soát quyền theo project.
- **Replication**: sao chép artifact đã duyệt từ registry vùng build sang registry vùng prod.
- **RFC (change request)**: hồ sơ xin thay đổi gồm phạm vi, rủi ro, các bước triển khai và kế hoạch rollback.
- **CAB / ECAB**: hội đồng duyệt thay đổi thường kỳ / hội đồng duyệt nhanh cho thay đổi khẩn cấp.
- **Standard change**: loại thay đổi lặp lại, rủi ro thấp, đã được duyệt sẵn mẫu nên không cần họp CAB mỗi lần.
- **Nguyên tắc bốn mắt**: mọi thay đổi quan trọng cần ít nhất hai người, người làm và người kiểm tra, là hai người khác nhau.

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

### Lỗi hay gặp
- Cert nội bộ (Harbor, Nexus, CA riêng) không được import vào truststore của JDK trong image: build hoặc app báo PKIX path building failed.
- Image kiến trúc khác (arm64 từ máy Mac của dev) lọt vào registry prod x86.
- Đồng hồ các vùng lệch nhau làm token/chữ ký hết hạn sớm; NTP nội bộ là bắt buộc.

### Trả lời miệng 1 phút
Tôi tổ chức theo vùng: vùng trung gian có Nexus proxy Maven Central và Harbor proxy cache, là cửa duy nhất ra internet và chỉ outbound theo whitelist; vùng build có GitLab, runner, SonarQube; vùng prod chỉ có Harbor prod read-only với dev, cluster và Argo CD. Thư viện đi qua Nexus kèm chính sách chặn CVE và license, base image do platform team phát hành. Pipeline build một lần, quét, ký image rồi replicate có phê duyệt sang prod. Mỗi release gắn với RFC có digest, kết quả UAT, tiêu chí rollback, và tách quyền người viết code, người duyệt, người deploy. Để vẫn nhanh, tôi tự động hoá bằng chứng gắn vào RFC, dùng GitOps để phê duyệt merge request chính là phê duyệt deploy, và thương lượng chuyển các thay đổi lặp lại thành standard change. Hotfix vẫn đi emergency change, không bao giờ bỏ qua hoàn toàn.

> Senior tip: Ở Việt Nam, các yêu cầu về an toàn hệ thống thông tin ngân hàng của NHNN và kiểm toán nội bộ sẽ hỏi: ai thay đổi gì, khi nào, ai duyệt, bằng chứng test ở đâu. Thiết kế pipeline sao cho mỗi câu đều trả lời được bằng một đường link thay vì một thư mục email; đó cũng là luận điểm mạnh nhất để thuyết phục CAB cho phép release thường xuyên hơn.`,
    follow: [
      'Log4Shell xuất hiện: trong môi trường không internet, bạn xác định service bị ảnh hưởng và vá trong bao lâu, bằng cách nào?',
      'Làm sao chứng minh với auditor rằng image chạy trên prod chính là image đã được quét và phê duyệt?',
      'Bạn thuyết phục CAB chuyển một loại thay đổi thành standard change như thế nào?'
    ],
    tags: ['On-premise', 'Nexus', 'Harbor', 'Change management', 'Air-gapped']
  },
  {
    id: 'devops-015',
    topic: 'devops',
    level: 'mid',
    q: 'Service Spring Boot chạy trong Pod có CPU limit 2 và memory limit 4Gi. Khi tải tăng, CPU trung bình mới khoảng 40% nhưng p99 tăng vọt và GC log dày lên. Bạn kiểm tra JVM đã đọc đúng giới hạn container chưa, rồi cấu hình MaxRAMPercentage, GC thread và ActiveProcessorCount thế nào?',
    a: `**Tóm tắt:** JVM 17/21 đọc giới hạn CPU và RAM từ cgroup, nhưng cách nó quy đổi ra {{availableProcessors}}, heap và số GC thread tạo ra những bẫy rất khác nhau. Với Pod 2 CPU/4Gi, đặt {{MaxRAMPercentage}} khoảng 75, giữ CPU request bằng limit cho service nhạy latency, và xác minh bằng GC log cùng metric CFS throttling thay vì chỉ nhìn CPU trung bình.

### Hiểu nhanh
CPU limit 2 giống một thẻ "thời gian CPU" 200 ms được nạp lại mỗi 100 ms. Nếu 8 thread cùng chạy, thẻ bị tiêu hết sau 25 ms và cả container phải ngồi chờ 75 ms tới lần nạp sau, dù tính trung bình cả giây thì thẻ mới dùng khoảng 40%. Request rơi đúng vào khoảng chờ đó bị chậm thêm hàng chục mili giây, nên p99 tăng vọt trong khi dashboard CPU vẫn đẹp. Về RAM, JVM phải biết "căn phòng" chỉ có 4 GiB để đặt heap khoảng 3 GiB và chừa chỗ cho phần ngoài heap, nếu không kernel sẽ giết process.

### Thuật ngữ
- **cgroup v2**: phiên bản mới của cơ chế giới hạn tài nguyên Linux; limit nằm trong file {{cpu.max}} và {{memory.max}}.
- **CFS quota / period**: số micro giây CPU container được dùng trong mỗi chu kỳ (mặc định 100 ms); quota chia period ra số CPU.
- **Throttling**: container bị tạm dừng khi đã dùng hết quota của chu kỳ hiện tại.
- **availableProcessors**: số CPU JVM tin là có, dùng để tính số GC thread, ForkJoinPool và nhiều thread pool.
- **MaxRAMPercentage**: phần trăm memory limit dùng làm heap tối đa khi không đặt {{-Xmx}}.
- **Server-class machine**: máy có từ 2 CPU và khoảng 1792 MB RAM trở lên; dưới ngưỡng này JVM chọn SerialGC.
- **ActiveProcessorCount**: cờ ép số CPU JVM nhìn thấy, không giới hạn CPU thật.
- **QoS Guaranteed**: lớp chất lượng của Pod khi mọi container đặt request bằng limit cho cả CPU và memory.

### JVM nhìn thấy tài nguyên như thế nào
- **CPU**: JVM lấy {{cpu.max}} (cgroup v2) hoặc quota/period (v1) để tính số processor khả dụng, không lấy số core của node. Với {{cpu.max = 200000 100000}} (chu kỳ 100 ms), JVM thấy khoảng 2 CPU. Nếu limit là 1 CPU, JVM coi đây không phải máy server-class.
- **RAM**: {{memory.max}} là mức JVM dùng để tính heap mặc định. Từ JDK 10, {{UseContainerSupport}} bật mặc định; JDK 15 trở lên đọc được cgroup v2, còn các bản 11/8 phải đủ mới.
- **Hệ quả chọn GC**: HotSpot chọn G1 khi có từ 2 CPU và từ 1792 MB; dưới ngưỡng đó thường rơi về SerialGC. Một Pod limit 1 CPU vì thế vừa ít thread xử lý, vừa dùng GC single-thread, p99 tệ đi rất nhanh khi tải tăng.

### Vì sao CPU trung bình thấp mà p99 vẫn tăng
CFS quota được nạp lại mỗi chu kỳ 100 ms. Nếu 8 thread cùng chạy trong 25 ms, chúng tiêu thụ 200 ms CPU trong 25 ms; quota 2 CPU bị cạn và toàn bộ container bị **throttle** cho tới chu kỳ sau. CPU trung bình trên dashboard chỉ khoảng 40%, nhưng request bị treo hàng chục mili giây mỗi lần. GC song song càng làm nặng thêm vì lúc stop-the-world, nhiều GC worker cùng tranh quota với application thread.

~~~bash
# Xem JVM thực sự thấy gì trong container
java -XshowSettings:system -version
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|ActiveProcessorCount|ParallelGCThreads|ConcGCThreads|UseG1GC|UseSerialGC"
jcmd 1 GC.heap_info
~~~

### Cấu hình mẫu
~~~yaml
resources:
  requests: { cpu: "2", memory: "4Gi" }
  limits:   { cpu: "2", memory: "4Gi" }
env:
  - name: JAVA_TOOL_OPTIONS
    value: >-
      -XX:MaxRAMPercentage=75
      -XX:InitialRAMPercentage=50
      -XX:+ExitOnOutOfMemoryError
      -Xlog:gc*:stdout:time,uptime,level,tags
~~~
- {{MaxRAMPercentage=75}} cho heap khoảng 3 GiB, chừa 1 GiB cho metaspace, code cache, thread stack, direct buffer của Netty và GC overhead.
- {{ActiveProcessorCount}} chỉ nên dùng khi **không** đặt CPU limit nhưng node có nhiều core: nó giới hạn số processor JVM dùng để tính thread pool, không giới hạn CPU thật. Đặt thấp hơn nhu cầu sẽ làm app thiếu thread; đặt cao hơn quota sẽ làm throttling nặng hơn.
- Service nhạy latency nên đặt request bằng limit (QoS Guaranteed) để scheduler không dồn quá nhiều Pod lên một node. Nếu bỏ limit, phải chấp nhận rủi ro noisy neighbor và theo dõi sát.
- Không đặt {{-Xmx}} cứng song song với {{MaxRAMPercentage}}: nếu {{-Xmx}} được đặt tường minh thì JVM dùng giá trị đó và **bỏ qua** {{MaxRAMPercentage}} bất kể thứ tự. Chọn một trong hai, đừng để cả hai cùng tồn tại trong manifest.

### Đo và tinh chỉnh
| Chỉ số | Ý nghĩa | Ngưỡng đáng lo |
|---|---|---|
| {{container_cpu_cfs_throttled_periods_total / container_cpu_cfs_periods_total}} | Tỷ lệ chu kỳ bị chặn | Trên 5–10% khi tải bình thường |
| GC pause p99 | Thời gian stop-the-world | Trên 200–300 ms với API online |
| {{jvm_gc_live_data_size}} sau full GC | Heap sống thật | Gần bằng Xmx |

Tăng CPU limit hoặc giảm số thread đồng thời thường hiệu quả hơn việc ép {{ParallelGCThreads}} xuống. Nếu buộc phải chỉnh, đặt {{-XX:ParallelGCThreads=2}} và {{-XX:ConcGCThreads=1}} cho Pod 2 CPU, nhưng luôn đo lại: GC thread quá ít làm pause dài, quá nhiều làm throttle.

### Lỗi hay gặp
- Limit 500m cho service Java: JVM thấy 1 CPU, SerialGC, Tomcat ít thread; đây là cấu hình sai phổ biến nhất khi copy manifest từ service Node.js sang.
- Chỉ đặt memory limit mà quên CPU limit: JVM thấy toàn bộ core của node, bật hàng chục GC thread và pool thread, sau đó tranh CPU với các Pod khác.

### Trả lời miệng 1 phút
Đầu tiên tôi kiểm tra JVM thấy gì bằng -XshowSettings:system và PrintFlagsFinal để xem MaxHeapSize, ActiveProcessorCount, số GC thread và GC đang dùng. JDK 17/21 đọc cpu.max và memory.max của cgroup, nên Pod 2 CPU, 4 GiB sẽ thấy 2 CPU và chọn G1. Tôi đặt MaxRAMPercentage 75 để heap khoảng 3 GiB, chừa 1 GiB cho metaspace, thread stack, code cache, direct buffer, và không đặt Xmx song song vì Xmx sẽ thắng. Hiện tượng CPU trung bình 40% mà p99 tăng là dấu hiệu CFS throttling: nhiều thread và GC worker tiêu hết quota trong vài chục mili giây đầu chu kỳ rồi bị dừng. Tôi xác minh bằng tỷ lệ throttled periods chia periods; nếu cao thì tăng CPU limit hoặc giảm số thread đồng thời trước, chỉ chỉnh ParallelGCThreads, ConcGCThreads khi đã đo. ActiveProcessorCount tôi chỉ dùng khi không đặt CPU limit trên node nhiều core.

> Senior tip: Trước khi tăng limit, hãy load test và xem tỷ lệ throttling; nhiều đội tăng limit gấp đôi mà p99 không cải thiện vì nút cổ chai là DB pool. Với JDK 21, virtual thread giúp giảm thread stack nhưng không miễn nhiễm CFS throttling: carrier thread vẫn bị chặn theo quota.`,
    follow: [
      'Pod 2 CPU nhưng app chạy 200 thread: nên giảm thread, tăng CPU hay đổi sang virtual thread? Vì sao?',
      'Làm sao phân biệt throttling do CPU limit với GC pause dài khi chỉ có dashboard latency?',
      'Bạn có bật -XX:+UseSerialGC cho service nhỏ 1 CPU không? Trade-off là gì?'
    ],
    tags: ['JVM', 'Container', 'cgroups', 'GC', 'CPU throttling']
  },
  {
    id: 'devops-016',
    topic: 'devops',
    level: 'mid',
    q: 'Thiết kế liveness, readiness và startup probe cho service Spring Boot khởi động 90 giây, phụ thuộc PostgreSQL và Kafka. Vì sao không nên trỏ cả ba vào /actuator/health? Cấu hình health group của Actuator thế nào để sự cố DB không gây restart dây chuyền?',
    a: `**Tóm tắt:** Ba probe có ba nhiệm vụ khác nhau: startup bảo vệ quá trình khởi động chậm, liveness restart khi process treo, readiness gỡ Pod khỏi traffic khi chưa phục vụ được. Dùng health group của Actuator để tách tuyệt đối: liveness chỉ kiểm tra trạng thái nội tại, readiness mới được phép kiểm tra dependency. Trỏ liveness vào {{/actuator/health}} tổng hợp là cách nhanh nhất để biến một sự cố DB thành chuỗi restart toàn hệ thống.

### Hiểu nhanh
Ba probe giống ba câu hỏi khác nhau của quản lý ca. Startup hỏi "nhân viên đã vào ca xong chưa?" và cho đủ thời gian chuẩn bị; trong lúc đó không hỏi hai câu còn lại. Readiness hỏi "bây giờ có nhận khách được không?"; nếu không thì tạm thời không dẫn khách tới, nhưng không thay người. Liveness hỏi "nhân viên còn tỉnh táo không hay đã ngất?"; ngất thì thay người (restart). Nếu bạn hỏi liveness bằng câu "kho hàng (DB) có mở cửa không?", kho đóng 30 giây là mọi nhân viên bị thay cùng lúc, dù lỗi chẳng nằm ở họ.

### Thuật ngữ
- **startupProbe**: probe chạy trong lúc khởi động; khi nó chưa thành công, liveness và readiness chưa được chạy.
- **readinessProbe**: fail thì Pod bị gỡ khỏi Service (không nhận traffic) nhưng không bị restart.
- **livenessProbe**: fail quá ngưỡng thì kubelet restart container.
- **Health group**: nhóm health indicator của Actuator được gom thành endpoint riêng, ví dụ {{/actuator/health/readiness}}.
- **LivenessState**: trạng thái nội tại của app, CORRECT hoặc BROKEN.
- **ReadinessState**: ACCEPTING_TRAFFIC sau khi app sẵn sàng, REFUSING_TRAFFIC khi đang tắt.
- **HealthIndicator**: bean kiểm tra một thành phần (db, redis...) và trả UP hoặc DOWN.
- **Management port**: cổng riêng cho Actuator ({{management.server.port}}), tách khỏi cổng phục vụ API.

### Actuator chia health group thế nào
Khi chạy trên Kubernetes, Spring Boot tự bật probe; vẫn nên khai báo tường minh:
~~~yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when_authorized
      group:
        readiness:
          include: readinessState,db,paymentWarmup
          show-details: always
        liveness:
          include: livenessState
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  server:
    port: 8081
~~~
- {{livenessState}} chỉ chuyển sang {{BROKEN}} khi application context hỏng; đây là tín hiệu "restart có ích".
- {{readinessState}} là {{ACCEPTING_TRAFFIC}} sau {{ApplicationReadyEvent}} và {{REFUSING_TRAFFIC}} khi bắt đầu shutdown.
- Nếu tự đặt {{include}}, phải liệt kê cả {{readinessState}}, nếu không nó bị thay thế và probe chỉ còn dependency.
- {{db}} là DataSourceHealthIndicator có sẵn. Kafka không có indicator mặc định trong Boot; nếu cần, viết {{HealthIndicator}} riêng có timeout ngắn và cache kết quả.

### Chọn dependency nào cho readiness
Câu hỏi không phải "có kiểm tra DB không" mà là "khi DB chậm, gỡ toàn bộ Pod khỏi traffic có giúp gì không".
- Nếu service **không thể** xử lý request nào khi DB chết: đưa {{db}} vào readiness. Pod bị gỡ, người dùng nhận lỗi nhanh thay vì treo.
- Nếu service vẫn phục vụ được một phần (đọc cache, ghi outbox rồi xử lý sau): **không** đưa Kafka/DB vào readiness, hoặc chỉ đưa khi tỷ lệ lỗi vượt ngưỡng. Gỡ hết Pod sẽ biến sự cố cục bộ thành sập toàn bộ.
- Không bao giờ đưa dependency vào **liveness**. DB chậm 30 giây làm mọi Pod restart cùng lúc, mất cache, tăng tải DB, tạo vòng xoáy chết.
- Health check phải rẻ: {{SELECT 1}} qua pool, timeout 1–2 giây, có cache 5–10 giây. Đừng chạy truy vấn nghiệp vụ nặng mỗi 5 giây.

### Timing cho service khởi động 90 giây
| Probe | Path | Period | failureThreshold | Ý nghĩa |
|---|---|---|---|---|
| startup | /actuator/health/liveness | 5 s | 30 | Cho tối đa 150 s để boot |
| readiness | /actuator/health/readiness | 5 s | 3 | Gỡ traffic sau khoảng 15 s lỗi |
| liveness | /actuator/health/liveness | 10 s | 3 | Restart sau khoảng 30 s treo |

Khi có startupProbe, Kubernetes **không chạy** liveness và readiness cho tới khi startup thành công, nên không cần {{initialDelaySeconds}} lớn. Đặt startup quá ngắn sẽ tạo CrashLoopBackOff oan cho app chỉ chậm Flyway hoặc JIT.

### Warm-up trước khi nhận traffic
Khởi động xong context không có nghĩa là phục vụ tốt: connection pool chưa mở, cache rỗng, JIT chưa nóng. Có hai cách:
- Chạy warm-up trong {{ApplicationRunner}} trước khi phát {{ACCEPTING_TRAFFIC}}; readiness tự nhiên bị chặn.
- Dùng một {{HealthIndicator}} trả {{DOWN}} cho tới khi cờ {{warm}} được bật; nhớ đặt timeout để không treo mãi.

Đừng gọi chính API public để warm-up nếu nó ghi dữ liệu; dùng endpoint nội bộ hoặc gọi các truy vấn đọc đại diện.

### Lỗi hay gặp
- Đặt management port 8081 nhưng probe vẫn trỏ 8080: probe nhận 404, Pod không bao giờ Ready.
- {{server.servlet.context-path}} làm đường dẫn actuator đổi theo; kiểm tra lại path thực tế.
- Security filter chặn {{/actuator/health/**}} vì chỉ mở cho role ADMIN: kubelet không có token, probe fail.
- Probe timeout 1 giây nhưng DB health timeout 5 giây: probe fail trước khi health kịp trả lời.

### Trả lời miệng 1 phút
Ba probe có ba nhiệm vụ: startup che quá trình khởi động chậm, liveness restart khi process treo không tự hồi phục, readiness gỡ Pod khỏi traffic khi tạm thời chưa phục vụ được. Nếu trỏ cả ba vào /actuator/health tổng hợp, DB chậm 30 giây sẽ làm liveness fail ở mọi Pod, tất cả restart cùng lúc, mất cache và dồn tải lên DB, tức là tự tạo sự cố dây chuyền. Tôi dùng health group của Actuator: liveness chỉ gồm livenessState, readiness gồm readinessState cộng db nếu service hoàn toàn không phục vụ được khi DB chết. Kafka không có indicator mặc định, nếu cần thì tự viết có timeout ngắn và cache. Với app khởi động 90 giây, startup probe period 5 giây, failureThreshold 30 cho tối đa 150 giây. Trước khi lên prod, tôi chặn DB trên staging và kiểm tra: liveness xanh, readiness đỏ, không Pod nào restart.

> Senior tip: Trong staging, hãy chủ động chặn DB/Kafka rồi quan sát: liveness phải xanh, readiness phải đỏ, không có Pod nào restart. Đây là bài test bắt buộc trước khi lên production; nếu liveness đỏ, bạn đang tự tạo thảm hoạ.`,
    follow: [
      'Readiness probe nên kiểm tra DB bằng SELECT 1 hay chỉ trạng thái connection pool? Vì sao?',
      'Khi Kafka chết nhưng service vẫn ghi outbox được, bạn có gỡ Pod khỏi traffic không?',
      'Làm sao tránh tất cả Pod cùng restart khi node hoặc DB gặp sự cố?'
    ],
    tags: ['Kubernetes', 'Actuator', 'Probe', 'Readiness', 'Liveness']
  },
  {
    id: 'devops-017',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn đã bật server.shutdown=graceful nhưng mỗi lần deploy vẫn có Pod bị SIGKILL sau 30 giây và mất message Kafka. Hãy giải thích đầy đủ trình tự tắt Pod trên Kubernetes, những gì Spring Boot graceful shutdown không xử lý, và cấu hình đúng để không mất request lẫn message.',
    a: `**Tóm tắt:** Tắt Pod là một chuỗi sự kiện chạy song song, không tuần tự: endpoint bị gỡ, preStop chạy, SIGTERM được gửi, hết grace period thì SIGKILL. {{server.shutdown=graceful}} chỉ lo phần HTTP: ngừng nhận request mới và chờ request đang chạy; nó không tự chờ executor tự tạo, tác vụ định kỳ, consumer Kafka hay thread non-daemon. Muốn không mất dữ liệu, phải drain từng thành phần và đặt tổng thời gian bé hơn {{terminationGracePeriodSeconds}}.

### Hiểu nhanh
Tắt một Pod giống đóng cửa một cửa hàng. Bạn treo biển "sắp đóng cửa" để người dẫn đường ngừng đưa khách tới (gỡ endpoint), chờ vài phút cho chắc không còn ai được dẫn tới (preStop), phục vụ nốt khách đang ở trong (graceful shutdown của HTTP). Nhưng còn phải tắt bếp, kiểm két, ghi sổ (executor, tác vụ định kỳ, commit offset Kafka), và những việc này Spring không tự làm hết. Bảo vệ toà nhà khoá cửa đúng giờ (SIGKILL khi hết grace period) dù bạn đã xong hay chưa.

### Thuật ngữ
- **SIGTERM / SIGKILL**: tín hiệu yêu cầu tắt lịch sự và tín hiệu giết ngay, không thể bắt hay trì hoãn.
- **terminationGracePeriodSeconds**: tổng thời gian tính từ lúc Pod bắt đầu tắt (gồm cả preStop) tới khi bị SIGKILL, mặc định 30 giây.
- **preStop hook**: lệnh hoặc HTTP call kubelet thực hiện trước khi gửi SIGTERM.
- **timeout-per-shutdown-phase**: thời gian tối đa Spring chờ mỗi pha dừng các bean SmartLifecycle, mặc định 30 giây.
- **SmartLifecycle**: interface cho bean có start/stop theo thứ tự (phase), như web server, Kafka listener container.
- **Offset commit**: consumer Kafka ghi lại vị trí đã xử lý; lần sau đọc tiếp từ vị trí này.
- **Rebalance**: Kafka chia lại partition giữa các consumer khi có consumer vào hoặc rời group.
- **Non-daemon thread**: thread mà JVM phải chờ kết thúc mới thoát được.

### Trình tự thực tế
~~~text
t=0    API server đánh dấu Pod Terminating, bắt đầu gỡ khỏi EndpointSlice
t=0    kubelet chạy preStop (sleep 10) - app vẫn phục vụ bình thường
t=10   SIGTERM tới PID 1 (java)
t=10   Spring: đóng cổng nhận request mới, chờ request đang chạy
t=10   ReadinessState chuyển sang REFUSING_TRAFFIC
t=10+  ContextClosedEvent, các bean SmartLifecycle dừng dần
t=30   hết timeout-per-shutdown-phase (20 s), đóng context
t=60   hết terminationGracePeriodSeconds, SIGKILL nếu JVM còn sống
~~~
Hai nhánh gỡ endpoint và gửi SIGTERM **không đồng bộ**. Vì vậy luôn cần preStop sleep vài giây để kube-proxy/Ingress kịp quên Pod trước khi cổng đóng.

### Spring graceful shutdown làm gì
- Tomcat/Jetty/Undertow ngừng nhận connection mới, đóng keep-alive, chờ request đang xử lý tối đa {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30 giây; Boot 3.4 bật graceful mặc định nhưng vẫn nên khai báo rõ).
- Request dài hơn timeout bị cắt; client nhận lỗi kết nối hoặc 503. Với upload/report chạy hàng phút, phải chủ động trả 503 sớm hoặc tách sang async job.

### Những thứ Spring không tự xử lý
| Thành phần | Vấn đề | Cách xử lý |
|---|---|---|
| {{ThreadPoolExecutor}} tự tạo | Không phải bean, không ai shutdown | Đăng ký bean, gọi {{shutdown()}} và {{awaitTermination()}} trong {{@PreDestroy}} |
| {{ThreadPoolTaskExecutor}} | Mặc định không chờ task đang chạy | {{setWaitForTasksToCompleteOnShutdown(true)}} + {{setAwaitTerminationSeconds(20)}} |
| {{@Scheduled}} | Task đang chạy có thể bị interrupt | Cấu hình scheduler chờ hoặc kiểm tra cờ shutdown trong task |
| Kafka listener | Có thể còn record đang xử lý, commit sau khi context đóng | Dừng container chủ động, chờ record hiện tại, commit, rồi mới đóng pool |
| Thread non-daemon | JVM không thoát dù context đã đóng | Tìm qua thread dump, đặt daemon hoặc join có timeout |

### Cấu hình mẫu
~~~yaml
spec:
  terminationGracePeriodSeconds: 60
  containers:
    - name: payment
      lifecycle:
        preStop:
          httpGet: { path: /internal/drain, port: 8081 }
~~~
~~~text
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=20s
spring.task.execution.shutdown.await-termination=true
spring.task.execution.shutdown.await-termination-period=15s
~~~
Endpoint {{/internal/drain}} bật cờ để readiness trả {{OUT_OF_SERVICE}} và từ chối request mới, sau đó sleep phần còn lại. Nếu image không có {{sleep}} (distroless), dùng {{httpGet}} thay vì {{exec}}.

### Canh thời gian
{{terminationGracePeriodSeconds}} phải lớn hơn {{preStop + timeout-per-shutdown-phase + buffer}}. Ví dụ preStop 10 s, Spring chờ 20 s, buffer 10 s thì đặt 45–60 s. Nếu đặt grace 30 s mà preStop đã 20 s, app chỉ còn 10 s để tắt, rất dễ SIGKILL.

Với Kafka, thời gian còn phụ thuộc rebalance và commit. Chia nhỏ batch, commit theo lô, dùng idempotent consumer; đừng tắt {{enable.auto.commit}} rồi quên commit thủ công.

### Cách kiểm chứng
- Chạy load test liên tục trong lúc rolling update; yêu cầu 0 lỗi 5xx và không có message trùng.
- Xem log có {{Commencing graceful shutdown}} và {{Graceful shutdown complete}}; nếu chỉ thấy dòng đầu rồi Pod biến mất, nhiều khả năng SIGKILL.

### Lỗi hay gặp
- preStop dùng {{sh -c sleep}} trên image distroless: không có shell, hook fail ngay, mất tác dụng che race.
- Grace period để mặc định 30 giây trong khi preStop 10 giây và Spring chờ 30 giây: Pod bị SIGKILL, log chỉ có dòng "Commencing graceful shutdown" mà không có "complete". Cách tránh: cộng đủ preStop, timeout của Spring và buffer rồi mới đặt grace.
- Commit offset trước khi xử lý xong (auto-commit hoặc tự commit sớm): bị SIGKILL giữa chừng thì message coi như đã đọc nhưng chưa xử lý, tức là mất. Cách tránh: commit sau khi xử lý (AckMode của Spring Kafka) và làm consumer idempotent để chịu được xử lý lại.

### Trả lời miệng 1 phút
Khi Pod bị xoá, có hai nhánh chạy song song: control plane gỡ Pod khỏi EndpointSlice, còn kubelet chạy preStop rồi gửi SIGTERM; hết terminationGracePeriodSeconds mà JVM còn sống thì SIGKILL. server.shutdown=graceful chỉ lo HTTP: ngừng nhận request mới và chờ request đang chạy tới timeout-per-shutdown-phase. Nó không tự chờ executor tự tạo, task @Scheduled, thread non-daemon, và với Kafka phải đảm bảo record đang xử lý xong và offset được commit trước khi đóng. Cấu hình của tôi: preStop khoảng 10 giây cho proxy kịp quên Pod, Spring timeout 20 giây, executor chờ task hoàn tất, Kafka commit sau khi xử lý và consumer idempotent, grace period khoảng 60 giây, lớn hơn tổng các khoảng trên. Trade-off là rollout chậm hơn. Tôi kiểm chứng bằng load test trong lúc rolling update, yêu cầu 0 lỗi 5xx, không trùng hay mất message, và đếm SIGKILL sau release.

> Senior tip: Đo rollout thật bằng load test và đếm lỗi theo từng giây; đừng tin cảm giác "đã bật graceful". Với service thanh toán, tôi thường đặt grace 60 s, preStop 10 s, Spring timeout 20 s, và theo dõi SIGKILL trong 24 giờ sau release.`,
    follow: [
      'Kafka listener nên dừng trước hay sau khi web server ngừng nhận request? Vì sao?',
      'Làm sao phát hiện thread non-daemon nào đang giữ JVM sống trong lúc shutdown?',
      'Với request upload kéo dài 3 phút, bạn xử lý graceful shutdown thế nào?'
    ],
    tags: ['Graceful shutdown', 'Kubernetes', 'Kafka', 'preStop', 'SIGTERM']
  },
  {
    id: 'devops-018',
    topic: 'devops',
    level: 'senior',
    q: 'HPA theo CPU không phản ứng với service I/O-bound. Bạn đưa custom metric như RPS, độ sâu queue hoặc lag Kafka vào HPA thế nào? Trình bày kiến trúc metrics pipeline, cách chọn metric và các bẫy khi scale service Java.',
    a: `**Tóm tắt:** metrics-server chỉ cung cấp CPU/memory; muốn HPA scale theo RPS, độ sâu queue hay lag Kafka phải đưa metric vào API {{custom.metrics.k8s.io}} hoặc {{external.metrics.k8s.io}} qua Prometheus Adapter, hoặc dùng KEDA. Chọn metric càng gần tải thật càng tốt, nhưng HPA vẫn là vòng điều khiển chậm: scrape, sync 15 giây, rồi thời gian JVM khởi động, nên phải kết hợp minReplicas và scale theo lịch.

### Hiểu nhanh
HPA giống bộ điều nhiệt: đọc nhiệt độ rồi bật thêm máy lạnh. Mặc định nó chỉ có nhiệt kế CPU và RAM (metrics-server). Với service chủ yếu chờ DB hoặc HTTP, "nhiệt độ" thật là số khách đang xếp hàng (RPS, độ sâu queue, lag Kafka), nên phải lắp thêm cảm biến: Prometheus thu số liệu, Prometheus Adapter hoặc KEDA dịch số liệu đó sang API mà HPA hiểu. Máy lạnh Java cần 1–3 phút mới mát (khởi động, JIT warm-up), nên vẫn phải bật sẵn trước giờ nóng thay vì chỉ trông vào cảm biến.

### Thuật ngữ
- **metrics.k8s.io**: API metric tài nguyên (CPU, RAM) do metrics-server cung cấp.
- **custom.metrics.k8s.io / external.metrics.k8s.io**: API cho metric gắn với object Kubernetes (Pod) và metric bên ngoài (queue, lag).
- **Prometheus Adapter**: thành phần chạy PromQL và phơi kết quả qua custom/external metrics API.
- **KEDA ScaledObject**: CRD khai báo scaler (Kafka, cron...) cho một workload; KEDA tạo HPA tương ứng.
- **AverageValue / Value**: target chia đều cho mỗi Pod, hoặc target so với tổng giá trị không chia.
- **Consumer lag**: số message consumer group chưa xử lý; tối đa số consumer hữu ích bằng số partition.
- **PromQL**: ngôn ngữ truy vấn của Prometheus, ví dụ tính RPS bằng {{rate(...[1m])}}.

### Kiến trúc đưa custom metric vào HPA
~~~text
Pod /actuator/prometheus
        | scrape
   Prometheus ---> prometheus-adapter ---> custom.metrics.k8s.io
        |                                        |
        +------> KEDA (external metrics) --------+--> HPA --> Deployment
~~~
- {{metrics-server}} chỉ phục vụ {{metrics.k8s.io}} (CPU/RAM từ kubelet), không đọc Prometheus.
- {{prometheus-adapter}} biến PromQL thành metric API. Rule ánh xạ tên metric, selector và công thức.
- {{KEDA}} mạnh ở scaler có sẵn (Kafka, RabbitMQ, SQS, cron), hỗ trợ scale về 0; bên dưới KEDA vẫn tạo HPA.

Ví dụ HPA theo RPS trung bình mỗi Pod:
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: payment }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: payment }
  minReplicas: 4
  maxReplicas: 30
  metrics:
    - type: Pods
      pods:
        metric: { name: http_requests_per_second }
        target: { type: AverageValue, averageValue: "300" }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies: [{ type: Percent, value: 100, periodSeconds: 30 }]
    scaleDown:
      stabilizationWindowSeconds: 600
      policies: [{ type: Pods, value: 1, periodSeconds: 60 }]
~~~
{{AverageValue}} nghĩa là mỗi Pod nên phục vụ trung bình 300 RPS. Nếu dùng {{External}} với {{AverageValue}}, HPA chia tổng giá trị cho số replica; với {{Value}} thì không chia, phù hợp metric kiểu "có bao nhiêu job đang chờ".

### Công thức và độ trễ
~~~text
desired = ceil(currentReplicas * currentMetric / target)
ví dụ: 6 Pod * 450 RPS / 300 = 9 Pod
~~~
Mỗi vòng HPA gồm: Prometheus scrape (10–30 s), adapter, HPA sync (mặc định 15 s), scheduler, pull image, Spring Boot khởi động 30–90 s và JIT warm-up. Từ lúc tải tăng tới lúc Pod mới phục vụ tốt có thể là 2–4 phút.

### KEDA cho consumer Kafka
KEDA có scaler Kafka sẵn: khai báo {{ScaledObject}} với {{lagThreshold}} và {{maxReplicaCount}}; bên dưới nó vẫn tạo HPA và có thể scale về 0. Đặt maxReplicaCount không vượt số partition, scale down chậm để tránh rebalance storm, và chỉ scale về 0 cho worker/batch vì API Java khởi động chậm.

### Bẫy khi scale service Java
| Bẫy | Hậu quả | Cách tránh |
|---|---|---|
| Đếm cả Pod chưa Ready | Chia nhỏ mẫu số, scale quá tay | Lọc {{ready="true"}} trong PromQL hoặc dùng resource metric |
| Dùng latency làm target | Vòng phản hồi trễ, dao động | Scale theo RPS/concurrency/queue; latency chỉ để alert |
| CPU lúc JIT/khởi động | Pod mới bị tính là quá tải | startupProbe + readiness đúng, bỏ qua giai đoạn đầu |

Chọn metric gần tải thật: RPS/concurrency cho API I/O-bound, queue depth hoặc lag cho consumer, CPU cho service tính toán nặng. Tránh memory vì heap Java ít trả lại sau GC, và tránh latency vì đây là chỉ số phản hồi trễ, dễ gây dao động. Luôn load test để biết năng lực một Pod, rồi đặt target thấp hơn 20–30% và giữ {{minReplicas}} đủ gánh tải nền.

### Lỗi hay gặp
- Metric thiếu hoặc PromQL sai: HPA báo {{FailedGetExternalMetric}} và không scale; phải alert trên điều kiện này.
- Consumer scale lên 20 khi topic chỉ có 6 partition: 14 Pod idle, rebalance liên tục, lag còn tăng.
- Quên {{requests.cpu}} trên container: HPA theo CPU không tính được, metric hiển thị {{unknown}}.

### Trả lời miệng 1 phút
metrics-server chỉ cung cấp CPU và RAM, nên với service I/O-bound tôi đưa metric gần tải thật vào HPA. Kiến trúc là app phơi /actuator/prometheus, Prometheus scrape, rồi Prometheus Adapter biến PromQL thành custom.metrics.k8s.io hoặc external.metrics.k8s.io; với Kafka, RabbitMQ hay cron tôi dùng KEDA vì có scaler sẵn và bên dưới vẫn tạo HPA. Chọn metric: RPS hoặc số request đồng thời cho API, lag hoặc độ sâu queue cho consumer, CPU cho service tính toán; tránh memory vì heap Java ít trả lại, và tránh latency vì đó là tín hiệu trễ, dễ dao động. Target đặt thấp hơn năng lực một Pod đo bằng load test khoảng 20–30%. Bẫy với Java: vòng phản hồi 2–4 phút vì khởi động và JIT, consumer vượt số partition thì ngồi không, và quên CPU request. Vì vậy tôi giữ minReplicas theo đỉnh lịch và chỉ để HPA xử lý phần bất thường.

> Senior tip: HPA không thay thế năng lực dự báo. Với hệ thống ngân hàng, tôi giữ minReplicas theo đỉnh lịch (ngày lương, cuối tháng), dùng KEDA cron nâng trước 30 phút, và chỉ để HPA xử lý phần bất thường. Đo {{container_cpu_cfs_throttled_periods_total}} cùng lúc với HPA để biết scale có thực sự giúp hay chỉ làm DB căng hơn.`,
    follow: [
      'Vì sao scale consumer Kafka vượt số partition không tăng throughput? Bạn xử lý backlog thế nào?',
      'Metric RPS do adapter trả về là tổng hay trung bình mỗi Pod? Cấu hình HPA khác nhau ra sao?',
      'HPA scale lên 20 Pod nhưng p99 không giảm: bạn kiểm tra những điểm nghẽn nào?'
    ],
    tags: ['Kubernetes', 'HPA', 'KEDA', 'Prometheus Adapter', 'Autoscaling']
  },
  {
    id: 'devops-019',
    topic: 'devops',
    level: 'lead',
    q: 'Với hệ thống core banking và thanh toán, bạn chọn rolling update, blue-green hay canary? So sánh chi phí, blast radius, rollback và ràng buộc dữ liệu; khi nào dùng từng chiến lược và ai được quyền quyết định rollback?',
    a: `**Tóm tắt:** Rolling update là mặc định vì rẻ và đơn giản nhưng trộn hai version trong thời gian deploy; blue-green đổi toàn bộ traffic sang môi trường mới, rollback tức thì nhưng gấp đôi tài nguyên; canary giảm blast radius bằng cách đưa một phần traffic qua version mới, đổi lại cần hạ tầng chia traffic và metric đủ tin cậy. Với core banking, tôi dùng rolling cho thay đổi nhỏ, canary có phân tích tự động cho thay đổi rủi ro, và blue-green cho thay đổi lớn về hạ tầng hoặc version nền tảng.

### Hiểu nhanh
Rolling update giống thay dần từng bóng đèn trong phòng khi đèn vẫn đang sáng: rẻ, nhưng có lúc đèn cũ và đèn mới cùng bật. Blue-green giống dựng sẵn sân khấu thứ hai, kiểm tra xong thì gạt công tắc chuyển khán giả sang, có sự cố thì gạt ngược lại. Canary giống cho vài thực khách nếm món mới trước khi đưa vào thực đơn: ít người bị ảnh hưởng nếu món dở. Cả ba đều không cứu được nếu bạn đã đổ nhầm nguyên liệu vào kho chung (DB), vì dữ liệu đã ghi không tự quay lại.

### Thuật ngữ
- **Blast radius**: phạm vi người dùng hoặc hệ thống bị ảnh hưởng khi version mới lỗi.
- **Cutover**: thời điểm chuyển toàn bộ traffic từ môi trường cũ sang môi trường mới.
- **Baseline**: nhóm Pod version cũ chạy cùng thời điểm, dùng để so sánh công bằng với canary.
- **Analysis**: bước Argo Rollouts hoặc Flagger truy vấn metric để tự quyết định tiếp tục hay huỷ rollout.
- **Weighted routing**: chia traffic theo trọng số (5%, 25%...) ở ingress, service mesh hoặc Gateway API.
- **Expand-contract**: đổi schema theo nhiều bước tương thích ngược để hai version app cùng chạy được.
- **SLO burn rate**: tốc độ tiêu hao error budget; burn rate cao là tín hiệu rollback.

### So sánh
| Tiêu chí | Rolling | Blue-green | Canary |
|---|---|---|---|
| Tài nguyên dư | Ít (surge 1–25%) | Gần gấp đôi | Ít đến vừa |
| Rollback | Rollout undo, vài chục giây | Đổi selector/DNS, gần tức thì | Giảm weight về 0 |
| Blast radius | Toàn bộ nếu version lỗi | 0 nếu chưa cutover | Nhỏ, theo phần trăm |
| Độ phức tạp | Thấp | Trung bình | Cao |
| Yêu cầu dữ liệu | Schema tương thích hai chiều | Như rolling | Như rolling + metric |
| Phù hợp | Stateless, thay đổi nhỏ | Release lớn, cần cutover sạch | Thay đổi rủi ro, traffic đủ lớn |

### Rolling update
- Kiểm soát bằng {{maxSurge}}, {{maxUnavailable}}, {{minReadySeconds}}, probe và graceful shutdown.
- Version cũ và mới chạy song song nên API, message schema và DB phải tương thích ngược.
- Không có "cửa sổ vàng" để so sánh hai version; nếu version mới lỗi, một phần người dùng đã chịu ảnh hưởng trước khi rollout dừng.
- {{kubectl rollout undo}} quay về ReplicaSet trước; nhưng nếu migration DB đã chạy thì rollback app có thể vỡ.

### Blue-green
- Hai môi trường (blue/green) chạy song song, Service hoặc Ingress chỉ trỏ vào một bên.
- Green được warm-up và smoke test trước; cutover đổi selector hoặc weight 100%.
- Rollback chỉ là đổi lại selector, rất nhanh, nhưng **không** giải quyết được dữ liệu đã ghi bởi version mới.
- Chi phí: gấp đôi Pod, gấp đôi connection pool tới DB, gấp đôi cache; phải kiểm tra DB chịu được.
- DNS TTL và connection keep-alive làm cutover không tức thì với một số client; session phải externalized hoặc stateless.

### Canary
- Đưa 1% → 5% → 25% → 50% → 100% traffic qua version mới, dừng lại phân tích ở mỗi bước.
- Công cụ: Argo Rollouts, Flagger, Istio/Gateway API weight, hoặc ingress controller hỗ trợ weighted routing.
- Phân tích tự động dựa trên Prometheus: tỷ lệ lỗi 5xx, p99, tỷ lệ timeout, và metric nghiệp vụ như tỷ lệ giao dịch thành công. So sánh canary với baseline cùng thời điểm, không so với hôm qua.
- Cần đủ mẫu: 1% của 100 RPS là 1 RPS, không đủ để phát hiện lỗi hiếm.
- Không chia được traffic theo phần trăm cho Kafka consumer; dùng consumer group riêng, shadow topic hoặc chạy version mới trên một tập partition.

### Ràng buộc dữ liệu là trên hết
Cả ba chiến lược đều yêu cầu **expand-contract** khi đổi schema: thêm cột/table mới, dual-write, backfill, chuyển đọc, rồi mới xoá cột cũ sau vài release. Canary không cứu được một migration phá vỡ version cũ. Đừng để app tự chạy migration mỗi Pod khởi động; chạy migration như một bước riêng trước khi deploy.

### Ai quyết định rollback
- Trước release, chốt **tiêu chí định lượng**: lỗi 5xx trên 1% trong 5 phút, p99 trên 800 ms, tỷ lệ thanh toán thành công giảm trên 2%, hoặc alert SLO burn rate.
- Release owner và SRE on-call cùng có quyền dừng. Với canary, Argo Rollouts có thể tự abort khi analysis fail.

### Lỗi hay gặp
- Canary so sánh Pod mới (chưa warm JIT) với Pod cũ (đã chạy vài ngày): kết luận sai là version mới chậm hơn.
- Blue-green nhưng dùng chung DB connection pool tối đa: green khởi động làm cạn connection, blue sập theo.
- Ingress weight nhưng client giữ kết nối HTTP/2 lâu: traffic không thực sự chia theo phần trăm.

### Trả lời miệng 1 phút
Tôi không chọn một chiến lược cho mọi thứ. Rolling update là mặc định cho thay đổi nhỏ vì rẻ, chỉ tốn surge vài Pod, nhưng hai version chạy song song và nếu version mới lỗi thì một phần người dùng đã chịu ảnh hưởng. Blue-green cho release lớn hoặc đổi nền tảng: rollback gần tức thì bằng đổi selector, nhưng gần gấp đôi tài nguyên, gấp đôi connection pool tới DB. Canary cho thay đổi rủi ro: blast radius nhỏ, nhưng cần hạ tầng chia traffic, đủ traffic để có ý nghĩa thống kê, và metric so sánh với baseline cùng thời điểm. Ràng buộc trên hết là dữ liệu: cả ba đều cần migration expand-contract. Về quyền rollback, tiêu chí định lượng được chốt trước release, như 5xx trên 1% trong 5 phút; release owner và SRE on-call đều được dừng, và Argo Rollouts có thể tự abort khi analysis fail.

> Senior tip: Đừng chọn công cụ trước khi có SLO và metric tin cậy. Một canary 5% chỉ đáng tin khi bạn có dashboard so sánh baseline/canary theo cùng cửa sổ thời gian và đủ traffic; nếu không, blue-green với cutover có kiểm soát và rollback một nút bấm còn an toàn hơn. Ở ngân hàng, tôi luôn canary cho nhân viên nội bộ trước, rồi mới mở cho khách hàng theo cohort.`,
    follow: [
      'Canary cho Kafka consumer khác gì canary cho API? Bạn chia traffic theo partition thế nào?',
      'Blue-green gấp đôi connection pool: bạn tính toán và cấu hình DB ra sao để không sập?',
      'Tiêu chí rollback tự động của bạn gồm những metric nào và cửa sổ thời gian bao lâu?'
    ],
    tags: ['Kubernetes', 'Blue-green', 'Canary', 'Rolling update', 'Release strategy']
  },
  {
    id: 'devops-020',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn dựng pipeline CI/CD cho một service Spring Boot mới. Các stage nào nên có, stage nào chặn merge, làm sao build một lần và promote đúng artifact qua nhiều môi trường, và đặt migration DB ở đâu trong pipeline?',
    a: `**Tóm tắt:** Pipeline tốt cho service Java phải cho feedback nhanh ở các bước rẻ, build artifact **một lần** rồi promote đúng digest qua các môi trường, và chặn merge bằng những kiểm tra bắt buộc. Đừng rebuild cho từng môi trường, đừng để app tự chạy migration trên mọi Pod, và đừng đánh đổi tốc độ bằng cách bỏ test integration.

### Hiểu nhanh
Pipeline giống quy trình soi chiếu hành lý ở sân bay: các bước rẻ và nhanh (compile, unit test) làm trước để loại lỗi sớm, bước tốn thời gian (integration, E2E) làm sau. Hành lý được dán thẻ một lần (image digest) và thẻ đó đi theo suốt hành trình qua mọi chặng; không ai đóng gói lại hành lý ở chặng giữa. Migration DB giống sửa đường băng: làm một lần, có kế hoạch, trước khi máy bay mới hạ cánh, và đường băng sau khi sửa vẫn phải dùng được cho máy bay cũ.

### Thuật ngữ
- **Fail fast**: đặt kiểm tra rẻ và nhanh lên đầu để dev nhận phản hồi sớm.
- **Testcontainers**: thư viện chạy PostgreSQL, Kafka thật trong Docker cho integration test.
- **SAST / SCA**: phân tích mã nguồn tĩnh và quét thư viện bên thứ ba có CVE hoặc license không phù hợp.
- **Immutable tag**: cấu hình registry cấm ghi đè một tag đã tồn tại.
- **Digest**: mã sha256 định danh duy nhất nội dung image.
- **initContainer / Job**: container chạy xong rồi mới khởi động app, hoặc tác vụ chạy một lần; dùng để chạy migration riêng.
- **flyway_schema_history**: bảng Flyway ghi lại migration đã áp dụng cùng checksum.
- **Flaky test**: test lúc pass lúc fail dù code không đổi, làm team mất niềm tin vào pipeline.

### Các stage
| Stage | Thời gian mục tiêu | Chặn merge | Ghi chú |
|---|---|---|---|
| Compile + checkstyle | Dưới 2 phút | Có | Fail fast, cache dependency |
| Unit test | Dưới 5 phút | Có | Chạy song song, không cần DB thật |
| Integration test | Dưới 10 phút | Có | Testcontainers cho PostgreSQL/Kafka |
| SAST + dependency scan | Dưới 5 phút | Có với lỗi critical | SBOM, CVE, license |
| Build image + scan | Dưới 5 phút | Có | Một lần, tag theo commit SHA |
| Deploy DEV/SIT | — | Không | Tự động |
| E2E/smoke | — | Có trước PROD | Chạy trên môi trường giống prod |
| Deploy PROD | — | Có phê duyệt | Promote đúng digest |

### Build một lần, promote nhiều lần
~~~text
commit abc123
   -> image registry/payment:abc123  (digest sha256:...)
   -> DEV  dùng digest đó
   -> SIT  dùng đúng digest đó
   -> PROD dùng đúng digest đó
~~~
Nếu mỗi môi trường rebuild, bạn không chứng minh được artifact đã test chính là artifact chạy prod. Tag theo {{git SHA}} và ghi digest vào biên bản release; registry bật immutable tag để không ai ghi đè.

### Cache và tốc độ
- Cache thư mục {{.m2}} theo hash của {{pom.xml}}; cache Docker layer bằng {{--mount=type=cache}}.
- Tách job unit và integration; unit chạy trên mọi push, integration chạy trên merge request để tiết kiệm runner.
- Dùng matrix/shard để chia test; đặt timeout cho từng job để job treo không giữ runner.

### Test integration đúng cách
Testcontainers khởi động PostgreSQL/Kafka thật trong CI, chạy migration Flyway rồi test repository. Điều này bắt được lỗi SQL, kiểu dữ liệu, transaction mà mock không thấy.
~~~java
@Testcontainers
class PaymentRepositoryTest {
    @Container
    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", db::getJdbcUrl);
        r.add("spring.datasource.username", db::getUsername);
        r.add("spring.datasource.password", db::getPassword);
    }
}
~~~
Không dùng chung một database staging cho mọi job: test song song sẽ giẫm dữ liệu và trở nên flaky.

### Migration và deploy
- Chạy Flyway như một job/initContainer riêng trước khi rollout, không để mỗi Pod tự migrate. Flyway có lock nhưng nhiều Pod cùng chờ làm thời gian khởi động tăng và khó quan sát.
- Migration phải tương thích ngược: version cũ và mới cùng chạy trong lúc rolling.
- Pipeline lưu {{flyway_schema_history}} hoặc log migration vào artifact release.
- Rollback app bằng cách deploy lại digest cũ; rollback DB bằng migration bù trừ hoặc restore có kiểm soát, không dựa vào {{flyway clean}}.

### Bảo mật và tái lập
- Secret lấy từ vault/OIDC ngắn hạn, không nằm trong repo hay image.
- Pin JDK (17 hoặc 21), Maven/Gradle wrapper, plugin version; bật {{maven-enforcer-plugin}} để chặn dependency trùng hoặc không mong muốn.
- Image chạy non-root, đọc từ registry nội bộ, quét CVE trước khi promote.
- SBOM (CycloneDX) và chữ ký image giúp trả lời "image này có gì" khi có CVE mới.

### Lỗi hay gặp
- Dùng tag {{latest}}: không biết prod đang chạy bản nào, rollback không chính xác.
- Chạy migration trong lúc app khởi động với 10 replica: Flyway lock làm 9 Pod chờ, readiness fail, deploy kéo dài.
- Test chỉ dùng H2: SQL PostgreSQL chạy được trên H2 không có nghĩa là chạy được trên PostgreSQL.

### Trả lời miệng 1 phút
Pipeline của tôi đi từ rẻ tới đắt: compile và checkstyle, unit test, integration test với Testcontainers, SAST và quét dependency, rồi build image, quét image. Các stage này chặn merge vì chúng rẻ và bắt được phần lớn lỗi. Image chỉ build một lần, tag theo commit SHA, registry bật immutable tag, rồi promote đúng digest đó qua DEV, SIT và PROD; mỗi môi trường chỉ khác cấu hình. Nếu rebuild cho từng môi trường thì không chứng minh được thứ chạy prod là thứ đã test. Migration DB tôi chạy bằng Job hoặc initContainer riêng trước khi rollout, không để mỗi Pod tự migrate, và migration phải tương thích ngược vì lúc rolling hai version chạy cùng nhau. Trade-off là thêm stage thì chậm, nên tôi cache .m2, chia shard test, đặt timeout cho job, và giữ pipeline dưới 15 phút. Test flaky phải sửa trong ngày, không cho retry vô hạn.

> Senior tip: Mục tiêu thực tế là pipeline dưới 15 phút từ push tới môi trường dev, và mọi gate trên merge request phải tái lập được trên máy dev bằng một lệnh. Đo lead time và tỷ lệ pipeline đỏ; nếu pipeline đỏ vì test flaky, sửa test ngay trong ngày thay vì cho retry vô hạn, vì retry vô hạn dạy cả team bỏ qua tín hiệu.`,
    follow: [
      'Bạn đặt quality gate nào cho dependency scan mà không làm pipeline chậm và hay fail vặt?',
      'Làm sao đảm bảo image chạy ở prod đúng là image đã test ở SIT?',
      'Migration DB nên chạy trước hay sau khi deploy app? Vì sao?'
    ],
    tags: ['CI/CD', 'Pipeline', 'Testcontainers', 'Flyway', 'Artifact']
  },
  {
    id: 'devops-021',
    topic: 'devops',
    level: 'senior',
    q: 'Deploy cuốn chiếu không downtime nhưng migration DB làm rollback app thất bại. Bạn thiết kế migration theo expand-contract với Flyway thế nào, và rollback DB ra sao khi Flyway Community không có undo?',
    a: `**Tóm tắt:** Flyway Community không có undo trong production (undo thuộc bản Teams/Enterprise), và rollback DB thường không thể vì dữ liệu đã ghi. Cách đúng là thiết kế migration theo **expand-contract**: thêm cấu trúc mới tương thích ngược, dual-write và backfill, chuyển đọc, rồi mới xoá cấu trúc cũ sau vài release. Khi cần quay lui, rollback app là đủ; DB đi tiếp bằng migration bù trừ, chỉ restore snapshot khi thật sự mất dữ liệu.

### Hiểu nhanh
Đổi schema giống đổi tên một con đường đang có xe chạy. Bạn không thể tháo biển cũ ngay vì tài xế dùng bản đồ cũ (app version cũ) vẫn tìm đường theo tên cũ. Cách an toàn là dựng thêm biển mới bên cạnh (expand), cập nhật để mọi chỉ dẫn ghi cả hai tên (dual-write, backfill), đợi mọi tài xế dùng bản đồ mới (switch), rồi mới gỡ biển cũ (contract). Nếu phải quay lui, chỉ cần cho tài xế dùng lại bản đồ cũ, vì biển cũ vẫn còn nguyên.

### Thuật ngữ
- **Expand-contract**: chia một thay đổi schema phá vỡ thành nhiều bước nhỏ tương thích ngược.
- **Dual-write**: app ghi cùng dữ liệu vào cả cấu trúc cũ và mới trong giai đoạn chuyển tiếp.
- **Backfill**: job nền chép dữ liệu cũ sang cấu trúc mới theo lô nhỏ.
- **Forward-fix**: sửa lỗi bằng một migration mới thay vì quay ngược migration cũ.
- **PITR (Point-in-time recovery)**: khôi phục DB về một thời điểm từ backup cộng WAL; mất mọi dữ liệu ghi sau thời điểm đó.
- **Checksum (Flyway)**: mã băm của file migration; sửa file đã chạy làm validate fail.
- **Advisory lock**: khoá cấp ứng dụng của PostgreSQL, Flyway dùng để chỉ một tiến trình migrate tại một thời điểm.
- **CREATE INDEX CONCURRENTLY**: tạo index PostgreSQL không chặn ghi, nhưng không được chạy trong transaction.

### Vì sao rollback DB khó
- {{DROP COLUMN}}, {{RENAME}}, đổi kiểu dữ liệu không thể hoàn tác dữ liệu đã mất.
- Trong rolling deploy, version cũ và mới chạy **cùng lúc**; schema phải phục vụ cả hai.
- Flyway đánh dấu migration đã áp dụng bằng checksum; sửa file cũ làm {{flyway validate}} fail. Không được sửa migration đã chạy.
- Backup/PITR là lưới an toàn cuối cùng, không phải quy trình rollback thường ngày: mất dữ liệu phát sinh sau thời điểm backup.

### Năm pha expand-contract
| Pha | Việc làm | Version app |
|---|---|---|
| Expand | Thêm cột/table/index mới, cho phép NULL | App cũ vẫn chạy |
| Dual-write | App mới ghi cả cột cũ và mới, đọc cột cũ | App mới |
| Backfill | Job nền copy dữ liệu cũ sang mới theo lô | App mới |
| Switch | App đọc cột mới; giữ ghi cả hai | App mới |
| Contract | Xoá cột cũ sau khi không còn version nào đọc | Sau 1–2 release |

~~~sql
-- V10: expand, chỉ thêm, không đổi cột cũ
ALTER TABLE payment ADD COLUMN status_new varchar(20);
CREATE INDEX CONCURRENTLY idx_payment_status_new ON payment(status_new);

-- Job backfill chạy ngoài Flyway, theo lô và idempotent
UPDATE payment
SET status_new = status
WHERE status_new IS NULL
  AND id BETWEEN :from_id AND :to_id;
~~~
- {{CREATE INDEX CONCURRENTLY}} không được chạy trong transaction. Flyway tự nhận diện lệnh này (PostgreSQLParser) và tự chạy migration đó ngoài transaction; nếu phiên bản cũ chưa làm vậy, ép bằng script config {{executeInTransaction=false}} đi kèm. Mặc định Flyway dùng advisory lock kiểu transactional trên PostgreSQL, dễ gây treo quanh loại lệnh như vậy: đặt {{flyway.postgresql.transactional.lock=false}} để chuyển sang lock cấp session.
- Backfill theo lô 1.000–10.000 dòng, nghỉ giữa các lô, theo dõi replication lag và lock wait. UPDATE toàn bảng 50 triệu dòng sẽ giữ lock lâu và bloat WAL.
- Với PostgreSQL, thêm cột có default không volatile thường nhanh từ bản 11; thêm {{NOT NULL}} vẫn cần kiểm tra toàn bảng. Dùng {{CHECK ... NOT VALID}} rồi {{VALIDATE CONSTRAINT}} để tránh lock dài.

### Flyway trong pipeline
- Đặt tên {{V<version>__mô_tả.sql}}; không sửa file đã áp dụng.
- Chạy {{flyway validate}} trong CI, {{flyway info}} trước khi deploy; đặt {{cleanDisabled=true}}.
- Chạy migration bằng Job/initContainer riêng, không để mỗi Pod tự chạy. Nếu app tự chạy, đặt {{spring.flyway.enabled=false}} khi Job đã lo.
- Đặt {{lock_timeout}} và {{statement_timeout}} cho session migration để một lệnh sai không khoá bảng vô hạn.

### Khi buộc phải quay lui
- **App rollback**: deploy lại digest cũ. Với expand-contract, version cũ vẫn đọc được schema mới.
- **DB forward-fix**: viết migration mới sửa sai. Cách này nhanh hơn restore.
- **Restore/PITR**: chỉ khi mất dữ liệu nghiêm trọng; chấp nhận mất cửa sổ dữ liệu sau backup, cần dừng ghi và thông báo.
- Không dùng {{flyway clean}} trên prod: nó xoá sạch schema.

### Kiểm thử migration
- Chạy trên bản snapshot có kích thước và phân bố dữ liệu giống prod, đo thời gian lock và thời gian chạy.
- Theo dõi lock trong lúc migrate qua {{pg_locks}} và {{pg_stat_activity}}; alert khi có lock chờ quá ngưỡng.

### Lỗi hay gặp
- Backfill chạy trong một transaction khổng lồ: WAL phình, autovacuum không theo kịp, DB chậm toàn hệ thống.
- Thêm index thường trên bảng lớn trong giờ cao điểm: lock ghi, timeout hàng loạt.
- Sửa migration đã áp dụng để "sửa nhanh": checksum mismatch, pipeline dừng, hoặc tệ hơn là môi trường lệch nhau.

### Trả lời miệng 1 phút
Rollback DB gần như không thể vì dữ liệu đã ghi, và Flyway Community không có undo, nên tôi thiết kế để không cần rollback DB. Mỗi thay đổi phá vỡ được chia theo expand-contract: expand thêm cột hoặc bảng mới cho phép null; release sau app dual-write cả cũ và mới; job backfill chép dữ liệu cũ theo lô nhỏ; rồi switch sang đọc cột mới; chỉ contract, tức xoá cột cũ, sau một hai release khi không còn version nào đọc nó. Nhờ vậy rollback app chỉ là deploy lại digest cũ, vì version cũ vẫn chạy được trên schema mới. Khi migration sai, tôi forward-fix bằng migration mới; restore hay PITR chỉ dùng khi mất dữ liệu nghiêm trọng vì sẽ mất cửa sổ dữ liệu sau backup. Trade-off là một thay đổi kéo dài nhiều release. Tôi luôn chạy migration trên snapshot cỡ prod, đặt lock_timeout và không bao giờ sửa file migration đã áp dụng.

> Senior tip: Hãy coi mỗi migration là một API công khai giữa các version app. Tôi luôn yêu cầu migration chạy trên snapshot prod trong staging, có số đo thời gian lock và kế hoạch forward-fix trước khi deploy. Một migration "chỉ mất 2 giây" trên bảng 100.000 dòng có thể mất 20 phút trên 100 triệu dòng.`,
    follow: [
      'Bạn dual-write và backfill thế nào để không tăng tải DB trong giờ cao điểm?',
      'Vì sao không nên dùng flyway undo dù có bản Teams? Khi nào restore là lựa chọn đúng?',
      'Làm sao chạy migration an toàn khi có 20 Pod cùng khởi động?'
    ],
    tags: ['Flyway', 'Database migration', 'Expand-contract', 'PostgreSQL', 'Rollback']
  },
  {
    id: 'devops-022',
    topic: 'devops',
    level: 'lead',
    q: 'Bạn thiết kế observability cho 20 microservice Spring Boot: metrics, distributed tracing và log tương quan. Micrometer, Micrometer Tracing/OpenTelemetry và OTel Collector chia việc thế nào, cấu hình ra sao, và bẫy nào làm chi phí tăng vọt?',
    a: `**Tóm tắt:** Observability không phải cài thật nhiều tool, mà là trả lời được "hệ thống đang làm gì và vì sao" từ tín hiệu đủ tốt. Với Spring Boot, Micrometer là facade cho metric, Micrometer Tracing/OpenTelemetry lo trace, log JSON có traceId/spanId để nối ba trụ cột. Ở quy mô 20 service, chi phí và cardinality mới là ràng buộc chính, nên phải chuẩn hoá qua một starter chung và lọc tại OTel Collector.

### Hiểu nhanh
Ba tín hiệu giống ba công cụ của bác sĩ. Metric là máy đo nhịp tim, huyết áp: con số theo thời gian, rẻ, dùng để báo động sớm. Trace là bản ghi đường đi của một lượt khám qua từng khoa, cho biết chậm ở khoa nào. Log là ghi chép chi tiết của từng khoa. traceId là mã bệnh nhân nối ba thứ lại với nhau; OTel Collector giống phòng tiếp nhận hồ sơ trung tâm: gom, lọc, che thông tin nhạy cảm rồi chuyển tới đúng kho, để từng khoa không phải tự gửi đi khắp nơi.

### Thuật ngữ
- **Micrometer**: facade metric của Spring Boot, giống SLF4J nhưng cho metric; xuất sang Prometheus và nhiều backend khác.
- **Micrometer Tracing**: lớp tracing của Spring Boot 3, bridge sang OpenTelemetry hoặc Brave, tự đưa traceId vào MDC.
- **OpenTelemetry / OTLP**: chuẩn mở về thu thập telemetry và giao thức truyền dữ liệu của nó.
- **OTel Collector**: tiến trình nhận, xử lý (batch, lọc, sampling) và chuyển tiếp telemetry tới backend.
- **Span**: một đoạn công việc trong trace (một HTTP call, một câu SQL) có thời điểm bắt đầu và kết thúc.
- **Head / tail sampling**: quyết định giữ trace ngay từ đầu request, hoặc sau khi trace kết thúc (giữ được trace lỗi, chậm).
- **Cardinality**: số tổ hợp giá trị tag khác nhau; mỗi tổ hợp là một time series tốn tiền lưu trữ.
- **SLO / error budget**: mục tiêu chất lượng dịch vụ và phần lỗi được phép trong một khoảng thời gian.

### Kiến trúc tham chiếu
~~~text
Spring Boot
  metrics -> /actuator/prometheus <- Prometheus -> Mimir/Thanos
  traces  -> OTLP -> OTel Collector (batch, tail sampling) -> Tempo/Jaeger
  logs    -> stdout JSON -> Fluent Bit/Alloy -> Loki/ELK
                traceId, spanId nằm trong MDC để nối ba tín hiệu
~~~
- Metric: {{micrometer-registry-prometheus}} + Actuator; endpoint chỉ mở nội bộ.
- Trace: {{micrometer-tracing-bridge-otel}} + {{opentelemetry-exporter-otlp}}, hoặc OTel Java agent. Không bật cả hai cho cùng một ứng dụng nếu không kiểm soát, tránh span trùng.
- Log: JSON encoder, traceId/spanId tự động trong MDC nhờ Micrometer Tracing; log aggregation gắn nhãn {{service.name}}, {{environment}}, {{version}}.

### Metric: ít nhưng đúng
- Bật histogram cho HTTP để tính percentile và SLO, ví dụ {{management.metrics.distribution.percentiles-histogram.http.server.requests=true}} và các bucket quanh 100/300/500/1000 ms.
- Dùng tag có cardinality thấp: {{service}}, {{method}}, {{uri}} đã template hoá, {{status}}. **Không** gắn {{userId}}, {{accountId}}, {{requestId}} hay raw path vào metric.
- Kiểm soát bằng {{MeterFilter}}: giới hạn số meter, deny tag nguy hiểm, đổi tên metric theo chuẩn.
- Metric nghiệp vụ quan trọng hơn metric hạ tầng: số giao dịch thành công, số giao dịch chờ, tỷ lệ lỗi theo kênh. Đặt tên và đơn vị rõ ràng.

### Trace: nối các service
- Lan truyền {{traceparent}} (W3C) qua HTTP header, Kafka header, message, và client DB nếu được hỗ trợ.
- Đặt tên span theo nghiệp vụ ở biên (ví dụ {{POST /payments}}) và giữ span con cho DB, HTTP client, cache.
- Sampling: head-based 5–10% ở production; lỗi và request chậm nên được giữ 100% bằng tail sampling tại Collector.
- Collector chịu trách nhiệm batch, retry, memory limiter, redact dữ liệu nhạy cảm, và routing theo môi trường. Đừng để mỗi app tự gửi thẳng tới vendor.
- Với async/CompletableFuture/virtual thread, context có thể mất; kiểm tra span bị đứt và bổ sung propagation.

### Log tương quan
- Log JSON có {{timestamp}}, {{level}}, {{service}}, {{traceId}}, {{spanId}}, {{message}}; không log số thẻ, CCCD, token, mật khẩu.
- Log lỗi phải kèm context đủ để tái hiện: mã giao dịch, mã lỗi nghiệp vụ, không kèm toàn bộ payload.

### SLO, alert và chi phí
- Chọn 2–4 SLI cho mỗi service: availability, latency p99, tỷ lệ lỗi nghiệp vụ. Đặt SLO và error budget; alert theo burn rate thay vì alert từng lần lỗi.
- Dashboard chuẩn: RED cho API (rate, errors, duration), USE cho hạ tầng (utilization, saturation, errors), và một dashboard nghiệp vụ.
- Cardinality là chi phí số một: mỗi tổ hợp tag là một time series. Một tag {{userId}} có thể nhân số series lên hàng triệu.
- Trace và log cũng tốn tiền: tail sampling, giới hạn attribute, lọc log debug tại Collector, không gửi span của health check.
- Đo chi phí theo service và theo team; tối ưu trước khi tăng hạn mức.

### Lỗi hay gặp
- Dùng {{http_server_requests_seconds_count}} với tag URI chứa ID thật: cardinality nổ, Prometheus OOM.
- Bật OTel agent và Micrometer Tracing cùng lúc: span trùng, trace không liền mạch.
- Log không có traceId vì dùng async appender hoặc thread pool tự tạo làm mất MDC.
- Trace sampling 100% ở production: chi phí tăng gấp nhiều lần, exporter nghẽn.

### Trả lời miệng 1 phút
Tôi chia việc rõ ràng: Micrometer là facade cho metric, Actuator phơi /actuator/prometheus để Prometheus scrape; Micrometer Tracing với bridge OpenTelemetry tạo traceId, spanId, đưa vào MDC và truyền qua header traceparent, gửi span bằng OTLP tới OTel Collector; log JSON ra stdout có traceId để nối với trace. Collector làm batch, retry, memory limiter, che dữ liệu nhạy cảm và tail sampling để giữ trace lỗi, chậm mà vẫn chỉ lấy mẫu 5–10% phần còn lại. Bẫy chi phí lớn nhất là cardinality: tag userId hay URI chứa ID thật có thể làm Prometheus OOM, nên tôi chặn bằng MeterFilter. Bẫy khác là bật cả OTel Java agent và Micrometer Tracing gây span trùng, và sampling 100% ở prod. Tôi bắt đầu từ SLO và ba dashboard RED, USE, nghiệp vụ, alert theo burn rate, và chuẩn hoá mọi thứ trong một starter nội bộ cho 20 service.

> Senior tip: Bắt đầu từ SLO và ba dashboard, rồi mới chọn tool. Chuẩn hoá bằng một starter nội bộ (metric naming, log format, trace propagation, tag bắt buộc) để 20 service không mỗi nơi một kiểu. Mỗi quý rà lại top metric theo cardinality và top log theo volume; cắt 20% tín hiệu ít dùng thường không làm mất khả năng điều tra mà giảm hoá đơn rõ rệt.`,
    follow: [
      'Cardinality của metric HTTP tăng vọt vì path chứa ID: bạn sửa ở app hay ở Prometheus?',
      'Tail sampling ở OTel Collector hoạt động thế nào và vì sao cần cho trace lỗi?',
      'Làm sao giữ traceId xuyên qua Kafka và thread pool để log tương quan đúng?'
    ],
    tags: ['Observability', 'Micrometer', 'OpenTelemetry', 'Tracing', 'SLO']
  },
  {
    id: 'devops-023',
    topic: 'devops',
    level: 'mid',
    q: 'Dev mới vào team mất 2 ngày để cài PostgreSQL, Redis, Kafka trên máy mới chạy được service. Bạn dựng môi trường dev bằng Docker Compose thế nào: file compose gồm gì, làm sao app chỉ khởi động khi DB đã sẵn sàng, dữ liệu có mất khi tắt máy không, và Spring Boot hỗ trợ gì?',
    a: `**Tóm tắt:** Viết một file {{compose.yaml}} trong repo khai báo các **service** phụ thuộc (postgres, redis, kafka) với image có version cố định, cổng, biến môi trường, **healthcheck**, và **named volume** để giữ dữ liệu. Dùng {{depends_on}} với {{condition: service_healthy}} để thứ tự khởi động dựa trên trạng thái "sẵn sàng" chứ không chỉ "đã chạy". Một lệnh {{docker compose up -d}} là xong. Từ Spring Boot 3.1, module {{spring-boot-docker-compose}} còn tự chạy compose khi start app và tự cấu hình datasource.

### Hiểu nhanh
Compose giống **tờ thực đơn đặt bàn tiệc**: thay vì gọi từng món (cài tay từng phần mềm, mỗi máy một kiểu), bạn đưa một tờ ghi đủ "1 PostgreSQL 16, 1 Redis 7, 1 Kafka", nhà bếp (Docker) dọn đúng như nhau cho mọi người. **Healthcheck** là người phục vụ kiểm tra món đã chín chưa trước khi mời khách ăn. **Volume** là tủ lạnh: tắt bếp (dừng container) thì đồ ăn vẫn còn trong tủ.

### Thuật ngữ
- **Service (trong Compose)**: một container được khai báo trong file, có tên — tên này cũng là **hostname** để các container khác gọi tới.
- **Healthcheck**: lệnh Docker chạy định kỳ trong container để biết nó đã sẵn sàng phục vụ chưa (ví dụ {{pg_isready}}).
- **depends_on + condition**: thứ tự khởi động; {{service_started}} chỉ đợi container chạy, {{service_healthy}} đợi healthcheck báo healthy.
- **Named volume**: vùng lưu dữ liệu do Docker quản lý, tồn tại độc lập với container.
- **Compose profiles**: nhóm service tuỳ chọn, chỉ bật khi cần ({{--profile kafka}}).
- **.env**: file biến môi trường Compose tự đọc khi chạy, để không hard-code mật khẩu trong file compose.

### Cơ chế từng bước
1. Dev clone repo, chạy {{docker compose up -d}}. Compose đọc {{compose.yaml}}, tạo một **network riêng** cho project, kéo image nếu chưa có.
2. Tạo container postgres, redis; healthcheck bắt đầu chạy. Vì sao cần healthcheck: PostgreSQL cần vài giây khởi tạo; container "đang chạy" chưa có nghĩa là nhận kết nối được.
3. Service nào khai báo {{depends_on: postgres: condition: service_healthy}} sẽ chờ tới khi postgres healthy mới được tạo.
4. App chạy trên máy (IDE) kết nối {{localhost:5432}} nhờ cổng được publish; container khác trong cùng compose kết nối bằng tên service {{postgres:5432}}.
5. {{docker compose down}} xoá container và network nhưng **giữ named volume** → lần sau dữ liệu vẫn còn. {{docker compose down -v}} mới xoá volume (reset sạch dữ liệu).

### File compose ví dụ
~~~yaml
services:
  postgres:
    image: postgres:16.4             # version cố định, không dùng latest
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devpass     # chỉ dùng cho máy dev
    ports: ["5432:5432"]             # host:container, để app chạy trong IDE kết nối
    volumes: ["pgdata:/var/lib/postgresql/data"]   # dữ liệu sống qua lần down/up
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      retries: 10
  redis:
    image: redis:7.4
    ports: ["6379:6379"]
  orders-api:                        # tuỳ chọn: chạy cả app trong container
    build: .
    profiles: ["full"]               # chỉ chạy khi: docker compose --profile full up
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orders   # tên service, không phải localhost
    depends_on:
      postgres:
        condition: service_healthy   # đợi DB sẵn sàng thật sự
volumes:
  pgdata:
~~~

### Spring Boot hỗ trợ gì
Thêm dependency {{spring-boot-docker-compose}} (scope chỉ cho dev, ví dụ Maven {{optional}} hoặc Gradle {{developmentOnly}}). Khi bạn chạy app, Spring Boot tìm {{compose.yaml}}, chạy {{docker compose up}}, đợi container sẵn sàng, rồi tự tạo **ServiceConnection** cho các image nó nhận ra (PostgreSQL, Redis, Kafka…) — bạn không cần khai {{spring.datasource.url}} cho máy dev. Module này mặc định bị tắt khi chạy test.

### So sánh cách dựng môi trường dev
| Cách | Ưu | Nhược |
|---|---|---|
| Cài tay trên máy | Không cần Docker | Mỗi máy một version, mất hàng giờ, khó reset |
| Docker Compose | Một lệnh, giống nhau mọi máy, reset dễ | Cần Docker Desktop/Engine, tốn RAM |
| Testcontainers (cho test) | Container sống theo vòng đời test, cô lập | Không dùng để chạy app hằng ngày |
| DB dev dùng chung trên server | Không tốn RAM máy | Dev đè dữ liệu của nhau, phụ thuộc mạng |

### Lỗi hay gặp
- **Dùng {{depends_on}} không có condition.** Triệu chứng: app khởi động lỗi "Connection refused" ngẫu nhiên vì DB chưa sẵn sàng. Cách tránh: healthcheck + {{service_healthy}}; app vẫn nên có retry khi kết nối.
- **App trong container gọi {{localhost:5432}}.** Triệu chứng: Connection refused. Trong container, localhost là chính container app. Cách tránh: dùng tên service {{postgres}}.
- **Image {{latest}}.** Triệu chứng: hôm nay chạy được, mai lỗi vì image mới lên major version. Cách tránh: ghim version, cập nhật có chủ đích.
- **Tưởng {{down}} xoá dữ liệu** hoặc ngược lại, chạy {{down -v}} rồi mất dữ liệu test đã chuẩn bị. Cách tránh: hiểu volume; có script seed dữ liệu.
- **Mật khẩu thật trong compose commit lên Git.** Cách tránh: file compose chỉ dành cho dev với mật khẩu giả; giá trị nhạy cảm để trong {{.env}} không commit.
- **Kafka cấu hình listener sai.** Triệu chứng: app trên máy kết nối được bootstrap nhưng sau đó treo vì broker quảng bá địa chỉ nội bộ container. Cách tránh: cấu hình advertised listeners riêng cho truy cập từ host và từ trong network.

### Trả lời miệng 1 phút
"Tôi đặt một file compose.yaml trong repo, khai báo PostgreSQL, Redis, Kafka với version cố định, cổng publish cho app chạy trong IDE, named volume để dữ liệu còn sau khi down, và healthcheck cho từng dịch vụ. Service nào phụ thuộc DB thì depends_on với condition service_healthy để đợi DB sẵn sàng thật chứ không chỉ container chạy. Trong cùng compose, container gọi nhau bằng tên service chứ không phải localhost. Từ Spring Boot 3.1, tôi thêm spring-boot-docker-compose để app tự chạy compose và tự cấu hình kết nối. Kết quả: dev mới chỉ cần clone và chạy một lệnh, và reset sạch bằng down -v."

> Senior tip: hãy coi {{compose.yaml}} là **tài liệu sống** của hệ thống — dev mới đọc nó để biết service cần những gì. Đặt mục tiêu "clone tới chạy được trong 15 phút" và đo lại mỗi quý bằng một máy sạch. Với máy dev RAM 16 GB, Kafka + vài DB đã ăn 3–4 GB; dùng profiles để chỉ bật thứ thật sự cần cho task đang làm.`,
    follow: [
      'Khi nào dùng Testcontainers thay vì Docker Compose cho test tích hợp?',
      'Kafka trong compose: advertised listeners cần cấu hình thế nào để cả app trên máy và container khác đều kết nối được?',
      'Làm sao seed dữ liệu mẫu cho PostgreSQL khi khởi tạo lần đầu?'
    ],
    tags: ['Docker Compose', 'dev environment', 'healthcheck', 'volume', 'Spring Boot']
  },
  {
    id: 'devops-024',
    topic: 'devops',
    level: 'mid',
    q: 'Bạn chạy service Spring Boot trong Docker và gặp ba lỗi: app báo không kết nối được PostgreSQL ở localhost:5432 (dù DB đang chạy trên máy), mở trình duyệt localhost:8080 không vào được app, và mỗi lần xoá container thì mất file upload. Giải thích mạng và lưu trữ của Docker để sửa cả ba.',
    a: `**Tóm tắt:** Mỗi container có **network namespace riêng**: {{localhost}} bên trong container là chính container đó, không phải máy host. Muốn gọi ra host dùng {{host.docker.internal}} (Docker Desktop; trên Linux thêm {{--add-host=host.docker.internal:host-gateway}}), hoặc tốt hơn là cho DB và app vào **cùng một user-defined network** rồi gọi bằng tên container. Muốn từ host vào app phải **publish cổng** {{-p 8080:8080}} và app phải lắng nghe {{0.0.0.0}}. Dữ liệu ghi trong **lớp ghi của container** mất khi xoá container — phải dùng **volume** hoặc **bind mount**.

### Hiểu nhanh
Mỗi container giống **một căn hộ trong chung cư**: có địa chỉ nội bộ riêng, "nhà tôi" (localhost) là căn hộ của chính nó, không phải nhà ban quản lý (host). **Publish cổng** giống đặt chuông ở cổng chung cư nối thẳng vào căn hộ: khách bên ngoài bấm số 8080 thì chuông kêu trong căn hộ. **User-defined network** giống chung cư có danh bạ nội bộ: gọi "postgres" là tới đúng căn. **Lớp ghi của container** giống đồ đạc trong phòng thuê — trả phòng (xoá container) là dọn sạch; **volume** là kho gửi đồ riêng, đổi phòng vẫn còn.

### Thuật ngữ
- **Network namespace**: ngăn xếp mạng riêng (IP, cổng, localhost) của mỗi container.
- **Bridge network**: mạng ảo mặc định trên host nối các container. Mạng {{bridge}} mặc định **không** phân giải tên container; **user-defined bridge** (tự tạo, hoặc do Compose tạo) có DNS nội bộ theo tên.
- **Publish port** ({{-p HOST:CONTAINER}}): ánh xạ cổng trên host vào cổng trong container. {{EXPOSE}} trong Dockerfile chỉ là tài liệu, **không** tự publish.
- **Writable layer**: lớp ghi mỏng trên image của mỗi container; xoá container là mất.
- **Volume**: thư mục do Docker quản lý (nằm trong vùng dữ liệu của Docker), bền qua vòng đời container.
- **Bind mount**: gắn một thư mục cụ thể của host vào container ({{-v /data/uploads:/app/uploads}}).

### Cơ chế từng bước: sửa từng lỗi
1. **App → DB "localhost:5432" lỗi.** App trong container gọi localhost tức là gọi chính nó, nơi không có PostgreSQL. Sửa: tạo network {{docker network create backend}}, chạy cả hai container với {{--network backend}}, đặt {{SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/orders}}. Nếu DB chạy trực tiếp trên host: dùng {{host.docker.internal}}.
2. **Host → app "localhost:8080" không vào được.** Nguyên nhân thường gặp: quên {{-p 8080:8080}}, hoặc publish nhầm thứ tự ({{-p 8080:80}} trong khi app nghe 8080), hoặc app chỉ bind {{127.0.0.1}} bên trong container. Spring Boot mặc định nghe mọi interface nên thường chỉ là thiếu {{-p}}.
3. **Mất file upload.** App ghi vào {{/app/uploads}} nằm trong writable layer. Sửa: {{-v uploads:/app/uploads}} (named volume) hoặc bind mount. Production thì tốt nhất lưu file ở object storage (S3), không lưu trên đĩa container.

~~~text
Host (máy bạn)                     user-defined network "backend"
 localhost:8080 ──-p 8080:8080──►  [orders-api 172.18.0.3]
                                        │  jdbc:postgresql://postgres:5432
                                        ▼
                                   [postgres  172.18.0.2]
                                        │ volume pgdata → /var/lib/postgresql/data
 Trong orders-api: localhost = chính orders-api, KHÔNG phải host
~~~

### Lệnh minh hoạ
~~~bash
docker network create backend
docker volume create uploads
docker run -d --name postgres --network backend -e POSTGRES_PASSWORD=dev postgres:16.4
docker run -d --name orders-api --network backend \\
  -p 8080:8080 \\
  -v uploads:/app/uploads \\
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/postgres \\
  orders-api:1.4.2
# Kiểm tra: tên có phân giải trong network không
docker exec orders-api getent hosts postgres
~~~

### Volume hay bind mount
| Tiêu chí | Named volume | Bind mount |
|---|---|---|
| Ai quản lý đường dẫn | Docker | Bạn chọn thư mục host |
| Quyền file | Docker khởi tạo theo nội dung image | Theo quyền thư mục host, hay lỗi khi container chạy non-root |
| Hiệu năng trên Mac/Windows | Tốt | Chậm hơn với nhiều file nhỏ |
| Dùng khi | Dữ liệu DB, dữ liệu app | Mount source code khi dev, file cấu hình |

### Lỗi hay gặp
- **Dùng mạng bridge mặc định rồi gọi theo tên.** Triệu chứng: {{UnknownHostException: postgres}}. Cách tránh: user-defined network hoặc Compose.
- **Tưởng {{EXPOSE 8080}} là đủ.** Không publish thì host không vào được.
- **Ghi log/file quan trọng vào container.** Mất khi container bị thay. Log ghi ra stdout; file ghi ra volume hoặc object storage.
- **Bind mount và container chạy non-root.** Triệu chứng: {{AccessDeniedException}} khi ghi. Cách tránh: chỉnh quyền/UID thư mục host, hoặc dùng named volume.
- **Publish cổng DB ra {{0.0.0.0}} trên server.** Triệu chứng: DB lộ ra Internet. Cách tránh: chỉ publish {{127.0.0.1:5432:5432}} hoặc không publish, để container gọi nhau trong network.

### Trả lời miệng 1 phút
"Mỗi container có network namespace riêng nên localhost bên trong là chính container, không phải host. Để app gọi DB, tôi cho cả hai vào cùng user-defined network rồi gọi bằng tên container; mạng bridge mặc định không có DNS theo tên. Nếu DB nằm trên host thì dùng host.docker.internal. Để từ host vào app phải publish cổng với -p host:container; EXPOSE chỉ là tài liệu. Còn dữ liệu, mọi thứ ghi vào writable layer sẽ mất khi xoá container, nên tôi dùng named volume cho dữ liệu cần giữ, bind mount khi cần map thư mục cụ thể, và production thì lưu file lên object storage."

> Senior tip: khi debug mạng container, **vào trong container mà thử** ({{docker exec -it orders-api sh}}, rồi {{getent hosts postgres}}, {{nc -zv postgres 5432}}) thay vì đoán từ host — đa số lỗi là nhầm "đang đứng ở đâu". Và trên server, kiểm tra kỹ cổng publish: Docker tự thêm rule iptables nên cổng publish có thể vượt qua firewall kiểu ufw mà bạn tưởng đã chặn.`,
    follow: [
      'Vì sao cổng Docker publish có thể vượt qua firewall ufw trên Linux?',
      'Network mode host khác bridge thế nào, khi nào dùng?',
      'Trên Kubernetes, khái niệm tương đương volume là gì và vì sao Pod không nên lưu file upload trên đĩa?'
    ],
    tags: ['Docker', 'networking', 'volume', 'bind mount', 'port mapping']
  },
  {
    id: 'devops-025',
    topic: 'devops',
    level: 'mid',
    q: 'Cùng một image Spring Boot phải chạy ở DEV, UAT, PROD trên Kubernetes với URL database, feature flag và mật khẩu khác nhau. Bạn đưa cấu hình từ ConfigMap và Secret vào Spring thế nào (biến môi trường hay file), thứ tự ưu tiên ra sao, và sửa ConfigMap xong thì app có tự nhận không?',
    a: `**Tóm tắt:** Image **không chứa** cấu hình riêng của môi trường. Giá trị thường (URL, flag) để trong **ConfigMap**, giá trị nhạy cảm trong **Secret**; đưa vào Pod theo hai cách: **biến môi trường** (Spring tự map {{SPRING_DATASOURCE_URL}} → {{spring.datasource.url}} nhờ relaxed binding) hoặc **mount thành file** rồi đọc bằng {{spring.config.import=optional:configtree:/etc/secrets/}}. Biến môi trường có độ ưu tiên cao hơn {{application.yml}} trong jar. Sửa ConfigMap thì biến môi trường **không đổi** tới khi Pod restart; file mount được kubelet cập nhật sau một lúc nhưng app phải tự reload — cách an toàn là **rollout restart** có kiểm soát.

### Hiểu nhanh
Image giống **một chiếc xe xuất xưởng**: giống hệt nhau cho mọi khách. ConfigMap/Secret là **bộ chìa khoá và giấy tờ theo từng khách** giao kèm khi bàn giao xe. Biến môi trường giống dán thông tin lên táp-lô lúc nổ máy — muốn đổi phải tắt máy mở lại. Mount file giống để giấy tờ trong hộc xe — có thể thay giấy trong hộc, nhưng tài xế (app) phải tự mở hộc ra đọc lại mới biết.

### Thuật ngữ
- **ConfigMap**: object Kubernetes lưu cặp key–value không nhạy cảm.
- **Secret**: giống ConfigMap nhưng dành cho dữ liệu nhạy cảm; mặc định chỉ **mã hoá base64** (không phải mã hoá bảo mật) — cần bật encryption at rest cho etcd và RBAC chặt.
- **envFrom / valueFrom**: nạp toàn bộ hoặc từng key thành biến môi trường của container.
- **Relaxed binding**: Spring map biến môi trường viết HOA, gạch dưới sang property: {{SPRING_DATASOURCE_URL}} → {{spring.datasource.url}}.
- **configtree**: nguồn cấu hình Spring Boot đọc **mỗi file là một property**: tên file là key, nội dung file là value.
- **Profile**: bộ cấu hình theo môi trường ({{application-prod.yml}}), bật bằng {{SPRING_PROFILES_ACTIVE}}.

### Cơ chế từng bước
1. Tạo ConfigMap {{orders-config}} (DB URL, flag) và Secret {{orders-secret}} (mật khẩu DB) **riêng từng namespace/môi trường**.
2. Deployment khai báo {{envFrom}} cho ConfigMap → container có biến {{SPRING_DATASOURCE_URL}}, {{FEATURE_NEW_CHECKOUT}}.
3. Secret được mount thành thư mục {{/etc/secrets}}, mỗi key một file: {{/etc/secrets/spring.datasource.password}}. Vì sao thích file hơn env cho secret: biến môi trường dễ lộ qua {{/proc}}, crash dump, log in ra env, và các process con thừa hưởng.
4. App khởi động với {{spring.config.import=optional:configtree:/etc/secrets/}} → Spring đọc file thành property {{spring.datasource.password}}.
5. Spring gộp các nguồn theo thứ tự ưu tiên: tham số dòng lệnh > biến môi trường > file config ngoài jar > {{application-<profile>.yml}} trong jar > {{application.yml}} trong jar.
6. Đổi ConfigMap: biến môi trường không đổi; file mount (không dùng {{subPath}}) được cập nhật sau khoảng thời gian đồng bộ của kubelet (thường dưới vài phút). Muốn áp dụng an toàn: {{kubectl rollout restart deployment/orders-api}} để Pod mới lên dần, có readiness kiểm tra.

### Manifest ví dụ
~~~yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: orders-config, namespace: uat }
data:
  SPRING_DATASOURCE_URL: jdbc:postgresql://pg-uat:5432/orders
  SPRING_PROFILES_ACTIVE: uat
  FEATURE_NEW_CHECKOUT: "true"          # giá trị luôn là chuỗi
---
# trong Deployment, phần container:
envFrom:
  - configMapRef: { name: orders-config }
env:
  - name: SPRING_CONFIG_IMPORT
    value: optional:configtree:/etc/secrets/
volumeMounts:
  - { name: secrets, mountPath: /etc/secrets, readOnly: true }
# phần pod:
volumes:
  - name: secrets
    secret:
      secretName: orders-secret          # key "spring.datasource.password" → file cùng tên
~~~

### Env hay file
| Tiêu chí | Biến môi trường | File mount + configtree |
|---|---|---|
| Đơn giản | Rất đơn giản | Cần thêm spring.config.import |
| Cập nhật khi sửa | Chỉ khi Pod restart | File đổi sau một lúc, app phải tự reload |
| Rủi ro lộ | Cao hơn (dump env, process con) | Thấp hơn, giới hạn quyền đọc file |
| Hợp với | URL, flag, cấu hình thường | Mật khẩu, khoá, chứng chỉ |

### Lỗi hay gặp
- **Build image riêng cho từng môi trường** (nhét application-prod.yml chứa mật khẩu vào image). Cách tránh: một image, cấu hình ngoài image; mật khẩu không bao giờ nằm trong image hay Git.
- **Tưởng Secret là đã mã hoá.** Ai có quyền {{get secret}} trong namespace đều đọc được bằng base64 decode. Cách tránh: RBAC tối thiểu, encryption at rest, hoặc lấy secret từ kho ngoài (Secrets Manager, Vault).
- **Dùng {{subPath}} rồi chờ file tự cập nhật.** Mount dạng subPath **không bao giờ** được cập nhật. Cách tránh: mount cả thư mục, hoặc restart.
- **Sửa ConfigMap rồi tưởng đã áp dụng.** Các Pod vẫn chạy giá trị cũ, Pod mới (scale ra) chạy giá trị mới → hai hành vi cùng lúc. Cách tránh: đổi cấu hình kèm rollout restart, hoặc đặt hash của ConfigMap vào annotation của Pod template để mỗi lần đổi là một rollout.
- **Viết sai tên biến môi trường** ({{SPRING_DATASOURCE-URL}}). Spring bỏ qua im lặng, dùng giá trị mặc định. Cách tránh: kiểm tra {{/actuator/env}} (đã che giá trị nhạy cảm) trên môi trường test.

### Trả lời miệng 1 phút
"Tôi build một image duy nhất và đưa cấu hình theo môi trường từ ngoài vào. Cấu hình thường như URL, profile, feature flag đặt trong ConfigMap và nạp bằng envFrom; Spring relaxed binding map SPRING_DATASOURCE_URL thành spring.datasource.url, và biến môi trường đè application.yml trong jar. Secret tôi mount thành file và đọc bằng spring.config.import configtree, vì biến môi trường dễ lộ qua dump. Secret chỉ là base64 nên phải có RBAC và encryption at rest. Khi sửa ConfigMap, biến môi trường không đổi cho tới khi Pod restart, nên tôi luôn đi kèm rollout restart có readiness, hoặc gắn hash ConfigMap vào annotation để mỗi thay đổi cấu hình là một lần rollout có kiểm soát."

> Senior tip: hãy coi **thay đổi cấu hình như một lần deploy**: có review, có rollout từng Pod, có rollback. Tự động reload cấu hình nóng nghe hấp dẫn nhưng làm khó trả lời câu hỏi "lúc 14:00 Pod nào đang chạy giá trị nào". Kỹ thuật checksum annotation (Helm hay dùng) cho bạn lịch sử rõ ràng mà không cần thư viện reload nào.`,
    follow: [
      'Khi nào nên lấy secret trực tiếp từ AWS Secrets Manager/Vault thay vì Secret của Kubernetes?',
      'Làm sao xem app đang thực sự dùng giá trị cấu hình nào mà không lộ mật khẩu?',
      'Feature flag nên để trong ConfigMap hay một dịch vụ flag riêng? Vì sao?'
    ],
    tags: ['ConfigMap', 'Secret', 'Spring Boot', 'configtree', 'Kubernetes', 'configuration']
  },
  {
    id: 'devops-026',
    topic: 'devops',
    level: 'mid',
    q: 'Team đang build image với tag latest và deploy lên Kubernetes. Có lần rollback "về bản cũ" nhưng thực ra vẫn chạy bản mới, và hai Pod cùng Deployment chạy hai phiên bản khác nhau. Giải thích vì sao, và bạn đặt chiến lược tag, digest, imagePullPolicy, dọn dẹp registry thế nào?',
    a: `**Tóm tắt:** **Tag là nhãn di động**: {{latest}} hôm qua và hôm nay có thể là hai image khác nhau, còn node nào đã có sẵn image cũ trong cache thì có thể không kéo lại — nên các Pod chạy lệch phiên bản và "rollback" về {{latest}} chẳng quay về đâu cả. Cách làm đúng: tag **bất biến, duy nhất** cho mỗi build (git SHA, kèm semver khi release), bật **tag immutability** ở registry, deploy bằng tag cụ thể hoặc **digest** ({{@sha256:...}}), và có **lifecycle policy** dọn image cũ.

### Hiểu nhanh
Tag giống **tên tệp "bao-cao-moi-nhat.docx"**: ai cũng có thể ghi đè, và mỗi người trong phòng có thể đang mở một bản khác nhau mà tưởng là cùng một tệp. **Digest** giống **mã băm của chính nội dung tệp**: nội dung đổi một byte là mã đổi, nên nói "chạy bản sha256:ab12…" thì chắc chắn mọi người cùng chạy một thứ. Tag theo git SHA giống đặt tên tệp kèm mã phiên bản: mỗi bản một tên, không ai ghi đè.

### Thuật ngữ
- **Image tag**: tên gắn vào image ({{orders-api:1.4.2}}); có thể bị trỏ sang image khác (mutable).
- **Digest**: mã SHA-256 của manifest image; bất biến, xác định chính xác nội dung.
- **imagePullPolicy**: khi nào kubelet kéo image: {{Always}} (luôn hỏi registry), {{IfNotPresent}} (có sẵn trên node thì dùng), {{Never}}.
- **Mặc định của Kubernetes**: nếu tag là {{latest}} hoặc không ghi tag → mặc định {{Always}}; tag khác → {{IfNotPresent}}.
- **Tag immutability**: cấu hình registry (ví dụ ECR) cấm ghi đè tag đã tồn tại.
- **Lifecycle policy**: quy tắc tự xoá image cũ (giữ N bản gần nhất, xoá image không tag sau X ngày).

### Cơ chế: vì sao hai Pod chạy hai phiên bản
1. Thứ hai: build A, push {{orders-api:latest}} → trỏ tới A. Pod trên node-1 kéo A.
2. Thứ ba: build B, push lại {{latest}} → giờ trỏ tới B.
3. Scale thêm Pod lên node-2: kéo {{latest}} = B. Node-1 vẫn chạy A. **Cùng Deployment, hai phiên bản.** (Nếu ai đó đặt {{IfNotPresent}} cho {{latest}} thì còn tệ hơn: node đã có A trong cache sẽ tiếp tục dùng A cho cả Pod mới.)
4. Rollback: {{kubectl rollout undo}} quay về Pod template cũ — nhưng template cũ cũng ghi {{latest}}, nên vẫn kéo B. Kubernetes chỉ biết template, không biết nội dung image đằng sau tag.
5. Với tag {{3f9c2a1}} (git SHA): template cũ ghi {{3f9c2a1}}, template mới ghi {{8be0d47}} → rollback thật sự quay về đúng bản.

~~~text
Tag latest:  latest ──(thứ hai)──► image A
             latest ──(thứ ba)───► image B      ← tag "di chuyển"
Tag SHA:     orders-api:3f9c2a1 ──► image A     (mãi mãi)
             orders-api:8be0d47 ──► image B
Digest:      orders-api@sha256:ab12... ──► đúng một nội dung, không thể đổi
~~~

### Chiến lược đề xuất
| Mục | Cách làm | Vì sao |
|---|---|---|
| Tag mỗi build | git SHA ngắn ({{3f9c2a1}}) | Truy ngược được commit, duy nhất |
| Tag release | thêm {{1.4.2}} trỏ cùng image | Người đọc dễ hiểu |
| Registry | Bật tag immutability | Không ai ghi đè được bản đã phát hành |
| Manifest deploy | Tag SHA hoặc {{image@sha256:...}} | Mọi Pod chạy cùng nội dung, rollback chính xác |
| Promote môi trường | Dùng lại **cùng digest** từ DEV → UAT → PROD | Build một lần, thứ đã test là thứ lên production |
| Dọn dẹp | Lifecycle: giữ 50 bản gần nhất, xoá untagged sau 14 ngày | Registry không phình, giảm chi phí lưu trữ |

### Lệnh minh hoạ
~~~bash
SHA=$(git rev-parse --short HEAD)
docker build -t orders-api:$SHA .
docker tag orders-api:$SHA 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:$SHA
docker push 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api:$SHA
# Xem digest để ghi vào manifest/biên bản release
docker images --digests 123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/orders-api
~~~

### Lỗi hay gặp
- **Deploy bằng {{latest}}.** Triệu chứng: Pod lệch phiên bản, rollback vô tác dụng, không biết production đang chạy commit nào. Cách tránh: tag SHA + immutability.
- **Build lại image cho từng môi trường.** Triệu chứng: UAT pass nhưng PROD lỗi vì image PROD build lúc khác, kéo dependency khác. Cách tránh: build một lần, promote cùng digest.
- **Lifecycle policy xoá cả image đang chạy.** Triệu chứng: node mới không kéo được image, Pod ImagePullBackOff khi scale. Cách tránh: giữ đủ số bản, đặc biệt các bản đang chạy ở mọi môi trường và bản có thể rollback.
- **Đặt {{imagePullPolicy: Always}} mà registry chậm/rate-limit.** Mỗi Pod mới đều hỏi registry; Docker Hub có rate limit cho pull ẩn danh. Cách tránh: registry riêng/mirror, tag bất biến thì {{IfNotPresent}} là đủ.
- **Không ghi lại digest đã deploy.** Khi sự cố, không chứng minh được bản nào đã chạy. Cách tránh: pipeline ghi tag + digest vào release note.

### Trả lời miệng 1 phút
"latest là tag di động: mỗi lần push nó trỏ sang image mới, nên Pod trên node khác nhau kéo ở thời điểm khác nhau sẽ chạy phiên bản khác nhau, và rollback về template cũ vẫn ghi latest nên chẳng quay về đâu. Tôi tag mỗi build bằng git SHA, thêm semver khi release, bật tag immutability trên registry để không ai ghi đè. Manifest dùng tag SHA hoặc digest, nên mọi Pod cùng nội dung và rollout undo quay về đúng bản cũ. Image được build một lần rồi promote cùng digest qua DEV, UAT, PROD. Cuối cùng có lifecycle policy giữ đủ số bản để rollback và xoá image không tag."

> Senior tip: hỏi nhanh "production đang chạy commit nào?" — nếu team mất hơn 30 giây để trả lời thì chiến lược tag đang có vấn đề. Tôi luôn để pipeline gắn thêm label OCI {{org.opencontainers.image.revision}} chứa git SHA vào image, và expose nó qua {{/actuator/info}}: một lệnh curl là biết ngay, kể cả khi ai đó đã deploy tay.`,
    follow: [
      'Deploy bằng digest thay vì tag có nhược điểm gì với việc đọc manifest và GitOps?',
      'Ký image (cosign) và kiểm tra chữ ký khi deploy giải quyết rủi ro gì?',
      'Docker Hub rate limit ảnh hưởng tới cluster thế nào và bạn xử lý ra sao?'
    ],
    tags: ['Docker', 'image tag', 'digest', 'imagePullPolicy', 'registry', 'ECR']
  },
  {
    id: 'devops-027',
    topic: 'devops',
    level: 'mid',
    q: 'Pipeline GitHub Actions của bạn đang lưu AWS access key dài hạn trong repository secrets để deploy, build Maven mất 8 phút vì tải lại dependency mỗi lần, và hai lần merge liên tiếp từng deploy chồng lên nhau. Bạn sửa workflow thế nào (OIDC, cache, environment, concurrency, permissions)?',
    a: `**Tóm tắt:** Bỏ access key, dùng **OIDC**: workflow xin token OIDC của GitHub ({{permissions: id-token: write}}), AWS STS đổi lấy credential tạm của một **IAM role** có trust policy giới hạn đúng repo và nhánh/environment. Cache Maven bằng {{actions/setup-java}} với {{cache: maven}}. Job deploy gắn **environment** (có required reviewers cho production), dùng **concurrency group** để hai lần deploy không chạy chồng. Đặt **permissions** tối thiểu cho {{GITHUB_TOKEN}} và ghim action bên thứ ba theo commit SHA.

### Hiểu nhanh
Access key dài hạn trong secrets giống **chìa khoá kho cất trong ngăn bàn chung**: ai lấy được là vào kho mãi mãi. **OIDC** giống thẻ ra vào tạm: mỗi lần chạy, GitHub đưa "giấy giới thiệu có chữ ký" (token OIDC) nói rõ "đây là workflow của repo X, nhánh main", AWS kiểm tra rồi phát **thẻ có hạn một giờ**. **Cache** giống giữ lại nguyên liệu đã sơ chế, lần sau không phải đi chợ lại. **Concurrency** giống quy định "mỗi lúc chỉ một xe vào bãi giao hàng".

### Thuật ngữ
- **Workflow / job / step**: file YAML trong {{.github/workflows}}; mỗi job chạy trên một runner riêng, các step chạy tuần tự trong job.
- **OIDC token**: token có chữ ký do GitHub cấp cho mỗi lần chạy, chứa thông tin repo, nhánh, environment (claim {{sub}}).
- **IAM OIDC identity provider**: khai báo trong AWS để tin token của {{token.actions.githubusercontent.com}}.
- **Trust policy**: điều kiện để được assume role — ví dụ claim {{sub}} phải là {{repo:acme/orders-api:environment:production}}.
- **Environment**: khái niệm GitHub cho môi trường deploy: có secret riêng, required reviewers, giới hạn nhánh được deploy.
- **Concurrency group**: các lần chạy cùng group thì xếp hàng hoặc huỷ bản cũ.
- **GITHUB_TOKEN permissions**: quyền của token tự động trong workflow; nên đặt tối thiểu.

### Cơ chế từng bước (OIDC)
1. Job deploy khai báo {{permissions: id-token: write}} để được xin OIDC token.
2. Action {{aws-actions/configure-aws-credentials}} xin token từ GitHub, gọi {{sts:AssumeRoleWithWebIdentity}} với role ARN.
3. AWS kiểm tra chữ ký token, audience {{sts.amazonaws.com}}, và claim {{sub}} khớp trust policy. Vì sao phải giới hạn {{sub}}: thiếu điều kiện này thì **mọi repo trên GitHub** có thể assume role của bạn.
4. STS trả credential tạm (mặc định 1 giờ), action đặt vào biến môi trường cho các step sau.
5. Hết job, credential tự hết hạn; không có gì để rò rỉ lâu dài hay phải xoay vòng.

### Workflow rút gọn
~~~yaml
name: ci-cd
on:
  push:
    branches: [main]
permissions:
  contents: read                      # mặc định tối thiểu cho mọi job
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
          cache: maven                # cache ~/.m2 theo hash của pom.xml
      - run: ./mvnw -B verify
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production           # required reviewers duyệt trước khi chạy
    concurrency:
      group: deploy-production        # mỗi lúc chỉ một deploy production
      cancel-in-progress: false       # đang deploy thì xếp hàng, không huỷ giữa chừng
    permissions:
      id-token: write                 # được xin OIDC token
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-orders-deploy
          aws-region: ap-southeast-1
      - run: ./deploy.sh "$GITHUB_SHA"
~~~
Trust policy của role {{gha-orders-deploy}} có điều kiện {{token.actions.githubusercontent.com:aud}} = {{sts.amazonaws.com}} và {{token.actions.githubusercontent.com:sub}} = {{repo:acme/orders-api:environment:production}}.

### So sánh cách cấp quyền cho CI
| Cách | Rò rỉ thì sao | Vận hành |
|---|---|---|
| Access key trong secrets | Dùng được tới khi bị thu hồi, có thể nhiều tháng | Phải xoay vòng định kỳ, dễ quên |
| OIDC + role | Token sống vài phút, credential vài giờ, chỉ hợp lệ cho đúng repo/environment | Cấu hình một lần |
| Self-hosted runner có instance role | Ai chạy được workflow trên runner đó đều có quyền | Phải cô lập runner theo repo |

### Lỗi hay gặp
- **Trust policy chỉ kiểm tra audience, không kiểm tra {{sub}}.** Rủi ro: repo khác (kể cả của người lạ) assume được role. Cách tránh: luôn ràng buộc {{sub}} theo repo và nhánh/environment.
- **Quên {{id-token: write}}.** Triệu chứng: action báo không lấy được token. Lưu ý: khai báo permissions ở job sẽ thay thế mặc định, nên phải liệt kê đủ quyền cần.
- **Cache sai khoá.** Triệu chứng: cache không bao giờ trúng, hoặc dùng mãi bản cũ. {{setup-java}} tự đặt khoá theo hash file build; tự viết {{actions/cache}} thì khoá phải gồm hash của {{pom.xml}}.
- **Dùng action bên thứ ba theo tag {{@v1}}.** Tag có thể bị trỏ lại sang code độc. Cách tránh: action ngoài tổ chức ghim theo **full commit SHA**, cập nhật qua Dependabot.
- **Workflow chạy cho pull request từ fork với {{pull_request_target}}** rồi checkout code của PR. Code lạ chạy với secret của bạn. Cách tránh: tránh pattern này, hoặc tách job không có secret.
- **{{cancel-in-progress: true}} cho deploy.** Huỷ giữa chừng có thể để hệ thống ở trạng thái nửa vời. Cách tránh: dùng cho build/test, còn deploy thì xếp hàng.

### Trả lời miệng 1 phút
"Tôi bỏ access key dài hạn và chuyển sang OIDC: job deploy có quyền id-token write, action configure-aws-credentials đổi token OIDC của GitHub lấy credential tạm của một IAM role, và trust policy ràng buộc audience lẫn claim sub đúng repo và environment production, nên repo khác không assume được và không còn key nào để lộ. Build dùng setup-java với cache maven để không tải lại dependency. Job deploy gắn environment production có required reviewers, cộng concurrency group để hai lần merge không deploy chồng, và cancel-in-progress tắt cho deploy. Cuối cùng permissions mặc định chỉ contents read, và action bên thứ ba ghim theo commit SHA."

> Senior tip: sau khi chuyển sang OIDC, hãy **xoá hẳn** access key cũ trong IAM chứ không chỉ xoá khỏi GitHub secrets — key "không dùng nữa" nhưng còn hiệu lực là thứ hay bị khai thác nhất. Tách role theo môi trường (deploy UAT không assume được role production), và bật CloudTrail để mỗi lần deploy đều truy được về đúng lần chạy workflow qua tên session.`,
    follow: [
      'Claim sub của token OIDC khác nhau thế nào giữa job có environment và job không có environment?',
      'Reusable workflow giúp gì khi 30 repo cùng cần một pipeline chuẩn?',
      'Self-hosted runner có rủi ro bảo mật gì so với runner do GitHub cung cấp?'
    ],
    tags: ['GitHub Actions', 'OIDC', 'CI/CD', 'IAM', 'cache', 'concurrency'],
    refs: [
      { type: 'doc', title: 'Configuring OpenID Connect in Amazon Web Services', url: 'https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services' }
    ]
  },
  {
    id: 'devops-028',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn chuyển job tính lãi cuối ngày (Spring Boot, chạy khoảng 40 phút) sang Kubernetes CronJob. Hôm thì job chạy hai lần, hôm thì không chạy, có lần chạy tới sáng không dừng. Bạn cấu hình schedule, timeZone, concurrencyPolicy, startingDeadlineSeconds, backoffLimit, activeDeadlineSeconds thế nào, và viết app Spring Boot cho đúng kiểu "chạy xong thì thoát"?',
    a: `**Tóm tắt:** CronJob tạo **Job**, Job tạo **Pod**; mỗi tầng có quy tắc riêng. Chống chạy chồng bằng {{concurrencyPolicy: Forbid}}; chống "lỡ giờ thì thôi" bằng {{startingDeadlineSeconds}} hợp lý; giới hạn số lần thử bằng {{backoffLimit}}; chặn chạy vô hạn bằng {{activeDeadlineSeconds}}; đặt {{timeZone: Asia/Ho_Chi_Minh}} để khỏi tính nhầm UTC. Kubernetes chỉ hứa CronJob **xấp xỉ** một lần mỗi lịch — đôi khi hai, đôi khi không — nên job phải **idempotent** và có alarm "không chạy". App Spring Boot chạy với {{web-application-type=none}}, làm xong thì thoát với exit code đúng.

### Hiểu nhanh
CronJob giống **quản đốc có đồng hồ báo thức**: tới giờ thì giao phiếu việc (Job) cho một tổ; tổ cử người (Pod) làm. Nếu người làm hỏng, tổ cử người khác làm lại, tối đa vài lần (backoffLimit). **Forbid** là "việc hôm qua chưa xong thì hôm nay không giao thêm". **startingDeadlineSeconds** là "lỡ giờ quá X phút thì bỏ ca này". **activeDeadlineSeconds** là "làm quá 2 tiếng thì dừng lại báo cáo". Và vì quản đốc đôi khi giao trùng phiếu, phiếu việc phải ghi rõ "lãi ngày 29/10" để tổ biết đã làm rồi thì thôi.

### Thuật ngữ
- **CronJob**: tạo Job theo lịch cron; {{timeZone}} chọn múi giờ (ổn định từ Kubernetes 1.27).
- **Job**: chạy Pod tới khi đủ số lần thành công; {{backoffLimit}} (mặc định 6) là số lần thử lại trước khi coi Job thất bại.
- **concurrencyPolicy**: {{Allow}} (mặc định — cho chạy chồng), {{Forbid}} (bỏ lần mới nếu lần cũ chưa xong), {{Replace}} (huỷ lần cũ, chạy lần mới).
- **startingDeadlineSeconds**: nếu vì lý do nào đó (controller bận, cluster nâng cấp) không tạo được Job đúng giờ, còn trong khoảng này thì vẫn tạo bù; quá thì bỏ lần đó.
- **activeDeadlineSeconds**: thời gian sống tối đa của Job; vượt thì mọi Pod bị dừng và Job thất bại.
- **ttlSecondsAfterFinished**: tự xoá Job đã xong sau một khoảng thời gian.
- **restartPolicy**: Pod của Job chỉ được {{OnFailure}} hoặc {{Never}}.

### Cơ chế từng bước
1. 23:00 (theo timeZone), CronJob controller thấy tới lịch → tạo Job {{daily-interest-29029120}} (tên CronJob + thời điểm lịch).
2. Job tạo Pod chạy image app với profile {{batch}}. Pod lỗi (exit code khác 0) → Job tạo Pod mới với thời gian chờ tăng dần, tối đa {{backoffLimit}} lần.
3. Lần chạy hôm sau tới giờ mà Job hôm trước còn chạy: với {{Forbid}} thì bỏ qua lần mới; với {{Allow}} mặc định thì **hai job tính lãi chạy song song** — nguồn gốc của "chạy hai lần".
4. Controller bận hoặc bị tắt lúc 23:00 (đang nâng cấp control plane): nếu quay lại trong {{startingDeadlineSeconds}} thì tạo bù; nếu không đặt trường này, controller đếm số lịch bị lỡ, lỡ quá 100 lần thì ngừng lên lịch cho CronJob đó — nguồn gốc của "không chạy".
5. Job treo (deadlock DB, chờ khoá) → {{activeDeadlineSeconds}} dừng nó, Job chuyển Failed → alarm.
6. App Spring Boot: không mở cổng web, chạy logic trong {{ApplicationRunner}}, rồi {{System.exit(SpringApplication.exit(ctx))}} để exit code phản ánh kết quả; nếu không thoát, Pod chạy mãi.

### Manifest
~~~yaml
apiVersion: batch/v1
kind: CronJob
metadata: { name: daily-interest }
spec:
  schedule: "0 23 * * *"
  timeZone: Asia/Ho_Chi_Minh          # không có trường này = theo múi giờ của controller (thường UTC)
  concurrencyPolicy: Forbid           # không bao giờ hai job tính lãi chạy cùng lúc
  startingDeadlineSeconds: 1800       # lỡ giờ trong 30 phút vẫn chạy bù
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5           # giữ Job lỗi để xem log
  jobTemplate:
    spec:
      backoffLimit: 2                 # thử tối đa 3 lần (1 + 2), không phải 7 như mặc định
      activeDeadlineSeconds: 7200     # quá 2 giờ là dừng, báo lỗi
      ttlSecondsAfterFinished: 86400
      template:
        spec:
          restartPolicy: Never        # để mỗi lần thử là một Pod mới, dễ xem log
          containers:
            - name: job
              image: registry.example.com/core-batch:3f9c2a1
              args: ["--spring.profiles.active=batch", "--spring.main.web-application-type=none"]
~~~

### Code: app chạy xong thì thoát
~~~java
@Component
@Profile("batch")
class InterestRunner implements ApplicationRunner {
    public void run(ApplicationArguments args) {
        LocalDate day = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        if (runs.isDone(day)) return;          // idempotent: ngày này đã tính rồi thì thôi
        interestService.accrue(day);           // ghi theo lô, mỗi lô một transaction
        runs.markDone(day);
    }
}
// main: thoát JVM với exit code từ Spring (exception trong runner → khác 0 → Job tính là lỗi)
public static void main(String[] a) {
    System.exit(SpringApplication.exit(SpringApplication.run(BatchApp.class, a)));
}
~~~

### Lỗi hay gặp
- **Để concurrencyPolicy mặc định (Allow).** Triệu chứng: job hôm trước chạy chậm, job hôm nay chồng lên, lãi tính hai lần. Cách tránh: {{Forbid}} + idempotent theo ngày.
- **Không đặt startingDeadlineSeconds.** Triệu chứng: sau một sự cố dài, CronJob báo lỗi quá nhiều lịch bị lỡ và ngừng tạo Job. Cách tránh: đặt giá trị cụ thể (vài chục phút).
- **App không tự thoát.** Triệu chứng: Pod Running mãi, lần sau bị Forbid chặn. Cách tránh: {{web-application-type=none}}, thoát rõ ràng, và {{activeDeadlineSeconds}} làm lưới an toàn.
- **Cron theo UTC.** Triệu chứng: tính lãi lúc 6 giờ sáng. Cách tránh: {{timeZone}}.
- **backoffLimit mặc định 6 với job không idempotent.** Mỗi lần thử làm lại từ đầu, có thể ghi trùng. Cách tránh: giảm backoffLimit, ghi theo lô có checkpoint.
- **Job bị Pod khác tranh tài nguyên rồi bị evict.** Cách tránh: đặt requests đủ, PriorityClass cao hơn cho batch quan trọng.

### Trả lời miệng 1 phút
"CronJob tạo Job, Job tạo Pod, và Kubernetes chỉ hứa xấp xỉ một lần mỗi lịch, nên tôi thiết kế job idempotent theo ngày nghiệp vụ trước. Về cấu hình: timeZone Asia/Ho_Chi_Minh để khỏi lệch UTC; concurrencyPolicy Forbid để job chậm hôm trước không chạy chồng với hôm nay; startingDeadlineSeconds khoảng 30 phút để lỡ giờ vẫn chạy bù và tránh tình trạng ngừng lên lịch sau quá nhiều lịch bị lỡ; backoffLimit nhỏ; activeDeadlineSeconds để job treo không chạy tới sáng. App Spring Boot chạy không web, logic trong ApplicationRunner, cuối cùng System.exit với exit code của Spring để Job biết thành công hay thất bại. Cuối cùng là alarm khi job thất bại và cả khi tới hạn mà không thấy lần chạy thành công."

> Senior tip: job tài chính nên chạy **theo lô có checkpoint** (ví dụ 10.000 tài khoản một lô, ghi lại lô cuối đã xong) để khi bị dừng giữa chừng thì chạy lại tiếp tục từ lô đó thay vì làm lại 40 phút. Và hãy theo dõi **thời lượng job theo ngày** — job tăng từ 40 lên 90 phút trong ba tháng là tín hiệu sớm trước khi nó đụng activeDeadlineSeconds vào một đêm cuối tháng.`,
    follow: [
      'Khi nào dùng Spring Batch thay vì tự viết ApplicationRunner cho job dài?',
      'concurrencyPolicy Replace phù hợp với loại job nào?',
      'Làm sao chạy thủ công lại job cho một ngày cụ thể mà không sửa CronJob?'
    ],
    tags: ['Kubernetes', 'CronJob', 'Job', 'batch', 'Spring Boot', 'idempotency'],
    refs: [
      { type: 'doc', title: 'Kubernetes CronJob', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' }
    ]
  },
  {
    id: 'devops-029',
    topic: 'devops',
    level: 'senior',
    q: 'Mỗi lần team platform nâng cấp node Kubernetes (drain từng node), service thanh toán 3 replica lại có vài phút lỗi 503, có lần cả 3 Pod nằm trên cùng một node. Bạn dùng PodDisruptionBudget, topologySpreadConstraints và anti-affinity thế nào để việc bảo trì node không làm gián đoạn dịch vụ?',
    a: `**Tóm tắt:** Drain dùng **Eviction API**, và Eviction API tôn trọng **PodDisruptionBudget (PDB)**: đặt {{minAvailable: 2}} (hoặc {{maxUnavailable: 1}}) thì drain chỉ được đuổi Pod khi vẫn còn đủ Pod sẵn sàng. Nhưng PDB vô dụng nếu cả 3 Pod nằm chung một node hoặc một zone — vì vậy phải **rải Pod** bằng {{topologySpreadConstraints}} theo node và zone (hoặc pod anti-affinity). Cộng thêm readiness probe đúng và graceful shutdown thì drain trở thành sự kiện không ai thấy.

### Hiểu nhanh
Cluster giống **một bệnh viện có nhiều phòng trực**, Pod là bác sĩ trực. Bảo trì phòng (drain node) là mời bác sĩ trong phòng đó sang phòng khác. **PDB** là quy định "lúc nào cũng phải có ít nhất 2 bác sĩ đang trực" — người điều phối chỉ được mời bác sĩ đi khi còn đủ người. **Topology spread** là quy định "không xếp cả 3 bác sĩ vào cùng một phòng hay cùng một tầng" — nếu không, đóng một phòng là mất sạch, quy định nào cũng không cứu được.

### Thuật ngữ
- **Voluntary disruption**: gián đoạn chủ động — drain node, nâng cấp cluster, autoscaler thu node. PDB chỉ bảo vệ loại này.
- **Involuntary disruption**: node chết, mất điện, kernel panic — PDB **không** ngăn được; chỉ có rải Pod và đủ replica mới giảm thiệt hại.
- **Eviction API**: cách "lịch sự" để đuổi Pod; bị từ chối (HTTP 429) nếu vi phạm PDB, và {{kubectl drain}} sẽ thử lại.
- **PodDisruptionBudget**: {{minAvailable}} hoặc {{maxUnavailable}} cho một nhóm Pod theo label selector.
- **topologySpreadConstraints**: yêu cầu scheduler rải Pod đều theo một **topology key** ({{kubernetes.io/hostname}} theo node, {{topology.kubernetes.io/zone}} theo zone), với {{maxSkew}} là độ chênh tối đa.
- **Pod anti-affinity**: "đừng xếp tôi chung chỗ với Pod có label X"; cứng ({{required}}) hoặc mềm ({{preferred}}).

### Cơ chế từng bước khi drain node-1
1. Platform chạy {{kubectl drain node-1}}: node bị **cordon** (không nhận Pod mới).
2. Với mỗi Pod trên node-1, drain gọi Eviction API. API server kiểm tra PDB của service thanh toán: hiện có 3 Pod ready, {{minAvailable: 2}} → được phép đuổi 1.
3. Pod bị đuổi nhận SIGTERM, bị gỡ khỏi endpoint, chạy graceful shutdown. Deployment thấy thiếu replica → tạo Pod mới trên node khác.
4. Nếu node-1 có **2** Pod thanh toán: Pod thứ hai bị từ chối (429) cho tới khi Pod mới ở node khác **ready** — drain chờ, không phá dịch vụ. Vì sao readiness quan trọng: PDB đếm Pod **ready**, readiness sai thì PDB đếm sai.
5. Nếu cả 3 Pod trên node-1 và không có PDB: drain đuổi cả 3 gần như cùng lúc → 503 tới khi Pod mới khởi động xong (Spring Boot cần 30–60 giây).
6. Có topology spread theo hostname: 3 Pod luôn nằm 3 node khác nhau → drain một node chỉ mất một Pod, PDB cho phép ngay.

~~~text
Không rải, không PDB:          Có spread + PDB minAvailable=2:
node-1 [P1 P2 P3]  ← drain     node-1 [P1] ← drain: đuổi P1 (còn P2, P3 ready)
node-2 [ ]                     node-2 [P2]
node-3 [ ]                     node-3 [P3]       P1' lên ở node-4, ready rồi mới drain tiếp
→ 0 Pod sẵn sàng → 503         → luôn ≥ 2 Pod phục vụ
~~~

### Manifest
~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  minAvailable: 2                     # với 3 replica: mỗi lúc chỉ đuổi được 1
  selector:
    matchLabels: { app: payment }
---
# trong Pod template của Deployment payment:
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone       # rải đều các zone
    whenUnsatisfiable: ScheduleAnyway              # thiếu zone vẫn chạy được
    labelSelector:
      matchLabels: { app: payment }
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname            # không chung node
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels: { app: payment }
~~~

### PDB nên đặt thế nào
| Replica | Cấu hình | Hệ quả |
|---|---|---|
| 1 | {{minAvailable: 1}} | **Chặn drain vĩnh viễn** — nâng cấp node bị kẹt |
| 2 | {{maxUnavailable: 1}} | Drain được, lúc drain chỉ còn 1 Pod gánh tải |
| 3+ | {{maxUnavailable: 1}} hoặc {{minAvailable}} = N-1 | Cân bằng giữa an toàn và tốc độ nâng cấp |
| HPA thay đổi số replica | Ưu tiên {{maxUnavailable}} | Không phải sửa PDB khi scale |

### Lỗi hay gặp
- **PDB cho Deployment 1 replica với minAvailable 1.** Triệu chứng: drain treo hàng giờ, platform team phải force xoá Pod — tệ hơn không có PDB. Cách tránh: service quan trọng chạy tối thiểu 2–3 replica; service 1 replica chấp nhận gián đoạn hoặc dùng maxUnavailable 1.
- **Có PDB nhưng Pod dồn một node.** PDB làm drain chậm lại nhưng node chết đột ngột thì mất hết. Cách tránh: topology spread theo hostname và zone.
- **Tưởng PDB bảo vệ khi rolling update.** Rolling update của Deployment dùng {{maxUnavailable}}/{{maxSurge}} của chính nó, không dùng PDB.
- **Readiness luôn trả UP.** PDB đếm Pod "ready" nhưng thực ra chưa phục vụ được → drain đi tiếp, người dùng gặp lỗi. Cách tránh: readiness phản ánh khả năng nhận request thật.
- **DoNotSchedule theo zone trong cluster chỉ còn đủ chỗ ở một zone.** Pod mới Pending mãi. Cách tránh: zone dùng {{ScheduleAnyway}}, node dùng {{DoNotSchedule}} nếu đủ node.

### Trả lời miệng 1 phút
"Drain node dùng Eviction API, và Eviction API tôn trọng PodDisruptionBudget, nên tôi đặt PDB cho service thanh toán, thường maxUnavailable 1 với 3 replica: drain chỉ đuổi Pod khi còn đủ Pod ready, Pod thứ hai phải chờ Pod thay thế ready. Nhưng PDB không cứu được nếu cả ba Pod chung một node, và không bảo vệ khi node chết đột ngột, nên tôi thêm topologySpreadConstraints theo hostname và theo zone để Pod luôn rải ra. Readiness phải đúng vì PDB đếm Pod ready, và graceful shutdown để Pod bị đuổi không làm rơi request. Tôi tránh PDB minAvailable 1 cho Deployment 1 replica vì nó chặn drain vĩnh viễn."

> Senior tip: hãy đưa **"drain một node bất kỳ giữa giờ làm việc"** vào bài kiểm tra định kỳ — nếu dashboard lỗi không nhúc nhích thì cấu hình đã đúng. Tôi cũng thêm policy (Kyverno/Gatekeeper) cảnh báo mọi Deployment production thiếu PDB hoặc có PDB chặn drain, vì platform team thường chỉ phát hiện vào đúng đêm nâng cấp cluster.`,
    follow: [
      'Cluster autoscaler thu hồi node có tôn trọng PDB không, và điều đó ảnh hưởng chi phí thế nào?',
      'topologySpreadConstraints khác podAntiAffinity ở điểm nào, khi nào dùng cái nào?',
      'Với StatefulSet như Kafka hay PostgreSQL, PDB nên đặt khác gì so với service stateless?'
    ],
    tags: ['Kubernetes', 'PodDisruptionBudget', 'topology spread', 'drain', 'high availability'],
    refs: [
      { type: 'doc', title: 'Specifying a Disruption Budget for your Application', url: 'https://kubernetes.io/docs/tasks/run-application/configure-pdb/' }
    ]
  },
  {
    id: 'devops-030',
    topic: 'devops',
    level: 'lead',
    q: 'Công ty quyết định 8 team dùng chung một cluster Kubernetes thay vì mỗi team một cluster. Là tech lead platform, bạn thiết kế ranh giới giữa các team thế nào (namespace, RBAC, ResourceQuota, LimitRange, NetworkPolicy, Pod Security) để một team không làm sập, không đọc trộm và không "ăn" hết tài nguyên của team khác?',
    a: `**Tóm tắt:** Mỗi team (và môi trường) một **namespace**; **RBAC** cho team quyền trong namespace của mình, không quyền cluster-wide; **ResourceQuota** giới hạn tổng CPU/RAM/số Pod mỗi namespace, **LimitRange** đặt request/limit mặc định để Pod không khai báo cũng không chiếm vô hạn; **NetworkPolicy** mặc định chặn mọi traffic vào rồi mở đúng đường cần; **Pod Security Admission** ở mức {{restricted}} chặn container privileged, chạy root. Bao ngoài là **policy as code** (Kyverno/Gatekeeper) và tách hẳn cluster cho thứ cần cô lập mạnh (PCI, production nhạy cảm). Namespace là ranh giới **mềm** — đủ cho các team tin nhau trong công ty, không đủ cho khách hàng lạ.

### Hiểu nhanh
Cluster dùng chung giống **một toà văn phòng chia cho 8 công ty con**. **Namespace** là các tầng riêng. **RBAC** là thẻ từ chỉ mở tầng của mình. **ResourceQuota** là hạn mức điện nước mỗi tầng — một tầng bật máy sưởi cả ngày không làm cả toà mất điện. **LimitRange** là quy định mặc định cho từng thiết bị mang vào. **NetworkPolicy** là cửa giữa các tầng: mặc định khoá, chỉ mở cửa nào có lý do. **Pod Security** là quy định "không được mang bình gas vào phòng". Toà nhà vẫn chung móng (control plane, node, kernel) — nên ai cần cách ly tuyệt đối thì thuê toà riêng.

### Thuật ngữ
- **Namespace**: phạm vi tên và chính sách; phần lớn object (Pod, Service, Secret) thuộc một namespace; node, PersistentVolume, ClusterRole thì không.
- **Role/RoleBinding vs ClusterRole/ClusterRoleBinding**: quyền trong một namespace vs toàn cluster.
- **ResourceQuota**: tổng hạn mức của namespace ({{requests.cpu}}, {{limits.memory}}, {{pods}}, số Service LoadBalancer…). Khi quota có CPU/memory, **mọi Pod phải khai báo** request/limit tương ứng, nếu không bị từ chối.
- **LimitRange**: giá trị mặc định và min/max cho từng container trong namespace.
- **NetworkPolicy**: luật firewall ở tầng Pod; chỉ có hiệu lực khi **CNI hỗ trợ** (Calico, Cilium…), nếu không thì tạo ra cũng không có tác dụng.
- **Pod Security Admission**: cơ chế có sẵn, gắn label namespace {{pod-security.kubernetes.io/enforce}} với mức {{privileged}}, {{baseline}}, {{restricted}}.
- **Policy as code**: Kyverno hoặc OPA Gatekeeper kiểm tra mọi manifest khi tạo (bắt buộc label owner, cấm image latest, bắt buộc PDB…).

### Cơ chế từng bước khi onboarding một team
1. **Tạo namespace** {{payments-prod}}, {{payments-uat}} với label owner, cost-center, mức Pod Security. Vì sao tách môi trường bằng namespace: quota, quyền và NetworkPolicy khác nhau theo môi trường.
2. **RBAC**: nhóm SSO của team được Role {{edit}} trong namespace UAT, chỉ {{view}} ở production (deploy production đi qua pipeline/GitOps, không qua kubectl tay).
3. **Quota và LimitRange**: dựa trên số đo thật, ví dụ 40 vCPU request, 80 Gi RAM, 150 Pod; LimitRange mặc định request 250m/512Mi để Pod quên khai báo vẫn được tính vào quota.
4. **NetworkPolicy default deny ingress**, rồi mở: từ namespace ingress-controller vào cổng 8080; từ {{orders-prod}} vào {{payments-prod}} cổng 8080; egress tới DB/Kafka nếu bật chặn egress.
5. **Admission**: Pod Security {{restricted}} (không root, không privileged, drop capabilities); Kyverno bắt buộc có request/limit, probe, label owner, image từ registry nội bộ.
6. **Quan sát và chi phí**: dashboard theo namespace, chia chi phí theo label (OpenCost/Kubecost), alert khi namespace dùng trên 85% quota.

~~~text
Cluster dùng chung
├── ns payments-prod  [RBAC: view | Quota 40 CPU/80Gi | PSA restricted | NetPol default-deny]
│      ▲ chỉ cho phép: ingress-nginx → :8080, orders-prod → :8080
├── ns orders-prod    [RBAC: view | Quota 30 CPU/60Gi | PSA restricted]
├── ns payments-uat   [RBAC: edit | Quota 10 CPU/20Gi]
└── ns platform-*     (ingress, monitoring, Kyverno) — chỉ platform team
~~~

### Manifest cốt lõi
~~~yaml
apiVersion: v1
kind: ResourceQuota
metadata: { name: quota, namespace: payments-prod }
spec:
  hard:
    requests.cpu: "40"
    requests.memory: 80Gi
    limits.memory: 120Gi
    pods: "150"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-ingress, namespace: payments-prod }
spec:
  podSelector: {}                     # áp cho mọi Pod trong namespace
  policyTypes: ["Ingress"]            # không khai báo rule ingress nào = chặn hết
~~~

### Chung cluster hay tách cluster
| Tiêu chí | Một cluster nhiều namespace | Mỗi team một cluster |
|---|---|---|
| Chi phí | Thấp: chung control plane, node đầy hơn | Cao: control plane, add-on nhân 8 |
| Vận hành | Một lần nâng cấp, một bộ add-on | 8 lần nâng cấp, dễ lệch phiên bản |
| Cô lập | Mềm: chung kernel, chung API server | Mạnh |
| Blast radius | Lỗi control plane/add-on ảnh hưởng mọi team | Giới hạn trong một team |
| Hợp với | Các team nội bộ tin nhau | Dữ liệu PCI, khách hàng ngoài, yêu cầu pháp lý |

### Lỗi hay gặp
- **Cấp cluster-admin "cho nhanh".** Một lệnh sai xoá CRD hay namespace của team khác. Cách tránh: quyền theo namespace, cluster-wide chỉ cho platform.
- **Quota mà không có LimitRange.** Triệu chứng: Pod không khai báo request bị từ chối với lỗi khó hiểu, team kêu "cluster hỏng". Cách tránh: LimitRange đặt mặc định, kèm tài liệu.
- **Tạo NetworkPolicy trên CNI không hỗ trợ.** Tưởng đã chặn nhưng thực tế mọi Pod vẫn gọi được nhau. Cách tránh: kiểm thử bằng Pod thật ({{curl}} chéo namespace) sau khi áp.
- **Default deny egress mà quên DNS.** Triệu chứng: mọi Pod không phân giải được tên. Cách tránh: mở egress tới CoreDNS cổng 53 UDP/TCP trước tiên.
- **Quota đặt theo cảm tính.** Quá chặt thì team không deploy được giữa sự cố, quá lỏng thì vô nghĩa. Cách tránh: đặt theo số đo, xem lại hằng quý, có quy trình xin tăng nhanh.

### Trả lời miệng 1 phút
"Tôi chia ranh giới theo namespace cho mỗi team và môi trường. RBAC gắn với nhóm SSO: team có quyền edit ở UAT, chỉ view ở production vì deploy production đi qua pipeline. ResourceQuota giới hạn tổng CPU, RAM, số Pod mỗi namespace, LimitRange đặt request mặc định để Pod quên khai báo vẫn bị tính quota. NetworkPolicy default deny ingress rồi mở đúng đường, với điều kiện CNI hỗ trợ và nhớ mở DNS nếu chặn egress. Pod Security Admission mức restricted chặn container root và privileged, Kyverno bắt buộc probe, request, label owner, image nội bộ. Namespace là ranh giới mềm vì chung kernel và control plane, nên workload PCI hay của khách hàng ngoài tôi tách cluster riêng."

> Senior tip: **thành công của cluster dùng chung đo bằng thời gian onboarding** — nếu một team mới phải chờ platform hai tuần để có namespace thì họ sẽ đòi cluster riêng. Hãy đóng gói toàn bộ bộ ranh giới (namespace, RBAC, quota, NetworkPolicy, PSA label) thành một template trong GitOps: team mở một pull request, review xong là có môi trường chuẩn trong một giờ.`,
    follow: [
      'Khi nào ranh giới namespace không đủ và phải tách cluster hoặc dùng node pool riêng?',
      'Bạn xử lý thế nào khi một team liên tục chạm trần quota giữa sự cố?',
      'Làm sao chia chi phí cluster dùng chung cho từng team một cách công bằng?'
    ],
    tags: ['Kubernetes', 'multi-tenancy', 'RBAC', 'ResourceQuota', 'NetworkPolicy', 'Pod Security'],
    refs: [
      { type: 'doc', title: 'Kubernetes Multi-tenancy', url: 'https://kubernetes.io/docs/concepts/security/multi-tenancy/' }
    ]
  },
  {
    id: 'devops-031',
    topic: 'devops',
    level: 'senior',
    q: 'Sau một vụ thư viện mã nguồn mở bị cài mã độc, CISO yêu cầu: mọi image chạy trên cluster production phải có SBOM, đã quét lỗ hổng và được ký bởi pipeline chính thức; image nào không thoả thì Kubernetes phải từ chối chạy. Bạn thiết kế chuỗi SBOM (CycloneDX/Syft), scan (Trivy/Grype), ký image (cosign) và chặn ở admission thế nào?',
    a: `**Tóm tắt:** Trong CI, sau khi build và push image, tôi lấy **digest** của image, sinh **SBOM** dạng CycloneDX bằng Syft, quét lỗ hổng bằng Trivy (hoặc Grype) và fail pipeline theo ngưỡng, rồi dùng **cosign** ký image theo digest (keyless qua OIDC của CI) và gắn SBOM thành một **attestation** cũng được ký. Trên cluster, một admission controller (Kyverno {{verifyImages}} hoặc Sigstore policy-controller) kiểm tra chữ ký **đúng danh tính pipeline** trước khi cho Pod chạy. Vì CVE mới được công bố hằng ngày, SBOM được lưu tập trung để quét lại image **đang chạy**.

### Mỗi mảnh giải quyết rủi ro gì
- **SBOM** (Software Bill of Materials): danh sách mọi thành phần trong image — gói OS (glibc, openssl), Java runtime, từng jar trong {{BOOT-INF/lib}} kèm version và mã định danh purl. Khi có một Log4Shell mới, bạn tra SBOM trong vài phút để biết service nào dính thay vì grep từng repo.
- **Scan lỗ hổng**: đối chiếu thành phần với cơ sở dữ liệu CVE, trả lời câu hỏi "image này có lỗ hổng đã biết không".
- **Ký image**: chứng minh image do **pipeline của bạn** tạo ra và **không bị sửa** sau đó. Scan không chống được kẻ có quyền push registry đẩy image lạ lên; chữ ký thì có.
- **Admission policy**: điểm thực thi. Không có bước này, chữ ký chỉ để trang trí: ai có quyền {{kubectl apply}} vẫn chạy được image tuỳ ý.

### Luồng trong pipeline
~~~bash
IMAGE=registry.bank.vn/payment
# 1. Build + push, lấy digest (định danh bất biến; tag thì ghi đè được)
docker buildx build -t $IMAGE:1.8.0 --push --metadata-file meta.json .
REF=$IMAGE@$(jq -r '."containerimage.digest"' meta.json)
# 2. SBOM CycloneDX từ chính image (thấy cả gói OS lẫn jar)
syft $REF -o cyclonedx-json > sbom.cdx.json
# 3. Gate: chỉ fail với lỗ hổng nặng ĐÃ có bản vá
trivy image --severity CRITICAL,HIGH --ignore-unfixed --exit-code 1 $REF
# 4. Ký keyless: OIDC token của CI đổi lấy chứng chỉ ngắn hạn (Fulcio), chữ ký ghi vào log công khai (Rekor)
cosign sign --yes $REF
# 5. Gắn SBOM thành attestation đã ký, đi kèm image trong registry
cosign attest --yes --type cyclonedx --predicate sbom.cdx.json $REF
~~~
Trên GitHub Actions, job ký cần {{permissions: id-token: write}} để lấy OIDC token. Thay Trivy bằng Grype cũng được: {{grype sbom:sbom.cdx.json --fail-on high}} quét thẳng từ SBOM.

### Vì sao ký theo digest, vì sao keyless
- Chữ ký cosign gắn với **digest** (sha256 của manifest). Ký theo tag là vô nghĩa: tag bị ghi đè thì nó trỏ sang nội dung khác. Manifest Deployment cũng nên dùng digest; Kyverno có thể tự đổi tag thành digest đã verify ({{mutateDigest}}).
- **Keyless** nghĩa là không có private key dài hạn để bị lộ. Chứng chỉ ngắn hạn ghi **danh tính** người ký, ví dụ workflow {{https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main}}. Khi verify bạn bắt buộc đúng danh tính này, nên image ký từ nhánh feature hay từ laptop dev đều bị từ chối.
- Môi trường air-gapped không gọi được Fulcio/Rekor công khai: dùng cặp key nằm trong KMS/HSM (cosign hỗ trợ AWS KMS, GCP KMS, Azure Key Vault, HashiCorp Vault) hoặc tự dựng Sigstore nội bộ.

### Chặn ở admission (Kyverno)
~~~yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata: { name: require-signed-images }
spec:
  webhookTimeoutSeconds: 30
  rules:
    - name: verify-cosign
      match:
        any:
          - resources: { kinds: [Pod] }
      verifyImages:
        - imageReferences: ["registry.bank.vn/*"]
          failureAction: Enforce      # Kyverno bản cũ: spec.validationFailureAction
          mutateDigest: true          # thay tag bằng digest đã verify
          attestors:
            - entries:
                - keyless:
                    issuer: https://token.actions.githubusercontent.com
                    subject: https://github.com/bank/payment/.github/workflows/release.yml@refs/heads/main
~~~

### Ngưỡng scan hợp lý
| Kết quả quét | Hành động |
|---|---|
| CRITICAL/HIGH **có** bản vá | Fail build, nâng version rồi build lại |
| CRITICAL **chưa có** bản vá | Không chặn mù quáng: đánh giá khả năng khai thác, ghi ngoại lệ có **ngày hết hạn** và người duyệt |
| MEDIUM/LOW | Báo cáo, gom vào đợt nâng base image định kỳ |
| CVE mới trên image **đang chạy** | Quét lại SBOM đã lưu hằng ngày ({{trivy sbom}}, OWASP Dependency-Track), mở ticket cho owner |

### Pitfall production
- **Policy chỉ match registry nội bộ**: image từ {{docker.io}} không khớp {{imageReferences}} nên lọt qua không bị kiểm tra. Cần thêm rule chỉ cho phép registry nội bộ.
- **Build lại cho từng môi trường**: digest đổi, chữ ký không còn khớp. Build một lần, promote bằng cách copy nguyên manifest ({{cosign copy}} copy cả chữ ký và attestation).
- **Webhook là điểm lỗi**: Kyverno sập trong khi webhook ở chế độ fail-closed thì không tạo được Pod nào, kể cả lúc đang xử lý sự cố. Chạy Kyverno HA (≥ 3 replica), loại trừ namespace hệ thống, theo dõi độ trễ webhook.
- **SBOM từ Maven và SBOM từ image khác nhau**: plugin CycloneDX của Maven chỉ thấy dependency Java, không thấy glibc/openssl. Spring Boot 3.3+ có thể nhúng SBOM của ứng dụng vào jar và phơi qua {{/actuator/sbom}}; vẫn cần thêm SBOM của image cho phần OS.
- **Trivy tải DB lỗ hổng mỗi lần chạy**: pipeline chậm và hỏng khi mất mạng; cache hoặc mirror DB trong CI.

> Senior tip: thước đo thật là câu hỏi "CVE kiểu Log4Shell công bố lúc 9 giờ sáng — 9 giờ 30 bạn đã có danh sách service, version và namespace đang chạy thư viện đó chưa?". Chỉ SBOM lưu tập trung mới trả lời được. Khi bật policy, tôi chạy chế độ **Audit** 2–4 tuần để thấy ai vi phạm (thường là image bên thứ ba và sidecar), rồi mới chuyển **Enforce** theo từng namespace.`,
    follow: [
      'SLSA provenance khác chữ ký image ở điểm nào, và mức SLSA nào là thực tế cho team bạn?',
      'Một CVE CRITICAL chưa có bản vá xuất hiện trong base image ngay trước giờ release, bạn quyết định thế nào?',
      'Bạn xử lý image bên thứ ba (Redis, Kafka, sidecar) không do pipeline của bạn ký ra sao?'
    ],
    tags: ['supply chain', 'SBOM', 'CycloneDX', 'Syft', 'Trivy', 'cosign', 'Kyverno', 'Sigstore'],
    refs: [
      { type: 'doc', title: 'Sigstore documentation', url: 'https://docs.sigstore.dev/' },
      { type: 'doc', title: 'CycloneDX specification', url: 'https://cyclonedx.org/' },
      { type: 'doc', title: 'SLSA: Supply-chain Levels for Software Artifacts', url: 'https://slsa.dev/' }
    ]
  },
  {
    id: 'devops-032',
    topic: 'devops',
    level: 'mid',
    q: 'Image Spring Boot của team đang chạy trên một JDK image đầy đủ, nặng gần 500 MB và lần quét nào cũng báo hàng chục CVE. Bạn so sánh các lựa chọn base image cho Java: JRE thường (Ubuntu/Debian), distroless, runtime tự cắt bằng jlink, Alpine (musl). Bạn chọn cái nào, và đổi lại phải chịu gì khi cần debug trên production?',
    a: `**Tóm tắt:** Production chỉ cần **JRE**, không cần JDK (javac, jshell, công cụ build). Lộ trình hay dùng: JRE trên Debian/Ubuntu (dễ, có shell) → **distroless Java** (không shell, không package manager, ít CVE hệ điều hành) → **jlink** runtime chỉ gồm module ứng dụng cần, đặt trên base tối giản (nhỏ nhất nhưng dễ thiếu module lúc chạy). **Alpine** nhỏ nhưng dùng **musl** thay glibc, có thể làm vỡ thư viện native và đổi hành vi DNS, nên chỉ dùng khi đã test kỹ. Cái giá chung của image tối giản: không có shell để {{kubectl exec}} và không có jcmd/jstack, nên phải chuẩn bị cách debug từ trước.

### Image Java gồm những lớp gì
~~~text
+-----------------------------+  lớp ứng dụng: dependency jar, code (thay đổi thường xuyên)
+-----------------------------+  Java runtime: JDK (~300 MB) hoặc JRE hoặc runtime jlink (~60-80 MB)
+-----------------------------+  userland OS: libc, ca-certificates, tzdata, shell, apt/apk...
~~~
Phần lớn CVE mà scanner báo nằm ở **lớp OS**: càng ít gói thì càng ít CVE, càng ít công cụ cho kẻ tấn công dùng sau khi chiếm được container. Lớp ứng dụng (jar) thì base image nào cũng phải tự lo.

### So sánh
| Lựa chọn | Kích thước (ước lượng) | Debug | CVE OS | Rủi ro chính |
|---|---|---|---|---|
| {{eclipse-temurin:21-jdk}} | ~450 MB | đủ shell, jcmd, jstack | nhiều | chở thừa compiler và công cụ |
| {{eclipse-temurin:21-jre}} (Ubuntu) | ~250 MB | có shell, apt; **không có jcmd** | trung bình | vẫn có nhiều gói OS |
| {{gcr.io/distroless/java21-debian12}} | ~200 MB | không shell; tag {{:debug}} có busybox | ít | không chạy được {{sh -c}} |
| jlink runtime trên base tối giản | ~100–150 MB | tuỳ base | ít nhất | thiếu module, chỉ lộ ra lúc chạy |
| {{eclipse-temurin:21-jre-alpine}} | ~180 MB | có sh (busybox), apk | ít | musl: thư viện native, DNS |
Con số chỉ để định hướng; đo lại bằng {{docker images}} với image của bạn.

### jlink: cắt runtime theo đúng nhu cầu
~~~bash
# Trong stage build (eclipse-temurin:21-jdk). Tách jar Spring Boot (Boot 3.3+)
java -Djarmode=tools -jar app.jar extract --destination extracted
# Hỏi jdeps: ứng dụng + dependency dùng những module nào
jdeps --ignore-missing-deps -q --recursive --multi-release 21 --print-module-deps --class-path 'extracted/lib/*' extracted/app.jar > modules.txt
# Thêm module jdeps không thấy (nạp qua ServiceLoader/reflection), rồi tạo runtime
jlink --add-modules $(cat modules.txt),jdk.crypto.ec,jdk.management --strip-debug --no-man-pages --no-header-files --compress=zip-6 --output /opt/jre
~~~
- **Vì sao phải thêm module bằng tay**: jdeps phân tích bytecode tĩnh. Thứ nạp động thì nó không thấy: ví dụ trên JDK 21 thuật toán EC cho TLS nằm ở {{jdk.crypto.ec}} (từ JDK 22 đã gộp vào java.base) — thiếu nó thì handshake TLS hỏng **lúc chạy**, không phải lúc build. Bắt buộc có bộ test smoke (gọi HTTPS, kết nối DB, đọc locale) chạy trên chính image cuối.
- {{--compress=zip-6}} là cú pháp từ JDK 21; bản cũ dùng {{--compress=2}}.

### Distroless: những điều khác biệt
- Không có shell: ENTRYPOINT phải ở dạng exec, ví dụ {{["java", "-jar", "/app/app.jar"]}}, không dùng biến môi trường bên trong ENTRYPOINT được. Truyền tham số JVM qua biến {{JAVA_TOOL_OPTIONS}} hoặc {{JDK_JAVA_OPTIONS}} trong spec của Pod.
- preStop dạng {{sh -c "sleep 10"}} không chạy; dùng action {{sleep}} có sẵn của Kubernetes (bật mặc định từ 1.30).
- Dùng tag {{:nonroot}} để chạy với UID 65532 thay vì root.

### Debug khi không có shell
~~~bash
# Gắn ephemeral container có đủ công cụ, chung process namespace với container "app"
kubectl debug -it pod/payment-7d9f8-x2k4q --image=eclipse-temurin:21-jdk --target=app -- bash
# Bên trong: ps thấy process Java; jcmd chỉ attach được khi chạy cùng UID với process đó
~~~
Cách nhẹ nhàng hơn: bật Actuator {{threaddump}} và {{heapdump}} trên **management port riêng** không public, để lấy thread dump mà không cần công cụ nào trong image.

### Alpine và musl
- Temurin có bản build riêng cho Alpine, nên bản thân JVM chạy ổn.
- Rủi ro nằm ở **thư viện JNI** được biên dịch cho glibc (một số bản native transport của Netty, RocksDB, snappy cũ, font cho xuất PDF): lỗi {{UnsatisfiedLinkError}} lúc chạy.
- Resolver DNS của musl xử lý search domain và các option khác glibc (bỏ qua {{single-request-reopen}}) nên chẩn đoán DNS trên Kubernetes khó hơn.
- So với distroless, Alpine chỉ tiết kiệm vài chục MB mà thêm một biến số; với Java tôi không chọn trừ khi cả công ty đã chuẩn hoá nó.

### Pitfall production
- **Chuyển sang image JRE rồi mới phát hiện không có jcmd/jstack** đúng lúc cần thread dump giữa sự cố. Chuẩn bị trước: Actuator, ephemeral container, hoặc JFR bật sẵn ghi ra volume.
- **Không rebuild định kỳ**: base tối giản vẫn có CVE mới mỗi tháng. Pin base image theo digest để build tái lập được, và dùng Renovate/Dependabot tự mở PR nâng digest hằng tuần.
- **Heap dump ghi vào filesystem của container**: image nhỏ không cứu được một file dump 3 GB làm Pod vượt giới hạn ephemeral-storage.

> Senior tip: đổi từ JDK image sang distroless thường cắt số CVE mức OS từ vài chục xuống còn một con số — nhưng đó chỉ là phần dễ. Rủi ro thực tế thường nằm ở jar (Spring, Jackson, driver). Tôi trình bày với security team hai số tách biệt: CVE của base image (giải quyết bằng chọn base và rebuild định kỳ) và CVE của dependency (giải quyết bằng nâng version), để không ai nghĩ "đổi sang distroless là xong".`,
    follow: [
      'Làm sao lấy thread dump từ container distroless khi không có shell và không có jcmd?',
      'Vì sao một thư viện native chạy tốt trên Debian nhưng báo UnsatisfiedLinkError trên Alpine?',
      'CDS/AppCDS ảnh hưởng thế nào đến thời gian khởi động và cách bạn đóng gói image?'
    ],
    tags: ['Docker', 'distroless', 'jlink', 'Alpine', 'musl', 'base image', 'CVE'],
    refs: [
      { type: 'doc', title: 'The jlink Command (Java 21)', url: 'https://docs.oracle.com/en/java/javase/21/docs/specs/man/jlink.html' },
      { type: 'doc', title: 'Distroless container images', url: 'https://github.com/GoogleContainerTools/distroless' }
    ]
  },
  {
    id: 'devops-033',
    topic: 'devops',
    level: 'senior',
    q: 'Team 6 người cùng quản lý hạ tầng AWS bằng Terraform, file state nằm trên laptop và được commit vào Git. Một hôm hai người apply gần như cùng lúc, sau đó plan đòi tạo mới con RDS đang chạy. Bạn giải thích chuyện gì đã xảy ra, rồi tổ chức lại remote state, lock, review plan trong PR, phát hiện drift và tách module/môi trường thế nào?',
    a: `**Tóm tắt:** State là "bản đồ" nối code Terraform với tài nguyên thật. Có hai bản đồ song song (laptop và Git) và không có lock, nên apply của người sau **ghi đè** state của người trước: Terraform "quên" mất RDS và muốn tạo mới. Cách sửa: **remote backend** (S3 bật versioning, mã hoá) với **lock**, chỉ **CI** được apply đúng **plan đã review** trong PR, **tách state theo môi trường và theo thành phần** để thu nhỏ blast radius, và chạy plan định kỳ để **phát hiện drift**.

### State là gì và vì sao quan trọng
- Terraform không tự biết tài nguyên nào trên AWS do nó quản lý. Nó đọc state: địa chỉ {{aws_db_instance.main}} ↔ ID thật {{payment-prod-db}} kèm toàn bộ thuộc tính.
- {{terraform plan}} so sánh ba thứ: **code** (mong muốn), **state** (lần trước biết gì) và **thực tế** (refresh qua API AWS).
- State có số **serial** tăng sau mỗi lần ghi. State còn chứa giá trị nhạy cảm ở dạng plain text (password, output), nên **không bao giờ** được commit vào Git.

### Chuyện gì đã xảy ra
~~~text
09:00  An và Bình cùng có state serial 40 (từ Git)
09:10  An apply: tạo RDS, state trên laptop An -> serial 41 (có RDS). An chưa push.
09:12  Bình apply: thêm security group, dựa trên serial 40 -> state của Bình (không có RDS)
09:20  Bình push state lên Git trước; An pull về bị conflict, chọn "bản của Bình"
=> state không còn aws_db_instance.main; RDS vẫn chạy trên AWS
=> plan: + aws_db_instance.main will be created (sẽ lỗi trùng tên, hoặc tạo DB thứ hai)
~~~
Khắc phục ngay: **không apply**; đưa RDS về lại state bằng {{terraform import}} hoặc khối {{import}} (Terraform 1.5+), rồi plan phải sạch.

### Remote backend và lock
~~~text
terraform {
  backend "s3" {
    bucket       = "bank-tfstate-prod"
    key          = "payment/prod/terraform.tfstate"
    region       = "ap-southeast-1"
    encrypt      = true
    use_lockfile = true   # lock bằng file .tflock trên S3 (Terraform 1.10+)
    # cấu hình cũ: dynamodb_table = "tf-locks" (đang bị deprecate)
  }
}
~~~
- Bucket bật **versioning** (quay lại state cũ khi hỏng), chặn public, mã hoá KMS, chỉ role của CI và tài khoản break-glass được ghi.
- Người thứ hai chạy apply sẽ gặp {{Error acquiring the state lock}} kèm Lock ID, ai giữ, từ lúc nào. Chỉ dùng {{terraform force-unlock}} khi **chắc chắn** tiến trình giữ lock đã chết (ví dụ job CI bị kill).

### Quy trình review plan trong PR
~~~bash
terraform fmt -check && terraform validate
terraform plan -input=false -lock-timeout=5m -out=tfplan
terraform show -no-color tfplan > plan.txt            # đăng lên PR cho reviewer đọc
# Đếm resource bị xoá hoặc thay thế: > 0 thì bắt buộc thêm người duyệt
terraform show -json tfplan | jq '[.resource_changes[] | select(.change.actions | index("delete"))] | length'
~~~
1. Reviewer đọc **plan**, không chỉ đọc diff code: một dòng đổi tên trong code có thể sinh {{must be replaced}} (xoá rồi tạo lại) cho một database.
2. Sau khi merge, CI apply **đúng file plan đã review** ({{terraform apply tfplan}}). Nếu state đã thay đổi kể từ lúc plan, Terraform từ chối plan cũ và bắt plan lại. Atlantis là cách phổ biến để tự động hoá vòng plan/apply qua comment PR.
3. CI chỉ cho **một job mỗi state** chạy cùng lúc (concurrency group); lock là lớp bảo vệ cuối, không phải lớp duy nhất.
4. Con người không có quyền ghi vào môi trường prod; quyền khẩn cấp (break-glass) có audit.

### Phát hiện và xử lý drift
- **Drift** = thực tế khác code/state, thường do ai đó sửa tay trên console lúc sự cố.
- Job hằng đêm chạy {{terraform plan -detailed-exitcode}}: exit code 2 nghĩa là có thay đổi → cảnh báo. {{terraform plan -refresh-only}} chỉ cho xem những gì thay đổi từ bên ngoài.
- Xử lý: thay đổi đúng thì **đưa vào code**; sai thì apply để ghi đè lại. Thuộc tính do hệ thống khác quản lý (số task do autoscaling chỉnh) thì khai báo {{ignore_changes}} trong khối lifecycle.

### Tách module và môi trường
~~~text
modules/                 # module dùng chung, phát hành theo git tag (v1.4.0, v1.5.0)
  rds/  vpc/  eks-service/
envs/
  dev/network/   dev/payment/      # mỗi thư mục = một state riêng
  prod/network/  prod/payment/     # prod pin module ?ref=v1.4.0, dev thử v1.5.0 trước
~~~
- State nhỏ theo thành phần: plan nhanh, lock ít tranh chấp, apply lỗi chỉ ảnh hưởng một phần.
- **Workspace CLI** dùng chung backend và credentials; tài liệu HashiCorp khuyên không dùng nó để tách các môi trường cần quyền khác nhau. Prod nên nằm ở **AWS account riêng**.

| Rủi ro | Biện pháp |
|---|---|
| Hai apply cùng lúc | Lock + concurrency của CI |
| State hỏng hoặc mất | Versioning S3, không sửa state bằng tay, {{terraform state pull}} để backup trước thao tác state |
| Xoá nhầm database | {{prevent_destroy}} trong lifecycle, {{deletion_protection = true}} trên RDS, gate khi plan có delete |
| Đổi tên resource làm destroy/create | Khối {{moved}} (Terraform 1.1+) |
| Lộ secret qua state | {{manage_master_user_password = true}} để RDS tự giữ password trong Secrets Manager; hạn chế quyền đọc bucket |

### Pitfall production
- Không commit {{.terraform.lock.hcl}} và không pin version provider: máy mỗi người plan ra kết quả khác nhau.
- {{force-unlock}} trong khi job kia vẫn chạy: hai tiến trình cùng ghi state.
- Một state khổng lồ hàng nghìn resource: plan mất 15 phút, chạm rate limit API AWS, ai cũng ngại chạy nên drift tích tụ.

> Senior tip: tôi đặt luật cứng: **plan có delete hoặc replace trên tài nguyên stateful** (RDS, S3, EBS, DynamoDB) thì cần hai người duyệt và phải ghi rõ lý do trong PR. Luật đơn giản này chặn được kiểu sự cố "đổi một tham số nhỏ khiến database bị tạo lại" — loại sự cố mà backup cũng không cứu kịp RPO.`,
    follow: [
      'Bạn đưa một tài nguyên đã tạo tay trên console vào Terraform quản lý thế nào mà không phải tạo lại?',
      'Khi nào dùng terraform_remote_state, khi nào nên chia sẻ giá trị qua SSM Parameter Store?',
      'So sánh Terraform với OpenTofu hoặc AWS CDK khi chọn công cụ IaC cho tổ chức?'
    ],
    tags: ['Terraform', 'IaC', 'state', 'lock', 'drift', 'S3 backend'],
    refs: [
      { type: 'doc', title: 'Terraform Backend Type: s3', url: 'https://developer.hashicorp.com/terraform/language/backend/s3' },
      { type: 'doc', title: 'Terraform State Locking', url: 'https://developer.hashicorp.com/terraform/language/state/locking' }
    ]
  },
  {
    id: 'devops-034',
    topic: 'devops',
    level: 'senior',
    q: 'Service Java gọi sang API đối tác qua HTTPS. Lúc cao điểm, một Pod tràn lỗi "Too many open files", Pod khác báo "java.net.BindException: Cannot assign requested address", và node có hàng chục nghìn socket TIME_WAIT. Bạn chẩn đoán bằng ss, lsof, ulimit, /proc thế nào, và sửa ở tầng nào: code, JVM, OS hay hạ tầng?',
    a: `**Tóm tắt:** Hai lỗi khác nhau nhưng thường chung một gốc: **code mở kết nối mới cho mỗi request** hoặc **không đóng tài nguyên**. "Too many open files" (EMFILE) là process chạm giới hạn **file descriptor** — mỗi socket cũng là một fd. "Cannot assign requested address" (EADDRNOTAVAIL) là hết **ephemeral port** để mở kết nối ra cùng một đích, vì socket đã đóng còn nằm ở **TIME_WAIT 60 giây**. Chẩn đoán: đếm fd theo loại ({{/proc/PID/fd}}, lsof) và đếm socket theo trạng thái, theo đích ({{ss}}). Sửa gốc ở code (dùng chung client, connection pool, đóng response); tăng ulimit hay chỉnh sysctl chỉ là nới biên.

### Kiến thức nền
- Mọi thứ process mở (file, socket, pipe, epoll) là một **file descriptor**. Giới hạn cho từng process là soft/hard limit {{RLIMIT_NOFILE}} ({{ulimit -n}}). HotSpot trên Linux mặc định tự nâng soft limit lên bằng hard limit khi khởi động, nên con số quyết định là **hard limit**.
- Một kết nối TCP được xác định bởi bộ 4 (IP nguồn, port nguồn, IP đích, port đích). Gọi tới **cùng một đích** IP:443 thì chỉ còn port nguồn thay đổi, lấy từ dải {{net.ipv4.ip_local_port_range}} — mặc định 32768–60999, khoảng **28 nghìn port**.
- **TIME_WAIT** nằm ở phía **đóng kết nối trước**, và trên Linux kéo dài cố định **60 giây**. Nó không chỉnh được bằng {{tcp_fin_timeout}} — tham số đó dành cho FIN_WAIT_2, đây là nhầm lẫn rất phổ biến.
- Phép tính: 28 nghìn port / 60 giây ≈ **470 kết nối mới mỗi giây** tới một đích. Service 800 RPS mở kết nối mới cho mỗi lần gọi đối tác sẽ cạn port sau chưa tới một phút.
- **CLOSE_WAIT**: phía bên kia đã đóng nhưng **app chưa gọi close**. Số CLOSE_WAIT tăng dần gần như luôn là bug trong app (response body không được đọc hết/đóng) và là một dạng rò fd.

### Chẩn đoán từng bước
~~~bash
PID=$(pgrep -f payment.jar)                        # trong container thường là 1
grep -i "open files" /proc/$PID/limits             # soft/hard THẬT của process
ls /proc/$PID/fd | wc -l                           # số fd đang mở
lsof -nP -p $PID | awk '{print $5}' | sort | uniq -c | sort -rn | head   # theo loại: IPv4, REG, FIFO
ss -s                                              # tổng quan socket theo trạng thái
ss -tan state time-wait | wc -l
ss -tan state close-wait | wc -l
ss -tan state time-wait | awk '{print $4}' | sort | uniq -c | sort -rn | head   # đích bị mở/đóng nhiều nhất
sysctl net.ipv4.ip_local_port_range net.ipv4.tcp_tw_reuse
cat /proc/sys/fs/file-nr                           # fd toàn hệ thống: đã cấp / rảnh / tối đa
~~~
| Quan sát | Kết luận |
|---|---|
| Số fd tăng đều theo giờ, nhiều dòng REG trỏ cùng một file | Rò file: stream mở không có try-with-resources |
| Nhiều CLOSE_WAIT tới IP đối tác | Không đóng response/connection |
| Hàng chục nghìn TIME_WAIT tới cùng IP:443, ít ESTABLISHED | Mỗi request một kết nối mới, không reuse |
| ESTABLISHED rất nhiều và ổn định | Pool quá lớn hoặc đối tác chậm: giới hạn pool, đặt timeout |

### Code gây lỗi điển hình
~~~java
// SAI: mỗi request tạo HttpClient mới -> pool mới, kết nối TCP + TLS handshake mới, không reuse
public Quote fetch(String id) throws Exception {
    HttpClient client = HttpClient.newHttpClient();
    return parse(client.send(request(id), HttpResponse.BodyHandlers.ofString()).body());
}

// ĐÚNG: một client dùng chung (thread-safe), keep-alive giữ và tái sử dụng kết nối
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();

// Rò fd kiểu khác: Files.lines giữ file mở tới khi stream được close
try (Stream<String> lines = Files.lines(path)) {
    return lines.filter(l -> l.startsWith("ERR")).count();
}
~~~
Với Spring, tạo **một** bean {{RestClient}}/{{WebClient}} cấu hình pool rồi inject; với Apache HttpClient thì luôn đóng response hoặc đọc hết entity để kết nối được trả về pool.

### Sửa ở đâu
| Tầng | Việc cần làm | Ghi chú |
|---|---|---|
| Code | Dùng chung client, pool có giới hạn, timeout, đóng response | Sửa gốc |
| Giới hạn process | systemd: {{LimitNOFILE=65536}} trong unit; Docker: {{--ulimit nofile=65536:65536}}; Kubernetes: Pod spec **không có** field ulimit, giá trị đến từ container runtime trên node | {{/etc/security/limits.conf}} chỉ áp cho phiên đăng nhập qua PAM, **không** áp cho service systemd |
| Kernel | Mở rộng {{ip_local_port_range}}; {{tcp_tw_reuse=1}} cho phép kết nối **đi ra** tái dùng socket TIME_WAIT (cần TCP timestamps) | Đừng tìm {{tcp_tw_recycle}}: đã bị xoá từ kernel 4.12 vì làm hỏng client đứng sau NAT |
| Hạ tầng | NAT Gateway cũng có trần: AWS NAT Gateway hỗ trợ khoảng 55.000 kết nối đồng thời tới mỗi đích duy nhất, vượt thì metric {{ErrorPortAllocation}} tăng | Nhiều Pod sau một NAT cùng gọi một đối tác |

Trong Kubernetes, {{ip_local_port_range}} thuộc nhóm sysctl "safe", đặt được ngay trong Pod:
~~~yaml
spec:
  securityContext:
    sysctls:
      - name: net.ipv4.ip_local_port_range
        value: "10240 65000"
~~~
{{tcp_tw_reuse}} thì không thuộc nhóm safe: phải bật {{--allowed-unsafe-sysctls}} trên kubelet hoặc chỉnh ở node.

### Pitfall production
- **Tăng ulimit lên 1 triệu để "hết lỗi"**: rò rỉ vẫn còn, chỉ nổ muộn hơn, và lúc đó có thể kéo cả node hết bộ nhớ kernel cho socket.
- **Lo TIME_WAIT ở phía server**: server đóng trước thì server giữ TIME_WAIT, nhưng port server cố định (8080) nên không bị hết port; chỉ tốn một ít RAM.
- **Keep-alive nhưng idle timeout của client dài hơn của đối tác hoặc load balancer**: client dùng lại kết nối mà phía kia đã đóng, nhận "Connection reset". Đặt idle timeout phía client ngắn hơn (LB 60 giây thì client khoảng 50 giây).
- **Conntrack đầy** trên node Kubernetes ({{nf_conntrack: table full}} trong dmesg) cho triệu chứng giống hết port nhưng là giới hạn khác.

> Senior tip: đưa {{process_files_open_files}} và {{process_files_max_files}} (Micrometer xuất sẵn qua Actuator) lên dashboard và cảnh báo khi vượt 80% — rò fd luôn là đường tăng dần đều nhiều giờ trước khi nổ, phát hiện sớm thì chỉ cần một bản sửa thường thay vì hotfix nửa đêm. Với lỗi hết port, tôi luôn hỏi một câu trước tiên: "client HTTP được tạo ở đâu, bao nhiêu lần?".`,
    follow: [
      'Vì sao TIME_WAIT tồn tại, và tắt nó bằng SO_LINGER = 0 gây rủi ro gì?',
      'Bạn chọn kích thước connection pool tới API đối tác thế nào khi đối tác giới hạn 200 kết nối đồng thời?',
      'Trong Kubernetes, conntrack table đầy biểu hiện ra sao và khác hết ephemeral port ở điểm nào?'
    ],
    tags: ['Linux', 'file descriptor', 'ulimit', 'TIME_WAIT', 'ephemeral port', 'ss', 'lsof'],
    refs: [
      { type: 'doc', title: 'ss(8) - Linux manual page', url: 'https://man7.org/linux/man-pages/man8/ss.8.html' },
      { type: 'doc', title: 'IP Sysctl - The Linux Kernel documentation', url: 'https://docs.kernel.org/networking/ip-sysctl.html' }
    ]
  },
  {
    id: 'devops-035',
    topic: 'devops',
    level: 'mid',
    q: 'Service Spring Boot trên Kubernetes gọi API api.partner.com: p99 thường khoảng 120 ms nhưng thỉnh thoảng nhảy lên đúng chừng 5 giây, và log CoreDNS đầy truy vấn NXDOMAIN kiểu api.partner.com.payments.svc.cluster.local. Giải thích cơ chế search domain và ndots:5, vì sao lại là 5 giây, và bạn sửa thế nào?',
    a: `**Tóm tắt:** Trong Pod, file {{/etc/resolv.conf}} có danh sách **search domain** và {{options ndots:5}}: tên có **ít hơn 5 dấu chấm** bị coi là "tên tương đối", nên resolver ghép lần lượt với từng search domain **trước** khi hỏi tên gốc. {{api.partner.com}} chỉ có 2 dấu chấm nên một lần phân giải sinh 4–5 lượt hỏi, mỗi lượt cả bản ghi A và AAAA, phần lớn trả NXDOMAIN. Càng nhiều gói UDP thì càng dễ có gói bị rớt; rớt một gói là resolver của glibc chờ hết **timeout mặc định 5 giây** rồi mới gửi lại — đó là con số 5 giây. Sửa: giảm ndots cho Pod hay gọi ra ngoài, bật **NodeLocal DNSCache**, dùng chung connection pool và cache DNS hợp lý trong JVM, đủ replica CoreDNS.

### resolv.conf trong Pod trông thế nào
~~~text
nameserver 10.96.0.10          # ClusterIP của Service kube-dns (CoreDNS)
search payments.svc.cluster.local svc.cluster.local cluster.local ap-southeast-1.compute.internal
options ndots:5
~~~
- Ba search domain đầu do Kubernetes thêm (namespace của Pod là {{payments}}); cái cuối thừa hưởng từ node (ví dụ EC2).
- **Vì sao Kubernetes chọn ndots:5**: để tên ngắn như {{orders}}, {{orders.shop}}, {{orders.shop.svc}} đều phân giải được nhờ search list. Cái giá là tên miền bên ngoài cũng bị đem đi ghép.

### Quy tắc của resolver và số truy vấn thực tế
Nếu tên có **số dấu chấm ≥ ndots** thì hỏi tên gốc trước; ngược lại thì thử search list trước, cuối cùng mới hỏi tên gốc.
~~~text
api.partner.com.payments.svc.cluster.local        A + AAAA -> NXDOMAIN
api.partner.com.svc.cluster.local                 A + AAAA -> NXDOMAIN
api.partner.com.cluster.local                     A + AAAA -> NXDOMAIN
api.partner.com.ap-southeast-1.compute.internal   A + AAAA -> NXDOMAIN (đi ra resolver của VPC)
api.partner.com                                   A + AAAA -> trả về IP
=> 10 truy vấn cho một lần phân giải, 8 truy vấn vô ích
~~~

### Vì sao đúng 5 giây
1. glibc gửi truy vấn A và AAAA **song song từ cùng một socket UDP**.
2. Trên node dùng kube-proxy chế độ iptables, gói tới ClusterIP của DNS đi qua DNAT và bảng **conntrack**. Hai gói gần như đồng thời có thể "đua" nhau khi tạo bản ghi conntrack, và một gói bị drop.
3. Resolver không nhận được trả lời, chờ hết {{timeout}} (mặc định 5 giây) mới gửi lại → request HTTP chậm thêm đúng khoảng 5 giây.
4. Càng nhiều truy vấn thừa thì xác suất trúng một lần drop càng cao, vì vậy p99 có một "đuôi" 5 giây.

Nguyên nhân phụ: CoreDNS thiếu replica; còn trên AWS, resolver của VPC giới hạn khoảng 1024 gói/giây cho mỗi network interface — "bão NXDOMAIN" từ nhiều Pod trên cùng node chạm trần này.

### JVM cache DNS thế nào
- Java phân giải qua resolver của hệ điều hành, nên chịu đúng quy tắc search/ndots ở trên.
- {{InetAddress}} cache kết quả thành công **30 giây** theo mặc định (khi không có security manager) và kết quả thất bại 10 giây. Chỉnh bằng property {{networkaddress.cache.ttl}} trong file {{java.security}} hoặc {{Security.setProperty}} lúc khởi động.
- **Đừng** cache vĩnh viễn (TTL -1): khi đối tác hay AWS load balancer đổi IP, app tiếp tục gọi IP cũ tới khi restart.
- Connection pool có keep-alive giảm số lần phân giải: kết nối được dùng lại thì không cần hỏi DNS.

### Cách sửa
~~~yaml
spec:
  dnsConfig:
    options:
      - name: ndots
        value: "2"                    # tên có >= 2 dấu chấm: hỏi tên gốc trước
      - name: single-request-reopen   # glibc: giảm lỗi do A/AAAA dùng chung socket (musl bỏ qua option này)
~~~
| Cách | Tác dụng | Lưu ý |
|---|---|---|
| ndots 2 cho Pod chủ yếu gọi ra ngoài | Bỏ 8 truy vấn thừa với {{api.partner.com}} | {{orders}}, {{orders.shop}} vẫn đi search list; dạng {{orders.shop.svc}} sẽ hỏi ra ngoài trước rồi mới search — nên cấu hình tên đầy đủ {{orders.shop.svc.cluster.local}} |
| FQDN có dấu chấm cuối {{api.partner.com.}} | Không ghép search domain | Một số HTTP client đưa dấu chấm vào Host/SNI làm sai chứng chỉ hoặc virtual host; thường chỉ dùng cho tên nội bộ |
| NodeLocal DNSCache | Cache DNS ngay trên mỗi node, Pod hỏi qua địa chỉ link-local và không đi qua conntrack | Thêm một DaemonSet phải vận hành |
| CoreDNS: đủ replica (autoscaler), plugin {{cache}}, plugin {{autopath}} | {{autopath}} để CoreDNS tự thử search list phía server, client chỉ gửi một truy vấn | {{autopath}} cần chế độ {{pods verified}}, tốn thêm RAM để theo dõi Pod |
| Pool keep-alive + JVM TTL 30–60 giây | Giảm tần suất phân giải | Không thay được các cách trên |

### Kiểm chứng
~~~bash
kubectl exec -it payment-7d9f8-x2k4q -- cat /etc/resolv.conf
# netshoot có dig; +search dùng search list, +showsearch in từng bước ghép
kubectl debug -it pod/payment-7d9f8-x2k4q --image=nicolaka/netshoot -- dig +search +showsearch api.partner.com
~~~
Trên Prometheus, theo dõi {{coredns_dns_responses_total}} theo nhãn {{rcode}} (tỷ lệ NXDOMAIN) và {{coredns_dns_request_duration_seconds}}.

### Pitfall production
- **Image Alpine (musl)** xử lý search/ndots và các option khác glibc, nên cùng một cấu hình mà hành vi khác; luôn kiểm chứng trên đúng image.
- **Đặt ndots 1 cho cả cluster**: tên dạng {{orders.shop}} bị hỏi ra resolver bên ngoài trước — thêm độ trễ và làm lộ tên dịch vụ nội bộ ra ngoài.
- **Đổ lỗi cho đối tác**: trace chỉ cho thấy "HTTP client chậm 5 giây". Bật log/metric thời gian phân giải hoặc tách span DNS để nhìn thấy nó.

> Senior tip: với cluster chưa tối ưu, NXDOMAIN thường chiếm phần lớn lưu lượng CoreDNS — hãy nhìn tỷ lệ này trước khi tăng replica. Khi thấy độ trễ **đúng bội số của 5 giây** (5 s, 10 s), nghĩ ngay tới timeout của resolver DNS; khi thấy đúng 1 hoặc 3 giây, nghĩ tới TCP SYN retransmit. Con số "tròn" là manh mối mạnh nhất trong chẩn đoán mạng.`,
    follow: [
      'NodeLocal DNSCache hoạt động thế nào và vì sao nó tránh được race conntrack?',
      'Vì sao để JVM cache DNS vĩnh viễn là nguy hiểm khi gọi tới AWS ALB hoặc RDS sau failover?',
      'Bạn phân biệt độ trễ do DNS với độ trễ do TLS handshake hoặc chờ connection pool trong trace thế nào?'
    ],
    tags: ['Kubernetes', 'DNS', 'CoreDNS', 'ndots', 'conntrack', 'latency'],
    refs: [
      { type: 'doc', title: 'DNS for Services and Pods', url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' },
      { type: 'doc', title: 'Using NodeLocal DNSCache in Kubernetes Clusters', url: 'https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/' }
    ]
  },
  {
    id: 'devops-036',
    topic: 'devops',
    level: 'senior',
    q: 'Một node thiếu RAM lúc nửa đêm: Pod của service thanh toán (Java, memory request 1Gi, limit 4Gi, thực dùng 3Gi) bị Evicted dù chưa chạm limit, còn Pod batch không khai báo resources của team khác vẫn sống. Giải thích QoS class, thứ tự node-pressure eviction so với OOM killer, PriorityClass; rồi bạn đặt requests/limits cho service Java thế nào để chuyện này không lặp lại?',
    a: `**Tóm tắt:** Kubernetes có **hai cơ chế giết Pod vì RAM**. (1) Container vượt **memory limit** của chính nó → kernel OOM-kill trong cgroup (OOMKilled, exit 137). (2) **Node** thiếu RAM tổng → kubelet **evict** Pod theo thứ tự: Pod **dùng vượt request** trước, rồi theo **Priority**, rồi theo **mức vượt request**. Payment xin 1Gi nhưng dùng 3Gi, vượt 2Gi — nhiều hơn hẳn Pod batch — nên đứng đầu danh sách. Với Java, memory không nén được: tôi đặt **memory request = limit**, heap theo phần trăm limit, CPU request theo mức dùng thật, gán **PriorityClass** cao cho service quan trọng, và khai báo ephemeral-storage.

### QoS class
| Class | Điều kiện | oom_score_adj | Ý nghĩa |
|---|---|---|---|
| Guaranteed | Mọi container đặt request = limit cho **cả** CPU và memory | -997 | OOM killer của kernel chọn sau cùng |
| Burstable | Có ít nhất một request/limit nhưng không đủ điều kiện Guaranteed | 2…999 (memory request càng lớn so với RAM node thì càng thấp) | Phổ biến nhất |
| BestEffort | Không đặt request/limit nào | 1000 | OOM killer chọn đầu tiên |

### Hai cơ chế, hai triệu chứng
~~~text
Container dùng > memory limit             Node: memory.available < 100Mi (ngưỡng hard mặc định)
  -> OOM killer trong cgroup                 -> kubelet chọn Pod để evict
  -> container RESTART, OOMKilled, exit 137  -> Pod Failed, reason Evicted; ReplicaSet tạo Pod mới
  -> xem: kubectl describe pod (Last State)  -> xem: kubectl get events ("The node was low on resource: memory")
~~~
Nếu RAM cạn quá nhanh, trước khi kubelet kịp evict, OOM killer của kernel ở mức **toàn node** sẽ ra tay theo {{oom_score_adj}} — lúc đó QoS class quyết định trực tiếp ai chết.

### Thứ tự eviction khi node thiếu memory
1. Pod có usage **vượt request** bị xét trước.
2. Trong nhóm đó, Pod có **Priority thấp hơn** bị đuổi trước.
3. Cùng priority thì Pod **vượt request nhiều hơn** bị đuổi trước.

| Pod | Request | Usage thật | Vượt request |
|---|---|---|---|
| payment | 1Gi | 3Gi | **+2Gi → bị đuổi đầu tiên** |
| batch (BestEffort) | 0 | 0.5Gi | +0.5Gi |
| report | 2Gi | 1.5Gi | không vượt → gần như an toàn |
Đó là lý do BestEffort **không phải lúc nào** cũng chết trước: một Pod Burstable "xin ít, dùng nhiều" còn nguy hiểm hơn. Pod dùng dưới request gần như không bao giờ bị evict vì memory.

Thêm một điều quan trọng: với ngưỡng **hard eviction**, kubelet giết Pod **ngay**, không chờ graceful shutdown — request đang xử lý của Java bị cắt ngang.

### PriorityClass
~~~yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: business-critical }
value: 100000
preemptionPolicy: PreemptLowerPriority
description: "payment, auth: xếp lịch trước, bị evict sau"
---
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata: { name: batch-low }
value: 1000
preemptionPolicy: Never      # chờ chỗ trống, không đá Pod khác
~~~
- Priority tác động ở **hai nơi**: (a) scheduler **preemption** — Pod ưu tiên cao đang Pending được đuổi Pod thấp hơn để lấy chỗ (PDB chỉ được tôn trọng ở mức cố gắng); (b) thứ tự eviction ở trên.
- Không gán {{system-cluster-critical}}/{{system-node-critical}} cho ứng dụng. Dùng ResourceQuota theo PriorityClass để team không tự gán "critical" cho mọi thứ.

### Đặt resources cho service Java
~~~yaml
priorityClassName: business-critical
containers:
  - name: app
    resources:
      requests: { cpu: "1", memory: 3Gi, ephemeral-storage: 1Gi }
      limits:   { memory: 3Gi, ephemeral-storage: 2Gi }   # memory request = limit, không đặt CPU limit
    env:
      - name: JAVA_TOOL_OPTIONS
        value: "-XX:MaxRAMPercentage=70 -XX:ActiveProcessorCount=2 -XX:+ExitOnOutOfMemoryError"
~~~
- **Memory request = limit**: Pod không bao giờ dùng vượt request, nên không bao giờ đứng đầu hàng eviction vì memory. Nếu app phình quá limit thì bị OOMKilled — lỗi của chính nó, dễ thấy, không kéo theo Pod khác. Java dùng heap + metaspace + thread stack + code cache + direct buffer, nên heap chỉ nên khoảng 65–75% limit.
- **CPU** nén được (bị throttle chứ không bị giết). Request theo mức p90–p95 thường ngày. Bỏ CPU limit giúp tránh throttling khi JIT, GC và lúc khởi động bùng CPU; khi đó JVM thấy toàn bộ CPU của node nên phải đặt {{ActiveProcessorCount}}. Nếu cần cô lập chặt thì đặt CPU limit = request để thành Guaranteed.
- **ephemeral-storage**: log ghi file, heap dump vào filesystem container. Một file heap dump 3Gi vượt limit ephemeral-storage làm Pod bị evict; node hết đĩa thì kubelet evict hàng loạt.

### Pitfall production
- **Request thấp, limit cao** ("overcommit cho tiết kiệm"): scheduler xếp quá nhiều Pod lên node vì chỉ nhìn request → node pressure trở thành chuyện hằng đêm.
- **Pod Evicted nằm lại** ở trạng thái Failed và chỉ được dọn khi vượt ngưỡng {{terminated-pod-gc-threshold}} (mặc định 12500) — danh sách Pod rối, dễ đọc nhầm khi điều tra.
- **Mọi service đều gán priority cao**: priority mất ý nghĩa, preemption đá nhau lung tung.

> Senior tip: mỗi tuần tôi xem tỷ lệ **usage/request memory** theo Pod (dùng VPA ở chế độ {{updateMode: "Off"}} chỉ để lấy gợi ý). Pod nào thường xuyên trên 100% là ứng viên bị evict tiếp theo — sửa request trước khi node thiếu RAM lúc 2 giờ sáng sửa giúp bạn.`,
    follow: [
      'Vì sao nhiều team bỏ CPU limit cho service Java, và rủi ro noisy neighbor khi làm vậy là gì?',
      'Preemption theo PriorityClass tương tác với PodDisruptionBudget và cluster autoscaler thế nào?',
      'Dùng VPA và HPA cùng lúc trên một Deployment gặp vấn đề gì?'
    ],
    tags: ['Kubernetes', 'QoS', 'eviction', 'PriorityClass', 'requests', 'limits', 'OOMKilled'],
    refs: [
      { type: 'doc', title: 'Node-pressure Eviction', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/' },
      { type: 'doc', title: 'Pod Quality of Service Classes', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/' },
      { type: 'doc', title: 'Pod Priority and Preemption', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/' }
    ]
  },
  {
    id: 'devops-037',
    topic: 'devops',
    level: 'lead',
    q: 'Bạn là tech lead platform cho service thanh toán chạy trên Kubernetes và sắp bị audit PCI DSS: chỉ đúng các luồng mạng cần thiết được phép, còn mật khẩu DB và API key của cổng thanh toán không được nằm trong Git hay lộ qua kubectl. Bạn thiết kế NetworkPolicy default-deny cho cả ingress lẫn egress thế nào, và chọn giữa External Secrets Operator, Vault, Sealed Secrets ra sao?',
    a: `**Tóm tắt:** Mạng: trong namespace {{payments}} đặt **default-deny cả ingress và egress**, rồi mở từng luồng theo label: ingress controller → payment-api:8080, payment-api → DNS, → PostgreSQL:5432, → Kafka, → cổng thanh toán. NetworkPolicy chuẩn **không lọc theo tên miền**, nên egress ra internet đi qua một **egress proxy/gateway** hoặc CNI có policy FQDN (Cilium). Secret: nguồn sự thật đặt ở **secret manager** (AWS Secrets Manager hoặc Vault), đưa vào cluster bằng **External Secrets Operator** (đồng bộ thành Secret) hoặc **Vault Agent/CSI** (không qua etcd, có credential động). **Sealed Secrets** hợp GitOps nhỏ nhưng yếu về rotation và audit. Bổ sung: mã hoá etcd bằng KMS, RBAC chặt quyền đọc secrets, mount secret dạng file.

### NetworkPolicy hoạt động thế nào
- Mặc định Pod **không bị cô lập**: nhận và gửi mọi traffic. Khi có ít nhất một policy chọn Pod với policyType Ingress (hoặc Egress), chiều đó chỉ cho phép phần **hợp (union)** của mọi rule liệt kê. API chuẩn không có rule "deny": chỉ có "cô lập rồi mở dần".
- Policy chỉ có tác dụng khi **CNI thực thi** nó (Calico, Cilium, AWS VPC CNI đã bật network policy…). CNI không hỗ trợ thì {{kubectl apply}} vẫn thành công nhưng không chặn gì — phải kiểm chứng bằng test thật.

~~~yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: default-deny-all, namespace: payments }
spec:
  podSelector: {}                   # mọi Pod trong namespace
  policyTypes: [Ingress, Egress]    # không có rule nào = chặn cả hai chiều
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: { name: payment-api, namespace: payments }
spec:
  podSelector: { matchLabels: { app: payment-api } }
  policyTypes: [Ingress, Egress]
  ingress:
    - from:
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: ingress-nginx } }
          podSelector: { matchLabels: { app.kubernetes.io/name: ingress-nginx } }   # cùng một phần tử = AND
      ports: [{ protocol: TCP, port: 8080 }]
  egress:
    - to:                           # DNS: quên mở là mọi cuộc gọi đều timeout khó hiểu
        - namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: kube-system } }
          podSelector: { matchLabels: { k8s-app: kube-dns } }
      ports: [{ protocol: UDP, port: 53 }, { protocol: TCP, port: 53 }]
    - to:
        - ipBlock: { cidr: 10.20.8.0/24 }       # subnet của RDS (DB nằm ngoài cluster)
      ports: [{ protocol: TCP, port: 5432 }]
    - to:
        - podSelector: { matchLabels: { app: egress-proxy } }   # đường duy nhất ra internet
      ports: [{ protocol: TCP, port: 3128 }]
~~~

### Bẫy AND và OR trong selector
~~~text
from:
  - namespaceSelector: {...}    # MỘT phần tử có hai khoá:
    podSelector: {...}          #   Pod nhãn X TRONG namespace Y  (AND)
from:
  - namespaceSelector: {...}    # HAI phần tử:
  - podSelector: {...}          #   MỌI Pod của namespace Y, HOẶC Pod nhãn X cùng namespace (OR)
~~~
Chỉ thêm một dấu gạch đầu dòng là policy mở rộng gấp nhiều lần — lỗi này rất hay lọt review.

### Egress ra internet
NetworkPolicy chuẩn chỉ hiểu IP/CIDR, mà IP của cổng thanh toán đổi theo CDN. Ba cách: CiliumNetworkPolicy với {{toFQDNs}}; egress proxy (Squid/Envoy) có allowlist tên miền; hoặc egress gateway với **IP NAT cố định** để đối tác whitelist ngược lại. Với PCI, proxy còn cho log mọi kết nối ra ngoài làm bằng chứng.

### Secret: vì sao Secret của Kubernetes chưa đủ
- Secret chỉ là **base64** (mã hoá ký tự, không phải mật mã) lưu trong etcd. Cần bật **encryption at rest** cho etcd (EncryptionConfiguration với provider KMS v2; trên EKS là envelope encryption bằng KMS).
- Ai có quyền {{get}}/{{list}}/{{watch}} secrets trong namespace là đọc được; ai có quyền **tạo Pod** trong namespace cũng gián tiếp đọc được mọi Secret ở đó (mount vào Pod của mình). Ở prod, chỉ GitOps controller được tạo workload.
- Không commit manifest Secret vào Git: base64 coi như plain text.

| Tiêu chí | External Secrets Operator | Vault (Agent Injector / CSI) | Sealed Secrets |
|---|---|---|---|
| Nguồn sự thật | Secrets Manager, Vault, GCP… | Vault | Git (bản đã mã hoá) |
| Có Secret trong etcd | Có (đồng bộ theo {{refreshInterval}}) | Không bắt buộc (file trong Pod) | Có |
| Rotation | Sửa ở secret manager, ESO tự cập nhật | Credential **động** có TTL, tự thu hồi | Seal lại và commit |
| Audit "ai đọc secret" | Log của secret manager (CloudTrail) | Audit log Vault chi tiết | Hạn chế |
| Vận hành | Nhẹ | Nặng (HA, unseal, backup) | Nhẹ, nhưng phải giữ private key controller |
| Hợp với | Đa số team trên cloud | Yêu cầu cao, credential DB động | Team nhỏ, GitOps thuần |

~~~yaml
apiVersion: external-secrets.io/v1     # ESO bản cũ: v1beta1
kind: ExternalSecret
metadata: { name: payment-db, namespace: payments }
spec:
  refreshInterval: 1h
  secretStoreRef: { kind: ClusterSecretStore, name: aws-secrets-manager }
  target: { name: payment-db }          # Secret được tạo ra
  data:
    - secretKey: password
      remoteRef: { key: prod/payment/db, property: password }
~~~

### Đưa secret vào Spring Boot
- Mount Secret dạng **file** và dùng {{spring.config.import=configtree:/etc/secrets/}}: mỗi file thành một property. Tránh biến môi trường cho secret nhạy cảm: env dễ lộ qua {{/proc/PID/environ}}, log khởi động, crash dump, và **không cập nhật** khi secret đổi.
- Rotation mật khẩu DB không downtime: cần giai đoạn **hai credential cùng hợp lệ** (Secrets Manager có chiến lược luân phiên hai user), HikariCP {{maxLifetime}} thay dần connection cũ, app đọc credential mới khi tạo connection mới hoặc rolling restart sau khi rotate.

### Pitfall production
- Default-deny egress nhưng quên DNS, Kafka/Schema Registry, hoặc kube-apiserver (app dùng leader election qua API): sự cố ngay lần deploy đầu.
- Test policy ở staging dùng CNI khác prod: staging "đúng", prod không chặn gì.
- Sealed Secrets mất private key của controller là mất khả năng giải mã toàn bộ: backup key, có quy trình re-seal khi xoay key.
- Vault là điểm lỗi tập trung: Vault sập thì Pod mới không khởi động được. Chạy HA và có runbook khẩn cấp.

> Senior tip: với audit PCI, **bằng chứng quan trọng hơn cấu hình**. Tôi sinh ma trận luồng mạng (nguồn, đích, port, lý do) trực tiếp từ policy, chạy test kết nối tự động trong pipeline — một Pod thử gọi các luồng bị cấm và test **phải fail** — mỗi lần đổi policy, rồi xuất flow log (Cilium Hubble hoặc VPC Flow Logs) và log truy cập secret cho auditor. Audit lúc đó chỉ còn là đọc báo cáo.`,
    follow: [
      'Làm sao rotate mật khẩu DB của service đang chạy 20 Pod mà không có downtime?',
      'Service mesh với mTLS (Istio, Linkerd) bổ sung hay thay thế NetworkPolicy?',
      'Bạn kiểm thử tự động thế nào để chắc NetworkPolicy thực sự chặn trên production?'
    ],
    tags: ['Kubernetes', 'NetworkPolicy', 'secrets', 'External Secrets', 'Vault', 'Sealed Secrets', 'PCI DSS'],
    refs: [
      { type: 'doc', title: 'Kubernetes Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
      { type: 'doc', title: 'Encrypting Confidential Data at Rest', url: 'https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/' },
      { type: 'doc', title: 'External Secrets Operator', url: 'https://external-secrets.io/latest/' }
    ]
  },
  {
    id: 'devops-038',
    topic: 'devops',
    level: 'lead',
    q: 'On-call của team bạn nhận khoảng 40 cảnh báo mỗi tuần (CPU > 80%, heap > 85%, có request lỗi…), phần lớn tự hết, trong khi sự cố thật lại do khách hàng báo trước. Là tech lead, bạn xây lại hệ thống cảnh báo dựa trên SLI, SLO, error budget và burn rate thế nào, và tổ chức postmortem không đổ lỗi ra sao?',
    a: `**Tóm tắt:** Cảnh báo phải dựa vào **triệu chứng người dùng cảm nhận**, không phải nguyên nhân có thể có. Chọn vài **SLI** (tỷ lệ request thành công, tỷ lệ request nhanh hơn ngưỡng), đặt **SLO** (ví dụ 99.9% trong 30 ngày) → **error budget** 0.1%. Chỉ page người on-call khi **burn rate** cao — đang tiêu budget nhanh đến mức sẽ cạn sớm — và dùng **hai cửa sổ** (1 giờ kèm 5 phút, 6 giờ kèm 30 phút) để vừa phát hiện nhanh vừa ít báo động giả. CPU và heap chuyển thành dashboard hoặc ticket. Sau sự cố, **postmortem blameless** đi tìm điều kiện của hệ thống đã cho phép lỗi xảy ra và kết thúc bằng hành động có owner, có hạn.

### Thuật ngữ bằng ví dụ
- **SLI** = sự kiện tốt / sự kiện hợp lệ. Ví dụ: request API thanh toán không trả 5xx; request hoàn tất dưới 300 ms.
- **SLO**: mục tiêu cho SLI trong một cửa sổ, ví dụ 99.9% request thành công trong 30 ngày cuộn.
- **Error budget** = 1 − SLO = 0.1%. Với 10 triệu request/tháng, được phép 10.000 request lỗi — tương đương khoảng 43 phút sập hoàn toàn trong 30 ngày.
- **SLA**: cam kết hợp đồng với khách hàng (có phạt), luôn lỏng hơn SLO nội bộ.
- **Burn rate** = tỷ lệ lỗi hiện tại / (1 − SLO). Tỷ lệ lỗi 1.44% với SLO 99.9% cho burn rate 14.4: nếu kéo dài, budget 30 ngày (720 giờ) cạn sau 720 / 14.4 = **50 giờ**.

### Vì sao alert CPU, heap, từng lỗi là sai
| Alert cũ | Vấn đề |
|---|---|
| CPU > 80% | Batch cuối ngày hay JIT lúc khởi động làm CPU cao mà người dùng không bị gì → page vô ích; còn deadlock thì CPU thấp → không báo |
| Heap > 85% | Với G1, heap lên cao trước mỗi chu kỳ GC là bình thường |
| Có request 5xx | Vài lỗi trong một triệu request vẫn nằm trong budget |
| Tỷ lệ lỗi > 1% trong 5 phút | Nhạy với nhiễu, lại bỏ sót lỗi âm ỉ 0.5% kéo dài cả tuần (tiêu gấp 5 lần tốc độ cho phép) |

### Multiwindow, multi-burn-rate (theo SRE Workbook)
| Mức | Burn rate | Cửa sổ dài + ngắn | Budget bị tiêu | Hành động |
|---|---|---|---|---|
| Page | 14.4 | 1 giờ và 5 phút | 2% trong 1 giờ | Gọi on-call ngay |
| Page | 6 | 6 giờ và 30 phút | 5% trong 6 giờ | Gọi on-call |
| Ticket | 1 | 3 ngày và 6 giờ | 10% trong 3 ngày | Xử lý trong giờ hành chính |
- **Cửa sổ dài** bảo đảm vấn đề đủ lớn. **Cửa sổ ngắn** bảo đảm vấn đề **vẫn đang diễn ra**, nhờ vậy alert tự tắt nhanh sau khi đã sửa thay vì kêu thêm cả giờ.

~~~yaml
groups:
  - name: payment-slo
    rules:
      - record: payment:error_ratio:rate5m
        expr: |
          sum(rate(http_server_requests_seconds_count{job="payment", status=~"5.."}[5m]))
          / sum(rate(http_server_requests_seconds_count{job="payment"}[5m]))
      - record: payment:error_ratio:rate1h
        expr: |
          sum(rate(http_server_requests_seconds_count{job="payment", status=~"5.."}[1h]))
          / sum(rate(http_server_requests_seconds_count{job="payment"}[1h]))
      - alert: PaymentErrorBudgetFastBurn
        expr: payment:error_ratio:rate1h > (14.4 * 0.001) and payment:error_ratio:rate5m > (14.4 * 0.001)
        labels: { severity: page }
        annotations:
          summary: "payment đang tiêu error budget nhanh gấp 14.4 lần mức cho phép"
~~~
Với SLI độ trễ, Spring Boot tạo sẵn bucket ở ngưỡng SLO bằng {{management.metrics.distribution.slo.http.server.requests=300ms}}; tỷ lệ request nhanh = bucket {{le="0.3"}} chia cho tổng số request.

### Error budget policy
- Thoả thuận **bằng văn bản** với product **trước khi** có sự cố: budget còn thì release bình thường, được thử nghiệm; budget cạn thì đóng băng tính năng (trừ bản sửa lỗi và bảo mật), dồn sức cho reliability; một sự cố tiêu hơn 20% budget thì bắt buộc postmortem.
- Nhờ vậy cuộc tranh luận "ra tính năng hay sửa ổn định" trở thành đọc số liệu, không còn là ai to tiếng hơn.

### Postmortem không đổ lỗi
- Mục đích là **hiểu hệ thống**, không tìm người để phạt. Người bị phạt lần sau sẽ giấu thông tin — mà thông tin thật là thứ quý nhất của postmortem.
- Cấu trúc: tóm tắt và **tác động** (số request lỗi, % budget đã tiêu, số khách hàng, tiền); **timeline** có giờ cụ thể (bắt đầu, phát hiện, leo thang, giảm thiểu, khắc phục); **các yếu tố góp phần** (thường nhiều, không chỉ một "root cause"); điều đã làm tốt, chỗ nào may mắn; **action item** có owner, hạn, phân loại phòng ngừa / phát hiện / giảm thiểu.
- Ngôn ngữ: viết "script migration chạy được trên prod vì không kiểm tra môi trường" thay vì "Nam chạy nhầm lệnh". Hỏi "vì sao hệ thống cho phép điều đó" thay vì "vì sao anh làm vậy".
- Theo dõi action item tới khi đóng; đo MTTD (phát hiện) và MTTR (khắc phục) qua từng quý.

### Pitfall production
- **SLO 100% hoặc 99.99% cho mọi thứ**: không còn budget, mỗi lỗi nhỏ thành khủng hoảng, trong khi chính DB phía dưới chỉ đạt 99.95%.
- **Chỉ đo SLI trong app**: request không tới được app (ingress lỗi, Pod chưa ready) không được đếm. Đo thêm ở load balancer hoặc bằng synthetic probe.
- **Service ít traffic**: 3 lỗi trên 100 request là 3%, burn rate vọt lên; thêm điều kiện số request tối thiểu hoặc dùng synthetic traffic.
- **Đếm 4xx là lỗi** thì client gửi sai cũng đốt budget; ngược lại trả 200 kèm body lỗi nghiệp vụ thì lỗi thật không bị đếm.
- **Xoá sạch alert nguyên nhân**: vẫn giữ cảnh báo "sắp hỏng" như đĩa sắp đầy, chứng chỉ TLS sắp hết hạn — dạng ticket, hoặc page nếu thời gian còn lại quá ngắn.

> Senior tip: đo chính hệ thống cảnh báo: **số page mỗi ca trực** và **tỷ lệ page dẫn tới hành động thật**. Mục tiêu của tôi là vài page mỗi tuần và gần như page nào cũng cần làm gì đó; page nào không cần hành động thì sửa hoặc xoá alert ngay trong tuần đó. On-call tin vào alert là điều kiện để họ phản ứng nhanh lúc 3 giờ sáng.`,
    follow: [
      'Bạn đặt SLO thế nào cho một service phụ thuộc vào DB và ba service khác, mỗi cái có độ sẵn sàng riêng?',
      'Error budget đã cạn nhưng business muốn release một tính năng quan trọng: bạn xử lý thế nào?',
      'Làm sao để action item của postmortem thực sự được làm chứ không nằm mãi trong backlog?'
    ],
    tags: ['SRE', 'SLO', 'SLI', 'error budget', 'burn rate', 'alerting', 'postmortem'],
    refs: [
      { type: 'doc', title: 'Alerting on SLOs - Google SRE Workbook', url: 'https://sre.google/workbook/alerting-on-slos/' },
      { type: 'doc', title: 'Postmortem Culture: Learning from Failure', url: 'https://sre.google/sre-book/postmortem-culture/' },
      { type: 'doc', title: 'Example Error Budget Policy', url: 'https://sre.google/workbook/error-budget-policy/' }
    ]
  },
  {
    id: 'devops-039',
    topic: 'devops',
    level: 'mid',
    q: 'Service Spring Boot chạy hoàn hảo khi chỉ có một instance, nhưng vừa scale lên 3 Pod trên Kubernetes thì người dùng đang dùng bị bật về màn hình đăng nhập, file báo cáo vừa upload biến mất, và job tính lãi đầu ngày chạy đúng ba lần. Giải thích từng hiện tượng và cách sửa.',
    a: `**Tóm tắt:** Mỗi request có thể rơi vào một Pod khác nhau, mà RAM của Pod này thì Pod kia không nhìn thấy. App giữ state trong process (HTTP session, file trên đĩa local, job đếm lần chạy) sẽ hỏng ngay khi có replica thứ hai. Cách sửa là làm app **stateless**: session đưa ra Redis (Spring Session), file đưa lên object storage (S3), job phải có khoá phân tán (ShedLock), cache local phải có TTL và chiến lược invalidate rõ ràng. Sticky session chỉ là băng keo dán tạm.

### Vì sao mất state — hình dung từ gốc
Quầy giao dịch có 3 nhân viên giống hệt nhau, khách được xếp luân phiên. Nếu nhân viên A ghi thông tin vào cuốn sổ **cất trong túi áo mình**, khách quay lại gặp nhân viên B thì B không biết gì. Process Java cũng vậy: HTTP session, object cache, biến đếm đều nằm trong RAM của chính nó. Trên Kubernetes, mỗi Pod là một process độc lập (thường ở node khác nhau), Service chia request luân phiên giữa các Pod. Tệ hơn, Pod là tạm thời (ephemeral): rollout, restart, node chết là toàn bộ RAM bay theo, không để lại dấu vết.

### Hiện tượng 1: bị bật về màn hình đăng nhập — HTTP session
Tomcat tạo session trong memory và trả cookie {{JSESSIONID}}. Request sau đi vào Pod khác, Pod đó không có session với id đó nên tạo session mới → người dùng mất trạng thái đăng nhập.
Sửa bằng **Spring Session**: thêm {{spring-session-data-redis}}, session được serialize vào Redis thay vì memory của Tomcat; mọi Pod đọc chung.

~~~yaml
# build.gradle / pom: spring-boot-starter-data-redis + spring-session-data-redis
spring:
  session:
    timeout: 30m
  data:
    redis:
      host: redis-sessions.payments.svc   # nên là Redis HA (Sentinel/Cluster)
~~~

Hướng khác: **JWT** — server không giữ session, chỉ ký token; nhưng logout thu hồi token ngay thì phải thêm denylist, và token phải ngắn hạn kèm refresh token. Lưu ý: session replication kiểu Tomcat cluster gần như không dùng được trên Kubernetes vì Pod phát hiện nhau động.

### Hiện tượng 2: file upload "biến mất"
File multipart được ghi vào đĩa tạm của Pod (/tmp); request tải về rơi Pod khác → 404; Pod bị restart → file mất hẳn. PVC kiểu RWO (ReadWriteOnce) chỉ bind được cho **một** Pod, không phải ổ đĩa chung cho cả Deployment.
Sửa: stream thẳng lên S3/GCS ngay khi nhận, DB chỉ lưu key; file lớn cho client upload qua **presigned URL** để không đi qua app.

### Hiện tượng 3: job chạy ba lần
{{@Scheduled}} chạy trong **mọi** replica — cả 3 Pod đều thức lúc 1h và cùng tính lãi. Đây là bug tiền bạc, không phải sự khó chịu.

~~~java
@Scheduled(cron = "0 0 1 * * *")
@SchedulerLock(name = "dailyInterest", lockAtMostFor = "30m", lockAtLeastFor = "59m")
public void calculateInterest() {
    // Pod lấy được lock (Redis/DB) mới chạy; hai Pod còn thấy lock đang giữ thì bỏ qua vòng này
}
~~~

{{lockAtLeastFor}} 59m đảm bảo job dưới 1 phút vẫn không chạy hai lần trong cùng ngày. Hoặc tách hẳn batch sang Kubernetes CronJob chạy một Pod duy nhất.

### Các hầm chông còn lại
| State | Biểu hiện | Cách sửa |
|---|---|---|
| Cache Caffeine/ConcurrentHashMap | Pod A vừa ghi, Pod B trả số cũ | TTL ngắn, hoặc Redis + pub/sub invalidate |
| WebSocket | Nhận tin nhắn chỉ ở một Pod | sticky (tạm) hoặc backplane Redis / chuyển sang SSE + Redis pub/sub |
| Queue trong memory | Mất message khi Pod chết | Đưa sang Kafka/SQS |
| Rate limiter in-memory | Limit thực tế = 3x con số khai | Redis ({{INCR}} + expire) hoặc bucket4j với cache phân tán |

### Sticky session có phải giải pháp?
ALB có stickiness, nhưng NGINX mở (community) không có directive sticky (chỉ NGINX Plus). Sticky làm Pod cũ nhận mãi khách cũ → lệch tải; rollout tạo Pod mới chưa có session nào vẫn bị "đục" vì session nằm ở Pod sắp chết; Pod chết thì vẫn mất session. Acceptable cho tình thế tạm, không phải thiết kế.

### Checklist stateless cho service mới
- Không session/credential trong memory kéo dài giữa các request.
- Không ghi file vào đĩa container (trừ cache có TTL, rebuild được từ nguồn khác).
- Job/leader election qua ShedLock hoặc CronJob riêng.
- Mọi thứ cần "sống sót qua Pod" nằm ở Redis/S3/DB/queue.

### Lỗi hay gặp
- Session object chứa class custom rồi đổi package → Redis deserialize fail lặn sau upgrade.
- Redis sập: toàn bộ user mất phiên — phải có Redis HA và chấp nhận đây là dependency mới của auth.
- Bật Spring Session nhưng vẫn đọc request.getAttribute từ session Tomcat cũ ở code legacy.

> Senior tip: tiêu chí nghiệm thu tôi hay áp: chạy k6 tạo tải có đăng nhập, trong lúc đó {{kubectl delete pod --force}} một replica giữa phiên — người dùng phải không nhận ra gì ngoài chậm hơn một nhịp. Test này bắt được 90% lỗi stateless trước khi lên prod.`,
    follow: [
      'Đã dùng Spring Session với Redis mà Redis chết: người dùng gặp gì và bạn thiết kế graceful thế nào?',
      'JWT không cần session — vậy làm sao "đá" một user đăng xuất ngay khi token còn hạn 15 phút?',
      'Cache Caffeine TTL 5 phút giữa 3 Pod: khi nào chấp nhận được, khi nào nguy hiểm cho số dư tài khoản?'
    ],
    tags: ['Stateless', 'Spring Session', 'Redis', 'ShedLock', 'Kubernetes']
  },
  {
    id: 'devops-040',
    topic: 'devops',
    level: 'mid',
    q: 'Service Java chạy trên EKS cần đọc/ghi S3 và gửi tin lên SQS. Hiện access key + secret key nằm trong ConfigMap, rotate thủ công mỗi quý và đoàn audit vừa ghi biên bản. Bạn thay bằng cơ chế nào để không còn key tĩnh, và AWS SDK lấy credential từ đâu?',
    a: `**Tóm tắt:** Bỏ hẳn key tĩnh, chuyển sang **IAM role gắn với Pod**. Trên EKS có hai con đường: **IRSA** (ServiceAccount khai báo IAM role, Pod nhận OIDC token ngắn hạn) hoặc **EKS Pod Identity** (mới hơn, dùng agent, đỡ cấu hình OIDC theo từng cluster). AWS SDK không đọc env một cách mù quáng mà đi theo **default credentials chain**: gặp biến {{AWS_WEB_IDENTITY_TOKEN_FILE}} thì gọi {{AssumeRoleWithWebIdentity}}, lấy credential sống ~1 giờ và tự làm mới — không có gì để rotate.

### Key tĩnh trong ConfigMap sai ở đâu
- ConfigMap lưu **bằng văn bản thường** trong etcd (Secret chỉ base64, cũng không phải mã hoá nếu không bật encryption at rest); bất kỳ ai có quyền get trong namespace đọc được.
- Key tồn tại vĩnh viễn: nhân sự nghỉ, laptop mất, repo public — key vẫn xài được.
- Một key nhiều service dùng → CloudTrail không phân biệt được **ai** đã gọi {{s3:DeleteObject}}; audit không có câu trả lời.
- Rotate là một dự án: phải đổi ConfigMap, restart từng dịch, cầu nguyện không sót chỗ nào cache giá trị cũ.
- Có nguy cơ bị commit vào Git, và lịch sử Git thì không tẩy được.

### Default credentials chain của AWS SDK v2
{{S3Client.create()}} không cần truyền credential; SDK tự tìm theo thứ tự (gần đúng):
1. Biến môi trường {{AWS_ACCESS_KEY_ID}} / {{AWS_SECRET_ACCESS_KEY}}.
2. System properties của JVM.
3. **Web identity token file** ({{AWS_WEB_IDENTITY_TOKEN_FILE}} + {{AWS_ROLE_ARN}}) — đây chính là cửa mà IRSA đi vào.
4. {{~/.aws/credentials}} (profile).
5. Container credentials (endpoint cục bộ) — cửa của EKS Pod Identity.
6. Instance credentials qua IMDS.

Bài học: code chỉ cần một dòng builder; chuyện credential là việc của hạ tầng, đừng nhúng logic vào app.

### IMDS — danh tính của node, không phải của Pod
IMDS là địa chỉ link-local {{169.254.169.254}}; Pod trên node đó gọi vào sẽ nhận **role của node** (node role thường rất rộng để pull ECR, ghi log...). Mọi service sẽ dùng chung một quyền — mất cô lập. Biện pháp: bật IMDSv2 và giới hạn hop limit = 1 để Pod không với tới IMDS, ép mỗi service dùng danh tính riêng.

### IRSA hoạt động thế nào
~~~text
Cluster EKS có OIDC provider (một lần, theo cluster)
Role "payment-s3-sqs" có:
  - Trust policy: cho AssumeRoleWithWebIdentity VỚI điều kiện
      system:serviceaccount:payments:payment-sa  (đúng namespace + SA)
  - Permission policy: s3:GetObject/PutObject theo prefix arn:aws:s3:::bank/payments/*,
                       sqs:SendMessage đúng queue arn
SA payment-sa annotation arn:aws:iam::11111122221111:role/payment-s3-sqs
=> webhook EKS gắn token projected vào Pod + 2 env:
     AWS_ROLE_ARN, AWS_WEB_IDENTITY_TOKEN_FILE=/var/run/secrets/.../token
=> SDK gọi STS đổi token lấy credential ~1h, tự làm mới trước hạn
~~~

Điểm mạnh: credential **ngắn hạn, theo service, tự rotate**; STS session bị trói chặt vào (namespace, ServiceAccount) nên Pod SA khác không đóng giả được.

### EKS Pod Identity
Amazon thêm EKS Pod Identity Agent (DaemonSet) trên node; bạn tạo **role association** qua API của EKS thay vì annotation + OIDC; SDK nhận credential qua endpoint cục bộ. Ưu: đỡ lập OIDC cho từng cluster, một role xài được ở nhiều cluster, không lo token. Nếu cluster bạn mới dựng hoặc nhiều cluster, tôi chọn Pod Identity; IRSA vẫn hoàn toàn đúng và phổ biến hơn.

### Least privilege — quyền "vừa đủ"
Mỗi service một role riêng, policy chỉ tới tài nguyên cụ thể (prefix bucket, queue ARN, key KMS cần decrypt). Cấm {{s3:*}}, {{iam:*}}. Hệ quả dễ chịu: khi audit hỏi "ai xoá file này", CloudTrail trả lời đúng role của đúng service.

### Dev chạy local thì sao
Dùng AWS SSO ({{aws sso login}}) với role dev, hoặc profile tạm hết hạn 1 giờ; test offline bằng LocalStack mock S3/SQS. **Không** có ngoại lệ "key prod để dev tiện".

### Lỗi hay gặp
- 403 AccessDenied dù role đã có policy: kiểm tra trust condition sai tên namespace/SA, hoặc SA chưa annotation.
- Quên region làm gọi STS/SDK treo hoặc UnknownHostException — luôn đặt {{AWS_REGION}} (hoặc env cluster-defaults).
- SDK v1 quá cũ: có phiên bản không tự làm mới web identity token → job batch chết sau 1 giờ đúng nửa đêm; nâng SDK v2.
- Tự cache {{BasicSessionCredentials}} vào static variable — đừng đấu với SDK.

### Trả lời phỏng vấn
Chuỗi ý: key tĩnh có vấn đề gì → chain credential → IRSA/Pod Identity cơ chế → least privilege theo từng service → dev local bằng SSO. Kết bằng lợi ích audit: mỗi service một danh tính, mọi call truy vết được.

> Senior tip: đề ra chính sách **zero static credential** và cài secret scanner (gitleaks/trufflehog) trong pipeline để key không quay lại qua ngỏ Git; sau khi chuyển hết sang IRSA, xoá key cũ trong IAM từng cái một (disable rồi theo dõi CloudTrail vài ngày trước khi delete) để phát hiện chỗ nào còn dùng lén.`,
    follow: [
      'Pod bị lỗi 403 sau khi đổi tên ServiceAccount: bạn debug từ những đối tượng nào?',
      'Vì sao hop limit 1 của IMDSv2 chặn được Pod đọc credential của node?',
      'Service cần chữ ký presigned URL hiệu lực 7 ngày — token 1 giờ của IRSA có cho phép không?'
    ],
    tags: ['AWS', 'EKS', 'IRSA', 'IAM', 'Secrets', 'Java SDK']
  },
  {
    id: 'devops-041',
    topic: 'devops',
    level: 'senior',
    q: 'Team platform muốn bỏ kiểu Jenkins cầm kubectl apply từ ngoài cluster, chuyển sang GitOps với Argo CD. Là dev sở hữu service, điều gì thay đổi trong deploy hằng ngày, rollback, phát hiện sửa tay, và secrets?',
    a: `**Tóm tắt:** GitOps = **toàn bộ trạng thái mong muốn của cluster nằm trong Git**, và một operator chạy *trong* cluster (Argo CD) liên tục so sánh thực tế với Git rồi kéo thực tế về khớp Git. CI không còn "deploy" nữa — CI chỉ commit bump version image. Rollback thành {{git revert}}, sửa tay bị phát hiện là **drift** và có thể bị self-heal đè lại, secrets không bao giờ vào Git (External Secrets lo phần đó).

### Push-based vs pull-based (GitOps)
| | Push: Jenkins chạy kubectl | Pull: Argo CD trong cluster |
|---|---|---|
| Credential cluster nằm ở | Jenkins (bên ngoài, dễ rò) | trong cluster, không lộ ra ngoài |
| Hướng kết nối | Jenkins phải mở đường từ ngoài vào prod | cluster chủ động outbound tới Git |
| Nguồn sự thật | DB của Jenkins + history job | Git repo — diff, review, audit free |
| Rollback | job cũ replay, hoặc kubectl | {{git revert}} — vẫn là một lần deploy có review |
| Dev muốn deploy | cần quyền Jenkins/prod | mở PR vào repo cấu hình là đủ |

### Luồng deploy một service sau chuyển
~~~text
merge PR → CI build image (tag = git SHA) → push registry
        → CI/Argo Image Updater commit tag mới vào apps repo (PR hoặc direct)
        → Argo CD thấy commit (webhook/poll) → diff → Sync → Pod mới theo rolling update
~~~
Developer không còn gõ kubectl ở prod; "deploy" đơn giản là merge một commit cấu hình.

### Drift, OutOfSync và selfHeal
Argo liên tục chạy {{diff}} giữa live object và Git render:
- {{OutOfSync}} = có khác biệt; UI cho xem diff từng field.
- {{selfHeal: true}}: ai đó {{kubectl edit}}/apply tay → Argo đè lại về Git ngay → buộc mọi thay đổi phải đi qua PR. Đây là tính năng **quy trình** chứ không chỉ kỹ thuật.
- Ngoại lệ bắt buộc phải có: HPA sửa {{/spec/replicas}} liên tục → nếu selfHeal sẽ đánh nhau; khai báo {{ignoreDifferences}} với jsonPointers {{/spec/replicas}} (hoặc bật HPA quản lý replicas, xoá field khỏi manifest).

### Rollback kiểu GitOps
- {{kubectl rollout undo}} tạo drift tức thì và selfHeal "rollback của rollback" — cấm dùng ở môi trường có GitOps.
- Đúng: {{git revert}} commit bump image (platform team cho phép revert nhanh ở prod qua branch emergency có review 1 người), Argo sync lại. Toàn bộ lịch sử deploy = git log, auditor rất thích.
- Độ trễ: poll mặc định 3 phút; webhook/Argo Notifications giảm còn tính bằng chục giây — prod cần tốc độ thì cấu hình phần này.

### Sync waves & hooks — thứ tự trong một deploy
Manifest áp cùng lúc thì Flyway Job chạy sau Pod app là sai. Dùng annotation số:

~~~yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"   # 0: Namespace/RBAC; 1: migration Job (hook PreSync); 2: Deployment
    argocd.argoproj.io/sync-wave: "-1"
    argocd.argoproj.io/hook: PreSync    # Job Flyway chạy trước, phải Complete mới đi tiếp
~~~

30 service thì quản bằng **app-of-apps** hoặc ApplicationSet (template từ repo layout), thêm service chỉ bằng một commit.

### Secrets đi đâu trong mô hình GitOps
Git không chứa secret; hai lựa chọn phổ biến: **External Secrets Operator** pull từ Vault/Secrets Manager về tạo Kubernetes Secret, hoặc sealed secrets mã hoá theo cluster. Với app Java nhớ: ESO cập nhật Secret nhưng app chỉ đọc lúc khởi động → rotate cần restart có kiểm soát (đây là chỗ nhiều team đau, xem thêm ConfigMap/Secret).

### Điểm chết thường gặp
- Commit secret thật vào apps repo vì "tạm thời" — scanner phải chặn ở CI.
- CRD của operator chưa cài, app sync fail hàng loạt sau restore cluster — đưa CRD vào wave -1.
- Repo cấu hình phình to (30 service × 4 môi trường) → render chậm; tách apps/infra và dùng ApplicationSet.
- Văn hoá "thôi kubectl cho nhanh" sống sót sau selfHeal — phải kỷ luật: prod access chỉ còn break-glass có log.
- Argo CD là single point of failure: mất Argo thì cluster vẫn chạy, nhưng bạn mất cách deploy an toàn — cần runbook.

> Senior tip: trước khi chuyển, chạy drill "tường lửa": phá cluster staging, dựng lại từ trắng, chỉ dùng Git + registry — mục tiêu dưới 30 phút. Drill này đồng thời test GitOps, backup image, Terraform và tài liệu; team nào không làm được là GitOps còn hổng thật.`,
    follow: [
      'selfHeal với HPA quản lý replicas đánh nhau — bạn xử lý kiến trúc thế nào để không ping-pong?',
      'So sánh rollback bằng git revert với kubectl rollout undo về audit và tốc độ ở prod.',
      'Pipeline vẫn cần deploy "nóng" 2 phút trong sự cố P1 — thiết kế break-glass ra sao cho không mất kiểm soát?'
    ],
    tags: ['GitOps', 'Argo CD', 'CI/CD', 'drift', 'Rollback', 'External Secrets']
  },
  {
    id: 'devops-042',
    topic: 'devops',
    level: 'senior',
    q: 'Team muốn canary tự động: 5% traffic → theo dõi lỗi 10 phút → 25% → 50% → 100%, hễ lỗi tăng là tự dừng. Argo Rollouts thực hiện việc đó thế nào, và service Java cần lưu ý gì về warm-up, database và sample quá nhỏ?',
    a: `**Tóm tắt:** Argo Rollouts thay Deployment bằng CRD **Rollout**: nó điều phối hai ReplicaSet (stable + canary) theo một danh sách **steps** — setWeight, pause, chạy **AnalysisTemplate**. Template đó định kỳ query Prometheus (tỷ lệ 5xx, p99...); nếu vượt ngưỡng {{failureLimit}} nhiều lần, rollout bị **abort** và canary scale về 0. Traffic chia theo tỉ lệ Pod (không cần ingress đặc thù) hoặc qua NGINX ingress/mesh với {{canary-weight}}, {{canary-by-header}}.

### Đọc nhanh Rollout mẫu
~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  replicas: 20
  strategy:
    canary:
      canaryService: payment-canary
      stableService: payment-stable
      trafficRouting:
        nginx:
          stableIngress: payments-nginx
      canaryAnalysis:
        maxWeight: 50
        steps:
        - setWeight: 5
        - pause: {}                      # dừng vô hạn: mắt người xem trước khi máy chạy tiếp
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:
            templates:
            - templateName: error-rate
      scaleDownDelaySecondsOnScaleUp: 60 # giữ pod cũ 60s để drain request đang chạy
~~~
{{setWeight: 5}} nghĩa là 5% traffic tới canary; với mode chia theo tỉ lệ Pod thì 20 replica → canary 1 Pod, xấp xỉ 5%.

### AnalysisTemplate — "cái máy đo"
~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
spec:
  metrics:
  - name: http-5xx-ratio
    intervalSeconds: 60
    failureLimit: 2                # fail 2 lần liên tiếp thì abort
    successCondition: result[0] < 0.01   # 5xx < 1%
    provider:
      prometheus:
        address: http://prometheus.observability:9090
        query: |
          sum(rate(http_server_requests_seconds_count{job="payment",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{job="payment"}[5m]))
~~~
Metric nên lấy từ {{Micrometer}} (http_server_requests) — cùng nguồn với dashboard SLO, đừng chế số mới.

### Ba đường chia traffic
| Cách | Điều kiện | Ghi chú |
|---|---|---|
| Tỉ lệ Pod (không trafficRouting) | không cần ingress hỗ trợ | coarse: 1 pod = 5% khi 20 pod; latency phụ thuộc pod nhận nhiều nhất |
| NGINX ingress {{canary-weight}} | cần ingress-nginx | chính xác theo %; {{canary-by-header}} cho tester nội bộ đi 100% vào canary |
| Service mesh (Istio/Linkerd) | VirtualService/TS | cho cả weight + header + mirror |

### Ba thứ chỉ dân Java mới nhớ
1. **JVM lạnh**: pod canary mới JIT chưa warm, p99 cao vài phút đầu — dễ làm analysis fail oan. Dùng {{warmupDurationSecs}}, và chỉ bắt đầu đo sau cửa sổ pause.
2. **Database là state chia sẻ**: canary không cách ly được schema — migration không tương thích thì cả stable lẫn canary đau như nhau; expand-contract vẫn là điều kiện cần.
3. **Sample nhỏ khi traffic thấp**: 10 RPS × 5% = 0.5 RPS thì p99 là nhiễu; cần điều kiện số request tối thiểu trong query, hoặc pause vô hạn ở 5% để người bấm promote.

### Abort và promote thủ công
Khi abort: canary scale về 0, rollout dừng ở trạng thái aborted, metrics còn trong UI để điều tra. Người vận hành {{kubectl argo rollouts promote}}/abort khi muốn đi tiếp — script cho phép chạy tiếp từng nấc khi đang incident.

### Lỗi hay gặp
- Readiness probe quá lạc quan → pod canary chưa warm đã nhận traffic, 5xx thật nhưng do hạ tầng, analysis abort oan rồi không ai sửa probe.
- Canary-by-header: tester bắn hỏng → abort không đúng vì traffic test không được analysis đếm (đọc theo header, weight vẫn 0).
- Chạy canary đồng thời với DB migration coalesce → không còn "old code path" để lui.
- Pause vô hạn bị quên: rollout treo 3 ngày giữa 5%, hai ReplicaSet cùng tồn tại, dev tưởng đã xong.

> Senior tip: với service thanh toán, bắt đầu phân tích bằng **tỷ lệ lỗi 5xx + tỷ lệ lỗi nghiệp vụ (gateway từ chối)** thay vì p99 — hai metric này ít nhiễu ở sample nhỏ. Giữ bước pause đầu tiên vô hạn để con người nhìn log canary 10 phút; chỉ tin máy sau khi bạn thấy analysis máy đã bắt đúng 2–3 vụ thật.`,
    follow: [
      'Traffic rất thấp (dưới 1 RPS): thiết kế analysis thế nào để canary không fail oan?',
      'Mirror 10% traffic production sang canary (shadow traffic) hoạt động ra sao và rủi ro gì với API ghi?',
      'Abort rồi thì Pod canary chết — làm sao giữ được heap dump/log để điều tra?'
    ],
    tags: ['Argo Rollouts', 'Canary', 'Progressive delivery', 'Prometheus', 'Traffic splitting']
  },
  {
    id: 'devops-043',
    topic: 'devops',
    level: 'senior',
    q: 'Mỗi service Spring Boot chạy 10 replica với maximumPoolSize 20; PostgreSQL max_connections 200 thường quá tải, và mỗi lần rolling update tình hình tệ hẳn. Bạn giải bài toán connection pooling ở tầng app, tầng pool và tầng DB thế nào?',
    a: `**Tóm tắt:** PostgreSQL connection không phải là socket nhẹ — mỗi connection là một **server process** tốn memory và CPU; throughput của DB không tăng theo số connection mở, mà tới mức nào đó còn giảm vì tranh chấp. 10 pod × 20 = 200 chỉ tính **một** service; chưa kể migration, cron, service khác, và cửa sổ rollout nhân đôi số pod. Chiến lược ba tầng: pool app **nhỏ và đúng công thức**, thêm **PgBouncer** multiplex ở giữa, đặt ngân sách connection DB có dự phòng; chống **connection storm** lúc Pod đồng loạt khởi động.

### Vì sao mở nhiều connection không giúp gì
Ngân hàng 2 quầy, 200 khách xếp hàng giao dịch: số nhân viên DB có thể phục vụ đồng thời ≈ số core CPU. Mỗi connection của Postgres là một process (fork) tốn vài MB, mỗi query có thể ngốn {{work_mem}} cho sort/hash; 200 connection chạy đồng thời là 200 lần như thế + tranh chấp lock + vacuum trễ. đường cong throughput: tăng tới ~2× số core thì đạt đỉnh, thêm nữa là đi xuống. HikariCP đưa công thức khởi điểm kinh điển: {{connections = core_count * 2 + effective_spindle_count}} — pool to chỉ cần khi query của bạn chờ I/O lâu.

### Đặt ngân sách connection (số hoá)
~~~text
DB max_connections          = 200 (trừ superuser reserved ~10, monitoring ~5)
Còn phân bổ được            ≈ 185
payment-svc: 10 pod × pool 8  = 80
order-svc:   10 pod × pool 6  = 60
Flyway job + CronJob           = 6
Buffer sự cố / rollout surge   = ~40  ← con số nhiều người quên
~~~

Và nhớ rollout tăng surge: maxSurge 25% nghĩa là tạm thời 12–13 pod — 13 × 8 = 104 cho riêng service đó.

### Connection storm khi triển khai
Mặc định Hikari mở {{minimumIdle}} = maximumPoolSize khi pool được khởi tạo → 10–13 pod cùng dậy trong 60 giây và mỗi pod lao tới DB xin 8 connection: DB vừa nhận connection mới (fork process, làm xác thực) vừa gồng query cũ → timeout dây chuyền, pod fail readiness, restart làm storm to hơn (death spiral).
Giảm: {{minimumIdle}} nhỏ (mở theo nhu cầu), {{connectionTimeout}} 2–3 giây để fail nhanh + retry có backoff ở tầng service, {{initializationFailTimeout = -1}} để app dậy được khi DB tạm nghẽn rồi connect lại dần, và cho DB một lớp chắn (xem PgBouncer).

~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 8
      minimum-idle: 2
      connection-timeout: 3000
      initialization-fail-timeout: -1
      leak-detection-threshold: 60000   # log stacktrace nếu app giữ connection 60s không trả
~~~

### PgBouncer — multiplex ở tầng giữa
Ý tưởng: app giữ hàng trăm connection **giả** phía PgBouncer; PgBouncer giữ ~50 connection **thật** tới DB, mượn cho từng transaction rồi trả — server process của DB được chia sẻ.
| Chế độ | Cách hoạt | Hệ quả với Java |
|---|---|---|
| session | gán cứng 1 server connection cho 1 client | không save memory, hiếm dùng |
| transaction (phổ biến) | cho mượn server connection theo **từng transaction** | tiết kiệm nhất, nhưng bỏ đi các thứ phụ thuộc "phiên" |
| statement | multiplex theo từng statement | dễ vỡ, tránh |

Cạm bẫy transaction-mode với JDBC/Postgres: prepared statements của driver (mặc định Postgres JDBC cache sau 5 lần execute) không hợp với PgBouncer bản cũ — PgBouncer 1.21+ đã hỗ trợ server prepared statements (cấu {{max_prepared_statements}}), còn bản cũ phải tắt cache phía driver ({{prepareThreshold=0}}); {{SET}} biến session (search_path, timezone) không còn "dính" cả phiên → set mặc định ở role/db bằng {{ALTER ROLE ... SET search_path}} thay vì mỗi kết nối; advisory lock, {{LISTEN/NOTIFY}}, temporal session state đều không chạy được. RDS Proxy của AWS là lựa chọn managed cùng ý tưởng.

### Leak và long transaction — phía code
- {{@Transactional}} bọc cả gọi HTTP sang đối tác 3 giây → giữ connection 3 giây thay vì 20 ms; p99 DB pool exhaustion đến sớm. Thu hẹp transaction quanh thao tác DB, gọi ngoài ở ngoài transaction.
- Báo cáo chạy 200 giây: tách DataSource riêng, pool 2–3, user readonly, {{statement_timeout}} theo role — đừng cho report ăn pool giao dịch.

### Trả lời phỏng vấn 30 giây
"Đầu tiên em tính ngân sách connection thật (tổng pod × pool + surge), không scale pool theo cảm tính; pool app để nhỏ theo công thức core; nếu số client lớn thì đặt PgBouncer/RDS Proxy multiplex và kiểm tra prepared statements + session variables; storm lúc deploy xử lý bằng minimumIdle nhỏ, fail-fast + backoff; cuối cùng thêm cảnh báo cả hai phía hikari_pending và pg_stat_activity."

> Senior tip: dashboard đúng phải có **cả hai phía**: {{hikaricp_connections_active/pending}} (Micrometer) đặt cạnh {{pg_stat_activity}} đếm theo application_name. 90% vụ "app treo khi cao điểm" là một transaction dài giữ connection + pool nhỏ — leak-detection-threshold chính là nút bằng chứng thay vì phỏng đoán.`,
    follow: [
      'PgBouncer transaction-mode + Spring Data JPA lazy loading ngoài transaction: vì sao vỡ và sửa ở đâu?',
      'Vì sao giới hạn 50 connection có thể nhanh hơn 200? Giải thích qua đường cong throughput.',
      'Rolling update làm DB chạm max_connections: bạn đổi chiến lược rollout hay pool trước?'
    ],
    tags: ['HikariCP', 'PostgreSQL', 'PgBouncer', 'Connection pool', 'Kubernetes', 'Rollout']
  },
  {
    id: 'devops-044',
    topic: 'devops',
    level: 'senior',
    q: 'Pod Spring Boot của bạn mất 90–120 giây mới Ready. Vì sao điều đó nguy hiểm trên Kubernetes chứ không chỉ "chậm", bạn đo xem thời gian chết ở khâu nào, và những cách giảm thời gian khởi động (AppCDS, tối ưu context, CRaC, native image) đáng dùng khi nào?',
    a: `**Tóm tắt:** Khởi động của một Pod = **pull image + JVM + Spring context + warm-up**. Trên Kubernetes, 90 giây này làm HPA phản ứng chậm sau khi quá tải đã xảy ra, rollout kéo dài khiến hai version cùng chạy song song lâu hơn (và rollback cũng chậm y vậy), và khi node chết thì "cách duy nhất để phục vụ lại" cũng phải chờ đúng 90 giây đó. Trước khi tối ưu phải **đo theo từng phase**; sau đó chọn biện pháp theo đường cong hiệu quả/công sức: AppCDS và bớt việc khi khởi động cho hiệu quả tốt nhất trên mỗi công sức bỏ ra, CRaC và native image chỉ đáng khi khởi động chậm là bài toán cốt lõi của bạn.

### 90 giây đó đi đâu
~~~text
Pull image 210 MB      ~6s (node có cache) / 20–40s (node mới tinh)
JVM khởi động          ~0,5–1s
Spring context         ~60s: autoconfig + quét package, tạo beans,
                       entity scan JPA, xác thực + migrate DB, mở pool,
                       đăng ký Kafka listener, warm cache
JIT warm-up            p99 cao thêm 30–60s **sau** khi đã Ready
~~~

### Vì sao chậm là vấn đề **vận hành**, không phải vấn đề lịch sự
- **HPA**: tín hiệu tải tăng → HPA quyết định thêm Pod → Pod Ready sau 90s. Trong 90s đó request dồn vào các Pod cũ: p99 sụp đúng lúc đông khách nhất. Service khởi động chậm phải để minReplicas cao hơn mức cần — tốn tiền.
- **Rollback chậm**: phiên bản mới có bug, bạn "quay về bản cũ" nhưng bản cũ cũng cần 90s/Pod để dựng lại.
- **Cứu sự cố**: node mất, Deployment tự tạo Pod bù ở node khác — phải pull lại từ đầu.
- **startupProbe** phải đặt failureThreshold × period đủ phủ cả thời gian khởi động + pull trên node mới, nếu không Pod bị kill oan khi chưa kịp xong → CrashLoopBackOff vì lý do... quá chậm.

### Đo: biết bean nào ăn thời gian
Boot 3 có sẵn endpoint dựng từ **BufferingApplicationStartup**:

~~~java
SpringApplication app = new SpringApplication(PaymentApp.class);
app.setApplicationStartup(new BufferingApplicationStartup(4096)); // đệm sự kiện startup
app.run(args);
// GET /actuator/startup → timeline từng bước: bean tạo mất bao lâu, flyway, kafka listener...
~~~

Cộng với timestamp từ {{kubectl get events}} (Scheduled → Pulling → Created → Started → Ready) để tách phần pull khỏi phần app.

### Giảm theo từng phase
1. **Pull**: image nhỏ (layered jar + JRE/distroless), registry trong cùng VPC/region, một số team dùng DaemonSet pre-pull image đang chạy lên mọi node.
2. **Class loading — AppCDS (App Class Data Sharing)**: JVM đọc và **verify** hàng chục nghìn class mỗi lần khởi động; CDS lưu kết quả verify vào một **archive** tạo sẵn trong CI, lúc chạy chỉ việc map vào:

~~~bash
# Một lần trong CI (hoặc local): chạy app đến lúc exit, ghi lại những class đã nạp + đóng archive
java -XX:ArchiveClassesAtExit=app-cds.jsa -jar payment.jar
# Mọi lần khởi động sau dùng archive — thường bớt 10–40% thời gian JVM
java -XX:SharedArchiveFile=app-cds.jsa -jar payment.jar
~~~

Archive phụ thuộc đúng jar đó → regenerate mỗi build, copy vào image. Rủi ro gần bằng 0.
3. **Bớt việc khi khởi động**: {{spring.autoconfigure.exclude}} những autoconfig không dùng; thu hẹp package quét component/entity (quét cả gốc repo là thói quen phổ biến); chuyển Flyway sang **Job riêng chạy trước deploy** (Pod app không chờ migration); cache warm / Kafka listener defer chạy **sau** readiness chứ không chặn readiness vô hạn. lazy-initialization=true chỉ nên cân nhắc khi chấp nhận: bean lỗi cấu hình không chết lúc boot mà chết lúc user chạm tới.
4. **CRaC (Coordinated Restore at Checkpoint)**: khởi động một lần đầy đủ, "chụp" process đang nóng thành checkpoint, mỗi Pod mới chỉ **restore** ~1–3 giây. JDK 21 + Spring Boot 3.2 có hỗ trợ. Đánh đổi: thao tác reopen socket/connection sau restore (pool DB, Kafka) phải được xử lý đúng — độ chín theo từng thư viện, hạ tầng build phức tạp hơn.
5. **Native image (GraalVM)**: AOT biên dịch sẵn, khởi động ~50–200 ms, RAM thấp; nhưng closed-world (reflection phải khai báo), mất peak throughput của JIT, công cụ debug/profiling hạn chế, nhiều thư viện Java cần cấu hình riêng. Hợp với function/CLI/sidecar cần scale cực nhanh; không hợp với app 600 beans dùng JAXB ở mọi ngóc ngách.

| Biện pháp | Giảm được | Giá phải trả |
|---|---|---|
| AppCDS | 10–40% | không đáng kể |
| Bớt autoconfig/scan, migration ra Job | tới vài chục % | công rà soát cấu hình |
| CRaC | tới mức giây | phức tạp toolchain, hook restore |
| Native image | tới mức 0,1s | reflection, throughput, ràng buộc thư viện |

### Lỗi hay gặp
- startupProbe period × failureThreshold nhỏ hơn thời gian worst-case (node mới + pull) — chỉ đủ cho node cũ.
- Cắt startup nhưng bỏ mặc warm-up: Ready nhanh mà p99 vẫn teo 1 phút đầu → cần gradual traffic (warmupDurationSecs của Argo Rollouts) hoặc minReplicas đủ.
- lazy init làm lỗi cấu hình xuất hiện lúc 20h thay vì lúc deploy — fail-fast là tính năng.

> Senior tip: đặt SLO cho chính thời gian khởi động, ví dụ "Pod mới Ready dưới 45s p95, kể cả trên node vừa sạch image", và **đo nó trong mỗi lần rollout** chứ không phải lúc chạy bench trên laptop. Sau khi rút xuống ~20s, giảm minReplicas các service HPA-bound theo — tiền tiết kiệm từ startup nhanh thường lớn hơn tiền tiết kiệm từ image nhỏ.`,
    follow: [
      'Phân biệt vai trò startupProbe / livenessProbe / readinessProbe khi app khởi động 2 phút; công thức chọn failureThreshold × period?',
      'Chuyển Flyway sang Job trước deploy: thứ tự an toàn với K8s và pipeline ra sao, rủi ro gì?',
      'Vì sao native image có thể CHẬM hơn JVM ở throughput đỉnh với app long-running?'
    ],
    tags: ['Startup time', 'AppCDS', 'CRaC', 'Native image', 'Spring Boot', 'Kubernetes']
  },
  {
    id: 'devops-045',
    topic: 'devops',
    level: 'senior',
    q: 'Phiên bản mới của service thanh toán đổi trường amount từ number thành string, xoá trường fee cũ và thắt chặt validation. Trong rolling update, Pod cũ và mới cùng chạy; mobile app hai phiên bản vẫn gọi vào. Bạn "tiến hoá" API này thế nào, và CI cần bảo đảm điều gì để không phá consumer?',
    a: `**Tóm tắt:** API đã publish là **hợp đồng** — bạn không kiểm soát lúc consumer nâng cấp, nên thay đổi phá vỡ (breaking change) không được "deploy một phát ăn ngay" mà phải đi theo **expand-contract ở tầng API**: mở rộng tương thích trước, chuyển dần consumer, chỉ thu gọn khi mức dùng field cũ về gần 0; thay đổi lớn thì thêm version chạy song song kèm lịch sunset. CI phải chặn breaking change **trước khi merge** bằng **contract testing** (Pact hoặc Spring Cloud Contract): provider chỉ được deploy khi thoả contract của mọi consumer đã đăng ký.

### Bảng "được phép / cấm" — thuộc lòng khi phỏng vấn
| Thay đổi | Loại | Cách an toàn |
|---|---|---|
| Thêm field optional vào response | an toàn | consumer là **tolerant reader**: bỏ qua field lạ |
| Thêm endpoint / thêm giá trị enum | gần an toàn | client parse enum chặt sẽ crash — hỏi trước |
| Nới lỏng validation (nhận nhiều hơn) | an toàn | — |
| Đổi tên field, đổi kiểu dữ liệu | **breaking** | thêm field mới song song, giữ field cũ có ngày hết hạn |
| Xoá field / xoá endpoint | **breaking** | deprecation + giám sát usage rồi mới xoá |
| Thắt validation, đổi status code, đổi định dạng ngày | **breaking âm thầm** | migrate từng consumer hoặc ra version mới |

amount number→string và xoá fee: cả hai đều breaking → phải đi qua ba pha.

### Ba pha cho chính case này
1. **Expand**: trả về **cả** {{amount}} (number, giữ nguyên hành vi) và {{amountDecimal}} (string, đúng 2 chữ số thập phân, không sai số float); validation vẫn chấp nhận input cũ. Rolling update an toàn vì cả Pod cũ lẫn Pod mới đều tôn trọng contract cũ.
2. **Migrate + đo**: công bố changelog, gắn header {{Deprecation}}/{{Sunset}}; tag {{X-Client-Version}} vào metric để xem bao nhiêu % traffic còn đọc field cũ, phân theo phiên bản app.
3. **Contract**: khi usage field cũ dưới ngưỡng (và lịch sunset đã qua), xoá field trong một release "khai tử" riêng, thông báo trước một chu kỳ.

### Versioning: chọn gì
| Cách | Ví dụ | Nhận xét |
|---|---|---|
| URI | {{/v1/payments}} | tường minh, dễ route/canary, dễ cache |
| Header | {{Api-Version: 2}} | sạch URL nhưng khó debug, khó cache |
| Media type | {{Accept: application/vnd.bank.v2+json}} | đúng lý thuyết REST, ít team dùng |
Quyết định thực dụng: **thay đổi cộng dồn không cần bump version**; chỉ bump khi breaking; v1 và v2 phục vụ song song từ cùng một codebase (hai route trỏ vào cùng handler qua adapter) để không bảo trì hai service.

### Contract testing — CI chứng minh điều gì
- **Pact (consumer-driven)**: mỗi consumer (mobile, đối tác) viết test mô tả phần response họ dùng → xuất **pact file** lên Pact Broker; CI của provider **replay mọi pact** của mọi consumer vào API thật. Gate **can-i-deploy**: "version này có phá app 3.2 chưa nâng cấp không?" — có thì chặn promote.
- **Spring Cloud Contract**: ngược chiều — provider định nghĩa contract trong repo mình, sinh ra (a) verification test cho provider, (b) **stub WireMock** để consumer test độc lập. Hợp khi bạn sở hữu cả hai phía.
- Consumer bên ngoài (đối tác): giữ **sandbox + stub** phản chiếu contract hiện hành, kèm changelog có ngày hiệu lực.

### Tolerant reader — nửa còn lại
Khi app của bạn **tiêu thụ** API người khác: cấu hình Jackson **không** fail vì field lạ ({{FAIL_ON_UNKNOWN_PROPERTIES = false}}), bỏ qua field mới thay vì crash; giá trị enum lạ coi là unknown và cảnh báo, không ném exception. Đây là chiếc khiên phòng mọi vụ đối tác đổi API lúc 3h sáng.

### Lỗi hay gặp
- "Chỉ frontend của tôi dùng thôi mà" — quên consumer thật: cron nội bộ, đối tác, webhook, app cũ chưa ép nâng cấp.
- Breaking change đi nhờ một commit refactor trong release 40 commit → đến incident mới lộ. Contract verify ở CI bắt ngay commit chứa nó.
- Siết validation "để chặn dữ liệu bẩn" làm client cũ (vẫn gửi null như trước) chết hàng loạt.
- gRPC/protobuf: **không tái sử dụng số field** đã xoá — trên wire không còn tên để mà thương lượng.

> Senior tip: biến "còn bao nhiêu % traffic dùng API cũ" thành một panel cố định; xoá endpoint mà không có số liệu này giống như rút cầu khi chưa biết còn người bên kia. Và giữ quy tắc sắt: mọi PR thay đổi schema phải kèm kết quả pact-verify — đỏ là không merge; discussion với product không thay thế được máy kiểm.`,
    follow: [
      'Đối tác EU gọi API của bạn, họ không nâng cấp theo lịch của bạn: thiết kế chính sách hỗ trợ phiên bản thế nào?',
      'Contract test phát hiện breaking change nhưng product muốn ship gấp — quy trình escape hatch của bạn ra sao?',
      'API vẫn trả 200 nhưng ý nghĩa field đổi (fee luôn bằng 0): công cụ nào bắt được kiểu breaking "âm thầm" này?'
    ],
    tags: ['API design', 'Contract testing', 'Pact', 'Versioning', 'Rolling update']
  },
  {
    id: 'devops-046',
    topic: 'devops',
    level: 'senior',
    q: 'Platform đề xuất Istio cho 30 microservice để có mTLS tự động, retry và dashboard traffic; team Java nói đã dùng Resilience4j và tự cấu hình HTTP client. Service mesh thực chất làm gì, chạy ở đâu, giá phải trả ra sao — và bạn quyết định thế nào?',
    a: `**Tóm tắt:** Service mesh là **tầng hạ tầng xử lý traffic đông–tây** (service gọi nhau): một proxy (Envoy) chạy cạnh mỗi Pod **chặn mọi request đi và đến**, nên nền tảng bật được encryption mTLS tự động + identity per-service, áp policy L7 (timeout, retry, traffic split, fault injection) và thu metric theo cặp src→dst **mà không đổi một dòng code**. Resilience4j làm việc tương tự nhưng **bên trong JVM** — biết nghiệp vụ, rẻ, không cần hạ tầng. Mesh thắng khi bài toán là của **nền tảng** (hợp nhất 30 service đa ngôn ngữ, compliance mã hoá lưu lượng, audit identity); thua khi bài toán chỉ là retry/fallback có logic nghiệp vụ.

### Nó hoạt động thế nào (đủ để nói chuyện với dân platform)
- **Sidecar**: init container cấu hình iptables trong Pod để mọi gói vào/ra đi qua Envoy; app chỉ việc gọi {{http://order-svc:8080}}, Envoy lo phần còn lại.
- **mTLS**: mỗi workload có identity từ ServiceAccount (chuẩn SPIFFE), mesh tự ký/xoay chứng chỉ, mã hoá **từng chặng** trong cluster → thoả "encrypt in transit + biết chính xác dịch vụ nào gọi dịch vụ nào" mà không ai viết dòng code TLS nào.
- **Policy dạng CRD**: VirtualService (route, retry, timeout, chia %), DestinationRule (outlier ejection, connection pool), AuthorizationPolicy (cho ai gọi ai) — khai báo trong Git, đồng bộ bằng GitOps, platform áp thống nhất.
- **Telemetry**: RED metric + trace theo cặp src/dst và status code hoàn toàn tự động.

### Mesh vs Resilience4j — không phải either/or
| | Mesh (Istio/Envoy) | Thư viện trong app (Resilience4j) |
|---|---|---|
| Chỗ chạy | process riêng cạnh Pod | cùng JVM |
| Cấu hình | CRD, platform giữ, đổi không cần build lại app | code/yml, dev giữ |
| Biết gì | HTTP status, header, latency | **ngữ cảnh**: method nào idempotent, fallback trả giá trị cache, suy giảm chức năng thế nào |
| Retry POST không idempotent | **nguy hiểm** — mesh không biết nghiệp vụ | dev kiểm soát |
| Overhead | thêm một proxy mỗi hop | gần 0 |
| Fallback theo nghiệp vụ | không làm được | làm được |
Kết luận hay dùng: **mesh cho security + traffic shifting + telemetry, thư viện trong app cho fallback/timeout theo nghiệp vụ**; retry chỉ bật ở **một** phía.

### Giá phải trả thật sự
- Latency thêm mỗi hop (dưới 1 ms tới vài ms) và CPU/memory cho Envoy mỗi Pod — service thanh toán có ngân sách p99 eo hẹp phải **đo trước khi quyết**.
- Độ phức tạp vận hành: thêm một control plane để upgrade, thêm một lớp để debug — **503 có thể sinh ra từ Envoy chứ không phải app**; on-call phải học đọc log proxy.
- Connection chồng connection: pool HTTP/JDBC của app + pool upstream của Envoy → giới hạn thật nằm ở đâu phải tính lại.
- Inject sidecar = mọi Pod phải restart; namespace chưa inject gọi sang namespace đã STRICT mTLS là chết request.

### Ambient và lựa chọn khác
Istio **ambient mode**: node-agent (ztunnel) lo mTLS/L4 cho mọi Pod, proxy L7 (waypoint) chỉ bật ở chỗ cần — giảm overhead sidecar nhưng còn mới; cân nhắc độ chín trước khi cam kết cho production thanh toán. Alternatives: Linkerd nhẹ hơn, tập trung mTLS + telemetry; hoặc **không mesh**: cert-manager + TLS ở ingress, Spring Cloud Gateway — vẫn ổn nếu 30 service đều Java và team platform nhỏ.

### Đường vào an toàn (nếu quyết làm)
1. Pilot 1–2 namespace không cốt lõi: bật mTLS ở chế độ **PERMISSIVE** (vẫn nhận clear text) → audit xem ai còn gọi thô → mới chuyển **STRICT**.
2. Bật telemetry, so p99 trước/sau tại cùng mức tải; test fault injection trên staging.
3. Làm một canary bằng VirtualService (90/10 theo header) — đây thường là tính năng "bán" mesh tốt nhất cho chính team dev.
4. Viết runbook: "Pod không lên được vì sidecar thì xử lý thế nào".

### Lỗi hay gặp
- Bật STRICT mTLS một phát → CronJob không sidecar, hệ monitoring ngoài cluster, Pod đang di chuyển giữa hai node đồng loạt lỗi.
- Mesh retry tự động trên API ghi → ghi nợ hai lần; hoặc dev thêm Resilience4j retry **chồng** mesh retry → bùng nổ 3×3 request khi đối tác chậm.
- App bind port vượt mặt mesh (hostNetwork, gọi thẳng IP + port gốc) → tưởng đã mã hoá mà chưa.

> Senior tip: đừng quyết mesh bằng câu hỏi "tool nào mạnh" mà bằng hai câu của auditor: **(1) ta có cần chứng minh mọi traffic giữa các service được mã hoá và có identity không? (2) ta có đủ người vận hành thêm một control plane không?** Ngân hàng 30 service thường trả lời "có" cho (1) — mesh là đường ngắn; startup 5 người thì "không" cho (2) — thư viện + TLS ở ingress là đúng.`,
    follow: [
      'VirtualService retry 2 lần + Resilience4j retry 2 lần cho cùng một call: hệ quả và cách đặt quy tắc "ai được retry"?',
      'Chứng minh với auditor rằng service A gọi B có identity — mesh cho bạn gì mà JWT tự chế khó có được?',
      'mTLS STRICT làm CronJob chết: phân tích nguyên nhân và thiết kế lại rollout an toàn.'
    ],
    tags: ['Service mesh', 'Istio', 'mTLS', 'Resilience4j', 'Envoy']
  },
  {
    id: 'devops-047',
    topic: 'devops',
    level: 'lead',
    q: 'Cluster production đang chậm phiên bản Kubernetes 3 bậc, EKS chỉ vá CVE cho 3 bản mới nhất; kỳ trước team "nhảy một phát" làm vỡ ingress và một nửa PDB không apply. Là tech lead, bạn biến việc upgrade thành một chương trình đều đặn hằng năm thay vì dự án 3 năm một lần như thế nào?',
    a: `**Tóm tắt:** Version delay là **nợ**: mỗi bản Kubernetes gỡ thêm API deprecated, kéo theo ma trận addon (ingress, Argo CD, cert-manager, CSI) ngày càng khó thoả mãn, và CVE không còn được vá. Chương trình nâng cấp đúng là **release train**: một minor mỗi lần, lịch cố định; công cụ quét API deprecated trên **chính manifest trong Git** từ nhiều tháng trước; thứ tự bất biến control plane → addons → node group; diễn tập trên staging **sao chép prod**; và app teams nhận bulletin thay đổi sớm thay vì nhận hậu quả muộn.

### Vì sao "chậm 3 bậc" đắt gấp nhiều lần "chậm 1 bậc"
- EKS chỉ patch CVE cho 3 phiên bản gần nhất → chậm 3 bậc là chạy bản **hết hỗ trợ bảo mật**.
- API bị **gỡ** theo mốc, YAML của bạn không tự đổi: PodDisruptionBudget {{policy/v1beta1}} và CronJob {{batch/v1beta1}} gỡ ở 1.25; HPA {{autoscaling/v2beta1}} gỡ ở 1.26; PodSecurityPolicy bị xoá hẳn ở 1.25 (thay bằng Pod Security Admission hoặc OPA/Gatekeeper). Manifest cũ lên 1.26+: {{kubectl apply}} fail, Argo CD báo OutOfSync, tệ nhất là PDB **âm thầm không tồn tại** → node drain giết quá số Pod cho phép.
- Nhảy 3 bậc cùng lúc = gộp 3 lần breaking changes + 3 vòng upgrade addon → khi sự cố xảy ra không biết thủ phạm nào; mà control plane thì **không hạ cấp được**.

### Bốn chân của chương trình
1. **Nhịp cố định**: mục tiêu "luôn chậm bản mới nhất của EKS không quá 1–2 minor"; mỗi quý một upgrade window, đối xử như release có Go/No-Go và lịch freeze (tránh trước chiến dịch bán hàng, lễ Tết).
2. **Tự động phát hiện**: chạy {{kubent}} (hoặc {{pluto}}) trên repo GitOps + helm charts mỗi tuần → bot mở PR liệt kê apiVersion sắp bị gỡ **từ nhiều tháng trước**; chuyển PDB sang {{policy/v1}} là một PR bình thường, không cần chờ tới ngày upgrade.
3. **Thứ tự nâng cấp**: control plane từng minor một (EKS không cho nhảy cách bậc) → addons (CRD trước controller) → node group **nối tiếp**, drain có PDB bảo vệ. Ràng buộc version: kubelet **không được mới hơn** apiserver; được phép chậm vài minor nhưng mục tiêu là đuổi kịp ngay.
4. **Diễn tập thật**: staging dựng bằng **đúng** repo GitOps/manifest của prod; chạy suite integration/e2e + một phiên "phá Pod xem PDB/HPA có sống". Staging không phải bản sao prod thì diễn tập chỉ kiểm tra trí tưởng tượng.

### Phần team Java phải tự làm (platform không làm thay)
- Quét manifest của service mình theo PR của kubent: apiVersion của PDB/HPA/CronJob, SecurityContext sau khi PSP mất.
- Node image mới thường chuyển **cgroup v2**: JVM đời cũ đọc giới hạn cgroup v2 sai → xác minh JDK đã hỗ trợ (bản 17/21 đều ổn, JDK 8/11 phải đủ mới), test lại {{MaxRAMPercentage}} và số GC thread sau khi đổi node image.
- Pin image theo tag bất biến/digest — nâng cấp khiến node kéo lại image, tag {{latest}} sẽ lộ đủ thứ.
- Nâng client libraries tương tác cluster (K8s Java client, version helm chart của service).

### Rollback và dây an toàn
- Control plane không rollback được → chiến lược là **giảm blast radius**: node group "canary" chạy workload không cốt lõi nâng trước, giữ một pool version cũ vài ngày làm xuồng cứu sinh; GitOps repo cho phép revert manifest addon về commit cũ.
- Trước window: snapshot PV (đặc biệt DB chạy trên cluster), etcd backup nếu self-managed — và **test restore thật**, backup chưa restore thử là backup chưa tồn tại.
- Runbook các sự cố chữ ký riêng: ingress-nginx upgrade làm hỏng webhook cấu hình, CSI driver lệch version, CoreDNS.

### Đo sức khoẻ chương trình
KPI: số minor đang chậm, **thời gian trung bình vá một CVE của runtime**, tổng effort mỗi upgrade (phải giảm dần qua các chu kỳ), số incident trong 30 ngày sau mỗi upgrade. Upgrade là một product nội bộ — có backlog, có retrospective.

> Senior tip: khác biệt giữa team "nâng cấp như địa ngục" và team "nâng cấp như routine" chỉ là hai dòng kỷ luật: (1) kubent chạy **định kỳ** chứ không chạy lúc hoảng, (2) không bao giờ nhảy nhiều hơn một minor kể cả khi "tiện thể". Sau 3 chu kỳ đúng lịch, chi phí một upgrade giảm còn bằng một buổi release bình thường — và bạn đủ tư thế trả lời audit về CVE trên runtime.`,
    follow: [
      'Sau khi nâng 1.25, PDB của 10 service âm thầm biến mất: phát hiện bằng gì, và lần node drain tới sẽ hậu quả ra sao?',
      'Node group canary: tiêu chí chọn workload "hy sinh" và điều kiện nào thì cho kéo toàn bộ cluster?',
      'Team bạn vẫn chạy bản hết support vì "bận": bạn trình bày risk với management thế nào để lấy lịch upgrade?'
    ],
    tags: ['Kubernetes upgrade', 'EKS', 'deprecation', 'PDB', 'runbook', 'tech lead']
  },
  {
    id: 'devops-048',
    topic: 'devops',
    level: 'lead',
    q: 'Chi phí hạ tầng cho 30 service tăng gấp ba sau một năm trong khi CPU sử dụng trung bình rất thấp; CFO muốn giảm 30% nhưng không đổi SLA của service thanh toán. Bạn dẫn dắt chương trình tối ưu chi phí bền vững thế nào: đo, right-size requests, VPA, spot, autoscaler và bắt các team chịu trách nhiệm con số?',
    a: `**Tóm tắt:** Node được **tính kích thước theo Σ requests**, không phải bằng usage — nên khoản lãng phí lớn nhất là các Java service khai request gấp 2–3 lần dùng thật ("cho an toàn"). Chương trình bền vững: đo theo namespace (OpenCost) → right-size request theo **p95 usage + buffer** → tăng bin packing (Karpenter/cluster autoscaler) và cắt phần "ngủ cũng tốn tiền" (minReplicas, dev/test chạy đêm) → spot ở nơi an toàn → cắt log/metric/lưu trữ/network thừa → và **gắn hoá đơn về từng team** bằng quota + showback. Con số trình CFO không phải tổng chi phí tuyệt đối mà là **cost per 1.000 giao dịch**.

### Vì sao request = tiền
Scheduler đặt Pod theo **request**: bạn xin 4Gi là node dành 4Gi cho bạn kể cả khi RSS thực dùng 1Gi; instance vẫn chạy và vẫn tính tiền. Hai chỗ rò: (a) từng service overprovision, (b) cả cluster phình vì không ai gom Pod rỗng vào một node. **limit** thì ngược lại, không ảnh hưởng lịch Pod — chỉ ảnh hưởng lúc bị siết.

### Bước 0: đo trước khi cắt
- OpenCost/Kubecost: allocation = request, có điều chỉnh theo usage; cắt theo namespace/environment/service. Mức phổ biến: **dev + test chiếm 30–40%** hoá đơn; top 10 service overprovision có thể "nuôi" được 2 service khác.
- Đường cơ sở: cost/1.000 giao dịch theo tháng. Không có baseline thì mọi con số "-x%" đều là kể chuyện.

### Right-size cho Java — không cắt vào đau
Lấy số liệu 2–4 tuần: {{container_memory_working_set_bytes}} (bộ nhớ thường trú thật của container: heap + metaspace + thread stack + direct buffer) và CPU usage kèm **CFS throttling** ({{container_cpu_cfs_throttled_periods_total}}):
- **Memory request ≈ p95 usage × 1.2**: memory không nén được; hạ quá → node-pressure eviction hoặc OOMKilled đúng giờ cao điểm. Service thanh toán cân nhắc request = limit (QoS Guaranteed).
- **CPU request có thể dưới usage** với burst (Burstable), nhưng service nhạy p99 thì giữ request = limit để không bị throttle — quyết định bằng metric throttling, không bằng cảm giác.
- VPA để chế độ **recommend** làm báo cáo soát định kỳ; **không** bật auto-apply cho app JVM: limit đổi làm {{MaxRAMPercentage}} đổi theo mỗi lần Pod tạo lại (heap hành vi không ổn định), và VPA restart Pod xung đột với HPA/rollout.
- Sau mỗi đợt đổi requests: theo dõi SLO + OOM/throttle **2 tuần** rồi mới đi đợt kế.

### Cắt tầng "đang ngủ cũng tốn tiền"
- **minReplicas**: 30 service × min 3 = sàn chi phí cố định khổng lồ. Hạ min ở service startup nhanh (bài tối ưu khởi động: ready 15s thì HPA đuổi kịp burst, không cần min 3).
- **Karpenter/cluster autoscaler**: mua instance đúng kích thước, gom Pod cho chặt, **consolidate** node rỗng — khi drain node phải tôn trọng PodDisruptionBudget.
- **dev/test**: cron scale-to-zero ngoài giờ làm việc, môi trường per-PR có TTL tự huỷ; dev không cần HA → chạy spot toàn bộ.
- **Spot cho stateless**: pool đa instance type/đa AZ, PDB + HPA floor để mất 1/3 node vẫn còn đủ năng lực; **không** spot cho batch 40 phút chưa có checkpoint; không "cả rổ" Pod thanh toán trên spot cùng lúc.

### Những hoá đơn ẩn
Log retention 90d→14d (archive nếu bắt buộc), trace sampling 100%→10% cho service ồn, dashboard không ai mở; storage gp2→gp3 (rẻ hơn, đổi không downtime); EBS volume "orphan" sau migration; snapshot để lại cả năm; ECR không lifecycle policy; **NAT gateway** — traffic đi ra S3/khác AZ của Java app bị tính tiền cả hai chiều: dùng gateway endpoint cho S3, đặt Pod cùng AZ với DB/Redis, cho upload lớn đi presigned URL.

### Làm team "sở hữu" con số — mấu chốt bền vững
- ResourceQuota/LimitRange theo namespace = **ngân sách cứng**: team muốn thêm phải nói chuyện với quota, không phải với node.
- Showback: dashboard cost per service cho từng team; đưa chi phí vào review kiến trúc — khi ai đó chọn "3 replica min cho chắc", hỏi luôn ngân sách đã duyệt chưa.
- Nhịp đều: mỗi tháng right-size top-10-waste + báo cáo cost/1.000 transactions. Một cú "-30%" kiểu dự án rồi tan băng thường quay lại đỉnh cũ sau 2 quý, kèm một sự cố do cắt tay.

### Lỗi hay gặp
- Cắt request không nhìn throttling/eviction → incident thanh toán chiều thứ sáu; cost program mất uy tín vĩnh viễn.
- VPA auto + HPA cùng quản lý một tài nguyên → hai vòng điều khiển đánh nhau.
- Đếm "số Pod" thay vì "số reservation": 40 Pod Burstable request nhỏ thường rẻ hơn 8 Pod limit-khủng.
- Cắt monitoring "để tiết kiệm": hoá đơn postmortem của một vụ không phát hiện sớm đắt hơn cả năm tiền Grafana.

> Senior tip: hai đòn ROI cao nhất gần như mọi nơi: **giảm minReplicas + right-size request** (một service trung bình giấu 3–10Gi reservation chết) và **tắt dev/test ban đêm/cuối tuần**. Trình CFO bằng đường cost/1.000 transactions — nó chứng minh bạn giảm chi phí đơn vị, không chỉ hưởng lợi khi mùa này traffic thấp.`,
    follow: [
      'CPU request dưới mức usage trung bình: khi nào an toàn, khi nào giết p99 — bạn quyết bằng metric nào?',
      'Mỗi namespace một team: thiết kế quota + quy trình "xin nâng quota" để không thành chuyện chính trị?',
      'Service thanh toán cần 100% on-demand nhưng 30% chi phí là batch: bạn tách chi phí thế nào để không đánh đổi SLA?'
    ],
    tags: ['Cost optimization', 'FinOps', 'right-sizing', 'Karpenter', 'spot', 'ResourceQuota']
  },
  {
    id: 'devops-049',
    topic: 'devops',
    level: 'mid',
    q: 'Bạn tách một file Terraform monolith (hơn 200 tài nguyên, một state) thành nhiều module và nhiều state theo service. Làm thế nào để refactor mà không xóa/tạo lại tài nguyên trên cloud? Giải thích {{moved}} block, {{terraform state mv/rm}}, và cách dùng {{terraform_remote_state}} để chia sẻ output giữa các state.',
    a: `**Tóm tắt:** Khi đổi cấu trúc code Terraform (đổi tên resource, chuyển vào module, tách state), địa chỉ của resource trong state thay đổi. Nếu bạn chỉ sửa code, Terraform thấy "địa chỉ cũ biến mất, địa chỉ mới xuất hiện" và sẽ lên kế hoạch **destroy + create** — thảm họa với RDS hay load balancer đang chạy. Giải pháp: dùng {{moved}} block (Terraform 1.1+) để khai báo "resource này đã chuyển từ địa chỉ A sang B" ngay trong code, hoặc dùng {{terraform state mv}} để sửa state thủ công. Khi tách thành nhiều state riêng, dùng {{terraform_remote_state}} data source để state A đọc output của state B.

### Thuật ngữ nền (giải thích từ đầu)

- **State (trạng thái)**: file JSON (thường lưu trên S3) là "sổ cái" ghi mỗi resource trong code tương ứng với tài nguyên thật nào trên AWS (ID, thuộc tính). Terraform dùng nó để tính diff.
- **Địa chỉ resource (resource address)**: tên định danh trong state, ví dụ {{aws_db_instance.main}} hoặc {{module.payment.aws_db_instance.main}}. Đổi địa chỉ = Terraform nghĩ đó là resource khác.
- **Module**: nhóm resource tái sử dụng, gọi như hàm. Đưa resource vào module làm địa chỉ thay đổi (thêm prefix {{module.<name>.}}).
- **Monolith state**: tất cả resource của mọi service nằm chung một file state. {{terraform plan}} phải refresh tất cả → chậm, dễ conflict, blast radius lớn (lỗi một chỗ ảnh hưởng toàn bộ).
- **Refactor (tái cấu trúc)**: thay đổi cách tổ chức code mà không thay đổi hành vi/tài nguyên thật. Với Terraform, refactor code mà không refactor state = phá hỏng.

### Ví dụ đời thường

Giống như bạn đổi cách đánh số phòng trong một tòa nhà. Phòng "101" giờ thuộc "Tầng 1, khu A" thành "A-101". Nếu bạn chỉ dán biển mới mà quên cập nhật sơ đồ tòa nhà (state), bảo vệ (Terraform) sẽ nghĩ phòng 101 bị phá bỏ và cần xây phòng A-101 mới — trong khi người vẫn đang ở trong phòng đó.

### Vấn đề: refactor gây destroy/create

~~~hcl
# TRƯỚC: resource nằm ở root
resource "aws_s3_bucket" "logs" {
  bucket = "myapp-logs-prod"
}

# SAU: chuyển vào module
module "storage" {
  source = "./modules/storage"
}
# Trong modules/storage/main.tf:
# resource "aws_s3_bucket" "logs" { bucket = "myapp-logs-prod" }
~~~

Chạy {{terraform plan}} sau khi sửa code: Terraform thấy {{aws_s3_bucket.logs}} (địa chỉ cũ) không còn trong code → plan **destroy**. Thấy {{module.storage.aws_s3_bucket.logs}} (địa chỉ mới) chưa có trong state → plan **create**. Bucket S3 có dữ liệu sẽ bị xóa!

### Cách 1: {{moved}} block (khuyến nghị, Terraform 1.1+)

Khai báo ánh xạ địa chỉ cũ → mới ngay trong code. Terraform tự động cập nhật state khi bạn chạy {{plan/apply}}.

~~~hcl
# Đặt ở root module, commit cùng với code refactor
moved {
  from = aws_s3_bucket.logs
  to   = module.storage.aws_s3_bucket.logs
}

# Có thể chain nhiều bước refactor
moved {
  from = module.storage.aws_s3_bucket.logs
  to   = module.storage.aws_s3_bucket.app_logs
}
~~~

      - **Ưu điểm**: có thể review trong PR (ai cũng thấy mapping), an toàn (Terraform validate), hoạt động với remote state và team workflow. Sau khi apply xong, {{moved}} block có thể giữ lại (không hại) hoặc xóa dần.
      - **Lưu ý**: {{from}} và {{to}} phải cùng loại resource. {{moved}} block hoạt động với cả địa chỉ resource lẻ và địa chỉ bên trong module (chỉ cần mapping địa chỉ cũ → mới chính xác).

### Cách 2: {{terraform state mv}} (thủ công)

Sửa trực tiếp state. Dùng khi cần thao tác nhanh hoặc Terraform version cũ.

~~~bash
# Di chuyển resource vào module
terraform state mv aws_s3_bucket.logs module.storage.aws_s3_bucket.logs

# Di chuyển toàn bộ module
terraform state mv module.old_name module.new_name

# LUÔN chạy plan sau để xác nhận "No changes"
terraform plan
~~~

- **Rủi ro**: thao tác trực tiếp trên state (nhất là remote). Nếu quên chạy trên đúng workspace/state, hoặc hai người làm cùng lúc → hỏng state. Nên dùng {{-state-out}} để tách ra file riêng khi chia state.
- **Backup**: S3 backend có versioning thì có thể rollback; nhưng tốt nhất {{terraform state pull > backup.tfstate}} trước.

### Cách 3: {{terraform state rm}} + {{import}} block (khi tách state)

Khi tách một nhóm resource sang **state file hoàn toàn mới** (ví dụ: tách networking ra state riêng):

~~~bash
# Ở state CŨ: xóa resource khỏi state (KHÔNG xóa trên cloud)
terraform state rm aws_vpc.main
terraform state rm aws_subnet.private[0]
# ... lặp cho các resource liên quan

# Ở state MỚI (thư mục/config riêng, backend key khác):
# Dùng import block (Terraform 1.5+) — khai báo trong code, review được
~~~

~~~hcl
# networking/imports.tf (state mới)
import {
  to = aws_vpc.main
  id = "vpc-0a1b2c3d4e5f67890"   # ID thật trên AWS
}

import {
  to = aws_subnet.private[0]
  id = "subnet-0123456789abcdef0"
}
~~~

Chạy {{terraform plan}} → Terraform sẽ generate hành động import (không create/destroy). Sau {{apply}}, xóa các {{import}} block.

### Tách state và chia sẻ dữ liệu: {{terraform_remote_state}}

Khi networking, database, application nằm ở 3 state riêng, app cần biết VPC ID và DB endpoint. Dùng **output** ở state nguồn và **data source** ở state đích.

~~~hcl
# State networking/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}
output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

# State application/main.tf — đọc output từ networking
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "mycompany-tfstate-prod"
    key    = "networking/prod/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

resource "aws_ecs_service" "app" {
  # ...
  network_configuration {
    subnets = data.terraform_remote_state.networking.outputs.private_subnet_ids
  }
}
~~~

- **Ràng buộc**: state đích phải có quyền đọc state nguồn (IAM policy cho S3 key). Output thay đổi → consumer cần {{plan/apply}} lại.
- **Thay thế**: dùng SSM Parameter Store / data source trực tiếp ({{data "aws_vpc"}}) để giảm coupling giữa state, nhưng mất tính "hợp đồng" rõ ràng của output.

### Chiến lược tách state (thu nhỏ blast radius)

| Cách tách | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| Theo môi trường | prod/staging/dev mỗi cái 1 state | An toàn, prod không bị dev ảnh hưởng | Lặp config (dùng module chung) |
| Theo thành phần | networking, data, compute, app | Blast radius nhỏ, team sở hữu riêng | Cần {{remote_state}} wiring |
| Theo vòng đời | tài nguyên sống lâu (VPC, RDS) vs ngắn (ECS task) | Ít risk khi deploy app | Phải phân loại rõ |
| Monolith | 1 state cho tất cả | Đơn giản ban đầu | Plan chậm, lock conflict, 1 lỗi ảnh hưởng tất |

### Bẫy thực tế

- **Refactor không có {{moved}} block trong PR**: reviewer không thấy mapping, CI plan hiện destroy/create khổng lồ, ai đó approve vội → mất dữ liệu. Quy tắc: PR refactor Terraform phải có {{moved}} block hoặc mô tả rõ {{state mv}} đã chạy.
- **{{terraform state rm}} nhầm**: xóa resource khỏi state không xóa trên cloud, nhưng lần plan sau Terraform muốn **tạo lại** (vì code vẫn còn) → conflict tên/ID. Luôn {{plan}} ngay sau {{state mv/rm}}.
- **Tách state nhưng quên import**: tạo state mới với code copy sang, apply → Terraform tạo resource trùng tên → lỗi "already exists" hoặc tệ hơn là tạo bản thứ hai.
- **{{terraform_remote_state}} đọc state chưa có output**: consumer plan fail. Đảm bảo thứ tự apply: networking trước, app sau. Dùng {{depends_on}} gián tiếp qua CI pipeline ordering.
- **Count/for_each thay đổi index**: đổi từ {{count}} sang {{for_each}}, hoặc đổi key, cũng làm địa chỉ thay đổi → cần {{moved}} block cho từng phần tử. Đây là nguồn destroy/create bất ngờ phổ biến nhất.

> Senior tip: Đặt quy tắc team — "mọi thay đổi địa chỉ resource phải đi kèm {{moved}} block trong cùng PR, và CI phải fail nếu plan có destroy trên resource có tag {{prevent_destroy}} hoặc là database/storage". Với monolith state trên 100 resource, ưu tiên tách theo vòng đời (networking + data layer tách riêng, app layer tách riêng) trước — đó là nơi blast radius giảm nhiều nhất với effort thấp nhất.`,
    follow: [
      'Bạn đang đổi một resource từ {{count}} sang {{for_each}}. Viết {{moved}} block để ánh xạ {{aws_subnet.private[0]}} sang {{aws_subnet.private["ap-southeast-1a"]}} và giải thích tại sao không làm sẽ gây mất subnet.',
      'Khi nào bạn chọn {{terraform_remote_state}} thay vì dùng {{data}} source trực tiếp (ví dụ {{data "aws_vpc"}}) để lấy thông tin từ stack khác? Trade-off về coupling và độ tin cậy?',
      'State bị hỏng (corrupt) sau một lần {{state mv}} lỗi giữa chừng trên local. Backend S3 có versioning. Bạn khôi phục thế nào, và làm sao ngăn lặp lại?'
    ],
    tags: ['Terraform', 'state mv', 'moved block', 'import', 'terraform_remote_state', 'refactoring']
  },
  {
    id: 'devops-051',
    topic: 'devops',
    level: 'senior',
    q: 'Hệ thống có 20 microservice Java gửi metrics, traces và logs. Chi phí observability tăng gấp 3 trong 6 tháng. Bạn thiết kế OpenTelemetry Collector pipeline (receivers, processors, exporters) như thế nào để giảm chi phí mà vẫn giữ được dữ liệu quan trọng? Giải thích tail-based sampling và trade-off của nó.',
    a: `**Tóm tắt:** **OpenTelemetry Collector** (OTel Collector, hay otelcol) là một "trạm trung chuyển" telemetry: nhận dữ liệu quan sát (metrics, traces, logs) từ ứng dụng, xử lý (lọc, gom lô, lấy mẫu, che dữ liệu nhạy cảm), rồi xuất sang các backend (Prometheus, Tempo, Loki, Datadog...). Kiến trúc pipeline gồm 3 thành phần: **receivers** (nhận vào), **processors** (xử lý giữa chừng), **exporters** (gửi ra). Để giảm chi phí mà không mất tín hiệu quan trọng, dùng **tail-based sampling** (quyết định giữ/bỏ trace sau khi thấy toàn bộ trace — giữ 100% trace lỗi và chậm, lấy mẫu ngẫu nhiên phần còn lại), kết hợp lọc span không cần thiết (health check, static asset), và kiểm soát cardinality metrics.

### Thuật ngữ nền

- **Telemetry (dữ liệu quan sát)**: 3 loại chính — **metrics** (số đo theo thời gian, rẻ, ví dụ: request/s, CPU%), **traces** (bản ghi đường đi của 1 request qua nhiều service), **logs** (ghi chép chi tiết từng sự kiện).
- **OpenTelemetry (OTel)**: bộ tiêu chuẩn mở (spec + SDK + công cụ) để thu thập telemetry. Thay thế các SDK riêng lẻ (Jaeger client, Zipkin, vendor agent).
- **OTel Collector**: tiến trình trung gian (chạy dạng DaemonSet, sidecar, hoặc Deployment riêng) nhận telemetry qua giao thức OTLP (OpenTelemetry Protocol) hoặc các giao thức khác, xử lý, rồi chuyển tiếp.
- **Pipeline**: chuỗi xử lý trong Collector — dữ liệu đi từ receiver → processor(s) → exporter. Một Collector có thể có nhiều pipeline (traces, metrics, logs riêng).
- **Sampling (lấy mẫu)**: chỉ giữ một phần traces để giảm chi phí lưu trữ/xử lý. **Head-based**: quyết định ngay khi trace bắt đầu (rẻ, đơn giản, nhưng có thể bỏ sót trace lỗi). **Tail-based**: quyết định sau khi trace hoàn thành (giữ được trace lỗi/chậm, nhưng tốn RAM và phức tạp).
- **Cardinality**: số lượng chuỗi time-series duy nhất của một metric. Tag {{userId}} với 1 triệu user = 1 triệu chuỗi → Prometheus/TSDB quá tải và tốn tiền.

### Ví dụ đời thường

OTel Collector giống trạm phân loại bưu phẩm trung tâm. **Receivers** là các cửa nhận hàng từ nhiều nguồn (bưu điện, xe tải, chuyển phát). **Processors** là dây chuyền phân loại: gộp bưu phẩm nhỏ thành lô (batch), loại bỏ thư rác/quảng cáo (filter), kiểm tra gói nào quan trọng để giữ nguyên — gói có khiếu nại (trace lỗi) luôn được giữ, gói bình thường chỉ giữ 10% ngẫu nhiên (sampling). **Exporters** là xe chuyển đến các kho khác nhau (kho lưu trữ dài hạn, kho tra cứu nhanh, kho phân tích).

### Cấu trúc pipeline

~~~yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317    # app gửi trace/metric/log qua gRPC
      http:
        endpoint: 0.0.0.0:4318    # hoặc HTTP

processors:
  memory_limiter:                   # BẢO VỆ: tránh Collector OOM
    check_interval: 5s
    limit_mib: 1500
    spike_limit_mib: 500

  batch:                            # GỘP LÔ: giảm số request ra backend
    send_batch_size: 1024
    timeout: 5s

  attributes:                       # CHE DỮ LIỆU NHẠY CẢM
    actions:
      - key: http.request.header.authorization
        action: delete
      - key: db.statement
        action: hash              # hash SQL thay vì gửi nguyên văn

  filter/traces:                    # LỌC: bỏ span không có giá trị
    traces:
      span:
        - 'attributes["http.route"] == "/actuator/health"'
        - 'attributes["http.route"] == "/actuator/prometheus"'
        - 'attributes["url.path"] == "/favicon.ico"'

  tail_sampling:                    # LẤY MẪU THÔNG MINH
    decision_wait: 30s            # chờ 30s để thu đủ span của trace
    num_traces: 100000            # buffer tối đa trace đang chờ quyết định
    policies:
      - name: errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: slow
        type: latency
        latency: { threshold_ms: 2000 }
      - name: baseline
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }

exporters:
  otlp/tempo:
    endpoint: tempo.monitoring.svc:4317
    tls: { insecure: true }
  prometheusremotewrite:
    endpoint: http://mimir.monitoring.svc/api/v1/push
  loki:
    endpoint: http://loki.monitoring.svc/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, filter/traces, tail_sampling, batch]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes, batch]
      exporters: [loki]
~~~

### Tail-based sampling: cách hoạt động và trade-off

~~~seq
title: Tail-based sampling quyết định giữ trace
actors: Service A | Service B | OTel Collector | Tempo
Service A -> OTel Collector: Span 1 (root, HTTP 200, 50ms)
Service B -> OTel Collector: Span 2 (child, DB query, 30ms)
Service A -> OTel Collector: Span 3 (HTTP 500, 2100ms)
OTel Collector -> OTel Collector: Đợi decision_wait (30s)
OTel Collector -> OTel Collector: Trace có lỗi + chậm → policy match
OTel Collector -> Tempo: Gửi toàn bộ trace (3 span)
~~~

**Cách hoạt động**: Collector gom tất cả span thuộc cùng {{traceId}} vào buffer, đợi {{decision_wait}} giây (đủ để span từ service chậm nhất đến), rồi áp dụng policy theo thứ tự. Trace khớp bất kỳ policy "giữ" nào (lỗi, chậm) → giữ toàn bộ. Không khớp → rơi vào policy {{probabilistic}} (10%).

**Trade-off**:

| Khía cạnh | Head-based sampling | Tail-based sampling |
|---|---|---|
| Quyết định | Ngay tại span đầu tiên | Sau khi có đủ span (chờ 30s+) |
| Trace lỗi/chậm | Có thể bị bỏ sót | Giữ 100% (nếu policy đúng) |
| Tài nguyên Collector | Thấp (không cần buffer) | Cao (RAM cho buffer {{num_traces}}) |
| Độ phức tạp | Đơn giản, cấu hình ở SDK | Cần Collector tập trung, stateful |
| Load balancing | Không cần | **Bắt buộc**: mọi span cùng traceId phải đến cùng 1 Collector instance |

### Vấn đề load balancing với tail sampling

Trace đi qua nhiều service → span của cùng 1 trace đến từ nhiều Pod khác nhau. Nếu Collector chạy nhiều replica (Deployment), span của cùng trace có thể rơi vào replica khác nhau → mỗi replica chỉ thấy một phần trace, quyết định sai. Giải pháp: dùng **load balancing exporter** (hoặc OTel Collector {{loadbalancing}} exporter) ở tầng đầu, route theo {{traceId}} hash để đảm bảo cùng trace → cùng Collector instance.

~~~yaml
# Collector tầng 1 (DaemonSet, nhận từ app): chỉ route
exporters:
  loadbalancing:
    routing_key: "traceID"
    protocol:
      otlp: { tls: { insecure: true } }
    resolver:
      dns:
        hostname: otel-collector-sampling.monitoring.svc
# Collector tầng 2 (StatefulSet/Deployment, có tail_sampling): xử lý
~~~

### Giảm chi phí metrics

- **Lọc metric không dùng**: {{filter/metrics}} processor bỏ metric mà không dashboard/alert nào query.
- **Giảm cardinality**: không dùng {{userId}}, {{requestId}}, URL có path param thật (ví dụ {{/orders/12345}}) làm label. Dùng {{http.route}} với template (ví dụ {{/orders/:id}} hoặc route pattern của framework). Cấu hình ở SDK (Micrometer {{MeterFilter}}) **và** ở Collector ({{attributes}} processor) — hai lớp phòng thủ.
- **Giảm tần suất scrape/export**: metric ít thay đổi (JVM version info) không cần export mỗi 15s.

### Bẫy thực tế

- **{{decision_wait}} quá ngắn**: trace qua 5 service, service cuối chậm → span cuối đến sau khi Collector đã quyết định bỏ trace → mất span. Đặt {{decision_wait}} ≥ p99 latency end-to-end của luồng chậm nhất.
- **{{num_traces}} buffer quá nhỏ**: traffic cao giờ peak, buffer đầy → Collector rơi trace mới (hoặc quyết định sớm) → mất dữ liệu đúng lúc cần nhất. Giám sát metric "dropped too early/early decisions" của {{tail_sampling}} processor (tên metric có thể khác theo phiên bản Collector; bật telemetry nội bộ để xem).
- **Tail sampling nhưng không có load balancing exporter**: chạy 3 replica Collector, trace bị chia mảnh → policy "errors" không thấy span lỗi (nằm ở replica khác) → trace lỗi bị bỏ. Đây là lỗi cấu hình phổ biến nhất.
- **{{memory_limiter}} đặt sau {{tail_sampling}}**: buffer tail sampling ăn RAM trước, memory_limiter không kịp can thiệp → Collector OOM. **memory_limiter phải là processor đầu tiên** trong pipeline.
- **Lọc health check ở SDK nhưng quên ở Collector**: nếu có service khác (không phải Java, không dùng SDK chung) vẫn gửi health span → vẫn tốn tiền. Lọc ở Collector là lưới an toàn chung.

> Senior tip: Bắt đầu bằng **head-based 10% + giữ 100% lỗi** ở SDK (đơn giản, không cần infrastructure thêm). Khi chi phí vẫn cao hoặc cần "giữ trace chậm" chính xác, mới chuyển sang tail sampling — nhưng phải đầu tư đúng: 2 tầng Collector (gateway route + sampling stateful), giám sát buffer/drop metrics, và test với traffic thật. Chi phí vận hành tail sampling (RAM, complexity) đôi khi lớn hơn tiền tiết kiệm được nếu hệ thống nhỏ; với 20 service Java traffic trung bình, head-based sampling + filter health check thường đã giảm 60–80% chi phí trace.`,
    follow: [
      'Tại sao {{memory_limiter}} phải đứng đầu danh sách processors? Điều gì xảy ra nếu bạn đặt nó sau {{tail_sampling}} và {{batch}}?',
      'Service A gọi B gọi C. Span lỗi xảy ra ở C (cuối chuỗi), nhưng {{decision_wait}} hết trước khi span C đến Collector. Trace có được giữ không? Bạn cấu hình gì để giảm rủi ro này?',
      'So sánh chi phí và độ phức tạp giữa: (1) head-based 5% ở mọi SDK, (2) tail sampling tập trung ở Collector, (3) gửi 100% trace sang backend có tính năng sampling (Jaeger/Tempo). Khi nào chọn phương án nào?'
    ],
    tags: ['OpenTelemetry', 'OTel Collector', 'tail sampling', 'receivers processors exporters', 'observability cost']
  },
  {
    id: 'devops-052',
    topic: 'devops',
    level: 'senior',
    q: 'Team dùng GitOps (Argo CD) để deploy, nhưng mật khẩu database và API key không được commit vào Git. Bạn so sánh Sealed Secrets, External Secrets Operator và SOPS: mỗi cách hoạt động thế nào, khi nào chọn cái nào, và rủi ro khi rotation (xoay mật khẩu) là gì?',
    a: `**Tóm tắt:** Trong GitOps, Git là "nguồn sự thật" cho mọi thứ — nhưng secret (mật khẩu, API key, chứng chỉ) không được lưu dạng plaintext trong Git. Ba giải pháp phổ biến: **Sealed Secrets** mã hóa secret bằng public key của controller trong cluster, commit bản mã hóa vào Git (Git chứa ciphertext an toàn); **SOPS** mã hóa field nhạy cảm trong file YAML bằng key từ KMS/age/PGP, cũng commit vào Git; **External Secrets Operator (ESO)** không lưu secret trong Git mà lưu **tham chiếu** (reference) trỏ tới secret manager bên ngoài (AWS Secrets Manager, Vault, GCP Secret Manager), ESO đồng bộ giá trị thật vào Kubernetes Secret. Chọn dựa trên: ai quản lý secret, tần suất rotation, yêu cầu audit, và mức độ phức tạp vận hành.

### Thuật ngữ nền

- **Secret (bí mật)**: thông tin nhạy cảm như mật khẩu DB, API key, TLS private key. Trong Kubernetes, {{Secret}} là resource lưu dạng base64 (không phải mã hóa) — ai có quyền đọc {{Secret}} trong namespace đều thấy plaintext.
- **GitOps**: mô hình vận hành: mọi cấu hình (Deployment, Service, ConfigMap, Secret...) được khai báo trong Git, một agent (Argo CD, Flux) tự động đồng bộ Git → cluster. Git = nguồn sự thật duy nhất.
- **Mã hóa bất đối xứng**: dùng cặp key — **public key** để mã hóa (ai cũng có), **private key** để giải mã (chỉ controller/owner giữ). Sealed Secrets dùng cách này.
- **Mã hóa đối xứng / envelope encryption**: dùng key để mã hóa dữ liệu, key đó được bảo vệ bởi key khác (KMS). SOPS dùng envelope encryption.
- **Secret manager**: dịch vụ chuyên lưu secret (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault). Cung cấp: lưu trữ mã hóa, access control, audit log, rotation tự động.
- **Rotation (xoay secret)**: thay mật khẩu/key định kỳ hoặc khi nghi ngờ lộ. Thách thức: cập nhật giá trị ở nguồn, đồng bộ xuống cluster, và ứng dụng phải nhận giá trị mới.

### Ví dụ đời thường

Giống quản lý chìa khóa văn phòng. **Sealed Secrets**: bạn bỏ chìa vào hộp khóa (mã hóa bằng public key), dán nhãn và để trên bàn lễ tân (commit vào Git) — ai cũng thấy hộp nhưng chỉ người có chìa hộp (controller trong cluster) mới mở được. **SOPS**: bạn viết danh sách chìa khóa vào sổ, nhưng mã hóa từng dòng nhạy cảm bằng mật khẩu két sắt công ty (KMS key) — sổ để trên bàn, đọc được cấu trúc nhưng không đọc được nội dung nhạy cảm. **External Secrets Operator**: sổ trên bàn chỉ ghi "chìa phòng A: xem ngăn số 5 trong két sắt ngân hàng" (tham chiếu) — nhân viên (ESO) tự đi lấy chìa thật từ két sắt (secret manager) khi cần.

### Cách 1: Sealed Secrets (Bitnami)

~~~seq
title: Sealed Secrets — mã hóa tại chỗ, giải mã trong cluster
actors: Developer | Git Repo | Argo CD | SealedSecret Controller | K8s Secret
Developer -> Developer: kubeseal --cert pub.pem < secret.yaml > sealed.yaml
Developer -> Git Repo: Commit sealed.yaml (ciphertext an toàn)
Argo CD -> SealedSecret Controller: Sync SealedSecret CRD vào cluster
SealedSecret Controller -> K8s Secret: Giải mã bằng private key → tạo Secret
~~~

~~~yaml
# sealed-secret.yaml — commit được vào Git
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: app
spec:
  encryptedData:
    password: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...  # ciphertext
    username: AgCtr8jKL...                            # ciphertext
~~~

- **Ưu điểm**: đơn giản, không cần infrastructure ngoài. Git chứa đầy đủ (kể cả secret đã mã hóa) → GitOps thuần túy. Phù hợp team nhỏ, cluster ít.
- **Nhược điểm**: rotation khó — đổi mật khẩu phải tạo SealedSecret mới, commit, đợi Argo sync. **Mất private key của controller** (disaster recovery không backup key) = không giải mã được toàn bộ SealedSecret → phải tạo lại tất cả. Audit yếu (không biết ai đọc secret khi nào). Scope mặc định gắn theo namespace/name — đổi tên hoặc chuyển namespace cần re-seal.

### Cách 2: SOPS (Mozilla, nay CNCF)

~~~yaml
# secret.enc.yaml — mã hóa bằng SOPS + AWS KMS
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
stringData:
  username: ENC[AES256_GCM,data:abc123==,iv:...,tag:...,type:str]
  password: ENC[AES256_GCM,data:xyz789==,iv:...,tag:...,type:str]
sops:
  kms:
    - arn: arn:aws:kms:ap-southeast-1:123456:key/abcd-1234
  # metadata SOPS: version, mac, ...
~~~

Argo CD cần plugin ({{ksops}}, {{helm-secrets}}) để giải mã khi sync. Hoặc dùng Flux có hỗ trợ SOPS native.

- **Ưu điểm**: linh hoạt (mã hóa chỉ field nhạy cảm, phần còn lại đọc được trong Git). Hỗ trợ nhiều backend key (AWS KMS, GCP KMS, Azure Key Vault, age, PGP). Tốt cho Helm values, Kustomize overlay.
- **Nhược điểm**: CI/CD và Argo CD cần quyền truy cập KMS key để giải mã → quản lý IAM phức tạp. Rotation tương tự Sealed Secrets (sửa file, mã hóa lại, commit). Không có audit "ai đọc secret lúc runtime". Merge conflict trên file mã hóa khó giải quyết.

### Cách 3: External Secrets Operator (ESO)

~~~yaml
# external-secret.yaml — chỉ chứa THAM CHIẾU, commit vào Git
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: app
spec:
  refreshInterval: 1h             # đồng bộ lại mỗi 1 giờ
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: db-credentials           # tên K8s Secret sẽ được tạo
    creationPolicy: Owner
  data:
    - secretKey: password          # key trong K8s Secret
      remoteRef:
        key: prod/payment/db       # path trong AWS Secrets Manager
        property: password         # field trong secret JSON
    - secretKey: username
      remoteRef:
        key: prod/payment/db
        property: username
~~~

~~~yaml
# ClusterSecretStore — cấu hình kết nối tới secret manager (1 lần)
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-southeast-1
      auth:
        jwt:
          serviceAccountRef:
            name: eso-sa
            namespace: external-secrets   # dùng IRSA (IAM Roles for Service Accounts)
~~~

- **Ưu điểm**: secret thật không bao giờ nằm trong Git. **Rotation dễ**: đổi mật khẩu trong AWS Secrets Manager → ESO tự đồng bộ (theo {{refreshInterval}}) → K8s Secret cập nhật. Audit tập trung ở secret manager (ai đọc, khi nào). Hỗ trợ nhiều backend (AWS, Vault, GCP, Azure, 1Password...).
- **Nhược điểm**: thêm dependency (ESO operator + secret manager). Cần IAM/auth setup. Nếu secret manager down, ESO không sync được secret mới (nhưng Secret cũ trong cluster vẫn còn). Chi phí dịch vụ secret manager.

### So sánh tổng quan

| Tiêu chí | Sealed Secrets | SOPS | External Secrets Operator |
|---|---|---|---|
| Secret trong Git | Ciphertext (mã hóa toàn bộ) | Ciphertext (mã hóa field) | Chỉ tham chiếu (không có giá trị) |
| Nguồn sự thật | Git | Git | Secret manager bên ngoài |
| Rotation | Thủ công: re-seal, commit, sync | Thủ công: re-encrypt, commit | Tự động: đổi ở manager, ESO sync |
| Audit đọc secret | Không | Không | Có (tại secret manager) |
| Hạ tầng thêm | Controller trong cluster | KMS/age key | ESO + secret manager |
| GitOps thuần túy | Cao | Cao | Trung bình (Git không có giá trị) |
| Phù hợp | Team nhỏ, ít secret, ít rotation | Helm values, nhiều môi trường | Production, rotation thường xuyên, compliance |

### Rotation: vấn đề mà nhiều team bỏ quên

Xoay mật khẩu DB trong secret manager (hoặc tạo SealedSecret mới) chỉ là **bước 1**. Bước 2 khó hơn: **ứng dụng phải nhận giá trị mới**.

- **Kubernetes Secret cập nhật**: ESO/SOPS controller cập nhật {{Secret}} resource. Nhưng Pod đang chạy **không tự reload** — env var được inject lúc Pod khởi động, volume mount cập nhật chậm (kubelet sync, có thể 1–2 phút) nhưng app phải đọc lại file.
- **Giải pháp**:
  - **Restart Pod có kiểm soát**: dùng {{Reloader}} (Stakater) — watcher tự trigger rolling restart Deployment khi Secret/ConfigMap đổi. Đơn giản, an toàn với rolling update.
  - **Spring Cloud Kubernetes / Spring Cloud Vault**: app tự reload property khi Secret đổi (cần cấu hình {{@RefreshScope}}). Phức tạp hơn, không phải mọi bean đều refresh đúng.
  - **Vault dynamic secrets**: Vault tạo credential DB tạm thời (TTL 1h), tự revoke. ESO hoặc Vault Agent Injector cấp credential mới. App dùng connection pool phải hỗ trợ reconnect (HikariCP {{maxLifetime}} < TTL của credential).
  - **Chấp nhận downtime ngắn**: rotation trong maintenance window, restart app. Đơn giản nhất cho team nhỏ.

### Bẫy thực tế

- **Commit plaintext Secret rồi chuyển sang Sealed Secrets**: plaintext vẫn nằm trong Git history. Phải rotate secret đó (đổi mật khẩu thật) + dùng {{git filter-repo}} hoặc BFG để xóa history (và force push — phối hợp team).
- **Sealed Secrets controller key không backup**: cluster rebuild hoặc migrate → private key mất → toàn bộ SealedSecret không giải mã được. Backup key bằng {{kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml}} và lưu an toàn (ví dụ Vault).
- **ESO {{refreshInterval}} quá dài**: rotation ở secret manager xong nhưng ESO chưa sync (còn 50 phút) → app vẫn dùng mật khẩu cũ, mật khẩu cũ đã bị revoke → lỗi kết nối. Đặt interval phù hợp (5m–15m cho secret quan trọng) hoặc trigger sync thủ công.
- **Argo CD diff luôn hiện "OutOfSync"**: ESO tạo Secret với metadata/annotation mà Git manifest không có → Argo CD thấy khác. Cấu hình {{ignoreDifferences}} trong Argo CD Application cho Secret do ESO quản lý.
- **App cache connection với credential cũ**: DB password đổi, Secret cập nhật, Pod restart — nhưng connection pool giữ connection cũ (vẫn hoạt động với một số DB cho đến khi connection bị đóng). Hiểu behavior của DB và pool.

> Senior tip: Với team mới bắt đầu GitOps, **Sealed Secrets** là điểm khởi đầu hợp lý (ít thành phần, GitOps thuần). Khi số secret tăng, cần rotation tự động, hoặc audit/compliance yêu cầu truy vết — chuyển sang **ESO + AWS Secrets Manager/Vault**. Đừng trộn 3 cách trong cùng cluster nếu không có quy ước rõ ràng (mỗi namespace một pattern) — sẽ gây nhầm lẫn "secret này quản lý ở đâu?". Dù dùng cách nào, luôn cấu hình **encryption at rest** cho etcd (KMS provider) và RBAC chặt cho phép đọc {{secrets}} resource.`,
    follow: [
      'Bạn dùng ESO với AWS Secrets Manager. DBA vừa rotate mật khẩu RDS. Mô tả toàn bộ chuỗi từ lúc đổi mật khẩu đến khi app Java dùng mật khẩu mới, kể cả trường hợp app dùng HikariCP connection pool.',
      'Sealed Secrets: controller bị xóa và redeploy, private key cũ mất. Cluster đang chạy bình thường (Secret đã được giải mã). Bạn khôi phục khả năng GitOps cho các SealedSecret hiện có như thế nào?',
      'Khi nào SOPS phù hợp hơn ESO? Cho một ví dụ cụ thể về Helm values file chứa cả config thường và config nhạy cảm.'
    ],
    tags: ['Sealed Secrets', 'External Secrets Operator', 'SOPS', 'GitOps secrets', 'secret rotation']
  },
  {
    id: 'devops-053',
    topic: 'devops',
    level: 'senior',
    q: 'Service Java deploy lên Kubernetes. Bạn cấu hình HPA (Horizontal Pod Autoscaler) nhưng gặp 3 vấn đề: (1) scale-up quá chậm khi traffic tăng đột ngột, (2) scale-down quá nhanh gây mất Pod đang warm-up, (3) CPU metric không phản ánh tải thật vì JVM GC chiếm CPU. Bạn giải quyết từng vấn đề thế nào? Giải thích stabilization window, custom metrics, và JVM warm-up.',
    a: `**Tóm tắt:** **HPA** tự động tăng/giảm số Pod dựa trên metric (CPU, memory, hoặc custom metric). Ba vấn đề thường gặp với Java: (1) scale-up chậm vì HPA đánh giá mỗi 15s + Pod mới cần 30–90s để JVM khởi động và JIT warm-up → dùng {{behavior.scaleUp}} aggressive hơn, minReplicas buffer, và tối ưu startup; (2) scale-down nhanh giết Pod vừa warm-up xong → dùng {{stabilizationWindowSeconds}} dài cho scaleDown và {{terminationGracePeriodSeconds}} đủ; (3) CPU metric bị nhiễu bởi GC pause → dùng custom metric gần tải thật hơn (RPS, p99 latency, queue depth) qua Prometheus Adapter hoặc KEDA.

### Thuật ngữ nền

- **HPA (Horizontal Pod Autoscaler)**: controller Kubernetes tự điều chỉnh {{spec.replicas}} của Deployment/StatefulSet dựa trên metric. Công thức: {{desiredReplicas = ceil(currentReplicas × currentMetric / targetMetric)}}.
- **Stabilization window (cửa sổ ổn định)**: khoảng thời gian HPA "nhìn lại" các đề xuất scale trước khi thực hiện. Chống dao động (flapping) — scale lên rồi xuống rồi lên liên tục. Mặc định: scale-down 300s, scale-up 0s.
- **Custom metric**: metric không phải CPU/memory của Pod, ví dụ: request per second, Kafka lag, queue length. Cần {{metrics-server}} cho CPU/memory, cần **Prometheus Adapter** hoặc **KEDA** cho custom/external metric.
- **JVM warm-up**: sau khi JVM khởi động, code chạy chậm ở chế độ interpreted. JIT compiler (C1/C2) dần biên dịch hot path thành native code → throughput tăng, latency giảm. Quá trình này mất 30 giây đến vài phút tùy workload.
- **GC (Garbage Collection)**: JVM tự dọn bộ nhớ. GC chiếm CPU — đặc biệt GC pause dài (Full GC) làm CPU spike nhưng không phải do traffic tăng.

### Ví dụ đời thường

HPA giống hệ thống điều hòa tự động. **CPU metric** giống cảm biến nhiệt độ đặt gần bếp — khi nấu ăn (GC chạy) nhiệt độ tăng dù phòng không có thêm người (traffic không tăng). **Stabilization window** giống bộ hẹn giờ: máy lạnh không tắt ngay khi nhiệt độ vừa đạt ngưỡng (tránh bật/tắt liên tục làm hỏng máy), mà chờ 5 phút xác nhận nhiệt độ ổn định. **JVM warm-up** giống xe máy mùa đông: mới nổ máy chạy yếu, cần đạp ga nhẹ vài phút mới êm — nếu bạn cho xe chạy chở hàng nặng ngay (route traffic vào Pod mới chưa warm), xe ì ạch (latency cao).

### Vấn đề 1: Scale-up quá chậm

**Nguyên nhân gộp**:
- HPA check metric mỗi 15s ({{--horizontal-pod-autoscaler-sync-period}}).
- Sau khi quyết định scale, Pod mới cần: scheduling (1–5s) + pull image (0s nếu cached) + JVM start (10–30s) + Spring context init (10–30s) + JIT warm-up (30–120s) + readiness probe pass.
- Tổng cộng: 1–3 phút từ lúc traffic tăng đến lúc Pod mới thực sự phục vụ tốt.

**Giải pháp**:

~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-api
  minReplicas: 3              # buffer: luôn đủ gánh tải bình thường
  maxReplicas: 20
  metrics:
    - type: Pods
      pods:
        metric:
          name: http_server_requests_per_second
        target:
          type: AverageValue
          averageValue: "50"   # 50 RPS/Pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0     # phản ứng ngay khi metric vượt ngưỡng
      policies:
        - type: Percent
          value: 100                    # cho phép tăng gấp đôi mỗi lần
          periodSeconds: 60
        - type: Pods
          value: 4                      # hoặc thêm tối đa 4 Pod mỗi 60s
          periodSeconds: 60
      selectPolicy: Max                 # chọn policy cho phép scale nhanh nhất
    scaleDown:
      stabilizationWindowSeconds: 600   # chờ 10 phút trước khi scale down
      policies:
        - type: Percent
          value: 10                     # giảm tối đa 10% mỗi 60s
          periodSeconds: 60
      selectPolicy: Min
~~~

**Tối ưu startup Java**:
- **Startup probe** đủ dài: {{initialDelaySeconds: 10, periodSeconds: 5, failureThreshold: 24}} (cho phép 130s). Tránh kubelet giết Pod đang khởi động.
- **Readiness probe** chỉ pass khi app thực sự sẵn sàng (DB connected, cache warmed). Không dùng {{/actuator/health}} mặc định nếu nó trả UP quá sớm.
- **CDS (Class Data Sharing)**: {{java -Xshare:auto -XX:SharedArchiveFile=app.jsa}} giảm thời gian load class. Spring Boot 3.3+ hỗ trợ {{-Dspring.context.exit=onRefresh}} để tạo CDS archive.
- **GraalVM native image**: startup ~50ms, nhưng trade-off: peak throughput thấp hơn JIT, build chậm, reflection cần cấu hình. Phù hợp serverless/scale-to-zero, cân nhắc cho service long-running.

### Vấn đề 2: Scale-down quá nhanh giết Pod đang warm-up

**Kịch bản**: traffic spike → HPA scale up 3 → 8 Pod → 5 Pod mới khởi động, đang warm-up → traffic giảm nhẹ → HPA scale down sau 15s (nếu stabilization = 0) → giết 2 Pod vừa warm-up xong → latency spike → HPA scale up lại → dao động.

**Giải pháp**:
- {{stabilizationWindowSeconds: 600}} cho scaleDown: HPA nhìn lại 10 phút, chỉ scale down nếu metric thấp ổn định suốt 10 phút.
- {{terminationGracePeriodSeconds: 120}}: Pod nhận SIGTERM có 120s để xử lý hết request đang giữ (drain).
- **PreStop hook**: {{sleep 10}} để load balancer/endpoint controller kịp gỡ Pod khỏi danh sách trước khi app ngừng nhận request.

~~~yaml
# Trong Pod spec
terminationGracePeriodSeconds: 120
containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["sh", "-c", "sleep 10"]
~~~

- **PodDisruptionBudget** (PDB): {{minAvailable: 50%}} đảm bảo scale-down/rolling update không giết quá nhiều Pod cùng lúc.

### Vấn đề 3: CPU metric không phản ánh tải thật

**Kịch bản**: service Java I/O-bound (chờ DB, gọi HTTP). CPU thấp (20%) dù RPS cao và latency tăng. HPA không scale. Ngược lại, GC Full GC spike CPU lên 90% trong 2 giây → HPA muốn scale up dù traffic bình thường.

**Giải pháp: custom metric gần tải thật hơn**

| Metric | Khi nào dùng | Cách lấy |
|---|---|---|
| RPS (requests/second per Pod) | API service, tải tỷ lệ với request | Prometheus Adapter: {{http_server_requests_seconds_count}} rate |
| p99 latency | SLA-driven, latency là thứ người dùng cảm nhận | Prometheus Adapter, cần cẩn thận (latency tăng do downstream → scale không giúp) |
| Queue depth / consumer lag | Worker, Kafka consumer | KEDA scaler hoặc Prometheus Adapter |
| Active connections / thread pool usage | Service có thread pool giới hạn | Micrometer gauge → Prometheus → Adapter |

~~~yaml
# Prometheus Adapter config (ConfigMap) — map PromQL thành custom metric
rules:
  - seriesQuery: 'http_server_requests_seconds_count{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace: { resource: "namespace" }
        pod: { resource: "pod" }
    name:
      matches: "^(.*)_count$"
      as: "http_requests_per_second"
    metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
~~~

**Lưu ý**: CPU metric vẫn hữu ích làm **sàn** (floor) — đặt 2 metric trong HPA (CPU + RPS), HPA lấy giá trị cao hơn (scale nhiều hơn). Tránh trường hợp RPS thấp nhưng 1 request chiếm 100% CPU.

### Bẫy thực tế

- **Không đặt {{requests.cpu}}**: HPA theo CPU tính {{currentMetric / targetMetric}} dựa trên {{requests}}. Không có request → HPA báo {{<unknown>}} → không scale.
- **{{stabilizationWindowSeconds: 0}} cho cả scaleUp và scaleDown**: flapping nghiêm trọng. Luôn đặt scaleDown window dài (300–600s).
- **Target RPS quá cao**: 1 Pod Java handle 200 RPS ở warm state nhưng chỉ 50 RPS lúc cold → HPA tính theo 200, scale ra ít Pod → Pod mới cold nhận traffic → latency spike. Đặt target theo throughput **cold/warm trung bình**, không phải peak benchmark.
- **Custom metric lag**: Prometheus scrape mỗi 15–30s, Adapter query có delay → HPA quyết định dựa trên dữ liệu 30–60s trước. Kết hợp với {{minReplicas}} buffer cho burst.
- **Readiness probe trả 200 ngay khi Spring context up**: traffic đổ vào Pod chưa JIT warm → p99 spike 5–10x trong 1–2 phút đầu. Dùng custom readiness: chỉ UP sau khi xử lý N request warm-up hoặc sau delay.

> Senior tip: Với Java trên Kubernetes, HPA là **cần nhưng chưa đủ**. Công thức thực tế: (1) {{minReplicas}} đủ gánh baseline + buffer 30%, (2) HPA scale theo **RPS hoặc custom metric** (không chỉ CPU), (3) scaleUp nhanh + scaleDown chậm (stabilization 10 phút), (4) tối ưu startup (CDS, readiness đúng nghĩa), (5) PDB + graceful shutdown. Đo bằng load test: ramp traffic từ baseline lên 3x trong 2 phút, xem p99 có spike không và HPA mất bao lâu để ổn định — con số đó mới là "thời gian phản ứng thật" của hệ thống, không phải 15s sync period.`,
    follow: [
      'Bạn đặt HPA với 2 metric: CPU target 70% và RPS target 50/Pod. Lúc này CPU = 40%, RPS = 80/Pod. HPA tính desiredReplicas theo metric nào và tại sao?',
      'Startup probe, liveness probe, readiness probe — mỗi cái ảnh hưởng thế nào đến HPA và traffic routing? Pod Java đang warm-up 60s: cấu hình 3 probe này ra sao?',
      'Khi nào bạn chọn KEDA thay vì HPA + Prometheus Adapter? Cho ví dụ workload cụ thể mà HPA thuần không xử lý được.'
    ],
    tags: ['HPA', 'stabilization window', 'JVM warm-up', 'custom metrics', 'autoscaling', 'Prometheus Adapter']
  },
  {
    id: 'devops-054',
    topic: 'devops',
    level: 'senior',
    q: 'Team deploy service Java bằng Argo Rollouts với chiến lược canary: 5% → 25% → 50% → 100%. Bạn cấu hình AnalysisTemplate dùng Prometheus metric để tự động promote hoặc rollback như thế nào? Khi nào canary tự động rollback sai (false positive), và khi nào nó bỏ sót lỗi thật (false negative)?',
    a: `**Tóm tắt:** **Argo Rollouts** là công cụ progressive delivery cho Kubernetes, thay thế Deployment bằng CRD {{Rollout}} hỗ trợ canary và blue-green. **AnalysisTemplate** định nghĩa các "bài kiểm tra" (metric query, threshold) chạy trong mỗi bước canary — nếu metric vượt ngưỡng (ví dụ: error rate > 1%), rollout tự **abort** và scale canary về 0. Ngược lại, tất cả analysis pass → tự **promote** lên bước tiếp. Rủi ro: **false positive** (rollback oan) khi traffic thấp, metric nhiễu, hoặc baseline không ổn định; **false negative** (bỏ sót lỗi) khi sample quá nhỏ ở bước 5%, metric không đo đúng lỗi, hoặc cửa sổ quan sát quá ngắn.

### Thuật ngữ nền

- **Progressive delivery (triển khai tiến bộ)**: đưa phiên bản mới ra từ từ (1% → 5% → 25% → 100%) thay vì thay toàn bộ cùng lúc. Giảm blast radius (phạm vi ảnh hưởng) nếu có lỗi.
- **Canary**: phiên bản mới nhận một phần nhỏ traffic thật để "thử". Tên lấy từ chuyện chim hoàng yến trong mỏ than — nếu chim ngất, thợ mỏ biết có khí độc.
- **Argo Rollouts**: Kubernetes controller (CRD) mở rộng Deployment. Quản lý 2 ReplicaSet (stable + canary), điều phối traffic weight, chạy analysis.
- **AnalysisTemplate / AnalysisRun**: {{AnalysisTemplate}} là "bài kiểm tra" tái sử dụng (query Prometheus, Web hook, Job...). {{AnalysisRun}} là instance chạy thực tế trong một rollout. Kết quả: {{Successful}}, {{Failed}}, {{Inconclusive}}.
- **Promote / Abort**: promote = canary pass, chuyển sang bước tiếp hoặc hoàn tất (canary trở thành stable). Abort = analysis fail, rollback (scale canary về 0, stable nhận lại 100%).
- **Baseline comparison**: so sánh metric của canary với stable (cùng thời điểm) thay vì so với ngưỡng cố định. Tránh false positive khi cả hệ thống đang có vấn đề (không phải do canary).

### Ví dụ đời thường

Giống mở chi nhánh nhà hàng mới. Thay vì đổi toàn bộ menu (deploy 100%) rồi phát hiện khách chê, bạn thử món mới với 5% khách (canary 5%), theo dõi: tỷ lệ phàn nàn có tăng không? Khách có quay lại không? Nếu 5% khách đầu ổn, mở rộng cho 25%. Nếu tỷ lệ phàn nàn gấp đôi → rút món mới (abort). Nhưng nếu chỉ có 10 khách thử (sample nhỏ), 1 người phàn nàn = 10% — nghe đáng sợ nhưng chưa đủ kết luận (false positive). Ngược lại, món mới có lỗi nhỏ chỉ 2% khách gặp — với 10 khách thử, có thể không ai gặp (false negative).

### Cấu hình Rollout + AnalysisTemplate

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-api
spec:
  replicas: 10
  strategy:
    canary:
      canaryService: payment-api-canary   # Service trỏ tới canary Pod
      stableService: payment-api-stable   # Service trỏ tới stable Pod
      trafficRouting:
        nginx:
          stableIngress: payment-api-ingress
      steps:
        - setWeight: 5
        - pause: { duration: 5m }          # chờ 5 phút thu thập metric
        - analysis:
            templates:
              - templateName: error-rate-check
            args:
              - name: service
                value: payment-api-canary
        - setWeight: 25
        - pause: { duration: 10m }
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
            args:
              - name: service
                value: payment-api-canary
        - setWeight: 50
        - pause: { duration: 10m }
        - analysis:
            templates:
              - templateName: error-rate-check
              - templateName: latency-check
        - setWeight: 100
      # Tự động rollback nếu analysis fail
      abortScaleDownDelaySeconds: 30
~~~

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate-check
spec:
  args:
    - name: service
  metrics:
    - name: error-rate
      interval: 60s                  # kiểm tra mỗi 60 giây
      count: 5                       # chạy 5 lần
      failureLimit: 2                # fail 2/5 lần → abort
      successCondition: result[0] < 0.01   # error rate < 1%
      failureCondition: result[0] >= 0.05  # error rate >= 5% → fail ngay
      inconclusiveLimit: 3           # 3 lần inconclusive → inconclusive
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            sum(rate(http_server_requests_seconds_count{
              service="{{ args.service }}", status=~"5.."
            }[5m]))
            /
            sum(rate(http_server_requests_seconds_count{
              service="{{ args.service }}"
            }[5m]))
~~~

~~~yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: latency-check
spec:
  args:
    - name: service
  metrics:
    - name: p99-latency
      interval: 60s
      count: 5
      failureLimit: 2
      successCondition: result[0] < 500    # p99 < 500ms
      provider:
        prometheus:
          address: http://prometheus.monitoring.svc:9090
          query: |
            histogram_quantile(0.99,
              sum(rate(http_server_requests_seconds_bucket{
                service="{{ args.service }}"
              }[5m])) by (le)
            ) * 1000
~~~

### Luồng canary với analysis

~~~seq
title: Argo Rollouts canary với auto analysis
actors: Argo Rollouts | Canary Pod | Stable Pod | Prometheus | SRE
Argo Rollouts -> Canary Pod: Deploy canary, setWeight 5%
Argo Rollouts -> Argo Rollouts: Pause 5 phút
Argo Rollouts -> Prometheus: Query error-rate (5 lần, mỗi 60s)
Prometheus --> Argo Rollouts: result = 0.003 (OK)
Argo Rollouts -> Canary Pod: setWeight 25%
Argo Rollouts -> Prometheus: Query error-rate + p99
Prometheus --> Argo Rollouts: error-rate = 0.08 (FAIL)
Argo Rollouts -> Canary Pod: Abort — scale to 0
Argo Rollouts -> Stable Pod: 100% traffic về stable
Argo Rollouts -> SRE: Notification (Slack/webhook)
~~~

### False positive: rollback oan

| Nguyên nhân | Ví dụ | Giảm thiểu |
|---|---|---|
| **Sample quá nhỏ** ở bước 5% | 5% của 100 RPS = 5 RPS. 1 lỗi = 20% error rate | Đặt {{count}} đủ lớn, tăng {{pause}} duration, dùng {{inconclusiveLimit}} (chưa đủ dữ liệu → chờ, không abort) |
| **JVM cold start** của canary Pod | Pod mới warm-up 60s, p99 spike 3x → latency check fail | Warm-up: {{setCanaryScale}} tăng Pod trước {{setWeight}}, hoặc dùng readiness gate + delay analysis |
| **Metric nhiễu** (noisy baseline) | Service vốn có error rate 0.5–2% dao động | Dùng **baseline comparison** (so canary vs stable cùng lúc) thay vì ngưỡng cố định |
| **Lỗi do dependency, không phải canary** | DB chậm → cả stable và canary đều lỗi | Baseline comparison: canary error rate / stable error rate < 1.5 |
| **{{failureLimit}} quá nhạy** | 1 lần fail trong 5 lần → abort, dù 4 lần kia OK | Đặt {{failureLimit: 2}} hoặc 3, kết hợp {{successCondition}} rõ ràng |

**Baseline comparison** (Argo Rollouts hỗ trợ qua {{AnalysisTemplate}} với 2 query hoặc dùng Kayenta/Datadog):

~~~yaml
metrics:
  - name: canary-vs-stable
    interval: 60s
    count: 5
    failureLimit: 2
    provider:
      prometheus:
        query: |
          (
            sum(rate(http_server_requests_seconds_count{service="{{args.canary}}",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="{{args.canary}}"}[5m]))
          ) - (
            sum(rate(http_server_requests_seconds_count{service="{{args.stable}}",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="{{args.stable}}"}[5m]))
          )
    successCondition: result[0] < 0.005    # canary chỉ được tệ hơn stable tối đa 0.5%
~~~

### False negative: bỏ sót lỗi thật

| Nguyên nhân | Ví dụ | Giảm thiểu |
|---|---|---|
| **Sample quá nhỏ** ở 5% | Lỗi chỉ xảy ra với 1% request (edge case) → 5% traffic × 1% = 0.05% → có thể không thấy | Tăng traffic tổng, kéo dài pause, thêm bước 10% |
| **Metric không đo đúng lỗi** | Canary trả HTTP 200 nhưng response body sai (logic bug) | Thêm **business metric** (tỷ lệ đơn hàng thành công, checksum) hoặc **synthetic test** (Job chạy test case) |
| **Cửa sổ quan sát quá ngắn** | Memory leak: 5 phút đầu OK, 30 phút sau OOM | Thêm analysis chạy dài hơn ở bước cuối, giám sát memory trend |
| **Lỗi chỉ xảy ra ở traffic pattern cụ thể** | Lỗi chỉ khi user gửi payload > 1MB, mà canary 5% chưa nhận request đó | Traffic mirroring (shadow traffic) trước canary, hoặc header-based routing để test với traffic cụ thể |
| **Ngưỡng quá lỏng** | {{successCondition: result[0] < 0.05}} (5% error rate vẫn pass) | Đặt ngưỡng dựa trên SLO thực tế, review định kỳ |

### Bẫy thực tế

- **Không có {{failureCondition}}**: chỉ có {{successCondition}} → metric trả về giá trị "giữa" (không pass, không fail rõ) → kết quả {{Inconclusive}} lặp lại. Đặt cả {{failureCondition}} (abort nhanh khi rõ ràng tệ) và {{inconclusiveLimit}}.
- **Prometheus query chia cho 0**: canary mới deploy, chưa có request → mẫu số = 0 → query trả NaN/Inf → analysis {{Inconclusive}} hoặc {{Error}}. Thêm điều kiện {{or vector(0)}} và xử lý trong query.
- **Canary và stable dùng chung DB migration chưa tương thích**: canary chạy code mới cần cột mới, stable chạy code cũ — migration phải **backward-compatible** (expand-contract pattern). Canary analysis sẽ pass nhưng rollback sau đó có thể fail.
- **{{abortScaleDownDelaySeconds}} quá ngắn**: abort xong, canary Pod bị xóa ngay → mất log/metric để debug. Đặt 30–60s hoặc giữ Pod ở trạng thái {{Paused}} để điều tra.

> Senior tip: Canary analysis chỉ tốt bằng metric bạn đo. Bắt đầu với 2 metric: **error rate** (5xx) và **p99 latency** — so sánh baseline (canary vs stable), không dùng ngưỡng cố định. Thêm business metric (conversion, success rate) khi đã ổn định. Luôn có **manual gate** (bước {{pause}} không có duration, chờ {{kubectl argo rollouts promote}}) ở bước trước 100% cho service critical — tự động hóa hoàn toàn là mục tiêu, nhưng đến đó cần nhiều iteration tuning analysis. Ghi lại mọi lần false positive/negative và điều chỉnh {{failureLimit}}, {{count}}, {{interval}} — analysis template là "bộ test production", cần maintain như test code.`,
    follow: [
      'Tại sao baseline comparison (canary vs stable cùng thời điểm) tốt hơn ngưỡng cố định? Cho ví dụ cụ thể khi ngưỡng cố định gây false positive dù canary không có lỗi.',
      'Bước canary 5% trên service có 20 RPS. Analysis chạy 5 lần, mỗi 60s. Mỗi lần query trung bình bao nhiêu request? Đủ để kết luận error rate 1% không? Bạn điều chỉnh gì?',
      'Canary pass tất cả analysis, promote 100%. 2 giờ sau phát hiện memory leak (OOMKilled mỗi 3h). Analysis đã bỏ sót — bạn bổ sung analysis gì và ở bước nào?'
    ],
    tags: ['Argo Rollouts', 'canary', 'AnalysisTemplate', 'progressive delivery', 'Prometheus analysis']
  },
  {
    id: 'devops-055',
    topic: 'devops',
    level: 'lead',
    q: 'Công ty có 20 team, mỗi team tự build CI/CD pipeline riêng cho service Java. Kết quả: 20 cách deploy khác nhau, onboarding dev mới mất 2 tuần chỉ để hiểu pipeline, và incident do pipeline lỗi tăng. Bạn thiết kế một Internal Developer Platform (IDP) với "golden path" như thế nào? Làm sao để team tự nguyện dùng mà không bị coi là áp đặt từ trên xuống?',
    a: `**Tóm tắt:** **Internal Developer Platform (IDP)** là một lớp tự phục vụ (self-service) mà platform team xây dựng, giúp product team ship code nhanh mà không cần hiểu sâu hạ tầng. **Golden path** (đường mòn vàng) là "cách làm mặc định được hỗ trợ tốt nhất" — ví dụ: tạo service mới từ template → có sẵn CI/CD, observability, security scan, deploy lên Kubernetes — mọi thứ hoạt động trong 30 phút thay vì 2 tuần. Golden path không bắt buộc (team vẫn có thể đi đường khác), nhưng được thiết kế đủ tốt để team **muốn** dùng. Thành công phụ thuộc vào: giải quyết pain thật, co-design với team, đo lường adoption, và vận hành platform như một sản phẩm nội bộ.

### Thuật ngữ nền

- **IDP (Internal Developer Platform)**: tập hợp công cụ, template, API, UI mà platform team cung cấp để developer tự phục vụ (tạo service, deploy, xem log, tạo DB) mà không cần ticket cho ops. Ví dụ công cụ: Backstage (Spotify), Port, Humanitec.
- **Platform team (đội nền tảng)**: team chuyên xây dựng và vận hành IDP. Khách hàng của họ là các product team (developer nội bộ), không phải end user.
- **Golden path (đường mòn vàng)**: quy trình mặc định, được tài liệu hóa, được hỗ trợ, bao phủ 80% use case phổ biến. "Paved road" — đi trên đường này thì mượt; đi ra ngoài thì được phép nhưng tự chịu trách nhiệm.
- **Self-service**: developer thực hiện thao tác (tạo service, provision DB, deploy) qua UI/CLI/API mà không cần chờ ai approve thủ công. Có guardrail (giới hạn, policy) tự động.
- **Cognitive load (tải nhận thức)**: lượng kiến thức mà developer phải giữ trong đầu để làm việc. 20 pipeline khác nhau = cognitive load cao khi dev chuyển team.

### Ví dụ đời thường

Giống hệ thống đường trong thành phố. **Không có IDP**: mỗi khu dân cư tự đắp đường đất đến trung tâm — có đường rộng, đường hẹp, đường lầy; người mới chuyển nhà mất 2 tuần học đường. **Golden path**: thành phố xây đường nhựa chuẩn (template) nối mọi khu đến trung tâm, có biển chỉ dẫn (docs), đèn giao thông (CI/CD stages), camera giám sát (observability). Ai cũng có thể tự đắp đường riêng nếu cần, nhưng 90% người đi đường nhựa vì nhanh và an toàn. **Platform team** giống sở giao thông: họ không lái xe hộ, họ xây và bảo trì đường.

### Thiết kế golden path cho service Java

~~~text
Golden Path: "Tạo service Java mới → Production trong 1 ngày"

Bước 1: Developer chạy lệnh (hoặc dùng Backstage UI)
  $ platform create-service --name order-service --type java-spring --team checkout

Bước 2: Template tự động tạo:
  ├── Git repo (order-service/)
  │   ├── src/                    (Spring Boot skeleton)
  │   ├── Dockerfile              (multi-stage, base image chuẩn)
  │   ├── pom.xml                 (parent POM nội bộ, dependencies chuẩn)
  │   ├── .gitlab-ci.yml          (pipeline chuẩn: build → test → scan → deploy)
  │   ├── k8s/                     (Helm chart hoặc Kustomize base)
  │   │   ├── deployment.yaml     (probes, resources, security context)
  │   │   ├── service.yaml
  │   │   └── hpa.yaml
  │   ├── catalog-info.yaml       (Backstage metadata)
  │   └── README.md               (hướng dẫn team-specific)
  ├── CI/CD pipeline (đã cấu hình, chạy được ngay)
  ├── Argo CD Application (GitOps, deploy tới staging)
  ├── Grafana dashboard (RED metrics, tự tạo từ template)
  ├── PagerDuty/OpsGenie service (on-call routing)
  └── Slack channel #alerts-order-service

Bước 3: Developer push code → pipeline chạy → deploy staging tự động
Bước 4: Promote production qua merge request (có approval gate)
~~~

### Kiến trúc IDP (các thành phần)

| Thành phần | Công cụ ví dụ | Chức năng |
|---|---|---|
| **Service catalog** | Backstage, Port | Danh mục tất cả service, owner, docs, status. "Ai sở hữu service X?" |
| **Scaffolding/template** | Backstage Software Templates, Cookiecutter | Tạo service mới từ template chuẩn |
| **CI/CD chuẩn** | Shared pipeline library (GitLab CI includes, GitHub reusable workflows) | Pipeline nhất quán: build, test, SAST, container scan, deploy |
| **GitOps** | Argo CD, Flux | Deploy declarative, audit trail trong Git |
| **Observability mặc định** | OTel SDK auto-instrumentation, Grafana dashboard template | Metrics, traces, logs có sẵn khi service tạo |
| **Secret management** | ESO + AWS Secrets Manager | Self-service tạo secret, rotation tự động |
| **Infrastructure self-service** | Crossplane, Terraform modules | Developer tự tạo DB, queue, bucket qua PR/YAML (có guardrail) |

### Làm sao team tự nguyện dùng (không áp đặt)

**1. Giải quyết pain thật, không phải pain tưởng tượng**

Trước khi build, phỏng vấn 5–8 team: "Bạn mất thời gian nhất ở đâu khi ship code?" Câu trả lời thường là: "setup CI mất 3 ngày", "không biết config Kubernetes thế nào", "mỗi lần deploy production phải nhờ ops". Golden path phải giải quyết đúng những pain này — không phải build portal đẹp nhưng không ai cần.

**2. Co-design, không phải hand-off**

Mời developer từ 2–3 team tham gia thiết kế template và pipeline. Họ biết edge case thực tế. Khi họ góp phần xây, họ trở thành "champion" vận động team mình dùng. Platform team **không** build xong rồi ném qua tường.

**3. Golden path, không phải golden cage**

- Team **được phép** đi đường khác (custom pipeline, config riêng) — nhưng họ tự chịu trách nhiệm vận hành.
- Golden path phải **opt-out dễ**, không phải opt-in khó. Mặc định = golden path; thoát ra = có lý do và tự support.
- Cung cấp **extension point**: template cho phép override (ví dụ: thêm build step riêng) mà không fork toàn bộ pipeline.

**4. Đo lường adoption bằng giá trị, không bằng mệnh lệnh**

| Metric | Ý nghĩa | Mục tiêu |
|---|---|---|
| Time to first deploy (service mới) | Từ tạo repo đến deploy staging | < 1 ngày (trước: 2 tuần) |
| Deployment frequency | Số lần deploy/tuần/team | Tăng (dễ deploy = deploy nhiều hơn) |
| Lead time for changes | Commit → production | Giảm |
| Adoption rate | % service dùng golden path | Theo dõi xu hướng, không đặt quota cứng |
| Developer satisfaction (survey) | NPS/CSAT nội bộ | > 7/10 |

Không bắt KPI "100% team phải dùng golden path trong Q3" — đó là áp đặt. Thay vào đó, cho thấy số liệu: "Team dùng golden path deploy nhanh gấp 5 lần, incident do pipeline giảm 60%."

**5. Vận hành platform như sản phẩm nội bộ**

- Platform team có **roadmap, backlog, sprint** — ưu tiên theo nhu cầu product team.
- Có **support channel** (Slack #platform-help), SLA phản hồi.
- **Docs, examples, migration guide** cho team muốn chuyển từ pipeline cũ.
- **Changelog**: thông báo khi template/pipeline cập nhật, có migration path.
- Thu thập feedback định kỳ (survey quý, office hours).

### Bẫy thực tế

- **Build platform trước khi hiểu vấn đề**: 6 tháng build portal Backstage đẹp, nhưng pain thật của team là "chờ ops cấp DB mất 2 tuần" — portal không giải quyết. Nói chuyện với team trước, build thứ đau nhất trước.
- **Golden path quá cứng**: template không cho override gì → team có nhu cầu đặc biệt (gRPC service, batch job, ML pipeline) bị ép vào khuôn → họ fork template và không bao giờ quay lại. Thiết kế extension point.
- **Platform team thành bottleneck**: mọi thay đổi pipeline phải qua platform team review/merge → team chờ đợi, platform team quá tải. Cho phép team contribute vào template (inner-source model), platform team review nhưng không phải người duy nhất sửa.
- **Không maintain template**: template tạo 1 năm trước, dependency cũ, base image có CVE → service mới sinh ra đã nợ kỹ thuật. Lên lịch cập nhật template định kỳ, tự động PR bump dependency.
- **Ép migration "big bang"**: yêu cầu 20 team chuyển pipeline trong 1 tháng → kháng cự, lỗi, burnout. Migration dần: team mới dùng golden path mặc định, team cũ migrate khi có dịp (refactor, thêm feature). Đặt deadline mềm, hỗ trợ migration.

> Senior tip: IDP thành công khi developer **không nghĩ về platform** — họ chỉ thấy "tạo service mới mất 10 phút, deploy dễ, có dashboard sẵn". Đo lường thành công bằng "time to first deploy" và "developer satisfaction", không phải "số feature của platform". Bắt đầu nhỏ: 1 golden path cho 1 loại service phổ biến nhất (Spring Boot REST API), làm thật tốt, có 3–5 team dùng thành công và nói tốt về nó — rồi mới mở rộng. Platform team 2–3 người phục vụ 20 team là khả thi nếu golden path giảm 80% ticket ops, nhưng chỉ khi scope được kiểm soát chặt.`,
    follow: [
      'Một team muốn dùng Quarkus thay vì Spring Boot. Golden path chỉ hỗ trợ Spring Boot. Bạn xử lý thế nào — mở rộng golden path, cho team tự build, hay từ chối? Tiêu chí quyết định?',
      'Làm sao bạn đo "cognitive load" giảm sau khi có IDP? Metric nào cụ thể, và bạn thu thập dữ liệu đó như thế nào?',
      'Platform team có 3 người, 20 product team. 6 tháng sau, platform team trở thành bottleneck (mọi request đều chờ họ). Bạn tái cấu trúc vận hành thế nào?'
    ],
    tags: ['IDP', 'golden path', 'internal developer platform', 'platform team', 'developer experience']
  },
  {
    id: 'devops-056',
    topic: 'devops',
    level: 'lead',
    q: 'Công ty có 8 team on-call, mỗi team 4–5 người xoay ca. Sau 6 tháng: 2 người nghỉ việc vì kiệt sức, alert channel có 200+ alert/tuần nhưng 70% là noise, và thời gian phản hồi incident thực sự chậm vì mọi người "chịu đựng" alert. Bạn thiết kế chính sách on-call bền vững: cấu trúc rota, giảm alert fatigue, và chuyển sang SLO-based alerting như thế nào?',
    a: `**Tóm tắt:** On-call bền vững = người trực được nghỉ ngơi thực sự, chỉ bị đánh thức khi có vấn đề **thật sự ảnh hưởng người dùng**, và có đủ context/công cụ để xử lý. Ba trụ cột: (1) **Rota hợp lý** — xoay ca công bằng, có thời gian hồi phục, không để 1 người gánh quá nhiều; (2) **Giảm alert fatigue** — phân loại alert (page vs ticket vs log), xóa/điều chỉnh alert noise, đặt ngưỡng dựa trên triệu chứng (symptom) không phải nguyên nhân (cause); (3) **SLO-based alerting** — alert khi "ngân sách lỗi" (error budget) đang bị đốt nhanh, thay vì alert từng lỗi nhỏ lẻ. Mục tiêu: on-call nhận < 2 page/shift có thể hành động, và mọi page đều cần phản hồi thật.

### Thuật ngữ nền

- **On-call (trực ca)**: người được phân công sẵn sàng phản hồi sự cố ngoài giờ làm việc. Khi hệ thống cảnh báo nghiêm trọng (page), điện thoại/pager của họ reo.
- **Rota (lịch xoay ca)**: lịch phân công ai trực khi nào. Ví dụ: tuần này bạn A trực, tuần sau bạn B.
- **Alert fatigue (mệt mỏi vì cảnh báo)**: khi nhận quá nhiều alert (đặc biệt alert không cần hành động), người trực bắt đầu bỏ qua, phản hồi chậm, hoặc tắt thông báo — dẫn đến bỏ sót incident thật.
- **Page (gọi khẩn)**: alert nghiêm trọng, đánh thức người trực ngay lập tức (điện thoại reo, SMS). Chỉ dùng cho vấn đề cần hành động **ngay bây giờ**.
- **Ticket (tạo phiếu)**: alert quan trọng nhưng không khẩn — tạo ticket xử lý trong giờ làm việc.
- **SLO (Service Level Objective)**: mục tiêu mức độ dịch vụ, ví dụ "99.9% request thành công trong 30 ngày" hoặc "p99 latency < 500ms". Đo bằng SLI (Service Level Indicator — số đo thực tế).
- **Error budget (ngân sách lỗi)**: lượng lỗi "được phép" trong kỳ SLO. SLO 99.9% trong 30 ngày = cho phép 0.1% = ~43 phút downtime. Nếu đã dùng hết ngân sách, dừng release feature, tập trung reliability.
- **Burn rate (tốc độ đốt)**: tốc độ error budget đang bị tiêu hao. Burn rate = 1 nghĩa là vừa đủ dùng hết budget cuối kỳ. Burn rate = 10 nghĩa là sẽ hết budget trong 1/10 thời gian (3 ngày nếu kỳ 30 ngày).

### Ví dụ đời thường

On-call giống bảo vệ trực đêm tòa nhà. **Alert fatigue** = hệ thống báo động reo 30 lần/đêm, 28 lần là mèo chạy qua cảm biến — đến lần thứ 29, bảo vệ tắt chuông. Lần thứ 30 là trộm thật. **SLO-based alerting** = thay vì báo mỗi lần cảm biến rung, chỉ báo khi "số lần rung bất thường trong 1 giờ vượt mức cho phép của tháng này" — tức là có vấn đề hệ thống, không phải mèo. **Rota bền vững** = bảo vệ trực 1 tuần rồi nghỉ 3 tuần, có người backup, và được bù ngày nghỉ sau ca trực đêm nhiều sự cố.

### Trụ cột 1: Rota bền vững

**Cấu trúc đề xuất (team 4–5 người)**:
- **Primary + Secondary**: mỗi ca có 1 người trực chính, 1 người backup. Secondary chỉ bị gọi nếu primary không phản hồi trong 15 phút.
- **Chu kỳ**: xoay tuần (1 tuần trực, 3–4 tuần nghỉ). Tránh xoay ngày (context switch nhiều) hoặc xoay 2 tuần (kiệt sức).
- **Follow-the-sun** (nếu có team đa múi giờ): mỗi team chỉ trực giờ làm việc của họ. Tránh trực đêm — ảnh hưởng sức khỏe nghiêm trọng.
- **Không follow-the-sun** (1 múi giờ): giới hạn giờ trực đêm. Ví dụ: 18:00–08:00 chỉ page cho severity 1 (ảnh hưởng > 50% user). Severity 2 chờ sáng.
- **Compensation**: ca trực đêm/ngoài giờ được bù (tiền hoặc ngày nghỉ). Ca có nhiều incident → thêm ngày nghỉ hồi phục.

**Quy tắc**:
- Không ai trực > 1 tuần liên tiếp.
- Sau ca có > 3 page đêm → ngày hôm sau được nghỉ hoặc làm nhẹ.
- On-call không bị giao feature work deadline trong tuần trực (chỉ xử lý incident + cải thiện reliability).
- Mỗi tháng review rota: có công bằng không? Ai bị page nhiều nhất? Tại sao?

### Trụ cột 2: Giảm alert fatigue

**Bước 1: Kiểm toán alert hiện tại (alert audit)**

Với 200 alert/tuần, 70% noise = 140 alert vô nghĩa. Phân loại mỗi alert:

| Hành động | Tiêu chí | Ví dụ |
|---|---|---|
| **Giữ + page** | Ảnh hưởng user ngay, cần hành động ngay | Error rate > 5% trong 5 phút, service down |
| **Chuyển thành ticket** | Cần xử lý nhưng không khẩn | Disk 80% (còn 2 ngày), certificate hết hạn trong 14 ngày |
| **Chuyển thành dashboard/log** | Thông tin tham khảo, không cần hành động | CPU spike ngắn, 1 pod restart (tự hồi phục) |
| **Xóa** | Không ai hành động, không ai nhớ tại sao có | Alert "test-alert-do-not-remove" từ 2 năm trước |

**Bước 2: Nguyên tắc thiết kế alert tốt**

- **Alert trên triệu chứng (symptom), không phải nguyên nhân (cause)**: alert "user thấy lỗi 500" (symptom), không alert "CPU 90%" (cause — CPU cao chưa chắc user bị ảnh hưởng). CPU cao → xem dashboard; user bị lỗi → page.
- **Mỗi alert phải có runbook**: link đến tài liệu "khi nhận alert này, làm gì đầu tiên". Alert không có runbook = alert không ai biết xử lý.
- **Mỗi alert phải actionable**: nếu nhận alert mà không làm gì được (chờ hết, tự hồi phục) → đó không phải page, đó là noise.
- **Deduplicate và group**: 1 service down gây 15 alert (health check fail, latency tăng, error rate tăng, downstream timeout...) → group thành 1 page với context.

### Trụ cột 3: SLO-based alerting

Thay vì alert từng metric riêng lẻ, alert khi **error budget bị đốt nhanh**.

**Thiết lập SLO (ví dụ)**:

~~~text
Service: payment-api
SLI: tỷ lệ request thành công (non-5xx) / tổng request
SLO: 99.9% trong 30 ngày (rolling window)
Error budget: 0.1% = ~43.2 phút downtime tương đương/tháng

Burn rate alert (multi-window, multi-burn-rate):
┌──────────────────────────────────────────────────────────────────┐
│ Window dài  + Window ngắn (xác nhận) │ Burn rate │ Đốt budget  │ Hành động │
│───────────────────────────────────────────────────────────────────│
│ 1h  + 5m  đều vượt ngưỡng           │ 14.4x     │ 2% trong 1h │ PAGE      │
│ 6h  + 30m đều vượt ngưỡng           │ 6x        │ 5% trong 6h │ PAGE      │
│ 3 ngày vượt ngưỡng                   │ 1x        │ 10%/3 ngày  │ TICKET    │
└──────────────────────────────────────────────────────────────────┘
~~~

**Prometheus alerting rule (ví dụ, burn rate 14.4x)**:

~~~yaml
# Alert khi đốt 2% error budget trong 1 giờ (burn rate 14.4x)
# = nếu giữ tốc độ này, hết budget 30 ngày trong ~50 giờ
groups:
  - name: slo-payment-api
    rules:
      - alert: PaymentAPIHighBurnRate
        expr: |
          (
            sum(rate(http_server_requests_seconds_count{service="payment-api",status=~"5.."}[1h]))
            / sum(rate(http_server_requests_seconds_count{service="payment-api"}[1h]))
          ) > (14.4 * 0.001)
          and
          (
            sum(rate(http_server_requests_seconds_count{service="payment-api",status=~"5.."}[5m]))
            / sum(rate(http_server_requests_seconds_count{service="payment-api"}[5m]))
          ) > (14.4 * 0.001)
        for: 2m
        labels:
          severity: page
          service: payment-api
        annotations:
          summary: "payment-api đang đốt error budget rất nhanh (14.4x)"
          runbook: "https://wiki.internal/runbooks/payment-api-errors"
          dashboard: "https://grafana.internal/d/slo-payment"
~~~

**Tại sao multi-window**: cửa sổ dài (1h) xác nhận vấn đề kéo dài (không phải spike 30s). Cửa sổ ngắn (5m) xác nhận vấn đề vẫn đang xảy ra (không page cho incident đã tự hồi phục 55 phút trước).

**Lợi ích SLO-based alerting**:
- Giảm noise: lỗi nhỏ lẻ không đốt budget nhanh → không page. Chỉ page khi thực sự đáng lo.
- Gắn với trải nghiệm user: SLO phản ánh điều user cảm nhận, không phải metric hạ tầng.
- Quyết định rõ ràng: budget còn nhiều → ship feature. Budget gần hết → tập trung reliability. Không tranh luận cảm tính.

### Lộ trình triển khai (6–8 tuần)

1. **Tuần 1–2**: Alert audit — phân loại 200 alert. Xóa/chuyển 70% noise. Mỗi alert còn lại phải có runbook.
2. **Tuần 2–3**: Định nghĩa SLI/SLO cho 3 service quan trọng nhất (hỏi: "user mong đợi gì?"). Bắt đầu đo error budget.
3. **Tuần 3–5**: Triển khai SLO-based alerting (burn rate) song song với alert cũ. So sánh: alert nào fire, cái nào chính xác hơn?
4. **Tuần 5–6**: Tắt alert cũ đã được SLO alert thay thế. Review rota: thêm secondary, compensation, giới hạn page đêm.
5. **Tuần 6–8**: Mở rộng SLO cho service còn lại. Thiết lập review hàng tháng: error budget report, on-call health (số page, satisfaction).

### Bẫy thực tế

- **SLO quá tham vọng (99.99%)**: error budget quá nhỏ (4.3 phút/tháng) → mọi biến động nhỏ đều đốt budget → team lại bị page liên tục. Bắt đầu với SLO thực tế (đo baseline 3 tháng, đặt SLO hơi cao hơn hiện trạng) rồi cải thiện dần.
- **SLO quá lỏng (99%)**: budget 7.2 giờ/tháng → user phàn nàn nhưng alert không fire. SLO phải phản ánh kỳ vọng user, không phải "dễ đạt".
- **Alert SLO nhưng không có hành động**: burn rate cao → page → người trực nhìn dashboard, không biết làm gì vì không có runbook. Mỗi SLO alert phải có runbook và quyền/escalation path.
- **Bỏ qua on-call wellbeing**: giảm alert xong nhưng vẫn xoay ca 1 tuần/người, không compensation, không hồi phục sau ca nặng → người vẫn nghỉ. Rota và compensation quan trọng không kém kỹ thuật.
- **Chỉ đo infrastructure SLI**: CPU, memory, pod count — không phản ánh trải nghiệm user. SLI phải đo từ góc nhìn user (request success, latency ở entry point).

> Senior tip: On-call bền vững là vấn đề **văn hóa + kỹ thuật**, không chỉ kỹ thuật. Bắt đầu bằng alert audit (xóa noise — hiệu quả ngay tuần đầu, team cảm nhận được). Song song xây SLO cho 2–3 service quan trọng. Chỉ số sức khỏe on-call quan trọng nhất: **số page ban đêm có thể hành động/tuần** — mục tiêu < 2. Nếu > 2 liên tục 2 tuần, đó là incident của chính quy trình on-call, cần ưu tiên xử lý như production incident. Track "on-call toil" (thời gian xử lý việc lặp lại, không tạo giá trị lâu dài) — nếu > 50% thời gian on-call là toil, team cần đầu tư automation, không phải thêm người trực.`,
    follow: [
      'Bạn đặt SLO 99.9% cho payment-api (30 ngày). Tháng này đã dùng 60% error budget trong 10 ngày đầu do 1 incident lớn. 20 ngày còn lại bạn vận hành thế nào — freeze deploy, chấp nhận rủi ro, hay điều chỉnh SLO?',
      'Service có 3 dependency (DB, Redis, external API). SLO của service là 99.9% nhưng external API chỉ cam kết 99.5%. Bạn thiết lập SLO và error budget như thế nào? Ai "chịu" phần budget dependency gây ra?',
      'Làm sao bạn thuyết phục engineering manager đầu tư 4 tuần cho alert audit + SLO setup khi team đang có deadline feature? Bạn dùng số liệu gì?'
    ],
    tags: ['on-call', 'alert fatigue', 'SLO-based alerting', 'error budget', 'burn rate', 'rota']
  },
  {
    id: 'devops-057',
    topic: 'devops',
    level: 'mid',
    q: 'Service Java trên server Linux bỗng ăn 100% CPU một core lúc cao điểm. Bạn dùng top -H để tìm thread nóng, chuyển thread id sang hex để đối chiếu với jstack như thế nào, và đọc stack trace ra nguyên nhân ra sao?',
    a: `**Tóm tắt:** CPU 100% ở Java thường là một thread đang chạy vòng lặp tính toán (code, regex, serialize) hoặc GC liên tục. Quy trình: dùng {{top -H -p <PID>}} để thấy thread nào (TID) đang ăn CPU, đổi TID từ thập phân sang hex, tìm dòng {{nid=0x...}} tương ứng trong thread dump ({{jstack}} hoặc {{jcmd PID Thread.print}}) để biết thread đó đang đứng ở dòng code nào. Bắt buộc lấy bằng chứng (thread dump, {{jstat}}) trước khi restart, vì restart xoá sạch dấu vết.

### Hiểu nhanh
Hãy tưởng tượng một nhà máy (JVM process) có nhiều công nhân (thread). Một công nhân làm việc điên cuồng không nghỉ khiến máy đếm điện (CPU meter) nhảy 100%. Bạn không thể nhìn bằng mắt thường trong nhà máy đang chạy; bạn dùng camera giám sát theo từng công nhân ({{top -H}}) để biết ai đang làm, rồi tra bảng chấm công (thread dump) để biết người đó đang thực hiện công đoạn nào. Chuyển TID sang hex giống như đổi mã nhân viên từ hệ thập phân sang mã in trên bảng chấm công.

### Thuật ngữ (giải thích từ gốc)
- **PID (Process ID)**: số định danh một tiến trình (process) trên Linux. Mỗi lần chạy {{java -jar app.jar}} là một process mới có PID riêng.
- **TID (Thread ID)**: số định danh một luồng (thread) bên trong process. JVM tạo nhiều thread (main, GC, worker, HTTP handler). Trên Linux, thread cũng là "lightweight process" nên có TID riêng.
- **Thread dump**: ảnh chụp trạng thái tất cả thread của JVM tại một thời điểm: tên thread, trạng thái (RUNNABLE, BLOCKED, WAITING), và stack trace (chuỗi hàm đang gọi). Lấy bằng {{jstack <PID>}} hoặc {{jcmd <PID> Thread.print}}.
- **nid**: "native id" trong thread dump, là TID của thread hệ điều hành viết dưới dạng hex (cơ số 16). Đây là cầu nối giữa Linux và JVM.
- **Hex (thập lục phân)**: hệ đếm cơ số 16 dùng 0-9 và a-f. Ví dụ 12399 (thập phân) = 0x306f (hex).

### Quy trình từng bước (có ví dụ số liệu)
~~~bash
# Bước 1: Xác nhận process Java nào ăn CPU
top -c
# Giả sử thấy: PID 12345, COMMAND java, %CPU 198 (gần 200% = ăn 2 core)

# Bước 2: Xem thread nào trong process đó ăn CPU
top -H -p 12345
# -H: hiện thread (mặc định top chỉ hiện process)
# -p: chỉ xem PID 12345
# Nhấn P để sắp xếp theo %CPU. Ví dụ thấy:
#   PID   USER  %CPU  COMMAND
#   12399 app   99.3  java      <-- thread nóng (TID=12399)
#   12401 app   98.7  java      <-- thread nóng thứ 2

# Bước 3: Chuyển TID thập phân sang hex
printf '%x\\n' 12399
# Kết quả: 306f
printf '%x\\n' 12401
# Kết quả: 3071

# Bước 4: Lấy thread dump và tìm nid tương ứng
jstack 12345 > /tmp/dump1.txt
# Hoặc: jcmd 12345 Thread.print > /tmp/dump1.txt
grep -n 'nid=0x306f' /tmp/dump1.txt
# Tìm thấy dòng kiểu:
# "http-nio-8080-exec-7" #42 daemon prio=5 os_prio=0 tid=0x... nid=0x306f runnable
# Sau đó đọc 15-30 dòng tiếp theo để thấy stack trace
grep -A 25 'nid=0x306f' /tmp/dump1.txt
~~~

### Đọc stack trace: ví dụ minh hoạ
~~~text
"http-nio-8080-exec-7" #42 daemon prio=5 nid=0x306f runnable
   java.lang.Thread.State: RUNNABLE
        at java.util.regex.Pattern$GroupHead.match(Pattern.java:...)
        at java.util.regex.Pattern$Branch.match(Pattern.java:...)
        at com.myapp.util.Validator.isValidEmail(Validator.java:87)
        at com.myapp.service.UserService.register(UserService.java:42)
~~~
Stack đọc từ trên xuống: frame trên cùng là nơi thread đang chạy. Ở đây thread bị kẹt trong regex engine ({{Pattern.match}}) — dấu hiệu của "catastrophic backtracking" (regex chạy lặp lại mũ khi gặp input xấu). Dòng code nghiệp vụ là {{Validator.java:87}}.

### Phân biệt nguyên nhân theo stack
| Thấy trong stack | Nghi ngờ | Hướng xử lý |
|---|---|---|
| Vòng lặp trong code nghiệp vụ ({{while}}, {{for}}) | Logic sai, điều kiện thoát không đạt | Đọc code, kiểm tra input |
| {{java.util.regex.Pattern}} | Regex backtracking với input dài/xấu | Đơn giản hoá regex, giới hạn độ dài input, dùng possessive quantifier |
| {{G1 Young Generation}}, {{GC Thread}}, {{VMThread}} | GC đang chạy liên tục do heap gần đầy | {{jstat -gcutil <PID> 1000}}, xem heap/GC log |
| {{ObjectMapper.writeValue}}, {{Gson.toJson}} trên object lớn | Serialize object đồ thị phức tạp | Giới hạn response, dùng DTO, streaming |
| {{MessageDigest}}, {{BCrypt}}, {{Cipher}} | Mã hoá/hash nặng (có thể bình thường nếu tải cao) | Kiểm tra throughput, cân nhắc offload |

### Lưu ý về phiên bản JDK
- **JDK 8-17**: {{nid}} trong thread dump thường in hex ({{nid=0x306f}}). Bạn phải đổi TID sang hex.
- **JDK 21+ (HotSpot)**: một số bản in {{nid}} dạng thập phân trong thread dump; khi đó có thể khớp trực tiếp với TID từ {{top -H}}. Cách chắc nhất: chạy {{jstack <PID> \| head -30}} xem định dạng {{nid}} rồi quyết định có cần chuyển hex hay không.
- Luôn lấy **3 thread dump cách nhau 5-10 giây**: nếu cùng một thread ở cùng stack qua 3 dump, đó là thread "kẹt"; nếu stack thay đổi liên tục, thread đang chạy nặng nhưng vẫn tiến triển.

### Lỗi hay gặp (pitfall thực tế)
1. **Restart ngay khi thấy CPU cao**: mất toàn bộ bằng chứng. Trên production, sự cố tương tự có thể lặp lại; không có dump thì lần sau vẫn mò. Cách tránh: luôn thu {{jstack}} (3 lần), {{jstat -gcutil}}, và lưu trước khi restart.
2. **Chỉ nhìn %CPU của process, không nhìn thread**: process 200% nhưng chia đều cho 20 thread (mỗi thread 10%) là tải bình thường; một thread 100% là bất thường. Cách tránh: luôn dùng {{top -H -p <PID>}}.
3. **Đổi nhầm chiều hex/thập phân**: {{printf '%x'}} chuyển thập phân → hex; {{printf '%d' 0x306f}} chuyển ngược. Nhiều người tra nhầm nên không tìm thấy {{nid}}.
4. **Bỏ qua thread GC**: nếu thread nóng là {{GC task thread}} hoặc {{G1 Conc#0}}, nguyên nhân gốc là bộ nhớ (heap gần đầy, allocation rate cao), không phải code nghiệp vụ. Tối ưu code lúc này vô ích; cần xem {{-Xmx}}, {{jstat}}, heap dump.

### Trả lời phỏng vấn
Khi service Java ăn 100% CPU, em dùng {{top -H -p <PID>}} để tìm thread cụ thể đang tiêu thụ CPU (TID). Sau đó chuyển TID sang hex bằng {{printf '%x'}} vì thread dump của HotSpot ghi native id ở dạng {{nid=0x...}}. Em lấy ít nhất 3 thread dump cách nhau 5 giây bằng {{jstack}} hoặc {{jcmd}}, rồi grep {{nid}} để thấy stack trace. Từ stack, em phân biệt: nếu là code nghiệp vụ hoặc regex thì sửa logic; nếu là thread GC thì vấn đề nằm ở bộ nhớ, em chuyển sang phân tích {{jstat -gcutil}} và GC log. Em luôn thu bằng chứng trước khi restart vì restart làm mất trạng thái.

> Senior tip: Trên Kubernetes, bạn thường không có {{jstack}} cài sẵn trong image distroless. Hãy dùng {{jcmd}} (đi kèm JRE), hoặc {{kubectl debug}} với ephemeral container có JDK, hoặc expose endpoint thread dump qua Spring Boot Actuator ({{/actuator/threaddump}}) có bảo vệ auth. Chuẩn bị sẵn cách lấy dump trước khi sự cố xảy ra.`,
    follow: [
      'Nếu thread dump cho thấy thread nóng là GC thread, bạn chuyển sang điều tra gì tiếp theo?',
      'Tại sao cần lấy 3 thread dump cách nhau vài giây thay vì chỉ 1 dump?',
      'Làm sao phát hiện "catastrophic backtracking" của regex trên production mà không cần đọc code?'
    ],
    tags: ['Linux', 'CPU', 'top -H', 'jstack', 'thread dump', 'nid', 'troubleshooting']
  },
  {
    id: 'devops-058',
    topic: 'devops',
    level: 'mid',
    q: 'Lệnh uptime báo load average là 12.00, 8.50, 4.20 trên máy 4 core. Điều đó có nghĩa là gì? Load average khác gì với %CPU, và khi nào load cao nhưng CPU lại thấp?',
    a: `**Tóm tắt:** Load average là số lượng trung bình các process đang **chạy** (RUNNABLE) hoặc **chờ tài nguyên không bị ngắt** (thường là chờ I/O đĩa, trạng thái D trên Linux) trong 1, 5, 15 phút. Trên Linux, load average **bao gồm cả process chờ I/O**, nên load cao không đồng nghĩa CPU bận. Quy tắc thô: load trung bình bền vững > số core nghĩa là có hàng đợi. Ba con số cho biết xu hướng: đang tăng (12 > 8.5 > 4.2) hay giảm. Luôn kết hợp {{vmstat}}, {{top}} (%wa, %us), {{iostat}} để biết hàng đợi là do CPU hay do I/O.

### Hiểu nhanh
Hãy nghĩ load average như số người đang xếp hàng tại quầy thu ngân (core CPU). "Đang chạy" là người đang được tính tiền; "đang chờ I/O" (trạng thái D) là người đứng trước quầy nhưng thu ngân đang chờ máy quẹt thẻ phản hồi — họ chiếm chỗ trong hàng dù thu ngân không bận tính toán. Trên Linux, cả hai loại đều được đếm vào hàng. Vì vậy hàng dài (load cao) có thể do quá nhiều khách (CPU-bound) hoặc do máy quẹt thẻ chậm (I/O-bound).

### Thuật ngữ
- **RUNNABLE (R)**: process đang chạy trên CPU hoặc đang chờ trong hàng đợi CPU để được chạy.
- **Uninterruptible sleep (D)**: process đang chờ một thao tác I/O (thường là đĩa, đôi khi NFS) hoàn tất và **không thể bị ngắt** bởi signal (kể cả {{kill -9}} không giết được ngay). Trên Linux, D-state được tính vào load average.
- **I/O wait (%wa)**: phần trăm thời gian CPU ở trạng thái nhàn rỗi nhưng đang chờ I/O hoàn thành. CPU "rảnh" nhưng công việc bị kẹt ở đĩa/mạng.
- **Core**: đơn vị thực thi của CPU. Máy 4 core có thể chạy đồng thời 4 thread CPU-bound mà không xếp hàng.

### Đọc ba con số load average
~~~bash
uptime
#  02:15:03 up 10 days,  3:42,  2 users,  load average: 12.00, 8.50, 4.20
#                                                         1m     5m    15m
~~~
- **1 phút = 12.00**: trung bình 12 process trong hàng đợi/chạy trong 1 phút gần nhất.
- **5 phút = 8.50, 15 phút = 4.20**: xu hướng **đang tăng** (12 > 8.5 > 4.2) → vấn đề đang diễn ra, cần chú ý ngay.
- Nếu xu hướng ngược (4, 8, 12): vấn đề đang dịu đi.
- So với số core: {{nproc}} trả về 4 → load 12 trên 4 core nghĩa là trung bình ~3 process đang chờ cho mỗi core. Đây là dấu hiệu quá tải rõ nếu kéo dài.

**Ngưỡng tham khảo (thô, tuỳ workload):**
| Load / Core | Diễn giải |
|---|---|
| < 0.7 | Thoải mái |
| 0.7 – 1.0 | Cần theo dõi |
| > 1.0 kéo dài | Có hàng đợi, latency tăng |
| > số core * 2 | Quá tải nghiêm trọng (với workload CPU-bound) |

### Load cao nhưng CPU thấp: khi nào xảy ra?
~~~bash
# Kiểm tra nhanh
top
# Quan sát dòng %Cpu(s): us thấp (ví dụ 5%), nhưng wa cao (ví dụ 70%)
vmstat 1 5
# Cột r: số process chờ CPU (RUNNABLE)
# Cột b: số process blocked chờ I/O (D-state)  <-- load cao do đây
# Cột wa: % CPU chờ I/O
~~~
| Tình huống | Load | %us (CPU user) | %wa (I/O wait) | Cột b (vmstat) | Nguyên nhân điển hình |
|---|---|---|---|---|---|
| CPU-bound | Cao | Cao | Thấp | 0 | Vòng lặp, tính toán, GC |
| I/O-bound | Cao | Thấp | Cao | Cao | Đĩa chậm, query DB chậm ghi đĩa, NFS treo, log ghi ồ ạt |
| Lock contention (ít gặp) | Có thể cao | Thấp | Thấp | Thấp | Nhiều thread RUNNABLE nhưng tranh lock (ít làm tăng load như I/O) |

### Ví dụ điều tra I/O-bound
~~~bash
iostat -x 1 3
# Xem %util (gần 100% = đĩa bão hoà), await (ms chờ trung bình), r/s w/s
# %util cao + await cao + load cao + %wa cao = đĩa là nút thắt

# Tìm process nào đang gây I/O nhiều
pidstat -d 1 5
# Cột kB_rd/s, kB_wr/s theo PID

# Với Java: kiểm tra GC log, ghi heap dump, ghi log quá nhiều?
lsof -p <PID> | wc -l   # nhiều file mở?
~~~

### Pitfall hay gặp
1. **Thấy load > core liền đòi thêm CPU**: nếu nguyên nhân là I/O (đĩa EBS chậm, NFS lag, DB trên cùng máy), thêm CPU không giúp; cần nâng IOPS, chuyển storage, hoặc giảm I/O. Cách tránh: luôn nhìn {{%wa}} và {{iostat}} trước.
2. **So sánh load giữa máy khác số core**: load 8 trên 4 core (gấp đôi) tệ hơn load 8 trên 32 core (nhàn). Cách tránh: luôn chia load cho {{nproc}}.
3. **Nhầm load average của Linux với các hệ Unix khác**: một số hệ Unix (BSD truyền thống) không tính I/O wait vào load. Tài liệu đọc trên mạng có thể gây nhầm; trên Linux, D-state được tính.
4. **Bỏ qua xu hướng 1/5/15 phút**: một spike 1 phút có thể là deploy hoặc batch job ngắn; load 15 phút cao mới cho thấy vấn đề bền vững.

### Trả lời phỏng vấn
Load average trên Linux là số process trung bình đang chạy hoặc chờ I/O không ngắt được (D-state) trong 1, 5, 15 phút. Điểm quan trọng là Linux tính cả I/O wait vào load, nên load cao không có nghĩa CPU bận. Ví dụ load 12 trên máy 4 core: nếu {{vmstat}} cho thấy cột {{b}} cao và {{%wa}} cao trong {{top}}, vấn đề là I/O (đĩa, storage mạng), em sẽ dùng {{iostat -x}} và {{pidstat -d}} để tìm nguồn; nếu {{%us}} cao và cột {{r}} cao, mới là CPU-bound. Em luôn đọc ba con số theo xu hướng và chia cho số core để đánh giá mức độ.

> Senior tip: Trên cloud (AWS EC2 với EBS gp2/gp3), "load cao, CPU thấp" rất hay gặp khi burst credit của EBS cạn hoặc IOPS cấu hình thấp hơn nhu cầu. Hãy kiểm tra {{iostat -x}} (await, %util) và CloudWatch metric {{VolumeQueueLength}}, {{BurstBalance}} cùng lúc. Với Java, GC log ghi đồng bộ hoặc log framework flush liên tục cũng có thể tạo I/O wait bất ngờ.`,
    follow: [
      'Làm sao phân biệt load cao do I/O đĩa với load cao do NFS mount bị treo?',
      'Process ở trạng thái D (uninterruptible sleep) có kill được bằng kill -9 không? Tại sao?',
      'Trên container Kubernetes, load average bạn thấy trong container phản ánh điều gì?'
    ],
    tags: ['Linux', 'load average', 'CPU', 'I/O wait', 'vmstat', 'iostat', 'troubleshooting']
  },
  {
    id: 'devops-059',
    topic: 'devops',
    level: 'senior',
    q: 'Server Linux báo "No space left on device" khi ghi log. {{df -h}} thấy phân vùng / đầy 100%, nhưng {{du -sh /}} cộng lại chỉ khoảng 60%. Bạn giải thích hiện tượng này thế nào, dùng {{lsof +L1}} để tìm file đã xoá nhưng vẫn bị giữ ra sao, và xử lý an toàn thế nào?',
    a: `**Tóm tắt:** {{df}} đo dung lượng ở mức filesystem (block đã cấp phát), còn {{du}} đi bộ qua cây thư mục và cộng kích thước file đang có tên. Khi một process vẫn giữ file descriptor mở vào file đã bị {{rm}} (xoá tên khỏi thư mục) nhưng chưa {{close()}}, filesystem chưa giải phóng block vì "link count" thực tế vẫn > 0 ở mức kernel — nên {{df}} vẫn thấy đầy, {{du}} không thấy file đó. Công cụ {{lsof +L1}} liệt kê file có link count < 1 nhưng vẫn mở. Xử lý an toàn: truncate file qua {{/proc/<PID>/fd/<FD>}} hoặc yêu cầu app xoay log/restart có kiểm soát; không {{kill -9}} bừa bãi. Ngoài ra, "No space left" cũng có thể do **hết inode** ({{df -i}}).

### Hiểu nhanh
Hãy tưởng tượng file như một cuốn sổ trong thư viện. {{rm}} chỉ gỡ nhãn tên cuốn sổ khỏi kệ (xoá entry trong thư mục). Nhưng nếu có người (process) đang cầm cuốn sổ mở đọc, thủ thư (filesystem/kernel) chưa thể vứt cuốn sổ đi vì người đó vẫn cần nó — trang giấy (block đĩa) vẫn bị chiếm. {{du}} chỉ đếm sách trên kệ; {{df}} đếm tổng giấy đã dùng trong kho. {{lsof +L1}} giúp tìm ai đang cầm cuốn sổ "vô danh" (không còn nhãn trên kệ).

### Thuật ngữ
- **Block**: đơn vị cấp phát dung lượng trên filesystem (thường 4KB). {{df}} đếm block đã cấp phát.
- **Inode**: cấu trúc metadata của file (quyền, owner, timestamp, con trỏ tới block dữ liệu). Mỗi file cần 1 inode. Hết inode → không tạo được file mới dù còn dung lượng.
- **File descriptor (fd)**: số nguyên process dùng để tham chiếu file đang mở. Kernel giữ bảng fd cho mỗi process.
- **Hard link / link count**: số tên (directory entry) trỏ tới cùng inode. {{rm}} giảm link count; block chỉ được giải phóng khi link count = 0 **và** không còn fd nào mở.
- **Truncate**: cắt nội dung file về kích thước nhỏ hơn (thường 0) mà không xoá file/đóng fd.

### Điều tra bước 1: xác nhận thiếu dung lượng hay thiếu inode
~~~bash
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/nvme0n1p1   50G   50G     0 100% /

df -i
# Filesystem      Inodes  IUsed   IFree IUse% Mounted on
# /dev/nvme0n1p1 3276800 3276800      0  100% /   <-- hết inode (triệu file nhỏ)
~~~
Nếu {{IUse%}} 100% nhưng dung lượng còn: nguyên nhân là quá nhiều file nhỏ (session file, cache, thư mục {{/tmp}}). Cần tìm thư mục có nhiều file: {{for d in /*; do echo "$d $(find "$d" -xdev | wc -l)"; done 2>/dev/null | sort -k2 -rn | head}}.

### Điều tra bước 2: df vs du lệch — file đã xoá còn giữ mở
~~~bash
# du thường cần chạy ở thư mục mount point, bỏ qua filesystem khác
du -shx / 2>/dev/null
# 30G  /

# Tìm file đã "unlinked" (link count 0) nhưng vẫn mở
lsof +L1
# hoặc giới hạn theo filesystem: lsof +L1 /dev/nvme0n1p1
# Ví dụ output:
# COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NLINK  NODE NAME
# java    12345 app    3w   REG  259,1 21474836480    0 123456 /var/log/app/app.log (deleted)
#                                     ^^^^^^^^^^^        ^ NLINK=0: đã xoá
#                                     ~20GB vẫn bị giữ
~~~
- Cột **NLINK** = 0 (hoặc hiển thị {{(deleted)}}): file không còn tên trong thư mục.
- Cột **SIZE/OFF**: dung lượng thực tế vẫn chiếm block.
- Cột **FD** (ví dụ {{3w}}): file descriptor số 3, mở để ghi.

Bạn cũng có thể kiểm tra từ phía process:
~~~bash
ls -l /proc/12345/fd/3
# lrwx------ 1 app app 64 ... /proc/12345/fd/3 -> /var/log/app/app.log (deleted)
~~~

### Xử lý an toàn (không làm mất dữ liệu quan trọng tuỳ trường hợp)
| Cách | Lệnh | Khi nào dùng | Rủi ro |
|---|---|---|---|
| Truncate qua /proc fd | {{: > /proc/12345/fd/3}} hoặc {{truncate -s 0 /proc/12345/fd/3}} | Cần giải phóng ngay, chấp nhận mất nội dung log đang mở | Mất log chưa flush/ship; app vẫn ghi tiếp từ offset hiện tại — có thể tạo "lỗ hổng" null byte tuỳ cách app ghi |
| Gửi tín hiệu xoay log | {{kill -USR1 12345}} (nếu app hỗ trợ) hoặc dùng {{logrotate -f}} | App có cơ chế reopen log | Cần app hỗ trợ; kiểm tra config |
| Restart service có kiểm soát | {{systemctl restart app}} (theo quy trình) | Sau khi đã thu bằng chứng, chấp nhận downtime ngắn | Mất trạng thái in-memory; làm theo runbook |
| Copy ra chỗ khác rồi truncate | {{cp /proc/12345/fd/3 /tmp/app.log.rescued && : > /proc/12345/fd/3}} | Cần giữ log để điều tra | Tốn I/O tạm thời |

**Lưu ý:** {{rm /var/log/app/app.log}} khi file đang bị giữ **không giải phóng dung lượng** — đó chính là nguyên nhân. Sau khi truncate, {{df -h}} sẽ phản ánh dung lượng trống.

### Phòng ngừa
- Dùng **logrotate** (Linux) hoặc cấu hình rolling trong logging framework (Logback {{SizeAndTimeBasedRollingPolicy}}, Log4j2 {{RollingFileAppender}}) để xoay và nén/xoá log cũ.
- Tránh pattern "xoá file log rồi app tự tạo lại" mà không có cơ chế reopen fd — app vẫn ghi vào fd cũ (đã unlinked).
- Giám sát {{node_filesystem_avail_bytes}} (node_exporter/Prometheus) và {{node_filesystem_files_free}} (inode), cảnh báo ở 80%.
- Với container/Kubernetes: log nên ghi ra stdout để runtime thu thập; giới hạn kích thước log container (Docker {{max-size}}, containerd config).

### Lỗi hay gặp
1. **Chỉ chạy {{rm}} file lớn rồi tưởng đã xong**: nếu process còn mở, {{df}} không đổi. Cách tránh: sau {{rm}}, kiểm tra {{lsof +L1}}; ưu tiên truncate hoặc restart có kiểm soát.
2. **{{kill -9}} process Java ngay lập tức**: giải phóng fd nhưng mất cơ hội thu thread dump/heap dump, và có thể gây hỏng dữ liệu đang ghi. Cách tránh: thu bằng chứng, thử truncate/xoay log trước; restart theo quy trình.
3. **Bỏ qua inode**: {{df -h}} còn trống nhưng vẫn "No space left" — nhiều người bối rối. Cách tránh: luôn kiểm tra {{df -i}} cùng lúc.
4. **Chạy {{du}} trên mount khác**: {{du -sh /}} có thể đi vào {{/proc}}, {{/sys}}, mount mạng và cho kết quả sai/chậm. Cách tránh: dùng {{du -shx /}} ({{-x}}: không vượt filesystem boundary).

### Trả lời phỏng vấn
Khi {{df}} báo đầy nhưng {{du}} cộng lại nhỏ hơn, em nghi file đã bị xoá tên nhưng process vẫn giữ file descriptor mở. {{df}} tính block đã cấp phát ở mức filesystem; {{du}} chỉ tính file còn đường dẫn. Em dùng {{lsof +L1}} để tìm các entry có {{NLINK=0}} và cột {{SIZE/OFF}} lớn — thường là log file Java bị {{rm}} nhưng app chưa reopen. Cách xử lý an toàn là truncate qua {{/proc/<PID>/fd/<FD>}} hoặc trigger log rotation/restart có kiểm soát; em tránh {{kill -9}} khi chưa thu bằng chứng. Em cũng kiểm tra {{df -i}} vì hết inode gây cùng thông báo lỗi. Về lâu dài, em dùng log rotation, giám sát disk/inode, và trong container thì đẩy log ra stdout.

> Senior tip: "Log file 20GB bị xoá nhưng đĩa không trống" là sự cố kinh điển lúc 2 giờ sáng. Hãy thêm alert khi {{lsof +L1}} (hoặc metric tương đương) phát hiện file deleted lớn, và chuẩn hoá logging: trên K8s ghi stdout; trên VM dùng logrotate + signal reopen. Đừng bao giờ dùng {{rm}} trên file log đang được ghi như cách "dọn đĩa nhanh".`,
    follow: [
      'Tại sao truncate qua /proc/<PID>/fd có thể gây "lỗ" null byte trong file log nếu app ghi bằng append offset?',
      'Làm sao cấu hình Logback để tự xoay log theo dung lượng và thời gian, tránh phải xoá tay?',
      'Hết inode thường xảy ra trong tình huống nào, và cách phát hiện sớm?'
    ],
    tags: ['Linux', 'disk full', 'df', 'du', 'lsof', 'deleted file', 'inode', 'logrotate']
  },
  {
    id: 'devops-060',
    topic: 'devops',
    level: 'senior',
    q: 'Server chạy service Java có hàng nghìn kết nối TCP ở trạng thái TIME_WAIT và CLOSE_WAIT tăng dần. Bạn dùng {{ss}} để chẩn đoán thế nào, phân biệt nguyên nhân TIME_WAIT vs CLOSE_WAIT, và xử lý trong code Java ra sao?',
    a: `**Tóm tắt:** TIME_WAIT và CLOSE_WAIT là hai trạng thái TCP khác bản chất: **TIME_WAIT** xảy ra ở phía **chủ động đóng** kết nối sau khi trao đổi FIN hoàn tất, giữ ~60 giây (trên Linux) để tránh gói trễ gây nhầm lẫn — nhiều TIME_WAIT thường do app mở/đóng kết nối liên tục tới cùng đích (không reuse). **CLOSE_WAIT** xảy ra ở phía **bị động** khi đã nhận FIN từ peer nhưng **ứng dụng chưa gọi close()** — CLOSE_WAIT tăng dần gần như luôn là bug rò rỉ socket trong code. Dùng {{ss -tan}} để đếm theo trạng thái và theo đích; sửa gốc ở code: connection pool + đóng response đúng cách.

### Hiểu nhanh
Kết nối TCP giống một cuộc gọi điện thoại hai chiều. Khi kết thúc: bên cúp máy trước (chủ động đóng) phải đợi một lúc (TIME_WAIT) để chắc bên kia đã nghe thấy tiếng "tút" cuối và không có tín hiệu cũ lạc vào cuộc gọi mới. Bên cúp sau (bị động) nghe thấy bên kia cúp, nhưng nếu ứng dụng (người cầm máy) quên đặt ống nghe xuống, đường dây vẫn bị giữ ở trạng thái "chờ bạn đặt máy" — đó là CLOSE_WAIT. TIME_WAIT nhiều thường do bạn gọi quá nhiều cuộc gọi ngắn; CLOSE_WAIT nhiều do code quên đặt máy.

### Thuật ngữ
- **Socket**: điểm cuối của kết nối mạng, gắn với (IP, port, giao thức). Trong Java, {{Socket}}, kết nối HTTP bên dưới {{HttpClient}} đều dùng socket.
- **FIN**: gói TCP báo "tôi hết dữ liệu để gửi, muốn đóng chiều gửi". Đóng kết nối TCP cần trao đổi FIN/ACK hai chiều.
- **Ephemeral port (cổng tạm)**: cổng nguồn do OS cấp tự động khi client mở kết nối ra ngoài (dải {{ip_local_port_range}}, thường 32768-60999). Hết cổng tạm → không mở được kết nối mới tới đích đó.
- **Keep-alive (HTTP)**: tái sử dụng một kết nối TCP cho nhiều request HTTP, tránh bắt tay TCP/TLS lặp lại.

### Chẩn đoán bằng ss
~~~bash
# Tổng quan socket theo trạng thái
ss -s

# Đếm TIME_WAIT và CLOSE_WAIT
ss -tan state time-wait | wc -l
ss -tan state close-wait | wc -l

# Xem đích nào có nhiều TIME_WAIT (client mở/đóng liên tục tới đâu?)
ss -tan state time-wait | awk '{print $5}' | sort | uniq -c | sort -rn | head

# Xem CLOSE_WAIT gắn với process nào
ss -tanp state close-wait
# -p: hiện process (cần quyền root hoặc cùng user)
# Ví dụ: users:(("java",pid=12345,fd=187))

# Kiểm tra fd của process đó có phải socket không
lsof -nP -p 12345 | grep -c TCP
~~~

### TIME_WAIT: nguyên nhân và xử lý
**Triệu chứng điển hình:** hàng chục nghìn TIME_WAIT tới cùng {{IP:443}} của đối tác; kèm lỗi {{java.net.BindException: Cannot assign requested address}} (EADDRNOTAVAIL) khi burst.

**Nguyên nhân gốc trong code Java:**
~~~java
// SAI: tạo HttpClient mới mỗi request -> không reuse kết nối TCP/TLS
// Mỗi lần xong, kết nối đóng -> TIME_WAIT ở phía client (nếu client đóng trước)
public String call(String url) throws Exception {
    HttpClient c = HttpClient.newHttpClient();
    return c.send(HttpRequest.newBuilder(URI.create(url)).build(),
                  HttpResponse.BodyHandlers.ofString()).body();
}

// ĐÚNG: dùng chung một client (thread-safe), có pool/keep-alive
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();
~~~
Với Spring: khai báo **một bean** {{RestClient}}/{{WebClient}} có cấu hình {{ConnectionProvider}} (Reactor Netty) hoặc {{PoolingHttpClientConnectionManager}} (Apache). Đừng {{new RestTemplate()}} trong mỗi method.

**Xử lý tầng hệ thống (chỉ nới biên, không sửa gốc):** mở rộng {{net.ipv4.ip_local_port_range}}; bật {{net.ipv4.tcp_tw_reuse=1}} (Linux) cho kết nối đi ra — chỉ dùng khi hiểu rõ (cần TCP timestamps). Không tắt TIME_WAIT.

### CLOSE_WAIT: nguyên nhân và xử lý
**Triệu chứng:** {{ss}} cho thấy CLOSE_WAIT tăng dần theo thời gian, không giảm; sau vài giờ chạm giới hạn fd hoặc hành vi kỳ lạ.

**Nguyên nhân gốc:** peer đã gửi FIN (đóng phía nó), kernel của bạn đã ACK và chuyển socket sang CLOSE_WAIT, nhưng **ứng dụng Java không đọc hết/không đóng** response/stream → fd/socket bị giữ mãi.

~~~java
// SAI (Apache HttpClient 4.x/5.x kiểu cũ): không consume/close entity -> connection không trả về pool
CloseableHttpResponse resp = httpClient.execute(request);
String body = EntityUtils.toString(resp.getEntity()); // nếu ném exception trước khi close...
// resp.close() không được gọi -> socket có thể kẹt

// ĐÚNG: try-with-resources
try (CloseableHttpResponse resp = httpClient.execute(request)) {
    String body = EntityUtils.toString(resp.getEntity());
    return body;
}

// Với java.net.http.HttpResponse: body đã được BodyHandler đọc xong thường OK,
// nhưng nếu dùng InputStream BodyHandler thì phải close stream.
~~~
Với JDBC: luôn đóng {{ResultSet}}, {{Statement}}, {{Connection}} (try-with-resources) hoặc dùng pool (HikariCP) quản lý. Connection rò rỉ có thể biểu hiện khác, nhưng cùng họ "quên close resource".

### Bảng so sánh nhanh
| | TIME_WAIT | CLOSE_WAIT |
|---|---|---|
| Phía nào | Chủ động đóng kết nối | Bị động (nhận FIN từ peer) |
| Thời gian | ~60s (Linux, cố định) | Vô hạn cho tới khi app gọi close() |
| Tăng dần mãi? | Không (tự hết sau timeout), nhưng có thể luôn cao nếu tạo mới liên tục | Có — dấu hiệu bug rò rỉ |
| Nguyên nhân thường gặp | Mở/đóng kết nối liên tục, không pool/keep-alive | Không đóng response/socket/stream |
| Hướng sửa chính | Reuse connection, pool | Sửa code: try-with-resources, đóng entity |
| Rủi ro | Hết ephemeral port (EADDRNOTAVAIL) | Hết file descriptor (EMFILE) |

### Lỗi hay gặp
1. **Nhầm CLOSE_WAIT là lỗi mạng/peer**: CLOSE_WAIT nghĩa là peer đã đóng đúng phần của nó; lỗi nằm ở app bạn chưa đóng. Cách tránh: tìm {{ss -tanp state close-wait}} xem PID/fd, rồi soi code path dùng fd đó.
2. **Cố "xoá" TIME_WAIT bằng sysctl liều lĩnh**: {{tcp_tw_recycle}} đã bị xoá khỏi kernel mới và gây hỏng NAT; chỉnh bừa gây lỗi khó debug. Cách tránh: sửa code để reuse kết nối.
3. **Chỉ nhìn tổng số kết nối, không nhìn theo đích/trạng thái**: 5000 TIME_WAIT phân tán khác 5000 TIME_WAIT tới một đích (gây hết cổng tạm tới đích đó). Cách tránh: {{ss}} + {{awk/sort/uniq}} theo cột đích.

### Trả lời phỏng vấn
Em phân biệt TIME_WAIT và CLOSE_WAIT bằng {{ss -tan}}. TIME_WAIT nằm ở phía chủ động đóng, tồn tại ~60 giây để bảo vệ gói trễ; nhiều TIME_WAIT tới cùng một đích thường do code tạo kết nối mới cho mỗi request thay vì dùng connection pool và keep-alive — rủi ro là hết ephemeral port. CLOSE_WAIT nằm ở phía bị động sau khi nhận FIN, nhưng app chưa {{close()}}; CLOSE_WAIT tăng dần gần như chắc chắn là bug rò rỉ socket, ví dụ HTTP response entity không được consume/đóng trong Java. Em dùng {{ss -tanp state close-wait}} để gắn với PID/fd, rồi kiểm tra code dùng try-with-resources. Sửa gốc ở code; chỉnh sysctl chỉ là biện pháp tạm.

> Senior tip: Thêm metric {{process_files_open_files}} và dashboard socket theo trạng thái (node_exporter hoặc Micrometer + OS metrics). CLOSE_WAIT tăng tuyến tính theo giờ là "bom hẹn giờ" — phát hiện ở 30% giới hạn fd còn kịp sửa trong giờ hành chính. Với service gọi nhiều đối tác, bắt buộc chuẩn hoá HTTP client thành bean dùng chung có pool và timeout rõ ràng.`,
    follow: [
      'Vì sao TIME_WAIT tồn tại trong TCP và điều gì xảy ra nếu loại bỏ nó hoàn toàn?',
      'Trong Spring Boot dùng RestTemplate/WebClient, bạn cấu hình connection pool và timeout thế nào để tránh rò rỉ kết nối?',
      'Làm sao phân biệt CLOSE_WAIT do app bạn với CLOSE_WAIT do thư viện/driver (ví dụ JDBC driver, HTTP client)?'
    ],
    tags: ['Linux', 'TCP', 'TIME_WAIT', 'CLOSE_WAIT', 'ss', 'socket leak', 'troubleshooting']
  },
  {
    id: 'devops-061',
    topic: 'devops',
    level: 'senior',
    q: 'Service Java gọi {{api.partner.com}} đôi khi bị treo vài giây ở bước phân giải DNS, hoặc sau khi đối tác đổi IP (failover) app vẫn gọi vào IP cũ hàng chục phút. JVM cache DNS như thế nào, cấu hình {{networkaddress.cache.ttl}} ở đâu, và bạn chẩn đoán DNS chậm trên Linux/container ra sao?',
    a: `**Tóm tắt:** JVM (class {{InetAddress}}) có lớp cache DNS riêng bên trên resolver của hệ điều hành. Mặc định lịch sử: khi có Security Manager, kết quả thành công cache **vĩnh viễn** (tránh DNS spoofing); khi không có Security Manager (phổ biến từ Java 17+ vì Security Manager bị deprecate), kết quả thành công cache **30 giây**, lookup thất bại cache **10 giây**. Cấu hình qua {{networkaddress.cache.ttl}} và {{networkaddress.cache.negative.ttl}} trong file {{<java.home>/conf/security/java.security}} hoặc đặt lúc khởi động bằng {{java.security.Security.setProperty}}. DNS chậm thì chẩn đoán ở tầng OS/container ({{/etc/resolv.conf}}, {{nsswitch.conf}}, {{getent}}, {{dig}}, độ trễ tới resolver) trước, rồi mới nghi tầng JVM.

### Hiểu nhanh
DNS giống tra danh bạ để đổi tên ({{api.partner.com}}) thành số điện thoại (IP). JVM giữ một cuốn sổ tay nhỏ (cache) để đỡ phải tra danh bạ liên tục — tra nhanh hơn nhưng nếu số đổi (failover), sổ tay cũ gây gọi nhầm. Danh bạ thật nằm ở hệ điều hành ({{/etc/resolv.conf}} trỏ tới DNS server). Nếu tra danh bạ thật bị chậm, JVM cũng chậm dù sổ tay có hoạt động.

### Thuật ngữ
- **DNS (Domain Name System)**: hệ thống phân giải tên miền thành địa chỉ IP.
- **TTL (Time To Live)**: thời gian một bản ghi DNS được phép cache. Có TTL của bản ghi DNS (từ authoritative server) và TTL của cache trong JVM/OS — hai thứ khác nhau.
- **Resolver**: thành phần thực hiện truy vấn DNS (thường là thư viện glibc/musl + cấu hình {{/etc/resolv.conf}}).
- **{{InetAddress}}**: class Java chuẩn để biểu diễn địa chỉ IP và thực hiện phân giải tên ({{InetAddress.getByName}}, {{getAllByName}}).

### JVM cache DNS: cơ chế và mặc định
~~~text
Code Java gọi InetAddress.getByName("api.partner.com")
  -> Kiểm tra cache JVM (InetAddress cache)
     -> Cache hit & chưa hết TTL: trả IP ngay (không hỏi OS)
     -> Cache miss/hết TTL: gọi resolver của OS
        -> OS kiểm tra /etc/hosts, nscd (nếu có), rồi hỏi DNS server trong /etc/resolv.conf
        -> Trả kết quả, JVM lưu vào cache theo TTL
~~~

**Giá trị mặc định (cần nhớ khi phỏng vấn):**
| Thuộc tính | Có Security Manager | Không có Security Manager (phổ biến hiện nay) |
|---|---|---|
| {{networkaddress.cache.ttl}} (thành công) | -1 (cache vĩnh viễn) | 30 (giây) |
| {{networkaddress.cache.negative.ttl}} (thất bại) | 10 | 10 |

Giá trị: {{-1}} = cache mãi; {{0}} = không cache; {{N}} = cache N giây. (Xác nhận trên JDK bạn dùng vì hành vi/tài liệu có thể khác theo bản phân phối; Security Manager bị deprecate từ Java 17.)

### Cấu hình TTL
~~~text
# File: $JAVA_HOME/conf/security/java.security
# (tìm dòng networkaddress.cache.ttl)
networkaddress.cache.ttl=30
networkaddress.cache.negative.ttl=10
~~~
Hoặc đặt trong code lúc khởi động (phải chạy sớm, trước lookup đầu tiên, và cân nhắc chính sách bảo mật):
~~~java
import java.security.Security;

// Cache 30 giây — cân bằng giữa giảm lookup và phản ứng failover
Security.setProperty("networkaddress.cache.ttl", "30");
Security.setProperty("networkaddress.cache.negative.ttl", "5");
~~~
Hoặc truyền property khi chạy (một số JDK hỗ trợ property khác nhau; cách chắc là {{java.security}}). Kiểm tra tài liệu JDK cụ thể.

**Cân nhắc khi chọn TTL:**
- TTL quá lớn (hoặc -1): sau failover/đổi IP (RDS endpoint đổi IP, ELB, đối tác DR), app gọi IP cũ → lỗi kéo dài cho tới khi restart hoặc hết cache.
- TTL = 0: mỗi lần gọi đều resolve → tăng độ trễ, tăng tải DNS; nhưng phản ứng nhanh với thay đổi.
- Thực tế: 30-60 giây là điểm cân bằng phổ biến; với dịch vụ failover quan trọng, 10-30 giây. Kết hợp **connection pool** để giảm số lần resolve (kết nối giữ mở không cần resolve lại).

### Chẩn đoán DNS chậm trên Linux/container
~~~bash
# 1) Cấu hình resolver trong container/pod
cat /etc/resolv.conf
# nameserver, search, ndots, options timeout/attempts

cat /etc/nsswitch.conf | grep hosts
# Ví dụ: hosts: files dns  (tra /etc/hosts trước, rồi DNS)

# 2) Đo thời gian resolve (bỏ qua cache JVM — chạy từ shell)
time getent hosts api.partner.com
# getent dùng NSS của hệ thống (giống nhiều app native)

dig api.partner.com
# Xem "Query time" (ms), SERVER nào trả lời, ANSWER SECTION

# 3) Kiểm tra /etc/hosts có entry cũ không
grep partner /etc/hosts

# 4) Kiểm tra connectivity/độ trễ tới DNS server
# (từ resolv.conf lấy IP nameserver, ví dụ 10.96.0.10)
# dùng nc hoặc dig đo lặp lại

# 5) Nếu nghi cache OS (nscd/systemd-resolved)
# systemd-resolve --statistics (tuỳ distro)
~~~

**Trong Kubernetes:** {{/etc/resolv.conf}} thường trỏ tới CoreDNS (ClusterIP). {{ndots:5}} và search domain có thể làm một tên miền ngoài bị thử nhiều lần với suffix nội bộ → nhiều query NXDOMAIN, tăng độ trễ (xem cũng {{devops-035}}). Triệu chứng: {{dig}} tên FQDN có dấu chấm cuối {{api.partner.com.}} nhanh, nhưng gọi không có dấu chấm chậm.

### Phân biệt "DNS chậm" với "kết nối chậm"
| Triệu chứng | Nghi DNS | Nghi TCP/TLS/connect |
|---|---|---|
| Lần đầu gọi domain chậm, lần sau (cùng process, trong TTL) nhanh | Cache JVM/OS miss rồi hit | Ít liên quan |
| {{dig}} chậm | Resolver/DNS server/search path | Không |
| {{dig}} nhanh nhưng app chậm | Cache JVM TTL=0, hoặc resolve mỗi lần do code | Hoặc TLS handshake, pool cạn |
| Sau failover vẫn gọi IP cũ | Cache JVM/OS TTL quá dài | Không |

### Lỗi hay gặp
1. **Đặt {{networkaddress.cache.ttl=-1}} (cache vĩnh viễn)**: phổ biến khi copy cấu hình cũ "cho an toàn". Hậu quả: failover DNS không có tác dụng cho tới khi restart toàn bộ JVM. Cách tránh: đặt TTL hữu hạn (30s) trừ khi bạn có cơ chế khác.
2. **Chỉ sửa DNS record nhưng quên TTL ở nhiều lớp**: DNS authoritative TTL, resolver cache, OS cache, JVM cache, connection pool giữ kết nối tới IP cũ. Cách tránh: khi lên kế hoạch failover, hạ TTL trước (giờ/ngày tuỳ), hiểu toàn bộ chuỗi cache.
3. **Đổ lỗi cho "Java chậm" mà không đo tầng OS**: {{dig/getent}} mất 3 giây thì JVM cũng vậy. Cách tránh: chẩn đoán từ dưới lên (network → resolver → OS NSS → JVM).
4. **Nhầm {{tcp_fin_timeout}}/sysctl khác với DNS**: các tham số TCP không sửa DNS. Cách tránh: khoanh vùng đúng tầng.

### Trả lời phỏng vấn
JVM cache DNS trong {{InetAddress}}. Mặc định hiện đại (không có Security Manager) thường cache lookup thành công khoảng 30 giây và lookup lỗi 10 giây; có thể cấu hình {{networkaddress.cache.ttl}} và {{networkaddress.cache.negative.ttl}} trong {{java.security}} hoặc set sớm bằng {{Security.setProperty}}. TTL quá dài gây app gọi IP cũ sau failover; TTL 0 gây quá nhiều lookup. Khi DNS chậm, em chẩn đoán từ OS: {{/etc/resolv.conf}}, {{nsswitch.conf}}, đo bằng {{getent}} và {{dig}} để tách resolver chậm khỏi app chậm. Trên Kubernetes em chú ý {{ndots}}/search domain làm tăng số query. Em cũng dùng connection pool để giảm tần suất resolve.

> Senior tip: Trước một đợt failover có kế hoạch (đổi endpoint DB, DR site), hãy lập checklist: hạ DNS TTL ở authoritative trước; xác nhận JVM {{networkaddress.cache.ttl}} đủ thấp; kiểm tra connection pool có validate/evict kết nối chết; và có runbook restart rolling nếu cần. "DNS đã đổi mà app vẫn lỗi" gần như luôn là chuyện cache ở một tầng nào đó.`,
    follow: [
      'Sự khác nhau giữa TTL của bản ghi DNS (authoritative) và {{networkaddress.cache.ttl}} của JVM là gì?',
      'Trong Kubernetes, {{ndots:5}} ảnh hưởng thế nào đến độ trễ phân giải tên miền ngoài cluster?',
      'Bạn xử lý thế nào để service Java phản ứng nhanh khi RDS failover đổi endpoint IP?'
    ],
    tags: ['Linux', 'DNS', 'JVM', 'InetAddress', 'networkaddress.cache.ttl', 'troubleshooting']
  },
  {
    id: 'devops-062',
    topic: 'devops',
    level: 'mid',
    q: 'Process Java bỗng biến mất. Có lúc log có {{java.lang.OutOfMemoryError}}, có lúc log im lặng và container báo exit code 137. Khác nhau giữa OOM killer của Linux (kernel) và OutOfMemoryError của JVM là gì, bạn dùng {{dmesg}}/journalctl để xác nhận ra sao, và cách phòng tránh mỗi loại?',
    a: `**Tóm tắt:** **OutOfMemoryError (OOME)** là lỗi do **JVM** ném ra khi không cấp phát được bộ nhớ trong các vùng JVM quản lý (heap, metaspace, v.v.) — process thường vẫn sống (tuỳ cấu hình), log có stack trace OOME, và bạn có thể có heap dump nếu bật {{-XX:+HeapDumpOnOutOfMemoryError}}. **OOM killer** là cơ chế của **Linux kernel**: khi hệ thống (hoặc cgroup/container) cạn RAM, kernel chọn process để giết ngay (SIGKILL) — log ứng dụng thường **không kịp ghi gì**, exit code thường là 137 (128+9), và bằng chứng nằm ở {{dmesg}} hoặc {{journalctl -k}}. Hai thứ khác tầng, khác triệu chứng, khác cách sửa.

### Hiểu nhanh
Hãy coi JVM như một công ty thuê văn phòng (container có giới hạn RAM). **OOME** giống kế toán nội bộ (JVM) báo "phòng heap hết chỗ, không đặt thêm bàn được" — công ty vẫn đứng vững, kế toán viết biên bản (stack trace). **OOM killer** giống ban quản lý toà nhà (kernel) thấy cả toà/căn hộ vượt điện nước cho phép, cắt điện đột ngột (SIGKILL) — không ai kịp viết biên bản, chỉ có sổ bảo vệ toà nhà ({{dmesg}}) ghi lại.

### Thuật ngữ
- **Heap**: vùng nhớ JVM cấp phát object Java. Giới hạn bởi {{-Xmx}}.
- **Metaspace**: vùng nhớ (native, từ Java 8+) chứa metadata class. Có thể bị tràn nếu load class quá nhiều.
- **SIGKILL (signal 9)**: tín hiệu buộc process chết ngay, process không bắt/chặn và không chạy shutdown hook. Exit code = 128 + 9 = **137**.
- **cgroup (control group)**: cơ chế Linux giới hạn tài nguyên (RAM, CPU) cho nhóm process. Container dùng cgroup; vượt memory limit của cgroup → kernel OOM kill process trong cgroup.
- **oom_score / oom_score_adj**: giá trị kernel dùng để chọn "nạn nhân" khi OOM ở mức hệ thống. Điểm cao hơn dễ bị giết hơn.

### Bảng so sánh
| | OutOfMemoryError (JVM) | OOM killer (Linux kernel) |
|---|---|---|
| Ai quyết định | JVM | Kernel (hệ thống hoặc cgroup) |
| Nguyên nhân điển hình | Heap đầy, metaspace đầy, không tạo được thread native | Process/cgroup vượt RAM vật lý/limit; node hết RAM |
| Log ứng dụng | Có {{java.lang.OutOfMemoryError: ...}} và stack trace | Thường **không có** gì (bị SIGKILL) |
| Exit code (container/process) | Tuỳ: app có thể còn chạy, hoặc thoát với code do app quyết định; nếu dùng {{-XX:+ExitOnOutOfMemoryError}} JVM thoát (thường code 3) / {{CrashOnOutOfMemoryError}} | Thường **137** (SIGKILL) |
| Heap dump | Có nếu bật {{-XX:+HeapDumpOnOutOfMemoryError}} | Không (JVM không được chạy) |
| Bằng chứng | Log app, heap dump ({{.hprof}}), {{jstat}} | {{dmesg -T}}, {{journalctl -k}}, {{/var/log/kern.log}} (tuỳ distro), event K8s |
| Cách sửa | Tăng/điều chỉnh {{-Xmx}}, sửa leak, giảm allocation, xem metaspace/thread | Tăng memory limit/request hợp lý, giảm RSS (heap + metaspace + thread stack + direct buffer + native), sửa leak native |

### Xác nhận OOM killer
~~~bash
# Xem log kernel (cần quyền; trên container có thể phải xem ở node)
dmesg -T | grep -i -E 'killed process|out of memory|oom-kill'
# Ví dụ dòng:
# [Tue Nov 05 10:22:11 2026] Out of memory: Killed process 12345 (java)
#   total-vm:..., anon-rss:..., file-rss:..., shmem-rss:...

# Với systemd/journald
journalctl -k --since "1 hour ago" | grep -i -E 'killed process|oom'

# Trên Kubernetes: mô tả pod
kubectl describe pod <pod>
# Tìm: Last State: Terminated, Reason: OOMKilled, Exit Code: 137
# Hoặc Events có cảnh báo
~~~
Nếu chạy trong container, {{dmesg}} trong container có thể không thấy gì tuỳ cấu hình bảo mật; kiểm tra trên **node** hoặc dùng {{kubectl describe}}/monitoring.

### Xác nhận OutOfMemoryError của JVM
~~~bash
# Tìm trong log ứng dụng
grep -n "OutOfMemoryError" /var/log/app/app.log

# Các dạng OOME phổ biến:
# Java heap space          -> heap đầy (leak hoặc heap nhỏ)
# Metaspace                -> quá nhiều class/loader (thường leak ClassLoader)
# unable to create new native thread -> hết RAM/native cho thread stack hoặc chạm giới hạn OS
# Direct buffer memory     -> ByteBuffer direct (Netty, NIO) tích luỹ
# GC overhead limit exceeded (một số GC/cấu hình cũ) -> GC chạy mãi không thu hồi được
~~~

### Phòng tránh
**Với OOME (JVM):**
~~~bash
# Bật heap dump khi OOME (nhớ đảm bảo có chỗ ghi file dump)
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/app/heapdump.hprof
# Cho JVM thoát để orchestrator restart sạch (tuỳ chiến lược)
-XX:+ExitOnOutOfMemoryError
# Giới hạn heap hợp lý, không đặt -Xmx sát memory limit container
~~~

**Với OOM killer (container):**
- Tổng RSS thực tế = heap + metaspace + code cache + thread stacks + direct buffers + native + GC overhead. Đừng đặt {{-Xmx}} = 100% memory limit container. Quy tắc thô: heap 60-75% limit, chừa phần còn lại cho non-heap.
- Dùng {{-XX:MaxRAMPercentage=75.0}} (JDK 10+) để JVM tính heap theo limit container/cgroup.
- Đặt Kubernetes {{resources.requests.memory}} và {{limits.memory}} thực tế; theo dõi {{container_memory_working_set_bytes}}.
- Kiểm tra số thread ({{-Xss}}, thread pool) — mỗi thread tốn stack (mặc định thường ~1MB, tuỳ JVM/OS).

### Lỗi hay gặp
1. **Thấy exit 137 liền tăng {{-Xmx}}**: nếu bị OOM killer do cgroup, tăng heap có thể làm RSS vượt limit nhanh hơn → bị giết sớm hơn. Cách tránh: xác nhận {{dmesg}}/K8s OOMKilled; tăng **memory limit** container hoặc giảm non-heap/heap hợp lý.
2. **Không bật heap dump vì "tốn đĩa"**: khi OOME thật sự xảy ra bạn không có dữ liệu phân tích leak. Cách tránh: bật dump, cấu hình đường dẫn có dung lượng, có cơ chế dọn file cũ.
3. **Nhầm OOME {{unable to create new native thread}} là heap**: tăng {{-Xmx}} có thể làm tệ hơn vì bớt RAM native cho thread. Cách tránh: đọc kỹ thông điệp OOME; kiểm tra số thread, {{-Xss}}, {{ulimit -u}}.
4. **Chỉ nhìn log app khi process biến mất**: OOM killer không để lại log app. Cách tránh: luôn kiểm tra kernel log/K8s events.

### Trả lời phỏng vấn
Em phân biệt hai trường hợp. OutOfMemoryError là JVM ném ra khi heap/metaspace/direct memory/... không đủ — log app có stack trace, có thể có heap dump nếu bật {{HeapDumpOnOutOfMemoryError}}. OOM killer là kernel Linux giết process (thường SIGKILL, exit 137) khi hệ thống hoặc cgroup cạn RAM — log app thường im lặng, bằng chứng nằm ở {{dmesg -T}} hoặc {{journalctl -k}} và trên Kubernetes là {{OOMKilled}}. Cách sửa khác nhau: OOME thì phân tích heap dump, chỉnh {{-Xmx}} hoặc sửa leak; OOM killer thì đảm bảo memory limit đủ cho tổng RSS (heap + non-heap + thread + direct buffer), dùng {{MaxRAMPercentage}} thay vì hardcode {{-Xmx}} quá sát limit.

> Senior tip: Quy tắc vận hành: mọi service Java production nên có {{-XX:+HeapDumpOnOutOfMemoryError}}, {{-XX:+ExitOnOutOfMemoryError}} (hoặc cơ chế tương đương) để fail-fast và để orchestrator restart; đồng thời dashboard phải tách bạch "OOMKilled (kernel)" và "OOME (JVM)" vì runbook khác nhau. Đừng chẩn đoán OOM chỉ bằng "app chết".`,
    follow: [
      'Làm sao chọn {{-Xmx}} và {{MaxRAMPercentage}} khi chạy Java trong container có memory limit 2Gi?',
      'OOM killer chọn process nào để giết khi cả node cạn RAM? {{oom_score_adj}} ảnh hưởng thế nào?',
      'OOME "Metaspace" thường do nguyên nhân gì trong ứng dụng Spring Boot, và cách phát hiện?'
    ],
    tags: ['Linux', 'OOM killer', 'OutOfMemoryError', 'dmesg', 'JVM', 'Kubernetes', 'troubleshooting']
  },
  {
    id: 'devops-063',
    topic: 'devops',
    level: 'senior',
    q: 'Service Java chạy vài ngày thì ném {{java.io.IOException: Too many open files}} hoặc {{SocketException: Too many open files}}. Bạn kiểm tra giới hạn {{ulimit -n}} (soft/hard), giới hạn trong systemd/container, và dùng {{lsof}}/{{/proc/<PID>/fd}} để tìm rò rỉ file descriptor trong Java thế nào?',
    a: `**Tóm tắt:** Mỗi file, socket, pipe, epoll fd... process mở đều tiêu tốn một **file descriptor (fd)**. Linux giới hạn số fd mỗi process bằng {{RLIMIT_NOFILE}} (soft limit và hard limit, xem {{ulimit -n}} / {{ulimit -Hn}}). Khi chạm giới hạn, mở file/socket mới thất bại với "Too many open files" (EMFILE). Nguyên nhân thường gặp trong Java: stream/socket/channel không đóng (thiếu try-with-resources), {{Files.list/lines/walk}} trả về Stream giữ fd, connection pool lệch cấu hình, hoặc WatchService. Chẩn đoán: xem giới hạn thực của process trong {{/proc/<PID>/limits}}, đếm fd hiện tại, dùng {{lsof -p}} để biết fd là loại gì và trỏ tới đâu; sửa code đóng tài nguyên và đặt giới hạn hợp lý ở tầng systemd/container.

### Hiểu nhanh
File descriptor giống "số vé" để vào phòng tài nguyên: mỗi file đang mở, mỗi kết nối mạng, mỗi pipe đều cần một vé. Kernel cấp cho mỗi process một số vé tối đa (giới hạn). Nếu code "mượn vé" (mở file/socket) nhưng quên "trả vé" (close), số vé đang giữ tăng dần — chạy vài ngày là hết, và lần mở tiếp theo bị từ chối: "Too many open files". Dù thông báo nói "files", thực ra socket mạng cũng tính.

### Thuật ngữ
- **File descriptor (fd)**: số nguyên không âm (0,1,2...): 0=stdin, 1=stdout, 2=stderr; từ 3 trở đi là file/socket/pipe... do process mở.
- **Soft limit / Hard limit**: soft là ngưỡng kernel áp dụng ngay; process (có quyền phù hợp) có thể tăng soft lên tới hard; chỉ root (hoặc quyền {{CAP_SYS_RESOURCE}}) mới tăng hard. {{ulimit -n}} thường hiện soft; {{ulimit -Hn}} hiện hard.
- **{{RLIMIT_NOFILE}}**: tên giới hạn tài nguyên cho số fd mở.
- **try-with-resources**: cú pháp Java cho phép khai báo tài nguyên trong câu lệnh {{try(...)}}; trình biên dịch tự chèn lệnh {{close()}} khi ra khỏi block, kể cả khi có exception. Ví dụ: {{try (var in = Files.newInputStream(path))}} rồi dùng {{in}} bên trong block.

### Kiểm tra giới hạn và mức sử dụng
~~~bash
# Giới hạn trong shell hiện tại (có thể KHÁC process đang chạy)
ulimit -n      # soft
ulimit -Hn     # hard

# Giới hạn THỰC của process Java (quan trọng)
PID=12345
cat /proc/$PID/limits | grep "Max open files"
# Max open files   1024   4096   files  (ví dụ: soft 1024, hard 4096)

# Số fd đang mở
ls /proc/$PID/fd | wc -l
# hoặc
lsof -nP -p $PID | wc -l

# Xem fd là loại gì (file thường, socket TCP/UDP, pipe, anon_inode...)
lsof -nP -p $PID | awk '{print $5}' | sort | uniq -c | sort -rn | head
# Ví dụ: 800 IPv4 (socket), 50 REG (file), 30 FIFO...
~~~

Nếu {{ls /proc/$PID/fd | wc -l}} tăng đều theo thời gian (đồ thị đi lên), đó là rò rỉ.

### Giới hạn ở nhiều tầng (Linux/service/container)
| Tầng | Cấu hình | Ghi chú |
|---|---|---|
| Kernel toàn hệ thống | {{fs.file-max}}, {{fs.nr_open}} ({{/proc/sys/fs/...}}) | Trần hệ thống; hiếm khi là nguyên nhân trực tiếp của một process |
| PAM/login shell | {{/etc/security/limits.conf}}, {{limits.d}} | Áp dụng cho session đăng nhập; **service systemd thường không đọc** file này |
| systemd service | {{LimitNOFILE=65536}} trong {{[Service]}} | Cách đúng cho daemon chạy bằng systemd; reload daemon và restart service |
| Docker/containerd | {{--ulimit nofile=65536:65536}}, hoặc config runtime | Image/container cần đặt rõ; mặc định có thể thấp |
| Kubernetes | Thường kế thừa từ node/container runtime; một số môi trường dùng {{securityContext}}/annotations tuỳ runtime | Kiểm tra thực tế trong pod: {{cat /proc/1/limits}} |

**Bẫy:** bạn SSH vào server thấy {{ulimit -n}} = 65535, nhưng service Java do systemd chạy vẫn thấy 1024 trong {{/proc/$PID/limits}} vì systemd unit không set {{LimitNOFILE}}.

### Tìm rò rỉ fd trong Java: pattern thường gặp
~~~bash
# Socket rò rỉ: nhiều dòng TCP tới cùng đích hoặc CLOSE_WAIT
lsof -nP -p $PID | grep TCP | head
ss -tanp | grep "pid=$PID"

# File rò rỉ: nhiều REG trỏ tới file log/tạm/thư mục
lsof -nP -p $PID | grep REG | awk '{print $9}' | sort | uniq -c | sort -rn | head

# "anon_inode:[eventpoll]" nhiều bất thường: có thể do tạo selector/epoll lặp (hiếm)
# Pipe nhiều: tạo ProcessBuilder/process không đóng stream
~~~

**Code Java hay gây rò:**
~~~java
// SAI: Files.lines trả về Stream giữ fd mở cho tới khi close
long n = Files.lines(Path.of("/data/big.txt")).count();

// ĐÚNG
try (Stream<String> lines = Files.lines(Path.of("/data/big.txt"))) {
    long n = lines.count();
}

// SAI: Files.list / Files.walk cũng phải close
Files.list(dir).forEach(...);

// ĐÚNG
try (Stream<Path> paths = Files.list(dir)) {
    paths.forEach(...);
}

// SAI: HttpURLConnection / InputStream không đóng
InputStream in = url.openStream();
byte[] b = in.readAllBytes();

// ĐÚNG
try (InputStream in = url.openStream()) {
    byte[] b = in.readAllBytes();
}

// ZipFile / JarFile giữ fd tới file nén — phải close
try (ZipFile z = new ZipFile("app.jar")) { ... }
~~~
Ngoài ra: {{DirectoryStream}} (NIO) phải close; {{WatchService}} nếu tạo mới liên tục; kết nối HTTP/DB không qua pool hoặc pool cấu hình sai (leak detection của HikariCP hữu ích).

### Công cụ hỗ trợ
- HikariCP: bật {{leakDetectionThreshold}} để log cảnh báo connection mượn quá lâu.
- {{lsof}} lặp lại theo thời gian hoặc giám sát {{process_files_open_files}} / {{process_files_max_files}} (Prometheus JMX exporter / Micrometer).
- Heap dump đôi khi giúp gián tiếp (tìm object giữ {{Socket}}, {{FileInputStream}}), nhưng công cụ trực tiếp hơn là {{lsof}} và review code path.

### Lỗi hay gặp
1. **Chỉ tăng {{ulimit}}/{{LimitNOFILE}} mà không sửa leak**: hết fd muộn hơn, nhưng vẫn hết; đồng thời che giấu bug. Cách tránh: tăng giới hạn là biện pháp an toàn tạm thời, nhưng phải tìm và sửa leak.
2. **Sửa {{/etc/security/limits.conf}} cho systemd service**: không có tác dụng. Cách tránh: đặt {{LimitNOFILE}} trong unit file systemd.
3. **Nhầm "Too many open files" chỉ là file trên đĩa**: phần lớn trường hợp trên service mạng là **socket**. Cách tránh: dùng {{lsof}} phân loại theo TYPE.
4. **Đóng resource ở nhánh happy-path nhưng quên khi exception**: rò rỉ chỉ xuất hiện khi có lỗi. Cách tránh: luôn dùng try-with-resources cho {{Closeable}}/{{AutoCloseable}}.

### Trả lời phỏng vấn
"Too many open files" nghĩa là process chạm {{RLIMIT_NOFILE}}. Em kiểm tra giới hạn thực của process qua {{/proc/<PID>/limits}} (không chỉ {{ulimit}} trong shell) vì systemd/container có thể đặt khác. Em đo số fd bằng {{ls /proc/<PID>/fd | wc -l}} và phân loại bằng {{lsof -p}} để biết là socket hay file thường. Trong Java, nguyên nhân hay gặp là quên đóng resource: {{Files.lines/list/walk}} trả Stream giữ fd, {{InputStream}}/{{Socket}}/{{ZipFile}} không close, hoặc HTTP/DB connection không trả về pool — fix bằng try-with-resources và cấu hình pool đúng. Em tăng {{LimitNOFILE}} (systemd) hoặc ulimit container như biện pháp an toàn, nhưng luôn xử lý leak gốc và thêm giám sát {{open_files}} theo thời gian.

> Senior tip: Hãy đặt alert khi {{process_open_fds / process_max_fds > 0.7}} (hoặc tương đương). Rò fd thường tăng chậm (vài fd/phút) và chỉ nổ sau ngày — nếu bạn chỉ nhìn khi đã 100%, bạn luôn xử lý sự cố lúc nửa đêm. Với Java NIO/Netty, cũng kiểm tra direct buffer và số channel, nhưng "Too many open files" là tín hiệu fd-level rõ ràng nhất.`,
    follow: [
      'Tại sao {{Files.lines()}} bắt buộc phải dùng trong try-with-resources trong khi nhiều developer bỏ sót?',
      'Khác nhau giữa đặt {{ulimit}} trong shell, {{limits.conf}}, và {{LimitNOFILE}} của systemd?',
      'Làm sao dùng HikariCP leak detection và metric fd để phát hiện connection leak trước khi chạm giới hạn?'
    ],
    tags: ['Linux', 'ulimit', 'file descriptor', 'Too many open files', 'lsof', 'Java', 'troubleshooting']
  },
  {
    id: 'devops-064',
    topic: 'devops',
    level: 'lead',
    q: 'Bạn xây dựng runbook xử lý sự cố production cho team on-call của một dịch vụ Java (ngân hàng/thanh toán). Runbook cần gồm những bước nào (detect/triage/mitigate/resolve/postmortem), nguyên tắc thu thập bằng chứng trước khi restart, và cách tổ chức escalation/communication để giảm thời gian ảnh hưởng?',
    a: `**Tóm tắt:** Runbook sự cố là tài liệu hành động theo bước để người trực (kể cả không phải tác giả hệ thống) có thể **giảm ảnh hưởng nhanh, an toàn, có phối hợp**. Khung chuẩn: **Detect → Triage → Mitigate → Communicate (song song) → Resolve → Postmortem**. Với Java, nguyên tắc vàng là **thu thập bằng chứng trước khi restart** (thread dump, heap dump/histogram, GC log, {{dmesg}}, metric snapshot) vì restart xoá trạng thái trong RAM. Ở cấp lead, bạn thiết kế runbook để giảm MTTR (mean time to recovery), giảm bus factor, và xây văn hoá blameless: mục tiêu là sửa hệ thống, không tìm người đổ lỗi.

### Hiểu nhanh
Runbook giống "sổ tay xử lý cháy" đặt cạnh bình chữa cháy: khi có khói, người trực không cần nhớ hết kiến trúc — họ mở đúng trang, làm theo checklist, gọi đúng người, và ghi lại đã làm gì. Trong thanh toán/ngân hàng, xử lý sự cố còn gắn với cam kết SLA, thông báo khách hàng/đối tác, và đôi khi yêu cầu tuân thủ (audit trail). Restart service giống "tắt cầu dao" — có thể dập lửa nhanh nhưng cũng làm mất dấu vết; vì vậy phải chụp ảnh hiện trường (bằng chứng) trước.

### Thuật ngữ
- **Incident (sự cố)**: tình huống làm giảm chất lượng dịch vụ hoặc gián đoạn (lỗi tăng, latency tăng, mất chức năng).
- **On-call**: lịch trực để phản ứng sự cố ngoài giờ hành chính.
- **MTTD / MTTR**: Mean Time To Detect / To Recover — thời gian trung bình phát hiện / khôi phục.
- **Mitigation (giảm thiểu)**: hành động giảm ảnh hưởng cho khách hàng nhanh (rollback, scale, chuyển traffic), chưa nhất thiết sửa nguyên nhân gốc.
- **Root cause (nguyên nhân gốc)**: nguyên nhân sâu khiến sự cố xảy ra; tìm sau khi hệ thống ổn.
- **Blameless postmortem**: họp rút kinh nghiệm không quy lỗi cá nhân, tập trung vào cơ chế/hệ thống/guardrail.

### Cấu trúc runbook (mẫu khung)
~~~text
1. Detect (Phát hiện)
   - Nguồn: alert (Prometheus/Alertmanager, CloudWatch, APM), báo từ CS/đối tác
   - Điều kiện vào incident: error rate > X% trong Y phút, p99 > Z ms, payment success < ...
   - Mở kênh incident (Slack/Teams/bridge call), đặt Incident Commander (IC) nếu mức độ cao

2. Triage (Phân loại)
   - Mức độ (SEV): SEV1 ảnh hưởng giao dịch tiền/khách hàng diện rộng; SEV2 suy giảm một phần; SEV3 thấp
   - Phạm vi: bao nhiêu % traffic, region nào, chức năng nào (login/thanh toán/tra cứu)
   - Giả thuyết nhanh: deploy gần đây? phụ thuộc DB/đối tác/mạng? thay đổi hạ tầng?

3. Mitigate (Giảm thiểu) — ưu tiên khôi phục dịch vụ
   - Rollback phiên bản gần nhất (nếu tương quan với deploy)
   - Tắt feature flag gây lỗi; giảm traffic (rate limit), chuyển sang chế độ degraded
   - Scale/restart có kiểm soát (sau khi thu bằng chứng); failover DB/region theo playbook
   - Với thanh toán: xác định giao dịch treo/đang xử lý, tránh double-charge; phối hợp nghiệp vụ

4. Communicate (Song song)
   - Cập nhật định kỳ (ví dụ mỗi 15 phút cho SEV1): trạng thái, ảnh hưởng, hành động tiếp theo, ETA nếu có
   - Stakeholder: CS, quản lý, đối tác, (nếu cần) tuân thủ/pháp chế — theo mẫu thông báo đã duyệt
   - Ghi timeline: mốc thời gian + hành động + người thực hiện

5. Resolve (Khắc phục)
   - Xác nhận metric hồi phục (error rate, latency, success rate) ổn định
   - Theo dõi sau sự cố (hypercare) 30-60 phút
   - Đóng incident khi đạt điều kiện

6. Postmortem (Rút kinh nghiệm) — trong 24-72 giờ làm việc
   - Timeline khách quan, impact (số giao dịch/khách hàng, thời gian)
   - Root cause (kỹ thuật + quy trình), contributing factors
   - Action items có owner, deadline, mức ưu tiên (test, alert, circuit breaker, runbook cập nhật)
   - Blameless: không nêu tên để quy lỗi; nêu "hệ thống cho phép điều gì xảy ra"
~~~

### Nguyên tắc thu thập bằng chứng TRƯỚC khi restart (Java)
Restart/xoá pod/kill process làm mất: stack thread, heap, trạng thái socket, buffer trong RAM. Hãy chuẩn bị "gói thu thập" (script) và chạy nhanh:

~~~bash
TS=$(date +%Y%m%d_%H%M%S)
OUT=/tmp/incident_$TS; mkdir -p $OUT
PID=<PID_JAVA>

# 1) Bối cảnh hệ thống
date > $OUT/time.txt
uptime; free -m; df -h; df -i > $OUT/sys.txt
top -H -b -n1 -p $PID > $OUT/top_threads.txt

# 2) Thread dump: 3 lần cách 5-10 giây
for i in 1 2 3; do jcmd $PID Thread.print > $OUT/threaddump_$i.txt; sleep 7; done
# Hoặc jstack $PID

# 3) Bộ nhớ/GC
jcmd $PID GC.heap_info > $OUT/heap_info.txt 2>&1 || true
jcmd $PID GC.class_histogram > $OUT/class_histogram.txt 2>&1 || true
# Heap dump chỉ khi nghi leak và còn dung lượng/cho phép (file lớn, có thể gây pause)
# jcmd $PID GC.heap_dump $OUT/heap.hprof

# 4) Mạng/socket
ss -s > $OUT/ss_summary.txt
ss -tanp > $OUT/ss_all.txt 2>&1 || true
lsof -nP -p $PID > $OUT/lsof.txt 2>&1 || true

# 5) Kernel/OOM
dmesg -T | tail -200 > $OUT/dmesg_tail.txt 2>&1 || true

# 6) Log app (kéo đoạn gần sự cố)
# tail -n 5000 /var/log/app/app.log > $OUT/app_tail.log

# Nén và lưu theo quy định (chú ý dữ liệu nhạy cảm/PII)
tar czf $OUT.tgz $OUT
~~~

**Trong Kubernetes:** dùng {{kubectl exec}} (nếu container có {{jcmd}}), ephemeral debug container, hoặc endpoint Actuator ({{/actuator/threaddump}}, {{/actuator/heapdump}}) được bảo vệ chặt. Cân nhắc: {{heapdump}} có thể chứa dữ liệu nhạy cảm — tuân thủ chính sách bảo mật.

**Khi nào restart trước?** Nếu ảnh hưởng SEV1 đang lan rộng và bạn đã chụp tối thiểu (thread dump + metric + {{dmesg}}) hoặc không thể truy cập process, ưu tiên giảm thiểu. Runbook phải ghi rõ "tối thiểu cần gì trước khi restart".

### Escalation & communication
- **Ma trận escalation**: SEV1 gọi IC + lead kỹ thuật + chủ sở hữu dịch vụ phụ thuộc trong X phút; có số liên lạc dự phòng.
- **Một đầu mối điều phối (IC)**: tránh nhiều người ra lệnh chồng chéo.
- **Mẫu thông báo**: viết sẵn cho khách hàng nội bộ/đối tác, nêu "ảnh hưởng gì, từ khi nào, đang làm gì, cập nhật tiếp lúc nào" — không suy đoán nguyên nhân khi chưa chắc.
- **Ngân hàng/thanh toán**: ghi nhận giao dịch nghi vấn, phối hợp reconciliation; tuân thủ quy trình báo cáo sự cố theo quy định nội bộ/cơ quan quản lý nếu đạt ngưỡng.

### Lỗi hay gặp
1. **Không có runbook, chỉ có "anh A biết"**: anh A nghỉ phép thì MTTR tăng vọt. Cách tránh: tài liệu hoá, diễn tập (game day), cập nhật sau mỗi postmortem.
2. **Restart reflex (phản xạ restart)**: dập triệu chứng nhưng lặp lại, không có dữ liệu root cause. Cách tránh: checklist "thu bằng chứng tối thiểu" trước restart; tự động hoá thu thập.
3. **Postmortem biến thành buổi quy lỗi**: mọi người giấu thông tin lần sau. Cách tránh: blameless, tập trung vào guardrail (alert, test, circuit breaker, limit, review).
4. **Action items mơ hồ, không owner/deadline**: "cải thiện monitoring" không bao giờ xong. Cách tránh: mỗi action có người chịu trách nhiệm, hạn, và tiêu chí hoàn thành.

### Trả lời phỏng vấn (góc lead)
Em xây runbook theo vòng đời Detect, Triage, Mitigate, Communicate, Resolve, Postmortem. Phần quan trọng nhất với Java là checklist thu bằng chứng trước khi restart: 3 thread dump cách nhau, thông tin heap/GC, số fd/socket, và {{dmesg}} để phân biệt OOM killer với OOME — vì restart xoá trạng thái RAM. Em phân mức SEV rõ, có Incident Commander, mẫu cập nhật stakeholder định kỳ, và ma trận escalation để đúng người tham gia trong vài phút. Sau sự cố là blameless postmortem với action items có owner và deadline. Mục tiêu của em là giảm MTTR và lặp lại sự cố, không phải tìm ai sai. Trong bối cảnh thanh toán, em thêm bước kiểm soát ảnh hưởng giao dịch và phối hợp nghiệp vụ/tuân thủ.

> Senior tip: Runbook chỉ sống nếu được dùng. Hãy (1) gắn link runbook vào alert, (2) chạy game day/diễn tập định kỳ trên môi trường an toàn, (3) cập nhật runbook ngay trong action item của postmortem. Một runbook 80% đúng nhưng ai cũng tìm thấy còn giá trị hơn tài liệu hoàn hảo nằm trong wiki không ai đọc.`,
    follow: [
      'Bạn phân định SEV1/SEV2 cho dịch vụ thanh toán dựa trên tiêu chí nào (SLO, % giao dịch, doanh thu, tuân thủ)?',
      'Khi nghi ngờ deploy gây lỗi, bạn chọn rollback hay roll-forward? Điều kiện ra quyết định là gì?',
      'Làm sao cân bằng giữa "thu thập heap dump" (có thể gây pause/lộ dữ liệu) và yêu cầu bảo mật/tuân thủ?'
    ],
    tags: ['on-call', 'incident response', 'runbook', 'SRE', 'postmortem', 'leadership', 'troubleshooting']
  },
{
  id: 'devops-065',
  topic: 'devops',
  level: 'mid',
  q: 'Giải thích user, group, quyền rwx/octal, sudo/sudoers, setuid, umask; cấp quyền tối thiểu cho user deploy thế nào?',
  a: `**Tóm tắt:** Linux quản lý truy cập bằng user/group và 3 nhóm quyền r/w/x cho owner/group/other; cấp quyền tối thiểu cho deploy user = user riêng, group riêng, sudo chỉ các lệnh cụ thể, umask 027, không setuid bừa.

### Khái niệm cơ bản
- **User**: mỗi tài khoản có UID; /etc/passwd lưu UID, home, shell.
- **Group**: tập user; /etc/group. Một user có primary group + supplementary groups.
- **Quyền rwx**: read (đọc nội dung/list dir), write (sửa/tạo/xoá), execute (chạy file/vào dir).
- **Octal**: r=4, w=2, x=1; ví dụ 755 = rwxr-xr-x, 640 = rw-r-----.
- **sudo**: chạy lệnh với quyền root theo chính sách /etc/sudoers (sửa bằng visudo).
- **sudoers**: định nghĩa ai được chạy lệnh nào trên host nào với tư cách ai.
- **setuid**: bit đặc biệt (4xxx) khiến file chạy với UID owner (ví dụ passwd). Rủi ro bảo mật lớn.
- **umask**: mặt nạ quyền mặc định khi tạo file (022 → file 644, dir 755; 027 → file 640, dir 750).

### Cấp quyền tối thiểu cho deploy user
1. Tạo user deploy riêng: useradd -m -s /bin/bash deploy.
2. Tạo group app và thêm deploy: usermod -aG app deploy.
3. Thư mục app thuộc group app, mode 2750 (setgid để file mới kế thừa group): chown -R root:app /opt/app && chmod 2750 /opt/app.
4. sudoers chỉ cho lệnh cần thiết: deploy ALL=(root) NOPASSWD: /bin/systemctl restart myapp, /bin/journalctl -u myapp. Sửa bằng visudo; không cho sudo su hay sudo bash.
5. umask 027 trong ~/.bashrc của deploy.
6. Private key deploy mode 600.

### Pitfall
- chmod -R 777 là anti-pattern.
- sudo NOPASSWD cho apt/yum = root thực sự.
- setuid trên script shell bị kernel bỏ qua.

> Senior tip: Nguyên tắc least privilege: deploy user không cần root shell, chỉ cần restart service và đọc log. Audit sudoers định kỳ (sudo -l -U deploy).`,
  follow: [
    'Khác nhau giữa chmod và chown? Khi nào dùng ACL (setfacl)?',
    'setgid bit trên thư mục có tác dụng gì với file mới tạo?',
    'Làm sao audit quyền truy cập của deploy user trên production?'
  ],
  tags: ['linux', 'permissions', 'sudo', 'umask', 'security']
},
{
  id: 'devops-066',
  topic: 'devops',
  level: 'senior',
  q: 'Viết bash script deploy xử lý lỗi: set -euo pipefail, trap ERR/EXIT, exit code, retry có giới hạn, log, idempotent.',
  a: `**Tóm tắt:** Script deploy đáng tin cậy = set -euo pipefail để fail-fast, trap để dọn dẹp/log, retry có giới hạn cho thao tác mạng, log có timestamp, và các bước idempotent (chạy lại không hại).

### set -euo pipefail
- set -e: thoát ngay khi lệnh fail.
- set -u: lỗi nếu dùng biến chưa khai báo.
- set -o pipefail: pipeline fail nếu bất kỳ lệnh nào fail (không chỉ lệnh cuối).

### trap
- trap cleanup EXIT: chạy cleanup khi script kết thúc (thành công hay lỗi).
- trap 'echo "fail at line LINENO" >&2' ERR: log dòng lỗi.

### Retry có giới hạn
retry() { local n=0 max=5 delay=2; until "$@"; do n=$((n+1)); [ $n -ge $max ] && return 1; sleep $delay; delay=$((delay*2)); done; }
Dùng cho curl health check, pull image, scp.

### Log
- exec > >(tee -a /var/log/deploy.log) 2>&1 hoặc function log() { echo "[$(date -Is)] $*"; }.
- Thêm correlation id (deploy id) để truy vết.

### Idempotent
- Kiểm tra trước khi làm: nếu file/service đã đúng trạng thái thì skip.
- Dùng checksum/version để quyết định có deploy không.
- Atomic: deploy vào thư mục mới rồi symlink switch, rollback = đổi symlink.

### Pitfall
- set -e không bắt lỗi trong if/while condition; cần kiểm tra rõ.
- trap ERR không chạy nếu exit do signal; thêm trap cho INT/TERM.
- Retry vô hạn gây hang; luôn có max.

> Senior tip: Script deploy production nên có --dry-run, lock file (flock) để tránh 2 deploy chạy cùng lúc, và exit code rõ ràng (0 ok, 1 lỗi chung, 2 lock, 3 health fail) để CI/CD phân loại.`,
  follow: [
    'Khác nhau giữa trap EXIT và trap ERR?',
    'Làm sao đảm bảo chỉ một instance deploy chạy cùng lúc (flock)?',
    'Khi nào nên dùng Ansible thay vì bash script?'
  ],
  tags: ['bash', 'deploy', 'error-handling', 'idempotency']
},
{
  id: 'devops-067',
  topic: 'devops',
  level: 'senior',
  q: 'So sánh Deployment, ReplicaSet, StatefulSet, DaemonSet: cơ chế bên trong và ví dụ dùng cho app Spring, Kafka/DB, log agent.',
  a: `**Tóm tắt:** Deployment quản lý ReplicaSet để rollout app stateless; ReplicaSet giữ số pod; StatefulSet cho workload stateful với identity/PVC ổn định và rollout có thứ tự; DaemonSet chạy 1 pod trên mỗi node.

### Cơ chế bên trong
- **ReplicaSet**: controller so sánh số pod thực tế với replicas, tạo/xoá pod theo selector. Có ownerReferences trỏ tới Deployment.
- **Deployment**: quản lý ReplicaSet, thực hiện rolling update, rollback bằng revision history.
- **StatefulSet**: pod có tên ổn định (web-0, web-1), PVC riêng theo ordinal, rollout có thứ tự, phù hợp DB/Kafka/ZooKeeper.
- **DaemonSet**: đảm bảo 1 pod trên mỗi node, dùng cho log/metrics agent, CNI, storage.

### Ví dụ
- App Spring Boot stateless → Deployment + HPA.
- Kafka broker → StatefulSet + PVC.
- Fluent Bit/log agent → DaemonSet.

### Pitfall
- Dùng Deployment cho DB sẽ mất identity/PVC mapping.
- StatefulSet scale down không tự xoá PVC; cần dọn thủ công.

> Senior tip: Chọn workload type theo state + identity: stateless → Deployment; stateful + identity → StatefulSet; node-level agent → DaemonSet.`,
  follow: [
    'Rolling update của Deployment hoạt động thế nào (maxSurge, maxUnavailable)?',
    'Khi nào dùng Job/CronJob thay vì Deployment?',
    'StatefulSet headless service dùng để làm gì?'
  ],
  tags: ['kubernetes', 'workload', 'deployment', 'statefulset', 'daemonset']
},
{
  id: 'devops-068',
  topic: 'devops',
  level: 'senior',
  q: 'Các loại Service (ClusterIP, NodePort, LoadBalancer, ExternalName, headless) và đưa request từ ngoài vào cluster (Ingress, Gateway API, AWS LB Controller), khi nào dùng cái nào?',
  a: `**Tóm tắt:** Service cung cấp endpoint ổn định cho pod; ClusterIP nội bộ, NodePort mở port node, LoadBalancer tạo LB cloud, ExternalName alias DNS, headless cho discovery trực tiếp. Từ ngoài vào dùng Ingress/Gateway API + AWS LB Controller.

### Các loại Service
- **ClusterIP**: IP nội bộ cluster, default. Dùng giao tiếp service-to-service.
- **NodePort**: mở port 30000-32767 trên mọi node; truy cập qua node IP:port.
- **LoadBalancer**: provision LB cloud (AWS NLB/ALB) trỏ vào service.
- **ExternalName**: CNAME tới DNS ngoài (không proxy).
- **Headless (clusterIP: None)**: trả DNS A records của pod; dùng StatefulSet discovery, gRPC.

### Đưa request từ ngoài vào
- **Ingress**: L7 routing (host/path) qua Ingress controller (nginx, ALB).
- **Gateway API**: chuẩn mới, hỗ trợ HTTPRoute/GRPCRoute, role separation.
- **AWS Load Balancer Controller**: tạo ALB/NLB từ Ingress/Gateway/Service.

### Khi nào dùng
- API public → Ingress/ALB + ClusterIP service.
- TCP/UDP hoặc gRPC streaming → NLB hoặc Gateway.
- Service mesh/internal → ClusterIP + mesh.

### Pitfall
- NodePort range và firewall.
- LoadBalancer mỗi service = nhiều LB → chi phí; gom qua Ingress.

> Senior tip: Ưu tiên Gateway API cho dự án mới; Ingress vẫn phổ biến. Dùng ExternalName để migrate dần dependency ngoài.`,
  follow: [
    'Khác nhau giữa Ingress và Service LoadBalancer về cost và tính năng?',
    'Gateway API giải quyết hạn chế gì của Ingress?',
    'Khi nào dùng headless service với StatefulSet?'
  ],
  tags: ['kubernetes', 'service', 'ingress', 'gateway-api', 'aws']
},
{
  id: 'devops-069',
  topic: 'devops',
  level: 'mid',
  q: 'Hệ thống monitoring gồm những thành phần nào (metrics, logs, traces, alerting, dashboard, on-call) và luồng dữ liệu đi qua từng thành phần?',
  a: `**Tóm tắt:** Monitoring = metrics (số liệu) + logs (sự kiện) + traces (đường đi request) + alerting (cảnh báo) + dashboard (trực quan) + on-call (phản ứng). Luồng: app → agent/collector → storage → query → dashboard/alert → on-call.

### Thành phần
- **Metrics**: số liệu time-series (CPU, RPS, latency p99). Prometheus/Grafana/CloudWatch.
- **Logs**: dòng sự kiện có timestamp, level, context. Fluent Bit → Loki/Elasticsearch/CloudWatch Logs.
- **Traces**: distributed tracing (OpenTelemetry) theo traceId/spanId.
- **Alerting**: rule trên metrics/logs → Alertmanager/PagerDuty.
- **Dashboard**: Grafana panels.
- **On-call**: rotation, escalation, runbook.

### Luồng dữ liệu
App emit metrics (Prometheus scrape / push OTLP) → Prometheus remote_write → storage (Thanos/Mimir) → Grafana query → dashboard.
Logs: app stdout → container runtime → Fluent Bit DaemonSet → parse/label → Loki → Grafana.
Traces: SDK → OTel Collector → Tempo/Jaeger → Grafana.

### Pitfall
- Chỉ có metrics không đủ để root cause; cần logs+traces.
- Alert fatigue: quá nhiều alert → bỏ qua.

> Senior tip: Chuẩn hoá OpenTelemetry để vendor-neutral; correlation id (traceId) xuyên suốt log/metrics/traces.`,
  follow: [
    'RED method và USE method là gì?',
    'Khi nào dùng push vs pull cho metrics?',
    'Làm sao giảm chi phí log retention?'
  ],
  tags: ['monitoring', 'observability', 'metrics', 'logs', 'traces']
},
{
  id: 'devops-070',
  topic: 'devops',
  level: 'senior',
  q: 'Cơ chế thu thập logs và metrics: pull (Prometheus scrape) vs push, agent DaemonSet (Fluent Bit), parse/label, retention và chi phí, cardinality.',
  a: `**Tóm tắt:** Prometheus pull scrape endpoint /metrics; push qua Pushgateway/OTLP cho job ngắn. Fluent Bit DaemonSet tail log file, parse, gắn label, gửi Loki. Cardinality (số combination label) quyết định chi phí và performance.

### Pull vs push
- **Pull**: Prometheus scrape target theo interval; target phải expose endpoint. Dễ phát hiện target down (scrape fail).
- **Push**: app push (Pushgateway cho batch job, OTLP cho OTel). Cần cho job ngắn sống.

### Fluent Bit DaemonSet
- Chạy trên mỗi node, tail /var/log/containers/*.log.
- Parse (JSON/regex), filter, enrich (k8s metadata), output tới Loki/Elasticsearch.
- Buffer và retry khi backend down.

### Retention và chi phí
- Logs: hot 7-14 ngày, cold (S3) 90+ ngày; sampling debug logs.
- Metrics: high-res 15d, downsample 90d+.
- Cardinality: số distinct label combinations. Label cao cardinality (user_id, request_id) → blow-up storage/query.

### Pitfall
- Gắn request_id vào metric label → cardinality explosion.
- Không set retention → chi phí tăng.

> Senior tip: Quy tắc: metric label chỉ cho dimension có bounded values (status code, endpoint normalized). High-cardinality data đưa vào logs/traces, không metrics.`,
  follow: [
    'Làm sao detect cardinality explosion (Prometheus TSDB head)?',
    'Fluent Bit vs Fluentd: khi nào chọn cái nào?',
    'Log sampling ảnh hưởng điều tra sự cố thế nào?'
  ],
  tags: ['logging', 'metrics', 'prometheus', 'fluent-bit', 'cardinality']
},
{
  id: 'devops-071',
  topic: 'devops',
  level: 'senior',
  q: 'Scale app dựa trên yếu tố gì: CPU, RAM (vì sao scale theo RAM với JVM thường sai), RPS, queue lag, custom metrics; HPA/KEDA/Cluster Autoscaler/Karpenter.',
  a: `**Tóm tắt:** Scale nên dựa trên bottleneck thực tế: CPU cho compute, RPS/latency cho web, queue lag cho worker. Scale theo RAM với JVM thường sai vì heap cố định và GC; dùng custom metrics (RPS, lag) với HPA/KEDA, node scale bằng Cluster Autoscaler/Karpenter.

### Vì sao scale theo RAM với JVM sai
- JVM heap size cố định (-Xmx), RAM used ≈ heap + metaspace + off-heap; không tăng theo load ngay.
- GC dọn heap → used RAM dao động; scale theo RAM gây scale không cần thiết hoặc chậm.

### Yếu tố scale
- CPU utilization (HPA target 70%).
- RPS / latency p99 (custom metrics từ Prometheus).
- Queue lag (Kafka/RabbitMQ) cho worker.
- In-flight requests.

### Công cụ
- **HPA**: scale pod theo metrics (CPU/mem/custom/external).
- **KEDA**: event-driven autoscaling (queue lag, cron) scale to zero.
- **Cluster Autoscaler**: thêm node khi pod pending.
- **Karpenter**: provision node nhanh theo pod requirement, spot-friendly.

### Pitfall
- HPA cần requests/limits đúng; nếu requests quá thấp → scale sai.
- Scale out nhưng DB connection pool cạn → bottleneck dời.

> Senior tip: Đo bottleneck end-to-end (LB → app → DB) trước khi chọn metric scale; thường là DB connection hoặc CPU, không phải RAM.`,
  follow: [
    'Karpenter khác Cluster Autoscaler ở điểm nào?'
  ],
  tags: ['autoscaling', 'hpa', 'keda', 'karpenter', 'jvm']
},
{
  id: 'devops-072',
  topic: 'devops',
  level: 'senior',
  q: 'Luồng pipeline CI/CD và downstream: pipeline phức tạp gọi sang repo khác (GitLab multi-project/parent-child, Jenkins upstream-downstream, GitHub Actions repository_dispatch/workflow_call), truyền artifact/version, xử lý khi downstream fail.',
  a: `**Tóm tắt:** Pipeline phức tạp orchestrate nhiều repo: GitLab parent-child/multi-project, Jenkins upstream-downstream, GitHub Actions reusable workflow/repository_dispatch. Truyền version/artifact qua registry và API; downstream fail → retry/rollback/alert.

### Các cơ chế
- **GitLab**: parent-child pipeline (trigger:include), multi-project pipeline (trigger:project), truyền variables qua variables.
- **Jenkins**: build job → upstream/downstream, dùng artifact copy plugin hoặc Nexus/registry.
- **GitHub Actions**: workflow_call (reusable workflow), repository_dispatch (event từ repo khác), workflow_run.

### Truyền artifact/version
- Build image → push registry với tag version (git SHA + semver).
- Downstream pull image theo tag; không copy artifact trực tiếp.
- Truyền metadata qua API/variable (version, commit SHA).

### Xử lý downstream fail
- Retry với backoff; nếu fail → rollback deploy trước đó.
- Thông báo Slack/PagerDuty; block merge.
- Idempotent deploy: chạy lại an toàn.

### Pitfall
- Coupling chặt giữa repos → thay đổi một repo phá pipeline khác.
- Secret sprawl: mỗi repo giữ secret riêng.

> Senior tip: Dùng container registry làm contract giữa repos; version là image tag; pipeline downstream chỉ cần tag, không cần source.`,
  follow: [
    'Khi nào dùng reusable workflow vs repository_dispatch?',
    'Làm sao đảm bảo version consistency giữa nhiều repos?',
    'Rollback khi downstream deploy fail thế nào?'
  ],
  tags: ['cicd', 'pipeline', 'gitlab', 'jenkins', 'github-actions']
},
{
  id: 'devops-073',
  topic: 'devops',
  level: 'mid',
  q: 'Ansible vs Terraform: provisioning vs configuration management, inventory, playbook, idempotency, khi nào dùng cả hai?',
  a: `**Tóm tắt:** Terraform provision hạ tầng (IaC, state) declarative; Ansible configure phần mềm/idempotent (agentless, SSH). Dùng Terraform tạo VM/K8s cluster, Ansible cài package/config app. Kết hợp: Terraform output inventory → Ansible run.

### Khái niệm
- **Provisioning**: tạo tài nguyên (VM, network, DB) → Terraform.
- **Configuration management**: cài đặt/cấu hình phần mềm trên host → Ansible.
- **Inventory**: danh sách host/group cho Ansible (static hoặc dynamic từ Terraform output).
- **Playbook**: YAML mô tả task theo thứ tự, module idempotent.
- **Idempotency**: chạy lại không thay đổi nếu đã đúng trạng thái.

### Khi nào dùng cả hai
- Terraform tạo EC2 + security group + RDS → output IP → Ansible playbook cài Java, deploy app, config systemd.
- Terraform cho infra lifecycle; Ansible cho app config và patching.

### Pitfall
- Ansible không quản lý state hạ tầng → không biết drift; Terraform state cần remote backend + locking.
- SSH key management và become (sudo) cần cẩn thận.

> Senior tip: Tách infra (Terraform) và config (Ansible); dùng dynamic inventory để không hardcode IP; kiểm tra idempotency bằng chạy playbook 2 lần.`,
  follow: [
    'Terraform state locking hoạt động thế nào (DynamoDB)?',
    'Ansible idempotency dựa trên module, không phải task viết tay — giải thích.',
    'Khi nào dùng Ansible thay vì cloud-init/user-data?'
  ],
  tags: ['ansible', 'terraform', 'iac', 'configuration-management']
},
{
  id: 'devops-074',
  topic: 'devops',
  level: 'lead',
  q: '(lead) Load test một app trước go-live từ góc DevOps: môi trường, công cụ, chỉ số, tìm bottleneck ở tầng hạ tầng (LB, DB connection, node).',
  a: `**Tóm tắt:** Load test trước go-live: môi trường giống production (scale nhỏ hơn nhưng topology giống), công cụ k6/JMeter/Gatling, chỉ số latency p95/p99, error rate, throughput, resource; tìm bottleneck ở LB connection, DB pool, node CPU/mem, GC.

### Môi trường
- Staging mirror production: cùng instance type, DB size tỷ lệ, network.
- Dữ liệu test realistic (seed DB).
- Warm-up JVM/GC trước đo.

### Công cụ
- k6, JMeter, Gatling, wrk; phân phối load từ nhiều region.
- Chaos: inject latency to dependency.

### Chỉ số
- Throughput (RPS), latency p50/p95/p99, error rate.
- Resource: CPU/mem/node, DB connections/queries, GC pause, thread pool.
- Saturation: queue depth, connection pool usage.

### Tìm bottleneck hạ tầng
- LB: connection limit, TLS handshake cost, target health.
- DB: connection pool exhausted, slow query, lock contention.
- Node: CPU throttling, memory pressure, disk I/O, network bandwidth.
- App: thread pool, GC, connection leak.

### Pitfall
- Test từ 1 máy → network bottleneck giả.
- Không warm-up → cold start méo số liệu.
- Chỉ đo average latency → che p99.

> Senior tip: Định nghĩa SLO trước (p99 < X ms, error < 0.1%) và dừng test khi đạt; lưu baseline để so sánh sau deploy; chạy soak test (nhiều giờ) để phát hiện memory leak.`,
  follow: [
    'Khác nhau giữa load test, stress test, soak test, spike test?',
    'Làm sao load test an toàn trên production (canary load)?',
    'Khi p99 cao nhưng CPU thấp, bạn điều tra theo thứ tự nào?'
  ],
  tags: ['load-testing', 'performance', 'sre', 'capacity-planning', 'leadership']
},
{
  id: 'devops-075',
  topic: 'devops',
  level: 'senior',
  q: 'Ở một ngân hàng đang chuyển lên cloud (AWS), "DevOps" thường được chia thành nhiều vai: SA (Solution Architect), DevOps/Platform, Infra/System, SRE, Cloud Security. Mỗi vai làm gì, phỏng vấn thường hỏi gì, và một dev Java 4 năm nên nhắm vai nào nếu muốn chuyển hướng?',
  a: `**Tóm tắt:** Trong ngân hàng, "làm DevOps" không phải một vai duy nhất: **SA (Solution Architect - kiến trúc sư giải pháp)** thiết kế bức tranh tổng thể, **DevOps/Platform** xây đường ống CI/CD và nền tảng chạy ứng dụng (K8s, registry), **Infra/System** vận hành máy chủ/mạng/hệ điều hành, **SRE (Site Reliability Engineering - kỹ sư độ tin cậy)** giữ hệ thống sống ổn định bằng SLO/quan sát/sự cố, **Cloud Security** kiểm soát bảo mật trên cloud (IAM, mạng, tuân thủ). Dev Java muốn chuyển hướng thường đi tự nhiên nhất sang **DevOps/Platform** hoặc **SRE** vì tận dụng được hiểu biết về ứng dụng, build, và cách hệ thống hỏng.

### Hiểu nhanh
Hãy hình dung một ngân hàng như một tòa nhà giao dịch lớn. **SA** là kiến trúc sư vẽ bản thiết kế cả tòa nhà (phòng nào nối phòng nào, luồng khách đi ra sao). **Infra/System** là đội xây và bảo trì móng, điện, nước, thang máy (máy chủ, mạng, OS). **DevOps/Platform** là đội lắp "đường ống" để mọi phòng nhận được đồ đúng giờ (CI/CD, nền tảng K8s, registry). **SRE** là đội trực ca đảm bảo tòa nhà không sập giờ cao điểm, có camera và chuông báo cháy (giám sát, SLO, ứng cứu sự cố). **Cloud Security** là đội an ninh kiểm soát thẻ ra vào, camera, két sắt (IAM, mạng, mã hóa, tuân thủ). Mỗi vai nhìn cùng một hệ thống nhưng ở một "lớp" khác nhau.

### Thuật ngữ (giải thích lần đầu)
- **SA - Solution Architect (kiến trúc sư giải pháp)**: người thiết kế cách các thành phần (app, DB, queue, cloud service) ghép lại để giải quyết một bài toán nghiệp vụ, cân bằng chi phí/độ tin cậy/bảo mật/tuân thủ.
- **Platform (nền tảng)**: bộ công cụ và hạ tầng dùng chung mà các team phát triển "đứng lên" để build và chạy app (ví dụ: cụm Kubernetes, registry lưu image, pipeline CI/CD mẫu) — thay vì mỗi team tự dựng mọi thứ.
- **SRE - Site Reliability Engineering (kỹ sư độ tin cậy)**: vai trò bắt nguồn từ Google, dùng cách tiếp cận kỹ thuật phần mềm để vận hành: đặt mục tiêu độ tin cậy (SLO), đo lường, tự động hóa, và xử lý sự cố có hệ thống.
- **SLO - Service Level Objective (mục tiêu mức dịch vụ)**: con số cam kết, ví dụ "99.9% request thành công mỗi tháng" hoặc "p99 latency < 300ms". SLO giúp quyết định có được deploy tính năng mới hay phải ưu tiên độ ổn định.
- **IAM - Identity and Access Management (quản lý danh tính và quyền truy cập)**: hệ thống kiểm soát "ai được làm gì" trên cloud (user, role, policy).
- **Tuân thủ (compliance)**: đáp ứng các quy định bắt buộc (ở ngân hàng VN thường liên quan yêu cầu của NHNN, kiểm toán, quy định lưu trữ/ bảo mật dữ liệu).

### So sánh các vai
| Vai | Làm gì hằng ngày | Công cụ/kiến thức hay gặp | Phỏng vấn thường hỏi | Góc nhìn chính |
|---|---|---|---|---|
| SA (Solution Architect) | Thiết kế kiến trúc cho một bài toán (ví dụ: mở thẻ online), chọn dịch vụ AWS, vẽ luồng tích hợp, review thiết kế | AWS (VPC, EKS, RDS, SQS...), sơ đồ kiến trúc, trade-off, bảo mật, chi phí, DR | "Thiết kế hệ thống chuyển tiền/X triệu user", "Chọn RDS hay tự cài DB?", "Multi-AZ/DR ra sao?" | Toàn cảnh, trade-off |
| DevOps / Platform | Xây và vận hành CI/CD, cụm K8s, Helm chart chuẩn, registry, template project; hỗ trợ team app onboard | GitLab CI/GitHub Actions, Docker, Kubernetes, Helm, Argo CD, Terraform (mức dùng), Harbor | "Thiết kế pipeline CI/CD", "Pod CrashLoopBackOff xử lý thế nào?", "Helm/Terraform dùng ra sao?" | Đường ống, nền tảng |
| Infra / System | Quản lý VM, mạng, DNS, load balancer, hệ điều hành Linux, storage, backup/restore | Linux, networking (TCP/IP, routing, firewall), VMware/on-prem, một phần cloud (EC2, VPC) | "Debug sự cố mạng/DNS", "Linux: process, disk, permission", "Backup/restore thế nào?" | Hạ tầng, hệ điều hành |
| SRE | Định nghĩa SLO/SLI, dashboard/alert, on-call, xử lý sự cố (incident), postmortem, tự động hóa vận hành, capacity | Prometheus/Grafana, logging, tracing, runbook, toil automation, đôi khi K8s | "Thiết kế alert theo SLO", "Xử lý incident production", "Latency tăng đột ngột điều tra thế nào?" | Độ tin cậy, đo lường |
| Cloud Security | Thiết kế IAM least privilege, network segmentation, mã hóa, quét lỗ hổng, giám sát bảo mật, đáp ứng tuân thủ | IAM, KMS, Security Groups/NACL/WAF, GuardDuty/CloudTrail, chính sách tuân thủ | "Thiết kế IAM an toàn", "Cách cô lập workload", "Xử lý secret/credential", "Audit và tuân thủ" | Rủi ro, tuân thủ |

### Dev Java 4 năm nên nhắm vai nào?
- **DevOps/Platform (phù hợp tự nhiên nhất)**: bạn đã quen build (Maven/Gradle), dependency, cách app Spring Boot chạy, log, cấu hình, healthcheck. Bước tiếp là học đóng gói (Docker), deploy (K8s), và tự động hóa (pipeline). Bạn nói được "vì sao app cần graceful shutdown/probe" vì bạn hiểu app.
- **SRE (phù hợp nếu thích điều tra sự cố)**: tận dụng hiểu biết về JVM, thread, DB connection, latency để tìm gốc rễ khi hệ thống chậm/lỗi. Cần bổ sung tư duy đo lường (SLO, metric) và quy trình incident.
- **SA**: thường cần kinh nghiệm rộng hơn (nhiều hệ thống, tích hợp, bảo mật, chi phí) và kinh nghiệm giao tiếp với business; có thể là đích đến sau vài năm làm Platform/SRE.
- **Infra/System hoặc Cloud Security**: chuyển được nhưng khoảng cách kiến thức lớn hơn (mạng chuyên sâu, Linux hệ thống, hoặc bảo mật/tuân thủ). Hợp nếu bạn thật sự thích mảng đó.

~~~text
Góc nhìn (từ gần app → gần hạ tầng/bảo mật):

  [Dev Java] --hiểu app--> [DevOps/Platform] --độ tin cậy--> [SRE]
       \\                         |                              |
        \\                        v                              v
         '------------------> [SA] (toàn cảnh)            [On-call/Incident]
                                  |
                 [Infra/System] --+-- [Cloud Security]
                    (máy/mạng/OS)      (quyền/tuân thủ)
~~~

### Ví dụ đời thực (ngân hàng)
Một team ra mắt tính năng chuyển tiền nhanh: **SA** quyết định dùng EKS + RDS Multi-AZ, tách service, luồng gọi qua API Gateway. **Platform** cung cấp Helm chart chuẩn, pipeline build-scan-deploy, namespace và quota. **Infra** đảm bảo kết nối mạng tới core banking on-prem ổn định. **SRE** đặt SLO p99 < 500ms, dựng dashboard/alert, viết runbook và trực canary. **Cloud Security** review IAM role của Pod (IRSA), policy S3/KMS, và checklist tuân thủ trước go-live. Một sự cố latency thường cần Platform + SRE + (đôi khi) Infra cùng nhìn.

### Pitfall (lỗi hay gặp)
- **Nhầm tên vai**: "DevOps" trong JD ngân hàng đôi khi thực chất là Infra vận hành thủ công, hoặc ngược lại là Platform thuần. Cách tránh: hỏi JD nói rõ làm CI/CD/K8s hay quản VM/mạng, có trực on-call không, tỉ lệ "xây" vs "vận hành".
- **Học công cụ rời rạc mà thiếu nền tảng**: biết gõ lệnh kubectl nhưng không hiểu Pod/network/DNS → kẹt ở câu debug. Cách tránh: học theo lớp (Linux + mạng → container → K8s → CI/CD → quan sát).
- **Dev chuyển vai nhưng bỏ quên lợi thế**: không khai thác việc hiểu app (thread pool, GC, DB pool) — đây là điểm mạnh khi phỏng vấn Platform/SRE.

### Câu trả lời phỏng vấn nên nói thế nào
"Em hiểu ở ngân hàng DevOps thường tách vai: SA thiết kế kiến trúc tổng thể và trade-off, Platform/DevOps xây CI/CD và nền tảng K8s, Infra lo máy chủ/mạng/Linux, SRE lo SLO, giám sát và xử lý sự cố, còn Cloud Security lo IAM, cô lập mạng và tuân thủ. Với nền tảng dev Java 4 năm, em nhắm vai Platform hoặc SRE vì em hiểu cách ứng dụng build/chạy/hỏng (probe, graceful shutdown, connection pool, JVM), và em đang bổ sung Linux, container/K8s, pipeline và observability để đóng được phần hạ tầng quanh ứng dụng."

> Senior tip: Khi phỏng vấn bất kỳ vai "DevOps" nào ở ngân hàng, hãy hỏi ba điều: (1) bạn sẽ **xây nền tảng** hay **vận hành hệ thống có sẵn**, (2) có **on-call** và quy trình incident không, (3) ranh giới với Security/Infra ở đâu. Câu trả lời cho thấy vai thật sự, và giúp bạn không nhận nhầm một việc thuần vận hành khi mục tiêu là Platform/SRE.`,
  follow: ['Sự khác nhau giữa SRE và DevOps truyền thống là gì? (gợi ý: SLO, error budget, toil)', 'Một Platform Engineer cần hiểu gì về ứng dụng Java để hỗ trợ team dev tốt (probe, resource, JVM)?', 'Khi SA thiết kế hệ thống lên AWS cho ngân hàng, những ràng buộc tuân thủ/bảo mật nào thường ảnh hưởng quyết kiến trúc?'],
  tags: ['devops-roles', 'SA', 'SRE', 'platform', 'cloud-security', 'career'],
  refs: [
    { type: 'doc', title: 'Site Reliability Engineering (Google SRE book)', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' }
  ]
},
{
  id: 'devops-076',
  topic: 'devops',
  level: 'senior',
  q: 'Case thực tế: deploy bản mới lên K8s, Pod rơi vào CrashLoopBackOff nhưng chỉ ở 1/3 node (2 node chạy bình thường, 1 node Pod cứ restart). Bạn điều tra từng bước thế nào (describe, events, logs --previous), và "node khác nhau ở đâu" là manh mối gì?',
  a: `**Tóm tắt:** CrashLoopBackOff chỉ trên 1/3 node gần như luôn có nguyên nhân **gắn với node đó**, không chỉ với image/cấu hình chung. Quy trình: (1) xác định Pod nào trên node nào ({{kubectl get pod -o wide}}), (2) {{describe}} để đọc Events/Last State/Exit Code, (3) {{logs --previous}} lấy stack trace lần chết trước, (4) so sánh node lỗi với node khỏe (label/taint, dung lượng đĩa/inode, phiên bản runtime, kernel, thời gian, DNS, mount/hostPath, network tới dependency). Khác biệt thường gặp: node **DiskPressure/PIDPressure**, image cache cũ/khác kiến trúc hiếm, hostPath/permission khác, clock lệch, hoặc node không kết nối được DB/registry nội bộ.

### Bối cảnh thật
Ngân hàng deploy bản {{payment-api:1.24.0}} (rolling update) lên cụm 3 node worker. 2 node: Pod {{1/1 Running}}. Node {{worker-3}}: Pod vào {{CrashLoopBackOff}}, {{RESTARTS}} tăng. Vì Deployment phân bổ Pod, chỉ replica rơi vào {{worker-3}} mới lỗi → triệu chứng "1/3 node". Ảnh hưởng: capacity giảm 1/3, nếu tiếp tục rollout có thể làm xấu thêm.

### Thuật ngữ (giải thích lần đầu)
- **CrashLoopBackOff**: container khởi động rồi thoát (chết), kubelet khởi động lại nhưng **chờ lùi dần** (back-off: 10s, 20s, 40s… tối đa 5 phút) giữa các lần. "Loop" = lặp; "back-off" = lùi lại/chờ lâu hơn.
- **Node (nút)**: một máy (VM hoặc vật lý) trong cụm Kubernetes nơi Pod thực sự chạy. Mỗi node có kubelet, container runtime, đĩa, mạng, thời gian hệ thống riêng.
- **kubelet**: "người quản gia" trên mỗi node, nhận lệnh từ control plane để chạy/giám sát container.
- **Taint (vết bẩn)**: nhãn trên node để "xua" Pod không phù hợp; **toleration** là "giấy phép" Pod mang theo để được xếp lên node có taint.
- **hostPath**: gắn một thư mục của chính node vào container — tiện nhưng làm Pod phụ thuộc vào trạng thái node (mỗi node có nội dung/permission khác nhau).
- **DiskPressure / inode**: node sắp hết dung lượng đĩa (DiskPressure) hoặc hết số lượng mục file (inode) — cả hai đều làm tạo/ghi file của container thất bại.

### Điều tra từng bước

~~~text
B1. Định vị Pod trên node nào?
    kubectl get pod -n pay -l app=payment-api -o wide
    -> thấy pod-A (worker-1, Running), pod-B (worker-2, Running), pod-C (worker-3, CrashLoopBackOff)

B2. Đọc "bệnh án" Pod lỗi
    kubectl describe pod pod-C -n pay
    -> xem: Node, Events (cuối), Last State/Reason/Exit Code, Conditions, Volume mounts

B3. Đọc log lần chết TRƯỚC (rất quan trọng)
    kubectl logs pod-C -n pay --previous --tail=200
    -> stack trace/lỗi của container vừa thoát (log hiện tại thường gần rỗng vì container mới vừa lên)

B4. So sánh node lỗi vs node khỏe
    kubectl describe node worker-3 | grep -A5 Conditions
    kubectl get node --show-labels
    -> DiskPressure? MemoryPressure? taint? kernel/runtime version? zone?

B5. Khoanh vùng: lỗi do APP hay do NODE?
    - Cordon worker-3, xóa pod-C -> scheduler tạo pod mới trên worker-1/2: nếu CHẠY OK => lỗi gắn node-3
    - Scale lên, ép 1 Pod test lên worker-3 (nodeSelector) để tái hiện
~~~

### Lệnh và bằng chứng cần nhìn
~~~bash
# B1: pod nào, node nào, restart mấy lần
kubectl get pod -n pay -o wide

# B2: sự kiện + trạng thái lần chết
kubectl describe pod pod-C -n pay
# đọc: Last State: Terminated, Reason/Exit Code; Events: Back-off restarting...

# B3: log của lần chạy vừa chết (không có --previous sẽ thấy log rỗng)
kubectl logs pod-C -n pay --previous --tail=200

# B4: tình trạng node
kubectl describe node worker-3   # Conditions, Allocatable, Taints, Images
kubectl get events -n pay --sort-by=.lastTimestamp | tail -30
~~~

**Đọc exit code (manh mối nhanh):** {{1}} = app tự thoát (exception, thiếu config). {{137}} = 128+9 (SIGKILL), thường OOMKilled — kiểm tra Reason. {{139}} = 128+11 (SIGSEGV) — crash native (thư viện JNI, lỗi hiếm). {{0}} nhưng vẫn restart = process thoát sạch nhưng liveness/probe hoặc entrypoint sai.

### "Node khác nhau ở đâu" — các nguyên nhân hay gặp
| Khác biệt trên node lỗi | Triệu chứng / bằng chứng | Cách xác minh |
|---|---|---|
| **DiskPressure / hết inode** | Pod crash khi ghi log/temp; Event evicted hoặc tạo file thất bại; {{kubectl describe node}} có {{DiskPressure=True}} | {{describe node}} (Conditions), trên node: {{df -h}}, {{df -i}} |
| **Image khác/thiếu trên node** | Nếu dùng tag {{latest}} hoặc {{imagePullPolicy: IfNotPresent}}, node-3 có thể giữ image cũ hỏng cache; hoặc pull fail gián đoạn (nhưng thường ra ImagePullBackOff, không phải CrashLoopBackOff) | {{describe node}} phần Images; so digest image |
| **hostPath / quyền file khác** | App đọc/ghi {{hostPath}} (config, cert, socket) mà node-3 thiếu file hoặc sai permission | {{describe pod}} xem Volume; kiểm tra đường dẫn trên node (qua ops/SSM) |
| **Mạng từ node-3 tới dependency** | App khởi động kết nối DB/Redis/Kafka/core on-prem; chỉ subnet/route/firewall của node-3 bị chặn → timeout → app fail fast thoát | {{logs --previous}} thấy timeout kết nối; test {{nc/telnet}} từ node-3; so security group/subnet |
| **Đồng hồ lệch (clock skew)** | Gọi TLS/JWT/OAuth thất bại vì cert/token "chưa hiệu lực/đã hết hạn" theo giờ node-3; app thoát lúc init | Log lỗi xác thực/thời gian; {{chronyc tracking}} hoặc {{timedatectl}} trên node |
| **Tài nguyên/node pressure cục bộ** | Node MemoryPressure hoặc cgroup khác; ít gặp nếu request/limit chuẩn, nhưng custom runtime/kernel khác có thể ảnh hưởng | {{describe node}} Conditions, {{kubectl top node}} |
| **Taint/label dẫn tới cấu hình khác** | Hiếm: nếu Pod có toleration đặc biệt hoặc DaemonSet/sidecar chỉ chạy trên node-3 gây xung đột | {{kubectl get node --show-labels}}, {{describe node}} taints |

~~~seq
title: Luồng điều tra CrashLoopBackOff chỉ trên 1/3 node
actors: DevOps | API K8s | Node-3 (lỗi)
DevOps -> API K8s: kubectl get pod -o wide
API K8s --> DevOps: pod-C trên Node-3, CrashLoopBackOff
DevOps -> API K8s: kubectl describe pod pod-C
API K8s --> DevOps: Exit Code, Events, Last State
DevOps -> Node-3 (lỗi): kubectl logs --previous pod-C
Node-3 (lỗi) --> DevOps: stack trace lần chết
DevOps -> API K8s: kubectl describe node Node-3
API K8s --> DevOps: Conditions, Taints, Allocatable
DevOps -> DevOps: so sánh Node-3 vs Node-1/2, khoanh vùng
~~~

### Pitfall (lỗi hay gặp)
- **Chỉ nhìn image/cấu hình chung**: "2 node chạy được thì không thể lỗi config". Sai — config có thể đúng nhưng node-3 thiếu file hostPath, hết đĩa, hoặc không tới được DB.
- **Quên {{--previous}}**: thấy log gần rỗng, kết luận "không có lỗi". Lỗi nằm ở container đã chết.
- **Xóa Pod cho "tự khỏi"**: scheduler có thể lại xếp Pod mới lên chính node-3 → lỗi lặp lại. Hãy {{cordon}} node-3 trước khi thay Pod để cô lập.
- **Nhầm với Pending**: nếu Pod {{Pending}} chỉ trên node-3 thì là vấn đề lập lịch (taint/toleration/resource); {{CrashLoopBackOff}} là container đã chạy rồi mới chết.

### Trả lời phỏng vấn (từng bước, ngắn gọn khi nói)
"Vì chỉ 1/3 node lỗi, em nghi nguyên nhân gắn với node. Em {{get pod -o wide}} để xác định Pod trên node nào, {{describe pod}} đọc Events, Last State và Exit Code, rồi {{logs --previous}} lấy stack trace lần chết trước. Sau đó em so sánh node lỗi với node khỏe: {{describe node}} xem DiskPressure/taint/allocatable, kiểm tra khác biệt về mạng tới DB/Redis, hostPath/permission, clock, image digest. Để xác nhận, em cordon node lỗi và để Pod chạy lại trên node khác: nếu hết lỗi thì khoanh vùng hạ tầng/node; nếu vẫn lỗi thì quay lại phân tích app/config. Em không xóa Pod mù mờ vì scheduler có thể đặt lại đúng node hỏng."

> Senior tip: Trong ngân hàng, lỗi "chỉ 1 node" hay gặp sau thay đổi hạ tầng im lặng: node mới gia nhập cụm thiếu route tới DB nội bộ, cert CA nội bộ chưa cài, hoặc đồng hồ chưa sync NTP. Hãy giữ baseline node (cùng AMI/image, cùng cấu hình cloud-init) và dùng {{kubectl describe node}} + kiểm tra điều kiện {{Ready/DiskPressure}} trong runbook; cordon node nghi ngờ ngay để chặn ảnh hưởng lan rộng trước khi đào sâu.`,
  follow: ['Làm sao cô lập nhanh: phân biệt lỗi do image/config (mọi node) với lỗi do node (chỉ 1 node)?', 'Nếu {{logs --previous}} trống và Exit Code 137, bạn kết luận gì và kiểm tra tiếp ở đâu?', 'Tại sao dùng tag image bất biến (digest/commit SHA) giúp tránh sự cố "node giữ image cũ"?'],
  tags: ['Kubernetes', 'CrashLoopBackOff', 'troubleshooting', 'node', 'incident'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Debug Pods', url: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/' }
  ]
},
{
  id: 'devops-077',
  topic: 'devops',
  level: 'senior',
  q: 'Case thực tế: ngân hàng dùng blue-green deploy nhưng hai môi trường (blue/green) dùng chung một database. Bạn xử lý migration schema tương thích ngược (expand/contract) thế nào, chuyển traffic ra sao, và rollback khi có lỗi?',
  a: `**Tóm tắt:** Blue-green (hai môi trường song song, chuyển traffic một lần) chỉ "dễ rollback app" khi **schema DB tương thích ngược (backward compatible)** — vì DB dùng chung, bản cũ và bản mới phải cùng chạy được trên cùng schema trong lúc chuyển. Giải pháp là **expand/contract**: (1) *expand* thêm cột/bảng mới theo kiểu an toàn, giữ cột cũ, code mới ghi cả hai/đọc linh hoạt; (2) deploy green và chuyển traffic; (3) khi ổn định, *contract* mới bỏ cột/cấu trúc cũ. Rollback app thì chuyển traffic về blue — chỉ an toàn nếu bước expand chưa phá tương thích. Migration phá hủy (đổi tên/xóa cột, đổi kiểu không tương thích) phải tách ra sau.

### Bối cảnh thật
Ngân hàng chạy {{order-service}}: **blue** = bản 1.8 (đang phục vụ), **green** = bản 1.9 (mới). Cả hai trỏ vào **một cụm Oracle/RDS dùng chung** (DB tách đôi rất đắt và khó đồng bộ giao dịch ngân hàng). Bản 1.9 cần đổi {{phone}} (một cột) thành {{mobile_phone}} và thêm kiểm tra mới. Nếu migrate "đổi tên cột" rồi mới deploy: trong khoảnh khắc blue vẫn đọc {{phone}} → lỗi. Nếu deploy green trước khi có cột mới → lỗi. Đây là xung đột blue-green + shared DB.

### Thuật ngữ (giải thích lần đầu)
- **Blue-green deploy**: duy trì hai môi trường giống nhau (blue = đang live, green = bản mới). Deploy xong green, kiểm tra, rồi **chuyển 100% traffic** sang green. Rollback = chuyển traffic về blue. (Giống có hai sân khấu, khán giả ngồi bên này, chuẩn bị xong thì chuyển khán giả sang bên kia.)
- **Shared database (DB dùng chung)**: cả blue và green cùng đọc/ghi một DB. Ưu: dữ liệu nhất quán, không cần đồng bộ. Nhược: schema trở thành "điểm nghẽn tương thích" giữa hai phiên bản app.
- **Backward compatible - tương thích ngược (schema)**: schema mới vẫn cho **code phiên bản cũ** chạy đúng (cũ đọc/ghi được). **Forward compatible - tương thích xuôi**: code cũ ghi dữ liệu mà code mới hiểu được.
- **Expand/contract (mở rộng/thu hẹp)**: kỹ thuật migration nhiều bước: *expand* thêm thứ mới mà không phá cái cũ; chạy song song; *contract* bỏ cái cũ khi không còn ai dùng.
- **Cutover (chuyển lưu lượng)**: thời điểm đổi router/load balancer/DNS để traffic đi sang môi trường mới.

### Cơ chế expand/contract (ví dụ đổi {{phone}} → {{mobile_phone}})
~~~text
Trạng thái DB dùng chung:  [ BLUE v1.8 ] <--đọc/ghi--> ( DB ) <--đọc/ghi--> [ GREEN v1.9 ]

BƯỚC 1 - EXPAND (migration an toàn, chạy TRƯỚC khi deploy green)
  DB:  THÊM cột mobile_phone (nullable), GIỮ cột phone
       (không xóa, không đổi tên, không NOT NULL ngay)
  App v1.9 (code): ghi CẢ phone và mobile_phone; đọc mobile_phone ưu tiên, fallback phone
  -> v1.8 (blue) vẫn chạy bình thường vì cột phone còn nguyên.

BƯỚC 2 - DEPLOY GREEN + CHUYỂN TRAFFIC
  Deploy v1.9 lên green, smoke test nội bộ (chưa nhận traffic thật).
  Chuyển traffic: blue -> green (qua LB/DNS/Ingress weight/service selector).
  Theo dõi metric (error rate, latency, nghiệp vụ). Blue vẫn chạy nóng để rollback.

BƯỚC 3 - ỔN ĐỊNH + BACKFILL (tùy chọn)
  Chạy job nền copy dữ liệu phone -> mobile_phone cho bản ghi cũ (backfill), theo lô, có throttle.

BƯỚC 4 - CONTRACT (chỉ khi CHẮC CHẮN không rollback về v1.8)
  Bỏ code đọc/ghi phone (deploy v1.10 hoặc dọn dẹp), rồi migration: đặt NOT NULL/default nếu cần,
  cuối cùng mới DROP cột phone. Bước này KHÔNG tương thích ngược với v1.8.
~~~

~~~seq
title: Blue-green với shared DB (expand/contract)
actors: User | LB | Blue v1.8 | Green v1.9 | DB (shared)
User -> LB: request
LB -> Blue v1.8: traffic 100% (ban đầu)
Blue v1.8 -> DB (shared): đọc/ghi cột phone
note Blue v1.8..Green v1.9: EXPAND: thêm mobile_phone, giữ phone
LB -> Green v1.9: smoke test nội bộ
LB -> Green v1.9: chuyển 100% traffic
Green v1.9 -> DB (shared): ghi cả phone + mobile_phone
Green v1.9 --> User: OK
note LB..Blue v1.8: Lỗi? rollback = chuyển traffic về Blue
~~~

### Quy tắc migration an toàn (tương thích ngược)
| Thay đổi | An toàn với blue-green + shared DB? | Cách làm |
|---|---|---|
| Thêm cột nullable / có default | Có (expand) | Thêm trước deploy; code mới dùng, code cũ bỏ qua |
| Thêm bảng/index mới | Có | Thêm trước; lưu ý lock khi tạo index trên bảng lớn ({{ONLINE}} nếu DB hỗ trợ) |
| Đổi tên / xóa cột | **Không** (phá v1.8) | Expand (thêm cột mới, ghi kép) → contract sau khi bỏ hẳn v1.8 |
| Đổi kiểu dữ liệu không tương thích | **Không** | Thêm cột kiểu mới, backfill, chuyển code, rồi bỏ cột cũ |
| Thêm NOT NULL không default | **Không** ngay | Thêm nullable → backfill → mới đặt NOT NULL |

### Chuyển traffic và rollback
- **Chuyển traffic**: đổi đích ở Load Balancer / Ingress / Service selector / DNS (ưu tiên cơ chế chuyển nhanh, kiểm soát được; DNS phụ thuộc TTL nên chậm hơn). Kiểm tra green bằng smoke test + healthcheck trước khi nhận traffic thật.
- **Tiêu chí go/no-go**: error rate, p99 latency, lỗi nghiệp vụ, checksum giao dịch mẫu — quan sát một cửa sổ (ví dụ 15-30 phút) trước khi "chốt".
- **Rollback app**: chuyển traffic về blue. **Chỉ an toàn nếu** schema đang ở trạng thái tương thích ngược (đã expand, chưa contract). Vì thế: tuyệt đối không chạy bước contract trong cùng cửa sổ deploy; contract là thay đổi riêng, sau vài ngày/tuần ổn định.
- **Rollback DB**: migration expand (thêm cột nullable) thường không cần rollback; nếu bắt buộc phải hoàn tác, dùng migration ngược có kiểm soát — nhưng với dữ liệu đã ghi ở cột mới, cần kế hoạch hợp nhất.

### Pitfall (lỗi hay gặp)
- **Chạy migration phá hủy rồi mới chuyển traffic**: blue chết ngay khi vẫn còn nhận request, hoặc green lỗi nửa chừng → outage. Cách tránh: tách expand (trước) và contract (sau, riêng).
- **Nghĩ "blue-green rollback dễ" mà quên shared DB**: rollback app được, nhưng dữ liệu green đã ghi theo schema mới — nếu contract đã chạy hoặc code cũ không hiểu dữ liệu mới, rollback thất bại. Cách tránh: contract chỉ sau khi hết cửa sổ rollback.
- **Tạo index trên bảng lớn gây lock**: migration "nhỏ" nhưng chặn ghi, làm nghẽn cả blue lẫn green. Cách tránh: dùng tùy chọn tạo index online/concurrent nếu DB hỗ trợ, chạy ngoài giờ cao điểm, đo trên dữ liệu thật.
- **Backfill toàn bộ một lúc**: khóa bảng/IO cao. Cách tránh: backfill theo lô (batch), giới hạn tốc độ, chạy idempotent (chạy lại không hỏng).

### Trả lời phỏng vấn
"Với blue-green dùng chung DB, em tách migration theo expand/contract: bước expand thêm cấu trúc mới tương thích ngược (ví dụ thêm cột nullable, giữ cột cũ), code bản mới ghi kép/đọc linh hoạt, nên bản cũ vẫn chạy được. Em deploy green, smoke test, rồi chuyển traffic qua load balancer và theo dõi error/latency/nghiệp vụ; blue giữ nóng để rollback bằng cách chuyển traffic về. Chỉ khi ổn định và hết nhu cầu rollback em mới chạy contract để bỏ cấu trúc cũ — vì contract phá tương thích ngược. Điểm mấu chốt: blue-green rollback app chỉ an toàn khi schema chưa bị contract."

> Senior tip: Ở ngân hàng, hãy gắn mỗi bước expand/contract với một thay đổi có mã và cửa sổ phê duyệt riêng, và **cấm contract trong cùng đợt deploy**. Hai thứ hay bị quên nhất: (1) job backfill phải idempotent và giới hạn tốc độ để không làm nghẽn DB dùng chung, (2) tiêu chí "hết cửa sổ rollback" (ví dụ sau 3-5 ngày không sự cố) phải được chốt bằng văn bản trước khi ai đó chạy DROP cột.`,
  follow: ['Nếu buộc phải đổi kiểu cột không tương thích trên bảng hàng trăm triệu dòng, bạn lên kế hoạch từng bước thế nào để không downtime?', 'So sánh blue-green và canary khi DB dùng chung: cái nào giảm rủi ro schema tốt hơn?', 'Làm sao đảm bảo code bản mới ghi "kép" (dual-write) không tạo dữ liệu mâu thuẫn giữa cột cũ và cột mới?'],
  tags: ['blue-green', 'schema-migration', 'expand-contract', 'rollback', 'database']
},
{
  id: 'devops-078',
  topic: 'devops',
  level: 'senior',
  q: 'Case thực tế: sau khi migrate ứng dụng từ on-prem (trung tâm dữ liệu tại chỗ) lên AWS, người dùng phản ánh latency (độ trễ) tăng gấp 3. Bạn liệt kê các nguyên nhân thường gặp (gọi chéo về on-prem qua VPN, DNS, NAT Gateway, cross-AZ, connection pool) và quy trình tìm ra nguyên nhân gốc?',
  a: `**Tóm tắt:** Latency tăng gấp 3 sau migrate thường đến từ **đường đi của request dài ra hoặc thêm chặng mạng mới**, không phải vì "AWS chậm". Nguyên nhân hay gặp: app trên AWS vẫn gọi chéo dịch vụ/DB còn ở on-prem qua **VPN/Direct Connect** (thêm hàng chục ms mỗi hop), **DNS** resolve chậm hoặc trỏ nhầm về on-prem, đi qua **NAT Gateway** thừa, **cross-AZ** (traffic đi chéo zone) cộng dồn, và **connection pool** bị cấu hình sai cho độ trễ mới (pool nhỏ + latency cao = chờ connection). Cách tìm: đo phân rã latency theo từng chặng (tracing/metric), so sánh đường đi trước-sau migrate, và kiểm tra từng giả thuyết bằng số liệu.

### Bối cảnh thật
{{loan-service}} (Spring Boot) chuyển từ VM on-prem lên EKS (AWS). Trước migrate: p95 = 120ms. Sau migrate: p95 = 360ms (gấp 3). Chức năng không đổi, code không đổi — vậy vấn đề gần như chắc nằm ở **hạ tầng/mạng/cấu hình kết nối** phát sinh từ vị trí mới.

### Thuật ngữ (giải thích lần đầu)
- **On-prem / on-premise (tại chỗ)**: hệ thống chạy trên máy chủ trong trung tâm dữ liệu của công ty (không phải cloud).
- **Latency (độ trễ)**: thời gian từ lúc gửi request đến lúc nhận phản hồi. {{p95}} = 95% request nhanh hơn mức này (bỏ qua 5% chậm bất thường) — dùng p95/p99 thay vì trung bình vì trung bình che mất request chậm.
- **VPN (Virtual Private Network) / Site-to-Site VPN**: đường hầm mã hóa nối mạng on-prem với VPC trên AWS qua Internet công cộng — tiện nhưng thêm độ trễ và băng thông giới hạn. **Direct Connect (DX)** là đường dây riêng, ổn định hơn.
- **AZ - Availability Zone (vùng sẵn sàng)**: một (hoặc nhóm) trung tâm dữ liệu riêng biệt trong một AWS Region. Cross-AZ = traffic đi giữa hai AZ khác nhau (có phí và thêm độ trễ nhỏ mỗi chiều, thường < 1-2ms nhưng cộng dồn nếu "chatty").
- **NAT Gateway**: dịch vụ cho phép tài nguyên trong subnet riêng (private) đi ra Internet/AWS API — nhưng là một chặng thêm; gọi giữa các dịch vụ trong VPC mà lại đi vòng qua NAT là lỗi thiết kế.
- **DNS (Domain Name System)**: phân giải tên (ví dụ {{db.internal}}) ra địa chỉ IP. Resolve chậm, cache sai, hoặc tên trỏ về IP on-prem thay vì endpoint AWS đều gây thêm độ trễ.
- **Connection pool (bể kết nối)**: tập kết nối DB/HTTP giữ sẵn để tái dùng (tạo kết nối mới rất tốn thời gian, nhất là có TLS). Pool quá nhỏ + mỗi request chờ kết nối lâu = latency tăng.

### Các nguyên nhân thường gặp
| Nguyên nhân | Vì sao latency tăng | Dấu hiệu / cách kiểm tra |
|---|---|---|
| **Gọi chéo về on-prem qua VPN** | App/DB/dependency còn ở on-prem; mỗi request qua VPN thêm 20-80ms+ (tùy khoảng cách), gọi N lần (chatty) thì nhân lên | Distributed tracing thấy span gọi {{corebank/db}} tốn phần lớn thời gian; IP đích là dải on-prem; {{ping/traceroute/mtr}} từ Pod tới endpoint on-prem |
| **DNS chậm hoặc trỏ sai** | Resolver cấu hình chưa tối ưu; tên nội bộ vẫn trỏ IP on-prem (đi đường vòng); TTL/cache gây resolve lặp | Metric thời gian resolve (nếu có), {{dig/nslookup}} từ Pod; so IP trả về với endpoint AWS mong muốn; kiểm tra CoreDNS log/metrics |
| **Đi vòng qua NAT Gateway** | Gọi dịch vụ nội bộ (S3, DB, service khác) qua NAT thay vì VPC Endpoint/private path → thêm hop + có thể nghẽn băng thông NAT | VPC Flow Logs / topology; kiểm tra route table subnet; gọi S3/DynamoDB mà không có VPC Endpoint |
| **Cross-AZ** | App ở AZ-a gọi DB/service ở AZ-b; một request gọi nhiều lần → cộng dồn | Tracing/metric theo đích; kiểm tra AZ của Pod (node label) và của RDS/endpoint; bật topology-aware routing nếu phù hợp |
| **Connection pool sai cho latency mới** | Trước đây on-prem ↔ DB 1ms, pool 5 đủ; giờ qua VPN 30ms, pool 5 gây xếp hàng chờ connection → latency tăng vọt dù DB nhanh | Metric pool (active/idle/pending, thời gian chờ lấy connection - HikariCP {{hikaricp.connections.acquire}}); thread dump thấy chờ pool |
| **TLS handshake / kết nối mới liên tục** | Không tái dùng kết nối (HTTP keep-alive tắt, pool tắt) → mỗi request trả giá handshake (đắt hơn khi RTT lớn) | Số kết nối mới cao, metric handshake; kiểm tra cấu hình HTTP client/keep-alive |
| **MTU/fragment hoặc băng thông VPN bão hòa** | Gói bị phân mảnh hoặc đường VPN nghẽn giờ cao điểm | {{mtr}} thấy loss/MTU issue; metric băng thông VPN/DX, CloudWatch |

### Quy trình tìm nguyên nhân (từng bước)
~~~text
1. XÁC NHẬN & PHẠM VI
   - Latency tăng ở đâu? (toàn bộ API hay chỉ API gọi dependency X?)
   - So p50/p95/p99 trước-sau migrate, cùng khung giờ/tải.

2. PHÂN RÃ LATENCY THEO CHẶNG (quan trọng nhất)
   - Dùng distributed tracing (ví dụ OpenTelemetry/X-Ray/Jaeger): xem span nào chiếm thời gian.
   - Nếu chưa có tracing: log thời gian từng bước (gọi DB, gọi service ngoài), metric client.

3. KHOANH VÙNG ĐƯỜNG MẠNG
   - Span chậm trỏ tới đích nào? Đích đó ở AWS hay on-prem?
   - Từ Pod: dig tên, kiểm tra IP; traceroute/mtr tới đích; so route/VPC Flow Logs.

4. KIỂM TRA GIẢ THUYẾT CỤ THỂ
   - Cross-AZ: so AZ nguồn/đích. NAT: kiểm tra route table, thử VPC Endpoint.
   - Connection pool: xem metric pending/acquire time (HikariCP), thử tăng pool/tune timeout có đo lại.

5. XÁC NHẬN & KHẮC PHỤC
   - Đổi một yếu tố, đo lại (trước-sau), tránh đổi nhiều thứ cùng lúc.
~~~

~~~seq
title: Đường đi request trước và sau migrate (ví dụ)
actors: User | Loan (AWS) | NAT/VPN | CoreDB (on-prem)
User -> Loan (AWS): request
Loan (AWS) -> NAT/VPN: gọi CoreDB (tên trỏ on-prem)
NAT/VPN -> CoreDB (on-prem): qua VPN + hop thêm
CoreDB (on-prem) --> NAT/VPN: phản hồi
NAT/VPN --> Loan (AWS): +20-80ms mỗi lượt
Loan (AWS) --> User: p95 gấp 3 (nếu gọi nhiều lần)
note Loan (AWS),CoreDB (on-prem): chatty + VPN = latency nhân lên
~~~

### Pitfall (lỗi hay gặp)
- **Kết luận "cloud chậm" mà không đo phân rã**: thay đổi instance type tốn tiền nhưng không chạm nguyên nhân (thực ra là gọi về on-prem). Cách tránh: luôn phân rã latency theo chặng trước khi "scale".
- **Bỏ qua connection pool**: sau migrate RTT tăng, pool cũ (nhỏ) gây xếp hàng — nhìn CPU/DB đều thấp nhưng latency cao. Cách tránh: kiểm tra metric acquire/pending của HikariCP.
- **Chỉ {{ping}} một lần**: ping ICMP có thể bị chặn hoặc không phản ánh TCP/TLS thực tế. Cách tránh: đo bằng {{curl}} thời gian kết nối, hoặc tracing thực.
- **Sửa DNS/NAT mà quên cache**: CoreDNS/app cache vẫn giữ IP cũ. Cách tránh: kiểm tra TTL, khởi động/flush có kiểm soát và đo lại.

### Trả lời phỏng vấn
"Latency tăng gấp 3 sau migrate, em giả định nguyên nhân ở đường mạng/cấu hình kết nối vì code không đổi. Em dùng tracing hoặc log phân rã để tìm span chậm: hay gặp nhất là app trên AWS vẫn gọi chéo DB/service còn on-prem qua VPN nên mỗi hop thêm hàng chục ms và nhân lên nếu chatty; ngoài ra DNS trỏ nhầm về on-prem, đi vòng qua NAT Gateway, cross-AZ cộng dồn, hoặc connection pool quá nhỏ so với RTT mới gây chờ connection (nhìn HikariCP acquire/pending). Em kiểm tra từng giả thuyết bằng số liệu (dig, traceroute, route table/VPC Endpoint, AZ nguồn-đích, metric pool), đổi một yếu tố rồi đo lại p95/p99."

> Senior tip: Hãy đo **baseline latency theo từng dependency** *trước* khi migrate (p95 mỗi chặng) để sau migrate so sánh được ngay. Ở ngân hàng, giai đoạn chuyển tiếp thường "hybrid" (một phần on-prem) — mục tiêu kiến trúc là giảm số lần gọi chéo qua VPN: gom call, thêm cache, hoặc di chuyển dependency cùng wave. Đừng tăng connection pool mù quáng: pool quá lớn gây nghẽn phía DB; dùng metric pending/acquire để tune.`,
  follow: ['Connection pool (HikariCP) nên tính kích thước thế nào khi RTT tới DB tăng sau migrate? (gợi ý: pool size vs latency)', 'Khi nào dùng VPC Endpoint thay vì NAT Gateway, và nó cải thiện latency/bảo mật thế nào?', 'Làm sao giảm tác động giai đoạn hybrid khi một phần dependency bắt buộc còn ở on-prem?'],
  tags: ['migration', 'latency', 'AWS', 'networking', 'connection-pool', 'troubleshooting'],
  refs: [
    { type: 'doc', title: 'AWS Site-to-Site VPN', url: 'https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html' },
    { type: 'doc', title: 'NAT gateways', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html' }
  ]
},
{
  id: 'devops-079',
  topic: 'devops',
  level: 'lead',
  q: '(lead) Bạn được giao lập kế hoạch migrate 40 ứng dụng on-prem lên cloud (AWS) theo đợt. Bạn dùng khung 7R thế nào, lập wave planning và dependency mapping ra sao, tổ chức cutover cuối tuần, và đặt tiêu chí go/no-go? (Liên kết aws-030, không lặp lại.)',
  a: `**Tóm tắt:** Migrate 40 app không phải "dời 40 lần" mà là một **chương trình theo sóng (wave)** dựa trên phụ thuộc và rủi ro. Dùng **7R** để quyết định chiến lược cho từng app (rehost/replatform/refactor/repurchase/retire/retain/relocate), **dependency mapping** để gom app có liên hệ vào cùng wave và xác định thứ tự, rồi với mỗi wave có **runbook cutover cuối tuần** và **tiêu chí go/no-go/rollback** rõ. Nền tảng (landing zone, kết nối, quan sát, bảo mật) phải sẵn sàng trước wave 1. (Chi tiết kỹ thuật di chuyển DB bằng DMS/CDC và cutover DB xem **aws-030**; ở đây tập trung vào lập kế hoạch chương trình 40 app.)

### Bối cảnh thật
Ngân hàng có 40 app on-prem (VM, vài mainframe-adjacent, DB Oracle/SQL Server), muốn lên AWS trong 12-18 tháng để giảm rủi ro hạ tầng cũ và tăng tốc ra tính năng. Ràng buộc: một số app kết nối core banking, cửa sổ thay đổi hạn chế (cuối tuần), yêu cầu tuân thủ/kiểm toán, đội vận hành chưa quen cloud. Không thể "big bang" (dời hết một lần) vì rủi ro và phụ thuộc chồng chéo.

### Thuật ngữ (giải thích lần đầu)
- **7R**: bảy chiến lược migrate — **Retire** (bỏ app không còn giá trị), **Retain** (giữ lại on-prem tạm thời), **Rehost** (chuyển nguyên như cũ, "lift-and-shift"), **Relocate** (chuyển cả cụm hạ tầng), **Repurchase** (thay bằng SaaS), **Replatform** (đổi nền tảng, ít sửa code, ví dụ VM → container/ECS), **Refactor** (viết lại/đổi kiến trúc để cloud-native).
- **Wave (sóng/đợt)**: một nhóm app được migrate cùng một khoảng thời gian/cửa sổ, có mục tiêu và runbook riêng. Wave sau học từ wave trước.
- **Dependency mapping (lập bản đồ phụ thuộc)**: liệt kê app nào gọi app nào, dùng DB/queue/DNS/hệ thống nào, ai là upstream/downstream — để tránh dời một app mà "dây" của nó vẫn ở on-prem.
- **Cutover (chuyển lưu lượng)**: thời điểm chuyển người dùng/th traffic sang môi trường mới.
- **Go/no-go**: cuộc họp/quyết định tại các mốc kiểm tra để quyết định **tiếp tục (go)** hay **dừng/hoãn (no-go)** dựa trên tiêu chí định lượng đã chốt trước.
- **Runbook**: tài liệu từng bước cho một thao tác (ở đây là cutover/rollback), ghi rõ ai làm, làm gì, mất bao lâu, dấu hiệu lỗi, cách quay lui.

### Bước 1 — Khảo sát và gắn 7R cho từng app
Với 40 app, lập bảng danh mục (portfolio): tên, chủ sở hữu nghiệp vụ, công nghệ, tích hợp, dữ liệu nhạy cảm, tần suất thay đổi, chi phí/vấn đề hiện tại, và **7R đề xuất** + lý do. Tránh refactor hàng loạt (đắt, chậm) trừ khi có lợi ích rõ.

| 7R | Khi chọn (ví dụ) | Ghi chú 40-app |
|---|---|---|
| Retire | Ít người dùng, trùng chức năng | Dời 0 dòng code, giảm số app phải migrate — làm sớm |
| Retain | Phụ thuộc core/mainframe chưa chuyển, hoặc sắp thay thế | Có kế hoạch/điều kiện để revisit, không "bỏ quên" |
| Repurchase | Có SaaS đáp ứng (HR, CRM nội bộ) | Cần đánh giá tích hợp/dữ liệu/tuân thủ |
| Rehost | Ổn định, cần chuyển nhanh, ít giá trị khi sửa | Nhanh nhưng không tận dụng cloud; thường là bước tạm |
| Replatform | Spring Boot/Java đã có thể đóng gói; muốn bỏ quản lý OS/patch | Thường "ngọt" nhất cho app Java (VM → container/EKS/ECS) |
| Refactor | Cần scale/độ tin cậy lớn, sẵn sàng đầu tư | Chỉ 1-2 app trọng yếu, không làm đồng loạt |

### Bước 2 — Dependency mapping và xếp wave
- **Thu thập phụ thuộc**: phỏng vấn team, đọc sơ đồ tích hợp, xem cấu hình (endpoint, DNS, connection string), log/flow mạng. Vẽ đồ thị: app → app/DB/queue/DNS/hệ thống on-prem.
- **Nguyên tắc xếp wave**:
  - Wave 0 (nền tảng): landing zone, mạng (VPN/Direct Connect), IAM/bảo mật, CI/CD, observability, registry — chưa có nền tảng thì wave app sẽ hỗn loạn.
  - Wave 1: **ít phụ thuộc, rủi ro thấp**, có thể replatform nhanh — dùng để "luyện" quy trình, runbook, đội ngũ.
  - Wave giữa: gom app **cùng cụm phụ thuộc** vào cùng wave (tránh một app lên cloud còn gọi 5 app on-prem qua đường chậm). Xử lý phụ thuộc vòng bằng cách tách giao diện hoặc dùng strangler/adapter tạm.
  - Wave cuối: app **phụ thuộc core banking/on-prem nặng** hoặc rủi ro cao — lúc này đội đã có kinh nghiệm, và có thể đã có giải pháp kết nối ổn định.
- **Quản lý hybrid tạm thời**: trong lúc chuyển tiếp, chấp nhận một phần gọi chéo on-prem ↔ cloud, nhưng **đo latency** và đặt mục tiêu giảm dần (liên hệ aws-030 về đường đi/độ trễ; devops-078 về nguyên nhân latency khi hybrid).

~~~text
Wave 0  Nền tảng: landing zone, DX/VPN, IAM, CI/CD, giám sát
   |
Wave 1  3-5 app độc lập, rủi ro thấp  (replatform)  -> luyện runbook
   |
Wave 2  cụm app A,B,C (phụ thuộc nhau) + DB của cụm  -> migrate cùng wave
   |
Wave 3  ... từng cụm theo dependency map ...
   |
Wave N  app gắn core on-prem / rủi ro cao  (sau khi kết nối + đội đã vững)
Mỗi wave: chuẩn bị -> rehearsals (diễn tập) -> cutover cuối tuần -> hypercare -> lessons learned
~~~

### Bước 3 — Cutover cuối tuần (mỗi wave)
Cutover cuối tuần vì lưu lượng thấp và có cửa sổ bảo trì; ngân hàng thường có quy trình phê duyệt thay đổi (change). **Runbook** (viết từ lần diễn tập, không viết lý thuyết) gồm:
- **T-1/T-2 tuần**: diễn tập (rehearsal) trên môi trường giống prod; khóa phiên bản, đóng băng thay đổi không liên quan.
- **Trước cửa sổ**: xác nhận backup/restore, thông báo stakeholder, kiểm tra đường mạng/cert/DNS, chuẩn bị lệnh rollback.
- **Trong cửa sổ (ví dụ T0 22:00 → 04:00)**: từng bước có giờ, người chịu trách nhiệm, kênh liên lạc (bridge). Triển khai theo thứ tự phụ thuộc; smoke test nghiệp vụ sau mỗi cụm.
- **Sau cutover**: giám sát tăng cường (hypercare 3-5 ngày), giữ đường rollback theo thời hạn đã chốt. (Kỹ thuật cutover/rollback DB dùng DMS/CDC: xem aws-030.)

### Bước 4 — Tiêu chí go/no-go
Chốt **trước** ngày cutover, đo được, và gắn người có quyền quyết định. Ví dụ:
| Mốc | Go nếu | No-go nếu |
|---|---|---|
| Go/No-go diễn tập (T-1 tuần) | Diễn tập đạt, thời gian nằm trong cửa sổ, checklist hoàn tất | Bước quan trọng thất bại, chưa có cách xử lý |
| Go/No-go trước cửa sổ (ngày T) | Team sẵn sàng, backup OK, không sự cố P1 đang mở, phê duyệt change | Thiếu người then chốt, sự cố đang diễn ra, dependency chưa sẵn sàng |
| Go/No-go trong cửa sổ (sau smoke test) | Error rate/latency trong ngưỡng, giao dịch mẫu đúng, checksum khớp (nếu có) | Lỗi nghiệp vụ nghiêm trọng, dữ liệu lệch, không xác định nguyên nhân nhanh |
| Quyết định rollback | Tiêu chí rollback đã xảy ra (chốt trước) | Cố "vá" vượt quá thời gian cửa sổ mà chưa rõ nguyên nhân |

### Pitfall (lỗi hay gặp)
- **Big bang 40 app**: một lỗi kéo sập nhiều luồng, không ai biết nguyên nhân ở đâu. Cách tránh: chia wave, wave 1 nhỏ để học.
- **Xếp wave theo phòng ban thay vì theo phụ thuộc**: dời app A mà B (còn on-prem) phụ thuộc A → gọi chéo xa, latency/lỗi. Cách tránh: dependency mapping là đầu vào bắt buộc của wave planning.
- **Refactor mọi thứ**: đội kiệt sức, trễ chương trình. Cách tránh: 7R theo giá trị/rủi ro, đa số Java app hợp replatform.
- **Không có nền tảng (Wave 0)**: mỗi wave tự chế bảo mật/mạng/CI → nợ và lỗ hổng. Cách tránh: landing zone + guardrail trước wave 1.
- **Go/no-go cảm tính**: tranh luận trong đêm cutover. Cách tránh: tiêu chí định lượng + người quyết định chốt từ trước.
- **Bỏ qua con người/quy trình**: đội vận hành chưa quen cloud/on-call mới. Cách tránh: đào tạo, runbook, hypercare, và cập nhật quy trình incident.

### Trả lời phỏng vấn (lead)
"Với 40 app em tiếp cận như một chương trình theo wave, không big bang. Em lập danh mục và gắn 7R cho từng app: retire/repurchase để giảm số lượng, đa số Java replatform, chỉ refactor khi có lý do rõ. Song song em làm dependency mapping (tích hợp, DB, DNS, luồng on-prem) để gom cụm phụ thuộc vào cùng wave; Wave 0 dựng landing zone/kết nối/IAM/observability, Wave 1 chọn app ít phụ thuộc rủi ro thấp để luyện quy trình. Mỗi wave có rehearsal, runbook cutover cuối tuần với vai trò/giờ rõ, và hypercare. Go/no-go và rollback là tiêu chí định lượng chốt trước (sau diễn tập, trước cửa sổ, sau smoke test). Phần kỹ thuật di chuyển/cutover DB em dùng DMS full load + CDC, tiêu chí lag về 0 và checksum — chi tiết như aws-030."

> Senior tip: Hai thứ quyết định chương trình 40 app: (1) **dependency mapping thật** (đừng tin chỉ sơ đồ lý thuyết — xác minh bằng log/flow mạng) và (2) **runbook lấy từ diễn tập** chứ không từ tài liệu. Hãy đo tỉ lệ "gọi chéo on-prem" sau mỗi wave và coi đó là chỉ số sức khỏe kiến trúc hybrid; mục tiêu là giảm dần. Giữ nhật ký quyết định 7R (vì sao app X replatform chứ không refactor) để kiểm toán và để wave sau không tranh luận lại từ đầu.`,
  follow: ['Làm sao phát hiện phụ thuộc ẩn giữa các app mà tài liệu không ghi? (gợi ý: flow log, tracing, DNS/query log)', 'Khi một cụm app có phụ thuộc vòng (A gọi B, B gọi A), bạn xếp wave và cutover thế nào?', 'Những chỉ số nào bạn báo cáo lãnh đạo sau mỗi wave để chứng minh chương trình đang an toàn và đúng tiến độ?'],
  tags: ['migration', '7R', 'wave-planning', 'dependency-mapping', 'cutover', 'go-no-go', 'leadership'],
  refs: [
    { type: 'doc', title: 'AWS Cloud Adoption Framework', url: 'https://aws.amazon.com/cloud-adoption-framework/' },
    { type: 'doc', title: '7 Rs migration strategies', url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/strategy-migration/welcome.html' }
  ]
}
);
