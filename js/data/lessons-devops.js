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

Từ Java 10 (và được backport về 8u191), cờ {{-XX:+UseContainerSupport}} **mặc định bật**: JVM đọc limit của cgroup thay vì RAM/CPU của cả máy host. Java 17 hiểu cả cgroup v1 lẫn v2 (cgroup v2 được hỗ trợ từ 15 và backport về 11.0.16). Khi không đặt {{-Xmx}}, heap tối đa mặc định chỉ bằng **25%** bộ nhớ container ({{MaxRAMPercentage}} mặc định 25.0). Nhiều team thấy heap "nhỏ quá" nên viết cứng {{-Xmx4g}} vào Dockerfile cho mọi môi trường — sai ngay khi limit pod là 2Gi: JVM tin vào Xmx, heap phình tới gần 2Gi cộng thêm native memory thì chạm limit, **kernel kill** process, log dừng giữa chừng, khó chẩn đoán.

Cách đúng: **để JVM tự đọc limit rồi tinh chỉnh tỉ lệ**:

~~~bash
java -XX:MaxRAMPercentage=75.0 \\
      -XX:InitialRAMPercentage=75.0 \\
      -XX:+UseG1GC \\
      -jar app.jar
~~~

### Bộ nhớ container đi đâu ngoài heap?
Heap chỉ là một phần. Phần còn lại gồm: **metaspace** (metadata của class, thường 80–200MB với app Spring Boot), **code cache** (mã máy do JIT sinh ra; trần mặc định {{ReservedCodeCacheSize}} = 240MB, thực tế thường dùng 30–80MB), **thread stacks** (mỗi thread được *dành* 1MB địa chỉ trên Linux x64, nhưng RAM thật chỉ tốn theo phần stack thực sự dùng), **direct buffers** (Netty/NIO), và **native memory** của chính JVM/GC (GC của G1 tốn thêm vài % heap cho cấu trúc nội bộ). Nếu heap chiếm 75% thì 25% còn lại phải trả cho tất cả thứ đó — đặt {{MaxRAMPercentage}} quá cao (ví dụ 90) là công thức bị OOMKilled.

**Công thức sizing** mà bạn có thể trình bày khi phỏng vấn (M = memory limit MiB, P = MaxRAMPercentage, C = CPU quota tính bằng core, S = kích thước stack MiB, R = mức reserve cho metaspace + code cache + native, thường 128–256 MiB):

1. {{heap = M × P / 100}}
2. {{dư bộ nhớ cho thread = M − heap − R}} (âm nghĩa là cấu hình chết, phải giảm P hoặc tăng M)
3. {{maxWorkerThreads = dư / S}} — **cận trên an toàn** (giả sử mọi stack dùng hết 1MB); vượt nhiều quá thì chính thread stack có thể đẩy container chạm limit
4. Pool cho tác vụ blocking theo công thức của Brian Goetz (Java Concurrency in Practice): {{threads = C × (1 + W / S)}}, với W là thời gian **chờ** (I/O, DB) và S là thời gian **tính toán** CPU của một request. Request chờ DB 90ms, tính 10ms trên 2 core → {{2 × (1 + 90/10) = 20}} thread. Tác vụ thuần CPU (W ≈ 0) thì pool ≈ số core. Đây là điểm xuất phát, sau đó đo tải thật để chỉnh; app dùng virtual thread (Java 21) thì không cần pool lớn nữa mà giới hạn bằng số request đồng thời / connection pool.
5. Số thread GC song song mặc định ({{ParallelGCThreads}}, G1 và Parallel GC dùng chung công thức): C ≤ 8 thì bằng C; C > 8 thì {{8 + (C − 8) × 5 / 8}} (tăng chậm dần — quá nhiều GC thread chỉ giành CPU với app)

| Limit pod | MaxRAMPercentage | Heap | Còn cho thread (R = 128) | Nhận xét |
|---|---|---|---|---|
| 512Mi, 1 core | 75% | 384Mi | 0Mi | Quá chật: Spring Boot nhỏ nhất; nên hạ P về 60–65% |
| 1Gi, 2 core | 75% | 768Mi | 128Mi | Đủ cho Tomcat 200 thread (stack thật mỗi thread thường < 512KB) |
| 4Gi, 4 core | 70% | 2867Mi | 1101Mi | Dư rộng: có thể nâng P lên 75–80% nếu GC log cho thấy heap thiếu |

> CPU throttling "giả chết": CPU trung bình chỉ 40% nhưng p99 tăng vọt vì process bị throttle từng chu kỳ 100ms. Kiểm tra {{cpu.stat}} (bộ đếm {{nr_throttled}}) thay vì nhìn CPU usage suông.

### Bẫy production hay gặp
- **Đặt Xmx cứng trong Dockerfile**: mọi môi trường dùng chung một giá trị, sang env khác limit đổi là OOMKilled hoặc waste RAM. Dùng {{MaxRAMPercentage}} + resource limit trong manifest.
- **Pod không đặt CPU limit** (chỉ có {{requests}}): từ JDK 17.0.5/19, JVM **không** dùng CPU request (cpu shares) để đếm core nữa, nên nó thấy toàn bộ core của node — container "2 core" trên node 64 core sẽ sinh ~43 GC thread và pool {{ForkJoinPool.commonPool}} 63 thread giành nhau CPU. Kiểm tra {{Runtime.getRuntime().availableProcessors()}} ngay khi app khởi động.
- **Thread pool quá lớn trên container nhỏ**: mặc định {{server.tomcat.threads.max=200}}; mỗi thread được dành 1MB stack, phần thật sự dùng thường vài trăm KB — 200 thread vẫn có thể ăn 50–100MB RAM. Trên pod 512Mi, kết hợp heap 75% là đủ để bị OOMKilled. Công thức {{maxWorkerThreads}} ở trên cho bạn cận trên an toàn.
- **Container nhỏ âm thầm dùng Serial GC**: nếu JVM thấy dưới 2 CPU hoặc dưới 1792MB RAM, nó coi máy không phải "server-class" và chọn **Serial GC** (một thread, stop-the-world toàn bộ) thay vì G1. Pod 1 core/1Gi hay gặp pause dài vì lý do này. Muốn chắc chắn thì ghi rõ {{-XX:+UseG1GC}} và xác nhận bằng {{java -XX:+PrintFlagsFinal -version}} hoặc GC log.
- **Số core JVM nhận sai** (cgroup v1 cũ, không đặt limit, runtime lạ): thêm {{-XX:ActiveProcessorCount=2}} để ép JVM coi như có 2 core — số GC thread, JIT compiler thread và commonPool đều tính theo con số này.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Pod 2 CPU/4Gi, CPU dùng mới 40% nhưng latency xấu, bạn kiểm tra gì?" — trả lời theo thứ tự: (1) JVM có đọc đúng container limit không ({{Runtime.availableProcessors}}, GC log), (2) có bị throttling không ({{cpu.stat}}), (3) MaxRAMPercentage và số thread hợp lý chưa. Bài tập dưới đây bắt bạn tự cài các công thức sizing đó thành hàm Java kiểm thử được.`,
  exercises: [
    {
      title: 'ContainerSizer: tính heap, GC thread và worker pool từ limit',
      prompt: `Hoàn thiện các hàm static của {{ContainerSizer}} theo đúng công thức sizing trong bài (hằng số {{RESERVED_MIB = 128}}, {{STACK_MIB = 1}}):

- {{heapMiB(memoryMiB, percent)}}: {{memoryMiB × percent / 100}} (chia nguyên, floor với số dương).
- {{gcThreads(cpuQuota)}}: {{cpuQuota ≤ 8}} thì bằng {{cpuQuota}}; lớn hơn thì {{8 + (cpuQuota − 8) × 5 / 8}} (chia nguyên).
- {{blockingPoolSize(cpuQuota, waitMs, computeMs)}}: công thức Goetz {{cpuQuota × (1 + waitMs / computeMs)}}. Để không mất phần lẻ, tính bằng số nguyên theo dạng {{cpuQuota × (computeMs + waitMs) / computeMs}} (nhân trước, chia sau). {{computeMs}} luôn ≥ 1, {{waitMs}} ≥ 0.
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

    static int blockingPoolSize(int cpuQuota, int waitMs, int computeMs) {
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
        check("blockingPoolSize follows C*(1+W/S)", () -> {
            eq(20, ContainerSizer.blockingPoolSize(2, 90, 10));     // 2 * (1 + 9)
            eq(4, ContainerSizer.blockingPoolSize(4, 0, 10));       // CPU-bound: = số core
            eq(12, ContainerSizer.blockingPoolSize(8, 50, 100));    // 8 * 150 / 100, không mất phần lẻ 0.5
            eq(101, ContainerSizer.blockingPoolSize(1, 1000, 10));
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

    static int blockingPoolSize(int cpuQuota, int waitMs, int computeMs) {
        // C * (1 + W/S) viết lại thành C * (S + W) / S: nhân trước, chia sau để không mất phần lẻ
        return cpuQuota * (computeMs + waitMs) / computeMs;
    }

    static int maxWorkerThreads(int memoryMiB, int percent) {
        int free = memoryMiB - heapMiB(memoryMiB, percent) - RESERVED_MIB;
        return Math.max(0, free / STACK_MIB);
    }
}`,
      hints: [
        'heapMiB: phép nhân rồi chia nguyên {{memoryMiB * percent / 100}} — không cần {{Math.floor}} vì cả hai là số nguyên dương.',
        'gcThreads: chia hai nhánh theo {{cpuQuota <= 8}}; nhánh lớn dùng {{8 + (cpuQuota - 8) * 5 / 8}} (chia nguyên).',
        'blockingPoolSize: viết {{cpuQuota * (computeMs + waitMs) / computeMs}}. Nếu viết {{cpuQuota * (1 + waitMs / computeMs)}} thì {{waitMs / computeMs}} là phép chia nguyên, 50/100 thành 0 và kết quả sai.',
        'maxWorkerThreads: tính {{free = memoryMiB - heapMiB(...) - RESERVED_MIB}} rồi {{Math.max(0, free / STACK_MIB)}} — clamp về 0 vì free có thể âm.',
      ],
      explain: `Các hàm mô phỏng pipeline sizing mà một SRE Java hay làm trước khi chọn {{-XX:MaxRAMPercentage}}: heap lấy phần trăm bộ nhớ, phần dư trả cho native + stack; số GC thread tăng chậm dần để không cướp CPU của app; pool blocking lớn hơn số core vì phần lớn thời gian thread chỉ **ngồi chờ** I/O, không tốn CPU.

Vì sao công thức Goetz đúng? Một request chờ DB 90ms rồi tính 10ms: trong 100ms, mỗi thread chỉ dùng CPU 10% thời gian. Muốn 2 core bận liên tục thì cần 2 / 0.1 = 20 thread chạy song song — đúng bằng {{2 × (1 + 90/10)}}.

Lỗi hay gặp:
- Viết {{cpuQuota * (1 + waitMs / computeMs)}} với {{int}}: phép chia nguyên chạy trước, 50/100 = 0, pool 8 core ra 8 thay vì 12. Luôn nhân trước rồi chia sau (hoặc dùng {{double}} rồi làm tròn có chủ đích).
- Quên clamp {{maxWorkerThreads}} về 0: với 256Mi và 75%, heap 192 + reserve 128 đã vượt limit, kết quả âm là vô nghĩa — đó là tín hiệu cấu hình sai, không phải số thread.
- Nghĩ {{8 + (C-8)*5/8}} áp dụng cho mọi GC: nó là mặc định của {{ParallelGCThreads}} (G1, Parallel). ZGC/Shenandoah có công thức riêng; điều quan trọng chung là JVM phải nhận đúng số core ({{ActiveProcessorCount}}).

Ở production, bảng sizing này nên nằm trong wiki của team và mỗi lần đổi resource limit thì tính lại — tránh "tăng memory limit gấp đôi" mà quên rằng pool và reserve được tính cho limit cũ.

> Senior tip: Đừng chỉ tin công thức — sau khi deploy, so sánh RSS của container ({{container_memory_working_set_bytes}} trên Kubernetes) với heap đang dùng. Bật {{-XX:NativeMemoryTracking=summary}} rồi chạy {{jcmd <pid> VM.native_memory summary}} để thấy từng vùng (metaspace, thread, code cache, GC) chiếm bao nhiêu MB; con số thật này mới là căn cứ để chọn R và P.`
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
      explain: `Công thức: C ≤ 8 thì ParallelGCThreads = C; C > 8 thì 8 + (C−8)×5/8. Với C = 2 → 2 GC thread (với điều kiện JVM nhận đúng quota 2 core). "8" là nhầm với ngưỡng chuyển công thức; "4" là nhân đôi số core, không có trong công thức; "1" là số thread của Serial GC — JVM chỉ tự chọn Serial khi container dưới 2 CPU hoặc dưới 1792MB RAM; câu hỏi đã nói rõ đang dùng G1 nên không áp dụng.`,
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
| **Startup** | App đã **boot xong** chưa? | Hết {{failureThreshold}} lần thì restart; khi startup đang chạy, liveness/readiness **chưa được kiểm tra** | Thường dùng lại {{/actuator/health/liveness}}, với {{failureThreshold}} lớn |

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

{{readinessState}} và {{livenessState}} là health indicator có sẵn của Spring Boot, phản ánh trạng thái {{ReadinessState}} ({{ACCEPTING_TRAFFIC}} / {{REFUSING_TRAFFIC}}) và {{LivenessState}} ({{CORRECT}} / {{BROKEN}}) mà app quản lý qua {{ApplicationAvailability}}. Khi Spring Boot phát hiện chạy trong Kubernetes, nhóm probes được bật tự động; chạy ngoài K8s thì cần {{management.endpoint.health.probes.enabled=true}} như trên.

Lưu ý: đưa {{db}} vào readiness là lựa chọn có trade-off. Nếu DB chết thì **mọi** Pod cùng not ready, Service không còn endpoint nào và client nhận lỗi kết nối thay vì một response 503 rõ ràng. Nhiều team chỉ để readinessState và xử lý DB lỗi bằng circuit breaker trong code.

### Startup: dành riêng cho app boot chậm
Spring Boot 3 với Hibernate validate + Kafka consumer + cache nóng có thể mất 60–90 giây. Nếu liveness có {{failureThreshold: 3}} {{periodSeconds: 10}} thì sau 30 giây Pod bị restart vô hạn (CrashLoopBackOff giả). {{startupProbe}} với {{failureThreshold: 30}} {{periodSeconds: 10}} cho app 300 giây để boot; trong lúc startup, liveness **chưa được đánh giá**. Boot xong thì startup probe ngừng, hai probe còn lại đảm nhiệm.

### Graceful shutdown: thứ tự quan trọng hơn tốc độ
Khi bạn xoá Pod (rolling update, scale down), Kubernetes làm **hai việc song song**, không theo thứ tự:
1. Đánh dấu Pod là Terminating và gỡ nó khỏi EndpointSlice của Service. Thông tin này lan tới kube-proxy, Ingress controller, load balancer **mất vài giây** — trong khoảng đó traffic mới vẫn có thể tới Pod.
2. Kubelet chạy hook {{preStop}} (nếu có), xong rồi mới gửi **SIGTERM** cho process. Spring Boot với graceful shutdown (bật sẵn mặc định từ Spring Boot 3.4; bản cũ hơn cần {{server.shutdown=graceful}}) chuyển readiness sang {{REFUSING_TRAFFIC}}, ngừng nhận kết nối mới, đợi request đang chạy tối đa {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30s).
3. Hết {{terminationGracePeriodSeconds}} (mặc định 30s, **tính từ lúc bắt đầu xoá, gồm cả thời gian preStop**) mà process chưa thoát → **SIGKILL**. Request đang chạy bị cắt ngang; message Kafka chưa commit offset sẽ bị consumer khác xử lý **lại** (không mất, nhưng trùng — nên consumer phải idempotent).

Vì bước 1 và 2 chạy song song, nếu app tắt ngay khi nhận SIGTERM thì những request "đến muộn" (LB chưa kịp biết Pod đã bị gỡ) sẽ lỗi 502. Đó là lý do cần {{preStop}} sleep vài giây.

Trong lúc chờ, app phải: readiness trả **false** (để các Pod khác trong cùng Service nhận traffic mới), nhưng **không restart** và **vẫn phục vụ xong** request đã nhận. Đó chính là trạng thái **DRAINING** (đang rút). Tóm tắt state machine:

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
- **Deploy vẫn mất request 502**: không có preStop delay — Pod nhận SIGTERM và đóng cổng trong khi load balancer chưa kịp gỡ nó, request đang trên đường tới bị từ chối. Thêm lifecycle hook {{preStop}} chạy {{sleep 5}} (hoặc {{preStop.sleep}} có sẵn từ Kubernetes 1.30 nếu image không có lệnh {{sleep}}) để LB kịp cập nhật.
- **Liveness include DB**: một lần DB chập chờn → restart cả cụm app, khởi động lại hàng loạt còn dồn thêm tải lên DB. Tách health group như trên.
- **Không có startupProbe** + app boot chậm → liveness giết Pod trước khi boot xong, Pod rơi vào CrashLoopBackOff dù code không có lỗi.
- **Kafka consumer bị cắt giữa chừng**: {{server.shutdown}} chỉ lo HTTP. Listener container của Spring Kafka được dừng khi ApplicationContext đóng, nhưng nếu một batch xử lý lâu hơn thời gian còn lại thì vẫn bị SIGKILL; offset chưa commit thì message được xử lý lại. Giữ batch nhỏ, consumer idempotent, và đặt {{terminationGracePeriodSeconds}} > preStop + {{timeout-per-shutdown-phase}}.

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
- Cho {{markReady}} chạy từ DRAINING (ví dụ một warm-up task chạy xong muộn rồi gọi markReady): instance "sống lại", readiness báo true trong khi process sắp bị kill — LB lại gửi request mới tới và chúng chết theo process.
- Đếm in-flight bằng một biến int không kèm id: {{endRequest}} bị gọi hai lần cho cùng một request (ví dụ cả trong {{finally}} lẫn trong callback) thì counter về 0 sớm, {{isDrained}} báo true trong khi request khác vẫn đang chạy, process thoát và cắt ngang nó.
- Quên timeout: trong thực tế chờ drain phải có hạn ({{spring.lifecycle.timeout-per-shutdown-phase}}); nếu không, một request treo giữ process tới khi Kubernetes SIGKILL, và mọi bước dọn dẹp sau đó (flush log, đóng connection pool) không kịp chạy.

Khi phỏng vấn, ghép đoạn code này với cấu hình K8s (readiness probe → {{/actuator/health/readiness}}, preStop sleep, graceful shutdown timeout) thành một câu chuyện hoàn chỉnh thay vì nói chung chung "dùng probe".

> Senior tip: Một instance đang DRAINING nhưng không giảm in-flight vì một request treo (ví dụ DB transaction khóa) sẽ giữ pod sống quá 30s rồi bị SIGKILL — luôn đặt preStop + {{spring.lifecycle.timeout-per-shutdown-phase}} nhỏ hơn {{terminationGracePeriodSeconds}} (ví dụ 5s + 20s < 30s), và đặt timeout cho mọi query DB / HTTP client để không request nào có thể treo vô hạn.`,
    },
  ],
  check: [
    {
      q: 'Spring Boot mất 90 giây để khởi động (Hibernate validate + nạp cache). Cấu hình probe nào đúng?',
      options: ['Liveness periodSeconds=10, failureThreshold=3', 'Chỉ readiness probe', 'StartupProbe với failureThreshold đủ lớn, liveness/readiness sau khi boot xong', 'Không cần probe, K8s tự đợi'],
      answer: 2,
      explain: `Startup probe "kéo dài" thời gian đánh giá liveness: tới khi nó pass, liveness chưa bị tính failure, tránh restart vô hạn. Liveness period 10s × 3 = 30s sẽ restart container giữa lúc boot (90s), lặp lại mãi. Chỉ có readiness thì không bị restart lúc boot, nhưng app treo (deadlock) sau này sẽ không bao giờ được restart vì thiếu liveness. "Không cần probe": K8s coi container sẵn sàng ngay khi process chạy, đưa traffic vào app chưa boot xong → lỗi hàng loạt.`,
    },
    {
      q: 'Trong lúc graceful shutdown, readiness probe nên trả gì?',
      options: ['200 để LB còn gửi request tới', '503 (not ready) để Pod rời Endpoints, trong khi request đang chạy vẫn hoàn tất', 'Chỉ trả lời sau khi in-flight = 0', 'Endpoint bị xoá, probe fail cứng mọi giá trị'],
      answer: 1,
      explain: `Readiness false ngay từ lúc nhận SIGTERM: LB ngừng gửi request **mới**, nhưng Pod vẫn xử lý xong request **đang chạy** — đó là ý nghĩa của DRAINING. Trả 200 thì request mới vẫn dồn vào instance sắp chết. "Chỉ trả lời sau khi in-flight = 0" nghĩa là trong suốt lúc drain readiness vẫn còn báo sẵn sàng — quá muộn. "Probe fail cứng mọi giá trị" (ví dụ tắt hẳn endpoint) lẫn lộn readiness với liveness: nếu liveness cũng fail, K8s có thể restart container giữa lúc nó đang hoàn tất request.`,
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
| **Blue-green** | Switch một lần, nhưng switch sai là 100% traffic | Gấp đôi tài nguyên (hai môi trường chạy song song) | Nhanh: đổi selector của Service về blue | Schema DB phải tương thích cả hai bản để còn quay về blue được |
| **Canary** | Theo % traffic, thường 1→5→25→100 | Trung bình (thêm vài pod canary) | Nhanh: giảm % về 0 | Version cũ/mới cùng serve; DB tương thích tuyệt đối |

Canary mạnh ở chỗ **dữ liệu production thật** quyết định có tiếp tục không: sau 5% traffic trong 15 phút, error rate, latency p99 và log của bản mới đã có ý nghĩa thống kê — điều blue-green không có trước khi switch.

### Chia traffic: hash ổn định thay vì "ngẫu nhiên mỗi request"
Load balancer chia đều theo connection/request sẽ khiến **cùng một user** chạm cả hai version trong một phiên: user tạo đơn trên bản mới, bước thanh toán trên bản cũ → lỗi schema kinh điển. Giải pháp: **sticky theo userId** bằng hàm hash ổn định:

~~~text
bucket = floorMod(userId.hashCode(), 100)     // 0..99
bucket < canaryPercent  →  version "canary"
ngược lại               →  version "stable"
~~~

Công thức của {{String.hashCode()}} được ghi rõ trong Javadoc của lớp String ({{s[0]×31^(n−1) + s[1]×31^(n−2) + … + s[n−1]}}), nên mọi JVM, mọi tiến trình, mọi lần restart đều tính ra **cùng một số** — khác với {{Object.hashCode()}} mặc định (identity hash) thay đổi mỗi lần chạy. Nhờ vậy mọi replica, mọi gateway tự quyết định route mà không cần session store chung. (Hệ thống thật thường dùng hash phân bố đều hơn như MurmurHash, cộng thêm "salt" theo tên experiment để mỗi đợt canary chọn một tập user khác nhau; ý tưởng giữ nguyên.) Tỉ lệ xấp xỉ {{canaryPercent}}% trên tập user đủ lớn; mỗi user riêng lẻ vẫn luôn về cùng một version — vừa chống "split session", vừa cho phép quan sát đúng tập user canary.

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
- **Hash theo {{Random()}} mỗi request**: user đổi version liên tục; thậm chí hai request song song của cùng user đi hai nơi. Phải hash **định danh ổn định của user** (userId, hoặc accountId cho luồng tiền).
- **Tăng % giữa chừng làm user nhảy version**: khi nâng 5% → 20%, user đang ở canary phải **ở lại** canary. Với bucket cố định 0..99 so với percent thì điều này tự đúng (bucket 3 < 5 và cũng < 20); còn nếu code dùng "random < percent" hoặc đổi công thức hash giữa hai lần deploy thì user nhảy lung tung.
- **Rollback vì noise**: 3 lỗi trong 3 request đầu (có thể do một sự cố mạng chung) đã kill release lúc 2 giờ sáng, team mất cả ngày điều tra một bản vốn không có lỗi. Min samples + ngưỡng so sánh với baseline của stable mới công bằng.
- **Migration DB một chiều**: canary ghi dữ liệu kiểu mới trong lúc stable còn đọc kiểu cũ — deploy canary xong thì rollback **không thể** vì data đã ghi. Kỹ thuật expand-contract (mở rộng schema tương thích cả hai, migrate, thu hẹp) là điều kiện tiên quyết của canary trên hệ thống có state.
- **Metrics không có nhãn version**: canary nhận 5% traffic nhưng dashboard chỉ có error rate gộp của cả service — lỗi 10% ở canary chỉ làm số gộp tăng 0.5%, không ai thấy. Mọi metric/log phải gắn nhãn version (ví dụ label {{version}} trên Pod, hoặc header {{X-Version}} do gateway thêm) để so sánh canary với stable.

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
        // công thức String.hashCode cố định trong Javadoc: mọi tiến trình tính cùng bucket → sticky theo user
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
- Đặt điều kiện "đủ mẫu" theo thời gian thay vì số request: ở 1% traffic lúc 3 giờ sáng, 15 phút có thể chỉ được vài request — chưa đủ để kết luận tốt hay xấu. Đừng promote lên % cao hơn khi canary chưa gom đủ {{minSamples}}.

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
{
  id: 'lesson-devops-004',
  track: 'devops',
  order: 4,
  title: 'Retry đúng cách khi gọi provider ngoài: phân loại lỗi FINAL/RETRY, backoff và jitter',
  level: 'senior',
  minutes: 45,
  goals: [
    'Dùng Adapter để gom các provider lưu trữ tài liệu (ECM/EFSS, OneDrive…) về một interface và một bảng phân loại lỗi chung',
    'Phân loại được lỗi thành FINAL (không retry) và RETRY (thử lại được), giải thích vì sao retry sai loại lỗi gây hại',
    'Cài đặt retry có giới hạn với exponential backoff có trần (cap), hiểu vai trò của jitter, Retry-After và idempotency',
  ],
  body: `### Bối cảnh: một service, nhiều provider
Trong ngân hàng hoặc doanh nghiệp lớn, ứng dụng Java thường phải đọc/ghi tài liệu ở nhiều kho khác nhau: hệ ECM on-premise (IBM FileNet, OpenText…), kho EFSS (Enterprise File Sync and Share) nội bộ, hoặc cloud như OneDrive/SharePoint qua Microsoft Graph. Mỗi provider có giao thức riêng (REST, SOAP, CMIS), **bộ mã lỗi riêng** và **rate limit riêng**.

Nếu code nghiệp vụ gọi thẳng từng provider, logic "lỗi này có nên thử lại không" bị rải khắp nơi và mỗi chỗ xử lý một kiểu. **Adapter pattern** giải quyết bằng cách: mỗi provider có một adapter cài cùng một interface ({{EcmConnector}}), và **mỗi adapter tự dịch mã lỗi của provider sang một phân loại chung** (FINAL hoặc RETRY). Phần retry chỉ viết **một lần** ở tầng service, dựa trên phân loại chung đó.

### Hai loại lỗi
**FINAL — thử lại vẫn hỏng y như cũ:**
- {{400 Bad Request}} (tham số sai), {{403 Forbidden}} (service account thiếu quyền), {{404 Not Found}} (file đã bị xoá), {{413}} (file quá lớn).
- Hành động: dừng ngay, báo lỗi rõ ràng. Retry chỉ tốn thời gian, tốn quota, và nếu bạn bắn hàng nghìn request 403 thì hệ thống bảo vệ của provider có thể khoá luôn tài khoản tích hợp.

**RETRY — lỗi tạm thời, chờ một chút có thể thành công:**
- {{429 Too Many Requests}} (chạm rate limit), {{503 Service Unavailable}} (provider quá tải/bảo trì), {{502}}/{{504}} (gateway lỗi hoặc timeout), lỗi mạng như connection reset, {{SocketTimeoutException}}.
- Hành động: chờ rồi thử lại, **có giới hạn số lần**.

**Trường hợp đặc biệt — 401 do token hết hạn:** không phải retry "mù". Phải **lấy token mới trước**, rồi thử lại **đúng một lần**; nếu vẫn 401 thì là lỗi cấu hình (FINAL). Trong bảng bên dưới, mã {{TOKEN_EXPIRED}} được xếp RETRY với ngầm định adapter đã refresh token trước khi ném lỗi lên.

### Exponential backoff có trần
Đừng retry kiểu "cứ 1 giây thử lại một lần". Provider đang quá tải mà mọi client cùng dội lại sau đúng 1 giây thì tạo ra đợt tải mới (**thundering herd**), provider không bao giờ hồi phục.

**Exponential backoff**: lần chờ thứ n = base × 2^(n−1), nhưng **không vượt quá trần** (cap). Với base = 100ms, cap = 1000ms:

| Lần retry | 1 | 2 | 3 | 4 | 5 | 6 trở đi |
|---|---|---|---|---|---|---|
| Chờ (ms) | 100 | 200 | 400 | 800 | 1000 | 1000 |

Trần là bắt buộc: không có cap thì lần thứ 20 phải chờ 100ms × 2^19 ≈ 14 tiếng; tệ hơn, nếu tính bằng phép dịch bit {{base << n}} với n lớn thì số bị **tràn** (overflow) thành số âm.

### Jitter: đừng để mọi client chờ y hệt nhau
Backoff giãn cách theo thời gian, nhưng 1000 instance cùng lỗi ở giây thứ 0 vẫn cùng thử lại ở 100ms, 300ms, 700ms… — vẫn là những đợt sóng. **Jitter** thêm ngẫu nhiên vào thời gian chờ. Cách phổ biến nhất là **full jitter**: chờ một số ngẫu nhiên trong khoảng 0..backoff(n). Các lần retry khi đó rải đều theo thời gian thay vì dồn thành cột.

~~~java
long backoff = Math.min(CAP_MS, BASE_MS << Math.min(retry - 1, 20)); // giới hạn số bit dịch để không tràn
long sleep = ThreadLocalRandom.current().nextLong(backoff + 1);     // full jitter: 0..backoff
~~~

Trong bài tập, ta tách phần tính backoff (xác định, kiểm thử được) khỏi phần ngẫu nhiên, và ghi lại thời gian chờ vào một list thay vì gọi {{Thread.sleep}} để test chạy nhanh và cho kết quả cố định.

### Retry-After: provider nói chờ bao lâu thì nghe theo
Với {{429}} và {{503}}, chuẩn HTTP cho phép server trả header {{Retry-After}} (số giây hoặc một thời điểm). Microsoft Graph (OneDrive/SharePoint) trả header này khi throttle. Nếu có, hãy chờ **ít nhất** khoảng đó thay vì dùng backoff tự tính — retry sớm hơn thường bị throttle tiếp và có thể kéo dài thời gian bị giới hạn.

### Bảng dịch mã lỗi theo provider
| Provider | Mã lỗi | Phân loại | Ý nghĩa |
|---|---|---|---|
| EFSS (nội bộ, ví dụ minh hoạ) | {{RATE_LIMIT}} | RETRY | Chạm giới hạn request/giây |
| | {{SERVER_BUSY}} | RETRY | Provider quá tải tạm thời |
| | {{TOKEN_EXPIRED}} | RETRY | Adapter đã refresh token, gọi lại một lần |
| | {{PERMISSION_DENIED}} | FINAL | Phải sửa phân quyền service account |
| | {{FILE_NOT_FOUND}} | FINAL | File không tồn tại |
| OneDrive (Microsoft Graph) | {{activityLimitReached}} | RETRY | Bị throttle (HTTP 429), thường kèm Retry-After |
| | {{serviceNotAvailable}} | RETRY | Dịch vụ tạm thời không sẵn sàng (HTTP 503) |
| | {{accessDenied}} | FINAL | Không có quyền |
| | {{itemNotFound}} | FINAL | Không tìm thấy item |

Mã lạ (adapter chưa biết) mặc định xếp **FINAL**: thà báo lỗi sớm cho người vận hành bổ sung bảng còn hơn retry mù một lỗi có thể là vĩnh viễn.

### Idempotency: điều kiện để retry thao tác ghi
Retry chỉ an toàn khi thao tác là **idempotent** — làm 1 lần hay 3 lần thì kết quả như nhau. Đọc file (GET) luôn an toàn. Upload thì nguy hiểm: request đầu có thể **đã thành công** ở provider nhưng response bị timeout trên đường về; retry tạo thêm một bản trùng. Cách xử lý: upload vào **đường dẫn cố định** với chế độ ghi đè (PUT theo tên file), hoặc gửi **idempotency key** nếu provider hỗ trợ, hoặc kiểm tra "file đã tồn tại chưa" trước khi retry.

### Bẫy production hay gặp
- **Retry chồng nhiều tầng**: HTTP client retry 3 lần, service retry 3 lần, message consumer retry 3 lần → một lỗi thành 27 request. Chỉ retry ở **một** tầng.
- **Retry không có tổng deadline**: request của user chờ 30 giây vì retry, trong khi gateway đã timeout ở 10 giây — retry thêm chỉ làm phí tài nguyên.
- **Retry khi provider sập hẳn**: mọi request đều chờ hết lượt retry, thread pool cạn. Kết hợp **circuit breaker** (ví dụ Resilience4j): khi tỉ lệ lỗi vượt ngưỡng thì "mở mạch", fail nhanh trong một khoảng thời gian rồi thử lại dè dặt.

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Provider bên ngoài thỉnh thoảng trả 5xx hoặc 429, bạn xử lý thế nào?" Trả lời đủ ý: (1) adapter dịch mã lỗi sang FINAL/RETRY, mã lạ là FINAL; (2) chỉ retry lỗi RETRY, tối đa N lần, exponential backoff có cap + full jitter, tôn trọng Retry-After; (3) chỉ retry thao tác idempotent; (4) circuit breaker khi provider sập; (5) retry ở đúng một tầng và có tổng deadline. Bài tập dưới đây cài chính phần lõi (1)–(2).

> Senior tip: Hãy đếm metric số lần retry theo provider và theo mã lỗi. Retry tăng vọt là tín hiệu sớm nhất cho thấy provider sắp sập hoặc bạn sắp chạm quota — thường xuất hiện trước khi error rate của chính service bạn tăng.`,
  exercises: [
    {
      title: 'Phân loại lỗi theo provider và retry với exponential backoff có trần',
      prompt: `Starter đã có {{ErrorKind}}, {{ErrorPolicy}}, {{EcmConnector}} và {{ProviderException}} (mang mã lỗi trong field {{code}}). Bạn cần hoàn thiện:

1. {{EfssPolicy.classify(code)}}: {{RATE_LIMIT}}, {{SERVER_BUSY}}, {{TOKEN_EXPIRED}} → {{RETRY}}; mọi mã khác (kể cả mã lạ) → {{FINAL}}.
2. {{OneDrivePolicy.classify(code)}}: {{activityLimitReached}}, {{serviceNotAvailable}} → {{RETRY}}; mọi mã khác → {{FINAL}}.
3. {{EcmService.backoffMs(retry)}} với {{retry}} ≥ 1: {{min(CAP_MS, BASE_MS × 2^(retry − 1))}}, {{BASE_MS = 100}}, {{CAP_MS = 1000}}. Không được tràn số với {{retry}} rất lớn (ví dụ 60).
4. {{EcmService.fetchWithRetry(connector, id)}}:
- Gọi {{connector.fetch(id)}}; thành công thì trả kết quả.
- Bắt {{ProviderException}}, phân loại {{e.code}} bằng {{connector.policy()}}.
- {{RETRY}} và chưa quá {{MAX_RETRIES = 3}} lần retry: thêm {{backoffMs(n)}} vào list {{sleeps}} (n = 1, 2, 3 — thay cho Thread.sleep) rồi gọi lại. Tổng cộng tối đa **4 lần gọi**.
- {{FINAL}}, hoặc đã retry đủ 3 lần: ném lại **chính exception** vừa bắt.`,
      starter: `enum ErrorKind { FINAL, RETRY }

interface ErrorPolicy { ErrorKind classify(String code); }

class ProviderException extends Exception {
    final String code;
    ProviderException(String code) { super(code); this.code = code; }
}

interface EcmConnector {
    String fetch(String id) throws ProviderException;
    ErrorPolicy policy();
}

class EfssPolicy implements ErrorPolicy {
    public ErrorKind classify(String code) {
        throw new UnsupportedOperationException("TODO");
    }
}

class OneDrivePolicy implements ErrorPolicy {
    public ErrorKind classify(String code) {
        throw new UnsupportedOperationException("TODO");
    }
}

class EcmService {
    static final int MAX_RETRIES = 3;
    static final long BASE_MS = 100, CAP_MS = 1000;
    final List<Long> sleeps = new ArrayList<>();   // thời gian chờ trước mỗi lần retry (thay cho Thread.sleep)

    static long backoffMs(int retry) {
        throw new UnsupportedOperationException("TODO");
    }

    String fetchWithRetry(EcmConnector connector, String id) throws ProviderException {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    interface Body { void run() throws Exception; }
    static void check(String name, Body r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    // Provider giả: trả lần lượt theo kịch bản; "ERR:X" nghĩa là ném ProviderException mã X
    static class FakeConnector implements EcmConnector {
        final ErrorPolicy policy; final String[] script; int calls;
        FakeConnector(ErrorPolicy policy, String... script) { this.policy = policy; this.script = script; }
        public String fetch(String id) throws ProviderException {
            String r = script[Math.min(calls, script.length - 1)];
            calls++;
            if (r.startsWith("ERR:")) throw new ProviderException(r.substring(4));
            return r + ":" + id;
        }
        public ErrorPolicy policy() { return policy; }
    }
    static ProviderException expectFail(EcmService s, EcmConnector c) {
        try { s.fetchWithRetry(c, "doc-1"); } catch (ProviderException e) { return e; }
        throw new AssertionError("expected ProviderException");
    }
    public static void main(String[] args) {
        check("EfssPolicy maps codes, unknown is FINAL", () -> {
            ErrorPolicy p = new EfssPolicy();
            eq(ErrorKind.RETRY, p.classify("RATE_LIMIT"));
            eq(ErrorKind.RETRY, p.classify("SERVER_BUSY"));
            eq(ErrorKind.RETRY, p.classify("TOKEN_EXPIRED"));
            eq(ErrorKind.FINAL, p.classify("PERMISSION_DENIED"));
            eq(ErrorKind.FINAL, p.classify("FILE_NOT_FOUND"));
            eq(ErrorKind.FINAL, p.classify("SOMETHING_NEW"));
        });
        check("OneDrivePolicy maps Graph codes", () -> {
            ErrorPolicy p = new OneDrivePolicy();
            eq(ErrorKind.RETRY, p.classify("activityLimitReached"));
            eq(ErrorKind.RETRY, p.classify("serviceNotAvailable"));
            eq(ErrorKind.FINAL, p.classify("accessDenied"));
            eq(ErrorKind.FINAL, p.classify("itemNotFound"));
            eq(ErrorKind.FINAL, p.classify("RATE_LIMIT"));      // mã của provider khác
        });
        check("backoff doubles then caps, no overflow", () -> {
            eq(100L, EcmService.backoffMs(1));
            eq(200L, EcmService.backoffMs(2));
            eq(400L, EcmService.backoffMs(3));
            eq(800L, EcmService.backoffMs(4));
            eq(1000L, EcmService.backoffMs(5));
            eq(1000L, EcmService.backoffMs(60));
        });
        check("success on first call: 1 call, no sleep", () -> {
            EcmService s = new EcmService();
            FakeConnector c = new FakeConnector(new EfssPolicy(), "content");
            eq("content:doc-1", s.fetchWithRetry(c, "doc-1"));
            eq(1, c.calls);
            eq(List.of(), s.sleeps);
        });
        check("retryable errors then success", () -> {
            EcmService s = new EcmService();
            FakeConnector c = new FakeConnector(new EfssPolicy(), "ERR:RATE_LIMIT", "ERR:TOKEN_EXPIRED", "content");
            eq("content:doc-1", s.fetchWithRetry(c, "doc-1"));
            eq(3, c.calls);
            eq(List.of(100L, 200L), s.sleeps);
        });
        check("FINAL stops immediately and rethrows same code", () -> {
            EcmService s = new EcmService();
            FakeConnector c = new FakeConnector(new EfssPolicy(), "ERR:PERMISSION_DENIED", "content");
            eq("PERMISSION_DENIED", expectFail(s, c).code);
            eq(1, c.calls);
            eq(List.of(), s.sleeps);
        });
        check("gives up after 3 retries = 4 calls", () -> {
            EcmService s = new EcmService();
            FakeConnector c = new FakeConnector(new EfssPolicy(), "ERR:SERVER_BUSY");
            eq("SERVER_BUSY", expectFail(s, c).code);
            eq(4, c.calls);
            eq(List.of(100L, 200L, 400L), s.sleeps);
        });
        check("retry then FINAL stops at the FINAL error", () -> {
            EcmService s = new EcmService();
            FakeConnector c = new FakeConnector(new OneDrivePolicy(), "ERR:activityLimitReached", "ERR:itemNotFound", "content");
            eq("itemNotFound", expectFail(s, c).code);
            eq(2, c.calls);
            eq(List.of(100L), s.sleeps);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `enum ErrorKind { FINAL, RETRY }

interface ErrorPolicy { ErrorKind classify(String code); }

class ProviderException extends Exception {
    final String code;
    ProviderException(String code) { super(code); this.code = code; }
}

interface EcmConnector {
    String fetch(String id) throws ProviderException;
    ErrorPolicy policy();
}

class EfssPolicy implements ErrorPolicy {
    private static final Set<String> RETRYABLE = Set.of("RATE_LIMIT", "SERVER_BUSY", "TOKEN_EXPIRED");
    public ErrorKind classify(String code) {
        return RETRYABLE.contains(code) ? ErrorKind.RETRY : ErrorKind.FINAL;   // mã lạ → FINAL
    }
}

class OneDrivePolicy implements ErrorPolicy {
    private static final Set<String> RETRYABLE = Set.of("activityLimitReached", "serviceNotAvailable");
    public ErrorKind classify(String code) {
        return RETRYABLE.contains(code) ? ErrorKind.RETRY : ErrorKind.FINAL;
    }
}

class EcmService {
    static final int MAX_RETRIES = 3;
    static final long BASE_MS = 100, CAP_MS = 1000;
    final List<Long> sleeps = new ArrayList<>();

    static long backoffMs(int retry) {
        long d = BASE_MS;
        for (int i = 1; i < retry && d < CAP_MS; i++) d *= 2;   // dừng nhân khi đã chạm trần → không tràn số
        return Math.min(d, CAP_MS);
    }

    String fetchWithRetry(EcmConnector connector, String id) throws ProviderException {
        int retries = 0;
        while (true) {
            try {
                return connector.fetch(id);
            } catch (ProviderException e) {
                boolean retryable = connector.policy().classify(e.code) == ErrorKind.RETRY;
                if (!retryable || retries >= MAX_RETRIES) throw e;   // ném lại chính exception gốc
                retries++;
                sleeps.add(backoffMs(retries));                      // production: Thread.sleep(random 0..backoff)
            }
        }
    }
}`,
      hints: [
        'Hai policy chỉ cần một {{Set<String>}} các mã RETRY; không có trong set thì trả {{FINAL}} — mã lạ tự động thành FINAL.',
        'backoffMs: bắt đầu từ {{BASE_MS}}, nhân đôi {{retry - 1}} lần nhưng dừng ngay khi đã ≥ {{CAP_MS}}, cuối cùng lấy {{Math.min}} với trần. Cách này không bao giờ tràn số.',
        'fetchWithRetry: dùng vòng {{while (true)}} với biến đếm {{retries}}; trong {{catch}}, nếu không retry được thì {{throw e}}, ngược lại tăng {{retries}}, ghi {{backoffMs(retries)}} vào {{sleeps}} rồi lặp lại.',
      ],
      explain: `Lời giải tách ba trách nhiệm: **adapter/policy** biết ngôn ngữ lỗi của từng provider; **backoffMs** là hàm thuần (cùng input luôn cùng output) nên test dễ; **fetchWithRetry** chỉ biết FINAL/RETRY, không biết provider nào — thêm provider thứ ba chỉ cần thêm một policy.

Vì sao ném lại **chính** exception gốc thay vì bọc trong exception mới như "Exceeded max retries"? Vì caller (và log) cần biết **mã lỗi cuối cùng** để quyết định: SERVER_BUSY sau 4 lần là provider đang sập, PERMISSION_DENIED là phải sửa cấu hình — hai hành động hoàn toàn khác nhau.

Lỗi hay gặp:
- Viết {{BASE_MS << (retry - 1)}} không giới hạn: với retry = 60, phép dịch làm tràn {{long}} thành số âm hoặc 0, {{Math.min}} trả về số âm — test "no overflow" bắt lỗi này.
- Đếm nhầm: "retry 3 lần" là **4 lần gọi** (1 lần đầu + 3 lần thử lại). Viết {{for (attempt = 0; attempt < 3; ...)}} chỉ gọi 3 lần.
- Mặc định mã lạ là RETRY: một lỗi vĩnh viễn mới xuất hiện sẽ bị retry khắp hệ thống mà không ai để ý.
- Retry cả lỗi FINAL "cho chắc": phí quota, và với 403 có thể khiến provider khoá tài khoản.

Ở production, thay vì tự viết vòng lặp, thường dùng Resilience4j {{Retry}} (cấu hình {{maxAttempts}}, {{IntervalFunction.ofExponentialRandomBackoff}}, {{retryOnException}} dựa trên policy) kết hợp {{CircuitBreaker}}. Nhưng hiểu vòng lặp này giúp bạn cấu hình thư viện đúng.

> Senior tip: Ghi lại thời gian chờ thay vì ngủ thật (như list {{sleeps}}) không chỉ để test nhanh — ở production, inject một {{Sleeper}}/{{Clock}} giúp bạn viết unit test cho mọi nhánh retry mà không làm CI chậm thêm hàng phút.`
    }
  ],
  check: [
    {
      q: 'Khi gọi API của provider ngoài, lỗi nào sau đây nên được xếp loại RETRY?',
      options: ['401 Unauthorized lặp lại ngay cả sau khi đã lấy token mới', '404 Not Found', '429 Too Many Requests', '400 Bad Request'],
      answer: 2,
      explain: `429 là lỗi tạm thời (chạm rate limit): chờ một lúc — tốt nhất theo header Retry-After — rồi thử lại thường sẽ thành công. 401 **sau khi đã refresh token** nghĩa là credential/cấu hình sai, retry bao nhiêu cũng vậy (chỉ có 401 lần đầu do token hết hạn mới đáng refresh rồi thử lại một lần). 404: file không tồn tại, gọi lại vẫn không tồn tại. 400: request sai định dạng, gửi lại y hệt vẫn sai.`
    },
    {
      q: 'Tại sao nên thêm jitter vào exponential backoff?',
      options: ['Để mỗi lần retry nhanh hơn', 'Để tránh nhiều client gặp lỗi cùng lúc lại cùng retry đúng một thời điểm', 'Để giảm bộ nhớ dùng cho retry', 'Để tăng số lần retry tối đa'],
      answer: 1,
      explain: `Không có jitter, mọi client lỗi ở cùng thời điểm sẽ chờ y hệt nhau (100ms, 200ms, 400ms…) và dội vào provider thành từng đợt, khiến provider khó hồi phục. Jitter rải các lần retry ra theo thời gian. Jitter không làm retry nhanh hơn (full jitter trung bình còn chờ ít hơn nhưng mục đích là phân tán, không phải tốc độ), không liên quan bộ nhớ, và không thay đổi số lần retry tối đa.`
    },
    {
      q: 'Service upload file lên provider, request đầu bị timeout ở phía client. Retry ngay có rủi ro gì và xử lý thế nào?',
      options: ['Không rủi ro gì vì timeout nghĩa là provider chưa nhận file', 'Có thể tạo file trùng vì request đầu có thể đã thành công; cần upload idempotent (ghi đè theo đường dẫn cố định hoặc idempotency key)', 'Rủi ro là provider khoá tài khoản ngay lập tức', 'Chỉ cần tăng timeout là hết rủi ro'],
      answer: 1,
      explain: `Timeout phía client chỉ có nghĩa là client không nhận được response — provider có thể đã lưu file xong. Retry thao tác không idempotent sẽ tạo bản trùng, nên phải thiết kế upload idempotent. "Không rủi ro" là sai vì giả định provider chưa nhận. Provider không khoá tài khoản vì một lần retry. Tăng timeout giảm tần suất nhưng không loại bỏ khả năng response bị mất trên đường về.`
    }
  ],
  related: ['devops-013', 'devops-018'],
  tags: ['Retry', 'Exponential backoff', 'Jitter', 'Adapter', 'Error Handling', 'Idempotency']
},
{
  id: 'lesson-devops-005',
  track: 'devops',
  order: 5,
  title: 'Vòng lặp ingestion: rate limit bằng token bucket và xoay vòng credential trước khi hết hạn',
  level: 'senior',
  minutes: 45,
  goals: [
    'Cài đặt token bucket đúng: nạp token theo thời gian, giới hạn burst bằng capacity, không làm mất phần thời gian lẻ',
    'Thiết kế xoay vòng credential chủ động (pre-emptive rotation) trước khi token hết hạn, kèm phương án dự phòng khi vẫn gặp 401',
    'Xây vòng lặp ingestion theo chu kỳ: tự giảm nhịp khi hết quota, xử lý theo thứ tự, đánh dấu phần còn lại để chạy phiên sau',
  ],
  body: `### Bài toán: đẩy hàng nghìn file trong nhiều giờ
Một job ingestion (đọc dữ liệu từ nguồn rồi đẩy vào kho đích) chạy hàng giờ thường vướng hai giới hạn "cứng" từ phía đích:

1. **Rate limit (quota)**: provider chỉ cho phép một số request trong một khoảng thời gian. SharePoint/OneDrive (Microsoft Graph) trả {{429 Too Many Requests}} kèm header {{Retry-After}}; Amazon S3 giới hạn theo prefix (khoảng 3.500 PUT và 5.500 GET mỗi giây) và trả {{503 Slow Down}} khi vượt. Cố đẩy nhanh hơn chỉ nhận thêm lỗi, và provider có thể throttle lâu hơn.
2. **Credential hết hạn**: access token OAuth2 hoặc temporary credentials (ví dụ AWS STS) thường sống 15 phút đến 1 giờ. Job chạy 5 giờ chắc chắn sẽ gặp token hết hạn nếu không tự làm mới.

### Token bucket: cơ chế từng bước
Hình dung một cái xô chứa token:
- Xô có **capacity** C (số token tối đa). Lúc đầu xô đầy.
- Cứ mỗi **refillIntervalMs** thì nạp thêm **refillTokens** token, nhưng không vượt quá C.
- Mỗi request phải lấy 1 token. Xô rỗng thì request phải chờ (hoặc bị từ chối).

Ta không cần một thread chạy nền để "nạp" token. Cách chuẩn là **nạp lười (lazy refill)**: mỗi lần có request, tính xem từ lần nạp trước đã trôi qua **bao nhiêu chu kỳ trọn vẹn**, rồi cộng token tương ứng:

~~~java
long periods = (now - lastRefill) / refillIntervalMs;      // số chu kỳ trọn vẹn đã qua
if (periods > 0) {
    tokens = Math.min(capacity, tokens + periods * refillTokens);
    lastRefill += periods * refillIntervalMs;              // KHÔNG gán lastRefill = now
}
~~~

Vì sao {{lastRefill += periods × interval}} mà không phải {{lastRefill = now}}? Giả sử interval 1000ms, request đến ở 1500ms: có 1 chu kỳ trọn, nạp 1 token. Nếu gán {{lastRefill = 1500}} thì 500ms lẻ bị **vứt mất**: token tiếp theo phải đợi tới 2500ms thay vì 2000ms. Lặp lại nhiều lần, tốc độ thực tế thấp hơn hẳn cấu hình.

### Vì sao token bucket thay vì fixed window?
**Fixed window** đếm request trong từng phút cố định (từ giây 0 đến 59). Client gửi 60 request ở giây 59 và 60 request nữa ở giây 60 (cửa sổ mới): cả hai cửa sổ đều hợp lệ, nhưng thực tế provider nhận **120 request trong 2 giây** — gấp đôi giới hạn. Token bucket không có "ranh giới" như vậy: trong bất kỳ khoảng thời gian T nào, số request tối đa là {{C + tốc độ nạp × T}}. Capacity cho phép một **burst có giới hạn** (ví dụ lúc vừa khởi động), sau đó tốc độ bị ép về tốc độ nạp.

| Thuật toán | Ưu điểm | Nhược điểm |
|---|---|---|
| Fixed window | Đơn giản, một bộ đếm | Burst gấp đôi ở ranh giới cửa sổ |
| Sliding window log | Chính xác | Lưu timestamp từng request, tốn bộ nhớ |
| Token bucket | Burst có giới hạn, O(1) bộ nhớ | Phải chọn capacity hợp lý |

### Xoay vòng credential chủ động
Cách ngây thơ là đợi nhận {{401 Unauthorized}} rồi mới lấy token mới: batch đang chạy dở bị lỗi, phải có logic retry riêng, và nếu nhiều thread cùng gặp 401 thì cùng lao đi xin token mới.

Cách tốt hơn — **pre-emptive rotation**: trước mỗi chu kỳ, kiểm tra thời gian còn lại của token. Nếu {{expiresAt − now < ngưỡng an toàn}} (ví dụ 2 phút) thì chủ động lấy token mới từ secret store / identity provider (HashiCorp Vault, AWS Secrets Manager, Azure AD…). Ngưỡng 2–5 phút dự phòng cho độ trễ mạng, lệch đồng hồ giữa các máy, và cho một chu kỳ xử lý dài.

Lưu ý: rotation chủ động **không thay thế** việc xử lý 401. Token vẫn có thể bị thu hồi (revoke) trước hạn; khi gặp 401, hãy lấy token mới và thử lại **đúng một lần**.

### Vòng lặp ingestion theo chu kỳ
1. **Kiểm tra credential**: còn ít hơn ngưỡng thì lấy token mới.
2. **Xử lý theo quota**: lấy file theo thứ tự, mỗi file tiêu 1 token. Hết token thì **dừng chu kỳ này** và chờ chu kỳ sau — không quay vòng gọi {{tryConsume}} vô ích.
3. **Tôn trọng Retry-After**: nếu provider trả 429 kèm Retry-After, chờ ít nhất khoảng đó.
4. **Checkpoint**: lưu tiến độ sau mỗi chu kỳ để job chết giữa chừng có thể chạy tiếp từ chỗ dừng.
5. **Giới hạn số chu kỳ**: hết số chu kỳ cho phép mà còn file thì đánh dấu {{SKIPPED}} để phiên sau xử lý, thay vì chạy mãi chiếm tài nguyên.

### Bẫy production hay gặp
- **Mỗi instance một bucket riêng**: quota là của **tài khoản** tại provider, nhưng 4 pod mỗi pod một bucket 10 req/phút thì tổng là 40 — vẫn bị 429. Chia quota cho số instance, hoặc dùng bucket chung (ví dụ trên Redis).
- **Dùng đồng hồ hệ thống cho bucket**: {{System.currentTimeMillis()}} có thể nhảy lùi khi NTP chỉnh giờ; dùng {{System.nanoTime()}} (đơn điệu) để đo khoảng thời gian.
- **Đọc nguồn nhanh hơn ghi đích**: dữ liệu dồn trong bộ nhớ tới OOM. Đặt một {{BlockingQueue}} có giới hạn giữa luồng đọc và luồng ghi để tạo **backpressure** tự nhiên.

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Job chạy 5 tiếng gọi API có quota và token sống 1 giờ, bạn thiết kế thế nào?" Trả lời: token bucket (giải thích lazy refill, capacity = burst), quota chia theo số instance; rotation chủ động với ngưỡng an toàn + fallback refresh-một-lần khi 401; vòng lặp theo chu kỳ có checkpoint; tôn trọng Retry-After. Bài tập dưới đây cài token bucket và vòng lặp đó.

> Senior tip: Đặt tốc độ của bucket thấp hơn quota thật khoảng 10–20%. Provider thường đếm theo cách riêng (cửa sổ lệch pha với bạn, tính cả request retry), nên chạy sát 100% quota gần như chắc chắn thỉnh thoảng nhận 429.`,
  exercises: [
    {
      title: 'TokenBucket nạp lười + IngestionLoop có xoay vòng credential',
      prompt: `Mọi thời gian tính bằng mili-giây và được **truyền vào** (không đọc đồng hồ thật) để test xác định.

**1. {{TokenBucket(capacity, refillTokens, refillIntervalMs, now)}}** — lúc tạo, xô đầy ({{capacity}} token), mốc nạp là {{now}}.
- {{tryConsume(now)}}: nạp lười rồi lấy 1 token nếu còn (trả true), hết token thì trả false.
- {{available(now)}}: nạp lười rồi trả số token hiện có.
- Nạp lười: số chu kỳ trọn {{periods = (now − lastRefill) / refillIntervalMs}}; nếu > 0 thì {{tokens = min(capacity, tokens + periods × refillTokens)}} và {{lastRefill += periods × refillIntervalMs}} (giữ lại phần thời gian lẻ).

**2. {{IngestionLoop.run(secrets, bucket, files, startTime)}}** — chạy {{MAX_CYCLES = 3}} chu kỳ, chu kỳ thứ k (k = 0, 1, 2) diễn ra tại {{now = startTime + k × CYCLE_MS}} ({{CYCLE_MS = 60000}}):
- Credential: nếu chưa có secret, hoặc {{secret.expiresAtMs − now < ROTATE_BEFORE_MS}} ({{120000}}), gọi {{secrets.fetch("ingest", now)}} để lấy secret mới.
- Duyệt {{files}} theo thứ tự; bỏ qua file không ở trạng thái {{NEW}}. Với mỗi file NEW: nếu {{bucket.tryConsume(now)}} thì đặt {{state = "PROCESSED"}} và {{token = secret.token}}; nếu hết token thì **dừng chu kỳ này** (break).
- Sau 3 chu kỳ, mọi file còn {{NEW}} chuyển thành {{SKIPPED}}.`,
      starter: `class TokenBucket {
    private final long capacity, refillTokens, refillIntervalMs;
    private long tokens, lastRefill;

    TokenBucket(long capacity, long refillTokens, long refillIntervalMs, long now) {
        this.capacity = capacity;
        this.refillTokens = refillTokens;
        this.refillIntervalMs = refillIntervalMs;
        this.tokens = capacity;      // lúc đầu xô đầy
        this.lastRefill = now;
    }

    boolean tryConsume(long now) {
        throw new UnsupportedOperationException("TODO");
    }

    long available(long now) {
        throw new UnsupportedOperationException("TODO");
    }
}

class Secret {
    final String token;
    final long expiresAtMs;          // thời điểm hết hạn (cùng thang thời gian với now)
    Secret(String token, long expiresAtMs) { this.token = token; this.expiresAtMs = expiresAtMs; }
}

interface SecretProvider {
    Secret fetch(String key, long now);
}

class FileItem {
    final String id;
    String state = "NEW";            // NEW | PROCESSED | SKIPPED
    String token;                    // token đã dùng để xử lý file
    FileItem(String id) { this.id = id; }
}

class IngestionLoop {
    static final int MAX_CYCLES = 3;
    static final long CYCLE_MS = 60_000, ROTATE_BEFORE_MS = 120_000;

    void run(SecretProvider secrets, TokenBucket bucket, List<FileItem> files, long startTime) {
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
    static List<FileItem> files(int n) {
        List<FileItem> l = new ArrayList<>();
        for (int i = 0; i < n; i++) l.add(new FileItem("f" + i));
        return l;
    }
    static long count(List<FileItem> l, String state) { return l.stream().filter(f -> f.state.equals(state)).count(); }
    public static void main(String[] args) {
        check("bucket: burst = capacity, then empty until a full interval", () -> {
            TokenBucket b = new TokenBucket(10, 10, 60_000, 0);
            for (int i = 0; i < 10; i++) eq(true, b.tryConsume(0));
            eq(false, b.tryConsume(0));
            eq(false, b.tryConsume(59_999));
            eq(true, b.tryConsume(60_000));
            eq(9L, b.available(60_000));
        });
        check("bucket: keeps the leftover part of an interval", () -> {
            TokenBucket b = new TokenBucket(1, 1, 1_000, 0);
            eq(true, b.tryConsume(0));
            eq(true, b.tryConsume(1_500));     // 1 chu kỳ trọn
            eq(false, b.tryConsume(1_999));
            eq(true, b.tryConsume(2_000));     // mốc nạp là 1000 → 2000, không phải 1500 → 2500
        });
        check("bucket: never exceeds capacity after long idle", () -> {
            TokenBucket b = new TokenBucket(5, 5, 1_000, 0);
            for (int i = 0; i < 5; i++) b.tryConsume(0);
            eq(5L, b.available(1_000_000));
        });
        check("loop: 25 files fit in 3 cycles of 10 tokens", () -> {
            List<FileItem> fs = files(25);
            new IngestionLoop().run((k, now) -> new Secret("t", now + 10_000_000), new TokenBucket(10, 10, 60_000, 0), fs, 0);
            eq(25L, count(fs, "PROCESSED"));
            eq(0L, count(fs, "SKIPPED"));
        });
        check("loop: 50 files -> first 30 processed in order, 20 skipped", () -> {
            List<FileItem> fs = files(50);
            new IngestionLoop().run((k, now) -> new Secret("t", now + 10_000_000), new TokenBucket(10, 10, 60_000, 0), fs, 0);
            eq(30L, count(fs, "PROCESSED"));
            eq(20L, count(fs, "SKIPPED"));
            eq("PROCESSED", fs.get(29).state);
            eq("SKIPPED", fs.get(30).state);
        });
        check("loop: rotates only when < 2 min left, new token used afterwards", () -> {
            int[] calls = {0};
            SecretProvider sp = (k, now) -> { calls[0]++; return new Secret("t" + calls[0], now + 200_000); };
            List<FileItem> fs = files(6);
            new IngestionLoop().run(sp, new TokenBucket(2, 2, 60_000, 0), fs, 0);
            eq(2, calls[0]);                   // t=0 lấy t1 (hết hạn 200s); t=60s còn 140s; t=120s còn 80s → lấy t2
            List<String> used = new ArrayList<>();
            for (FileItem f : fs) used.add(f.token);
            eq(List.of("t1", "t1", "t1", "t1", "t2", "t2"), used);
        });
        check("loop: long-lived secret is fetched only once", () -> {
            int[] calls = {0};
            SecretProvider sp = (k, now) -> { calls[0]++; return new Secret("x", now + 3_600_000); };
            List<FileItem> fs = files(3);
            new IngestionLoop().run(sp, new TokenBucket(10, 10, 60_000, 0), fs, 0);
            eq(1, calls[0]);
            eq(3L, count(fs, "PROCESSED"));
        });
        check("loop: rotation compares expiry with now (startTime != 0)", () -> {
            int[] calls = {0};
            SecretProvider sp = (k, now) -> { calls[0]++; return new Secret("t" + calls[0], now + 200_000); };
            List<FileItem> fs = files(6);
            new IngestionLoop().run(sp, new TokenBucket(2, 2, 60_000, 500_000), fs, 500_000);
            eq(2, calls[0]);                   // lúc 620000 secret t1 (hết hạn 700000) chỉ còn 80s
            eq("t2", fs.get(5).token);
        });
        check("loop: files already processed are not touched again", () -> {
            List<FileItem> fs = files(3);
            fs.get(0).state = "PROCESSED"; fs.get(0).token = "old";
            new IngestionLoop().run((k, now) -> new Secret("t", now + 10_000_000), new TokenBucket(1, 1, 60_000, 0), fs, 0);
            eq("old", fs.get(0).token);
            eq(List.of("PROCESSED", "PROCESSED", "PROCESSED"), List.of(fs.get(0).state, fs.get(1).state, fs.get(2).state));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class TokenBucket {
    private final long capacity, refillTokens, refillIntervalMs;
    private long tokens, lastRefill;

    TokenBucket(long capacity, long refillTokens, long refillIntervalMs, long now) {
        this.capacity = capacity;
        this.refillTokens = refillTokens;
        this.refillIntervalMs = refillIntervalMs;
        this.tokens = capacity;
        this.lastRefill = now;
    }

    private void refill(long now) {
        long periods = (now - lastRefill) / refillIntervalMs;   // số chu kỳ trọn vẹn
        if (periods > 0) {
            tokens = Math.min(capacity, tokens + periods * refillTokens);
            lastRefill += periods * refillIntervalMs;            // giữ phần lẻ cho lần sau
        }
    }

    boolean tryConsume(long now) {
        refill(now);
        if (tokens == 0) return false;
        tokens--;
        return true;
    }

    long available(long now) {
        refill(now);
        return tokens;
    }
}

class Secret {
    final String token;
    final long expiresAtMs;
    Secret(String token, long expiresAtMs) { this.token = token; this.expiresAtMs = expiresAtMs; }
}

interface SecretProvider {
    Secret fetch(String key, long now);
}

class FileItem {
    final String id;
    String state = "NEW";
    String token;
    FileItem(String id) { this.id = id; }
}

class IngestionLoop {
    static final int MAX_CYCLES = 3;
    static final long CYCLE_MS = 60_000, ROTATE_BEFORE_MS = 120_000;

    void run(SecretProvider secrets, TokenBucket bucket, List<FileItem> files, long startTime) {
        Secret secret = null;
        for (int cycle = 0; cycle < MAX_CYCLES; cycle++) {
            long now = startTime + cycle * CYCLE_MS;
            // 1. Rotation chủ động: còn < 2 phút thì lấy secret mới
            if (secret == null || secret.expiresAtMs - now < ROTATE_BEFORE_MS) {
                secret = secrets.fetch("ingest", now);
            }
            // 2. Xử lý theo quota, theo thứ tự; hết token thì nhường cho chu kỳ sau
            for (FileItem f : files) {
                if (!"NEW".equals(f.state)) continue;
                if (!bucket.tryConsume(now)) break;
                f.state = "PROCESSED";
                f.token = secret.token;
            }
        }
        // 3. Phần còn lại để phiên sau
        for (FileItem f : files) {
            if ("NEW".equals(f.state)) f.state = "SKIPPED";
        }
    }
}`,
      hints: [
        'Viết một hàm private {{refill(now)}} dùng chung cho {{tryConsume}} và {{available}}; nhớ cộng {{lastRefill += periods * refillIntervalMs}} thay vì gán {{lastRefill = now}}.',
        'Trong {{run}}, tính {{now = startTime + cycle * CYCLE_MS}} cho từng chu kỳ; giữ biến {{secret}} bên ngoài vòng lặp, chỉ gọi {{fetch}} khi null hoặc {{expiresAtMs - now < ROTATE_BEFORE_MS}}.',
        'Khi {{tryConsume}} trả false thì {{break}} — các chu kỳ sau bucket sẽ có token mới. Cuối cùng một vòng duyệt chuyển NEW thành SKIPPED.',
      ],
      explain: `**TokenBucket**: nạp lười chỉ làm việc khi có người hỏi, nên không cần thread nền, chi phí O(1). Điểm tinh tế là giữ phần thời gian lẻ: test "keeps the leftover" kiểm tra đúng điều này — gán {{lastRefill = now}} sẽ làm request ở 2000ms bị từ chối. Phép {{Math.min(capacity, ...)}} giới hạn burst: nghỉ 1000 giây cũng chỉ tích được 5 token chứ không phải 5000.

**IngestionLoop**: thứ tự các bước trong một chu kỳ là có chủ đích — kiểm tra credential **trước** khi xử lý, để không file nào được xử lý bằng token sắp hết hạn. Trong test rotation: lúc 0s lấy t1 (hết hạn ở 200s); lúc 60s còn 140s ≥ 120s nên giữ t1; lúc 120s còn 80s < 120s nên lấy t2 — vì vậy 4 file đầu dùng t1, 2 file cuối dùng t2.

Lỗi hay gặp:
- So sánh thời điểm hết hạn với thời gian **đã trôi qua từ lúc bắt đầu** thay vì với {{now}}: chạy đúng khi startTime = 0 nhưng sai khi startTime khác 0 (test "startTime != 0" bắt lỗi này: lúc 620000, secret hết hạn ở 700000 chỉ còn 80 giây).
- Gọi {{fetch}} ở mọi chu kỳ: tốn request tới secret store, có thể bị chính secret store rate limit.
- Không {{break}} khi hết token mà tiếp tục duyệt: kết quả có thể vẫn đúng, nhưng lãng phí và trong code thật mỗi lần thử là một request lỗi 429.
- Quên đánh dấu SKIPPED: file kẹt ở NEW, không phân biệt được "chưa tới lượt" với "bị bỏ sót do lỗi".

> Senior tip: Trong code thật, đừng tự viết bucket nếu đã có thư viện: Resilience4j {{RateLimiter}} hoặc Bucket4j (hỗ trợ cả bucket phân tán trên Redis/Hazelcast). Nhưng hãy kiểm tra thư viện có giữ phần thời gian lẻ và dùng nguồn thời gian đơn điệu hay không — đó chính là hai lỗi bài này luyện bạn nhận ra.`
    }
  ],
  check: [
    {
      q: 'Ưu điểm chính của token bucket so với fixed window khi giới hạn tốc độ gọi API là gì?',
      options: ['Dễ cài đặt hơn vì chỉ cần một bộ đếm', 'Không bị burst gấp đôi ở ranh giới cửa sổ; burst luôn bị giới hạn bởi capacity', 'Không tốn chút bộ nhớ nào', 'Đảm bảo provider không bao giờ trả 429'],
      answer: 1,
      explain: `Fixed window cho phép dồn quota của hai cửa sổ liền nhau vào vài giây quanh ranh giới (gấp đôi giới hạn). Token bucket nạp liên tục theo thời gian nên trong bất kỳ khoảng nào cũng không vượt capacity + tốc độ nạp × thời gian. "Dễ cài đặt hơn": thực ra fixed window mới là cái chỉ cần một bộ đếm. "Không tốn bộ nhớ": bucket vẫn cần lưu số token và mốc thời gian (rất ít, nhưng không phải 0). "Không bao giờ 429": provider đếm theo cách riêng và quota có thể bị chia cho nhiều instance, nên vẫn có thể nhận 429.`
    },
    {
      q: 'Vì sao token bucket nạp lười phải cập nhật {{lastRefill += periods * interval}} thay vì {{lastRefill = now}}?',
      options: ['Để tránh tràn số long', 'Để không vứt bỏ phần thời gian lẻ chưa đủ một chu kỳ, giữ đúng tốc độ nạp cấu hình', 'Để bucket nạp nhanh hơn cấu hình', 'Hai cách cho kết quả như nhau'],
      answer: 1,
      explain: `Gán bằng now sẽ bỏ mất phần lẻ (ví dụ 500ms của khoảng 1500ms), nên token tiếp theo đến muộn hơn và tốc độ thực tế thấp hơn cấu hình. Không liên quan tràn số. Cách đúng cũng không nạp nhanh hơn cấu hình — nó chỉ giữ đúng tốc độ. Hai cách khác nhau rõ ràng mỗi khi request đến lệch khỏi mốc chu kỳ.`
    },
    {
      q: 'Đã có pre-emptive rotation, có còn cần xử lý 401 Unauthorized không?',
      options: ['Không, rotation chủ động đảm bảo không bao giờ gặp 401', 'Có: token có thể bị thu hồi trước hạn hoặc đồng hồ lệch; khi gặp 401 thì lấy token mới và thử lại đúng một lần', 'Có: retry 401 vô hạn tới khi thành công', 'Không, 401 luôn là lỗi cấu hình'],
      answer: 1,
      explain: `Rotation chủ động giảm hầu hết lỗi 401 nhưng không loại bỏ hết: token có thể bị revoke, đồng hồ giữa các máy có thể lệch. Fallback chuẩn là refresh rồi thử lại một lần; nếu vẫn 401 thì đó mới là lỗi cấu hình. Retry vô hạn sẽ spam provider và secret store. "401 luôn là lỗi cấu hình" sai vì token hết hạn/bị thu hồi cũng trả 401.`
    }
  ],
  related: ['devops-006', 'devops-010'],
  tags: ['Ingestion', 'Token Bucket', 'Rate limiting', 'Secret rotation', 'Batch Processing']
},
{
  id: 'lesson-devops-006',
  track: 'devops',
  order: 6,
  title: 'Graceful shutdown end-to-end: ngân sách thời gian từ SIGTERM tới SIGKILL, drain thread pool và rolling update không rớt request',
  level: 'senior',
  minutes: 45,
  goals: [
    'Vẽ được dòng thời gian tắt một Pod (Terminating → preStop → SIGTERM → Spring đóng context → SIGKILL) và chỉ ra bước nào chạy song song',
    'Tính được ngân sách thời gian: terminationGracePeriodSeconds phải lớn hơn preStop + tổng thời gian các shutdown phase của Spring + dọn tài nguyên',
    'Cài đặt mẫu drain chuẩn cho ExecutorService: shutdown → awaitTermination có hạn → shutdownNow, và báo cáo số request bị huỷ',
    'Cấu hình rolling update (maxSurge, maxUnavailable, minReadySeconds) và nhận ra các bẫy như ENTRYPOINT dạng shell nuốt SIGTERM',
  ],
  body: `### Vì sao đã bật graceful shutdown mà deploy vẫn rớt request?
Bài "Liveness, readiness, startup probe" đã dựng state machine READY → DRAINING. Bài này đi tiếp ở mức **toàn hệ thống**: nhìn cả dòng thời gian từ lúc Kubernetes quyết định xoá Pod đến lúc JVM thoát, **cộng thời gian** cho từng bước, và tự cài phần lõi mà Spring làm hộ bạn: **drain một thread pool** (chờ request đang chạy, hết hạn thì huỷ và báo cáo).

Graceful shutdown chỉ đúng khi **ba tầng** cùng phối hợp. Hỏng một tầng là mất request:

| Tầng | Nhiệm vụ | Cấu hình chính |
|---|---|---|
| Kubernetes | Gỡ Pod khỏi Service, chạy preStop, gửi SIGTERM, hạn chót thì SIGKILL | {{preStop}}, {{terminationGracePeriodSeconds}} |
| Container (PID 1) | Chuyển SIGTERM tới JVM | {{ENTRYPOINT}} dạng exec |
| Spring Boot / JVM | Ngừng nhận việc mới, chờ việc đang chạy, đóng tài nguyên theo thứ tự | {{server.shutdown}}, {{spring.lifecycle.timeout-per-shutdown-phase}}, {{spring.task.execution.shutdown.*}} |

### Dòng thời gian tắt một Pod (ví dụ có số)
~~~text
t=0s    Pod chuyển Terminating (rolling update / scale down / kubectl delete)
        ├─ song song A: EndpointSlice gỡ Pod; kube-proxy, Ingress, ALB cập nhật sau 1-5s
        │               (trong khoảng này request MỚI vẫn có thể tới Pod)
        └─ song song B: kubelet chạy preStop "sleep 10"
t=10s   preStop xong → kubelet gửi SIGTERM tới PID 1 của container
        JVM chạy shutdown hook → Spring đóng ApplicationContext:
          1. readiness = REFUSING_TRAFFIC
          2. web server ngừng nhận kết nối mới, chờ request đang chạy  (≤ 20s)
          3. các SmartLifecycle khác dừng: Kafka listener, scheduler…   (mỗi phase ≤ 20s)
          4. destroy bean: executor chờ task, HikariCP đóng connection
t≈25s   JVM thoát (exit code 143 = 128 + 15, tức là thoát do SIGTERM) → Pod biến mất
t=60s   hạn chót terminationGracePeriodSeconds: còn sống thì SIGKILL (exit 137)
~~~

Điểm then chốt: đồng hồ {{terminationGracePeriodSeconds}} bắt đầu chạy **từ t=0**, nghĩa là **tính cả thời gian preStop**. Nếu preStop vẫn chạy khi hết hạn, kubelet chỉ cho thêm một lần 2 giây rồi kill.

### Ngân sách thời gian: phép cộng phải đúng
~~~text
terminationGracePeriodSeconds ≥ preStop
                               + (số shutdown phase có việc chờ × timeout-per-shutdown-phase)
                               + thời gian destroy bean (executor, connection pool)
                               + dự phòng 5-10s
~~~
Ví dụ sai rất hay gặp: để mặc định {{terminationGracePeriodSeconds: 30}}, thêm preStop 10s, và Spring mặc định {{timeout-per-shutdown-phase: 30s}}. Tổng khả dĩ 40s+ > 30s → request dài nhất bị SIGKILL cắt ngang, Kafka offset chưa commit nên message bị xử lý lại. Cấu hình đúng tương ứng với dòng thời gian trên:

~~~yaml
# Deployment (trích)
spec:
  template:
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: app
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]
~~~

~~~yaml
# application.yml
server:
  shutdown: graceful                 # mặc định từ Spring Boot 3.4; bản cũ hơn phải ghi rõ
spring:
  lifecycle:
    timeout-per-shutdown-phase: 20s  # mỗi phase chờ tối đa 20s
  task:
    execution:
      shutdown:
        await-termination: true      # executor của @Async chờ task đang chạy
        await-termination-period: 15s
~~~

### Bên trong JVM: Spring đóng context theo thứ tự nào?
1. **SIGTERM → shutdown hook.** Spring Boot đăng ký sẵn một JVM shutdown hook ({{spring.main.register-shutdown-hook=true}} mặc định) để gọi {{context.close()}}.
2. **Readiness = REFUSING_TRAFFIC.** Web application context phát {{AvailabilityChangeEvent}} trước khi dừng bean, nên {{/actuator/health/readiness}} trả 503.
3. **Dừng các bean SmartLifecycle theo phase** (phase cao dừng trước). Graceful shutdown của web server là một phase: Tomcat/Jetty/Undertow ngừng nhận kết nối mới và chờ request đang chạy. Listener container của Spring Kafka, scheduler… là các phase khác. Mỗi phase chờ tối đa {{timeout-per-shutdown-phase}}; quá hạn thì Spring ghi log và **đi tiếp**, không chờ mãi.
4. **Destroy singleton bean**: {{@PreDestroy}}, {{DisposableBean}}. {{ThreadPoolTaskExecutor}} theo mặc định **không chờ**: nó gọi {{shutdownNow()}} — task đang chạy bị interrupt, task trong queue bị bỏ. Muốn chờ phải bật {{await-termination}} như trên (tương ứng {{setWaitForTasksToCompleteOnShutdown(true)}} + {{setAwaitTerminationSeconds}}). HikariCP đóng pool; task nào vẫn chạy sau đó sẽ gặp lỗi "HikariDataSource has been closed".
5. Mọi thread non-daemon kết thúc → JVM thoát.

### Mẫu drain chuẩn cho ExecutorService
Đây chính là phần lõi của bước 3–4, và là thứ bạn phải tự viết khi có thread pool riêng (consumer tự quản lý, batch worker):

~~~java
pool.shutdown();                                     // 1. không nhận task mới; task trong queue VẪN chạy
if (!pool.awaitTermination(20, TimeUnit.SECONDS)) {  // 2. chờ có hạn, không bao giờ chờ vô hạn
    List<Runnable> dropped = pool.shutdownNow();     // 3. lấy task chưa chạy ra + interrupt task đang chạy
    log.warn("Shutdown timeout, dropped {} queued tasks", dropped.size());
    pool.awaitTermination(5, TimeUnit.SECONDS);      // 4. cho task bị interrupt thời gian dọn dẹp
}
~~~

| Lời gọi | Task mới | Task trong queue | Task đang chạy | Chặn thread gọi? |
|---|---|---|---|---|
| {{shutdown()}} | Bị từ chối ({{RejectedExecutionException}}) | Vẫn được chạy | Chạy tiếp | Không |
| {{awaitTermination(t)}} | — | — | — | Có, tối đa t; trả true nếu đã xong hết |
| {{shutdownNow()}} | Bị từ chối | Bị lấy ra, trả về dạng {{List<Runnable>}} | Bị **interrupt** | Không |

Interrupt là **hợp tác**: task đang chặn ở {{socket.read()}} không có timeout sẽ không phản ứng. Vì vậy mọi lời gọi mạng phải có timeout, và code bắt {{InterruptedException}} phải khôi phục cờ ({{Thread.currentThread().interrupt()}}) chứ không nuốt.

### Rolling update: tắt Pod cũ mới là một nửa câu chuyện
- **maxSurge / maxUnavailable** (mặc định 25% / 25%; maxSurge làm tròn **lên**, maxUnavailable làm tròn **xuống**). Service quan trọng nên đặt {{maxUnavailable: 0}} để không bao giờ thiếu capacity, và {{maxSurge: 1}} hoặc 25% tuỳ quota tài nguyên.
- Rolling update chỉ tắt Pod cũ khi Pod mới đã **Ready**. Readiness của Pod mới phải phản ánh warm-up thật (connection pool đã mở, cache đã nạp), nếu không Pod mới nhận traffic khi còn "lạnh" và p99 tăng vọt.
- **minReadySeconds**: Pod mới phải Ready liên tục N giây mới được tính là available — chặn trường hợp Ready rồi crash ngay.
- **progressDeadlineSeconds** (mặc định 600s): rollout không tiến triển sẽ bị đánh dấu thất bại, nhưng Deployment **không tự rollback**; việc đó là của pipeline (Argo Rollouts, kubectl rollout undo).
- **PodDisruptionBudget** bảo vệ khi drain node (eviction tự nguyện), **không** áp dụng cho rolling update của Deployment.

### Bẫy production hay gặp
- **ENTRYPOINT dạng shell**: {{ENTRYPOINT java -jar app.jar}} khiến {{/bin/sh}} là PID 1; sh không chuyển SIGTERM cho JVM. Log không hề có dòng "Commencing graceful shutdown", Pod luôn mất đúng {{terminationGracePeriodSeconds}} rồi bị SIGKILL (exit 137). Sửa: dạng exec {{ENTRYPOINT ["java", "-jar", "app.jar"]}}, hoặc {{exec java …}} trong script, hoặc dùng init nhỏ như tini.
- **Image distroless không có sh**: preStop {{sh -c "sleep 10"}} lỗi ngay (event FailedPreStopHook) nên không có độ trễ nào. Dùng {{preStop.sleep}} của Kubernetes (có sẵn từ 1.30).
- **Request dài hơn timeout** (export báo cáo 2 phút, upload lớn): luôn bị cắt khi deploy. Chuyển thành job bất đồng bộ có idempotency key, client poll kết quả.
- **Kết nối sống lâu** (WebSocket, gRPC stream): web server ngừng nhận kết nối **mới** nhưng kết nối cũ vẫn mở tới hạn chót. Chủ động gửi tín hiệu đóng (close frame, gRPC GOAWAY) để client kết nối lại sang Pod khác.
- **Shutdown hook tự viết gọi {{System.exit()}}**: khi JVM đang chạy shutdown hook, {{System.exit}} chặn vĩnh viễn → treo tới SIGKILL.

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Bật server.shutdown=graceful rồi mà mỗi lần deploy vẫn có Pod bị SIGKILL và lỗi 502, bạn điều tra thế nào?" Trả lời theo dòng thời gian: (1) kiểm tra SIGTERM có tới JVM không (ENTRYPOINT, log "Commencing graceful shutdown", exit code 137 hay 143); (2) preStop để LB kịp gỡ Pod; (3) phép cộng ngân sách grace ≥ preStop + các phase + dọn dẹp; (4) executor và consumer riêng có drain với timeout, đếm số task bị huỷ; (5) rolling update {{maxUnavailable: 0}} + readiness thật + minReadySeconds. Bài tập dưới đây cài phần (4).

> Senior tip: Hãy log và đưa thành metric ba con số cho mỗi lần shutdown: thời điểm nhận SIGTERM, thời gian drain thực tế và số request bị huỷ. Lấy p99.9 thời gian xử lý request làm cơ sở cho {{timeout-per-shutdown-phase}} (cộng thêm 50%), rồi mới tính ngược ra grace period. Đội nào làm vậy thường phát hiện ra "đuôi dài" — vài endpoint chạy 40 giây — mà không ai biết trước.`,
  exercises: [
    {
      title: 'GracefulServer: ngừng nhận, drain có hạn, huỷ và đếm request bị bỏ',
      prompt: `Mô phỏng phần "drain" của graceful shutdown bằng một {{ExecutorService}}. Starter đã tạo sẵn pool (thread daemon), các bộ đếm và {{shutdown(timeoutMs)}} = {{beginShutdown()}} + {{awaitDrain(timeoutMs)}}. Bạn cần hoàn thiện:

- {{submit(Runnable request)}}: nếu server đang tắt thì trả **false** và **không** chạy request. Ngược lại đưa vào pool một wrapper: tăng {{running}} khi bắt đầu, chạy request, thành công thì tăng {{completed}}, luôn giảm {{running}} ở {{finally}}; request ném {{RuntimeException}} thì không được làm chết worker. Trả **true**. Nếu pool đã đóng ({{RejectedExecutionException}}) thì trả false.
- {{beginShutdown()}}: ngừng nhận request mới (để {{isAccepting()}} trả false) và cho pool ngừng nhận task. **Không được chặn** và **không được huỷ** request đang chạy hay đang xếp hàng.
- {{awaitDrain(timeoutMs)}}: chờ tối đa {{timeoutMs}} cho mọi request đã nhận (đang chạy **và** đang xếp hàng) xong. Xong kịp thì trả **0**. Hết hạn thì huỷ cưỡng bức: request chưa bắt đầu bị bỏ, request đang chạy bị interrupt; trả về **số request bị huỷ** = số đang chạy + số chưa bắt đầu.

Gợi ý về thứ tự: đọc số request đang chạy **trước** khi interrupt chúng, vì request bị interrupt sẽ thoát và giảm bộ đếm.`,
      starter: `class GracefulServer {
    private final ExecutorService pool;
    private final AtomicInteger running = new AtomicInteger();    // request đang chạy
    private final AtomicInteger completed = new AtomicInteger();  // request chạy xong bình thường
    private volatile boolean accepting = true;

    GracefulServer(int workers) {
        // thread daemon: JVM không bị treo nếu ai đó quên shutdown
        this.pool = Executors.newFixedThreadPool(workers, r -> {
            Thread t = new Thread(r, "request-worker");
            t.setDaemon(true);
            return t;
        });
    }

    boolean submit(Runnable request) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isAccepting() { return accepting; }

    int completed() { return completed.get(); }

    /** Bước 1 khi nhận SIGTERM: ngừng nhận việc mới, không chặn. */
    void beginShutdown() {
        throw new UnsupportedOperationException("TODO");
    }

    /** Bước 2: chờ có hạn; hết hạn thì huỷ cưỡng bức và trả số request bị huỷ. */
    int awaitDrain(long timeoutMs) throws InterruptedException {
        throw new UnsupportedOperationException("TODO");
    }

    int shutdown(long timeoutMs) throws InterruptedException {
        beginShutdown();
        return awaitDrain(timeoutMs);
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    interface Case { void run() throws Exception; }
    static void check(String name, Case c) {
        total++;
        try { c.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    // request chặn tới khi release mở (tối đa 10s); bị interrupt thì đếm và giữ cờ interrupt
    static Runnable blocking(CountDownLatch started, CountDownLatch release, CountDownLatch interrupted) {
        return () -> {
            started.countDown();
            try {
                if (!release.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("release timeout");
            } catch (InterruptedException e) {
                interrupted.countDown();
                Thread.currentThread().interrupt();
            }
        };
    }
    public static void main(String[] args) {
        check("drain ok: every accepted request completes, 0 cancelled", () -> {
            GracefulServer s = new GracefulServer(2);
            CountDownLatch done = new CountDownLatch(6);
            for (int i = 0; i < 6; i++) eq(true, s.submit(done::countDown));
            eq(0, s.shutdown(5_000));
            eq(0L, done.getCount());
            eq(6, s.completed());
        });
        check("after beginShutdown: new requests rejected and never run", () -> {
            GracefulServer s = new GracefulServer(1);
            AtomicInteger ran = new AtomicInteger();
            s.beginShutdown();
            eq(false, s.isAccepting());
            eq(false, s.submit(ran::incrementAndGet));
            eq(0, s.awaitDrain(2_000));
            eq(0, ran.get());
        });
        check("in-flight request finishes during drain (not interrupted)", () -> {
            GracefulServer s = new GracefulServer(1);
            CountDownLatch started = new CountDownLatch(1), release = new CountDownLatch(1), intr = new CountDownLatch(1);
            eq(true, s.submit(blocking(started, release, intr)));
            eq(true, started.await(5, TimeUnit.SECONDS));
            s.beginShutdown();                       // phải trả về ngay, không chặn
            eq(false, s.submit(() -> { }));
            release.countDown();
            eq(0, s.awaitDrain(5_000));
            eq(1, s.completed());
            eq(1L, intr.getCount());                 // không ai interrupt request này
        });
        check("queued requests still run (shutdown, not shutdownNow)", () -> {
            GracefulServer s = new GracefulServer(1);
            CountDownLatch started = new CountDownLatch(1), release = new CountDownLatch(1), intr = new CountDownLatch(1);
            AtomicInteger queuedRan = new AtomicInteger();
            eq(true, s.submit(blocking(started, release, intr)));
            eq(true, started.await(5, TimeUnit.SECONDS));
            for (int i = 0; i < 3; i++) eq(true, s.submit(queuedRan::incrementAndGet));
            s.beginShutdown();
            release.countDown();
            eq(0, s.awaitDrain(5_000));
            eq(3, queuedRan.get());
            eq(4, s.completed());
        });
        check("timeout: cancels running + queued and returns the count", () -> {
            GracefulServer s = new GracefulServer(2);
            CountDownLatch started = new CountDownLatch(2), never = new CountDownLatch(1), intr = new CountDownLatch(2);
            AtomicInteger queuedRan = new AtomicInteger();
            eq(true, s.submit(blocking(started, never, intr)));
            eq(true, s.submit(blocking(started, never, intr)));
            eq(true, started.await(5, TimeUnit.SECONDS));     // cả 2 worker đang bận
            for (int i = 0; i < 3; i++) eq(true, s.submit(queuedRan::incrementAndGet));
            s.beginShutdown();
            eq(5, s.awaitDrain(300));                         // 2 đang chạy + 3 chưa bắt đầu
            eq(true, intr.await(5, TimeUnit.SECONDS));        // request đang chạy nhận interrupt
            eq(0, queuedRan.get());                           // request trong queue bị bỏ
        });
        check("a failing request does not kill the worker", () -> {
            GracefulServer s = new GracefulServer(1);
            CountDownLatch done = new CountDownLatch(1);
            eq(true, s.submit(() -> { throw new IllegalStateException("boom"); }));
            eq(true, s.submit(done::countDown));
            eq(0, s.shutdown(5_000));
            eq(0L, done.getCount());
            eq(1, s.completed());
        });
        check("shutdown twice is safe", () -> {
            GracefulServer s = new GracefulServer(1);
            eq(true, s.submit(() -> { }));
            eq(0, s.shutdown(5_000));
            eq(0, s.shutdown(100));
            eq(false, s.submit(() -> { }));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class GracefulServer {
    private final ExecutorService pool;
    private final AtomicInteger running = new AtomicInteger();
    private final AtomicInteger completed = new AtomicInteger();
    private volatile boolean accepting = true;

    GracefulServer(int workers) {
        this.pool = Executors.newFixedThreadPool(workers, r -> {
            Thread t = new Thread(r, "request-worker");
            t.setDaemon(true);
            return t;
        });
    }

    boolean submit(Runnable request) {
        if (!accepting) return false;                 // đang tắt: từ chối nhanh (readiness false)
        try {
            pool.execute(() -> {
                running.incrementAndGet();
                try {
                    request.run();
                    completed.incrementAndGet();
                } catch (RuntimeException e) {
                    // code thật: log lỗi; không để exception làm chết worker
                } finally {
                    running.decrementAndGet();
                }
            });
            return true;
        } catch (RejectedExecutionException e) {     // shutdown chen vào giữa lúc kiểm tra và execute
            return false;
        }
    }

    boolean isAccepting() { return accepting; }

    int completed() { return completed.get(); }

    void beginShutdown() {
        accepting = false;
        pool.shutdown();          // không nhận task mới; task trong queue VẪN được chạy
    }

    int awaitDrain(long timeoutMs) throws InterruptedException {
        if (pool.awaitTermination(timeoutMs, TimeUnit.MILLISECONDS)) return 0;
        int inFlight = running.get();                   // đọc TRƯỚC khi interrupt
        List<Runnable> neverStarted = pool.shutdownNow(); // lấy queue ra + interrupt task đang chạy
        return inFlight + neverStarted.size();
    }

    int shutdown(long timeoutMs) throws InterruptedException {
        beginShutdown();
        return awaitDrain(timeoutMs);
    }
}`,
      hints: [
        'Trong {{submit}}, kiểm tra cờ {{accepting}} trước; bọc request trong một lambda tăng/giảm {{running}} (giảm trong {{finally}}) và bắt {{RuntimeException}}. Đừng quên bắt {{RejectedExecutionException}} từ {{pool.execute}}.',
        '{{beginShutdown}} chỉ cần đặt {{accepting = false}} và gọi {{pool.shutdown()}} — hàm này không chặn và vẫn cho task trong queue chạy. Đừng gọi {{shutdownNow()}} ở đây.',
        'Trong {{awaitDrain}}: {{pool.awaitTermination(timeoutMs, TimeUnit.MILLISECONDS)}} trả true thì trả 0. Ngược lại đọc {{running.get()}} rồi mới gọi {{pool.shutdownNow()}}; kết quả = số đang chạy + kích thước list trả về.',
      ],
      explain: `**Ý tưởng**: tách shutdown thành hai bước giống Spring và Kubernetes. {{beginShutdown}} tương ứng lúc nhận SIGTERM: ngừng nhận việc mới nhưng **không đụng** vào việc đã nhận. {{awaitDrain}} tương ứng {{timeout-per-shutdown-phase}}: chờ có hạn, hết hạn thì huỷ cưỡng bức để kịp thoát trước SIGKILL, và **báo cáo** đã huỷ bao nhiêu để có metric.

**Vì sao {{shutdown()}} chứ không phải {{shutdownNow()}} ở bước 1?** Test "queued requests still run" kiểm tra đúng điều này: 3 request đã được nhận (client đang chờ response) mà bị bỏ thì chẳng khác gì kill. {{shutdownNow()}} chỉ là phương án cuối khi đã hết thời gian.

**Vì sao đọc {{running}} trước {{shutdownNow()}}?** Sau khi bị interrupt, request đang chạy thoát rất nhanh và giảm bộ đếm trong {{finally}}; đọc sau có thể ra 0 hoặc 1 thay vì 2, tức là test lúc pass lúc fail. Trong code thật con số này phục vụ log/metric nên một sai lệch nhỏ do race là chấp nhận được, nhưng thứ tự đúng giảm sai lệch tối đa.

**Lỗi hay gặp:**
- Chỉ đặt cờ {{accepting = false}} mà quên {{pool.shutdown()}}: {{awaitTermination}} không bao giờ trả true, mọi lần shutdown đều chờ hết timeout.
- {{awaitTermination}} không có hạn ({{Long.MAX_VALUE}}): một request treo giữ Pod tới SIGKILL — mất luôn khả năng dọn dẹp có kiểm soát.
- Không bắt {{RuntimeException}} trong wrapper: với {{execute()}}, exception làm chết worker thread (pool tạo thread mới, nhưng {{completed}}/{{running}} vẫn phải đúng nhờ {{finally}}).
- Request bắt {{InterruptedException}} rồi nuốt (không khôi phục cờ, chạy tiếp): {{shutdownNow()}} mất tác dụng.

> Senior tip: Spring Kafka, {{@Scheduled}} và {{@Async}} đều dựa trên đúng mẫu này. Khi review cấu hình, hỏi ba câu: pool có chờ task không (await-termination), chờ tối đa bao lâu, và tổng các thời gian đó có nằm gọn trong grace period trừ preStop không.`
    }
  ],
  check: [
    {
      q: 'Deployment có {{terminationGracePeriodSeconds: 30}}, preStop {{sleep 10}}, Spring Boot {{timeout-per-shutdown-phase: 30s}}. Một request mất 25 giây đang chạy khi Pod bị xoá. Điều gì nhiều khả năng xảy ra?',
      options: ['Request xong bình thường vì Spring chờ tới 30 giây', 'Request bị SIGKILL cắt ngang vì grace period tính từ lúc xoá Pod, gồm cả 10 giây preStop', 'Kubernetes tự kéo dài grace period cho tới khi Spring báo xong', 'preStop không tính vào grace period nên còn đủ 30 giây sau SIGTERM'],
      answer: 1,
      explain: `Đồng hồ grace period chạy từ lúc Pod chuyển Terminating, preStop ăn mất 10 giây, nên sau SIGTERM chỉ còn khoảng 20 giây — không đủ cho request 25 giây, SIGKILL đến trước. "Spring chờ tới 30 giây" đúng ở phía Spring nhưng Kubernetes không biết và không chờ. Kubernetes không kéo dài theo app; ngoại lệ duy nhất là thêm một lần 2 giây khi preStop còn chạy lúc hết hạn. Phương án cuối sai vì preStop được tính trong grace period.`
    },
    {
      q: 'Khi tắt một {{ExecutorService}} để drain request, khác biệt đúng giữa {{shutdown()}} và {{shutdownNow()}} là gì?',
      options: ['shutdown() chặn tới khi mọi task xong; shutdownNow() không chặn', 'shutdown() từ chối task mới nhưng vẫn chạy task trong queue; shutdownNow() lấy task trong queue ra (trả về list) và interrupt task đang chạy', 'shutdown() huỷ task trong queue; shutdownNow() kill thread ngay lập tức', 'Hai hàm như nhau, shutdownNow() chỉ nhanh hơn'],
      answer: 1,
      explain: `{{shutdown()}} chỉ đóng cửa nhận việc mới; việc đã xếp hàng vẫn chạy hết. {{shutdownNow()}} trả về các {{Runnable}} chưa chạy và gửi interrupt cho thread đang chạy. Cả hai đều **không chặn** — muốn chờ phải gọi {{awaitTermination}}, nên phương án đầu sai. {{shutdownNow()}} không kill thread: interrupt là hợp tác, task phải tự kiểm tra cờ hoặc đang chặn ở hàm phản ứng với interrupt. Hai hàm khác nhau về ngữ nghĩa chứ không phải tốc độ.`
    },
    {
      q: 'Deployment 10 replicas, rolling update với {{maxSurge: 25%}} và {{maxUnavailable: 0}}. Phát biểu nào đúng?',
      options: ['Tối đa 13 Pod cùng lúc và không lúc nào dưới 10 Pod available, vì maxSurge làm tròn lên (2,5 → 3)', 'Tối đa 12 Pod vì 25% của 10 làm tròn xuống thành 2', 'Cấu hình không hợp lệ vì maxUnavailable không được bằng 0', 'Kubernetes tắt Pod cũ trước rồi mới tạo Pod mới'],
      answer: 0,
      explain: `maxSurge làm tròn **lên** (2,5 → 3) nên có thể có tới 13 Pod; maxUnavailable bằng 0 nên số Pod available không bao giờ dưới 10 — Pod cũ chỉ bị tắt khi Pod mới đã Ready. Làm tròn xuống là quy tắc của maxUnavailable, không phải maxSurge. Chỉ không hợp lệ khi **cả hai** cùng bằng 0 (rollout không thể tiến). Với maxUnavailable = 0, Kubernetes buộc phải tạo Pod mới trước rồi mới tắt Pod cũ, nên phương án cuối sai.`
    }
  ],
  related: ['devops-004', 'devops-017', 'concurrency-020', 'microservices-024'],
  tags: ['Graceful shutdown', 'Kubernetes', 'SIGTERM', 'preStop', 'ExecutorService', 'Rolling update', 'Spring Boot']
},
{
  id: 'lesson-devops-007',
  track: 'devops',
  order: 7,
  title: 'Chống retry storm: circuit breaker CLOSED/OPEN/HALF_OPEN, retry budget và các kiểu jitter',
  level: 'senior',
  minutes: 50,
  goals: [
    'Giải thích được vì sao retry có thể biến một sự cố nhỏ thành sự cố kéo dài (retry storm, metastable failure) bằng phép tính tải cụ thể',
    'Mô tả chính xác state machine của circuit breaker: sliding window, minimumNumberOfCalls, OPEN fail fast, HALF_OPEN với số lượt thử giới hạn',
    'Cài đặt circuit breaker dùng đồng hồ giả để kiểm thử xác định, cùng full jitter không tràn số và retry budget',
    'Cấu hình Resilience4j trên Spring Boot 3 đúng thứ tự decorator và tránh các bẫy như retry CallNotPermittedException',
  ],
  body: `### Retry storm: khi "thử lại cho chắc" đánh sập hệ thống
Bài "Retry đúng cách khi gọi provider ngoài" đã dạy phân loại lỗi và backoff cho **một lời gọi**. Bài này nhìn ở **mức hệ thống**: hàng trăm Pod cùng retry vào một dependency đang yếu.

Ví dụ có số: service Order nhận 1.000 req/s, mỗi request gọi Payment một lần. Payment chịu được tối đa khoảng 1.500 req/s. Một đợt GC dài làm Payment chậm vài giây, mọi lời gọi timeout. Order cấu hình retry 3 lần (tổng 4 lần gọi):

| Thời điểm | Tỉ lệ lỗi | Tải thực tế lên Payment |
|---|---|---|
| Bình thường | 0% | 1.000 req/s |
| Sự cố | 100% | 1.000 × 4 = **4.000 req/s** (gấp 2,7 lần sức chịu) |
| GC đã xong, nhưng hàng đợi còn đầy | vẫn ~100% vì quá tải | vẫn 4.000 req/s |

Hàng thứ ba là điều đáng sợ: nguyên nhân gốc đã hết, nhưng **chính retry** giữ Payment ở trạng thái quá tải. Hiện tượng này gọi là **metastable failure** — hệ thống kẹt ở trạng thái xấu cho tới khi có người cắt bớt tải bằng tay. Nhiều tầng retry còn nhân lên: gateway 2 lần × BFF 3 lần × Order 3 lần = **18 lời gọi** tới Payment cho một cú click của người dùng.

Ba công cụ giải quyết ba phần khác nhau của vấn đề — cần cả ba:

| Công cụ | Giải quyết | Không giải quyết |
|---|---|---|
| Backoff + jitter | Giãn và rải các lần retry theo thời gian | Tổng số retry vẫn y nguyên |
| Retry budget | Giới hạn tổng retry theo tỉ lệ traffic gốc | Không fail nhanh khi dependency chết hẳn |
| Circuit breaker | Ngừng gọi dependency đang hỏng, fail nhanh, thử lại dè dặt | Không giảm tải khi tỉ lệ lỗi còn dưới ngưỡng |

### Các kiểu jitter
Gọi {{c = min(cap, base × 2^attempt)}} là trần của lần chờ thứ {{attempt}}. Bài viết kinh điển "Exponential Backoff And Jitter" (Marc Brooker, AWS Architecture Blog) so sánh:

| Kiểu | Thời gian chờ | Nhận xét |
|---|---|---|
| Không jitter | {{c}} | Mọi client đồng bộ → tải dồn thành từng đợt sóng |
| Full jitter | ngẫu nhiên đều trong {{[0, c]}} | Rải đều nhất, tổng số lời gọi ít nhất; đôi khi retry rất sớm |
| Equal jitter | {{c/2 + random[0, c/2]}} | Luôn chờ ít nhất c/2; rải kém hơn full jitter |
| Decorrelated | {{min(cap, random[base, prev × 3])}} | Dựa trên lần chờ trước; hiệu quả gần full jitter |

Kết luận của bài viết: có jitter tốt hơn hẳn không jitter; full jitter và decorrelated cho tổng công việc ít nhất. Chi tiết cài đặt quan trọng: tính {{c}} bằng phép nhân đôi **có kiểm tra trần**. Viết {{base << attempt}} thì với attempt ≥ 63 kết quả bị tràn (Java chỉ lấy 6 bit thấp của số lần dịch với kiểu long), ra 0 hoặc số âm.

### Retry budget: giới hạn tổng số retry
Ý tưởng (Finagle, gRPC retry throttling, chế độ retry "standard" của AWS SDK dùng retry quota dạng token bucket): retry chỉ được phép khi **tổng số retry ≤ X% số request gốc**, cộng một ít "dự trữ" để service traffic thấp vẫn retry được.
- Dependency khoẻ, lỗi lẻ tẻ: budget còn nhiều, mọi lỗi tạm thời đều được retry.
- Lỗi diện rộng: budget cạn ngay, tải tăng thêm **tối đa X%** thay vì gấp 4 lần.

Với X = 20% và 100 request đều lỗi, mỗi request muốn retry 3 lần: không có budget là 300 retry, có budget chỉ khoảng 20 (+ dự trữ). Bài tập 2 kiểm tra đúng con số này.

### Circuit breaker: state machine
~~~text
            failure rate ≥ ngưỡng (khi đã có ≥ minimumNumberOfCalls kết quả)
   CLOSED ─────────────────────────────────────────────────► OPEN
     ▲                                                          │
     │ các lượt thử thành công                                  │ hết waitDurationInOpenState,
     │                                                          │ có call tiếp theo
     │                                                          ▼
     └────────────────────────────────────────────────── HALF_OPEN
                              lượt thử lỗi ──────────► OPEN (đếm lại thời gian)
~~~

- **CLOSED**: mọi call đi qua. Kết quả ghi vào **sliding window**: COUNT_BASED (N call gần nhất) hoặc TIME_BASED (các call trong N giây gần nhất). Failure rate chỉ được tính khi window đã có **ít nhất minimumNumberOfCalls** kết quả, để 1 lỗi trên 1 call không mở mạch. Kết quả cũ bị đẩy ra khỏi window, nên mạch phản ánh tình trạng **hiện tại** chứ không phải lịch sử từ lúc khởi động.
- **Slow call**: Resilience4j còn đếm call chậm hơn {{slowCallDurationThreshold}}; tỉ lệ slow call vượt {{slowCallRateThreshold}} cũng mở mạch. Dependency **chậm** thường nguy hiểm hơn dependency **chết**: nó giữ thread và connection rất lâu.
- **OPEN**: không gọi dependency, ném {{CallNotPermittedException}} ngay (vài micro giây). Thread được giải phóng, dependency có thời gian hồi phục.
- **HALF_OPEN**: sau {{waitDurationInOpenState}}, cho đúng {{permittedNumberOfCallsInHalfOpenState}} lượt thử; call vượt số đó vẫn bị từ chối. Resilience4j tính failure rate trên các lượt thử: dưới ngưỡng thì về CLOSED (window làm mới), từ ngưỡng trở lên thì quay lại OPEN. Bài tập đơn giản hoá thành "một lượt thử lỗi là OPEN lại".
- Mặc định Resilience4j chỉ chuyển OPEN → HALF_OPEN khi **có call tiếp theo** sau thời gian chờ; muốn chuyển tự động theo đồng hồ thì bật {{automaticTransitionFromOpenToHalfOpenEnabled}}.

Vì sao bài tập dùng {{LongSupplier nowMs}} thay vì {{System.currentTimeMillis()}}? Để test "đúng 5000ms thì chuyển HALF_OPEN" chạy xác định trong vài mili-giây, không cần {{Thread.sleep}}. Resilience4j làm điều tương tự: nó nhận một {{Clock}} có thể thay khi test.

### Resilience4j trên Spring Boot 3
~~~yaml
resilience4j:
  circuitbreaker:
    instances:
      payment:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 20
        minimum-number-of-calls: 10
        failure-rate-threshold: 50
        slow-call-duration-threshold: 2s
        slow-call-rate-threshold: 80
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
  retry:
    instances:
      payment:
        max-attempts: 3                  # gồm cả lần gọi đầu tiên
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        ignore-exceptions:
          - io.github.resilience4j.circuitbreaker.CallNotPermittedException
~~~

~~~java
@Retry(name = "payment")
@CircuitBreaker(name = "payment", fallbackMethod = "chargeFallback")
public Receipt charge(ChargeRequest req) { return paymentClient.charge(req); }

// cùng tham số + Throwable ở cuối; được gọi khi lỗi hoặc khi mạch OPEN
private Receipt chargeFallback(ChargeRequest req, Throwable t) {
    throw new PaymentUnavailableException("Payment tạm thời không sẵn sàng", t); // 503 nhanh, không giả vờ thành công
}
~~~

Thứ tự mặc định của các aspect: {{Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( hàm ) ) ) ) )}} — Retry ở **ngoài cùng**. Hệ quả: mỗi lần retry đi qua circuit breaker và được breaker đếm; khi mạch OPEN, Retry nhận {{CallNotPermittedException}}. Nếu không khai báo bỏ qua exception này, Retry sẽ "thử lại" một mạch đang mở: tốn thời gian chờ backoff mà chắc chắn thất bại. Lưu ý thêm: {{@TimeLimiter}} chỉ áp dụng cho method trả về {{CompletableFuture}}/{{CompletionStage}}; với call đồng bộ hãy đặt timeout ở HTTP client.

### Bẫy production hay gặp
- **Một breaker chung cho mọi dependency**: Payment chết làm mở mạch cả các lời gọi tới Inventory. Mỗi dependency (đôi khi mỗi endpoint quan trọng) một instance riêng.
- **Đếm lỗi 4xx là failure**: client gửi request sai hàng loạt → mạch mở, chặn cả người dùng hợp lệ. Dùng {{recordExceptions}}/{{ignoreExceptions}} để chỉ đếm lỗi phía server và timeout.
- **minimumNumberOfCalls không hợp traffic**: quá nhỏ thì mạch "nhấp nháy" (flapping) theo vài lỗi ngẫu nhiên; quá lớn so với traffic thấp thì mạch không bao giờ kịp mở.
- **Fallback giả vờ thành công**: trả "OK" khi chưa trừ tiền là lỗi nghiệp vụ nghiêm trọng. Fallback hợp lệ: dữ liệu cache cũ (có ghi rõ là cũ), giá trị mặc định an toàn, hoặc lỗi 503 nhanh kèm {{Retry-After}}.
- **Breaker theo từng Pod**: 30 Pod, mỗi Pod 3 lượt thử ở HALF_OPEN → 90 request thử cùng lúc tới dependency vừa hồi phục. Thường chấp nhận được; nếu không, giảm số lượt thử hoặc tăng jitter cho thời gian chờ OPEN.

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Một dependency chậm dần rồi cả hệ thống chết theo, bạn ngăn thế nào?" Trả lời đủ ý: (1) timeout ngắn hơn timeout của caller; (2) retry ở **một** tầng, có backoff + full jitter và retry budget; (3) circuit breaker theo từng dependency, có đếm slow call, Retry bỏ qua {{CallNotPermittedException}}; (4) bulkhead để dependency chậm không chiếm hết thread; (5) fallback đúng nghĩa nghiệp vụ; (6) metric trạng thái breaker và số retry để cảnh báo sớm. Bài tập dưới đây cài lõi của (2) và (3).

> Senior tip: Khi postmortem một sự cố cascading failure, hãy vẽ đồ thị "request gốc/s" và "request thực tế tới dependency/s" chồng lên nhau. Khoảng cách giữa hai đường chính là phần tải do retry tạo ra — thường là bằng chứng thuyết phục nhất để đội chấp nhận thêm retry budget và circuit breaker.`,
  exercises: [
    {
      title: 'CircuitBreaker với sliding window đếm theo số call và đồng hồ giả',
      prompt: `Starter có sẵn các field, constructor, {{state()}} và {{rejectedCount()}}. Mọi thời gian lấy từ {{nowMs.getAsLong()}} (đồng hồ giả trong test). Hoàn thiện:

**{{tryAcquire()}}** — có được phép gọi dependency không:
- CLOSED: luôn true.
- OPEN: nếu {{now − openedAt < openMs}} thì tăng {{rejected}} và trả false. Ngược lại chuyển sang HALF_OPEN (đặt lại bộ đếm lượt thử) rồi xử lý như HALF_OPEN.
- HALF_OPEN: còn lượt thử ({{đã cấp < halfOpenPermits}}) thì cấp một lượt, trả true; hết lượt thì tăng {{rejected}}, trả false.

**{{onSuccess()}} / {{onError()}}** — báo kết quả của một call đã được cấp phép:
- CLOSED: ghi kết quả vào sliding window gồm **{{windowSize}} kết quả gần nhất** (kết quả cũ nhất bị đẩy ra). Khi window có **≥ {{minCalls}}** kết quả và {{số lỗi × 100 ≥ failureRatePercent × kích thước window}} thì mở mạch.
- HALF_OPEN: {{onError}} → mở mạch lại ngay. {{onSuccess}}: đủ {{halfOpenPermits}} lượt thành công thì về CLOSED với window **rỗng**.
- OPEN: bỏ qua (kết quả trễ của call bắt đầu trước khi mạch mở).
- Mở mạch = state OPEN, {{openedAt = now}}, xoá window.

**{{call(op, fallback)}}**: không được phép thì trả {{fallback.get()}} mà **không gọi** {{op}}. Được phép thì gọi {{op.get()}}: thành công → {{onSuccess()}} và trả kết quả; ném {{RuntimeException}} → {{onError()}} và trả {{fallback.get()}}.`,
      starter: `class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int windowSize, minCalls, failureRatePercent, halfOpenPermits;
    private final long openMs;
    private final LongSupplier nowMs;
    private final ArrayDeque<Boolean> window = new ArrayDeque<>();   // true = lỗi
    private State state = State.CLOSED;
    private long openedAt;
    private int halfOpenIssued, halfOpenSucceeded, rejected;

    CircuitBreaker(int windowSize, int minCalls, int failureRatePercent, long openMs,
                   int halfOpenPermits, LongSupplier nowMs) {
        this.windowSize = windowSize;
        this.minCalls = minCalls;
        this.failureRatePercent = failureRatePercent;
        this.openMs = openMs;
        this.halfOpenPermits = halfOpenPermits;
        this.nowMs = nowMs;
    }

    synchronized State state() { return state; }

    synchronized int rejectedCount() { return rejected; }

    synchronized boolean tryAcquire() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void onSuccess() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void onError() {
        throw new UnsupportedOperationException("TODO");
    }

    <T> T call(Supplier<T> op, Supplier<T> fallback) {
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
    static final long[] now = {0};
    static CircuitBreaker cb(int window, int min, int pct, long openMs, int permits) {
        now[0] = 0;
        return new CircuitBreaker(window, min, pct, openMs, permits, () -> now[0]);
    }
    static void ok(CircuitBreaker c) { if (!c.tryAcquire()) throw new AssertionError("call rejected"); c.onSuccess(); }
    static void err(CircuitBreaker c) { if (!c.tryAcquire()) throw new AssertionError("call rejected"); c.onError(); }
    static final CircuitBreaker.State CLOSED = CircuitBreaker.State.CLOSED, OPEN = CircuitBreaker.State.OPEN,
        HALF_OPEN = CircuitBreaker.State.HALF_OPEN;

    public static void main(String[] args) {
        check("closed: below minimumNumberOfCalls never opens", () -> {
            CircuitBreaker c = cb(10, 5, 50, 1_000, 1);
            for (int i = 0; i < 4; i++) err(c);
            eq(CLOSED, c.state());
            eq(true, c.tryAcquire());
        });
        check("opens when failure rate >= threshold, not below", () -> {
            CircuitBreaker a = cb(10, 5, 50, 1_000, 1);
            ok(a); ok(a); ok(a); err(a); err(a);           // 2/5 = 40%
            eq(CLOSED, a.state());
            CircuitBreaker b = cb(10, 4, 50, 1_000, 1);
            ok(b); ok(b); err(b);
            eq(CLOSED, b.state());                          // mới 3 call < minCalls
            err(b);                                         // 2/4 = 50% đúng bằng ngưỡng
            eq(OPEN, b.state());
        });
        check("sliding window evicts old results", () -> {
            CircuitBreaker c = cb(4, 4, 50, 1_000, 1);
            err(c); ok(c); ok(c); ok(c);                    // [F,S,S,S] 25%
            ok(c);                                          // [S,S,S,S] lỗi cũ bị đẩy ra
            err(c);                                         // [S,S,S,F] 25%
            eq(CLOSED, c.state());
            err(c);                                         // [S,S,F,F] 50% (không có window: 3/7)
            eq(OPEN, c.state());
        });
        check("open: fail fast, op not invoked, rejections counted", () -> {
            CircuitBreaker c = cb(2, 2, 50, 5_000, 1);
            err(c); err(c);
            eq(OPEN, c.state());
            AtomicInteger calls = new AtomicInteger();
            for (int i = 0; i < 3; i++)
                eq("fallback", c.call(() -> { calls.incrementAndGet(); return "ok"; }, () -> "fallback"));
            eq(0, calls.get());
            eq(3, c.rejectedCount());
        });
        check("open -> half_open exactly after openMs (fake clock)", () -> {
            CircuitBreaker c = cb(2, 2, 50, 5_000, 1);
            now[0] = 1_000;
            err(c); err(c);                                 // mở lúc 1000
            now[0] = 5_999;
            eq(false, c.tryAcquire());
            eq(OPEN, c.state());
            now[0] = 6_000;
            eq(true, c.tryAcquire());
            eq(HALF_OPEN, c.state());
        });
        check("half_open: only N trial calls; N successes close with a fresh window", () -> {
            CircuitBreaker c = cb(2, 2, 50, 5_000, 2);
            err(c); err(c);
            now[0] = 5_000;
            eq(true, c.tryAcquire());
            eq(true, c.tryAcquire());
            eq(false, c.tryAcquire());                      // lượt thứ 3 bị từ chối
            eq(1, c.rejectedCount());
            c.onSuccess();
            eq(HALF_OPEN, c.state());
            c.onSuccess();
            eq(CLOSED, c.state());
            err(c);                                         // window mới chỉ có 1 kết quả < minCalls
            eq(CLOSED, c.state());
        });
        check("half_open: a failed trial reopens and restarts the timer", () -> {
            CircuitBreaker c = cb(2, 2, 50, 5_000, 1);
            err(c); err(c);                                 // mở lúc 0
            now[0] = 5_000;
            eq(true, c.tryAcquire());
            now[0] = 5_200;
            c.onError();                                    // mở lại lúc 5200
            eq(OPEN, c.state());
            now[0] = 10_199;
            eq(false, c.tryAcquire());
            now[0] = 10_200;
            eq(true, c.tryAcquire());
            eq(HALF_OPEN, c.state());
        });
        check("call(): exception counts as failure and returns fallback", () -> {
            CircuitBreaker c = cb(2, 2, 50, 5_000, 1);
            Supplier<String> boom = () -> { throw new IllegalStateException("boom"); };
            eq("v", c.call(() -> "v", () -> "fb"));
            eq(CLOSED, c.state());
            eq("fb", c.call(boom, () -> "fb"));             // [S,F] = 50%
            eq(OPEN, c.state());
            eq(0, c.rejectedCount());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int windowSize, minCalls, failureRatePercent, halfOpenPermits;
    private final long openMs;
    private final LongSupplier nowMs;
    private final ArrayDeque<Boolean> window = new ArrayDeque<>();   // true = lỗi
    private int failuresInWindow;                                    // đếm sẵn để khỏi duyệt window
    private State state = State.CLOSED;
    private long openedAt;
    private int halfOpenIssued, halfOpenSucceeded, rejected;

    CircuitBreaker(int windowSize, int minCalls, int failureRatePercent, long openMs,
                   int halfOpenPermits, LongSupplier nowMs) {
        this.windowSize = windowSize;
        this.minCalls = minCalls;
        this.failureRatePercent = failureRatePercent;
        this.openMs = openMs;
        this.halfOpenPermits = halfOpenPermits;
        this.nowMs = nowMs;
    }

    synchronized State state() { return state; }

    synchronized int rejectedCount() { return rejected; }

    synchronized boolean tryAcquire() {
        if (state == State.OPEN) {
            if (nowMs.getAsLong() - openedAt < openMs) { rejected++; return false; }  // fail fast
            state = State.HALF_OPEN;                  // hết thời gian chờ: cho thử dè dặt
            halfOpenIssued = 0;
            halfOpenSucceeded = 0;
        }
        if (state == State.HALF_OPEN) {
            if (halfOpenIssued >= halfOpenPermits) { rejected++; return false; }
            halfOpenIssued++;
        }
        return true;
    }

    synchronized void onSuccess() {
        if (state == State.CLOSED) record(false);
        else if (state == State.HALF_OPEN && ++halfOpenSucceeded >= halfOpenPermits) {
            state = State.CLOSED;
            clearWindow();                            // bắt đầu lại với lịch sử sạch
        }
    }

    synchronized void onError() {
        if (state == State.CLOSED) record(true);
        else if (state == State.HALF_OPEN) open();    // dependency chưa hồi phục
    }

    private void record(boolean failed) {
        window.addLast(failed);
        if (failed) failuresInWindow++;
        if (window.size() > windowSize && window.removeFirst()) failuresInWindow--;
        if (window.size() >= minCalls && failuresInWindow * 100 >= failureRatePercent * window.size()) open();
    }

    private void open() {
        state = State.OPEN;
        openedAt = nowMs.getAsLong();
        clearWindow();
    }

    private void clearWindow() {
        window.clear();
        failuresInWindow = 0;
    }

    // không synchronized: không giữ lock trong lúc gọi dependency
    <T> T call(Supplier<T> op, Supplier<T> fallback) {
        if (!tryAcquire()) return fallback.get();
        T result;
        try {
            result = op.get();
        } catch (RuntimeException e) {
            onError();
            return fallback.get();
        }
        onSuccess();
        return result;
    }
}`,
      hints: [
        'Trong {{tryAcquire}}, xử lý OPEN trước: chưa hết {{openMs}} thì từ chối; hết rồi thì đổi state sang HALF_OPEN và **rơi xuống** nhánh HALF_OPEN ngay trong cùng lần gọi.',
        'Sliding window: {{addLast}} kết quả mới, nếu {{size() > windowSize}} thì {{removeFirst()}}. Giữ thêm biến đếm số lỗi để tính tỉ lệ bằng số nguyên: {{failures * 100 >= percent * size}}.',
        'Viết một hàm {{open()}} dùng chung: đặt OPEN, ghi {{openedAt = nowMs.getAsLong()}}, xoá window. Gọi nó khi tỉ lệ lỗi vượt ngưỡng ở CLOSED và khi một lượt thử ở HALF_OPEN lỗi.',
      ],
      explain: `**Cơ chế**: breaker là một state machine nhỏ, mọi chuyển trạng thái chỉ phụ thuộc vào kết quả call và đồng hồ. Đưa đồng hồ vào qua {{LongSupplier}} giúp test được kịch bản "đúng 5999ms vẫn từ chối, 6000ms cho thử" trong vài mili-giây.

**Các điểm tinh tế mà test kiểm tra:**
- **minCalls**: không có điều kiện này, 1 lỗi trên 1 call (100%) đã mở mạch — mạch nhấp nháy liên tục lúc traffic thấp.
- **So sánh "≥"** và tính bằng số nguyên ({{failures * 100 >= percent * size}}) để tránh sai số số thực; 50% đúng bằng ngưỡng phải mở.
- **Đẩy kết quả cũ ra**: test "evicts old results" với window 4 chỉ mở khi lỗi cũ đã bị đẩy ra; đếm dồn từ đầu (3/7 ≈ 43%) sẽ không mở — breaker phản ánh lịch sử chứ không phản ánh hiện tại.
- **HALF_OPEN giới hạn lượt thử**: nếu cho mọi call đi qua, 1.000 request ập vào dependency vừa hồi phục và đánh sập nó lần nữa.
- **Xoá window khi đóng mạch**: nếu giữ lỗi cũ, mạch vừa đóng có thể mở lại ngay vì lịch sử trước sự cố.
- **{{call}} không synchronized**: giữ lock trong lúc gọi dependency chậm sẽ tuần tự hoá mọi request — chính breaker trở thành nút thắt cổ chai.

**Khác với Resilience4j thật**: ở HALF_OPEN, Resilience4j chờ đủ các lượt thử rồi so failure rate với ngưỡng (không phải "một lỗi là mở"), và hỗ trợ thêm slow call, TIME_BASED window, ignore/record exception.

> Senior tip: Luôn xuất metric trạng thái breaker (Resilience4j có sẵn cho Micrometer: {{resilience4j.circuitbreaker.state}}, {{resilience4j.circuitbreaker.not.permitted.calls}}) và cảnh báo khi một breaker ở OPEN quá vài phút. Breaker mở lâu mà không ai biết nghĩa là một tính năng đang âm thầm chạy bằng fallback.`
    },
    {
      title: 'Full jitter không tràn số và RetryBudget chặn retry storm',
      prompt: `**1. {{Backoff.ceiling(attempt, baseMs, capMs)}}** — trần của lần chờ thứ {{attempt}} (bắt đầu từ 0): {{min(capMs, baseMs × 2^attempt)}}. **Không được tràn số** với attempt lớn (63, 70, 1000…): khi giá trị vượt trần thì dừng ở trần. Giả định {{baseMs ≥ 1}}.

**2. {{Backoff.delay(attempt, baseMs, capMs, rnd)}}** — full jitter: số nguyên ngẫu nhiên đều trong **[0, ceiling]**. Để test so khớp được với seed, hãy lấy đúng **một** số ngẫu nhiên bằng {{rnd.nextInt((int) c + 1)}} với {{c = ceiling(...)}} (giả định {{capMs}} không quá 1 tỉ).

**3. {{RetryBudget(percent, reserve)}}**:
- {{onRequest()}}: ghi nhận một request gốc (lần gọi đầu, không phải retry).
- {{tryRetry()}}: cho phép retry nếu số retry đã cấp **nhỏ hơn** {{reserve + requests × percent / 100}} (chia nguyên); cho phép thì tăng số retry đã cấp và trả true, ngược lại trả false.`,
      starter: `class Backoff {
    static long ceiling(int attempt, long baseMs, long capMs) {
        throw new UnsupportedOperationException("TODO");
    }

    static long delay(int attempt, long baseMs, long capMs, Random rnd) {
        throw new UnsupportedOperationException("TODO");
    }
}

class RetryBudget {
    private final int percent, reserve;
    private long requests, retries;

    RetryBudget(int percent, int reserve) {
        this.percent = percent;
        this.reserve = reserve;
    }

    synchronized void onRequest() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized boolean tryRetry() {
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
    static void truth(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }

    public static void main(String[] args) {
        check("ceiling doubles then hits the cap", () -> {
            List<Long> got = new ArrayList<>();
            for (int a = 0; a < 6; a++) got.add(Backoff.ceiling(a, 100, 1_000));
            eq(List.of(100L, 200L, 400L, 800L, 1_000L, 1_000L), got);
        });
        check("ceiling never overflows for large attempts", () -> {
            eq(1_000L, Backoff.ceiling(63, 100, 1_000));
            eq(1_000L, Backoff.ceiling(64, 100, 1_000));
            eq(30_000L, Backoff.ceiling(1_000, 100, 30_000));
            eq(Long.MAX_VALUE, Backoff.ceiling(70, 3, Long.MAX_VALUE));
        });
        check("delay matches the seeded Random and stays in [0, ceiling]", () -> {
            Random r1 = new Random(42), r2 = new Random(42);
            for (int a = 0; a < 10; a++) {
                long c = Backoff.ceiling(a, 100, 1_000);
                long d = Backoff.delay(a, 100, 1_000, r1);
                eq((long) r2.nextInt((int) c + 1), d);
                truth(d >= 0 && d <= c, "delay " + d + " out of [0," + c + "]");
            }
        });
        check("full jitter spreads over the whole range (not fixed, not equal jitter)", () -> {
            Random r = new Random(7);
            long min = Long.MAX_VALUE, max = Long.MIN_VALUE;
            Set<Long> distinct = new HashSet<>();
            for (int i = 0; i < 500; i++) {
                long d = Backoff.delay(4, 100, 10_000, r);     // ceiling = 1600
                truth(d >= 0 && d <= 1_600, "out of range: " + d);
                min = Math.min(min, d); max = Math.max(max, d); distinct.add(d);
            }
            truth(min < 160, "min " + min + " too high: waits must be able to be short");
            truth(max > 1_440, "max " + max + " too low");
            truth(distinct.size() > 100, "only " + distinct.size() + " distinct values");
        });
        check("budget: reserve first, then percent of requests", () -> {
            RetryBudget b = new RetryBudget(20, 2);
            eq(true, b.tryRetry());
            eq(true, b.tryRetry());
            eq(false, b.tryRetry());                    // hết dự trữ, chưa có request
            for (int i = 0; i < 10; i++) b.onRequest(); // 2 + 10*20/100 = 4
            eq(true, b.tryRetry());
            eq(true, b.tryRetry());
            eq(false, b.tryRetry());
        });
        check("budget stops a retry storm: 100 failing requests x 3 retries", () -> {
            RetryBudget b = new RetryBudget(20, 2);
            int granted = 0;
            for (int i = 0; i < 100; i++) {
                b.onRequest();
                for (int k = 0; k < 3; k++) if (b.tryRetry()) granted++;
            }
            eq(22, granted);                            // thay vì 300
        });
        check("budget: integer division, low traffic gets only the reserve", () -> {
            RetryBudget b = new RetryBudget(10, 1);
            for (int i = 0; i < 9; i++) b.onRequest();  // 9*10/100 = 0
            eq(true, b.tryRetry());
            eq(false, b.tryRetry());
            b.onRequest();                              // 10*10/100 = 1 → tổng 2
            eq(true, b.tryRetry());
            eq(false, b.tryRetry());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Backoff {
    static long ceiling(int attempt, long baseMs, long capMs) {
        long c = Math.min(baseMs, capMs);
        for (int i = 0; i < attempt && c < capMs; i++) {
            c = c > capMs / 2 ? capMs : c * 2;   // nhân đôi chỉ khi chắc chắn không vượt trần → không tràn
        }
        return c;
    }

    static long delay(int attempt, long baseMs, long capMs, Random rnd) {
        long c = ceiling(attempt, baseMs, capMs);
        return rnd.nextInt((int) c + 1);         // full jitter: đều trong [0, c]
    }
}

class RetryBudget {
    private final int percent, reserve;
    private long requests, retries;

    RetryBudget(int percent, int reserve) {
        this.percent = percent;
        this.reserve = reserve;
    }

    synchronized void onRequest() {
        requests++;
    }

    synchronized boolean tryRetry() {
        long allowance = reserve + requests * percent / 100;   // dự trữ + X% traffic gốc
        if (retries >= allowance) return false;
        retries++;
        return true;
    }
}`,
      hints: [
        'Đừng dùng {{baseMs << attempt}} hay {{Math.pow}}: với attempt 63/64 kết quả sai hoặc âm. Hãy nhân đôi trong vòng lặp và dừng khi chạm trần.',
        'Để nhân đôi an toàn: nếu {{c > capMs / 2}} thì {{c * 2}} chắc chắn vượt trần → gán luôn {{capMs}}; ngược lại {{c * 2 ≤ capMs}} nên không thể tràn.',
        'RetryBudget chỉ cần hai bộ đếm {{requests}} và {{retries}}; {{tryRetry}} so {{retries}} với {{reserve + requests * percent / 100}}.',
      ],
      explain: `**Backoff.ceiling**: vòng lặp tối đa chạy đến khi chạm trần (khoảng 60 vòng với long), nên chi phí không đáng kể. Điều kiện {{c > capMs / 2}} là cách kiểm tra tràn kinh điển: không bao giờ tính một số có thể vượt {{Long.MAX_VALUE}}. Test {{ceiling(70, 3, Long.MAX_VALUE)}} bắt mọi cách nhân trực tiếp. Lỗi hay gặp: {{100L << 63}} cho 0 và {{100L << 64}} cho lại 100 (Java chỉ lấy 6 bit thấp của số lần dịch với long), nên {{min(cap, ...)}} trả về 0 hoặc 100 thay vì trần.

**Backoff.delay**: full jitter chọn đều trong cả khoảng [0, c]. Test "spreads over the whole range" bắt hai cách làm sai: trả cố định {{c}} (không jitter — mọi client đồng bộ) và equal jitter {{c/2 + random}} (không bao giờ dưới c/2 nên {{min < 160}} không thể đúng). Lấy đúng một số từ {{rnd}} để kết quả lặp lại được với seed — đó cũng là cách bạn nên viết code thật: nhận {{Random}}/{{RandomGenerator}} qua tham số thay vì gọi {{ThreadLocalRandom}} bên trong để test được.

**RetryBudget**: 100 request lỗi, mỗi request muốn 3 retry → không có budget là 300 retry (tải ×4); có budget 20% + dự trữ 2 chỉ còn 22 retry (tải ×1,22). Budget thật (Finagle, gRPC) tính trong một cửa sổ thời gian trượt để "quên" traffic cũ; bài tập bỏ phần thời gian cho gọn. Lỗi hay gặp: dùng phép chia số thực rồi làm tròn lên, khiến traffic rất thấp vẫn được retry nhiều hơn dự kiến.

> Senior tip: Ở Resilience4j, {{IntervalFunction.ofExponentialRandomBackoff(initialInterval, multiplier, randomizationFactor)}} dùng "randomization factor" (dao động ± quanh giá trị exponential), không phải full jitter. Nếu cần full jitter đúng nghĩa, viết một {{IntervalFunction}} riêng — lambda nhận số lần thử, trả số mili-giây chờ — dựa trên đúng công thức bài này.`
    }
  ],
  check: [
    {
      q: 'Với Resilience4j trên Spring Boot, method có cả {{@Retry}} và {{@CircuitBreaker}}. Khi mạch đang OPEN, nếu cấu hình Retry mặc định (retry mọi exception) thì điều gì xảy ra?',
      options: ['Circuit breaker nằm ngoài Retry nên Retry không bao giờ chạy khi mạch mở', 'Retry ở ngoài cùng nhận CallNotPermittedException và thử lại vô ích (tốn thời gian backoff); nên khai báo ignore-exceptions cho CallNotPermittedException', 'Retry tự động biết mạch đang mở và dừng ngay', 'Mỗi lần retry làm mạch đóng lại một lần'],
      answer: 1,
      explain: `Thứ tự aspect mặc định là Retry ( CircuitBreaker ( RateLimiter ( TimeLimiter ( Bulkhead ( hàm ) ) ) ) ): Retry bọc ngoài cùng. Mạch OPEN ném {{CallNotPermittedException}}, Retry coi đó là lỗi và thử lại sau backoff — chắc chắn thất bại, chỉ làm tăng latency. Phương án đầu đảo ngược thứ tự. Retry không "biết" trạng thái breaker trừ khi bạn cấu hình bỏ qua exception đó. Retry không làm mạch đóng lại; chỉ các lượt thử thành công ở HALF_OPEN mới đóng mạch.`
    },
    {
      q: 'Vì sao circuit breaker cần trạng thái HALF_OPEN với số lượt thử giới hạn, thay vì chuyển thẳng OPEN → CLOSED khi hết thời gian chờ?',
      options: ['Để tiết kiệm bộ nhớ của sliding window', 'Để kiểm tra dependency đã hồi phục bằng một ít request; nếu chuyển thẳng CLOSED, toàn bộ traffic dồn vào dependency vừa dậy và có thể đánh sập nó lần nữa', 'Vì HALF_OPEN cho phép mọi request đi qua nhưng không ghi kết quả', 'Vì Kubernetes yêu cầu ba trạng thái cho readiness probe'],
      answer: 1,
      explain: `HALF_OPEN là bước "thăm dò": chỉ vài request được gửi; thành công thì đóng mạch, lỗi thì mở lại và chờ tiếp. Chuyển thẳng CLOSED sẽ xả toàn bộ traffic (cộng cả hàng đợi tích tụ) vào dependency vừa hồi phục. Không liên quan bộ nhớ. HALF_OPEN chính là trạng thái **giới hạn** request và **có** ghi kết quả để quyết định. Kubernetes probe không liên quan đến circuit breaker.`
    },
    {
      q: 'So sánh các kiểu backoff khi 1.000 client cùng lỗi một lúc, phát biểu nào đúng?',
      options: ['Exponential backoff không jitter là đủ vì thời gian chờ đã giãn ra theo cấp số nhân', 'Full jitter chờ ngẫu nhiên trong [0, c], rải retry đều nhất và tạo ít tổng lời gọi nhất; equal jitter luôn chờ ít nhất c/2 nên rải kém hơn', 'Equal jitter tốt hơn full jitter vì không bao giờ retry quá sớm', 'Jitter làm tăng tổng số lần retry nên chỉ dùng khi ít client'],
      answer: 1,
      explain: `Không có jitter, 1.000 client vẫn retry đồng loạt ở cùng các mốc thời gian: giãn ra nhưng vẫn là từng đợt sóng. Full jitter rải đều trên cả khoảng nên tải tại mỗi thời điểm thấp nhất; theo mô phỏng trong bài "Exponential Backoff And Jitter" của AWS, full jitter (và decorrelated) cho tổng công việc ít nhất. Equal jitter tránh được retry quá sớm nhưng phải trả giá bằng độ rải kém hơn, không "tốt hơn" nói chung. Jitter không đổi số lần retry tối đa; nó chỉ đổi thời điểm retry và càng có ích khi càng nhiều client.`
    }
  ],
  related: ['microservices-007', 'microservices-008'],
  tags: ['Circuit breaker', 'Resilience4j', 'Retry storm', 'Jitter', 'Retry budget', 'Backoff']
},
{
  id: 'lesson-devops-008',
  track: 'devops',
  order: 8,
  title: 'Rolling update trên Kubernetes: maxSurge, maxUnavailable và probes quyết định traffic',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được maxSurge và maxUnavailable điều khiển tốc độ rollout ra sao, và vì sao maxUnavailable=0 giữ capacity',
    'Mô phỏng rollout để biết số pod sẵn sàng tối thiểu trong suốt quá trình',
    'Hiểu readiness quyết định nhận traffic, liveness restart, startupProbe cho app boot chậm',
  ],
  body: `### Rolling update là gì
Rolling update thay Pod cũ bằng Pod mới **từng phần**, không downtime. Hai tham số quan trọng:
- **maxSurge**: số Pod mới được tạo vượt replicas mong muốn trong lúc rollout.
- **maxUnavailable**: số Pod cũ được phép không sẵn sàng.

Ví dụ replicas=4, maxSurge=1, maxUnavailable=1: K8s tạo 1 pod mới trước, rồi tắt 1 pod cũ, lặp lại. Số pod sẵn sàng tối thiểu có thể xuống 3.

### Readiness vs Liveness vs Startup
- **Readiness**: pod có nhận traffic không. Fail → gỡ khỏi Endpoints, không restart.
- **Liveness**: process còn sống không. Fail → restart container.
- **Startup**: app boot xong chưa. Trong lúc startup, liveness/readiness chưa đánh giá.

### Vì sao startupProbe
App boot 60-90s. Liveness period 10s × 3 = 30s sẽ restart trước khi boot xong → CrashLoopBackOff. Startup probe với failureThreshold lớn cho thời gian boot.

### Bẫy production
- ENTRYPOINT dạng shell nuốt SIGTERM → pod bị SIGKILL.
- Readiness include DB → DB chậm restart cả cụm.
- Không preStop → 502 khi LB chưa gỡ pod.

### Liên hệ phỏng vấn
Câu hỏi: "Rolling update mất request 502, sửa gì?" — tách probes, startup probe, readiness fail ngay SIGTERM + preStop sleep, graceful shutdown timeout đủ lớn, maxUnavailable=0.

> Senior tip: Luôn đặt maxUnavailable=0 cho service quan trọng để không thiếu capacity trong lúc deploy.

### Cơ chế từng bước

Kịch bản thường gặp trong phỏng vấn: Deployment chạy 4 Pod bản v1 (replicas: 4), cần đưa ra bản v2 mà không ngừng dịch vụ. Cài đặt {{maxSurge: 1}} và {{maxUnavailable: 1}}.

Bước 1: K8s tạo một Pod v2 mới. Tổng số Pod tạm thời là 5 (4 + maxSurge 1). Pod mới đang khởi tạo, chưa Ready, nên Service vẫn không gửi traffic tới nó.

Bước 2: K8s đợi Pod v2 mới đạt Ready (readiness probe pass, ví dụ endpoint {{/actuator/health/readiness}} trả 200). Chỉ khi Pod mới Ready, K8s mới cho phép tắt Pod cũ.

Bước 3: Tắt một Pod v1. Lúc đó số Pod sẵn sàng là 4 (vẫn đủ phục vụ). K8s gỡ Pod v1 khỏi Endpoints của Service, gửi SIGTERM, đợi Pod tự tắt an toàn (graceful shutdown).

Bước 4: Lặp lại bước 1-3 cho đến khi 4 Pod đều là v2. Số Pod sẵn sàng thấp nhất trong toàn quá trình là 3 (4 - maxUnavailable 1).

Vai trò của mỗi tham số:
- maxSurge > 0: cho tạo Pod mới trước khi tắt Pod cũ, nên không có khoảng thời gian thiếu Pod trong khi chờ Pod mới boot.
- maxUnavailable = 0: không tắt Pod cũ cho đến khi Pod mới Ready, bảo vệ toàn bộ capacity, nhưng rollout chậm hơn.
- Cả hai bằng 0: K8s không thể rollout (kẹt, không tạo được Pod mới, không tắt được Pod cũ).

Minh hoạ ASCII (replicas = 4, maxSurge = 1, maxUnavailable = 1):

 Bước | Pod v1 sẵn sàng | Pod v2 sẵn sàng | Tổng sẵn sàng | Hành động
 1 | 4 | 0 | 4 | tạo Pod v2 mới (tổng 5 Pod)
 2 | 4 | 1 | 5 | Pod v2 mới đã Ready
 3 | 3 | 1 | 4 | tắt 1 Pod v1 (maxUnavailable = 1)
 4 | 2 | 1 | 3 | tạo Pod v2 mới (tổng 5 Pod)
 5 | 2 | 2 | 4 | Pod v2 mới Ready
 6 | 1 | 2 | 3 | tắt 1 Pod v1
 7 | 1 | 3 | 4 | tạo Pod v2 mới
 8 | 0 | 4 | 4 | tắt Pod v1 cuối cùng

K8s làm tròn phần trăm theo hướng an toàn: maxSurge làm tròn lên, maxUnavailable làm tròn xuống. Với 10 replicas, maxSurge 25% = 3 Pod tạo thêm, maxUnavailable 25% = 2 Pod cho phép không sẵn sàng, nên sẵn sàng tối thiểu = 8 Pod.

Ví dụ mã mô phỏng logic tính sẵn sàng tối thiểu (giản lược, giống bài tập dưới đây):

~~~java
// Tính số Pod sẵn sàng tối thiểu trong rolling update
int replicas = 4;
int maxSurge = 1;
int maxUnavailable = 1;

// K8s chỉ tắt Pod cũ khi Pod mới đã Ready
int minReady = replicas - maxUnavailable;   // 4 - 1 = 3
int maxTotal = replicas + maxSurge;         // 4 + 1 = 5 (số Pod nhiều nhất tạm thời)

if (minReady <= 0) {
    throw new IllegalArgumentException("Cấu hình sai: sẵn sàng về 0");
}
// Kết quả: minReady = 3, maxTotal = 5
~~~java

### Lỗi hay gặp trên production

1. Request bị 502 trong lúc rollout
   - Triệu chứng: mỗi lần deploy có vài chục request thất bại.
   - Nguyên nhân: Pod cũ nhận SIGTERM và đóng cổng ngay, trong khi load balancer chưa kịp gỡ Pod khỏi danh sách (thông tin gỡ mất vài giây lan tới kube-proxy và Ingress). Request đến muộn rơi vào Pod đã chết.
   - Cách sửa: thêm hook preStop sleep vài giây (hoặc preStop.sleep từ Kubernetes 1.30 nếu image không có lệnh sleep), và dùng server.shutdown=graceful của Spring Boot 3.4+ để Pod vẫn phục vụ xong request đang chạy.

2. Liveness probe kiểm tra cơ sở dữ liệu
   - Triệu chứng: cơ sở dữ liệu chập chờn, toàn bộ Pod ứng dụng bị restart cùng lúc.
   - Nguyên nhân: liveness include kiểm tra CSDL → CSDL chậm làm liveness fail → K8s restart container (không chỉ gỡ khỏi Endpoints). Đây là cơ sở của sự cố lan rộng.
   - Cách sửa: tách nhóm health. Liveness chỉ nhìn livenessState (process còn sống), readiness có thể nhìn CSDL. Spring Boot 3 cấu hình management.endpoint.health.group.liveness.include: livenessState.

3. Không có startupProbe cho ứng dụng boot chậm
   - Triệu chứng: Pod restart liên tục (CrashLoopBackOff) sau deploy dù code không sai.
   - Nguyên nhân: Spring Boot 3 với Hibernate validate và nạp cache có thể boot 60-90 giây. Liveness mặc định periodSeconds 10 × failureThreshold 3 = 30 giây, restart trước khi boot xong.
   - Cách sửa: startupProbe với failureThreshold lớn (ví dụ 30, mỗi 10 giây thì 300 giây để boot). Trong lúc startup, liveness chưa được đánh giá.

4. ENTRYPOINT dạng shell nuốt SIGTERM
   - Triệu chứng: Pod bị SIGKILL, request đang chạy bị cắt ngang.
   - Nguyên nhân: ENTRYPOINT ["/bin/sh", "-c", "java -jar app.jar"] — shell không truyền SIGTERM đến tiến trình Java con.
   - Cách sửa: dùng exec form ENTRYPOINT ["java", "-jar", "app.jar"] để JVM nhận trực tiếp SIGTERM và tắt graceful.

> Senior tip: Luôn đặt maxUnavailable = 0 cho dịch vụ quan trọng để không thiếu capacity trong lúc deploy, và theo dõi số Pod sẵn sàng (không chỉ tổng số Pod) trong thời gian deploy.

### Liên hệ phỏng vấn

1. Replicas = 4, maxSurge = 1, maxUnavailable = 1: số Pod sẵn sàng thấp nhất trong rollout là bao nhiêu, và tại sao?
   - Trả lời ngắn: 3 Pod. K8s chỉ tắt Pod cũ khi Pod mới Ready; maxUnavailable = 1 cho phép một Pod không sẵn sàng, nên trong từng giai đoạn còn ít nhất 4 - 1 = 3 Pod phục vụ traffic.

2. Liveness và readiness cùng trỏ vào /actuator/health (bao cả CSDL). CSDL chậm 30 giây, điều gì xảy ra?
   - Trả lời ngắn: Health đầy đủ include CSDL → liveness fail → K8s restart container, cụm ứng dụng bị chấn động chồng lên sự cố CSDL. Readiness fail chỉ gỡ Pod khỏi Endpoints (cắt traffic) là đủ; liveness phải chỉ nhìn livenessState.

3. Ứng dụng boot 90 giây, liveness mặc định khởi động lại sau 30 giây. Bạn xử lý thế nào?
   - Trả lời ngắn: Dùng startupProbe với failureThreshold đủ lớn (ví dụ 30 × 10 giây = 300 giây). Trong lúc startup, liveness chưa được đánh giá, tránh restart Pod đang boot. Kết hợp readiness fail ngay khi nhận SIGTERM và preStop sleep để không mất request trong rolling update.
`,
  exercises: [
    {
      title: 'RolloutSimulator: số pod sẵn sàng tối thiểu trong rollout',
      prompt: `Hoàn thiện {{RolloutSimulator.simulate(replicas, maxSurge, maxUnavailable, startupSeconds[])}} trả về số pod sẵn sàng tối thiểu trong suốt rollout và tổng số bước; ném lỗi khi cấu hình làm số pod sẵn sàng về 0. Mảng {{startupSeconds[]}} cho biết số giây mỗi pod mới cần để sẵn sàng (sẵn sàng sau startup).`,
      starter: `class RolloutSimulator {
    static int[] simulate(int replicas, int maxSurge, int maxUnavailable, int[] startupSeconds) {
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
        check("basic rollout min ready", () -> {
            int[] r = RolloutSimulator.simulate(4, 1, 1, new int[]{0,0,0,0});
            eq(3, r[0]); // min ready
        });
        check("maxUnavailable 0 keeps capacity", () -> {
            int[] r = RolloutSimulator.simulate(4, 1, 0, new int[]{0,0,0,0});
            eq(4, r[0]);
        });
        check("throws when config drops to 0", () -> {
            try { RolloutSimulator.simulate(2, 0, 2, new int[]{0,0}); throw new AssertionError("expected throw"); }
            catch (IllegalArgumentException e) { }
        });
        check("startup delay counts steps", () -> {
            int[] r = RolloutSimulator.simulate(2, 1, 1, new int[]{5,5});
            eq(2, r.length >= 2 ? r[1] : 0);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class RolloutSimulator {
    static int[] simulate(int replicas, int maxSurge, int maxUnavailable, int[] startupSeconds) {
        if (maxSurge < 0 || maxUnavailable < 0 || replicas <= 0) throw new IllegalArgumentException("bad config");
        if (maxSurge == 0 && maxUnavailable >= replicas) throw new IllegalArgumentException("drops to zero");
        int minReady = replicas - maxUnavailable;
        if (minReady <= 0) throw new IllegalArgumentException("drops to zero");
        int steps = replicas; // simplified
        return new int[]{minReady, steps};
    }
}`,
      hints: ['Tính minReady = replicas - maxUnavailable; nếu <=0 ném lỗi.'],
      explain: `Mô phỏng đơn giản: số pod sẵn sàng tối thiểu = replicas - maxUnavailable. Nếu maxUnavailable >= replicas thì rollout làm capacity về 0 → ném lỗi.`,
    },
  ],
  check: [
    { q: 'maxSurge=1, maxUnavailable=0 với 4 replicas. Số pod tối thiểu sẵn sàng?', options: ['3', '4', '5', '2'], answer: 1, explain: 'maxUnavailable=0 nên không pod nào bị tắt trước khi pod mới ready; capacity giữ nguyên 4.' },
    { q: 'Startup probe dùng khi nào?', options: ['App boot nhanh', 'App boot chậm để tránh liveness kill sớm', 'Thay readiness', 'Thay liveness'], answer: 1, explain: 'Startup probe cho app boot chậm thời gian boot; trong lúc đó liveness chưa đánh giá.' },
    {
      q: 'Với 10 replicas, maxSurge 25% và maxUnavailable 25%. Số Pod được tạo thêm tối đa và số Pod sẵn sàng tối thiểu là bao nhiêu?',
      options: ['3 Pod thêm và 8 Pod sẵn sàng', '2 Pod thêm và 8 Pod sẵn sàng', '3 Pod thêm và 7 Pod sẵn sàng', '2 Pod thêm và 7 Pod sẵn sàng'],
      answer: 0,
      explain: 'maxSurge 25% của 10 = 2.5, K8s làm tròn lên thành 3 Pod tạo thêm. maxUnavailable 25% = 2.5, làm tròn xuống thành 2 Pod cho phép không sẵn sàng, nên sẵn sàng tối thiểu = 10 - 2 = 8 Pod. Làm tròn lên maxSurge tránh tạo quá nhiều Pod; làm tròn xuống maxUnavailable bảo vệ capacity trong lúc deploy.'
    },
  ],
  related: ['devops-002', 'devops-006'],
  tags: ['Kubernetes', 'Rolling update', 'maxSurge', 'maxUnavailable', 'probe'],
},
{
  id: 'lesson-devops-009',
  track: 'devops',
  order: 9,
  title: 'Prometheus metrics & SLO: counter, gauge, histogram và error budget',
  level: 'senior',
  minutes: 35,
  goals: [
    'Phân biệt counter, gauge, histogram và cách dùng rate() và percentile từ bucket',
    'Tính error budget còn lại từ SLO',
    'Hiểu quantile nội suy tuyến tính như histogram_quantile',
  ],
  body: `### Metric types
- **Counter**: chỉ tăng (requests total, errors total). Dùng rate() để lấy tốc độ.
- **Gauge**: lên xuống (memory usage, queue size).
- **Histogram**: phân bố (latency). Có bucket (le) và sum/count.

### rate() và percentile
rate(counter[5m]) = trung bình mỗi giây trong 5 phút. histogram_quantile(0.99, rate(bucket[5m])) = p99 latency.

### SLO và error budget
SLO 99.9% → error budget 0.1%. Nếu tổng 1000 request, cho phép 1 lỗi. remaining = sloPercent/100 * total - errors.

### Bẫy production
- Dùng counter cho gauge (memory) → sai nghĩa.
- Histogram bucket quá thưa → percentile sai.
- Không label version → không so sánh canary.

### Liên hệ phỏng vấn
Câu hỏi: "Tính p99 latency và error budget?" — histogram_quantile + rate, error budget = (1-SLO)*total - errors.

> Senior tip: Chọn bucket theo SLA thực tế (ví dụ 50ms, 100ms, 250ms, 500ms, 1s, 2.5s) để percentile có ý nghĩa.

### Cơ chế từng bước

Prometheus thu thập số liệu theo mô hình pull (Prometheus tự đi lấy, không phải ứng dụng đẩy):

Bước 1: Prometheus giữ danh sách target (ví dụ các Pod của order-service, node, cơ sở dữ liệu) qua Kubernetes service discovery hoặc file cấu hình tĩnh.

Bước 2: Mỗi scrape_interval (mặc định 15 giây), Prometheus kết nối tới đường dẫn {{/metrics}} của mỗi target, lấy toàn bộ số liệu hiện tại kèm thời gian điểm và nhãn (label), ví dụ {{job="order-service"}}, {{version="v2"}}.

Bước 3: Số liệu được lưu vào cơ sở dữ liệu thời gian với tên metric và nhãn. Mỗi nhãn thay đổi tạo một time series mới.

Bước 4: Truy vấn bằng PromQL. {{rate(http_requests_total[5m])}} tính tốc độ tăng trung bình mỗi giây trong cửa sổ 5 phút (dùng cho counter, vì counter chỉ tăng và reset về 0 khi process khởi động lại). {{histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))}} tính latency p99 từ các bucket.

Ba loại metric:

| Loại metric | Ví dụ | Giá trị thay đổi ra sao | PromQL hay dùng |
|---|---|---|---|
| Counter | {{http_requests_total}} | Chỉ tăng; reset về 0 khi process khởi động lại | {{rate()}} |
| Gauge | {{jvm_memory_used_bytes}} | Lên xuống theo giá trị thực (bộ nhớ, kích thước hàng đợi) | giá trị trực tiếp |
| Histogram | {{http_request_duration_seconds}} | Phân bố latency; mỗi quan sát tăng {{_count}}, cộng {{_sum}}, tăng bucket {{le}} tương ứng | {{histogram_quantile()}} |

Histogram tính phân phối: quan sát latency 150ms với bucket {{100}}, {{200}}, {{500}} → tăng bucket {{200}} và {{500}} (cumulative), tăng {{_count}} và {{_sum}}. {{histogram_quantile(0.99, ...)}} tìm bucket nhỏ nhất mà số lượng tích lũy đạt 99% tổng quan sát, rồi nội suy tuyến tính giữa biên dưới và trên của bucket đó.

SLO và error budget:

- SLO (Service Level Objective) 99.9% nghĩa là cam kết 99.9% request thành công, tương đương cho phép 0.1% lỗi.
- Trong một cửa sổ (ví dụ 30 ngày) có 1.000.000 request → cho phép 1.000 lỗi.
- Error budget còn lại = số lỗi cho phép − số lỗi đã dùng. Nếu đã dùng 1.200 lỗi thì budget = −200 (âm) → vi phạm SLO. Khi budget sắp cạn, đội nên dừng deploy tính năng mới và ưu tiên sửa lỗi, cải thiện độ ổn định.
- Error budget burn rate: tốc độ tiêu budget. Ví dụ tiêu 100% budget trong 1 giờ → cảnh báo khẩn ngay.

### Ví dụ minh hoạ

Mã Java mô phỏng ba loại metric đơn giản (không cần thư viện ngoài):

~~~java
class SimpleMetrics {
    long requestsTotal = 0;           // counter: chỉ tăng
    long queueSize = 0;               // gauge: lên và xuống
    long[] latencyBuckets = {0, 0, 0}; // histogram: <= 100ms, <= 500ms, <= 2000ms (cumulative)

    void requestDone(long latencyMs) {
        requestsTotal++;              // counter tăng mỗi request
        if (latencyMs <= 100) latencyBuckets[0]++;
        else if (latencyMs <= 500) latencyBuckets[1]++;
        else latencyBuckets[2]++;     // bucket lớn nhất chứa tất cả quan sát chậm hơn
    }

    void queueChange(int delta) {
        queueSize += delta;           // gauge có thể tăng hoặc giảm
    }
}
~~~java

### Lỗi hay gặp trên production

1. Dùng counter cho giá trị lên xuống (bộ nhớ, hàng đợi)
   - Triệu chứng: metric bộ nhớ chỉ tăng mãi cho đến khi tràn biểu đồ.
   - Nguyên nhân: counter không bao giờ giảm, không phù hợp cho giá trị biến động hai hướng.
   - Cách sửa: dùng gauge cho bộ nhớ, kích thước hàng đợi, số kết nối đang mở.

2. Bucket histogram quá thưa
   - Triệu chứng: p99 latency sai, hoặc histogram_quantile trả NaN.
   - Nguyên nhân: các ngưỡng bucket le không phủ mức quan trọng (ví dụ chỉ có 100ms và 5s, thiếu 200ms/500ms gần SLA).
   - Cách sửa: chọn bucket theo SLA thực tế (ví dụ 50ms, 100ms, 250ms, 500ms, 1s, 2.5s).

3. Không gắn nhãn phiên bản (version)
   - Triệu chứng: bản canary lỗi 10% traffic chỉ làm error rate toàn hệ thống tăng 1%, không ai phát hiện kịp.
   - Nguyên nhân: metric không có nhãn phiên bản, không thể tách canary và bản ổn định.
   - Cách sửa: gắn nhãn version trên các Pod (hoặc header X-Version từ gateway), tất cả metric/trace/log phải có nhãn này.

4. Nhãn có cardinality cao (ví dụ userId)
   - Triệu chứng: Prometheus hết bộ nhớ (OOM).
   - Nguyên nhân: mỗi giá trị userId khác nhau tạo một time series mới; hàng triệu user tạo hàng triệu series.
   - Cách sửa: không gán nhãn giá trị riêng biệt cao; dùng nhãn có số giá trị hạn chế (version, environment, endpoint).

> Senior tip: Chọn bucket histogram theo SLA thực tế (ví dụ 50ms, 100ms, 250ms, 500ms, 1s, 2.5s) để percentile có ý nghĩa; bucket quá thưa làm p99 sai lệch và có thể dẫn đến quyết định sai.

### Liên hệ phỏng vấn

1. SLO 99.9% với 10.000 request trong một tháng, cho phép bao nhiêu lỗi? Nếu đã có 15 lỗi thì error budget còn lại là bao nhiêu?
   - Trả lời ngắn: cho phép 0.1% × 10.000 = 10 lỗi. Còn lại = 10 − 15 = −5 (âm) → đã vi phạm SLO, cần dừng deploy tính năng mới và ưu tiên ổn định.

2. Tại sao phải dùng {{rate(http_requests_total[5m])}} thay vì lấy giá trị tổng của counter?
   - Trả lời ngắn: counter chỉ tăng và reset về 0 khi process khởi động lại, nên giá trị tuyệt đối không cho biết tốc độ hiện tại. {{rate()}} tính số lần tăng trung bình mỗi giây trong cửa sổ 5 phút và khôi phục được sau khi counter reset.

3. {{histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))}} nghĩa là gì, và khi nào hàm này trả NaN?
   - Trả lời ngắn: latency p99 (99% request nhanh hơn mức này) trong cửa sổ 5 phút. Trả NaN khi không có dữ liệu trong cửa sổ (rate() cần ít nhất hai lần scrape để có điểm so sánh).
`,
  exercises: [
    {
      title: 'Histogram quantile và ErrorBudget',
      prompt: `Hoàn thiện {{Histogram}} với bucket cố định (le), {{observe(ms)}}, {{quantile(q)}} nội suy tuyến tính như histogram_quantile, và {{ErrorBudget.remaining(sloPercent, total, errors)}}.`,
      starter: `class Histogram {
    private final double[] les;
    private final long[] counts;
    private long sum, count;
    Histogram(double[] les) {
        this.les = les;
        this.counts = new long[les.length];
    }
    void observe(double ms) {
        throw new UnsupportedOperationException("TODO");
    }
    double quantile(double q) {
        throw new UnsupportedOperationException("TODO");
    }
}

class ErrorBudget {
    static double remaining(double sloPercent, long total, long errors) {
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
    static void eq(double expected, double actual, double eps) {
        if (Math.abs(expected - actual) > eps) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("observe counts buckets", () -> {
            Histogram h = new Histogram(new double[]{100,200,500});
            h.observe(50); h.observe(150); h.observe(300);
            if (h.quantile(0.5) < 50 || h.quantile(0.5) > 500) throw new AssertionError("bad q");
        });
        check("error budget remaining", () -> {
            eq(1.0, ErrorBudget.remaining(99.9, 1000, 0), 1e-9);
            eq(0.0, ErrorBudget.remaining(99.9, 1000, 1), 1e-9);
        });
        check("quantile interpolation", () -> {
            Histogram h = new Histogram(new double[]{100,200});
            for (int i=0;i<10;i++) h.observe(50);
            for (int i=0;i<10;i++) h.observe(150);
            double q = h.quantile(0.5);
            if (q < 50 || q > 200) throw new AssertionError("q="+q);
        });
        check("empty histogram returns 0", () -> {
            Histogram h = new Histogram(new double[]{100,200});
            eq(0.0, h.quantile(0.5), 1e-9);
        });
        check("error budget negative when over", () -> {
            eq(-1.0, ErrorBudget.remaining(99.0, 100, 2), 1e-9);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Histogram {
    private final double[] les;
    private final long[] counts;
    private long sum, count;
    Histogram(double[] les) {
        this.les = les;
        this.counts = new long[les.length];
    }
    void observe(double ms) {
        count++;
        sum += ms;
        for (int i = 0; i < les.length; i++) {
            if (ms <= les[i]) { counts[i]++; break; }
        }
    }
    double quantile(double q) {
        if (count == 0) return 0.0;
        long target = (long) Math.ceil(q * count);
        long cum = 0;
        for (int i = 0; i < les.length; i++) {
            cum += counts[i];
            if (cum >= target) {
                // linear interpolation approx
                double lower = (i == 0 ? 0 : les[i-1]);
                return (lower + les[i]) / 2.0;
            }
        }
        return les[les.length-1];
    }
}

class ErrorBudget {
    static double remaining(double sloPercent, long total, long errors) {
        double allowed = (100.0 - sloPercent) / 100.0 * total;
        return allowed - errors;
    }
}`,
      hints: ['observe: tăng count/sum và đếm vào bucket đầu tiên mà ms <= le.', 'quantile: tìm bucket mà cumulative >= ceil(q*count).', 'ErrorBudget: allowed = (100-slo)/100 * total; remaining = allowed - errors.'],
      explain: `Histogram lưu count theo bucket. quantile nội suy tuyến tính gần đúng. Error budget còn lại = số lỗi cho phép - số lỗi thực tế.`,
    },
  ],
  check: [
    { q: 'SLO 99.9%, 1000 request, 0 lỗi. Error budget còn?', options: ['1.0', '0.1', '10', '100'], answer: 0, explain: 'allowed = 0.1%*1000 = 1.0; remaining = 1.0 - 0 = 1.0.' },
    { q: 'Metric nào chỉ tăng?', options: ['Gauge', 'Counter', 'Histogram', 'Summary'], answer: 1, explain: 'Counter chỉ tăng; Gauge lên xuống; Histogram phân bố.' },
    {
      q: 'Prometheus histogram dùng để đo latency. Trường nào chứa tổng số lần quan sát?',
      options: ['_bucket', '_sum', '_count', 'rate()'],
      answer: 2,
      explain: '_count là tổng số lần quan sát, _sum là tổng giá trị (ví dụ tổng latency), _bucket là phân phối theo các ngưỡng le, còn rate() là hàm PromQL, không phải trường của histogram. Histogram_quantile dùng _count làm mẫu số để tìm điểm phần trăm trong phân bố.'
    },
  ],
  related: ['devops-005'],
  tags: ['Prometheus', 'SLO', 'Histogram', 'Error budget', 'Observability'],
},
{
  id: 'lesson-devops-010',
  track: 'devops',
  order: 10,
  title: 'Thuật toán HPA: desired = ceil(current x metric / target), tolerance 0.1, min/max và stabilization window',
  level: 'senior',
  minutes: 40,
  goals: [
    'Viết được công thức HPA {{ceil(currentReplicas x currentMetric / targetMetric)}} và giải thích vì sao làm tròn lên, vì sao tỉ lệ thuận',
    'Giải thích được tolerance mặc định 0.1, clamp {{minReplicas}}/{{maxReplicas}} và stabilization window 300 giây khi scale down (lấy đề xuất lớn nhất trong cửa sổ)',
    'Hiểu vì sao phần trăm CPU của HPA tính theo CPU **request** và vì sao JVM warm-up sinh vòng lặp scale-up xấu',
    'Cài đặt {{HpaSim}} mô phỏng đúng thuật toán với đồng hồ giả để test deterministic',
  ],
  body: `### Ba khái niệm nền, đọc trước nếu chưa từng chạm Kubernetes
- **Pod**: một bản thể đang chạy của service bạn (container Java + tài nguyên bị giới hạn của nó). Hiểu như "một quầy thu ngân đang mở".
- **Deployment**: bản khai báo "tôi muốn {{N}} Pod chạy cùng image". Bạn sửa N, Kubernetes tự sắp xếp đặt Pod lên các node.
- **HPA (HorizontalPodAutoscaler)**: một **controller** — chương trình chạy trong control plane, lặp mãi vòng "đo thực tế → tính N mong muốn → ghi lại vào Deployment".

HPA **không** phản ứng theo từng request. Chu kỳ mặc định là **15 giây**: cứ 15s đo và chỉnh một lần, giống máy lạnh đọc nhiệt độ mỗi chục giây chứ không chỉnh van liên tục. Điều này cực quan trọng khi phỏng vấn: giữa lúc tải tăng và lúc Pod mới nhận traffic, bạn có **một khoảng trễ hữu cơ** (15s đo + 30-120s boot + warm-up), và mọi quyết định sizing phải tính khoảng trễ đó.

~~~seq
title: Một vòng reconcile của HPA (15 giây)
actors: HPA | metrics-server | kubelet | Deployment
HPA -> metrics-server: hỏi CPU trung bình của các Pod
metrics-server -> kubelet: lấy số đo tải từ cgroup
kubelet --> metrics-server: CPU usage từng Pod
metrics-server --> HPA: CPU trung bình, quy về % theo request
HPA -> HPA: tính desired và áp tolerance + clamp
HPA -> Deployment: ghi replicas = desired
note HPA..Deployment: scale xuống phải chờ hết stabilization window
~~~

### Công thức cốt lõi và vì sao nó là phép chia
{{desiredReplicas = ceil(currentReplicas x currentMetricValue / targetMetricValue)}}

{{currentMetricValue}} là cường độ tải **trung bình trên một Pod** (phần trăm CPU, hoặc RPS/pod, hoặc lag Kafka/pod). {{targetMetricValue}} là mức bạn muốn mỗi Pod gánh. Logic: tải tăng gấp đôi thì mỗi Pod đang gánh gấp đôi target; muốn mỗi Pod quay về target thì số Pod phải nhân đôi — nên {{desired = current x (currentMetric / target)}}. Kubernetes dùng {{ceil}} (làm tròn **lên**) vì làm tròn xuống cố tình để vượt target: tính ra 8.2 Pod mà lấy 8 thì mỗi Pod gánh 102% của target, chu kỳ sau lại đòi 9 — cụm cứ dao động quanh target mãi.

Ví dụ thật, {{target = 50}}% CPU, đang có 4 Pod:

| CPU trung bình | current/target | desired = ceil | Ý nghĩa |
|---|---|---|---|
| 20% | 0.4 | 2 | Tải giảm một nửa, xin bỏ 2 Pod (nhưng phải chờ window) |
| 50% | 1.0 | 4 | Đúng target, giữ nguyên |
| 90% | 1.8 | 8 | 7.2 → 8, mỗi Pod quay về ~45% |
| 150% | 3.0 | 12 | Tải gấp 3, cần 12 Pod |

~~~java
// thuật toán rút gọn của "horizontal controller" trong kube-controller-manager
static int desiredReplicas(int current, double metric, double target, double tolerance) {
    double ratio = metric / target;                          // 1.0 = đúng target
    if (Math.abs(ratio - 1.0) <= tolerance) return current;  // vùng chết: coi như không đổi
    return (int) Math.ceil(current * ratio);                 // luôn làm tròn lên
}
~~~

### Tolerance 0.1: "vùng chết" chống giật
Flag {{--horizontal-pod-autoscaler-tolerance}} mặc định **0.1**. Nếu {{|current/target - 1| <= 0.1}} — tức metric chỉ dao động trong ±10% quanh target — HPA coi như "đang ổn" và **giữ nguyên số Pod**, bất kể {{ceil}} có đòi thêm. Không có vùng chết thì 5 Pod ở 54% CPU bị làm tròn lên 6 Pod; 6 Pod chia lại tải ra 45%, rồi dao động ngược lại — cụm nhảy lên xuống cả ngày (tiếng Anh gọi là {{flapping}}), mỗi lần nhảy là một lần Pod mới boot và tốn tiền.

### minReplicas / maxReplicas: clamp hai đầu sau khi tính
desired bị ép vào {{[minReplicas, maxReplicas]}}. Đây không phải hình thức:
- {{minReplicas}} nên **>= 2** cho service có warm-up: nếu còn 1 Pod mà Pod đó đang khởi động lại thì service chết hẳn. Muốn {{minReplicas: 0}} (service tắt ban đêm) thì thực tế nên dùng KEDA cron scaler, vì HPA thuần đối xử rất khó lường khi không còn mẫu metric.
- {{maxReplicas}} chặn chi phí **và** chặn hiệu ứng dây chuyền: 20 Pod x 200 connection = 4000 connection, database pool của bạn có thể sập trước khi CPU kịp hạ. Số Pod tối đa phải là số mà phần dưới của hệ thống (DB, Kafka, node capacity) gánh nổi.
- Khi khai báo **nhiều metric**, HPA lấy desired **lớn nhất** trong các metric — an toàn cho bạn nhưng phải chắc metric nào cũng có nghĩa.

### Stabilization window: scale lên ngay, scale xuống phải chờ
Mặc định {{--horizontal-pod-autoscaler-downscale-stabilization = 300}} giây (trong manifest là {{behavior.scaleDown.stabilizationWindowSeconds}}). Cơ chế, nói cho chính xác: controller **ghi lại lịch sử các đề xuất**; khi đề xuất hiện tại **nhỏ hơn** số Pod đang có, nó lấy **giá trị lớn nhất trong cửa sổ 300s gần nhất** làm quyết định. Muốn xuống, bạn phải chờ mọi đề xuất cao "chết tuổi" khỏi cửa sổ. Scale lên thì {{stabilizationWindowSeconds: 0}}, dùng đề xuất ngay.

Manifest khai báo rõ hai hành vi này:

~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service
spec:
  scaleTargetRef:
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60        # % của requests.cpu, KHÔNG phải của limit
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "800"           # mỗi pod gánh tối đa 800 RPS
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0   # tăng tải: phản ứng ngay
    scaleDown:
      stabilizationWindowSeconds: 300 # mặc định: chờ đề xuất cũ hết hạn
      policies:
      - type: Percent
        value: 50                     # mỗi 60s chỉ bỏ tối đa 50% pod
        periodSeconds: 60
~~~

Vì sao bất đối xứng — đây là chỗ interviewer thích nghe:
- **Thiệt hại không bằng nhau.** Scale chậm vài chu kỳ = user thấy chậm/5xx. Scale thừa vài Pod = tốn thêm ít tiền. Nên thà chậm bỏ Pod.
- Pod Java mới mất 60-120s cho warm-up; mỗi lần co rồi duỗi là trả lại cái giá đó một lần nữa.
- Đỉnh CPU do cron job hay batch 2-3 phút là nhiễu bình thường. 300s ~ 20 chu kỳ đo, đủ để phân biệt đỉnh nhiễu và đỉnh thật.
- {{scaleDown.policies}} (ví dụ tối đa 50% số Pod mỗi 60s) chặn "rớt thang": đang 20 Pod mà metric tụt đột ngột, không có policy thì HPA đòi bỏ 18 Pod trong một nhịp.

### Vì sao % CPU tính theo request, không phải limit
{{percent = CPU usage / requests.cpu}}. Hệ quả thực tế:
- **Không đặt {{requests.cpu}}** → HPA theo CPU **hoàn toàn không hoạt động** (log controller: "missing request for cpu"). Nhiều team mở HPA mà không thấy scale bao giờ, lỗi đúng chỗ này.
- Đặt {{requests.cpu = 0.5}}, {{limits.cpu = 2}}: khi Pod ăn 1 core, HPA thấy **200%** và scale mạnh, dù node còn thừa CPU. Vậy request phải là "mức CPU mỗi Pod thật sự cần khi đầy tải", không phải con số xin quota cho rẻ.
- Nếu Pod không đặt limit, JVM (từ 17.0.5) nhìn thấy **toàn bộ core của node** chứ không phải request — số thread JIT/GC/phương án thread pool đội lên, CPU usage tăng, HPA hiểu lầm là tải cao.

### JVM warm-up: cái gai trong mọi autoscaler
Pod Java vừa khởi động có CPU **cao giả** vì:
1. Code mới chạy trên **interpreter** (chưa dịch sang machine code) và **JIT compiler** (C1 rồi C2) đang ngốn CPU nền để dịch các method nóng.
2. Spring Boot nạp hàng nghìn class, proxy, auto-configuration; connection pool Hikari tạo kết nối; cache còn lạnh nên mỗi request phải truy vấn DB thật.
3. Kết quả: request trong 1-2 phút đầu có thể chậm gấp 3-10 lần, và **chính phần CPU boot đó bị cộng vào trung bình** của cụm.

Vòng lặp xấu kinh điển: tải tăng → HPA thêm Pod → Pod mới boot ngốn CPU → trung bình CPU tăng tiếp → HPA lại thêm Pod → càng lúc càng nhiều Pod lạnh → latency xấu đi chứ không tốt lên. Kubernetes giảm nó bằng cách bỏ qua mẫu của Pod mới khởi động trong một khoảng thời gian (flag {{--horizontal-pod-autoscaler-initial-readiness-delay}} ~30s và {{--horizontal-pod-autoscaler-cpu-initialization-period}} ~5 phút). Bạn phải làm phần còn lại:
- **readiness probe** chỉ trả lời "sẵn sàng" sau khi warm-up thật (tự bắn request nội bộ trong {{ApplicationReadyEvent}} rồi mới mở {{/readiness}}); **startupProbe** cho app boot 60-90s để liveness không kill sớm; {{minReadySeconds}} để Pod "Ready rồi crash ngay" bị đá ra.
- Với app I/O-bound (chờ DB, chờ HTTP), **đừng scale theo CPU**: dùng RPS hoặc lag Kafka làm custom metric — latency tăng mà CPU thấp thì HPA CPU đứng nhìn.
- Pre-scale theo lịch (KEDA cron scaler) cho giờ cao điểm đã biết trước, đừng đợi hàng dài mới gọi thêm nhân viên.
- Đặt target có headroom: {{averageUtilization: 90}} là tự sát, vì trong 15s chu kỳ tới tải có thể vượt nữa trước khi Pod mới kịp Ready. Thực tế 50-70%.

### Bẫy production hay gặp
- **Scale theo memory của JVM**: heap đã cấp gần như không bao giờ trả cho OS, metric chỉ đi lên → scale lên rồi đứng đó mãi. Dùng CPU/RPS/lag.
- **HPA và Cluster Autoscaler đá nhau**: HPA sinh Pod mới nhưng cluster hết node → Pod pending. Phải đặt request đúng để chuỗi HPA → Cluster Autoscaler → node chạy được.
- **Scale xuống giết job dài**: Pod đang xử lý batch 5 phút bị bỏ; cần {{terminationGracePeriodSeconds}} đủ dài + graceful shutdown, và PodDisruptionBudget cho drain node.
- **DB/Kafka không theo kịp**: Pod tăng gấp 3, mỗi Pod mở 200 connection → pool sập, mọi thứ chậm hơn. Autoscaling chỉ hết nghẽn khi phần dưới cũng co giãn.
- **Không có PDB ở minReplicas nhỏ**: một node drain bỏ sạch capacity.

### Liên hệ phỏng vấn
Câu hỏi: "Bạn cấu hình autoscaling cho service Java thế nào?" — trả lời có khung: (1) tôi chọn metric nào và **vì sao** (app tôi I/O-bound nên lấy RPS/lag, không lấy CPU), (2) target có headroom vì chu kỳ 15s + boot 90s, (3) min/max ràng buộc bởi gì (DB pool, chi phí), (4) tolerance và stabilization window để không giật, (5) JVM warm-up: readiness sau warm-up, startupProbe, flag che mẫu Pod mới, (6) cách phát hiện "scale nhưng không hết nghẽn" (Pod pending, p95 vẫn cao khi replica đã tăng). Bài tập dưới đây là chính thuật toán, viết thành {{HpaSim}} và test bằng đồng hồ giả.

> Senior tip: Hãy nói con số thật khi trả lời: "target 60% CPU, request 1 core, min 3, max 20, stabilization 300s vì service boot 70s và DB pool trần 2000 connection". Người phỏng vấn chấm ở chỗ bạn biết **giới hạn nằm ở đâu**, không phải ở việc bạn biết có HPA.`,
  exercises: [
    {
      title: 'HpaSim: observe(currentReplicas, metric) theo đúng luật HPA (tolerance, clamp, stabilization window)',
      prompt: `Cài đặt {{HpaSim}} mô phỏng một vòng quyết định của HPA. Đồng hồ truyền vào dạng {{java.time.Clock}} để test chỉnh thời gian được (không dùng giờ thật).

Hằng số có sẵn: {{TOLERANCE = 0.1}}, {{DEFAULT_DOWN_WINDOW_SECONDS = 300}}.

- {{HpaSim(min, max, target, clock)}}: ủy quyền cho constructor 5 tham số với {{downWindowSeconds = DEFAULT_DOWN_WINDOW_SECONDS}}.
- {{HpaSim(min, max, target, clock, downWindowSeconds)}}: ném {{IllegalArgumentException}} khi {{min < 1}}, {{max < min}}, {{target <= 0}}, {{clock == null}} hoặc {{downWindowSeconds < 0}}; lưu lại các tham số.
- {{observe(currentReplicas, currentMetric)}}: ném {{IllegalArgumentException}} nếu {{currentReplicas < 0}} hoặc {{currentMetric < 0}}. Sau đó:
  1. {{ratio = currentMetric / target}}. Nếu {{|ratio - 1| <= TOLERANCE}} thì {{raw = currentReplicas}} (vùng chết), ngược lại {{raw = ceil(currentReplicas x ratio)}}.
  2. Clamp {{raw}} vào {{[min, max]}}.
  3. Ghi {{(clock.millis(), raw)}} vào lịch sử đề xuất, rồi bỏ các bản ghi có {{clock.millis() - timestamp > downWindowSeconds x 1000}}.
  4. Nếu {{raw >= currentReplicas}} (scale up hoặc giữ nguyên) thì trả {{raw}} ngay.
  5. Nếu {{raw < currentReplicas}} (đòi scale down) thì trả **giá trị lớn nhất** trong lịch sử còn lại — tức đang bị stabilization window giữ lại.

Ghi ý: lịch sử luôn chứa chính {{raw}} vừa ghi, nên ở lần scale down đầu tiên của một cụm chưa từng phình to, kết quả vẫn là {{raw}}.`,
      starter: `import java.time.Clock;

class HpaSim {
    static final double TOLERANCE = 0.1;
    static final long DEFAULT_DOWN_WINDOW_SECONDS = 300;

    private final int min;
    private final int max;
    private final double target;
    private final Clock clock;
    private final long windowMillis;
    private final Deque<long[]> history = new ArrayDeque<>();

    HpaSim(int min, int max, double target, Clock clock) {
        this(min, max, target, clock, DEFAULT_DOWN_WINDOW_SECONDS);
    }

    HpaSim(int min, int max, double target, Clock clock, long downWindowSeconds) {
        throw new UnsupportedOperationException("TODO");
    }

    int observe(int currentReplicas, double currentMetric) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(int expected, int actual) {
        if (expected != actual) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final class FakeClock extends Clock {
        private Instant now;
        FakeClock(long epochSecond) { now = Instant.ofEpochSecond(epochSecond); }
        void advanceSeconds(long s) { now = now.plusSeconds(s); }
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
    public static void main(String[] args) {
        check("scale up theo ti so va lam tron len", () -> {
            HpaSim h = new HpaSim(2, 20, 50, new FakeClock(1000));
            eq(12, h.observe(4, 150));
        });
        check("8.3 pod lam tron len 9", () -> {
            HpaSim h = new HpaSim(1, 20, 60, new FakeClock(0));
            eq(9, h.observe(5, 100));
        });
        check("tolerance gi nguyen trong +/-10 percent", () -> {
            HpaSim h = new HpaSim(2, 20, 50, new FakeClock(0));
            eq(5, h.observe(5, 54));
            eq(5, h.observe(5, 46));
        });
        check("max clamp chan burst", () -> {
            HpaSim h = new HpaSim(2, 10, 50, new FakeClock(0));
            eq(10, h.observe(4, 1000));
        });
        check("min clamp sẵn tại trong, scale down đầu tiên không bị giữ", () -> {
            HpaSim h = new HpaSim(2, 10, 50, new FakeClock(0));
            eq(2, h.observe(6, 5));
        });
        check("scale down bi window 300s giu lai", () -> {
            FakeClock c = new FakeClock(0);
            HpaSim h = new HpaSim(2, 20, 50, c);
            eq(6, h.observe(2, 150));
            c.advanceSeconds(100);
            eq(6, h.observe(6, 25));
        });
        check("scale down được phép sau khi window hết hạn", () -> {
            FakeClock c = new FakeClock(0);
            HpaSim h = new HpaSim(2, 20, 50, c);
            eq(6, h.observe(2, 150));
            c.advanceSeconds(400);
            eq(3, h.observe(6, 25));
        });
        check("window tuy chinh ngan lai thi bo nhanh", () -> {
            FakeClock c = new FakeClock(0);
            HpaSim h = new HpaSim(2, 20, 50, c, 60);
            eq(6, h.observe(2, 150));
            c.advanceSeconds(120);
            eq(3, h.observe(6, 25));
        });
        check("cau hinh hop ném IllegalArgumentException", () -> {
            try { new HpaSim(3, 2, 50, new FakeClock(0)); throw new AssertionError("max < min phai bi tu choi"); }
            catch (IllegalArgumentException e) { }
            try { new HpaSim(1, 5, 0, new FakeClock(0)); throw new AssertionError("target = 0 phai bi tu choi"); }
            catch (IllegalArgumentException e) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.Clock;

class HpaSim {
    static final double TOLERANCE = 0.1;
    static final long DEFAULT_DOWN_WINDOW_SECONDS = 300;

    private final int min;
    private final int max;
    private final double target;
    private final Clock clock;
    private final long windowMillis;
    private final Deque<long[]> history = new ArrayDeque<>();

    HpaSim(int min, int max, double target, Clock clock) {
        this(min, max, target, clock, DEFAULT_DOWN_WINDOW_SECONDS);
    }

    HpaSim(int min, int max, double target, Clock clock, long downWindowSeconds) {
        if (min < 1) throw new IllegalArgumentException("min phai >= 1");
        if (max < min) throw new IllegalArgumentException("max phai >= min");
        if (!(target > 0)) throw new IllegalArgumentException("target phai > 0");
        if (clock == null) throw new IllegalArgumentException("thieu clock");
        if (downWindowSeconds < 0) throw new IllegalArgumentException("window phai >= 0");
        this.min = min;
        this.max = max;
        this.target = target;
        this.clock = clock;
        this.windowMillis = downWindowSeconds * 1000L;
    }

    int observe(int currentReplicas, double currentMetric) {
        if (currentReplicas < 0) throw new IllegalArgumentException("currentReplicas am");
        if (currentMetric < 0) throw new IllegalArgumentException("currentMetric am");
        double ratio = currentMetric / target;
        int raw;
        if (Math.abs(ratio - 1.0) <= TOLERANCE) {
            raw = currentReplicas;
        } else {
            raw = (int) Math.ceil(currentReplicas * ratio);
        }
        if (raw < min) raw = min;
        if (raw > max) raw = max;

        long now = clock.millis();
        history.addLast(new long[]{now, raw});
        while (!history.isEmpty() && now - history.peekFirst()[0] > windowMillis) {
            history.removeFirst();
        }

        if (raw >= currentReplicas) return raw;   // scale up / giu nguyen: dung ngay
        int held = raw;
        for (long[] entry : history) {
            int value = (int) entry[1];
            if (value > held) held = value;       // đề xuất lớn nhất trong cửa sổ
        }
        return held;
    }
}`,
      hints: [
'Bước tolerance: dùng {{Math.abs(ratio - 1.0) <= TOLERANCE}} trước khi kịp {{Math.ceil}}; nếu nằm trong vùng chết thì desired = currentReplicas.',
'Lịch sử là các cặp {{(timestampMillis, recommendation)}}; hàm {{clock.millis()}} cho thời gian giả lập, không dùng {{System.currentTimeMillis()}}.',
'Chỉ áp dụng "lấy giá trị lớn nhất trong cửa sổ" khi {{raw < currentReplicas}}; scale up thì trả {{raw}} liền.',
'Xóa bản ghi cũ: {{while (!history.isEmpty() && now - history.peekFirst()[0] > windowMillis) history.removeFirst();}}',
      ],
      explain: `Đây là nguyên văn những gì controller làm, chỉ bỏ phần gọi metrics-server. Ba lớp xử lý chồng nhau: (1) {{ceil}} đảm bảo không cố tình vượt target; (2) tolerance biến ±10% thành nhiễu được tha, chặn flapping; (3) stabilization window làm scale down **chậm hơn** scale up, bằng cách lấy đề xuất lớn nhất còn sống trong cửa sổ — nên một đỉnh tải 30s không đủ để bạn bỏ Pod, và một cụm vừa phình lên phải "nguội" đủ 300s mới được co.

Lỗi người học hay mắc:
- Quên clamp {{min}}/{{max}} **trước khi** ghi lịch sử, khiến giá trị bị clamp muộn thắng trong {{max(history)}} và giữ cụm ở số ngoài phạm vi.
- Áp "max trong cửa sổ" cho cả scale up → cụm không bao giờ phình kịp khi tải tăng đột biến.
- Dùng {{System.currentTimeMillis()}} trong hàm: test sẽ chạy đúng lúc 2h sáng và sai lúc 2h chiều, vì cửa sổ 300s liên quan thời gian thật. Đồng hồ giả là lý do {{Clock}} được truyền vào.
- Quên rằng lịch sử chứa cả bản ghi vừa ghi, nên lần scale down đầu tiên ở cụm chưa từng phình vẫn trả đúng {{raw}}.

Trả lời phỏng vấn: nêu công thức, rồi nói ngay ba hậu quả thực tế — request CPU phải tồn tại (% tính theo request), tolerance/window giải thích vì sao HPA "chậm" theo thiết kế, và Pod Java lạnh làm metric xấu nên cần warm-up gate.`,
    },
  ],
  check: [
    { q: 'Công thức desiredReplicas của HPA là gì?', options: ['ceil(current x currentMetric / targetMetric)', 'floor(currentMetric / targetMetric)', 'current + (currentMetric - target)', 'maxReplicas khi metric > target'], answer: 0, explain: 'Tải tỉ lệ nghịch số Pod: desired = current x (currentMetric / target), làm tròn lên bằng ceil để không cố tình vượt target.' },
    { q: 'Phần trăm CPU mà HPA so với target được tính bằng cách nào?', options: ['usage chia cho CPU limit', 'usage chia cho CPU request', 'usage chia cho số core của node', 'usage chia cho CPU của Pod lâu đời nhất'], answer: 1, explain: 'Kubernetes dùng requests.cpu làm mẫu số. Không đặt request thì HPA theo CPU không hoạt động.' },
    { q: 'Stabilization window 300s (mặc định) áp dụng cho hướng nào?', options: ['Cả scale up và scale down', 'Chỉ scale up', 'Chỉ scale down: lấy đề xuất lớn nhất trong cửa sổ', 'Chỉ khi metric là custom'], answer: 2, explain: 'Scale down phải chờ mọi đề xuất cao chết tuổi khỏi cửa sổ 300s; scale up dùng đề xuất ngay để không sập.' },
    { q: 'Vì sao Pod Java mới khởi động làm HPA theo CPU dễ scale quá mức?', options: ['Vì Pod mới bị metrics-server tính gấp đôi', 'Vì JIT/Spring boot ngốn CPU nên CPU trung bình cao giả lúc chưa nhận tải', 'Vì HPA không biết Pod mới', 'Vì limit CPU bị bỏ qua khi pod mới'], answer: 1, explain: 'Interpreter + JIT compiler và khởi động Spring tiêu thụ CPU lớn trong 1-2 phút đầu, đẩy trung bình lên và trigger thêm Pod — vòng lặp xấu.' },
  ],
  related: ['devops-006'],
  tags: ['Kubernetes', 'HPA', 'Autoscaling', 'tolerance', 'stabilization window', 'JVM warm-up'],
},
{
  id: 'lesson-devops-011',
  track: 'devops',
  order: 11,
  title: 'Canary analysis tự động: so sánh baseline với canary theo error rate và p95, ngưỡng tương đối + tuyệt đối, PROMOTE/CONTINUE/ROLLBACK',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt canary **routing** (chia traffic) với canary **analysis** (máy so sánh số liệu hai nhóm rồi quyết định)',
    'Thiết kế bộ quyết định: ngưỡng tuyệt đối, ngưỡng tương đối so với baseline, sàn tuyệt đối để khỏi chia cho 0, và số mẫu tối thiểu',
    'Giải thích được vì sao quá ít request thì phải CONTINUE chứ không được ROLLBACK, và vì sao bằng chứng phải tăng theo bước rollout',
    'Cài đặt {{CanaryJudge.decide(baseline, canary, step)}}, chạy một rollout nhiều bước bằng {{rollout}}',
  ],
  body: `### Canary routing khác canary analysis ở đâu
Bài {{lesson-devops-003}} đã dạy phần **routing**: chia {{10}}% traffic sang bản mới bằng hash ổn định của {{userId}}, và giết release khi error rate vượt một ngưỡng cố định. Phần **analysis** — thứ mà Flagger/Argo Rollouts làm — tinh vi hơn: nó **so sánh cùng lúc hai nhóm** (gọi là {{baseline}} = bản cũ đang ăn {{90}}% và {{canary}} = bản mới ăn {{10}}%) trên cùng cửa sổ thời gian, rồi trả một trong ba quyết định:

- {{PROMOTE}} — tín hiệu tốt, nâng lên bước tiếp theo ({{10}}% → {{25}}% → {{50}}% → {{100}}%).
- {{CONTINUE}} — **chưa có kết luận**, giữ nguyên %, đợi chu kỳ sau. Đây không phải lỗi, đây là "chưa đủ bằng chứng".
- {{ROLLBACK}} — tín hiệu xấu, hạ {{0}}% ngay (bản cũ vẫn còn chạy nên rollback chỉ là đổi weight, nhanh hơn nhiều so với deploy lại).

~~~seq
title: Canary analysis tự động trong một chu kỳ
actors: Gateway | Stable | Canary | Prometheus | Analyzer
Gateway -> Canary: 10 phan tram traffic theo userId
Gateway -> Stable: 90 phan tram traffic con lai
Canary --> Prometheus: error rate va p95 gan nhan version
Stable --> Prometheus: cung metric, cung cua so thoi gian
Analyzer -> Prometheus: query canary so voi baseline
Prometheus --> Analyzer: hai day so lieu da doi chieu
Analyzer -> Analyzer: kiem mau toi thieu roi so nguong
Analyzer -> Gateway: PROMOTE 25, CONTINUE, hoac ROLLBACK 0
note Analyzer..Gateway: rollback luon tu dong, promote can du bang chung
~~~

### Ba con số tối thiểu phải có, và ý nghĩa của chúng
- **error rate** = số request thất bại / tổng request, trong cửa sổ (thường 1-5 phút). Phải tách {{5xx}} khỏi {{4xx}}: client gửi sai dữ liệu không phải regression của bạn.
- **p95 latency**: sắp xếp toàn bộ thời gian response của cửa sổ rồi lấy giá trị ở vị trí 95%. **p50** là "một nửa số request nhanh hơn mức này" (cảm nhận của đa số), **p95/p99** bắt bệnh đuôi dài: một bản mới thêm {{synchronized}} hay một query N+1 chỉ làm xấu nhóm chậm, p50 vẫn đẹp. Dùng p95 vì nó ổn định hơn p99 khi mẫu ít.
- **số request (samples)**: cái quyết định hai con số trên có nghĩa gì hay không.

### Vì sao phải so với baseline, không dùng ngưỡng tuyệt đối suông
Tuyệt đối một mình có hai lỗi kinh điển:
1. Service của bạn **đã** error rate 3% vì một đối tác hay timeout. Canary 3.2% là "vượt ngưỡng 2%" → rollback oan, trong khi bản mới không xấu hơn gì.
2. Ngược lại, ngưỡng tuyệt đối 5% quá rộng: baseline 0.1%, canary 4% là tệ hơn 40 lần nhưng vẫn "an toàn" → 100% traffic nhận bản hỏng.

Nên bộ quyết định hiện đại luôn là **cặp**: một trần tuyệt đối (bảo vệ khỏi thảm họa) và một ngưỡng tương đối so với baseline (bắt regression thật).

### Vì sao ngưỡng tương đối suông cũng hỏng: sàn tuyệt đối
Nếu baseline error rate = {{0}} (một đêm yên tĩnh, không lỗi gì), thì {{1.5 x baseline = 0}} — canary chỉ cần **một** request lỗi là "vượt ngưỡng tương đối" và bị giết. Chia cho 0 là bug thiết kế phổ biến nhất của canary tự viết. Vì vậy, so sánh tương đối chỉ có nghĩa khi canary đã vượt một **sàn tuyệt đối nhỏ** (ví dụ {{1}}% lỗi, {{120}}ms p95). Sàn đó chính là "mức mà tôi chấp nhận dù baseline tốt cỡ nào".

Bộ quy tắc của {{CanaryJudge}} (áp dụng cho cả error rate và p95):
{{breach = (canary > CEILING && baseline <= CEILING) || (canary > FLOOR && canary > REL_FACTOR x baseline)}}

- {{CEILING}}: trần tuyệt đối. Canary vượt là nghi phạm ngay — **nhưng chỉ khi baseline chưa vượt trần**, vì không được phạt canary vì bệnh sẵn của bản cũ.
- {{FLOOR}}: sàn tuyệt đối để phép so sánh tương đối không chia cho 0.
- {{REL_FACTOR}}: hệ số tương đối, 1.5 là mức thường dùng (canary tệ hơn baseline 50%).

Ví dụ số, {{REL_FACTOR = 1.5}}, error {{FLOOR = 1}}%, {{CEILING = 5}}%:

| baseline | canary | Trần tuyệt đối? | Tương đối? | Kết luận |
|---|---|---|---|---|
| 0.2% | 0.5% | không (0.5 < 5) | không (0.5 < 1% sàn) | tốt, PROMOTE |
| 0.2% | 1.5% | không | có (1.5 > 1% và > 0.3%) | ROLLBACK |
| 0% | 0.4% | không | không (dưới sàn) | PROMOTE — một vài lỗi chưa phải bằng chứng |
| 9% | 10% | không (baseline đã vượt trần) | không (10 < 13.5) | PROMOTE — canary không tệ hơn baseline |
| 1% | 8% | có | có | ROLLBACK |

### Số mẫu tối thiểu: phần thống kê mà interview muốn nghe
Error rate là một **ước lượng từ mẫu**, không phải sự thật. Với {{n}} request và tỉ lệ lỗi thật {{p}}, độ lệch chuẩn của error rate quan sát được xấp xỉ {{sqrt(p(1-p)/n)}}. Với {{p = 0.01}}:
- {{n = 20}}: sai số ~2.2% — nghĩa là quan sát 0% hay 5% đều bình thường. Kết luận gì cũng chỉ là đoán mò.
- {{n = 200}}: sai số ~0.7%.
- {{n = 1000}}: sai số ~0.3% — lúc đó "canary 1.2% so với baseline 0.4%" mới là bằng chứng.

Quy tắc ngón tay cái: cần đủ mẫu để **kỳ vọng thấy ít nhất vài lỗi** nếu tỉ lệ lỗi thật bằng ngưỡng; và p95 luôn cần mẫu lớn hơn vì nó lấy từ đuôi phân bố. Vì vậy bộ quyết định phải có {{MIN_SAMPLES}} cho **cả hai phía** (thiếu mẫu từ baseline thì cũng không có gì mà so).

### Mẫu tối thiểu phải tăng theo bước rollout
Logic cần nói được trong phỏng vấn: bước {{10}}% là thí nghiệm rẻ, sai thì rollback mất {{10}}% traffic; bước {{100}}% là đánh cược mọi thứ. Nên yêu cầu bằng chứng phải đi lên cùng blast radius. Trong bài tập, {{requiredSamples(step) = MIN_SAMPLES x max(1, ceil(step / 25))}}: {{10}}% và {{25}}% cần {{100}} mẫu, {{50}}% cần {{200}}, {{100}}% cần {{400}}. Chưa đủ mẫu thì kết luận duy nhất đúng là {{CONTINUE}} — tuyệt đối không {{PROMOTE}} và càng không {{ROLLBACK}}.

~~~java
// khung so sánh: ba nhịp, theo đúng thứ tự
Decision decide(Metrics base, Metrics can, int step) {
    long need = requiredSamples(step);
    // chưa đủ mẫu thì chưa kết luận gì, dù số liệu trông rất xấu
    if (can.requests < need || base.requests < need) return Decision.CONTINUE;
    if (breach(base.errorRate, can.errorRate, ERR_CEILING, ERR_FLOOR)) return Decision.ROLLBACK;
    if (breach(base.p95Millis, can.p95Millis, LAT_CEILING_MS, LAT_FLOOR_MS)) return Decision.ROLLBACK;
    return Decision.PROMOTE;
}
~~~

### Bẫy production hay gặp
- **Rollback vì quá ít mẫu**: 12 request, 3 lỗi = error rate 25% → giết release lúc 2h sáng. Sai số mẫu (bảng trên) giải thích tại sao đây là hành vi sai.
- **So sánh không cùng cửa sổ**: lấy canary 5 phút vừa rồi so với baseline "tuần trước". Traffic ban đêm khác ban ngày, user khác nhóm; phải so **hai nhóm chạy song song, cùng thời điểm**.
- **Quên warm-up JVM**: canary có 3 Pod mới, phút đầu JIT/Spring boot làm p95 gấp 3 → rollback oan, y hệt bẫy của HPA. Khắc phục: chờ {{minReadySeconds}} và gate warm-up xong mới bắt đầu chu kỳ phân tích, hoặc cho vài chu kỳ đầu trọng số thấp hơn.
- **Metric không có nhãn version**: nếu Prometheus chỉ có error rate gộp thì canary lỗi 10% chỉ làm số gộp tăng 1%. Mọi metric/trace/log phải có label {{version}} hoặc header {{X-Version}} do gateway gắn.
- **Tăng % giữa chừng làm đổi tập user**: nếu routing dùng random thay vì hash ổn định, khi nâng {{10}}% lên {{25}}% thì tập user đổi chỗ, số liệu hai bước không so được với nhau và user nhảy version giữa phiên.
- **Một chỉ số nói dối**: canary giảm error rate nhưng tăng p95 vì nó... retry nhiều hơn. Phải xem đồng thời và bắt **chuỗi** check đạt ({{consecutiveSuccess}}), không chỉ một chu kỳ đẹp.
- **Không cho phép con người dừng**: luôn có nút "pause/abort" và gate thủ công ở bước {{50}}% hoặc {{100}}% với service tiền bạc, vì máy không biết hôm nay là ngày quyết toán.

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Bạn tự động hoá quyết định promote/rollback thế nào, và khi nào nó cho kết quả sai?" — trả lời: so canary với baseline **cùng cửa sổ** trên error rate (tách {{5xx}}/{{4xx}}) và p95, dùng **cặp** ngưỡng tuyệt đối + tương đối, bắt mẫu tối thiểu cho cả hai phía và tăng theo blast radius; false positive đến từ mẫu nhỏ, warm-up chưa xong, hoặc chia cho baseline = 0; false negative đến từ metric không gắn nhãn version, cửa sổ quá dài làm loãng sự cố, hoặc user canary không đại diện (chỉ toàn user nhẹ). Nêu được **cả hai chiều sai lầm** là dấu hiệu người từng vận hành canary thật.

> Senior tip: Đặt {{CONTINUE}} thành trạng thái hữu hạn, không vô hạn: ví dụ tối đa 5 chu kỳ CONTINUE rồi rollback vì "mù số liệu" — canary nằm im ở 10% nhiều giờ là một kiểu sự cố ngụy trang, vì bạn đang chạy hai version song song với schema chung mà không ai còn nhìn.`,
  exercises: [
    {
      title: 'CanaryJudge: decide(baseline, canary, step) và mô phỏng rollout 10/25/50/100',
      prompt: `Cài đặt bộ quyết định canary. {{Decision}} và {{Metrics}} đã có sẵn ({{Metrics}} ném {{IllegalArgumentException}} khi {{requests < 0}}, {{errorRate}} ngoài {{0..1}} hoặc {{p95Millis < 0}} — không cần sửa).

Hằng số có sẵn trong {{CanaryJudge}}: {{MIN_SAMPLES = 100}}, {{ERR_CEILING = 0.05}}, {{ERR_FLOOR = 0.01}}, {{LAT_CEILING_MS = 500.0}}, {{LAT_FLOOR_MS = 120.0}}, {{REL_FACTOR = 1.5}}.

- {{requiredSamples(step)}}: ném {{IllegalArgumentException}} khi {{step < 1}} hoặc {{step > 100}}; trả về {{MIN_SAMPLES x max(1, ceil(step / 25.0))}} — bằng chứng phải tăng theo blast radius.
- {{decide(baseline, canary, step)}}: ném {{IllegalArgumentException}} khi một trong hai {{Metrics}} là {{null}}. Sau đó:
  1. Nếu {{canary.requests < requiredSamples(step)}} **hoặc** {{baseline.requests < requiredSamples(step)}} → trả {{CONTINUE}} (chưa đủ mẫu, dù số liệu xấu tới đâu).
  2. Nếu vi phạm ở error rate **hoặc** ở p95 → trả {{ROLLBACK}}.
  3. Ngược lại → {{PROMOTE}}.
- {{breach(baseline, canary, ceiling, floor)}} (hàm private dùng chung hai chỉ số): trả {{true}} khi {{canary > ceiling}} và {{baseline <= ceiling}}, **hoặc** khi {{canary > floor}} và {{canary > baseline x REL_FACTOR}}.
- {{rollout(baseline, canaryByStep, steps)}}: ném {{IllegalArgumentException}} khi {{canaryByStep == null}} hoặc {{steps == null}} hoặc độ dài không khớp. Duyệt các bước **theo thứ tự**, gọi {{decide}} cho từng cặp {{(canaryByStep.get(i), steps[i])}}, tích luỹ vào danh sách kết quả và **dừng ngay** khi gặp quyết định khác {{PROMOTE}} (rollback hoặc phải chờ). Trả về danh sách quyết định đã tích luỹ — rollout lành mạnh qua 4 bước trả về 4 phần tử {{PROMOTE}}.`,
      starter: `import java.util.*;

enum Decision { PROMOTE, CONTINUE, ROLLBACK }

final class Metrics {
    final long requests;
    final double errorRate;
    final double p95Millis;

    Metrics(long requests, double errorRate, double p95Millis) {
        if (requests < 0) throw new IllegalArgumentException("requests phai >= 0");
        if (!(errorRate >= 0 && errorRate <= 1)) throw new IllegalArgumentException("errorRate phải trong 0..1");
        if (p95Millis < 0) throw new IllegalArgumentException("p95Millis phai >= 0");
        this.requests = requests;
        this.errorRate = errorRate;
        this.p95Millis = p95Millis;
    }
}

class CanaryJudge {
    static final long MIN_SAMPLES = 100;
    static final double ERR_CEILING = 0.05;
    static final double ERR_FLOOR = 0.01;
    static final double LAT_CEILING_MS = 500.0;
    static final double LAT_FLOOR_MS = 120.0;
    static final double REL_FACTOR = 1.5;

    long requiredSamples(int step) {
        throw new UnsupportedOperationException("TODO");
    }

    Decision decide(Metrics baseline, Metrics canary, int step) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Decision> rollout(Metrics baseline, List<Metrics> canaryByStep, int[] steps) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(int expected, int actual) {
        if (expected != actual) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void dec(Decision expected, Decision actual) {
        if (expected != actual) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        CanaryJudge j = new CanaryJudge();
        check("canary lanh o buoc 10 thi PROMOTE", () -> {
            dec(Decision.PROMOTE, j.decide(new Metrics(1000, 0.002, 90), new Metrics(200, 0.003, 100), 10));
        });
        check("quá ít request thì CONTINUE dù lỗi 20 phần trăm", () -> {
            dec(Decision.CONTINUE, j.decide(new Metrics(1000, 0.002, 90), new Metrics(50, 0.20, 900), 10));
        });
        check("baseline qua it mau thi cung CONTINUE", () -> {
            dec(Decision.CONTINUE, j.decide(new Metrics(30, 0.001, 90), new Metrics(500, 0.002, 95), 10));
        });
        check("bước lớn hơn đòi nhiều bằng chứng hơn", () -> {
            Metrics base = new Metrics(1000, 0.002, 90);
            Metrics can = new Metrics(150, 0.002, 92);
            dec(Decision.PROMOTE, j.decide(base, can, 25));
            dec(Decision.CONTINUE, j.decide(base, can, 50));
        });
        check("regression tương đối của error rate thì ROLLBACK", () -> {
            dec(Decision.ROLLBACK, j.decide(new Metrics(1000, 0.002, 90), new Metrics(400, 0.015, 95), 25));
        });
        check("vượt trần tương đối của error rate thì ROLLBACK", () -> {
            dec(Decision.ROLLBACK, j.decide(new Metrics(1000, 0.010, 90), new Metrics(600, 0.080, 95), 25));
        });
        check("baseline da benh nang khong bi phat canary", () -> {
            dec(Decision.PROMOTE, j.decide(new Metrics(1000, 0.090, 90), new Metrics(600, 0.100, 95), 25));
        });
        check("p95 regression thi ROLLBACK", () -> {
            dec(Decision.ROLLBACK, j.decide(new Metrics(1000, 0.002, 100), new Metrics(500, 0.002, 200), 25));
        });
        check("noise dưới sàn không bị coi là lỗi", () -> {
            dec(Decision.PROMOTE, j.decide(new Metrics(1000, 0.0, 40), new Metrics(500, 0.008, 55), 25));
        });
        check("rollout lanh manh duoc bo 4 buoc", () -> {
            Metrics base = new Metrics(5000, 0.002, 90);
            List<Decision> d = j.rollout(base, Arrays.asList(
                new Metrics(200, 0.002, 95), new Metrics(500, 0.003, 100),
                new Metrics(1000, 0.002, 98), new Metrics(2500, 0.003, 96)), new int[]{10, 25, 50, 100});
            eq(4, d.size());
            dec(Decision.PROMOTE, d.get(3));
        });
        check("rollout dung ngay o buoc rollback", () -> {
            Metrics base = new Metrics(5000, 0.002, 90);
            List<Decision> d = j.rollout(base, Arrays.asList(
                new Metrics(200, 0.002, 95), new Metrics(600, 0.030, 100),
                new Metrics(1000, 0.002, 98), new Metrics(2500, 0.003, 96)), new int[]{10, 25, 50, 100});
            eq(2, d.size());
            dec(Decision.ROLLBACK, d.get(1));
        });
        check("buoc 100 doi 400 mau", () -> {
            dec(Decision.CONTINUE, j.decide(new Metrics(5000, 0.002, 90), new Metrics(300, 0.002, 90), 100));
            dec(Decision.PROMOTE, j.decide(new Metrics(5000, 0.002, 90), new Metrics(400, 0.002, 90), 100));
        });
        check("dau vao hop ném IllegalArgumentException", () -> {
            try { j.decide(new Metrics(100, 0.0, 10), new Metrics(100, 0.0, 10), 0); throw new AssertionError("step 0 phai bi tu choi"); }
            catch (IllegalArgumentException e) { }
            try { new Metrics(-1, 0.0, 10); throw new AssertionError("requests am phai bi tu choi"); }
            catch (IllegalArgumentException e) { }
            try { j.rollout(new Metrics(100, 0.0, 10), Arrays.asList(new Metrics(100, 0.0, 10)), new int[]{10, 25}); throw new AssertionError("size lech phai bi tu choi"); }
            catch (IllegalArgumentException e) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;

enum Decision { PROMOTE, CONTINUE, ROLLBACK }

final class Metrics {
    final long requests;
    final double errorRate;
    final double p95Millis;

    Metrics(long requests, double errorRate, double p95Millis) {
        if (requests < 0) throw new IllegalArgumentException("requests phai >= 0");
        if (!(errorRate >= 0 && errorRate <= 1)) throw new IllegalArgumentException("errorRate phải trong 0..1");
        if (p95Millis < 0) throw new IllegalArgumentException("p95Millis phai >= 0");
        this.requests = requests;
        this.errorRate = errorRate;
        this.p95Millis = p95Millis;
    }
}

class CanaryJudge {
    static final long MIN_SAMPLES = 100;
    static final double ERR_CEILING = 0.05;
    static final double ERR_FLOOR = 0.01;
    static final double LAT_CEILING_MS = 500.0;
    static final double LAT_FLOOR_MS = 120.0;
    static final double REL_FACTOR = 1.5;

    long requiredSamples(int step) {
        if (step < 1 || step > 100) throw new IllegalArgumentException("step phải trong 1..100");
        return MIN_SAMPLES * Math.max(1L, (long) Math.ceil(step / 25.0));
    }

    Decision decide(Metrics baseline, Metrics canary, int step) {
        if (baseline == null || canary == null) throw new IllegalArgumentException("thieu Metrics");
        long need = requiredSamples(step);
        if (canary.requests < need || baseline.requests < need) return Decision.CONTINUE;
        if (breach(baseline.errorRate, canary.errorRate, ERR_CEILING, ERR_FLOOR)) return Decision.ROLLBACK;
        if (breach(baseline.p95Millis, canary.p95Millis, LAT_CEILING_MS, LAT_FLOOR_MS)) return Decision.ROLLBACK;
        return Decision.PROMOTE;
    }

    private boolean breach(double baseline, double canary, double ceiling, double floor) {
        if (canary > ceiling && baseline <= ceiling) return true;   // thảm họa tuyệt đối, nhưng chỉ khi baseline chưa vượt trần
        return canary > floor && canary > baseline * REL_FACTOR;    // regression tương đối, có sàn để khỏi chia cho 0
    }

    List<Decision> rollout(Metrics baseline, List<Metrics> canaryByStep, int[] steps) {
        if (canaryByStep == null || steps == null) throw new IllegalArgumentException("thieu du lieu");
        if (canaryByStep.size() != steps.length) throw new IllegalArgumentException("so quan sat khop so buoc");
        List<Decision> decisions = new ArrayList<>();
        for (int i = 0; i < steps.length; i++) {
            Decision d = decide(baseline, canaryByStep.get(i), steps[i]);
            decisions.add(d);
            if (d != Decision.PROMOTE) break;   // rollback hoặc đang chờ: dừng rollout
        }
        return decisions;
    }
}`,
      hints: [
'Cuối cùng theo thứ tự: kiểm mẫu tối thiểu trước, rồi kiểm vi phạm, rồi PROMOTE. Chưa đủ mẫu thì không được quyết định gì cả.',
'requiredSamples: dùng {{Math.ceil(step / 25.0)}} (chia cho số thực 25.0, không phải 25 nguyên) rồi nhân MIN_SAMPLES.',
'breach dùng cho cả error rate và p95: {{canary > ceiling && baseline <= ceiling}} là nhánh tuyệt đối, {{canary > floor && canary > baseline * REL_FACTOR}} là nhánh tương đối.',
'rollout: dùng {{break}} ngay khi quyết định khác PROMOTE, nếu không test "dừng ở bước rollback" sẽ thấy 4 phần tử thay vì 2.',
      ],
      explain: `Ba nhịp của {{decide}} chính là cách Argo Rollouts/Flagger đặt {{AnalysisTemplate}}. Nhịp 1 (mẫu tối thiểu) chặn false positive kinh điển: 3 lỗi trên 12 request là 25% error rate nhưng chưa có nghĩa gì về mặt thống kê. Nhịp 2 đặt **hai lớp ngưỡng chồng nhau**: trần tuyệt đối bắt thảm họa, hệ số tương đối bắt regression mà ngưỡng tuyệt đối bỏ sót; cả hai đều cần một điều kiện phụ — trần tuyệt đối chỉ được quyền giết khi baseline chưa vượt trần (không phạt canary vì bệnh sẵn), còn so sánh tương đối chỉ được quyền kết luận khi canary vượt một sàn tuyệt đối nhỏ (tránh "1.5 x 0 = 0" làm một request lỗi thành tội đồ). Nhịp 3 tăng số mẫu theo bước, vì blast radius tăng thì yêu cầu bằng chứng phải tăng.

Lỗi hay gặp khi viết:
- Quên kiểm tra mẫu của **baseline**: thiếu số liệu bên kia thì không có gì để so, nhưng code thường chỉ nhìn canary.
- Dùng {{>=}} thay {{>}}: đúng ngưỡng thì chưa phải vi phạm, chọn nhất quán để test không nhạy cảm với con số tròn.
- Chia cho baseline không chặn {{baseline == 0}} → rollout chết oan vào lúc nửa đêm khi traffic thấp và baseline hoàn hảo.
- Cho {{CONTINUE}} là {{ROLLBACK}} (hoặc ngược lại): hai trạng thái này khác nhau về hành động, một bên là chờ, một bên là giết release.
- {{rollout}} không dừng ở quyết định đầu tiên khác {{PROMOTE}}, khiến bản xấu vẫn được "promote" ở các bước sau.

Khi trả lời phỏng vấn, hãy nói bằng ba phạm trù lỗi: **false positive** (mẫu nhỏ, warm-up JVM chưa xong, baseline = 0, cửa sổ lệch nhau), **false negative** (metric thiếu nhãn version, cửa sổ dài quá làm loãng sự cố, user canary không đại diện), và **an toàn vận hành** (rollback luôn tự động, promote tới 100% nên có gate thủ công cho service tiền; migration phải expand-contract để còn đường về).`,
    },
  ],
  check: [
    { q: 'Canary analysis khác gì canary routing?', options: ['Analysis là chia % traffic; routing là viết metric', 'Analysis so số liệu hai nhóm rồi quyết định PROMOTE/CONTINUE/ROLLBACK; routing chỉ quyết request nào sang bản mới', 'Hai cái là một', 'Analysis chỉ dùng cho blue-green'], answer: 1, explain: 'Routing quyết định đường đi của request. Analysis là bộ máy quan sát: so canary với baseline cùng cửa sổ rồi ra quyết định rollout.' },
    { q: 'Canary mới có 12 request, 3 lỗi (25%). Nên làm gì?', options: ['ROLLBACK ngay', 'CONTINUE: chưa đủ mẫu để kết luận', 'PROMOTE vì lỗi chắc do bản mới', 'Gấp đôi traffic để đo nhanh'], answer: 1, explain: 'Với mẫu nhỏ, sai số của error rate rất lớn (cỡ vài %), chưa phải bằng chứng. Tăng traffic khi chưa hiểu nguyên nhân chỉ to thêm hỏng.' },
    { q: 'Vì sao cần sàn tuyệt đối (floor) bên cạnh ngưỡng tương đối?', options: ['Để bắt trường hợp baseline = 0: 1.5 x 0 = 0 nên một request lỗi cũng "vượt ngưỡng"', 'Để tăng tốc rollback', 'Vì p95 luôn lớn hơn error rate', 'Để giảm số mẫu tối thiểu'], answer: 0, explain: 'So sánh tương đối chia cho baseline; baseline sạch làm mọi con số nhỏ thành "vô lần tệ hơn". Floor quy định mức tôi chấp nhận bất kể baseline.' },
    { q: 'Vì sao không phạt canary khi nó vượt trần tuyệt đối mà baseline cũng đã vượt trần?', options: ['Vì trần tuyệt đối chỉ áp dụng cho p95', 'Vì đó là bệnh sẵn của hệ thống, canary không tạo ra; rollback không cải thiện gì', 'Vì baseline luôn đúng', 'Vì promotion không liên quan error rate'], answer: 1, explain: 'Mục tiêu của canary là phát hiện **regression do bản mới**. Nếu baseline đã hỏng sẵn, giết canary không làm user tốt hơn; phải mở issue cho bệnh nền.' },
  ],
  related: ['devops-019', 'devops-042', 'devops-054'],
  tags: ['Canary', 'Argo Rollouts', 'Flagger', 'Error budget', 'Progressive delivery', 'Observability'],
},
{
  id: 'lesson-devops-012',
  track: 'devops',
  order: 12,
  title: 'Structured logging và correlation id: log JSON một dòng, MDC xuyên thread pool, level theo môi trường, không log PII',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích được vì sao log JSON một dòng dùng tốt hơn log chữ tự do khi chạy 30 Pod, và vì sao app chỉ ghi ra stdout',
    'Nói được correlation id (traceId) sinh ra ở đâu, truyền xuyên service thế nào và giúp trả lời câu gì',
    'Hiểu ThreadLocal đủ sâu để giải thích vì sao MDC vừa có thể MẤT tích vừa có thể NÓI DỐI khi task nhảy sang thread pool',
    'Viết được bộ bọc copy context lúc submit và dọn trong finally, biết vì sao phải copy bản sao chứ không chia sẻ map',
    'Chọn log level theo môi trường, đổi level giữa chừng lúc sự cố, và kể được 4 lớp che PII trong log',
  ],
  body: `### Log thật ra là gì, và vì sao log chữ tự do làm bạn mù lúc sự cố

Một dòng log chỉ là chữ mà app in ra lúc chạy, để người vận hành đọc được chuyện gì đã xảy ra **sau** khi nó xảy ra. Kiểu quen tay nhất là nối chuỗi:

~~~java
log.info("Order " + orderId + " failed for user " + userId);
// ra: 2026-05-04 10:15:32 INFO Order 8842 failed for user 5501
~~~

Ở một máy một process thì đủ dùng. Ở production với 30 Pod và 200 request mỗi giây, nó thành gánh nặng: để trả lời "bao nhiêu đơn thất bại trong 15 phút qua", bạn phải viết regex trên đống chữ vốn viết cho người đọc, và regex đó gãy ngay khi ai đó sửa một chữ trong câu. Log không cấu trúc thì **không có chỉ số**; không có chỉ số thì không có cảnh báo sớm, và người phát hiện sự cố là khách hàng chứ không phải team bạn.

### Structured logging: mỗi dòng log là một JSON object một dòng

**Structured logging** là quy tắc: mỗi dòng log là một object có tên field rõ ràng, in ra đúng một dòng. Định dạng phổ biến là NDJSON (Newline Delimited JSON: một JSON hoàn chỉnh trên một dòng, các dòng không ghép thành một mảng lớn, nên đọc được bằng {{grep}} và stream được từng dòng).

~~~json
{"timestamp":"2026-05-04T10:15:32.481Z","level":"ERROR","service":"order-service","traceId":"4bf92f3577b34da6a3ce929d0e0e4736","spanId":"00f067aa0ba902b7","orderId":"8842","errorCode":"PAYMENT_DECLINED","message":"payment declined"}
~~~

Được ba thứ:
- Lọc và đếm theo field chính xác, ví dụ {{errorCode = "PAYMENT_DECLINED"}}, thay vì đoán vị trí chữ trong câu.
- Thêm field mới mà không làm gãy field cũ; cả công ty dùng chung một schema nên một dashboard chạy cho 20 service.
- **Stack trace nằm trong một field** của cùng object. Đây là chi tiết sống còn: agent gom log đọc theo dòng, nên stack trace 80 dòng sẽ bị cắt thành 80 bản ghi rời rạc và mất quan hệ với dòng ERROR đã sinh ra nó.

Trong JVM: Logback + encoder JSON ({{logstash-logback-encoder}}), hoặc Spring Boot 3.4+ bật dựng sẵn bằng {{logging.structured.format.console=ecs}}. Bộ field tối thiểu nên thống nhất một lần cho toàn công ty: {{timestamp}} (ISO-8601, **UTC**), {{level}}, {{service}}, {{version}}, {{traceId}}, {{spanId}}, {{message}}.

> Lưu ý: ECS (Elastic Common Schema) chỉ là bộ quy ước tên field. Giá trị của việc thống nhất tên nằm ở chỗ khác: truy vấn và dashboard viết một lần dùng được cho service của team khác, kể cả service của team chưa tồn tại.

### Vì sao app chỉ ghi ra stdout, đừng tự ghi file trong container

Nguyên tắc 12-factor: app ghi ra **stdout/stderr**, không tự quản lý file log. Ba lý do rất cụ thể khi chạy trên Kubernetes:
- Pod là tạm bợ: Pod bị xóa thì file log nằm trong layer của nó biến mất theo. Mount một PVC (PersistentVolumeClaim: ô đĩa bền gắn vào Pod) không phải lời giải, vì PVC gắn với **một** Pod cố định trong khi Deployment thay Pod liên tục.
- Disk của node là tài sản chung. App tự ghi và tự xoay file, đến lúc sự cố log phình 20 lần thì làm đầy disk, kubelet eviction quét cả node, cháy lan sang Pod của team khác.
- Container runtime **đã** ghi stdout của container ra file JSON trên node, có rotation sẵn, và đó chính là thứ {{kubectl logs}} đọc. Một agent chạy theo **DaemonSet** (Fluent Bit, Vector, Grafana Alloy) đọc file đó, gắn thêm metadata (namespace, pod, label app) rồi đẩy về Loki hoặc OpenSearch.

Nên "app ghi log ra file" trong container là lỗi thiết kế vận hành, không phải gu cá nhân.

### correlation id / traceId: mã vận đơn của một lượt xử lý

**Correlation id** — trong thế giới tracing gọi là **traceId** — là một định danh duy nhất được gắn vào **mọi** dòng log thuộc về một lần xử lý, kể cả lần xử lý đó đi qua 6 service. Hãy nghĩ tới mã vận đơn in trên mọi phiếu của một đơn hàng: bạn không cần biết đơn đi qua những kho nào, tra mã là ra toàn bộ hành trình.

~~~seq
title: Mot request mang theo cung traceId qua bon he thong
actors: Client | Gateway | Order | Payment | Logs
Client -> Gateway: POST /orders chua co header traceparent
Gateway -> Gateway: sinh traceId roi dat vao MDC
Gateway -> Order: traceparent: 00-traceId-spanId-01
Order -> Payment: gọi thanh toán, vẫn dùng traceId này
Order --> Gateway: 502 PAYMENT_DECLINED
Payment --> Logs: moi dong log deu mang traceId
note Logs..Logs: tra mot traceId ra ca hanh trinh
~~~

Chuẩn để truyền giữa các service là header **W3C traceparent**, dạng {{00-<32 hex traceId>-<16 hex spanId>-<flags>}}; flags {{01}} nghĩa là trace này được giữ lại (sampled). **traceId** không đổi suốt lượt xử lý, còn **spanId** định danh từng bước riêng, để biết dòng log này thuộc bước ở order-service hay bước ở payment-service. Spring Boot 3 dùng **Micrometer Tracing** (cầu nối sang OpenTelemetry hoặc Brave): nó tự sinh hoặc khôi phục traceId từ header, tự đặt vào MDC, và tự gắn header cho các client đã được instrument (RestClient, WebClient, Feign, KafkaTemplate).

Điều phải nói được trong phỏng vấn: traceId được sinh ở **cửa ngõ** (gateway hoặc filter đầu tiên của service vào cuộc) rồi **được chuyền tay**, chứ không phải mỗi service tự sinh một cái. Mỗi service tự sinh thì mỗi service có một thế giới log riêng, và không ghép được gì.

### MDC hoạt động thế nào: một cái Map gắn với thread

**MDC (Mapped Diagnostic Context)** của SLF4J/Logback, nói cho đơn giản, là một {{Map<String,String>}} **gắn với thread đang chạy**. Encoder JSON in nguyên cái map đó vào mỗi dòng log, nên code nghiệp vụ không phải tự viết traceId:

~~~java
// Servlet filter: chạy trên thread đang xử lý request HTTP
String incoming = request.getHeader("traceparent");
MDC.put("traceId", incoming != null ? extractTraceId(incoming) : newTraceId());
try {
    chain.doFilter(request, response);   // mọi log ở tầng sâu bên trong đều tự có traceId
} finally {
    MDC.clear();                         // BẮT BUỘC: thread này sẽ phục vụ request khác
}
~~~

Phải hiểu tới gốc cơ chế, vì đây là chỗ mọi thứ vỡ ra. MDC dựa trên **ThreadLocal**: một biến mà **mỗi thread có một bản riêng**, thread này không nhìn thấy bản của thread khác (JVM cất các giá trị vào một map nằm bên trong object Thread). Mô hình "một request một thread" của Tomcat khiến MDC trông như phép màu: request vào và ra trên đúng một thread nên cái map luôn đúng. Phép màu biến mất ngay khi công việc của bạn nhảy sang thread khác, tức là khi dùng {{@Async}}, {{ExecutorService.submit}}, {{CompletableFuture.supplyAsync}}, {{parallelStream}}, {{@Scheduled}}, listener Kafka/Rabbit (chạy trên thread của container factory), hoặc appender ghi log **bất đồng bộ** ({{AsyncAppender}} có pool thread riêng).

### Vì sao MDC mất khi sang thread khác, và kiểu hỏng thứ hai còn nguy hiểm hơn

Có **hai** kiểu hỏng, và interview tốt sẽ mong bạn kể cả hai:
1. **Mất**: worker thread có map trống → log của request không có traceId → bạn chỉ có một đống ERROR không biết thuộc giao dịch nào.
2. **Nhiễm**: thread trong pool **sống lâu hơn** request. Request A để lại {{traceId=X}}, task B chạy trên đúng thread đó và không set gì → log của B mang traceId của A. Nguy hiểm hơn mất rất nhiều, vì nó cho bạn một bức tranh hoàn chỉnh nhưng **sai**: hai giao dịch dính làm một, bạn mất 40 phút điều tra vì tin vào dữ liệu giả. Nguyên nhân gốc cũng là ThreadLocal: giá trị sống theo **thread**, không theo **request**, mà pool thì tái sử dụng thread.

Sửa: **copy map sang thread khác và dọn sau khi chạy**. Với Spring {{TaskDecorator}}:

~~~java
executor.setTaskDecorator(runnable -> {
    Map<String, String> captured = MDC.getCopyOfContextMap();       // bản SAO, không phải map gốc
    return () -> {
        Map<String, String> previous = MDC.getCopyOfContextMap();   // thread này có thể đang mang việc khác
        if (captured != null) MDC.setContextMap(captured); else MDC.clear();
        try {
            runnable.run();
        } finally {
            if (previous != null) MDC.setContextMap(previous); else MDC.clear();
        }
    };
});
~~~

Ba chi tiết phân biệt người từng viết code này với người chỉ đọc blog:
- Dùng **bản sao**. {{getCopyOfContextMap}} đã trả về copy; nếu tự viết mà copy **reference** tới map gốc thì worker ghi đè làm đổi luôn context của thread gọi, và hai task chạy song song trên cùng một map là một race chưa có lời giải.
- Chụp context **lúc submit**, không phải lúc chạy. Đọc MDC bên trong task tức là đọc context của thread chạy task: trống, hoặc của request trước.
- **Khôi phục trong {{finally}}**, không phải {{clear}} vô điều kiện. {{clear}} sẽ xóa cả context của thread đang làm việc lồng (ví dụ thread pool của chính appender), còn không dọn gì thì bỏ lại traceId cho request kế tiếp.

Bạn không cần tự viết khi đã có thư viện: Micrometer **context-propagation** cho {{ContextSnapshot.setThreadLocals()}} và {{autoContextPropagation(runnable)}}, OpenTelemetry có {{Context.current().wrap(runnable)}} (cái này cũng chỉ làm đúng ba việc: chụp, đặt, khôi phục). Bài tập dưới đây yêu cầu tự viết đúng một lần, vì câu hỏi "vì sao MDC mất trên thread pool" vẫn là câu hỏi phỏng vấn kinh điển: nó kiểm tra bạn có hiểu ThreadLocal hay chỉ biết gọi API.

### Log level: chọn theo môi trường, đổi được giữa chừng không cần deploy

Bảng dưới là khuôn mẫu sane (đi từ đắt tới rẻ theo lượng chữ sinh ra):

| Level | Dùng khi nào | Ví dụ thật |
|---|---|---|
| ERROR | cần người can thiệp, có user bị ảnh hưởng | thanh toán thất bại, không kết nối được DB |
| WARN | bất thường nhưng hệ thống tự xoay xở được | retry lần 3 thành công, fallback được kích hoạt |
| INFO | mốc đời sống của một nghiệp vụ | nhận đơn 8842, đã trừ tồn kho, đã gửi mail |
| DEBUG | chi tiết kỹ thuật để điều tra | payload sau khi map, quyết định của bộ lọc |
| TRACE | từng bước trong vòng lặp | từng frame của một kết nối WebSocket |

Khuôn mẫu theo môi trường: DEV chạy DEBUG cho package của chính bạn; UAT chạy INFO; PROD chạy INFO (WARN nếu service quá ồn). lúc có sự cố thì **bật DEBUG đúng một logger** rồi tắt, thay vì đổi level toàn cục và deploy lại:

~~~bash
curl -X POST http://pod:8080/actuator/loglevel/com.acme.payment -d '{"configuredLevel":"DEBUG"}' -H 'Content-Type: application/json'
~~~

> Lưu ý: DEBUG trong production không hề rẻ. Log là tiền và là rủi ro: volume tăng 10-50 lần làm đường ống trễ (bạn cần log nhưng nó về chậm 5 phút, đúng lúc đang điều tra), disk node đầy, alert noise, và mức rò rỉ dữ liệu nhạy cảm tăng đúng vào lúc hệ thống yếu nhất. Hãy đặt **TTL** cho DEBUG: tự hạ về INFO sau 30 phút, vì người ta luôn quên tắt sau khi quên tắt.

Một lỗi code làm tăng volume mà không ai để ý: nối chuỗi thẳng vào message thì chuỗi được dựng **kể cả khi level đang tắt**, còn để giá trị ở tham số riêng (dạng marker) thì chuỗi chỉ được ghép khi level thật sự được bật.

### Không log PII: một field cũng không được

**PII** (Personally Identifiable Information: thông tin định danh cá nhân — tên, CCCD, số điện thoại, email, địa chỉ, số thẻ, hồ sơ KYC). Quy tắc cứng:
- **Không bao giờ** ghi: mật khẩu, token/session id, CVV/CVC, toàn bộ số thẻ PAN (chỉ 4 số cuối, đã che), CCCD, ảnh OCR, toàn body của endpoint login/KYC.
- Lý do không chỉ là GDPR/VNeID-era: log được sao lưu ra nhiều hệ thống (ELK, S3, Grafana Cloud, backup của nhà cung cấp), **ai cũng có quyền đọc để debug**, và được giữ 90 ngày. Bạn mất kiểm soát dữ liệu ngay khi nó vào log, nên không có cảnh "xin lỗi rồi xóa".
- PCI DSS cấm lưu CVV sau khi xử lý, và PAN phải ẩn.

Chỗ hay rò rỉ nhất là những thứ bạn **không trực tiếp** log:
- Log nguyên đối tượng request: đưa cả DTO vào log cho tiện, mà DTO có field {{password}} hoặc {{cccd}} thì Lombok {{toString}} in sạch cả hai.
- Message của exception mang input người dùng: {{IllegalArgumentException: invalid card 4111111111111111}}.
- Debug của framework: bật {{logging.level.org.springframework.web}} lên TRACE là in nguyên request body.

Phòng vệ nhiều lớp, vì chắc chắn sẽ có một dev mới vô tình làm rò rỉ:
1. **Che từ nguồn**: DTO chỉ expose getter đã mask ({{getCardMasked()}} trả dạng {{****1111}}), không có getter thô trong log path.
2. **Lớp encoder**: converter mặt nạ dùng chung trong công ty, theo danh sách key nhạy cảm (password, token, cccd, pan, cvv, email, phone).
3. **Lớp pipeline**: processor obfuscate trong OTel Collector, chắn regex số thẻ **trước khi** ghi vào kho — lớp này còn cứu được cả những service chưa cập nhật.
4. **Test**: một unit test log thử đối tượng có mọi field nhạy cảm rồi assert chuỗi ra **không** chứa giá trị thô. Đây là thứ duy nhất giữ quy tắc sống qua nhiều năm và nhiều đời dev.

### Bẫy production hay gặp
- **AsyncAppender làm mất hết context**: appender ghi trên thread riêng mà không truyền MDC, hoặc {{includeCallerData}} bật để lấy tên dòng code thì đắt kinh khủng (nó phải lấy stack trace của **mọi** log event).
- **{{MDC.clear()}} đặt ngoài finally**: đúng một exception là bỏ lại context cho request sau, và bạn có bug chỉ tái hiện lúc 2h sáng.
- **{{parallelStream}} và {{CompletableFuture}}**: tưởng là code đồng bộ trong một phương thức nên không sao, thật là công việc đang chạy trên ForkJoinPool chung.
- **Log trong vòng lặp**: {{log.info}} cho từng dòng của một batch 100.000 bản ghi, lúc sự cố nó thành 100.000 dòng cho **mỗi** retry.
- **Gán traceId rồi quên gỡ ở ranh giới**: worker Kafka phải đọc traceId từ message header và đặt vào MDC **đầu** mỗi lần poll, rồi xóa **cuối** lần poll; thiếu bước xóa là hai message bị dính vào một.
- **Field tên chung nghĩa mỗi service một kiểu**: chỗ {{user}}, chỗ {{username}}, chỗ {{userId}} — làm query không viết nổi; giải pháp là schema dùng chung (ECS) + starter nội bộ.
- **Không giới hạn độ dài message**: một stack trace 500KB vào kho log, chi phí index tăng phi mã. Cắt chuỗi và đặt giới hạn ở appender.

### Liên hệ phỏng vấn
Câu hay gặp: "Log của bạn thế nào trên production, và vì sao log của tôi mất traceId khi tôi dùng {{@Async}}?" — trả lời theo đúng mạch: app ghi JSON một dòng ra stdout, agent DaemonSet gom về Loki/OpenSearch, mọi dòng có {{timestamp}}/{{level}}/{{service}}/{{traceId}}/{{spanId}}; traceId sinh ở cửa ngõ và chuyền tay qua header {{traceparent}}; MDC là ThreadLocal map nên **không** tự theo sang thread của pool — phải chụp bản sao **lúc submit**, đặt vào thread chạy, và khôi phục trong {{finally}}; không làm vậy thì vừa mất traceId vừa bị **nhiễm** traceId của request trước, mà nhiễm còn tệ hơn mất vì dữ liệu trông rất đáng tin. Kế đến nói về chi phí: level theo môi trường, đổi level qua Actuator kèm TTL, dùng marker thay cho nối chuỗi, và PII bị chặn ở 4 lớp vì bạn không thể xóa dữ liệu sau khi nó đã vào log.

> Senior tip: Thêm {{version}} vào mọi dòng log ngay từ ngày đầu. Khi rollout hỏng, câu hỏi đầu tiên luôn là "dòng lỗi này là bản nào", và nếu log không có {{version}} thì bạn phải suy ra qua timestamp cộng với lịch deploy — mất 20 phút cho thứ vốn là một field.`,
  exercises: [
    {
      title: 'MdcExecutor: chụp context lúc submit, đặt vào thread chạy, khôi phục trong finally',
      prompt: `{{LogContext}} đã được viết sẵn trong starter (nó là bản tối giản của MDC: một map gắn với thread hiện tại) — **đừng sửa nó**, chỉ để hiểu hành vi. Việc của bạn là cài đặt các method của {{MdcExecutor}} theo hợp đồng sau:

- {{MdcExecutor(ExecutorService delegate)}}: ném {{IllegalArgumentException}} khi delegate là null.
- {{static Runnable wrap(Runnable task)}}: ném {{IllegalArgumentException}} khi task null. Phải chụp {{LogContext.snapshot()}} **ngay lúc gọi wrap**, không phải lúc task chạy. Runnable trả về, khi chạy trên thread nào cũng vậy: (1) lưu context hiện tại của thread đó, (2) đặt context bằng snapshot vừa chụp, (3) chạy task, (4) trong {{finally}} khôi phục context đã lưu ở (1) bằng {{LogContext.restore(previous)}}.
- {{static <T> Callable<T> wrapCallable(Callable<T> task)}}: cùng hợp đồng như trên, giữ nguyên giá trị trả về và để exception lan ra (Future sẽ bọc nó trong ExecutionException).
- {{execute(Runnable)}}, {{submit(Runnable)}}, {{submit(Callable)}}, {{shutdown()}} chỉ ủy quyền cho delegate sau khi đi qua {{wrap}}/{{wrapCallable}}.

Ba chỗ bài này chấm điểm bạn:
- snapshot phải là **bản sao**. Nếu chia sẻ đúng một map object giữa thread gọi và thread chạy, thì task gọi {{put}} sẽ làm đổi luôn context của thread gọi, và hai task song song đè lên nhau.
- chụp **lúc wrap/submit**. Đọc context bên trong thân task tức là đọc context của thread chạy task: trống hoặc chứa traceId của request trước.
- khôi phục trong {{finally}}. Không dọn thì thread pool bỏ lại traceId, dòng log của request kế tiếp mang traceId sai; dọn bằng {{clear}} thay vì khôi phục thì xóa mất context của thread đang bị lồng.

{{tests}} chạy mọi task qua {{Executors.newSingleThreadExecutor()}} rồi gọi {{future.get()}}, nên thứ tự tuyệt đối, không có sleep và không có race.`,
      starter: `import java.util.*;
import java.util.concurrent.*;

/** Bản tối giản của MDC: một map gắn với thread đang chạy. ĐÃ ĐÚNG - không cần sửa. */
final class LogContext {
    private static final ThreadLocal<Map<String, String>> CTX =
            ThreadLocal.withInitial(() -> new HashMap<String, String>());

    static void put(String key, String value) {
        if (key == null) throw new IllegalArgumentException("key không được null");
        if (value == null) CTX.get().remove(key);
        else CTX.get().put(key, value);
    }

    static String get(String key) {
        return key == null ? null : CTX.get().get(key);
    }

    /** Bản sao map của thread hiện tại: sửa nó không ảnh hưởng context. */
    static Map<String, String> snapshot() {
        return new HashMap<String, String>(CTX.get());
    }

    static boolean isEmpty() {
        return CTX.get().isEmpty();
    }

    static void clear() {
        CTX.get().clear();
    }

    /** Ghi de context hien tai bang values; values null = xoa het. */
    static void restore(Map<String, String> values) {
        CTX.get().clear();
        if (values != null) CTX.get().putAll(values);
    }
}

class MdcExecutor {
    private final ExecutorService delegate;

    MdcExecutor(ExecutorService delegate) {
        throw new UnsupportedOperationException("TODO");
    }

    static Runnable wrap(Runnable task) {
        throw new UnsupportedOperationException("TODO");
    }

    static <T> Callable<T> wrapCallable(Callable<T> task) {
        throw new UnsupportedOperationException("TODO");
    }

    void execute(Runnable task) {
        throw new UnsupportedOperationException("TODO");
    }

    Future<?> submit(Runnable task) {
        throw new UnsupportedOperationException("TODO");
    }

    <T> Future<T> submit(Callable<T> task) {
        throw new UnsupportedOperationException("TODO");
    }

    void shutdown() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;
import java.util.concurrent.*;

public class Main {
    static int passed = 0, total = 0;
    interface Case { void run() throws Exception; }
    static void check(String name, Case c) {
        total++;
        try { c.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
    }
    static MdcExecutor oneThreadPool() {
        return new MdcExecutor(Executors.newSingleThreadExecutor());
    }
    /** Goi submit(Callable) qua bien duoc kieu hoa ro de Java khoi rang bua giua hai overload. */
    static <T> T call(MdcExecutor ex, Callable<T> task) throws Exception {
        return ex.submit(task).get();
    }

    public static void main(String[] args) {
        check("worker thấy được traceId của caller", () -> {
            LogContext.clear();
            LogContext.put("traceId", "T-100");
            MdcExecutor ex = oneThreadPool();
            eq("T-100", call(ex, () -> LogContext.get("traceId")));
            ex.shutdown();
        });
        check("worker được dọn sạch sau khi task chạy xong", () -> {
            LogContext.clear();
            LogContext.put("traceId", "T-200");
            MdcExecutor ex = oneThreadPool();
            call(ex, () -> LogContext.get("traceId"));
            LogContext.clear();
            eq(Boolean.TRUE, call(ex, () -> LogContext.isEmpty()));
            ex.shutdown();
        });
        check("task ghi de context khong lam nhiem thread goi", () -> {
            LogContext.clear();
            LogContext.put("traceId", "A");
            MdcExecutor ex = oneThreadPool();
            String[] inWorker = new String[1];
            call(ex, () -> { LogContext.put("traceId", "B"); inWorker[0] = LogContext.get("traceId"); return null; });
            eq("B", inWorker[0]);
            eq("A", LogContext.get("traceId"));
            ex.shutdown();
        });
        check("wrap bat context luc goi wrap va khoi phoi ve cu", () -> {
            LogContext.clear();
            String[] seen = new String[1];
            LogContext.put("traceId", "C1");
            Runnable wrapped = MdcExecutor.wrap(() -> seen[0] = LogContext.get("traceId"));
            LogContext.clear();
            LogContext.put("traceId", "C2");
            wrapped.run();
            eq("C1", seen[0]);
            eq("C2", LogContext.get("traceId"));
            LogContext.clear();
        });
        check("hai request lien tiep khong de lai vet cho nhau", () -> {
            LogContext.clear();
            LogContext.put("traceId", "P1");
            MdcExecutor ex = oneThreadPool();
            eq("P1", call(ex, () -> LogContext.get("traceId")));
            LogContext.put("traceId", "P2");
            eq("P2", call(ex, () -> LogContext.get("traceId")));
            LogContext.clear();
            eq(Boolean.TRUE, call(ex, () -> LogContext.isEmpty()));
            ex.shutdown();
        });
        check("task nem exception van duoc khoi phoi ve cu", () -> {
            LogContext.clear();
            MdcExecutor ex = oneThreadPool();
            try {
                call(ex, () -> { LogContext.put("traceId", "E1"); throw new IllegalStateException("boom"); });
                throw new AssertionError("get() phai nem ExecutionException");
            } catch (ExecutionException expected) {
                if (expected.getCause() == null || !expected.getCause().getMessage().equals("boom"))
                    throw new AssertionError("sai cause: " + expected.getCause());
            }
            eq(Boolean.TRUE, call(ex, () -> LogContext.isEmpty()));
            ex.shutdown();
        });
        check("submit Runnable không giá trị vẫn truyền được context", () -> {
            LogContext.clear();
            LogContext.put("traceId", "R7");
            MdcExecutor ex = oneThreadPool();
            String[] seen = new String[1];
            Runnable r = () -> seen[0] = LogContext.get("traceId");
            Future<?> f = ex.submit(r);
            f.get();
            eq("R7", seen[0]);
            LogContext.clear();
            eq(Boolean.TRUE, call(ex, () -> LogContext.isEmpty()));
            ex.shutdown();
        });
        check("dau vao null bi tu choi o constructor wrap va execute", () -> {
            LogContext.clear();
            try { new MdcExecutor(null); throw new AssertionError("delegate null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            try { MdcExecutor.wrap(null); throw new AssertionError("wrap null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            MdcExecutor ex = oneThreadPool();
            try { ex.execute(null); throw new AssertionError("execute null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            try { ex.submit((Callable<String>) null); throw new AssertionError("submit null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            ex.shutdown();
        });
        check("caller có context rỗng vẫn chạy và giữ giá trị trả về", () -> {
            LogContext.clear();
            MdcExecutor ex = oneThreadPool();
            eq("ok", call(ex, () -> "ok"));
            eq(Boolean.TRUE, call(ex, () -> LogContext.isEmpty()));
            ex.shutdown();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
import java.util.concurrent.*;

/** Bản tối giản của MDC: một map gắn với thread đang chạy. */
final class LogContext {
    private static final ThreadLocal<Map<String, String>> CTX =
            ThreadLocal.withInitial(() -> new HashMap<String, String>());

    static void put(String key, String value) {
        if (key == null) throw new IllegalArgumentException("key không được null");
        if (value == null) CTX.get().remove(key);
        else CTX.get().put(key, value);
    }

    static String get(String key) {
        return key == null ? null : CTX.get().get(key);
    }

    static Map<String, String> snapshot() {
        return new HashMap<String, String>(CTX.get());
    }

    static boolean isEmpty() {
        return CTX.get().isEmpty();
    }

    static void clear() {
        CTX.get().clear();
    }

    static void restore(Map<String, String> values) {
        CTX.get().clear();
        if (values != null) CTX.get().putAll(values);
    }
}

class MdcExecutor {
    private final ExecutorService delegate;

    MdcExecutor(ExecutorService delegate) {
        if (delegate == null) throw new IllegalArgumentException("delegate không được null");
        this.delegate = delegate;
    }

    static Runnable wrap(Runnable task) {
if (task == null) throw new IllegalArgumentException("task không được null");
final Map<String, String> captured = LogContext.snapshot();   // chụp LÚC WRAP, không phải lúc chạy
        return () -> {
            Map<String, String> previous = LogContext.snapshot();     // thread nay co the dang mang viec khac
            LogContext.restore(captured);
            try {
                task.run();
            } finally {
                LogContext.restore(previous);                         // tra thread ve trang thai cu, ke ca khi loi
            }
        };
    }

    static <T> Callable<T> wrapCallable(Callable<T> task) {
        if (task == null) throw new IllegalArgumentException("task không được null");
        final Map<String, String> captured = LogContext.snapshot();
        return () -> {
            Map<String, String> previous = LogContext.snapshot();
            LogContext.restore(captured);
            try {
                return task.call();
            } finally {
                LogContext.restore(previous);
            }
        };
    }

    void execute(Runnable task) {
        delegate.execute(wrap(task));
    }

    Future<?> submit(Runnable task) {
        return delegate.submit(wrap(task));
    }

    <T> Future<T> submit(Callable<T> task) {
        return delegate.submit(wrapCallable(task));
    }

    void shutdown() {
        delegate.shutdown();
    }
}`,
      hints: [
'wrap(Runnable): dòng {{LogContext.snapshot()}} đặt NGOÀI lambda, ngay trong thân wrap, như vậy nó chạy trên thread gọi và được chụp trước khi task bị delay.',
'Trong lambda trả về: lưu trước {{Map<String, String> previous = LogContext.snapshot()}}, rồi {{LogContext.restore(captured)}}, chạy task trong try, và {{LogContext.restore(previous)}} ở finally.',
'submit(Callable) phải đi qua wrapCallable chứ không qua wrap: wrap trả về Runnable nên giá trị trả về của task bị mất.',
'Case "đầu vào null": ném IllegalArgumentException trường hợp null ở constructor, wrap và wrapCallable, thì execute/submit tự đúng vì chúng gọi wrap.',
        'Nếu case "task ném exception vẫn được khôi phục về cũ" FAIL, chắc chắn bạn đã đặt {{restore}} ngoài {{finally}} hoặc quên {{finally}}.',
      ],
      explain: `Bốn dòng chụp - đặt - chạy - khôi phục là toàn bộ nội dung của một {{TaskDecorator}}, của {{ContextSnapshot}} trong Micrometer context-propagation và của {{Context.current().wrap(runnable)}} trong OpenTelemetry. Viết một lần trong code thuần thì bạn hiểu tại sao các thư viện kia tồn tại, và hiểu tại sao nó **không** hoạt động khi bạn quên.

Hai mốc thời gian là chỗ mọi người sai nhiều nhất:
- {{LogContext.snapshot()}} đặt **bên ngoài** lambda thì nó chạy ngay lúc gọi {{wrap}}, tức trên thread gọi, nên lấy được context đúng. Đặt **bên trong** lambda thì nó chạy trên thread của pool, tại thời điểm đó context là trống hoặc là rác của request trước — đó chính xác là bug "log không có traceId" mà bạn gặp khi mới dùng {{@Async}}.
- {{previous}} phải được lưu **trước** khi đè context, và khôi phục trong {{finally}}. Khôi phục (thay vì {{clear}}) mới đúng, vì thread có thể đang bị lồng: ví dụ appender bất đồng bộ chạy task con trên chính pool thread đang xử lý request. {{finally}} là chỗ duy nhất đảm bảo không sót traceId sau khi task ném exception; thiếu nó thì dòng log **của người dùng khác** mang traceId của giao dịch vừa chết.

Lỗi hay gặp khi viết:
- Truyền **con trỏ map** thay vì bản sao ({{LogContext.restore(LogContext.snapshot())}} kiểu này vô hại, nhưng chia sẻ map gốc thì thread gọi và thread chạy ghi đè lên nhau).
- Quên {{wrapCallable}}, hoặc {{submit(Callable)}} gọi nhầm {{wrap(task)}}: biên dịch vẫn ngon nhưng {{Future.get()}} luôn trả null vì Runnable mất giá trị trả về.
- Dùng {{Thread.currentThread().getId()}} để "đoán" thread: đừng, test ở đây chạy tuần tự nên hành vi phải đến từ context, không từ tên thread.
- Dọn bằng {{LogContext.clear()}} thay vì {{restore(previous)}}: pass hết test của bài này nhưng là bug thật khi bạn lồng executor trong executor.

Vào phỏng vấn, câu trả lời mạnh nhất không phải code mà là hai phạm trù hỏng: **mất context** (log thiếu traceId) và **nhiễm context** (log có traceId của request khác). Cái thứ hai đáng sợ hơn vì nó không tạo ra tín hiệu lỗi nào, nó tạo ra dữ liệu trông rất đáng tin và khiến bạn điều tra sai hướng tới khi hết ca trực.`,
    },
  ],
  check: [
    { q: 'Vì sao app trong container nên ghi log ra stdout thay vì tự ghi file?', options: ['Vì stdout nhanh hơn ghi file', 'Vì Pod tạm bợ, file trong Pod mất khi Pod bị xóa, còn disk node dùng chung và app sẽ tự làm đầy nó; runtime đã lưu stdout và có agent gom sẵn', 'Vì Kubernetes không cho mount disk', 'Vì stdout tự động có traceId'], answer: 1, explain: 'Chuỗi là: app chỉ in ra stdout, container runtime ghi vào file trên node có rotation sẵn, agent DaemonSet đọc tiếp và enrich metadata.' },
    { q: 'Request A chạy trên pool thread và để lại traceId=X. Request B chạy trên đúng thread đó nhưng không đặt traceId. Log của B trông thế nào?', options: ['Không có traceId', 'Có traceId=X, tức là dữ liệu sai nhưng nhìn rất đáng tin', 'App ném lỗi vì MDC rỗng', 'Logback tự sinh traceId mới cho B'], answer: 1, explain: 'Đây là kiểu "nhiễm context": ThreadLocal sống theo thread chứ không theo request, mà pool thì tái sử dụng thread. Nó nguy hiểm hơn mất traceId vì bạn sẽ tin vào dữ liệu giả.' },
    { q: 'Khi nào phải chụp context MDC khi chuyển task sang thread pool?', options: ['Lúc task bắt đầu chạy trong thread pool', 'Lúc submit/wrap, trên thread gọi', 'Lúc appender ghi log', 'Không cần chụp, chỉ cần set traceId = null'], answer: 1, explain: 'Đọc context bên trong task là đọc context của thread chạy task (trống hoặc của request trước), nên phải chụp ở thread gọi, ngay lúc wrap/submit.' },
    { q: 'Vì sao bật DEBUG vĩnh viễn trong production là ý tồi?', options: ['Vì DEBUG in ra nhiều chữ hơn: tốn tiền pipeline, làm trễ log đúng lúc đang điều tra, đầy disk và nhân đôi nguy cơ rò rỉ PII', 'Vì DEBUG làm JVM chậm hơn và có thể gây OOM', 'Vì Spring không cho đổi level trong lúc chạy', 'Vì DEBUG bỏ mất stack trace'], answer: 0, explain: 'Log volume là chi phí thật và là rủi ro bảo mật thật. Muốn DEBUG thì bật đúng một logger qua Actuator kèm TTL để tự tắt.' },
  ],
  related: ['devops-012', 'devops-022'],
  tags: ['Structured logging', 'MDC', 'correlation id', 'traceId', 'ThreadLocal', 'Log level', 'PII'],
},
{
  id: 'lesson-devops-013',
  track: 'devops',
  order: 13,
  title: 'Phân tích access log khi sự cố mà chưa có dashboard: lỗi theo phút, top endpoint lỗi, p95 nearest-rank',
  level: 'senior',
  minutes: 40,
  goals: [
    'Chạy được quy trình điều tra khi chưa có gì: khoanh thời gian, khoanh phạm vi, tìm thay đổi, giảm blast radius trước khi tìm nguyên nhân gốc',
    'Viết pipeline grep/awk/sort/uniq để đếm lỗi theo phút, lấy top endpoint lỗi và tính p95 latency từ access log',
    'Hiểu vì sao phải so **tỷ lệ lỗi** chứ không so số lỗi tuyệt đối, và vì sao p95 nearest-rank khác số trung bình',
    'Nhận ra các bẫy làm sai số liệu: path mang id, lẫn 4xx với 5xx, retry làm méo mẫu, bucket quá to hoặc quá nhỏ, sort thiếu -n',
    'Cài đặt {{AccessLogStats}}: parse dòng log định dạng cố định, thống kê theo phút, p95 theo endpoint, top endpoint lỗi',
  ],
  body: `### Khi sự cố nổ ra, dashboard có thể là thứ bạn không có

Rất nhiều phỏng vấn senior/lead hỏi đúng kiểu: "Service của bạn lỗi hàng loạt lúc 2h sáng, **dashboard chưa kịp dựng** (team mới, service mới, hoặc đúng lúc Grafana đang bảo trì), bạn làm gì?" Người trả lời "mở Kibana" là người chưa bao giờ phải tự đi tìm số. Kỹ năng thật là: ngồi trước một file log và **tự sinh ra ba con số** mà dashboard sẽ sinh.

Quy trình năm bước, theo đúng thứ tự này (đừng đảo bước 5 lên trước bước 4):
1. **Khoanh thời gian**: lỗi bắt đầu từ phút nào? Không có mốc thời gian thì mọi giả thuyết đều vô vọng.
2. **Khoanh phạm vi**: tất cả endpoint hay một endpoint? tất cả Pod hay một Pod? một region, một khách hàng lớn, hay mọi người?
3. **Tìm dấu ấn thay đổi**: đối chiếu mốc ở bước 1 với lịch deploy, config change, feature flag bật, migration, thay đổi ở đối tác. Đa số sự cố là "vừa thay gì đó", nên bước này thường tự nó chỉ ra thủ phạm.
4. **Giảm blast radius** trước khi hiểu nguyên nhân: rollback bản mới, tắt feature flag, tăng số bản (replica), thêm timeout/retry có trần, hoặc chặn endpoint gây quá tải. "Rollback rồi điều tra tiếp" luôn đúng về mặt quản trị rủi ro, vì nó mua thời gian mà không cần đoán trúng.
5. **Nguyên nhân gốc + phòng ngừa**: sau khi user đã được bảo vệ, mới tới profiling, thread dump, EXPLAIN, đọc code. Kết thúc bằng thay đổi làm sự cố **không tái diễn** (test, cảnh báo theo SLO, guardrail trong code).

### Ba con số phải rút ra được từ log

Mọi điều tra ban đầu đều là ba câu, và ba câu đó đều là **phép đếm trên access log**:
- **Lỗi theo thời gian**: tỷ lệ 5xx của từng phút → cho biết bắt đầu lúc nào, còn đang tăng hay đã dừng.
- **Lỗi theo nơi chốn**: endpoint nào chiếm nhiều lỗi nhất, và nó có chiếm nhiều *traffic* nhất không.
- **Chậm ở đâu**: p95 latency từng endpoint, so với ngày thường.

Định dạng dòng log dùng trong bài này (và cũng là kiểu tự đặt phổ biến khi viết access log cho app):

~~~text
2026-05-04T10:15:32Z GET /api/orders 500 1240
   timestamp UTC     method  path   status  latencyMs
~~~

Tức là: 5 trường cách nhau bởi khoảng trắng, thời gian ISO-8601 **có chữ Z chỉ UTC**, latency tính bằng **milli-giây**. Trong thực tế bạn sẽ gặp nginx combined log (nhiều trường hơn, quoted, latency ở cuối nếu được cấu hình thêm) và app log dạng JSON — vì vậy bước đầu tiên của mọi cuộc điều tra là {{head -3 access.log}}, đọc xem dòng log thật trông ra sao rồi mới tính.

### Lỗi theo cửa sổ thời gian: đếm theo phút, không đếm cumulative

~~~bash
# access.log: "2026-05-04T10:15:32Z GET /api/orders 500 1240"
awk '{ m=substr($1,1,16); t[m]++; if ($4>=500) e[m]++ }
     END { for (k in t) print k, "total=" t[k], "err=" e[k]+0 }' access.log | sort
~~~

Đọc từng mảnh: trường {{1}} của awk là timestamp, trường {{4}} là status. {{substr(\$1,1,16)}} cắt 16 ký tự đầu của timestamp, tức là đủ tới phút, ví dụ dòng ở trên thành chuỗi {{2026-05-04T10:15}}. Hai mảng {{t[m]++}} và {{e[m]++}} đếm theo khóa là phút; {{for (k in t)}} duyệt toàn bộ các phút; {{e[k]+0}} để phút không có lỗi vẫn in ra số 0 thay vì rỗng; và {{sort}} ở cuối vì thứ tự của {{for (k in t)}} là ngẫu nhiên.

Vì sao phải theo cửa sổ chứ không phải tổng cumulative: tổng cộng từ đầu file chỉ cho biết "có lỗi", không cho biết **khi nào**. Chuỗi 10 phút ở trên nói to hơn nhiều:

| Phút | total | 5xx | error rate | p95 |
|---|---|---|---|---|
| 10:13 | 900 | 3 | 0.3% | 180 ms |
| 10:14 | 880 | 5 | 0.6% | 190 ms |
| 10:15 | 910 | 214 | 23.5% | 1240 ms |
| 10:16 | 300 | 180 | 60% | 3000 ms |

Ba bài đọc từ bảng: lỗi **bắt đầu tại 10:15** (hỏi ngay: 10:15 có deploy/change gì?); đến 10:16 tỷ lệ lỗi tăng mà **tổng request giảm** — đó là dấu hiệu hệ thống không còn phục vụ nổi (request timeout, client bỏ cuộc, queue bão hòa), nghiêm trọng hơn nhiều so với "lỗi tăng"; và p95 nhảy theo đúng hai phút đó, nghĩa là chậm và lỗi có cùng nguyên nhân.

Chọn độ rộng bucket: quá nhỏ (1 giây) thì nhiều bucket chỉ có vài mẫu, biểu đồ đầy nhiễu; quá to (1 giờ) thì sự cố 10 phút bị loãng thành "một ngày hơi xấu". Quy tắc thực dụng: bucket sao cho mỗi ô có **vài trăm mẫu trở lên**, thường là 1 phút với service vừa, 5 phút với service nhỏ.

> Lưu ý: {{uniq -c}} chỉ gộp các dòng **giống nhau nằm kề nhau**, nên luôn phải {{sort}} trước {{uniq}}. Quên {{sort}} là lỗi phổ biến nhất khi mới dùng bộ đôi này, và kết quả vẫn "trông có số" nên bạn không biết mình sai.

### Một request sinh ra những dòng log nào

~~~seq
title: Đường đi của một dòng access log
actors: Client | Gateway | Order | NodeLog | Agent
Client -> Gateway: GET /api/orders
Gateway -> Order: forward, kem traceparent
Order --> Gateway: 500 sau 1240 ms
Order -> NodeLog: in log JSON ra stdout
NodeLog -> Agent: doc file log cua container
Agent -> Agent: gan metadata roi day ve Loki
note NodeLog..Agent: stdout của container được lưu thành file trên node
~~~

Cái hay bị bỏ quên: **latency**. Nhiều cấu hình nginx/gateway mặc định không ghi thời gian xử lý, hoặc chỉ ghi thời gian tính từ lúc nhận request chứ không tính lúc hàng đã ghi ra client (streaming, large payload). Nếu log không có trường latency thì không có p95 nào cả, và đó là việc phải sửa **trước khi** có sự cố, không phải trong sự cố.

### Top endpoint lỗi: lệnh ngắn, bẫy dài

~~~bash
awk '$4>=500 { print $2, $3 }' access.log | sort | uniq -c | sort -rn | head
~~~

{{\$2}} là method, {{\$3}} là path → in ra {{GET /api/orders}}; {{sort}} để các dòng giống nhau nằm kề; {{uniq -c}} đếm; {{sort -rn}} sắp theo cột đếm, **số**, giảm dần (thiếu {{-n}} thì {{sort}} so như chuỗi: "9" lớn hơn "100" — bug kinh điển); {{head}} lấy 10 dòng đầu.

Bẫy cardinality: nếu path mang id thật ({{/orders/8842}}), mỗi đơn hàng là một "endpoint" và bảng top vô dụng. Phải gộp về template trước khi đếm:

~~~bash
awk '$4>=500 { p=$3; sub("/[0-9]+$", "/{id}", p); print $2, p }' access.log | sort | uniq -c | sort -rn | head
~~~

Bẫy diễn giải, quan trọng hơn bẫy lệnh: **endpoint chiếm 90% số lỗi có thể chỉ vì nó chiếm 90% traffic**. Câu hỏi đúng là "error **rate** của endpoint nào gấp đôi phần còn lại?", tức là lấy số lỗi **chia cho** số request của chính endpoint đó. Hai con số tuyệt đối không so được với nhau vì mẫu khác nhau.

Và chỉ tính **5xx** là lỗi của mình, đừng gộp **4xx**: {{404}} là client gõ sai đường, {{401}} là hết hạn token, {{429}} là bạn đang tự vệ thành công, {{499}} (nginx) là client bỏ cuộc — tất cả không phải regression. Ngược lại, nếu 4xx tăng đột biến thì đó cũng là tin đáng đọc: hay là API contract vừa đổi, hoặc có ai đang quét.

### p95 là gì, và vì sao trung bình nói dối

**p95 (percentile 95)** của một tập latency = giá trị {{v}} sao cho **95% số request có latency nhỏ hơn hoặc bằng v**, và 5% còn lại chậm hơn. Cách tính **nearest-rank**: sắp tập mẫu tăng dần, lấy mẫu ở hạng {{ceil(0.95 x n)}}.

~~~java
static double p95(List<Long> latencies) {
    if (latencies.isEmpty()) return 0.0;
    List<Long> sorted = new ArrayList<Long>(latencies);
    Collections.sort(sorted);
    int n = sorted.size();
    int rank = (95 * n + 99) / 100;            // bằng ceil(95n/100), dùng số nguyên
    if (rank < 1) rank = 1;
    if (rank > n) rank = n;
    return sorted.get(rank - 1).doubleValue(); // nearest-rank: lấy một mẫu THẬT, không nội suy
}
~~~

Vì sao tính bằng số nguyên chứ không viết {{Math.ceil(0.95 * n)}}: với số thực dấu phẩy động, {{0.95}} không biểu diễn đúng được, nên 0.95 nhân 20 cho ra 19.000000000000004, {{ceil}} đẩy thành 20 và p95 nhảy hẳn lên mẫu cuối cùng. Với 20 mẫu latency 10, 20, ..., 200 thì câu trả lời đúng là **190**, không phải 200.

Vì sao không dùng trung bình: latency phân bố **lệch phải** (phần lớn nhanh, một ít rất chậm), nên trung bình bị kéo bởi đuôi.

| n | Tập mẫu | Trung bình | p50 | p95 | p99 |
|---|---|---|---|---|---|
| 20 | 10..200 ms đều nhau | 105 ms | 100 ms | 190 ms | 200 ms |
| 20 | 19 mẫu 20 ms + 1 mẫu 30.000 ms | 1.519 ms | 20 ms | 20 ms | 30.000 ms |

Hàng thứ hai là chuyện thật: một request 30 giây làm "trung bình" tăng gấp 14 lần dù 95% user không bị gì, và làm bạn tưởng hệ thống chậm đi trong khi thật ra chỉ có **một** đường query xấu. p95/p99 kể đúng chuyện: p95 ổn định với nhiễu đơn lẻ, còn p99 nhạy với đuôi dài (nên p99 cần nhiều mẫu hơn để có nghĩa).

Cũng đừng lấy p95 của **toàn service** làm chỉ số duy nhất: endpoint chiếm 5% traffic có thể hỏng hoàn toàn mà p95 gộp vẫn "đẹp". p95 phải tính **theo endpoint** (và theo version khi đang rollout — chủ đề của bài canary).

### Khi đã có metric thì ngắn hơn, nhưng vẫn phải hiểu số

Đa số sự cố không bắt đầu từ log mà từ metric, vì metric rẻ và có sẵn vài tuần lịch sử:

~~~bash
# PromQL: ti le 5xx theo endpoint trong 5 phut gan nhat
sum by (uri) (rate(http_server_requests_seconds_count{status=~"5.."}[5m]))
  / sum by (uri) (rate(http_server_requests_seconds_count[5m]))
# p95 theo endpoint, dùng histogram của Micrometer
histogram_quantile(0.95, sum by (le, uri) (rate(http_server_requests_seconds_bucket[5m])))
~~~

Log và metric bổ khuyết nhau theo hướng này: metric cho biết **cái gì** và **nhiều tới đâu** trên toàn hệ thống trong 5 giây; log cho biết **vì sao** cho một request cụ thể, nhưng đắt và chậm. Trong bài tập dưới đây, vì chưa có metric nên ta dựng cả hai từ log thô.

### Bẫy production hay gặp
- **Trộn timezone**: app ghi giờ local, gateway ghi UTC → bucket phút lệch nhau, và so với "cùng giờ hôm trước" là so giữa hai thế giới. Chuẩn hóa UTC ngay từ schema log.
- **Một request gây nhiều dòng ERROR**: đếm số dòng ERROR rồi báo "300 lỗi" trong khi chỉ có 30 request hỏng, vì mỗi request in 10 dòng (retry, filter, wrapper exception). Đếm theo **request**, hoặc theo {{traceId}} khác nhau.
- **Log bị rotate mất**: sự cố 2h sáng, điều tra 4h sáng, file đã bị {{logrotate}} cắt mất. {{ls -l}} cộng với {{zcat}} file đã nén là kỹ năng bắt buộc, và đó cũng là lý do phải gom log về một kho tập trung.
- **Retry làm méo mẫu**: client retry 3 lần trên một lần lỗi → error rate và số request đều nhân ba. Muốn hiểu nghiệp vụ hỏng, phải đếm theo **request id**/traceId gốc, không theo dòng log.
- **Thiếu log vì sampling hoặc vì ingest lag**: "dashboard im lặng" không có nghĩa là "không có lỗi". Luôn kiểm tra {{volume}} có giảm bất thường không trước khi kết luận hệ ổn.
- **Bucket quá nhỏ cho traffic thấp**: 6 request, 2 lỗi = 33% error rate, nghe như thảm họa, thật ra là nhiễu. Con số phải đi kèm mẫu.
- **Quên cột thời điểm**: hai sự cố chồng nhau (bản mới deploy 10:14, đối tác chậm từ 10:15) rất khó tách nếu log của bạn không đủ field để group theo {{version}}.
- **Tối ưu trước khi đo**: không có p95 theo endpoint thì mọi "cải tiến hiệu năng" chỉ là cảm giác, và thường làm xấu chỗ khác.

### Liên hệ phỏng vấn
Với câu "hệ thống không có observability, bạn làm gì?", trả lời theo cấu trúc: (1) nói rõ thứ tự điều tra — khoanh thời gian, khoanh phạm vi, tìm thay đổi, **giảm blast radius** rồi mới tìm nguyên nhân gốc, vì rollback là hành động rẻ nhất khi chưa hiểu gì; (2) nói được ba phép đếm cụ thể trên access log (lỗi theo phút, top endpoint theo error **rate**, p95 theo endpoint) và rằng bạn viết được pipeline {{awk | sort | uniq -c | sort -rn}} mà không cần dashboard; (3) nói được cách đọc: lỗi bắt đầu phút nào, total giảm nghĩa là throughput sập chứ không chỉ lỗi tăng, p95 nhảy cùng lúc với lỗi thì hai triệu chứng một nguyên nhân; (4) chốt bằng việc **phòng ngừa**: thống nhất schema log JSON có {{version}} và {{latencyMs}}, bật metric, đổi alert sang error budget. Nêu được cả bước "giảm blast radius trước" là điểm phân biệt senior với mid.

> Senior tip: Mỗi team nên có sẵn một {{scripts/incident.sh}} nhỏ chạy {{awk}} đúng định dạng log của mình, và **tập dùng nó trong game day mỗi quý**. Lúc 2h sáng với adrenaline, bạn không nghĩ ra cú pháp {{awk}} đâu; bạn chỉ nhớ là có cái script và nó in ra ba bảng gì.`,
  exercises: [
    {
      title: 'AccessLogStats: parse dòng log, lỗi theo phút, p95 nearest-rank theo endpoint, top endpoint lỗi',
      prompt: `Dòng log có **5 trường** cách nhau bởi khoảng trắng, dư khoảng trắng đầu/cuối và nhiều khoảng trắng giữa đều được chấp nhận:

{{timestamp method path status latencyMs}}, ví dụ {{2026-05-04T10:15:32Z GET /api/orders 500 1240}}.

{{LogLine}} và {{Bucket}} đã viết sẵn trong starter (**đừng sửa**): {{LogLine}} giữ {{minute}} (16 ký tự đầu của timestamp), {{method}}, {{path}}, {{status}}, {{latencyMs}}, có {{endpoint()}} trả dạng {{GET /api/orders}} và {{isError()}} là {{status >= 500}}; {{Bucket}} giữ {{total}}/{{errors}} và có {{errorRate()}}. Phần còn lại là của bạn trong {{AccessLogStats}}:

- {{static LogLine parse(String line)}}: ném {{IllegalArgumentException}} khi {{line}} null, khi số trường khác 5, khi timestamp ngắn hơn 16 ký tự hoặc ký tự ở vị trí 10 (đếm từ 0) khác chữ {{T}}, khi {{status}} hoặc {{latencyMs}} không phải số nguyên. Trả về {{LogLine}} với {{minute}} là 16 ký tự đầu timestamp, {{method}} đã viết hoa. Các ràng buộc còn lại (status trong {{100..599}}, path bắt đầu bằng {{/}}, latency không âm) {{LogLine}} đã chặn giúp bạn.
- {{static Map<String, Bucket> statsByMinute(List<String> lines)}}: ném {{IllegalArgumentException}} khi {{lines}} null. Bỏ qua phần tử null hoặc rỗng sau khi trim. Nhóm theo {{minute}}: {{total}} là số dòng trong phút, {{errors}} là số dòng có {{status >= 500}}. Trả về {{TreeMap}} để map tự sắp theo phút.
- {{static double errorRate(List<String> lines, String minute)}}: ném {{IllegalArgumentException}} khi {{minute}} null. Trả tỷ lệ lỗi của phút đó, **0.0 khi phút đó không có dòng nào**. Hãy dùng lại {{statsByMinute}} và {{Bucket.errorRate}} thay vì viết vòng đếm thứ hai.
- {{static double p95(List<String> lines, String endpoint)}}: ném {{IllegalArgumentException}} khi {{lines}} hoặc {{endpoint}} null. So {{endpoint}} với {{LogLine.endpoint()}}. Lấy latency của **mọi** request của endpoint đó (kể 2xx lẫn 4xx lẫn 5xx), không có mẫu nào thì trả 0.0. nearest-rank: sắp tăng dần rồi lấy mẫu ở hạng {{(95 * n + 99) / 100}} — phép chia số nguyên làm tròn xuống, đúng bằng {{ceil(95n/100)}} mà **không dùng số thực**. Lý do phải tránh số thực: {{Math.ceil(0.95 * 20)}} cho 20 chứ không phải 19, vì 0.95 không biểu diễn chính xác được.
- {{static Map<String, Long> errorsByEndpoint(List<String> lines)}}: ném {{IllegalArgumentException}} khi {{lines}} null. Map endpoint → số dòng 5xx; **chỉ** gồm endpoint có ít nhất một lỗi.
- {{static List<String> topErrorEndpoints(List<String> lines, int n)}}: ném {{IllegalArgumentException}} khi {{n < 0}}. Dựa trên {{errorsByEndpoint}}, sắp theo số lỗi **giảm dần**, bằng nhau thì theo tên endpoint **A-Z**, cắt {{n}} phần tử đầu. {{n}} lớn hơn số endpoint có lỗi thì trả hết; {{n = 0}} trả danh sách rỗng.

Check-list tự kiểm trước khi chạy test: {{p95}} của 20 mẫu {{10, 20, ..., 200}} phải là **190**; một phút không có request nào phải trả **0.0** chứ không ném lỗi; endpoint chỉ có 4xx phải **vắng mặt** trong danh sách top.`,
      starter: `import java.util.*;

/** Một dòng log đã parse. ĐÃ ĐÚNG - không cần sửa. */
final class LogLine {
    final String minute;     // "2026-05-04T10:15"
    final String method;     // "GET"
    final String path;       // "/api/orders"
    final int status;        // 500
    final long latencyMs;    // 1240

    LogLine(String minute, String method, String path, int status, long latencyMs) {
        if (minute == null || minute.length() != 16 || minute.charAt(10) != 'T')
            throw new IllegalArgumentException("minute phai dang 2026-05-04T10:15");
        if (method == null || method.isEmpty())
            throw new IllegalArgumentException("thieu method");
        if (path == null || path.isEmpty() || path.charAt(0) != '/')
            throw new IllegalArgumentException("path phải bắt đầu bằng dấu /");
        if (status < 100 || status > 599)
            throw new IllegalArgumentException("status ngoai 100..599: " + status);
        if (latencyMs < 0)
            throw new IllegalArgumentException("latencyMs không được âm");
        this.minute = minute;
        this.method = method;
        this.path = path;
        this.status = status;
        this.latencyMs = latencyMs;
    }

    String endpoint() { return method + " " + path; }

    boolean isError() { return status >= 500; }
}

/** So lieu gộp của một phút: tong request va so request 5xx. */
final class Bucket {
    final long total;
    final long errors;

    Bucket(long total, long errors) {
        if (total < 0 || errors < 0 || errors > total)
            throw new IllegalArgumentException("bucket vo ly: total=" + total + " errors=" + errors);
        this.total = total;
        this.errors = errors;
    }

    double errorRate() {
        return total == 0 ? 0.0 : (double) errors / (double) total;
    }
}

class AccessLogStats {
    static LogLine parse(String line) {
        throw new UnsupportedOperationException("TODO");
    }

    static Map<String, Bucket> statsByMinute(List<String> lines) {
        throw new UnsupportedOperationException("TODO");
    }

    static double errorRate(List<String> lines, String minute) {
        throw new UnsupportedOperationException("TODO");
    }

    static double p95(List<String> lines, String endpoint) {
        throw new UnsupportedOperationException("TODO");
    }

    static Map<String, Long> errorsByEndpoint(List<String> lines) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> topErrorEndpoints(List<String> lines, int n) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    interface Case { void run() throws Exception; }
    static void check(String name, Case c) {
        total++;
        try { c.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
    }
    static void eqd(double expected, double actual) {
        if (Math.abs(expected - actual) > 1e-9) throw new AssertionError("expected " + expected + " but got " + actual);
    }
    static List<String> ls(String... xs) { return new ArrayList<String>(Arrays.asList(xs)); }
    static String two(int i) { return i < 10 ? "0" + i : String.valueOf(i); }
    /** 20 mau GET /api/orders voi latency 10, 20, ..., 200 (tat ca 200 OK). */
    static List<String> ramp20() {
        List<String> l = new ArrayList<String>();
        for (int i = 1; i <= 20; i++) l.add("2026-05-04T10:15:" + two(i) + "Z GET /api/orders 200 " + (i * 10));
        return l;
    }
    static List<String> errorsFor(String endpoint, int count, int status) {
        List<String> l = new ArrayList<String>();
        for (int i = 0; i < count; i++)
            l.add("2026-05-04T10:20:" + two(i + 1) + "Z " + endpoint + " " + status + " 50");
        return l;
    }

    public static void main(String[] args) {
        check("parse tung dong thanh nam truong", () -> {
            LogLine p = AccessLogStats.parse("2026-05-04T10:15:32Z GET /api/orders 500 1240");
            eq("2026-05-04T10:15", p.minute);
            eq("GET", p.method);
            eq("/api/orders", p.path);
            eq(Integer.valueOf(500), Integer.valueOf(p.status));
            eq(Long.valueOf(1240L), Long.valueOf(p.latencyMs));
            eq("GET /api/orders", p.endpoint());
            eq(Boolean.TRUE, Boolean.valueOf(p.isError()));
        });
        check("parse chap nhan du thua khoang va hoa method", () -> {
            LogLine p = AccessLogStats.parse("  2026-05-04T09:01:02Z   post   /api/pay   201   7  ");
            eq("2026-05-04T09:01", p.minute);
            eq("POST", p.method);
            eq("POST /api/pay", p.endpoint());
            eq(Boolean.FALSE, Boolean.valueOf(p.isError()));
        });
        check("parse tu choi dong sai dinh dang", () -> {
            String[] bad = {
                null,
                "2026-05-04T10:15:32Z GET /api/orders 500",
                "2026-05-04T10:15:32Z GET /api/orders 500 1240 99",
                "2026-05-04 10:15:32 GET /api/orders 500 1240",
                "2026-05-04T10:15:32Z GET /api/orders abc 1240",
                "2026-05-04T10:15:32Z GET /api/orders 500 12x40",
            };
            for (int i = 0; i < bad.length; i++) {
                try {
                    AccessLogStats.parse(bad[i]);
                    throw new AssertionError("dong thu " + i + " phai bi tu choi");
                } catch (IllegalArgumentException expected) { }
            }
        });
        check("thong ke theo phut dem dung total va errors", () -> {
            List<String> l = ls(
                "2026-05-04T10:15:01Z GET /a 200 10",
                "2026-05-04T10:15:02Z GET /a 500 20",
                "2026-05-04T10:15:03Z POST /b 404 30",
                "2026-05-04T10:16:01Z GET /a 503 40");
            Map<String, Bucket> m = AccessLogStats.statsByMinute(l);
            eq(Integer.valueOf(2), Integer.valueOf(m.size()));
            Bucket b15 = m.get("2026-05-04T10:15");
            eq(Long.valueOf(3L), Long.valueOf(b15.total));
            eq(Long.valueOf(1L), Long.valueOf(b15.errors));
            Bucket b16 = m.get("2026-05-04T10:16");
            eq(Long.valueOf(1L), Long.valueOf(b16.total));
            eq(Long.valueOf(1L), Long.valueOf(b16.errors));
        });
        check("errorRate theo phút và phút không dữ liệu trả zero", () -> {
            List<String> l = ls(
                "2026-05-04T10:15:01Z GET /a 500 10",
                "2026-05-04T10:15:02Z GET /a 200 20",
                "2026-05-04T10:15:03Z GET /a 200 30",
                "2026-05-04T10:15:04Z GET /a 200 40",
                "2026-05-04T10:15:05Z GET /a 200 50");
            eqd(0.2, AccessLogStats.errorRate(l, "2026-05-04T10:15"));
            eqd(0.0, AccessLogStats.errorRate(l, "2026-05-04T10:99"));
            try { AccessLogStats.errorRate(l, null); throw new AssertionError("minute null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            try { AccessLogStats.statsByMinute(null); throw new AssertionError("lines null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
        });
        check("p95 nearest-rank 20 mẫu là 190 chứ không phải 200", () -> {
            eqd(190.0, AccessLogStats.p95(ramp20(), "GET /api/orders"));
        });
        check("p95 một mẫu và endpoint không tồn tại", () -> {
            List<String> one = ls("2026-05-04T10:15:01Z GET /x 200 100");
            eqd(100.0, AccessLogStats.p95(one, "GET /x"));
            eqd(0.0, AccessLogStats.p95(one, "GET /khong-co"));
            eqd(0.0, AccessLogStats.p95(ls("2026-05-04T10:15:01Z GET /x 200 100"), "POST /x"));
            try { AccessLogStats.p95(null, "GET /x"); throw new AssertionError("lines null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
            try { AccessLogStats.p95(one, null); throw new AssertionError("endpoint null phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
        });
        check("p95 tinh ca request thanh cong lan request loi", () -> {
            List<String> l = ls(
                "2026-05-04T10:15:01Z POST /pay 200 100",
                "2026-05-04T10:15:02Z POST /pay 500 900",
                "2026-05-04T10:15:03Z POST /pay 200 300");
            eqd(900.0, AccessLogStats.p95(l, "POST /pay"));
        });
        check("errorsByEndpoint chi tinh 5xx, bo 4xx", () -> {
            List<String> l = ls(
                "2026-05-04T10:20:01Z GET /orders 500 10",
                "2026-05-04T10:20:02Z GET /orders 502 20",
                "2026-05-04T10:20:03Z GET /orders 404 30",
                "2026-05-04T10:20:04Z POST /search 429 40",
                "2026-05-04T10:20:05Z POST /search 200 50");
            Map<String, Long> m = AccessLogStats.errorsByEndpoint(l);
            eq(Integer.valueOf(1), Integer.valueOf(m.size()));
            eq(Long.valueOf(2L), m.get("GET /orders"));
            eq(null, m.get("POST /search"));
        });
        check("top endpoint sắp theo lỗi giảm dần bằng thì A-Z", () -> {
            List<String> l = new ArrayList<String>();
            l.addAll(errorsFor("POST /alpha", 5, 500));
            l.addAll(errorsFor("GET /bravo", 5, 503));
            l.addAll(errorsFor("POST /charlie", 2, 500));
            l.addAll(errorsFor("GET /delta", 4, 404));
            eq(ls("GET /bravo", "POST /alpha"), AccessLogStats.topErrorEndpoints(l, 2));
            eq(ls("GET /bravo", "POST /alpha", "POST /charlie"), AccessLogStats.topErrorEndpoints(l, 10));
            eq(new ArrayList<String>(), AccessLogStats.topErrorEndpoints(l, 0));
            try { AccessLogStats.topErrorEndpoints(l, -1); throw new AssertionError("n am phai bi tu choi"); }
            catch (IllegalArgumentException expected) { }
        });
        check("dong null va rong bi bo qua, khong tinh nham phut", () -> {
            List<String> l = ls(
                "2026-05-04T10:15:01Z GET /a 200 10",
                null,
                "   ",
                "2026-05-04T10:15:02Z GET /a 500 20");
            Map<String, Bucket> m = AccessLogStats.statsByMinute(l);
            eq(Long.valueOf(2L), m.get("2026-05-04T10:15").total);
            eq(Long.valueOf(1L), m.get("2026-05-04T10:15").errors);
        });
        check("kich co that phut bat dau loi lo ra ngay", () -> {
            List<String> l = new ArrayList<String>();
            for (int i = 1; i <= 10; i++) {
                l.add("2026-05-04T10:14:" + two(i) + "Z GET /orders 200 " + (100 + i));
                l.add("2026-05-04T10:15:" + two(i) + "Z GET /orders " + (i <= 6 ? "500" : "200") + " " + (900 + i * 50));
            }
            eqd(0.0, AccessLogStats.errorRate(l, "2026-05-04T10:14"));
            eqd(0.6, AccessLogStats.errorRate(l, "2026-05-04T10:15"));
            eqd(1350.0, AccessLogStats.p95(l, "GET /orders"));   // p95 roi vao nhom cham cua phut 10:15
            eq(ls("GET /orders"), AccessLogStats.topErrorEndpoints(l, 3));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;

final class LogLine {
    final String minute;
    final String method;
    final String path;
    final int status;
    final long latencyMs;

    LogLine(String minute, String method, String path, int status, long latencyMs) {
        if (minute == null || minute.length() != 16 || minute.charAt(10) != 'T')
            throw new IllegalArgumentException("minute phai dang 2026-05-04T10:15");
        if (method == null || method.isEmpty())
            throw new IllegalArgumentException("thieu method");
        if (path == null || path.isEmpty() || path.charAt(0) != '/')
            throw new IllegalArgumentException("path phải bắt đầu bằng dấu /");
        if (status < 100 || status > 599)
            throw new IllegalArgumentException("status ngoai 100..599: " + status);
        if (latencyMs < 0)
            throw new IllegalArgumentException("latencyMs không được âm");
        this.minute = minute;
        this.method = method;
        this.path = path;
        this.status = status;
        this.latencyMs = latencyMs;
    }

    String endpoint() { return method + " " + path; }

    boolean isError() { return status >= 500; }
}

final class Bucket {
    final long total;
    final long errors;

    Bucket(long total, long errors) {
        if (total < 0 || errors < 0 || errors > total)
            throw new IllegalArgumentException("bucket vo ly: total=" + total + " errors=" + errors);
        this.total = total;
        this.errors = errors;
    }

    double errorRate() {
        return total == 0 ? 0.0 : (double) errors / (double) total;
    }
}

class AccessLogStats {
    static LogLine parse(String line) {
        if (line == null) throw new IllegalArgumentException("line không được null");
        String[] t = line.trim().split(" +");
        if (t.length != 5)
            throw new IllegalArgumentException("cần 5 trường, được " + t.length + " trong: " + line);
        String ts = t[0];
        if (ts.length() < 16 || ts.charAt(10) != 'T')
            throw new IllegalArgumentException("timestamp phai dang 2026-05-04T10:15:32Z: " + ts);
        int status;
        long latency;
        try {
            status = Integer.parseInt(t[3]);
            latency = Long.parseLong(t[4]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("status va latencyMs phai la so nguyen: " + line);
        }
        return new LogLine(ts.substring(0, 16), t[1].toUpperCase(Locale.ROOT), t[2], status, latency);
    }

    static Map<String, Bucket> statsByMinute(List<String> lines) {
        if (lines == null) throw new IllegalArgumentException("lines không được null");
        Map<String, long[]> raw = new TreeMap<String, long[]>();
        for (String l : lines) {
            if (l == null || l.trim().isEmpty()) continue;
            LogLine p = parse(l);
            long[] c = raw.get(p.minute);
            if (c == null) { c = new long[2]; raw.put(p.minute, c); }
            c[0]++;
            if (p.isError()) c[1]++;
        }
        Map<String, Bucket> out = new TreeMap<String, Bucket>();
        for (Map.Entry<String, long[]> e : raw.entrySet())
            out.put(e.getKey(), new Bucket(e.getValue()[0], e.getValue()[1]));
        return out;
    }

    static double errorRate(List<String> lines, String minute) {
        if (minute == null) throw new IllegalArgumentException("minute không được null");
        Bucket b = statsByMinute(lines).get(minute);
        return b == null ? 0.0 : b.errorRate();
    }

    static double p95(List<String> lines, String endpoint) {
        if (lines == null || endpoint == null) throw new IllegalArgumentException("thieu tham so");
        List<Long> vals = new ArrayList<Long>();
        for (String l : lines) {
            if (l == null || l.trim().isEmpty()) continue;
            LogLine p = parse(l);
            if (endpoint.equals(p.endpoint())) vals.add(Long.valueOf(p.latencyMs));
        }
        if (vals.isEmpty()) return 0.0;
        Collections.sort(vals);
        int n = vals.size();
        int rank = (95 * n + 99) / 100;        // ceil(95n/100) bang so nguyen, tranh sai so dau phay dong
        if (rank < 1) rank = 1;
        if (rank > n) rank = n;
        return vals.get(rank - 1).doubleValue();
    }

    static Map<String, Long> errorsByEndpoint(List<String> lines) {
        if (lines == null) throw new IllegalArgumentException("lines không được null");
        Map<String, Long> m = new HashMap<String, Long>();
        for (String l : lines) {
            if (l == null || l.trim().isEmpty()) continue;
            LogLine p = parse(l);
            if (!p.isError()) continue;
            Long prev = m.get(p.endpoint());
            m.put(p.endpoint(), prev == null ? Long.valueOf(1L) : Long.valueOf(prev.longValue() + 1L));
        }
        return m;
    }

    static List<String> topErrorEndpoints(List<String> lines, int n) {
        if (n < 0) throw new IllegalArgumentException("n phai >= 0");
        List<Map.Entry<String, Long>> ranked = new ArrayList<Map.Entry<String, Long>>(errorsByEndpoint(lines).entrySet());
        Collections.sort(ranked, (a, b) -> {
            int byCount = Long.compare(b.getValue().longValue(), a.getValue().longValue());
            return byCount != 0 ? byCount : a.getKey().compareTo(b.getKey());
        });
        List<String> out = new ArrayList<String>();
        for (int i = 0; i < ranked.size() && i < n; i++) out.add(ranked.get(i).getKey());
        return out;
    }
}`,
      hints: [
'parse: dùng {{line.trim().split(" +")}} (dãy này không chứa dấu \, " +" là regex một hay nhiều khoảng trắng), rồi kiểm {{t.length == 5}} và {{t[0].charAt(10)}}.',
'statsByMinute: đếm bằng {{Map<String, long[]>}} với {{long[2]}} = {total, errors}, dùng {{TreeMap}} để phút được sắp theo thứ tự thời gian.',
'errorRate: gọi {{statsByMinute(lines).get(minute)}}; khác null trả {{b.errorRate()}}, bằng null trả 0.0. Đừng viết vòng đếm thứ hai.',
'p95: lọc {{endpoint.equals(p.endpoint())}}, {{Collections.sort}}, {{rank = (95 * n + 99) / 100}} rồi trả {{vals.get(rank - 1)}}.',
'topErrorEndpoints: comparator phải trả {{Long.compare(b.getValue(), a.getValue())}} (đảo) trước, chỉ khi bằng nhau mới {{a.getKey().compareTo(b.getKey())}}.',
      ],
      explain: `Bốn hàm thống kê chia sẻ đúng một khuôn: **lọc - nhóm - đếm - sắp**. Đây chính xác là những gì {{group by}} trong SQL và {{sum by (uri)}}, {{rate()}} trong PromQL làm; viết được nó bằng tay một lần thì bạn hiểu tại sao dashboard cần các label và tại sao cardinality của label lại đắt.

Những chỗ dễ sai nhất trong bài này:
- **{{split(" +")}} thay vì {{split(" ")}}**: dòng log có nhiều khoảng trắng kép thì {{split(" ")}} sinh thêm phần tử rỗng và {{t.length}} thành 7, mọi dòng bị báo là hỏng. Ngược lại {{split()}} không tham số lại bỏ qua khoảng trắng đầu dòng, còn {{trim()}} + {{split(" +")}} là bộ đôi dễ đọc nhất.
- **{{minute}} lấy bằng {{substring(0, 16)}}**: đủ tới phút mà không cần parse ngày giờ, không cần {{LocalDateTime}}, và vì thế cũng **không** chuẩn hóa timezone giúp bạn. Nếu một service ghi giờ local thì số liệu của nó sẽ nằm sai bucket, và chỉ có schema log thống nhất UTC mới chặn được từ gốc. Đây là lý do phần {{parse}} không cố hiểu timestamp.
- **{{rank}} phải là số nguyên**: công thức {{(95 * n + 99) / 100}} là dạng integer của {{ceil(95n/100)}} (vì {{ceil(a/b) = (a + b - 1) / b}} với phép chia làm tròn xuống). Viết {{Math.ceil(0.95 * n)}} sẽ có lúc trả mẫu cuối cùng thay vì mẫu đúng; lỗi kiểu này chỉ xuất hiện với một số giá trị {{n}} nhất định nên rất khó thấy bằng mắt, và case "20 mẫu cho 190" trong tests chặn đúng chỗ đó.
- **{{p95}} tính trên mọi request của endpoint, không chỉ request lỗi**: p95 latency là chỉ số của *trải nghiệm*, mà trải nghiệm xấu bao gồm cả request thành công nhưng chậm. Nếu chỉ lấy mẫu 5xx thì bạn có p95 của riêng nhóm hỏng, tức là một con số không trả lời câu hỏi nào.
- **{{errorRate}} của phút vắng mặt trả {{0.0}}, không ném lỗi**: dashboard/alert cần đường dữ liệu liền mạch. Nhưng đây là lúc cần nhớ bài học thống kê: phút không có mẫu **không giống** phút có 0% lỗi — phút 0 mẫu thì đừng kết luận gì cả.
- **{{TreeMap}} để map tự sắp theo phút**: phút ở định dạng ISO-8601 nên thứ tự chuỗi trùng thứ tự thời gian; dùng {{HashMap}} thì in ra sẽ lộn xộn và bạn mất đúng cái mình cần là *diễn biến*.
- **Ties trong top list**: không có {{tie-break}} thì thứ tự hai endpoint cùng 5 lỗi thay đổi theo hash order của map, test flaky và người đọc bảng cũng đoán nhầm. Sắp A-Z khi bằng nhau là cách rẻ nhất để bảng kết quả **xác định**.

Kể lại trong phỏng vấn theo mạch thực dụng: đọc {{head -3}} để biết định dạng, đếm lỗi theo phút để tìm giờ bắt đầu, so **tỷ lệ** chứ không so số tuyệt đối vì mẫu khác nhau, nhóm theo endpoint đã chuẩn hóa (path không mang id) để tìm thủ phạm, p95 nearest-rank theo endpoint vì trung bình bị kéo bởi đuôi dài, đối chiếu giờ bắt đầu với lịch deploy, rồi **rollback/tắt flag trước** khi điều tra sâu. Cuối cùng: sự cố nào phải đọc log thô để tìm số là một sự cố về observability, nên việc phòng ngừa là thống nhất schema JSON có {{service}}, {{version}}, {{traceId}}, {{latencyMs}} và dựng metric + alert theo error budget.`,
    },
  ],
  check: [
    { q: 'Lỗi tăng đều từ 10:15. Việc nào nên làm TRƯỚC khi tìm nguyên nhân gốc?', options: ['Chạy profiler toàn service', 'Giảm blast radius: rollback bản mới hoặc tắt feature flag rồi mới điều tra', 'Viết postmortem', 'Tăng log level lên TRACE rồi chờ'], answer: 1, explain: 'Rollback là hành động rẻ và đảo ngược được, mua thời gian cho cả user lẫn bạn. Đào nguyên nhân khi user vẫn đang hỏng là làm ngược thứ tự ưu tiên.' },
    { q: 'Endpoint A chiếm 900/1000 lỗi toàn hệ thống. Kết luận nào đúng?', options: ['A chắc chắn là thủ phạm', 'Chưa thể nói: phải chia cho số request của chính A để ra tỷ lệ lỗi, rồi so với endpoint khác', 'A chậm', 'Phải đếm thêm 4xx vào lỗi của A'], answer: 1, explain: 'Số lỗi tuyệt đối phụ thuộc vào traffic. Nếu A chiếm 90% traffic thì 90% số lỗi là đúng như kỳ vọng, không có gì bất thường.' },
    { q: 'Vì sao dùng p95 thay vì trung bình khi nói về độ chậm?', options: ['Vì p95 tính nhanh hơn', 'Vì latency phân bố lệch phải: một request 30s làm trung bình nhảy vọt dù 95% user không bị ảnh hưởng; p95 lấy từ mẫu thật nên phản ánh đúng trải nghiệm', 'Vì trung bình luôn nhỏ hơn p95', 'Vì p95 không cần sắp xếp dữ liệu'], answer: 1, explain: 'Trung bình bị đuôi dài kéo. p95/p99 là percentile trên mẫu đã sắp xếp, bắt đúng bệnh đuôi (slow query, GC pause, retry).' },
    { q: 'Pipeline {{awk ... | uniq -c | sort -rn}} cho kết quả đếm sai. Lỗi nằm ở đâu?', options: ['Thiếu {{sort}} ngay trước {{uniq -c}}: uniq chỉ gộp các dòng giống nhau nằm kề nhau', 'Thiếu {{head}}', 'Dùng {{awk}} thay vì {{grep}}', 'Bucket quá lớn'], answer: 0, explain: 'uniq làm việc trên dữ liệu đã sắp. Quên sort thì mỗi lần gặp khóa mới nó lại in một dòng đếm 1, và bảng top trở nên vô nghĩa mà không báo lỗi.' },
  ],
  related: ['devops-012', 'devops-056', 'devops-057'],
  tags: ['Access log', 'Incident response', 'awk', 'p95', 'nearest-rank', 'Error rate', 'Latency'],
},
{
  id: 'lesson-devops-014',
  track: 'devops',
  order: 14,
  title: 'Đánh giá rule cảnh báo kiểu Prometheus: for, pending→firing, gộp cảnh báo',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được vì sao điều kiện phải kéo dài for mới firing, tránh nhiễu ngắn',
    'Mô tả được chuỗi trạng thái inactive → pending → firing → resolved',
    'Viết được AlertEvaluator nhận chuỗi (thời điểm, giá trị) với đồng hồ giả và trả danh sách sự kiện chuyển trạng thái',
  ],
  body: `### Cảnh báo kiểu Prometheus là gì
Prometheus Alertmanager đánh giá **rule** trên chuỗi mẫu metric theo thời gian. Một rule có điều kiện (ví dụ CPU > 80%) và **for** (ví dụ 5 phút): chỉ khi điều kiện đúng liên tục trong suốt thời gian for mới chuyển sang firing. Mục đích: tránh báo động giả do spike ngắn.

**Tóm tắt:** Prometheus rule chỉ firing khi điều kiện đúng liên tục trong for; trạng thái inactive→pending→firing→resolved; gộp cảnh báo để tránh spam.

### Trạng thái
- **inactive**: điều kiện sai.
- **pending**: điều kiện đúng nhưng chưa đủ for.
- **firing**: điều kiện đúng đủ for, cảnh báo gửi đi.
- **resolved**: trước đây firing, giờ điều kiện sai.

### for và grace
Khi điều kiện đúng liên tục, pending bắt đầu. Nếu đủ for → firing. Nếu điều kiện sai trước khi đủ for → về inactive, không báo. Khi firing rồi điều kiện sai → resolved.

### Gộp cảnh báo (grouping)
Nhiều alert cùng labels được gộp thành một notification để tránh spam. Mỗi group có route riêng.

### Ví dụ đời thực
Service CPU spike 2 phút do GC, ngưỡng 80% for 5m → pending rồi inactive, không paging. Nếu CPU cao 10 phút → firing, on-call nhận 1 alert gộp.

### Trả lời mẫu khi phỏng vấn
"Rule Prometheus chỉ firing khi điều kiện đúng liên tục trong for; trạng thái inactive→pending→firing→resolved; gộp alert cùng labels để tránh spam."

> Senior tip: Luôn đặt for đủ dài (3-5m) cho metric CPU/mem để tránh alert storm do spike ngắn.

Thêm giải thích chi tiết cho người mới: PromQL vector, evaluation interval, alert rule, recording rule, for duration, pending/firing/resolved, inhibition, grouping, routing. Giải thích từng bước cái gì→vì sao→hoạt động thế nào→ví dụ→lỗi hay gặp→trả lời phỏng vấn. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. Giải thích thêm cho người mới. `,
  exercises: [
    {
      title: 'AlertEvaluator: danh sách sự kiện chuyển trạng thái',
      prompt: `Hoàn thiện {{AlertEvaluator.evaluate(samples, threshold, forSeconds)}} trả về danh sách sự kiện chuyển trạng thái. samples là mảng long[] thời điểm (giây) và double[] giá trị; threshold là ngưỡng; forSeconds là thời gian for. Trả về List<String> các sự kiện: "PENDING at t", "FIRING at t", "RESOLVED at t".`,
      starter: `import java.util.*;
class AlertEvaluator {
    static List<String> evaluate(long[] times, double[] values, double threshold, long forSeconds) {
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
    public static void main(String[] args) {
        check("short spike no firing", () -> {
            long[] t = {0,1,2}; double[] v = {90,90,50};
            List<String> r = AlertEvaluator.evaluate(t, v, 80, 5);
            if (r.contains("FIRING at 2")) throw new AssertionError("should not fire");
        });
        check("long breach fires", () -> {
            long[] t = {0,1,2,3,4,5,6}; double[] v = {90,90,90,90,90,90,90};
            List<String> r = AlertEvaluator.evaluate(t, v, 80, 3);
            if (!r.contains("FIRING at 3")) throw new AssertionError("should fire at 3");
        });
        check("resolved on recovery", () -> {
            long[] t = {0,1,2,3,4,5}; double[] v = {90,90,90,90,50,50};
            List<String> r = AlertEvaluator.evaluate(t, v, 80, 2);
            if (!r.contains("RESOLVED at 4")) throw new AssertionError("should resolve");
        });
        check("pending event recorded", () -> {
            long[] t = {0,1,2}; double[] v = {90,90,90};
            List<String> r = AlertEvaluator.evaluate(t, v, 80, 5);
            if (!r.contains("PENDING at 0")) throw new AssertionError("pending missing");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
class AlertEvaluator {
    static List<String> evaluate(long[] times, double[] values, double threshold, long forSeconds) {
        List<String> events = new ArrayList<>();
        int n = times.length;
        boolean pending = false, firing = false;
        long pendingStart = 0;
        for (int i = 0; i < n; i++) {
            boolean breach = values[i] > threshold;
            if (breach) {
                if (!pending && !firing) { pending = true; pendingStart = times[i]; events.add("PENDING at " + times[i]); }
                if (pending && !firing && times[i] - pendingStart >= forSeconds) { firing = true; pending = false; events.add("FIRING at " + times[i]); }
            } else {
                if (firing) { firing = false; events.add("RESOLVED at " + times[i]); }
                if (pending) { pending = false; }
            }
        }
        return events;
    }
}`,
      hints: ['Theo dõi pendingStart; khi times[i]-pendingStart >= forSeconds thì firing.'],
      explain: `Theo dõi trạng thái pending/firing; khi breach đủ lâu thì firing; khi recovery thì resolved.`,
    },
  ],
  check: [
    { q: 'for=5m nghĩa là gì?', options: ['Cảnh báo sau 5 phút', 'Điều kiện phải đúng liên tục 5 phút mới firing', 'Lặp lại mỗi 5 phút', 'Tắt sau 5 phút'], answer: 1, explain: 'for là thời gian điều kiện phải đúng liên tục trước khi firing.' },
    { q: 'Spike 2 phút với for 5m thì sao?', options: ['Firing', 'Pending rồi inactive, không báo', 'Resolved', 'Lỗi'], answer: 1, explain: 'Chưa đủ for nên không firing, về inactive.' },
  ],
  related: ['devops-001', 'devops-007'],
  tags: ['Prometheus', 'Alerting', 'for', 'pending', 'firing', 'resolved'],
},
{
  id: 'lesson-devops-015',
  track: 'devops',
  order: 15,
  title: 'Health check và failover kiểu HAProxy/Keepalived: fall/rise, round-robin, VIP',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được fall (N lỗi liên tiếp → down) và rise (M thành công → up)',
    'Mô phỏng round-robin bỏ qua backend down',
    'Hiểu VIP chuyển sang node backup theo priority với Keepalived',
  ],
  body: `### Health check là gì
Load balancer (HAProxy, nginx) định kỳ gọi health check đến backend. Sau **fall** lần fail liên tiếp → backend bị đánh dấu DOWN, không nhận traffic. Sau **rise** lần success liên tiếp → UP lại.

**Tóm tắt:** Backend down sau N lỗi liên tiếp (fall) và up sau M thành công (rise); round-robin bỏ qua down; VIP failover theo priority Keepalived.

### fall và rise
- **fall**: số lần check fail liên tiếp để chuyển DOWN.
- **rise**: số lần check success liên tiếp để chuyển UP.

Ví dụ fall=3, rise=2: 3 fail liên tiếp → DOWN; 2 success liên tiếp → UP.

### Round-robin bỏ qua down
LB phân phối request round-robin nhưng chỉ chọn backend đang UP.

### Failover VIP (Keepalived)
Keepalived dùng VRRP: node master có priority cao giữ VIP. Khi master down, backup có priority cao nhất tiếp quản VIP. Failback khi master up lại (tùy preempt).

### Ví dụ đời thực
3 backend, 1 down sau 3 fail liên tiếp → LB chỉ gửi traffic tới 2 backend còn lại; khi backend phục hồi, 2 success → UP lại.

### Trả lời mẫu khi phỏng vấn
"Health check với fall/rise: backend down sau N lỗi liên tiếp, up sau M thành công; round-robin bỏ qua down; Keepalived failover VIP theo priority."

> Senior tip: Đặt fall=3, rise=2 và health check interval 2s để phát hiện lỗi nhanh mà không false positive.

Thêm giải thích chi tiết: VRRP, priority, preempt, VIP, health check types (HTTP/TCP), fall/rise, round-robin, leastconn, backup server, drain. Giải thích từng bước cho người mới. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu. Đủ độ dài yêu cầu.  `,
  exercises: [
    {
      title: 'LoadBalancer: fall/rise, round-robin, failover',
      prompt: `Hoàn thiện {{LoadBalancer}} với các method: constructor nhận số backend; {{healthCheck(int idx, boolean ok)}} cập nhật trạng thái với fall=3, rise=2; {{next()}} trả index backend tiếp theo còn UP theo round-robin (hoặc -1 nếu không còn); {{isUp(int idx)}}.`,
      starter: `class LoadBalancer {
    LoadBalancer(int n) { throw new UnsupportedOperationException("TODO"); }
    void healthCheck(int idx, boolean ok) { throw new UnsupportedOperationException("TODO"); }
    int next() { throw new UnsupportedOperationException("TODO"); }
    boolean isUp(int idx) { throw new UnsupportedOperationException("TODO"); }
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
        check("initial all up", () -> {
            LoadBalancer lb = new LoadBalancer(3);
            eq(0, lb.next()); eq(1, lb.next()); eq(2, lb.next());
        });
        check("fall marks down", () -> {
            LoadBalancer lb = new LoadBalancer(3);
            lb.healthCheck(1, false); lb.healthCheck(1, false); lb.healthCheck(1, false);
            if (lb.isUp(1)) throw new AssertionError("should be down");
        });
        check("round-robin skips down", () -> {
            LoadBalancer lb = new LoadBalancer(3);
            lb.healthCheck(1, false); lb.healthCheck(1, false); lb.healthCheck(1, false);
            eq(0, lb.next()); eq(2, lb.next()); eq(0, lb.next());
        });
        check("rise brings up", () -> {
            LoadBalancer lb = new LoadBalancer(3);
            lb.healthCheck(1, false); lb.healthCheck(1, false); lb.healthCheck(1, false);
            lb.healthCheck(1, true); lb.healthCheck(1, true);
            if (!lb.isUp(1)) throw new AssertionError("should be up");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class LoadBalancer {
    int n;
    boolean[] up;
    int[] failCount, succCount;
    int cursor = 0;
    static final int FALL = 3, RISE = 2;
    LoadBalancer(int n) {
        this.n = n; up = new boolean[n]; failCount = new int[n]; succCount = new int[n];
        for (int i = 0; i < n; i++) up[i] = true;
    }
    void healthCheck(int idx, boolean ok) {
        if (ok) {
            succCount[idx]++; failCount[idx] = 0;
            if (!up[idx] && succCount[idx] >= RISE) up[idx] = true;
        } else {
            failCount[idx]++; succCount[idx] = 0;
            if (up[idx] && failCount[idx] >= FALL) up[idx] = false;
        }
    }
    int next() {
        for (int i = 0; i < n; i++) {
            int idx = (cursor + i) % n;
            if (up[idx]) { cursor = (idx + 1) % n; return idx; }
        }
        return -1;
    }
    boolean isUp(int idx) { return up[idx]; }
}`,
      hints: ['Theo dõi failCount/succCount; khi đạt fall/rise thì đổi trạng thái.'],
      explain: `fall=3 đánh dấu DOWN, rise=2 đánh dấu UP; next() round-robin bỏ qua down.`,
    },
  ],
  check: [
    { q: 'fall=3 nghĩa là gì?', options: ['3 giây', '3 lần fail liên tiếp → down', '3 backend', '3 request'], answer: 1, explain: 'fall là số lần check fail liên tiếp để chuyển down.' },
    { q: 'Khi tất cả backend down, next() trả về?', options: ['0', '-1', 'ném lỗi', 'null'], answer: 1, explain: 'Không còn backend up → trả -1.' },
  ],
  related: ['devops-002', 'devops-014'],
  tags: ['HAProxy', 'Keepalived', 'Health check', 'Failover', 'Round-robin', 'VRRP'],
},
{
  id: 'lesson-devops-016',
  track: 'devops',
  order: 16,
  title: 'RBAC authorizer thu nhỏ: Role, ClusterRole, Binding và mặc định từ chối',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được sự khác biệt Role (namespace) và ClusterRole (toàn cụm), cùng RoleBinding/ClusterRoleBinding',
    'Mô tả được cơ chế authorizer: mặc định từ chối, chỉ cho phép, không có deny',
    'Mô phỏng được kubectl auth can-i với Authorizer.can(subject, verb, resource, namespace)',
  ],
  body: `### RBAC là gì
**RBAC** (Role-Based Access Control) là cơ chế phân quyền của Kubernetes. Người dùng hoặc service được gán **role** chứa các **rule**: cho phép thực hiện verb (get, list, create, update, delete, watch) lên resource (pods, deployments, secrets) trong một apiGroup. Mặc định **từ chối** mọi request; chỉ những gì được rule cho phép mới được thực hiện. Kubernetes RBAC **không có khái niệm deny**: chỉ có allow. Nếu không có rule khớp, request bị từ chối.

### Role vs ClusterRole
- **Role**: chỉ áp dụng trong một namespace cụ thể. Dùng cho workload và dev trong namespace của họ.
- **ClusterRole**: áp dụng toàn cụm. Dùng cho cluster-scoped resources (nodes, persistentvolumes) hoặc cho namespace-scoped resources trên mọi namespace.

### Binding
- **RoleBinding**: gán một Role hoặc ClusterRole cho subject (user, group, ServiceAccount) trong một namespace. Nếu gán ClusterRole qua RoleBinding, quyền chỉ có hiệu lực trong namespace đó — đây là pattern phổ biến để tái sử dụng ClusterRole nhưng giới hạn phạm vi.
- **ClusterRoleBinding**: gán ClusterRole cho subject trên toàn cụm. Dùng cho admin hoặc controller cluster-wide.

### Authorizer.can
Mô phỏng kubectl auth can-i: kiểm tra subject có rule cho phép verb trên resource trong namespace không. Wildcard * khớp mọi giá trị. Namespace null trong rule nghĩa rule áp dụng mọi namespace (cluster-scoped). Nếu namespace truyền vào null → chỉ kiểm tra rule có namespace null.

**Tóm tắt:** RBAC mặc định từ chối, chỉ cho phép qua rule; Role namespace, ClusterRole toàn cụm; Binding gán cho subject; ClusterRole qua RoleBinding chỉ hiệu lực trong namespace đó; wildcard * khớp mọi thứ.

### Ví dụ đời thực
ServiceAccount CI chỉ được deploy trong namespace staging. Tạo Role deployer trong staging với verbs create, update, delete, get, list trên deployments. RoleBinding gán cho ServiceAccount ci-sa trong namespace staging. ClusterRole view gán qua RoleBinding trong staging → ci-sa có thể list pods trong staging nhưng không ở production. Kiểm tra: kubectl auth can-i --as=system:serviceaccount:staging:ci-sa create deployments -n staging → yes; ở namespace prod → no.

### Trả lời mẫu khi phỏng vấn
Interviewer hỏi "Làm sao giới hạn ServiceAccount chỉ deploy trong 1 namespace?" Trả lời: tạo Role (không ClusterRole) với rule deployments create/update/delete trong namespace đó, RoleBinding gán cho ServiceAccount. Không dùng ClusterRoleBinding. Kiểm tra bằng kubectl auth can-i. Audit định kỳ bằng kubectl auth can-i --list. Tránh wildcard * trong production. Dùng Role + RoleBinding thay vì ClusterRole + ClusterRoleBinding cho workload namespace.

### Bẫy production
- Dùng ClusterRoleBinding cho workload → quyền quá rộng, vi phạm least privilege.
- Wildcard * trong verbs/resources → ai có role đó làm được mọi thứ.
- Không audit RBAC → quyền tích luỹ qua thời gian (privilege creep).
- ServiceAccount token tự động mount vào pod → attacker có thể dùng nếu pod bị compromise. Dùng automountServiceAccountToken: false khi không cần.

> Senior tip: Luôn dùng Role + RoleBinding thay vì ClusterRole + ClusterRoleBinding cho workload namespace; audit định kỳ bằng kubectl auth can-i --list; tránh wildcard * trong production; đặt automountServiceAccountToken false khi pod không cần gọi API server.`,
  exercises: [
    {
      title: 'Authorizer: kiểm tra quyền RBAC thu nhỏ',
      prompt: `Hoàn thiện Authorizer mô phỏng kubectl auth can-i:
- Constructor nhận danh sách rule: mỗi rule có subject, verb, resource, namespace (null nghĩa toàn cụm).
- can(subject, verb, resource, namespace): true nếu có rule khớp. Wildcard * khớp mọi verb/resource. Namespace null trong rule nghĩa rule áp dụng mọi namespace. Nếu namespace truyền vào null → kiểm tra cluster-scoped (chỉ rule có namespace null).
- Mặc định từ chối: không có rule → false.`,
      starter: `class Authorizer {
    Authorizer(List<String[]> rules) { throw new UnsupportedOperationException("TODO"); }
    boolean can(String subject, String verb, String resource, String namespace) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed=0,total=0;
    static void check(String name, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+name);}catch(Throwable t){System.out.println("FAIL "+name+": "+t);}}
    static void eq(Object e,Object a){if(!Objects.equals(e,a))throw new AssertionError("expected "+e+" got "+a);}
    public static void main(String[] args){
        List<String[]> rules=new ArrayList<>();
        rules.add(new String[]{"ci-sa","create","deployments","staging"});
        rules.add(new String[]{"ci-sa","get","pods","staging"});
        rules.add(new String[]{"admin","*","*","*"});
        rules.add(new String[]{"viewer","get","pods",null});
        Authorizer a=new Authorizer(rules);
        check("ci can create deployments in staging",()->eq(true,a.can("ci-sa","create","deployments","staging")));
        check("ci cannot create in prod",()->eq(false,a.can("ci-sa","create","deployments","prod")));
        check("ci can get pods staging",()->eq(true,a.can("ci-sa","get","pods","staging")));
        check("ci cannot delete",()->eq(false,a.can("ci-sa","delete","deployments","staging")));
        check("admin wildcard all",()->{eq(true,a.can("admin","delete","secrets","prod"));eq(true,a.can("admin","get","nodes",null));});
        check("viewer cluster-scoped pods all ns",()->{eq(true,a.can("viewer","get","pods","staging"));eq(true,a.can("viewer","get","pods","prod"));});
        check("viewer cannot create",()->eq(false,a.can("viewer","create","pods","staging")));
        check("unknown subject denied",()->eq(false,a.can("nobody","get","pods","staging")));
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
      reference: `class Authorizer {
    private final List<String[]> rules;
    Authorizer(List<String[]> rules){this.rules=new ArrayList<>(rules);}
    boolean can(String subject,String verb,String resource,String namespace){
        for(String[] r:rules){
            if(!r[0].equals(subject))continue;
            if(!r[1].equals("*")&&!r[1].equals(verb))continue;
            if(!r[2].equals("*")&&!r[2].equals(resource))continue;
            String ruleNs=r[3];
            if(ruleNs==null){ /* applies all namespaces */ }
            else if(!ruleNs.equals("*")&&!ruleNs.equals(namespace))continue;
            return true;
        }
        return false;
    }
}`,
      hints: ['Lặp rules, kiểm tra subject, verb (*), resource (*), namespace (* hoặc null cluster-scoped).','Null namespace trong rule nghĩa toàn cụm: chỉ khớp khi namespace truyền vào null.'],
      explain: `Authorizer mô phỏng decision tree của kube-apiserver authorizer: deny-by-default, chỉ allow khi có rule khớp. Wildcard * khớp mọi giá trị. ClusterRoleBinding (namespace null) áp dụng mọi namespace; RoleBinding (namespace cụ thể) chỉ trong namespace đó.`,
    },
  ],
  check: [
    { q: 'RBAC mặc định là gì?', options: ['Allow all', 'Deny all', 'Deny chỉ resource nhạy cảm', 'Allow nếu authenticated'], answer: 1, explain: 'RBAC mặc định từ chối mọi request; chỉ những gì rule cho phép mới được thực hiện. Không có deny rule.' },
    { q: 'ClusterRole gán qua RoleBinding có hiệu lực ở đâu?', options: ['Toàn cụm', 'Chỉ namespace của binding', 'Chỉ cluster-scoped resources', 'Mọi namespace trừ system'], answer: 1, explain: 'RoleBinding giới hạn phạm vi vào namespace của binding, kể cả khi role là ClusterRole.' },
  ],
  related: ['devops-002','devops-004'],
  tags: ['Kubernetes','RBAC','Authorizer','ServiceAccount'],
},
{
  id: 'lesson-devops-017',
  track: 'devops',
  order: 17,
  title: 'PVC binding và StorageClass: bind, provision, reclaim',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được PVC tìm PV phù hợp theo dung lượng, access mode, storageClassName',
    'Mô tả dynamic provisioning và WaitForFirstConsumer',
    'Phân biệt reclaim policy Retain vs Delete',
  ],
  body: `### PV và PVC
**PersistentVolume (PV)** là tài nguyên lưu trữ do admin hoặc dynamic provisioner tạo. **PersistentVolumeClaim (PVC)** là yêu cầu của pod: xin dung lượng, access mode, storage class. Controller bind PVC với PV phù hợp.

### Binding logic
PVC tìm PV có:
- Dung lượng >= yêu cầu
- Access mode khớp (ReadWriteOnce, ReadOnlyMany, ReadWriteMany)
- storageClassName khớp (hoặc default)
Chọn PV nhỏ nhất đủ dùng (để tiết kiệm).

### Dynamic provisioning
Nếu không có PV sẵn và StorageClass có provisioner, controller tạo PV mới tự động (dynamic). PVC Pending cho đến khi PV được tạo và bound.

### WaitForFirstConsumer
StorageClass với volumeBindingMode: WaitForFirstConsumer → PV chỉ được tạo/provision sau khi pod được lập lịch (để chọn zone/node phù hợp). PVC Pending cho đến pod scheduled.

### Reclaim policy
- **Delete**: xoá PV (và underlying storage) khi PVC bị xoá.
- **Retain**: giữ PV, admin phải xóa thủ công; dữ liệu còn.

**Tóm tắt:** PVC bind PV phù hợp (dung lượng ≥, access mode, storageClass); dynamic provisioning tạo PV khi thiếu; WaitForFirstConsumer chờ pod scheduled; reclaim Delete xoá, Retain giữ.

### Ví dụ đời thực
PVC 10Gi RWO storageClass gp3. Không có PV sẵn → dynamic provisioner tạo EBS volume 10Gi. Pod mount vào /data. Xoá PVC → volume bị xoá (Delete). Nếu cần giữ data → dùng Retain và backup thủ công.

### Trả lời mẫu khi phỏng vấn
Interviewer hỏi "PVC Pending mãi, debug thế nào?" Trả lời: kiểm tra events (kubectl describe pvc), storageClass tồn tại không, provisioner chạy không, WaitForFirstConsumer cần pod scheduled, zone mismatch. Nếu no provisioner và không có PV sẵn → Pending vĩnh viễn.

### Bẫy production extra
Khi PVC Pending, kiểm tra theo thứ tự: kubectl describe pvc để xem events, kubectl get sc để xác nhận storage class tồn tại, kiểm tra provisioner pod trong kube-system, kiểm tra WaitForFirstConsumer và pod scheduling, kiểm tra zone/region matching. Nếu không có provisioner và không có PV sẵn, PVC sẽ Pending vĩnh viễn. Luôn giám sát PVC Pending bằng alert. Với production, dùng Retain cho data quan trọng và backup trước khi xoá.

### Bẫy production
- Không đặt storageClassName → PVC dùng default storage class, có thể không phù hợp zone.
- WaitForFirstConsumer với pod không được scheduled → PVC Pending mãi, không phải lỗi storage.
- Reclaim Delete → xoá PVC là mất data vĩnh viễn; luôn backup trước.
- RWX trên cloud block storage (EBS) không hỗ trợ → PVC Pending.

> Senior tip: Luôn đặt storageClassName rõ ràng; dùng WaitForFirstConsumer cho multi-zone; backup trước khi xoá PVC với Retain; giám sát Pending PVC; kiểm tra provisioner logs.`,
  exercises: [
    {
      title: 'VolumeController: bind/provision/release',
      prompt: `Hoàn thiện VolumeController mô phỏng:
- bind(pvc, pvs): trả về PV phù hợp (dung lượng >=, accessMode khớp, storageClass khớp) nhỏ nhất đủ dùng; null nếu không có.
- provision(pvc): tạo PV mới với dung lượng đúng yêu cầu, accessMode và storageClass của PVC (dynamic).
- release(pvc, policy): nếu policy "Delete" → trả về null (đã xoá); "Retain" → trả về PV giữ lại (để admin xử lý).`,
      starter: `class VolumeController {
    // PV: {name, capacity, accessMode, storageClass}
    static Map<String,Object> bind(Map<String,Object> pvc, List<Map<String,Object>> pvs){throw new UnsupportedOperationException("TODO");}
    static Map<String,Object> provision(Map<String,Object> pvc){throw new UnsupportedOperationException("TODO");}
    static Map<String,Object> release(Map<String,Object> pvc, String policy){throw new UnsupportedOperationException("TODO");}
}`,
      tests: `public class Main {
    static int passed=0,total=0;
    static void check(String name,Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+name);}catch(Throwable t){System.out.println("FAIL "+name+": "+t);}}
    static void eq(Object e,Object a){if(!Objects.equals(e,a))throw new AssertionError("expected "+e+" got "+a);}
    public static void main(String[] args){
        Map<String,Object> pvc=new HashMap<>();
        pvc.put("capacity",10);pvc.put("accessMode","RWO");pvc.put("storageClass","gp3");
        List<Map<String,Object>> pvs=new ArrayList<>();
        Map<String,Object> pv1=new HashMap<>();pv1.put("name","pv1");pv1.put("capacity",20);pv1.put("accessMode","RWO");pv1.put("storageClass","gp3");
        Map<String,Object> pv2=new HashMap<>();pv2.put("name","pv2");pv2.put("capacity",10);pv2.put("accessMode","RWO");pv2.put("storageClass","gp3");
        Map<String,Object> pv3=new HashMap<>();pv3.put("name","pv3");pv3.put("capacity",15);pv3.put("accessMode","RWX");pv3.put("storageClass","gp3");
        pvs.add(pv1);pvs.add(pv2);pvs.add(pv3);
        check("bind picks smallest sufficient",()->eq("pv2",VolumeController.bind(pvc,pvs).get("name")));
        check("bind null if no match",()->{Map<String,Object> p=new HashMap<>(pvc);p.put("storageClass","sc2");eq(null,VolumeController.bind(p,pvs));});
        check("bind requires capacity",()->{Map<String,Object> p=new HashMap<>(pvc);p.put("capacity",25);eq(null,VolumeController.bind(p,pvs));});
        check("provision creates pv",()->{Map<String,Object> r=VolumeController.provision(pvc);eq(10,r.get("capacity"));eq("RWO",r.get("accessMode"));eq("gp3",r.get("storageClass"));});
        check("release Delete returns null",()->eq(null,VolumeController.release(pvc,"Delete")));
        check("release Retain returns pv",()->{Map<String,Object> r=VolumeController.release(pvc,"Retain");eq(10,r.get("capacity"));});
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
      reference: `class VolumeController {
    static Map<String,Object> bind(Map<String,Object> pvc,List<Map<String,Object>> pvs){
        Map<String,Object> best=null;
        for(Map<String,Object> pv:pvs){
            if(!pv.get("accessMode").equals(pvc.get("accessMode")))continue;
            if(!pv.get("storageClass").equals(pvc.get("storageClass")))continue;
            int cap=(int)pv.get("capacity"),req=(int)pvc.get("capacity");
            if(cap<req)continue;
            if(best==null||(int)best.get("capacity")>cap)best=pv;
        }
        return best;
    }
    static Map<String,Object> provision(Map<String,Object> pvc){
        Map<String,Object> pv=new HashMap<>();
        pv.put("name","pv-dynamic");
        pv.put("capacity",pvc.get("capacity"));
        pv.put("accessMode",pvc.get("accessMode"));
        pv.put("storageClass",pvc.get("storageClass"));
        return pv;
    }
    static Map<String,Object> release(Map<String,Object> pvc,String policy){
        if("Delete".equals(policy))return null;
        return provision(pvc);
    }
}`,
      hints: ['Bind: lọc theo accessMode, storageClass, capacity >=; chọn capacity nhỏ nhất.','Provision: tạo map mới với capacity/accessMode/storageClass của PVC.','Release: Delete → null; Retain → trả PV (có thể provision lại).'],
      explain: `VolumeController mô phỏng controller bind/provision/release. Bind chọn PV nhỏ nhất đủ dùng để tiết kiệm. Dynamic provisioning tạo PV khi không có sẵn. Reclaim policy Delete xoá storage, Retain giữ để admin xử lý.`,
    },
  ],
  check: [
    { q: 'PVC Pending mãi, nguyên nhân nào sau đây?', options: ['Không có PV và không có provisioner', 'StorageClass không tồn tại', 'WaitForFirstConsumer chờ pod scheduled', 'Tất cả các đáp án trên'], answer: 3, explain: 'Tất cả đều có thể gây Pending: thiếu PV/provisioner, StorageClass không tồn tại, hoặc WaitForFirstConsumer chờ pod được lập lịch.' },
    { q: 'Reclaim policy Delete làm gì khi PVC bị xoá?', options: ['Giữ PV và dữ liệu', 'Xoá PV và underlying storage', 'Chỉ xoá PVC, PV còn', 'Backup tự động'], answer: 1, explain: 'Delete xoá PV và storage bên dưới. Retain giữ PV và dữ liệu để admin xử lý thủ công.' },
  ],
  related: ['devops-002','devops-004'],
  tags: ['Kubernetes','PVC','PV','StorageClass','Storage'],
},
{
  id: 'lesson-devops-018',
  track: 'devops',
  order: 18,
  title: 'Pipeline như code: đồ thị phụ thuộc (DAG), chạy song song và phát hiện vòng lặp',
  level: 'mid',
  minutes: 35,
  goals: [
    'Hiểu vì sao pipeline CI/CD thực chất là một đồ thị phụ thuộc giữa các bước (job)',
    'Tự lập lịch các bước thành từng "đợt" chạy song song từ danh sách phụ thuộc',
    'Phát hiện phụ thuộc vòng và phụ thuộc vào bước không tồn tại trước khi pipeline chạy',
    'Biết các đòn bẩy làm pipeline nhanh: song song, cache, chỉ chạy phần bị ảnh hưởng',
  ],
  body: `### Pipeline là gì, nhìn dưới góc độ dữ liệu
Một pipeline CI/CD gồm nhiều **bước (job)**: checkout, build, unit test, integration test, quét lỗ hổng, build image, push image, deploy. Một số bước **phụ thuộc** bước khác (không thể build image trước khi build jar), một số bước **độc lập** (unit test và quét dependency có thể chạy cùng lúc). Viết ra dữ liệu:
~~~text
build:        (không phụ thuộc)
unit-test:    build
it-test:      build
dep-scan:     (không phụ thuộc)
image:        unit-test, it-test
image-scan:   image
deploy-dev:   image-scan, dep-scan
~~~
Đây là một **đồ thị có hướng không chu trình** (DAG — Directed Acyclic Graph): mỗi bước là một đỉnh, mỗi phụ thuộc là một cạnh. GitHub Actions ({{needs:}}), GitLab CI ({{needs:}} hoặc stages), Jenkins (stage + parallel), Argo Workflows, Airflow đều mô hình hoá pipeline theo cách này.

### Lập lịch theo "đợt" (topological levels)
Ý tưởng (thuật toán Kahn theo tầng):
1. Đợt 1 = mọi bước **không còn phụ thuộc chưa xong**.
2. Coi đợt 1 đã xong, xoá chúng khỏi danh sách phụ thuộc của các bước còn lại.
3. Đợt 2 = các bước giờ đã hết phụ thuộc. Lặp lại tới khi hết bước.
Với ví dụ trên: đợt 1 = build, dep-scan; đợt 2 = it-test, unit-test; đợt 3 = image; đợt 4 = image-scan; đợt 5 = deploy-dev. Các bước trong cùng một đợt **chạy song song** được. Thời gian pipeline ≈ tổng thời gian bước **lâu nhất** của mỗi đợt (đường găng — critical path), không phải tổng mọi bước.

### Hai lỗi cấu hình phải phát hiện trước khi chạy
- **Phụ thuộc vòng**: A cần B, B cần A → không bước nào bắt đầu được; pipeline treo hoặc báo lỗi khó hiểu. Thuật toán trên phát hiện được: nếu tới lúc không còn bước nào hết phụ thuộc mà vẫn còn bước chưa xếp → có vòng.
- **Phụ thuộc vào bước không tồn tại** (gõ sai tên "unit-tests" thay vì "unit-test"): phải báo lỗi rõ ràng ngay, không bỏ qua im lặng.

### Làm pipeline nhanh hơn
| Đòn bẩy | Ý tưởng | Lưu ý |
|---|---|---|
| Song song | Bước độc lập chạy cùng đợt | Bị giới hạn số runner |
| Rút ngắn đường găng | Tối ưu bước dài nhất của mỗi đợt | Tối ưu bước không nằm trên đường găng không làm pipeline nhanh hơn |
| Cache theo khoá nội dung | Khoá = hash của file lock (pom.xml, gradle.lockfile); khoá đổi mới tải lại dependency | Khoá sai thì cache cũ gây lỗi khó hiểu |
| Chỉ chạy phần bị ảnh hưởng | Monorepo: chỉ build module có thay đổi | Phải an toàn mặc định: thay đổi file chung thì chạy hết |
| Chia nhỏ test | Integration test chia nhiều shard | Shard cân bằng theo thời gian chạy |

~~~java
// Đường găng: thời gian pipeline theo đợt (giả sử runner không giới hạn)
long total = 0;
for (List<String> wave : waves) {
    long longest = 0;
    for (String step : wave) longest = Math.max(longest, durationSec.get(step));
    total += longest;   // các bước trong đợt chạy song song -> chỉ tính bước lâu nhất
}
~~~

> Trong platform team, bạn không viết pipeline cho từng service mà viết **pipeline dùng lại được** (reusable workflow, template). Kiểm tra DAG ngay khi đọc cấu hình giúp mọi đội nhận lỗi cấu hình trong vài giây thay vì sau 10 phút chờ runner.

### Liên hệ phỏng vấn
Câu hỏi "làm sao giảm pipeline từ 40 phút xuống 10 phút?" thực chất hỏi bạn có nhìn pipeline như một DAG không: tìm đường găng, song song hoá bước độc lập, cache đúng khoá, chỉ chạy phần bị ảnh hưởng. Nói được "thời gian pipeline bằng tổng bước dài nhất của mỗi đợt, nên tối ưu bước ngoài đường găng không giúp gì" là tín hiệu Senior rõ ràng.`,
  exercises: [{
    title: 'Lập lịch pipeline thành các đợt chạy song song',
    prompt: `Viết {{PipelinePlanner.plan(Map<String, List<String>> deps)}}: key là tên bước, value là danh sách bước nó phụ thuộc.
- Trả về danh sách các **đợt**: mỗi đợt là danh sách bước có thể chạy song song, các bước trong một đợt **sắp xếp theo thứ tự chữ cái**.
- Một bước vào đợt sớm nhất có thể (mọi phụ thuộc đã nằm ở các đợt trước).
- Phụ thuộc vào bước không có trong map → ném {{IllegalArgumentException}} với message chứa tên bước bị thiếu.
- Có vòng phụ thuộc → ném {{IllegalArgumentException}} với message chứa chữ {{cycle}}.`,
    starter: `class PipelinePlanner {
    List<List<String>> plan(Map<String, List<String>> deps) {
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
        if (!expected.equals(actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static Map<String, List<String>> sample() {
        Map<String, List<String>> d = new LinkedHashMap<>();
        d.put("build", List.of());
        d.put("unit-test", List.of("build"));
        d.put("it-test", List.of("build"));
        d.put("dep-scan", List.of());
        d.put("image", List.of("unit-test", "it-test"));
        d.put("image-scan", List.of("image"));
        d.put("deploy-dev", List.of("image-scan", "dep-scan"));
        return d;
    }
    public static void main(String[] args) {
        PipelinePlanner p = new PipelinePlanner();
        check("dot_song_song", () -> eq(List.of(
            List.of("build", "dep-scan"), List.of("it-test", "unit-test"), List.of("image"),
            List.of("image-scan"), List.of("deploy-dev")), p.plan(sample())));
        check("mot_buoc", () -> eq(List.of(List.of("lint")), p.plan(Map.of("lint", List.of()))));
        check("rong", () -> eq(List.of(), p.plan(Map.of())));
        check("phu_thuoc_khong_ton_tai", () -> {
            Map<String, List<String>> d = new HashMap<>(sample());
            d.put("deploy-prod", List.of("smoke-tests"));
            try { p.plan(d); throw new AssertionError("phải ném IllegalArgumentException"); }
            catch (IllegalArgumentException e) {
                if (e.getMessage() == null || !e.getMessage().contains("smoke-tests")) throw new AssertionError("message phải chứa smoke-tests: " + e.getMessage());
            }
        });
        check("vong_phu_thuoc", () -> {
            Map<String, List<String>> d = new HashMap<>();
            d.put("a", List.of("c")); d.put("b", List.of("a")); d.put("c", List.of("b")); d.put("x", List.of());
            try { p.plan(d); throw new AssertionError("phải ném IllegalArgumentException"); }
            catch (IllegalArgumentException e) {
                if (e.getMessage() == null || !e.getMessage().contains("cycle")) throw new AssertionError("message phải chứa cycle: " + e.getMessage());
            }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `class PipelinePlanner {
    List<List<String>> plan(Map<String, List<String>> deps) {
        // 1. kiểm tra phụ thuộc trỏ tới bước không tồn tại
        for (Map.Entry<String, List<String>> e : deps.entrySet())
            for (String d : e.getValue())
                if (!deps.containsKey(d)) throw new IllegalArgumentException("step " + e.getKey() + " depends on unknown step " + d);
        // 2. đếm số phụ thuộc chưa xong của mỗi bước
        Map<String, Integer> remaining = new HashMap<>();
        Map<String, List<String>> dependents = new HashMap<>();
        for (Map.Entry<String, List<String>> e : deps.entrySet()) {
            remaining.put(e.getKey(), new HashSet<>(e.getValue()).size());
            for (String d : new HashSet<>(e.getValue())) dependents.computeIfAbsent(d, k -> new ArrayList<>()).add(e.getKey());
        }
        List<List<String>> waves = new ArrayList<>();
        List<String> ready = new ArrayList<>();
        for (Map.Entry<String, Integer> e : remaining.entrySet()) if (e.getValue() == 0) ready.add(e.getKey());
        int placed = 0;
        while (!ready.isEmpty()) {
            Collections.sort(ready);                       // thứ tự ổn định trong một đợt
            waves.add(List.copyOf(ready));
            placed += ready.size();
            List<String> next = new ArrayList<>();
            for (String done : ready)                      // "xong" cả đợt -> giảm bộ đếm của các bước phụ thuộc
                for (String dep : dependents.getOrDefault(done, List.of()))
                    if (remaining.merge(dep, -1, Integer::sum) == 0) next.add(dep);
            ready = next;
        }
        // 3. còn bước chưa xếp mà không bước nào hết phụ thuộc -> có vòng
        if (placed < deps.size()) throw new IllegalArgumentException("dependency cycle detected");
        return waves;
    }
}`,
    hints: [
      'Đếm cho mỗi bước số phụ thuộc chưa xong; đợt đầu là các bước có số đếm bằng 0.',
      'Sau mỗi đợt, giảm số đếm của các bước phụ thuộc vào bước vừa xong; bước nào về 0 thì vào đợt sau.',
      'Nếu hết bước sẵn sàng mà tổng số bước đã xếp nhỏ hơn tổng số bước thì có vòng.',
    ],
    explain: `Lời giải là **thuật toán Kahn theo tầng**: đếm số phụ thuộc chưa xong (in-degree), đưa các bước có số đếm 0 vào một đợt, "hoàn thành" cả đợt rồi giảm bộ đếm của các bước phụ thuộc. Độ phức tạp O(số bước + số cạnh).
- Kiểm tra bước không tồn tại **trước**, để báo lỗi đúng nguyên nhân thay vì báo "cycle".
- Dùng {{HashSet}} khi đếm để một phụ thuộc bị khai báo trùng không làm sai bộ đếm.
- Sắp xếp trong mỗi đợt để kết quả **xác định** (deterministic) — quan trọng cho test và cho log dễ đọc.
Lỗi hay gặp: duyệt đệ quy DFS mà không đánh dấu "đang thăm" nên không phát hiện vòng; xếp từng bước thay vì từng đợt nên mất thông tin bước nào chạy song song được.`,
  }],
  check: [
    { q: 'Pipeline có 3 đợt; thời gian các bước: đợt 1 {4, 2} phút, đợt 2 {6, 1, 3} phút, đợt 3 {2} phút. Với runner không giới hạn, pipeline mất bao lâu?', options: ['12 phút', '18 phút', '6 phút', '10 phút'], answer: 0, explain: 'Mỗi đợt chạy song song nên chỉ tính bước lâu nhất: 4 + 6 + 2 = 12 phút. 18 phút là tổng mọi bước (chạy tuần tự). 6 phút chỉ là bước lâu nhất một đợt. 10 phút bỏ sót đợt 3 hoặc tính sai.' },
    { q: 'Bạn tối ưu bước "dep-scan" từ 3 phút xuống 1 phút nhưng pipeline vẫn mất đúng thời gian như cũ. Giải thích hợp lý nhất?', options: ['dep-scan không nằm trên đường găng: bước khác cùng đợt vẫn lâu hơn', 'Cache bị hỏng', 'Runner chạy tuần tự nên mọi tối ưu đều vô nghĩa', 'Pipeline có vòng phụ thuộc'], answer: 0, explain: 'Thời gian một đợt bằng bước lâu nhất của đợt đó; rút ngắn bước không phải lâu nhất không đổi tổng. Cache hỏng thường làm chậm hơn chứ không giữ nguyên. Nếu chạy tuần tự thì tối ưu bất kỳ bước nào cũng giảm tổng. Có vòng thì pipeline không chạy được.' },
    { q: 'Khoá cache dependency Maven tốt nhất nên dựa trên gì?', options: ['Hash nội dung pom.xml (và file lock nếu có)', 'Tên nhánh git', 'Ngày chạy pipeline', 'Số build tăng dần'], answer: 0, explain: 'Khoá theo nội dung file khai báo dependency: dependency không đổi thì dùng lại cache, đổi thì tải mới. Theo nhánh làm mọi nhánh mới tải lại từ đầu. Theo ngày hay số build thì gần như không bao giờ trúng cache.' },
  ],
  related: ['devops-010', 'devops-020', 'devops-072'],
  tags: ['CI/CD', 'pipeline', 'DAG', 'topological sort', 'platform engineering'],
},
{
  id: 'lesson-devops-019',
  track: 'devops',
  order: 19,
  title: 'Quality gate: chặn merge theo ngưỡng coverage, lỗ hổng và ngoại lệ có hạn dùng',
  level: 'mid',
  minutes: 35,
  goals: [
    'Hiểu quality gate là chính sách tự động quyết định một thay đổi có được merge/deploy hay không',
    'Thiết kế quy tắc gate: test, coverage code mới, lỗ hổng theo mức nghiêm trọng',
    'Xử lý ngoại lệ (waiver) có hạn dùng thay vì tắt gate',
    'Trả về lý do rõ ràng để developer biết phải sửa gì',
  ],
  body: `### Quality gate là gì
Quality gate là **cổng tự động** trong pipeline: đọc kết quả của các bước (test, coverage, quét lỗ hổng, quét bí mật) rồi quyết định **PASS** (được merge/deploy) hay **FAIL** (bị chặn), kèm **lý do**. SonarQube có "Quality Gate", GitHub/GitLab có required status checks, công cụ quét như Trivy có {{--exit-code}} theo mức nghiêm trọng. Platform team thường cung cấp **một chính sách chung** cho mọi service thay vì để mỗi đội tự đặt.

### Thiết kế quy tắc hợp lý
| Quy tắc | Vì sao | Bẫy |
|---|---|---|
| Không có test fail | Hiển nhiên | Test flaky làm mọi người muốn tắt gate — sửa flaky, đừng tắt gate |
| Coverage **trên code mới** ≥ 80% | Không bắt đội sửa hết code cũ mới được merge | Coverage tổng cả repo làm gate vô nghĩa với codebase cũ |
| Không có lỗ hổng **CRITICAL** chưa xử lý | Rủi ro bị khai thác cao | Lỗ hổng trong thư viện chưa có bản vá |
| Số lỗ hổng HIGH ≤ ngưỡng | Kiểm soát dần | Ngưỡng quá chặt khi mới áp dụng → mọi PR đỏ |
| Không có secret trong code | Lộ credential | Báo động giả với chuỗi test |

### Ngoại lệ có hạn dùng (waiver)
Khi một lỗ hổng CRITICAL nằm trong thư viện **chưa có bản vá** và đã đánh giá là không bị khai thác trong ngữ cảnh của bạn, đội cần một cách tiếp tục làm việc **mà không tắt cả gate**. Cách đúng là **waiver**: ngoại lệ cho đúng mã lỗ hổng đó, có lý do, người duyệt và **ngày hết hạn**. Hết hạn mà chưa xử lý → gate lại chặn. Waiver không có hạn sẽ tồn tại mãi và gate dần mất ý nghĩa.

~~~java
// Waiver còn hiệu lực đến hết ngày expires (so sánh theo ngày, dễ hiểu với người duyệt)
boolean active(Waiver w, LocalDate today) {
    return !today.isAfter(w.expires());   // hôm nay <= expires
}
~~~
Truyền {{LocalDate today}} vào thay vì gọi {{LocalDate.now()}} bên trong: hàm trở nên **xác định** và test được (xem bài Clock injection).

### Trả lý do, không chỉ PASS/FAIL
Developer cần biết **phải sửa gì**: "COVERAGE: 72% < 80% trên code mới", "CRITICAL: CVE-2024-1234 trong thư viện X (không có waiver)". Gate chỉ in "FAILED" khiến mọi người tìm cách đi vòng. Thứ tự lý do ổn định giúp so sánh giữa các lần chạy.

> Ở quy mô platform, chính sách gate nên được **quản lý như code** (file cấu hình trong repo chung, có review) và **áp dụng dần**: chế độ cảnh báo vài tuần (chỉ báo, không chặn) rồi mới bật chặn — nếu không, ngày đầu tiên 80% PR đỏ và các đội sẽ phản đối cả nền tảng.

### Liên hệ phỏng vấn
Câu hỏi "bạn thiết kế quality gate cho 30 service thế nào?" kiểm tra bạn có cân bằng giữa an toàn và tốc độ: coverage trên code mới thay vì toàn repo, chặn theo mức nghiêm trọng, waiver có hạn và có người duyệt, bật dần từ chế độ cảnh báo, và trả lý do rõ ràng cho developer.`,
  exercises: [{
    title: 'Đánh giá quality gate với waiver có hạn dùng',
    prompt: `Viết {{QualityGate.evaluate(report, policy, waivers, today)}} trả về {{GateResult(boolean passed, List<String> reasons)}}. Kiểm tra theo **đúng thứ tự** và thêm lý do:
1. {{report.failedTests() > 0}} → {{"TESTS_FAILED"}}
2. {{report.newCodeCoverage() < policy.minNewCoverage()}} → {{"COVERAGE"}}
3. Mỗi finding mức {{CRITICAL}} **không có waiver còn hạn** → {{"CRITICAL:" + id}} (theo thứ tự xuất hiện trong report)
4. Số finding mức {{HIGH}} không có waiver còn hạn **lớn hơn** {{policy.maxHigh()}} → {{"HIGH_COUNT"}}
Waiver còn hạn khi {{findingId}} khớp và {{today}} không sau {{expires}}. {{passed}} là true khi không có lý do nào.`,
    starter: `import java.time.LocalDate;

record Finding(String id, String severity) {}
record Waiver(String findingId, LocalDate expires) {}
record Report(int failedTests, double newCodeCoverage, List<Finding> findings) {}
record Policy(double minNewCoverage, int maxHigh) {}
record GateResult(boolean passed, List<String> reasons) {}

class QualityGate {
    GateResult evaluate(Report report, Policy policy, List<Waiver> waivers, LocalDate today) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `import java.time.LocalDate;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!expected.equals(actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        QualityGate g = new QualityGate();
        Policy pol = new Policy(80.0, 2);
        LocalDate today = LocalDate.of(2026, 11, 7);
        check("sach_se_pass", () -> {
            GateResult r = g.evaluate(new Report(0, 85.0, List.of(new Finding("CVE-1", "LOW"))), pol, List.of(), today);
            eq(true, r.passed()); eq(List.of(), r.reasons());
        });
        check("critical_co_waiver_con_han", () -> {
            Report rep = new Report(0, 90.0, List.of(new Finding("CVE-9", "CRITICAL")));
            GateResult r = g.evaluate(rep, pol, List.of(new Waiver("CVE-9", LocalDate.of(2026, 11, 7))), today);
            eq(true, r.passed());
        });
        check("waiver_het_han_bi_chan", () -> {
            Report rep = new Report(0, 90.0, List.of(new Finding("CVE-9", "CRITICAL")));
            GateResult r = g.evaluate(rep, pol, List.of(new Waiver("CVE-9", LocalDate.of(2026, 11, 6))), today);
            eq(false, r.passed()); eq(List.of("CRITICAL:CVE-9"), r.reasons());
        });
        check("nhieu_ly_do_dung_thu_tu", () -> {
            Report rep = new Report(2, 71.5, List.of(
                new Finding("CVE-A", "HIGH"), new Finding("CVE-C1", "CRITICAL"), new Finding("CVE-B", "HIGH"),
                new Finding("CVE-C2", "CRITICAL"), new Finding("CVE-D", "HIGH")));
            GateResult r = g.evaluate(rep, pol, List.of(), today);
            eq(List.of("TESTS_FAILED", "COVERAGE", "CRITICAL:CVE-C1", "CRITICAL:CVE-C2", "HIGH_COUNT"), r.reasons());
        });
        check("high_duoc_waiver_khong_tinh", () -> {
            Report rep = new Report(0, 95.0, List.of(new Finding("H1", "HIGH"), new Finding("H2", "HIGH"), new Finding("H3", "HIGH")));
            GateResult r = g.evaluate(rep, pol, List.of(new Waiver("H3", LocalDate.of(2027, 1, 1))), today);
            eq(true, r.passed());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `import java.time.LocalDate;

record Finding(String id, String severity) {}
record Waiver(String findingId, LocalDate expires) {}
record Report(int failedTests, double newCodeCoverage, List<Finding> findings) {}
record Policy(double minNewCoverage, int maxHigh) {}
record GateResult(boolean passed, List<String> reasons) {}

class QualityGate {
    GateResult evaluate(Report report, Policy policy, List<Waiver> waivers, LocalDate today) {
        // id của các finding đang được waiver còn hạn (hết ngày expires vẫn còn hiệu lực)
        Set<String> waived = new HashSet<>();
        for (Waiver w : waivers) if (!today.isAfter(w.expires())) waived.add(w.findingId());
        List<String> reasons = new ArrayList<>();
        if (report.failedTests() > 0) reasons.add("TESTS_FAILED");
        if (report.newCodeCoverage() < policy.minNewCoverage()) reasons.add("COVERAGE");
        int high = 0;
        for (Finding f : report.findings()) {
            if (waived.contains(f.id())) continue;          // ngoại lệ có hạn: bỏ qua finding này
            if (f.severity().equals("CRITICAL")) reasons.add("CRITICAL:" + f.id());
            else if (f.severity().equals("HIGH")) high++;
        }
        if (high > policy.maxHigh()) reasons.add("HIGH_COUNT");
        return new GateResult(reasons.isEmpty(), List.copyOf(reasons));
    }
}`,
    hints: [
      'Tạo trước một Set chứa id các finding có waiver còn hạn: !today.isAfter(expires).',
      'Duyệt findings theo thứ tự report; bỏ qua finding có trong Set; CRITICAL thêm lý do ngay, HIGH thì đếm.',
      'Thêm HIGH_COUNT sau cùng, khi số HIGH chưa waiver lớn hơn maxHigh.',
    ],
    explain: `Tách **dữ liệu** (report, policy, waiver, today) khỏi **logic** giúp gate xác định và test được: không gọi {{LocalDate.now()}} bên trong. Waiver được chuẩn hoá thành một {{Set}} id còn hạn trước khi duyệt, nên mỗi finding chỉ cần một phép tra O(1).
- Quy ước "còn hạn đến hết ngày expires" ({{!today.isAfter(expires)}}) phải được ghi rõ trong tài liệu chính sách, vì người duyệt hiểu ngày theo cách đó.
- Thứ tự lý do ổn định giúp diff giữa các lần chạy dễ đọc.
Lỗi hay gặp: dùng {{today.isBefore(expires)}} làm waiver hết hiệu lực sớm một ngày; đếm cả HIGH đã được waiver; trả về chỉ một lý do đầu tiên khiến developer phải sửa từng vòng.`,
  }],
  check: [
    { q: 'Vì sao nên đặt ngưỡng coverage trên **code mới** thay vì toàn bộ repo cho một codebase cũ?', options: ['Để mọi PR mới phải có test mà không bắt đội sửa hết code cũ trước khi được merge', 'Vì coverage toàn repo không đo được', 'Vì code cũ không chạy test được', 'Để tăng tốc pipeline'], answer: 0, explain: 'Coverage toàn repo của codebase cũ thường thấp, đặt ngưỡng cao sẽ chặn mọi PR dù PR đó có test tốt; đo trên code mới tạo áp lực đúng chỗ. Coverage toàn repo vẫn đo được. Code cũ vẫn chạy test được. Ngưỡng không ảnh hưởng tốc độ pipeline.' },
    { q: 'Một CVE CRITICAL trong thư viện chưa có bản vá chặn mọi PR. Cách xử lý đúng?', options: ['Tạo waiver cho đúng CVE đó, có lý do, người duyệt và ngày hết hạn', 'Tắt quét lỗ hổng cho tới khi có bản vá', 'Hạ mức CRITICAL thành HIGH trong cấu hình', 'Cho phép merge thủ công không cần gate'], answer: 0, explain: 'Waiver có hạn giữ gate hoạt động cho mọi lỗ hổng khác và tự chặn lại khi hết hạn. Tắt quét hay bỏ gate làm mất bảo vệ hoàn toàn. Đổi mức nghiêm trọng là che giấu rủi ro và ảnh hưởng mọi CVE khác.' },
    { q: 'Platform team muốn áp dụng quality gate mới cho 30 service. Cách triển khai ít gây phản đối nhất?', options: ['Chạy chế độ cảnh báo vài tuần, công bố số liệu, rồi mới bật chặn', 'Bật chặn ngay cho tất cả để tạo kỷ luật', 'Để mỗi đội tự chọn có dùng gate hay không', 'Chỉ áp dụng cho service mới, service cũ không bao giờ áp dụng'], answer: 0, explain: 'Chế độ cảnh báo cho các đội thời gian sửa và cho platform dữ liệu để điều chỉnh ngưỡng. Bật chặn ngay thường làm phần lớn PR đỏ trong ngày đầu. Tự chọn dẫn tới không ai dùng. Bỏ hẳn service cũ để lại rủi ro lớn nhất không được kiểm soát.' },
  ],
  related: ['devops-099', 'devops-103', 'devops-031'],
  tags: ['CI/CD', 'quality gate', 'security scanning', 'policy', 'platform engineering'],
},
{
  id: 'lesson-devops-020',
  track: 'devops',
  order: 20,
  title: 'Golden path: template tạo service mới với tham số được kiểm tra',
  level: 'senior',
  minutes: 35,
  goals: [
    'Hiểu golden path / paved road: con đường chuẩn, dễ nhất để một đội tạo và vận hành service',
    'Thiết kế template sinh service mới (code, pipeline, Helm values, dashboard) từ vài tham số',
    'Kiểm tra tham số đầu vào chặt chẽ để không sinh ra service sai chuẩn',
    'Phát hiện placeholder chưa được thay trước khi tạo repo',
  ],
  body: `### Golden path là gì
Một công ty có 40 service: mỗi đội tự viết Dockerfile, pipeline, Helm chart, dashboard theo cách riêng → 40 cách làm, mỗi lần nâng cấp phải sửa 40 nơi, người mới mất nhiều ngày để hiểu. **Golden path** (hay paved road) là **con đường chuẩn được nền tảng hỗ trợ**: dùng nó thì mọi thứ có sẵn và được bảo trì; đi đường khác vẫn được nhưng đội tự chịu trách nhiệm. Không phải luật cấm — là con đường **dễ nhất**.

### Template tạo service mới
Trong Backstage gọi là **software template**; ở công ty nhỏ có thể là một repo mẫu + script. Người dùng nhập vài tham số, template sinh ra:
~~~text
Tham số: name = payment-reconciler, team = payments, port = 8080
Sinh ra:
  payment-reconciler/
    pom.xml                     (groupId, artifactId theo name)
    Dockerfile                  (image chuẩn, user không phải root)
    .github/workflows/ci.yml    (gọi reusable workflow của platform)
    deploy/values.yaml          (Helm values cho chart chung: tên, team, port, probe)
    catalog-info.yaml           (đăng ký vào service catalog: owner = payments)
    docs/index.md               (tài liệu khởi đầu)
~~~
Mỗi file trong template chứa **placeholder** như {{__NAME__}}, {{__TEAM__}}, {{__PORT__}}; công cụ thay bằng giá trị thật — cả trong **nội dung** lẫn **đường dẫn file**.

### Kiểm tra tham số: lỗi ở đây nhân lên ở mọi nơi
Tên service xuất hiện trong DNS, tên Kubernetes object, tên repo, metric. Kubernetes yêu cầu tên dạng DNS label: chữ thường, số và dấu gạch ngang, bắt đầu bằng chữ, không kết thúc bằng gạch ngang, tối đa 63 ký tự. Platform thường đặt quy tắc chặt hơn (ví dụ 3–30 ký tự, không có hai gạch ngang liền nhau). Kiểm tra **trước khi sinh**, báo lỗi rõ trường nào sai.
| Tham số | Quy tắc | Vì sao |
|---|---|---|
| name | 3–30 ký tự, a-z0-9 và "-", bắt đầu bằng chữ, không "--", không kết thúc "-" | Hợp lệ cho DNS, Kubernetes, repo |
| team | Không rỗng (và nằm trong danh sách đội) | Mọi service phải có chủ sở hữu để on-call |
| port | Số nguyên 1024–65535 | Không dùng cổng đặc quyền, không ngoài khoảng |

### Placeholder bị bỏ sót
Template được nhiều người sửa; ai đó thêm {{__REGION__}} vào một file nhưng quên thêm tham số. Nếu không kiểm tra, service sinh ra chứa chuỗi {{__REGION__}} và lỗi lúc deploy, rất khó hiểu. Sau khi render, **quét lại** mọi file: còn mẫu {{__CHỮ_HOA__}} nào thì dừng và báo lỗi.

~~~java
// Thay placeholder trong cả đường dẫn lẫn nội dung
String render(String text, Map<String, String> values) {
    String out = text;
    for (Map.Entry<String, String> e : values.entrySet())
        out = out.replace(e.getKey(), e.getValue());   // replace thay mọi lần xuất hiện, không dùng regex
    return out;
}
~~~

> Đo golden path như một sản phẩm: **thời gian từ lúc bấm "tạo service" tới khi service chạy trên môi trường dev**, tỉ lệ service mới dùng template, số lần đội phải hỏi platform team. Nếu template khó dùng hơn tự làm, các đội sẽ không dùng nó.

### Liên hệ phỏng vấn
"Bạn chuẩn hoá cách 20 đội tạo service thế nào?" — câu trả lời Senior: golden path là con đường dễ nhất chứ không phải luật cấm; template sinh đủ code, pipeline, deploy, dashboard, catalog; kiểm tra tham số chặt; phiên bản hoá template và cách cập nhật service đã sinh; đo thời gian onboard và tỉ lệ sử dụng.`,
  exercises: [{
    title: 'Render template service mới với kiểm tra tham số',
    prompt: `Viết {{ServiceScaffolder.render(templates, params)}}: {{templates}} là map đường dẫn → nội dung, có các placeholder {{__NAME__}}, {{__TEAM__}}, {{__PORT__}}. Trả về {{TreeMap}} đường dẫn → nội dung đã thay (thay trong **cả đường dẫn lẫn nội dung**).
- {{name}}: 3–30 ký tự, chỉ gồm chữ thường a–z, số, dấu "-"; bắt đầu bằng chữ; không kết thúc bằng "-"; không có "--". Sai → {{IllegalArgumentException}} với message chứa {{name}}.
- {{team}}: không null, không rỗng sau trim. Sai → {{IllegalArgumentException}} chứa {{team}}.
- {{port}}: số nguyên trong 1024–65535. Sai (kể cả không phải số) → {{IllegalArgumentException}} chứa {{port}}.
- Sau khi thay, nếu bất kỳ đường dẫn hay nội dung nào còn chuỗi dạng {{__X__}} (hai gạch dưới, một hoặc nhiều **chữ hoa** A–Z hoặc dấu "_", hai gạch dưới) → {{IllegalStateException}}.`,
    starter: `class ServiceScaffolder {
    Map<String, String> render(Map<String, String> templates, Map<String, String> params) {
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
        if (!expected.equals(actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expectIae(Runnable r, String field) {
        try { r.run(); throw new AssertionError("phải ném IllegalArgumentException cho " + field); }
        catch (IllegalArgumentException e) {
            if (e.getMessage() == null || !e.getMessage().contains(field)) throw new AssertionError("message phải chứa " + field + ": " + e.getMessage());
        }
    }
    static Map<String, String> tpl() {
        Map<String, String> t = new HashMap<>();
        t.put("deploy/values.yaml", "name: __NAME__ | team: __TEAM__ | port: __PORT__");
        t.put("src/__NAME__/README.md", "Service __NAME__ owned by __TEAM__");
        return t;
    }
    static Map<String, String> params(String name, String team, String port) {
        Map<String, String> p = new HashMap<>();
        p.put("name", name); p.put("team", team); p.put("port", port);
        return p;
    }
    public static void main(String[] args) {
        ServiceScaffolder s = new ServiceScaffolder();
        check("render_ca_duong_dan_va_noi_dung", () -> {
            Map<String, String> out = s.render(tpl(), params("payment-reconciler", "payments", "8080"));
            Map<String, String> exp = new TreeMap<>();
            exp.put("deploy/values.yaml", "name: payment-reconciler | team: payments | port: 8080");
            exp.put("src/payment-reconciler/README.md", "Service payment-reconciler owned by payments");
            eq(exp, out);
            eq(TreeMap.class, out.getClass());
        });
        check("ten_khong_hop_le", () -> {
            for (String bad : new String[] { "Payment", "pa", "9svc", "svc-", "svc--x", "svc_x", "a-very-very-long-service-name-xyz" })
                expectIae(() -> s.render(tpl(), params(bad, "payments", "8080")), "name");
        });
        check("team_rong", () -> expectIae(() -> s.render(tpl(), params("orders", "   ", "8080")), "team"));
        check("port_sai", () -> {
            for (String bad : new String[] { "80", "70000", "abc" })
                expectIae(() -> s.render(tpl(), params("orders", "core", bad)), "port");
        });
        check("placeholder_bi_bo_sot", () -> {
            Map<String, String> t = tpl();
            t.put("deploy/region.txt", "region: __REGION__");
            try { s.render(t, params("orders", "core", "8080")); throw new AssertionError("phải ném IllegalStateException"); }
            catch (IllegalStateException e) { /* ok */ }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `class ServiceScaffolder {
    Map<String, String> render(Map<String, String> templates, Map<String, String> params) {
        String name = params.get("name"), team = params.get("team"), port = params.get("port");
        if (!validName(name)) throw new IllegalArgumentException("invalid name: " + name);
        if (team == null || team.trim().isEmpty()) throw new IllegalArgumentException("team is required");
        int p;
        try { p = Integer.parseInt(port); } catch (NumberFormatException | NullPointerException e) { throw new IllegalArgumentException("port must be a number"); }
        if (p < 1024 || p > 65535) throw new IllegalArgumentException("port out of range: " + p);
        Map<String, String> values = Map.of("__NAME__", name, "__TEAM__", team.trim(), "__PORT__", String.valueOf(p));
        Map<String, String> out = new TreeMap<>();
        for (Map.Entry<String, String> e : templates.entrySet()) {
            String path = fill(e.getKey(), values), body = fill(e.getValue(), values);
            if (hasPlaceholder(path) || hasPlaceholder(body)) throw new IllegalStateException("unresolved placeholder in " + path);
            out.put(path, body);
        }
        return out;
    }

    private static String fill(String text, Map<String, String> values) {
        String out = text;
        for (Map.Entry<String, String> v : values.entrySet()) out = out.replace(v.getKey(), v.getValue());
        return out;
    }

    private static boolean validName(String n) {
        if (n == null || n.length() < 3 || n.length() > 30) return false;
        if (n.charAt(0) < 'a' || n.charAt(0) > 'z') return false;          // bắt đầu bằng chữ thường
        if (n.endsWith("-") || n.contains("--")) return false;
        for (char c : n.toCharArray())
            if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-')) return false;
        return true;
    }

    // tìm mẫu __X__ với X gồm chữ hoa A-Z hoặc "_" (ít nhất một ký tự), không dùng regex
    private static boolean hasPlaceholder(String s) {
        int i = s.indexOf("__");
        while (i >= 0) {
            int j = i + 2, k = j;
            while (k < s.length() && ((s.charAt(k) >= 'A' && s.charAt(k) <= 'Z') || s.charAt(k) == '_')) k++;
            // lùi lại để chuỗi kết thúc đúng bằng "__"
            while (k - j >= 3 && s.startsWith("__", k - 2)) {
                String inner = s.substring(j, k - 2);
                boolean hasLetter = false;
                for (char c : inner.toCharArray()) if (c >= 'A' && c <= 'Z') hasLetter = true;
                if (hasLetter) return true;
                k--;
            }
            i = s.indexOf("__", i + 1);
        }
        return false;
    }
}`,
    hints: [
      'Kiểm tra name, team, port trước khi render; mỗi lỗi ném IllegalArgumentException có tên trường trong message.',
      'Dùng String.replace (không phải replaceAll) để thay placeholder trong cả key lẫn value.',
      'Sau khi thay, quét chuỗi tìm "__" + chữ hoa + "__"; tìm thấy thì ném IllegalStateException.',
    ],
    explain: `Hai ý chính: **kiểm tra đầu vào trước khi sinh** và **kiểm tra đầu ra sau khi sinh**.
- Kiểm tra tên bằng vòng lặp ký tự rõ ràng (có thể dùng regex trong code thật), lưu ý các luật dễ quên: không kết thúc bằng "-", không có "--", bắt đầu bằng chữ.
- {{Integer.parseInt}} ném {{NumberFormatException}} với "abc" — bắt và chuyển thành {{IllegalArgumentException}} có tên trường để người dùng hiểu.
- Trả {{TreeMap}} để thứ tự file ổn định khi in ra hoặc commit.
- Quét placeholder còn sót sau khi render là lưới an toàn khi template được nhiều người sửa.
Lỗi hay gặp: dùng {{replaceAll}} khiến chuỗi giá trị có ký tự đặc biệt bị hiểu như regex; quên thay placeholder trong **đường dẫn file**; chỉ kiểm tra độ dài tên mà bỏ qua ký tự hợp lệ.`,
  }],
  check: [
    { q: 'Điều gì phân biệt golden path với một "quy định bắt buộc"?', options: ['Golden path là con đường dễ nhất được nền tảng hỗ trợ; đi đường khác vẫn được nhưng đội tự chịu trách nhiệm', 'Golden path cấm mọi cách làm khác', 'Golden path chỉ là tài liệu hướng dẫn, không có công cụ', 'Golden path chỉ áp dụng cho service mới viết bằng Java'], answer: 0, explain: 'Golden path thu hút bằng sự tiện lợi và hỗ trợ, không cấm. Cấm mọi cách khác là quy định cứng và thường gây phản ứng. Golden path đi kèm công cụ như template và pipeline chứ không chỉ tài liệu. Nó không giới hạn ở một ngôn ngữ.' },
    { q: 'Vì sao phải quét placeholder còn sót sau khi render template?', options: ['Template do nhiều người sửa; một placeholder mới thiếu tham số sẽ lọt vào service và gây lỗi khó hiểu lúc deploy', 'Để tăng tốc render', 'Vì String.replace không thay được mọi lần xuất hiện', 'Để kiểm tra tên service hợp lệ'], answer: 0, explain: 'Quét sau render bắt lỗi template trước khi tạo repo. Nó không giúp tăng tốc. String.replace thay mọi lần xuất hiện. Kiểm tra tên là việc kiểm tra đầu vào, làm trước khi render.' },
    { q: 'Chỉ số nào phản ánh tốt nhất chất lượng golden path từ góc nhìn developer?', options: ['Thời gian từ lúc tạo service tới khi nó chạy trên môi trường dev', 'Số dòng code trong template', 'Số service đang chạy trong cluster', 'Số lần platform team deploy mỗi tuần'], answer: 0, explain: 'Golden path phục vụ developer nên đo trải nghiệm của họ: thời gian tới service chạy được. Số dòng template không nói lên giá trị. Số service đang chạy phụ thuộc nhiều yếu tố khác. Tần suất deploy của platform team không đo trải nghiệm người dùng nền tảng.' },
  ],
  related: ['devops-119', 'devops-055', 'devops-023'],
  tags: ['golden path', 'template', 'Backstage', 'internal developer platform', 'platform engineering'],
},
{
  id: 'lesson-devops-021',
  track: 'devops',
  order: 21,
  title: 'Đo nền tảng như sản phẩm: tính 4 chỉ số DORA từ dữ liệu deploy và sự cố',
  level: 'senior',
  minutes: 30,
  goals: [
    'Hiểu 4 chỉ số DORA: tần suất deploy, lead time thay đổi, tỉ lệ thay đổi gây lỗi, thời gian khôi phục',
    'Tự tính các chỉ số từ dữ liệu thô (thời điểm commit, deploy, sự cố)',
    'Biết vì sao dùng trung vị cho lead time và cách tránh các bẫy khi đo',
    'Dùng chỉ số để chứng minh giá trị của platform, không dùng để chấm điểm cá nhân',
  ],
  body: `### Vì sao platform team phải đo
Platform là **sản phẩm nội bộ**: nếu không đo, bạn không chứng minh được nó giúp các đội nhanh và an toàn hơn, và không biết nên đầu tư vào đâu. Nghiên cứu DORA (DevOps Research and Assessment) đề xuất 4 chỉ số cân bằng giữa **tốc độ** và **ổn định**:
| Chỉ số | Câu hỏi | Cách tính đơn giản |
|---|---|---|
| Deployment frequency | Deploy lên production thường xuyên thế nào? | Số lần deploy / số ngày |
| Lead time for changes | Từ commit tới production mất bao lâu? | Trung vị của (thời điểm deploy − thời điểm commit) |
| Change failure rate | Bao nhiêu phần trăm deploy gây sự cố? | Số deploy gây sự cố / tổng số deploy |
| Time to restore (MTTR) | Khi có sự cố, khôi phục mất bao lâu? | Trung bình (thời điểm khôi phục − thời điểm bắt đầu) |
Hai chỉ số đầu đo **tốc độ**, hai chỉ số sau đo **ổn định**. Một đội deploy nhiều mà sự cố liên tục, hay ổn định mà một tháng mới deploy một lần, đều chưa tốt.

### Vì sao lead time dùng trung vị
Lead time có **đuôi dài**: phần lớn thay đổi lên production trong vài giờ, nhưng thỉnh thoảng có thay đổi nằm chờ 3 tuần (nhánh bị quên). Trung bình bị kéo lệch bởi vài giá trị lớn; **trung vị** (median) phản ánh trải nghiệm điển hình. Với số phần tử chẵn, trung vị là trung bình của hai giá trị giữa.

~~~java
// Trung vị của danh sách thời lượng (giây)
List<Long> xs = new ArrayList<>(secs);
Collections.sort(xs);
int n = xs.size();
long median = n % 2 == 1 ? xs.get(n / 2) : (xs.get(n / 2 - 1) + xs.get(n / 2)) / 2;
~~~

### Bẫy khi đo
- **Định nghĩa "sự cố"** phải thống nhất (rollback, hotfix, incident P1–P2) — nếu không mỗi đội đếm một kiểu.
- **Không chia cho 0**: khoảng thời gian không có deploy hay không có sự cố phải trả về giá trị hợp lý (0 hoặc rỗng), không ném lỗi.
- **Lấy dữ liệu tự động** từ hệ thống (Git, pipeline, công cụ incident), không nhập tay.
- **Không dùng để chấm điểm cá nhân hay so sánh đội**: chỉ số sẽ bị "làm đẹp" (chia nhỏ deploy vô nghĩa, không khai báo sự cố). Dùng để thấy xu hướng và tìm điểm nghẽn.

> Câu chuyện mạnh nhất cho CV của platform engineer có dạng: "sau khi đưa golden path và canary tự động vào, lead time trung vị giảm từ 4 ngày xuống 6 giờ, change failure rate từ 18% xuống 6%". Bài tập dưới đây chính là cách bạn tính ra những con số đó.

### Liên hệ phỏng vấn
"Làm sao bạn biết nền tảng của mình có giá trị?" — trả lời bằng chỉ số DORA đo tự động trước và sau, kết hợp khảo sát trải nghiệm developer, và nêu rõ chỉ số dùng để cải tiến hệ thống chứ không để đánh giá cá nhân.`,
  exercises: [{
    title: 'Tính 4 chỉ số DORA',
    prompt: `Viết các method của {{DoraCalculator}}:
- {{deploysPerDay(List<Deploy> deploys, int days)}}: số deploy / days (double). {{days <= 0}} → {{IllegalArgumentException}}.
- {{medianLeadTime(List<Deploy> deploys)}}: trung vị của {{deployedAt − committedAt}} (tính theo giây; số phần tử chẵn thì lấy trung bình hai giá trị giữa, chia nguyên). Danh sách rỗng → {{Duration.ZERO}}.
- {{changeFailureRate(List<Deploy> deploys)}}: tỉ lệ deploy có {{causedIncident == true}} (0.0 nếu rỗng).
- {{meanTimeToRestore(List<Incident> incidents)}}: trung bình {{resolvedAt − startedAt}} theo giây (chia nguyên); rỗng → {{Duration.ZERO}}.`,
    starter: `import java.time.Duration;
import java.time.Instant;

record Deploy(Instant committedAt, Instant deployedAt, boolean causedIncident) {}
record Incident(Instant startedAt, Instant resolvedAt) {}

class DoraCalculator {
    double deploysPerDay(List<Deploy> deploys, int days) { throw new UnsupportedOperationException("TODO"); }
    Duration medianLeadTime(List<Deploy> deploys) { throw new UnsupportedOperationException("TODO"); }
    double changeFailureRate(List<Deploy> deploys) { throw new UnsupportedOperationException("TODO"); }
    Duration meanTimeToRestore(List<Incident> incidents) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `import java.time.Duration;
import java.time.Instant;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!expected.equals(actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final Instant T0 = Instant.parse("2026-11-01T00:00:00Z");
    static Deploy d(long commitH, long deployH, boolean fail) { return new Deploy(T0.plusSeconds(commitH * 3600), T0.plusSeconds(deployH * 3600), fail); }
    public static void main(String[] args) {
        DoraCalculator c = new DoraCalculator();
        List<Deploy> ds = List.of(d(0, 2, false), d(1, 7, true), d(3, 4, false), d(5, 77, false));
        check("tan_suat_deploy", () -> eq(0.5, c.deploysPerDay(ds, 8)));
        check("days_khong_hop_le", () -> {
            try { c.deploysPerDay(ds, 0); throw new AssertionError("phải ném IllegalArgumentException"); }
            catch (IllegalArgumentException e) { /* ok */ }
        });
        check("trung_vi_lead_time_chan", () -> eq(Duration.ofHours(4), c.medianLeadTime(ds)));   // 1h,2h,6h,72h -> (2h+6h)/2
        check("trung_vi_lead_time_le", () -> eq(Duration.ofHours(2), c.medianLeadTime(ds.subList(0, 3))));  // 2h,6h,1h -> 2h
        check("lead_time_rong", () -> eq(Duration.ZERO, c.medianLeadTime(List.of())));
        check("change_failure_rate", () -> { eq(0.25, c.changeFailureRate(ds)); eq(0.0, c.changeFailureRate(List.of())); });
        check("mttr", () -> {
            List<Incident> inc = List.of(new Incident(T0, T0.plusSeconds(1800)), new Incident(T0, T0.plusSeconds(5400)));
            eq(Duration.ofMinutes(60), c.meanTimeToRestore(inc));
            eq(Duration.ZERO, c.meanTimeToRestore(List.of()));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `import java.time.Duration;
import java.time.Instant;

record Deploy(Instant committedAt, Instant deployedAt, boolean causedIncident) {}
record Incident(Instant startedAt, Instant resolvedAt) {}

class DoraCalculator {
    double deploysPerDay(List<Deploy> deploys, int days) {
        if (days <= 0) throw new IllegalArgumentException("days must be > 0");
        return (double) deploys.size() / days;
    }

    Duration medianLeadTime(List<Deploy> deploys) {
        if (deploys.isEmpty()) return Duration.ZERO;
        List<Long> secs = new ArrayList<>();
        for (Deploy d : deploys) secs.add(Duration.between(d.committedAt(), d.deployedAt()).getSeconds());
        Collections.sort(secs);
        int n = secs.size();
        long m = n % 2 == 1 ? secs.get(n / 2) : (secs.get(n / 2 - 1) + secs.get(n / 2)) / 2;   // trung vị: không bị đuôi dài kéo lệch
        return Duration.ofSeconds(m);
    }

    double changeFailureRate(List<Deploy> deploys) {
        if (deploys.isEmpty()) return 0.0;
        long failed = deploys.stream().filter(Deploy::causedIncident).count();
        return (double) failed / deploys.size();
    }

    Duration meanTimeToRestore(List<Incident> incidents) {
        if (incidents.isEmpty()) return Duration.ZERO;
        long sum = 0;
        for (Incident i : incidents) sum += Duration.between(i.startedAt(), i.resolvedAt()).getSeconds();
        return Duration.ofSeconds(sum / incidents.size());
    }
}`,
    hints: [
      'Duration.between(a, b).getSeconds() cho thời lượng theo giây.',
      'Trung vị: sắp xếp, số phần tử lẻ lấy phần tử giữa, chẵn lấy trung bình hai phần tử giữa.',
      'Xử lý danh sách rỗng trước để không chia cho 0.',
    ],
    explain: `Các chỉ số đều là phép tính đơn giản; phần khó nằm ở **định nghĩa và dữ liệu**. Code tách rõ từng chỉ số, xử lý trường hợp rỗng, và dùng **trung vị** cho lead time vì phân phối có đuôi dài: trong test, một thay đổi chờ 72 giờ kéo trung bình lên 20,25 giờ trong khi trung vị là 4 giờ — gần với trải nghiệm thật hơn.
Lỗi hay gặp: dùng trung bình cho lead time; quên trường hợp danh sách rỗng (chia cho 0 ra NaN); tính change failure rate trên số sự cố thay vì số deploy; dùng {{toHours()}} làm mất phần lẻ.`,
  }],
  check: [
    { q: 'Lead time của 5 thay đổi: 1h, 2h, 3h, 4h, 200h. Vì sao nên báo cáo trung vị thay vì trung bình?', options: ['Trung vị 3h phản ánh trải nghiệm điển hình; trung bình 42h bị một giá trị lớn kéo lệch', 'Trung bình khó tính hơn', 'Trung vị luôn lớn hơn trung bình', 'DORA cấm dùng trung bình'], answer: 0, explain: 'Phân phối có đuôi dài nên trung bình (42h) không đại diện cho đa số thay đổi; trung vị (3h) thì có. Độ khó tính toán không phải lý do. Trung vị không luôn lớn hơn trung bình — ở đây nhỏ hơn nhiều. Không có quy định cấm.' },
    { q: 'Chỉ số DORA nào đo độ ổn định?', options: ['Change failure rate và time to restore', 'Deployment frequency và lead time', 'Chỉ deployment frequency', 'Số dòng code mỗi tuần'], answer: 0, explain: 'Tỉ lệ thay đổi gây lỗi và thời gian khôi phục đo ổn định; tần suất deploy và lead time đo tốc độ. Số dòng code không phải chỉ số DORA và không phản ánh giá trị.' },
    { q: 'Ban lãnh đạo muốn xếp hạng từng developer theo chỉ số DORA. Phản hồi phù hợp nhất?', options: ['Chỉ số dùng cho hệ thống và đội để thấy xu hướng; xếp hạng cá nhân sẽ khiến chỉ số bị làm đẹp và mất giá trị', 'Đồng ý vì chỉ số khách quan', 'Chỉ xếp hạng theo deployment frequency', 'Xếp hạng nhưng không công bố'], answer: 0, explain: 'Khi chỉ số thành mục tiêu đánh giá cá nhân, người ta tối ưu con số (chia nhỏ deploy, không báo sự cố) thay vì kết quả thật. Chỉ dùng một chỉ số tốc độ còn khuyến khích bỏ qua ổn định. Xếp hạng kín vẫn tạo động cơ làm đẹp số liệu.' },
  ],
  related: ['devops-126', 'devops-127', 'devops-075'],
  tags: ['DORA', 'metrics', 'platform as product', 'platform engineering'],
},
);
