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
  a: `**Tóm tắt:** Linux kiểm soát "ai được làm gì với file nào" bằng ba lớp: (1) danh tính (user/group), (2) 3 nhóm quyền đọc-ghi-chạy (r, w, x) cho owner/group/other biểu diễn bằng số octal, và (3) sudo/sudoers để cấp phép chạy lệnh với đặc quyền cao theo danh sách tường minh. Cho user deploy, áp dụng least privilege: user riêng, group riêng, umask thắt chặt, sudo chỉ vài lệnh systemctl/journalctl, tuyệt đối không setuid và không chmod 777.

### Cái gì: hệ thống quyền Linux, giải thích như dạy người mới
Hãy tưởng tượng một tòa nhà văn phòng: **user** là thẻ ra vào của từng người (mỗi thẻ có một mã số UID, lưu trong {{/etc/passwd}}). **Group** là phòng ban (lưu trong {{/etc/group}}); một người có 1 nhóm chính (primary group) và có thể thuộc thêm nhiều nhóm phụ (supplementary groups), giống người vừa thuộc "phòng deploy" vừa thuộc "phòng app". Mỗi căn phòng (file/thư mục) có 3 ổ khóa gắn với 3 nhóm người: **owner** (chủ), **group** (phòng ban), **other** (mọi người khác).

Mỗi ổ khóa có 3 bit quyền: **r (read, =4)** đọc nội dung file hoặc liệt kê thư mục; **w (write, =2)** sửa file hoặc tạo/xóa file trong thư mục; **x (execute, =1)** chạy file như chương trình, hoặc (với thư mục) được "bước vào" thư mục đó bằng {{cd}}. Ghép lại thành số **octal** (cơ số 8): {{rwxr-xr-x}} = 7,5,5 = {{755}}; {{rw-r-----}} = 6,4,0 = {{640}}. Ví dụ {{ls -l}} in {{-rw-r----- 1 root app deploy.jar}} nghĩa là owner (root) đọc-ghi, group (app) chỉ đọc, người khác không được gì.

**sudo** (superuser do): cho phép một user thường chạy lệnh với quyền của root (hoặc user khác) theo **chính sách** trong {{/etc/sudoers}}. File này phải sửa bằng {{visudo}} (lệnh kiểm tra cú pháp trước khi lưu, tránh việc gõ sai làm bạn bị khóa khỏi sudo). **setuid** là một bit đặc biệt (số 4 ở đầu, ví dụ {{4755}}) khiến file chạy với UID của owner thay vì UID người chạy; lệnh {{/usr/bin/passwd}} cần setuid-root để sửa {{/etc/shadow}}, nhưng setuid trên chương trình tự viết là lỗ hổng leo thang đặc quyền nghiêm trọng. **umask** là "mặt nạ" trừ bớt quyền mặc định khi tạo file mới: quyền gốc file là 666, thư mục 777; umask {{022}} cho ra file 644, dir 755; umask {{027}} (an toàn hơn) cho ra file 640, dir 750 — group chỉ đọc, other không có quyền.

### Cách cấp quyền tối thiểu cho user deploy (least privilege)
Nguyên tắc **least privilege** (đặc quyền tối thiểu): chỉ cấp đúng những quyền cần để hoàn thành công việc, không hơn. Từng bước:
~~~bash
# 1) Tạo user deploy riêng, có home, shell bash; không dùng root để deploy
sudo useradd -m -s /bin/bash deploy
# 2) Tạo group app, thêm deploy vào group (supplementary, không đổi primary)
sudo groupadd app
sudo usermod -aG app deploy
# 3) Thư mục app: owner root, group app. 2750 = setgid(2)+rwx cho owner+rx cho group
#    setgid trên thư mục: file mới tạo bên trong tự kế thừa group "app"
sudo chown -R root:app /opt/myapp
sudo chmod 2750 /opt/myapp
# 4) umask 027 cho deploy: file mới 640, dir 750 (other = 0)
echo 'umask 027' | sudo tee -a /home/deploy/.bashrc
# 5) Private key SSH của deploy chỉ owner đọc được
chmod 600 /home/deploy/.ssh/id_ed25519
~~~
Cấp sudo **chỉ đúng lệnh cần thiết** (sửa bằng {{visudo}}, file drop-in {{/etc/sudoers.d/deploy}}):
~~~text
# deploy chỉ được restart 1 service và đọc log của nó, chạy không cần mật khẩu
deploy ALL=(root) NOPASSWD: /bin/systemctl restart myapp, /bin/systemctl status myapp, /bin/journalctl -u myapp
~~~
Tuyệt đối không cho {{sudo su}}, {{sudo bash}}, {{sudo vi}}, {{sudo /bin/sh}} hay {{NOPASSWD: ALL}}: bất kỳ lệnh nào mở được shell/editor đều tương đương root hoàn toàn.

### Ví dụ đời thực
Tình huống (giả định hợp lý): startup 8 người, 1 server {{/opt/orders}} chạy service Java, 3 dev chia sẻ tài khoản {{ubuntu}} có {{NOPASSWD: ALL}} để "deploy cho nhanh". Một dev chạy nhầm script dọn log chứa {{rm -rf / var/log}} (dấu cách thừa) lúc 2h sáng, xóa nhầm thư mục hệ thống; service chết, MTTR 4 giờ vì phải dựng lại server. Sau sự cố: tạo user {{deploy}} + group {{orders}}; {{/opt/orders}} chuyển {{root:orders 2750}}; sudoers chỉ còn {{systemctl restart orders}} và {{journalctl -u orders}}; tắt SSH password, chỉ key ed25519 {{600}}; umask {{027}}. Kết quả: 3 tháng sau không còn "deploy nhầm quyền", audit {{sudo -l -U deploy}} cho ra đúng 3 lệnh được phép; thời gian cấp quyền cho dev mới giảm từ "cho luôn root" xuống checklist 5 phút.

### Pitfall production
- {{chmod -R 777 /opt/app}}: mọi user trên máy (kể cả tiến trình bị chiếm quyền) ghi đè được JAR/config, tương đương mở cửa backdoor. Tương tự, {{chown -R deploy:deploy /etc}} là thảm họa.
- Cấp sudo cho {{apt}}, {{yum}}, {{docker}}, {{find}} hoặc {{less}}: đều có cách thoát ra shell root ({{docker run -v /:/host -it alpine sh}}, {{less !sh}}).
- setuid trên script shell bị kernel bỏ qua vì lý do bảo mật, nhưng setuid trên binary C tự biên dịch thì có hiệu lực — đừng làm.
- ACL ({{setfacl/getfacl}}) ghi đè cảm giác "đã chmod đúng" vì quyền thực tế = ACL mask; luôn kiểm tra bằng {{getfacl}} khi quyền lạ.

### Trả lời mẫu khi phỏng vấn
Linux gắn mỗi file với một owner, một group, và 3 nhóm quyền r, w, x cho owner, group, other; em đọc bằng {{ls -l}} và biểu diễn octal như 640 hay 750. Để cấp quyền tối thiểu cho user deploy, em không dùng tài khoản chung và không bao giờ cấp root. Em tạo user {{deploy}} riêng và group {{app}}; thư mục ứng dụng đặt {{root:app}} với mode {{2750}} có setgid để file mới tự kế thừa group. Trong sudoers, em chỉ cho phép đúng vài lệnh như {{systemctl restart myapp}} và {{journalctl -u myapp}} với NOPASSWD, tuyệt đối không cho {{sudo bash}} hay {{NOPASSWD: ALL}} vì chúng tương đương root. Em đặt umask {{027}} để file mới mặc định không mở cho other, và private key SSH để mode {{600}}. setuid em tránh hoàn toàn trên chương trình tự viết vì đó là đường leo thang đặc quyền. Sau khi cấu hình, em xác minh bằng {{sudo -l -U deploy}} và {{getfacl}}; trên production em audit sudoers định kỳ. Theo kinh nghiệm, gần như mọi sự cố "deploy xóa nhầm" em từng gặp đều bắt nguồn từ việc cấp quyền rộng hơn mức cần.

> Senior tip: least privilege là checklist có thể kiểm toán: {{sudo -l -U deploy}} phải ra đúng vài lệnh, {{find / -perm -4000 -user root}} liệt kê file setuid-root để rà soát, và bất kỳ thay đổi sudoers nào cũng đi qua pull request + {{visudo}}. Trên server nhiều người, dùng SSH certificate hoặc nhóm LDAP thay vì tài khoản chia sẻ, để thu hồi quyền tức thì khi người rời team.`,
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
  a: `**Tóm tắt:** Script deploy bash đáng tin cậy phải "fail-fast" ({{set -euo pipefail}}), luôn dọn dẹp dù thành công hay lỗi ({{trap}}), thử lại có giới hạn với backoff cho thao tác mạng, ghi log có timestamp và deploy id để truy vết, và thiết kế **idempotent** (chạy lại nhiều lần cho cùng kết quả, không hỏng thêm). Thêm khóa chống chạy chồng ({{flock}}) và exit code phân loại để CI/CD phản ứng đúng.

### Cái gì → vì sao cần → hoạt động thế nào
**Idempotent** (lũy đẳng): một thao tác chạy 1 lần hay 10 lần đều đưa hệ thống về cùng một trạng thái đích, giống nút "bật đèn" — bấm lần hai không làm gì thêm. Deploy hay bị chạy lại (CI retry, người thao tác bấm lại khi nghi ngờ), nên script không idempotent sẽ deploy chồng, ghi đè sai version, hoặc mở 2 process cùng lúc.

Từng "tấm lưới an toàn" trong bash:
- {{set -e}}: thoát ngay khi một lệnh trả exit code khác 0 (fail-fast), thay vì lặng lẽ chạy tiếp bước sau trên nền tảng đã hỏng.
- {{set -u}}: coi biến chưa khai báo là lỗi (tránh {{rm -rf "$TYPO_DIR"/}} xóa nhầm khi biến rỗng).
- {{set -o pipefail}}: trong pipeline {{a | b | c}}, mặc định bash chỉ lấy exit code của lệnh cuối; {{pipefail}} làm cả pipeline fail nếu bất kỳ lệnh nào fail.
- {{trap cleanup EXIT}}: chạy hàm {{cleanup}} khi script kết thúc, dù thoát thành công, do {{set -e}}, hay do tín hiệu — dùng để xóa lock, file tạm.
- {{trap 'on_err $LINENO' ERR}}: ghi log dòng bị lỗi. Lưu ý {{ERR}} không kích hoạt trong điều kiện {{if}}/{{while}} và không bắt được tín hiệu {{INT/TERM}}, nên cần thêm {{trap cleanup INT TERM}}.
- **Retry có giới hạn + backoff** (chờ tăng dần): thao tác mạng (curl health, kéo image, scp) có thể lỗi thoáng qua; thử lại vài lần với thời gian chờ nhân đôi (2s, 4s, 8s) giúp tự hồi phục, nhưng phải có {{max}} để không treo vô hạn.

### Ví dụ script (rút gọn, chạy được)
~~~bash
#!/usr/bin/env bash
set -euo pipefail
DEPLOY_ID="\${DEPLOY_ID:-$(date +%Y%m%d%H%M%S)-$RANDOM}"
LOCK=/var/lock/deploy-myapp.lock
LOG=/var/log/deploy-myapp.log
APP_DIR=/opt/myapp/releases/$DEPLOY_ID
log() { printf '[%s] [%s] %s\n' "$(date -Is)" "$DEPLOY_ID" "$*" | tee -a "$LOG"; }
cleanup() { log "cleanup (exit $?)"; rm -f "$LOCK.tmp" 2>/dev/null || true; }
on_err()  { log "ERROR at line $1"; }
trap cleanup EXIT; trap 'on_err $LINENO' ERR; trap cleanup INT TERM
# Khóa chống chạy chồng: cùng lúc chỉ 1 deploy
exec 9>"$LOCK"; flock -n 9 || { log "deploy khác đang chạy"; exit 2; }
retry() { local n=0 max=5 d=2; until "$@"; do n=$((n+1)); [ $n -ge $max ] && return 1; log "retry $n/$max"; sleep $d; d=$((d*2)); done; }
# Idempotent: nếu version đã active thì bỏ qua
[ "$(readlink -f /opt/myapp/current 2>/dev/null || true)" = "$APP_DIR" ] && { log "đã ở đúng version"; exit 0; }
mkdir -p "$APP_DIR"
retry curl -fsS "https://repo.internal/myapp/$DEPLOY_ID.jar" -o "$APP_DIR/app.jar"
ln -sfn "$APP_DIR" /opt/myapp/current           # atomic: đổi symlink, rollback = trỏ lại
sudo systemctl restart myapp
retry curl -fsS http://127.0.0.1:8080/actuator/health | grep -q UP || { log "health fail"; exit 3; }
log "deploy OK"
~~~
Exit code phân loại: {{0}} ok, {{1}} lỗi chung, {{2}} bị khóa (deploy khác đang chạy), {{3}} health check fail — để CI/CD biết có nên retry hay rollback.

### Ví dụ đời thực
Tình huống (giả định): team 6 người deploy thủ công bằng script cũ không có {{set -e}}; bước {{scp}} artifact lỗi mạng nhưng script vẫn chạy tiếp {{systemctl restart}} với JAR cũ/broken, 1h sáng service trả 500 cho ~2.000 request (5 phút) trước khi ai nhận ra. Viết lại với {{set -euo pipefail}}, {{retry}} cho scp/curl (max 5, backoff 2s→32s), {{flock}} chống chạy chồng, deploy vào thư mục version rồi {{ln -sfn}} (atomic), và health check sau restart. 6 tháng sau, 140 lần deploy: 9 lần tự hồi phục nhờ retry (mạng chập chờn), 2 lần health fail tự thoát code 3 và pipeline rollback trong 40 giây, 0 sự cố "deploy chồng" nhờ lock. Thời gian điều tra sự cố deploy giảm từ ~30 phút xuống < 5 phút nhờ log có {{DEPLOY_ID}} + số dòng lỗi.

### Pitfall production
- {{set -e}} bị "tắt" trong vế điều kiện {{if cmd; then}} và trong hàm gọi từ {{if}} — lỗi im lặng. Kiểm tra {{rc=$?}} tường minh khi cần.
- Quên {{flock}}: 2 pipeline chạy cùng lúc ghi đè {{current}} symlink, kết quả là version ngẫu nhiên.
- {{trap ERR}} không chạy khi bị {{kill -9}} (SIGKILL không bắt được) — chấp nhận, nhưng {{INT/TERM}} phải bắt.
- Retry vô hạn hoặc không backoff: dội request vào registry/DB đang lỗi, làm sự cố nặng thêm (thundering herd).
- Deploy "ghi đè tại chỗ" (copy đè JAR đang chạy) không idempotent và không rollback được; luôn deploy sang thư mục mới rồi đổi symlink atomically.

### Trả lời mẫu khi phỏng vấn
Khi viết script deploy bash cho production, em luôn bắt đầu với {{set -euo pipefail}} để script fail-fast: {{-e}} thoát khi lệnh lỗi, {{-u}} báo biến chưa khai báo để tránh xóa nhầm đường dẫn rỗng, và {{pipefail}} để lỗi trong pipeline không bị nuốt. Em dùng {{trap cleanup EXIT}} để luôn dọn dẹp lock và file tạm, {{trap}} {{ERR}} để log đúng số dòng lỗi, và thêm trap cho {{INT/TERM}} vì {{ERR}} không bắt được tín hiệu. Với thao tác mạng như kéo artifact hay health check, em bọc bằng hàm retry có giới hạn, ví dụ tối đa 5 lần với backoff nhân đôi, để tự vượt lỗi thoáng qua nhưng không treo vô hạn. Em thiết kế idempotent: kiểm tra nếu version đã active thì bỏ qua, deploy vào thư mục theo version rồi đổi {{ln -sfn}} atomically để rollback chỉ là trỏ lại symlink cũ. Em thêm {{flock}} để hai lần deploy không chạy chồng, ghi log có timestamp và {{DEPLOY_ID}}, và trả exit code phân loại (0 ok, 2 lock, 3 health fail) để CI/CD quyết định retry hay rollback. Điểm em nhấn mạnh với team: script deploy phải chạy lại an toàn, vì CI sẽ retry và con người sẽ bấm lại.

> Senior tip: coi script deploy như code sản phẩm: chạy {{shellcheck}} (lint) và {{bash -n}} (cú pháp) trong CI, có {{--dry-run}} để in lệnh sẽ chạy, và kiểm tra idempotency bằng cách chạy 2 lần liên tiếp trên staging — lần hai phải thoát 0 mà không đổi trạng thái. Với deploy quan trọng, cân nhắc chuyển sang Ansible/systemd unit có sẵn idempotency thay vì bash thuần.`,
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
  a: `**Tóm tắt:** Bốn workload controller của Kubernetes giải 4 bài toán khác nhau: **ReplicaSet** giữ đúng số pod; **Deployment** bọc ReplicaSet để rollout/rollback app **stateless**; **StatefulSet** dành cho app **stateful** cần danh tính mạng/đĩa ổn định ({{web-0}}, {{web-1}}) và khởi động/tắt có thứ tự; **DaemonSet** chạy đúng 1 pod trên mỗi (hoặc nhóm) node cho tác vụ cấp node như log/metrics agent. Chọn sai controller (ví dụ Deployment cho DB) dẫn tới mất dữ liệu hoặc lệch identity.

### Cái gì → vì sao cần → hoạt động thế nào
Hãy hình dung 4 kiểu "sắp xếp nhân sự": Deployment giống đội giao hàng — ai cũng thay thế được, cần 10 người thì giữ 10, đổi đồng phục (image mới) thì thay dần từng người (rolling). StatefulSet giống dãy tủ gửi đồ có số cố định: {{web-0}} luôn là tủ số 0 gắn với ổ cứng số 0, kể cả khi tủ bị thay, nên đồ không lẫn. DaemonSet giống bảo vệ trực mỗi tầng: mỗi tầng (node) đúng 1 người, thêm tầng mới tự có bảo vệ.

- **ReplicaSet**: vòng lặp điều khiển so khớp {{spec.replicas}} với số pod thực tế khớp {{selector}}; thiếu thì tạo, thừa thì xóa. Bạn hiếm khi tạo ReplicaSet trực tiếp; nó có {{ownerReferences}} trỏ về Deployment.
- **Deployment**: quản lý ReplicaSet. Khi đổi image, nó tạo ReplicaSet mới, tăng dần pod mới và giảm pod cũ theo {{maxSurge}} (pod dư tạm thời cho phép) và {{maxUnavailable}} (pod được phép vắng trong lúc rollout); giữ {{revisionHistoryLimit}} ReplicaSet cũ để {{kubectl rollout undo}}.
- **StatefulSet**: pod có tên thứ tự ổn định {{<name>-0..N-1}}; mỗi pod gắn 1 **PVC** riêng qua {{volumeClaimTemplates}} (ổ cứng đi theo danh tính pod). Scale-up/rollout theo thứ tự tăng dần, scale-down theo thứ tự giảm dần ({{N-1}} trước). Cần một **headless Service** ({{clusterIP: None}}) để cấp DNS ổn định {{web-0.db.default.svc}}.
- **DaemonSet**: đảm bảo 1 pod trên mọi node thỏa điều kiện (hoặc dùng {{nodeSelector/tolerations}} để chọn nhóm node). Node mới join cluster tự được gắn pod.

| Controller | Trạng thái | Danh tính pod/PVC | Thứ tự rollout | Ví dụ điển hình |
|---|---|---|---|---|
| Deployment (+RS) | stateless | ngẫu nhiên, thay thế được | song song (theo surge) | Spring Boot API, worker stateless |
| StatefulSet | stateful | ổn định (ordinal + PVC riêng) | có thứ tự | Kafka/Zookeeper, PostgreSQL, Redis cluster |
| DaemonSet | node-level | gắn theo node | theo node | Fluent Bit, Node Exporter, CNI agent |

### Ví dụ đời thực
Tình huống (giả định): team 12 người chạy 1 service Spring Boot (stateless, 15.000 RPS giờ cao điểm) và cụm Kafka 3 broker + 1 DaemonSet Fluent Bit thu log. Spring Boot dùng Deployment {{replicas=6}}, HPA scale 6→18 theo CPU 70%; rollout image mới mất ~4 phút với {{maxSurge=25%, maxUnavailable=0}} nên không rớt request. Kafka dùng StatefulSet {{kafka-0..2}}, mỗi broker gắn PVC 500 GB qua {{volumeClaimTemplates}}; khi {{kafka-1}} bị reschedule sang node khác, nó vẫn mount lại đúng PVC của {{kafka-1}} nên partition dữ liệu không lẫn. Fluent Bit DaemonSet tự xuất hiện trên 3 node mới khi cụm autoscale, bảo đảm 100% node có log shipper. Một lần team thử chuyển Kafka sang Deployment "cho đơn giản": pod mới nhận tên ngẫu nhiên, không gắn lại đúng PVC, broker ID lệch, 2 partition mất leader 12 phút. Bài học: controller phải khớp bản chất state.

### Pitfall production
- Dùng Deployment cho DB/Kafka: pod thay thế được nhưng dữ liệu thì không — mất ánh xạ pod↔PVC, rủi ro mất dữ liệu hoặc split-brain.
- StatefulSet scale down **không tự xóa PVC** (an toàn, tránh mất dữ liệu); PVC mồ côi tích lại tốn tiền — cần quy trình dọn thủ công/có kiểm soát.
- Quên headless Service cho StatefulSet: pod không có DNS ổn định, các broker không tìm nhau.
- DaemonSet + tài nguyên node eo hẹp: mỗi node tốn thêm RAM/CPU cố định; quên {{resources requests/limits}} cho agent làm node hết chỗ.
- Dùng {{Recreate}} strategy cho Deployment có state ngoài ý muốn: downtime 100% trong lúc rollout.

### Trả lời mẫu khi phỏng vấn
Em chọn controller Kubernetes dựa trên trạng thái và danh tính của workload. ReplicaSet là lớp giữ đúng số pod, nhưng thực tế em dùng Deployment để bọc nó, vì Deployment cho rolling update và rollback cho ứng dụng stateless như Spring Boot; mỗi pod thay thế được, em cấu hình {{maxSurge}} và {{maxUnavailable}} để rollout không downtime. Với workload stateful như Kafka hay cơ sở dữ liệu, em dùng StatefulSet vì nó cấp tên ổn định {{pod-0, pod-1}} và gắn mỗi pod với một PVC riêng qua {{volumeClaimTemplates}}, kèm headless Service để có DNS cố định; thứ tự khởi động và tắt có kiểm soát, nên broker không mất ánh xạ dữ liệu. Với tác vụ cần chạy trên từng node như log shipper hay metrics agent, em dùng DaemonSet để mỗi node luôn có đúng một pod, và node mới join tự được triển khai. Sai lầm em hay thấy là dùng Deployment cho DB: pod mới không gắn lại đúng đĩa, rất dễ gây sự cố dữ liệu. Nói ngắn gọn: stateless thì Deployment, stateful có danh tính thì StatefulSet, tác vụ cấp node thì DaemonSet.

> Senior tip: hỏi 3 câu trước khi chọn: (1) pod có thay thế nhau được không? (2) dữ liệu có gắn danh tính pod không? (3) có cần đúng 1 bản trên mỗi node không? Câu trả lời lần lượt dẫn tới Deployment / StatefulSet / DaemonSet. Với job chạy một lần hoặc theo lịch, dùng {{Job/CronJob}} thay vì giữ pod sống mãi.`,
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
  a: `**Tóm tắt:** Kubernetes **Service** cho một địa chỉ ổn định (IP/DNS) và cân bằng tải tới nhóm pod thay đổi liên tục. 5 loại: {{ClusterIP}} (nội bộ, mặc định), {{NodePort}} (mở port trên mọi node), {{LoadBalancer}} (nhờ cloud cấp LB), {{ExternalName}} (bí danh DNS ra ngoài), **headless** ({{clusterIP: None}}, trả thẳng IP pod cho service discovery). Đưa traffic từ Internet vào cụm: dùng **Ingress** (L7, qua controller) hoặc **Gateway API** (chuẩn mới, linh hoạt hơn), trên AWS thường gắn **AWS Load Balancer Controller** để tạo ALB/NLB thật.

### Cái gì → vì sao cần → hoạt động thế nào
Pod có IP tạm: chết là đổi IP. Service đứng trước như "số tổng đài" cố định, dùng {{selector}} (label) để tìm pod khỏe và chia tải. Dưới nắp capo, {{kube-proxy}} (iptables/IPVS) hoặc eBPF cài rule định tuyến từ ClusterIP tới pod.

| Loại | Phạm vi | Cơ chế | Dùng khi |
|---|---|---|---|
| ClusterIP | trong cluster | IP ảo nội bộ + DNS {{svc.ns.svc}} | service-to-service (mặc định) |
| NodePort | ngoài, qua node | mở port 30000-32767 trên mọi node | on-prem không có cloud LB, hoặc làm backend cho LB ngoài |
| LoadBalancer | ngoài, qua cloud LB | cloud provision NLB/ALB trỏ vào NodePort/Pod | expose 1 service ra Internet nhanh; tốn 1 LB/service |
| ExternalName | nội bộ (alias) | CNAME tới DNS ngoài, không proxy | trỏ tên nội bộ tới RDS/SaaS, hỗ trợ migrate dần |
| Headless (None) | trong cluster | DNS trả A record từng pod, không có VIP | StatefulSet discovery, client-side LB, gRPC |

Đưa HTTP/HTTPS từ ngoài vào ở lớp 7 (nhìn được host/path/header): **Ingress** định nghĩa rule ({{host/path → Service}}) và cần 1 Ingress Controller (nginx, AWS ALB) thực thi. **Gateway API** là chuẩn kế thừa: tách vai trò hạ tầng ({{GatewayClass/Gateway}} do platform quản) và định tuyến ({{HTTPRoute/GRPCRoute}} do team app quản), hỗ trợ canary, header match, gRPC tốt hơn Ingress. Trên AWS, **AWS Load Balancer Controller** reconcile Ingress/Gateway/Service (type LoadBalancer, annotation NLB) thành ALB/NLB thật.

### Ví dụ đời thực
Tình huống (giả định): nền tảng ngân hàng số, 14 microservice Spring Boot, 40.000 RPS giờ cao điểm. Ban đầu mỗi service public tạo 1 {{Service type LoadBalancer}} → 14 ALB, ~14 × 25 USD/tháng (~350 USD/tháng) chưa kể LCU. Tái cấu trúc: mọi service nội bộ dùng {{ClusterIP}}; 1 Ingress (AWS LBC, scheme internet-facing) gom 10 host/path rule vào 1 ALB, chi phí còn ~45 USD/tháng; service gRPC thanh toán dùng Gateway API {{GRPCRoute}} gắn NLB (L4) vì ALB HTTP rule không hợp streaming hai chiều. Cụm Redis 6 node dùng headless Service để client tự discovery từng pod. Khi di chuyển DB từ on-prem sang RDS, tạo {{ExternalName}} trỏ {{db.internal}} → endpoint RDS, app không đổi connection string.

### Pitfall production
- "Mỗi service một LoadBalancer": nổ chi phí và quota LB; gom bằng Ingress/Gateway + {{ClusterIP}}.
- NodePort mở port trên **mọi** node (kể cả node không chạy pod đó) và cần mở firewall/security group — bề mặt tấn công tăng.
- Headless + client cache DNS: pod chết nhưng client vẫn giữ IP cũ; cần client hỗ trợ re-resolve hoặc dùng DNS TTL ngắn.
- ExternalName chỉ là CNAME: không có health check, không proxy TLS tới đích; và một số resolver/case cross-namespace có hành vi dễ gây nhầm.
- AWS LBC cần quyền IAM (IRSA) và subnet tag đúng; thiếu tag {{kubernetes.io/role/elb}} là ALB không provision được, khó debug nếu không đọc log controller.

### Trả lời mẫu khi phỏng vấn
Khi thiết kế mạng trong Kubernetes, em bắt đầu từ câu hỏi traffic đi từ đâu tới đâu. Giữa các service trong cluster, em dùng {{ClusterIP}} vì nó cho DNS và IP ổn định, đây là mặc định an toàn. Em tránh {{NodePort}} cho traffic public vì mở port trên mọi node, trừ khi chạy on-prem không có cloud LB. {{Service type LoadBalancer}} tiện nhưng mỗi service một LB nên chi phí cao; vì vậy với HTTP/HTTPS em gom bằng Ingress hoặc Gateway API đứng trước các {{ClusterIP}} service. Trên AWS, em dùng AWS Load Balancer Controller để Ingress tạo ALB và các route gRPC/TCP gắn NLB. Em chọn Gateway API cho dự án mới vì nó tách vai trò platform và app, hỗ trợ {{HTTPRoute/GRPCRoute}} và canary tốt hơn Ingress, dù Ingress vẫn rất phổ biến. Với workload như StatefulSet hay gRPC cần client-side load balancing, em dùng headless Service để DNS trả thẳng IP pod. Còn {{ExternalName}} em dùng như một alias khi migrate dependency ra ngoài, ví dụ trỏ tới RDS, giúp đổi hạ tầng mà không sửa cấu hình ứng dụng.

> Senior tip: quy tắc chi phí/độ an toàn: nội bộ = {{ClusterIP}}, HTTP public = 1 Ingress/Gateway gom nhiều route, chỉ dùng {{LoadBalancer}}/NodePort khi có lý do L4 cụ thể. Trên AWS, gắn {{target-type: ip}} với ALB để bỏ 1 hop NodePort; và luôn kiểm tra IAM IRSA + subnet tag khi LB "pending" — 80% lỗi nằm ở đó, không phải ở manifest Service.`,
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
  a: `**Tóm tắt:** Monitoring/observability hiện đại đứng trên 3 trụ cột dữ liệu — **metrics** (số đo theo thời gian), **logs** (sự kiện rời rạc), **traces** (đường đi một request qua nhiều service) — cộng 3 lớp vận hành: **dashboard** (nhìn), **alerting** (báo khi bất thường), **on-call** (con người phản ứng theo runbook). Luồng chuẩn: ứng dụng phát tín hiệu → agent/collector thu thập → hệ lưu trữ → truy vấn → dashboard/alert → on-call. Thiếu một trụ cột thì phát hiện được nhưng không truy ra nguyên nhân.

### Cái gì → vì sao cần → hoạt động thế nào
Giải thích từng khái niệm như cho người mới:
- **Metrics** (chỉ số): chuỗi số theo thời gian, ví dụ CPU 72%, RPS 1.200, latency p99 350 ms. Nhẹ, rẻ, hợp để vẽ xu hướng và đặt ngưỡng cảnh báo. Công cụ quen: Prometheus (lưu/truy vấn) + Grafana (vẽ).
- **Logs** (nhật ký): dòng chữ ghi "chuyện gì vừa xảy ra" kèm thời điểm, mức (INFO/ERROR), ngữ cảnh. Dùng để biết chi tiết lỗi (stack trace, tham số). Luồng thường: app ghi ra stdout → runtime ghi file → Fluent Bit (DaemonSet) đọc, parse, gắn nhãn → đẩy về Loki/Elasticsearch/CloudWatch Logs.
- **Traces** (vết phân tán): khi 1 request đi qua API → Order → Payment → DB, trace gắn cho nó một {{traceId}} duy nhất và mỗi bước là một {{span}} có thời gian; nhìn trace biết request chậm ở khúc nào. Chuẩn mở là **OpenTelemetry (OTel)**, backend thường là Tempo/Jaeger.
- **Alerting**: luật trên metrics/logs ("p99 > 1s trong 5 phút" hoặc "ERROR > 50/phút") → Alertmanager/PagerDuty gửi thông báo. **Dashboard**: bảng Grafana tổng hợp. **On-call**: lịch trực luân phiên, kèm **runbook** (sổ tay xử lý từng loại cảnh báo).

Liên kết 3 trụ cột nhờ **correlation id** ({{traceId}}): log có {{traceId}}, metric exemplar trỏ {{traceId}}, trace là nguồn gốc — bấm từ alert sang dashboard sang trace sang đúng dòng log.

~~~text
[App, OTel SDK] --metrics/logs/traces--> [OTel Collector / Prometheus scrape / Fluent Bit]
        -> [Lưu trữ: Prometheus|Mimir, Loki, Tempo]
        -> [Grafana truy vấn + Dashboard]
        -> [Rule Alert] -> [Alertmanager/PagerDuty] -> [On-call + runbook]
~~~

### Ví dụ đời thực
Tình huống (giả định): sàn thương mại, 20 service Java, ~25.000 RPS ban ngày. 11:05 latency checkout p99 vọt từ 180 ms lên 2,4 giây, tỉ lệ lỗi 3%. Alert "p99 > 1s 5 phút" (Alertmanager → PagerDuty) đánh thức on-call. Người trực mở dashboard: RPS bình thường nhưng latency chỉ tăng ở service Payment → nghi ngờ phụ thuộc. Bấm trace của một request chậm (traceId lấy từ log mẫu): span {{Payment → DB}} chiếm 2,1 giây. Lọc log theo {{traceId}} thấy {{timeout acquiring connection from pool}}; metric {{hikaricp_connections_pending}} tăng vọt. Nguyên nhân: pool DB Payment đặt {{maxPoolSize=10}} trong khi deploy mới tăng thread lên 80. Xử lý: nâng pool tạm lên 40, thêm PgBouncer, deploy lại trong 18 phút; p99 về 190 ms, lỗi về 0%. Toàn bộ điều tra mất 14 phút vì 3 trụ cột liên kết bằng {{traceId}}; nếu chỉ có metrics, team đã mất > 1 giờ mò từng service.

### Pitfall production
- **Chỉ có metrics, thiếu logs/traces**: biết "chậm" nhưng không biết "chậm ở đâu, vì sao".
- **Alert fatigue** (mệt vì cảnh báo): hàng chục alert ầm ĩ, đa số không cần hành động → on-call bắt đầu lờ, bỏ sót alert thật. Chỉ alert trên triệu chứng ảnh hưởng người dùng (SLO), gắn runbook.
- **Log không có cấu trúc/ngữ cảnh**: {{System.out.println}} không có {{traceId}}, {{userId}}, {{orderId}} → không lọc nổi.
- **Chi phí log phình**: giữ DEBUG 90 ngày cho hệ lớn có thể tốn hàng nghìn USD/tháng; cần retention phân tầng và sampling.
- **Dashboard đẹp nhưng không ai sở hữu**: không gắn team chịu trách nhiệm, không có alert đi kèm.

### Trả lời mẫu khi phỏng vấn
Em xây monitoring theo ba trụ cột. Metrics là số đo theo thời gian như RPS, latency p99, error rate — em dùng Prometheus và Grafana để phát hiện xu hướng và đặt alert, vì nó nhẹ và rẻ. Logs là sự kiện chi tiết để điều tra, em cho app ghi JSON ra stdout, Fluent Bit chạy dạng DaemonSet thu và đẩy về Loki, và luôn gắn {{traceId}} để lọc. Traces cho thấy một request đi qua những service nào và chậm ở đâu, em dùng OpenTelemetry SDK và collector đẩy về Tempo. Ba trụ cột nối với nhau bằng {{traceId}} nên từ một alert em có thể đi thẳng tới dashboard, rồi trace, rồi đúng dòng log. Trên lớp vận hành, em chỉ tạo alert gắn với triệu chứng ảnh hưởng người dùng và kèm runbook, để tránh alert fatigue cho người on-call. Ví dụ thực tế, nhờ traceId em từng khoanh vùng lỗi checkout xuống đúng span chờ connection pool DB trong chưa tới 15 phút. Theo em, monitoring tốt không phải nhiều biểu đồ, mà là rút ngắn được thời gian phát hiện và thời gian tìm nguyên nhân.

> Senior tip: đo monitoring bằng MTTD/MTTR, không phải bằng số dashboard. Ưu tiên chuẩn hóa OpenTelemetry (một bộ SDK cho metrics+logs+traces) để tránh khóa chặt vào nhà cung cấp, và áp dụng RED (Rate, Errors, Duration) cho service + USE (Utilization, Saturation, Errors) cho hạ tầng — đủ phủ 80% tình huống trước khi nghĩ tới thứ phức tạp hơn.`,
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
  a: `**Tóm tắt:** Có hai cách đưa dữ liệu giám sát về hệ thống: **pull** (Prometheus chủ động scrape endpoint {{/metrics}} của target theo chu kỳ) và **push** (ứng dụng/agent chủ động đẩy). Log thường đi theo push: **Fluent Bit** (DaemonSet, nhẹ) đọc file log trên node, parse, gắn nhãn, đẩy về Loki/Elasticsearch. Chi phí vận hành bị chi phối bởi **cardinality** — số tổ hợp nhãn (label) khác nhau của time series — và chính sách **retention** (giữ bao lâu).

### Cái gì → vì sao cần → hoạt động thế nào
**Pull (Prometheus scrape):** Prometheus giữ danh sách target (service discovery từ Kubernetes), định kỳ (ví dụ 15s) gửi HTTP GET tới {{/metrics}} để lấy số liệu định dạng text. Lợi ích: Prometheus biết target "chết" khi scrape fail; app chỉ cần mở endpoint, không cần biết địa chỉ hệ giám sát. Hạn chế: job chạy ngắn (batch/CronJob) có thể kết thúc trước khi bị scrape. **Push:** app đẩy dữ liệu đi. Dùng **Pushgateway** cho job ngắn, hoặc **OTLP** (giao thức OpenTelemetry) qua OTel Collector cho metrics/traces/logs chuẩn hóa — Collector trung gian giúp buffer, retry, đổi backend mà không sửa app.

**Fluent Bit DaemonSet:** DaemonSet = 1 pod mỗi node. Fluent Bit "đuôi" (tail) file {{/var/log/containers/*.log}} do container runtime ghi ra, **parse** (tách JSON, hoặc regex cho log text), **filter/enrich** (gắn metadata Kubernetes: pod, namespace, label), rồi **output** về Loki/Elasticsearch. Nó có bộ đệm và retry khi backend tạm ngưng.

**Retention & chi phí:** log giữ "nóng" 7–14 ngày để tra cứu nhanh, chuyển "lạnh" (S3/object storage) 30–90+ ngày; metrics giữ độ phân giải cao 15 ngày rồi downsample. **Cardinality** (độ đa trị nhãn): mỗi tổ hợp giá trị label tạo 1 **time series** riêng. Nhãn có giá trị bị chặn ({{status_code}} ~50 giá trị, {{endpoint}} đã chuẩn hóa ~200) thì ổn; nhãn như {{user_id}}, {{request_id}}, {{email}} có hàng triệu giá trị → "cardinality explosion" (bùng nổ series) làm Prometheus tốn RAM/disk, query chậm, thậm chí OOM.

| Nhãn | Số giá trị ước lượng | Cardinality | Đặt ở đâu |
|---|---|---|---|
| {{method}}, {{status}} | chục | an toàn | metric label |
| {{endpoint}} (đã chuẩn hóa, bỏ ID) | trăm | chấp nhận được | metric label |
| {{user_id}}, {{order_id}} | triệu | nổ | log/traces |
| {{trace_id}}, {{request_id}} | vô hạn | nổ | log/traces (correlation) |

### Ví dụ đời thực
Tình huống (giả định): hệ 10 service Spring Boot, 8.000 RPS, Prometheus giữ 15 ngày. Một dev thêm label {{user_id}} và {{path_raw}} (chứa {{/orders/12345}}) vào metric HTTP để "lọc cho tiện" — mỗi request sinh tổ hợp mới. Trong 6 giờ, active series tăng từ ~120.000 lên ~9.500.000; RAM Prometheus (cấp 8 GB) tăng vọt, process OOM-kill, mất 2 giờ dữ liệu metrics và alert im lặng đúng lúc có sự cố thật. Cách xử lý: (1) xóa 2 label gây nổ, chuẩn hóa {{path}} thành template /orders/{id}; (2) đẩy {{user_id/order_id}} vào log JSON và trace (có {{traceId}}); (3) đặt rule cảnh báo {{prometheus_tsdb_head_series}} > 1.000.000. Kết quả: series ổn định ~180.000, RAM Prometheus ~2,2 GB, chi phí lưu trữ giảm ~60%. Log chuyển sang Fluent Bit + Loki, giữ 14 ngày nóng + 60 ngày lạnh trên S3, tiết kiệm ~400 USD/tháng so với giữ full Elasticsearch.

### Pitfall production
- Gắn {{request_id/trace_id/user_id}} vào metric label: bùng nổ cardinality chắc chắn — đây là lỗi gặp nhiều nhất.
- Không đặt retention: log/metric tích lũy vô hạn, hóa đơn cloud tăng bất ngờ.
- Fluent Bit mất buffer khi node chết đột ngột: log trong bộ đệm RAM mất; bật {{storage.type filesystem}} nếu cần đảm bảo hơn (đánh đổi disk I/O).
- Sampling log (chỉ giữ 1%) tiết kiệm tiền nhưng có thể bỏ đúng dòng lỗi hiếm; giữ 100% log mức ERROR, sampling INFO/DEBUG.
- Parse log sai (regex không khớp sau khi đổi format): log rơi vào "unparsed", không query được theo field.

### Trả lời mẫu khi phỏng vấn
Em phân biệt rõ pull và push. Với metrics của service chạy lâu, em dùng Prometheus pull: service mở {{/metrics}} và Prometheus scrape theo chu kỳ, lợi ích là dễ phát hiện target down. Với job ngắn như CronJob, em dùng push qua Pushgateway hoặc gửi OTLP tới OpenTelemetry Collector, vì job có thể chết trước lần scrape tiếp theo. Với logs, em cho app ghi JSON ra stdout; Fluent Bit chạy dạng DaemonSet trên mỗi node, tail file container, parse và gắn metadata Kubernetes rồi đẩy về Loki, có buffer và retry khi backend lỗi. Về chi phí, em quản hai thứ: retention phân tầng (log nóng 7–14 ngày, lạnh lên object storage) và cardinality của metrics. Em chỉ đặt label có giá trị bị chặn như status code hay endpoint đã chuẩn hóa; những thứ định danh cao như {{user_id}} hay {{request_id}} em đưa vào logs và traces, gắn {{traceId}} để liên kết. Em từng xử lý một vụ bùng nổ series vì gắn {{user_id}} vào metric, Prometheus OOM và alert im lặng — từ đó em luôn đặt cảnh báo trên {{tsdb_head_series}}. Tóm lại, đúng kênh cho đúng loại dữ liệu là chìa khóa của chi phí và độ tin cậy.

> Senior tip: đặt "ngân sách cardinality" (ví dụ < 500k series/Prometheus) và alert trên {{prometheus_tsdb_head_series}} + {{scrape_duration_seconds}}; review label mới trong code review như review schema DB. Chuẩn hóa endpoint (/orders/{id}) ở tầng instrumentation hoặc dùng recording rule, đừng nhét giá trị thô vào label. Với log, giữ 100% ERROR, sampling có chủ đích cho INFO — và kiểm tra lại truy vết được sự cố hiếm trước khi bật sampling.`,
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
  a: `**Tóm tắt:** Scale app phải bám vào **điểm nghẽn thực tế** (bottleneck): CPU cho tác vụ tính toán, RPS/latency cho web, **queue lag** cho worker. Scale theo **RAM với JVM gần như luôn sai** vì heap cố định ({{-Xmx}}) và GC làm mức dùng dao động — RAM không phản ánh tải. Công cụ: **HPA** scale số pod theo metric (CPU/custom/external), **KEDA** scale theo sự kiện (queue lag, cron) và có thể scale về 0, **Cluster Autoscaler/Karpenter** thêm node khi pod bị pending.

### Cái gì → vì sao cần → hoạt động thế nào
**Bottleneck** (nút thắt cổ chai) là khâu chậm nhất quyết định tốc độ cả dây chuyền — thêm tài nguyên ở khâu khác không giúp. Nên đo end-to-end (LB → app → DB) trước khi chọn metric.

Vì sao **RAM với JVM sai**: JVM cấp heap gần cố định theo {{-Xmx}}. Sau khi heap lớn lên, mức RAM dùng ~ (heap + metaspace + off-heap + thread stack) và **không tăng tuyến tính theo RPS**; garbage collector (GC) dọn rác khiến đồ thị RAM dao động lên xuống. Đặt HPA theo RAM dẫn tới: scale lên muộn (heap đã "đầy" sẵn), hoặc scale lên/xuống vô nghĩa theo nhịp GC. Metric đúng hơn cho JVM web: CPU, RPS, latency p99, hoặc số request đang xử lý.

- **HPA (Horizontal Pod Autoscaler):** tính {{desiredReplicas = ceil(current * currentMetric / target)}}. Hỗ trợ metric CPU/memory (resource), custom (từ Prometheus Adapter), external. Yêu cầu {{resources.requests}} được khai báo đúng (đặc biệt CPU) vì % utilization tính trên request.
- **KEDA (Kubernetes Event-driven Autoscaling):** mở rộng HPA, có sẵn scaler cho Kafka lag, RabbitMQ, SQS, cron...; điểm mạnh là **scale to zero** khi không có việc (tiết kiệm) và scale lên khi có sự kiện.
- **Cluster Autoscaler:** thấy pod Pending vì thiếu tài nguyên node → thêm node (chậm, phút). **Karpenter** (AWS) provision node nhanh, chọn đúng loại instance theo nhu cầu pod, tận dụng spot tốt hơn.

### Ví dụ đời thực
Tình huống (giả định): service xử lý đơn hàng, 3 pod Spring Boot ({{-Xmx=2g}}, request CPU 500m), lưu DB RDS {{max_connections=150}}. Ban đầu HPA scale theo RAM target 75%: giờ cao điểm 12.000 RPS, RAM pod vẫn ~78% (heap cố định) nên HPA nhảy 3→10 pod theo dao động GC, nhưng latency p99 vẫn 1,8 giây — bottleneck thật là CPU serialize JSON và pool DB ({{Hikari maximumPoolSize=30/pod}}, 10 pod = 300 kết nối > 150). Sửa: (1) HPA theo CPU target 65% + custom metric RPS/pod (mục tiêu 800 RPS/pod, lấy từ Prometheus); (2) hạ pool còn 12/pod (10 pod × 12 = 120 < 150) và bật PgBouncer; (3) thêm KEDA cho consumer Kafka tính shipping theo {{lagThreshold=1000}} (scale 0→6). Kết quả: giờ cao điểm ổn định 8–9 pod, p99 220 ms, 0 lỗi {{too many connections}}; ban đêm consumer về 0 pod tiết kiệm ~35% chi phí compute worker.

### Pitfall production
- Scale pod nhưng quên **DB connection pool**: tổng {{pod * poolSize}} vượt {{max_connections}} → app lỗi kết nối, thêm pod làm tệ hơn. Luôn tính trần kết nối hoặc dùng pooler (PgBouncer/RDS Proxy).
- {{requests}} khai báo sai: request quá thấp → HPA nghĩ CPU % cao bất thường; request quá cao → lãng phí và node scale thừa.
- HPA + scale nhanh theo metric nhiễu → "flapping" (lên xuống liên tục); đặt {{stabilizationWindowSeconds}}.
- Cluster Autoscaler thêm node mất 2–5 phút; traffic tăng đột biến vẫn timeout trong lúc chờ — cần kết hợp headroom (buffer pod/node) hoặc Karpenter.
- KEDA scale to zero: request đầu tiên gặp cold start (vài chục giây với JVM) — chấp nhận được cho worker nền, không hợp API latency nhạy.

### Trả lời mẫu khi phỏng vấn
Khi quyết định scale, em luôn tìm bottleneck trước thay vì chọn metric theo thói quen. Với API tính toán, em scale theo CPU; với API web chịu tải, em thích RPS hoặc latency p99 vì nó phản ánh trải nghiệm người dùng. Với worker xử lý hàng đợi, em scale theo queue lag — ví dụ dùng KEDA đọc lag Kafka để scale ra và scale về 0 khi hết việc. Em đặc biệt tránh scale theo RAM với JVM, vì heap thường cố định theo {{-Xmx}} và GC làm mức dùng dao động, nên RAM không tương quan với tải và HPA sẽ phản ứng sai. Về công cụ, em dùng HPA cho pod với custom metric từ Prometheus, KEDA cho autoscaling theo sự kiện, và Cluster Autoscaler hoặc Karpenter để thêm node khi pod pending; Karpenter tiện hơn khi cần provision nhanh và chọn đúng loại instance. Một lỗi em luôn kiểm tra là nhân số pod với connection pool: scale out mà vượt {{max_connections}} của DB thì hệ thống gãy, nên em tính trần hoặc dùng PgBouncer. Quan điểm của em: scale đúng metric chỉ có ý nghĩa khi cả chuỗi phụ thuộc, đặc biệt là DB, cùng chịu được.

> Senior tip: đặt công thức an toàn trước khi bật autoscale: {{maxPods * poolSizePerPod <= DB_max_connections * 0,8}} và kiểm tra bằng load test. Kết hợp HPA (pod) + Karpenter (node) + buffer tối thiểu ({{minReplicas}} hoặc overprovisioning pod) để vừa tiết kiệm vừa chịu được burst; và nhớ JVM cold start vài chục giây nên API nhạy latency đừng scale về 0.`,
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
  a: `**Tóm tắt:** CI/CD đa repo (microservice, thư viện dùng chung) cần cơ chế một pipeline **gọi/kích hoạt** pipeline ở repo khác và truyền **đúng phiên bản artifact**. Ba hệ phổ biến: GitLab (parent-child, multi-project trigger), Jenkins (upstream/downstream), GitHub Actions ({{workflow_call}} tái sử dụng, {{repository_dispatch}} kích hoạt chéo). Nguyên tắc cốt lõi: truyền **image tag/version bất biến** qua container registry (contract giữa repo), không copy source/artifact ad-hoc; downstream fail phải có retry/rollback/alert và mọi bước deploy **idempotent**.

### Cái gì → vì sao cần → hoạt động thế nào
Khi hệ thống tách thành nhiều repo (service A, B, thư viện chung, manifest hạ tầng), một thay đổi có thể cần: build thư viện → build service dùng nó → deploy. Cần "đường ống nối ống".

- **GitLab CI:** {{parent-child pipeline}} ({{trigger: include: local/file}}) tách pipeline lớn trong cùng repo; **multi-project pipeline** ({{trigger: project: group/repo, branch}}) gọi pipeline repo khác, truyền biến qua {{variables}} (ví dụ {{IMAGE_TAG: $CI_COMMIT_SHA}}).
- **Jenkins:** job upstream chạy xong kích hoạt downstream; trao artifact bằng cách publish lên registry/Nexus hoặc (cũ hơn) Copy Artifact plugin. Hạn chế: cấu hình phân tán, khó theo dõi chuỗi.
- **GitHub Actions:** {{workflow_call}} = reusable workflow (gọi như hàm, cùng lúc/lồng ghép, truyền {{inputs/secrets}} rõ kiểu) — hợp để chuẩn hóa bước build/deploy. {{repository_dispatch}} = gửi event HTTP sang repo khác để kích hoạt workflow — hợp khi upstream chỉ biết "đã có version mới". {{workflow_run}} lắng nghe workflow khác hoàn tất.

Truyền artifact/version đúng cách: build ra image đẩy lên registry với tag **bất biến** ({{git SHA}} hoặc {{semver}}, tránh {{latest}}); downstream nhận tag và {{docker pull}}/{{helm --set image.tag=$TAG}}. Như vậy registry là **contract**: downstream không cần source của upstream.

| Cơ chế | Đồng bộ? | Truyền dữ liệu | Hợp khi |
|---|---|---|---|
| GitLab multi-project trigger | có (chờ/không chờ) | variables | điều phối deploy đa repo có kiểm soát |
| GitHub {{workflow_call}} | có | inputs/secrets có kiểu | tái dùng logic chuẩn (build/deploy) |
| GitHub {{repository_dispatch}} | không (fire event) | {{client_payload}} | upstream báo "có bản mới", repo đích tự quyết |
| Jenkins upstream/downstream | có | artifact/Nexus | hệ Jenkins sẵn có (cần chuẩn hóa) |

### Ví dụ đời thực
Tình huống (giả định): 9 repo service Java + 1 repo {{platform-deploy}} giữ Helm chart, 2–5 deploy/ngày. Luồng cũ: Jenkins upstream build service, copy JAR sang job downstream bằng plugin — 2 lần copy nhầm artifact cũ gây deploy sai version, mất 40 phút rollback. Luồng mới (GitHub Actions): repo service build image, tag {{app:<sha>}} + {{app:<semver>}}, push registry; gửi {{repository_dispatch}} (event {{image_published}}, payload {{service, tag, sha}}) sang {{platform-deploy}}; workflow deploy dùng đúng {{tag}} để {{helm upgrade}} và chạy smoke test. Downstream fail (smoke test lỗi) → workflow tự {{helm rollback}} về revision trước, gửi Slack, đánh dấu run fail (không auto-retry mù). 4 tháng, 180 deploy: 0 nhầm version, 3 rollback tự động trung bình 90 giây, thời gian truy vết "đang chạy version nào" = tra tag trên registry/pod (vài giây).

### Pitfall production
- **Coupling chặt**: upstream chờ đồng bộ chuỗi 5 repo → 1 repo flaky làm kẹt cả dây chuyền; chỉ đồng bộ ở điểm thật sự cần (deploy), còn lại bất đồng bộ.
- Dùng tag {{latest}}: downstream kéo nhầm bản mới build giữa chừng → không tái lập được, không rollback chính xác.
- **Secret sprawl**: mỗi repo giữ credential registry/cluster riêng, xoay key khổ; dùng OIDC (GitHub→cloud) hoặc secret tập trung có phạm vi hẹp.
- Downstream fail nhưng upstream đã báo xanh: mất tín hiệu; nếu cần "gating", dùng trigger có chờ ({{strategy: depend}} trên GitLab) hoặc cơ chế promote.
- Retry deploy không idempotent: tạo tài nguyên trùng, lệch trạng thái. {{helm upgrade --install}} và manifest idempotent là bắt buộc.

### Trả lời mẫu khi phỏng vấn
Với hệ nhiều repo, em coi container registry là hợp đồng giữa các pipeline. Repo upstream build và đẩy image với tag bất biến theo git SHA hoặc semver, rồi mới kích hoạt downstream; downstream chỉ nhận tag và deploy, không chạm vào source hay copy artifact ad-hoc. Trên GitHub Actions, em dùng {{workflow_call}} để tái sử dụng các bước build/deploy chuẩn có kiểu {{inputs/secrets}} rõ ràng, và dùng {{repository_dispatch}} khi một repo chỉ cần báo "đã phát hành version mới" để repo deploy tự chạy. Trên GitLab, em dùng multi-project trigger và truyền {{IMAGE_TAG}} qua variables; trên Jenkins là upstream/downstream nhưng em ưu tiên publish artifact lên registry thay vì Copy Artifact. Về xử lý lỗi, downstream fail thì gửi alert, chặn promote, và tự rollback về revision trước; mọi bước deploy phải idempotent nên retry an toàn. Em tránh coupling đồng bộ chuỗi dài và tuyệt đối tránh tag {{latest}}, vì nó làm mất khả năng tái lập và rollback. Mục tiêu của em là luôn trả lời được "production đang chạy đúng commit nào" chỉ bằng cách nhìn image tag.

> Senior tip: "build một lần, promote cùng artifact" qua các môi trường (dev→staging→prod) — chỉ đổi config, không build lại, để đảm bảo bản test chính là bản chạy. Ghi {{sha}} + {{tag}} vào metadata deploy (annotation/label) để truy vết; và dùng OIDC cấp credential ngắn hạn cho pipeline thay vì secret dài hạn nằm rải rác trong nhiều repo.`,
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
  a: `**Tóm tắt:** **Terraform** và **Ansible** giải hai bài toán khác tầng: Terraform lo **provisioning** (dựng/cấp phát hạ tầng: VPC, EC2, RDS, cụm K8s) theo kiểu khai báo (declarative) và giữ **state** để biết thực tế đang có gì; Ansible lo **configuration management** (cài đặt/cấu hình phần mềm trên máy đã có: package, user, file cấu hình, service) theo playbook, **agentless** qua SSH, và dựa vào module **idempotent**. Chúng bổ trợ nhau: Terraform tạo hạ tầng → xuất inventory/IP → Ansible cấu hình phần mềm.

### Cái gì → vì sao cần → hoạt động thế nào
**Provisioning** (cấp phát) trả lời "có những tài nguyên nào": máy chủ, mạng, load balancer, database quản lý. **Configuration management** (quản lý cấu hình) trả lời "trên tài nguyên đó chạy gì, cấu hình ra sao". Trộn lẫn hai việc bằng một công cụ thường khó bảo trì.

- **Terraform (HCL, declarative):** bạn mô tả *trạng thái mong muốn* của hạ tầng; Terraform tính kế hoạch ({{plan}}) so với **state file** (bản đồ tài nguyên đang quản lý), rồi {{apply}} để tạo/sửa/xóa. State nên lưu xa (S3 + DynamoDB lock) để làm việc nhóm an toàn. Điểm mạnh: quản lý vòng đời hạ tầng, phát hiện drift.
- **Ansible (YAML playbook, agentless):** điều khiển máy đích qua SSH/WinRM, không cần cài agent. **Inventory** là danh sách host/group (file tĩnh hoặc **dynamic inventory** lấy từ Terraform output/cloud). **Playbook** gồm các task gọi **module** ({{apt}}, {{template}}, {{systemd}}, {{user}}); module viết sẵn để idempotent — "đảm bảo gói có mặt, bản đúng" — nên chạy lại không đổi nếu đã đúng. Lưu ý: idempotency đến từ *module*, không tự có nếu bạn dùng task {{shell/command}} bừa bãi.
- **Idempotent** (lũy đẳng): chạy 1 lần hay N lần cho cùng kết quả, không gây tác dụng phụ lặp.

~~~text
[Terraform] --plan/apply--> [VPC, EC2, SG, RDS] --output (IP, endpoint)-->
[dynamic inventory] --> [Ansible playbook] --SSH--> [cài JDK, deploy app, cấu hình systemd]
~~~

| Tiêu chí | Terraform | Ansible |
|---|---|---|
| Mục tiêu | provisioning hạ tầng | cấu hình phần mềm/OS |
| Mô hình | declarative + state | playbook (task), agentless SSH |
| Điểm mạnh | vòng đời tài nguyên, plan/preview | cấu hình chi tiết, ad-hoc, idempotent module |
| Điểm yếu | cấu hình sâu trong OS kém linh hoạt | không quản lý state hạ tầng, khó phát hiện drift infra |

### Ví dụ đời thực
Tình huống (giả định): dựng môi trường staging cho app Java (2 EC2, 1 RDS PostgreSQL, 1 ALB) trên AWS. Terraform (state S3 + DynamoDB lock, 3 người cùng sửa qua PR) {{apply}} tạo hạ tầng trong ~6 phút, xuất {{private_ip}} 2 EC2 và endpoint RDS. Ansible dùng dynamic inventory đọc output đó, chạy playbook: cài JDK 21, tạo user {{app}}, render {{application.yml}} (endpoint RDS), cài service {{systemd}}, bật {{firewalld}} — mất ~4 phút. Chạy lại playbook lần 2: Ansible báo {{changed=0}} (idempotent). Một lần đổi {{instance_type}}: Terraform {{plan}} hiện đúng 1 thay đổi, {{apply}} thay máy; Ansible chạy lại cấu hình. So với cách cũ "SSH tay + ghi chú wiki", thời gian dựng lại staging giảm từ nửa ngày xuống ~15 phút, và 2 lần "quên mở port" biến mất vì security group nằm trong Terraform, được review như code.

### Pitfall production
- Terraform state lưu local/không lock: 2 người {{apply}} cùng lúc → hỏng state, tài nguyên mồ côi; luôn dùng remote backend + locking.
- Ansible task dùng {{shell}} tùy tiện: mất idempotency (chạy lại thêm dòng trùng vào file, restart không cần thiết); ưu tiên module ({{lineinfile}}, {{template}}), dùng {{creates/removes}} nếu buộc phải shell.
- Hardcode IP trong inventory: hạ tầng đổi là hỏng; dùng dynamic inventory.
- Quản lý secret (mật khẩu DB, key): đừng commit plaintext; dùng Ansible Vault, SSM Parameter Store, hoặc truyền từ Terraform sensitive output qua kênh an toàn.
- "Dùng Ansible tạo hạ tầng" hoặc "dùng Terraform cài từng gói trong VM": làm được nhưng đau — tool lệch mục tiêu.

### Trả lời mẫu khi phỏng vấn
Em phân tách Terraform và Ansible theo tầng trách nhiệm. Terraform em dùng cho provisioning hạ tầng: VPC, máy chủ, security group, RDS, cụm Kubernetes. Nó khai báo trạng thái mong muốn, có {{plan}} để xem trước và giữ state — em luôn đặt state trên remote backend có lock — nên quản lý được vòng đời tài nguyên và phát hiện drift. Ansible em dùng cho configuration management trên máy đã có: cài JDK, tạo user, render file cấu hình, quản lý service systemd. Ansible agentless qua SSH và em dựa vào các module idempotent, nên chạy playbook nhiều lần vẫn an toàn; em tránh lạm dụng {{shell}} vì nó làm mất idempotency. Trong thực tế em dùng cả hai: Terraform {{apply}} tạo hạ tầng và xuất output, Ansible lấy dynamic inventory từ output đó để cấu hình. Cách tách này giúp hạ tầng được review như code, còn cấu hình phần mềm lặp lại được. Với workload bất biến trên cloud, em cũng cân nhắc cloud-init hoặc image dựng sẵn (Packer) thay cho Ansible dài, tùy mức độ cần thay đổi sau khi cấp máy.

> Senior tip: đường biên thực dụng: "tạo/xóa tài nguyên cloud" = Terraform, "trạng thái bên trong OS" = Ansible/Packer/cloud-init. Kiểm tra idempotency của Ansible bằng cách chạy playbook 2 lần — lần hai phải {{changed=0}}; và đừng để Terraform state chứa secret dạng plaintext (bật {{sensitive}}, mã hóa backend). Hai công cụ phối hợp tốt khi output của bên này là đầu vào có cấu trúc của bên kia, không dán thủ công.`,
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
  a: `**Tóm tắt:** Load test trước go-live chỉ có giá trị khi trả lời được câu hỏi kinh doanh: "chịu được tải dự kiến × hệ số an toàn với p99 và tỉ lệ lỗi trong SLO không, và **cái gì gãy đầu tiên**?". Tôi định nghĩa mục tiêu từ số liệu thật, dựng môi trường cùng topology với production, chạy theo bậc (baseline → load → stress → soak → spike), theo dõi **USE** (utilization, saturation, errors) của từng tầng: load balancer, node, pool connection, DB.

### Bước 1 — Mục tiêu đo được
- Lấy từ số liệu: peak hiện tại hoặc dự báo marketing, nhân hệ số 2–3 cho ngày đặc biệt. Ví dụ: 1.200 request/giây, p99 < 400ms, lỗi < 0,1%.
- **Mô hình tải** theo hành vi thật: 70% xem sản phẩm, 20% tìm kiếm, 8% thêm giỏ, 2% thanh toán — không bắn một endpoint duy nhất.

### Bước 2 — Môi trường
- Cùng loại instance, cùng số tầng (LB → ingress → app → pool → DB), cùng cấu hình JVM và giới hạn container; có thể nhỏ hơn về số node nhưng phải biết tỉ lệ để ngoại suy.
- Dữ liệu cỡ thật: DB 50GB với 5GB làm planner chọn plan khác, cache hit rate khác.
- Dependency bên ngoài (cổng thanh toán, SMS) thay bằng mock có độ trễ giống thật — không bắn tải vào đối tác.
- Máy sinh tải đủ mạnh và phân tán: một máy k6 bị nghẽn CPU sẽ cho số liệu sai.

### Bước 3 — Các loại test
| Loại | Mục đích | Ví dụ |
|---|---|---|
| Load | Đạt mục tiêu ổn định không | 1.200 rps trong 30 phút |
| Stress | Điểm gãy và cách gãy | Tăng 10% mỗi 5 phút đến khi lỗi |
| Spike | Đột biến, autoscaling kịp không | 200 → 2.000 rps trong 30 giây |
| Soak | Leak, tăng dần theo thời gian | 70% tải trong 8–12 giờ |

~~~javascript
// k6: tăng dần và tự đánh giá đạt/không đạt theo SLO
export const options = {
  stages: [{ duration: '5m', target: 600 }, { duration: '20m', target: 1200 }, { duration: '5m', target: 0 }],
  thresholds: { http_req_duration: ['p(99)<400'], http_req_failed: ['rate<0.001'] },
};
~~~

### Bước 4 — Tìm bottleneck theo tầng
- **Load balancer/ingress**: số connection, lỗi 502/504, thời gian TLS handshake, giới hạn connection của ingress controller.
- **Node**: CPU throttling, memory pressure, conntrack table, băng thông mạng.
- **App**: thread pool (Tomcat busy threads), GC pause, Hikari pending.
- **DB**: số connection, top query ({{pg_stat_statements}}), lock wait, IOPS, replica lag.
Quy tắc: tài nguyên **bão hoà** (saturation) đầu tiên — hàng đợi bắt đầu tăng — chính là bottleneck, không phải tài nguyên có % cao nhất.

### Ví dụ đời thực
Trước đợt mở bán vé concert, mục tiêu 3.000 rps cho API giữ chỗ. Lần chạy đầu gãy ở 900 rps: p99 vọt lên 6s nhưng CPU app chỉ 35%. Metric cho thấy Hikari pending 200+ và DB đạt giới hạn {{max_connections}} = 300 vì 30 pod × pool 10. Thêm PgBouncer (transaction mode), giảm pool mỗi pod xuống 6, sửa một query thiếu index: lần hai đạt 3.400 rps, p99 280ms. Soak test 10 giờ phát hiện heap tăng đều do cache không giới hạn — sửa trước ngày mở bán. Ngày thật đạt peak 2.700 rps, không lỗi.

### Pitfall
- Bắn tải từ một máy, hoặc từ cùng mạng nội bộ không qua LB thật.
- Không warm-up JVM; đo luôn cả giai đoạn JIT biên dịch.
- Chỉ nhìn trung bình; bỏ qua p99 và tỉ lệ lỗi.
- Quên giới hạn của bên thứ ba (rate limit cổng thanh toán) → production gãy chỗ chưa test.

### Trả lời mẫu khi phỏng vấn
"Trước go-live tôi bắt đầu từ mục tiêu đo được: tải peak dự kiến nhân hệ số an toàn, cùng ngưỡng p99 và tỉ lệ lỗi, và một mô hình tải giống hành vi người dùng thật chứ không bắn một endpoint. Môi trường phải cùng topology với production: cùng loại instance, cùng giới hạn container, dữ liệu cỡ thật, dependency bên ngoài thay bằng mock có độ trễ giống thật. Tôi chạy theo bậc: load test ở mức mục tiêu, stress để tìm điểm gãy, spike để xem autoscaling, và soak nhiều giờ để bắt leak. Trong lúc chạy tôi theo dõi từng tầng, từ load balancer, node, thread pool, connection pool đến DB, và tìm tài nguyên bão hoà đầu tiên, tức là chỗ hàng đợi bắt đầu tăng. Một lần CPU app chỉ 35% mà p99 lên 6 giây; nguyên nhân là tổng pool của 30 pod vượt max_connections của DB. Thêm PgBouncer và giảm pool là đạt mục tiêu."

> Senior tip: lưu kết quả mỗi lần load test (rps tối đa, p99, tài nguyên gãy đầu tiên) thành bảng lịch sử và chạy lại sau mỗi thay đổi lớn. Khi capacity giảm 20% giữa hai release, bạn biết ngay trước khi người dùng biết.`,
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
},
{
  id: 'devops-080',
  topic: 'devops',
  level: 'mid',
  q: 'Làm sao để chạy một ứng dụng Java (Spring Boot) như một dịch vụ hệ thống trên Linux bằng systemd, và làm sao kiểm tra/log khi nó không khởi động?',
  a: `**Tóm tắt:** Để app Java chạy liên tục sau khi reboot và tự khởi động lại khi lỗi, ta viết một file unit systemd (ví dụ {{loan-service.service}}) đặt tại {{/etc/systemd/system/}}, chạy app dưới một user riêng (không dùng root), rồi dùng {{systemctl enable --now}}. Khi lỗi, xem log bằng {{journalctl -u loan-service}} và kiểm tra trạng thái bằng {{systemctl status}}.

### Thuật ngữ (giải thích lần đầu)
- **systemd**: trình quản lý dịch vụ và khởi động của Linux hiện đại (thay SysV init cũ). Lệnh chính là {{systemctl}}.
- **Unit file**: file cấu hình (.service) mô tả systemd cách chạy dịch vụ, khi nào restart, user nào, giới hạn tài nguyên.
- **User/group riêng**: tạo user dedicate (ví dụ {{loansvc}}) để app chạy, hạn chế thiệt hại nếu app bị xâm nhập (không chạy như root).
- **journalctl**: lệnh xem log hệ thống/dịch vụ đã được systemd thu thập.
- **Load average / free / iostat / ss**: các lệnh chẩn đoán server chậm (xem CPU, RAM, ổ đĩa, kết nối mạng).

### Cách làm từng bước

**Bước 1 — Tạo user và thư mục**
~~~bash
sudo useradd -r -s /bin/false loansvc
sudo mkdir -p /opt/loan-service /var/log/loan-service
sudo chown -R loansvc:loansvc /opt/loan-service /var/log/loan-service
~~~
Giải thích: {{-r}} tạo system user, {{-s /bin/false}} không cho đăng nhập interactively. App chạy dưới {{loansvc}}.

**Bước 2 — Viết unit file** ({{/etc/systemd/system/loan-service.service}})
~~~yaml
[Unit]
Description=Loan Service Java App
After=network.target

[Service]
Type=simple
User=loansvc
Group=loansvc
WorkingDirectory=/opt/loan-service
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1g loan-service.jar
Restart=always
RestartSec=5
StandardOutput=append:/var/log/loan-service/app.log
StandardError=append:/var/log/loan-service/error.log

[Install]
WantedBy=multi-user.target
~~~
Giải thích từng dòng:
- **Type=simple**: systemd coi dịch vụ đã khởi động ngay khi process bắt đầu.
- **Restart=always**: tự khởi động lại nếu process chết (không kể exit code). Dùng {{on-failure}} nếu chỉ restart khi lỗi.
- **RestartSec=5**: chờ 5 giây trước khi restart, tránh restart liên tục quá nhanh.
- **StandardOutput/StandardError=append:**: ghi log ra file thay vì journald, dễ đọc khi troubleshooting.
- **WantedBy=multi-user.target**: bật dịch vụ khi hệ thống vào multi-user mode (máy chủ thông thường).

**Bước 3 — Nạp và khởi động**
~~~bash
sudo systemctl daemon-reload
sudo systemctl enable loan-service      # tự chạy khi boot
sudo systemctl start loan-service       # chạy ngay
sudo systemctl status loan-service      # xem trạng thái
~~~
{{daemon-reload}} bắt buộc sau khi sửa unit file.

**Bước 4 — Xem log khi lỗi**
~~~bash
sudo journalctl -u loan-service -n 100          # 100 dòng cuối
sudo journalctl -u loan-service --since "1 hour ago"
sudo journalctl -u loan-service -f              # theo dõi real-time
~~~

### Trên production
- Nếu app khởi động rồi lập tức chết, thường do sai quyền file (jar không đọc được), thiếu biến môi trường (thêm {{Environment=SPRING_PROFILES_ACTIVE=prod}} vào [Service]), hoặc port đã bị chiếm ({{ss -tlnp | grep :8080}}).
- Giới hạn tài nguyên: thêm vào [Service]: {{MemoryMax=2G}}, {{CPUQuota=50%}}, {{LimitNOFILE=65536}} (số file mở tối đa, quan trọng với kết nối DB nhiều).
- Không sửa unit file trực tiếp rồi quên {{daemon-reload}} → systemd vẫn dùng cấu hình cũ.

### Bảng so sánh
| Lệnh | Dùng khi nào | Lưu ý |
|---|---|---|
| systemctl status | xem dịch vụ đang chạy, lỗi, PID | Có trạng thái active/inactive/failed |
| journalctl -u <tên> | xem log dịch vụ | Cần {{-f}} để theo dõi liên tục |
| free -h | xem RAM còn trống | Dùng để quyết định {{-Xmx}} cho Java |
| iostat -x 1 | xem ổ đĩa bị nghẽn | Cần cài {{sysstat}} |
| ss -tlnp | xem port đang listen và process | Thay netstat, cần quyền root để xem PID |
| uptime | xem load average | 3 số là trung bình 1/5/15 phút |

> Senior tip: Trên production, đừng để app chạy dưới root. Nếu app cần bind port dưới 1024 (ví dụ 80/443), hãy dùng {{setcap cap_net_bind_service=+ep}} trên java binary hoặc để reverse proxy (Nginx) lắng nghe port 80/443 rồi chuyển tiếp qua port 8080 (app chạy port cao, an toàn hơn).`,
  follow: ['Khi app Java khởi động rồi lập tức died, bạn kiểm tra thứ tự gì đầu tiên? (gợi ý: journalctl, systemctl status, quyền file, port đã chiếm chưa)', 'Tại sao nên đặt Restart=always nhưng kèm RestartSec, thay vì để systemctl restart liên tục không chờ?', 'Làm sao giới hạn RAM cho Java service trên Linux tránh OOM Kill? (gợi ý: -Xmx, MemoryMax, cgroup)'],
  tags: ['linux', 'systemd', 'java-service', 'journalctl', 'troubleshooting']
},
{
  id: 'devops-081',
  topic: 'devops',
  level: 'mid',
  q: 'Bảo mật SSH trên server Linux thực tế như thế nào: dùng khóa thay mật khẩu, tắt đăng nhập root, giới hạn cổng và user, fail2ban, và bastion/jump host là gì?',
  a: `**Tóm tắt:** SSH là cổng vào chính của server, nên phải cứng rắn: dùng khóa SSH thay mật khẩu, tắt đăng nhập root, giới hạn user được phép đăng nhập, dùng fail2ban chặn brute-force, và qua bastion/jump host thay vì để server đính trực tiếp Internet. Mỗi biện pháp chặn một loại tấn công phổ biến.

### Thuật ngữ (giải thích lần đầu)
- **SSH (Secure Shell)**: giao thức từ xa mã hóa để quản lý server Linux qua dòng lệnh.
- **Khóa SSH (SSH key)**: cặp khóa công/khai (public/private key). Khóa private giữ trên máy mình, khóa public đặt trên server. An toàn hơn mật khẩu vì không bị brute-force và không gửi mật khẩu qua mạng.
- **fail2ban**: dịch vụ giám sát log, chặn tự động địa chỉ IP sai mật khẩu quá nhiều lần.
- **Bastion / jump host**: server trung gian được bảo vệ chặt chẽ (hardened), nằm ở cửa vào, dùng để ssh vào các server bên trong không nối trực tiếp Internet.
- **ProxyJump**: tùy chọn SSH để qua một bastion tự động, không cần ssh hai lần thủ công.

### Cách làm từng bước

**Bước 1 — Tạo khóa SSH trên máy dev**
~~~bash
ssh-keygen -t ed25519 -C "dev@company.com" -f ~/.ssh/id_ed25519_company
~~~
Sinh cặp khóa Ed25519 (hiện đại, ngắn, an toàn). Không nhập passphrase nếu muốn không gõ mỗi lần (hoặc dùng ssh-agent để nhớ passphrase).

**Bước 2 — Đẩy khóa public lên server**
~~~bash
ssh-copy-id -i ~/.ssh/id_ed25519_company.pub loansvc@server-ip
~~~
Thêm khóa public vào {{~/.ssh/authorized_keys}} của user {{loansvc}} trên server.

**Bước 3 — Cứng rắn sshd_config** ({{/etc/ssh/sshd_config}})
~~~text
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers loansvc deploy
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 3
~~~
Giải thích:
- **Port 2222**: chuyển khỏi port 22 mặc định để giảm log bị bot quét (bảo mật bằng sự mờ, không phải biện pháp chính nhưng hữu ích).
- **PermitRootLogin no**: cấm root đăng nhập trực tiếp, phải dùng user thường rồi {{sudo}} nếu cần quyền cao.
- **PasswordAuthentication no**: chỉ cho phép khóa SSH, chặn brute-force mật khẩu.
- **AllowUsers loansvc deploy**: chỉ liệt kê user được phép, chặn tất cả user khác.
- **MaxAuthTries 3**: tối đa 3 lần thử xác thực, sau đó ngắt kết nối.
- **ClientAliveInterval/CountMax**: giữ kết nối không bị cut khi im lặng.

Sau khi sửa, khởi động lại: {{sudo systemctl restart sshd}}. **Hãy giữ một session SSH đang mở để kiểm tra trước khi đóng session cũ**, tránh bị khóa ngoài.

**Bước 4 — Cài fail2ban**
~~~bash
sudo apt install fail2ban   # Debian/Ubuntu
~~~
Tạo file {{/etc/fail2ban/jail.local}}:
~~~text
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 1h
findtime = 10m
~~~
Khởi động lại fail2ban. Nó sẽ chặn IP sai quá 3 lần trong 10 phút trong 1 giờ.

**Bước 5 — Bastion và ProxyJump**
Nếu server app không đính Internet, đặt nó trong private subnet, chỉ bastion đính Internet. Từ máy dev:
~~~bash
ssh -J bastion-user@bastion-ip loansvc@app-private-ip
~~~
Hoặc thêm vào {{~/.ssh/config}}:
~~~text
Host app
  HostName app-private-ip
  User loansvc
  ProxyJump bastion-user@bastion-ip
  IdentityFile ~/.ssh/id_ed25519_company
~~~
Rồi chỉ cần {{ssh app}}.

### Trên production
- Không bao giờ cho phép PasswordAuthentication trên server production.
- Giữ bastion tối giản: chỉ cài SSH, không cài web server, không deploy app, giữ OS và SSH patch mới nhất.
- Gọi lệnh qua bastion để triển khai/patch: {{ssh -J bastion user@app sudo systemctl restart loan-service}}.
- Hạ thu khóa của nhân viên nghỉ việc khỏi {{authorized_keys}} ngay lập tức.

### Bảng so sánh
| Biện pháp | Chặn tấn công nào | Chi phí triển khai |
|---|---|---|
| Khóa SSH (không mật khẩu) | Brute-force mật khẩu, stealing password | Trung bình (quản lý khóa) |
| PermitRootLogin no | L root trực tiếp, leo thang quyền | Thấp |
| AllowUsers | Đăng nhập của user không mong muốn | Thấp |
| fail2ban | Brute-force SSH, quét port | Thấp |
| Bastion/ProxyJump | Server đính Internet bị tấn công trực tiếp | Trung bình (dùng thêm server) |

> Senior tip: Trên production, hãy centralized tập hợp public key của team vào một repos và dùng công cụ (ví dụ Ansible, Terraform, hoặc ssh-ca) để đẩy/thu hồi khóa tự động. Cứ thủ công sửa {{authorized_keys}} trên mỗi server sẽ sớm rối và khóa cũ không bao giờ bị xoá. Ghi log mọi phiên SSH ({{/var/log/auth.log}}) và gửi về SIEM để kiểm tra khi có sự cố.`,
  follow: ['Tại sao nên dùng khóa SSH thay vì mật khẩu trên server production?', 'Làm sao kiểm tra xem fail2ban đã chặn IP nào chưa? (gợi ý: fail2ban-client status sshd)', 'Khi không thể ssh vào server, bạn kiểm tra thứ tự gì: sshd đang chạy, port, firewall, hay khóa sai?'],
  tags: ['ssh', 'security', 'fail2ban', 'bastion', 'proxyjump']
},
{
  id: 'devops-082',
  topic: 'devops',
  level: 'senior',
  q: 'Networking cơ bản mà dev Java backend cần biết: mô hình OSI, NAT, DNS (A/CNAME/TTL, tại sao đổi DNS chưa có hiệu lực ngay), HTTP/HTTPS + TLS handshake, và chứng chỉ SSL hết hạn gây thế nào?',
  a: `**Tóm tắt:** Networking là lớp dưới cùng mà mọi dịch vụ Java đều dựa vào. Dev cần hiểu OSI để biết lỗi nằm ở tầng nào, NAT/DNS để hiểu vì sao dịch vụ gọi không đúng đích hoặc đổi DNS chưa có tác dụng, và TLS/HTTPS để hiểu vì sao chiam API bị lỗi "certificate expired" hoặc handshake chậm.

### Thuật ngữ (giải thích lần đầu)
- **OSI (Open Systems Interconnection)**: mô hình 7 tầng chia mạng (Physical, Data Link, Network, Transport, Session, Presentation, Application). HTTP ở tầng Application, TCP ở Transport, IP ở Network.
- **NAT (Network Address Translation)**: dịch private IP của máy trong nội bộ thành public IP của router khi đi ra Internet, và ngược lại. Các máy trong cùng VPC/nội bộ dùng private IP, ra ngoài dùng public IP của NAT gateway.
- **DNS (Domain Name System)**: dịch tên miền ({{api.company.com}}) thành IP. **A record** trỏ tên tới IP, **CNAME** trỏ tên tới tên khác, **TTL** (Time to Live) là thời gian bản ghi được cache (giây). Đổi DNS chưa có hiệu lực vì client/ISP vẫn cache bản ghi cũ theo TTL.
- **TLS (Transport Layer Security)**: mã hóa kết nối HTTP thành HTTPS. TLS handshake là quá trình client/server thương lượng khóa mã hóa trước khi truyền dữ liệu.
- **Chứng chỉ SSL/TLS**: file số đánh giá chủ sở hữu công khai, có ngày hết hạn. Hết hạn → trình duyệt/API client báo lỗi, kết nối bị từ chối.

### Cách làm từng bước

**DNS: kiểm tra và hiểu TTL**
~~~bash
dig api.company.com +noall +answer
nslookup api.company.com
~~~
Kết quả A record có TTL (ví dụ 300 giây = 5 phút). Nếu đổi IP rồi vẫn gọi sai, đó là vì TTL chưa hết hoặc client/ISP cache. Cách xử lý: giảm TTL trước khi đổi (ví dụ 60 giây), chờ một TTL cũ, rồi mới đổi IP. Dùng {{dig +trace}} để xem quy trình phân giải từng cấp.

**TLS handshake: các bước**
1. Client gửi {{ClientHello}} (phiên bản TLS, cipher hỗ trợ).
2. Server gửi {{ServerHello}}, chứng chỉ (public key), có thể yêu cầu client cert.
3. Client xác minh chứng chỉ (CA roots), sinh pre-master secret, mã hóa bằng public key của server, gửi lại.
4. Cả hai sinh session key từ pre-master secret, mã hóa dữ liệu sau này bằng session key.
Handshake tốn hai vòng_network (round trip) trở nên chậm khi latency cao (ví dụ gọi chéo lục địa qua VPN). Dùng HTTP keep-alive / connection pool để tái dùng kết nối, tránh handshake mỗi request.

**Chứng chỉ hết hạn**
Kiểm tra ngày hết hạn:
~~~bash
echo | openssl s_client -connect api.company.com:443 2>/dev/null | openssl x509 -noout -dates
~~~
Output có {{notBefore}} và {{notAfter}}. Nếu {{notAfter}} đã qua, client nhận lỗi {{certificate expired}}. Cách khắc phục: renew chứng chỉ (Let's Encrypt: {{certbot renew}}, hoặc qua AWS ACM/Cloudflare tự động), rồi reload dịch vụ (Nginx/Java keystore). Theo dõi bằng monitoring (cảnh báo trước 30/14/7 ngày).

**NAT: khi nào dùng**
Máy trong private subnet không có public IP, muốn gọi API bên ngoài → đi qua NAT gateway. Nhưng gọi service cùng VPC qua NAT là sai thiết kế (thêm chi phí, latency). Dùng VPC endpoint (S3, DynamoDB) hoặc private link thay vì NAT cho traffic nội bộ.

### Trên production
- Lỗi "certificate expired" thường do quên renew hoặc CI không deploy cert mới. Hãy tự động hóa renew và alert sớm.
- TLS handshake chậm → kiểm tra latency giữa client/server, bật keep-alive, dùng connection pool (HikariCP cho DB, HttpClient cho REST).
- DNS đổi chưa có hiệu lực → kiểm tra TTL, flush cache ({{ipconfig /flushdns}} trên Windows, {{systemd-resolve --flush-caches}} trên Linux), xem log CoreDNS nếu trong K8s.
- Gọi API bị timeout → dùng {{traceroute}} / {{mtr}} để xem tầng nào bị chậm, kiểm tra security group/NACL (firewall) và NAT gateway.

### Bảng so sánh
| Khái niệm | Tầng OSI | Dùng để |
|---|---|---|
| IP / NAT | Network | định vị máy, dịch private↔public IP |
| TCP / TLS | Transport | kết nối đáng tin cậy, mã hóa |
| HTTP / HTTPS | Application | giao thức ứng dụng web/API |
| DNS | Application | dịch tên thành IP |

> Senior tip: Khi debugging "gọi API lỗi", đừng tưởng là do code Java lỗi. Hãy phân lớp: {{ping}} (ICMP, có thể bị chặn), {{telnet host port}} / {{nc -vz host port}} (kiểm tra TCP port mở), {{curl -v}} (xem TLS handshake và HTTP response), {{dig}} (DNS). Lỗi thường nằm ở security group chặn port, cert hết hạn, hoặc DNS trỏ sai, chứ không phải code.`,
  follow: ['TTL là gì và tại sao đổi DNS/IP chưa có hiệu lực ngay lập tức?', 'TLS handshake tốn bao lâu và làm sao giảm chi phí handshake trên đường gọi cao latency?', 'Chứng chỉ SSL hết hạn thì ứng dụng Java client gọi HTTPS bị lỗi gì, bạn khắc phục thế nào?'],
  tags: ['networking', 'osi', 'nat', 'dns', 'tls', 'ssl-certificate']
},
{
  id: 'devops-083',
  topic: 'devops',
  level: 'senior',
  q: 'Reverse proxy và load balancer (Nginx/HAProxy) đặt trước ứng dụng Java: cấu hình health check, sticky session, timeout, và header X-Forwarded-* dùng để làm gì?',
  a: `**Tóm tắt:** Reverse proxy (Nginx/HAProxy) đứng trước app Java, nhận request từ client rồi chuyển tiếp. Nó dùng để terminate TLS, phân phối tải qua nhiều instance (load balancing), kiểm tra sức khỏe (health check) để không gửi traffic tới instance chết, giữ session cùng instance (sticky session) nếu cần, và thiết lập timeout phù hợp. Header X-Forwarded-* cho app Java biết thông tin client thực (IP, proto, host) thay vì thấy IP của proxy.

### Thuật ngữ (giải thích lần đầu)
- **Reverse proxy**: server nhận request từ client rồi chuyển tiếp tới server backend (app Java), ngược lại của forward proxy.
- **Load balancer (LB)**: phân phối request đến nhiều backend instance để tránh quá tải một máy.
- **Health check**: LB định kỳ gọi một endpoint (ví dụ {{/actuator/health}}) của instance; nếu trả về lỗi hoặc không phản hồi, LB ngừng gửi traffic tới instance đó.
- **Sticky session (session affinity)**: LB gắn một user cụ thể luôn đến cùng một instance (dùng cookie), cần khi app lưu session trong bộ nhớ local (không khuyến khích, nên dùng Redis).
- **X-Forwarded-For / X-Forwarded-Proto / X-Forwarded-Host**: header proxy thêm để backend biết IP client thực, protokol (http/https), host ban đầu.

### Cách làm từng bước

**Nginx làm reverse proxy + health check** ({{/etc/nginx/conf.d/loan.conf}})
~~~text
upstream loan_backend {
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
    health_check interval=5s fails=3;
}

server {
    listen 80;
    server_name api.company.com;

    location / {
        proxy_pass http://loan_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /actuator/health {
        proxy_pass http://loan_backend;
        access_log off;
    }
}
~~~
Giải thích:
- **upstream / least_conn**: nhóm backend, chia theo số kết nối ít nhất.
- **server ... weight**: có thể thêm {{weight=2}} cho máy mạnh hơn.
- **health_check**: Nginx Plus có directive này; với Nginx open-source dùng {{proxy_next_upstream}} và {{max_fails}} thay vì health check tích hợp.
- **proxy_set_header X-Forwarded-For**: thêm IP client vào danh sách, backend lấy phần tử đầu làm IP client thực.
- **proxy_set_header X-Forwarded-Proto $scheme**: cho app biết client dùng http hay https (quan trọng khi Nginx terminate TLS, app thấy http).
- **proxy_connect_timeout/send_timeout/read_timeout**: thời gian chờ kết nối/gửi/đọc với backend. Đặt 30s cho API thường, dài hơn cho report exports.

**Spring Boot đọc X-Forwarded-***
Thêm vào {{application.properties}}:
~~~text
server.forward-headers-strategy=framework
~~~
Spring sẽ dùng X-Forwarded-For/Proto/Host để tạo {{HttpServletRequest}} đúng (getRemoteAddr, getScheme, getServerPort). Nếu không bật, app sẽ thấy IP của Nginx ({{127.0.0.1}}) và scheme http dù client dùng https → sai redirect, sai log audit.

**Sticky session (chỉ khi thực sự cần)**
~~~text
upstream loan_backend {
    sticky cookie route;
    server 10.0.1.10:8080 route=instance1;
    server 10.0.1.11:8080 route=instance2;
}
~~~
Nginx Plus dùng cookie {{route}}. Lưu ý: sticky session làm scaling/khuất instance khó hơn (mất session khi instance xuống). Nên lưu session vào Redis (Spring Session) và dùng round-robin/least_conn, không cần sticky.

### Trên production
- Health check endpoint nên nhẹ (không truy vấn DB nặng) và trả về 200 nhanh. Spring Boot Actuator {{/actuator/health}} có thể cấu hình chỉ hiện status tổng hợp.
- Timeout đừng đặt quá dài: read timeout 30s-60s cho API, nếu quá lâu client sẽ ngắt và LB cũng ngưng chờ. Dùng non-blocking/async cho task lâu.
- Nginx open-source không có health check tích hợp đầy đủ; có thể dùng {{max_fails=3}} {{fail_timeout=30s}} trên mỗi server trong upstream để tự động loại instance không phản hồi.
- X-Forwarded-For có thể bị spoof (client gửi header giả). Backend chỉ nên tin phần tử **cuối cùng** thêm bởi proxy gần nhất, hoặc cấu hình proxy tin proxy trước đó (set_real_ip_from).

### Bảng so sánh
| Tính năng | Nginx open-source | HAProxy | Nginx Plus |
|---|---|---|---|
| Reverse proxy | Có | Có | Có |
| Load balancing | round-robin, least_conn, ip_hash | Nhiều thuật toán hơn | Nhiều thuật toán |
| Health check | Giới hạn (max_fails) | Tích hợp chi tiết | Tích hợp đầy đủ |
| Sticky session | ip_hash | Cookie/table | Cookie |

> Senior tip: Đừng gắn session vào instance (sticky session) trừ khi bắt buộc. Mỗi instance Java nên stateless: session lưu Redis, file lưu S3/minIO, upload gửi trực tiếp storage. Stateless thìLB chọn thuật toán nào cũng được, scale instance thêm/bớt không ảnh hưởng user, và rolling deploy không làm drop session. X-Forwarded-Proto là nỗi đau đen: nếu sai, Spring Security redirect về http thay vì https và cookie Secure không gửi được.`,
  follow: ['X-Forwarded-Proto dùng để làm gì và sai thì hỏng gì trong Spring Boot?', 'Health check endpoint nên kiểm tra gì để không làm quá tải DB?', 'Tại sao khuyên dùng stateless (session trong Redis) thay vì sticky session?'],
  tags: ['nginx', 'haproxy', 'reverse-proxy', 'load-balancer', 'health-check', 'sticky-session', 'x-forwarded']
},
{
  id: 'devops-084',
  topic: 'devops',
  level: 'senior',
  q: 'Firewall (ufw/iptables/security group), VPN và whitelist IP: cấu hình cho ứng dụng Java kết nối DB và gọi API đối tác/ngân hàng như thế nào để an toàn?',
  a: `**Tóm tắt:** Firewall lạnh lão chỉ cho phép cổng cần thiết (app listen 8080, SSH 2222, DB 5432 chỉ từ app server), dùng security group (AWS) hoặc ufw/iptables (Linux). VPN tạo đường hầm mã hóa tới mạng đối tác/ngân hàng, và whitelist IP chỉ cho phép các IP đã đăng ký gọi vào API của chúng ta. Kết hợp cả ba: app Java trong private subnet, chỉ gọi DB qua security group, gọi đối tác qua IPsec VPN với IP whitelist hai bên.

### Thuật ngữ (giải thích lần đầu)
- **Firewall**: bộ lọc gói tin, cho phép/từ chối kết nối dựa trên cổng, IP, giao thức.
- **ufw (Uncomplicated Firewall)**: wrapper dễ dùng trên iptables (Debian/Ubuntu).
- **iptables**: firewall nhân Linux, qui tắc chains (INPUT/OUTPUT/FORWARD).
- **Security group (SG)**: firewall ảo của cloud (AWS/VPC), gắn vào ENI instance, stateful (cho phép phản hồi tự động).
- **VPN (IPsec/Site-to-Site)**: đường hầm mã hóa nối hai mạng riêng qua Internet công cộng.
- **Whitelist IP**: danh sách IP được phép truy cập, tất cả IP khác bị từ chối.

### Cách làm từng bước

**ufw trên server Linux (app/DB VM)**
~~~bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 2222/tcp        # SSH (đã đổi port)
sudo ufw allow 8080/tcp        # app Java listen
sudo ufw allow from 10.0.1.0/24 to any port 5432   # chỉ subnet app gọi DB PostgreSQL
sudo ufw enable
~~~
Giải thích: mặc định chặn tất cả kết nối từ ngoài vào trừ quy tắc cho phép. Chỉ mở 2222 (SSH), 8080 (app), 5432 (DB) và chỉ từ subnet app. Không mở 5432 ra toàn Internet.

**iptables (nếu ufw không có)**
~~~bash
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -A INPUT -p tcp -s 10.0.1.0/24 --dport 5432 -j ACCEPT
sudo iptables -A INPUT -j DROP
~~~
Quy tắc được đọc từ trên xuống, thứ tự quan trọng. {{DROP}} cuối cùng làm mặc định chặn.

**Security group AWS (EC2/EKS)**
- SG-app: inbound 8080 từ SG-loadbalancer, 2222 từ IP bastion, 5432 từ SG-app (không mở 0.0.0.0/0).
- SG-db: inbound 5432 chỉ từ SG-app.
SG là stateful: nếu cho inbound 8080, phản hồi ra ngoài được tự động.

**VPN IPsec tới đối tác/ngân hàng**
Cấu hình trên gateway/router (ví dụ strongSwan, AWS Site-to-Site VPN, Cisco ASA):
~~~text
left=203.0.113.10        # IP công cộng của chúng ta
leftsubnet=10.0.0.0/16   # mạng nội bộ chúng ta
right=198.51.100.5       # IP công cộng đối tác
rightsubnet=172.16.0.0/16 # mạng đối tác
ike=aes256-sha2-modp2048
esp=aes256-sha2
~~~
Sau khi tunnel up, app Java gọi API đối tác qua private IP ({{172.16.x.x}}) thay vì public IP, toàn bộ traffic mã hóa.

**Whitelist IP cho API của chúng ta**
Nếu đối tác gọi API chúng ta, chỉ cho phép IP đối tác:
~~~bash
# ufw
sudo ufw allow from 203.0.113.50 to any port 8443   # IP đối tác gọi API bảo mật
~~~
Hoặc trong Nginx:
~~~text
allow 203.0.113.50;
deny all;
~~~
Trên AWS, security group inbound 8443 chỉ từ IP đối tác (hoặc prefix list).

### Trên production
- Không bao giờ mở 0.0.0.0/0 cho cổng DB (5432, 1433, 1521, 3306) và Redis (6379). Chỉ từ SG app.
- Dùng security group tham chiếu security group (AWS) thay vì hard-code IP, vì IP instance có thể thay đổi.
- Whitelist IP đối tác phải có quy trình phê duyệt và review định kỳ (xoá IP không dùng nữa).
- VPN tunnel down → app gọi đối tác thất bại. Cần monitoring tunnel trạng thái và có đường dự phòng (second VPN hoặc redirect qua public API với mTLS).
- Kiểm tra firewall đã chặn gì: {{sudo ufw status numbered}}, {{sudo iptables -L -n -v}}, AWS VPC flow logs, security group rules.

### Bảng so sánh
| Công cụ | Dùng nơi nào | Stateful? | Lệnh chính |
|---|---|---|---|
| ufw | Linux VM (Ubuntu/Debian) | Có | ufw allow/deny |
| iptables | Linux VM (tất cả distro) | Có | iptables -A |
| Security group | AWS/VPC cloud | Có | AWS console/CLI |
| VPN IPsec | Kết nối hai mạng riêng | Có | strongSwan, AWS VPN |

> Senior tip: "Mở cổng để chạy thử rồi quên đóng" là nguyên nhân phổ biến của rò r dữ liệu. Hãy áp dụng nguyên tắc least privilege: đóng tất cả, mở từng cổng cần từng cặp (nguồn, đích, cổng). Trong AWS, chọn security group làm nguồn thay vì CIDR rộng, và gắn tag {{Owner}}/{{Ticket}} vào mỗi quy tắc để biết ai yêu cầu, khi nào review lại. Mọi thay đổi firewall phải qua change request và có rollback plan.`,
  follow: ['Tại sao không bao giờ mở cổng DB (5432) ra 0.0.0.0/0 trên Internet công cộng?', 'Security group khác iptables/ufw ở điểm nào, và khi nào dùng cái nào?', 'Whitelist IP đối tác cần review định kỳ như thế nào để không dính IP lỗi thời?'],
  tags: ['firewall', 'ufw', 'iptables', 'security-group', 'vpn', 'ip-whitelist']
},
{
  id: 'devops-085',
  topic: 'devops',
  level: 'senior',
  q: 'SSH bastion/jump host và ProxyJump ở quy mô lớn: triển khai như thế nào, ghi audit ai ssh vào server nào, và hardening bastion để không thành mục tiêu tấn công?',
  a: `**Tóm tắt:** Bastion (jump host) là điểm vào duy nhất để quản lý các server trong private subnet, không đính Internet trực tiếp. Dùng ProxyJump để ssh qua bastion một cách trong suốt. Ở quy mô lớn, cần tập trung quản lý khóa, ghi chú tất cả lệnh chạy (audit), và cứng rắn bastion để không trở thành "chìa khóa chính" bị tấn công.

### Thuật ngữ (giải thích lần đầu)
- **Bastion / jump host**: server trung gian đặt ở đường vào (public subnet hoặc DMZ), dùng làm điểm ssh vào các server nội bộ. Bastion không deploy app, chỉ cho ssh đi-through.
- **ProxyJump (-J)**: tùy chọn SSH tự động nối qua bastion, người dùng chỉ cần ssh một lệnh thay vì ssh bastion rồi ssh lại app.
- **Audit SSH**: ghi lại ai, khi nào, từ IP nào, chạy lệnh gì trên server nào (dùng để điều tra sự cố và tuân thủ).
- **Hardening**: cấu hình giảm bề mặt tấn công (tắt dịch vụ không cần, giới hạn user, cập nhật kernel).

### Cách làm từng bước

**Cấu hình bastion**
~~~text
# /etc/ssh/sshd_config trên bastion
PermitRootLogin no
PasswordAuthentication no
AllowGroups sshusers
MaxAuthTries 3
ForceCommand internal-sftp   # nếu chỉ cần SFTP, hoặc để trống để cho shell
ClientAliveInterval 300
~~~
Tạo group {{sshusers}}, chỉ thêm user quản trị vào nhóm này. Bastion chỉ cho ssh vào, không cho ssh ra trừ tới private subnet app.

**ProxyJump từ máy dev**
~~~bash
ssh -J bastion-user@bastion-ip loansvc@app-private-ip
~~~
Hoặc ~/.ssh/config:
~~~text
Host app-private
  HostName 10.0.1.10
  User loansvc
  ProxyJump bastion-user@bastion.company.com
  IdentityFile ~/.ssh/id_ed25519_company
~~~
Chỉ cần {{ssh app-private}}.

**Tunnel cổng qua bastion (gọi DB từ máy dev qua app)**
~~~bash
ssh -J bastion-user@bastion-ip -L 5432:db-private:5432 loansvc@app-private-ip
~~~
Lệnh này mở cổng 5432 localhost trên máy dev, tunnel qua bastion + app tới DB nội bộ. Dùng để chạy psql/DBeaver từ dev mà không mở DB ra Internet.

**Ghi audit SSH**
- Cài {{auditd}} trên bastion và app server, ghi sự kiện ssh, sudo, lệnh chạy.
- Hoặc dùng {{sshd}} với {{LogLevel VERBOSE}} ghi vào {{/var/log/auth.log}}: user, IP, thời gian, thành công/thất bại.
- Để ghi toàn bộ phiên (kiểu quay phim), dùng {{ttyrec}} hoặc {{script}} bao quanh shell, hoặc giải pháp commerciales (Teleport, StrongDM).
- Gửi log về SIEM/ELK, lưu tối thiểu 6-12 tháng (tuỳ quy định ngân hàng).

**Quản lý khóa tập trung**
Không thêm public key thủ công vào {{~/.ssh/authorized_keys}} trên mỗi server. Dùng:
- **SSH CA (certificate authority)**: ký khóa SSH với CA, server tin CA, khóa hết hạn tự động (không cần xoá thủ công khi nghỉ việc).
- **Ansible/Terraform**: đẩy/thu hồi public key tự động qua IaC.
- **Teleport/StrongDM**: quản lý truy cập zentral, audit session, không cần khóa SSH thủ công.

### Trên production
- Bastion không deploy app, không cài web server, không có dữ liệu kinh doanh. Chỉ SSH, auditd, OS patch.
- Giới hạn IP nguồn có thể ssh vào bastion (security group/ufw chỉ từ IP văn phòng/VPN của công ty).
- Tắt X11Forwarding, AgentForwarding nếu không cần (giảm rủi ro forwarding key).
- Xoá khóa của nhân viên nghỉ việc ngay: nếu dùng SSH CA, khóa hết hạn; nếu dùng authorized_keys, xoá entry và duyệt lại toàn bộ server.
- Ghi log lệnh (auditd/ttyrec) và alert khi có lệnh nguy hiểm ({{rm -rf}}, {{chmod 777}}, {{sudo su}}) trên production.

### Bảng so sánh
| Cách tiếp cận | Ưu điểm | Nhược điểm |
|---|---|---|
| authorized_keys thủ công | Đơn giản, không cài thêm | Khó thu hồi, rủi ro khóa cũ còn hiệu lực |
| SSH CA | Khóa hết hạn, quản lý tập trung | Cần cài CA, kiến thức thêm |
| Teleport/StrongDM | Audit session, MFA, không khóa thủ công | Phụ thuộc dịch vụ bên thứ ba, chi phí |

> Senior tip: Bastion là "chìa khóa chính" của toàn bộ hệ thống nội bộ. Nếu attacker chiếm bastion, họ có thể ssh vào mọi app server. Do đó bastion phải cứng rắn hơn app server: MFA, chỉ từ IP whitelisted, ghi toàn bộ phiên, và không lưu secret/code trên bastion. Giống như cửa chính của ngân hàng — chỉ mở cho người được phép, và ghi lại mọi người vào-ra.`,
  follow: ['ProxyJump khác ssh hai lần thủ công (bastion rồi app) ở điểm nào?', 'Làm sao ghi lại tất cả lệnh chạy qua bastion để kiểm tra khi có sự cố?', 'SSH CA giúp gì so với public key thủ công trong authorized_keys?'],
  tags: ['ssh', 'bastion', 'proxyjump', 'audit', 'hardening']
},
{
  id: 'devops-086',
  topic: 'devops',
  level: 'lead',
  q: 'Phản ứng sự cố production Linux (server chậm, Java app bị OOM/crash): cách dùng systemd giới hạn tài nguyên, đọc load average/free/iostat/ss, journalctl phân tích, và runbook khôi phục dịch vụ?',
  a: `**Tóm tắt:** Khi server production chậm hoặc app Java OOM/crash, lead cần phân tích nhanh các tầng: hệ thống (CPU/RAM/IO/mạng), dịch vụ (systemd status/log), và ứng dụng (Java heap/GC/thread dump). Dùng {{systemctl}} giới hạn tài nguyên để tránh một app "ăn hết" máy, journalctl để xem lịch sử sự cố, rồi chạy runbook khôi phục (restart, scale, rollback) có kiểm soát.

### Thuật ngữ (giải thích lần đầu)
- **Load average**: số trung bình các process đang chạy hoặc chờ CPU/IO trong 1, 5, 15 phút (xem qua {{uptime}}). Số cao hơn số lõi CPU → máy đang quá tải CPU hoặc chờ IO.
- **free**: xem RAM dùng/trống/cache ({{free -h}}). RAM trống thấp không nhất thiết là lỗi (Linux dùng RAM làm cache), cần xem available.
- **iostat**: xem hiệu năng ổ đĩa (read/write, throughput, utilization, await). Cần cài {{sysstat}}.
- **ss**: xem socket/port kết nối ({{ss -tlnp}}), thay netstat.
- **OOM Kill**: nhân Linux giết process khi hết RAM (xem trong {{dmesg}} hoặc journalctl có thông báo "Out of memory: Kill process").
- **systemd resource limit**: {{MemoryMax}}, {{CPUQuota}}, {{LimitNOFILE}} trong unit file giới hạn tài khoản một dịch vụ.

### Cách làm từng bước

**Bước 1 — Phát hiện server chậm**
~~~bash
uptime                  # load average 1/5/15 phút
free -h                 # RAM, swap
iostat -x 1             # IO đợi (await cao = ổ đĩa chậm)
ss -tlnp | grep :8080   # app Java đang listen, xem PID
~~~
Nếu load average cao >> số lõi CPU, và iostat await cao → ổ đĩa chậm (log ghi nhiều, swap thrashing). Nếu load cao nhưng iostat bình thường → CPU bottleneck (Java GC, vòng lặp vô hạn).

**Bước 2 — Xem dịch vụ Java qua systemd**
~~~bash
systemctl status loan-service          # trạng thái, PID, lệnh cuối
journalctl -u loan-service --since "1 hour ago"   # log app, tìm OOM/Exception
journalctl -u loan-service -n 200 --no-pager      # 200 dòng cuối, không phân trang
~~~
Tìm {{OutOfMemoryError}}, {{GC overhead limit exceeded}}, hoặc process bị kill (OOM Killer).

**Bước 3 — Java diagnostic**
~~~bash
# Lấy PID của java
pid=$(pgrep -f loan-service.jar)
# Heap histogram
jmap -histo:live $pid | head -30
# Thread dump (tìm deadlock, thread bị treo)
jstack $pid > /tmp/threaddump.txt
~~~
Nếu app đã chết, không lấy được jstack. Xem journalctl log stack trace gần thời gian crash.

**Bước 4 — Giới hạn tài nguyên (ngăn ăn hết máy)**
Sửa unit file, thêm vào [Service]:
~~~yaml
MemoryMax=2G
MemorySwapMax=0
CPUQuota=50%
LimitNOFILE=65536
~~~
Rồi {{sudo systemctl daemon-reload}} && {{sudo systemctl restart loan-service}}. Điều này ngăn Java heap quá lớn làm hết RAM máy, và CPUQuota ngăn một instance dùng hết CPU.

**Bước 5 — Runbook khôi phục**
1. **Khởi động lại dịch vụ**: {{sudo systemctl restart loan-service}}, kiểm tra {{systemctl status}}.
2. **Nếu vẫn crash**: rollback phiên bản trước (cũ ổn định), rồi điều tra.
3. **Nếu server quá tải hoàn toàn**: tắt dịch vụ không quan trọng, hoặc scale thêm instance qua LB (nếu có).
4. **Sau khi khôi phục**: ghi incident report (nguyên nhân, ảnh hưởng, hành động khắc phục, phòng ngừa), cập nhật runbook.

### Trên production
- Không restart service mù quáng nếu đang xử lý giao dịch tài chính: kiểm tra có giao dịch nào đang xử lý (thread dump), có thể chờ xong hoặc drain qua LB trước.
- OOM thường do heap quá lớn (Xmx quá gần RAM máy), memory leak, hoặc nhiều thread. Tune {{-Xms}} {{-Xmx}} theo RAM có sẵn (để 20-30% RAM cho OS/cache).
- Swap bật trên server Java thường xấu (GC trong swap rất chậm). Có thể tắt swap hoặc dùng {{MemorySwapMax=0}} trong systemd.
- journalctl log bị xoá khi reboot nếu không cấu hình persistent ({{Storage=persistent}} trong {{/etc/systemd/journald.conf}}). Bật persistent để xem log sau reboot.

### Bảng so sánh
| Dấu hiệu | Nguyên nhân suspect | Công cụ kiểm tra |
|---|---|---|
| Load cao, iostat await cao | ổ đĩa chậm, swap thrashing | iostat, dmesg, journalctl |
| Load cao, CPU cao, RAM bình thường | Java GC, vòng lặp, luồng treo | top, jstack, jmap |
| App crash, log "Out of memory" | Heap quá nhỏ, memory leak | journalctl, jmap -histo |
| Không connect được app | Port không listen, firewall | ss -tlnp, ufw status |

> Senior tip: Runbook phải được viết và **diễn tập trước khi có sự cố**, không viết giữa đêm khi server đang xuống. Mỗi runbook ghi rõ: ai được gọi, lệnh chạy theo thứ tự, tiêu chí rollback, và khi nào escalate lên đội DBA/infra. Systemd resource limit là giànadero phòng khi một app Java bị "loạn" (ví dụ loop tạo file log) — thiết lập trước, đợi sự cố mới cấu hình thì đã muộn.`,
  follow: ['Load average cao nhưng CPU/RAM bình thường có thể do gì, và bạn kiểm tra bằng lệnh gì? (gợi ý: iostat, ss, thread dump)', 'OOM Kill trong Linux là gì, và journalctl có dấu hiệu gì để xác nhận app bị OOM?', 'Tại sao nên đặt MemoryMax và CPUQuota trong systemd unit file cho Java service?'],
  tags: ['linux', 'incident-response', 'systemd', 'oom', 'troubleshooting', 'journalctl', 'runbook']
},
{
  id: 'devops-087',
  topic: 'devops',
  level: 'lead',
  q: 'Thiết kế bảo mật mạng theo tầng (defense in depth) cho hệ thống ngân hàng: DMZ, zona công khai/riêng nội bộ, traffic north-south và east-west, tường lửa giữa các zona, và ví dụ định tuyến cho một giao dịch thanh toán?',
  a: `**Tóm tắt:** Defense in depth (bảo mật nhiều tầng) nghĩa là không tin vào một tường lửa duy nhất, mà chia mạng thành các zona (DMZ, công khai, riêng nội bộ, dữ liệu nhạy cảm), đặt tường lửa giữa các zona, chỉ cho phép traffic cần thiết (least privilege), và phân biệt traffic north-south (client↔server) và east-west (server↔server trong trung tâm dữ liệu). Ví dụ luồng thanh toán đi qua các zona này, mỗi zona được kiểm soát riêng.

### Thuật ngữ (giải thích lần đầu)
- **Defense in depth (bảo mật nhiều tầng)**: nhiều lớp kiểm soát (tường lửa, WAF, IDS/IPS, mã hóa, kiểm tra truy cập) sau nhau, một lớp bị bỏ qua vẫn có lớp khác.
- **DMZ (Demilitarized Zone)**: zona trung gian giữa Internet và mạng nội bộ, chứa dịch vụ đính Internet (WAF, reverse proxy, API gateway) nhưng không chứa DB/core banking.
- **Zona công khai (public)**: subnet có thể đính Internet, chỉ chứa dịch vụ cần thiết (nginx, load balancer).
- **Zona riêng nội bộ (private)**: subnet không đính Internet, chứa app server, chỉ gọi được từ DMZ hoặc app khác trong cùng zona.
- **Zona dữ liệu nhạy cảm (data zone)**: chứa DB, core banking, chỉ app server được gọi, không đính Internet.
- **Traffic north-south**: traffic từ client ngoài vào server (và ngược lại), đi qua tường iglesia biên (edge firewall).
- **Traffic east-west**: traffic giữa server trong cùng trung tâm dữ liệu (app gọi DB, app gọi app), cần tường lửa nội bộ (micro-segmentation).

### Cách làm từng bước

**Xác định zona và tường lửa giữa zona**
| Zona | Chứa gì | Đính Internet? | Quy tắc firewall chính |
|---|---|---|---|
| Internet | Client, đối tác | Có | Chỉ WAF/LB |
| DMZ | WAF, Nginx/LB, API gateway | Có | Chỉ 80/443 vào, gọi tới app zona |
| App zona | Spring Boot instances | Không | Chỉ từ DMZ, gọi DB zona |
| DB zona | PostgreSQL, Oracle core | Không | Chỉ từ app zona, cổng DB |
| Backup/Mgmt | Backup server, bastion | Không (qua VPN) | Chỉ từ IP admin qua VPN |

**Ví dụ định tuyến giao dịch thanh toán (ví dụ minh họa)**
1. Khách hàng gọi {{https://api.company.com/pay}} (north-south) → WAF/DMZ.
2. WAF kiểm tra tấn công (SQL injection, DDoS) → gửi Nginx/LB trong DMZ.
3. Nginx terminate TLS, kiểm tra X-Forwarded-*, chuyển tiếp qua API gateway.
4. API gateway xác thực token, gọi Spring Boot trong app zona (east-west, qua tường lửa nội bộ).
5. App Spring Boot gọi DB core trong data zona (east-west, chỉ cổng 5432/1521 từ SG app).
6. App gọi core banking đối tác qua IPsec VPN (north-south ra ngoài, mã hóa).
7. Phản hồi ngược lại theo đường cũ đến khách hàng.

~~~seq
title: Luồng giao dịch thanh toán qua các zona bảo mật
actors: Khách hàng | WAF/DMZ | App zona | DB/Core zona | Đối tác (VPN)
Khách hàng -> WAF/DMZ: HTTPS /pay
WAF/DMZ -> App zona: forward request (qua tường lửa nội bộ)
App zona -> DB/Core zona: truy vấn giao dịch (cổng DB)
DB/Core zona --> App zona: kết quả
App zona -> Đối tác (VPN): xác thực thanh toán (IPsec)
Đối tác (VPN) --> App zona: phản hồi đối tác
App zona --> WAF/DMZ: phản hồi API
WAF/DMZ --> Khách hàng: HTTPS response
note WAF/DMZ,App zona,DB/Core zona: mỗi zona kiểm tra độc lập, least privilege
~~~

**Tường lửa giữa zona (micro-segmentation)**
- AWS: security group từng zona, app zona SG chỉ cho inbound từ DMZ SG, DB zona SG chỉ cho inbound từ app zona SG.
- Linux host-based: iptables/ufw trên mỗi server, chỉ cho phép cổng cần thiết.
- Mạng vật lý: VLAN riêng cho mỗi zona, router/Layer 3 switch kiểm soát giữa VLAN.

### Trên production
- Không cho app zona gọi trực tiếp Internet (trừ qua proxy đã whitelist). Dùng NAT gateway hoặc proxy nếu cần gọi API bên ngoài.
- DB zona không đính Internet, không có SSH trực tiếp (ssh qua bastion trong management zona).
- Mỗi thay đổi tường lửa phải qua change request, có rollback, và test từ cả hai bên (từ app có thể gọi DB, từ Internet không thể gọi DB).
- Giám sát traffic east-west (IDS/IPS nội bộ) vì attacker đã trong mạng nội bộ có thể di chuyển ngang (lateral movement).
- Mã hóa traffic trong vùng nội bộ (mTLS giữa microservices) nếu chứa dữ liệu nhạy cảm (PCI-DSS yêu cầu).

### Bảng so sánh
| Zona | Mục tiêu | Traffic chính | Kiểm soát |
|---|---|---|---|
| DMZ | Dịch vụ đính Internet | north-south | WAF, tường lửa biên |
| App zona | Xử lý nghiệp vụ | east-west (gọi DB/app) | Tường lửa nội bộ, SG |
| DB zona | Lưu dữ liệu nhạy cảm | east-west (chỉ app gọi) | SG, mã hóa kết nối DB |
| Management | Quản trị | north-south qua VPN | Bastion, IP whitelist, MFA |

> Senior tip: "Mạng nội bộ là an toàn" là giả định nguy hiểm nhất trong bảo mật ngân hàng. Attacker đã vào mạng nội bộ (qua email lừa, app có lỗi) sẽ tìm cách di chuyển ngang (east-west) đến DB/core. Do đó hãy áp dụng micro-segmentation (tường lửa giữa app-server và DB-server, không cho tất cả app gọi tất cả DB), mã hóa mTLS giữa các dịch vụ nội bộ, và giả định mọi zone không tin zone khác. Network segmentation là lớp cuối cùng bảo vệ core banking khi tất cả lớp khác đã bị bỏ qua.`,
  follow: ['Traffic north-south và east-west khác nhau như thế nào, và tại sao east-west cũng cần tường lửa?', 'DMZ chứa gì, và tại sao DB/core banking không được đặt trong DMZ?', 'Micro-segmentation là gì và áp dụng như thế nào trong AWS security group?'],
  tags: ['network-security', 'defense-in-depth', 'dmz', 'micro-segmentation', 'north-south', 'east-west', 'vpn']
},
  {
    id: 'devops-088',
    topic: 'devops',
    level: 'senior',
    q: 'Khi một Pod mới tạo mãi ở trạng thái Pending, Kubernetes scheduler (bộ lập lịch - thành phần chọn node cho Pod) đã làm gì bên trong? Giải thích cơ chế filter + score từng bước và cách bạn đọc sự kiện để tìm nguyên nhân.',
    a: `**Tóm tắt:** Scheduler chạy một vòng lặp: lấy Pod Pending từ hàng đợi, lọc (filter) bỏ các node không đủ điều kiện (thiếu CPU/RAM theo request, vi phạm taint/affinity, volume không gắn được), rồi chấm điểm (score) các node còn lại để chọn node tốt nhất. Pod Pending thường do filter loại hết node; đọc {{kubectl describe pod}} phần Events và thông điệp {{FailedScheduling}} để biết predicate nào thất bại. Hiểu filter/score giúp bạn đặt request đúng, dùng affinity/taint có chủ đích và tránh "không node nào đủ" dù cluster trông còn trống.

### Thuật ngữ (giải thích cho người mới)
- **Scheduler**: thành phần control plane quyết định Pod chạy trên node nào; nó không khởi chạy container (kubelet làm việc đó).
- **Request**: lượng CPU/RAM Pod "đặt chỗ" để scheduler xét; đây là con số dùng để lập lịch, không phải mức dùng thực tế lúc chạy.
- **Taint / Toleration**: taint là "nhãn từ chối" gắn trên node (ví dụ node dành cho DB); Pod chỉ được xếp lên nếu có toleration (giấy phép) khớp.
- **Affinity / Anti-affinity**: quy tắc ưu tiên hoặc bắt buộc Pod đặt gần/xa Pod khác hoặc node có đặc tính nào đó (ví dụ trải đều theo zone).

### Scheduler hoạt động từng bước (cơ chế bên trong)
1. **Hàng đợi (Scheduling Queue)**: Pod mới tạo (chưa có {{spec.nodeName}}) vào ActiveQ. Pod từng thất bại có thể nằm trong BackoffQ/UnschedulableQ; khi cluster thay đổi scheduler đánh thức chúng.
2. **Chọn Pod**: lấy một Pod từ đầu hàng đợi (mỗi vòng một Pod).
3. **Pha Filter (lọc)**: với mỗi node, chạy chuỗi plugin. Node bị loại nếu:
   - {{NodeResourcesFit}}: tổng request Pod + Pod đã đặt > allocatable (CPU/memory).
   - {{NodePorts}}: {{hostPort}} bị chiếm.
   - {{TaintToleration}}: Pod không chịu được taint {{NoSchedule}}.
   - {{NodeAffinity}} / {{PodAffinity}}: vi phạm điều kiện required.
   - {{VolumeBinding}}: PV/PVC không gắn được (sai zone/topology).
4. **Pha Score (chấm điểm 0-100)**: node qua Filter được chấm và cộng trọng số (cân bằng tài nguyên, image locality, preferred affinity).
5. **Bind**: scheduler ghi {{spec.nodeName}}; kubelet trên node đó kéo image và tạo container.

~~~text
[Scheduling Cycle - mỗi vòng xử lý 1 Pod]
Pending Pod -> [ActiveQ] -> Pop Pod
  -> Filter: NodeResourcesFit, TaintToleration, Affinity, VolumeBinding
       NodeA: fail (Insufficient memory)
       NodeB: fail (untolerated taint {dedicated=db: NoSchedule})
       NodeC: pass    NodeD: pass
  -> Score (0-100): NodeC=72, NodeD=65
  -> Bind Pod -> NodeC (kubelet tạo container)
~~~

### Ví dụ: đọc {{FailedScheduling}}
~~~text
$ kubectl describe pod payment-7d9f-abcde -n payment
Events:
  Warning  FailedScheduling  12s  default-scheduler  0/6 nodes are available:
    2 nodes had untolerated taint {dedicated=db: NoSchedule},
    3 Insufficient memory,
    1 node(s) didn't match pod anti-affinity rules.
    preemption: 0/6 nodes are available: 6 Preemption is not helpful for scheduling.
~~~
Filter loại hết 6 node; không node nào vào Score. "Preemption is not helpful" nghĩa là đuổi Pod ưu tiên thấp cũng không giải quyết.

~~~yaml
resources:
  requests:
    cpu: "6"      # node lớn nhất chỉ 4 CPU allocatable -> Insufficient cpu
    memory: "8Gi"
~~~

### Vì sao thiết kế filter + score (trade-off)
- **Tách Filter/Score**: Filter đảm bảo đúng (không đặt lên node không hợp lệ). Score tối ưu (cân bằng, locality). Dễ mở rộng bằng plugin.
- **Lập lịch theo request, không theo usage**: quyết định nhanh, ổn định; usage thay đổi từng giây. Trade-off: request cao -> lãng phí/Pending giả; request thấp -> node pack dày, tranh chấp runtime.

### Trên production
- **Triệu chứng**: Pod Pending kéo dài, rollout chậm, HPA tạo Pod mới nhưng không lên node. Node "CPU 30% used" nhưng vẫn {{Insufficient cpu}}.
- **Cách đo**: {{kubectl describe pod}} (Events), {{kubectl describe node}} xem {{Allocated resources}} (request cam kết) vs {{Allocatable}}. So với usage thực (metrics-server).
- **Tuning**: đặt request theo P95 usage + buffer (không copy limit). Dùng {{PriorityClass}} cho workload quan trọng. Thiếu node thật -> Cluster Autoscaler/Karpenter. Kiểm tra taint/toleration.

### Câu trả lời sai phổ biến
- "Pending vì node hết RAM thực tế": sai, scheduler xét tổng **request** allocatable, không xét RAM đang dùng.
- "Tăng replica hết Pending": nếu do filter (taint/affinity/request quá lớn) thì chỉ thêm Pod Pending.

### Lỗi hay gặp
1. **Request đặt bằng limit (quá lớn)**: {{Insufficient}} dù usage thấp. Cách tránh: tách request/limit, đo usage.
2. **Anti-affinity {{requiredDuringScheduling}} với replicas > số node/zone**: không đủ domain -> Pending mãi. Cách tránh: dùng {{preferred}} hoặc đủ domain.
3. **PVC sai zone**: {{VolumeBinding}} thất bại. Cách tránh: StorageClass đúng topology.
4. **Thêm taint cho node pool quên toleration**: Pending hàng loạt. Cách tránh: change có kiểm tra ảnh hưởng.

### Trả lời phỏng vấn
"Pending nghĩa là scheduler chưa bind được Pod. Em đọc {{kubectl describe pod}} phần Events: FailedScheduling liệt kê lý do filter thất bại. Scheduler lấy Pod từ hàng đợi, chạy pha Filter — NodeResourcesFit so tổng request với allocatable, rồi TaintToleration, Affinity, VolumeBinding. Có node qua thì Score chấm theo cân bằng tài nguyên, locality, affinity để chọn node tốt nhất. Điểm hay nhầm: scheduler dùng request, không dùng usage thực. Trên production em kiểm tra Allocated resources trên node, chỉnh request theo đo đạc, và dùng Cluster Autoscaler khi thiếu node."

> Senior tip: Khi "cluster còn chỗ mà vẫn Pending", luôn so {{Allocated resources}} (request cam kết) với {{Allocatable}} bằng {{kubectl describe node}}, đừng nhìn {{kubectl top}}. Request phình do copy limit là nguyên nhân rất phổ biến; đặt alert khi tổng request commit namespace vượt ngưỡng an toàn.`,
    follow: [
      'Preemption (ưu tiên đuổi Pod khác) hoạt động khi nào, và rủi ro gì cho workload đang chạy?',
      'PodAntiAffinity required vs preferred khác nhau thế nào về hành vi khi cluster thiếu node?',
      'Làm sao thiết lập request/limit cho service Java để vừa qua scheduler vừa tránh lãng phí?'
    ],
    tags: ['Kubernetes', 'Scheduler', 'Filter', 'Score', 'Pending', 'Requests'],
    refs: [
      { type: 'doc', title: 'Kubernetes Scheduler', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/' },
      { type: 'doc', title: 'Assigning Pods to Nodes (Affinity)', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' }
    ]
  },
  {
    id: 'devops-089',
    topic: 'devops',
    level: 'lead',
    q: 'QoS class (Guaranteed, Burstable, BestEffort) trong Kubernetes được xác định thế nào và ảnh hưởng ra sao đến thứ tự bị evict (trục xuất) khi node thiếu tài nguyên? Với tư cách lead, bạn đặt chiến lược request/limit cho các lớp workload (critical, batch, best-effort) ra sao?',
    a: `**Tóm tắt:** QoS class được Kubernetes gán tự động từ request/limit: Guaranteed khi mọi container có request = limit cho CPU và memory; Burstable khi có request/limit nhưng không thoả Guaranteed; BestEffort khi không đặt gì. Khi node chịu áp lực memory, kubelet evict theo ưu tiên: BestEffort trước, rồi Burstable (ưu tiên Pod vượt request), rồi Guaranteed — kết hợp với PriorityClass. Chiến lược lead: bảo vệ luồng critical (Guaranteed + PriorityClass cao + PDB), cho batch linh hoạt có giới hạn, và giám sát allocatable/eviction.

### Thuật ngữ (giải thích cho người mới)
- **QoS (Quality of Service) class**: nhãn Kubernetes gán cho Pod để quyết định mức "được bảo vệ" khi node thiếu tài nguyên.
- **Eviction**: kubelet chủ động chấm dứt Pod trên node để giải phóng tài nguyên (khác scheduler preemption xảy ra trước khi đặt Pod).
- **Node pressure**: node thiếu memory/disk/inode; kubelet có eviction thresholds để phản ứng.
- **Allocatable**: tài nguyên node dành cho Pod (đã trừ phần hệ thống/kubelet).
- **PriorityClass**: mức ưu tiên lập lịch/đuổi Pod; ảnh hưởng preemption và kết hợp với QoS khi căng thẳng.

### Cách QoS được xác định (cơ chế)
Kubernetes xét mọi container trong Pod:
- **Guaranteed**: mỗi container, mọi resource có request đều có limit và **request == limit** (CPU và memory).
- **Burstable**: không phải Guaranteed, nhưng có ít nhất một container đặt request hoặc limit.
- **BestEffort**: không container nào đặt request/limit.

~~~yaml
# Guaranteed
resources:
  requests: { cpu: "500m", memory: "512Mi" }
  limits:   { cpu: "500m", memory: "512Mi" }
# Burstable
resources:
  requests: { cpu: "200m", memory: "256Mi" }
  limits:   { cpu: "1",    memory: "1Gi" }
# BestEffort: không khai báo resources
~~~

### Eviction khi node thiếu memory (từng bước)
1. Kubelet theo dõi {{memory.available}}. Dưới ngưỡng eviction -> node pressure.
2. Kubelet chọn Pod evict: Pod vượt **request** bị cân nhắc trước; **BestEffort** trước, rồi **Burstable** (vượt request nhiều hơn), rồi **Guaranteed**.
3. Eviction chấm dứt Pod (tôn trọng grace period); controller reschedule.
4. OOM killer kernel (khi cgroup chạm trần) chọn process theo {{oom_score_adj}}; kubelet gán điểm theo QoS (BestEffort dễ bị giết hơn).

~~~text
Node memory pressure
  -> kubelet eviction manager
  -> evict: BestEffort > Burstable (vượt request) > Guaranteed
  -> Pod terminate, controller tạo lại (có thể node khác)
~~~

### Vì sao thiết kế vậy (trade-off)
- **Guaranteed** bảo vệ workload quan trọng nhưng phải "trả đủ" (request=limit) -> giảm mật độ pack, tốn chi phí.
- **Burstable** tận dụng phần dư; trade-off: node căng -> Pod burst quá mức dễ bị evict.
- **BestEffort** tận dụng tối đa nhưng không cam kết: chỉ hợp job chạy lại được.

### Trên production
- **Triệu chứng**: Pod batch evict liên tục khi traffic tăng; service quan trọng sống (nếu Guaranteed). Node {{MemoryPressure}}, Pod {{Evicted}}.
- **Cách đo**: {{kubectl describe node}} (Conditions, Events), {{kubectl get pod -A --field-selector=status.phase=Failed}} reason Evicted, metric eviction, so request tổng vs allocatable.
- **Chiến lược lead**:
  - **Critical (thanh toán/core)**: Guaranteed hoặc request sát thực tế + {{PriorityClass}} cao + {{PodDisruptionBudget}}.
  - **Latency-sensitive co giãn**: Burstable, request theo P95, limit có trần; HPA phù hợp.
  - **Batch có thể chạy lại**: Burstable/BestEffort + retry, giới hạn concurrency.
  - Resource quota theo namespace, giám sát overcommit.

### Câu trả lời sai phổ biến
- "Guaranteed nghĩa là Pod không bao giờ bị giết": vẫn có thể OOMKilled nếu vượt cgroup/limit, hoặc tình huống cực đoan.
- "Chỉ cần PriorityClass là đủ": PriorityClass ảnh hưởng preemption; eviction còn xét QoS và mức dùng vs request.

### Lỗi hay gặp
1. **Service critical để request thấp/limit cao**: node căng -> vượt request -> evict. Cách tránh: request thực tế, cân nhắc Guaranteed.
2. **Mọi workload Guaranteed request cao**: tốn kém. Cách tránh: phân lớp theo SLO.
3. **Nhầm eviction (kubelet) với preemption (scheduler)**. Cách tránh: đọc Events/Reason.
4. **Không theo dõi Evicted Pods**. Cách tránh: alert event Evicted.

### Trả lời phỏng vấn (lead)
"QoS do Kubernetes gán: Guaranteed khi request=limit cho CPU/memory, BestEffort khi không khai báo, còn lại Burstable. Node memory pressure thì kubelet evict BestEffort trước, rồi Burstable (vượt request), rồi Guaranteed; kernel OOM killer cũng nghiêng theo {{oom_score_adj}} tương ứng QoS. Em phân lớp: luồng critical dùng Guaranteed hoặc request sát thực tế + PriorityClass cao + PDB; batch dùng Burstable/BestEffort với retry; giám sát allocatable và eviction events. Trade-off: Guaranteed giảm rủi ro bị trục xuất nhưng tốn chi phí."

> Senior tip: Kiểm tra thực tế QoS class bằng lệnh {{kubectl get pod}} với jsonpath status.qosClass (tránh lồng ngoặc nhọn trong inline code — dùng code block nếu cần) và audit workload critical. Kết hợp QoS với PriorityClass, PDB, quota namespace; thiếu mắt xích nào thì node pressure vẫn có thể rớt sai Pod.`,
    follow: [
      'Sự khác nhau giữa scheduler preemption và kubelet eviction là gì, và bạn debug mỗi loại thế nào?',
      'Khi nào bạn chọn request=limit cho memory của Java nhưng không đặt CPU limit? Vì sao?',
      'Làm sao thiết kế PriorityClass và quota cho nhiều team dùng chung một cluster?'
    ],
    tags: ['Kubernetes', 'QoS', 'Eviction', 'Guaranteed', 'Burstable', 'OOM'],
    refs: [
      { type: 'doc', title: 'Configure Quality of Service for Pods', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/' },
      { type: 'doc', title: 'Node-pressure Eviction', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/' }
    ]
  },
  {
    id: 'devops-090',
    topic: 'devops',
    level: 'senior',
    q: 'Vì sao một ứng dụng Java trên Kubernetes có CPU trung bình thấp (ví dụ 30-40%) nhưng p99 latency lại tăng mạnh? Giải thích cơ chế CFS throttling (cgroup CPU quota) từng bước và bạn quyết định có nên đặt CPU limit hay không ra sao?',
    a: `**Tóm tắt:** Khi đặt CPU limit, cgroup dùng CFS quota: mỗi chu kỳ (thường 100ms) container chỉ được chạy tối đa một "quota" tương ứng limit; nếu dùng hết quota sớm, kernel throttle container tới chu kỳ sau. App Java nhiều thread có thể đốt hết quota trong vài chục ms, gây dừng hàng chục ms lặp lại — p99 tăng dù CPU trung bình vẫn thấp. Cách xử lý: đo {{nr_throttled}}/{{throttled_usec}}, cân nhắc bỏ CPU limit (chỉ giữ request) cho service nhạy latency, đặt {{-XX:ActiveProcessorCount}}, hoặc tăng limit và tối ưu số thread.

### Thuật ngữ (giải thích cho người mới)
- **CPU limit/request**: request là phần CPU "đặt chỗ" cho scheduler; limit là trần CPU (thực thi bằng CFS quota).
- **CFS (Completely Fair Scheduler)**: bộ lập lịch CPU của Linux chia thời gian CPU giữa các task.
- **CFS quota/period**: mỗi period (thường 100ms) container được chạy tối đa {{quota}}. cgroup v2 dùng {{cpu.max}} (quota period).
- **Throttling**: kernel tạm ngừng container chạy khi hết quota trong period.
- **p99 latency**: độ trễ 99% request nhanh hơn; nhạy với các khoảng "đứng hình" ngắn lặp lại.

### Cơ chế CFS throttling từng bước
1. Kubernetes chuyển {{limits.cpu: 500m}} thành quota 50ms trong mỗi period 100ms.
2. App Java có nhiều thread (Tomcat/Netty, GC, ForkJoinPool). Nhiều thread chạy song song trên nhiều core -> đốt quota nhanh.
3. Dùng hết 50ms chỉ sau 15ms thực tế -> kernel **throttle** toàn cgroup tới period sau.
4. Request đang xử lý bị "đóng băng" ~85ms -> latency nhảy vọt; vài request trúng nhịp -> p99 xấu.
5. CPU trung bình trên 1 phút vẫn ~40% — trung bình thấp nhưng có vết cắt gây đuôi latency.

~~~text
Period 100ms, limit 500m (quota 50ms)
0ms      15ms                          100ms       115ms
|--RUN 50ms--|======== THROTTLED =========|--RUN 50ms-->
  (đa thread đốt quota nhanh, chạy song song nhiều core)
Request A trúng đoạn throttle -> +85ms latency
~~~

### Ví dụ quan sát (output thật / cgroup v2)
~~~text
# /sys/fs/cgroup/cpu.stat
nr_periods 1200
nr_throttled 540
throttled_usec 18500000
~~~
540/1200 period bị throttle; tổng ~18.5s bị dừng. Metric Prometheus (cAdvisor): {{container_cpu_cfs_throttled_periods_total}} / {{container_cpu_cfs_periods_total}}.

### Vì sao Java dễ bị ảnh hưởng
- **Nhiều thread song song** tiêu thụ quota "theo bề ngang".
- **Burst ngắn** (JSON, TLS, serialize) kích hoạt throttle.
- JVM sizing theo CPU limit trong một số trường hợp (ít thread/GC serial), nhưng quota vẫn cắt.

### Có nên đặt CPU limit không? (trade-off)
| Lựa chọn | Ưu | Nhược | Hợp khi |
|---|---|---|---|
| Có CPU limit | Chặn Pod "ăn" hết CPU node, bảo vệ hàng xóm | Dễ throttle -> p99 xấu | Batch, không nhạy latency, hoặc limit đủ cao đã đo |
| Không CPU limit, chỉ request | Tránh CFS throttle, latency ổn định | Pod có thể burst ảnh hưởng Pod khác nếu node quá commit | Service online nhạy latency, có giám sát |

Thực tế nhiều team: **giữ CPU request, bỏ CPU limit** cho API latency-sensitive, và đặt {{-XX:ActiveProcessorCount}} để JVM không ảo tưởng có quá nhiều CPU.

~~~bash
JAVA_TOOL_OPTIONS="-XX:ActiveProcessorCount=2 -XX:MaxRAMPercentage=75"
~~~

### Trên production
- **Triệu chứng**: p99/p999 tăng, timeout ngắt quãng, CPU avg 30-50%, throughput không tăng.
- **Cách đo**: tỉ lệ CFS throttled periods (cAdvisor), {{cpu.stat}}, correlate latency spike với {{nr_throttled}}. Load test concurrency cao.
- **Tuning**: nếu giữ limit -> tăng limit (500m -> 2) hoặc giảm worker threads. Nếu bỏ limit -> giữ request thực tế, set ActiveProcessorCount. Kiểm tra GC threads/ForkJoinPool. Cân nhắc HPA theo RPS/latency.

### Câu trả lời sai phổ biến
- "CPU 40% thì không thể là vấn đề CPU": sai — throttling là "cắt theo nhịp", không lộ ở trung bình.
- "Tăng request hết throttle": request ảnh hưởng scheduling; **limit** mới tạo quota throttle.

### Lỗi hay gặp
1. **Limit 500m/1 cho Java nhiều thread**: throttle nặng. Cách tránh: đo throttled ratio; tăng hoặc bỏ limit + ActiveProcessorCount.
2. **Bỏ limit nhưng không set {{-XX:ActiveProcessorCount}}**: JVM thấy toàn bộ core node -> tạo nhiều GC threads. Cách tránh: cố định theo request.
3. **Chỉ nhìn CPU avg dashboard**: bỏ sót throttling. Cách tránh: thêm panel throttled periods.

### Trả lời phỏng vấn
"CPU trung bình thấp mà p99 cao trên Kubernetes thường do CFS throttling. Có CPU limit thì cgroup cấp quota theo period 100ms; app Java nhiều thread đốt quota trong vài chục ms rồi bị kernel tạm dừng đến hết period, nên request bị trễ hàng chục ms lặp lại. Em kiểm tra {{container_cpu_cfs_throttled_periods_total}} và {{cpu.stat}}. Với service nhạy latency, em thường giữ CPU request nhưng cân nhắc bỏ CPU limit, đồng thời đặt {{-XX:ActiveProcessorCount}} theo request để JVM sizing hợp lý. Trade-off: bỏ limit giảm throttle nhưng phải kiểm soát noisy neighbor bằng giám sát."

> Senior tip: Đừng kết luận "code chậm" khi p99 tăng mà CPU avg thấp — kiểm tra CFS throttling trước. Dashboard production nên có tỉ lệ throttled periods; quyết định CPU limit phải đi kèm đo latency dưới tải concurrency thật.`,
    follow: [
      'CFS period 100ms ảnh hưởng thế nào đến workload latency nhạy, và có tuỳ chọn nào khác (cẩn trọng) không?',
      'Làm sao chọn -XX:ActiveProcessorCount khi không đặt CPU limit để cân bằng GC và thread pool?',
      'Nếu buộc phải giữ CPU limit, bạn tune ứng dụng Java và cấu hình thế nào để giảm throttling?'
    ],
    tags: ['Kubernetes', 'CPU', 'CFS', 'Throttling', 'JVM', 'Latency'],
    refs: [
      { type: 'doc', title: 'Assign CPU Resources to Containers and Pods', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/' },
      { type: 'doc', title: 'cgroup v2 CPU controller', url: 'https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu' }
    ]
  },
  {
    id: 'devops-091',
    topic: 'devops',
    level: 'senior',
    q: 'Phân biệt OOMKilled (exit 137) với java.lang.OutOfMemoryError trong container. Giải thích cơ chế cgroup v2 memory (memory.max), oom_score_adj, và cách MaxRAMPercentage ảnh hưởng đến heap; bạn xử lý Pod bị OOMKilled khi heap usage trông vẫn thấp như thế nào?',
    a: `**Tóm tắt:** {{OutOfMemoryError}} do JVM ném khi vùng nhớ JVM quản lý (heap/metaspace) cạn; {{OOMKilled}} do kernel giết process khi tổng bộ nhớ cgroup vượt ngưỡng ({{memory.max}} trên cgroup v2) — exit code 137, thường không có stack trace Java. JVM heap chỉ là một phần RSS; còn metaspace, thread stack, code cache, direct buffer, native. {{MaxRAMPercentage}} tính heap theo giới hạn container nhưng không bao trùm non-heap, nên đặt quá cao vẫn gây OOMKilled.

### Thuật ngữ (giải thích cho người mới)
- **OOMKilled**: kernel (OOM killer) kết thúc process khi hết bộ nhớ; {{Reason: OOMKilled}}, {{Exit Code: 137}} (128 + SIGKILL 9).
- **java.lang.OutOfMemoryError (OOME)**: lỗi Java khi JVM không cấp phát được (Java heap space, Metaspace, unable to create native thread).
- **RSS**: bộ nhớ RAM thực tế process chiếm (heap, metaspace, thread stack, native...).
- **cgroup v2 memory**: {{memory.max}} là trần cứng; vượt có thể kích hoạt OOM. {{memory.high}} là ngưỡng mềm hơn (reclaim/throttle).
- **oom_score_adj**: kernel ưu tiên process bị giết khi OOM; kubelet gán theo QoS/Priority.
- **MaxRAMPercentage**: cờ JVM đặt heap tối đa theo % bộ nhớ container; thay {{-Xmx}} cố định.

### Hai cơ chế OOM — khác "ai quyết định"
| Tiêu chí | java.lang.OutOfMemoryError | OOMKilled (kernel) |
|---|---|---|
| Ai phát hiện | JVM | Linux kernel / cgroup |
| Phạm vi | Vùng nhớ JVM (heap, metaspace) | Tổng memory cgroup (RSS) |
| Dấu hiệu | Exception/stack trace, có thể heap dump | Exit 137, Reason OOMKilled, không stack trace |
| Nguyên nhân điển hình | Leak heap/metaspace, object quá lớn | Heap + non-heap vượt {{memory.max}}; native leak; quá nhiều thread |

### Cơ chế cgroup v2 (từng bước)
1. Container chạy trong cgroup có {{memory.max}} (tương ứng {{limits.memory}}).
2. JVM cấp phát: heap (GC quản lý) + native (thread stack, direct ByteBuffer/Netty, JNI, metaspace, code cache).
3. Kernel theo dõi mức dùng; vượt {{memory.max}} mà không reclaim đủ -> OOM killer chọn victim ({{oom_score_adj}} ảnh hưởng theo QoS).
4. Process nhận SIGKILL -> container chết, Kubernetes ghi OOMKilled.

~~~text
JVM process trong cgroup (memory.max 2Gi)
  Heap (MaxRAMPercentage)  ~1.5Gi
  Metaspace                ~150Mi
  Thread stacks (200*1M)   ~200Mi   (mỗi thread ~1MB stack)
  Code cache/Direct/JNI    ~200Mi
  --------------------------------
  RSS tiến tới 2Gi -> kernel OOM -> SIGKILL (exit 137)
~~~

### MaxRAMPercentage: heap không phải toàn bộ
JVM container support tính heap theo % bộ nhớ container. Production thường đặt ~70-75%. Nhưng thread stack (tuỳ {{-Xss}}), direct buffers (Netty/NIO), metaspace, code cache nằm ngoài heap Java. {{MaxRAMPercentage=90}} trên limit 2Gi có thể để non-heap đẩy RSS vượt 2Gi -> OOMKilled dù heap 60%.

~~~bash
java -XshowSettings:vm -version
# Ví dụ cấu hình
JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -XX:NativeMemoryTracking=summary"
~~~

~~~text
# kubectl describe pod (Last State)
  Last State:     Terminated
    Reason:       OOMKilled
    Exit Code:    137
~~~

### Trên production
- **Triệu chứng**: Pod restart {{OOMKilled}}, heap dùng 50-70%, container working set sát limit; không heap dump OOME.
- **Cách đo**: {{kubectl describe pod}} (Exit 137). Metric {{container_memory_working_set_bytes}} vs limit. NMT: {{jcmd 1 VM.native_memory summary}} (baseline/diff). Đếm thread. Heap dump khi nghi OOME: {{-XX:+HeapDumpOnOutOfMemoryError}}.
- **Tuning**: giảm {{MaxRAMPercentage}} (70-75%), đo load test. Giới hạn thread (Tomcat maxThreads, Hikari maximumPoolSize) và tính pool*stack. Netty/direct: {{-XX:MaxDirectMemorySize}}, metric direct memory. request=limit cho workload critical.

### Câu trả lời sai phổ biến
- "OOMKilled nghĩa là heap leak": chưa chắc — có thể thread/direct/native.
- "Đặt Xmx = memory limit là đúng": sai, bỏ quên non-heap.
- "Tăng limit là cách duy nhất": có thể che leak; phải tìm nguyên nhân.

### Lỗi hay gặp
1. **Thread pool quá lớn** (500 thread * 1MB = ~500MB): RSS vượt limit. Cách tránh: giới hạn thread theo tải thực.
2. **Direct buffer/Netty leak**: heap ổn, RSS tăng. Cách tránh: NMT, metric direct memory, review giải phóng buffer.
3. **Chỉ xem heap dashboard**: bỏ sót container working set. Cách tránh: dashboard cả hai.
4. **Nhiều sidecar chia sẻ limit Pod**: tổng vượt limit. Cách tránh: tính resources từng container.

### Trả lời phỏng vấn
"OOMKilled là kernel giết process vì cgroup vượt giới hạn bộ nhớ (exit 137), còn OutOfMemoryError là JVM ném khi heap/metaspace cạn — khác nguyên nhân và dấu vết. Với cgroup v2, {{memory.max}} là trần cứng; {{oom_score_adj}} gán theo QoS. Heap thấp mà vẫn OOMKilled thường do non-heap: thread stack, metaspace, code cache, direct buffer. {{MaxRAMPercentage}} chỉ đặt heap, không bao trùm non-heap. Em xem container working set, bật NMT, đếm thread, kiểm tra pool và MaxDirectMemorySize, rồi hạ MaxRAMPercentage (thường 70-75%) và giới hạn thread. Đặt alert khi working set tiến sát limit."

> Senior tip: Heap thấp mà OOMKilled: (1) xác nhận working set chạm limit, (2) NMT summary, (3) đếm thread và kiểm tra pool. Đừng vội tăng limit gấp đôi — có thể chỉ mua thời gian cho leak native hoặc thread pool phình.`,
    follow: [
      'NativeMemoryTracking (NMT) cho bạn thấy những vùng nào và bạn dùng diff thế nào để tìm leak?',
      'Giới hạn bộ nhớ chia cho nhiều container trong cùng Pod ra sao và bẫy thường gặp?',
      'Khi nào dùng -XX:MaxDirectMemorySize và làm sao phát hiện direct buffer leak với Netty?'
    ],
    tags: ['Kubernetes', 'OOMKilled', 'JVM', 'cgroup v2', 'MaxRAMPercentage', 'Memory'],
    refs: [
      { type: 'doc', title: 'Assign Memory Resources to Containers and Pods', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/' },
      { type: 'doc', title: 'Node-pressure Eviction', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/' }
    ]
  },
  {
    id: 'devops-092',
    topic: 'devops',
    level: 'senior',
    q: 'Kubernetes Service định tuyến traffic tới Pod như thế nào với kube-proxy chế độ iptables và IPVS? Conntrack (bảng theo dõi kết nối) liên quan gì, và vì sao kết nối keep-alive lâu dài hoặc gRPC làm cân bằng tải bị lệch giữa các Pod?',
    a: `**Tóm tắt:** Service có ClusterIP (IP ảo); kube-proxy lập trình datapath trên mỗi node để gói tới ClusterIP:port được DNAT tới Pod backend. iptables dùng chuỗi rule (phân bổ theo xác suất) và dựa conntrack để "ghim" flow vào backend; IPVS dùng bảng L4 trong kernel, hiệu năng tốt hơn khi nhiều Service. Với HTTP keep-alive hoặc gRPC (kết nối TCP dài, nhiều request/stream chung một kết nối), chọn backend xảy ra **một lần khi tạo kết nối** — Pod mới scale lên không nhận tải từ kết nối cũ, gây lệch.

### Thuật ngữ (giải thích cho người mới)
- **ClusterIP**: IP ảo ổn định của Service, có ý nghĩa trong cơ chế routing cluster.
- **kube-proxy**: chạy trên mỗi node, watch Service/EndpointSlice và cài rule (iptables/IPVS) để chuyển traffic.
- **DNAT**: đổi địa chỉ đích (ClusterIP -> Pod IP).
- **iptables**: framework tường lửa/NAT Linux dựa chuỗi rule, xử lý tuần tự.
- **IPVS (IP Virtual Server)**: cân bằng tải L4 trong kernel, bảng hash/thuật toán (rr, lc...), scale tốt hơn khi nhiều Service.
- **Conntrack**: bảng trạng thái kết nối kernel để NAT nhớ flow đã DNAT tới đâu.
- **Keep-alive / gRPC channel**: giữ kết nối TCP mở lâu để gửi nhiều request/HTTP2 streams — giảm handshake nhưng "dính" backend.

### iptables mode: cơ chế từng bước
1. kube-proxy watch Service và EndpointSlice.
2. Tạo chain iptables ({{KUBE-SERVICES}}, {{KUBE-SVC-*}}, {{KUBE-SEP-*}}).
3. Gói tới {{ClusterIP:port}} khớp {{KUBE-SERVICES}} -> chain Service.
4. Chain Service chọn backend theo xác suất ({{statistic}}) -> {{KUBE-SEP-*}}.
5. SEP DNAT tới {{PodIP:targetPort}}.
6. **Conntrack** ghi mapping flow (5-tuple). Các gói tiếp theo của **cùng kết nối TCP** đi theo conntrack, không chọn lại Pod.

~~~text
Client -> ClusterIP:80 (SYN)
  iptables: KUBE-SVC -> chọn SEP-PodB (statistic)
  DNAT -> 10.244.2.7:8080
  conntrack: [client:ephemeral -> ClusterIP:80] => PodB
Request sau trên CÙNG TCP connection -> vẫn tới PodB (theo conntrack)
~~~

### IPVS mode: khác gì
- kube-proxy lập virtual server cho ClusterIP với real servers (Pod); kernel phân phối theo thuật toán (rr/lc/sh).
- Vẫn dùng conntrack/NAT trong nhiều thiết lập; lookup thường hiệu quả hơn khi hàng nghìn Service.
- **Kết nối dài** vẫn gắn flow/backend -> không "chữa" lệch tải L7.

| Tiêu chí | iptables | IPVS |
|---|---|---|
| Cấu trúc | Chuỗi rule | Bảng virtual server + real servers |
| Scale nhiều Service | Có thể chậm/cồng kềnh | Thường tốt hơn |
| Thuật toán LB | Rule/statistic | rr, lc, sh... |
| Debug | {{iptables-save}} | {{ipvsadm -Ln}} |
| Kết nối dài | Ghim theo conntrack | Vẫn gắn flow/backend |

### Vì sao keep-alive / gRPC gây lệch tải
1. Client tạo kết nối TCP tới ClusterIP và giữ mở (HTTP/1.1 keep-alive, HTTP/2 gRPC).
2. Lần đầu: datapath chọn Pod A -> DNAT -> conntrack ghi nhớ.
3. 1000 request tiếp theo trên **cùng kết nối** -> tất cả tới Pod A. Pod B, C mới scale lên không nhận request từ kết nối đó.
4. Ít client connection nhưng mỗi connection bơm nhiều request -> một Pod nóng, Pod khác nguội.

~~~text
Trước scale: 3 connections -> Pod1, Pod1, Pod2 (lệch)
Scale thêm Pod3, Pod4: connections cũ vẫn ghim Pod1/Pod2 -> Pod3,Pod4 rảnh
~~~

### Trên production
- **Triệu chứng**: scale out nhưng vài Pod CPU/latency cao, Pod mới thấp. gRPC nội bộ lệch rõ.
- **Cách đo**: so RPS/CPU/latency per-pod; số connection ({{ss -tnp}}); conntrack {{nf_conntrack_count}}.
- **Xử lý**:
  - **Client-side load balancing** cho gRPC: headless Service ({{clusterIP: None}}) + client LB/resolver, hoặc service mesh (xDS/L7).
  - Cấu hình max connection age/idle cho gRPC channel để tái phân phối.
  - Tăng số connection trong pool để phân tán.
  - IPVS cải thiện datapath nhưng không sửa bản chất kết nối dài.

### Câu trả lời sai phổ biến
- "Service round-robin mỗi request": sai với TCP connection đã thiết lập; quyết định gắn với flow.
- "IPVS tự fix lệch tải gRPC": không, vấn đề nằm ở kết nối dài/L7.
- "Thêm Pod hết nóng": kết nối cũ vẫn ghim Pod cũ.

### Lỗi hay gặp
1. **gRPC nội bộ qua ClusterIP**: channel giữ lâu -> lệch. Cách tránh: client-side LB, headless Service, max connection age.
2. **Gateway giữ ít kết nối upstream**: upstream lệch. Cách tránh: tuning pool/L7 balancing ở gateway.
3. **Conntrack table đầy** (nhiều connection ngắn): drop gói. Cách tránh: giám sát {{nf_conntrack_count}} vs max, giảm churn.

### Trả lời phỏng vấn
"kube-proxy lập trình đường đi ClusterIP -> Pod: iptables cài rule DNAT và chọn backend theo statistic; IPVS dùng bảng L4, scale tốt hơn khi nhiều Service. Cả hai gắn với conntrack: một kết nối TCP DNAT tới Pod thì request sau trên cùng kết nối vẫn tới Pod đó. Nên HTTP keep-alive lâu hoặc gRPC (nhiều stream trên một kết nối dài) làm cân bằng tải lệch: Pod mới không nhận traffic từ kết nối cũ. Em xử lý bằng client-side load balancing cho gRPC (headless Service, service mesh, max connection age) và theo dõi metric per-pod. IPVS giúp datapath nhưng không giải quyết bản chất L7."

> Senior tip: "Scale out mà Pod mới ngồi chơi" — kiểm tra pattern kết nối (keep-alive/gRPC) và phân phối per-pod. Với gRPC nội bộ, cân bằng tải ở tầng client/mesh hiệu quả hơn xoay xở kube-proxy mode.`,
    follow: [
      'Headless Service hoạt động thế nào và vì sao gRPC client-side LB thường dùng nó?',
      'Conntrack đầy gây triệu chứng gì và bạn giám sát/xử lý ra sao trên node production?',
      'Service mesh (sidecar/eBPF) thay đổi đường đi traffic và cách cân bằng tải so với kube-proxy thế nào?'
    ],
    tags: ['Kubernetes', 'Service', 'kube-proxy', 'iptables', 'IPVS', 'conntrack', 'gRPC'],
    refs: [
      { type: 'doc', title: 'Virtual IPs and Service Proxies', url: 'https://kubernetes.io/docs/reference/networking/virtual-ips/' },
      { type: 'doc', title: 'Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' }
    ]
  },
  {
    id: 'devops-093',
    topic: 'devops',
    level: 'lead',
    q: 'Ở quy mô lớn, rolling update với maxSurge/maxUnavailable, readiness/liveness/startup probe, preStop và terminationGracePeriodSeconds tương tác thế nào? Thiết kế chiến lược deploy zero-downtime và những guardrail bạn đặt ra là gì?',
    a: `**Tóm tắt:** Rolling update thay Pod dần theo {{maxSurge}} (tạo thêm) và {{maxUnavailable}} (cho phép thiếu). Zero-downtime cần: Pod mới chỉ nhận traffic khi readiness thật sự sẵn sàng (sau startup/warm-up), Pod cũ rời traffic êm trước khi tắt (preStop + graceful shutdown) và không bị SIGKILL giữa chừng (grace period đủ). Quy mô lớn cần thêm PDB, minReadySeconds, progressDeadline/rollback tự động, canary khi rủi ro cao, và tương thích ngược schema/config vì hai phiên bản chạy song song.

### Thuật ngữ (giải thích cho người mới)
- **maxSurge / maxUnavailable**: surge là số Pod vượt desired; unavailable là số Pod được phép không sẵn sàng khi cập nhật.
- **Readiness/Liveness/Startup probe**: readiness quyết định Pod nhận traffic; liveness restart khi "kẹt"; startup cho thời gian khởi động trước khi liveness/readiness "thắt".
- **preStop hook**: chạy trước SIGTERM; hay dùng {{sleep}} để chờ endpoint gỡ khỏi proxy.
- **terminationGracePeriodSeconds**: thời gian tối đa trước SIGKILL; phải đủ cho preStop + graceful shutdown.
- **PDB (PodDisruptionBudget)**: giới hạn gián đoạn tự nguyện (drain/upgrade) cùng lúc.

### Tương tác cơ chế (từng bước)
1. **Pod mới**: scale lên theo surge. Qua startup rồi readiness mới Available và vào EndpointSlice.
2. **Pod cũ**: khi Pod mới Available, Deployment giảm Pod cũ. Hai luồng song song:
   - Endpoint controller gỡ Pod khỏi EndpointSlice -> proxy cập nhật (có độ trễ lan truyền).
   - Kubelet chạy preStop, rồi SIGTERM; app (Spring {{server.shutdown=graceful}}) ngừng nhận request mới, chờ in-flight.
3. **Race gây 502**: không preStop thì app đóng socket khi proxy vẫn route. Grace period ngắn -> SIGKILL cắt request.

~~~text
Pod cũ Terminating
  t0: gỡ endpoint (lan truyền dần)  ||  preStop sleep 10s (vẫn phục vụ)
  t10: SIGTERM -> graceful drain in-flight
  t40: xong
  t60: terminationGracePeriod hết -> SIGKILL (nếu còn)
~~~

### Ví dụ cấu hình
~~~yaml
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }
minReadySeconds: 15
template:
  spec:
    terminationGracePeriodSeconds: 60
    containers:
    - name: payment
      lifecycle:
        preStop: { exec: { command: ["sh","-c","sleep 10"] } }
      readinessProbe:
        httpGet: { path: /actuator/health/readiness, port: 8080 }
      livenessProbe:
        httpGet: { path: /actuator/health/liveness, port: 8080 }
      startupProbe:
        httpGet: { path: /actuator/health/liveness, port: 8080 }
        failureThreshold: 30
~~~
Spring: {{server.shutdown=graceful}}, {{spring.lifecycle.timeout-per-shutdown-phase=30s}}.

### Vai trò từng probe (tránh restart storm / nhận traffic sớm)
| Probe | Sai lầm | Hậu quả |
|---|---|---|
| startup | Liveness quá sớm với app khởi động 90s | Liveness kill -> CrashLoop, rollout tắc |
| readiness | Chỉ check TCP mở, chưa warm DB/cache | Pod mới nhận traffic -> lỗi/latency |
| liveness | Check DB/external dependency | DB chậm -> restart hàng loạt |

Nguyên tắc: liveness kiểm tra "process còn sống"; readiness kiểm tra "có nên nhận traffic".

### Guardrail ở quy mô lớn (lead)
- **PDB**: luôn còn tối thiểu Pod khi drain; phối hợp replicas.
- **minReadySeconds**: Pod Ready ổn định trước khi tiến bước.
- **progressDeadlineSeconds** + rollback/canary tự động (Argo Rollouts/Flagger/CI).
- **Tương thích ngược**: DB schema expand-contract, API backward compatible (version cũ/mới chạy song song).
- **Grace period đủ**: > preStop + timeout shutdown + buffer.

### Trên production
- **Triệu chứng**: 502/503 khi deploy; spike per version; consumer Kafka xử lý trùng do SIGKILL trước commit.
- **Cách đo**: load test liên tục trong deploy (error budget không vượt), error rate/latency per version, event rollout, thời gian shutdown thực tế.
- **Tuning**: preStop 5-15s tuỳ LB; tăng grace period cho request dài nhưng hỗ trợ idempotency/retry; image distroless dùng sleep action/httpGet drain.

### Câu trả lời sai phổ biến
- "Rolling update mặc định là zero-downtime": không, nếu probe/shutdown sai.
- "Chỉ preStop sleep là đủ": còn cần graceful shutdown và grace period đủ.
- "maxUnavailable 0 luôn tốt": tốn surge; cluster nhỏ có thể không đủ chỗ.

### Lỗi hay gặp
1. **Liveness check dependency ngoài**: restart hàng loạt khi DB chậm. Cách tránh: liveness nội bộ.
2. **Grace period < thời gian xử lý request dài**: SIGKILL cắt ngang. Cách tránh: đo P99 xử lý, tăng grace period.
3. **Schema breaking khi hai version chạy**: lỗi nghiệp vụ. Cách tránh: expand-contract, feature flag.

### Trả lời phỏng vấn (lead)
"Zero-downtime là phối hợp: rolling update kiểm soát tốc độ (thường maxUnavailable 0, surge vừa phải), startup/readiness đảm bảo Pod mới sẵn sàng, preStop + SIGTERM graceful + terminationGracePeriod đủ để Pod cũ rời êm và xử lý hết in-flight. Quy mô lớn em thêm PDB, minReadySeconds, progressDeadline, rollback/canary tự động và tương thích ngược. Em không tin cấu hình bằng cảm giác: load test liên tục trong deploy trên staging với ngưỡng error rate/latency làm gate."

> Senior tip: Coi deploy là thí nghiệm có kiểm soát: đo error rate per-version, rollback tự động khi vượt ngưỡng, rehearsal runbook. Nhiều thất bại "zero-downtime" đến từ DB migration hoặc dependency chậm, không chỉ từ YAML — guardrail phải bao cả tầng dữ liệu.`,
    follow: [
      'Làm sao thiết kế deploy khi request có thể chạy tới 2-5 phút (long-running) mà vẫn không bị cắt?',
      'PDB tương tác với node drain và rolling update thế nào, và khi nào PDB chặn cả hai?',
      'Khi nào bạn chọn canary/blue-green thay vì rolling update thuần cho service thanh toán?'
    ],
    tags: ['Kubernetes', 'RollingUpdate', 'Probes', 'GracefulShutdown', 'PDB', 'ZeroDowntime'],
    refs: [
      { type: 'doc', title: 'Pod Lifecycle (Termination)', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination' },
      { type: 'doc', title: 'Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' }
    ]
  },
  {
    id: 'devops-094',
    topic: 'devops',
    level: 'senior',
    q: 'HPA (Horizontal Pod Autoscaler) tính số replica theo công thức nào? Stabilization window hoạt động ra sao, và khi scale theo custom metric (ví dụ RPS, queue depth) qua Prometheus Adapter, pipeline dữ liệu đi như thế nào? Bạn tránh scale dao động (flapping) ra sao?',
    a: `**Tóm tắt:** HPA (v2) lấy metric từ Metrics API, tính {{desiredReplicas = ceil(currentReplicas * currentMetric / targetMetric)}} cho từng metric rồi chọn giá trị phù hợp (thường max để đáp ứng metric căng nhất), trong min/max. Stabilization window giữ lịch sử khuyến nghị để tránh flapping: scale down mặc định nhìn lại 300s. Custom metric đi qua Prometheus -> Adapter -> Custom/External Metrics API -> HPA. Cần metric đúng (per-pod khi cần), chống nhiễu, và hiểu độ trễ pipeline.

### Thuật ngữ (giải thích cho người mới)
- **HPA**: controller tự tăng/giảm replica của workload theo metric.
- **Metrics API**: API cung cấp CPU/memory (thường metrics-server).
- **Custom/External Metrics API**: API cho metric tuỳ chỉnh/external, thường do Prometheus Adapter cung cấp.
- **Prometheus Adapter**: đọc metric từ Prometheus và "dịch" thành API mà HPA hiểu.
- **Stabilization window**: khoảng thời gian HPA xét đề xuất trước đó để giảm dao động.
- **Flapping**: scale up/down liên tục do metric nhiễu hoặc cấu hình không phù hợp.

### Công thức tính replica (từng bước)
1. Lấy {{currentMetricValue}} (ví dụ CPU trung bình 90% của request) và {{target}} (60%).
2. {{desired = ceil(currentReplicas * currentMetricValue / target)}}. Ví dụ: ceil(4 * 90 / 60) = 6.
3. Áp tolerance (mặc định ~10%) để tránh phản ứng dao động nhỏ.
4. Nhiều metric -> tính desired cho từng metric và chọn **cao nhất**.
5. Kẹp trong {{minReplicas}}..{{maxReplicas}}, áp behavior (stabilization, policies).

~~~text
4 replicas, CPU avg 90%, target 60%  -> ceil(4*90/60)=6
6 replicas, RPS/pod avg 120, target 100 -> ceil(6*120/100)=8
=> HPA chọn 8 (max các đề xuất)
~~~

### Stabilization window (cơ chế)
- {{scaleDown.stabilizationWindowSeconds}} mặc định 300: HPA xem desired trong cửa sổ và chọn **cao nhất** khi scale down -> giữ Pod lâu hơn, tránh cắt sớm.
- Scale up thường cửa sổ 0 để phản ứng nhanh.
- {{policies}} giới hạn tốc độ (ví dụ tối đa +100%/30s, giảm 1 Pod/60s).

~~~yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0
    policies: [{ type: Percent, value: 100, periodSeconds: 30 }]
  scaleDown:
    stabilizationWindowSeconds: 300
    policies: [{ type: Pods, value: 1, periodSeconds: 60 }]
~~~

### Pipeline custom metric (Prometheus Adapter)
~~~seq
title: HPA custom metric (RPS)
actors: App | Prometheus | Adapter | API Server | HPA
App -> Prometheus: scrape /metrics
Prometheus -> Prometheus: recording rule rate()
Adapter -> Prometheus: PromQL query
Adapter -> API Server: custom.metrics.k8s.io
HPA -> API Server: GET custom metric
HPA -> HPA: compute desiredReplicas
~~~
Độ trễ cộng dồn (scrape, eval, adapter, HPA sync ~15s) có thể 30-60s+ -> HPA phản ứng theo phút.

### Trên production
- **Triệu chứng**: scale lên chậm; flapping; scale lên tối đa do metric cấu hình sai; CPU thấp nhưng latency xấu (I/O-bound).
- **Cách đo**: {{kubectl describe hpa}} (metric hiện tại, desired, events), kiểm tra metric nguồn Prometheus và mapping adapter.
- **Tuning**: chọn metric gần tải (lag/queue cho consumer, RPS/in-flight cho API I/O-bound). Metric trung bình per-pod đúng type. Scale up nhanh/scale down chậm. minReplicas đủ nền; maxReplicas ràng buộc downstream (DB connections = pool * replicas). Với Java: readiness đúng để tránh CPU ảo do JIT.

### Câu trả lời sai phổ biến
- "HPA scale tức thì khi vượt target": có chu kỳ sync + độ trễ pipeline.
- "Nhiều metric luôn tốt hơn": có thể chọn max và scale quá mức nếu một metric nhiễu.
- "CPU đủ cho mọi service": I/O-bound có CPU thấp nhưng latency cao.

### Lỗi hay gặp
1. **Custom metric cấu hình sai (label/PromQL)**: HPA đọc 0 hoặc sai -> scale sai. Cách tránh: kiểm tra custom metrics API.
2. **Nhầm metric tổng vs per-pod**: công thức sai. Cách tránh: dùng type Pods/AverageValue đúng.
3. **Flapping do target sát nhiễu**: tăng stabilization, smoothing (rate window).
4. **maxReplicas vượt số partition Kafka**: Pod thừa, rebalance. Cách tránh: maxReplicas <= partitions.

### Trả lời phỏng vấn
"HPA tính desired = ceil(currentReplicas * currentMetric / target) cho từng metric, áp tolerance, chọn giá trị đáp ứng metric căng nhất trong min/max. Stabilization window (scale down mặc định 300s) giữ lịch sử đề xuất để tránh flapping. Custom metric đi từ app -> Prometheus -> Adapter -> Custom Metrics API -> HPA, nên có độ trễ chục giây. Em chọn metric gần tải (RPS/lag) hơn CPU cho service I/O-bound, scale up nhanh/scale down chậm, và luôn kiểm tra giới hạn downstream như DB connections khi đặt maxReplicas."

> Senior tip: Luôn {{kubectl describe hpa}} để xem metric HPA thực sự nhìn thấy — nhiều sự cố autoscale do adapter/PromQL trả giá trị khác kỳ vọng. Đừng quên maxReplicas * connection pool có thể tự DDoS database.`,
    follow: [
      'Khi HPA dùng nhiều metric, làm sao debug trường hợp replica bị đẩy lên do một metric phụ?',
      'Làm sao thiết kế metric RPS per-pod ổn định (tránh nhiễu) cho HPA?',
      'KEDA khác HPA thuần ở điểm nào và khi nào bạn chọn KEDA cho queue/cron?'
    ],
    tags: ['Kubernetes', 'HPA', 'Autoscaling', 'Prometheus', 'CustomMetrics', 'Stabilization'],
    refs: [
      { type: 'doc', title: 'Horizontal Pod Autoscaling', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/' },
      { type: 'doc', title: 'HPA Walkthrough', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/' }
    ]
  },
  {
    id: 'devops-095',
    topic: 'devops',
    level: 'lead',
    q: 'HPA, PodDisruptionBudget (PDB), và Cluster Autoscaler tương tác thế nào khi traffic tăng đột biến và khi node được bảo trì/drain? Bạn thiết kế chính sách disruption và capacity để vừa scale nhanh vừa không làm rớt SLO ra sao?',
    a: `**Tóm tắt:** HPA tăng/giảm replica theo metric (phút); Cluster Autoscaler (CA) thêm/bớt node khi Pod Pending thiếu tài nguyên hoặc node dưới tải (phút tới chục phút). PDB giới hạn gián đoạn tự nguyện cùng lúc (drain, upgrade). Tương tác: HPA scale lên -> Pod Pending -> CA thêm node (chậm); drain node tôn trọng PDB nên có thể bị chặn nếu PDB quá chặt/thiếu replica. Thiết kế cần minReplicas/PDB/maxUnavailable cân bằng, headroom cho burst, maxReplicas ràng buộc downstream, và quy trình bảo trì có checklist.

### Thuật ngữ (giải thích cho người mới)
- **Cluster Autoscaler (CA)**: tăng node khi Pod Pending không xếp được do thiếu tài nguyên; giảm node khi dưới tải an toàn.
- **PDB (PodDisruptionBudget)**: "luôn còn ít nhất X Pod" ({{minAvailable}}) hoặc "tối đa Y Pod gián đoạn" ({{maxUnavailable}}) cho gián đoạn **tự nguyện** (drain).
- **Drain node**: đuổi Pod khỏi node để bảo trì; tôn trọng PDB.
- **SLO (Service Level Objective)**: mục tiêu mức dịch vụ (ví dụ 99.9% thành công, p99 < 300ms).

### Tương tác (từng bước)
#### Traffic tăng đột biến
1. Metric tăng -> HPA tăng desired replicas -> tạo Pod mới.
2. Đủ tài nguyên: scheduler đặt Pod -> startup/readiness -> nhận traffic.
3. Thiếu tài nguyên: Pod Pending ({{Insufficient cpu/memory}}).
4. CA thấy Pending có thể giải quyết bằng thêm node -> scale node pool (cloud API). **Độ trễ**: vài phút (provision + join + image pull).
5. Node mới Ready -> đặt Pod -> warm-up. Đỉnh ngắn có thể qua trước khi kịp.

#### Bảo trì/drain node
1. Drain evict Pod tự nguyện.
2. Eviction API kiểm tra PDB: vi phạm -> eviction bị từ chối/hoãn.
3. Pod tạo lại trên node khác; thiếu chỗ -> Pending -> CA có thể thêm node.
4. PDB quá chặt (minAvailable = replicas) hoặc replicas quá ít -> drain kẹt.

~~~text
HPA: tăng replica -> Pod Pending -> CA: thêm node (phút)
Drain: evict Pod -> PDB cho phép? -> không: drain blocked
~~~

### Thiết kế chính sách (lead, trade-off)
| Mục tiêu | Cơ chế | Trade-off |
|---|---|---|
| Chịu burst nhanh | minReplicas cao, headroom/overprovisioning | Chi phí |
| Scale linh hoạt | HPA + CA | Độ trễ thêm node, cold start Java |
| Không rớt khi bảo trì | PDB hợp lý, đủ replicas | PDB quá chặt chặn drain/upgrade |
| Bảo vệ downstream | maxReplicas * pool <= DB limit | Giới hạn scale |

~~~yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb }
spec:
  maxUnavailable: 1
  selector: { matchLabels: { app: payment } }
~~~
Replicas nhỏ (2-3) cẩn thận với {{minAvailable}} tuyệt đối; đảm bảo luôn evict được ít nhất 1 Pod khi drain.

### Trên production
- **Triệu chứng**: drain treo (PDB block); HPA scale nhưng Pod Pending lâu (CA chậm/quota cloud); sau bảo trì SLO giảm.
- **Cách đo**: {{kubectl get/describe pdb}} (Allowed disruptions), events FailedScheduling, log CA, thời gian provision node, SLO/error budget.
- **Tuning**: minReplicas theo tải nền; scheduled scaling cho đỉnh biết trước. PDB {{maxUnavailable: 1}} để drain tiến triển; tăng replicas trước nâng cấp lớn. CA cấu hình node pool, cân nhắc image pre-pull/buffer. maxReplicas tính cả DB connections. "Game day": drain node, burst test, xác nhận PDB/CA.

### Câu trả lời sai phổ biến
- "PDB ngăn mọi Pod bị giết": chỉ gián đoạn **tự nguyện**; node chết/OOMKilled/preemption không bị PDB chặn theo cách đó.
- "CA làm HPA scale tức thì": CA thêm node chậm; không thay warm-up app.
- "PDB càng chặt càng an toàn": quá chặt gây kẹt vận hành, trì hoãn vá bảo mật.

### Lỗi hay gặp
1. **Replicas = 1, PDB minAvailable 1**: không thể drain. Cách tránh: >=2 replicas cho HA + PDB hợp lý.
2. **maxReplicas lớn nhưng DB chỉ chịu N connections**: scale sập DB. Cách tránh: capacity planning end-to-end.
3. **CA chậm + Java cold start**: SLO vi phạm. Cách tránh: buffer capacity, giảm startup.
4. **Không kiểm tra Allowed disruptions**: bất ngờ khi drain. Cách tránh: {{kubectl describe pdb}} trong runbook.

### Trả lời phỏng vấn (lead)
"HPA quyết định replica theo metric, CA quyết định node khi Pod Pending thiếu tài nguyên — hai vòng lặp khác tốc độ. PDB bảo vệ số Pod tối thiểu khi gián đoạn tự nguyện (drain), nên có thể chặn eviction nếu quá chặt. Em thiết kế: minReplicas đủ nền, HPA scale up nhanh/scale down chậm, maxReplicas ràng buộc downstream (DB pool), PDB cho phép drain tiến triển (maxUnavailable 1) và luôn đủ replicas để PDB khả thi. Burst khó đoán thì chấp nhận headroom/scheduled scaling; bảo trì thì tăng replica trước, kiểm tra Allowed disruptions. PDB không bảo vệ khỏi node crash hay OOMKilled — đó là việc của HA và thiết kế chịu lỗi."

> Senior tip: Trước nâng cấp node pool: replicas đủ, {{kubectl describe pdb}} còn Allowed disruptions, CA/quota cloud đủ, dashboard SLO sẵn sàng. Nhiều ca "drain kẹt 2 giờ" chỉ vì PDB minAvailable bằng đúng số replica hiện tại.`,
    follow: [
      'Làm sao tính minAvailable/maxUnavailable cho PDB khi service có replicas thay đổi theo HPA?',
      'Cluster Autoscaler quyết định scale down node dựa trên tiêu chí nào và Pod nào có thể chặn việc này?',
      'Khi traffic spike, bạn ưu tiên phản ứng bằng HPA, buffer tĩnh, hay overprovisioning — tiêu chí chọn là gì?'
    ],
    tags: ['Kubernetes', 'HPA', 'PDB', 'ClusterAutoscaler', 'Disruption', 'SRE', 'Leadership'],
    refs: [
      { type: 'doc', title: 'Specifying a Disruption Budget for your Application', url: 'https://kubernetes.io/docs/tasks/run-application/configure-pdb/' },
      { type: 'doc', title: 'Cluster Autoscaler', url: 'https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler' }
    ]
  }

  ,{
    id: 'devops-096',
    topic: 'devops',
    level: 'mid',
    q: 'So sánh GitFlow và trunk-based development cho team Java backend: khi nào chọn cái nào, và quy tắc branch/commit/MR ra sao?',
    a: `**Tóm tắt:** **Trunk-based** (một nhánh chính, nhánh tính năng sống ngắn dưới 1–2 ngày, tính năng chưa xong ẩn sau feature flag) hợp với service backend deploy liên tục. **GitFlow** (develop, release, hotfix) hợp khi phải phát hành theo đợt và duy trì nhiều phiên bản song song, như app mobile hoặc phần mềm cài tại khách hàng. Với team Java backend làm SaaS/microservice, tôi chọn trunk-based kèm quy tắc MR nhỏ, CI bắt buộc xanh và branch protection.

### Vì sao cần quy ước nhánh
Không có quy ước, mỗi người giữ nhánh riêng hàng tuần → merge conflict lớn, review 2.000 dòng không ai đọc kỹ, và ngày release là ngày "ghép" đầy rủi ro. Quy ước nhánh là thoả thuận về **cách thay đổi đi vào production**.

### GitFlow vận hành ra sao
- {{main}} chỉ chứa code đã release (có tag); {{develop}} là nơi tích hợp.
- {{feature/*}} tách từ develop; {{release/*}} tách ra để ổn định trước khi phát hành; {{hotfix/*}} tách từ main, merge về cả main và develop.
- Ưu: kiểm soát phát hành rõ, hỗ trợ nhiều phiên bản. Nhược: nhiều nhánh sống lâu, merge hai chiều dễ quên, độ trễ từ commit tới production dài.

### Trunk-based vận hành ra sao
- Mọi người tích hợp vào {{main}} ít nhất mỗi ngày qua MR nhỏ; CI chạy mỗi commit; main luôn deploy được.
- Tính năng dở dang ẩn sau **feature flag** (cấu hình, Unleash, LaunchDarkly…), bật dần theo nhóm người dùng.
- Hotfix: sửa trên main rồi deploy như mọi thay đổi khác; nếu cần vá bản cũ thì cherry-pick vào nhánh release ngắn hạn.

| Tiêu chí | GitFlow | Trunk-based |
|---|---|---|
| Tần suất phát hành | Theo đợt (tuần/tháng) | Nhiều lần mỗi ngày |
| Nhánh sống lâu | Nhiều | Gần như không |
| Merge conflict | Lớn, dồn cuối | Nhỏ, liên tục |
| Feature flag | Không bắt buộc | Bắt buộc với việc dở dang |
| Hợp với | Mobile, on-premise, nhiều phiên bản | SaaS, microservice |

### Quy tắc MR/commit tôi áp dụng
- MR dưới khoảng 400 dòng thay đổi, một mục đích; có mô tả "vì sao" và cách test.
- Branch protection: không push thẳng main, ít nhất 1 review, CI xanh (build, test, scan) mới được merge, nhánh phải cập nhật với main.
- Commit theo Conventional Commits ({{feat:}}, {{fix:}}, {{chore:}}) để sinh changelog và tự tăng version.
- Feature flag có **chủ sở hữu và ngày hết hạn**; xoá flag sau khi bật 100% vài tuần.

### Ví dụ đời thực
Team 8 dev backend dùng GitFlow: release 2 tuần một lần, ngày release thường mất cả buổi chiều xử lý conflict từ 10–15 nhánh feature sống trung bình 9 ngày; 1/3 lần release có hotfix trong 24 giờ. Chuyển sang trunk-based: nhánh sống trung bình 1,2 ngày, MR trung bình 180 dòng, deploy 3–5 lần mỗi ngày, tính năng lớn ẩn sau flag. Sau 3 tháng, lead time từ commit tới production giảm **từ 8 ngày xuống dưới 1 ngày**, tỉ lệ deploy gây sự cố giảm từ 30% xuống khoảng 8% (đo theo số deploy cần rollback/hotfix).

### Pitfall
- Gọi là trunk-based nhưng nhánh vẫn sống cả tuần.
- Feature flag không bao giờ xoá → code đầy nhánh if chết, tổ hợp flag không ai test.
- Trunk-based mà CI chậm 40 phút hoặc test không đáng tin → main hay đỏ, mọi người sợ merge.
- Dùng GitFlow cho service chỉ có một phiên bản production → thêm nghi thức mà không thêm giá trị.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn theo cách sản phẩm được phát hành. Nếu phải phát hành theo đợt và duy trì nhiều phiên bản song song, như app mobile hay phần mềm cài tại khách hàng, thì GitFlow hợp lý vì có nhánh release và hotfix rõ ràng. Còn với service backend deploy liên tục, tôi chọn trunk-based: mọi người tích hợp vào main ít nhất mỗi ngày qua MR nhỏ, CI chạy mỗi commit, main luôn deploy được, việc dở dang thì ẩn sau feature flag. Quy tắc đi kèm là MR dưới khoảng 400 dòng, branch protection với review và CI xanh bắt buộc, Conventional Commits để sinh changelog, và mỗi feature flag có người chịu trách nhiệm và hạn xoá. Ở team trước, chuyển từ GitFlow sang trunk-based giúp lead time từ commit tới production giảm từ khoảng 8 ngày xuống dưới 1 ngày, và ngày release không còn là ngày giải quyết conflict."

> Senior tip: đo hai con số trước khi tranh luận về mô hình nhánh: tuổi trung bình của nhánh khi merge và kích thước MR trung bình. Nhánh trên 3 ngày hoặc MR trên 800 dòng là vấn đề, dù team đang gọi quy trình của mình là gì.`,
    follow: [
      'Feature flag nên quản lý ở đâu và lifecycle ra sao?',
      'Làm sao xử lý hotfix trong trunk-based?',
      'Branch protection rules tối thiểu là gì?'
    ],
    tags: ['Git', 'Workflow', 'TrunkBased', 'GitFlow']
  }


  ,{
    id: 'devops-097',
    topic: 'devops',
    level: 'mid',
    q: 'GitLab CI: stages, jobs, cache vs artifacts, runner shell/docker và biến bảo mật masked/protected hoạt động thế nào?',
    a: `**Tóm tắt:** GitLab CI chạy pipeline theo stage (tuần tự) và job (song song trong stage); cache tái dùng dependency giữa run, artifacts truyền file giữa stage; runner (shell/docker) thực thi; biến masked/protected che secret.

### Stage & job
- stages khai báo trong .gitlab-ci.yml, ví dụ build, test, deploy; stage sau chỉ chạy khi stage trước pass.
- Job trong cùng stage chạy song song, mỗi job có script, image, rules, timeout.
- Dùng needs để DAG: job deploy không cần chờ toàn stage test nếu chỉ phụ thuộc build.

### Cache vs artifacts
- cache: thư mục dependency (Maven .m2, npm node_modules) lưu trên runner/storage, tái dùng giữa pipeline để build nhanh; key theo lock file (pom.xml hash).
- artifacts: file kết quả build/test report cần truyền sang stage sau hoặc download; có expire_in (mặc định 30 ngày) để tiết kiệm storage.
- Sai lầm: cache artifact lớn (target/) làm chậm; artifacts chứa secret.

### Runner
- shared runner (GitLab cung cấp) vs specific runner (tự host) cho workload nặng/bảo mật.
- executor shell: chạy trên máy host, nhanh nhưng bẩn (state leak).
- executor docker: mỗi job trong container sạch, image chỉ định (maven:3.9-eclipse-temurin-17).
- Kubernetes executor: scale pod theo job.

### Biến bảo mật
- CI/CD Variables: masked (giá trị không in ra log, thay bằng [MASKED]), protected (chỉ inject vào protected branch/tag).
- Secret nên lấy từ Vault/external secrets, không hard-code.
- Predefined variables: CI_COMMIT_SHA, CI_REGISTRY_IMAGE.

### Triển khai theo môi trường
- environment: name, url; GitLab tạo deployment record và rollback UI.
- when: manual + rules để gate production cần approval.
- Canary/blue-green qua kubectl/helm trong script.

### Ví dụ .gitlab-ci.yml
~~~yaml
stages: [build, test, deploy]
variables:
  MAVEN_OPTS: "-Dmaven.repo.local=.m2/repository"
cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths: [.m2/repository]
build:
  stage: build
  image: maven:3.9-eclipse-temurin-17
  script: mvn -B package -DskipTests
  artifacts:
    paths: [target/*.jar]
    expire_in: 1 week
test:
  stage: test
  script: mvn -B test
deploy:
  stage: deploy
  environment: { name: production, url: https://app.example.com }
  when: manual
  script: kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
~~~

### Trên production
- Sai lầm: cache chứa secret hoặc artifact quá lớn; runner shared bị noisy neighbor.
- Kiểm tra: pipeline duration, cache hit rate (GitLab metrics), artifact storage.
- Bảo mật: protected variables, runner tag restrict, audit log.

> Senior tip: Dùng needs để DAG pipeline giảm thời gian; artifacts expire để tiết kiệm storage; tách build/test/deploy image để cache layer hiệu quả.`,
    follow: ['Cache key nên thiết kế thế nào cho Maven/Gradle?', 'Làm sao tránh leak secret trong log?', 'Rollback pipeline khi deploy fail?'],
    tags: ['GitLabCI', 'Pipeline', 'Secrets']
  }
  ,{
    id: 'devops-098',
    topic: 'devops',
    level: 'senior',
    q: 'Jenkinsfile declarative: agent, stages, shared library; so sánh với GitLab CI/GitHub Actions?',
    a: `**Tóm tắt:** Jenkins là CI server tự host, pipeline khai báo trong Jenkinsfile (declarative/scripted); agent chỉ định nơi chạy; shared library tái sử dụng logic; so với GitLab CI/GitHub Actions là dịch vụ tích hợp SaaS.

### Jenkinsfile declarative
- pipeline { agent any; stages { stage('Build'){ steps { sh 'mvn -B package' } } } }
- agent: any, label, docker, kubernetes; quyết định nơi job chạy.
- post: always/success/failure/unstable để cleanup/notify.
- environment, credentials(), options (timeout, retry).

### Shared library
- Repo chứa vars/ (global functions) và src/ (classes); nạp bằng @Library('lib') _.
- Version theo branch/tag; tái sử dụng across repos, tránh copy-paste.
- Unit test library bằng Jenkins Pipeline Unit.

### So sánh
| Tiêu chí | Jenkins | GitLab CI | GitHub Actions |
|---|---|---|---|
| Hosting | Tự quản (controller + agent) | SaaS/self-managed | SaaS |
| Config | Jenkinsfile | .gitlab-ci.yml | .github/workflows/*.yml |
| Plugin | Rất nhiều (plugin hell risk) | Built-in phong phú | Marketplace actions |
| Secret | Credentials store + binding | CI/CD Variables | Repository/Org Secrets |
| Scale | Controller bottleneck nếu không phân tán | Managed runners | Hosted runners + self-hosted |

### Ví dụ Jenkinsfile
~~~groovy
pipeline {
  agent { docker { image 'maven:3.9-eclipse-temurin-17' } }
  stages {
    stage('Build') { steps { sh 'mvn -B package -DskipTests' } }
    stage('Test') { steps { sh 'mvn -B test' } }
    stage('Deploy') {
      when { branch 'main' }
      steps { sh 'kubectl apply -f k8s/' }
    }
  }
  post { always { junit 'target/surefire-reports/*.xml' } }
}
~~~

### Trên production
- Sai lầm: Jenkins controller bottleneck, plugin conflict/version drift, agent offline.
- Kiểm tra: queue time, agent utilization, plugin update cadence.
- Bảo mật: least privilege credentials, RBAC, audit.

> Senior tip: Jenkins phù hợp enterprise legacy/complex on-prem; greenfield ưu tiên GitHub Actions/GitLab CI để giảm vận hành; nếu dùng Jenkins, giữ plugin tối thiểu và version lock.`,
    follow: ['Khi nào chọn self-hosted runner?', 'Cách version shared library?', 'Blue ocean vs classic UI?'],
    tags: ['Jenkins', 'CI', 'Comparison']
  }
  ,{
    id: 'devops-099',
    topic: 'devops',
    level: 'senior',
    q: 'SonarQube quality gate: coverage, code smell, chặn merge khi không đạt; cấu hình cho Maven/Gradle?',
    a: `**Tóm tắt:** SonarQube scanner phân tích code gửi report lên server; quality gate áp điều kiện trên metric (coverage, bugs, vulnerabilities, smells); fail gate chặn merge qua PR decoration + required status check.

### Cơ chế
- Scanner (Maven/Gradle/CLI) chạy trong CI, gửi report + source lên SonarQube server.
- Server tính metric và so với quality gate profile.
- PR decoration: comment kết quả + link; required check fail nếu gate fail.
- Phân biệt "Overall code" vs "New code" (leak period) để không bị legacy debt chặn.

### Maven
- mvn sonar:sonar -Dsonar.projectKey=app -Dsonar.host.url=... -Dsonar.token=...
- Coverage: jacoco agent (prepare-agent) + report; sonar.jacoco.reportPaths.
- Fail build nếu gate fail: sonar.qualitygate.wait=true.

### Gradle
- plugin org.sonarqube; gradle sonarqube.
- jacoco plugin generate report; sonar.coverage.jacoco.xmlReportPaths.

### Chặn merge
- GitLab: require pipeline success + external status check "SonarQube" trên protected branch.
- GitHub: branch protection required checks; SonarCloud PR decoration.
- Ngưỡng thường: new code coverage ≥ 80%, 0 new blocker/critical.

### Ví dụ Maven
~~~bash
mvn -B verify sonar:sonar \\
  -Dsonar.projectKey=myapp \\
  -Dsonar.host.url=https://sonar.example.com \\
  -Dsonar.token=$SONAR_TOKEN \\
  -Dsonar.qualitygate.wait=true
~~~

### Trên production
- Sai lầm: coverage threshold 0 ban đầu rồi không tăng; gate chỉ warning không block.
- Kiểm tra: gate pass rate, new code coverage trend, false positive count.
- Bảo mật: token masked, SonarQube HTTPS, RBAC.

> Senior tip: Dùng "new code" period (leak period) để tránh legacy debt chặn delivery; tăng ngưỡng coverage dần theo quý.`,
    follow: ['Làm sao xử lý false positive?', 'Coverage nên đo unit hay integration?', 'SonarLint trong IDE?'],
    tags: ['SonarQube', 'QualityGate', 'Maven', 'Gradle']
  }
  ,{
    id: 'devops-100',
    topic: 'devops',
    level: 'senior',
    q: 'Build image Java trong pipeline: multi-stage Dockerfile, layer cache, tag theo commit SHA, đẩy lên registry và quét lỗ hổng Trivy?',
    a: `**Tóm tắt:** Build image Java bằng multi-stage Dockerfile (build stage Maven/Gradle, runtime stage JRE slim) để giảm size; layer cache bằng cách copy pom trước download deps; tag theo commit SHA; push Harbor/ECR; Trivy quét CVE và fail pipeline nếu critical.

### Multi-stage Dockerfile
- Build stage: image maven/gradle, compile + package.
- Runtime stage: eclipse-temurin JRE slim hoặc distroless; COPY --from=build target/*.jar app.jar.
- Kết quả image chỉ chứa JRE + jar, không có Maven/source.

### Layer cache
- Copy pom.xml/build.gradle trước, RUN mvn dependency:go-offline, rồi copy source → tận dụng cache khi chỉ đổi code.
- BuildKit cache mounts: --mount=type=cache,target=/root/.m2 để cache Maven repo giữa build.
- Thứ tự instruction: ít thay đổi trước, thay đổi nhiều sau.

### Tag
- image:tag = commit SHA short (7-8 ký tự) + semantic version (1.2.3).
- latest chỉ dùng dev; production luôn tag cụ thể để rollback.
- Reproducible: build args (BUILD_DATE, VCS_REF) cho OCI labels.

### Registry
- Harbor/ECR/GitLab Registry; docker login với robot account/token (masked variable).
- Retention policy: giữ N version gần nhất, xóa untagged.
- Image signing: Cosign (sigstore) cho supply chain security.

### Trivy
- trivy image --severity HIGH,CRITICAL --exit-code 1 image:tag.
- Quét cả OS package và Java dependency (qua Trivy Java analyzer).
- Fail pipeline nếu CVE critical; exception list có hạn + justification.

### Ví dụ Dockerfile
~~~dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
USER 1000
ENTRYPOINT ["java","-jar","app.jar"]
~~~

### Trên production
- Sai lầm: root user, secret trong layer (ENV password), image base cũ.
- Kiểm tra: image size, scan report, không có secret (trivy secret scan).
- Base image update strategy: rebuild định kỳ theo base image digest.

> Senior tip: Dùng distroless JRE để giảm attack surface; tag theo SHA để truy vết 1:1 với commit; bật image signing + verify ở deploy.`,
    follow: ['Làm sao cache Maven trong Docker build?', 'Image signing Cosign?', 'Base image update strategy?'],
    tags: ['Docker', 'CI', 'Trivy', 'Registry']
  }
  ,{
    id: 'devops-101',
    topic: 'devops',
    level: 'senior',
    q: 'Triển khai bán tự động vs tự động hoàn toàn và rollback nhanh khi lỗi?',
    a: `**Tóm tắt:** Bán tự động (semi-auto) cần manual approval cho production; tự động hoàn toàn (full CD) deploy mỗi commit sau test; rollback nhanh qua previous image tag, Helm rollback hoặc kubectl rollout undo; migration DB phải backward-compatible.

### Bán tự động
- Auto deploy dev/staging; production cần approval (when: manual hoặc environment approval).
- Phù hợp regulated environment (finance, healthcare) cần audit/change advisory board.
- Giảm rủi ro nhưng chậm feedback.

### Tự động hoàn toàn
- CD pipeline deploy production sau test pass + gate; mỗi commit = deploy.
- Cần feature flag, monitoring, auto rollback để an toàn.
- DORA elite: deploy frequency cao, lead time thấp.

### Rollback
- Kubernetes: kubectl rollout undo deployment/app; hoặc set image về previous tag.
- Helm: helm rollback release revision.
- ArgoCD: sync về git commit trước.
- Database: expand/contract migration để rollback code không phá schema (add column nullable trước, drop sau).

### Ví dụ rollback
~~~bash
# Kubernetes
kubectl rollout undo deployment/app -n prod
kubectl rollout status deployment/app -n prod

# Helm
helm history app -n prod
helm rollback app 42 -n prod
~~~

### Trên production
- Sai lầm: không có runbook rollback, migration DB không tương thích, không test rollback.
- Kiểm tra: rollback time (MTTR), SLO, deploy success rate.
- Feature flag vs deploy rollback: flag tắt feature nhanh hơn rollback image.

> Senior tip: Expand/contract migration để rollback an toàn; luôn giữ previous image tag và test rollback trong staging; đo thời gian rollback < 5 phút.`,
    follow: ['Database migration rollback strategy?', 'Feature flag vs deploy rollback?', 'Canary vs blue-green?'],
    tags: ['CD', 'Rollback', 'Deployment']
  }
  ,{
    id: 'devops-102',
    topic: 'devops',
    level: 'lead',
    q: 'Release management: release branch, hotfix, versioning SemVer và coordination nhiều service?',
    a: `**Tóm tắt:** SemVer cho library/API (MAJOR.MINOR.PATCH); release branch stabilize trước release; hotfix từ main; coordination nhiều service qua versioned API, contract test và changelog tự động.

### SemVer
- MAJOR: breaking change (API incompatible).
- MINOR: feature mới backward-compatible.
- PATCH: bug fix.
- Pre-release (1.2.3-rc.1) và build metadata.

### Release branch
- release/1.2.0 từ develop/main khi feature freeze.
- Chỉ bug fix cherry-pick vào release branch; merge back vào main.
- Tag v1.2.0 khi release.

### Hotfix
- hotfix/* từ main (production), fix minimal, merge vào main và develop.
- Patch version bump (1.2.1).
- Trigger pipeline release tự động.

### Multi-service coordination
- Independent deploy với versioned API (URL /v1, /v2) để không lock-step.
- Contract testing (Pact) giữa consumer/provider để phát hiện breaking change trước deploy.
- Changelog tự động từ conventional commits (semantic-release).
- API deprecation policy: announce, sunset date, monitoring usage.

### Ví dụ conventional commit + release
~~~bash
# commit
feat(order): add cancel endpoint
fix(payment): handle timeout retry

# semantic-release tự bump minor/major và publish
npx semantic-release
~~~

### Trên production
- Sai lầm: release branch sống lâu gây drift; hotfix không merge back.
- Kiểm tra: release frequency, hotfix count, lead time.
- Trunk-based + feature flag giảm nhu cầu release branch.

> Senior tip: Trunk-based development + feature flag cho phần lớn team; giữ release branch chỉ cho regulated product; contract test bắt buộc cho multi-service.`,
    follow: ['Làm sao communicate breaking change?', 'Deprecation policy?', 'Release notes automation?'],
    tags: ['Release', 'SemVer', 'Hotfix', 'Leadership']
  }
  ,{
    id: 'devops-103',
    topic: 'devops',
    level: 'lead',
    q: 'Bảo mật pipeline: secret scanning, dependency scanning, SAST/DAST và policy as code?',
    a: `**Tóm tắt:** Pipeline bảo mật gồm secret scanning (gitleaks), dependency scanning (OWASP/Snyk + SBOM), SAST (SonarQube/Semgrep), DAST (OWASP ZAP); policy as code (OPA/Conftest) enforce rule; runner least privilege; scan phải block, không chỉ report.

### Secret scanning
- gitleaks/trufflehog quét commit và working tree tìm API key, token, password.
- Pre-commit hook chặn commit secret trước khi push.
- Nếu leak: revoke key, rotate, scrub history (git filter-repo) + notify.

### Dependency scanning
- OWASP Dependency-Check, Snyk, Trivy fs; so CVE với NVD.
- SBOM (CycloneDX/SPDX) lưu artifact để audit.
- Fail nếu CVE critical/high chưa được accept (exception có expiry).

### SAST/DAST
- SAST: SonarQube, Semgrep phân tích source tìm SQL injection, XSS, insecure deserialization.
- DAST: OWASP ZAP scan running app (staging) tìm runtime vulnerability.
- IAST: agent trong app kết hợp SAST+DAST.

### Policy as code
- OPA/Conftest kiểm tra Dockerfile/K8s manifest: no root user, image signed, resource limits.
- Enforce ở CI gate; policy version-controlled.
- Admission controller (Kyverno/Gatekeeper) enforce runtime.

### Ví dụ pipeline security
~~~yaml
security:
  stage: test
  script:
    - gitleaks detect --source . --exit-code 1
    - trivy fs --severity HIGH,CRITICAL --exit-code 1 .
    - semgrep ci --config auto
  allow_failure: false
~~~

### Trên production
- Sai lầm: scan chỉ report không block; alert fatigue; exception vĩnh viễn.
- Kiểm tra: findings trend, MTTR, % pipeline block.
- Shift-left: scan sớm trong PR, không chỉ pipeline main.

> Senior tip: Secret scanning + dependency scanning là baseline bắt buộc; policy as code turning security into automated gate; review exception list định kỳ.`,
    follow: ['SBOM nên lưu ở đâu?', 'Image signing verification runtime?', 'Compliance audit?'],
    tags: ['Security', 'Pipeline', 'SAST', 'Policy']
  }

,
  {
    id: 'devops-104',
    topic: 'devops',
    level: 'mid',
    q: 'Prometheus + node_exporter + Micrometer (Spring Boot Actuator) + Grafana giám sát app Java như thế nào?',
    a: `**Tóm tắt:** Prometheus **kéo (scrape)** metric theo chu kỳ từ các endpoint: **node_exporter** cho máy (CPU, RAM, disk, network) và **Spring Boot Actuator + Micrometer** cho ứng dụng ({{/actuator/prometheus}}: JVM, HTTP, Hikari, metric nghiệp vụ). Grafana truy vấn Prometheus bằng PromQL để vẽ dashboard và cảnh báo. Ba điều quyết định chất lượng: **histogram để có p95/p99**, **tag chuẩn** (application, env), và **kiểm soát cardinality**.

### Luồng dữ liệu
~~~seq
title: Metric từ app Java tới dashboard
actors: Prometheus | App | NodeExp | Grafana
Prometheus -> App: GET /actuator/prometheus (mỗi 15s)
App --> Prometheus: jvm_*, http_server_requests_*, hikaricp_*
Prometheus -> NodeExp: GET :9100/metrics
NodeExp --> Prometheus: node_cpu_*, node_memory_*
Grafana -> Prometheus: PromQL query
Prometheus --> Grafana: chuỗi thời gian
~~~
Mô hình **pull**: Prometheus biết target nào sống hay chết ({{up == 0}}); trên Kubernetes target được phát hiện tự động qua service discovery hoặc ServiceMonitor (Prometheus Operator).

### Cấu hình Spring Boot 3
~~~yaml
# cần dependency io.micrometer:micrometer-registry-prometheus
management:
  endpoints.web.exposure.include: health,info,prometheus
  metrics:
    tags:
      application: order-service      # tag chung cho mọi metric
    distribution:
      percentiles-histogram:
        http.server.requests: true    # xuất bucket để tính p95/p99 ở Prometheus
~~~
Không bật histogram thì chỉ có count/sum/max — tính được trung bình nhưng **không** tính được p99 gộp nhiều pod.

### Metric nghiệp vụ tự định nghĩa
~~~java
@Component
class OrderMetrics {
  private final Counter placed;
  OrderMetrics(MeterRegistry r) {
    // tag có tập giá trị nhỏ, cố định: channel = web|app|pos
    placed = Counter.builder("orders.placed").tag("channel", "web").register(r);
  }
  void onPlaced() { placed.increment(); }   // xuất ra: orders_placed_total
}
~~~

### PromQL cần biết
~~~text
p99 theo service:
histogram_quantile(0.99, sum by (le, application) (rate(http_server_requests_seconds_bucket[5m])))
Heap đang dùng / tối đa:
sum(jvm_memory_used_bytes{area="heap"}) / sum(jvm_memory_max_bytes{area="heap"})
Pool sắp cạn:
hikaricp_connections_pending > 0
~~~

### Dashboard tối thiểu cho mỗi service
| Nhóm | Metric |
|---|---|
| Traffic & lỗi | rps, tỉ lệ 5xx, p50/p95/p99 theo URI |
| JVM | heap sau GC, {{jvm_gc_pause_seconds}}, số thread |
| Pool | Hikari active/idle/pending, thời gian lấy connection |
| Máy/Pod | CPU, CPU throttling, memory so với limit |

### Ví dụ đời thực
Một team có Prometheus nhưng chỉ xem CPU/RAM. Sự cố p99 tăng gấp 4 lần kéo dài 2 giờ vì không ai thấy nguyên nhân. Sau đó họ bật histogram cho {{http.server.requests}}, thêm panel Hikari pending và GC pause. Lần tương tự tiếp theo, panel Hikari pending > 0 chỉ ra pool cạn ngay trong 5 phút đầu. Một lần khác, Prometheus tốn 14GB RAM vì ai đó thêm tag {{userId}} vào metric: 2 triệu chuỗi thời gian mới; xoá tag đó, bộ nhớ về 3GB.

### Pitfall
- Tag có giá trị không giới hạn (userId, orderId, URL có id) → **bùng nổ cardinality**. Micrometer dùng URI template (dạng /orders/{id}) nên an toàn, trừ khi bạn tự build tag từ path thật.
- Lộ {{/actuator}} ra Internet — chỉ mở trên cổng quản trị nội bộ.
- Lấy trung bình của p99 giữa các pod — sai về toán học; phải tính từ histogram.
- Scrape interval quá ngắn với hàng nghìn target → Prometheus quá tải.

### Trả lời mẫu khi phỏng vấn
"Prometheus kéo metric theo chu kỳ từ các endpoint. node_exporter cung cấp metric máy, còn ứng dụng Spring Boot 3 thêm micrometer-registry-prometheus và mở endpoint actuator/prometheus, xuất sẵn metric JVM, HTTP, Hikari. Grafana truy vấn bằng PromQL để vẽ dashboard và cảnh báo. Có ba điều tôi luôn làm. Một là bật percentiles-histogram cho http.server.requests, vì không có bucket thì không tính được p99 gộp nhiều pod. Hai là tag chuẩn như application và env để lọc. Ba là kiểm soát cardinality: không bao giờ đưa userId hay orderId vào tag. Dashboard tối thiểu của tôi có rps, tỉ lệ lỗi, p99 theo URI, heap sau GC, GC pause, Hikari pending và CPU throttling. Tôi từng gặp Prometheus ăn 14GB RAM chỉ vì một tag userId tạo ra hai triệu chuỗi thời gian."

> Senior tip: thêm một panel "Hikari pending" và một panel "CPU throttling" vào mọi dashboard service ngay từ đầu. Hai panel này giải thích nhiều sự cố latency hơn mọi biểu đồ CPU/RAM cộng lại.`,
    follow: ['Pull vs push metric?', 'Cardinality là gì?', 'Prometheus retention bao lâu?'],
    tags: ['Prometheus', 'Grafana', 'Micrometer', 'Observability']
  }
,
  {
    id: 'devops-105',
    topic: 'devops',
    level: 'mid',
    q: 'Alertmanager gửi Telegram/Slack, tránh alert fatigue, SLO-based alert như thế nào?',
    a: `**Tóm tắt:** Alertmanager nhận alert từ Prometheus, **gộp** (group), **khử trùng** (dedupe), **dập** (inhibit) và **định tuyến** (route) tới Slack/Telegram/PagerDuty. Chống alert fatigue bằng nguyên tắc: **chỉ gọi người khi người dùng đang hoặc sắp bị ảnh hưởng và cần hành động ngay**; mọi thứ khác thành ticket hoặc dashboard. Alert dựa trên SLO (tỉ lệ lỗi, độ trễ người dùng cảm nhận) thay cho ngưỡng nguyên nhân như "CPU > 80%".

### Alertmanager làm gì với một alert
1. **Group**: 30 pod cùng lỗi → một tin nhắn "OrderService: 30 instance", gom theo {{group_by: [alertname, service]}}.
2. **Chờ và nhắc lại**: {{group_wait}} (chờ gom), {{group_interval}} (gửi cập nhật), {{repeat_interval}} (nhắc lại nếu chưa xử lý).
3. **Inhibit**: khi alert "cluster mất kết nối DB" đang bật, dập các alert "API lỗi" phát sinh từ nó.
4. **Silence**: tắt có thời hạn khi bảo trì, kèm người tạo và lý do.
5. **Route** theo nhãn: {{severity=page}} → PagerDuty/điện thoại; {{severity=ticket}} → kênh Slack của team.

~~~yaml
route:
  receiver: slack-team
  group_by: [alertname, service]
  group_wait: 30s
  repeat_interval: 4h
  routes:
    - matchers: [ severity="page" ]
      receiver: pagerduty-oncall
inhibit_rules:
  - source_matchers: [ alertname="DatabaseDown" ]
    target_matchers: [ severity="page" ]
    equal: [ cluster ]
~~~

### Vì sao alert fatigue nguy hiểm
Khi 90% alert là nhiễu, người trực học cách bỏ qua — và bỏ qua luôn alert thật. Các nguồn nhiễu hay gặp: ngưỡng tĩnh theo nguyên nhân (CPU 80% nhưng người dùng không sao), không có {{for:}} nên alert nhấp nháy, alert không ai sở hữu, alert không có hướng dẫn xử lý.

### Quy tắc viết một alert tốt
- **Triệu chứng hơn nguyên nhân**: "tỉ lệ lỗi checkout > 2%" thay vì "CPU cao". Nguyên nhân để trên dashboard.
- Có {{for: 5m}} hoặc dài hơn để bỏ dao động ngắn.
- Mỗi alert có **runbook link**, chủ sở hữu, mức độ.
- Alert phải **hành động được**: nếu câu trả lời là "chờ xem" thì đó không phải alert gọi người.
- Ngưỡng từ SLO; với SLO thì dùng **burn rate** (tốc độ tiêu error budget) thay ngưỡng cố định (xem devops-110).

### Telegram/Slack trong thực tế
- Slack: receiver {{slack_configs}} với webhook; Telegram: receiver {{telegram_configs}} (có sẵn từ Alertmanager 0.24) với bot token và chat id.
- Kênh "page" và kênh "ticket" tách riêng; kênh page chỉ dành cho việc cần làm ngay.

### Ví dụ đời thực
Team on-call nhận trung bình 140 alert mỗi tuần, chỉ 9 cái cần hành động; một sự cố thật bị trễ 40 phút vì chìm giữa nhiễu. Rà lại: xoá 31 rule CPU/RAM/disk ngưỡng tĩnh (chuyển thành dashboard), thêm {{for}} cho mọi rule, gom theo service, inhibit theo cluster, thay bằng 6 alert SLO cho 3 hành trình chính (đăng nhập, tìm kiếm, thanh toán). Kết quả: còn khoảng 12 alert/tuần, 10 cái cần hành động; thời gian phản hồi trung bình giảm từ 25 phút xuống 6 phút.

### Pitfall
- Gửi mọi alert vào một kênh chung → không ai đọc.
- Silence không thời hạn rồi quên → mất cảnh báo thật nhiều tuần.
- Alert dựa trên metric có thể biến mất (pod chết thì không còn metric) mà không có alert {{absent()}} hoặc {{up == 0}}.
- Không review alert định kỳ.

### Trả lời mẫu khi phỏng vấn
"Alertmanager nhận alert từ Prometheus rồi gộp, khử trùng, dập và định tuyến. Gộp theo service để ba mươi pod lỗi thành một tin nhắn; inhibit để khi DB chết thì không bắn thêm hàng chục alert API; silence có thời hạn khi bảo trì; route theo mức độ: page thì gọi người trực, ticket thì vào kênh Slack của team. Để chống alert fatigue, tôi theo nguyên tắc chỉ gọi người khi người dùng đang hoặc sắp bị ảnh hưởng và cần hành động ngay. Vì vậy tôi alert theo triệu chứng như tỉ lệ lỗi hay độ trễ của hành trình chính, dựa trên SLO và burn rate, còn CPU hay RAM để trên dashboard. Mỗi alert có for để bỏ dao động, có runbook và chủ sở hữu. Ở team trước, rà lại theo cách này giảm từ khoảng 140 xuống 12 alert mỗi tuần, và thời gian phản hồi giảm từ 25 xuống 6 phút."

> Senior tip: mỗi tháng xuất danh sách alert đã bắn kèm cột "có hành động gì không". Alert nào ba tháng liền không dẫn tới hành động thì xoá hoặc hạ xuống ticket — đây là cách rẻ nhất giữ cho on-call còn đáng tin.`,
    follow: ['PagerDuty escalation?', 'Silence vs inhibit?', 'Burn rate là gì?'],
    tags: ['Alertmanager', 'SLO', 'Alerting']
  }
,
  {
    id: 'devops-106',
    topic: 'devops',
    level: 'senior',
    q: 'Logging tập trung: ELK/EFK vs Loki, log JSON, correlation id, retention và chi phí?',
    a: `**Tóm tắt:** Logging tập trung cần ba thứ: **log có cấu trúc (JSON)** để truy vấn theo trường, **correlation/trace id** để nối mọi dòng log của một request qua nhiều service, và **chiến lược lưu trữ theo giá trị** (log nóng ngắn hạn, log lạnh rẻ, log debug ít). **ELK/EFK** đánh index toàn văn — tìm kiếm mạnh nhưng tốn tài nguyên; **Loki** chỉ đánh index nhãn và lưu nội dung nén trên object storage — rẻ hơn nhiều nhưng truy vấn văn bản chậm hơn.

### Log JSON trong Spring Boot 3
Từ Spring Boot 3.4 có structured logging sẵn:
~~~yaml
logging:
  structured:
    format:
      console: ecs        # hoặc logstash, gelf; in mỗi dòng là một JSON
~~~
Phiên bản cũ hơn dùng logstash-logback-encoder. Kết quả là các trường {{level}}, {{logger}}, {{message}}, {{traceId}}, {{spanId}}, {{service}} truy vấn được trực tiếp, không cần regex.

### Correlation id / trace id
- Với Micrometer Tracing (Spring Boot 3), {{traceId}} và {{spanId}} tự đưa vào MDC và tự truyền qua header W3C {{traceparent}} khi gọi bằng RestClient/WebClient/Kafka đã được instrument.
- {{traceId}}: id của cả hành trình request qua mọi service; {{spanId}}: id của một đoạn công việc trong hành trình đó.
- Trả {{traceId}} trong header response hoặc thông báo lỗi để bộ phận hỗ trợ đưa lại cho dev.
- Cẩn thận với thread pool/{{@Async}}: context không tự đi theo nếu executor không được bọc (context propagation).

### ELK/EFK hay Loki
| Tiêu chí | ELK / EFK (Elasticsearch) | Loki |
|---|---|---|
| Index | Toàn văn mọi trường | Chỉ nhãn (service, env, level) |
| Truy vấn | Tìm kiếm tự do rất nhanh, aggregation mạnh | Lọc theo nhãn rồi quét nội dung |
| Chi phí | Cao: RAM, SSD, bản sao | Thấp: nén, lưu S3/GCS |
| Vận hành | Phức tạp (shard, mapping, heap) | Đơn giản hơn |
| Hợp với | Cần phân tích log sâu, bảo mật/SIEM | Debug theo service, đi cùng Grafana |
EFK = thay Logstash bằng Fluentd/Fluent Bit (nhẹ hơn, phổ biến trên Kubernetes).

### Retention và chi phí
- Phân tầng: 7–14 ngày nóng (truy vấn nhanh), 30–90 ngày ấm/lạnh, lưu dài hạn trên S3 nếu có yêu cầu pháp lý.
- Giảm khối lượng tại nguồn: tắt DEBUG ở production, gộp log lặp, **sampling** log thành công (giữ 100% lỗi, 5–10% request thành công).
- Index Lifecycle Management (Elasticsearch) hoặc retention theo tenant/stream (Loki).
- Không log body request và dữ liệu cá nhân — vừa tốn tiền vừa rủi ro pháp lý.

### Ví dụ đời thực
Một công ty 40 microservice ghi 1,2TB log mỗi ngày vào Elasticsearch: cụm 18 node, khoảng 22.000 USD/tháng; 60% khối lượng là log INFO "request thành công" và log body. Họ chuyển log ứng dụng sang Loki + S3, giữ Elasticsearch nhỏ cho log bảo mật/audit, bỏ log body, sampling 10% log thành công. Khối lượng còn 380GB/ngày, chi phí logging giảm khoảng 70%. Nhờ {{traceId}} trong mọi dòng log, thời gian tìm nguyên nhân một lỗi xuyên 5 service giảm từ khoảng 40 phút xuống 5 phút.

### Pitfall
- Log text tự do → phải viết regex parse, dễ vỡ khi đổi format.
- Đưa giá trị nhiều biến thể (userId, traceId) làm **nhãn** trong Loki → bùng nổ stream, Loki chậm và tốn.
- Mapping động trong Elasticsearch: một trường lúc là số lúc là chuỗi → log bị loại bỏ.
- Mất traceId khi chuyển sang thread khác hoặc qua Kafka chưa instrument.

### Trả lời mẫu khi phỏng vấn
"Logging tập trung với tôi có ba trụ cột. Thứ nhất là log JSON có cấu trúc, Spring Boot 3.4 đã có structured logging sẵn, để truy vấn theo trường chứ không phải regex. Thứ hai là trace id: Micrometer Tracing đưa traceId và spanId vào MDC và truyền qua header traceparent, nên một request qua năm service vẫn nối được, tôi còn trả traceId trong response lỗi để support gửi lại. Thứ ba là chi phí: phân tầng retention, tắt DEBUG, sampling log thành công, và không log body. Về công cụ, Elasticsearch đánh index toàn văn nên tìm kiếm và phân tích mạnh nhưng tốn RAM và SSD; Loki chỉ index nhãn và lưu nội dung nén trên object storage nên rẻ hơn nhiều, hợp với debug theo service cùng Grafana. Ở công ty trước, chuyển log ứng dụng sang Loki, bỏ log body và sampling giúp giảm khoảng 70% chi phí logging."

> Senior tip: tính chi phí log theo **service** mỗi tháng và gửi cho từng team. Khi team thấy service của họ chiếm 35% hoá đơn logging vì log body, họ tự sửa nhanh hơn mọi quy định chung.`,
    follow: ['TraceId vs SpanId?', 'Log sampling?', 'Chi phí Elasticsearch?'],
    tags: ['Logging', 'ELK', 'Loki', 'Observability']
  }
,
  {
    id: 'devops-107',
    topic: 'devops',
    level: 'senior',
    q: 'High availability: Keepalived + VIP (VRRP), HAProxy/Nginx active-passive, DB replication + failover, split-brain?',
    a: `**Tóm tắt:** HA kiểu truyền thống trên máy ảo/bare-metal gồm hai lớp: **lớp vào** dùng Keepalived (giao thức VRRP) giữ một **VIP** (IP ảo) trên một trong hai máy HAProxy/Nginx, máy kia dự phòng; **lớp dữ liệu** dùng replication và một bộ điều phối failover (Patroni cho PostgreSQL, Orchestrator/MySQL InnoDB Cluster cho MySQL). Rủi ro lớn nhất là **split-brain** — hai bên cùng nghĩ mình là chính — nên mọi quyết định failover phải dựa trên **quorum** và **fencing**.

### Keepalived + VIP hoạt động thế nào
- Hai máy chạy Keepalived, mỗi máy có priority (ví dụ 150 và 100). Máy MASTER gửi quảng bá VRRP mỗi giây; VIP gắn vào card mạng của nó.
- Script kiểm tra ({{vrrp_script}}, ví dụ {{pidof haproxy}} hoặc gọi health endpoint) trừ priority khi HAProxy chết.
- Máy BACKUP không nghe thấy quảng bá trong khoảng 3 lần chu kỳ → tự nhận VIP và gửi gratuitous ARP để switch cập nhật. Thời gian chuyển thường 1–3 giây.
~~~text
vrrp_instance VI_1 {
  state BACKUP            # cả hai để BACKUP + nopreempt để tránh giật qua lại
  interface eth0
  virtual_router_id 51
  priority 150
  nopreempt
  virtual_ipaddress { 10.0.0.100/24 }
  track_script { chk_haproxy }
}
~~~
Trên cloud thường không dùng VRRP (mạng không cho gratuitous ARP tuỳ ý) mà dùng load balancer có sẵn (AWS NLB/ALB) hoặc chuyển Elastic IP bằng API.

### HAProxy/Nginx active-passive
Chỉ máy giữ VIP nhận traffic; cấu hình hai máy phải giống hệt (đồng bộ bằng Ansible/Git). HAProxy kiểm tra sức khoẻ backend ({{option httpchk}}) và loại server lỗi. Active-active (hai VIP + DNS) tăng công suất nhưng phức tạp hơn.

### DB replication + failover
- PostgreSQL streaming replication: primary gửi WAL cho standby. **Async**: nhanh nhưng có thể mất vài giây dữ liệu khi failover; **sync** ({{synchronous_standby_names}}): không mất dữ liệu đã commit, đổi lại độ trễ ghi.
- **Patroni**: mỗi node chạy agent, dùng DCS (etcd/Consul) giữ **leader lock** có TTL. Chỉ node giữ lock được làm primary; primary mất lock thì tự hạ xuống. Ứng dụng kết nối qua HAProxy hỏi REST API của Patroni ({{/primary}}) để biết node nào là primary.

### Split-brain và cách chặn
Mạng giữa hai máy đứt nhưng cả hai vẫn sống → cả hai nhận VIP hoặc cả hai nhận ghi → dữ liệu phân kỳ, rất khó hợp nhất.
- **Quorum**: quyết định cần đa số (3 hoặc 5 node etcd); phía thiểu số không được làm primary.
- **Fencing/STONITH**: chắc chắn node cũ đã chết hoặc bị cô lập (tắt nguồn qua IPMI, gỡ quyền ghi storage) trước khi node mới nhận vai.
- Watchdog: Patroni có thể dùng watchdog phần cứng/softdog để tự khởi động lại node mất lock.

### Ví dụ đời thực
Một ngân hàng chạy PostgreSQL hai node với script failover tự viết dựa trên ping. Một lần switch lỗi khiến hai node không thấy nhau 40 giây: script nâng standby lên primary trong khi primary cũ vẫn nhận ghi từ một nhóm ứng dụng → 1.700 giao dịch nằm lệch trên hai node, mất 2 ngày đối soát thủ công. Thiết kế lại: 3 node PostgreSQL + Patroni + 3 node etcd ở ba vùng, một standby đồng bộ, HAProxy định tuyến theo {{/primary}}. Diễn tập hàng quý: failover trung bình 12 giây, không mất giao dịch đã commit, không còn split-brain.

### Pitfall
- Hai node + "ping" để quyết định failover — không có quorum thì không phân biệt được "bên kia chết" với "mạng đứt".
- Bật preempt để máy chính giật lại VIP ngay khi sống lại → chuyển qua lại liên tục.
- Không bao giờ diễn tập failover → ngày thật mới phát hiện cấu hình sai.
- Ứng dụng cache địa chỉ DB/DNS lâu → failover xong vẫn ghi vào node cũ.

### Trả lời mẫu khi phỏng vấn
"Tôi chia làm hai lớp. Lớp vào dùng Keepalived với VRRP giữ một IP ảo trên một trong hai máy HAProxy; máy chính chết hoặc HAProxy chết thì script kiểm tra hạ priority, máy dự phòng nhận VIP và gửi gratuitous ARP, thường mất một đến ba giây. Lớp dữ liệu dùng replication, với PostgreSQL thì streaming replication và Patroni điều phối: các node tranh một leader lock trong etcd, chỉ node giữ lock mới được làm primary, và HAProxy hỏi Patroni để biết đâu là primary. Điều tôi chú trọng nhất là split-brain. Hai node quyết định bằng ping là không an toàn, vì không phân biệt được bên kia chết hay mạng đứt. Phải có quorum, ít nhất ba node etcd, và fencing để chắc chắn node cũ không còn nhận ghi. Tôi cũng chọn rõ async hay sync replication theo yêu cầu mất dữ liệu, và diễn tập failover định kỳ."

> Senior tip: đo và ghi lại hai con số sau mỗi lần diễn tập: thời gian failover thực tế và lượng dữ liệu mất (RPO thực tế). Cam kết RTO/RPO trên giấy mà chưa từng đo thì chỉ là hy vọng.`,
    follow: ['Patroni là gì?', 'Quorum majority?', 'STONITH?'],
    tags: ['HA', 'Keepalived', 'VRRP', 'PostgreSQL']
  }
,
  {
    id: 'devops-108',
    topic: 'devops',
    level: 'senior',
    q: 'Giám sát database (PostgreSQL/MySQL exporter): slow query, connection, replication lag?',
    a: `**Tóm tắt:** Giám sát DB cần trả lời bốn câu: **DB có đang quá tải không** (connection, CPU, IO), **query nào tốn nhất** (pg_stat_statements / performance_schema), **có ai đang chặn ai không** (lock, transaction dài), và **replica có theo kịp không** (replication lag). Dùng **postgres_exporter** hoặc **mysqld_exporter** cho Prometheus, cộng slow query log và một dashboard có cảnh báo cho từng nhóm.

### Exporter và dữ liệu nguồn
- **postgres_exporter** đọc các view hệ thống: {{pg_stat_database}} (commit, rollback, deadlock, temp file), {{pg_stat_activity}} (connection theo trạng thái), {{pg_stat_replication}}, {{pg_locks}}; có thể thêm truy vấn tuỳ biến.
- **mysqld_exporter** đọc {{SHOW GLOBAL STATUS}}, {{performance_schema}}, trạng thái replication.
- Tài khoản exporter chỉ cần quyền đọc thống kê (PostgreSQL: role {{pg_monitor}}).

### Slow query
- PostgreSQL: bật extension {{pg_stat_statements}} để có thống kê tổng hợp theo dạng câu lệnh (số lần gọi, tổng/trung bình thời gian, số dòng, block đọc). Sắp theo **tổng thời gian**, không theo thời gian một lần: câu 5ms gọi 2 triệu lần mỗi giờ tốn hơn câu 3 giây gọi 10 lần.
- {{log_min_duration_statement = 500}} ghi câu chạy lâu hơn 500ms; {{auto_explain}} ghi luôn plan của câu chậm.
- MySQL: {{slow_query_log}} + {{long_query_time}}, phân tích bằng pt-query-digest.
~~~sql
SELECT left(query, 80) AS q, calls, round(total_exec_time) AS total_ms,
       round(mean_exec_time, 1) AS mean_ms, rows
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
~~~

### Connection
- Theo dõi số connection theo trạng thái: {{active}}, {{idle}}, **{{idle in transaction}}** (giữ khoá và chặn vacuum — rất nguy hiểm).
- So với {{max_connections}}: mỗi connection PostgreSQL là một process, vài trăm connection đã tốn đáng kể RAM. Tổng pool của mọi pod phải nhỏ hơn giới hạn; nhiều pod thì dùng PgBouncer.
- Đặt {{idle_in_transaction_session_timeout}} để tự cắt session bỏ quên.

### Replication lag
- PostgreSQL: trên primary xem {{pg_stat_replication}} ({{replay_lag}}, chênh lệch LSN); trên replica {{now() - pg_last_xact_replay_timestamp()}} (lưu ý khi primary không có ghi thì con số này tăng dù không thật sự trễ).
- Nguyên nhân lag: batch ghi lớn, replica thiếu IO, query dài trên replica xung đột với replay.
- Ứng dụng đọc từ replica phải chịu được dữ liệu cũ vài giây, hoặc đọc primary ngay sau khi ghi (read-your-writes).

### Cảnh báo nên có
| Cảnh báo | Ngưỡng gợi ý |
|---|---|
| Connection gần đầy | > 80% max_connections trong 5 phút |
| Transaction dài | > 5 phút (chặn vacuum, giữ khoá) |
| Replication lag | > 30 giây trong 5 phút |
| Deadlock | tăng bất thường so với mức nền |
| Disk/WAL | dung lượng còn < 20% |

### Ví dụ đời thực
DB PostgreSQL của một sàn thương mại điện tử: CPU 90% mỗi trưa, team định nâng cấp instance (thêm 1.800 USD/tháng). pg_stat_statements cho thấy một câu đếm giỏ hàng chỉ 4ms nhưng gọi 6 triệu lần/giờ, chiếm 38% tổng thời gian DB. Cache kết quả 30 giây ở Redis → CPU trưa còn 45%, không cần nâng cấp. Cùng đợt đó, cảnh báo "idle in transaction > 5 phút" bắt được một job báo cáo quên commit, vốn làm bảng đơn hàng phình 40% vì vacuum không dọn được.

### Pitfall
- Chỉ bật slow query log → bỏ sót câu nhanh nhưng gọi cực nhiều.
- Không reset/so sánh pg_stat_statements theo thời gian → không biết query nào mới xấu đi.
- Exporter dùng tài khoản superuser.
- Đọc từ replica mà không giám sát lag → người dùng thấy dữ liệu cũ, tưởng mất dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Tôi giám sát DB theo bốn câu hỏi. DB có quá tải không: connection theo trạng thái, CPU, IO. Query nào tốn nhất: tôi dùng pg_stat_statements và sắp theo tổng thời gian chứ không theo thời gian một lần, vì câu 4 mili giây gọi hàng triệu lần thường tốn hơn câu 3 giây hiếm khi chạy; kèm slow query log và auto_explain cho câu chậm. Có ai chặn ai không: lock và transaction dài, đặc biệt trạng thái idle in transaction vì nó giữ khoá và chặn vacuum. Replica có theo kịp không: replay lag từ pg_stat_replication. Dữ liệu đưa vào Prometheus qua postgres_exporter với role pg_monitor, dashboard có cảnh báo cho connection trên 80%, transaction dài trên 5 phút, lag trên 30 giây. Có lần nhờ pg_stat_statements mà team bỏ được kế hoạch nâng cấp DB 1.800 USD mỗi tháng, chỉ bằng cách cache một câu đếm gọi 6 triệu lần mỗi giờ."

> Senior tip: chụp top 20 của pg_stat_statements mỗi tuần và lưu lại. So sánh tuần này với tuần trước là cách nhanh nhất phát hiện một release vừa làm xấu đi một query, trước khi nó thành sự cố.`,
    follow: ['pg_stat_statements?', 'Connection pool tuning?', 'Vacuum là gì?'],
    tags: ['Database', 'PostgreSQL', 'MySQL', 'Monitoring']
  }
,
  {
    id: 'devops-109',
    topic: 'devops',
    level: 'lead',
    q: 'Uptime/synthetic check và trang status nội bộ xây dựng thế nào?',
    a: `**Tóm tắt:** Synthetic check là **robot đóng vai người dùng**, gọi các hành trình quan trọng từ bên ngoài theo chu kỳ (đăng nhập, tìm kiếm, thanh toán thử) để phát hiện sự cố **trước khi người dùng báo**, kể cả lúc đêm không có traffic. Trang status nội bộ tổng hợp tình trạng từng dịch vụ và sự cố đang xử lý, giúp các team và bộ phận hỗ trợ không phải hỏi nhau "có phải hệ thống đang lỗi không?".

### Vì sao cần synthetic khi đã có metric
- Metric phía server chỉ thấy request **đã tới**. DNS sai, chứng chỉ TLS hết hạn, CDN lỗi, firewall chặn → server không thấy gì, metric vẫn xanh.
- Ban đêm traffic thấp: tỉ lệ lỗi trên 3 request không có ý nghĩa; robot cho tín hiệu đều đặn.
- Đo từ góc người dùng: nhiều vùng địa lý, nhiều nhà mạng.

### Các mức synthetic check
| Mức | Kiểm tra | Công cụ |
|---|---|---|
| Ping/HTTP | Endpoint trả 200, thời gian, hạn chứng chỉ | Prometheus blackbox_exporter, Uptime Kuma |
| API hành trình | Chuỗi gọi: đăng nhập → lấy token → tìm sản phẩm → tạo giỏ | k6/script chạy định kỳ, Checkly |
| Trình duyệt | Kịch bản UI thật bằng Playwright | Checkly, Datadog Synthetics, CloudWatch Synthetics |

~~~yaml
# blackbox_exporter module: kiểm tra HTTP và nội dung trả về
modules:
  http_api:
    prober: http
    timeout: 5s
    http:
      valid_status_codes: [200]
      fail_if_body_not_matches_regexp: ['"status":"UP"']
# Cảnh báo chứng chỉ sắp hết hạn: probe_ssl_earliest_cert_expiry - time() < 14 * 86400
~~~

### Nguyên tắc thiết kế
- Dùng **tài khoản test riêng**, dữ liệu được đánh dấu và tự dọn; thanh toán thử dùng sandbox hoặc số tiền hoàn ngay.
- Chạy từ ít nhất 2–3 vị trí; chỉ cảnh báo khi **nhiều vị trí** cùng lỗi để tránh nhiễu do mạng một nơi.
- Kiểm tra **nội dung**, không chỉ mã 200 (trang lỗi vẫn có thể trả 200).
- Liveness/readiness của Kubernetes là kiểm tra **bên trong**; synthetic là kiểm tra **bên ngoài** — cần cả hai.

### Trang status nội bộ
- Danh sách dịch vụ theo hành trình nghiệp vụ (Đăng nhập, Thanh toán, Báo cáo…), trạng thái xanh/vàng/đỏ lấy tự động từ synthetic và SLO.
- Sự cố đang mở: ảnh hưởng gì, ai đang xử lý, cập nhật gần nhất, kênh liên lạc.
- Lịch bảo trì sắp tới; lịch sử sự cố và uptime 90 ngày.
- Công cụ: Statuspage, Upptime, Uptime Kuma, hoặc trang tự dựng đọc từ Prometheus. Trang status công khai cho khách hàng thì chỉ cập nhật bởi người (tránh hiển thị nhiễu).

### Ví dụ đời thực
Một nền tảng B2B bị khách báo "không đăng nhập được" lúc 7 giờ sáng — chứng chỉ TLS của domain SSO hết hạn lúc 0 giờ, metric server vẫn xanh vì không request nào tới được. Sau sự cố: 14 synthetic check (8 API hành trình, 6 trang UI bằng Playwright) chạy mỗi phút từ 3 vùng, cảnh báo chứng chỉ trước 14 ngày, trang status nội bộ cho đội CSKH. Trong 6 tháng tiếp theo, 5/7 sự cố được phát hiện bởi synthetic trước khi có khách báo, thời gian phát hiện trung bình từ 38 phút xuống 3 phút; số câu hỏi "hệ thống có lỗi không" vào kênh kỹ thuật giảm rõ rệt.

### Pitfall
- Robot dùng tài khoản thật hoặc tạo đơn thật không dọn → sai số liệu kinh doanh.
- Kịch bản UI giòn (selector thay đổi) → báo động giả liên tục.
- Chỉ kiểm tra trang chủ.
- Trang status cập nhật thủ công và bị quên khi đang rối vì sự cố.

### Trả lời mẫu khi phỏng vấn
"Synthetic check là robot đóng vai người dùng, gọi các hành trình quan trọng từ bên ngoài theo chu kỳ. Nó bổ sung cho metric phía server, vì những lỗi như DNS sai, chứng chỉ hết hạn hay CDN hỏng thì server không thấy request nào và metric vẫn xanh, còn ban đêm traffic thấp thì tỉ lệ lỗi không đáng tin. Tôi làm ba mức: blackbox_exporter cho HTTP và hạn chứng chỉ, script API chạy chuỗi đăng nhập tới thanh toán thử, và vài kịch bản Playwright cho trang quan trọng. Robot dùng tài khoản test riêng, kiểm tra nội dung chứ không chỉ mã 200, chạy từ nhiều vùng và chỉ cảnh báo khi nhiều vùng cùng lỗi. Trang status nội bộ lấy trạng thái tự động từ synthetic và SLO, kèm sự cố đang mở và người phụ trách. Ở công ty trước, sau khi làm vậy, phần lớn sự cố được phát hiện trước khi khách báo, thời gian phát hiện từ khoảng 38 phút xuống 3 phút."

> Senior tip: viết synthetic check cho **mọi sự cố từng xảy ra** mà monitoring hiện tại không bắt được. Sau một năm, bộ check đó phản ánh chính xác những cách hệ thống của bạn thật sự hỏng.`,
    follow: ['Liveness vs readiness?', 'Blackbox exporter?', 'SLI/SLO/SLA?'],
    tags: ['Uptime', 'Synthetic', 'HealthCheck', 'SLO']
  }
,
  {
    id: 'devops-110',
    topic: 'devops',
    level: 'lead',
    q: 'SLO, SLI, error budget và cách đặt alert dựa trên error budget burn rate?',
    a: `**Tóm tắt:** **SLI** là chỉ số đo trải nghiệm (tỉ lệ request thành công và đủ nhanh), **SLO** là mục tiêu cho SLI trong một cửa sổ thời gian (99,9% trong 30 ngày), **error budget** là phần được phép hỏng (0,1% ≈ 43 phút/30 ngày). Cảnh báo theo **burn rate** — tốc độ tiêu ngân sách lỗi so với tốc độ "đều đặn" — dùng **nhiều cửa sổ** để vừa bắt nhanh sự cố lớn vừa bắt được sự cố âm ỉ, mà ít báo động giả. **Error budget policy** biến con số thành quyết định: hết ngân sách thì ưu tiên độ ổn định hơn tính năng.

### Định nghĩa bằng ví dụ
- **SLI** = request tốt / tổng request. "Tốt" = không phải 5xx và nhanh hơn 300ms, đo ở load balancer hoặc gateway (gần người dùng).
- **SLO** = 99,9% request tốt trong 30 ngày trượt.
- **Error budget** = 0,1% × số request. Với 100 triệu request/tháng → được phép 100.000 request xấu.
- **SLA** là cam kết hợp đồng (có đền bù), thường lỏng hơn SLO nội bộ (ví dụ SLA 99,5%).

### Burn rate là gì
Burn rate = tỉ lệ lỗi hiện tại / tỉ lệ lỗi cho phép.
~~~text
SLO 99.9% -> tỉ lệ lỗi cho phép 0.1%
Tỉ lệ lỗi đang là 1.44% -> burn rate = 14.4
=> với tốc độ này, ngân sách 30 ngày cạn sau 30 / 14.4 ≈ 2 ngày
   và trong 1 giờ đã tiêu 1h × 14.4 / 720h = 2% ngân sách tháng
~~~
Ngưỡng tĩnh "lỗi > 1%" không biết SLO là gì; burn rate gắn cảnh báo trực tiếp với mức độ nghiêm trọng thật.

### Cảnh báo nhiều cửa sổ (theo Google SRE Workbook)
| Mức | Burn rate | Cửa sổ dài / ngắn | Ý nghĩa | Hành động |
|---|---|---|---|---|
| Page | 14,4 | 1 giờ / 5 phút | Tiêu 2% ngân sách trong 1 giờ | Gọi người trực |
| Page | 6 | 6 giờ / 30 phút | Tiêu 5% trong 6 giờ | Gọi người trực |
| Ticket | 1 | 3 ngày / 6 giờ | Âm ỉ, sẽ hết ngân sách cuối kỳ | Xử lý giờ hành chính |
Cửa sổ dài chống báo động giả; cửa sổ ngắn giúp cảnh báo **tắt nhanh** khi đã hết lỗi.

~~~yaml
# recording rule: tỉ lệ lỗi theo cửa sổ (lặp lại cho 5m, 30m, 6h...)
- record: slo:error_ratio:rate1h
  expr: |
    sum(rate(http_server_requests_seconds_count{application="checkout",status=~"5.."}[1h]))
    / sum(rate(http_server_requests_seconds_count{application="checkout"}[1h]))
- alert: CheckoutErrorBudgetFastBurn
  expr: slo:error_ratio:rate1h > (14.4 * 0.001) and slo:error_ratio:rate5m > (14.4 * 0.001)
  labels: { severity: page }
~~~

### Error budget policy
Thoả thuận viết sẵn giữa product và kỹ thuật: còn ngân sách → deploy bình thường, chấp nhận thử nghiệm; tiêu hết → đóng băng tính năng rủi ro, dồn người vào độ ổn định cho tới khi SLI hồi phục; sự cố tiêu hơn 20% ngân sách → bắt buộc postmortem.

### Ví dụ đời thực
Service thanh toán trước đây cảnh báo khi "5xx > 1% trong 5 phút": bắn khoảng 25 lần/tháng, phần lớn tự hết sau vài phút; trong khi một lỗi âm ỉ 0,3% kéo dài 9 ngày không ai biết, tiêu gần hết ngân sách. Chuyển sang SLO 99,9% với cảnh báo đa cửa sổ: page còn 2–3 lần/tháng, đều là sự cố thật; lỗi âm ỉ được bắt bởi cảnh báo ticket sau khoảng 6 giờ. Khi ngân sách tháng 3 cạn, policy khiến team hoãn một tính năng 2 tuần để sửa retry và timeout — ba tháng sau đó không còn tháng nào vượt ngân sách.

### Pitfall
- SLO 100% hoặc 99,99% cho mọi thứ — không còn ngân sách để thay đổi, hoặc không thể đạt.
- Đo SLI ở tầng quá sâu (một pod) thay vì gần người dùng.
- Tính tỉ lệ khi traffic rất thấp: 1 lỗi / 3 request = 33% → báo động giả; cần ngưỡng số request tối thiểu hoặc synthetic.
- Có SLO nhưng không có policy → con số chỉ để trang trí.

### Trả lời mẫu khi phỏng vấn
"SLI là chỉ số đo trải nghiệm người dùng, ví dụ tỉ lệ request không lỗi và nhanh hơn 300 mili giây, đo ở gateway. SLO là mục tiêu cho chỉ số đó, như 99,9% trong 30 ngày, và error budget là phần được phép hỏng, tức khoảng 43 phút mỗi tháng. Tôi cảnh báo theo burn rate, tức tỉ lệ lỗi hiện tại chia cho tỉ lệ lỗi cho phép. Burn rate 14,4 trong một giờ nghĩa là đã tiêu 2% ngân sách tháng, đáng để gọi người trực. Tôi dùng nhiều cửa sổ: 1 giờ kèm 5 phút và 6 giờ kèm 30 phút cho page, 3 ngày cho ticket; cửa sổ dài chống báo động giả, cửa sổ ngắn giúp cảnh báo tắt nhanh. Quan trọng không kém là error budget policy: hết ngân sách thì ưu tiên độ ổn định hơn tính năng. Ở service thanh toán trước đây, cách này giảm page từ 25 xuống 2–3 lần mỗi tháng mà còn bắt được lỗi âm ỉ trước kia bị bỏ sót."

> Senior tip: bắt đầu với một SLO cho **một hành trình quan trọng nhất** (thường là thanh toán hoặc đăng nhập) và một policy được product ký đồng ý. Một SLO được tôn trọng có giá trị hơn mười SLO không ai nhìn.`,
    follow: ['Error budget policy?', 'Multi-window alert?', 'SLA penalty?'],
    tags: ['SLO', 'SLI', 'ErrorBudget', 'Alerting']
  }
,
  {
    id: 'devops-111',
    topic: 'devops',
    level: 'lead',
    q: 'Distributed tracing: OpenTelemetry, Jaeger/Tempo, trace context propagation trong Spring Boot?',
    a: `**Tóm tắt:** Distributed tracing ghi lại hành trình của một request qua nhiều service thành một **trace** gồm nhiều **span** (mỗi span là một đoạn việc: gọi HTTP, query DB, gửi Kafka). **OpenTelemetry** là chuẩn chung để sinh và gửi dữ liệu trace; **trace context** đi kèm request qua header W3C {{traceparent}}; **Jaeger/Tempo** lưu và hiển thị. Trong Spring Boot 3, Micrometer Tracing với bridge OpenTelemetry tự instrument phần lớn đường đi; việc của bạn là đảm bảo context không bị đứt và chọn **sampling** hợp lý.

### Khái niệm, từng bước
~~~seq
title: Một trace qua 3 service
actors: Gateway | Order | Payment | DB
Gateway -> Order: POST /orders (traceparent: 00-T-A-01)
Order -> DB: INSERT order (span B, cha là A)
Order -> Payment: POST /charge (traceparent: 00-T-C-01)
Payment -> DB: UPDATE wallet (span D, cha là C)
Payment --> Order: 200
Order --> Gateway: 201
~~~
- **traceId (T)** giống nhau trên mọi span của hành trình; mỗi span có **spanId** riêng và id của span cha → dựng được cây thời gian.
- Header {{traceparent}} có dạng {{00-<traceId 32 hex>-<spanId 16 hex>-<flags>}}; bit cuối của flags cho biết request có được lấy mẫu (sampled) hay không, để mọi service quyết định nhất quán.
- **Baggage**: cặp key-value đi kèm context (ví dụ tenantId) — tiện nhưng bị gửi qua mọi lời gọi, không đưa dữ liệu nhạy cảm vào.

### Spring Boot 3
~~~yaml
# dependency: io.micrometer:micrometer-tracing-bridge-otel + io.opentelemetry:opentelemetry-exporter-otlp
management:
  tracing:
    sampling:
      probability: 0.1          # head sampling 10%; mặc định 0.1
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces
~~~
- RestClient/WebClient/RestTemplate **tạo từ builder do Spring cung cấp** (bean) mới được instrument; tự {{new RestTemplate()}} thì mất context.
- Kafka: bật observation trên KafkaTemplate và listener container để context đi qua header message.
- {{@Async}} và executor tự tạo: bọc bằng context propagation, nếu không span con mất cha.
- traceId tự vào MDC → log và trace nối được với nhau.

### Sampling
| Kiểu | Cách làm | Ưu / nhược |
|---|---|---|
| Head-based | Quyết định ở đầu request (ví dụ 10%) | Rẻ, đơn giản; có thể bỏ lỡ chính request lỗi |
| Tail-based | OpenTelemetry Collector giữ toàn bộ span một lúc rồi quyết định: giữ 100% trace lỗi hoặc chậm, 5% trace bình thường | Giữ được trace quan trọng; Collector tốn RAM, cần định tuyến theo traceId |

### Jaeger hay Tempo
Jaeger: giao diện tìm kiếm theo service/tag tốt, lưu trên Elasticsearch/Cassandra. Grafana Tempo: chỉ đánh index theo traceId, lưu trên object storage nên rẻ; tìm bằng TraceQL hoặc đi từ log (traceId) và exemplar trên biểu đồ metric sang trace.

### Ví dụ đời thực
API đặt hàng p99 = 2,1s, mỗi team đều nói service của mình nhanh. Bật tracing với tail sampling (100% trace > 1s). Trace cho thấy Order gọi Inventory **tuần tự** cho từng dòng hàng (đơn trung bình 7 dòng × 180ms), và một lần gọi lại Pricing không cần thiết. Gộp thành một lời gọi batch và bỏ lời gọi thừa: p99 còn 420ms. Cũng nhờ trace, team phát hiện các lời gọi qua {{@Async}} bị đứt context — sửa executor để có cây span đầy đủ.

### Pitfall
- Một service không truyền header → trace đứt đôi, mất đúng đoạn cần xem.
- Sampling 100% ở production lưu lượng lớn → chi phí lưu trữ bùng nổ.
- Đặt attribute có cardinality cao hoặc dữ liệu cá nhân lên span.
- Mỗi service một tỉ lệ sampling khác nhau mà không tôn trọng cờ sampled của cha.

### Trả lời mẫu khi phỏng vấn
"Distributed tracing ghi hành trình của một request thành một trace gồm nhiều span, mỗi span là một đoạn việc như gọi HTTP hay query DB, có traceId chung và id span cha để dựng cây thời gian. Context đi qua các service bằng header W3C traceparent, trong đó có cờ sampled để mọi service quyết định giống nhau. Trong Spring Boot 3 tôi dùng Micrometer Tracing với bridge OpenTelemetry, gửi qua OTLP tới Collector rồi lưu ở Tempo hoặc Jaeger. Những chỗ hay làm đứt context là client HTTP tự new thay vì lấy từ builder của Spring, executor của @Async, và Kafka chưa bật observation. Về sampling, head-based 10% rẻ nhưng có thể bỏ lỡ request lỗi, nên ở hệ thống quan trọng tôi dùng tail-based trên Collector: giữ hết trace lỗi và chậm, chỉ lấy mẫu trace bình thường. Lần gần nhất, trace chỉ ra Order gọi Inventory tuần tự từng dòng hàng; gộp thành một lời gọi là p99 giảm từ 2,1 giây xuống khoảng 400 mili giây."

> Senior tip: đặt traceId vào header response và vào mọi thông báo lỗi trả cho client. Khi khách hàng hoặc QA báo lỗi kèm traceId, thời gian tìm nguyên nhân giảm từ hàng chục phút xuống vài phút.`,
    follow: ['Tail-based sampling?', 'Baggage?', 'Tempo vs Jaeger?'],
    tags: ['OpenTelemetry', 'Tracing', 'Tempo', 'Observability']
  }
  ,
  {
    id: 'devops-112',
    topic: 'devops',
    level: 'mid',
    q: 'Docker network là gì và các chế độ bridge, host, overlay, none khác nhau thế nào? Khi app Java trong container cần gọi PostgreSQL cũng chạy trong container, bạn publish port ra host và để các container tìm nhau ra sao cho đúng?',
    a: `**Tóm tắt:** **Docker network** là lớp mạng ảo mà Docker tạo để các container giao tiếp với nhau và với bên ngoài (giống một mạng LAN ảo do phần mềm điều khiển). Mặc định nên dùng **user-defined bridge**: container gọi nhau bằng **tên service** nhờ DNS nội bộ của Docker, và chỉ **publish port** ({{-p host:container}}) khi cần truy cập từ máy host. {{host}} network bỏ lớp ảo (container dùng thẳng mạng của máy host), {{overlay}} nối nhiều máy (Swarm/Kubernetes dùng khái niệm tương tự), {{none}} tắt mạng.

### Thuật ngữ (giải thích lần đầu)
- **Container**: một "hộp" chạy ứng dụng đã đóng gói, cô lập với máy host (máy thật) về tiến trình và hệ thống file.
- **Network namespace**: cơ chế Linux cô lập ngăn xếp mạng (IP, cổng, bảng định tuyến) cho từng container.
- **Bridge**: "cầu nối" mạng ảo; Docker tạo một switch ảo, gắn container vào đó.
- **Publish port (ánh xạ cổng)**: mở một cổng trên máy host và chuyển tiếp vào cổng trong container, ví dụ {{-p 8080:8080}}.
- **DNS nội bộ**: dịch tên (ví dụ {{postgres}}) thành IP container trong cùng mạng.

### Các chế độ mạng và khi dùng
| Chế độ | Cơ chế | Ưu điểm | Nhược điểm | Khi dùng |
|---|---|---|---|---|
| {{bridge}} mặc định | Bridge {{docker0}}, không có DNS theo tên tự động | Đơn giản | Gọi nhau phải dùng IP, kém tiện | Hạn chế, legacy |
| **User-defined bridge** | Bridge riêng, có DNS theo tên container/service | Tên ổn định, cô lập tốt | Chỉ trên 1 host | Dev/local, Compose (mặc định) |
| {{host}} | Dùng thẳng network namespace của host | Không NAT, độ trễ thấp | Không cô lập cổng, dễ xung đột; không dùng trên Docker Desktop như Linux | Tối ưu hiệu năng đặc biệt, Linux |
| {{overlay}} | Mạng phủ nhiều host (VXLAN) | Container khác máy gọi được nhau | Cần orchestrator, phức tạp | Swarm; K8s dùng CNI riêng |
| {{none}} | Không có giao diện mạng (trừ loopback) | Cô lập tối đa | Không giao tiếp | Job xử lý offline |

### Ví dụ thực tế: Java gọi PostgreSQL trong Compose
~~~yaml
# compose.yaml - Compose tự tạo user-defined bridge cho project
services:
  app:
    image: myteam/order-api:dev
    ports:
      - "8080:8080"        # publish: truy cập từ trình duyệt/IDE trên host
    environment:
      # GỌI BẰNG TÊN SERVICE "db", KHÔNG dùng localhost, KHÔNG dùng IP
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: orders
      POSTGRES_PASSWORD: devpass   # chỉ cho dev; prod dùng secret manager
    # KHÔNG publish 5432 ra host nếu không cần kết nối từ ngoài -> giảm bề mặt tấn công
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10
~~~

### Cơ chế từng bước (vì sao "localhost" trong container là sai)
1. Mỗi container có network namespace riêng, nên {{localhost}} (127.0.0.1) bên trong container {{app}} chỉ trỏ về chính {{app}}, **không** trỏ tới {{db}}.
2. Trên user-defined bridge, Docker chạy DNS nhúng: truy vấn tên {{db}} trả về IP nội bộ của container {{db}} (IP có thể đổi khi tạo lại container, nên luôn dùng tên).
3. {{ports: "8080:8080"}} tạo quy tắc NAT (iptables trên Linux) từ cổng host vào container. Container với container trên cùng bridge nói chuyện **trực tiếp** qua cổng container (5432), không cần publish.

### Lỗi hay gặp
- Dùng {{localhost:5432}} trong cấu hình app chạy trong container → kết nối bị từ chối.
- Publish cổng DB ra {{0.0.0.0}} trên máy dev nối mạng công cộng → lộ DB.
- Tin vào IP container hard-code → hỏng sau khi {{docker compose up --force-recreate}}.

> Senior tip: Coi publish port là "mở cửa ra ngoài" — chỉ mở những gì thực sự cần từ host. Giữa các service nội bộ, để chúng nói chuyện trên mạng Compose riêng bằng tên service; sang Kubernetes tư duy tương tự nhưng tên phân giải qua Service/DNS của cluster.`,
    follow: [
      'Khác nhau giữa EXPOSE trong Dockerfile và ports trong Compose là gì?',
      'Vì sao DNS theo tên không hoạt động trên bridge mặc định docker0?',
      'Làm sao giới hạn một service chỉ nghe trên 127.0.0.1 của host khi publish port?'
    ],
    tags: ['Docker', 'network', 'bridge', 'port', 'Compose', 'DNS'],
    refs: [
      { type: 'doc', title: 'Docker networking overview', url: 'https://docs.docker.com/engine/network/' },
      { type: 'doc', title: 'Networking in Compose', url: 'https://docs.docker.com/compose/how-tos/networking/' }
    ]
  },
  {
    id: 'devops-113',
    topic: 'devops',
    level: 'mid',
    q: 'Phân biệt Docker volume và bind mount? Khi chạy container bằng user non-root, vì sao hay gặp lỗi "Permission denied" khi ghi file vào thư mục mount, và bạn xử lý thế nào cho an toàn?',
    a: `**Tóm tắt:** **Volume** là vùng lưu dữ liệu do Docker quản lý (thường dưới {{/var/lib/docker/volumes}}), bền vững và tách khỏi cấu trúc thư mục host — phù hợp cho dữ liệu DB. **Bind mount** gắn thẳng một đường dẫn cụ thể trên máy host vào container — phù hợp khi dev muốn sửa code/config trên host và thấy ngay trong container. Lỗi quyền xảy ra vì tiến trình trong container chạy với **UID/GID** (mã số user/group Linux) khác với chủ sở hữu file trên host; cách xử lý là căn chỉnh UID/GID hoặc dùng named volume và tránh chạy container như root.

### Thuật ngữ
- **Mount**: gắn một nơi lưu trữ vào một đường dẫn trong hệ thống file của container.
- **UID/GID**: định danh số của user/group trong Linux (root thường là UID 0). Quyền file kiểm tra theo số này, không phải theo tên.
- **Non-root**: chạy tiến trình không phải UID 0 để giảm thiểu nếu container bị chiếm quyền.
- **Ephemeral**: lớp ghi của container là tạm thời — xoá container là mất dữ liệu trên lớp đó.

### So sánh
| Tiêu chí | **Named volume** | **Bind mount** |
|---|---|---|
| Ai quản lý đường dẫn | Docker | Bạn (đường dẫn tuyệt đối trên host) |
| Dữ liệu khi xoá container | Còn (trừ {{down -v}}) | Còn trên host |
| Nội dung ban đầu | Nếu volume rỗng, Docker copy nội dung từ image vào volume | Che (ẩn) nội dung tại đường dẫn đó trong image |
| Hiệu năng Docker Desktop (Mac/Win) | Thường tốt hơn | Có thể chậm do chia sẻ file qua VM |
| Dùng cho | DB data, dữ liệu cần bền | Source code dev, file config inject |
| Rủi ro | Khó "nhìn" trực tiếp trên host | Lệ thuộc cấu trúc host, dễ lỗi quyền |

### Ví dụ cấu hình
~~~yaml
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data   # named volume: dữ liệu DB bền vững
  app:
    image: eclipse-temurin:21-jre
    user: "10001:10001"                    # chạy non-root (UID:GID)
    volumes:
      - ./config:/app/config:ro           # bind mount, read-only: inject config
      - applogs:/app/logs                 # named volume: app ghi log được
volumes:
  pgdata:                                  # khai báo volume do Docker quản lý
  applogs:
~~~

### Vì sao "Permission denied" khi non-root ghi vào bind mount
1. Trên host, thư mục {{./config}} hoặc thư mục đích ghi thuộc về user host (ví dụ UID 1000).
2. Container chạy với UID 10001. Kernel kiểm tra quyền trên inode: UID 10001 không có quyền ghi → {{Permission denied}}, dù bên trong container bạn "thấy" thư mục tồn tại.
3. Với **named volume mới** (rỗng), Docker thường khởi tạo quyền dựa trên thư mục trong image, nên ít gặp hơn; nhưng nếu image chuẩn bị thư mục thuộc root rồi container chạy non-root, vẫn có thể lỗi.

### Cách xử lý an toàn (ưu tiên từ trên xuống)
- **Ưu tiên named volume** cho dữ liệu app/DB cần ghi; tránh bind mount cho đường dẫn ghi.
- Bind mount chỉ đọc ({{:ro}}) khi không cần ghi.
- **Căn UID/GID**: build image tạo user có UID cố định (ví dụ 10001) và {{chown}} thư mục ghi trong Dockerfile; nếu bind mount bắt buộc, đảm bảo thư mục host cấp quyền cho UID đó.
- Tránh "chữa cháy" bằng {{chmod 777}} (mở cho tất cả) hoặc chạy lại bằng {{root}} — cả hai phá mô hình bảo mật.
- Trên SELinux (RHEL/Fedora), bind mount có thể cần cờ {{:z}}/{{:Z}} để gắn nhãn — dùng cẩn thận vì {{:Z}} gắn nhãn private.

### Ví dụ chuẩn bị thư mục ghi trong Dockerfile
~~~dockerfile
FROM eclipse-temurin:21-jre
# Tạo user non-root với UID cố định để dễ căn quyền với volume
RUN groupadd -g 10001 app && useradd -u 10001 -g app -m app \
    && mkdir -p /app/logs && chown -R 10001:10001 /app
USER 10001:10001
WORKDIR /app
COPY --chown=10001:10001 target/app.jar /app/app.jar
ENTRYPOINT ["java","-jar","/app/app.jar"]
~~~

> Senior tip: Quyền file trong container là "điểm mù" kinh điển khi chuyển từ chạy root sang non-root. Hãy chọn một UID cố định cho image, ghi rõ trong README, và dùng named volume cho mọi đường dẫn ghi; bind mount chỉ dành cho dữ liệu read-only hoặc source code ở môi trường dev.`,
    follow: [
      'Sự khác nhau giữa volume driver local và volume dùng storage ngoài (NFS, cloud) là gì?',
      'Khi nào dùng tmpfs mount và nó giúp gì cho dữ liệu nhạy cảm?',
      'Lệnh docker compose down -v nguy hiểm thế nào trên môi trường có dữ liệu quan trọng?'
    ],
    tags: ['Docker', 'volume', 'bind mount', 'permissions', 'non-root', 'UID'],
    refs: [
      { type: 'doc', title: 'Volumes', url: 'https://docs.docker.com/engine/storage/volumes/' },
      { type: 'doc', title: 'Bind mounts', url: 'https://docs.docker.com/engine/storage/bind-mounts/' }
    ]
  },
  {
    id: 'devops-114',
    topic: 'devops',
    level: 'senior',
    q: 'Một image Java đã build xong nhưng chạy container với mặc định của Docker thì vẫn có nhiều quyền thừa. Bạn harden (gia cố) container runtime thế nào: chạy non-root, read-only filesystem, drop capabilities, no-new-privileges? Giải thích từng cơ chế và ánh xạ sang Kubernetes securityContext.',
    a: `**Tóm tắt:** Gia cố runtime nghĩa là **giảm quyền** của tiến trình trong container xuống mức tối thiểu cần thiết (nguyên tắc **least privilege** — đặc quyền tối thiểu). Các lớp chính: (1) chạy **non-root** để hạn chế tác động nếu bị khai thác; (2) **read-only root filesystem** để kẻ tấn công khó ghi mã độc; (3) **drop Linux capabilities** (bỏ các "mảnh" quyền root như {{NET_ADMIN}}) và chỉ thêm lại thứ thực sự cần; (4) {{no-new-privileges}} để chặn leo thang qua binary setuid. Trên Kubernetes cấu hình tương ứng nằm trong {{securityContext}} và bị chính sách (Pod Security Admission) kiểm soát.

### Thuật ngữ
- **Hardening**: gia cố, giảm bề mặt tấn công bằng cấu hình chặt hơn.
- **Linux capabilities**: Linux tách quyền của root thành nhiều mảnh nhỏ ({{CAP_NET_BIND_SERVICE}}, {{CAP_SYS_ADMIN}}...). Container mặc định vẫn giữ một tập capabilities.
- **seccomp**: bộ lọc syscall (lời gọi hệ thống) — giới hạn tiến trình được gọi những hàm kernel nào.
- **seccomp/AppArmor/SELinux**: các lớp kiểm soát bắt buộc của kernel; seccomp lọc syscall, AppArmor/SELinux gắn nhãn và chính sách truy cập.

### Các cơ chế, vì sao cần, và cách bật
| Cơ chế | Vì sao cần | Docker (ví dụ) | Kubernetes ({{securityContext}}) |
|---|---|---|---|
| Non-root | Lỗ hổng RCE ít cơ hội thao tác hệ thống; một số chính sách cấm root | {{USER 10001}} trong image; {{docker run --user 10001:10001}} | {{runAsNonRoot: true}}, {{runAsUser: 10001}} |
| Read-only rootfs | Ngăn ghi webshell/mã độc vào filesystem container | {{--read-only}} + mount {{tmpfs}} cho {{/tmp}} | {{readOnlyRootFilesystem: true}} + {{emptyDir}}/{{tmpfs}} cho thư mục ghi |
| Drop capabilities | Bỏ quyền root thừa (mặc định vẫn còn vài capability) | {{--cap-drop=ALL --cap-add=NET_BIND_SERVICE}} (nếu cần) | {{capabilities.drop: ["ALL"]}} |
| No new privileges | Chặn tiến trình lấy thêm quyền qua file setuid/setgid | {{--security-opt=no-new-privileges:true}} | {{allowPrivilegeEscalation: false}} |
| Seccomp profile | Giảm syscall bề mặt kernel | {{--security-opt seccomp=profile.json}} (mặc định Docker đã có profile) | {{seccompProfile.type: RuntimeDefault}} |

### Ví dụ Docker Compose gia cố một service Java
~~~yaml
services:
  order-api:
    image: my-registry.local/order-api:1.4.2@sha256:3b1c... # pin digest
    user: "10001:10001"                # non-root
    read_only: true                    # filesystem gốc chỉ đọc
    tmpfs:
      - /tmp:size=64m,mode=1777       # Java/các lib thường cần /tmp ghi tạm
    cap_drop:
      - ALL                            # bỏ mọi capability
    security_opt:
      - no-new-privileges:true
    # không dùng: privileged: true, network_mode: host (trừ khi thật sự bắt buộc)
~~~

### Ví dụ Pod Kubernetes (Pod Security "restricted" tương thích)
~~~yaml
apiVersion: v1
kind: Pod
metadata:
  name: order-api
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: my-registry.local/order-api:1.4.2@sha256:3b1c...
      securityContext:
        runAsUser: 10001
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      volumeMounts:
        - name: tmp
          mountPath: /tmp              # chỗ ghi tạm khi rootfs read-only
  volumes:
    - name: tmp
      emptyDir: {}
~~~

### Lỗi hay gặp khi bật read-only/cap-drop
- App hoặc thư viện ghi vào {{/tmp}}, {{/var}}, thư mục work của Tomcat → crash. Cách xử lý: mount {{emptyDir}}/{{tmpfs}} đúng đường dẫn cần ghi; với Spring Boot dùng JAR (không WAR exploded trên Tomcat ngoài) thường chỉ cần {{/tmp}}.
- Bind port < 1024 cần {{CAP_NET_BIND_SERVICE}}; app Java thường nghe 8080 nên chỉ cần {{drop: ALL}} là đủ.
- Image dựng trên giả định chạy root (ghi vào {{/app}}) → phải sửa Dockerfile ({{chown}} thư mục cần ghi, hoặc chuyển sang đường dẫn mount).

### Trên production
- **Sự cố thật:** container chạy root bị RCE qua lỗ hổng dependency; kẻ tấn công cài công cụ đào coin vào {{/tmp}}. Với read-only rootfs + {{/tmp}} là tmpfs có {{noexec}} (nâng cao) và drop capabilities, tác động bị thu hẹp.
- **Kiểm tra:** {{docker inspect}} xem {{ReadonlyRootfs}}, {{CapDrop}}; trên K8s dùng {{kubectl auth can-i --as=system:serviceaccount:...}} và công cụ policy (Kyverno/OPA) để bắt pod vi phạm. Quét cấu hình bằng {{trivy config}} hoặc {{kube-bench}}/policy audit.

> Senior tip: Gia cố runtime là "phòng thủ theo chiều sâu" — image sạch (ít CVE) nhưng chạy privileged vẫn nguy hiểm. Hãy đặt Pod Security Admission mức {{restricted}} cho namespace prod và biến vi phạm thành lỗi CI (render manifest rồi quét) thay vì vá sau khi đã lên cụm.`,
    follow: [
      'Khác nhau giữa allowPrivilegeEscalation: false và chạy non-root là gì?',
      'Khi nào thực sự cần thêm lại một capability, và quy trình phê duyệt ra sao?',
      'Seccomp profile RuntimeDefault chặn điều gì và khi nào app bị ảnh hưởng?'
    ],
    tags: ['Docker', 'Kubernetes', 'securityContext', 'non-root', 'capabilities', 'read-only', 'hardening'],
    refs: [
      { type: 'doc', title: 'Pod Security Standards', url: 'https://kubernetes.io/docs/concepts/security/pod-security-standards/' },
      { type: 'doc', title: 'Security options for Docker', url: 'https://docs.docker.com/engine/containers/run/#security' }
    ]
  },
  {
    id: 'devops-115',
    topic: 'devops',
    level: 'senior',
    q: 'Làm sao xây chuỗi tin cậy cho container image: quét lỗ hổng image và dependency (Trivy, Dependabot), tạo SBOM, ký image và chỉ cho phép cluster chạy image từ registry tin cậy/đã ký?',
    a: `**Tóm tắt:** **Chuỗi cung ứng phần mềm (software supply chain)** của container gồm: mã nguồn → dependency → image → registry → runtime. Cần nhiều lớp: **SCA/Dependabot** cảnh báo lỗ hổng dependency trong mã, **Trivy** quét image (OS package + dependency app) và cấu hình, **SBOM** (Software Bill of Materials — "bảng kê nguyên liệu" liệt kê thành phần trong image) để truy vết nhanh khi có CVE mới, **ký image** (Cosign) để chứng minh nguồn gốc, và **admission policy** (Kyverno/OPA Gatekeeper/cosign policy) để cluster **từ chối** image không đến từ registry tin cậy hoặc chưa ký.

### Thuật ngữ
- **CVE**: mã định danh một lỗ hổng bảo mật công khai.
- **SCA (Software Composition Analysis)**: phân tích thành phần/thư viện bên thứ ba để tìm CVE và vấn đề license.
- **SBOM**: danh sách thành phần (tên, phiên bản, nguồn) đóng gói trong phần mềm/image; giúp trả lời "log4j 2.14 có trong image nào?".
- **Image signing**: gắn chữ ký số vào image trong registry; bên chạy xác minh chữ ký khớp key/identity tin cậy.
- **Admission controller/policy**: thành phần chặn đối tượng Kubernetes không đạt chính sách trước khi tạo.

### Các lớp kiểm soát
| Lớp | Công cụ ví dụ | Phát hiện/chặn gì | Chạy khi nào |
|---|---|---|---|
| Dependency (mã) | Dependabot, Renovate, {{trivy fs}} | CVE trong {{pom.xml}}/{{build.gradle}} | PR/định kỳ |
| Image | {{trivy image}} | CVE OS + app deps trong image | Sau build, trước promote |
| Config/IaC | {{trivy config}} | Dockerfile/K8s manifest rủi ro | CI |
| SBOM | {{trivy image --format cyclonedx}} / Syft | Bảng kê thành phần | Gắn vào artifact mỗi build |
| Ký image | Cosign (Sigstore) | Chứng minh image do pipeline tin cậy tạo | Sau push registry |
| Chỉ chạy image tin cậy | Kyverno, Gatekeeper, Connaisseur | Từ chối image sai registry/chưa ký | Lúc deploy (admission) |

### Ví dụ lệnh (khái niệm, chạy trong CI)
~~~bash
# 1) Quét image đã build (fail CI nếu có HIGH/CRITICAL đã có bản vá)
trivy image --severity HIGH,CRITICAL --ignore-unfixed \
  --exit-code 1 my-registry.local/order-api:1.4.2

# 2) Tạo SBOM (CycloneDX) và lưu kèm artifact
trivy image --format cyclonedx --output sbom.json my-registry.local/order-api:1.4.2

# 3) Ký image bằng Cosign (keyless/OIDC trong CI, hoặc key quản lý an toàn)
cosign sign --yes my-registry.local/order-api@sha256:3b1c...

# 4) Xác minh chữ ký (thực hiện bởi policy/admission hoặc bước kiểm tra)
cosign verify --certificate-identity-regexp "https://gitlab.myco/.+" \
  --certificate-oidc-issuer "https://gitlab.myco" \
  my-registry.local/order-api@sha256:3b1c...
~~~

### Chính sách "chỉ chạy image từ registry tin cậy" (ý tưởng Kyverno)
~~~yaml
# Rút gọn ý tưởng: chỉ cho phép image từ registry nội bộ
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: allow-trusted-registry
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-registry
      match:
        resources:
          kinds: ["Pod"]
      validate:
        message: "Image must come from trusted registry"
        pattern:
          spec:
            containers:
              - image: "my-registry.local/*"   # chỉ registry nội bộ được phép
~~~

### Trên production
- **Sự cố thật:** CVE nghiêm trọng công bố ở một thư viện logging; không có SBOM nên mất hàng ngày rà từng service. Có SBOM + registry inventory, truy vấn "image nào chứa lib X version Y" trả lời trong phút.
- **Sự cố thật:** dev {{kubectl run}} image {{docker.io/...}} lạ để debug → rủi ro mã độc. Admission chặn image ngoài registry nội bộ.
- **Quy trình:** quét tạo tín hiệu (PR/CI), nhưng chính sách chặn (admission) mới là điểm kiểm soát cuối. Xử lý CVE: phân loại reachable/không, nâng bản vá, rebuild image (base image patch định kỳ) rồi promote lại.

> Senior tip: "Quét" mà không có "chặn" thì chỉ là báo cáo. Hãy khóa pipeline theo digest ({{@sha256:...}}) chứ không phải tag trôi ({{latest}}), vì tag có thể trỏ sang image khác sau khi đã quét/đã ký.`,
    follow: [
      'Khác nhau giữa ký image bằng key pair và ký keyless (OIDC) của Cosign?',
      'Vì sao nên tham chiếu image bằng digest thay vì tag trong manifest production?',
      'Làm sao cân bằng chính sách chặn CVE nghiêm trọng với nhu cầu hotfix gấp?'
    ],
    tags: ['Trivy', 'SBOM', 'Cosign', 'supply chain', 'registry', 'Kyverno', 'CVE'],
    refs: [
      { type: 'doc', title: 'Trivy documentation', url: 'https://trivy.dev/latest/docs/' },
      { type: 'doc', title: 'Sigstore Cosign', url: 'https://docs.sigstore.dev/cosign/' }
    ]
  },
  {
    id: 'devops-116',
    topic: 'devops',
    level: 'senior',
    q: 'Chạy database (PostgreSQL/MySQL) bằng Docker: khi nào phù hợp, khi nào rủi ro? Bạn thiết kế backup/restore cho dữ liệu trong volume, healthcheck, và các vấn đề bộ nhớ/hiệu năng cần lưu ý ra sao?',
    a: `**Tóm tắt:** Chạy database bằng Docker **rất hợp** cho dev/test/CI (tái lập nhanh, cùng phiên bản cho cả team) nhưng **rủi ro cao** cho production nếu team chưa có năng lực vận hành stateful (lưu trữ bền, backup, failover, giám sát I/O). Dữ liệu phải nằm trên **volume** (không phải lớp ghi ephemeral), backup nên dùng công cụ native ({{pg_dump}}/{{mysqldump}} hoặc snapshot nhất quán) chứ không chỉ copy file khi DB đang chạy, healthcheck phải kiểm tra DB thực sự nhận truy vấn, và cần chú ý bộ nhớ ({{shared_buffers}} vs giới hạn container, {{shm_size}}).

### Thuật ngữ
- **Stateful**: có trạng thái/dữ liệu phải giữ qua lần khởi động lại (ngược với stateless).
- **Ephemeral storage**: lưu trữ tạm, mất khi container bị xoá.
- **Volume snapshot**: bản chụp nhanh của block storage; cần phối hợp với DB để đảm bảo nhất quán (consistent).
- **shm (shared memory)**: vùng nhớ chia sẻ giữa tiến trình; PostgreSQL dùng cho shared buffers một phần cơ chế.

### Khi nào dùng / khi nào tránh
| Bối cảnh | Dùng Docker cho DB? | Lý do |
|---|---|---|
| Dev local, onboarding | Nên | Một lệnh dựng đúng phiên bản, dễ reset |
| CI integration test | Nên (ephemeral) | Mỗi job một DB sạch, hủy sau khi chạy |
| Staging giống prod (có kiểm soát) | Cân nhắc | Chấp nhận được nếu có backup/monitoring |
| Production quan trọng, team nhỏ | Thường **không** | Rủi ro mất dữ liệu, failover phức tạp; cân nhắc managed DB (RDS/Cloud SQL) |
| Production, team có năng lực K8s + storage | Có thể (StatefulSet/operator) | Cần operator (ví dụ CloudNativePG), storage class tốt, quy trình rõ |

### Ví dụ chạy PostgreSQL bền vững cho dev/test
~~~yaml
services:
  db:
    image: postgres:16-alpine
    shm_size: 128mb                    # tránh lỗi shared memory với một số cấu hình
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password  # file, không lộ qua env dài hạn
    secrets:
      - db_password
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d:ro  # script .sql/.sh chỉ chạy khi data dir trống
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10
    # Giới hạn bộ nhớ container (tùy môi trường), cần hiểu shared_buffers
    # deploy/resources hoặc --memory; tránh để DB tranh hết RAM host
secrets:
  db_password:
    file: ./secrets/db_password.txt      # dev: file local không commit
volumes:
  pgdata:
~~~

### Backup và restore (nguyên tắc)
- **Logical backup (khuyến nghị cho portable):** {{pg_dump}} tạo file SQL/định dạng nén, khôi phục bằng {{pg_restore}}/{{psql}}. Chạy khi DB đang hoạt động (nhất quán ở mức snapshot giao dịch của dump).
~~~bash
# Backup (chạy từ host, exec vào container hoặc dùng psql client)
docker exec -t db pg_dump -U app -d orders -Fc -f /tmp/orders.dump
docker cp db:/tmp/orders.dump ./backups/orders-$(date +%F).dump

# Restore vào DB trống
docker cp ./backups/orders-2026-11-06.dump db:/tmp/orders.dump
docker exec -t db pg_restore -U app -d orders --clean --if-exists /tmp/orders.dump
~~~
- **Volume/file copy:** chỉ an toàn khi DB **đã dừng** hoặc dùng cơ chế freeze/snapshot nhất quán; copy thư mục data đang ghi có thể hỏng cụm.
- Luôn **thử restore** định kỳ (backup chưa restore chưa phải backup).

### Bộ nhớ và hiệu năng
- PostgreSQL dùng {{shared_buffers}} (cấu hình DB) và OS cache. Nếu đặt {{shared_buffers}} cao nhưng container bị giới hạn RAM thấp (cgroup), có thể OOM-kill. Căn {{shared_buffers}} hợp lý với giới hạn container/host.
- {{shm_size}} mặc định của Docker có thể nhỏ; một số workload/hình ảnh cần tăng.
- Gắn volume lên đĩa nhanh; trên Docker Desktop hiệu năng I/O khác Linux native.

### Trên production
- **Sự cố thật:** đặt DB trong container không có volume (dùng lớp ghi) → {{docker rm}} mất sạch dữ liệu.
- **Sự cố thật:** script trong {{/docker-entrypoint-initdb.d}} "không chạy" — vì thư mục data đã có dữ liệu từ lần trước; init script chỉ chạy khi khởi tạo lần đầu (data dir trống).
- **Kiểm tra:** giám sát dung lượng volume, thời gian backup, cảnh báo khi restore test thất bại; {{pg_isready}} chỉ báo nhận kết nối, không thay thế kiểm tra ứng dụng/query thực.

> Senior tip: "Chạy được" trong Docker không đồng nghĩa "an toàn cho production". Với dữ liệu tiền/bệnh án/đơn hàng, câu hỏi không phải là Docker có chạy DB được không, mà là team có quy trình backup-restore-failover đã diễn tập chưa; nếu chưa, managed database thường rẻ hơn một lần mất dữ liệu.`,
    follow: [
      'Vì sao depends_on: service_started chưa đủ để đảm bảo DB sẵn sàng nhận query?',
      'Khác nhau giữa pg_dump (logical) và snapshot volume/đĩa ở mức độ phục hồi?',
      'Khi nào dùng StatefulSet và operator (ví dụ CloudNativePG) thay vì container đơn lẻ?'
    ],
    tags: ['Docker', 'PostgreSQL', 'database', 'volume', 'backup', 'healthcheck', 'shm_size'],
    refs: [
      { type: 'doc', title: 'Docker Official Image: postgres', url: 'https://hub.docker.com/_/postgres' },
      { type: 'doc', title: 'PostgreSQL backup and restore', url: 'https://www.postgresql.org/docs/current/backup.html' }
    ]
  },
  {
    id: 'devops-117',
    topic: 'devops',
    level: 'senior',
    q: 'Bạn chuẩn hóa Docker Compose cho môi trường dev của team Java (app + Postgres + Redis + Kafka): ngoài "chạy lên được", các bẫy thường gặp là gì (depends_on, init, port, rebuild image, dữ liệu cũ) và bạn thiết kế thế nào để mọi người trong team có trải nghiệm giống nhau?',
    a: `**Tóm tắt:** Compose cho dev không chỉ là danh sách service mà là **môi trường có thể tái lập**. Bẫy phổ biến: {{depends_on}} không đợi DB thực sự sẵn sàng, Kafka/Zookeeper/KRaft khởi động chậm và cấu hình listener sai, init script DB chỉ chạy lần đầu, port xung đột giữa máy dev, image build cũ do quên {{--build}}, và dữ liệu volume cũ làm hành vi "khác máy". Giải pháp: healthcheck + {{service_healthy}}, pin version image, profile cho service nặng, quy ước {{.env}} không commit secret, lệnh reset rõ ràng, và tài liệu "một lệnh chạy".

### Thuật ngữ
- **Tái lập (reproducible)**: người khác chạy cùng bước cho ra môi trường tương đương.
- **Pin version/digest**: cố định phiên bản ({{postgres:16.3-alpine}}) hoặc digest để tránh "hôm nay kéo image khác hôm qua".
- **Profile**: nhóm service tùy chọn trong Compose, chỉ bật khi cần (giảm tải máy dev).
- **Init script**: script chạy khi khởi tạo lần đầu (ví dụ {{/docker-entrypoint-initdb.d}}).

### Các bẫy thường gặp và cách xử lý
| Bẫy | Triệu chứng | Vì sao | Cách xử lý |
|---|---|---|---|
| {{depends_on}} mặc định | App lỗi kết nối DB lúc khởi động | Chỉ đợi container start, chưa healthy | {{condition: service_healthy}} + healthcheck thật |
| Init DB chỉ chạy lần đầu | Đổi file init nhưng DB vẫn schema cũ | Init bỏ qua nếu data dir đã có dữ liệu | {{docker compose down -v}} khi cần reset, hoặc dùng migration (Flyway) |
| Kafka listener sai | App trong container nối được, app trên host không (hoặc ngược lại) | {{ADVERTISED_LISTENERS}} phải đúng ngữ cảnh trong/ngoài Docker | Cấu hình 2 listener (internal/external) theo image Kafka dùng |
| Port conflict | {{bind: address already in use}} | Máy dev đã có 5432/6379 chạy | Cho phép override port qua {{.env}} ({{DB_PORT=15432}}) |
| Image cũ | Sửa code nhưng container chạy bản cũ | Compose dùng image đã build sẵn | {{docker compose up --build}} hoặc tách profile build |
| Volume dữ liệu cũ | Test pass máy A, fail máy B | State còn sót từ lần chạy trước | Lệnh reset chuẩn; migration idempotent |
| Resource ăn hết máy | Laptop nóng, Docker treo | Kafka/ES nặng | {{profiles}}, giới hạn {{mem_limit}}/deploy.resources (tùy Compose), chỉ bật service cần |

### Ví dụ khung Compose cho team (rút gọn, có comment)
~~~yaml
# compose.yaml - chạy: docker compose --profile kafka up -d
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: local
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/orders
      SPRING_DATA_REDIS_HOST: redis
    ports:
      - "\${APP_PORT:-8080}:8080"       # override qua .env nếu xung đột
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    image: postgres:16.3-alpine        # pin version, tránh :latest
    environment:
      POSTGRES_DB: orders
      POSTGRES_USER: app
      POSTGRES_PASSWORD: \${DB_PASSWORD:-devpass}  # dev mặc định; không commit secret thật
    ports:
      - "\${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d orders"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    image: redis:7.2-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10

  kafka:
    image: bitnami/kafka:3.7           # ví dụ; kiểm tra biến cấu hình theo image thực tế
    profiles: ["kafka"]                # chỉ bật khi cần: giảm tải máy dev
    environment:
      # Cấu hình listener phụ thuộc image/mode (KRaft/ZK); đọc kỹ README image
      - KAFKA_CFG_NODE_ID=0
      - KAFKA_CFG_PROCESS_ROLES=controller,broker
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@kafka:9093

volumes:
  pgdata:
~~~

### Thực hành giúp team đồng bộ
- Commit {{compose.yaml}} + {{.env.example}} (không commit {{.env}} có secret thật). README ghi: chạy, reset ({{down -v}}), xem log, bật profile.
- Dùng **Flyway/Liquibase** cho schema thay vì trông chờ init script — migration chạy được lặp lại và khớp mọi môi trường.
- Với Java dev: hot reload trong container cần mount source + cấu hình build tool; đơn giản hơn là chạy app trên IDE, chỉ để DB/Redis/Kafka trong Compose (hybrid) — chọn một cách và chuẩn hóa.

> Senior tip: Môi trường dev "gần prod" là mục tiêu tốt, nhưng đừng copy y nguyên bảo mật/prod topology vào laptop. Tối ưu cho vòng phản hồi nhanh và khả năng reset; khác biệt có chủ đích (ví dụ không bật TLS nội bộ ở dev) phải được ghi rõ để không bất ngờ khi lên staging.`,
    follow: [
      'Khi nào nên chạy app Java trên IDE còn hạ tầng trong Compose (hybrid) thay vì container hóa cả app?',
      'Làm sao xử lý xung đột port khi nhiều dev chạy nhiều bản sao stack trên cùng máy?',
      'Vì sao không nên dùng tag :latest cho image hạ tầng trong Compose của team?'
    ],
    tags: ['Docker Compose', 'dev environment', 'healthcheck', 'profiles', 'Kafka', 'Flyway']
  },
  {
    id: 'devops-118',
    topic: 'devops',
    level: 'lead',
    q: 'So sánh quản lý secret cho ứng dụng Java/container bằng biến môi trường, file mount, và hệ thống chuyên dụng (Vault, AWS Secrets Manager). Vì sao biến môi trường có rủi ro, và bạn thiết kế cơ chế xoay vòng (rotation) secret thế nào để không làm gián đoạn dịch vụ?',
    a: `**Tóm tắt:** **Secret** (mật khẩu DB, API key, chứng chỉ) cần được lưu, phân phối và xoay vòng an toàn. **Biến môi trường** tiện nhưng dễ lộ qua log, crash dump, trang debug, hoặc {{/proc/<pid>/environ}} và bị kế thừa xuống tiến trình con. **File mount** (đặc biệt tmpfs/in-memory, như Kubernetes Secret volume) giảm lộ "vô tình" và hỗ trợ cập nhật file, nhưng app phải đọc lại. **Vault/AWS Secrets Manager** (hoặc cơ chế tương đương) tập trung hóa, kiểm soát truy cập (IAM/policy), audit, và hỗ trợ **rotation**; ứng dụng lấy secret lúc chạy (SDK/sidecar/External Secrets) và dùng **credential ngắn hạn** khi có thể. Rotation an toàn cần hai pha (chấp nhận cả secret cũ và mới trong cửa sổ chuyển tiếp) và quy trình reload/restart có kiểm soát.

### Thuật ngữ
- **Secret sprawl**: secret bị sao chép khắp nơi (repo, CI, chat, máy dev) khó kiểm soát.
- **Rotation (xoay vòng)**: thay secret định kỳ hoặc khi nghi ngờ lộ; mục tiêu là giảm thời gian secret bị lợi dụng.
- **Dynamic secret**: secret do hệ thống cấp phát ngắn hạn theo yêu cầu (ví dụ Vault cấp user DB tạm), hết hạn tự vô hiệu.
- **Least privilege**: chỉ cấp quyền đọc đúng secret mà service cần.

### So sánh phương án phân phối
| Phương án | Ưu điểm | Rủi ro/hạn chế | Khi dùng |
|---|---|---|---|
| Biến môi trường | Đơn giản, 12-factor quen thuộc | Lộ qua log/debug/dump/{{/proc}}, kế thừa tiến trình con, khó audit truy cập chi tiết, đổi giá trị thường cần restart | Dev/local; secret ít nhạy cảm; chấp nhận rủi ro có kiểm soát |
| File mount (in-memory) | Không hiện trong env; K8s có thể cập nhật file (trừ subPath) | App phải đọc file/reload; quyền file phải chặt; vẫn là "secret tĩnh" nếu không rotation | K8s Secret volume, Docker secrets/file; tốt hơn env cho đa số trường hợp |
| Vault / AWS Secrets Manager + fetch lúc chạy | Tập trung, IAM/policy, audit, rotation, có thể dynamic/short-lived | Phụ thuộc hạ tầng secret; cần xử lý cache, hết hạn, lỗi mạng | Production, nhiều service, yêu cầu compliance/audit |

### Vì sao biến môi trường rủi ro (cơ chế)
1. Nhiều framework/endpoint debug in cấu hình; một dòng log một dòng log in cả object cấu hình (chứa secret) ra console có thể lộ secret.
2. Trên Linux, tiến trình cùng quyền (hoặc kịch bản leo thang) có thể đọc {{/proc/<pid>/environ}}.
3. Tiến trình con kế thừa env; gọi lệnh ngoài ({{Runtime.exec}}, script) có thể vô tình mang theo secret.
4. Secret đặt trong env của {{docker inspect}}/manifest không được mã hóa như người ta tưởng — cần kiểm soát ai xem được metadata.

### Rotation không gián đoạn (mẫu hai pha)
~~~text
T0: DB chấp nhận password P1 (đang dùng)
T1: Tạo password P2, cấu hình DB chấp nhận CẢ P1 và P2 (cửa sổ chuyển tiếp)
T2: Phát P2 tới app (Secret Manager cập nhật / Vault lease mới)
T3: App nạp P2 (reload) và mở kết nối mới bằng P2; kết nối cũ tự hết theo pool
T4: Xác nhận không còn kết nối dùng P1 -> thu hồi P1
~~~
- Với **dynamic secret** (DB credential do Vault cấp theo TTL), app xin credential mới trước khi hết hạn và hủy cái cũ — giảm nhu cầu "password sống mãi".
- Trên Spring, lấy secret lúc khởi động là đơn giản nhưng đổi secret cần restart; muốn reload cần cơ chế refresh (cẩn thận với connection pool). Nhiều team chọn **rolling restart** có kiểm soát sau khi secret đổi thay vì reload phức tạp, miễn downtime được thiết kế (nhiều replica).

### Trên production
- **Sự cố thật:** API key commit vào repo rồi đưa vào image → lộ vĩnh viễn trong lịch sử. Xử lý: thu hồi/xoay key ngay, xóa khỏi lịch sử (nhưng coi như đã lộ), chuyển sang secret manager.
- **Sự cố thật:** rotation đổi DB password một phía → toàn bộ app mất kết nối. Nguyên nhân: không có cửa sổ chấp nhận kép và không có thứ tự phối hợp.
- **Kiểm tra:** audit log "ai đọc secret nào lúc nào", cảnh báo secret sắp hết hạn/chưa rotate, quét repo/image (secret scanning) trong CI.

> Senior tip: Mục tiêu trưởng thành không phải "giấu secret khỏi code" (bước 1) mà là **giảm blast radius**: secret ngắn hạn, phạm vi hẹp, có audit, rotation tự động, và app chịu được thay đổi credential. Khi phỏng vấn, hãy nói rõ trade-off: reload phức tạp vs rolling restart đơn giản nhưng cần nhiều replica.`,
    follow: [
      'Làm sao ứng dụng Java nhận secret mới khi dùng connection pool mà không rớt request?',
      'External Secrets Operator giải quyết bài toán gì trong Kubernetes?',
      'Khác nhau giữa xoay vòng secret tĩnh (đổi mật khẩu) và dùng credential động ngắn hạn?'
    ],
    tags: ['secrets', 'Vault', 'AWS Secrets Manager', 'rotation', 'security', 'least privilege'],
    refs: [
      { type: 'doc', title: 'AWS Secrets Manager rotation', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html' },
      { type: 'doc', title: 'Kubernetes Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' }
    ]
  },
  {
    id: 'devops-119',
    topic: 'devops',
    level: 'lead',
    q: 'Với tư cách tech lead, bạn thiết lập "đường ray an toàn" cho container của các team Java: chỉ chạy image từ registry tin cậy, image đã ký/đã quét, và xử lý thế nào khi một CVE nghiêm trọng được công bố trên image đang chạy ngoài production?',
    a: `**Tóm tắt:** Ở quy mô nhiều team, an toàn container không dựa vào kỷ luật cá nhân mà dựa vào **đường ray (guardrails)** tự động: (1) một **registry tin cậy** nội bộ là nguồn phát hành duy nhất, có proxy/cache upstream có kiểm soát; (2) pipeline chuẩn **build → quét → tạo SBOM → ký → promote** và chỉ artifact đạt chuẩn mới được đẩy sang registry prod; (3) **admission policy** trên cluster chặn image sai nguồn/chưa ký/vi phạm baseline; (4) khi CVE nghiêm trọng (zero-day hoặc CVSS cao) xuất hiện, dùng SBOM/inventory để xác định phạm vi ảnh hưởng trong phút, phân loại mức độ khai thác được, rồi **rebuild + rolling deploy** hoặc áp dụng biện pháp giảm thiểu tạm thời, có kênh liên lạc và mốc thời gian rõ.

### Thuật ngữ
- **Registry tin cậy**: kho image được tổ chức kiểm soát (Harbor/ECR/GAR với policy), tách biệt dev/prod, có quét và kiểm soát truy cập.
- **Guardrails**: rào chắn tự động cho phép đi nhanh trong giới hạn an toàn (khác với "cổng phê duyệt tay" mọi bước).
- **CVSS**: thang điểm mức độ nghiêm trọng lỗ hổng; điểm cao chưa chắc bị khai thác trong ngữ cảnh của bạn.
- **Blast radius**: phạm vi ảnh hưởng nếu một thành phần bị tấn công.

### Kiến trúc đường ray (mô hình tham chiếu)
| Chặng | Kiểm soát | Bằng chứng |
|---|---|---|
| Source/PR | Secret scanning, SCA dependency, review | Trạng thái check bắt buộc |
| Build | Base image phê duyệt, Dockerfile lint, build tái lập | Log CI, digest image |
| Verify | {{trivy image/config}}, SBOM, unit/integration test | Báo cáo quét + SBOM gắn artifact |
| Trust | Ký image (Cosign, gắn identity CI) | Chữ ký trong registry |
| Promote | Chỉ promote digest đã qua verify; replicate sang registry prod | Tag bất biến theo release |
| Admit | Policy: registry cho phép + chữ ký + baseline securityContext | Admission deny + audit log |
| Run | Runtime tối thiểu đặc quyền, network policy, quan sát | Alert bất thường, drift detection |

### Quy trình ứng phó CVE nghiêm trọng trên image đang chạy
1. **Nhận tín hiệu:** feed CVE/advisory, Dependabot, cảnh báo scanner liên tục trên registry.
2. **Xác định phạm vi (nhanh):** tra SBOM/inventory: service nào, image/tag/digest nào chứa package/lib ảnh hưởng? Có mặt ở prod không?
3. **Phân loại:** có bản vá không ({{fixed version}})? có bị khai thác trong ngữ cảnh của ta không (service có expose đường dẫn đó, có input không tin cậy)? Quyết định: vá ngay, giảm thiểu tạm, hoặc chấp nhận có theo dõi (ghi nhận bằng văn bản).
4. **Giảm thiểu tạm (nếu chưa kịp vá):** rule WAF, tắt tính năng, network policy chặn đường khai thác, tăng giám sát — chỉ là tạm thời.
5. **Vá gốc:** nâng dependency/base image, rebuild, quét lại, ký, deploy rolling (ưu tiên dịch vụ rủi ro cao/mặt ngoài). Với base OS CVE, rebuild image thường đủ; với lib Java, bump version trong {{pom.xml}}/{{build.gradle}}.
6. **Xác minh & hậu kiểm:** xác nhận digest mới đang chạy, quét lại sạch (hoặc còn CVE chấp nhận), rút kinh nghiệm (vì sao mất bao lâu để biết phạm vi? SBOM có đủ không?).

### Cân bằng tốc độ và an toàn
- **Tự động hóa quyết định lặp lại:** chặn tự động HIGH/CRITICAL có bản vá trên main/prod artifact; cho phép ngoại lệ có hạn (ticket + chủ sở hữu + ngày hết hạn) thay vì "tắt scanner".
- **Nền tảng cung cấp đường mặc định an toàn:** base image chuẩn, template Dockerfile/Helm đã harden, pipeline dùng chung — team sản phẩm không phải tự phát minh.
- **Đo lường:** thời gian từ "CVE công bố" đến "biết phạm vi" và đến "prod chạy bản vá"; tỉ lệ image prod ký hợp lệ; số lần admission từ chối (tín hiệu guardrail hoạt động).

> Senior tip: KPI "không có CVE" là ảo; KPI hữu ích là **mean time to remediate** và khả năng trả lời "ta có bị ảnh hưởng không?" trong vài phút nhờ SBOM. Khi nói với lãnh đạo, hãy khung an toàn container như năng lực giao hàng: guardrails tốt giúp team ship nhanh hơn vì bớt tranh luận ad-hoc ở phút cuối.`,
    follow: [
      'Bạn ưu tiên vá những CVE nào trước khi nguồn lực có hạn (CVSS, khả năng khai thác, mức phơi bày)?',
      'Làm sao xử lý ngoại lệ (exception) cho một CVE chưa có bản vá mà business vẫn cần deploy?',
      'Khác nhau giữa kiểm soát ở CI (shift-left) và kiểm soát ở admission/runtime (shift-right) và vì sao cần cả hai?'
    ],
    tags: ['container security', 'supply chain', 'CVE response', 'SBOM', 'guardrails', 'leadership'],
    refs: [
      { type: 'doc', title: 'SLSA supply-chain levels', url: 'https://slsa.dev/' },
      { type: 'doc', title: 'Trivy vulnerability scanning', url: 'https://trivy.dev/latest/docs/scanner/vulnerability/' }
    ]
  },
  {
    id: 'devops-120',
    topic: 'devops',
    level: 'mid',
    q: 'Service trong Kubernetes có những loại nào (ClusterIP, NodePort, LoadBalancer, ExternalName)? Ingress hoạt động ra sao: mô tả luồng request từ domain qua LB, ingress-nginx, Service tới Pod, cách viết path/host rule, dùng annotation (timeout, body size) và cấu hình TLS với cert-manager.',
    a: `**Tóm tắt:** Service tạo địa chỉ ổn định trước các Pod: ClusterIP chỉ dùng nội bộ cluster, NodePort mở cổng trên mọi node, LoadBalancer nhờ cloud cấp LB ngoài, ExternalName ánh xạ sang DNS ngoài. Ingress là tập rule L7 (host/path/TLS) do Ingress controller (ví dụ ingress-nginx) thực thi: request đi từ DNS → Load Balancer → ingress-nginx Pod → Service → Pod. cert-manager tự động xin và gia hạn chứng chỉ TLS cho Ingress.

### Hiểu nhanh
Hãy tưởng tượng một khu chung cư. **Service** là số điện thoại nội bộ của một phòng ban: dù nhân viên (Pod) thay đổi, số nội bộ vẫn giữ nguyên. **ClusterIP** là số chỉ gọi được từ trong toà nhà; **NodePort** là mở thêm một số máy lẻ ở sảnh mỗi tầng để người ngoài gọi vào; **LoadBalancer** là thuê tổng đài bên ngoài (cloud) nhận cuộc gọi rồi chuyển vào; **ExternalName** giống ghi danh bạ "gọi phòng này thì quay số đối tác bên ngoài". **Ingress** là quầy lễ tân tầng trệt: đọc tên công ty trên thư (host) và phòng ban (path) để chuyển đúng chỗ, đồng thời kiểm tra con dấu bảo mật (TLS). **cert-manager** là nhân viên tự đi xin và gia hạn giấy phép bảo mật trước khi hết hạn.

### Thuật ngữ (giải thích lần đầu)
- **ClusterIP**: kiểu Service mặc định, cấp một IP ảo chỉ truy cập được bên trong cluster.
- **NodePort**: kiểu Service mở một cổng (mặc định 30000–32767) trên **mọi node** (máy chủ trong cluster); traffic vào cổng đó được chuyển tới Service.
- **LoadBalancer**: kiểu Service yêu cầu nhà cung cấp cloud (AWS, GCP, Azure) tạo một load balancer có IP public trỏ vào Service.
- **ExternalName**: kiểu Service trả về một bản ghi CNAME DNS trỏ sang tên miền bên ngoài, không có proxy hay ClusterIP.
- **Ingress**: tài nguyên Kubernetes khai báo rule định tuyến HTTP/HTTPS (theo host, path) từ bên ngoài vào các Service.
- **Ingress controller**: chương trình thực thi rule Ingress (ingress-nginx, HAProxy, Traefik...). Bản thân nó chạy như Pod; nếu không cài controller, tài nguyên Ingress không có tác dụng.
- **TLS (Transport Layer Security)**: giao thức mã hoá kết nối HTTPS; cần chứng chỉ (certificate) do một CA (Certificate Authority) cấp.
- **cert-manager**: controller Kubernetes tự động xin, gia hạn và lưu chứng chỉ TLS (thường từ Let's Encrypt) vào Secret.
- **Annotation**: cặp key-value gắn thêm vào tài nguyên để controller đọc cấu hình mở rộng (mỗi controller có bộ annotation riêng).

### Luồng request từ domain tới Pod
~~~seq
title: Luồng request HTTPS qua Ingress
actors: User | DNS/LB | ingress-nginx | Service | Pod
User -> DNS/LB: GET https://shop.bank.vn/api/orders
note DNS/LB..ingress-nginx: DNS trỏ shop.bank.vn -> IP public của Load Balancer
DNS/LB -> ingress-nginx: Chuyển TCP 443 vào Pod ingress-nginx
ingress-nginx -> ingress-nginx: Kết thúc TLS, khớp host+path rule
ingress-nginx -> Service: Proxy tới order-svc:80
Service -> Pod: Chọn Pod Ready (EndpointSlice), gửi tới :8080
Pod --> ingress-nginx: HTTP 200 JSON
ingress-nginx --> User: HTTPS 200 (mã hoá lại)
~~~

### 4 loại Service và khi nào dùng
| Loại | Phạm vi truy cập | Dùng khi | Lưu ý |
|---|---|---|---|
| ClusterIP | Chỉ trong cluster | Service-to-service (order gọi payment qua {{http://payment-svc}}) | Mặc định; an toàn nhất |
| NodePort | Ngoài cluster qua {{<NodeIP>:30000-32767}} | On-prem không có cloud LB, hoặc LB ngoài tự trỏ vào node | Mở cổng trên mọi node; phải quản lý firewall |
| LoadBalancer | IP public do cloud cấp | Muốn mỗi Service có LB riêng (ít dùng) hoặc expose Ingress controller | Tốn chi phí mỗi LB; thường chỉ dùng 1 LB cho ingress-nginx |
| ExternalName | Trả CNAME DNS | Gọi dịch vụ ngoài cluster bằng tên nội bộ (ví dụ {{db.external}} -> RDS endpoint) | Không proxy, không health check; chỉ là alias DNS |

### Manifest Ingress: host/path rule, annotation, TLS
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-ingress
  annotations:
    # Annotation riêng cho ingress-nginx (controller khác tên khác)
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"   # chờ backend tối đa 60s
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"     # giới hạn body upload 10MB
    cert-manager.io/cluster-issuer: "letsencrypt-prod"     # cert-manager tự xin cert
spec:
  ingressClassName: nginx
  tls:
    - hosts: [shop.bank.vn]
      secretName: shop-tls          # cert-manager sẽ tạo/cập nhật Secret này
  rules:
    - host: shop.bank.vn
      http:
        paths:
          - path: /api/orders
            pathType: Prefix        # khớp /api/orders và /api/orders/123
            backend:
              service: { name: order-svc, port: { number: 80 } }
          - path: /api/payments
            pathType: Prefix
            backend:
              service: { name: payment-svc, port: { number: 80 } }
~~~

### cert-manager xin TLS tự động thế nào
~~~yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata: { name: letsencrypt-prod }
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@bank.vn
    privateKeySecretRef: { name: letsencrypt-prod-key }
    solvers:
      - http01:
          ingress: { class: nginx }  # cert-manager tạo route tạm để Let's Encrypt xác minh
~~~
Khi Ingress có annotation {{cert-manager.io/cluster-issuer}}, cert-manager tạo Certificate → gửi yêu cầu ACME → hoàn thành thử thách HTTP-01 qua Ingress → lưu cert/key vào Secret {{shop-tls}}. Nó tự gia hạn trước khi hết hạn (thường còn 30 ngày).

### Trên production
- **Lệnh kiểm tra:**
~~~bash
kubectl get ingress shop-ingress -o wide          # xem host, address, rules
kubectl describe ingress shop-ingress             # events, backend, TLS secret
kubectl get endpointslices -l kubernetes.io/service-name=order-svc  # Pod nào đang nhận
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=100  # lỗi 502/504
kubectl get certificate,certificaterequest,challenge -A  # trạng thái cert-manager
~~~
- **Sự cố hay gặp:** (1) Ingress trả 503 "Service Temporarily Unavailable" vì Service không có endpoint (selector sai hoặc Pod chưa Ready). Kiểm tra {{kubectl get endpointslices}}. (2) Upload file lớn bị 413: chưa đặt {{proxy-body-size}}. (3) Backend xử lý lâu bị 504: timeout mặc định ingress-nginx là 60s; tăng {{proxy-read-timeout}} nhưng cũng phải xem app có tối ưu được không. (4) Cert không được cấp: {{kubectl describe challenge}} xem lỗi ACME (DNS chưa trỏ đúng, firewall chặn port 80 cho HTTP-01).
- **IngressClass:** cluster có thể có nhiều controller; luôn đặt {{ingressClassName}} để rule đi đúng controller.

> Senior tip: Chỉ tạo **một** Service kiểu LoadBalancer cho ingress-nginx và dùng Ingress để chia traffic cho nhiều service — tiết kiệm chi phí và IP public. Với ngân hàng, thường dùng private Load Balancer + WAF phía trước, và TLS kết thúc tại Ingress (hoặc passthrough nếu cần end-to-end). Luôn pin version ingress-nginx và theo dõi thông báo bảo mật; dự án ingress-nginx đã thông báo ngừng bảo trì (retirement), nên lên kế hoạch đánh giá Gateway API (HTTPRoute) cho các tính năng routing chuẩn hơn.`,
    follow: [
      'Sự khác nhau giữa pathType Prefix, Exact và ImplementationSpecific trong Ingress là gì? Cho ví dụ dễ nhầm.',
      'TLS termination tại Ingress khác TLS passthrough thế nào? Khi nào ngân hàng cần end-to-end encryption?',
      'Gateway API (HTTPRoute, Gateway) giải quyết hạn chế gì của Ingress và bạn sẽ cân nhắc chuyển khi nào?'
    ],
    tags: ['Kubernetes', 'Service', 'Ingress', 'TLS', 'cert-manager'],
    refs: [
      { type: 'doc', title: 'Kubernetes Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
      { type: 'doc', title: 'Kubernetes Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' },
      { type: 'doc', title: 'cert-manager: Securing Ingress Resources', url: 'https://cert-manager.io/docs/usage/ingress/' }
    ]
  },
  {
    id: 'devops-121',
    topic: 'devops',
    level: 'senior',
    q: 'Helm là gì và giải quyết vấn đề gì khi deploy ứng dụng Spring Boot lên Kubernetes? Hãy giải thích chart, values, release, các lệnh upgrade --install, rollback, helm template; và khi nào bạn tự viết chart, khi nào dùng Kustomize.',
    a: `**Tóm tắt:** Helm là trình quản lý gói (package manager) cho Kubernetes: gom nhiều manifest YAML (Deployment, Service, Ingress, ConfigMap...) thành một **chart** có tham số hoá qua **values**; mỗi lần cài tạo một **release** có lịch sử để rollback. Dùng {{helm upgrade --install}} để triển khai lặp lại (idempotent), {{helm template}} để render YAML xem trước, {{helm rollback}} để quay lại bản cũ. Tự viết chart khi cần đóng gói tái sử dụng với nhiều biến cấu hình; dùng Kustomize khi muốn patch YAML thuần theo môi trường mà không cần template engine.

### Hiểu nhanh
Deploy một app Spring Boot lên K8s thường cần 5–10 file YAML (Deployment, Service, Ingress, ConfigMap, Secret, HPA...). Mỗi môi trường (dev/staging/prod) chỉ khác vài giá trị như số replica, image tag, domain. Copy-paste YAML rồi sửa tay rất dễ sai sót. **Helm** giống "bộ công thức nấu ăn + gia vị tuỳ chỉnh": chart là công thức (template YAML), values là gia vị (replica=2 hay 4, tag=v1.2.3), release là một nồi đã nấu (bản deploy đang chạy). Muốn đổi gia vị thì nấu lại nồi đó (upgrade) và luôn nhớ lần nấu trước để làm lại nếu dở (rollback). **Kustomize** thì khác: không dùng công thức có biến, mà giữ YAML gốc rồi "dán miếng vá" (patch) cho từng môi trường.

### Thuật ngữ
- **Chart**: gói Helm, là một thư mục chứa {{Chart.yaml}} (metadata), {{values.yaml}} (giá trị mặc định), và {{templates/}} (manifest YAML có placeholder dạng ngoặc nhọn kép, ví dụ tham chiếu {{.Values.image.tag}}).
- **Values**: các biến cấu hình; có thể đặt trong {{values.yaml}}, file override ({{-f values-prod.yaml}}), hoặc {{--set key=value}}.
- **Release**: một lần cài chart vào cluster với tên cụ thể; Helm lưu lịch sử release (revision) trong Secret của cluster.
- **Repository**: kho chart (HTTP index) để chia sẻ chart công khai/nội bộ (ví dụ Bitnami, Harbor OCI).
- **Idempotent**: chạy lặp lại cho cùng kết quả; {{upgrade --install}} sẽ cài nếu chưa có, nâng cấp nếu đã có.
- **Render**: Helm thay placeholder trong template bằng values để sinh ra YAML Kubernetes thuần.

### Cấu trúc chart tối giản
~~~text
payment-chart/
  Chart.yaml          # name, version (chart), appVersion
  values.yaml         # giá trị mặc định
  templates/
    deployment.yaml   # dùng \{{ .Values.image.tag }}, \{{ .Values.replicaCount }}
    service.yaml
    ingress.yaml
    _helpers.tpl      # hàm/template dùng chung (tên, label)
~~~
~~~yaml
# values.yaml (rút gọn)
replicaCount: 2
image:
  repository: harbor.bank.local/core/payment
  tag: "1.4.0"           # CI sẽ override khi deploy
service: { port: 80, targetPort: 8080 }
ingress:
  enabled: true
  host: payment.bank.vn
resources:
  requests: { cpu: 250m, memory: 512Mi }
  limits:   { cpu: "1",   memory: 1Gi }
~~~

### Các lệnh Helm hay dùng (có comment)
~~~bash
# 1) Cài hoặc nâng cấp (idempotent) - dùng trong CI/CD
helm upgrade --install payment ./payment-chart \
  -n payment --create-namespace \       # namespace đích, tạo nếu chưa có
  -f values-prod.yaml \                  # override theo môi trường
  --set image.tag=1.4.7 \                # tag do CI build ra
  --atomic --timeout 5m                  # lỗi thì tự rollback, chờ tối đa 5 phút

# 2) Xem YAML sẽ được áp dụng (review trước khi chạy thật)
helm template payment ./payment-chart -f values-prod.yaml --set image.tag=1.4.7

# 3) Xem lịch sử và rollback
helm history payment -n payment
helm rollback payment 3 -n payment       # quay về revision 3

# 4) Kiểm tra khác biệt (cần plugin helm-diff) và gỡ cài
helm diff upgrade payment ./payment-chart -f values-prod.yaml
helm uninstall payment -n payment
~~~

### Helm vs Kustomize: chọn cái nào
| Tiêu chí | Helm | Kustomize |
|---|---|---|
| Cách tuỳ biến | Template + values (logic {{if/range}} trong YAML) | Patch/overlay trên YAML thuần (không template) |
| Đóng gói tái sử dụng | Tốt: chart như thư viện, version hoá, publish repo | Kém hơn: thường copy base rồi patch |
| Dễ đọc manifest | Khó hơn: phải render mới thấy YAML cuối | Dễ: YAML gần như nguyên bản |
| Quản lý release/rollback | Có sẵn (history, rollback) | Không có; dựa vào GitOps controller (Argo CD/Flux) |
| Hợp khi | Nhiều biến, cài phần mềm bên thứ ba (Postgres, Redis), cần gói tái dùng | Ít biến, muốn YAML thuần, GitOps thuần tuý |

Trong thực tế nhiều đội dùng **cả hai**: Helm render chart bên thứ ba, hoặc Argo CD deploy Helm chart nhưng quản lý values trong Git; Kustomize dùng cho overlay nhẹ.

### Trên production
- **Sự cố hay gặp:** (1) {{helm upgrade}} thất bại giữa chừng để lại release trạng thái {{failed/pending-upgrade}}: dùng {{--atomic}} để tự rollback, hoặc {{helm rollback}} thủ công. (2) {{--set}} nhầm kiểu (số thành chuỗi, boolean) gây YAML sai: ưu tiên file {{-f}} và {{helm template}} để review. (3) Sửa resource trực tiếp bằng {{kubectl edit}} rồi Helm upgrade đè lại: gọi là "drift" (lệch khỏi khai báo). Tránh sửa tay; mọi thay đổi đi qua values + upgrade.
- **Lệnh kiểm tra:**
~~~bash
helm list -n payment                      # release đang cài, trạng thái, revision
helm get values payment -n payment -a     # values thực tế đang dùng
helm get manifest payment -n payment      # YAML đã render đang áp dụng
kubectl get events -n payment --sort-by=.lastTimestamp  # lỗi khi rollout
~~~
- **Bảo mật:** không nhét Secret thật vào {{values.yaml}} commit lên Git. Dùng {{helm-secrets}} (SOPS), External Secrets Operator, hoặc inject từ CI secret store.

> Senior tip: Luôn chạy {{helm template}} (và {{helm diff}} nếu có) trong CI để review YAML trước khi apply — template Helm có thể sinh ra YAML khác ý bạn chỉ vì một thụt dòng hay {{if}} sai. Đặt {{--atomic --timeout}} trong pipeline deploy để thất bại tự quay về trạng thái tốt, và version hoá chart ({{version}} trong Chart.yaml) tách biệt với {{appVersion}} để quản lý thay đổi hạ tầng độc lập với thay đổi code.`,
    follow: [
      'Helm lưu lịch sử release ở đâu trong cluster và bạn xử lý thế nào khi Secret lịch sử quá lớn?',
      'Làm sao quản lý Secret an toàn khi dùng Helm trong GitOps (Argo CD) mà không commit mật khẩu vào Git?',
      'Khi nào bạn chọn dùng chart của cộng đồng (Bitnami) và khi nào phải tự viết chart nội bộ?'
    ],
    tags: ['Kubernetes', 'Helm', 'Kustomize', 'Deployment', 'GitOps'],
    refs: [
      { type: 'doc', title: 'Helm - Using Helm', url: 'https://helm.sh/docs/intro/using_helm/' },
      { type: 'doc', title: 'Helm - Charts', url: 'https://helm.sh/docs/topics/charts/' }
    ]
  },
  {
    id: 'devops-122',
    topic: 'devops',
    level: 'senior',
    q: 'Với ứng dụng Spring Boot chạy trên Kubernetes, bạn dùng ConfigMap và Secret thế nào? So sánh truyền qua biến môi trường (env) và mount file; vì sao đổi ConfigMap thì Pod không tự nhận cấu hình mới và cách xử lý (checksum annotation, rollout restart)? Giải thích vì sao Secret chỉ là base64 và các giải pháp an toàn hơn (encryption at-rest, External Secrets, Sealed Secrets).',
    a: `**Tóm tắt:** ConfigMap giữ cấu hình không nhạy cảm, Secret giữ dữ liệu nhạy cảm (mật khẩu, token). Cả hai có thể đưa vào Pod qua biến môi trường hoặc mount thành file; Spring Boot đọc {{application.yml}}/properties từ file mount rất tự nhiên, còn env map tốt với {{SPRING_*}}. Biến môi trường chỉ được đọc lúc tiến trình khởi động nên đổi ConfigMap/Secret không tự cập nhật Pod đang chạy — thường buộc rollout bằng checksum annotation hoặc {{kubectl rollout restart}}. Secret Kubernetes mặc định chỉ mã hoá base64 (không phải mã hoá bảo mật); cần bật encryption at-rest cho etcd và dùng External Secrets Operator hoặc Sealed Secrets để không lưu bản rõ trong Git.

### Hiểu nhanh
**ConfigMap** giống tờ hướng dẫn cấu hình dán trên tường (URL dịch vụ, feature flag) — ai trong phòng cũng đọc được. **Secret** giống két sắt đựng mật khẩu — cần chìa khoá (RBAC) mới mở. Bạn có thể "đọc to" hướng dẫn cho nhân viên lúc vào ca (truyền qua biến môi trường: chỉ nghe một lần lúc bắt đầu) hoặc "để tờ giấy trên bàn" (mount file: có thể thay giấy mới, nhưng nhân viên phải chịu khó nhìn lại). Vấn đề: đổi nội dung ConfigMap giống thay tờ hướng dẫn trên tường, nhưng nhân viên đã vào ca (container đang chạy) không tự quay lại đọc — bạn phải cho họ ra vào lại ca (restart Pod). Và "két sắt" Secret mặc định chỉ khoá bằng mã base64 — ai cầm được file YAML cũng mở được như đọc chữ nghiêng, nên cần két thật (mã hoá at-rest) và quy trình gửi két an toàn (External Secrets/Sealed Secrets).

### Thuật ngữ
- **ConfigMap**: đối tượng K8s lưu cặp key-value hoặc nội dung file cấu hình dạng text, không dành cho dữ liệu nhạy cảm.
- **Secret**: đối tượng K8s lưu dữ liệu nhạy cảm; giá trị được mã hoá base64 khi lưu trong manifest (base64 **không** phải mã hoá bảo mật).
- **env / envFrom**: cách inject key của ConfigMap/Secret thành biến môi trường của container.
- **Volume mount**: gắn ConfigMap/Secret như một thư mục/file trong filesystem container.
- **etcd**: kho dữ liệu của control plane Kubernetes, nơi lưu mọi object (kể cả Secret). **Encryption at-rest** mã hoá dữ liệu Secret trong etcd.
- **External Secrets Operator (ESO)**: controller đồng bộ secret từ kho ngoài (AWS Secrets Manager, Vault, GCP Secret Manager) vào Secret K8s.
- **Sealed Secrets**: công cụ (Bitnami) mã hoá Secret thành SealedSecret an toàn để commit lên Git; chỉ controller trong cluster mới giải mã được.
- **Rollout restart**: khởi động lại lần lượt các Pod của Deployment để chúng đọc lại env/config.

### env vs file mount cho Spring Boot
| Tiêu chí | Biến môi trường (env/envFrom) | Mount file (volume) |
|---|---|---|
| Spring Boot đọc thế nào | Map {{SPRING_DATASOURCE_URL}} → {{spring.datasource.url}} tự động | Đặt {{application.yml}}/properties vào đường dẫn Spring tìm ({{/config}}) hoặc trỏ {{spring.config.import}} |
| Cập nhật khi đổi ConfigMap | **Không** bao giờ với tiến trình đang chạy (env cố định lúc start) | Kubelet cập nhật file sau một trễ (gần 1 phút); **nhưng** Spring Boot không tự reload trừ khi dùng cơ chế reload (Spring Cloud Config + refresh) hoặc actuator refresh |
| Hạn chế | Tên biến dài, dễ rò rỉ qua {{/proc}}, crash dump; khó chứa file lớn | Nếu mount bằng {{subPath}}, file **không** được cập nhật tự động |
| Hợp khi | Vài giá trị đơn giản, secret dạng key riêng lẻ | File cấu hình phức tạp (YAML dài), chứng chỉ, nhiều key |

~~~yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: payment-config }
data:
  SPRING_PROFILES_ACTIVE: "prod"
  application.yml: |
    server.port: 8080
    app.timeout-ms: 2000
---
apiVersion: v1
kind: Secret
metadata: { name: payment-secret }
type: Opaque
stringData:                      # dùng stringData để khỏi tự base64 tay
  SPRING_DATASOURCE_PASSWORD: "s3cr3t"
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    metadata:
      annotations:
        # Đổi checksum khi ConfigMap/Secret đổi -> Pod template đổi -> rollout tự động
        checksum/config: "\{{ include (print $.Template.BasePath \"/configmap.yaml\") . | sha256sum \}}"
    spec:
      containers:
        - name: payment
          envFrom:
            - configMapRef: { name: payment-config }   # chỉ lấy key-value, không lấy file
          env:
            - name: SPRING_DATASOURCE_PASSWORD
              valueFrom: { secretKeyRef: { name: payment-secret, key: SPRING_DATASOURCE_PASSWORD } }
          volumeMounts:
            - name: cfg
              mountPath: /config                        # Spring Boot tự đọc /config/application.yml
      volumes:
        - name: cfg
          configMap: { name: payment-config, items: [{ key: application.yml, path: application.yml }] }
~~~

### Vì sao đổi ConfigMap Pod không tự nhận và cách xử lý
- **Nguyên nhân gốc:** biến môi trường là thuộc tính của tiến trình, gán lúc container start. Spring Boot đọc cấu hình lúc khởi động context. Dù kubelet có cập nhật file mount, app không tự đọc lại.
- **Cách 1 — Rollout restart (đơn giản, an toàn):** {{kubectl rollout restart deploy/payment -n payment}}. Phù hợp khi thay đổi cấu hình không quá thường xuyên và chấp nhận rolling restart.
- **Cách 2 — Checksum annotation (Helm):** tính hash nội dung ConfigMap/Secret đưa vào {{spec.template.metadata.annotations}}. Nội dung đổi → hash đổi → Pod template đổi → Deployment tự rolling update. Đây là cách phổ biến khi dùng Helm.
- **Cách 3 — App tự reload:** Spring Cloud Kubernetes hoặc actuator {{/actuator/refresh}} với {{@RefreshScope}}. Phức tạp hơn, không phải bean nào cũng refresh an toàn (connection pool, thread pool). Dùng có chọn lọc.

### Secret chỉ là base64 — nghĩa là gì và xử lý ra sao
Base64 chỉ là **mã hoá biểu diễn** (encoding) để nhúng dữ liệu nhị phân vào YAML, ai cũng giải mã được: {{echo c2VjcmV0 | base64 -d}} ra {{secret}}. Vì vậy:
- **Bật encryption at-rest cho etcd**: API server mã hoá Secret trước khi ghi vào etcd (KMS provider hoặc aescbc). Người đọc thẳng etcd không thấy bản rõ.
- **Giới hạn RBAC**: chỉ ServiceAccount/nhóm cần thiết mới được {{get/list}} Secret. Tránh gán quyền rộng.
- **Không commit Secret bản rõ vào Git**. Dùng:
  - **External Secrets Operator (ESO):** khai báo {{ExternalSecret}} trỏ tới AWS Secrets Manager/Vault; ESO đồng bộ ra Secret K8s. Secret thật nằm ở kho ngoài, Git chỉ chứa tham chiếu.
  - **Sealed Secrets:** {{kubeseal}} mã hoá Secret bằng public key của cluster thành {{SealedSecret}} (an toàn commit Git); chỉ controller trong cluster giải mã.
- **Tránh lộ qua log/env dump:** không log cấu hình nhạy cảm, cẩn thận với actuator {{/env}} (tắt hoặc bảo vệ), tránh {{kubectl describe pod}} lộ giá trị (K8s không hiện giá trị Secret trong describe, nhưng env inject vẫn có thể lộ qua exec).

### Trên production
~~~bash
kubectl get cm,secret -n payment
kubectl describe cm payment-config -n payment     # xem key (không lộ giá trị nguy hiểm)
kubectl rollout restart deploy/payment -n payment  # áp dụng config mới
kubectl rollout status deploy/payment -n payment
kubectl exec deploy/payment -n payment -- env | grep SPRING  # kiểm tra env (cẩn thận)
~~~
- **Sự cố:** (1) Đổi Secret DB password nhưng quên restart → app vẫn dùng mật khẩu cũ trong env, một lúc sau DB đổi pass → lỗi kết nối hàng loạt. (2) Dùng {{subPath}} mount file cấu hình → kubelet không cập nhật file khi ConfigMap đổi, gây hiểu lầm "đã đổi mà app vẫn cũ". (3) Commit file {{secret.yaml}} base64 lên Git public/nội bộ rộng → lộ mật khẩu. Chuyển sang ESO/Sealed Secrets và xoay (rotate) credential ngay.

> Senior tip: Quy ước thực tế: ConfigMap/Secret cho cấu hình **không nhạy cảm hoặc tham chiếu**, credential thật nằm ở vault (AWS Secrets Manager, HashiCorp Vault) và đồng bộ bằng External Secrets Operator; bật encryption at-rest cho etcd và audit quyền đọc Secret. Trong Helm, dùng checksum annotation để mọi thay đổi config đều tạo rollout có kiểm soát — và nhớ Spring Boot actuator endpoint {{/env}}, {{/configprops}} phải được bảo vệ (hoặc tắt public) vì có thể lộ giá trị nhạy cảm.`,
    follow: [
      'So sánh External Secrets Operator và Sealed Secrets: luồng dữ liệu, ai giữ khoá, và khi nào chọn cái nào?',
      'Làm sao để Spring Boot reload một phần cấu hình (ví dụ timeout, feature flag) mà không restart Pod? Rủi ro là gì?',
      'Bạn phát hiện Secret DB từng bị commit base64 vào Git. Các bước ứng phó (xoay khoá, dọn lịch sử, phòng ngừa) là gì?'
    ],
    tags: ['Kubernetes', 'ConfigMap', 'Secret', 'Spring Boot', 'External Secrets'],
    refs: [
      { type: 'doc', title: 'Kubernetes ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' },
      { type: 'doc', title: 'Kubernetes Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' },
      { type: 'doc', title: 'Encrypting Confidential Data at Rest', url: 'https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/' }
    ]
  },
  {
    id: 'devops-123',
    topic: 'devops',
    level: 'senior',
    q: 'Ứng dụng Spring Boot trên Kubernetes khởi động chậm (load context, kết nối pool, warm-up). Bạn cấu hình liveness, readiness, startup probe thế nào với Spring Boot Actuator health groups để vừa an toàn vừa tránh restart loop? Những sai lầm cấu hình nào thường gây Pod bị restart liên tục?',
    a: `**Tóm tắt:** Dùng **startupProbe** để cho app thời gian khởi động (trong lúc này liveness/readiness chưa chạy), **readinessProbe** gắn với health group {{readiness}} để chỉ nhận traffic khi thật sự sẵn sàng (DB/pool OK), và **livenessProbe** gắn với group {{liveness}} để chỉ phát hiện trạng thái treo không tự hồi phục — tuyệt đối không kiểm tra dependency ngoài (DB, Redis) trong liveness. Spring Boot Actuator cung cấp sẵn {{/actuator/health/liveness}} và {{/actuator/health/readiness}}. Sai cấu hình kinh điển: liveness chạy quá sớm hoặc phụ thuộc DB → Pod restart vòng lặp khi DB chậm.

### Hiểu nhanh
Ba probe giống ba câu hỏi y tế khác nhau cho một nhân viên ca mới: **Startup** — "Bạn đã vào vị trí và mở máy xong chưa?" (hỏi kiên nhẫn lúc đầu ca, chưa xong thì đợi). **Readiness** — "Bạn có đang phục vụ khách được không?" (nếu máy in hỏng/DB chưa nối, tạm không đưa khách tới, nhưng không đuổi nhân viên về). **Liveness** — "Bạn có còn tỉnh táo không hay đã ngất xỉu?" (chỉ khi treo hẳn, không tự hồi phục mới gọi cấp cứu — restart). Sai lầm phổ biến: coi "máy in hỏng" (DB chậm) là "ngất xỉu" (liveness fail) → đuổi cả đội về giữa giờ cao điểm → hết người phục vụ.

### Thuật ngữ
- **Probe**: cơ chế kubelet kiểm tra container định kỳ (HTTP GET, TCP socket, hoặc exec lệnh). Tham số chính: {{initialDelaySeconds}} (trễ lần đầu, bỏ qua nếu có startupProbe), {{periodSeconds}}, {{timeoutSeconds}}, {{failureThreshold}} (số lần fail liên tiếp mới tính là fail), {{successThreshold}}.
- **startupProbe**: kiểm tra giai đoạn khởi động; khi chưa thành công, liveness/readiness bị vô hiệu. Fail quá {{failureThreshold}} → container bị restart. Dùng để "khoan" cho app chậm.
- **readinessProbe**: fail → Pod bị gỡ khỏi EndpointSlice của Service (ngừng nhận traffic), **không** restart.
- **livenessProbe**: fail → kubelet **restart** container. Chỉ nên phát hiện deadlock/hung không tự phục hồi.
- **Actuator**: module Spring Boot cung cấp endpoint vận hành (health, metrics, info). **Health group** gom các indicator thành nhóm ({{liveness}}, {{readiness}}) để probe gọi đúng mục đích.
- **Health indicator**: thành phần kiểm tra một phần ({{db}}, {{diskSpace}}, {{redis}}, {{ping}}). Group {{liveness}} mặc định chỉ gồm {{livenessState}} (trạng thái nội bộ), {{readiness}} gồm {{readinessState}} và thường cả {{db}} tuỳ cấu hình.

### Cấu hình Spring Boot Actuator (health groups)
~~~yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true            # bật /actuator/health/liveness và /readiness
      show-details: never        # production: không lộ chi tiết ra ngoài
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  health:
    livenessState.enabled: true
    readinessState.enabled: true
~~~
Spring Boot (2.3+, chuẩn trên 3.x) tự bật liveness/readiness state trên Kubernetes. Group {{liveness}} chỉ phản ánh trạng thái nội tại ứng dụng ({{LivenessState.CORRECT}} trừ khi bạn chủ động báo {{BROKEN}}). Group {{readiness}} phản ánh khả năng nhận traffic; bạn có thể kiểm soát gồm những indicator nào.

### Manifest probe cho app Java khởi động chậm
~~~yaml
containers:
  - name: payment
    image: harbor.bank.local/core/payment:1.4.7
    ports: [{ containerPort: 8080 }]
    startupProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      periodSeconds: 5
      timeoutSeconds: 2
      failureThreshold: 36        # cho phép tới 5s*36 = 180s khởi động
    readinessProbe:
      httpGet: { path: /actuator/health/readiness, port: 8080 }
      periodSeconds: 5
      timeoutSeconds: 2
      failureThreshold: 3         # 3 lần fail liên tiếp -> gỡ khỏi Service
      successThreshold: 1
    livenessProbe:
      httpGet: { path: /actuator/health/liveness, port: 8080 }
      periodSeconds: 10
      timeoutSeconds: 2
      failureThreshold: 3         # chỉ restart khi treo thật sự
~~~
Công thức: thời gian khởi động tối đa = {{startupProbe.periodSeconds * failureThreshold}}. Đo thời gian start thực tế trên staging (log "Started ... in X seconds") rồi đặt dư ra (ví dụ start 60s → cho 150–180s).

### So sánh 3 probe (nhắc lại, tập trung vào sai lầm)
| Probe | Gắn endpoint nào | Fail thì | Sai lầm gây restart loop |
|---|---|---|---|
| startup | {{/health/liveness}} (nhẹ) | Restart sau khi hết ngưỡng | {{failureThreshold}} quá nhỏ so với thời gian start thực |
| readiness | {{/health/readiness}} | Gỡ khỏi Service, **không** restart | Hiếm gây restart; nhưng nếu nhầm dùng liveness endpoint có dependency nặng thì gián tiếp ảnh hưởng |
| liveness | {{/health/liveness}} (chỉ nội tại) | **Restart** container | Kiểm tra DB/Redis bên ngoài → DB chậm 30s → tất cả Pod restart đồng loạt |

### Trên production
~~~bash
kubectl describe pod payment-xxx -n payment   # Events: "Liveness probe failed", "Back-off restarting"
kubectl get pod -n payment -w                 # theo dõi RESTARTS tăng liên tục
kubectl logs payment-xxx -n payment --previous  # có lỗi app hay chỉ bị probe giết?
# Kiểm tra endpoint health từ trong pod
kubectl exec deploy/payment -n payment -- curl -s localhost:8080/actuator/health/liveness
kubectl exec deploy/payment -n payment -- curl -s localhost:8080/actuator/health/readiness
~~~
- **Sự cố restart loop điển hình:** (1) Không có startupProbe, liveness {{initialDelaySeconds}}=30s nhưng app start 90s → kubelet restart mãi, RESTARTS tăng, log bị cắt giữa chừng. (2) Liveness gọi {{/actuator/health}} (gộp, gồm DB) thay vì {{/health/liveness}} → DB quá tải/ngắt mạng một lúc → **tất cả** Pod bị restart cùng lúc → thảm hoạ dây chuyền. (3) {{timeoutSeconds}} quá nhỏ (1s) trong khi GC pause hoặc load cao làm endpoint phản hồi chậm → fail giả.
- **Nguyên tắc vàng:** liveness chỉ trả lời "tiến trình còn sống và không deadlock"; readiness trả lời "có nên gửi traffic cho tôi lúc này". Dependency ngoài (DB, dịch vụ khác) thuộc readiness, **không** thuộc liveness.

> Senior tip: Đo p99 thời gian khởi động (đến khi readiness UP) trên staging với dữ liệu thật rồi đặt startupProbe dư 2–3 lần; bật thêm metric {{application.ready.time}} và {{application.started.time}}. Với app ngân hàng kết nối nhiều hệ thống, cân nhắc tách readiness indicator: dependency "bắt buộc để phục vụ" (DB chính) ảnh hưởng readiness, dependency "phụ" (cache) thì degrade nhẹ thay vì làm Pod NotReady — nhưng phải thiết kế code chấp nhận chạy thiếu cache. Tuyệt đối không để liveness phụ thuộc DB: một lần DB bảo trì có thể kéo sập toàn bộ cụm ứng dụng.`,
    follow: [
      'Nếu app bị deadlock (thread bị treo) nhưng HTTP server vẫn trả lời health, probe có phát hiện được không? Cách nào bổ sung?',
      'Bạn sẽ cấu hình readiness group thế nào khi app phụ thuộc vừa DB chính (bắt buộc) vừa Redis cache (có thể thiếu tạm)?',
      'StartupProbe, initialDelaySeconds và failureThreshold tương tác ra sao? Khi có startupProbe thì initialDelaySeconds của liveness còn ý nghĩa không?'
    ],
    tags: ['Kubernetes', 'Probe', 'Spring Boot Actuator', 'Liveness', 'Readiness'],
    refs: [
      { type: 'doc', title: 'Kubernetes Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/' },
      { type: 'doc', title: 'Spring Boot Actuator - Kubernetes Probes', url: 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html' }
    ]
  },
  {
    id: 'devops-124',
    topic: 'devops',
    level: 'senior',
    q: 'So sánh chiến lược Deployment RollingUpdate và Recreate. Giải thích maxSurge/maxUnavailable, cách dùng rollout undo. PodDisruptionBudget (PDB) là gì và tại sao cần khi drain node bảo trì? Hãy đưa ví dụ manifest và tình huống production.',
    a: `**Tóm tắt:** RollingUpdate thay Pod cũ bằng Pod mới dần dần (mặc định), kiểm soát tốc độ bằng {{maxSurge}} (số Pod tạo thêm) và {{maxUnavailable}} (số Pod được phép thiếu); Recreate xoá hết Pod cũ rồi mới tạo Pod mới — gây downtime nhưng tránh hai version chạy song song. {{kubectl rollout undo}} quay về ReplicaSet revision trước. PodDisruptionBudget (PDB) đặt mức Pod tối thiểu phải còn khi xảy ra **voluntary disruption** (drain node, autoscaler thu hồi node), giúp bảo trì không làm sập dịch vụ.

### Hiểu nhanh
Nâng cấp một quán có 4 nhân viên phục vụ: **RollingUpdate** là cho 1 nhân viên mới vào tập việc, quen rồi mới cho 1 nhân viên cũ nghỉ — quán luôn đủ người (không downtime), nhưng có lúc nhân viên cũ và mới làm chung (hai version song song). **Recreate** là cho cả 4 nghỉ, đóng cửa dọn dẹp, rồi 4 nhân viên mới vào cùng lúc — nhanh gọn, không ai lẫn version, nhưng có lúc đóng cửa (downtime). **maxSurge** là "được thuê thêm tối đa mấy người tạm", **maxUnavailable** là "được phép thiếu tối đa mấy người". **PDB** là quy định của chủ quán: "dù sửa chữa toà nhà (drain node), lúc nào cũng phải giữ ít nhất 3 người phục vụ" — đội bảo trì không được đuổi người nếu vi phạm quy định đó.

### Thuật ngữ
- **RollingUpdate**: chiến lược cập nhật mặc định; tạo Pod mới dần, xoá Pod cũ dần, duy trì khả năng phục vụ (nếu cấu hình đúng).
- **Recreate**: xoá toàn bộ Pod cũ trước khi tạo Pod mới; chấp nhận gián đoạn.
- **maxSurge**: số Pod (hoặc %) được phép vượt quá {{replicas}} mong muốn trong lúc rollout. Ví dụ replicas=4, maxSurge=1 → tối đa 5 Pod.
- **maxUnavailable**: số Pod (hoặc %) được phép không Ready so với {{replicas}}. maxUnavailable=0 → luôn đủ replica Ready.
- **ReplicaSet revision**: Deployment giữ lịch sử ReplicaSet ({{revisionHistoryLimit}}, mặc định 10) để rollback.
- **Drain node**: {{kubectl drain}} đuổi (evict) Pod khỏi node để bảo trì/nâng cấp node — đây là **voluntary disruption** (gián đoạn có chủ đích).
- **PodDisruptionBudget (PDB)**: giới hạn số Pod bị gián đoạn đồng thời do voluntary disruption; dùng {{minAvailable}} hoặc {{maxUnavailable}}.

### So sánh chiến lược
| Tiêu chí | RollingUpdate | Recreate |
|---|---|---|
| Downtime | Không (nếu probe + cấu hình đúng) | Có (khoảng thời gian giữa xoá cũ và mới Ready) |
| Hai version song song | Có — code/DB phải tương thích ngược | Không |
| Tài nguyên tạm thêm | Cần (maxSurge) | Không cần thêm (có thể cần đủ chỗ khi tạo lại) |
| Dùng khi | API/stateless service, hầu hết trường hợp | App không hỗ trợ chạy 2 version (lock DB schema độc quyền, chiếm port/volume RWO đặc biệt), batch đơn instance, migration phá vỡ tương thích |

### Manifest: RollingUpdate có kiểm soát + PDB
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: payment, namespace: payment }
spec:
  replicas: 4
  revisionHistoryLimit: 10        # giữ 10 bản để rollback
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                 # tạo thêm tối đa 1 Pod
      maxUnavailable: 0           # luôn giữ đủ 4 Pod Ready (zero-downtime)
  selector: { matchLabels: { app: payment } }
  template:
    metadata: { labels: { app: payment } }
    spec:
      containers:
        - name: payment
          image: harbor.bank.local/core/payment:1.4.7
          readinessProbe:         # bắt buộc để maxUnavailable=0 có ý nghĩa
            httpGet: { path: /actuator/health/readiness, port: 8080 }
            periodSeconds: 5
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: payment-pdb, namespace: payment }
spec:
  minAvailable: 3                 # luôn còn ít nhất 3 Pod khi drain/evict tự nguyện
  selector: { matchLabels: { app: payment } }
~~~

### Rollout và rollback
~~~bash
kubectl apply -f deploy.yaml                    # cập nhật (tạo revision mới nếu spec đổi)
kubectl rollout status deploy/payment -n payment # chờ rollout xong / báo lỗi
kubectl rollout history deploy/payment -n payment  # xem các revision
kubectl rollout undo deploy/payment -n payment     # quay về revision ngay trước
kubectl rollout undo deploy/payment -n payment --to-revision=2  # về revision cụ thể
~~~
Lưu ý: rollout dừng ở trạng thái tiến triển thất bại (Pod mới không Ready) sau {{progressDeadlineSeconds}} (mặc định 600s) nhưng **không tự rollback** — pipeline/Argo Rollouts cần tự xử lý.

### PodDisruptionBudget khi drain node
- {{kubectl drain <node> --ignore-daemonsets}} evict các Pod để node rỗng. Nếu không có PDB, drain có thể đuổi cùng lúc nhiều Pod của một service → giảm năng lực hoặc sập.
- PDB {{minAvailable: 3}} (4 replica) nghĩa là eviction bị **từ chối** nếu làm số Pod available < 3; drain sẽ chờ (hoặc treo) cho tới khi Pod được lập lịch lại nơi khác và Ready.
- **PDB không bảo vệ khỏi involuntary disruption**: node chết đột ngột, kernel panic, OOM của node — những cái này không đi qua eviction API.
- Bẫy: PDB quá chặt ({{minAvailable}} = {{replicas}}) làm drain **không bao giờ xong**. Cân bằng: luôn chừa ít nhất 1 Pod được phép gián đoạn, hoặc dùng {{maxUnavailable: 1}}.

### Trên production
~~~bash
kubectl get pdb -n payment                        # ALLOWED DISRUPTIONS phải >= 1 khi cần drain
kubectl describe pdb payment-pdb -n payment
kubectl drain node-3 --ignore-daemonsets --delete-emptydir-data --timeout=15m
kubectl get events -n payment --sort-by=.lastTimestamp
~~~
- **Sự cố:** (1) Drain treo mãi vì PDB {{minAvailable}} = replicas (hoặc Pod còn lại không đủ node đặt) → kiểm tra {{kubectl get pdb}}, tăng node tạm hoặc nới PDB có kiểm soát. (2) Dùng Recreate cho service đang nhận traffic cao điểm → outage vài phút. (3) RollingUpdate nhưng DB migration phá vỡ tương thích → version cũ lỗi khi version mới đã migrate; phải dùng chiến lược expand-contract. (4) {{maxSurge}} lớn + cluster thiếu tài nguyên → Pod mới Pending, rollout chậm và có thể kẹt.

> Senior tip: Với service Java quan trọng, đặt {{maxUnavailable: 0}} + PDB {{maxUnavailable: 1}} (hoặc {{minAvailable: N-1}}) và **bắt buộc** readinessProbe đúng nghĩa — nếu thiếu readinessProbe, Kubernetes coi Pod "sẵn sàng" ngay khi container chạy, maxUnavailable=0 trở nên vô nghĩa. Khi bảo trì node, luôn kiểm tra {{ALLOWED DISRUPTIONS}} trước; kết hợp với Cluster Autoscaler/PDB-aware scheduling để node mới kịp nhận Pod trước khi node cũ bị đuổi hết.`,
    follow: [
      'maxSurge và maxUnavailable tương tác thế nào? Có thể đặt cả hai là 0 không, vì sao?',
      'PDB bảo vệ khỏi loại gián đoạn nào và KHÔNG bảo vệ loại nào? Cho ví dụ từng loại.',
      'Khi nào bạn chọn chiến lược blue-green hoặc canary (Argo Rollouts) thay vì RollingUpdate mặc định?'
    ],
    tags: ['Kubernetes', 'Deployment', 'RollingUpdate', 'PodDisruptionBudget', 'Rollout'],
    refs: [
      { type: 'doc', title: 'Kubernetes Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' },
      { type: 'doc', title: 'Specifying a Disruption Budget for your Application', url: 'https://kubernetes.io/docs/tasks/run-application/configure-pdb/' }
    ]
  },
  {
    id: 'devops-125',
    topic: 'devops',
    level: 'mid',
    q: 'Namespace trong Kubernetes dùng để làm gì? Khi nhiều team hoặc nhiều môi trường (dev/staging/prod) dùng chung một cluster, bạn dùng Namespace kết hợp ResourceQuota và LimitRange như thế nào để cô lập và tránh team này dùng hết tài nguyên của team khác?',
    a: `**Tóm tắt:** Namespace là cách chia cluster thành nhiều "không gian" logic để nhóm tài nguyên, áp chính sách (RBAC, quota, network policy) và tránh đụng tên. **ResourceQuota** giới hạn tổng tài nguyên/đối tượng mà một namespace được dùng (tổng CPU/RAM request, số Pod). **LimitRange** đặt mặc định và min/max cho từng Pod/container trong namespace (đặc biệt là default request/limit khi người dùng quên khai báo). Kết hợp ba thứ này giúp nhiều team/môi trường dùng chung cluster mà không "ăn hết phần" của nhau.

### Hiểu nhanh
Hãy coi cluster Kubernetes là một toà nhà văn phòng lớn. **Namespace** là chia toà nhà thành các tầng/khu vực riêng (tầng đội Thanh Toán, tầng đội Thẻ, khu staging, khu prod): mỗi khu có biển tên riêng, thẻ ra vào riêng (RBAC). **ResourceQuota** là hợp đồng thuê khu: "tầng Thanh Toán được dùng tối đa 20 CPU, 64GB RAM, 50 Pod" — dùng vượt thì không cấp thêm. **LimitRange** là nội quy từng phòng: "mỗi nhân viên (container) phải khai báo nhu cầu tối thiểu/tối đa; ai quên khai báo thì mặc định cấp 250m CPU, 512MB RAM" — tránh một phòng chiếm hết điện nước của cả tầng. Thiếu quota/limit, một team deploy nhầm vòng lặp tạo Pod có thể làm cạn tài nguyên cả cluster.

### Thuật ngữ
- **Namespace**: phạm vi logic để đặt tên và cô lập tài nguyên (Pod, Service, ConfigMap...). Một số tài nguyên là cluster-scoped (Node, PersistentVolume) không thuộc namespace. Tên DNS Service có dạng {{<svc>.<namespace>.svc.cluster.local}}.
- **RBAC (Role-Based Access Control)**: phân quyền ai được làm gì; Role/RoleBinding thường gắn theo namespace để team chỉ thao tác namespace của mình.
- **ResourceQuota**: object giới hạn tổng lượng tài nguyên ({{requests.cpu}}, {{limits.memory}}, {{pods}}, {{services.loadbalancers}}...) trong một namespace.
- **LimitRange**: object đặt ràng buộc mặc định/min/max cho từng container/Pod/PVC trong namespace ({{default}}, {{defaultRequest}}, {{max}}, {{min}}).
- **Request vs Limit**: request là phần được "đặt chỗ" để scheduler xếp Pod và để quota tính; limit là trần sử dụng thực tế (CPU bị throttle, vượt memory bị OOMKilled).

### Ví dụ: namespace + quota + limit cho team
~~~yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-payment-dev
  labels: { team: payment, env: dev }
---
apiVersion: v1
kind: ResourceQuota
metadata: { name: rq-payment-dev, namespace: team-payment-dev }
spec:
  hard:
    requests.cpu: "8"        # tổng CPU request cả namespace
    requests.memory: 16Gi
    limits.cpu: "16"         # tổng CPU limit
    limits.memory: 32Gi
    pods: "40"               # tối đa 40 Pod
    services.loadbalancers: "0"  # dev không được tạo LB public
---
apiVersion: v1
kind: LimitRange
metadata: { name: lr-payment-dev, namespace: team-payment-dev }
spec:
  limits:
    - type: Container
      default:               # limit mặc định nếu container không khai báo
        cpu: 500m
        memory: 512Mi
      defaultRequest:        # request mặc định nếu không khai báo
        cpu: 100m
        memory: 128Mi
      max:                   # trần cho mỗi container
        cpu: "2"
        memory: 2Gi
~~~
Khi namespace có ResourceQuota giới hạn CPU/memory, **mọi Pod mới bắt buộc phải khai báo** {{requests}}/{{limits}} cho container — nếu không, API server từ chối tạo Pod. LimitRange giúp tự điền mặc định để bớt phiền, nhưng đội vẫn nên khai báo rõ theo nhu cầu thật.

### Chiến lược chia namespace
| Cách chia | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| Theo môi trường | {{payment-dev}}, {{payment-staging}}, {{payment-prod}} | Rõ ràng, dễ gắn quota/policy khác nhau | Prod và non-prod chung cluster có rủi ro blast radius (nhiều tổ chức tách cluster prod riêng) |
| Theo team | {{team-payment}}, {{team-card}} | Gắn RBAC theo sở hữu | Nhiều môi trường trong một namespace dễ lẫn nếu không kỷ luật label |
| Theo team + môi trường | {{team-payment-prod}} | Cô lập rõ nhất | Nhiều namespace, cần tự động hoá |

### Trên production
~~~bash
kubectl get ns --show-labels
kubectl describe quota rq-payment-dev -n team-payment-dev   # xem Used vs Hard
kubectl describe limitrange lr-payment-dev -n team-payment-dev
kubectl get pods -n team-payment-dev
# Tạo Pod vượt quota sẽ bị lỗi: "exceeded quota: rq-payment-dev, requested: pods=1, used: pods=40, limited: pods=40"
~~~
- **Sự cố:** (1) Quên đặt LimitRange và dev không khai báo request → scheduler không có thông tin để xếp Pod hợp lý, HPA theo CPU cũng không chạy (utilization tính trên request). (2) ResourceQuota đặt quá thấp so với nhu cầu deploy (rolling update cần maxSurge tạo thêm Pod) → rollout kẹt vì không tạo được Pod mới. Tính quota chừa chỗ cho surge. (3) Dùng namespace {{default}} cho mọi thứ → khó RBAC, khó quota, dễ xoá nhầm. (4) Namespace cô lập logic nhưng **không cô lập mạng** mặc định: Pod ở namespace A vẫn gọi được Pod namespace B trừ khi có NetworkPolicy.

> Senior tip: Namespace + ResourceQuota + LimitRange là "bộ ba tối thiểu" cho cluster đa team; thêm NetworkPolicy để cô lập traffic và RBAC để cô lập quyền. Với ngân hàng, production thường tách cluster (hoặc ít nhất tách node pool) khỏi non-prod để giảm blast radius; quota nên được quản lý như code (GitOps) và đặt cảnh báo khi {{Used}} tiến gần {{Hard}} (ví dụ 80%) để kịp mở rộng trước khi rollout bị chặn giữa đêm.`,
    follow: [
      'ResourceQuota tính trên request hay trên usage thực tế? Điều này ảnh hưởng thế nào tới việc lập kế hoạch dung lượng?',
      'Namespace có cô lập mạng giữa các team không? Nếu không thì dùng gì để chặn traffic chéo?',
      'Làm sao tự động tạo bộ namespace + quota + limitrange + RBAC chuẩn mỗi khi onboard một team mới?'
    ],
    tags: ['Kubernetes', 'Namespace', 'ResourceQuota', 'LimitRange', 'Multi-tenancy'],
    refs: [
      { type: 'doc', title: 'Kubernetes Namespaces', url: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/' },
      { type: 'doc', title: 'Resource Quotas', url: 'https://kubernetes.io/docs/concepts/policy/resource-quotas/' },
      { type: 'doc', title: 'Limit Ranges', url: 'https://kubernetes.io/docs/concepts/policy/limit-range/' }
    ]
  },
  {
    id: 'devops-126',
    topic: 'devops',
    level: 'lead',
    q: 'Bạn là lead của nền tảng chạy hàng chục service Spring Boot trên Kubernetes. Hãy thiết kế bộ tiêu chuẩn triển khai: cách dùng Ingress/TLS, Helm chart chuẩn, quản lý ConfigMap/Secret, probe cho app Java, chiến lược rollout + PDB. Làm sao cân bằng tự chủ của team với guardrail của nền tảng, và bạn xử lý tình huống production (cert hết hạn, rollout gây lỗi hàng loạt, secret bị lộ) ra sao?',
    a: `**Tóm tắt:** Nền tảng chuẩn hoá "đường ray an toàn" thay vì để mỗi team tự phát minh: một Ingress controller + cert-manager quản lý TLS tập trung, một Helm chart nền (golden chart) có sẵn probe/readiness/resource/PDB hợp lý, cấu hình qua ConfigMap + secret đồng bộ từ vault (ESO), rollout {{RollingUpdate}} với {{maxUnavailable: 0}} và guardrail tự động. Lead cân bằng bằng cơ chế "mặc định an toàn, override có kiểm soát" (policy-as-code) và runbook ứng phó sự cố (cert, rollout lỗi, lộ secret). Mục tiêu: team ship nhanh mà không tự bắn vào chân.

### Hiểu nhanh
Hãy nghĩ bạn quản lý một khu chợ có 30 gian hàng (30 service). Nếu mỗi gian tự kéo điện, tự làm biển, tự giữ tiền, sẽ có người quên cầu dao, biển sai quy định, tiền để hở. Nền tảng là ban quản lý chợ: cung cấp hệ thống điện chuẩn có cầu dao tự ngắt (probe + resource limit), cổng chính có bảo vệ kiểm tra vé và camera (Ingress + TLS + WAF), két tiền chung an toàn (secret manager), và quy trình mở cửa/đóng cửa từng gian một khi sửa chữa (rolling update + PDB). Gian hàng vẫn tự quyết món bán (business logic) nhưng phải cắm vào đúng ổ điện và két chuẩn. Khi sự cố xảy ra (mất điện cổng, két bị rò rỉ), có sổ tay xử lý chung để không ai hoảng.

### Thuật ngữ
- **Golden path / golden chart**: mẫu chuẩn (Helm chart, template) mà nền tảng cung cấp; team dùng mặc định, chỉ override values được phép.
- **Policy-as-code**: chính sách hạ tầng viết thành code/máy kiểm tra được (OPA Gatekeeper, Kyverno) để chặn manifest vi phạm (thiếu probe, chạy root, thiếu resource).
- **Guardrail**: rào chắn tự động ngăn lỗi phổ biến, khác với "gate" chặn mọi thứ; guardrail tốt vẫn cho phép ngoại lệ có kiểm soát.
- **GitOps**: trạng thái mong muốn nằm trong Git; controller (Argo CD/Flux) đồng bộ vào cluster, giúp audit và rollback.
- **Drift**: khác biệt giữa trạng thái khai báo (Git/chart) và trạng thái thật (cluster) do sửa tay.
- **Blast radius**: phạm vi ảnh hưởng khi một thành phần lỗi (một service, một namespace, một node).

### Bộ tiêu chuẩn triển khai (đề xuất)
| Hạng mục | Tiêu chuẩn mặc định (golden chart) | Lý do |
|---|---|---|
| Ingress/TLS | 1 Service LoadBalancer cho ingress-nginx; mỗi app khai báo Ingress qua values; TLS do cert-manager (ClusterIssuer Let's Encrypt nội bộ/ACME hoặc CA doanh nghiệp); annotation timeout/body-size có mặc định an toàn | Tiết kiệm LB, TLS tự gia hạn, cấu hình nhất quán |
| Helm | {{helm upgrade --install --atomic --timeout}}; chart version hoá; {{helm template/diff}} trong CI; cấm {{latest}} tag | Triển khai lặp lại, rollback tự động khi fail |
| Config/Secret | ConfigMap cho cấu hình không nhạy cảm; secret thật qua External Secrets Operator từ vault; checksum annotation buộc rollout khi đổi | Không commit mật khẩu Git; cập nhật có kiểm soát |
| Probe (Java) | startupProbe đủ dài (đo p99 start), readiness {{/health/readiness}}, liveness {{/health/liveness}} (không check DB); Spring Boot Actuator bật probe | Tránh restart loop, zero-downtime thật |
| Rollout/PDB | RollingUpdate {{maxUnavailable: 0, maxSurge: 1}}, PDB {{maxUnavailable: 1}}, {{terminationGracePeriodSeconds}} > preStop + shutdown | Không rơi request khi deploy/drain |
| Tài nguyên | Bắt buộc {{requests/limits}} (LimitRange default + Kyverno bắt buộc); JVM {{MaxRAMPercentage}} 70–75% | Lập lịch đúng, tránh hàng xóm ồn/noisy neighbor |

### Cân bằng tự chủ team vs guardrail nền tảng
- **Mặc định an toàn, override có lý do:** golden chart đặt giá trị an toàn; team override qua values (replica, timeout, host). Override vượt ngưỡng (tắt liveness, chạy privileged, bỏ resource limit) bị policy chặn hoặc cần ngoại lệ có ticket + chủ sở hữu + ngày hết hạn.
- **Nền tảng sở hữu "đường ray", team sở hữu "hàng hoá":** nền tảng duy trì chart/controller/policy/quan sát; team sở hữu image, cấu hình nghiệp vụ, SLO. Tránh nền tảng thành nút thắt cổ chai bằng self-service (catalog chart, tài liệu, CI template).
- **Đo lường:** tỉ lệ service tuân thủ probe/PDB/resource, thời gian deploy, tỉ lệ rollback, số sự cố do cấu hình sai (phân loại nguyên nhân gốc).

### Xử lý tình huống production
### 1) Chứng chỉ TLS hết hạn (cert-manager lỗi)
~~~bash
kubectl get certificate -A                        # READY=False?
kubectl describe certificate shop-tls -n shop
kubectl describe certificaterequest,challenge -A  # lỗi ACME (DNS, port 80, rate limit)
kubectl logs -n cert-manager deploy/cert-manager --tail=200
~~~
- **Ngắn hạn:** nếu cert sắp/đã hết hạn gây gián đoạn, cấp cert tạm từ CA doanh nghiệp và cập nhật Secret TLS thủ công (ghi nhận drift, có thời hạn). Kiểm tra chuỗi cert: {{openssl s_client -connect shop.bank.vn:443 -servername shop.bank.vn | openssl x509 -noout -dates}}.
- **Gốc:** sửa nguyên nhân ACME (DNS chưa trỏ, firewall chặn HTTP-01, {{ClusterIssuer}} sai), xác minh cert-manager có quyền tạo solver Ingress, đặt cảnh báo "cert hết hạn trong 14/7 ngày".

### 2) Rollout gây lỗi hàng loạt (version mới hỏng)
~~~bash
kubectl rollout status deploy/payment -n payment
kubectl rollout undo deploy/payment -n payment    # quay lại revision tốt
kubectl get pods -n payment -o wide               # Pod mới CrashLoop/Error?
kubectl logs -l app=payment -n payment --tail=100 --prefix
~~~
- **Ngắn hạn:** {{rollout undo}} ngay; nếu dùng {{--atomic}} trong Helm, thất bại đã tự rollback. Giảm blast radius: tạm hạ traffic (scale/circuit breaker) nếu lỗi lan.
- **Gốc:** yêu cầu readinessProbe thực sự (đừng Ready khi chưa phục vụ được), {{progressDeadlineSeconds}} + canary/Argo Rollouts cho service rủi ro cao, smoke test sau deploy, và expand-contract cho thay đổi DB để rollback version app vẫn chạy được với schema.

### 3) Secret bị lộ (commit Git, log, dump)
- **Ngắn hạn (phút/giờ):** coi secret đã bị xâm phạm → **xoay (rotate)** credential ngay tại nguồn (đổi mật khẩu DB, thu hồi token), cập nhật vault/ESO, buộc rollout để Pod nhận secret mới. Kiểm tra truy cập bất thường.
- **Dọn dẹp:** xoá secret khỏi Git (lọc lịch sử bằng công cụ chuyên dụng), nhưng xem lịch sử đã lộ là sự thật không đảo ngược → rotate vẫn bắt buộc. Quét repo bằng secret scanning.
- **Phòng ngừa:** cấm Secret bản rõ trong Git (ESO/Sealed Secrets), pre-commit/CI secret scanning, RBAC hạn chế đọc Secret, bảo vệ actuator endpoint, encryption at-rest.

> Senior tip: Hãy coi tiêu chuẩn triển khai là **sản phẩm** của nền tảng có version, roadmap và phản hồi từ team — guardrail bị ghét thường vì nó chặn muộn và không giải thích; policy tốt chặn sớm trong CI với thông báo "sai gì, sửa thế nào". Hai chỉ số lead nên theo: (1) tỉ lệ rollout không cần can thiệp tay, (2) thời gian khôi phục (MTTR) khi cert/rollout/secret gặp sự cố. Với ngân hàng, mọi ngoại lệ bảo mật (tắt probe check, nới policy) phải có thời hạn và được audit — ngoại lệ vĩnh viễn là nợ rủi ro.`,
    follow: [
      'Bạn dùng cơ chế nào (OPA Gatekeeper hay Kyverno) để bắt buộc mọi Deployment có probe và resource limit? Trade-off là gì?',
      'Làm sao triển khai canary release (Argo Rollouts) cho service thanh toán để giảm rủi ro rollout hàng loạt?',
      'Khi một team yêu cầu ngoại lệ "tắt liveness vì app hay restart", bạn xử lý thế nào để vừa giúp họ vừa không làm hỏng guardrail?'
    ],
    tags: ['Kubernetes', 'Platform', 'Helm', 'Guardrail', 'Leadership'],
    refs: [
      { type: 'doc', title: 'Kubernetes Production Best Practices (Checklist)', url: 'https://kubernetes.io/docs/setup/best-practices/' },
      { type: 'doc', title: 'External Secrets Operator', url: 'https://external-secrets.io/latest/' },
      { type: 'doc', title: 'Argo Rollouts - Progressive Delivery', url: 'https://argoproj.github.io/rollouts/' }
    ]
  },
  {
    id: 'devops-127',
    topic: 'devops',
    level: 'lead',
    q: 'Nhiều team (Thanh toán, Thẻ, Kênh số, Dữ liệu) dùng chung một cụm Kubernetes. Bạn thiết kế quản trị (governance) thế nào: cô lập namespace và network, chiến lược ResourceQuota theo team/môi trường, quản lý Secret quy mô lớn, chuẩn Helm/GitOps và xử lý config drift? Hãy nêu mô hình vận hành và trade-off.',
    a: `**Tóm tắt:** Quản trị cụm đa team dựa trên "cô lập theo lớp + tự động hoá + audit": namespace theo team/môi trường gắn RBAC + ResourceQuota + LimitRange + NetworkPolicy mặc định từ chối chéo; Secret tập trung ở vault đồng bộ qua External Secrets Operator (mỗi team chỉ đọc đường dẫn của mình); chuẩn hoá triển khai bằng golden Helm chart và GitOps (Git là nguồn sự thật, controller đối chiếu drift). Lead định nghĩa mô hình sở hữu (ai chịu trách nhiệm gì), quy trình ngoại lệ có thời hạn, và chỉ số (quota sử dụng, vi phạm policy, drift) để quản trị bằng dữ liệu thay vì cảm tính.

### Hiểu nhanh
Cụm dùng chung giống một cao ốc văn phòng: mỗi công ty thuê một tầng (namespace) có khóa cửa riêng (RBAC), hạn mức điện nước (quota), nội quy thiết bị (LimitRange), và quy định không được tự nối dây sang tầng khác (NetworkPolicy). Két sắt của mỗi công ty nằm ở ngân hàng bên ngoài (vault), nhân viên chỉ được rút đúng chìa của tầng mình (ESO + policy). Mọi thay đổi nội thất phải gửi bản vẽ được duyệt và lưu hồ sơ (GitOps) — ai tự khoan tường (sửa tay) thì hệ thống phát hiện và báo (drift). Ban quản lý toà nhà (platform team) đặt luật chung và cho thuê tự phục vụ; từng công ty chịu trách nhiệm hoạt động bên trong tầng mình.

### Thuật ngữ
- **Multi-tenancy**: nhiều "người thuê" (team) dùng chung hạ tầng; mức cô lập có thể mềm (namespace) hoặc cứng (tách cluster/node pool).
- **NetworkPolicy**: luật mạng K8s kiểm soát Pod nào được nói chuyện với Pod/địa chỉ nào (ingress/egress). Mặc định K8s **cho phép tất cả** nếu không có policy.
- **GitOps**: mọi thay đổi hạ tầng/ứng dụng qua commit Git; Argo CD/Flux liên tục reconcile (đối chiếu và áp dụng) trạng thái cluster theo Git.
- **Config drift**: trạng thái thật khác Git (do {{kubectl edit/apply}} tay, hotfix ngoài luồng). Drift làm rollback và audit không còn đáng tin.
- **Self-service**: team tự tạo/triển khai trong khuôn khổ cho phép mà không phải mở ticket chờ nền tảng thao tác tay.
- **Blast radius**: phạm vi ảnh hưởng khi lỗi/bị tấn công; tách namespace/node/cluster để thu nhỏ.

### Mô hình cô lập theo lớp
| Lớp | Cơ chế | Mục tiêu | Lưu ý |
|---|---|---|---|
| Danh tính/quyền | Namespace + RBAC (Role/RoleBinding theo team), ServiceAccount riêng | Team chỉ thao tác namespace mình | Quyền {{cluster-admin}} chỉ cho nền tảng; audit log API server |
| Tài nguyên | ResourceQuota + LimitRange + (tuỳ chọn) PriorityClass | Không team nào "đói" tài nguyên; scheduler có thông tin | Chừa quota cho surge khi rolling update |
| Mạng | NetworkPolicy mặc định deny, chỉ allow cần thiết (ingress controller → app, app → DB cho phép) | Giảm di chuyển ngang khi một Pod bị xâm nhập | Cần CNI hỗ trợ (Calico/Cilium); test kỹ kẻo chặn nhầm |
| Secret | Vault + External Secrets Operator, đường dẫn theo team ({{kv/team-payment/*}}) | Không lộ chéo, xoay khoá tập trung, audit truy cập | Pod chỉ gắn Secret nó cần; cấm đọc Secret namespace khác |
| Compute (nâng cao) | Node pool/taint theo môi trường hoặc độ nhạy cảm (prod, PCI) | Giảm blast radius phần cứng/kernel | Tốn chi phí hơn; dùng khi yêu cầu tuân thủ cao |

### Chiến lược ResourceQuota theo team/môi trường
- **Theo môi trường:** dev quota rộng về số lượng nhưng giới hạn chi phí (CPU/RAM thấp hơn, cấm LoadBalancer), staging gần prod, prod cấp theo cam kết năng lực (đo load test). Tránh prod/non-prod chung một "ổ" quota.
- **Theo team:** cấp hạn mức ban đầu (baseline) + quy trình tăng quota qua Git (pull request) có số liệu (usage, đỉnh, lý do). Đặt cảnh báo 80% {{Used/Hard}}.
- **Quota cho đối tượng:** ngoài CPU/RAM, giới hạn {{count/services.loadbalancers}}, {{count/persistentvolumeclaims}}, {{pods}} để tránh tạo tài nguyên đắt hoặc bùng nổ ngoài ý muốn.
~~~bash
kubectl get resourcequota -A
kubectl describe quota -n team-payment-prod        # Used/Hard theo từng loại
# Script/Grafana cảnh báo khi used/hard > 0.8
~~~

### Secret quy mô lớn
- Mỗi team một "không gian" trong vault (path/policy). ESO {{SecretStore/ClusterSecretStore}} + {{ExternalSecret}} tham chiếu đúng path; Git chỉ chứa tên tham chiếu, không chứa giá trị.
- **Xoay khoá:** secret có TTL/lịch xoay; sau khi xoay ở vault, ESO đồng bộ Secret K8s → cần cơ chế rollout (checksum annotation) để Pod nhận giá trị mới.
- **Cấm:** commit secret base64, chia sẻ secret giữa namespace bằng copy tay, dùng một ServiceAccount quyền đọc mọi secret. Bật audit truy cập vault và K8s Secret.

### Helm/GitOps chuẩn và chống config drift
- **Nguồn sự thật là Git:** chart + values theo môi trường nằm trong repo; Argo CD/Flux reconcile. Cấm {{kubectl apply/edit}} trực tiếp lên prod (trừ sự cố khẩn cấp có ghi nhận và backport vào Git).
- **Chống drift:** bật chế độ Argo CD tự phát hiện drift (OutOfSync) và cảnh báo; với môi trường chín, cân nhắc {{selfHeal/prune}} nhưng hiểu rủi ro (hotfix tay sẽ bị ghi đè). Luôn backport hotfix vào Git ngay.
- **Chuẩn Helm:** golden chart version hoá; team dùng chart chung, override values; quét manifest ({{kubeconform}}, {{helm template}}) và policy (Kyverno) trong CI trước merge.
~~~bash
# Argo CD: xem app lệch Git
argocd app diff payment-prod
argocd app sync payment-prod          # đồng bộ về trạng thái Git (cẩn thận)
kubectl get events -A --sort-by=.lastTimestamp | head
~~~

### Mô hình vận hành và trade-off
| Quyết định | Lợi ích | Trade-off |
|---|---|---|
| Một cluster đa namespace | Rẻ, tận dụng tài nguyên, vận hành tập trung | Blast radius lớn hơn (lỗi control plane/CNI ảnh hưởng nhiều team); noisy neighbor nếu quota/policy yếu |
| Tách cluster prod | Cô lập mạnh, rủi ro tuân thủ thấp | Chi phí và vận hành gấp đôi; phức tạp khi chia sẻ dịch vụ chung |
| NetworkPolicy deny mặc định | Bảo mật, giảm di chuyển ngang | Tốn công khai báo luồng hợp lệ; dễ chặn nhầm gây sự cố kết nối |
| GitOps self-heal | Drift bị sửa tự động, nhất quán | Hotfix khẩn cấp có thể bị ghi đè nếu quên commit Git |

### Trên production
- **Sự cố drift:** ai đó {{kubectl set image}} hotfix prod lúc 2 giờ sáng, quên commit → sáng hôm sau Argo sync/self-heal ghi đè về image cũ → tái diễn sự cố. Phòng ngừa: quy trình hotfix bắt buộc mở PR ngay, tạm tắt auto-sync có thời hạn, audit lệnh kubectl.
- **Sự cố quota:** team Thẻ rollout tăng replica đúng lúc quota đầy → Pod mới Pending, rollout kẹt nửa chừng. Kiểm tra {{kubectl describe quota}}, tạm nới có phê duyệt hoặc thu hồi tài nguyên dev; dài hạn: cảnh báo 80% và quy trình tăng quota tự phục vụ.
- **Sự cố cô lập mạng:** bật NetworkPolicy deny-all mà quên allow DNS (kube-dns/coredns port 53) → toàn bộ Pod không phân giải được tên Service. Luôn có baseline policy cho phép DNS và kiểm thử trên namespace thử nghiệm trước.

> Senior tip: Quản trị đa team thành công hay thất bại ở **đường mặc định**: nếu đường an toàn (golden chart, namespace tự cấp qua Git, secret qua ESO) dễ hơn đường tắt (sửa tay, hardcode secret), team sẽ tự tuân thủ. Đo bằng chỉ số dẫn đường: thời gian onboard team mới, tỉ lệ thay đổi đi qua Git, số vi phạm policy chặn ở CI (không phải ở prod), và tần suất drift. Với ngân hàng, hãy coi RBAC + audit + NetworkPolicy là yêu cầu tuân thủ, không phải tuỳ chọn — và diễn tập "một namespace bị xâm nhập" để kiểm chứng blast radius thực sự đã nhỏ.`,
    follow: [
      'Bạn thiết kế NetworkPolicy baseline mặc định (deny-all + allow DNS + allow ingress controller) như thế nào để không làm gãy service hiện hữu?',
      'Khi nào nên tách thành nhiều cluster thay vì tiếp tục multi-tenancy bằng namespace? Nêu ngưỡng quyết định.',
      'Làm sao xử lý hotfix khẩn cấp 2 giờ sáng trong mô hình GitOps mà không tạo drift và không làm chậm khôi phục?'
    ],
    tags: ['Kubernetes', 'Governance', 'Multi-tenancy', 'GitOps', 'Secret Management'],
    refs: [
      { type: 'doc', title: 'Kubernetes Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' },
      { type: 'doc', title: 'Argo CD Declarative GitOps', url: 'https://argo-cd.readthedocs.io/en/stable/' },
      { type: 'doc', title: 'External Secrets Operator', url: 'https://external-secrets.io/latest/' }
    ]
  },
  {
    id: 'devops-128',
    topic: 'devops',
    level: 'mid',
    q: 'StorageClass, PV và PVC trong Kubernetes hoạt động thế nào? Dynamic provisioning là gì và access modes RWO/RWX/RWOP khác nhau ra sao?',
    a: `**Tóm tắt:** Filesystem của container mất khi Pod bị tạo lại, nên dữ liệu bền vững cần volume ngoài. **PersistentVolume (PV)** là một ổ đĩa thật trong cluster (EBS, disk của cloud, NFS…); **PersistentVolumeClaim (PVC)** là Pod "xin" một ổ có dung lượng và kiểu truy cập nhất định; **StorageClass** mô tả cách **tự tạo** PV khi có PVC (dynamic provisioning) qua CSI driver. Access mode quyết định bao nhiêu node được gắn ổ cùng lúc: **RWO** (một node), **RWX** (nhiều node), **RWOP** (đúng một Pod).

### Cơ chế dynamic provisioning, từng bước
1. Bạn tạo PVC: 20Gi, {{ReadWriteOnce}}, {{storageClassName: gp3}}.
2. Controller thấy PVC chưa có PV phù hợp → gọi **CSI driver** của StorageClass (ví dụ {{ebs.csi.aws.com}}) tạo ổ mới trên cloud.
3. Một PV được tạo đại diện ổ đó và **bind** một-một với PVC.
4. Khi Pod dùng PVC được xếp lên node, kubelet gắn (attach + mount) ổ vào node rồi vào container.
~~~yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: gp3 }
provisioner: ebs.csi.aws.com
parameters: { type: gp3 }
reclaimPolicy: Retain                      # giữ ổ khi xoá PVC (dữ liệu quan trọng)
volumeBindingMode: WaitForFirstConsumer    # chờ biết node/zone của Pod rồi mới tạo ổ
allowVolumeExpansion: true
~~~
Static provisioning: admin tạo sẵn PV (ví dụ trỏ tới NFS có sẵn), PVC bind vào — dùng khi ổ đã tồn tại hoặc storage không có CSI tự tạo.

### Access modes
| Mode | Nghĩa | Ví dụ storage |
|---|---|---|
| ReadWriteOnce (RWO) | Gắn đọc-ghi trên **một node** (nhiều Pod cùng node vẫn dùng được) | EBS, Persistent Disk |
| ReadOnlyMany (ROX) | Nhiều node chỉ đọc | NFS, một số disk |
| ReadWriteMany (RWX) | Nhiều node cùng đọc-ghi | EFS, NFS, CephFS, Azure Files |
| ReadWriteOncePod (RWOP) | Đúng **một Pod** trong cả cluster (GA từ Kubernetes 1.29) | CSI hỗ trợ |
Block storage (EBS) gần như luôn chỉ RWO; cần RWX thì dùng file storage (EFS) và chấp nhận latency cao hơn.

### Reclaim policy và binding mode
- **Delete** (mặc định của nhiều StorageClass): xoá PVC là xoá luôn ổ và dữ liệu. **Retain**: giữ ổ, admin tự xử lý — dùng cho dữ liệu quan trọng.
- **WaitForFirstConsumer**: tạo ổ ở đúng zone mà Pod được xếp. Với {{Immediate}}, ổ có thể tạo ở zone A trong khi Pod chỉ xếp được ở zone B → Pod Pending vì "volume node affinity conflict" (EBS không gắn chéo zone).

### Điều tra PVC/Pod Pending
- {{kubectl describe pvc}}: sự kiện từ provisioner (sai tên StorageClass, hết quota, thiếu quyền IAM của CSI driver).
- {{kubectl describe pod}}: lỗi attach/mount, xung đột zone, ổ RWO vẫn đang gắn ở node cũ (Multi-Attach error khi Pod chuyển node mà node cũ chưa nhả ổ).

### Ví dụ đời thực
Một team chạy Elasticsearch trên EKS, StorageClass để {{volumeBindingMode: Immediate}}. Sau khi một node ở zone ap-southeast-1a chết, Pod được xếp sang 1b nhưng ổ EBS nằm ở 1a → Pod Pending 3 giờ. Đổi sang {{WaitForFirstConsumer}}, thêm topology spread cho StatefulSet và chuyển {{reclaimPolicy}} sang Retain (trước đó một lệnh xoá namespace nhầm đã xoá luôn 400GB dữ liệu ở môi trường staging). Lần node chết tiếp theo, Pod khởi động lại trong cùng zone trên node khác sau khoảng 4 phút.

### Pitfall
- Dùng reclaim Delete cho dữ liệu quan trọng.
- Nghĩ RWO là "một Pod" — thực ra là một node; muốn đúng một Pod dùng RWOP.
- Ghi dữ liệu dùng chung qua NFS RWX cho workload cần IOPS cao → chậm và khoá file khó lường.
- Quên {{allowVolumeExpansion}} → không mở rộng PVC tại chỗ được.

### Trả lời mẫu khi phỏng vấn
"Container mất filesystem khi Pod được tạo lại, nên dữ liệu bền vững phải nằm ở volume ngoài. PV là ổ thật trong cluster, PVC là yêu cầu của Pod về dung lượng và kiểu truy cập, còn StorageClass mô tả cách tự tạo PV qua CSI driver khi có PVC, đó là dynamic provisioning. Access mode RWO nghĩa là gắn đọc-ghi trên một node, RWX là nhiều node cùng ghi, cần file storage như EFS hay NFS, còn RWOP là đúng một Pod. Hai cấu hình tôi luôn kiểm tra là reclaimPolicy, Retain cho dữ liệu quan trọng để xoá PVC không mất dữ liệu, và volumeBindingMode WaitForFirstConsumer để ổ được tạo đúng zone của Pod. Tôi từng gặp Pod Pending ba giờ vì ổ EBS tạo ở zone A còn Pod chỉ xếp được ở zone B; đổi binding mode là hết."

> Senior tip: với dữ liệu quan trọng trên Kubernetes, kết hợp ba thứ: StorageClass Retain, snapshot định kỳ qua VolumeSnapshot hoặc Velero, và một lần diễn tập khôi phục mỗi quý. Mất dữ liệu trên K8s thường do xoá nhầm, không phải do ổ hỏng.`,
    follow: [
      'Khi nào chọn static provisioning thay vì dynamic?',
      'Làm sao migrate PVC sang StorageClass mới mà không downtime?',
      'Tại sao Pod bị Pending với lỗi "volume node affinity conflict"?'
    ],
    tags: ['Kubernetes', 'Storage', 'PV', 'PVC', 'StorageClass'],
    refs: [
      { type: 'doc', title: 'Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' },
      { type: 'doc', title: 'Storage Classes', url: 'https://kubernetes.io/docs/concepts/storage/storage-classes/' }
    ]
  },
  {
    id: 'devops-129',
    topic: 'devops',
    level: 'senior',
    q: 'StatefulSet là gì? Khi nào dùng StatefulSet thay vì Deployment, và có nên chạy PostgreSQL/Redis trên K8s không?',
    a: `**Tóm tắt:** StatefulSet dành cho workload mà **từng replica có danh tính riêng**: tên Pod cố định ({{db-0}}, {{db-1}}), DNS cố định qua headless Service, **PVC riêng cho mỗi Pod** (volumeClaimTemplates) và thứ tự khởi động/dừng. Deployment coi các Pod là thay thế được cho nhau. Chạy PostgreSQL/Redis trên K8s **được**, nhưng nên qua **operator** trưởng thành (CloudNativePG, Zalando, Redis operator) và chỉ khi team đủ năng lực vận hành; nếu không, dịch vụ quản lý (RDS, ElastiCache) thường rẻ hơn tính theo công người.

### StatefulSet khác Deployment ở đâu
| Tiêu chí | Deployment | StatefulSet |
|---|---|---|
| Tên Pod | Ngẫu nhiên (order-7c9f-xk2p) | Cố định theo số thứ tự (db-0, db-1) |
| Volume | Dùng chung một PVC hoặc không có | Mỗi Pod một PVC riêng, giữ nguyên khi Pod tạo lại |
| DNS | Qua Service (cân bằng tải) | Từng Pod: db-0.db-headless.ns.svc.cluster.local |
| Thứ tự | Song song | Mặc định tuần tự 0 → N khi tạo, N → 0 khi xoá |
| Cập nhật | Rolling, tạo Pod mới trước | Rolling từ số lớn nhất về 0; có partition để canary |
Headless Service ({{clusterIP: None}}) không cân bằng tải mà trả về IP từng Pod, để client biết chính xác Pod nào là primary.

~~~yaml
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: redis }
spec:
  serviceName: redis-headless     # headless Service cho DNS từng Pod
  replicas: 3
  selector: { matchLabels: { app: redis } }
  template: { metadata: { labels: { app: redis } }, spec: { containers: [ { name: redis, image: redis:7 } ] } }
  volumeClaimTemplates:           # mỗi Pod một PVC: data-redis-0, data-redis-1...
    - metadata: { name: data }
      spec: { accessModes: [ReadWriteOnce], resources: { requests: { storage: 10Gi } } }
~~~

### Những điều StatefulSet KHÔNG làm
Nó không biết replication, failover, backup hay nâng cấp phiên bản DB. Scale từ 3 xuống 2 chỉ xoá Pod {{redis-2}} (PVC vẫn giữ lại), không chuyển dữ liệu hay đổi primary. Phần "hiểu DB" do **operator** đảm nhận: tự cấu hình replication, failover, backup lên S3, nâng cấp từng node.

### Có nên chạy DB trên K8s?
| Nên cân nhắc khi | Nên dùng dịch vụ quản lý khi |
|---|---|
| Chạy on-premise, không có RDS | Đang trên cloud, team nhỏ |
| Cần nhiều DB nhỏ cho môi trường dev/test | DB production quan trọng, ít người biết vận hành |
| Team có kinh nghiệm DB + K8s, dùng operator trưởng thành | Cần cam kết sẵn sàng và backup đã được kiểm chứng |
Rủi ro thật: node bị drain khi nâng cấp cluster, Pod di chuyển phải gắn lại ổ, lỗi CSI; tuning bộ nhớ (shared_buffers vs limit), noisy neighbor.

### Ví dụ đời thực
Một công ty tự chạy PostgreSQL bằng StatefulSet viết tay (không operator) trên cluster on-premise. Khi nâng cấp node, primary {{pg-0}} bị drain; không có gì tự chuyển primary → ghi bị lỗi 18 phút cho tới khi có người tay chỉnh. Chuyển sang CloudNativePG: 3 instance, failover tự động, backup liên tục WAL lên MinIO, PodDisruptionBudget chặn drain đồng loạt. Lần nâng cấp node tiếp theo: switchover có kiểm soát mất khoảng 6 giây. Với môi trường cloud của công ty con, họ vẫn chọn RDS vì chỉ có 2 người làm hạ tầng.

### Pitfall
- Dùng Deployment cho DB với một PVC RWO → Pod mới không gắn được ổ khi Pod cũ chưa chết hẳn.
- Xoá StatefulSet nghĩ là xoá dữ liệu — PVC vẫn còn (và vẫn tính tiền); ngược lại xoá PVC là mất dữ liệu.
- Không có PodDisruptionBudget → drain node có thể đưa nhiều replica xuống cùng lúc.
- Coi StatefulSet là giải pháp HA cho DB.

### Trả lời mẫu khi phỏng vấn
"StatefulSet dùng khi từng replica có danh tính riêng. Mỗi Pod có tên cố định như db-0, db-1, có DNS riêng qua headless Service, có PVC riêng tạo từ volumeClaimTemplates và giữ nguyên khi Pod được tạo lại, và được khởi động, dừng theo thứ tự. Deployment thì coi các Pod là thay thế được cho nhau, hợp với service stateless. Điều quan trọng là StatefulSet không hiểu DB: nó không làm replication, failover hay backup. Vì vậy nếu chạy PostgreSQL hay Redis trên K8s, tôi dùng operator trưởng thành như CloudNativePG, kèm PodDisruptionBudget và backup ra object storage. Còn có nên chạy hay không thì tôi cân nhắc theo năng lực team: trên cloud với team nhỏ, RDS hay ElastiCache thường rẻ hơn khi tính công người; on-premise hoặc nhiều DB nhỏ cho dev/test thì operator rất hợp lý."

> Senior tip: trước khi chạy DB production trên K8s, diễn tập ba tình huống: drain node đang chạy primary, xoá Pod primary, và khôi phục từ backup sang cluster khác. Nếu cả ba không trơn tru, dùng dịch vụ quản lý.`,
    follow: [
      'Headless Service khác Service thường thế nào?',
      'Làm sao scale down StatefulSet mà không mất dữ liệu?',
      'Khi nào operator tốt hơn Helm chart cho DB?'
    ],
    tags: ['Kubernetes', 'StatefulSet', 'PostgreSQL', 'Redis', 'Operator'],
    refs: [
      { type: 'doc', title: 'StatefulSets', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/' },
      { type: 'doc', title: 'CloudNativePG', url: 'https://cloudnative-pg.io/' }
    ]
  },
  {
    id: 'devops-130',
    topic: 'devops',
    level: 'senior',
    q: 'RBAC trong Kubernetes: Role/ClusterRole, RoleBinding, ServiceAccount hoạt động thế nào? Quyền tối thiểu cho pipeline CI deploy vào 1 namespace là gì?',
    a: `**Tóm tắt:** RBAC của Kubernetes trả lời câu hỏi **ai** (User/Group/ServiceAccount) **được làm gì** (verb: get, list, create, patch…) **trên tài nguyên nào** (deployments, secrets…) **ở phạm vi nào** (Role trong một namespace, ClusterRole toàn cluster). Binding gắn quyền với chủ thể. Pipeline CI deploy vào một namespace cần một **ServiceAccount riêng + Role giới hạn trong namespace đó**, chỉ đủ verb để cập nhật workload — không cluster-admin, không đọc Secret nếu không cần.

### Bốn đối tượng
- **Role**: danh sách quyền trong **một namespace**.
- **ClusterRole**: quyền cho tài nguyên cấp cluster (nodes, namespaces, CRD) hoặc một bộ quyền dùng lại ở nhiều namespace.
- **RoleBinding**: gắn Role (hoặc ClusterRole) cho chủ thể **trong một namespace**.
- **ClusterRoleBinding**: gắn ClusterRole cho chủ thể **trên toàn cluster** — mạnh, dùng hạn chế.
RBAC chỉ có **cho phép** (không có deny); quyền là hợp của mọi binding.

### Quyền tối thiểu cho CI deploy vào namespace shop
~~~yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: { name: ci-deployer, namespace: shop }
rules:
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch", "patch", "update"]   # đổi image, xem rollout
  - apiGroups: [""]
    resources: ["services", "configmaps"]
    verbs: ["get", "list", "create", "patch", "update"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]                        # theo dõi rollout, không exec
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: { name: ci-deployer, namespace: shop }
subjects: [ { kind: ServiceAccount, name: ci-deployer, namespace: shop } ]
roleRef: { kind: Role, name: ci-deployer, apiGroup: rbac.authorization.k8s.io }
~~~
Không có {{secrets}}, {{pods/exec}}, {{delete}} namespace, {{roles}}/{{rolebindings}} (tránh tự nâng quyền). Nếu dùng Helm, nó cần thêm quyền với Secret (Helm lưu release dưới dạng Secret) — ghi rõ lý do.

### Kiểm tra và audit
- {{kubectl auth can-i patch deployments -n shop --as=system:serviceaccount:shop:ci-deployer}} → yes/no.
- {{kubectl auth can-i --list --as=...}} liệt kê toàn bộ quyền thực tế.
- Bật audit log của API server; lưu manifest RBAC trong Git (GitOps) để mọi thay đổi qua review.

### Token của ServiceAccount
- Từ Kubernetes 1.24, token không còn tự tạo dưới dạng Secret vĩnh viễn; Pod nhận **token có thời hạn** (projected, tự xoay vòng).
- Pod không cần gọi API thì đặt {{automountServiceAccountToken: false}} — container bị chiếm cũng không có token để gọi API.
- CI bên ngoài cluster: ưu tiên định danh qua OIDC (ví dụ GitHub Actions OIDC → IAM → EKS access entry) thay vì token dài hạn dán vào biến CI; hoặc dùng GitOps để CI không cần quyền vào cluster.

### Ví dụ đời thực
Kiểm tra bảo mật một cluster phát hiện ServiceAccount của Jenkins có ClusterRoleBinding {{cluster-admin}}, token dài hạn nằm trong biến môi trường của 60 job. Một plugin Jenkins có lỗ hổng đồng nghĩa với toàn quyền cluster, kể cả đọc Secret DB production. Thay bằng mỗi namespace một ServiceAccount với Role như trên, token ngắn hạn, sau đó chuyển hẳn sang Argo CD (CI chỉ push image và sửa Git). Số chủ thể có quyền đọc Secret production giảm từ 14 xuống 3.

### Pitfall
- Cho CI quyền {{*}} trên {{*}} "cho nhanh".
- Cho quyền tạo RoleBinding → chủ thể tự gán thêm quyền cho mình.
- Quyền {{pods/exec}} ở production → ai có nó đọc được mọi secret mà Pod thấy.
- Quên rằng quyền {{create pods}} đủ để chạy Pod dùng bất kỳ ServiceAccount nào trong namespace.

### Trả lời mẫu khi phỏng vấn
"RBAC trả lời câu hỏi ai được làm gì trên tài nguyên nào ở phạm vi nào. Role là quyền trong một namespace, ClusterRole cho tài nguyên cấp cluster hoặc bộ quyền dùng lại, RoleBinding và ClusterRoleBinding gắn quyền cho User, Group hay ServiceAccount. RBAC chỉ có cho phép, không có deny. Với pipeline CI deploy vào một namespace, tôi tạo ServiceAccount riêng và một Role trong đúng namespace đó, chỉ cho get, list, watch, patch deployments, cập nhật service và configmap, xem pod để theo dõi rollout. Không có quyền đọc secret, không exec, không tạo rolebinding để tránh tự nâng quyền. Tôi kiểm tra bằng kubectl auth can-i với as serviceaccount, và lưu RBAC trong Git để thay đổi qua review. Tốt hơn nữa là để CI không vào cluster: CI chỉ push image và sửa Git, còn Argo CD trong cluster làm việc deploy."

> Senior tip: chạy {{kubectl auth can-i --list}} cho từng ServiceAccount định kỳ và so với danh sách mong đợi. Quyền RBAC chỉ tăng theo thời gian vì ai cũng "thêm cho chạy được" mà không ai bớt.`,
    follow: [
      'Khi nào cần ClusterRole thay vì Role?',
      'Làm sao audit thay đổi RBAC?',
      'ServiceAccount token tự động mount có rủi ro gì?'
    ],
    tags: ['Kubernetes', 'RBAC', 'Security', 'CI/CD'],
    refs: [
      { type: 'doc', title: 'RBAC Authorization', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' },
      { type: 'doc', title: 'kubectl auth can-i', url: 'https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_can-i/' }
    ]
  },
  {
    id: 'devops-131',
    topic: 'devops',
    level: 'lead',
    q: 'Backup Kubernetes gồm những gì? Velero + object storage (MinIO/S3) hoạt động thế nào và diễn tập khôi phục ra sao?',
    a: `**Tóm tắt:** Backup Kubernetes gồm ba phần: **trạng thái cluster** (etcd hoặc toàn bộ manifest trong Git), **tài nguyên của ứng dụng** (Deployment, ConfigMap, Secret, CRD…) và **dữ liệu trong volume**. **Velero** sao lưu tài nguyên qua API server thành file lên object storage (S3/MinIO) và sao lưu volume bằng **snapshot** của storage hoặc **file-system backup** (Kopia). Backup chỉ có giá trị khi **đã khôi phục thử thành công** — diễn tập định kỳ sang một cluster khác và đo thời gian.

### Backup gồm những gì
| Thành phần | Cách sao lưu |
|---|---|
| Manifest ứng dụng | Git (GitOps) là nguồn chính; Velero là lưới an toàn (bắt cả thứ tạo tay) |
| etcd (cluster tự quản) | {{etcdctl snapshot save}} định kỳ, lưu ngoài cluster, mã hoá |
| Dữ liệu PV | Snapshot (CSI VolumeSnapshot, EBS snapshot) hoặc file-system backup |
| Database | Backup ở tầng DB (pg_basebackup + WAL, operator backup) — nhất quán hơn snapshot đĩa |
| Bên ngoài cluster | Secret trong vault, DNS, chứng chỉ, IAM — ghi rõ trong runbook |
Cluster quản lý (EKS/GKE/AKS) thì nhà cung cấp lo etcd; bạn lo phần còn lại.

### Velero hoạt động thế nào
1. Velero server chạy trong cluster; bạn tạo **Backup** hoặc **Schedule** (cron) chọn theo namespace/label.
2. Velero đọc tài nguyên qua API server, nén thành tarball và đẩy lên **BackupStorageLocation** (bucket S3/MinIO).
3. Với volume: gọi plugin snapshot của nhà cung cấp/CSI, hoặc dùng **file-system backup** (node agent đọc dữ liệu trong volume bằng Kopia) khi storage không có snapshot.
4. **Restore**: tạo lại tài nguyên theo thứ tự hợp lý (namespace, CRD, PVC, rồi workload); mặc định **không ghi đè** tài nguyên đã tồn tại (có tuỳ chọn {{--existing-resource-policy=update}}).
~~~bash
velero schedule create daily-shop --schedule="0 2 * * *"   --include-namespaces shop --ttl 720h          # giữ 30 ngày
velero backup describe daily-shop-20261107020000 --details
velero restore create --from-backup daily-shop-20261107020000   --namespace-mappings shop:shop-restore-test     # khôi phục sang namespace khác để kiểm tra
~~~

### Snapshot hay file-system backup
| | Snapshot | File-system backup (Kopia) |
|---|---|---|
| Tốc độ | Nhanh, ở tầng storage | Chậm hơn, đọc từng file |
| Khôi phục khác vùng/nhà cung cấp | Hạn chế (snapshot gắn với cloud/region) | Linh hoạt, dữ liệu nằm trong bucket |
| Nhất quán ứng dụng | Crash-consistent; cần hook (fsfreeze, flush DB) | Đọc khi app đang ghi → cần hook |
Velero hỗ trợ **pre/post hook** (ví dụ chạy lệnh flush/khóa ghi trước khi snapshot).

### Diễn tập khôi phục
- Mỗi quý: khôi phục bản backup mới nhất sang **cluster/namespace riêng**, chạy smoke test, kiểm tra dữ liệu (đếm dòng, checksum), ghi **thời gian khôi phục thực tế** so với RTO.
- Bucket backup: bật versioning + **object lock**, tài khoản/region khác cluster chính — chống xoá nhầm và ransomware.

### Ví dụ đời thực
Một lệnh {{kubectl delete namespace}} chạy nhầm context xoá namespace production chứa 23 deployment và 6 PVC (reclaim Delete). Velero chạy hằng đêm nhưng chưa từng thử restore: lần restore đầu thất bại vì CRD của cert-manager chưa có trên cluster và plugin snapshot thiếu quyền IAM. Khôi phục mất 5 giờ 40 phút, mất 9 giờ dữ liệu từ bản backup lúc 2 giờ sáng. Sau sự cố: backup 4 giờ một lần, DB chuyển sang backup WAL liên tục, StorageClass Retain, diễn tập hằng quý. Lần diễn tập thứ ba khôi phục toàn bộ trong 38 phút.

### Pitfall
- Backup nằm cùng tài khoản/region với cluster → mất cả hai cùng lúc.
- Chỉ backup manifest, quên dữ liệu volume (hoặc ngược lại).
- Snapshot đĩa của DB đang ghi mà không hook → khôi phục ra dữ liệu hỏng.
- Không bao giờ restore thử.

### Trả lời mẫu khi phỏng vấn
"Backup Kubernetes với tôi gồm ba phần: trạng thái cluster, tức etcd nếu tự quản lý hoặc toàn bộ manifest trong Git; tài nguyên ứng dụng; và dữ liệu trong volume. Tôi dùng Velero: nó đọc tài nguyên qua API server, đẩy lên bucket S3 hoặc MinIO theo lịch, còn volume thì dùng snapshot của storage hoặc file-system backup bằng Kopia khi cần khôi phục sang nơi khác. DB thì tôi backup ở tầng DB, như WAL liên tục, vì nhất quán hơn snapshot đĩa. Bucket backup đặt ở tài khoản và region khác, bật versioning và object lock. Quan trọng nhất là diễn tập: mỗi quý khôi phục sang một cluster hoặc namespace riêng, chạy smoke test, kiểm tra dữ liệu và đo thời gian thực tế so với RTO. Tôi từng thấy một team có backup hằng đêm nhưng lần restore đầu tiên thất bại vì thiếu CRD và quyền IAM, mất gần sáu tiếng."

> Senior tip: đưa một bước "restore vào namespace tạm và chạy smoke test" thành job tự động hằng tuần. Backup chưa được khôi phục thử thì chỉ là một file chiếm chỗ.`,
    follow: [
      'Khi nào dùng snapshot thay vì file-system backup?',
      'Làm sao backup etcd trên cluster tự quản?',
      'Velero restore có thể ghi đè resource đang tồn tại không?'
    ],
    tags: ['Kubernetes', 'Backup', 'Velero', 'Disaster Recovery'],
    refs: [
      { type: 'doc', title: 'Velero Documentation', url: 'https://velero.io/docs/' },
    ]
  },
  {
    id: 'devops-132',
    topic: 'devops',
    level: 'mid',
    q: 'DaemonSet là gì? Taints/tolerations và nodeSelector/affinity dùng để đặt agent log/monitoring ở đâu?',
    a: `**Tóm tắt:** **DaemonSet** đảm bảo **mỗi node** (hoặc mỗi node thoả điều kiện) chạy đúng một Pod — dùng cho agent cấp node: thu log (Fluent Bit), metric máy (node-exporter), mạng (CNI), bảo mật. **nodeSelector/affinity** là Pod **chủ động chọn** node; **taint/toleration** là node **từ chối** Pod trừ khi Pod chịu được taint. Agent giám sát thường cần toleration rộng để chạy cả trên node đặc biệt (GPU, control plane).

### DaemonSet vận hành ra sao
- Controller tạo một Pod cho mỗi node phù hợp; node mới vào cluster thì tự có Pod, node rời đi thì Pod bị dọn.
- Không có {{replicas}} — số Pod = số node phù hợp.
- Cập nhật kiểu {{RollingUpdate}} với {{maxUnavailable}} (mặc định 1 node mỗi lần); có thể dùng {{maxSurge}} để chạy song song Pod mới trước khi dừng Pod cũ (tránh hở log).
- Agent thường cần truy cập máy: {{hostPath}} (đọc /var/log/pods), {{hostNetwork}}, đôi khi quyền đặc biệt → phải giới hạn chặt.

### Taint và toleration
Taint gắn trên node: {{key=value:Effect}}.
| Effect | Ý nghĩa |
|---|---|
| NoSchedule | Không xếp Pod mới thiếu toleration |
| PreferNoSchedule | Tránh nếu có thể |
| NoExecute | Đuổi luôn Pod đang chạy thiếu toleration |
Ví dụ: node GPU có taint {{gpu=true:NoSchedule}} để chỉ job ML chạy trên đó. Control plane thường có taint {{node-role.kubernetes.io/control-plane:NoSchedule}}. Kubernetes cũng tự thêm taint khi node có vấn đề (not-ready, disk-pressure); DaemonSet controller tự thêm toleration cho các taint hệ thống này để agent không bị đuổi khi node gặp sự cố.

### nodeSelector và affinity
- **nodeSelector**: điều kiện bằng nhau đơn giản ({{disktype: ssd}}).
- **nodeAffinity**: biểu thức phong phú hơn, có loại **bắt buộc** ({{requiredDuringSchedulingIgnoredDuringExecution}}) và **ưu tiên** ({{preferred...}}).
- **podAntiAffinity/topologySpreadConstraints**: rải Pod của Deployment qua node/zone khác nhau (không cần cho DaemonSet vì đã một Pod mỗi node).

~~~yaml
apiVersion: apps/v1
kind: DaemonSet
metadata: { name: fluent-bit, namespace: logging }
spec:
  selector: { matchLabels: { app: fluent-bit } }
  updateStrategy: { type: RollingUpdate, rollingUpdate: { maxUnavailable: 10% } }
  template:
    metadata: { labels: { app: fluent-bit } }
    spec:
      tolerations:
        - operator: Exists            # chịu mọi taint: chạy cả node GPU, control plane
      containers:
        - name: fluent-bit
          image: fluent/fluent-bit:3.1
          resources: { requests: { cpu: 50m, memory: 64Mi }, limits: { memory: 200Mi } }
          volumeMounts: [ { name: varlog, mountPath: /var/log, readOnly: true } ]
      volumes: [ { name: varlog, hostPath: { path: /var/log } } ]
~~~

### Ví dụ đời thực
Một cluster thêm node pool GPU có taint {{nvidia.com/gpu:NoSchedule}}. Fluent Bit và node-exporter không có toleration nên không chạy trên các node mới; 3 tuần sau, job huấn luyện chết vì đầy đĩa mà không ai có log hay metric để điều tra. Thêm toleration {{operator: Exists}} cho agent giám sát, đặt request/limit hợp lý, thêm cảnh báo "số Pod DaemonSet sẵn sàng < số node". Đồng thời phát hiện Fluent Bit không có memory limit từng ăn 1,5GB khi Elasticsearch chậm — đặt limit và bật buffer ra đĩa.

### Pitfall
- Agent thiếu toleration → "điểm mù" trên node đặc biệt.
- DaemonSet không có resource request → scheduler không tính phần agent, node bị quá tải.
- Cập nhật DaemonSet {{maxUnavailable}} quá lớn → mất log trên nhiều node cùng lúc.
- Dùng toleration {{Exists}} cho workload ứng dụng thường → Pod chạy vào node control plane hoặc node đắt tiền.

### Trả lời mẫu khi phỏng vấn
"DaemonSet đảm bảo mỗi node phù hợp chạy đúng một Pod, nên dùng cho agent cấp node như Fluent Bit thu log, node-exporter, CNI. Node mới vào thì tự có Pod, không cần replicas. Để quyết định Pod chạy ở đâu có hai chiều. nodeSelector và nodeAffinity là Pod chủ động chọn node theo nhãn, có loại bắt buộc và loại ưu tiên. Taint là node từ chối Pod, chỉ Pod có toleration tương ứng mới được xếp vào, ví dụ node GPU chỉ cho job ML. Với agent giám sát, tôi thường cho toleration rộng để chạy cả trên node GPU và control plane, nếu không sẽ có điểm mù. Tôi luôn đặt resource request và limit cho agent, cập nhật rolling với maxUnavailable nhỏ, và có cảnh báo khi số Pod sẵn sàng của DaemonSet nhỏ hơn số node."

> Senior tip: thêm một cảnh báo so sánh {{kube_daemonset_status_number_ready}} với {{kube_daemonset_status_desired_number_scheduled}} cho mọi agent quan trọng. Thiếu agent trên một node là loại lỗi im lặng, chỉ lộ ra đúng lúc bạn cần log của node đó.`,
    follow: [
      'Khi nào dùng DaemonSet thay vì Deployment?',
      'Làm sao rolling update DaemonSet an toàn?',
      'Taints có ảnh hưởng đến cluster autoscaler không?'
    ],
    tags: ['Kubernetes', 'DaemonSet', 'Scheduling', 'Monitoring'],
    refs: [
      { type: 'doc', title: 'DaemonSet', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/' },
      { type: 'doc', title: 'Taints and Tolerations', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' }
    ]
  },
  {
    id: 'devops-133',
    topic: 'devops',
    level: 'senior',
    q: 'GitOps với Argo CD/Flux khác CI đẩy kubectl apply thế nào? Drift detection là gì?',
    a: `**Tóm tắt:** Với **CI push**, pipeline giữ quyền vào cluster và chạy {{kubectl apply}}/{{helm upgrade}} — trạng thái thật của cluster có thể lệch khỏi Git mà không ai biết. Với **GitOps** (Argo CD/Flux), Git là **nguồn sự thật duy nhất**; một controller **trong cluster** liên tục **kéo** Git và đưa cluster về đúng trạng thái đó. **Drift detection** là phát hiện chỗ cluster khác Git (ai đó sửa tay) và báo hoặc tự sửa lại (self-heal).

### Hai mô hình
~~~seq
title: GitOps - CI chỉ sửa Git, Argo CD kéo về cluster
actors: Dev | CI | GitRepo | ArgoCD | Cluster
Dev -> CI: merge PR vào app repo
CI -> CI: build, test, push image v1.4.2
CI -> GitRepo: sửa image tag trong repo cấu hình
ArgoCD -> GitRepo: poll / webhook: có commit mới
ArgoCD -> Cluster: apply manifest, chờ healthy
ArgoCD -> ArgoCD: so Git và cluster liên tục (drift)
~~~
| Tiêu chí | CI push | GitOps pull |
|---|---|---|
| Quyền vào cluster | CI giữ credential mạnh | Chỉ controller trong cluster |
| Trạng thái thật | Biết lúc deploy, sau đó có thể lệch | So sánh liên tục, hiển thị lệch |
| Rollback | Chạy lại pipeline cũ | {{git revert}} |
| Audit | Log pipeline | Lịch sử Git (ai, khi nào, review) |
| Nhiều cluster | Mỗi cluster một bước pipeline | ApplicationSet sinh app cho nhiều cluster |

### Drift detection hoạt động ra sao
- Argo CD render manifest từ Git (YAML, Helm, Kustomize), so với live state, trạng thái app: **Synced** hoặc **OutOfSync** kèm diff.
- {{syncPolicy.automated.selfHeal: true}}: tự apply lại khi có người sửa tay ({{kubectl edit}}); {{prune: true}}: xoá tài nguyên không còn trong Git.
- Một số trường do hệ thống khác quản lý (ví dụ {{replicas}} khi có HPA) cần đưa vào {{ignoreDifferences}}, nếu không Argo CD và HPA "giằng co" nhau.

### Secret trong GitOps
Không commit secret dạng thường. Lựa chọn: **External Secrets Operator** (đồng bộ từ AWS Secrets Manager/Vault vào Secret của K8s), **Sealed Secrets** (mã hoá bằng khoá công khai của controller, chỉ cluster giải mã được), hoặc SOPS.

### Khi nào vẫn giữ CI push
Team nhỏ, một cluster, ít service; hoặc workload tạm (môi trường preview mỗi PR) — GitOps thêm một repo và một controller cần vận hành.

### Ví dụ đời thực
Một công ty 35 service, deploy bằng Jenkins chạy {{kubectl apply}}. Trong một sự cố, kỹ sư trực sửa tay limit bộ nhớ và biến môi trường của 4 deployment; 2 tuần sau một lần deploy ghi đè ngược lại, sự cố cũ tái diễn và mất 3 giờ mới hiểu vì sao. Chuyển sang Argo CD với selfHeal và cảnh báo OutOfSync: mọi thay đổi khẩn cấp phải là commit (có thể merge nhanh), rollback bằng revert mất khoảng 2 phút, credential cluster-admin bị gỡ khỏi Jenkins. Trong quý đầu, Argo CD phát hiện 11 lần sửa tay, tất cả được chuyển thành commit hoặc bị hoàn tác.

### Pitfall
- Bật selfHeal trong khi người trực vẫn quen sửa tay → thay đổi khẩn cấp bị hoàn tác giữa sự cố; cần quy trình "commit khẩn".
- Không {{ignoreDifferences}} cho trường do HPA/operator quản lý.
- Để image tag {{latest}} → Git không phản ánh thật phiên bản đang chạy.
- Một repo cấu hình khổng lồ không phân quyền → ai cũng sửa được production.

### Trả lời mẫu khi phỏng vấn
"Với CI push, pipeline giữ quyền vào cluster và chạy kubectl apply hay helm upgrade; sau lần deploy, nếu ai đó sửa tay thì cluster lệch khỏi Git mà không ai biết. Với GitOps, Git là nguồn sự thật duy nhất: CI chỉ build, test, push image rồi sửa image tag trong repo cấu hình, còn Argo CD hoặc Flux chạy trong cluster kéo Git về và đưa cluster về đúng trạng thái đó. Drift detection là việc controller so liên tục giữa Git và cluster, đánh dấu OutOfSync kèm diff, và nếu bật selfHeal thì tự hoàn tác thay đổi tay. Lợi ích là CI không cần credential mạnh, rollback bằng git revert, audit bằng lịch sử Git. Cần lưu ý ignoreDifferences cho trường do HPA quản lý, và secret thì dùng External Secrets hoặc Sealed Secrets. Ở công ty trước, Argo CD phát hiện 11 lần sửa tay chỉ trong quý đầu."

> Senior tip: khi đưa GitOps vào, viết sẵn quy trình "thay đổi khẩn trong sự cố" (PR một dòng, một người duyệt, merge trong 5 phút). Thiếu quy trình này, người trực sẽ tắt selfHeal ngay lần sự cố đầu tiên và không bao giờ bật lại.`,
    follow: [
      'Khi nào giữ CI push cho workload đơn giản?',
      'Làm sao xử lý secret trong GitOps (Sealed Secrets/ESO)?',
      'Argo CD ApplicationSet dùng khi nào?'
    ],
    tags: ['Kubernetes', 'GitOps', 'ArgoCD', 'Flux'],
    refs: [
      { type: 'doc', title: 'Argo CD', url: 'https://argo-cd.readthedocs.io/en/stable/' },
      { type: 'doc', title: 'Flux', url: 'https://fluxcd.io/' }
    ]
  },
  {
    id: 'devops-134',
    topic: 'devops',
    level: 'lead',
    q: 'Helm chart và Kustomize khác nhau thế nào? Khi nào chọn cái nào cho Java service trên K8s?',
    a: `**Tóm tắt:** **Helm** là trình quản lý gói: chart là **template** (Go template) + {{values.yaml}}, cài thành **release** có phiên bản, nâng cấp và rollback được — hợp để **đóng gói phân phối** (chart dùng chung cho nhiều service, chart của bên thứ ba). **Kustomize** không dùng template: lấy YAML gốc (**base**) rồi áp **overlay/patch** theo môi trường — đơn giản, YAML luôn hợp lệ, có sẵn trong {{kubectl apply -k}}. Với Java service: một **chart chung** cho mọi Spring Boot service, hoặc Kustomize base + overlay khi team ít service và muốn đọc YAML thẳng.

### Helm hoạt động thế nào
- Chart: {{Chart.yaml}}, {{values.yaml}}, thư mục {{templates/}}; Helm render template với values thành manifest rồi apply.
- Release lưu lịch sử (dưới dạng Secret trong namespace); {{helm rollback}} quay về revision cũ.
- Dependency giữa chart, repository OCI để phân phối, hook (chạy job migrate trước khi nâng cấp).
~~~yaml
# templates/deployment.yaml (trích) - một chart dùng cho mọi Spring Boot service
spec:
  replicas: {{ .Values.replicas }}
  template:
    spec:
      containers:
        - name: app
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: JAVA_TOOL_OPTIONS
              value: "-XX:MaxRAMPercentage=70 {{ .Values.jvmExtraOpts }}"
          readinessProbe: { httpGet: { path: /actuator/health/readiness, port: 8080 } }
~~~

### Kustomize hoạt động thế nào
~~~text
base/                  deployment.yaml, service.yaml, kustomization.yaml
overlays/staging/      kustomization.yaml (replicas: 2, configMapGenerator)
overlays/prod/         kustomization.yaml (replicas: 6, patch tăng memory, HPA)
kubectl apply -k overlays/prod
~~~
Patch có hai kiểu: **strategic merge** (viết một phần YAML, gộp theo khoá) và **JSON 6902 patch** (thao tác op/path/value chính xác). {{configMapGenerator}} thêm hash vào tên ConfigMap → đổi cấu hình tự kích hoạt rolling restart.

### So sánh
| Tiêu chí | Helm | Kustomize |
|---|---|---|
| Cơ chế | Template + values | Base + patch, không template |
| Logic điều kiện, vòng lặp | Có (dễ bị lạm dụng) | Không (cố ý) |
| Phiên bản, rollback | Release, {{helm rollback}} | Dựa vào Git |
| Phân phối cho người khác | Rất tốt (repository) | Kém |
| Độ dễ đọc | Template dày đặc khó đọc | YAML thuần |
| Đi với Argo CD | Hỗ trợ | Hỗ trợ |
Hai cách có thể kết hợp: Kustomize có {{helmCharts}} để render chart rồi patch thêm; Argo CD render cả hai.

### Gợi ý cho Java service
- Nhiều service Spring Boot giống nhau → **một chart nội bộ** (probe Actuator, JVM options, resource, PodDisruptionBudget, ServiceMonitor) với values riêng mỗi service; sửa một chỗ áp dụng cho tất cả.
- Ít service, mỗi cái khác nhau, team muốn đọc YAML thẳng → Kustomize base + overlay theo môi trường.
- Kiểm tra trong CI: {{helm lint}}, {{helm template}} + kubeconform để validate schema, test giá trị đầu ra (helm-unittest).

### Ví dụ đời thực
Một team có 22 service Spring Boot, mỗi service tự copy một bộ YAML. Khi cần thêm {{preStop}} sleep để graceful shutdown và đổi đường dẫn readiness sang Actuator, phải sửa 22 repo, sót 5 → các service đó tiếp tục rớt request mỗi lần deploy. Chuyển sang một chart nội bộ có version: lần thay đổi tiếp theo (thêm PodDisruptionBudget) chỉ là một release chart và bump version trong 22 file values qua Renovate — xong trong một ngày, không sót service nào.

### Pitfall
- Template Helm đầy {{if}} lồng nhau → không ai đọc nổi; giữ chart đơn giản, ít tuỳ chọn.
- Đưa secret vào values.yaml commit Git.
- Kustomize overlay chồng nhiều tầng → khó biết giá trị cuối cùng; dùng {{kustomize build}} để xem.
- Nâng cấp Helm release lỗi giữa chừng để trạng thái {{pending-upgrade}} chặn các lần sau.

### Trả lời mẫu khi phỏng vấn
"Helm là trình quản lý gói: chart gồm template và values, cài thành release có phiên bản, nâng cấp và rollback được, nên rất hợp để đóng gói và phân phối, ví dụ một chart chung cho mọi service hoặc chart của bên thứ ba. Kustomize không có template: tôi viết YAML gốc làm base rồi patch theo môi trường bằng overlay, YAML luôn hợp lệ và đọc thẳng được, có sẵn trong kubectl. Với nhiều service Spring Boot giống nhau, tôi chọn một chart nội bộ đóng gói sẵn probe Actuator, JVM options, resource, PodDisruptionBudget, mỗi service chỉ có file values riêng; sửa một chỗ là áp dụng cho tất cả. Nếu ít service và mỗi cái một kiểu, Kustomize đơn giản hơn. Trong CI tôi chạy helm lint, render template rồi validate schema bằng kubeconform. Ở dự án trước, chuyển 22 service sang một chart chung giúp những thay đổi kiểu thêm preStop không còn bị sót service nào."

> Senior tip: giữ chart nội bộ như một thư viện có semantic version và changelog. Service nâng version chart như nâng một dependency, có thể từng bước, thay vì mọi service cùng đổi một lúc khi chart thay đổi.`,
    follow: [
      'Helm values secrets nên quản lý thế nào?',
      'Kustomize patches strategic merge khác JSON patch?',
      'Làm sao test Helm chart trong CI?'
    ],
    tags: ['Kubernetes', 'Helm', 'Kustomize', 'Deployment'],
    refs: [
      { type: 'doc', title: 'Helm', url: 'https://helm.sh/docs/' },
      { type: 'doc', title: 'Kustomize', url: 'https://kustomize.io/' }
    ]
  },
  {
    id: 'devops-135',
    topic: 'devops',
    level: 'lead',
    q: 'Observability trên K8s: metrics/logs/traces cho Java service triển khai thế nào? Prometheus/Grafana/Loki/Tempo hay managed?',
    a: `**Tóm tắt:** Observability trên K8s cho Java service gồm metrics (Prometheus scrape Actuator), logs (Fluent Bit → Loki, structured JSON), traces (OpenTelemetry → Tempo); managed (Datadog/CloudWatch) giảm vận hành nhưng chi phí cao; bắt đầu self-hosted metrics+logs+traceId.

### Metrics
- Spring Boot Actuator + Micrometer expose /actuator/prometheus (JVM heap/GC, thread, HTTP p95/p99, Hikari pool).
- Prometheus scrape theo ServiceMonitor (Prometheus Operator) hoặc static config.
- Grafana dashboard + Alertmanager rule theo SLO (error rate, latency).
- Giữ cardinality thấp: không label user id/request id; dùng exemplar để link trace.

### Logs
- Fluent Bit DaemonSet ship log từ node/Pod (stdout) tới Loki.
- Spring Boot log JSON (logstash-logback-encoder) với traceId/spanId để correlate.
- Loki label theo namespace/app; query LogQL.
- Retention 7-30 ngày; archive sang S3/GCS.

### Traces
- OpenTelemetry SDK trong app (otel-javaagent hoặc manual), OTLP exporter tới collector.
- Collector deploy DaemonSet/Deployment, batch + tail sampling.
- Tempo/Jaeger lưu trace; Grafana explore correlate trace ↔ log ↔ metric.

### Managed vs self-hosted
- Self-hosted: kiểm soát, chi phí infra thấp nhưng vận hành nặng (storage, retention, upgrade).
- Managed: Datadog, New Relic, CloudWatch, Grafana Cloud: nhanh, tích hợp nhưng chi phí theo host/log volume/MTU.
- Hybrid: self-hosted metrics/logs + managed tracing cho team nhỏ.

### Ví dụ OTel collector
~~~yaml
receivers:
  otlp:
    protocols: { grpc: { endpoint: 0.0.0.0:4317 } }
processors:
  batch: { timeout: 5s }
exporters:
  otlp/tempo: { endpoint: tempo:4317 }
service:
  pipelines:
    traces: { receivers: [otlp], processors: [batch], exporters: [otlp/tempo] }
~~~

### Trên production
- Giữ cardinality thấp (không label user id) để tránh Prometheus OOM.
- Retention: metrics 15d, logs 7-30d, traces 7d; archive cold storage.
- Alert theo SLO (burn rate), không alert noise; runbook kèm alert.
- Sampling trace (tail-based) để giữ cost.

> Senior tip: Bắt đầu với metrics + structured logs + traceId trong log; thêm distributed tracing khi có nhu cầu debug cross-service thực sự; đo cost per service.`,
    follow: [
      'Làm sao tránh cardinality explosion trong Prometheus?',
      'OpenTelemetry collector deploy thế nào trên K8s?',
      'Khi nào chọn managed observability?'
    ],
    tags: ['Kubernetes', 'Observability', 'Prometheus', 'Grafana', 'OpenTelemetry'],
    refs: [
      { type: 'doc', title: 'Prometheus', url: 'https://prometheus.io/docs/' },
      { type: 'doc', title: 'OpenTelemetry', url: 'https://opentelemetry.io/docs/' }
    ]
  }
,
  {
    id: 'devops-136',
    topic: 'devops',
    level: 'senior',
    q: 'PostgreSQL High Availability với Patroni + etcd + HAProxy hoạt động thế nào?',
    a: `**Tóm tắt:** Patroni chạy trên mỗi node Postgres, dùng etcd (DCS) để bầu leader; HAProxy health-check REST API của Patroni để route traffic tới primary hiện tại; app Java dùng JDBC multi-host với targetServerType=primary và retry.

### Vì sao cần DCS
- PostgreSQL streaming replication chỉ có primary/standby, không tự bầu leader. Khi primary chết, cần ai đó promote standby và thông báo cho app.
- DCS (Distributed Configuration Store, ví dụ etcd) là "bảng trắng" chung: node nào giữ lock /leader là primary. etcd dùng Raft, cần số node lẻ (3 hoặc 5) để quorum.

### Leader election
- Mỗi node chạy Patroni agent. Agent cố acquire lock /leader trong etcd với TTL (lease). Node giữ lock = primary; các node khác standby.
- Primary gia hạn lease định kỳ. Nếu primary chết, lease hết hạn, standby đầu tiên acquire lock và promote mình (pg_ctl promote).
- Fencing: Patroni dùng pg_ctl promote và (nếu cấu hình) STONITH để tránh split-brain. App phải reconnect.

### HAProxy health check
- HAProxy backend trỏ tới REST API Patroni (port 8008): {{GET /primary}} trả 200 chỉ trên primary, {{GET /replica}} trả 200 trên standby.
- HAProxy route write traffic tới node trả 200 cho /primary; read traffic có thể round-robin replicas.

~~~yaml
# patroni.yml (rút gọn)
scope: pgcluster
name: node1
restapi:
  listen: 0.0.0.0:8008
  connect_address: node1:8008
etcd:
  hosts: etcd1:2379,etcd2:2379,etcd3:2379
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
postgresql:
  listen: 0.0.0.0:5432
  data_dir: /var/lib/postgresql/data
~~~

### App Java kết nối
- JDBC URL multi-host: {{jdbc:postgresql://host1:5432,host2:5432,host3:5432/db?targetServerType=primary&loadBalanceHosts=true}}
- HikariCP: set connectionTimeout, validationTimeout; khi failover connection cũ chết, Hikari tự tạo connection mới tới host khác.
- Retry ở application layer cho transient error (PSQLException với SQLState 08xxx).

### Trên production
- Sai lầm: etcd cùng node với Postgres → mất node = mất cả DB và DCS → không failover.
- Kiểm tra: {{patronictl -c /etc/patroni.yml list}}; {{etcdctl endpoint health}}; HAProxy stats page; test failover bằng {{patronictl pause}} / kill primary.

### Ví dụ đời thực
Một ngân hàng chạy PostgreSQL 3 node với Patroni + etcd 3 node + HAProxy. Diễn tập: tắt nguồn node primary lúc 2 giờ chiều. Patroni trên primary cũ mất leader key trong etcd (TTL 30 giây), một replica giành leader key và tự promote; HAProxy kiểm tra {{/primary}} của Patroni (cổng REST 8008) mỗi 3 giây và chuyển traffic ghi sang node mới. Tổng thời gian ghi bị gián đoạn đo được khoảng 35 giây. Ứng dụng Spring Boot kết nối qua HAProxy với Hikari {{connectionTimeout}} 5 giây và retry nên chỉ khoảng 0,4% request lỗi trong cửa sổ đó. Bài học từ lần diễn tập trước: {{maximum_lag_on_failover}} để quá lớn khiến một replica tụt xa được chọn làm primary — giảm xuống để không mất dữ liệu đáng kể khi failover; bật thêm một replica đồng bộ ({{synchronous_mode}}) cho dữ liệu giao dịch.

### Trả lời mẫu khi phỏng vấn
"Patroni là agent chạy cạnh mỗi node PostgreSQL, dùng một DCS như etcd để bầu leader: node giữ leader key có TTL trong etcd là primary, phải gia hạn liên tục; mất key thì tự hạ xuống, nhờ đó tránh hai primary. Khi primary chết, key hết hạn, replica khoẻ nhất và không tụt quá ngưỡng lag sẽ giành key và promote. etcd cần ba hoặc năm node để có quorum. HAProxy đứng trước, kiểm tra REST API của Patroni ở endpoint primary để chỉ gửi traffic ghi tới node đang là primary, và có thể có cổng riêng cho đọc từ replica. Ứng dụng Java kết nối qua HAProxy, cấu hình timeout kết nối ngắn và retry có giới hạn. Tôi chọn đồng bộ hay bất đồng bộ theo yêu cầu mất dữ liệu, và luôn diễn tập failover để đo thời gian gián đoạn thật."

> Senior tip: Failover tự động chỉ an toàn khi DCS có quorum và fencing; luôn drill failover định kỳ, đo RTO thực tế (thường 30-60s) và RPO (data loss do async replication).`,
    follow: ['etcd quorum cần bao nhiêu node?', 'targetServerType=primary làm gì?', 'Làm sao tránh split-brain khi mạng phân mảnh?'],
    tags: ['PostgreSQL', 'Patroni', 'etcd', 'HAProxy', 'HA']
  }
,
  {
    id: 'devops-137',
    topic: 'devops',
    level: 'mid',
    q: 'MariaDB Galera Cluster hoạt động thế nào: replication đồng bộ, quorum, SST/IST?',
    a: `**Tóm tắt:** MariaDB Galera Cluster là **multi-primary đồng bộ (gần như)**: ghi vào node nào cũng được; khi commit, transaction được **phát (broadcast) tới mọi node** kèm write-set, mỗi node **certify** (kiểm tra xung đột) theo cùng một thứ tự toàn cục, rồi apply. Cần **số node lẻ (≥ 3)** để có **quorum** khi mạng chia cắt. Node mới hoặc tụt lại đồng bộ bằng **SST** (chép toàn bộ dữ liệu) hoặc **IST** (chỉ phần thiếu, lấy từ {{gcache}} của node khác).

### Commit diễn ra thế nào
1. Client ghi vào node A; transaction chạy cục bộ như bình thường (khoá dòng chỉ trên A).
2. Lúc COMMIT, A đóng gói **write-set** (các dòng thay đổi + khoá chính) và phát qua tầng giao tiếp nhóm với **thứ tự toàn cục** (mọi node nhận cùng thứ tự).
3. Mỗi node **certify**: write-set này có đụng dòng mà một transaction đứng trước trong thứ tự toàn cục đã sửa (và node gốc chưa thấy) không? Quyết định là **xác định** — mọi node ra cùng kết quả mà không cần hỏi nhau.
4. Qua certify: A trả OK cho client; các node khác apply bất đồng bộ (vì vậy gọi là "virtually synchronous": dữ liệu đã chắc chắn nhưng apply có thể trễ một chút). Không qua: A rollback và trả lỗi **deadlock** cho client.
Hệ quả: hai người ghi **cùng dòng trên hai node khác nhau** → một bên nhận lỗi lúc commit (certification failure), dù không có khoá nào chờ nhau.

### Quorum
- Mỗi phần mạng đếm số node mình thấy; phần có **đa số** tiếp tục là cluster chính (Primary Component), phần thiểu số chuyển sang **non-primary** và từ chối truy vấn — chống split-brain.
- 2 node đứt mạng → mỗi bên 50%, không bên nào đa số → cả cluster ngừng. Vì vậy dùng 3 node, hoặc 2 node + **garbd** (Galera Arbitrator, chỉ bỏ phiếu, không lưu dữ liệu).

### SST và IST
| | SST | IST |
|---|---|---|
| Khi nào | Node mới, hoặc tụt quá xa (gcache không còn phần thiếu) | Node vắng mặt ngắn, phần thiếu còn trong gcache |
| Dữ liệu chuyển | Toàn bộ DB | Chỉ write-set thiếu |
| Phương thức | {{mariabackup}} (không khoá donor lâu), rsync | Từ gcache của donor |
| Thời gian | DB 100GB qua mạng 1Gbps ≈ 15–30 phút trở lên | Vài giây đến vài phút |
Đặt {{gcache.size}} đủ lớn để chứa lượng ghi trong khoảng thời gian bảo trì thường gặp (ví dụ ghi 2GB/giờ, bảo trì 2 giờ → gcache ≥ 4–5GB) để node khởi động lại dùng IST thay vì SST.

### Trên production
- Ghi vào **một node** tại một thời điểm (qua ProxySQL/MaxScale) để tránh certification failure; các node khác phục vụ đọc và dự phòng.
- Mọi bảng cần **khoá chính** (InnoDB); bảng không có khoá chính replicate rất chậm hoặc gây lỗi.
- Transaction lớn (UPDATE hàng triệu dòng) → write-set khổng lồ, cả cluster chững lại; chia lô.
- Theo dõi {{wsrep_cluster_size}}, {{wsrep_cluster_status}}, {{wsrep_local_recv_queue_avg}}, {{wsrep_flow_control_paused}} (node chậm kéo cả cluster chậm theo cơ chế flow control).

### Ví dụ đời thực
Hệ thống đặt phòng chạy Galera 3 node, ứng dụng ghi round-robin vào cả 3. Giờ cao điểm có 2–3% giao dịch đặt phòng lỗi "deadlock found" dù log không có deadlock thật — đó là certification failure khi hai người đặt cùng phòng trên hai node. Chuyển sang ghi qua MaxScale vào một node chính (đọc vẫn chia đều), thêm retry cho lỗi certification: lỗi giảm còn dưới 0,05%. Đồng thời tăng {{gcache.size}} từ 128MB mặc định lên 4GB: lần vá OS tiếp theo, mỗi node quay lại bằng IST trong 40 giây thay vì SST 25 phút.

### Pitfall
- Cluster 2 node không arbitrator.
- Ghi đa node rồi ngạc nhiên vì lỗi "deadlock" lúc commit.
- gcache quá nhỏ → mỗi lần restart là một lần SST nặng, donor bị chậm.
- Một node yếu hơn (đĩa chậm) → flow control làm cả cluster chậm theo.

### Trả lời mẫu khi phỏng vấn
"Galera là cluster multi-primary đồng bộ. Transaction chạy cục bộ trên node nhận ghi; lúc commit, write-set được phát tới mọi node theo một thứ tự toàn cục, và mỗi node tự certify xem nó có xung đột với transaction đứng trước không. Vì thứ tự giống nhau nên mọi node ra cùng quyết định. Qua thì commit, không qua thì bên khởi tạo rollback và trả lỗi deadlock, nên ghi cùng dòng trên hai node sẽ có một bên lỗi lúc commit. Cluster cần số node lẻ, tối thiểu ba hoặc hai node cộng arbitrator, để phần đa số giữ quyền chính khi mạng chia cắt, còn phần thiểu số tự ngừng nhận truy vấn. Node mới hoặc tụt xa thì đồng bộ bằng SST, tức chép toàn bộ, thường bằng mariabackup; node vắng ngắn thì dùng IST lấy phần thiếu từ gcache. Thực tế tôi ghi vào một node qua ProxySQL hoặc MaxScale và đặt gcache đủ lớn để restart chỉ cần IST."

> Senior tip: tính kích thước gcache từ lượng binlog/write-set sinh ra mỗi giờ nhân với thời gian bảo trì dài nhất bạn hay làm. Đổi một tham số này thường biến mỗi lần bảo trì từ "chờ 30 phút SST" thành "vài chục giây IST".`,
    follow: ['SST mất bao lâu với DB 100GB?', 'gcache size đặt bao nhiêu?', 'Galera vs Group Replication?'],
    tags: ['MariaDB', 'Galera', 'HA', 'Replication']
  }
,
  {
    id: 'devops-138',
    topic: 'devops',
    level: 'senior',
    q: 'Redis Sentinel: quorum, failover và client (Lettuce/Redisson) tự phát hiện master mới?',
    a: `**Tóm tắt:** Redis Sentinel là nhóm tiến trình **giám sát + tự failover** cho mô hình một master nhiều replica. Mỗi Sentinel ping master; khi đủ **quorum** Sentinel cùng thấy master "chết" (ODOWN), các Sentinel **bầu một leader** bằng **đa số**, leader chọn replica tốt nhất, promote nó và cấu hình lại các replica khác. Client như Lettuce/Redisson **không giữ địa chỉ master cố định** mà hỏi Sentinel và nghe thông báo đổi master để tự kết nối lại.

### Quorum và đa số — hai khái niệm khác nhau
- **quorum** (trong {{sentinel monitor mymaster 10.0.0.1 6379 2}}): số Sentinel phải đồng ý master không phản hồi để chuyển từ SDOWN (một Sentinel nghĩ là chết) sang **ODOWN** (đã đủ số đồng ý).
- **Đa số** (majority) của toàn bộ Sentinel: cần để **bầu leader** thực hiện failover. Với 3 Sentinel thì cần 2.
Vì vậy dùng **ít nhất 3 Sentinel trên 3 máy/zone khác nhau**; 2 Sentinel mất một cái là không còn đa số để failover.

### Failover từng bước
1. Master không trả lời quá {{down-after-milliseconds}} (ví dụ 5000) → SDOWN trên từng Sentinel.
2. Đủ quorum → ODOWN; các Sentinel bầu leader (theo epoch, kiểu Raft đơn giản).
3. Leader chọn replica: loại replica mất kết nối lâu, ưu tiên {{replica-priority}} thấp, rồi replica có **offset replication lớn nhất** (ít mất dữ liệu nhất).
4. Gửi {{REPLICAOF NO ONE}} cho replica được chọn; các replica khác trỏ sang master mới; công bố cấu hình mới (kênh {{+switch-master}}).
5. Master cũ quay lại → bị biến thành replica của master mới.
Thời gian thường khoảng {{down-after-milliseconds}} + vài giây.

### Client tự phát hiện master mới
~~~yaml
spring:
  data:
    redis:
      sentinel:
        master: mymaster
        nodes: sentinel-1:26379,sentinel-2:26379,sentinel-3:26379
      timeout: 2s           # lệnh treo khi master chết sẽ lỗi nhanh thay vì chờ mãi
~~~
- **Lettuce** (mặc định trong Spring Boot): hỏi Sentinel địa chỉ master, theo dõi thay đổi và kết nối lại; có thể cấu hình đọc từ replica ({{ReadFrom.REPLICA_PREFERRED}}) khi chấp nhận dữ liệu hơi cũ.
- **Redisson**: {{useSentinelServers()}} với danh sách Sentinel, tự cập nhật topology.
- Trong lúc failover sẽ có vài giây lỗi → lệnh idempotent thì retry có backoff; lệnh không idempotent (INCR) cần cân nhắc.

### Mất dữ liệu khi failover
Replication của Redis là **bất đồng bộ**: ghi đã trả OK trên master nhưng chưa tới replica sẽ mất khi failover. Giảm rủi ro bằng {{min-replicas-to-write 1}} và {{min-replicas-max-lag 10}} (master từ chối ghi khi không có replica theo kịp) — đổi lại có thể từ chối ghi khi replica gặp sự cố. Lệnh {{WAIT}} cho phép chờ ghi tới N replica với thao tác quan trọng.

### Sentinel hay Redis Cluster
| | Sentinel | Redis Cluster |
|---|---|---|
| Dữ liệu | Toàn bộ trên một master | Chia 16.384 slot cho nhiều master |
| Mở rộng ghi | Không | Có |
| Failover | Do Sentinel | Do các master trong cluster bỏ phiếu |
| Client | Hỏi Sentinel | Biết bản đồ slot, xử lý MOVED/ASK |
| Hợp với | Dữ liệu vừa một máy, cần HA | Dữ liệu/lượng ghi lớn hơn một máy |

### Ví dụ đời thực
Một hệ thống session dùng 1 master + 1 replica + **2 Sentinel** đặt chung máy với Redis. Máy chứa master và một Sentinel chết: Sentinel còn lại không đủ đa số → **không failover**, đăng nhập lỗi 25 phút đến khi có người promote tay. Sửa: 3 Sentinel trên 3 zone, 2 replica, Lettuce cấu hình Sentinel với timeout 2s. Diễn tập tắt master: failover trong khoảng 7 giây, ứng dụng tự kết nối lại, chỉ khoảng 0,3% request lỗi trong lúc chuyển.

### Pitfall
- Hard-code IP master trong cấu hình ứng dụng.
- Số Sentinel chẵn hoặc đặt cùng máy với master.
- Không đặt timeout lệnh → thread treo khi master chết.
- Dùng Redis làm nguồn dữ liệu duy nhất cho thứ không được mất (ví dụ số dư) mà quên replication bất đồng bộ.

### Trả lời mẫu khi phỏng vấn
"Redis Sentinel là nhóm tiến trình giám sát và tự failover cho mô hình một master nhiều replica. Có hai ngưỡng khác nhau: quorum là số Sentinel cần đồng ý master đã chết, còn đa số toàn bộ Sentinel là để bầu leader thực hiện failover. Vì thế tôi luôn dùng ít nhất ba Sentinel trên ba zone. Leader chọn replica có độ ưu tiên phù hợp và offset replication lớn nhất, promote nó, trỏ các replica khác sang và công bố master mới. Phía Java, Lettuce trong Spring Boot cấu hình danh sách Sentinel thay vì địa chỉ master, tự hỏi master và kết nối lại khi đổi; tôi đặt timeout lệnh khoảng hai giây và retry có backoff cho lệnh idempotent. Cần nhớ replication bất đồng bộ nên có thể mất vài ghi cuối khi failover; min-replicas-to-write giảm rủi ro đó. Nếu dữ liệu hoặc lượng ghi vượt một máy thì chuyển sang Redis Cluster."

> Senior tip: diễn tập bằng {{SENTINEL FAILOVER mymaster}} trên staging và đo hai con số — thời gian ứng dụng có lỗi và số lệnh lỗi. Nếu chưa từng đo, cấu hình timeout/retry phía client gần như chắc chắn chưa đúng.`,
    follow: ['Redis Cluster failover thế nào?', 'Sentinel quorum vs cluster quorum?', 'Lettuce auto-reconnect config?'],
    tags: ['Redis', 'Sentinel', 'HA']
  }
,
  {
    id: 'devops-139',
    topic: 'devops',
    level: 'senior',
    q: 'Kafka cluster HA: replication factor, min.insync.replicas, rack awareness, KRaft quorum?',
    a: `**Tóm tắt:** Kafka HA dựa trên **replication theo partition**: mỗi partition có một **leader** và các **follower**; tập follower theo kịp gọi là **ISR**. Cấu hình chuẩn cho dữ liệu quan trọng: **replication.factor = 3**, **min.insync.replicas = 2**, producer **acks=all** — mất 1 broker vẫn đọc ghi bình thường, không mất message đã xác nhận. **Rack awareness** đặt 3 bản sao ở 3 zone. **KRaft** (bắt buộc từ Kafka 4.0) thay ZooKeeper bằng một nhóm **controller** dùng giao thức đồng thuận Raft để giữ metadata.

### Replication, ISR và acks
- Producer ghi vào leader; follower kéo dữ liệu từ leader. Follower tụt quá {{replica.lag.time.max.ms}} (mặc định 30 giây) bị loại khỏi ISR.
- {{acks=all}}: leader chỉ trả OK khi **mọi replica trong ISR** đã có message. Kết hợp {{min.insync.replicas=2}}: nếu ISR còn dưới 2, leader **từ chối ghi** ({{NotEnoughReplicasException}}) thay vì nhận ghi chỉ một bản.
- Từ Kafka 3.0, producer mặc định {{acks=all}} và {{enable.idempotence=true}} (chống trùng khi retry).

| RF / min.insync | Mất 1 broker | Mất 2 broker |
|---|---|---|
| 3 / 2 | Đọc ghi bình thường | Ghi bị từ chối, đọc vẫn được (dữ liệu an toàn) |
| 3 / 1 | Ghi bình thường | Vẫn ghi với 1 bản — mất broker đó là mất dữ liệu |
| 2 / 2 | Ghi bị từ chối | — |

### Unclean leader election
{{unclean.leader.election.enable=false}} (mặc định): chỉ replica trong ISR mới được làm leader → không mất dữ liệu đã xác nhận, nhưng partition có thể **không khả dụng** nếu mọi ISR đều chết. Bật lên thì ưu tiên sẵn sàng hơn dữ liệu — chỉ hợp với log/metric chấp nhận mất.

### Rack awareness
Đặt {{broker.rack=ap-southeast-1a}} cho từng broker → Kafka rải 3 bản sao của một partition lên 3 rack/zone khác nhau; mất cả một zone vẫn còn 2 bản. Consumer có thể đọc từ follower cùng zone ({{client.rack}} + {{replica.selector.class}}) để giảm chi phí mạng liên zone.

### KRaft
- Một nhóm controller (thường 3 hoặc 5) lưu metadata (topic, partition, ISR, cấu hình) trong một log nội bộ đồng thuận bằng Raft; một controller là leader.
- Mất controller leader → bầu lại trong vài giây; cần đa số controller còn sống.
- Lợi ích so với ZooKeeper: một hệ thống thay vì hai, failover metadata nhanh hơn, hỗ trợ số partition lớn hơn nhiều. Kafka 4.0 đã gỡ hẳn ZooKeeper.

### Ví dụ đời thực
Topic {{payment-events}} cấu hình RF=2, min.insync.replicas=1, producer acks=1 từ thời "làm nhanh". Khi nâng cấp rolling, một broker bị khởi động lại đúng lúc broker kia đang là leader với follower tụt hậu; unclean election không bật nhưng acks=1 khiến khoảng 1.900 message đã trả OK chỉ nằm trên leader cũ và mất khi nó hỏng đĩa. Đối soát thanh toán phát hiện lệch. Sửa: RF=3, min.insync.replicas=2, acks=all, rack awareness 3 zone, cảnh báo {{UnderReplicatedPartitions > 0}} và {{UnderMinIsrPartitionCount > 0}}. Các lần nâng cấp sau không mất message nào.

### Pitfall
- RF=3 nhưng min.insync.replicas=1 → vẫn có lúc chỉ ghi một bản.
- Đặt min.insync.replicas = RF → mất 1 broker là ngừng ghi.
- Topic nội bộ ({{__consumer_offsets}}, topic của Kafka Streams/Connect) để RF thấp.
- Không giám sát under-replicated partitions — chỉ biết khi đã mất dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Kafka đạt HA bằng replication theo partition: mỗi partition có leader và follower, follower theo kịp nằm trong ISR. Với dữ liệu quan trọng tôi dùng replication factor 3, min.insync.replicas 2 và producer acks=all, từ Kafka 3 thì đây cũng là mặc định của producer cùng idempotence. Như vậy leader chỉ trả OK khi ít nhất hai bản đã có message; mất một broker vẫn ghi bình thường, mất hai thì Kafka từ chối ghi chứ không nhận ghi một bản. Tôi để unclean leader election tắt để không bao giờ chọn leader thiếu dữ liệu. Rack awareness đặt ba bản sao ở ba zone, nên mất cả zone vẫn còn hai bản. Metadata thì KRaft quản lý bằng một nhóm controller đồng thuận Raft, Kafka 4 đã bỏ ZooKeeper. Tôi luôn cảnh báo khi có under-replicated hoặc under-min-ISR partition."

> Senior tip: kiểm tra định kỳ cấu hình thực tế của **mọi** topic ({{kafka-configs --describe}}) chứ không chỉ mặc định của broker. Topic được tạo tự động hoặc bởi framework thường mang RF và min.insync khác hẳn mặc định bạn tưởng.`,
    follow: ['ZooKeeper vs KRaft?', 'unclean.leader.election.enable làm gì?', 'Kafka replication lag alert?'],
    tags: ['Kafka', 'HA', 'KRaft']
  }
,
  {
    id: 'devops-140',
    topic: 'devops',
    level: 'lead',
    q: 'Elasticsearch cluster HA: master-eligible node, quorum, shard + replica, split-brain?',
    a: `**Tóm tắt:** Elasticsearch HA có hai lớp. **Lớp điều phối**: các node **master-eligible** bầu một master quản lý trạng thái cluster (index, mapping, vị trí shard) bằng **đa số** trong **voting configuration** — từ 7.x cluster tự quản lý danh sách này nên split-brain kiểu cũ không còn xảy ra nếu cấu hình đúng. **Lớp dữ liệu**: mỗi index chia thành **primary shard**, mỗi primary có **replica** đặt trên node khác (và zone khác) — mất node vẫn đọc ghi được, replica được dựng lại tự động.

### Master và quorum
- Dùng **3 node master-eligible chuyên dụng** (không chứa dữ liệu, cấu hình nhỏ) ở 3 zone; mất 1 vẫn còn đa số 2/3.
- Elasticsearch 7+ tự điều chỉnh voting configuration khi thêm/bớt master-eligible; chỉ cần {{cluster.initial_master_nodes}} **khi khởi tạo cluster lần đầu** (rồi xoá khỏi cấu hình).
- Trước 7.x phải tự đặt {{discovery.zen.minimum_master_nodes}} = N/2 + 1; đặt sai là nguồn split-brain kinh điển — hai master, hai phiên bản dữ liệu.
- Master bận (GC dài, quá nhiều shard) → cluster chậm toàn bộ dù data node khoẻ.

### Shard và replica
- Primary shard cố định khi tạo index (đổi phải reindex/split/shrink); replica đổi lúc nào cũng được.
- Replica không bao giờ nằm cùng node với primary của nó; với **shard allocation awareness** ({{node.attr.zone}} + {{cluster.routing.allocation.awareness.attributes: zone}}) thì không cùng zone.
- Ghi: vào primary rồi đồng bộ sang replica đang hoạt động. Đọc: primary hoặc replica, nên replica cũng tăng khả năng phục vụ tìm kiếm.
- **Kích thước shard** nên khoảng 10–50GB; quá nhiều shard nhỏ làm master và heap quá tải.

### Trạng thái cluster
| Màu | Nghĩa |
|---|---|
| green | Mọi primary và replica đã được gán |
| yellow | Mọi primary có, thiếu một số replica (đang ở mức rủi ro) |
| red | Có primary chưa gán → một phần dữ liệu không đọc/ghi được |
Điều tra bằng {{GET _cluster/allocation/explain}} — cho biết vì sao shard chưa được gán (đĩa vượt watermark, quy tắc awareness, node thiếu).

### Ví dụ đời thực
Cụm log 9 node, cả 9 đều master-eligible kiêm data, 4.800 shard (đa số dưới 1GB do index theo ngày cho từng service). Mỗi lần GC dài trên node đang là master, cluster mất master 20–40 giây, ghi log bị dồn. Thiết kế lại: 3 master chuyên dụng (4GB heap) ở 3 zone, data node riêng, chuyển sang index theo tuần với rollover theo kích thước 40GB qua ILM, số shard giảm còn khoảng 600. Sau đó không còn lần mất master nào trong 6 tháng; một zone mất điện 2 giờ, cluster chuyển yellow rồi tự về green sau khi dựng lại replica.

### Pitfall
- 2 node master-eligible: mất 1 là mất đa số, cluster ngừng.
- Để mọi node đều master-eligible trong cụm lớn → master chia tài nguyên với truy vấn nặng.
- Replica = 0 cho dữ liệu cần giữ "vì tiết kiệm" → mất node là red.
- Đĩa vượt watermark (mặc định 85%/90%/95%) → không gán shard mới, rồi index chuyển read-only.

### Trả lời mẫu khi phỏng vấn
"Tôi nhìn Elasticsearch HA ở hai lớp. Lớp điều phối là các node master-eligible bầu master bằng đa số trong voting configuration. Tôi dùng ba node master chuyên dụng ở ba zone, cấu hình nhỏ và không chứa dữ liệu, để mất một vẫn còn đa số và master không bị truy vấn nặng làm chậm. Từ bản 7 cluster tự quản lý voting configuration, chỉ cần initial_master_nodes khi khởi tạo lần đầu, nên split-brain kiểu đặt sai minimum_master_nodes ngày trước không còn. Lớp dữ liệu là primary shard và replica, replica không bao giờ cùng node với primary, và với allocation awareness theo zone thì không cùng zone. Tôi giữ shard khoảng 10 đến 50GB, dùng ILM để rollover. Khi cluster yellow hoặc red, tôi dùng allocation explain để biết vì sao shard chưa được gán, thường do watermark đĩa hoặc quy tắc awareness."

> Senior tip: theo dõi **tổng số shard trên mỗi node** và kích thước shard trung bình hằng tuần. Phần lớn sự cố master không ổn định ở các cụm log bắt nguồn từ "quá nhiều shard nhỏ", chứ không phải thiếu phần cứng.`,
    follow: ['Dedicated master node sizing?', 'Shard size khuyến nghị?', 'Cross-cluster replication?'],
    tags: ['Elasticsearch', 'HA', 'Shards']
  }
,
  {
    id: 'devops-141',
    topic: 'devops',
    level: 'senior',
    q: 'MongoDB replica set HA: primary/secondary, election, write concern, fencing?',
    a: `**Tóm tắt:** MongoDB replica set có **một primary** nhận ghi và các **secondary** sao chép bằng cách đọc **oplog** của primary. Primary mất liên lạc với đa số → các node bầu primary mới (giao thức dựa trên Raft) trong khoảng **10–12 giây**. **Write concern** quyết định một ghi được coi là xong khi nào: {{w: "majority"}} (mặc định từ MongoDB 5.0) đảm bảo ghi đã xác nhận **không bị rollback** khi failover. Primary cũ bị cô lập tự **step down** vì không còn thấy đa số — đó là cơ chế chống hai primary cùng nhận ghi.

### Replication và oplog
- Mọi thay đổi trên primary ghi vào oplog (collection có kích thước giới hạn); secondary liên tục kéo và áp dụng.
- **Oplog window** = khoảng thời gian oplog chứa được. Secondary tụt quá window phải đồng bộ lại từ đầu (initial sync) — đặt oplog đủ lớn cho bảo trì dài nhất.

### Election
- Mỗi node gửi heartbeat 2 giây/lần; không thấy primary quá {{electionTimeoutMillis}} (mặc định 10 giây) → một secondary ứng cử, cần **phiếu đa số** các node có quyền bầu.
- Node có {{priority}} cao hơn và dữ liệu mới hơn được ưu tiên; priority 0 không bao giờ làm primary (ví dụ node ở DC dự phòng).
- **Arbiter**: chỉ bỏ phiếu, không có dữ liệu. Dùng khi chỉ đủ tiền cho 2 node dữ liệu, nhưng làm {{w: "majority"}} kém hiệu quả (P-S-A mất S thì majority ghi bị treo) → khuyến nghị 3 node dữ liệu.

### Write concern và read concern
| Thiết lập | Ý nghĩa | Rủi ro |
|---|---|---|
| w: 1 | Primary ghi xong là OK | Failover có thể rollback ghi chưa tới secondary |
| w: "majority" | Đa số node đã ghi (kèm journal) | Chậm hơn vài ms; an toàn khi failover |
| readConcern "majority" | Chỉ đọc dữ liệu đã được đa số xác nhận | Không đọc phải dữ liệu sẽ bị rollback |
| readPreference secondary | Đọc từ secondary | Dữ liệu có thể cũ vài giây |

### Fencing
Primary bị chia cắt khỏi đa số **tự hạ xuống secondary** sau khi không còn liên lạc được đa số, nên phía thiểu số không chấp nhận ghi majority. Có thể có một khoảng ngắn hai node cùng nghĩ mình là primary, nhưng ghi {{w: "majority"}} vào primary cũ sẽ không thể đạt đa số → không bao giờ được xác nhận. Đó là lý do quan trọng để dùng majority cho dữ liệu quan trọng.

### Phía Java
~~~java
// Spring Data MongoDB / driver: retryable writes mặc định bật từ driver 3.6+
MongoClientSettings settings = MongoClientSettings.builder()
    .applyConnectionString(new ConnectionString(
        "mongodb://m1,m2,m3/shop?replicaSet=rs0&w=majority&retryWrites=true"))
    .readPreference(ReadPreference.primaryPreferred())
    .build();   // driver tự phát hiện primary mới sau election và retry ghi một lần
~~~

### Ví dụ đời thực
Một app đặt lịch dùng MongoDB 3 node với {{w: 1}} do "cấu hình cũ". Một lần mạng chập chờn khiến primary bị cô lập 15 giây; trong lúc đó nó vẫn nhận khoảng 300 lượt đặt lịch, sau election các ghi này bị **rollback** (lưu vào thư mục rollback, không ai để ý) — khách hàng có tin nhắn xác nhận nhưng không có lịch. Chuyển sang {{w: "majority"}} với retryWrites, cảnh báo replication lag và theo dõi thư mục rollback. Latency ghi tăng khoảng 3ms; không còn lịch "biến mất".

### Pitfall
- Kiến trúc P-S-A (có arbiter) kèm write concern majority → treo ghi khi mất một node dữ liệu.
- Đọc secondary cho luồng "vừa ghi xong đọc lại" → người dùng thấy dữ liệu cũ.
- Oplog quá nhỏ → secondary bảo trì xong phải initial sync hàng giờ.
- Chuỗi kết nối chỉ có một host → driver không tìm được primary mới.

### Trả lời mẫu khi phỏng vấn
"MongoDB replica set có một primary nhận ghi, các secondary kéo oplog của primary để sao chép. Nếu primary mất liên lạc với đa số quá khoảng 10 giây, các node bầu primary mới theo giao thức dựa trên Raft, ưu tiên node có priority cao và dữ liệu mới. Điều tôi quan tâm nhất là write concern: với dữ liệu quan trọng tôi dùng w majority, cũng là mặc định từ 5.0, để ghi đã xác nhận không bị rollback khi failover. Với w 1, primary bị cô lập vẫn nhận ghi và sau election những ghi đó bị rollback. Fencing ở đây là primary mất đa số tự step down, và ghi majority vào phía thiểu số không bao giờ được xác nhận. Tôi dùng ba node dữ liệu thay vì arbiter, chuỗi kết nối liệt kê đủ các host, bật retryWrites, và cân nhắc đọc secondary chỉ khi chấp nhận dữ liệu cũ vài giây."

> Senior tip: kiểm tra ngay write concern thực tế ở chuỗi kết nối và ở mặc định của cluster ({{getDefaultRWConcern}}). Các hệ thống tạo trước MongoDB 5.0 thường vẫn chạy w 1 mà không ai biết.`,
    follow: ['Arbiter là gì, khi nào dùng?', 'Read preference primary/secondary?', 'Sharded cluster HA?'],
    tags: ['MongoDB', 'ReplicaSet', 'HA']
  }
,
  {
    id: 'devops-142',
    topic: 'devops',
    level: 'mid',
    q: 'Thiết kế chung HA: số node lẻ, quorum, fencing và kiểm thử failover định kỳ?',
    a: `**Tóm tắt:** HA đúng nghĩa cần bốn thứ: **số node bỏ phiếu lẻ** để luôn có đa số rõ ràng, **quorum** để chỉ phía đa số được ra quyết định, **fencing** để chắc chắn node cũ thôi nhận ghi trước khi node mới thay thế, và **diễn tập failover định kỳ** để đo RTO/RPO thực tế. Thiếu bất kỳ cái nào, hệ thống "có dự phòng" vẫn có thể ngừng hoạt động hoặc tệ hơn — hỏng dữ liệu do split-brain.

### Vì sao số node lẻ
Quorum = floor(N/2) + 1.
| Số node | Quorum | Chịu được mất |
|---|---|---|
| 2 | 2 | 0 |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |
Node thứ 4 không tăng khả năng chịu lỗi so với 3, chỉ thêm chi phí và thêm một bên cần đồng ý. Với 2 site, đặt node thứ ba (hoặc một **witness/arbiter** nhẹ) ở site thứ ba để tránh tình huống 50/50.

### Quorum giải quyết vấn đề gì
Khi mạng chia cắt, mỗi bên không phân biệt được "bên kia chết" hay "đường truyền đứt". Quy tắc đơn giản: **chỉ phía thấy đa số được làm chính**; phía thiểu số tự dừng nhận ghi. Ví dụ etcd, Patroni, Kafka KRaft, MongoDB, Elasticsearch, Redis Sentinel đều theo quy tắc này.

### Fencing
Quorum quyết định ai được làm chính, nhưng node cũ có thể **chưa biết** mình đã mất vai (đang GC dài, mạng chậm) và vẫn ghi. Fencing chặn điều đó:
- **STONITH** ("bắn vào đầu node kia"): tắt nguồn qua IPMI/API cloud trước khi chuyển vai.
- **Thu hồi quyền truy cập tài nguyên**: gỡ volume, đổi quyền storage, chặn IP.
- **Fencing token**: mỗi lần đổi chủ tăng một số thứ tự; storage từ chối ghi mang token cũ.
- **Lease có hạn**: node chính phải gia hạn lock; hết hạn mà không gia hạn được thì tự dừng (watchdog).

### RTO và RPO
- **RTO** (Recovery Time Objective): tối đa bao lâu được ngừng dịch vụ.
- **RPO** (Recovery Point Objective): tối đa bao nhiêu dữ liệu được mất (tính theo thời gian).
Replication đồng bộ → RPO ≈ 0 nhưng ghi chậm hơn và phụ thuộc replica; bất đồng bộ → nhanh hơn nhưng RPO bằng độ trễ replication.

### Diễn tập failover
- Lịch định kỳ (quý), bắt đầu ở staging rồi production giờ thấp điểm, có kịch bản và người quan sát.
- Các kịch bản: tắt node chính, chia cắt mạng, làm chậm đĩa, tắt cả một zone.
- Đo: thời gian phát hiện, thời gian chuyển, lỗi phía ứng dụng, dữ liệu mất; so với RTO/RPO cam kết.
- Công cụ: Chaos Mesh, LitmusChaos (Kubernetes), AWS Fault Injection Service, Toxiproxy cho độ trễ mạng.

### Ví dụ đời thực
Một hệ thống có cụm DB 2 node "active-standby" với script failover dựa trên ping, cam kết RTO 5 phút. Lần diễn tập đầu tiên (chặn mạng giữa 2 node): cả hai cùng nhận vai chính, ứng dụng ghi vào cả hai trong 4 phút → phải đối soát thủ công. Thiết kế lại: 3 node + Patroni/etcd, fencing bằng watchdog, ứng dụng kết nối qua proxy hỏi node chính. Diễn tập lại hằng quý: RTO đo được 14–20 giây, RPO 0 (một replica đồng bộ), không còn split-brain.

### Pitfall
- Hai node tự quyết bằng ping/heartbeat lẫn nhau.
- Đặt cả ba node quorum trong cùng một zone/rack.
- Có HA trên giấy nhưng chưa từng diễn tập.
- Ứng dụng không có retry/timeout hợp lý → failover 15 giây thành sự cố 15 phút phía người dùng.

### Trả lời mẫu khi phỏng vấn
"Với tôi HA cần bốn thứ. Thứ nhất là số node bỏ phiếu lẻ, vì quorum là quá bán: ba node chịu được mất một, năm node chịu được mất hai, còn node thứ tư không tăng khả năng chịu lỗi. Hai site thì đặt thêm một witness ở site thứ ba. Thứ hai là quorum: khi mạng chia cắt, chỉ phía thấy đa số được làm chính, phía thiểu số tự dừng ghi. Thứ ba là fencing, vì node cũ có thể chưa biết mình mất vai, ví dụ đang GC dài, nên phải tắt nó, thu quyền ghi hoặc dùng fencing token và lease có hạn. Thứ tư là diễn tập định kỳ: tắt node chính, chia cắt mạng, tắt cả zone, và đo thời gian chuyển cùng lượng dữ liệu mất so với RTO, RPO cam kết. Tôi từng thấy lần diễn tập đầu tiên của một cụm hai node làm lộ split-brain, cả hai cùng nhận ghi trong bốn phút. Thiết kế lại với ba node và Patroni thì RTO đo được dưới 20 giây."

> Senior tip: mỗi lần diễn tập, ghi kết quả vào một bảng cố định (ngày, kịch bản, RTO đo được, RPO đo được, lỗi phía ứng dụng). Bảng này là bằng chứng mạnh nhất khi kiểm toán hoặc khi khách hàng hỏi về cam kết sẵn sàng.`,
    follow: ['Chaos testing tool nào?', 'RPO vs RTO khác gì?', 'Multi-region HA?'],
    tags: ['HA', 'Quorum', 'Fencing', 'Chaos']
  }
,
  {
    id: 'devops-143',
    topic: 'devops',
    level: 'lead',
    q: 'PostgreSQL vs MariaDB Galera vs MongoDB replica set: so sánh HA cho Java backend?',
    a: `**Tóm tắt:** Cả ba đều cho HA nhưng với triết lý khác nhau. **PostgreSQL + Patroni**: một primary nhận ghi, replica đồng bộ hoặc bất đồng bộ, failover tự động — đơn giản để suy luận, transaction mạnh, hợp với OLTP như thanh toán, đơn hàng. **MariaDB Galera**: mọi node nhận ghi, đồng bộ gần như tức thời — đổi lại xung đột ghi khi nhiều node cùng sửa và mọi node chậm theo node chậm nhất. **MongoDB replica set**: một primary, failover tích hợp sẵn, write concern chọn theo từng thao tác — hợp với dữ liệu dạng document, schema thay đổi nhanh. Tôi chọn theo **mô hình dữ liệu và yêu cầu nhất quán**, sau đó mới đến HA.

### So sánh
| Tiêu chí | PostgreSQL + Patroni | MariaDB Galera | MongoDB replica set |
|---|---|---|---|
| Mô hình ghi | Một primary | Nhiều primary | Một primary |
| Replication | Streaming WAL, sync/async | Certification đồng bộ | Oplog, ghi xác nhận theo write concern |
| Failover | Patroni + etcd, khoảng 10–30 giây | Không cần chuyển vai; node lỗi bị loại | Election tích hợp, khoảng 10–12 giây |
| Mất dữ liệu khi failover | 0 với sync replica; vài giây với async | 0 với ghi đã commit | 0 với w: majority |
| Xung đột ghi | Không (một chỗ ghi) | Certification failure khi ghi cùng dòng ở 2 node | Không (một chỗ ghi) |
| Mở rộng ghi | Dọc, hoặc sharding (Citus) | Không thật sự (mọi node ghi mọi thứ) | Sharded cluster |
| Hệ sinh thái Java | JPA/Hibernate, JDBC rất trưởng thành | JPA/JDBC | Spring Data MongoDB, driver |

### Khi nào chọn
- **PostgreSQL**: dữ liệu quan hệ, ràng buộc, transaction nhiều bảng, báo cáo SQL — mặc định hợp lý cho đa số backend Java.
- **Galera**: hệ thống sẵn có trên MySQL/MariaDB cần HA không phụ thuộc chuyển vai; vẫn nên **ghi vào một node** qua ProxySQL/MaxScale để tránh xung đột.
- **MongoDB**: document lồng nhau, schema thay đổi thường xuyên, đọc ghi theo một aggregate; không hợp khi cần transaction phức tạp nhiều collection thường xuyên (có hỗ trợ nhưng tốn hơn).
- Trên AWS: **Aurora PostgreSQL/MySQL** tách lưu trữ (6 bản sao trên 3 AZ) khỏi tính toán, failover thường dưới 30 giây — thường thay cho tự vận hành Patroni.

### Phía ứng dụng Java — điều chung cho cả ba
- **Kết nối qua endpoint ổn định**: HAProxy/PgBouncer theo primary, MaxScale/ProxySQL, chuỗi kết nối MongoDB liệt kê đủ host; JDBC PostgreSQL hỗ trợ nhiều host với {{targetServerType=primary}}.
- **Pool phải loại kết nối chết nhanh**: Hikari {{maxLifetime}} ngắn hơn timeout của proxy/DB, {{connectionTimeout}} vài giây; không cache DNS quá lâu (JVM {{networkaddress.cache.ttl}}).
- **Retry có kiểm soát** cho lỗi tạm thời trong lúc failover; chỉ retry thao tác idempotent hoặc cả transaction.
- **Đọc từ replica** chỉ cho truy vấn chấp nhận dữ liệu cũ vài giây.

### Ví dụ đời thực
Một nền tảng bán hàng dùng Galera 3 node, ghi round-robin; mỗi đợt khuyến mãi có 1–2% đơn lỗi "deadlock" do certification failure trên bảng tồn kho, và node có đĩa chậm kéo cả cụm chậm theo (flow control). Khi xây lại phần đơn hàng, team chọn **Aurora PostgreSQL** (một writer, hai reader): failover diễn tập đo được khoảng 25 giây, ứng dụng dùng JDBC driver AWS hỗ trợ failover nhanh. Phần catalog sản phẩm (thuộc tính khác nhau theo ngành hàng) chuyển sang MongoDB với w: majority. Đơn lỗi giờ cao điểm giảm xuống dưới 0,05%.

### Pitfall
- Chọn DB theo "HA nghe xịn" thay vì theo mô hình dữ liệu.
- Dùng Galera như multi-primary ghi tự do rồi ngạc nhiên vì lỗi deadlock.
- MongoDB với w: 1 cho dữ liệu tiền.
- Ứng dụng giữ kết nối tới primary cũ sau failover vì pool/DNS cache.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn DB trước hết theo mô hình dữ liệu và yêu cầu nhất quán, rồi mới đến HA. PostgreSQL với Patroni là một primary nhận ghi, replica đồng bộ hoặc bất đồng bộ, failover tự động qua etcd khoảng mười đến ba mươi giây; dễ suy luận, transaction mạnh, đó là lựa chọn mặc định của tôi cho OLTP như đơn hàng, thanh toán. Galera cho mọi node nhận ghi và đồng bộ gần như tức thời, nhưng ghi cùng dòng trên hai node sẽ lỗi certification, và node chậm kéo cả cụm chậm, nên thực tế tôi vẫn ghi vào một node. MongoDB replica set có election sẵn và write concern theo thao tác; dùng w majority thì không mất ghi đã xác nhận, hợp với dữ liệu dạng document. Trên AWS tôi thường dùng Aurora thay vì tự vận hành. Dù chọn gì, phía Java phải kết nối qua endpoint ổn định, pool loại kết nối chết nhanh và retry có kiểm soát lúc failover."

> Senior tip: đo **thời gian ứng dụng phục hồi** sau failover, không chỉ thời gian DB failover. DB chuyển vai trong 20 giây nhưng pool giữ kết nối chết và DNS cache 60 giây có thể biến nó thành vài phút lỗi phía người dùng.`,
    follow: ['Aurora HA khác gì?', 'Multi-region DB strategy?', 'Connection pooling với HA DB?'],
    tags: ['PostgreSQL', 'MariaDB', 'MongoDB', 'HA', 'Comparison']
  }

);
