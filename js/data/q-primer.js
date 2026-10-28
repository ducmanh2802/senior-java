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
"Kubernetes là hệ thống điều phối container: tôi khai báo trạng thái mong muốn, ví dụ Deployment 3 replica của image phiên bản 1.4, và K8s tự giữ đúng trạng thái đó, tạo lại pod chết và rolling update khi có bản mới. Pod là đơn vị chạy tạm thời; Service cho một tên DNS ổn định và cân bằng tải giữa các pod; Ingress đưa traffic HTTP từ ngoài vào. Với Spring Boot, tôi đặt requests và limits phù hợp với bộ nhớ JVM, readiness probe vào actuator readiness để chỉ nhận traffic khi sẵn sàng, liveness chỉ kiểm tra tiến trình còn sống, bật graceful shutdown, và cấu hình qua ConfigMap, Secret."

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

> Senior tip: khi kể về MCP trong phỏng vấn, hãy nhấn mạnh **thiết kế quyền ở tầng hạ tầng chứ không ở prompt**: "dù model bị lừa, tool vẫn không thể ghi dữ liệu". Câu đó cho thấy bạn hiểu rủi ro thật của AI agent.`,
  follow: ['Tool và resource trong MCP khác nhau thế nào?', 'Bạn phòng prompt injection cho một MCP server đọc dữ liệu khách hàng ra sao?'],
  tags: ['MCP', 'Model Context Protocol', 'tools', 'AI agent', 'nhập môn']
}
);
