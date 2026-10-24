/* Bài học track "devops". Schema & markup: AGENTS.md mục 12. T139. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-devops-001',
  track: 'devops',
  order: 1,
  title: 'JVM trong container: MaxRAMPercentage, CPU limit và sizing heap/thread pool',
  level: 'mid',
  minutes: 30,
  goals: [
    'Giải thích được container giao bộ nhớ/CPU "ảo" cho JVM ra sao và vì sao {{Xmx}} cứng là lỗi thường gặp',
    'Tính được heap, số GC thread và kích thước thread pool web từ memory limit + CPU quota theo công thức sizing',
    'Tránh được các bẫy production: OOMKilled vì native memory, CPU throttling làm GC chậm, pool quá lớn trên container nhỏ',
  ],
  body: `### Container "cho mượn" tài nguyên, JVM phải tự nhìn cho thấy
Container không phải VM: process Java chạy chung kernel với host, chỉ bị cgroup giới hạn. Hai giới hạn quan trọng:

- **Bộ nhớ**: {{/sys/fs/cgroup/memory.max}} (cgroup v2) hoặc {{memory.limit_in_bytes}} (v1). Vượt limit, kernel **OOM-kill** process — đó là OOMKilled trên Kubernetes, **không phải** Java {{OutOfMemoryError}}.
- **CPU**: {{cpu.max}} dạng {{"200000 100000"}} nghĩa là 200ms CPU mỗi period 100ms = **2 core**. Vượt quota, process bị **throttle** (đứng im chờ period sau), không bị kill.

Từ Java 10, {{UseContainerSupport}} (mặc định bật, Java 17 là {{UseContainerSupport}} chuẩn) cho JVM đọc limit của cgroup: heap mặc định chỉ chiếm khoảng **25%** bộ nhớ container ({{MaxRAMPercentage}} mặc định 25.0). Nhiều team thấy heap "nhỏ quá" nên viết cứng {{-Xmx4g}} vào Dockerfile cho mọi môi trường — sai ngay khi limit pod là 2Gi: JVM tin vào Xmx, chạm limit thì **kernel kill**, log dừng giữa chừng, khó chẩn đoán.

Cách đúng: **để JVM tự đọc limit rồi tinh chỉnh tỉ lệ**:

~~~bash
java -XX:MaxRAMPercentage=75.0 \\
      -XX:InitialRAMPercentage=75.0 \\
      -XX:+UseG1GC \\
      -jar app.jar
~~~

### Bộ nhớ container đi đâu ngoài heap?
Heap chỉ là một phần. Phần còn lại gồm: **metaspace** (lớp Java, ~100–200MB với Spring Boot), **code cache** (JIT, ~100–240MB), **thread stacks** (mỗi thread ~1MB mặc định trên Linux x64), **direct buffers** (Netty/NIO), và **native memory** của JVM/GC. Nếu heap chiếm 75% thì 25% còn lại phải trả cho tất cả thứ đó — đặt {{MaxRAMPercentage}} quá cao (ví dụ 90) là công thức OOM native hoặc container kill.

**Công thức sizing** mà bạn có thể trình bày trước phỏng vấn (M = memory limit MiB, P = MaxRAMPercentage, C = CPU quota, S = kích thước stack MiB, R = mức reserve cho metaspace + code cache + native, thường 128–256 MiB):

1. {{heap = M × P / 100}}
2. {{dư bộ nhớ cho thread = M − heap − R}} (âm nghĩa là cấu hình chết, phải giảm P)
3. {{maxWorkerThreads = dư / S}} — quá lớn thì chính các thread stack này giết container
4. {{webPool ≈ 2 × C}} — quy tắc kinh điển của Tomcat/Jetty cho pool nền tảng blocking; app I/O-bound dùng virtual thread (Java 21) thì đếm bằng request đồng thời, không bằng core
5. {{gcThreads}} của G1 theo CPU: C ≤ 8 thì bằng C; C > 8 thì {{8 + (C − 8) × 5 / 8}} (giới hạn dần, không tuyến tính — GC parallel quá mức chỉ giành CPU với app)

| Limit pod | MaxRAMPercentage | Heap | Web pool (2×C) | Nhận xét |
|---|---|---|---|---|
| 512Mi, 1 core | 75% | 384Mi | 2 | Spring Boot nhỏ; reserve 128 → dư 0 cho worker extra |
| 1Gi, 2 core | 75% | 768Mi | 4 | 128Mi còn lại vừa stack cho vài chục thread hệ thống |
| 4Gi, 4 core | 50% | 2Gi | 8 | Team hay gặp GC churn: hạ P để trả chỗ cho metaspace/native |

> CPU throttling "giả chết": CPU trung bình chỉ 40% nhưng p99 tăng vọt vì process bị throttle từng chu kỳ 100ms. Kiểm tra {{cpu.stat}} (bộ đếm {{nr_throttled}}) thay vì nhìn CPU usage suông.

### Bẫy production hay gặp
- **Đặt Xmx cứng trong Dockerfile**: mọi môi trường dùng chung một giá trị, sang env khác limit đổi là OOMKilled hoặc waste RAM. Dùng {{MaxRAMPercentage}} + resource limit trong manifest.
- **GC log dày, heap chỉ 40% limit**: thường do CPU throttling hoặc {{ParallelGCThreads}} để mặc định theo **số core máy host** (với {{ActiveProcessorCount}} sai) — container 2 core nhưng JVM nghĩ máy 64 core, sinh hàng chục GC thread giành nhau 2 core.
- **Thread pool quá lớn trên container nhỏ**: {{server.tomcat.threads.max=200}} × 1MB stack ≈ 200MB — vượt cả reserve, OOM native. Công thức {{maxWorkerThreads}} ở trên chặn sớm điều này.
- **Quên {{ActiveProcessorCount}}** khi limit CPU không được JVM nhận đúng (cgroup v1 cũ, runtime khác): thêm {{-XX:ActiveProcessorCount=2}} để báo đúng quota.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Pod 2 CPU/4Gi, CPU dùng mới 40% nhưng latency xấu, bạn kiểm tra gì?" — trả lời theo thứ tự: (1) JVM có đọc đúng container limit không ({{Runtime.availableProcessors}}, GC log), (2) có bị throttling không ({{cpu.stat}}), (3) MaxRAMPercentage và số thread hợp lý chưa. Bài tập dưới đây bắt bạn tự cài các công thức sizing đó thành hàm Java kiểm thử được.`,
  exercises: [
    {
      title: 'ContainerSizer: tính heap, GC thread và worker pool từ limit',
      prompt: `Hoàn thiện các hàm static của {{ContainerSizer}} theo đúng công thức sizing trong bài (hằng số {{RESERVED_MIB = 128}}, {{STACK_MIB = 1}}):

- {{heapMiB(memoryMiB, percent)}}: {{memoryMiB × percent / 100}} (chia nguyên, floor với số dương).
- {{gcThreads(cpuQuota)}}: {{cpuQuota ≤ 8}} thì bằng {{cpuQuota}}; lớn hơn thì {{8 + (cpuQuota − 8) × 5 / 8}} (chia nguyên).
- {{webPoolSize(cpuQuota)}}: {{2 × cpuQuota}}.
- {{maxWorkerThreads(memoryMiB, percent)}}: {{max(0, (memoryMiB − heapMiB(memoryMiB, percent) − RESERVED_MIB) / STACK_MIB)}} — không bao giờ trả số âm.

{{cpuQuota}} luôn ≥ 1, {{percent}} trong 1..100.`,
      starter: `class ContainerSizer {
    static final int RESERVED_MIB = 128;   // metaspace + code cache + native
    static final int STACK_MIB = 1;        // -Xss mặc định Linux x64

    static int heapMiB(int memoryMiB, int percent) {
        throw new UnsupportedOperationException("TODO");
    }

    static int gcThreads(int cpuQuota) {
        throw new UnsupportedOperationException("TODO");
    }

    static int webPoolSize(int cpuQuota) {
        throw new UnsupportedOperationException("TODO");
    }

    static int maxWorkerThreads(int memoryMiB, int percent) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(int expected, int actual) {
        if (expected != actual) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("heap: 512Mi at 75% is 384", () -> eq(384, ContainerSizer.heapMiB(512, 75)));
        check("heap: 1024Mi at 50% is 512", () -> eq(512, ContainerSizer.heapMiB(1024, 50)));
        check("heap: 4096Mi at 75% is 3072", () -> eq(3072, ContainerSizer.heapMiB(4096, 75)));
        check("gcThreads: C<=8 equals C", () -> {
            eq(1, ContainerSizer.gcThreads(1));
            eq(2, ContainerSizer.gcThreads(2));
            eq(8, ContainerSizer.gcThreads(8));
        });
        check("gcThreads: C>8 uses 8+(C-8)*5/8", () -> {
            eq(13, ContainerSizer.gcThreads(16));    // 8 + 8*5/8
            eq(23, ContainerSizer.gcThreads(32));    // 8 + 24*5/8 = 8+15
            eq(43, ContainerSizer.gcThreads(64));    // 8 + 56*5/8 = 8+35
        });
        check("webPoolSize is 2x cpu", () -> {
            eq(4, ContainerSizer.webPoolSize(2));
            eq(8, ContainerSizer.webPoolSize(4));
            eq(16, ContainerSizer.webPoolSize(8));
        });
        check("workers: 1024Mi at 75% leaves 128Mi", () -> eq(128, ContainerSizer.maxWorkerThreads(1024, 75)));
        check("workers: 256Mi at 75% clamps to 0", () -> eq(0, ContainerSizer.maxWorkerThreads(256, 75)));
        check("workers: 4096Mi at 50% leaves 1920Mi", () -> eq(1920, ContainerSizer.maxWorkerThreads(4096, 50)));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class ContainerSizer {
    static final int RESERVED_MIB = 128;
    static final int STACK_MIB = 1;

    static int heapMiB(int memoryMiB, int percent) {
        return memoryMiB * percent / 100;            // chia nguyên floor với số dương
    }

    static int gcThreads(int cpuQuota) {
        if (cpuQuota <= 8) return cpuQuota;
        return 8 + (cpuQuota - 8) * 5 / 8;           // công thức ParallelGCThreads của G1
    }

    static int webPoolSize(int cpuQuota) {
        return 2 * cpuQuota;                          // quy tắc 2x core cho pool blocking
    }

    static int maxWorkerThreads(int memoryMiB, int percent) {
        int free = memoryMiB - heapMiB(memoryMiB, percent) - RESERVED_MIB;
        return Math.max(0, free / STACK_MIB);
    }
}`,
      hints: [
        'heapMiB: phép nhân rồi chia nguyên {{memoryMiB * percent / 100}} — không cần {{Math.floor}} vì cả hai là số nguyên dương.',
        'gcThreads: chia hai nhánh theo {{cpuQuota <= 8}}; nhánh lớn dùng {{8 + (cpuQuota - 8) * 5 / 8}} (chia nguyên).',
        'maxWorkerThreads: tính {{free = memoryMiB - heapMiB(...) - RESERVED_MIB}} rồi {{Math.max(0, free / STACK_MIB)}} — chia số âm trong Java vẫn là floor, nên clamp trước.',
      ],
      explain: `Các hàm mô phỏng đúng pipeline sizing mà một SRE Java hay dùng trước khi viết {{-XX:MaxRAMPercentage}}: heap lấy phần trăm bộ nhớ, phần dư trả cho native + stack; số GC thread tăng chậm để không cướp CPU; web pool gấp đôi core vì mỗi request blocking chiếm một thread.

Lỗi hay gặp:
- Tính heap bằng {{(int) (memory * percent / 100.0)}} — chạy được nhưng dễ trôi dấu khi truyền tham số sai kiểu; chia nguyên trên hai {{int}} đã đủ chính xác ở đây.
- Quên clamp {{maxWorkerThreads}} về 0: với 256Mi và 75%, heap 192 + reserve 128 đã vượt limit, kết quả số âm vô nghĩa.
- Áp dụng công thức G1 sai chỗ: {{8 + (C-8)*5/8}} chỉ dành cho ParallelGCThreads; với ZGC/CPU limit thấp thì chỉ cần {{ActiveProcessorCount}} đúng.

Ở production, bảng sizing này nên nằm trong wiki của team và mỗi lần đổi limit resource thì đối chiếu lại — tránh "tăng memory limit x2" mà quên rằng stack và pool cũ đã được tính cho limit cũ.

> Senior tip: Một lần nâng memory từ 2Gi → 4Gi mà vẫn giữ {{-XX:MaxRAMPercentage=75.0}} và không tăng {{terminationGracePeriodSeconds}} khiến heap tăng từ 1.5Gi → 3Gi, GC chạy dài hơn, và graceful shutdown bị SIGKILL ở 30s — tất cả vì sizing không được cập nhật đồng thời với resource manifest. Luôn đối chiếu lại bảng này mỗi lần thay đổi limit.`
    },
  ],
  check: [
    {
      q: 'Container có memory limit 1Gi, JVM chạy với {{-XX:MaxRAMPercentage=75.0}}. Heap tối đa JVM sẽ dùng xấp xỉ bao nhiêu?',
      options: ['256Mi', '768Mi', '1Gi', 'Chỉ biết khi chạy thật'],
      answer: 1,
      explain: `Heap = 1024Mi × 75% = 768Mi; phần còn lại (~256Mi) dành cho metaspace, code cache, thread stacks và native memory. 256Mi là nhầm với giá trị % mặc định (25%); "1Gi" là nhầm heap bằng toàn bộ limit; sizing từ limit là tính được trước, không cần chạy thật.`,
    },
    {
      q: 'Pod bị OOMKilled nhưng log Java không hề có {{OutOfMemoryError}}. Chẩn đoán nào đúng nhất?',
      options: ['JVM bị lỗi in log', 'Kernel OOM-kill do process chạm memory limit của cgroup', 'GC quá chậm nên kill', 'Ổ disk đầy'],
      answer: 1,
      explain: `OOMKilled là kernel chọn process trong cgroup vượt {{memory.max}} và kill ngay — JVM không kịp ném lỗi Java. Heap có thể vẫn "đẹp" vì native memory (metaspace, thread stack, direct buffer) mới là thứ vượt limit. "Ổ disk đầy" và "GC quá chậm" không liên quan; nếu Java tự hết heap thì bạn sẽ thấy {{OutOfMemoryError}} trong log chứ không phải trạng thái OOMKilled.`,
    },
    {
      q: 'Container CPU quota = 2 core. Số {{ParallelGCThreads}} mặc định của G1 theo công thức trong bài là bao nhiêu?',
      options: ['1', '2', '4', '8'],
      answer: 1,
      explain: `Công thức: C ≤ 8 thì ParallelGCThreads = C; C > 8 thì 8 + (C−8)×5/8. Với C = 2 → 2 GC thread. 8 là nhầm với ngưỡng chuyển công thức; 4 là nhầm với web pool (2×C); 1 là bịa.`,
    },
  ],
  related: ['devops-002', 'devops-005', 'devops-015'],
  tags: ['Docker', 'JVM', 'MaxRAMPercentage', 'container', 'sizing'],
},
{
  id: 'lesson-devops-002',
  track: 'devops',
  order: 2,
  title: 'Liveness, readiness, startup probe và state machine graceful shutdown',
  level: 'mid',
  minutes: 30,
  goals: [
    'Phân biệt được ba probe: liveness trả lời "process còn sống không", readiness trả lời "có nhận request mới không", startup trả lời "boot xong chưa"',
    'Mô tả được trình tự tắt Pod graceful: readiness false trước, đợi in-flight xong, rồi mới dừng process',
    'Viết được state machine STARTING → READY → DRAINING kiểm soát traffic cho graceful shutdown',
  ],
  body: `### Ba probe, ba câu hỏi khác nhau
Kubernetes điều khiển container hoàn toàn qua các **probe**. Trộn lẫn chúng là một trong những lỗi deploy hay gặp nhất:

| Probe | Câu hỏi | Trả false thì sao | Endpoint phù hợp |
|---|---|---|---|
| **Liveness** | Process còn **sống** không? | K8s **restart** container | {{/actuator/health/liveness}} |
| **Readiness** | Pod có **nhận request mới** không? | Pod bị gỡ khỏi {{Endpoints}}, **không** restart | {{/actuator/health/readiness}} |
| **Startup** | App đã **boot xong** chưa? | Chưa đếm vào failure của liveness — dành cho app boot lâu | {{/actuator/health}} hoặc custom, với {{failureThreshold}} lớn |

Vì sao không trỏ cả ba vào {{/actuator/health}} đầy đủ? Vì health mặc định includes DB, disk, downstream: PostgreSQL chết thì **liveness fail** → K8s restart Pod hàng loạt → outage lan ra (thay vì chỉ một Pod "not ready" dừng nhận traffic). Spring Boot cho phép tách health group:

~~~yaml
management:
  endpoint:
    health:
      probes:
        enabled: true        # thêm /health/liveness và /health/readiness
      group:
        readiness:
          include: readinessState,db,kafka     # readiness thấy DB là đủ
        liveness:
          include: livenessState               # liveness CHỈ nhìn process
~~~

{{readinessState}} và {{livenessState}} là health indicator riêng của Spring Boot, phản ánh ApplicationReadinessState / ApplicationAvailability.

### Startup: dành riêng cho app boot chậm
Spring Boot 3 với Hibernate validate + Kafka consumer + cache nóng có thể mất 60–90 giây. Nếu liveness có {{failureThreshold: 3}} {{periodSeconds: 10}} thì sau 30 giây Pod bị restart vô hạn (CrashLoopBackOff giả). {{startupProbe}} với {{failureThreshold: 30}} {{periodSeconds: 10}} cho app 300 giây để boot; trong lúc startup, liveness **chưa được đánh giá**. Boot xong thì startup probe ngừng, hai probe còn lại đảm nhiệm.

### Graceful shutdown: thứ tự quan trọng hơn tốc độ
Khi nhận SIGTERM, Kubernetes:
1. Xóa Pod khỏi Endpoints (**readiness fail ngay**) — nhưng tín hiệu này tới load balancer có thể trễ vài giây.
2. Gửi SIGTERM cho process. Spring Boot ({{server.shutdown=graceful}}) ngừng nhận kết nối mới, đợi request đang chạy tới {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30s).
3. Quá thời gian → SIGKILL. Mọi request đang chạy chết thẳng, mọi message trong consumer chưa xong mất.

Trong lúc chờ, app vẫn phải: readiness trả **false** (để lũ Pod khác trong cùng Service nhận traffic), nhưng **không restart** và **vẫn phục vụ** request đã nhận. Đó chính là trạng thái **DRAINING** (đang rút). Tóm tắt state machine:

~~~text
STARTING --markReady()--> READY --beginDraining()--> DRAINING
   |                        |                          |
   | request bị từ chối    | nhận request bình thường | request MỚI bị từ chối
   |                        |                          | request đang chạy → endRequest()
   v                        v                          v
                          DRAINING + inFlight == 0  →  process có thể tắt an toàn
~~~

Hai quy tắc bắt buộc của DRAINING:
- {{beginRequest()}} trả về từ chối (readiness false) — load balancer sẽ chuyển hướng.
- Request **đang chạy** không bị hủy: chúng giữ "in-flight" counter; chỉ khi counter về 0 (hoặc hết timeout) process mới đóng.

### Bẫy production hay gặp
- **Deploy vẫn mất request 502/503**: readiness và liveness trỏ cùng endpoint; endpoint đó nhanh nhưng app chưa đăng ký vào Service kịp, hoặc không có preStop delay — LB xóa Pod khỏi Endpoint nhưng connection đã mở trong tiến trình đi tới vẫn chết. Thêm lifecycle hook {{preStop}} chạy {{sleep 5}} để có độ trễ an toàn.
- **Liveness includes DB**: một lần DB chập chờn → restart cả cụm app. Tách health group như trên.
- **Không có startupProbe** + app boot chậm → CrashLoopBackOff, log chỉ thấy những bean nửa vời.
- **Graceful shutdown nhưng consumer Kafka bị SIGTERM giữa chừng**: {{server.shutdown=graceful}} chỉ lo HTTP; với Kafka listener phải bật {{spring.kafka.listener.ack-mode}} phù hợp và để container có đủ {{terminationGracePeriodSeconds}} (nếu mặc định 30s mà xử lý cần 45s thì vẫn bị kill).

### Liên hệ phỏng vấn
Câu kinh điển khi phỏng vấn deploy: "Mỗi lần rolling update có vài chục request 502, bạn sửa gì?" — câu trả lời đủ bộ: tách ba probe, startup probe cho app chậm, readiness fail ngay khi SIGTERM + preStop sleep, {{server.shutdown=graceful}} với timeout đủ lớn, và termination grace period > shutdown timeout. Bài tập dưới đây xây chính state machine điều khiển phần "readiness fail ngay, request cũ vẫn xong".`,
  exercises: [
    {
      title: 'ReadinessGate: state machine STARTING → READY → DRAINING',
      prompt: `Hoàn thiện {{ReadinessGate}} mô phỏng availability của một instance cho graceful shutdown:

- {{state()}}: tên trạng thái hiện tại ({{STARTING}}, {{READY}} hoặc {{DRAINING}}).
- {{markReady()}}: chuyển STARTING → READY. Nếu đang DRAINING thì **không** quay lại (không "hồi sinh" instance đang rút).
- {{beginDraining()}}: chuyển về DRAINING từ bất kỳ trạng thái nào.
- {{canServe()}}: true chỉ khi đang READY.
- {{beginRequest()}}: nếu đang READY thì ghi nhận request đang chạy và trả về id **≥ 0**; nếu không thì trả về **−1** (bị từ chối).
- {{endRequest(id)}}: kết thúc một request đã nhận (id do {{beginRequest}} trả); id không tồn tại thì bỏ qua, không làm sai bộ đếm.
- {{inFlight()}}: số request đang chạy.
- {{isDrained()}}: true khi đang DRAINING và không còn request nào chạy.`,
      starter: `class ReadinessGate {
    enum State { STARTING, READY, DRAINING }

    String state() {
        throw new UnsupportedOperationException("TODO");
    }

    void markReady() {
        throw new UnsupportedOperationException("TODO");
    }

    void beginDraining() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean canServe() {
        throw new UnsupportedOperationException("TODO");
    }

    int beginRequest() {
        throw new UnsupportedOperationException("TODO");
    }

    void endRequest(int id) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isDrained() {
        throw new UnsupportedOperationException("TODO");
    }

    int inFlight() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("starts in STARTING and rejects traffic", () -> {
            ReadinessGate g = new ReadinessGate();
            eq("STARTING", g.state());
            eq(false, g.canServe());
            eq(-1, g.beginRequest());
            eq(0, g.inFlight());
            eq(false, g.isDrained());
        });
        check("markReady transitions to READY and accepts requests", () -> {
            ReadinessGate g = new ReadinessGate();
            g.markReady();
            eq("READY", g.state());
            eq(true, g.canServe());
            int id = g.beginRequest();
            eq(true, id >= 0);
            eq(1, g.inFlight());
            eq(false, g.isDrained());          // chưa draining
            g.endRequest(id);
            eq(0, g.inFlight());
        });
        check("draining rejects new requests but lets in-flight finish", () -> {
            ReadinessGate g = new ReadinessGate();
            g.markReady();
            int a = g.beginRequest(), b = g.beginRequest();
            g.beginDraining();
            eq("DRAINING", g.state());
            eq(false, g.canServe());
            eq(-1, g.beginRequest());          // request mới bị từ chối
            eq(2, g.inFlight());
            eq(false, g.isDrained());          // còn 2 request đang chạy
            g.endRequest(a);
            eq(1, g.inFlight());
            eq(false, g.isDrained());
            g.endRequest(b);
            eq(0, g.inFlight());
            eq(true, g.isDrained());
        });
        check("markReady after draining does not resurrect", () -> {
            ReadinessGate g = new ReadinessGate();
            g.markReady();
            g.beginDraining();
            g.markReady();
            eq("DRAINING", g.state());
            eq(false, g.canServe());
        });
        check("endRequest with unknown id is ignored", () -> {
            ReadinessGate g = new ReadinessGate();
            g.markReady();
            int id = g.beginRequest();
            g.endRequest(999);                 // id giả, không được phá counter
            eq(1, g.inFlight());
            g.endRequest(id);
            eq(0, g.inFlight());
        });
        check("drain from STARTING: never served but can drain", () -> {
            ReadinessGate g = new ReadinessGate();
            g.beginDraining();                  // tắt trước khi kịp ready
            eq("DRAINING", g.state());
            eq(true, g.isDrained());            // không có request nào chạy
            g.markReady();
            eq(false, g.canServe());            // vẫn không hồi sinh
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class ReadinessGate {
    enum State { STARTING, READY, DRAINING }

    private State state = State.STARTING;
    private final Set<Integer> active = new HashSet<>();
    private int nextId;
    private int inFlight;

    String state() { return state.name(); }

    void markReady() {
        if (state == State.STARTING) state = State.READY;   // DRAINING không quay lại
    }

    void beginDraining() { state = State.DRAINING; }

    boolean canServe() { return state == State.READY; }

    int beginRequest() {
        if (state != State.READY) return -1;                // STARTING/DRAINING: từ chối
        int id = nextId++;
        active.add(id);
        inFlight++;
        return id;
    }

    void endRequest(int id) {
        if (active.remove(id)) inFlight--;                  // id lạ: bỏ qua, không đếm âm
    }

    boolean isDrained() { return state == State.DRAINING && inFlight == 0; }

    int inFlight() { return inFlight; }
}`,
      hints: [
        'Giữ một {{Set<Integer> active}} các id còn sống: {{beginRequest}} thêm id mới ({{nextId++}}), {{endRequest}} chỉ giảm khi {{remove(id)}} trả về true.',
        '{{markReady}} chỉ được phép đổi trạng thái khi còn ở {{STARTING}}; {{beginDraining}} ghi đè từ mọi trạng thái.',
        '{{isDrained()}} là phép AND: đang {{DRAINING}} **và** {{inFlight == 0}} — đang READY thì không bao giờ "drained" để tắt.',
      ],
      explain: `State machine này chính là phần ứng dụng của graceful shutdown: {{canServe()==false}} tương đương readiness probe fail → Pod rời Endpoints; {{beginRequest()==−1}} là app tự chặn request đi lạc (ví dụ kết nối cũ từ LB); {{endRequest}} giữ cho request đang chạy hoàn tất; {{isDrained()==true}} là điều kiện để process đóng ServerSocket và thoát 0.

Lỗi hay gặp:
- Cho {{markReady}} chạy từ DRAINING: instance "sống lại" sau khi LB đã cắt traffic — request không tới, hoặc worse, pod bị xoá mà traffic nghĩ nó còn.
- Đếm in-flight bằng biến nguyên không kèm id: {{endRequest}} gọi hai lần cho cùng một request thì counter âm, {{isDrained}} báo true sớm, request đang chạy bị kill.
- Quên cả timeout: trong thực tế {{isDrained}} phải kèm deadline ({{spring.lifecycle.timeout-per-shutdown-phase}}); nếu không, một request treo giữ pod sống mãi rồi bị SIGKILL đúng lúc. State machine trong JVM nên ghép với timer của container.

Khi phỏng vấn, ghép đoạn code này với cấu hình K8s (readiness probe → {{/actuator/health/readiness}}, preStop sleep, graceful shutdown timeout) thành một câu chuyện hoàn chỉnh thay vì nói chung chung "dùng probe".

> Senior tip: Một instance đang DRAINING nhưng không giảm in-flight vì một request treo (ví dụ DB transaction khóa) sẽ giữ pod sống quá 30s rồi bị SIGKILL — luôn đặt {{spring.lifecycle.timeout-per-shutdown-phase}} thấp hơn {{terminationGracePeriodSeconds}} và thêm circuit breaker cho request treo.`,
    },
  ],
  check: [
    {
      q: 'Spring Boot mất 90 giây để khởi động (Hibernate validate + nạp cache). Cấu hình probe nào đúng?',
      options: ['Liveness periodSeconds=10, failureThreshold=3', 'Chỉ readiness probe', 'StartupProbe với failureThreshold đủ lớn, liveness/readiness sau khi boot xong', 'Không cần probe, K8s tự đợi'],
      answer: 2,
      explain: `Startup probe "kéo dài" thời gian đánh giá liveness: tới khi nó pass, liveness chưa bị tính failure, tránh restart vô hạn. Liveness period 10s × 3 = 30s sẽ restart giữa chừng. Chỉ readiness thì liveness vẫn thiếu, và K8s không tự đợi — crash loop là hệ quả.`,
    },
    {
      q: 'Trong lúc graceful shutdown, readiness probe nên trả gì?',
      options: ['200 để LB còn gửi request tới', '503 (not ready) để Pod rời Endpoints, trong khi request đang chạy vẫn hoàn tất', 'Chỉ trả lời sau khi in-flight = 0', 'Endpoint bị xoá, probe fail cứng mọi giá trị'],
      answer: 1,
      explain: `Readiness false ngay từ lúc nhận SIGTERM: LB ngừng gửi request **mới**, nhưng Pod vẫn xử lý xong request **đang chạy** — đó là ý nghĩa của DRAINING. Trả 200 thì request mới vẫn dồn vào instance sắp chết; "chờ in-flight = 0" trễ phản xạ; probe không hoạt động thì K8s không biết đâu là trạng thái rút.`,
    },
    {
      q: 'Liveness và readiness cùng trỏ {{/actuator/health}} (include cả DB). DB chậm 30 giây. Điều gì xảy ra?',
      options: ['Chỉ một Pod not ready', 'Các Pod bị restart hàng loạt vì liveness fail', 'Không ảnh hưởng vì health chỉ cảnh báo', 'Chỉ readiness fail, liveness bỏ qua DB'],
      answer: 1,
      explain: `Health đầy đủ include DB → DB chậm làm liveness fail → K8s **restart** container (không chỉ gỡ khỏi Endpoints) → cụm app "chết giả" chồng lên sự cố DB. Readiness fail chỉ cắt traffic là đủ; liveness phải include mỗi livenessState. Health indicator không tự bỏ qua DB.`,
    },
  ],
  related: ['devops-004', 'devops-016', 'devops-017'],
  tags: ['Kubernetes', 'probe', 'readiness', 'graceful shutdown', 'Spring Boot'],
},
{
  id: 'lesson-devops-003',
  track: 'devops',
  order: 3,
  title: 'Rolling, blue-green, canary: hash ổn định chia traffic và tự rollback theo error rate',
  level: 'senior',
  minutes: 35,
  goals: [
    'So sánh rolling, blue-green và canary theo blast radius, chi phí tài nguyên, rollback và ràng buộc dữ liệu',
    'Thiết kế được cơ chế canary chia % traffic bằng hash ổn định của userId để cùng user luôn thấy cùng version',
    'Xây được auto-rollback: nút chặn bằng error rate + ngưỡng mẫu tối thiểu, tránh rollback vì noise',
  ],
  body: `### Ba chiến lược, ba đánh đổi
| Chiến lược | Blast radius | Chi phí | Rollback | Ràng buộc dữ liệu |
|---|---|---|---|---|
| **Rolling update** | Cả cụm theo chu kỳ, version lẫn lộn trong lúc deploy | Thấp nhất (giữ {{maxSurge}}/{{maxUnavailable}}) | Rollback = deploy lại bản cũ, chậm | Migration phải tương thích cả hai version |
| **Blue-green** | Switch một lần, nhưng switch sai là 100% traffic | Đôi tài nguyên (hai environment) | Nhanh: đổi service selector về blue | Migration phải "đổi hướng" ngay được, thường kèm feature flag |
| **Canary** | Theo % traffic, thường 1→5→25→100 | Trung bình (thêm vài pod canary) | Nhanh: giảm % về 0 | Version cũ/mới cùng serve; DB tương thích tuyệt đối |

Canary mạnh ở chỗ **dữ liệu production thật** quyết định có tiếp tục không: sau 5% traffic trong 15 phút, error rate, latency p99 và log của bản mới đã có ý nghĩa thống kê — điều blue-green không có trước khi switch.

### Chia traffic: hash ổn định thay vì "ngẫu nhiên mỗi request"
Load balancer chia đều theo connection/request sẽ khiến **cùng một user** chạm cả hai version trong một phiên: user tạo đơn trên bản mới, bước thanh toán trên bản cũ → lỗi schema kinh điển. Giải pháp: **sticky theo userId** bằng hàm hash ổn định:

~~~text
bucket = floorMod(userId.hashCode(), 100)     // 0..99
bucket < canaryPercent  →  version "canary"
ngược lại               →  version "stable"
~~~

{{String.hashCode()}} được định nghĩa trong specification của JVM nên **giữa các tiến trình là như nhau** (không giống identity hashCode). Nhờ vậy mọi replica, mọi gateway tự quyết định route mà không cần session store chung. Tỉ lệ xấp xỉ {{canaryPercent}}% trên tập user đủ lớn; mỗi user riêng lẻ vẫn luôn về cùng một version — vừa chống "split session", vừa cho phép quan sát đúng tập user canary.

Chiến thuật rollout: 1% → 5% → 20% → 50% → 100%, mỗi bước có cửa sổ quan sát. Ở mọi mức %, hash quyết định tập user là **tập con** của % thấp hơn (user canary 1% vẫn là canary khi nâng lên 20%) — nâng dần không làm user nhảy version giữa chừng.

### Tự rollback: ngưỡng + mẫu tối thiểu + cửa sổ trượt
Canary chỉ có ý nghĩa khi **so sánh** được. Tự động rollback cần ba thứ:

1. **Error rate** theo version: {{failures / total}} trong cửa sổ trượt (ví dụ 5 phút gần nhất), không phải cumulative từ đầu đời — bug có thể ở một cụm user cụ thể.
2. **Ngưỡng mẫu tối thiểu** (minSamples): 3 request lỗi trên 3 request đầu = 100% error rate, nhưng chưa đủ bằng chứng để kill release. Kinh điển: ≥ 20–50 request hoặc ≥ 5 phút.
3. **Ngưỡng so sánh** (error threshold): thường là max(abs, factor × baseline). Đơn giản: {{errorRate("canary") > 0.02}} (2%) và canary đã có ≥ 30 mẫu.

~~~text
record(version, success)           // append vào cửa sổ
nếu canary.samples >= minSamples
   và canary.errorRate > threshold:
       rollback(): canaryPercent = 0  →  100% traffic về stable
~~~

Sau rollback, **không** dừng quan sát: logs, traces của đoạn canary ngắn là vàng cho postmortem. Ngoài ra cần phân biệt rollback **tự động** (an toàn, chỉ giảm %) với promote 100% (cần tín hiệu đủ tốt: error rate ≤ baseline, không có anomaly khác).

### Bẫy production hay gặp
- **Hash theo {{Random()}} mỗi request**: user đổi version liên tục; thậm chí hai request song song của cùng user đi hai nơi. Phải hash **thứ tự ổn định của user** (userId, hoặc accountId cho luồng tiền).
- **CanaryPercent đổi giữa chừng giữa hai lần tính hash của cùng user session**: khi roll 5% → 20%, user 5% giữ nguyên (đúng), nhưng nếu code dùng "random < percent" thì user nhảy lung tung. Dùng bucket cố định 0..99 rồi so với percent.
- **Rollback vì noise**: 100 request đầu mà 3 lỗi đã kill release vào 2h sáng; ngày hôm sau 5% traffic cả tuần cũng không được thử. Min samples + ngưỡng so sánh với baseline của stable mới công bằng.
- **Migration DB một chiều**: canary ghi dữ liệu kiểu mới trong lúc stable còn đọc kiểu cũ — deploy canary xong thì rollback **không thể** vì data đã ghi. Kỹ thuật expand-contract (mở rộng schema tương thích cả hai, migrate, thu hẹp) là điều kiện tiên quyết của canary trên hệ thống có state.
- **Quên giới hạn canary ở hạ tầng**: traffic 5% nhưng metrics/log chỉ có nhãn version khi code tự tag; so sánh p99 không làm được nếu gateway không truyền header {{X-Version}}.

### Liên hệ phỏng vấn
Câu hỏi senior kinh điển: "Service thanh toán, bạn chọn chiến lược gì và tự rollback thế nào?" — trả lời: canary theo % với hash ổn định của userId (sticky session, không cần store chung), quan sát error rate theo version với min samples, rollback bằng cách hạ % về 0; điều kiện tiên quyết là migration expand-contract để bản cũ luôn rollback được. Bài tập dưới đây dựng chính bộ định tuyến + auto-rollback đó bằng Java thuần.`,
  exercises: [
    {
      title: 'CanaryRouter: hash ổn định chia traffic và tự rollback khi error rate vượt ngưỡng',
      prompt: `Hoàn thiện {{CanaryRouter}} mô phỏng gateway canary:

- Constructor {{CanaryRouter(canaryPercent, errorThreshold, minSamples)}}: {{canaryPercent}} clamp về 0..100; hai tham số sau giữ nguyên.
- {{route(userId)}}: trả về {{canary}} hoặc {{stable}}. Dùng {{bucket = Math.floorMod(userId.hashCode(), 100)}}; {{bucket < canaryPercent}} thì canary. {{canaryPercent == 0}} thì luôn stable; {{== 100}} thì luôn canary. Cùng userId luôn ra cùng kết quả (hash ổn định).
- {{record(version, success)}}: ghi một kết quả request cho version ({{canary}} hoặc {{stable}}); {{success == false}} là lỗi.
- {{errorRate(version)}}: {{failures / total}} của version đó, chưa có mẫu nào thì trả 0.0.
- {{shouldRollback()}}: true khi {{canary}} có **ít nhất** {{minSamples}} mẫu **và** {{errorRate("canary") > errorThreshold}}. Chưa đủ mẫu thì dù 100% lỗi cũng false.
- {{rollback()}}: đặt {{canaryPercent = 0}} — mọi request sau đó về stable.
- {{canaryPercent()}}: tỉ lệ hiện tại.`,
      starter: `class CanaryRouter {
    CanaryRouter(int canaryPercent, double errorThreshold, int minSamples) {
        throw new UnsupportedOperationException("TODO");
    }

    String route(String userId) {
        throw new UnsupportedOperationException("TODO");
    }

    void record(String version, boolean success) {
        throw new UnsupportedOperationException("TODO");
    }

    double errorRate(String version) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean shouldRollback() {
        throw new UnsupportedOperationException("TODO");
    }

    void rollback() {
        throw new UnsupportedOperationException("TODO");
    }

    int canaryPercent() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void eq(double expected, double actual, double eps) {
        if (Math.abs(expected - actual) > eps) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("0% all stable, 100% all canary, clamp out-of-range", () -> {
            CanaryRouter r0 = new CanaryRouter(0, 0.02, 10);
            CanaryRouter r100 = new CanaryRouter(100, 0.02, 10);
            CanaryRouter neg = new CanaryRouter(-5, 0.02, 10);
            CanaryRouter big = new CanaryRouter(150, 0.02, 10);
            for (String u : new String[]{"u1", "u2", "alice", "bob-77"}) {
                eq("stable", r0.route(u));
                eq("stable", neg.route(u));
                eq("canary", r100.route(u));
                eq("canary", big.route(u));
            }
            eq(0, r0.canaryPercent());
            eq(0, neg.canaryPercent());
            eq(100, r100.canaryPercent());
            eq(100, big.canaryPercent());
        });
        check("same user always same version (sticky)", () -> {
            CanaryRouter r = new CanaryRouter(30, 0.02, 10);
            String first = r.route("user-42");
            for (int i = 0; i < 50; i++) eq(first, r.route("user-42"));
        });
        check("50% splits a large user set roughly half/half", () -> {
            CanaryRouter r = new CanaryRouter(50, 0.02, 10);
            int canary = 0;
            for (int i = 0; i < 1000; i++) if ("canary".equals(r.route("user-" + i))) canary++;
            if (canary < 300 || canary > 700) throw new AssertionError("canary count = " + canary + ", mong đợi gần 500");
        });
        check("no rollback before minSamples even at 100% errors", () -> {
            CanaryRouter r = new CanaryRouter(10, 0.3, 10);
            for (int i = 0; i < 9; i++) r.record("canary", false);
            eq(1.0, r.errorRate("canary"), 1e-9);
            eq(false, r.shouldRollback());
        });
        check("rollback when canary crosses threshold with enough samples", () -> {
            CanaryRouter r = new CanaryRouter(10, 0.3, 10);
            for (int i = 0; i < 30; i++) r.record("canary", i >= 5);   // 5 lỗi / 30 ≈ 0.167
            eq(false, r.shouldRollback());
            for (int i = 0; i < 5; i++) r.record("canary", false);      // 10 lỗi / 35 ≈ 0.286
            eq(false, r.shouldRollback());                              // vẫn dưới 0.3
            r.record("canary", false);                                  // 11/36 ≈ 0.305 > 0.3
            eq(true, r.shouldRollback());
            r.rollback();
            eq(0, r.canaryPercent());
            eq("stable", r.route("user-42"));
            eq("stable", r.route("alice"));
        });
        check("stable errors do not trigger canary rollback", () -> {
            CanaryRouter r = new CanaryRouter(50, 0.1, 10);
            for (int i = 0; i < 50; i++) r.record("stable", false);
            for (int i = 0; i < 20; i++) r.record("canary", true);
            eq(0.0, r.errorRate("canary"), 1e-9);
            eq(false, r.shouldRollback());
        });
        check("empty version has zero error rate", () -> {
            CanaryRouter r = new CanaryRouter(10, 0.01, 5);
            eq(0.0, r.errorRate("canary"), 1e-9);
            eq(0.0, r.errorRate("stable"), 1e-9);
            eq(false, r.shouldRollback());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class CanaryRouter {
    private int canaryPercent;
    private final double errorThreshold;
    private final int minSamples;
    private final Map<String, int[]> stats = new HashMap<>();   // version -> [total, failures]

    CanaryRouter(int canaryPercent, double errorThreshold, int minSamples) {
        this.canaryPercent = Math.max(0, Math.min(100, canaryPercent));
        this.errorThreshold = errorThreshold;
        this.minSamples = minSamples;
    }

    String route(String userId) {
        if (canaryPercent <= 0) return "stable";
        if (canaryPercent >= 100) return "canary";
        // String.hashCode là chuẩn specification: mọi tiến trình tính cùng bucket → sticky theo user
        int bucket = Math.floorMod(userId.hashCode(), 100);
        return bucket < canaryPercent ? "canary" : "stable";
    }

    void record(String version, boolean success) {
        int[] s = stats.computeIfAbsent(version, k -> new int[2]);
        s[0]++;
        if (!success) s[1]++;
    }

    double errorRate(String version) {
        int[] s = stats.get(version);
        if (s == null || s[0] == 0) return 0.0;
        return (double) s[1] / s[0];
    }

    boolean shouldRollback() {
        int[] s = stats.get("canary");
        if (s == null || s[0] < minSamples) return false;      // chưa đủ bằng chứng
        return errorRate("canary") > errorThreshold;
    }

    void rollback() { canaryPercent = 0; }                     // 100% về stable

    int canaryPercent() { return canaryPercent; }
}`,
      hints: [
        'Lưu stats dạng {{Map<String, int[]>}} với mảng 2 phần tử [total, failures]; {{record}} tăng total và tăng failures khi {{!success}}.',
        'Route: xử lý sớm 2 biên ({{<= 0}} always stable, {{>= 100}} always canary), giữa dùng {{Math.floorMod(userId.hashCode(), 100) < canaryPercent}}.',
        'shouldRollback: kiểm tra {{samples >= minSamples}} **trước** errorRate — 9/9 lỗi vẫn phải false để tránh rollback vì noise.',
      ],
      explain: `Hash ổn định của userId đảm bảo hai tính chất gateway canary cần: (1) tỉ lệ xấp xỉ % đã cấu hình trên tập user lớn, (2) sticky — cùng user không bao giờ nhảy version giữa chừng, nên không có "split session" giữa hai version schema khác nhau. {{Math.floorMod}} xử lý cả hashCode âm (không có chỉ số bucket âm).

{{shouldRollback}} gộp hai điều kiện: đủ mẫu (thống kê) và vượt ngưỡng (chất lượng). Đây là phần "tự động" của auto-rollback: khi true, gateway chỉ cần set canaryPercent = 0 — traffic về 100% stable ngay, không cần redeploy. Ở hệ thống thật, errorRate còn so với baseline của stable ({{canaryRate > max(threshold, 3 × stableRate)}}) để không rollback một release vốn dĩ vẫn tốt hơn bản cũ.

Lỗi hay gặp:
- Tính route bằng {{ThreadLocalRandom.current().nextInt(100) < percent}}: mỗi request một lần tung xúc xắc, user liên tục đổi version — đúng cho phân phối traffic, sai cho sticky session. Phải hash định danh user.
- Dùng cumulative error rate từ đầu đời release: một incident nửa giờ trước làm lệch mãi mãi, không thấy hồi phục. Cửa sổ trượt (hoặc reset stats định kỳ) là cần thiết.
- Rollback bằng redeploy bản cũ: chậm 5–10 phút, trong khi hạ % về 0 là vài giây. Với DB tương thích cả hai version (expand-contract) thì % = 0 luôn an toàn.
- Sau khi rollback mà quên {{minSamples}} khi tăng % tiếp: nâng 1% → 50% với cùng ngưỡng tuyệt đối thì 50% chỉ cần vài mẫu là "đủ", không công bằng. Ở production thường đặt minSamples tuyến tính theo %.

Khi phỏng vấn, nối ba mảnh: chiến lược (canary), định tuyến (hash ổn định của userId), và cơ chế dừng (error rate + minSamples + hạ % về 0), kèm điều kiện migration để rollback data an toàn.

> Senior tip: Một lần rollback từ 20% → 0% nhưng vẫn giữ stats cũ sẽ khiến lần rollout tiếp theo (ví dụ 5%) ngay lập tức bị rollback vì stats cũ vượt ngưỡng — luôn reset stats khi rollback hoặc dùng cửa sổ trượt mới cho mỗi rollout.`
    },
  ],
  check: [
    {
      q: 'Gateway canary chia traffic theo {{Math.floorMod(userId.hashCode(), 100) < canaryPercent}}. Tính chất quan trọng nhất của cách này là gì?',
      options: ['Traffic chia đều tuyệt đối từng giây', 'Cùng userId luôn thấy cùng version; tỉ lệ xấp xỉ % trên tập user lớn', 'Không cần quan sát error rate', 'Chỉ hoạt động khi bật sticky cookie'],
      answer: 1,
      explain: `Hash của userId là hàm ổn định: mọi request của cùng user về cùng bucket → không split session giữa hai version. Tỉ lệ chỉ xấp xỉ % (đủ thống kê trên tập lớn), không chia đều tuyệt đối từng giây — và đó không phải mục tiêu. Canary vẫn cần quan sát error rate; sticky cookie không tham gia vì hash đã tự sticky.`,
    },
    {
      q: 'Canary mới nhận 3 request, cả 3 đều lỗi (error rate 100%), minSamples = 30. Hành vi đúng của auto-rollback?',
      options: ['Rollback ngay vì 100% > 2%', 'Không rollback vì chưa đủ mẫu', 'Rollback và suspend release vĩnh viễn', 'Nhân error rate lên 30 rồi so ngưỡng'],
      answer: 1,
      explain: `Min samples là ngưỡng bằng chứng: 3/3 chưa đủ để kết luận release hỏng (và có thể là lỗi hạ tầng chung). Rollback ngay tạo flapping release vào giờ cao điểm. Không có logic "nhân mẫu"; và "suspend vĩnh viễn" không phải hành vi của auto-rollback — chỉ giảm % về 0 rồi điều tra.`,
    },
    {
      q: 'Sau khi auto-rollback hạ canaryPercent về 0, bước nào là đúng tiếp theo?',
      options: ['Xóa toàn bộ metrics/logs canary', 'Giữ quan sát đoạn traffic canary ngắn làm bằng chứng postmortem, sửa bug rồi rollout lại theo % nhỏ', 'Tăng ngay 100% traffic sang bản stable mới', 'Deploy lại cùng bản canary ở 50%'],
      answer: 1,
      explain: `Dữ liệu của đoạn canary (logs, traces, error pattern) là nguồn gốc của root cause. Sau khi sửa, rollout lại từ % nhỏ với minSamples đã điều chỉnh. Xóa metrics thì mất chứng cứ; tăng 100% ngay là bỏ qua quy trình; deploy lại bản còn bug ở 50% lặp lại sự cố.`,
    },
  ],
  related: ['devops-004', 'devops-019', 'devops-021'],
  tags: ['canary', 'rolling update', 'blue-green', 'rollback', 'traffic splitting'],
},
);
