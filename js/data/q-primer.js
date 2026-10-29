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

> Senior tip: theo dõi **lead time** và **change failure rate** (hai chỉ số DORA) — chúng cho biết pipeline của bạn thực sự hiệu quả đến đâu. Pipeline nhanh (< 10 phút) và ổn định là nền tảng để cả team release nhiều lần mỗi ngày thay vì "release cuối tuần đầy rủi ro".`,
  follow: ['Continuous delivery và continuous deployment khác nhau thế nào?', 'Artifact nên được promote qua các môi trường ra sao để đảm bảo "đã test cái gì thì deploy cái đó"?', 'Đặt database migration ở stage nào của pipeline để không downtime?'],
  tags: ['CI/CD', 'pipeline', 'artifact', 'môi trường', 'nhập môn']
}
);
