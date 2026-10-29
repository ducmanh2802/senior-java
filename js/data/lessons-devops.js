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
);
