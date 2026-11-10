/* Topic: primer — Nhập môn công nghệ cho người chưa dùng nhiều (owner: integrator). Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'primer-001',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Docker: image, container, Dockerfile là gì? Bạn đóng gói và chạy một ứng dụng Spring Boot bằng Docker thế nào?',
  a: `**Tóm tắt:**
- **Image** là "bản đóng gói" chứa ứng dụng cùng mọi thứ nó cần (JDK, thư viện, file cấu hình).
- **Container** là một **tiến trình đang chạy** được tạo từ image, cô lập với máy chủ.
- **Dockerfile** là công thức để build image.

Nhờ Docker, "chạy được trên máy tôi" sẽ chạy y hệt trên server.

### Hiểu nhanh
Image giống **hộp cơm đóng gói sẵn**: đủ cơm, thức ăn, đũa. Container là **lúc bạn mở hộp ra ăn**. Từ một mẫu hộp có thể làm ra nhiều hộp giống hệt nhau (nhiều container), ăn ở đâu cũng cùng một vị. Trước Docker, mỗi server phải tự "nấu" (cài JDK đúng bản, cấu hình đúng), nên hay lệch nhau.

### Docker giải quyết vấn đề gì
1. **Môi trường nhất quán**: dev, test, prod cùng một image, không còn lỗi "thiếu thư viện trên server".
2. **Triển khai nhanh**: tải image về rồi chạy trong vài giây, không cài đặt thủ công.
3. **Cô lập**: nhiều ứng dụng (Java 17, Java 21, Postgres) chạy chung một máy không đụng nhau.
4. Là nền tảng của **Kubernetes** (xem bài primer-002).

### Thuật ngữ
- **Layer**: mỗi lệnh trong Dockerfile tạo một lớp. Lớp không đổi được **cache** nên build lại nhanh.
- **Registry**: kho chứa image (Docker Hub, Amazon ECR…). Bạn **push** image lên, server **pull** về.
- **Tag**: nhãn phiên bản của image, ví dụ {{myapp:1.4.2}}.
- **Volume**: nơi lưu dữ liệu nằm ngoài container. Container bị xoá thì dữ liệu trong volume vẫn còn.
- **Port mapping**: nối cổng của máy chủ với cổng trong container, ví dụ {{-p 8080:8080}}.
- **Docker Compose**: file YAML khai báo nhiều container chạy cùng nhau (app + Postgres + Redis).

### Dockerfile cho Spring Boot (multi-stage)
~~~text
# Giai đoạn 1: build bằng Maven (image này nặng, chỉ dùng để build)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn -q dependency:go-offline          # tải thư viện trước: tận dụng cache layer
COPY src ./src
RUN mvn -q package -DskipTests

# Giai đoạn 2: chỉ chạy, dùng JRE nhỏ gọn
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
USER 1000                                  # không chạy bằng root
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
~~~
**Vì sao multi-stage:** image cuối không chứa Maven hay mã nguồn, nên nhỏ hơn nhiều, an toàn hơn và tải nhanh hơn.

### Chạy thử
~~~bash
docker build -t myapp:1.0 .                # build image từ Dockerfile
docker run -d -p 8080:8080 --name myapp myapp:1.0   # chạy container nền, map cổng
docker logs -f myapp                       # xem log
docker exec -it myapp sh                   # "chui" vào container để xem
docker stop myapp && docker rm myapp       # dừng và xoá container
~~~
~~~yaml
# docker-compose.yml: app + Postgres chạy cùng nhau
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes: [ "pgdata:/var/lib/postgresql/data" ]
  app:
    image: myapp:1.0
    ports: [ "8080:8080" ]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/postgres   # "db" là tên service
    depends_on: [ db ]
volumes:
  pgdata:
~~~

### Lỗi hay gặp
- **JVM không biết giới hạn RAM của container** (các bản JDK rất cũ) → bị kill vì OOM. JDK hiện đại đã nhận biết container; hãy đặt {{-XX:MaxRAMPercentage}} thay vì {{-Xmx}} cứng.
- **COPY cả thư mục trước khi tải dependency** → mỗi lần sửa code là build lại từ đầu (mất cache). Hãy COPY pom.xml trước.
- **Lưu dữ liệu trong container** (ví dụ Postgres không có volume) → xoá container là mất dữ liệu.
- **Đưa secret vào image** (ARG/ENV chứa mật khẩu) → ai pull image cũng đọc được. Hãy truyền lúc chạy, hoặc dùng secret manager.
- **Dùng tag latest trên production** → không biết đang chạy phiên bản nào, rollback khó.

### Phỏng vấn hay hỏi tiếp
- Image và container khác nhau thế nào? Container khác máy ảo (VM) ra sao? (Container dùng chung kernel của máy chủ nên nhẹ hơn VM, khởi động nhanh hơn, nhưng cô lập kém hơn.)
- Làm sao giảm kích thước image và build nhanh hơn?
- Xem thêm: các câu devops-* trong ngân hàng câu hỏi.

### Trả lời miệng 1 phút
"Docker đóng gói ứng dụng cùng toàn bộ môi trường chạy thành image. Container là một tiến trình được cô lập chạy từ image đó, nên dev, test và prod chạy y hệt nhau. Với Spring Boot, tôi viết Dockerfile multi-stage: giai đoạn đầu build bằng Maven, giai đoạn hai chỉ copy file jar vào image JRE nhỏ gọn, chạy bằng user không phải root, đặt MaxRAMPercentage để JVM tôn trọng giới hạn RAM của container. Dữ liệu cần giữ lại thì để trong volume, secret truyền lúc chạy chứ không nhúng vào image, và tag image theo phiên bản cụ thể để dễ rollback."

### Ví dụ đời thực
**Triệu chứng:** Mỗi lần đội phát triển sửa một dòng code Java và đẩy lên CI, thời gian build image Docker tăng lên ~14 phút (trước đó ~3 phút). Pipeline thường xuyên chờ lâu, làm chậm vòng phản hồi. Ổ đĩa runner CI cũng đầy nhanh vì xuất hiện nhiều layer lớn.

**Điều tra:** Xem log build thấy bước {{mvn package}} tải lại gần như toàn bộ dependency từ mạng ở mỗi lần build. Kiểm tra Dockerfile phát hiện thứ tự lệnh: {{COPY . .}} (toàn bộ mã nguồn) đặt trước {{RUN mvn -DskipTests package}}. Như vậy, bất kỳ thay đổi file nào trong thư mục cũng làm layer COPY thay đổi, khiến Docker **không dùng được cache** cho các bước phía sau, bao gồm bước tải dependency. Kiểm tra thêm: image cuối cùng dùng base image chứa cả JDK và mã nguồn, dung lượng ~780MB.

**Nguyên nhân gốc:** (1) Thứ tự layer không tối ưu: sao chép mã nguồn biến đổi thường xuyên trước khi cài dependency tương đối ổn định, phá cache layer. (2) Không dùng multi-stage build: giai đoạn runtime mang theo công cụ build và artifact thừa.

**Cách xử lý:** (1) Viết lại Dockerfile theo multi-stage: giai đoạn build COPY {{pom.xml}} (và file cấu hình build cần thiết) trước, chạy {{mvn dependency:go-offline}} hoặc bước tải dependency để tạo layer cache; sau đó mới COPY {{src}} và build jar. Giai đoạn runtime chỉ dùng image JRE nhỏ (ví dụ {{eclipse-temurin:17-jre}}), {{COPY --from=build}} đúng file jar. (2) Tạo user không phải root, đặt {{JAVA_TOOL_OPTIONS}}/{{-XX:MaxRAMPercentage}} phù hợp. (3) Thêm {{.dockerignore}} để loại {{target/}}, {{.git/}}, file không cần thiết. (4) Tag image theo phiên bản/commit, thêm bước quét lỗ hổng image (Trivy) trong CI.

**Kết quả đo được:** Khi chỉ đổi mã nguồn Java, thời gian build image giảm từ ~14 phút xuống ~2 phút 40 giây nhờ cache dependency. Dung lượng image runtime giảm từ ~780MB xuống ~210MB. Pipeline ổn định hơn, và không còn bước tải lại toàn bộ dependency trên mỗi commit.

> Senior tip: thêm bước quét lỗ hổng image (ví dụ Trivy) vào CI và chỉ cho phép deploy image đã quét. Đó là câu trả lời "bảo mật chuỗi cung ứng" mà interviewer Senior rất thích nghe.`,
  follow: ['Container khác máy ảo (VM) thế nào?', 'Làm sao giảm kích thước image Spring Boot?'],
  tags: ['Docker', 'container', 'image', 'Dockerfile', 'nhập môn']
},
{
  id: 'primer-002',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Kubernetes: Pod, Deployment, Service, Ingress là gì? Kubernetes giúp chạy ứng dụng Spring Boot trên production thế nào?',
  a: `**Tóm tắt:** Kubernetes (K8s) là hệ thống **tự động chạy, nhân bản, hồi phục và cập nhật** các container trên một cụm nhiều máy. Bạn **khai báo trạng thái mong muốn** (ví dụ "luôn có 3 bản app phiên bản 1.4"), K8s tự làm cho thực tế khớp với khai báo:
- container chết thì tạo lại;
- máy hỏng thì chuyển sang máy khác;
- có bản mới thì cập nhật dần.

### Hiểu nhanh
Docker giúp bạn có "hộp cơm" (container). Kubernetes là **người quản lý bếp ăn công nghiệp**: bạn chỉ dặn "trưa nay cần 300 suất, luôn giữ đủ trên quầy". Ông ấy tự phân bếp, hộp nào hỏng thì thay, đông khách thì nấu thêm, đổi thực đơn thì thay dần từng khay để quầy không bao giờ trống.

### Thuật ngữ
- **Cluster**: cụm máy (node) do K8s quản lý. **Control plane** là bộ não; **worker node** là nơi container chạy.
- **Pod**: đơn vị nhỏ nhất, gồm một (thường là vậy) hoặc vài container chạy chung, có IP riêng. Pod là **tạm thời**: chết đi thì pod mới có IP khác.
- **Deployment**: khai báo "chạy N bản pod từ image X", lo nhân bản và **rolling update** (thay dần từng pod).
- **Service**: địa chỉ ổn định (tên DNS) đứng trước nhóm pod, cân bằng tải giữa các pod. Kiểu thường dùng: {{ClusterIP}} (nội bộ cụm), {{LoadBalancer}} (ra ngoài qua load balancer của cloud).
- **Ingress**: cổng HTTP từ internet vào, định tuyến theo domain/path tới các Service.
- **ConfigMap / Secret**: cấu hình và bí mật tách khỏi image, inject vào pod qua biến môi trường hoặc file.
- **Probe**: K8s hỏi thăm sức khoẻ pod. **readiness** (sẵn sàng nhận traffic chưa?), **liveness** (còn sống không, nếu không thì restart), **startup** (đã khởi động xong chưa?).
- **requests / limits**: lượng CPU/RAM pod **xin đảm bảo** / **tối đa được dùng**.
- **HPA (Horizontal Pod Autoscaler)**: tự tăng giảm số pod theo CPU hoặc metric.
- **Namespace**: "thư mục" chia cụm theo team hoặc môi trường.

### Deployment + Service cho Spring Boot
~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: orders }
spec:
  replicas: 3                                 # luôn giữ 3 pod
  selector: { matchLabels: { app: orders } }
  template:
    metadata: { labels: { app: orders } }
    spec:
      containers:
        - name: app
          image: registry.example.com/orders:1.4.2
          ports: [ { containerPort: 8080 } ]
          resources:
            requests: { cpu: "500m", memory: "768Mi" }   # đảm bảo tối thiểu
            limits:   { memory: "1Gi" }                  # vượt là bị kill (OOMKilled)
          readinessProbe:                     # chưa sẵn sàng thì không nhận traffic
            httpGet: { path: /actuator/health/readiness, port: 8080 }
          livenessProbe:                      # treo thì bị restart
            httpGet: { path: /actuator/health/liveness, port: 8080 }
            initialDelaySeconds: 30
---
apiVersion: v1
kind: Service
metadata: { name: orders }
spec:
  selector: { app: orders }                   # trỏ tới các pod có label app=orders
  ports: [ { port: 80, targetPort: 8080 } ]
~~~
Các service khác trong cụm gọi app này qua {{http://orders}}, không cần biết IP của từng pod.

### Luồng một lần deploy phiên bản mới
1. CI build image {{orders:1.4.3}}, push lên registry.
2. Cập nhật image trong Deployment (kubectl, Helm hoặc GitOps như Argo CD).
3. K8s tạo pod mới, chờ **readiness** OK rồi mới chuyển traffic vào, sau đó tắt dần pod cũ.
4. Pod mới lỗi (readiness không bao giờ OK) → rollout dừng, pod cũ vẫn phục vụ; chạy {{kubectl rollout undo}} để quay lại.

~~~bash
kubectl get pods -n shop                      # xem pod
kubectl describe pod orders-7d9c -n shop      # xem sự kiện: vì sao pod lỗi
kubectl logs -f deploy/orders -n shop         # xem log
kubectl rollout status deploy/orders -n shop  # theo dõi rolling update
kubectl rollout undo deploy/orders -n shop    # quay lại bản trước
~~~

### Lỗi hay gặp
- **Liveness probe quá gắt** (gọi DB, timeout ngắn) → DB chậm một chút là K8s restart hàng loạt pod, làm sự cố tệ hơn. Liveness chỉ nên kiểm tra "JVM còn sống", để kiểm tra phụ thuộc cho readiness.
- **Không đặt requests/limits** → pod tranh tài nguyên, bị kill ngẫu nhiên; hoặc đặt limit memory thấp hơn heap JVM → **OOMKilled** liên tục.
- **App không xử lý tắt êm (graceful shutdown)** → mỗi lần deploy rơi vài request. Spring Boot có {{server.shutdown=graceful}}.
- **Để secret trong ConfigMap hay trong git** → lộ. Secret của K8s cũng chỉ mã hoá base64; production nên dùng secret manager.

### Phỏng vấn hay hỏi tiếp
- Readiness khác liveness thế nào, cấu hình sai thì hậu quả gì?
- Rolling update vs blue-green vs canary?
- Vì sao pod bị OOMKilled dù heap còn trống? (Tổng bộ nhớ của JVM gồm heap, metaspace, thread stack, direct buffer, nên có thể vượt limit.)

### Trả lời miệng 1 phút
"Kubernetes là hệ thống điều phối container: tôi khai báo trạng thái mong muốn, ví dụ Deployment 3 replica của image phiên bản 1.4, và K8s tự giữ đúng trạng thái đó, tạo lại pod chết và rolling update khi có bản mới. Pod là đơn vị chạy tạm thời; Service cho một tên DNS ổn định và cân bằng tải giữa các pod; Ingress đưa traffic HTTP từ ngoài vào. Với Spring Boot, tôi đặt requests và limits phù hợp với bộ nhớ JVM, readiness probe vào actuator readiness để chỉ nhận traffic khi sẵn sàng, liveness probe chỉ kiểm tra tiến trình còn sống, bật graceful shutdown, và cấu hình qua ConfigMap, Secret."

### Ví dụ đời thực
**Triệu chứng:** Sau khi bật autoscaling và chạy vài giờ dưới tải trung bình, một số pod của service {{order-api}} bị **OOMKilled** rồi khởi động lại liên tục ({{CrashLoopBackOff}} ngắn hạn xen kẽ). Người dùng thấy lỗi 502 ngắt quãng. Dashboard JVM trong pod cho thấy heap "chỉ" dùng khoảng 450MB trước khi chết, trong khi giới hạn bộ nhớ container đặt là 512Mi.

**Điều tra:** Xem sự kiện bằng {{kubectl describe pod <pod>}} thấy {{Last State: Terminated, Reason: OOMKilled, Exit Code: 137}}. Kiểm tra {{kubectl top pod}} và metric {{container_memory_working_set_bytes}} (Prometheus/cAdvisor) cho thấy bộ nhớ thực tế tiến sát 512Mi. Kiểm tra cách chạy JVM: container dùng image JDK 17, nhưng không đặt {{-XX:MaxRAMPercentage}}; heap mặc định chọn theo công thức cũ, cộng thêm **metaspace**, thread stack (mỗi thread vài trăm KB), bộ nhớ direct buffer (NIO), và bộ nhớ native của thư viện — tổng vượt 512Mi dù heap báo chỉ ~450MB.

**Nguyên nhân gốc:** Đặt **memory limit** container thấp hơn tổng bộ nhớ mà JVM + native thực sự cần. Kubernetes cgroups giết tiến trình khi vượt limit (OOMKilled), không phải OutOfMemoryError trong heap Java. Giới hạn 512Mi không đủ cho heap 450MB cộng các vùng nhớ ngoài heap.

**Cách xử lý:** (1) Điều chỉnh tài nguyên: đặt {{requests.memory}} sát mức dùng ổn định và {{limits.memory}} đủ dư, ví dụ 768Mi hoặc 1Gi tùy đo đạc. (2) Cấu hình JVM tôn trọng container: {{-XX:MaxRAMPercentage=70.0}} (để lại ~30% cho metaspace/thread/direct/native) và, nếu cần, giới hạn {{-XX:MaxMetaspaceSize}}, {{-Xss}}. (3) Tách probe: **liveness** chỉ kiểm tra tiến trình còn sống (ví dụ endpoint nhẹ/Actuator liveness), **readiness** dùng {{/actuator/health/readiness}} để ngừng nhận traffic khi app chưa sẵn sàng; tránh liveness gọi DB gây restart dây chuyền. (4) Bật {{server.shutdown=graceful}} và {{preStop}} hook phù hợp để giảm lỗi khi rolling update.

**Kết quả đo được:** Sau khi tăng limit lên 1Gi và đặt {{MaxRAMPercentage=70}}, trong 7 ngày không còn OOMKilled. {{container_memory_working_set_bytes}} ổn định quanh 620–700Mi dưới tải đỉnh; tỉ lệ 502 do pod restart giảm về 0 trong cửa sổ triển khai.

> Senior tip: đặt **PodDisruptionBudget** và chạy pod rải trên nhiều zone. Khi cụm nâng cấp node, nó đảm bảo không bao giờ tắt cùng lúc quá nhiều pod của bạn. Đây là chi tiết vận hành phân biệt người "đã chạy K8s thật" với người chỉ đọc tài liệu.`,
  follow: ['Readiness và liveness probe khác nhau thế nào?', 'Pod bị OOMKilled dù heap còn trống, vì sao?'],
  tags: ['Kubernetes', 'Pod', 'Deployment', 'Service', 'nhập môn']
},
{
  id: 'primer-003',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Kafka: topic, partition, offset, consumer group là gì? Vì sao các hệ thống lớn dùng Kafka, và dùng nó trong Spring Boot thế nào?',
  a: `**Tóm tắt:** Kafka là **nhật ký sự kiện phân tán**:
- Producer **ghi nối đuôi** các sự kiện vào **topic**.
- Topic được chia thành nhiều **partition** để xử lý song song.
- Mỗi sự kiện có số thứ tự **offset**.
- Consumer **đọc theo offset** và tự nhớ đã đọc tới đâu.

Sự kiện **không bị xoá khi đọc** mà giữ theo thời gian cấu hình (retention), nên nhiều hệ thống có thể đọc cùng một dòng sự kiện, kể cả đọc lại từ đầu.

### Hiểu nhanh
Hãy tưởng tượng **băng chuyền có đánh số** ở bưu điện:
- Người gửi (producer) đặt bưu kiện lên băng; mỗi bưu kiện có số thứ tự (offset).
- Bưu điện có nhiều băng chuyền song song (partition) để chạy nhanh.
- Mỗi đội nhận hàng (consumer group) có sổ ghi "đã lấy tới số bao nhiêu" ở từng băng.
- Khác với hàng đợi thường, bưu kiện **không biến mất** khi đội A lấy: đội B (thống kê) vẫn đọc được cùng các bưu kiện đó, theo sổ riêng của mình.

### Kafka giải quyết vấn đề gì
1. **Tách rời (decoupling)**: service Đặt hàng chỉ phát sự kiện {{OrderPlaced}}; Kho, Email, Thống kê tự đọc. Thêm service mới không phải sửa service Đặt hàng.
2. **Chịu tải đột biến**: giờ cao điểm sự kiện dồn vào Kafka (đệm), consumer xử lý dần.
3. **Throughput rất cao**: ghi tuần tự xuống đĩa và tận dụng page cache của hệ điều hành, xử lý hàng trăm nghìn đến hàng triệu sự kiện mỗi giây.
4. **Đọc lại được**: sửa bug consumer xong có thể đọc lại sự kiện từ một offset cũ.

### Thuật ngữ
- **Broker**: một server Kafka; cụm gồm nhiều broker.
- **Topic**: tên dòng sự kiện, ví dụ {{orders}}.
- **Partition**: một phần của topic. **Thứ tự chỉ được đảm bảo trong một partition.**
- **Key**: sự kiện cùng key (ví dụ orderId) luôn vào **cùng partition**, nên giữ đúng thứ tự cho cùng một đơn hàng.
- **Offset**: số thứ tự của sự kiện trong partition.
- **Consumer group**: nhóm consumer chia nhau các partition. Một partition chỉ giao cho **một** consumer trong group, nên số consumer xử lý song song tối đa bằng số partition.
- **Commit offset**: consumer báo "đã xử lý tới đây"; restart sẽ đọc tiếp từ đó.
- **Replication**: mỗi partition có bản sao trên nhiều broker; broker chết thì bản sao lên thay.
- **Rebalance**: khi consumer vào hoặc ra group, Kafka chia lại partition.

~~~text
Topic "orders" (3 partition)
P0: [0][1][2][3][4] ...     <- order có key K1 luôn ở đây
P1: [0][1][2] ...
P2: [0][1][2][3] ...
Group "inventory": C1 đọc P0, C2 đọc P1+P2   (mỗi partition chỉ 1 consumer)
Group "email":     C3 đọc cả 3 partition      (đọc độc lập, offset riêng)
~~~

### Dùng trong Spring Boot (Spring for Apache Kafka)
~~~java
// Producer: gửi sự kiện, key = orderId để giữ thứ tự theo đơn
@Service
class OrderEvents {
  private final KafkaTemplate<String, OrderPlaced> kafka;
  OrderEvents(KafkaTemplate<String, OrderPlaced> kafka) { this.kafka = kafka; }
  void publish(OrderPlaced e) { kafka.send("orders", e.orderId(), e); }
}

// Consumer: mỗi group đọc độc lập
@Component
class InventoryListener {
  @KafkaListener(topics = "orders", groupId = "inventory")
  void on(OrderPlaced e) {
    inventory.reserve(e);   // PHẢI idempotent: sự kiện có thể đến lại lần 2
  }
}
~~~

### Đảm bảo giao nhận (delivery semantics), nói đơn giản
- **At-least-once** (phổ biến nhất): xử lý xong mới commit offset. Nếu crash giữa chừng thì sự kiện được giao **lại**, nên consumer phải **idempotent** (xử lý 2 lần vẫn đúng, ví dụ lưu event id đã xử lý).
- **At-most-once**: commit trước khi xử lý; crash là mất sự kiện.
- **Exactly-once**: Kafka hỗ trợ trong phạm vi Kafka (idempotent producer + transactions), nhưng khi có DB bên ngoài, thực tế vẫn dựa vào idempotency hoặc outbox.

### Lỗi hay gặp
- **Không đặt key** → sự kiện của cùng một đơn rơi vào nhiều partition, xử lý sai thứ tự (ví dụ "huỷ" đến trước "tạo").
- **Consumer không idempotent** → trừ kho 2 lần khi sự kiện được giao lại.
- **Xử lý quá lâu trong listener** → vượt {{max.poll.interval.ms}}, Kafka tưởng consumer chết, rebalance liên tục.
- **Ghi DB rồi mới gửi Kafka** (hai bước rời nhau) → crash ở giữa là mất sự kiện; dùng **transactional outbox**.
- **Dùng Kafka như hàng đợi job** cần retry từng job: một message lỗi chặn cả partition phía sau. Hãy cân nhắc DLQ hoặc retry topic, hoặc một hàng đợi khác.

### Phỏng vấn hay hỏi tiếp
- Kafka đảm bảo thứ tự thế nào? Muốn tăng tốc xử lý thì tăng gì? (Số partition, và số consumer tương ứng.)
- Làm sao không mất sự kiện khi ghi DB và gửi Kafka? (Outbox pattern.)
- Kafka khác RabbitMQ thế nào?

### Trả lời miệng 1 phút
"Kafka là một log sự kiện phân tán: producer ghi nối đuôi vào topic, topic chia thành partition để song song, mỗi sự kiện có offset. Sự kiện không bị xoá khi đọc mà giữ theo retention, nên nhiều consumer group đọc độc lập và có thể đọc lại. Thứ tự chỉ đảm bảo trong một partition, nên tôi đặt key là id thực thể, ví dụ orderId. Trong một group, mỗi partition do một consumer xử lý, nên độ song song bằng số partition. Tôi dùng at-least-once, commit sau khi xử lý, nên consumer phải idempotent, và dùng outbox để không mất sự kiện khi vừa ghi DB vừa phát Kafka."

### Ví dụ đời thực
**Triệu chứng:** Dịch vụ thông báo (notification) gửi email xác nhận đơn hàng chậm dần: lúc 10:00 trễ ~10 giây, đến 11:15 trễ hơn 25 phút. Người dùng phàn nàn "đã thanh toán nhưng chưa nhận email". API đặt hàng vẫn hoạt động bình thường.

**Điều tra:** Kiểm tra consumer lag của group {{notification-service}} (qua công cụ quản trị Kafka/burrow hoặc metric lag phơi ra từ client) thấy lag trên topic {{order-events}} tăng đều từ vài trăm lên ~180.000 message, tập trung ở cả 6 partition. Log consumer cho thấy mỗi lần xử lý một sự kiện, listener gọi API email bên ngoài và mất 3–8 giây; đồng thời xuất hiện cảnh báo liên quan đến việc consumer không kịp gửi heartbeat/poll trong khoảng thời gian cấu hình {{max.poll.interval.ms}}. Kafka kích hoạt **rebalance**: các partition bị thu hồi rồi gán lại, làm một phần message xử lý dở bị giao lại.

**Nguyên nhân gốc:** (1) Listener xử lý tuần tự và quá chậm (gọi đồng bộ API bên ngoài) nên throughput thực tế ~0,3 msg/giây mỗi consumer, trong khi producer đẩy ~12 msg/giây. (2) Xử lý vượt {{max.poll.interval.ms}} gây rebalance lặp lại, càng làm giảm tốc độ tiêu thụ. (3) Một số email bị gửi trùng vì message giao lại (at-least-once) nhưng bước gửi chưa idempotent.

**Cách xử lý:** (1) Tách việc gọi API email ra khỏi listener: consumer chỉ ghi bản ghi "cần gửi" vào DB/bảng outbox nội bộ hoặc đẩy sang một luồng xử lý có kiểm soát, commit offset sau khi ghi nhận thành công. (2) Tăng số consumer instance trong group lên tối đa bằng số partition (6), và điều chỉnh {{max.poll.records}} cho phù hợp thời gian xử lý. (3) Thêm idempotency key (ví dụ {{orderId + eventType}}) và bảng {{processed_events}} để bỏ qua bản trùng. (4) Cấu hình **dead-letter topic** cho message lỗi sau N lần retry để không chặn partition.

**Kết quả đo được:** Sau thay đổi, lag giảm từ 180.000 về dưới 200 trong ~40 phút, thời gian trễ email ổn định 5–15 giây. Rebalance không còn tái diễn (theo log group coordinator). Tỉ lệ email trùng do giao lại giảm về 0 nhờ kiểm tra idempotency.

> Senior tip: theo dõi **consumer lag** (khoảng cách giữa offset mới nhất và offset đã xử lý) cho từng group. Lag tăng đều là chỉ báo sớm nhất cho thấy consumer chậm hoặc kẹt, trước khi người dùng thấy dữ liệu bị trễ.`,
  follow: ['Kafka đảm bảo thứ tự như thế nào?', 'Outbox pattern giải quyết vấn đề gì?', 'Kafka khác RabbitMQ ra sao?'],
  tags: ['Kafka', 'partition', 'consumer group', 'offset', 'nhập môn']
},
{
  id: 'primer-004',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Redis: Redis là gì, có những kiểu dữ liệu nào và thường dùng để làm gì trong backend Java? Dùng cache với Spring Boot ra sao cho đúng?',
  a: `**Tóm tắt:** Redis là **kho dữ liệu key-value chạy trong RAM**, rất nhanh (thường dưới 1ms), hỗ trợ nhiều kiểu dữ liệu (string, hash, list, set, sorted set, stream) và **TTL** (tự hết hạn). Trong backend hay dùng cho: **cache**, **rate limit**, **session**, **khoá phân tán**, **bảng xếp hạng**, **đếm**. Redis thường **không phải nguồn dữ liệu chính** (DB mới là nguồn chuẩn), mà là lớp tăng tốc.

### Hiểu nhanh
Database giống **kho hàng** ở ngoại thành: đầy đủ, an toàn nhưng đi lấy mất thời gian. Redis giống **kệ hàng ngay quầy thu ngân**: để sẵn những món hay bán, lấy ngay lập tức. Kệ nhỏ (RAM có hạn) nên chỉ để món hay dùng, và phải có quy tắc bỏ món hết hạn (TTL) để không bán hàng cũ.

### Thuật ngữ
- **TTL (time to live)**: thời gian sống của key; hết hạn thì Redis tự xoá.
- **Cache-aside**: app tìm trong cache trước; không có (miss) thì đọc DB rồi ghi vào cache.
- **Eviction**: khi đầy RAM, Redis bỏ bớt key theo chính sách (ví dụ allkeys-lru: bỏ key lâu không dùng).
- **Persistence**: RDB (chụp nhanh định kỳ) và AOF (ghi log từng lệnh). Giúp khôi phục sau restart, nhưng Redis vẫn không thay thế DB.
- **Single-threaded** (xử lý lệnh): mỗi lệnh là atomic. Một lệnh chậm chặn tất cả lệnh khác.

### Kiểu dữ liệu và việc hay dùng
| Kiểu | Ví dụ lệnh | Dùng cho |
|---|---|---|
| String | SET/GET, INCR, SET key v NX EX 30 | Cache object (JSON), bộ đếm, khoá đơn giản |
| Hash | HSET/HGET | Lưu object nhiều trường (session, giỏ hàng) |
| List | LPUSH/RPOP | Hàng đợi đơn giản, lịch sử gần đây |
| Set | SADD/SISMEMBER | Tập không trùng (người đã like) |
| Sorted set | ZADD/ZREVRANGE | Bảng xếp hạng, rate limit cửa sổ trượt |
| Stream | XADD/XREADGROUP | Hàng đợi sự kiện có consumer group |

~~~bash
SET product:42 '{"name":"Tai nghe","price":990000}' EX 300   # cache 5 phút
GET product:42
INCR rate:user:7:202610281530        # đếm request của user 7 trong phút này
EXPIRE rate:user:7:202610281530 60
ZADD leaderboard 1500 "an" 1720 "binh"
ZREVRANGE leaderboard 0 9 WITHSCORES # top 10
~~~

### Cache với Spring Boot (cache-aside)
~~~java
@Service
class ProductService {
  @Cacheable(cacheNames = "product", key = "#id")     // có trong cache thì trả luôn, không gọi DB
  public ProductDto get(long id) { return repo.findDto(id); }

  @CacheEvict(cacheNames = "product", key = "#id")    // cập nhật DB xong thì xoá cache
  @Transactional
  public void updatePrice(long id, long price) { repo.updatePrice(id, price); }
}
// application.yml: spring.cache.type=redis, spring.cache.redis.time-to-live=5m
~~~
**Vì sao xoá cache thay vì ghi đè:** xoá rồi để lần đọc sau nạp lại từ DB thì đơn giản và ít sai hơn, nhất là khi nhiều instance cùng cập nhật.

### Lỗi hay gặp
- **Không đặt TTL** → cache phình mãi, dữ liệu cũ tồn tại vĩnh viễn.
- **Cache stampede**: key hot hết hạn, 1.000 request cùng lúc đổ vào DB. Cách giảm: TTL ngẫu nhiên lệch nhau, chỉ cho một request nạp lại (khoá), hoặc làm mới trước khi hết hạn.
- **Lệnh KEYS * trên production** → quét toàn bộ, chặn Redis (single-threaded). Hãy dùng SCAN.
- **Big key** (một list hay hash hàng triệu phần tử) → lệnh chậm, chặn Redis.
- **Coi Redis là nguồn chuẩn** cho số dư hay tồn kho → mất dữ liệu khi sự cố. Quyết định quan trọng phải dựa trên DB.
- **Khoá phân tán làm ẩu** ({{SETNX}} không TTL, xoá khoá của người khác) → xem câu hỏi về Redis lock trong mục Database.

### Phỏng vấn hay hỏi tiếp
- Cache-aside, write-through, write-behind khác nhau thế nào?
- Làm sao giữ cache và DB nhất quán khi cập nhật?
- Redis vì sao nhanh dù xử lý lệnh đơn luồng? (Dữ liệu trong RAM, cấu trúc dữ liệu tối ưu, I/O multiplexing, không tốn chi phí khoá.)

### Trả lời miệng 1 phút
"Redis là kho key-value trong RAM, độ trễ dưới mili giây, có nhiều kiểu dữ liệu như string, hash, list, set, sorted set, stream và hỗ trợ TTL. Trong backend tôi dùng nó cho cache, rate limit, session, khoá phân tán và bảng xếp hạng, nhưng DB vẫn là nguồn dữ liệu chuẩn. Cache tôi làm theo cache-aside: Cacheable để đọc, khi cập nhật thì ghi DB rồi xoá cache, luôn có TTL. Tôi cẩn thận với cache stampede khi key hot hết hạn, tránh lệnh KEYS và big key vì Redis xử lý lệnh đơn luồng."

### Ví dụ đời thực
**Triệu chứng:** Mỗi tối khoảng 20:00, trang chi tiết sản phẩm hot (key {{product:8821}}) bị chậm đột ngột: p95 API {{GET /products/8821}} tăng từ 18ms lên 1,4 giây trong vòng 30–60 giây, rồi tự bình thường. DB Postgres ghi nhận một cụm truy vấn giống hệt {{SELECT ... FROM products WHERE id = 8821}} tăng gấp ~40 lần so với bình thường.

**Điều tra:** Metric Redis ({{INFO stats}}, theo dõi qua exporter) cho thấy {{keyspace_misses}} tăng vọt đúng thời điểm sự cố, trong khi {{keyspace_hits}} tụt mạnh; key {{product:8821}} biến mất rồi xuất hiện lại (do TTL hết). Log ứng dụng cho thấy hàng chục request đồng thời cùng rơi vào nhánh "cache miss" của cache-aside. Không có lệnh {{KEYS}} chậm trong {{SLOWLOG}}; CPU Redis ổn định.

**Nguyên nhân gốc:** **Cache stampede** (còn gọi là thundering herd): key hot hết TTL đúng lúc có nhiều request đồng thời. Vì Redis single-threaded xử lý lệnh nhưng bản chất ở đây là cache-aside ở tầng app, tất cả request miss đều đồng thời truy vấn DB để dựng lại cùng một giá trị, gây "đập" DB.

**Cách xử lý:** (1) Áp dụng **mutex khi tái nạp**: request đầu tiên lấy một lock ngắn trong Redis ({{SET lock:product:8821 1 NX PX 3000}}), chỉ nó truy vấn DB và đặt lại cache; các request khác chờ/ngủ ngắn rồi đọc lại hoặc chấp nhận dữ liệu cũ tạm thời. (2) Thêm **jitter** cho TTL (ví dụ TTL cơ sở 600s ± 60s ngẫu nhiên) để các key hot không hết hạn cùng lúc. (3) Với key cực hot, cân nhắc "logical expiry": lưu thời hạn mềm trong value, trả dữ liệu cũ ngay và làm mới bất đồng bộ. (4) Đặt alert khi {{keyspace_miss}}/tổng request của cache name vượt ngưỡng.

**Kết quả đo được:** Sau 1 tuần, đỉnh p95 {{GET /products/8821}} vào khung 20:00 còn 42ms, số truy vấn DB trùng lặp cho cùng key giảm từ ~40 xuống 1–2 mỗi lần hết hạn, hit rate cache name {{product}} tăng từ 78% lên 96%.

> Senior tip: đo **hit rate** của từng cache name. Cache có hit rate dưới khoảng 50–60% thường chỉ thêm độ phức tạp và rủi ro dữ liệu cũ mà không giảm tải đáng kể cho DB. Đừng ngại bỏ nó.`,
  follow: ['Làm sao giữ cache và DB nhất quán khi cập nhật?', 'Cache stampede là gì và xử lý thế nào?'],
  tags: ['Redis', 'cache', 'TTL', 'Spring Cache', 'nhập môn']
},
{
  id: 'primer-005',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn AWS cho dev Java: các dịch vụ cốt lõi (IAM, VPC, EC2, ECS/EKS, Lambda, S3, RDS, SQS/SNS, CloudWatch) là gì, và một ứng dụng Spring Boot thường chạy trên AWS thế nào?',
  a: `**Tóm tắt:** AWS là nhà cung cấp cloud: thuê máy chủ, database, lưu trữ, hàng đợi… **theo nhu cầu, trả theo dùng**, thay vì tự mua và vận hành server. Với dev Java, cần nắm 4 nhóm:
- **Bảo mật/mạng**: IAM, VPC, Security Group.
- **Chạy code**: EC2, ECS/EKS, Lambda.
- **Lưu dữ liệu**: S3, RDS, DynamoDB.
- **Kết nối/quan sát**: SQS, SNS, CloudWatch.

### Hiểu nhanh
AWS giống **khu công nghiệp cho thuê**:
- **Region** là một khu công nghiệp ở một thành phố.
- **Availability Zone (AZ)** là các nhà xưởng tách biệt trong khu đó: một xưởng cháy thì xưởng khác vẫn chạy.
- **VPC** là hàng rào bao quanh lô đất của bạn.
- **IAM** là hệ thống thẻ ra vào: ai được vào phòng nào.
- Bạn thuê máy móc (EC2), kho chứa (S3), két sắt dữ liệu (RDS) theo giờ.

### Thuật ngữ và dịch vụ cốt lõi
| Dịch vụ | Là gì | Dev Java dùng khi |
|---|---|---|
| IAM | Quản lý danh tính và quyền (user, role, policy) | Cấp quyền cho app đọc S3, gửi SQS… |
| VPC, Subnet, Security Group | Mạng riêng; subnet public/private; tường lửa theo cổng | App và DB nằm trong subnet private |
| EC2 | Máy ảo | Chạy app kiểu truyền thống |
| ECS / EKS | Chạy container (ECS là dịch vụ riêng của AWS; EKS là Kubernetes) | Chạy image Docker của Spring Boot |
| Lambda | Chạy hàm theo sự kiện, không quản lý server | Job nhỏ, xử lý file upload, webhook |
| S3 | Lưu trữ object (file) gần như vô hạn | Ảnh, file báo cáo, backup |
| RDS / Aurora | Database quan hệ được quản lý (Postgres, MySQL) | DB chính của app |
| DynamoDB | NoSQL key-value được quản lý | Truy cập theo key với tải rất lớn |
| SQS / SNS | Hàng đợi / pub-sub thông báo | Tách xử lý bất đồng bộ |
| CloudWatch | Log, metric, alarm | Theo dõi và cảnh báo |
| Secrets Manager | Lưu bí mật (mật khẩu DB, API key) | Không để secret trong code |

### Kiến trúc điển hình cho Spring Boot
~~~text
Internet -> Route 53 (DNS) -> ALB (load balancer, HTTPS) [subnet public]
                                   |
                          ECS/EKS: 3 container Spring Boot [subnet private, 2-3 AZ]
                             |            |               |
                    RDS Postgres     ElastiCache       SQS -> worker
                    (Multi-AZ)       (Redis)
App đọc secret từ Secrets Manager, ghi log/metric lên CloudWatch, file lên S3.
~~~

### Từng bước triển khai cơ bản
1. Tạo VPC có subnet public (chỉ load balancer) và private (app, DB) trải trên ít nhất 2 AZ.
2. RDS Postgres ở subnet private, bật Multi-AZ, Security Group chỉ cho app kết nối cổng 5432.
3. Build image Docker, push lên ECR (registry của AWS).
4. Chạy trên ECS Fargate (không phải quản lý máy) hoặc EKS, sau ALB.
5. Gán **IAM role** cho task/pod (không dùng access key), chỉ cấp đúng quyền cần, ví dụ {{s3:PutObject}} trên đúng một bucket.
6. Mật khẩu DB để trong Secrets Manager; log và metric lên CloudWatch, đặt alarm cho lỗi 5xx và độ trễ.

~~~java
// AWS SDK for Java v2: không truyền access key: SDK tự lấy quyền từ IAM role của container
S3Client s3 = S3Client.builder().region(Region.AP_SOUTHEAST_1).build();
s3.putObject(PutObjectRequest.builder().bucket("reports-prod").key("2026/10/report.pdf").build(),
             RequestBody.fromFile(Path.of("/tmp/report.pdf")));
~~~

### Lỗi hay gặp
- **Hard-code access key trong code hoặc git** → bị quét và lạm dụng (đào coin) trong vài phút. Luôn dùng IAM role.
- **Bucket S3 public** → lộ dữ liệu khách hàng. Bật Block Public Access, chia sẻ file bằng presigned URL có thời hạn.
- **DB trong subnet public** hoặc Security Group mở 0.0.0.0/0 → bị tấn công dò mật khẩu.
- **Chỉ chạy một AZ** → AZ gặp sự cố là sập toàn bộ.
- **Quên đặt budget alarm** → hoá đơn bất ngờ (NAT Gateway, data transfer, log nhiều).
- **Policy IAM dùng dấu sao ({{*}}) cho mọi thứ** → vi phạm least privilege.

### Phỏng vấn hay hỏi tiếp
- ECS vs EKS vs Lambda: chọn khi nào?
- SQS khác SNS, khác Kafka thế nào?
- Làm sao app trong container có quyền gọi S3 mà không cần access key?

### Trả lời miệng 1 phút
"Với một app Spring Boot trên AWS, tôi đặt load balancer ALB ở subnet public, các container chạy trên ECS Fargate hoặc EKS ở subnet private trải ít nhất hai AZ, và DB là RDS Postgres Multi-AZ chỉ cho app truy cập qua Security Group. Image để trên ECR. Quyền gọi S3 hay SQS cấp qua IAM role theo least privilege, không bao giờ dùng access key trong code; mật khẩu DB để trong Secrets Manager. Log và metric lên CloudWatch, có alarm cho lỗi và độ trễ, kèm budget alarm để kiểm soát chi phí. Việc bất đồng bộ thì đẩy qua SQS cho worker xử lý."

### Ví dụ đời thực
**Triệu chứng:** Lúc 02:10 (giờ thấp điểm), một AZ trong vùng {{ap-southeast-1}} gặp sự cố phần cứng. Ứng dụng thanh toán bắt đầu trả HTTP 503 ngắt quãng; khoảng 18% request thất bại trong 4 phút, dù CPU trung bình toàn cụm trước đó chỉ 40%.

**Điều tra:** Kiểm tra ALB target health thấy toàn bộ target ở subnet AZ-b chuyển {{unhealthy}}. Trên ECS service, số task chạy giảm từ 6 xuống 3 vì cả 3 task còn lại nằm ở AZ-b (sai sót khi triển khai ban đầu chỉ gắn 1 subnet private). Kiểm tra RDS: instance chính cũng đặt ở AZ-b, Multi-AZ chưa bật nên failover thủ công phải đợi tạo standby. CloudWatch alarm {{ALB-TargetResponseTime}} và {{HTTPCode_Target_5XX_Count}} đã bắn nhưng chưa có runbook gắn kèm.

**Nguyên nhân gốc:** Kiến trúc "giả đa AZ": subnet khai báo đủ nhưng ECS service và RDS đều gắn vào một AZ. Khi AZ đó lỗi, không còn tài nguyên dự phòng; ALB còn route nhưng không còn target khỏe.

**Cách xử lý:** (1) Sửa ECS service để chạy trên 2 subnet private ở 2 AZ, đặt {{desiredCount=6}} và bật spread theo AZ; thêm **Application Auto Scaling** theo CPU/request. (2) Bật RDS Multi-AZ và xác nhận endpoint không đổi khi failover. (3) Rà soát Security Group DB: chỉ cho phép inbound từ SG của app, bỏ mọi rule {{0.0.0.0/0}}. (4) Thêm runbook vào alarm và kiểm tra bằng bài test failover có lên lịch.

**Kết quả đo được:** 6 tuần sau, khi thực hiện bài test tắt AZ-b có chủ đích, ALB chuyển 100% traffic sang AZ-a trong khoảng 40 giây, tỉ lệ 5xx đỉnh 0,6% trong 1 phút, không mất dữ liệu (RDS failover ~70 giây, app retry theo backoff). Mục tiêu RTO < 2 phút đạt được.

> Senior tip: khi phỏng vấn, nhắc tới **chi phí**: NAT Gateway, data transfer giữa các AZ và log CloudWatch là ba khoản hay làm hoá đơn tăng bất ngờ. Người từng vận hành thật luôn nhớ chúng.`,
  follow: ['ECS, EKS và Lambda: khi nào chọn cái nào?', 'Làm sao cấp quyền S3 cho app mà không dùng access key?'],
  tags: ['AWS', 'IAM', 'VPC', 'ECS', 'S3', 'RDS', 'nhập môn']
},
{
  id: 'primer-006',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Observability: log, metric, trace khác nhau thế nào? Bạn trang bị quan sát cho một hệ thống Spring Boot nhiều service ra sao?',
  a: `**Tóm tắt:** Observability (khả năng quan sát) là khả năng **trả lời "chuyện gì đang xảy ra và vì sao" từ dữ liệu hệ thống tự phát ra**. Ba trụ cột:
- **Metric**: con số theo thời gian, cho biết **có vấn đề không** (tỉ lệ lỗi, độ trễ, CPU).
- **Trace**: đường đi của **một request** qua nhiều service, cho biết **chậm ở đâu**.
- **Log**: dòng sự kiện chi tiết, cho biết **chính xác chuyện gì**.

Trong Spring Boot: **Actuator + Micrometer** cho metric (đẩy sang Prometheus/Grafana), **Micrometer Tracing/OpenTelemetry** cho trace, **log JSON có traceId** cho log.

### Hiểu nhanh
Giống khám bệnh:
- Metric là **chỉ số sinh tồn** (nhịp tim, huyết áp): nhìn là biết có ổn không.
- Trace là **chụp chiếu theo đường đi**: thấy tắc ở đoạn nào.
- Log là **bệnh án chi tiết**: đọc để biết chính xác đã xảy ra gì.

Bác sĩ giỏi nhìn chỉ số trước, rồi mới khoanh vùng và đọc chi tiết.

### Thuật ngữ
- **Micrometer**: thư viện "facade" đo metric của hệ sinh thái Spring, xuất được sang nhiều hệ thống (Prometheus, CloudWatch…).
- **Prometheus / Grafana**: lưu metric dạng time series / vẽ dashboard và cảnh báo.
- **OpenTelemetry (OTel)**: chuẩn mở để thu thập trace, metric, log.
- **Span**: một đoạn công việc trong trace (ví dụ "gọi DB", "gọi payment-service"); nhiều span tạo thành một trace.
- **traceId / correlation id**: mã gắn xuyên suốt request, có trong log của mọi service để ghép lại.
- **MDC**: cơ chế của SLF4J/Logback để tự chèn traceId vào mỗi dòng log.
- **RED**: Rate (số request), Errors (lỗi), Duration (độ trễ), ba metric cơ bản cho mỗi API.
- **SLO**: mục tiêu chất lượng, ví dụ 99,9% request dưới 300ms trong 30 ngày.
- **Cardinality**: số giá trị khác nhau của một nhãn metric. Nhãn như userId có cardinality cực cao, làm nổ hệ thống metric.

### Trang bị từng bước
1. **Actuator + Micrometer Prometheus**: có sẵn metric HTTP, JVM (heap, GC, thread), connection pool (HikariCP).
~~~yaml
management:
  endpoints.web.exposure.include: health,info,prometheus
  metrics.tags.application: orders-service      # nhãn chung để lọc theo service
  tracing.sampling.probability: 0.1             # lấy mẫu 10% trace để tiết kiệm
~~~
2. **Metric nghiệp vụ** cho những gì sếp quan tâm:
~~~java
Counter.builder("orders.placed").tag("channel", channel).register(registry).increment();
Timer.builder("payment.call").register(registry).record(() -> paymentClient.charge(req));
// KHÔNG gắn tag userId/orderId: cardinality cao làm nổ Prometheus
~~~
3. **Tracing**: thêm Micrometer Tracing với bridge OpenTelemetry. Trace tự lan qua RestClient/WebClient/Kafka, gửi về Tempo, Jaeger hoặc dịch vụ cloud.
4. **Log JSON** có {{traceId}}, {{spanId}}, tên service; gom về một nơi (Loki, ELK, CloudWatch). Không log mật khẩu hay PII.
5. **Dashboard RED** cho mỗi service, cộng JVM, DB pool, consumer lag (nếu dùng Kafka).
6. **Alert theo triệu chứng người dùng thấy** (tỉ lệ lỗi, độ trễ p95/p99 vượt SLO), không alert theo mọi thứ (CPU 70%).

### Điều tra một sự cố mẫu
~~~text
1. Alert: p99 API /checkout tăng từ 300ms lên 4s           (metric)
2. Mở trace chậm: span "payment-service POST /charge" 3.8s  (trace)
3. Lọc log của payment-service theo traceId đó:
   "HikariPool-1 - Connection is not available, request timed out"   (log)
4. Kết luận: pool DB của payment-service cạn -> kiểm tra query chậm / pool size
~~~

### Lỗi hay gặp
- **Chỉ có log, không có metric** → phải grep log mới biết hệ thống đang lỗi, phát hiện chậm.
- **Nhãn metric cardinality cao** (userId, URL có id) → Prometheus tốn RAM, chậm, có khi sập.
- **Log không có traceId** → không ghép được log giữa các service.
- **Alert quá nhiều** → "mệt mỏi vì cảnh báo", mọi người bỏ qua cả cảnh báo thật.
- **Đo trung bình thay vì percentile** → trung bình 200ms che mất 1% người dùng chờ 10s.

### Phỏng vấn hay hỏi tiếp
- Vì sao dùng p95/p99 thay vì trung bình?
- SLO, SLI, SLA khác nhau thế nào?
- Bạn đã điều tra một sự cố production bằng observability ra sao? (Chuẩn bị một câu chuyện STAR.)

### Trả lời miệng 1 phút
"Tôi dùng ba trụ cột. Metric để biết có vấn đề hay không, với RED là rate, errors, duration theo percentile cho mỗi API, cộng metric JVM, connection pool và metric nghiệp vụ, qua Actuator, Micrometer, Prometheus và Grafana. Trace để biết chậm ở service nào, qua Micrometer Tracing với OpenTelemetry, có lấy mẫu. Log JSON có traceId để đọc chi tiết, gom về một nơi. Alert dựa trên SLO theo triệu chứng người dùng thấy. Tôi tránh nhãn có cardinality cao như userId, và không log dữ liệu nhạy cảm."

### Ví dụ đời thực
**Triệu chứng:** Sau khi ra bản mới lúc 14:05, tỉ lệ lỗi 5xx của API {{POST /orders}} tăng từ 0,1% lên 4,8% trong 6 phút. p99 thời gian phản hồi nhảy từ 420ms lên 6,2 giây. Người dùng báo "đặt hàng thất bại", nhưng CPU của pod vẫn chỉ khoảng 35%.

**Điều tra:** Trên Grafana, bảng RED theo endpoint cho thấy chỉ {{POST /orders}} bất thường. Metric {{hikaricp_connections_pending}} tăng vọt lên 48 (bằng kích thước pool), trong khi {{hikaricp_connections_active}} kẹt ở 48 và không giảm — dấu hiệu request đang chờ connection. Mở một trace chậm trong Jaeger/Tempo: span {{jdbc.execute}} chiếm 5,9 giây; span con trỏ tới truy vấn kiểm tra tồn kho. Log JSON lọc theo {{traceId}} của trace đó cho thấy câu lệnh chạy với tham số {{sku_id}} mới thêm trong bản phát hành.

**Nguyên nhân gốc:** Bản mới bổ sung truy vấn tồn kho theo {{sku_id}} nhưng chưa có index trên cột này. Bảng {{inventory}} khoảng 12 triệu dòng, nên truy vấn quét tuần tự, giữ connection pool quá lâu và làm các request khác xếp hàng chờ.

**Cách xử lý:** Thêm index {{CREATE INDEX CONCURRENTLY idx_inventory_sku_id ON inventory(sku_id)}} (chạy không khóa ghi trên PostgreSQL), xác nhận bằng {{EXPLAIN ANALYZE}} chuyển từ Seq Scan sang Index Scan. Đồng thời đặt {{spring.datasource.hikari.connection-timeout}} hợp lý và alert khi {{hikaricp_connections_pending}} vượt ngưỡng 5 phút liên tục.

**Kết quả đo được:** Sau 8 phút từ lúc thêm index, p99 {{POST /orders}} giảm về 380ms, tỉ lệ 5xx còn 0,08%, {{hikaricp_connections_pending}} về 0. Không cần rollback hay tăng số pod.

> Senior tip: mỗi khi xử lý xong sự cố, hãy hỏi "metric hoặc alert nào lẽ ra đã báo sớm hơn?" rồi thêm nó vào. Hệ thống quan sát tốt được xây dần từ các postmortem, không phải từ một lần cấu hình.`,
  follow: ['Vì sao đo p95/p99 thay vì trung bình?', 'SLO, SLI, SLA khác nhau thế nào?'],
  tags: ['observability', 'metric', 'trace', 'log', 'Micrometer', 'OpenTelemetry', 'nhập môn']
},
{
  id: 'primer-007',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn MCP (Model Context Protocol): MCP là gì, gồm những thành phần nào, và một dev backend viết MCP server để làm gì?',
  a: `**Tóm tắt:** MCP là **chuẩn mở** để ứng dụng AI (như Claude Code, Claude Desktop hay app của bạn) kết nối với **công cụ và dữ liệu bên ngoài** theo một giao thức chung. Bạn viết **MCP server** để "mở" một hệ thống (DB, Jira, log, API nội bộ) dưới dạng:
- **tools**: hành động AI gọi được;
- **resources**: dữ liệu AI đọc được;
- **prompts**: mẫu prompt.

Mọi ứng dụng hỗ trợ MCP đều dùng được server đó, không phải tích hợp riêng cho từng app.

### Hiểu nhanh
MCP giống **cổng USB-C cho AI**. Trước đây mỗi thiết bị một kiểu cắm: mỗi app AI phải viết tích hợp riêng cho Jira, cho DB, cho Drive. Với MCP, bạn làm một "thiết bị" (server) theo chuẩn, cắm vào bất kỳ "máy" (client) nào hỗ trợ MCP là chạy.

### Thuật ngữ
- **Host**: ứng dụng người dùng tương tác (Claude Desktop, Claude Code, IDE).
- **Client**: phần trong host giữ kết nối tới một MCP server.
- **Server**: chương trình của bạn, cung cấp tools/resources/prompts.
- **Tool**: hàm AI có thể gọi, có tên, mô tả và input schema (JSON Schema), ví dụ {{explain_query(sql)}}.
- **Resource**: dữ liệu đọc được qua URI, ví dụ schema của bảng hay tài liệu.
- **Prompt**: mẫu prompt có tham số do server cung cấp.
- **Transport**: cách client và server nói chuyện: **stdio** (server chạy như tiến trình con trên máy, hợp cho công cụ local) hoặc **HTTP** (Streamable HTTP, server chạy từ xa). Thông điệp theo định dạng **JSON-RPC 2.0**.

### Luồng hoạt động
~~~text
Người dùng: "Query lấy đơn hàng tháng này sao chậm vậy?"
  Claude (host) --list tools--> MCP server "db-inspector"
                <-- [describe_table, explain_query, slow_queries]
  Claude quyết định gọi: explain_query({"sql": "SELECT ... FROM orders WHERE ..."})
  MCP server chạy EXPLAIN trong transaction READ ONLY -> trả plan (Seq Scan, 2.1s)
  Claude: "Đang quét toàn bảng orders; nên thêm index (customer_id, created_at)..."
~~~

### Khi nào viết MCP server
| Nhu cầu | MCP server? |
|---|---|
| Cho AI tra cứu hoặc thao tác một hệ thống nội bộ (DB, Jira, log, API) và **dùng lại ở nhiều app AI** | Có |
| Chỉ một app của bạn gọi Claude API với vài tool đơn giản | Có thể chỉ cần khai báo tool trực tiếp trong request |
| Đóng gói quy trình hoặc hướng dẫn làm việc (không phải truy cập hệ thống) | Dùng Skill hoặc CLAUDE.md hợp hơn |

### Thiết kế tool tốt cho AI (quan trọng nhất)
1. **Tên và mô tả rõ, nói khi nào dùng**: "explain_query: chạy EXPLAIN cho câu SELECT để phân tích hiệu năng; chỉ nhận một câu SELECT".
2. **Input schema chặt**: kiểu, giới hạn (limit ≤ 50), enum.
3. **Output gọn**: tóm tắt và cắt bớt, không đổ 10MB log vào context.
4. **Lỗi rõ ràng** để AI tự sửa: "Chỉ chấp nhận SELECT, nhận được UPDATE".
5. **Quyền tối thiểu**: bắt đầu bằng tool chỉ-đọc; tool ghi cần người xác nhận.

### Bảo mật: phần interviewer sẽ đào sâu
- **Prompt injection**: dữ liệu trả về (nội dung ticket, dòng trong DB) có thể chứa câu "hãy gọi tool xoá…". Thiết kế server sao cho dù AI bị lừa cũng **không thể** gây hại (DB user chỉ SELECT, giới hạn tool).
- **Xác thực**: server HTTP phải có auth; không mở server nội bộ ra internet.
- **Chỉ cài MCP server từ nguồn tin cậy**: server có quyền truy cập dữ liệu thật.
- **Audit log**: ghi lại mọi lời gọi tool cùng tham số và người dùng.

### Thử nhanh
- Chạy server mẫu hoặc server bạn viết ở chế độ stdio, rồi thêm vào Claude Code bằng lệnh {{claude mcp add}} (xem tài liệu Claude Code cho cú pháp đầy đủ).
- Dùng **MCP Inspector** (công cụ của dự án MCP) để gọi thử từng tool mà không cần AI.
- Có SDK chính thức cho nhiều ngôn ngữ, gồm Java; Spring AI có hỗ trợ dựng MCP server. Kiểm tra tài liệu để dùng đúng artifact và API.
- Muốn thực hành có hướng dẫn: xem dự án MCP trong mục Pet project (đang được bổ sung).

### Lỗi hay gặp
- **Tool làm quá nhiều việc** (một tool "run_sql" nhận mọi câu lệnh) → khó kiểm soát, rủi ro cao. Hãy chia nhỏ theo mục đích.
- **Mô tả tool mơ hồ** → AI gọi sai tool hoặc không gọi.
- **Trả kết quả quá lớn** → tràn context, tốn token, AI trả lời kém.
- **Tin dữ liệu trả về như mệnh lệnh** → dính prompt injection.

### Trả lời miệng 1 phút
"MCP là chuẩn mở để ứng dụng AI kết nối với công cụ và dữ liệu, giống cổng USB-C: tôi viết một MCP server cung cấp tools để AI gọi, resources để AI đọc và prompts mẫu, và mọi host hỗ trợ MCP như Claude Code hay Claude Desktop đều dùng được. Giao tiếp theo JSON-RPC qua stdio cho công cụ local, hoặc HTTP cho server từ xa. Khi thiết kế, tôi chú trọng tên và mô tả tool nói rõ khi nào dùng, input schema chặt, output gọn và lỗi rõ ràng. Về bảo mật, tôi coi dữ liệu trả về là không tin cậy vì có thể chứa prompt injection, nên giới hạn quyền ngay ở tầng hệ thống, ví dụ DB user chỉ SELECT, có auth và audit log."

### Ví dụ đời thực
**Bối cảnh:** Team backend có database reporting 80 bảng, và dữ liệu analyst thường phải hỏi dev "cho em query doanh thu theo tháng". Dev mất 2–3 giờ/ngày copy-paste SQL.

**Triệu chứng:** Không có sự cố production, nhưng throughput của team analytics bị chặn vì phụ thuộc dev.

**Điều tra:** Xem log query thực tế người dùng hay hỏi → 5 câu SQL lặp lại 80% trường hợp. Kiểm tra MCP server mẫu của dự án để xác nhận schema tool.

**Nguyên nhân gốc:** Không có "cổng" chuẩn để AI tự đọc schema và chạy EXPLAIN; mọi request phải đi qua dev.

**Cách xử lý:** Viết MCP server "db-inspector" với 3 tool: {{describe_table}}, {{explain_query}}, {{run_select}}. DB user chỉ có quyền SELECT trên schema read-only. Output {{explain_query}} cắt bớt ở 2KB. Thêm audit log ghi ai gọi tool nào với tham số gì.

**Kết quả đo được:** Sau 2 tuần, 70% câu hỏi analytics tự xử lý qua Claude Code; thời gian dev dành cho ad-hoc query giảm từ 2,5 giờ/ngày xuống 15 phút. Không có incident dữ liệu vì DB user chỉ SELECT.

> Senior tip: khi kể về MCP trong phỏng vấn, hãy nhấn mạnh **thiết kế quyền ở tầng hạ tầng chứ không ở prompt**: "dù model bị lừa, tool vẫn không thể ghi dữ liệu". Câu đó cho thấy bạn hiểu rủi ro thật của AI agent.`,
  follow: ['Tool và resource trong MCP khác nhau thế nào?', 'Bạn phòng prompt injection cho một MCP server đọc dữ liệu khách hàng ra sao?'],
  tags: ['MCP', 'Model Context Protocol', 'tools', 'AI agent', 'nhập môn']
},
{
  id: 'primer-008',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Git: commit, branch, remote là gì? Bạn thao tác hằng ngày với Git thế nào và xử lý conflict khi merge ra sao?',
  a: `**Tóm tắt:**
- Git là **hệ thống quản lý phiên bản phân tán**: mọi máy (developer, CI, server) có **toàn bộ lịch sử** của project.
- **Commit** là một "bản chụp" có mã định danh (hash) và lời nhắn; **branch** là một con trỏ nhẹ tới commit hiện tại, đổi nhánh gần như tức thì; **remote** là bản sao "chung cho cả team" (GitHub, GitLab).
- Thao tác hằng ngày: sửa code → {{git add}} (chọn thay đổi vào vùng staging) → {{git commit}} → {{git push}}; lấy việc người khác: {{git pull}}.
- **Conflict** là chỗ hai nhánh cùng sửa một dòng; Git dừng lại, đánh dấu trong file để bạn tự chọn/ghép nội dung đúng, rồi {{git add}} và {{git commit}} để hoàn tất merge.

### Hiểu nhanh
Git giống **sổ tay viết tay nhiều bản photo**:
- Mỗi trang ghi có số hiệu (hash) và ghi rõ "trang trước là trang nào" (parent) → không thể lén sửa quá khứ mà mọi người không phát hiện.
- Branch là **dải giấy gắn vào một trang**: chuyển nhánh chỉ là dời dải giấy, không mất trang nào. Trong Git một nhánh mới chỉ tốn vài byte, nên cứ thoải mái tách nhánh cho từng tính năng nhỏ.
- Remote là cuốn sổ đặt **trên kệ phòng họp**: ai cũng photo về được (clone), ai cũng dán trang mới lên được (push), và đều xem được trang mới của nhau (fetch/pull).

### Luồng file trong Git (phải hiểu trước khi dùng lệnh)
~~~text
Bạn sửa file
   |  (1) file nằm trong working tree — thay đổi "lỏng lẻo", chưa được lưu
   v
git add file
   |  (2) thay đổi vào staging area (index) — "đã chọn để đưa vào bản chụp kế"
   v
git commit -m "msg"
   |  (3) snapshot cố định + lời nhắn, gắn vào lịch sử nhánh hiện tại
   v
git push origin main
        (4) gửi commit từ máy bạn lên remote (origin)
~~~
- {{git status}}: đang ở nhánh nào, file nào sửa/thêm/chưa chọn.
- {{git log --oneline -10}}: 10 commit gần nhất, mỗi dòng một hash + lời nhắn.
- {{git diff}}: xem thay đổi chưa {{add}}; {{git diff --staged}}: xem phần đã {{add}}.

### Branch, merge và rebase
- {{git switch -c feature-login}}: tạo nhánh mới và nhảy sang; {{git switch main}}: về nhánh chính.
- {{git merge feature-login}}: **hợp nhất** hai dòng lịch sử; nếu hai nhánh cùng đổi chỗ khác nhau của file thì tự ghép, cùng chỗ thì báo **conflict**.
- {{git rebase main}}: "chép lại" commit của bạn lên đỉnh {{main}}, lịch sử thẳng hơn nhưng **viết lại hash** — chỉ rebase nhánh của riêng bạn, không bao giờ rebase nhánh chung đang có người dùng.

### Xử lý conflict từng bước
1. {{git merge feature-login}} báo {{CONFLICT (content): ...}}.
2. {{git status}} liệt kê file conflict. Mở file, thấy Git chèn mốc:
~~~text
<<<<<<< HEAD
    int timeout = 30;
=======
    int timeout = 60;
>>>>>>> feature-login
~~~
3. Sửa lại nội dung **đúng cuối cùng**, xoá hết dòng mốc {{<<<<<<<}}, {{=======}}, {{>>>>>>>}}.
4. {{git add file}} rồi {{git commit}} — merge hoàn tất.

### Lỗi hay gặp
- **Không hiểu working tree → staging → commit** nên tưởng {{git commit}} "lưu tất cả"; thực ra chỉ commit phần đã {{add}}.
- **Force push ({{git push -f}}) sau rebase/reset lên nhánh chung** → ghi đè commit người khác, có thể mất việc của họ. Dùng {{git push --force-with-lease}} chỉ trên nhánh riêng.
- **Commit lộ secret** (mật khẩu, API key): nếu đã push thì đổi secret **ngay** (xoá lịch sử không đủ vì bản clone của người khác còn). Thêm secret vào {{.gitignore}} từ đầu.
- **Chạy {{git reset --hard}} để "dọn"**: mất vĩnh viễn thay đổi chưa commit; nếu lỡ thì {{git reflog}} thường còn cứu được.
- **Merge xong mới thấy commit message "sửa lỗi" vô nghĩa** → luyện viết message nói rõ **vì sao**, không chỉ "sửa".

### Trả lời miệng 1 phút
"Git là hệ thống quản lý phiên bản phân tán, mọi nơi có toàn bộ lịch sử. Thao tác hằng ngày của tôi là: tạo nhánh cho từng tính năng, sửa code rồi {{git add}} để chọn thay đổi vào staging, {{git commit}} với message rõ lý do, và {{git push}} lên remote. Khi nhánh chính có thay đổi mới, tôi {{git pull}} để lấy về và merge. Gặp conflict thì tôi mở file, đọc các đoạn được Git đánh dấu, giữ nội dung đúng, xoá dòng mốc rồi {{git add}} và commit để hoàn tất merge. Tôi không rebase hay force push trên nhánh chung, và luôn kiểm tra {{.gitignore}} để không đẩy secret lên."

### Ví dụ đời thực
**Bối cảnh:** Dự án e-commerce, 6 dev làm song song trên nhánh feature. Một dev commit secret AWS vào nhánh riêng rồi merge PR.

**Triệu chứng:** Alert từ AWS GuardDuty phát hiện key bị dùng ở IP lạ sau 40 phút.

**Điều tra:** {{git log --all -S "AKIA"}} tìm commit chứa key; {{git branch --contains <hash>}} xác định nhánh nào đã merge. Kiểm tra CloudTrail để biết key đã bị dùng làm gì.

**Nguyên nhân gốc:** Secret commit lên remote, dù sau đó dev xoá commit bằng rebase, key vẫn còn trong lịch sử và đã bị clone.

**Cách xử lý:** Revoke key ngay lập tức (không đợi xoá lịch sử); rotate secret mới qua Secrets Manager; thêm pre-commit hook quét secret; bật branch protection bắt buộc review; ghi postmortem.

**Kết quả đo được:** Key cũ vô hiệu trong 12 phút; không có dữ liệu bị rò rỉ; sau đó 3 tháng không có commit secret nào lọt qua hook.

> Senior tip: luyện {{git log --oneline --graph --all}} mỗi tuần một lần — nhìn được hình cây lịch sử giúp bạn hiểu chuyện gì đang xảy ra giữa các nhánh, và là kỹ năng phân biệt người "biết dùng Git" với người "chỉ nhớ vài lệnh". Trong team, squash merge + ràng buộc branch protection (bắt buộc review, cấm force push) giữ lịch sử gọn mà vẫn an toàn.`,
  follow: ['Merge và rebase khác nhau về lịch sử ra sao, khi nào dùng cái nào?', 'Bạn xử lý một commit chứa secret đã lỡ push lên remote thế nào?', 'Fast-forward merge là gì, khi nào Git không fast-forward được?'],
  tags: ['Git', 'commit', 'branch', 'merge', 'conflict', 'nhập môn']
},
{
  id: 'primer-009',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Linux cho dev backend: process, port và service là gì? Bạn dùng lệnh nào để xem tiến trình, cổng, log và sửa quyền file trên server Linux?',
  a: `**Tóm tắt:**
- **Process** là một chương trình đang chạy, có số định danh **PID**; **service** là tiến trình do hệ điều hành khởi động và theo dõi giúp (trên Linux hiện đại thường là **systemd unit**); **port** là "cửa ngõ" số trên máy mà tiến trình lắng nghe kết nối mạng (ví dụ 8080).
- Bộ lệnh tối thiểu của dev backend: {{ps}}/{{top}} xem tiến trình và tài nguyên, {{ss}} xem cổng, {{tail -f}}/{{journalctl}} xem log, {{chmod}}/{{chown}} sửa quyền file, {{kill}} dừng tiến trình.
- Log của app Java thường do chính app ghi (file hoặc stdout); log của service do {{journalctl}} giữ lại.

### Hiểu nhanh
Linux giống **một nhà máy lớn**:
- Process là **công nhân đang làm việc** — mỗi người có số thẻ (PID), làm việc tốn lương (CPU/RAM).
- Service là **ca làm việc được quản lý**: giám đốc (systemd) bật công nhân đầu ca, theo dõi, và nếu công nhân ngã thì thay người mới (auto-restart).
- Port là **cửa ra vào có số**: khách (client) tới cửa 8080 để gặp dịch vụ của bạn; một cửa chỉ có một người đứng.

### Xem tiến trình và tài nguyên
~~~bash
ps -ef | grep java      # liệt kê tiến trình java: PID, lệnh khởi động, user
top                     # cập nhật realtime: CPU, RAM theo tiến trình (q để thoát)
ps -o pid,rss,cmd -p 1234   # RAM (RSS, KB) và lệnh của PID 1234
kill 1234               # gửi tín hiệu TERM: nhờ tiến trình tắt sạch (yêu cầu đóng socket, ghi log...)
kill -9 1234            # buộc chết ngay: chỉ dùng khi kill thường không ăn
~~~
- Java nhận SIGTERM thì Spring Boot chạy **graceful shutdown** (đợi request đang xử lý xong, tối đa {{spring.lifecycle.timeout-per-shutdown-phase}}). {{kill -9}} bỏ qua tất cả — có thể mất request đang dở.
- {{top}}: xem %CPU, %MEM, RES; cột cao bất thường là dấu hiệu đầu tiên.

### Xem cổng mạng
~~~bash
ss -tlnp | grep 8080    # cổng 8080 do tiến trình nào đang lắng nghe
ss -tnp | grep 8080     # các kết nối đang mở trên cổng 8080
lsof -i :8080           # (cách khác) tiến trình mở cổng 8080
~~~
Lỗi kinh điển: khởi động app lần hai → {{BindException: Address already in use}} — cổng đã bị tiến trình cũ giữ; {{ss -tlnp | grep 8080}} cho thấy ngay PID "kẻ giữ cửa".

### Xem log
~~~bash
tail -f /var/log/app/app.log        # theo dõi log realtime
journalctl -u orders.service -f     # log của service do systemd quản lý
journalctl -u orders.service --since "1 hour ago" | grep ERROR
~~~
Quy tắc: app chạy trên server thì để systemd quản lý ({{Restart=on-failure}}), ghi log ra stdout hoặc file do chính app cấu hình (Logback). Khi chạy trong container (ECS, K8s) thường không cần {{journalctl}} vì log được gom tập trung.

### Quyền file và user
Mỗi file Linux có **owner**, **group** và chuỗi quyền dạng {{rwxr-xr--}}:
~~~text
rwx r-x r--
 |   |   +-- others: chỉ đọc
 |   +------ group : đọc + chạy (vào thư mục)
 +---------- owner : đọc + ghi + chạy
chmod 640 app.properties    # owner ghi được, group chỉ đọc, others không gì
chown app:app app.properties  # đổi chủ sở hữu sang user app
~~~
{{chmod 777}} (cho mọi người mọi quyền) là **bẫy**: "cho đỡ lỗi quyền" nhưng mở toang dữ liệu; hãy cấp đúng mức tối thiểu.

### Lỗi hay gặp
- **Chạy app bằng root** để "cho đỡ lỗi quyền" — khi có lỗ hổng là attacker có cả máy. Chạy bằng user riêng, cấp quyền đúng chỗ.
- **Không biết port do ai giữ** nên restart ầm ầm; {{ss -tlnp}} biết ngay.
- **Dùng {{kill -9}} như thói quen** → mất graceful shutdown, mất request, file ghi dở bị hỏng.
- **Log đầy đĩa** ({{No space left on device}}) → app treo; bật log rotation và giám sát dung lượng.
- **Quên {{chmod +x}}** cho file script shell ({{./deploy.sh}}) → chạy báo {{Permission denied}}.

### Trả lời miệng 1 phút
"Process là chương trình đang chạy có PID; service là tiến trình do systemd quản lý, tự khởi động và tự restart khi lỗi; port là cổng số mà tiến trình lắng nghe. Khi nghi ngờ sự cố, tôi dùng {{ps -ef | grep java}} tìm tiến trình, {{top}} xem CPU/RAM, {{ss -tlnp}} xem cổng bị chiếm bởi ai, {{journalctl -u}} hoặc {{tail -f}} xem log quanh thời điểm lỗi. Tôi dừng tiến trình bằng {{kill}} để app tắt graceful, {{kill -9}} chỉ là phương án cuối. Về quyền file, tôi cấp vừa đủ qua {{chmod}}/{{chown}} và không bao giờ chạy app production bằng root."

### Ví dụ đời thực
**Bối cảnh:** Production API đột ngột trả 502; on-call SSH vào server app.

**Triệu chứng:** Người dùng thấy 502 Bad Gateway; Nginx error log ghi {{connect() failed (111: Connection refused)}}.

**Điều tra:** 30 giây đầu chạy {{uname -a}}, {{ss -tlnp | head}}, {{df -h}}, {{free -m}}, {{uptime}}. Kết quả: disk 100% đầy vì log rotation tắt; app Java crash vì không ghi được log. {{ps -ef | grep java}} không thấy process.

**Nguyên nhân gốc:** Log file lớn dần đến đầy đĩa; app không start lại được do không còn chỗ ghi.

**Cách xử lý:** Xoá log cũ bằng {{truncate -s 0}} và {{logrotate -f}}; restart service; bật alert disk > 80%; thêm log rotation trong Logback.

**Kết quả đo được:** Service up sau 4 phút; p99 về 200ms; alert disk fire trước khi đầy 3 tuần sau.

> Senior tip: khi SSH vào server lạ, mất 30 giây đầu để chạy {{uname -a}}, {{ss -tlnp | head}}, {{df -h}}, {{free -m}} và {{uptime}} — "ảnh chụp" hiện trạng máy; nhiều sự cố (đĩa đầy, RAM cạn, load cao) lộ ra ngay từ 5 lệnh đó trước khi bạn mở log.`,
  follow: ['Khác nhau giữa SIGTERM và SIGKILL, vì sao Spring Boot cần graceful shutdown?', 'Bạn chẩn đoán app Java bị treo (không phản hồi) trên Linux thế nào?', 'Quyền file 644 và 640 khác nhau ra sao, khi nào dùng cái nào?'],
  tags: ['Linux', 'process', 'port', 'journalctl', 'chmod', 'nhập môn']
},
{
  id: 'primer-010',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn HTTP: request và response gồm những phần nào? Header, status code, keep-alive và HTTPS hoạt động ra sao?',
  a: `**Tóm tắt:**
- HTTP là giao thức "hỏi – trả lời": client gửi **request** (yêu cầu), server trả **response** (phản hồi). Cả hai đều gồm **dòng đầu + header + thân (body)**.
- **Header** là metadata (định dạng, mã hoá, phiên bản, cookie...); **status code** báo kết quả: 2xx thành công, 4xx lỗi do client, 5xx lỗi server.
- **Keep-alive** (HTTP/1.1 bật mặc định) giữ một kết nối TCP dùng cho nhiều request thay vì mỗi request một lần kết nối; **HTTPS** = HTTP chạy trong lớp **TLS** để mã hoá và xác thực server.

### Hiểu nhanh
Giống **đi gửi thư hỏi đáp ở quầy bưu điện**:
- Request là **tờ yêu cầu**: đầu tờ ghi "tôi muốn gì" ({{GET /api/orders/42}}), các dòng dưới là thông tin kèm (header: "trả JSON nhé", "tôi đã đăng nhập"), đôi khi có kèm dữ liệu (body).
- Response là **tờ trả lời**: đầu tờ ghi mã kết quả ({{200 OK}} hoặc {{404 Not Found}}), header kèm "đây là JSON", thân tờ là dữ liệu.
- Keep-alive là **giữ đường dây điện thoại mở** cho vài câu hỏi thay vì mỗi câu gọi một lần — cắt được độ trễ bắt tay TCP.
- HTTPS là **gửi trong phong bì niêm phong và có con dấu xác thực**: người nghe trung gian chỉ thấy mã hoá, không đọc được nội dung; con dấu (chứng chỉ) chứng minh bạn đang nói đúng với server chứ không phải kẻ mạo danh.

### Cấu trúc một request/response
~~~text
GET /api/orders/42 HTTP/1.1        <- dòng đầu: method + đường dẫn + phiên bản
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGci...

HTTP/1.1 200 OK                    <- dòng đầu response: phiên bản + status code
Content-Type: application/json
Content-Length: 256

{ "id": 42, "status": "PAID" }     <- body
~~~
- **Method**: {{GET}} đọc (an toàn, idempotent — gọi nhiều lần kết quả vẫn vậy), {{POST}} tạo mới, {{PUT}} thay thế cả resource (idempotent), {{PATCH}} sửa một phần, {{DELETE}} xoá. Giữ đúng ngữ nghĩa method để cache/proxy làm đúng việc.
- **Status code** hay gặp (bảng dưới).

| Mã | Ý nghĩa | Dev Java thường gặp |
|---|---|---|
| 200 / 201 / 204 | thành công / đã tạo / thành công nhưng không có body | gọi API thành công |
| 301 / 304 | chuyển hướng vĩnh viễn / Not Modified (bản cache của client vẫn dùng được) | redirect, tiết kiệm băng thông |
| 400 / 401 / 403 | dữ liệu sai / chưa xác thực / đã xác thực nhưng không có quyền | validation, Spring Security |
| 404 / 409 / 422 | không thấy / xung đột trạng thái / dữ liệu không hợp lệ về nghiệp vụ | resource missing, version conflict |
| 429 | quá rate limit | gọi API bị chặn tần suất |
| 500 / 502 / 503 / 504 | lỗi server / gateway nhận phản hồi lỗi từ backend / tạm ngừng / gateway chờ backend quá lâu | code lỗi, hạ tầng lỗi |

- **Header** quan trọng với backend: {{Content-Type}}, {{Accept}}, {{Authorization}}, {{Cache-Control}}, {{X-Request-Id}} (định danh request để log tương quan).

### Keep-alive và HTTPS
~~~text
Không keep-alive (HTTP/1.0):                 Với keep-alive (HTTP/1.1):
Client         Server                        Client              Server
  --TCP handshake-->                           --TCP handshake-->
  --request-->                                 --request 1-->
  <--response--                                <--response 1--
  x (đóng)                                     --request 2-->   (dùng lại kết nối)
  --TCP handshake-->                           ...
  --request--...
~~~
HTTPS thêm bước bắt tay TLS **trước** khi nói HTTP:
~~~text
Client                                Server
  --- ClientHello (mã hỗ trợ) --------->
  <--- ServerHello + chứng chỉ --------
  (kèm tham số trao đổi khoá ECDHE)
  kiểm tra chứng chỉ: do CA tin cậy ký? đúng tên miền? còn hạn?
  --- tham số ECDHE của client --------->
  hai bên TỰ TÍNH ra cùng một khoá phiên (khoá không đi trên mạng)
  ====== HTTP chạy trong kênh đã mã hoá ======
~~~
- Chứng chỉ do CA (cơ quan phát hành uy tín) ký: chứng minh server đúng là {{api.example.com}}.
- **Vì sao cần hai loại khoá:** mã hoá **asymmetric** (cặp public/private key) chậm, chỉ dùng lúc bắt tay: chữ ký RSA/ECDSA trên chứng chỉ để chứng minh danh tính server, ECDHE để hai bên thỏa thuận khoá phiên. Sau đó dữ liệu được mã hoá bằng **symmetric** (AES-GCM, ChaCha20) vì nhanh hơn rất nhiều.
- TLS 1.3 chỉ cần **1 round-trip** để bắt tay (TLS 1.2 cần 2), đây là một lý do nên bật TLS 1.3.

### Đọc request thật để hiểu
~~~bash
curl -v https://api.example.com/orders/42
# -v in ra quá trình bắt tay TLS, request header curl gửi đi và response header nhận về
~~~

### Lỗi hay gặp
- **Không phân biệt 401 và 403**: 401 = chưa đăng nhập, 403 = đã đăng nhập nhưng không được phép.
- **Server trả 200 kèm body lỗi** thay vì 4xx/5xx → client và monitoring không phát hiện được lỗi.
- **Timeout không đặt** ở HTTP client Java → request treo kéo sập luồng xử lý; luôn đặt {{connectTimeout}}/{{readTimeout}}.
- **Không hiểu idempotency**: client retry {{POST}} sau timeout có thể tạo trùng; cần idempotency key ở tầng nghiệp vụ.
- **Cache nhầm**: response cá nhân hoá (số dư tài khoản) không {{Cache-Control: private, no-store}} → proxy/cache trả dữ liệu của người này cho người khác.

### Trả lời miệng 1 phút
"HTTP gồm request có method, path, header và body, response có status code, header và body. Status 2xx là thành công, 4xx là lỗi phía client (401 chưa đăng nhập, 403 thiếu quyền), 5xx là lỗi phía server. Keep-alive (mặc định ở HTTP/1.1) cho phép dùng lại kết nối TCP cho nhiều request, và HTTP/2 còn multiplex nhiều request trên một kết nối. HTTPS chạy HTTP trong lớp TLS: bắt tay xác thực server qua chứng chỉ rồi mã hoá symmetric toàn bộ phiên. Khi viết HTTP client trong Spring Boot, tôi luôn đặt timeout và xử lý đúng idempotency cho các method không an toàn."

### Ví dụ đời thực
**Bối cảnh:** Client mobile báo "đôi khi API trả 200 nhưng dữ liệu sai"; backend không thấy lỗi trong log.

**Triệu chứng:** Intermittent wrong data; monitoring chỉ thấy 200 OK.

**Điều tra:** Bật log {{X-Request-Id}} xuyên suốt; kiểm tra response header {{Cache-Control}}. Phát hiện response cá nhân hoá không có {{Cache-Control: private, no-store}}; CDN cache response của user A và trả cho user B.

**Nguyên nhân gốc:** Thiếu header cache-control cho endpoint cá nhân hoá.

**Cách xử lý:** Thêm {{Cache-Control: private, no-store}} ở endpoint; thêm test kiểm tra header; purge cache CDN.

**Kết quả đo được:** Sau deploy, incident wrong-data về 0 trong 2 tuần; cache hit rate của endpoint public không đổi.

> Senior tip: khi điều tra sự cố, đọc **đúng response header** ({{X-Request-Id}}, {{Server-Timing}}, {{Retry-After}}) trước khi đọc body — chúng cho biết request đi qua tầng nào, mất bao nhiêu thời gian, và nên retry sau bao lâu. Đây là kỹ năng điều tra API mà junior thường bỏ qua.`,
  follow: ['GET, POST, PUT, PATCH khác nhau thế nào về idempotency và khi nào dùng cái nào?', 'HTTPS bắt tay TLS gồm những bước nào, vì sao cần cả hai loại khoá asymmetric và symmetric?', '401 và 403 khác nhau thế nào, Spring Security trả hai mã này khi nào?'],
  tags: ['HTTP', 'HTTPS', 'TLS', 'header', 'status code', 'keep-alive', 'nhập môn']
},
{
  id: 'primer-011',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Maven và Gradle: dependency, scope và lifecycle là gì? Hai công cụ xử lý xung đột version thư viện ra sao?',
  a: `**Tóm tắt:**
- Maven và Gradle là **công cụ build cho Java**: tải thư viện (dependency), biên dịch, chạy test, đóng gói artifact (jar/war) và công bố lên repository.
- Dependency được khai báo theo **tọa độ** {{groupId:artifactId:version}}; **scope** (Maven) quyết định dependency dùng ở giai đoạn nào (compile, test, runtime...); **lifecycle** là chuỗi giai đoạn build có thứ tự cố định.
- Xung đột version: Maven chọn theo **độ gần** trong cây dependency (nearest-wins) và có {{dependencyManagement}} để chốt; Gradle chọn **version cao nhất** (newest-wins) và có {{resolutionStrategy}} để cưỡng chế.

### Hiểu nhanh
- **Maven** giống **người quản lý kho theo sổ cứng**: {{pom.xml}} là danh mục, có thứ tự giai đoạn cố định (quy tắc nhiều, nhưng "mọi thứ theo convention"). {{pom.xml}} khai báo gì Maven làm theo đúng vậy.
- **Gradle** giống **người quản lý kho viết bằng kịch bản linh hoạt**: {{build.gradle.kts}} có thể lập trình được, build nhanh hơn nhờ daemon và caching, nhưng dễ "tự làm khó mình" nếu tuỳ biến quá đà.
- Cả hai tải thư viện từ **repository**: local ({{~/.m2/repository}}) trước, thiếu thì tải từ Maven Central.

### Dependency và cây dependency
Khi khai báo {{spring-boot-starter-web}}, Maven/Gradle không chỉ tải mỗi artifact đó mà còn tải **toàn bộ thư viện mà nó phụ thuộc** (transitive dependency) — Spring MVC, Tomcat, Jackson...
~~~xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
  <version>3.3.4</version>
</dependency>
~~~
{{mvn dependency:tree}} (hoặc {{./gradlew dependencies}}) in ra cây: ai phụ thuộc ai — công cụ số một để chẩn đoán "sao có hai version Jackson?".

### Scope: dependency dùng ở đâu
| Scope | Compile | Test | Đóng vào artifact? | Ví dụ |
|---|---|---|---|---|
| compile (mặc định) | có | có | có | spring-boot-starter-web |
| provided | có | có | **không** | servlet-api (server đã có sẵn) |
| runtime | không | có | có | driver JDBC lúc chạy |
| test | chỉ test | có | không | JUnit, Mockito |
| import | dùng để nhập BOM | | | spring-boot-dependencies |

{{provided}} kiểu "mượn để viết nhưng không mang theo": viết code dùng servlet-api nhưng khi deploy, Tomcat thật đã có sẵn — mang theo sẽ trùng.

### Lifecycle và artifact
Maven (thứ tự cố định, {{mvn package}} chạy tới bước đóng gói):
~~~text
validate → compile → test → package → verify → install → deploy
           (biên dịch)  (JUnit)  (jar)          (cài vào máy) (đẩy lên kho chung)
~~~
- {{install}}: copy jar vào {{~/.m2}} để project khác trên máy dùng thử; {{deploy}}: đẩy lên Nexus/Artifactory/central.
- Gradle tương ứng: {{./gradlew build}} (bao gồm {{test}} và {{assemble}}), {{publish}} đẩy lên repository. Gradle dùng **daemon** (tiến trình giữ sẵn) + **build cache** nên build lại thường nhanh hơn Maven.

### BOM và dependencyManagement
{{spring-boot-dependencies}} là **BOM** (Bill of Materials): bảng "bộ version đã tương thích với nhau" do Spring Boot kiểm chứng.
~~~xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-dependencies</artifactId>
      <version>3.3.4</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
<!-- giờ khai báo starter không cần ghi version -->
~~~

### Xung đột version
Ví dụ project của bạn khai báo {{A}} và {{C}}; cây là {{app→A→X 1.0}} và {{app→C→D→X 2.0}}. Classpath chỉ chứa được **một** bản X, vậy chọn bản nào?
- **Maven**: chọn version **gần gốc nhất** (nearest-wins) → X 1.0 (độ sâu 2 so với 3); nếu bằng độ sâu thì bản khai báo trước thắng. Cưỡng chế bằng {{dependencyManagement}} hoặc {{<exclusion>}}.
- **Gradle**: chọn version **mới nhất** → X 2.0; cưỡng chế bằng {{resolutionStrategy.force}} hoặc {{failOnVersionConflict()}}.
- Cách sạch: dùng BOM và chỉ khai báo version ở **một chỗ**.

### Lỗi hay gặp
- **{{mvn package}} nhưng jar không có thư viện con** — quên {{spring-boot-maven-plugin}}, chạy {{java -jar}} báo {{no main manifest attribute}}.
- **Duplicate class / NoSuchMethodError**: hai dependency kéo hai version của cùng thư viện; {{dependency:tree}} để tìm và {{exclusion}}/chốt version.
- **Dùng version plugin quá cũ** để "cho chắc" — vá lỗ hổng không tới; nên dùng BOM của Spring Boot và nâng theo dòng {{3.x.y}}.
- **Không dùng wrapper** ({{gradlew}}, {{mvnw}}): mỗi máy một phiên bản Gradle/Maven, build lúc được lúc không; hãy commit wrapper vào git và luôn chạy {{./gradlew}} / {{./mvnw}}.
- **{{-SNAPSHOT}} lên môi trường dùng chung**: bản snapshot đổi từng giờ, build không tái lập được; môi trường thật chỉ pin version thường.

### Trả lời miệng 1 phút
"Maven và Gradle đều khai báo dependency theo tọa độ groupId, artifactId, version, tự tải transitive dependencies và build theo lifecycle — Maven có các phase cố định từ compile tới package và deploy, Gradle dùng task graph với daemon và cache. Scope quyết định dependency dùng ở đâu: test chỉ dùng khi test, provided thì không đóng vào artifact. Với xung đột version, Maven theo độ gần còn Gradle theo version mới nhất; tôi chặn việc này bằng BOM của Spring Boot qua dependencyManagement để chốt version toàn bộ dự án ở một chỗ."

### Ví dụ đời thực
**Bối cảnh:** Nâng Spring Boot từ 3.2 lên 3.3; build xanh nhưng runtime {{NoSuchMethodError}} ở production.

**Triệu chứng:** App crash khi gọi endpoint upload; stack trace {{NoSuchMethodError: org.apache.tomcat...}}.

**Điều tra:** {{mvn dependency:tree}} cho thấy hai version Tomcat (10.1.18 và 10.1.24) do transitive dependency; Maven chọn version gần gốc theo nearest-wins, không phải mới nhất.

**Nguyên nhân gốc:** Xung đột version Tomcat do dependency không được chốt.

**Cách xử lý:** Thêm Spring Boot BOM qua {{dependencyManagement}}; chạy {{mvn dependency:tree}} lại; thêm OWASP dependency-check vào CI.

**Kết quả đo được:** Build vẫn xanh; runtime không còn NoSuchMethodError; CI bắt được 1 CVE trong 1 tháng sau.

> Senior tip: thêm {{dependency-check}} (OWASP) hoặc SCA của CI vào pipeline để phát hiện thư viện dính lỗ hổng; kết hợp {{dependency:tree}} khi nâng version — nâng một starter có thể kéo theo hàng chục thư viện transitive, phải chạy test đầy đủ chứ không chỉ "build xanh".`,
  follow: ['Dependency scope provided khác runtime thế nào, vì sao servlet-api là provided?', 'Maven chọn version gần nhất, Gradle chọn version mới nhất — hệ quả và cách cưỡng chế ra sao?', 'BOM (dependencyManagement) giải quyết vấn đề gì mà khai báo version từng dependency không giải quyết được?'],
  tags: ['Maven', 'Gradle', 'dependency', 'scope', 'lifecycle', 'nhập môn']
},
{
  id: 'primer-012',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Nginx: reverse proxy và load balancing là gì? Vì sao Nginx thường đứng trước ứng dụng Spring Boot, và cấu hình cơ bản ra sao?',
  a: `**Tóm tắt:**
- Nginx là **web server / reverse proxy** hiệu năng cao: nhận request từ client rồi **chuyển (proxy) tới ứng dụng backend** (Spring Boot), đồng thời phục vụ static file, cân bằng tải và chấm dứt TLS.
- **Reverse proxy**: client nói chuyện với Nginx; Nginx nói chuyện với backend — client không biết backend tồn tại. Khác **forward proxy** (đứng phía client, giấu client với server).
- **Load balancing**: Nginx chia request cho nhiều instance backend. **TLS termination**: Nginx giữ chứng chỉ HTTPS, nói HTTP thường với backend bên trong — gánh nặng mã hoá tập trung một nơi.

### Hiểu nhanh
Nginx giống **lễ tân của toà nhà**:
- Khách (client) không đi thẳng vào từng phòng làm việc (backend); đến quầy lễ tân (Nginx) trước.
- Lễ tân nhận thư, phân phát cho nhân viên đang rảnh (load balancing), treo biển chỉ dẫn tĩnh (static file), và xử lý giấy tờ an ninh ở cửa (TLS) để nhân viên tập trung làm việc.
- Backend vì thế chỉ tập trung "làm việc nghiệp vụ", không phải lo chứng chỉ, không phải phục vụ file CSS.

### Vì sao cần Nginx trước Spring Boot
~~~text
Client ──HTTPS──> Nginx ──HTTP──> Spring Boot #1
                        └──────> Spring Boot #2
                        └──────> Spring Boot #3
~~~
1. **TLS termination**: chứng chỉ HTTPS nằm ở Nginx một chỗ; 3 instance backend không cần lo.
2. **Load balancing**: thêm/bớt instance backend mà client không đổi gì.
3. **Phục vụ static**: HTML, CSS, JS do Nginx trả (nhanh, không tốn luồng Java).
4. **Buffer request lớn**: upload file lớn được Nginx hứng trước, backend không bị "nghẹn".
5. **Thêm tầng bảo vệ**: rate limit, chặn IP xấu trước khi chạm backend.

### Cấu hình cơ bản
~~~text
# /etc/nginx/conf.d/api.conf
upstream backend {                    # nhóm backend
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    keepalive 32;                    # giữ kết nối tới backend cho nhanh
}

server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate     /etc/ssl/api.crt;      # chứng chỉ HTTPS
    ssl_certificate_key /etc/ssl/api.key;

    client_max_body_size 10m;        # giới hạn upload (tránh tràn RAM)

    location /api/ {
        proxy_pass http://backend;             # chuyển tới nhóm backend
        proxy_http_version 1.1;                # cần cho keepalive tới backend
        proxy_set_header Connection "";        # (2 dòng này đi cùng "keepalive 32")
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;   # nói cho backend biết client dùng https
        proxy_read_timeout 60s;        # thời gian chờ backend trả lời
    }

    location / {
        root /usr/share/nginx/html;    # static file
        try_files $uri /index.html;    # SPA fallback
    }
}
~~~
{{upstream}} định nghĩa nhóm backend; {{proxy_pass}} chuyển request; {{proxy_set_header}} **bắt buộc** để backend (Spring Boot) biết client thật, chứ không chỉ thấy IP của Nginx. Trong Spring Boot đặt {{server.forward-headers-strategy=framework}} để {{request.getRemoteAddr()}} và {{X-Forwarded-Proto}} hoạt động đúng.

### Load balancing: chọn phương pháp nào
| Phương pháp | Hoạt động | Khi nào dùng |
|---|---|---|
| round-robin (mặc định) | chia đều lần lượt | backend ngang sức |
| least_conn | gửi nơi đang ít kết nối nhất | request thời lượng khác nhau |
| ip_hash | cùng IP → cùng backend | cần "sticky" phiên |

Ngoài ra Nginx tự đánh dấu một backend là "hỏng" tạm thời khi kết nối lỗi liên tiếp ({{max_fails}}, {{fail_timeout}}) và chuyển request sang backend khác.

Cân bằng tải ở tầng Nginx thường đủ; khi lên Kubernetes thì Service/Ingress của K8s làm việc này, Nginx Ingress Controller vẫn là một lựa chọn phổ biến.

### Lỗi hay gặp
- **Quên {{X-Forwarded-*}}** → backend ghi log "client là 127.0.0.1", rate limit theo IP sai hết.
- **{{proxy_read_timeout}} quá ngắn** (mặc định 60s) → export báo cáo 5 phút bị 504; tăng timeout cho endpoint chậm hoặc chạy bất đồng bộ.
- **Quên {{client_max_body_size}}** → upload bị 413.
- **Gặp 502 Bad Gateway mà không biết đọc ở đâu**: 502 nghĩa là Nginx **không nhận được phản hồi hợp lệ** từ backend (backend chết, đang restart, sai cổng). Xem {{/var/log/nginx/error.log}} (thường thấy {{connect() failed (111: Connection refused)}}) và {{ss -tlnp}} trên máy backend.
- **Khai báo {{keepalive}} trong upstream nhưng quên {{proxy_http_version 1.1}}** → Nginx vẫn mở kết nối mới cho mỗi request, cấu hình keepalive không có tác dụng.

### Trả lời miệng 1 phút
"Nginx là reverse proxy: client chỉ nói chuyện với Nginx, Nginx chuyển request tới các instance backend và chia tải đều. Nó đảm nhận TLS termination để backend không lo chứng chỉ, phục vụ static file, và thêm các lớp như rate limit, giới hạn dung lượng upload. Tôi cấu hình bằng {{upstream}} để khai báo nhóm backend, {{proxy_pass}} để chuyển, và {{proxy_set_header}} để backend biết IP thật cũng như scheme https của client. Với endpoint chạy lâu, tôi tăng {{proxy_read_timeout}} thay vì để 504 cắt ngang."

### Ví dụ đời thực
**Bối cảnh:** Endpoint export báo cáo 5 phút trả 504 Gateway Timeout sau khi deploy Nginx mới.

**Triệu chứng:** User thấy 504; Nginx error log {{upstream timed out (110: Connection timed out)}}.

**Điều tra:** {{ss -tlnp}} backend đang listen; {{tail -f}} backend log cho thấy query chạy 4 phút 30 giây. So sánh {{proxy_read_timeout}} = 60s.

**Nguyên nhân gốc:** Timeout Nginx mặc định 60s ngắn hơn thời gian xử lý.

**Cách xử lý:** Tăng {{proxy_read_timeout 300s}} cho location export; hoặc chuyển sang async job + polling. Thêm {{X-Request-Id}} log xuyên suốt.

**Kết quả đo được:** Export thành công; p99 endpoint thường không đổi; không còn 504.

> Senior tip: khi backend trả 502/504, kiểm tra {{proxy_read_timeout}} và trạng thái backend trước khi đinh ninh "code lỗi"; và luôn log {{X-Request-Id}} xuyên suốt Nginx → backend → log hệ thống để truy vết một request cụ thể. Đây là kỹ năng điều tra sự cố production rất hay được phỏng vấn.`,
  follow: ['Reverse proxy khác forward proxy thế nào?', 'Nginx trả 502 Bad Gateway, bạn chẩn đoán theo trình tự nào?', 'X-Forwarded-For và X-Forwarded-Proto dùng để làm gì, thiếu chúng thì hệ quả gì?'],
  tags: ['Nginx', 'reverse proxy', 'load balancing', 'TLS', 'nhập môn']
},
{
  id: 'primer-013',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn RabbitMQ: exchange, queue, binding và ack là gì? Message đi từ producer tới consumer thế nào, và khi nào chọn RabbitMQ thay vì Kafka?',
  a: `**Tóm tắt:**
- RabbitMQ là **message broker** (trung gian trao đổi thông điệp): **producer** gửi message vào **exchange**, exchange phân phát theo **binding** vào các **queue**, **consumer** đọc từ queue.
- **Ack** là "phiếu xác nhận đã xử lý xong": consumer báo với broker để xoá message; không ack thì message được giao lại (redeliver) — nhờ đó không mất việc khi consumer chết giữa chừng.
- RabbitMQ chọn khi cần **hàng đợi công việc / pub-sub kiểu router** linh hoạt; Kafka chọn khi cần **log sự kiện cao throughput, đọc lại được** (xem primer-003).

### Hiểu nhanh
RabbitMQ giống **bưu điện trung gian**:
- Bạn (producer) mang thư tới quầy, không giao tay trực tiếp cho người nhận.
- Quầy trưởng (exchange) nhìn **địa chỉ và nhãn** rồi phân loại vào đúng ngăn kéo (queue) theo quy tắc (binding).
- Người nhận (consumer) tới lấy thư, đọc xong **bấm xác nhận** (ack) để bưu điện xoá; không bấm thì họ gửi lại.
- Một thư có thể vào nhiều ngăn kéo (fan-out cho nhiều đội) hoặc chỉ một ngăn (phân công một người).

### Luồng một message
~~~text
Producer --> Exchange --binding--> Queue --> Consumer
              (phân phát)          (chờ)     (xử lý, ack)
~~~
- **Queue**: hàng đợi lưu message chờ consumer; durable (có đĩa) thì sống qua restart broker.
- **Binding**: quy tắc nối exchange với queue, kèm **routing key** (nhãn định tuyến) — ví dụ binding {{order.*}} khớp {{order.created}}, {{order.paid}}.
- **Exchange types** (bảng dưới). Trong mẫu topic, {{*}} khớp đúng một từ, {{#}} khớp 0 hoặc nhiều từ.

| Type | Cách phân phát | Dùng cho |
|---|---|---|
| direct | khớp chính xác routing key | giao việc cho đúng queue |
| topic | khớp mẫu wildcard ({{order.*}}, {{*.paid}}) | pub-sub linh hoạt |
| fanout | gửi tới **mọi** queue đã bind, bỏ qua routing key | broadcast (xoá cache ở nhiều service) |
| headers | theo header message | ít dùng |


### Ack, redeliver và poison message
- Consumer xử lý xong gọi {{channel.basicAck(tag, false)}}; broker mới xoá message khỏi queue.
- Consumer chết **trước khi ack** → broker giao lại message cho consumer khác (**redeliver**) → không mất việc, nhưng **có thể xử lý trùng** → consumer phải **idempotent**.
- **Poison message** (message lỗi khiến consumer fail lặp lại) → cấu hình **dead-letter exchange** cho queue: message bị reject **không requeue**, hết TTL, hoặc vượt {{x-delivery-limit}} (quorum queue) sẽ bị chuyển sang **DLQ** (dead-letter queue) để xem xét và xử lý tay, không chặn cả hàng.
- **Prefetch** ({{basicQos}}): số message broker gửi trước cho consumer; đặt nhỏ (ví dụ 10) để chia đều việc giữa nhiều consumer, tránh một consumer "ôm" cả hàng.

### So sánh nhanh RabbitMQ và Kafka
| Tiêu chí | RabbitMQ | Kafka |
|---|---|---|
| Mô hình | hàng đợi, message **xoá sau khi đọc** | log append-only, **giữ theo retention** |
| Đọc lại | không (mỗi message giao cho một consumer) | có — mọi group đọc độc lập, đọc lại từ offset |
| Routing | linh hoạt (exchange + binding) | đơn giản theo partition |
| Throughput | cao (vài chục nghìn msg/s) | rất cao (hàng trăm nghìn+) |
| Khi chọn | job queue, RPC, pub-sub router | event stream, cần replay, phân tích luồng sự kiện |
Chọn: "gửi email khi có đơn, mỗi email một lần" → RabbitMQ; "phát sự kiện đơn hàng cho 10 service, sau này thêm service mới vẫn đọc lại được" → Kafka.

### RabbitMQ với Spring Boot
~~~java
// Gửi message (producer)
rabbitTemplate.convertAndSend("orders", "order.created", dto);

// Nhận message (consumer); queue "emails" được bind vào exchange "orders" với key "order.*"
@RabbitListener(queues = "emails")
public void on(OrderCreatedEvent e) {
    sendWelcomeEmail(e);   // PHẢI idempotent: message có thể bị giao lại
}
~~~
Spring AMQP mặc định dùng ack mode AUTO: hàm trả về bình thường thì container ack; ném exception thì message bị reject và **mặc định được requeue** ({{spring.rabbitmq.listener.simple.default-requeue-rejected=true}}). Nếu lỗi là vĩnh viễn (dữ liệu sai), message sẽ quay vòng mãi, vì vậy hãy bật retry có giới hạn ({{spring.rabbitmq.listener.simple.retry.enabled=true}}) để sau khi hết lượt thử message bị reject không requeue và đi vào DLQ.

### Lỗi hay gặp
- **Auto-ack quá sớm** (trước khi xử lý) → consumer chết là mất message vĩnh viễn. Luôn ack sau khi xử lý xong (hoặc xử lý bất đồng bộ có ghi trạng thái).
- **Không idempotent** → redeliver làm xử lý trùng (trừ kho hai lần, gửi email hai lần).
- **Không có DLQ** → một message "đầu độc" chặn cả hàng, không ai đọc được message sau nó.
- **Queue không durable + broker restart** → mất sạch hàng chờ; durable queue **và** persistent message mới sống qua restart.
- **Prefetch quá lớn** → một consumer ôm hết hàng, các consumer khác "ngồi chơi".
- **Chọn sai công cụ**: dùng Kafka làm hàng đợi cho job chạy lâu (một message chậm làm cả partition phía sau phải chờ, khó ack/retry từng message riêng lẻ); dùng RabbitMQ cho luồng sự kiện cần đọc lại thì message đã ack là mất, không replay được.

### Trả lời miệng 1 phút
"RabbitMQ là message broker: producer gửi vào exchange, exchange phân phát theo binding vào queue, consumer đọc và ack để xác nhận xử lý xong. Nếu consumer chết trước khi ack, message được giao lại, nên consumer phải idempotent; poison message thì đưa sang DLQ để không chặn hàng. Tôi dùng RabbitMQ cho hàng đợi công việc và pub-sub router linh hoạt, còn luồng sự kiện cần đọc lại và throughput cao thì chọn Kafka. Khi cấu hình, tôi bật durable queue, persistent message và giới hạn prefetch để chia đều việc."

### Ví dụ đời thực
  **Triệu chứng:** Dịch vụ email xác nhận (consumer {{notification-email}}) bỏ sót email. Queue {{order.events}} trên RabbitMQ Management UI tăng từ ~200 lên 12.000 message trong 2 giờ, dù producer chỉ ~50 msg/giây. Tỉ lệ {{redeliver}} nhảy từ <1% lên 38%. Users phàn nàn "đã thanh toán nhưng chưa nhận email".

  **Điều tra:** Mở Management UI → queue {{order.events}} thấy {{Messages ready}} tăng vọt, {{Messages unacknowledged}} dao động. Tab Consumers: instance {{notification-email-v2}} báo redeliver liên tục. Log consumer (Spring AMQP, ack AUTO) thấy {{NullPointerException}} khi parse message thiếu field {{couponCode=null}} — field mới thêm trong deploy trước. Vì {{default-requeue-rejected=true}} (mặc định), message reject → requeue ngay → message đó quay vòng mãi. Với {{prefetch=100}} (mặc định), consumer ôm 100 message; message đầu là poison → consumer kẹt, không xử lý message sau.

  **Nguyên nhân gốc:** (1) Poison message: dữ liệu thiếu field mới, consumer throw. (2) Auto-requeue=default true → message lặp mãi thay vì loại bỏ. (3) Không DLQ để tách message lỗi. (4) Prefetch 100 → một consumer bị poison message thì không phân phát lại message khác cho consumer khác.

  **Cách xử lý:** (1) Bật retry có giới hạn: {{spring.rabbitmq.listener.simple.retry.enabled=true}}, {{max-attempts=3}}; sau hết lượt → reject không requeue. (2) Cấu hình dead-letter exchange: {{x-dead-letter-exchange=order.dl}}, {{x-dead-letter-routing-key=order.failed}}. (3) {{default-requeue-rejected=false}}. (4) Giảm prefetch xuống 10-20. (5) Idempotency: bảng {{processed_events}} check event id trước khi gửi email.

  **Kết quả đo được:** Queue giảm từ 12.000 xuống <500 trong ~30 phút. Redeliver từ 38% xuống <0,5%. Message lỗi tự vào DLQ, xử lý bởi job nightly. Không còn email bỏ sót do poison message.

  > Senior tip: RabbitMQ Management UI (cổng 15672) cho thấy ngay độ sâu queue, tỉ lệ redeliver và kết nối consumer — hãy mở nó mỗi lần deploy để "nhìn" hàng đợi trước khi người dùng phàn nàn. Và với Spring Boot, bật publisher confirms ({{spring.rabbitmq.publisher-confirm-type=correlated}}) để biết message đã thực sự tới broker, chứ không chỉ "đã gọi gửi".`,
  follow: ['Ack và nack khác nhau thế nào, khi nào message bị redeliver?', 'Bạn xử lý thế nào khi consumer RabbitMQ bị crash giữa chừng và cần đảm bảo không mất việc?', 'Kafka khác RabbitMQ về mô hình lưu trữ và đọc lại ra sao, khi nào chọn cái nào?'],
  tags: ['RabbitMQ', 'exchange', 'queue', 'ack', 'message broker', 'nhập môn']
},
{
  id: 'primer-014',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn OAuth2 và OIDC: các bên tham gia và các token là gì? Luồng authorization code hoạt động từng bước thế nào?',
  a: `**Tóm tắt:**
- OAuth2 là giao thức **ủy quyền** (authorization): cho một ứng dụng (**client**) quyền truy cập tài nguyên của người dùng (**resource owner**) mà **không cần biết mật khẩu**. OIDC (OpenID Connect) xây trên OAuth2, thêm **xác thực** (authentication): "user này là ai" thông qua {{id_token}}.
- Các bên: **resource owner** (người dùng), **client** (app cần quyền), **authorization server** (Google, Keycloak... cấp token), **resource server** (API của bạn, bảo vệ tài nguyên).
- Luồng **authorization code**: user đăng nhập và đồng ý tại authorization server → server trả **mã code** (ngắn hạn, dùng một lần) → client đổi code lấy **access token** (dùng gọi API) và **id_token** (OIDC, chứa danh tính user).

### Hiểu nhanh
Giống **ở khách sạn**:
- Bạn (resource owner) thuê phòng 12 và muốn **dịch vụ giặt ủi bên ngoài** (client) vào phòng lấy đồ.
- Bạn không đưa thẻ phòng chính của mình (mật khẩu). Bạn ra **quầy lễ tân** (authorization server), xác nhận danh tính, đồng ý cấp cho tiệm giặt một **thẻ từ tạm** (access token) ghi rõ quyền: "chỉ mở phòng 12, chỉ trong 1 giờ" (scope + thời hạn).
- Nhân viên giặt ủi quẹt thẻ tạm, **khoá cửa phòng** (resource server) kiểm tra thẻ còn hạn, đúng phòng thì mở. Hết giờ thẻ tự vô hiệu, bạn cũng có thể báo lễ tân huỷ thẻ bất cứ lúc nào.
- OIDC thêm một thứ: lễ tân đưa cho tiệm giặt **tờ giấy xác nhận "khách phòng 12 là anh Nam"** (id token), để họ biết đang phục vụ ai.

### Các bên và token
| Thuật ngữ | Là gì | Ví dụ |
|---|---|---|
| Resource owner | chủ tài nguyên, chủ account | người dùng Facebook |
| Client | app muốn truy cập | app Java web của bạn |
| Authorization server | cấp token, đăng nhập | Google, Keycloak, Auth0 |
| Resource server | API bảo vệ bằng token | REST API Spring Boot |
| Access token | "thẻ ra vào" gọi API | JWT hoặc opaque string |
| ID token | JWT nói user là ai (OIDC) | chứa sub, name, email |
| Refresh token | gia hạn access token khi hết hạn | lưu an toàn phía client |

**OAuth2 ≠ xác thực**: OAuth2 trả lời "được phép làm gì"; OIDC thêm câu trả lời "user là ai". Muốn đăng nhập bằng Google thì cần OIDC (id_token), không chỉ OAuth2 thô.

### Luồng authorization code từng bước
~~~text
1. User bấm "Đăng nhập bằng Google" ở app Java
2. Browser chuyển tới Google (authorization server):
      /o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=openid email&state=xyz
3. User đăng nhập Google và bấm "Cho phép"
4. Google redirect về redirect_uri của app kèm MÃ CODE:
      https://app.example.com/callback?code=4/0Axxx&state=xyz
5. App (backend) gọi token endpoint của Google, kèm code + client_secret:
      POST https://oauth2.googleapis.com/token
      code=4/0Axxx&client_id=...&client_secret=...&grant_type=authorization_code
6. Google trả JSON gồm access_token, id_token (và refresh_token nếu app xin quyền offline)
7. App lưu session, dùng access_token gọi Google API nếu cần,
   hoặc verify id_token (JWT) để lấy email và đăng nhập user
~~~
- **{{state}}**: mã ngẫu nhiên chống **CSRF** — app sinh ra khi bắt đầu luồng, kiểm tra khi quay về; thiếu nó attacker có thể "ghép" code của nạn nhân vào phiên của kẻ tấn công.
- **{{code}}** đi qua browser (không hiển thị cho user, ngắn hạn, dùng một lần); **token** được đổi bằng lời gọi server-to-server từ backend (kèm client_secret), không đi qua browser — đây là lý do authorization code an toàn hơn các luồng cũ.

### PKCE là gì và vì sao cần
Với app mobile/SPA không giữ được {{client_secret}} bí mật, **PKCE** thêm bước: client tạo mã ngẫu nhiên {{code_verifier}}, gửi **băm** {{code_challenge}} lúc bắt đầu, rồi gửi {{code_verifier}} nguyên vẹn lúc đổi token — server so sánh; attacker đánh cắp được code cũng không có verifier để đổi. Nên bật PKCE cho mọi client public.

### Spring Boot tích hợp (Spring Security)
~~~yaml
# application.yml: đăng nhập bằng Google (OIDC)
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: \${GOOGLE_CLIENT_ID}
            client-secret: \${GOOGLE_CLIENT_SECRET}
            scope: openid, profile, email
~~~
Với dependency {{spring-boot-starter-oauth2-client}} và {{http.oauth2Login(Customizer.withDefaults())}} trong {{SecurityFilterChain}}, Spring Security tự lo redirect, kiểm tra state, đổi code lấy token, verify id_token và tạo session. Còn API (resource server) nhận access token dạng JWT thì dùng {{spring-boot-starter-oauth2-resource-server}} và cấu hình {{spring.security.oauth2.resourceserver.jwt.issuer-uri}}.

### Lỗi hay gặp
- **Gửi client_secret trong JavaScript (SPA)** — lộ ngay; SPA phải dùng PKCE và public client.
- **Không validate {{state}}** → dính CSRF trong luồng đăng nhập.
- **Không verify chữ ký/aud/iss của id_token** → attacker tự tạo JWT giả.
- **Access token lưu localStorage** (SPA) → dính XSS; ưu tiên cookie HttpOnly + CSRF token, hoặc backend giữ token.
- **Nhầm OAuth2 với đăng nhập**: dùng OAuth2 thuần (không OIDC) rồi tự "suy ra" user từ access token gọi Google — sai bản chất; dùng OIDC cho authentication.

### Trả lời miệng 1 phút
"OAuth2 là giao thức ủy quyền: client không biết mật khẩu user mà nhận access token từ authorization server để gọi resource server. OIDC xây trên OAuth2 và thêm id_token để xác thực user là ai. Luồng authorization code gồm: user đăng nhập và đồng ý tại authorization server, server redirect về app kèm mã code, backend đổi code lấy access token và id_token, rồi verify id_token để đăng nhập. Tôi luôn dùng PKCE cho client public, validate state chống CSRF, và chỉ lưu secret ở backend."

### Ví dụ đời thực
  **Bối cảnh:** App web của công ty có tính năng "đăng nhập bằng Google". Đội backend vừa triển khai bản mới với Spring Security OAuth2 Client.

  **Triệu chứng:** User báo "bấm đăng nhập Google xong, bị quay về trang login, không vào được". Lượng báo tăng nhanh; ~30% người dùng không đăng nhập được. Khi debug, dev thấy redirect tới Google thành công, Google trả code về redirect_uri, nhưng backend báo "invalid_grant" khi đổi token.

  **Điều tra:** Kiểm tra log backend (filter {{OAuth2LoginAuthenticationProvider}}): {{invalid_grant}} — nghĩa là code đã dùng hoặc expired. Kiểm tra {{state}}: log ghi {{state mismatch}} ở một số request. Kiểm tra cookie session: app dùng {{SameSite=Lax}} nhưng redirect_uri của app khác (tên domain mới) nên cookie không gửi khi redirect về domain mới. Đồng thời, trong CI, {{client_secret}} được inject bằng env var nhưng deploy production lại quên set → secret rỗng, Google reject.

  **Nguyên nhân gốc:** (1) {{state}} mismatch do cookie {{SameSite}} không gửi cross-site khi redirect về domain mới (khoảng cách deploy). (2) {{client_secret}} rỗng trên production do env var quên set. (3) Code được dùng 1 lần: dev debug nhiều lần bằng cùng redirect_uri → code đã hết hạn.

  **Cách xử lý:** (1) Set {{client_secret}} trong Secrets Manager, validate deploy script check non-empty. (2) Chuyển sang cookie-based session (backend giữ token) thay vì localStorage, hoặc set {{SameSite=None; Secure}} nếu cần cross-site. (3) Kích hoạt PKCE ({{authorization_code+PKCE}}) để client public không cần secret. (4) Validate {{state}} bắt buộc; nếu mismatch → redirect về login, không tự động retry.

  **Kết quả đo được:** Sau deploy, tỉ lệ đăng nhập thành công từ ~70% lên 99,2%. {{invalid_grant}} giảm về 0; không còn {{state mismatch}}. Dev debug code nhanh hơn nhờ PKCE (không cần secret).

  > Senior tip: khi chọn nhà cung cấp identity, đừng chỉ so số tính năng — hãy xem **cửa sổ thu hồi token** và hỗ trợ refresh token rotation; "đăng xuất khỏi mọi thiết bị" hay "khóa tài khoản bị đánh cắp" có nhanh hay không phụ thuộc vào cấu hình này, và là câu hỏi phỏng vấn thực tế cho Senior.`,
  follow: ['OAuth2 và OIDC khác nhau thế nào, vì sao đăng nhập bằng Google cần OIDC?', 'PKCE giải quyết vấn đề gì, nó hoạt động ra sao?', 'Access token và id_token khác nhau về mục đích và cách kiểm tra ra sao?'],
  tags: ['OAuth2', 'OIDC', 'authorization code', 'token', 'nhập môn']
},
{
  id: 'primer-015',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn gRPC: protobuf là gì và gRPC dùng HTTP/2 thế nào? Khi nào chọn gRPC thay REST cho service nội bộ?',
  a: `**Tóm tắt:**
- gRPC là **framework RPC** (remote procedure call): gọi hàm trên máy khác **giống gọi hàm local**, dùng **protobuf** làm định dạng message (nhỏ, nhanh) và **HTTP/2** làm giao thức vận chuyển.
- **Protobuf** là **IDL** (ngôn ngữ định nghĩa giao thức): khai báo message/service một lần trong file {{.proto}}, compiler sinh code Java (và client stub) — hai side tự nhất quán kiểu dữ liệu.
- Chọn gRPC cho **service-to-service nội bộ** cần hiệu năng/streaming; giữ REST cho **API công khai, trình duyệt, đối tác** cần JSON dễ đọc.

### Hiểu nhanh
- **REST** giống **bưu điện gửi thư JSON**: mỗi request một envelop, ai cũng mở ra đọc được (text), linh hoạt nhưng tốn công đóng gói/mở gói.
- **gRPC** giống **đường dây điện thoại có sẵn kịch bản**: hai bên thống nhất sẵn "bộ đàm" (protobuf), nói bằng tín hiệu nhị phân nén (nhỏ, nhanh), một cuộc gọi nói được nhiều lượt (streaming) trên cùng kết nối HTTP/2.

### Protobuf: khai báo một lần, sinh code hai bên
~~~text
// file order.proto
syntax = "proto3";
package order;

message OrderRequest {
  int64  order_id = 1;    // số thứ tự field (KHÔNG tái sử dụng khi đổi tên)
  string customer = 2;
}

message OrderResponse {
  string status = 1;
  int64  total_cents = 2;   // tiền: dùng số nguyên (xu), không dùng double
}

service OrderService {          // định nghĩa "giao diện" RPC
  rpc GetOrder (OrderRequest) returns (OrderResponse);
  rpc WatchOrders (OrderRequest) returns (stream OrderResponse); // server stream
}
~~~
- {{protoc}} (thường chạy qua plugin Maven/Gradle) sinh code Java: phía server bạn kế thừa lớp {{OrderServiceGrpc.OrderServiceImplBase}} và override {{getOrder}}; phía client dùng stub {{OrderServiceGrpc.newBlockingStub(channel)}} để gọi như gọi hàm thường.
- Field mã hoá nhị phân kèm **số thứ tự field** (1, 2...), không kèm tên → rất nhỏ; đổi tên field giữ nguyên số thứ tự thì vẫn tương thích.

### HTTP/2: vì sao gRPC nhanh
| Khía cạnh | HTTP/1.1 (REST thường) | HTTP/2 (gRPC) |
|---|---|---|
| Kết nối | mỗi kết nối chỉ xử lý 1 request tại một thời điểm | **multiplex** nhiều request (stream) song song trên 1 kết nối |
| Dữ liệu | text (JSON) | binary (protobuf nén) |
| Header | text, lặp lại | HPACK nén |
| Streaming | khó (cần SSE/WebSocket) | có sẵn: unary, server/client/bidi stream |

HTTP/2 bỏ được head-of-line blocking ở tầng HTTP (request chậm không còn chặn request khác trên cùng kết nối; ở tầng TCP vẫn còn khi mất gói) và giảm kích thước message — hai nguồn tiết kiệm lớn nhất trong gọi nội bộ hàng nghìn lần/giây.

### Khi nào chọn gRPC, khi nào REST
| Tiêu chí | gRPC | REST/JSON |
|---|---|---|
| Độ trễ, payload | thấp, nhỏ | cao hơn, to hơn |
| Public API cho browser | cần gRPC-Web + proxy | JSON tự nhiên |
| Streaming | chính danh (unary, server, client, bidi) | SSE/WebSocket (phức tạp hơn) |
| Contract | protobuf (chặt, sinh code) | OpenAPI (tuỳ chọn, linh hoạt hơn) |
| Tooling | cần công cụ protobuf | curl, Postman, mọi nơi |
- **Chọn gRPC**: service nội bộ gọi nhau dày đặc, latency quan trọng, team kiểm soát cả hai side, cần stream (theo dõi đơn hàng real-time).
- **Chọn REST**: API cho đối tác/mobile web, cần debug bằng curl, nhiều team/ngôn ngữ khác nhau.
- Kiến trúc thực tế: **cả hai** — gRPC nội bộ, REST/JSON ở biên (API gateway dịch gRPC sang REST cho client).

### Lưu ý với Spring Boot
Spring Boot 3.x không có starter gRPC trong bộ starter chuẩn. Lựa chọn phổ biến: dự án **Spring gRPC** (spring-projects/spring-grpc, còn mới), thư viện cộng đồng {{net.devh:grpc-server-spring-boot-starter}}, hoặc tự dựng server bằng thư viện {{io.grpc}} chính thống. Server mở cổng gRPC riêng (vd 9090) song song HTTP 8080.

### Lỗi hay gặp
- **Không đặt deadline/timeout** khi gọi gRPC → downstream treo kéo sập cả upstream; {{withDeadlineAfter}} là bắt buộc.
- **Đổi protobuf sai cách**: tái sử dụng số field cũ cho field mới, hoặc đổi kiểu dữ liệu → lỗi decode im lặng hoặc crash; chỉ **thêm** field, {{reserved}} các số đã bỏ.
- **Gọi blocking stub từ bên trong luồng event loop** (ví dụ trong handler của Netty/WebFlux) → chặn event loop, cả service chậm theo; ở đó dùng async stub ({{newStub}}) hoặc {{newFutureStub}}.
- **Mong load balancing tự nhiên**: kết nối HTTP/2 giữ lâu, một client có thể dồn hết vào **một** server; cần client-side LB ({{round_robin}}), service mesh, hoặc nhiều kết nối.
- **Đem gRPC ra biên cho trình duyệt** mà không có grpc-web/proxy → trình duyệt không hiểu được, phải có API gateway dịch.

### Trả lời miệng 1 phút
"gRPC là RPC dùng protobuf làm định dạng message và HTTP/2 làm giao thức. Protobuf là IDL: khai báo message và service một lần trong file .proto, protoc sinh code Java cho cả client và server, message mã hoá nhị phân kèm số thứ tự field nên rất nhỏ. HTTP/2 cho phép multiplex nhiều stream trên một kết nối và nén header, nên độ trễ và băng thông tốt hơn REST/JSON. Tôi chọn gRPC cho service nội bộ cần hiệu năng hoặc streaming, giữ REST cho API công khai; và luôn đặt deadline khi gọi, không tái sử dụng số field protobuf."

### Ví dụ đời thực
  **Bối cảnh:** Hệ thống thanh toán nội bộ: {{payment-service}} (Java, gRPC) gọi {{fraud-service}} (Go, gRPC) để kiểm tra gian dận. Gọi ~500 req/s, p99 latency 12ms. Sau khi thêm 1 service mới, p99 tăng lên 85ms, và một số request timeout (deadline 100ms).

  **Triệu chứng:** p99 tăng; metric {{grpc_client_latency}} (Prometheus) cho thấy 80% thời gian ở {{fraud-service}} handling. Kiểm tra interceptor: trace OpenTelemetry chỉ thấy 60% request có trace — trace "mù" với gRPC.

  **Điều tra:** (1) Kiểm tra load balancing: client gRPC dùng {{round_robin}} nhưng kết nối HTTP/2 giữ lâu; 1 instance {{fraud-service}} nhận 70% traffic do connection affinity. (2) Kiểm tra deadline: client không set deadline → downstream treo kéo sập upstream. (3) Kiểm tra interceptor: không gắn trace context vào gRPC metadata → distributed tracing mất một phần.

  **Nguyên nhân gốc:** (1) Connection affinity: HTTP/2 multiplex nhưng một client có thể dồn vào một server. (2) Thiếu deadline khi gọi gRPC → downstream treo kéo sập cả upstream. (3) Thiếu interceptor gRPC để gắn trace context → distributed tracing "mù" với mọi luồng gRPC.

  **Cách xử lý:** (1) Client-side LB: {{round_robin}} hoặc service mesh (Istio/Linkerd). (2) Đặt deadline: {{withDeadlineAfter(Duration.ofMillis(80))}}. (3) Thêm gRPC interceptor để gắn trace context (OpenTelemetry). (4) Thêm retry có giới hạn: chỉ retry trên các error có thể retry được (UNAVAILABLE, RESOURCE_EXHAUSTED), không retry DEADLINE_EXCEEDED.

  **Kết quả đo được:** p99 giảm từ 85ms xuống 18ms. Tỉ lệ request timeout từ 5% xuống 0%. Trace coverage từ 60% lên 99%.

  > Senior tip: với hệ thống nhiều service, một kiến trúc phổ biến là **REST ở biên (client) + gRPC bên trong**; và nếu cần quan sát, dùng interceptor của gRPC để gắn trace context (OpenTelemetry) — thiếu nó, distributed tracing sẽ "mù" với mọi luồng gRPC, rất khó điều tra sự cố.`,
  follow: ['Protobuf mã hoá nhị phân thế nào, vì sao số thứ tự field quan trọng cho tương thích?', 'Deadline và retry nên cấu hình thế nào khi gọi gRPC, vì sao không retry mọi lỗi?', 'Khi nào cần API gateway dịch giữa gRPC và REST?'],
  tags: ['gRPC', 'protobuf', 'HTTP/2', 'RPC', 'nhập môn']
},
{
  id: 'primer-016',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn Elasticsearch: inverted index là gì, mapping và analyzer đóng vai trò thế nào? Khi nào hệ thống của bạn cần Elasticsearch thay vì LIKE trên PostgreSQL?',
  a: `**Tóm tắt:**
- Elasticsearch (ES) là **engine tìm kiếm toàn văn (full-text search) và phân tích dữ liệu**, xây trên **inverted index**: từ khóa → danh sách tài liệu chứa nó, cho phép tìm nhanh kể cả với hàng triệu bản ghi.
- **Mapping** mô tả kiểu dữ liệu từng trường (giống schema); **analyzer** quyết định text được "cắt" ra sao (tokenize, bỏ dấu, thường hoá) — mapping hoặc analyzer sai thì truy vấn trả kết quả sai.
- **OpenSearch** là bản fork mã nguồn mở của Elasticsearch (do AWS khởi xướng, có dịch vụ Amazon OpenSearch Service); khái niệm trong bài này áp dụng cho cả hai.
- Cần ES khi phải **tìm full-text, tìm gần đúng, facet/aggregation phức tạp trên dữ liệu lớn**; còn dữ liệu quan hệ, cần transaction và JOIN thì dùng PostgreSQL ({{LIKE '%...%'}} chỉ hợp với bảng nhỏ).

### Hiểu nhanh
- **PostgreSQL** giống **hồ sơ xếp ngăn kéo theo ID**: tra nhanh theo khoá, nhưng "tìm tất cả tài liệu nhắc từ 'khách sạn' trong 10 triệu bản" thì phải lướt từng trang — chậm.
- **ES** giống **mục lục từ khoá ở cuối quyển sách**: mục lục ghi "biển → trang 12, 48, 103"; muốn biết tài liệu nào chứa từ chỉ tra mục lục — **nhanh dù sách dày**. Mục lục đó chính là **inverted index**.

### Inverted index hoạt động thế nào
~~~text
Tài liệu:                       Inverted index (sau khi analyzer cắt từ):
 1: "Khách sạn gần biển"         khách -> [1]
 2: "Spa cao cấp"                sạn   -> [1]
 3: "Gần chợ đêm"                gần   -> [1, 3]   <- một từ trỏ tới NHIỀU tài liệu
                                 biển  -> [1]
                                 spa   -> [2]
                                 cao   -> [2]
                                 cấp   -> [2]
                                 chợ   -> [3]
                                 đêm   -> [3]
~~~
Truy vấn {{gần biển}}: tra "gần" → [1, 3], tra "biển" → [1]. Tài liệu 1 khớp cả hai từ nên điểm cao nhất, tài liệu 3 khớp một từ nên xếp sau. Không phải quét từng tài liệu, vì vậy 10 triệu tài liệu vẫn thường trả lời trong vài chục ms.

### Index, document, mapping
- **Index**: "bảng" của ES (từng index thường có nhiều **shard** để chia dữ liệu và **replica** để dự phòng).
- **Document**: một bản ghi JSON.
- **Mapping**: mô tả kiểu trường:
~~~json
{
  "mappings": {
    "properties": {
      "title":    { "type": "text",
                    "fields": { "raw": { "type": "keyword" } } },
      "category": { "type": "keyword" },
      "price":    { "type": "scaled_float", "scaling_factor": 100 },
      "created":  { "type": "date" }
    }
  }
}
~~~
- {{text}}: được analyzer cắt thành từ, dùng để **tìm kiếm full-text** ({{title}}).
- {{keyword}}: giữ nguyên cả chuỗi, dùng để **lọc chính xác, sort, aggregation** ({{category}}).
- {{title.raw}} là **multi-field**: cùng một giá trị được index hai cách, tìm kiếm bằng {{title}}, sort bằng {{title.raw}}.

**text vs keyword** là lỗi kinh điển: field dạng {{text}} đã bị cắt thành từng từ nên **không** sort/group theo giá trị gốc được (mặc định ES còn báo lỗi khi aggregate trên field text).

### Analyzer: biến text thành token
Analyzer chạy 3 bước theo thứ tự:
1. **Character filter**: sửa chuỗi gốc theo từng ký tự (ví dụ bỏ thẻ HTML).
2. **Tokenizer**: cắt chuỗi thành các token (theo khoảng trắng, dấu câu).
3. **Token filter**: biến đổi từng token: viết thường ({{lowercase}}), bỏ dấu ({{asciifolding}}), bỏ stopword, đưa về gốc từ (stemming).

Analyzer chạy **hai lần**: lúc index tài liệu và lúc phân tích câu truy vấn, nên hai bên phải cắt cùng một cách thì mới khớp.
Ví dụ "Tìm Khách Sạn Near Beach" với {{standard}} analyzer (cắt từ + viết thường, **không** bỏ dấu) → token {{tìm}}, {{khách}}, {{sạn}}, {{near}}, {{beach}}. Đổi analyzer thì phải **reindex** toàn bộ — vì index đã lưu token theo analyzer cũ.

### Khi nào cần ES vs LIKE trên PostgreSQL
| Nhu cầu | PostgreSQL | Elasticsearch |
|---|---|---|
| Tra theo khoá chính/id | rất nhanh | nhanh nhưng thừa |
| Full-text, gõ sai chính tả, không dấu ({{pho}} khớp {{phở}}) | làm được với {{tsvector}} + {{unaccent}}/{{pg_trgm}}, ổn ở quy mô vừa | mạnh, có sẵn fuzzy, highlight, xếp hạng |
| Filter + sort + facet trên triệu bản ghi | chậm nếu không tối ưu | mạnh |
| Transaction, JOIN, ràng buộc nghiệp vụ | mạnh | **không có** |
| Dữ liệu < ~1 triệu dòng, query đơn giản | đủ | thừa, thêm độ phức tạp |

{{LIKE '%biển%'}} có ký tự % ở đầu nên B-tree index không dùng được, PostgreSQL phải quét toàn bảng: 10 triệu dòng có thể mất vài giây mỗi truy vấn.

Công thức chọn: **PostgreSQL là nguồn dữ liệu chính (source of truth)**; ES chỉ là **bản sao tối ưu cho tìm kiếm**, đồng bộ bằng CDC (Debezium) hoặc outbox. Không bao giờ coi ES là nơi ghi nguồn.

### Lỗi hay gặp
- **Dùng {{text}} cho field cần filter/sort/aggregate** → kết quả sai hoặc chậm; phân biệt text/keyword từ đầu.
- **Không đặt analyzer đúng ngôn ngữ** (tiếng Việt cần analyzer có bỏ dấu/viết thường) → "khách sạn" không khớp "Khach San".
- **Query wildcard {{*keyword*}}** ở đầu từ → quét index, chậm như LIKE %...%; dùng analyzer/match thay thế.
- **Không lên kế hoạch reindex**: đổi kiểu field hoặc analyzer thì phải tạo index mới và chạy {{_reindex}}; làm không downtime bằng cách đọc/ghi qua **alias** rồi chuyển alias sang index mới khi xong.
- **Cluster luôn vàng (yellow)**: chạy một node nhưng đặt replica=1, replica không có chỗ để đặt. Yellow nghĩa là dữ liệu vẫn đọc ghi được nhưng không có bản dự phòng; production nên có ít nhất 3 node.

### Trả lời miệng 1 phút
"Elasticsearch dùng inverted index: từ khoá trỏ tới danh sách tài liệu chứa nó, nên tìm full-text nhanh dù dữ liệu lớn. Mapping mô tả kiểu từng trường, và tôi phân biệt text (tìm full-text) với keyword (filter/sort/aggregate). Analyzer quyết định text được tokenize ra sao, quan trọng với tiếng Việt. Tôi chỉ thêm ES khi bài toán là tìm kiếm mờ, facet phức tạp trên dữ liệu lớn; còn transaction và nguồn dữ liệu chính vẫn để ở PostgreSQL, đồng bộ sang ES bằng CDC."

### Ví dụ đời thực
  **Bối cảnh:** App tìm kiếm sản phẩm (10 triệu sản phẩm). Ban đầu dùng PostgreSQL {{LIKE '%...%'}}. Sau khi dữ liệu tăng, trang tìm kiếm thường mất 5-10 giây khi người dùng gõ từ khóa.

  **Triệu chứng:** Trang tìm kiếm bị chậm (p99 8s). PostgreSQL log thấy query {{SELECT ... FROM products WHERE name ILIKE '%điện thoại%'}} quét toàn bảng (Seq Scan). CPU DB 90%. Người dùng bỏ đi.

  **Điều tra:** Kiểm tra EXPLAIN: Seq Scan trên 10 triệu dòng. Kiểm tra index: không có index cho {{name}}. Kiểm tra ES: chưa dùng ES; chỉ dùng PostgreSQL.

  **Nguyên nhân gốc:** Dùng {{LIKE '%...%'}} trên bảng lớn → B-tree index không dùng được (ký tự {{%}} ở đầu). PostgreSQL phải quét toàn bảng mỗi truy vấn. Với 10 triệu sản phẩm, mỗi query mất vài giây.

  **Cách xử lý:** (1) Triển khai Elasticsearch làm bản sao tối ưu cho tìm kiếm. (2) Đồng bộ bằng CDC (Debezium) hoặc outbox. (3) Mapping: {{name}} là {{text}} với analyzer tiếng Việt (bỏ dấu, viết thường), {{category}} là {{keyword}} (filter/sort/aggregate). (4) Dùng alias để reindex không downtime. (5) Giữ PostgreSQL là nguồn dữ liệu chính (source of truth), chỉ dùng ES để tìm kiếm.

  **Kết quả đo được:** Sau khi triển khai, p99 tìm kiếm từ 8s xuống 80ms. CPU DB từ 90% xuống 30%. Tỉ lệ bỏ đi do chậm từ 40% xuống <5%.

  > Senior tip: đo **cluster health và phân bổ shard** trước khi mở rộng node; và với tiếng Việt, hãy tự kiểm tra analyzer ("Khách sạn" vs "khach san" có khớp không) ngay từ đầu — sai analyzer chỉ lộ ra khi đã có dữ liệu và chi phí reindex rất đắt.`,
  follow: ['Text và keyword khác nhau thế nào, khi nào cần dùng cả hai cho một trường?', 'PostgreSQL và Elasticsearch nên đồng bộ theo hướng nào, vì sao không ghi trực tiếp vào ES?', 'Analyzer sai thì hậu quả và cách sửa (reindex) ra sao?'],
  tags: ['Elasticsearch', 'inverted index', 'mapping', 'full-text search', 'nhập môn']
},
{
  id: 'primer-017',
  topic: 'primer',
  level: 'mid',
  q: 'Nhập môn CI/CD: continuous integration và continuous delivery khác nhau thế nào? Pipeline build-test-deploy gồm những stage nào, artifact đi qua các môi trường ra sao?',
  a: `**Tóm tắt:**
- **Continuous Integration (CI)**: mỗi lần commit/push, pipeline **tự động build + chạy test** để phát hiện lỗi sớm, thay vì "dồn code cả tháng rồi mới ghép lại và test".
- **Continuous Delivery (CD)**: mọi thay đổi đã qua pipeline đều ở trạng thái **có thể release**; **Continuous Deployment** còn tiến thêm một bước: **tự động lên production** khi xanh.
- Pipeline điển hình: **build → test → (scan) → package artifact → deploy môi trường → smoke test**; nguyên tắc then chốt: **build một lần, artifact đi qua các môi trường** (DEV → SIT/UAT → PROD), không build lại ở môi trường sau.

### Hiểu nhanh
- **Trước CI/CD**: mỗi dev "chạy được trên máy tôi" rồi email file jar cho anh vận hành deploy tay lúc nửa đêm — hàng tuần mới dám release, mỗi lần release là một sự kiện hồi hộp.
- **CI**: nhà máy có **dây chuyền kiểm tra tự động** ngay sau khi công nhân thao tác (commit) — lỗi được bắt tại chỗ.
- **CD**: sản phẩm đạt chuẩn thì **luôn sẵn sàng trên kệ** để giao khách bất cứ lúc nào; release không còn là "đêm giao thừa" mà là việc bình thường, nhỏ và thường xuyên.

### Pipeline gồm stage nào
~~~text
commit/push
    |
    v
[1] Build          mvn package (hoặc gradlew build)
    |
    v
[2] Unit test      JUnit/Mockito: fail thì dừng pipeline, báo về người commit
    |
    v
[3] Quality gate   SAST / dependency check / code coverage (tùy team)
    |
    v
[4] Package        jar/war hoặc docker image — ĐÂY LÀ ARTIFACT DUY NHẤT
    |
    v
[5] Deploy DEV     tự động sau khi merge vào nhánh chính
    |
    v
[6] Integration/E2E test trên DEV (hoặc SIT)
    |
    v
[7] Deploy SIT/UAT (tự động hoặc 1-click), chạy test nghiệp vụ
    |
    v
[8] Approve + Deploy PROD   (Continuous Delivery: cần bấm; CD tự động: tự đi)
    |
    v
[9] Smoke test + monitoring   nếu đỏ thì rollback
~~~

### Artifact: build một lần, promote qua môi trường
- **Artifact** là sản phẩm đóng gói **không đổi** giữa các môi trường: jar Maven hoặc image Docker.
- Nguyên tắc **build once, deploy many**: jar build ở [1] được deploy lên DEV, rồi **cùng jar đó** lên SIT, UAT, PROD — chỉ đổi **cấu hình** (DB, URL, secret) theo môi trường.
- Nếu build lại ở mỗi môi trường thì "artifact UAT đã test" có thể **không giống** artifact PROD — test ở UAT trở nên vô nghĩa.

### Ví dụ pipeline rút gọn (GitHub Actions)
~~~yaml
name: ci
on: { push: { branches: [main] } }
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: '21' }
      - run: ./mvnw -B verify          # build + test trong một bước
      - uses: actions/upload-artifact@v4   # giữ lại jar dùng cho deploy sau
        with: { name: app-jar, path: target/*.jar }
~~~
Job khác (deploy) **tải cùng artifact** đó để đẩy lên môi trường — không build lại.

### Môi trường và cấu hình
| Môi trường | Mục đích | Ai deploy | Dữ liệu |
|---|---|---|---|
| DEV | dev kiểm tra code vừa merge | tự động | dữ liệu giả |
| SIT/UAT | test tích hợp, nghiệp vụ nghiệm thu | tự động/1-click | dữ liệu gần thật (đã che thông tin cá nhân) |
| PROD | khách dùng thật | có gate phê duyệt | dữ liệu thật |

Cấu hình ({{application-dev.yml}}, {{application-prod.yml}}) và **secret** (DB, API key) tách khỏi artifact; secret lấy từ kho bí mật (AWS Secrets Manager, Vault...), không commit vào git.

### Lỗi hay gặp
- **Pipeline xanh nhưng test flaky** (đỏ ngẫu nhiên) → mọi người "bấm re-run cho xanh", bug thật lẫn vào; phải sửa test flaky, không đổ thừa hạ tầng.
- **Build lại mỗi môi trường** → mất tính "build once"; kiểm tra checksum/đúng version artifact khi promote.
- **Quên test trong pipeline** → CI chỉ là "build server"; test unit, integration, E2E phải là cửa chặn (quality gate).
- **DB migration phá tương thích**: migration xoá/đổi tên cột chạy trong khi bản app cũ vẫn đang phục vụ → bản cũ lỗi ngay; dùng **expand-contract** (thêm cột mới, deploy app dùng cả hai, dọn cột cũ ở release sau).
- **Không có rollback** → sự cố prod là "kêu trời"; giữ artifact version cũ và triển khai kiểu blue-green/canary để quay lại trong vài phút.

### Trả lời miệng 1 phút
"Continuous integration là mỗi commit đều được build và test tự động để phát hiện lỗi sớm; continuous delivery đảm bảo mọi thay đổi qua pipeline đều sẵn sàng release, còn continuous deployment thì tự động lên production. Pipeline của tôi gồm build, unit test, quality gate, đóng gói artifact, rồi deploy qua DEV, SIT/UAT và PROD với smoke test cuối. Nguyên tắc then chốt là build một lần: cùng một artifact đi qua các môi trường, chỉ đổi cấu hình và secret. Và tôi luôn có kế hoạch rollback, không bao giờ deploy mà không có đường lui."

### Ví dụ đời thực
  **Bối cảnh:** Team backend 6 người, mỗi commit đều chạy pipeline. Sau khi tăng số dev, pipeline thường xuyên bị timeout (GitHub Actions 6h limit). Build image Docker mất 14 phút, test integration mất 10 phút. Dev phải chờ 24 phút để biết code có xanh không.

  **Triệu chứng:** Pipeline timeout; CI wait time tăng từ 5 phút lên 24 phút. Dev bỏ qua test, merge không check. Release cuối tuần bị rollback do test flaky.

  **Điều tra:** Kiểm tra pipeline: (1) Build stage: {{mvn package}} không dùng cache (mỗi build lại tải dependency). (2) Test stage: test integration chạy trên DEV environment, không mock. (3) Deploy stage: build lại image ở mỗi môi trường (DEV, SIT, PROD) — vi phạm "build once, deploy many".

  **Nguyên nhân gốc:** (1) Không dùng cache dependency. (2) Test integration chậm do environment thật. (3) Build lại ở mỗi môi trường → artifact UAT khác artifact PROD.

  **Cách xử lý:** (1) Dùng cache dependency: {{actions/cache}} hoặc Docker layer cache. (2) Tách test unit (nhanh, mock) và test integration (chạy song song trên DEV). (3) Build image 1 lần, artifact đi qua DEV → SIT → PROD, chỉ đổi config. (4) Dùng {{actions/upload-artifact}} và {{actions/download-artifact}} để giữ artifact.

  **Kết quả đo được:** Pipeline từ 24 phút xuống 6 phút. Tỉ lệ merge không check từ 30% xuống 0%. Release cuối tuần không còn rollback do test flaky.

  > Senior tip: theo dõi **lead time** và **change failure rate** (hai chỉ số DORA) — chúng cho biết pipeline của bạn thực sự hiệu quả đến đâu. Pipeline nhanh (< 10 phút) và ổn định là nền tảng để cả team release nhiều lần mỗi ngày thay vì "release cuối tuần đầy rủi ro".`,
  follow: ['Continuous delivery và continuous deployment khác nhau thế nào?', 'Artifact nên được promote qua các môi trường ra sao để đảm bảo "đã test cái gì thì deploy cái đó"?', 'Đặt database migration ở stage nào của pipeline để không downtime?'],
  tags: ['CI/CD', 'pipeline', 'artifact', 'môi trường', 'nhập môn']
},
{
  id: 'primer-018',
  topic: 'primer',
  level: 'mid',
  q: 'Process, thread và core CPU khác nhau thế nào? Trong một ứng dụng Java backend, chúng liên quan đến nhau ra sao?',
  a: `**Tóm tắt:**
- **Process** (tiến trình) là một chương trình đang chạy, có không gian bộ nhớ riêng. **Thread** (luồng) là "công việc con" chạy bên trong một process, các thread cùng process dùng chung bộ nhớ. **Core CPU** là đơn vị phần cứng thực sự thực thi lệnh; số core quyết định có thể chạy song song thật bao nhiêu việc tại cùng một thời điểm.
- Một JVM Spring Boot thường là 1 process, bên trong tạo hàng chục đến hàng trăm thread (thread pool xử lý HTTP, thread GC, thread scheduler). Core CPU là tài nguyên máy vật lý/máy ảo mà các thread đó tranh nhau.

### Bối cảnh thật: vì sao dev 4 năm vẫn cần hiểu rõ
Khi production chậm, người ta hay nói "tăng thread", "tăng instance", "CPU 100%". Nếu không phân biệt process, thread và core, bạn rất dễ chọn sai hướng: thêm thread khi CPU đã bão hòa (không giúp, còn tệ hơn), hoặc nhầm "2 core" với "chạy được vô hạn song song".

### Từng khái niệm, từ gốc

#### 1) Process là gì
**Process** (tiến trình): hệ điều hành cấp cho chương trình đang chạy một "ngôi nhà" riêng gồm: không gian bộ nhớ ảo (virtual memory), bảng file đang mở, biến môi trường, và ít nhất 1 thread.
- Cách ly: process A không đọc/ghi trực tiếp bộ nhớ process B. Muốn trao đổi dữ liệu phải qua cơ chế giao tiếp giữa tiến trình (IPC: socket, file, pipe, message queue).
- Ví dụ đời thường: mỗi process như một **căn hộ riêng** trong chung cư. Mỗi căn có đồ đạc riêng; muốn đưa đồ sang căn khác phải đi qua hành lang/cửa (IPC), không thể với tay lấy trực tiếp.
- Trong backend: bạn chạy {{java -jar app.jar}} → hệ điều hành tạo 1 process JVM. Chạy 3 instance trên 3 máy → 3 process (thường mỗi instance 1 process).

#### 2) Thread là gì
**Thread** (luồng): đơn vị thực thi nhỏ hơn trong process. Nhiều thread trong cùng process:
- **Dùng chung**: heap (bộ nhớ đối tượng), code, file mở, biến static.
- **Riêng mỗi thread**: stack (ngăn xếp lời gọi hàm), con trỏ lệnh (đang chạy tới dòng nào), thanh ghi CPU.
- Ví dụ đời thường: trong cùng một căn hộ (process), có nhiều **người làm việc** (thread). Họ dùng chung bếp/tủ lạnh (heap) nhưng mỗi người có cuốn sổ tay riêng (stack). Dùng chung tiện nhưng dễ tranh nhau cái bếp → cần "luật" (synchronization/lock).
- Trong Spring Boot (mặc định Tomcat): mỗi HTTP request được xử lý bởi 1 thread lấy từ thread pool (ví dụ tối đa 200 thread). 200 request đồng thời → tối đa 200 thread cùng sống trong 1 JVM process.

#### 3) Core CPU là gì
**CPU core** (lõi CPU): mạch phần cứng thực sự chạy lệnh máy. 1 core tại một khoảnh khắc chỉ chạy 1 luồng lệnh (bỏ qua hyper-threading để đơn giản).
- **Song song thật (parallelism)**: 4 core có thể chạy 4 thread cùng lúc.
- **Đồng thời giả (concurrency)**: 100 thread trên 4 core → hệ điều hành liên tục chuyển core qua lại giữa các thread (context switch, đổi ngữ cảnh). Mỗi thread chạy một lát rồi nhường. Người dùng cảm giác "cùng lúc", thực ra là xen kẽ rất nhanh.
- Ví dụ đời thường: 4 core như **4 đầu bếp**. 100 đơn hàng (thread) thì 4 đầu bếp luân phiên nấu từng món, không phải 100 đầu bếp.

### Sơ đồ quan hệ (ASCII)
~~~text
Máy chủ có 4 CPU core: [C1] [C2] [C3] [C4]

Process JVM (PID 1234) — bộ nhớ riêng
  Heap (chung): [Object A] [Object B] [Connection Pool]
  Thread T1 (HTTP)  stack riêng  ---- có thể đang chạy trên C1
  Thread T2 (HTTP)  stack riêng  ---- có thể đang chạy trên C2
  Thread T3 (GC)    stack riêng  ---- đang chờ lượt (C1,C2 bận)
  Thread T4 (HTTP)  stack riêng  ---- đang chờ lượt
  ... (tổng 150 thread)

Process Postgres (PID 5678) — bộ nhớ riêng, không chạm heap JVM
~~~

### Ví dụ cụ thể với số liệu
Giả sử service Order nhận 300 request/giây, mỗi request chờ DB trung bình 50ms và tính toán 5ms:
- 1 request chiếm thread ~55ms → 1 thread phục vụ ~18 req/giây.
- Cần ~17 thread "đang bận" để chịu 300 req/s. Tomcat pool 200 thread là dư cho trường hợp này.
- Máy 4 core: lúc thread chờ DB (I/O wait), core rảnh có thể chạy thread khác → nhiều thread hơn core vẫn có lợi với workload I/O nhiều.
- Nếu workload tính toán nặng (CPU-bound), ví dụ mã hóa/resize ảnh 55ms CPU thuần: 4 core chỉ xử lý thật ~72 req/s. Tăng thread lên 200 không giúp, chỉ tăng context switch; giải pháp là tăng core/instance hoặc tối ưu thuật toán.

### Bảng so sánh nhanh
| Tiêu chí | Process | Thread | Core CPU |
|---|---|---|---|
| Là gì | Chương trình đang chạy | Luồng trong process | Phần cứng thực thi |
| Bộ nhớ | Riêng biệt | Chung heap, stack riêng | Không phải bộ nhớ |
| Tạo/hủy | Nặng (tốn tài nguyên) | Nhẹ hơn process | Cố định theo phần cứng |
| Lỗi ảnh hưởng | Thường chỉ chết process đó | 1 thread crash có thể kéo JVM (tùy lỗi) | Hỏng core ảnh hưởng toàn máy |
| Giao tiếp | IPC (socket, queue) | Gọi chung biến/đối tượng (cần lock) | N/A |

### Lỗi hay gặp trong backend Java
- **Tăng {{server.tomcat.threads.max}} mù quáng** khi CPU đã 90%: thêm thread → thêm context switch → chậm hơn. Phải đo: bottleneck là CPU hay I/O/DB?
- **Nghĩ "8 thread = chạy trên 8 core"**: chỉ đúng nếu máy có ≥8 core và thread đang chạy CPU-bound. Container Kubernetes đôi khi bị giới hạn CPU (ví dụ 500m = nửa core) → thực tế ít song song hơn tưởng.
- **Chia sẻ biến giữa thread không đồng bộ**: vì dùng chung heap, 2 thread cùng sửa 1 {{HashMap}} thường → dữ liệu hỏng, {{ConcurrentModificationException}}, hoặc treo vô hạn (câu chuyện kinh điển của {{HashMap}} trong môi trường đa luồng).
- **Nhầm process isolation với thread safety**: tách microservice (nhiều process) giúp cô lập lỗi/bộ nhớ, nhưng không tự giải quyết race condition bên trong mỗi service.

### Trả lời phỏng vấn thế nào
Nên trả lời theo 3 lớp: (1) định nghĩa ngắn gọn từng khái niệm, (2) nêu quan hệ: 1 JVM là 1 process chứa nhiều thread, core là tài nguyên phần cứng thực thi, (3) đưa ví dụ backend thực tế (Tomcat thread pool, I/O-bound vs CPU-bound) và một trade-off (nhiều thread tốt cho I/O chờ, nhưng context switch và tranh lock có chi phí).

### Ví dụ đời thực
- **Triệu chứng:** Service Order (Spring Boot, 1 instance JVM, máy 4 vCPU) bắt đầu trả chậm giờ cao điểm: P95 latency tăng từ 120ms lên 2.8s, dashboard CPU báo 98-100% liên tục, nhưng DB CPU chỉ ~30%.
- **Điều tra:** Chạy {{uptime}} thấy load average 18 (cao so với 4 core). Lấy thread dump bằng {{jstack <pid>}} 3 lần cách nhau 10s: thấy ~420 thread, trong đó phần lớn ở trạng thái RUNNABLE đang thực thi hàm serialize JSON lớn (CPU-bound). Metric Prometheus {{jvm_threads_live_threads}} tăng vọt từ 80 lên 420; Tomcat busy threads chạm {{server.tomcat.threads.max}} (mặc định 200, team đã tăng lên 400 trước đó).
- **Nguyên nhân gốc:** Request trả payload rất lớn (danh sách 20k bản ghi) khiến serialize tốn CPU; team đã tăng thread pool để "chịu tải" nhưng 4 core không chạy song song nổi 400 thread CPU-bound, dẫn đến context switch liên tục và chậm toàn bộ.
- **Cách xử lý:** Trả về response phân trang (page size 100), bật nén gzip, hạ {{threads.max}} về 200 (phù hợp core + I/O). Scale ngang thêm 2 instance sau load balancer.
- **Kết quả đo được:** CPU mỗi instance xuống 55-65%, P95 giảm còn 180ms, load average ~3.5, throughput tăng từ 250 req/s lên 900 req/s (3 instance).

### Trả lời mẫu khi phỏng vấn
"Em hiểu process là một chương trình đang chạy có không gian bộ nhớ riêng, còn thread là luồng thực thi nhỏ hơn bên trong process và dùng chung heap. Core CPU là phần cứng thực sự chạy lệnh, nên số core quyết định chạy song song thật được bao nhiêu việc cùng lúc. Trong thực tế, một ứng dụng Spring Boot là một JVM process với nhiều thread Tomcat xử lý HTTP. Em luôn phân biệt workload I/O-bound và CPU-bound: với I/O-bound, nhiều thread hơn core vẫn có lợi vì thread chờ DB hoặc mạng thì core làm việc khác; nhưng với CPU-bound, thêm thread quá số core chỉ gây context switch và chậm hơn. Em từng gặp case latency tăng mạnh dù DB bình thường, thread dump cho thấy hàng trăm thread RUNNABLE serialize payload lớn trên máy 4 core. Cách xử lý là phân trang response, giảm thread pool cho phù hợp và scale ngang thay vì tăng thread mù quáng. Khi điều tra em luôn nhìn load average, CPU và thread dump cùng nhau để xác định bottleneck thật."

> Senior tip: khi điều tra "CPU cao" trên production, luôn nhìn thêm **load average** và **thread dump** ({{jstack}}). CPU 100% do 4 thread tính toán nặng (bình thường nếu đủ core) rất khác với CPU 100% do 500 thread tranh lock/context switch. Con số thread và trạng thái thread (RUNNABLE, BLOCKED, WAITING) mới cho bạn nguyên nhân gốc.`,
  follow: ['Khi nào nên tăng số thread, khi nào nên tăng số instance (process)?', 'Context switch là gì và vì sao quá nhiều thread lại làm chậm hệ thống?'],
  tags: ['process', 'thread', 'CPU core', 'concurrency', 'OS', 'nhập môn']
},
{
  id: 'primer-019',
  topic: 'primer',
  level: 'mid',
  q: 'Stack và heap khác nhau thế nào ở mức hệ điều hành và JVM? Một biến/một object trong Java nằm ở đâu, và vì sao hiểu điều này giúp bạn debug lỗi?',
  a: `**Tóm tắt:**
- **Stack** (ngăn xếp) là vùng bộ nhớ cấp cho **mỗi thread**, dùng để lưu lời gọi hàm (stack frame), biến cục bộ kiểu nguyên thủy (primitive) và tham chiếu (reference). Cấp phát/giải phóng rất nhanh, tự động theo vào/ra hàm.
- **Heap** (vùng nhớ đống) là vùng bộ nhớ **chung cho cả process/JVM**, dùng để lưu object ({{new ...}}). Quản lý bởi bộ dọn rác (Garbage Collector, GC) trong Java.
- Hiểu stack/heap giúp giải thích {{StackOverflowError}} (đệ quy sâu, stack đầy), {{OutOfMemoryError: Java heap space}} (object quá nhiều/giữ lâu), và vì sao truyền object vào hàm "nhìn như thay đổi được".

### Bối cảnh thật
Dev hay nghe "stack overflow", "heap dump", "memory leak" nhưng đôi khi lẫn lộn hai vùng nhớ. Hậu quả: debug sai hướng (tăng heap trong khi lỗi do đệ quy stack), hoặc không hiểu vì sao sửa field của object trong hàm thì bên ngoài cũng đổi.

### Thuật ngữ (giải thích lần đầu)
- **Primitive** (kiểu nguyên thủy): kiểu dữ liệu cơ bản của Java như {{int}}, {{long}}, {{boolean}}, {{double}} — lưu giá trị trực tiếp, không phải object.
- **Reference** (tham chiếu): biến "trỏ" tới object trên heap; bản thân reference chỉ là một địa chỉ/tham chiếu nhỏ, không phải toàn bộ object.
- **Stack frame** (khung ngăn xếp): gói thông tin của một lần gọi hàm (tham số, biến cục bộ, địa chỉ trả về). Mỗi lần gọi hàm → đẩy 1 frame vào stack; hàm trả về → bỏ frame.
- **GC (Garbage Collector)**: cơ chế tự tìm object trên heap không còn ai tham chiếu tới và thu hồi bộ nhớ.

### Cơ chế từng bước

#### Stack hoạt động thế nào
~~~java
int calc(int a) {          // frame calc: lưu a, biến cục bộ
  int b = a * 2;           // b (primitive) nằm trong frame calc
  return b;
}
void main() {
  int x = 10;              // frame main: x nằm đây
  int y = calc(x);         // gọi calc -> đẩy frame calc lên stack
}                          // calc xong -> bỏ frame calc; main xong -> bỏ frame main
~~~
- Vào hàm: stack "cao lên" (push frame). Ra hàm: frame biến mất ngay, không cần GC.
- Mỗi thread có stack riêng (kích thước thường cấu hình bằng {{-Xss}}, ví dụ 512KB-1MB). Đệ quy quá sâu → hết chỗ → {{StackOverflowError}}.

#### Heap hoạt động thế nào
~~~java
void main() {
  User u = new User("An"); // (1) new User(...) tạo object trên HEAP
                            // (2) biến u là reference, nằm trên STACK (frame main)
  u.age = 20;               // đi theo reference u tới object trên heap, sửa field
}
~~~
- {{new}} luôn tạo object trên heap. Biến {{u}} trên stack chỉ giữ "địa chỉ" trỏ tới object đó.
- Khi không còn reference nào trỏ tới object (và không thể truy cập được nữa), GC **có thể** thu hồi nó (không phải thu hồi ngay lập tức).

### Sơ đồ trực quan (ASCII)
~~~text
Thread Stack (riêng)                 Heap (chung JVM)
+---------------------+             +---------------------------+
| frame: calc         |             | User@0x1A { name:"An",   |
|   a = 10 (int)      |             |             age:20 }      |
|   b = 20 (int)      |             |                           |
+---------------------+             | int[]@0x2B [1,2,3]        |
| frame: main         |      +----->|                           |
|   x = 10 (int)      |      |      | String@0x3C "An"          |
|   u = ref 0x1A -----+------+      +---------------------------+
|   arr = ref 0x2B ---+----------------------^
+---------------------+
Primitive/references: trên stack. Object/array: trên heap.
~~~

### Ví dụ "truyền tham số" dễ nhầm
~~~java
void rename(User u) { u.name = "Binh"; }   // đổi field object trên heap -> bên ngoài thấy đổi
void reassign(User u) { u = new User("Chi"); } // đổi reference cục bộ u -> bên ngoài KHÔNG đổi
~~~
Java luôn truyền **giá trị của biến**: với object, giá trị được truyền là bản sao của reference (cùng trỏ tới một object heap). Vì vậy sửa field thì thấy, còn gán {{u}} sang object mới thì chỉ đổi bản sao reference trong frame {{reassign}}.

### Bảng so sánh
| Tiêu chí | Stack | Heap |
|---|---|---|
| Phạm vi | Mỗi thread một stack | Chung toàn JVM/process |
| Chứa gì (Java) | Stack frame, primitive cục bộ, reference | Object, array, instance field |
| Quản lý | Tự động khi vào/ra hàm | GC dọn object không còn dùng |
| Tốc độ cấp phát | Rất nhanh | Chậm hơn, có thể gây GC pause |
| Lỗi điển hình | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Kích thước | Nhỏ (mặc định ~1MB/thread) | Lớn, cấu hình {{-Xmx}} |

### Lỗi hay gặp trên production
- **{{StackOverflowError}}**: thường do đệ quy không có điểm dừng hoặc cây quá sâu. Fix: thêm điều kiện dừng, hoặc đổi sang vòng lặp/dùng cấu trúc dữ liệu rõ ràng (Deque) thay đệ quy.
- **{{OutOfMemoryError: Java heap space}}**: object tích lũy không được GC (memory leak logic: cache không giới hạn, giữ reference trong static {{List}}, listener không gỡ). Debug bằng heap dump ({{jmap}}) và phân tích object chiếm nhiều.
- **Tăng {{-Xmx}} là cách chữa cháy, không phải nguyên nhân gốc**: nếu leak, heap lớn hơn chỉ giúp sống lâu hơn rồi vẫn OOM.
- **Tạo quá nhiều thread**: mỗi thread cần stack riêng → 2000 thread * 1MB stack ≈ 2GB chỉ riêng stack (ngoài heap). Có thể gây {{OutOfMemoryError: unable to create native thread}}.

### Trả lời phỏng vấn thế nào
Nói rõ: stack cho lời gọi hàm/biến cục bộ mỗi thread, heap cho object dùng chung do GC quản lý. Vẽ nhanh sơ đồ "reference trên stack trỏ object trên heap". Kèm 2 lỗi kinh điển (StackOverflowError vs OOM heap) và cách phân biệt hướng debug. Nhấn mạnh Java truyền giá trị reference (giải thích được ví dụ rename/reassign).

### Ví dụ đời thực
- **Triệu chứng:** Service Notification (Java 17, {{-Xmx2g}}) sau mỗi lần deploy chạy ổn, nhưng sau 6-8 giờ heap dùng tăng dần từ 400MB lên sát 2GB, GC full chạy liên tục, P99 tăng từ 90ms lên 3s rồi cuối cùng ném {{OutOfMemoryError: Java heap space}}.
- **Điều tra:** Metric Micrometer {{jvm_memory_used_bytes}} (label {{area="heap"}}) cho thấy đường heap hình "răng cưa" nhưng đáy tăng dần sau mỗi chu kỳ GC (dấu hiệu leak). Khi heap chạm 90%, chạy {{jmap -dump:live,format=b,file=/tmp/heap.hprof <pid>}} và tải file về phân tích bằng Eclipse MAT.
- **Nguyên nhân gốc:** Dominator Tree trong MAT chỉ ra một {{HashMap}} static trong class {{SessionCache}} giữ ~1.2 triệu entry (mỗi entry ~700 byte, tổng ~840MB). Code thêm session vào map khi user login nhưng không bao giờ xóa khi session hết hạn hay user logout.
- **Cách xử lý:** Thay {{HashMap}} static bằng cache có giới hạn và TTL (ví dụ Caffeine với {{maximumSize}} và {{expireAfterAccess}}), bổ sung test kiểm tra kích thước cache không tăng vô hạn.
- **Kết quả đo được:** Sau bản vá, heap dao động ổn định 350-500MB trong 72 giờ, không còn full GC kéo dài, P99 trở lại 95ms, không phát sinh OOM.

### Trả lời mẫu khi phỏng vấn
"Khi nói về bộ nhớ trong Java, em phân biệt rõ stack và heap. Stack là vùng nhớ riêng cho mỗi thread, chứa stack frame với biến cục bộ kiểu primitive và reference; nó được cấp phát và giải phóng tự động khi vào ra hàm nên rất nhanh. Heap là vùng nhớ chung của JVM để lưu object tạo bằng new và được GC quản lý. Hiểu điều này giúp em debug đúng hướng: StackOverflowError thường do đệ quy quá sâu làm đầy stack, còn OutOfMemoryError heap space liên quan đến object tích lũy trên heap. Em từng xử lý một vụ heap tăng dần tới OOM, thay vì tăng Xmx em lấy heap dump bằng jmap và phân tích bằng Eclipse MAT. Dominator Tree cho thấy một HashMap static giữ hơn một triệu session không bao giờ bị xóa. Em thay bằng cache có TTL và giới hạn kích thước, sau đó heap ổn định trở lại. Em cũng lưu ý Java truyền giá trị của reference, nên sửa field trong hàm thì object trên heap đổi nhưng gán lại reference cục bộ thì bên ngoài không bị ảnh hưởng."

> Senior tip: khi nghi ngờ rò rỉ bộ nhớ, đừng đoán. Lấy **heap dump** lúc bộ nhớ cao ({{jmap -dump:live,format=b,file=heap.hprof <pid>}}) và mở bằng Eclipse MAT: nhìn "Dominator Tree" để thấy object nào giữ nhiều bộ nhớ nhất và ai đang giữ reference tới nó. Đó là cách tìm leak có căn cứ, thay vì "thử tăng Xmx".`,
  follow: ['StackOverflowError và OutOfMemoryError khác nhau về nguyên nhân và cách xử lý thế nào?', 'Vì sao String trong Java là immutable và điều đó liên quan gì đến heap?'],
  tags: ['stack', 'heap', 'memory', 'JVM', 'GC', 'nhập môn']
},
{
  id: 'primer-020',
  topic: 'primer',
  level: 'mid',
  q: 'TCP bắt tay 3 bước (3-way handshake) là gì? Vì sao backend cần connection pool thay vì mỗi request mở một kết nối mới?',
  a: `**Tóm tắt:**
- **TCP** (Transmission Control Protocol, giao thức điều khiển truyền vận) là giao thức truyền dữ liệu tin cậy trên mạng: trước khi gửi dữ liệu, hai bên phải "bắt tay 3 bước" để thiết lập kết nối, và khi xong phải đóng kết nối.
- **3-way handshake**: Client gửi {{SYN}} (xin kết nối) → Server trả {{SYN-ACK}} (đồng ý, xin kết nối ngược) → Client trả {{ACK}} (xác nhận). Sau đó mới gửi dữ liệu.
- Mỗi lần thiết lập + đóng kết nối tốn thời gian (nhiều round-trip mạng) và tài nguyên (socket, bộ nhớ kernel, cổng). **Connection pool** (bể kết nối) giữ sẵn một số kết nối mở để tái dùng cho nhiều request, giúp giảm độ trễ và tránh quá tải.

### Bối cảnh thật
Một API Spring Boot gọi database cho mỗi request. Nếu mỗi lần gọi DB đều mở kết nối TCP mới tới Postgres rồi đóng, bạn trả thêm hàng chục mili-giây cho handshake/TLS và tạo/huỷ tài nguyên liên tục. Lúc traffic cao, DB có thể từ chối vì quá nhiều kết nối. Đây là lý do HikariCP (connection pool mặc định của Spring Boot) gần như luôn có mặt.

### Thuật ngữ
- **Socket** (ổ cắm mạng): đầu mút kết nối, gắn với cặp (địa chỉ IP, cổng). Ứng dụng đọc/ghi dữ liệu qua socket.
- **Round-trip time (RTT)**: thời gian một gói tin đi từ client tới server rồi phản hồi về. Trong cùng data center có thể < 1ms; khác vùng có thể 50-200ms.
- **SYN, ACK**: cờ (flag) trong gói TCP. SYN = synchronize (xin đồng bộ/khởi tạo), ACK = acknowledge (xác nhận).

### TCP 3-way handshake từng bước
~~~seq
title: TCP 3-way handshake
actors: Client | Server
Client -> Server: 1) SYN, seq=x (xin mở kết nối)
Server --> Client: 2) SYN-ACK, seq=y, ack=x+1 (đồng ý)
Client -> Server: 3) ACK, ack=y+1 (xác nhận, kết nối sẵn sàng)
Client -> Server: 4) Gửi dữ liệu (HTTP request, query DB...)
Server --> Client: 5) Trả dữ liệu
note Client..Server: Đóng kết nối tốn thêm bước (FIN/ACK)
~~~

- Bước 1-3 xảy ra **trước khi** byte dữ liệu ứng dụng đầu tiên được gửi. Tốn ít nhất 1 RTT (client chờ bước 2) trước khi bước 3 kèm dữ liệu trong một số tối ưu, nhưng về bản chất vẫn có chi phí thiết lập.
- Nếu có TLS (HTTPS/kết nối DB mã hóa), sau handshake TCP còn thêm TLS handshake → thêm 1-2 RTT nữa.

### Vì sao connection pool cần thiết
~~~text
Không có pool (mỗi request mở kết nối DB mới):
  Request 1: [TCP handshake][TLS?][Auth DB][Query][Đóng]  ~ 15-50ms overhead + query
  Request 2: [TCP handshake][TLS?][Auth DB][Query][Đóng]  ~ 15-50ms overhead + query
  100 req/s * 30ms overhead = 3 giây CPU/mạng lãng phí mỗi giây (không thể!), cộng áp lực tạo socket

Có pool (HikariCP giữ sẵn 10 kết nối mở):
  Khởi động: mở 10 kết nối 1 lần
  Request 1: [mượn kết nối từ pool][Query][trả kết nối]     ~ query (+ <1ms mượn/trả)
  Request 2: [mượn kết nối từ pool][Query][trả kết nối]     ~ tái dùng, không handshake
~~~

Lợi ích cụ thể:
1. **Giảm độ trễ**: bỏ chi phí handshake/auth cho mỗi request.
2. **Giới hạn số kết nối**: DB (Postgres, MySQL) chịu tốt một số kết nối hữu hạn (tùy cấu hình, thường chục đến vài trăm). Pool đặt {{maximumPoolSize}} để không bắn hàng nghìn kết nối làm DB sập.
3. **Tái dùng tài nguyên**: giảm tạo/huỷ socket, giảm áp lực GC/bộ nhớ.

### Ví dụ cấu hình HikariCP (Spring Boot)
~~~yaml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/orders
    hikari:
      maximum-pool-size: 10       # tối đa 10 kết nối đồng thời tới DB
      minimum-idle: 5             # giữ ít nhất 5 kết nối rảnh sẵn sàng
      connection-timeout: 30000   # chờ tối đa 30s để mượn kết nối, quá thì lỗi
      max-lifetime: 1800000       # tái tạo kết nối sau 30 phút (tránh kết nối "cũ" bị giữa đường cắt)
~~~
- {{maximum-pool-size}} không phải "càng lớn càng tốt". DB xử lý query song song cũng bị giới hạn bởi CPU/IO/disk; pool quá lớn → DB quá tải, context switch tăng. Công thức tham khảo hay được nhắc: pool nhỏ, gắn với số core DB (cần đo thực tế).

### Bảng trade-off
| Cách | Ưu | Nhược | Khi dùng |
|---|---|---|---|
| Mở kết nối mới mỗi request | Đơn giản, không giữ trạng thái | Chậm, tốn tài nguyên, dễ quá tải DB | Hầu như không dùng cho backend traffic thật |
| Connection pool | Nhanh, kiểm soát tải DB | Cần cấu hình; có thể "hết kết nối" nếu giữ lâu | Mặc định cho DB, HTTP client (Apache HttpClient, OkHttp pool) |
| Giữ 1 kết nối cố định | Ít overhead | Không chịu song song, lỗi 1 kết nối là chết | Chỉ tool đơn luồng, batch đơn giản |

### Lỗi hay gặp
- **Không trả kết nối về pool**: mượn connection rồi quên {{close()}} (hoặc không dùng try-with-resources). Pool cạn → request mới chờ hết {{connection-timeout}} → lỗi dây chuyền. Triệu chứng: log {{"Connection is not available, request timed out"}}.
- **Giữ connection trong lúc gọi API ngoài chậm**: mượn connection, gọi HTTP sang service khác mất 5s, mới query DB rồi trả. Connection bị "ôm" vô ích → pool cạn. Quy tắc: giữ connection DB càng ngắn càng tốt.
- **{{maximum-pool-size}} quá lớn**: ví dụ 200 kết nối * 10 instance app = 2000 kết nối tới 1 DB → DB nghẽn. Phải tính tổng từ tất cả instance.
- **Nhầm TCP handshake với HTTP**: HTTP là giao thức ứng dụng chạy *trên* TCP (HTTP/1.1, HTTP/2). HTTPS còn thêm TLS. Connection pool có thể áp dụng ở tầng TCP/HTTP (keep-alive/pool) và tầng DB (JDBC pool).

### Trả lời phỏng vấn thế nào
Trình bày 3-way handshake (SYN, SYN-ACK, ACK) và nhấn mạnh chi phí round-trip + tài nguyên. Sau đó giải thích connection pool tái dùng kết nối, giảm độ trễ, giới hạn tải DB. Đưa ví dụ HikariCP và một lỗi thực tế (không trả kết nối / pool quá lớn). Nếu interviewer hỏi sâu, nối sang TLS handshake và HTTP keep-alive.

### Ví dụ đời thực
- **Triệu chứng:** API Checkout của hệ thống thương mại điện tử (Spring Boot + Postgres, 6 instance, HikariCP {{maximum-pool-size}} = 20/instance) bị timeout hàng loạt lúc flash sale: lỗi {{SQLTransientConnectionException: Connection is not available, request timed out after 30000ms}}, P99 tăng từ 200ms lên trên 30s.
- **Điều tra:** Dashboard Micrometer cho thấy {{hikaricp_connections_active}} chạm 20 và {{hikaricp_connections_pending}} tăng vọt trên mọi instance; {{hikaricp_connections_acquire_seconds_max}} tăng mạnh. Trong khi đó metric DB ({{pg_stat_activity}}) cho thấy nhiều query {{SELECT}} trên bảng {{inventory}} chạy 8-12s và giữ connection lâu. Kiểm tra log chậm của Postgres ({{log_min_duration_statement = 1000ms}}) xác nhận query thiếu index.
- **Nguyên nhân gốc:** Pool tổng 120 kết nối (20 x 6 instance) nhưng mỗi query chậm giữ connection ~10s nên thông lượng thực tế rất thấp; request mới phải xếp hàng chờ mượn connection tới khi hết {{connection-timeout}}.
- **Cách xử lý:** Thêm index phù hợp cho truy vấn tồn kho (giảm query xuống 40ms), rà soát code để dùng try-with-resources đảm bảo trả connection, giảm {{maximum-pool-size}} xuống 10/instance để tránh dồn ép DB.
- **Kết quả đo được:** Active connections dao động 3-6, pending về 0, P99 ổn định 180-220ms trong suốt đợt sale tiếp theo, không còn timeout mượn connection.

### Trả lời mẫu khi phỏng vấn
"Khi nói về TCP, em mô tả bắt tay 3 bước: client gửi SYN, server trả SYN-ACK, client gửi ACK rồi mới truyền dữ liệu. Quá trình này tốn ít nhất một round-trip và tài nguyên socket, nếu có TLS thì còn thêm chi phí handshake nữa. Vì vậy với backend, mở kết nối mới cho mỗi request tới database là rất lãng phí và dễ quá tải. Thực tế em luôn dùng connection pool như HikariCP để tái dùng kết nối đã mở sẵn, vừa giảm độ trễ vừa giới hạn số kết nối đồng thời tới DB. Em từng gặp sự cố pool exhaustion lúc traffic cao: metric cho thấy active connections chạm max và pending tăng, trong khi nguyên nhân gốc là query chậm giữ connection quá lâu do thiếu index. Cách xử lý là tối ưu query, đảm bảo trả connection bằng try-with-resources và đặt pool size phù hợp với khả năng của DB thay vì để quá lớn. Khi API chậm, em kiểm tra connection pool wait time và active vs max connections trước khi kết luận DB yếu."

> Senior tip: khi API bỗng chậm đột ngột, kiểm tra metric **connection pool wait time** và **active vs max connections** (HikariCP/Micrometer expose sẵn). Pool wait tăng trước khi DB CPU tăng là dấu hiệu app đang "xếp hàng chờ kết nối" — nguyên nhân thường là query chậm giữ connection lâu hoặc pool size không phù hợp, chứ không phải "DB yếu" ngay lập tức.`,
  follow: ['Connection pool bị cạn (pool exhaustion) thường do nguyên nhân nào, bạn điều tra thế nào?', 'HTTP keep-alive liên quan gì đến việc tái dùng kết nối TCP?'],
  tags: ['TCP', 'handshake', 'connection pool', 'HikariCP', 'network', 'nhập môn']
},
{
  id: 'primer-021',
  topic: 'primer',
  level: 'mid',
  q: 'DNS phân giải tên miền thành địa chỉ IP như thế nào? Khi một ứng dụng Spring Boot gọi https://api.partner.com, chuyện gì xảy ra phía sau?',
  a: `**Tóm tắt:**
- **DNS** (Domain Name System, hệ thống tên miền) giống "danh bạ" của Internet: đổi tên dễ nhớ ({{api.partner.com}}) thành **địa chỉ IP** (ví dụ {{203.0.113.10}}) để máy tính biết gửi gói tin tới đâu.
- Phân giải DNS thường đi qua nhiều bước: bộ nhớ đệm (cache) trên máy/ứng dụng → resolver của hệ điều hành/nhà mạng → nếu chưa biết thì hỏi lần lượt từ **root server** → server quản lý đuôi miền (TLD, ví dụ {{.com}}) → **authoritative DNS server** (server có thẩm quyền) của {{partner.com}}.
- Kết quả được cache theo **TTL** (thời gian sống). Hiểu DNS giúp debug lỗi "gọi được lúc này lúc khác", độ trễ kết nối đầu tiên, và sự cố khi đổi IP server.

### Bối cảnh thật
Backend Java thường gọi API đối tác, DB theo hostname, hoặc service nội bộ qua DNS Kubernetes. Khi "đổi server sang IP mới mà app vẫn gọi IP cũ", hoặc "thỉnh thoảng timeout vài giây lúc gọi lần đầu", nguyên nhân hay nằm ở DNS cache/TTL chứ không phải code Java.

### Thuật ngữ (giải thích lần đầu)
- **Tên miền (domain)**: chuỗi dễ nhớ, ví dụ {{api.partner.com}}.
- **Địa chỉ IP**: địa chỉ số của máy trên mạng (IPv4 như {{203.0.113.10}}, hoặc IPv6). Gói tin mạng đi theo IP.
- **Resolver**: thành phần đi "hỏi hộ" DNS và trả kết quả (thường do hệ điều hành hoặc DNS nhà mạng/công ty cung cấp).
- **Authoritative DNS server**: server giữ bản ghi chính thức cho một tên miền (nguồn trả lời đúng cuối cùng).
- **TTL (Time To Live)**: thời gian (giây) một kết quả DNS được phép lưu trong cache trước khi phải hỏi lại.
- **Bản ghi (record)**: {{A}} ánh xạ tên → IPv4, {{AAAA}} → IPv6, {{CNAME}} → bí danh trỏ sang tên khác.

### Quá trình phân giải từng bước
~~~seq
title: Phân giải DNS cho api.partner.com
actors: App | OS/Resolver | Root | TLD(.com) | Auth(partner.com)
App -> OS/Resolver: 1) api.partner.com là IP nào?
OS/Resolver --> App: 2) Có trong cache? Trả luôn
OS/Resolver -> Root: 3) Hỏi root: ai quản lý .com?
Root --> OS/Resolver: 4) Địa chỉ server TLD .com
OS/Resolver -> TLD(.com): 5) Hỏi .com: ai quản lý partner.com?
TLD(.com) --> OS/Resolver: 6) Địa chỉ authoritative của partner.com
OS/Resolver -> Auth(partner.com): 7) api.partner.com là IP nào?
Auth(partner.com) --> OS/Resolver: 8) A = 203.0.113.10, TTL 300s
OS/Resolver --> App: 9) Trả IP, lưu cache theo TTL
~~~

Trong thực tế, resolver thường có cache nên hiếm khi phải đi đủ các bước 3-8 cho mỗi lần gọi. Bước 1 của app cũng có thể đi qua cache của JVM/thư viện HTTP.

### Ví dụ cụ thể
- Bạn đổi server {{api.partner.com}} từ IP {{203.0.113.10}} sang {{203.0.113.20}}, TTL cũ là 300 giây (5 phút).
- Trong tối đa 5 phút sau khi đổi, một số client vẫn nhận IP cũ từ cache → gọi vào server cũ. Vì vậy khi chuyển đổi hạ tầng, người ta thường **hạ TTL từ trước** (ví dụ xuống 60s) để giảm thời gian "lan truyền".
- Một request Java lần đầu trong tiến trình có thể chậm thêm 20-100ms do DNS lookup (tùy mạng/có cache hay không). Các request sau nhanh hơn nếu còn trong cache.

### DNS và ứng dụng Java
~~~text
Spring Boot gọi: RestClient.get().uri("https://api.partner.com/v1/pay").retrieve()
  1) Cần IP của api.partner.com -> tra DNS (JVM/OS resolver)
  2) Có IP -> mở TCP tới IP:443 -> TLS handshake -> gửi HTTP request
~~~
- JVM có cơ chế cache DNS (cấu hình qua {{networkaddress.cache.ttl}} trong security properties của JDK; hành vi mặc định khác nhau theo phiên bản/cấu hình bảo mật). Cache quá lâu → app không thấy IP mới; tắt cache hoàn toàn → tốn lookup liên tục.
- Trong Kubernetes, tên service ({{orders.default.svc.cluster.local}}) được DNS nội bộ phân giải. Pod scale/đổi IP thì DNS cập nhật; client phải tôn trọng TTL và không "ghim" IP cứng.

### Bảng nhanh các bản ghi hay gặp
| Record | Ý nghĩa | Ví dụ dùng trong backend |
|---|---|---|
| A / AAAA | Tên → địa chỉ IPv4 / IPv6 | Trỏ {{api.example.com}} tới IP server |
| CNAME | Tên → tên khác (bí danh) | {{www}} trỏ tới {{lb.cloudprovider.net}} |
| TXT | Chuỗi văn bản | Xác minh domain, cấu hình SPF/DKIM email |

### Lỗi hay gặp
- **Hard-code IP** trong cấu hình thay vì dùng hostname: khi server đổi IP/scale → phải sửa cấu hình và redeploy. Hostname + DNS linh hoạt hơn.
- **Nhầm DNS với "mất mạng"**: lỗi {{UnknownHostException}} thường là không phân giải được tên (DNS lỗi, tên sai, mạng chặn DNS) — khác với {{ConnectException}} (tới được IP nhưng không kết nối được cổng).
- **TTL quá dài khi chuẩn bị migration**: quên hạ TTL trước → một phần traffic còn dính IP cũ lâu.
- **Cache nhiều tầng** (thư viện HTTP, JVM, OS, resolver) khiến "đã đổi DNS mà app vẫn đi IP cũ" khó hiểu. Khi debug, kiểm tra từ chính môi trường app chạy ({{nslookup}}, {{dig}}, hoặc log).

### Trả lời phỏng vấn thế nào
Giải thích DNS là ánh xạ tên miền → IP. Nêu luồng hỏi qua cache → resolver → root/TLD → authoritative (ngắn gọn, có sơ đồ). Nêu vai trò TTL/cache và một ví dụ thực tế backend (đổi IP, {{UnknownHostException}}, DNS trong Kubernetes). Nhấn mạnh: app Java phụ thuộc DNS nên cấu hình hostname, TTL và quan sát lỗi phân giải rất quan trọng khi vận hành.

### Ví dụ đời thực
- **Triệu chứng:** Sau khi đối tác thanh toán chuyển hệ thống sang IP mới, 2 trên 8 instance của service Payment vẫn gọi vào IP cũ và nhận {{ConnectException: Connection timed out}} khoảng 5% request trong gần 10 phút, trong khi 6 instance còn lại hoạt động bình thường.
- **Điều tra:** Từ pod bị lỗi chạy {{dig api.partner.com}} và {{nslookup api.partner.com}} thấy resolver nội bộ thỉnh thoảng trả IP cũ. Kiểm tra bản ghi DNS bằng {{dig api.partner.com +ttlid}} cho thấy TTL trước đó đặt 600 giây. Log ứng dụng (đã bổ sung log hostname khi lỗi) và metric latency kết nối cho thấy lỗi chỉ xuất hiện ở các instance giữ cache DNS cũ.
- **Nguyên nhân gốc:** TTL 600s quá dài và cache DNS tồn tại ở nhiều tầng (resolver, OS, JVM), nên các instance không làm mới cùng thời điểm sau khi bản ghi A được cập nhật; một resolver upstream còn cache lâu hơn TTL mong đợi.
- **Cách xử lý:** Phối hợp đối tác giữ song song IP cũ và mới trong thời gian chuyển đổi; về phía mình hạ TTL xuống 60s trước các đợt thay đổi hạ tầng (thực hiện trước 1 ngày), và cấu hình {{networkaddress.cache.ttl}} phù hợp để JVM tôn trọng TTL. Sau khi xác nhận mọi resolver trả IP mới, mới tắt IP cũ.
- **Kết quả đo được:** Ở lần chuyển đổi tiếp theo, 100% instance chuyển sang IP mới trong vòng 90 giây, không còn timeout do lệch IP, lỗi kết nối liên quan DNS giảm về 0.

### Trả lời mẫu khi phỏng vấn
"Em hiểu DNS là hệ thống phân giải tên miền thành địa chỉ IP để ứng dụng biết kết nối tới đâu. Khi Spring Boot gọi một domain, ứng dụng sẽ hỏi resolver, resolver kiểm tra cache và nếu cần sẽ truy vấn theo chuỗi từ root tới TLD rồi tới authoritative DNS server của domain đó. Kết quả được cache theo TTL nên thay đổi IP không phản ánh ngay lập tức. Trong thực tế em luôn dùng hostname thay vì hard-code IP để linh hoạt khi hạ tầng thay đổi, nhưng cũng phải chú ý TTL và cache ở nhiều tầng như JVM, OS và resolver. Em từng gặp sự cố một phần instance vẫn gọi IP cũ sau khi đối tác đổi server, nguyên nhân là TTL dài và cache không đồng đều. Cách xử lý là hạ TTL trước khi migration, giữ song song hai IP trong thời gian chuyển đổi và kiểm tra phân giải trực tiếp từ môi trường chạy bằng dig hoặc nslookup. Em cũng phân biệt rõ UnknownHostException do không phân giải được tên với ConnectException do không kết nối được tới IP và cổng."

> Senior tip: khi gặp lỗi kết nối "ngẫu nhiên" tới một đối tác, hãy log cả **hostname và IP đã phân giải** (nếu thư viện cho phép) cùng thời gian DNS lookup. Rất nhiều sự cố "app lỗi" thực ra là DNS trả IP sai/cũ, một node trong cụm DNS trả lời khác node khác, hoặc TTL/cache gây hành vi không đồng đều giữa các instance.`,
  follow: ['UnknownHostException và ConnectException khác nhau thế nào, bạn khoanh vùng ra sao?', 'Vì sao khi chuyển server sang IP mới người ta hay hạ TTL DNS từ trước?'],
  tags: ['DNS', 'network', 'TTL', 'hostname', 'nhập môn']
},
{
  id: 'primer-022',
  topic: 'primer',
  level: 'mid',
  q: 'HTTPS dùng TLS để bảo mật kết nối như thế nào? Hãy giải thích đơn giản quá trình TLS handshake (trao đổi khóa, chứng chỉ) giữa client và server.',
  a: `**Tóm tắt:**
- **HTTPS** là HTTP chạy trên **TLS** (Transport Layer Security, giao thức bảo mật tầng truyền vận). TLS giúp: (1) **mã hóa** dữ liệu để bên nghe lén không đọc được, (2) **xác thực** server qua **chứng chỉ số** để tránh giả mạo, (3) **toàn vẹn** để phát hiện dữ liệu bị sửa trên đường truyền.
- **TLS handshake** (bắt tay TLS) diễn ra sau khi TCP nối xong: client và server thống nhất phiên bản/mã hóa, server gửi chứng chỉ (chứa public key), client kiểm tra chứng chỉ, hai bên tạo ra **khóa phiên** (session key) dùng chung để mã hóa dữ liệu về sau. Bắt tay tốn thêm thời gian (round-trip) nên ảnh hưởng độ trễ kết nối đầu.

### Bối cảnh thật
Backend Java hầu như luôn gọi/nhận HTTPS: API đối tác, API nội bộ qua ingress, webhook. Lỗi thường gặp: {{SSLHandshakeException}}, chứng chỉ hết hạn, không tin cậy CA, hostname không khớp. Nếu không hiểu handshake, bạn sẽ "tắt verify SSL" cho xong — rất nguy hiểm.

### Thuật ngữ (giải thích lần đầu)
- **Mã hóa (encryption)**: biến dữ liệu thành dạng "xáo trộn"; chỉ ai có khóa phù hợp mới giải mã đọc được.
- **Mã hóa bất đối xứng (asymmetric)**: có cặp **public key** (công khai) và **private key** (bí mật). Dùng cho việc trao đổi/thiết lập khóa an toàn. Chậm hơn mã hóa đối xứng.
- **Mã hóa đối xứng (symmetric)**: hai bên dùng **cùng một khóa bí mật** để mã hóa/giải mã. Nhanh, dùng để mã hóa dữ liệu thực tế sau handshake.
- **Chứng chỉ số (certificate)**: "thẻ căn cước" của server, do **CA** (Certificate Authority, tổ chức cấp chứng chỉ tin cậy) ký xác nhận: gắn tên miền với public key của server.
- **CA/Trust store**: danh sách CA mà client tin. Trên JVM là file truststore (mặc định {{cacerts}}). Chứng chỉ không do CA tin cậy cấp → client từ chối.

### TLS handshake đơn giản (TLS 1.2 rút gọn / ý tưởng chung)
~~~seq
title: TLS handshake (đơn giản)
actors: Client (app/browser) | Server (api.partner.com)
Client -> Server: 1) ClientHello: phiên bản TLS, danh sách cipher hỗ trợ
Server --> Client: 2) ServerHello: cipher đã chọn
Server --> Client: 3) Certificate: chứng chỉ (public key, tên miền, CA ký)
Server --> Client: 4) ServerHelloDone
Client -> Client: 5) Kiểm tra chứng chỉ: CA tin? còn hạn? khớp domain?
Client -> Server: 6) Trao đổi bí mật để tạo khóa phiên (session key)
note Client..Server: 7) Cả hai tính ra cùng session key (đối xứng)
Client -> Server: 8) Finished (mã hóa bằng session key)
Server --> Client: 9) Finished (mã hóa bằng session key)
Client -> Server: 10) HTTP request/response được mã hóa bằng session key
~~~

(Ghi chú: TLS 1.3 gọn hơn, giảm round-trip và bỏ các cipher cũ yếu; nhưng ý tưởng cốt lõi vẫn là: xác thực chứng chỉ + thống nhất khóa phiên + mã hóa đối xứng cho dữ liệu.)

### Ví dụ đời thường
- Bạn gửi thư mật: (1) hỏi đối tác lấy **ổ khóa công khai** của họ và xác minh đúng là họ (kiểm tra chứng chỉ), (2) bạn tạo một **chìa khóa hộp** (khóa phiên) và gửi kèm theo cách chỉ họ mở được, (3) từ đó hai bên dùng cùng chìa khóa hộp để trao đổi nhanh. Người đưa thư thấy phong bì nhưng không mở được (mã hóa).

### Ví dụ cụ thể với số liệu
- Gọi {{GET https://api.partner.com}} lần đầu:
  - TCP handshake: ~1 RTT.
  - TLS handshake: thêm ~1-2 RTT (tùy TLS 1.2/1.3, có resume hay không).
  - RTT nội vùng 1ms → thêm vài ms; RTT xuyên quốc gia 100ms → thêm 100-200ms trước khi nhận byte HTTP đầu tiên.
- Vì vậy HTTP client dùng **connection pool/keep-alive** với HTTPS cũng giúp: tái dùng kết nối đã handshake xong, tránh trả chi phí TLS lặp lại.

### Bảng: HTTPS bảo vệ khỏi gì / không bảo vệ khỏi gì
| HTTPS/TLS giúp | HTTPS/TLS không tự giải quyết |
|---|---|
| Người nghe lén trên mạng không đọc được nội dung | Server của bạn có lỗ hổng ứng dụng (SQL injection, auth sai) |
| Xác thực bạn đang nói chuyện với đúng domain (nếu verify chứng chỉ) | Dữ liệu đã giải mã bị lộ trong log, DB, hoặc do app bug |
| Phát hiện nội dung bị sửa trên đường truyền | Quyền truy cập: ai được gọi API (cần token/auth) |

### Lỗi hay gặp
- **{{SSLHandshakeException: PKIX path building failed}}**: JVM không tin chứng chỉ (CA không có trong truststore, hoặc chứng chỉ tự ký/self-signed). Fix đúng: import CA/chứng chỉ phù hợp vào truststore hoặc dùng chứng chỉ do CA tin cậy cấp. **Không** tắt verify toàn cục.
- **Chứng chỉ hết hạn**: server quên gia hạn → mọi client từ chối. Cần giám sát ngày hết hạn.
- **Hostname không khớp**: chứng chỉ cấp cho {{api.partner.com}} nhưng bạn gọi bằng IP hoặc tên khác.
- **Nhầm TLS termination**: nhiều hệ thống để load balancer/ingress xử lý TLS, traffic phía sau là HTTP nội bộ. Phải hiểu ranh giới mã hóa ở đâu, đừng lộ HTTP ra internet.

### Trả lời phỏng vấn thế nào
Nêu 3 mục tiêu: mã hóa, xác thực, toàn vẹn. Mô tả handshake ở mức ý tưởng: client nhận chứng chỉ → verify (CA, hạn, domain) → hai bên tạo khóa phiên đối xứng → mã hóa dữ liệu. Giải thích vì sao handshake tốn RTT và liên hệ connection reuse. Kèm 1-2 lỗi thực tế (chứng chỉ hết hạn, PKIX) và cách xử lý đúng (không tắt verify).

### Ví dụ đời thực
- **Triệu chứng:** Lúc 00:05, tất cả request từ service Billing (Java 17, Spring Boot) tới {{https://api.bank-gateway.example}} bắt đầu lỗi 100% với {{javax.net.ssl.SSLHandshakeException: PKIX path building failed: unable to find valid certification path to requested target}}; tỉ lệ thanh toán thành công rơi về 0 trong 12 phút.
- **Điều tra:** Kiểm tra nhanh bằng {{openssl s_client -connect api.bank-gateway.example:443 -servername api.bank-gateway.example -showcerts}} thấy chuỗi chứng chỉ mới dùng intermediate CA chưa có trong truststore mặc định của image JRE đang chạy. Đối chiếu log deploy cho thấy gateway vừa thay chứng chỉ lúc 00:00. Trên JVM, bật tạm {{-Djavax.net.debug=ssl,handshake}} ở môi trường staging tái hiện lỗi và xác nhận bước validate chain thất bại.
- **Nguyên nhân gốc:** Image container dùng bản JRE cũ, truststore {{cacerts}} không chứa intermediate CA mới; client không dựng được chuỗi tin cậy nên từ chối handshake dù chứng chỉ server hợp lệ.
- **Cách xử lý:** Cập nhật base image JRE có truststore mới, đồng thời bổ sung quy trình kiểm tra chuỗi chứng chỉ trước khi đối tác thay đổi; cấu hình cảnh báo hết hạn/đổi chứng chỉ và test kết nối TLS trong staging.
- **Kết quả đo được:** Sau khi rollout image mới (12 phút), tỉ lệ handshake thành công trở lại 100%, thanh toán phục hồi hoàn toàn; các lần thay chứng chỉ sau đó được phát hiện trước nhờ job kiểm tra {{openssl s_client}} và cảnh báo tự động.

### Trả lời mẫu khi phỏng vấn
"Em hiểu HTTPS là HTTP chạy trên TLS để đảm bảo ba việc: mã hóa dữ liệu, xác thực server và đảm bảo toàn vẹn. Sau TCP handshake, client và server thực hiện TLS handshake: thống nhất phiên bản và cipher, server gửi chứng chỉ, client kiểm tra chứng chỉ theo CA tin cậy, hạn dùng và tên miền, sau đó hai bên thiết lập khóa phiên đối xứng để mã hóa dữ liệu thực tế. Vì handshake tốn thêm round-trip nên tái dùng kết nối với keep-alive hoặc connection pool cũng giúp giảm độ trễ. Trong thực tế em từng xử lý sự cố PKIX path building failed khi đối tác đổi chứng chỉ và intermediate CA chưa có trong truststore của JVM. Em xác minh chuỗi chứng chỉ bằng openssl s_client, tái hiện ở staging với log handshake, rồi cập nhật base image và truststore thay vì tắt verify SSL. Em cũng theo dõi ngày hết hạn chứng chỉ và kiểm tra chuỗi tin cậy trước các thay đổi để tránh outage tương tự. Với em, xử lý đúng TLS là vừa khôi phục dịch vụ nhanh vừa giữ an toàn, không đánh đổi bảo mật."

> Senior tip: luôn giám sát **ngày hết hạn chứng chỉ** và tự động gia hạn (Let's Encrypt/ACM). Sự cố "HTTPS bỗng chết toàn hệ thống" vì quên gia hạn là loại outage rất phổ biến và hoàn toàn tránh được. Khi debug {{SSLHandshakeException}}, bật log {{-Djavax.net.debug=ssl,handshake}} tạm thời ở môi trường an toàn để xem chính xác bước nào fail (nhưng cẩn thận dữ liệu nhạy cảm trong log).`,
  follow: ['TLS bảo vệ bạn khỏi những rủi ro nào, và không bảo vệ khỏi rủi ro nào?', 'Khi gặp lỗi PKIX path building failed trong Java, bạn xử lý thế nào cho đúng?'],
  tags: ['HTTPS', 'TLS', 'SSL', 'certificate', 'security', 'nhập môn']
},
{
  id: 'primer-023',
  topic: 'primer',
  level: 'mid',
  q: 'Index trong database là gì, và B-tree index hoạt động như thế nào? Hãy giải thích trực quan vì sao index giúp query nhanh hơn và khi nào index không có tác dụng.',
  a: `**Tóm tắt:**
- **Index** (chỉ mục) trong database là cấu trúc dữ liệu phụ được tạo trên một hoặc nhiều cột để giúp DB tìm dòng nhanh hơn, giống mục lục ở cuối sách: thay vì đọc cả cuốn, bạn tra mục lục để nhảy tới đúng trang.
- **B-tree** (cây cân bằng, balanced tree) là kiểu index phổ biến nhất (mặc định trong Postgres/MySQL). Nó tổ chức khóa theo thứ tự trong một cây nhiều nhánh có độ cao thấp, nên tìm một giá trị thường chỉ cần đọc rất ít "nút" (block trên đĩa) thay vì quét toàn bộ bảng.
- Đánh đổi: index giúp {{SELECT}} nhanh hơn nhưng làm {{INSERT/UPDATE/DELETE}} chậm hơn và tốn thêm dung lượng, vì DB phải cập nhật cả index.

### Bối cảnh thật
Dev backend hay gặp: "bảng users 10 triệu dòng, query {{WHERE email = ?}} mất 3 giây", thêm index xong còn 5ms. Nhưng cũng có lúc "đã có index mà query vẫn chậm". Hiểu B-tree trực quan giúp bạn biết khi nào index giúp, khi nào không, và cách đặt index đúng.

### Thuật ngữ (giải thích lần đầu)
- **Full table scan** (quét toàn bảng): DB đọc từng dòng của bảng để kiểm tra điều kiện. Bảng lớn → rất chậm, tốn I/O đĩa.
- **B-tree / B+tree**: cấu trúc cây cân bằng. Ở đây nói "B-tree" theo cách gọi chung; nhiều DB (InnoDB, Postgres) dùng biến thể B+tree (dữ liệu/lá tổ chức tối ưu cho range scan). Ý tưởng tìm kiếm theo cây cân bằng là giống nhau.
- **Nút (node/page)**: một "khối" dữ liệu của cây, thường tương ứng một page trên đĩa (ví dụ 8KB hoặc 16KB).
- **Độ chọn lọc (selectivity)**: cột có nhiều giá trị khác nhau → chọn lọc cao (index hữu ích). Cột chỉ có vài giá trị (ví dụ {{status}} chỉ ACTIVE/INACTIVE trên bảng mà 95% ACTIVE) → index ít lợi.

### Hình dung trực quan: không index vs có B-tree index
~~~text
Bảng orders (10.000.000 dòng), tìm WHERE order_code = 'ORD-773812'

CÁCH 1 — Không index (full table scan):
  Đọc dòng 1? không. Dòng 2? không. ... Dòng 7.738.120? ĐÚNG.
  Có thể phải đọc hàng triệu dòng (rất nhiều page đĩa).

CÁCH 2 — B-tree index trên order_code (minh họa đơn giản):
                    [M]
                   /   \\
            [D,H]         [R,W]
           /  |  \\       /  |  \\
       [A-C][E-G][I-L] [N-Q][S-V][X-Z]  (các nút lá trỏ tới dòng thật)

  Tìm 'ORD-773812' (bắt đầu 'O'):
    1) Gốc [M]: 'O' > 'M' -> đi nhánh phải
    2) Nút [R,W]: 'O' nằm đoạn N-Q -> đi nhánh giữa
    3) Nút lá [N-Q]: tìm thấy 'ORD-773812' -> lấy địa chỉ dòng
  Chỉ đọc ~3 nút thay vì hàng triệu dòng.
~~~

Điểm mấu chốt: B-tree được **cân bằng** (mọi nhánh lá có độ sâu gần nhau) và mỗi nút chứa nhiều khóa, nên cây "thấp mà bè". Bảng hàng triệu dòng vẫn thường chỉ cần đi qua 3-4 mức nút.

### Ví dụ SQL cụ thể
~~~sql
-- Tạo index trên cột hay lọc
CREATE INDEX idx_orders_code ON orders(order_code);

-- Query hưởng lợi: DB tra index -> tìm nhanh
SELECT * FROM orders WHERE order_code = 'ORD-773812';

-- Composite index (nhiều cột): hữu ích khi lọc/sắp theo (customer_id, created_at)
CREATE INDEX idx_orders_cust_created ON orders(customer_id, created_at);
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 20;
~~~

### Khi index KHÔNG có tác dụng (hoặc ít tác dụng)
| Tình huống | Vì sao | Ví dụ |
|---|---|---|
| Hàm bọc cột trong WHERE | DB khó dùng index trên giá trị gốc | {{WHERE YEAR(created_at)=2026}} → cân nhắc range: {{created_at >= '2026-01-01'}} |
| {{LIKE '%abc'}} (ký tự đại diện ở đầu) | B-tree sắp theo thứ tự từ trái; không biết bắt đầu bằng gì | Tìm chuỗi chứa giữa → cân nhắc full-text search |
| Cột chọn lọc thấp | Lọc ra quá nhiều dòng, đọc index rồi đọc bảng còn tốn hơn | {{WHERE is_active = true}} khi 95% là true |
| Bảng rất nhỏ | Quét hết bảng còn rẻ hơn đi index | Bảng cấu hình vài chục dòng |
| Chỉ lấy vài cột nhưng index không cover | DB vẫn phải nhảy về bảng (lookup) | Xem "covering index" nếu query quan trọng |

### Đánh đổi: index không miễn phí
- **Tốn dung lượng**: thêm cấu trúc B-tree trên đĩa.
- **Làm chậm ghi**: mỗi {{INSERT/UPDATE/DELETE}} phải cập nhật bảng **và** mọi index liên quan. Bảng ghi nhiều, index quá nhiều → ghi chậm rõ.
- **Cần bảo trì quan sát**: index không dùng thì chỉ gây tốn. DB có thống kê/EXPLAIN để kiểm tra.

### Lỗi hay gặp trên production
- **"Thêm index vào mọi cột WHERE"**: ghi chậm, tốn bộ nhớ/dung lượng. Chỉ index cột thực sự dùng trong truy vấn quan trọng, dựa trên query thật và {{EXPLAIN}}.
- **Quên index khóa ngoại (foreign key)** hay cột hay join/filter: dẫn đến full scan trên bảng lớn.
- **Composite index sai thứ tự**: index {{(a,b)}} giúp query lọc {{a}} hoặc {{(a,b)}}, nhưng thường không giúp tốt nếu chỉ lọc {{b}}. Thứ tự cột phải theo cách query dùng.
- **Tin "có index là chắc nhanh"** mà không chạy {{EXPLAIN}}: optimizer có thể chọn không dùng index.

### Trả lời phỏng vấn thế nào
Bắt đầu bằng mục lục sách (trực quan), rồi mô tả B-tree: cây cân bằng, đi từ gốc xuống lá qua vài bước so sánh, tránh full scan. Nêu đánh đổi (đọc nhanh, ghi chậm, tốn chỗ). Kèm 2-3 trường hợp index không tác dụng (hàm bọc cột, {{LIKE '%...'}}, chọn lọc thấp) và nhắc {{EXPLAIN}} để kiểm chứng.

### Ví dụ đời thực
- **Triệu chứng:** API tra cứu đơn hàng theo {{order_code}} trên Postgres (bảng {{orders}} ~12 triệu dòng) tăng độ trễ: P95 từ 40ms lên 3.2s vào giờ cao điểm, CPU DB tăng 85%.
- **Điều tra:** Bật {{pg_stat_statements}} thấy query {{SELECT * FROM orders WHERE order_code = $1}} chiếm top thời gian. Chạy {{EXPLAIN (ANALYZE, BUFFERS)}} cho thấy kế hoạch {{Seq Scan on orders}} đọc ~12 triệu dòng, {{Buffers: shared hit/read}} rất cao, thời gian thực thi ~2800ms.
- **Nguyên nhân gốc:** Cột {{order_code}} không có index nên DB phải quét toàn bảng cho mỗi lần tra cứu; dữ liệu tăng theo thời gian làm chi phí scan tăng tuyến tính.
- **Cách xử lý:** Tạo index B-tree {{CREATE INDEX CONCURRENTLY idx_orders_code ON orders(order_code);}} (dùng {{CONCURRENTLY}} để giảm khóa ghi trên production), sau đó chạy lại {{EXPLAIN (ANALYZE, BUFFERS)}} và kiểm tra kích thước index cũng như ảnh hưởng lên ghi.
- **Kết quả đo được:** Kế hoạch đổi sang {{Index Scan using idx_orders_code}}, thời gian query giảm còn 3-6ms, P95 API về 55ms, CPU DB giảm xuống 35%. Tác động ghi tăng nhẹ (~4% thời gian insert đo trong batch test) nhưng chấp nhận được so với lợi ích đọc.

### Trả lời mẫu khi phỏng vấn
"Em giải thích index như mục lục của cuốn sách: thay vì đọc hết bảng, database tra cứu cấu trúc phụ để nhảy tới đúng dòng. Với B-tree, các khóa được lưu có thứ tự trong cây cân bằng nhiều nhánh nên việc tìm một giá trị thường chỉ đi qua vài nút từ gốc xuống lá, tránh full table scan trên bảng lớn. Đổi lại, index tốn dung lượng và làm chậm thao tác ghi vì phải cập nhật thêm cấu trúc index. Khi trả lời em cũng nêu các trường hợp index kém hiệu quả như bọc cột trong hàm ở WHERE, LIKE với ký tự đại diện ở đầu, hoặc cột có độ chọn lọc thấp. Trong thực tế, em từng xử lý query tra cứu đơn hàng chậm trên bảng hàng chục triệu dòng: EXPLAIN ANALYZE cho thấy seq scan, sau khi thêm B-tree index phù hợp và kiểm tra lại kế hoạch, thời gian giảm từ giây xuống mili-giây. Em luôn dùng EXPLAIN ANALYZE, BUFFERS và đo trước sau khi thêm index để đảm bảo tối ưu đúng chỗ và hiểu đánh đổi với ghi."

> Senior tip: trước khi thêm index trên production, luôn chạy {{EXPLAIN (ANALYZE, BUFFERS)}} với dữ liệu/query thật để xem kế hoạch thực thi, số dòng ước lượng vs thực tế, và I/O. Một index "đúng lý thuyết" vẫn có thể bị bỏ qua nếu thống kê cũ hoặc điều kiện trả về quá nhiều dòng. Sau khi thêm, đo lại và theo dõi ảnh hưởng tới ghi.`,
  follow: ['Composite index (a, b) khác index (b, a) thế nào về các query nó hỗ trợ?', 'Khi nào bạn chọn không tạo index dù cột xuất hiện trong WHERE?'],
  tags: ['index', 'B-tree', 'database', 'SQL', 'performance', 'nhập môn']
},
{
  id: 'primer-024',
  topic: 'primer',
  level: 'mid',
  q: 'Encoding là gì? UTF-8, byte và ký tự (char) khác nhau thế nào, và vì sao backend Java cần hiểu điều này khi xử lý chuỗi, API, database?',
  a: `**Tóm tắt:**
- **Ký tự (character)** là khái niệm con người đọc (ví dụ {{A}}, {{ă}}, một chữ Hán, emoji). **Byte** là đơn vị dữ liệu 8 bit mà máy tính lưu/truyền. **Encoding** (bảng mã hóa) là quy tắc ánh xạ giữa ký tự và chuỗi byte.
- **UTF-8** là encoding phổ biến nhất hiện nay: dùng **1-4 byte** cho một ký tự (ASCII như {{A}} tốn 1 byte, tiếng Việt có dấu/emoji thường tốn nhiều byte hơn). UTF-8 tương thích ASCII và là mặc định thực tế của web, JSON, API hiện đại.
- Nhầm lẫn byte vs ký tự gây lỗi: cắt chuỗi hỏng, độ dài sai, lỗi hiển thị "mojibake" (ký tự lạ), so sánh/lưu trữ sai trong DB, hoặc lỗi khi truyền dữ liệu giữa hệ thống.

### Bối cảnh thật
Backend Java nhận JSON từ client, lưu DB, ghi log, gọi API khác. Mọi bước đều chuyển qua lại giữa **chuỗi ký tự** và **byte** (mạng/file/DB đều truyền byte). Nếu một bên dùng UTF-8, bên khác hiểu nhầm encoding khác, bạn sẽ thấy tên khách hàng "Nguyễn" thành chuỗi ký tự rác, hoặc emoji làm lỗi độ dài/cắt chuỗi.

### Thuật ngữ (giải thích lần đầu)
- **ASCII**: bảng mã cũ, 128 ký tự tiếng Anh cơ bản/ký hiệu, mỗi ký tự 1 byte (thực dùng 7 bit). Không biểu diễn được tiếng Việt có dấu.
- **Unicode**: chuẩn gán một "mã số" (code point, ví dụ {{U+1EBF}} cho {{ế}}) cho hầu hết ký tự/ngôn ngữ. Unicode **không phải** encoding; nó chỉ đặt mã số.
- **UTF-8/UTF-16**: các cách **mã hóa** code point Unicode thành byte. UTF-8 biến độ dài (1-4 byte). UTF-16 thường 2 hoặc 4 byte.
- **Mojibake**: hiện tượng chữ bị "vỡ" thành ký tự lạ do giải mã sai encoding (ví dụ byte UTF-8 bị đọc như Latin-1).

### Trực quan: cùng một chữ, byte khác nhau
~~~text
Ký tự:    N   g   u   y   ễ   n
Unicode:  U+004E U+0067 U+0075 U+0079 U+1EC5 U+006E

UTF-8 bytes (hex):
  'N' 'g' 'u' 'y'  -> 4E 67 75 79         (mỗi ký tự ASCII = 1 byte)
  'ễ'              -> E1 BB 85            (tiếng Việt có dấu = 3 byte trong UTF-8)
  'n'              -> 6E
Tổng chuỗi "Nguyễn" = 6 ký tự, nhưng 8 byte khi mã hóa UTF-8.
~~~
Ví dụ khác: emoji thường 4 byte trong UTF-8. Vì vậy **số ký tự != số byte**.

### Ví dụ Java cụ thể
~~~java
String s = "Nguyễn";
System.out.println(s.length()); // 6 (số đơn vị char UTF-16 trong Java; với BMP thường trùng "số ký tự" trực quan)

byte[] utf8 = s.getBytes(java.nio.charset.StandardCharsets.UTF_8);
System.out.println(utf8.length); // 8 (số byte UTF-8)

String bad = new String(utf8, java.nio.charset.StandardCharsets.ISO_8859_1); // đọc sai encoding
// bad sẽ bị mojibake: byte UTF-8 bị hiểu nhầm theo ISO-8859-1
~~~
- Luôn chỉ rõ charset khi chuyển {{String <-> byte[]}} ({{getBytes(UTF_8)}}, {{new String(bytes, UTF_8)}}). Tránh dùng mặc định của nền tảng, vì máy khác có thể mặc định khác.
- HTTP/JSON hiện đại gần như luôn UTF-8; header {{Content-Type: application/json; charset=utf-8}} là tín hiệu rõ ràng.

### Byte vs char: nơi hay gây lỗi
| Tình huống | Dễ nhầm | Hậu quả |
|---|---|---|
| Giới hạn độ dài DB/API | "Tối đa 255 ký tự" nhưng cột/kiểm tra tính byte | Tiếng Việt/emoji vượt giới hạn byte, lỗi cắt/lưu |
| Cắt chuỗi theo byte | Cắt giữa chùm byte của 1 ký tự UTF-8 | Ký tự cuối bị hỏng (replacement char) |
| Kích thước message/HTTP | Đếm {{length()}} của String | Payload thực tế lớn hơn (byte) |
| Hash/so sánh chữ ký | Hai bên encode khác charset | Cùng chuỗi nhưng byte khác → chữ ký không khớp |

### Lỗi hay gặp trên production
- **Không thống nhất encoding**: DB cột/tablespace một kiểu, app gửi UTF-8, log file kiểu khác → mojibake hoặc lỗi ghi dữ liệu. Quy ước an toàn: thống nhất **UTF-8** toàn hệ thống khi có thể.
- **Dùng encoding mặc định**: {{new String(bytes)}} hoặc {{getBytes()}} không truyền charset → hành vi phụ thuộc máy chạy (dev Windows khác server Linux).
- **Cắt chuỗi theo substring chỉ nhìn length** cho bài toán giới hạn byte (ví dụ header, SMS, DB byte limit): cần tính theo byte của encoding đích.
- **Validate "ký tự cho phép" sai** vì nhầm byte/char hoặc bỏ qua ký tự Unicode mở rộng.

### Trả lời phỏng vấn thế nào
Giải thích char là ký tự con người, byte là đơn vị lưu/truyền, encoding là ánh xạ. Nêu UTF-8 biến độ dài (1-4 byte), tương thích ASCII, phổ biến cho web/API. Đưa ví dụ "Nguyễn" 6 ký tự nhưng 8 byte UTF-8. Nêu 1-2 lỗi thực tế (mojibake do sai charset, giới hạn byte vs ký tự, luôn chỉ rõ {{StandardCharsets.UTF_8}} trong Java) và nguyên tắc: thống nhất UTF-8 end-to-end.

> Senior tip: khi thiết kế DB và API, hãy ghi rõ giới hạn là **ký tự** hay **byte** (ví dụ Postgres {{varchar(255)}} là 255 ký tự, còn một số hệ thống/driver/cột tính byte). Với dữ liệu đa ngôn ngữ + emoji, luôn dùng UTF-8 (Postgres: {{UTF8}}, MySQL: {{utf8mb4}} — tránh {{utf8}} "3-byte" cũ của MySQL vì không đủ cho emoji 4 byte). Sự cố encoding rất khó sửa ngược dữ liệu đã hỏng, nên phải đúng từ đầu.`,
  follow: ['Vì sao "Nguyễn" có thể dài 6 ký tự nhưng chiếm 8 byte trong UTF-8?', 'Trong Java, khi nào bạn phải chỉ rõ Charset thay vì dùng mặc định?'],
  tags: ['UTF-8', 'encoding', 'Unicode', 'byte', 'char', 'nhập môn']
},
{
  id: 'primer-025',
  topic: 'primer',
  level: 'mid',
  q: 'Độ phức tạp thời gian Big-O là gì? Giải thích O(1), O(n), O(log n), O(n log n), O(n^2) qua ví dụ thực tế trong backend (tìm trong list, tra index, sắp xếp, vòng lặp lồng).',
  a: `**Tóm tắt:**
- **Big-O** mô tả **cách thời gian (hoặc bộ nhớ) tăng lên khi kích thước dữ liệu đầu vào (n) tăng**, ở mức xấp xỉ bậc lớn. Nó không đo mili-giây chính xác, mà cho biết thuật toán "co giãn" thế nào: n gấp 10 thì thời gian tăng gấp mấy?
- Thứ tự hay gặp (tốt → xấu khi n lớn): {{O(1)}} (hằng số) < {{O(log n)}} < {{O(n)}} < {{O(n log n)}} < {{O(n^2)}}. Với n nhỏ (vài chục phần tử) khác biệt có thể không đáng kể; với n lớn (hàng triệu) khác biệt rất lớn.
- Trong backend, Big-O giúp bạn dự đoán: tìm trong {{List}} 1 triệu phần tử, duyệt batch, tra index B-tree, sắp xếp, hay vòng lặp lồng nhau sẽ đắt ra sao khi dữ liệu tăng.

### Bối cảnh thật
API chậm khi bảng/user/list tăng từ 1.000 lên 1.000.000. Code "chạy được" ở môi trường dev dữ liệu ít nhưng sập ở production. Big-O là công cụ tư duy để phát hiện sớm những đoạn code có nguy cơ "nổ" theo dữ liệu, trước khi đo profiling.

### Thuật ngữ (giải thích lần đầu)
- **n**: kích thước đầu vào (số phần tử trong list, số dòng, số request trong batch...).
- **Hằng số/bậc thấp bị bỏ qua**: {{O(2n + 5)}} vẫn gọi là {{O(n)}} vì khi n rất lớn, bậc n chi phối.
- **Worst case / average case**: đôi khi nói trường hợp xấu nhất (ví dụ tìm không thấy phải duyệt hết) hoặc trung bình. Phỏng vấn thường nêu rõ hoặc mặc định worst/average tùy cấu trúc.

### Các mức Big-O qua ví dụ backend thực tế

#### 1) O(1) — thời gian gần như không đổi theo n
- Ví dụ: lấy phần tử {{ArrayList}} theo index {{list.get(5)}}; tra {{HashMap}} theo key (trung bình) {{map.get(userId)}}; đọc một field.
- Backend: kiểm tra cache hit trong {{HashMap}} 1 phần tử hay 1 triệu phần tử — số bước tra cứu trung bình không tăng tuyến tính theo n.
- Lưu ý: "O(1)" không có nghĩa "0 giây", mà là không tăng theo n.

#### 2) O(log n) — tăng rất chậm (chia đôi mỗi bước)
- Ví dụ: **tìm nhị phân** (binary search) trên mảng đã sắp; tra **B-tree index** (đi từ gốc xuống lá).
- Số liệu trực quan: n = 1.000.000 → {{log2(n)}} ~ 20 bước. n tăng gấp 1000 lần, bước chỉ tăng thêm ~10.
- Backend: {{WHERE id = ?}} có index B-tree trên bảng 10 triệu dòng thường chỉ cần vài lần đọc nút (I/O), thay vì quét 10 triệu dòng.

#### 3) O(n) — tăng tuyến tính theo n
- Ví dụ: duyệt hết {{List}} để tìm phần tử không có index/key; tính tổng; lọc bằng vòng lặp một lần.
- Backend: quét 1.000 đơn hàng mất ~X ms thì 1.000.000 đơn (cùng thao tác) có xu hướng ~1000X ms (bỏ qua hằng số/hạ tầng). Batch job xử lý từng dòng một lần là O(n).
~~~java
// O(n): duyệt mỗi phần tử đúng 1 lần
long sum = 0;
for (Order o : orders) { sum += o.getAmount(); }
~~~

#### 4) O(n log n) — thường gặp ở sắp xếp hiệu quả
- Ví dụ: {{Collections.sort}} / {{Arrays.sort}} (các thuật toán như TimSort/dual-pivot quicksort) có độ phức tạp trung bình {{O(n log n)}}.
- Backend: sắp xếp 1.000.000 bản ghi trong bộ nhớ theo {{n log n}} vẫn khả thi; nếu tự viết sắp xếp kiểu {{O(n^2)}} sẽ chậm hơn rất nhiều khi n lớn.
- DB: {{ORDER BY}} trên tập lớn không có index phù hợp có chi phí đáng kể (DB dùng thuật toán sắp xếp/plan phù hợp).

#### 5) O(n^2) — vòng lặp lồng nhau trên cùng tập, nổ nhanh
- Ví dụ: so sánh mọi cặp phần tử (double loop).
~~~java
// O(n^2): với n=10.000 -> ~100.000.000 lần lặp
for (Order a : orders) {
  for (Order b : orders) {
    if (a.getUserId().equals(b.getUserId())) { /* ... */ }
  }
}
~~~
- Backend: ghép dữ liệu 2 list bằng 2 vòng {{for}} lồng thay vì dùng {{HashMap}} (đưa về ~O(n)) là lỗi hiệu năng kinh điển. n=100 thì ~10.000 phép so sánh; n=100.000 thì ~10.000.000.000 — không chạy nổi.

### Bảng cảm nhận tăng trưởng (xấp xỉ số bước)
| n | O(1) | O(log n) | O(n) | O(n log n) | O(n^2) |
|---:|---:|---:|---:|---:|---:|
| 1.000 | 1 | ~10 | 1.000 | ~10.000 | 1.000.000 |
| 1.000.000 | 1 | ~20 | 1.000.000 | ~20.000.000 | 1.000.000.000.000 |

(Con số minh họa bậc tăng trưởng, không phải mili-giây.)

### Big-O trong backend: nhìn ở đâu
- **Code Java**: vòng lặp, vòng lặp lồng, {{contains}} trên {{List}} (O(n) mỗi lần) đặt trong vòng lặp (thành O(n^2)), dùng {{HashSet/HashMap}} để giảm tra cứu.
- **Database**: full table scan ~ duyệt O(n) theo số dòng đọc; index B-tree ~ O(log n) bước trên cây (cộng chi phí I/O). {{EXPLAIN}} cho thấy DB đang làm gì.
- **Mạng/IO**: đôi khi n là số request; gọi API tuần tự n lần vs gom/batch/parallel là khác biệt lớn ngoài Big-O CPU thuần.

### Lỗi hay gặp
- **Chỉ nhìn Big-O, bỏ qua hằng số và I/O**: thuật toán O(n) truy cập mạng/đĩa ngẫu nhiên có thể chậm hơn O(n log n) trong RAM. Big-O là hướng dẫn, vẫn cần đo (profiling, metric).
- **Dùng {{list.contains}} trong vòng lặp**: {{ArrayList.contains}} là O(n) → toàn bộ O(n^2). Đổi sang {{HashSet}} nếu cần tra cứu nhiều.
- **Tối ưu sớm vi mô** nhưng bỏ qua O(n^2) rõ ràng trên dữ liệu có thể lớn (import, đồng bộ, báo cáo).
- **Hiểu nhầm n**: n là "số đơn hàng mỗi user" hay "tổng số đơn hàng hệ thống"? Xác định n đúng mới đánh giá đúng.

### Trả lời phỏng vấn thế nào
Định nghĩa Big-O là tốc độ tăng theo n. Nêu nhanh 5 mức với 1 ví dụ backend mỗi mức ({{HashMap}}/index là O(1)/O(log n), duyệt list O(n), sort O(n log n), vòng lặp lồng O(n^2)). Đưa một ví dụ số liệu (n=1.000.000 thì O(n^2) không khả thi) và một lỗi thực tế ({{contains}} trong vòng lặp). Nhấn mạnh: Big-O giúp chọn hướng đúng, nhưng quyết định cuối cùng cần đo trên dữ liệu thật.

> Senior tip: khi review code xử lý collection/batch, hãy tự hỏi "n tối đa ở production là bao nhiêu?" Nếu n có thể lên hàng chục nghìn, bất kỳ đoạn O(n^2) nào cũng là ứng viên gây sự cố khi dữ liệu tăng. Ưu tiên sửa bằng cấu trúc dữ liệu đúng ({{Map/Set}}), hoặc đẩy việc lọc/join về database có index — nơi có thuật toán và tối ưu phù hợp cho tập lớn.`,
  follow: ['Vì sao {{ArrayList.contains}} trong một vòng lặp có thể gây O(n^2)? Bạn sửa thế nào?', 'Khi nào tra cứu bằng index B-tree được xem là gần O(log n) và giới hạn thực tế của nó là gì?'],
  tags: ['Big-O', 'complexity', 'algorithm', 'performance', 'backend', 'nhập môn']
}
);
