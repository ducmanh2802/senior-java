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
  }
);
